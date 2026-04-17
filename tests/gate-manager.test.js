/**
 * Gate Manager tests (sub-plan 07)
 * SC-5: agent-stop 4-step pipeline — judgePhaseCompletion 결정 테이블
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { judgePhaseCompletion, checkGate, resolveAction } = require('../lib/quality/gate-manager');

test('judgePhaseCompletion: standard pass (docs ✅ cp ✅ tools > 0)', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'plan', documentsValid: true, checkpointsRecorded: true, toolCallCount: 5 });
  assert.strictEqual(r.pass, true);
  assert.strictEqual(r.failures.length, 0);
});

test('judgePhaseCompletion: pass with warn (docs ✅ cp ✅ tools 0)', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'plan', documentsValid: true, checkpointsRecorded: true, toolCallCount: 0 });
  assert.strictEqual(r.pass, true);
  assert.ok(r.reason.includes('warn'));
});

test('judgePhaseCompletion: fail — missing documents', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'do', documentsValid: false, checkpointsRecorded: true, toolCallCount: 10 });
  assert.strictEqual(r.pass, false);
  assert.ok(r.failures.some(f => f.type === 'missing_documents'));
});

test('judgePhaseCompletion: fail — missing checkpoints', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'design', documentsValid: true, checkpointsRecorded: false, toolCallCount: 3 });
  assert.strictEqual(r.pass, false);
  assert.ok(r.failures.some(f => f.type === 'no_checkpoint'));
});

test('judgePhaseCompletion: fail — both missing', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'qa', documentsValid: false, checkpointsRecorded: false, toolCallCount: 1 });
  assert.strictEqual(r.pass, false);
  assert.strictEqual(r.failures.length, 2);
});

test('judgePhaseCompletion: ideation always pass (gate skipped)', () => {
  const r = judgePhaseCompletion({ feature: 'f', phase: 'ideation', documentsValid: false, checkpointsRecorded: false, toolCallCount: 0 });
  assert.strictEqual(r.pass, true);
  assert.ok(r.reason.includes('ideation'));
});

test('checkGate: plan pass (config defaults applied: designCompleteness>=80)', () => {
  // v0.56 sub-plan 07: config.gates.defaults.designCompleteness=80 이 plan phase 에도 적용
  const r = checkGate('plan', { metrics: { designCompleteness: 85 } });
  assert.strictEqual(r.verdict, 'pass');
});

test('checkGate: plan retry when under config default (60 < 80)', () => {
  const r = checkGate('plan', { metrics: { designCompleteness: 60 } });
  assert.strictEqual(r.verdict, 'retry');
});

test('checkGate: qa fail on critical', () => {
  const r = checkGate('qa', { metrics: { matchRate: 95, codeQualityScore: 80, criticalIssueCount: 2 } });
  assert.strictEqual(r.verdict, 'fail');
});

test('checkGate: cso roleOverride 적용 (matchRate 95 요구)', () => {
  // config roleOverrides.cso.matchRate = 95 → qa.pass 의 matchRate condition 95 로 덮어씀
  const r1 = checkGate('qa', { role: 'cso', metrics: { matchRate: 92, codeQualityScore: 85, criticalIssueCount: 0 } });
  assert.notStrictEqual(r1.verdict, 'pass', 'cso 는 matchRate 95 필요, 92 는 미충족');

  const r2 = checkGate('qa', { role: 'cso', metrics: { matchRate: 95, codeQualityScore: 85, criticalIssueCount: 0 } });
  assert.strictEqual(r2.verdict, 'pass');
});

test('resolveAction: L2 pass → auto_proceed', () => {
  assert.strictEqual(resolveAction('pass', 2), 'auto_proceed');
});

test('resolveAction: L2 retry → gate_confirm', () => {
  assert.strictEqual(resolveAction('retry', 2), 'gate_confirm');
});

test('schema: 하네스 게이트 4종 이벤트 존재', () => {
  const schema = require('../lib/observability/schema');
  assert.strictEqual(schema.EVENT_TYPES.ROLE_TRANSITION, 'role_transition');
  assert.strictEqual(schema.EVENT_TYPES.PHASE_TRANSITION_AUTO, 'phase_transition_auto');
  assert.strictEqual(schema.EVENT_TYPES.PHASE_TRANSITION_RETRY, 'phase_transition_retry');
  assert.strictEqual(schema.EVENT_TYPES.GATE_JUDGMENT, 'gate_judgment');
});
