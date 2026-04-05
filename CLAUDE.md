# VAIS Code - Claude Code Plugin

> Virtual AI C-Suite for software development (v0.41.1)
> Claude Code marketplace plugin: `vais-code`

## What This Project Is

AI C-Suite 조직 시뮬레이션 플러그인. CEO가 Product Owner로서 C-Level 팀(CPO, CTO, CSO, CMO, COO, CFO)을 고용·지휘하여 서비스 런칭 전체 라이프사이클을 자동 실행한다. 개별 C-Level 직접 호출도 가능.

## Project Structure

```
vais-claude-code/
├── agents/          # C-Level 별 하위 폴더로 구성된 에이전트 (33개)
│   ├── ceo/         #   CEO + absorb-analyzer + retro
│   ├── cpo/         #   CPO + pm-discovery/strategy/research/prd + ux-researcher + data-analyst
│   ├── cto/         #   CTO + architect/backend/frontend/design/qa + tester/devops/database + investigate
│   ├── cso/         #   CSO + security/validate-plugin/code-review + compliance
│   ├── cmo/         #   CMO + seo + copywriter + growth
│   ├── coo/         #   COO + canary/benchmark + sre + devops(공유) + docs-writer
│   └── cfo/         #   CFO + cost-analyst + pricing-modeler
├── skills/vais/     # SKILL.md + phases/ + utils/
├── hooks/           # hooks.json, events.json, session-start.js
├── lib/             # 핵심 라이브러리 (fs-utils, io, memory, paths, status, ui)
├── scripts/         # bash-guard, phase-transition, auditors 등
├── templates/       # PDCA 문서 템플릿 (plan, design, do, qa, report)
├── mcp/             # MCP 서버 설정
├── output-styles/   # 출력 스타일 정의
├── docs/            # 피처별 산출물 (01-plan ~ 05-report)
├── references/      # 참고 문서
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
| CEO | **Top-level orchestrator** — Product Owner, hires & directs C-Level teams, service launch pipeline |
| CPO | Product definition + PRD + pm-* sub-agent orchestration |
| CTO | Technical lead — Plan→Design→Do→QA development workflow orchestration |
| CSO | Security & quality review — Gate A(security)/B(plugin)/C(independent code review), reports issues to CEO→CTO fix loop |
| CMO | Marketing strategy + SEO audit delegation |
| COO | Deployment/operations, CI/CD, monitoring |
| CFO | Cost analysis, ROI, feature-level pricing |

### 서비스 런칭 파이프라인 (CEO 오케스트레이션)
```
CEO → ① CPO → ② CTO → ③ CSO(↺CTO) → ④ CMO → ⑤ COO → ⑥ CFO → CEO 최종 리뷰
```

### Execution (실행 레이어, Sonnet)

| Agent | C-Level | Role |
|-------|---------|------|
| architect | CTO | DB schema + environment + project setup |
| design | CTO | IA + wireframes + UI design |
| frontend | CTO | Frontend implementation |
| backend | CTO | Backend API implementation |
| qa | CTO | Gap analysis + code review + QA verification |
| tester | CTO | Test code generation (unit/integration/e2e) |
| devops | CTO/COO | CI/CD pipeline + Docker + deployment automation |
| database | CTO | DB schema optimization + migration + query tuning |
| security | CSO | Security audit (OWASP Top 10) |
| validate-plugin | CSO | Plugin deployment validation |
| code-review | CSO | Independent code review |
| compliance | CSO/CFO | Compliance (GDPR/license) |
| seo | CMO | SEO audit |
| copywriter | CMO | Marketing copy (landing/email/app store) |
| growth | CMO | Growth funnel strategy + viral loop |
| sre | COO | SRE/monitoring + incident runbook |
| docs-writer | COO/CTO/CPO | Technical docs (API docs/README/guides) |
| cost-analyst | CFO | Cloud cost analysis + optimization |
| pricing-modeler | CFO | Pricing models + revenue simulation |
| investigate | CTO | Systematic debugging (4-phase: investigate→analyze→hypothesize→implement) |
| canary | COO | Post-deployment canary monitoring |
| benchmark | COO | Performance benchmarks + regression detection |
| retro | CEO | Engineering retrospective + learning extraction |
| ux-researcher | CPO | UX research (JTBD interviews/usability tests) |
| data-analyst | CPO/CTO/CFO | Product metrics (DAU/MAU/A/B tests) |

### PM (제품 기획 레이어, CPO 서브)
pm-discovery, pm-strategy, pm-research, pm-prd

### Utility
absorb-analyzer (CEO 서브, 레퍼런스 흡수 분석)

## Development Workflow

### CEO 서비스 런칭 (전체 라이프사이클)
```
CEO → CPO(제품정의) → CTO(개발) → CSO(보안검토↺CTO) → CMO(마케팅) → COO(배포) → CFO(비용/가격) → CEO 최종리뷰
```

### CTO 단독 (기술 구현, 5 Phases)
```
📋 plan → 🎨 design → 🔧 do (frontend + backend + tester 병렬) → ✅ qa → 📊 report
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

1. **기획 없이 코드 금지** — `docs/01-plan/` 기획서가 없으면 구현하지 않는다
2. **워크플로우 순서 준수** — plan → design → do → qa → report 순서를 건너뛰지 않는다
3. **산출물 경로** — `docs/{번호}-{단계}/{role}_{feature}.{phase}.md` 형식 준수 (모든 C-Level 공통)
4. **Gate 통과 필수** — 각 Gate의 체크리스트 항목을 모두 확인한 뒤 다음 단계로 진행
5. **위험 명령 금지** — `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수** — 민감 정보는 반드시 환경 변수로 관리
7. **참조 투명성** — 외부 문서 참고 시 `// @see {URL}` 주석 추가
8. **C-Suite 호출 규칙** — 실행 에이전트(architect, backend, frontend 등)는 직접 호출 금지, 반드시 CTO를 통해 호출

## Version Management

버전은 다음 파일에서 동기화 필요:
- `package.json` (version)
- `vais.config.json` (version)
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
