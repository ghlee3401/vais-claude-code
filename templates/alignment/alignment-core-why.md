---
artifact: alignment-core-why
owner_agent: strategy-kernel-author
phase: alignment
canon_source: "Cagan 'Empowered' (2020) — Strategy Alignment + Marty Cagan 'Inspired' (2017) Ch.6 Vision Coherence + Christensen JTBD Theory"
execution:
  policy: always
  intent: alignment-core-why
  prereq: [vision-statement, strategy-kernel, jobs-to-be-done, persona]
  required_after: [alignment-why-what]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Alignment 단계 — Core (Vision/Strategy) ↔ Why (PEST/Five Forces/SWOT/JTBD/Persona/VPC) 정합성 매트릭스. 두 phase 의 결정이 일치하는지 체크. review_recommended=true: alignment 부재 시 후행 PRD/Roadmap 표류."
---

# Alignment: Core ↔ Why

> **canon**: Cagan *Empowered* (2020) — strategy alignment + four pillars. *Inspired* (2017) Ch.6 — vision/strategy coherence test. Christensen JTBD theory — Job 이 Vision 의 customer outcome 인지 검증.
>
> **목적**: Core 단계 산출물 (Vision Statement / Strategy Kernel / OKR / PR-FAQ / 3-Horizon) 이 Why 단계 산출물 (PEST / Five Forces / SWOT / JTBD / Persona / VPC) 와 **모순 없이 정렬** 되었는가 자동 검증.

---

## 1. Alignment Matrix

| Core 산출물 | Why 산출물 | 정합 점검 |
|------------|-----------|----------|
| Vision (BHAG) | JTBD Core Job | BHAG 가 customer Job 완수의 외연인가? |
| Vision (Core Values) | Persona (Goals) | Values 가 Persona 의 Life/Experience Goal 과 정렬? |
| Strategy Kernel (Diagnosis) | PEST + Five Forces | 외부 환경 인식이 Diagnosis 와 일치? |
| Strategy Kernel (Guiding Policy) | SWOT (TOWS 전략) | Policy 가 TOWS 의 SO/WO 전략을 반영? |
| Strategy Kernel (Coherent Actions) | VPC (Pain Reliever / Gain Creator) | Actions 가 customer Pain/Gain 을 해소? |
| OKR (Objective) | Persona (End Goal) | Objective 가 Persona 의 End Goal 달성에 기여? |
| OKR (KR) | VPC (Required Gain) | KR 이 Required Gain 측정과 정렬? |
| PR-FAQ (Customer Quote) | Persona (Quote) + JTBD (Functional/Emotional Job) | PR Quote 가 Persona/Job 입장과 일치? |

## 2. Coherence Test (8 항목)

| # | 검증 질문 | Pass / Fail |
|:-:|---------|:----------:|
| 1 | Vision BHAG 가 JTBD Core Job 의 outcome 인가? | ☐ |
| 2 | Strategy Diagnosis 가 PEST/Five Forces 의 핵심 위협 인식? | ☐ |
| 3 | Guiding Policy 의 trade-off 가 SWOT TOWS 전략과 일치? | ☐ |
| 4 | Coherent Actions 의 각 행동이 VPC Pain Reliever 1+ 매핑? | ☐ |
| 5 | OKR Objective 가 Persona End Goal 에 기여? | ☐ |
| 6 | KR (3~5개) 이 VPC Required Gain 측정 가능? | ☐ |
| 7 | PR-FAQ 의 Customer Quote 가 Persona Quote 와 voice 일치? | ☐ |
| 8 | 3-Horizon H1 actions 이 Strategy Coherent Actions 와 정합? | ☐ |

## 3. Mismatch + Resolution

| Mismatch | Source | Resolution |
|---------|--------|-----------|
| (예: Vision BHAG 와 JTBD Core Job 어긋남) | Vision Y3, JTBD interview N=5 | (예: Vision 의 BHAG 정의 갱신 또는 Persona 재선정) |

## 4. Auto-judge α (Sprint 14 — alignment α 구현)

> **lib/auto-judge.js** 가 본 매트릭스를 자동 평가. 각 cell 의 정합/모순 자동 감지.

**알고리즘 (단순)**:
- 각 Core 산출물 + Why 산출물의 frontmatter / 핵심 키워드 추출
- semantic similarity (or LLM 평가) → score 0~1
- score < 0.6 → 'mismatch' / 0.6~0.8 → 'partial' / > 0.8 → 'aligned'
- 전체 매트릭스 8 cell 중 6+ aligned = pass (75% 임계)

**EXP-4 측정**: alignment α 가 의도된 mismatch (sample) 70%+ 감지율 — Sprint 14 검증.

---

## (작성된 sample)

### VAIS Code Plugin Core ↔ Why Alignment

| Core | Why | 정합 평가 |
|------|-----|:------:|
| Vision BHAG ("10만 솔로 빌더가 Fortune 500 수준 프로세스 실행") | JTBD Core Job ("정전 출처 명시 산출물 30분 내 받아 신뢰 가능한 자료 제시") | ✅ aligned — BHAG 가 Job 완수의 scale-up |
| Vision Core Values ("정전 신뢰 / 사용자 주권") | Persona (P1 김지원 — 자기 주권 / 정전 신뢰 가치관) | ✅ aligned |
| Strategy Diagnosis ("default-execute anti-pattern") | PEST T (LLM 발전 → 잘못된 산출물 양산) | ✅ aligned |
| Strategy Diagnosis | Five Forces (Threat of New Entrants High — generic AI 도구 진입) | ✅ aligned |
| Guiding Policy ("Profile 게이트 + 4-policy") | SWOT TOWS WO ("정전 카탈로그 + 솔로 빌더 트렌드") | ✅ aligned |
| Coherent Actions (4: Profile 합의 / metadata / release 5분해 / 50+ 카탈로그) | VPC Pain Reliever 4개 (정전 출처 / Profile 게이트 / clevel-coexistence / Sprint Roadmap) | ✅ aligned (1:1 매핑) |
| OKR Objective ("default-execute 해소 + 신뢰 C-Suite") | Persona End Goal ("30분 PRD + 정전 출처 + 영역 무관 점검") | ✅ aligned |
| OKR KR1 (Profile 게이트 95% 적중) | VPC Required Gain ("30분 PRD") | ✅ aligned |
| PR-FAQ Customer Quote (가상 솔로 빌더) | Persona Quote ("ChatGPT 산출물 신뢰 의심") | ✅ aligned (voice 일치) |

→ 9/9 cell **aligned** (100%) — Core ↔ Why critical alignment 충족.

---

## 작성 체크리스트

- [ ] Alignment Matrix 8+ cell 모두 평가?
- [ ] **Coherence Test 8 항목** 모두 Pass / Fail 판정?
- [ ] Mismatch 발견 시 **Resolution** (어느 산출물 갱신 또는 입력 재선정) 명시?
- [ ] **75% 임계 (6/8 cell aligned)** 충족?
- [ ] Auto-judge α 알고리즘 적용 가능?
- [ ] Vision/Strategy 갱신 시 **본 매트릭스 재평가** 일정 (분기 단위)?

---

## ⚠ Anti-pattern

- **Alignment 부재**: Vision/Strategy 와 JTBD/Persona 가 별도 작성 후 매핑 X — silo. 후행 PRD/Roadmap 표류.
- **자기 만족적 alignment**: 모두 ✅ — 자기기만 의심. **review_recommended=true** + 외부 검토.
- **Core 단독**: Vision/Strategy 만 작성하고 JTBD/Persona 부재 — alignment 평가 불가.
- **Mismatch 회피**: ❌ 발견 시 무시 — 의사결정 비용 폭증. **Resolution 강제**.
- **분기 갱신 부재**: 1 회 작성 후 Vision/Strategy 갱신 시 재평가 X — stale.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 14. Cagan Empowered + Inspired + Christensen JTBD 정전. Alignment Matrix 8+ cell + Coherence Test + Mismatch/Resolution + Auto-judge α + sample (VAIS Code 9/9 aligned) + checklist 6 + anti-pattern 5 |
