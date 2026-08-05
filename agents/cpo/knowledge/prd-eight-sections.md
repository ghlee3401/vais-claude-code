# PRD 8 섹션 표준 (CPO)

현재 PRD 정본은 `docs/{feature}/01-plan/prd.md` artifact 이다. 이 문서는 CPO 가 PRD 를 작성하거나 QA 할 때 사용하는 8개 섹션 품질 기준이며, `designCompleteness` 판단의 기준선으로 사용한다 (vais.config.json > gates.defaults.designCompleteness = 80).

## 섹션 매트릭스

| # | 섹션 헤딩 (한/영 둘 다 허용) | 판정 패턴 |
|---|-------------------------|-----------|
| 1 | `## 1. Summary` / `## 요약` | 개요 80자 이상 |
| 2 | `## 2. Contacts` / `## 담당` / `## 연락처` | 담당자·이해관계자 |
| 3 | `## 3. Background` / `## 배경` | 문제 정의·왜 |
| 4 | `## 4. Objective` / `## 목표` | SMART 목표 |
| 5 | `## 5. Market Segment` / `## 대상` | 타겟 페르소나·TAM/SAM/SOM |
| 6 | `## 6. Value Proposition` / `## 가치 제안` | JTBD + 차별점 |
| 7 | `## 7. Solution` / `## 기능` | 기능 리스트·MVP 범위 |
| 8 | `## 8. Release` / `## 출시` | 로드맵·Go/No-Go |

## Threshold

`designCompleteness >= 80` (= 유효 섹션 6.4/8 이상)

내용이 짧으면 "빈 섹션" 으로 감점. **각 섹션 최소 1~2 단락 작성 필수**.

## 작성 가이드

- §1 Summary: 한 줄 핵심 + 3 bullet (Problem/Solution/Effect)
- §2 Contacts: PO / 엔지니어 리드 / 디자이너 / 이해관계자
- §3 Background: 문제 발생 맥락 + 데이터 (가능하면)
- §4 Objective: SMART (Specific/Measurable/Achievable/Relevant/Time-bound)
- §5 Market Segment: 페르소나 1-3개 + 시장 규모 (TAM/SAM/SOM 추정)
- §6 Value Proposition: JTBD 6-Part — 상황/모티베이션/목표/방해/대안/차별점
- §7 Solution: Must/Nice 기능 분리. MVP 명확히 표기
- §8 Release: 로드맵 (마일스톤) + Go/No-Go 기준
