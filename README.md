<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="license" />
</p>

<h1 align="center">VAIS Code</h1>

<p align="center">
  <strong>Virtual AI C-Suite for Software Development — v3.0.1</strong><br/>
  단일 <code>/vais</code> 진입 · Plan → Design → Do → Review → Report 상태 머신 · 사용자 승인 Gate 3개 · 독립 AI QA
</p>

<p align="center">
  자연어 요청 하나로 가상 C-Suite 조직이 기획·설계·구현·검증·보고를 순서대로 진행하는 Claude Code 플러그인.<br/>
  사용자는 C-Level이나 단계를 고르지 않고 <strong>승인만</strong> 합니다.
</p>

---

## Quick Start

### Requirements

| 의존성 | 버전 | 용도 |
|--------|------|------|
| Node.js | ≥ 18 | plugin runtime, hook 실행, 내부 workflow CLI |
| Claude Code | ≥ 2.1.32 | UserPromptSubmit / PreToolUse / PostToolUse hook 지원 |
| Python3 | ≥ 3.8 | `vendor/ui-ux-pro-max` 디자인 시스템 검색 — UI 설계 시 MCP 자동 호출 (기본 ON) |

> ⚠️ **Python3 미설치 시** UI 설계 단계 진입이 차단됩니다 (Hard fail). opt-out: `vais.config.json > orchestration.mcp.enabled: false`.

```bash
# Install
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code && bash scripts/setup-dev.sh

# In Claude Code
/reload-plugins
/vais status
```

### 첫 요청

```text
/vais 비밀번호 재설정 기능 추가해줘
```

이 한 줄이면 VAIS가 관련 이력을 검색하고 Feature 관계·규모를 제안한 뒤, Plan을 작성해 승인을 요청합니다. 이후 필요한 것은 아래 승인 문구뿐입니다.

```text
/vais plan 승인      # Plan 승인 → Design 작성
/vais design 승인    # Design 승인 → Do → Readiness → 독립 QA 까지 자동 진행
/vais 최종 승인      # AI QA PASS 확인 후 → Report 작성·동결
```

---

## 사용법 (v3 managed entry)

v3.0.0부터 `/vais`는 **자연어 요청 하나만** 받습니다. C-Level(`ceo`, `cto` …)이나 phase(`plan`, `design` …)를 직접 지정하는 옛 문법은 진입점이 아닙니다. `/vais ceo …` 처럼 입력해도 일반 요청으로 처리됩니다.

### 명령

| 입력 | 동작 |
|------|------|
| `/vais <자연어 요청>` | 진행 중 Work item이 없으면 새 요청 시작. 있으면 현재 단계 작업 지시로 처리 |
| `/vais status` (또는 `/vais 상태`) | 현재 Work item·단계·상태와 대기 요청 조회 (읽기 전용) |
| `/vais pause` (`일시정지`) | 진행 중 Work item 일시정지 |
| `/vais resume` (`재개`) | 일시정지된 Work item 재개 (정확히 1개일 때) |
| `/vais cancel` (`취소`) | 진행 중 Work item 취소 |
| `/vais 새 작업: <요청>` | 진행 중 작업을 유지한 채 새 요청을 **pending 큐**에 보관. `/vais status`에서 확인 |
| `/vais brief {주제}` | 워크플로우와 무관한 임원/대외 보고 HTML 생성 (`--deck` 슬라이드). 정본: `skills/brief/SKILL.md` |

### 승인·거절 문법

승인은 hook이 정규식으로 판정하므로 아래 문구를 그대로 쓰는 것이 안전합니다.

| 상황 | 입력 | 결과 |
|------|------|------|
| Plan 제시 후 | `/vais plan 승인` 또는 `/vais 승인` | Design 단계 진입 |
| Design 제시 후 | `/vais design 승인` 또는 `/vais 승인` | Do → Readiness → Review 자동 진행 |
| AI QA PASS 후 | `/vais 최종 승인` 또는 `/vais approve` | Report 작성·동결 |
| 수정 요청 | `/vais <수정 내용>` | 같은 단계에서 revision 수정 후 재제시 |
| 최종 결과 거절 | `/vais 거절` 또는 `/vais 승인하지 않아` | Design으로 복귀 (요구사항이 바뀌면 이어지는 `/vais` 수정 요청에서 Plan 재작성) |

주의할 점:

- `좋아`, `ok`, `그래` 같은 모호한 답은 승인으로 기록되지 않습니다.
- `조건부 승인`, `만약 … 승인`, `사용자 대신 승인` 등 조건·대리 표현이 섞이면 승인이 무효 처리됩니다.
- **`/vais`가 없는 대화는 읽기 전용**입니다. Work item 상태·문서·제품 코드를 바꾸지 않으며, 반영이 필요하면 `/vais`를 붙여 다시 요청합니다.
- 프로젝트 전체에서 진행 가능한 Work item은 **1개**입니다. 다른 세션이 잡고 있으면 읽기 전용으로만 안내합니다.

---

## Workflow — 5단계 상태 머신

모든 작업은 규모와 무관하게 다섯 단계를 남깁니다. 사용자 결정은 세 번뿐입니다.

| 단계 | Owner | 산출 | 사용자 Gate |
|------|-------|------|-------------|
| **Plan** | CPO | 문제·목표·범위·REQ-NNN·사용자 흐름·엣지 케이스·완료 조건·영향 | ✅ Plan 승인 |
| **Design** | CTO | REQ별 동작·입력·출력·오류·TC-NNN, 전문 영역 판단, specialist·write scope·check 선언, rollback | ✅ Design 승인 |
| **Do** | CTO | 승인된 write scope 안에서 구현. Design이 고른 specialist만 위임 | — (자동) |
| **Review** | independent-qa | read-only clean-room 검증. Tool evidence·diff·실제 화면으로 PASS / FAIL / BLOCKED 판정 | ✅ 최종 승인 (AI QA PASS 후에만) |
| **Report** | CEO | 결과·증거·잔여 제한 요약. 완료 시 `frozen: true`로 동결 | — |

```text
/vais 요청
→ 관련 Feature/Work item 검색 → 관계·규모 확인
→ Plan 제시 ──── /vais plan 승인
→ Design 제시 ── /vais design 승인
→ Do → Readiness Gate → Review evidence → 독립 AI QA
→ 결과·화면·제한 제시 ── /vais 최종 승인
→ Report 작성·동결
```

**자동 진행과 복귀 규칙**

- Design 승인 turn에서 Do부터 Review 결과 제시까지 사용자 진행 요청 없이 이어집니다. BLOCKED, scope drift, QA FAIL처럼 결정이 필요한 경우에만 멈춥니다.
- Readiness NOT_READY가 3회 연속이면 `blocked`.
- QA FAIL은 Design으로 돌아가 bounded repair를 수행하며 최대 3회. 초과 시 `blocked`.
- 사용자가 직접 파일을 편집하면 다음 `/vais`에서 drift를 감지해 영향 범위에 따라 Do / Design / Plan으로 재라우팅합니다 (자동 삭제 없음).
- 완료된 Report는 수정하지 않습니다. 후속 변경은 새 Work item으로 진행합니다.

### 작업 규모 (scale)

Plan 시작 시 `compact` / `standard` / `extended` 중 하나로 확정합니다. 규모는 단계를 생략하지 않고 문서 깊이와 Agent 수만 조절합니다.

| 규모 | Do specialist 상한 | 문서 예산 (Plan / Design / Do / Review / Report) |
|------|:------------------:|-----------------------------------------------|
| compact | 1 | 5.5 KB / 8 KB / 2.5 KB / 5 KB / 2.5 KB |
| standard | 2 | 6 KB / 10 KB / 3.5 KB / 6 KB / 3 KB |
| extended | 제한 없음 | 10 KB / 18 KB / 6 KB / 10 KB / 5 KB (초과 시 사용자 승인 필요) |

---

## Roles — runtime 역할 카드

v3에서 C-Level과 specialist는 사용자가 호출하는 명령이 아니라 **runtime이 단계별로 배정하는 역할**입니다. 정본은 `contracts/v2-role-cards.json`이며, 위임은 단일 Agent `v2-specialist`에 역할 프롬프트 + 구조화된 assignment를 넘기는 방식으로만 이뤄집니다.

### C-Level (phase owner)

| 역할 | 담당 단계 | 책임 |
|------|-----------|------|
| **CEO** | 전체 · Report | 단일 VAIS voice. 이력 검색, Work item 라우팅, 최종 Report 합성 |
| **CPO** | Plan | 사용자 문제를 안정적인 REQ·범위·흐름·완료 조건으로 변환. 구현 결정은 하지 않음 |
| **CTO** | Design · Do | 통합 Design, specialist·실행 wave 선택, write scope 안에서 Do 통제 |
| **CSO** | 조건부 | 인증·권한·PII·결제·업로드·외부 입력이 있을 때 보안·컴플라이언스 범위 판단 |
| **COO** | 조건부 | 배포·CI/CD·모니터링·마이그레이션·롤백 등 운영 표면이 바뀔 때만 참여 |
| **CBO** | 조건부 | 시장·가격·재무·마케팅 결과가 바뀔 때만 참여 |

### Specialist

| 종류 | 역할 | 비고 |
|------|------|------|
| judgment | independent-qa, ui-designer, db-architect, infra-architect, security-auditor, code-reviewer, migration-planner, sre-engineer, performance-engineer, product-discoverer, product-strategist, ux-researcher, data-analyst | read-only. 판단만 handoff로 반환 |
| implementation | backend-engineer, frontend-engineer, test-engineer, incident-responder | Do 단계에서만 code-write 허용, Design이 선언한 write scope 한정 |
| tool | secret-scan, dependency-scan, plugin-validator, skill-validator | 기계적 검사는 Agent가 아니라 Tool adapter가 실행 |

- Review의 independent-qa는 구현자의 자기 평가를 제외한 clean-room 컨텍스트로 정확히 1회 실행됩니다.
- specialist는 Markdown을 쓰지 않고 `specialist-handoff/v1` JSON만 반환합니다. 단계 정본 `main.md`는 phase owner만 작성합니다.
- Agent 도구가 launch receipt만 즉시 돌려주고 결과를 나중에 알림으로 전달하는 Claude Code 빌드에서는, 도착한 handoff JSON을 현재 phase 폴더의 `handoff.json`에 저장하고 내부 CLI `handoff` 명령으로 등록합니다. 같은 schema·크기·verdict 검증을 거치며 임시 파일은 자동 삭제됩니다. (3.0.1)

---

## Document Structure

```text
docs/
├── README.md                                  # Master 인덱스 (자동 생성) — 현재 Work item + 전체 목록
├── features/{feature}/main.md                 # Feature 인덱스 (자동 생성) — 장기 기능 단위
└── work-items/{feature}/{YYYY-MM-DD-slug}/    # Work item = 한 번의 변경
    ├── main.md                                #   상태·승인·revision·이력 (frontmatter 정본)
    ├── 01-plan/main.md                        #   다섯 단계 정본 (authored Markdown은 이 5개뿐)
    ├── 02-design/main.md
    ├── 03-do/main.md
    ├── 04-review/main.md
    ├── 05-report/main.md
    └── {0N-phase}/
        ├── revisions/vN.md                    #   승인된 의미 변경만 보존
        └── evidence/                          #   transaction receipt · check 결과 · 로그 · 스크린샷
```

- 정본 frontmatter: `schema: vais-phase/v1`, `work_item`, `phase`, `revision`, `status`, `based_on`, `approved_by`.
- 요구사항·테스트 ID는 `REQ-001`, `TC-001`처럼 3자리 고정. Design은 Plan의 REQ 집합과, Review는 Design의 TC 집합과 정확히 일치해야 합니다.
- 미승인 draft는 canonical 승격 시 삭제됩니다. 완료 시 `docs/**/draft.md`가 남으면 Report Gate가 실패합니다.
- 상태 저장소는 `.vais/v2/` (`work-items.json`, `authorizations.json`). **직접 편집하지 않습니다.** 모든 상태 변경은 `scripts/vais-workflow-v2.js` transaction으로만 이뤄집니다.

---

## Quality Gates & Runtime Guards

### Tool check (Design에서 선언)

Design은 readiness / review check를 아래 9종 중에서 고릅니다. 같은 Design revision·repo snapshot의 receipt는 재실행하지 않고 재사용합니다.

| id | 실행 |
|----|------|
| `test` | `npm test` |
| `e2e` | `npm run test:e2e` (또는 `e2e`, `test:browser`) — 스크린샷 등 evidence 산출 필수 |
| `build` | `npm run build` |
| `lint` | `npm run lint` |
| `plugin-validator` | `node scripts/vais-validate-plugin.js` |
| `doc-validator` | `node scripts/doc-validator.js` |
| `skill-validator` | `python3 scripts/skill_eval/quick_validate.py` |
| `dependency-scan` | `npm audit --json` |
| `secret-scan` | `node scripts/checks/v2-secret-scan.js` |

### Hook 5종 (`hooks/hooks.json`)

| Hook | 이벤트 | 역할 |
|------|--------|------|
| `workflow-v2-prompt` | UserPromptSubmit | `/vais` 라우팅, 승인 판정, 단계별 지침 주입, drift 감지, session lease |
| `workflow-v2-write-guard` | PreToolUse (Bash / Write / Edit / Agent) | 승인된 write scope 밖 쓰기, 셸 합성·리다이렉션, 미공개 workflow 명령 차단 |
| `workflow-v2-agent-handoff` | PostToolUse (Agent) | specialist handoff JSON 자동 저장·검증 |
| `workflow-v2-drift` | PostToolUse | 변경 경로가 Design scope 안인지 기록 |
| `v2-project-context` | (공용) | 프로젝트 루트·프롬프트 추출 |

- write scope는 Design이 `path/**` 또는 정확한 파일로 선언하며 `.git`, `.vais`, `docs/work-items`, `docs/features`, `docs/README.md`는 선언할 수 없습니다.
- 세션 authorization은 30분 lease입니다 (`workflowV2.authorizationTtlMs`).

---

## Configuration (`vais.config.json`)

| Setting | Default | Description |
|---------|---------|-------------|
| **`workflowV2.mode`** | `enforce` | `enforce` = v3 managed entry. `shadow` / `disabled` = Legacy 흐름 (아래 참조) |
| `workflowV2.managedPrefix` | `/vais` | 관리 대상 프롬프트 접두사 |
| `workflowV2.authorizationTtlMs` | `1800000` | 세션 authorization lease (30분) |
| `workflowV2.statePath` | `.vais/v2/work-items.json` | Work item 상태 저장 경로 |
| `orchestration.mcp.enabled` | `true` | UI 설계 시 design-system MCP 자동 호출 (Python3 ≥ 3.8 필수) |
| `designSystem.model` | `brand-first` | `design-system/brands/{slug}/DESIGN.md` 71 brand 카탈로그 |
| `designSystem.defaultBrand` | `null` | brand 미선택 fallback. `VAIS_DEFAULT_BRAND` env 우선 |
| `designSystem.blockOnMissingBrand` | `true` | brand 미선택 + fallback 없으면 UI 설계 차단 |

---

## Legacy (shadow 모드) 로 되돌리기

v3는 Legacy 구현과 문서를 삭제하지 않았습니다. Legacy C-Suite 라우팅으로 돌아가려면:

1. `vais.config.json > workflowV2.mode`를 `"shadow"`로 변경
2. Claude Code 세션 재시작 (`/reload-plugins`)

shadow / disabled 모드에서는 `skills/vais/legacy.md`가 진입점이 되며, C-Level·phase 직접 호출(`/vais cto plan {feature}` 등), `docs/{feature}/{NN-phase}/main.md` 구조, lean checkpoint, Agent Teams, 47 sub-agent 직접 박제가 그대로 동작합니다. 상세는 [CHANGELOG.md](./CHANGELOG.md) v2.2.x 이하 항목과 `agents/`, `skills/vais/phases/`를 참조하세요.

Agent Teams(`orchestration.agentTeams.enabled`, 기본 false)는 Legacy 전용입니다. `enabled=false` 는 sequential 모드, `enabled=true` + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 은 real SendMessage, flag 없이 `enabled=true` 면 simulation fallback 입니다. enforce 모드의 v2 runtime은 이 설정을 읽지 않습니다.

> v3 전환 근거: Review Attempt 18 (Opus 3×2 동일 조건 비교) 에서 Quality PASS, EFF-01~08 전부 PASS — 사용자 turn 20%, 완료 시간 49.8%, authored bytes 81.1% 감소. 정본: `docs/work-items/vais-workflow/2026-08-31-workflow-redesign/05-report/main.md`

---

## Project Layout

```text
vais-claude-code/
├── skills/vais/           SKILL.md (v2 managed entry) · legacy.md (shadow 모드) · phases/ · utils/
├── skills/brief/          /vais brief — VARCO 보고서·슬라이드 (워크플로우 독립)
├── lib/workflow/v2/       상태 머신 · work-item-store · router · phase-transaction · gate-engine ·
│                          write-policy · tool-adapters · context-capsule · repo-drift · role-registry … (23 모듈)
├── scripts/vais-workflow-v2.js   내부 workflow CLI (status/search/context/plan present/design present/
│                                 do ready/review prepare/review decide/report finalize/assignment/handoff)
├── hooks/                 workflow-v2-prompt · workflow-v2-write-guard · workflow-v2-agent-handoff ·
│                          workflow-v2-drift · v2-project-context (+ Legacy: session-start, design-mcp-trigger …)
├── agents/v2-specialist.md   단일 runtime specialist Agent
├── agents/{c-level}/      Legacy C-Level·sub-agent 본문 (shadow 모드 전용) + knowledge/ 19 MD
├── contracts/             v2-role-cards.json · workflow-contract.md · agent-teams.md
├── schemas/               work-item · specialist-assignment · specialist-handoff · check-result ·
│                          gate-result · phase-transaction-receipt 등 JSON schema
├── docs/                  README.md (Master) · features/ · work-items/
├── design-system/         Brand-first 카탈로그 (brands/{slug}/DESIGN.md × 71)
├── mcp/                   vais-design-system MCP 서버
├── templates/             Legacy PDCA 문서 템플릿 (shadow 모드)
├── tests/                 node --test (v2-*.test.js 16종 포함)
├── ONBOARDING.md          5분 진입 가이드
├── CLAUDE.md              Claude Code 전용 지침 (자동 로드)
└── vais.config.json       플러그인 전체 설정
```

---

## Testing

```bash
npm test          # 전체 unit + integration
npm run lint      # eslint scripts/ lib/ hooks/
node scripts/vais-validate-plugin.js   # 플러그인 구조 검증
```

---

## Developer Setup

Git hooks 활성화 (1회 실행):

```bash
npm run prepare-hooks
```

활성화되는 검사:

- **legacy-path-guard** — top-level `docs/NN-` 레거시 경로 패턴 커밋 차단
- ESLint (`scripts/`, `lib/`, `hooks/` — max-warnings 0)
- Unit tests (`node --test tests/*.test.js`)

> `git commit --no-verify`로 hook을 우회하지 마세요.

---

## CI Status Check 강제 (owner 수동 설정)

PR merge를 CI 통과 후에만 허용하려면 저장소 owner가 branch protection rule을 수동으로 설정해야 합니다:

1. GitHub 저장소 → **Settings** → **Branches**
2. **Branch protection rules** → **Add rule**
3. Branch name pattern: `main`
4. ✅ **Require status checks to pass before merging**
5. Status check 검색창에서 `CI / build-and-test` 선택 (workflow job name)
6. ✅ **Require branches to be up to date before merging**
7. (선택) ✅ **Require pull request reviews before merging**

---

## Documentation

- **[ONBOARDING.md](./ONBOARDING.md)** — 5분 진입 가이드 (처음 본 AI/사람용)
- **[CLAUDE.md](./CLAUDE.md)** — Claude Code 전용 지침 (자동 로드)
- **[CHANGELOG.md](./CHANGELOG.md)** — 전체 버전 이력
- **[docs/README.md](./docs/README.md)** — Feature / Work item Master 인덱스
- **[contracts/v2-role-cards.json](./contracts/v2-role-cards.json)** — runtime 역할 카드 정본
- **[skills/vais/SKILL.md](./skills/vais/SKILL.md)** — `/vais` managed entry 규칙
- **[skills/vais/legacy.md](./skills/vais/legacy.md)** — shadow 모드 Legacy 진입점

---

## License

MIT

<p align="center">
  <sub>Built with <a href="https://claude.ai/claude-code">Claude Code</a></sub>
</p>
