'use strict';

const { isKnownKind, repairLimitOf } = require('./chain-registry');

const PHASES = Object.freeze(['plan', 'design', 'do', 'review', 'report']);
const STATUSES = Object.freeze(['active', 'waiting-user', 'blocked', 'paused', 'completed', 'cancelled']);
const SCALES = Object.freeze(['compact', 'standard', 'extended']);
const SLOT_HOLDING_STATUSES = new Set(['active', 'waiting-user', 'blocked']);
const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

const EVENTS = Object.freeze({
  PLAN_PRESENTED: 'plan.presented',
  USER_PLAN_APPROVED: 'user.plan.approved',
  USER_PLAN_REVISED: 'user.plan.revised',
  DESIGN_PRESENTED: 'design.presented',
  USER_DESIGN_APPROVED: 'user.design.approved',
  USER_DESIGN_REVISED: 'user.design.revised',
  DESIGN_SCOPE_DEFINED: 'design.scope.defined',
  DESIGN_CHECKPOINT_COMPLETED: 'design.checkpoint.completed',
  READINESS_READY: 'readiness.ready',
  READINESS_NOT_READY: 'readiness.not-ready',
  READINESS_BLOCKED: 'readiness.blocked',
  QA_PASS: 'qa.pass',
  QA_FAIL: 'qa.fail',
  QA_BLOCKED: 'qa.blocked',
  USER_FINAL_APPROVED: 'user.final.approved',
  USER_FINAL_REJECTED: 'user.final.rejected',
  REPORT_VALIDATED: 'report.validated',
  REPORT_FAILED: 'report.failed',
  USER_PAUSE: 'user.pause',
  USER_RESUME: 'user.resume',
  USER_CANCEL: 'user.cancel',
  REPO_DRIFT_DETECTED: 'repo.drift.detected',
});

function nowIso(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid transition timestamp');
  return date.toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeWriteScopes(scopes) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new Error('Design write scope must contain at least one path');
  }
  const normalized = [...new Set(scopes.map(scope => String(scope).trim()
    .replace(/\\/g, '/').replace(/^(?:\.\/)+/, '').replace(/\/{2,}/g, '/')))];
  for (const scope of normalized) {
    if (!scope || scope.startsWith('/') || scope === '**' || scope === '*' ||
      /(?:^|\/)\.\.(?:\/|$)/.test(scope) || /^(?:\.git|\.vais)(?:\/|$)/.test(scope) ||
      /^docs\/?(?:\*\*)?$/.test(scope) || /^docs\/(?:work-items|features)(?:\/|$)/.test(scope) ||
      /^docs\/README\.md(?:\/|$)/.test(scope)) {
      throw new Error(`Unsafe Design write scope: ${scope || '<empty>'}`);
    }
  }
  return normalized;
}

function requireGateResult(payload, gate, verdicts) {
  const result = payload?.gateResult;
  if (!result || result.gate !== gate || !verdicts.includes(result.verdict) ||
    !Array.isArray(result.requiredChecks) || result.requiredChecks.length === 0 ||
    !Array.isArray(result.passed) || !Array.isArray(result.failed) ||
    !Array.isArray(result.blocked) || !Array.isArray(result.missing)) {
    throw new Error(`${gate} Gate evidence with verdict ${verdicts.join(' or ')} is required`);
  }
  const required = new Set(result.requiredChecks);
  const allPassed = result.requiredChecks.every(check => result.passed.includes(check));
  if ((result.verdict === 'PASS' || result.verdict === 'READY') &&
    (!allPassed || result.failed.length > 0 || result.blocked.length > 0 || result.missing.length > 0)) {
    throw new Error(`${gate} Gate success evidence is internally inconsistent`);
  }
  if ((result.verdict === 'FAIL' || result.verdict === 'NOT_READY') &&
    (result.failed.length === 0 || result.failed.some(check => !required.has(check)))) {
    throw new Error(`${gate} Gate failure evidence is internally inconsistent`);
  }
  if (result.verdict === 'BLOCKED' && result.blocked.length === 0 && result.missing.length === 0) {
    throw new Error(`${gate} Gate blocked evidence is internally inconsistent`);
  }
  return result;
}

function assertState(state) {
  if (!state || typeof state !== 'object') throw new Error('Work item state is required');
  if (!PHASES.includes(state.phase)) throw new Error(`Unknown phase: ${state.phase}`);
  if (!STATUSES.includes(state.status)) throw new Error(`Unknown status: ${state.status}`);
  if (state.status === 'completed' && state.phase !== 'report') {
    throw new Error('Only report can be completed');
  }
  if (state.reportFrozen && state.status !== 'completed') {
    throw new Error('Report can be frozen only after completion');
  }
  return true;
}

function requireAt(state, phase, status, event) {
  if (state.phase !== phase || state.status !== status) {
    throw new Error(`${event} is not allowed from ${state.phase}/${state.status}`);
  }
}

function createInitialWorkItem(input, timestamp) {
  if (!input || typeof input !== 'object') throw new Error('Work item input is required');
  if (!SCALES.includes(input.scale)) throw new Error(`Unknown scale: ${input.scale}`);
  if (input.kind !== undefined && !isKnownKind(input.kind)) throw new Error(`Unknown work kind: ${input.kind}`);
  const time = nowIso(timestamp);
  const state = {
    schemaVersion: '1.0',
    id: input.id,
    title: input.title,
    primaryFeature: input.primaryFeature,
    affectedFeatures: [...new Set(input.affectedFeatures || [])],
    scale: input.scale,
    ...(input.kind ? { kind: input.kind } : {}),
    phase: 'plan',
    status: 'active',
    planRevision: 1,
    designRevision: 1,
    writeScopes: [],
    readinessChecks: [],
    reviewChecks: [],
    requiredSpecialists: [],
    readinessNotReadyCount: 0,
    qaRepairCount: 0,
    approvals: { plan: 'pending', design: 'pending', final: 'pending' },
    reportFrozen: false,
    createdAt: time,
    updatedAt: time,
    qaResetPending: false,
    blockReason: null,
    cancelReason: null,
    replacedBy: null,
  };
  assertState(state);
  return state;
}

function transition(current, event, payload = {}, timestamp) {
  assertState(current);
  if (!Object.values(EVENTS).includes(event)) throw new Error(`Unknown event: ${event}`);
  if (TERMINAL_STATUSES.has(current.status)) {
    throw new Error(`Terminal work item cannot transition: ${current.status}`);
  }

  const state = clone(current);
  state.updatedAt = nowIso(timestamp);
  state.blockReason = null;

  switch (event) {
    case EVENTS.PLAN_PRESENTED:
      requireAt(state, 'plan', 'active', event);
      requireGateResult(payload, 'plan', ['PASS']);
      state.status = 'waiting-user';
      break;
    case EVENTS.USER_PLAN_APPROVED:
      requireAt(state, 'plan', 'waiting-user', event);
      state.approvals.plan = 'approved';
      state.phase = 'design';
      state.status = 'active';
      if (state.qaResetPending) {
        state.qaRepairCount = 0;
        state.qaResetPending = false;
      }
      break;
    case EVENTS.USER_PLAN_REVISED:
      requireAt(state, 'plan', 'waiting-user', event);
      state.status = 'active';
      break;
    case EVENTS.DESIGN_PRESENTED:
      requireAt(state, 'design', 'active', event);
      if (state.writeScopes.length === 0 || state.readinessChecks.length === 0 || state.reviewChecks.length === 0) {
        throw new Error('Design scope, readiness checks, and Review checks must be declared before presentation');
      }
      requireGateResult(payload, 'design', ['PASS']);
      state.status = 'waiting-user';
      break;
    case EVENTS.USER_DESIGN_APPROVED:
      requireAt(state, 'design', 'waiting-user', event);
      if (state.approvals.plan !== 'approved') throw new Error('Plan approval is required');
      if (state.writeScopes.length === 0) throw new Error('Design write scope is required');
      state.approvals.design = 'approved';
      state.phase = 'do';
      state.status = 'active';
      if (state.qaResetPending) {
        state.qaRepairCount = 0;
        state.qaResetPending = false;
      }
      break;
    case EVENTS.USER_DESIGN_REVISED:
      requireAt(state, 'design', 'waiting-user', event);
      if (payload.requirementsChanged === true) {
        state.phase = 'plan';
        state.approvals.plan = 'pending';
      }
      state.approvals.design = 'pending';
      state.status = 'active';
      break;
    case EVENTS.DESIGN_SCOPE_DEFINED:
      requireAt(state, 'design', 'active', event);
      state.writeScopes = normalizeWriteScopes(payload.writeScopes);
      state.readinessChecks = normalizeCheckIds(payload.readinessChecks, 'readiness');
      state.reviewChecks = normalizeCheckIds(payload.reviewChecks, 'Review');
      state.requiredSpecialists = normalizeRoleIds(payload.requiredSpecialists || []);
      break;
    case EVENTS.DESIGN_CHECKPOINT_COMPLETED:
      requireAt(state, 'design', 'active', event);
      if (state.qaRepairCount === 0 || state.approvals.design !== 'approved') {
        throw new Error('Design checkpoint is allowed only after an approved Design returns from QA');
      }
      if (payload.material === true) {
        state.designRevision += 1;
        state.status = 'waiting-user';
        state.approvals.design = 'pending';
        state.qaResetPending = true;
      } else {
        state.phase = 'do';
        state.status = 'active';
      }
      break;
    case EVENTS.READINESS_READY:
      requireAt(state, 'do', 'active', event);
      if (state.approvals.design !== 'approved') throw new Error('Design approval is required');
      requireGateResult(payload, 'readiness', ['READY']);
      state.readinessNotReadyCount = 0;
      state.phase = 'review';
      state.status = 'active';
      break;
    case EVENTS.READINESS_NOT_READY:
      requireAt(state, 'do', 'active', event);
      requireGateResult(payload, 'readiness', ['NOT_READY']);
      state.readinessNotReadyCount += 1;
      if (state.readinessNotReadyCount >= 3) {
        state.readinessNotReadyCount = 3;
        state.status = 'blocked';
        state.blockReason = payload.reason || 'readiness-not-ready-limit';
      }
      break;
    case EVENTS.READINESS_BLOCKED:
      requireAt(state, 'do', 'active', event);
      requireGateResult(payload, 'readiness', ['BLOCKED']);
      state.status = 'blocked';
      state.blockReason = payload.reason || 'readiness-blocked';
      break;
    case EVENTS.QA_PASS:
      requireAt(state, 'review', 'active', event);
      requireGateResult(payload, 'review', ['PASS']);
      state.status = 'waiting-user';
      break;
    case EVENTS.QA_FAIL:
      requireAt(state, 'review', 'active', event);
      requireGateResult(payload, 'review', ['FAIL']);
      if (state.qaRepairCount >= repairLimitOf(state)) {
        state.status = 'blocked';
        state.blockReason = payload.reason || 'qa-repair-limit';
      } else {
        state.qaRepairCount += 1;
        state.phase = 'design';
        state.status = 'active';
      }
      break;
    case EVENTS.QA_BLOCKED:
      requireAt(state, 'review', 'active', event);
      requireGateResult(payload, 'review', ['BLOCKED']);
      state.status = 'blocked';
      state.blockReason = payload.reason || 'qa-blocked';
      break;
    case EVENTS.USER_FINAL_APPROVED:
      requireAt(state, 'review', 'waiting-user', event);
      state.approvals.final = 'approved';
      state.phase = 'report';
      state.status = 'active';
      break;
    case EVENTS.USER_FINAL_REJECTED:
      requireAt(state, 'review', 'waiting-user', event);
      state.approvals.final = 'pending';
      state.qaResetPending = true;
      if (payload.requirementsChanged === true) {
        state.phase = 'plan';
        state.approvals.plan = 'pending';
        state.approvals.design = 'pending';
      } else {
        state.phase = 'design';
        state.approvals.design = 'pending';
      }
      state.status = 'active';
      break;
    case EVENTS.REPORT_VALIDATED:
      requireAt(state, 'report', 'active', event);
      if (state.approvals.final !== 'approved') throw new Error('Final approval is required');
      requireGateResult(payload, 'report', ['PASS']);
      state.status = 'completed';
      state.reportFrozen = true;
      break;
    case EVENTS.REPORT_FAILED:
      requireAt(state, 'report', 'active', event);
      requireGateResult(payload, 'report', ['FAIL', 'BLOCKED']);
      state.status = 'blocked';
      state.blockReason = payload.reason || 'report-validation-failed';
      break;
    case EVENTS.USER_PAUSE:
      if (!SLOT_HOLDING_STATUSES.has(state.status)) throw new Error(`${event} is not allowed from ${state.status}`);
      state.pausedStatus = state.status;
      state.status = 'paused';
      break;
    case EVENTS.USER_RESUME:
      if (state.status !== 'paused') throw new Error(`${event} is not allowed from ${state.status}`);
      state.status = state.pausedStatus || 'active';
      delete state.pausedStatus;
      break;
    case EVENTS.USER_CANCEL:
      state.status = 'cancelled';
      state.cancelReason = payload.reason || 'user-cancelled';
      state.replacedBy = payload.replacedBy || null;
      delete state.pausedStatus;
      break;
    case EVENTS.REPO_DRIFT_DETECTED:
      if (payload.classification === 'within-design') {
        if (state.approvals.plan !== 'approved') {
          state.phase = 'plan';
          state.approvals.design = 'pending';
        } else if (state.approvals.design !== 'approved') {
          state.phase = 'design';
        } else {
          state.phase = 'do';
        }
        state.status = 'active';
        state.approvals.final = 'pending';
      } else if (payload.classification === 'new-surface') {
        state.phase = state.approvals.plan === 'approved' ? 'design' : 'plan';
        state.status = 'active';
        state.approvals.design = 'pending';
        state.approvals.final = 'pending';
      } else if (payload.classification === 'requirement-change') {
        state.phase = 'plan';
        state.status = 'active';
        state.approvals.plan = 'pending';
        state.approvals.design = 'pending';
        state.approvals.final = 'pending';
      } else {
        throw new Error(`Unknown drift classification: ${payload.classification}`);
      }
      break;
    default:
      throw new Error(`Unhandled event: ${event}`);
  }

  assertState(state);
  return state;
}

function normalizeCheckIds(checks, label) {
  if (!Array.isArray(checks) || checks.length === 0) throw new Error(`${label} checks must contain at least one check`);
  const normalized = [...new Set(checks.map(check => String(check).trim()))];
  if (normalized.some(check => !/^[a-z0-9][a-z0-9-]*$/.test(check))) {
    throw new Error(`${label} check ids must be lowercase kebab-case`);
  }
  return normalized;
}

function normalizeRoleIds(roles) {
  if (!Array.isArray(roles)) throw new Error('Required specialists must be an array');
  const normalized = [...new Set(roles.map(role => String(role).trim()))];
  if (normalized.some(role => !/^[a-z0-9][a-z0-9-]*$/.test(role))) {
    throw new Error('Required specialist ids must be lowercase kebab-case');
  }
  return normalized;
}

module.exports = {
  PHASES,
  STATUSES,
  SCALES,
  SLOT_HOLDING_STATUSES,
  TERMINAL_STATUSES,
  EVENTS,
  assertState,
  createInitialWorkItem,
  normalizeWriteScopes,
  normalizeCheckIds,
  normalizeRoleIds,
  requireGateResult,
  transition,
};
