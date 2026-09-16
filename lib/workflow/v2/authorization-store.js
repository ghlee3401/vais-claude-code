'use strict';

const fs = require('fs');
const path = require('path');
const stateStore = require('../../core/state-store');
const { DEFAULT_AUTHORIZATION_MS, loadWorkflowConfig } = require('./config');

// A foreground specialist turn can legitimately take longer than five minutes.
// Safety still comes from the phase/session checks and the short mutation lease;
// this window only keeps an otherwise-valid managed session usable.

function emptyAuthorizations() {
  return { schemaVersion: '1.0', sessions: {} };
}

function sanitize(value) {
  if (!value || value.schemaVersion !== '1.0') return emptyAuthorizations();
  return { schemaVersion: '1.0', sessions: value.sessions || {} };
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
      allowedPaths: [...new Set(input.allowedPaths || [])],
      allowedCommands: [...new Set(input.allowedCommands || [])],
      grantedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(),
    };
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      value.sessions[input.sessionId] = authorization;
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

  revoke(sessionId) {
    if (!sessionId || !stateStore.exists(this.statePath)) return;
    stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitize(raw);
      delete value.sessions[sessionId];
      return value;
    });
  }
}

module.exports = { DEFAULT_AUTHORIZATION_MS, AuthorizationStore };
