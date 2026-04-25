---
artifact: okr
owner_agent: okr-author
phase: core
canon_source: "Grove 'High Output Management' (1983), Random House + Doerr 'Measure What Matters' (2018), Portfolio"
execution:
  policy: always
  intent: goal-setting
  prereq: [strategy-kernel]
  required_after: [roadmap]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Core 단계 세 번째 산출물 — 전략을 분기·반기 단위 측정 가능한 목표로 변환. Strategy Kernel 의 Guiding Policy 가 OKR 의 Objective 로, Coherent Actions 가 Key Results 로 흘러야 함."
---

# OKR (Objectives + Key Results)

> **canon**: Andy Grove (Intel CEO, 1971) 가 "MBO" 를 변형해 OKR 도입 → *High Output Management* (1983). John Doerr (Kleiner Perkins) 가 Google·Intuit 등에 전파 → *Measure What Matters* (2018) 에서 체계화.
>
> **원칙 (Doerr)**:
> - **Objective** = 질적·영감적·시간 한정 (1 분기 또는 1 반기). 수치 X.
> - **Key Result** = 측정 가능한 결과 (수치 또는 binary). **활동 (activity) 이 아닌 결과 (outcome)**.
> - **계약 검증**: "KR 전부 달성 = O 자동 달성" 인지 논리적 일관성 필수.

---

## OKR 세트

**기간**: YYYY-QN (예: 2026-Q2)
**팀/제품**: ______

### Objective

> [영감적이고 질적인 목표 — 1 문장. 분기 내 팀이 집중할 방향. 수치 포함 X]

### Key Results

| # | Key Result | 기준치 (Baseline) | 목표치 (Target) | 타입 | 담당 |
|:-:|------------|:------:|:------:|:----:|:----:|
| KR1 | ... | ... | ... | 수치 / binary | ... |
| KR2 | ... | ... | ... | 수치 / binary | ... |
| KR3 | ... | ... | ... | 수치 / binary | ... |

> **scoring 가이드 (Doerr)**:
> - **1.0** = 목표 초과 달성 (예상치 못한 결과 — sandbagging 의심)
> - **0.7** = stretch 목표 달성 (적절한 성공 — 분기 평균 목표)
> - **0.5** = 기대 이하 (다음 분기 학습 필요)
> - **0.3 이하** = 실패 (목표 자체 재검토)
>
> **warning**: 매 분기 평균이 1.0 이면 목표가 너무 낮다 (Google 권고: 평균 0.6~0.7 stretch)

---

## (작성된 sample)

**제품**: VAIS Code | **기간**: 2026-Q2 (4월~6월)

### Objective

VAIS sub-agent 의 "default-execute" 패턴을 해소하여, 사용자가 "쓸데없이 만들어진" 산출물 마찰 없이 신뢰 가능한 AI C-Suite 를 경험한다.

### Key Results

| # | Key Result | 기준치 | 목표치 | 타입 | 담당 |
|:-:|------------|:------:|:------:|:----:|:----:|
| KR1 | Project Profile 게이트 — Scope 정책 skip 적중률 (수동 검증 vs 게이트 결과 일치율) | 0% (게이트 부재) | ≥ 95% | 수치 | CTO |
| KR2 | 우선 25 개 template (depth c) 완성 — sample + checklist + anti-pattern | 0/25 | 25/25 | 수치 | CTO + CPO |
| KR3 | 44 sub-agent Q-A/B/C/D 4 기준 점검 매트릭스 작성 + 통과 | 0/44 | 44/44 | binary | qa-engineer |
| KR4 | alignment α 메트릭 70%+ 감지율 검증 (EXP-4) | 미측정 | ≥ 70% | 수치 | CTO |
| KR5 | 외부 사용자 5~7 명 인터뷰 (RA-1 100% 검증) | 0 명 | 5~7 명 | 수치 | CPO/ux-researcher |

→ **계약 검증**: KR1~KR5 가 모두 달성되면 Objective ("default-execute 해소 + 신뢰 가능한 C-Suite 경험") 가 자동 달성되는가? KR1 = 게이트 작동 / KR2 = 산출물 표준 / KR3 = sub-agent 점검 / KR4 = alignment 측정 / KR5 = 사용자 검증 — 5 개 합집합이 Objective 의 정의를 충족.

---

## 작성 체크리스트

- [ ] Objective 가 영감적이고 질적인가? (수치 포함 X — "10% 향상" 같은 표현 금지)
- [ ] 모든 KR 이 측정 가능한 수치 또는 binary 결과인가? (활동 아닌 outcome)
- [ ] "KR 전부 달성 = O 자동 달성" 논리적 일관성을 검증했는가?
- [ ] KR 수가 3~5 개 범위인가? (2 개 이하 = 단순 / 6 개 이상 = 집중 희석)
- [ ] leading KR (선행지표) 과 lagging KR (결과지표) 이 혼합되어 있는가?
- [ ] 각 KR 의 기준치 (Baseline) 와 목표치 (Target) 가 명시되어 있는가?
- [ ] Scoring 가이드 (0.7 = 성공) 를 팀이 합의했는가?
- [ ] Strategy Kernel (`prereq`) 의 Guiding Policy 와 Objective 가 정렬되는가?

---

## ⚠ Anti-pattern

- **Activity KR**: "회의 10 회 진행" / "스펙 5 개 작성" — 활동 (input) 이지 결과 (outcome) 아님. 변환: "→ 회의로 의사결정 10 건 완료" / "→ 5 개 스펙 중 3 개 출시". Doerr 명시 경고.
- **부드러운 KR**: "고객 만족도 향상" / "성능 개선" — 측정 불가능한 모호한 표현. 구체화: "NPS 30 → 50" / "P95 latency 200ms → 100ms".
- **O 가 사실은 KR**: "매출 1 억 달성" / "DAU 10 만" — 이는 KR 이지 Objective 아님. Objective 는 "팀이 자랑스러워할 시장 위치 확보" 같은 질적 방향. 수치 목표는 그 아래 KR 로 분해.
- **Cascading 강제**: 회사 OKR 을 부서·개인까지 기계적으로 cascade — Doerr 와 Google 모두 권장 X. **Cascading is dangerous** — 하부 팀이 상부 KR 의 부분집합만 작성하면 자율성·창의성 상실.
- **Sandbagging**: 매 분기 1.0 달성하는 OKR — 실은 stretch 가 부족. Google 권고: 평균 0.6~0.7 이 정상. 1.0 연속 = 목표 재설정 신호.
- **분기 후 Forget**: 분기 시작 시 작성하고 끝까지 안 봄 — Weekly check-in (Doerr CFRs: Conversation·Feedback·Recognition) 없으면 OKR 은 단순 문서.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 3. design `_tmp/infra-architect.md` §6.3 draft 정식 이관 + Grove 정전 출처 추가 + Cascading/Sandbagging anti-pattern 추가 (3→6 확장) + 계약 검증 단락 + KR5 (외부 인터뷰) 추가 |
