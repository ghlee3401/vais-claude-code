<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="license" />
</p>

<h1 align="center">VAIS Code</h1>

<p align="center">
  <strong>Virtual AI C-Suite for Software Development — v1.3.0</strong><br/>
  organization-in-a-box · 6 C-Level Executives · 47 Specialized Sub-agents · 7-Dimension Routing Algorithm
</p>

<p align="center">
  PO 의 자연어 의도를 CEO 가 7 차원 알고리즘으로 객관 매핑 → 활성 C-Level 동적 결정 → 자동 위임으로 서비스 라이프사이클 실행하는 Claude Code 플러그인
</p>

---

## Quick Start

### Requirements

| 의존성 | 버전 | 용도 |
|--------|------|------|
| Node.js | ≥ 18 | plugin runtime |
| Python3 | ≥ 3.8 | `vendor/ui-ux-pro-max` 디자인 시스템 검색 — design phase MCP 자동 호출 (기본 ON) |

> ⚠️ **Python3 미설치 시** design phase 진입이 차단됩니다 (Hard fail). opt-out 원할 시 `vais.config.json > orchestration.mcp.enabled: false` 설정.

```bash
# Install
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code && bash scripts/setup-dev.sh

# Python3 확인 (design phase 자동 호출 사용 시 필수)
python3 --version  # 3.8 이상

# In Claude Code
/reload-plugins
/vais help
```

> **(선택) Real SendMessage 활성화**: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` + Claude Code 2.1+ + `vais.config.json > agentTeams.enabled=true`. `enabled=false` 는 sequential, `enabled=true` + env flag 없음은 simulation fallback 입니다. 자세한 설명은 [ONBOARDING.md#agent-teams-activation](./ONBOARDING.md#agent-teams-activation)

**3가지 사용법:**

```bash
# 1) 서비스 런칭 — CEO가 전체 파이프라인 지휘
/vais ceo plan online-bookstore

# 2) 기술 구현만 — PRD/기획이 이미 있을 때
/vais cto plan login

# 3) 특정 C-Level 직접 — 원하는 전문가만 호출
/vais cbo plan market-entry          # 비즈니스 분석
/vais cso plan payment-integration   # 보안 검토
/vais cpo plan user-dashboard        # 제품 기획
```

**Phase 지정:**

```bash
/vais ceo ideation my-idea     # (선택) 아이디어 자유 대화
/vais cpo plan my-feature      # 기획
/vais cto design my-feature    # 설계
/vais cto do my-feature        # 구현
/vais cto qa my-feature        # QA
/vais cto report my-feature    # 리포트
```

**임원/대외 보고 (독립 커맨드):**

```bash
/vais brief {주제}          # VARCO 고정 양식 기술 보고서 (HTML)
/vais brief {주제} --deck   # 16:9 슬라이드 덱
```

> 개발 워크플로우와 무관하게 대화 맥락·제공 자료로 보고서를 생성합니다. 정본: `skills/brief/SKILL.md`

---

## What Happens When You Run `/vais ceo`

사용자가 "온라인 서점 SaaS 만들어줘"라고 입력하면, CEO 는 **고정 시나리오를 따르지 않고** `lib/ceo-algorithm.js` 의 `analyzeCEO(request)` 를 호출해 7 차원 (보안/컴플라이언스/UX/데이터모델/외부통신/성능/제품정의) 등급을 산출하고, 그 결과로 **활성 C-Level 을 동적으로 결정**합니다.

전형적인 신규 서비스 흐름 (CEO 알고리즘이 dimensions 모두 medium+ 으로 판정한 경우):

| Step | C-Level | What They Do | Note |
|------|---------|-------------|------|
| **①** | **CPO** | PRD + 페르소나 + JTBD + Opportunity Solution Tree | productDefinition=high 시 자동 |
| **②** | **CSO** (선택) | Threat model | security ≥ medium 시 자동 |
| **③** | **CTO** | 아키텍처 + 데이터 모델 + API 계약 + UI 흐름 → 구현 + QA | mandatory PDCA (plan→design→do→qa) |
| **④** | **CSO** | OWASP 감사 + 시크릿 스캔 + 의존성 분석 | security/externalAPI ≥ medium 시 |
| **⑤** | **CBO** (명시 호출) | GTM + 가격 + Unit economics + 재무 모델 | Secondary — `/vais cbo` 로 명시 호출만 |
| **⑥** | **COO** (명시 호출) | CI/CD + 배포 전략 + 모니터링 + Runbook | Secondary — `/vais coo` 로 명시 호출만 |
| **Final** | **CEO** | 전체 산출물 종합 리뷰 → 리포트 | — |

**핵심 동작**:
- **4 Primary 자동 라우팅 (CEO/CPO/CTO/CSO)** — CEO 알고리즘이 자동 결정
- **2 Secondary 명시 호출 (CBO/COO)** — `/vais cbo|coo` 명시 시만 활성. 비즈니스/운영 영역은 옵션
- **CTO 만 mandatory PDCA**, 비-CTO 는 CEO 알고리즘 결정으로 phase 활성화
- **lean checkpoint (기본)**: CP-0/CP-Q 만 발동, 나머지는 자동 진행 + outro 한 줄. PO 클릭 ≤ 2회/피처
- CEO 진입 시 algorithm 결과 (7 차원 등급 표) 를 응답에 직접 인용 — LLM 자체 라우팅 금지
- CSO ↔ CTO 보안 검토 루프 최대 2회 (`pipeline.reviewLoops.cso-cto.maxIterations`)

---

## C-Suite Team

### Executive (Opus) — 4 Primary + 2 Secondary

| C-Level | Tier | Domain | One-liner |
|---------|------|--------|-----------|
| **CEO** | Primary | Strategy | 7 차원 알고리즘 (`lib/ceo-algorithm.js`) 으로 PO 의도 매핑 → 활성 C-Level 동적 결정. 자동 라우팅 진입점 |
| **CPO** | Primary | Product | 무엇을 만들지 결정. PRD, 페르소나, JTBD, Opportunity Solution Tree, 백로그 |
| **CTO** | Primary | Technology | 어떻게 만들지 실행. 아키텍처, 개발, 테스트, 디버깅. **mandatory PDCA** |
| **CSO** | Primary | Security | 안전한지 확인. OWASP 감사, 시크릿/의존성 스캔, 독립 코드 리뷰, threat model |
| **CBO** | Secondary | Business | 사업성 검증. 시장 분석, GTM, 가격 전략, 재무 모델, unit economics. **명시 호출만** (`/vais cbo`) |
| **COO** | Secondary | Operations | 배포/운영. CI/CD, 모니터링, 성능 벤치마크, Runbook. **명시 호출만** (`/vais coo`) |

> **Primary** = CEO 알고리즘이 자동 라우팅. **Secondary** = 코드 개발 외 영역이라 사용자가 `/vais cbo|coo {feature}` 명시 호출 시만 활성.

### Sub-agents (Sonnet) — 47 Specialists

<details>
<summary><strong>CEO</strong> — 6 agents</summary>

| Agent | Role |
|-------|------|
| absorb-analyzer | 외부 스킬/레퍼런스 흡수 분석 |
| skill-creator | 신규 스킬/에이전트 마크다운 자동 생성 |
| vision-author | Vision Statement + BHAG (Collins & Porras 'Built to Last') |
| strategy-kernel-author | Strategy Kernel — Diagnosis + Guiding Policy + Coherent Actions (Rumelt) |
| okr-author | OKR 정의 (Grove/Doerr) — Objective + 3~5 KR + 0.7 stretch scoring |
| pr-faq-author | Amazon Working Backwards PR/FAQ (1-page Press Release + Internal/External FAQ) |

</details>

<details>
<summary><strong>CPO</strong> — 8 agents</summary>

| Agent | Role |
|-------|------|
| product-discoverer | 시장 기회 발굴, 고객 니즈 분석 |
| product-strategist | 제품 전략 수립, 우선순위 결정 |
| product-researcher | 경쟁사 벤치마킹, 사용 패턴 분석 |
| prd-writer | PRD 작성 (기능/비기능 요구사항, 인수 기준) |
| backlog-manager | PRD → User Story + Sprint Plan 변환 (INVEST/MoSCoW/RICE) |
| roadmap-author | Now-Next-Later Roadmap (outcome-based, OKR → backlog 브릿지) |
| ux-researcher | JTBD 인터뷰, 사용성 테스트, 정보 구조 설계 |
| data-analyst | 제품 메트릭 분석 (DAU/MAU, A/B 테스트, 퍼널) |

</details>

<details>
<summary><strong>CTO</strong> — 8 agents</summary>

| Agent | Role |
|-------|------|
| infra-architect | DB 스키마, 환경 설정, 프로젝트 셋업 |
| backend-engineer | API, 비즈니스 로직, 데이터 검증 |
| frontend-engineer | UI 컴포넌트, 상태 관리, 클라이언트 최적화 |
| ui-designer | IA, 와이어프레임, UI 디자인 |
| db-architect | DB 스키마 최적화, 마이그레이션, 쿼리 튜닝 |
| qa-engineer | Gap 분석, 코드 리뷰, QA 검증 (≥90% match) |
| test-engineer | 단위/통합/E2E 테스트 코드 생성 |
| incident-responder | 체계적 디버깅 (investigate → analyze → hypothesize → implement) |

</details>

<details>
<summary><strong>CSO</strong> — 7 agents</summary>

| Agent | Role |
|-------|------|
| security-auditor | OWASP Top 10 보안 감사 |
| code-reviewer | 독립 코드 리뷰 (CTO 피어 리뷰와 별개) |
| secret-scanner | API 키/토큰/비밀번호 탐지 (regex + entropy + heuristics) |
| dependency-analyzer | CVE 취약점, 라이선스, 공급망 리스크 분석 |
| plugin-validator | 플러그인 배포 전 구조 검증 |
| skill-validator | 스킬/에이전트 마크다운 frontmatter 검증 |
| compliance-auditor | GDPR, 라이선스 준수 확인 |

</details>

<details>
<summary><strong>CBO</strong> — 10 agents</summary>

| Agent | Role |
|-------|------|
| market-researcher | 시장/경쟁 분석 (PEST, SWOT, Porter 5F, TAM/SAM/SOM) |
| customer-segmentation-analyst | 고객 세분화, 페르소나 (RFM, JTBD, AARRR+R) |
| seo-analyst | SEO 감사, 콘텐츠 캘린더, Core Web Vitals |
| copy-writer | 브랜드 포지셔닝, 마케팅 카피 (PAS/AIDA/BAB) |
| growth-analyst | GTM 전략, growth loop, 퍼널 최적화, North Star Metric |
| pricing-analyst | 가격 전략 (Cost-plus, Value-based, GBB tiering) |
| financial-modeler | 3-Statement 모델, DCF, 시나리오 분석 (Bear/Base/Bull) |
| unit-economics-analyst | CAC/LTV/Payback, cohort 분석, SaaS metrics |
| finops-analyst | 클라우드 비용 분석, right-sizing, waste detection |
| marketing-analytics-analyst | 멀티터치 어트리뷰션, 채널 ROI, incrementality |

</details>

<details>
<summary><strong>COO</strong> — 8 agents</summary>

| Agent | Role |
|-------|------|
| ci-cd-configurator | CI/CD 파이프라인 (GitHub Actions/GitLab CI/CircleCI) — scope-gated (cloud/hybrid only) |
| container-config-author | Dockerfile + docker-compose (multi-stage + non-root) — scope-gated |
| migration-planner | DB 스키마 마이그레이션 (forward + rollback + 데이터 손실 위험 평가) — triggered |
| runbook-author | 운영 Runbook (Google SRE) — deploy checklist + Sev 1~4 incident playbook — scope-gated |
| release-notes-writer | Release Notes + CHANGELOG.md (Keep a Changelog 6 sections + SemVer 자동 판정) |
| sre-engineer | 모니터링/알림 설정, incident runbook |
| release-monitor | 배포 후 canary 모니터링 |
| performance-engineer | 성능 벤치마크, 회귀 탐지 |

</details>

---

## Routing — 7 Dimension Algorithm

고정 시나리오 표 대신, CEO 가 `lib/ceo-algorithm.js` 의 `analyzeCEO(request)` 로 7 차원 등급을 산출해 **활성 C-Level 을 동적 결정** 합니다. PO 가 자연어로 의도만 던지면 CEO 가 객관 알고리즘으로 매핑합니다.

**7 차원** (`DIMENSIONS` 배열):

| # | 차원 | 트리거 예시 |
|---|------|-----------|
| 1 | 보안 (security) | 인증/인가, 결제, 개인정보, secret |
| 2 | 컴플라이언스 (compliance) | GDPR, 약관, 라이선스, 감사 로그 |
| 3 | UX | 화면 추가, 사용자 플로우, 정보 구조 |
| 4 | 데이터모델 (dataModel) | 엔티티, 스키마, 마이그레이션 |
| 5 | 외부통신 (externalAPI) | 외부 SaaS 연동, 웹훅, OAuth |
| 6 | 성능 (performance) | 응답시간, 처리량, 비용 |
| 7 | 제품정의 (productDefinition) | 신규 피처/제품, PRD 부재 |

**알고리즘 흐름**:

```
사용자 입력
  ↓
analyzeDimensions()  → { dim1: 'high', dim2: 'medium', ... } (none/low/medium/high)
  ↓
buildArtifactPlan()  → phase × artifact 매트릭스 (각 artifact 의 trigger 함수가 등급 충족 시 활성)
  ↓
extractActiveCLevel() → ['ceo', 'cpo', 'cto', ...]   (Primary 만 자동 추천)
  ↓
CEO 응답에 7 차원 등급 표 직접 출력 + AskUserQuestion 으로 사용자 승인
```

**예시 매핑** (`PHASE_ARTIFACT_MAPPING` 발췌):

| Phase | Artifact | Owner | Trigger |
|-------|----------|-------|---------|
| 01-plan | prd | cpo | productDefinition !== 'none' |
| 01-plan | persona | cpo | ux ≥ medium |
| 01-plan | jtbd | cpo | productDefinition === 'high' |
| 01-plan | threat-model | cso | security ≥ medium |
| 02-design | architecture | cto | always |
| 02-design | data-model | cto | dataModel ≥ medium |
| 02-design | api-contract | cto | externalAPI ≥ medium |
| 02-design | ui-flow | cto | ux ≥ medium |
| 03-do | secret-scan | cso | security ≥ medium |
| 03-do | dependency-vulnerability | cso | externalAPI ≥ medium |

비-Primary 영역 (CBO/COO) 은 알고리즘 결과에 포함되지 않으며, 사용자가 `/vais cbo|coo {feature}` 로 명시 호출 시만 활성. 정본: `lib/ceo-algorithm.js` (197줄), `agents/ceo/knowledge/seven-dimension-routing.md`.

---

## Workflow

**CTO 만 mandatory PDCA**, 비-CTO 는 CEO 7 차원 알고리즘 결정으로 phase 활성화.

| Phase | CTO mandatory? | 비-CTO 활성화 조건 | Description |
|-------|:--------------:|--------------------|-------------|
| **Ideation** | Optional (CEO) | CEO 진입 시 | 자유 대화 — PRD 부재 / 모호한 요구사항. CEO 가 7 차원 분석 + Plan 자동 참조 |
| **Plan** | ✓ | CEO 알고리즘이 owner C-Level 추천 시 | 요구사항 정의, 범위 설정, 타임라인 |
| **Design** | ✓ | CTO 가 cpo prereq 호출 시 | 아키텍처, 데이터 모델, API 계약, UI 흐름 |
| **Do** | ✓ | CTO 가 sub-agent 병렬 위임 | 구현 (frontend + backend + test 병렬) |
| **QA** | ✓ | CTO qa-engineer 위임 | Gap 분석. matchRate ≥ 90% (`gapAnalysis.maxIterations` = 2, autoIterate `escalate-on-fail`) |
| **Report** | Optional | 사용자 명시 호출 시 | 최종 리포트, 회고, KPI |

**Lean checkpoint** (기본): CP-0 (PRD missing) + CP-Q (Critical or matchRate<90) 만 발동. CP-1/CP-D/CP-G/CP-2 는 자동 진행 + outro 한 줄. PO 클릭 ≤ 2회/피처 추정.

`vais.config.json > workflow.checkpointPolicy.mode = "lean"` (기본). `standard` / `strict` 토글 가능.

**C-Level 간 의존성** (참고 — CEO 가 컨텍스트 따라 유연 판단, hard constraint 아님):

| C-Level | 선행 조건 |
|---------|-----------|
| CPO | 없음 |
| CTO | CPO 완료 권장 (PRD 입력) |
| CSO | CTO 완료 (구현물 필요) |
| COO | CTO 완료 (구현물 필요) |
| CBO | 없음 (Secondary, 명시 호출만) |

---

## Ideation (Phase 0)

아이디어가 아직 모호할 때 사용합니다. 산출물 강제 없이 자유 대화로 아이디어를 숙성시킵니다.

```bash
/vais ceo ideation pricing-strategy
```

**동작:**
1. CEO가 ideation 모드로 진입 — PRD 템플릿 강제 없음, "plan 갈까요?" 반복 질문 금지
2. **첫 turn scope probe**: 30분 이내 직접 편집으로 해결 가능하면 "이건 `/vais` 규모 아닙니다. 바로 실행?" 제안
3. 사용자 주도로 자유 대화 (5~10 turn)
4. 두 종료 분기:
   - **A. 요약 + plan** ("정리해줘" / "plan 가자" / "요약") → `docs/pricing-strategy/00-ideation/main.md` 저장 + 다음 C-Level 추천
   - **B. 직접 실행** ("그냥 해줘" / "바로 실행" / "skip vais") → 문서 **없이** 종료, 일반 Edit/Write로 직접 처리

**Ideation 없이 plan 직행도 가능:** `/vais cpo plan my-feature` — 기존과 동일하게 동작합니다.

---

## Quality Gates

### 4-Step Harness Gate

Sub-agent 종료 시 자동 실행되는 검증 파이프라인:

| Step | Check | On Failure |
|------|-------|------------|
| **1. Document** | 필수 산출물 존재 (≥ 500B) | 누락 파일 목록 |
| **2. Checkpoint** | AskUserQuestion 기록 존재 | 미승인 항목 표시 |
| **3. Gate** | 1+2 종합 판정 | 실패 사유 집계 |
| **4. Transition** | 통과 → 다음 phase 자동 전이 / 실패 → 재시도 가이드 | 디버그 팁 제공 |

### Advisor Tool (M-24)

모든 Sonnet sub-agent에 Opus reviewer가 내장되어, 작업 중 자동으로 전략 조언을 수신합니다:

- **Early plan** (1회) — 접근 방향 검증
- **Stuck** (1회) — 막혔을 때 대안 제시
- **Final review** (1회) — 완료 전 누락 확인
- Max 3회/요청. 월 $200 예산 캡 초과 시 자동 비활성화 (Sonnet 단독 계속)

### CSO Final Gate

코드가 수정되는 **모든** 시나리오에서 CSO가 최종 보안 검증을 수행합니다. CSO 승인 없이는 배포 단계로 넘어갈 수 없습니다.

---

## Document Structure (sub-agent 직접 박제)

```
docs/
└── {feature}/                    # 피처 중심 구조
    └── {NN-phase}/               # 00-ideation / 01-plan / 02-design / 03-do / 04-qa / 05-report
        ├── main.md               # C-Level 5섹션 인덱스 (Executive Summary / Decision Record /
        │                         #   Artifacts 표 / CEO 판단 근거 / Next Phase). 본문 X.
        │                         # 여러 C-Level 이 기여 시 ## [CEO] / ## [CTO] H2 append-only,
        │                         # 다른 C-Level 섹션·Decision Record 행 수정 금지
        ├── {artifact}.md         # sub-agent 직접 박제 (frontmatter 4 필수)
        │                         # 예: prd.md / persona.md / threat-model.md / architecture.md
        │                         # 1 sub-agent → N artifact = N MD (큐레이션 X)
        └── interface-contract.md # (02-design 만, 시스템 산출물)
```

**핵심 원칙**:

1. **sub-agent 직접 박제** — sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 frontmatter 와 함께 직접 작성 (`_tmp/` 폐기). C-Level 은 main.md 의 Artifacts 표에 frontmatter `summary` 만 인덱싱.
2. **frontmatter 4 필수** (`vais.config.json > workflow.frontmatterMinimal`):
   ```yaml
   ---
   owner: cto                    # ceo|cpo|cto|cso|cbo|coo
   artifact: prd                 # 파일 stem 과 일치
   phase: plan                   # ideation|plan|design|do|qa|report
   feature: social-login         # kebab-case
   # 선택 (auto-hydrate): agent / generated / source / summary / knowledge_refs
   ---
   ```
3. **main.md = 5 섹션 인덱스만** — Executive Summary / Decision Record (multi-owner, append-only, Owner 컬럼 필수) / Artifacts 표 / CEO 판단 근거 (7 차원 등급 표 인용) / Next Phase. 본문 작성 X (200줄 자연 충족, `mainMdMaxLines` warn).
4. **Knowledge lazy-load** (`agents/{c-level}/knowledge/*.md`, 19 MD) — phase + artifact 매칭 시만 Read. C-Level 메인의 "Knowledge Index" 표가 trigger 명시.
5. **Templates 4-tier auto-select** (`scripts/auto-select-template.js`) — `git status` surface count + domain 분포 + PRD 상태로 stub/minimal/standard/extended 자동 선택. `confidence < 0.6` 시 fallback CP-1.

**검증** (`scripts/doc-validator.js`):
- W-OWN-01 (owner 누락) = **warn**
- W-FRONT-01 (artifact/phase/feature 누락) = warn
- W-FRONT-02~05 (enum/stem mismatch/summary>200) = warn
- W-SCOPE-01/02/03 (plan/main.md 필수 3섹션) = **fail** (exit 1)
- 정본: `vais.config.json > workflow.frontmatterMinimal.required` (config 변경만으로 strict ↔ minimal 토글)

---

## Project Layout

```
vais-claude-code/
├── agents/          6 C-Level 디렉토리 + 47 sub-agents + _shared 가드 + knowledge/ 19 MD
│   ├── {c-level}/{c-level}.md         # 메인 (orchestrator, thin)
│   ├── {c-level}/{sub-agent}.md       # 47 specialists
│   ├── {c-level}/knowledge/*.md       # 도메인 지식 lazy-load (19 MD)
│   └── _shared/                       # checkpoint-policy / work-rules / outro-format /
│                                      #   clevel-main-guard / subdoc-guard / advisor-guard
├── skills/vais/     /vais 스킬 진입점 + phase routers (ceo/cpo/cto/cso/cbo/coo/ideation) + utilities
├── lib/             ceo-algorithm (197줄, 7 차원), patch-block, status, paths, advisor, ...
├── scripts/         vais-validate-plugin, doc-validator, auto-judge, auto-select-template,
│                    patch-clevel-guard, patch-subdoc-block, ...
├── templates/       PDCA 문서 템플릿
│   ├── plan-{stub,minimal,standard,extended}.template.md   # 4-tier auto-select
│   ├── {ideation,design,do,qa,report}.template.md          # phase 별
│   ├── main-md.template.md                                 # 5 섹션 인덱스 정본
│   └── {alignment,biz,core,how,what,why}/                  # 36 sub-agent artifact 템플릿
├── hooks/           SessionStart, PreToolUse (bash-guard, design-mcp-trigger, ideation-guard),
│                    SubagentStart/Stop, Stop (doc-tracker, doc-validator)
├── design-system/   Brand-first 카탈로그 (brands/{slug}/DESIGN.md × 71 Google Stitch 포맷, default 5 pre-baked + lazy import)
├── mcp/             vais-design-system MCP 서버 (design_search heuristics 가드레일)
├── ONBOARDING.md    5분 진입 가이드
├── CLAUDE.md        Claude Code 전용 지침 (자동 로드)
├── AGENTS.md        Cursor/Copilot 등 범용 AI 호환 지침
├── vais.config.json 플러그인 전체 설정
└── package.json     매니페스트
```

---

## Configuration

핵심 키:

| Setting | Default | Description |
|---------|---------|-------------|
| `workflow.phases` | ideation ~ report | PDCA phases (ideation optional) |
| **`workflow.checkpointPolicy.mode`** | `lean` | `lean` (CP-0/CP-Q 만) / `standard` / `strict` |
| **`workflow.template.autoSelect`** | `true` | `scripts/auto-select-template.js` 휴리스틱으로 stub/minimal/standard/extended 자동 선택 |
| **`workflow.frontmatterMinimal.required`** | `[owner, artifact, phase, feature]` | `doc-validator` 가 동적 로드. config 변경만으로 strict ↔ minimal 토글 |
| **`cSuite.knowledgePath`** | `agents/{role}/knowledge/` | C-Level 도메인 지식 lazy-load 경로 |
| **`cSuite.primary`** | `[ceo, cpo, cto, cso]` | CEO 자동 라우팅 대상 |
| **`cSuite.secondary`** | `[cbo, coo]` | 사용자 명시 호출만 |
| **`gapAnalysis.maxIterations`** | `2` | 무한루프 차단. `autoIterate = "escalate-on-fail"` |
| **`pipeline.reviewLoops.cso-cto.maxIterations`** | `2` | CSO ↔ CTO 보안 검토 루프 |
| `gates.cto.plan.requirePrd` | `smart` | `missing` 만 CP-0 발동, `partial` 자동 강행 |
| `gapThreshold` | 0.90 | QA 통과 기준 (90%) |
| `advisor.enabled` | true | Opus advisor 활성화 |
| `advisor.monthly_budget_usd` | 200 | 월 advisor 비용 캡 |
| `orchestration.mcp.enabled` | true | design-system MCP heuristics 자동 호출 (기본 ON, Python3 ≥ 3.8 필수) |
| **`designSystem.model`** | `brand-first` | Design system 모델 (brand-first only; mui-first deprecated) |
| **`designSystem.defaultBrand`** | `null` | hook 미선택 fallback. CI 환경은 slug 지정 (예: `claude`). `VAIS_DEFAULT_BRAND` env 가 우선 |
| **`designSystem.preBakedBrands`** | `[claude, linear, stripe, vercel, notion]` | repo 사전 박제 5 brand. 나머지는 사용자 선택 시 lazy import |
| **`designSystem.blockOnMissingBrand`** | `true` | brand 미선택 + fallback 없으면 design phase 차단 (block-soft) |

---

## Testing

```bash
npm test    # design-system MCP integration tests 포함
```

---

## Developer Setup

Git hooks 활성화 (1회 실행):

```bash
npm run prepare-hooks
```

활성화되는 검사:

- **legacy-path-guard** — `docs/NN-` 레거시 경로 패턴 커밋 차단 (예외: `docs/_legacy/`, `CHANGELOG.md`, 회귀 가드)
- ESLint (`scripts/`, `lib/`, `hooks/` — max-warnings 0)
- Unit tests (`node --test tests/*.test.js`)

비활성화:

```bash
git config --unset core.hooksPath
```

> `git commit --no-verify`로 hook을 우회하지 마세요. 규칙 위반은 LLM 재발 위험 + 수십 파일 재치환을 유발합니다. 자세한 정책은 `docs/legacy-path-guard/` 참조.

---

## CI Status Check 강제 (owner 수동 설정)

PR merge를 CI 통과 후에만 허용하려면 저장소 owner가 branch protection rule을 수동으로 설정해야 합니다:

1. GitHub 저장소 → **Settings** → **Branches**
2. **Branch protection rules** → **Add rule**
3. Branch name pattern: `main`
4. ✅ **Require status checks to pass before merging**
5. Status check 검색창에서 `CI / build-and-test` 선택 (workflow job name)
6. ✅ **Require branches to be up to date before merging**
7. (선택) ✅ **Require pull request reviews before merging**

> 자동화 범위 밖 — GitHub REST API로 설정 가능하나 owner PAT 필요. 수동 설정 유지.
> 관련 설계: `docs/ci-bootstrap/02-design/main.md §5`

---

## Documentation

- **[ONBOARDING.md](./ONBOARDING.md)** — 5분 진입 가이드 (처음 본 AI/사람용)
- **[CLAUDE.md](./CLAUDE.md)** — Claude Code 전용 지침 (자동 로드, Mandatory Rules + Project Structure)
- **[AGENTS.md](./AGENTS.md)** — Cursor/Copilot 등 범용 AI 호환 지침
- **[CHANGELOG.md](./CHANGELOG.md)** — 전체 버전 이력
- **[lib/ceo-algorithm.js](./lib/ceo-algorithm.js)** — 7 차원 알고리즘 정본 (197줄)
- **[agents/ceo/knowledge/seven-dimension-routing.md](./agents/ceo/knowledge/seven-dimension-routing.md)** — 알고리즘 한국어 명세

---

## License

MIT

<p align="center">
  <sub>Built with <a href="https://claude.ai/claude-code">Claude Code</a></sub>
</p>
