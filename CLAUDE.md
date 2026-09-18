# VAIS Code — Claude Code 프로젝트 지침

> **이 파일의 책임**: Claude Code 전용 지침. 세션 시작 시 자동 로드된다. 처음 본 AI/사람은 `ONBOARDING.md`(5분), 사용법은 `README.md`.
>
> 상태: **4.3.0 (2026-09-18) — 로드맵 H1~H8 완료, 문서 예산 상향·설정화, 다이어그램 스킬 흡수, 코드 한도를 지시문에 그대로, 정본을 범위 절로 묶기.** Legacy 를 전부 제거했고(롤백 태그 `v3.0.1-legacy`), 설계 정본은 `docs/harness/design.md`, 실행 순서는 `docs/harness/roadmap.md`. 모든 구현 작업은 이 두 문서의 ID·작업 번호를 인용한다. 이 저장소 자체 작업의 kind 는 `harness` 다.

## 이 플러그인이 만드는 것

**비개발자가 개발자처럼 웹 앱을 만들게 해주는 Claude Code 하네스.** 사용자는 말로 시키고 결정만 한다. 플러그인은 Plan → Design → Do → Review → Report 를 runtime 으로 강제하고, 기록하고, 결과를 눈으로 확인시킨다.

설계 원칙 (모델이 바뀌어도 유지):

- **루프 하나**: 말하기 → 요청 확인 → 고르기 → 만들기(자동) → 확인(최대 5회) → 기록(자동)
- **모델을 못 믿는 부분만 코드로 강제** (승인 Gate, write scope, 기록, 증거, 고장 알림). 모델이 잘하는 부분은 데이터(역할 카드·양식·지시문)로 둔다.
- **단일 VAIS 목소리**. C-Level·specialist 이름은 내부 role id 일 뿐 사용자에게 노출하지 않는다.
- **정직**: 실행하지 않은 검사, 확인하지 못한 화면을 만들어내지 않는다.

## 현재 구조 (청소 후)

```
vais-claude-code/
├── skills/vais/SKILL.md      # /vais managed entry (enforce 전용)
├── skills/brief/             # /vais brief — 임원 보고서 (워크플로우 독립)
├── skills/diagram/           # 다이어그램 11종 (diagram-design MIT 스냅샷) — /vais diagram · 3단계 흐름도 · 요청 시 SVG·PNG
├── agents/v2-specialist.md   # 유일한 위임 대상 Agent
├── hooks/
│   ├── hooks.json            # SessionStart · UserPromptSubmit · PreToolUse · PostToolUse · Stop 5종 등록
│   ├── session-start.js              # 세션 브리핑 (상태·지난 사건·열린 결정·부채·stale·제안 3)
│   ├── workflow-v2-prompt.js         # 라우팅·승인 판정·단계 지침·drift·lease·장부 주입
│   ├── workflow-v2-write-guard.js    # write scope·셸 합성 차단 (fail-closed)
│   ├── workflow-v2-agent-handoff.js  # specialist handoff 자동 저장
│   ├── workflow-v2-drift.js          # 변경 경로 기록
│   ├── workflow-v2-stop.js           # 기록 잠금 (장부 누락·미기록 변경 시 턴 종료 1회 거부)
│   ├── v2-project-context.js · run-node.sh
├── lib/workflow/v2/          # 39 모듈: config(mode·ui 설정) · doctor · chain-registry(단계·kind 카탈로그) · id-chain(ID 사슬·범위 절·stale·산출물 렌더) · citation(인용·신규·구현됨) · app-runner(ui.run) · migrate-scopes(범위 정리) ·
│                             #   ledger(장부) · product-note(노트 3면) · proposal(제안) · briefing(상태 문장) · explain(설명) · vcs(저장·되돌리기) ·
│                             #   screen-capture(스크린샷) · diff-summary(회차 diff) · review-page(검수 페이지) ·
│                             #   state-machine · work-item-store · phase-transaction · gate-engine · router · write-policy · tool-adapters ·
│                             #   document-manager/quality · phase-check · context-capsule/view · repo-drift · role-registry · agent-policy · automatic-handoff …
├── contracts/                # v2-role-cards.json · chain-stages.json(단계 10) · work-kinds.json(kind 14) · glossary.json(용어 사전)
├── lib/core/state-store.js · lib/io.js · lib/context-metrics.js
├── scripts/vais-workflow-v2.js       # 내부 workflow CLI (hook 이 명령 형태를 지정)
├── scripts/checks/v2-secret-scan.js · scripts/vais-validate-plugin.js · scripts/vais-doctor.js · scripts/vais-statusline.js · scripts/setup-dev.sh
├── schemas/                  # work-item · specialist-assignment · specialist-handoff · check-result · gate-result ·
│                             #   phase-transaction-receipt · review-evidence-prepare · automatic-handoff-evidence · chain-stage · work-kinds · ledger-entry
├── output-styles/vais-default.md
├── tests/v2-*.test.js (18) + tests/regression/(장면 A·B·C·D·E·F + commands, 공통 준비 helpers.js) + tests/fixtures/{mini-booking,product-stages,static-server.js}
├── docs/product/             # 제품 사슬 정본 NN-*.md + 자동 생성 노트 README·roadmap·decisions
├── .vais/v2/                 # work-items.json · authorizations.json · chain-index.json · ledger.jsonl(append-only) — 직접 편집 금지
├── vais.config.json          # version · plugin · workflowV2 · documentBudgets(문서 예산 덮어쓰기) · ui(appRoot·entry·url)
└── ONBOARDING.md · README.md · CLAUDE.md · CHANGELOG.md
```

## enforce 동작 규칙 (Mandatory)

`vais.config.json > workflowV2.mode = enforce` 일 때. 정본은 `skills/vais/SKILL.md` + `hooks/workflow-v2-prompt.js`.

1. **Hook 컨텍스트가 runtime 정본** — UserPromptSubmit hook 이 주입한 `[feature · phase · status]`, managed action, 단계 지침, owner 역할 카드를 그대로 따른다. 응답 첫 줄에 그 상태 한 줄을 쓴다.
2. **단일 VAIS voice** — C-Level·specialist 를 사용자에게 고르게 하지 않는다.
3. **Gate 우회 금지** — Plan·Design 은 사용자 명시 승인(`/vais plan 승인`, `/vais design 승인`) 후에만 다음으로. Ideation 은 Plan 안에.
4. **상태 변경은 내부 CLI 로만** — `plan present` / `design present` / `do ready` / `review prepare` / `review decide` / `report finalize` / `assignment` / `handoff`. `.vais/v2/` 직접 편집 금지. FAIL 이면 finding 만 고쳐 재실행.
5. **위임은 `v2-specialist` 만** — `assignment` receipt + runtime 역할 프롬프트 + 결과의 `guidance`(출력 계약 숫자 표)를 Agent prompt 에 그대로 붙인다. specialist 는 `specialist-handoff/v1` JSON 만 반환하고, 읽기 전용(`--code-write false`)이면 `files` 를 넣지 않는다. Agent 결과가 나중에 task notification 으로 오면 raw JSON 을 phase 폴더 `handoff.json` 에 저장 후 `handoff --id … --assignment … --handoff-file …` 1회.
6. **Design 승인 후 자동 진행** — Do → Readiness → Review evidence → 독립 QA 결과 제시까지. BLOCKED·drift·QA FAIL 에서만 멈춘다.
7. **Review 는 read-only 독립 QA** — `independent-qa` clean-room, `--code-write false`, 정확히 1회. AI QA PASS 후에만 최종 승인 요청.
8. **write scope** — Do 는 Design 이 선언한 scope 안에서만. `.git`, `.vais`, `docs/work-items`, `docs/features`, `docs/README.md` 는 scope 불가.
9. **`/vais` 없는 대화는 읽기 전용.**
10. **산출물** — `docs/work-items/{feature}/{YYYY-MM-DD-slug}/01-plan|02-design|03-do|04-review|05-report/main.md`. 첫 Plan 초안만 `.vais/v2/drafts/plan.md`, 이후 모든 초안(Plan 수정 포함)은 해당 phase 폴더의 `draft.md` 에 두고 `--body-file` 로 넘긴다 (승격 시 자동 삭제).
10-1. **Feature 이름** — runtime 이 요청의 영어 단어에서 발급한다. 영어 단어가 없으면 AI 가 이름을 만들지 않고 사용자에게 묻는다. 사용자가 `/vais 이름: <kebab-case>` 로 준 이름만 CLI 가 받고, 이름 뒤에 붙은 문장은 slug 에 들어가지 않는다(`이름: a-b 추려서 Plan` → `a-b`). **단계 kind 는 다르다**: Feature = 범위(기능 묶음) 이름이고 요청 문장에서 뽑지 않는다. 1단계는 사용자가 `/vais 범위: <kebab>` (문장 안 `범위: X` 도 됨)으로 주고, 2단계부터는 가장 최근 단계 작업의 범위를 물려받는다. `plan present` 는 `--slug <단계 이름: requirements·features…>` `--feature <범위>` 로 받아 회의록을 `docs/work-items/<범위>/<날짜>-<단계>/` 에 둔다(같은 날 같은 단계는 `-2`·`-3`).
10-2. **작업 kind** — 모든 Work item 은 `kind` 를 가진다 (`harness`·`feature`·`ui`·`bug`·`stage-*` 10, 정본 `contracts/work-kinds.json`). hook 이 제안하고 Plan 에 적어 사용자 확인 후 `plan present --kind` 로 넘긴다. 이 저장소 자체 작업은 `harness` 다.
10-3. **제품 사슬** — `stage-*` kind 는 `docs/product/NN-*.md` 정본 하나를 만든다 (`contracts/chain-stages.json`). 항목은 `### F-003 ← REQ-002` 제목 + `| 항목 | 내용 |` 표. 앞 단계 승인·stale 없음이 진입 조건이고, `do ready` 의 `stage-document` 검사가 형식·부모·산출물·커버리지·예산·범위를 본다. `report finalize` 가 정본을 approved 로 표시한다. stale 해소는 재승인 또는 사용자의 `/vais 변경 없음 확인: <항목> ← <부모>` 뿐이다. **범위 절**: 항목형 단계 8개(01·02·03·04·06·07·08·10)의 항목은 `## 범위: <이름>` 절 아래에만 둔다(01 은 절 첫머리에 `문제:`·`목표:` 한 줄씩, 제품 절 `## 대상 사용자`·`## 제외` 는 위에 한 번). 작업은 자기 범위(= Feature)의 절만 쓴다 — 절이 없으면 문서 끝에 만들고, 새 번호는 `stage status` 의 `nextIds` 부터, 다른 범위의 항목은 한 글자도 바꾸지 않는다. 커버리지는 범위 안에서 본다. 05·09 는 절이 없다.
10-4. **장부와 노트** — 승인·거절·QA FAIL·잔여 제한은 runtime 이 `.vais/v2/ledger.jsonl` 에 자동으로 남긴다(append-only, 손으로 쓰지 않음). Design 의 `## 결정` 불릿은 승인 때 decision 으로 기록되므로 결정은 그 절에 적는다. `docs/product/{README,roadmap,decisions}.md` 는 Report 마다 재생성되며 `roadmap.md` 의 `<!-- vais:user -->` 표식 사이만 손으로 고칠 수 있다. 세션 첫 줄의 브리핑과 Stop 잠금 사유는 그대로 사용자에게 보인다. Stop 이 턴을 막으면 해당 transaction·handoff 로 기록한 뒤 끝낸다.
10-5. **화면은 그림으로** — `ui` kind 와 와이어프레임·시안 단계에서 화면을 말로 설명하지 않는다. `screens capture` 또는 `do ready` 가 만든 PNG 를 Read 로 열어 응답에 보인다. ui Design 은 `## 안 N` 마다 `사본:`·`데스크톱:`·`모바일:` 경로(Work item 폴더 안)와 `## 검수표` 가 있어야 통과하고, 사용자는 `/vais N번` 으로 고른 뒤 승인한다. Do 가 READY 면 `do/waiting-user`(화면 확인 정지점)에서 round-0(전)·round-N(후) 그림과 `diff.md` 한 줄을 보이고 멈춘다. `/vais 확인` 이면 Review, 다른 문장이면 Design 세부 수정(material=false, `## 수정 회차 N`) → Do 재실행. 6번째 수정은 막힌다. Chrome 이 없으면 그림 없는 승인을 만들지 말고 `/vais doctor` 의 설치 안내를 전한다.
10-6. **기능·버그는 사슬 위에서** — `feature`·`bug` kind 의 Plan 은 `요청 확인·kind·관련 ID` 세 줄이다. Design 은 만드는 것을 `## 인용`(승인 ID)과 `## 신규`(`### API-003 ← S-001, F-003` + 그 단계의 필수 항목 표, 다음 빈 번호)로만 적는다. ID 없는 서술, 없는 인용, 미승인 단계, stale 항목이 있으면 `design present` 가 거부된다. `docs/product/*.md` 는 손으로 고치지 않는다 — `do ready` 가 READY 일 때 신규 항목을 정본에 붙이고(draft), `report finalize` 가 `구현됨` 도장을 찍고 approved 로 바꾼다. bug 는 `## 재현`(절차 + `재현 화면: <png>`, `screens capture` 로 찍은 Work item 폴더 안 파일)·`## 원인`·`## 수정안`·신규 TC 가 필수고 "재현 불가" 는 거부된다. QA 의 `--criterion` 은 `## 검수표` 와 인용·신규 TC 만이고 Review 문서의 TC 집합은 그것과 같아야 한다. 앱을 띄워야 찍히는 화면은 `vais.config.json > ui.run {command: [argv], url}` 로 선언한다.
11. **ID** — `REQ-001`, `TC-001` 3자리. Design REQ 집합 = Plan REQ 집합, Review TC 집합 = Design TC 집합.
12. **문서 예산** — 단계 문서 byte 한도. 기본값(README "문서 예산" 표, `lib/workflow/v2/config.js`)은 compact / standard / extended × plan·design·do·review·report 와 stage 단계 문서용 한 줄이며, 프로젝트는 `vais.config.json > documentBudgets.{규모}.{단계}` 로 칸 단위로 덮어쓴다(잘못된 칸은 무시, `/vais doctor` 가 알림). 초과하면 present 가 "① 본문 줄이기 ② `--scale` 올리기(extended 는 `budget_exception` 예외 승인) ③ 설정 올리기" 를 안내한다. 이전 단계 문장(80자 이상) 복사 금지.
13. **check id** — Tool 7종 `test, e2e, build, lint, plugin-validator, dependency-scan, secret-scan` + 내장 `stage-document`(단계 kind), `screen-capture`(ui kind), 예약 `screenshot-compare`.
14. **Bash** — 한 번에 한 명령. `&&`, `|`, `;`, 리다이렉션, `$( )` 금지. 읽기는 Read/Grep 우선.
15. **위험 명령 금지** — `rm -rf`, `git push --force`, `git commit --no-verify`. 민감 정보는 환경 변수로만.
16. **사용자 명령** — `/vais 상태`·`설명`·`제안`·`기록 보기`·`doctor` 는 읽기 전용이며 hook 이 지정한 CLI(`status`·`explain`·`propose`·`ledger list`·`doctor`)를 실행해 결과 문장을 그대로 보인다. `/vais 저장`·`되돌리기`·`기록`·`정리` 는 두 단계: 첫 명령은 제안만, 사용자가 확인 문구(`/vais 저장 확인`, `/vais 되돌리기 확인: <대상>`, `/vais 기록 <종류> <내용>`, `/vais 정리 확인`)를 직접 치면 runtime 이 토큰을 발급하고 `save commit`·`revert commit`·`ledger add`·`migrate commit` 이 실행된다. AI 가 `git commit` 을 직접 치거나 확인 문구를 대신 쓰지 않는다. push 는 사용자가 한다. `정리`(`migrate propose --scope X` → `migrate commit`)는 4.3.0 이전 구조를 범위 하나로 옮기며, 진행 중·paused 작업, 다른 세션 lease, 저장 안 된 변경, 정본·chain-index 불일치가 있으면 거부하고 중간 실패는 되돌린다.
17. **다이어그램** — 그림은 `skills/diagram/SKILL.md` 규칙(11종, HTML + 인라인 SVG 한 파일)으로만 그린다. `/vais diagram <요청>` 은 그 턴의 write scope 에 `docs/diagrams/**`(`vais.config.json > diagrams.dir`)를 넣고 Work item 상태는 바꾸지 않는다. `/vais` 없는 "그려줘" 는 저장하지 않고 `/vais diagram` 을 안내한다. 3단계 화면 정의서의 흐름도 안은 `02-design/options/N/flow.html` + `screens capture` PNG 로 보이고, Do 의 흐름 파일은 `.html`(권장, `do ready` 가 PNG 렌더) 또는 `.mmd`. SVG·PNG 내보내기는 요청 시 `diagram export --file … --svg --png` 한 번. Python·Playwright 는 쓰지 않는다.
18. **코드 한도는 지시문에 그대로** — runtime 이 거부하는 한도는 hook 지시문에 같은 숫자로 미리 보인다(복사가 아니라 상수 interpolation). Report `--outcome` 700자 이내 요약, `--limitation` 각 300자 한 줄, 넘기면 잘리지 않고 거부. QA handoff 숫자는 `assignment` 결과의 `guidance`. 한도를 넘겨 다시 시도하는 것은 낭비이므로 처음부터 안에 맞춘다.

## mode 와 비상 스위치

- `enforce` (정본) / `disabled`. 대소문자·공백은 무시된다. **그 밖의 값과 읽기 실패는 enforce 로 취급(닫힘)** 되고 매 프롬프트 첫 줄에 `⚠ VAIS 하네스 경고: …` 가 주입된다. 경고를 보면 첫 줄에 그대로 표시하고 `/vais doctor` 를 안내한다.
- `disabled` 또는 환경변수 `VAIS_HARNESS_OFF=1` 이면 하네스가 꺼진다. 첫 줄에 `[VAIS · 하네스 비활성]` 을 쓰고 승인·범위·기록이 강제되지 않음을 알린다. 이 상태는 **하네스 자체를 고칠 때만** 쓴다. 끝나면 되돌린다.
- 읽기 전용 명령(`git -C … status/diff/log/show`, `ls`, `cat`, `wc`, `node --version`)과 Claude scratchpad 쓰기는 authorization 없이 허용된다. 그 밖의 쓰기는 write scope 안에서만.

## 자기 수정 시 주의

- 실행 중인 플러그인은 `~/.claude/plugins/cache/vais-marketplace/vais-code/{version}` 사본이다. 이 repo 를 고쳐도 push + 버전 bump + 플러그인 업데이트 전에는 반영되지 않는다.
- enforce 에서는 write guard 가 `vais.config.json`, `git commit`, repo 밖 쓰기까지 막는다. 하네스를 고칠 때는 사용자가 mode 를 `disabled` 로 내린 뒤 작업한다.

## Testing

```bash
npm test            # node --test tests/*.test.js
npm run regression  # tests/regression/ 사용 장면 A~F + 명령 표 (design.md §11 표와 1:1, 준비 코드는 helpers.js)
npm run lint        # eslint scripts/ lib/ hooks/ --max-warnings=0
npm run validate    # 플러그인 구조 검증
npm run doctor      # 하네스 건강검진 (= /vais doctor)
```

## Version Management

버전 동기화 파일: `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (metadata.version + plugins[0].version), `CHANGELOG.md`, `README.md` 배지.

## Do NOT

- `.vais/v2/` 를 직접 편집하지 말 것
- `docs/README.md`, `docs/features/`, 완료된 Report 를 손으로 수정하지 말 것 (자동 생성·동결)
- `contracts/v2-role-cards.json`, `schemas/`, `vais.config.json` 키 구조를 사전 합의 없이 바꾸지 말 것
- 사용자 요청 없이 커밋하지 말 것 — 커밋은 `/vais 저장` → 사용자의 `/vais 저장 확인` 뒤 runtime 이 한다
