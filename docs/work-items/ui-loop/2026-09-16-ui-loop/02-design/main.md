---
schema: vais-phase/v1
work_item: WI-2026-09-16-ui-loop
phase: design
revision: 1
status: approved
based_on: []
---

# Design — UI 루프 (ui-loop)

## 1. 접근

그림은 기계가 만든다. 설치된 Chrome 을 헤드리스로 돌리는 `screen-capture.js` 하나가 시안·회차 화면·W/V 산출물을 모두 PNG 로 찍고, 상태 머신은 ui kind 에만 `do/waiting-user`(화면 확인 정지점)를 추가한다. 수정 요청은 기존 Design 세부 수정(material=false) 경로를 재사용해 회차마다 "무엇을 바꿨나" 가 Design 정본에 남고, 회차 diff 는 CSS 선언을 기계로 비교해 문장으로 만든다. 취향은 장부 `preference` 로 남기고 ui·W·V Design 시작 시 feature 무관하게 주입한다. 앱 위치는 `vais.config.json > ui` 블록(appRoot·entry·url)으로 받는다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | ui kind 양식 | Plan/Design 본문 | Gate 통과/실패 | 스크린샷 누락 → Design 실패 | `work-kinds.json` ui: `planTemplate: one-line`, `designTemplate: options-screens`, triggers 에 `화면`, `버튼`, `색`, `눈에 안 띔`, `레이아웃` 추가. schema enum 에 `options-screens`. `phase-check.requiredSectionsFor` 가 stage kind 가 아니어도 kind 의 template 을 따른다. one-line Plan 섹션: 요청 확인·kind·대상 화면. options-screens Design: `## 안 N` 마다 `데스크톱: <png>`·`모바일: <png>` 줄이 있고 파일이 Work item 폴더 안에 실제로 존재해야 한다(`optionScreenshotFindings`). 안 개수 상한 규모별 1/2/3. REQ/TC 추적 집합 비교는 ui kind 에서 생략(H6 에서 ID 인용으로 대체) | TC-001 |
| REQ-002 | 시안 = 작업 사본 + 그림 | `ui.appRoot`, 안 N | `02-design/options/N/` 사본 + `desktop.png`·`mobile.png` | 사본 없음 → Design 실패 | Design 단계 write scope 는 Work item 폴더뿐이므로 사본은 `02-design/options/N/` 아래에 둔다(appRoot 의 파일을 복사해 CSS/HTML 을 바꾼 것). CLI `screens capture --id --session --target <경로|URL> --out <phase 폴더 안 dir>` 이 두 크기를 찍는다. Design 검사가 안 N 의 `사본:` 경로 존재도 확인 | TC-002 |
| REQ-003 | 화면 확인 정지점 | do READY, 사용자 문장 | 상태 전이 | 다른 kind 는 영향 없음 | `state-machine`: kind 가 `screenCheck: true`(work-kinds 새 필드, ui 만 true) 면 `READINESS_READY` → `do/waiting-user`. 새 이벤트 `USER_SCREEN_CONFIRMED`(do/waiting-user → review/active), `USER_SCREEN_REVISED`(do/waiting-user → design/active, `screenRevisionCount += 1`, `approvals.design` 유지). `DESIGN_CHECKPOINT_COMPLETED` 허용 조건에 `screenRevisionCount > 0` 추가(material=false → do). router: do/waiting-user 에서 `확인|됐다|됐어|confirm|done` → `screen-confirm`, 그 외 문장 → `screen-revise`(text). prompt hook: `screen-confirm`·`screen-revise` 를 applyDeterministicRoute 에 연결(payload.reason = 원문), 정지점 지침 주입 | TC-003 |
| REQ-004 | 수정 상한 | screen-revise | blocked | 6회 → `screen-revision-limit` | `USER_SCREEN_REVISED` 가 `screenRevisionCount >= kind.repairLimit` 이면 `do/blocked` + blockReason. blocked 에서 `USER_SCREEN_CONFIRMED`·`USER_CANCEL` 만 허용. schema `screenRevisionCount 0..5`, `chosenOption`. **수정 회차 1**: prompt hook 의 `screen-revise` 분기는 전이 결과가 blocked 면 "5회 상한 — `/vais 확인` 또는 `/vais cancel`" 지침을 내고(취향 기록·Design 복귀 문구 금지), 응답 첫 줄 상태 표시 `statusLine` 은 blocked 일 때 `blockReason` 을 함께 보인다 | TC-004 |
| REQ-005 | 스크린샷 도구 | target(file 경로·URL), outDir | `desktop.png`(1280×800)·`mobile.png`(390×844) | Chrome 없음 → `CHROME_NOT_FOUND` + 설치 안내 | `lib/workflow/v2/screen-capture.js`: `findChrome(env)`(`VAIS_CHROME` → 후보 경로 목록), `capture(target, outDir, {sizes, renderer})` 가 `chrome --headless=new --disable-gpu --hide-scrollbars --window-size=W,H --screenshot=<png> <url>` 를 `spawnSync`(timeout 20s). `renderArtifact(file)`: `.html`·`.svg` → 같은 폴더 `.png`. 테스트용 `VAIS_SCREEN_RENDERER=stub` 이면 1×1 PNG 를 쓰고 receipt 에 `renderer: stub` 표기(실제 검증과 구분) | TC-005 |
| REQ-006 | 회차 화면 · 검수 페이지 | do ready, review prepare | `03-do/evidence/screens/round-N/{desktop,mobile}.png`, `round-0/`(전), `04-review/evidence/review.html` | 캡처 실패 → NOT_READY | ui kind 의 `do ready` 가 builtin 검사 `screen-capture` 로 `ui.entry`(file://) 또는 `ui.url` 을 찍고, 첫 회차에는 `git archive HEAD <appRoot>` 로 커밋 상태를 임시 폴더에 풀어 `round-0` 을 찍는다(git 없으면 "전 없음"). `review-page.js` 가 `review prepare` 에서 review.html(승인 시안 | 전 | 후, 회차 diff, Design 의 `## 검수표` ≤5줄)을 쓴다. hook 지침: "PNG 를 Read 로 열어 응답에 보인다" | TC-006 |
| REQ-007 | 회차 diff 요약 | round-N 과 round-(N-1) 의 앱 파일 사본 | `round-N/diff.md` + 한 줄 요약 | 변경 없음 → "변경 없음" | `diff-summary.js`: do ready 가 appRoot 파일을 `round-N/src/` 에 복사하고 이전 회차와 비교. CSS 는 `선택자 { 속성: 값 }` 을 파싱해 `.primary padding: 15px 20px → 18px 24px` 형식, 그 외 파일은 "변경: 파일명". 기계 추출만 | TC-007 |
| REQ-008 | 취향 장부 | screen-revise 원문, 선택 안, 최종 승인 | ledger preference | — | `ledger.entriesForTransition`: `USER_SCREEN_REVISED` → preference(원문, redact) + feedback 아님(취향으로만); `USER_DESIGN_APPROVED` 에 `chosenOption` 있으면 decision "안 N 선택"; ui kind `USER_FINAL_APPROVED` → preference "채택: 안 N". prompt hook `ledgerLinesFor`: ui·stage-wireframes·stage-mockups 는 feature 무관 preference 최근 5 도 주입 | TC-008 |
| REQ-009 | W·V 산출물 렌더 | stage-document 검사 | `wireframes/W-*.png`, `mockups/V-*.png` | 렌더 실패 → finding → NOT_READY | `id-chain.stageDocumentCheck` 가 stage 에 `renderArtifacts: true`(chain-stages 새 필드, W·V) 면 artifact 의 html/svg 를 `renderArtifact` 로 png 생성 후 존재 검사. png 는 artifactDir 안(write scope 안) | TC-009 |
| REQ-010 | doctor | — | 검사 `browser`, `statusline` 개선 | Chrome 없음 → warn | `browser`: `findChrome` 결과 경로 또는 warn+설치 안내. `statusline`: `~/.claude/settings.json`, `<root>/.claude/settings.json`, `<root>/.claude/settings.local.json` 중 하나에 있으면 pass | TC-010 |
| REQ-011 | 장면 C | fixture mini-booking | 통과 | — | `tests/regression/scene-c-ui-loop.test.js`: 임시 repo(git init·commit)에 fixture 복사, config `ui:{appRoot:'app', entry:'index.html'}`, `VAIS_SCREEN_RENDERER=stub`. ui Plan(one-line) → 승인 → options 1·2 사본+capture → design present → `/vais 2번` → 승인(chosenOption 2) → CSS 수정 → do ready → do/waiting-user, round-0·1 png, diff → "더 크게" → design/active → design present material=false → CSS 수정 → do ready → round-2 diff 에 padding 변화 → "색은 파랑" → 반복 → `/vais 확인` → review prepare → review.html → QA fixture → decide → 최종 승인 → finalize → decisions.md 취향 3건(수정 2 + 채택 1), screenRevisionCount 2. 단위: 6번째 revise blocked, 다른 kind 는 READY → review. 실제 Chrome 캡처 테스트 1건은 Chrome 없으면 skip 표시 | TC-011 |
| REQ-012 | 문서·버전 | — | 3.4.0 | — | roadmap H3 완료·H4 진행, design.md 대응표(정지점·screen-capture·review-page·diff-summary·screenshot-compare 자리 완료), CLAUDE 10-5(ui: 그림으로 보이기·정지점 명령), README(ui 루프·config ui), ONBOARDING, CHANGELOG, 버전 5파일 + 배지 | TC-012 |

## 3. 결정

- 그림 없는 승인은 없다: options-screens Design 과 ui do ready 는 PNG 가 없으면 Gate 를 통과하지 못한다. Chrome 이 없으면 멈추고 doctor 가 설치를 안내한다.
- 수정 요청은 Design 세부 수정(material=false) 경로를 재사용한다. 회차마다 Design 정본에 "수정 회차 N" 이 남아 무엇을 왜 바꿨는지 추적된다.
- 시안 사본은 Work item 폴더(`02-design/options/N/`) 안에만 둔다. 제품 코드는 Do 에서만 바뀐다.
- `vais.config.json` 에 `ui` 블록(appRoot·entry·url)을 추가한다. 이 Design 승인이 키 구조 변경 합의다. doctor `unknown-keys` 는 workflowV2 블록만 보므로 영향 없다.
- 테스트는 stub 렌더러로 결정적으로 돌리고 receipt 에 stub 임을 남긴다. 실제 렌더 검증은 Chrome 이 있는 환경의 별도 테스트와 사용자 확인으로 한다.
- 취향은 제품 전체 속성이라 feature 를 넘어 주입한다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| UI | 필요 — 시안 사본·검수 페이지 레이아웃은 main voice 가 만들되 장면 C fixture 시안 2안은 실제 CSS 변경으로 구성. TC-002·006 |
| 보안 | 필요 — `screens capture` 의 target 은 프로젝트 안 파일 또는 `http(s)://` 만, out 은 현재 phase 폴더 안만. Chrome 은 `--no-sandbox` 를 쓰지 않는다. TC-005 |
| 데이터 계약 | 필요 — work-kinds schema(`options-screens`, `screenCheck`), chain-stage schema(`renderArtifacts`), work-item schema(`screenRevisionCount`, `chosenOption`), check-result receipt 의 `renderer`. TC-001·004·009 |
| 성능 | 불확실 — 캡처 1장 ≈ 1~2초, 회차당 4장. 장면 C 는 stub 으로 돌려 CI 시간을 지킨다 |

## 5. 담당 · 쓰기 범위

Do 는 main voice(CTO)가 직접 구현한다. specialist 위임 없음. 쓰기 범위: `lib/**`, `hooks/**`, `scripts/**`, `schemas/**`, `contracts/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(clean-room, 읽기 전용) 가 TC-001~012 를 검증한다. QA 는 `npm test`·`npm run regression` 을 직접 실행하고, Chrome 이 있는 이 컴퓨터에서 실제 캡처 테스트가 skip 되지 않았는지 출력으로 확인한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | ui Plan one-line 통과, full Plan 거부; Design 안 2 + png 통과, png 누락 거부, extended 4안 거부 | 기대대로 |
| TC-002 | `screens capture` 가 phase 폴더 밖 out·프로젝트 밖 target 거부, 안 폴더 사본 존재 검사 | 거부·통과 |
| TC-003 | ui READY → do/waiting-user, 확인 → review, 수정 → design/active → checkpoint(false) → do; harness kind READY → review | 전이 일치 |
| TC-004 | revise 5회 뒤 6번째 → do/blocked `screen-revision-limit`, blocked 에서 확인 허용; hook 이 blocked 결과에 "5회 상한 — 확인 또는 cancel" 지침, 상태 줄에 blockReason | 기대대로 |
| TC-005 | findChrome 후보·env, stub 렌더러 PNG 2장, Chrome 없음 → CHROME_NOT_FOUND; 실제 Chrome 캡처 1장(없으면 skip) | 기대대로 |
| TC-006 | do ready 뒤 round-0·1 png, review prepare 뒤 review.html 에 시안·전·후·검수표 | 파일·내용 |
| TC-007 | CSS 값 변경 → `선택자 속성: a → b`, 무변경 → "변경 없음", 비 CSS → 파일명 | 문장 일치 |
| TC-008 | revise 2회·안 선택·최종 승인 뒤 ledger preference 3·decision 1, ui Design 지침에 다른 feature 의 preference 주입 | 기대대로 |
| TC-009 | fixture W html·V svg 가 stub/실제 렌더로 png 생성, 렌더 실패 시 finding | 기대대로 |
| TC-010 | doctor `browser` pass/warn, statusline 이 프로젝트 설정만 있을 때 pass | 기대대로 |
| TC-011 | `npm run regression` 장면 C | 통과 |
| TC-012 | 버전 3.4.0 6곳·CHANGELOG·roadmap H3 완료·design.md 대응표 | 기대대로 |

## 8. rollback

work-kinds.json 의 ui `screenCheck` 를 false 로 두면 정지점이 사라지고 기존 흐름으로 돌아간다. `renderArtifacts` 를 false 로 두면 W·V 렌더가 꺼진다. 캡처 산출물은 evidence 폴더 안이라 삭제해도 정본에 영향이 없다.

## 9. QA 수정 회차 1 (material=false)

1차 독립 QA TC-004 FAIL: 6번째 수정이 blocked 로 막힌 뒤 prompt hook 이 "취향 기록·Design 복귀" 지침을 내어 실제 상태와 모순되고, 상한 이유가 사용자에게 보이지 않았다. 고칠 것 두 가지 — ① `buildContext` 의 `screen-revise` 분기가 전이 결과 상태를 보고 blocked 면 상한 안내(`/vais 확인` 또는 `/vais cancel`)를 낸다, ② `statusLine` 이 blocked 상태에서 `blockReason` 을 함께 보인다. 단위 테스트(TC-004)에 두 경우를 추가한다. 설계 요소·쓰기 범위·check 는 변하지 않는다.
