---
artifact: opportunity-solution-tree
owner_agent: product-discoverer
phase: what
canon_source: "Teresa Torres 'Continuous Discovery Habits' (2021), Product Talk + Torres OST framework (producttalk.org/opportunity-solution-tree)"
execution:
  policy: always
  intent: discovery-tree
  prereq: [vision-statement, persona]
  required_after: [experiment-design, prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "What 단계 — Discovery 단계의 핵심 visualization. Outcome (북극성) → Opportunities → Solutions → Experiments 트리 구조로 의사결정 추적성 확보."
---

# Opportunity Solution Tree (OST)

> **canon**: Teresa Torres *Continuous Discovery Habits* (2021), Ch.4~6 — Discovery 단계의 visualization 도구. Outcome 1개 → Opportunities (3~5) → Solutions (각 3~5) → Experiments (각 1~3) 트리 구조.
>
> **핵심 통찰**: Solution 부터 시작하는 것이 일반적 anti-pattern. **Outcome → Opportunity → Solution 흐름** 강제로 가설 검증 추적성 확보.

---

## 트리 구조

```
                    Outcome (북극성 1개)
                          │
        ┌─────────────────┼─────────────────┐
   Opportunity 1     Opportunity 2     Opportunity 3
        │                  │                  │
   ┌────┼────┐        ┌────┼────┐        ┌────┼────┐
   S1  S2   S3       S4   S5   S6      S7   S8   S9
   │    │    │
   E1   E2  E3 (각 Solution 별 1~3 experiment)
```

---

## 1. Outcome (북극성)

> **정의**: 비즈니스 outcome (KR) 1개. 단일 metric. Torres: "Outcome 이 여러 개면 트리가 무너짐".

**Outcome**: ______
**관련 KR**: (OKR 의 어느 KR?)

## 2. Opportunities (3~5개)

> **정의**: Outcome 달성을 가로막는 **고객의 통증·기회 영역**. Solution 이 아닌 **사용자 관점 통증**.
>
> **검증**: Persona / JTBD 인터뷰 데이터 기반.

| Opportunity | 발견 출처 | Outcome 기여도 |
|-------------|----------|:------------:|
| ... | (인터뷰 N=5) | High |
| ... | (사용 데이터 분석) | Med |

## 3. Solutions (각 Opportunity 당 2~3개)

> **정의**: 각 Opportunity 를 해소할 **후보 솔루션**. Brainstorm — feasibility 평가 X (이 단계).

| Opportunity | Solution 후보 | 우선순위 |
|-------------|--------------|:------:|
| Op 1 | S1 / S2 / S3 | ... |

## 4. Experiments (각 Solution 당 1~3개)

> **정의**: 각 Solution 의 가설을 검증하는 실험. **Riskiest Assumption** 우선.
>
> **연결**: `experiment-design.md` 작성 (각 experiment 별 1 문서).

| Solution | Experiment | Riskiest Assumption | 결정 기준 |
|----------|-----------|---------------------|----------|
| S1 | E1 (interview N=5) | "사용자가 X 통증 느낀다" | 4/5 명 확인 |

---

## (작성된 sample)

**Product**: VAIS Code | **시점**: 2026-Q2

### Outcome

**Outcome**: 솔로 빌더의 "정전 출처 명시 산출물" Activation Rate 50% (활성 사용자 중 첫 PRD 완성률)
**관련 KR**: KR2 (25 templates depth-c) + KR5 (외부 인터뷰 5~7명 RA-1 검증)

### Opportunities

| Opportunity | 발견 출처 | Outcome 기여 |
|-------------|----------|:------------:|
| Op1: ChatGPT 산출물 정전 출처 부재로 신뢰 의심 | 인터뷰 N=3 (사전) + 사례 분석 | **High** |
| Op2: 새 영역 (보안·GTM·재무) 직접 챙기기 막막 | 인터뷰 N=3 + ux-researcher 가설 | **High** |
| Op3: Profile 입력 12 변수 부담 (학습 비용) | EXP-2 think-aloud 가설 | Med |
| Op4: 한국어 중심 카탈로그 — 글로벌 OSS 채택 장벽 | OSS 컨트리뷰션 패턴 분석 | Med |

### Solutions

| Op | Solutions |
|----|-----------|
| Op1 (정전 부재) | S1: canon_source frontmatter 강제 / S2: catalog 출판 정보 풍부화 / S3: 정전 cross-reference 시각화 |
| Op2 (새 영역 막막) | S4: 6 C-Level 자동 라우팅 / S5: profile 게이트 + scope-conditional sub-agent / S6: 정전 출처 + 작성 체크리스트 |
| Op3 (Profile 부담) | S7: 12 → 5 변수로 단순화 / S8: ideation-guard 자동 추출 / S9: profile preset (오픈소스 / B2B SaaS / etc) |
| Op4 (한국어) | S10: 영문 카탈로그 우선 작성 / S11: i18n 인프라 도입 |

### Experiments

| Solution | Experiment | Riskiest Assumption | 결정 기준 |
|----------|-----------|---------------------|----------|
| S2 (catalog 풍부화) | EXP-2 catalog 정전 정보 think-aloud N=3 | "사용자가 정전 출처를 actually 사용한다" | 3/3 명 인용 |
| S8 (ideation-guard 자동 추출) | EXP-1 (Sprint 1~3 ✅) | "자동 추출이 12 변수 70%+ 정확" | 통합 테스트 통과 ✅ |
| S5 (Profile 게이트) | EXP-1 (✅) + EXP-5 외부 인터뷰 5~7명 | "skip 이 의도된 가치를 만든다" | 3/5 긍정 |
| S10 (영문 카탈로그) | (Sprint 11~14 외 — H2) | "영문화 시 PR contributor 50% 증가" | (post-GA 측정) |

---

## 작성 체크리스트

- [ ] **Outcome 단일 (1개)** 인가? Torres: 여러 개면 트리 무너짐.
- [ ] Opportunities 가 **3~5개** 이며 사용자 통증 관점인가? (Solution X)
- [ ] 각 Opportunity 의 **발견 출처** (인터뷰/데이터/사례) 가 명시되었는가?
- [ ] 각 Opportunity 당 **Solution 2~3개** 후보가 brainstorm 되었는가? (feasibility 평가는 후행)
- [ ] 각 Solution 당 **1~3 Experiment** 이 정의되었는가?
- [ ] 각 Experiment 의 **Riskiest Assumption** 이 명시되었는가?
- [ ] 각 Experiment 의 **결정 기준** (성공/실패) 이 정량/정성으로 명시되었는가?
- [ ] 트리 시각화가 본문에 포함되었는가?
- [ ] Outcome 이 OKR 의 KR 과 매핑되었는가?

---

## ⚠ Anti-pattern (Torres 명시)

- **Solution-first**: Solution 부터 시작 — Opportunity (사용자 통증) 부재. 가설 검증 무능.
- **Outcome 다중**: 여러 Outcome 동시 — 우선순위 결여. **단일 Outcome** 강제.
- **Opportunity = Feature**: "X 기능 추가" — feature 는 Solution. Opportunity 는 사용자 통증·기회.
- **Discovery 생략**: brainstorm 으로 Opportunity 만들고 인터뷰 부재 — 가설 미검증. **인터뷰 N≥5** 권장.
- **Experiment 부재**: Solution 까지만 작성 — 검증 누락. 각 Solution 당 최소 1 experiment.
- **Riskiest Assumption 회피**: "잘 될 것이다" — 가장 위험한 가정 무시. **명시적으로 가장 약한 고리** 식별.
- **트리 stale**: 1 회 작성 후 안 봄 — Discovery 는 continuous. 매 sprint review.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 11. Torres OST 정전 + Outcome 단일 + Opportunities 3~5 + Solutions 2~3/op + Experiments 1~3/sol + sample (VAIS Code 4 Op + 11 Sol + 4 Exp) + checklist 9 + anti-pattern 7 |
