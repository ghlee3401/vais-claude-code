---
schema: vais-phase/v1
work_item: WI-2026-09-16-feature-bug-kinds
phase: do
revision: 1
status: draft
based_on: []
---

# Do — feature-bug-kinds (QA 수정 1 반영)

## 구현 변경

- REQ-001 `work-kinds.json` feature one-line/implementation, bug one-line/bugfix + schema enum. `phase-check.js` 절 목록 4종(implementation·bugfix·review 두 변형), Plan `관련 ID`.
- REQ-002 `lib/workflow/v2/citation.js` 신설: 인용·신규·검수표·재현·해소 부채 파싱, 사슬 대조(없는 인용·다음 빈 번호·미승인 단계·필수 항목·부모·중복), `citationFindings` 로 Design Gate 연결.
- REQ-003 design 분기 stale Gate `STAGE_STALE_BLOCK`(쓰기 전 거부).
- REQ-004 `applyAdditions`(do ready READY 때 정본 끝에 붙임 + index draft, 같은 작업 draft 교체, 스냅샷 롤백), `markImplemented`(report finalize, draft→approved + implemented), `approveStage` 도장 보존, 제품 노트 `구현됨` 열.
- REQ-005 bugfix 검사(재현 PNG·재현 불가·원인·수정안·신규 TC), Review `재현 재실행`, ledger `버그 해결`·`부채 해소`.
- REQ-006 `app-runner.js` `withApp`(argv spawn → URL 폴링 → 콜백 → 프로세스 그룹 종료, `APP_START_FAILED`), `loadUiConfig.run`, `screenCaptureCheck`·`screens capture` 연동, fixture `static-server.js`.
- REQ-007 S·W·V 인용 feature 는 Do 에 `screen-capture` 내장 검사 추가.
- REQ-008 hook `implementationPhaseLines`(검수표·TC 기준), Review TC 집합 = 인용·신규 TC.
- REQ-009 장면 B·D 회귀 + 단위 11건.
- REQ-010 3.6.0 7면, CHANGELOG, README·CLAUDE 10-6·ONBOARDING·roadmap·design.md·glossary, 죽은 분기 삭제. **QA 수정 1**: design.md 회귀 세트 행 → 완료 (H6), CLAUDE.md 상태 줄 → H1~H5 완료·H6 진행.

## 검증 증거

- Design TC-001~008 ↔ `tests/v2-feature-bug.test.js` 11건 PASS, TC-009 ↔ `npm run regression` 10/10, TC-010 ↔ version-sync·문서 grep.
- `npm test` 전체 PASS(기존 transaction 테스트는 `kind: harness` 명시), lint 0 경고, plugin validator 오류 0.
- 독립 QA 1회차 handoff: REQ-001~009 PASS, REQ-010 문서 2곳 → 이번 라운드에서 수정.
