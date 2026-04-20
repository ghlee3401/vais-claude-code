/**
 * VAIS Code - State Migration
 * @module lib/core/migration
 * @version 1.0.0
 *
 * Migrates .vais/status.json (v2) to include FSM-compatible fields.
 * Non-destructive: adds fields without removing existing ones.
 */

const fs = require('fs');
const path = require('path');

/**
 * Migrate status.json v2 → v3 (FSM-compatible)
 * Adds: fsmState, iterationCount, matchRate per feature
 *
 * @param {Object} status - Current status object
 * @returns {Object} Migrated status (mutated in place)
 */
function migrateV2toV3(status) {
  const version = typeof status?.version === 'number' ? status.version : 0;
  if (!status || version >= 3) return status;

  for (const [name, feature] of Object.entries(status.features || {})) {
    // Backfill phases: 구 스키마 (rolePhases 만 존재) 에서 phases 필드 누락 복구
    if (!feature.phases || typeof feature.phases !== 'object') {
      feature.phases = {};
      for (const p of ['ideation', 'plan', 'design', 'do', 'qa', 'report']) {
        feature.phases[p] = { status: 'pending', startedAt: null, completedAt: null };
      }
    }

    // Add FSM state derived from currentPhase
    if (!feature.fsmState) {
      const phase = feature.currentPhase || 'idle';
      feature.fsmState = {
        phase,
        iterationCount: feature.gapAnalysis?.iteration || 0,
        matchRate: feature.gapAnalysis?.matchRate || null,
        timestamps: {
          created: feature.createdAt,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // Ensure rolePhases exists
    if (!feature.rolePhases) {
      feature.rolePhases = {};
    }
  }

  status.version = 3;
  return status;
}

/**
 * Run migration if needed
 * @param {string} statusPath - Path to status.json
 * @returns {boolean} true if migration was performed
 */
function migrateIfNeeded(statusPath) {
  if (!fs.existsSync(statusPath)) return false;

  let raw;
  try {
    raw = fs.readFileSync(statusPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    process.stderr.write(`[VAIS] Migration read failed: ${err.message}\n`);
    return false;
  }

  let status;
  try {
    status = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`[VAIS] Migration parse failed (corrupted status.json): ${err.message}\n`);
    return false;
  }

  if (!status || status.version >= 3) return false;

  const migrated = migrateV2toV3(status);
  const tmpPath = `${statusPath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(migrated, null, 2));
    fs.renameSync(tmpPath, statusPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore orphan cleanup failure */ }
    process.stderr.write(`[VAIS] Migration write failed: ${err.message}\n`);
    return false;
  }
}

module.exports = {
  migrateV2toV3,
  migrateIfNeeded,
};
