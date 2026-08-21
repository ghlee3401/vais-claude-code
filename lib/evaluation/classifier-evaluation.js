'use strict';

const { classifyRequest } = require('../workflow/profile-classifier');
const { PROFILES } = require('./corpus');
const { toEvaluationPhaseGraph } = require('../workflow/workflow-compiler');

const ASSURANCE_RANK = { normal: 0, high: 1, regulated: 2 };

function emptyConfusionMatrix() {
  return Object.fromEntries(PROFILES.map(actual => [
    actual,
    Object.fromEntries(PROFILES.map(predicted => [predicted, 0])),
  ]));
}

function calculateMacroF1(confusionMatrix) {
  const byProfile = {};
  for (const profile of PROFILES) {
    const truePositive = confusionMatrix[profile][profile];
    const falsePositive = PROFILES
      .filter(actual => actual !== profile)
      .reduce((sum, actual) => sum + confusionMatrix[actual][profile], 0);
    const falseNegative = PROFILES
      .filter(predicted => predicted !== profile)
      .reduce((sum, predicted) => sum + confusionMatrix[profile][predicted], 0);
    const precision = truePositive + falsePositive === 0 ? 0 : truePositive / (truePositive + falsePositive);
    const recall = truePositive + falseNegative === 0 ? 0 : truePositive / (truePositive + falseNegative);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    byProfile[profile] = { precision, recall, f1, support: truePositive + falseNegative };
  }
  return {
    value: PROFILES.reduce((sum, profile) => sum + byProfile[profile].f1, 0) / PROFILES.length,
    byProfile,
  };
}

function evaluateClassificationCorpus(corpus, options = {}) {
  const split = options.split || 'held-out';
  const classifier = options.classifier || classifyRequest;
  const cases = (corpus.cases || []).filter(item => item.split === split);
  const confusionMatrix = emptyConfusionMatrix();
  const misses = [];
  const unsafeAssuranceMisses = [];
  const phaseGraphMisses = [];

  for (const item of cases) {
    const result = classifier(item.summary);
    confusionMatrix[item.profile][result.profile.selected] += 1;
    if (result.profile.selected !== item.profile) {
      misses.push({ id: item.id, expected: item.profile, actual: result.profile.selected });
    }
    if (ASSURANCE_RANK[result.assurance.level] < ASSURANCE_RANK[item.assurance]) {
      unsafeAssuranceMisses.push({ id: item.id, expected: item.assurance, actual: result.assurance.level });
    }
    const graph = toEvaluationPhaseGraph(result.phaseGraph);
    if (JSON.stringify(graph) !== JSON.stringify(item.expectedCompiledPhaseGraph)) {
      phaseGraphMisses.push({ id: item.id, expected: item.expectedCompiledPhaseGraph, actual: graph });
    }
  }

  const macroF1 = calculateMacroF1(confusionMatrix);
  return {
    split,
    total: cases.length,
    confusionMatrix,
    macroF1,
    misses,
    unsafeAssuranceMisses,
    phaseGraphMisses,
  };
}

function evaluateCriticalRiskCorpus(corpus, options = {}) {
  const classifier = options.classifier || classifyRequest;
  const unsafeAssuranceMisses = [];
  const triggerMisses = [];
  for (const item of corpus.cases || []) {
    const result = classifier(item.summary);
    if (ASSURANCE_RANK[result.assurance.level] < ASSURANCE_RANK[item.minimumAssurance]) {
      unsafeAssuranceMisses.push({
        id: item.id,
        category: item.category,
        expected: item.minimumAssurance,
        actual: result.assurance.level,
      });
    }
    if (!result.assurance.triggers.includes(item.requiredTrigger)) {
      triggerMisses.push({ id: item.id, category: item.category, triggers: result.assurance.triggers });
    }
  }
  return {
    total: (corpus.cases || []).length,
    unsafeAssuranceMisses,
    triggerMisses,
  };
}

function evaluatePhase1(corpora, options = {}) {
  const classification = evaluateClassificationCorpus(corpora.classification, options);
  const criticalRisk = evaluateCriticalRiskCorpus(corpora.criticalRisk, options);
  return {
    valid: classification.macroF1.value >= 0.85
      && classification.unsafeAssuranceMisses.length === 0
      && criticalRisk.unsafeAssuranceMisses.length === 0
      && criticalRisk.triggerMisses.length === 0,
    classification,
    criticalRisk,
  };
}

module.exports = {
  ASSURANCE_RANK,
  emptyConfusionMatrix,
  calculateMacroF1,
  evaluateClassificationCorpus,
  evaluateCriticalRiskCorpus,
  evaluatePhase1,
};
