/**
 * VAIS Code - Declarative 2-Level State Machine
 * @module lib/core/state-machine
 * @version 1.0.0
 *
 * VAIS uses a 2-level FSM:
 *   Pipeline level: CEO→CPO→CTO→CSO→CMO→COO→CFO (service launch)
 *   Phase level: plan→design→do→qa→report (per C-Level role)
 *
 * Tech-only mode (CTO direct) uses phase-level only.
 * @see bkit-claude-code/lib/pdca/state-machine.js
 */

const fs = require('fs');
const path = require('path');

// Lazy requires
let _paths = null;
function getPaths() {
  if (!_paths) { _paths = require('../paths'); }
  return _paths;
}

let _debug = null;
function getDebug() {
  if (!_debug) { _debug = require('../debug'); }
  return _debug;
}

// ── Input Validation ──────────────────────────────────────────────

const SAFE_NAME_RE = /^[a-zA-Z0-9가-힣_-]+$/;

function validatePathComponent(value, label) {
  if (!value || typeof value !== 'string' || !SAFE_NAME_RE.test(value)) {
    throw new Error(`Invalid ${label}: "${value}" — only alphanumeric, 한글, -, _ allowed`);
  }
}

// ── Valid States & Events ──────────────────────────────────────────

/** Phase-level states */
const PHASE_STATES = [
  'idle', 'plan', 'design', 'do', 'qa', 'report', 'completed', 'error',
];

/** Pipeline-level states (C-Suite roles) */
const PIPELINE_ROLES = ['cpo', 'cto', 'cso', 'cmo', 'coo', 'cfo'];

/** All valid events */
const EVENTS = [
  // Phase events
  'START', 'PLAN_DONE', 'DESIGN_DONE', 'DO_COMPLETE',
  'QA_PASS', 'QA_ITERATE', 'REPORT_DONE',
  // Pipeline events
  'ROLE_DONE', 'ROLE_SKIP',
  // Error/recovery
  'ERROR', 'RECOVER', 'RESET', 'ROLLBACK',
  // Lifecycle
  'TIMEOUT', 'ABANDON',
];

// ── Phase Transition Table ─────────────────────────────────────────

/**
 * Phase-level transitions (within a single C-Level role).
 * @type {Array<{from:string, event:string, to:string, guard:string|null, actions:string[], description:string}>}
 */
const PHASE_TRANSITIONS = [
  // Normal forward flow
  {
    from: 'idle', event: 'START', to: 'plan',
    guard: null,
    actions: ['initPhase', 'recordTimestamp'],
    description: 'Begin phase cycle with plan',
  },
  {
    from: 'plan', event: 'PLAN_DONE', to: 'design',
    guard: 'guardDeliverableExists',
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'Plan complete, proceed to design',
  },
  {
    from: 'design', event: 'DESIGN_DONE', to: 'do',
    guard: 'guardDeliverableExists',
    actions: ['recordTimestamp', 'notifyPhaseComplete', 'createCheckpoint'],
    description: 'Design approved, proceed to implementation',
  },
  {
    from: 'do', event: 'DO_COMPLETE', to: 'qa',
    guard: null,
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'Implementation complete, proceed to QA',
  },
  {
    from: 'qa', event: 'QA_PASS', to: 'report',
    guard: 'guardMatchRatePass',
    actions: ['recordTimestamp', 'notifyPhaseComplete', 'recordMatchRate'],
    description: 'QA passed (match rate >= threshold), proceed to report',
  },
  {
    from: 'qa', event: 'QA_ITERATE', to: 'do',
    guard: 'guardCanIterate',
    actions: ['recordTimestamp', 'incrementIteration'],
    description: 'QA failed, iterate back to do',
  },
  {
    from: 'report', event: 'REPORT_DONE', to: 'completed',
    guard: null,
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'Report complete, role cycle done',
  },
  // Max iteration force report
  {
    from: 'qa', event: 'REPORT_DONE', to: 'report',
    guard: 'guardMaxIterReached',
    actions: ['recordTimestamp', 'forceReport'],
    description: 'Max iterations reached, force report',
  },
  // Error / Recovery
  {
    from: '*', event: 'ERROR', to: 'error',
    guard: null,
    actions: ['recordTimestamp', 'saveResumePoint'],
    description: 'Error occurred, save resume point',
  },
  {
    from: 'error', event: 'RECOVER', to: '*',
    guard: 'guardResumeAvailable',
    actions: ['recordTimestamp', 'restoreFromResume'],
    description: 'Recover from error',
  },
  {
    from: '*', event: 'RESET', to: 'idle',
    guard: null,
    actions: ['recordTimestamp', 'cleanupPhase'],
    description: 'Reset to idle',
  },
  {
    from: '*', event: 'ROLLBACK', to: '*',
    guard: 'guardCheckpointExists',
    actions: ['recordTimestamp', 'restoreCheckpoint'],
    description: 'Rollback to checkpoint',
  },
  {
    from: '*', event: 'TIMEOUT', to: 'completed',
    guard: 'guardStaleFeature',
    actions: ['recordTimestamp', 'archiveStale'],
    description: 'Stale feature auto-archived (7d inactive)',
  },
  {
    from: '*', event: 'ABANDON', to: 'completed',
    guard: null,
    actions: ['recordTimestamp', 'archiveAbandoned'],
    description: 'Feature explicitly abandoned',
  },
];

// ── Guard Functions ────────────────────────────────────────────────

const GUARDS = {
  /** Phase deliverable (doc) exists */
  guardDeliverableExists(ctx) {
    const { findDoc } = getPaths();
    const phase = ctx.currentPhase;
    const docPath = findDoc(phase, ctx.feature, ctx.role);
    return !!docPath;
  },

  /** Match rate >= threshold (default 90%) */
  guardMatchRatePass(ctx) {
    const { loadConfig } = getPaths();
    const config = loadConfig();
    const threshold = config.gapAnalysis?.matchThreshold || 90;
    return (ctx.matchRate || 0) >= threshold;
  },

  /** More iterations allowed */
  guardCanIterate(ctx) {
    const { loadConfig } = getPaths();
    const config = loadConfig();
    const max = config.gapAnalysis?.maxIterations || 5;
    return (ctx.iterationCount || 0) < max;
  },

  /** Max iterations reached */
  guardMaxIterReached(ctx) {
    const { loadConfig } = getPaths();
    const config = loadConfig();
    const max = config.gapAnalysis?.maxIterations || 5;
    return (ctx.iterationCount || 0) >= max;
  },

  /** Resume data exists */
  guardResumeAvailable(ctx) {
    const { PROJECT_DIR } = getPaths();
    const resumePath = path.join(
      PROJECT_DIR, '.vais', 'resume', `${ctx.feature}.resume.json`
    );
    return fs.existsSync(resumePath);
  },

  /** Checkpoint exists for rollback */
  guardCheckpointExists(ctx) {
    const { PROJECT_DIR } = getPaths();
    const cpDir = path.join(PROJECT_DIR, '.vais', 'checkpoints');
    if (!fs.existsSync(cpDir)) return false;
    try {
      return fs.readdirSync(cpDir).some(f => f.includes(ctx.feature));
    } catch (_) {
      return false;
    }
  },

  /** Feature inactive 7+ days */
  guardStaleFeature(ctx) {
    const lastUpdated = ctx.timestamps?.lastUpdated;
    if (!lastUpdated) return false;
    const date = new Date(lastUpdated);
    if (isNaN(date.getTime())) return false;
    const elapsed = Date.now() - date.getTime();
    return elapsed >= 7 * 24 * 60 * 60 * 1000;
  },
};

// ── Action Functions ───────────────────────────────────────────────

const ACTIONS = {
  initPhase(ctx, _event) {
    ctx.iterationCount = 0;
    ctx.matchRate = null;
    ctx.timestamps = ctx.timestamps || {};
    ctx.timestamps.started = new Date().toISOString();
  },

  recordTimestamp(ctx, _event) {
    ctx.timestamps = ctx.timestamps || {};
    ctx.timestamps[ctx.currentPhase] = new Date().toISOString();
    ctx.timestamps.lastUpdated = new Date().toISOString();
  },

  notifyPhaseComplete(ctx, _event) {
    const { debugLog } = getDebug();
    debugLog('SM', `Phase complete: ${ctx.currentPhase}`, {
      feature: ctx.feature, role: ctx.role,
    });
  },

  createCheckpoint(ctx, _event) {
    const { PROJECT_DIR } = getPaths();
    const cpDir = path.join(PROJECT_DIR, '.vais', 'checkpoints');
    try {
      if (!fs.existsSync(cpDir)) fs.mkdirSync(cpDir, { recursive: true });
      const cpFile = path.join(cpDir, `cp-${ctx.feature}-${ctx.role}-${Date.now()}.json`);
      fs.writeFileSync(cpFile, JSON.stringify({
        feature: ctx.feature,
        role: ctx.role,
        phase: ctx.currentPhase,
        timestamp: new Date().toISOString(),
        context: { matchRate: ctx.matchRate, iterationCount: ctx.iterationCount },
      }, null, 2));
    } catch (err) {
      const { debugLog: dl } = getDebug();
      dl('SM', `createCheckpoint failed: ${err.message}`, { feature: ctx.feature });
    }
  },

  recordMatchRate(ctx, _event) {
    // Recorded in context, synced by caller
  },

  incrementIteration(ctx, _event) {
    ctx.iterationCount = (ctx.iterationCount || 0) + 1;
  },

  forceReport(ctx, _event) {
    const { debugLog } = getDebug();
    debugLog('SM', 'Max iterations reached, forcing report', {
      feature: ctx.feature, iterations: ctx.iterationCount,
    });
  },

  saveResumePoint(ctx, _event) {
    const { PROJECT_DIR } = getPaths();
    const resumeDir = path.join(PROJECT_DIR, '.vais', 'resume');
    try {
      if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });
      fs.writeFileSync(
        path.join(resumeDir, `${ctx.feature}.resume.json`),
        JSON.stringify({
          feature: ctx.feature,
          role: ctx.role,
          previousPhase: ctx.currentPhase,
          timestamp: new Date().toISOString(),
          context: { matchRate: ctx.matchRate, iterationCount: ctx.iterationCount },
        }, null, 2)
      );
    } catch (err) {
      const { debugLog: dl } = getDebug();
      dl('SM', `saveResumePoint failed: ${err.message}`, { feature: ctx.feature });
    }
  },

  restoreFromResume(ctx, _event) {
    const { PROJECT_DIR } = getPaths();
    const resumeFile = path.join(
      PROJECT_DIR, '.vais', 'resume', `${ctx.feature}.resume.json`
    );
    try {
      if (fs.existsSync(resumeFile)) {
        const data = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
        ctx.currentPhase = data.previousPhase || 'idle';
        ctx.matchRate = data.context?.matchRate || ctx.matchRate;
        ctx.iterationCount = data.context?.iterationCount || ctx.iterationCount;
        fs.unlinkSync(resumeFile);
      }
    } catch (err) {
      const { debugLog: dl } = getDebug();
      dl('SM', `restoreFromResume failed: ${err.message}`, { feature: ctx.feature });
    }
  },

  restoreCheckpoint(ctx, _event) {
    const { PROJECT_DIR } = getPaths();
    const cpDir = path.join(PROJECT_DIR, '.vais', 'checkpoints');
    try {
      const files = fs.readdirSync(cpDir)
        .filter(f => f.includes(ctx.feature))
        .sort().reverse();
      if (files.length > 0) {
        const data = JSON.parse(fs.readFileSync(path.join(cpDir, files[0]), 'utf8'));
        ctx.currentPhase = data.phase || 'idle';
        ctx.matchRate = data.context?.matchRate || 0;
        ctx.iterationCount = data.context?.iterationCount || 0;
      }
    } catch (err) {
      const { debugLog: dl } = getDebug();
      dl('SM', `restoreCheckpoint failed: ${err.message}`, { feature: ctx.feature });
    }
  },

  cleanupPhase(ctx, _event) {
    ctx.iterationCount = 0;
    ctx.matchRate = null;
  },

  archiveStale(ctx, _event) {
    ctx.archivedReason = 'timeout';
    ctx.timestamps = ctx.timestamps || {};
    ctx.timestamps.archivedAt = new Date().toISOString();
  },

  archiveAbandoned(ctx, _event) {
    ctx.archivedReason = 'abandoned';
    ctx.timestamps = ctx.timestamps || {};
    ctx.timestamps.archivedAt = new Date().toISOString();
  },
};

// ── Core Transition Engine ─────────────────────────────────────────

/**
 * Find matching transition from table
 * @param {Array} table - Transition table
 * @param {string} from - Current state
 * @param {string} event - Trigger event
 * @returns {Object|null}
 */
function findTransition(table, from, event) {
  return table.find(t => t.from === from && t.event === event)
    || table.find(t => t.from === '*' && t.event === event)
    || null;
}

/**
 * Execute a phase-level transition
 * @param {string} currentPhase - Current phase state
 * @param {string} event - Trigger event
 * @param {Object} ctx - Context {feature, role, matchRate, iterationCount, timestamps, metadata}
 * @returns {{success:boolean, previousPhase:string, currentPhase:string, event:string, executedActions:string[], blockedBy:string|null}}
 */
function transition(currentPhase, event, ctx) {
  const { debugLog } = getDebug();

  // Validate context to prevent path traversal in file operations
  validatePathComponent(ctx.feature, 'feature');
  validatePathComponent(ctx.role, 'role');

  const entry = findTransition(PHASE_TRANSITIONS, currentPhase, event);

  if (!entry) {
    debugLog('SM', 'No transition found', { from: currentPhase, event });
    return {
      success: false,
      previousPhase: currentPhase,
      currentPhase,
      event,
      executedActions: [],
      blockedBy: 'no_transition',
    };
  }

  // Evaluate guard
  if (entry.guard) {
    const guardFn = GUARDS[entry.guard];
    if (!guardFn) {
      throw new Error(`Missing guard function: ${entry.guard}`);
    }
    if (!guardFn(ctx)) {
      debugLog('SM', 'Guard blocked', { from: currentPhase, event, guard: entry.guard });
      return {
        success: false,
        previousPhase: currentPhase,
        currentPhase,
        event,
        executedActions: [],
        blockedBy: entry.guard,
      };
    }
  }

  // Determine target
  let targetPhase = entry.to;
  if (targetPhase === '*') {
    targetPhase = ctx.currentPhase || currentPhase;
  }

  const previousPhase = currentPhase;
  ctx.currentPhase = targetPhase;

  // Execute actions
  const executedActions = [];
  for (const actionName of entry.actions) {
    const actionFn = ACTIONS[actionName];
    if (actionFn) {
      try {
        actionFn(ctx, event);
        executedActions.push(actionName);
      } catch (err) {
        debugLog('SM', `Action failed: ${actionName}`, { error: err.message });
      }
    }
  }

  // Re-read for dynamic targets
  if (entry.to === '*') {
    targetPhase = ctx.currentPhase;
  }

  debugLog('SM', 'Transition complete', {
    from: previousPhase, to: targetPhase, event, role: ctx.role,
  });

  return {
    success: true,
    previousPhase,
    currentPhase: targetPhase,
    event,
    executedActions,
    blockedBy: null,
  };
}

/**
 * Check if transition is possible without executing
 */
function canTransition(currentPhase, event, ctx) {
  const entry = findTransition(PHASE_TRANSITIONS, currentPhase, event);
  if (!entry) return false;
  if (entry.guard && ctx) {
    const guardFn = GUARDS[entry.guard];
    if (guardFn && !guardFn(ctx)) return false;
  }
  return true;
}

/**
 * Get available events for current phase
 */
function getAvailableEvents(currentPhase, ctx) {
  const results = [];
  const seen = new Set();
  for (const entry of PHASE_TRANSITIONS) {
    if (entry.from !== currentPhase && entry.from !== '*') continue;
    if (seen.has(entry.event)) continue;
    let passable = true;
    if (entry.guard && ctx) {
      const guardFn = GUARDS[entry.guard];
      if (guardFn && !guardFn(ctx)) passable = false;
    }
    if (passable) {
      results.push({ event: entry.event, target: entry.to, guard: entry.guard });
      seen.add(entry.event);
    }
  }
  return results;
}

// ── Pipeline-Level Helpers ─────────────────────────────────────────

/**
 * Get next role in launch pipeline
 * @param {string} currentRole - Current C-Level role
 * @returns {string|null} Next role or null if last
 */
function getNextPipelineRole(currentRole) {
  const { loadConfig } = getPaths();
  const config = loadConfig();
  const order = config.cSuite?.launchPipeline?.order || PIPELINE_ROLES;
  const idx = order.indexOf(currentRole);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

/**
 * Map phase string to event
 */
function phaseToEvent(fromPhase, toPhase) {
  const map = {
    'idle:plan': 'START',
    'plan:design': 'PLAN_DONE',
    'design:do': 'DESIGN_DONE',
    'do:qa': 'DO_COMPLETE',
    'qa:report': 'QA_PASS',
    'qa:do': 'QA_ITERATE',
    'report:completed': 'REPORT_DONE',
  };
  return map[`${fromPhase}:${toPhase}`] || null;
}

// ── Context Management ─────────────────────────────────────────────

/**
 * Create new context for a feature+role
 * @param {string} feature
 * @param {string} role - C-Level role (cto, ceo, etc.)
 * @param {Object} [overrides]
 */
function createContext(feature, role, overrides = {}) {
  validatePathComponent(feature, 'feature');
  validatePathComponent(role || 'cto', 'role');
  const { loadConfig } = getPaths();
  const config = loadConfig();
  return {
    feature,
    role: role || 'cto',
    currentPhase: 'idle',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: config.gapAnalysis?.maxIterations || 5,
    automationLevel: config.automation?.defaultLevel || 2,
    timestamps: { created: new Date().toISOString() },
    metadata: {},
    ...overrides,
  };
}

/**
 * ASCII diagram for debugging
 */
function printDiagram() {
  const lines = ['VAIS Phase State Machine', '========================', ''];
  for (const t of PHASE_TRANSITIONS) {
    const guard = t.guard ? ` [${t.guard}]` : '';
    const from = t.from === '*' ? '(any)' : t.from;
    const to = t.to === '*' ? '(dynamic)' : t.to;
    lines.push(`  ${from} --${t.event}${guard}--> ${to}`);
  }
  return lines.join('\n');
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  // Constants
  PHASE_STATES,
  PIPELINE_ROLES,
  EVENTS,
  PHASE_TRANSITIONS,
  GUARDS,
  ACTIONS,

  // Core API
  transition,
  canTransition,
  getAvailableEvents,
  findTransition: (from, event) => findTransition(PHASE_TRANSITIONS, from, event),

  // Pipeline
  getNextPipelineRole,

  // Context
  createContext,

  // Utility
  phaseToEvent,
  printDiagram,
};
