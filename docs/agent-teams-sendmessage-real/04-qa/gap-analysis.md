---
owner: cto
artifact: gap-analysis
phase: qa
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: qa-engineer
summary: "14 AC 매트릭스 검증 — 12 Met / 1 Partial / 1 외부위임. 288/288 tests pass. 회귀 fix 재검증 완료."
---

# Gap Analysis — agent-teams-sendmessage-real (QA Phase)

> Phase: qa | Owner: CTO | Agent: qa-engineer | Date: 2026-05-17
> 참조: `01-plan/tech-plan.md` (AC1~AC9) + `01-plan/security-gate-plan.md` (AC-CSO-1~5) + `03-do/implementation-log.md` v1.1

---

## 1. AC 매트릭스 (CTO 9 + CSO 5 = 총 14)

| ID | Criterion | Verification (실측) | 결과 |
|----|-----------|---------------------|------|
| AC1 | `detectExperimentalAgentTeamsFlag` export | `lib/cc-version-detect.js:60,156` — function 존재 확인 | ✅ Met |
| AC2 | `checkAgentTeamsAllowed()` 반환에 `simulationMode` + `flagInfo` 필드 | `:125~140` — `simulationMode: true/false`, `flagInfo` 반환 코드 확인 | ✅ Met |
| AC3 | env set → `simulationMode=false`, unset → `true` (enabled=true 가정) | `lib/cc-version-detect.js:123~133` — `flagInfo.enabled` 분기 정합. `tests/cc-version-detect-flag.test.js` 12 케이스 | ✅ Met |
| AC4 | conversation-orchestrator event 객체에 `mode` 필드 박제 | `conversation-orchestrator.js:236~242` (simulated), `:283~291` (real) — `mode: 'simulated'/'real'` 확인 | ✅ Met |
| AC5 | session-start hook 경고 3 조건 + 조용 1 조건 분기 | `hooks/session-start.js:51~68` — 4 분기 블록 확인. `tests/session-start-hook-warning.test.js` 6 케이스 | ✅ Met |
| AC6 | ONBOARDING.md "Agent Teams 활성화" 섹션 + 5 단계 | `grep "Agent Teams 활성화" ONBOARDING.md` → line 55 (`{#agent-teams-activation}`). Step 1~5 확인 | ✅ Met |
| AC7 | decisions-log template `mode` + `messageHash` 컬럼 헤더 | `grep "mode.*messageHash" templates/decisions-log.template.md` → line 19 확인 | ✅ Met |
| AC8 | 비파괴성 — 기존 0.68.0 byte-compat + validate-plugin 0 err/0 warn + 288/288 tests pass | `implementation-log.md` v1.1 §5.1 — 288/288 pass 기록. `vais.config.json agentTeams.enabled=false` 유지 | ✅ Met |
| AC9 | settings.json 자동 수정 코드 없음 | `grep -rE "fs\.(write\|append)File.*settings\.json" lib/ skills/ hooks/` → 0 hit (tests/ 2건은 test fixture) | ✅ Met |
| AC-CSO-1 | 신규 5 surface 하드코딩 시크릿 0 hit | 시크릿 regex `(password\|secret\|api_key\|token)\s*[:=]\s*["'][^"']{8,}` — 5 surface 내 hardcode 없음. `_scanSecrets` 는 송신 body 런타임 검사용 (별도) | ✅ Met |
| AC-CSO-2 | 신규 의존성 추가 없음 → CVE 0 / SPDX 호환 | S1~S5 모두 Node.js 내장 모듈만 사용 (`fs`, `path`, `os`, `crypto`). `package.json` 변경 없음 — baseline 유지 | ⚠️ Partial (신규 의존성 0 → 의미상 PASS. 추후 외부 의존성 추가 시 재검증 필요) |
| AC-CSO-3 | `vais-validate-plugin.js` 0 err / ≤ 2 warn | `validateAgentTeamsConfig` — `agentTeams.enabled=false` 유지로 warning 미발생. AC8 join — 0 err / 0 warn | ✅ Met |
| AC-CSO-4 | T1~T3 mitigation 박제 위치 grep 확인 | `conversation-orchestrator.js` — `_scanSecrets` L215, `_validateActor` L198, `_enforceMainSubDirectionality` L182. 호출 순서 L246→249→267 (T3→T2→T1) 설계 일치 | ✅ Met |
| AC-CSO-5 | `conversation-orchestrator.js` 신규 SendMessage 경로에 actor whitelist 검증 | `_validateActor` 존재 + `allowedActors` whitelist 구성 확인. 독립 code-reviewer 리뷰는 CSO Gate C 외부 위임 | ⏸ 외부 위임 (Gate C — CSO code-reviewer 별도 호출 권장) |

### 실측 근거

**AC6 grep 결과**:
```
ONBOARDING.md:55: ## Agent Teams 활성화 (선택) {#agent-teams-activation}
ONBOARDING.md:57:  > 기본값: simulation 모드 ... 5 단계를 따르세요.
```

**AC7 grep 결과**:
```
templates/decisions-log.template.md:19: | # | time (UTC ISO 8601) | actor | event-type | topic | ref | mode | messageHash |
templates/decisions-log.template.md:25: > 하위 호환: 기존 v1.0 timeline 행은 mode/messageHash 컬럼 비워도 valid.
```

**AC-CSO-4 grep 결과**:
```
conversation-orchestrator.js:182:  _enforceMainSubDirectionality(targetActor) {
conversation-orchestrator.js:198:  _validateActor(actor) {
conversation-orchestrator.js:215:  _scanSecrets(text) {
conversation-orchestrator.js:247:    this._enforceMainSubDirectionality(participantClevel);
conversation-orchestrator.js:250:    if (!this._validateActor(participantClevel)) {
conversation-orchestrator.js:267:    this._scanSecrets(promptText);
```

**AC9 grep 결과** (lib/ + skills/ + hooks/ 범위):
```
0 hit (tests/ 내 2건은 test fixture — AC9 scope 외)
```

---

## 2. 회귀 fix 검증

implementation-log §5.1: `_validateActor` whitelist 에 `participants` 누락 → 기존 FSM 테스트 2건 fail.

**수정 내용 (1줄)**:
```js
this.allowedActors = Array.from(new Set([
  ...this.parallelGroup,
  ...this.participants,    // ADDED (회귀 fix)
  'main',
  this.synthesizer,
]));
```

**재검증**: implementation-log v1.1 — 288/288 tests pass (40 신규 + 248 기존). test 파일 케이스 수 직접 집계:

| 파일 | 케이스 수 (grep `^test\(`) |
|------|--------------------------|
| `cc-version-detect-flag.test.js` | 12 |
| `conversation-orchestrator-sendmessage.test.js` | 15 |
| `session-start-hook-warning.test.js` | 6 |
| `agent-teams-sendmessage-integration.test.js` | 7 |
| **신규 합계** | **40** |

**design 정합성 관찰**: design 명세 `allowedActors = parallelGroup + ['main', synthesizer]` 에 `participants` 가 누락되어 있음. T2 의도(외부 actor 위조 차단)와 무관한 자연스러운 포함 대상 — design 보강 candidate (본 피처 외 별도 PR).

---

## 3. Out-of-Scope 검증 (Plan 5건 재확인)

| 항목 | Plan 단계 결정 | QA 결과 |
|------|---------------|--------|
| SendMessage 자체 구현 | CC 내장 — 통합만 | ✅ 변경 0 (sendMessageFn 외부 주입 패턴 유지) |
| FSM 자체 재설계 | 기존 5-state 재사용 | ✅ 분기점만 추가 (simulationMode 분기) |
| Multi-PO lock / LLM-as-judge / SC-06 | v2.1 후속 | ✅ 변경 0 |
| 본 피처 dogfood | chicken-and-egg, skip | ✅ simulation 모드 유지 (enabled=false) |
| settings.json 자동 수정 | 금지 | ✅ AC9 PASS — 0 hit (lib/skills/hooks 범위) |

---

## 4. 관찰 (out-of-scope 후속 — 구현 중 발견)

- **design 명세 보강 candidate**: `flag-detection-design.md` 의 `allowedActors` 구성에 `participants` 미포함 — §5.1 회귀 원인. 별도 PR 에서 1줄 추가 권장 (본 피처 외).
- **AC-CSO-2 재검증 시점**: 현재 신규 의존성 0으로 의미상 PASS. 추후 외부 npm 패키지 추가 시 `npm audit` + license check 재실행 필요.
- **T1 secret regex 통합 가능성**: `_scanSecrets` 의 4 패턴은 `agents/cso/secret-scanner.md` 룰셋의 부분집합. v2.1 에서 중앙 패턴 레지스트리 통합 후보.
- **AC2 enabled=false 경로**: `checkAgentTeamsAllowed(false)` 반환에 `simulationMode` 필드 없음 (undefined) — 기존 코드 호환 설계이나, 명시적 `simulationMode: undefined` 기록 필요 여부는 v2.1 결정 사항.

---

## 5. Hand-off

| 영역 | 결과 | 후속 |
|------|------|------|
| AC (CTO 9개) | 9/9 ✅ Met | 완료 |
| AC (CSO 5개) | 1 ⚠️ Partial (AC-CSO-2) / 1 ⏸ (AC-CSO-5) / 3 ✅ Met | Gate C — CSO code-reviewer 별도 호출 권장 |
| 테스트 | 288/288 pass (40 신규 + 248 기존) | 신규 40 케이스가 9/9 AC 커버 |
| 회귀 | 1건 발견 → 1줄 fix → 재검증 통과 | implementation-log §5.1 |
| Gate B (plugin-validator) | 0 err / 0 warn (AC-CSO-3 = AC8 join) | PASS |
| Gate C (code-reviewer) | 미실행 — 외부 위임 권장 | CSO code-reviewer: 신규 5 surface bug pattern 검토 + SendMessage 호출 경로 input validation 확인 |
| 1.0.0 narrative 정합 | 본 피처 0.69.0 (Minor) 완료 후 CHANGELOG `[1.0.0]` agent-teams 라벨 정확 표기 가능 | vais-1-0-0-release 재개 시 활용 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 14 AC 매트릭스 + 실측 grep 인용 + 회귀 fix 재검증 + hand-off |
