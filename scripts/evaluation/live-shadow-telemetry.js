'use strict';

const DIAGNOSTIC_KINDS = new Set([
  'quota-recovery',
  'router-attack',
  'conditional-approval',
  'provider-retry',
]);

function assertTurn(turn, index) {
  if (!turn || !['formal', 'diagnostic'].includes(turn.sampleClass)) {
    throw new Error(`Turn ${index} must declare sampleClass formal or diagnostic`);
  }
  if (!Number.isInteger(turn.totalCacheCreationTokens) || turn.totalCacheCreationTokens < 0) {
    throw new Error(`Turn ${index} has invalid totalCacheCreationTokens`);
  }
  if (!Number.isInteger(turn.totalCacheReadTokens) || turn.totalCacheReadTokens < 0 ||
    !Number.isInteger(turn.outputTokens) || turn.outputTokens < 0 ||
    !Number.isInteger(turn.elapsedMs) || turn.elapsedMs < 0 ||
    typeof turn.providerListCost !== 'number' || turn.providerListCost < 0) {
    throw new Error(`Turn ${index} has invalid observed provider metrics`);
  }
  if (!['delivery', 'assurance', 'diagnostic'].includes(turn.computeClass)) {
    throw new Error(`Turn ${index} must declare computeClass delivery, assurance, or diagnostic`);
  }
  if ((turn.sampleClass === 'diagnostic') !== (turn.computeClass === 'diagnostic')) {
    throw new Error(`Turn ${index} sampleClass and computeClass disagree`);
  }
  if (turn.sampleClass === 'formal') {
    const assuranceRole = ['independent-qa', 'review-owner'].includes(turn.role);
    if (assuranceRole !== (turn.computeClass === 'assurance')) {
      throw new Error(`Turn ${index} role and computeClass disagree`);
    }
  }
  if (turn.sampleClass === 'formal' && turn.diagnosticKind) {
    throw new Error(`Formal turn ${index} cannot declare diagnosticKind`);
  }
  if (turn.sampleClass === 'diagnostic' && !DIAGNOSTIC_KINDS.has(turn.diagnosticKind)) {
    throw new Error(`Diagnostic turn ${index} has an unsupported diagnosticKind`);
  }
}

function partitionShadowTurns(turns) {
  if (!Array.isArray(turns)) throw new Error('Shadow turns must be an array');
  const formalTurns = [];
  const diagnosticTurns = [];
  let totalCacheCreationTokens = 0;
  let totalCacheReadTokens = 0;
  let outputTokens = 0;
  let elapsedMs = 0;
  let providerListCost = 0;
  turns.forEach((turn, index) => {
    assertTurn(turn, index);
    totalCacheCreationTokens += turn.totalCacheCreationTokens;
    totalCacheReadTokens += turn.totalCacheReadTokens;
    outputTokens += turn.outputTokens;
    elapsedMs += turn.elapsedMs;
    providerListCost += turn.providerListCost;
    if (turn.sampleClass === 'formal') formalTurns.push(turn);
    else diagnosticTurns.push(turn);
  });
  const cacheCreationTokens = values => values.reduce(
    (total, turn) => total + turn.totalCacheCreationTokens, 0);
  return {
    formalTurns,
    diagnosticTurns,
    formalCacheCreationTokens: cacheCreationTokens(formalTurns),
    deliveryCacheCreationTokens: cacheCreationTokens(formalTurns.filter(turn => turn.computeClass === 'delivery')),
    assuranceCacheCreationTokens: cacheCreationTokens(formalTurns.filter(turn => turn.computeClass === 'assurance')),
    diagnosticCacheCreationTokens: cacheCreationTokens(diagnosticTurns),
    totalCacheCreationTokens,
    totalCacheReadTokens,
    outputTokens,
    elapsedMs,
    providerListCost: Number(providerListCost.toFixed(8)),
  };
}

function summarizeFormalJourney(input) {
  const partition = partitionShadowTurns(input.turns);
  if (partition.formalTurns.length === 0) {
    throw new Error('A formal journey requires at least one formal turn');
  }
  const journeyIds = new Set(partition.formalTurns.map(turn => turn.journeyId).filter(Boolean));
  if (journeyIds.size > 1) throw new Error('Formal turns belong to multiple journeys');
  return {
    scenario: input.scenario,
    repetition: input.repetition,
    engine: input.engine,
    journeyId: [...journeyIds][0] || null,
    instructionTokens: partition.formalCacheCreationTokens,
    deliveryCacheCreationTokens: partition.deliveryCacheCreationTokens,
    assuranceCacheCreationTokens: partition.assuranceCacheCreationTokens,
    totalCacheCreationTokens: partition.totalCacheCreationTokens,
    totalCacheReadTokens: partition.totalCacheReadTokens,
    outputTokens: partition.outputTokens,
    elapsedMs: partition.elapsedMs,
    providerListCost: partition.providerListCost,
    diagnosticCacheCreationTokens: partition.diagnosticCacheCreationTokens,
    formalTurnCount: partition.formalTurns.length,
    diagnosticTurnCount: partition.diagnosticTurns.length,
    eligible: partition.diagnosticTurns.length === 0,
    contaminationReason: partition.diagnosticTurns.length === 0
      ? null
      : 'Formal journey contains diagnostic turns and must be excluded from the formal cohort',
    diagnostics: partition.diagnosticTurns.map(turn => ({
      diagnosticKind: turn.diagnosticKind,
      totalCacheCreationTokens: turn.totalCacheCreationTokens,
      telemetryDigest: turn.telemetryDigest || null,
    })),
  };
}

module.exports = {
  DIAGNOSTIC_KINDS,
  partitionShadowTurns,
  summarizeFormalJourney,
};
