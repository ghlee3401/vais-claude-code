/**
 * VAIS Code - Declarative State Machine
 * @module lib/core/state-machine
 *
 * 설계 원칙
 *   - 6 C-Level 체계 (CEO, CPO, CTO, CSO, CBO, COO)
 *   - Phase 0 ideation 도입 (optional)
 *   - PIPELINE_ROLES = [cbo, cpo, cto, cso, coo] (CEO는 동적 라우팅 주체라 파이프라인에서 제외)
 */

const SAFE_NAME_RE = /^[a-zA-Z0-9가-힣_-]+$/;

// ── Valid roles & pipeline ────────────────────────────────────────

/** CEO는 동적 라우팅 주체라 파이프라인에서 제외. 나머지 5 C-Level 순서는 기본 launch 경로 참조용. */
const PIPELINE_ROLES = ['cbo', 'cpo', 'cto', 'cso', 'coo'];

/** CLI/hook 단계에서 허용되는 role 토큰. 'auto'는 CEO 판단 위임. */
const VALID_ROLES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo', 'auto'];

// ── Phase Machine ─────────────────────────────────────────────────

/**
 * v0.50 phase 전이 정의.
 *
 *   ideation(optional) → plan → design → do → qa → report
 *
 * @typedef {Object} PhaseNode
 * @property {string|null} next - 다음 phase id (report는 null)
 * @property {string[]} prerequisites - 진입 전 완료되어야 할 phase 목록
 * @property {boolean} optional - true이면 스킵 가능
 * @property {string[]} outputs - 해당 phase에서 기대되는 산출물 파일명 패턴
 */
const PHASE_MACHINE = {
  ideation: {
    next: 'plan',
    prerequisites: [],
    optional: true,
    outputs: ['{role}_{topic}.md'],
  },
  plan: {
    next: 'design',
    prerequisites: [],
    optional: false,
    outputs: ['REQUIREMENTS.md', 'SCOPE.md', 'TIMELINE.md'],
  },
  design: {
    next: 'do',
    prerequisites: ['plan'],
    optional: false,
    outputs: ['DESIGN_SPEC.md', 'ARCHITECTURE.md'],
  },
  do: {
    next: 'qa',
    prerequisites: ['plan', 'design'],
    optional: false,
    outputs: ['IMPLEMENTATION.md', 'TEST_RESULTS.md'],
  },
  qa: {
    next: 'report',
    prerequisites: ['do'],
    optional: false,
    outputs: ['QA_REPORT.md', 'COMPLIANCE_REPORT.md'],
  },
  report: {
    next: null,
    prerequisites: ['qa'],
    optional: false,
    outputs: ['FINAL_REPORT.md', 'RETROSPECTIVE.md'],
  },
};

const ALL_PHASES = Object.keys(PHASE_MACHINE);

// ── Helpers ───────────────────────────────────────────────────────

function validateSafeName(value, label) {
  if (value == null) return; // null/undefined는 상위에서 판단
  if (typeof value !== 'string' || !SAFE_NAME_RE.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}

/**
 * phase 전이 유효성 판정.
 *
 * 규칙
 *   1. currentPhase === null && nextPhase === 'plan' → 허용 (ideation 스킵 후 바로 plan 시작)
 *   2. currentPhase === null && nextPhase === 'ideation' → 허용 (신규 시작)
 *   3. PHASE_MACHINE[nextPhase].prerequisites가 completedPhases에 모두 포함되어야 함
 *   4. optional phase(ideation)는 건너뛰어도 됨. 즉 completedPhases가 ['ideation'] 없이도 plan 진입 가능.
 *
 * @param {string|null} currentPhase
 * @param {string} nextPhase
 * @param {string[]} completedPhases
 * @returns {{valid:boolean, reason:string|null}}
 */
function validatePhaseTransition(currentPhase, nextPhase, completedPhases = []) {
  if (!ALL_PHASES.includes(nextPhase)) {
    return { valid: false, reason: `Unknown phase: ${nextPhase}` };
  }
  if (currentPhase != null && !ALL_PHASES.includes(currentPhase)) {
    return { valid: false, reason: `Unknown current phase: ${currentPhase}` };
  }

  const node = PHASE_MACHINE[nextPhase];

  // prerequisite 검사 (optional phase는 체크에서 자연히 빠짐 — 그 phase가 prereq에 들어가지 않음)
  const missing = node.prerequisites.filter((p) => !completedPhases.includes(p));
  if (missing.length > 0) {
    return {
      valid: false,
      reason: `Missing prerequisites for ${nextPhase}: ${missing.join(', ')}`,
    };
  }

  // 시작점 특수 처리
  if (currentPhase == null) {
    // 신규 시작은 ideation 또는 plan만 허용
    if (nextPhase !== 'ideation' && nextPhase !== 'plan') {
      return { valid: false, reason: `Cannot start at phase ${nextPhase}` };
    }
    return { valid: true, reason: null };
  }

  // 일반 전이: current의 next여야 하거나, optional을 건너뛴 경우
  const currentNode = PHASE_MACHINE[currentPhase];
  if (currentNode.next === nextPhase) {
    return { valid: true, reason: null };
  }

  // optional phase 스킵 허용: ideation → plan (위에서 이미 처리됨), 그 외는 금지
  // ideation에서 design/do/qa/report로 점프는 prereq 단계에서 걸림
  if (currentPhase === 'ideation' && nextPhase === 'plan') {
    return { valid: true, reason: null };
  }

  return {
    valid: false,
    reason: `No direct transition ${currentPhase} → ${nextPhase}`,
  };
}

/**
 * role 전이 유효성 판정. 설정 파일의 `dependencies` 테이블을 참조한다.
 * fromRole이 null이면 신규 feature 시작으로 간주.
 *
 * @param {string|null} fromRole
 * @param {string} toRole
 * @param {string} featureName
 * @param {Object} [config] - 주입용. 생략 시 require('../paths').loadConfig() 사용.
 * @returns {{valid:boolean, reason:string|null}}
 */
function validateRoleTransition(fromRole, toRole, featureName, config) {
  validateSafeName(featureName, 'featureName');
  if (!VALID_ROLES.includes(toRole)) {
    return { valid: false, reason: `Unknown role: ${toRole}` };
  }
  if (fromRole != null && !VALID_ROLES.includes(fromRole)) {
    return { valid: false, reason: `Unknown fromRole: ${fromRole}` };
  }

  let cfg = config;
  if (!cfg) {
    try {
      cfg = require('../paths').loadConfig();
    } catch (_) {
      cfg = {};
    }
  }
  const deps = (cfg && cfg.dependencies) || {};
  const required = deps[toRole] || [];

  // fromRole이 toRole의 prerequisite set에 포함되면 통과. prereq가 없는 role은 누구 다음이든 허용.
  if (required.length === 0) {
    return { valid: true, reason: null };
  }
  if (fromRole == null) {
    return {
      valid: false,
      reason: `${toRole} requires prior role(s): ${required.join(', ')}`,
    };
  }
  if (required.includes(fromRole)) {
    return { valid: true, reason: null };
  }
  return {
    valid: false,
    reason: `${toRole} requires ${required.join(' or ')} before ${fromRole}`,
  };
}

/**
 * 신규 feature 상태 객체 생성.
 *
 * @param {string} feature
 * @param {string} [startRole='cpo']
 * @param {string} [startPhase='plan'] - 'ideation' 또는 'plan'
 * @returns {Object}
 */
function initializeFeatureState(feature, startRole = 'cpo', startPhase = 'plan') {
  validateSafeName(feature, 'feature');
  validateSafeName(startRole, 'startRole');
  if (!ALL_PHASES.includes(startPhase)) {
    throw new Error(`Unknown startPhase: ${startPhase}`);
  }
  const now = new Date().toISOString();
  return {
    feature,
    role: startRole,
    currentPhase: startPhase,
    completedPhases: [],
    iterationCount: 0,
    matchRate: 0,
    timestamps: { created: now, lastUpdated: now, [startPhase]: now },
    metadata: {},
    version: '0.50.0',
  };
}

/**
 * state.currentPhase를 PHASE_MACHINE.next로 전진. prerequisite 검사 포함.
 *
 * @param {Object} state
 * @returns {Object} new state (shallow copy)
 */
function advancePhase(state) {
  if (!state || !state.currentPhase) {
    throw new Error('advancePhase: state.currentPhase missing');
  }
  const node = PHASE_MACHINE[state.currentPhase];
  if (!node) {
    throw new Error(`advancePhase: unknown phase ${state.currentPhase}`);
  }
  const nextPhase = node.next;
  if (!nextPhase) {
    // terminal
    return { ...state };
  }
  const completed = [...(state.completedPhases || []), state.currentPhase];
  const check = validatePhaseTransition(state.currentPhase, nextPhase, completed);
  if (!check.valid) {
    throw new Error(`advancePhase blocked: ${check.reason}`);
  }
  const now = new Date().toISOString();
  return {
    ...state,
    currentPhase: nextPhase,
    completedPhases: completed,
    timestamps: { ...(state.timestamps || {}), [nextPhase]: now, lastUpdated: now },
  };
}

module.exports = {
  PIPELINE_ROLES,
  VALID_ROLES,
  PHASE_MACHINE,
  ALL_PHASES,
  validatePhaseTransition,
  validateRoleTransition,
  initializeFeatureState,
  advancePhase,
};
