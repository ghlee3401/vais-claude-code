# VAIS Code - Agent Instructions

> 이 파일은 AI 코딩 도구(Claude Code, Cursor, Copilot 등)에서 공통으로 참조하는 에이전트 지침입니다.

## 프로젝트 구조

이 프로젝트는 VAIS Code 플러그인입니다. Claude Code에서 5단계 개발 워크플로우를 제공합니다.

## 개발 워크플로우 (5단계)

```
📋기획(plan) → 🎨설계(design) → 🔧구현(do) → ✅QA(qa) → 📊보고서(report)
```

모든 기능 개발은 반드시 기획(plan)부터 시작합니다.
각 단계의 산출물은 `docs/{번호}-{단계}/{역할}_{기능명}.{단계}.md`에 저장합니다.

### 병렬 실행 구간

- **구현(do)**: frontend-engineer + backend-engineer + test-engineer 병렬

### Gate 체크포인트

```
Plan → [Gate] → Design → [Gate] → Do (frontend+backend) → [Gate] → QA → Report
```

## 실행 방식 (C-Suite 오케스트레이션)

```
/vais cto login              — CTO가 기술 전체 오케스트레이션 (plan→design→do→qa→report)
/vais ceo login              — CEO가 비즈니스 전략 + C-Suite 조율
/vais cpo login              — CPO가 제품 방향 + PRD + 로드맵
/vais status                 — 프로젝트 상태 조회
/vais help                   — 사용법 안내
```

실행 에이전트(infra-architect, frontend-engineer, backend-engineer 등)는 직접 호출하지 않습니다. C-레벨 에이전트가 필요에 따라 위임합니다.

## 필수 규칙

1. **기획 없이 코드 금지**: 기획서가 없으면 먼저 `/vais cto {feature}`로 기획부터 시작합니다
2. **코딩 규칙 준수**: 구현 시 반드시 기획서(`docs/{feature}/plan/`)의 코딩 규칙 섹션을 참조합니다
3. **QA 필수**: 구현 완료 후 CTO가 QA 에이전트를 통해 빌드 확인 + 설계 대비 일치율을 검증합니다
4. **문서 참조 투명성**: 구현 시 참조한 문서 목록을 산출물 상단에 기록합니다
5. **위험 명령 금지**: `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
6. **환경 변수**: 민감 정보는 반드시 환경 변수로 관리합니다

## 에이전트 역할

### C-Suite (전략 레이어, Opus)

| 에이전트 | 역할 |
|---------|------|
| cto | Technical lead orchestrator (required) |
| ceo | Business strategy + absorb orchestrator |
| cpo | Product direction + PRD + pm-* sub-agent orchestration |
| cso | Security Gate A + plugin validation Gate B + independent review Gate C + compliance |
| cbo | Business layer — GTM, marketing, finance, pricing, unit economics (CMO+CFO 통합) |
| coo | Operations, CI/CD, monitoring (delegates to release-engineer/sre-engineer) |

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
| 기획 (plan) | `docs/{feature}/plan/` |
| 설계 (design) | `docs/{feature}/design/` |
| 구현 (do) | `docs/{feature}/do/` |
| QA (qa) | `docs/{feature}/qa/` |
| 보고서 (report) | `docs/{feature}/report/` |

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

프로젝트별로 다르므로 `docs/{feature}/plan/` 기획서의 기술 스택 섹션을 참조합니다.

