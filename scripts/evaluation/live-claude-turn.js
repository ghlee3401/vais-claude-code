#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function option(argv, name, required = false) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? argv[index + 1] : null;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function canonical(value) {
  if (Array.isArray(value)) {
    const normalized = value.map(canonical);
    return normalized.every(item => ['string', 'number', 'boolean'].includes(typeof item))
      ? [...new Set(normalized)].sort() : normalized;
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
}

function loadToolProfile(target) {
  const source = JSON.parse(fs.readFileSync(path.resolve(target), 'utf8'));
  const keys = Object.keys(source || {});
  const supported = new Set(['allowedTools', 'disallowedTools', 'permissionMode', 'strictMcpConfig']);
  const toolPattern = /^[A-Za-z][A-Za-z0-9_.:-]*(?:\([A-Za-z0-9_./:*?=-]+\))?$/;
  if (!source || typeof source !== 'object' || Array.isArray(source) || keys.some(key => !supported.has(key)) ||
    source.permissionMode !== 'bypassPermissions' || source.strictMcpConfig !== true ||
    !Array.isArray(source.allowedTools) || source.allowedTools.length === 0 ||
    !Array.isArray(source.disallowedTools) ||
    [...source.allowedTools, ...source.disallowedTools].some(tool => typeof tool !== 'string' || !tool.trim() ||
      tool !== tool.trim() || !toolPattern.test(tool))) {
    throw new Error('Tool profile requires only permissionMode=bypassPermissions, strictMcpConfig=true, and non-empty allowedTools/disallowedTools arrays');
  }
  const normalized = canonical(source);
  if (normalized.allowedTools.some(tool => normalized.disallowedTools.includes(tool))) {
    throw new Error('Tool profile cannot both allow and disallow the same tool');
  }
  const body = `${JSON.stringify(normalized, null, 2)}\n`;
  return { profile: normalized, digest: crypto.createHash('sha256').update(body).digest('hex') };
}

function toolProfileArgs(profile) {
  const args = ['--permission-mode', profile.permissionMode, '--dangerously-skip-permissions'];
  if (profile.strictMcpConfig) args.push('--strict-mcp-config');
  if (profile.allowedTools.length) args.push('--allowedTools', profile.allowedTools.join(','));
  if (profile.disallowedTools.length) args.push('--disallowedTools', profile.disallowedTools.join(','));
  return args;
}

function classifyTurn(argv) {
  const sampleClass = option(argv, 'sample-class', true);
  if (!['formal', 'diagnostic'].includes(sampleClass)) {
    throw new Error('--sample-class must be formal or diagnostic');
  }
  const diagnosticKind = option(argv, 'diagnostic-kind');
  const computeClass = option(argv, 'compute-class', true);
  const role = option(argv, 'role', true);
  if (!['delivery', 'assurance', 'diagnostic'].includes(computeClass)) {
    throw new Error('--compute-class must be delivery, assurance, or diagnostic');
  }
  if (sampleClass === 'formal' && diagnosticKind) {
    throw new Error('--diagnostic-kind is allowed only for diagnostic samples');
  }
  if (sampleClass === 'diagnostic' && !diagnosticKind) {
    throw new Error('--diagnostic-kind is required for diagnostic samples');
  }
  if ((sampleClass === 'diagnostic') !== (computeClass === 'diagnostic')) {
    throw new Error('--sample-class and --compute-class disagree');
  }
  const assuranceRole = ['independent-qa', 'review-owner'].includes(role);
  if (sampleClass === 'formal' && assuranceRole !== (computeClass === 'assurance')) {
    throw new Error('--role and --compute-class disagree');
  }
  return {
    sampleClass,
    computeClass,
    role,
    diagnosticKind: diagnosticKind || null,
    journeyId: option(argv, 'journey-id'),
  };
}

function summarizeModelUsage(modelUsage = {}) {
  const models = Object.values(modelUsage || {});
  return {
    totalCacheCreationTokens: models.reduce(
      (total, model) => total + Number(model?.cacheCreationInputTokens || 0), 0),
    totalCacheReadTokens: models.reduce(
      (total, model) => total + Number(model?.cacheReadInputTokens || 0), 0),
    outputTokens: models.reduce(
      (total, model) => total + Number(model?.outputTokens || 0), 0),
    modelCount: models.length,
  };
}

function summarizeTopLevelUsage(usage = {}) {
  const number = (...names) => {
    const key = names.find(name => usage?.[name] !== undefined);
    return Number(key ? usage[key] : 0);
  };
  return {
    totalCacheCreationTokens: number('cacheCreationInputTokens', 'cache_creation_input_tokens'),
    totalCacheReadTokens: number('cacheReadInputTokens', 'cache_read_input_tokens'),
    outputTokens: number('outputTokens', 'output_tokens'),
  };
}

function splitProviderUsage(parsed) {
  const total = summarizeModelUsage(parsed?.modelUsage);
  const delivery = summarizeTopLevelUsage(parsed?.usage);
  const assurance = {
    totalCacheCreationTokens: total.totalCacheCreationTokens - delivery.totalCacheCreationTokens,
    totalCacheReadTokens: total.totalCacheReadTokens - delivery.totalCacheReadTokens,
    outputTokens: total.outputTokens - delivery.outputTokens,
  };
  const values = [...Object.values(delivery), ...Object.values(assurance)];
  if (!parsed?.usage || values.some(value => !Number.isInteger(value) || value < 0)) {
    throw new Error('Provider usage cannot be split into non-negative delivery and assurance totals');
  }
  return { total, delivery, assurance };
}

function projectsRoot() {
  const config = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(config, 'projects');
}

function findSessionTranscript(sessionId, root = projectsRoot()) {
  if (!/^[a-f0-9-]{36}$/i.test(sessionId || '') || !fs.existsSync(root)) return null;
  const matches = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(root, entry.name, `${sessionId}.jsonl`))
    .filter(target => fs.existsSync(target) && fs.lstatSync(target).isFile() && !fs.lstatSync(target).isSymbolicLink());
  if (matches.length > 1) throw new Error(`Claude session transcript is ambiguous: ${sessionId}`);
  return matches[0] || null;
}

function transcriptCheckpoint(sessionId, root = projectsRoot()) {
  const transcript = findSessionTranscript(sessionId, root);
  if (!transcript) return null;
  const agentDirectory = path.join(path.dirname(transcript), sessionId, 'subagents');
  const agentFiles = new Map();
  if (fs.existsSync(agentDirectory)) {
    for (const name of fs.readdirSync(agentDirectory).filter(name => name.endsWith('.jsonl'))) {
      const target = path.join(agentDirectory, name);
      if (fs.lstatSync(target).isFile() && !fs.lstatSync(target).isSymbolicLink()) {
        agentFiles.set(name, fs.statSync(target).size);
      }
    }
  }
  return { transcript, bytes: fs.statSync(transcript).size, agentDirectory, agentFiles };
}

function parseJsonLines(buffer, label) {
  const rows = [];
  for (const [index, line] of buffer.toString('utf8').split('\n').entries()) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch (error) {
      throw new Error(`${label} contains invalid JSONL at line ${index + 1}: ${error.message}`);
    }
  }
  return rows;
}

function aggregateAgentTranscript(target) {
  if (!fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink() || !fs.lstatSync(target).isFile()) {
    throw new Error(`Agent transcript is unavailable: ${target}`);
  }
  const bytes = fs.readFileSync(target);
  const requests = new Map();
  for (const row of parseJsonLines(bytes, 'Agent transcript')) {
    if (row.type !== 'assistant' || !row.requestId || !row.message?.usage) continue;
    const usage = summarizeTopLevelUsage(row.message.usage);
    const candidate = { index: Number(row.apiBlockIndex || 0), model: row.message.model, usage };
    const previous = requests.get(row.requestId);
    if (!previous || candidate.index >= previous.index) requests.set(row.requestId, candidate);
  }
  if (requests.size === 0) throw new Error(`Agent transcript has no provider usage: ${target}`);
  const models = [...new Set([...requests.values()].map(item => item.model))];
  if (models.length !== 1 || typeof models[0] !== 'string') {
    throw new Error(`Agent transcript must use exactly one model: ${target}`);
  }
  const usage = [...requests.values()].reduce((total, item) => ({
    totalCacheCreationTokens: total.totalCacheCreationTokens + item.usage.totalCacheCreationTokens,
    totalCacheReadTokens: total.totalCacheReadTokens + item.usage.totalCacheReadTokens,
    outputTokens: total.outputTokens + item.usage.outputTokens,
  }), { totalCacheCreationTokens: 0, totalCacheReadTokens: 0, outputTokens: 0 });
  return {
    model: models[0],
    requestCount: requests.size,
    usage,
    transcriptDigest: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

function assignmentIdentity(prompt) {
  try {
    const parsed = JSON.parse(prompt);
    return {
      assignmentId: parsed.assignmentReceipt?.id || null,
      role: parsed.assignment?.role || parsed.assignmentReceipt?.role || null,
    };
  } catch {
    return { assignmentId: null, role: null };
  }
}

function collectAgentSegments(sessionId, checkpoint, expected, root = projectsRoot()) {
  const current = transcriptCheckpoint(sessionId, root);
  if (!current) throw new Error(`Claude session transcript is unavailable: ${sessionId}`);
  if (checkpoint && path.resolve(checkpoint.transcript) !== path.resolve(current.transcript)) {
    throw new Error('Claude session transcript changed location during the turn');
  }
  const start = checkpoint?.bytes || 0;
  const parentBytes = fs.readFileSync(current.transcript);
  if (start > parentBytes.length) throw new Error('Claude session transcript shrank during the turn');
  const results = [];
  for (const row of parseJsonLines(parentBytes.subarray(start), 'Claude turn transcript')) {
    const toolResult = row.toolUseResult;
    if (!toolResult?.agentId || !toolResult?.agentType) continue;
    const identity = assignmentIdentity(toolResult.prompt);
    results.push({
      agentId: toolResult.agentId,
      toolUseId: row.message?.content?.find?.(block => block?.type === 'tool_result')?.tool_use_id || null,
      agentType: toolResult.agentType,
      status: toolResult.status,
      ...identity,
    });
  }
  const unique = new Map(results.map(result => [result.agentId, result]));
  const spawned = Number(expected?.spawned || 0);
  if (unique.size !== spawned || Number(expected?.completed || 0) !== spawned || Number(expected?.failed || 0) !== 0) {
    throw new Error(`Provider Agent results do not match subagent_stats: expected ${spawned}, found ${unique.size}`);
  }
  return [...unique.values()].map(result => {
    const name = `agent-${result.agentId}.jsonl`;
    if (checkpoint?.agentFiles?.has(name)) {
      throw new Error(`Formal turn reused a pre-existing Agent transcript: ${result.agentId}`);
    }
    const target = path.join(current.agentDirectory, name);
    const aggregate = aggregateAgentTranscript(target);
    return { ...result, ...aggregate };
  });
}

function main(argv = process.argv.slice(2)) {
  const plugin = path.resolve(option(argv, 'plugin', true));
  const output = path.resolve(option(argv, 'output', true));
  const prompt = option(argv, 'prompt', true);
  const turn = classifyTurn(argv);
  const toolProfile = loadToolProfile(option(argv, 'tool-profile', true));
  const resume = option(argv, 'resume');
  const maxBudget = option(argv, 'max-budget');
  const timeoutMs = Number(option(argv, 'timeout-ms') || '900000');
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error('--timeout-ms must be a positive integer');
  const args = [
    '-p', '--plugin-dir', plugin, '--model', option(argv, 'model') || 'opus',
    '--effort', option(argv, 'effort') || 'low', ...toolProfileArgs(toolProfile.profile),
    '--output-format', 'json',
  ];
  if (maxBudget) args.splice(args.length - 2, 0, '--max-budget-usd', maxBudget);
  if (resume) args.push('--resume', resume);
  args.push(prompt);
  const checkpoint = resume ? transcriptCheckpoint(resume) : null;
  if (resume && !checkpoint) throw new Error(`Claude session transcript is unavailable before resume: ${resume}`);
  const result = spawnSync('claude', args, {
    cwd: process.cwd(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs,
  });
  if (result.error) throw result.error;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, result.stdout, 'utf8');
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    return result.status || 1;
  }
  const parsed = JSON.parse(result.stdout);
  const split = splitProviderUsage(parsed);
  const agentSegments = Number(parsed.subagent_stats?.spawned || 0) > 0
    ? collectAgentSegments(parsed.session_id, checkpoint, parsed.subagent_stats)
    : [];
  const captured = { ...parsed, evaluationMetadata: {
    ...turn, toolProfileDigest: toolProfile.digest, agentSegments,
  } };
  const capturedBody = `${JSON.stringify(captured, null, 2)}\n`;
  fs.writeFileSync(output, capturedBody, 'utf8');
  const usage = split.total;
  process.stdout.write(`${JSON.stringify({
    ...turn,
    toolProfileDigest: toolProfile.digest,
    sessionId: parsed.session_id,
    terminalReason: parsed.terminal_reason,
    instructionTokens: usage.totalCacheCreationTokens,
    totalCacheCreationTokens: usage.totalCacheCreationTokens,
    totalCacheReadTokens: usage.totalCacheReadTokens,
    outputTokens: usage.outputTokens,
    elapsedMs: Number(parsed.duration_ms || 0),
    providerListCost: Number(parsed.total_cost_usd || 0),
    modelCount: usage.modelCount,
    deliveryCacheCreationTokens: split.delivery.totalCacheCreationTokens,
    assuranceCacheCreationTokens: split.assurance.totalCacheCreationTokens,
    agentCalls: parsed.subagent_stats?.spawned || 0,
    turns: parsed.num_turns || 0,
    telemetryDigest: crypto.createHash('sha256').update(capturedBody).digest('hex'),
    result: parsed.result,
  })}\n`);
  return 0;
}

if (require.main === module) {
  try { process.exitCode = main(); } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  canonical,
  loadToolProfile,
  toolProfileArgs,
  classifyTurn,
  summarizeModelUsage,
  summarizeTopLevelUsage,
  splitProviderUsage,
  findSessionTranscript,
  transcriptCheckpoint,
  aggregateAgentTranscript,
  assignmentIdentity,
  collectAgentSegments,
  main,
};
