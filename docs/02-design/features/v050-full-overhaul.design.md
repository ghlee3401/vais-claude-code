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

### 3.6 Migration Engine (`lib/core/migration-engine.js`)

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
| Verification Pipeline | M-6 | 2 | M-1, M-2 |
| Hook Handlers | M-7 | 7 | M-1, M-2, M-3, M-6 |
| Agent Files (CBO) | M-8 | 11 | M-2 |
| Agent Files (Updates) | M-9 | 10 | M-2 |
| Skill & Phase Routers | M-10 | 8 | M-5 |
| Config & Docs | M-11 | 8 | All |
| Tests | M-12 | 6+ | All |

### 12.2 Recommended Session Plan

| Session | Modules | Est. Files | Description |
|---------|---------|-----------|-------------|
| **Session 1** | M-1, M-2 | ~5 | Event Bus + Agent Registry (핵심 기반) |
| **Session 2** | M-3, M-4 | ~4 | State Machine + Migration Engine |
| **Session 3** | M-5, M-6 | ~5 | Scenario Router + Verification Pipeline |
| **Session 4** | M-7 | ~8 | Hook Handlers (기존 scripts 리팩토링) |
| **Session 5** | M-8 | ~11 | CBO 에이전트 전체 생성 |
| **Session 6** | M-9 | ~10 | CEO/CPO/CTO/CSO/COO 에이전트 업데이트 |
| **Session 7** | M-10 | ~8 | Skill & Phase Router 개편 |
| **Session 8** | M-11, M-12 | ~14 | Config, Docs, Tests |

### 12.3 Session Guide

```
/pdca do v050-full-overhaul --scope M-1,M-2   # Session 1: Event + Registry
/pdca do v050-full-overhaul --scope M-3,M-4   # Session 2: State + Migration
/pdca do v050-full-overhaul --scope M-5,M-6   # Session 3: Router + Verification
/pdca do v050-full-overhaul --scope M-7       # Session 4: Hook Handlers
/pdca do v050-full-overhaul --scope M-8       # Session 5: CBO Agents
/pdca do v050-full-overhaul --scope M-9       # Session 6: Agent Updates
/pdca do v050-full-overhaul --scope M-10      # Session 7: Skills & Routers
/pdca do v050-full-overhaul --scope M-11,M-12 # Session 8: Config & Tests
```
