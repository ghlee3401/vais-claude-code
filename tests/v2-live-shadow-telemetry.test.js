'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const {
  loadToolProfile,
  toolProfileArgs,
  classifyTurn,
  summarizeModelUsage,
  splitProviderUsage,
  aggregateAgentTranscript,
  assignmentIdentity,
} = require('../scripts/evaluation/live-claude-turn');
const {
  partitionShadowTurns,
  summarizeFormalJourney,
} = require('../scripts/evaluation/live-shadow-telemetry');
const { verifyJourneyTrust } = require('../scripts/evaluation/live-v2-journey');
const { recursiveManifest } = require('../scripts/evaluation/trusted-shadow-bundle');

const FIXTURE = JSON.parse(fs.readFileSync(path.join(
  __dirname, 'fixtures', 'v2-live-shadow-turns.json'), 'utf8'));

describe('v2 clean live Shadow telemetry', () => {
  it('normalizes a concrete Claude tool profile and turns it into enforced CLI options', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-tool-profile-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const target = path.join(root, 'tool-profile.json');
    fs.writeFileSync(target, JSON.stringify({
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['Read', 'Bash', 'Read'], disallowedTools: ['WebSearch'],
    }));
    const loaded = loadToolProfile(target);
    assert.deepEqual(loaded.profile.allowedTools, ['Bash', 'Read']);
    assert.equal(loaded.digest.length, 64);
    assert.deepEqual(toolProfileArgs(loaded.profile), [
      '--permission-mode', 'bypassPermissions', '--dangerously-skip-permissions',
      '--strict-mcp-config', '--allowedTools', 'Bash,Read', '--disallowedTools', 'WebSearch',
    ]);
    fs.writeFileSync(target, JSON.stringify({
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['Read,Bash'], disallowedTools: [],
    }));
    assert.throws(() => loadToolProfile(target), /Tool profile requires/);
    fs.writeFileSync(target, JSON.stringify({
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['--model'], disallowedTools: [],
    }));
    assert.throws(() => loadToolProfile(target), /Tool profile requires/);
  });

  it('binds a live journey to the actual plugin tree and normalized tool profile digests', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-journey-trust-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const plugin = path.join(root, 'plugin');
    fs.mkdirSync(plugin);
    fs.writeFileSync(path.join(plugin, 'plugin.json'), 'immutable');
    const profilePath = path.join(root, 'tool-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify({
      permissionMode: 'bypassPermissions', strictMcpConfig: true,
      allowedTools: ['Read', 'Bash'], disallowedTools: [],
    }));
    const stageDigest = recursiveManifest(plugin).digest;
    const profileDigest = loadToolProfile(profilePath).digest;
    assert.equal(verifyJourneyTrust(plugin, stageDigest, profilePath, profileDigest).observedStageRootDigest,
      stageDigest);
    assert.throws(() => verifyJourneyTrust(plugin, '0'.repeat(64), profilePath, profileDigest),
      /plugin tree/);
    assert.throws(() => verifyJourneyTrust(plugin, stageDigest, profilePath, '0'.repeat(64)),
      /tool profile/);
  });

  it('sums cache creation across every provider model instead of sampling the first model', () => {
    const usage = summarizeModelUsage({
      'claude-opus': { cacheCreationInputTokens: 11000, cacheReadInputTokens: 2500 },
      'claude-sonnet': { cacheCreationInputTokens: 3000, cacheReadInputTokens: 500 },
    });
    assert.deepEqual(usage, {
      totalCacheCreationTokens: 14000,
      totalCacheReadTokens: 3000,
      outputTokens: 0,
      modelCount: 2,
    });
  });

  it('derives assurance as aggregate model usage minus top-level outer usage', () => {
    assert.deepEqual(splitProviderUsage({
      usage: { cache_creation_input_tokens: 500, cache_read_input_tokens: 20, output_tokens: 10 },
      modelUsage: { opus: {
        cacheCreationInputTokens: 620, cacheReadInputTokens: 50, outputTokens: 25,
      } },
    }), {
      total: { totalCacheCreationTokens: 620, totalCacheReadTokens: 50, outputTokens: 25, modelCount: 1 },
      delivery: { totalCacheCreationTokens: 500, totalCacheReadTokens: 20, outputTokens: 10 },
      assurance: { totalCacheCreationTokens: 120, totalCacheReadTokens: 30, outputTokens: 15 },
    });
    assert.throws(() => splitProviderUsage({
      usage: { cache_creation_input_tokens: 700 },
      modelUsage: { opus: { cacheCreationInputTokens: 620 } },
    }), /cannot be split/);
  });

  it('aggregates the final API block per Agent request and binds assignment identity', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-agent-usage-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const target = path.join(root, 'agent-a.jsonl');
    const row = (requestId, apiBlockIndex, outputTokens, stopReason = null) => JSON.stringify({
      type: 'assistant', requestId, apiBlockIndex,
      message: { model: 'claude-opus-5', stop_reason: stopReason, usage: {
        cache_creation_input_tokens: requestId === 'req-1' ? 10 : 20,
        cache_read_input_tokens: requestId === 'req-1' ? 100 : 200,
        output_tokens: outputTokens,
      } },
    });
    fs.writeFileSync(target, [
      row('req-1', 0, 1), row('req-1', 1, 30, 'tool_use'), row('req-2', 0, 40, 'end_turn'),
    ].join('\n') + '\n');
    const aggregate = aggregateAgentTranscript(target);
    assert.equal(aggregate.model, 'claude-opus-5');
    assert.equal(aggregate.requestCount, 2);
    assert.deepEqual(aggregate.usage, {
      totalCacheCreationTokens: 30,
      totalCacheReadTokens: 300,
      outputTokens: 70,
    });
    assert.match(aggregate.transcriptDigest, /^[a-f0-9]{64}$/);
    assert.deepEqual(assignmentIdentity(JSON.stringify({
      assignment: { role: 'independent-qa' }, assignmentReceipt: { id: 'AS-qa' },
    })), { assignmentId: 'AS-qa', role: 'independent-qa' });
  });

  it('requires explicit metadata for diagnostic quota and attack turns', () => {
    assert.deepEqual(classifyTurn(['--sample-class', 'formal', '--compute-class', 'delivery',
      '--role', 'workflow-owner', '--journey-id', 'j-1']), {
      sampleClass: 'formal', computeClass: 'delivery', role: 'workflow-owner', diagnosticKind: null, journeyId: 'j-1',
    });
    assert.deepEqual(classifyTurn([
      '--sample-class', 'diagnostic', '--compute-class', 'diagnostic', '--role', 'diagnostic',
      '--diagnostic-kind', 'router-attack',
    ]), {
      sampleClass: 'diagnostic', computeClass: 'diagnostic', role: 'diagnostic',
      diagnosticKind: 'router-attack', journeyId: null,
    });
    assert.throws(() => classifyTurn(['--sample-class', 'diagnostic', '--compute-class', 'diagnostic',
      '--role', 'diagnostic']), /diagnostic-kind is required/);
    assert.throws(() => classifyTurn([]), /sample-class is required/);
    assert.throws(() => classifyTurn([
      '--sample-class', 'formal', '--compute-class', 'delivery', '--role', 'workflow-owner',
      '--diagnostic-kind', 'quota-recovery',
    ]), /only for diagnostic/);
  });

  it('excludes quota and attack diagnostics from the formal efficiency metric', () => {
    const result = summarizeFormalJourney(FIXTURE);
    assert.equal(result.instructionTokens, 18000);
    assert.equal(result.deliveryCacheCreationTokens, 11000);
    assert.equal(result.assuranceCacheCreationTokens, 7000);
    assert.equal(result.totalCacheReadTokens, 3150);
    assert.equal(result.outputTokens, 880);
    assert.equal(result.elapsedMs, 210);
    assert.equal(result.providerListCost, 0.195);
    assert.equal(result.formalTurnCount, 2);
    assert.equal(result.diagnosticTurnCount, 2);
    assert.equal(result.eligible, false);
    assert.match(result.contaminationReason, /must be excluded/);
    assert.deepEqual(result.diagnostics.map(item => item.diagnosticKind), [
      'quota-recovery', 'router-attack',
    ]);
  });

  it('retains diagnostic cache creation in the all-turn total', () => {
    const partition = partitionShadowTurns(FIXTURE.turns);
    assert.equal(partition.formalCacheCreationTokens, 18000);
    assert.equal(partition.diagnosticCacheCreationTokens, 1500);
    assert.equal(partition.totalCacheCreationTokens, 19500);
    const result = summarizeFormalJourney(FIXTURE);
    assert.equal(result.totalCacheCreationTokens, 19500);
  });

  it('fails closed when a turn is unclassified or a diagnostic label is unknown', () => {
    assert.throws(() => partitionShadowTurns([
      { totalCacheCreationTokens: 1 },
    ]), /must declare sampleClass/);
    assert.throws(() => partitionShadowTurns([{
      sampleClass: 'diagnostic', diagnosticKind: 'formal-looking-retry',
      computeClass: 'diagnostic', role: 'diagnostic',
      totalCacheCreationTokens: 1, totalCacheReadTokens: 0, outputTokens: 0,
      elapsedMs: 1, providerListCost: 0,
    }]), /unsupported diagnosticKind/);
  });
});
