---
artifact: interview-guide
owner_agent: ux-researcher
phase: alignment
canon_source: "Steve Portigal 'Interviewing Users' (2013), Rosenfeld Media + Teresa Torres 'Continuous Discovery Habits' (2021) Ch.5 Interview Method + Erika Hall 'Just Enough Research' (2019, 2nd ed.)"
execution:
  policy: scope
  intent: external-user-interview
  prereq: [persona, jobs-to-be-done]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: external_validation_required
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Alignment 단계 — RA-1 (User Value 검증) 100% 충족 위한 외부 인터뷰 5~7명 가이드. AI/internal 검증의 한계를 외부 user voice 로 보완."
---

# External User Interview Guide

> **canon**: Steve Portigal *Interviewing Users* (2013) — qualitative research 표준. Torres *Continuous Discovery Habits* (2021) Ch.5 — interview method + assumption testing. Erika Hall *Just Enough Research* (2019) — practical research practice.
>
> **목적**: 외부 사용자 5~7명 인터뷰로 RA-1 (User Value) 100% 검증. internal 가설을 user voice 로 반증·보완.

---

## 1. Interview Setup

### 1.1 Recruitment

| 항목 | 가이드 |
|------|--------|
| **Sample Size** | 5~7명 (Nielsen 5 가설 검증 충분 + 2 safety margin) |
| **Persona Match** | Primary Persona 정합도 90%+ (조직/역할/통증) |
| **Diversity** | 산업·지역·경험 분산 (편향 회피) |
| **Compensation** | $50~100/h (산업별) |
| **Channel** | LinkedIn / Indie Hackers / 사용자 community / 추천 |

### 1.2 Logistics

- **Duration**: 45~60분 (Portigal 권장)
- **Format**: Zoom + recording (consent 필수)
- **Note-taker**: 1명 (interviewer 외 — bias 회피)
- **Warm-up**: 5분 (rapport 구축)

## 2. Interview Script (5 단계 — Portigal)

### Stage 1: Warm-up (5분)
- 자기소개 + 인터뷰 의도 설명 (research, not sales)
- 녹음 동의
- 일반적 자기소개 ("최근 어떤 일 하시나요?")

### Stage 2: Context (10분)
- 일상 work 흐름 ("일주일에 어떤 일을 하시나요?")
- 현재 도구 사용 ("어떤 AI 도구를 쓰시나요? 어떻게요?")
- **Pain identification** ("그 도구의 가장 답답한 점은?")

### Stage 3: Job-to-be-Done (15분)
- "최근 X 작업 (PRD 작성 등) 의 마지막 시간을 말씀해주세요"
- **5 Whys** ("왜 그렇게 하셨어요?" 5번 반복)
- **Switch event** ("X 도구 → Y 도구로 바꾼 적 있나요? 왜요?")
- **Forces of Progress** ("X 시작 / 완료를 막는 게 뭔가요?")

### Stage 4: Solution Probe (10~15분)
- 우리 솔루션 (VAIS Code) 1분 demo
- **Reaction**: 즉각 반응 (긍정 / 부정 / 의문)
- **Use Case Probe**: "어떤 상황에 쓸 것 같나요?"
- **Anti-Use Case**: "어떤 상황에 안 쓸 것 같나요?"
- **Pricing Probe** (간접): "X 와 비교해 얼마면 합리적?"

### Stage 5: Wrap-up (5분)
- "오늘 얘기 중 가장 중요한 1가지?"
- "다음 인터뷰 추천?" (snowball sampling)
- 감사 + compensation 처리

## 3. Question Patterns (Portigal 권장)

| 패턴 | 예시 | 회피해야 할 |
|------|------|-----------|
| **Open-ended** | "X 에 대해 말씀해주세요" | "X 좋은가요?" (yes/no) |
| **Specific past** | "지난 화요일 X 작업 어떻게 했어요?" | "보통 어떻게 하시죠?" (가설적) |
| **Follow-up** | "흥미롭네요. 더 자세히?" | (silent) |
| **Reflection** | "다시 한다면 뭘 다르게 할 거예요?" | "X 가 좋다고 생각하시죠?" (leading) |
| **Why** | "왜 그러셨어요?" (5 whys) | "X 가 마음에 드세요?" (소비) |

## 4. Analysis Framework

### 4.1 Affinity Mapping

- 각 인터뷰 후 즉시 quote 추출 (post-it 또는 Miro)
- 5~7명 quote → 클러스터링 → 패턴 발견
- **N=2+ 패턴**: 2명 이상 언급 = signal (vs noise)

### 4.2 RA-1 (User Value) 검증

| 가설 | 검증 기준 | 결과 |
|------|---------|:----:|
| H1: 솔로 빌더가 정전 출처 명시 산출물에 가치 느낌 | 5/7 명 "다시 사용" 의도 | ☐ |
| H2: Profile 12 변수 입력 부담 감당 가능 | 5/7 명 "5분 내 완성 가능" | ☐ |
| H3: ChatGPT 대비 차별화 인지 | 4/7 명 "다른 layer" 인식 | ☐ |

### 4.3 Decision Rule (사전)

| 결과 | 액션 |
|------|------|
| H1 5/7+ | RA-1 검증 통과 → GA 진행 |
| H1 3~4/7 | partial → 추가 인터뷰 N=3 또는 pivot 검토 |
| H1 < 3/7 | RA-1 fail → product 재검토 |

## 5. Output Document

| 섹션 | 내용 |
|------|------|
| **Participants** | 5~7명 익명 ID + Persona Match |
| **Method** | recruitment + script + duration |
| **Quotes** | 각 인터뷰의 핵심 quote 5+ |
| **Patterns** | affinity mapping 결과 (N=2+ 패턴) |
| **Hypothesis Validation** | H1/H2/H3 결과 + 결정 rule 적용 |
| **Recommendations** | product 갱신 / pivot / 추가 검증 |

---

## (작성된 sample)

### VAIS Code Plugin RA-1 Interview Plan (Sprint 14 GA 직전)

### Recruitment

| 항목 | 가이드 |
|------|--------|
| Sample | 5명 + 2 safety = 7명 |
| Persona | P1 솔로 빌더 (1인 SaaS 창업자 / 스타트업 CTO) |
| Diversity | 한국 4 + 해외 3 / SaaS 4 + DevTool 3 |
| Compensation | $75/h (1시간) |
| Channel | NCSOFT 음성기술팀 (Beta-2) + Indie Hackers + LinkedIn |

### Script (45분)

- Warm-up 5분
- Context 10분 (현재 AI 도구 사용 + Pain)
- JTBD 15분 (최근 PRD 작성 / 5 whys / switch event)
- Solution Probe 10분 (VAIS demo + reaction)
- Wrap-up 5분

### Hypothesis Validation

| 가설 | 검증 기준 | 결과 (실시 후) |
|------|---------|:----:|
| H1: 정전 출처 명시 = 가치 | 5/7 "다시 사용" | TBD |
| H2: Profile 12 변수 = 감당 가능 | 5/7 "5분 내 완성" | TBD |
| H3: ChatGPT 대비 차별화 | 4/7 "다른 layer" | TBD |

### Output

`docs/subagent-architecture-rethink/02-design/user-interviews.md` (실시 후 작성).

---

## 작성 체크리스트

- [ ] Sample size 5~7명 권장 (Nielsen)?
- [ ] Persona 정합도 90%+ recruitment?
- [ ] Diversity (산업/지역/경험) 분산?
- [ ] **Portigal 5 단계** (Warm-up / Context / JTBD / Solution Probe / Wrap-up) 모두 포함?
- [ ] **Open-ended question** (yes/no 회피)?
- [ ] **Specific past behavior** (가설적 X)?
- [ ] **5 Whys** 적용?
- [ ] Affinity Mapping (N=2+ pattern)?
- [ ] **Decision Rule 사전 결정** (사후 합리화 회피)?

---

## ⚠ Anti-pattern (Portigal + Torres 명시)

- **Leading questions**: "X 가 좋으세요?" — 답이 정해진 질문. **Open-ended + specific past**.
- **Hypothetical**: "보통 어떻게 하세요?" — 가설적 답. **specific recent example** 강제.
- **Silent neglect**: 답 후 다음 질문으로 즉시 — silence 가 더 깊은 답 유도.
- **Sales talk**: solution probe 가 "사세요" 톤 — research 무력화. neutral.
- **Sample 1**: 1명 인터뷰로 결론 — pattern 미식별. **N=5+ 강제**.
- **Decision rule 사후**: 결과 본 후 success/fail 기준 변경 — 학습 무력화.
- **Confirmation bias**: 가설 확인 quote 만 인용 — disconfirming evidence 무시. **N=2+ 패턴** + outlier 명시.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 14. Portigal Interviewing Users + Torres Continuous Discovery + Erika Hall 정전. Recruitment + Logistics + 5 단계 Script + Question Patterns + Affinity Mapping + Hypothesis Validation + Decision Rule + sample (VAIS Code RA-1 Interview Plan) + checklist 9 + anti-pattern 7 |
