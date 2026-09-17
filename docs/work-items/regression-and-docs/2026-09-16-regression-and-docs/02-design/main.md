---
schema: vais-phase/v1
work_item: WI-2026-09-16-regression-and-docs
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 회귀 세트와 문서 정리 (regression-and-docs)

## 1. 접근

새 동작은 없다. 저장 명령의 결함 셋을 `vcs.js`·`router.js` 두 파일에서 고치고, 회귀 7 파일이 공유하는 준비 코드를 helper 하나로 모아 머리말을 통일하고, 문서 셋·대응표·로드맵을 4.0.0 시점으로 다시 쓴다. 상태 머신·양식·계약·스키마는 건드리지 않는다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 회귀 세트 정리 | `npm run regression` | 7 파일 PASS | 60초 초과 → finding | `tests/regression/helpers.js` 신설: `makeRoot(t, prefix, config)`, `copyDir`, `installStage`·`approveChain(root, upTo)`(product-stages fixture), `write`, `grant`, `userSays`, `qaPass(judgment)`, `git`. 장면 A·B·C·D·E·commands 가 이 helper 를 쓰고 파일 머리 주석을 `// 장면 X — design.md §11 … / 검증: … / 렌더러: stub` 로 통일. F 는 실패 장면이라 helper 불필요, 머리말만 | TC-001 |
| REQ-002 | 저장 확인이 커밋까지 | 확인 토큰, 작업 폴더 | 커밋 해시 | add·commit 실패 → `SAVE_FAILED` + 사용자 말 reason | `vcs.commitSave`: `git add -A -- .`(`.gitignore` 존중) 뒤 `git rm -r --cached -q --ignore-unmatch -- .vais` 로 무시 규칙 없는 프로젝트에서도 `.vais/` 를 스테이지에서 뺀다(exclude pathspec 제거). add·commit 을 try/catch 로 감싸 실패 시 `git diff --cached --name-only` 수로 "스테이지 N개 됨 · 커밋 안 됨 · 원인" reason 을 만든다 | TC-002 |
| REQ-003 | `commit` 별칭 | `/vais commit`, `/vais commit 확인[: 메시지]`, `commit confirm` | save / save-confirm 라우팅 | `commit <다른 말>` 은 새 요청 | `router.COMMAND_PATTERNS`: save-confirm `^(?:저장|save|commit)\s*(?:확인|confirm)(?:\s*[:：]\s*(.+))?$`, save `^(?:저장|save)(?:\s+(.+))?$` 또는 정확히 `^commit$`. hook 도움말 표에 별칭 표기, `contracts/glossary.json` save 항목에 `commit` 이름 추가 | TC-003 |
| REQ-004 | 변경 목록 앞 점 보존 | `git status --porcelain` | 파일 경로 원형 | — | `vcs.git()` 에 `{ raw: true }` 옵션(trim 생략). `changedFiles` 는 raw 출력을 줄 단위로 `/^(..)\s(.*)$/` 로 파싱. 첫 줄이 `.claude-plugin/...` 이어도 점 유지 | TC-004 |
| REQ-005 | 문서 셋 정리 | README·ONBOARDING·CLAUDE | 4.0.0 시점 문서 | — | CLAUDE: 상태 줄 "H1~H7 완료(4.0.0), H8 남음", 규칙 10-1→10-6 순서 정렬(10-6 을 10-5 뒤로), 구조도 모듈 수·tests 표기, Testing 에 회귀 helper 한 줄. README: 명령 표에 `commit` 별칭과 "저장 실패 시 스테이지만 됨" 안내, 사용 순서를 새 제품 → 기능·버그 → 화면 → 저장 흐름으로 정렬. ONBOARDING: 읽는 순서 11 → 6 묶음(입구·상태 머신·사슬·기록·화면·명령/구현) | TC-005 |
| REQ-006 | 대응표·로드맵·장면 표 | `docs/harness/{design,roadmap}.md` | 상태 최종화 | — | design.md 대응표: 남은 "신규·변경·진행 중" 행을 완료(H번호) 또는 보류(H8) 로. §11 장면 표에 파일 열 추가(A~F + commands). roadmap: H6 완료(3.6.0), H7 진행 중 → Report 뒤 다음 라운드에서 완료 표기 | TC-006 |
| REQ-007 | 4.0.0 | 버전 7면 | version-sync PASS | — | package.json, vais.config.json, plugin.json, marketplace.json ×2, README 배지, CHANGELOG [4.0.0]("루프·양식·노트·명령·kind 완성" 요약 + 3.1~3.6 절 링크). commands TC-011 버전 검사는 ≥3.5.0 유지 | TC-007 |

## 3. 결정

- 저장은 `git add -A -- .` 로 `.gitignore` 를 존중하고, `.vais/` 는 add 뒤 `git rm --cached` 로 빼낸다. exclude pathspec 은 무시 규칙과 겹치면 git 이 실패하므로 쓰지 않는다.
- `commit` 은 정확히 그 단어 하나일 때만 저장 별칭이다. 뒤에 말이 붙으면 새 요청으로 본다(저장 메시지는 `저장 <메시지>` 로만).
- 저장 실패 reason 은 사용자 말로 "스테이지 N개 됨 · 커밋 안 됨 · 원인" 을 담는다. 재시도는 runtime 이 하지 않는다.
- 회귀 helper 는 준비 코드만 모으고 판정 코드는 각 장면에 남긴다. 장면 파일 하나가 설계 §11 장면 하나다.
- 4.0.0 은 새 기능 없이 "사용자 루프·양식 넷·노트·명령·kind 가 한 벌 완성" 을 뜻한다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 불필요 — 스키마·계약 변경 없음(glossary 이름 추가만) |
| 보안 | 필요 — `git rm --cached` 가 `.vais/` 밖을 건드리지 않는지, add 가 `.gitignore` 를 존중하는지. TC-002 |
| UI·성능 | 필요(성능) — 회귀 총 시간 60초 이내. TC-001 |

## 5. 담당 · 쓰기 범위

Do 는 main voice(CTO)가 직접 한다. specialist 위임 없음. 쓰기 범위: `lib/**`, `hooks/**`, `scripts/**`, `contracts/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(clean-room, 읽기 전용)가 TC-001~007 을 `npm test`·`npm run regression` 직접 실행과 문서 대조로 검증한다. 특히 `.gitignore` 있는 임시 repo 저장 테스트와 `commit` 별칭 부정 케이스를 본다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | `npm run regression` 7 파일, 머리말 형식 grep, 총 시간 | PASS, 60초 이내 |
| TC-002 | `.gitignore` 에 `.vais/` 있는 임시 repo + `.vais/x` 파일 → `save commit` 성공, 커밋에 `.vais` 없음. `.gitignore` 없는 repo 도 `.vais` 미포함. 커밋 실패 강제 시 reason 에 "스테이지"·"커밋 안 됨" | 기대대로 |
| TC-003 | `commit`→save, `commit 확인`·`commit confirm: 메시지`→save-confirm(토큰 필요), `commit 기능 만들어`→새 요청 | 기대대로 |
| TC-004 | 첫 변경 파일이 `.claude-plugin/plugin.json` 일 때 changedFiles 경로가 점으로 시작 | 기대대로 |
| TC-005 | CLAUDE 10-5 가 10-6 앞, 상태 줄 4.0.0, README 에 `commit` 별칭·실패 안내, ONBOARDING 6 묶음 | grep 통과 |
| TC-006 | design.md 대응표에 "신규|변경|진행 중" 없음(H8 행 제외), §11 표 파일 열, roadmap H6 완료·H7 진행 | grep 통과 |
| TC-007 | 버전 7면 4.0.0, CHANGELOG [4.0.0], doctor pass | 기대대로 |

## 8. rollback

`vcs.js`·`router.js` 두 파일을 3.6.0 으로 되돌리면 저장 동작이 이전으로 돌아간다(별칭·reason 만 사라짐). helper 는 장면 파일이 import 하므로 함께 되돌린다. 문서는 git revert 로 충분하다.
