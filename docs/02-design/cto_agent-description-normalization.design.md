# CTO Design — agent-description-normalization

## 변환 형식

```yaml
description: |
  {3인칭 영어 서술 1~2문장}.
  Use when: {사용 시점}.
  Triggers: {키워드} (C-Suite만, 실행 에이전트는 생략)
```

## 변환 맵 (37개)

### CEO 조직 (3)

#### ceo/ceo.md
```yaml
description: |
  Top-level orchestrator acting as Product Owner. Hires and directs C-Level teams
  through service launch pipeline (CPO→CTO→CSO→CMO→COO→CFO), routing mode, and absorb mode.
  Use when: business strategy, new product launch, C-Suite coordination, or external skill absorption is needed.
  Triggers: ceo, strategy, business direction, 전략, 비즈니스, 방향, new product, 신규 서비스, launch, 런칭, 서비스
```

#### ceo/absorb-analyzer.md
```yaml
description: |
  Analyzes external references for absorption feasibility. Evaluates target files for duplication,
  quality/fitness scoring, and C-Level domain classification, then returns results to CEO.
  Use when: delegated by CEO during absorb mode to assess external skill/agent references.
```

#### ceo/retro.md
```yaml
description: |
  Generates engineering retrospective reports by analyzing commit history, work patterns,
  and code quality metrics for weekly or sprint reviews.
  Use when: delegated by CEO for retrospective analysis or learning extraction.
```

### CFO 조직 (3)

#### cfo/cfo.md
```yaml
description: |
  Manages financial analysis including cost-benefit analysis, ROI calculations, and pricing strategy.
  Delegates to cost-analyst and pricing-modeler sub-agents.
  Use when: financial analysis, cost estimation, ROI evaluation, or pricing decisions are needed.
  Triggers: cfo, finance, 재무, 비용, ROI, 가격, 예산, cost, pricing, budget
```

#### cfo/cost-analyst.md
```yaml
description: |
  Estimates cloud infrastructure costs, optimizes resource allocation, and calculates API call expenses.
  Use when: delegated by CFO for infrastructure cost analysis or optimization recommendations.
```

#### cfo/pricing-modeler.md
```yaml
description: |
  Simulates pricing models, benchmarks against competitors, and forecasts revenue projections.
  Use when: delegated by CFO for pricing strategy simulation or break-even analysis.
```

### CMO 조직 (4)

#### cmo/cmo.md
```yaml
description: |
  Orchestrates marketing strategy analysis and delegates SEO audits to the seo sub-agent.
  Coordinates copywriter and growth agents for comprehensive marketing execution.
  Use when: marketing strategy, SEO audit, landing page optimization, or content campaigns are needed.
  Triggers: cmo, marketing, seo, SEO, landing, 마케팅, 랜딩, 캠페인, 콘텐츠
```

#### cmo/seo.md
```yaml
description: |
  Performs comprehensive SEO audits covering title/meta tags, semantic HTML, Core Web Vitals,
  and structured data. Saves audit report after analysis.
  Use when: delegated by CMO for technical SEO evaluation and optimization recommendations.
```

#### cmo/copywriter.md
```yaml
description: |
  Creates marketing copy including landing page content, email templates, and app store descriptions.
  Focuses on persuasive marketing text while SEO handles technical optimization.
  Use when: delegated by CMO for marketing copywriting tasks.
```

#### cmo/growth.md
```yaml
description: |
  Designs growth strategies including funnel optimization, viral loop engineering, and retention analysis.
  Use when: delegated by CMO for AARRR funnel analysis or growth experiment design.
```

### COO 조직 (5)

#### coo/coo.md
```yaml
description: |
  Manages operational processes including CI/CD pipelines, monitoring setup, and workflow optimization.
  Delegates to sre, canary, benchmark, devops, and docs-writer sub-agents.
  Use when: deployment, CI/CD setup, monitoring configuration, or operational process improvement is needed.
  Triggers: coo, operations, 운영, CI/CD, 배포, 모니터링, 프로세스, deploy, monitoring
```

#### coo/canary.md
```yaml
description: |
  Monitors service health immediately after deployment using curl/API/log-based lightweight checks.
  Detects errors and performance regressions in the canary window.
  Use when: delegated by COO for post-deployment health verification and early regression detection.
```

#### coo/benchmark.md
```yaml
description: |
  Tracks performance metrics including build size, dependency count, and response times.
  Detects performance regressions by comparing against baseline measurements.
  Use when: delegated by COO for performance benchmarking or regression detection.
```

#### coo/sre.md
```yaml
description: |
  Configures monitoring infrastructure, defines alert rules, and creates incident response runbooks.
  Handles ongoing operational monitoring (distinct from canary's short-term post-deploy checks).
  Use when: delegated by COO for monitoring setup, alerting rules, or incident runbook creation.
```

#### coo/docs-writer.md
```yaml
description: |
  Generates technical documentation including API docs, README files, user guides, and onboarding materials.
  Use when: delegated by COO, CTO, or CPO for technical documentation creation or updates.
```

### CPO 조직 (7)

#### cpo/cpo.md
```yaml
description: |
  Sets product direction, generates PRDs, and defines roadmaps. Orchestrates pm-discovery,
  pm-strategy, pm-research, and pm-prd sub-agents for comprehensive product planning.
  Use when: product direction, PRD creation, roadmap definition, or user research orchestration is needed.
  Triggers: cpo, product, PRD, 제품, 기획, 로드맵, 요구사항, roadmap, product direction
```

#### cpo/pm-discovery.md
```yaml
description: |
  Discovers product opportunities using Teresa Torres' Opportunity Solution Tree (OST) framework.
  Generates hypotheses across 8 risk categories, designs experiments, and creates user interview scripts.
  Use when: delegated by CPO for opportunity discovery or experiment design.
```

#### cpo/pm-strategy.md
```yaml
description: |
  Develops product strategy using Product Strategy Canvas (9 sections), JTBD Value Proposition,
  Lean Canvas, and frameworks like SWOT/PESTLE/Porter's Five Forces/Ansoff Matrix.
  Use when: delegated by CPO for product strategy formulation.
```

#### cpo/pm-research.md
```yaml
description: |
  Conducts product research including JTBD-based user personas, market sizing (TAM/SAM/SOM),
  competitor analysis (5 companies), and customer journey mapping.
  Use when: delegated by CPO for market research or user persona development.
```

#### cpo/pm-prd.md
```yaml
description: |
  Synthesizes pm-discovery, pm-strategy, and pm-research outputs into a complete PRD with 8 sections.
  Includes OKR, sprint plan, pre-mortem, stakeholder map, and user/job stories.
  Use when: delegated by CPO for PRD document generation.
```

#### cpo/ux-researcher.md
```yaml
description: |
  Designs user interview scripts, usability test plans, and deepens persona definitions.
  Handles specialized UX research separated from pm-research's broader market analysis.
  Use when: delegated by CPO for UX research, interview script design, or usability testing.
```

#### cpo/data-analyst.md
```yaml
description: |
  Analyzes product metrics, designs A/B tests, and performs funnel analysis to support data-driven decisions.
  Use when: delegated by CPO, CTO, or CFO for product metrics analysis or experiment design.
```

### CSO 조직 (5)

#### cso/cso.md
```yaml
description: |
  Orchestrates security review (Gate A), plugin deployment validation (Gate B), and independent
  code review (Gate C). Delegates execution to security, validate-plugin, and code-review sub-agents.
  Use when: security audit, plugin deployment verification, or independent code review is needed.
  Triggers: cso, security, plugin 배포, 마켓플레이스, 배포 준비, 인증, 보안, 결제
```

#### cso/security.md
```yaml
description: |
  Performs security audits covering OWASP Top 10, authentication/authorization,
  and sensitive data handling. Returns findings to CSO for final judgment.
  Use when: delegated by CSO Gate A for security vulnerability assessment.
```

#### cso/validate-plugin.md
```yaml
description: |
  Validates plugin deployment readiness by checking package.json, SKILL.md, agent frontmatter,
  and code safety. Returns validation results to CSO.
  Use when: delegated by CSO Gate B for plugin structure and safety verification.
```

#### cso/code-review.md
```yaml
description: |
  Performs independent code review after CTO QA pass. Examines bug patterns, performance issues,
  and code quality from a fresh perspective.
  Use when: delegated by CSO Gate C for independent code quality verification.
```

#### cso/compliance.md
```yaml
description: |
  Verifies regulatory compliance including GDPR/privacy protection, license compatibility,
  and audit log validation. Handles compliance (distinct from security's code vulnerability focus).
  Use when: delegated by CSO for regulatory compliance checks or license auditing.
```

### CTO 조직 (11)

#### cto/cto.md
```yaml
description: |
  Directs technical strategy and orchestrates the full development workflow (plan→design→do→qa→report).
  Delegates to architect, design, frontend, backend, qa, tester, devops, database, and investigate agents.
  Use when: technical planning, architecture decisions, or full development lifecycle orchestration is needed.
  Triggers: cto, technical planning, architecture, 기술 계획, 아키텍처
```

#### cto/architect.md
```yaml
description: |
  Designs infrastructure and architecture including DB schemas, migrations, ORM configuration,
  environment setup, and project initialization.
  Use when: delegated by CTO for infrastructure design or project scaffolding.
```

#### cto/backend.md
```yaml
description: |
  Implements backend APIs, server logic, and database integrations.
  Use when: delegated by CTO for API implementation or server-side development.
```

#### cto/frontend.md
```yaml
description: |
  Implements frontend interfaces using React/Next.js and related frameworks.
  Use when: delegated by CTO for UI component development or frontend feature implementation.
```

#### cto/design.md
```yaml
description: |
  Creates integrated UI/UX designs including information architecture, wireframes, and visual design.
  Consumes design tokens generated by UI/UX Pro Max.
  Use when: delegated by CTO for screen design, wireframing, or UI/UX specification.
```

#### cto/qa.md
```yaml
description: |
  Performs integrated quality assurance including build verification, gap analysis, security checks,
  code quality review, and QA scenario validation.
  Use when: delegated by CTO for comprehensive quality verification after implementation.
```

#### cto/tester.md
```yaml
description: |
  Generates test code including unit, integration, and e2e tests.
  Focuses on code creation (distinct from qa's verification and gap analysis role).
  Use when: delegated by CTO for test code generation or test coverage expansion.
```

#### cto/devops.md
```yaml
description: |
  Configures CI/CD pipelines and deployment automation including GitHub Actions, Docker,
  and environment-specific deployment settings.
  Use when: delegated by CTO or COO for CI/CD pipeline setup or deployment automation.
```

#### cto/database.md
```yaml
description: |
  Optimizes database schemas, creates migrations, tunes queries, and designs indexes.
  Handles deep DB specialization (distinct from architect's broader infrastructure scope).
  Use when: delegated by CTO for database optimization or advanced schema work.
```

#### cto/investigate.md
```yaml
description: |
  Performs systematic debugging through a 4-phase process: investigate → analyze → hypothesize → implement.
  Follows the Iron Law: no fix without root cause identification.
  Use when: delegated by CTO for root cause analysis of complex or recurring bugs.
```

## 본문 역할 설명 영어화 (클린 아키텍처)

각 에이전트의 `## 역할` 섹션 첫 문단을 영어로 변환합니다.
- 상세 PDCA/Checkpoint/Contract 등 운영 지침은 한국어 유지
- `## Role` 제목 + 영어 1~2문장 역할 요약 추가

### 변환 예시

**Before:**
```markdown
## 역할

기술 도메인 전체 오케스트레이션. Plan 직접 수행 + design(+architect)/frontend/backend/qa 위임 + Gate 판정.
```

**After:**
```markdown
## Role

Full technical domain orchestration. Directly executes Plan phase, delegates design(+architect)/frontend/backend/qa agents, and manages Gate decisions.
```

## 추가 변경: 문서 동기화

### CLAUDE.md
- Agent Architecture 섹션의 Role 열 영어로 갱신

### AGENTS.md
- 에이전트 테이블 Role 열 영어로 갱신

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 — 37개 에이전트 변환 맵 |
