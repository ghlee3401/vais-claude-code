# VAIS Code - Claude Code Plugin

> Virtual AI C-Suite for software development (v0.58.3)
> Claude Code marketplace plugin: `vais-code`

## What This Project Is

AI C-Suite 조직 시뮬레이션 플러그인. CEO가 Product Owner로서 6 C-Level 팀(CPO, CTO, CSO, CBO, COO)을 고용·지휘하여 서비스 런칭 전체 라이프사이클을 자동 실행한다. 개별 C-Level 직접 호출도 가능. v0.50에서 CMO+CFO→CBO 통합, optional ideation phase 신설, Advisor Tool 기본 활성화.

## Project Structure

```
vais-claude-code/
├── agents/          # C-Level 별 하위 폴더로 구성된 에이전트 (6 C-Level + 38 sub-agent)
│   ├── ceo/         #   CEO + absorb-analyzer + skill-creator
│   ├── cpo/         #   CPO + product-discoverer/strategy/research/prd + backlog-manager + ux-researcher + data-analyst
│   ├── cto/         #   CTO + infra-architect/backend-engineer/frontend-engineer/ui-designer/db-architect/qa-engineer/test-engineer/incident-responder
│   ├── cso/         #   CSO + security-auditor/code-reviewer/secret-scanner/dependency-analyzer/plugin-validator/skill-validator/compliance-auditor
│   ├── cbo/         #   CBO + market-researcher/customer-segmentation-analyst/seo-analyst/copy-writer/growth-analyst/pricing-analyst/financial-modeler/unit-economics-analyst/finops-analyst/marketing-analytics-analyst
│   ├── coo/         #   COO + release-engineer/sre-engineer/release-monitor/performance-engineer
│   └── _shared/     #   공유 가드 (advisor-guard, ideation-guard)
├── skills/vais/     # SKILL.md + phases/ + utils/
├── hooks/           # hooks.json, events.json, session-start.js
├── lib/             # 핵심 라이브러리 (fs-utils, io, memory, paths, status, ui)
├── scripts/         # bash-guard, phase-transition, auditors 등
├── templates/       # PDCA 문서 템플릿 (plan, design, do, qa, report)
├── mcp/             # MCP 서버 설정 (현재 비활성, v0.48+ 활용 예정)
├── output-styles/   # 출력 스타일 정의 (session-start hook이 로드)
├── docs/            # 피처별 산출물 (docs/{feature}/{phase}/main.md, v0.52+ 피처 중심 구조)
├── references/      # 흡수 대기 inbox (gitignored, _inbox/만 유지 — 내부 공유 문서 저장 금지)
├── basic/           # 하네스 엔지니어링 최소 참조 구조 (패턴 참고용, 프로덕션 코드 아님)
├── vendor/          # 외부 의존 (ui-ux-pro-max)
├── tests/           # 테스트
├── vais.config.json # 플러그인 전체 설정 (워크플로우, 게이트, C-Suite 역할)
├── package.json     # 플러그인 매니페스트
└── AGENTS.md        # 범용 에이전트 지침 (Cursor/Copilot 호환)
```

## Agent Architecture

### C-Suite (전략 레이어, Opus)
| Agent | Role |
|-------|------|
| CEO | **Top-level orchestrator** — Product Owner, dynamic routing (10+1 시나리오), ideation 라우팅 |
| CPO | Product definition + PRD + backlog + pm-* sub-agent orchestration |
| CTO | Technical lead — Plan→Design→Do→QA development workflow orchestration |
| CSO | Security & quality review — Gate A(security)/B(plugin)/C(code review) + secret scan + dependency analysis |
| CBO | **Business layer** — GTM, marketing, finance, pricing, unit economics (CMO+CFO 통합) |
| COO | Deployment/operations, CI/CD, monitoring, performance benchmarks |

### 서비스 런칭 파이프라인 (CEO 동적 라우팅)
```
CEO가 피처 성격 + 산출물 상태를 분석하여 다음 C-Level을 동적으로 추천
→ 사용자 승인 → 해당 C-Level PDCA 실행 → CEO 다시 판단 → 반복
→ 모든 필요 C-Level 완료 → CEO 최종 리뷰
의존성: CTO→CPO, CSO/COO→CTO, CBO 의존 없음 (참고용, hard constraint 아님)
```

### Execution (실행 레이어, Sonnet)

| Agent | C-Level | Role |
|-------|---------|------|
| infra-architect | CTO | DB schema + environment + project setup |
| ui-designer | CTO | IA + wireframes + UI design |
| frontend-engineer | CTO | Frontend implementation |
| backend-engineer | CTO | Backend API implementation |
| qa-engineer | CTO | Gap analysis + code review + QA verification |
| test-engineer | CTO | Test code generation (unit/integration/e2e) |
| db-architect | CTO | DB schema optimization + migration + query tuning |
| incident-responder | CTO | Systematic debugging (4-phase: investigate→analyze→hypothesize→implement) |
| security-auditor | CSO | Security audit (OWASP Top 10) |
| code-reviewer | CSO | Independent code review |
| secret-scanner | CSO | Source code secret detection (regex + entropy) |
| dependency-analyzer | CSO | CVE/license/supply chain risk analysis |
| plugin-validator | CSO | Plugin deployment validation |
| skill-validator | CSO | Skill/agent markdown frontmatter validation |
| compliance-auditor | CSO | Compliance (GDPR/license) |
| market-researcher | CBO | Market/competitor analysis (PEST/SWOT/Porter/TAM) |
| customer-segmentation-analyst | CBO | Customer segmentation + personas (RFM/JTBD) |
| seo-analyst | CBO | SEO audit + content strategy |
| copy-writer | CBO | Marketing copy + brand positioning |
| growth-analyst | CBO | GTM strategy + growth loops + funnel optimization |
| pricing-analyst | CBO | Pricing strategy + tier design |
| financial-modeler | CBO | 3-Statement model + DCF + scenario analysis |
| unit-economics-analyst | CBO | CAC/LTV/cohort/SaaS metrics |
| finops-analyst | CBO | Cloud cost analysis + optimization |
| marketing-analytics-analyst | CBO | Multi-touch attribution + channel ROI |
| release-engineer | COO | CI/CD pipeline + Docker + deployment automation |
| sre-engineer | COO | SRE/monitoring + incident runbook |
| release-monitor | COO | Post-deployment canary monitoring |
| performance-engineer | COO | Performance benchmarks + regression detection |
| absorb-analyzer | CEO | External skill/reference absorption analysis |
| skill-creator | CEO | Auto skill/agent markdown generation |
| backlog-manager | CPO | PRD → user story + sprint plan conversion |
| ux-researcher | CPO | UX research (JTBD interviews/usability tests) |
| data-analyst | CPO/CTO/CBO | Product metrics (DAU/MAU/A/B tests) |

### PM (제품 기획 레이어, CPO 서브)
product-discoverer, product-strategist, product-researcher, prd-writer

### Utility
absorb-analyzer (CEO 서브, 레퍼런스 흡수 분석)

## Development Workflow

### CEO 서비스 런칭 (동적 라우팅)
```
CEO가 피처 성격 + 산출물 상태 분석 → 다음 C-Level 추천 → 사용자 승인 → 실행 → 반복 → 최종 리뷰
(의존성: CSO/COO/CFO → CTO, CMO → CPO)
```

### CTO 단독 (기술 구현, 6 Phases)
```
(💡 ideation, optional) → 📋 plan → 🎨 design → 🔧 do (frontend-engineer + backend-engineer + test-engineer 병렬) → ✅ qa → 📊 report
```

- 두 가지 진입점: CEO (전체 런칭) / CTO (기술만) / 개별 C-Level 직접 호출
- 각 단계 간 Gate 체크포인트에서 완료 조건 검증
- Gate 동작은 `vais.config.json > orchestration.gateAction` 참조
- 런칭 파이프라인 설정: `vais.config.json > cSuite.launchPipeline`

## Key Configuration

- **vais.config.json**: 워크플로우 단계, C-Suite 역할, 게이트, gap 분석 기준(90%), 피처명 규칙 등 전체 설정
- **hooks/hooks.json**: Claude Code 훅 정의
- **package.json > claude-plugin**: 스킬/에이전트/훅 진입점

## Mandatory Rules

1. **기획 없이 코드 금지** — `docs/{feature}/01-plan/` 기획서가 없으면 구현하지 않는다
2. **워크플로우 순서 준수** — (optional) ideation → plan → design → do → qa → report 순서를 건너뛰지 않는다. plan, design, do, qa는 mandatory phase로 스킵 금지. **ideation은 optional이며 mandatory 목록에 포함하지 않는다** (SC-13). C-Level 간 위임 시에도 각 phase를 순차 별도 호출해야 한다
3. **산출물 경로** — `docs/{feature}/{NN-phase}/main.md` 형식 준수. Phase↔Folder 매핑: `ideation`→`00-ideation`, `plan`→`01-plan`, `design`→`02-design`, `do`→`03-do`, `qa`→`04-qa`, `report`→`05-report`. 커맨드는 phase 이름(`plan`) 그대로 사용. 대형 피처는 sub-doc 분리 가능 (main.md가 인덱스). Single source of truth: `vais.config.json > workflow.docPaths`. **v0.57+ Sub-doc 표준**: sub-agent 는 `docs/{feature}/{NN-phase}/_tmp/{agent-slug}.md` scratchpad 에 작성, C-Level 은 topic 별 `{topic}.md` 로 합성 (프리셋: `workflow.topicPresets`). `_tmp/` 는 영구 보존 + git 커밋.
4. **Gate 통과 필수** — 각 Gate의 체크리스트 항목을 모두 확인한 뒤 다음 단계로 진행
5. **위험 명령 금지** — `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수** — 민감 정보는 반드시 환경 변수로 관리
7. **참조 투명성** — 외부 문서 참고 시 `// @see {URL}` 주석 추가
8. **C-Suite 호출 규칙** — 실행 에이전트(infra-architect, backend-engineer, frontend-engineer 등)는 직접 호출 금지, 반드시 CTO를 통해 호출
9. **완전성 원칙 (Boil the Lake)** — 각 C-Level은 담당 범위를 완전하게 수행. "나중에" 미룸 금지. Lake(끓일 수 있는 범위)는 끓이고, Ocean(전체 재작성 등)은 범위 밖으로 표시
    - **Lake 는 사용자가 지정한다.** AI 는 Lake 를 자의로 확장하지 않는다. 자발 감지한 확장 후보는 plan/main.md 의 `## 관찰 (후속 과제)` 섹션에 기록만 하고, 사용자 명시 승인 전까지는 In-scope 에 포함하지 않는다.
10. **탐색 우선 (Search Before Building)** — 빌드 전 기존 솔루션 탐색. 검증된 패턴 → 현재 베스트 프랙티스 → First Principles 순서
11. **사용자 주권 (User Sovereignty)** — AI는 추천, 사용자가 결정. CEO 체크포인트에서 반드시 사용자 확인
12. **Plan은 결정, Do는 실행** — Plan 단계에서는 `docs/{feature}/01-plan/` 산출물만 작성. 프로덕트 파일(skills/, agents/, lib/, src/ 등) 생성·수정은 Do 단계에서만 허용
13. **레거시 경로 금지** — 문서·코드 모두 **top-level** `docs/NN-` (예: `docs/01-plan/`, `docs/02-design/`) 패턴 사용 금지. 새 구조 `docs/{feature}/{NN-phase}/main.md`만 사용 (feature-grouped, phase subfolder에 NN- 접두사). 예외: `docs/_legacy/`, `CHANGELOG.md`(릴리즈 이력), `tests/paths.test.js` 회귀 가드 문자열, 본 피처 문서 자체. `.hooks/pre-commit`이 자동 차단(top-level만 검사 — feature 하위 `docs/{feature}/NN-phase/`는 Rule #3에 의해 허용)하며, 설치는 `npm run prepare-hooks` 1회 실행. `--no-verify` 사용은 금지.
14. **Sub-doc 보존 원칙 (v0.57+)** — sub-agent 는 자기 분석/설계/구현 결과를 **축약 없이** `docs/{feature}/{NN-phase}/_tmp/{agent-slug}.md` scratchpad 에 기록. C-Level 은 `_tmp/*.md` 전체를 **읽고 큐레이션**(필요성/누락/충돌 판단)하여 **topic 별 `{topic}.md` 문서 여러 개** + `main.md` 인덱스로 재구성. 각 topic 문서는 `## 큐레이션 기록` 섹션(채택/거절/병합/추가) 필수. **`_tmp/` 는 삭제하지 않고 영구 보존 + git 커밋** (추적성). 병렬 sub-agent 가 `main.md`/`{topic}.md` 직접 편집 금지 — race 방지. 검증: `scripts/doc-validator.js` 의 W-SCP/W-TPC/W-IDX 경고 (`workflow.subDocPolicy.enforcement=warn` 기본).
15. **C-Level 공존 원칙 (v0.58+)** — 같은 `docs/{feature}/{NN-phase}/main.md` 에 여러 C-Level 이 기여할 수 있다. 각 C-Level 은 **자기 진입 시 기존 main.md 를 Read 필수**, `## [{C-LEVEL}] ...` H2 섹션(대문자: `[CBO]`/`[CPO]`/`[CTO]`/`[CSO]`/`[COO]`/`[CEO]`)을 append, **다른 C-Level 의 H2 섹션·Decision Record 행·Topic 인덱스 엔트리 수정·삭제 금지**. topic 문서는 frontmatter `owner: {c-level}` 필수(enum: `ceo\|cpo\|cto\|cso\|cbo\|coo`), 파일명은 topic-first(`requirements.md` O, `cpo-requirements.md` X). 동일 C-Level 재진입 시 자기 섹션 교체 허용하되 `## 변경 이력` entry 필수. **(F14) main.md 가 `workflow.cLevelCoexistencePolicy.mainMdMaxLines`(기본 200) 초과 시 topic 분리 필수 — sub-agent 미위임하는 C-Level 직접 작성 phase(UI 없는 메타 피처 등) 도 동일 적용**. 검증: `scripts/doc-validator.js` 의 `W-OWN-01/02` / `W-MRG-02/03` / `W-MAIN-SIZE` 경고 (`workflow.cLevelCoexistencePolicy.enforcement=warn` 기본). 6 C-Level agent md 에 `agents/_shared/clevel-main-guard.md` 블록 자동 주입 (`scripts/patch-clevel-guard.js`).

## Version Management

버전은 다음 파일에서 동기화 필요:
- `package.json` (version)
- `vais.config.json` (version)
- `.claude-plugin/plugin.json` (version)
- `.claude-plugin/marketplace.json` (metadata.version + plugins[0].version)
- `CHANGELOG.md`

커밋 시 `/vais commit` 플로우를 사용할 것.

## File Conventions

- 피처 이름: kebab-case 영문, 의도가 드러나는 2~4단어 조합 (`social-login-integration`, `payment-retry-logic`, `dashboard-realtime-chart`)
- 에이전트 파일: `agents/{c-level}/{role}.md` (frontmatter + 마크다운)
- 스킬 파일: `skills/{name}/SKILL.md`
- 템플릿: `templates/{phase}.template.md`
- 라이브러리: `lib/*.js` (CJS)

## Testing

```bash
node scripts/vais-validate-plugin.js  # 플러그인 구조 검증
```

## Do NOT

- AGENTS.md를 삭제하거나 CLAUDE.md와 병합하지 말 것 (Cursor/Copilot 호환용으로 유지)
- `vendor/` 내 파일을 직접 수정하지 말 것
- 에이전트 frontmatter 형식을 임의로 변경하지 말 것
- `vais.config.json`의 키 구조를 사전 합의 없이 변경하지 말 것
- `basic/` 디렉토리는 패턴 참고용 — 코드 리뷰, QA, 보안 점검 대상에서 제외
