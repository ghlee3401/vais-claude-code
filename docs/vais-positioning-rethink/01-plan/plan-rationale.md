---
owner: cpo
artifact: plan-rationale
phase: plan
feature: vais-positioning-rethink
---

# Plan Rationale — vais-positioning-rethink (v2.0 Lean)

> CPO 의 Plan phase 분석. Lean Rewrite 후 80 줄 목표. PRD 입력 자료.

## 요청 원문

> "vais-code 의 정체성을 다시 정의하고, 부서장 OJT 매뉴얼 (도메인 지식 박제) 을 통해 가상 C-Suite 조직을 운영하는 organization-in-a-box 로 포지셔닝. M0 (Ideation Continuity 4 메커니즘) + M1 Tier-1A Knowledge Pack (CEO Rumelt + CPO PRD OJT + CTO Architecture Decision) 박제." (사용자 ideation turn 5 발화 — workflow-contract-alignment 정렬 시점 retroactive backfill, 2026-05-13)

## In-scope

- vais-code 정체성 재정의 (organization-in-a-box / 부서장 매뉴얼) + CLAUDE.md 명시
- M0 4 메커니즘 (status.js helpers / llm-heuristic / m0-record-turn / stop-handler / checkpoint-keyword hook)
- M1 Tier-1A 3 박제 (CEO Rumelt 6,819자 / CPO PRD OJT 6,675자 / CTO Architecture Decision 11,690byte)
- manual @include Knowledge Index (H4 PoC 결과 — autonomous lazy-load 미동작 으로 manual 채택)

## Out-of-scope

- M1 Tier-1B (CSO/CBO/COO 박제) — v0.67+ 외부 contributor 또는 사용자 직접 학습 후 박제. v0.66 = Tier-1A 만.
- 팀/기업 페르소나 (v0.70+)
- Target-app Bootstrap (v0.67+)

## §1. 기회 + 부재 갭 (압축)

사용자 turn 5 발화 — 부서장 7 영역 (기획/운영/전략/PM/문서/팀원지시/개발) 의 다학제 도메인 지식 부재. vanilla CC 는 코드 영역만 — 비-코드 부서장 영역 비어있음.

**부재의 핵심**: framework 이름만 박제, OJT 매뉴얼 깊이 없음 + 문서 메타·위임 프로토콜 부재.

## §2. v0.66 Sprint Scope (Lean — Tier-1A 만)

### M0 — Ideation Continuity (4 메커니즘)

| 메커니즘 | 설명 |
|---------|------|
| ① working-notes 자동 누적 | 매 turn LLM 휴리스틱 → 1~3 줄 append |
| ② Decision Record append | 결정 키워드 → main.md 표 |
| ③ "체크포인트" 키워드 (Should) | 부분 정리 + 세션 유지 |
| ④ session-start 자동 복원 | in-progress 감지 + 5 줄 요약 |

### M1-A Tier-1A (3 개, 자기 도메인)

| Framework | 사용자 친숙도 |
|-----------|------------|
| CEO Rumelt Strategy Kernel | 상 (vais-code dogfood 으로 친숙) |
| CPO PRD Writing OJT (8 섹션) | 상 (현재 PRD 작성자) |
| CTO Architecture Decision (5 단계 + ADR) | 상 (코드 작업 일상) |

### Tier-1B 이동 (v0.67+)

CSO OWASP+GDPR / CBO Financial Modeler / COO Incident Playbook = 사용자 도메인 부재 → LLM-generated trap 회피. 외부 contributor 또는 사용자 직접 학습 후 박제.

### 박제 깊이 = OJT 4 요소

(1) Framework 정의 (2) 실무 운영 단계 (3) 의사결정 패턴 (4) 산출물 양식.

## §3. 페르소나 (1 차만 명시)

**1 차 — 본 사용자 (1 PO, dogfood)**:
- Pain: 부서장 7 영역 모두 혼자 결정. 다학제 도메인 부재
- JTBD: 도메인 친구 시뮬레이션
- 효용: 결정 시간 단축 + 추적성 + OJT 깊이

> 2 차 (외부 1 PO/founder), 3 차 (팀/기업) = v0.67+ scope. 본 sprint 외.

## §4. 성공 기준 (KR 5, 객관)

PRD §3 Objective 참조. 핵심:
- KR1 M0 5 분 회복 1 회 입증
- KR2 M1-A 3 파일 + OJT 4 요소 통과
- KR3 dogfood A/B 객관 (박제 keyword 5+ grep)
- KR4 CLAUDE.md 정체성 1 줄
- KR5 CHANGELOG + tag

## §5. 리스크 (핵심 2)

| ID | 리스크 | 완화 |
|----|--------|------|
| R-1 | M1-A 박제 LLM-generated 수준 (OJT 깊이 부족) | "내가 막혔던 실제 경험" 1~2 개 명시 삽입 의무 + 1 framework × 4 시간 hard limit |
| R-3 | H4 lazy-load PoC FAIL | manual `@include` 즉시 fallback (PRD §5 참조) |

## §6. PRD 진입 컨텍스트

prd-writer 호출 시 입력:
- 본 plan-rationale (전체)
- ideation main.md + working-notes
- v0.66 Tier-1A 3 framework
- KR 5 (객관)
- R-1, R-3 (핵심)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 6 섹션 통합 (186 줄) |
| v2.0 | 2026-05-09 | **Lean Rewrite** — Tier-1B v0.67 이동, AC 13→5, R 5→2, 페르소나 1 차만, 중복 제거. 186 → ~80 줄 |
