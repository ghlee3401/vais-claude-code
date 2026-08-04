---
artifact: pricing-strategy
owner_agent: pricing-analyst
phase: biz
canon_source: "Thomas Nagle, John Hogan, Joseph Zale 'The Strategy and Tactics of Pricing' (2017, 6th ed.), Routledge + Madhavan Ramanujam 'Monetizing Innovation' (2016), Wiley + Van Westendorp Price Sensitivity Meter (1976)"
execution:
  policy: scope
  intent: pricing-strategy
  prereq: [persona, jobs-to-be-done, financial-model]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: revenue_model
      operator: NOT_IN
      value: [none, free-only]
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Biz 단계 — value-based pricing + tier 설계 + 매출 시뮬레이션. revenue model 결정 후 작성. review_recommended=true: 잘못된 가격은 PMF 후 반전 비용 폭증."
---

# Pricing Strategy

> **canon**: Nagle, Hogan, Zale *Strategy and Tactics of Pricing* (2017) — value-based pricing 표준. Madhavan *Monetizing Innovation* (2016) — willingness-to-pay 측정. Van Westendorp *Price Sensitivity Meter* (1976) — 4 질문 기반 가격대 도출.
>
> **목적**: customer willingness-to-pay 측정 + value-based 가격 결정 + tier 설계 + 매출 시뮬레이션.

---

## 1. Pricing Model 선택

| Model | 적정 시점 |
|-------|----------|
| **Cost-plus** | 단순성 / margin 보장 / B2B 단순 도구 |
| **Competitive** | 동질화된 시장 / fast follower |
| **Value-based** | unique value / differentiation 가능 — Nagle 추천 default |
| **Freemium** | 낮은 한계 비용 / network effect / acquisition 우선 |
| **Subscription** | 반복 가치 / churn 관리 가능 |
| **Usage-based** | 사용량 비례 / pay-as-you-go (AWS / OpenAI) |
| **Tiered** | 다중 customer segment (Free/Pro/Enterprise) |

**Selected**: ______ + 이유 (Strategy Kernel 의 Guiding Policy 와 정합)

## 2. Willingness-to-Pay 측정

### 2.1 Van Westendorp PSM (4 질문)

고객 인터뷰 N≥30:
1. **Too expensive** — 절대 안 살 가격?
2. **Expensive but might consider** — 비싸지만 고려할 가격?
3. **Bargain (good deal)** — 저렴하다고 느끼는 가격?
4. **Too cheap (suspicious)** — 너무 싸서 의심되는 가격?

→ 4 곡선 교차로 **OPP (Optimal Price Point) + IPP (Indifference Price Point)** 도출.

### 2.2 Conjoint Analysis (대안)

여러 feature bundle 의 가격 vs 선호 — quantitative WTP.

## 3. Tier Design

| Tier | Target Persona | 핵심 기능 | 가격 (월) | Conversion 목표 |
|------|---------------|----------|:---------:|:------------:|
| **Free** | 개인 / trial | (10% 기능) | $0 | → Pro 5% 전환 |
| **Pro** | 솔로 빌더 | (80% 기능) | $X | → Enterprise 10% |
| **Enterprise** | 팀 / 회사 | (100% + SSO + audit) | $Y | (high-touch sales) |

**Tier 설계 원칙 (Madhavan)**:
- 차별화: 기능별 명확한 경계 (Free → Pro 전환 통증)
- 3 ± 1 tier (5+ 는 결정 마비)
- Top tier: anchor (high-end 비교 효과)

## 4. Revenue Simulation

| Customer Mix | Free | Pro ($X) | Enterprise ($Y) | MRR |
|--------------|:---:|:--:|:--:|:---:|
| Y1 (1k users) | 800 | 180 | 20 | $X×180 + $Y×20 |
| Y2 (10k users) | 7000 | 2500 | 500 | ... |
| Y3 (50k users) | 30k | 15k | 5k | ... |

**가정**:
- Free → Pro 전환 5%
- Pro → Enterprise 전환 10%
- Churn (annual): Free 30% / Pro 10% / Enterprise 5%

## 5. Discount + Promotion Policy

| Discount | 적정 시점 | 위험 |
|----------|----------|------|
| Annual prepay (-15~20%) | Cash flow 개선 | (가능) |
| Volume (>10 user, -10%) | enterprise sales | (margin 압박) |
| Education / non-profit | brand + future hire | OK |
| Launch promo (-50%, 1mo) | acquisition | **Anchor effect 손상** — Madhavan 경고 |

---

## (작성된 sample)

### VAIS Code Plugin Pricing (H2 2027 — Enterprise 가설)

본 프로젝트 GA (2026 Q3) 까지 **OSS 무료** — pricing-strategy 본격 적용은 H2 2027 enterprise 출시 후.

### 1. Model

**Selected**: Tiered (Free OSS / Pro / Enterprise) — **Madhavan 권장**: 차별화 명확 + 3 tier
**Strategy Kernel 정합**: "솔로 빌더는 OSS 로 무료 onboard → 팀 형성 시 enterprise 자연 전환"

### 2. WTP (가설 — RA-1 외부 인터뷰 후 검증)

| Tier | OPP (가설) | IPP (가설) |
|------|:---------:|:---------:|
| Free | $0 | $0 |
| Pro | $20/월 | $30/월 |
| Enterprise | $50k/년 (per company) | $80k/년 |

→ Sprint 14 외부 인터뷰 5~7명 + Beta-2 NCSOFT PoC 후 보정.

### 3. Tier

| Tier | Target | 기능 | 가격 |
|------|--------|------|:----:|
| **Free (OSS)** | P1 솔로 빌더 / OSS 사용자 | 6 C-Level + 50+ template + 정전 카탈로그 | $0 |
| **Pro** (post-GA) | P1+ team lead | + private 카탈로그 + 사내 정전 추가 | $20/월/user |
| **Enterprise** | P3 엔터프라이즈 | + SSO + audit log + SLA + custom training | $50k/년 (50+ user) |

### 4. Revenue Simulation (H2 2027~)

| Year | Free | Pro | Enterprise | ARR |
|------|:---:|:---:|:---:|:---:|
| 2027 | 5k | 50 | 3 | $12k + $150k = **$162k** |
| 2028 | 30k | 500 | 15 | $120k + $750k = **$870k** |
| 2029 | 100k (BHAG) | 2k | 50 | $480k + $2.5M = **$3M** |

→ BHAG (10만 솔로 빌더) 정렬 — 2029 ARR $3M 목표.

---

## 작성 체크리스트

- [ ] Pricing Model 선택 + Strategy Kernel 정합?
- [ ] **WTP 측정** (Van Westendorp PSM 또는 Conjoint) — 인터뷰 N≥30?
- [ ] Tier 설계 — **3 ± 1 tier** + 명확한 차별화?
- [ ] Revenue Simulation 5+년 + customer mix + churn 가정?
- [ ] **Discount Policy** 명시 + Anchor effect 보호?
- [ ] **Top tier** 가 anchor 역할 (high-end)?
- [ ] **Conversion funnel** (Free→Pro→Enterprise) 가정 명시?
- [ ] WTP 가설 → 외부 인터뷰 검증 일정?

---

## ⚠ Anti-pattern (Nagle + Madhavan 명시)

- **Cost-plus 만**: 가격 = COGS × 1.5 — value 무시. unique value 가 있으면 value-based 우월.
- **Free trial 남발**: "30일 무료" — value 가 한 달 안에 인지되지 않으면 conversion 폭망.
- **Launch -50% promo**: anchor effect 손상 — 정가 인지 어려움.
- **Tier 5+**: 결정 마비. **3 ± 1 tier** Madhavan 권고.
- **Single-tier**: 모든 customer 동일 가격 — high-WTP 손실 + low-WTP exclusion.
- **WTP 측정 부재**: 임의 가격 결정 → 시장 반응 후 수정 비용 100x.
- **Discount 자동화**: enterprise 영업 시 discount 자동 적용 — Sales 의 negotiating 자산 상실.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 13. Nagle + Madhavan + Van Westendorp 정전. Pricing Model 7 + WTP (PSM/Conjoint) + Tier (3±1) + Revenue Simulation + Discount + sample (VAIS Enterprise H2 2027~) + checklist 8 + anti-pattern 7 |
