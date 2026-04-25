---
owner: cpo
topic: solution-features
phase: do
feature: subagent-architecture-rethink
authors: [prd-writer]
---

# Topic: Solution Features (F1~F8 + 25 카탈로그 + 신규 sub-agent)

> Source: `_tmp/prd-writer.md` 섹션 7 → CPO 큐레이션 (정책 분포 / 25 카탈로그 / sub-agent 정의 명세).

## F1. Project Profile schema v1 (Must)

**설명**: ideation 종료 시 1회 합의 → `docs/{feature}/00-ideation/project-profile.yaml` 자동 저장. 모든 C-Level 진입 시 자동 로드. 정책 B 산출물의 `scope_conditions` 평가 기반.

```yaml
project_profile:
  type: [b2b-saas|b2c-app|marketplace|oss|internal-tool|api-only|plugin]
  stage: [idea|mvp|pmf|scale|mature]
  users.target_scale: [proto|pilot|sub-1k|1k-100k|100k+]
  users.geography: [domestic|global|regulated-region]
  business.revenue_model: [subscription|transaction|ads|freemium|enterprise|none]
  business.monetization_active: bool
  data.handles_pii: bool
  data.handles_payments: bool
  data.handles_health: bool
  data.cross_border_transfer: bool
  deployment.target: [cloud|on-prem|hybrid|edge|local-only]
  deployment.sla_required: bool
  brand.seo_dependent: bool
  brand.public_marketing: bool
```

**수용 기준 (SC-01)**: (a) ideation-guard hook 코드 존재 + (b) 신규 피처 ideation 종료 후 yaml 파일 존재 + (c) `lib/project-profile.js` 모든 C-Level Context Load에 추가됨.

## F2. Template metadata schema (Must)

각 template frontmatter 확장 — D-D12 즉시 적용 3가지 포함:

```yaml
artifact: lean-canvas
owner_agent: product-strategist
phase: what
canon_source: "Maurya 'Running Lean'"          # D-D12
execution:
  policy: user-select   # always | scope | user-select | triggered
  scope_conditions: [...]
  intent: business-model-design
  alternates: [business-model-canvas, value-proposition-canvas]
  trigger_events: []
  prereq: [pest-analysis]
  required_after: [prd]
  review_recommended: false                     # D-D12
template_depth: filled-sample-with-checklist
project_context_reason: "What 단계 BM 결정의 1차 산출물"  # D-D12
```

**수용 기준 (SC-02)**: `scripts/template-validator.js` 신규 — 25 template 일괄 검증 → 25/25 pass.

## F3. 카탈로그 50+ 4단계 분류 + Template (c)

### 정책 분포 (전체 50개)

| 정책 | 개수 | 예시 |
|:----:|:----:|------|
| **A (Always)** | 17 | PRD / ADR / Vision / CHANGELOG / JTBD / Persona / VPC / NSM / Roadmap / RFC / API Spec / ER Diagram / OWASP ASVS / Test Plan / Release Notes / User Story / TAM-SAM-SOM / IA / Wireframe |
| **B (Scope)** | 14 | C4 / STRIDE / Runbook / SLO / DORA Dashboard / 3-Statement / CAC-LTV / Cloud Cost / Funnel / SEO Audit / DPIA / DCF / Attribution / SLI |
| **C (User-select)** | 17 | PEST / Five Forces / SWOT / OST / Forces of Progress / Kano / AARRR / HEART / Lean Canvas / BMC / RICE / MoSCoW / PR-FAQ / 3-Horizon / Customer Journey / AIDA-PAS / Magic Number |
| **D (Triggered)** | 2 | Postmortem / Migration Plan |

### 우선 25개 (c) 깊이 (MVP First)

| # | 단계 | 산출물 | 정전 | 정책 | Owner |
|:-:|------|--------|------|:----:|-------|
| 01 | Core | Vision Statement / BHAG | Collins | A | **vision-author** (신설) |
| 02 | Core | Strategy Kernel | Rumelt | A | **strategy-kernel-author** (신설) |
| 03 | Core | OKR | Grove / Doerr | A | **okr-author** (신설) |
| 04 | Core | Working Backwards PR/FAQ | Amazon | C | **pr-faq-author** (신설) |
| 05 | Core | 3-Horizon Strategy | McKinsey | C | strategy-kernel-author |
| 06 | Why | PEST(LE) 분석 | 거시환경 표준 | C | market-researcher |
| 07 | Why | Porter's Five Forces | Porter | C | market-researcher |
| 08 | Why | SWOT 분석 | Humphrey | C | market-researcher |
| 09 | Why | JTBD 6-Part Statement | Ulwick / Christensen | A | product-discoverer |
| 10 | Why | Persona / Empathy Map | Cooper / Gray | A | product-researcher |
| 11 | What | **Value Proposition Canvas** | Osterwalder | A | **product-strategist** (재매핑) |
| 12 | What | Lean Canvas | Maurya | C | product-strategist |
| 13 | What | Business Model Canvas | Osterwalder | C | product-strategist |
| 14 | What | North Star Metric | Ellis / Amplitude | A | data-analyst |
| 15 | What | Roadmap (Now-Next-Later) | ProductPlan | A | **roadmap-author** (신설) |
| 16 | How | ADR | Nygard | A | infra-architect |
| 17 | How | C4 Model Diagrams | Brown | B | infra-architect |
| 18 | How | STRIDE Threat Model | Microsoft | B | security-auditor |
| 19 | How | Test Plan / Test Case Matrix | ISTQB | A | test-engineer |
| 20 | How | Runbook / Incident Playbook | Google SRE | B | sre-engineer / runbook-author |
| 21 | 사업·재무 | 3-Statement Financial Model | 회계 표준 | B | financial-modeler |
| 22 | 사업·재무 | Cohort Retention Curves | Skok | B | unit-economics-analyst |
| 23 | 사업·재무 | Cloud Cost Breakdown | FinOps Foundation | B | finops-analyst |
| 24 | 사업·재무 | Marketing Funnel (TOFU/MOFU/BOFU) | Inbound 마케팅 | B | growth-analyst |
| 25 | 사업·재무 | SEO Audit Report | Moz / Ahrefs | B | seo-analyst |

각 template (c) 깊이 = `## (작성된 sample)` 100자+ + `## 작성 체크리스트` 5+ 항목 + `## ⚠ Anti-pattern` 3+ 항목.

**수용 기준**: SC-04 (25/25). SC-08 (50/50, SHOULD).

### 잔여 25개 (Sprint 11~14)

Why(2) / What(7) / How(11) / 사업·재무(5):
- TAM/SAM/SOM, Customer Journey Map, OST, Forces of Progress, Kano
- AARRR, HEART, IA, Wireframe Spec, RICE, MoSCoW, User Story+INVEST, Pricing Tier
- RFC/Technical Design Doc, API Spec(OpenAPI), ER/Sequence Diagram, OWASP ASVS, DPIA, SLI/SLO Definition, Postmortem(Five Whys), DORA Metrics Dashboard
- DCF Valuation, CAC/LTV Calculation, Magic Number/Rule of 40, AIDA/PAS Copy Frame, Multi-touch Attribution

## F4. 44 sub-agent anti-pattern 점검 매트릭스 (Must)

44 sub-agent 전체를 4기준 점검:
- **Q-A 산출물 명확성** — 정전 카탈로그 매핑 가능?
- **Q-B Default-execute 여부** — 호출 즉시 시작? Profile 게이트 부재?
- **Q-C 묶음 적정성** — 한 sub-agent에 너무 많은 산출물?
- **Q-D 매핑 정합성** — owner_agent가 실제 도메인과 맞는가?

**즉시 조치 확정 6개**:

| sub-agent | Q-B 조치 | Q-C 조치 | Q-D 조치 |
|-----------|---------|---------|---------|
| release-engineer | **5분해** (→ F5) | 분해 | — |
| infra-architect | init=triggered / DB=B 정책 | 분리 검토 | — |
| test-engineer | unit=A / integration=B / e2e=B | — | — |
| seo-analyst | `brand.seo_dependent=true`만 | — | — |
| finops-analyst | `deployment.target IN [cloud,hybrid]` AND `monetization_active=true`만 | — | — |
| compliance-auditor | GDPR=`handles_pii=true` 조건 | DPIA 분리 | — |
| **copy-writer** | — | — | **VPC 책임 제거** (→ product-strategist) |

**수용 기준 (SC-09)**: 44/44 점검 완료, `04-qa/subagent-audit-matrix.md` 44행 모두 채워짐.

## F5. Release-engineer 5분해 (Must)

ideation T6 통증("쓸데없이 CI/CD 만든다") 직접 원인 해소.

| 신규 sub-agent | 산출물 | 정책 | 호출 조건 |
|---------------|--------|:----:|---------|
| **release-notes-writer** | Release Notes / CHANGELOG | A | 모든 배포 필수 |
| **ci-cd-configurator** | GitHub Actions / GitLab CI YAML | B | `deployment.target IN [cloud,hybrid]` AND `users.target_scale ≥ pilot` |
| **container-config-author** | Dockerfile / docker-compose.yml | B | `deployment.containerized=true` |
| **migration-planner** | Schema migration plan | D | DB schema 변경 이벤트 |
| **runbook-author** | Runbook (배포 절차) | B | `deployment.sla_required=true` OR `users.target_scale ≥ 1k-100k` |

기존 release-engineer는 **deprecate alias 1 phase 유지** → 다음 phase에서 완전 제거.

**수용 기준 (SC-05)**: (a) `agents/coo/{name}.md` 5개 + description 80자+ / (b) 산출물 template (c) 깊이 / (c) `release-engineer.md` deprecate notice.

## F6. 신규 sub-agent 5개 (CEO 4 + CPO 1) (Must)

### CEO 신설 4개 (D-D8) — Core 단계 빈약 해소

| Agent | 산출물 | 정전 |
|-------|--------|------|
| vision-author | Vision Statement / BHAG | Collins *Built to Last* |
| strategy-kernel-author | Strategy Kernel (Diagnosis–Policy–Actions) | Rumelt *Good Strategy/Bad Strategy* |
| okr-author | OKR (Objective + Key Results) | Grove / Doerr |
| pr-faq-author | Working Backwards PR/FAQ | Amazon |

### CPO/What 신설 1개 (D-D9)

| Agent | 산출물 | 정전 |
|-------|--------|------|
| roadmap-author | Now-Next-Later Roadmap | ProductPlan |

**수용 기준**: 각 `agents/{c-level}/{name}.md` + frontmatter 완성 + 산출물 template (c) 깊이.

**최종 sub-agent 총수**: 44 + 신설 5 (CEO 4 + CPO 1) + 신설 5 (release 분해, 단 release-engineer 1 deprecate) = **약 53개** (deprecate 정리 후 ~52). 단, F4 점검에서 통합·분해 추가 결정 가능.

## F7. Alignment 메커니즘 α + β (Should)

*제품의 탄생* 6.4/7.5/8.4 "맞춤-개선" 시스템화.

- **α (auto-judge 확장)**: C-Level 전환 시 이전 단계 산출물 파싱 → 키워드/엔티티 일치율 측정. 70%+ 감지율 목표 (EXP-4).
- **β (alignment 산출물 신설)**: 단계 사이 `alignment-{from}-{to}.md` 3개 (core-why / why-what / what-how). template (c) 깊이.

**수용 기준 (SC-10a)**: `lib/auto-judge.js` alignment 메트릭 + alignment 산출물 template 3개. EXP-4 70%+ 감지.

## F8. VPC → product-strategist 재매핑 (Should)

**근거**: Osterwalder 정전상 VPC는 전략 기획 산출물. 현재 copy-writer 매핑은 잘못됨.

**수용 기준 (SC-06)**: VPC template `owner_agent: product-strategist` + copy-writer md VPC 책임 제거 + product-strategist md VPC 추가.

## 기술 구현 핵심 요소

| 파일 | 작업 | 근거 |
|------|------|------|
| `lib/project-profile.js` | **신규** — schema 로드/검증 + scope_conditions 평가 + Context Load 주입 | F1 |
| `hooks/ideation-guard.js` | **수정** — ideation 종료 시 Profile 합의 prompt + yaml 저장 | F1 |
| `scripts/template-validator.js` | **신규** — frontmatter schema + 정책 매핑 검증 | F2 |
| `lib/auto-judge.js` | **수정** — alignment α 메트릭 추가 | F7 |
| `agents/coo/release-engineer.md` | **수정** — deprecate notice | F5 |
| `agents/{ceo,cpo,coo}/*.md` | **신규** 7개 (CEO 4 + CPO 1 + COO 5분해) | F5/F6 |
| `templates/{core,why,what,how,biz}/*.md` | **신규** 25개 (우선) + 25개 (잔여) | F3 |

## 큐레이션 기록

| Source (`_tmp/prd-writer.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| F1~F8 정의 + 수용 기준 | ✅ | | | | 8개 모두 design 결정 직접 매핑 |
| 25개 우선 카탈로그 표 | ✅ | | | | 그대로 채택 |
| 잔여 25개 목록 | | | ✅ | | 요약 — 상세는 _tmp/ |
| F4 즉시 조치 6개 표 | ✅ | | | | 명확 |
| F5 5분해 정책 표 | ✅ | | | | 명확 |
| F6 신규 sub-agent 정전 매핑 | ✅ | | | | 명확 |
| 기술 구현 7개 요소 | ✅ | | | | 명확 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — _tmp/prd-writer.md 섹션 7 추출 |
