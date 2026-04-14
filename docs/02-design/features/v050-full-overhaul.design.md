# VAIS Code v0.50 Full Overhaul — Design Document

> Feature: v050-full-overhaul
> Phase: Design
> Architecture: **Option B — Clean Architecture**
> Created: 2026-04-12

## Context Anchor

| Dimension | Content |
|-----------|---------|
| **WHY** | v0.49의 CMO/CFO 분리 구조 비효율 + harness 제어 미완성. Clean Architecture로 동적 에이전트 로딩, 시나리오 라우터, 이벤트 버스 기반 완전 재설계 |
| **WHO** | vais-code 플러그인 사용자 (Claude Code 기반 개발자/PM/CTO) |
| **RISK** | 70+ 파일 변경으로 회귀 리스크. 기존 워크플로우 호환성 유지 필수 |
| **SUCCESS** | 6 C-Level + 38 에이전트 완성, 10 시나리오 라우팅, v0.49 마이그레이션 무결성 |
| **SCOPE** | agents/, skills/, hooks/, lib/, scripts/, config, docs |

---

## 1. Overview

v0.50은 VAIS Code의 전면 재설계다. 기존의 하드코딩된 역할 목록과 수동 라우팅을 **동적 에이전트 로더**, **플러그인 레지스트리**, **시나리오 라우터 엔진**, **이벤트 버스** 기반 아키텍처로 교체한다.

### 1.1 Design Principles
1. **Discovery over Configuration** — 에이전트는 파일시스템에서 자동 발견, 수동 등록 불필요
2. **Event-Driven Orchestration** — 상태 변화는 이벤트로 전파, 직접 함수 호출 최소화
3. **Scenario as First-Class** — 10개 시나리오가 라우팅의 기본 단위
4. **Backward Compatible Migration** — v0.49 상태/설정의 자동 변환 보장

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User / Claude Code                    │
└──────────────────────┬──────────────────────────────────┘
                       │ /vais {command}
           ┌───────────▼───────────┐
           │    Skill Entry Point   │  skills/vais/SKILL.md
           │    (Argument Parser)   │
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │    Scenario Router     │  lib/router/scenario-router.js
           │  (S-1~S-10 matching)  │
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │    Agent Registry      │  lib/registry/agent-registry.js
           │  (Dynamic Discovery)  │
           └───────────┬───────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
┌────▼────┐     ┌──────▼──────┐   ┌─────▼─────┐
│ C-Level │     │  Sub-Agent  │   │  Hook Bus  │
│ Agents  │     │  Execution  │   │  (Events)  │
│ (Opus)  │     │  (Sonnet)   │   │            │
└────┬────┘     └──────┬──────┘   └─────┬──────┘
     │                 │                │
     └─────────────────┼────────────────┘
                       │
           ┌───────────▼───────────┐
           │    State Machine       │  lib/core/state-machine.js
           │  (PDCA + Role FSM)    │
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │    Verification        │  lib/quality/
           │  (4-Stage Pipeline)   │
           └───────────────────────┘
```

---

## 3. Module Design

### 3.1 Agent Registry (`lib/registry/agent-registry.js`)

에이전트 파일을 파일시스템에서 자동 발견하고, frontmatter를 파싱하여 레지스트리에 등록하는 시스템.

```javascript
// Agent Registry API
class AgentRegistry {
  constructor(agentsDir) {}

  // 파일시스템 스캔으로 에이전트 자동 발견
  async discover()  // → Map<agentId, AgentMeta>

  // C-Level별 서브에이전트 목록
  getSubAgents(cLevel)  // → AgentMeta[]

  // 에이전트 메타데이터 조회
  get(agentId)  // → AgentMeta | null

  // 역할(role)로 에이전트 검색
  findByRole(role)  // → AgentMeta[]

  // 레이어별 에이전트 그룹
  getByLayer(layer)  // → AgentMeta[]

  // 유효성 검증 (frontmatter 스키마)
  validate()  // → ValidationResult[]
}

// AgentMeta 구조
{
  id: 'backend-engineer',
  path: 'agents/cto/backend-engineer.md',
  cLevel: 'cto',
  model: 'sonnet',
  layer: 'execution',
  role: 'Backend API implementation',
  tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
  inputs: ['SDD', 'API spec'],
  outputs: ['API code', 'unit tests'],
  scenarios: ['S-1', 'S-2', 'S-3', 'S-4']
}
```

**Discovery 규칙**:
- `agents/{cLevel}/{cLevel}.md` → C-Level 에이전트 (model: opus)
- `agents/{cLevel}/{name}.md` (name !== cLevel) → Sub-agent (model: sonnet)
- frontmatter 필수 필드: `model`, `role`, `tools`
- frontmatter 선택 필드: `inputs`, `outputs`, `scenarios`, `scope`

### 3.2 Scenario Router (`lib/router/scenario-router.js`)

10개 시나리오를 패턴 매칭하고, 해당 시나리오의 C-Level 실행 순서를 반환.

```javascript
class ScenarioRouter {
  constructor(registry, config) {}

  // 사용자 입력에서 시나리오 자동 감지
  detect(userInput, featureState)  // → ScenarioMatch

  // 시나리오별 C-Level 실행 플로우 반환
  getFlow(scenarioId)  // → RoleFlow

  // 현재 상태에서 다음 C-Level 결정
  nextRole(scenarioId, completedRoles, featureState)  // → NextStep

  // 시나리오별 스코프 계산 (에이전트 참여 범위)
  getScope(scenarioId, cLevel)  // → ScopeConfig
}

// ScenarioMatch
{
  id: 'S-1',
  name: '신규 서비스 풀 개발',
  confidence: 0.92,
  flow: ['cbo-1', 'cpo', 'cto', 'cso', 'cbo-2', 'coo'],
  branches: null
}

// RoleFlow (시나리오별 C-Level 순서)
{
  scenarioId: 'S-1',
  steps: [
    { role: 'cbo', scope: 'market-analysis', label: 'CBO Phase 1: Market Analysis' },
    { role: 'cpo', scope: 'full', label: 'CPO: Product Strategy & PRD' },
    { role: 'cto', scope: 'full', label: 'CTO: Technical Implementation' },
    { role: 'cso', scope: 'full', label: 'CSO: Security Review' },
    { role: 'cbo', scope: 'marketing', label: 'CBO Phase 2: GTM & Marketing' },
    { role: 'coo', scope: 'full', label: 'COO: Deployment & Ops' }
  ],
  loops: [
    { between: ['cso', 'cto'], maxIterations: 3, trigger: 'critical > 0' }
  ],
  finalReview: 'ceo'
}
```

**시나리오 정의 파일**: `lib/router/scenarios.json`
```json
{
  "S-1": {
    "name": "신규 서비스 풀 개발",
    "keywords": ["new product", "신규 서비스", "launch", "런칭", "새로운"],
    "flow": ["cbo:market-analysis", "cpo:full", "cto:full", "cso:full", "cbo:marketing", "coo:full"],
    "loops": [{"between": ["cso", "cto"], "max": 3}],
    "dependencies": {"cpo": ["cbo"], "cto": ["cpo"], "cso": ["cto"], "coo": ["cto"]}
  },
  "S-2": {
    "name": "기존 서비스 기능 추가",
    "keywords": ["feature", "기능 추가", "add", "추가"],
    "flow": ["cpo:full", "cto:full", "cso:full", "coo:full"],
    "loops": [{"between": ["cso", "cto"], "max": 3}],
    "dependencies": {"cto": ["cpo"], "cso": ["cto"], "coo": ["cto"]}
  }
}
```
*... S-3 ~ S-10도 동일 구조로 정의*

### 3.3 Event Bus (`lib/events/event-bus.js`)

상태 변화를 이벤트로 전파. hooks와 observability를 통합하는 중앙 이벤트 시스템.

```javascript
class EventBus {
  constructor() {}

  // 이벤트 발행
  emit(event)  // → void

  // 이벤트 구독 (hook scripts 자동 연결)
  on(eventType, handler)  // → unsubscribe fn

  // 이벤트 이력 조회
  history(filter)  // → Event[]

  // JSONL 파일로 영속화
  persist(event)  // → void (append to event-log.jsonl)
}

// Event Types
const EVENT_TYPES = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  PHASE_START: 'phase_start',
  PHASE_COMPLETE: 'phase_complete',
  PHASE_FAIL: 'phase_fail',
  ROLE_TRANSITION: 'role_transition',
  AGENT_START: 'agent_start',
  AGENT_STOP: 'agent_stop',
  DOCUMENT_CREATED: 'document_created',
  CHECKPOINT_RECORDED: 'checkpoint_recorded',
  GATE_PASS: 'gate_pass',
  GATE_FAIL: 'gate_fail',
  VERIFICATION_COMPLETE: 'verification_complete',
  SCENARIO_DETECTED: 'scenario_detected',
  LOOP_ITERATION: 'loop_iteration',
  LOOP_ESCALATION: 'loop_escalation'
};

// Event 구조
{
  type: 'role_transition',
  timestamp: '2026-04-12T10:00:00Z',
  feature: 'user-auth',
  data: {
    from_role: 'cto',
    to_role: 'cso',
    phase: 'qa',
    scenario: 'S-2',
    reason: 'CTO PDCA complete, CSO security review required'
  }
}
```

### 3.4 State Machine (`lib/core/state-machine.js` — Rewrite)

PDCA Phase FSM + Role FSM을 통합한 2차원 상태 머신.

```javascript
class StateMachine {
  constructor(eventBus) {}

  // 현재 상태 로드
  load(feature)  // → FeatureState

  // 상태 전이 (검증 포함)
  transition(feature, nextPhase)  // → TransitionResult

  // 역할 전이
  transitionRole(feature, nextRole)  // → TransitionResult

  // 전이 가능 여부 확인
  canTransition(feature, target)  // → boolean

  // 상태 스냅샷 저장
  snapshot(feature)  // → void
}

// FeatureState 구조
{
  feature: 'user-auth',
  scenario: 'S-2',
  currentRole: 'cto',
  currentPhase: 'do',
  completedPhases: {
    cpo: ['plan', 'design', 'do', 'qa', 'report'],
    cto: ['plan', 'design']
  },
  matchRate: null,
  iteration: 0,
  automationLevel: 'semi-auto',
  timestamps: {
    started: '2026-04-12T09:00:00Z',
    lastTransition: '2026-04-12T10:30:00Z'
  }
}

// Phase FSM (각 C-Level 내부)
//   plan → design → do → qa → report
//   qa에서 matchRate < 90% → do로 회귀 (iteration++)

// Role FSM (CEO 동적 라우팅, 시나리오에 따라)
//   S-2: cpo → cto → cso ↔ cto(loop) → coo
```

### 3.5 Verification Pipeline (`lib/quality/verification-pipeline.js`)

SubagentStop 시 실행되는 4단계 검증 파이프라인.

```javascript
class VerificationPipeline {
  constructor(registry, eventBus) {}

  // 전체 파이프라인 실행
  async run(context)  // → VerificationResult

  // Stage 1: 문서 유효성
  async validateDocuments(feature, phase, role)  // → StageResult

  // Stage 2: 체크포인트 유효성
  async validateCheckpoints(feature, phase)  // → StageResult

  // Stage 3: 게이트 판정
  async judgeGate(feature, phase, stages)  // → GateDecision

  // Stage 4: 다음 단계 가이드 생성
  generateGuidance(feature, phase, decision)  // → Guidance
}

// StageResult
{
  stage: 1,
  name: 'document_validation',
  pass: true,
  details: [
    { check: 'file_exists', path: 'docs/01-plan/cto_user-auth.plan.md', pass: true },
    { check: 'min_size', bytes: 2340, threshold: 500, pass: true }
  ]
}

// GateDecision
{
  pass: true,
  autoTransition: true,  // automationLevel에 따라
  nextPhase: 'design',
  nextRole: null,  // 같은 역할 내 다음 phase
  failures: []
}
```

### 3.6 Checkpoint System (`lib/checkpoint/`) — **핵심 UX 패턴**

vais-code의 핵심 정체성인 **"실행 중 멈추고 사용자에게 선택권을 주는"** 패턴을 first-class로 승격. AskUserQuestion 기반의 체크포인트 시스템을 중앙 집중화하여 모든 에이전트가 일관되게 사용.

#### 3.6.1 CheckpointRegistry (`lib/checkpoint/registry.js`)

체크포인트 정의를 한 곳에 모아 관리. 각 에이전트가 복붙하던 CP 테이블을 단일 진실 소스로.

```javascript
class CheckpointRegistry {
  constructor(configPath) {}

  // 체크포인트 정의 로드
  load()  // → Map<cpId, CheckpointDef>

  // 조건에 맞는 CP 조회
  find({ role, phase, trigger })  // → CheckpointDef[]

  // 특정 CP 상세
  get(cpId)  // → CheckpointDef | null
}

// CheckpointDef 구조 (checkpoints.json)
{
  id: 'CP-0',
  name: 'PRD Validation',
  trigger: 'plan_start_without_prd',
  mandatory: true,
  scope: ['cto'],
  phase: 'plan',
  question: 'PRD가 없습니다. 어떻게 진행할까요?',
  options: [
    { label: 'CPO 먼저 실행', action: 'route:cpo:plan' },
    { label: 'Plan에서 간이 PRD 작성', action: 'continue:with_minimal_prd' },
    { label: '스킵하고 진행', action: 'continue:skip_prd' },
    { label: '중단', action: 'abort' }
  ],
  escalation: { timeoutMs: 300000, defaultAction: 'abort' }
}
```

**체크포인트 분류** (10개 이상):

| CP ID | 시점 | 주체 | 필수 여부 |
|-------|------|------|----------|
| CP-0 | PRD 부재 감지 | CTO plan 시작 | Mandatory (gate.cto.plan.requirePrd=ask) |
| CP-1 | Plan 요구사항 확인 | 모든 C-Level | Mandatory |
| CP-2 | Plan 세부 질문 | 모든 C-Level | Conditional |
| CP-3 | Design 아키텍처 선택 | 모든 C-Level | Mandatory |
| CP-4 | Do 구현 범위 승인 | 모든 C-Level | Mandatory |
| CP-5 | QA 리뷰 결정 | CSO, QA | Mandatory |
| CP-Q | Quality Gate 판정 | 모든 phase 종료 시 | Conditional (automationLevel) |
| CP-S | Scenario 분류 확인 | CEO 라우팅 시 | Conditional (confidence<0.7) |
| CP-R | Role Transition 승인 | C-Level 전환 시 | Conditional (automationLevel) |
| CP-L | Loop 반복 승인 | CSO↔CTO 루프 | Mandatory (iteration>1) |
| CP-D | Destructive 작업 확인 | blast-radius high 시 | Mandatory |
| CP-E | Emergency Stop 해제 | 에러 복구 시 | Mandatory |

#### 3.6.2 CheckpointManager (`lib/checkpoint/manager.js`)

체크포인트 실행과 상태 기록을 담당. 기존 `lib/control/checkpoint-manager.js`를 확장.

```javascript
class CheckpointManager {
  constructor(registry, eventBus) {}

  // 체크포인트 실행 (AskUserQuestion 호출 준비)
  async prepare(cpId, context)  // → CheckpointPrompt

  // 사용자 응답 기록 (cp-tracker hook에서 호출)
  async record(cpId, userChoice, context)  // → CheckpointRecord

  // 기록 조회
  async getHistory(feature, phase?)  // → CheckpointRecord[]

  // SHA-256 무결성 검증
  async verify(cpId, recordId)  // → boolean

  // automationLevel 기반 자동 응답 가능 여부
  canAutoRespond(cpId, automationLevel)  // → boolean
}

// CheckpointPrompt (에이전트가 AskUserQuestion에 전달)
{
  cpId: 'CP-3',
  question: '3가지 설계안 중 어떤 걸 선택하시겠습니까?',
  header: 'Architecture',
  options: [
    { label: 'Option A — Minimal', description: '...', preview: '...' },
    { label: 'Option B — Clean', description: '...' },
    { label: 'Option C — Pragmatic', description: '...' }
  ],
  multiSelect: false,
  autoResponse: null,  // automationLevel=4면 기본값 자동 선택
  timeout: 300000
}

// CheckpointRecord (영속화)
{
  cpId: 'CP-3',
  recordId: 'rec-20260414-103000',
  feature: 'user-auth',
  phase: 'design',
  role: 'cto',
  question: '...',
  userChoice: 'Option B — Clean',
  timestamp: '2026-04-14T10:30:00Z',
  context: {...},
  sha256: 'abc123...',
  scenario: 'S-2'
}
```

#### 3.6.3 AskUserQuestion 강제 패턴 (`lib/checkpoint/enforcer.js`)

에이전트가 체크포인트를 건너뛰지 못하도록 강제.

```javascript
class CheckpointEnforcer {
  constructor(manager, eventBus) {}

  // 현재 phase에서 통과했어야 하는 CP 검증
  async verifyCheckpoints(feature, phase, role)  // → VerifyResult

  // 누락된 CP 감지 (SubagentStop 시 실행)
  async detectMissing(feature, phase, role)  // → MissingCP[]

  // AskUserQuestion 호출 여부 확인
  async wasCalled(cpId, session)  // → boolean
}

// 검증 로직
// 1. CheckpointRegistry에서 (role, phase) mandatory CP 목록 조회
// 2. CheckpointManager.getHistory()로 기록된 CP 확인
// 3. 누락된 mandatory CP가 있으면 Gate에서 FAIL
```

#### 3.6.4 Automation Level 연동

automationLevel에 따라 체크포인트가 다르게 동작:

| Level | CP 동작 |
|-------|---------|
| L0 (manual) | **모든 CP** AskUserQuestion 필수 |
| L1 (guided) | Mandatory CP만 사용자 확인, Conditional CP는 자동 |
| L2 (semi-auto, default) | Mandatory + Destructive CP만 사용자 확인 |
| L3 (auto) | Destructive + Critical CP만 사용자 확인 |
| L4 (full-auto) | Emergency Stop CP만 사용자 확인, 나머지는 기본값 자동 선택 + 포스트 리뷰 |

#### 3.6.5 EventBus 통합

```javascript
// 체크포인트 관련 이벤트
CHECKPOINT_PROMPTED: 'checkpoint_prompted'   // AskUserQuestion 호출됨
CHECKPOINT_ANSWERED: 'checkpoint_answered'   // 사용자 응답 수신
CHECKPOINT_AUTO: 'checkpoint_auto'           // L3/L4에서 자동 응답
CHECKPOINT_SKIPPED: 'checkpoint_skipped'     // Mandatory CP 스킵 (violation!)
CHECKPOINT_TIMEOUT: 'checkpoint_timeout'     // 응답 타임아웃 → 기본 동작
```

#### 3.6.6 Verification Pipeline 연동

4단계 검증 파이프라인의 **Stage 2 (Checkpoint Validation)** 가 CheckpointEnforcer를 호출:

```javascript
// Stage 2: Checkpoint Validation
async validateCheckpoints(feature, phase, role) {
  const enforcer = new CheckpointEnforcer(manager, eventBus);
  const missing = await enforcer.detectMissing(feature, phase, role);

  if (missing.length > 0) {
    return {
      pass: false,
      violations: missing.map(cp => ({
        cpId: cp.id,
        severity: cp.mandatory ? 'critical' : 'warning',
        message: `Mandatory checkpoint ${cp.id} was not executed`
      }))
    };
  }
  return { pass: true };
}
```

#### 3.6.7 Agent 측 사용 패턴 (표준)

모든 C-Level 에이전트와 phase router가 따르는 표준 패턴:

```markdown
## Phase 실행 순서

1. Context Load (L1-L4)
2. 산출물 요약 생성 (Executive Summary)
3. **출력 먼저** (사용자가 선택 배경을 이해하도록)
4. **CheckpointRegistry.find({ role, phase, trigger: 'phase_start' })** 호출
5. 반환된 CP에 대해 **AskUserQuestion** 호출
6. cp-tracker hook이 자동으로 CheckpointManager.record() 실행
7. 사용자 응답에 따라 분기 처리
8. 다음 단계로 진행
```

---

### 3.7 Migration Engine (`lib/core/migration-engine.js`)

v0.49 → v0.50 마이그레이션을 안전하게 수행.

```javascript
class MigrationEngine {
  constructor(eventBus) {}

  // 현재 버전 감지
  detectVersion(stateFile)  // → string ('0.49.2' | '0.50.0' | ...)

  // 마이그레이션 필요 여부
  needsMigration(currentVersion, targetVersion)  // → boolean

  // 마이그레이션 실행
  async migrate(stateFile)  // → MigrationResult

  // 롤백
  async rollback(backupPath)  // → void
}

// 마이그레이션 규칙
const MIGRATIONS = {
  '0.49→0.50': {
    transforms: [
      // 1. C-Level 통합: cmo + cfo → cbo
      { type: 'role_merge', from: ['cmo', 'cfo'], to: 'cbo' },
      // 2. 에이전트 이동: release-engineer CTO→COO
      { type: 'agent_move', agent: 'release-engineer', from: 'cto', to: 'coo' },
      // 3. 에이전트 제거
      { type: 'agent_remove', agents: ['retrospective-writer', 'technical-writer'] },
      // 4. Config 키 변경
      { type: 'config_transform', path: 'cSuite.roles', fn: 'mergeCmoCfo' },
      // 5. PIPELINE_ROLES 업데이트
      { type: 'config_set', path: 'cSuite.pipelineRoles', value: ['cbo', 'cpo', 'cto', 'cso', 'coo'] },
      // 6. 상태 파일 내 cmo/cfo 참조 → cbo
      { type: 'state_transform', fn: 'rewriteRoleReferences' }
    ],
    backup: true,
    backupPath: '.vais/backup/v049/'
  }
};
```

---

## 4. Agent Architecture

### 4.1 Frontmatter Schema (v0.50 Unified)

모든 에이전트 마크다운 파일의 표준 frontmatter 스키마:

```yaml
---
# Required
model: opus | sonnet
role: string        # 한 줄 역할 설명
tools:              # 사용 가능 도구 목록
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent          # C-Level only (서브에이전트 위임용)

# C-Level only
layer: executive | strategy-product | strategy-tech | quality | business | ops
subAgents:         # 서브에이전트 ID 목록
  - backend-engineer
  - frontend-engineer

# Sub-agent only
cLevel: cto        # 소속 C-Level
inputs:            # 입력 산출물
  - SDD
  - API spec
outputs:           # 출력 산출물
  - API code
  - unit tests

# Optional
scenarios:         # 참여 시나리오 ID
  - S-1
  - S-2
  - S-3
scope:             # 시나리오별 참여 범위
  S-1: full
  S-2: partial
  S-3: minimal
---
```

### 4.2 C-Level Agent 구조 (6 roles)

#### CEO (`agents/ceo/ceo.md`)
```
Sub-agents: absorb-analyzer, skill-creator
Role: Orchestrator/Router — 시나리오 감지, C-Level 라우팅, 통합 리뷰
Modes: routing | skill-creation | skill-absorption
```

#### CPO (`agents/cpo/cpo.md`)
```
Sub-agents: product-discoverer, product-strategist, product-researcher,
            prd-writer, backlog-manager, ux-researcher, data-analyst (7)
Role: What to build — PRD, 백로그, UX 리서치
```

#### CTO (`agents/cto/cto.md`)
```
Sub-agents: infra-architect, ui-designer, frontend-engineer, backend-engineer,
            test-engineer, qa-engineer, db-architect, incident-responder (8)
Role: How to build — Architecture, implementation, testing
```

#### CSO (`agents/cso/cso.md`)
```
Sub-agents: security-auditor, code-reviewer, secret-scanner,
            dependency-analyzer, plugin-validator, skill-validator,
            compliance-auditor (7)
Role: Code safety — Security audit, final gate
```

#### CBO (`agents/cbo/cbo.md`) — NEW
```
Sub-agents: market-researcher, customer-segmentation-analyst, seo-analyst,
            copy-writer, growth-analyst, pricing-analyst, financial-modeler,
            unit-economics-analyst, finops-analyst, marketing-analytics-analyst (10)
Role: Business strategy — Market analysis + Marketing + Finance unified
```

#### COO (`agents/coo/coo.md`)
```
Sub-agents: release-engineer, sre-engineer, release-monitor,
            performance-engineer (4)
Role: Operations — CI/CD, deployment, monitoring
```

### 4.3 Full Agent List (38 agents)

| # | C-Level | Agent ID | Model | Status |
|---|---------|----------|-------|--------|
| 1 | CEO | absorb-analyzer | sonnet | Keep |
| 2 | CEO | skill-creator | sonnet | **New** |
| 3 | CPO | product-discoverer | sonnet | Keep |
| 4 | CPO | product-strategist | sonnet | Keep |
| 5 | CPO | product-researcher | sonnet | Keep |
| 6 | CPO | prd-writer | sonnet | Keep |
| 7 | CPO | backlog-manager | sonnet | **New** |
| 8 | CPO | ux-researcher | sonnet | Keep |
| 9 | CPO | data-analyst | sonnet | Keep |
| 10 | CTO | infra-architect | sonnet | Keep |
| 11 | CTO | ui-designer | sonnet | Keep |
| 12 | CTO | frontend-engineer | sonnet | Keep |
| 13 | CTO | backend-engineer | sonnet | Keep |
| 14 | CTO | test-engineer | sonnet | Keep |
| 15 | CTO | qa-engineer | sonnet | Keep |
| 16 | CTO | db-architect | sonnet | Keep |
| 17 | CTO | incident-responder | sonnet | Keep |
| 18 | CSO | security-auditor | sonnet | Keep |
| 19 | CSO | code-reviewer | sonnet | Keep |
| 20 | CSO | secret-scanner | sonnet | **New** |
| 21 | CSO | dependency-analyzer | sonnet | **New** |
| 22 | CSO | plugin-validator | sonnet | Keep |
| 23 | CSO | skill-validator | sonnet | Keep |
| 24 | CSO | compliance-auditor | sonnet | Keep |
| 25 | CBO | market-researcher | sonnet | **New** |
| 26 | CBO | customer-segmentation-analyst | sonnet | **New** |
| 27 | CBO | seo-analyst | sonnet | Move (CMO→CBO) |
| 28 | CBO | copy-writer | sonnet | Move (CMO→CBO) |
| 29 | CBO | growth-analyst | sonnet | Move (CMO→CBO) |
| 30 | CBO | pricing-analyst | sonnet | Move (CFO→CBO) |
| 31 | CBO | financial-modeler | sonnet | **New** |
| 32 | CBO | unit-economics-analyst | sonnet | **New** |
| 33 | CBO | finops-analyst | sonnet | Move (CFO→CBO) |
| 34 | CBO | marketing-analytics-analyst | sonnet | **New** |
| 35 | COO | release-engineer | sonnet | Move (CTO→COO) |
| 36 | COO | sre-engineer | sonnet | Keep |
| 37 | COO | release-monitor | sonnet | Keep |
| 38 | COO | performance-engineer | sonnet | Keep |

---

## 5. Hook System Redesign

### 5.1 Event-Driven Hook Architecture

기존의 hooks.json 정적 매핑을 EventBus 기반으로 전환:

```javascript
// hooks/hook-adapter.js
// Claude Code hooks.json → EventBus 브릿지
class HookAdapter {
  constructor(eventBus) {}

  // Claude Code hook 이벤트를 EventBus로 변환
  bridgeHook(hookType, hookData)  // → Event

  // EventBus 이벤트를 hook 응답으로 변환
  toHookResponse(event)  // → HookResponse
}
```

### 5.2 Hook Points (7 → EventBus 매핑)

| Hook Point | EventBus Event | Handler |
|------------|---------------|---------|
| SessionStart | `session_start` | `handlers/session-start.js` |
| PreToolUse(Bash) | `tool_pre_bash` | `handlers/bash-guard.js` |
| PostToolUse(Write\|Edit) | `document_created` | `handlers/doc-tracker.js` |
| PostToolUse(AskUserQuestion) | `checkpoint_recorded` | `handlers/cp-tracker.js` |
| SubagentStart | `agent_start` | `handlers/agent-start.js` |
| SubagentStop | `agent_stop` | `handlers/agent-stop.js` → **VerificationPipeline** |
| Stop | `session_end` | `handlers/session-end.js` |

### 5.3 hooks.json (v0.50)

```json
[
  {
    "event": "session_start",
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/session-start.js"
      }
    ]
  },
  {
    "event": "pre_tool_use",
    "matcher": { "tool_name": "Bash" },
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/bash-guard.js"
      }
    ]
  },
  {
    "event": "post_tool_use",
    "matcher": { "tool_name": ["Write", "Edit"] },
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/doc-tracker.js"
      }
    ]
  },
  {
    "event": "post_tool_use",
    "matcher": { "tool_name": "AskUserQuestion" },
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/cp-tracker.js"
      }
    ]
  },
  {
    "event": "subagent_start",
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/agent-start.js"
      }
    ]
  },
  {
    "event": "subagent_stop",
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/agent-stop.js"
      }
    ]
  },
  {
    "event": "stop",
    "hooks": [
      {
        "type": "command",
        "command": "node scripts/handlers/session-end.js"
      }
    ]
  }
]
```

---

## 6. Configuration Design

### 6.1 vais.config.json (v0.50)

```json
{
  "version": "0.50.0",
  "plugin": {
    "name": "vais-code",
    "description": "Virtual AI C-Suite for software development"
  },
  "cSuite": {
    "orchestrator": {
      "fullLaunch": "ceo",
      "techOnly": "cto"
    },
    "pipelineRoles": ["cbo", "cpo", "cto", "cso", "coo"],
    "roles": {
      "ceo": {
        "required": true,
        "model": "opus",
        "layer": "executive",
        "agent": "agents/ceo/ceo.md",
        "subAgents": ["absorb-analyzer", "skill-creator"]
      },
      "cpo": {
        "required": false,
        "model": "opus",
        "layer": "strategy-product",
        "agent": "agents/cpo/cpo.md",
        "subAgents": ["product-discoverer", "product-strategist", "product-researcher", "prd-writer", "backlog-manager", "ux-researcher", "data-analyst"]
      },
      "cto": {
        "required": true,
        "model": "opus",
        "layer": "strategy-tech",
        "agent": "agents/cto/cto.md",
        "subAgents": ["infra-architect", "ui-designer", "frontend-engineer", "backend-engineer", "test-engineer", "qa-engineer", "db-architect", "incident-responder"]
      },
      "cso": {
        "required": false,
        "model": "opus",
        "layer": "quality",
        "agent": "agents/cso/cso.md",
        "subAgents": ["security-auditor", "code-reviewer", "secret-scanner", "dependency-analyzer", "plugin-validator", "skill-validator", "compliance-auditor"]
      },
      "cbo": {
        "required": false,
        "model": "opus",
        "layer": "business",
        "agent": "agents/cbo/cbo.md",
        "subAgents": ["market-researcher", "customer-segmentation-analyst", "seo-analyst", "copy-writer", "growth-analyst", "pricing-analyst", "financial-modeler", "unit-economics-analyst", "finops-analyst", "marketing-analytics-analyst"]
      },
      "coo": {
        "required": false,
        "model": "opus",
        "layer": "ops",
        "agent": "agents/coo/coo.md",
        "subAgents": ["release-engineer", "sre-engineer", "release-monitor", "performance-engineer"]
      }
    },
    "dependencies": {
      "cbo": [],
      "cpo": [],
      "cto": ["cpo"],
      "cso": ["cto"],
      "coo": ["cto"]
    },
    "autoKeywords": {
      "ceo": ["new product", "신규 서비스", "방향", "전략", "strategy", "launch", "런칭"],
      "cso": ["payment", "auth", "login", "security", "결제", "인증", "보안"],
      "cbo": ["landing", "marketing", "마케팅", "랜딩", "캠페인", "pricing", "cost", "비용", "가격"],
      "coo": ["deploy", "release", "배포", "릴리스", "운영", "infra"]
    }
  },
  "scenarios": {
    "configPath": "lib/router/scenarios.json",
    "defaultScenario": "S-2"
  },
  "observability": {
    "enabled": true,
    "stateFile": ".vais/agent-state.json",
    "eventLog": ".vais/event-log.jsonl",
    "maxEventLogSizeMB": 10,
    "rotateAfterDays": 30,
    "archivePath": ".vais/archive/"
  },
  "workflow": {
    "phases": ["plan", "design", "do", "qa", "report"],
    "mandatoryPhases": ["plan", "design", "do", "qa"],
    "phaseNames": {
      "plan": "기획", "design": "설계", "do": "구현", "qa": "QA", "report": "보고서"
    },
    "docPaths": {
      "plan": "docs/01-plan/{role}_{feature}.plan.md",
      "design": "docs/02-design/{role}_{feature}.design.md",
      "do": "docs/03-do/{role}_{feature}.do.md",
      "qa": "docs/04-qa/{role}_{feature}.qa.md",
      "report": "docs/05-report/{role}_{feature}.report.md"
    }
  },
  "verification": {
    "pipeline": {
      "stages": ["document_validation", "checkpoint_validation", "gate_judgment", "next_step_guidance"],
      "documentMinSize": 500,
      "checkpointRequired": true
    },
    "gapAnalysis": {
      "matchThreshold": 90,
      "maxIterations": 5,
      "autoIterate": true
    }
  },
  "automation": {
    "defaultLevel": 2,
    "emergencyFallbackLevel": 1,
    "gateTimeoutMs": 300000,
    "emergencyStopEnabled": true,
    "trustScoreEnabled": true,
    "maxConcurrentFeatures": 3
  },
  "guardrails": {
    "destructiveDetection": true,
    "loopBreaker": {
      "maxPdcaIterations": 5,
      "maxSameFileEdits": 10,
      "maxAgentRecursion": 3,
      "cooldownMs": 60000
    },
    "blastRadiusLimit": "high",
    "checkpointOnPhaseTransition": true,
    "checkpointOnDestructive": true
  },
  "migration": {
    "autoDetect": true,
    "backupBeforeMigrate": true,
    "backupPath": ".vais/backup/"
  }
}
```

---

## 7. File Structure (v0.50 Target)

```
vais-claude-code/
├── agents/
│   ├── ceo/
│   │   ├── ceo.md
│   │   ├── absorb-analyzer.md
│   │   └── skill-creator.md          # NEW
│   ├── cpo/
│   │   ├── cpo.md
│   │   ├── product-discoverer.md
│   │   ├── product-strategist.md
│   │   ├── product-researcher.md
│   │   ├── prd-writer.md
│   │   ├── backlog-manager.md         # NEW
│   │   ├── ux-researcher.md
│   │   └── data-analyst.md
│   ├── cto/
│   │   ├── cto.md
│   │   ├── infra-architect.md
│   │   ├── ui-designer.md
│   │   ├── frontend-engineer.md
│   │   ├── backend-engineer.md
│   │   ├── test-engineer.md
│   │   ├── qa-engineer.md
│   │   ├── db-architect.md
│   │   └── incident-responder.md
│   ├── cso/
│   │   ├── cso.md
│   │   ├── security-auditor.md
│   │   ├── code-reviewer.md
│   │   ├── secret-scanner.md          # NEW
│   │   ├── dependency-analyzer.md     # NEW
│   │   ├── plugin-validator.md
│   │   ├── skill-validator.md
│   │   └── compliance-auditor.md
│   ├── cbo/                           # NEW directory
│   │   ├── cbo.md                     # NEW
│   │   ├── market-researcher.md       # NEW
│   │   ├── customer-segmentation-analyst.md  # NEW
│   │   ├── seo-analyst.md             # MOVE from cmo/
│   │   ├── copy-writer.md             # MOVE from cmo/
│   │   ├── growth-analyst.md          # MOVE from cmo/
│   │   ├── pricing-analyst.md         # MOVE from cfo/
│   │   ├── financial-modeler.md       # NEW
│   │   ├── unit-economics-analyst.md  # NEW
│   │   ├── finops-analyst.md          # MOVE from cfo/
│   │   └── marketing-analytics-analyst.md  # NEW
│   └── coo/
│       ├── coo.md
│       ├── release-engineer.md        # MOVE from cto/
│       ├── sre-engineer.md
│       ├── release-monitor.md
│       └── performance-engineer.md
│
├── lib/
│   ├── registry/                      # NEW directory
│   │   ├── agent-registry.js          # NEW
│   │   └── frontmatter-parser.js      # NEW
│   ├── router/                        # NEW directory
│   │   ├── scenario-router.js         # NEW
│   │   └── scenarios.json             # NEW
│   ├── events/                        # NEW directory
│   │   ├── event-bus.js               # NEW
│   │   └── event-types.js             # NEW
│   ├── checkpoint/                    # NEW directory (CP 핵심 UX)
│   │   ├── registry.js                # NEW: CheckpointRegistry
│   │   ├── manager.js                 # NEW: CheckpointManager (기존 control/checkpoint-manager.js 확장)
│   │   ├── enforcer.js                # NEW: CheckpointEnforcer
│   │   └── checkpoints.json           # NEW: CP 정의 (CP-0~CP-E)
│   ├── core/
│   │   ├── state-machine.js           # REWRITE
│   │   ├── state-store.js             # UPDATE
│   │   └── migration-engine.js        # REWRITE (was migration.js)
│   ├── control/
│   │   ├── automation-controller.js   # UPDATE
│   │   ├── blast-radius.js            # KEEP
│   │   ├── checkpoint-manager.js      # UPDATE
│   │   ├── loop-breaker.js            # UPDATE
│   │   ├── trust-engine.js            # KEEP
│   │   └── index.js                   # UPDATE
│   ├── quality/
│   │   ├── verification-pipeline.js   # NEW (was gate-manager.js logic)
│   │   ├── gate-manager.js            # REWRITE
│   │   ├── template-validator.js      # UPDATE
│   │   └── index.js                   # UPDATE
│   ├── observability/
│   │   ├── event-logger.js            # UPDATE (use EventBus)
│   │   ├── schema.js                  # UPDATE (add new event types)
│   │   ├── state-writer.js            # UPDATE
│   │   ├── rotation.js                # KEEP
│   │   └── index.js                   # UPDATE
│   └── (기존 유틸: fs-utils, io, memory, paths, status, ui, etc.) # KEEP
│
├── scripts/
│   ├── handlers/                      # NEW directory (hook handlers 이동)
│   │   ├── session-start.js           # MOVE from hooks/
│   │   ├── session-end.js             # RENAME from stop-handler.js
│   │   ├── bash-guard.js              # MOVE from scripts/
│   │   ├── doc-tracker.js             # MOVE from scripts/
│   │   ├── cp-tracker.js              # MOVE from scripts/
│   │   ├── agent-start.js             # MOVE from scripts/
│   │   └── agent-stop.js              # MOVE + REWRITE from scripts/
│   ├── hooks/                         # NEW: hook adapter
│   │   └── hook-adapter.js            # NEW
│   └── (기존 스크립트: auditors/, etc.) # KEEP
│
├── skills/vais/
│   ├── SKILL.md                       # UPDATE
│   ├── phases/
│   │   ├── ceo.md                     # REWRITE (scenario routing)
│   │   ├── cpo.md                     # UPDATE
│   │   ├── cto.md                     # UPDATE
│   │   ├── cso.md                     # UPDATE
│   │   ├── cbo.md                     # NEW
│   │   ├── coo.md                     # UPDATE
│   │   └── (individual phases)        # UPDATE
│   └── utils/                         # KEEP
│
├── hooks/
│   ├── hooks.json                     # REWRITE
│   └── events.json                    # UPDATE
│
├── templates/                         # UPDATE (add cbo templates)
├── tests/                             # ADD new tests
├── vais.config.json                   # REWRITE
├── CLAUDE.md                          # REWRITE
├── AGENTS.md                          # REWRITE
└── package.json                       # UPDATE version
```

---

## 8. Test Plan

### 8.1 Unit Tests

| Test File | Coverage |
|-----------|----------|
| `tests/agent-registry.test.js` | Discovery, validation, getSubAgents, getByLayer |
| `tests/scenario-router.test.js` | detect, getFlow, nextRole for S-1~S-10 |
| `tests/event-bus.test.js` | emit, on, persist, history |
| `tests/state-machine.test.js` | transition, transitionRole, canTransition |
| `tests/verification-pipeline.test.js` | 4-stage pipeline, pass/fail scenarios |
| `tests/migration-engine.test.js` | v0.49→v0.50, rollback, backup |

### 8.2 Integration Tests

| Scenario | Test |
|----------|------|
| S-1 | CEO → CBO → CPO → CTO → CSO → CBO → COO full flow |
| S-2 | Feature addition flow (most common) |
| S-9 | Skill creation (internal enhancement) |
| Migration | v0.49 state file → v0.50 conversion |

---

## 9. Dependency Map

```
                  ┌──────────────┐
                  │  EventBus    │
                  └──┬───┬───┬──┘
                     │   │   │
         ┌───────────┘   │   └───────────┐
         │               │               │
    ┌────▼────┐   ┌──────▼──────┐   ┌────▼────┐
    │Registry │   │StateMachine │   │Observ.  │
    └────┬────┘   └──────┬──────┘   └─────────┘
         │               │
    ┌────▼────┐   ┌──────▼──────┐
    │Scenario │   │Verification │
    │ Router  │   │ Pipeline    │
    └─────────┘   └─────────────┘
```

**빌드 순서** (의존성 기반):
1. `lib/events/event-bus.js` + `event-types.js` (의존성 없음)
2. `lib/registry/agent-registry.js` + `frontmatter-parser.js` (EventBus 사용)
3. `lib/core/state-machine.js` (EventBus 사용)
4. `lib/core/migration-engine.js` (StateMachine 사용)
5. `lib/router/scenario-router.js` + `scenarios.json` (Registry 사용)
6. `lib/quality/verification-pipeline.js` (Registry + EventBus 사용)
7. `scripts/handlers/*` (모든 모듈 사용)
8. Agent markdown files (Registry가 읽음)
9. Skills & Phase routers (Router가 처리)
10. Config & Documentation (최종)

---

## 10. Existing Code Integration Notes

기존 harness 코드 분석 결과, v0.50에서 보존/확장해야 할 핵심 패턴:

### 10.1 Preserve (유지)

| Pattern | Current Location | Note |
|---------|-----------------|------|
| Lazy Loading | 모든 lib/ 모듈 | 의존성 getter 패턴 유지 |
| Atomic Persistence | `state-store.js` (tmp+rename + O_EXCL lock) | EventBus가 이 패턴을 그대로 사용 |
| Guard + Action FSM | `state-machine.js` (14 transition rules) | StateMachine rewrite 시 동일 패턴 |
| Graceful Degradation | 모든 hook scripts (exit 0) | handler/ 이동 후에도 유지 |
| SHA-256 Checkpoint | `checkpoint-manager.js` | VerificationPipeline Stage 2에서 활용 |
| 5-Level Automation | `automation-controller.js` (L0-L4) | 그대로 유지, EventBus 이벤트와 연동 |
| 6-Component Trust | `trust-engine.js` | 그대로 유지, role_transition 이벤트 추가 연동 |
| @refactor markers | 모든 agent .md 파일 | 에이전트 콘텐츠의 섹션 추출용, 유지 |

### 10.2 Extend (확장)

| Current | v0.50 Extension |
|---------|-----------------|
| `PIPELINE_ROLES: ['cpo','cto','cso','cmo','coo','cfo']` | `['cbo','cpo','cto','cso','coo']` + Scenario Router가 동적 결정 |
| `VALID_ROLES` 하드코딩 (agent-start.js) | AgentRegistry.discover()로 자동 감지 |
| `events.json` 8개 이벤트 타입 | EventBus EVENT_TYPES 16개로 확장 |
| `gate-manager.js` phase gates only | + VerificationPipeline 4단계 + CSO Final Gate |
| `migration.js` v2→v3 only | MigrationEngine with v0.49→v0.50 transform chains |
| Agent frontmatter (name, model, tools, memory) | + cLevel, inputs, outputs, scenarios, scope 필드 |

### 10.3 Replace (교체)

| Current | v0.50 Replacement | Reason |
|---------|-------------------|--------|
| `getNextPipelineRole()` (deprecated) | ScenarioRouter.nextRole() | CEO 동적 라우팅으로 전환 |
| 7개 hook scripts 분산 | `scripts/handlers/` 통합 디렉토리 | 일관성 + EventBus 연동 |
| 수동 agent 등록 (VALID_ROLES) | AgentRegistry.discover() | 파일시스템 자동 발견 |

### 10.4 Key State Files (호환 유지)

| File | v0.49 | v0.50 | Migration |
|------|-------|-------|-----------|
| `.vais/status.json` | v3 schema | v4 (+ scenario, rolePhases 확장) | auto-migrate |
| `.vais/control-state.json` | 그대로 | 그대로 | 불필요 |
| `.vais/trust-profile.json` | 그대로 | + role_transition 이벤트 연동 | 불필요 |
| `.vais/checkpoints/` | 그대로 | 그대로 | 불필요 |
| `.vais/event-log.jsonl` | 8 types | 16 types | append-only, 호환 |
| `.vais/gate-results.json` | 그대로 | + verification pipeline results | 확장 |

---

## 11. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| 70+ 파일 변경 회귀 | 기존 테스트 먼저 통과 확인 후 시작. 각 모듈별 테스트 작성 후 구현 |
| EventBus 도입으로 디버깅 어려움 | event-log.jsonl에 모든 이벤트 기록. debug 모드에서 이벤트 콘솔 출력 |
| Agent Discovery 실패 | fallback으로 vais.config.json의 하드코딩 목록 사용 |
| v0.49 마이그레이션 데이터 손실 | 마이그레이션 전 자동 백업. 롤백 경로 제공 |
| Scenario 오분류 | confidence 임계값(0.7) 미만이면 사용자에게 확인. CEO가 최종 결정 |
| state-store.js lock 경합 | 기존 O_EXCL + stale lock 감지 패턴 유지. EventBus는 non-blocking append |
| 기존 automation/trust 시스템 단절 | EventBus에 연결만 추가, 기존 API는 그대로 유지 |

---

## 12. Implementation Guide

### 12.1 Module Map

| Module | ID | Files | Dependency |
|--------|----|-------|------------|
| Event System | M-1 | 2 | None |
| Agent Registry | M-2 | 2 | M-1 |
| State Machine | M-3 | 2 | M-1 |
| Migration Engine | M-4 | 1 | M-3 |
| Scenario Router | M-5 | 2 | M-2 |
| **Checkpoint System** | **M-6** | **4** | **M-1, M-3** |
| Verification Pipeline | M-7 | 2 | M-1, M-2, M-6 |
| Hook Handlers | M-8 | 7 | M-1, M-2, M-3, M-6, M-7 |
| Agent Files (CBO) | M-9 | 11 | M-2, M-6 |
| Agent Files (Updates) | M-10 | 10 | M-2, M-6 |
| Skill & Phase Routers | M-11 | 8 | M-5, M-6 |
| Config & Docs | M-12 | 8 | All |
| Tests | M-13 | 7+ | All |

### 12.2 Recommended Session Plan

| Session | Modules | Est. Files | Description |
|---------|---------|-----------|-------------|
| **Session 1** | M-1, M-2 | ~5 | Event Bus + Agent Registry (핵심 기반) |
| **Session 2** | M-3, M-4 | ~4 | State Machine + Migration Engine |
| **Session 3** | M-5, M-6 | ~6 | Scenario Router + **Checkpoint System** |
| **Session 4** | M-7, M-8 | ~9 | Verification Pipeline + Hook Handlers |
| **Session 5** | M-9 | ~11 | CBO 에이전트 전체 생성 |
| **Session 6** | M-10 | ~10 | CEO/CPO/CTO/CSO/COO 에이전트 업데이트 |
| **Session 7** | M-11 | ~8 | Skill & Phase Router 개편 |
| **Session 8** | M-12, M-13 | ~15 | Config, Docs, Tests |

### 12.3 Session Guide

```
/pdca do v050-full-overhaul --scope M-1,M-2    # Session 1: Event + Registry
/pdca do v050-full-overhaul --scope M-3,M-4    # Session 2: State + Migration
/pdca do v050-full-overhaul --scope M-5,M-6    # Session 3: Router + Checkpoint System
/pdca do v050-full-overhaul --scope M-7,M-8    # Session 4: Verification + Hook Handlers
/pdca do v050-full-overhaul --scope M-9        # Session 5: CBO Agents
/pdca do v050-full-overhaul --scope M-10       # Session 6: Agent Updates
/pdca do v050-full-overhaul --scope M-11       # Session 7: Skills & Routers
/pdca do v050-full-overhaul --scope M-12,M-13  # Session 8: Config & Tests
```

---

## 13. User Interaction System (핵심 UX 완전판)

**vais-code의 정체성 = 실행 중 멈추고 사용자에게 선택권**. 이 섹션은 상호작용 패턴을 완전히 형식화한다.

### 13.1 AskUserQuestion 강제 (ZERO TOLERANCE)

모든 에이전트는 선택이 필요한 모든 지점에서 **AskUserQuestion 도구 호출 의무**. 텍스트 A/B/C/D 선택지는 시스템 위반으로 간주.

#### 절대 금지 사항
- ❌ 응답 본문에 A. / B. / C. / D. 형식의 텍스트 선택지 출력
- ❌ "선택해주세요", "결정해주세요", "진행할까요", "어떻게 진행"을 AskUserQuestion 없이 사용
- ❌ CEO 추천 blurb 뒤에 텍스트 선택지 → 반드시 AskUserQuestion로 전환
- ❌ "이 명령을 입력해주세요: `/vais ...`" 안내 → 선택 후 즉시 자동 실행해야 함

#### Self-Check 정규식 (송신 전 자동 검사)

`lib/checkpoint/self-check.js`에서 송신 직전 응답 텍스트를 스캔:

```javascript
const VIOLATION_PATTERNS = [
  /^[A-D]\.\s/m,                                  // Line starts with A./B./C./D.
  /(선택해주세요|결정해주세요|진행할까요|어떻게 진행)/,
  /다음 단계 선택지/,
  /📍.*CEO.*추천.*다음 단계[\s\S]*?^[A-D]\./m,   // Outro with text choices
];

function checkBeforeSend(responseText, context) {
  for (const pattern of VIOLATION_PATTERNS) {
    if (pattern.test(responseText) && !context.askUserQuestionCalled) {
      throw new SelfCheckViolation({
        pattern: pattern.source,
        remedy: 'Call AskUserQuestion tool before responding'
      });
    }
  }
}
```

#### User Selection = Immediate Auto-Execution

사용자의 AskUserQuestion 응답 = **명시적 승인**. 즉시 해당 작업 실행. "명령을 입력하세요" 안내 금지.

```
User: "실행" 선택
  ↓
System: 즉시 /vais cto plan user-auth 실행 (별도 명령 입력 불필요)
```

### 13.2 30개+ Checkpoint Registry (확장판)

§3.6의 CheckpointRegistry를 전체 C-Level 범위로 확장. 각 CP는 7가지 필드로 정의:

**CP Definition Schema**
```typescript
interface CheckpointDef {
  id: string;                    // "CP-1", "CP-0", "CP-G1" 등
  name: string;
  scope: CLevel | 'all';        // 어떤 C-Level에서 발생
  phase: Phase | 'any';         // 어떤 phase에서
  trigger: string;              // 발생 조건 (예: "plan_complete", "prd_missing")
  mandatory: boolean;           // automationLevel에 관계없이 필수 여부
  question: string;             // AskUserQuestion question
  options: Option[];            // 선택지 (각 옵션에 action 포함)
  outputPre: string[];          // 질문 전 반드시 출력해야 하는 내용
  escalation: { timeoutMs: number; defaultAction: string };
}
```

**CP 전체 목록 (v0.50 기준, 30+ 개)**

| Category | CP ID | C-Level | Phase | Trigger | Mandatory |
|----------|-------|---------|-------|---------|-----------|
| **Universal** | CP-1 | all | plan | plan_complete (scope selection) | Yes |
| | CP-2 | all | do | do_start (agent execution approval) | Yes |
| | CP-Q | all | qa | check_complete (review decision) | Yes |
| | CP-D (Destructive) | all | any | blast_radius=high | Yes |
| | CP-E (Emergency) | all | any | emergency_stop_triggered | Yes |
| **CEO** | CP-R | ceo | any | routing_decision | Yes |
| | CP-A | ceo | any | absorb_map_complete | Yes |
| | CP-L1 | ceo | plan | launch_scope_selection | Yes |
| | CP-L2 | ceo | any | clevel_complete (next routing) | Yes |
| | CP-L3 | ceo | report | final_review_complete | Yes |
| | CP-S (Scenario) | ceo | any | scenario_confidence < 0.7 | Conditional |
| **CPO** | CP-P | cpo | do | prd_draft_complete | Yes |
| **CTO** | CP-0 | cto | plan | prd_missing_or_partial | Yes (gate) |
| | CP-D (Design) | cto | design | design_options_ready | Yes |
| | CP-G1 | cto | plan | plan_gate_check | Yes |
| | CP-G2 | cto | design | design_gate_check (Interface Contract) | Yes |
| | CP-G3 | cto | design | architect_gate_check | Yes |
| | CP-G4 | cto | do | do_gate_check | Yes |
| **CSO** | CP-C | cso | qa | critical_vulnerability_found | Yes |
| | CP-GateA/B/C | cso | plan | gate_selection | Yes |
| **CBO** | CP-M | cbo | plan | market_analysis_scope | Yes |
| | CP-F | cbo | do | financial_model_review | Yes |
| | CP-S (SEO) | cbo | design | seo_strategy_confirm | Yes |
| | CP-GTM | cbo | design | gtm_motion_selection | Yes |
| **COO** | CP-Deploy | coo | do | deployment_strategy | Yes |
| | CP-Runbook | coo | design | runbook_approval | Yes |
| **Loop** | CP-L (CSO↔CTO) | cso, cto | qa | iteration > 1 | Yes |
| | CP-Incident | cto | any | incident_responder_trigger | Yes |

### 13.3 3 Universal Checkpoint Patterns

모든 C-Level이 공통으로 따르는 상호작용 시점:

#### Pattern 1: Phase Confirmation (진입 시)
```
사용자 호출: /vais cto {feature}
  ↓
System: .vais/status.json 읽음 → 다음 미완료 mandatory phase 감지
  ↓
Output: 요약 (2-3줄)
  "user-auth의 다음 단계는 [design]입니다. (plan 완료, design 미완료)"
  ↓
AskUserQuestion:
  Q: "다음 단계는 [design]입니다. 실행할까요?"
  A: 실행 / 다른 단계 선택 / 중단
  ↓
User 선택 → 즉시 해당 phase 실행
```

#### Pattern 2: Completion Outro (종료 시)
```
Phase 완료 → 산출물 저장
  ↓
Output (정확히 이 형식):
  ✅ **{action} 완료** — {feature}
  📌 **이번 작업 요약**
  - {3줄 이내 요약}

  📍 **CEO 추천 — 다음 단계**
  📊 완료: {C-Levels} | 미실행: {C-Levels}
  💡 추천: **{next C-Level}** — {1줄 이유}
  ↓
AskUserQuestion:
  Q: "다음 단계를 선택해주세요. (추천: {C-Level})"
  A: {추천 C-Level} 진행 / 다른 C-Level 선택 / 현재 C-Level 다음 phase / 종료
  ↓
User 선택 → 즉시 자동 실행
```

#### Pattern 3: Checkpoint (중간 결정)
```
C-Level 내부에서 결정 필요 지점
  ↓
Output (table OUTSIDE fence code block):
  | Option | 설명 | Trade-off |
  | A | ... | ... |
  | B | ... | ... |
  ↓
AskUserQuestion:
  Q: {CP-specific question}
  A: {explicit trade-off labels}
  ↓
User 선택 → 해당 경로로 즉시 분기
```

### 13.4 Status-Based Auto-Resumption

`.vais/status.json`을 스캔하여 사용자가 phase 미지정 시 자동 재개:

```javascript
// lib/pdca/resume-detector.js
function detectResumePoint(feature) {
  const status = readStatus(feature);
  const MANDATORY = ['plan', 'design', 'do', 'qa'];

  // 첫 미완료 mandatory phase 반환
  for (const phase of MANDATORY) {
    if (!status[feature]?.[phase]?.completed) {
      return { phase, reason: `${phase} 미완료` };
    }
  }

  // 전체 mandatory 완료면 report 제안
  return { phase: 'report', reason: 'all mandatory done' };
}
```

### 13.5 Mandatory Table Rendering (F8 Rule)

모든 CP 테이블은 **fence code block 밖**에 마크다운 테이블로 렌더링 (Claude Code UI 렌더링 정상 동작 보장).

```markdown
❌ 금지:
```markdown
| CP | ... |
|---|---|
```

✅ 올바른 방식:
| CP | ... |
|---|---|
```

VerificationPipeline이 에이전트 출력을 파싱하여 fence 안의 테이블 감지 시 warning.

### 13.6 F9 Rule: CP = Summary + Tool Call

각 Checkpoint는 **반드시 두 가지를 함께 수행**:
1. 응답 텍스트에 요약+선택지 출력 (사용자가 배경 이해)
2. AskUserQuestion 도구 실제 호출

둘 중 하나만 하면 violation. VerificationPipeline Stage 2가 감지.

---

## 14. C-Level Mandatory Rules Registry

§3.6.1 CheckpointRegistry의 확장. 각 C-Level의 **"반드시 해라" 규칙**을 중앙 집중 YAML 레지스트리로 형식화.

### 14.1 Registry 구조 (`lib/rules/registry.json`)

```json
{
  "universal": {
    "single_phase_execution": {
      "priority": 100,
      "description": "한 번에 하나의 phase만 실행. plan→design 자동 체이닝 금지",
      "enforcement": "VerificationPipeline Stage 3 (Gate Manager)",
      "violation": "BLOCK"
    },
    "plan_scope_limit": {
      "priority": 100,
      "description": "Plan phase는 docs/01-plan/ 외 파일 Write/Edit 금지",
      "enforcement": "PreToolUse hook (bash-guard + write-guard)",
      "violation": "BLOCK"
    },
    "mandatory_document": {
      "priority": 100,
      "description": "Phase 종료 시 해당 phase 문서 필수. 대화 합의만으로 문서 생략 불가",
      "enforcement": "SubagentStop hook (exit 1 if missing)",
      "violation": "BLOCK"
    },
    "ask_user_question_enforcement": {
      "priority": 100,
      "description": "모든 선택 지점에서 AskUserQuestion 도구 호출 필수",
      "enforcement": "CheckpointEnforcer + Self-Check pre-send",
      "violation": "BLOCK"
    },
    "push_rule": {
      "priority": 95,
      "description": "git push는 /vais commit 워크플로우 경유 (직접 금지)",
      "enforcement": "bash-guard.js disallowedTools",
      "violation": "BLOCK"
    },
    "execution_agent_encapsulation": {
      "priority": 90,
      "description": "실행 에이전트(backend-engineer 등) 직접 호출 금지, C-Level 경유 필수",
      "enforcement": "AgentRegistry.validateCaller()",
      "violation": "WARN"
    }
  },
  "cto": {
    "prd_gate_cp0": {
      "trigger": "plan_entry_without_prd",
      "config_key": "gates.cto.plan.requirePrd",
      "values": ["ask", "strict", "skip"],
      "enforcement": "CheckpointRegistry CP-0"
    },
    "four_gates_g1_g4": {
      "trigger": "phase_complete",
      "checklist": {
        "G1": ["feature_registry", "data_model", "tech_stack", "yagni"],
        "G2": ["component_specs", "design_tokens", "nav_flow", "state_matrix", "interface_contract"],
        "G3": ["db_schema_matches", "migration_files", "env_template", "build_success"],
        "G4": ["build_success", "interface_contract_used", "feature_registry_updated"]
      }
    },
    "incident_responder_auto_call": {
      "conditions": [
        "qa_fix_failure_2nd_time",
        "build_fail_unknown_cause",
        "cso_issue_unresolved_1_iteration",
        "user_requests_debug"
      ]
    },
    "modification_routing_matrix": {
      "ui_layout": "ui-designer:frontend-engineer",
      "style_only": "frontend-engineer",
      "feature_logic": "plan:ui-designer:frontend-engineer+backend-engineer",
      "policy": "plan:frontend-engineer+backend-engineer",
      "data_structure": "plan:infra-architect:backend-engineer",
      "full_flow": "plan:ui-designer:infra-architect:frontend-engineer+backend-engineer:qa-engineer",
      "bug_error": "incident-responder",
      "test_add_modify": "test-engineer",
      "db_optimization": "db-architect",
      "cicd_setup": "release-engineer (via COO)"
    }
  },
  "cso": {
    "three_gates_abc": {
      "a_owasp": {"agent": "security-auditor", "pass": "owasp_8_of_10 AND critical == 0"},
      "b_plugin": {"branch": "plugin-validator | skill-validator", "pass": "required_all_pass"},
      "c_code_review": {"agent": "code-reviewer", "pass": "quality >= 80 AND critical == 0"}
    },
    "gate_b_branching_rule": {
      "full_plugin": "plugin-validator",
      "single_agent_or_skill": "skill-validator",
      "unclear": "CP-2 AskUserQuestion"
    },
    "critical_blocking_cp_c": {
      "trigger": "critical_vulnerability_count > 0",
      "mandatory": true,
      "options": ["block_and_fix", "conditional_proceed", "developer_judgment"]
    },
    "compliance_checklist": {
      "privacy": ["data_purpose", "legal_basis", "third_party_sharing", "retention", "user_rights", "cookie_consent", "international_transfer", "coppa", "dpo_contact", "ccpa_optout"],
      "nda": ["scope", "duration", "exceptions", "remedies", "jurisdiction"],
      "tos": ["service_scope", "limitation", "change_notice", "dispute_resolution", "ip_ownership", "account_termination"]
    }
  },
  "cso_cto_loop": {
    "max_iterations": 3,
    "escalation_to_incident_responder_on": "2nd_iteration_fail",
    "final_escalation_to_ceo_on": "3rd_iteration_fail"
  },
  "cpo": {
    "sub_agent_sequence": "product-discoverer → (product-strategist + product-researcher parallel) → prd-writer",
    "prd_8_sections_required": true
  },
  "ceo": {
    "absorb_mode": {
      "triggers": ["흡수", "absorb", "references/_inbox/"],
      "sub_agent": "absorb-analyzer",
      "actions": ["absorb", "absorb-mcp", "merge", "reject"],
      "ledger_path": "docs/absorption-ledger.jsonl"
    },
    "dynamic_routing": {
      "no_hardcoded_sequence": true,
      "dependencies_guidance": {"cso": "cto", "coo": "cto", "cbo_finance": "cto", "cmo": "cpo"},
      "mandatory_pdca_per_clevel": true
    },
    "skill_creation_mode": {
      "sub_agent": "skill-creator",
      "output_to": "agents/ or skills/"
    }
  },
  "cbo": {
    "marketing_branch": {
      "seo_scoring_threshold": 80,
      "gtm_framework": ["Beachhead", "ICP_3_axes", "Disqualification_Criteria", "North_Star_Metric", "Growth_Loops", "Positioning_Moore"]
    },
    "finance_branch": {
      "unit_economics": {"cac_ltv_ratio": ">=3", "payback_months": "<=12", "nrr": ">=100%"},
      "pricing_frameworks": ["value_based", "cost_plus", "competitive", "freemium"]
    }
  },
  "coo": {
    "cicd_pipeline_stages": ["lint", "test", "build", "security_scan", "deploy"],
    "monitoring_thresholds": {
      "error_rate_critical": ">1%",
      "p99_latency_warning": ">3s",
      "availability_critical": "<99.9%"
    }
  }
}
```

### 14.2 Rule Enforcer (`lib/rules/enforcer.js`)

```javascript
class RuleEnforcer {
  constructor(registry, eventBus) {}

  // 에이전트 실행 전 규칙 체크
  async preflightCheck(agent, phase, feature, context)  // → PreflightResult

  // 에이전트 실행 후 규칙 체크
  async postCheck(agent, phase, feature, output)  // → PostCheckResult

  // 특정 규칙 위반 여부
  checkRule(ruleId, context)  // → Violation | null

  // 모든 universal 규칙 검증
  checkUniversalRules(context)  // → Violation[]
}

// Violation 구조
{
  ruleId: 'plan_scope_limit',
  severity: 'block' | 'warn' | 'info',
  message: 'Write attempted to src/index.js during plan phase',
  remedy: 'Plan phase 종료 후 Do phase에서 실행',
  eventEmitted: 'rule_violation'
}
```

### 14.3 @refactor Marker Preservation

기존 에이전트 .md 파일의 `<!-- @refactor:begin {section} -->` 마커 패턴 유지. 각 C-Level 에이전트는 다음 섹션을 @refactor로 마킹:

| Section ID | 내용 |
|-----------|------|
| `common-rules` | Single phase + mandatory docs + AskUserQuestion |
| `checkpoint-rules` | CP 테이블 |
| `contract` | Input / Output / State |
| `context-load` | L1-L4 hierarchy |
| `doc-checklist` | Phase별 필수 문서 |
| `handoff` | 다음 C-Level로 핸드오프 프로토콜 |
| `work-rules` | 실행 원칙 |

`scripts/refactor-extract.js` (신규) 가 이 마커들을 파싱하여 중앙 레지스트리와 동기화.

---

## 15. Bkit Pattern Integration (bkit 장점 통합)

bkit v2.1.4의 검증된 패턴 10개를 vais-code v0.50에 통합.

### 15.1 Context Anchor (bkit §1) — 이미 반영됨

**상태**: §3.2 (Scenario Router), §3.5 (Verification Pipeline)에 이미 포함. 보강:

- `lib/context/anchor-extractor.js` (신규): Plan 문서의 Executive Summary / Requirements / Risk에서 WHY/WHO/RISK/SUCCESS/SCOPE 5요소 자동 추출
- **전파**: Plan → Design → Do → Analysis → Report 전체 phase에 주입
- **저장**: `.vais/context-anchors/{feature}.md`

### 15.2 Decision Record Chain (bkit §2) — **신규 통합**

`lib/audit/decision-tracer.js` 신규 작성. 각 PDCA phase에서 중요 결정을 JSONL로 기록.

```javascript
class DecisionTracer {
  constructor(eventBus) {}

  async record(decision)  // → void (appends to .vais/decisions/{feature}.jsonl)
  async getChain(feature)  // → DecisionRecord[]
  async displayChain(feature)  // → formatted table
}

// DecisionRecord
{
  id: 'dec-20260414-103000',
  timestamp: '...',
  feature: 'user-auth',
  cLevel: 'cto',
  phase: 'design',
  type: 'architecture_choice',
  choice: 'Option B — Clean Architecture',
  rationale: '...',
  alternatives: ['Option A', 'Option C'],
  rejectedBecause: { 'Option A': 'tech debt', 'Option C': 'not flexible enough' }
}
```

**15가지 Decision Type**:
phase_advance, architecture_choice, automation_escalation, scope_change, dependency_resolution, gate_bypass, scenario_rerouting, agent_substitution, iteration_decision, rollback_triggered, incident_escalation, compliance_waiver, budget_override, launch_scope, absorb_action

**Analysis 단계 통합**: Analysis에서 Decision Record Verification 수행 — Design 결정이 실제 코드에 반영되었는지 검증.

### 15.3 Success Criteria Tracking (bkit §3) — **신규 통합**

Plan 문서에 Success Criteria 5-8개 명시 → Do 단계에서 코드 주석으로 연결 → Analysis에서 증거와 함께 검증.

**구현**:
- `lib/sc/tracker.js` 신규 — SC 추출/검증/평가
- Plan 템플릿에 `## Success Criteria` 섹션 강제 (VerificationPipeline Stage 1)
- Do 단계: 코드 주석 `// Plan SC: {criterion}` 지원
- Analysis: `.vais/analysis/{feature}-sc-verification.md` 에 checkbox + 증거
- Report: 각 SC에 ✅ Met / ⚠️ Partial / ❌ Not Met 상태 + 증거(file:line)

### 15.4 Gap Detector L1-L5 Runtime (bkit §4) — **신규 통합**

CSO의 기존 security gate + CTO QA를 넘어, 6축 정적 분석 + 5레벨 런타임 테스트.

**6 Static Axes**:
Structural (파일 존재), Functional (코드 깊이, placeholder 탐지), Contract (API 3-way match), Convention (명명), Architecture (계층 준수), Semantic (Success Criteria 커버리지)

**5 Runtime Levels**:
L1 API endpoints (curl), L2 UI actions (Playwright), L3 E2E (Playwright full journey), L4 Performance (benchmarks), L5 Security (penetration)

**구현**:
- `lib/analysis/gap-detector.js` — 6축 정적 분석
- `lib/qa/test-planner.js` — L1-L5 테스트 스펙 생성
- `lib/qa/test-runner.js` — 런타임 실행
- 관련 에이전트: qa-engineer (CTO), test-engineer (CTO) — 확장
- `cbo/marketing-analytics-analyst` → L4 성능 측정 관여 (채널 전환율)

**Match Rate Formula (v0.50)**:
```
Overall = (Structural × 0.15) + (Functional × 0.20) + (Contract × 0.20)
        + (Convention × 0.05) + (Architecture × 0.05)
        + (Semantic × 0.10) + (Runtime × 0.25)
```

### 15.5 PDCA Iterator Auto-Fix Loop (bkit §5) — **신규 통합**

Match Rate < 90%이면 자동 iterator 실행. 최대 5회.

**구현**:
- `agents/ceo/vais-iterator.md` (신규 CEO sub-agent) — Evaluator-Optimizer 패턴
- `lib/iteration/iterator.js` — 반복 관리
- 각 iteration마다 Gap List → Fix → re-Gap 사이클
- 시맨틱 수정 우선순위:
  - Intent: Plan SC 충족 코드 추가
  - Behavioral: try-catch, validation, error response 추가
  - UX: loading/error state 추가
- `.vais/iterations/{feature}-log.json` — before/after Match Rate 기록

**중단 조건**: matchRate >= 90% OR iterations >= 5

### 15.6 Session Guide / Module Map --scope (bkit §6) — **신규 통합**

§12에 이미 Module Map 개념이 있음. bkit 방식으로 완성:

**확장**:
- Design 문서의 `## 11. Implementation Guide` 분석하여 Module Map 자동 생성
- `.vais/session-guide/{feature}-modules.md` 저장
- `/vais do {feature} --scope M-1,M-3` 지원
- Do 단계 진입 시 Full Context Anchor + Decision Record 로드 (범위는 제한하되 전략적 맥락은 보존)
- Module 의존성 그래프 시각화

**CLI**:
```bash
/vais cto do user-auth --scope module-1,module-2
/vais cto do user-auth --scope-list    # 모듈 목록 보기
```

### 15.7 Design Anchor — UI Token Locking (bkit §7) — **신규 통합**

UI 관련 feature에 적용. Design phase에서 토큰 추출 → Do phase에서 락인.

**구현**:
- `/vais design-anchor capture {feature}` 신규 명령
- Figma MCP 또는 Pencil MCP에서 컨셉 페이지 1-2개 기반
- 추출: 색상, 타이포그래피, 간격, 브레이크포인트
- 저장: `.vais/design-anchors/{feature}-tokens.json` + `docs/02-design/styles/{feature}.design-anchor.md`
- Do phase: Design 문서에 `## Design Anchor` 섹션 자동 임베드
- QA phase: design-validator (신규 sub-agent 혹은 code-reviewer 확장)가 하드코딩된 값 감지

### 15.8 Executive Summary MANDATORY (bkit §8) — **신규 통합**

모든 phase(Plan/Design/Report) 문서 생성 직후 **응답에도 Executive Summary 테이블 즉시 출력**. 파일만 쓰고 끝 = 위반.

**구현**:
- VerificationPipeline Stage 1 (Document Validation) 강화: `## Executive Summary` 섹션 존재 + 4 perspectives 확인
- `lib/pdca/executive-summary.js` — 4-perspective 구조 생성
- Plan: Problem / Solution / Function-UX Effect / Core Value
- Report: Problem / Solution / Value Delivered / Lessons Learned
- 에이전트 템플릿에 "MANDATORY: 문서 작성 후 Executive Summary 테이블을 응답에도 출력" 명시

### 15.9 Archive & Cleanup Workflow (bkit §9) — **신규 통합**

Report 완료 후 feature 산출물 아카이브. `.vais/status.json` 경량화.

**구현**:
- `/vais archive {feature} [--summary]` 신규 명령
- 이동: `docs/0*-*/{role}_{feature}.*.md` → `docs/archive/YYYY-MM/{feature}/`
- `--summary`: status.json에 경량 요약 보존 (phase, matchRate, iterationCount, startedAt, archivedAt)
- `/vais cleanup [feature|all]` — 아카이브된 feature 상태 제거
- `/vais archive list` — 아카이브 목록 + 검색

**자동 트리거**: feature 수 > 50이면 자동 정리 제안 (enforceFeatureLimit)

### 15.10 Agent Teams + CTO-Led Orchestration (bkit §10) — **부분 통합**

v0.50 Scenario Router가 이미 동적 라우팅을 제공하므로, bkit의 Agent Teams는 "선택적 병렬 모드"로 통합.

**통합 방식**:
- `/vais pdca {feature} --team` — CTO-led 병렬 모드 시작 (기본은 single-session)
- Orchestration Pattern을 `lib/router/scenarios.json`에 추가:
  ```json
  "S-1": {
    "orchestration": {
      "cbo_1": "leader",
      "cpo": "leader",
      "cto": "swarm",
      "cso": "council",
      "cbo_2": "leader",
      "coo": "swarm"
    }
  }
  ```
- `lib/team/coordinator.js` (신규) — 병렬 에이전트 라이프사이클 관리
- `/vais team status` — 각 에이전트 task 상태
- `/vais team cleanup` — 팀 세션 종료

**Level 전략**:
- Starter: team 모드 비활성
- Dynamic: 3-teammate (CTO + frontend + backend + qa 중 3명)
- Enterprise: 5-teammate (+ architect + security)

---

## 16. CLAUDE.md 12 Mandatory Rules 통합

CLAUDE.md의 12개 Mandatory Rule이 v0.50 설계에 어떻게 반영되는지 매핑:

| # | Rule | v0.50 Enforcement |
|---|------|-------------------|
| 1 | 기획 없이 코드 금지 | CTO CP-0 PRD Gate + VerificationPipeline Stage 1 (plan doc 존재 확인) |
| 2 | 워크플로우 순서 준수 (5 phases) | StateMachine FSM + CheckpointRegistry + Status-Based Auto-Resumption |
| 3 | 산출물 경로 `docs/{번호}-{단계}/{role}_{feature}.{phase}.md` | vais.config.json workflow.docPaths (유지) |
| 4 | Gate 통과 필수 | VerificationPipeline Stage 3 (Gate Manager) + CTO G1-G4 + CSO Gate A/B/C |
| 5 | 위험 명령 금지 | bash-guard.js + blast-radius.js + CP-D (Destructive) |
| 6 | 환경 변수 | secret-scanner sub-agent (CSO) |
| 7 | 참조 투명성 (`// @see {URL}`) | conventions.referenceComment (유지), code-reviewer 검증 |
| 8 | C-Suite 호출 규칙 (실행 에이전트 직접 호출 금지) | RuleEnforcer.execution_agent_encapsulation + AgentRegistry.validateCaller() |
| 9 | 완전성 원칙 (Boil the Lake) | VerificationPipeline Stage 1 (min size 500 bytes) + SC coverage check |
| 10 | 탐색 우선 (Search Before Building) | Design phase Option A/B/C 생성 규칙 + absorb-analyzer (기존 솔루션 탐색) |
| 11 | 사용자 주권 | AskUserQuestion Enforcement + Checkpoint 30+ + F9 Rule |
| 12 | Plan은 결정, Do는 실행 | plan_scope_limit rule (PreToolUse hook이 plan phase 중 src/, agents/, skills/ Write 차단) |

**추가 Rule Registry 항목** — CLAUDE.md Do NOT 섹션도 반영:

```json
{
  "do_not": {
    "agents_md_merge": "AGENTS.md 를 삭제하거나 CLAUDE.md 와 병합 금지",
    "vendor_direct_edit": "vendor/ 내 파일 직접 수정 금지",
    "frontmatter_arbitrary_change": "에이전트 frontmatter 형식 임의 변경 금지",
    "config_structure_change": "vais.config.json 키 구조 사전 합의 없이 변경 금지"
  }
}
```

---

## 17. Feature Naming Convention (강제)

모든 feature 이름은 다음 규칙을 따라야 함 (vais.config.json `featureNameValidation`):

- **Format**: English kebab-case, 2-4 words, intent visible
- **Pattern**: `^[a-zA-Z0-9가-힣_-]+$`, maxLength 100
- **Good**: `social-login-integration`, `payment-retry-logic`, `dashboard-realtime-chart`
- **Bad**: `login`, `payment`, `chart` (의도 불명)

`scripts/handlers/prompt-handler.js`에서 feature 이름 파싱 시 즉시 검증, 위반 시 AskUserQuestion으로 재입력 요청.

---

## 18. Version Sync Enforcement

v0.50 관리 대상 5개 파일이 항상 동일 버전을 유지:

| File | Field |
|------|-------|
| `package.json` | version |
| `vais.config.json` | version |
| `.claude-plugin/plugin.json` | version |
| `.claude-plugin/marketplace.json` | metadata.version + plugins[0].version |
| `CHANGELOG.md` | Latest heading |

**Enforcement**:
- `scripts/version-check.js` (신규) — 모든 버전 일치 검증
- pre-commit hook에서 자동 실행
- `/vais commit` 워크플로우에서 mismatch 시 blocking

---

## 19. Updated Module Map (Final)

§12.1을 Bkit pattern 통합 반영하여 업데이트:

| Module | ID | Files | Dependency |
|--------|----|-------|------------|
| Event System | M-1 | 2 | None |
| Agent Registry | M-2 | 2 | M-1 |
| State Machine | M-3 | 2 | M-1 |
| Migration Engine | M-4 | 1 | M-3 |
| Scenario Router | M-5 | 2 | M-2 |
| **Checkpoint System + Registry** | **M-6** | **5** | **M-1, M-3** |
| **Rule Engine** | **M-7** | **2** | **M-6** |
| Verification Pipeline | M-8 | 3 | M-1, M-2, M-6, M-7 |
| **Decision Tracer** | **M-9** | **1** | **M-1** |
| **Success Criteria Tracker** | **M-10** | **1** | **M-1, M-9** |
| **Gap Detector + QA Runner** | **M-11** | **4** | **M-2, M-8, M-10** |
| **PDCA Iterator** | **M-12** | **2** | **M-11** |
| **Session Guide** | **M-13** | **1** | **M-2** |
| **Design Anchor** | **M-14** | **2** | **M-2** |
| **Archive System** | **M-15** | **2** | **M-3** |
| **Agent Teams Coordinator** | **M-16** | **2** | **M-2, M-5** |
| Hook Handlers | M-17 | 7 | M-1, M-2, M-3, M-6, M-7, M-8 |
| Agent Files (CBO) | M-18 | 11 | M-2, M-6, M-7 |
| Agent Files (Updates) | M-19 | 10 | M-2, M-6, M-7 |
| Skill & Phase Routers | M-20 | 8 | M-5, M-6 |
| Config & Docs | M-21 | 10 | All |
| Tests | M-22 | 10+ | All |

### 19.1 Updated Session Plan (12 Sessions)

| Session | Modules | Est. Files | Description |
|---------|---------|-----------|-------------|
| S1 | M-1, M-2 | ~5 | Event Bus + Agent Registry |
| S2 | M-3, M-4 | ~4 | State Machine + Migration |
| S3 | M-5, M-6 | ~7 | Scenario Router + Checkpoint System |
| S4 | M-7, M-8 | ~5 | Rule Engine + Verification Pipeline |
| S5 | M-9, M-10 | ~3 | Decision Tracer + SC Tracker |
| S6 | M-11, M-12 | ~6 | Gap Detector + PDCA Iterator |
| S7 | M-13, M-14, M-15, M-16 | ~8 | Session Guide + Design Anchor + Archive + Team |
| S8 | M-17 | ~7 | Hook Handlers (4-stage verification + self-check) |
| S9 | M-18 | ~11 | CBO Agents (all 11 with mandatory rules) |
| S10 | M-19 | ~10 | CEO/CPO/CTO/CSO/COO Agent Updates (CP tables + @refactor) |
| S11 | M-20 | ~8 | Skill & Phase Routers (AskUserQuestion enforcement) |
| S12 | M-21, M-22 | ~20 | Config + Docs + Tests |

---

## 20. Final Principles Summary

v0.50은 다음 5가지 최상위 원칙 위에 서 있음:

1. **User Sovereignty** — AI는 추천, 사용자가 결정 (AskUserQuestion zero tolerance)
2. **Boil the Lake** — 범위 내 완전 수행, 미루지 않기
3. **Search Before Building** — 기존 솔루션 탐색 우선 (absorb-analyzer, 3-option 생성)
4. **Plan is Decision, Do is Execution** — Plan phase 물리적 분리 (plan_scope_limit rule)
5. **CSO Final Gate** — 모든 코드 변경은 CSO 승인 필요 (Gate A/B/C + Critical CP-C)

이 5가지 원칙이 Checkpoint Registry, Rule Engine, Verification Pipeline, Scenario Router를 관통하여 일관된 시스템을 형성한다.
