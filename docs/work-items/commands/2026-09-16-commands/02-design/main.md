---
schema: vais-phase/v1
work_item: WI-2026-09-16-commands
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 사용자 명령 (commands)

## 1. 접근

명령은 router 가 정규식으로 결정적으로 인식하고, 읽기 명령(상태·설명·제안·기록 보기)은 hook 이 CLI 를 부르게 해 결과 문장을 그대로 보이게 한다. 쓰기 명령(저장·되돌리기·기록)은 두 단계다: 첫 명령은 제안만 보이고, 사용자가 확인 문구를 직접 치면 prompt hook 이 그 세션 authorization 에 **확인 토큰**(`confirmations[]`)을 넣고, CLI 는 토큰이 일치할 때만 git 이나 장부를 건드린다. H2 의 `stageConfirmations` 와 같은 원리라 AI 가 대신 확인할 수 없다. git 은 CLI 안의 `execFileSync` 로 `add -A`·`commit`·`revert --no-edit` 세 가지만 실행하고 push 는 없다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | `/vais 상태` | 없음 | 사람 말 한 단락 | 상태 파일 없음 → "시작 전" | `hooks/session-start.js` 의 `buildBriefing` 을 `lib/workflow/v2/briefing.js` 로 옮기고 hook 은 import. CLI `status` 결과에 `summary`(브리핑 문장) 추가. hook 의 `status` action 지침: `status` 를 실행해 `summary` 를 그대로 보인다 | TC-001 |
| REQ-002 | `/vais 설명 <대상>` | ID·용어·경로 | `{kind: id\|term\|file\|unknown, text, refs[], candidates[]}` | 미지 → unknown + 후보 | `lib/workflow/v2/explain.js explain(root, target)`: ID(`^[A-Z]{1,4}-\d{3}$`) → chain-index 항목(단계·부모·자식·workItem·approvedAt·stale) + 정본 파일; 용어 → `contracts/glossary.json`(데이터: 용어·쉬운 설명·관련 문서, 한글·영문 동의어); 경로 → 정본 종류(단계 문서·phase 문서·노트) 와 frontmatter 상태·관련 Work item; 그 외 → 후보(ID 접두 유사·용어 부분 일치). router `^(설명\|explain)\s+(.+)$` → `explain`(읽기). CLI `explain --target` | TC-002 |
| REQ-003 | `/vais 저장 [메시지]` → `/vais 저장 확인[: 메시지]` | 메시지(선택) | 제안: 버전 6곳·변경 파일·제안 메시지·경고 / 확인: 커밋 해시 | 버전 불일치·변경 없음·git 없음 → 거부 | `lib/workflow/v2/vcs.js`: `saveProposal(root)` = `versionFiles`+README 배지+CHANGELOG 헤더 비교, `git status --porcelain`, 메시지 제안(최근 완료 Work item 제목·kind, 진행 중이면 경고+ID), trailer `Work-Item:`·`Generated-By: vais-code <version>`. `commitSave(root, {sessionId, message})`: authorization.confirmations 에 `{type:'save'}` 있어야 함 → `git add -A` → `git commit -F <tmp>` → 해시. router `^(저장\|save)(?:\s+(.+))?$` → `save`(읽기), `^(저장\|save)\s*확인(?:\s*[:：]\s*(.+))?$` → `save-confirm`(hook 이 토큰 발급). CLI `save propose`, `save commit --session [--message]` | TC-003 |
| REQ-004 | `/vais 되돌리기 <대상>` → `/vais 되돌리기 확인: <대상>` | WI id 또는 커밋 해시 | 제안: 커밋 목록(해시·제목·파일)·동결 Report 경고 / 확인: revert 커밋 해시 | 대상 없음·충돌 → 거부, 트리 복구 | `vcs.js revertProposal(root, target)`: WI id → `git log --grep=<id>` 커밋들, 해시 → 존재 확인; 각 커밋 파일 목록(`git show --name-only`). `revertCommits(root, {sessionId, target})`: 토큰 `{type:'revert', target}` 필수 → 최신순 `git revert --no-edit <hash>`; 실패 시 `git revert --abort` 후 throw. router `^(되돌리기\|revert)\s+(\S+)$` → `revert`, `^(되돌리기\|revert)\s*확인\s*[:：]\s*(\S+)$` → `revert-confirm`. CLI `revert propose --target`, `revert commit --session --target` | TC-004 |
| REQ-005 | `/vais 제안` | 없음 | 제안 ≤3 문장 | — | `proposal.propose` 를 CLI `propose` 로 노출, hook 지침이 결과를 사람 말로 보인다. router `^(제안\|propose\|suggest)$` | TC-005 |
| REQ-006 | `/vais 기록 <종류> <내용>`, `/vais 기록 보기 [종류]` | 종류(결정·피드백·취향·부채·리스크·메모 / 영문), 내용 | 장부 항목 / 최근 10건 | 종류 오류 → 거부 | router `^(기록\|note)\s+(종류)\s+(.+)$` → `ledger-add`(hook 이 토큰 `{type:'ledger', kind, text}` 발급), `^(기록\s*보기\|notes)(?:\s+(종류))?$` → `ledger-list`(읽기). CLI `ledger add --session --kind --text`(토큰의 kind·text 와 일치해야 함, `source {type:user}`), `ledger list [--kind] [--limit]`. 한글 종류 → 영문 매핑은 `ledger.js KIND_ALIASES` | TC-006 |
| REQ-007 | 확인 토큰 | 사용자 프롬프트 | `authorization.confirmations[]` | 토큰 없음 → CLI 거부 | `authorization-store.grant` 에 `confirmations` 필드(`{type, target, kind, text}`), prompt hook `main` 이 route.action 별로 채움(`save-confirm`·`revert-confirm`·`ledger-add`). 다른 turn 의 토큰은 authorization 재발급으로 사라진다(1회성). HELP_LINES 에 명령 8종. write-policy PUBLIC 에 `explain`·`save`·`revert`·`propose`·`ledger` | TC-007 |
| REQ-008 | H4 잔여 | — | — | — | `state-machine`: `USER_DESIGN_REVISED` 와 material=true `DESIGN_CHECKPOINT_COMPLETED` 에서 `chosenOption = null`; `work-kinds.json` ui 트리거 `색` → `색상`·`색이`·`색을`·`색은`; `phase-transaction` report: `outcome` 500자 초과면 `REPORT_OUTCOME_TOO_LONG` 으로 거부(잘라 쓰지 않음) | TC-008 |
| REQ-009 | doctor `git` | repo | pass/warn | — | `git rev-parse` 실패 → warn "git 저장소 아님, 저장·되돌리기 불가"; 미커밋 변경 n → pass 에 표시; 원격 없음 → warn "push 불가" | TC-009 |
| REQ-010 | 회귀 | 임시 git repo | 통과 | — | `tests/regression/commands.test.js`: 버전 파일 6곳 갖춘 임시 repo + 커밋. 상태 → 설명(ID·용어·파일·미지) → 기록(라우트→토큰→CLI) → 기록 보기 → 저장 제안 → 확인 없이 커밋 거부 → `저장 확인` 토큰 → 커밋 해시·trailer → 파일 수정·커밋(WI id 포함) → 되돌리기 제안 → 확인 → revert 커밋·파일 원복 → 제안. 버전 불일치 시 저장 거부 | TC-010 |
| REQ-011 | 문서·버전 | — | 3.5.0 | — | roadmap H4 완료·H5 진행, design.md 대응표(명령 다섯+제안·기록, 설명, 저장·되돌리기 완료), README 명령 표(8종·확인 규칙), CLAUDE(15 커밋 규칙을 `/vais 저장` 흐름으로), ONBOARDING, CHANGELOG, 버전 5파일+배지 | TC-011 |

## 3. 결정

- 쓰기 명령은 항상 두 단계다. 확인 문구는 사용자 프롬프트에서만 토큰이 되고 같은 세션 authorization 안에서 1회만 유효하다.
- runtime 이 실행하는 git 은 `add -A`·`commit`·`revert --no-edit`(실패 시 `--abort`) 셋뿐이다. push·force·reset 은 없다.
- 커밋 메시지에는 Work item ID 와 `Generated-By: vais-code <version>` trailer 가 붙어 되돌리기가 ID 로 커밋을 찾을 수 있다.
- 용어 사전은 데이터(`contracts/glossary.json`)로 두어 코드 수정 없이 늘린다.
- 브리핑 문장 생성을 lib 로 옮겨 상태 명령·세션 시작·상태 줄이 한 출처를 쓴다.
- Report 결과 500자 초과는 조용히 자르지 않고 거부한다(동결 문서는 고칠 수 없으므로).

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 보안 | 필요 — git 인자는 `execFileSync` 배열로만(셸 없음), 메시지는 `-F` 임시 파일, 확인 토큰 없는 실행 거부, 되돌리기 대상은 존재하는 해시·WI id 만. TC-003·004·007 |
| 데이터 계약 | 필요 — glossary schema(`schemas/glossary.schema.json`), authorization `confirmations` 필드, ledger `source.type user`. TC-002·006·007 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

Do 는 main voice(CTO)가 직접 구현한다. specialist 위임 없음. 쓰기 범위: `lib/**`, `hooks/**`, `scripts/**`, `schemas/**`, `contracts/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(clean-room, 읽기 전용) 가 TC-001~011 을 검증하되 `npm test`·`npm run regression` 을 직접 실행하고, 확인 토큰 없는 CLI 실행이 거부되는지 테스트 본문으로 본다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | `status` summary 활성 있음/없음 | 브리핑과 동일 문장 |
| TC-002 | 설명 ID·용어·파일·미지 | 종류별 필드, 미지는 후보 |
| TC-003 | 저장 제안·확인 없이 commit 거부·토큰 뒤 커밋·버전 불일치 거부 | 기대대로 |
| TC-004 | 되돌리기 제안(WI id·해시)·없는 대상 거부·확인 뒤 revert·파일 원복 | 기대대로 |
| TC-005 | `propose` CLI = 브리핑 제안 | 일치 |
| TC-006 | 기록 종류 6·한글 매핑·종류 오류·보기 10건 | 기대대로 |
| TC-007 | router 8종, HELP, 토큰 없는 ledger add·save commit·revert commit 거부, 다른 세션 토큰 거부 | 기대대로 |
| TC-008 | revised·material checkpoint 뒤 chosenOption null, `검색` 요청은 ui 아님, outcome 501자 거부 | 기대대로 |
| TC-009 | doctor git 3 경우 | pass/warn |
| TC-010 | `npm run regression` commands | 통과 |
| TC-011 | 3.5.0 6곳·CHANGELOG·roadmap·대응표 | 기대대로 |

## 8. rollback

router 의 새 패턴을 지우면 명령이 일반 요청으로 돌아간다. `vcs.js` 는 CLI 에서만 불리므로 CLI 분기를 지우면 git 실행 경로가 사라진다. 장부 항목은 append-only 라 삭제하지 않는다.
