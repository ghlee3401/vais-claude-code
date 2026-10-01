'use strict';

const fs = require('fs');
const path = require('path');
const stateStore = require('../../core/state-store');
const { DEFAULT_AUTHORIZATION_MS, loadWorkflowConfig } = require('./config');

// A foreground specialist turn can legitimately take longer than five minutes.
// Safety still comes from the phase/session checks and the short mutation lease;
// this window only keeps an otherwise-valid managed session usable.
//
// unattended-chain U1 (REQ-001): the TTL is an idle timeout. An authorization bound to a
// Work item is revived by `authorization-continuity.js` when the same session keeps working
// on the same current Work item in the same phase; only Work-item-less authorizations
// (start-request · confirmation tokens) end at the TTL.

function emptyAuthorizations() {
  return { schemaVersion: '1.0', sessions: {}, names: {} };
}

function sanitize(value) {
  if (!value || value.schemaVersion !== '1.0') return emptyAuthorizations();
  return { schemaVersion: '1.0', sessions: value.sessions || {}, names: value.names || {} };
}

class AuthorizationStore {
  constructor(projectRoot, options = {}) {
    if (!projectRoot) throw new Error('projectRoot is required');
    this.statePath = options.statePath || path.join(path.resolve(projectRoot), '.vais', 'v2', 'authorizations.json');
    this.ttlMs = options.ttlMs || loadWorkflowConfig(projectRoot).authorizationTtlMs || DEFAULT_AUTHORIZATION_MS;
  }

  grant(input, timestamp) {
    if (!input?.sessionId) throw new Error('sessionId is required');
    const now = new Date(timestamp || Date.now()).getTime();
    const authorization = {
      sessionId: input.sessionId,
      workItemId: input.workItemId || null,
      phase: input.phase || 'plan',
      action: input.action || 'continue-work',
      requestSlug: input.requestSlug || null,
      stageConfirmations: [...(input.stageConfirmations || [])],
      // User-typed confirmations for write commands (save · revert · ledger). Valid for this
      // session only and replaced on the next grant, so a token never outlives its turn.
      confirmations: [...(input.confirmations || [])],
      allowedPaths: [...new Set(input.allowedPaths || [])],
      allowedCommands: [...new Set(input.allowedCommands || [])],
      grantedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(),
    };
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      value.sessions[input.sessionId] = authorization;
      // A Work item now exists for this session: the remembered Feature name has been used.
      if (authorization.workItemId) delete value.names[input.sessionId];
      return value;
    });
    return authorization;
  }

  get(sessionId, timestamp) {
    if (!sessionId) return null;
    const value = sanitize(stateStore.read(this.statePath));
    const authorization = value.sessions[sessionId];
    if (!authorization) return null;
    const now = new Date(timestamp || Date.now()).getTime();
    return Date.parse(authorization.expiresAt) > now ? authorization : null;
  }

  // The stored authorization regardless of expiry (null when the session has none).
  peek(sessionId) {
    if (!sessionId) return null;
    const value = sanitize(stateStore.read(this.statePath));
    return value.sessions[sessionId] || null;
  }

  touch(sessionId, timestamp) {
    if (!sessionId) return null;
    const now = new Date(timestamp || Date.now()).getTime();
    let renewed = null;
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      const authorization = value.sessions[sessionId];
      if (!authorization || Date.parse(authorization.expiresAt) <= now) return value;
      renewed = {
        ...authorization,
        expiresAt: new Date(now + this.ttlMs).toISOString(),
      };
      value.sessions[sessionId] = renewed;
      return value;
    });
    return renewed;
  }

  // Extend an authorization even after its expiry. Callers must have validated that the
  // session still works on the current Work item (authorization-continuity.js).
  revive(sessionId, timestamp) {
    if (!sessionId) return null;
    const now = new Date(timestamp || Date.now()).getTime();
    let renewed = null;
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      const authorization = value.sessions[sessionId];
      if (!authorization) return value;
      renewed = { ...authorization, expiresAt: new Date(now + this.ttlMs).toISOString() };
      value.sessions[sessionId] = renewed;
      return value;
    });
    return renewed;
  }

  revoke(sessionId) {
    if (!sessionId || !stateStore.exists(this.statePath)) return;
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      delete value.sessions[sessionId];
      return value;
    });
  }

  // `/vais 이름: <kebab>` (REQ-005): the Feature name the user typed survives read-only turns,
  // `/vais 확인`, and revokes until a Work item is created or another name replaces it.
  rememberName(sessionId, slug, timestamp) {
    if (!sessionId || !slug) return null;
    const entry = { slug: String(slug), at: new Date(timestamp || Date.now()).toISOString() };
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      value.names[sessionId] = entry;
      return value;
    });
    return entry;
  }

  pendingName(sessionId) {
    if (!sessionId) return null;
    const value = sanitize(stateStore.read(this.statePath));
    return value.names[sessionId]?.slug || null;
  }

  forgetName(sessionId) {
    if (!sessionId || !stateStore.exists(this.statePath)) return;
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      delete value.names[sessionId];
      return value;
    });
  }
}

module.exports = { DEFAULT_AUTHORIZATION_MS, AuthorizationStore };
