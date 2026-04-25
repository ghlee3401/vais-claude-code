---
artifact: alignment-why-what
owner_agent: prd-writer
phase: alignment
canon_source: "Cagan 'Inspired' (2017) — outcome-based product spec + Torres OST + 'Empowered' product alignment + Marty Cagan four pillars (vision/objectives/teams/discovery)"
execution:
  policy: always
  intent: alignment-why-what
  prereq: [jobs-to-be-done, persona, prd, roadmap, opportunity-solution-tree]
  required_after: [alignment-what-how]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Alignment 단계 — Why (JTBD/Persona/VPC) ↔ What (PRD/Roadmap/OST) 정합성 매트릭스. PRD 가 Persona Pain/Gain 해소에 정확히 매핑되는지 검증."
---

# Alignment: Why ↔ What

> **canon**: Cagan *Inspired* (2017) — PRD outcome-based + persona-driven. Torres OST — Outcome → Opportunity → Solution 흐름. *Empowered* (2020) — strategy → objectives → outcomes alignment.
>
> **목적**: Why 단계 산출물 (JTBD / Persona / VPC) 이 What 단계 산출물 (PRD / Roadmap / OST / Lean Canvas / Hypothesis) 에 **모순 없이 흘러갔는가** 검증.

---

## 1. Alignment Matrix

| Why 산출물 | What 산출물 | 정합 점검 |
|------------|------------|----------|
| JTBD Core Job | PRD Section 3 (Users + Jobs) | PRD 의 Core Job 인용이 정확? |
| Persona Primary | PRD Section 3 (Primary Persona) | Persona 가 1차 타겟으로 명시? |
| VPC Pain (Extreme) | PRD Section 5 (Must Requirements) | 모든 Extreme Pain 이 Must 로 매핑? |
| VPC Gain (Required) | PRD Section 7 (Success Metrics) | Required Gain 이 측정 가능 metric? |
| JTBD Forces (Push/Pull > Anxiety/Habit) | PRD Pre-mortem | Forces 분석이 가능한 실패 시나리오 평가? |
| Persona Daily Workflow | PRD UX Section + OST Solution | Workflow 통증이 Solution 으로 이어짐? |
| OST Outcome | OKR (`prereq` of PRD) | OST 의 단일 Outcome 이 OKR Objective? |
| OST Opportunities | PRD Requirements Must/Should | Opportunity 가 우선순위와 매핑? |
| OST Solutions | PRD Section 4 (Solution Overview) | 채택된 Solution 이 PRD 에 반영? |
| OST Experiments | Hypothesis (Cagan 8 risk) | Experiment 가 risk category 에 매핑? |

## 2. Coherence Test (10 항목)

| # | 검증 질문 | Pass / Fail |
|:-:|---------|:---:|
| 1 | PRD 가 Primary Persona 1명 명시 (`persona.md` 참조)? | ☐ |
| 2 | PRD 의 Core Job 이 `jobs-to-be-done.md` Core Job Statement 와 일치? | ☐ |
| 3 | VPC 의 모든 Extreme Pain 이 PRD Must Requirements 로 매핑? | ☐ |
| 4 | VPC 의 모든 Required Gain 이 PRD Success Metric 으로 측정? | ☐ |
| 5 | OST 의 단일 Outcome 이 PRD 의 OKR 매핑 KR? | ☐ |
| 6 | OST 의 채택 Solution 이 PRD Section 4 에 반영? | ☐ |
| 7 | Hypothesis 의 8 risk 가 PRD Pre-mortem 에 검토? | ☐ |
| 8 | Roadmap Now Initiative 가 PRD Must 와 일치? | ☐ |
| 9 | PRD 의 "Won't" (OOS) 가 OST 의 거절 Solution 과 정합? | ☐ |
| 10 | PRD designCompleteness ≥ 80%? | ☐ |

## 3. Common Mismatches

| Mismatch 유형 | 발생 원인 | Resolution |
|--------------|---------|----------|
| PRD Must 에 VPC Pain 미매핑 | PRD 작성 시 VPC 미참조 | PRD 갱신 — 누락 Pain 의 Must 추가 |
| Persona 다중 → PRD 1차 명시 X | Cagan focus 위반 | Primary 1명 우선 + Secondary 분리 |
| OST Outcome 다중 → PRD OKR 정렬 X | Torres 1 outcome 위반 | OST Outcome 단일화 |
| Hypothesis risk 부재 | 8 category 일부 무시 | hypothesis.md 보강 → PRD Pre-mortem 재작성 |

---

## (작성된 sample)

### VAIS Code Plugin Why ↔ What Alignment

| Why | What | 정합 |
|-----|------|:---:|
| JTBD Core Job ("정전 출처 명시 산출물 30분 내") | PRD §3 (Top Pain "ChatGPT 산출물 신뢰 의심") | ✅ aligned |
| Persona P1 김지원 | PRD §3 Primary Persona (P1 김지원) | ✅ aligned |
| VPC Pain Extreme 5개 | PRD §5 Must (F1~F5: Profile/Template/Catalog/Audit/release 5분해) | ✅ 1:1 매핑 |
| VPC Gain Required ("30분 PRD") | PRD §7 KR1 ("Profile 게이트 95% 적중") + KR2 ("25 templates") | ✅ 측정 가능 |
| JTBD Forces (Push+Pull > Anxiety+Habit) | PRD Pre-mortem ("외부 인터뷰 부재 / over-engineering / overflow") | ✅ aligned |
| OST Outcome ("Activation Rate 50%") | OKR KR2 + KR5 (외부 인터뷰 5~7명) | ✅ aligned |
| OST Solutions (S1~S11) | PRD §4 Solution Overview (Profile + Catalog + clevel-coexistence) | ✅ aligned |
| Hypothesis 8 risk | PRD Pre-mortem 3 시나리오 (over-engineering / 외부 인터뷰 / overflow) | ⚠ partial — 5 risk (Ethical/Regulatory/Strategic Fit/Security 등) PRD 미반영 |
| Roadmap Now (Sprint 1~14 GA) | PRD Must F1~F8 | ✅ aligned |
| PRD designCompleteness 100% | (CPO QA SC-07 검증) | ✅ |

→ **9/10 aligned** (90%) + 1 partial (Hypothesis 8 risk → PRD Pre-mortem 5 누락). Resolution: PRD v2.0 갱신 시 8 risk 모두 명시.

---

## 작성 체크리스트

- [ ] Alignment Matrix 10+ cell 모두 평가?
- [ ] **Coherence Test 10 항목** 모두 Pass / Fail?
- [ ] Common Mismatches 4 유형 검토?
- [ ] **75% 임계 (8/10 cell aligned)** 충족?
- [ ] Mismatch 발견 시 Resolution + 갱신 우선순위 명시?
- [ ] PRD designCompleteness 80%+ 충족?

---

## ⚠ Anti-pattern

- **PRD-first**: Why 단계 부재로 PRD 작성 → Persona/JTBD 부재. Cagan 명시 경고.
- **Persona 다중**: PRD 가 "모든 사용자" 대상 — focused X. Primary 1 + Secondary 1 강제.
- **OST 단절**: PRD 가 OST 의 Solution 무관 — Discovery 무력화.
- **VPC Pain 일부만**: Extreme Pain 의 50% 만 Must — 가치 누락. 100% 매핑 강제.
- **Hypothesis 누락**: PRD Pre-mortem 이 8 risk 일부만 검토 — Cagan 8 risk 모두 강제.
- **Won't 부재**: PRD 가 OOS 명시 X — scope creep 위험.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 14. Cagan Inspired + Empowered + Torres OST 정전. Alignment Matrix 10+ + Coherence Test 10 + Common Mismatches + sample (VAIS 9/10 aligned + 1 partial → Resolution) + checklist 6 + anti-pattern 6 |
