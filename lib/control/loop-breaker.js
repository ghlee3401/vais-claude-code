/**
 * VAIS Code - Loop Breaker
 * @module lib/control/loop-breaker
 * @version 1.0.0
 *
 * Detects and breaks infinite loops: PDCA iterations, file edits,
 * agent recursion, error retries.
 * @see bkit-claude-code/lib/control/loop-breaker.js
 */

// ── Loop Rules ─────────────────────────────────────────────────────

const LOOP_RULES = {
  'LB-001': {
    name: 'PDCA iteration loop',
    description: 'qa→do→qa cycle count',
    maxCount: 5,
    warnAt: 3,
    action: 'abort',
  },
  'LB-002': {
    name: 'Same file edit loop',
    description: 'Same file modified repeatedly',
    maxCount: 10,
    warnAt: 7,
    action: 'pause',
  },
  'LB-003': {
    name: 'Agent recursion',
    description: 'A→B→A agent call pattern',
    maxCount: 3,
    warnAt: 2,
    action: 'abort',
  },
  'LB-004': {
    name: 'Error retry loop',
    description: 'Same error recurring',
    maxCount: 3,
    warnAt: 2,
    action: 'pause',
  },
};

// ── In-Memory Counters (session-scoped) ────────────────────────────

/** @type {Map<string, number>} feature → iteration count */
const _pdcaIterations = new Map();

/** @type {Map<string, number>} filePath → edit count */
const _fileEdits = new Map();

/** @type {string[]} agent call stack for recursion detection */
const _agentCallStack = [];

/** @type {Map<string, number>} errorSignature → count */
const _errorRetries = new Map();

// ── Core API ───────────────────────────────────────────────────────

/**
 * Record an action and check for loops
 * @param {string} type - 'pdca_iteration' | 'file_edit' | 'agent_call' | 'error'
 * @param {string} target - Feature name / file path / agent name / error message
 * @returns {{detected:boolean, rule:string|null, count:number, action:string|null, warning:boolean}}
 */
function recordAction(type, target) {
  switch (type) {
    case 'pdca_iteration': {
      const count = (_pdcaIterations.get(target) || 0) + 1;
      _pdcaIterations.set(target, count);
      return _checkRule('LB-001', count);
    }
    case 'file_edit': {
      const count = (_fileEdits.get(target) || 0) + 1;
      _fileEdits.set(target, count);
      return _checkRule('LB-002', count);
    }
    case 'agent_call': {
      _agentCallStack.push(target);
      // Check A→B→A pattern
      const len = _agentCallStack.length;
      let recursionDepth = 0;
      if (len >= 3) {
        for (let i = len - 1; i >= 2; i--) {
          if (_agentCallStack[i] === _agentCallStack[i - 2]) {
            recursionDepth++;
          }
        }
      }
      return _checkRule('LB-003', recursionDepth);
    }
    case 'error': {
      const sig = target.substring(0, 100); // Truncate for key
      const count = (_errorRetries.get(sig) || 0) + 1;
      _errorRetries.set(sig, count);
      return _checkRule('LB-004', count);
    }
    default:
      return { detected: false, rule: null, count: 0, action: null, warning: false };
  }
}

/**
 * Check rule against count
 * @private
 */
function _checkRule(ruleId, count) {
  const rule = LOOP_RULES[ruleId];
  if (!rule) return { detected: false, rule: null, count, action: null, warning: false };

  const detected = count >= rule.maxCount;
  const warning = !detected && count >= rule.warnAt;

  return {
    detected,
    rule: ruleId,
    count,
    action: detected ? rule.action : null,
    warning,
  };
}

/**
 * Check all counters without recording
 * @returns {{detected:boolean, rule:string|null, details:Object}}
 */
function checkLoop() {
  // Check highest counts
  for (const [feature, count] of _pdcaIterations) {
    const r = _checkRule('LB-001', count);
    if (r.detected) return { ...r, details: { feature } };
  }
  for (const [file, count] of _fileEdits) {
    const r = _checkRule('LB-002', count);
    if (r.detected) return { ...r, details: { file } };
  }
  for (const [sig, count] of _errorRetries) {
    const r = _checkRule('LB-004', count);
    if (r.detected) return { ...r, details: { error: sig } };
  }
  return { detected: false, rule: null, count: 0, action: null, warning: false };
}

/**
 * Reset counters
 * @param {string} scope - 'all' | 'session' | 'feature'
 * @param {string} [target] - Feature name for 'feature' scope
 */
function reset(scope, target) {
  if (scope === 'all' || scope === 'session') {
    _pdcaIterations.clear();
    _fileEdits.clear();
    _agentCallStack.length = 0;
    _errorRetries.clear();
  } else if (scope === 'feature' && target) {
    _pdcaIterations.delete(target);
  }
}

/**
 * Get current counters for debugging
 */
function getCounters() {
  return {
    pdcaIterations: Object.fromEntries(_pdcaIterations),
    fileEdits: Object.fromEntries(_fileEdits),
    agentCallStack: [..._agentCallStack],
    errorRetries: Object.fromEntries(_errorRetries),
  };
}

/**
 * Override threshold for a rule at runtime
 */
function setThreshold(ruleId, newMax) {
  if (LOOP_RULES[ruleId]) {
    LOOP_RULES[ruleId].maxCount = newMax;
  }
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  LOOP_RULES,
  recordAction,
  checkLoop,
  reset,
  getCounters,
  setThreshold,
};
