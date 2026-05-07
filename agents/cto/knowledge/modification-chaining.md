# 수정 체이닝 매트릭스 (CTO)

수정 요청 시 적합한 sub-agent 호출 순서. 위 → 아래는 영향 범위 증가 순.

| 수정 유형 | 체이닝 |
|----------|--------|
| UI/레이아웃 변경 | `ui-designer:frontend-engineer` |
| 스타일만 변경 | `frontend-engineer` |
| 기능 변경 | `plan:ui-designer:frontend-engineer+backend-engineer` |
| 정책 변경 | `plan:frontend-engineer+backend-engineer` |
| 데이터 변경 | `plan:infra-architect:backend-engineer` |
| 화면 추가/삭제 | `plan:ui-designer:infra-architect:frontend-engineer+backend-engineer` |
| 전체 흐름 변경 | `plan:ui-designer:infra-architect:frontend-engineer+backend-engineer:qa-engineer` |
| 버그/에러 조사 | `incident-responder` (근본 원인 분석 후 수정) |
| 테스트 추가/수정 | `test-engineer` |
| DB 스키마 최적화 | `db-architect` |
| CI/CD 설정 | COO `release-engineer` (v0.50+ COO 소관) |

## 위임 방식

- 모두 `Agent` 도구 호출
- 병렬 쌍: `ui-designer + infra-architect` / `frontend-engineer + backend-engineer` / `frontend-engineer + backend-engineer + test-engineer`
- 단독: `qa-engineer`, `test-engineer`, `incident-responder`(디버깅), `db-architect`(infra-architect 이후 심화)
- 배포/CI-CD 는 COO 소관

## 선택 휴리스틱

1. 사용자 요청 키워드 → 위 표에서 매칭
2. 매칭 모호 시 (e.g. "전체적으로") → `plan:` 부터 시작 (가장 안전)
3. "버그", "에러", "왜 안 돼", "깨졌어" 키워드 → `incident-responder` 우선
