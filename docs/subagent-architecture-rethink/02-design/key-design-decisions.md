---
owner: cpo
topic: key-design-decisions
phase: design
feature: subagent-architecture-rethink
authors: [product-discoverer, product-strategist, product-researcher, ux-researcher]
---

# Topic: 핵심 Design 결정 (4 sub-agent 통합 큐레이션)

> 4개 sub-agent의 _tmp/ scratchpad에서 **공통적으로 부상한 결정**을 추출. 본 topic은 do phase(prd-writer)와 그 이후 모든 단계가 참조해야 하는 design 단계의 결정 골격.

## 1. 통합 결정 매트릭스

| # | Decision | discoverer | strategist | researcher | ux-researcher | 종합 |
|---|----------|:----------:|:----------:|:----------:|:-------------:|:----:|
| **D-D1** | 4단계 프레임 + 메타-원칙 일관 적용 (Sol-8-A) | ✅ Sol-8-A | ✅ CA-1, CA-2 | — | — | **확정** |
| **D-D2** | Profile + 정책 4분류 게이트 (Sol-1-A + S-1) | ✅ Sol-1-A | ✅ S-1 (UVP) | ✅ Journey 전환 | ✅ T1 | **확정** |
| **D-D3** | Template depth (c) — sample+checklist+anti-pattern | ✅ Sol-3-A | ✅ S-3 | ✅ 88% 부재 가시화 | △ 정전 출처 명시 | **확정** |
| **D-D4** | release-engineer 5분해 + 의심 5 sub-agent 정책 적용 | ✅ Sol-1-A 시범 | ✅ CA-4 | ✅ 6개 정의 발췌 검증 | ✅ T2 시나리오 | **확정** |
| **D-D5** | Alignment 메커니즘 α(auto-judge) + β(alignment 산출물) | ✅ Sol-7-A | ✅ CA-7 | — | △ H-6 검증 | **확정** |
| **D-D6** | Project Profile 12 변수 schema v1 — ideation 종료 hook | ✅ Sol-4-A | ✅ CA-3 | ✅ Journey 전환 | ✅ H-1, T1 | **확정** |
| **D-D7** | 잘못된 매핑 정정 — VPC → product-strategist | ✅ Sol-5-B | △ | △ | — | **확정** |
| **D-D8** | CEO sub-agent 4개 신설 (vision-author / strategy-kernel-author / okr-author / pr-faq-author) | — | ✅ H1 vision | ✅ CEO 빈약 진단 | — | **확정** |
| **D-D9** | What 단계 sub-agent 1개 신설 (roadmap-author) | — | ✅ H1 vision | — | — | **확정** |
| **D-D10** | OPP-6 (중복 배치)는 OPP-8 해소 시 자동 흡수 — 별도 솔루션 불필요 | ✅ 큐레이션 | — | — | — | **확정** |
| **D-D11** | P1 솔로 빌더용 "경량화 정전 가이드" 검토 (Lean OST 등) | — | — | ✅ 7/10 정전 적용 | — | **검토 필요** (do phase) |
| **D-D12** | 인터뷰 결과 없이 즉시 적용 3가지: Profile 한 줄 예시 / 산출물 컨텍스트 컬럼 / `review_recommended` 메타필드 | — | — | — | ✅ | **즉시 적용** (do phase) |
| **D-D13** | "Always" 정책 산출물 9개 (PRD/ADR/Vision/CHANGELOG 등) 적정성 — 인터뷰 H-2 카드 정렬로 검증 | — | — | — | ✅ H-2 | **검증 필요** (qa) |

## 2. 즉시 검증 가정 Top 3 (RA — Risk Assumption)

| 가정 | 카테고리 | 리스크 | 검증 방법 |
|------|---------|:------:|---------|
| Profile 게이트가 실제 통증 해소 | User Value | **상** | EXP-1 (30분) + EXP-5 외부 인터뷰 (2~3주) |
| Profile 합의 UX 직관성 (12 변수 인지부하) | Usability | **상** | think-aloud 테스트 3명 + T1 시나리오 |
| 50+ template 작업량 14~22주 실현가능성 | Feasibility | **상** | 5개 파일럿 sprint 측정 |

전체 8 risk category × 15 가정 매핑은 `_tmp/product-discoverer.md` 섹션 5 참조.

## 3. Do phase 즉시 작업 항목 (prd-writer 입력)

### 3.1 PRD 8섹션 골격

| 섹션 | 핵심 내용 | 정전 |
|------|---------|------|
| 1. Summary | 메타-VAIS 리팩터링 — default-execute 해소 + 산출물 표준화 | — |
| 2. Contacts | 사용자(이근호) + AI C-Suite | — |
| 3. Background | 사용자 자기 진단 + ideation 8턴 | *제품의 탄생* 4단계 |
| 4. Objective | SC-01~10 (B/C 통과 기준) | OKR (Doerr) |
| 5. Market Segment | 3 Personas (P1/P2/P3) + TAM/SAM/SOM | Steve Blank |
| 6. Value Proposition | UVP "AI 의수" + JTBD 6-Part + Geoffrey Moore Positioning | Christensen / Moore |
| 7. Solution | 50+ 카탈로그 (4단계) + Profile schema + 정책 4분류 + 신규 sub-agent 7개 | (다양) |
| 8. Release | H1 (now): MVP 25 / 점진 50개. H2 (1~2년): epistemic contract. H3 (3년+): ecosystem | 3-Horizon Model |

### 3.2 신규 sub-agent 정의 항목 (7개)

| Agent | C-Level | 산출물 | 정책 |
|-------|---------|--------|:----:|
| vision-author | CEO | Vision Statement / BHAG | A |
| strategy-kernel-author | CEO | Strategy Kernel | A |
| okr-author | CEO | OKR | A |
| pr-faq-author | CEO | Working Backwards PR/FAQ | C |
| roadmap-author | CPO/What | Now-Next-Later Roadmap | A |
| (release-engineer 분해 5개) | COO | Release Notes / CI/CD / Container / Migration / Runbook | A/B/B/D/B |

### 3.3 Profile schema v1 (12 변수)

`mvp-scope.md` 섹션 2 참조. ux-researcher 인사이트 반영 — 각 변수에 **한 줄 예시** 추가:

```yaml
project_profile:
  type:                    # 예: "b2b-saas" — 구독 기반 SaaS
  stage:                   # 예: "mvp" — 첫 사용자 검증 단계
  users.target_scale:      # 예: "sub-1k" — 초기 1000명 미만
  users.geography:         # 예: "domestic" — 국내 한정
  business.revenue_model:  # 예: "subscription"
  business.monetization_active:  # bool
  data.handles_pii:        # bool
  data.handles_payments:   # bool
  data.handles_health:     # bool
  data.cross_border_transfer:  # bool
  deployment.target:       # 예: "cloud" — AWS/GCP/Azure
  deployment.sla_required: # bool
  brand.seo_dependent:     # bool
  brand.public_marketing:  # bool
```

### 3.4 Template metadata schema (frontmatter 확장)

```yaml
artifact: lean-canvas
owner_agent: product-strategist
phase: what
canon_source: "Maurya 'Running Lean'"
execution:
  policy: user-select         # always | scope | user-select | triggered
  scope_conditions: [...]
  intent: business-model-design
  alternates: [business-model-canvas, value-proposition-canvas]
  trigger_events: []
  prereq: [pest-analysis]
  required_after: [prd]
  review_recommended: false   # 신규 (D-D12)
template_depth: filled-sample-with-checklist
project_context_reason: "What 단계 BM 결정의 1차 산출물"  # 신규 (D-D12)
```

## 4. CPO 종합 큐레이션 기록

| 기여 sub-agent | 핵심 기여 | 통합 |
|----------------|---------|------|
| product-discoverer | OST + 8 OPP + 5 EXP + 8 RA | `opportunity-tree.md` |
| product-strategist | Lean Canvas + JTBD + Strategy Kernel + 4단계 시각화 + SWOT + 3-Horizon | `strategy-canvas.md` |
| product-researcher | 내부 진단 + 경쟁 5 + TAM/SAM/SOM + 3 Persona + Reference Canon 검증 + Journey | `market-personas.md` |
| ux-researcher | 인터뷰 가설 7 + 스크립트 6섹션 + 모집 매트릭스 + UT 3 + Persona 심화 + Empathy | `interview-plan.md` |
| **CPO 종합** | 13 결정(D-D1~D-D13) + Top 3 RA + Do phase 작업 항목 | **본 topic** |

## 5. CP-2 (Do 시작 전) 사용자 승인 대기 항목

다음 사용자 승인이 필요한 사항:
1. **D-D11** (P1 경량화 정전 가이드) — 검토 결정 보류, do phase에서 결정
2. **D-D13** ("Always" 9개 적정성) — 인터뷰 후 검증
3. **prd-writer 호출 승인** — Do phase 진입 시 CP-2

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — 4 sub-agent 결과 통합 13 결정 + Do phase 즉시 작업 항목 |
