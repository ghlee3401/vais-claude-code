'use strict';

const GATES = Object.freeze(['plan', 'design', 'readiness', 'review', 'report']);

function unique(values) {
  return [...new Set(values)];
}

function evaluateGate(gate, requiredChecks, results, timestamp) {
  if (!GATES.includes(gate)) throw new Error(`Unknown gate: ${gate}`);
  const required = unique(requiredChecks || []);
  if (required.length === 0) throw new Error(`${gate} gate requires at least one check`);

  const byId = new Map();
  for (const result of results || []) {
    if (!result || typeof result.check !== 'string') throw new Error('Check result must have an id');
    if (byId.has(result.check)) throw new Error(`Duplicate check result: ${result.check}`);
    byId.set(result.check, result);
  }

  const passed = [];
  const failed = [];
  const blocked = [];
  const missing = [];
  for (const check of required) {
    const result = byId.get(check);
    if (!result) {
      missing.push(check);
      continue;
    }
    if (result.verdict === 'blocked' || result.execution === 'unavailable') {
      blocked.push(check);
    } else if (result.verdict === 'fail' || result.execution === 'errored') {
      failed.push(check);
    } else if (result.verdict === 'pass' && result.execution === 'succeeded') {
      passed.push(check);
    } else {
      blocked.push(check);
    }
  }

  let verdict;
  if (missing.length > 0 || blocked.length > 0) {
    verdict = 'BLOCKED';
  } else if (failed.length > 0) {
    verdict = gate === 'readiness' ? 'NOT_READY' : 'FAIL';
  } else {
    verdict = gate === 'readiness' ? 'READY' : 'PASS';
  }

  return {
    gate,
    verdict,
    requiredChecks: required,
    passed,
    failed,
    blocked,
    missing,
    evaluatedAt: new Date(timestamp || Date.now()).toISOString(),
  };
}

module.exports = { GATES, evaluateGate };
