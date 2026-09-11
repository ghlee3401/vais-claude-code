# VAIS Code - Claude Code Plugin

> **이 파일의 책임**: Claude Code 전용 프로젝트 지침. 세션 시작 시 자동 로드된다. 처음 본 AI/사람은 먼저 `ONBOARDING.md` (5분 진입 가이드) 를, 사용법 전체는 `README.md` 를 읽는다.
>
> Virtual AI C-Suite for software development (v3.0.1)
> Claude Code marketplace plugin: `vais-code` — 단일 `/vais` managed entry + 5단계 상태 머신 `enforce`

## What This Project Is

**vais-code v3.0.1**: 자연어 요청 하나(`/vais …`)를 받으면 가상 C-Suite 조직이 **Plan → Design → Do → Review → Report** 다섯 단계를 runtime 상태 머신으로 진행하는 플러그인. 사용자는 C-Level 이나 phase 를 고르지 않고 **Plan 승인 · Design 승인 · 최종 승인** 세 번만 결정한다. 승인·write scope·단계 순서·반복 횟수는 프롬프트 권고가 아니라 hook 과 내부 CLI transaction 이 강제한다.

- 정본 모드: `vais.config.json > workflowV2.mode = "enforce"`. `shadow` / `disabled` 로 바꾸면 Legacy C-Suite 라우팅(`skills/vais/legacy.md`)이 복원된다.
- Legacy 구현(`agents/{c-level}/`, `skills/vais/phases/`, `templates/`)은 보존되어 있으며 enforce 모드에서는 읽지 않는다.
- v3 전환 근거: `docs/work-items/vais-workflow/2026-08-31-workflow-redesign/05-report/main.md` (Review Attempt 18, Quality PASS + EFF-01~08 PASS).

## v3 enforce 동작 규칙 (Mandatory)

`workflowV2.mode = enforce` 일 때 아래 규칙이 최우선이다. 정본: `skills/vais/SKILL.md` + `hooks/workflow-v2-prompt.js`.

1. **Hook 컨텍스트가 runtime 정본** — UserPromptSubmit hook 이 주입한 `[feature · phase · status]` 상태, managed action, 단계별 지침, owner 역할 카드를 그대로 따른다. 응답 첫 줄에 그 상태 한 줄을 표시한다.
2. **단일 VAIS voice** — 사용자에게 C-Level 이나 specialist 를 고르게 하지 않는다. `/vais ceo …` 같은 Legacy 접두사는 일반 요청으로 처리한다.
3. **Gate 우회 금지** — Plan, Design, Do, Review, Report 를 건너뛰지 않는다. Plan 과 Design 은 사용자 명시 승인(`/vais plan 승인`, `/vais design 승인`) 후에만 다음 단계로 간다. Ideation 은 Plan 안에 포함하며 별도 문서를 만들지 않는다.
4. **상태 변경은 내부 CLI 로만** — `scripts/vais-workflow-v2.js` 의 `plan present` / `design present` / `do ready` / `review prepare` / `review decide` / `report finalize` / `assignment` / `handoff` transaction 만 사용한다. `.vais/v2/` 를 직접 편집하지 않는다. transaction 이 FAIL 이면 evidence finding 만 고쳐 재실행한다.
5. **위임은 `v2-specialist` 만** — 판단·구현 위임은 `assignment` 로 발급한 receipt + runtime 역할 프롬프트를 단일 Agent `v2-specialist` 에 넘긴다. Legacy agent 본문(`agents/{c-level}/*.md`)을 읽지 않는다. specialist 는 `specialist-handoff/v1` JSON 만 반환하며 hook 이 자동 저장한다. Agent 도구가 launch receipt 만 돌려주고 결과가 나중에 task notification 으로 오면, 그 raw JSON 을 현재 phase 폴더의 `handoff.json` 에 그대로 저장한 뒤 `handoff --id … --session … --assignment <AS-id> --handoff-file <path>` 를 한 번 실행한다 (SendMessage 재개·수기 재작성 금지). 단계 정본 `main.md` 는 phase owner(main voice)만 쓴다.
6. **Design 승인 후 자동 진행** — Do → Readiness → Review evidence → 독립 QA 결과 제시까지 사용자 진행 요청 없이 계속한다. BLOCKED, drift, QA FAIL 처럼 결정이 필요할 때만 멈춘다.
7. **Review 는 read-only 독립 QA** — `independent-qa` 를 clean-room, `--code-write false` 로 정확히 1회 위임한다. 구현자가 자기 구현을 QA 로 승인하지 않는다. AI QA PASS 후에만 사용자 최종 승인을 요청한다.
8. **write scope 준수** — Do 에서는 Design 이 선언한 write scope(`path/**` 또는 정확한 파일) 안에서만 쓴다. `.git`, `.vais`, `docs/work-items`, `docs/features`, `docs/README.md` 는 scope 로 선언할 수 없다. 새 표면이 필요하면 Design 으로 돌아간다.
9. **`/vais` 없는 대화는 읽기 전용** — Work item 상태·문서·제품 코드를 변경하지 않는다. 반영이 필요하면 사용자가 `/vais` 를 붙여 다시 요청하도록 안내한다.
10. **산출물 경로** — `docs/work-items/{feature}/{YYYY-MM-DD-slug}/01-plan|02-design|03-do|04-review|05-report/main.md` 다섯 정본. Plan 초안은 `.vais/v2/drafts/plan.md`, 이후 단계 초안은 해당 phase 폴더 안에 두고 `--body-file` 로 넘긴다 (승격 시 자동 삭제). `docs/README.md` 와 `docs/features/` 는 Report 시 자동 생성되므로 손으로 쓰지 않는다.
11. **ID 형식** — 요구사항 `REQ-001`, 테스트 `TC-001` 3자리 고정. Design REQ 집합 = Plan REQ 집합, Review TC 집합 = Design TC 집합.
12. **문서 예산** — compact / standard / extended 규모별 byte 한도(`lib/workflow/v2/document-quality.js`)를 지킨다. compact Plan 5,632B, Design 8,192B. 이전 단계 문장(80자 이상)을 복사하지 않는다.
13. **Bash 제약** — write guard 가 `&&`, `|`, `;`, 리다이렉션, `$( )`, `-exec` 등 셸 합성을 차단한다. 한 번에 한 명령만 실행하고, 읽기는 Read/Grep 도구를 우선한다.
14. **위험 명령 금지** — `rm -rf`, `DROP TABLE`, `git push --force`, `git commit --no-verify` 사용 금지. 민감 정보는 환경 변수로만.
15. **커밋** — 워크플로우가 커밋하지 않는다. 사용자 요청 시 `/vais commit` 흐름(버전 동기화 포함)을 따른다.

## Project Structure

```
vais-claude-code/
├── skills/vais/         # SKILL.md (v2 managed entry, enforce) · legacy.md (shadow/disabled) · phases/ · utils/
├── skills/brief/        # /vais brief — VARCO 임원 보고서·슬라이드 (워크플로우 독립)
├── lib/workflow/v2/     # 23 모듈: state-machine · work-item-store · authorization-store · router · phase-transaction ·
│                        #   gate-engine · phase-check · document-manager · document-quality · draft-lifecycle · write-policy ·
│                        #   tool-adapters · check-evidence · context-capsule · context-view · repo-drift · role-registry ·
│                        #   history-resolver · naming · contracts · agent-policy · automatic-handoff · index
├── scripts/
│   ├── vais-workflow-v2.js      # 내부 workflow CLI (hook 이 명령 형태를 지정)
│   ├── checks/v2-secret-scan.js # secret-scan Tool adapter
│   ├── evaluation/              # Legacy/v2 formal 비교 (paired cohort, live shadow telemetry)
│   └── vais-validate-plugin.js, doc-validator.js, … (Legacy 스크립트 포함)
├── hooks/
│   ├── hooks.json               # SessionStart · PreToolUse · PostToolUse · Stop · UserPromptSubmit · Subagent*
│   ├── workflow-v2-prompt.js    # UserPromptSubmit — 라우팅·승인 판정·단계 지침·drift·lease
│   ├── workflow-v2-write-guard.js  # PreToolUse Bash/Write/Edit/Agent — write scope·셸 합성 차단
│   ├── workflow-v2-agent-handoff.js  # PostToolUse Agent — handoff JSON 자동 저장
│   ├── workflow-v2-drift.js     # PostToolUse — 변경 경로 기록
│   ├── v2-project-context.js    # 프로젝트 루트·프롬프트 추출 공용
│   └── session-start.js, design-mcp-trigger.js, ideation-guard.js, workflow-shadow.js, checkpoint-keyword.js
├── agents/
│   ├── v2-specialist.md         # 단일 runtime specialist Agent (enforce 모드 유일 위임 대상)
│   ├── _shared/                 # Legacy 공유 가드
│   └── {ceo,cpo,cto,cso,cbo,coo}/   # Legacy C-Level + sub-agent 본문 + knowledge/ 19 MD (역할 카드 knowledge 참조)
├── contracts/           # v2-role-cards.json (역할 정본) · workflow-contract.md · workflow-taxonomy.json · agent-teams.md
├── schemas/             # work-item · specialist-assignment · specialist-handoff · check-result · gate-result ·
│                        #   phase-transaction-receipt · review-evidence-prepare 등 JSON schema (ajv 검증)
├── docs/
│   ├── README.md                # Master 인덱스 (자동 생성)
│   ├── features/{feature}/main.md          # Feature 인덱스 (자동 생성)
│   └── work-items/{feature}/{date-slug}/   # main.md + 01-plan … 05-report/main.md + evidence/ + revisions/
├── .vais/v2/            # work-items.json · authorizations.json · drafts/ — 직접 편집 금지
├── templates/           # Legacy PDCA 템플릿 (shadow 모드)
├── design-system/       # Brand-first 카탈로그 (INDEX.md + brands/{slug}/DESIGN.md × 71)
├── mcp/                 # vais-design-system MCP 서버
├── tests/               # node --test (v2-*.test.js 16종 + Legacy)
├── vais.config.json     # 플러그인 전체 설정 (workflowV2 블록 포함)
├── ONBOARDING.md · README.md · CLAUDE.md · AGENTS.md · CHANGELOG.md
```

## Workflow (v3)

| 단계 | Owner | 내부 transaction | 사용자 Gate |
|------|-------|------------------|-------------|
| Plan | CPO | `plan present --body-file .vais/v2/drafts/plan.md` | `/vais plan 승인` |
| Design | CTO | `design present --scope … --readiness-check … --review-check … [--specialist …]` | `/vais design 승인` |
| Do | CTO | `assignment` (specialist 별) → `do ready` | — (자동) |
| Review | independent-qa | `review prepare` → `assignment --role independent-qa …` → `review decide` | `/vais 최종 승인` (AI QA PASS 후) |
| Report | CEO | `report finalize --outcome …` | — |

- 규모: `compact` (specialist ≤ 1) / `standard` (≤ 2) / `extended`. 단계는 생략하지 않는다.
- Tool check id 는 `test, e2e, build, lint, plugin-validator, doc-validator, skill-validator, dependency-scan, secret-scan` 9종만 허용한다.
- 복귀: Readiness NOT_READY 3회 → blocked. QA FAIL → Design (최대 3회). 최종 거절 → Design (요구사항 변경 시 Plan). 외부 drift → 범위에 따라 Do / Design / Plan.
- 완료 Report 는 `frozen: true`. 후속 변경은 새 Work item.

## Key Configuration

- **`vais.config.json > workflowV2`**: `mode` (enforce | shadow | disabled), `managedPrefix` (`/vais`), `authorizationTtlMs` (1,800,000 = 30분 lease), `statePath` (`.vais/v2/work-items.json`)
- **`orchestration.mcp.enabled`** (기본 true): UI 설계 시 design-system MCP 자동 호출. Python3 ≥ 3.8 필수, 누락 시 Hard fail
- **`designSystem.*`**: `model: brand-first`, `defaultBrand`, `preBakedBrands`, `blockOnMissingBrand`
- **hooks/hooks.json**: hook 등록 정본. **package.json > claude-plugin**: skills(`vais`, `brief`)/agents/hooks 진입점
- **.claude-plugin/plugin.json**: 마켓플레이스 매니페스트 (engines.claude-code ≥ 2.1.32)

### 의존성 (Runtime)

| 의존성 | 최소 버전 | 용도 |
|--------|---------|------|
| Node.js | 18 | plugin runtime, hook, 내부 CLI |
| Claude Code | 2.1.32 | UserPromptSubmit / PreToolUse / PostToolUse hook |
| Python3 | 3.8 | `vendor/ui-ux-pro-max/scripts/search.py` — UI 설계 MCP 자동 호출, `skill-validator` check |

## Version Management

버전은 다음 파일에서 동기화 필요:
- `package.json` (version)
- `vais.config.json` (version)
- `.claude-plugin/plugin.json` (version)
- `.claude-plugin/marketplace.json` (metadata.version + plugins[0].version)
- `CHANGELOG.md`

커밋 시 `/vais commit` 플로우를 사용할 것.

## File Conventions

- Feature 이름: kebab-case 영문. 새 Feature 는 runtime 이 요청 문장에서 결정적으로 발급한 slug 를 그대로 쓴다. 기존 Feature 에 붙이는 Work item 은 의도가 드러나는 slug 를 고른다 (`v3-usage-docs`)
- Work item ID: `WI-{YYYY-MM-DD}-{slug}`, 폴더: `docs/work-items/{feature}/{YYYY-MM-DD-slug}/`
- 단계 정본 frontmatter: `schema: vais-phase/v1`, `work_item`, `phase`, `revision`, `status`, `based_on`, `approved_by`
- 역할 카드: `contracts/v2-role-cards.json` (frontmatter 형식 임의 변경 금지)
- 라이브러리: `lib/**/*.js` (CJS), 모든 JSON 계약은 `schemas/` 로 검증

## Testing

```bash
npm test                               # unit + integration (v2-*.test.js 포함)
npm run lint                           # eslint scripts/ lib/ hooks/ --max-warnings=0
node scripts/vais-validate-plugin.js   # 플러그인 구조 검증
```

## shadow / disabled 모드 전용 — Legacy 규칙

`workflowV2.mode` 가 `enforce` 가 아닐 때만 적용한다. enforce 모드에서는 위 "v3 enforce 동작 규칙" 이 이 절을 대체한다. 정본: `skills/vais/legacy.md`, `agents/_shared/*.md`, `contracts/workflow-contract.md`.

- **진입**: `/vais {ceo|cpo|cto|cso|cbo|coo} [phase] {feature}` 직접 호출. CEO 는 `lib/ceo-algorithm.js > analyzeCEO()` 7 차원 등급 표로 Primary C-Level(CEO/CPO/CTO/CSO)을 자동 라우팅하고, CBO/COO 는 사용자 명시 호출만 활성.
- **순서**: CTO 만 `ideation(optional) → plan → design → do → qa → report` mandatory PDCA + Gate. 비-CTO 는 CEO 알고리즘이 활성화한 phase 만.
- **산출물**: `docs/{feature}/{NN-phase}/main.md` 5섹션 인덱스 + sub-agent 직접 박제 `{artifact}.md` (frontmatter `owner/artifact/phase/feature` 4 필수). `_tmp` 금지. top-level `docs/NN-` 레거시 경로 금지 (`.hooks/pre-commit` 차단).
- **결정**: 모든 선택은 AskUserQuestion 클릭 인터페이스. Lean checkpoint (CP-0/CP-Q 만). 실행 에이전트 직접 호출 금지, 반드시 C-Level 경유.
- **Agent Teams** (`orchestration.agentTeams.enabled`, 기본 false): 대화-합성 모델 + Lazy Consensus FSM + sub-agent worktree. 정본 `contracts/agent-teams.md`.
- **기획 없이 코드 금지 / Plan 은 결정, Do 는 실행 / 참조 투명성(`// @see {URL}`)** 등 기존 작업 규칙은 `agents/_shared/work-rules.md`.

## Do NOT

- `.vais/v2/` 상태 파일을 직접 편집하지 말 것 — 내부 CLI transaction 만 사용
- enforce 모드에서 Legacy agent 본문(`agents/{c-level}/*.md`)이나 `skills/vais/phases/*.md` 를 읽어 라우팅하지 말 것
- `docs/README.md`, `docs/features/`, 완료된 Report 를 손으로 수정하지 말 것 (자동 생성·동결)
- `vendor/` 내 파일을 직접 수정하지 말 것
- `contracts/v2-role-cards.json` 역할 카드와 `schemas/` 계약을 사전 합의 없이 변경하지 말 것
- `vais.config.json` 의 키 구조를 사전 합의 없이 변경하지 말 것
- AGENTS.md 를 삭제하거나 CLAUDE.md 와 병합하지 말 것
