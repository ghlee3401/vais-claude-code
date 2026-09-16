---
schema: vais-phase/v1
work_item: WI-2026-09-16-commands
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 사용자 명령 (commands)

## 변경

| REQ | 구현 |
|---|---|
| REQ-001 | `lib/workflow/v2/briefing.js`(`briefingFacts`·`statusSentence`·`buildBriefing`·`statusSummary`)로 브리핑 생성을 lib 로 옮김. `hooks/session-start.js` 는 import. CLI `status` 에 `summary` |
| REQ-002 | `lib/workflow/v2/explain.js`(ID·용어·파일·미지), `contracts/glossary.json` 24 용어 + `schemas/glossary.schema.json`(contracts 등록). CLI `explain --target` |
| REQ-003 | `lib/workflow/v2/vcs.js`: `versionReport`(manifest 5 + README 배지 + CHANGELOG 헤더, 다수결 기준 mismatches), `saveProposal`, `commitSave`(토큰 필수, `git add -A -- . :(exclude).vais/`, `commit -F`). CLI `save propose`, `save commit` |
| REQ-004 | `vcs.js revertProposal`(WI id → `git log --grep`, 해시 → verify, 파일 목록, 동결 Report·미커밋 경고), `revertCommits`(토큰 필수, 미커밋 있으면 거부, `revert --no-edit`, 실패 시 abort). CLI `revert propose`, `revert commit` |
| REQ-005 | CLI `propose` = `proposal.propose` |
| REQ-006 | `ledger.js` `KIND_ALIASES`·`USER_KINDS`·`normalizeKind`. CLI `ledger add`(토큰의 kind·text 일치, `source user`), `ledger list [--kind] [--limit]` |
| REQ-007 | `router.js COMMAND_PATTERNS`·`routeCommand`(8 명령, 미지 종류의 `기록` 은 일반 요청으로 통과), `authorization-store` `confirmations[]`, prompt hook `confirmationsFor`·`commandGuidance`·HELP 갱신, write-policy: 읽기 명령 인가 불요·쓰기 명령 PUBLIC |
| REQ-008 | `state-machine`: `USER_DESIGN_REVISED`·material checkpoint 에서 `chosenOption=null`; `work-kinds.json` ui 트리거 `색상·색이·색을·색은`; `phase-transaction.reportBody` outcome 500자 초과 `REPORT_OUTCOME_TOO_LONG` 거부(잘라 쓰기 제거) |
| REQ-009 | `doctor.js checkGit`(저장소·미커밋 수·원격) |
| REQ-010 | `tests/regression/commands.test.js`(임시 git repo, 명령 표 전체·토큰 없는 실행 거부·토큰 1회성) |
| REQ-011 | 버전 3.5.0(5파일+배지), CHANGELOG, roadmap H4 완료·H5 진행, design.md 대응표 3행, README 명령 표·두 단계 규칙, CLAUDE 16·구조, ONBOARDING |

설계와 다른 점: `ledger-add-invalid` 라우트를 두지 않고 종류가 맞지 않는 `기록 …` 은 일반 요청으로 흘려보낸다("기록 화면 만들기" 같은 요청을 가로채지 않기 위해). `status` 도 인가 없는 읽기 명령이 되어 기존 테스트 기대를 갱신했다. `.vais/` 는 저장 대상에서 항상 제외한다.

## 증거

- 단위 `node --test tests/*.test.js` 전부 pass (신규 `tests/v2-commands.test.js` 18: TC-001~009·011, 실제 git 커밋·revert 포함)
- 회귀 `npm run regression` 8 pass (장면 A·C·E·F + commands)
- `npm run lint` 0, `node scripts/vais-validate-plugin.js` 오류 0
- `npm run doctor` fail 0 · warn 1(plugin-cache 3.4.0≠3.5.0 예상). 신규 `git` 검사 pass(원격 origin)
- readiness receipt: test · lint · plugin-validator (transaction 실행)
