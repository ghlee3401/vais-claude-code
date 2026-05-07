# Data Analysis (CTO QA/분석 단계)

QA/분석 단계에서 제품 메트릭 검증 시 활용하는 프레임워크.

## SQL 패턴

| 메트릭 | 쿼리 패턴 |
|--------|----------|
| DAU/MAU | `COUNT(DISTINCT user_id)` by date |
| Retention N-day | `DATEDIFF(event_date, first_seen)=N` cohort join |
| Funnel | 단계별 `COUNT(DISTINCT user_id)` + 전환율 |
| Revenue | `SUM(amount)` by segment + MRR/ARR |

## Cohort Analysis

1. 가입 주/월 기준 그룹화
2. 리텐션률·ARPU·기능 사용률 측정
3. 코호트 테이블 (행=코호트, 열=기간)
4. 이상치 → 제품 변경 시점 대조

## A/B Test

**Sample Size**: `n = (Z²α/2 × 2 × p × (1-p)) / MDE²` (80% power, 95% CI)

**기간**: 최소 1-2 business cycle (novelty effect 제거)

**메트릭**: Primary Metric + Guardrail Metrics 동시 추적

**판정**:
| 결과 | 액션 |
|------|------|
| 양의 리프트 + guardrail 정상 | Ship |
| 양의 리프트 + guardrail 하락 | 트레이드오프 분석 |
| 비유의미 + 양의 추세 | 연장 |
| 비유의미 + 플랫 | 종료 |
| 음의 리프트 | 배포 금지, 원인 분석 |
