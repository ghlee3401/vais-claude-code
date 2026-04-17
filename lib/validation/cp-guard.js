/**
 * VAIS Code - Checkpoint Guard
 * @module lib/validation/cp-guard
 *
 * Checkpoint 정합성 검증 (AskUserQuestion 기록 확인).
 *
 * @see docs/_legacy/01-plan/features/v050/07-harness-gates.plan.md §4
 */

const fs = require('fs');
const path = require('path');

const VALID_RESPONSES = ['approved', 'rejected', 'deferred'];

function getCheckpointPath(feature, phase) {
  return path.join(process.cwd(), '.vais', 'features', feature, 'checkpoints', `${phase}.json`);
}

function validateCheckpoints(feature, phase) {
  const cpPath = getCheckpointPath(feature, phase);

  if (!fs.existsSync(cpPath)) {
    return { valid: false, hasAskUserQuestion: false, cpCount: 0, cpIntegrity: [] };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
  } catch (_) {
    return { valid: false, hasAskUserQuestion: false, cpCount: 0, cpIntegrity: [{ error: 'parse_failed' }] };
  }

  const cps = data.checkpoints || [];
  if (cps.length === 0) {
    return { valid: false, hasAskUserQuestion: false, cpCount: 0, cpIntegrity: [] };
  }

  const cpIntegrity = cps.map((cp, i) => {
    const missing = [];
    if (!cp.question) missing.push('question');
    if (!cp.timestamp) missing.push('timestamp');
    if (!cp.userResponse) missing.push('userResponse');
    if (cp.userResponse && !VALID_RESPONSES.includes(cp.userResponse)) {
      missing.push(`invalid userResponse: ${cp.userResponse}`);
    }
    return { index: i, id: cp.id || `cp-${i}`, valid: missing.length === 0, missing };
  });

  const allValid = cpIntegrity.every(c => c.valid);

  return {
    valid: allValid,
    hasAskUserQuestion: cps.some(cp => cp.question),
    cpCount: cps.length,
    cpIntegrity,
  };
}

module.exports = { validateCheckpoints, VALID_RESPONSES };
