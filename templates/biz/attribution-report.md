---
artifact: attribution-report
owner_agent: marketing-analytics-analyst
phase: biz
canon_source: "Multi-Touch Attribution Framework + Google Analytics 4 spec (developers.google.com/analytics) + Don Schultz 'Marketing Mix Modeling' + Avinash Kaushik 'Web Analytics 2.0' (2009)"
execution:
  policy: scope
  intent: marketing-attribution
  prereq: [gtm-strategy]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: marketing_channels_active
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Biz 단계 — 다채널 마케팅 환경에서 conversion 기여도 분석. last-click 만으로는 부정확 → Multi-Touch Attribution + MMM."
---

# Marketing Attribution Report

> **canon**: Multi-Touch Attribution (MTA) Framework — touchpoint 별 기여 가중치. GA4 — Data-Driven Attribution. Don Schultz *Marketing Mix Modeling* — top-down statistical. Avinash Kaushik *Web Analytics 2.0* (2009) — actionable analytics.
>
> **목적**: customer journey 의 어느 touchpoint 가 conversion 에 얼마나 기여했나? **last-click 만으로는 부정확** (정착·인지 채널 무가치 평가).

---

## 1. Attribution Model 비교

| Model | 정의 | 강점 | 약점 |
|-------|------|------|------|
| **Last-click** | 마지막 touchpoint 100% | 단순 | upper-funnel 무시 |
| **First-click** | 첫 touchpoint 100% | brand awareness 평가 | conversion 추적 약 |
| **Linear** | 모든 touchpoint 균등 | balanced | 차별화 X |
| **Time-decay** | 최근 touchpoint 가중 | recency bias | 큰 추세 무시 |
| **U-shaped** | 첫·마지막 40%, 중간 20% | top + bottom funnel | 임의 가중치 |
| **W-shaped** | 첫 / mid / 마지막 30% | lead-gen 강조 | B2B 적합 only |
| **Data-driven (GA4)** | ML 기반 가중치 | 객관적 | data volume 필요 |
| **Markov / Shapley** | game theory | 통계적 정확 | 구현 복잡 |

**Selected**: ______ + 이유

## 2. Customer Journey Mapping

| Touchpoint | Channel | Cost | Frequency (avg) |
|------------|---------|:----:|:--------------:|
| 1. Discovery | (예: Google Search organic) | $0 | 1x |
| 2. Consideration | (예: blog content) | $X (content) | 3x |
| 3. Evaluation | (예: free trial) | $0 | 1x |
| 4. Purchase | (예: paid ad retargeting) | $$ | 1x |
| 5. Retention | (예: email nurture) | $X | weekly |

## 3. Channel Performance

| Channel | Spend | Conversions (last-click) | Conversions (data-driven) | CPA (last-click) | CPA (DDA) |
|---------|:-----:|:-----------------------:|:-----------------------:|:--------------:|:---------:|
| Organic SEO | $0 (time) | 100 | 130 | $0 | $0 |
| Content / Blog | $X | 50 | 80 | $X/50 | $X/80 |
| Paid Search | $$ | 120 | 90 | $$/120 | $$/90 |
| Display | $$ | 30 | 50 | $$/30 | $$/50 |
| Social | $$ | 40 | 60 | ... | ... |

→ **DDA 가 last-click 보다 upper-funnel (Content/SEO) 가치 더 인정**.

## 4. MMM (Marketing Mix Modeling) — top-down

> 각 채널의 **incremental impact** 측정 (regression). 외부 변수 (계절성 / 경쟁 / macro) 통제.

| Variable | Coefficient | p-value | Interpretation |
|----------|:----------:|:-------:|---------------|
| Paid Search Spend | 1.2 | < 0.01 | 매출 1.2x lift |
| Content publish freq | 0.5 | 0.03 | 매출 0.5x lift |
| Brand awareness | 0.8 | < 0.01 | 매출 0.8x lift |
| Holiday season | 1.5 | < 0.001 | 매출 1.5x lift (control) |

## 5. Incrementality Test

> Holdout / Geo / IP test — **causal** impact 검증.

| Channel | Test Type | Holdout 결과 | Decision |
|---------|----------|-------------|---------|
| Paid Search | 30% holdout | 매출 5% 감소 | 효과 있음 |
| Display | 50% holdout | 매출 0.5% 감소 | 효과 미미 → reduce spend |
| Email | 20% holdout | 매출 12% 감소 | 효과 큼 → invest |

## 6. ROAS / MER

- **ROAS** (Return On Ad Spend) = Revenue from ads / Ad spend (channel별)
- **MER** (Marketing Efficiency Ratio) = Total Revenue / Total Marketing spend (top-down)

| 임계 | 평가 |
|:---:|------|
| MER > 5x | 우수 |
| MER 3~5x | 건강 |
| MER < 3x | reduce spend |

---

## (작성된 sample)

### VAIS Code Plugin Attribution (GA 후 12개월 가정)

본 프로젝트 OSS 무료 → 직접 marketing spend 적음. **scope skip** 가능 (marketing_channels_active = false 가설).

대안 sample: GA 후 (2026 Q4 ~ 2027 Q3) 가설:

### Channel Performance

| Channel | Spend | Conversions | Last-click | DDA |
|---------|:-----:|:----------:|:---------:|:---:|
| Organic (Claude marketplace) | $0 | 500 | 500 | 700 |
| GitHub Trending | $0 | 100 | 50 | 200 (upper-funnel) |
| Lenny Newsletter | $500 (sponsorship) | 20 | 10 | 80 |
| Indie Hackers (post) | $0 (time) | 30 | 20 | 100 |
| Partnership (NCSOFT 사례 publish) | $0 | 5 (enterprise) | 5 | 20 |

→ **DDA 가 GitHub Trending + Lenny + Indie Hackers 의 upper-funnel 가치 인정** — last-click 만 보면 paid 가 과평가.

### Decision

- Lenny Newsletter $500 sponsorship: ROAS 너무 낮음 (Free user) but DDA 가 upper-funnel 가치 인정 → **유지**
- GitHub Trending: organic + 효과 큼 → **콘텐츠 + PR 기여 강화**
- NCSOFT 사례 publish: enterprise lead — **invest more (사례 1개당 ROAS 100x)**

---

## 작성 체크리스트

- [ ] **Attribution Model** 선택 + 이유 (last-click 단독 X 권장)?
- [ ] **Customer Journey Mapping** 5+ touchpoint?
- [ ] **Channel Performance** 비교 (last-click vs DDA)?
- [ ] **MMM** (regression) — top-down 분석?
- [ ] **Incrementality Test** (holdout / geo / IP)?
- [ ] **ROAS / MER** 임계 평가?
- [ ] **Causal vs Correlational** 구분 명시?
- [ ] post-attribution **decision** (invest / maintain / reduce / kill) 명시?

---

## ⚠ Anti-pattern (Avinash Kaushik + Schultz 명시)

- **Last-click only**: upper-funnel (SEO / brand) 무가치 평가 → 잘못된 budget 결정. **MTA 또는 DDA** 사용.
- **Vanity Metrics**: clicks / impressions / page views — actionable X. **conversions / revenue / LTV** 우선.
- **Causation = Correlation**: 캠페인 후 매출 증가 = 캠페인 효과 ❌. **incrementality test** 필수.
- **MMM 만**: top-down 만 — touchpoint 단위 행동 불가능. **MTA + MMM 결합**.
- **Channel silo**: 각 channel 별도 측정 — synergy 무시.
- **Holiday/Seasonal 무시**: control variable 없음 — 외부 영향 channel 효과로 오인.
- **Decision 부재**: 데이터만 보고 budget reallocation 안 함 — 분석 무의미.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 13. Multi-Touch Attribution + GA4 + MMM (Schultz) + Avinash Kaushik 정전. Attribution Model 8 + Customer Journey + Channel Performance + MMM regression + Incrementality + ROAS/MER + sample (VAIS GA 후 12개월) + checklist 8 + anti-pattern 7 |
