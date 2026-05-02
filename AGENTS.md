# VAIS Code - Agent Instructions

> **이 파일의 책임**: Cursor / Copilot / 일반 AI 도구용 호환 지침. Claude Code 는 `CLAUDE.md` 를 우선 참조한다 (자동 로드). 처음 본 AI/사람은 먼저 `ONBOARDING.md` (5분 진입 가이드) 를 읽기를 권장.

## 프로젝트 구조

이 프로젝트는 VAIS Code 플러그인입니다. Claude Code에서 5단계 개발 워크플로우를 제공합니다.

## 개발 워크플로우 (v2.0 — CTO 만 mandatory PDCA)

```
📋기획(plan) → 🎨설계(design) → 🔧구현(do) → ✅QA(qa) → 📊보고서(report)
```

**v2.0 정책**:
- **CTO**: 위 5 phase mandatory + 순차. 코드 영역 phase 분리 의미 있음
- **CEO**: ideation 만 mandatory. 라우팅·최종 리뷰는 phase 분리 안 함
- **CPO/CSO**: CEO 7 차원 알고리즘이 활성화한 phase 만 실행 (mandatory 미적용)
- **CBO/COO**: Secondary — 사용자 명시 호출만 활성, mandatory 미적용

각 phase 산출물은 `docs/{feature}/{NN-phase}/main.md` (인덱스) + `{artifact}.md` (sub-agent 직접 박제) 에 저장.

### 병렬 실행 구간

- **구현(do)**: frontend-engineer + backend-engineer + test-engineer 병렬

### Gate 체크포인트

```
Plan → [Gate] → Design → [Gate] → Do (frontend+backend) → [Gate] → QA → Report
```

## 실행 방식 (v2.0 — 4 Primary + 2 Secondary)

```
# Primary (CEO 자동 라우팅)
/vais ceo {feature}          — CEO 7 차원 분석 → 활성 C-Level 자동 결정 → AskUserQuestion 클릭
/vais cto plan|design|do|qa|report {feature}  — CTO PDCA (mandatory 순서)
/vais cpo {feature}          — CEO 가 활성화한 phase 만 실행
/vais cso {feature}          — CEO 가 활성화한 phase 만 실행

# Secondary (사용자 명시 호출만)
/vais cbo plan|do|qa {feature}  — GTM/마케팅/재무/pricing 필요 시
/vais coo plan|do|qa {feature}  — 운영/CI/CD/모니터링 필요 시

/vais status                 — 프로젝트 상태 조회
/vais help                   — 사용법 안내
```

실행 에이전트(infra-architect, frontend-engineer, backend-engineer 등)는 직접 호출하지 않습니다. C-Level 에이전트가 필요에 따라 위임하고, sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 frontmatter 8 필드와 함께 직접 박제합니다.

## 필수 규칙

1. **기획 없이 코드 금지**: 기획서가 없으면 먼저 `/vais cto {feature}`로 기획부터 시작합니다
2. **코딩 규칙 준수**: 구현 시 반드시 기획서(`docs/{feature}/01-plan/`)의 코딩 규칙 섹션을 참조합니다
3. **QA 필수**: 구현 완료 후 CTO가 QA 에이전트를 통해 빌드 확인 + 설계 대비 일치율을 검증합니다
4. **문서 참조 투명성**: 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다
5. **위험 명령 금지**: `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수**: 민감 정보는 반드시 환경 변수로 관리합니다
7. **Sub-doc 직접 박제 (v2.0)**: `_tmp/` 폐기. sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 frontmatter 8 필드 (owner/agent/artifact/phase/feature/source/generated/summary) 표준으로 직접 작성. 큐레이션 (✅/❌/✓) 폐기. 정본: `agents/_shared/subdoc-guard.md` v2.0
8. **C-Level 공존 — main.md 인덱스 (v2.0)**: main.md = 5 섹션 인덱스 (Executive/Decision Record/Artifacts/CEO 판단 근거/Next Phase). 본문 X. Decision Record append-only + Owner 컬럼 필수. Artifacts 표 = sub-agent artifact frontmatter 자동 추출. 200줄 자연 충족 (refuse 아닌 warn). 정본: `agents/_shared/clevel-main-guard.md` v2.0

## 에이전트 역할

### C-Suite (전략 레이어, Opus) — v2.0 분류

| 에이전트 | 분류 | 역할 |
|---------|:----:|------|
| ceo | **Primary** | Top-level orchestrator + 7 차원 알고리즘 (`lib/ceo-algorithm.js`) + ideation + absorb |
| cpo | **Primary** | Product direction + PRD + 로드맵 + 백로그 (CEO 가 활성화한 phase 만) |
| cto | **Primary** | Technical lead — 유일한 mandatory PDCA (plan→design→do→qa→report) |
| cso | **Primary** | Security Gate A/B/C + secret scan + dependency analysis (CEO 활성 phase) |
| cbo | **Secondary** | GTM/marketing/finance/pricing/unit economics — 사용자 명시 호출만 |
| coo | **Secondary** | Operations/CI/CD/monitoring — 사용자 명시 호출만 |

### Execution (실행 레이어, Sonnet)

| 에이전트 | C-Level | 역할 |
|---------|---------|------|
| infra-architect | CTO | DB schema + environment + project setup |
| ui-designer | CTO | IA + wireframes + UI design |
| frontend-engineer | CTO | Frontend implementation |
| backend-engineer | CTO | Backend API implementation |
| qa-engineer | CTO | Gap analysis + code review + QA verification |
| test-engineer | CTO | Test code generation (unit/integration/e2e) |
| release-engineer | CTO/COO | CI/CD + Docker + deployment automation |
| db-architect | CTO | DB schema optimization + migration + query tuning |
| security-auditor | CSO | Security audit (OWASP Top 10) |
| secret-scanner | CSO | Source code secret detection |
| dependency-analyzer | CSO | CVE/license/supply chain risk analysis |
| skill-validator | CSO | Skill/agent markdown frontmatter validation |
| compliance-auditor | CSO | Compliance (GDPR/license) |
| market-researcher | CBO | Market/competitor analysis |
| customer-segmentation-analyst | CBO | Customer segmentation + personas |
| seo-analyst | CBO | SEO audit |
| copy-writer | CBO | Marketing copy |
| growth-analyst | CBO | Growth funnel strategy |
| pricing-analyst | CBO | Pricing models + revenue simulation |
| financial-modeler | CBO | 3-Statement model + DCF + scenario analysis |
| unit-economics-analyst | CBO | CAC/LTV/cohort/SaaS metrics |
| finops-analyst | CBO | Cloud cost analysis |
| marketing-analytics-analyst | CBO | Multi-touch attribution + channel ROI |
| sre-engineer | COO | SRE/monitoring + incident runbook |
| ux-researcher | CPO | UX research |
| backlog-manager | CPO | PRD → user story + sprint plan conversion |
| data-analyst | CPO/CTO/CBO | Product metrics analysis |
| incident-responder | CTO | Systematic debugging |
| skill-creator | CEO | Auto skill/agent markdown generation |
| release-monitor | COO | Post-deployment canary monitoring |
| performance-engineer | COO | Performance benchmarks |

실행 에이전트는 **직접 호출 금지** — 반드시 CTO를 통해 호출합니다.

## 문서 위치

| 단계 | 경로 |
|------|------|
| 기획 (plan) | `docs/{feature}/01-plan/` |
| 설계 (design) | `docs/{feature}/02-design/` |
| 구현 (do) | `docs/{feature}/03-do/` |
| QA (qa) | `docs/{feature}/04-qa/` |
| 보고서 (report) | `docs/{feature}/05-report/` |

## 피처 이름 가이드

kebab-case 영문 소문자를 권장합니다. 아래는 서비스에서 자주 쓰는 이름 예시입니다:

| 분류 | 예시 |
|------|------|
| 인증·사용자 | `login`, `signup`, `oauth`, `user-profile`, `my-page`, `password-reset` |
| 결제·커머스 | `payment`, `cart`, `checkout`, `order-history`, `wishlist`, `coupon` |
| 콘텐츠 | `feed`, `post`, `comment`, `search`, `notification`, `bookmark` |
| 소셜 | `chat`, `follow`, `share`, `invite`, `review` |
| 관리·운영 | `dashboard`, `settings`, `admin-panel`, `analytics` |

> 강제 사항은 아닙니다. 자유롭게 작명하되, 파일 경로에 들어가므로 영문 kebab-case가 편합니다.

## 기술 스택 참고

프로젝트별로 다르므로 `docs/{feature}/01-plan/` 기획서의 기술 스택 섹션을 참조합니다.

