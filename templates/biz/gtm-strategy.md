---
artifact: gtm-strategy
owner_agent: growth-analyst
phase: biz
canon_source: "Sean Ellis & Morgan Brown 'Hacking Growth' (2017), Crown Business + Brian Balfour 'Four Fits' framework (brianbalfour.com) + Dave McClure AARRR Pirate Metrics + Reichheld NPS"
execution:
  policy: always
  intent: gtm-strategy
  prereq: [persona, strategy-kernel, prd]
  required_after: [pricing-strategy]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Biz 단계 — 모든 product 이 GTM (Go-To-Market) 전략 필요. North Star Metric + Growth Loop + 채널 + 메시징."
---

# GTM Strategy (Go-To-Market)

> **canon**: Sean Ellis & Morgan Brown *Hacking Growth* (2017) — growth team 운영 + AARRR funnel optimization. Brian Balfour *Four Fits* (Product/Market/Model/Channel) — sustainable growth 의 4 fit. McClure AARRR Pirate Metrics. Reichheld NPS.
>
> **목적**: product 출시 전 GTM 계획 + 출시 후 growth loop. North Star Metric + 채널 전략 + 메시징.

---

## 1. North Star Metric (NSM)

> **정의**: 회사의 장기 성공을 가장 잘 예측하는 단일 metric. user 의 핵심 가치를 수치화.
>
> **예시**: Spotify "time spent listening" / Airbnb "nights booked" / Slack "messages sent in connected teams"

**NSM**: ______ (정의 + 측정 방법 + 임계)
**Counter Metric**: (NSM 만 추구 시 망가질 수 있는 것 — 예: 만족도 / churn)

## 2. Brian Balfour Four Fits

| Fit | 정의 | 검증 |
|:---:|------|------|
| **Product-Market Fit** | 제품이 시장 통증 해소 | NPS / retention curve flattening |
| **Market-Channel Fit** | 시장이 도달 가능한 채널 가짐 | CAC < LTV |
| **Channel-Model Fit** | 채널 비용 vs ARPU 정합 | unit economics 양수 |
| **Model-Market Fit** | 가격 모델이 시장 WTP 정합 | conversion rate |

→ **4 fit 모두 만족** 해야 sustainable. 1 개 부재 = 한정적 성장.

## 3. AARRR Funnel (McClure Pirate Metrics)

| Stage | 정의 | 측정 | 최적화 도구 |
|:-----:|------|------|------------|
| **Acquisition** | user 도달 | UV / signup count | SEO / paid ads / content |
| **Activation** | 첫 가치 경험 | first-action / aha-moment % | onboarding / tooltip / sample |
| **Retention** | 반복 사용 | DAU/MAU / cohort retention | engagement loops / notifications |
| **Revenue** | 수익화 | conversion rate / ARPU | pricing tier / upsell |
| **Referral** | 추천 | k-factor / NPS promoter % | referral program / sharing |

## 4. Growth Loop (Brian Balfour)

> **funnel 의 반대**: 1 회성 acquisition X. **자기 강화 사이클**.

```
[User Action] ─▶ [Output] ─▶ [Reinvest] ─▶ [More Users]
        ▲                                        │
        └────────────────────────────────────────┘
```

**Loop Type**:
- **Content Loop**: User → 콘텐츠 생성 → SEO 노출 → 신규 User
- **Viral Loop**: User → 친구 초대 → 신규 User
- **Paid Loop**: User → revenue → ad spend → 신규 User
- **Sales Loop**: User → enterprise contract → 영업 ROI → 신규 enterprise

## 5. Channel Strategy

| Channel | CAC (예상) | LTV/CAC | Target Stage |
|---------|:---------:|:-------:|:----------:|
| Organic SEO | $0 (time) | High | All |
| Content (blog / YouTube) | $X | Med-High | Acquisition |
| Paid (Google / Meta) | $$ | Low-Med | Acquisition |
| Community (Discord / Slack) | $X (time) | High | Retention |
| Partnership / Integration | $X | High | Acquisition + Activation |
| Cold outbound (sales) | $$$ | High (B2B) | Enterprise |

→ **Phase 별 channel mix** 명시 (early: organic + content / scale: paid + sales).

## 6. Messaging Hierarchy

```
Vision (BHAG) ─▶ Positioning Statement ─▶ Value Prop ─▶ Tagline ─▶ Marketing Copy
```

**Positioning Statement (Geoffrey Moore 형식)**:
"For [target persona], [product] is [category] that [unique benefit]. Unlike [alternative], [differentiator]."

---

## (작성된 sample)

### VAIS Code Plugin GTM (2026-Q3 GA → 2027 H2 Enterprise)

### 1. North Star Metric

**NSM**: **"Weekly Active Users completing 30-min PRD with canon_source"** (정전 명시 PRD 30분 완성 weekly user)
**측정**: hook event tracking (PRD generation + canon_source 검증)
**Counter**: NPS (정성 만족도) — vanity metric 회피

### 2. Four Fits 평가 (현재 상태)

| Fit | 상태 | 검증 |
|:---:|:----:|------|
| Product-Market | ⏳ | RA-1 외부 인터뷰 (Sprint 14) — 5/7 promoter 목표 |
| Market-Channel | ✅ | Claude Code marketplace 직접 접근 (organic) |
| Channel-Model | N/A (OSS) | enterprise 진입 시 평가 |
| Model-Market | ⏳ | OSS 무료 — H2 2027 enterprise pricing 검증 |

### 3. AARRR (GA 후 12개월 목표)

| Stage | Y0 (GA) | Y1 (2027 Q3) |
|:-----:|:------:|:-----------:|
| Acquisition | 100 install/월 | 1k install/월 |
| Activation | 30% (PRD 완성) | 50% |
| Retention (3 sprint+) | 20% | 40% |
| Revenue | $0 | $12k/월 (Pro 50 + Enterprise 3) |
| Referral (NPS) | 30 | 50 |

### 4. Growth Loop

**Primary Loop (Content + Community)**:
```
User 가 OSS 사용 → 정전 출처 명시 PRD 결과물에 만족 →
  → GitHub Star + PR 기여 (정전 추가) →
  → Repo trending → 신규 User onboarding →
  (loop)
```

**Secondary Loop (Enterprise Sales)**:
```
NCSOFT 음성기술팀 사례 publish → 다른 사내 팀 inbound → enterprise PoC →
  → enterprise contract → 사례 연구 → 다른 회사 inbound
  (loop, H2 2027~)
```

### 5. Channel

| Channel | Phase | 우선순위 |
|---------|:-----:|:------:|
| Claude Code marketplace (organic) | All | High |
| Lenny Newsletter / Indie Hackers (콘텐츠) | Acquisition | High (post-GA) |
| GitHub Star / Trending | Acquisition + Retention | Med |
| Discord / Slack (VAIS community) | Retention + Referral | Med |
| NCSOFT 사내 도입 사례 (Beta-2) | Enterprise Sales | High (H2) |
| Paid ads | (deprioritized — OSS 모델) | Low |

### 6. Messaging

**Vision (BHAG)**: 2035년 10만 솔로 빌더가 Fortune 500 수준 프로세스를 실행
**Positioning**: "For 솔로 빌더 + 소규모 팀 PM, VAIS Code is AI C-Suite Plugin that delivers canon-grounded artifacts matched to your project profile. Unlike generic AI tools producing arbitrary formats, VAIS knows what to build, what to skip, and why."
**Tagline**: "1인 빌더의 AI 의수" / "Canon-grounded AI C-Suite"

---

## 작성 체크리스트

- [ ] **North Star Metric** 정의 + 측정 방법 + Counter Metric?
- [ ] **Four Fits** (Product/Market/Channel/Model) 모두 평가?
- [ ] **AARRR funnel** 5 stage 모두 측정 + 임계 + 최적화 도구?
- [ ] **Growth Loop** (Content / Viral / Paid / Sales 중 하나 이상) 명시?
- [ ] **Channel mix** Phase 별 우선순위 + CAC 추정?
- [ ] **Messaging Hierarchy** (Vision → Positioning → Value Prop → Tagline) 정합?
- [ ] **Geoffrey Moore Positioning** 형식 적용?
- [ ] Persona / Strategy Kernel (`prereq`) 와 정합?

---

## ⚠ Anti-pattern (Sean Ellis + Brian Balfour 명시)

- **Funnel-only thinking**: 1 회 acquisition 추구 — sustainable 아님. **Loop 강제**.
- **Vanity NSM**: page view / signup count — actionable X. user 의 **핵심 가치** 와 직결되어야.
- **모든 채널 동시**: 모든 channel 시도 → CAC 분산 + 학습 부재. **1~2 channel 검증 후 확장**.
- **Counter Metric 부재**: NSM 만 추구 → spam / churn 폭증. **Counter** 강제.
- **Four Fits 단일 평가**: PMF 만 보고 Channel-Model fit 무시 → 성장 멈춤.
- **Positioning 부재**: 모든 사람 대상 — focused X. Geoffrey Moore Bowling Alley 권장.
- **Paid first**: organic / content 검증 전 paid — CAC 폭증 + 지속 불가.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 13. Sean Ellis + Brian Balfour + McClure AARRR + Reichheld + Geoffrey Moore 정전. NSM + Four Fits + AARRR + Growth Loop + Channel + Messaging + sample (VAIS Code GA→H2 2027 GTM) + checklist 8 + anti-pattern 7 |
