---
artifact: vision-statement
owner_agent: vision-author
phase: core
canon_source: "Collins & Porras 'Built to Last' (1994), HarperBusiness"
execution:
  policy: always
  intent: vision-definition
  prereq: []
  required_after: [strategy-kernel, okr]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "Core 단계 첫 번째 산출물 — 모든 전략·결정의 북극성. 부재 시 Strategy Kernel/OKR/Roadmap이 표류."
---

# Vision Statement + BHAG

> **canon**: Collins & Porras *Built to Last* (1994), Ch.11 "Building the Vision" — Core Ideology + Envisioned Future 2-Part 구조.
>
> **정의**: Vision = **Core Ideology** (불변, 우리가 누구인가) + **Envisioned Future** (10~30년 후 도달할 곳). BHAG (Big Hairy Audacious Goal) 는 Envisioned Future 의 측정 가능한 단일 목표.
>
> **왜 Core 단계 첫 산출물인가**: Strategy Kernel(Rumelt) / OKR(Doerr) / 3-Horizon(McKinsey) / PR-FAQ(Amazon) 모두 Vision 을 입력으로 가정. Vision 없이 작성하면 "전략"은 단순 목표 나열로 전락 (Rumelt 의 "bad strategy" 정의).

---

## 구조

### Core Ideology (불변 — 100년 가도 동일)

| 항목 | 작성 가이드 |
|------|------------|
| **Core Values** | 외부 보상이 사라져도 지킬 신념 3~5개. "고객 우선"처럼 모두가 동의하는 것 X — 우리만의 신념. Collins: "외부에 자랑하기보다 내부 결정 기준" |
| **Core Purpose** | "왜 존재하는가"에 답. "돈을 번다" 아닌 더 깊은 이유. 100년 가도 변치 않는 존재 이유 1문장 |

### Envisioned Future (10~30년 후 도달)

| 항목 | 작성 가이드 |
|------|------------|
| **BHAG** | 10~30년 단위, 측정 가능한 단일 목표. 달성 확률 50~70% (= 도전적). 1줄 |
| **Vivid Description** | BHAG 달성 시점의 세상을 **현재 시제**로 생생히 묘사. 4~7문장. 구체적 장면 (특정 인물·시간·행동) 포함 |

---

## (작성된 sample)

**제품**: VAIS Code (AI C-Suite Plugin for Claude Code)

### Core Ideology

| 항목 | 내용 |
|------|------|
| **Core Values** | 1) 모든 결정의 근거는 정전(Canon) 에 있다 — 휴리스틱·임의성 거부 / 2) 사용자 주권 — AI 는 추천, 사용자가 결정 / 3) 쓸데없이 만들지 않는다 — Profile 기반 산출물만 생성 / 4) 산출물이 sub-agent 를 정의한다 — 역할이 산출물을 따라간다 |
| **Core Purpose** | 혼자 일하는 빌더도 팀이 있는 것처럼 만든다 — 지식 격차로 인해 시도조차 못 하던 영역을 정전 기반 의수(prosthesis)로 채운다 |

### Envisioned Future

| 항목 | 내용 |
|------|------|
| **BHAG** | 2035년까지, 전 세계 10만 명의 솔로 빌더와 소규모 팀이 VAIS 를 통해 팀 없이도 Fortune 500 수준의 제품 프로세스를 실행하며, 정전 기반 산출물 카탈로그가 50+ 정전 정전 100% 매핑 OSS 표준이 된다 |
| **Vivid Description** | 한 명의 개발자가 아침 커피를 마시는 동안 VAIS CEO 에 "신규 피처 X 시작해"라고 말한다. 점심 즈음 PRD·아키텍처 결정·보안 감사·GTM 초안이 도착한다. 그 결과물에는 컨설팅 펌의 PDF 보다 명확한 정전 출처가 붙어 있다 (Cagan / Rumelt / Torres / SRE Book). 투자자 미팅에서 그가 펼친 자료는 어느 시리즈 B 회사의 그것과 구분되지 않는다. 그러나 그는 혼자 일한다. |

---

## 작성 체크리스트

- [ ] Core Values 는 3~5개 이며, 외부 보상 없어도 지킬 진정한 신념인가? (예: "고객 우선" 같은 보편 슬로건 아닌가)
- [ ] Core Purpose 는 "돈 벌기 위해" 가 아닌 더 깊은 존재 이유 1문장 인가?
- [ ] BHAG 는 10년 이상 장기이며, 측정 가능한 단일 지표를 포함하는가? (예: "10만 명", "Fortune 500 수준")
- [ ] BHAG 달성 확률이 체감 50~70% 수준인가? (100% = 도전 아님 / 5% = 환상)
- [ ] Vivid Description 이 **현재 시제**로 4~7문장 구체적 장면을 묘사하는가? (특정 인물·시간·행동 포함)
- [ ] Vision 전체가 팀원이 외부 자료 없이 암기·재현할 수 있을 만큼 간결한가? (Core Values 5개 + Purpose 1문장 + BHAG 1줄 + Vivid 4~7문장)
- [ ] 정전 출처(Collins & Porras *Built to Last*) 가 frontmatter `canon_source` 에 명시되어 있는가?

---

## ⚠ Anti-pattern

- **Financial BHAG**: "2030년 매출 1조 원" / "ARR $100M 달성" — 재무 목표는 BHAG 가 아님. Collins 명시 경고: "BHAG 는 회사의 영혼을 표현해야지, 단순 숫자 목표가 아니다." 매출 목표는 OKR/3-Horizon 에 적합.
- **현재 상태 기술**: "우리는 X 를 한다" / "우리는 Y 를 잘한다" — Vision 이 현재형이면 도달할 미래가 없음. Envisioned Future 는 **아직 존재하지 않는** 상태여야 함.
- **너무 짧은 BHAG 기간**: "3년 안에 시장 1위" / "올해 안에 PMF" — BHAG 는 10~30년. 3년 이하는 OKR / 1년 이하는 Sprint Goal 영역.
- **모두가 동의하는 Core Values**: "고객 중심" / "혁신" / "신뢰" — 누구도 반대하지 않는 단어는 결정 기준으로 작동 안 함. Collins: "Core Values 는 외부 자랑이 아니라 내부 conflict 시 결정 기준이다."
- **Vivid Description 부재**: Vision 이 BHAG 1줄로 끝나면 팀이 도달 시점 모습을 그릴 수 없음. 결과: 전략·로드맵 작성 시 "BHAG 달성에 어떻게 기여하는가" 판단 불가.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 1, RA-3 1차 측정. design _tmp/infra-architect.md §6.1 draft 정식 이관 |
