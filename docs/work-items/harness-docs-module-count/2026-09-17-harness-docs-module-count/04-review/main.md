---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-docs-module-count
phase: review
revision: 1
status: approved
based_on: []
---

# Review — harness-docs-module-count

## 요구사항

REQ-001, REQ-002, REQ-003

## 테스트

TC-001, TC-002, TC-003 — 독립 QA 가 diff·파일 수·hooks.json·버전 6곳을 직접 대조한다.

## 입력 · 출력

입력은 승인된 Design 의 "바뀔 네 줄", `git diff -U0` 결과, `lib/workflow/v2` 목록, `hooks/hooks.json`, 버전 파일 6곳이고, 출력은 CLAUDE·ONBOARDING·README 의 "38 모듈" 통일, README 기준 줄 "`hooks` 아래 키", CHANGELOG 불릿이다.

## 기대 · 실제

- TC-001 기대: 세 문서 모두 38, 실제 js 파일 38, 손으로 쓰는 문서에 "35 모듈" 0건 / 실제: 일치. 단 자동 생성 제품 노트(`docs/product/decisions.md`·`roadmap.md`)에 장부 debt 원문을 인용한 "35 모듈" 3건이 남는다.
- TC-002 기대: 기준 줄에 "`hooks` 아래 키", "최상위 키" 없음, hooks 아래 키 5 / 실제: 일치.
- TC-003 기대: CHANGELOG 불릿, 버전 6곳 4.0.1 / 실제: 일치.
- diff 는 네 파일 각 한 줄. QA 판정 PASS.

## 엣지 · 제한

- 제품 노트의 "35 모듈" 3건은 장부에 남은 debt 문장을 runtime 이 그대로 그린 것이라 손으로 고칠 수 없다(규칙 10-4). Report 가 이 debt 를 해소로 적으면 다음 재생성 때 문구가 바뀐다.
- QA 는 plugin-validator 를 재실행하지 않고 Do 의 readiness 증거를 신뢰했다.

## 증거

- `03-do/evidence/transactions/PT-118837a8-7635-4a51-a57e-007312bac891.json` (readiness READY: plugin-validator)
- `04-review/evidence/checks/secret-scan.json`
- 독립 QA handoff AS-cb186942-9819-4129-b841-bd2a6dd76892 (`04-review/evidence/handoffs/`)
