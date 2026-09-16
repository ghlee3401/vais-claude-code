---
schema: vais-phase/v1
work_item: WI-2026-09-16-ui-loop
phase: do
revision: 1
status: draft
based_on: []
---

# Do — UI 루프 (ui-loop, 수정 회차 1)

## 변경

| REQ | 구현 |
|---|---|
| REQ-001 | `contracts/work-kinds.json` ui: `planTemplate one-line`, `designTemplate options-screens`, `screenCheck true`, 트리거 확장. schema enum·`screenCheck`. `phase-check.js`: `requiredSectionsFor` 가 kind 의 template 을 따름(non-stage 포함), `design-screens` 섹션(안·데스크톱/모바일·검수표·쓰기 범위·readiness·rollback), `optionScreenshotFindings`(사본·데스크톱·모바일 경로가 Work item 폴더 안 실제 파일, PNG), 안 개수 상한, 짧은 양식 kind 는 REQ/TC 추적 생략 |
| REQ-002 | CLI `screens capture --id --session --target --out`(현재 phase 폴더 안·프로젝트 안 파일 또는 http(s)) + `write-policy` 공개 명령 |
| REQ-003 | `state-machine.js`: `hasScreenCheck` 이면 READY → `do/waiting-user`; 이벤트 `USER_OPTION_CHOSEN`·`USER_SCREEN_CONFIRMED`·`USER_SCREEN_REVISED`; options-screens 는 선택 없이 승인 불가; checkpoint 조건에 `screenRevisionCount`. `router.js`: `N번`→choose-option, do/waiting-user 에서 확인/수정/새 작업 분기, blocked 에서 확인. prompt hook: 이벤트 연결·`uiPhaseLines`·도움말. `phase-transaction.js` repairDesign 조건에 screenRevisionCount |
| REQ-004 | 6번째 `USER_SCREEN_REVISED` → `do/blocked` `screen-revision-limit`, 그 상태에서 확인·취소만. schema `screenRevisionCount 0..5`, `chosenOption`. **수정 회차 1(1차 QA TC-004 FAIL)**: prompt hook `screen-revise` 분기가 전이 결과 blocked 를 가려 "상한 5회 도달 — `/vais 확인` 또는 `/vais cancel`" 지침을 내고(취향 기록·Design 복귀 문구 제거), 남은 수정 기회 수를 함께 보임. `statusLine` 이 blocked 일 때 `blockReason` 표시. 단위 테스트 TC-004 에 두 경우 추가 |
| REQ-005 | `lib/workflow/v2/screen-capture.js`: `findChrome`(`VAIS_CHROME`·후보), `capture`(1280×800·390×844, `--headless=new`, 임시 프로필, 20초), `renderArtifact`, stub 렌더러(`VAIS_SCREEN_RENDERER=stub`, 결과에 renderer 표기), `CHROME_NOT_FOUND`·`CAPTURE_TARGET_MISSING` |
| REQ-006 | 내장 검사 `screen-capture`(`screenCaptureCheck`): round-N 캡처, `round-0` 은 `git ls-tree/show HEAD` 로 커밋 상태 재구성, 실패는 NOT_READY. Review 는 Do 의 결과 재사용. `review-page.js`: `review prepare` 가 `04-review/evidence/review.html` 생성, receipt `reviewPage` |
| REQ-007 | `diff-summary.js`: 앱 파일 `round-N/src` 스냅샷, CSS 선언 비교(`선택자 속성: a → b`, @media 접두), 기타 파일명, `diff.md` |
| REQ-008 | `ledger.js`: 수정 요청 → preference, 안 선택 → decision, ui 최종 승인 → preference "채택". prompt hook `ledgerLinesFor` 가 ui·W·V·DS Design 에 제품 전체 preference 주입 |
| REQ-009 | `chain-stages.json` W·V `renderArtifacts`, `id-chain.renderStageArtifacts` — html/svg → 같은 폴더 PNG, 실패 finding. 장면 A 는 stub 으로 대체 |
| REQ-010 | `doctor.js` `browser`, `statusline` 이 프로젝트 `.claude/settings*.json` 도 검사(H3 잔여 결함 해소 — 실제 저장소에서 pass) |
| REQ-011 | `tests/regression/scene-c-ui-loop.test.js`(git 임시 repo, fixture mini-booking) |
| REQ-012 | 버전 3.4.0 5파일+배지, CHANGELOG, roadmap H3 완료·H4 진행, design.md 대응표 5행, CLAUDE 10-5·구조, README UI 루프·Chrome 의존성, ONBOARDING, `vais.config.json > ui` |

설계와 다른 점: ui kind 의 Do·Review 문서 양식도 짧은 양식(변경·증거 / 기대·실제·증거)을 쓴다 — Plan 이 한 줄이라 REQ/TC 추적 집합이 없기 때문. `screenshot-compare` 는 예약 자리만(내장·미실행). 수정 회차 1 의 변경은 `hooks/workflow-v2-prompt.js` 와 `tests/v2-ui-loop.test.js` 두 파일뿐이다.

## 증거

- 단위 `node --test tests/*.test.js` 전부 pass (신규 `tests/v2-ui-loop.test.js` 22: TC-001~010·012, 실제 Chrome 캡처 1건 포함 — 이 컴퓨터에서 skip 없이 통과; 1차 QA 집계 207 tests)
- 회귀 `npm run regression` 7 pass (장면 A·C·E·F). 장면 C: 시안 2안 → `2번` → 승인 → 회차 1 전/후 → 수정 2회 diff(`padding 15px 20px → 22px 30px`, `background var(--accent) → #1d4ed8`) → `확인` → review.html → QA → 최종 승인 → decisions.md 취향 3건
- `npm run lint` 0, `node scripts/vais-validate-plugin.js` 오류 0
- `npm run doctor` fail 0 · warn 1(plugin-cache 3.3.0≠3.4.0 예상). `browser` pass(/usr/bin/google-chrome), `statusline` pass(프로젝트 설정)
- 실제 Chrome 렌더: 장면 A 첫 실행에서 W html·V svg 가 실제 Chrome 으로 PNG 렌더됨 → 이후 stub 로 대체
- readiness receipt: test · lint · plugin-validator (transaction 실행)
