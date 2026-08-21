'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const Ajv = require('ajv');
const { validatePayload } = require('../lib/observability/schema');
const {
  evaluateClassificationCorpus,
  evaluateCriticalRiskCorpus,
} = require('../lib/evaluation/classifier-evaluation');
const { loadEvaluationCorpora } = require('../lib/evaluation/corpus');
const {
  classifyRequest,
  createRequestDigest,
  detectSensitiveFields,
  buildStructuralSummary,
} = require('../lib/workflow/profile-classifier');
const {
  compilePhaseGraph,
  selectProfile,
} = require('../lib/workflow/workflow-compiler');
const {
  DIGEST_KEY_FILE,
  isShadowEnabled,
  loadOrCreateDigestKey,
  runShadowAnalysis,
} = require('../lib/workflow/shadow-runner');

const ROOT = path.resolve(__dirname, '..');
const SHADOW_HOOK = path.join(ROOT, 'hooks', 'workflow-shadow.js');
const CHECKPOINT_HOOK = path.join(ROOT, 'hooks', 'checkpoint-keyword.js');
const ORIGINAL_HELD_OUT_IDS = [
  'f-13', 'f-14', 'f-15',
  'i-13', 'i-14', 'i-15', 'i-16',
  'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18',
];
const ORIGINAL_HELD_OUT_HASH = '10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function writeShadowConfig(projectDir, mode = 'shadow', eventLog = '.vais/event-log.jsonl') {
  fs.writeFileSync(path.join(projectDir, 'vais.config.json'), JSON.stringify({
    engine: 'legacy',
    profile: { mode },
    observability: { eventLog },
  }));
}

function runHook(script, projectDir, input) {
  return spawnSync(process.execPath, [script], {
    cwd: projectDir,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
  });
}

test('original held-out anchor remains unchanged after classifier implementation', () => {
  const { classification } = loadEvaluationCorpora(ROOT);
  const ids = [...classification.splitPolicy.anchorHeldOutIds].sort();
  const allHeldOutIds = classification.cases
    .filter(item => item.split === 'held-out')
    .map(item => item.id);

  assert.deepEqual(ids, ORIGINAL_HELD_OUT_IDS);
  assert.ok(ids.every(id => allHeldOutIds.includes(id)));
  assert.equal(
    crypto.createHash('sha256').update(ids.join('\n')).digest('hex'),
    ORIGINAL_HELD_OUT_HASH,
  );
  assert.equal(classification.splitPolicy.anchorHeldOutIdsHash, ORIGINAL_HELD_OUT_HASH);
});

test('expanded held-out classifier meets profile, assurance, and phase graph gates', () => {
  const corpora = loadEvaluationCorpora(ROOT);
  const result = evaluateClassificationCorpus(corpora.classification);

  assert.equal(result.total, 50);
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

test('sensitive-field detection reports secret kinds without producing text', () => {
  const raw = 'Add login for owner@example.com with token=super-secret-value-12345';
  const detected = detectSensitiveFields(raw);

  assert.equal(detected.applied, true);
  assert.ok(detected.fields.includes('credential-assignment'));
  assert.ok(detected.fields.includes('email'));
  assert.equal('summary' in detected, false);
});

test('payment-card detection requires Luhn validity, ignoring timestamps', () => {
  const timestamp = detectSensitiveFields('Retry the job stuck since 1755771019228 please');
  assert.ok(!timestamp.fields.includes('payment-card'));

  const card = detectSensitiveFields('Charge card 4111 1111 1111 1111 for the order');
  assert.ok(card.fields.includes('payment-card'));
});

test('structural summary never contains or truncates verbatim prompt text', () => {
  const raw = 'Fix the wobbly button alignment tweak in the sidebar dropdown';
  const classification = classifyRequest(raw);
  const summary = buildStructuralSummary(classification, raw);

  assert.ok(summary.startsWith('[structural]'));
  assert.notEqual(summary, raw);
  assert.ok(!raw.includes(summary));
  for (const word of ['wobbly', 'button', 'alignment', 'tweak', 'sidebar', 'dropdown']) {
    assert.ok(!summary.includes(word), `summary leaked raw token: ${word}`);
  }
  assert.ok(summary.length <= 240);
});

test('request digest is keyed: never equal to unsalted sha256 and key-dependent', () => {
  const raw = 'short prompt';
  const unsalted = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  const digestA = createRequestDigest(raw, 'key-a');
  const digestB = createRequestDigest(raw, 'key-b');

  assert.match(digestA, /^[a-f0-9]{64}$/);
  assert.notEqual(digestA, unsalted);
  assert.notEqual(digestA, digestB);
  assert.equal(digestA, createRequestDigest(raw, 'key-a'));
  assert.throws(() => createRequestDigest(raw, ''));
});

test('digest key persists per project and is excluded from the event log', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-key-'));
  try {
    const first = loadOrCreateDigestKey(tempDir);
    const second = loadOrCreateDigestKey(tempDir);
    assert.deepEqual(first, second);
    assert.ok(fs.existsSync(path.join(tempDir, DIGEST_KEY_FILE)));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
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
      baseDir: tempDir,
    });
    const persisted = fs.readFileSync(eventLog, 'utf8');

    assert.equal(result.legacy.executionChanged, false);
    assert.equal(result.request.rawPersisted, false);
    assert.equal(result.runId, 'shadow-test-run-1');
    assert.ok(!persisted.includes(raw));
    assert.ok(!persisted.includes('owner@example.com'));
    assert.ok(!persisted.includes('super-secret-value-12345'));
    assert.ok(!persisted.includes(crypto.createHash('sha256').update(raw, 'utf8').digest('hex')));
    assert.match(result.request.hash, /^[a-f0-9]{64}$/);

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
    digestKey: 'unit-test-key',
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

test('runtime root-level shadow config remains supported', () => {
  assert.equal(isShadowEnabled({ engine: 'legacy', profile: { mode: 'shadow' } }), true);
  assert.equal(isShadowEnabled({ engine: 'legacy', profile: { mode: 'off' } }), false);
});

test('UserPromptSubmit shadow hook logs a redacted event and produces no output', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-hook-'));
  const eventLog = path.join(tempDir, '.vais', 'event-log.jsonl');
  const raw = 'Add OAuth login for owner@example.com with token=super-secret-value-12345';

  try {
    writeShadowConfig(tempDir);
    fs.mkdirSync(path.join(tempDir, '.vais'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.vais', 'status.json'), JSON.stringify({
      version: 2,
      activeFeature: 'login-feature',
      features: {},
    }));

    const result = runHook(SHADOW_HOOK, tempDir, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 'session-hook-1',
      cwd: tempDir,
      prompt: raw,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const persisted = fs.readFileSync(eventLog, 'utf8');
    assert.ok(!persisted.includes(raw));
    assert.ok(!persisted.includes('owner@example.com'));
    assert.ok(!persisted.includes('super-secret-value-12345'));

    const events = persisted.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(events.length, 1);
    assert.equal(events[0].event, 'classification.completed');
    assert.equal(events[0].feature, 'login-feature');
    assert.equal(events[0].host, 'claude-code');
    assert.equal(events[0].sessionId, 'session-hook-1');
    assert.match(events[0].requestHash, /^[a-f0-9]{64}$/);
    assert.notEqual(events[0].requestHash, crypto.createHash('sha256').update(raw).digest('hex'));
    assert.equal(events[0].redactionApplied, true);
    assert.ok(events[0].requestSummary.startsWith('[structural]'));
    assert.equal(events[0].legacyExecutionChanged, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('UserPromptSubmit shadow hook is silent when disabled', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-disabled-'));
  try {
    writeShadowConfig(tempDir, 'off');
    const result = runHook(SHADOW_HOOK, tempDir, {
      session_id: 'session-disabled',
      prompt: 'Add a profile selector',
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
    assert.equal(fs.existsSync(path.join(tempDir, '.vais', 'event-log.jsonl')), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('UserPromptSubmit shadow hook fails open for malformed input and event log errors', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-fail-open-'));
  try {
    writeShadowConfig(tempDir);
    const malformed = runHook(SHADOW_HOOK, tempDir, '{not-json');
    assert.equal(malformed.status, 0);
    assert.equal(malformed.stdout, '');
    assert.equal(malformed.stderr, '');

    const logTarget = path.join(tempDir, '.vais', 'event-log-target');
    fs.mkdirSync(logTarget, { recursive: true });
    writeShadowConfig(tempDir, 'shadow', logTarget);
    const logFailure = runHook(SHADOW_HOOK, tempDir, { prompt: 'Fix the retry guard' });
    assert.equal(logFailure.status, 0);
    assert.equal(logFailure.stdout, '');
    assert.equal(logFailure.stderr, '');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('hook manifest keeps checkpoint output behavior and adds shadow as a separate command', () => {
  const manifest = readJson('hooks/hooks.json');
  const commands = manifest.hooks.UserPromptSubmit.flatMap(entry => entry.hooks.map(hook => hook.command));

  assert.ok(commands.some(command => command.endsWith('/hooks/checkpoint-keyword.js')));
  assert.ok(commands.some(command => command.endsWith('/hooks/workflow-shadow.js')));

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-checkpoint-hook-'));
  try {
    const checkpointResult = runHook(CHECKPOINT_HOOK, tempDir, { prompt: 'ordinary request' });
    assert.equal(checkpointResult.status, 0);
    assert.equal(checkpointResult.stdout, '{}\n');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('secret-free short prompt is never persisted verbatim or as unsalted sha256', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-plain-'));
  const eventLog = path.join(tempDir, '.vais', 'event-log.jsonl');
  const raw = 'Fix the wobbly button alignment tweak in the sidebar dropdown';

  try {
    writeShadowConfig(tempDir);
    const result = runHook(SHADOW_HOOK, tempDir, {
      hook_event_name: 'UserPromptSubmit',
      cwd: tempDir,
      prompt: raw,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const persisted = fs.readFileSync(eventLog, 'utf8');
    assert.ok(!persisted.includes(raw));
    for (const word of ['wobbly', 'button', 'alignment', 'tweak', 'sidebar', 'dropdown']) {
      assert.ok(!persisted.includes(word), `event log leaked raw token: ${word}`);
    }
    assert.ok(!persisted.includes(crypto.createHash('sha256').update(raw, 'utf8').digest('hex')));

    const [event] = persisted.trim().split('\n').map(line => JSON.parse(line));
    assert.ok(event.requestSummary.startsWith('[structural]'));
    assert.equal(event.redactionApplied, false);
    assert.ok(!fs.readFileSync(path.join(tempDir, DIGEST_KEY_FILE), 'utf8').includes(event.requestHash));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('shadow stays disabled without an explicit project vais.config.json', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-optin-'));
  try {
    fs.mkdirSync(path.join(tempDir, '.vais'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.vais', 'status.json'), JSON.stringify({
      version: 3,
      activeFeature: 'some-feature',
      features: {},
    }));

    const result = runHook(SHADOW_HOOK, tempDir, { cwd: tempDir, prompt: 'Add a profile selector' });
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
    assert.equal(fs.existsSync(path.join(tempDir, '.vais', 'event-log.jsonl')), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('hook output stays empty even when EventLogger rejects an invalid payload', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-invalid-'));
  try {
    const script = [
      `const hook = require(${JSON.stringify(SHADOW_HOOK)});`,
      'hook.silenceHookOutput();',
      `const { EventLogger } = require(${JSON.stringify(path.join(ROOT, 'lib', 'observability', 'event-logger.js'))});`,
      `const logger = new EventLogger(${JSON.stringify(path.join(tempDir, 'event-log.jsonl'))});`,
      "logger.log('classification.completed', { runId: 'invalid-only' });",
      "console.error('must-not-escape');",
    ].join('\n');
    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('nested cwd resolves the project root for config, event log, and feature', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-nested-'));
  const nested = path.join(tempDir, 'packages', 'web', 'src');
  try {
    writeShadowConfig(tempDir);
    fs.mkdirSync(nested, { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.vais'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.vais', 'status.json'), JSON.stringify({
      version: 3,
      activeFeature: 'root-feature',
      features: {},
    }));

    const result = runHook(SHADOW_HOOK, nested, {
      cwd: nested,
      prompt: 'Fix the missing retry guard',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
    assert.equal(fs.existsSync(path.join(nested, '.vais')), false);

    const persisted = fs.readFileSync(path.join(tempDir, '.vais', 'event-log.jsonl'), 'utf8');
    const [event] = persisted.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(event.feature, 'root-feature');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('observability rotation config is honored relative to the project root', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-shadow-rotate-'));
  const eventLog = path.join(tempDir, '.vais', 'event-log.jsonl');
  const archiveDir = path.join(tempDir, '.vais', 'archive');
  try {
    fs.mkdirSync(path.join(tempDir, '.vais'), { recursive: true });
    fs.writeFileSync(eventLog, 'x'.repeat(4096));

    const result = runShadowAnalysis({
      rawText: 'Fix the missing retry guard',
      feature: 'retry-guard',
      config: {
        workflow: { engine: 'legacy', profile: { mode: 'shadow' } },
        observability: {
          eventLog: '.vais/event-log.jsonl',
          maxEventLogSizeMB: 0.000001,
          rotateAfterDays: 30,
          archivePath: '.vais/archive/',
        },
      },
      baseDir: tempDir,
      digestKey: 'rotation-test-key',
    });

    assert.equal(result.skipped, undefined);
    const archived = fs.readdirSync(archiveDir);
    assert.equal(archived.length, 1);
    const events = fs.readFileSync(eventLog, 'utf8').trim().split('\n');
    assert.equal(events.length, 1);
    assert.equal(JSON.parse(events[0]).event, 'classification.completed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('classification event rejects incomplete payloads', () => {
  const result = validatePayload('classification.completed', { runId: 'shadow-incomplete' });

  assert.equal(result.valid, false);
  assert.match(result.error, /Missing required fields/);
});

