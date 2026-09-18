---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-guidance-limits
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 코드 한도를 지시문에 그대로 (harness-guidance-limits)

kind: harness (플러그인 자체) · 규모: compact · 관련 작업: harness-doc-budget(예산 안내 문구), harness-diagram-skill 잔여 제한(QA handoff 형식 오류·이름 발급)

## 1. 문제

runtime 이 코드로 강제하는 한도가 AI 에게 주는 지시문에는 없어서, AI 가 한도를 넘기고 거부당한 뒤 다시 시도하느라 토큰과 턴을 낭비한다. 2026-09-17 세션에서 확인된 것: (1) Report `--outcome` 500자 한도가 hook 의 Report 지시문에 없어 543자로 한 번 거부됨. (2) `--limitation` 은 300자를 넘으면 거부하지 않고 조용히 잘라 버리며 지시문에도 없다(정직 원칙 위반). (3) 독립 QA specialist 의 handoff 출력 계약(judgment·decisions·evidence·risks 글자 수, `files` 는 쓴 파일 전용)이 `agents/v2-specialist.md` 에 숫자 없이 "maxLength 는 강제" 로만 적혀 네 작업 연속 재출력(총 8회). (4) `이름: <kebab>` 뒤에 붙은 영어 단어가 slug 에 이어 붙어(`harness-diagram-skill-plan`) 이름을 다시 받느라 한 턴 소모. 사용자 지적: "한도가 있으면 만들 때 그 한도로 적으라고 해야지, 넘기고 다시 요청하면 토큰 낭비다". 논의 결과 outcome 한도는 700자로 올리기로 했다(2026-09-17).

## 2. 목표

코드가 강제하는 한도는 같은 숫자를 코드에서 끌어와 지시문에도 적는다. 한도가 바뀌면 지시문이 따라가고, AI 는 첫 시도에 맞춘다. 넘기면 자르지 않고 거부한다.

## 3. 범위

포함: outcome 한도 700자 상향과 지시문 표시, limitation 300자 거부와 지시문 표시, QA assignment 지시문과 specialist 지시문의 출력 계약 숫자 표와 `files` 규칙, `이름:` 뒤 문장 무시, 지시문에 숫자가 들어 있는지 확인하는 테스트, 문서·CHANGELOG·patch 버전. 제외: handoff 계약 숫자 자체의 변경, drift 예외·authorization TTL(상태 머신 성격이라 별도 작업), 문서 예산 문구(4.1.0 에서 함).

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | Report `--outcome` 한도를 700자로 올리고, Report 단계 지시문이 그 숫자를 코드 상수에서 끌어와 "700자 이내 요약, 세부는 Review 링크" 로 표시한다. | 701자 거부·700자 통과 테스트. 지시문 숫자가 상수와 같음(테스트). |
| REQ-002 | `--limitation` 은 각 300자 이내이며 넘으면 잘라내지 않고 거부한다. 지시문에 그 숫자를 표시한다. | 301자 거부·300자 통과 테스트, 잘림 코드 제거. |
| REQ-003 | 독립 QA 위임 지시문(hook Review 단계 지침)과 `agents/v2-specialist.md` 가 규모별 출력 계약 숫자(judgment·decisions·behavior·evidence·risks·unverified 의 글자 수와 개수, 직렬화 바이트)를 표로 보이고, "`codeWrite: false` 면 `files` 를 넣지 않는다", "한국어도 글자 1로 세되 여유를 둔다" 를 명시한다. | 표의 숫자가 계약 생성 코드와 같음(테스트). `files` 규칙 문구 존재. |
| REQ-004 | `/vais 이름: <kebab> …` 에서 이름 뒤 문장은 slug 에 붙지 않는다. `이름:` 이 없을 때의 기존 발급은 그대로. | 라우터 테스트: `이름: a-b 추려서 Plan` → slug `a-b`. |
| REQ-005 | 문서·버전: CLAUDE 규칙(5 위임, 10-1 이름, Report 한도 한 줄), CHANGELOG, patch 버전(4.2.1) 7면. | grep 통과, doctor fail 0. |

## 5. 사용자 흐름

지금: Report 끝에 outcome 이 거부돼 한 번 더, 제한 문구는 모르게 잘리고, QA 결과가 형식 때문에 두세 번 더 오간다. 바뀐 뒤: 첫 시도에 통과하고, 넘기면 잘리는 대신 이유와 숫자가 보인다. 사용자는 turn 이 줄어드는 것 외에 달라지는 것이 없다.

## 6. 엣지 케이스

- 한도 숫자를 지시문에 복사해 적으면 다시 어긋난다 → 반드시 코드 상수를 interpolation 한다(테스트로 고정).
- 규모(compact·standard·extended)마다 handoff 계약 숫자가 다르다 → 표는 assignment 결과의 outputContract 에서 그 자리에서 생성한다.
- `이름:` 뒤에 영어가 이름의 일부인 경우(`이름: my-feature-v2`) → kebab 토큰 하나만 이름이고 공백 뒤는 전부 무시.
- 이미 커밋된 Report 문서는 손대지 않는다. 700자는 Report 예산(compact 4,096B)의 절반 안이다.

## 7. 완료 조건

REQ-001~005 충족, `npm test`·`npm run regression`·lint·validate PASS, 독립 QA PASS(이번 QA 가 새 지시문의 첫 사용자다 — 재출력 0회면 성공).

## 8. 영향

변경 후보: `hooks/workflow-v2-prompt.js`(Report·Review 지침), `agents/v2-specialist.md`, `lib/workflow/v2/router.js`·`naming.js`(이름), `lib/workflow/v2/phase-transaction.js`(상수 700·300, 거부), `lib/workflow/v2/contracts.js`(계약 숫자 노출), `tests/**`, CLAUDE·README·CHANGELOG, 버전 7면. 상태 머신·양식·handoff 계약 값은 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
