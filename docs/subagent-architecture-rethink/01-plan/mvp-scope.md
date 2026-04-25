---
owner: cpo
topic: mvp-scope
phase: plan
feature: subagent-architecture-rethink
---

# Topic: MVP 범위 — 산출물 카탈로그 25 + Profile schema + 정책 4분류 적용

> CP-1에서 사용자가 **B. 표준 범위**를 선택한 경우의 구체화. A/C 선택 시는 본 topic을 부분 적용 또는 확장.

## 1. MVP 산출물 우선순위 25개

### 선정 기준

1. 4단계 프레임의 각 단계에서 정전급 핵심
2. 사용자 호소(release-engineer 등)와 직접 관련
3. 잘못된 매핑 정정 후보 포함
4. 다른 sub-agent의 anti-pattern 점검 시 시범 적용 가능

### 25개 목록

| # | 단계 | 산출물 | 정전 출처 | 정책 | Owner sub-agent | 비고 |
|---|------|--------|----------|:----:|----------------|------|
| 01 | Core | Vision Statement / BHAG | Collins | A | (신설) vision-author | CEO 빈약 해소 |
| 02 | Core | Strategy Kernel (Diagnosis–Policy–Actions) | Rumelt | A | (신설) strategy-kernel-author | CEO 신설 |
| 03 | Core | OKR | Grove / Doerr | A | (신설) okr-author | CEO 신설 |
| 04 | Core | Working Backwards PR/FAQ | Amazon | C | (신설) pr-faq-author | Core 신설 |
| 05 | Core | 3-Horizon Strategy | McKinsey | C | strategy-kernel-author | optional |
| 06 | Why | PEST(LE) 분석 | 거시환경 표준 | C | market-researcher | template 신규 |
| 07 | Why | Porter's Five Forces | Porter | C | market-researcher | template 신규 |
| 08 | Why | SWOT 분석 | Humphrey | C | market-researcher | template 신규 |
| 09 | Why | JTBD 6-Part Statement | Ulwick / Christensen | A | product-discoverer | template 강화 |
| 10 | Why | Persona / Empathy Map | Cooper / Gray | A | product-researcher | template 강화 |
| 11 | What | **Value Proposition Canvas** | Osterwalder | A | **product-strategist** (재매핑) | copy-writer에서 재배치 |
| 12 | What | Lean Canvas | Maurya | C | product-strategist | template 신규 |
| 13 | What | Business Model Canvas | Osterwalder | C | product-strategist | template 신규 |
| 14 | What | North Star Metric Framework | Ellis / Amplitude | A | data-analyst | template 신규 |
| 15 | What | Roadmap (Now-Next-Later) | ProductPlan | A | (신설) roadmap-author | What 신설 |
| 16 | How | ADR (Architecture Decision Record) | Nygard | A | infra-architect | template 신규 |
| 17 | How | C4 Model Diagrams | Brown | B | infra-architect | template 신규 |
| 18 | How | STRIDE Threat Model | Microsoft | B | security-auditor | template 신규 |
| 19 | How | Test Plan / Test Case Matrix | ISTQB | A | test-engineer | template 신규 |
| 20 | How | Runbook / Incident Playbook | Google SRE | B | sre-engineer | template 신규 |
| 21 | 사업·재무 | 3-Statement Financial Model | 회계 표준 | B | financial-modeler | template 신규 |
| 22 | 사업·재무 | Cohort Retention Curves | Skok | B | unit-economics-analyst | template 신규 |
| 23 | 사업·재무 | Cloud Cost Breakdown | FinOps Foundation | B | finops-analyst | template 신규 |
| 24 | 사업·재무 | Marketing Funnel (TOFU/MOFU/BOFU) | Inbound 마케팅 | B | growth-analyst | template 신규 |
| 25 | 사업·재무 | SEO Audit Report | Moz / Ahrefs | B | seo-analyst | template 신규 |

### 정책 분포 검증

- A (Always): 9개 — 정체성·핵심 의사결정
- B (Scope): 8개 — Profile 자동 판단
- C (User-select): 8개 — 같은 intent 대안
- D (Triggered): 0개 — MVP에서는 제외 (후속 phase에서 Postmortem 등 추가)

→ A/B/C 균형. D는 trigger 메커니즘 추가 작업 필요해서 MVP 제외.

## 2. Project Profile MVP schema

```yaml
project_profile:
  type: [b2b-saas | b2c-app | marketplace | oss | internal-tool | api-only | plugin]
  stage: [idea | mvp | pmf | scale | mature]
  users:
    target_scale: [proto | pilot | sub-1k | 1k-100k | 100k+]
    geography: [domestic | global | regulated-region]
  business:
    revenue_model: [subscription | transaction | ads | freemium | enterprise | none]
    monetization_active: bool
  data:
    handles_pii: bool
    handles_payments: bool
    handles_health: bool
    cross_border_transfer: bool
  deployment:
    target: [cloud | on-prem | hybrid | edge | local-only]
    sla_required: bool
  brand:
    seo_dependent: bool
    public_marketing: bool
```

### Profile 작동 흐름

1. **Ideation 종료 시점**: ideation-guard에 Profile 합의 hook 추가 → ideation summary와 함께 `docs/{feature}/00-ideation/project-profile.yaml` 저장
2. **C-Level 진입 시점**: 모든 C-Level의 Context Load(L4)에 Profile 추가. Profile 없으면 한 번 묻기 (이후 캐시).
3. **sub-agent 호출 시점**: 정책 B 산출물의 `scope_conditions` 평가 → 통과 못하면 자동 skip + 리포트 ("Profile 기준 X 산출물 skip됨").

## 3. Template metadata schema

각 template `.md`의 frontmatter:

```yaml
---
artifact: lean-canvas
owner_agent: product-strategist
phase: what
execution:
  policy: user-select        # always | scope | user-select | triggered
  scope_conditions:          # policy=scope 일 때 (CEL-like 표현 또는 단순 dict)
    - "project_profile.type IN [b2b-saas, b2c-app, marketplace]"
    - "project_profile.stage IN [idea, mvp]"
  intent: business-model-design   # policy=user-select 일 때
  alternates: [business-model-canvas, value-proposition-canvas]
  trigger_events: []         # policy=triggered 일 때
  prereq: [pest-analysis]    # 선행 산출물 권장 (없어도 작성 가능)
  required_after: [prd]      # 이 산출물 후 자동 트리거
template_depth: filled-sample-with-checklist
---

# Lean Canvas — {feature}

## (작성된 sample)
... (실제 채워진 예시)

## 작성 체크리스트
- [ ] 9개 블록 모두 채움
- [ ] Problem 블록 ≤ 3개로 한정
- [ ] Cost Structure에 변동비/고정비 분리
- ...

## ⚠ Anti-pattern
- "Solution" 블록을 Problem보다 먼저 작성 (해결책 정박)
- "Unfair Advantage"를 비워두기 (가장 중요한 블록)
- ...
```

## 4. Sub-agent 재정의 — release-engineer 5분해 + 의심 5개 점검

### 4.1 release-engineer 5분해 (D-9 승계)

| 신규 sub-agent | 산출물 | 정책 | 호출 조건 |
|---------------|--------|:----:|----------|
| release-notes-writer | Release Notes / CHANGELOG | A | 모든 배포에 필수 |
| ci-cd-configurator | GitHub Actions / GitLab CI YAML | B | `deployment.target IN [cloud, hybrid]` AND `users.target_scale ≥ pilot` |
| container-config-author | Dockerfile / docker-compose.yml | B | `deployment.containerized=true` |
| migration-planner | Schema migration plan | D | DB schema 변경 이벤트 |
| runbook-author | Runbook (배포 절차) | B | `deployment.sla_required=true` 또는 `target_scale ≥ 1k-100k` |

→ 기존 release-engineer는 **deprecate** (호환성 alias 1 phase 유지 후 제거).

### 4.2 의심 5 sub-agent 점검 (Q-1 승계)

각 sub-agent를 동일 점검 표로:

| sub-agent | 현재 default | 점검 결과 | 조치 |
|-----------|------------|----------|------|
| infra-architect | DB schema + migration + ORM + env + project init 일괄 | 묶음 큼 + condition 부재 | DB / env / init 산출물 분리 + 정책 적용 (init은 triggered) |
| test-engineer | unit/integration/e2e 일괄 생성 | 가치 판단 단계 부재 | 산출물별 정책: unit=Always, integration=B(scope), e2e=B(seo_dependent or critical_flow) |
| seo-analyst | SEO audit 무조건 실행 | scope 부재 | 정책 B: `brand.seo_dependent=true` 만 실행 |
| finops-analyst | 클라우드 비용 분석 무조건 | scope 부재 | 정책 B: `deployment.target IN [cloud, hybrid]` AND `business.monetization_active=true` |
| compliance-auditor | GDPR + 라이선스 + 감사로그 일괄 | scope 부재 | 산출물 분리 + 정책 B: GDPR=`data.handles_pii=true OR data.cross_border_transfer=true`, 라이선스=Always |

## 5. MVP 비포함 (후속 phase)

- 단계 간 alignment 검증 메커니즘 (책 6.4/7.5/8.4) — `subagent-alignment-protocol` 별도 피처
- 카탈로그 잔여 25개 template — 자연 누적
- epistemic contract / uncertainty reporting / absorb 대화 강제 — 선반 보관 (D-11)
- ux-researcher 호출 (외부 사용자 인터뷰) — Profile schema 검증 후 후속 phase

## 6. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| ideation D-9 | ✅ | | | | release-engineer 5분해 — 시범 적용 |
| ideation Q-1 | ✅ | | | | 의심 5 sub-agent 점검 |
| ideation D-11 | | ✅ | | | epistemic contract 선반 보관 |
| ideation Q-9 (D 정책) | | | | ✅ | MVP에서 D 제외, 후속 phase |
| ideation Q-5 (우선순위) | | | ✅ | | 25개 = Core/Why/What/How/사업·재무 각 5 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CPO MVP 범위 |
