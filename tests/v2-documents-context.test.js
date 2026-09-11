'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createInitialWorkItem,
  writeWorkItemRoot,
  writePhaseDocument,
  workItemDirectory,
  renderMaster,
  writeMaster,
  buildContextView,
  addSearchReceipt,
  buildSpecialistAssignment,
  validateContract,
  validateSchema,
  searchRelatedWork,
} = require('../lib/workflow/v2');

const T0 = '2026-09-01T00:00:00.000Z';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-docs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function item() {
  return createInitialWorkItem({
    id: 'WI-2026-09-01-password-reset',
    title: 'Password reset',
    primaryFeature: 'authentication/password-reset',
    affectedFeatures: ['authentication'],
    scale: 'standard',
  }, T0);
}

describe('v2 canonical document manager', () => {
  it('writes one root and one canonical phase document', t => {
    const root = fixture(t);
    const workItem = item();
    const rootPath = writeWorkItemRoot(root, workItem, '# Password reset');
    const plan = writePhaseDocument(root, workItem, 'plan', '# Plan', { status: 'approved' });
    assert.ok(fs.existsSync(rootPath));
    assert.ok(fs.existsSync(plan.filePath));
    assert.equal(plan.revision, 1);
    assert.equal(fs.existsSync(path.join(path.dirname(plan.filePath), 'revisions')), false);
  });

  it('snapshots only an approved materially changed phase', t => {
    const root = fixture(t);
    const workItem = item();
    const first = writePhaseDocument(root, workItem, 'design', '# Design v1', { status: 'approved' });
    const second = writePhaseDocument(root, workItem, 'design', '# Design v2', { status: 'approved', materialChange: true });
    assert.equal(first.revision, 1);
    assert.equal(second.revision, 2);
    const snapshot = path.join(path.dirname(second.filePath), 'revisions', 'v1.md');
    assert.match(fs.readFileSync(snapshot, 'utf8'), /Design v1/);

    const reaffirmed = writePhaseDocument(root, workItem, 'design', '# Design v2 reaffirmed', { status: 'approved' });
    assert.equal(reaffirmed.revision, 2);
    assert.equal(fs.existsSync(path.join(path.dirname(second.filePath), 'revisions', 'v2.md')), false);
  });

  it('freezes the completed Report against later writes', t => {
    const root = fixture(t);
    const workItem = item();
    writePhaseDocument(root, workItem, 'report', '# Final', { status: 'approved', frozen: true });
    assert.throws(
      () => writePhaseDocument(root, workItem, 'report', '# Changed', { status: 'approved' }),
      /immutable/
    );
  });

  it('renders Master from Work item roots but writes it only on explicit call', t => {
    const root = fixture(t);
    const workItem = item();
    writeWorkItemRoot(root, workItem, '# Password reset');
    const masterPath = path.join(root, 'docs', 'README.md');
    const rendered = renderMaster(root);
    assert.match(rendered, /Password reset/);
    assert.match(rendered, /2026-09-01/);
    assert.doesNotMatch(rendered, /GMT|Standard Time/);
    assert.equal(fs.existsSync(masterPath), false);
    writeMaster(root);
    assert.equal(fs.readFileSync(masterPath, 'utf8'), rendered);
  });
});

describe('v2 history and Context View', () => {
  it('finds current and Legacy related work without changing either', t => {
    const root = fixture(t);
    const workItem = item();
    writeWorkItemRoot(root, workItem, '# Password reset');
    const legacy = path.join(root, 'docs', 'login-legacy', '01-plan');
    fs.mkdirSync(legacy, { recursive: true });
    fs.writeFileSync(path.join(legacy, 'main.md'), '---\nfeature: login-legacy\nsummary: Legacy login flow\n---\n');
    const results = searchRelatedWork(root, 'authentication password reset login', { primaryFeature: 'authentication/password-reset' });
    assert.equal(results[0].id, workItem.id);
    assert.ok(results.some(result => result.kind === 'legacy'));
  });

  it('builds an independent QA clean-room view', () => {
    const view = buildContextView({
      role: 'independent-qa',
      phase: 'review',
      candidates: [
        { path: '01-plan/main.md', class: 'plan', source: 'canonical' },
        { path: '02-design/main.md', class: 'design', source: 'canonical' },
        { path: '03-do/self-review.md', class: 'evidence', source: 'implementation-self-evaluation' },
        { path: 'src/login.js', class: 'code', source: 'repository' },
      ],
    });
    assert.equal(view.cleanRoom, true);
    assert.ok(!view.refs.some(ref => ref.path.includes('self-review')));
    const withReceipt = addSearchReceipt(view, {
      query: 'login consumers', reason: 'regression surface', paths: ['src/app.js'], searchedAt: T0,
    });
    assert.equal(withReceipt.receipts.length, 1);
  });

  it('injects the full handoff output contract into assignments', () => {
    const assignment = buildSpecialistAssignment({
      role: 'backend-engineer',
      delegatedBy: 'cto',
      phase: 'do',
      mode: 'implementation',
      question: 'Implement REQ-020 without changing public contracts.',
      codeWrite: true,
      writeScope: ['lib/workflow/v2/**'],
      completionCriteria: ['All v2 state tests pass'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: [], cleanRoom: false },
    });
    assert.equal(assignment.outputContract.title, 'VAIS v2 Specialist Handoff');
    assert.equal(validateContract('specialistAssignment', assignment).valid, true);
  });

  it('publishes the scale-specific QA byte budget in the assignment contract', () => {
    const input = {
      role: 'independent-qa',
      scale: 'compact',
      delegatedBy: 'ceo',
      phase: 'review',
      mode: 'verification',
      question: 'Verify REQ-001 independently.',
      codeWrite: false,
      writeScope: [],
      completionCriteria: ['Return a traceable verdict'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: [], cleanRoom: true },
    };
    const assignment = buildSpecialistAssignment(input);
    assert.equal(assignment.outputContract['x-vais-max-serialized-bytes'], 3072);
    assert.equal(assignment.outputContract['x-vais-target-serialized-bytes'], 2048);
    assert.match(assignment.outputContract.description, /UTF-8.*3072.*2048/);
    assert.equal(assignment.outputContract.properties.judgment.maxLength, 80);
    assert.equal(assignment.outputContract.properties.decisions.maxItems, 2);
    assert.equal(assignment.outputContract.properties.behavior.properties.outputs.items.maxLength, 20);
    assert.equal(assignment.outputContract.properties.evidence.maxItems, 2);
    assert.equal(assignment.outputContract.properties.risks.items.maxLength, 28);
    assert.equal(assignment.outputContract.properties.unverified.items.maxLength, 28);
    const bounded = {
      schema: 'specialist-handoff/v1', status: 'completed', verdict: 'pass', judgment: '😀'.repeat(80),
      decisions: ['😀'.repeat(25), '😁'.repeat(25)],
      behavior: {
        inputs: ['😀'.repeat(20), '😁'.repeat(20)],
        outputs: ['😀'.repeat(20), '😁'.repeat(20)],
        errors: ['😀'.repeat(20), '😁'.repeat(20)],
      },
      evidence: ['😀'.repeat(100), '😁'.repeat(100)],
      affectedRequirements: Array.from({ length: 20 }, (_, index) => `REQ-${String(index + 1).padStart(3, '0')}`),
      risks: ['😀'.repeat(28), '😁'.repeat(28)],
      unverified: ['😀'.repeat(28), '😁'.repeat(28)],
      recommendedChecks: ['a'.repeat(40), 'b'.repeat(40), 'c'.repeat(40), 'd'.repeat(40)],
    };
    assert.equal(validateSchema(assignment.outputContract, bounded).valid, true);
    assert.ok(Buffer.byteLength(JSON.stringify(bounded), 'utf8') < 3072);
    const attempt15Handoff = {
      schema: 'specialist-handoff/v1', status: 'completed', verdict: 'pass',
      judgment: 'REQ-001~008 confirmed by code review and independent e2e rerun (5/5 pass)',
      decisions: ['independent e2e rerun', 'clean-room code review'],
      behavior: {
        inputs: ['book/cancel click'], outputs: ['labels,count,msg'], errors: ['unbooked cancel noop'],
      },
      evidence: [
        'docs/work-items/booking-cancellation/2026-09-06-booking-cancellation/03-do/evidence/logs/e2e.log',
        '.vais/evidence/mini-booking/book-cancel-1280x900.png',
      ],
      affectedRequirements: Array.from({ length: 8 }, (_, index) => `REQ-${String(index + 1).padStart(3, '0')}`),
      risks: ['hidden-click only guard'], unverified: ['a11y/keyboard flow'], recommendedChecks: ['e2e'],
    };
    assert.equal(validateSchema(assignment.outputContract, attempt15Handoff).valid, true);
    assert.equal(Buffer.byteLength(JSON.stringify(attempt15Handoff), 'utf8'), 703);
    assert.equal(validateSchema(assignment.outputContract, {
      ...attempt15Handoff, risks: ['x'.repeat(29)],
    }).valid, false);
    assert.throws(() => buildSpecialistAssignment({ ...input, scale: undefined }), /requires a valid.*scale/);
  });
});
