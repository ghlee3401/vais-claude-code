# Pricing Tier Design (CBO)

pricing-analyst 가 사용. SaaS / consumer / B2B 가격 전략.

## Tier 패턴

| 패턴 | 구조 | 적합 |
|------|------|------|
| **Good-Better-Best** | 3 tier (Free/Pro/Enterprise) | SaaS, broad market |
| **Per-Seat** | 사용자당 가격 | B2B 협업 도구 |
| **Usage-Based** | 사용량 (API 호출, GB, 트랜잭션) | infrastructure, AI |
| **Hybrid** | base seat + usage overage | API SaaS 중급 |
| **Freemium** | Free tier + paid features | B2C, viral growth |

## Anchor 원칙 (행동경제학)

1. **가운데 tier = 권장** — 사용자 60-70% 가 선택 (Goldilocks effect)
2. **상위 tier 의 anchor** — Enterprise 를 보여줘 Pro 가 합리적으로 보이게
3. **하위 tier 의 한계** — Free tier 에 의도적 제한 (사용량 / 기능 / 지원 채널)

## Pricing 검증 체크리스트

- [ ] LTV/CAC ratio ≥ 3x 가능한가
- [ ] CAC Payback ≤ 12개월 가능한가
- [ ] Gross Margin 70%+ (SaaS) 유지 가능한가
- [ ] 경쟁사 ±20% 범위 내 (또는 명확한 차별화)
- [ ] Enterprise tier 가 sales motion 과 정합 (high-touch vs self-serve)

## 가격 변경 시 주의

- **grandfather** — 기존 고객 유지 가격 (churn 방지)
- **migration window** — 30일 이상 사전 공지
- **value justify** — 가격 인상 시 새 기능/가치 동시 출시

## artifact 박제

`docs/{feature}/02-design/pricing-tier.md` (frontmatter: `owner: cbo`, `agent: pricing-analyst`, `artifact: pricing-tier`)
