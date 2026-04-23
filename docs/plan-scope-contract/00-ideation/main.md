# Ideation Summary: CEO / plan-scope-contract

> 진행일: 2026-04-22
> 진행자 C-Level: CEO
> 소요 대화 turns: 5
> Status: summarized

---

## Key Points

- **비용 병목은 토큰이 아니라 재작업 사이클**. "작은 수정에 비용 크다"는 불만의 원인은 plan phase 에서 agent 가 사용자 요청 범위를 자발적으로 확장하고, 사용자가 "다시 짜"로 거절하는 사이클.
- **구체 사례 (GA 이벤트)** — 사용자가 "GA 이벤트 2개에 대해 데이터 긁어와서 메뉴 만들라" 지시 → CTO plan agent 가 "GA 이벤트 전체 스캔 + 문제점 확인 + 수정"까지 포함한 plan 을 제안 → 재지시 필요.
- **Rule 간 긴장** — Rule #9 (Boil the Lake) 가 "명시된 lake 안에서 완전" 이라는 원 의도와 달리 "AI 가 lake 를 확장해도 된다"는 허가로 agent 에게 오독됨. Rule #11 (User Sovereignty) 와 충돌.
- **구조적 고장이 아니라 default 값 오류** — 사용자가 한 번 "다시 짜" 하면 agent 가 즉시 scope 좁혔음. 즉 agent 는 지시를 따르는데, 기본 mental model 이 "확장 권장" 쪽으로 기울어 있음.
- **"좋은 아이디어"는 배출구가 필요** — scope 를 좁히면서도 agent 의 자발적 관찰(품질 리스크 발견 등)을 버리지 말아야 함. 별도 `관찰(후속 과제)` 섹션 필요.
- **CEO triage gate 는 지금은 과함** — rail 을 추가하는 방향이라 사용자 원문 불만("비용 크다")과 역방향. 1+2+a 가 미작동할 때 꺼낼 안전망으로 기록.

## Decisions

**In-scope (이번 피처에 포함)**

1. **Minimum Viable Plan default 주입** — CTO plan agent prompt 에 "사용자가 명시한 것 + 기술적 전제조건만. 품질 리스크는 `관찰(후속 과제)` 섹션에만 기록" 규약 추가.
2. **Scope Contract 3섹션 의무화** — `docs/{feature}/01-plan/main.md` 맨 앞에 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 고정. validator 에서 누락 시 warn.
3. **Rule #9 재기술** — CLAUDE.md Rule #9 의 "Boil the Lake" 를 "Lake 는 사용자가 지정한다. AI 는 Lake 를 확장하지 않는다. Ocean(자발적 확장) 후보는 `관찰` 섹션에 기록만 한다" 로 1줄 추가.
4. **(권장) Scope Contract 공통 템플릿 승격** — plan / design / do 공통 헤더로 템플릿 통합. 각 phase 재발 방지.

**Out-of-scope (별도 피처 후보 — 지금은 넣지 않음)**

- **CEO triage gate** (의무/선택 helper 중 하나) — 1+2+a 효과 관찰 후 여전히 scope creep 발생 시 재검토.
- **관찰/후속 과제 섹션 자동 승계 차단 규약** — 다음 phase 가 관찰 항목을 scope 로 자동 흡수하는 "지연된 scope creep" 감지 후 도입.

## Open Questions

- **Scope Contract 섹션 위반 시 doc-validator 동작** — warn 인가 error 인가? plan phase 에서 hard fail 이면 사용자 흐름이 끊길 수 있음. plan phase 기본 정책(`workflow.subDocPolicy.enforcement=warn`) 일관성 고려 필요.
- **1+2+a 효과 측정 방법** — scope creep 재발 여부를 어떻게 감지할 것인가? 재작업 카운트? event log? 사용자 만족도?
- **타 C-Level 적용 범위** — CPO prd-writer / CBO market-researcher 등 본질적으로 탐색형 agent 에도 동일 규약을 즉시 적용할지, CTO 만 먼저 시범 적용 후 관찰할지.
- **기존 plan 문서 역호환** — 템플릿 변경 시 기존 피처들의 01-plan/main.md 를 마이그레이션할지, 신규 피처부터만 적용할지.

## Next Step

- C-Level: **CPO**
- Phase: **plan**
- 이유: 이 피처는 agent prompt + 문서 규약 변경이 핵심이므로, 코드 구현 전에 CPO 가 **PRD / 수용 기준 / 성공 지표(scope creep 재발률 등)** 를 먼저 정의해야 이후 CTO 가 무엇을 바꾸고 어떻게 검증할지 명확해진다. CTO 는 CPO plan 산출 후 design 단계로.

---

## Raw Context

**문제 제기 (첫 turn)**
> "현재 vais-code를 쓰면 작은 부분 고치는데도 너무 큰 코스트가 들어가는 것 같아"

**구체 사례 (2nd turn)**
> "아까 CTO한테 GA 이벤트에 대해서 이벤트 2개에 대해서 데이터 긁어와서 메뉴 만들라고 했는데 이것저것 막 자기 마음대로 GA이벤트 전체를 스캔해서 문제점이 있는지 확인하고 수정하겠다고 plan을 짜는거야. 그래서 plan을 다시 짜라 했어."

**재지시 결과 (3rd turn)**
> "다시 짜 라고 하니까 scope을 좁혀서 짜줬어. 1+2번이 괜찮을거 같은데? 그것만으로 될까?"

**CEO triage gate 평가 요청 (4th turn)**
> "그런데 3이 있으면 좋다는거야 나쁘다는거야?"
→ "아이디어 자체는 좋지만 지금 도입하면 rail 중첩으로 역효과. Out-of-scope 로 기록"

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> Ideation 단계 topic 합성은 선택. 이 이데이션은 대화 turns 5회로 main.md 단일 문서로 충분하여 topic 분리 미사용.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| (없음) | — | main.md 단일 문서 | — |

## Scratchpads (v0.57+)

> CEO 페르소나 직접 대화로 진행. Sub-agent 미위임.

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (없음) | `_tmp/` 비어 있음 | — | — |

<!-- v0.57 subdoc-section end -->

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — CEO ideation 5 turns 요약, plan-scope-contract 피처 정의 |

<!-- template version: v0.58.0 -->
