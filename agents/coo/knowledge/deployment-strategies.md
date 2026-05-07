# Deployment Strategies (COO)

release-engineer + sre-engineer 가 사용. 배포 전략 선택 기준.

## 전략 매트릭스

| 전략 | 다운타임 | 복잡도 | 적합 |
|------|---------|--------|------|
| **Recreate** | 있음 | 매우 낮음 | 개발/스테이징, 다운타임 허용 |
| **Rolling** | 0 | 낮음 | 일반 production, hotfix |
| **Blue-Green** | 0 | 중간 | 빠른 rollback 필요, 스테이트풀 |
| **Canary** | 0 | 높음 | 대규모 production, 점진 검증 |
| **Shadow** | 0 | 매우 높음 | A/B 또는 critical path 검증 |

## 선택 휴리스틱

```
사용자 < 1k         → Rolling
사용자 1k-100k      → Blue-Green or Canary
사용자 > 100k       → Canary (10% → 50% → 100%)
DB schema 변경 동반 → Blue-Green 권장 (rollback 용이)
breaking change 위험 → Canary + auto-rollback (release-monitor)
```

## Rollback 절차 (필수)

1. **트리거 정의** — 에러율 > 5% 또는 p99 > 5s 또는 수동
2. **자동 rollback** — release-monitor 가 5분 윈도우 metric 감지 시
3. **수동 절차** — `/vais coo {feature} --rollback`
4. **DB 호환성** — backward-compatible migration 필수 (예: column drop 은 다음 release 로)

## Canary 단계

| Phase | 트래픽 비율 | 모니터링 윈도우 | 통과 기준 |
|-------|------------|----------------|----------|
| 1 | 5% | 1시간 | 에러율 동등, p99 동등 |
| 2 | 25% | 4시간 | 동일 |
| 3 | 50% | 24시간 | 동일 |
| 4 | 100% | — | 통과 시 완료 |

## artifact 박제

- `docs/{feature}/02-design/deployment-architecture.md`
- `docs/{feature}/03-do/runbook.md` (rollback 절차 포함)
