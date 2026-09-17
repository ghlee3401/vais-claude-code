---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-doc-budget
phase: review
revision: 1
status: approved
based_on: []
---

# Review — harness-doc-budget

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004

## 테스트

TC-001, TC-002, TC-003, TC-004 — 독립 QA 가 코드·설정·문서를 읽고 `npm test`·`npm run lint` 를 직접 재실행해 대조한다.

## 입력 · 출력

입력은 승인된 Design 의 새 기본값 표와 설정 키 결정, `config.js`·`document-quality.js`·`doctor.js`, `vais.config.json`, 새 테스트 4개, 문서 5개, 버전 파일 7면이고, 출력은 올라간 기본 예산(20칸), 칸 단위 설정 덮어쓰기, doctor `document-budgets` 검사, 세 갈래를 말하는 초과 문구, 4.1.0 이다.

## 기대 · 실제

- TC-001 기대: 20칸이 Design 표와 같고 실측 12 풀이 75% 이하 / 실제: QA 재확인 값 참조(handoff).
- TC-002 기대: 한 칸 덮어쓰기 반영, 누락 시 기본값, 0·음수·문자열 무시 + doctor warn / 실제: 테스트 통과, doctor 가 `standard.design=0` 을 알림.
- TC-003 기대: ①②③ 세 갈래, extended 는 예외 안내, stage 는 `documentBudgets.stage` / 실제: 테스트 통과.
- TC-004 기대: 버전 7면(+package-lock 2곳) 4.1.0, 문서 4곳 갱신, test 235·lint 0 / 실제: QA 재실행 값 참조(handoff).

## 엣지 · 제한

- 새 예산은 이 저장소에서는 플러그인 캐시(4.0.1)가 아니라 push·업데이트 뒤에야 적용된다. 이번 작업 자체는 옛 예산(compact Design 8,192B)으로 통과했다.
- 예외 승인됐던 extended Design 28,280B 는 새 한도 26,624B 도 넘어 예외 절차가 그대로 필요하다.
- doctor 의 `unknown-keys` 는 `workflowV2` 전용이라 그대로 두고, 최상위 `documentBudgets` 는 새 검사가 본다(Design 문구와의 작은 차이).
- QA 는 `npm run regression` 을 재실행하지 않았다(Do 에서 10/10).

## 증거

- `03-do/evidence/transactions/PT-03162a02-1563-4e95-ac79-ac1e416ae138.json` (readiness READY: test·lint·plugin-validator)
- `04-review/evidence/checks/secret-scan.json`
- 독립 QA handoff AS-f4a256ba-de2c-41cb-89c8-e2d119459bab (`04-review/evidence/handoffs/`)
