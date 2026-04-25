---
artifact: pr-faq
owner_agent: pr-faq-author
phase: core
canon_source: "Amazon Working Backwards methodology — Bryar & Carr 'Working Backwards' (2021), St. Martin's Press"
execution:
  policy: always
  intent: launch-narrative
  prereq: [vision-statement]
  required_after: [strategy-kernel, okr]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Core 단계 네 번째 산출물 — 출시 1 일차 고객 입장에서 역산 (Working Backwards). 명확한 customer benefit 이 없으면 PR 작성 자체가 막힘 → product-market fit 결여 조기 발견. review_recommended=true: 1 인 작성 시 자기 만족적 PR 위험."
---

# PR-FAQ (Press Release + FAQ)

> **canon**: Amazon Working Backwards (Jeff Bezos 2004 도입) — *Working Backwards: Insights, Stories, and Secrets from Inside Amazon* (Bryar & Carr, 2021), Ch.4 "Working Backwards".
>
> **원칙**: 제품을 만들기 전에 **출시일의 보도자료를 먼저 쓴다**. 고객이 들었을 때 "Wow, 이거 쓰고 싶다" 가 안 나오면 만들지 말 것. PR (Press Release) + FAQ (Internal/External) 조합으로 명확성 강제.
>
> **Bezos 의 6 페이지 메모**: "PowerPoint 금지" — 서술형 문서로 사고를 강제. PR-FAQ 는 이 메모의 Day-One 출시 버전.

---

## Part 1. Press Release (1 페이지, 5 단락)

> 가상 출시일 기준 보도자료 — 고객이 읽는 형식

### Heading

> [제품·기능명] [출시 동사] — [핵심 가치 1 줄]

### Sub-heading

> [타겟 고객 + 1 문장 요약 — 누가, 무엇을 얻는가]

### 단락 1 — Summary

> [출시 도시·날짜] — [회사명] 은 오늘 [제품·기능] 을 출시했다. [한 줄 가치 명제]. [무엇이 변했는가 + 누구를 위한 것인가].

### 단락 2 — Problem

> 기존 고객은 [핵심 통증] 을 겪었다. [구체적 사례·수치]. 기존 솔루션은 [실패 이유] 때문에 부족했다.

### 단락 3 — Solution

> [신제품·기능] 은 [핵심 메커니즘] 을 통해 이 문제를 해결한다. [고유한 접근 1~2 가지 — 경쟁사 X 이유].

### 단락 4 — Customer Quote (가상)

> "[목표 페르소나] 인 [이름·직책] 은 이렇게 말했다: '[제품 사용 후 변화 — 1~2 문장. 감정 + 측정 가능한 결과]'."

### 단락 5 — How to Get Started + Closing

> [시작 방법 — URL·CTA]. [회사·비전 한 줄 + boilerplate]. [공보 담당자 연락처 (가상)].

---

## Part 2. Internal FAQ (5~10 항목, 회사 내부용)

> 의사결정·자원 배분·리스크 답변. 외부 노출 X.

| Q | A |
|---|---|
| 왜 지금 만드는가? | (timing rationale — 시장·기술·경쟁 변화) |
| 가장 큰 기술적 위험은? | (R&D 미해결 + mitigation) |
| 손익분기는 언제 / 비용은? | (P&L 추정 — 개발비·운영비·기회비용) |
| 만약 실패하면? | (실패 정의 + 학습할 것 + sunk cost 처리) |
| 다른 회사가 먼저 만들면? | (defensibility — moat 또는 fast follower 전략) |
| 이 결정이 회사 전략과 어떻게 정합하는가? | (Strategy Kernel Guiding Policy 와 연결) |

---

## Part 3. External FAQ (5~10 항목, 고객용)

> 고객이 가질 질문 — 보도자료 보완

| Q | A |
|---|---|
| 가격은? | ... |
| 기존 X 와 무엇이 다른가? | ... |
| 어떻게 시작하는가? | ... |
| 데이터·프라이버시는? | ... |
| 지원 채널은? | ... |

---

## (작성된 sample)

### Press Release

**Heading**: VAIS Code v1.0 출시 — 솔로 빌더에게 "정전 기반 AI C-Suite" 를 제공한다

**Sub-heading**: 1 인 창업자와 소규모 팀 PM 이 자신의 프로젝트 맥락에 맞는 PRD·아키텍처·GTM·보안 감사를 정전 (Cagan / Rumelt / Torres / SRE Book) 출처와 함께 자동 생성

**단락 1**: 서울, 2026 년 6 월 1 일 — VAIS Code 팀은 오늘 VAIS Code v1.0 을 정식 출시했다. 솔로 빌더와 소규모 팀 PM 이 Project Profile (12 변수) 한 번 합의로 6 명의 AI C-Level (CEO/CPO/CTO/CSO/CBO/COO) 과 44 개 sub-agent 를 작동시켜, 자기 프로젝트 맥락에 맞는 산출물만 정전 출처와 함께 받게 된다. 기존 generic AI 도구가 "모든 가능한 산출물" 을 만들어 cluttering 을 야기했다면, VAIS 는 **이 프로젝트에 필요한 것만** 만든다.

**단락 2 (Problem)**: 1 인 창업자는 PRD·아키텍처·GTM·보안 감사 등 영역 전반을 알 수 없다. 기존 AI 도구 (ChatGPT / Cursor / Copilot) 는 generic prompt 에 의존해 회사·정전 출처가 불명확한 산출물을 양산한다. 결과: 1 인 빌더는 "이 산출물이 신뢰 가능한가" 를 매번 의심하게 되고, 투자자·고객에게 제시할 자료의 정전적 근거가 부재하다.

**단락 3 (Solution)**: VAIS Code 는 (1) Project Profile 12 변수로 프로젝트 맥락을 정확히 포착하고, (2) 50+ 산출물 카탈로그 — 각 산출물에 정전 출처 (Rumelt / Cagan / Torres / Osterwalder / SRE Book / DORA) + 실행 정책 (Always / Scope / User-select / Triggered) frontmatter 를 강제 — (3) sub-agent 가 frontmatter 정책에 따라 호출 시점을 자체 판단한다. "쓸데없이 CI/CD 를 만들지 않는다."

**단락 4 (Quote)**: 솔로 빌더 김OO (1 인 SaaS 창업자) 는 이렇게 말했다: "기존엔 PRD 한 장 쓰는 데 3 일이 걸렸다. VAIS 의 CPO 를 호출하니 30 분 안에 Cagan INSPIRED 출처가 붙은 PRD 8 섹션이 나왔다. 더 놀라운 건, 우리 프로젝트가 OSS 라서 VAIS 가 CI/CD 부분을 자동으로 skip 했다는 것이다."

**단락 5**: VAIS Code 는 Claude Code 마켓플레이스에서 무료 설치 가능 (`/plugin install vais-code`). 더 알아보기: github.com/vais-code. 솔로 빌더가 팀 없이도 Fortune 500 수준의 제품 프로세스를 실행하는 미래를 만든다. 문의: hello@vais.code.

### Internal FAQ (발췌)

| Q | A |
|---|---|
| 왜 지금? | LLM 이 "정전 출처가 명시된 산출물" 을 가공할 만큼 충분히 발전 (2025 Q4 GPT-5 / Claude 4.x 수준). Cursor·Copilot 은 IDE 도구 — VAIS 는 "C-Suite 시뮬레이션" 으로 다른 layer. |
| 가장 큰 기술적 위험은? | 50+ template (depth c) 작성 시간 (RA-3) — 14~22 주 추정. 완화: Sprint 1~3 에서 5 파일럿 측정 후 추정 보정. |
| 다른 회사가 먼저 만들면? | AutoGPT / CrewAI 는 "에이전트 구성" layer — VAIS 는 "C-Suite 도메인 특화 + 정전 카탈로그" — 카탈로그 자체가 moat. |

### External FAQ (발췌)

| Q | A |
|---|---|
| 가격? | OSS 무료. 향후 enterprise 버전 (사내 정전 추가 / 회사별 카탈로그) 별도. |
| ChatGPT 와 다른 점? | 도메인 특화 (소프트웨어 제품 라이프사이클) + 정전 출처 강제 + Profile 기반 맥락 인식. |
| 데이터 프라이버시? | 로컬 파일 시스템 + Claude API 만 사용. 별도 서버 X. |

---

## 작성 체크리스트

- [ ] Heading 이 "[제품] [출시 동사] — [핵심 가치 1 줄]" 형식인가? (광고 카피 X)
- [ ] Sub-heading 이 타겟 고객 + 1 문장 요약을 명시하는가?
- [ ] 단락 1 (Summary) 이 "출시 도시·날짜" 로 시작하는가? (보도자료 컨벤션)
- [ ] 단락 2 (Problem) 이 구체적 사례·수치로 통증을 보여주는가? (추상적 X)
- [ ] 단락 3 (Solution) 이 **고유한 접근 (Why us X 다른 회사)** 를 명시하는가?
- [ ] 단락 4 (Quote) 가 가상이지만 페르소나 명확하고 측정 가능한 변화를 포함하는가?
- [ ] Internal FAQ 6 항목 (timing / risk / P&L / failure / competition / strategy fit) 모두 답변되었는가?
- [ ] External FAQ 가 고객의 첫 5 분 질문 (가격·차별점·시작 방법·프라이버시·지원) 을 다루는가?
- [ ] 전체 PR 이 1 페이지 (~600~800 자) 내인가? (Bezos: "PowerPoint 금지 + 6 페이지 메모")
- [ ] Vision Statement (`prereq`) 의 BHAG 와 PR 의 결말이 정렬되는가?

---

## ⚠ Anti-pattern

- **Feature List PR**: "X 기능, Y 기능, Z 기능 추가" — feature dump 이지 customer benefit 아님. Bezos: "고객이 왜 신경 쓰는가?" 가 빠지면 zero-impact.
- **Buzzword 광고**: "혁신적·독보적·차세대 AI" — 광고 문구는 보도자료에 부적절. 구체적 메커니즘 + 측정 가능한 결과로 대체.
- **Internal FAQ 생략**: External 만 작성하면 회사 내부 의사결정·리스크가 노출되지 않음. Bezos 는 Internal 이 더 중요하다고 강조 — "고객을 위한 PR 보다 팀의 명확성이 먼저".
- **수치 부재**: "더 빠르다 / 더 좋다 / 더 쉽다" — 측정 가능 X. "30 분 안에 PRD 완성 (기존 3 일)" 처럼 baseline + target 명시.
- **PR 후 제품 변경**: PR 을 쓰고 나서 "그 PR 에 부합하지 않는 제품" 을 만들면 working backwards 의 의미 상실. PR 이 변경되면 product spec 도 같이 변경.
- **출시 후 작성**: PR-FAQ 는 **개발 시작 전** 작성해야 효과. 출시 후 작성하면 단순 문서 — Bezos 의 핵심 통찰 (역산 사고) 무력화.
- **자기 만족적 Quote**: 가상 quote 를 "이 제품 정말 멋져요" 식 칭찬으로 채움 — 페르소나·측정 가능 변화 부재. review_recommended=true 가 정확히 이 위험 때문.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 4. design draft 미존재 → Bryar & Carr *Working Backwards* + Bezos 6 페이지 메모 정전 기반 직접 작성. PR 5 단락 + Internal/External FAQ + 작성 체크리스트 10 + anti-pattern 7 |
