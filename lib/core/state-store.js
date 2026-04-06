/**
 * VAIS Code - Atomic State Store with File Locking
 * @module lib/core/state-store
 * @version 1.0.0
 *
 * Provides atomic JSON state persistence using tmp+rename pattern
 * and optional file-based locking for concurrent access.
 * @see bkit-claude-code/lib/core/state-store.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ── Constants ──────────────────────────────────────────────────────

const LOCK_TIMEOUT_MS = 5000;
const LOCK_STALE_MS = 30000;
const LOCK_MAX_RETRIES = 50;
const LOCK_RETRY_INTERVAL_MS = 100;

// ── Basic State Operations ─────────────────────────────────────────

/**
 * Read JSON state from file
 * @param {string} filePath - Absolute file path
 * @returns {Object|null} Parsed JSON or null if missing/corrupt
 */
function read(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Write JSON state atomically using tmp+rename pattern
 * @param {string} filePath - Absolute file path
 * @param {Object} data - Data to serialize
 */
function write(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore */ }
    throw e;
  }
}

/**
 * Check if a state file exists
 * @param {string} filePath
 * @returns {boolean}
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Remove a state file (no error if missing)
 * @param {string} filePath
 */
function remove(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
}

/**
 * Append a single JSON line to a JSONL file
 * @param {string} filePath - .jsonl file path
 * @param {Object} line - Object to append
 */
function appendJsonl(filePath, line) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(filePath, JSON.stringify(line) + '\n');
}

// ── File Locking ───────────────────────────────────────────────────

/**
 * Acquire exclusive file lock using O_EXCL atomic creation
 * @param {string} filePath - File to lock (.lock appended)
 * @param {number} [timeoutMs] - Max wait time
 * @returns {string} Lock file path
 */
function lock(filePath, timeoutMs) {
  const timeout = timeoutMs != null ? timeoutMs : LOCK_TIMEOUT_MS;
  const lockPath = filePath + '.lock';
  const lockData = JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
    hostname: os.hostname(),
  });

  const startTime = Date.now();
  let retries = 0;

  while (retries < LOCK_MAX_RETRIES) {
    try {
      fs.writeFileSync(lockPath, lockData, { flag: 'wx' });
      return lockPath;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;

      // Lock exists — check if stale
      try {
        const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        if (Date.now() - existing.timestamp > LOCK_STALE_MS) {
          try { fs.unlinkSync(lockPath); } catch (_) { /* ignore */ }
          continue;
        }
      } catch (_) {
        try { fs.unlinkSync(lockPath); } catch (__) { /* ignore */ }
        continue;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Lock timeout after ${timeout}ms: ${filePath}`);
      }

      // Sleep without CPU spin — use child_process for sync delay
      try { execSync(`sleep ${LOCK_RETRY_INTERVAL_MS / 1000}`, { stdio: 'ignore' }); } catch (_) { /* ignore */ }
      retries++;
    }
  }

  throw new Error(`Lock failed after ${LOCK_MAX_RETRIES} retries: ${filePath}`);
}

/**
 * Release a file lock
 * @param {string} filePath - Original file path
 */
function unlock(filePath) {
  try {
    fs.unlinkSync(filePath + '.lock');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      process.stderr.write(`[VAIS] Lock release failed: ${err.message}\n`);
    }
  }
}

/**
 * Locked read-modify-write operation
 * @param {string} filePath
 * @param {function(Object|null): Object} modifier
 * @param {number} [timeoutMs]
 * @returns {Object} Modified data
 */
function lockedUpdate(filePath, modifier, timeoutMs) {
  lock(filePath, timeoutMs);
  try {
    const current = read(filePath);
    const modified = modifier(current);
    write(filePath, modified);
    return modified;
  } finally {
    unlock(filePath);
  }
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  read,
  write,
  exists,
  remove,
  appendJsonl,
  lock,
  unlock,
  lockedUpdate,
  // Constants (for external configuration)
  LOCK_TIMEOUT_MS,
  LOCK_STALE_MS,
};
