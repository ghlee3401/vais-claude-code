'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const {
  CHECK_IDS,
  CRITICAL_CATEGORIES,
  RISK_TRIGGERS,
  compileExpectedPhaseGraph,
  loadEvaluationCorpora,
  summarizeClassificationCorpus,
  validateClassificationCorpus,
  validateCriticalRiskCorpus,
} = require('../lib/evaluation/corpus');
const { buildLegacyBaseline, validateLegacyBaseline } = require('../lib/evaluation/legacy-baseline');
const { parseArgs } = require('../scripts/workflow-evaluation');

const ROOT = path.join(__dirname, '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const compileSchema = relative => new Ajv({ allErrors: true, strict: false }).compile(readJson(relative));

function assertClassificationRejected(corpus, validateSchema, expectedRuntimeText) {
  const runtime = validateClassificationCorpus(corpus);
  assert.equal(runtime.valid, false);
  if (expectedRuntimeText) {
    assert.ok(runtime.errors.some(error => error.includes(expectedRuntimeText)), runtime.errors.join('\n'));
  }
  assert.equal(validateSchema(corpus), false);
}

function assertCriticalRejected(corpus, validateSchema, expectedRuntimeText) {
  const runtime = validateCriticalRiskCorpus(corpus);
  assert.equal(runtime.valid, false);
  if (expectedRuntimeText) {
    assert.ok(runtime.errors.some(error => error.includes(expectedRuntimeText)), runtime.errors.join('\n'));
  }
  assert.equal(validateSchema(corpus), false);
}

describe('Phase 0B evaluation corpus', () => {
  const corpora = loadEvaluationCorpora(ROOT);
  const validateClassificationSchema = compileSchema('schemas/evaluation-corpus.schema.json');
  const validateCriticalSchema = compileSchema('schemas/critical-risk-corpus.schema.json');

  it('profile별 최소 15개와 고정 split을 가진 49개 label fixture가 유효하다', () => {
    const result = validateClassificationCorpus(corpora.classification);
    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
    assert.deepEqual(result.counts, { patch: 18, feature: 15, initiative: 16 });

    const summary = summarizeClassificationCorpus(corpora.classification);
    assert.equal(summary.total, 49);
    assert.deepEqual(summary.bySplit, { train: 27, review: 9, 'held-out': 13 });
    assert.equal(corpora.classification.splitPolicy.heldOutImmutableBeforeClassifier, true);
    assert.equal(
      corpora.classification.splitPolicy.heldOutIdsHash,
      '10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb',
    );
  });

  it('held-out ID 목록 변경을 hash 불일치로 거부한다', () => {
    const tampered = structuredClone(corpora.classification);
    tampered.cases.find(item => item.split === 'held-out').split = 'review';
    const result = validateClassificationCorpus(tampered);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes('heldOutIdsHash')));
  });

  it('profile과 assurance가 독립적으로 label되어 있다', () => {
    const summary = summarizeClassificationCorpus(corpora.classification);
    assert.ok(corpora.classification.cases.some(item => item.profile === 'patch' && item.assurance === 'regulated'));
    assert.ok(corpora.classification.cases.some(item => item.profile === 'initiative' && item.assurance === 'normal'));
    assert.ok(corpora.classification.cases.some(item => item.profile === 'feature' && item.assurance === 'high'));
    assert.equal(summary.byRecommendation.unknown, 1);
  });

  it('case별 compile signal에서 expected phase graph를 다시 계산할 수 있다', () => {
    for (const item of corpora.classification.cases) {
      assert.deepEqual(
        item.expectedCompiledPhaseGraph,
        compileExpectedPhaseGraph(item.profile, item.compileSignals),
        item.id,
      );
    }

    const featureGraphs = corpora.classification.cases
      .filter(item => item.profile === 'feature')
      .map(item => item.expectedCompiledPhaseGraph);
    assert.ok(featureGraphs.some(graph => graph.required.includes('design')));
    assert.ok(featureGraphs.some(graph => graph.conditional.includes('design')));

    for (const item of corpora.classification.cases.filter(item => item.profile === 'initiative')) {
      if (!item.compileSignals.ceoAnalysisAvailable) {
        assert.ok(item.expectedCompiledPhaseGraph.required.includes('ideation'), item.id);
      }
    }
  });

  it('한국어, unknown, adversarial normal, patch regulated 현실성 표본을 가진다', () => {
    assert.ok(corpora.classification.cases.filter(item => /[가-힣]/.test(item.summary)).length >= 10);
    assert.ok(corpora.classification.cases.some(item => item.profileRecommendation === 'unknown'));
    assert.ok(corpora.classification.cases.some(item => item.profile === 'patch' && item.assurance === 'regulated'));
    assert.ok(corpora.classification.cases.some(item =>
      item.assurance === 'normal' && /password|payment/i.test(item.summary)));
  });

  it('raw prompt를 저장하지 않고 외부 reviewer 상태를 명시한다', () => {
    const serialized = JSON.stringify(corpora.classification);
    assert.doesNotMatch(serialized, /rawPrompt|rawText/);
    for (const item of corpora.classification.cases) {
      assert.equal(item.review.status, 'pending-external');
      assert.ok(item.review.labeler);
    }
  });

  it('canonical taxonomy가 corpus와 Phase 0A schema 전체에서 동일하다', () => {
    const taxonomy = readJson('contracts/workflow-taxonomy.json');
    const triggers = taxonomy.riskTriggers.map(item => item.id);
    const checks = taxonomy.checks.map(item => item.id);
    const classificationSchema = readJson('schemas/evaluation-corpus.schema.json');
    const riskSchema = readJson('schemas/critical-risk-corpus.schema.json');
    const previewSchema = readJson('schemas/execution-preview.schema.json');
    const envelopeSchema = readJson('schemas/task-envelope.schema.json');

    assert.deepEqual(RISK_TRIGGERS, triggers);
    assert.deepEqual(CHECK_IDS, checks);
    assert.deepEqual(classificationSchema.properties.cases.items.properties.riskTriggers.items.enum, triggers);
    assert.deepEqual(classificationSchema.properties.cases.items.properties.expectedChecks.items.enum, checks);
    assert.deepEqual(riskSchema.properties.cases.items.properties.requiredTrigger.enum, triggers);
    assert.deepEqual(riskSchema.properties.cases.items.properties.requiredChecks.items.enum, checks);
    assert.deepEqual(previewSchema.properties.assurance.properties.triggers.items.enum, triggers);
    assert.deepEqual(previewSchema.properties.checks.items.properties.id.enum, checks);
    assert.deepEqual(envelopeSchema.properties.assurance.properties.triggers.items.enum, triggers);
    assert.deepEqual(envelopeSchema.properties.checks.properties.required.items.enum, checks);
  });

  it('두 corpus fixture가 강화된 Ajv schema를 통과한다', () => {
    assert.equal(validateClassificationSchema(corpora.classification), true,
      JSON.stringify(validateClassificationSchema.errors));
    assert.equal(validateCriticalSchema(corpora.criticalRisk), true,
      JSON.stringify(validateCriticalSchema.errors));
  });

  it('잘못된 phase graph와 profile promotion 누락을 runtime과 schema가 거부한다', () => {
    const graph = structuredClone(corpora.classification);
    graph.cases[0].expectedCompiledPhaseGraph = {
      required: [],
      conditional: [],
      notRequired: ['ideation', 'plan', 'design', 'do', 'qa', 'report'],
    };
    assertClassificationRejected(graph, validateClassificationSchema, 'does not match compile signals');

    const promotion = structuredClone(corpora.classification);
    const patch = promotion.cases.find(item => item.profile === 'patch');
    patch.compileSignals.dataModel = true;
    assertClassificationRejected(promotion, validateClassificationSchema, 'patch must be promoted');
  });

  it('trigger 오타와 assurance-trigger 불일치를 runtime과 schema가 거부한다', () => {
    const typo = structuredClone(corpora.classification);
    typo.cases[0].assurance = 'high';
    typo.cases[0].riskTriggers = ['autth'];
    assertClassificationRejected(typo, validateClassificationSchema, 'unknown trigger');

    const missing = structuredClone(corpora.classification);
    const high = missing.cases.find(item => item.assurance === 'high');
    high.riskTriggers = [];
    assertClassificationRejected(missing, validateClassificationSchema, 'elevated assurance');

    const regulated = structuredClone(corpora.classification);
    const regulatedCase = regulated.cases.find(item => item.assurance === 'regulated');
    regulatedCase.riskTriggers = ['auth'];
    assertClassificationRejected(regulated, validateClassificationSchema, 'regulated assurance requires');
  });

  it('fixture summary의 secret과 PII를 runtime과 schema가 거부한다', () => {
    const secret = structuredClone(corpora.classification);
    secret.cases[0].summary = 'Use key AKIA1234567890ABCDEF and owner@example.com in test';
    assertClassificationRejected(secret, validateClassificationSchema, 'contains sensitive text');
  });

  it('critical-risk corpus가 13개 category를 각 2건씩 포함한다', () => {
    const result = validateCriticalRiskCorpus(corpora.criticalRisk);
    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.deepEqual(result.categories, [...CRITICAL_CATEGORIES].sort());
    assert.equal(corpora.criticalRisk.cases.length, 26);
    for (const category of CRITICAL_CATEGORIES) assert.equal(result.categoryCounts[category], 2);
    for (const item of corpora.criticalRisk.cases) {
      assert.notEqual(item.minimumAssurance, 'normal');
      assert.equal(item.requiresSecurityDialogue, true);
      assert.equal(item.split, 'held-out');
    }
  });

  it('critical category-trigger-assurance 불일치와 category 축소를 거부한다', () => {
    const triggerMismatch = structuredClone(corpora.criticalRisk);
    const pii = triggerMismatch.cases.find(item => item.category === 'pii');
    pii.requiredTrigger = 'auth';
    assertCriticalRejected(triggerMismatch, validateCriticalSchema, 'must match category');

    const assuranceMismatch = structuredClone(corpora.criticalRisk);
    const regulated = assuranceMismatch.cases.find(item => item.category === 'regulated');
    regulated.minimumAssurance = 'high';
    assertCriticalRejected(assuranceMismatch, validateCriticalSchema, 'does not match category policy');

    const reduced = structuredClone(corpora.criticalRisk);
    const removeIndex = reduced.cases.findIndex(item => item.category === 'secret');
    reduced.cases.splice(removeIndex, 1);
    assertCriticalRejected(reduced, validateCriticalSchema, 'requires at least two cases');
  });

  it('corpus schema가 fixture 종류와 최소 수량을 고정한다', () => {
    const classificationSchema = readJson('schemas/evaluation-corpus.schema.json');
    const riskSchema = readJson('schemas/critical-risk-corpus.schema.json');
    assert.equal(classificationSchema.properties.cases.minItems, 45);
    assert.equal(riskSchema.properties.cases.minItems, 26);
    assert.equal(riskSchema.properties.cases.items.properties.requiresSecurityDialogue.const, true);
  });
});

describe('Phase 0B legacy baseline', () => {
  const validateBaselineSchema = compileSchema('schemas/legacy-baseline.schema.json');

  it('세 대표 scenario를 각각 두 번 동일 inventory로 측정한다', () => {
    const report = buildLegacyBaseline(ROOT, { repetitions: 2 });
    const validation = validateLegacyBaseline(report);
    assert.equal(validation.valid, true, validation.errors.join('\n'));
    assert.equal(report.scenarios.length, 3);
    assert.ok(report.scenarios.every(scenario =>
      scenario.samples.filter(sample => sample.mode === 'repository-replay').length === 2));
    assert.equal(new Set(report.scenarios.flatMap(scenario => scenario.samples.map(sample => sample.runId))).size, 6);
    for (const scenario of report.scenarios) {
      assert.equal(scenario.samples[0].metrics.fixedContext.totalBytes,
        scenario.samples[1].metrics.fixedContext.totalBytes);
      assert.equal(scenario.samples[0].metrics.artifactTemplates.totalBytes,
        scenario.samples[1].metrics.artifactTemplates.totalBytes);
    }
  });

  it('inventory 선정 규칙과 빠졌던 shared/config/design agent를 명시한다', () => {
    const report = buildLegacyBaseline(ROOT, { repetitions: 2 });
    assert.equal(
      report.methodology.inventorySelectionRule.id,
      'declared-entrypoint-and-mandatory-reference-v1',
    );
    const patch = report.scenarios.find(scenario => scenario.id === 'legacy-patch-normal');
    const paths = patch.samples[0].metrics.fixedContext.files.map(file => file.path);
    for (const required of [
      'agents/_shared/context-loading.md',
      'agents/_shared/clevel-main-guard.md',
      'agents/_shared/work-rules.md',
      'agents/_shared/subdoc-guard.md',
      'agents/_shared/checkpoint-policy.md',
      'agents/cto/ui-designer.md',
      'agents/cto/infra-architect.md',
      'output-styles/vais-default.md',
      'vais.config.json',
    ]) assert.ok(paths.includes(required), required);
  });

  it('모든 repository proxy가 출처와 C등급을 가지며 파일 누락이 없다', () => {
    const report = buildLegacyBaseline(ROOT, { repetitions: 2 });
    for (const sample of report.scenarios.flatMap(scenario => scenario.samples)) {
      assert.equal(sample.metrics.fixedContext.accuracy, 'C');
      assert.equal(sample.metrics.fixedContext.source, 'repository-files');
      assert.equal(sample.metrics.fixedContext.aggregation, 'unique-file-inventory');
      assert.match(sample.metrics.fixedContext.limitation, /lower bound/);
      assert.ok(sample.metrics.fixedContext.totalBytes > 0);
      assert.ok(sample.metrics.artifactTemplates.totalBytes > 0);
      assert.ok(sample.metrics.fixedContext.files.every(file => !file.missing));
    }
  });

  it('offline replay가 actual metric과 품질 결과를 위장하지 않는다', () => {
    const report = buildLegacyBaseline(ROOT, { repetitions: 2 });
    assert.equal(report.methodology.liveHostRuns.status, 'pending-external-host');
    for (const sample of report.scenarios.flatMap(scenario => scenario.samples)) {
      assert.equal(sample.quality.status, 'unavailable');
      assert.ok(sample.quality.reason);
      assert.equal(sample.metrics.providerTokens.accuracy, 'A');
      assert.equal(sample.metrics.providerTokens.status, 'unavailable');
      assert.equal(sample.metrics.hostTokens.accuracy, 'B');
      assert.equal(sample.metrics.hostTokens.status, 'unavailable');
    }
  });

  it('captured host metric과 quality를 같은 runId sample에 기록한다', () => {
    const report = buildLegacyBaseline(ROOT, { repetitions: 2 });
    const live = structuredClone(report.scenarios[0].samples[0]);
    const capturedAt = '2026-08-20T00:00:00.000Z';
    live.runId = 'phase0b-live-patch-normal-01';
    live.mode = 'live-host';
    live.quality = {
      status: 'captured',
      capturedAt,
      checks: [{ command: 'npm test', status: 'passed', exitCode: 0, durationMs: 1200 }],
    };
    live.metrics.hostApprovals = {
      source: 'host', accuracy: 'B', status: 'captured', value: 1, unit: 'count', capturedAt,
    };
    live.metrics.workflowElapsedMs = {
      source: 'host', accuracy: 'B', status: 'captured', value: 4200, unit: 'milliseconds', capturedAt,
    };
    report.scenarios[0].samples.push(live);
    report.methodology.liveHostRuns.captured = 1;

    const runtime = validateLegacyBaseline(report);
    assert.equal(runtime.valid, true, runtime.errors.join('\n'));
    assert.equal(validateBaselineSchema(report), true, JSON.stringify(validateBaselineSchema.errors));

    report.methodology.liveHostRuns.captured = 2;
    const mismatched = validateLegacyBaseline(report);
    assert.equal(mismatched.valid, false);
    assert.ok(mismatched.errors.some(error => error.includes('number of live-host samples')));
  });

  it('snapshot이 manifest로 dirty 상태를 정직하게 고정하고 clean claim 위장을 거부한다', () => {
    const snapshot = readJson('tests/fixtures/legacy-baseline.json');
    const validation = validateLegacyBaseline(snapshot);
    assert.equal(validation.valid, true, validation.errors.join('\n'));
    assert.equal(validateBaselineSchema(snapshot), true, JSON.stringify(validateBaselineSchema.errors));
    assert.equal(snapshot.repository.captureMode, 'working-tree-manifest');
    assert.equal(snapshot.repository.dirty, true);
    assert.match(snapshot.repository.scopeDigest, /^[a-f0-9]{64}$/);
    assert.ok(snapshot.repository.scopeFiles.length > 0);

    const falseClean = structuredClone(snapshot);
    falseClean.repository.captureMode = 'clean-commit';
    assert.equal(validateLegacyBaseline(falseClean).valid, false);
    assert.equal(validateBaselineSchema(falseClean), false);
  });

  it('필수 metric 누락과 actual 위장을 runtime 및 schema가 거부한다', () => {
    const malformed = structuredClone(readJson('tests/fixtures/legacy-baseline.json'));
    const metrics = malformed.scenarios[0].samples[0].metrics;
    delete metrics.fixedContext.limitation;
    metrics.providerTokens.status = 'available';
    delete metrics.providerTokens.reason;
    const runtime = validateLegacyBaseline(malformed);
    assert.equal(runtime.valid, false);
    assert.ok(runtime.errors.some(error => error.includes('fixedContext.limitation')));
    assert.ok(runtime.errors.some(error => error.includes('providerTokens.status')));
    assert.equal(validateBaselineSchema(malformed), false);
  });

  it('CLI 인자를 validate/baseline과 output으로 분리한다', () => {
    assert.deepEqual(parseArgs([]), { command: 'validate', output: null });
    assert.deepEqual(parseArgs(['baseline', '--output', 'result.json']), {
      command: 'baseline',
      output: 'result.json',
    });
  });
});
