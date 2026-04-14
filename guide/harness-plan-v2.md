# VAIS Code 하네스 시스템 개편 계획서

> **작성일**: 2026-04-13
> **대상 버전**: v0.49.2 → v0.50
> **방침**: 기존 골격(훅 시스템, FSM, PDCA 흐름) 유지, 내용은 완전 상세 + 코드 강제

---

## 현재 하네스 구조 (v0.49.2)

### 진입점 및 명령 형식

```
/vais {clevel} {phase} {feature}
  → skills/vais/SKILL.md (메인 스킬)
    → skills/vais/phases/{clevel}.md (C-Level별 라우터)
      → agents/{clevel}/{agent}.md (에이전트 프롬프트, phase 전달)

명령 형식:
  /vais cto plan my-feature          # CTO가 'plan' phase로 실행
  /vais ceo my-feature               # CEO가 phase 자동 판별
  /vais auto my-feature              # 완전 자동 모드 (CEO가 전체 자율)
  /vais cpo design data-platform     # CPO가 'design' phase로 실행

인자 파싱 규칙:
  - {clevel}: 'ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo', 또는 'auto'
  - {phase}: 'plan', 'design', 'do', 'qa', 'report' (선택사항)
  - {feature}: 피처명 (필수)
```

### 훅 시스템 (hooks.json)

| 이벤트 | 스크립트 | 역할 |
|--------|---------|------|
| SessionStart | session-start.js | 상태 표시, progress bar, workflow map, output style 주입 |
| PreToolUse(Bash) | bash-guard.js | 위험 명령 차단 (rm -rf, git push --force 등) |
| PostToolUse(Write\|Edit) | doc-tracker.js | 문서 작성 추적, 경로 → event-log.jsonl |
| PostToolUse(AskUserQuestion) | cp-tracker.js | 체크포인트(CP) 호출 추적, CP 스냅샷 저장 |
| SubagentStart | agent-start.js | 에이전트 시작 기록 (observability) |
| SubagentStop | agent-stop.js | **에이전트 종료 + 필수 문서 검증 + phase 전환 자동 기록 + 다음 단계 안내 강제** |
| Stop | stop-handler.js | 세션 종료 처리 |

### 핵심 라이브러리 (lib/)

| 모듈 | 파일 | 역할 |
|------|------|------|
| core | state-machine.js | 2-레벨 FSM: PIPELINE_ROLES + Phase FSM (plan→design→do→qa→report) |
| core | state-store.js | 상태 영속화 (.vais/status.json, memory.json) |
| core | migration.js | 상태 마이그레이션 (v0.49 → v0.50) |
| control | checkpoint-manager.js | SHA-256 체크포인트 + 롤백 관리 |
| control | loop-breaker.js | 무한 루프 방지 (순환 참조 탐지) |
| control | trust-engine.js | 자동화 레벨 제어 (manual/semi-auto/auto) |
| control | blast-radius.js | 변경 영향 범위 분석 (파일 수정 → 의존성 추적) |
| control | automation-controller.js | 자동 실행 제어 (trust level × 문서 동의) |
| pdca | feature-manager.js | 피처 생성/관리/마이그레이션 |
| pdca | automation.js | PDCA 자동화 (phase transition 트리거) |
| pdca | session-guide.js | 세션 가이드 (다음 단계 추천) |
| pdca | decision-record.js | 의사결정 기록 (ADR) |
| quality | gate-manager.js | Gate 판정 관리 (phase completion 판단) |
| quality | template-validator.js | 템플릿 검증 (산출물 스키마) |
| observability | event-logger.js | 이벤트 로깅 (.vais/event-log.jsonl) |
| observability | state-writer.js | 에이전트 상태 기록 (.vais/agent-state.json) |
| ui | progress-bar.js | 진행 상태 바 렌더링 |
| ui | workflow-map.js | 워크플로우 맵 렌더링 |

### 스크립트 (scripts/)

| 스크립트 | 역할 | 훅 지점 |
|---------|------|---------|
| session-start.js | 세션 초기화, 상태 표시 | SessionStart |
| bash-guard.js | Bash 위험 명령 차단 | PreToolUse(Bash) |
| doc-tracker.js | Write/Edit 작업 추적 | PostToolUse(Write\|Edit) |
| cp-tracker.js | AskUserQuestion 호출 추적 | PostToolUse(AskUserQuestion) |
| agent-start.js | 에이전트 시작 기록 (observability) | SubagentStart |
| agent-stop.js | 에이전트 종료 + 다중 검증 + 다음 단계 안내 | SubagentStop |
| stop-handler.js | 세션 종료 처리 | Stop |
| phase-transition.js | Phase 전환 기록 (agent-stop.js 내부 호출) | SubagentStop 내부 |
| gate-check.js | Phase completion gate 판정 | 에이전트 내부 또는 agent-stop.js |
| doc-validator.js | 필수 문서 검증 (phase별 산출물) | agent-stop.js 내부 |
| cp-guard.js | 체크포인트 일관성 검증 | agent-stop.js 내부 |
| prompt-handler.js | 프롬프트 처리 (인자 파싱) | SKILL.md 내부 |
| auto-judge.js | 자동화 판정 (trust level 기반) | 에이전트 내부 |
| get-context.js | 컨텍스트 수집 (기존 상태, 관련 문서) | 에이전트 내부 |
| generate-dashboard.js | 대시보드 생성 (요약 리포트) | 에이전트 내부 |
| bash-guard.js | Bash 명령 검증 (화이트리스트) | PreToolUse |
| seo-audit.js | SEO 감사 (CBO/seo-analyst) | 에이전트 내부 |
| refactor-audit.js | 리팩터 감사 (CTO/infra-architect) | 에이전트 내부 |

### 상태 파일 (.vais/)

| 파일 | 역할 | 스키마 |
|------|------|--------|
| status.json | 피처별 진행 상태 (phase, role, timestamps) | `{features: {[feature]: {phase, role, lastModified, completed}}}` |
| memory.json | 전략 결정 이력 | `{decisions: [{timestamp, role, feature, decision_text, rationale}]}` |
| event-log.jsonl | 이벤트 로그 (newline-delimited JSON) | `{timestamp, type, role, agent, phase, feature, details}` |
| agent-state.json | 에이전트 실행 상태 | `{agents: {[agent]: {startTime, endTime, status, outputLength}}}` |
| checkpoints/ | 체크포인트 스냅샷 (phase별) | `checkpoints/{feature}/{phase}.checkpoint.json` |
| resume/ | 에러 복구 데이터 | `resume/{feature}/resume-{timestamp}.json` |

### 코드 흐름 (진입 → 실행 → 종료)

```
1. 사용자: /vais cto plan my-feature
2. Claude Code → SKILL.md 로드
3. SKILL.md → prompt-handler.js: 인자 파싱
   - 파싱 결과: {clevel: 'cto', phase: 'plan', feature: 'my-feature'}
4. SKILL.md → state-store.js: 기존 상태 로드 (status.json)
   - 결과: {phase: 'plan', role: 'cto', timestamps: {...}}
5. SKILL.md → phases/cto.md 라우팅 (clevel, phase, feature 전달)
6. phases/cto.md → agents/cto/cto.md 에이전트 로드
   - phase 전달: plan-phase-only 모드로 진입
7. [SessionStart 훅] session-start.js 실행
   - 작업: 상태 표시, progress bar 렌더링, workflow map 출력
   - 상태 저장: .vais/agent-state.json 초기화
8. [SubagentStart 훅] agent-start.js 실행
   - 작업: agent='cto', phase='plan' 기록
   - 이벤트 로그: {type: 'agent_start', agent: 'cto', phase: 'plan'}
9. 에이전트 실행 중:
   - [PreToolUse] bash-guard.js → Bash 명령 검증 (화이트리스트)
   - [PostToolUse] doc-tracker.js → Write/Edit 경로 기록
   - [PostToolUse] cp-tracker.js → AskUserQuestion 호출 추적
10. 에이전트 종료:
    - [SubagentStop 훅] agent-stop.js 실행 (상세 로직은 섹션 6.3 참고)
      1) doc-validator.js: phase='plan' 산출물 존재 확인
      2) cp-guard.js: CP 스냅샷 일관성 검증
      3) phase-transition.js: phase 전환 기록
      4) session-guide.js: 다음 단계 안내 생성
      5) 강제 출력: 다음 phase 정보 + AskUserQuestion 필수 호출 알림
11. [Stop 훅] stop-handler.js 실행
    - 작업: 세션 종료 처리, 최종 이벤트 로그 기록
```

---

## 변경 계획 (v0.50)

### 1. C-Suite 구조 변경

| 항목 | v0.49.2 | v0.50 |
|------|---------|-------|
| C-Suite 역할 수 | 7 (CEO, CPO, CTO, CSO, CMO, COO, CFO) | 6 (CEO, CPO, CTO, CSO, CBO, COO) |
| PIPELINE_ROLES | `['cpo', 'cto', 'cso', 'cmo', 'coo', 'cfo']` | `['cbo', 'cpo', 'cto', 'cso', 'coo']` |
| CMO | 독립 에이전트 | CBO에 통합 |
| CFO | 독립 에이전트 | CBO에 통합 |
| CBO | 없음 | 신규 (CMO + CFO 역할 통합) |

### 2. 파일 변경 목록

#### 2.1 삭제 목록

| 파일 | 이유 |
|------|------|
| `agents/cmo/` (전체 디렉토리 + 서브에이전트) | CBO로 완전 통합 |
| `agents/cfo/` (전체 디렉토리 + 서브에이전트) | CBO로 완전 통합 |
| `skills/vais/phases/cmo.md` | CBO phase router로 대체 |
| `skills/vais/phases/cfo.md` | CBO phase router로 대체 |
| `agents/ceo/retrospective-writer.md` | 기능 폐기 |

#### 2.2 신규 생성 목록

**CBO 에이전트 (10개 신규)**

| 파일 | 설명 |
|------|------|
| `agents/cbo/cbo.md` | CBO C-Level 에이전트 메인 프롬프트 |
| `agents/cbo/market-researcher.md` | 시장 규모, 경쟁사 분석, SWOT |
| `agents/cbo/customer-segmentation-analyst.md` | RFM 분석, 페르소나 정의, TAM/SAM/SOM |
| `agents/cbo/marketing-analytics-analyst.md` | 마케팅 성과 분석 (CAC, ROAS, 귀속 모델) |
| `agents/cbo/financial-modeler.md` | 재무 모델 구축 (P&L, DCF, 시나리오) |
| `agents/cbo/unit-economics-analyst.md` | CAC/LTV/payback period, cohort analysis |
| `agents/cbo/seo-analyst.md` | SEO 콘텐츠 전략, 키워드 맵, 기술 SEO |
| `agents/cbo/copy-writer.md` | 마케팅 카피, 브랜드 메시징, 프로모션 |
| `agents/cbo/growth-analyst.md` | GTM 전략, 퍼널 최적화, 성장 가설 |
| `agents/cbo/finops-analyst.md` | 인프라 비용 최적화, CapEx/OpEx 분석 |
| `agents/cbo/pricing-analyst.md` | 가격책정 전략, 가격 탄력성, 수익 최적화 |

**기타 신규 에이전트**

| 파일 | 설명 |
|------|------|
| `agents/ceo/skill-creator.md` | 스킬 생성/수정 자동화 에이전트 |
| `agents/cpo/backlog-manager.md` | 백로그 관리, 스프린트 계획 에이전트 |
| `agents/cso/secret-scanner.md` | Bash 기반 시크릿 탐지 (regex, entropy) |
| `agents/cso/dependency-analyzer.md` | npm/pip/gem 의존성 취약점 분석 |

**신규 Phase Router**

| 파일 | 설명 |
|------|------|
| `skills/vais/phases/cbo.md` | CBO phase 라우터 (plan→design→do→qa→report) |

#### 2.3 수정 목록

| 파일 | 변경 내용 |
|------|----------|
| `vais.config.json` | cSuite.roles: cmo/cfo 제거, cbo 추가; autoKeywords 재설계; dependencies 업데이트 |
| `skills/vais/SKILL.md` | description에 CBO 반영, triggers 업데이트, CMO/CFO 참조 제거 |
| `lib/core/state-machine.js` | PIPELINE_ROLES: `['cbo', 'cpo', 'cto', 'cso', 'coo']` |
| `scripts/agent-start.js` | VALID_ROLES: cbo + 신규 에이전트 10개 추가 |
| `scripts/doc-validator.js` | CBO 산출물 패턴 추가 (market-analysis, financial-model 등) |
| `agents/ceo/ceo.md` | CBO 라우팅 조건 추가, skill-creator 서브에이전트 추가, retrospective 제거 |
| `agents/cpo/cpo.md` | backlog-manager 서브에이전트 연결 |
| `agents/cto/cto.md` | infra-architect 역할 재정의 (SDD 전담, DB 제외), release-engineer/performance-engineer 제거 |
| `agents/cso/cso.md` | secret-scanner, dependency-analyzer 서브에이전트 연결 |
| `agents/coo/coo.md` | release-engineer, performance-engineer 서브에이전트 추가 (CTO에서 이동) |
| `lib/core/migration.js` | 상태 마이그레이션 로직: cmo→cbo, cfo→cbo 매핑 |
| `hooks/events.json` | role_transition 이벤트 추가 |
| `templates/` | finance.template.md → CBO 통합 반영 |

---

## 3. 상세 구성 설정

### 3.1 vais.config.json 변경

```json
{
  "cSuite": {
    "ceo": {
      "required": true,
      "model": "opus",
      "layer": "executive",
      "agent": "agents/ceo/ceo.md",
      "subAgents": ["skill-creator"]
    },
    "cpo": {
      "required": false,
      "model": "opus",
      "layer": "product",
      "agent": "agents/cpo/cpo.md",
      "subAgents": ["backlog-manager"]
    },
    "cto": {
      "required": false,
      "model": "opus",
      "layer": "technology",
      "agent": "agents/cto/cto.md",
      "subAgents": []
    },
    "cso": {
      "required": false,
      "model": "opus",
      "layer": "security",
      "agent": "agents/cso/cso.md",
      "subAgents": ["secret-scanner", "dependency-analyzer"]
    },
    "cbo": {
      "required": false,
      "model": "opus",
      "layer": "business",
      "agent": "agents/cbo/cbo.md",
      "subAgents": [
        "seo-analyst", "copy-writer", "growth-analyst",
        "market-researcher", "customer-segmentation-analyst",
        "marketing-analytics-analyst",
        "finops-analyst", "pricing-analyst",
        "financial-modeler", "unit-economics-analyst"
      ]
    },
    "coo": {
      "required": false,
      "model": "opus",
      "layer": "operations",
      "agent": "agents/coo/coo.md",
      "subAgents": ["release-engineer", "performance-engineer"]
    }
  },
  
  "dependencies": {
    "cpo": ["cbo"],
    "cto": ["cpo"],
    "cso": ["cto"],
    "coo": ["cto"],
    "cbo": []
  },
  
  "autoKeywords": {
    "ceo": [
      "new product", "신규 서비스", "전략", "strategy",
      "launch", "런칭", "vision", "roadmap"
    ],
    "cpo": [
      "PRD", "기획", "요구사항", "기능 정의",
      "백로그", "user story", "acceptance criteria"
    ],
    "cto": [
      "architecture", "구현", "개발", "코딩",
      "API", "버그", "디버깅", "infrastructure",
      "database", "system design"
    ],
    "cso": [
      "security", "보안", "취약점", "인증",
      "감사", "GDPR", "시크릿", "encryption",
      "PII", "compliance"
    ],
    "cbo": [
      "marketing", "마케팅", "SEO", "가격",
      "비용", "ROI", "시장 분석", "경쟁사",
      "투자자", "재무", "revenue", "펀딩", "GTM",
      "CAC", "LTV", "funnel", "conversion"
    ],
    "coo": [
      "deploy", "배포", "CI/CD", "모니터링",
      "운영", "incident", "release", "operations",
      "uptime", "SLO"
    ]
  },

  "phases": {
    "plan": {
      "description": "요구사항 수집, 목표 정의, 범위 결정",
      "tools": ["doc-analyzer", "context-gatherer"],
      "outputs": ["REQUIREMENTS.md", "SCOPE.md", "TIMELINE.md"]
    },
    "design": {
      "description": "설계서 작성, 아키텍처 검증",
      "tools": ["diagram-generator", "design-validator"],
      "outputs": ["DESIGN_SPEC.md", "ARCHITECTURE.md"]
    },
    "do": {
      "description": "구현, 테스트, 검증",
      "tools": ["code-executor", "test-runner"],
      "outputs": ["IMPLEMENTATION.md", "TEST_RESULTS.md"]
    },
    "qa": {
      "description": "품질 검증, 문서 검토",
      "tools": ["qa-checker", "compliance-checker"],
      "outputs": ["QA_REPORT.md", "COMPLIANCE_REPORT.md"]
    },
    "report": {
      "description": "결과 정리, 회고, 후속 계획",
      "tools": ["report-generator", "retrospective"],
      "outputs": ["FINAL_REPORT.md", "RETROSPECTIVE.md"]
    }
  }
}
```

### 3.2 state-machine.js 변경

```javascript
// ===== v0.50 상태 머신 정의 =====

// PIPELINE_ROLES: CEO가 라우팅할 수 있는 C-Level 역할 목록
// 순서는 참조용이며, 실제 라우팅은 CEO 프롬프트에서 동적으로 결정
const PIPELINE_ROLES = ['cbo', 'cpo', 'cto', 'cso', 'coo'];

// PHASE_MACHINE: 각 role 내에서의 phase 전환 규칙
const PHASE_MACHINE = {
  'plan': {
    next: 'design',
    prerequisites: [],
    outputs: ['REQUIREMENTS.md', 'SCOPE.md', 'TIMELINE.md']
  },
  'design': {
    next: 'do',
    prerequisites: ['plan'],
    outputs: ['DESIGN_SPEC.md', 'ARCHITECTURE.md']
  },
  'do': {
    next: 'qa',
    prerequisites: ['design'],
    outputs: ['IMPLEMENTATION.md', 'TEST_RESULTS.md']
  },
  'qa': {
    next: 'report',
    prerequisites: ['do'],
    outputs: ['QA_REPORT.md', 'COMPLIANCE_REPORT.md']
  },
  'report': {
    next: null,
    prerequisites: ['qa'],
    outputs: ['FINAL_REPORT.md', 'RETROSPECTIVE.md']
  }
};

// 상태 전환 검증
function validatePhaseTransition(currentPhase, nextPhase, completedPhases) {
  if (!PHASE_MACHINE[currentPhase]) {
    throw new Error(`Invalid phase: ${currentPhase}`);
  }
  
  const phaseDef = PHASE_MACHINE[currentPhase];
  
  // 선결 조건 확인
  for (const prereq of phaseDef.prerequisites) {
    if (!completedPhases.includes(prereq)) {
      return {
        valid: false,
        reason: `Prerequisite phase '${prereq}' not completed`
      };
    }
  }
  
  // 다음 phase 확인
  if (phaseDef.next !== nextPhase) {
    return {
      valid: false,
      reason: `Invalid transition: ${currentPhase} → ${nextPhase}. Expected: ${phaseDef.next}`
    };
  }
  
  return { valid: true };
}

// 역할 전환 검증
function validateRoleTransition(fromRole, toRole, featureName) {
  // CEO 제외 (CEO는 모든 역할로 전환 가능)
  if (fromRole === 'ceo') {
    return PIPELINE_ROLES.includes(toRole) ? { valid: true } : 
           { valid: false, reason: `Invalid role: ${toRole}` };
  }
  
  // 의존성 확인 (config.json의 dependencies)
  const deps = require('../vais.config.json').dependencies[toRole] || [];
  const isValidDependency = deps.includes(fromRole) || deps.length === 0;
  
  return isValidDependency ?
    { valid: true } :
    { valid: false, reason: `Role dependency not met: ${toRole} depends on ${deps.join(', ')}` };
}

// Feature 상태 초기화
function initializeFeatureState(feature, startRole = 'ceo', startPhase = 'plan') {
  return {
    name: feature,
    currentRole: startRole,
    currentPhase: startPhase,
    completedPhases: [],
    completedRoles: [],
    timestamps: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    checkpoints: {},
    events: []
  };
}

// Export
module.exports = {
  PIPELINE_ROLES,
  PHASE_MACHINE,
  validatePhaseTransition,
  validateRoleTransition,
  initializeFeatureState
};
```

---

## 4. 하네스 강화 — 코드 강제 시행

현재 문제: 다음 단계 안내, 체크포인트 호출, phase 전환이 **에이전트 프롬프트(마크다운)에 텍스트로만 정의**되어 있어서 에이전트가 무시하거나 건너뛸 수 있음.

해결책: **훅 시스템 → agent-stop.js에서 다중 검증 + 강제 실행**

### 4.1 Phase 전환 자동 감지 (SubagentStop 훅)

**개념**: SubagentStop 훅이 phase completion gate를 판정한 후, 자동으로 phase-transition.js를 호출

**구현**: scripts/agent-stop.js

```javascript
// ===== agent-stop.js (v0.50 상세 구현) =====
const StateStore = require('../lib/core/state-store');
const DocValidator = require('../scripts/doc-validator');
const GateManager = require('../lib/quality/gate-manager');
const PhaseTransitioner = require('../scripts/phase-transition');
const EventLogger = require('../lib/observability/event-logger');
const SessionGuide = require('../lib/pdca/session-guide');

async function handleSubagentStop(context) {
  const { agent, phase, feature, toolCalls } = context;
  
  // 1. 상태 로드
  const state = StateStore.loadFeatureState(feature);
  const currentPhase = state.currentPhase;
  
  console.log(`[SubagentStop] Agent: ${agent}, Phase: ${currentPhase}, Feature: ${feature}`);
  
  // 2. 문서 검증 (현재 phase 산출물 확인)
  const docValidation = DocValidator.validate(feature, currentPhase);
  if (!docValidation.valid) {
    console.warn(`[SubagentStop] Document validation failed: ${docValidation.errors.join(', ')}`);
    // 경고만 출력하고 계속 진행 (에이전트가 수정할 기회)
  }
  
  // 3. CP 일관성 검증 (AskUserQuestion 호출 여부)
  const cpCheckpoints = checkpointManager.listCheckpointsForPhase(feature, currentPhase);
  if (cpCheckpoints.length === 0) {
    console.warn(`[SubagentStop] No checkpoints recorded. Agent may have skipped AskUserQuestion.`);
  }
  
  // 4. Phase completion gate 판정 (핵심 로직)
  const gateResult = GateManager.judgePhaseCompletion({
    feature,
    phase: currentPhase,
    documentsValid: docValidation.valid,
    checkpointsRecorded: cpCheckpoints.length > 0,
    toolCallCount: toolCalls.length
  });
  
  if (gateResult.pass) {
    // Phase 완료 → 자동 전환
    console.log(`[SubagentStop] Phase '${currentPhase}' passed gate. Proceeding to transition.`);
    
    // phase-transition.js 자동 호출
    const transitionResult = PhaseTransitioner.transitionToNextPhase(feature, currentPhase);
    
    if (transitionResult.success) {
      const newPhase = transitionResult.nextPhase;
      console.log(`[SubagentStop] Phase transition: ${currentPhase} → ${newPhase}`);
      
      // 이벤트 로그 기록
      EventLogger.log({
        timestamp: new Date().toISOString(),
        type: 'phase_transition_auto',
        feature,
        fromPhase: currentPhase,
        toPhase: newPhase,
        agent,
        reason: 'gate_passed'
      });
      
      // 다음 단계 안내 생성
      const nextGuidance = SessionGuide.getNextStepGuidance(feature, newPhase);
      console.log(`\n[Next Step Guidance]\n${nextGuidance}`);
      
      // 자동화 레벨에 따른 처리
      const trustLevel = state.trustLevel || 'semi-auto';
      if (trustLevel === 'auto') {
        // 자동 모드: 다음 role 자동 호출 (CEO에게 위임)
        console.log(`[SubagentStop] Automation level is 'auto'. Returning to CEO for next role routing.`);
        return {
          action: 'return_to_ceo',
          nextPhase: newPhase,
          reason: 'phase_complete_auto'
        };
      } else {
        // 반자동 모드: 사용자 확인 대기
        console.log(`[SubagentStop] Automation level is '${trustLevel}'. Awaiting user confirmation.`);
        return {
          action: 'ask_user',
          nextPhase: newPhase,
          guidance: nextGuidance
        };
      }
    }
  } else {
    // Phase 미완료 → 재진행
    console.log(`[SubagentStop] Phase '${currentPhase}' did not pass gate.`);
    console.log(`  Failures: ${gateResult.failures.join(', ')}`);
    
    // 문서 재생성 가이드 출력
    const retryGuidance = SessionGuide.getRetryGuidance(feature, currentPhase, gateResult.failures);
    console.log(`\n[Retry Guidance]\n${retryGuidance}`);
    
    return {
      action: 'retry_phase',
      currentPhase,
      failures: gateResult.failures
    };
  }
}

module.exports = { handleSubagentStop };
```

**데이터 흐름**:

```
SubagentStop 훅 트리거
  ↓
context = {
  agent: 'cto',
  phase: 'plan',
  feature: 'my-feature',
  toolCalls: [
    { tool: 'Write', path: '...' },
    { tool: 'Edit', path: '...' }
  ]
}
  ↓
agent-stop.js:
  1) StateStore.loadFeatureState('my-feature')
     → {currentPhase: 'plan', completedPhases: [], ...}
  2) DocValidator.validate('my-feature', 'plan')
     → {valid: true/false, errors: [...]}
  3) GateManager.judgePhaseCompletion({...})
     → {pass: true/false, failures: [...]}
  4) IF pass:
       PhaseTransitioner.transitionToNextPhase('my-feature', 'plan')
       → {success: true, nextPhase: 'design'}
     ELSE:
       SessionGuide.getRetryGuidance(...)
  ↓
return {action: 'return_to_ceo' | 'ask_user' | 'retry_phase', ...}
```

### 4.2 SubagentStop 훅 상세 로직 (핵심)

**stage 1: 문서 검증**

```javascript
// lib/quality/template-validator.js
const TEMPLATE_OUTPUTS = {
  'plan': [
    'REQUIREMENTS.md',      // 기능 요구사항 상세
    'SCOPE.md',            // 피처 범위 (in/out of scope)
    'TIMELINE.md'          // 예상 일정
  ],
  'design': [
    'DESIGN_SPEC.md',      // 상세 설계서
    'ARCHITECTURE.md'      // 시스템 아키텍처 (다이어그램 포함)
  ],
  'do': [
    'IMPLEMENTATION.md',   // 구현 내용 (코드 경로 포함)
    'TEST_RESULTS.md'      // 테스트 결과 (coverage ≥ 80%)
  ],
  'qa': [
    'QA_REPORT.md',        // QA 검증 결과
    'COMPLIANCE_REPORT.md' // 컴플라이언스 검증
  ],
  'report': [
    'FINAL_REPORT.md',     // 최종 보고서
    'RETROSPECTIVE.md'     // 회고 및 학습
  ]
};

function validateOutputs(feature, phase) {
  const requiredOutputs = TEMPLATE_OUTPUTS[phase];
  const results = [];
  
  for (const output of requiredOutputs) {
    const path = `.vais/features/${feature}/outputs/${phase}/${output}`;
    const exists = fs.existsSync(path);
    const hasContent = exists && fs.statSync(path).size > 500; // 최소 500B
    
    results.push({
      file: output,
      exists,
      hasContent,
      valid: exists && hasContent
    });
  }
  
  const valid = results.every(r => r.valid);
  return { valid, results };
}
```

**stage 2: CP 검증**

```javascript
// scripts/cp-guard.js
function validateCheckpoints(feature, phase) {
  const cpPath = `.vais/features/${feature}/checkpoints/${phase}.json`;
  
  if (!fs.existsSync(cpPath)) {
    return {
      valid: false,
      reason: 'No checkpoints recorded',
      hasAskUserQuestion: false
    };
  }
  
  const cpData = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
  
  // AskUserQuestion 호출 검증
  const hasAskUserQuestion = cpData.asks && cpData.asks.length > 0;
  
  // 각 CP의 일관성 검증
  const cpIntegrity = cpData.asks.map(ask => ({
    question: ask.question,
    timestamp: ask.timestamp,
    userResponse: ask.userResponse || null,
    consistent: ask.timestamp !== undefined && ask.userResponse !== null
  }));
  
  const allConsistent = cpIntegrity.every(c => c.consistent);
  
  return {
    valid: hasAskUserQuestion && allConsistent,
    hasAskUserQuestion,
    cpCount: cpData.asks.length,
    cpIntegrity
  };
}
```

**stage 3: Phase transition 기록**

```javascript
// scripts/phase-transition.js (phase-transition event 기록)
function transitionToNextPhase(feature, currentPhase) {
  const phaseOrder = ['plan', 'design', 'do', 'qa', 'report'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  
  if (currentIndex === -1) {
    return { success: false, error: `Invalid phase: ${currentPhase}` };
  }
  
  if (currentIndex >= phaseOrder.length - 1) {
    return { success: false, error: `No next phase after ${currentPhase}` };
  }
  
  const nextPhase = phaseOrder[currentIndex + 1];
  
  // state.json 업데이트
  const state = StateStore.loadFeatureState(feature);
  state.currentPhase = nextPhase;
  state.completedPhases.push(currentPhase);
  state.timestamps.lastModified = new Date().toISOString();
  StateStore.saveFeatureState(feature, state);
  
  // event-log.jsonl 기록
  EventLogger.log({
    timestamp: new Date().toISOString(),
    type: 'phase_transition',
    feature,
    fromPhase: currentPhase,
    toPhase: nextPhase,
    reason: 'auto_detection'
  });
  
  return { success: true, nextPhase };
}
```

**stage 4: 다음 단계 안내 강제 출력**

```javascript
// lib/pdca/session-guide.js
function getNextStepGuidance(feature, nextPhase) {
  const roleForPhase = determineRoleForPhase(nextPhase);
  
  const guidance = `
═══════════════════════════════════════
[Phase Transition Complete]
═══════════════════════════════════════

Current Phase: Complete
Next Phase: ${nextPhase}
Assigned Role: ${roleForPhase.toUpperCase()}

Actions:
1. Review the completed documents in .vais/features/${feature}/outputs/
2. AskUserQuestion: "Should we proceed to the ${nextPhase} phase?"
3. Await user confirmation
4. If approved, route to ${roleForPhase} with command:
   /vais ${roleForPhase} ${nextPhase} ${feature}

═══════════════════════════════════════
  `;
  
  return guidance;
}

function getRetryGuidance(feature, phase, failures) {
  const guidance = `
═══════════════════════════════════════
[Phase Completion Blocked]
═══════════════════════════════════════

Phase: ${phase}
Issues Found:
${failures.map((f, i) => `  ${i+1}. ${f}`).join('\n')}

Actions:
1. Review the failures above
2. Update the required documents:
   ${TEMPLATE_OUTPUTS[phase].map(f => `   - ${f}`).join('\n')}
3. Re-run the phase with:
   /vais <clevel> ${phase} ${feature}

═══════════════════════════════════════
  `;
  
  return guidance;
}
```

### 4.3 Role Transition Event (C-Level 전환)

**새로운 이벤트**: `role_transition`

```json
{
  "type": "role_transition",
  "description": "CEO가 한 C-Level에서 다른 C-Level로 라우팅",
  "payload": {
    "from_role": "string (ceo | cpo | cto | cso | cbo | coo)",
    "to_role": "string (ceo | cpo | cto | cso | cbo | coo)",
    "feature": "string",
    "phase": "string (plan | design | do | qa | report)",
    "reason": "string (선택사항, e.g., 'dependency_complete', 'user_request')",
    "timestamp": "ISO-8601"
  }
}
```

**구현 위치**: `agents/ceo/ceo.md` (에이전트 프롬프트에서 자동 기록)

```javascript
// CEO 에이전트 내부 pseudocode
async function routeToNextRole(feature, nextRole) {
  // 1. role_transition 이벤트 기록
  EventLogger.log({
    type: 'role_transition',
    from_role: 'ceo',
    to_role: nextRole,
    feature: feature,
    phase: state.currentPhase,
    reason: 'ceo_routing',
    timestamp: new Date().toISOString()
  });
  
  // 2. 다음 role의 phase router 호출
  const nextRouter = `skills/vais/phases/${nextRole}.md`;
  return {
    route: nextRouter,
    args: {
      clevel: nextRole,
      phase: state.currentPhase,
      feature: feature
    }
  };
}
```

### 4.4 AskUserQuestion 강제 호출

**구현**: SubagentStop 훅에서 감지 + 경고

```javascript
// agent-stop.js 내부
const cpCheckpoints = checkpointManager.listCheckpointsForPhase(feature, currentPhase);
const hasAskUserQuestion = cpCheckpoints.some(cp => cp.type === 'ask_user_question');

if (!hasAskUserQuestion && currentPhase !== 'report') {
  console.error(`
[ERROR] AskUserQuestion not called in phase '${currentPhase}'
This is a required gate for phase continuation.

Agent must call AskUserQuestion with at least one user confirmation:
  Example: "Should we proceed to the next phase?"

Fix: Edit your agent and include AskUserQuestion before phase completion.
  `);
  
  // 강제: 에이전트 재실행 또는 수동 개입 요청
  return {
    action: 'require_manual_intervention',
    reason: 'missing_ask_user_question'
  };
}
```

### 4.5 문서 업데이트 강제 (스킬/에이전트 변경 시)

**트리거**: `agents/ceo/skill-creator.md` 완료 또는 에이전트 수정 감지

**구현**: agent-stop.js 확장

```javascript
// agent-stop.js에 추가
async function enforceDocumentUpdates(agent, feature) {
  const guideDocs = [
    'guide/c-suite-roles-v2.md',
    'guide/agent-mapping-v2.md',
    'guide/csuite-scenarios-v2.md'
  ];
  
  // skill-creator 또는 absorb 에이전트 종료 감지
  if (agent.includes('skill-creator') || agent.includes('absorb')) {
    console.log(`[Document Sync] Skill/agent change detected. Checking guide documents...`);
    
    for (const doc of guideDocs) {
      const lastModified = fs.statSync(doc).mtime;
      const now = new Date();
      const daysSinceUpdate = (now - lastModified) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 7) {
        console.warn(`[Document Sync] ${doc} is ${Math.floor(daysSinceUpdate)} days old. Update required.`);
        
        // 문서 재생성 가이드 출력
        console.log(`\nTo update guide documents:\n  /vais ceo generate-guides ${feature}`);
      }
    }
  }
}
```

---

## 5. 상태 마이그레이션 계획 (v0.49 → v0.50)

### 5.1 기존 상태 파일 변환

**마이그레이션 대상**: `.vais/status.json`에 기존 `cmo` 또는 `cfo` role이 있는 경우

```javascript
// lib/core/migration.js (v0.50)

const ROLE_MAPPING = {
  'cmo': 'cbo',
  'cfo': 'cbo'
};

function migrateStatusJson(oldPath) {
  const oldStatus = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
  const newStatus = JSON.parse(JSON.stringify(oldStatus)); // deep copy
  
  // 각 feature에서 cmo/cfo → cbo 변환
  for (const [featureName, featureState] of Object.entries(newStatus.features || {})) {
    if (featureState.currentRole in ROLE_MAPPING) {
      const oldRole = featureState.currentRole;
      const newRole = ROLE_MAPPING[oldRole];
      
      featureState.currentRole = newRole;
      featureState.roleHistory = featureState.roleHistory || [];
      featureState.roleHistory.push({
        oldRole,
        newRole,
        migratedAt: new Date().toISOString(),
        reason: 'v0.50_restructuring'
      });
    }
    
    // completedRoles도 변환
    if (Array.isArray(featureState.completedRoles)) {
      featureState.completedRoles = featureState.completedRoles.map(role =>
        ROLE_MAPPING[role] || role
      );
    }
  }
  
  newStatus.metadata = {
    version: '0.50',
    migratedFrom: '0.49.2',
    migratedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(oldPath, JSON.stringify(newStatus, null, 2));
  
  console.log(`[Migration] status.json migrated: cmo/cfo → cbo`);
  return newStatus;
}

// SKILL.md 진입점에서 자동 호출
if (!status.metadata || status.metadata.version !== '0.50') {
  status = migrateStatusJson('.vais/status.json');
}
```

---

## 6. 훅 시스템 최종 명세 (v0.50)

### 6.1 SessionStart 훅

**스크립트**: `scripts/session-start.js`

**트리거 시점**: 세션 시작

**실행 내용**:
1. 상태 파일 로드 및 마이그레이션
2. Progress bar 초기화
3. Workflow map 렌더링
4. Output style 주입 (색상, 포매팅)

**데이터 흐름**: 상태 파일 로드 → 메모리 → 화면 출력

### 6.2 PreToolUse(Bash) 훅

**스크립트**: `scripts/bash-guard.js`

**트리거 시점**: Bash 명령 실행 직전

**검증 규칙**:
- 화이트리스트: `ls`, `grep`, `find`, `mkdir`, `cp`, `mv` 등 안전한 명령
- 블랙리스트: `rm -rf`, `git push --force`, `sudo`, `chmod 777` 등 위험한 명령

**반환**: `{allow: true/false, reason: string}`

### 6.3 PostToolUse(Write|Edit) 훅

**스크립트**: `scripts/doc-tracker.js`

**트리거 시점**: 문서 작성(Write)/수정(Edit) 직후

**기록 내용**:
- 파일 경로
- 작성/수정 시각
- 파일 크기
- 첫 100자

**저장**: `.vais/event-log.jsonl`에 추가

### 6.4 PostToolUse(AskUserQuestion) 훅

**스크립트**: `scripts/cp-tracker.js`

**트리거 시점**: AskUserQuestion 호출 직후

**기록 내용**:
- 질문 텍스트
- 사용자 응답
- 타임스탬프
- 컨텍스트 (현재 role, phase)

**저장**: `.vais/features/{feature}/checkpoints/{phase}.json`에 저장

### 6.5 SubagentStart 훅

**스크립트**: `scripts/agent-start.js`

**트리거 시점**: 서브에이전트(role별 에이전트) 시작

**실행 내용**:
1. VALID_ROLES 확인 (whitelist 검증)
2. 에이전트 시작 이벤트 기록
3. Agent state 초기화

**유효한 역할**:
```javascript
const VALID_ROLES = [
  'ceo',
  'cpo', 'backlog-manager',
  'cto',
  'cso', 'secret-scanner', 'dependency-analyzer',
  'cbo',
    'seo-analyst', 'copy-writer', 'growth-analyst',
    'market-researcher', 'customer-segmentation-analyst',
    'marketing-analytics-analyst',
    'finops-analyst', 'pricing-analyst',
    'financial-modeler', 'unit-economics-analyst',
  'coo'
];
```

### 6.6 SubagentStop 훅 (핵심, v0.50 완전 명세)

**스크립트**: `scripts/agent-stop.js`

**트리거 시점**: 서브에이전트 종료

**4단계 검증 파이프라인**:

| 단계 | 검증 | 실패 시 동작 |
|------|------|------------|
| 1. Doc Validation | 산출물 존재 확인 (REQUIREMENTS.md 등) | 경고 출력, 계속 진행 |
| 2. CP Validation | AskUserQuestion 호출 확인 | 경고 출력, 계속 진행 |
| 3. Phase Transition Detection | 현재 phase 완료 여부 판정 (gate) | 완료 → 다음 phase로, 미완료 → retry guidance |
| 4. Next Step Guidance Forced | 다음 step 정보 및 역할 안내 출력 | 항상 출력 |

**반환값**:
```javascript
{
  // action: 'return_to_ceo' | 'ask_user' | 'retry_phase'
  // nextPhase: string | null
  // guidance: string (다음 단계 안내)
  // failures: string[] | null (retry 시)
}
```

**상세 코드 예시**: 섹션 4.1 참고

### 6.7 Stop 훅

**스크립트**: `scripts/stop-handler.js`

**트리거 시점**: 세션 완전 종료

**실행 내용**:
1. 최종 이벤트 로그 기록
2. 세션 요약 출력
3. 상태 파일 최종 저장

---

## 7. 실행 순서 및 의존성

| # | 작업 | 담당 | 의존성 |
|---|------|------|--------|
| 1 | vais.config.json 업데이트: cSuite, autoKeywords, dependencies | config | 없음 |
| 2 | lib/core/state-machine.js: PIPELINE_ROLES 변경, Phase FSM 정의 | core | 1 |
| 3 | lib/core/migration.js: 마이그레이션 로직 구현 | core | 1, 2 |
| 4 | scripts/agent-start.js: VALID_ROLES 업데이트 + cbo 에이전트 추가 | hooks | 1 |
| 5 | agents/cbo/ 디렉토리 생성 + 10개 에이전트 프롬프트 작성 | agents | 1, 2 |
| 6 | agents/ceo/ceo.md: CBO 라우팅 추가, skill-creator 연결, retrospective 제거 | agents | 5 |
| 7 | agents/ceo/skill-creator.md 신규 작성 | agents | 6 |
| 8 | agents/cpo/cpo.md: backlog-manager 연결 | agents | 1, 5 |
| 9 | agents/cpo/backlog-manager.md 신규 작성 | agents | 8 |
| 10 | agents/cto/cto.md: infra-architect 재정의, release-engineer/performance-engineer 제거 | agents | 1, 5 |
| 11 | agents/cso/cso.md: secret-scanner, dependency-analyzer 연결 | agents | 1, 5 |
| 12 | agents/cso/secret-scanner.md, dependency-analyzer.md 신규 작성 | agents | 11 |
| 13 | agents/coo/coo.md: release-engineer, performance-engineer 서브에이전트 추가 | agents | 1, 10 |
| 14 | skills/vais/SKILL.md: 인자 파싱, CBO 반영, 기존 cmo/cfo 참조 제거 | skills | 1, 5 |
| 15 | skills/vais/phases/cbo.md 신규 작성, cmo.md/cfo.md 삭제 | skills | 14 |
| 16 | scripts/agent-stop.js: 4단계 검증 + phase-transition 자동 호출 + 다음 단계 안내 강제 구현 | hooks | 2, 3, 5 |
| 17 | scripts/phase-transition.js 업데이트 (agent-stop.js에서 호출 가능하도록) | scripts | 2 |
| 18 | lib/pdca/session-guide.js: getNextStepGuidance, getRetryGuidance 구현 | pdca | 2, 16 |
| 19 | lib/quality/gate-manager.js: judgePhaseCompletion 로직 구현 | quality | 2 |
| 20 | scripts/doc-validator.js: CBO 산출물 패턴 추가, phase별 검증 규칙 | scripts | 5, 16 |
| 21 | lib/core/migration.js 호출 통합: SKILL.md 진입점에서 자동 실행 | core | 3 |
| 22 | hooks/events.json: role_transition 이벤트 스키마 추가 | config | 1 |
| 23 | agents/ceo/ceo.md: role_transition 이벤트 자동 기록 로직 추가 | agents | 22 |
| 24 | templates/ 업데이트: finance.template.md → CBO 통합 반영 | templates | 5 |
| 25 | lib/observability/event-logger.js 업데이트: role_transition 이벤트 타입 지원 | observability | 22 |
| 26 | 기존 agents/cmo/, agents/cfo/ 디렉토리 + 파일 삭제 | cleanup | 5, 24 |
| 27 | skills/vais/phases/cmo.md, phases/cfo.md 파일 삭제 | cleanup | 15, 26 |
| 28 | agents/ceo/retrospective-writer.md 파일 삭제 | cleanup | 26 |
| 29 | 통합 테스트: S-1 ~ S-10 시나리오 검증 (자세한 내용은 별도 테스트 플랜) | test | 1-28 |

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 기존 .vais/status.json에 cmo/cfo 데이터 존재 | 높음 | migration.js로 자동 변환 + 로그 기록 |
| CBO 에이전트 10개가 과도한 컨텍스트 | 중간 | 각 에이전트가 범위 자율 조절 가능, 불필요 시 스킵 |
| agents/cmo, agents/cfo 삭제 후 참조 오류 | 높음 | 삭제 전 모든 참조 제거 확인, phase router 리다이렉트 |
| Phase gate 판정 로직 오류 | 높음 | gate-manager.js 단위 테스트 필수 |
| AskUserQuestion 호출 누락 감지 미작동 | 중간 | cp-tracker.js 훅 테스트 + agent-stop.js 검증 로직 테스트 |
| 자동 role_transition 이벤트 기록 실패 | 낮음 | event-logger 예외 처리 + 재시도 로직 |

---

## 9. 파일 수정 내용 상세

### 9.1 skills/vais/SKILL.md (메인 스킬 진입점)

```markdown
# VAIS Code Orchestrator

> Skills for Autonomous Intelligent Systems
> Version: 0.50

## 명령 형식

/vais {clevel} {phase} {feature}

- clevel: ceo, cpo, cto, cso, cbo, coo, auto
- phase: plan, design, do, qa, report (선택사항)
- feature: 피처명 (필수)

## 진입 로직 (pseudocode)

1. prompt-handler.js: 인자 파싱
   args = parse('/vais cto plan my-feature')
   → {clevel: 'cto', phase: 'plan', feature: 'my-feature'}

2. migration.js: 상태 마이그레이션 확인
   if (status.metadata.version < '0.50') {
     migrate_status_json();
   }

3. state-store.js: 기존 상태 로드
   state = load_feature_state('my-feature')
   → {currentRole: 'cto', currentPhase: 'plan', ...}

4. 권한 검증
   if (args.clevel === 'auto') {
     route_to_ceo(feature);  // CEO가 자동 결정
   }

5. phases/{clevel}.md로 라우팅
   route_to_phase_router('phases/cto.md', {phase: 'plan', feature: 'my-feature'})

---

## 지원 C-Level 역할 (v0.50)

- **CEO**: 전략, 스킬 생성, 전체 조율
- **CPO**: 제품 기획, 백로그 관리
- **CTO**: 기술 설계, 구현, 아키텍처
- **CSO**: 보안, 시크릿 관리, 의존성 분석
- **CBO**: 마케팅, 재무, 사업 분석 (신규, CMO+CFO 통합)
- **COO**: 배포, 운영, 성능 최적화

---
```

### 9.2 agents/ceo/ceo.md (CEO 에이전트)

```markdown
# CEO: Strategic Orchestrator

You are the Chief Executive Officer. Your role:
1. Feature 전체 조율 (phase 진행)
2. C-Level 역할 라우팅 (의존성 기반 동적 결정)
3. 스킬 생성/수정 감독 (skill-creator 서브에이전트 호출)
4. 질의 응답 + AskUserQuestion 호출

## Decision Tree: Next Role Routing

```
Feature State:
  phase = 'plan'
  completed_roles = ['ceo']
  → Next role candidates: [cpo, cbo]
  → CPO 의존성 확인: depends_on = [] ✓
  → CBO 의존성 확인: depends_on = [] ✓
  → User decision required

Feature State:
  phase = 'design'
  completed_roles = ['ceo', 'cpo']
  → Next role candidates: [cto, cso, cbo]
  → CTO 의존성 확인: depends_on = ['cpo'] ✓
  → CSO 의존성 확인: depends_on = ['cto'] ✗ (CTO 미완료)
  → CBO 의존성 확인: depends_on = [] ✓
  → Route to CTO or CBO (user discretion)
```

## Subagents

- **skill-creator**: 새로운 스킬 생성/수정 자동화

## Key Actions

1. Phase 진행 상황 파악
   - Get current feature state
   - Display completed phases and roles
   - Identify next phase

2. Role Routing (with role_transition event)
   - Determine eligible next roles based on dependencies
   - Record role_transition event: {from_role: 'ceo', to_role: 'cto', ...}
   - Route to next role's phase router

3. AskUserQuestion 호출
   - "Shall we proceed to {next_phase}?"
   - "Should we involve {next_role}?"
   - Await user confirmation

4. Skill Creation (if needed)
   - Call skill-creator subagent
   - Guide user through skill creation

Note: retrospective-writer 제거됨 (v0.49 폐지)

---
```

### 9.3 agents/cbo/cbo.md (CBO 메인 에이전트)

```markdown
# CBO: Chief Business Officer

Chief Business Officer (CMO + CFO 역할 통합)

You coordinate:
- **Marketing**: SEO, copywriting, growth strategy
- **Finance**: Unit economics, financial modeling, pricing

## Subagents

1. **market-researcher**: 시장 규모, 경쟁사 분석
2. **customer-segmentation-analyst**: RFM, 페르소나
3. **marketing-analytics-analyst**: CAC, ROAS, 귀속 모델
4. **financial-modeler**: 재무 모델 (P&L, DCF)
5. **unit-economics-analyst**: CAC/LTV, cohort analysis
6. **seo-analyst**: SEO 전략, 콘텐츠 플랜
7. **copy-writer**: 마케팅 카피, 브랜드 메시징
8. **growth-analyst**: GTM, 퍼널 최적화
9. **finops-analyst**: 인프라 비용 최적화
10. **pricing-analyst**: 가격책정, 수익 최적화

## Phase Responsibilities

### Plan Phase (CBO 첫 진입)
- 시장 규모 및 경쟁 환경 분석 (market-researcher)
- 고객 세그먼트 정의 (customer-segmentation-analyst)
- 마케팅 목표 및 수익 목표 설정

### Design Phase
- 마케팅 전략 및 GTM 플랜 (growth-analyst)
- 가격책정 전략 (pricing-analyst)
- 재무 모델 (financial-modeler)

### Do Phase
- 마케팅 자료 제작 (copy-writer, seo-analyst)
- 재무 계획서 작성 (financial-modeler)

### QA Phase
- 마케팅 성과 분석 (marketing-analytics-analyst)
- 재무 모델 검증 (unit-economics-analyst, finops-analyst)

### Report Phase
- 종합 비즈니스 리포트 작성
- 향후 계획 수립

---
```

---

## 10. 테스트 시나리오 (통합 테스트 플랜)

**총 10개 시나리오 (S-1 ~ S-10):**

### S-1: 기본 흐름 (CEO → CTO → COO)

```
명령: /vais auto my-app
흐름:
  1. CEO (plan) - 요구사항 수집
  2. CTO (design) - 아키텍처 설계
  3. CTO (do) - 구현
  4. CTO (qa) - 테스트
  5. COO (qa) - 배포 준비
  6. COO (report) - 배포 완료

검증:
  - phase-transition 자동 감지 ✓
  - role_transition 이벤트 기록 ✓
  - AskUserQuestion 호출 강제 ✓
```

### S-2: 마이그레이션 (v0.49 CMO 상태 → CBO)

```
사전 조건: .vais/status.json에 role='cmo' 데이터 존재
명령: /vais auto my-feature
흐름:
  1. SKILL.md 진입 → migration.js 자동 호출
  2. status.json: cmo → cbo 변환
  3. metadata.version = '0.50' 기록

검증:
  - migration 로그 확인 ✓
  - status.json role='cbo' 변환됨 ✓
```

### S-3: Phase Retry (산출물 미완료)

```
명령: /vais cto plan my-feature
흐름:
  1. CTO plan phase 실행
  2. SubagentStop 훅: doc-validator 검증 실패
     - REQUIREMENTS.md 미작성
  3. agent-stop.js: 경고 + retry guidance 출력
  4. 사용자 수동 진행

검증:
  - doc-validator 실패 감지 ✓
  - retry guidance 출력 ✓
  - phase 전환 미실행 ✓
```

### S-4: Checkpoint 강제 호출

```
명령: /vais cto design my-feature
흐름:
  1. CTO design phase 실행
  2. 에이전트가 AskUserQuestion 호출 안 함 (의도적)
  3. SubagentStop 훅: cp-guard 검증 실패
  4. agent-stop.js: 경고 출력

검증:
  - AskUserQuestion 미호출 감지 ✓
  - 경고 메시지 출력 ✓
```

### S-5: 자동 모드 (auto)

```
명령: /vais auto my-feature
흐름:
  1. CEO 자동 모드 진입
  2. Dependency 기반 role routing 자동 수행
  3. Phase 자동 전환
  4. 모든 단계 자동 완료

검증:
  - 모든 role transition 이벤트 기록 ✓
  - 최종 FINAL_REPORT.md 생성 ✓
```

### S-6: CBO 마케팅 분석 (신규 역할)

```
명령: /vais cbo plan my-feature
흐름:
  1. CBO plan phase
  2. market-researcher → 시장 분석
  3. customer-segmentation-analyst → 페르소나 정의
  4. SubagentStop: phase 전환

검증:
  - market-researcher 서브에이전트 호출 ✓
  - 마케팅 산출물 생성 ✓
```

### S-7: CSO 보안 스캔 (신규 서브에이전트)

```
명령: /vais cso do my-feature
흐름:
  1. CSO do phase
  2. secret-scanner → 시크릿 탐지
  3. dependency-analyzer → npm/pip 취약점 분석
  4. QA report 생성

검증:
  - secret-scanner bash 명령 실행 ✓
  - dependency-analyzer 패키지 검사 ✓
```

### S-8: CPO 백로그 관리 (신규 서브에이전트)

```
명령: /vais cpo design my-feature
흐름:
  1. CPO design phase
  2. backlog-manager → 백로그 정렬
  3. 스프린트 계획 생성

검증:
  - backlog-manager 서브에이전트 호출 ✓
  - 백로그 정렬 결과 출력 ✓
```

### S-9: Skill Creator (CEO 신규 기능)

```
명령: /vais ceo plan create-my-skill
흐름:
  1. CEO skill-creator 서브에이전트 호출
  2. 새로운 스킬 생성/수정
  3. guide-docs 업데이트 강제

검증:
  - skill 파일 생성 ✓
  - guide/c-suite-roles-v2.md 업데이트 경고 ✓
```

### S-10: End-to-End (모든 기능 통합)

```
명령: /vais auto complete-product-launch
흐움:
  1. CEO phase: plan (시전 + CBO 라우팅)
  2. CBO phase: plan → design → do (마켓 분석, 가격책정)
  3. CPO phase: plan → design (백로그 관리)
  4. CTO phase: design → do → qa → report (구현)
  5. CSO phase: qa (보안 검사)
  6. COO phase: do → report (배포)
  7. CEO phase: report (회고)

검증:
  - 모든 role transition 이벤트 기록 ✓
  - 모든 phase transition 자동 감지 ✓
  - 최종 report 생성 ✓
  - .vais/event-log.jsonl 완성 ✓
```

---

## 최종 체크리스트

### 코드 변경 검증
- [ ] vais.config.json: PIPELINE_ROLES = ['cbo', 'cpo', 'cto', 'cso', 'coo']
- [ ] state-machine.js: PHASE_MACHINE 상세 정의
- [ ] migration.js: cmo/cfo → cbo 자동 변환
- [ ] agent-stop.js: 4단계 검증 + 자동 phase 전환
- [ ] phase-transition.js: phase-transition 이벤트 기록
- [ ] session-guide.js: 다음 단계 안내 자동 생성
- [ ] gate-manager.js: phase completion gate 판정 로직

### 에이전트 파일 생성
- [ ] agents/cbo/ 디렉토리 + 10개 서브에이전트
- [ ] agents/ceo/skill-creator.md
- [ ] agents/cpo/backlog-manager.md
- [ ] agents/cso/secret-scanner.md, dependency-analyzer.md
- [ ] skills/vais/phases/cbo.md

### 에이전트 파일 수정
- [ ] agents/ceo/ceo.md: CBO 라우팅 + role_transition 이벤트
- [ ] agents/cpo/cpo.md: backlog-manager 연결
- [ ] agents/cto/cto.md: infra-architect 재정의
- [ ] agents/cso/cso.md: secret-scanner + dependency-analyzer 연결
- [ ] agents/coo/coo.md: release-engineer, performance-engineer 서브에이전트

### 파일 삭제
- [ ] agents/cmo/ (전체 디렉토리)
- [ ] agents/cfo/ (전체 디렉토리)
- [ ] skills/vais/phases/cmo.md
- [ ] skills/vais/phases/cfo.md
- [ ] agents/ceo/retrospective-writer.md

### 테스트 실행
- [ ] S-1 ~ S-10 모든 시나리오 통과
- [ ] Migration 검증 (v0.49 → v0.50)
- [ ] event-log.jsonl 완성도 확인
- [ ] 백업 복구 테스트

---

**문서 작성 완료: 2026-04-13**
**버전: v0.50 최종 명세**
**상태: 코드 구현 준비 완료**
