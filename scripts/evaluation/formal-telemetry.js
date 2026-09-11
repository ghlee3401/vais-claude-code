'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { splitProviderUsage } = require('./live-claude-turn');

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sameUsage(left, right) {
  return ['totalCacheCreationTokens', 'totalCacheReadTokens', 'outputTokens']
    .every(field => left?.[field] === right?.[field]);
}

function subtractUsage(total, removed) {
  const fields = ['totalCacheCreationTokens', 'totalCacheReadTokens', 'outputTokens'];
  const result = Object.fromEntries(fields.map(key => [key, total[key] - removed[key]]));
  if (Object.values(result).some(value => !Number.isInteger(value) || value < 0)) {
    throw new Error('Agent-attributed provider usage cannot be subtracted from the aggregate');
  }
  return result;
}

function attributedSplit(parsed, assignments, qa) {
  const provider = splitProviderUsage(parsed);
  const segments = parsed.evaluationMetadata?.agentSegments;
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('Combined Agent telemetry requires transcript-attributed agentSegments');
  }
  const calls = assignments || [];
  const byAssignment = new Map();
  for (const segment of segments) {
    if (!segment?.assignmentId || !segment.role || !segment.agentId || segment.status !== 'completed' ||
      !segment.usage || byAssignment.has(segment.assignmentId)) {
      throw new Error('Agent telemetry segment is malformed or duplicated');
    }
    byAssignment.set(segment.assignmentId, segment);
  }
  if (calls.length !== segments.length || calls.some(call =>
    call.status !== 'completed' || byAssignment.get(call.assignmentId)?.role !== call.role)) {
    throw new Error('Agent telemetry segments do not match the completed assignment manifest');
  }
  const child = segments.reduce((total, segment) => ({
    totalCacheCreationTokens: total.totalCacheCreationTokens + segment.usage.totalCacheCreationTokens,
    totalCacheReadTokens: total.totalCacheReadTokens + segment.usage.totalCacheReadTokens,
    outputTokens: total.outputTokens + segment.usage.outputTokens,
  }), { totalCacheCreationTokens: 0, totalCacheReadTokens: 0, outputTokens: 0 });
  if (child.totalCacheCreationTokens !== provider.assurance.totalCacheCreationTokens ||
    child.totalCacheReadTokens !== provider.assurance.totalCacheReadTokens ||
    child.outputTokens > provider.assurance.outputTokens) {
    throw new Error('Agent transcript usage does not reconcile with the provider remainder');
  }
  const qaSegment = byAssignment.get(qa.assignmentId);
  if (!qaSegment || qaSegment.role !== qa.role) {
    throw new Error('Independent QA assignment has no transcript-attributed provider usage');
  }
  const assurance = qaSegment.usage;
  const delivery = subtractUsage(provider.total, assurance);
  return { provider, delivery, assurance, qaSegment };
}

function buildFormalTelemetryEvidence(outputDir, input) {
  const root = path.resolve(outputDir);
  const rawPaths = input.rawPaths || [];
  if (rawPaths.length === 0) throw new Error('Formal telemetry requires provider captures');
  const qa = input.qaAssignment || null;
  if (qa && (qa.role !== 'independent-qa' || typeof qa.assignmentId !== 'string')) {
    throw new Error('Formal telemetry QA assignment is malformed');
  }
  let assuranceCaptureCount = 0;
  const assuranceTarget = input.assuranceRawPath ? path.resolve(input.assuranceRawPath) :
    (rawPaths.length === 1 ? path.resolve(rawPaths[0]) : null);
  const turns = [];
  const totals = {
    deliveryCacheCreationTokens: 0, assuranceCacheCreationTokens: 0,
    totalCacheCreationTokens: 0, totalCacheReadTokens: 0, outputTokens: 0,
    elapsedMs: 0, providerListCost: 0,
  };
  for (const rawPath of rawPaths) {
    const target = path.resolve(rawPath);
    if (!target.startsWith(`${root}${path.sep}`) || fs.lstatSync(target).isSymbolicLink()) {
      throw new Error('Provider capture must be a regular file inside the evidence output');
    }
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    const split = splitProviderUsage(parsed);
    const assuranceEligible = target === assuranceTarget;
    const attributed = assuranceEligible && qa && (input.agentAssignments || []).length > 1
      ? attributedSplit(parsed, input.agentAssignments, qa) : null;
    const assurancePresent = assuranceEligible && (attributed
      ? attributed.assurance.totalCacheCreationTokens > 0
      : Object.values(split.assurance).some(value => value > 0));
    if (assurancePresent) assuranceCaptureCount += 1;
    const runKey = `${input.engine}:${input.repetition}`;
    const common = { cohortId: input.cohort.id, runKey, sampleClass: 'formal' };
    const deliverySource = attributed ? 'delivery-composite' : assuranceEligible ? 'outer' : 'aggregate';
    const deliveryUsage = attributed ? attributed.delivery :
      assuranceEligible ? split.delivery : split.total;
    const segments = [{ ...common, usageSource: deliverySource, computeClass: 'delivery',
      role: 'workflow-owner', assignmentId: null,
      ...(attributed ? { usage: deliveryUsage } : {}) }];
    if (assurancePresent) {
      if (!qa) throw new Error('Assurance provider usage requires an independent QA assignment');
      const assuranceSource = attributed ? 'agent' : 'remainder';
      const assuranceUsage = attributed ? attributed.assurance : split.assurance;
      segments.push({ ...common, usageSource: assuranceSource, computeClass: 'assurance',
        role: qa.role, assignmentId: qa.assignmentId,
        ...(attributed ? { agentId: attributed.qaSegment.agentId, usage: assuranceUsage } : {}) });
    }
    const captured = { ...parsed, evaluationMetadata: {
      ...(parsed.evaluationMetadata || {}), segments,
    } };
    const body = `${JSON.stringify(captured, null, 2)}\n`;
    fs.writeFileSync(target, body, 'utf8');
    const reference = { path: path.relative(root, target).split(path.sep).join('/'), digest: digest(body) };
    const elapsedMs = Number(parsed.duration_ms);
    const providerListCost = Number(parsed.total_cost_usd);
    if (!Number.isInteger(elapsedMs) || elapsedMs < 0 || !Number.isFinite(providerListCost) || providerListCost < 0) {
      throw new Error('Provider capture has invalid elapsed or cost telemetry');
    }
    turns.push({ ...reference, sampleClass: 'formal', usageSource: deliverySource, computeClass: 'delivery',
      role: 'workflow-owner', elapsedMs, providerListCost });
    if (assurancePresent) turns.push({ ...reference, sampleClass: 'formal',
      usageSource: attributed ? 'agent' : 'remainder', computeClass: 'assurance', role: qa.role,
      assignmentId: qa.assignmentId, elapsedMs, providerListCost });
    totals.deliveryCacheCreationTokens += deliveryUsage.totalCacheCreationTokens;
    totals.assuranceCacheCreationTokens += assurancePresent
      ? (attributed ? attributed.assurance : split.assurance).totalCacheCreationTokens : 0;
    totals.totalCacheCreationTokens += split.total.totalCacheCreationTokens;
    totals.totalCacheReadTokens += split.total.totalCacheReadTokens;
    totals.outputTokens += split.total.outputTokens;
    totals.elapsedMs += elapsedMs;
    totals.providerListCost += providerListCost;
  }
  if ((qa && assuranceCaptureCount !== 1) || (!qa && assuranceCaptureCount !== 0)) {
    throw new Error(`Compact formal telemetry requires exactly one assurance-bearing QA capture; found ${assuranceCaptureCount}`);
  }
  totals.providerListCost = Number(totals.providerListCost.toFixed(8));
  const telemetry = {
    cohortId: input.cohort.id, runKey: `${input.engine}:${input.repetition}`,
    stageDigest: input.cohort.stage.digest, model: input.cohort.model, effort: input.cohort.effort,
    toolProfileDigest: input.cohort.toolProfile.digest, sampleClass: 'formal',
    instructionTokens: totals.deliveryCacheCreationTokens + totals.assuranceCacheCreationTokens,
    ...totals, diagnosticCacheCreationTokens: 0, formalTurnCount: rawPaths.length,
    diagnosticTurnCount: 0, turns,
  };
  if (telemetry.instructionTokens !== telemetry.totalCacheCreationTokens) {
    throw new Error('Delivery and assurance usage do not reconcile with provider cache creation total');
  }
  const body = `${JSON.stringify(telemetry, null, 2)}\n`;
  const target = path.join(root, `raw-telemetry-${input.engine}-${input.repetition}.json`);
  fs.writeFileSync(target, body, 'utf8');
  return { telemetry, reference: { path: path.basename(target), digest: digest(body) } };
}

module.exports = {
  sameUsage,
  subtractUsage,
  attributedSplit,
  buildFormalTelemetryEvidence,
};
