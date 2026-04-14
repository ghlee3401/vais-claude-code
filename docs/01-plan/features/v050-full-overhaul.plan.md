# VAIS Code v0.50 Full Overhaul Plan

> Feature: v050-full-overhaul
> Phase: Plan
> Created: 2026-04-12
> Version: v0.49.2 → v0.50.0

## Executive Summary

| Perspective | Summary |
|------------|---------|
| **Problem** | v0.49.2의 7개 C-Level 구조(CMO/CFO 분리)가 실제 사용에서 역할 중복과 비효율적 라우팅을 유발. 에이전트 38개 중 일부 누락/중복, harness 제어 체계 미완성 |
| **Solution** | CMO+CFO→CBO 통합(7→6 C-Level), 신규 에이전트 8개 추가, 4단계 검증 파이프라인 harness, 10개 시나리오 기반 동적 라우팅 체계 구축 |
| **Function & UX Effect** | CEO가 피처 성격+상태 기반으로 자동 라우팅, CSO Final Gate 의무화, 3단계 자동화 레벨(manual/semi-auto/auto), 체크포인트 기반 상태 복구 |
| **Core Value** | 서비스 런칭 전체 라이프사이클을 AI C-Suite가 체계적으로 자동 실행. 역할 경계 명확화로 품질 향상, 10개 시나리오 커버리지로 실용성 확보 |

## Context Anchor

| Dimension | Content |
|-----------|---------|
| **WHY** | v0.49의 CMO/CFO 분리 구조가 분석+전략 수립이라는 동일 본질을 공유하면서도 별도 실행되어 비효율. 신규 에이전트 부재로 보안 스캐닝, 백로그 관리, 재무 모델링 등 핵심 기능 누락 |
| **WHO** | vais-code 플러그인 사용자 (Claude Code로 서비스 개발하는 개발자/PM/CTO) |
| **RISK** | 대규모 구조 변경으로 기존 상태 파일 마이그레이션 실패 가능성, 에이전트 간 경계 모호로 인한 라우팅 오류 |
| **SUCCESS** | 6개 C-Level + 38개 에이전트 완성, 10개 시나리오 동작 검증, v0.49→v0.50 마이그레이션 무결성 |
| **SCOPE** | agents/, skills/, hooks/, lib/, scripts/, vais.config.json, CLAUDE.md, AGENTS.md, templates/ |

---

## 1. Current State Analysis (v0.49.2)

### 1.1 C-Level Structure (7 roles)
| Role | Layer | Sub-agents | Status |
|------|-------|-----------|--------|
| CEO | executive | absorb-analyzer, retrospective-writer | Active |
| CPO | strategy-product | product-discoverer, product-strategist, product-researcher, prd-writer, ux-researcher, data-analyst | Active |
| CTO | strategy-tech | infra-architect, backend-engineer, frontend-engineer, ui-designer, qa-engineer, test-engineer, release-engineer, db-architect, incident-responder | Active |
| CSO | quality | security-auditor, code-reviewer, plugin-validator, compliance-auditor, skill-validator | Active |
| CMO | growth | seo-analyst, copy-writer, growth-analyst | **To be merged** |
| COO | ops | release-monitor, performance-engineer, sre-engineer, technical-writer | Active |
| CFO | finance | finops-analyst, pricing-analyst | **To be merged** |

### 1.2 Skills Structure
- `skills/vais/SKILL.md` — Main entry point
- `skills/vais/phases/` — ceo, cpo, cto, cso, cmo, cfo, coo + individual engineer phases
- `skills/vais/utils/` — commit, help, init, mcp-builder, next, skill-creator, status

### 1.3 Harness Components
- `hooks/hooks.json` — Hook definitions
- `lib/control/` — automation-controller, blast-radius, checkpoint-manager, loop-breaker, trust-engine
- `lib/core/` — state-machine, state-store, migration
- `lib/observability/` — event-logger, rotation, schema, state-writer
- `lib/pdca/` — automation, decision-record, feature-manager, session-guide

---

## 2. Target State (v0.50.0)

### 2.1 C-Level Structure (6 roles)
| Role | Layer | Sub-agents | Change |
|------|-------|-----------|--------|
| CEO | executive | absorb-analyzer, **skill-creator** | retrospective-writer 제거, skill-creator 추가 |
| CPO | strategy-product | product-discoverer, product-strategist, product-researcher, prd-writer, **backlog-manager**, ux-researcher, data-analyst | backlog-manager 추가 |
| CTO | strategy-tech | infra-architect, backend-engineer, frontend-engineer, ui-designer, qa-engineer, test-engineer, db-architect, incident-responder | release-engineer COO로 이동 |
| CSO | quality | security-auditor, code-reviewer, **secret-scanner**, **dependency-analyzer**, plugin-validator, skill-validator, compliance-auditor | secret-scanner, dependency-analyzer 추가 |
| **CBO** | **business** | **market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst** | **신규 (CMO+CFO 통합 + 5개 신규 에이전트)** |
| COO | ops | **release-engineer**, sre-engineer, release-monitor, performance-engineer | release-engineer CTO에서 이동, technical-writer 제거 |

### 2.2 Agent Delta Summary

#### 추가 (8개)
| Agent | C-Level | Description |
|-------|---------|-------------|
| skill-creator | CEO | 스킬/에이전트 마크다운 자동 생성 |
| backlog-manager | CPO | 백로그 관리 & 스프린트 플래닝 |
| secret-scanner | CSO | 하드코딩된 시크릿/크리덴셜 탐지 |
| dependency-analyzer | CSO | 의존성 취약점 분석 (CVE, 라이선스) |
| market-researcher | CBO | 시장 분석 (PEST, SWOT, Porter 5) |
| customer-segmentation-analyst | CBO | 고객 세분화 (RFM, 페르소나) |
| financial-modeler | CBO | 3-Statement 모델 & DCF |
| unit-economics-analyst | CBO | CAC, LTV, Payback Period 분석 |
| marketing-analytics-analyst | CBO | 멀티터치 어트리뷰션 & 채널 ROI |

#### 이동 (2개)
| Agent | From | To |
|-------|------|-----|
| release-engineer | CTO | COO |
| seo-analyst, copy-writer, growth-analyst, finops-analyst, pricing-analyst | CMO/CFO | CBO |

#### 제거 (2개)
| Agent | C-Level | Reason |
|-------|---------|--------|
| retrospective-writer | CEO | CEO 본체가 직접 수행 |
| technical-writer | COO | CTO/CPO가 각자 담당 |

### 2.3 Harness Changes
| Component | Change |
|-----------|--------|
| `vais.config.json` | cSuite.roles에서 cmo/cfo 제거, cbo 추가. dependencies 업데이트. PIPELINE_ROLES 변경 |
| `lib/core/state-machine.js` | PHASE_MACHINE FSM 업데이트 |
| `lib/core/migration.js` | v0.49→v0.50 마이그레이션 로직 (cmo/cfo→cbo 상태 변환) |
| `scripts/agent-stop.js` | 4단계 검증 파이프라인 구현 (Document → Checkpoint → Gate → Guidance) |
| `hooks/hooks.json` | SubagentStop hook에 4단계 검증 연결 |
| `hooks/events.json` | `role_transition` 이벤트 타입 추가 |
| `lib/observability/schema.js` | role_transition 스키마 추가 |
| `lib/quality/gate-manager.js` | judgePhaseCompletion 로직 강화 |

### 2.4 Scenario Coverage (10 scenarios)
| ID | Scenario | Primary C-Levels |
|----|----------|-----------------|
| S-1 | 신규 서비스 풀 개발 | CEO→CBO①→CPO→CTO→CSO→CBO②→COO |
| S-2 | 기존 서비스 기능 추가 | CEO→CPO→CTO→CSO→COO |
| S-3 | 기존 기능 수정/개선 | CEO→CTO→CSO (CPO for UX branch) |
| S-4 | 프로덕션 장애 대응 | CEO→CTO→CSO→COO |
| S-5 | 성능/비용 최적화 | CEO→CTO→CSO (CBO for cost) |
| S-6 | 보안 감사 & 컴플라이언스 | CEO→CSO↔CTO loop |
| S-7 | 마케팅 캠페인 & GTM | CEO→CPO→CBO→(CTO)→(CSO) |
| S-8 | 사업 분석 & 리포트 | CEO→CBO→(CPO) |
| S-9 | vais-code 내부 강화 | CEO→CSO |
| S-10 | 정기 운영 | CEO→(CTO/CSO/COO) |

---

## 3. Implementation Plan

### Phase 1: Configuration & Infrastructure (기반 작업)

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | vais.config.json 업데이트 — cmo/cfo 제거, cbo 추가, dependencies 변경 | `vais.config.json` | Critical |
| 1.2 | Migration 로직 구현 — v0.49 상태 파일의 cmo/cfo 참조를 cbo로 변환 | `lib/core/migration.js` | Critical |
| 1.3 | State Machine 업데이트 — PIPELINE_ROLES, PHASE_MACHINE FSM | `lib/core/state-machine.js` | Critical |
| 1.4 | Version 동기화 — 0.49.2→0.50.0 (package.json, plugin.json, marketplace.json, CHANGELOG.md) | 4 files | Critical |

### Phase 2: Agent 구조 개편

| # | Task | Files | Priority |
|---|------|-------|----------|
| 2.1 | CBO C-Level 에이전트 생성 | `agents/cbo/cbo.md` | Critical |
| 2.2 | CBO 서브 에이전트 10개 생성 | `agents/cbo/*.md` (10 files) | Critical |
| 2.3 | CEO 에이전트 업데이트 — skill-creator 추가, retrospective-writer 제거 | `agents/ceo/ceo.md`, `agents/ceo/skill-creator.md` | High |
| 2.4 | CPO 에이전트 업데이트 — backlog-manager 추가 | `agents/cpo/cpo.md`, `agents/cpo/backlog-manager.md` | High |
| 2.5 | CTO 에이전트 업데이트 — release-engineer 제거 | `agents/cto/cto.md` | High |
| 2.6 | CSO 에이전트 업데이트 — secret-scanner, dependency-analyzer 추가 | `agents/cso/cso.md`, `agents/cso/secret-scanner.md`, `agents/cso/dependency-analyzer.md` | High |
| 2.7 | COO 에이전트 업데이트 — release-engineer 추가, technical-writer 제거 | `agents/coo/coo.md` | High |
| 2.8 | CMO/CFO 에이전트 디렉토리 삭제 | `agents/cmo/`, `agents/cfo/` | Medium |

### Phase 3: Skill & Phase Router 개편

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1 | CBO Phase Router 생성 | `skills/vais/phases/cbo.md` | Critical |
| 3.2 | CMO/CFO Phase Router 삭제 | `skills/vais/phases/cmo.md`, `skills/vais/phases/cfo.md` | Critical |
| 3.3 | CEO Phase Router 업데이트 — 동적 라우팅 로직, 6개 C-Level 지원 | `skills/vais/phases/ceo.md` | High |
| 3.4 | SKILL.md 업데이트 — CBO 지원, CMO/CFO 제거 | `skills/vais/SKILL.md` | High |
| 3.5 | 기존 Phase Router 업데이트 (CTO/CSO/COO) — 서브 에이전트 목록 변경 반영 | `skills/vais/phases/cto.md`, `cso.md`, `coo.md` | Medium |

### Phase 4: Harness 강화

| # | Task | Files | Priority |
|---|------|-------|----------|
| 4.1 | agent-stop.js — 4단계 검증 파이프라인 구현 | `scripts/agent-stop.js` | Critical |
| 4.2 | hooks.json 업데이트 — SubagentStop 4단계 검증 연결 | `hooks/hooks.json` | Critical |
| 4.3 | gate-manager.js — judgePhaseCompletion 강화 | `lib/quality/gate-manager.js` | High |
| 4.4 | phase-transition.js 업데이트 — CBO 지원, role_transition 이벤트 | `scripts/phase-transition.js` | High |
| 4.5 | events.json — role_transition 이벤트 타입 추가 | `hooks/events.json` | Medium |
| 4.6 | observability schema 업데이트 | `lib/observability/schema.js` | Medium |
| 4.7 | agent-start.js — VALID_ROLES whitelist 업데이트 | `scripts/agent-start.js` | Medium |

### Phase 5: Documentation & Testing

| # | Task | Files | Priority |
|---|------|-------|----------|
| 5.1 | CLAUDE.md 전체 업데이트 — 6 C-Level 구조, 새 에이전트 목록 | `CLAUDE.md` | Critical |
| 5.2 | AGENTS.md 업데이트 — Cursor/Copilot 호환 | `AGENTS.md` | High |
| 5.3 | README.md 업데이트 | `README.md` | Medium |
| 5.4 | 기존 테스트 업데이트 및 신규 테스트 추가 | `tests/*.test.js` | High |
| 5.5 | CHANGELOG.md — v0.50.0 변경사항 기록 | `CHANGELOG.md` | Medium |

---

## 4. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| v0.49 상태 파일 마이그레이션 실패 | Critical | migration.js에서 cmo/cfo→cbo 변환 시 원본 백업 후 변환. 롤백 경로 확보 |
| CBO 에이전트 10개의 역할 경계 모호 | High | agent-mapping-v2.md의 I/O 정의를 에이전트 frontmatter에 명확히 반영 |
| 기존 스킬에서 CMO/CFO 참조하는 코드 잔존 | High | 전체 grep으로 cmo/cfo 참조 탐지 후 일괄 수정 |
| SubagentStop 4단계 검증이 기존 워크플로우 중단 | Medium | 검증 실패 시 warning 로그만 기록하고 진행 (hard block은 gate-manager만) |
| 10개 시나리오 전체 통합 테스트 불가 | Medium | S-1, S-2, S-9를 우선 검증 시나리오로 선정 |

---

## 5. Implementation Order & Dependencies

```
Phase 1 (Configuration)
  ├─ 1.1 vais.config.json ─────────────────┐
  ├─ 1.2 migration.js                       │
  ├─ 1.3 state-machine.js                   ├── Phase 2 depends on Phase 1
  └─ 1.4 Version sync                       │
                                             │
Phase 2 (Agent Restructuring) ◄─────────────┘
  ├─ 2.1 CBO C-Level agent ────────────────┐
  ├─ 2.2 CBO 10 sub-agents                  │
  ├─ 2.3 CEO update                          ├── Phase 3 depends on Phase 2
  ├─ 2.4 CPO update                          │
  ├─ 2.5 CTO update                          │
  ├─ 2.6 CSO update                          │
  ├─ 2.7 COO update                          │
  └─ 2.8 CMO/CFO deletion                   │
                                             │
Phase 3 (Skill & Router) ◄──────────────────┘
  ├─ 3.1 CBO phase router ─────────────────┐
  ├─ 3.2 CMO/CFO router deletion             ├── Phase 4 depends on Phase 3
  ├─ 3.3 CEO router update                   │
  ├─ 3.4 SKILL.md update                     │
  └─ 3.5 Other router updates               │
                                             │
Phase 4 (Harness) ◄─────────────────────────┘
  ├─ 4.1 agent-stop.js 4-stage              │
  ├─ 4.2 hooks.json update                   ├── Phase 5 depends on Phase 4
  ├─ 4.3 gate-manager.js                     │
  ├─ 4.4 phase-transition.js                 │
  ├─ 4.5 events.json                         │
  ├─ 4.6 observability schema                │
  └─ 4.7 agent-start.js                     │
                                             │
Phase 5 (Documentation & Testing) ◄─────────┘
  ├─ 5.1 CLAUDE.md
  ├─ 5.2 AGENTS.md
  ├─ 5.3 README.md
  ├─ 5.4 Tests
  └─ 5.5 CHANGELOG.md
```

---

## 6. Success Criteria

| # | Criteria | Measurement |
|---|----------|-------------|
| SC-1 | 6개 C-Level + 38개 에이전트 파일 완성 | 파일 존재 + frontmatter 유효성 검증 |
| SC-2 | vais.config.json이 v0.50 스펙과 일치 | JSON schema 검증 |
| SC-3 | v0.49→v0.50 마이그레이션 무결성 | migration.js 단위 테스트 통과 |
| SC-4 | CMO/CFO 참조 코드 0건 | `grep -r "cmo\|cfo" agents/ skills/ lib/ scripts/` 결과 0건 |
| SC-5 | 4단계 검증 파이프라인 동작 | agent-stop.js 테스트 통과 |
| SC-6 | S-1, S-2, S-9 시나리오 수동 검증 통과 | 시나리오별 체크리스트 |
| SC-7 | 기존 테스트 전체 통과 | `npm test` 성공 |

---

## 7. Checkpoint Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| CP-1 | 요구사항 확인 | 승인 | 6개 C-Level + 38개 에이전트 + harness 강화 범위 확정 |
| CP-2a | 구현 순서 | Phase별 순차 진행 | 각 Phase 완료 후 확인받고 다음으로 진행 |
| CP-2b | CMO/CFO 삭제 시점 | CBO 완성 후 삭제 | agents/cbo/ 생성 및 검증 완료 후 안전하게 삭제 |
| CP-2c | guide/ 문서 처리 | guide/에 유지 | 향후 버전 업그레이드 시 reference로 활용 |

---

## 8. Estimated Scope

| Category | Count |
|----------|-------|
| 신규 파일 생성 | ~15개 (CBO 11개 + CSO 2개 + CPO 1개 + CEO 1개) |
| 기존 파일 수정 | ~25개 (config, lib, scripts, hooks, skills, docs) |
| 파일 삭제 | ~8개 (cmo/ 4개 + cfo/ 3개 + retrospective-writer + technical-writer) |
| 총 영향 파일 | ~48개 |
