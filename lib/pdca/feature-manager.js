/**
 * VAIS Code - Feature Manager
 * @module lib/pdca/feature-manager
 * @version 1.0.0
 *
 * Manages parallel features, Do-phase exclusivity (mutex lock),
 * and feature dependencies with cycle detection.
 * @see bkit-claude-code/lib/pdca/feature-manager.js
 */

const fs = require('fs');
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

let _status = null;
function getStatusMod() {
  if (!_status) { _status = require('../status'); }
  return _status;
}

// ── Constants ──────────────────────────────────────────────────────

const MAX_CONCURRENT_FEATURES = 3;
const MAX_CONCURRENT_DO = 1;
const DO_LOCK_TIMEOUT_MS = 3600000; // 1 hour

// ── Do-Lock (Implementation Phase Exclusivity) ─────────────────────

function getDoLockPath() {
  const { STATE } = getPaths();
  return STATE.doLock();
}

/**
 * Acquire Do-phase lock
 * @param {string} feature
 * @param {string} [acquiredBy='auto']
 * @returns {{acquired:boolean, heldBy:string|null}}
 */
function acquireDoLock(feature, acquiredBy = 'auto') {
  const store = getStateStore();
  const lockPath = getDoLockPath();
  const existing = store.read(lockPath);

  // Check if already locked by another feature
  if (existing && existing.feature && existing.feature !== feature) {
    const acquiredDate = new Date(existing.acquiredAt);
    const elapsed = isNaN(acquiredDate.getTime()) ? DO_LOCK_TIMEOUT_MS : Date.now() - acquiredDate.getTime();
    if (elapsed < DO_LOCK_TIMEOUT_MS) {
      return { acquired: false, heldBy: existing.feature };
    }
    // Expired — release and acquire
  }

  // Re-entrant: same feature can re-acquire
  store.write(lockPath, {
    feature,
    acquiredAt: new Date().toISOString(),
    acquiredBy,
    timeoutMs: DO_LOCK_TIMEOUT_MS,
  });

  return { acquired: true, heldBy: null };
}

/**
 * Release Do-phase lock
 * @param {string} feature
 * @returns {boolean}
 */
function releaseDoLock(feature) {
  const store = getStateStore();
  const lockPath = getDoLockPath();
  const existing = store.read(lockPath);

  if (!existing || existing.feature !== feature) return false;

  store.remove(lockPath);
  return true;
}

/**
 * Get current Do-lock state
 */
function getDoLock() {
  const store = getStateStore();
  const lock = store.read(getDoLockPath());

  if (lock && lock.feature) {
    const elapsed = Date.now() - new Date(lock.acquiredAt).getTime();
    if (elapsed >= DO_LOCK_TIMEOUT_MS) {
      store.remove(getDoLockPath());
      return { feature: null, expired: true };
    }
  }

  return lock || { feature: null };
}

// ── Feature Management ─────────────────────────────────────────────

/**
 * Get active features list
 * @returns {{features:string[], activeCount:number, doPhaseFeature:string|null}}
 */
function getActiveFeatures() {
  const { getStatus } = getStatusMod();
  const status = getStatus() || {};
  const features = Object.keys(status.features || {}).filter(f => {
    const feat = status.features[f];
    const phase = feat.fsmState?.phase || feat.currentPhase || 'idle';
    return phase !== 'completed' && phase !== 'idle';
  });

  const doLock = getDoLock();

  return {
    features,
    activeCount: features.length,
    doPhaseFeature: doLock.feature || null,
  };
}

/**
 * Check if a new feature can be started
 * @param {string} feature
 * @returns {{allowed:boolean, reason:string|null, activeCount:number}}
 */
function canStartFeature(feature) {
  const { features, activeCount } = getActiveFeatures();

  if (features.includes(feature)) {
    return { allowed: true, reason: null, activeCount }; // Already active
  }

  if (activeCount >= MAX_CONCURRENT_FEATURES) {
    return {
      allowed: false,
      reason: `Max concurrent features (${MAX_CONCURRENT_FEATURES}) reached. Active: ${features.join(', ')}`,
      activeCount,
    };
  }

  return { allowed: true, reason: null, activeCount };
}

/**
 * Check for phase conflict
 * @param {string} feature
 * @param {string} targetPhase
 * @returns {{conflict:boolean, conflictWith:string|null, reason:string|null}}
 */
function checkConflict(feature, targetPhase) {
  if (targetPhase !== 'do') {
    return { conflict: false, conflictWith: null, reason: null };
  }

  const doLock = getDoLock();
  if (doLock.feature && doLock.feature !== feature) {
    return {
      conflict: true,
      conflictWith: doLock.feature,
      reason: `Do-phase locked by feature "${doLock.feature}"`,
    };
  }

  return { conflict: false, conflictWith: null, reason: null };
}

// ── Dependencies ───────────────────────────────────────────────────

/** @type {Map<string, string[]>} feature → dependsOn */
const _dependencies = new Map();

/**
 * Set feature dependencies
 * @param {string} feature
 * @param {string[]} dependsOn
 * @returns {{success:boolean, reason:string|null}}
 */
function setDependencies(feature, dependsOn) {
  const validation = validateDependencies(feature, dependsOn);
  if (!validation.valid) {
    return { success: false, reason: `Circular dependency: ${validation.cycle.join(' → ')}` };
  }
  _dependencies.set(feature, dependsOn);
  return { success: true, reason: null };
}

/**
 * Validate dependencies for circular references (DFS)
 * @param {string} feature
 * @param {string[]} dependsOn
 * @returns {{valid:boolean, cycle:string[]}}
 */
function validateDependencies(feature, dependsOn) {
  const tempDeps = new Map(_dependencies);
  tempDeps.set(feature, dependsOn);

  const visited = new Set();
  const stack = new Set();

  function dfs(node, path) {
    if (stack.has(node)) return [...path, node]; // Cycle found
    if (visited.has(node)) return null;

    visited.add(node);
    stack.add(node);

    const deps = tempDeps.get(node) || [];
    for (const dep of deps) {
      const cycle = dfs(dep, [...path, node]);
      if (cycle) return cycle;
    }

    stack.delete(node);
    return null;
  }

  const cycle = dfs(feature, []);
  return { valid: !cycle, cycle: cycle || [] };
}

/**
 * Get feature dashboard summary
 * @returns {string}
 */
function getSummary() {
  const { features, activeCount, doPhaseFeature } = getActiveFeatures();
  return {
    active: activeCount,
    maxAllowed: MAX_CONCURRENT_FEATURES,
    doLocked: doPhaseFeature,
    features,
  };
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  MAX_CONCURRENT_FEATURES,
  MAX_CONCURRENT_DO,
  DO_LOCK_TIMEOUT_MS,

  // Do-Lock
  acquireDoLock,
  releaseDoLock,
  getDoLock,

  // Feature Management
  getActiveFeatures,
  canStartFeature,
  checkConflict,

  // Dependencies
  setDependencies,
  validateDependencies,

  // Dashboard
  getSummary,
};
