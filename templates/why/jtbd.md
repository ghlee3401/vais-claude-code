---
artifact: jobs-to-be-done
owner_agent: customer-segmentation-analyst
phase: why
canon_source: "Clayton Christensen 'The Innovator's Solution' (2003), Harvard Business School Press + Christensen et al. 'Competing Against Luck' (2016), HarperBusiness — Anthony Ulwick 'Outcome-Driven Innovation' (1990s)"
execution:
  policy: always
  intent: customer-job-mapping
  prereq: []
  required_after: [persona, strategy-kernel, prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Why 단계 — 고객이 **무엇을 사는지** 보다 **어떤 일을 시키려고 사는지** (Job) 에 초점. Always 정책: 모든 프로젝트가 작성 (B2B/B2C/사내 도구 무관). Persona 보다 선행 — 'Job 이 정의되어야 그 Job 을 의뢰하는 Persona 가 정의됨'."
---

# Jobs-to-be-Done (JTBD) Framework

> **canon**: Clayton Christensen (Harvard Business School), *The Innovator's Solution* (2003), Ch.3 — "Customers don't buy products; they hire them to do a job." 2016 *Competing Against Luck* 에서 6-Part Job Story 형식 체계화.
>
> **선행 흐름**: Anthony Ulwick "Outcome-Driven Innovation" (1990s) — Christensen 이 차용·재구성. 두 학파 (Christensen / Ulwick) 모두 인정.
>
> **핵심 가설**: Persona (인구 통계) → Job (해결할 문제) 가 아닌, **Job → Persona** 가 인과적으로 옳음. 같은 Job 을 다른 Persona 가 의뢰할 수 있고, 같은 Persona 가 다른 Job 을 의뢰할 수 있음.

---

## Part 1. Core Job Statement

> **형식 (Christensen)**: "When [상황 (situation)], I want to [동기 (motivation)], so I can [기대 결과 (expected outcome)]."

**Core Job**: When ____, I want to ____, so I can ____.

---

## Part 2. 6-Part Job Story (Competing Against Luck, 2016)

| # | 항목 | 내용 |
|:-:|------|------|
| **1** | **Situation** (상황) | (Job 이 발생하는 trigger — 시간 / 장소 / 사람 / 사건) |
| **2** | **Motivation** (동기) | (어떤 변화·진보를 원하는가 — push factor) |
| **3** | **Expected Outcome** (기대 결과) | (Job 완료 시점의 success metric — 측정 가능) |
| **4** | **Forces of Progress** (변화 추진력) | Push of Situation + Pull of New Solution |
| **5** | **Forces of Inertia** (저항력) | Anxiety of New + Habit of Present |
| **6** | **Functional / Emotional / Social Job** | (3 차원 분해 — 기능적 + 감정적 + 사회적) |

---

## Part 3. Job 분류 (Functional / Emotional / Social)

| 차원 | 정의 | 측정 |
|------|------|------|
| **Functional** | 실용적 결과 (작업 완료 / 문제 해결) | "X 시간 내 Y 결과" |
| **Emotional** | 감정 상태 변화 (자신감 / 안심 / 만족) | "Z 감정을 느낀다" |
| **Social** | 타인 인식 변화 (지위 / 인정 / 소속) | "W 의 인정을 받는다" |

---

## (작성된 sample)

**제품**: VAIS Code | **타겟**: P1 솔로 빌더

### Core Job Statement

**Core Job**: When 새로운 제품·피처를 시작할 때 (PRD·아키텍처·GTM·보안 감사 등 모든 영역을 직접 챙겨야 할 때), I want to 정전 출처가 명확한 산출물을 빠르게 받고, so I can 팀 없이도 투자자·사용자·동료에게 신뢰 가능한 결과물을 제시할 수 있다.

### 6-Part Job Story

| # | 항목 | 내용 |
|:-:|------|------|
| **1** | Situation | 1 인 창업자가 새 피처를 시작 / 투자자 미팅 1 주 전 자료 작성 / 기존 generic AI 도구 (ChatGPT) 산출물의 정전 출처 부재로 신뢰 의심받음 |
| **2** | Motivation | "내가 모르는 영역도 정전 수준으로 챙기고 싶다" — 지식 격차에 대한 위기감 + 시간 압박 + 신뢰성 요구 |
| **3** | Expected Outcome | (a) 30 분 내 PRD 8 섹션 완성 (b) 모든 산출물에 정전 출처 명시 (Cagan / Rumelt / Torres) (c) 본인이 모르는 영역도 자동 점검 |
| **4** | Forces of Progress | **Push**: ChatGPT 산출물 신뢰 부족 / 시간 부족 / 영역 지식 부족 / **Pull**: VAIS 의 정전 카탈로그 + Profile 게이트 + clevel-coexistence |
| **5** | Forces of Inertia | **Anxiety**: 새 도구 학습 부담 / Profile 12 변수 입력 부담 / **Habit**: 기존 ChatGPT 워크플로우 / generic prompt 익숙함 |
| **6** | F/E/S Jobs | **Functional**: 30 분 내 PRD / 정전 출처 명시 / **Emotional**: "전문가가 검토한 산출물" 안심 / **Social**: 투자자·동료에게 "어떻게 이런 자료를 혼자 만들었나?" 인정 |

### Forces 분석 결정

```
Push (Pain) + Pull (Solution Attractive)  >  Anxiety (New Risk) + Habit (Status Quo)
                                            ?

Push: 매우 높음 (신뢰성 / 시간 / 지식 격차)
Pull: 높음 (정전 카탈로그는 unique value)
Anxiety: 중간 (Profile 입력 1 회는 1 회 비용)
Habit: 중간 (ChatGPT 워크플로우 익숙함)

→ Push + Pull > Anxiety + Habit ✓ Job 채택 가능 (일관)
```

---

## 작성 체크리스트

- [ ] Core Job Statement 가 "When ___, I want to ___, so I can ___" 형식인가?
- [ ] 6-Part Job Story 모두 작성되었는가? (Situation / Motivation / Expected Outcome / Forces of Progress / Forces of Inertia / F-E-S Job)
- [ ] Expected Outcome 이 **측정 가능** 한가? ("좋은 결과" X — "30 분 내 / 100% 정전 명시")
- [ ] Functional / Emotional / Social 3 차원 모두 식별되었는가? (1 차원만 보면 깊이 부족)
- [ ] Forces of Progress 와 Inertia 균형 분석 (Push+Pull > Anxiety+Habit) 결과가 명시되었는가?
- [ ] **Persona 가 아닌 Job** 중심인가? (인구 통계 묘사 X — Job 자체 정의)
- [ ] **본 회사·제품 무관 Job 정의** 인가? ("VAIS 를 사용한다" 같이 솔루션 포함 X — Job 은 솔루션 독립적)

---

## ⚠ Anti-pattern

- **솔루션이 포함된 Job**: "VAIS 를 사용해서 PRD 를 작성한다" — 이는 product feature 이지 Job 아님. **솔루션을 모른 채 Job 정의** 가 핵심. 올바른 형태: "PRD 를 빠르게 정전 수준으로 작성한다."
- **Persona 묘사로 변질**: "30 대 남성 개발자, 서울 거주" — 인구 통계는 Persona 영역. JTBD 는 **그 사람이 의뢰하는 Job**.
- **Functional Job 만**: 기능적 측면만 식별 — 감정적 (불안 해소) / 사회적 (인정) 누락. Christensen: "Job 의 80% 가치는 Emotional/Social".
- **Forces 분석 누락**: 6-Part 중 Forces of Progress·Inertia 단계 생략 — Job 채택 가능성 판단 불가.
- **너무 좁은 Job**: "X 버튼을 클릭한다" — 작업 (task) 이지 Job 아님. Job 은 **why** 까지 포함하는 진보 (progress).
- **너무 넓은 Job**: "성공한다" / "행복하다" — 추상화 과도. Job 은 **현재 상황 → 목표 상황** 의 구체적 진보.
- **Solution-jumping**: Job 정의 즉시 솔루션으로 점프 — Christensen 경고: "Job 을 충분히 이해 못 한 채 솔루션 디자인 = innovation 실패".

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 5 Day 4. Christensen 2003+2016 + Ulwick ODI 정전 + Core Job + 6-Part Story + F/E/S 분류 + Forces 분석 + sample (VAIS P1 솔로 빌더) + checklist 7 + anti-pattern 7 |
