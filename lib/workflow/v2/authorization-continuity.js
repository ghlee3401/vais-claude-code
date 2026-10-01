'use strict';

// unattended-chain U1 (REQ-001): the session authorization is an idle timeout, not a hard stop.
// Every hook and phase transaction resolves the authorization through this module: a live one
// is returned as is; an expired one bound to a Work item is revived when the same session still
// works on the current, mutation-active Work item in the same phase with the same write scope.
// Anything else (another session, another Work item, a stale phase or scope, a Work-item-less
// start-request or confirmation token) keeps today's behaviour and expires.

const { AuthorizationStore } = require('./authorization-store');
const { WorkItemStore } = require('./work-item-store');
const { defaultAllowedPaths } = require('./write-policy');
const { SLOT_HOLDING_STATUSES } = require('./state-machine');

function sameSet(left, right) {
  return [...new Set(left || [])].sort().join('\n') === [...new Set(right || [])].sort().join('\n');
}

function validateCurrentAuthorization(store, authorization) {
  if (!authorization?.workItemId) return { valid: true, item: null };
  const item = store.get(authorization.workItemId);
  const current = store.getCurrent();
  if (!item || !current || current.id !== item.id) return { valid: false, reason: 'authorization Work item is not current' };
  if (!SLOT_HOLDING_STATUSES.has(item.status) || item.status !== 'active') {
    return { valid: false, reason: `Work item is not mutation-active: ${item.phase}/${item.status}` };
  }
  if (authorization.phase !== item.phase) return { valid: false, reason: 'authorization phase is stale' };
  if (!sameSet(authorization.allowedPaths, defaultAllowedPaths(item))) {
    return { valid: false, reason: 'authorization write scope is stale' };
  }
  return { valid: true, item };
}

function resolveSessionAuthorization(projectRoot, sessionId, options = {}) {
  if (!sessionId) return null;
  const authorizations = options.authorizations || new AuthorizationStore(projectRoot);
  const live = authorizations.get(sessionId, options.timestamp);
  if (live) return live;
  const expired = authorizations.peek(sessionId);
  if (!expired?.workItemId) return null;
  const check = validateCurrentAuthorization(options.workItems || new WorkItemStore(projectRoot), expired);
  if (!check.valid) return null;
  return authorizations.revive(sessionId, options.timestamp);
}

module.exports = { sameSet, validateCurrentAuthorization, resolveSessionAuthorization };
