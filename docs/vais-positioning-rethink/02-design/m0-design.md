---
owner: cto
artifact: m0-design
phase: design
feature: vais-positioning-rethink
---

# M0 Design — Ideation Continuity Architecture

> Hook 재활용 + status 스키마 확장 + LLM 휴리스틱 spec. 신규 hook 0 개.

## §1. Hook 매핑 — 기존 활용

### 현재 Claude Code hook events (확인됨)

| Event | 트리거 | 현재 사용 |
|-------|--------|---------|
| `SessionStart` | 새 세션 시작 | `hooks/session-start.js` |
| `Stop` | assistant turn 종료 | `scripts/stop-handler.js` |
| `PreToolUse` | 도구 호출 직전 | bash-guard, design-mcp-trigger |
| `PostToolUse` | 도구 호출 직후 | doc-tracker, ideation-guard |
| `SubagentStart/Stop` | sub-agent 시작/종료 | agent-start, agent-stop |
| `UserPromptSubmit` | 사용자 프롬프트 제출 | 미사용 (M0-③ 후보) |

### M0 메커니즘 → Hook 매핑

| M0 메커니즘 | Hook | 변경 사항 |
|------------|------|---------|
| ① working-notes 자동 누적 | `Stop` (기존 stop-handler.js) | LLM 휴리스틱 + fs append 로직 추가 |
| ② Decision Record append | `Stop` (기존 stop-handler.js) | 결정 키워드 감지 + main.md 표 append 로직 추가 |
| ③ "체크포인트" 키워드 | `UserPromptSubmit` (신규 핸들러) | 키워드 감지 + 부분 정리 출력 |
| ④ session-start 자동 복원 | `SessionStart` (기존 session-start.js) | in-progress ideation 감지 + 5 줄 요약 + AskUserQuestion |

### 핵심 발견

> **신규 hook 신설 0 개**. 기존 4 개 hook 핸들러 (stop-handler / session-start.js) 확장 + 1 개 신규 핸들러 (UserPromptSubmit 용, M0-③ 만)만 추가. hooks.json 변경은 1 줄 (UserPromptSubmit 등록).

## §2. .vais/status.json 스키마 확장

### 현재 스키마

```json
{
  "version": 3,
  "activeFeature": "vais-positioning-rethink",
  "features": {
    "{feature}": {
      "createdAt": "ISO-8601",
      "currentPhase": "ideation|plan|design|do|qa|report",
      "phases": { ... },
      "rolePhases": { ... },
      "fsmState": { ... }
    }
  }
}
```

### 추가 필드 (`features.{feature}.ideation`)

```json
{
  "ideation": {
    "inProgress": true,
    "lastTurn": 17,
    "workingNotesPath": "docs/{feature}/00-ideation/working-notes.md",
    "mainMdPath": "docs/{feature}/00-ideation/main.md",
    "lastUpdated": "2026-05-09T15:23:00.000Z"
  }
}
```

### 마이그레이션 정책

- **기존 features**: `ideation` 필드 부재 → no-op. 해당 feature 가 ideation phase 진입 시 lazy populate
- **신규 features**: ideation phase 시작 시 자동 생성 (createdAt 과 같이)
- **종료**: ideation 종료 (루틴 A or B) 시 `inProgress: false` 로 변경 후 다른 필드 보존 (이력)
- **status.json 의 `version`**: 3 그대로 유지 (BC compatible — 추가 필드만, 제거 X)

### 읽기/쓰기 위치

- 읽기: `lib/memory.js` 의 `readStatus()` (기존)
- 쓰기: 동일. atomic write (기존 패턴 유지)

## §3. LLM 휴리스틱 spec — turn 가치 판단

### 입력 / 출력

```
Input:
  - assistantTurnText: 최근 assistant turn 의 응답 본문
  - userTurnText: 직전 user prompt
  - workingNotesPath: 현재 working-notes.md 경로 (마지막 3 entry 컨텍스트로 사용 가능)

Output:
  - decision: "KEPT" | "SKIP"
  - if KEPT:
      summary: 1~3 줄 요약 (Markdown bullet 형식)
      decisionKeywords: ["결정", "확정", ...] (있으면 — Decision Record 도 append 트리거)
```

### 판단 기준 (system prompt 일부)

```
KEPT 기준 (다음 중 하나라도 해당):
  - 결정 사항 (확정·합의·반대·재논의 등)
  - 새 정보 (외부 reference / 새 가설 / 미지의 차원)
  - 미해결 질문 (Open Question 후보)
  - C-Level 페르소나 충돌 / 주요 trade-off

SKIP 기준 (다음 모두 해당):
  - 단순 yes/no 확인
  - 명확화 질문 (이미 결정된 사항 다시 묻기)
  - 도구 호출 결과 단순 보고 (commit hash, file size 등)
```

### 모델 + 비용

- **모델**: `claude-haiku-4-5-20251001` (cost-efficient, 빠름)
- **prompt**: ~100 토큰 (system + user input)
- **response**: ~30 토큰 (KEPT 시 summary 포함)
- **turn 당 비용**: ~130 토큰 (Haiku 기준 ~$0.0001 미만)
- **session 당 추정** (50 turn): ~6500 토큰 (~$0.005)

### Fallback (LLM 호출 실패)

- 네트워크 에러 / API rate limit / timeout (3s) → **default SKIP**
- 이유: under-record 가 over-record 보다 안전 (휘발 위험 1 회 vs 노이즈 누적)
- 사용자 명시 "체크포인트" (M0-③) 로 보완 가능

## §4. M0-② Decision Record append — 트리거 + 형식

### 트리거 조건 (LLM 휴리스틱이 KEPT 와 함께 반환)

`decisionKeywords` 가 비어있지 않으면 → main.md Decision Record 에 추가 행 append.

### 형식 (clevel-main-guard 준수)

```markdown
| 2026-05-09 | <Decision summary 1 줄> | <activeCLevel> (turn N) | working-notes turn N |
```

- Owner 컬럼 = `vais.config.json > workflow.activeCLevel` 또는 `.vais/status.json > activeFeature.activeCLevel`
- Source 컬럼 = working-notes 의 해당 turn 위치

### Append-only 보호

- main.md 읽기 → 마지막 row 위치 찾기 → 그 다음 줄에 새 row 추가
- 기존 row 수정 X (clevel-main-guard rule 3)
- atomic write (`lib/fs-utils.js` `appendFileSync` 패턴)

## §5. M0-③ "체크포인트" 키워드 spec

### 트리거 키워드

| 한국어 | 영어 |
|--------|------|
| "체크포인트", "여기까지 정리" | "checkpoint", "summary so far" |

### 동작

1. UserPromptSubmit hook 에서 user prompt scan
2. 키워드 발견 시 → 출력:
   ```
   📍 **체크포인트** — {feature} (turn N)
   📌 **현재까지 결정**:
   - {Decision Record 마지막 3 entries}
   📝 **마지막 turn**:
   - {working-notes 마지막 entry}
   ```
3. ideation 종료 X (assistant 가 정상 응답 계속)

### Fallback (UserPromptSubmit hook 미존재 시)

- 사용자 키워드 발화 → assistant 가 자체 응답 본문 안에서 처리 (in-conversation logic)
- 단점: hook 강제 X, assistant 가 매번 인지해야 함
- 완화: vais-code SKILL 의 응답 스타일에 "체크포인트 키워드 인식" 명시

## §6. M0-④ session-start 자동 복원 spec

### 동작 (`hooks/session-start.js` 확장)

```
1. .vais/status.json 읽기 → activeFeature, features.{activeFeature}.ideation 확인
2. ideation.inProgress === true 인 경우:
   a. main.md 읽기 → Decision Record 표 → 마지막 5 entries 추출
   b. working-notes.md 읽기 → 마지막 3 turn entries 추출
   c. 5 줄 요약 출력:
      ```
      🔄 진행 중 ideation 발견 — {feature} ({turnCount} turns)
      📌 핵심 결정 (Decision Record):
        - <마지막 entry 1>
        - <마지막 entry 2>
        - <마지막 entry 3>
      📝 마지막 working-notes:
        <마지막 entry>
      🔍 Open Questions: <main.md 의 Open Questions 섹션 있으면 표시>
      ```
   d. AskUserQuestion: "이전 ideation 계속하시겠습니까?" 옵션 [계속 / 새로 시작 / 종료]
3. ideation.inProgress === false 또는 부재 → no-op
```

### 5 분 회복 보장

- session-start hook timeout 5s (현재 설정)
- 사용자 응답 + assistant 첫 turn = ~30s
- AC-M0-1 (5 분 회복) 충족 가능

## §7. 의존성 + 코드 변경 위치 (Plan ≠ Do)

> 본 design 은 spec 만. 실제 코드 변경은 CTO Do phase.

| 파일 | 변경 유형 |
|------|---------|
| `scripts/stop-handler.js` | 확장 — LLM 휴리스틱 호출 + working-notes append + Decision Record append |
| `hooks/session-start.js` | 확장 — in-progress ideation 감지 + 복원 출력 |
| `hooks/checkpoint-keyword.js` | 신규 — UserPromptSubmit 핸들러 (M0-③) |
| `hooks/hooks.json` | 1 줄 추가 — UserPromptSubmit 등록 |
| `lib/llm-heuristic.js` | 신규 — Claude API haiku 호출 wrapper |
| `lib/memory.js` | 확장 — ideation 필드 read/write 헬퍼 |
| `package.json` | 1 항목 — `@anthropic-ai/sdk` dependency 추가 |

### 신규 코드 추정 (Do phase 작업량)

- `stop-handler.js` 확장: ~80~120 줄 추가
- `session-start.js` 확장: ~50~80 줄 추가
- `checkpoint-keyword.js` 신규: ~50 줄
- `llm-heuristic.js` 신규: ~80 줄
- `memory.js` 확장: ~30 줄
- 합계: ~290~360 줄 (Sprint v2 W1 D2-D5 작업량 — realistic)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — Hook 재활용 설계 (신규 0) + status 스키마 + LLM 휴리스틱 spec + Plan ≠ Do 명시 |
