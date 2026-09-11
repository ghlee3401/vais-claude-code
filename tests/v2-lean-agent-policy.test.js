'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
  EVENTS,
  createInitialWorkItem,
  evaluateGate,
  runCheck,
  transition,
} = require('../lib/workflow/v2');

const T0 = '2026-09-02T00:00:00.000Z';

function gateEvidence(gate, verdict, check) {
  return {
    gateResult: {
      gate,
      verdict,
      requiredChecks: [check],
      passed: [check],
      failed: [],
      blocked: [],
      missing: [],
      evaluatedAt: T0,
    },
  };
}

describe('v2 lean mechanical check policy', () => {
  it('advances a compact mechanical-only Do without requiring test-engineer', () => {
    let item = createInitialWorkItem({
      id: 'WI-2026-09-02-mechanical-only',
      title: 'Mechanical-only change',
      primaryFeature: 'workflow',
      affectedFeatures: [],
      scale: 'compact',
    }, T0);
    item = transition(item, EVENTS.PLAN_PRESENTED, gateEvidence('plan', 'PASS', 'plan-document'), T0);
    item = transition(item, EVENTS.USER_PLAN_APPROVED, {}, T0);
    item = transition(item, EVENTS.DESIGN_SCOPE_DEFINED, {
      writeScopes: ['tests/**'],
      readinessChecks: ['test'],
      reviewChecks: ['test'],
      requiredSpecialists: [],
    }, T0);
    item = transition(item, EVENTS.DESIGN_PRESENTED, gateEvidence('design', 'PASS', 'design-document'), T0);
    item = transition(item, EVENTS.USER_DESIGN_APPROVED, {}, T0);

    const check = runCheck('test', {
      required: true,
      executor: () => ({ status: 0, stdout: '4 tests passed', stderr: '' }),
    });
    const gate = evaluateGate('readiness', ['test'], [check], T0);
    assert.equal(gate.verdict, 'READY');
    assert.deepEqual(item.requiredSpecialists, []);
    assert.ok(!item.requiredSpecialists.includes('test-engineer'));

    item = transition(item, EVENTS.READINESS_READY, { gateResult: gate }, T0);
    assert.equal(item.phase, 'review');
  });

  it('still reserves a separate read-only independent QA decision for Review', () => {
    const check = runCheck('test', {
      required: true,
      executor: () => ({ status: 0, stdout: 'ok', stderr: '' }),
    });
    assert.equal(check.verdict, 'pass');
    assert.notEqual(check.check, 'independent-qa');
  });
});
