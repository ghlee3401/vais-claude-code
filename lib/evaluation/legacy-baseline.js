'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { measureFiles } = require('../context-metrics');

const COMMON_CONTEXT = [
  'CLAUDE.md',
  'skills/vais/SKILL.md',
  'skills/vais/phases/cto.md',
  'agents/cto/cto.md',
  'contracts/workflow-contract.md',
  'agents/_shared/context-loading.md',
  'agents/_shared/clevel-main-guard.md',
  'agents/_shared/work-rules.md',
  'agents/_shared/subdoc-guard.md',
  'agents/_shared/checkpoint-policy.md',
  'agents/_shared/outro-format.md',
  'vais.config.json',
  'output-styles/vais-default.md',
];

const CTO_EXECUTION_CONTEXT = [
  'agents/cto/ui-designer.md',
  'agents/cto/infra-architect.md',
  'agents/cto/frontend-engineer.md',
  'agents/cto/backend-engineer.md',
  'agents/cto/test-engineer.md',
  'agents/cto/qa-engineer.md',
];

const INVENTORY_SELECTION_RULE = {
  id: 'declared-entrypoint-and-mandatory-reference-v1',
  description: 'Include the host entrypoint, selected phase router and C-Level agent, mandatory shared guards/config/output style, delegated execution agents, and phase artifact templates.',
  includedClasses: [
    'host-entrypoint',
    'selected-phase-router',
    'selected-c-level-agent',
    'mandatory-shared-guard',
    'host-config-and-output-style',
    'delegated-execution-agent',
    'phase-artifact-template',
  ],
  excludedClasses: [
    'conditional-knowledge-not-activated-by-scenario',
    'unrelated-c-level-and-execution-agent',
    'historical-feature-document',
    'generated-artifact-output',
  ],
};

const SCENARIOS = [
  {
    id: 'legacy-patch-normal',
    targetProfile: 'patch',
    targetAssurance: 'normal',
    phases: ['plan', 'design', 'do', 'qa', 'report'],
    contextFiles: CTO_EXECUTION_CONTEXT,
    templateFiles: [
      'templates/plan-minimal.template.md', 'templates/design.template.md', 'templates/do.template.md',
      'templates/qa.template.md', 'templates/report.template.md', 'templates/main-md.template.md',
    ],
    expectedAgents: 7,
    workflowApprovals: { minimum: 1, maximum: 2 },
  },
  {
    id: 'legacy-feature-normal',
    targetProfile: 'feature',
    targetAssurance: 'normal',
    phases: ['plan', 'design', 'do', 'qa', 'report'],
    contextFiles: CTO_EXECUTION_CONTEXT,
    templateFiles: [
      'templates/plan-standard.template.md', 'templates/design.template.md', 'templates/do.template.md',
      'templates/qa.template.md', 'templates/report.template.md', 'templates/main-md.template.md',
    ],
    expectedAgents: 7,
    workflowApprovals: { minimum: 1, maximum: 2 },
  },
  {
    id: 'legacy-feature-high',
    targetProfile: 'feature',
    targetAssurance: 'high',
    phases: ['plan', 'design', 'do', 'qa', 'report'],
    contextFiles: [
      ...CTO_EXECUTION_CONTEXT,
      'agents/cso/cso.md',
      'agents/cso/security-auditor.md',
      'agents/cso/secret-scanner.md',
      'agents/cso/dependency-analyzer.md',
    ],
    templateFiles: [
      'templates/plan-extended.template.md', 'templates/design.template.md', 'templates/do.template.md',
      'templates/qa.template.md', 'templates/report.template.md', 'templates/main-md.template.md',
      'templates/how/security-audit-report.md',
    ],
    expectedAgents: 11,
    workflowApprovals: { minimum: 2, maximum: 4 },
  },
];

function gitValue(args, baseDir) {
  try {
    return execFileSync('git', args, { cwd: baseDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return null;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function inventoryPaths() {
  return [...new Set(SCENARIOS.flatMap(scenario => [
    ...COMMON_CONTEXT,
    ...scenario.contextFiles,
    ...scenario.templateFiles,
  ]))].sort();
}

function buildScopeManifest(baseDir) {
  const files = inventoryPaths().map(relativePath => {
    const content = fs.readFileSync(path.join(baseDir, relativePath));
    return { path: relativePath, sha256: sha256(content) };
  });
  const digestInput = files.map(file => file.path + '\0' + file.sha256).join('\n');
  return { files, digest: sha256(digestInput) };
}

function unavailableMetric(source, accuracy, reason) {
  return { source, accuracy, status: 'unavailable', reason };
}

function buildSample(scenario, repetition, baseDir) {
  const started = process.hrtime.bigint();
  const fixedContext = measureFiles([...COMMON_CONTEXT, ...scenario.contextFiles], baseDir);
  const artifactTemplates = measureFiles(scenario.templateFiles, baseDir);
  const measurementElapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return {
    runId: 'phase0b-' + scenario.id + '-' + String(repetition).padStart(2, '0'),
    repetition,
    mode: 'repository-replay',
    quality: {
      status: 'unavailable',
      reason: 'repository inventory replay does not execute scenario quality commands',
    },
    metrics: {
      fixedContext: {
        source: 'repository-files',
        accuracy: 'C',
        aggregation: 'unique-file-inventory',
        limitation: 'lower bound; repeated reads across phases and agents are not multiplied',
        ...fixedContext,
      },
      artifactTemplates: {
        source: 'repository-files',
        accuracy: 'C',
        aggregation: 'unique-file-inventory',
        limitation: 'template bytes are an inventory proxy, not generated artifact output bytes',
        ...artifactTemplates,
      },
      agentCount: { source: 'legacy-policy-proxy', accuracy: 'C', value: scenario.expectedAgents },
      workflowApprovals: { source: 'legacy-policy-range', accuracy: 'C', ...scenario.workflowApprovals },
      hostApprovals: unavailableMetric('host', 'B', 'offline replay has no host permission stream'),
      providerTokens: unavailableMetric('provider', 'A', 'provider usage is not exposed to repository replay'),
      hostTokens: unavailableMetric('host', 'B', 'legacy event log has no correlated token usage'),
      workflowElapsedMs: unavailableMetric('host', 'B', 'legacy events lack a scenario-correlated start/stop pair'),
      measurementElapsedMs: { source: 'local-clock', accuracy: 'C', value: Number(measurementElapsedMs.toFixed(3)) },
    },
  };
}

function buildLegacyBaseline(baseDir = process.cwd(), options = {}) {
  const repetitions = options.repetitions || 2;
  const dirty = Boolean(gitValue(['status', '--porcelain'], baseDir));
  const scope = buildScopeManifest(baseDir);
  return {
    schemaVersion: '1.0',
    kind: 'legacy-baseline',
    generatedAt: new Date().toISOString(),
    repository: {
      headSha: gitValue(['rev-parse', 'HEAD'], baseDir),
      dirty,
      captureMode: dirty ? 'working-tree-manifest' : 'clean-commit',
      scopeDigest: scope.digest,
      scopeFiles: scope.files,
    },
    methodology: {
      mode: 'repository-replay-with-live-host-extension',
      metricPolicy: 'A=provider actual, B=host observed, C=repository/transcript proxy; tiers are never merged as actual tokens',
      proxyLimitation: 'repository inventory is a lower bound and does not multiply repeated context reads across phases or agents',
      inventorySelectionRule: INVENTORY_SELECTION_RULE,
      liveHostRuns: {
        required: 6,
        captured: 0,
        status: 'pending-external-host',
        reason: 'Claude Code provider usage and approval events are not available in this execution host',
      },
      qualityCommands: ['npm test', 'npm run lint', 'node scripts/vais-validate-plugin.js'],
    },
    scenarios: SCENARIOS.map(scenario => ({
      id: scenario.id,
      targetProfile: scenario.targetProfile,
      targetAssurance: scenario.targetAssurance,
      legacyPhases: scenario.phases,
      samples: Array.from({ length: repetitions }, (_, index) => buildSample(scenario, index + 1, baseDir)),
    })),
  };
}

function validateInventory(metric, location, errors) {
  if (!metric || typeof metric !== 'object') {
    errors.push(location + ' is required');
    return;
  }
  if (metric.source !== 'repository-files') errors.push(location + '.source must be repository-files');
  if (metric.accuracy !== 'C') errors.push(location + '.accuracy must be C');
  if (metric.aggregation !== 'unique-file-inventory') errors.push(location + '.aggregation must be unique-file-inventory');
  if (typeof metric.limitation !== 'string' || metric.limitation.length === 0) errors.push(location + '.limitation is required');
  if (!Array.isArray(metric.files) || metric.files.length === 0) errors.push(location + '.files must not be empty');
  for (const file of metric.files || []) {
    if (file.missing === true) errors.push(location + ': ' + (file.path || 'unknown') + ' is missing');
  }
  if (!Number.isInteger(metric.totalBytes) || metric.totalBytes <= 0) errors.push(location + '.totalBytes must be positive');
  if (!Number.isInteger(metric.estimatedTokens) || metric.estimatedTokens <= 0) errors.push(location + '.estimatedTokens must be positive');
}

function validateObservedMetric(metric, location, source, accuracy, unit, errors) {
  if (!metric || typeof metric !== 'object') {
    errors.push(location + ' is required');
    return;
  }
  if (metric.source !== source) errors.push(location + '.source must be ' + source);
  if (metric.accuracy !== accuracy) errors.push(location + '.accuracy must be ' + accuracy);
  if (metric.status === 'unavailable') {
    if (typeof metric.reason !== 'string' || metric.reason.length === 0) errors.push(location + '.reason is required');
    return;
  }
  if (metric.status === 'captured') {
    if (typeof metric.value !== 'number' || !Number.isFinite(metric.value) || metric.value < 0) {
      errors.push(location + '.value must be a non-negative number');
    }
    if (metric.unit !== unit) errors.push(location + '.unit must be ' + unit);
    if (!Number.isFinite(Date.parse(metric.capturedAt))) errors.push(location + '.capturedAt must be a date-time');
    return;
  }
  errors.push(location + '.status must be unavailable or captured');
}

function validateQuality(quality, location, liveHost, errors) {
  if (!quality || typeof quality !== 'object') {
    errors.push(location + ' is required');
    return;
  }
  if (quality.status === 'unavailable') {
    if (liveHost) errors.push(location + ' must be captured for a live-host sample');
    if (typeof quality.reason !== 'string' || quality.reason.length === 0) errors.push(location + '.reason is required');
    return;
  }
  if (quality.status !== 'captured') {
    errors.push(location + '.status must be unavailable or captured');
    return;
  }
  if (!Number.isFinite(Date.parse(quality.capturedAt))) errors.push(location + '.capturedAt must be a date-time');
  if (!Array.isArray(quality.checks) || quality.checks.length === 0) {
    errors.push(location + '.checks must not be empty');
    return;
  }
  for (const check of quality.checks) {
    if (typeof check.command !== 'string' || check.command.length === 0) errors.push(location + '.checks.command is required');
    if (!['passed', 'failed'].includes(check.status)) errors.push(location + '.checks.status is invalid');
    if (!Number.isInteger(check.exitCode)) errors.push(location + '.checks.exitCode must be an integer');
    if (typeof check.durationMs !== 'number' || check.durationMs < 0) errors.push(location + '.checks.durationMs must be non-negative');
  }
}

function validateRepository(repository, errors) {
  if (!repository || typeof repository !== 'object') {
    errors.push('repository is required');
    return;
  }
  if (typeof repository.dirty !== 'boolean') errors.push('repository.dirty must be boolean');
  if (!['clean-commit', 'working-tree-manifest'].includes(repository.captureMode)) {
    errors.push('repository.captureMode is invalid');
  }
  if (repository.captureMode === 'clean-commit' && repository.dirty !== false) {
    errors.push('repository clean-commit capture must reject a dirty working tree');
  }
  if (repository.captureMode === 'working-tree-manifest' && repository.dirty !== true) {
    errors.push('repository working-tree-manifest capture must declare dirty=true');
  }
  if (!/^[a-f0-9]{64}$/.test(repository.scopeDigest || '')) errors.push('repository.scopeDigest must be sha256');
  if (!Array.isArray(repository.scopeFiles) || repository.scopeFiles.length === 0) errors.push('repository.scopeFiles must not be empty');
}

function validateLegacyBaseline(report) {
  const errors = [];
  if (report?.schemaVersion !== '1.0') errors.push('schemaVersion must be 1.0');
  if (report?.kind !== 'legacy-baseline') errors.push('kind must be legacy-baseline');
  if (!report || typeof report !== 'object') return { valid: false, errors };

  validateRepository(report.repository, errors);

  const liveRuns = report.methodology?.liveHostRuns;
  if (report.methodology?.mode !== 'repository-replay-with-live-host-extension') {
    errors.push('methodology.mode must be repository-replay-with-live-host-extension');
  }
  if (report.methodology?.inventorySelectionRule?.id !== INVENTORY_SELECTION_RULE.id) {
    errors.push('methodology.inventorySelectionRule must use the canonical selection rule');
  }
  if (!liveRuns || liveRuns.required !== 6) errors.push('methodology.liveHostRuns.required must be 6');
  if (!liveRuns || !Number.isInteger(liveRuns.captured) || liveRuns.captured < 0 || liveRuns.captured > 6) {
    errors.push('methodology.liveHostRuns.captured must be between 0 and 6');
  }
  if (!liveRuns?.status || !liveRuns?.reason) errors.push('methodology.liveHostRuns status and reason are required');
  if (liveRuns && liveRuns.captured < liveRuns.required && liveRuns.status !== 'pending-external-host') {
    errors.push('methodology.liveHostRuns.status must remain pending until six runs are captured');
  }
  if (liveRuns && liveRuns.captured === liveRuns.required && liveRuns.status !== 'complete') {
    errors.push('methodology.liveHostRuns.status must be complete after six runs are captured');
  }

  if (!Array.isArray(report?.scenarios) || report.scenarios.length !== 3) errors.push('three baseline scenarios are required');
  const expectedScenarioIds = new Set(SCENARIOS.map(scenario => scenario.id));
  const scenarioIds = new Set();
  const runIds = new Set();
  let capturedLiveSamples = 0;
  for (const scenario of report?.scenarios || []) {
    if (!expectedScenarioIds.has(scenario.id)) errors.push(scenario.id + ': unknown baseline scenario');
    if (scenarioIds.has(scenario.id)) errors.push(scenario.id + ': duplicate baseline scenario');
    scenarioIds.add(scenario.id);
    const repositorySamples = (scenario.samples || []).filter(sample => sample.mode === 'repository-replay');
    if (repositorySamples.length < 2) errors.push(scenario.id + ': two repository replay samples are required');
    for (const sample of scenario.samples || []) {
      const location = sample.runId || scenario.id + ':sample';
      if (!sample.runId || runIds.has(sample.runId)) errors.push(location + ': runId must be present and unique');
      runIds.add(sample.runId);
      const liveHost = sample.mode === 'live-host';
      if (!liveHost && sample.mode !== 'repository-replay') errors.push(location + ': mode is invalid');
      if (liveHost) capturedLiveSamples += 1;
      validateQuality(sample.quality, location + '.quality', liveHost, errors);
      validateInventory(sample.metrics?.fixedContext, location + '.fixedContext', errors);
      validateInventory(sample.metrics?.artifactTemplates, location + '.artifactTemplates', errors);
      if (sample.metrics?.agentCount?.accuracy !== 'C' || !Number.isInteger(sample.metrics?.agentCount?.value) || sample.metrics.agentCount.value < 1) {
        errors.push(location + '.agentCount must be a positive C proxy');
      }
      const approvals = sample.metrics?.workflowApprovals;
      if (approvals?.accuracy !== 'C' || !Number.isInteger(approvals?.minimum) || !Number.isInteger(approvals?.maximum) || approvals.minimum > approvals.maximum) {
        errors.push(location + '.workflowApprovals must be an ordered C proxy range');
      }
      validateObservedMetric(sample.metrics?.hostApprovals, location + '.hostApprovals', 'host', 'B', 'count', errors);
      validateObservedMetric(sample.metrics?.providerTokens, location + '.providerTokens', 'provider', 'A', 'tokens', errors);
      validateObservedMetric(sample.metrics?.hostTokens, location + '.hostTokens', 'host', 'B', 'tokens', errors);
      validateObservedMetric(sample.metrics?.workflowElapsedMs, location + '.workflowElapsedMs', 'host', 'B', 'milliseconds', errors);
      if (liveHost && sample.metrics?.hostApprovals?.status !== 'captured') {
        errors.push(location + '.hostApprovals must be captured for a live-host sample');
      }
      if (liveHost && sample.metrics?.workflowElapsedMs?.status !== 'captured') {
        errors.push(location + '.workflowElapsedMs must be captured for a live-host sample');
      }
      if (sample.metrics?.measurementElapsedMs?.accuracy !== 'C' || typeof sample.metrics?.measurementElapsedMs?.value !== 'number') {
        errors.push(location + '.measurementElapsedMs must be a numeric C proxy');
      }
    }
  }
  for (const id of expectedScenarioIds) {
    if (!scenarioIds.has(id)) errors.push(id + ': baseline scenario is missing');
  }
  if (liveRuns && liveRuns.captured !== capturedLiveSamples) {
    errors.push('methodology.liveHostRuns.captured must equal the number of live-host samples');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  COMMON_CONTEXT,
  INVENTORY_SELECTION_RULE,
  SCENARIOS,
  buildLegacyBaseline,
  buildScopeManifest,
  validateLegacyBaseline,
};
