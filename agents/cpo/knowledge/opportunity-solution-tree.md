# Opportunity Solution Tree (CPO)

Teresa Torres 의 Opportunity Solution Tree (OST) 프레임워크. product-discoverer 가 사용.

## 구조

```
Outcome (성과)
  ├── Opportunity 1 (사용자 니즈)
  │   ├── Solution 1A
  │   ├── Solution 1B
  │   └── Solution 1C
  ├── Opportunity 2
  │   ├── Solution 2A
  │   └── Solution 2B
  └── Opportunity 3
      └── Solution 3A
```

## 각 레이어

| 레이어 | 정의 | 출처 |
|--------|------|------|
| Outcome | 비즈니스 목표 (예: "활성 사용자 +20%") | CEO 전략 / OKR |
| Opportunity | 사용자 니즈 또는 페인포인트 | 사용자 인터뷰 / 행동 데이터 |
| Solution | 가능한 제품 변경 | 팀 아이디어 (broad first, narrow later) |
| Experiment | 솔루션 검증 방법 | A/B 테스트 / prototype |

## 사용 휴리스틱

1. Outcome 1개로 시작 (CEO/OKR 에서 가져옴)
2. 사용자 인터뷰 N=5+ 로 Opportunity 도출 (가설 X, 발견 O)
3. Opportunity 별 3-5개 Solution brainstorm (수렴 X, 발산 O)
4. Solution 별 1개 Experiment 설계
5. 검증 후 매트릭스 갱신 (winner Opportunity 우선 투자)

## 결합 가능 도구

- JTBD 6-Part (`jtbd-6-part.md`) — Opportunity 정의 시
- PRD 8 섹션 (`prd-eight-sections.md`) — winner Solution 을 §7 에 박제

## Anti-pattern

- ❌ Opportunity 없이 Solution 부터 시작 (생산자 함정)
- ❌ Experiment 없이 Solution 배포 (검증 누락)
- ❌ Outcome 여러 개 한 트리에 (산만)
