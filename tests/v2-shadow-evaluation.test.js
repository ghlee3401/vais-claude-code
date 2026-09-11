'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { buildShadowEvaluation } = require('../lib/evaluation/v2-shadow');
const {
  buildFormalTelemetryEvidence,
  buildAgentManifestEvidence,
  resolveStepPrompt,
} = require('../scripts/evaluation/live-v2-journey');

const ROOT = path.join(__dirname, '..');

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-live-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function write(root, relative, value) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const body = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(target, body);
  return { path: relative, digest: digest(body) };
}

function rewrite(root, reference, value) {
  const replacement = write(root, reference.path, value);
  reference.digest = replacement.digest;
}

function documentManifest(root, prefix, engine, cohortId, repetition) {
  const documents = [];
  const authoredCount = engine === 'legacy' ? 6 : 5;
  for (let index = 0; index < authoredCount; index += 1) {
    const value = engine === 'legacy' ? 'L'.repeat(200 + index) : 'V'.repeat(100 + index);
    const reference = write(root, `${prefix}/documents/authored-${index}.md`, value);
    documents.push({ ...reference, kind: 'authored', bytes: Buffer.byteLength(value) });
  }
  const derivedValue = engine === 'legacy' ? 'legacy-index' : 'v2-index';
  const derived = write(root, `${prefix}/documents/derived.md`, derivedValue);
  documents.push({ ...derived, kind: 'derived', bytes: Buffer.byteLength(derivedValue) });
  const authored = documents.filter(item => item.kind === 'authored');
  const derivedDocuments = documents.filter(item => item.kind === 'derived');
  return {
    reference: write(root, `${prefix}/document-manifest.json`, {
      cohortId, runKey: `${engine}:${repetition}`, documents,
    }),
    counts: {
      documentCount: documents.length,
      authoredDocumentCount: authored.length,
      derivedDocumentCount: derivedDocuments.length,
      transientDraftCount: 0,
      documentBytes: documents.reduce((total, item) => total + item.bytes, 0),
      authoredDocumentBytes: authored.reduce((total, item) => total + item.bytes, 0),
      derivedDocumentBytes: derivedDocuments.reduce((total, item) => total + item.bytes, 0),
    },
  };
}

function agentManifest(root, prefix, engine, cohortId, repetition, sampleClass) {
  const requiredAssignments = engine === 'v2' && sampleClass === 'formal' ? [
    { role: 'backend-engineer', assignmentId: `${prefix}-backend` },
    { role: 'independent-qa', assignmentId: `${prefix}-qa` },
  ] : [];
  const calls = requiredAssignments.map(item => ({
    ...item, handoffId: `${item.assignmentId}-handoff`, status: 'completed',
  }));
  return {
    reference: write(root, `${prefix}/agent-manifest.json`, {
      cohortId, runKey: `${engine}:${repetition}`, requiredAssignments, calls,
    }),
    values: {
      agentCalls: calls.length,
      requiredAgentCalls: requiredAssignments.length,
      duplicateAgentCalls: 0,
      missingRequiredAgentCalls: 0,
      independentQaCalls: calls.filter(call => call.role === 'independent-qa').length,
      agentPlanSatisfied: true,
    },
  };
}

function makeRun(root, cohort, engine, repetition, overrides = {}) {
  const prefix = `${engine}-${repetition}-${overrides.suffix || 'formal'}`;
  const sampleClass = overrides.sampleClass || 'formal';
  const deliveryCacheCreationTokens = overrides.deliveryCacheCreationTokens ??
    (sampleClass === 'diagnostic' ? 0 : engine === 'legacy' ? 1000 : 500);
  const assuranceCacheCreationTokens = overrides.assuranceCacheCreationTokens ??
    (sampleClass === 'formal' && engine === 'v2' ? 100 : 0);
  const diagnosticCacheCreationTokens = overrides.diagnosticCacheCreationTokens ?? 0;
  const totalCacheCreationTokens = overrides.totalCacheCreationTokens ??
    deliveryCacheCreationTokens + assuranceCacheCreationTokens + diagnosticCacheCreationTokens;
  const instructionTokens = overrides.instructionTokens ?? deliveryCacheCreationTokens + assuranceCacheCreationTokens;
  const formalTurnCount = overrides.formalTurnCount ?? (sampleClass === 'formal' ? (engine === 'v2' ? 2 : 1) : 0);
  const diagnosticTurnCount = overrides.diagnosticTurnCount ?? (sampleClass === 'diagnostic' ? 1 : 0);
  const agents = agentManifest(root, prefix, engine, cohort.id, repetition, sampleClass);
  const documents = documentManifest(root, prefix, engine, cohort.id, repetition);
  const providerTurn = (name, tokens, elapsed, cost, outputTokens = 10) => write(root, `${prefix}/${name}.raw.json`, {
    duration_ms: elapsed,
    total_cost_usd: cost,
    evaluationMetadata: {
      cohortId: cohort.id, runKey: `${engine}:${repetition}`, sampleClass,
      computeClass: name.startsWith('diagnostic') ? 'diagnostic' : name.startsWith('assurance') ? 'assurance' : 'delivery',
      role: name.startsWith('diagnostic') ? 'diagnostic' : name.startsWith('assurance') ? 'independent-qa' :
        engine === 'v2' ? 'backend-engineer' : 'workflow-owner',
      assignmentId: name.startsWith('assurance') ? `${prefix}-qa` :
        name.startsWith('delivery') && engine === 'v2' ? `${prefix}-backend` : null,
    },
    modelUsage: { [cohort.model]: {
      cacheCreationInputTokens: tokens, cacheReadInputTokens: 20, outputTokens,
    } },
  });
  const turns = sampleClass === 'diagnostic'
    ? [{ ...providerTurn('diagnostic-turn', diagnosticCacheCreationTokens, 25, 0.01), sampleClass, computeClass: 'diagnostic',
      role: 'diagnostic', elapsedMs: 25, providerListCost: 0.01 }]
    : [{ ...providerTurn('delivery-turn', deliveryCacheCreationTokens, engine === 'v2' ? 60 : 100, 0.02), sampleClass, computeClass: 'delivery',
      role: engine === 'v2' ? 'backend-engineer' : 'workflow-owner',
      ...(engine === 'v2' ? { assignmentId: `${prefix}-backend` } : {}),
      elapsedMs: engine === 'v2' ? 60 : 100, providerListCost: 0.02 },
    ...(assuranceCacheCreationTokens > 0 ? [{ ...providerTurn('assurance-turn', assuranceCacheCreationTokens, 40, 0.01),
      sampleClass, computeClass: 'assurance', role: 'independent-qa', assignmentId: `${prefix}-qa`,
      elapsedMs: 40, providerListCost: 0.01 }] : [])];
  const totalCacheReadTokens = turns.length * 20;
  const outputTokens = turns.length * 10;
  const elapsedMs = turns.reduce((total, turn) => total + turn.elapsedMs, 0);
  const providerListCost = Number(turns.reduce((total, turn) => total + turn.providerListCost, 0).toFixed(8));
  const rawTelemetry = write(root, `${prefix}/raw-telemetry.json`, {
    cohortId: cohort.id, runKey: `${engine}:${repetition}`,
    stageDigest: cohort.stage.digest, model: cohort.model, effort: cohort.effort,
    toolProfileDigest: cohort.toolProfile.digest,
    sampleClass, instructionTokens, deliveryCacheCreationTokens, assuranceCacheCreationTokens,
    totalCacheCreationTokens, totalCacheReadTokens, outputTokens, elapsedMs, providerListCost,
    diagnosticCacheCreationTokens, formalTurnCount, diagnosticTurnCount,
    turns,
  });
  const terminalStatus = overrides.terminalStatus || 'completed';
  const quality = overrides.quality || 'pass';
  const terminalEvidence = write(root, `${prefix}/terminal.json`, {
    cohortId: cohort.id, runKey: `${engine}:${repetition}`,
    terminalStatus, quality, reportFrozen: engine === 'v2',
  });
  const checkManifest = write(root, `${prefix}/check-manifest.json`, {
    cohortId: cohort.id, runKey: `${engine}:${repetition}`,
    checks: [{ adapter: 'node-test', normalizedCommand: 'node --test focused',
      designRevision: '3', repoSnapshotDigest: cohort.stage.digest }],
  });
  const contractManifest = write(root, `${prefix}/contract-manifest.json`, {
    cohortId: cohort.id, runKey: `${engine}:${repetition}`, attempts: [],
  });
  const userTurnManifest = write(root, `${prefix}/user-turn-manifest.json`, {
    cohortId: cohort.id, runKey: `${engine}:${repetition}`,
    turns: [{ kind: 'request' }, { kind: 'plan-approval' }, { kind: 'design-approval' }, { kind: 'final-approval' }],
  });
  return {
    cohortId: cohort.id,
    scenario: cohort.scenario,
    scale: 'compact',
    repetition,
    engine,
    sampleClass,
    quality,
    terminalStatus,
    instructionTokens,
    deliveryCacheCreationTokens,
    assuranceCacheCreationTokens,
    totalCacheCreationTokens,
    totalCacheReadTokens,
    outputTokens,
    elapsedMs,
    providerListCost,
    diagnosticCacheCreationTokens,
    formalTurnCount,
    diagnosticTurnCount,
    ...agents.values,
    agentManifest: agents.reference,
    ...documents.counts,
    documentManifest: documents.reference,
    rawTelemetry,
    terminalEvidence,
    telemetryDigest: rawTelemetry.digest,
    duplicateCheckCount: 0,
    checkManifest,
    contractRetryCount: 0,
    sameErrorRepeatCount: 0,
    contractManifest,
    standaloneReviewProgressTurnCount: 0,
    userTurnManifest,
  };
}

function liveEvidence(t) {
  const root = fixture(t);
  const fixtureFiles = [{ path: 'index.html', bytes: 1, digest: digest('f') }];
  const legacyFiles = [{ path: 'plugin.json', bytes: 1, digest: digest('l') }];
  const v2Files = [{ path: 'plugin.json', bytes: 1, digest: digest('v') }];
  const cohort = {
    id: 'mini-booking-stage-a',
    scenario: 'booking-cancellation-full-journey',
    stage: write(root, 'cohort/stage.json', {
      schema: 'live-shadow-stage/v1', fixtureDigest: digest(JSON.stringify(fixtureFiles)),
      fixture: { rootDigest: digest(JSON.stringify(fixtureFiles)), fileCount: 1, files: fixtureFiles },
      legacy: { rootDigest: digest(JSON.stringify(legacyFiles)), fileCount: 1, files: legacyFiles },
      v2: { rootDigest: digest(JSON.stringify(v2Files)), fileCount: 1, files: v2Files },
    }),
    model: 'claude-opus-5',
    effort: 'low',
    toolProfile: write(root, 'cohort/tool-profile.json', { tools: ['bash', 'chrome'] }),
  };
  const runs = [];
  for (let repetition = 1; repetition <= 3; repetition += 1) {
    runs.push(makeRun(root, cohort, 'legacy', repetition));
    runs.push(makeRun(root, cohort, 'v2', repetition));
  }
  return { root, evidence: { schemaVersion: '2.0', fixture: 'mini-booking', cohort, runs } };
}

function evaluate(t, mutate, browser = { verdict: 'pass', scenarios: [] }) {
  const value = liveEvidence(t);
  if (mutate) mutate(value.evidence, value.root);
  return buildShadowEvaluation(ROOT, {
    browser,
    liveEvidence: value.evidence,
    evidenceRoot: value.root,
  });
}

describe('v2 fail-closed live shadow comparison', () => {
  it('binds approval prompts to the revision created by the measured Work item', t => {
    const root = fixture(t);
    fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
    fs.writeFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), `${JSON.stringify({
      workItems: { measured: { id: 'measured', planRevision: 2, designRevision: 4 } },
    })}\n`);
    assert.equal(resolveStepPrompt(root, { prompt: 'Plan {{planRevision}} / Design {{designRevision}}' }),
      'Plan 2 / Design 4');
  });

  it('passes only one evidence-backed immutable cohort with exact paired repetitions', t => {
    const result = evaluate(t);
    assert.equal(result.verdict, 'pass');
    assert.equal(result.live.completePairs, 3);
    assert.equal(result.live.hasTriple, true);
    assert.equal(result.live.aggregate.v2.totalCacheCreationTokens, 600);
    assert.equal(result.live.aggregate.v2.deliveryCacheCreationTokens, 500);
    assert.equal(result.live.aggregate.v2.assuranceCacheCreationTokens, 100);
    assert.equal(result.live.aggregate.v2.authoredDocumentCount, 5);
    assert.equal(result.live.aggregate.v2.authoredDocumentBytes, 510);
    assert.equal(result.live.efficiencyChecks.length, 8);
  });

  it('accepts transcript-attributed delivery specialist and QA usage in one provider turn', t => {
    const result = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 1);
      fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
      fs.writeFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), `${JSON.stringify({
        assignments: {
          frontend: { id: 'v2-1-formal-frontend', workItemId: 'work-1', designRevision: 3,
            role: 'frontend-engineer', completedAt: '2026-09-02T00:00:00Z', handoffStatus: 'completed' },
          qa: { id: 'v2-1-formal-qa', workItemId: 'work-1', designRevision: 3,
            role: 'independent-qa', completedAt: '2026-09-02T00:00:01Z', handoffStatus: 'completed' },
        },
      }, null, 2)}\n`);
      const agentBuilt = buildAgentManifestEvidence(root, root, {
        workItemId: 'work-1', designRevision: 3, cohortId: evidence.cohort.id, runKey: 'v2:1',
      });
      run.agentManifest = agentBuilt.reference;
      Object.assign(run, {
        agentCalls: 2, requiredAgentCalls: 2, duplicateAgentCalls: 0,
        missingRequiredAgentCalls: 0, independentQaCalls: 1, agentPlanSatisfied: true,
      });
      const rawPath = path.join(root, 'combined-turn.raw.json');
      fs.writeFileSync(rawPath, `${JSON.stringify({
        duration_ms: 100,
        total_cost_usd: 0.03,
        usage: { cache_creation_input_tokens: 400, cache_read_input_tokens: 20, output_tokens: 10 },
        modelUsage: { [evidence.cohort.model]: {
          cacheCreationInputTokens: 600, cacheReadInputTokens: 40, outputTokens: 20,
        } },
        subagent_stats: { spawned: 2, completed: 2, failed: 0 },
        evaluationMetadata: { agentSegments: [
          { agentId: 'agent-frontend', assignmentId: 'v2-1-formal-frontend', role: 'frontend-engineer',
            status: 'completed', model: evidence.cohort.model,
            usage: { totalCacheCreationTokens: 100, totalCacheReadTokens: 10, outputTokens: 5 } },
          { agentId: 'agent-qa', assignmentId: 'v2-1-formal-qa', role: 'independent-qa',
            status: 'completed', model: evidence.cohort.model,
            usage: { totalCacheCreationTokens: 100, totalCacheReadTokens: 10, outputTokens: 5 } },
        ] },
      }, null, 2)}\n`);
      const built = buildFormalTelemetryEvidence(root, {
        cohort: evidence.cohort, engine: 'v2', repetition: 1, rawPaths: [rawPath],
        qaAssignment: { role: agentBuilt.qaAssignment.role,
          assignmentId: agentBuilt.qaAssignment.assignmentId },
        agentAssignments: agentBuilt.manifest.calls,
      });
      Object.assign(run, {
        instructionTokens: built.telemetry.instructionTokens,
        deliveryCacheCreationTokens: built.telemetry.deliveryCacheCreationTokens,
        assuranceCacheCreationTokens: built.telemetry.assuranceCacheCreationTokens,
        totalCacheCreationTokens: built.telemetry.totalCacheCreationTokens,
        totalCacheReadTokens: built.telemetry.totalCacheReadTokens,
        outputTokens: built.telemetry.outputTokens,
        elapsedMs: built.telemetry.elapsedMs,
        providerListCost: built.telemetry.providerListCost,
        formalTurnCount: built.telemetry.formalTurnCount,
        rawTelemetry: built.reference,
        telemetryDigest: built.reference.digest,
      });
    });
    assert.equal(result.verdict, 'pass');
    assert.equal(result.live.aggregate.v2.deliveryCacheCreationTokens, 500);
    assert.equal(result.live.aggregate.v2.assuranceCacheCreationTokens, 100);
  });

  it('accepts a complete Agent manifest with one delivery specialist and one independent QA', t => {
    const root = fixture(t);
    fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
    fs.writeFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), `${JSON.stringify({
      assignments: {
        backend: { id: 'combined-backend', workItemId: 'work-1', designRevision: 3,
          role: 'backend-engineer', completedAt: '2026-09-02T00:00:00Z', handoffStatus: 'completed' },
        qa: { id: 'combined-qa', workItemId: 'work-1', designRevision: 3,
          role: 'independent-qa', completedAt: '2026-09-02T00:00:01Z', handoffStatus: 'completed' },
      },
    }, null, 2)}\n`);
    const built = buildAgentManifestEvidence(root, root, {
      workItemId: 'work-1', designRevision: 3, cohortId: 'cohort', runKey: 'v2:1',
    });
    assert.equal(built.manifest.calls.length, 2);
    assert.equal(built.manifest.requiredAssignments.length, 2);
    assert.equal(built.qaAssignment.assignmentId, 'combined-qa');
  });

  it('keeps 1.0 evidence readable but blocks it from supporting PASS', () => {
    const legacy = {
      schemaVersion: '1.0', fixture: 'mini-booking', runs: [{
        scenario: 'old', repetition: 1, engine: 'legacy', quality: 'pass', terminalStatus: 'completed',
        instructionTokens: 1, agentCalls: 0, requiredAgentCalls: 0, duplicateAgentCalls: 0,
        agentPlanSatisfied: true, documentCount: 1, authoredDocumentCount: 1,
        derivedDocumentCount: 0, documentBytes: 1, telemetryDigest: null,
      }],
    };
    const result = buildShadowEvaluation(ROOT, {
      browser: { verdict: 'pass', scenarios: [] }, liveEvidence: legacy,
    });
    assert.equal(result.verdict, 'blocked');
    assert.equal(result.live.status, 'legacy-format');
  });

  it('rejects duplicate formal engine/repetition keys as invalid', t => {
    const result = evaluate(t, evidence => evidence.runs.push(evidence.runs[0]));
    assert.equal(result.verdict, 'fail');
    assert.equal(result.live.status, 'invalid');
    assert.match(result.live.reason, /Duplicate formal run/);
  });

  it('blocks an incomplete cohort after excluding diagnostic or contaminated samples', t => {
    const diagnostic = evaluate(t, (evidence, root) => {
      evidence.runs = evidence.runs.filter(run => !(run.engine === 'v2' && run.repetition === 3));
      evidence.runs.push(makeRun(root, evidence.cohort, 'v2', 30, {
        suffix: 'diagnostic', sampleClass: 'diagnostic', instructionTokens: 0,
        totalCacheCreationTokens: 50, diagnosticCacheCreationTokens: 50,
      }));
    });
    assert.equal(diagnostic.verdict, 'blocked');
    assert.equal(diagnostic.live.status, 'incomplete');

    const contaminated = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 2);
      run.diagnosticTurnCount = 1;
      run.diagnosticCacheCreationTokens = 50;
      run.totalCacheCreationTokens += 50;
      const diagnosticTurn = write(root,
        run.rawTelemetry.path.replace('raw-telemetry.json', 'diagnostic-turn.raw.json'), {
          duration_ms: 25,
          total_cost_usd: 0.01,
          evaluationMetadata: { cohortId: run.cohortId, runKey: `${run.engine}:${run.repetition}`,
            sampleClass: 'diagnostic', computeClass: 'diagnostic', role: 'diagnostic' },
          modelUsage: { [evidence.cohort.model]: {
            cacheCreationInputTokens: 50, cacheReadInputTokens: 0, outputTokens: 0,
          } },
        });
      const raw = JSON.parse(fs.readFileSync(path.join(root, run.rawTelemetry.path), 'utf8'));
      raw.totalCacheCreationTokens = run.totalCacheCreationTokens;
      raw.diagnosticCacheCreationTokens = 50;
      raw.diagnosticTurnCount = 1;
      raw.elapsedMs += 25;
      raw.providerListCost = Number((raw.providerListCost + 0.01).toFixed(8));
      run.elapsedMs = raw.elapsedMs;
      run.providerListCost = raw.providerListCost;
      raw.turns.push({ ...diagnosticTurn, sampleClass: 'diagnostic', computeClass: 'diagnostic',
        role: 'diagnostic', elapsedMs: 25, providerListCost: 0.01 });
      rewrite(root, run.rawTelemetry, raw);
      run.telemetryDigest = run.rawTelemetry.digest;
    });
    assert.equal(contaminated.verdict, 'blocked');
    assert.match(contaminated.live.reason, /contain diagnostic/);
  });

  it('fails a complete cohort whose quality or computed Agent plan fails', t => {
    const quality = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 1);
      run.quality = 'fail';
      rewrite(root, run.terminalEvidence, {
        cohortId: run.cohortId, runKey: `${run.engine}:${run.repetition}`,
        terminalStatus: run.terminalStatus, quality: 'fail', reportFrozen: true,
      });
    });
    assert.equal(quality.verdict, 'fail');
    assert.equal(quality.live.status, 'available');
    assert.equal(quality.live.qualityPass, false);

    const skipped = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 1);
      const manifest = JSON.parse(fs.readFileSync(path.join(root, run.agentManifest.path), 'utf8'));
      manifest.calls.pop();
      rewrite(root, run.agentManifest, manifest);
      run.agentCalls = 1;
      run.missingRequiredAgentCalls = 1;
      run.independentQaCalls = 0;
      run.agentPlanSatisfied = false;
    });
    assert.equal(skipped.verdict, 'fail');
    assert.equal(skipped.live.qualityPass, true);
    assert.equal(skipped.live.efficiencyChecks.find(check => check.id === 'EFF-04').pass, false);
  });

  it('rejects self-reported Agent and document metrics that disagree with manifests', t => {
    const agents = evaluate(t, evidence => {
      evidence.runs.find(run => run.engine === 'v2').agentCalls = 0;
    });
    assert.equal(agents.live.status, 'invalid');
    assert.match(agents.live.reason, /Agent counts/);

    const documents = evaluate(t, evidence => {
      evidence.runs.find(run => run.engine === 'v2').authoredDocumentBytes += 1;
    });
    assert.equal(documents.live.status, 'invalid');
    assert.match(documents.live.reason, /Document counts or bytes/);
  });

  it('fails closed when assurance/provider partitions disagree', t => {
    const result = evaluate(t, evidence => {
      const run = evidence.runs.find(item => item.engine === 'v2');
      run.deliveryCacheCreationTokens += 1;
      run.assuranceCacheCreationTokens -= 1;
    });
    assert.equal(result.live.status, 'invalid');
    assert.match(result.live.reason, /raw telemetry|reconcile/);
  });

  it('enforces EFF-05 through EFF-08 from evidence manifests', t => {
    const duplicateCheck = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2');
      const manifest = JSON.parse(fs.readFileSync(path.join(root, run.checkManifest.path), 'utf8'));
      manifest.checks.push({ ...manifest.checks[0] });
      rewrite(root, run.checkManifest, manifest);
      run.duplicateCheckCount = 1;
    });
    assert.equal(duplicateCheck.live.efficiencyChecks.find(check => check.id === 'EFF-05').pass, false);

    const transientDraft = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2');
      const manifest = JSON.parse(fs.readFileSync(path.join(root, run.documentManifest.path), 'utf8'));
      const draft = write(root, `${run.engine}-${run.repetition}-formal/documents/draft.md`, 'draft');
      manifest.documents.push({ ...draft, kind: 'transient', bytes: 5 });
      rewrite(root, run.documentManifest, manifest);
      run.transientDraftCount = 1;
      run.documentCount += 1;
      run.documentBytes += 5;
    });
    assert.equal(transientDraft.live.efficiencyChecks.find(check => check.id === 'EFF-06').pass, false);

    const repeatedContractError = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2');
      rewrite(root, run.contractManifest, {
        cohortId: run.cohortId, runKey: `${run.engine}:${run.repetition}`, attempts: [
          { transactionId: 'tx-1', outcome: 'schema-error', errorFingerprint: 'missing-owner' },
          { transactionId: 'tx-1', outcome: 'schema-error', errorFingerprint: 'missing-owner' },
        ],
      });
      run.contractRetryCount = 2;
      run.sameErrorRepeatCount = 1;
    });
    assert.equal(repeatedContractError.live.efficiencyChecks.find(check => check.id === 'EFF-07').pass, false);

    const reviewProgress = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2');
      const manifest = JSON.parse(fs.readFileSync(path.join(root, run.userTurnManifest.path), 'utf8'));
      manifest.turns.push({ kind: 'review-progress' });
      rewrite(root, run.userTurnManifest, manifest);
      run.standaloneReviewProgressTurnCount = 1;
    });
    assert.equal(reviewProgress.live.efficiencyChecks.find(check => check.id === 'EFF-08').pass, false);
  });

  it('requires readable digest-matching raw, stage, terminal, and document files', t => {
    const missing = evaluate(t, (evidence, root) => {
      fs.unlinkSync(path.join(root, evidence.runs[0].rawTelemetry.path));
    });
    assert.equal(missing.verdict, 'blocked');
    assert.equal(missing.live.status, 'unavailable');

    const tampered = evaluate(t, (evidence, root) => {
      fs.appendFileSync(path.join(root, evidence.cohort.stage.path), 'tampered');
    });
    assert.equal(tampered.verdict, 'fail');
    assert.equal(tampered.live.status, 'invalid');

    const absentRoot = liveEvidence(t);
    const result = buildShadowEvaluation(ROOT, {
      browser: { verdict: 'pass', scenarios: [] },
      liveEvidence: absentRoot.evidence,
      evidenceRoot: path.join(absentRoot.root, 'does-not-exist'),
    });
    assert.equal(result.verdict, 'blocked');
    assert.equal(result.live.status, 'unavailable');
  });

  it('returns BLOCKED for external unavailability and FAIL for complete inefficiency', t => {
    const browserBlocked = evaluate(t, null, { verdict: 'blocked', scenarios: [] });
    assert.equal(browserBlocked.verdict, 'blocked');

    const providerBlocked = evaluate(t, (evidence, root) => {
      const run = evidence.runs.find(item => item.engine === 'v2' && item.repetition === 1);
      run.quality = 'blocked';
      run.terminalStatus = 'blocked';
      rewrite(root, run.terminalEvidence, {
        cohortId: run.cohortId, runKey: `${run.engine}:${run.repetition}`,
        terminalStatus: 'blocked', quality: 'blocked', reportFrozen: false,
      });
    });
    assert.equal(providerBlocked.verdict, 'blocked');
    assert.equal(providerBlocked.live.status, 'incomplete');

    const inefficient = evaluate(t, (evidence, root) => {
      for (const run of evidence.runs.filter(item => item.engine === 'v2')) {
        run.deliveryCacheCreationTokens = 1200;
        run.instructionTokens = 1300;
        run.totalCacheCreationTokens = 1300;
        const raw = JSON.parse(fs.readFileSync(path.join(root, run.rawTelemetry.path), 'utf8'));
        const delivery = raw.turns.find(turn => turn.computeClass === 'delivery');
        const provider = write(root, delivery.path, {
          duration_ms: delivery.elapsedMs,
          total_cost_usd: delivery.providerListCost,
          evaluationMetadata: { cohortId: run.cohortId, runKey: `${run.engine}:${run.repetition}`,
            sampleClass: 'formal', computeClass: 'delivery', role: 'backend-engineer',
            assignmentId: delivery.assignmentId },
          modelUsage: { [evidence.cohort.model]: {
            cacheCreationInputTokens: 1200, cacheReadInputTokens: 20, outputTokens: 10,
          } },
        });
        delivery.digest = provider.digest;
        raw.instructionTokens = 1300;
        raw.deliveryCacheCreationTokens = 1200;
        raw.totalCacheCreationTokens = 1300;
        rewrite(root, run.rawTelemetry, raw);
        run.telemetryDigest = run.rawTelemetry.digest;
      }
    });
    assert.equal(inefficient.verdict, 'fail');
    assert.equal(inefficient.live.efficiencyPass, false);
  });
});
