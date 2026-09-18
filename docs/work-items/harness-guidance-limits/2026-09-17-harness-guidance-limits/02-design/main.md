---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-guidance-limits
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 코드 한도를 지시문에 그대로 (harness-guidance-limits)

## 1. 접근

한도 숫자의 출처를 한 곳(코드 상수·계약 생성기)으로 두고, hook 지시문·assignment 결과·specialist 지시문이 그 값을 끌어와 보이게 한다. 잘라내던 곳은 거부로 바꾼다. 위임 없음.

장부 피드백 반영: "500자가 너무 적은지" 논의 결과 outcome 은 700자로 올린다(Report 예산 4,096B 의 절반 안). limitation 300자는 유지하되 잘라내지 않고 거부한다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | outcome 한도 700 + 지시문 표시 | `--outcome` | Report "## 최종 결과" | 701자 이상 → `REPORT_OUTCOME_TOO_LONG` 거부 | `phase-transaction.js` 에 `REPORT_LIMITS = { outcome: 700, limitation: 300 }` export. prompt hook 의 Report 지침이 `REPORT_LIMITS` 를 import 해 "outcome 은 N자 이내 요약(세부는 Review 링크), limitation 은 각 M자 이내 한 줄, 넘기면 거부" 를 interpolation | TC-001 |
| REQ-002 | limitation 거부 | `--limitation` (여러 개) | 잔여 제한 불릿 | 301자 이상 → `REPORT_LIMITATION_TOO_LONG` 거부(몇 번째·몇 자) | `.slice(0, 300)` 제거, `assertReportInputs(input)` 함수로 두 검사를 모아 export(테스트 대상) | TC-002 |
| REQ-003 | QA 출력 계약 표 + `files` 규칙 | assignment 의 `outputContract` | `assignment` 결과에 `guidance` 문자열(규모별 숫자 표), hook Review 지침·specialist 지시문 | — | `contracts.js` 에 `describeHandoffLimits(outputContract)` 추가: judgment·decisions·behavior(inputs/outputs/errors)·evidence·risks·unverified·recommendedChecks 의 글자 수·개수와 hard/target 바이트를 한국어 한 줄 표로. CLI `buildAssignment` 결과에 `guidance` 필드. hook Review 지침에 "`guidance` 를 Agent prompt 에 그대로 붙인다. `--code-write false` 면 handoff 에 `files` 를 넣지 않는다". `agents/v2-specialist.md` 에 세 규칙: 계약에 없는 키 금지(특히 읽기 전용이면 `files`), 글자는 한국어도 1로 세되 각 한도의 80% 안에, `guidance` 표를 먼저 읽는다 | TC-003 |
| REQ-004 | `이름:` 뒤 무시 | `/vais 이름: a-b 추려서 Plan` | slug `a-b` | — | `router.js` `NAME_FEATURE` 를 `^(?:이름\|name)\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9-]{1,47})(?:\s+[\s\S]*)?$` 로. 뒤 문장은 `text` 에 남아 Plan 문맥에만 쓰인다. `이름:` 없는 요청의 발급(`deterministicSlug`)은 그대로 | TC-004 |
| REQ-005 | 문서·버전 | — | 4.2.1 | — | CLAUDE 규칙 5(위임: `guidance`·`files`), 10-1(이름 뒤 문장 무시), 새 한 줄 "Report outcome 700·limitation 300"; README 5단계 표 Report 행에 한도; design.md 대응표 행; CHANGELOG [4.2.1]; 버전 7면 | TC-005 |

## 3. 결정

- 코드가 강제하는 한도는 지시문에 같은 숫자를 코드에서 끌어와 적는다. 복사한 숫자는 두지 않고 테스트로 대조한다.
- outcome 한도는 700자로 올린다(사용자 논의 2026-09-17). limitation 은 300자 유지, 넘기면 잘라내지 않고 거부한다.
- QA 출력 계약 숫자는 assignment 결과의 `guidance` 로 그 자리에서 생성해 Agent prompt 에 붙인다. specialist 지시문에는 원칙 세 줄만 둔다.
- `이름:` 이 있으면 kebab 토큰 하나만 이름이다. 뒤 문장은 slug 에 붙지 않는다.
- 버전 4.2.1.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — assignment 결과에 `guidance` 필드 추가(스키마 밖 결과 객체라 schemas/ 변경 없음), `NAME_FEATURE` 정규식 완화. 이 Design 승인이 사전 합의다 |
| 보안·UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `hooks/workflow-v2-prompt.js`, `agents/v2-specialist.md`, `lib/workflow/v2/router.js`, `lib/workflow/v2/phase-transaction.js`, `lib/workflow/v2/contracts.js`, `scripts/vais-workflow-v2.js`, `tests/**`, `CLAUDE.md`, `README.md`, `docs/harness/design.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용). 이번 QA 는 새 `guidance` 와 지시문의 첫 사용자다 — handoff 가 첫 시도에 등록되면 REQ-003 의 실증이다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | `REPORT_LIMITS.outcome === 700`; 700자 통과·701자 거부; hook Report 지침 문자열에 "700자" 가 상수에서 들어감(테스트가 상수 값을 문자열에서 찾음) | 일치 |
| TC-002 | 300자 limitation 통과·301자 거부(몇 번째인지 메시지에), Report 본문에 잘림 없음 | 일치 |
| TC-003 | `describeHandoffLimits` 가 compact·standard·extended 계약의 judgment·evidence·risks 등 숫자와 바이트를 모두 담음; CLI `assignment` 결과에 `guidance`; hook Review 지침과 `agents/v2-specialist.md` 에 `files` 규칙 문구 | 일치 |
| TC-004 | `routePrompt('/vais 이름: a-b 추려서 Plan', null)` → action name-feature, slug `a-b`; `이름: a-b` 단독도 같음; `이름: bad name` 은 name-feature 아님 | 일치 |
| TC-005 | 버전 7면 4.2.1, CHANGELOG [4.2.1], CLAUDE·README·design.md 문구, `npm test`·회귀·lint·validate PASS | 일치 |

## 8. rollback

`git checkout -- hooks agents lib scripts tests CLAUDE.md README.md docs/harness/design.md CHANGELOG.md package.json package-lock.json vais.config.json .claude-plugin`.
