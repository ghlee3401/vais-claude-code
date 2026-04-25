---
agent: product-researcher
phase: design
feature: subagent-architecture-rethink
created: 2026-04-25
---

# subagent-architecture-rethink — design — product-researcher

> Author: product-researcher
> Phase: 02-design
> Refs: docs/subagent-architecture-rethink/00-ideation/main.md, docs/subagent-architecture-rethink/01-plan/extended-scope.md, agents/ (전 sub-agent frontmatter)
> Summary: VAIS 44 sub-agent 내부 진단 + AI agent orchestration 경쟁 프레임워크 5종 분석 + TAM/SAM/SOM + 3 JTBD 페르소나 + Reference Canon 검증 + Journey Map (현재/목표 대조) — design phase CPO 큐레이션 인풋.

---

## 1. Context

- **작업 요청**: CPO 위임. design phase에서 시장/사용자/경쟁 리서치 전범위 수행. 산출 범위: (1) VAIS 내부 사용 현황 자체 관찰, (2) 경쟁 framework 5종, (3) TAM/SAM/SOM, (4) 3 Personas (JTBD), (5) Reference Canon 검증, (6) Customer Journey Map 현재/목표.
- **선행 의사결정**: ideation D-1(4단계 프레임), D-2(산출물이 sub-agent 정의), D-6(실행 정책 4분류), D-7(Project Profile), D-9(release-engineer 5분해). plan CP-1(확장 범위 C 채택).
- **스코프**: VAIS Code 플러그인(Claude Code marketplace)에 국한. 웹 리서치 도구 미사용 — 지식 기반 분석. 수치 불확실성은 "확인 필요"로 명시.

---

## 2. Body

### 2.1 현재 VAIS 사용 현황 분석 (자체 관찰)

#### 2.1.1 44 sub-agent 분포 정량화

ideation main.md에서 집계된 C-Level별 분포를 설계 단계 관점으로 재정량화한다.

| C-Level | sub-agent 수 | 분포 비율 | 분리 기준 |
|---------|-------------|---------|---------|
| CTO | 8 | 18.2% | 기술 레이어 (infra/fe/be/db/qa/test/incident + cto 본인 = 9, 서브 8) |
| CSO | 7 | 15.9% | 검사 유형 (security/code-review/secret/dep/plugin/skill/compliance) |
| CPO | 7 | 15.9% | Phase + 산출물 혼합 (discoverer/strategist/researcher/prd/backlog/ux/data) |
| CBO | 10 | 22.7% | 도메인 기반 (market/segmentation/seo/copy/growth/pricing/financial/unit-eco/finops/mktg-analytics) |
| COO | 4 | 9.1% | 시점 기반 (release-engineer/sre/release-monitor/performance) |
| CEO | 2 | 4.5% | 메타 (absorb-analyzer/skill-creator) |
| **합계** | **38** | **86.4%** | ← 6 C-Level 본인 포함 시 44 |

**관찰 1 — 비대칭 극단값**: CBO 10개 vs CEO 2개. 비율 5:1. CEO는 전략 레이어임에도 sub-agent가 가장 빈약하다.

**관찰 2 — "배 이상" 차이 쌍**: CBO(10) vs COO(4) = 2.5배. 사용자 자기 진단("낯선 영역 → 외부 ref 흡수로 파편적 누적")과 정확히 일치.

**관찰 3 — COO 과소**: 운영(SRE/배포/모니터링)이 4개뿐인데, 이 중 release-engineer는 ideation에서 "쓸데없이 ci/cd를 만든다"는 통증의 직접 원인으로 지목됨. 즉 COO는 수가 적을 뿐 아니라 있는 것도 결함이 있다.

#### 2.1.2 "default-execute" anti-pattern 의심 sub-agent — 6개 정의 발췌

ideation KP-7에서 식별된 후보를 실제 frontmatter/body에서 확인한다.

**① release-engineer** (COO)
- description: "Configures CI/CD pipelines and deployment automation including GitHub Actions, Docker, and environment-specific deployment settings."
- Execution Flow 1번: "프로젝트 구조 분석 (package.json, Dockerfile 등)" — 조건 판단 없이 바로 분석으로 시작.
- **판정**: 명확한 default-execute. "이미 CI/CD가 있는가?", "이 프로젝트에 CI/CD가 필요한가?" 판단 단계 전무.

**② infra-architect** (CTO)
- description: "Designs infrastructure and architecture including DB schemas, migrations, ORM configuration, environment setup, and project initialization."
- Execution Flow: "1. 기획서 읽기 → 4. ERD 생성 → 5. 테이블 스키마 정의 → ... → 12. docs/{feature}/02-design/infra.md에 인프라 문서 저장"
- **판정**: 12단계 파이프라인이 항상 전체 실행됨. 이미 DB가 init된 프로젝트에서도 ERD부터 다시 만들 가능성 있음. "기존 스키마 존재 여부 확인" 단계 없음.

**③ test-engineer** (CTO)
- description: "Generates test code including unit, integration, and e2e tests."
- 실행 단계 3: "프로젝트 테스트 프레임워크 감지" — 이미 충분한 테스트가 있어도 감지 후 작성으로 이어짐.
- **판정**: 테스트 가치 낮은 함수(순수 getter, 1줄 유틸)에도 무조건 test를 만들 구조. 커버리지 기준(예: 이미 80% 이상이면 skip)이 없음.

**④ seo-analyst** (CBO)
- description: "SEO 감사 + 콘텐츠 마케팅 전략. On-page/Off-page/Technical SEO + Core Web Vitals 평가."
- Input: "feature, target_files, keywords, competitors" — 이 중 "SEO가 이 프로젝트에 relevant한가?" 판단 변수 없음.
- **판정**: Internal tool이거나 API-only 프로젝트(Project Profile에 seo_dependent=false)여도 keywords만 주면 실행. policy=B(Scope) 미구현 상태.

**⑤ finops-analyst** (CBO)
- description: "클라우드 비용 분석/최적화 전문. FinOps Foundation 프레임워크 + right-sizing + waste detection."
- Input: "cloud_provider, billing_data, resource_inventory" — 클라우드를 쓰지 않는 local-only 배포 프로젝트에 대한 early-exit 없음.
- **판정**: Project Profile의 deployment.target=local-only라면 무의미한 분석. 자동 스코프 게이트 없음.

**⑥ compliance-auditor** (CSO)
- description: "Verifies regulatory compliance including GDPR/privacy protection, license compatibility, and audit log validation."
- 실행 단계 4: "감사 로그 확인 — 민감 데이터 접근 기록 존재 여부" — internal tool이나 PII를 전혀 처리하지 않는 OSS plugin도 동일 단계를 밟음.
- **판정**: Project Profile의 data.handles_pii=false, data.handles_payments=false인 경우 GDPR/CCPA 점검은 불필요. policy=B(Scope) 미구현.

**공통 패턴 요약**: 6개 모두 Input 파라미터 수신 후 조건 판단 없이 분석 파이프라인 진입. "필요한가?"라는 Discovery 단계 부재. 이것이 "쓸데없이 만든다"는 통증의 직접 메커니즘.

#### 2.1.3 frontmatter description 품질 점검 (skill-validator 기준 적용)

기준: D1(3인칭), D2(1인칭 금지), D3(what+when), D4(≤1024자), D5(trigger 키워드 2개+).

읽은 6개 agent description을 skill-validator 규칙으로 평가:

| Agent | D1(3인칭) | D2(1인칭 없음) | D3(what+when) | D4(≤1024자) | D5(trigger키워드) | 종합 |
|-------|---------|-------------|-------------|----------|----------------|------|
| release-engineer | PASS ("Configures") | PASS | PARTIAL ("Use when" 있으나 조건이 자명하지 않음) | PASS | PASS | WARN |
| infra-architect | PASS ("Designs") | PASS | PARTIAL ("Use when" 있음, 그러나 "기존 인프라 없을 때"라는 조건 누락) | PASS | PASS | WARN |
| test-engineer | PASS ("Generates") | PASS | PASS | PASS | PASS | PASS |
| seo-analyst | FAIL (한국어 서술 — "SEO 감사 + 콘텐츠 마케팅 전략") | PASS | PASS ("Use when" 있음) | PASS | PASS | WARN |
| finops-analyst | FAIL (한국어 — "클라우드 비용 분석/최적화 전문") | PASS | PASS | PASS | PASS | WARN |
| compliance-auditor | PASS ("Verifies") | PASS | PASS | PASS | PASS | PASS |

**추가 관찰**:
- seo-analyst, finops-analyst — description이 한국어로 시작. skill-validator D1 기준("동사 현재형 영어")에 맞지 않음. absorb 시 영어로 작성된 것과 한국어가 혼재 → 일관성 결여.
- "Use when" 절이 있어도 실제 scope 조건이 명시되지 않은 경우가 많음 (infra-architect: "delegated by CTO for infrastructure design or project scaffolding" — 언제 스캐폴딩이 필요한지 미정의).
- 6개 중 4개 WARN 수준. 전체 44개 미검증 상태.

#### 2.1.4 산출물 template 부재 비율

ideation Artifact Catalog에서 집계한 50+ 산출물과 templates/ 디렉토리 현황 비교.

현재 templates/ 확인 항목(직접 읽은 것): `subdoc.template.md` 존재 확인. plan/design/do/qa/report 5개 phase 템플릿이 있다고 CLAUDE.md에서 언급.

ideation 카탈로그에서 "template 없음"으로 명시된 항목 집계:

| 단계 | 총 산출물 수 | template 없음 명시 | template 있음 | 비율(없음/총) |
|------|-----------|--------------|------------|------------|
| Core | 5 | 5 (Vision/Strategy Kernel/OKR/PR-FAQ/3-Horizon) | 0 | 100% |
| Why | 10 | 8 (PESTLE/Five Forces/SWOT/TAM-SAM-SOM/Journey Map/VPC/OST/Forces) | partial 2 | 80% |
| What | 11 | 9 (Lean Canvas/BMC/North Star/AARRR/HEART/Roadmap/Wireframe Spec/Pricing Tier Canvas + 부분 2) | partial 2 | ~82% |
| How | 14 | 12 (ADR/C4/RFC/API Spec은 외부표준/ER Diagram/STRIDE/DPIA/Test Plan/Runbook/SLI-SLO/Postmortem/Release Notes/DORA Dashboard) | 1 (PRD) | ~86% |
| 사업·재무 | 10 | 10 (3-Statement/DCF/Cohort/CAC-LTV/Magic Number/Cloud Cost/Funnel/AIDA/SEO Audit/Attribution) | 0 | 100% |
| **합계** | **~50** | **~44** | **~6** | **~88%** |

**결론**: 50+ 산출물 카탈로그 중 약 88%에 전용 template(depth c — sample+checklist+anti-pattern)이 없다. PRD template 1개가 사실상 유일하게 완성된 산출물 template. 이것이 "sub-agent가 AI 환각으로 새 포맷 만드는" 현상의 직접 원인.

---

### 2.2 경쟁/유사 분석 — AI Agent Orchestration 프레임워크 5종

**분석 방법론**: 각 프레임워크의 공개 문서, GitHub 스펙, 사용 패턴에 대한 지식 기반 분석. 실시간 웹 검색 미수행 — 수치/최신 상태는 "확인 필요"로 표시.

#### 2.2.1 AutoGPT

**프로파일**:
- 설립/공개: 2023년 3월 Toran Bruce Richards. GitHub 최초 viral AI agent project. 현재 Significant Gravitas Ltd 운영.
- 타깃: 개인 실험자, 얼리어답터, 자율 task 자동화를 원하는 개발자.
- 펀딩 상태: 확인 필요 (초기 오픈소스 → 이후 상업화 시도).

**무엇을 잘하나**:
- Goal-driven loop: 사용자가 목표만 주면 agent가 스스로 sub-task 분해 → 실행 → 피드백 → 재계획.
- 플러그인 확장성: 웹 검색, 파일 I/O, 코드 실행을 플러그인으로 연결.
- "자율성" 인식: 초기 AI agent의 가능성을 대중에게 증명.

**한계**:
- Hallucination loop: goal이 모호하면 무한 루프 또는 무의미한 실행 반복.
- 비용: 매 루프마다 LLM 호출 → token 소모 급증.
- 예측 불가성: 동일 goal에도 실행 경로가 달라 재현성 낮음.
- 산출물 비표준화: 매번 다른 포맷으로 결과물 생성.

**VAIS와의 차이**:
AutoGPT는 단일 agent의 자율 루프. VAIS는 C-Suite 역할 분리 + phase gate 강제 + 산출물 표준화. VAIS는 "자율"보다 "예측 가능한 구조화된 산출"을 설계 원칙으로 삼는다. AutoGPT의 실패 패턴(hallucination loop, 비표준 산출)이 VAIS가 해결하려는 문제와 정확히 겹친다.

**우리에게 주는 교훈**: "자율"이 아니라 "예측 가능성"이 엔터프라이즈/스타트업 사용자에게 필요한 것이다. Agent가 스스로 판단하기보다 명확한 계약(Input/Output/Policy)으로 작동해야 한다. 이것이 ideation D-2("산출물이 sub-agent 정의·경계·계약을 결정")의 근거가 된다.

#### 2.2.2 CrewAI

**프로파일**:
- 설립/공개: 2023년 말. João Moura (Clearbit 전 CTO) 창업. Python 오픈소스 멀티에이전트 프레임워크.
- 타깃: 비즈니스 워크플로우 자동화 개발자. Role-based agent 설계를 원하는 팀.
- 펀딩: 확인 필요 (Series A 추정 — 2024년 기준).

**멀티에이전트 협업 / role-based**:
- Agent = Role + Goal + Backstory + Tools. 각 agent에 명시적 역할 부여.
- Task 단위로 agent 간 위임 (sequential 또는 hierarchical process).
- Manager agent가 하위 agent 조율 — 우리의 C-Level ↔ sub-agent 구조와 유사.

**우리의 C-Suite 메타포와 비교**:

| 항목 | CrewAI | VAIS |
|------|--------|------|
| 역할 정의 | Role + Backstory(자연어) | Frontmatter(YAML) + Body(마크다운 절차) |
| 워크플로우 | Task chain (sequential/hierarchical) | PDCA phase gate |
| 산출물 | Agent가 자유 텍스트 생성 | 정전 기반 template(depth c) |
| 스코프 제어 | Task-level | Project Profile + 실행 정책 4분류 |
| 감독 | Manager agent (AI) | CEO + 사용자 승인 |
| 언어 | Python SDK | Claude Code 마크다운 에이전트 |

CrewAI와 가장 구조적으로 유사하나, 결정적 차이는 산출물 표준화 여부다. CrewAI는 agent가 생성하는 텍스트에 포맷 보장이 없다. VAIS는 "어떤 산출물을 어떤 template으로"를 미리 정의한다.

**우리에게 주는 교훈**: role-based agent 분리는 구조적으로 옳다. 그러나 역할 정의를 자연어(Backstory)에만 의존하면 경계가 모호해진다. VAIS는 Backstory 대신 "이 agent가 소유하는 artifact catalog"로 경계를 정의해야 한다.

#### 2.2.3 LangGraph

**프로파일**:
- 제공: LangChain 팀. 2024년 LangChain 에코시스템의 핵심 워크플로우 엔진.
- 타깃: 복잡한 state machine 기반 agent workflow를 구현하려는 Python/JS 개발자.

**Graph 기반 워크플로우**:
- StateGraph: 각 node가 state를 변환. edge가 다음 node를 결정(조건부 분기 가능).
- Checkpoint: 임의 node에서 상태 저장/복원 → 재실행 가능.
- Human-in-the-loop: interrupt_before/after로 특정 node에서 사용자 확인 삽입.

**우리의 PDCA와 비교**:

| 항목 | LangGraph | VAIS PDCA |
|------|-----------|-----------|
| 구조 | Directed graph (node/edge) | Linear phase sequence (ideation→plan→design→do→qa→report) |
| 분기 | 조건부 edge (동적) | CEO 동적 라우팅 (의사결정 포인트) |
| 상태 | StateGraph 타입화 | docs/{feature}/{phase}/main.md (파일 기반) |
| 중단/재개 | Checkpoint 내장 | Phase gate (사용자 승인) |
| 병렬 | fan-out/fan-in 노드 | do phase 병렬 (frontend+backend+test) |

LangGraph의 StateGraph가 VAIS의 PDCA보다 유연하지만, 유연성이 예측 불가성을 낳는다. VAIS가 linear phase를 강제하는 이유는 "예측 가능한 산출물 순서"를 보장하기 위함이다.

**우리에게 주는 교훈**: LangGraph의 Human-in-the-loop interrupt 패턴은 VAIS CEO 체크포인트(Rule #11 사용자 승인)와 동일한 철학. 차이는 VAIS가 이를 "mandatory gate"로, LangGraph는 "optional interrupt"로 설계한다는 것. VAIS의 Phase gate가 더 강한 품질 보장을 제공하지만, agent 개수가 늘어날수록 gate 피로감이 증가할 수 있다. — Project Profile 기반 B(Scope) 정책이 gate 피로를 줄이는 솔루션.

#### 2.2.4 Microsoft AutoGen

**프로파일**:
- 제공: Microsoft Research. 2023년 10월 공개. Python 오픈소스.
- 타깃: 다중 agent 대화/협업 워크플로우 연구자 및 기업 개발자.
- 특징: ConversableAgent — agent끼리 대화로 문제 해결. GroupChat으로 멀티에이전트 토론.

**우리에게 주는 교훈**:
AutoGen의 GroupChat은 CrewAI보다 비구조적이다. agent가 "대화"로 수렴하는 방식은 산출물이 대화 로그에 묻혀버리는 문제를 만든다. VAIS가 명시적 산출물(main.md, _tmp/{slug}.md)을 강제하는 이유가 여기 있다. 또한 AutoGen은 "어떤 agent가 어떤 순서로 발언할지"를 동적으로 결정하는데, 이 동적성이 재현성을 낮춘다. VAIS의 C-Level ↔ sub-agent 위임 계약이 더 엄격하고 추적 가능하다.

**AGiXT 참고** (추가 경쟁자):
- 오픈소스 AGI 스택. 다수 AI provider 지원 + 메모리 레이어 + chain 실행.
- VAIS와의 차이: AGiXT는 범용 agent infrastructure. VAIS는 "소프트웨어 서비스 런칭"이라는 좁고 깊은 도메인에 특화. 도메인 특화가 VAIS의 차별점이다.

#### 2.2.5 Devin / Cognition AI

**프로파일**:
- 제공: Cognition AI. 2024년 3월 공개. "최초 AI 소프트웨어 엔지니어" 마케팅.
- 타깃: SWE(Software Engineering) 자동화. GitHub issue → 자율 코드 작성 → PR.
- 펀딩: $21M Series A (2024, 확인 필요). 기업가치 $2B 주장(확인 필요).

**자율 SWE agent**:
- 자체 개발 환경(sandbox) + 브라우저 + 터미널 + 코드 편집기.
- SWE-bench 벤치마크에서 당시 SOTA(확인 필요 — 업데이트 빠름).
- 목표: "엔지니어처럼 생각하고 실행".

**우리의 단일 phase 실행 원칙과 대조**:

Devin은 end-to-end 단일 agent: issue 입력 → 계획 → 코딩 → 테스트 → PR. VAIS는 phase 분리: plan(CPO) → design(CTO) → do(backend+frontend+test 병렬) → qa. 

| 항목 | Devin | VAIS |
|------|-------|------|
| 범위 | 코딩(Engineering) 특화 | 서비스 런칭 전체 (기획→개발→운영→비즈니스) |
| 판단 주체 | AI 단독 | AI 추천 + 사용자 승인 |
| 산출물 보장 | 코드/PR | PRD/ADR/테스트/런북/마케팅 카피 등 전체 |
| 재현성 | 낮음 (자율 의사결정) | 높음 (phase gate + template) |
| 비용 모델 | 구독 (확인 필요) | Claude Code 마켓플레이스 플러그인 |

**우리에게 주는 교훈**: Devin이 잘하는 것은 "주어진 코딩 task의 자율 실행"이다. VAIS가 잘해야 하는 것은 "올바른 task를 정의하는 과정 전체(기획~운영)"다. 경쟁이 아닌 보완 관계이지만, VAIS 사용자가 "코드만 써줘"를 원하면 Devin으로 이탈할 수 있다. 이탈 방지 전략: VAIS의 CTO phase가 Devin 수준의 코드 품질을 내면서, 그 앞단(CPO 기획)과 뒷단(CSO 보안, COO 운영)으로 가치를 확장해야 한다.

**경쟁사 요약 테이블**:

| 프레임워크 | 핵심 강점 | 핵심 약점 | VAIS에게 주는 교훈 | 위협 수준 |
|-----------|---------|---------|----------------|---------|
| AutoGPT | 자율 루프, 바이럴 | 예측 불가, 비표준 산출 | 산출물 표준화가 차별점 | 낮음 (방향 다름) |
| CrewAI | Role-based, 멀티에이전트 | Backstory 의존, 산출물 비표준 | Artifact 소유로 경계 정의 | 중간 (구조 유사) |
| LangGraph | StateGraph 유연성, Checkpoint | 유연성 = 복잡성, 학습 장벽 | Human-in-the-loop = gate 철학 공유 | 낮음 (다른 레이어) |
| AutoGen | 멀티에이전트 대화 | 산출물 대화 로그에 매몰 | 명시적 산출물 경로 필요성 확인 | 낮음 |
| Devin | 코딩 task 자율 실행 | 코딩 외 범위 없음 | CTO phase 품질 = Devin 동등 목표 | 중간 (코딩 레이어) |

---

### 2.3 TAM/SAM/SOM (Steve Blank 방법론)

**방법론 선택**: 상향식(Bottom-up) + 하향식(Top-down) 교차 검증. Steve Blank "Four Steps to the Epiphany" 기반.

**전제 공개**: 수치는 공개 정보 기반 추정. 오차 범위 ±50%. 단, 방향성(order of magnitude)은 유효하다고 판단.

#### 2.3.1 TAM — AI Agent Orchestration 전체

**하향식 접근**:
- AI developer tool 시장 전체: Gartner/IDC 추정 2024년 기준 ~$10B (확인 필요). 이 중 agent orchestration / workflow automation 슬라이스: ~15~20% 추정 → $1.5~2B.
- Claude Code / GPT 등 AI coding assistant 기반 플러그인/에이전트 시장: 2026년 기준으로 성장 중이나 별도 집계 데이터 없음. **확인 필요**.

**상향식 접근**:
- 전 세계 전문 개발자 수: ~26M (Stack Overflow 2023 기준, 확인 필요).
- AI agent 관련 도구 사용 비율: ~30% (추정, 확인 필요).
- 연간 지불 의향: $200~$600/년 (pro 구독 티어 기준).
- 상향식 TAM = 26M × 30% × $400 = $3.1B.

**교차 검증**: 하향식($1.5~2B)과 상향식($3.1B)의 중간값 ~$2B 사용. 그러나 "Claude Code 마켓플레이스"가 2026년 기준 아직 초기 시장임을 감안하면 실현 가능한 수준은 훨씬 낮다.

**TAM 결론**: ~$1.5~3B (확신도: 하. 단, 방향성: agent orchestration이 AI tool 시장 내 고성장 세그먼트인 것은 확실).

#### 2.3.2 SAM — Claude Code 플러그인 사용자

**제약 적용**:
- 플랫폼 제약: Claude Code 사용자로 한정. Claude Code MAU: 확인 필요. 추정 수십만 명 수준(2026년 기준 성장 중).
- 언어 제약: 영어+한국어 (현재 VAIS 문서/에이전트 한국어 비중 높음).
- 역할 제약: 소프트웨어 개발자 또는 PM/CTO — agent orchestration에 관심 있는 서브셋.
- 구매 의향 제약: 플러그인에 돈을 낼 의향 있는 비율(무료/유료 전환율 ~5~10% 추정).

**상향식**:
- Claude Code 활성 사용자: 추정 500K~1M (확인 필요, 2026-04 기준).
- plugin 설치 사용자 비율: ~10~20% (다른 플러그인 생태계 벤치마크 기준).
- VAIS에 relevant한 "서비스 개발자/PM" 비율: ~30%.
- SAM = 750K × 15% × 30% = ~33,750명 (유의미한 설치 베이스).
- 유료 전환율 5~10%: 1,700~3,400명 잠재 유료 고객.

**SAM 결론**: 유료 기준 1,700~3,400명 / 무료 설치 기준 30,000~40,000명 (확신도: 하. Claude Code 실제 MAU 비공개).

#### 2.3.3 SOM — 1년 내 도달 가능 (한국 SaaS/스타트업 + 개인 빌더)

**제약 추가**:
- 지역: 한국 우선 (사용자가 한국어 기반 스타트업 ecosystem에 있음, NCSOFT 이메일 도메인 기반 추정).
- 한국 개발자 Claude Code 사용자: 전체의 ~3~5% 추정 (일본/한국 아시아 비중).
- 타깃: 한국 SaaS 스타트업(5~50인 규모) + 개인 빌더(솔로 개발자).
- GTM: 직접 배포 (Claude Code 마켓플레이스) + 한국 개발자 커뮤니티(OKKY, 카카오 오픈채팅, 개발자 유튜브).
- 한국 시장 내 유료 전환 가능 개발자 팀: 추정 500~2,000팀.
- 1년 내 도달 가능 비율(초기 GTM 감안): ~5~10% = 25~200팀.
- 팀당 연간 지불: $100~$500 (초기 가격 설계에 따라 변동).

**SOM 결론**: 1년 내 $2,500~$100,000 ARR (확신도: 하~중. 플러그인 무료 모델이면 무료 설치 200~500건이 1년 내 목표로 타당).

**핵심 가정 목록**:

| 가정 | 확신도 | 검증 방법 |
|------|--------|---------|
| Claude Code MAU 500K~1M | 하 | Anthropic 공식 수치 요청 또는 앱스토어 리뷰 수 추정 |
| 한국 개발자 비중 3~5% | 하 | Claude 사용 국가별 데이터 (없으면 GitHub 한국 개발자 비율 대리 지표) |
| 플러그인 → 유료 전환 5~10% | 중 | 유사 Claude Code 플러그인(있다면) 전환율 벤치마크 |
| 팀당 WTP $100~$500/년 | 중 | 인터뷰 5~7명으로 직접 검증 (extended-scope 4번 인터뷰 항목) |

**TAM/SAM/SOM 요약 테이블**:

| 지표 | 현재 추정 | 2~3년 전망 | 제약/가정 |
|------|---------|---------|---------|
| TAM | ~$1.5~3B | ~$5~10B (AI agent 성장) | AI developer tool 전체 시장 기반, 확인 필요 |
| SAM | 1,700~3,400명 (유료) / ~35K명 (설치) | 5K~10K명 (유료) | Claude Code 플랫폼 성장 연동 |
| SOM | 25~200팀 (1년), $2.5K~$100K ARR | 500팀, ~$250K ARR | 한국 집중 GTM + 무료 우선 |

---

### 2.4 3 Personas — JTBD 기반

**페르소나 설계 원칙**: 인구통계 카테고리가 아닌 행동/동기 패턴 기반. 3개 비중복.

#### 2.4.1 P1 — "믿고 쓰고 싶은" 솔로 빌더

**이름**: 김준서 (가상)
**인구통계**: 30대 초반. 풀스택 1인 개발자. 사이드 프로젝트 또는 개인 SaaS 운영. 회사 다니며 주말/밤에 빌딩. 주로 Next.js + Python FastAPI + Supabase 스택.
**핵심 특성 (행동 패턴)**: AI 도구 얼리어답터이지만 "AI가 쓸데없이 만드는" 경험을 여러 번 겪었다. Cursor, Claude Code 모두 사용. 시간이 없어서 PRD 없이 바로 코딩하는 습관. 기획 단계를 건너뛰면 나중에 무너진다는 것을 알면서도 멈추지 못함.

**Primary JTBD**:
When I start a new SaaS feature alone, I want to know exactly what to build and what NOT to build so I can ship in a weekend without rework.
- 빈도: 2~4주마다 새 피처 사이클. 핵심 맥락: 시간 부족 + 컨텍스트 혼자 유지해야 함.

**Top 3 Pain Points**:
1. **"AI가 물어보지 않고 만들어버린다"** — release-engineer가 CI/CD를 만들어주는데 지금 당장은 필요 없음. infra-architect가 init된 프로젝트에 스키마를 또 만드는 것. 영향: 수정 시간 > 생성 시간. 심각도: 높음.
2. **산출물 품질 신뢰 불가** — "이 PRD가 맞는 건지 모르겠다." AI가 생성한 JTBD 분석이나 Persona가 실제와 맞는지 검증할 방법 없음. Lean Canvas가 어떤 포맷이어야 하는지 모름. 심각도: 중간.
3. **컨텍스트 단절** — 어제 Claude와 나눈 기획 대화가 오늘 새 세션에서 사라짐. 매번 "지난번에 우리가 뭘 하기로 했더라" 재설명 반복. 심각도: 높음.

**Top 3 Desired Gains**:
1. "이 피처는 CI/CD 없이 배포 가능"처럼 스코프를 먼저 판단해주는 시스템.
2. 정전 기반 산출물(Lean Canvas=Ash Maurya 형식)이 보장되어 "이 형식이 맞다"는 확신.
3. Project Profile 1회 입력 → 이후 세션에서 재설명 불필요.

**Unexpected Insight**: 솔로 빌더는 속도를 원하지 않는다 — "쓸데없는 것 안 만들기"를 원한다. 빠른 것보다 낭비 없는 것이 우선. "weekday-night 개발자"에게 토큰 절약 = 돈보다 시간 절약이 더 중요하다.

**Product Fit**:
- 현재 미충족: default-execute anti-pattern이 이 페르소나에게 가장 크게 타격. 산출물 template 부재로 품질 신뢰 불가.
- 목표 충족: Project Profile 선합의 → B/C/D 정책으로 불필요한 산출물 skip → template(depth c)으로 산출물 포맷 보장.

#### 2.4.2 P2 — "팀이 같은 것을 보길 원하는" 스타트업 CTO

**이름**: 이수현 (가상)
**인구통계**: 35~42세. 시리즈 A 스타트업 CTO. 팀 규모 8~20명. 도메인: B2B SaaS. PM 1명, 개발자 5~10명.
**핵심 특성 (행동 패턴)**: 빠른 PRD↔구현 사이클 필요. 그런데 PM이 쓴 PRD와 개발자가 구현한 코드가 자꾸 어긋남. alignment 검증에 회의 시간이 너무 많이 들어감. AI 도구를 팀 전체에 표준화하고 싶지만 각자 다른 방식으로 사용해 산출물 포맷이 제각각.

**Primary JTBD**:
When my team ships a new feature, I want to verify that what was planned matches what was built so I can avoid wasted sprint cycles and PM-Dev misalignment.
- 빈도: 2주 스프린트 단위. 핵심 맥락: 팀 coordination, PRD → 구현 gap 최소화.

**Top 3 Pain Points**:
1. **PM-Dev alignment 부재** — PRD에는 "알림 기능"인데 개발자가 구현한 건 다른 UX. Why-What-How alignment 검증 메커니즘이 없음. 심각도: 높음.
2. **산출물 포맷 비표준** — 팀원마다 다른 PRD 형식. "이번엔 Notion 템플릿, 저번엔 Google Docs, 이번엔 AI 생성 마크다운." 참조 불가. 심각도: 중간.
3. **운영 부채 축적** — SLO/SLI 미정의, DORA 메트릭 미측정 상태로 달리는 중. "언젠가는 해야 하는데" 계속 미뤄짐. 심각도: 중간~높음.

**Top 3 Desired Gains**:
1. PRD → 구현 gap을 qa-engineer가 자동으로 잡아주는 구조 (6.4/7.5/8.4 alignment 체크).
2. 팀 전체가 동일 포맷(정전 기반 template)으로 산출물 생성 → 참조 가능한 단일 소스.
3. Project Profile 1회 합의 → SLO/DORA/SEO 등 scope 기반 자동 판단.

**Unexpected Insight**: CTO는 "더 많은 AI 기능"을 원하지 않는다 — "팀 표준화"를 원한다. AI가 뭔가를 더 잘하는 것보다 팀이 같은 언어로 일하는 것이 더 가치 있다. VAIS의 "정전 기반 산출물"이 team knowledge standard로 기능해야 한다.

**Product Fit**:
- 현재 미충족: alignment 검증 메커니즘(6.4/7.5/8.4) 미구현. sub-agent 간 산출물 형식 불일치.
- 목표 충족: ideation 종료 시 artifact set 합의 → qa-engineer alignment check → 팀 전체 동일 template 사용.

#### 2.4.3 P3 — "감사(Audit)를 통과해야 하는" 엔터프라이즈 PM

**이름**: 박지연 (가상)
**인구통계**: 38~48세. 대기업(500인+) 또는 금융/의료 스타트업 PM. 팀에 컴플라이언스 담당자/법무팀 존재. AI 도구 도입 시 보안 심의 필요.
**핵심 특성 (행동 패턴)**: 기능 자체보다 "이 산출물이 감사에 통과하는가"가 더 중요. GDPR, SOC2, ISMS-P 인증 관련 문서화 요구. AI 생성 산출물의 출처/근거를 stakeholder에게 보여줄 수 있어야 함. "정전에 근거한" 문서가 임의 AI 생성보다 설득력 있음.

**Primary JTBD**:
When I present AI-generated deliverables to stakeholders or auditors, I want to show the authoritative source behind each artifact so I can justify the decision without second-guessing.
- 빈도: 분기별 감사/review + 매 피처 릴리즈 시 컴플라이언스 체크.

**Top 3 Pain Points**:
1. **AI 산출물 정당화 불가** — "Claude가 만든 건지 어떻게 믿어요?" DPIA가 맞는 형식인지, OWASP ASVS 체크리스트가 최신인지 감사자가 의심. 심각도: 매우 높음.
2. **scope 판단 불투명** — "이 프로젝트에 GDPR이 필요한가?"를 VAIS가 물어보지 않음. 무조건 compliance-auditor가 실행 → 결과물이 과도하거나 미흡. 심각도: 높음.
3. **문서 추적성 부재** — "이 ADR이 왜 이 결정을 내렸는가"를 소급 추적 불가. _tmp/ 보존 정책이 없었던 구버전에서 근거 소멸. 심각도: 중간.

**Top 3 Desired Gains**:
1. 산출물 출처 명시: "이 DPIA는 GDPR Article 35 + ideation.main.md D-7 기반" 같은 참조 체인.
2. Project Profile → B(Scope) 정책으로 handles_pii=true일 때만 GDPR 체크 실행.
3. _tmp/ 영구 보존 + git 커밋 → "이 결정의 근거는?" 질문에 링크 한 줄로 답변.

**Unexpected Insight**: 엔터프라이즈 PM은 "AI가 더 똑똑하길" 원하지 않는다 — "AI 판단에 서명할 수 있는 근거"를 원한다. VAIS의 "정전 기반 산출물" + "_tmp/ 추적성"이 AI 도입 설득력의 핵심이 된다. B카탈로그(GDPR/SLO/Threat Model)의 scope 자동 판단이 이 페르소나에게 가장 높은 가치.

**Product Fit**:
- 현재 미충족: Project Profile 없으므로 B 정책 미동작. _tmp/ 추적성은 v0.57에서 도입됐으나 링크 체인 UI 미구현. 정전 출처 메타데이터 template 미완성.
- 목표 충족: template frontmatter에 artifact 출처 정전 명시 → DPIA에 "// @see GDPR Art. 35" → 감사자 설득 가능.

---

### 2.5 Reference Canon 검증 — 3 Persona 실용성 점검

ideation에서 채택한 Reference Canon이 위 3 persona에게 실제로 의미 있는지 점검한다.

| 정전 | P1(솔로 빌더) | P2(스타트업 CTO) | P3(엔터프라이즈 PM) | 검증 결론 |
|------|------------|-------------|--------------|---------|
| *제품의 탄생* (4단계 메타프레임) | 의미 있음 — "어떤 순서로 생각해야 하는가" 구조 제공 | 의미 있음 — Core→Why→What→How = 팀 alignment 언어 | 의미 있음 — 감사자에게 "왜 이 순서인가" 설명 | 전원 채택 OK |
| Cagan *INSPIRED* (Product Management) | 부분 — "Outcome over Output" 개념 유용하지만 엔터프라이즈 중심 | 의미 있음 — PM-Dev 관계, discovery의 중요성 | 의미 있음 — PRD 정당화 | 전원 유효 |
| Torres *Continuous Discovery Habits* (OST) | 솔로에겐 과잉 — 팀 인터뷰 프로세스가 1인에게 적용 어려움 | 의미 있음 — product trio + OST 이해 | 제한적 — 감사보다 discovery 프레임 | **P1에 부분 적용** |
| Rumelt *Good Strategy/Bad Strategy* (Strategy Kernel) | 부분 — 전략 커널 개념은 솔로에게도 유용 | 의미 있음 — 팀에 strategy 설명할 때 | 의미 있음 — stakeholder에게 전략 근거 | 전원 유효 |
| Skelton *Team Topologies* | **P1에 무관** — 1인 팀에는 적용 불가 | 의미 있음 — 팀 구조, cognitive load | 부분 — 조직론이라 PM 영역 밖 | **P1 제외, P2 핵심** |
| DORA Four Key Metrics | 부분 — 솔로도 배포 주기 측정 가능 | 의미 있음 — 팀 성과 측정 | 의미 있음 — 감사에 DORA 데이터 사용 | 전원 유효 |
| Google SRE Book (SLI/SLO) | 부분 — SLO 미설정 프로젝트가 많음 | 의미 있음 — 운영 부채 해결 | 의미 있음 — SLA 감사 | 전원 유효 |
| Christensen *Competing Against Luck* (JTBD) | **핵심** — "쓸데없이 만들지 마" = JTBD와 정확히 연결 | 의미 있음 — PM-Dev alignment에 JTBD 언어 | 부분 — 감사보다 기획 프레임 | 전원 유효, P1 핵심 |
| Osterwalder BMC/VPC | 의미 있음 — 사이드 프로젝트 비즈니스 모델 검증 | 의미 있음 — 투자자 설명용 | 의미 있음 — 비즈니스 케이스 감사 | 전원 유효 |
| OWASP Top 10 / NIST CSF | 부분 — 보안 의식은 있으나 직접 실행 어려움 | 의미 있음 — 팀 보안 기준 | **핵심** — 감사 필수 체크리스트 | 전원 유효, P3 핵심 |

**검증 결론**:
1. Team Topologies는 P1(솔로)에게 직접 적용 불가. 그러나 VAIS가 "한 사람이 쓰는 C-Suite 시뮬레이터"라는 관점에서, P1에게는 Team Topologies를 "역할 분리 마인드셋"으로 소화시키는 설명이 필요.
2. Torres OST는 P1에게 과잉. P1용 OST 경량화 버전 또는 "JTBD Statement 1개 + 검증 2가지" 축약이 더 적합.
3. 나머지 9개 정전은 3 persona 전원에게 유효. 정전 canon 채택은 유지.
4. **추가 정전 후보**: Ash Maurya *Running Lean* — P1에게 Lean Canvas의 원저자 정전이 가장 직접적. 이미 카탈로그에 포함되어 있으나 Reference Canon 테이블에는 명시적으로 없음. 추가 권장.

---

### 2.6 Customer Journey Map — 현재 vs 목표

5단계 여정. 주 persona: P1(솔로 빌더) + P2(스타트업 CTO) 혼합.

#### 2.6.1 현재 여정 — "default-execute 마찰 → 산출물 신뢰도 낮음"

| 단계 | 고객 행동 | 생각/감정 | 터치포인트 | 페인포인트 | 현재 상태 |
|------|---------|---------|---------|---------|---------|
| **인지** | Claude Code 마켓플레이스에서 VAIS 발견, GitHub README 확인 | "AI C-Suite 시뮬레이터? 재미있어 보이는데." | Marketplace, GitHub, 커뮤니티 추천 | VAIS가 뭘 해주는지 구체적인 산출물 예시 없음 | 설치 장벽 낮으나 기대 설정 불명확 |
| **설치/온보딩** | `/vais` 명령어 실행, CEO 호출 | "뭘 하면 되지? 어떤 순서로?" | Claude Code CLI | 온보딩 가이드 없음. 첫 호출 후 C-Level 추천 화면이 생소 | 이탈률 높을 것으로 추정 |
| **첫 실행** | CEO에게 피처 요청, CPO 위임 | "CPO가 PRD를 만들어주는구나" | CPO → product-researcher → prd-writer | prd-writer가 Project Profile 없이 PRD 생성 → 어떤 포맷인지 모름 | 산출물 신뢰도 의문 |
| **반복 사용** | CTO → COO 순서 진행. release-engineer 호출 | "CI/CD가 만들어졌는데, 지금 필요한가?" | COO → release-engineer | default-execute: CI/CD 파이프라인 자동 생성 → 수정에 더 많은 시간 소모 | "쓸데없이 만든다" 통증 발생 |
| **재실행/포기** | 같은 오류 반복 또는 VAIS 비활성화 | "결국 직접 하는 게 빠르다" | - | 산출물 포맷 비표준, template 없음, 추적 불가 | 이탈 또는 간헐적 사용 |

**현재 여정의 핵심 마찰점 2개**:
1. **온보딩~첫 실행**: 기대 설정 불명확 + Project Profile 없음 → 첫 산출물이 scope에 맞지 않을 가능성.
2. **반복 사용**: default-execute → 불필요한 산출물 → "AI가 생각 없이 만든다"는 인식 고착.

#### 2.6.2 목표 여정 — "Profile 1회 합의 → 정책 게이트 자동 → 정전 기반 산출물"

| 단계 | 고객 행동 | 생각/감정 | 터치포인트 | 기회 | 목표 상태 |
|------|---------|---------|---------|------|---------|
| **인지** | 커뮤니티에서 "VAIS가 PRD+ADR+Lean Canvas를 정전 기반으로 만들어준다"는 실제 사용 후기 | "이건 믿을 수 있는 포맷을 보장해주는구나" | 사용 후기 + 산출물 스크린샷 | template(depth c) 예시 공개가 최고의 마케팅 | 기대 설정 명확 |
| **온보딩** | Project Profile 질문 5~7개 (5분 이내) | "내 프로젝트 상황을 한 번 말하면 되는구나" | ideation phase 첫 화면 | Profile 1회 합의 → 이후 재설명 불필요 | 이탈률 낮춤 |
| **첫 실행** | artifact set 합의 화면 — A/B/C/D 정책 산출물 목록 확인 | "이 중에서 내가 필요한 것만 골라서 진행하는구나" | ideation 종료 체크포인트 | 사용자 주권(Rule #11) + 과잉 생성 방지 | 첫 산출물 신뢰도 높음 |
| **반복 사용** | CTO → COO. COO가 "이 프로젝트는 deployment.target=local-only이므로 CI/CD skip"을 자동 판단 | "AI가 내 상황을 알고 적절히 판단하는구나" | Project Profile → B정책 자동 적용 | scope 게이트가 "쓸데없이 만든다" 문제 해결 | 반복 사용률 상승 |
| **추천/재사용** | 팀에게 VAIS 산출물 공유. "이 Lean Canvas는 Ash Maurya 형식이야"라고 설명 가능 | "이 산출물은 근거가 있어서 공유할 수 있다" | _tmp/ 추적성 + 정전 출처 명시 | P2/P3에게 팀 표준화 도구로 포지셔닝 | NPS 상승, word-of-mouth |

**현재 → 목표 전환에 필요한 핵심 변경 3가지**:
1. Project Profile을 ideation 첫 단계로 의무화.
2. B/C/D 정책 sub-agent 게이트 구현 (before-execute scope check).
3. template(depth c) — 각 산출물에 정전 출처 + sample + checklist + anti-pattern 명시.

---

## 3. Decisions

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|--------------------|--------|-----------|
| 1 | TAM 산정 방법론 | 하향식 단독 / 상향식 단독 / 교차 | 교차 검증 | 두 방법론 오차가 크므로 중간값 사용. 수치보다 방향성 확인이 목적 |
| 2 | persona 수 | 2개 / 3개 / 5개 | 3개 (행동 패턴 기반) | 솔로/팀리더/컴플라이언스 3가지 다른 JTBD. 4번째 추가 시 중복 발생 |
| 3 | 경쟁사 선정 기준 | 코딩 AI / 멀티에이전트 / 전체 | 멀티에이전트 orchestration 5종 | VAIS의 직접 경쟁 영역은 orchestration layer |
| 4 | Reference Canon 검증 방식 | 3×10 매트릭스 | 채택 | 어떤 정전이 어떤 persona에 실제로 유의미한지 교차 확인 가능 |
| 5 | Journey Map 형식 | 현재만 / 목표만 / 현재+목표 대조 | 현재+목표 대조 | 설계 단계에서 "As-Is → To-Be" 갭을 명시해야 구현 방향 명확 |

---

## 4. Artifacts

### 4.1 생성/수정 파일

| Path | Type | Change |
|------|------|--------|
| docs/subagent-architecture-rethink/02-design/_tmp/product-researcher.md | create | 본 문서 |

### 4.2 외부 참조 (정전 기반)

- Steve Blank TAM/SAM/SOM: *Four Steps to the Epiphany* (2005)
- JTBD 프레임워크: Ulwick *Jobs To Be Done* / Christensen *Competing Against Luck*
- Persona 방법론: Cooper *The Inmates Are Running the Asylum*
- Journey Map: Service Design Thinking (Stickdorn/Schneider)
- AutoGPT / CrewAI / LangGraph / AutoGen / Devin — 각 공식 문서 기반 (웹 검색 미수행, 지식 기반)

---

## 5. Handoff

**CPO (큐레이션)에게**:
- 2.1절(VAIS 내부 현황) → sub-agent 재정의 설계 시 근거로 사용. 특히 6개 default-execute 대상 agent 목록이 설계 우선순위.
- 2.2절(경쟁 분석) → CrewAI와의 차별화 포인트("Artifact 소유로 경계 정의")가 template 설계 방향과 직결.
- 2.3절(TAM/SAM/SOM) → 수치 불확실성 높음. 한국 클로드 사용자 실제 수치 확인 필요. 비즈니스 케이스보다 "방향성 확인" 용도로 사용 권장.
- 2.4절(Personas) → P1의 "쓸데없는 것 안 만들기 > 빠른 것"이 핵심 인사이트. B/C/D 정책 구현의 사용자 가치를 이 인사이트로 정당화.
- 2.5절(Reference Canon 검증) → Team Topologies P1 적용 불가, Torres OST P1 경량화 필요 — template에서 persona별 "권장 산출물 subset" 분기 고려.
- 2.6절(Journey Map) → 현재→목표 전환의 핵심 3가지 변경을 설계 요구사항으로 직접 전환 가능.

**열린 질문**:
- TAM/SAM/SOM 수치 검증: Claude Code 플랫폼 공식 사용자 수 데이터 필요.
- P3(엔터프라이즈 PM) 실제 인터뷰 필요 — extended-scope 4번 인터뷰 항목에 포함됨.
- "Team Topologies P1 적용 불가" → P1용 경량 버전 산출물(예: "JTBD + 산출물 정책" 2단 온보딩) 별도 설계 가능성 검토.

**기술 부채**:
- seo-analyst, finops-analyst description 한국어 서술 → D1 위반. 우선순위: Medium.
- 6개 default-execute agent 전체에 "before-execute scope check" 단계 추가 필요. 우선순위: High.

---

## 6. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — design phase product-researcher 전범위 (내부 현황/경쟁/TAM-SAM-SOM/Personas/Canon/Journey Map) |
