---
schema: vais-phase/v1
work_item: WI-2026-09-16-feature-bug-kinds
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 기능·버그 작업 (feature-bug-kinds)

## 1. 접근

구현 kind 의 Design 을 "사슬 위의 인용·선언" 으로 고정한다. `citation.js` 하나가 Design 본문의 `## 인용`·`## 신규` 를 파싱해 chain-index 와 비교하고, 같은 파서를 `do ready` 가 다시 써서 새 항목을 정본 문서에 붙인다. stale 검사·문서 append·`구현됨` 도장은 모두 transaction 안에서 일어나 AI 가 잊을 수 없다. 앱 실행은 `app-runner.js` 가 스크린샷 도구 앞뒤를 감싼다. 기존 kind(harness·ui·stage) 의 동작은 바꾸지 않는다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | feature/bug 양식 | Plan/Design 본문 | Gate 통과/실패 | 섹션 누락 → 실패 | `work-kinds.json` feature: `planTemplate one-line`, `designTemplate implementation`; bug: `designTemplate bugfix`(schema enum 추가). `phase-check` 섹션: implementation = options·citations(`## 인용`)·additions(`## 신규`)·checklist·write-scope·readiness-review·rollback; bugfix = 위 + `## 재현`·`## 원인`·`## 수정안`. one-line Plan 셋째 줄은 `관련 ID:`(stage-or-target 정규식에 추가). Do/Review/Report 는 짧은 양식 | TC-001 |
| REQ-002 | 인용 강제 | `## 인용` ID 목록, `## 신규` 항목(`### API-007 ← S-002` + `\| 항목 \| 내용 \|` 표) | `{cited[], added[]}` + findings | 미승인 인용·허용 밖 부모·번호 충돌·빈 사슬·인용·신규 모두 없음 → 실패 | `lib/workflow/v2/citation.js`: `parseCitations(content)`(인용 ID 정규식, 신규는 `id-chain.parseStageDocument` 의 항목 파서 재사용), `validateCitations(root, parsed)`: index 비어 있으면 "요구사항 정의서부터"; 인용은 `index.items[id]` 존재; 신규는 접두 → stage, 부모 허용표·`requireEach`, 부모는 index 또는 같은 `## 신규` 안, 번호 = 그 접두 다음 빈 번호(index + 신규 순서), stage 필수 항목 채움, 신규 항목의 stage 가 approved. `phase-check.inspectPhaseDocument` 가 implementation/bugfix Design 에서 호출 | TC-002 |
| REQ-003 | stale Gate | chain-index | Design 거부 | `STAGE_STALE_BLOCK` | `phase-transaction` design 분기: kind 가 implementation/bugfix 면 `computeStale` 결과가 있으면 transaction 을 거부(문서 쓰기 전), 메시지에 `stale 항목`·해소 두 경로 | TC-003 |
| REQ-004 | 문서 갱신·구현됨 | Design `## 신규`, READY, finalize | 정본 append, index `draft`→`approved`+`implemented` | 예산 초과 → NOT_READY | `citation.applyAdditions(root, item, parsed)`: 접두별로 정본 파일 끝에 `### ID ← 부모` + 표 append(파일은 approved 유지), `stageDocumentBudget` 초과면 finding. `do ready`: 내장 검사 `implementation-document`(재검증 + 예산 사전 계산) pass 이고 gate READY 일 때만 append 하고 index 에 `{status:'draft', workItem}` 등록, 정본·index 를 auxiliarySnapshots 에 넣어 실패 시 복구. `report finalize`: `citation.markImplemented(root, item)` 가 인용·신규 항목에 `implemented: {workItem, at}` 을, 신규는 `status: approved` 로. `product-note.renderCurrent` 에 `구현됨` 열(항목 수 중 implemented 수) | TC-004 |
| REQ-005 | bug kind | Design `## 재현`(절차 목록 + `재현 화면: <png>`), `## 원인`, `## 수정안`, `## 신규` TC, `## 해소 부채`(선택) | Review 재현 재실행 증거, Report 장부 해소 | 재현 화면 없음·"재현 불가" → Design 실패 | bugfix 검사: `재현 화면:` PNG 가 Work item 폴더 안에 존재(H4 `optionScreenshotFindings` 로직 재사용), 본문에 `재현 불가` 가 있으면 finding, `## 신규` 에 TC 접두 항목 ≥1. Review 양식(bugfix): `## 재현 재실행` + 증거 경로 + 기대·실제. finalize: `## 해소 부채` 불릿마다 장부 `note` "부채 해소: …"(refs) + milestone "버그 해결" | TC-005 |
| REQ-006 | 앱 실행 어댑터 | `vais.config.json > ui.run {command[], url, readyTimeoutMs}` | 캡처 뒤 종료 | 기동 실패·시간 초과 → `APP_START_FAILED` | `lib/workflow/v2/app-runner.js withApp(root, run, fn)`: `spawn(command[0], command.slice(1), {cwd, detached, stdio ignore})`, `url` 에 HTTP GET 이 응답할 때까지 300ms 간격 대기(기본 15s), `fn(url)` 실행, `finally` 에 프로세스 그룹 종료. `config.loadUiConfig` 에 `run` 파싱(command 는 배열만, 셸 없음). `screenCaptureCheck` 가 `ui.run` 있으면 target=`run.url` 로 `withApp` 안에서 캡처. 테스트 fixture `tests/fixtures/static-server.js`(node http 정적 서버) | TC-006 |
| REQ-007 | 화면 증거 | Design 인용·신규 접두 | screen-capture 부착 | — | `builtinChecks(do)`: kind 가 implementation 이고 `parseCitations` 의 인용·신규에 S·W·V 접두가 있으면 `screenCaptureCheck` 추가(정지점 없음, `screenCheck: false` 유지) | TC-007 |
| REQ-008 | QA 범위 | Design 검수표·TC | 배정 기준 | Review TC 집합 불일치 → 실패 | prompt hook review 지침(implementation/bugfix): `--criterion` 은 `## 검수표` 줄과 신규·인용 TC 만. `phase-check` review 추적: implementation/bugfix 는 Review 의 TC 집합 = Design 인용+신규 TC 집합(`citation.designTestCases`) | TC-008 |
| REQ-009 | 장면 B·D | fixture 사슬 1~10 + mini-booking | 통과 | — | `tests/regression/scene-b-feature.test.js`: feature 작업 — Plan 한 줄 → Design(안 2, 인용 `F-002, S-002`, 신규 `F-003 ← REQ-002`·`API-003 ← S-002, F-003`·`TC-003 ← F-003`, 검수표 3) → `2번` → 승인 → 앱 수정 → do ready(READY, 02·08·10 append, index draft, 화면 캡처) → review(TC-003) → 최종 승인 → finalize(implemented, README 구현됨 3). `tests/regression/scene-d-bug.test.js`: bug — 재현 화면 캡처 → Design(재현·원인·수정안·`TC-004 ← F-002`·해소 부채) → 승인 → 수정 → do ready → Review 재현 재실행 → finalize(10 문서 TC-004, 장부 note). 부정: stale 시 Design 거부, 인용 오타·번호 충돌·빈 사슬 거부 | TC-009 |
| REQ-010 | 문서·버전 | — | 3.6.0 | — | roadmap H5 완료·H6 진행, design.md 대응표(앱 실행·회귀 세트 A~F), README(feature/bug 흐름·`ui.run`), CLAUDE 10-6(인용 강제·문서 자동 갱신), ONBOARDING, CHANGELOG, 버전 5파일+배지. H5 잔여: "버전 6곳" → "버전 7면" 표기, hook `ledger-add-invalid` 분기 삭제 | TC-010 |

## 3. 결정

- 구현 kind 의 Design 에서 "만드는 것" 은 인용 ID 와 신규 ID 항목만이다. 서술은 `## 안 N` 의 접근 설명에만 둔다.
- 신규 항목은 Do 가 READY 일 때 runtime 이 정본에 붙인다. AI 가 제품 문서를 직접 편집하지 않는다(write scope 도 열지 않음).
- 신규 항목은 append 시 `draft`, Report 확정 시 `approved` + `implemented`. 승인 없는 항목이 사슬에 남지 않는다.
- stale 은 Design 제시 자체를 막는다(문서를 쓰기 전). 해소는 재승인 또는 `/vais 변경 없음 확인`.
- 앱 실행 명령은 배열로만 받고 셸을 거치지 않는다. 캡처 뒤 반드시 종료한다.
- 사슬이 비어 있으면 feature/bug 를 시작할 수 없다(예외 없음, 사용자 확인 2026-09-16).

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — work-kinds enum(`implementation`·`bugfix`), chain-index 항목 `status`·`implemented`, `ui.run` 파싱. TC-001·004·006 |
| 보안 | 필요 — 앱 실행은 배열 spawn·프로세스 그룹 종료·시간 초과, 문서 append 는 정본 파일 경계·예산 안. TC-004·006 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

Do 는 main voice(CTO)가 직접 구현한다. specialist 위임 없음. 쓰기 범위: `lib/**`, `hooks/**`, `scripts/**`, `schemas/**`, `contracts/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(clean-room, 읽기 전용) 가 TC-001~010 을 검증하되 `npm test`·`npm run regression` 을 직접 실행하고, 부정 케이스(stale·인용 오타·번호 충돌·빈 사슬·재현 화면 없음·앱 기동 실패)를 테스트 본문으로 본다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | feature/bug 섹션 목록, 누락 시 실패, harness·ui 불변 | 기대대로 |
| TC-002 | 인용 승인 확인·오타 후보·허용 밖 부모·번호 충돌·빈 사슬·인용 신규 모두 없음·필수 항목 누락 | 각 finding |
| TC-003 | stale 시 design present 거부, 해소 뒤 통과 | 기대대로 |
| TC-004 | READY 뒤 정본 append·index draft, 예산 초과 NOT_READY, finalize 뒤 approved+implemented, README 구현됨 열 | 기대대로 |
| TC-005 | 재현 화면 없음·재현 불가 거부, 신규 TC 필수, Review 재현 재실행 섹션, finalize 장부 note | 기대대로 |
| TC-006 | 정적 서버 fixture 기동·URL 대기·캡처(stub)·종료, 잘못된 명령 → APP_START_FAILED, 시간 초과 | 기대대로 |
| TC-007 | S 인용 feature 는 캡처, F 만 인용 feature 는 캡처 없음 | 기대대로 |
| TC-008 | review TC 집합 ≠ Design TC 집합 → 실패, hook 지침에 검수표·TC | 기대대로 |
| TC-009 | `npm run regression` 장면 B·D | 통과 |
| TC-010 | 3.6.0·CHANGELOG·roadmap·대응표·7면 표기·죽은 분기 없음 | 기대대로 |

## 8. rollback

work-kinds.json 의 feature/bug template 을 `full` 로 되돌리면 인용 검사·append 가 꺼진다. append 된 항목은 index 에 `draft` 로 남아 `stage reindex` 가 아니라 해당 작업의 revert 로 물린다. `ui.run` 을 지우면 정적 파일 캡처로 돌아간다.

## 9. QA 수정 1

REQ-010 누락 2곳(design.md 회귀 세트 행, CLAUDE.md 상태 줄)을 Do 에서 고친다. 동작 변경 없음.
