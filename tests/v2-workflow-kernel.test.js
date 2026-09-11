'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  EVENTS,
  PHASES,
  createInitialWorkItem,
  transition,
  evaluateGate,
  WorkItemStore,
  captureRepoSnapshot,
  diffSnapshots,
  classifyDrift,
  filterExternalDrift,
  isRuntimeOwnedPath,
  normalizeWriteScopes,
} = require('../lib/workflow/v2');

const T0 = '2026-09-01T00:00:00.000Z';

function gateResult(gate, verdict) {
  return {
    gate,
    verdict,
    requiredChecks: ['required-check'],
    passed: verdict === 'PASS' || verdict === 'READY' ? ['required-check'] : [],
    failed: verdict === 'FAIL' || verdict === 'NOT_READY' ? ['required-check'] : [],
    blocked: verdict === 'BLOCKED' ? ['required-check'] : [],
    missing: [],
    evaluatedAt: T0,
  };
}

function evidence(gate, verdict) {
  return { gateResult: gateResult(gate, verdict) };
}

function initial(id = 'WI-2026-09-01-login') {
  return createInitialWorkItem({
    id,
    title: 'Login',
    primaryFeature: 'authentication',
    affectedFeatures: [],
    scale: 'standard',
  }, T0);
}

function advanceToReview() {
  let state = initial();
  state = transition(state, EVENTS.PLAN_PRESENTED, evidence('plan', 'PASS'), T0);
  state = transition(state, EVENTS.USER_PLAN_APPROVED, {}, T0);
  state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, {
    writeScopes: ['src/**', 'tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
  }, T0);
  state = transition(state, EVENTS.DESIGN_PRESENTED, evidence('design', 'PASS'), T0);
  state = transition(state, EVENTS.USER_DESIGN_APPROVED, {}, T0);
  state = transition(state, EVENTS.READINESS_READY, evidence('readiness', 'READY'), T0);
  return state;
}

describe('v2 event state machine', () => {
  it('uses exactly the five mandatory phases', () => {
    assert.deepEqual(PHASES, ['plan', 'design', 'do', 'review', 'report']);
  });

  it('normalizes Design scopes before rejecting internal state and Git metadata', () => {
    assert.throws(() => normalizeWriteScopes(['./.vais/**']), /Unsafe/);
    assert.throws(() => normalizeWriteScopes(['.\\.git\\**']), /Unsafe/);
    assert.throws(() => normalizeWriteScopes(['docs/**']), /Unsafe/);
    assert.throws(() => normalizeWriteScopes(['docs/work-items/**']), /Unsafe/);
    assert.throws(() => normalizeWriteScopes(['docs/features/**']), /Unsafe/);
    assert.deepEqual(normalizeWriteScopes(['./src//auth/**']), ['src/auth/**']);
  });

  it('requires explicit Plan and Design approvals', () => {
    let state = initial();
    assert.throws(() => transition(state, EVENTS.PLAN_PRESENTED), /Gate evidence/);
    assert.throws(() => transition(state, EVENTS.USER_PLAN_APPROVED), /not allowed/);
    state = transition(state, EVENTS.PLAN_PRESENTED, evidence('plan', 'PASS'), T0);
    state = transition(state, EVENTS.USER_PLAN_APPROVED, {}, T0);
    assert.equal(state.phase, 'design');
    assert.equal(state.approvals.plan, 'approved');
    assert.throws(() => transition(state, EVENTS.USER_DESIGN_APPROVED), /not allowed/);
    assert.throws(() => transition(transition(state, EVENTS.DESIGN_PRESENTED, evidence('design', 'PASS'), T0), EVENTS.USER_DESIGN_APPROVED), /scope/);
    state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, {
      writeScopes: ['src/**'], readinessChecks: ['test'], reviewChecks: ['test'],
    }, T0);
    state = transition(state, EVENTS.DESIGN_PRESENTED, evidence('design', 'PASS'), T0);
    state = transition(state, EVENTS.USER_DESIGN_APPROVED, {}, T0);
    assert.equal(state.phase, 'do');
    assert.equal(state.approvals.design, 'approved');
  });

  it('cannot use a repair checkpoint to bypass the first Design approval', () => {
    let state = initial();
    state = transition(state, EVENTS.PLAN_PRESENTED, evidence('plan', 'PASS'), T0);
    state = transition(state, EVENTS.USER_PLAN_APPROVED, {}, T0);
    state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, {
      writeScopes: ['src/**'], readinessChecks: ['test'], reviewChecks: ['test'],
    }, T0);
    assert.throws(() => transition(state, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false }, T0), /only after/);
  });

  it('blocks on the third consecutive readiness NOT_READY without using QA retries', () => {
    let state = advanceToReview();
    state.phase = 'do';
    state.status = 'active';
    state = transition(state, EVENTS.READINESS_NOT_READY, evidence('readiness', 'NOT_READY'), T0);
    state = transition(state, EVENTS.READINESS_NOT_READY, evidence('readiness', 'NOT_READY'), T0);
    state = transition(state, EVENTS.READINESS_NOT_READY, { ...evidence('readiness', 'NOT_READY'), reason: 'build-failed' }, T0);
    assert.equal(state.status, 'blocked');
    assert.equal(state.phase, 'do');
    assert.equal(state.readinessNotReadyCount, 3);
    assert.equal(state.qaRepairCount, 0);
  });

  it('allows initial QA plus three repairs and blocks after the fourth QA failure', () => {
    let state = advanceToReview();
    for (let repair = 1; repair <= 3; repair += 1) {
      state = transition(state, EVENTS.QA_FAIL, evidence('review', 'FAIL'), T0);
      assert.equal(state.phase, 'design');
      assert.equal(state.qaRepairCount, repair);
      state = transition(state, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false }, T0);
      state = transition(state, EVENTS.READINESS_READY, evidence('readiness', 'READY'), T0);
    }
    state = transition(state, EVENTS.QA_FAIL, { ...evidence('review', 'FAIL'), reason: 'still-failing' }, T0);
    assert.equal(state.phase, 'review');
    assert.equal(state.status, 'blocked');
    assert.equal(state.qaRepairCount, 3);
  });

  it('never returns directly from Review failure to Do', () => {
    const failed = transition(advanceToReview(), EVENTS.QA_FAIL, evidence('review', 'FAIL'), T0);
    assert.equal(failed.phase, 'design');
    assert.throws(() => transition(failed, EVENTS.READINESS_READY), /not allowed/);
  });

  it('resets QA repairs only after a user-approved material revision', () => {
    let state = transition(advanceToReview(), EVENTS.QA_FAIL, evidence('review', 'FAIL'), T0);
    assert.equal(state.qaRepairCount, 1);
    state = transition(state, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: true }, T0);
    assert.equal(state.status, 'waiting-user');
    assert.equal(state.qaRepairCount, 1);
    state = transition(state, EVENTS.USER_DESIGN_APPROVED, {}, T0);
    assert.equal(state.qaRepairCount, 0);
    assert.equal(state.qaResetPending, false);
  });

  it('requires AI QA PASS before final approval and freezes a completed Report', () => {
    let state = advanceToReview();
    assert.throws(() => transition(state, EVENTS.USER_FINAL_APPROVED), /not allowed/);
    state = transition(state, EVENTS.QA_PASS, evidence('review', 'PASS'), T0);
    state = transition(state, EVENTS.USER_FINAL_APPROVED, {}, T0);
    assert.equal(state.phase, 'report');
    state = transition(state, EVENTS.REPORT_VALIDATED, evidence('report', 'PASS'), T0);
    assert.equal(state.status, 'completed');
    assert.equal(state.reportFrozen, true);
    assert.throws(() => transition(state, EVENTS.USER_CANCEL), /Terminal/);
  });

  it('routes repository drift by impact instead of deleting changes', () => {
    let state = advanceToReview();
    state.phase = 'do';
    state.status = 'active';
    const technical = transition(state, EVENTS.REPO_DRIFT_DETECTED, { classification: 'new-surface' }, T0);
    assert.equal(technical.phase, 'design');
    const product = transition(state, EVENTS.REPO_DRIFT_DETECTED, { classification: 'requirement-change' }, T0);
    assert.equal(product.phase, 'plan');
    assert.equal(product.approvals.plan, 'pending');
  });
});

describe('v2 binary gate engine', () => {
  const pass = check => ({
    check,
    execution: 'succeeded',
    verdict: 'pass',
    required: true,
    scope: [],
    requirements: [],
    summary: 'ok',
    findings: [],
    evidence: [],
  });

  it('passes only when every required check passes', () => {
    const result = evaluateGate('review', ['build', 'test'], [pass('build'), pass('test')], T0);
    assert.equal(result.verdict, 'PASS');
    assert.deepEqual(result.passed, ['build', 'test']);
  });

  it('blocks when a required result is missing or unavailable', () => {
    const missing = evaluateGate('review', ['build', 'test'], [pass('build')], T0);
    assert.equal(missing.verdict, 'BLOCKED');
    assert.deepEqual(missing.missing, ['test']);

    const unavailable = { ...pass('test'), execution: 'unavailable', verdict: 'blocked' };
    const blocked = evaluateGate('review', ['build', 'test'], [pass('build'), unavailable], T0);
    assert.equal(blocked.verdict, 'BLOCKED');
    assert.deepEqual(blocked.blocked, ['test']);
  });

  it('uses readiness-specific READY and NOT_READY verdicts without percentages', () => {
    const ready = evaluateGate('readiness', ['build'], [pass('build')], T0);
    assert.equal(ready.verdict, 'READY');
    const failed = { ...pass('build'), verdict: 'fail' };
    const notReady = evaluateGate('readiness', ['build'], [failed], T0);
    assert.equal(notReady.verdict, 'NOT_READY');
  });
});

describe('v2 WorkItemStore', () => {
  it('does not persist a Work item when canonical root creation fails', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-atomic-create-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.writeFileSync(path.join(root, 'docs'), 'not a directory');
    const store = new WorkItemStore(root);
    assert.throws(() => store.create({
      id: 'WI-2026-09-01-atomic', title: 'Atomic', primaryFeature: 'workflow',
      affectedFeatures: [], scale: 'compact',
    }, T0), /ENOTDIR|not a directory/);
    assert.equal(store.getCurrent(), null);
    assert.equal(store.list().length, 0);
  });

  it('records a failed audit event for an illegal transition without changing state', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-failed-audit-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const store = new WorkItemStore(root);
    const item = store.create({
      id: 'WI-2026-09-01-failed-audit', title: 'Audit', primaryFeature: 'workflow',
      affectedFeatures: [], scale: 'compact',
    }, T0);
    assert.throws(() => store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 }), /not allowed/);
    assert.equal(store.get(item.id).phase, 'plan');
    const failed = store.readRegistry().events.at(-1);
    assert.equal(failed.type, EVENTS.USER_PLAN_APPROVED);
    assert.equal(failed.outcome, 'failed');
    assert.equal(failed.details.phaseOwner, 'cpo');
  });

  function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-store-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    return new WorkItemStore(root, { leaseMs: 1000 });
  }

  it('enforces one progressing Work item and releases the slot on pause', t => {
    const store = fixture(t);
    const first = store.create({
      id: 'WI-2026-09-01-first', title: 'First', primaryFeature: 'first', affectedFeatures: [], scale: 'compact',
    }, T0);
    assert.equal(store.getCurrent().id, first.id);
    assert.throws(() => store.create({
      id: 'WI-2026-09-01-second', title: 'Second', primaryFeature: 'second', affectedFeatures: [], scale: 'compact',
    }, T0), error => error.code === 'WORK_ITEM_SLOT_OCCUPIED');

    store.apply(first.id, EVENTS.USER_PAUSE, {}, { timestamp: T0 });
    const second = store.create({
      id: 'WI-2026-09-01-second', title: 'Second', primaryFeature: 'second', affectedFeatures: [], scale: 'compact',
    }, T0);
    assert.equal(store.getCurrent().id, second.id);
    assert.throws(() => store.apply(first.id, EVENTS.USER_RESUME, {}, { timestamp: T0 }), error => error.code === 'WORK_ITEM_SLOT_OCCUPIED');
  });

  it('stores a redacted pending request without creating a Work item', t => {
    const store = fixture(t);
    const fakeToken = `ghp_${'a'.repeat(30)}`;
    const pending = store.queuePendingRequest(`deploy token=${fakeToken}`, 'session-b', T0);
    assert.equal(pending.redactionApplied, true);
    assert.ok(!pending.text.includes('ghp_'));
    assert.equal(store.list().length, 0);
    assert.equal(store.readRegistry().pendingRequests.length, 1);
  });

  it('grants one mutation lease and rejects another session', t => {
    const store = fixture(t);
    const item = store.create({
      id: 'WI-2026-09-01-lease', title: 'Lease', primaryFeature: 'lease', affectedFeatures: [], scale: 'standard',
    }, T0);
    store.acquireLease(item.id, 'session-a', T0);
    assert.equal(store.hasValidLease(item.id, 'session-a', '2026-09-01T00:00:00.500Z'), true);
    assert.equal(store.hasValidLease(item.id, 'session-a', '2026-09-01T00:01:00.001Z'), false);
    assert.throws(() => store.acquireLease(item.id, 'session-b', T0), error => error.code === 'LEASE_HELD');
    const updated = store.apply(item.id, EVENTS.PLAN_PRESENTED, evidence('plan', 'PASS'), {
      timestamp: T0,
      requireLease: true,
      sessionId: 'session-a',
    });
    assert.equal(updated.status, 'waiting-user');
    assert.throws(() => store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, {
      timestamp: T0,
      requireLease: true,
      sessionId: 'session-b',
    }), error => error.code === 'LEASE_REQUIRED');
  });
});

describe('v2 repository drift observation', () => {
  it('detects a clean repository HEAD change even when no working-tree files remain', () => {
    assert.deepEqual(diffSnapshots(
      { head: 'before', files: {} },
      { head: 'after', files: {} },
    ), ['@repo-head']);
  });

  it('detects content changes relative to the approved snapshot and classifies scope', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-drift-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    execFileSync('git', ['init', '-q'], { cwd: root });
    fs.mkdirSync(path.join(root, 'src/auth'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src/auth/login.js'), 'module.exports = 1;\n');
    execFileSync('git', ['add', '.'], { cwd: root });
    const before = captureRepoSnapshot(root);
    fs.writeFileSync(path.join(root, 'src/auth/login.js'), 'module.exports = 2;\n');
    const after = captureRepoSnapshot(root);
    assert.deepEqual(diffSnapshots(before, after), ['src/auth/login.js']);
    assert.equal(classifyDrift(['src/auth/login.js'], { writeScopes: ['src/auth/**'] }), 'within-design');
    assert.equal(classifyDrift(['src/payment.js'], { writeScopes: ['src/auth/**'] }), 'new-surface');
    assert.equal(classifyDrift(['docs/x/01-plan/main.md'], { writeScopes: ['src/**'] }), 'requirement-change');
  });

  it('ignores the runtime-owned evidence and drafts of the Work item itself but keeps canonical main.md', () => {
    const item = { id: 'WI-2026-09-11-docs', primaryFeature: 'vais-workflow', writeScopes: ['README.md'] };
    const own = 'docs/work-items/vais-workflow/2026-09-11-docs';
    const paths = [
      `${own}/04-review/draft.md`,
      `${own}/04-review/evidence/transactions/PT-1.failure.json`,
      `${own}/04-review/handoff.json`,
      `${own}/02-design/revisions/v1.md`,
    ];
    assert.deepEqual(filterExternalDrift(paths, item), []);
    assert.deepEqual(filterExternalDrift([...paths, `${own}/01-plan/main.md`], item), [`${own}/01-plan/main.md`]);
    assert.deepEqual(filterExternalDrift(['docs/work-items/other/2026-09-11-x/04-review/draft.md'], item),
      ['docs/work-items/other/2026-09-11-x/04-review/draft.md']);
    assert.equal(isRuntimeOwnedPath(`${own}/main.md`, item), false);
    assert.equal(isRuntimeOwnedPath('README.md', item), false);
  });
});
