'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { measureText } = require('../context-metrics');
const { loadRoleCatalog, resolveRole, buildRolePrompt } = require('../workflow/v2/role-registry');
const { loadSchema, validateContract } = require('../workflow/v2/contracts');
const { phaseGuidance } = require('../../hooks/workflow-v2-prompt');
const { classifyRequest } = require('../workflow/profile-classifier');
const { routePrompt } = require('../workflow/v2/router');
const { validateWorkload, semanticPayload, canonicalBody, verifyAdapterProof } =
  require('../../scripts/evaluation/formal-workload');

function loadScenarios(projectRoot) {
  return JSON.parse(fs.readFileSync(
    path.join(projectRoot, 'tests/fixtures/v2-shadow-scenarios.json'), 'utf8'));
}

function legacyReference(projectRoot, profile) {
  const baseline = JSON.parse(fs.readFileSync(
    path.join(projectRoot, 'tests/fixtures/legacy-baseline.json'), 'utf8'));
  const target = profile === 'compact' ? 'legacy-patch-normal' :
    profile === 'high' || profile === 'extended' ? 'legacy-feature-high' : 'legacy-feature-normal';
  const scenario = baseline.scenarios.find(item => item.id === target);
  if (!scenario) throw new Error(`Legacy baseline scenario is missing: ${target}`);
  const metrics = scenario.samples[0].metrics;
  return {
    scenario: target,
    instructionTokens: metrics.fixedContext.estimatedTokens,
    templateTokens: metrics.artifactTemplates.estimatedTokens,
    agentCalls: metrics.agentCount.value,
    accuracy: 'C',
  };
}

function v2InstructionMetric(projectRoot, roleNames) {
  const catalog = loadRoleCatalog(projectRoot);
  const prompts = [...new Set(roleNames)].map(name => {
    const resolved = resolveRole(catalog, name);
    if (!resolved || resolved.kind !== 'role') throw new Error(`Unknown v2 role in scenario: ${name}`);
    return buildRolePrompt(resolved.role);
  });
  const runtimeContract = JSON.stringify(loadSchema('specialistAssignment')) +
    JSON.stringify(loadSchema('specialistHandoff'));
  const entrySkill = fs.readFileSync(path.join(projectRoot, 'skills/vais/SKILL.md'), 'utf8');
  const specialist = fs.readFileSync(path.join(projectRoot, 'agents/v2-specialist.md'), 'utf8');
  const guidance = ['plan', 'design', 'do', 'review', 'report']
    .flatMap(phase => phaseGuidance({ id: 'WI-YYYY-MM-DD-fixture', phase }, '<session>'))
    .join('\n');
  return measureText(`${entrySkill}\n${specialist}\n${prompts.join('\n\n')}\n${guidance}\n${runtimeContract}`);
}

function evaluateScenario(projectRoot, scenario) {
  const legacy = legacyReference(projectRoot, scenario.legacyProfile || scenario.scale);
  const v2 = v2InstructionMetric(projectRoot, scenario.roles);
  const reductionRate = legacy.instructionTokens === 0 ? 0 :
    Number(((legacy.instructionTokens - v2.estimatedTokens) / legacy.instructionTokens).toFixed(4));
  const current = scenario.id === 'email-login' ? null : {
    id: 'WI-2026-09-01-booking', primaryFeature: 'booking', phase: 'do', status: 'active',
  };
  const legacyExecution = classifyRequest(scenario.request.replace(/^\/vais\s+/, ''));
  const v2Execution = routePrompt(scenario.request, current);
  const expectedAction = scenario.id === 'email-login' ? 'start-request' :
    scenario.id === 'concurrent-request' ? 'queue-pending' :
      scenario.id === 'unmanaged-request' ? 'unmanaged-active-work' : 'continue-work';
  return {
    id: scenario.id,
    scale: scenario.scale,
    roles: scenario.roles,
    metrics: {
      legacy,
      v2: {
        instructionTokens: v2.estimatedTokens,
        agentCalls: scenario.roles.length,
        accuracy: 'C',
        limitation: 'Repository/runtime prompt proxy; provider token and elapsed-time telemetry are unavailable.',
      },
      instructionReductionRate: reductionRate,
      agentCallDelta: scenario.roles.length - legacy.agentCalls,
    },
    replay: {
      legacy: { profile: legacyExecution.profile.selected, assurance: legacyExecution.assurance.level },
      v2: { managed: v2Execution.managed, action: v2Execution.action, mutationAllowed: v2Execution.mutationAllowed },
      expectedAction,
      pass: v2Execution.action === expectedAction,
    },
  };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function evidenceFailure(status, reason) {
  return { status, pass: false, reason };
}

function providerUsage(value = {}) {
  const number = (...names) => {
    const selected = names.find(name => value[name] !== undefined);
    return Number(selected ? value[selected] : 0);
  };
  return {
    cacheCreationInputTokens: number('cacheCreationInputTokens', 'cache_creation_input_tokens', 'totalCacheCreationTokens'),
    cacheReadInputTokens: number('cacheReadInputTokens', 'cache_read_input_tokens', 'totalCacheReadTokens'),
    outputTokens: number('outputTokens', 'output_tokens'),
  };
}

function sameUsage(left, right) {
  return ['cacheCreationInputTokens', 'cacheReadInputTokens', 'outputTokens']
    .every(field => left?.[field] === right?.[field]);
}

function subtractUsage(total, outer) {
  const remainder = Object.fromEntries(Object.keys(total).map(key => [key, total[key] - outer[key]]));
  return Object.values(remainder).every(value => Number.isInteger(value) && value >= 0) ? remainder : null;
}

function canonicalEvidenceValue(value) {
  if (Array.isArray(value)) {
    const normalized = value.map(canonicalEvidenceValue);
    return normalized.every(item => ['string', 'number', 'boolean'].includes(typeof item))
      ? [...new Set(normalized)].sort() : normalized;
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalEvidenceValue(value[key])]));
}

function readEvidenceFile(evidenceRoot, reference, label, parseJson = true) {
  if (!evidenceRoot) return evidenceFailure('unavailable', `${label} evidence root was not provided`);
  const root = path.resolve(evidenceRoot);
  if (!fs.existsSync(root)) return evidenceFailure('unavailable', `${label} evidence root is unavailable`);
  const target = path.resolve(root, reference.path);
  if (target === root || !target.startsWith(`${root}${path.sep}`)) {
    return evidenceFailure('invalid', `${label} path escapes the evidence root`);
  }
  if (!fs.existsSync(target)) return evidenceFailure('unavailable', `${label} file is unavailable: ${reference.path}`);
  let realRoot;
  let realTarget;
  let bytes;
  try {
    if (fs.lstatSync(target).isSymbolicLink()) return evidenceFailure('invalid', `${label} file must not be a symbolic link`);
    realRoot = fs.realpathSync(root);
    realTarget = fs.realpathSync(target);
    bytes = fs.readFileSync(target);
  } catch (error) {
    return evidenceFailure('unavailable', `${label} file cannot be read: ${error.code || error.message}`);
  }
  if (realTarget === realRoot || !realTarget.startsWith(`${realRoot}${path.sep}`)) {
    return evidenceFailure('invalid', `${label} path resolves outside the evidence root`);
  }
  if (sha256(bytes) !== reference.digest) return evidenceFailure('invalid', `${label} digest does not match the file`);
  if (!parseJson) return { status: 'available', bytes };
  try {
    return { status: 'available', value: JSON.parse(bytes.toString('utf8')) };
  } catch (_) {
    return evidenceFailure('invalid', `${label} must contain JSON`);
  }
}

function validateAgentManifest(run, manifest) {
  if (manifest?.cohortId !== run.cohortId || manifest?.runKey !== `${run.engine}:${run.repetition}`) {
    return 'Agent manifest is not bound to this cohort run';
  }
  if (!manifest || !Array.isArray(manifest.requiredAssignments) || !Array.isArray(manifest.calls)) {
    return 'Agent manifest requires requiredAssignments and calls arrays';
  }
  const planned = new Map();
  for (const entry of manifest.requiredAssignments) {
    if (!entry || typeof entry.assignmentId !== 'string' || typeof entry.role !== 'string' || planned.has(entry.assignmentId)) {
      return 'Agent manifest required assignments must have unique assignmentId and role values';
    }
    planned.set(entry.assignmentId, entry.role);
  }
  const callCounts = new Map();
  const handoffIds = new Set();
  let structurallyValid = true;
  for (const call of manifest.calls) {
    if (!call || typeof call.assignmentId !== 'string' || typeof call.role !== 'string' ||
      typeof call.handoffId !== 'string' || !['completed', 'blocked', 'failed'].includes(call.status)) {
      return 'Agent manifest calls require role, assignmentId, handoffId, and status';
    }
    callCounts.set(call.assignmentId, (callCounts.get(call.assignmentId) || 0) + 1);
    if (handoffIds.has(call.handoffId)) structurallyValid = false;
    handoffIds.add(call.handoffId);
    if (!planned.has(call.assignmentId) || planned.get(call.assignmentId) !== call.role) structurallyValid = false;
  }
  const duplicateCalls = [...callCounts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
  const missingCalls = [...planned.keys()].filter(assignmentId => !callCounts.has(assignmentId)).length;
  const independentQaCalls = manifest.calls.filter(call => call.role === 'independent-qa').length;
  const planSatisfied = structurallyValid && planned.size === manifest.calls.length &&
    [...planned.entries()].every(([assignmentId, role]) => {
      const matches = manifest.calls.filter(call => call.assignmentId === assignmentId && call.role === role);
      return matches.length === 1 && matches[0].status === 'completed' && matches[0].handoffId.length > 0;
    });
  if (run.agentCalls !== manifest.calls.length || run.requiredAgentCalls !== planned.size ||
    run.duplicateAgentCalls !== duplicateCalls || run.missingRequiredAgentCalls !== missingCalls ||
    run.independentQaCalls !== independentQaCalls || run.agentPlanSatisfied !== planSatisfied) {
    return 'Agent counts or plan verdict do not match the assignment/handoff manifest';
  }
  return null;
}

function validateDocumentManifest(evidenceRoot, run, manifest) {
  if (manifest?.cohortId !== run.cohortId || manifest?.runKey !== `${run.engine}:${run.repetition}`) {
    return 'Document manifest is not bound to this cohort run';
  }
  if (!manifest || !Array.isArray(manifest.documents)) return 'Document manifest requires a documents array';
  let authoredCount = 0;
  let derivedCount = 0;
  let authoredBytes = 0;
  let derivedBytes = 0;
  let transientDraftCount = 0;
  const seen = new Set();
  for (const document of manifest.documents) {
    if (!document || !['authored', 'derived', 'transient'].includes(document.kind) || !Number.isInteger(document.bytes) ||
      typeof document.path !== 'string' || typeof document.digest !== 'string' || seen.has(document.path)) {
      return 'Document manifest entries require unique path, kind, bytes, and digest values';
    }
    seen.add(document.path);
    const checked = readEvidenceFile(evidenceRoot, document, `Document ${document.path}`, false);
    if (checked.status !== 'available') return checked;
    if (checked.bytes.length !== document.bytes) return `Document byte count does not match ${document.path}`;
    if (document.kind === 'authored') {
      authoredCount += 1;
      authoredBytes += document.bytes;
    } else if (document.kind === 'derived') {
      derivedCount += 1;
      derivedBytes += document.bytes;
    } else {
      transientDraftCount += 1;
    }
  }
  if (run.authoredDocumentCount !== authoredCount || run.derivedDocumentCount !== derivedCount ||
    run.documentCount !== authoredCount + derivedCount + transientDraftCount || run.authoredDocumentBytes !== authoredBytes ||
    run.derivedDocumentBytes !== derivedBytes || run.transientDraftCount !== transientDraftCount ||
    run.documentBytes !== authoredBytes + derivedBytes + manifest.documents
      .filter(item => item.kind === 'transient').reduce((total, item) => total + item.bytes, 0)) {
    return 'Document counts or bytes do not match the authored/derived manifest';
  }
  return null;
}

function assertManifestBinding(run, manifest, label) {
  return manifest?.cohortId === run.cohortId && manifest?.runKey === `${run.engine}:${run.repetition}`
    ? null : `${label} is not bound to this cohort run`;
}

function validateCheckManifest(run, manifest) {
  const binding = assertManifestBinding(run, manifest, 'Check manifest');
  if (binding) return binding;
  if (!Array.isArray(manifest.checks)) return 'Check manifest requires a checks array';
  const groups = new Map();
  for (const check of manifest.checks) {
    if (!check || [check.adapter, check.normalizedCommand, check.designRevision,
      check.repoSnapshotDigest].some(value => typeof value !== 'string' || value.length === 0)) {
      return 'Check manifest entries require adapter, normalizedCommand, designRevision, and repoSnapshotDigest';
    }
    const identity = [check.adapter, check.normalizedCommand, check.designRevision,
      check.repoSnapshotDigest].join('\u0000');
    if (check.supplemental === true && (typeof check.supplementalReason !== 'string' || !check.supplementalReason.trim())) {
      return 'Supplemental checks require a non-empty supplementalReason';
    }
    const group = groups.get(identity) || { regular: 0, supplemental: 0 };
    if (check.supplemental === true) group.supplemental += 1;
    else group.regular += 1;
    groups.set(identity, group);
  }
  let duplicates = 0;
  for (const group of groups.values()) {
    if (group.regular === 0 && group.supplemental > 0) return 'Supplemental check must follow a primary check identity';
    duplicates += Math.max(0, group.regular - 1) + Math.max(0, group.supplemental - 1);
  }
  return duplicates === run.duplicateCheckCount ? null : 'duplicateCheckCount does not match the check identity manifest';
}

function validateContractManifest(run, manifest) {
  const binding = assertManifestBinding(run, manifest, 'Contract manifest');
  if (binding) return binding;
  if (!Array.isArray(manifest.attempts)) return 'Contract manifest requires an attempts array';
  let retries = 0;
  let sameErrorRepeats = 0;
  const fingerprints = new Map();
  for (const attempt of manifest.attempts) {
    if (!attempt || typeof attempt.transactionId !== 'string' ||
      !['pass', 'schema-error', 'byte-error'].includes(attempt.outcome)) {
      return 'Contract attempts require transactionId and a supported outcome';
    }
    if (attempt.outcome !== 'pass') {
      if (typeof attempt.errorFingerprint !== 'string' || !attempt.errorFingerprint) {
        return 'Contract errors require errorFingerprint';
      }
      retries += 1;
      const key = `${attempt.transactionId}\u0000${attempt.errorFingerprint}`;
      const count = (fingerprints.get(key) || 0) + 1;
      fingerprints.set(key, count);
      if (count > 1) sameErrorRepeats += 1;
    }
  }
  return retries !== run.contractRetryCount || sameErrorRepeats !== run.sameErrorRepeatCount
    ? 'Contract retry metrics do not match the contract manifest' : null;
}

function validateUserTurnManifest(run, manifest) {
  const binding = assertManifestBinding(run, manifest, 'User-turn manifest');
  if (binding) return binding;
  if (!Array.isArray(manifest.turns)) return 'User-turn manifest requires a turns array';
  const allowed = new Set(['request', 'plan-approval', 'design-approval', 'final-approval',
    'review-progress', 'decision-required']);
  if (manifest.turns.some(turn => !turn || !allowed.has(turn.kind))) {
    return 'User-turn manifest contains an unsupported turn kind';
  }
  const reviewProgress = manifest.turns.filter(turn => turn.kind === 'review-progress').length;
  if (run.userTurnCount !== undefined && run.userTurnCount !== manifest.turns.length) {
    return 'userTurnCount does not match the user-turn manifest';
  }
  return reviewProgress === run.standaloneReviewProgressTurnCount ? null :
    'standaloneReviewProgressTurnCount does not match the user-turn manifest';
}

function validateAdapterManifest(evidenceRoot, run, cohort, workloadInfo) {
  if (!run.adapterManifest) return evidenceFailure('invalid', 'Revision 4 run requires adapter evidence');
  const checked = readEvidenceFile(evidenceRoot, run.adapterManifest, 'Adapter manifest');
  if (checked.status !== 'available') return checked;
  const manifest = checked.value;
  const runKey = `${run.engine}:${run.repetition}`;
  const sequenceIndex = cohort.executionOrder.indexOf(runKey) + 1;
  if (manifest?.cohortId !== run.cohortId || manifest?.runKey !== runKey ||
    manifest?.sequenceIndex !== sequenceIndex || manifest?.model !== cohort.model ||
    manifest?.effort !== cohort.effort || manifest?.budgetPolicy !== cohort.budgetPolicy ||
    manifest?.turnTimeoutMs !== cohort.turnTimeoutMs || manifest?.journeyBudget !== cohort.journeyBudget) {
    return evidenceFailure('invalid', 'Adapter manifest conditions do not match the immutable cohort');
  }
  const proof = { ...manifest };
  for (const key of ['cohortId', 'runKey', 'sequenceIndex', 'model', 'effort', 'budgetPolicy',
    'turnTimeoutMs', 'journeyBudget']) delete proof[key];
  try {
    verifyAdapterProof(proof, run.engine, workloadInfo);
  } catch (error) {
    return evidenceFailure('invalid', error.message);
  }
  return { status: 'available' };
}

function validateQualityObserver(evidenceRoot, run) {
  if (!run.qualityObserver) return evidenceFailure('invalid', 'Revision 4 run requires common quality evidence');
  const checked = readEvidenceFile(evidenceRoot, run.qualityObserver, 'Common quality observer');
  if (checked.status !== 'available') return checked;
  const observer = checked.value;
  const required = ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset'];
  if (observer?.schema !== 'vais-formal-quality-observer/v1' || observer?.fixture !== 'mini-booking' ||
    !['pass', 'fail', 'blocked'].includes(observer?.verdict) ||
    JSON.stringify(observer?.requiredScenarioIds) !== JSON.stringify(required) ||
    !Array.isArray(observer?.observedScenarioIds) || !Array.isArray(observer?.scenarios) ||
    (run.quality === 'pass' && observer.verdict !== 'pass')) {
    return evidenceFailure('invalid', 'Common quality observer is malformed or disagrees with run quality');
  }
  return { status: 'available' };
}

function validateRunEvidence(evidenceRoot, run, cohort, workloadInfo = null) {
  if (workloadInfo) {
    const adapter = validateAdapterManifest(evidenceRoot, run, cohort, workloadInfo);
    if (adapter.status !== 'available') return adapter;
    const quality = validateQualityObserver(evidenceRoot, run);
    if (quality.status !== 'available') return quality;
  }
  if (run.telemetryDigest !== run.rawTelemetry.digest) return evidenceFailure('invalid', 'telemetryDigest must match rawTelemetry.digest');
  const raw = readEvidenceFile(evidenceRoot, run.rawTelemetry, 'Raw telemetry');
  if (raw.status !== 'available') return raw;
  const rawFields = ['sampleClass', 'instructionTokens', 'deliveryCacheCreationTokens',
    'assuranceCacheCreationTokens', 'totalCacheCreationTokens', 'totalCacheReadTokens', 'outputTokens',
    'elapsedMs', 'providerListCost', 'diagnosticCacheCreationTokens', 'formalTurnCount', 'diagnosticTurnCount'];
  if (rawFields.some(field => raw.value?.[field] !== run[field])) {
    return evidenceFailure('invalid', 'Run token partition does not match raw telemetry evidence');
  }
  if (raw.value?.cohortId !== run.cohortId || raw.value?.runKey !== `${run.engine}:${run.repetition}` ||
    raw.value?.stageDigest !== cohort.stage.digest || raw.value?.model !== cohort.model ||
    raw.value?.effort !== cohort.effort || raw.value?.toolProfileDigest !== cohort.toolProfile.digest) {
    return evidenceFailure('invalid', 'Raw telemetry metadata does not match the immutable cohort');
  }
  if (!Array.isArray(raw.value?.turns) || raw.value.turns.length === 0) {
    return evidenceFailure('invalid', 'Raw telemetry evidence requires at least one provider turn reference');
  }
  let formalTokens = 0;
  let deliveryTokens = 0;
  let assuranceTokens = 0;
  let diagnosticTokens = 0;
  let totalCacheReadTokens = 0;
  let outputTokens = 0;
  let elapsedMs = 0;
  let providerListCost = 0;
  let formalTurns = 0;
  let diagnosticTurns = 0;
  const rawAssignments = new Set();
  const rawAgentAssignments = new Set();
  let hasAttributedAgents = false;
  const observedProviders = new Set();
  const formalProviders = new Set();
  const diagnosticProviders = new Set();
  for (const [index, turn] of raw.value.turns.entries()) {
    if (!turn || !['formal', 'diagnostic'].includes(turn.sampleClass) ||
      !['delivery', 'assurance', 'diagnostic'].includes(turn.computeClass) || typeof turn.role !== 'string' ||
      !Number.isInteger(turn.elapsedMs) || turn.elapsedMs < 0 ||
      typeof turn.providerListCost !== 'number' || turn.providerListCost < 0 || !turn.path || !turn.digest) {
      return evidenceFailure('invalid', `Raw telemetry turn ${index} is malformed`);
    }
    if ((turn.sampleClass === 'diagnostic') !== (turn.computeClass === 'diagnostic')) {
      return evidenceFailure('invalid', `Raw telemetry turn ${index} sample and compute classes disagree`);
    }
    const assuranceRole = ['independent-qa', 'review-owner'].includes(turn.role);
    if (turn.sampleClass === 'formal' && (assuranceRole ? turn.computeClass !== 'assurance' : turn.computeClass !== 'delivery')) {
      return evidenceFailure('invalid', `Raw telemetry turn ${index} role does not match its compute class`);
    }
    const provider = readEvidenceFile(evidenceRoot, turn, `Raw provider turn ${index}`);
    if (provider.status !== 'available') return provider;
    const usageSource = turn.usageSource || 'aggregate';
    if (!['aggregate', 'outer', 'remainder', 'delivery-composite', 'agent'].includes(usageSource)) {
      return evidenceFailure('invalid', `Raw provider turn ${index} has an unsupported usageSource`);
    }
    const rootMetadata = provider.value?.evaluationMetadata;
    const metadata = Array.isArray(rootMetadata?.segments)
      ? rootMetadata.segments.find(segment => segment.usageSource === usageSource &&
        (usageSource !== 'agent' || segment.assignmentId === turn.assignmentId))
      : rootMetadata;
    if (metadata?.cohortId !== run.cohortId || metadata?.runKey !== `${run.engine}:${run.repetition}` ||
      metadata?.sampleClass !== turn.sampleClass || metadata?.computeClass !== turn.computeClass ||
      metadata?.role !== turn.role || (metadata?.assignmentId || null) !== (turn.assignmentId || null) ||
      (metadata?.usageSource || 'aggregate') !== usageSource) {
      return evidenceFailure('invalid', `Raw provider turn ${index} is not bound to its run and compute role`);
    }
    if (turn.assignmentId) rawAssignments.add(turn.assignmentId);
    const modelUsage = Object.values(provider.value?.modelUsage || {});
    if (modelUsage.length === 0) return evidenceFailure('invalid', `Raw provider turn ${index} has no modelUsage`);
    if (!Object.prototype.hasOwnProperty.call(provider.value.modelUsage, cohort.model)) {
      return evidenceFailure('invalid', `Raw provider turn ${index} does not include the cohort model`);
    }
    if (provider.value.duration_ms !== turn.elapsedMs || provider.value.total_cost_usd !== turn.providerListCost) {
      return evidenceFailure('invalid', `Raw provider turn ${index} elapsed or list cost does not match its reference`);
    }
    const aggregateUsage = modelUsage.map(providerUsage).reduce((total, usage) => ({
      cacheCreationInputTokens: total.cacheCreationInputTokens + usage.cacheCreationInputTokens,
      cacheReadInputTokens: total.cacheReadInputTokens + usage.cacheReadInputTokens,
      outputTokens: total.outputTokens + usage.outputTokens,
    }), { cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 });
    const outerUsage = providerUsage(provider.value?.usage);
    const remainderUsage = subtractUsage(aggregateUsage, outerUsage);
    if (usageSource === 'remainder' && (!provider.value?.usage || !remainderUsage)) {
      return evidenceFailure('invalid', `Raw provider turn ${index} cannot derive assurance remainder`);
    }
    let selectedUsage;
    if (['delivery-composite', 'agent'].includes(usageSource)) {
      const agentSegments = rootMetadata?.agentSegments;
      if (!Array.isArray(agentSegments) || !remainderUsage || !provider.value?.usage ||
        Number(provider.value?.subagent_stats?.spawned || 0) !== agentSegments.length ||
        Number(provider.value?.subagent_stats?.completed || 0) !== agentSegments.length ||
        Number(provider.value?.subagent_stats?.failed || 0) !== 0) {
        return evidenceFailure('invalid', `Raw provider turn ${index} has invalid attributed Agent telemetry`);
      }
      const byAssignment = new Map();
      let childCreation = 0;
      let childRead = 0;
      let childOutput = 0;
      for (const segment of agentSegments) {
        const usage = providerUsage(segment?.usage);
        if (!segment?.agentId || !segment.assignmentId || !segment.role || segment.status !== 'completed' ||
          segment.model !== cohort.model || byAssignment.has(segment.assignmentId) ||
          Object.values(usage).some(value => !Number.isInteger(value) || value < 0)) {
          return evidenceFailure('invalid', `Raw provider turn ${index} has a malformed Agent usage segment`);
        }
        byAssignment.set(segment.assignmentId, { ...segment, normalizedUsage: usage });
        rawAgentAssignments.add(segment.assignmentId);
        childCreation += usage.cacheCreationInputTokens;
        childRead += usage.cacheReadInputTokens;
        childOutput += usage.outputTokens;
      }
      hasAttributedAgents = true;
      if (childCreation !== remainderUsage.cacheCreationInputTokens ||
        childRead !== remainderUsage.cacheReadInputTokens || childOutput > remainderUsage.outputTokens) {
        return evidenceFailure('invalid', `Raw provider turn ${index} Agent usage does not reconcile with provider totals`);
      }
      const assuranceUsage = [...byAssignment.values()]
        .filter(segment => ['independent-qa', 'review-owner'].includes(segment.role))
        .reduce((total, segment) => ({
          cacheCreationInputTokens: total.cacheCreationInputTokens + segment.normalizedUsage.cacheCreationInputTokens,
          cacheReadInputTokens: total.cacheReadInputTokens + segment.normalizedUsage.cacheReadInputTokens,
          outputTokens: total.outputTokens + segment.normalizedUsage.outputTokens,
        }), { cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 });
      const expected = usageSource === 'agent'
        ? byAssignment.get(turn.assignmentId)?.normalizedUsage
        : subtractUsage(aggregateUsage, assuranceUsage);
      selectedUsage = providerUsage(metadata?.usage);
      if (!expected || !sameUsage(selectedUsage, expected) ||
        (usageSource === 'agent' && metadata?.agentId !== byAssignment.get(turn.assignmentId)?.agentId)) {
        return evidenceFailure('invalid', `Raw provider turn ${index} attributed usage is inconsistent`);
      }
    } else {
      selectedUsage = usageSource === 'outer' ? outerUsage :
        usageSource === 'remainder' ? remainderUsage : aggregateUsage;
    }
    const tokens = selectedUsage.cacheCreationInputTokens;
    const cacheRead = selectedUsage.cacheReadInputTokens;
    const output = selectedUsage.outputTokens;
    if (!Number.isInteger(tokens) || tokens < 0) return evidenceFailure('invalid', `Raw provider turn ${index} token usage is invalid`);
    if (!Number.isInteger(cacheRead) || cacheRead < 0 || !Number.isInteger(output) || output < 0) {
      return evidenceFailure('invalid', `Raw provider turn ${index} observed token usage is invalid`);
    }
    totalCacheReadTokens += cacheRead;
    outputTokens += output;
    const providerKey = `${turn.path}\u0000${turn.digest}`;
    if (!observedProviders.has(providerKey)) {
      observedProviders.add(providerKey);
      elapsedMs += turn.elapsedMs;
      providerListCost += turn.providerListCost;
    }
    if (turn.sampleClass === 'formal') {
      formalTokens += tokens;
      if (turn.computeClass === 'delivery') deliveryTokens += tokens;
      else assuranceTokens += tokens;
      formalProviders.add(providerKey);
    } else {
      diagnosticTokens += tokens;
      diagnosticProviders.add(providerKey);
    }
  }
  formalTurns = formalProviders.size;
  diagnosticTurns = diagnosticProviders.size;
  providerListCost = Number(providerListCost.toFixed(8));
  if (formalTokens !== run.instructionTokens || deliveryTokens !== run.deliveryCacheCreationTokens ||
    assuranceTokens !== run.assuranceCacheCreationTokens || diagnosticTokens !== run.diagnosticCacheCreationTokens ||
    formalTokens + diagnosticTokens !== run.totalCacheCreationTokens || formalTurns !== run.formalTurnCount ||
    diagnosticTurns !== run.diagnosticTurnCount || totalCacheReadTokens !== run.totalCacheReadTokens ||
    outputTokens !== run.outputTokens || elapsedMs !== run.elapsedMs || providerListCost !== run.providerListCost) {
    return evidenceFailure('invalid', 'Run token partition does not reconcile with raw provider modelUsage');
  }
  if (run.deliveryCacheCreationTokens + run.assuranceCacheCreationTokens +
    run.diagnosticCacheCreationTokens !== run.totalCacheCreationTokens) {
    return evidenceFailure('invalid', 'Delivery, assurance, and diagnostic compute do not reconcile to provider total');
  }
  const terminal = readEvidenceFile(evidenceRoot, run.terminalEvidence, 'Terminal');
  if (terminal.status !== 'available') return terminal;
  if (terminal.value?.cohortId !== run.cohortId || terminal.value?.runKey !== `${run.engine}:${run.repetition}` ||
    terminal.value?.terminalStatus !== run.terminalStatus || terminal.value?.quality !== run.quality ||
    (run.engine === 'v2' && run.terminalStatus === 'completed' && terminal.value?.reportFrozen !== true)) {
    return evidenceFailure('invalid', 'Run terminal state or quality does not match terminal evidence');
  }
  const agent = readEvidenceFile(evidenceRoot, run.agentManifest, 'Agent manifest');
  if (agent.status !== 'available') return agent;
  const agentError = validateAgentManifest(run, agent.value);
  if (agentError) return evidenceFailure('invalid', agentError);
  if (agent.value.calls.some(call => call.role === 'independent-qa' && !rawAssignments.has(call.assignmentId))) {
    return evidenceFailure('invalid', 'Independent QA assignment is missing role-bound raw provider telemetry');
  }
  if (run.engine === 'v2' && hasAttributedAgents &&
    agent.value.calls.some(call => !rawAgentAssignments.has(call.assignmentId))) {
    return evidenceFailure('invalid', 'Completed Agent assignment is missing transcript-attributed provider telemetry');
  }
  const documents = readEvidenceFile(evidenceRoot, run.documentManifest, 'Document manifest');
  if (documents.status !== 'available') return documents;
  const documentError = validateDocumentManifest(evidenceRoot, run, documents.value);
  if (documentError?.status) return documentError;
  if (documentError) return evidenceFailure('invalid', documentError);
  for (const [reference, label, validator] of [
    [run.checkManifest, 'Check manifest', validateCheckManifest],
    [run.contractManifest, 'Contract manifest', validateContractManifest],
    [run.userTurnManifest, 'User-turn manifest', validateUserTurnManifest],
  ]) {
    const checked = readEvidenceFile(evidenceRoot, reference, label);
    if (checked.status !== 'available') return checked;
    const error = validator(run, checked.value);
    if (error) return evidenceFailure('invalid', error);
  }
  return { status: 'available' };
}

function evaluateLiveEvidence(evidence, options = {}) {
  if (!evidence) return { status: 'unavailable', pass: false, reason: 'Live Claude Code A/B evidence was not provided' };
  const validation = validateContract('liveShadowEvidence', evidence);
  if (!validation.valid) return { status: 'invalid', pass: false, reason: validation.errors.join('; ') };
  if (evidence.schemaVersion === '1.0') {
    return { status: 'legacy-format', pass: false, reason: 'Legacy 1.0 evidence is readable but cannot support a new PASS verdict' };
  }
  const evidenceRoot = options.evidenceRoot;
  const stage = readEvidenceFile(evidenceRoot, evidence.cohort.stage, 'Stage');
  if (stage.status !== 'available') return stage;
  const stageValue = stage.value;
  const validStage = stageValue?.schema === 'live-shadow-stage/v1' &&
    /^[a-f0-9]{64}$/.test(stageValue.fixtureDigest || '') &&
    Array.isArray(stageValue.fixture?.files) &&
    stageValue.fixture.fileCount === stageValue.fixture.files.length &&
    stageValue.fixture.rootDigest === stageValue.fixtureDigest &&
    stageValue.fixture.rootDigest === sha256(JSON.stringify(stageValue.fixture.files)) &&
    ['legacy', 'v2'].every(engine => Array.isArray(stageValue[engine]?.files) &&
      stageValue[engine].fileCount === stageValue[engine].files.length &&
      stageValue[engine].rootDigest === sha256(JSON.stringify(stageValue[engine].files))) &&
    stageValue.legacy.rootDigest !== stageValue.v2.rootDigest;
  if (!validStage) return evidenceFailure('invalid', 'Stage evidence does not contain two distinct recursive manifests and fixture digest');
  const toolProfile = readEvidenceFile(evidenceRoot, evidence.cohort.toolProfile, 'Tool profile');
  if (toolProfile.status !== 'available') return toolProfile;
  if (JSON.stringify(toolProfile.value) !== JSON.stringify(canonicalEvidenceValue(toolProfile.value))) {
    return evidenceFailure('invalid', 'Tool profile evidence is not normalized');
  }
  let workloadInfo = null;
  if (['2.1', '2.2'].includes(evidence.schemaVersion)) {
    const workload = readEvidenceFile(evidenceRoot, evidence.cohort.workload, 'Canonical workload');
    if (workload.status !== 'available') return workload;
    try {
      validateWorkload(workload.value);
    } catch (error) {
      return evidenceFailure('invalid', error.message);
    }
    const body = canonicalBody(workload.value);
    workloadInfo = {
      value: workload.value,
      body,
      digest: sha256(body),
      semanticPayloadDigest: sha256(canonicalBody(semanticPayload(workload.value))),
    };
    if (workload.value.scenario !== evidence.cohort.scenario ||
      workload.value.fixture.rootDigest !== stageValue.fixtureDigest) {
      return evidenceFailure('invalid', 'Canonical workload does not match the cohort scenario or fixture');
    }
    const observedOrder = evidence.runs.map(run => `${run.engine}:${run.repetition}`);
    if (JSON.stringify(observedOrder) !== JSON.stringify(evidence.cohort.executionOrder)) {
      return evidenceFailure('invalid', 'Formal runs do not use the approved alternating execution order');
    }
  }
  for (const run of evidence.runs) {
    if (run.cohortId !== evidence.cohort.id || run.scenario !== evidence.cohort.scenario) {
      return evidenceFailure('invalid', 'Every run must belong to the declared cohort and scenario');
    }
    const checked = validateRunEvidence(evidenceRoot, run, evidence.cohort, workloadInfo);
    if (checked.status !== 'available') return checked;
  }
  const formal = evidence.runs.filter(run => run.sampleClass === 'formal');
  const diagnostics = evidence.runs.filter(run => run.sampleClass === 'diagnostic');
  const keys = new Set();
  for (const run of formal) {
    const key = `${run.engine}:${run.repetition}`;
    if (keys.has(key)) return evidenceFailure('invalid', `Duplicate formal run: ${key}`);
    keys.add(key);
  }
  const expectedKeys = ['legacy:1', 'legacy:2', 'legacy:3', 'v2:1', 'v2:2', 'v2:3'];
  if (formal.some(run => ![1, 2, 3].includes(run.repetition)) || keys.size > expectedKeys.length) {
    return evidenceFailure('invalid', 'Formal cohort must contain only repetitions 1, 2, and 3 for each engine');
  }
  const contaminated = formal.filter(run => run.diagnosticTurnCount !== 0 || run.diagnosticCacheCreationTokens !== 0 ||
    run.totalCacheCreationTokens !== run.instructionTokens || run.formalTurnCount < 1);
  const missingKeys = expectedKeys.filter(key => !keys.has(key));
  if (missingKeys.length || contaminated.length) {
    return {
      status: 'incomplete', pass: false,
      reason: contaminated.length
        ? `${contaminated.length} formal run(s) contain diagnostic or invalid turn partitions and were excluded`
        : `Formal cohort is missing: ${missingKeys.join(', ')}`,
      formalRuns: formal.length,
      diagnosticRuns: diagnostics.length,
    };
  }
  const externallyUnavailable = formal.filter(run => run.quality === 'blocked' ||
    ['blocked', 'paused', 'incomplete'].includes(run.terminalStatus));
  if (externallyUnavailable.length) {
    return {
      status: 'incomplete', pass: false,
      reason: `${externallyUnavailable.length} formal run(s) are externally blocked or incomplete`,
      formalRuns: formal.length,
      diagnosticRuns: diagnostics.length,
    };
  }
  const qualityPass = formal.every(run => run.terminalStatus === 'completed' && run.quality === 'pass');
  const median = values => {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const byEngine = engine => formal.filter(run => run.engine === engine);
  const metricNames = ['deliveryCacheCreationTokens', 'assuranceCacheCreationTokens',
    'totalCacheCreationTokens', 'totalCacheReadTokens', 'outputTokens', 'providerListCost', 'elapsedMs',
    'agentCalls', 'requiredAgentCalls', 'duplicateAgentCalls', 'missingRequiredAgentCalls',
    'independentQaCalls', 'authoredDocumentCount', 'derivedDocumentCount', 'transientDraftCount',
    'authoredDocumentBytes', 'derivedDocumentBytes', 'duplicateCheckCount', 'contractRetryCount',
    'sameErrorRepeatCount', 'standaloneReviewProgressTurnCount'];
  const aggregateEngine = engine => Object.fromEntries(metricNames.map(name => [
    name, median(byEngine(engine).map(run => run[name])),
  ]));
  const aggregate = qualityPass ? {
    legacy: aggregateEngine('legacy'),
    v2: aggregateEngine('v2'),
  } : null;
  const v2Runs = byEngine('v2');
  const efficiencyChecks = aggregate ? [
    { id: 'EFF-01', pass: aggregate.v2.deliveryCacheCreationTokens <= aggregate.legacy.totalCacheCreationTokens * 1.1 },
    { id: 'EFF-02', pass: aggregate.v2.elapsedMs <= aggregate.legacy.elapsedMs * 1.1 },
    { id: 'EFF-03', pass: aggregate.v2.authoredDocumentCount <= aggregate.legacy.authoredDocumentCount &&
      aggregate.v2.authoredDocumentBytes <= aggregate.legacy.authoredDocumentBytes },
    { id: 'EFF-04', pass: v2Runs.every(run => run.agentPlanSatisfied && run.missingRequiredAgentCalls === 0 &&
      run.duplicateAgentCalls === 0 && (run.scale !== 'compact' || run.independentQaCalls === 1)) },
    { id: 'EFF-05', pass: v2Runs.every(run => run.duplicateCheckCount === 0) },
    { id: 'EFF-06', pass: v2Runs.every(run => run.transientDraftCount === 0) },
    { id: 'EFF-07', pass: aggregate.v2.contractRetryCount === 0 &&
      v2Runs.every(run => run.sameErrorRepeatCount === 0) },
    { id: 'EFF-08', pass: v2Runs.every(run => run.standaloneReviewProgressTurnCount === 0) },
  ] : [];
  const efficiencyPass = qualityPass && efficiencyChecks.every(check => check.pass);
  return {
    status: 'available',
    pass: qualityPass && efficiencyPass,
    completePairs: 3,
    eligiblePairs: qualityPass ? 3 : 0,
    hasTriple: true,
    qualityPass,
    efficiencyPass,
    efficiencyChecks,
    aggregate,
    diagnostics: {
      runs: diagnostics.length,
      totalCacheCreationTokens: diagnostics.reduce((total, run) => total + run.totalCacheCreationTokens, 0),
    },
  };
}

function buildShadowEvaluation(projectRoot, options = {}) {
  const fixture = loadScenarios(projectRoot);
  const scenarios = fixture.scenarios.map(item => evaluateScenario(projectRoot, item));
  const browser = options.browser || { verdict: 'unavailable', scenarios: [] };
  const live = evaluateLiveEvidence(options.liveEvidence, {
    evidenceRoot: options.evidenceRoot || projectRoot,
  });
  const checks = [
    { id: 'all-scenarios-covered', pass: scenarios.length === 11 },
    { id: 'deterministic-runtime-replay', pass: scenarios.every(item => item.replay.pass) },
    { id: 'real-browser-behavior', pass: browser.verdict === 'pass', status: browser.verdict },
    { id: 'live-host-comparison', pass: live.pass, status: live.status },
  ];
  const nonLiveChecks = checks.filter(check => check.id !== 'live-host-comparison');
  const definitiveFailure = nonLiveChecks.some(check => !check.pass && check.status !== 'blocked' && check.status !== 'unavailable') ||
    live.status === 'invalid' || (live.status === 'available' && !live.pass);
  const verdict = definitiveFailure ? 'fail' : live.pass && nonLiveChecks.every(check => check.pass) ? 'pass' : 'blocked';
  return {
    schemaVersion: '1.0',
    kind: 'v2-shadow-evaluation',
    methodology: {
      metricAccuracy: 'C',
      note: 'Repository instruction inventory is informational only. Live efficiency compares evidence-bound delivery compute; assurance and diagnostic compute remain visible with provider totals but are excluded from EFF-01.',
      browser: 'Actual Chrome/Chromium DOM behavior and screenshots.',
    },
    checks,
    scenarios,
    browser,
    live,
    verdict,
  };
}

module.exports = {
  loadScenarios,
  legacyReference,
  v2InstructionMetric,
  evaluateScenario,
  evaluateLiveEvidence,
  buildShadowEvaluation,
};
