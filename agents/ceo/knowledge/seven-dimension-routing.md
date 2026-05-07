# CEO 7-Dimension Dynamic Routing (CEO)

CEO 가 ideation 단계에서 적용하는 7 차원 빈틈없는 판단 알고리즘. 정본: `lib/ceo-algorithm.js`.

## 7 차원

| # | 차원 | 등급 | 활성 C-Level / artifact |
|---|------|------|------------------------|
| 1 | **security** | none / low / medium / high | medium+ → CSO threat-model + security-audit |
| 2 | **compliance** | none / required | required → CSO compliance-report |
| 3 | **ux** | none / low / medium / high | medium+ → CPO persona + CTO ui-flow |
| 4 | **dataModel** | none / low / medium / high | medium+ → CTO data-model |
| 5 | **externalAPI** | none / low / medium / high | medium+ → CTO api-contract + CSO dependency-vulnerability |
| 6 | **performance** | none / low / medium / high | high → COO performance-engineer (secondary, 명시 호출만) |
| 7 | **productDefinition** | low / medium / high | high → CPO 풀스택 (jtbd / tam-sam-som / opportunity-solution-tree / value-proposition-canvas) |

## 동작 흐름

1. CEO ideation (`docs/{feature}/00-ideation/ideation-decision.md`) 에서 사용자 요청 분석
2. 7 차원 각각 등급 매김 (none / low / medium / high)
3. `phaseArtifactMapping` (vais.config.json) 의 conditional artifact 활성화 결정
4. 결과를 AskUserQuestion 클릭 인터페이스로 사용자에게 제시
5. 승인 시 자동 phase 진행

## 의존성 (참고, hard constraint 아님)

```
CTO → CPO    (제품 정의 필요)
CSO → CTO    (구현물 필요)
COO → CTO    (구현물 필요)
CBO         (의존 없음)
```

CEO 가 컨텍스트에 따라 유연 판단. 사용자가 `/vais cbo|coo` 로 명시 호출 시 secondary 활성.

## 판단 우선순위

1. 핸드오프 이슈 → 해당 C-Level 최우선 (예: CSO→CTO 수정 루프)
2. 필수 의존성 미충족 → 전제 C-Level 먼저
3. 피처 성격 기반 필요성만 추천
4. 이미 완료된 C-Level 제외 (재실행은 사용자 명시만)
5. 모든 필요 완료 → 최종 리뷰 또는 종료

## CSO ↔ CTO 반복 루프

CEO 가 CSO 추천 → CSO 가 CTO 구현물 검토 → (이슈 없음) CEO 통과 보고 / (이슈 있음) CEO → CTO 수정 지시 → CTO 수정 → CSO 재검토.
- v0.65: `pipeline.reviewLoops.cso-cto.maxIterations = 2` (v0.64=3 에서 감소)
- 2회 후 미해결 → incident-responder 호출 → 사용자 에스컬레이션
