---
artifact: unit-economics-analysis
owner_agent: unit-economics-analyst
phase: biz
canon_source: "David Skok 'SaaS Metrics 2.0' (forEntrepreneurs.com) + Croll & Yoskovitz 'Lean Analytics' (2013), O'Reilly + Bessemer Cloud Index + Klipfolio CAC/LTV best practices"
execution:
  policy: scope
  intent: unit-economics
  prereq: [pricing-strategy]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: revenue_model
      operator: IN
      value: [saas, subscription, marketplace, b2b-saas, b2c-saas]
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Biz 단계 — per-customer 수익성 평가. SaaS / subscription / marketplace 에서만 의미. CAC / LTV / Payback / NRR / GRR 표준."
---

# Unit Economics Analysis

> **canon**: David Skok *SaaS Metrics 2.0* (forEntrepreneurs.com) — SaaS 표준 metrics. Croll & Yoskovitz *Lean Analytics* (2013) — 단계별 OMTM (One Metric That Matters). Bessemer Cloud Index — public SaaS benchmark.
>
> **목적**: per-customer 단위로 수익 가능성 평가. **financial-model 보다 micro 한 시각** — 회사 전체가 아닌 1 customer 수익성.

---

## 1. CAC (Customer Acquisition Cost)

> **정의**: 신규 customer 1명 획득 비용. (S&M 비용) ÷ (period 신규 customer 수)

**계산**:
```
CAC = (Sales + Marketing 비용) / 신규 customer 수
```

**Blended vs Channel별**:
- **Blended CAC**: 전체 평균
- **Paid CAC**: paid 채널만 (organic 제외)
- **Channel별 CAC**: SEO / content / paid / sales 별 분리

## 2. LTV (Lifetime Value)

> **정의**: customer 1명이 평생 발생시키는 수익 (gross profit 기준).

**계산 (3 가지 방법)**:

### 방법 1: Simple
```
LTV = ARPU × Gross Margin × (1 / Churn Rate)
```

### 방법 2: Cohort 기반
```
LTV = Σ (Month n 의 Gross Profit per customer) — 24~36 개월
```

### 방법 3: Predicted (NRR 반영)
```
LTV = ARPU × Gross Margin × (1 / (Churn - Expansion))
```

→ NRR > 100% 인 경우 LTV 무한대 (positive churn).

## 3. CAC / LTV Ratio (Skok Standard)

| Ratio | 평가 |
|:-----:|------|
| **LTV/CAC > 3** | 건강 (Skok 권장) |
| **LTV/CAC > 5** | 우수 — 더 공격적 acquisition 가능 |
| **LTV/CAC < 3** | 우려 — pricing/retention/CAC 개선 필요 |
| **LTV/CAC < 1** | 위기 — 즉시 pivot |

## 4. Payback Period

> **정의**: CAC 회수 시간. < 12개월 권장 (Skok).

```
Payback = CAC / (ARPU × Gross Margin × monthly)
```

## 5. SaaS-specific Metrics

### 5.1 ARR / MRR
- ARR (Annual Recurring Revenue) = MRR × 12
- New ARR / Expansion ARR / Churned ARR / Reactivation ARR

### 5.2 NRR (Net Revenue Retention)
```
NRR = (Starting MRR + Expansion - Churn - Contraction) / Starting MRR
```

| NRR | 평가 |
|:---:|------|
| > 130% | World-class (Bessemer top quartile) |
| 110~130% | 우수 |
| 100~110% | 건강 |
| < 100% | 우려 |

### 5.3 GRR (Gross Revenue Retention)
```
GRR = (Starting MRR - Churn - Contraction) / Starting MRR
```
- Expansion 제외 — pure retention. > 90% 권장.

### 5.4 Magic Number
```
Magic Number = (Quarterly New ARR × 4) / S&M spend prior quarter
```
| Magic Number | 결정 |
|:------:|------|
| > 1.0 | 더 spend (capital efficient growth) |
| 0.5~1.0 | 유지 |
| < 0.5 | reduce S&M / focus retention |

## 6. Cohort Analysis

| Cohort | Month 0 | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|:------:|:------:|:------:|:------:|:------:|
| 2026-Q1 | 100% | 80% | 60% | 50% | 45% |
| 2026-Q2 | 100% | 85% | 70% | 60% | (50%?) |
| 2026-Q3 | 100% | 90% | 75% | (65%?) | — |

→ **Retention curve flattening** 이 PMF 신호 (Sean Ellis).

---

## (작성된 sample)

### VAIS Code Plugin Unit Economics (H2 2027~ Enterprise 가설)

본 프로젝트 OSS 무료 → unit economics 본격 적용은 H2 2027 enterprise 출시 후. **scope skip** (현재 revenue_model = none).

### Enterprise 가설 (2027 Q3 ~ 2029)

| Metric | Y1 (2027) | Y2 (2028) | Y3 (2029) |
|--------|:--------:|:--------:|:--------:|
| ARPU | $50k/년 | $50k/년 | $55k/년 (10% 인상) |
| Gross Margin | 80% | 80% | 82% |
| Customer count | 3 | 15 | 50 |
| CAC | $30k (high-touch sales) | $25k | $20k (브랜드 효과) |
| **LTV** (3y churn) | $100k | $100k | $135k |
| **LTV/CAC** | **3.3x** ✅ | **4.0x** ✅ | **6.7x** ✅ |
| **Payback** | 9 개월 ✅ | 7.5 개월 | 5 개월 |
| Annual Churn | 10% | 8% | 5% |
| Expansion (NRR) | 105% | 115% | 125% |
| **NRR** | **105%** | **115%** | **125%** ⭐ |
| **GRR** | **90%** | **92%** | **95%** ✅ |
| Magic Number | 0.6 (early) | 1.2 (efficient) | 1.5 |

→ Year 3 까지 LTV/CAC 6.7x + NRR 125% — **Skok world-class** + Bessemer top quartile.

### Cohort Retention 가설

| Cohort | M0 | M3 | M6 | M12 | M24 |
|--------|:--:|:--:|:--:|:--:|:--:|
| 2027-Q1 | 100% | 95% | 92% | 90% | 88% |
| 2027-Q4 | 100% | 96% | 94% | 92% | (90%?) |

→ M12 90%+ flattening = strong PMF signal.

### Caveat

본 sample 은 **가설 + 외부 인터뷰 미검증**. 실제 H2 2027 enterprise 출시 후 6 개월 cohort 데이터 필요.

---

## 작성 체크리스트

- [ ] **CAC** 계산 (Blended + Channel별 분리)?
- [ ] **LTV** 3 가지 방법 (Simple / Cohort / Predicted) 중 선택 + 명시?
- [ ] **LTV/CAC > 3** (Skok standard) 만족?
- [ ] **Payback < 12 개월** (Skok)?
- [ ] **NRR + GRR** 분리 측정 (Expansion 명시)?
- [ ] **Magic Number** 계산 + S&M efficiency 평가?
- [ ] **Cohort Analysis** 12+ 개월 retention curve 시각화?
- [ ] **Caveat** (가정 vs 검증 데이터 구분)?

---

## ⚠ Anti-pattern (Skok 명시)

- **Net Churn 만**: NRR 만 보고 GRR 무시 — true retention 모름. Expansion 이 churn 가림.
- **Blended CAC 만**: Channel별 분리 X — 비효율 channel 식별 못함.
- **LTV 과대 추정**: 12 개월 인터뷰 데이터로 5년 LTV 가정 — Skok 경고. **실측 cohort** 우선.
- **Magic Number 단일 분기**: 1 분기 outlier 기반 결정 — 4분기 trailing 권장.
- **Payback 무시**: LTV/CAC 좋아도 Payback 36개월+ 이면 capital efficiency 폭망.
- **Cohort flattening 무시**: Month 12 retention 30% 인데 신규 acquisition 만 추구 — leaking bucket.
- **B2C metrics 적용**: B2B SaaS 에 B2C metric (DAU/MAU) — irrelevant. NRR + Magic Number 우선.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 13. Skok SaaS Metrics + Lean Analytics + Bessemer + Klipfolio 정전. CAC + LTV + Payback + NRR/GRR + Magic Number + Cohort + sample (VAIS Enterprise H2 2027~ — Y3 LTV/CAC 6.7x / NRR 125%) + checklist 8 + anti-pattern 7 |
