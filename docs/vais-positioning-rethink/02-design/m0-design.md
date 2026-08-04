---
owner: cto
artifact: m0-design
phase: design
feature: vais-positioning-rethink
---

# M0 Design — Ideation Continuity Architecture (v2.0 Lean)

> Hook 재활용 + status 스키마 + LLM 휴리스틱 spec. 신규 hook 1 개만.

## §1. Hook 매핑

| M0 메커니즘 | Hook | 변경 |
|------------|------|------|
| ① working-notes 자동 누적 | `Stop` 기존 (`scripts/stop-handler.js`) | LLM 휴리스틱 + fs append 로직 추가 |
| ② Decision Record append | `Stop` 기존 동일 핸들러 | §3 의 KEPT 분기 — `decisionKeywords` 비어있지 않으면 main.md 표 append (clevel-main-guard 준수, append-only) |
| ③ "체크포인트" 키워드 | `UserPromptSubmit` (신규 핸들러) | §4 참조 |
| ④ session-start 자동 복원 | `SessionStart` 기존 (`hooks/session-start.js`) | §5 참조 |

→ 신규 hook 신설 **1 개** (M0-③), 기존 2 개 확장. `hooks.json` 1 줄 추가.

## §2. .vais/status.json 스키마 확장

`features.{feature}.ideation` 필드 추가 (BC, lazy populate):

```json
{
  "ideation": {
    "inProgress": true,
    "lastTurn": 17,
    "workingNotesPath": "docs/{feature}/00-ideation/working-notes.md",
    "mainMdPath": "docs/{feature}/00-ideation/main.md",
    "lastUpdated": "ISO-8601"
  }
}
```

읽기/쓰기: `lib/memory.js` (기존 atomic write 패턴). 종료 시 `inProgress: false` (이력 보존).

## §3. LLM 휴리스틱 spec — turn 가치 판단 + Decision 감지

### Input / Output

```
Input:
  assistantTurnText  // 최근 assistant 응답
  userTurnText       // 직전 user prompt
  recentNotes        // working-notes 마지막 3 entry (컨텍스트)

Output:
  decision: "KEPT" | "SKIP"
  if KEPT:
    summary: 1~3 줄 (Markdown bullet)
    decisionKeywords: string[]  // 비어있지 않으면 → Decision Record 도 append (M0-②)
```

### 판단 기준 (system prompt)

```
KEPT (다음 중 하나):
  - 결정 사항 (확정·합의·반대·재논의)
  - 새 정보 (외부 reference / 가설 / 차원)
  - 미해결 질문
  - C-Level 페르소나 충돌·trade-off

SKIP (모두 해당):
  - 단순 yes/no 확인
  - 명확화 질문 (재질문)
  - 도구 결과 단순 보고 (commit hash, file size)
```

### 모델 + 비용

- 모델: `claude-haiku-4-5-20251001`
- prompt ~100 토큰 + response ~30 토큰 → turn 당 ~130 토큰 (~$0.0001)
- session 50 turn 추정 ~6500 토큰 (~$0.005)

### Fallback

LLM 호출 실패 (네트워크/timeout 3s) → **default SKIP**. under-record 가 over-record 보다 안전 (사용자 명시 M0-③ 으로 보완).

## §4. M0-③ "체크포인트" 키워드

### 트리거 키워드

`체크포인트` / `여기까지 정리` / `checkpoint` / `summary so far`

### 동작 (UserPromptSubmit hook)

키워드 발견 시 출력 (ideation 종료 X):

```
📍 체크포인트 — {feature} (turn N)
📌 현재까지 결정 (Decision Record 마지막 3):
  - <entry 1>
  - <entry 2>
  - <entry 3>
📝 마지막 working-notes:
  <entry>
```

### Fallback (UserPromptSubmit hook 미존재 시)

assistant 가 응답 본문 안에서 in-conversation 처리. SKILL.md 응답 스타일에 키워드 인식 명시.

## §5. M0-④ session-start 자동 복원

### 동작 (`hooks/session-start.js` 확장)

```
1. .vais/status.json 읽기 → activeFeature.ideation.inProgress 확인
2. true 인 경우:
   - main.md → Decision Record 마지막 5 entries
   - working-notes.md → 마지막 3 turn entries
   - 출력 (5 줄 요약):
     🔄 진행 중 ideation — {feature} (N turns)
     📌 핵심 결정: <마지막 3 Decision>
     📝 마지막 turn: <last working-notes entry>
   - AskUserQuestion: "이전 ideation 계속?" [계속 / 새로 시작 / 종료]
3. false 또는 부재 → no-op
```

### 5 분 회복 보장

- hook timeout 5s + 사용자 응답 + assistant 첫 turn ≈ 30s
- AC-M0-1 (5 분 회복) 충족

## §6. 코드 변경 위치 + 신규 코드 추정

→ **cto-tech-plan v2.0 §4 (Implementation 분해)** 참조. 본 design 추가 1 항목:
- `lib/llm-heuristic.js` (신규 ~80 줄) — Claude API haiku 호출 wrapper
- `package.json`: `@anthropic-ai/sdk` dependency 추가

전체 신규 코드 추정 ~290~360 줄. Sprint v2 W1 D2-D5 realistic.

> Plan ≠ Do, Design ≠ Do — 본 design 에서 코드 변경 0.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 6 sub-section, 235 줄 |
| v2.0 | 2026-05-09 | **Lean Rewrite** — §4 Decision Record 별도 섹션 폐기 (§3 KEPT 분기로 흡수), §7 cto-tech-plan §4 참조로, §2 마이그레이션 1 줄. 235 → ~150 |
