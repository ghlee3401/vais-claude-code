/**
 * Unit tests for lib/core/state-machine.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const sm = require('../lib/core/state-machine');

test('PIPELINE_ROLES는 CBO 포함, CMO/CFO/CEO 제외', () => {
  assert.deepStrictEqual(sm.PIPELINE_ROLES, ['cbo', 'cpo', 'cto', 'cso', 'coo']);
});

test('VALID_ROLES는 6 C-Level + auto', () => {
  assert.strictEqual(sm.VALID_ROLES.length, 7);
  for (const r of ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo', 'auto']) {
    assert.ok(sm.VALID_ROLES.includes(r), `missing ${r}`);
  }
  assert.ok(!sm.VALID_ROLES.includes('cmo'));
  assert.ok(!sm.VALID_ROLES.includes('cfo'));
});

test('PHASE_MACHINE은 ideation 포함 6 phase', () => {
  assert.deepStrictEqual(sm.ALL_PHASES, ['ideation', 'plan', 'design', 'do', 'qa', 'report']);
  assert.strictEqual(sm.PHASE_MACHINE.ideation.optional, true);
  assert.strictEqual(sm.PHASE_MACHINE.plan.optional, false);
  assert.strictEqual(sm.PHASE_MACHINE.report.next, null);
});

test('validatePhaseTransition: 정상 전이 6종 허용', () => {
  const cases = [
    [null, 'ideation', []],
    [null, 'plan', []],
    ['ideation', 'plan', ['ideation']],
    ['plan', 'design', ['plan']],
    ['design', 'do', ['plan', 'design']],
    ['do', 'qa', ['plan', 'design', 'do']],
    ['qa', 'report', ['plan', 'design', 'do', 'qa']],
  ];
  for (const [cur, nxt, done] of cases) {
    const r = sm.validatePhaseTransition(cur, nxt, done);
    assert.strictEqual(r.valid, true, `${cur}→${nxt} expected valid, got: ${r.reason}`);
  }
});

test('validatePhaseTransition: 3 invalid 전이 reject', () => {
  // 1. plan prerequisites 미완 상태에서 design 진입
  const r1 = sm.validatePhaseTransition('plan', 'design', []);
  assert.strictEqual(r1.valid, false);

  // 2. idle(null)에서 design 직행 금지
  const r2 = sm.validatePhaseTransition(null, 'design', []);
  assert.strictEqual(r2.valid, false);

  // 3. 알 수 없는 phase
  const r3 = sm.validatePhaseTransition('plan', 'unknown-phase', ['plan']);
  assert.strictEqual(r3.valid, false);
});

test('validateRoleTransition: dependencies 기반 판정', () => {
  const cfg = { dependencies: { cto: ['cpo'], cso: ['cto'], coo: ['cto'], cbo: [] } };
  assert.strictEqual(sm.validateRoleTransition('cpo', 'cto', 'feat-a', cfg).valid, true);
  assert.strictEqual(sm.validateRoleTransition('cto', 'cso', 'feat-a', cfg).valid, true);
  assert.strictEqual(sm.validateRoleTransition(null, 'cbo', 'feat-a', cfg).valid, true, 'cbo has no deps');
  assert.strictEqual(sm.validateRoleTransition(null, 'cto', 'feat-a', cfg).valid, false);
  assert.strictEqual(sm.validateRoleTransition('cpo', 'cso', 'feat-a', cfg).valid, false, 'cso needs cto');
});

test('initializeFeatureState: 기본 plan 진입', () => {
  const s = sm.initializeFeatureState('my-feature', 'cpo', 'plan');
  assert.strictEqual(s.feature, 'my-feature');
  assert.strictEqual(s.role, 'cpo');
  assert.strictEqual(s.currentPhase, 'plan');
  assert.deepStrictEqual(s.completedPhases, []);
  assert.strictEqual(s.version, '0.50.0');
});

test('initializeFeatureState: ideation 진입', () => {
  const s = sm.initializeFeatureState('my-feature', 'cpo', 'ideation');
  assert.strictEqual(s.currentPhase, 'ideation');
});

test('advancePhase: plan → design 전진', () => {
  const s0 = sm.initializeFeatureState('feat', 'cto', 'plan');
  const s1 = sm.advancePhase(s0);
  assert.strictEqual(s1.currentPhase, 'design');
  assert.deepStrictEqual(s1.completedPhases, ['plan']);
});

test('advancePhase: report는 terminal (next null)', () => {
  const s = { feature: 'f', role: 'cto', currentPhase: 'report', completedPhases: ['plan','design','do','qa'], timestamps: {} };
  const out = sm.advancePhase(s);
  assert.strictEqual(out.currentPhase, 'report');
});
