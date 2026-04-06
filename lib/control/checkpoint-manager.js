/**
 * VAIS Code - Checkpoint Manager
 * @module lib/control/checkpoint-manager
 * @version 1.0.0
 *
 * SHA-256 integrity-checked state snapshots with rollback support.
 * @see bkit-claude-code/lib/control/checkpoint-manager.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const MAX_AUTO_CHECKPOINTS = 50;
const MAX_MANUAL_CHECKPOINTS = 20;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;

function validateCheckpointId(id) {
  if (!id || typeof id !== 'string' || !SAFE_ID_RE.test(id)) {
    throw new Error(`Invalid checkpoint ID: "${id}"`);
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Deterministic JSON — recursively sorted keys for stable hashing */
function stableStringify(obj) {
  return JSON.stringify(obj, (_, value) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value).sort().reduce((o, k) => { o[k] = value[k]; return o; }, {})
      : value
  );
}

function getCheckpointDir() {
  const { STATE } = getPaths();
  const dir = STATE.checkpoints();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getIndexPath() {
  return path.join(getCheckpointDir(), 'index.json');
}

function loadIndex() {
  const store = getStateStore();
  return store.read(getIndexPath()) || { version: 1, entries: [] };
}

function saveIndex(index) {
  const store = getStateStore();
  store.write(getIndexPath(), index);
}

// ── Core API ───────────────────────────────────────────────────────

/**
 * Create a state checkpoint
 * @param {string} feature
 * @param {string} phase
 * @param {string} type - 'auto' | 'manual' | 'phase_transition' | 'pre_destructive'
 * @param {string} description
 * @returns {{id:string, path:string}}
 */
function createCheckpoint(feature, phase, type, description) {
  const { STATE } = getPaths();
  const store = getStateStore();
  const cpDir = getCheckpointDir();

  // Snapshot current status
  const statusData = store.read(STATE.status());
  const statusJson = stableStringify(statusData);
  const hash = sha256(statusJson);

  const id = `cp-${Date.now()}`;
  const cpPath = path.join(cpDir, `${id}.json`);

  const checkpoint = {
    id,
    createdAt: new Date().toISOString(),
    type,
    phase,
    feature,
    description,
    statusHash: hash,
    status: statusData,
    path: cpPath,
  };

  store.write(cpPath, checkpoint);

  // Update index
  const index = loadIndex();
  index.entries.push({
    id,
    createdAt: checkpoint.createdAt,
    type,
    phase,
    feature,
    description,
    statusHash: hash,
  });
  saveIndex(index);

  return { id, path: cpPath };
}

/**
 * List checkpoints, optionally filtered by feature
 * @param {string} [feature]
 * @returns {Array}
 */
function listCheckpoints(feature) {
  const index = loadIndex();
  if (!feature) return index.entries;
  return index.entries.filter(e => e.feature === feature);
}

/**
 * Get full checkpoint data
 * @param {string} checkpointId
 * @returns {Object|null}
 */
function getCheckpoint(checkpointId) {
  validateCheckpointId(checkpointId);
  const cpDir = getCheckpointDir();
  const cpPath = path.join(cpDir, `${checkpointId}.json`);
  return getStateStore().read(cpPath);
}

/**
 * Rollback state to checkpoint
 * Verifies SHA-256 integrity before restoring.
 * @param {string} checkpointId
 * @returns {{success:boolean, reason:string}}
 */
function rollbackToCheckpoint(checkpointId) {
  const cp = getCheckpoint(checkpointId);
  if (!cp) return { success: false, reason: 'Checkpoint not found' };

  // Verify integrity
  const statusJson = stableStringify(cp.status);
  const computedHash = sha256(statusJson);
  if (computedHash !== cp.statusHash) {
    return { success: false, reason: `Integrity check failed: expected ${cp.statusHash}, got ${computedHash}` };
  }

  // Restore status
  const { STATE } = getPaths();
  const store = getStateStore();
  store.write(STATE.status(), cp.status);

  return { success: true, reason: `Restored to checkpoint ${checkpointId} (phase: ${cp.phase})` };
}

/**
 * Verify checkpoint integrity
 * @param {string} checkpointId
 * @returns {{valid:boolean, expected:string, actual:string}}
 */
function verifyCheckpoint(checkpointId) {
  const cp = getCheckpoint(checkpointId);
  if (!cp) return { valid: false, expected: '', actual: 'not_found' };

  const actual = sha256(stableStringify(cp.status));
  return {
    valid: actual === cp.statusHash,
    expected: cp.statusHash,
    actual,
  };
}

/**
 * Prune old checkpoints
 * @param {Object} [limits]
 * @returns {{removed:number}}
 */
function pruneCheckpoints(limits = {}) {
  const maxAuto = limits.maxAutoCount || MAX_AUTO_CHECKPOINTS;
  const maxManual = limits.maxManualCount || MAX_MANUAL_CHECKPOINTS;
  const cpDir = getCheckpointDir();

  const index = loadIndex();
  const autoEntries = index.entries.filter(e => e.type === 'auto');
  const manualEntries = index.entries.filter(e => e.type === 'manual');
  const otherEntries = index.entries.filter(e => e.type !== 'auto' && e.type !== 'manual');

  const toRemove = [];

  // Prune auto checkpoints (keep newest)
  if (autoEntries.length > maxAuto) {
    const excess = autoEntries.slice(0, autoEntries.length - maxAuto);
    toRemove.push(...excess);
  }

  // Prune manual checkpoints
  if (manualEntries.length > maxManual) {
    const excess = manualEntries.slice(0, manualEntries.length - maxManual);
    toRemove.push(...excess);
  }

  // Remove files and update index
  for (const entry of toRemove) {
    const cpPath = path.join(cpDir, `${entry.id}.json`);
    try { fs.unlinkSync(cpPath); } catch (err) { if (err.code !== 'ENOENT') process.stderr.write(`[VAIS] Checkpoint prune failed: ${err.message}\n`); }
  }

  const removeIds = new Set(toRemove.map(e => e.id));
  index.entries = index.entries.filter(e => !removeIds.has(e.id));
  saveIndex(index);

  return { removed: toRemove.length };
}

/**
 * Delete a specific checkpoint
 */
function deleteCheckpoint(checkpointId) {
  validateCheckpointId(checkpointId);
  const cpDir = getCheckpointDir();
  const cpPath = path.join(cpDir, `${checkpointId}.json`);
  try { fs.unlinkSync(cpPath); } catch (err) { if (err.code !== 'ENOENT') process.stderr.write(`[VAIS] Checkpoint delete failed: ${err.message}\n`); }

  const index = loadIndex();
  index.entries = index.entries.filter(e => e.id !== checkpointId);
  saveIndex(index);
  return true;
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  rollbackToCheckpoint,
  verifyCheckpoint,
  pruneCheckpoints,
  deleteCheckpoint,
  sha256,
};
