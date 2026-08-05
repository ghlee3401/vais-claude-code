---
artifact: experiment-design
owner_agent: product-discoverer
phase: what
canon_source: "Teresa Torres 'Continuous Discovery Habits' (2021) + Eric Ries 'The Lean Startup' (2011), Crown Business — Build-Measure-Learn loop + Riskiest Assumption testing"
execution:
  policy: scope
  intent: hypothesis-experiment
  prereq: [opportunity-solution-tree]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: discovery_required
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — OST 의 각 Solution 별 검증 실험. Build-Measure-Learn 루프의 Build 전 단계. Riskiest Assumption 우선 검증."
---

# Experiment Design

> **canon**: Teresa Torres *Continuous Discovery Habits* (2021) Ch.7 + Eric Ries *The Lean Startup* (2011), Ch.8~10 — Build-Measure-Learn loop. **Riskiest Assumption Testing** (Brant Cooper, Patrick Vlaskovits — 2013).
>
> **목적**: Solution 의 가장 위험한 가정 (Riskiest Assumption) 을 **최소 비용 + 최단 시간** 으로 검증.

---

## 1. Hypothesis (가설)

> **형식**: "We believe [solution X] will achieve [outcome Y] for [persona Z] because [insight W]."
>
> **검증**: 주장이 falsifiable (반증 가능) 한가?

**Hypothesis**: ______

## 2. Riskiest Assumption

> **정의**: 가설이 무너지면 Solution 자체가 무너지는 가정. Brant Cooper: "If wrong, the rest doesn't matter."
>
> **검증**: 이 가정 외 모든 가정이 사실이라 가정해도 Solution 작동 X 인가?

**Riskiest Assumption**: ______

## 3. Test Method

| 방법 | 적정 시점 | 비용 | 시간 |
|------|----------|------|------|
| **User Interview** | Discovery 초기 | Low | 1~2주 |
| **Prototype** (Figma/HTML) | Solution 가설 검증 | Med | 2~4주 |
| **A/B Test** (live) | Activation/Retention 측정 | High | 4~12주 |
| **Wizard of Oz** (인간 fake AI) | feasibility 가설 | Low | 1~2주 |
| **Concierge MVP** (수동 서비스) | Value 가설 | Med | 4~8주 |
| **Smoke Test** (landing page) | Demand 가설 | Low | 1~2주 |

**Selected Method**: ______ (이유 명시)

## 4. Success/Failure Criteria

| 결과 | 기준 (정량/정성) | 후속 조치 |
|------|----------------|----------|
| **Success** | (정량 임계 + 정성 sign) | Solution 진행 (Build) |
| **Failure** | (반대 기준) | Solution 폐기 또는 pivot |
| **Inconclusive** | (애매한 결과) | 추가 실험 또는 재설계 |

## 5. Measurement Plan

| What | How | When |
|------|-----|------|
| 측정 변수 1 | (도구 / 방법) | (시점) |
| 측정 변수 2 | ... | ... |

## 6. Timeline + Budget

- **시작**: YYYY-MM-DD
- **종료**: YYYY-MM-DD
- **시간**: N 일
- **비용**: $ N (또는 N 시간)

## 7. Decision Rule

> 사전 결정: 결과 X 면 Y 한다. 사후 합리화 방지.

**If Success**: ______
**If Failure**: ______
**If Inconclusive**: ______

---

## (작성된 sample)

### EXP-2: depth (c) 품질 think-aloud (Sprint 4~6)

#### 1. Hypothesis

We believe **template depth (c) standard (sample 100자+ + checklist 5+ + anti-pattern 3+)** will achieve **사용자가 작성 시 정전 출처 + 체크리스트로 자기 검증 가능** for **솔로 빌더 P1** because **현재 generic AI 도구 산출물의 신뢰 부족 통증이 정전 명시로 해소된다는 인터뷰 데이터 N=3**.

#### 2. Riskiest Assumption

**"솔로 빌더가 작성된 sample 을 단순 복사 X — 자기 프로젝트에 맞춰 수정한다"** — 만약 사용자가 sample 을 그대로 복사해 사용하면 정전 매핑 가치가 fake 됨.

#### 3. Test Method

**Selected**: think-aloud usability test N=3
**이유**: depth (c) 의 인지적 흐름 (sample 보기 → checklist 체크 → anti-pattern 회피) 이 작동하는지 직접 관찰. A/B test 보다 빠름.

#### 4. Success/Failure

| 결과 | 기준 |
|------|------|
| **Success** | 3/3 명이 sample 을 자기 프로젝트로 수정 + 2/3 명이 anti-pattern 1+ 인지 |
| **Failure** | 1/3 미만 또는 sample 그대로 복사 |
| **Inconclusive** | 2/3 만 충족 |

#### 5. Measurement Plan

| What | How | When |
|------|-----|------|
| 작성 시간 | screen recording | 실시간 |
| sample 복사 vs 수정 비율 | diff comparison | 사후 |
| anti-pattern 인지율 | 인터뷰 자가 보고 | 직후 |

#### 6. Timeline

- 시작: 2026-04-29
- 종료: 2026-05-13 (2주)
- 비용: 인터뷰 보상 3 명 × $50 = $150

#### 7. Decision Rule

- **Success**: depth (c) 표준 유지 + 잔여 25 templates 동일 적용
- **Failure**: depth 격하 (sample 단순화) 또는 작성 가이드 추가
- **Inconclusive**: think-aloud N=2 추가 (총 5)

---

## 작성 체크리스트

- [ ] Hypothesis 가 **falsifiable** 한가? (반증 가능 — 결과로 거짓 판명 가능)
- [ ] Riskiest Assumption 이 **명시적으로 가장 약한 고리** 인가? (다른 가정이 사실이라 가정해도 무너지는 것)
- [ ] Test Method 가 **시간·비용 최소** 옵션을 선택했는가?
- [ ] Success/Failure 기준이 **정량 + 정성** 모두 명시되었는가?
- [ ] Inconclusive 케이스도 **사전 결정** 되어 있는가?
- [ ] Decision Rule 이 **사전** 결정되었는가? (사후 합리화 방지 — Ries 강조)
- [ ] OST (`prereq`) 의 어떤 Solution 의 어떤 Experiment 인지 매핑되었는가?
- [ ] Measurement Plan 의 **What/How/When** 모두 작성되었는가?
- [ ] Timeline + Budget 이 명시되었는가?

---

## ⚠ Anti-pattern (Ries + Torres 명시)

- **Falsifiable 부재**: "사용자가 좋아할 것이다" — 반증 불가. 측정 가능한 임계치 명시 필수.
- **Riskiest Assumption 회피**: 위험 적은 가정 검증 — Vanity validation. 가장 약한 고리 우선.
- **사후 합리화**: 결과 본 후 Decision Rule 변경 — 학습 무력화. **사전 결정 + 변경 명시**.
- **너무 비싼 실험**: A/B test 부터 시작 — Discovery 단계엔 interview / Wizard of Oz 가 더 빠름.
- **N=1**: 단일 사용자 — 통계 가치 부족. **최소 N=3** (think-aloud) ~ N=5 (interview).
- **Inconclusive 무시**: success/failure 만 결정 — 애매한 결과 시 마비. **Inconclusive 액션** 사전 결정.
- **Build-Measure-Learn 단절**: experiment 결과를 다음 sprint 에 반영 X — Lean Startup 의 핵심 루프 무력화.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Torres + Ries 정전. Hypothesis + Riskiest Assumption + Test Method (6 옵션) + Success/Failure/Inconclusive + Measurement + Timeline + Decision Rule + sample (EXP-2 depth c think-aloud) + checklist 9 + anti-pattern 7 |
