---
schema: vais-phase/v1
work_item: WI-2026-09-16-product-note
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 제품 노트 (product-note, 수정 회차 1)

## 변경

| REQ | 구현 |
|---|---|
| REQ-001 | `lib/workflow/v2/ledger.js` (append·read·recent·summarize·extractDecisions·entriesForTransition), `schemas/ledger-entry.schema.json`, `contracts.js` 등록. 수정·삭제 API 없음 |
| REQ-002 | `work-item-store.js` `recordLedger` 를 `apply`·`applySequence` 잠금 안에서 호출. `phase-transaction.js` report 가 `limitations` 를 payload 로 전달. prompt hook 이 revise·reject 원문을 `payload.reason` 으로 넘김 |
| REQ-003 | `lib/workflow/v2/product-note.js` — store 가 `completed` 전이 때 3면 재생성(스냅샷 복구 포함) |
| REQ-004 | `lib/workflow/v2/proposal.js` — 우선순위 7 규칙, ≤3 |
| REQ-005 | `hooks/session-start.js` + `hooks.json` SessionStart, `lib/io.js outputSessionContext` |
| REQ-006 | `scripts/vais-statusline.js`, doctor `statusline` |
| REQ-007 | `hooks/workflow-v2-stop.js` + `hooks.json` Stop, `outputStopBlock`. 신호 A 는 "updatedAt 이 마지막 사건보다 1초 이상 뒤" 또는 "장부 필요 사건에 줄 없음" 으로 좁혀 오탐을 막았다 |
| REQ-008 | `doctor.js` `hook-events`·`ledger`·`chain-stale`·`statusline` |
| REQ-009 | prompt hook `ledgerLinesFor` → Design 지침 |
| REQ-010 | `id-chain.js` artifactExists 경로 봉쇄, computeStale `parentMissing`, confirmUnchanged 거부; TC-008 scope 를 실제 transaction 으로 검증 |
| REQ-011 | `tests/regression/scene-e-session-resume.test.js` |
| REQ-012 | 버전 3.3.0 (5파일 + README 배지), CHANGELOG, roadmap H2 완료·H3 진행, design.md 대응표, CLAUDE 10-4·구조, ONBOARDING |

수정 회차 1 (1차 QA TC-012 FAIL): `tests/v2-product-note.test.js` 의 수정 요청 fixture 를 secret-scan 허용 값(`secret123456`)으로 바꾸고 allow-fixture 표식을 붙였다. 제품 코드 변경 없음. 설계와 다른 점: 노트 렌더링을 store 의 `completed` 전이에서 한다(장부의 "작업 완료" 줄까지 담기 위해).

## 증거

- 단위 `node --test tests/*.test.js` TAP 집계 193 tests · 50 suites · fail 0 (신규 `tests/v2-product-note.test.js` 에 TC-001~010·012 와 hook stdin 프로세스 실행 포함). 1차 Do 문서의 "249" 는 dot 출력 개수 오기였다
- 회귀 `npm run regression` 6 pass (장면 A·E·F)
- `npm run lint` 0, `node scripts/vais-validate-plugin.js` 오류 0 (hook 이벤트 5종 인식)
- `npm run doctor` fail 0 · warn 2 (plugin-cache 3.2.0≠3.3.0 예상, statusline 미설치 안내)
- readiness receipt: test · lint · plugin-validator (transaction 실행). secret-scan 은 Review 에서 재실행
