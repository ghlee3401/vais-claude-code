# Unit Economics Formulas (CBO)

unit-economics-analyst 가 사용. SaaS / consumer / marketplace 공통.

## 핵심 공식

| 메트릭 | 공식 | 설명 |
|--------|------|------|
| **CAC** (Customer Acquisition Cost) | (Sales + Marketing 비용) / 신규 고객 수 | 채널별 분리 권장 |
| **LTV** (Lifetime Value) | ARPU × Gross Margin × (1 / Churn rate) | 월간 기준 시 monthly churn 사용 |
| **LTV/CAC ratio** | LTV / CAC | 건전성: ≥ 3x |
| **CAC Payback** | CAC / (ARPU × Gross Margin) | 회수 기간 (개월) — 12개월 이하 권장 |
| **Gross Margin** | (Revenue - COGS) / Revenue | SaaS 70%+, marketplace 20-40% |
| **Net Dollar Retention** | (Starting MRR + Expansion - Churn - Downgrades) / Starting MRR | 100%+ = 건전 |

## QA 기준 (vais.config.json > workflow > QA phase)

| 기준 | Threshold | 액션 |
|------|----------|------|
| LTV/CAC | ≥ 3x | 미달 시 unit economics 재설계 |
| CAC Payback | ≤ 12개월 | 초과 시 acquisition 채널 재검토 |
| Gross Margin | SaaS ≥ 70%, marketplace ≥ 25% | 미달 시 pricing 재설계 |
| NDR | ≥ 100% | 미달 시 churn 분석 |

## Cohort Analysis

1. 가입 주/월 기준 그룹화
2. 코호트별 retention curve + LTV curve
3. payback period (코호트별 누적 revenue = CAC 시점)
4. M3, M6, M12 retention 추적 (M3 < 50% = 위험)

## SaaS 메트릭 추가

| 메트릭 | 공식 |
|--------|------|
| MRR | 월간 반복 매출 |
| ARR | MRR × 12 |
| ARPU | MRR / 활성 사용자 수 |
| Quick Ratio | (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR) — 4+ = 건전 |

## Do 문서 작성 형식

```
## 비즈니스 요약
- SEO 점수: 85/100
- 비용: CAC $45/유저
- 수익: ARPU $12/월
- ROI: 3개월 회수
```

auto-judge 파싱: 3개 키워드 (`비용`/`수익`/`ROI`) 모두 언급 + SEO 점수 숫자 명시.
