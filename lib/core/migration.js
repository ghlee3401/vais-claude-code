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
  if (!status || status.version >= 3) return status;

  for (const [name, feature] of Object.entries(status.features || {})) {
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

  try {
    const raw = fs.readFileSync(statusPath, 'utf8');
    const status = JSON.parse(raw);

    if (status.version >= 3) return false;

    const migrated = migrateV2toV3(status);
    const tmpPath = `${statusPath}.tmp.${process.pid}`;
    fs.writeFileSync(tmpPath, JSON.stringify(migrated, null, 2));
    fs.renameSync(tmpPath, statusPath);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  migrateV2toV3,
  migrateIfNeeded,
};
