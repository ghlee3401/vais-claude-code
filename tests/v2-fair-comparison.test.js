'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { spawnSync } = require('node:child_process');
const { buildLegacyStage } = require('../scripts/build-legacy-plugin-stage');
const {
  execute, runArguments, sealStageTrees, restoreStageModes,
} = require('../scripts/evaluation/live-paired-cohort');
const { loadWorkload, buildAdapterProof, verifyAdapterProof, renderStep } =
  require('../scripts/evaluation/formal-workload');
const { EXECUTION_ORDER } = require('../scripts/evaluation/trusted-shadow-bundle');
const { legacyTerminal } = require('../scripts/evaluation/live-legacy-journey');
const { selectQualityScenarios } = require('../scripts/evaluation/formal-quality-observer');
const { routePrompt } = require('../lib/workflow/v2/router');

const ROOT = path.join(__dirname, '..');
const WORKLOAD = path.join(ROOT, 'tests', 'fixtures', 'formal-booking-cancellation-workload.json');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'mini-booking');

function write(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
}

describe('revision 4 fair Legacy/v2 comparison contract', () => {
  it('seals immutable stage trees read-only and restores their exact modes', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-stage-seal-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const executable = path.join(legacyStage, 'hooks', 'run-node.sh');
    const regular = path.join(v2Stage, 'plugin.json');
    write(executable, '#!/bin/sh\n');
    write(regular, '{}\n');
    fs.chmodSync(executable, 0o755);
    fs.chmodSync(regular, 0o640);
    const targets = [legacyStage, path.dirname(executable), executable, v2Stage, regular];
    const before = new Map(targets.map(target => [target, fs.statSync(target).mode & 0o7777]));

    const modes = sealStageTrees([legacyStage, v2Stage]);
    for (const target of targets) assert.equal((fs.statSync(target).mode & 0o222), 0);
    assert.equal((fs.statSync(executable).mode & 0o111), 0o111);

    restoreStageModes(modes);
    for (const target of targets) {
      assert.equal(fs.statSync(target).mode & 0o7777, before.get(target));
    }
  });

  it('restores immutable stage modes when cohort preparation fails', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-stage-seal-failure-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    const legacyFile = path.join(legacyStage, 'plugin.json');
    const v2File = path.join(v2Stage, 'plugin.json');
    write(legacyFile, 'legacy');
    write(v2File, 'v2');
    const profile = path.join(temp, 'tool-profile.json');
    write(profile, {
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['Agent', 'Bash', 'Edit', 'Read', 'Write'], disallowedTools: [],
    });
    const runsRoot = path.join(temp, 'runs');
    write(path.join(runsRoot, 'occupied'), 'occupied');
    const targets = [legacyStage, legacyFile, v2Stage, v2File];
    const before = new Map(targets.map(target => [target, fs.statSync(target).mode & 0o7777]));

    assert.throws(() => execute({
      legacyStage, v2Stage, fixture: FIXTURE, workload: WORKLOAD, toolProfile: profile,
      runsRoot, output: path.join(temp, 'output'), model: 'claude-opus-5',
      effort: 'low', turnTimeoutMs: 900000, dryRun: true,
    }), /Runs root must be empty/);
    for (const target of targets) {
      assert.equal(fs.statSync(target).mode & 0o7777, before.get(target));
    }
  });

  it('binds both public grammars to one semantic workload without persisting raw prompts', () => {
    const workload = loadWorkload(WORKLOAD);
    const legacy = buildAdapterProof('legacy', workload, {});
    const v2 = buildAdapterProof('v2', workload, { planRevision: 1, designRevision: 1 });
    assert.equal(legacy.semanticPayloadDigest, v2.semanticPayloadDigest);
    assert.equal(legacy.workloadDigest, v2.workloadDigest);
    assert.deepEqual(legacy.prompts.map(item => item.kind),
      ['request', 'plan-approval', 'design-approval', 'review-progress', 'final-approval']);
    assert.deepEqual(v2.prompts.map(item => item.kind),
      ['request', 'plan-approval', 'design-approval', 'final-approval']);
    assert.match(renderStep('legacy', workload.value, 'request'), /^\/vais cto plan booking-cancellation/);
    assert.match(renderStep('v2', workload.value, 'request'), /^\/vais Mini Booking/);
    assert.equal(JSON.stringify(legacy).includes(workload.value.request), false);
    assert.equal(verifyAdapterProof(legacy, 'legacy', workload), true);
    assert.equal(verifyAdapterProof(v2, 'v2', workload), true);
  });

  it('renders every v2 decision through the public approval grammar', () => {
    const workload = loadWorkload(WORKLOAD).value;
    const waitingPlan = { phase: 'plan', status: 'waiting-user', planRevision: 1, designRevision: 1 };
    const waitingDesign = { ...waitingPlan, phase: 'design' };
    const waitingReview = { ...waitingPlan, phase: 'review' };
    assert.equal(routePrompt(renderStep('v2', workload, 'plan-approval', {
      planRevision: 1,
    }), waitingPlan).action, 'approve-plan');
    assert.equal(routePrompt(renderStep('v2', workload, 'design-approval', {
      designRevision: 1,
    }), waitingDesign).action, 'approve-design');
    assert.equal(routePrompt(renderStep('v2', workload, 'final-approval'), waitingReview).action,
      'approve-final');
  });

  it('rejects an adapter proof changed after deterministic rendering', () => {
    const workload = loadWorkload(WORKLOAD);
    const proof = buildAdapterProof('legacy', workload, {});
    proof.prompts[0].digest = '0'.repeat(64);
    assert.throws(() => verifyAdapterProof(proof, 'legacy', workload), /does not reproduce/);
  });

  it('uses the common observer with Legacy native string phase status', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-legacy-terminal-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const workload = loadWorkload(WORKLOAD).value;
    for (const phase of ['01-plan', '02-design', '03-do', '04-qa', '05-report']) {
      write(path.join(temp, 'docs', workload.feature, phase, 'artifact.md'), phase);
    }
    write(path.join(temp, '.vais', 'status.json'), {
      features: { [workload.feature]: { currentPhase: 'report', status: 'completed',
        phases: { plan: 'completed', design: 'completed', do: 'completed', qa: 'completed', report: 'completed' } } },
    });
    const terminal = legacyTerminal(temp, workload, { evidence: { verdict: 'pass' } });
    assert.equal(terminal.terminalStatus, 'completed');
    assert.equal(terminal.quality, 'pass');
  });

  it('recognizes cancellation evidence semantically without requiring one scenario id or exact manifest size', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURE, 'scenarios.json'), 'utf8'));
    manifest.scenarios.push(
      { id: 'cancel-booking', viewport: [1280, 900], expectedText: 'Morning Flow 예약을 취소했어요' },
      { id: 'multi-class-booking', viewport: [1280, 900], expectedText: 'Core Balance 예약을 취소했어요' },
    );
    const selected = selectQualityScenarios(manifest);
    assert.deepEqual(selected.map(item => item.canonicalId).sort(),
      ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset']);
    assert.equal(selected.find(item => item.canonicalId === 'book-cancel').scenario.id, 'cancel-booking');
  });

  it('prepares the exact alternating six-slot dry-run with identical isolated seeds and no paid calls', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-fair-dry-run-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const legacyStage = path.join(temp, 'legacy-stage');
    const v2Stage = path.join(temp, 'v2-stage');
    write(path.join(legacyStage, 'plugin.json'), 'legacy');
    write(path.join(v2Stage, 'plugin.json'), 'v2');
    const profile = path.join(temp, 'tool-profile.json');
    write(profile, {
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['Agent', 'Bash', 'Edit', 'Read', 'Write'], disallowedTools: [],
    });
    const result = execute({
      legacyStage, v2Stage, fixture: FIXTURE, workload: WORKLOAD, toolProfile: profile,
      runsRoot: path.join(temp, 'runs'), output: path.join(temp, 'output'),
      model: 'claude-opus-5', effort: 'low', turnTimeoutMs: 900000, dryRun: true,
    });
    assert.equal(result.verdict, 'ready');
    assert.equal(result.paidCalls, 0);
    assert.deepEqual(result.executionOrder, EXECUTION_ORDER);
    assert.equal(new Set(result.slots.map(slot => slot.projectSeedDigest)).size, 1);
    for (const slot of EXECUTION_ORDER) {
      const [engine, repetition] = slot.split(':');
      const config = JSON.parse(fs.readFileSync(path.join(temp, 'runs', `${engine}-${repetition}`,
        'project', 'vais.config.json'), 'utf8'));
      assert.equal(config.workflowV2.mode, 'enforce');
    }
    assert.equal(result.slots.every(slot => slot.model === 'claude-opus-5' &&
      slot.effort === 'low' && slot.budgetPolicy === 'subscription-no-dollar-cap' &&
      slot.turnTimeoutMs === 900000 && slot.journeyBudget === undefined), true);
    assert.deepEqual(result.slots.map(slot => slot.promptDigests.length), [5, 4, 5, 4, 5, 4]);
    assert.equal(fs.existsSync(path.join(temp, 'output', 'dry-run-manifest.json')), true);
    const command = runArguments({ legacyStage, v2Stage, toolProfile: profile, workload: WORKLOAD,
      model: 'claude-opus-5', effort: 'low', journeyBudget: null, turnTimeoutMs: 900000 },
    'legacy:1', path.join(temp, 'project'), path.join(temp, 'run'), {
      cohort: { id: 'cohort-test', stage: { digest: 'a'.repeat(64) },
        toolProfile: { digest: 'b'.repeat(64) } },
      stageRoots: { legacy: 'c'.repeat(64), v2: 'd'.repeat(64) },
    });
    assert.equal(command.args.includes('--max-budget'), false);
    assert.equal(command.args[command.args.indexOf('--turn-timeout-ms') + 1], '900000');
    const second = execute({
      legacyStage, v2Stage, fixture: FIXTURE, workload: WORKLOAD, toolProfile: profile,
      runsRoot: path.join(temp, 'runs-second'), output: path.join(temp, 'output-second'),
      model: 'claude-opus-5', effort: 'low', turnTimeoutMs: 900000, dryRun: true,
    });
    assert.notEqual(second.cohortId, result.cohortId);
    assert.match(result.cohortNonce, /^[a-f0-9]{32}$/);
  });

  it('builds the Legacy stage from the approved Git baseline rather than dirty v2 files', t => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-legacy-stage-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const result = buildLegacyStage(ROOT, temp, 'HEAD');
    const expected = spawnSync('git', ['-C', ROOT, 'show', 'HEAD:skills/vais/SKILL.md'], { encoding: 'utf8' });
    assert.equal(expected.status, 0);
    assert.equal(fs.readFileSync(path.join(temp, 'skills', 'vais', 'SKILL.md'), 'utf8'), expected.stdout);
    assert.equal(fs.existsSync(path.join(temp, 'skills', 'vais', 'legacy.md')), false);
    assert.equal(fs.existsSync(path.join(temp, 'lib', 'workflow', 'v2')), false);
    assert.match(result.commit, /^[a-f0-9]{40}$/);
    assert.ok(result.dependencies.includes('node_modules/gray-matter'));
    assert.ok(result.dependencies.includes('node_modules/js-yaml'));
    assert.equal(result.dependencies.includes('node_modules/ajv'), false);
  });
});
