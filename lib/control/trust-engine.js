/**
 * VAIS Code - Trust Engine
 * @module lib/control/trust-engine
 * @version 1.0.0
 *
 * 6-component weighted trust scoring for automation level management.
 * Score 0-100 maps to L0-L4 with upgrade cooldown and downgrade detection.
 * @see bkit-claude-code/lib/control/trust-engine.js
 */

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

// ── Constants ──────────────────────────────────────────────────────

/** Trust score → automation level thresholds */
const LEVEL_THRESHOLDS = [0, 20, 40, 65, 85]; // L0:0, L1:20, L2:40, L3:65, L4:85

/** Minimum time between level upgrades */
const UPGRADE_COOLDOWN_MS = 30 * 60 * 1000; // 30 min

/** Score delta that triggers immediate downgrade */
const DOWNGRADE_DELTA = -15;

/** Trust component weights (must sum to 1.0) */
const COMPONENTS = {
  pdcaCompletionRate:   { weight: 0.25, description: 'C-Level phase completion rate' },
  gatePassRate:         { weight: 0.20, description: 'Quality gate pass rate' },
  rollbackFrequency:    { weight: 0.15, description: 'Checkpoint rollback frequency (lower=better)' },
  destructiveBlockRate: { weight: 0.15, description: 'Dangerous ops blocked (higher=better)' },
  iterationEfficiency:  { weight: 0.15, description: 'QA→Do iteration efficiency' },
  userOverrideRate:     { weight: 0.10, description: 'User intervention frequency (lower=better)' },
};

/** Score changes by event type */
const SCORE_EVENTS = {
  'consecutive_10_success': +5,
  'match_rate_95':          +3,
  '7_day_no_incident':      +5,
  'emergency_stop':         -15,
  'rollback':               -10,
  'guardrail_trigger':      -10,
  'user_interrupt':         -5,
};

// ── Profile Management ─────────────────────────────────────────────

function getDefaultProfile() {
  const components = {};
  for (const [key, def] of Object.entries(COMPONENTS)) {
    components[key] = { weight: def.weight, value: 50 }; // Start neutral
  }
  return {
    version: 1,
    trustScore: 50,
    currentLevel: 2,
    components,
    stats: {
      totalPdcaCycles: 0,
      completedPdcaCycles: 0,
      totalGateChecks: 0,
      passedGateChecks: 0,
      totalRollbacks: 0,
      totalDestructiveBlocks: 0,
      consecutiveSuccesses: 0,
      lastIncidentAt: null,
    },
    levelHistory: [],
    lastUpgradeAt: null,
  };
}

/**
 * Load trust profile from disk
 */
function loadProfile() {
  const { STATE } = getPaths();
  const store = getStateStore();
  return store.read(STATE.trustProfile()) || getDefaultProfile();
}

/**
 * Save trust profile
 */
function saveProfile(profile) {
  const { STATE } = getPaths();
  const store = getStateStore();
  store.write(STATE.trustProfile(), profile);
}

// ── Score Calculation ──────────────────────────────────────────────

/**
 * Calculate weighted trust score from components
 * @param {Object} profile
 * @returns {number} 0-100
 */
function calculateScore(profile) {
  let score = 0;
  for (const [key, comp] of Object.entries(profile.components)) {
    score += (comp.value || 0) * (comp.weight || 0);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Update component values from stats
 */
function updateComponentValues(profile) {
  const s = profile.stats;

  // pdcaCompletionRate: completed / total
  if (s.totalPdcaCycles > 0) {
    profile.components.pdcaCompletionRate.value =
      Math.round((s.completedPdcaCycles / s.totalPdcaCycles) * 100);
  }

  // gatePassRate: passed / total
  if (s.totalGateChecks > 0) {
    profile.components.gatePassRate.value =
      Math.round((s.passedGateChecks / s.totalGateChecks) * 100);
  }

  // rollbackFrequency: inverse (fewer rollbacks = higher score)
  const rollbackPer100 = s.totalPdcaCycles > 0
    ? (s.totalRollbacks / s.totalPdcaCycles) * 100 : 0;
  profile.components.rollbackFrequency.value =
    Math.max(0, Math.round(100 - rollbackPer100 * 10));

  // destructiveBlockRate
  profile.components.destructiveBlockRate.value =
    Math.min(100, s.totalDestructiveBlocks * 5 + 50);

  // iterationEfficiency: consecutive successes
  profile.components.iterationEfficiency.value =
    Math.min(100, s.consecutiveSuccesses * 10 + 30);

  // userOverrideRate: starts at 80, decreases with incidents
  const daysSinceIncident = s.lastIncidentAt
    ? Math.max(0, (Date.now() - new Date(s.lastIncidentAt).getTime()) / (24 * 60 * 60 * 1000))
    : 30;
  profile.components.userOverrideRate.value =
    Math.min(100, Math.round(50 + daysSinceIncident * 2));
}

// ── Event Recording ────────────────────────────────────────────────

/**
 * Record a trust-affecting event
 * @param {string} eventType - Event key from SCORE_EVENTS or stat events
 * @param {Object} [details]
 * @returns {{scoreChange:number, newScore:number, levelChange:Object|null}}
 */
function recordEvent(eventType, details = {}) {
  const profile = loadProfile();
  const previousScore = profile.trustScore;

  // Update stats based on event
  switch (eventType) {
    case 'pdca_complete':
      profile.stats.totalPdcaCycles++;
      profile.stats.completedPdcaCycles++;
      profile.stats.consecutiveSuccesses++;
      break;
    case 'pdca_start':
      profile.stats.totalPdcaCycles++;
      break;
    case 'gate_pass':
      profile.stats.totalGateChecks++;
      profile.stats.passedGateChecks++;
      break;
    case 'gate_fail':
      profile.stats.totalGateChecks++;
      break;
    case 'rollback':
      profile.stats.totalRollbacks++;
      profile.stats.consecutiveSuccesses = 0;
      profile.stats.lastIncidentAt = new Date().toISOString();
      break;
    case 'guardrail_trigger':
    case 'emergency_stop':
      profile.stats.consecutiveSuccesses = 0;
      profile.stats.lastIncidentAt = new Date().toISOString();
      break;
    case 'destructive_blocked':
      profile.stats.totalDestructiveBlocks++;
      break;
  }

  // Apply direct score adjustment
  const scoreChange = SCORE_EVENTS[eventType] || 0;

  // Recalculate
  updateComponentValues(profile);
  profile.trustScore = calculateScore(profile) + scoreChange;
  profile.trustScore = Math.max(0, Math.min(100, profile.trustScore));

  // Check level change
  const levelChange = evaluateLevel(profile.trustScore, profile.currentLevel, profile);

  if (levelChange) {
    profile.levelHistory.push({
      timestamp: new Date().toISOString(),
      from: profile.currentLevel,
      to: levelChange.toLevel,
      trigger: eventType,
    });
    profile.currentLevel = levelChange.toLevel;
    if (levelChange.direction === 'upgrade') {
      profile.lastUpgradeAt = new Date().toISOString();
    }
  }

  saveProfile(profile);

  return {
    scoreChange: profile.trustScore - previousScore,
    newScore: profile.trustScore,
    levelChange,
  };
}

/**
 * Evaluate if level should change
 */
function evaluateLevel(score, currentLevel, profile) {
  // Check upgrade
  const targetLevel = LEVEL_THRESHOLDS.findIndex((t, i) =>
    i === LEVEL_THRESHOLDS.length - 1 || score < LEVEL_THRESHOLDS[i + 1]
  );

  if (targetLevel > currentLevel) {
    // Check cooldown
    if (profile && profile.lastUpgradeAt) {
      const elapsed = Date.now() - new Date(profile.lastUpgradeAt).getTime();
      if (elapsed < UPGRADE_COOLDOWN_MS) return null;
    }
    return { direction: 'upgrade', toLevel: targetLevel };
  }

  if (targetLevel < currentLevel) {
    return { direction: 'downgrade', toLevel: targetLevel };
  }

  return null;
}

/**
 * Get current trust score
 */
function getScore() {
  const profile = loadProfile();
  updateComponentValues(profile);
  return calculateScore(profile);
}

/**
 * Get full profile
 */
function getProfile() {
  return loadProfile();
}

/**
 * Reset trust score
 */
function resetScore(initialScore, reason) {
  const profile = loadProfile();
  profile.trustScore = initialScore || 50;
  profile.levelHistory.push({
    timestamp: new Date().toISOString(),
    from: profile.currentLevel,
    to: 2,
    trigger: `reset: ${reason}`,
  });
  profile.currentLevel = 2;
  saveProfile(profile);
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  LEVEL_THRESHOLDS,
  COMPONENTS,
  SCORE_EVENTS,
  UPGRADE_COOLDOWN_MS,

  loadProfile,
  saveProfile,
  calculateScore,
  recordEvent,
  evaluateLevel,
  getScore,
  getProfile,
  resetScore,
};
