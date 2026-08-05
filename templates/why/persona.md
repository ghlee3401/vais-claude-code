---
artifact: persona
owner_agent: customer-segmentation-analyst
phase: why
canon_source: "Alan Cooper 'The Inmates Are Running the Asylum' (1999), Sams + Cooper 'About Face' (1995/2014) — Goal-Directed Design + Cagan 'Inspired' (2008/2017) modern persona spec"
execution:
  policy: always
  intent: user-archetype
  prereq: [jobs-to-be-done]
  required_after: [strategy-kernel, prd]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Why 단계 — JTBD 가 'Job (해결할 일)' 정의 후, Persona 는 'Job 을 의뢰하는 인물 archetype' 정의. JTBD 의 Functional/Emotional/Social Job 이 Persona 의 Goals 로 구체화. Always 정책: 모든 프로젝트가 1 차 페르소나 명시."
---

# Persona (Goal-Directed)

> **canon**: Alan Cooper, *The Inmates Are Running the Asylum* (1999), Ch.9 — "Goal-Directed Design" 도입. Cooper 의 핵심 통찰: **persona 는 user 묘사가 아닌 user goal 의 구체화**.
>
> Marty Cagan *Inspired* (2008/2017) 가 modern product context 에서 갱신: "1 차 persona (Primary)" 만 set 하고, 그 외는 secondary 로 분리.
>
> **JTBD 와 관계**: JTBD 가 "어떤 Job" 을 정의하면, Persona 는 "그 Job 을 의뢰하는 archetype" 을 정의. Job 이 선행, Persona 가 후행.

---

## 1. Persona Identity

| 항목 | 내용 |
|------|------|
| **Persona Name** | (이름 — 사람처럼) |
| **Tier** | Primary / Secondary / Anti-Persona |
| **Photo / Avatar** | (가상 이미지 — 시각적 anchor) |
| **One-Liner** | (한 줄 자기소개 — Persona 입장에서) |

## 2. Demographics + Psychographics

| 항목 | Demographics | Psychographics |
|------|------|------|
| **연령 / 성별** | (예: 32 세 / 남성) | — |
| **직업 / 직책** | (예: 1 인 SaaS 창업자) | — |
| **거주 / 작업 환경** | (예: 서울 / 재택) | — |
| **가치관** | — | (예: 자기 주권 / 정전 신뢰 / 효율성) |
| **태도** | — | (AI 도구에 대한 / 정전 출처에 대한) |
| **두려움** | — | (어떤 실패를 가장 두려워하는가) |

## 3. Goals (Cooper Framework — 3 Levels)

| 레벨 | 정의 | 예시 |
|------|------|------|
| **End Goal** | 최종 결과 (제품 사용 후 이루고 싶은 것) | "투자자에게 신뢰 가능한 자료 제시" |
| **Experience Goal** | 사용 중 느끼고 싶은 감정 | "내가 능력 있다고 느낌 / 안심" |
| **Life Goal** | 인생 차원 가치 (제품 무관) | "독립적 빌더로 자립" |

→ **Cooper 핵심**: End Goal 만 보고 디자인하면 부족. Experience + Life Goal 까지 봐야 진짜 differentiator.

## 4. Daily Workflow (현재 상태)

| 시간대 | 활동 | 사용 도구 | Pain Point |
|--------|------|----------|-----------|
| 오전 | (예: 코드 리뷰 / PRD 작성) | (예: Cursor + ChatGPT) | (예: ChatGPT 산출물 신뢰 의심) |
| 오후 | ... | ... | ... |
| 저녁 | ... | ... | ... |

## 5. JTBD 매핑

| 본 Persona 가 의뢰하는 주요 Job (jobs-to-be-done.md 참조) | 우선순위 |
|--------------------------------------------------------|:------:|
| Job 1 | 높음 |
| Job 2 | 중간 |

## 6. Quote (Persona 입장 인용 — 1 ~ 2 문장)

> "..."

---

## (작성된 sample) — Primary Persona

### 1. Identity

| 항목 | 내용 |
|------|------|
| **Persona Name** | 김지원 (P1 솔로 빌더) |
| **Tier** | **Primary** |
| **One-Liner** | "혼자서도 팀이 있는 것처럼 일하고 싶은 1 인 SaaS 창업자" |

### 2. Demographics + Psychographics

| 항목 | Demographics | Psychographics |
|------|--------------|----------------|
| **연령 / 성별** | 32 세 / 남성 | — |
| **직업** | 1 인 SaaS 창업자 (전 대기업 백엔드 7 년) | — |
| **거주 / 작업 환경** | 서울 / 재택 + 카페 | — |
| **가치관** | — | 자기 주권 / 정전 신뢰 / 효율성 / "쓸데없이 만들지 않는다" |
| **태도** | — | AI 도구는 적극 활용 / generic 산출물 신뢰 의심 / 정전 출처 매우 중시 |
| **두려움** | — | 투자자 미팅에서 "이 결정 근거가 뭐냐" 질문에 답 못 함 |

### 3. Goals

| 레벨 | 내용 |
|------|------|
| **End Goal** | 30 분 내 정전 출처가 명시된 PRD·아키텍처·GTM 산출물 확보 → 투자자·고객·동료에게 신뢰 가능한 자료 제시 |
| **Experience Goal** | "내가 1 인이지만 컨설팅 펌 수준의 결과물을 낼 수 있다" 자신감 / 새 영역 시작 시 막막함 → 안심으로 전환 |
| **Life Goal** | 독립적 빌더로 자립 — 회사 떠나서도 시리즈 B 수준 제품을 혼자 만들 수 있다는 증명 |

### 4. Daily Workflow

| 시간대 | 활동 | 사용 도구 | Pain |
|--------|------|----------|------|
| 09:00~11:00 | 코드 리뷰 + 새 피처 코딩 | Cursor / Claude Code | (양호) |
| 11:00~12:00 | PRD / 아키텍처 결정 | ChatGPT (Pro) | "이 정전 어디서 나왔나" 의심 / 매번 prompt 재구성 |
| 13:00~15:00 | 보안·QA 검토 | (없음 — 직접 함) | "내가 OWASP 다 모른다" 불안 |
| 15:00~17:00 | 투자자 자료 / GTM | Notion + ChatGPT | "marketing 영역은 거의 모름" 막막함 |

### 5. JTBD 매핑

| Job (jobs-to-be-done.md) | 우선순위 |
|---|:---:|
| Job 1: 새 피처 시작 시 정전 출처 명시 산출물 확보 (PRD / Architecture) | **높음** (매주 발생) |
| Job 2: 투자자 미팅 1 주 전 자료 작성 (GTM / Pitch / Financial) | 높음 (월 1 ~ 2 회) |
| Job 3: 보안 / QA 자동 점검 (직접 도메인 부족) | 중간 (release 시) |

### 6. Quote

> "ChatGPT 가 PRD 8 섹션 잘 써주는데, 투자자 미팅 가서 '이 가설 어디서 나왔냐' 물으면 답을 못 해요. 그래서 결국 내가 다시 검토해야 하고, 시간이 안 줄어요. 정전 출처가 처음부터 박혀 있으면, 시리즈 B 회사가 만든 자료처럼 보이지 않을까요?"

---

## 작성 체크리스트

- [ ] Persona 가 **Primary / Secondary / Anti** 중 명확히 분류되어 있는가?
- [ ] Demographics 와 Psychographics 가 **모두** 작성되었는가? (Demographics 만 = 광고 타게팅 수준)
- [ ] Cooper 의 **3 Goals** (End / Experience / Life) 모두 식별되었는가?
- [ ] Daily Workflow 에 **현재 사용 도구 + Pain Point** 가 명시되었는가?
- [ ] JTBD (`prereq`) 의 Job 들과 매핑 + 우선순위 부여되었는가?
- [ ] Persona 의 인용 (Quote) 이 **그 사람 입장의 voice** 인가? (마케팅 카피 X)
- [ ] **이름 / 사진** 등 시각적 anchor 가 있는가? (추상화 방지)
- [ ] Anti-Persona (이 제품 사용자가 **아닌** 사람) 까지 명시되었는가? (선택 — 권장)

---

## ⚠ Anti-pattern

- **Stock Photo 페르소나**: 가상 인물에 stock 이미지 + 일반화된 가치관 → "Persona Theatre" (Cagan 경고). 실제 인터뷰 데이터 기반 (ux-researcher 위임) 권장.
- **너무 많은 Persona**: 5 + 개 — 우선순위 결여. Cagan: "Primary 1 + Secondary 1 ~ 2 + Anti-Persona" 가 적정.
- **Demographics only**: 연령·성별·소득만 작성 — 광고 타게팅 영역. Persona 는 **Goals + Workflow + Pain** 까지.
- **Goal 부재 또는 추상**: "행복하고 싶다" / "성공하고 싶다" — Cooper 가 명시 비판. End Goal 은 **제품 사용 시점의 측정 가능 결과**.
- **All Smiles**: Persona 가 모두 긍정·합리적 — 실제 사용자는 두려움·편견·습관 있음. Pain Point + Anxiety 명시.
- **Persona = 회사 임원**: B2B 제품에서 Persona 를 "CEO" / "CIO" 로만 정의 — 실제 사용자 (개발자 / PM) 와 다름. **economic buyer** 와 **end user** 분리 필요.
- **JTBD 무관**: Persona 작성 후 JTBD 와 매핑 안 함 — Persona 가 **무엇을 의뢰하는지** 모르면 product spec 무용. JTBD → Persona 흐름 명시.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 5 Day 5. Cooper 1995+1999 Goal-Directed Design + Cagan modern persona spec 정전 + 6 섹션 (Identity/Demo+Psycho/Goals/Workflow/JTBD 매핑/Quote) + sample (VAIS Primary 김지원) + Cooper 3 Goals + checklist 8 + anti-pattern 7 |
