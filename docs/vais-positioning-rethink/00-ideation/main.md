---
owner: ceo
artifact: main
phase: ideation
feature: vais-positioning-rethink
---

# vais-positioning-rethink — Ideation 인덱스

## Executive Summary

vais-code 의 정체성·범위·우선순위를 재정의하는 ideation. CC native 진화에 따른 redundancy 우려, 도큐먼트 비대화, target-app 컨텍스트 부재라는 3 화두에서 출발하여 **"부서장 매뉴얼 (organization-in-a-box)"** 이라는 새 정체성과 v0.66~v0.71 잠정 로드맵을 도출. 진행 중 ideation 컨텍스트 자체가 휘발되는 메타-부재가 드러나 v0.66 의 **M0 (Ideation Continuity)** 가 선결 과제로 추가됨.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-09 | vais-code 정체성 = "부서장 매뉴얼" organization-in-a-box (1 PO 가 부서장 역할을 할 때 부족한 다학제 도메인 지식·운영 매뉴얼·의사결정 패턴의 박제본) | CEO (ideation) | working-notes turn 5~6 |
| 2026-05-09 | "다학제 도메인 지식" 박제 깊이 = 부서장 OJT 매뉴얼 수준 (framework + 실무 운영 단계 + 의사결정 패턴 + 산출물 양식). framework 이름만 박제 = 위키수준, vais 가치 X | CEO (ideation) | working-notes turn 5 |
| 2026-05-09 | CTO 영역 슬림화 — 코드 산출 ceremony 는 CC native 양보, vais 의 CTO 는 *부서 운영 매뉴얼* 영역 (architecture decision/code review heuristics/test strategy/debugging method) 만 deeper 박제 | CEO (ideation) | working-notes turn 4~5 |
| 2026-05-09 | Target-app Bootstrap (B) 은 distribution 채널 — Knowledge Pack (M1) 이 충실해진 *후* 의미 있음. 우선순위 후순위 (v0.70+) | CEO (ideation) | working-notes turn 5~6 |
| 2026-05-09 | v0.66 첫 작업 = **M0 (Ideation Continuity) + M1 (Knowledge Pack 강화)**. M0 박힌 후 M1 콘텐츠 박제 진행 (self-application 으로 검증) | CEO (ideation) | working-notes turn 6~8 |
| 2026-05-09 | M0 메커니즘 = working-notes 자동 누적 (①) + Decision Record append-only (②) + 사용자 "체크포인트" 키워드 (③) + session-start 자동 복원 (④) | CEO (ideation) | working-notes turn 7 |
| 2026-05-09 | v0.66~v0.71 잠정 로드맵: M0 + M1 → M2 (Delegation Protocol) → M3 (문서 메타-가이드) → A (CTO 슬림화) → B (Target-app Bootstrap) → M4 (Cadence Automation) | CEO (ideation) | working-notes turn 6 |
| 2026-05-09 | 본 ideation 자체를 즉시 박제 — v0.66 M0 의 가장 강한 use case (self-application) 으로 활용. AskUserQuestion 회피·user 명시 요청에 응답하는 자발적 박제이며 ideation-guard 와 충돌 X | CEO (ideation) | working-notes turn 8 |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `00-ideation/main.md` | 인덱스 | 본 문서 — Decision Record + Next Phase |
| `00-ideation/working-notes.md` | 누적 로그 | turn 별 핵심 흐름 (세션 재개 컨텍스트 회복용) |

## CEO 판단 근거

본 ideation 은 ideation 모드 — `agents/ceo/ceo.md` 의 "CEO 진입 절차 v0.65.3" 4 단계 (algorithm 호출 → 7 차원 표 출력 → activeCLevel 인용 → AskUserQuestion) 의 **예외 모드** 로 진행. 사용자 발화는 알고리즘 매핑 가능한 단일 피처 요청이 아니라 *vais-code 자체의 정체성 재정의* 라는 메타-주제. 따라서 ideation-guard 의 "산출물 강제 X / C-Level 페르소나 자유 대화" 모드 적용.

본 박제는 ideation-guard "산출물 강제 금지" 와 충돌하지 않음 — 사용자 명시 요청 (*"내용 까먹을 거 같다"*, *"니가 추천을 해줘"*) 에 대한 응답으로, 템플릿 강제가 아닌 자발적 컨텍스트 보존. 오히려 ideation-guard "중단 복원" 항목이 의도하던 흐름.

## Next Phase

### v0.66 잠정 안건 (4 + M0 모듈)

| 모듈 | 역할 | 상태 |
|------|------|------|
| **M0. Ideation Continuity** | working-notes 자동 + Decision Record append + 체크포인트 키워드 + session-start 복원 | v0.66 선결과제 (turn 7 도출) |
| **M1. Knowledge Pack 강화** | 6 C-Level knowledge/ 디렉토리에 부서장 OJT 깊이로 framework + 실무 매뉴얼 + 의사결정 패턴 박제 (Tier-1 6 개 우선) | v0.66 본진 |
| M2. Delegation Protocol | CEO ↔ C-Level ↔ sub-agent 위임 시 컨텍스트/spec/검증 프로토콜 | v0.67 |
| M3. 문서 메타-가이드 | 산출물의 *왜/언제* 박제 (PRD vs RFC vs Decision Log) | v0.68 |
| A. CTO 슬림화 | CC native 분기점 정합 정리 | v0.69 |
| B. Target-app Bootstrap | knowledge 를 다른 앱으로 distribution | v0.70 |
| M4. 부서장 Cadence | 일/주/월/분기 cadence 자동 트리거 | v0.71+ |

### 권장 다음 단계

`/vais cpo plan vais-positioning-rethink` — CPO 에게 PRD 작성 위임. 범위 = M0 + M1 첫 sprint. PRD 가 정의해야 할 것:

- M0 4 메커니즘의 구체 구현 spec (working-notes 형식, Decision Record 트리거 조건, 체크포인트 키워드 목록, session-start hook 동작)
- M1 Tier-1 6 개 knowledge 박제 우선순위 (CEO Rumelt / CPO PRD writing / CTO system design / CSO OWASP / CBO JTBD VPC / COO incident playbook)
- 박제 깊이 기준 (3000~5000 자 / OJT 매뉴얼 수준 / 4 요소: framework + 실무단계 + 의사결정패턴 + 산출물양식)
- 사용자 페르소나 (1 PO = 본 사용자 자신 — dogfood 우선)
- 성공 기준 (M0: 세션 끊겨도 5 줄 요약으로 회복 가능 / M1: dogfood 시 vanilla CC plan 대비 차별화 입증)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — turn 1~8 ideation 핵심 박제. 사용자 명시 요청 ("니가 추천해줘") 에 따라 즉시 dogfood 박제 |
