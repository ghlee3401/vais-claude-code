---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-guidance-limits
phase: do
revision: 1
status: draft
based_on: []
---

# Do — harness-guidance-limits

## 구현 변경

- REQ-001·002 `phase-transaction.js`: `REPORT_LIMITS = { outcome: 700, limitation: 300 }` 와 `assertReportInputs()` (outcome 초과 `REPORT_OUTCOME_TOO_LONG`, limitation 초과는 몇 번째인지 담아 `REPORT_LIMITATION_TOO_LONG`). 잔여 제한 불릿의 `.slice(0, 300)` 제거. prompt hook Report 지침에 두 숫자를 상수에서 interpolation 한 한 줄 추가.
- REQ-003 `contracts.js` `describeHandoffLimits(outputContract)`: 계약의 maxLength·maxItems·바이트를 한국어 표로. CLI `assignment` 결과에 `guidance`. hook Review 지침: "`guidance` 를 Agent prompt 에 그대로 붙이고 `--code-write false` 면 `files` 금지". `agents/v2-specialist.md` 에 첫 시도 규칙 3개.
- REQ-004 `router.js` `NAME_FEATURE` 가 kebab 토큰 뒤 문장을 허용하되 slug 는 토큰만.
- REQ-005 CLAUDE 규칙 5·10-1·18, README Report 행·상태 줄·배지, design.md 대응표 행, CHANGELOG [4.2.1], 버전 7면 + package-lock.

## 검증 증거

- `tests/v2-guidance-limits.test.js` TC-001~004: 700/701·300/301 경계, 지침 문자열의 숫자가 상수와 같음, 세 규모의 `guidance` 가 계약 숫자와 같음, `files` 규칙 문구, `이름: a-b 추려서 Plan` → `a-b`.
- `npm run regression` 10/10, `npm run lint` 0. `npm test` 는 `do ready` 가 다시 돌린다.
- REQ-003 의 실증은 이번 Review 의 독립 QA 다: 새 `guidance` 를 받은 QA 의 handoff 가 첫 시도에 등록되는지 본다.
