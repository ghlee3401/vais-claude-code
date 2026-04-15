# Sub-plan 09 — Docs & Tests

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 00~08 (전체)
> 후행: 10

---

## 0. 목적

v0.50 구조와 일치하도록 사용자 대면 문서 4종과 테스트 6종을 최종 정비한다. 문서는 사용자 온보딩과 변경 커뮤니케이션, 테스트는 회귀 방지와 CI 통과의 책임을 진다.

---

## 1. 문서 갱신

### 1.1 `CLAUDE.md`

**변경 섹션**:
- Project overview: "6 C-Level 구조(CMO+CFO→CBO 통합)" 문구 반영
- Project Structure: `agents/cbo/` 추가, `agents/cmo/`, `agents/cfo/` 제거
- Agent Architecture 테이블: 7 → 6 C-Level
- CBO 추가 행 + 10 sub-agent 설명
- Execution layer 테이블: 신규 sub-agent 4종 추가 (skill-creator, backlog-manager, secret-scanner, dependency-analyzer), 제거 2종 (retrospective-writer, technical-writer), 이동 2종 (release-engineer, performance-engineer: CTO → COO)
- Development Workflow 섹션: ideation phase 추가 다이어그램
- **Mandatory Rules #2** 수정: "ideation은 optional이며 mandatory 목록에 포함하지 않는다" 명시 (SC-13)
- Version Management 섹션: v0.49.2 → v0.50.0 반영

### 1.2 `AGENTS.md` (Cursor/Copilot 호환)

- Role summaries: CMO/CFO 제거, CBO 추가
- CBO 섹션: 10 sub-agent 1줄씩 설명
- Dependency graph: cbo 노드 추가
- Migration Notes 섹션 신설:
  - "v0.49 → v0.50 변경점: CMO+CFO → CBO 통합, ideation phase 추가, Advisor Tool 기본 활성화"
  - 기존 `.vais/` 상태 파일 자동 마이그레이션 안내
- Advisor Tool 섹션 신설: "모든 Sonnet sub-agent는 Opus advisor를 mid-generation 호출. 사용자가 직접 호출할 필요 없음"

### 1.3 `README.md`

- 최상단 버전 배지: v0.50
- Key Features 섹션:
  - "6 C-Level Virtual Team (CBO 신설)"
  - "Optional Ideation Phase"
  - "Advisor Tool: Opus mid-generation for every Sonnet sub-agent"
  - "4-Step Harness Gate"
- Quick Start 예시 갱신:
  ```
  /vais ceo ideation pricing-strategy   # 아이디어 숙성
  /vais cpo plan pricing-strategy        # 기획 진입 (ideation 자동 참조)
  /vais cto do payment-integration       # 구현
  ```
- 링크: `guide/harness-plan-v2.md` 등 v2 docs 참조

### 1.4 `CHANGELOG.md` — v0.50.0 엔트리

(00에서 헤더만 둔 상태. 여기서 내용 완성)

```markdown
## [0.50.0] - 2026-04-16

### Major Changes
- **Role Consolidation**: CMO + CFO → **CBO (Chief Business Officer)**. 6 C-Level 구조로 단순화.
- **CBO Sub-agents (10 new/merged)**: market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst.
- **Ideation Phase (Optional Phase 0)**: 아이디어 숙성용 자유 대화 모드. `docs/00-ideation/` 자동 저장 + plan 단계 자동 참조. Rule #2 mandatory 목록에 포함하지 않음.
- **Advisor Tool (M-24)**: 모든 32(실측) Sonnet sub-agent에 Anthropic Advisor Tool (`advisor_20260301`) 기본 활성화. Opus 4.6 advisor가 mid-generation 전술 판단 보조. `max_uses=3`, ephemeral caching 5m.
- **4-Step Harness Gate**: SubagentStop hook이 Document → Checkpoint → Gate Judgment → Transition 파이프라인 실행. phase 자동 전이 + 재시도 가이드.
- **10+1 Scenarios**: S-1 신규 서비스 풀 개발 ~ S-10 정기 운영 + S-0 Ideation.

### Added
- `agents/cbo/` (본체 + 10 sub-agent)
- `agents/ceo/skill-creator.md`
- `agents/cpo/backlog-manager.md`
- `agents/cso/secret-scanner.md`, `agents/cso/dependency-analyzer.md`
- `agents/_shared/advisor-guard.md`, `agents/_shared/ideation-guard.md`
- `skills/vais/phases/ideation.md`, `skills/vais/phases/cbo.md`
- `templates/ideation.template.md`
- `lib/advisor/{wrapper,prompt-builder}.js`
- `lib/control/cost-monitor.js`
- `lib/core/{state-machine-v050,migration-engine}.js`
- `lib/registry/agent-registry.js`
- `scripts/check-cc-advisor-support.js`
- `docs/00-ideation/` 경로

### Changed
- `agents/coo/release-engineer.md` (CTO → COO)
- `agents/coo/performance-engineer.md` (CTO → COO)
- `vais.config.json` 전면 갱신 (cSuite.roles 6개, advisor 섹션, workflow.phases ideation 포함)
- `scripts/agent-stop.js` 4-step pipeline
- `lib/observability/schema.js` 이벤트 8종 추가 (role_transition, phase_transition_auto/retry, gate_judgment, ideation_started/ended, advisor_call, advisor_degraded, advisor_budget_block)

### Removed
- `agents/cmo/`, `agents/cfo/` (전 디렉토리)
- `agents/ceo/retrospective-writer.md`
- `agents/coo/technical-writer.md` (및 CTO의 기존 사본)
- `agents/cto/release-engineer.md`, `agents/cto/performance-engineer.md`
- `skills/vais/phases/cmo.md`, `skills/vais/phases/cfo.md`

### Migration
- 기존 `.vais/status.json`의 `cmo_*`, `cfo_*` 항목은 첫 실행 시 `migration-engine.js`가 자동으로 `cbo_*`로 변환 (backup: `.vais/_backup/v049-{timestamp}.tar.gz`).
- 사용자 설정의 cmo/cfo 참조는 수동 업데이트 필요.
```

---

## 2. 테스트 파일 (6종)

### 2.1 `tests/migration.test.js` (기반: 00)
- `cmo_feature_a` fixture → `cbo_feature_a` 변환
- `cfo_billing_v2` → `cbo_billing_v2`
- `retrospective-writer` 레코드 제거
- `cto.subAgents`에서 release-engineer/performance-engineer 이동
- backup 파일 생성 확인
- dry-run 모드에서는 실제 파일 미변경

### 2.2 `tests/state-machine.test.js` (00)
- `validatePhaseTransition('plan', 'design', ['plan'])` → valid
- `validatePhaseTransition('plan', 'do', ['plan'])` → invalid (design 누락)
- `validatePhaseTransition('ideation', 'plan', [])` → valid (ideation optional)
- `validateRoleTransition('cpo', 'cto', 'feat')` → valid (deps 충족)
- `validateRoleTransition('ceo', 'coo', 'feat')` → invalid (CPO/CTO 선행 필요)
- PHASE_MACHINE 6 phase 모두 next/prerequisites 정의 확인

### 2.3 `tests/gate-manager.test.js` (07)
- 5 케이스 결정 테이블 (07 §5.1)
- ideation phase에 대해 pass=true (gate skip)
- failures 배열 구조 유효

### 2.4 `tests/agent-registry.test.js` (03)
- Fixture with includes → mergedBody 정확
- 순환 include 방지 warn
- includes 없을 때 원본 반환

### 2.5 `tests/advisor-integration.test.js` (04)
- Mock Anthropic SDK
- callAdvisor 호출 패턴: early → (작업) → stuck → final (avg 2~3회, max 3)
- `advisor_call` 이벤트 기록
- caching 적용 확인

### 2.6 `tests/advisor-degrade.test.js` (04)
- Budget fixture 199.5 → 월 캡 200 초과
- `degraded=true`, `advice=null`, status=`budget_block`
- `advisor_budget_block` + `advisor_degraded` 이벤트
- 월 변경 mock → `resetIfNewMonth()` → degraded=false

### 2.7 (추가) `tests/scenarios.test.js`
- S-1 ~ S-10 + S-0 각각에 대해:
  - CEO 라우터가 예상 C-Level을 선택
  - 시나리오 종료 상태까지 phase_transition_auto 이벤트 로그 검증
- 통합 수준의 smoke test (실제 sub-agent 호출은 mock)

### 2.8 (추가) `tests/ideation-phase.test.js`
- ideation 진입 → 종료 키워드 → summary 파일 생성
- 4 섹션 존재 검증
- plan 스킬이 자동 참조 (SC-10)

---

## 3. 진입 시 신경 쓸 점

### 3.1 선행에서 보장됨
- 00~08 전체 완료
- 08에서 `npm test` 이미 통과 상태

### 3.2 다음으로 넘길 보증
- 문서 4종 v0.50 반영
- 테스트 8종(필수 6 + 추가 2) 존재 및 통과
- `npm test` 및 `scripts/vais-validate-plugin.js` 모두 통과
- CHANGELOG v0.50.0 엔트리 완성

### 3.3 함정
- **CHANGELOG의 sub-agent 카운트**: "32"로 쓰고 있지만 실측이 38일 수 있음. 03에서 확정된 실측 수치로 교체 필요. SC-14 문구와도 동기화.
- **guide/v1, guide/v2 문서는 수정하지 않음**: 요구사항/레퍼런스는 원본 보존. README에서 링크만 연결.
- **테스트 fixture 경로**: `tests/fixtures/` 디렉토리 사용 권장. 개별 테스트 파일에 inline fixture는 유지비 증가.
- **CI에서 npm install 재실행**: 04에서 Anthropic SDK 추가했다면 lock 파일 갱신 필수. PR 시 lock 파일 변경 확인.
- **CLAUDE.md 길이**: 현재도 이미 길다. 새 섹션은 "변경 이력"이나 "References"로 분리 가능. 본문은 "현재 구조" 중심.
- **AGENTS.md는 읽는 사람이 Claude 아닌 Cursor/Copilot**: Claude-specific 문법(예: AskUserQuestion) 언급 최소화.

---

## 4. 검증

- [ ] `CLAUDE.md` Rule #2에 "ideation is optional" 명시 (SC-13)
- [ ] `AGENTS.md` CBO 섹션 + Migration Notes 존재
- [ ] `README.md` v0.50 배지 + Quick Start ideation 예시
- [ ] `CHANGELOG.md` v0.50.0 엔트리 완성
- [ ] `tests/` 디렉토리에 6+ 테스트 파일 존재
- [ ] `npm test` 통과
- [ ] `scripts/vais-validate-plugin.js` 통과
- [ ] `git diff CHANGELOG.md CLAUDE.md AGENTS.md README.md` → 모두 v0.50 일치

연결 SC: **SC-7, SC-13**

---

## 5. 다음 단계

- **10** Scenario Verification — 10+1 시나리오 수동 walkthrough
