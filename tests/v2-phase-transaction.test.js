'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { describe, it } = require('node:test');
const workflow = require('../lib/workflow/v2');
const { execute } = require('../scripts/vais-workflow-v2');
const transactionApi = {
  ...require('../lib/workflow/v2/phase-transaction'),
  ...workflow,
};

const {
  EVENTS,
  createInitialWorkItem,
  canonicalDoSpecialists,
  canonicalWriteScopes,
  canonicalToolChecks,
  enforceSpecialistBudget,
  phaseDocumentPath,
  workItemDirectory,
  RECEIPT_LIMITS,
  WorkItemStore,
  AuthorizationStore,
  buildSpecialistAssignment,
  recordAutomaticHandoff,
  prepareReviewEvidence,
  captureRepoSnapshot,
  diffSnapshots,
  runPhaseTransaction,
  writePhaseDocument,
} = transactionApi;

const T0 = '2026-09-02T00:00:00.000Z';
const SESSION = 'session-phase-transaction';

const PLAN = [
  '# Plan',
  '## 문제', '예약 토글의 상태가 불명확하다.',
  '## 목표', '결정적인 예약 상태를 제공한다.',
  '## 범위', '예약 토글만 포함한다.',
  '## 요구사항', 'REQ-001: 예약 토글 상태를 갱신한다.',
  '## 사용자 흐름', '사용자가 수업을 누르면 확인 상태를 본다.',
  '## 엣지 케이스', '반복 클릭은 동일 결과를 유지한다.',
  '## 완료 조건', 'TC-001 기준을 통과한다.',
  '## 영향', '예약 화면만 영향받는다.',
].join('\n');

const DESIGN = [
  '# Design',
  '## REQ 동작', 'REQ-001 behavior는 단일 상태 토글이다.',
  '## 입력 출력 오류', 'input은 class id, output은 booking state, error는 invalid id다.',
  '## Test cases', 'TC-001은 반복 클릭 결과를 검증한다.',
  '## 전문 영역 coverage', 'UI는 불필요, backend는 불필요, data는 불필요다.',
  '## Agent와 쓰기 범위', '담당 CTO, write scope는 tests/**이며 별도 specialist는 없다.',
  '## Readiness와 Review', 'readiness test와 review test를 실행한다.',
  '## Rollback', '테스트 변경을 되돌려 복구한다.',
].join('\n');

const REVIEW = [
  '# Review',
  '## 요구사항', 'REQ-001',
  '## 테스트', 'TC-001',
  '## 입력 출력', 'input class id, output booking state',
  '## 기대 실제', 'expected toggle, actual toggle',
  '## 엣지 제한', 'edge repeat click, limitation none',
  '## 증거', 'evidence: test receipt',
].join('\n');

const DO = [
  '# Do',
  '## 구현 변경', 'REQ-001 예약 토글 구현을 갱신했다.',
  '## 검증 증거', 'TC-001 test 실행으로 동작을 확인했다.',
].join('\n');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-transaction-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function presentPlan(root) {
  authorize(root, 'plan', null, 'start-request');
  return runPhaseTransaction(root, {
    phase: 'plan', action: 'present',
    id: 'WI-2026-09-02-transaction',
    title: 'Lean transaction',
    primaryFeature: 'workflow',
    scale: 'compact',
    sessionId: SESSION,
    revision: 1,
    body: PLAN,
    timestamp: T0,
  });
}

function authorize(root, phase, workItemId, action = 'continue-work') {
  return new AuthorizationStore(root).grant({
    sessionId: SESSION, workItemId, phase, action,
    allowedPaths: [], allowedCommands: [],
  }, T0);
}

function gateEvidence(gate, verdict, check) {
  const passed = ['PASS', 'READY'].includes(verdict);
  return {
    gateResult: {
      gate, verdict, requiredChecks: [check], passed: passed ? [check] : [],
      failed: ['FAIL', 'NOT_READY'].includes(verdict) ? [check] : [],
      blocked: verdict === 'BLOCKED' ? [check] : [], missing: [], evaluatedAt: T0,
    },
  };
}

function runCli(root, args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'scripts', 'vais-workflow-v2.js'), ...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

function advanceToReview(root) {
  const plan = presentPlan(root);
  const store = new WorkItemStore(root);
  store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
  authorize(root, 'design', plan.workItemId);
  const design = runPhaseTransaction(root, {
    phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION, revision: 1,
    body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
    requiredSpecialists: [], timestamp: T0,
  });
  store.apply(design.workItemId, EVENTS.USER_DESIGN_APPROVED, {}, { timestamp: T0 });
  store.apply(design.workItemId, EVENTS.READINESS_READY,
    gateEvidence('readiness', 'READY', 'do-document'), { timestamp: T0 });
  authorize(root, 'review', design.workItemId);
  return { store, item: store.get(design.workItemId) };
}

function advanceToReport(root) {
  const { store, item } = advanceToReview(root);
  writePhaseDocument(root, item, 'review', REVIEW, { status: 'draft' });
  store.apply(item.id, EVENTS.QA_PASS, gateEvidence('review', 'PASS', 'review-document'), { timestamp: T0 });
  store.apply(item.id, EVENTS.USER_FINAL_APPROVED, {}, { timestamp: T0 });
  authorize(root, 'report', item.id);
  return { store, item: store.get(item.id) };
}

describe('v2 phase transaction receipts', () => {
  it('canonicalizes an existing directory scope without widening exact file scopes', t => {
    const root = fixture(t);
    fs.mkdirSync(path.join(root, 'src', 'feature'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'exact.js'), 'module.exports = true;\n');
    assert.deepEqual(canonicalWriteScopes(root, ['src/feature']), ['src/feature/**']);
    assert.deepEqual(canonicalWriteScopes(root, ['src/exact.js']), ['src/exact.js']);
    assert.deepEqual(canonicalWriteScopes(root, ['src/future.js']), ['src/future.js']);
    assert.throws(() => canonicalWriteScopes(root, ['src/*']), /exact path or directory/);
  });

  it('rejects invented readiness and Review adapter names during Design', () => {
    assert.deepEqual(canonicalToolChecks(['test'], 'readiness'), ['test']);
    assert.deepEqual(canonicalToolChecks(['e2e'], 'Review'), ['e2e']);
    assert.throws(() => canonicalToolChecks(['npm-test'], 'readiness'), /Unknown Design-declared Tool adapter/);
    assert.throws(() => canonicalToolChecks(['browser-qa'], 'Review'), /Unknown Design-declared Tool adapter/);
    assert.throws(() => canonicalToolChecks(['constructor'], 'Review'), /Unknown Design-declared Tool adapter/);
  });

  it('requires explicit revision and matching current-session authorization', t => {
    const root = fixture(t);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: 'WI-2026-09-02-no-revision', sessionId: SESSION,
      title: 'No revision', primaryFeature: 'workflow', scale: 'compact', body: PLAN, timestamp: T0,
    }), /explicit positive integer revision/);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: 'WI-2026-09-02-no-auth', sessionId: SESSION, revision: 1,
      title: 'No auth', primaryFeature: 'workflow', scale: 'compact', body: PLAN, timestamp: T0,
    }), /managed session authorization/);
    authorize(root, 'design', null, 'start-request');
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: 'WI-2026-09-02-wrong-auth', sessionId: SESSION, revision: 1,
      title: 'Wrong auth', primaryFeature: 'workflow', scale: 'compact', body: PLAN, timestamp: T0,
    }), /authorization is stale/);
  });

  it('requires Design and Review trace sets to exactly match their canonical predecessors', t => {
    const root = fixture(t);
    authorize(root, 'plan', null, 'start-request');
    const plan = runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: 'WI-2026-09-02-trace-set', sessionId: SESSION, revision: 1,
      title: 'Trace set', primaryFeature: 'workflow', scale: 'compact',
      body: PLAN.replace('REQ-001: 예약', 'REQ-001: 예약\nREQ-002: 취소'), timestamp: T0,
    });
    const store = new WorkItemStore(root);
    store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
    authorize(root, 'design', plan.workItemId);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION, revision: 1,
      body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
      requiredSpecialists: [], timestamp: T0,
    }), /Canonical design document preflight failed/);
  });

  it('treats missing independent-QA handoff as a precondition without consuming a QA retry', t => {
    const root = fixture(t);
    const { store, item } = advanceToReview(root);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'review', action: 'decide', id: item.id, sessionId: SESSION, revision: 1,
      body: REVIEW, timestamp: T0,
    }), error => error.code === 'QA_HANDOFF_PRECONDITION');
    const after = store.get(item.id);
    assert.deepEqual({ phase: after.phase, status: after.status, retries: after.qaRepairCount },
      { phase: 'review', status: 'active', retries: 0 });
  });

  it('consumes one QA retry only for a persisted structured fail verdict', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'qa-fail-fixture', version: '1.0.0', scripts: { test: 'node -e "process.exit(0)"' },
    }));
    const { store, item } = advanceToReview(root);
    prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    store.acquireLease(item.id, SESSION, T0);
    const assignment = buildSpecialistAssignment({
      role: 'independent-qa', delegatedBy: 'ceo', phase: 'review', mode: 'verification',
      scale: 'compact',
      question: 'Independently verify REQ-001.', codeWrite: false, writeScope: [],
      completionCriteria: ['TC-001'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: [], cleanRoom: true },
    });
    const receipt = store.recordAssignment(item.id, assignment, SESSION, T0);
    store.recordAssignmentUse(item.id, receipt.id, SESSION, T0);
    recordAutomaticHandoff(root, {
      workItemId: item.id, sessionId: SESSION, assignmentId: receipt.id, timestamp: T0,
      handoff: {
        schema: 'specialist-handoff/v1', status: 'completed', verdict: 'fail', judgment: 'TC-001 failed',
        decisions: ['Return to Design'], behavior: { inputs: ['class id'], outputs: ['wrong state'], errors: ['none'] },
        evidence: ['TC-001'], affectedRequirements: ['REQ-001'], risks: [], unverified: [], recommendedChecks: ['test'],
      },
    });
    const result = runPhaseTransaction(root, {
      phase: 'review', action: 'decide', id: item.id, sessionId: SESSION, revision: 1,
      body: REVIEW, timestamp: T0,
    });
    assert.equal(result.verdict, 'FAIL');
    const after = store.get(item.id);
    assert.deepEqual({ phase: after.phase, status: after.status, retries: after.qaRepairCount },
      { phase: 'design', status: 'active', retries: 1 });
  });

  it('prepares each Review check identity once and Review decide reuses the same receipt', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'review-dedupe-fixture', version: '1.0.0',
      scripts: { test: 'node -e "require(\'fs\').appendFileSync(\'.check-runs\', \'x\')"' },
    }));
    const { store, item } = advanceToReview(root);
    const first = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    const second = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    assert.equal(first.checks[0].identity, second.checks[0].identity);
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'x');
    store.acquireLease(item.id, SESSION, T0);
    const assignment = buildSpecialistAssignment({
      role: 'independent-qa', delegatedBy: 'ceo', phase: 'review', mode: 'verification',
      scale: 'compact',
      question: 'Verify the prepared receipt.', codeWrite: false, writeScope: [], completionCriteria: ['TC-001'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: first.checks, cleanRoom: true },
    });
    const assignmentReceipt = store.recordAssignment(item.id, assignment, SESSION, T0);
    store.recordAssignmentUse(item.id, assignmentReceipt.id, SESSION, T0);
    recordAutomaticHandoff(root, {
      workItemId: item.id, sessionId: SESSION, assignmentId: assignmentReceipt.id, timestamp: T0,
      handoff: {
        schema: 'specialist-handoff/v1', status: 'completed', verdict: 'pass', judgment: 'Prepared evidence passed',
        decisions: ['Accept'], behavior: { inputs: ['receipt'], outputs: ['pass'], errors: [] },
        evidence: [first.checks[0].evidencePath], affectedRequirements: ['REQ-001'], risks: [], unverified: [],
        recommendedChecks: [],
      },
    });
    const decided = runPhaseTransaction(root, {
      phase: 'review', action: 'decide', id: item.id, sessionId: SESSION, revision: 1,
      body: REVIEW, timestamp: T0,
    });
    assert.equal(decided.verdict, 'PASS');
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'x');
    const events = store.readRegistry().events;
    const completed = events.filter(event => event.type === 'check.completed' && event.details.check === 'test');
    assert.equal(completed.length, 1);
    assert.equal(completed[0].details.designRevision, 1);
    assert.equal(typeof completed[0].details.command, 'string');
    assert.equal(completed[0].details.command.length > 0, true);
    assert.equal(typeof completed[0].details.repoDigest, 'string');
    assert.equal(completed[0].details.repoDigest.length, 64);
    assert.equal(completed[0].details.identity, first.checks[0].identity);
    assert.ok(events.filter(event => event.type === 'check.reused' && event.details.check === 'test').length >= 2);
  });

  it('retries non-pass Review evidence only through one reason-bound supplemental check', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'check.js'), [
      "const fs = require('fs');",
      "fs.appendFileSync('.check-runs', 'x');",
      "process.exit(fs.existsSync('.recovered') ? 0 : 1);",
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'review-supplemental-fixture', version: '1.0.0', scripts: { test: 'node check.js' },
    }));
    const { store, item } = advanceToReview(root);
    const first = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    assert.equal(first.checks[0].verdict, 'fail');
    const unchanged = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    assert.equal(unchanged.checks[0].verdict, 'fail');
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'x');

    fs.writeFileSync(path.join(root, '.recovered'), 'true\n');
    assert.throws(() => prepareReviewEvidence(root, {
      id: item.id, sessionId: SESSION, revision: 1, supplementalChecks: ['test'], timestamp: T0,
    }), /supplemental-reason/);
    const recovered = prepareReviewEvidence(root, {
      id: item.id, sessionId: SESSION, revision: 1,
      supplementalChecks: ['test'], supplementalReason: 'Transient test dependency recovered.', timestamp: T0,
    });
    assert.equal(recovered.checks[0].verdict, 'pass');
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'xx');
    const capped = prepareReviewEvidence(root, {
      id: item.id, sessionId: SESSION, revision: 1,
      supplementalChecks: ['test'], supplementalReason: 'Do not execute twice.', timestamp: T0,
    });
    assert.equal(capped.checks[0].verdict, 'pass');
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'xx');
    const events = store.readRegistry().events.filter(event =>
      event.type === 'check.completed' && event.details.check === 'test');
    assert.equal(events.filter(event => event.details.supplemental === true).length, 1);
  });

  it('never reruns a valid PASS receipt through the supplemental option', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'review-pass-no-supplement-fixture', version: '1.0.0',
      scripts: { test: 'node -e "require(\'fs\').appendFileSync(\'.check-runs\', \'x\')"' },
    }));
    const { item } = advanceToReview(root);
    const first = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    assert.equal(first.checks[0].verdict, 'pass');
    const attempted = prepareReviewEvidence(root, {
      id: item.id, sessionId: SESSION, revision: 1,
      supplementalChecks: ['test'], supplementalReason: 'Arbitrary retry must be ignored.', timestamp: T0,
    });
    assert.equal(attempted.checks[0].verdict, 'pass');
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'x');
  });

  it('claims a check identity so concurrent prepares execute it only once', async t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'check.js'), [
      "const fs = require('fs');",
      "fs.appendFileSync('.check-runs', 'x');",
      'setTimeout(() => process.exit(0), 500);',
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'review-concurrent-fixture', version: '1.0.0', scripts: { test: 'node check.js' },
    }));
    const { item } = advanceToReview(root);
    new AuthorizationStore(root).grant({
      sessionId: SESSION, workItemId: item.id, phase: 'review', action: 'continue-work',
      allowedPaths: [], allowedCommands: [],
    });
    const args = ['review', 'prepare', '--id', item.id, '--session', SESSION, '--revision', '1'];
    const outcomes = await Promise.all([runCli(root, args), runCli(root, args)]);
    assert.ok(outcomes.some(outcome => outcome.status === 0), JSON.stringify(outcomes));
    assert.ok(outcomes.every(outcome => outcome.status === 0 ||
      /already in progress/.test(outcome.stderr)));
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'x');
  });

  it('claims a supplemental identity so concurrent recovery executes only once', async t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'check.js'), [
      "const fs = require('fs');",
      "fs.appendFileSync('.check-runs', 'x');",
      "setTimeout(() => process.exit(fs.existsSync('.recovered') ? 0 : 1), 500);",
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'review-concurrent-supplement-fixture', version: '1.0.0', scripts: { test: 'node check.js' },
    }));
    const { item } = advanceToReview(root);
    const initial = prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    assert.equal(initial.checks[0].verdict, 'fail');
    fs.writeFileSync(path.join(root, '.recovered'), 'true\n');
    new AuthorizationStore(root).grant({
      sessionId: SESSION, workItemId: item.id, phase: 'review', action: 'continue-work',
      allowedPaths: [], allowedCommands: [],
    });
    const args = ['review', 'prepare', '--id', item.id, '--session', SESSION, '--revision', '1',
      '--supplemental-check', 'test', '--supplemental-reason', 'dependency recovered'];
    const outcomes = await Promise.all([runCli(root, args), runCli(root, args)]);
    assert.ok(outcomes.some(outcome => outcome.status === 0), JSON.stringify(outcomes));
    assert.ok(outcomes.every(outcome => outcome.status === 0 ||
      /already in progress/.test(outcome.stderr)));
    assert.equal(fs.readFileSync(path.join(root, '.check-runs'), 'utf8'), 'xx');
  });

  it('blocks Report completion while transient draft Markdown remains', t => {
    const root = fixture(t);
    const { store, item } = advanceToReport(root);
    const draft = path.join(root, '.vais', 'v2', 'drafts', 'draft-leftover.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, '# transient\n');
    const receipt = runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION, revision: 1,
      outcome: 'Accepted outcome.', timestamp: T0,
    });
    assert.equal(receipt.verdict, 'FAIL');
    assert.equal(store.get(item.id).status, 'blocked');
    assert.equal(fs.existsSync(draft), true);
  });

  it('blocks Report when docs outside the current Work item contain draft.md', t => {
    const root = fixture(t);
    const { store, item } = advanceToReport(root);
    const draft = path.join(root, 'docs', 'unrelated-feature', 'draft.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, '# unrelated transient\n');
    const receipt = runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION, revision: 1,
      outcome: 'Accepted outcome.', timestamp: T0,
    });
    assert.equal(receipt.verdict, 'FAIL');
    assert.equal(store.get(item.id).status, 'blocked');
    assert.equal(fs.existsSync(draft), true);
  });

  it('blocks Report on a transient draft symlink without following or deleting it', t => {
    const root = fixture(t);
    const { store, item } = advanceToReport(root);
    const outside = path.join(os.tmpdir(), `vais-v2-draft-outside-${process.pid}-${Date.now()}.md`);
    fs.writeFileSync(outside, '# outside sentinel\n');
    t.after(() => { try { fs.unlinkSync(outside); } catch (_) { /* already removed */ } });
    const draft = path.join(root, '.vais', 'v2', 'drafts', 'draft-linked.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.symlinkSync(outside, draft);
    const receipt = runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION, revision: 1,
      outcome: 'Accepted outcome.', timestamp: T0,
    });
    assert.equal(receipt.verdict, 'FAIL');
    assert.equal(store.get(item.id).status, 'blocked');
    assert.equal(fs.lstatSync(draft).isSymbolicLink(), true);
    assert.equal(fs.readFileSync(outside, 'utf8'), '# outside sentinel\n');
  });

  it('requires a fresh independent QA assignment after each non-material repair cycle', t => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      name: 'qa-cycle-fixture', version: '1.0.0', scripts: { test: 'node -e "process.exit(0)"' },
    }));
    const { store, item } = advanceToReview(root);
    prepareReviewEvidence(root, { id: item.id, sessionId: SESSION, revision: 1, timestamp: T0 });
    store.acquireLease(item.id, SESSION, T0);
    const assignment = buildSpecialistAssignment({
      role: 'independent-qa', delegatedBy: 'ceo', phase: 'review', mode: 'verification',
      scale: 'compact',
      question: 'Verify cycle zero.', codeWrite: false, writeScope: [], completionCriteria: ['TC-001'],
      context: { refs: ['01-plan/main.md', '02-design/main.md'], receipts: [], cleanRoom: true },
    });
    const oldReceipt = store.recordAssignment(item.id, assignment, SESSION, T0);
    store.recordAssignmentUse(item.id, oldReceipt.id, SESSION, T0);
    recordAutomaticHandoff(root, {
      workItemId: item.id, sessionId: SESSION, assignmentId: oldReceipt.id, timestamp: T0,
      handoff: {
        schema: 'specialist-handoff/v1', status: 'completed', verdict: 'fail', judgment: 'Cycle zero failed',
        decisions: ['Repair'], behavior: { inputs: ['id'], outputs: ['wrong'], errors: [] }, evidence: ['TC-001'],
        affectedRequirements: ['REQ-001'], risks: [], unverified: [], recommendedChecks: ['test'],
      },
    });
    runPhaseTransaction(root, {
      phase: 'review', action: 'decide', id: item.id, sessionId: SESSION, revision: 1,
      body: REVIEW, timestamp: T0,
    });
    assert.equal(store.get(item.id).qaRepairCount, 1);

    authorize(root, 'design', item.id);
    const repaired = runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: item.id, sessionId: SESSION, revision: 1,
      body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
      requiredSpecialists: [], materialChange: false, timestamp: T0,
    });
    assert.deepEqual(repaired.next, { phase: 'do', status: 'active' });
    authorize(root, 'do', item.id);
    const doReceipt = runPhaseTransaction(root, {
      phase: 'do', action: 'ready', id: item.id, sessionId: SESSION, revision: 1,
      body: DO, timestamp: T0,
    });
    assert.deepEqual(doReceipt.continuation,
      { automatic: true, nextAction: 'review-evidence-prepare', requiresUserTurn: false });
    assert.equal(store.readRegistry().events.filter(event =>
      event.type === 'repo.snapshot.updated' && event.details.transactionId === doReceipt.id).length, 1);
    authorize(root, 'review', item.id);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'review', action: 'decide', id: item.id, sessionId: SESSION, revision: 1,
      body: REVIEW, timestamp: T0,
    }), error => error.code === 'QA_HANDOFF_PRECONDITION');
    const newReceipt = store.recordAssignment(item.id, assignment, SESSION, T0);
    assert.equal(oldReceipt.repairCycle, 0);
    assert.equal(newReceipt.repairCycle, 1);
    assert.notEqual(newReceipt.id, oldReceipt.id);
  });

  it('increments Design revision and waits for approval on a material QA repair', t => {
    const root = fixture(t);
    const { store, item } = advanceToReview(root);
    store.apply(item.id, EVENTS.QA_FAIL, gateEvidence('review', 'FAIL', 'review-document'), { timestamp: T0 });
    authorize(root, 'design', item.id);
    const repaired = runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: item.id, sessionId: SESSION, revision: 1,
      body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
      requiredSpecialists: [], materialChange: true, timestamp: T0,
    });
    assert.deepEqual(repaired.next, { phase: 'design', status: 'waiting-user' });
    const waiting = store.get(item.id);
    assert.equal(waiting.designRevision, 2);
    assert.equal(waiting.approvals.design, 'pending');
    assert.equal(waiting.qaRepairCount, 1);
    const parsed = fs.readFileSync(phaseDocumentPath(root, waiting, 'design'), 'utf8');
    assert.match(parsed, /revision: 2/);
    store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {}, { timestamp: T0 });
    assert.equal(store.get(item.id).qaRepairCount, 0);
  });

  it('rolls back generated indexes when Report finalization fails after an index write', t => {
    const root = fixture(t);
    const { store, item } = advanceToReport(root);
    const featureIndex = path.join(root, 'docs', 'features', 'workflow', 'main.md');
    fs.mkdirSync(path.dirname(featureIndex), { recursive: true });
    fs.writeFileSync(featureIndex, 'feature sentinel\n');
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-report-outside-'));
    t.after(() => fs.rmSync(outsideDir, { recursive: true, force: true }));
    const outside = path.join(outsideDir, 'outside-master.md');
    fs.writeFileSync(outside, 'outside sentinel\n');
    const master = path.join(root, 'docs', 'README.md');
    fs.symlinkSync(outside, master);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION, revision: 1,
      outcome: 'Accepted outcome.', timestamp: T0,
    }), /Master document path escapes/);
    assert.equal(fs.readFileSync(featureIndex, 'utf8'), 'feature sentinel\n');
    assert.equal(fs.readFileSync(outside, 'utf8'), 'outside sentinel\n');
    assert.equal(fs.lstatSync(master).isSymbolicLink(), false);
    assert.deepEqual({ phase: store.get(item.id).phase, status: store.get(item.id).status },
      { phase: 'report', status: 'active' });
  });

  it('enforces the scale-specific Do specialist budget at Design Gate', () => {
    assert.deepEqual(enforceSpecialistBudget('compact', ['frontend-engineer']), ['frontend-engineer']);
    assert.throws(() => enforceSpecialistBudget('compact', ['frontend-engineer', 'test-engineer']),
      /compact Design allows at most 1/);
    assert.deepEqual(enforceSpecialistBudget('standard', ['frontend-engineer', 'backend-engineer']),
      ['frontend-engineer', 'backend-engineer']);
    assert.throws(() => enforceSpecialistBudget('standard', ['frontend-engineer', 'backend-engineer', 'test-engineer']),
      /standard Design allows at most 2/);
  });

  it('requires canonical three-digit REQ and TC identifiers at document preflight', t => {
    const root = fixture(t);
    new AuthorizationStore(root).grant({
      sessionId: SESSION, workItemId: null, phase: 'plan', action: 'start-request',
      allowedPaths: [], allowedCommands: [],
    });
    const invalid = PLAN.replaceAll('REQ-001', 'REQ-1').replaceAll('TC-001', 'TC-1');
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: 'WI-2026-09-02-short-ids',
      title: 'Short IDs', primaryFeature: 'short-ids', scale: 'compact',
      sessionId: SESSION, revision: 1, body: invalid, timestamp: T0,
    }), /Canonical plan document preflight failed/);
  });

  it('rejects unknown or non-implementation Design specialists before presenting the Gate', () => {
    assert.deepEqual(canonicalDoSpecialists(['frontend-engineer']), ['frontend-engineer']);
    assert.throws(
      () => canonicalDoSpecialists(['frontend']),
      /CTO-delegated implementation role: frontend/,
    );
    assert.throws(
      () => canonicalDoSpecialists(['ui-designer']),
      /CTO-delegated implementation role: ui-designer/,
    );
  });

  it('creates the initial Work item through the public plan present transaction', t => {
    const root = fixture(t);
    const draft = path.join(root, '.vais', 'v2', 'drafts', 'plan.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, PLAN);
    new AuthorizationStore(root).grant({
      sessionId: SESSION, workItemId: null, phase: 'plan', action: 'start-request',
      requestSlug: 'booking-toggle', allowedPaths: [], allowedCommands: [],
    });
    const receipt = execute([
      'plan', 'present', '--slug', 'booking-toggle', '--title', 'Booking toggle',
      '--feature', 'booking-toggle', '--relation', 'new', '--scale', 'compact',
      '--session', SESSION, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md',
    ], root);
    assert.equal(receipt.verdict, 'PASS');
    assert.match(receipt.workItemId, /^WI-\d{4}-\d{2}-\d{2}-booking-toggle$/);
    assert.deepEqual(receipt.next, { phase: 'plan', status: 'waiting-user' });
    assert.equal(fs.existsSync(draft), false);
    const events = new WorkItemStore(root).readRegistry().events;
    assert.equal(events.filter(event =>
      event.type === 'repo.snapshot.updated' && event.details.transactionId === receipt.id).length, 1);
    const snapshot = new WorkItemStore(root).getRepoSnapshot(receipt.workItemId);
    assert.deepEqual(diffSnapshots(snapshot, captureRepoSnapshot(root)), []);
  });

  it('rolls back state and canonical approval writes when final snapshot capture fails', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    const store = new WorkItemStore(root);
    const rootPath = path.join(root, 'docs', 'work-items', 'workflow', '2026-09-02-transaction', 'main.md');
    const planPath = phaseDocumentPath(root, store.get(plan.workItemId), 'plan');
    const beforeRoot = fs.readFileSync(rootPath);
    const beforePlan = fs.readFileSync(planPath);
    assert.throws(() => store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, {
      timestamp: T0,
      repoSnapshotFactory: () => { throw new Error('injected snapshot capture failure'); },
      transactionId: 'PT-snapshot-failure',
    }), /injected snapshot capture failure/);
    assert.deepEqual({ phase: store.get(plan.workItemId).phase, status: store.get(plan.workItemId).status },
      { phase: 'plan', status: 'waiting-user' });
    assert.deepEqual(fs.readFileSync(rootPath), beforeRoot);
    assert.deepEqual(fs.readFileSync(planPath), beforePlan);
  });

  it('closes Plan and Design with one short receipt per phase', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    assert.equal(plan.schema, 'phase-transaction/v1');
    assert.equal(plan.verdict, 'PASS');
    assert.deepEqual(plan.next, { phase: 'plan', status: 'waiting-user' });
    assert.ok(Buffer.byteLength(JSON.stringify(plan)) <= RECEIPT_LIMITS.compact);
    assert.deepEqual(Object.keys(plan).sort(), [
      'action', 'evidencePath', 'findingPath', 'id', 'next', 'phase', 'runtime', 'schema', 'verdict', 'workItemId',
    ]);
    assert.equal(plan.runtime.node, process.version);

    const planEvidence = JSON.parse(fs.readFileSync(path.join(root, plan.evidencePath), 'utf8'));
    assert.ok(Array.isArray(planEvidence.checks));
    assert.equal(Object.prototype.hasOwnProperty.call(plan, 'checks'), false);

    const store = new WorkItemStore(root);
    store.acquireLease(plan.workItemId, SESSION, T0);
    store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, {
      requireLease: true, sessionId: SESSION, timestamp: T0,
    });
    authorize(root, 'design', plan.workItemId);
    const design = runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION,
      revision: 1,
      body: DESIGN,
      writeScopes: ['tests/**'],
      readinessChecks: ['test'],
      reviewChecks: ['test'],
      requiredSpecialists: [],
      timestamp: T0,
    });
    assert.equal(design.verdict, 'PASS');
    assert.deepEqual(design.next, { phase: 'design', status: 'waiting-user' });
    assert.ok(Buffer.byteLength(JSON.stringify(design)) <= RECEIPT_LIMITS.compact);
  });

  it('records a concise failure finding and leaves the Gate state unchanged', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    const store = new WorkItemStore(root);
    store.acquireLease(plan.workItemId, SESSION, T0);
    store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, {
      requireLease: true, sessionId: SESSION, timestamp: T0,
    });
    authorize(root, 'design', plan.workItemId);
    const before = store.get(plan.workItemId);
    let failure;
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION,
      revision: 1,
      body: DESIGN,
      writeScopes: ['.vais/**'],
      readinessChecks: ['test'], reviewChecks: ['test'], timestamp: T0,
    }), error => {
      failure = error;
      assert.match(error.message, /Unsafe (?:Design )?write scope/);
      assert.ok(error.evidencePath);
      return true;
    });
    const after = store.get(plan.workItemId);
    assert.equal(after.phase, before.phase);
    assert.equal(after.status, before.status);
    assert.equal(after.designRevision, before.designRevision);
    const evidence = JSON.parse(fs.readFileSync(path.join(root, failure.evidencePath), 'utf8'));
    assert.equal(evidence.schema, 'phase-transaction-failure/v1');
    assert.ok(Buffer.byteLength(JSON.stringify(evidence)) < 1024);
  });

  it('does not commit a phase state when success-evidence preparation or state commit fails', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    const store = new WorkItemStore(root);
    store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
    authorize(root, 'design', plan.workItemId);
    const before = store.get(plan.workItemId);
    const originalApplySequence = WorkItemStore.prototype.applySequence;
    WorkItemStore.prototype.applySequence = function injectedCommitFailure() {
      throw new Error('injected state commit failure');
    };
    t.after(() => { WorkItemStore.prototype.applySequence = originalApplySequence; });

    let failure;
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION,
      revision: 1, body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'],
      reviewChecks: ['test'], requiredSpecialists: [], timestamp: T0,
    }), error => {
      failure = error;
      assert.match(error.message, /injected state commit failure/);
      return true;
    });

    const after = store.get(plan.workItemId);
    assert.deepEqual({ phase: after.phase, status: after.status }, { phase: before.phase, status: before.status });
    const transactionDir = path.join(root, 'docs', 'work-items', 'workflow', '2026-09-02-transaction',
      '02-design', 'evidence', 'transactions');
    const files = fs.readdirSync(transactionDir);
    assert.equal(files.filter(file => file.endsWith('.json') && !file.endsWith('.failure.json')).length, 0);
    assert.equal(files.filter(file => file.endsWith('.failure.json')).length, 1);
    assert.ok(failure.evidencePath);
  });

  it('keeps the initial Plan transaction atomic and permits a same-session retry after preflight failure', t => {
    const root = fixture(t);
    authorize(root, 'plan', null, 'start-request');
    const id = 'WI-2026-09-02-invalid-plan';
    let failure;
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id,
      title: 'Invalid plan', primaryFeature: 'invalid-plan', scale: 'compact',
      sessionId: SESSION, revision: 1, body: '# Plan\n\nREQ-001 only', timestamp: T0,
    }), error => {
      failure = error;
      assert.match(error.message, /Canonical plan document preflight failed/);
      return true;
    });
    const store = new WorkItemStore(root);
    const registry = store.readRegistry();
    assert.equal(store.get(id), null);
    assert.equal(registry.currentWorkItemId, null);
    assert.equal(registry.events.some(event => event.workItemId === id), false);
    assert.equal(Object.prototype.hasOwnProperty.call(registry.leases, id), false);
    const transient = createInitialWorkItem({
      id, title: 'Invalid plan', primaryFeature: 'invalid-plan', scale: 'compact',
    }, T0);
    assert.equal(fs.existsSync(path.join(workItemDirectory(root, transient), 'main.md')), false);
    assert.equal(fs.existsSync(phaseDocumentPath(root, transient, 'plan')), false);
    const evidence = JSON.parse(fs.readFileSync(path.join(root, failure.evidencePath), 'utf8'));
    assert.equal(evidence.code, 'DOCUMENT_PREFLIGHT_FAILED');
    assert.equal(evidence.preflight.schema, 'document-preflight/v1');
    assert.ok(evidence.preflight.checks.some(check => check.check === 'plan-document' && check.verdict === 'fail'));

    const receipt = runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id,
      title: 'Invalid plan', primaryFeature: 'invalid-plan', scale: 'compact',
      sessionId: SESSION, revision: 1, body: PLAN, timestamp: T0,
    });
    assert.equal(receipt.workItemId, id);
    assert.deepEqual(receipt.next, { phase: 'plan', status: 'waiting-user' });
    assert.deepEqual({ phase: store.get(id).phase, status: store.get(id).status },
      { phase: 'plan', status: 'waiting-user' });
  });

  it('does not overwrite an existing canonical phase document when in-memory preflight fails', t => {
    const root = fixture(t);
    const store = new WorkItemStore(root);
    const item = store.create({
      id: 'WI-2026-09-02-preflight-overwrite', title: 'Preflight overwrite',
      primaryFeature: 'workflow', scale: 'compact',
    }, T0);
    writePhaseDocument(root, item, 'plan', PLAN, { status: 'draft' });
    const canonicalPath = phaseDocumentPath(root, item, 'plan');
    const before = fs.readFileSync(canonicalPath);
    authorize(root, 'plan', item.id);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: item.id, sessionId: SESSION, revision: 1,
      body: '# Plan\n\nREQ-001 only', timestamp: T0,
    }), /Canonical plan document preflight failed/);
    assert.deepEqual(fs.readFileSync(canonicalPath), before);
  });

  it('rejects stale revisions before applying a phase transition', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    const before = new WorkItemStore(root).get(plan.workItemId);
    authorize(root, 'plan', plan.workItemId);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'plan', action: 'present', id: plan.workItemId,
      sessionId: SESSION, revision: 99, body: PLAN, timestamp: T0,
    }), /requires plan\/active|revision is stale/);
    const after = new WorkItemStore(root).get(plan.workItemId);
    assert.equal(after.status, before.status);
    assert.equal(after.planRevision, before.planRevision);
  });

  it('finalizes and freezes Report exactly once through the state transition', t => {
    const root = fixture(t);
    const plan = presentPlan(root);
    const store = new WorkItemStore(root);
    store.apply(plan.workItemId, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
    authorize(root, 'design', plan.workItemId);
    const design = runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: plan.workItemId, sessionId: SESSION,
      revision: 1,
      body: DESIGN, writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
      requiredSpecialists: [], timestamp: T0,
    });
    store.apply(design.workItemId, EVENTS.USER_DESIGN_APPROVED, {}, { timestamp: T0 });
    store.apply(design.workItemId, EVENTS.READINESS_READY,
      gateEvidence('readiness', 'READY', 'do-document'), { timestamp: T0 });
    let item = store.get(design.workItemId);
    writePhaseDocument(root, item, 'review', [
      '# Review', '## 요구사항', 'REQ-001', '## 테스트', 'TC-001', '## 입력 출력', 'input output',
      '## 기대 실제', 'expected actual', '## 엣지 제한', 'edge limitation', '## 증거', 'evidence',
    ].join('\n'), { status: 'draft' });
    store.apply(item.id, EVENTS.QA_PASS, gateEvidence('review', 'PASS', 'review-document'), { timestamp: T0 });
    store.apply(item.id, EVENTS.USER_FINAL_APPROVED, {}, { timestamp: T0 });
    item = store.get(item.id);
    assert.deepEqual({ phase: item.phase, status: item.status }, { phase: 'report', status: 'active' });
    authorize(root, 'report', item.id);
    const receipt = runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION,
      revision: 1, outcome: 'The booking toggle was accepted.', timestamp: T0,
    });
    assert.deepEqual(receipt.next, { phase: 'report', status: 'completed' });
    item = store.get(item.id);
    assert.equal(item.reportFrozen, true);
    const report = fs.readFileSync(phaseDocumentPath(root, item, 'report'), 'utf8');
    assert.match(report, /status: completed/);
    assert.match(report, /frozen: true/);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'report', action: 'finalize', id: item.id, sessionId: SESSION, revision: 1, timestamp: T0,
    }), /requires report\/active/);
  });
});
