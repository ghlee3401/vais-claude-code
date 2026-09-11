#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { spawnSync } = require('child_process');
const { summarizeFormalJourney } = require('./live-shadow-telemetry');
const { loadToolProfile } = require('./live-claude-turn');
const { buildFormalTelemetryEvidence } = require('./formal-telemetry');
const { workItemDirectory } = require('../../lib/workflow/v2/document-manager');
const { ENGINE_STEPS, loadWorkload, renderStep, buildAdapterProof, sha256 } = require('./formal-workload');
const { observeQuality } = require('./formal-quality-observer');

const STEP_EXPECTATIONS = Object.freeze({
  request: { phase: 'plan', status: 'waiting-user' },
  'plan-approval': { phase: 'design', status: 'waiting-user' },
  'design-approval': { phase: 'review', status: 'waiting-user' },
  'final-approval': { phase: 'report', status: 'completed' },
});
const STEPS = Object.freeze(ENGINE_STEPS.v2.map(kind => Object.freeze({
  kind, ...STEP_EXPECTATIONS[kind], computeClass: 'delivery', role: 'workflow-owner',
})));

function option(argv, name, required = false) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? argv[index + 1] : null;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function currentState(projectRoot) {
  const registry = JSON.parse(fs.readFileSync(path.join(projectRoot, '.vais', 'v2', 'work-items.json'), 'utf8'));
  const items = Object.values(registry.workItems || {});
  if (items.length !== 1) throw new Error(`Expected one Work item, found ${items.length}`);
  return items[0];
}

function resolveStepPrompt(projectRoot, step) {
  if (!step.prompt.includes('{{')) return step.prompt;
  const state = currentState(projectRoot);
  return step.prompt
    .replaceAll('{{planRevision}}', String(state.planRevision))
    .replaceAll('{{designRevision}}', String(state.designRevision));
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function positiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be a positive number`);
  return parsed;
}

function buildAgentManifestEvidence(projectRoot, outputDir, input) {
  const registry = JSON.parse(fs.readFileSync(path.join(projectRoot, '.vais', 'v2', 'work-items.json'), 'utf8'));
  const assignments = Object.values(registry.assignments || {}).filter(receipt =>
    receipt.workItemId === input.workItemId && receipt.designRevision === input.designRevision);
  const requiredAssignments = assignments.map(receipt => ({ role: receipt.role, assignmentId: receipt.id }));
  const calls = assignments.filter(receipt => receipt.completedAt && receipt.handoffStatus).map(receipt => ({
    role: receipt.role, assignmentId: receipt.id,
    handoffId: receipt.handoffEvidencePath || `${receipt.id}:${receipt.handoffDigest || 'recorded'}`,
    status: receipt.handoffStatus,
  }));
  const qaCalls = calls.filter(call => call.role === 'independent-qa');
  const qaRequired = requiredAssignments.filter(item => item.role === 'independent-qa');
  if (qaCalls.length !== 1 || qaRequired.length !== 1 || calls.length !== requiredAssignments.length ||
    calls.some(call => call.status !== 'completed') || new Set(calls.map(call => call.assignmentId)).size !== calls.length) {
    throw new Error('Formal Agent manifest requires every assignment exactly once and exactly one completed independent QA');
  }
  const manifest = { cohortId: input.cohortId, runKey: input.runKey, requiredAssignments, calls };
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  const target = path.join(path.resolve(outputDir), `agent-manifest-${input.runKey.replace(':', '-')}.json`);
  fs.writeFileSync(target, body, 'utf8');
  return {
    manifest,
    qaAssignment: qaCalls[0],
    reference: { path: path.basename(target), digest: digest(body) },
  };
}

function buildV2RuntimeAdapter(projectRoot, outputDir, input) {
  const registry = JSON.parse(fs.readFileSync(path.join(projectRoot, '.vais', 'v2', 'work-items.json'), 'utf8'));
  const item = registry.workItems?.[input.workItemId];
  if (!item) throw new Error('Measured v2 Work item is unavailable');
  const assignments = Object.values(registry.assignments || {}).filter(receipt =>
    receipt.workItemId === item.id && receipt.designRevision === item.designRevision).map(receipt => ({
    role: receipt.role, assignmentId: receipt.id, required: true,
    ...(receipt.handoffStatus ? { handoffStatus: receipt.handoffStatus,
      handoffId: receipt.handoffEvidencePath || `${receipt.id}:${receipt.handoffDigest || 'recorded'}` } : {}),
  }));
  const checks = (registry.events || []).filter(event => event.workItemId === item.id &&
    event.type === 'check.completed' && event.outcome === 'succeeded' &&
    event.details?.designRevision === item.designRevision).map(event => {
    if (!event.details?.command || !event.details?.repoDigest || !event.details?.identity) {
      throw new Error('Check event is missing command, identity, or snapshot evidence');
    }
    return {
      adapter: event.details.check, normalizedCommand: event.details.command,
      designRevision: String(event.details.designRevision), repoSnapshotDigest: event.details.repoDigest,
      supplemental: event.details.supplemental === true,
      ...(event.details.supplementalReason ? { supplementalReason: event.details.supplementalReason } : {}),
    };
  });
  const contractAttempts = (registry.events || []).filter(event => event.workItemId === item.id &&
    event.type === 'phase.transaction' && event.outcome === 'failed').map(event => ({
    transactionId: event.id, outcome: 'schema-error',
    errorFingerprint: digest(`${event.details?.errorCode || 'TRANSITION_REJECTED'}\u0000${event.details?.reason || ''}`),
  }));
  const qaEvent = (registry.events || []).filter(event => event.workItemId === item.id &&
    ['qa.pass', 'qa.fail', 'qa.blocked'].includes(event.type)).at(-1);
  const runtimeQuality = qaEvent?.type === 'qa.pass' ? 'pass' : qaEvent?.type === 'qa.fail' ? 'fail' : 'blocked';
  const observerQuality = input.observer?.evidence?.verdict || 'blocked';
  const quality = runtimeQuality === 'blocked' || observerQuality === 'blocked' ? 'blocked' :
    runtimeQuality === 'pass' && observerQuality === 'pass' ? 'pass' : 'fail';
  const source = {
    schema: 'v2-journey-evidence/v1', engine: 'v2', repetition: input.repetition,
    scenario: input.scenario, scale: item.scale, stageRootDigest: input.stageRootDigest,
    sequenceIndex: input.sequenceIndex, model: input.model, effort: input.effort,
    budgetPolicy: input.budgetPolicy, turnTimeoutMs: input.turnTimeoutMs,
    ...(input.journeyBudget === null ? {} : { journeyBudget: input.journeyBudget }),
    adapterProof: input.adapterProof,
    qualityObserver: path.relative(outputDir, input.observer.target),
    toolProfile: input.toolProfile, captures: input.rawPaths.map(target => path.relative(outputDir, target)),
    assuranceCapture: path.relative(outputDir, input.assuranceRawPath),
    terminal: { terminalStatus: item.status, quality, reportFrozen: item.reportFrozen },
    assignments, checks, contractAttempts,
    userTurns: input.adapterProof.prompts.map(prompt => ({ kind: prompt.kind })),
  };
  const target = path.join(outputDir, 'v2-runtime.json');
  fs.writeFileSync(target, `${JSON.stringify(source, null, 2)}\n`, 'utf8');
  const workspaceDocs = path.join(outputDir, 'workspace', 'docs', path.basename(workItemDirectory(projectRoot, item)));
  fs.mkdirSync(path.dirname(workspaceDocs), { recursive: true });
  fs.cpSync(workItemDirectory(projectRoot, item), workspaceDocs, { recursive: true });
  return source;
}

function verifyJourneyTrust(plugin, expectedStageRootDigest, toolProfilePath, expectedToolProfileDigest) {
  const { recursiveManifest } = require('./trusted-shadow-bundle');
  const observedStageRootDigest = recursiveManifest(plugin).digest;
  if (observedStageRootDigest !== expectedStageRootDigest) {
    throw new Error('Actual plugin tree does not match --stage-root-digest');
  }
  const toolProfile = loadToolProfile(toolProfilePath);
  if (toolProfile.digest !== expectedToolProfileDigest) {
    throw new Error('Actual tool profile does not match --tool-profile-digest');
  }
  return { observedStageRootDigest, toolProfile };
}

function runJourney(argv = process.argv.slice(2)) {
  const projectRoot = process.cwd();
  const plugin = path.resolve(option(argv, 'plugin', true));
  const output = path.resolve(option(argv, 'output', true));
  const journeyId = option(argv, 'journey-id', true);
  const repetition = Number(option(argv, 'repetition', true));
  const cohortId = option(argv, 'cohort-id', true);
  const cohortModel = option(argv, 'cohort-model', true);
  const stageDigest = option(argv, 'stage-digest', true);
  const toolProfileDigest = option(argv, 'tool-profile-digest', true);
  const stageRootDigest = option(argv, 'stage-root-digest', true);
  const toolProfilePath = path.resolve(option(argv, 'tool-profile', true));
  const workloadInfo = loadWorkload(option(argv, 'workload', true));
  const sequenceIndex = Number(option(argv, 'sequence-index', true));
  const effort = option(argv, 'effort') || 'low';
  if (!['low', 'medium', 'high'].includes(effort)) throw new Error('--effort must be low, medium, or high');
  const { observedStageRootDigest, toolProfile } = verifyJourneyTrust(
    plugin, stageRootDigest, toolProfilePath, toolProfileDigest);
  const budgetOption = option(argv, 'max-budget');
  const journeyBudget = budgetOption ? positiveNumber(budgetOption, '--max-budget') : null;
  const budgetPolicy = journeyBudget === null ? 'subscription-no-dollar-cap' : 'provider-list-cost-cap';
  const turnTimeoutMs = positiveNumber(option(argv, 'turn-timeout-ms') || '900000', '--turn-timeout-ms');
  if (!Number.isInteger(turnTimeoutMs)) throw new Error('--turn-timeout-ms must be an integer');
  const { recursiveManifest } = require('./trusted-shadow-bundle');
  const initialFixtureDigest = recursiveManifest(path.join(projectRoot, 'tests', 'fixtures', 'mini-booking')).digest;
  if (initialFixtureDigest !== workloadInfo.value.fixture.rootDigest) {
    throw new Error('Project fixture does not match the canonical workload');
  }
  fs.mkdirSync(output, { recursive: true });
  const turns = [];
  const rawPaths = [];
  const actualPromptDigests = [];
  let sessionId = null;
  let spent = 0;
  for (let index = 0; index < STEPS.length; index += 1) {
    const step = STEPS[index];
    const stateBefore = index === 0 ? null : currentState(projectRoot);
    const bindings = stateBefore ? {
      planRevision: stateBefore.planRevision,
      designRevision: stateBefore.designRevision,
    } : {};
    const prompt = renderStep('v2', workloadInfo.value, step.kind, bindings);
    actualPromptDigests.push({ index: index + 1, kind: step.kind, digest: sha256(prompt) });
    const raw = path.join(output, `turn-${index + 1}.raw.json`);
    const args = [path.join(__dirname, 'live-claude-turn.js'), '--plugin', plugin, '--output', raw,
      '--prompt', prompt, '--model', cohortModel, '--effort', effort,
      '--timeout-ms', String(turnTimeoutMs),
      '--tool-profile', toolProfilePath,
      '--sample-class', 'formal', '--compute-class', step.computeClass, '--role', step.role,
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
    const state = currentState(projectRoot);
    if (state.phase !== step.phase || state.status !== step.status) {
      throw new Error(`Turn ${index + 1} expected ${step.phase}/${step.status}, got ${state.phase}/${state.status}`);
    }
  }
  const finalTrust = verifyJourneyTrust(plugin, observedStageRootDigest, toolProfilePath, toolProfile.digest);
  if (finalTrust.observedStageRootDigest !== observedStageRootDigest) {
    throw new Error('Plugin tree or tool profile changed during the measured journey');
  }
  const telemetry = summarizeFormalJourney({
    scenario: workloadInfo.value.scenario, repetition, engine: 'v2', turns,
  });
  if (!telemetry.eligible) throw new Error(telemetry.contaminationReason);
  const state = currentState(projectRoot);
  const adapterProof = buildAdapterProof('v2', workloadInfo, {
    planRevision: state.planRevision,
    designRevision: state.designRevision,
  });
  if (JSON.stringify(actualPromptDigests) !== JSON.stringify(adapterProof.prompts)) {
    throw new Error('Actual v2 prompts do not match the deterministic adapter proof');
  }
  const runKey = `v2:${repetition}`;
  const agentEvidence = buildAgentManifestEvidence(projectRoot, output, {
    workItemId: state.id, designRevision: state.designRevision, cohortId, runKey,
  });
  const rawEvidence = buildFormalTelemetryEvidence(output, {
    cohort: {
      id: cohortId, model: cohortModel, effort,
      stage: { digest: stageDigest }, toolProfile: { digest: toolProfileDigest },
    },
    engine: 'v2', repetition, rawPaths,
    qaAssignment: { role: agentEvidence.qaAssignment.role,
      assignmentId: agentEvidence.qaAssignment.assignmentId },
    agentAssignments: agentEvidence.manifest.calls,
    assuranceRawPath: rawPaths[2],
  });
  const observer = observeQuality(projectRoot, path.join(output, 'observer'));
  const runtimeAdapter = buildV2RuntimeAdapter(projectRoot, output, {
    workItemId: state.id, repetition, scenario: workloadInfo.value.scenario,
    stageRootDigest: observedStageRootDigest, toolProfile: toolProfile.profile,
    rawPaths, assuranceRawPath: rawPaths[2], sequenceIndex, model: cohortModel,
    effort, journeyBudget, budgetPolicy, turnTimeoutMs, adapterProof, observer,
  });
  const observedAgentCalls = turns.reduce((total, turn) => total + turn.agentCalls, 0);
  if (observedAgentCalls !== agentEvidence.manifest.calls.length) {
    throw new Error('Provider Agent count does not match the assignment/handoff manifest');
  }
  const summary = {
    ...telemetry,
    ...rawEvidence.telemetry,
    sessionId,
    agentCalls: observedAgentCalls,
    requiredAgentCalls: agentEvidence.manifest.requiredAssignments.length,
    duplicateAgentCalls: 0,
    missingRequiredAgentCalls: 0,
    independentQaCalls: 1,
    agentPlanSatisfied: true,
    terminalStatus: state.status,
    reportFrozen: state.reportFrozen,
    rawTelemetry: rawEvidence.reference,
    agentManifest: agentEvidence.reference,
    runtimeAdapter: 'v2-runtime.json',
    runtimeAdapterSchema: runtimeAdapter.schema,
    workloadDigest: workloadInfo.digest,
    semanticPayloadDigest: workloadInfo.semanticPayloadDigest,
    budgetPolicy,
    turnTimeoutMs,
    ...(journeyBudget === null ? {} : { journeyBudget }),
    spent,
    turns: turns.map((turn, index) => ({
      index: index + 1, instructionTokens: turn.instructionTokens, agentCalls: turn.agentCalls,
      telemetryDigest: turn.telemetryDigest,
    })),
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
  STEPS,
  currentState,
  buildFormalTelemetryEvidence,
  buildAgentManifestEvidence,
  buildV2RuntimeAdapter,
  verifyJourneyTrust,
  resolveStepPrompt,
  runJourney,
};
