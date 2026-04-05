/**
 * VAIS Code - Automation Level Controller (L0-L4)
 * @module lib/control/automation-controller
 * @version 1.0.0
 *
 * 5-level automation control with gate configuration,
 * destructive operation handling, and runtime state.
 * @see bkit-claude-code/lib/control/automation-controller.js
 */

const fs = require('fs');

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

// ── Automation Levels ──────────────────────────────────────────────

const LEVELS = {
  MANUAL: 0,      // All actions require approval
  GUIDED: 1,      // Read auto, write approval
  SEMI_AUTO: 2,   // Non-destructive auto, destructive approval (DEFAULT)
  AUTO: 3,        // Most auto, high-risk approval only
  FULL_AUTO: 4,   // All auto, post-review only
};

const DEFAULT_LEVEL = LEVELS.SEMI_AUTO;

const LEVEL_NAMES = {
  0: 'manual',
  1: 'guided',
  2: 'semi-auto',
  3: 'auto',
  4: 'full-auto',
};

// ── Phase Gate Configuration ───────────────────────────────────────

/**
 * Which automation level auto-approves each phase transition.
 * required: true means gate cannot be skipped.
 */
const GATE_CONFIG = {
  'idle:plan':      { required: false, autoApproveLevel: 1 },
  'plan:design':    { required: true,  autoApproveLevel: 2 },
  'design:do':      { required: true,  autoApproveLevel: 2 },
  'do:qa':          { required: true,  autoApproveLevel: 3 },
  'qa:report':      { required: true,  autoApproveLevel: 2 },
  'qa:do':          { required: true,  autoApproveLevel: 2 },  // Iteration
  'report:completed': { required: true, autoApproveLevel: 3 },
};

// ── Destructive Operations ─────────────────────────────────────────

/**
 * Classification of destructive operations and required levels.
 */
const DESTRUCTIVE_OPS = {
  'file_delete':      { autoLevel: 4, denyBelow: 0 },
  'bash_dangerous':   { autoLevel: 3, denyBelow: 2 },
  'bash_destructive': { autoLevel: 4, denyBelow: 3 },
  'git_push_force':   { autoLevel: 4, denyBelow: 4 },
  'git_push':         { autoLevel: 3, denyBelow: 2 },
  'config_change':    { autoLevel: 4, denyBelow: 2 },
  'external_api':     { autoLevel: 3, denyBelow: 2 },
};

// ── Runtime State ──────────────────────────────────────────────────

function getDefaultRuntimeState() {
  return {
    version: 1,
    currentLevel: DEFAULT_LEVEL,
    previousLevel: null,
    levelChangedAt: null,
    levelChangeReason: null,
    emergencyStop: false,
    sessionStats: {
      approvals: 0,
      rejections: 0,
      destructiveBlocked: 0,
      checkpointsCreated: 0,
      rollbacksPerformed: 0,
    },
  };
}

/**
 * Get current runtime state
 */
function getRuntimeState() {
  const { STATE } = getPaths();
  const store = getStateStore();
  return store.read(STATE.controlState()) || getDefaultRuntimeState();
}

/**
 * Save runtime state
 */
function saveRuntimeState(state) {
  const { STATE } = getPaths();
  const store = getStateStore();
  store.write(STATE.controlState(), state);
}

// ── Core API ───────────────────────────────────────────────────────

/**
 * Get current automation level
 * Priority: env var > runtime state > config > default
 */
function getCurrentLevel() {
  // Env override
  const envLevel = process.env.VAIS_AUTOMATION_LEVEL;
  if (envLevel !== undefined) {
    const parsed = parseInt(envLevel, 10);
    if (parsed >= 0 && parsed <= 4) return parsed;
  }

  // Runtime state
  const state = getRuntimeState();
  if (state.emergencyStop) return LEVELS.GUIDED; // Fallback

  return state.currentLevel != null ? state.currentLevel : DEFAULT_LEVEL;
}

/**
 * Set automation level
 * @param {number} level - 0-4
 * @param {Object} [options]
 * @param {string} [options.reason]
 * @param {boolean} [options.force]
 */
function setLevel(level, { reason, force } = {}) {
  if (level < 0 || level > 4) throw new Error(`Invalid level: ${level}`);

  const state = getRuntimeState();
  if (state.emergencyStop && !force) {
    throw new Error('Emergency stop active. Use force=true or emergencyResume().');
  }

  state.previousLevel = state.currentLevel;
  state.currentLevel = level;
  state.levelChangedAt = new Date().toISOString();
  state.levelChangeReason = reason || null;

  if (force) state.emergencyStop = false;

  saveRuntimeState(state);
  return state;
}

/**
 * Check if auto-advance is allowed for a phase transition
 * @param {string} fromPhase
 * @param {string} toPhase
 * @returns {boolean}
 */
function canAutoAdvance(fromPhase, toPhase) {
  const key = `${fromPhase}:${toPhase}`;
  const gate = GATE_CONFIG[key];
  if (!gate) return true; // No gate defined → allow

  const level = getCurrentLevel();
  return level >= gate.autoApproveLevel;
}

/**
 * Get gate configuration for a transition
 */
function getGateConfig(fromPhase, toPhase) {
  return GATE_CONFIG[`${fromPhase}:${toPhase}`] || null;
}

/**
 * Check if a destructive operation is allowed
 * @param {string} op - Operation type
 * @returns {'allow'|'ask'|'deny'}
 */
function isDestructiveAllowed(op) {
  const config = DESTRUCTIVE_OPS[op];
  if (!config) return 'allow';

  const level = getCurrentLevel();
  if (level >= config.autoLevel) return 'allow';
  if (level <= config.denyBelow) return 'deny';
  return 'ask';
}

/**
 * Emergency stop — drop to fallback level
 */
function emergencyStop(reason) {
  const state = getRuntimeState();
  state.previousLevel = state.currentLevel;
  state.currentLevel = LEVELS.GUIDED;
  state.emergencyStop = true;
  state.levelChangeReason = `Emergency: ${reason}`;
  state.levelChangedAt = new Date().toISOString();
  saveRuntimeState(state);
}

/**
 * Resume from emergency stop
 */
function emergencyResume(resumeLevel) {
  const state = getRuntimeState();
  state.emergencyStop = false;
  state.currentLevel = resumeLevel != null ? resumeLevel : (state.previousLevel || DEFAULT_LEVEL);
  state.levelChangeReason = 'Emergency resume';
  state.levelChangedAt = new Date().toISOString();
  saveRuntimeState(state);
}

/**
 * Increment session statistics
 */
function incrementStat(stat, delta = 1) {
  const state = getRuntimeState();
  if (state.sessionStats[stat] !== undefined) {
    state.sessionStats[stat] += delta;
    saveRuntimeState(state);
  }
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  LEVELS,
  LEVEL_NAMES,
  DEFAULT_LEVEL,
  GATE_CONFIG,
  DESTRUCTIVE_OPS,

  getCurrentLevel,
  setLevel,
  canAutoAdvance,
  getGateConfig,
  isDestructiveAllowed,
  emergencyStop,
  emergencyResume,
  getRuntimeState,
  incrementStat,
};
