'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { createInitialWorkItem, evaluateGate } = require('../lib/workflow/v2');

const ROOT = path.join(__dirname, '..');
const load = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const ajv = new Ajv({ allErrors: true, jsonPointers: true });

function expectValid(schemaPath, value) {
  const validate = ajv.compile(load(schemaPath));
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
}

describe('v2 workflow contracts', () => {
  it('validates the canonical Work item state', () => {
    const item = createInitialWorkItem({
      id: 'WI-2026-09-01-password-reset',
      title: 'Password reset',
      primaryFeature: 'authentication/password-reset',
      affectedFeatures: ['authentication'],
      scale: 'standard',
    }, '2026-09-01T00:00:00.000Z');
    expectValid('schemas/work-item.schema.json', item);
  });

  it('validates check and binary gate results', () => {
    const check = {
      check: 'build',
      execution: 'succeeded',
      verdict: 'pass',
      required: true,
      scope: ['package.json'],
      requirements: ['REQ-020'],
      summary: 'Build passed',
      findings: [],
      evidence: ['04-review/evidence/logs/build.txt'],
    };
    expectValid('schemas/check-result.schema.json', check);
    const gate = evaluateGate('readiness', ['build'], [check], '2026-09-01T00:00:00.000Z');
    expectValid('schemas/gate-result.schema.json', gate);
  });

  it('validates the structured specialist handoff', () => {
    expectValid('schemas/specialist-handoff.schema.json', {
      schema: 'specialist-handoff/v1',
      status: 'completed',
      judgment: 'The write boundary is enforceable through phase authorization and a post-diff check.',
      decisions: ['Require a valid mutation lease'],
      behavior: { inputs: ['phase'], outputs: ['decision'], errors: ['lease missing'] },
      evidence: ['tests/v2-workflow-kernel.test.js'],
      affectedRequirements: ['REQ-018', 'REQ-029'],
      risks: ['Shell commands can contain indirect writes'],
      unverified: [],
      recommendedChecks: ['path-safety-test'],
    });
  });
});
