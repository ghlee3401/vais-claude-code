#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { spawnSync } = require('child_process');
const { buildCohort, assembleTrustedBundle, recursiveManifest, EXECUTION_ORDER } =
  require('./trusted-shadow-bundle');
const { loadWorkload, buildAdapterProof, canonicalBody, sha256 } = require('./formal-workload');

function option(argv, name, required = false) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? argv[index + 1] : null;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function ensureEmpty(target, label) {
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error(`${label} must be empty; formal repetitions cannot be replaced`);
  }
  fs.mkdirSync(target, { recursive: true });
}

function collectTreeModes(root) {
  const base = path.resolve(root);
  if (!fs.existsSync(base) || fs.lstatSync(base).isSymbolicLink() ||
    !fs.lstatSync(base).isDirectory()) {
    throw new Error(`Stage tree is unavailable: ${base}`);
  }
  const entries = [];
  const visit = target => {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) throw new Error(`Stage tree contains a symbolic link: ${target}`);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(target).sort()) visit(path.join(target, name));
    }
    entries.push({ path: target, mode: stat.mode & 0o7777 });
  };
  visit(base);
  return entries;
}

function restoreStageModes(entries) {
  for (const entry of [...entries].reverse()) fs.chmodSync(entry.path, entry.mode);
}

function sealStageTrees(roots) {
  const entries = roots.flatMap(collectTreeModes);
  try {
    for (const entry of entries) fs.chmodSync(entry.path, entry.mode & ~0o222);
  } catch (error) {
    restoreStageModes(entries);
    throw error;
  }
  return entries;
}

function copyFixture(source, target) {
  recursiveManifest(source);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function prepareProject(projectRoot, fixtureRoot, repositoryRoot) {
  ensureEmpty(projectRoot, 'Isolated project');
  copyFixture(fixtureRoot, path.join(projectRoot, 'tests', 'fixtures', 'mini-booking'));
  const browserSource = path.join(repositoryRoot, 'scripts', 'evaluation', 'mini-booking-browser.js');
  const browserTarget = path.join(projectRoot, 'scripts', 'evaluation', 'mini-booking-browser.js');
  fs.mkdirSync(path.dirname(browserTarget), { recursive: true });
  fs.copyFileSync(browserSource, browserTarget);
  fs.chmodSync(browserTarget, 0o755);
  const manifest = {
    name: 'mini-booking-formal-fixture', private: true,
    scripts: { 'test:e2e': 'node scripts/evaluation/mini-booking-browser.js' },
  };
  fs.writeFileSync(path.join(projectRoot, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const config = { workflowV2: { mode: 'enforce' } };
  fs.writeFileSync(path.join(projectRoot, 'vais.config.json'), `${JSON.stringify(config, null, 2)}\n`);
  return recursiveManifest(projectRoot);
}

function runArguments(input, slot, projectRoot, runDirectory, trust) {
  const [engine, repetitionText] = slot.split(':');
  const repetition = Number(repetitionText);
  const script = engine === 'legacy' ? 'live-legacy-journey.js' : 'live-v2-journey.js';
  const args = [
    '--plugin', input[`${engine}Stage`], '--output', runDirectory,
    '--journey-id', `${trust.cohort.id}:${slot}`, '--repetition', String(repetition),
    '--sequence-index', String(EXECUTION_ORDER.indexOf(slot) + 1),
    '--cohort-id', trust.cohort.id, '--cohort-model', input.model,
    '--effort', input.effort, '--stage-digest', trust.cohort.stage.digest,
    '--stage-root-digest', trust.stageRoots[engine],
    '--tool-profile-digest', trust.cohort.toolProfile.digest,
    '--tool-profile', input.toolProfile, '--workload', input.workload,
    '--turn-timeout-ms', String(input.turnTimeoutMs),
  ];
  if (input.journeyBudget !== null) args.push('--max-budget', String(input.journeyBudget));
  return {
    engine,
    repetition,
    script: path.join(__dirname, script),
    args,
    cwd: projectRoot,
  };
}

function execute(options) {
  const repositoryRoot = path.resolve(__dirname, '..', '..');
  const input = {
    legacyStage: path.resolve(options.legacyStage),
    v2Stage: path.resolve(options.v2Stage),
    fixture: path.resolve(options.fixture),
    workload: path.resolve(options.workload),
    toolProfile: path.resolve(options.toolProfile),
    model: options.model,
    effort: options.effort || 'low',
    journeyBudget: options.journeyBudget === null || options.journeyBudget === undefined
      ? null : Number(options.journeyBudget),
    turnTimeoutMs: Number(options.turnTimeoutMs || 900000),
    cohortNonce: options.cohortNonce || crypto.randomBytes(16).toString('hex'),
  };
  if (!['low', 'medium', 'high'].includes(input.effort) ||
    (input.journeyBudget !== null && (!Number.isFinite(input.journeyBudget) || input.journeyBudget <= 0)) ||
    !Number.isInteger(input.turnTimeoutMs) || input.turnTimeoutMs <= 0) {
    throw new Error('Cohort effort, journey budget, or turn timeout is invalid');
  }
  const stageModes = sealStageTrees([input.legacyStage, input.v2Stage]);
  try {
    return executeWithSealedStages(options, input, repositoryRoot);
  } finally {
    restoreStageModes(stageModes);
  }
}

function executeWithSealedStages(options, input, repositoryRoot) {
  const workloadInfo = loadWorkload(input.workload);
  const runsRoot = path.resolve(options.runsRoot);
  const output = path.resolve(options.output);
  ensureEmpty(runsRoot, 'Runs root');
  ensureEmpty(output, 'Evidence output');
  const controlRoot = path.join(runsRoot, '.cohort-control');
  fs.mkdirSync(controlRoot, { recursive: true });
  const trust = buildCohort(controlRoot, {
    ...input,
    scenario: workloadInfo.value.scenario,
  });
  const slots = [];
  let projectDigest = null;
  for (const [index, slot] of EXECUTION_ORDER.entries()) {
    const [engine, repetitionText] = slot.split(':');
    const repetition = Number(repetitionText);
    const runDirectory = path.join(runsRoot, `${engine}-${repetition}`);
    const projectRoot = path.join(runDirectory, 'project');
    fs.mkdirSync(runDirectory, { recursive: true });
    const prepared = prepareProject(projectRoot, input.fixture, repositoryRoot);
    if (projectDigest && prepared.digest !== projectDigest) {
      throw new Error('Isolated project seeds are not byte-identical');
    }
    projectDigest = prepared.digest;
    const adapterProof = buildAdapterProof(engine, workloadInfo,
      engine === 'v2' ? { planRevision: 1, designRevision: 1 } : {});
    const planned = {
      sequenceIndex: index + 1, slot, engine, repetition,
      projectSeedDigest: prepared.digest,
      stageRootDigest: trust.stageRoots[engine],
      workloadDigest: workloadInfo.digest,
      semanticPayloadDigest: workloadInfo.semanticPayloadDigest,
      adapterVersion: adapterProof.adapterVersion,
      adapterDigest: adapterProof.adapterDigest,
      promptDigests: adapterProof.prompts,
      model: input.model, effort: input.effort,
      budgetPolicy: trust.cohort.budgetPolicy, turnTimeoutMs: input.turnTimeoutMs,
      ...(input.journeyBudget === null ? {} : { journeyBudget: input.journeyBudget }),
      toolProfileDigest: trust.cohort.toolProfile.digest,
    };
    fs.writeFileSync(path.join(runDirectory, 'dry-run-plan.json'), `${JSON.stringify(planned, null, 2)}\n`);
    slots.push(planned);
    if (!options.dryRun) {
      const command = runArguments(input, slot, projectRoot, runDirectory, trust);
      const result = spawnSync(process.execPath, [command.script, ...command.args], {
        cwd: command.cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
      });
      if (result.status !== 0) {
        const error = new Error(`Formal slot ${slot} did not complete: ${result.stderr || result.stdout}`);
        error.code = 'FORMAL_RUN_INCOMPLETE';
        error.sequenceIndex = index + 1;
        throw error;
      }
    }
  }
  const plan = {
    schema: 'vais-paired-cohort-dry-run/v1', verdict: 'ready', paidCalls: 0,
    cohortId: trust.cohort.id, executionOrder: [...EXECUTION_ORDER], projectSeedDigest: projectDigest,
    cohortNonce: trust.cohort.nonce,
    fixtureDigest: workloadInfo.value.fixture.rootDigest, workloadDigest: workloadInfo.digest,
    semanticPayloadDigest: workloadInfo.semanticPayloadDigest,
    model: input.model, effort: input.effort,
    budgetPolicy: trust.cohort.budgetPolicy, turnTimeoutMs: input.turnTimeoutMs,
    ...(input.journeyBudget === null ? {} : { journeyBudget: input.journeyBudget }),
    toolProfileDigest: trust.cohort.toolProfile.digest, slots,
  };
  const planBody = canonicalBody(plan);
  fs.writeFileSync(path.join(output, 'dry-run-manifest.json'), planBody);
  if (options.dryRun) return { ...plan, manifestDigest: sha256(planBody) };
  const finalOutput = path.join(output, 'trusted');
  const assembled = assembleTrustedBundle({
    ...input,
    runsRoot,
    output: finalOutput,
    scenario: workloadInfo.value.scenario,
  });
  return { verdict: assembled.evaluation.pass ? 'pass' : 'fail',
    cohortId: trust.cohort.id, evidence: assembled.reference, evaluation: assembled.evaluation };
}

function main(argv = process.argv.slice(2)) {
  try {
    const result = execute({
      legacyStage: option(argv, 'legacy-stage', true),
      v2Stage: option(argv, 'v2-stage', true),
      fixture: option(argv, 'fixture', true),
      workload: option(argv, 'workload', true),
      toolProfile: option(argv, 'tool-profile', true),
      runsRoot: option(argv, 'runs-root', true),
      output: option(argv, 'output', true),
      model: option(argv, 'model', true),
      effort: option(argv, 'effort') || 'low',
      journeyBudget: option(argv, 'max-budget'),
      turnTimeoutMs: option(argv, 'turn-timeout-ms') || '900000',
      dryRun: argv.includes('--dry-run'),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.verdict === 'fail' ? 1 : 0;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      verdict: 'blocked', code: error.code || 'COHORT_RUNNER_BLOCKED',
      reason: error.message, ...(error.sequenceIndex ? { sequenceIndex: error.sequenceIndex } : {}),
    })}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = {
  ensureEmpty, collectTreeModes, sealStageTrees, restoreStageModes,
  copyFixture, prepareProject, runArguments, execute, main,
};
