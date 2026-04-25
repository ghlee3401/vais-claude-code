---
artifact: strategy-kernel
owner_agent: strategy-kernel-author
phase: core
canon_source: "Rumelt 'Good Strategy / Bad Strategy' (2011), Crown Business"
execution:
  policy: always
  intent: strategy-definition
  prereq: [vision-statement]
  required_after: [okr, roadmap]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "Core 단계 두 번째 산출물 — Vision 을 실행 가능한 전략으로 변환. review_recommended=true: 진단(Diagnosis)이 자기기만적이거나 Guiding Policy 가 trade-off 를 회피하면 전체 OKR/Roadmap 이 무너짐."
---

# Strategy Kernel

> **canon**: Rumelt *Good Strategy / Bad Strategy* (2011), Part I "Good and Bad Strategy" — 좋은 전략의 핵심 3-단계 구조 (the kernel).
>
> **경고 (Rumelt 2장)**: 대부분의 "전략"은 **bad strategy** 임 — 목표 나열 + 슬로건 + "더 잘하자" 식 wishful thinking. **kernel 은 진단 → 정책 → 행동의 인과 사슬** 이어야 함.
>
> **review_recommended=true 이유**: Diagnosis 가 진짜 핵심 문제인지 자기기만적 검증 필수. 사용자 1인 작성 시 확증편향 위험.

---

## 구조 (Rumelt's Kernel)

### 1. Diagnosis (진단)

> **정의**: 현실의 복잡성을 단순화하여 핵심 문제/기회 1~2개를 정의. Rumelt: "전략의 가장 어려운 부분은 무엇이 진짜 문제인지 식별하는 것."
>
> **포함**: 시장·내부·경쟁·기술 4축 중 가장 결정적 장애물. 증거(데이터·사례·관찰) 동반.
>
> **배제**: 목표("매출 2배"), 슬로건("혁신"), wishful thinking.

[3~5 문장]

### 2. Guiding Policy (정책)

> **정의**: Diagnosis 에 대응하는 전략적 접근. **무엇을 할지 + 무엇을 하지 않을지** 명시.
>
> **특징**: 방향성 (구체적 행동 X). 1~2 문장. **trade-off 명시** (한쪽을 버려야 다른 쪽을 잡는다).

[1~2 문장]

### 3. Coherent Actions (행동)

> **정의**: 정책을 강화하는 행동 목록. 행동들이 서로 **상호 강화** (mutually reinforcing) 해야 함 — Rumelt 의 핵심 검증 기준.

| # | 행동 | 정책과의 연결 | 상호 강화 (다른 행동과 시너지) |
|:-:|------|--------------|-------------------------------|
| 1 | ... | ... | (예: 행동 2, 3 과 결합 시 효과 증폭) |
| 2 | ... | ... | ... |
| 3 | ... | ... | ... |

---

## (작성된 sample)

**제품**: VAIS Code (AI C-Suite Plugin)

### 1. Diagnosis

VAIS 의 44 개 sub-agent 는 호출되면 무조건 산출물을 생성하는 "default-execute" 패턴이다. 사용자의 프로젝트 맥락 (B2B SaaS vs 개인 OSS 플러그인 / MVP vs Scale / cloud vs local-only) 과 무관하게 동일 산출물을 만들어, 결과적으로 "쓸데없이 CI/CD 를 만든다" 같은 마찰이 6 개 sub-agent 에서 동일 패턴으로 확인된다 (release-engineer / infra-architect / test-engineer / seo-analyst / finops-analyst / compliance-auditor). **근본 문제는 sub-agent 행동 모델에 맥락 인식 메커니즘이 없다는 점이다** — 이는 단일 sub-agent 의 prompt 수정으로 해결되지 않는 시스템 차원 결함이다.

### 2. Guiding Policy

VAIS 의 모든 sub-agent 는 **Project Profile (12 변수) + 산출물 메타데이터 정책 (4 분류: Always / Scope / User-select / Triggered)** 의 조합으로 동작한다. 범용 AI 처럼 "모든 가능한 산출물을 만든다" 방향이 아닌, **이 프로젝트에 맞는 산출물만 만든다** 방향으로 정렬한다 — 이때 "맞지 않는 산출물 생성 능력"은 명시적으로 포기한다 (trade-off).

### 3. Coherent Actions

| # | 행동 | 정책과의 연결 | 상호 강화 |
|:-:|------|--------------|-----------|
| 1 | ideation 종료 시 Project Profile 12 변수 합의 → `.vais/profile.yaml` 저장 | 맥락 포착의 단일 진입점 (Single Source of Context) | 행동 2, 3 모두 profile.yaml 을 입력으로 사용 |
| 2 | 모든 template frontmatter 에 `execution.scope_conditions` 정의 → validator 강제 | 정책이 데이터로 표현되어 코드가 실행 | 행동 1 의 profile 과 행동 4 의 catalog 가 결합되어야 효과 발생 |
| 3 | release-engineer 5 분해 — scope 별 sub-agent 분리 (release-notes-writer / ci-cd-configurator / container-config-author / migration-planner / runbook-author) | 가장 큰 마찰 직접 해소 + 정책 적용 시범 사례 | 행동 2 의 frontmatter 정책이 5 개 신규 sub-agent 에서 즉시 검증됨 |
| 4 | 50+ 산출물 카탈로그 (depth c) — 정전 출처 + scope_conditions + checklist + anti-pattern 명시 | 맥락-산출물 계약을 신뢰 가능하게 (auditable) | 행동 1, 2 의 데이터 모델을 채우는 콘텐츠 |

→ **상호 강화 검증**: 4 개 행동 중 어느 하나라도 빠지면 나머지가 무력화 (행동 1 없으면 2 의 scope 평가 불가 / 행동 2 없으면 4 의 카탈로그가 정책 데이터 없음 / 행동 3 없으면 가장 가시적 사례 미해소 / 행동 4 없으면 1·2·3 의 빈 그릇).

---

## 작성 체크리스트

- [ ] Diagnosis 가 "현실을 단순화" 하고 있는가? (목표 나열·슬로건 아닌 진짜 문제 식별)
- [ ] Diagnosis 가 증거 (데이터·사례·관찰) 에 기반하는가? (직관·wishful thinking 아닌가)
- [ ] Guiding Policy 가 trade-off 를 명시하는가? (무엇을 **안 하는가**? 무엇을 포기하는가?)
- [ ] Coherent Actions 들이 서로 **상호 강화** 하는가? (한 행동이 빠지면 다른 행동이 무력화되는가)
- [ ] 전략이 "경쟁자가 쉽게 복제할 수 없는" 방향인가? (Rumelt 의 leverage 원칙)
- [ ] `review_recommended=true` 이유가 문서 내 명시되어 있는가? (Diagnosis 자기기만 위험 등)
- [ ] Vision Statement (`prereq`) 와 일관되며 BHAG 달성을 향한 분기 단위 행동인가?

---

## ⚠ Anti-pattern

- **Fluff + Wish**: "우리는 업계 최고가 될 것이다" / "고객 가치를 극대화한다" — 진단 없는 선언 + wishful thinking. Rumelt 가 "bad strategy" 의 대표 사례로 든 형태. 측정도 trade-off 도 없다.
- **행동 목록 = 전략**: 할 일 (Todo) 을 나열하면 전략이 아닌 작업 계획. Coherent Actions 는 **공통 정책을 강화** 해야 하며, 서로 독립적이면 단순 백로그.
- **모든 것이 우선**: "모든 기능이 중요하다" / "전 영역에서 1등" — 우선순위 결여. 전략의 본질은 **선택과 집중** 이며 자원이 한정되어 있음을 인정해야 함.
- **Diagnosis 회피**: 곤란한 진실 (예: "우리의 핵심 가설이 틀렸다") 을 외면하고 외부 요인 (시장·경쟁사) 만 진단. 자기기만의 가장 흔한 형태 — review_recommended 가 정확히 이 위험 때문.
- **목표를 정책으로 위장**: "30% 성장 달성" 을 Guiding Policy 에 넣음 — 그러나 이는 KR (OKR 의 Key Result) 이지 정책이 아님. 정책은 "어떻게 도달할지의 방향" 이지 도달 지점이 아님.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Sprint 4 Day 2. design `_tmp/infra-architect.md` §6.2 draft 정식 이관 + 상호 강화 검증 단락 추가 + anti-pattern 3→5 확장 |
