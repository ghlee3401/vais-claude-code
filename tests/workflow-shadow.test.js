'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const Ajv = require('ajv');
const { validatePayload } = require('../lib/observability/schema');
const {
  evaluateClassificationCorpus,
  evaluateCriticalRiskCorpus,
} = require('../lib/evaluation/classifier-evaluation');
const { loadEvaluationCorpora } = require('../lib/evaluation/corpus');
const {
  classifyRequest,
  redactRequestSummary,
} = require('../lib/workflow/profile-classifier');
const {
  compilePhaseGraph,
  selectProfile,
} = require('../lib/workflow/workflow-compiler');
const {
  isShadowEnabled,
  runShadowAnalysis,
} = require('../lib/workflow/shadow-runner');

const ROOT = path.resolve(__dirname, '..');
const ORIGINAL_HELD_OUT_IDS = [
  'f-13', 'f-14', 'f-15',
  'i-13', 'i-14', 'i-15', 'i-16',
  'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18',
];
const ORIGINAL_HELD_OUT_HASH = '10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

test('original held-out anchor remains unchanged after classifier implementation', () => {
  const { classification } = loadEvaluationCorpora(ROOT);
  const ids = classification.cases
    .filter(item => item.split === 'held-out')
    .map(item => item.id)
    .sort();

  assert.deepEqual(ids, ORIGINAL_HELD_OUT_IDS);
  assert.equal(
    crypto.createHash('sha256').update(ids.join('\n')).digest('hex'),
    ORIGINAL_HELD_OUT_HASH,
  );
  assert.equal(classification.splitPolicy.heldOutIdsHash, ORIGINAL_HELD_OUT_HASH);
});

test('held-out classifier meets profile, assurance, and phase graph gates', () => {
  const corpora = loadEvaluationCorpora(ROOT);
  const result = evaluateClassificationCorpus(corpora.classification);

  assert.equal(result.total, 13);
  assert.ok(result.macroF1.value >= 0.85, `macro F1 was ${result.macroF1.value}`);
  assert.deepEqual(result.unsafeAssuranceMisses, []);
  assert.deepEqual(result.phaseGraphMisses, []);
});

test('critical-risk corpus has no unsafe assurance or trigger misses', () => {
  const corpora = loadEvaluationCorpora(ROOT);
  const result = evaluateCriticalRiskCorpus(corpora.criticalRisk);

  assert.equal(result.total, 26);
  assert.deepEqual(result.unsafeAssuranceMisses, []);
  assert.deepEqual(result.triggerMisses, []);
});

test('profile recommendation stays independent from assurance', () => {
  const result = classifyRequest('Add OAuth login endpoint to the existing account service');

  assert.equal(result.profile.selected, 'feature');
  assert.equal(result.assurance.level, 'high');
  assert.ok(result.assurance.triggers.includes('auth'));
  assert.deepEqual(result.phaseGraph.required, ['plan', 'design', 'do', 'qa']);
});

test('unknown work is conservatively promoted to initiative', () => {
  const result = classifyRequest('전반적으로 정리해줘');

  assert.equal(result.profile.recommended, 'unknown');
  assert.equal(result.profile.selected, 'initiative');
  assert.ok(result.profile.reasons.includes('unknown-conservative-promotion'));
  assert.deepEqual(result.phaseGraph.required, ['ideation', 'plan', 'design', 'do', 'qa', 'report']);
});

test('compiler promotes contract changes and omits irrelevant phases', () => {
  assert.deepEqual(selectProfile('patch', { publicContract: true }), {
    recommended: 'patch',
    selected: 'feature',
    promoted: true,
    reason: 'feature-contract-signal',
  });
  assert.deepEqual(compilePhaseGraph('patch'), {
    required: ['plan', 'do', 'qa'],
    optional: [],
    notRequired: ['ideation', 'design', 'report'],
  });
});

test('reference-only examples do not raise production security assurance', () => {
  const result = classifyRequest('Rename the payment label in the README example only');

  assert.equal(result.profile.selected, 'patch');
  assert.equal(result.assurance.level, 'normal');
  assert.deepEqual(result.assurance.triggers, []);
});

test('redaction removes credentials and direct identifiers from persisted summary', () => {
  const raw = 'Add login for owner@example.com with token=super-secret-value-12345';
  const redacted = redactRequestSummary(raw);

  assert.equal(redacted.applied, true);
  assert.ok(redacted.fields.includes('credential-assignment'));
  assert.ok(redacted.fields.includes('email'));
  assert.ok(!redacted.summary.includes('owner@example.com'));
  assert.ok(!redacted.summary.includes('super-secret-value-12345'));
});

test('shadow runner logs one redacted result without changing legacy execution', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-'));
  const eventLog = path.join(tempDir, 'event-log.jsonl');
  const raw = 'Add OAuth login for owner@example.com with token=super-secret-value-12345';
  const config = {
    workflow: { engine: 'legacy', profile: { mode: 'shadow' } },
    observability: { eventLog },
  };

  try {
    const result = runShadowAnalysis({
      rawText: raw,
      feature: 'login',
      host: 'claude-code',
      sessionId: 'session-1',
      runId: 'shadow-test-run-1',
      config,
    });
    const persisted = fs.readFileSync(eventLog, 'utf8');

    assert.equal(result.legacy.executionChanged, false);
    assert.equal(result.request.rawPersisted, false);
    assert.equal(result.runId, 'shadow-test-run-1');
    assert.ok(!persisted.includes(raw));
    assert.ok(!persisted.includes('owner@example.com'));
    assert.ok(!persisted.includes('super-secret-value-12345'));

    const events = persisted.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(events.length, 1);
    assert.equal(events[0].event, 'classification.completed');
    assert.equal(events[0].requestHash, result.request.hash);
    assert.equal(events[0].legacyExecutionChanged, false);

    const { ts, event, ...payload } = events[0];
    assert.ok(ts);
    assert.equal(validatePayload(event, payload).valid, true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('shadow result conforms to schema and rejects an empty required phase list', () => {
  const schema = readJson('schemas/workflow-shadow-result.schema.json');
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
  const result = runShadowAnalysis({
    rawText: 'Fix the missing retry guard',
    feature: 'retry-guard',
    host: 'codex',
    sessionId: null,
    runId: 'shadow-schema-run-1',
    config: { workflow: { engine: 'legacy', profile: { mode: 'shadow' } } },
    eventLogger: { log() {} },
  });

  assert.equal(validate(result), true, JSON.stringify(validate.errors));
  result.phaseGraph.required = [];
  assert.equal(validate(result), false);
});

test('disabled shadow mode performs no classification or logging', () => {
  let calls = 0;
  const result = runShadowAnalysis({
    rawText: 'Add a profile selector',
    config: { workflow: { engine: 'legacy', profile: { mode: 'off' } } },
    eventLogger: { log() { calls += 1; } },
  });

  assert.equal(isShadowEnabled({ workflow: { engine: 'legacy', profile: { mode: 'off' } } }), false);
  assert.deepEqual(result, { skipped: true, reason: 'shadow-disabled' });
  assert.equal(calls, 0);
});

test('classification event rejects incomplete payloads', () => {
  const result = validatePayload('classification.completed', { runId: 'shadow-incomplete' });

  assert.equal(result.valid, false);
  assert.match(result.error, /Missing required fields/);
});

