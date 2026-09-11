#!/usr/bin/env node
'use strict';

const { readStdin, outputAllow, outputEmpty } = require('../lib/io');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { pathMatches } = require('../lib/workflow/v2/write-policy');
const { EVENTS } = require('../lib/workflow/v2/state-machine');
const { captureRepoSnapshot, diffSnapshots, classifyDrift } = require('../lib/workflow/v2/repo-drift');
const { resolveProjectRoot, resolveStartDir } = require('./v2-project-context');
const { loadMode } = require('./workflow-v2-prompt');

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot || loadMode(projectRoot) !== 'enforce') return outputEmpty();
  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  if (!authorization?.workItemId) return outputEmpty();
  const store = new WorkItemStore(projectRoot);
  const item = store.get(authorization.workItemId);
  const current = store.getCurrent();
  if (!item || !current || current.id !== item.id || item.status !== 'active' || authorization.phase !== item.phase) {
    return outputEmpty();
  }
  const observed = captureRepoSnapshot(projectRoot);
  const baseline = store.getRepoSnapshot(item.id);
  const paths = diffSnapshots(baseline, observed);
  if (!baseline) {
    store.setRepoSnapshot(item.id, observed, { reason: 'phase-entry' });
    return outputEmpty();
  }
  if (paths.length === 0) {
    return outputEmpty();
  }
  const withinAuthorization = paths.every(file => authorization.allowedPaths.some(scope => pathMatches(file, scope)));
  if (withinAuthorization) {
    // Keep the transaction-entry baseline while authorized product edits accumulate.
    // The phase transaction writes one final coalesced snapshot after its state event.
    return outputEmpty();
  }
  const classification = classifyDrift(paths, item);
  store.recordDriftAlert(item.id, paths, classification);
  store.apply(item.id, EVENTS.REPO_DRIFT_DETECTED, { classification }, { requireLease: true, sessionId });
  store.setRepoSnapshot(item.id, observed, { reason: `out-of-scope-${classification}`, changedPathCount: paths.length });
  return outputAllow(`VAIS detected repository drift in ${paths.length} path(s) and routed it as ${classification}.`);
}

if (require.main === module) {
  try { main(); } catch (error) { outputAllow(`VAIS drift observation failed: ${error.message}`); }
}

module.exports = { main };
