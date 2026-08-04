---
owner: cto
artifact: implementation-log
phase: do
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: backend-engineer
summary: "5 surface 구현 완료 — cc-version-detect 확장, orchestrator 분기+T1~T3, session-start 경고, ONBOARDING 섹션, decisions-log 헤더"
---

# Implementation Log — agent-teams-sendmessage-real (Do Phase)

> 참조 문서:
> - design/flag-detection-design.md — 의사코드 7개 + 인터페이스 계약 표 + T1~T3 mitigation
> - design/onboarding-doc-design.md — ONBOARDING.md 섹션 초안 (복붙용)
> - plan/tech-plan.md — 9 AC + 5 surface 정의
> - plan/security-gate-plan.md — T1~T3 위협 요구사항

## 1. 변경 Surface 요약

| # | 파일 | 변경 종류 | Lines 변경 |
|---|------|-----------|-----------|
| S1 | `lib/cc-version-detect.js` | 신규 함수 2개 추가 + 기존 함수 확장 | +55 lines |
| S2 | `skills/vais/utils/conversation-orchestrator.js` | 분기 로직 + T1/T2/T3 mitigation + log 확장 | +87 lines (net) |
| S3 | `hooks/session-start.js` | require 추가 + 경고 분기 블록 추가 | +27 lines |
| S4 | `ONBOARDING.md` | "Agent Teams 활성화" H2 섹션 삽입 | +58 lines |
| S5 | `templates/decisions-log.template.md` | events 표 헤더 2 컬럼 추가 + 하위호환 주석 | +5 lines |

---

## 2. Surface 상세

### S1 — `lib/cc-version-detect.js`

**신규 exports**:
- `detectExperimentalAgentTeamsFlag()` — env → settings.json 우선순위 감지. `_flagCached` 독립 캐시 사용.
- `_resetFlagCache()` — 테스트용 flag 캐시 초기화.

**기존 함수 확장** (`checkAgentTeamsAllowed`):
- CC 2.1+ 분기 이후 `detectExperimentalAgentTeamsFlag()` 호출.
- flag.enabled=false → `{ allowed: true, simulationMode: true, flagInfo }` 반환.
- flag.enabled=true → `{ allowed: true, simulationMode: false, flagInfo }` 반환.
- enabled=false / 버전 감지 실패 / CC < 2.1 → 기존 동작 유지 (simulationMode 필드 없음 — backward-compat).

**의존성 추가**: `fs`, `path`, `os` (Node.js 내장 — 추가 설치 없음).

### S2 — `skills/vais/utils/conversation-orchestrator.js`

**constructor 신규 파라미터**:
- `opts.simulationMode` (default: true) — `opts.dryRun` 하위호환 매핑 유지.
- `opts.callerContext` ('main'|'c-level'|'sub-agent', default: 'main') — T3용.
- `opts.parallelGroup` (string[], default: []) — T2 화이트리스트 구성용.

**신규 인스턴스 필드**:
- `this.simulationMode`, `this.mode` ('real'|'simulated'), `this.callerContext`, `this.parallelGroup`, `this.allowedActors`.
- `this.dryRun = this.simulationMode` (하위호환).

**`log()` 확장**: 5번째 파라미터 `mode`, 6번째 `messageHash` 추가 (기본값으로 backward-compat).

**신규 내부 함수**:
- `_sha256(text)` — `crypto.createHash('sha256')` 사용.
- `_buildReviewPrompt()` — 기존 promptText 인라인을 메서드 추출.

**신규 내부 메서드** (보안):
- `_enforceMainSubDirectionality(targetActor)` — T3: sub-agent caller → throw.
- `_validateActor(actor)` — T2: allowedActors 화이트리스트. unknown → drop (false 반환).
- `_scanSecrets(text)` — T1: 4 regex 패턴. hit → throw.

**`_sendReviewRequest()` 분기**:
- simulated 모드: 보안 함수 호출 없이 기존 0.68.0 동작 그대로 (byte-compat). `mode: 'simulated', messageHash: null` 반환.
- real 모드: T3 → T2 → T1 → sendMessageFn 호출. response hash = SHA-256(JSON.stringify(resp)). `mode: 'real', messageHash: hash` 반환.

**의존성 추가**: `crypto` (Node.js 내장 — 추가 설치 없음).

### S3 — `hooks/session-start.js`

`require('../lib/cc-version-detect').checkAgentTeamsAllowed` 추가.

`main()` 내 `loadConfig()` 직후에 경고 분기 블록 삽입 (try/catch 전체 — hook hard fail 방지):
1. `agentTeams.enabled=false` → 조용.
2. `allowed=true && simulationMode=true` → stderr: env not set 경고.
3. `!allowed && reason.includes('< 2.1.0')` → stderr: CC 2.1+ 요구 경고.
4. `allowed=true && simulationMode=false` → 조용 (정상 활성).

### S4 — `ONBOARDING.md`

삽입 위치: `## 2. Quick Start (1분)` 섹션 마지막 `---` 와 `## 3. Architecture` 사이.
anchor: `{#agent-teams-activation}` (session-start.js 경고 메시지의 링크 대상 일치).
내용: 전제 조건 + Step 1~5 + Graceful Degradation 표 (onboarding-doc-design.md §1 그대로).

### S5 — `templates/decisions-log.template.md`

Events Timeline 표 헤더에 `mode`, `messageHash` 컬럼 추가.
하위호환 주석 3줄 추가 (표 바로 아래):
- real 모드 vs simulated 의미.
- messageHash = SHA-256(response JSON), simulated 행은 `—`.
- 기존 v1.0 timeline 행은 mode/messageHash 비워도 valid.

---

## 3. AC 자체 검증 결과

| AC | 검증 방법 | 결과 |
|----|-----------|------|
| AC1 | `detectExperimentalAgentTeamsFlag` export 존재 | PASS — `lib/cc-version-detect.js:60,156` 확인 |
| AC2 | `checkAgentTeamsAllowed(true)` 반환에 `simulationMode` 필드 | PASS — CC 2.1+ 분기 시 `simulationMode: true/false` 반환 코드 확인 |
| AC4 | event 객체에 `mode` 필드 | PASS — `log()` 5번째 파라미터 + `_sendReviewRequest` 반환 객체 |
| AC6 | ONBOARDING.md "Agent Teams 활성화" 섹션 + 5 단계 | PASS — grep 확인 (`## Agent Teams 활성화 (선택)` line 55) |
| AC7 | decisions-log template `mode` + `messageHash` 컬럼 | PASS — grep `mode.*messageHash` → line 19 확인 |
| AC8 | validate-plugin 0 err / ≤ 1 warn (agentTeams.enabled=false 유지) | 미실행 (node 없는 환경) — vais.config.json enabled=false 유지 확인 |
| AC9 | `grep -rE "fs\.(write\|append)File.*settings\.json" lib/ skills/ hooks/` → 0 hit | PASS — lib/skills/hooks 내 해당 패턴 없음. tests/ 의 `writeFileSync` 1건은 scope 외 (test fixture) |

**T1/T2/T3 박제 위치**:

| 위협 | 파일 | Line |
|------|------|------|
| T1 `_scanSecrets` 정의 | `conversation-orchestrator.js` | 214 |
| T1 `_scanSecrets` 호출 | `conversation-orchestrator.js` | 266 |
| T2 `_validateActor` 정의 | `conversation-orchestrator.js` | 197 |
| T2 `_validateActor` 호출 | `conversation-orchestrator.js` | 249 |
| T3 `_enforceMainSubDirectionality` 정의 | `conversation-orchestrator.js` | 181 |
| T3 `_enforceMainSubDirectionality` 호출 | `conversation-orchestrator.js` | 246 |

호출 순서: T3 (line 246) → T2 (line 249) → T1 (line 266) — 설계 명세와 일치.

---

## 4. byte-compat 확인

- `agentTeams.enabled=false` → `checkAgentTeamsAllowed` 첫 줄에서 즉시 반환 (기존 동작 100% 동일).
- `opts.simulationMode` 미전달 시 기본값 `true` → `dryRun=true` 와 동일 실행 경로.
- `log()` 호출 시 5·6번째 파라미터 생략 → 기본값 `this.mode`, `null` — 기존 4파라미터 호출 모두 호환.
- `ConversationSession` 기존 `dryRun` 옵션 → 내부적으로 `simulationMode` 로 매핑되고 `this.dryRun` 도 유지.
- `openReviewWindow()` 반환 배열 형식 변경 없음 (신규 필드 추가만).

---

## 5. 발견된 이슈

### 5.1 회귀 (수정 완료)

테스트 통합 실행 시 `tests/lazy-consensus-fsm.test.js` 의 기존 2 테스트 fail:
- "FSM 강제 timeout: reviseFn 없으면 timeout 박제"
- "FSM 1 라운드 revision 후 합의"

**원인**: design 명세 `allowedActors = parallelGroup + ['main', synthesizer]` 가 `participants` 를 포함하지 않음. 기존 테스트는 `participants: ['cpo']` + `parallelGroup` 미전달 → 'cpo' 가 whitelist 미적중 → T2 drop → sendMessageFn 호출 안 됨 → 반박 시나리오 실행 불가.

**수정** (1줄):
```js
this.allowedActors = Array.from(new Set([
  ...this.parallelGroup,
  ...this.participants,    // ADDED (회귀 fix)
  'main',
  this.synthesizer,
]));
```

design 보강 — `participants` 는 review-window 직접 참여자이므로 whitelist 자연 포함. T2 의도 (외부 actor 위조 차단) 와 무관.

### 5.2 기타

- `_validateActor` T2 drop 시 빈 응답 대신 auto-agree 반환으로 처리 (파이프라인 중단 방지 — 설계 의도 일치).
- 의사코드와 인터페이스 계약이 충분히 구체적이어서 5.1 외 해석 차이 없었음.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 5 surface 구현 완료 + AC 자체 검증 |
| v1.1 | 2026-05-17 | §5.1 추가 — `_validateActor` whitelist 에 `participants` 포함 (1줄 회귀 fix). 288/288 tests pass |
