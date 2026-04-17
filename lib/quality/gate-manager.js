/**
 * VAIS Code - Quality Gate Manager
 * @module lib/quality/gate-manager
 * @version 1.0.0
 *
 * Phase-level quality gates with 3 verdicts (pass/retry/fail).
 * Supports CTO technical gates + CSO security gates.
 * @see bkit-claude-code/lib/quality/gate-manager.js
 */

const path = require('path');

// Lazy requires
let _stateStore = null;
function getStateStore() {
  if (!_stateStore) { _stateStore = require('../core/state-store'); }
  return _stateStore;
}

let _paths = null;
function getPaths() {
  if (!_paths) { _paths = require('../paths'); }
  return _paths;
}

/**
 * config 에서 gates.defaults + gates.roleOverrides 로드.
 * v0.56 sub-plan 07: GATE_DEFINITIONS 와 ROLE_THRESHOLD_OVERRIDES 의 하드코드 값을 config 우선으로 덮어쓰기.
 * 캐시 없이 호출마다 신규 로드 (테스트 격리 편의).
 */
function loadGateConfig() {
  try {
    const cfg = getPaths().loadConfig();
    return {
      defaults: (cfg && cfg.gates && cfg.gates.defaults) || {},
      roleOverrides: (cfg && cfg.gates && cfg.gates.roleOverrides) || {},
    };
  } catch (_) {
    return { defaults: {}, roleOverrides: {} };
  }
}

// ── Gate Definitions ───────────────────────────────────────────────

/**
 * @typedef {Object} GateCondition
 * @property {string} metric
 * @property {string} op - '>=', '<=', '===', '<', '>'
 * @property {number} value
 */

/**
 * Phase-level gate definitions.
 * pass: all must be true. retry: triggers re-attempt. fail: hard blocker.
 * @type {Record<string, {pass: GateCondition[], retry: GateCondition[], fail: GateCondition[]}>}
 */
const GATE_DEFINITIONS = {
  plan: {
    pass: [
      { metric: 'designCompleteness', op: '>=', value: 50 },
    ],
    retry: [
      { metric: 'designCompleteness', op: '<', value: 50 },
    ],
    fail: [],
  },
  design: {
    pass: [
      { metric: 'designCompleteness', op: '>=', value: 80 },
      { metric: 'conventionCompliance', op: '>=', value: 70 },
    ],
    retry: [
      { metric: 'designCompleteness', op: '<', value: 80 },
    ],
    fail: [
      { metric: 'designCompleteness', op: '<', value: 40 },
    ],
  },
  do: {
    pass: [
      { metric: 'codeQualityScore', op: '>=', value: 60 },
      { metric: 'criticalIssueCount', op: '===', value: 0 },
    ],
    retry: [
      { metric: 'codeQualityScore', op: '<', value: 60 },
    ],
    fail: [
      { metric: 'criticalIssueCount', op: '>', value: 3 },
    ],
  },
  qa: {
    pass: [
      { metric: 'matchRate', op: '>=', value: 90 },
      { metric: 'codeQualityScore', op: '>=', value: 70 },
      { metric: 'criticalIssueCount', op: '===', value: 0 },
    ],
    retry: [
      { metric: 'matchRate', op: '<', value: 90 },
      { metric: 'codeQualityScore', op: '<', value: 70 },
    ],
    fail: [
      { metric: 'criticalIssueCount', op: '>', value: 0 },
    ],
  },
  report: {
    pass: [
      { metric: 'matchRate', op: '>=', value: 90 },
      { metric: 'criticalIssueCount', op: '===', value: 0 },
    ],
    retry: [],
    fail: [
      { metric: 'criticalIssueCount', op: '>', value: 0 },
    ],
  },
  // CSO-specific gates
  'cso-security': {
    pass: [
      { metric: 'criticalIssueCount', op: '===', value: 0 },
      { metric: 'owaspScore', op: '>=', value: 8 },
    ],
    retry: [
      { metric: 'owaspScore', op: '<', value: 8 },
    ],
    fail: [
      { metric: 'criticalIssueCount', op: '>', value: 0 },
    ],
  },
  'cso-quality': {
    pass: [
      { metric: 'codeQualityScore', op: '>=', value: 80 },
      { metric: 'criticalIssueCount', op: '===', value: 0 },
    ],
    retry: [
      { metric: 'codeQualityScore', op: '<', value: 80 },
    ],
    fail: [
      { metric: 'criticalIssueCount', op: '>', value: 0 },
    ],
  },
};

/**
 * Role-specific threshold overrides (C-Suite specialization)
 */
const ROLE_THRESHOLD_OVERRIDES = {
  cso: {
    matchRate: 95,
    codeQualityScore: 80,
    criticalIssueCount: 0,
  },
  cto: {
    // Uses defaults
  },
};

// ── Condition Evaluation ───────────────────────────────────────────

/**
 * Evaluate a single condition against metrics
 * @param {GateCondition} condition
 * @param {Object} metrics
 * @returns {boolean}
 */
function evaluateCondition(condition, metrics) {
  const value = metrics[condition.metric];
  if (value === undefined || value === null) return false;

  switch (condition.op) {
    case '>=': return value >= condition.value;
    case '<=': return value <= condition.value;
    case '===': return value === condition.value;
    case '<': return value < condition.value;
    case '>': return value > condition.value;
    default: return false;
  }
}

/**
 * Get effective thresholds after role overrides
 * @param {string} phase
 * @param {string} [role]
 * @returns {Object} Gate definition with overrides applied
 */
function getEffectiveThresholds(phase, role) {
  const base = GATE_DEFINITIONS[phase];
  if (!base) return null;

  // 오버라이드 병합 순서: 코드 defaults(base) ← config.gates.defaults ← 코드 ROLE_THRESHOLD_OVERRIDES ← config.gates.roleOverrides
  const { defaults: cfgDefaults, roleOverrides: cfgRoleOverrides } = loadGateConfig();
  const codeRoleOverrides = ROLE_THRESHOLD_OVERRIDES[role] || {};
  const cfgRole = (role && cfgRoleOverrides[role]) || {};
  const mergedOverrides = { ...cfgDefaults, ...codeRoleOverrides, ...cfgRole };

  if (Object.keys(mergedOverrides).length === 0) return base;

  // Deep clone and apply merged overrides
  const effective = JSON.parse(JSON.stringify(base));
  for (const conditions of [effective.pass, effective.retry, effective.fail]) {
    for (const cond of conditions) {
      if (mergedOverrides[cond.metric] !== undefined) {
        cond.value = mergedOverrides[cond.metric];
      }
    }
  }
  return effective;
}

// ── Gate Check ─────────────────────────────────────────────────────

/**
 * Check quality gate for a phase
 * @param {string} phase - PDCA phase
 * @param {Object} options
 * @param {Object} options.metrics - {matchRate, codeQualityScore, criticalIssueCount, ...}
 * @param {string} [options.role] - C-Level role for threshold overrides
 * @param {string} [options.feature] - Feature name for audit trail
 * @returns {{verdict:string, score:number, details:Object[], blockers:string[], recommendation:string}}
 */
function checkGate(phase, { metrics = {}, role, feature } = {}) {
  const gate = getEffectiveThresholds(phase, role);
  if (!gate) {
    return {
      verdict: 'pass',
      score: 100,
      details: [],
      blockers: [],
      recommendation: 'No gate defined for this phase',
    };
  }

  const details = [];

  // Check fail conditions first (hard blockers)
  const failTriggered = [];
  for (const cond of gate.fail) {
    const met = evaluateCondition(cond, metrics);
    details.push({
      metric: cond.metric,
      expected: `${cond.op} ${cond.value}`,
      actual: metrics[cond.metric],
      category: 'fail',
      triggered: met,
    });
    if (met) failTriggered.push(cond.metric);
  }

  if (failTriggered.length > 0) {
    const result = {
      verdict: 'fail',
      score: 0,
      details,
      blockers: failTriggered,
      recommendation: `Critical blockers: ${failTriggered.join(', ')}. Must be resolved before proceeding.`,
    };
    recordGateResult(phase, result, feature);
    return result;
  }

  // Check pass conditions
  let passCount = 0;
  for (const cond of gate.pass) {
    const met = evaluateCondition(cond, metrics);
    details.push({
      metric: cond.metric,
      expected: `${cond.op} ${cond.value}`,
      actual: metrics[cond.metric],
      category: 'pass',
      triggered: met,
    });
    if (met) passCount++;
  }

  const totalPass = gate.pass.length || 1;
  const score = Math.round((passCount / totalPass) * 100);

  // Check retry conditions
  const retryTriggered = [];
  for (const cond of gate.retry) {
    const met = evaluateCondition(cond, metrics);
    details.push({
      metric: cond.metric,
      expected: `${cond.op} ${cond.value}`,
      actual: metrics[cond.metric],
      category: 'retry',
      triggered: met,
    });
    if (met) retryTriggered.push(cond.metric);
  }

  let verdict;
  let recommendation;

  if (passCount === gate.pass.length) {
    verdict = 'pass';
    recommendation = 'All conditions met. Proceed to next phase.';
  } else if (retryTriggered.length > 0) {
    verdict = 'retry';
    recommendation = `Retry needed: ${retryTriggered.join(', ')}. Iterate to improve.`;
  } else {
    verdict = 'retry';
    const unmetMetrics = gate.pass
      .filter(c => !evaluateCondition(c, metrics))
      .map(c => c.metric);
    recommendation = `Conditions unmet: ${unmetMetrics.join(', ')}`;
  }

  const result = { verdict, score, details, blockers: [], recommendation };
  recordGateResult(phase, result, feature);
  return result;
}

/**
 * Resolve action based on verdict and automation level
 * @param {string} verdict - 'pass' | 'retry' | 'fail'
 * @param {number} automationLevel - 0-4
 * @returns {string} 'auto_proceed' | 'gate_confirm' | 'block' | 'notify'
 */
function resolveAction(verdict, automationLevel) {
  if (automationLevel <= 1) {
    // L0-L1: always notify (guide mode)
    return 'notify';
  }
  if (automationLevel === 2) {
    // L2: semi-auto
    if (verdict === 'pass') return 'auto_proceed';
    if (verdict === 'retry') return 'gate_confirm';
    return 'block';
  }
  // L3-L4: auto/full-auto
  if (verdict === 'fail') return 'block';
  return 'auto_proceed';
}

// ── Audit Trail ────────────────────────────────────────────────────

const MAX_GATE_HISTORY = 100;

/**
 * Record gate result for audit
 */
function recordGateResult(phase, result, feature) {
  try {
    const { STATE } = getPaths();
    const gateResultsPath = STATE.gateResults();
    const store = getStateStore();

    const history = store.read(gateResultsPath) || { version: 1, results: [] };
    history.results.push({
      phase,
      feature: feature || 'unknown',
      verdict: result.verdict,
      score: result.score,
      timestamp: new Date().toISOString(),
    });

    // Keep bounded
    if (history.results.length > MAX_GATE_HISTORY) {
      history.results = history.results.slice(-MAX_GATE_HISTORY);
    }

    store.write(gateResultsPath, history);
  } catch (err) {
    process.stderr.write(`[VAIS] Gate result recording failed: ${err.message}\n`);
  }
}

// ── v0.50 4-Step Pipeline Gate ─────────────────────────────────────

/**
 * Phase 완료 판정 (agent-stop.js 4단계 파이프라인 Step 3).
 * @param {Object} opts
 * @param {string} opts.feature
 * @param {string} opts.phase
 * @param {boolean} opts.documentsValid
 * @param {boolean} opts.checkpointsRecorded
 * @param {number} opts.toolCallCount
 * @returns {{pass:boolean, failures:Array, reason:string}}
 */
function judgePhaseCompletion({ feature, phase, documentsValid, checkpointsRecorded, toolCallCount }) {
  if (phase === 'ideation') {
    return { pass: true, failures: [], reason: 'ideation is optional, gate skipped' };
  }

  const failures = [];
  if (!documentsValid) failures.push({ type: 'missing_documents', phase });
  if (!checkpointsRecorded) failures.push({ type: 'no_checkpoint', phase });

  const pass = failures.length === 0;
  let reason = pass ? 'all conditions met' : failures.map(f => f.type).join(', ');
  if (pass && toolCallCount === 0) {
    reason = 'pass (warn: no tool calls logged)';
  }

  return { pass, failures, reason };
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  GATE_DEFINITIONS,
  ROLE_THRESHOLD_OVERRIDES,
  checkGate,
  getEffectiveThresholds,
  evaluateCondition,
  resolveAction,
  recordGateResult,
  judgePhaseCompletion,
};
