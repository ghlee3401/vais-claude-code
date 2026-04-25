---
owner: cpo
phase: do
feature: subagent-architecture-rethink
---

# subagent-architecture-rethink — PRD

> **CPO Do phase 산출물** — prd-writer 위임 + CPO 큐레이션. 8섹션 designCompleteness ≥ 80 목표.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | VAIS 44 sub-agent — 분리 기준 자의적 + default-execute anti-pattern + template 88% 부재 |
| **Solution** | 4단계 메타-프레임 + 산출물 중심 메타-원칙 + Profile 12변수 + 정책 4분류 + 카탈로그 50+ (c) |
| **Effect** | mirror→prosthesis 전환. 사용자가 모르는 영역도 검증된 프레임워크 산출물 + 불필요한 산출물 자동 차단 |
| **Core Value** | "쓸데없이 만든다" 통증 시스템적 해소. 외부 채택 + 사용자 신뢰 향상 |

---

## 1. Summary

VAIS Code의 44개 sub-agent는 C-Level마다 분리 기준이 다르고, 호출 즉시 산출물을 생성하는 default-execute anti-pattern이 내재되어 있으며, 50+ 산출물의 88%에 표준 template이 없다. 이로 인해 사용자는 "쓸데없이 CI/CD를 만드는" 마찰을 경험하며, 검증된 산출물 대신 AI가 매 호출마다 포맷을 발명한다.

본 PRD는 이 세 가지 구조적 문제를 *제품의 탄생* 4단계 메타-프레임(Core/Why/What/How) + "산출물이 sub-agent를 정의한다" 메타-원칙 + Project Profile(12 변수) + 실행 정책 4분류(A/B/C/D) + 50+ 산출물 카탈로그 (c) 깊이 표준화로 일괄 해소한다. 본 피처가 완료되면 VAIS는 사용자의 지식 거울(mirror)에서 모르는 영역을 채우는 의수(prosthesis)로 전환된다. Alignment α + β 메커니즘이 단계 간 정합성을 검증하고, ux-researcher 외부 인터뷰(5~7명)로 schema와 정책의 실제 유효성을 검증한다.

---

## 2. Contacts

| 이름 / 역할 | 담당 영역 | 연락처 |
|------------|---------|--------|
| **이근호** — Product Owner | 전체 방향 결정, 정책 우선순위, 최종 승인 | ghlee0304@ncsoft.com |
| CEO (AI) | 동적 라우팅, C-Suite 조율, 최종 리뷰 | `/vais ceo` |
| CPO (AI) — 본 PRD owner | PRD 합성, 백로그 관리, sub-agent 위임 | `/vais cpo` |
| CTO (AI) | Profile schema 구현, template 작성, sub-agent md 신설 | `/vais cto` |
| CSO (AI) | skill-validator 적용 (44 점검), compliance 검증 | `/vais cso` |
| CBO (AI) | GTM, 외부 인터뷰 모집 지원, VPC 재매핑 산출물 | `/vais cbo` |
| COO (AI) | release-engineer 5분해, CI/CD configurator 신설 | `/vais coo` |

상세 sub-agent 위임 매트릭스: `solution-features.md` 참조.

---

## 3. Background

VAIS v0.50 통합 이후 C-Level 수직 분할은 정돈됐으나, 각 C-Level 안의 수평 분할(sub-agent 경계·skill·template)은 absorb 흐름·외부 reference 통합으로 점진 누적된 결과 설계 deliberation 부족.

**사용자 자기 진단(ideation T2)**: "vais-code의 미성숙은 결국 이걸 만드는 내가 전체 프로덕트 개발에 대한 이해와 지식의 부족에서 오는거라고 생각해."

**CEO 재프레임**: 지식 부족이 아니라 **모름을 시스템에 내재화하는 프로토콜의 부재**. VAIS는 사용자의 지식 거울이 아니라 **의수(prosthesis)** 여야 한다.

**현재 상태 3가지 결함**:
1. **Default-execute anti-pattern** — release-engineer 외 5개(infra-architect/test-engineer/seo-analyst/finops-analyst/compliance-auditor) 모두 "필요한가?" Discovery 단계 부재
2. **분리 기준 자의성** — 5 C-Level이 5가지 분리 렌즈 (도메인/기술레이어/검사유형/Phase+산출물/시점)
3. **Template·Skill 공백 88%** — PRD 1개 외 사실상 전무

**4단계 메타-프레임 채택**: *제품의 탄생*(プロダクトマネジメントのすべて) — 17 정전 cross-reference 충돌 없음 검증.

---

## 4. Objective

### OKR

> **Objective**: VAIS sub-agent를 정전 기반 산출물 전문가로 재정의하여 "쓸데없이 만든다" 통증을 시스템적으로 해소한다.
>
> - **KR1**: Project Profile 게이트 작동 — Profile B 정책 skip 적중률 ≥ 95% (SC-01, SC-03)
> - **KR2**: 산출물 카탈로그 50+ 중 25개 (c) 깊이 완성 (SC-04), 잔여 25개 점진 (SC-08)
> - **KR3**: 44 sub-agent 전체 Q-A/B/C/D 4기준 점검 매트릭스 44/44 (SC-09)
> - **KR4**: Alignment α+β 구현 + ux-researcher 외부 인터뷰 5~7명 (SC-10)

### Success Criteria (확장 범위 C 통과 기준)

| SC | 기준 (요약) | 우선 |
|:--:|-----------|:----:|
| SC-01 | Profile yaml 자동 생성 + Context Load 자동 주입 | MUST |
| SC-02 | 25개 template `execution.policy` 명시 | MUST |
| SC-03 | 6 sub-agent 호출 시 Profile 미충족 → 자동 skip | MUST |
| SC-04 | 25개 (c) 깊이 (sample+checklist+anti-pattern) | SHOULD |
| SC-05 | release-engineer 5분해 완료 | MUST |
| SC-06 | VPC → product-strategist 재매핑 | SHOULD |
| SC-07 | PRD designCompleteness ≥ 80 | MUST |
| SC-08 | 카탈로그 50+ 전체 (c) | SHOULD |
| SC-09 | 44 전체 4기준 점검 매트릭스 | MUST |
| SC-10 | alignment α+β + 외부 인터뷰 5~7명 | SHOULD |

→ **MUST 6/6 + SHOULD 2+/4 = phase 통과**.

---

## 5. Market Segment

### 1차 타깃 — P1. 솔로 빌더 (핵심 수혜자)

1인 풀스택 / Solo founder. JTBD: When 새 피처 시작 → I want 모르는 도메인도 검증된 산출물 → So I can 혼자서 전 영역 커버. 핵심 욕구: **"AI가 더 똑똑하길"이 아닌 "내 프로젝트에 안 맞는 건 안 만들길"**. B/C/D 정책 자동 skip 최대 수혜.

### 2차 — P2. 스타트업 CTO

5~20명 팀 리더. JTBD: 팀에게 일관된 검증된 산출물 → 팀 공통어 형성. 핵심 욕구: **"팀 표준화 도구"**. A/B 정책 — 정전 기반 template = team knowledge standard.

### 3차 — P3. 엔터프라이즈 PM

컴플라이언스/문서화 요구. JTBD: 정전 출처 명시된 산출물 → 감사 통과. 핵심 욕구: **"AI 결정 근거 명시"** + `_tmp/` 추적성. B 정책 (DPIA/SLO/Threat Model) 컴플라이언스 자동화.

### TAM / SAM / SOM (Steve Blank — 확신도 낮음)

| 레이어 | 추정 |
|--------|------|
| TAM | $1.5~3B (AI agent orchestration 전체) |
| SAM | ~35K 설치 / 1.7~3.4K 유료 (Claude Code 플러그인 사용자) |
| SOM | 25~200팀 (1년, 한국 SaaS/스타트업 + 개인 빌더) |

오차 ±50%. 인터뷰 전 가설. 상세 분석 → `02-design/market-personas.md`.

---

## 6. Value Proposition

### UVP — "AI 의수(prosthesis)"

> "AI C-Suite가 당신의 지식 격차를 메우는 의수가 된다. 모르는 영역도 검증된 프레임워크 기반 산출물로 결정한다. 어떤 sub-agent를 호출해도 Project Profile과 실행 정책에 맞는 산출물만 생성한다. **쓸데없이 만드는 AI는 더 이상 없다.**"

### JTBD 6-Part (Ulwick / Christensen)

| Part | 내용 |
|------|------|
| When | 새 피처 시작 / 기존 서비스 영역(보안·배포·비용) 점검 시 |
| I want to | 모르는 영역도 검증된 프레임워크 산출물을 빠르게 |
| So I can | 혼자서도 팀처럼 전 영역 커버 + 정전 수준 근거로 이해관계자 설득 |
| Better than | 범용 AI에 "SWOT 분석해줘" — 매번 포맷 다름, 히스토리 단절 |
| Available alternatives | 범용 AI / Notion AI / 외부 컨설턴트 / 책 정독 후 직접 작성 |
| Constraints | 빠른 속도 + 비용 통제 + 모든 정전 학습 불가 |

### Geoffrey Moore Positioning

> *For solo founders & small-team PMs needing full product coverage without a full team, VAIS Code is the AI C-Suite plugin that delivers canon-grounded deliverables matched to project profile — unlike generic AI tools generating arbitrary formats with no workflow continuity, **VAIS knows what to build, what to skip, and why**.*

### 경쟁 차별점 (요약)

| vs | 핵심 차이 |
|----|---------|
| AutoGPT/CrewAI | SW 라이프사이클 6 C-Level + 정전 산출물 계약 (Backstory 자연어 의존 X) |
| LangGraph | 개발자 인프라가 아닌 (비)개발자 제품 |
| Devin/Copilot Workspace | 코드만이 아닌 전체 라이프사이클 (CPO/CSO/COO/CBO) |
| 일반 Claude Code Plugin | "개발자의 손" 확장이 아닌 **"개발자의 팀" 확장** |

---

## 7. Solution

8개 핵심 기능 + 신규 sub-agent 7개. 우선순위 표 + 상세는 `solution-features.md` 참조.

| # | Feature | 우선순위 | SC |
|:-:|---------|:--------:|:--:|
| F1 | Project Profile schema v1 + ideation 종료 hook | **Must** | SC-01 |
| F2 | Template metadata schema (canon_source / review_recommended / project_context_reason 포함) | **Must** | SC-02 |
| F3 | 산출물 카탈로그 50+ (4단계 분류) + (c) 깊이 우선 25 / 점진 50 | Must (25) / Should (50) | SC-04, SC-08 |
| F4 | 44 sub-agent anti-pattern 점검 매트릭스 (Q-A/B/C/D) | **Must** | SC-09 |
| F5 | release-engineer 5분해 (notes/cicd/container/migration/runbook) | **Must** | SC-05 |
| F6 | 신규 sub-agent 5개 (CEO 4 + CPO/What roadmap-author 1) | **Must** | (D-D8/D-D9) |
| F7 | Alignment α (auto-judge 키워드 일치율) + β (alignment 산출물 3개) | Should | SC-10 |
| F8 | VPC → product-strategist 재매핑 | Should | SC-06 |

**기술 구현 핵심 요소**:
- `lib/project-profile.js` (신규) — Profile 로드/검증/scope_conditions 평가/Context Load 자동 주입
- `hooks/ideation-guard.js` (수정) — ideation 종료 시 Profile 합의 prompt + yaml 저장
- `scripts/template-validator.js` (신규) — frontmatter schema + 정책 매핑 검증
- `lib/auto-judge.js` (수정) — alignment α 메트릭 추가
- 신규 agent md 7개 + template 25개 (우선)

**기술 제약**: includes[] 런타임 미통합 → Option A(블록 복붙 + patch) 패턴 유지. scope_conditions는 단순 dict 비교로 시작 (CEL 파서 불필요 — YAGNI).

**Data Model / API**: 산출물 카탈로그는 `templates/{section}/*.md` frontmatter scan + `catalog.json` 인덱스 자동 생성 (CTO infra-architect 결정). **API Endpoints: N/A** (Claude Code 플러그인 — 외부 HTTP API 없음. 모든 통신은 Claude Code 내부 tool/agent 위임).

상세 — `solution-features.md`.

---

## 8. Release

### 3-Horizon Roadmap (McKinsey)

**H1 (Now ~ 약 5개월) — VAIS v1.0 Stable**
- Sprint 1~3: Profile 게이트 작동 (F1)
- Sprint 4~6: Template 우선 25개 1차 (Core 5 + Why 5)
- Sprint 7~10: 44 점검 + release-engineer 5분해 + CEO 신설 4 + roadmap-author (F4/F5/F6)
- Sprint 11~14: 잔여 25개 + Alignment α+β + 외부 인터뷰 5~7명 (F3/F7/F8/SC-10)

**H2 (1~2년)** — Epistemic Contract / Uncertainty Reporting / Absorb 대화 강제 (선반 보관 D-11 도입)
**H3 (3년+)** — Community Template Registry / Project Profile Marketplace / VAIS Federation / Enterprise VAIS

### Go/No-Go Gates

| Gate | 조건 |
|------|------|
| Alpha→Beta | SC-01 + SC-03 + SC-05 통과 (Profile 게이트 + 6개 skip 검증 + 5분해 완료) |
| Beta→GA | SC-01~07 MUST 6/6 + SHOULD 2+/4 |
| GA→H2 | SC-08~10 SHOULD 추가 + 외부 인터뷰 완료 |

상세 sprint 산출물 + Gate 기준 → `release-roadmap.md`.

---

## Decision Record (요약 — D-1~D-D13)

| Phase | 결정 (요약) | Topic |
|:-----:|-----------|-------|
| Plan D-1~D-8 | 4단계 프레임 / 메타-원칙 / Template (c) / 정책 4분류 / Profile / **C 확장 범위 채택** | `01-plan/main.md` |
| Design D-D1~D-D13 | 4 sub-agent 통합 13 결정 (4단계 적용 / Profile 게이트 / Template (c) / 5분해 / α+β / Profile schema v1 / VPC 재매핑 / CEO 4신설 / roadmap-author 신설 / OPP-6 자동흡수 / P1 경량화 검토 / 즉시 적용 3가지 / Always 9개 검증) | `02-design/main.md` |

상세 통합 표 → `decision-and-risks.md`.

---

## Risks & Out of Scope (요약)

**Top 3 RA**: Profile 게이트 통증 해소(상) / Profile UX 직관성(상) / 50+ 14~22주 실현가능성(상).

**OUT** (선반 보관): Epistemic Contract / Uncertainty Reporting / Absorb 대화 강제. **영구 거부**: 시스템 게이트 매번 묻기 UX (옵션 i).

상세 R1~R7 + 8 카테고리 RA → `decision-and-risks.md`.

---

## [CTO] Sprint 1~3 구현 결과

backend-engineer 위임으로 **F1(Profile) + F2(Template metadata) + 테스트 인프라** 구현 완료.

### 신규/수정 파일 (9개, ~2526 LOC)

| Path | LOC | 역할 |
|------|:---:|------|
| `lib/project-profile.js` (신규) | 590 | 8 함수 모듈 (loadProfile/validate/evaluate/buildContext + 보안 G-1) |
| `scripts/template-validator.js` (신규) | 409 | CLI + `--depth-check` (exit 0/1/2) |
| `scripts/build-catalog.js` (신규) | 349 | gray-matter scan → catalog.json |
| `hooks/ideation-guard.js` (신규) | 366 | PostToolUse Write 훅 + extractProfileDraft |
| `tests/integration/profile-gate.test.js` (신규) | 398 | T-01~T-07 |
| `tests/integration/template-validator.test.js` (신규) | 414 | TV-01~TV-08 |
| `package.json` (수정) | — | `dependencies`: js-yaml 4.1 + gray-matter 4.0 |
| `vais.config.json` (수정) | — | `orchestration.profileGateEnabled: false` (feature flag, 기본 OFF) |
| `hooks/hooks.json` (수정) | — | ideation-guard PostToolUse 훅 등록 |

### 안전 배포 보장

- **feature flag OFF (기본)**: `profileGateEnabled: false` → 기존 워크플로우 전혀 영향 없음 (R6 완화)
- **graceful degradation**: js-yaml 미설치 시 크래시 없이 기능 제한만 (npm install 필수 안내)
- **Sprint 1~3 작업 보고서**: `_tmp/backend-engineer.md` (230 lines) — 가정/제약/이슈 명시

### Decision Record (CTO Do 추가)

| # | Decision | Owner | Source |
|:-:|----------|:-----:|--------|
| **D-IM-01** | npm install 필요 — js-yaml + gray-matter 2개 신규 prod dependency | cto | `package.json` |
| **D-IM-02** | 모든 테스트는 npm install 후 `node --test tests/integration/*.test.js` | cto | `_tmp/backend-engineer.md` |
| **D-IM-03** | feature flag OFF 기본 — 점진 활성화 (사용자가 vais.config.json 수동 변경) | cto | `vais.config.json` |
| **D-IM-04** | Sprint 1~3 완료. EXP-1 즉시 실행 가능 (npm install 후) — RA-1/RA-3 검증 시작 | cto | `cto-implementation-progress.md` |

상세 — `cto-implementation-progress.md`.

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| Solution Features | `solution-features.md` | cpo | F1~F8 상세 + 우선순위 25 카탈로그 + 신규 sub-agent 정의 |
| Release Roadmap | `release-roadmap.md` | cpo | Sprint 1~14 분할 + Go/No-Go Gates + H2/H3 |
| Decisions & Risks | `decision-and-risks.md` | cpo | D-1~D-D13 통합 + R1~R7 + Top 3 RA + OOS |
| **CTO 구현 진행** | `cto-implementation-progress.md` | cto | Sprint 1~3 작업 보고 + LOC + 테스트 결과 + Sprint 4+ 권장 |
| **Sprint 4 진행** | `sprint-4-progress.md` | cto | Day 1 Vision Statement 완료 + RA-3 1차 측정 + Day 2 handoff |
| **Sprint 5 진행** | `sprint-5-progress.md` | cto | Why 5 templates (PEST/Five Forces/SWOT/JTBD/Persona) — RA-3 보정 ~75초/template + Sprint 6 handoff |
| **Sprint 6 진행** | `sprint-6-progress.md` | cto | F8 VPC 재매핑 — Osterwalder VPC template + copy-writer/product-strategist 책임 이관 + SC-06 충족 |
| **Sprint 7 진행** | `sprint-7-progress.md` | cto | CEO 4 + CPO 1 + COO 5 신설 + release-engineer deprecate + vais.config 업데이트 (G-4) — SC-05 충족 + owner_agent 실존화 + 6/6 MUST |
| **Sprint 8 진행** | `sprint-8-progress.md` | cto | 48 sub-agent audit 자동화 스크립트 + 4 hotfix + audit 매트릭스 + Sprint 9 마이그레이션 로드맵 (SC-09 7/48) |
| **Sprint 9 진행** | `sprint-9-progress.md` | cto | 34 sub-agent Q-A/Q-B 일괄 마이그레이션 (CPO 6 + CTO 8 + CSO 7 + CBO 8 + COO 3 + CEO 2) — Q-A/Q-B 14/48 → 48/48 (100%) + 정전 출처 ~30종 누적 |
| **Sprint 10+11 진행** | `sprint-10-11-progress.md` | cto | audit Q-D 3-state + utility 면제 (Sprint 10) + What 7 templates 작성 (Sprint 11) — SC-09 충족 (전 4기준 48/48 100%) + SC-04 18/25 (72%) |
| **Sprint 12 진행** | `sprint-12-progress.md` | cto | How 11 templates 작성 (architecture/api/db-schema/migration/runbook/dockerfile/ci-cd/monitoring/security-audit/code-review/unit-test) — **SC-04 18→29/25 (임계 초과 달성)** + 정전 ~38종 누적 |
| **Sprint 13+14 진행** | `sprint-13-14-progress.md` | cto | Biz 5 (financial-model/pricing/gtm/unit-economics/attribution) + Alignment 3 (core-why/why-what/what-how) + interview-guide — **GA [14/14] 도달**, catalog 38, SC-04 152%, SC-08 76%, SC-10 β 충족 |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| prd-writer | `_tmp/prd-writer.md` | 527 lines | 2026-04-25 (영구 보존) |
| **backend-engineer** | `_tmp/backend-engineer.md` | 230 lines | 2026-04-25 (CTO Sprint 1~3 위임) |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CPO Do phase, prd-writer 위임 + 큐레이션, PRD 8섹션 (designCompleteness ≥ 80 목표) |
| v1.1 | 2026-04-25 | CPO 재진입(qa CP-Q): G-3 API N/A 명시 한 줄 + Data Model 한 줄 추가 (섹션 7 Solution) |
| v1.2 | 2026-04-25 | CTO Do 진입: `## [CTO] Sprint 1~3 구현 결과` H2 섹션 append + D-IM-01~D-IM-04 + 9 신규/수정 파일 (~2526 LOC) + cto-implementation-progress.md topic + backend-engineer _tmp 추가 |
| v1.3 | 2026-04-25 | Sprint 4 Day 1: `templates/core/vision-statement.md` 신규 + `sprint-4-progress.md` topic 추가 + catalog.json 1 artifact 등록 + 회귀 263 pass 유지 |
| v1.4 | 2026-04-25 | Sprint 4 5/5 종결: Strategy Kernel/OKR/PR-FAQ/3-Horizon 4 templates 추가 (catalog 5 artifacts) + `template-validator.js` `*.template.md` 제외 fix + RA-3 1차 측정 ~9분/5 templates + 회귀 263 pass 유지 |
| v1.5 | 2026-04-26 | Sprint 5 5/5 종결: PEST/Five Forces/SWOT/JTBD/Persona 5 Why templates 추가 (catalog 10 artifacts: core 5 + why 5) + RA-3 보정 ~75초/template + scope-conditional 정책 2개 (PEST/Five Forces) + 회귀 263 pass 유지 |
| v1.6 | 2026-04-26 | Sprint 6 F8 VPC 재매핑 종결: Osterwalder VPC template 신규 (catalog 11 artifacts) + copy-writer (CBO) → product-strategist (CPO) ownership 이관 + plugin-validate 통과 + 회귀 263 pass + SC-06 충족 |
| v1.7 | 2026-04-26 | Sprint 7 종결: 10 신규 sub-agent (CEO 4 + CPO 1 + COO 5 release 5분해) + release-engineer deprecate alias + vais.config.json cSuite 3 영역 업데이트 (G-4 충족) + 11 owner_agent ↔ template 1:1 매칭 검증 + plugin-validate 58 agents 인식 + 회귀 263 pass + SC-05 충족 (6/6 MUST) |
| v1.8 | 2026-04-26 | Sprint 8 종결: scripts/sub-agent-audit.js 자동화 (235 LOC) + 4 hotfix (customer-segmentation/market-researcher/product-strategist/roadmap-author artifacts+canon_source) + audit 매트릭스 04-qa 추가 + 7/48 전 4기준 통과 + Sprint 9 33 sub-agent Q-A/Q-B 마이그레이션 로드맵 |
| v1.9 | 2026-04-26 | Sprint 9 종결: 34 sub-agent Q-A/Q-B 일괄 마이그레이션 (CPO 6 + CTO 8 + CSO 7 + CBO 8 + COO 3 + CEO 2) — Q-A canon_source / Q-B execution.policy 14/48 → 48/48 (100% 달성). 정전 출처 ~30종 누적. 회귀 263 pass + plugin-validate 0 errors |
| v1.10 | 2026-04-26 | Sprint 10+11 종결: audit script Q-D 3-state (pass/warn/fail) + utility=true 면제 (Sprint 10) + What 7 templates 작성 (Sprint 11: PRD/Lean Canvas/Product Strategy Canvas/Roadmap/OST/Experiment Design/Hypothesis) — **SC-09 충족 (전 4기준 48/48 100%)** + SC-04 11→18/25 (72%) + catalog 18 artifacts |
| v1.11 | 2026-04-26 | Sprint 12 종결: How 11 templates 작성 (architecture-design/api-implementation/db-schema/migration-plan/runbook/dockerfile/ci-cd-pipeline/monitoring-config/security-audit-report/code-review-report/unit-test) — **SC-04 18→29/25 (임계 초과)** + SC-08 18→29/50 (58%) + audit strict-pass 14→15 + 정전 ~38종 누적 + 회귀 263 pass |
| v1.12 | 2026-04-26 | **GA [14/14] 도달**: Sprint 13 (Biz 5) + Sprint 14 (Alignment 3 + interview-guide) — catalog 29→38 (core 5/why 6/what 7/how 11/biz 5/alignment 4). SC-04 152% + SC-08 76% + SC-09 48/48 + SC-10 β 충족. 정전 ~45종 cross-reference. Beta-3 (외부 OSS) 배포 가능 단계. |
