---
owner: cpo
topic: extended-scope
phase: plan
feature: subagent-architecture-rethink
---

# Topic: 확장 범위 (C 채택분) — 50+ 카탈로그 + 44 sub-agent 전체 + alignment + 외부 인터뷰

> 사용자 CP-1 결정: **C. 확장 범위** (2026-04-25). R1 리스크(작업량 폭증) 명시 감수. 본 topic은 B 표준 범위(`mvp-scope.md`)에 **추가**되는 항목 명세.

## 1. 카탈로그 잔여 25+ 추가 (총 50+)

### 1.1 추가 25개 (B의 25에 더하여)

| # | 단계 | 산출물 | 정전 출처 | 정책 | Owner sub-agent |
|---|------|--------|----------|:----:|----------------|
| 26 | Why | TAM/SAM/SOM | Steve Blank | A | product-researcher |
| 27 | Why | Customer Journey Map | Service Design | C | ux-researcher |
| 28 | Why | Opportunity Solution Tree | Torres | C | product-discoverer |
| 29 | Why | Forces of Progress | Christensen | C | product-discoverer |
| 30 | Why | Kano Model | Kano | C | product-strategist |
| 31 | What | AARRR (Pirate Metrics) | McClure | C | growth-analyst |
| 32 | What | HEART Framework | Google | C | data-analyst |
| 33 | What | Information Architecture | Rosenfeld/Morville | A | ui-designer |
| 34 | What | Wireframe Spec | UX 표준 | A | ui-designer |
| 35 | What | RICE Prioritization | Intercom | C | backlog-manager |
| 36 | What | MoSCoW Prioritization | DSDM | C | backlog-manager |
| 37 | What | User Story + INVEST | Cohn | A | backlog-manager |
| 38 | How | RFC / Technical Design Doc | Google/Stripe 사내 표준 | A | infra-architect |
| 39 | How | API Spec (OpenAPI) | OpenAPI | A | backend-engineer |
| 40 | How | ER Diagram / Sequence Diagram | OMG UML | A | db-architect |
| 41 | How | OWASP ASVS Checklist | OWASP | A | security-auditor |
| 42 | How | DPIA | GDPR | B | compliance-auditor |
| 43 | How | SLI / SLO Definition | Google SRE | B | sre-engineer |
| 44 | How | Postmortem (Five Whys) | Etsy / Google SRE | D | incident-responder |
| 45 | How | DORA Metrics Dashboard | DORA | B | performance-engineer |
| 46 | 사업·재무 | DCF Valuation | Damodaran | B | financial-modeler |
| 47 | 사업·재무 | CAC/LTV Calculation | Skok | A | unit-economics-analyst |
| 48 | 사업·재무 | Magic Number / Rule of 40 | SaaS 표준 | B | unit-economics-analyst |
| 49 | 사업·재무 | AIDA / PAS Copy Frame | 카피라이팅 정전 | C | copy-writer |
| 50 | 사업·재무 | Multi-touch Attribution Model | 마케팅 표준 | B | marketing-analytics-analyst |

### 1.2 정책 분포 (전체 50개)

- A (Always): 17개 (정체성·핵심)
- B (Scope): 14개 (Profile 자동 판단)
- C (User-select): 17개 (대안 다수)
- D (Triggered): 2개 (Postmortem, Migration Plan)

→ 4분류 균형. D는 trigger 메커니즘도 본 phase에 포함.

## 2. 44 sub-agent 전체 점검 매트릭스

각 sub-agent를 다음 4가지 기준으로 점검:

| 점검 항목 | 질문 |
|----------|------|
| **Q-A. 산출물 명확성** | 이 sub-agent가 만드는 산출물이 정전 카탈로그에 있는가? |
| **Q-B. Default-execute 여부** | 호출되면 무조건 작업 시작하는가? Profile/scope 게이트 부재? |
| **Q-C. 묶음 적정성** | 한 sub-agent가 너무 많은 산출물을 담당하는가? (분해 후보) |
| **Q-D. 매핑 정합성** | 산출물의 owner_agent가 실제 도메인과 맞는가? |

### 점검 대상 (44개) — 그룹별

**CEO (3 → 7 예상)**: ceo, absorb-analyzer, skill-creator + (신설) vision-author, strategy-kernel-author, okr-author, pr-faq-author

**CPO (8 → 8)**: cpo, product-discoverer, product-strategist, product-researcher, prd-writer, backlog-manager, ux-researcher, data-analyst — 큰 변경 없음, template 강화 위주

**CTO (9 → 9 예상)**: cto, infra-architect, backend-engineer, frontend-engineer, ui-designer, db-architect, qa-engineer, test-engineer, incident-responder — infra-architect 분해 검토

**CSO (8 → 8)**: cso, security-auditor, code-reviewer, secret-scanner, dependency-analyzer, plugin-validator, skill-validator, compliance-auditor — compliance-auditor 분해 검토

**CBO (11 → 11 + roadmap-author 검토)**: cbo, copy-writer, customer-segmentation, financial-modeler, finops-analyst, growth-analyst, market-researcher, marketing-analytics, pricing-analyst, seo-analyst, unit-economics-analyst — VPC를 product-strategist로 재매핑

**COO (5 → 9 예상)**: coo, performance-engineer, sre-engineer, release-monitor + (release-engineer 5분해) release-notes-writer, ci-cd-configurator, container-config-author, migration-planner, runbook-author

→ 최종 신규 sub-agent 수: 약 47~48개 (현재 44 + 신설 7~8 - deprecate alias 정리). 단, design phase에서 점검 결과에 따라 통합 추가 가능.

## 3. 단계 간 alignment 검증 메커니즘 (책 6.4/7.5/8.4)

### 3.1 알아야 할 것

- 6.4: Core ↔ Why 정렬 — 미션·전략과 타깃 정의가 일관되는가?
- 7.5: Why ↔ What 정렬 — 타깃의 Job과 솔루션·BM이 일관되는가?
- 8.4: What ↔ How 정렬 — 솔루션·로드맵과 구현·출시가 일관되는가?

### 3.2 시스템화 후보

| 후보 | 설명 | 트레이드오프 |
|------|------|------------|
| α. 자동 일관성 검증 (auto-judge 확장) | C-Level 진입 시 이전 단계 산출물 파싱 → 키워드/엔티티 일치율 측정 | 자동화 가능 / 정확도 한계 |
| β. C-Level 간 명시적 alignment 산출물 | 단계 사이에 `alignment-{from}-{to}.md` 산출물 신설 | 명시적 / 작업량 추가 |
| γ. CEO 게이트 (단계 간 승인) | C-Level 전환 전 CEO가 alignment 검토 | 통합적 / CEO 부담 |

→ design phase에서 사용자 결정. 본 plan에서는 α + β 조합을 권장으로 명시.

### 3.3 alignment 미스매치 사례 (가설)

- "Core에서는 B2B 엔터프라이즈 vision인데 Why에서 페르소나가 개인 개발자" → α가 keyword diff로 감지 가능
- "Why에서 보안이 핵심 가치인데 How에서 STRIDE 산출물이 누락" → β가 alignment 산출물 체크로 감지

## 4. ux-researcher 외부 인터뷰

### 4.1 인터뷰 대상

VAIS 외부 사용자 5~7명 (다양한 프로젝트 유형 — SaaS / Internal tool / OSS plugin / API-only).

### 4.2 인터뷰 목적

- Project Profile schema의 12개 변수가 실제 프로젝트 분류에 충분한가?
- 정책 4분류(A/B/C/D)가 사용자 직관과 맞는가?
- "쓸데없이 만든다" 통증이 보편적인가, 본인만의 호소인가?
- 산출물 50+ 카탈로그에서 사용자가 실제로 원하는 우선순위는?

### 4.3 인터뷰 산출물

`docs/subagent-architecture-rethink/02-design/user-interviews.md` (design phase에서 작성)

## 5. 추가 작업량 추정 (R1 강조)

| 작업 영역 | 추가 작업량 (B 대비) | 예상 시간 |
|----------|--------------------|----------|
| 카탈로그 +25개 template (depth c) | +25 templates × 1~2일 | 4~6주 |
| 44 sub-agent 전체 점검 + 재정의 | +30 sub-agent 점검 (5는 B에 포함) | 2~3주 |
| alignment 메커니즘 (α + β) | auto-judge 확장 + alignment 산출물 schema | 1~2주 |
| ux-researcher 외부 인터뷰 | 인터뷰 + 분석 + Profile schema 검증 | 2~3주 |
| 신규 sub-agent 7~8개 정의 | 새 agent md + skill + template | 1~2주 |
| **합계 (B에 더하여)** | | **10~16주 추가** |

→ B 단독 4~6주 + C 추가 10~16주 = **총 14~22주** (3.5~5.5개월)

→ 사용자 명시 결정. 단, **점진 누적 가능** (한 번에 일괄 X) — design phase에서 sprint 분할.

## 6. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| 사용자 CP-1 결정 (C 확장) | ✅ | | | | 명시적 결정 — D-8 |
| risk-and-yagni.md OUT-OF-SCOPE | | | ✅ | | "alignment 메커니즘", "44 전체 점검", "ux-researcher 외부", "잔여 카탈로그 25"가 OUT → IN으로 이동 |
| ideation Q-6 (alignment 시스템화) | ✅ | | | | α + β 조합 권장 |
| ideation Q-10 (추가 프레임워크) | | | | ✅ | Kano Model 추가 (#30) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — 확장 범위 C 채택분 |
