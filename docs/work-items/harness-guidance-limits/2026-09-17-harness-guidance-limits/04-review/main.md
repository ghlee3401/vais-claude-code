---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-guidance-limits
phase: review
revision: 1
status: approved
based_on: []
---

# Review — harness-guidance-limits

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005

## 테스트

TC-001, TC-002, TC-003, TC-004, TC-005 — 독립 QA 가 상수·지시문·계약 표·라우터·문서·버전을 대조하고 테스트를 재실행한다. 이 QA 자체가 새 `guidance` 의 첫 사용이다.

## 입력 · 출력

입력은 승인된 Design 의 REQ 표, `phase-transaction.js`·`contracts.js`·`router.js`·prompt hook·CLI·`agents/v2-specialist.md`, 테스트, 문서·버전 파일이고, 출력은 Report 한도 700/300(거부), assignment `guidance`, `이름:` 뒤 무시, 4.2.1 이다.

## 기대 · 실제

- TC-001 기대: 700 통과·701 거부, Report 지침에 상수 숫자 / 실제: 단위 테스트 통과, 실행 중 캐시는 4.2.0 이라 hook 문구는 테스트로만 확인.
- TC-002 기대: 300 통과·301 거부(몇 번째), 잘림 없음 / 실제: 통과.
- TC-003 기대: 세 규모 `guidance` 숫자 = 계약, Review 지침·specialist 지시문에 `files` 규칙 / 실제: 통과. 실증은 이 Review 의 QA handoff 등록 횟수(handoff 절 참조).
- TC-004 기대: `이름: a-b 추려서 Plan` → `a-b` / 실제: 통과, 기존 이름 테스트도 통과.
- TC-005 기대: 버전 4.2.1, 문서, test·회귀·lint·validate PASS / 실제: readiness READY(test·lint·plugin-validator), 회귀 10/10.

## 엣지 · 제한

- 새 `guidance` 와 지시문은 플러그인 4.2.1 로 업데이트한 뒤에야 hook 이 실제로 주입한다. 이번 QA 에는 CTO 가 같은 표를 prompt 에 직접 붙여 검증했다.
- 실증 결과: 표를 받고도 QA 의 첫 handoff 는 한 칸이 한 글자 초과(20자 한도에 21자)로 거부돼 재출력 1회. `files` 오류와 큰 초과는 사라졌지만 글자 세기 오차는 남는다. 다음 단계는 specialist 가 반환 전에 스스로 돌리는 검증 명령(예: `handoff validate --file`)이다.
- `이름: bad name` 은 이제 이름 `bad` 로 받는다(뒤 문장 무시 규칙의 결과). 잘못된 이름은 `bad_name!` 처럼 kebab 이 아닐 때만 거부된다.
- 완료된 Report 문서들은 손대지 않았다.

## 증거

- `03-do/evidence/transactions/PT-4d6978ce-0c2c-4e06-9ac4-c7b2a7370399.json` (readiness READY)
- `04-review/evidence/checks/secret-scan.json`
- 독립 QA handoff (`04-review/evidence/handoffs/`)
