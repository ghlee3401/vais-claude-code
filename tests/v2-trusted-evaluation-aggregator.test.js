'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { describe, it } = require('node:test');
const { evaluateLiveEvidence } = require('../lib/evaluation/v2-shadow');
const { duplicateChecks, recursiveManifest, canonical, EXECUTION_ORDER } = require('../scripts/evaluation/trusted-shadow-bundle');
const { loadWorkload, buildAdapterProof } = require('../scripts/evaluation/formal-workload');

const ROOT = path.join(__dirname, '..');
const WORKLOAD = path.join(ROOT, 'tests', 'fixtures', 'formal-booking-cancellation-workload.json');
const WORKLOAD_INFO = loadWorkload(WORKLOAD);
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'mini-booking');
const TOOL_PROFILE = Object.freeze({
  permissionMode: 'bypassPermissions', strictMcpConfig: true,
  allowedTools: ['Agent', 'Bash', 'Edit', 'Read', 'Write'], disallowedTools: [],
});

function write(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function makeRun(root, engine, repetition, model, trust) {
  const directory = path.join(root, `${engine}-${repetition}`);
  const isV2 = engine === 'v2';
  const total = isV2 ? 600 : 1000;
  const outer = isV2 ? 500 : 1000;
  write(path.join(directory, 'provider', 'turn-3.raw.json'), {
    duration_ms: 100, total_cost_usd: isV2 ? 0.03 : 0.04,
    usage: { cache_creation_input_tokens: outer, cache_read_input_tokens: 20, output_tokens: 10 },
    modelUsage: { [model]: {
      cacheCreationInputTokens: total, cacheReadInputTokens: isV2 ? 40 : 20,
      outputTokens: isV2 ? 20 : 10,
    } },
  });
  const assignments = isV2 ? [
    { role: 'independent-qa', assignmentId: `qa-${repetition}`, required: true,
      handoffStatus: 'completed', handoffId: `qa-handoff-${repetition}` },
  ] : [];
  const adapterProof = buildAdapterProof(engine, WORKLOAD_INFO,
    isV2 ? { planRevision: 1, designRevision: 1 } : {});
  write(path.join(directory, 'quality-observer.json'), {
    schema: 'vais-formal-quality-observer/v1', verdict: 'pass', fixture: 'mini-booking',
    requiredScenarioIds: ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset'],
    observedScenarioIds: ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset'],
    scenarios: ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset']
      .map(id => ({ id, viewport: '1280x900', verdict: 'pass', screenshot: `${id}.png` })),
  });
  const source = {
    schema: `${engine}-journey-evidence/v1`, engine, repetition,
    scenario: 'booking-cancellation-full-journey', scale: 'compact',
    stageRootDigest: trust.stageRoots[engine], toolProfile: trust.toolProfile,
    sequenceIndex: EXECUTION_ORDER.indexOf(`${engine}:${repetition}`) + 1,
    model, effort: 'low', budgetPolicy: trust.budgetPolicy || 'provider-list-cost-cap',
    turnTimeoutMs: trust.turnTimeoutMs || 900000,
    ...((trust.budgetPolicy || 'provider-list-cost-cap') === 'provider-list-cost-cap'
      ? { journeyBudget: 4 } : {}),
    adapterProof,
    qualityObserver: 'quality-observer.json',
    captures: ['provider/turn-3.raw.json'],
    ...(isV2 ? { assuranceCapture: 'provider/turn-3.raw.json' } : {}),
    terminal: { terminalStatus: 'completed', quality: 'pass', reportFrozen: isV2 },
    assignments,
    checks: [{ adapter: 'node-test', normalizedCommand: 'node --test focused',
      designRevision: '3', repoSnapshotDigest: `snapshot-${engine}-${repetition}` }],
    contractAttempts: [],
    userTurns: adapterProof.prompts.map(prompt => ({ kind: prompt.kind })),
  };
  write(path.join(directory, isV2 ? 'v2-runtime.json' : 'legacy-adapter.json'), source);
  const phaseNames = ['01-plan', '02-design', '03-do', '04-review', '05-report'];
    phaseNames.forEach((phase, index) => write(path.join(directory, 'workspace', 'docs', phase, 'main.md'),
      (isV2 ? 'V' : 'L').repeat((isV2 ? 100 : 200) + index)));
  write(path.join(directory, 'workspace', 'docs', '02-design', 'revisions', 'v1.md'), 'approved history');
  write(path.join(directory, 'workspace', 'docs', '01-plan', 'evidence', 'main.md'), 'derived evidence');
  if (!isV2) write(path.join(directory, 'workspace', 'docs', '03-do', 'implementation.md'), 'L'.repeat(200));
  write(path.join(directory, 'workspace', 'docs', 'main.md'), `${engine} index`);
}

describe('trusted live shadow evidence aggregator', () => {
  it('allows one reason-bound supplemental check but counts the second as duplicate', () => {
    const primary = { adapter: 'node-test', normalizedCommand: 'node --test',
      designRevision: '3', repoSnapshotDigest: 'snapshot' };
    const supplemental = { ...primary, supplemental: true, supplementalReason: 'Review repair verification' };
    assert.equal(duplicateChecks([primary, supplemental]), 0);
    assert.equal(duplicateChecks([primary, supplemental, { ...supplemental }]), 1);
    assert.throws(() => duplicateChecks([primary, { ...supplemental, supplementalReason: '' }]),
      /missing its reason/);
  });

  it('assembles and evaluates one immutable dry-run cohort with exact 3x2 runs', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    const output = path.join(temp, 'output');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    const toolProfile = TOOL_PROFILE;
    write(path.join(temp, 'tool-profile.json'), toolProfile);
    const trust = { stageRoots: { legacy: recursiveManifest(legacyStage).digest,
      v2: recursiveManifest(v2Stage).digest }, toolProfile: canonical(toolProfile),
    budgetPolicy: 'subscription-no-dollar-cap', turnTimeoutMs: 900000 };
    for (const engine of ['legacy', 'v2']) {
      for (let repetition = 1; repetition <= 3; repetition += 1) {
        makeRun(runs, engine, repetition, 'claude-opus', trust);
      }
    }
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tool-profile.json'), '--runs-root', runs,
      '--output', output, '--model', 'claude-opus', '--effort', 'low',
      '--turn-timeout-ms', '900000'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout || result.stderr);
    assert.equal(JSON.parse(result.stdout).verdict, 'pass');
    const evidence = JSON.parse(fs.readFileSync(path.join(output, 'live-shadow-evidence.json'), 'utf8'));
    assert.equal(evidence.runs.length, 6);
    assert.equal(evidence.schemaVersion, '2.2');
    assert.equal(evidence.cohort.budgetPolicy, 'subscription-no-dollar-cap');
    assert.equal(evidence.cohort.journeyBudget, undefined);
    assert.equal(evidence.cohort.stage.digest.length, 64);
    assert.equal(evidence.runs.filter(run => run.engine === 'v2')
      .every(run => run.authoredDocumentCount === 5), true);
    assert.equal(evidence.runs.filter(run => run.engine === 'legacy')
      .every(run => run.authoredDocumentCount === 6), true);
    assert.equal(evaluateLiveEvidence(evidence, { evidenceRoot: output }).pass, true);

    const changed = JSON.parse(fs.readFileSync(path.join(runs, 'v2-1', 'v2-runtime.json'), 'utf8'));
    changed.stageRootDigest = '0'.repeat(64);
    write(path.join(runs, 'v2-1', 'v2-runtime.json'), changed);
    const mismatch = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tool-profile.json'), '--runs-root', runs,
      '--output', path.join(temp, 'mismatch-output'), '--model', 'claude-opus',
      '--turn-timeout-ms', '900000'], { encoding: 'utf8' });
    assert.equal(mismatch.status, 2);
    assert.equal(JSON.parse(mismatch.stdout).code, 'RUN_STAGE_MISMATCH');
  });

  it('separates transcript-attributed delivery specialist and QA usage in one provider capture', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-agent-split-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    const toolProfile = TOOL_PROFILE;
    write(path.join(temp, 'tools.json'), toolProfile);
    const trust = { stageRoots: { legacy: recursiveManifest(legacyStage).digest,
      v2: recursiveManifest(v2Stage).digest }, toolProfile: canonical(toolProfile) };
    for (const engine of ['legacy', 'v2']) {
      for (let repetition = 1; repetition <= 3; repetition += 1) {
        makeRun(runs, engine, repetition, 'opus', trust);
      }
    }
    const adapterPath = path.join(runs, 'v2-1', 'v2-runtime.json');
    const adapter = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
    adapter.assignments.unshift({ role: 'backend-engineer', assignmentId: 'backend-1', required: true,
      handoffStatus: 'completed', handoffId: 'backend-handoff-1' });
    write(adapterPath, adapter);
    const capturePath = path.join(runs, 'v2-1', 'provider', 'turn-3.raw.json');
    const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
    capture.subagent_stats = { spawned: 2, completed: 2, failed: 0 };
    capture.evaluationMetadata = { agentSegments: [
      { agentId: 'agent-backend', assignmentId: 'backend-1', role: 'backend-engineer',
        status: 'completed', model: 'opus',
        usage: { totalCacheCreationTokens: 60, totalCacheReadTokens: 10, outputTokens: 5 } },
      { agentId: 'agent-qa', assignmentId: 'qa-1', role: 'independent-qa',
        status: 'completed', model: 'opus',
        usage: { totalCacheCreationTokens: 40, totalCacheReadTokens: 10, outputTokens: 5 } },
    ] };
    write(capturePath, capture);
    const output = path.join(temp, 'output');
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tools.json'), '--runs-root', runs,
      '--output', output, '--model', 'opus', '--max-budget', '4'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout || result.stderr);
    const evidence = JSON.parse(fs.readFileSync(path.join(output, 'live-shadow-evidence.json'), 'utf8'));
    const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 1);
    assert.equal(run.deliveryCacheCreationTokens, 560);
    assert.equal(run.assuranceCacheCreationTokens, 40);

    capture.evaluationMetadata.agentSegments[0].usage.totalCacheCreationTokens += 1;
    write(capturePath, capture);
    const tampered = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tools.json'), '--runs-root', runs,
      '--output', path.join(temp, 'tampered-output'), '--model', 'opus', '--max-budget', '4'], { encoding: 'utf8' });
    assert.notEqual(tampered.status, 0);
    assert.match(JSON.parse(tampered.stdout).reason, /does not reconcile/);
  });

  it('rejects a provider capture reached through an escaping parent symlink', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-symlink-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    const toolProfile = TOOL_PROFILE;
    write(path.join(temp, 'tools.json'), toolProfile);
    const trust = { stageRoots: { legacy: recursiveManifest(legacyStage).digest,
      v2: recursiveManifest(v2Stage).digest }, toolProfile: canonical(toolProfile) };
    for (const engine of ['legacy', 'v2']) {
      for (let repetition = 1; repetition <= 3; repetition += 1) {
        makeRun(runs, engine, repetition, 'opus', trust);
      }
    }
    const outside = path.join(temp, 'outside-provider');
    fs.renameSync(path.join(runs, 'v2-1', 'provider'), outside);
    fs.symlinkSync(outside, path.join(runs, 'v2-1', 'provider'), 'dir');
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tools.json'), '--runs-root', runs,
      '--output', path.join(temp, 'output'), '--model', 'opus', '--max-budget', '4'], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).code, 'CAPTURE_UNTRUSTED');
  });

  it('blocks incomplete canonical documents and unavailable raw captures', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-incomplete-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    const toolProfile = TOOL_PROFILE;
    write(path.join(temp, 'tools.json'), toolProfile);
    const trust = { stageRoots: { legacy: recursiveManifest(legacyStage).digest,
      v2: recursiveManifest(v2Stage).digest }, toolProfile: canonical(toolProfile) };
    for (const engine of ['legacy', 'v2']) {
      for (let repetition = 1; repetition <= 3; repetition += 1) {
        makeRun(runs, engine, repetition, 'opus', trust);
      }
    }
    fs.renameSync(path.join(runs, 'v2-1', 'workspace', 'docs', '02-design', 'main.md'),
      path.join(runs, 'v2-1', 'workspace', 'docs', '02-design', 'missing.md'));
    const args = [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tools.json'), '--runs-root', runs,
      '--model', 'opus', '--max-budget', '4'];
    let result = spawnSync(process.execPath, [...args, '--output', path.join(temp, 'docs-output')], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).code, 'CANONICAL_DOCUMENTS_INCOMPLETE');

    fs.renameSync(path.join(runs, 'v2-1', 'workspace', 'docs', '02-design', 'missing.md'),
      path.join(runs, 'v2-1', 'workspace', 'docs', '02-design', 'main.md'));
    const adapterPath = path.join(runs, 'v2-1', 'v2-runtime.json');
    const adapter = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
    adapter.captures = [];
    write(adapterPath, adapter);
    result = spawnSync(process.execPath, [...args, '--output', path.join(temp, 'raw-output')], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).code, 'RAW_TELEMETRY_UNAVAILABLE');
  });

  it('rejects five phase mains distributed across different Work item roots', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-doc-roots-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    write(path.join(temp, 'tools.json'), TOOL_PROFILE);
    const trust = { stageRoots: { legacy: recursiveManifest(legacyStage).digest,
      v2: recursiveManifest(v2Stage).digest }, toolProfile: canonical(TOOL_PROFILE) };
    for (const engine of ['legacy', 'v2']) {
      for (let repetition = 1; repetition <= 3; repetition += 1) {
        makeRun(runs, engine, repetition, 'opus', trust);
      }
    }
    const docs = path.join(runs, 'v2-1', 'workspace', 'docs');
    for (const [index, phase] of ['01-plan', '02-design', '03-do', '04-review', '05-report'].entries()) {
      const source = path.join(docs, phase, 'main.md');
      const target = path.join(docs, `different-work-${index}`, phase, 'main.md');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.renameSync(source, target);
    }
    const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/evaluation/trusted-shadow-bundle.js'),
      '--legacy-stage', legacyStage, '--v2-stage', v2Stage, '--fixture', fixture, '--workload', WORKLOAD,
      '--tool-profile', path.join(temp, 'tools.json'), '--runs-root', runs,
      '--output', path.join(temp, 'output'), '--model', 'opus', '--max-budget', '4'], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).code, 'CANONICAL_DOCUMENTS_INCOMPLETE');
  });

  it('returns BLOCKED with an explicit Legacy adapter contract reason', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-trusted-shadow-blocked-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const { main } = require('../scripts/evaluation/trusted-shadow-bundle');
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const fixture = FIXTURE;
    const runs = path.join(temp, 'runs');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    write(path.join(temp, 'tools.json'), TOOL_PROFILE);
    fs.mkdirSync(path.join(runs, 'legacy-1'), { recursive: true });
    const original = process.stdout.write;
    let output = '';
    process.stdout.write = value => { output += value; return true; };
    try {
      assert.equal(main(['--legacy-stage', legacyStage, '--v2-stage', v2Stage,
        '--fixture', fixture, '--workload', WORKLOAD, '--tool-profile', path.join(temp, 'tools.json'),
        '--runs-root', runs, '--output', path.join(temp, 'out'), '--model', 'opus', '--max-budget', '4']), 2);
    } finally {
      process.stdout.write = original;
    }
    assert.equal(JSON.parse(output).verdict, 'blocked');
    assert.equal(JSON.parse(output).code, 'LEGACY_ADAPTER_UNAVAILABLE');
  });
});
