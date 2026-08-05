# GTM Funnel (CBO)

growth-analyst 가 사용. AARRR (Pirate metrics) 기반.

## AARRR Funnel

| 단계 | 측정 | 목표 |
|------|------|------|
| **Acquisition** (획득) | 방문자 / 회원가입 | CAC < LTV/3 |
| **Activation** (활성화) | 첫 가치 경험 ("aha moment") | 가입 후 X분 내 가치 도달 |
| **Retention** (유지) | M1, M3, M6 retention | M1 ≥ 40%, M3 ≥ 25% |
| **Revenue** (수익) | 유료 전환 / 평균 매출 | LTV/CAC ≥ 3x |
| **Referral** (추천) | NPS / viral coefficient | k ≥ 0.5 (자가 성장) |

## Channel Mix

| 채널 | 적합 | 비용 구조 |
|------|------|----------|
| SEO + Content | long-tail, B2B | 시간 투자 (3-6개월 lag) |
| Paid Search | high-intent, transactional | 즉시 결과, CPM/CPC |
| Social Ads | brand, awareness | scale 가능, attribution 어려움 |
| Outbound Sales | enterprise, ACV $10k+ | high CAC, high LTV |
| Product-Led Growth | self-serve SaaS | low CAC, viral loops |
| Partnerships | distribution | revenue share |

## Growth Loop 패턴

1. **User → Content → User** (UGC, viral)
2. **User → Invite → User** (referral incentive)
3. **User → SEO → User** (programmatic SEO from data)
4. **Free → Premium → Revenue → Acquisition** (PLG)
5. **Sales → Customer → Case Study → Sales** (enterprise)

## QA 기준

- Acquisition: CAC 채널별 + blended 측정, channel ROI ≥ 1.5
- Activation: aha moment 정의 + 측정 가능
- Retention: M3 ≥ 25% (consumer), ≥ 70% (B2B SaaS)
- Revenue: LTV/CAC ≥ 3x, Quick Ratio ≥ 4
- Referral: NPS 측정, k-factor 계산

## artifact 박제

- `docs/{feature}/02-design/gtm-funnel.md`
- `docs/{feature}/03-do/marketing-analytics.md` (multi-touch attribution)
