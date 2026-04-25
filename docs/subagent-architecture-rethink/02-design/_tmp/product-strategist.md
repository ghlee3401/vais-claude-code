---
agent: product-strategist
phase: design
feature: subagent-architecture-rethink
created: 2026-04-25
---

> Author: product-strategist
> Phase: 02-design
> Refs: 00-ideation/main.md, 01-plan/main.md, 01-plan/scope-recommendation.md, 01-plan/mvp-scope.md, 01-plan/extended-scope.md, CLAUDE.md, vais.config.json

> Summary: VAIS Code 플러그인을 "프로덕트"로 분석. subagent-architecture-rethink 피처가 해소하는 핵심 통증(default-execute anti-pattern)과 만들어내는 가치(mirror→prosthesis 전환)를 Lean Canvas·JTBD·SWOT·Strategy Kernel·3-Year Vision으로 정전 기반 정량화.

---

# VAIS Code — Product Strategy Canvas
## `subagent-architecture-rethink` 피처 전략 컨텍스트

---

## 1. Lean Canvas (Ash Maurya 9 블록)

VAIS Code를 "프로덕트"로, 본 피처가 만들어내는 변화를 "버전 업그레이드"로 보고 작성.

---

### PROBLEM — 상위 3개 핵심 통증

**P-1. Default-execute anti-pattern (확인된, "살아있는 증거")**

release-engineer를 비롯한 다수 sub-agent가 호출되면 필요 여부를 묻지 않고 즉시 산출물 생성에 착수한다. 클라우드를 쓰지 않는 프로젝트에 finops-analyst가 비용 분석을 실행하고, internal tool에 compliance-auditor가 GDPR 감사를 진행하며, 이미 초기화된 프로젝트에 infra-architect가 init을 재실행한다. 이 통증은 "쓸데없이 CI/CD를 만든다"는 사용자 직접 증언으로 확인됐다.

**근본 원인**: sub-agent에게 "만들지 말지"를 판단하는 입력(Project Profile + 실행 정책)이 없음.

**P-2. 분리 기준 자의성 — 같은 플러그인 안의 다른 렌즈**

C-Level마다 sub-agent를 나누는 논리가 다르다. CBO는 도메인 기반, CTO는 기술 레이어 기반, CSO는 검사 유형 기반, CPO는 Phase+산출물 혼합, COO는 시점 기반이다. 통일된 분류 원칙이 없으니 어떤 sub-agent가 어떤 산출물을 왜 만드는지 예측이 불가능하다. 외부 사용자가 VAIS를 처음 볼 때 "이 에이전트가 뭘 하는 거지?"라는 질문에 답할 수 없다.

**P-3. Template·Skill 공백 — AI가 매번 포맷을 새로 발명**

PRD를 제외하면 대부분의 sub-agent에 검증된 프레임워크 기반 template이 없다. SWOT, PEST, Lean Canvas, C4 Diagram, STRIDE, SLO/SLI, Runbook — 모두 template 없음. 결과적으로 AI가 매 호출마다 포맷을 임의로 만들어낸다. 이는 산출물 일관성 부재, 외부 협업자 혼란, AI 환각의 구조적 경로 세 가지 문제를 동시에 발생시킨다.

**현재 불만족스러운 대안**:
- 사용자가 프롬프트로 직접 지시("SWOT 분석해줘, 4분면 표로"): 매번 반복, 공유 불가, 구조 없음
- 범용 AI 도구(ChatGPT, Claude.ai 직접 사용): VAIS 워크플로우와 분리, 맥락 없는 단발 산출물
- 외부 노코드 툴(Notion AI, Canva 등): 플러그인 파이프라인과 연결 없음

---

### CUSTOMER SEGMENTS

**1차 세그먼트 — 1인 기술 창업자 / Solo founder 개발자**

특성:
- 풀스택 or 특정 레이어 전문가. 비즈니스·보안·운영 영역은 상대적 약점
- 혼자서 제품 전체를 책임지기 때문에 "모르는 영역"이 넓다
- 지식 격차를 보완해줄 팀원이 없어서 AI C-Suite 개념에 가장 적합
- ideation 발언: "vais-code의 미성숙은 결국 이걸 만드는 내가 전체 프로덕트 개발에 대한 이해와 지식의 부족에서 오는거라고 생각해"가 이 세그먼트의 통증 진술

**2차 세그먼트 — 소규모 팀 PM / Lead Developer**

특성:
- CPO·CTO 역할을 겸임하는 경우가 많음
- 팀에게 구조화된 산출물을 넘겨야 하지만 작성 시간이 없음
- 검증된 프레임워크(Lean Canvas, ADR, Runbook)가 팀 내 공통어 역할 → template 표준화에 직접 가치

**얼리 어답터 (Early Adopter)**
- Claude Code 플러그인을 이미 사용 중인 개발자 (Claude Marketplace 채택자)
- "AI 워크플로우 자동화"에 개방적이고 프롬프트 엔지니어링 피로를 느끼는 사용자
- GitHub Stars 기반으로 보면 OSS plugin 사용자 커뮤니티

---

### UNIQUE VALUE PROPOSITION

**헤드라인 (1줄)**: AI C-Suite가 당신의 지식 격차를 메우는 의수(prosthesis)가 된다. 모르는 영역도 검증된 프레임워크 기반 산출물로 결정한다.

**서브헤드**: 어떤 sub-agent를 호출해도 당신 프로젝트의 특성(Project Profile)과 실행 정책(A/B/C/D)에 맞는 산출물만 생성한다. "쓸데없이 만드는" AI는 더 이상 없다.

---

### SOLUTION — 상위 3개 접근법

**S-1. Project Profile + 실행 정책 게이트 (핵심 메커니즘)**

ideation 종료 시점에 `project-profile.yaml` 한 번 합의. 이후 모든 sub-agent는 Profile과 4분류 정책(Always/Scope/User-select/Triggered)을 참조해 산출물 생성 여부를 자율 판단. 클라우드 없으면 finops-analyst skip. PII 없으면 DPIA skip. SEO 의존도 없으면 seo-analyst skip.

**S-2. "산출물이 sub-agent를 정의한다" 메타-원칙 적용**

50+ 산출물 카탈로그를 *제품의 탄생* 4단계(Core/Why/What/How)에 매핑. 각 산출물에는 정전 출처, owner sub-agent, 실행 정책, 선행 산출물, 대안이 frontmatter로 명시된다. sub-agent의 정체성은 "무엇을 만드는가"에서 출발한다.

**S-3. Template depth (c) — 채워진 sample + 체크리스트 + anti-pattern 경고**

50+ 산출물 각각에 대해 (a)빈 양식이 아닌 (c)수준 — 실제 채워진 예시 + 작성 체크리스트 + 흔한 실수 경고. AI가 포맷을 새로 발명하는 경로를 차단하고 검증된 프레임워크를 그대로 전달.

---

### CHANNELS

**직접 채널**:
- Claude Code Marketplace (1차 배포 채널) — `/vais` 커맨드로 즉시 활성화
- GitHub `ghlee3401/vais-claude-code` (OSS 직접 설치)

**간접/콘텐츠 채널**:
- "AI로 Lean Canvas 작성하기" 류 기술 블로그 콘텐츠 (product-strategist template 결과물 공유)
- Hacker News / Product Hunt 론칭 (v1.0 stable 시점)
- 개발자 커뮤니티 (KCD Korea, Seoul.js, AWSKRUG) 데모

---

### REVENUE STREAMS (오픈소스/플러그인 맥락)

VAIS Code는 현재 OSS (MIT-adjacent). 직접 수익 모델 미활성 상태.

**수익 경로 가설 (비활성)**:
- R-1. Claude Marketplace 프리미엄 플러그인 (Claude 유료 구독자 대상 $5~20/month)
- R-2. Enterprise 커스터마이징 — 사내 Project Profile schema + 전용 template 세트 서비스
- R-3. Advisor Tool 호출 비용 pass-through (advisor.monthly_budget_usd=200 현재 사용자 부담)

**현재 단계**: 사용자 개인 사용 + OSS 채택 → revenue_model: none.
**monetization_active: false** (vais.config.json 기준).

LTV 가정: OSS 단계에서는 GitHub Stars, Claude Marketplace 설치 수, 기여자 수가 대리 지표.

---

### COST STRUCTURE

**고정비 (시간 비용 기준)**:
- Anthropic API (Advisor Tool) — 월 $200 예산 (vais.config.json: advisor.monthly_budget_usd)
- 설계·문서 작성 시간 (본 피처 기준: 14~22주 예상, extended-scope.md)

**변동비**:
- Claude API 호출 비용: opus=C-Level($15/MTok input), sonnet=sub-agent($3/MTok input)
- sub-agent 재정의 시 테스트 실행 비용

**CAC (User Acquisition Cost)**:
- OSS 모델에서 CAC는 콘텐츠 작성 시간 + 커뮤니티 활동 시간으로 대체
- 실질 CAC: 피처 1개 개발 시간 / GitHub 신규 Star 수 로 추정

---

### KEY METRICS (AARRR 기반)

**North Star Metric**: "유해 산출물 차단율" — Project Profile 정책으로 skip된 산출물 비율. 목표: 한 세션에서 호출된 sub-agent 중 30%+ 가 Profile 기준 자동 skip.

**AARRR 분해**:

| Funnel | 지표 | 측정 방법 |
|--------|------|----------|
| Acquisition | GitHub Star 증가율 / Claude Marketplace 설치 수 | GitHub API / Marketplace 대시보드 |
| Activation | 최초 `/vais ceo` 실행 후 `project-profile.yaml` 생성 완료율 | `.vais/event-log.jsonl` |
| Retention | 7일 내 2회 이상 `/vais` 호출 비율 | event-log 분석 |
| Referral | OSS PR 기여자 수 / 블로그 공유 링크 수 | GitHub Insights |
| Revenue | (현재 없음) API 비용 절감액 (skip 덕분에 미발생한 토큰) | advisor-spend.json |

**SC-01~05 (plan 단계 success criteria 승계)**:
- SC-01: default-execute anti-pattern 해소 — 5개 점검 sub-agent 모두 정책 적용 확인
- SC-02: 산출물 50+ 중 우선 25개 template (depth c) 작성 완료
- SC-03: Project Profile ideation hook 작동 — ideation 종료 시 profile.yaml 자동 생성
- SC-04: release-engineer 5분해 완료 + deprecation alias 정리
- SC-05: 잘못된 매핑 정정 — Value Proposition Canvas → product-strategist

---

### UNFAIR ADVANTAGE

**방어성 요소 (경쟁사가 쉽게 복제 불가한 것)**:

1. **정전 기반 산출물 카탈로그**: 50+ 산출물을 Rumelt/Cagan/Torres/Osterwalder/SRE Book/DORA 등 정전과 1:1 매핑. 이 매핑 자체가 몇 달간의 큐레이션 결과물. 단순 "template 추가"로는 복제 불가.

2. **Project Profile × 실행 정책 조합**: Profile schema 12개 변수 × 정책 4분류 = 48개 교차 판단 규칙. 규칙 하나하나가 실제 통증(finops on non-cloud, GDPR on internal-tool)에서 역산됨. "그냥 따라 만드는" 것보다 실제 사용 데이터 없이 만들기 어려움.

3. **C-Level 레이어 아키텍처 + PDCA 워크플로우**: 단일 에이전트 또는 flat multi-agent와 달리 전략-전술-실행 3계층 + 게이트 + 의존성 규칙. 이 아키텍처가 하루 이틀에 복제되지 않는 진입 장벽.

4. **사용자 지식 거울이 아닌 의수(prosthesis)**: mirror-to-prosthesis 전환 개념. 사용자가 모르는 영역을 AI가 채우되, 모름 자체를 드러내는 구조. 경쟁사 대부분은 "사용자가 아는 만큼만 실행"하는 mirror 구조.

---

## 2. JTBD 6-Part Value Proposition (Ulwick / Christensen)

**타깃 세그먼트**: 1인 기술 창업자 또는 PM 겸임 개발자

---

| JTBD 파트 | 내용 |
|-----------|------|
| **When** | 새 서비스 피처를 만들기 시작할 때, 또는 기존 서비스의 특정 영역(보안, 배포, 비용 최적화)을 점검하려 할 때 |
| **I want to** | 내가 잘 모르는 영역(마케팅, 재무, 보안, 운영)까지 검증된 프레임워크 기반 산출물을 빠르게 얻고 싶다 |
| **So I can** | 혼자서도 팀이 있는 것처럼 전 영역을 커버하고, 결정의 근거를 정전 수준으로 만들어 이해관계자에게 설명할 수 있다 |
| **Better than** | 범용 AI(ChatGPT/Claude.ai)에 "SWOT 분석해줘"라고 던지는 것보다 — 맥락이 없고, 포맷이 매번 다르고, 피처 히스토리와 단절된다 |
| **Available alternatives** | 범용 AI 직접 사용 / Notion AI / 외부 컨설턴트 고용 / 프레임워크 책을 읽고 직접 작성 |
| **Constraints** | 빠른 속도 필요 (스타트업 빠른 피벗 주기) / 비용 통제 필요 (개인/소규모 팀) / 내가 모든 정전을 알 수 없다는 인식 한계 |

---

**JTBD Statement (Ulwick 포맷)**:

> "나는 새 피처를 만들거나 기존 서비스를 점검할 때, 내가 잘 모르는 도메인에서도 검증된 프레임워크 기반 산출물을 즉시 얻고 싶다. 왜냐하면 팀원 없이 혼자 전 영역을 커버하면서 이해관계자에게 설득력 있는 근거를 만들어야 하기 때문이다. 현재는 범용 AI에 불특정 포맷으로 물어보는데, 매번 다른 결과가 나오고 이전 결정과 연결이 안 된다."

---

**Value Proposition Statement**:

VAIS Code는 1인 기술 창업자와 소규모 팀 PM에게, "내가 모르는 영역을 채워주는 AI 의수"다. 어떤 sub-agent를 호출해도 프로젝트 특성(Project Profile)에 맞는 산출물만 생성하고, 그 산출물은 정전(Rumelt·Cagan·Torres·SRE Book·DORA)이 검증한 포맷을 그대로 따른다.

**Geoffrey Moore Positioning Statement**:

> "For solo founders and small-team PMs who need full product coverage without a full team, VAIS Code is the AI C-Suite plugin that delivers canon-grounded deliverables matched to your project's actual profile — unlike generic AI tools that generate arbitrary formats with no workflow continuity, VAIS knows what to build, what to skip, and why."

---

## 3. 4단계 메타-프레임 시각화 (*제품의 탄생*)

### Core / Why / What / How — VAIS 산출물 매핑 + 정전 cross-reference

```
+------------------+---------------------------------+---------------------------+
| 단계              | VAIS 산출물 (본 피처 카탈로그)    | 정전 cross-reference        |
+------------------+---------------------------------+---------------------------+
| CORE (5장)        |                                 |                           |
| 존재이유·전략·비전   | Vision Statement / BHAG         | Collins "Built to Last"   |
|                  | Strategy Kernel                 | Rumelt "Good Strategy"    |
|                  | OKR                             | Grove / Doerr             |
|                  | Working Backwards PR/FAQ        | Amazon WB                 |
|                  | 3-Horizon Strategy              | McKinsey / Baghai         |
+------------------+---------------------------------+---------------------------+
| WHY (6장)         |                                 |                           |
| 누구를·어떤 상태로  | PEST(LE) 분석                   | 거시환경 표준                |
| ·왜 우리가         | Porter's Five Forces            | Porter 1979               |
|                  | SWOT 분석                       | Humphrey / Albert         |
|                  | TAM / SAM / SOM                 | Steve Blank               |
|                  | JTBD 6-Part Statement           | Ulwick / Christensen      |
|                  | Persona / Empathy Map           | Cooper / Dave Gray        |
|                  | Customer Journey Map            | Service Design (Stickdorn)|
|                  | Opportunity Solution Tree       | Torres "Continuous Disc." |
|                  | Forces of Progress              | Christensen "Comp. Luck"  |
|                  | Value Proposition Canvas        | Osterwalder VPC           |
|                  | Kano Model                      | Kano 1984                 |
+------------------+---------------------------------+---------------------------+
| WHAT (7장)        |                                 |                           |
| 솔루션·UX·BM·      | Lean Canvas                     | Maurya "Running Lean"     |
| 로드맵             | Business Model Canvas           | Osterwalder BMG           |
|                  | North Star Metric Framework     | Ellis / Amplitude         |
|                  | AARRR (Pirate Metrics)          | McClure 2007              |
|                  | HEART Framework                 | Google HEART              |
|                  | Information Architecture        | Rosenfeld / Morville      |
|                  | Wireframe Spec                  | UX 표준                   |
|                  | Roadmap (Now-Next-Later)        | ProductPlan / Seiden      |
|                  | RICE Prioritization             | Intercom (Laffey)         |
|                  | MoSCoW Prioritization           | DSDM                      |
|                  | User Story + INVEST             | Cohn                      |
|                  | Pricing Tier Canvas             | SaaS 표준                 |
+------------------+---------------------------------+---------------------------+
| HOW (8장)         |                                 |                           |
| 구현·보안·출시·     | PRD (표준 섹션)                  | Cagan INSPIRED / Lenny    |
| 후속               | ADR                             | Nygard 2011               |
|                  | C4 Model Diagrams               | Simon Brown C4            |
|                  | RFC / Technical Design Doc      | Google / Stripe 내부 표준  |
|                  | API Spec (OpenAPI)              | OpenAPI Initiative        |
|                  | ER Diagram / Sequence Diagram   | OMG UML                   |
|                  | STRIDE Threat Model             | Microsoft STRIDE          |
|                  | OWASP ASVS Checklist            | OWASP                     |
|                  | DPIA                            | GDPR Art.35               |
|                  | Test Plan / Test Case Matrix    | ISTQB                     |
|                  | Runbook / Incident Playbook     | Google SRE Book           |
|                  | SLI / SLO Definition            | Google SRE Book           |
|                  | Postmortem (Five Whys)          | Etsy / Google SRE         |
|                  | Release Notes / CHANGELOG       | Keep a Changelog          |
|                  | DORA Metrics Dashboard          | DORA / Forsgren Acc.      |
+------------------+---------------------------------+---------------------------+
```

### 본 피처 (`subagent-architecture-rethink`)가 각 단계에서 다루는 산출물

| 단계 | 본 피처의 역할 | 핵심 결정 |
|------|-------------|----------|
| **Core** | CEO sub-agent 공백 해소 — vision-author, strategy-kernel-author, okr-author, pr-faq-author 신설 | CEO의 2개→7개 sub-agent |
| **Why** | product-strategist로 Value Proposition Canvas 재매핑. PEST/Five Forces/SWOT/JTBD template (c) 신규 | 잘못된 매핑 정정 + template 공백 해소 |
| **What** | Lean Canvas / BMC / NSM / Roadmap template 신규. roadmap-author 신설 | What 단계 BM 산출물 체계화 |
| **How** | release-engineer 5분해. ADR/C4/STRIDE/Runbook/Test Plan template 신규. 의심 5 sub-agent 정책 적용 | default-execute anti-pattern 해소 |

### 정전 4단계 위치 매핑 표

| 정전 | 4단계 위치 | 핵심 기여 개념 |
|------|-----------|-------------|
| Rumelt *Good Strategy/Bad Strategy* | Core | Strategy Kernel (Diagnosis/Policy/Actions) |
| Doerr *Measure What Matters* | Core | OKR (Objective + Key Results) |
| Collins *Built to Last* | Core | BHAG + Vision Statement |
| Amazon Working Backwards | Core + Why | PR/FAQ — customer outcome first |
| McKinsey 3-Horizons | Core | 단기/중기/장기 전략 포트폴리오 |
| Cagan *INSPIRED/EMPOWERED* | Why + What + How | Product Trio, Discovery vs Delivery |
| Torres *Continuous Discovery Habits* | Why | Opportunity Solution Tree |
| Christensen *Competing Against Luck* | Why | JTBD, Forces of Progress |
| Osterwalder *Business Model Generation* | Why + What | BMC, Value Proposition Canvas |
| Maurya *Running Lean* | What | Lean Canvas |
| Skelton *Team Topologies* | How | Cognitive Load 분리 원칙 → sub-agent 분리 기준 |
| DORA *Accelerate* | How | Four Key Metrics (Deployment Freq, Lead Time, MTTR, CFR) |
| Google *SRE Book* | How | Runbook, SLI/SLO, Postmortem |
| Microsoft STRIDE | How | Threat Model |
| OWASP | How | ASVS Checklist |
| ISTQB | How | Test Plan / Test Case Matrix |
| Steve Blank *Four Steps to the Epiphany* | Why | TAM/SAM/SOM, Customer Discovery |

---

## 4. SWOT (VAIS Code 자체)

### Strengths (강점)

| 강점 | 설명 |
|------|------|
| **S1. C-Suite 레이어 아키텍처** | 전략(Opus) + 실행(Sonnet) 2계층. 단일 에이전트 대비 책임 분리 명확 |
| **S2. PDCA 게이트 워크플로우** | plan→design→do→qa 순서 강제. "기획 없이 코드 금지" 원칙으로 품질 구조화 |
| **S3. Claude Code 네이티브 통합** | Marketplace 플러그인으로 즉시 활성. `/vais` 커맨드 단일 진입점 |
| **S4. 산출물 추적성** | `docs/{feature}/{phase}/main.md` + `_tmp/{slug}.md` 이중 구조. 모든 결정 근거 git 보존 |
| **S5. CEO 동적 라우팅** | 피처 성격에 따라 C-Level 조합을 동적 추천. 사용자 승인 후 실행 |
| **S6. 정전 기반 설계 의도** | CPO/CBO/COO/CSO 각 C-Level에 Reference Canon 명시 (INSPIRED/SRE Book/DORA 등) |

### Weaknesses (약점)

| 약점 | 설명 |
|------|------|
| **W1. Sub-agent default-execute anti-pattern** | 본 피처가 해결하려는 핵심 통증. 어떤 sub-agent도 "필요 여부" 판단 없이 즉시 실행 |
| **W2. 분리 기준 자의성** | 5개 C-Level이 각자 다른 렌즈로 sub-agent를 나눔. 통일 원칙 없음 |
| **W3. Template·Skill 공백** | PRD 외 대부분 template 없음. AI가 포맷을 매번 새로 발명 |
| **W4. CEO sub-agent 빈약** | absorb-analyzer + skill-creator 2개뿐. 전략(Vision/OKR/Strategy Kernel) 전담 없음 |
| **W5. includes[] 런타임 미통합** | frontmatter includes[] 가 sub-agent context에 로드되지 않음. 공유 가드 블록을 모든 파일에 복붙해야 함 |
| **W6. 지식 거울 구조** | 사용자가 아는 만큼만 VAIS 구조에 반영됨. 모르는 영역은 sub-agent도 미성숙 (COO 4개가 대표 증거) |

### Opportunities (기회)

| 기회 | 설명 |
|------|------|
| **O1. Claude Code Marketplace 성장** | AI 개발 도구 시장 고성장. 플러그인 생태계 확대 |
| **O2. AI-native 워크플로우 수요** | "AI로 전체 개발 라이프사이클"에 대한 개발자 수요 급증 |
| **O3. 정전 기반 차별화** | 경쟁사 대부분은 generic prompt. 정전 매핑 + template 표준화는 뚜렷한 차별화 |
| **O4. Enterprise 수요** | 사내 표준 산출물(ADR, Runbook, DPIA 등)을 AI로 자동화하고 싶은 기업 팀 |
| **O5. OSS 커뮤니티 기여** | 정전 기반 template 공개 → PR 기여자 → VAIS 개선 선순환 |
| **O6. Advisor Tool 활용 확장** | Anthropic Advisor Tool API (vais.config.json advisor 설정) — 복잡한 분석에 opus 활용 증가 |

### Threats (위협)

| 위협 | 설명 |
|------|------|
| **T1. 범용 AI 도구의 빠른 진화** | ChatGPT / Claude.ai 자체가 더 나은 워크플로우 지원 → VAIS 차별화 감소 |
| **T2. GitHub Copilot Workspace / Devin의 직접 경쟁** | 코드 레이어에서 AI-native IDE 통합. CTO 역할 잠식 가능 |
| **T3. Anthropic 플랫폼 정책 변경** | Claude Code API / Marketplace 정책이 바뀌면 플러그인 구조 전면 재작업 |
| **T4. Sub-agent proliferation 피로** | 44→48+ sub-agent — 사용자가 복잡도에 질려 이탈 |
| **T5. 정전 단일 정박 리스크** | *제품의 탄생* 1권 의존 → 편향. 다른 정전과 cross-reference로 완화 (D-7) |

---

## 5. Strategy Kernel (Rumelt — Diagnosis / Guiding Policy / Coherent Actions)

Rumelt의 "Good Strategy/Bad Strategy"에서 Strategy Kernel은 3원소(진단/지도 정책/일관된 행동)로 구성된다. 본 피처(`subagent-architecture-rethink`)의 전략 핵심을 이 포맷으로 분해한다.

---

### DIAGNOSIS (진단) — 문제의 정확한 성격 규정

> "VAIS Code의 44개 sub-agent는 분리 기준이 C-Level마다 자의적이고, 어떤 sub-agent도 프로젝트 특성에 따라 실행 여부를 스스로 판단하지 않으며, 산출물 포맷은 검증된 프레임워크가 아닌 AI의 즉흥 생성에 의존한다. 이는 사용자의 지식 부족이 원인이 아니라, 모름을 시스템에 내재화하는 프로토콜의 부재가 원인이다."

핵심 진단:
- 분류 원칙 부재 (symptom: 5개 C-Level이 각자 다른 렌즈 사용)
- 실행 판단 메커니즘 부재 (symptom: release-engineer "쓸데없이 CI/CD 만든다")
- 산출물 포맷 표준 부재 (symptom: PRD 제외 template 없음 → AI 즉흥 발명)

---

### GUIDING POLICY (지도 정책) — 진단에 응수하는 방향 원칙

> "산출물(검증된 프레임워크)이 sub-agent의 정의·경계·계약을 결정한다. Project Profile이 실행 정책을 제어한다."

지도 정책 2개:
1. **산출물 우선**: sub-agent를 먼저 정의하고 산출물을 나중에 붙이는 게 아니라, 정전에서 산출물을 먼저 정의하고 그 산출물을 만드는 sub-agent를 역산한다.
2. **Profile 기반 실행 제어**: "무엇을 만들 것인가"는 Project Profile + 4분류 정책이 결정한다. sub-agent는 실행 여부를 스스로 판단하지 않는다 — 시스템이 판단하고 sub-agent는 실행한다.

---

### COHERENT ACTIONS (일관된 행동) — 지도 정책을 구체화하는 행동 집합

| # | 행동 | 지도 정책 연결 |
|---|------|-------------|
| CA-1 | *제품의 탄생* 4단계(Core/Why/What/How)로 50+ 산출물 카탈로그 재구성 | 산출물 우선 |
| CA-2 | 각 산출물에 정전 출처, owner sub-agent, 실행 정책, 대안을 frontmatter로 명시 | 산출물 우선 + Profile 기반 제어 |
| CA-3 | Project Profile schema 확정 + ideation 종료 hook에 합의 단계 추가 | Profile 기반 제어 |
| CA-4 | release-engineer 5분해 + 의심 5 sub-agent 정책 적용 (시범) | Profile 기반 제어 |
| CA-5 | Template depth (c) 작성 — 채워진 sample + 체크리스트 + anti-pattern | 산출물 우선 |
| CA-6 | 44개 전체 sub-agent anti-pattern 점검 매트릭스 실행 (확장 범위 C) | 두 정책 모두 |
| CA-7 | 단계 간 alignment 메커니즘 (α auto-judge + β alignment 산출물) 설계 | 산출물 우선 |

---

## 6. 3-Year Vision (3-Horizon Model)

### H1 — Now: 본 피처 완료 직후 (2026 Q2~Q3)

**상태**: VAIS Code v1.0 stable. sub-agent 아키텍처 정전 기반 재정의 완료.

**달성 항목**:
- 50+ 산출물 카탈로그 — *제품의 탄생* 4단계 분류 + 정전 cross-reference 완료
- Project Profile schema v1 (`project-profile.yaml`) — ideation 종료 hook 작동
- Template depth (c) — 25개 우선 완료 (Core 5 / Why 5 / What 5 / How 5 / 사업재무 5)
- Sub-agent 재정의 — release-engineer 5분해 + 의심 5 정책 적용 완료
- CEO sub-agent 7개 (vision-author, strategy-kernel-author, okr-author, pr-faq-author 신설)
- COO sub-agent 9개 (release-engineer 분해 완료)

**사용자 경험 변화**:
> "finops-analyst가 클라우드 없는 내 프로젝트에서 자동으로 skip됐다. SWOT 분석을 요청하니 Humphrey 방식 체크리스트가 채워진 예시와 함께 나왔다."

**지표 기준값**:
- 유해 산출물 차단율: 목표 30%+ skip (Profile B 정책 자동 판단)
- Template 작성 완료율: 25/50개 (50%)
- Sub-agent 점검 완료율: 10/44개 (23%)

---

### H2 — 1~2년: Epistemic Contract + Uncertainty Reporting + Absorb 강제화 (2027~2028)

**상태**: VAIS Code v2.0. "모름의 시스템 처리" 프로토콜 레이어 도입.

**핵심 이니셔티브** (현재 선반 보관, D-11):

**Epistemic Contract (인식론적 계약)**:
- C-Level 각각이 자신의 지식 한계를 명시하는 메커니즘
- 예: "market-researcher: PEST 분석은 공개 데이터 기반, 내부 경쟁사 데이터 없음 → 신뢰도 70%"
- 사용자가 산출물의 신뢰 구간을 인식하고 결정

**Uncertainty Reporting**:
- 각 산출물에 `confidence:` 필드 (0~100). 데이터 소스, 가정, 불확실성 명시
- CEO가 C-Level 결과 취합 시 전체 uncertainty score 리포트 → 사용자에게 투명하게 전달

**Absorb 대화 강제**:
- 외부 reference 흡수(absorb-analyzer) 시 사용자와 1:1 대화 세션 강제
- "이 reference에서 어떤 sub-agent를 강화하고 싶은가?"를 반드시 확인
- 현재: 일방적 흡수 → 이후: 사용자 지식 지도와 공동 업데이트

**Sub-agent alignment 검증**:
- C-Level 전환 전 auto-judge (α): 이전 단계 산출물 키워드/엔티티 일치율 자동 검사
- alignment 산출물 (β): `alignment-core-why.md`, `alignment-why-what.md`, `alignment-what-how.md` 신설
- 불일치 감지 시 CEO가 사용자에게 경고 → 수정 후 진행

**지표 목표**:
- 산출물 신뢰도 평균: 75%+ (uncertainty reporting 기반)
- 단계 간 alignment 검증 통과율: 90%+ (auto-judge α 기준)
- Template 완성률: 50/50 (100%)

---

### H3 — 3년+: VAIS Code Ecosystem (2029+)

**비전**: VAIS Code가 "AI 보조 제품 개발의 공통 언어"가 된다.

**생태계 구성 요소**:

**Community Template Registry**:
- 커뮤니티가 산출물 template을 기여하고 peer-review 하는 오픈 레지스트리
- `vais install @community/sre-runbook-v2` 형태로 custom template 설치
- 정전 기반 품질 검증 (artifact frontmatter의 canon_source 필수)

**Project Profile Marketplace**:
- 업종별 Project Profile preset — "B2B SaaS Series A용 Profile", "규제 헬스케어 앱용 Profile"
- 커뮤니티가 검증한 Profile을 one-click 적용

**VAIS Federation**:
- 여러 프로젝트의 VAIS 산출물을 cross-reference
- "이 서비스와 비슷한 Profile에서 어떤 Lean Canvas를 썼나?" 유사 산출물 검색

**Enterprise VAIS**:
- 사내 template 레지스트리 (회사 고유 산출물 표준)
- 사내 Project Profile preset (인증/보안 요구사항 사전 정의)
- C-Level agent 커스터마이징 (회사 정전 + 외부 정전 혼합)

**경제 모델**:
- OSS Core (MIT) + Enterprise 구독 (Template Registry 호스팅 + support)
- Community template 기여자 인센티브 (API credit)

---

## 7. Differentiation vs 경쟁 포지셔닝

### vs AutoGPT / CrewAI

AutoGPT와 CrewAI는 "multi-agent orchestration"을 제공하지만, 도메인 무관 범용 에이전트다. 에이전트 역할을 사용자가 직접 정의해야 하고, 정전 기반 산출물 카탈로그나 실행 정책 시스템이 없다. VAIS Code는 "AI C-Suite"라는 도메인 특화 레이어 — 소프트웨어 제품 개발 전체 라이프사이클에 맞춰 6 C-Level 역할이 사전 정의되어 있고, 각 역할은 검증된 정전에 기반한 산출물 계약을 가진다. "에이전트 팀을 구성하는 사람"이 AutoGPT/CrewAI의 사용자라면, "이미 구성된 전문가 팀에 요청하는 사람"이 VAIS Code의 사용자다.

### vs LangGraph / LlamaIndex Workflows

LangGraph는 agent workflow를 코드로 정의하는 개발자 프레임워크다. VAIS Code의 C-Level 파이프라인도 유사한 DAG 구조지만, 핵심 차이는 "사용 주체"다. LangGraph는 에이전트를 만드는 개발자용 인프라이고, VAIS Code는 에이전트를 사용하는 (비)개발자용 제품이다. VAIS Code를 LangGraph 위에 구현하는 것이 이론적으로 가능하지만, VAIS Code의 가치는 구현 스택이 아니라 C-Suite 개념 모델 + 산출물 카탈로그 + 정책 시스템의 조합에 있다.

### vs Devin / GitHub Copilot Workspace

Devin과 Copilot Workspace는 "코드 작성 자동화"에 특화된다. CTO 역할의 일부(frontend-engineer, backend-engineer)와 겹친다. 그러나 VAIS Code는 코드 이전의 전략(Core)·기획(Why·What)·보안(CSO)·운영(COO)·비즈니스(CBO)를 커버한다. Devin이 "어떻게 만들지"의 에이전트라면, VAIS Code는 "만들어야 하는지, 무엇을 만들지, 어떻게 검증하지"까지 포함한다. Devin에게 없는 것: Lean Canvas, JTBD, Strategy Kernel, Threat Model, SLO, Postmortem — 이것이 VAIS Code의 실질 포지셔닝 공간이다.

### vs 일반 Claude Code Plugin (범용)

Claude Code에는 다른 범용 플러그인들이 있지만, 대부분은 특정 기능(linting, test generation, documentation)에 집중한다. VAIS Code는 단일 피처 플러그인이 아닌 전체 제품 개발 워크플로우 오케스트레이터다. CEO → CPO → CTO → CSO → COO 순서로 흐르는 파이프라인은 다른 플러그인에 없다. 차이점을 한 문장으로: "다른 플러그인은 개발자의 손을 확장하고, VAIS Code는 개발자의 팀을 확장한다."

---

## 메타-메모 (design phase 입력용)

본 문서는 `subagent-architecture-rethink` design phase의 전략 컨텍스트로 활용된다. design phase에서 다음 결정들이 필요하다:

1. **alignment 메커니즘 최종 선택**: α(auto-judge) / β(alignment 산출물) / γ(CEO 게이트) 중 조합 결정 (extended-scope.md 권장: α+β)
2. **Template 우선순위 25개 작성 순서**: Core 5개 → Why 5개 → What 5개 순 또는 통증이 큰 순(How 5개 먼저)?
3. **Project Profile schema v1 최종 확정**: mvp-scope.md 12개 변수 그대로 vs 추가 변수 여부
4. **신규 sub-agent 7개 정의 범위**: vision-author / strategy-kernel-author / okr-author / pr-faq-author / roadmap-author / 분해된 COO 5개

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — product-strategist, design phase. Lean Canvas 9블록 + JTBD 6-Part + 4단계 시각화 + SWOT + Strategy Kernel + 3-Year Vision + 경쟁 포지셔닝 |
