> Author: prd-writer
> Phase: do
> Refs: 00-ideation/main.md, 01-plan/main.md + 5 topics, 02-design/main.md + 5 topics

---
agent: prd-writer
phase: do
feature: subagent-architecture-rethink
created: 2026-04-25
artifact_type: prd-draft-for-cpo-curation
---

> Summary: VAIS Code 44개 sub-agent의 default-execute anti-pattern을 해소하고, *제품의 탄생* 4단계 메타-프레임 + "산출물이 sub-agent를 정의한다" 메타-원칙 + Project Profile + 실행 정책 4분류(A/B/C/D) + 50+ 산출물 카탈로그 (c) 깊이 표준화를 통해 VAIS를 지식 거울(mirror)에서 지식 의수(prosthesis)로 전환하는 메타-프로덕트 리팩터링 PRD.

---

## 1. Summary

VAIS Code의 44개 sub-agent는 C-Level마다 분리 기준이 다르고, 호출 즉시 산출물을 생성하는 default-execute anti-pattern이 내재되어 있으며, 50+ 산출물의 88%에 표준 template이 없다. 이로 인해 사용자는 "쓸데없이 CI/CD를 만드는" 마찰을 경험하며, 검증된 산출물 대신 AI가 매 호출마다 포맷을 발명한다. 본 PRD는 이 세 가지 구조적 문제를 *제품의 탄생* 4단계 메타-프레임(Core/Why/What/How) + "산출물이 sub-agent를 정의한다" 메타-원칙 + Project Profile(12 변수) + 실행 정책 4분류(A/B/C/D) + 50+ 산출물 카탈로그 (c) 깊이 표준화로 일괄 해소한다.

본 피처가 완료되면 VAIS는 사용자의 지식 지도를 그대로 반영하는 거울(mirror)에서 모르는 영역을 대신 채우고 불필요한 산출물을 자동 차단하는 의수(prosthesis)로 전환된다. 단계 간 alignment 메커니즘(α auto-judge + β alignment 산출물)이 Core↔Why↔What↔How 정합성을 시스템적으로 검증하고, ux-researcher 외부 인터뷰(5~7명)로 Project Profile schema와 정책 4분류의 실제 유효성을 검증한다.

---

## 2. Contacts

| 이름 / 역할 | 담당 영역 | 연락처 |
|------------|---------|--------|
| **이근호** — Product Owner | 전체 방향 결정, 정책 우선순위, 최종 승인 | ghlee0304@ncsoft.com |
| **CEO (AI)** | 동적 라우팅, C-Suite 조율, 최종 리뷰 | `/vais ceo` |
| **CPO (AI)** | PRD 합성, 백로그 관리, sub-agent 위임 | `/vais cpo` |
| **CTO (AI)** | 기술 설계, Profile schema 구현, template 작성, sub-agent md 신설 | `/vais cto` |
| **CSO (AI)** | skill-validator 적용 (44 sub-agent 점검), compliance 검증 | `/vais cso` |
| **CBO (AI)** | GTM, 외부 인터뷰 모집 지원, VPC 재매핑 산출물 | `/vais cbo` |
| **COO (AI)** | release-engineer 5분해, CI/CD configurator 신설 | `/vais coo` |

**sub-agent 위임 매트릭스**:

| Phase | 위임 sub-agent | 산출물 |
|-------|--------------|--------|
| do (현재) | prd-writer (본 PRD) | `03-do/_tmp/prd-writer.md` |
| do | CTO → infra-architect, backend-engineer | Profile schema 구현, lib/project-profile.js |
| do | COO → release-notes-writer, ci-cd-configurator, container-config-author, migration-planner, runbook-author (신설) | agents/coo/*.md + templates/coo/*.md |
| do | CEO → vision-author, strategy-kernel-author, okr-author, pr-faq-author (신설) | agents/ceo/*.md + templates/core/*.md |
| qa | CSO → skill-validator | 44 sub-agent 점검 매트릭스 |
| qa | ux-researcher (CPO 서브) | 외부 인터뷰 5~7명 + 리포트 |

---

## 3. Background

### 왜 지금인가

VAIS v0.50에서 CMO+CFO→CBO 통합으로 C-Level 수직 분할은 정돈됐으나, 각 C-Level 안의 수평 분할(sub-agent 경계·skill·template)은 absorb 흐름과 외부 reference 통합으로 점진 누적되어 설계 deliberation이 부족한 상태다.

사용자 자기 진단(ideation T2) — "vais-code의 미성숙은 이걸 만드는 내가 전체 프로덕트 개발에 대한 이해와 지식의 부족에서 오는거라고 생각해." CEO 측 재프레임: 지식 부족이 아니라 **모름을 시스템에 내재화하는 프로토콜의 부재**. VAIS는 사용자의 지식 거울이 아니라 의수여야 한다.

### 현재 상태 3가지 결함

1. **Default-execute anti-pattern**: release-engineer 외 infra-architect / test-engineer / seo-analyst / finops-analyst / compliance-auditor 6개 모두 "필요한가?" Discovery 단계 없이 파이프라인 진입.
2. **분리 기준 자의성**: CBO=도메인, CTO=기술 레이어, CSO=검사 유형, CPO=Phase+산출물 혼합, COO=시점. 플러그인 안에서 분리 렌즈 5가지.
3. **Template·Skill 공백 88%**: Core 100% / 사업·재무 100% / Why 80% / What 82% / How 86% — PRD 1개 외 사실상 전무.

### 4단계 메타-프레임 채택 배경

*제품의 탄생*(プロダクトマネジメントのすべて) 4단계(Core/Why/What/How)를 1차 메타-프레임으로 채택(D-1). Cagan/Torres/Rumelt/Team Topologies/DORA/SRE Book 등 17개 정전과 cross-reference 시 충돌 없음 확인. 8턴 ideation에서 6개 메커니즘(4단계 프레임 + 메타-원칙 + 산출물 카탈로그 + Template depth (c) + 실행 정책 4분류 + Project Profile)이 충돌 없이 누적됨.

---

## 4. Objective

### 목표 (Why)

VAIS Code의 sub-agent를 "호출하면 무조건 실행"하는 도구에서 "프로젝트 특성에 맞는 산출물만, 검증된 프레임워크 기반으로 생성"하는 전문 에이전트로 전환한다. 이로써 외부 채택 가능성과 사용자 신뢰를 높인다.

### OKR (Doerr / Grove)

```
Objective: VAIS sub-agent를 정전 기반 산출물 전문가로 재정의하여
           "쓸데없이 만든다" 통증을 시스템적으로 해소한다.

  KR1: Project Profile 게이트 작동 — Profile B 정책 skip 적중률 ≥ 95% (SC-01, SC-03)
  KR2: 산출물 카탈로그 50+ 중 25개 (c) 깊이 완성 (SC-04), 잔여 25개 점진 완성 (SC-08)
  KR3: 44 sub-agent 전체 Q-A/B/C/D 4기준 점검 매트릭스 44/44 완성 (SC-09)
  KR4: Alignment α+β 구현 + ux-researcher 외부 인터뷰 5~7명 완료 (SC-10)
```

### 성공 기준 (SC-01~10) — C 확장 범위 기준

| SC | 기준 | 통과 임계 | 우선 |
|----|------|---------|:----:|
| SC-01 | ideation 종료 시 project-profile.yaml 자동 생성 + C-Level 진입 시 자동 로드 | 3항목 모두 | MUST |
| SC-02 | 25개 template 모두 frontmatter `execution.policy` 명시 | 25/25 | MUST |
| SC-03 | 6개 sub-agent 호출 시 Profile 조건 미충족 → 자동 skip + 사유 리포트 | 6/6 시나리오 | MUST |
| SC-04 | 25개 template 모두 sample+checklist+anti-pattern (c) 깊이 | 25/25 | SHOULD |
| SC-05 | release-engineer 5분해 완료 (신규 5 + deprecate alias) | 모두 충족 | MUST |
| SC-06 | VPC → product-strategist 재매핑 완료 | 3항목 변경 | SHOULD |
| SC-07 | PRD 8섹션 designCompleteness ≥ 80 (auto-judge) | ≥ 80 | MUST |
| SC-08 | 카탈로그 50개 전체 (c) 깊이 | 50/50 | SHOULD |
| SC-09 | 44 sub-agent 전체 4기준 점검 매트릭스 | 44/44 | MUST |
| SC-10 | alignment α+β 구현 + 외부 인터뷰 5~7명 + Profile 검증 리포트 | a 2/2 + b 충족 | SHOULD |

MUST 6/6 + SHOULD 2+/4 = phase 통과.

---

## 5. Market Segment

### 1차 타깃 — P1. 솔로 빌더 (핵심)

| 항목 | 내용 |
|------|------|
| 역할 | 1인 풀스택 / Solo founder 개발자 |
| JTBD | When 새 피처 시작, I want 모르는 도메인도 검증된 산출물, So I can 혼자서 전 영역 커버 |
| 핵심 욕구 | "AI가 더 똑똑하길"이 아닌 **"내 프로젝트에 안 맞는 건 안 만들길"** |
| 정책 수혜 | B/C/D 자동 skip — 불필요한 산출물 차단이 최대 가치 |

### 2차 타깃 — P2. 스타트업 CTO

| 항목 | 내용 |
|------|------|
| 역할 | 5~20명 팀 리더, CPO/CTO 겸임 |
| JTBD | When 새 피처, I want 팀에게 일관된 검증된 산출물, So I can 팀 공통어 형성 |
| 핵심 욕구 | "더 많은 AI 기능"이 아닌 **"팀 표준화 도구"** |
| 정책 수혜 | A/B 정책 — 정전 기반 template이 team knowledge standard |

### 3차 타깃 — P3. 엔터프라이즈 PM

| 항목 | 내용 |
|------|------|
| 역할 | 컴플라이언스/문서화 요구 큰 조직의 PM |
| JTBD | When 컴플라이언스 단계, I want 정전 출처 명시된 산출물, So I can 감사 통과 |
| 핵심 욕구 | **"AI 결정의 근거 명시"** + `_tmp/` 추적성 |
| 정책 수혜 | B 정책 (DPIA/SLO/Threat Model) — 컴플라이언스 자동화 |

### TAM/SAM/SOM (Steve Blank — 확신도 낮음, 방향성 확인용)

| 레이어 | 추정치 | 근거 |
|--------|--------|------|
| TAM | $1.5~3B | AI agent orchestration 전체 시장 |
| SAM | ~35K 설치 / ~1.7~3.4K 유료 | Claude Code 플러그인 사용자 |
| SOM | 25~200팀 (1년) | 한국 SaaS/스타트업 + 개인 빌더 집중 |

**제약**: ux-researcher 외부 인터뷰(SC-10) 전까지 TAM/SAM/SOM 가설 수준. 오차 범위 ±50%.

---

## 6. Value Proposition

### UVP — "AI 의수(prosthesis)"

> "AI C-Suite가 당신의 지식 격차를 메우는 의수가 된다. 모르는 영역도 검증된 프레임워크 기반 산출물로 결정한다. 어떤 sub-agent를 호출해도 Project Profile과 실행 정책에 맞는 산출물만 생성한다. 쓸데없이 만드는 AI는 더 이상 없다."

### JTBD 6-Part (Ulwick / Christensen)

| Part | 내용 |
|------|------|
| **When** | 새 피처 시작 / 기존 서비스 영역(보안·배포·비용) 점검 시 |
| **I want to** | 모르는 영역(마케팅·재무·보안·운영)도 검증된 프레임워크 산출물을 빠르게 |
| **So I can** | 혼자서도 팀처럼 전 영역 커버 + 정전 수준 근거로 이해관계자 설득 |
| **Better than** | 범용 AI에 "SWOT 분석해줘" — 매번 포맷 다름, 히스토리 단절 |
| **Available alternatives** | 범용 AI / Notion AI / 외부 컨설턴트 / 책 정독 후 직접 작성 |
| **Constraints** | 빠른 속도(스타트업 피벗) + 비용 통제(개인/소규모) + 모든 정전 학습 불가 |

### Geoffrey Moore Positioning Statement (Crossing the Chasm)

> For solo founders & small-team PMs needing full product coverage without a full team, VAIS Code is the AI C-Suite plugin that delivers canon-grounded deliverables matched to project profile — unlike generic AI tools generating arbitrary formats with no workflow continuity, VAIS knows what to build, what to skip, and why.

### 경쟁 차별점

| vs | 핵심 차이 |
|----|---------|
| AutoGPT / CrewAI | VAIS는 SW 제품 라이프사이클에 사전 정의된 6 C-Level + 정전 기반 산출물 계약. Backstory 자연어 의존 대신 Artifact 소유로 경계 정의 |
| LangGraph | "개발자 인프라" vs "(비)개발자 제품". VAIS의 가치는 구현 스택이 아닌 C-Suite 모델 + 카탈로그 + 정책 조합 |
| Devin / Copilot Workspace | "코드 작성"만 vs 전체 라이프사이클(CPO/CSO/COO/CBO). CTO phase 품질 = Devin 동등 + 앞뒤 가치 확장 |
| 일반 Claude Code Plugin | "개발자의 손 확장" vs **"개발자의 팀 확장"** |

### Value Curve 핵심 차별 요소

1. **정전 기반 산출물 카탈로그** — Rumelt/Cagan/Torres/Osterwalder/SRE Book/DORA 1:1 매핑 (단순 template 추가로 복제 불가)
2. **Profile × 정책 48+ 교차 판단 규칙** — 실제 통증에서 역산됨
3. **C-Level 3계층 아키텍처 + PDCA + 게이트** — flat agent 구조적 차이
4. **Mirror→Prosthesis 전환 개념** — 모름을 채우면서 모름을 드러내는 구조

---

## 7. Solution

### 7.1 UX / User Flow (핵심 전환)

**현재 (As-Is)** — 마찰 포인트:
```
/vais ceo ideation → 산출물 형식 추측
→ release-engineer 호출 → CI/CD 자동 생성 ❌ (local-only 프로젝트도)
→ qa → 잘못된 산출물 정리에 시간 소비
```

**목표 (To-Be)** — 3가지 핵심 전환:
```
/vais ceo ideation → Project Profile 12변수 합의 (1회) → profile.yaml 자동 생성
→ C-Level 진입 시 Profile 자동 로드 + 정책 매핑 미리보기
→ sub-agent 호출 → depth(c) template으로 표준 포맷 산출물
→ release-engineer 호출 → Profile.deployment=local-only → ci-cd-configurator skip ✅
   Profile.deployment=cloud → 정책 B 통과 → 정전 기반 CI/CD 생성
→ qa → alignment α 자동 검증 → Core↔Why↔What↔How 일치율 리포트
```

### 7.2 Key Features

#### F1. Project Profile schema v1 (Must Have)

**설명**: ideation 종료 시 1회 합의 → `docs/{feature}/00-ideation/project-profile.yaml` 자동 저장. 모든 C-Level 진입 시 자동 로드. 정책 B 산출물의 `scope_conditions` 평가 기반.

12 변수 schema (D-D6 — 4 sub-agent 공통 확정):
```yaml
project_profile:
  type: [b2b-saas|b2c-app|marketplace|oss|internal-tool|api-only|plugin]
  stage: [idea|mvp|pmf|scale|mature]
  users.target_scale: [proto|pilot|sub-1k|1k-100k|100k+]
  users.geography: [domestic|global|regulated-region]
  business.revenue_model: [subscription|transaction|ads|freemium|enterprise|none]
  business.monetization_active: bool
  data.handles_pii: bool
  data.handles_payments: bool
  data.handles_health: bool
  data.cross_border_transfer: bool
  deployment.target: [cloud|on-prem|hybrid|edge|local-only]
  deployment.sla_required: bool
  brand.seo_dependent: bool     # (c) 변수 — D-D12 즉시 적용
  brand.public_marketing: bool  # (c) 변수 — D-D12 즉시 적용
```

**수용 기준**: (a) ideation-guard hook 코드 존재 + (b) 신규 피처 ideation 종료 후 yaml 파일 존재 + (c) `lib/project-profile.js` 모든 C-Level Context Load에 추가됨. SC-01.
**우선순위**: Must Have

#### F2. Template metadata schema (Must Have)

**설명**: 각 template frontmatter에 실행 정책·정전 출처·대안·선후관계·맥락 이유 명시. 정책 B `scope_conditions` 평가로 자동 skip 작동. D-D12 즉시 적용 3가지 포함(`canon_source`, `project_context_reason`, `review_recommended`).

```yaml
artifact: lean-canvas
owner_agent: product-strategist
phase: what
canon_source: "Maurya 'Running Lean'"         # D-D12 즉시 적용
execution:
  policy: user-select  # always|scope|user-select|triggered
  scope_conditions: [...]
  intent: business-model-design
  alternates: [business-model-canvas, value-proposition-canvas]
  trigger_events: []
  prereq: [pest-analysis]
  required_after: [prd]
  review_recommended: false                    # D-D12 즉시 적용
template_depth: filled-sample-with-checklist
project_context_reason: "What 단계 BM 결정의 1차 산출물"  # D-D12 즉시 적용
```

**수용 기준**: `scripts/template-validator.js` 신규 추가 → 25개 template 일괄 검증 → 모든 항목 pass. SC-02.
**우선순위**: Must Have

#### F3. 산출물 카탈로그 50+ 4단계 분류 + Template (c) 깊이 (Must/Should)

**설명**: *제품의 탄생* 4단계 × 정전 × 정책으로 50+ 산출물 매핑. MVP 우선 25개 (c) 깊이 작성 후 잔여 25개 점진 완성.

**정책 분포 (전체 50개)**:
- A (Always) 17개: 정체성·핵심 (PRD/ADR/Vision Statement/CHANGELOG/JTBD/Persona/VPC/NSM/Roadmap/RFC/API Spec/ER Diagram/OWASP ASVS/Test Plan/Release Notes/User Story/TAM-SAM-SOM/IA/Wireframe)
- B (Scope) 14개: Profile 자동 판단 (C4/STRIDE/Runbook/SLO/DORA Dashboard/3-Statement/CAC-LTV/Cloud Cost/Funnel/SEO Audit/DPIA/DCF/Attribution/SLI)
- C (User-select) 17개: 대안 다수 (PEST/Five Forces/SWOT/OST/Forces of Progress/Kano/AARRR/HEART/Lean Canvas/BMC/RICE/MoSCoW/PR-FAQ/3-Horizon/Customer Journey/AIDA-PAS/Magic Number)
- D (Triggered) 2개: 이벤트 기반 (Postmortem/Migration Plan)

**우선 25개 (c) 깊이 (MVP First)**:

| # | 단계 | 산출물 | 정전 | 정책 | Owner |
|---|------|--------|------|:----:|-------|
| 01 | Core | Vision Statement / BHAG | Collins *Built to Last* | A | vision-author (신설) |
| 02 | Core | Strategy Kernel | Rumelt *Good Strategy/Bad Strategy* | A | strategy-kernel-author (신설) |
| 03 | Core | OKR | Grove / Doerr *Measure What Matters* | A | okr-author (신설) |
| 04 | Core | Working Backwards PR/FAQ | Amazon Working Backwards | C | pr-faq-author (신설) |
| 05 | Core | 3-Horizon Strategy | McKinsey | C | strategy-kernel-author |
| 06 | Why | PEST(LE) 분석 | 거시환경 표준 | C | market-researcher |
| 07 | Why | Porter's Five Forces | Porter | C | market-researcher |
| 08 | Why | SWOT 분석 | Albert Humphrey | C | market-researcher |
| 09 | Why | JTBD 6-Part Statement | Ulwick / Christensen | A | product-discoverer |
| 10 | Why | Persona / Empathy Map | Cooper / Dave Gray | A | product-researcher |
| 11 | What | **Value Proposition Canvas** | Osterwalder | A | **product-strategist** (재매핑 — copy-writer에서) |
| 12 | What | Lean Canvas | Ash Maurya *Running Lean* | C | product-strategist |
| 13 | What | Business Model Canvas | Osterwalder *Business Model Generation* | C | product-strategist |
| 14 | What | North Star Metric Framework | Ellis / Amplitude | A | data-analyst |
| 15 | What | Roadmap (Now-Next-Later) | ProductPlan | A | roadmap-author (신설) |
| 16 | How | ADR (Architecture Decision Record) | Nygard | A | infra-architect |
| 17 | How | C4 Model Diagrams | Simon Brown | B | infra-architect |
| 18 | How | STRIDE Threat Model | Microsoft | B | security-auditor |
| 19 | How | Test Plan / Test Case Matrix | ISTQB | A | test-engineer |
| 20 | How | Runbook / Incident Playbook | Google SRE | B | sre-engineer (→ runbook-author) |
| 21 | 사업·재무 | 3-Statement Financial Model | 회계 표준 | B | financial-modeler |
| 22 | 사업·재무 | Cohort Retention Curves | Skok | B | unit-economics-analyst |
| 23 | 사업·재무 | Cloud Cost Breakdown | FinOps Foundation | B | finops-analyst |
| 24 | 사업·재무 | Marketing Funnel (TOFU/MOFU/BOFU) | Inbound 마케팅 | B | growth-analyst |
| 25 | 사업·재무 | SEO Audit Report | Moz / Ahrefs | B | seo-analyst |

각 template (c) 깊이 = `## (작성된 sample)` 100자+ + `## 작성 체크리스트` 5+ 항목 + `## ⚠ Anti-pattern` 3+ 항목.

**수용 기준**: SC-04 (25/25 모두 3섹션 충족). SC-08 (50/50 — SHOULD).
**우선순위**: MVP 25개 = Must Have / 잔여 25개 = Should Have

#### F4. 44 sub-agent anti-pattern 점검 매트릭스 (Must Have)

**설명**: 44개 sub-agent를 4기준(Q-A/Q-B/Q-C/Q-D)으로 전체 점검. 결과 매트릭스 `04-qa/subagent-audit-matrix.md`에 문서화.

점검 기준:
- **Q-A (산출물 명확성)**: 이 sub-agent가 만드는 산출물이 정전 카탈로그에 있는가?
- **Q-B (Default-execute 여부)**: 호출 즉시 작업 시작? Profile/scope 게이트 부재?
- **Q-C (묶음 적정성)**: 한 sub-agent가 너무 많은 산출물? (분해 후보)
- **Q-D (매핑 정합성)**: owner_agent가 실제 도메인과 맞는가?

**즉시 조치 확정 항목**:

| sub-agent | Q-B 조치 | Q-C 조치 | Q-D 조치 |
|-----------|---------|---------|---------|
| release-engineer | 5분해 (→ F5) | 분해 완료 | — |
| infra-architect | init=triggered / DB=B 정책 | 분리 검토 | — |
| test-engineer | unit=A / integration=B / e2e=B | — | — |
| seo-analyst | `brand.seo_dependent=true`만 | — | — |
| finops-analyst | `deployment.target IN [cloud,hybrid]` AND `monetization_active=true`만 | — | — |
| compliance-auditor | GDPR=`handles_pii=true` 조건 | DPIA 분리 | — |
| **copy-writer** | — | — | VPC 책임 제거 (→ product-strategist) |

**수용 기준**: SC-09 (44/44 점검 완료, 매트릭스 44행 모두 채워짐).
**우선순위**: Must Have

#### F5. Release-engineer 5분해 (Must Have)

**설명**: ideation 통증 직접 원인(KP-6) 해소. release-engineer를 5개 산출물 단위 sub-agent로 분해. 기존 release-engineer는 deprecate alias로 1 phase 유지.

| 신규 sub-agent | 산출물 | 정책 | 호출 조건 |
|---------------|--------|:----:|---------|
| release-notes-writer | Release Notes / CHANGELOG | A | 모든 배포 필수 |
| ci-cd-configurator | GitHub Actions / GitLab CI YAML | B | `deployment.target IN [cloud,hybrid]` AND `target_scale ≥ pilot` |
| container-config-author | Dockerfile / docker-compose.yml | B | `deployment.containerized=true` |
| migration-planner | Schema migration plan | D | DB schema 변경 이벤트 |
| runbook-author | Runbook (배포 절차) | B | `sla_required=true` OR `target_scale ≥ 1k-100k` |

**수용 기준**: (a) `agents/coo/{name}.md` 5개 존재 + description 80자 이상 + (b) 산출물 template (c) 깊이 + (c) release-engineer.md deprecate notice 포함. SC-05.
**우선순위**: Must Have

#### F6. 신규 sub-agent 7개 (CEO 4 + CPO/What 1 = 5, COO 5분해 별도 F5) (Must Have)

CEO sub-agent 4개 신설 (Core 단계 빈약 해소 — D-D8):

| Agent | 산출물 | 정전 출처 |
|-------|--------|---------|
| vision-author | Vision Statement / BHAG | Collins *Built to Last* |
| strategy-kernel-author | Strategy Kernel (Diagnosis–Policy–Actions) | Rumelt *Good Strategy/Bad Strategy* |
| okr-author | OKR (Objective + Key Results) | Grove / Doerr *Measure What Matters* |
| pr-faq-author | Working Backwards PR/FAQ | Amazon Working Backwards |

CPO/What sub-agent 1개 신설 (D-D9):

| Agent | 산출물 | 정전 출처 |
|-------|--------|---------|
| roadmap-author | Now-Next-Later Roadmap | ProductPlan |

**수용 기준**: 각 `agents/{c-level}/{name}.md` 존재 + frontmatter 완성 + 산출물 template (c) 깊이.
**우선순위**: Must Have

#### F7. Alignment 메커니즘 α + β (Should Have)

**설명**: *제품의 탄생* 6.4/7.5/8.4 "맞춤-개선" 활동을 시스템화. Core↔Why↔What↔How 정합성을 자동 검증.

- **α (auto-judge 확장)**: C-Level 전환 시 이전 단계 산출물 파싱 → 키워드/엔티티 일치율 측정. 70% 감지율 목표 (EXP-4).
- **β (alignment 산출물 신설)**: 단계 사이에 `alignment-{from}-{to}.md` 산출물 3개 (core-why / why-what / what-how). template 각 (c) 깊이.

**수용 기준**: SC-10(a) — `lib/auto-judge.js` alignment 메트릭 추가 + alignment 산출물 template 3개. EXP-4 70% 감지율.
**우선순위**: Should Have

#### F8. VPC → product-strategist 재매핑 (Should Have)

**설명**: Value Proposition Canvas가 copy-writer에 잘못 배치됨(KP-9). Osterwalder 정전상 VPC는 전략 기획 산출물 → product-strategist. (D-D7)

**수용 기준**: SC-06 — VPC template `owner_agent: product-strategist` + copy-writer md VPC 책임 제거 + product-strategist md VPC 추가.
**우선순위**: Should Have

### 7.3 Technology

**핵심 구현 요소**:

1. **`lib/project-profile.js`** (신규): Profile schema 로드 / 유효성 검증 / `scope_conditions` CEL-like 표현 평가 / C-Level Context Load 자동 주입.
2. **`hooks/ideation-guard.js`** (수정): ideation 종료 감지 → Profile 합의 prompt → `project-profile.yaml` 자동 저장.
3. **`scripts/template-validator.js`** (신규): frontmatter schema 검증 + 정책 매핑 일치율 자동 점검.
4. **`lib/auto-judge.js`** (수정): alignment α 메트릭 추가 (키워드 일치율 측정 — EXP-4).
5. **`agents/coo/release-engineer.md`** (수정): deprecate notice 추가.
6. **신규 agent md 파일 7~8개**: `agents/ceo/` 4개 + `agents/cpo/roadmap-author.md` + `agents/coo/` 5개.
7. **신규 template 파일 25개 (우선)**: `templates/{core|why|what|how|biz}/` 하위.

**기술 제약**:
- `frontmatter includes[]`가 Claude Code sub-agent context에 런타임 미통합 (MEMORY.md 확인). → v0.57 Option A(블록 복붙 + patch 스크립트) 패턴 유지.
- `scope_conditions` 평가는 CEL-like 단순 dict 비교로 시작 (전체 CEL 파서 불필요 — YAGNI).
- `lib/auto-judge.js` alignment α는 키워드 기반 — 의미론적 정확도 한계 명시 (RA-2).

### 7.4 Assumptions (검증 필요 가정)

| 가정 | 리스크 | 검증 방법 |
|------|:------:|---------|
| Profile 게이트가 실제 "쓸데없이 만든다" 통증 해소 | **상** | EXP-1 (30분) + EXP-5 외부 인터뷰 (SC-10) |
| Profile 합의 UX가 직관적 (12 변수 인지부하 적정) | **상** | think-aloud 3명 + T1 시나리오 |
| 50+ template 작업량이 14~22주 내 가능 | **상** | 5개 파일럿 sprint 측정 |
| "Always" 9개 정책 산출물이 모든 프로젝트에 유효 | 중 | ux-researcher H-2 카드 정렬 (SC-10 — D-D13) |
| sub-agent 48개로 증가 시 사용자 피로 미발생 | 중 | SUS 측정 (인터뷰 T2) |
| alignment α 키워드 일치율 70%+ 감지 | 중 | EXP-4 (4~8시간) |
| P1 솔로 빌더를 위한 경량화 정전 가이드 필요성 | 하 | 인터뷰 H-7 + P1 persona 관찰 (D-D11 — 검토 보류) |

---

## 8. Release

### 3-Horizon Roadmap (McKinsey 3-Horizon)

**H1 (Now — 현재~약 5개월)**: VAIS v1.0 Stable

- Sprint 1~3: Project Profile schema v1 + ideation-guard hook + lib/project-profile.js + `project-profile.yaml` 자동 생성 검증
- Sprint 4~6: Template metadata schema + template-validator.js + 우선 25개 template (c) 깊이 1차 (Core 5 + Why 5 완성)
- Sprint 7~10: 44 sub-agent anti-pattern 점검 매트릭스 + release-engineer 5분해 + CEO 신설 4 sub-agent + roadmap-author
- Sprint 11~14: 잔여 25개 template (c) 깊이 + alignment α+β + ux-researcher 외부 인터뷰 5~7명

**H1 Sprint 산출물 명시**:

| Sprint | 목표 | 주요 산출물 | 완료 기준 |
|:------:|------|---------|---------|
| 1~3 | Profile 게이트 작동 | project-profile.yaml, lib/project-profile.js, ideation-guard.js 수정 | SC-01 + EXP-1 |
| 4~6 | Template 우선 25개 (Core+Why) | templates/core/*.md × 5, templates/why/*.md × 5, template-validator.js | SC-02 + SC-04 (10/25) |
| 7~10 | Sub-agent 재정의 + 신설 | agents/coo/release-*.md × 5, agents/ceo/*.md × 4, cpo/roadmap-author.md, subagent-audit-matrix.md | SC-05, SC-06, SC-09 |
| 11~14 | 잔여 25개 + Alignment + 인터뷰 | templates/{what,how,biz}/*.md × 15, lib/auto-judge.js 수정, alignment-*.md × 3, user-interviews.md | SC-08 partial, SC-10 |

**H2 (1~2년 — H1 완료 후)**: VAIS v2.0 — 모름의 시스템 처리 레이어
- Epistemic Contract (선반 보관 D-11) — C-Level이 자기 지식 한계 명시 (`confidence:` 필드)
- Uncertainty Reporting — 산출물에 `confidence: 0~100` 필드
- Absorb 대화 강제 — 외부 reference 흡수 시 사용자 1:1 강제
- Alignment 검증 α+β 운영화 + Community Template Registry 초안

**H3 (3년+ — 장기)**: VAIS Ecosystem
- Community Template Registry (peer-review + canon_source 검증)
- Project Profile Marketplace (업종별 preset)
- VAIS Federation (cross-project 산출물 검색)
- Enterprise VAIS (사내 template 레지스트리 + 사내 Profile preset)

### Go/No-Go 기준 (MUST SC 기준)

| Gate | 조건 |
|------|------|
| **Alpha → Beta** | SC-01 + SC-03 + SC-05 통과 (Profile 게이트 + 6개 skip 검증 + 5분해 완료) |
| **Beta → GA** | SC-01~07 MUST 6/6 통과 + SHOULD 2+/4 통과 |
| **GA → H2** | SC-08~10 SHOULD 추가 충족 + 외부 인터뷰 완료 |

---

## Decision Record (통합)

### Plan 단계 (D-1~D-8)

| # | Decision | Owner | 정전/근거 |
|---|----------|:-----:|---------|
| D-1 | *제품의 탄생* 4단계(Core/Why/What/How) 1차 메타-프레임 채택 | cpo | 17 정전 cross-reference 충돌 없음 |
| D-2 | "산출물이 sub-agent 정의·경계·계약을 결정한다" 메타-원칙 채택 | cpo | 휴리스틱 없는 귀납적 도출 |
| D-3 | 시나리오 역산(접근 C) 거부 | cpo | 사용자 지식 종속 → 근본 문제 우회 못함 |
| D-4 | 문헌 기반 뼈대(Literature-grounded foundation) 채택 | cpo | 표면 사례 아닌 검증된 정전에서 분류 척도 추출 |
| D-5 | Template 작성 깊이 (c) = sample+checklist+anti-pattern | cpo | ideation D-5. MVP 25개 한정 |
| D-6 | 산출물 실행 정책 4분류(Always/Scope/User-select/Triggered) | cpo | release-engineer 일반화 해법 |
| D-7 | Project Profile 신규 산출물(메타데이터) + ideation 종료 시 합의 hook | cpo | 정책 B(Scope) 판단 근거 |
| D-8 | **C. 확장 범위 채택** — 50+ 전체 + 44 전체 점검 + alignment + 외부 인터뷰 | cpo | 사용자 CP-1 명시 결정 |

### Design 단계 (D-D1~D-D13)

| # | Decision | Owner | 확정 |
|---|----------|:-----:|:----:|
| D-D1 | 4단계 프레임 + 메타-원칙 일관 적용 | cpo | 확정 |
| D-D2 | Profile + 정책 4분류 게이트 | cpo | 확정 |
| D-D3 | Template depth (c) | cpo | 확정 |
| D-D4 | release-engineer 5분해 + 의심 5 sub-agent 정책 | cpo | 확정 |
| D-D5 | Alignment α(auto-judge) + β(alignment 산출물) 조합 | cpo | 확정 |
| D-D6 | Profile schema v1 (12 변수) + ideation 종료 hook | cpo | 확정 |
| D-D7 | VPC → product-strategist 재매핑 (잘못된 매핑 정정) | cpo | 확정 |
| D-D8 | CEO sub-agent 4개 신설 (vision/strategy-kernel/okr/pr-faq) | cpo | 확정 |
| D-D9 | roadmap-author 1개 신설 (What 단계) | cpo | 확정 |
| D-D10 | OPP-6(중복 배치)는 OPP-8 해소 시 자동 흡수 | cpo | 확정 |
| D-D11 | P1 경량화 정전 가이드 — do phase 결정 보류 | cpo | 검토 필요 |
| D-D12 | 즉시 적용 3가지: Profile 한 줄 예시 / 맥락 컬럼 / `review_recommended` | cpo | 즉시 적용 |
| D-D13 | "Always" 9개 적정성 인터뷰 H-2 카드 정렬로 검증 | cpo | qa 검증 |

---

## Risks (R1~R7 + Top 3 RA)

| ID | Risk | 가능성 | 영향 | 완화 전략 |
|----|------|:------:|:----:|---------|
| R1 | 50+ template 작업량 폭증 | 상 | 상 | MVP 25개 한정 → 자연 누적. sprint 분할. 5개 파일럿 측정 |
| R2 | *제품의 탄생* 단일 정박 → 편향 | 중 | 중 | 6 C-Level별 정전 cross-reference 병행 (D-7). 4단계는 1차 메타-프레임이지 유일 척도 아님 |
| R3 | Profile schema 과세분화/과소세분화 | 중 | 상 | 12 변수 MVP. 인터뷰 후 schema 진화. `sla_required` 등 bool 추가 가능 |
| R4 | 기존 44개 재구성이 기존 사용자에게 파괴적 | 중 | 상 | deprecate alias 1 phase 유지 + CHANGELOG BREAKING 명시 + absorb-analyzer 의존 분석 |
| R5 | 정책 게이트 UX가 매번 묻기로 회귀 → 옵션 피로 | 중 | 중 | (ii)+(iii) 조합 명문화. Profile 1회 합의 후 자동 게이트. 추천+승인은 명시 요청 시만 |
| R6 | sub-agent 재정의 중 기존 워크플로우 작동 중단 | 하 | 상 | branch 분리 + canary feature flag로 새 sub-agent 점진 적용 |
| R7 | "Always" 정책이 일부 프로젝트에 부적합 | 하 | 중 | H-2 카드 정렬로 검증 (D-D13). 부적합 사례 발견 시 정책 재분류 |

**Top 3 즉시 검증 가정 (RA)**:
1. **RA-1 (User Value 상)**: Profile 게이트가 실제 통증 해소 → EXP-1 + EXP-5
2. **RA-2 (Usability 상)**: Profile 합의 UX 직관성 (12 변수 인지부하) → think-aloud 3명 + T1
3. **RA-3 (Feasibility 상)**: 50+ template 14~22주 실현가능성 → 5개 파일럿 sprint 측정

---

## Out of Scope

여전히 OUT (C 확장 범위 채택 후에도 제외 유지):

| OUT 항목 | 이유 | 후속 처리 |
|---------|------|----------|
| **Epistemic Contract** (`i_know` / `i_ask` 프로토콜) | 구조 정돈 후 얹는 레이어 — 별도 설계 필요 | H2 선반 보관 → 별도 피처 |
| **Uncertainty Reporting** (`confidence: 0~100` 필드) | 위와 동일 | H2 선반 보관 |
| **Absorb 대화 강제** | absorb-analyzer 대대적 변경 필요 | 후속 피처 `absorb-conversational` |
| **시스템 게이트 매번 묻기 UX** (옵션 i) | 옵션 피로 — D-8 영구 거부 | 영구 거부 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — prd-writer, ideation/plan/design 전체 합성, 8섹션 + Decision Record + Risks + Out of Scope |
