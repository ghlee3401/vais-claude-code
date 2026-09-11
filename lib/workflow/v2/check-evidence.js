'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { assertContract } = require('./contracts');
const { TOOL_DEFINITIONS, resolveDefinition } = require('./tool-adapters');
const { scopedSnapshotDigest } = require('./repo-drift');
const { normalizeRelative } = require('./write-policy');

function normalizedCheckCommand(projectRoot, check) {
  if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, check)) {
    throw new Error(`Unknown check adapter: ${check}`);
  }
  const definition = TOOL_DEFINITIONS[check];
  try {
    const resolved = resolveDefinition(definition, projectRoot);
    return [resolved.command, ...(resolved.args || [])].map(value => JSON.stringify(String(value))).join(' ');
  } catch (error) {
    return [definition.command, ...(definition.args || []), ...(definition.scriptCandidates || [])]
      .map(value => JSON.stringify(String(value))).join(' ');
  }
}

function buildCheckIdentity(projectRoot, item, check, repoDigest = null) {
  const value = {
    adapter: check,
    command: normalizedCheckCommand(projectRoot, check),
    designRevision: item.designRevision,
    repoDigest: repoDigest || scopedSnapshotDigest(projectRoot, item.writeScopes),
  };
  return {
    ...value,
    key: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  };
}

function readReceiptResult(projectRoot, receipt) {
  if (!receipt?.evidencePath) return null;
  const target = path.resolve(projectRoot, receipt.evidencePath);
  if (!normalizeRelative(projectRoot, target) || !fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink()) return null;
  try {
    const result = assertContract('checkResult', JSON.parse(fs.readFileSync(target, 'utf8')));
    const digest = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
    return digest === receipt.digest && result.check === receipt.check ? result : null;
  } catch (_) {
    return null;
  }
}

function matchingCheckReceipts(store, item, check, options = {}) {
  const identity = buildCheckIdentity(store.projectRoot, item, check, options.repoDigest);
  const byPhase = store.readRegistry().checkReceipts?.[item.id] || {};
  const matches = [];
  for (const [phase, receipts] of Object.entries(byPhase)) {
    const receipt = receipts?.[check];
    if (!receipt || receipt.identity !== identity.key || receipt.designRevision !== item.designRevision ||
      receipt.repoDigest !== identity.repoDigest) continue;
    const result = readReceiptResult(store.projectRoot, receipt);
    if (!result || (options.passOnly && result.verdict !== 'pass')) continue;
    matches.push({ phase, receipt, result, identity });
  }
  return matches.sort((left, right) => String(right.receipt.recordedAt).localeCompare(String(left.receipt.recordedAt)));
}

function reviewEvidenceManifest(store, item) {
  const repoDigest = scopedSnapshotDigest(store.projectRoot, item.writeScopes);
  return (item.reviewChecks || []).map(check => {
    const identity = buildCheckIdentity(store.projectRoot, item, check, repoDigest);
    const match = matchingCheckReceipts(store, item, check, { repoDigest })[0];
    return match ? {
      check,
      identity: identity.key,
      command: identity.command,
      verdict: match.result.verdict,
      evidencePath: match.receipt.evidencePath,
      sourcePhase: match.phase,
    } : {
      check,
      identity: identity.key,
      command: identity.command,
      verdict: 'missing',
      evidencePath: null,
      sourcePhase: null,
    };
  });
}

module.exports = {
  normalizedCheckCommand,
  buildCheckIdentity,
  readReceiptResult,
  matchingCheckReceipts,
  reviewEvidenceManifest,
};
