#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { summarizeFormalJourney } = require('./live-shadow-telemetry');
const { loadToolProfile } = require('./live-claude-turn');
const { buildFormalTelemetryEvidence, verifyJourneyTrust } = require('./live-v2-journey');
const { ENGINE_STEPS, loadWorkload, renderStep, buildAdapterProof, sha256 } = require('./formal-workload');
const { observeQuality } = require('./formal-quality-observer');

const PHASE_DIRECTORIES = Object.freeze({
  request: '01-plan',
  'plan-approval': '02-design',
  'design-approval': '03-do',
  'review-progress': '04-qa',
  'final-approval': '05-report',
});

function option(argv, name, required = false) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? argv[index + 1] : null;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function positiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be a positive number`);
  return parsed;
}

function markdownFiles(root) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return [];
  const found = [];
  const visit = directory => {
    for (const name of fs.readdirSync(directory).sort()) {
      const target = path.join(directory, name);
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) throw new Error(`Legacy documents contain an untrusted symlink: ${target}`);
      if (stat.isDirectory()) visit(target);
      else if (stat.isFile() && target.endsWith('.md')) found.push(target);
    }
  };
  visit(root);
  return found;
}

function legacyStatus(projectRoot, feature) {
  const target = path.join(projectRoot, '.vais', 'status.json');
  if (!fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink()) return null;
  const status = JSON.parse(fs.readFileSync(target, 'utf8'));
  return status.features?.[feature] || null;
}

function legacyTerminal(projectRoot, workload, observer) {
  const featureRoot = path.join(projectRoot, 'docs', workload.feature);
  const coverage = Object.values(PHASE_DIRECTORIES).map(directory => ({
    directory,
    documents: markdownFiles(path.join(featureRoot, directory)).length,
  }));
  const state = legacyStatus(projectRoot, workload.feature);
  const completed = (state?.status === 'completed' && ['report', undefined].includes(state?.phase)) ||
    state?.phases?.report?.status === 'completed';
  const documentsComplete = coverage.every(item => item.documents > 0);
  const observerVerdict = observer?.evidence?.verdict || 'blocked';
  return {
    terminalStatus: completed ? 'completed' : state?.status === 'blocked' ? 'blocked' : 'incomplete',
    quality: observerVerdict === 'blocked' || state?.status === 'blocked' ? 'blocked' :
      completed && observerVerdict === 'pass' && documentsComplete ? 'pass' : 'fail',
    reportFrozen: false,
    coverage,
  };
}

function providerAssignments(turns, repetition) {
  const assignments = [];
  turns.forEach((turn, turnIndex) => {
    for (let index = 0; index < turn.agentCalls; index += 1) {
      const id = `legacy-${repetition}-turn-${turnIndex + 1}-agent-${index + 1}`;
      assignments.push({
        role: 'legacy-agent', assignmentId: id, required: true,
        handoffStatus: 'completed', handoffId: `${id}:provider-observed`,
      });
    }
  });
  return assignments;
}

function writeLegacyAdapter(projectRoot, outputDir, input) {
  const terminal = legacyTerminal(projectRoot, input.workloadInfo.value, input.observer);
  const assignments = providerAssignments(input.turns, input.repetition);
  const source = {
    schema: 'legacy-journey-evidence/v1', engine: 'legacy', repetition: input.repetition,
    scenario: input.workloadInfo.value.scenario, scale: input.workloadInfo.value.scale,
    stageRootDigest: input.stageRootDigest, sequenceIndex: input.sequenceIndex,
    model: input.model, effort: input.effort, budgetPolicy: input.budgetPolicy,
    turnTimeoutMs: input.turnTimeoutMs,
    ...(input.journeyBudget === null ? {} : { journeyBudget: input.journeyBudget }),
    adapterProof: input.adapterProof, toolProfile: input.toolProfile,
    qualityObserver: path.relative(outputDir, input.observer.target),
    captures: input.rawPaths.map(target => path.relative(outputDir, target)),
    terminal, assignments, checks: [], contractAttempts: [],
    userTurns: input.adapterProof.prompts.map(prompt => ({ kind: prompt.kind })),
  };
  fs.writeFileSync(path.join(outputDir, 'legacy-adapter.json'), `${JSON.stringify(source, null, 2)}\n`);
  const featureRoot = path.join(projectRoot, 'docs', input.workloadInfo.value.feature);
  const workspaceDocs = path.join(outputDir, 'workspace', 'docs', input.workloadInfo.value.feature);
  fs.mkdirSync(path.dirname(workspaceDocs), { recursive: true });
  if (fs.existsSync(featureRoot)) {
    require('./trusted-shadow-bundle').recursiveManifest(featureRoot);
    fs.cpSync(featureRoot, workspaceDocs, { recursive: true });
  } else {
    fs.mkdirSync(workspaceDocs, { recursive: true });
  }
  return source;
}

function runJourney(argv = process.argv.slice(2)) {
  const projectRoot = process.cwd();
  const plugin = path.resolve(option(argv, 'plugin', true));
  const output = path.resolve(option(argv, 'output', true));
  const journeyId = option(argv, 'journey-id', true);
  const repetition = Number(option(argv, 'repetition', true));
  const sequenceIndex = Number(option(argv, 'sequence-index', true));
  const cohortId = option(argv, 'cohort-id', true);
  const model = option(argv, 'cohort-model', true);
  const effort = option(argv, 'effort') || 'low';
  if (!['low', 'medium', 'high'].includes(effort)) throw new Error('--effort must be low, medium, or high');
  const stageDigest = option(argv, 'stage-digest', true);
  const toolProfileDigest = option(argv, 'tool-profile-digest', true);
  const stageRootDigest = option(argv, 'stage-root-digest', true);
  const toolProfilePath = path.resolve(option(argv, 'tool-profile', true));
  const workloadInfo = loadWorkload(option(argv, 'workload', true));
  const budgetOption = option(argv, 'max-budget');
  const journeyBudget = budgetOption ? positiveNumber(budgetOption, '--max-budget') : null;
  const budgetPolicy = journeyBudget === null ? 'subscription-no-dollar-cap' : 'provider-list-cost-cap';
  const turnTimeoutMs = positiveNumber(option(argv, 'turn-timeout-ms') || '900000', '--turn-timeout-ms');
  if (!Number.isInteger(turnTimeoutMs)) throw new Error('--turn-timeout-ms must be an integer');
  const { observedStageRootDigest, toolProfile } = verifyJourneyTrust(
    plugin, stageRootDigest, toolProfilePath, toolProfileDigest);
  const initialFixtureDigest = require('./trusted-shadow-bundle')
    .recursiveManifest(path.join(projectRoot, 'tests', 'fixtures', 'mini-booking')).digest;
  if (initialFixtureDigest !== workloadInfo.value.fixture.rootDigest) {
    throw new Error('Project fixture does not match the canonical workload');
  }
  fs.mkdirSync(output, { recursive: true });
  const turns = [];
  const rawPaths = [];
  const actualPromptDigests = [];
  let sessionId = null;
  let spent = 0;
  for (const [index, kind] of ENGINE_STEPS.legacy.entries()) {
    const prompt = renderStep('legacy', workloadInfo.value, kind);
    actualPromptDigests.push({ index: index + 1, kind, digest: sha256(prompt) });
    const raw = path.join(output, `turn-${index + 1}.raw.json`);
    const args = [path.join(__dirname, 'live-claude-turn.js'), '--plugin', plugin, '--output', raw,
      '--prompt', prompt, '--model', model, '--effort', effort,
      '--timeout-ms', String(turnTimeoutMs), '--tool-profile', toolProfilePath,
      '--sample-class', 'formal', '--compute-class', 'delivery', '--role', 'workflow-owner',
      '--journey-id', journeyId];
    if (journeyBudget !== null) {
      const remainingBudget = journeyBudget - spent;
      if (remainingBudget <= 0) throw new Error('Journey budget was exhausted before the next formal turn');
      args.push('--max-budget', remainingBudget.toFixed(8));
    }
    if (sessionId) args.push('--resume', sessionId);
    const result = spawnSync(process.execPath, args, {
      cwd: projectRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status !== 0) throw new Error(`Turn ${index + 1} failed: ${result.stderr || result.stdout}`);
    const summary = JSON.parse(result.stdout.trim());
    rawPaths.push(raw);
    sessionId = summary.sessionId;
    turns.push(summary);
    spent = Number((spent + summary.providerListCost).toFixed(8));
    if (journeyBudget !== null && spent > journeyBudget) {
      throw new Error('Provider list cost exceeded the journey budget');
    }
    const phaseRoot = path.join(projectRoot, 'docs', workloadInfo.value.feature, PHASE_DIRECTORIES[kind]);
    if (markdownFiles(phaseRoot).length === 0) {
      throw new Error(`Turn ${index + 1} did not create the expected ${PHASE_DIRECTORIES[kind]} document`);
    }
  }
  if (verifyJourneyTrust(plugin, observedStageRootDigest, toolProfilePath, toolProfile.digest)
    .observedStageRootDigest !== observedStageRootDigest) {
    throw new Error('Plugin tree or tool profile changed during the measured journey');
  }
  const adapterProof = buildAdapterProof('legacy', workloadInfo, {});
  if (JSON.stringify(actualPromptDigests) !== JSON.stringify(adapterProof.prompts)) {
    throw new Error('Actual Legacy prompts do not match the deterministic adapter proof');
  }
  const telemetry = summarizeFormalJourney({
    scenario: workloadInfo.value.scenario, repetition, engine: 'legacy', turns,
  });
  if (!telemetry.eligible) throw new Error(telemetry.contaminationReason);
  const rawEvidence = buildFormalTelemetryEvidence(output, {
    cohort: { id: cohortId, model, effort, stage: { digest: stageDigest },
      toolProfile: { digest: toolProfileDigest } },
    engine: 'legacy', repetition, rawPaths,
  });
  const observer = observeQuality(projectRoot, path.join(output, 'observer'));
  const adapter = writeLegacyAdapter(projectRoot, output, {
    workloadInfo, repetition, sequenceIndex, stageRootDigest: observedStageRootDigest,
    model, effort, journeyBudget, budgetPolicy, turnTimeoutMs,
    adapterProof, toolProfile: toolProfile.profile,
    rawPaths, turns, observer,
  });
  const summary = {
    ...telemetry,
    ...rawEvidence.telemetry,
    sessionId,
    agentCalls: turns.reduce((total, turn) => total + turn.agentCalls, 0),
    terminalStatus: adapter.terminal.terminalStatus,
    quality: adapter.terminal.quality,
    rawTelemetry: rawEvidence.reference,
    runtimeAdapter: 'legacy-adapter.json',
    runtimeAdapterSchema: adapter.schema,
    workloadDigest: workloadInfo.digest,
    semanticPayloadDigest: workloadInfo.semanticPayloadDigest,
    budgetPolicy,
    turnTimeoutMs,
    ...(journeyBudget === null ? {} : { journeyBudget }),
    spent,
  };
  fs.writeFileSync(path.join(output, 'journey-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(runJourney(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  PHASE_DIRECTORIES,
  markdownFiles,
  legacyStatus,
  legacyTerminal,
  providerAssignments,
  writeLegacyAdapter,
  runJourney,
};
