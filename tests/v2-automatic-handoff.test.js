'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const workflow = require('../lib/workflow/v2');
const handoffApi = {
  ...require('../lib/workflow/v2/automatic-handoff'),
  ...workflow,
};

const {
  EVENTS,
  WorkItemStore,
  buildSpecialistAssignment,
  extractAgentHandoff,
  recordAutomaticHandoff,
  assertHandoffSize,
  writePhaseDocument,
} = handoffApi;

const T0 = '2026-09-02T00:00:00.000Z';
const SESSION = 'session-auto-handoff';

function gateEvidence(gate, verdict, check) {
  return {
    gateResult: {
      gate, verdict, requiredChecks: [check], passed: [check],
      failed: [], blocked: [], missing: [], evaluatedAt: T0,
    },
  };
}

function completedHandoff(judgment = 'Implementation satisfies the approved behavior') {
  return {
    schema: 'specialist-handoff/v1',
    status: 'completed',
    judgment,
    decisions: ['Kept the public contract stable'],
    behavior: { inputs: ['request'], outputs: ['response'], errors: ['validation error'] },
    evidence: ['tests/v2-automatic-handoff.test.js'],
    affectedRequirements: ['REQ-001'],
    risks: [],
    unverified: [],
    recommendedChecks: ['test'],
  };
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-auto-handoff-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const store = new WorkItemStore(root);
  let item = store.create({
    id: 'WI-2026-09-02-auto-handoff',
    title: 'Automatic handoff',
    primaryFeature: 'workflow',
    affectedFeatures: [],
    scale: 'compact',
  }, T0);
  writePhaseDocument(root, item, 'plan', '# Plan\n\nREQ-001', { status: 'draft' });
  item = store.apply(item.id, EVENTS.PLAN_PRESENTED,
    gateEvidence('plan', 'PASS', 'plan-document'), { timestamp: T0 });
  item = store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
  item = store.apply(item.id, EVENTS.DESIGN_SCOPE_DEFINED, {
    writeScopes: ['lib/workflow/v2/**'],
    readinessChecks: ['test'],
    reviewChecks: ['test'],
    requiredSpecialists: ['backend-engineer'],
  }, { timestamp: T0 });
  writePhaseDocument(root, item, 'design', '# Design\n\nREQ-001\n\nTC-001', { status: 'draft' });
  item = store.apply(item.id, EVENTS.DESIGN_PRESENTED,
    gateEvidence('design', 'PASS', 'design-document'), { timestamp: T0 });
  item = store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {}, { timestamp: T0 });
  store.acquireLease(item.id, SESSION, T0);
  const assignment = buildSpecialistAssignment({
    role: 'backend-engineer',
    delegatedBy: 'cto',
    phase: 'do',
    mode: 'implementation',
    question: 'Implement REQ-001 inside the approved scope.',
    codeWrite: true,
    writeScope: ['lib/workflow/v2/**'],
    completionCriteria: ['TC-001 passes'],
    context: { refs: ['02-design/main.md'], receipts: [], cleanRoom: false },
  });
  const assignmentReceipt = store.recordAssignment(item.id, assignment, SESSION, T0);
  store.recordAssignmentUse(item.id, assignmentReceipt.id, SESSION, T0);
  return { root, store, item, assignment, assignmentReceipt };
}

describe('v2 automatic Agent handoff persistence', () => {
  it('bounds independent QA handoff bytes by scale', () => {
    const oversized = { judgment: 'x'.repeat(3 * 1024), evidence: [] };
    assert.throws(() => assertHandoffSize({ scale: 'compact' }, 'independent-qa', oversized),
      /exceeds the compact limit/);
    assert.equal(assertHandoffSize({ scale: 'compact' }, 'backend-engineer', oversized), oversized);
  });
  it('persists exactly one valid Agent result and completes the required assignment', t => {
    const { root, store, item, assignmentReceipt } = fixture(t);
    const receipt = recordAutomaticHandoff(root, {
      workItemId: item.id,
      sessionId: SESSION,
      assignmentId: assignmentReceipt.id,
      agentResult: { content: [{ text: JSON.stringify(completedHandoff()) }] },
      timestamp: T0,
    });
    assert.equal(receipt.schema, 'automatic-handoff-receipt/v1');
    assert.equal(receipt.status, 'completed');
    assert.ok(fs.existsSync(path.join(root, receipt.evidencePath)));
    assert.deepEqual(store.missingCompletedSpecialists(item.id), []);
  });

  it('rejects zero or multiple handoff objects without completing the assignment', t => {
    const { root, store, item, assignmentReceipt } = fixture(t);
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: item.id, sessionId: SESSION, assignmentId: assignmentReceipt.id,
      agentResult: 'No structured handoff was returned.', timestamp: T0,
    }), /exactly one/);
    const first = completedHandoff('first result');
    const second = completedHandoff('second result');
    assert.throws(() => extractAgentHandoff(`${JSON.stringify(first)}\n${JSON.stringify(second)}`), /found 2/);
    assert.deepEqual(store.missingCompletedSpecialists(item.id), ['backend-engineer']);
  });

  it('rejects tampered assignment content and receipt digests', t => {
    const { root, store, item, assignment, assignmentReceipt } = fixture(t);
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: item.id,
      sessionId: SESSION,
      assignmentId: assignmentReceipt.id,
      assignment: { ...assignment, question: 'Widen the approved scope.' },
      handoff: completedHandoff(),
      timestamp: T0,
    }), /assignment digest is invalid/);
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: item.id,
      sessionId: SESSION,
      assignmentId: assignmentReceipt.id,
      assignmentReceipt: { ...assignmentReceipt, digest: '0'.repeat(64) },
      handoff: completedHandoff(),
      timestamp: T0,
    }), /receipt digest is invalid/);
    assert.deepEqual(store.missingCompletedSpecialists(item.id), ['backend-engineer']);
  });

  it('rejects a prompt containing multiple assignment receipts', t => {
    const { root, store, item, assignmentReceipt } = fixture(t);
    const other = 'AS-00000000-0000-4000-8000-000000000000';
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: item.id,
      sessionId: SESSION,
      agentPrompt: `${assignmentReceipt.id} ${other}`,
      handoff: completedHandoff(),
      timestamp: T0,
    }), /exactly one assignment receipt/);
    assert.deepEqual(store.missingCompletedSpecialists(item.id), ['backend-engineer']);
  });

  it('requires an explicit pass/fail verdict from independent QA instead of parsing prose', t => {
    const { root, store, item } = fixture(t);
    let review = store.apply(item.id, EVENTS.READINESS_READY,
      gateEvidence('readiness', 'READY', 'test'), { timestamp: T0 });
    store.acquireLease(review.id, SESSION, T0);
    const assignment = buildSpecialistAssignment({
      role: 'independent-qa', delegatedBy: 'ceo', phase: 'review', mode: 'verification',
      scale: 'compact',
      question: 'Verify the approved behavior.', codeWrite: false, writeScope: [],
      completionCriteria: ['Return an explicit verdict'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: [], cleanRoom: true },
    });
    const assignmentReceipt = store.recordAssignment(review.id, assignment, SESSION, T0);
    store.recordAssignmentUse(review.id, assignmentReceipt.id, SESSION, T0);
    const verbose = { ...completedHandoff('x'.repeat(81)), verdict: 'pass' };
    assert.ok(Buffer.byteLength(JSON.stringify(verbose), 'utf8') < 3072);
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: review.id, sessionId: SESSION, assignmentId: assignmentReceipt.id,
      handoff: verbose, timestamp: T0,
    }), /longer than 80/);
    const missingVerdict = {
      ...completedHandoff('Checks passed; prose must not substitute for the verdict field.'),
      decisions: ['Keep contract stable'],
    };
    assert.throws(() => recordAutomaticHandoff(root, {
      workItemId: review.id, sessionId: SESSION, assignmentId: assignmentReceipt.id,
      handoff: missingVerdict, timestamp: T0,
    }), /structured verdict pass or fail/);
    review = store.get(review.id);
    assert.equal(review.phase, 'review');
  });
});
