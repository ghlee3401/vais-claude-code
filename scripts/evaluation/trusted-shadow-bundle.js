#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { buildFormalTelemetryEvidence } = require('./formal-telemetry');
const { loadToolProfile } = require('./live-claude-turn');
const { evaluateLiveEvidence } = require('../../lib/evaluation/v2-shadow');
const { loadWorkload, verifyAdapterProof } = require('./formal-workload');

const EXECUTION_ORDER = Object.freeze(['legacy:1', 'v2:1', 'legacy:2', 'v2:2', 'legacy:3', 'v2:3']);

class CollectionBlockedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function filesUnder(root) {
  const base = path.resolve(root);
  if (!fs.existsSync(base) || fs.lstatSync(base).isSymbolicLink() || !fs.lstatSync(base).isDirectory()) {
    throw new CollectionBlockedError('SOURCE_UNAVAILABLE', `Required directory is unavailable: ${base}`);
  }
  const files = [];
  const visit = directory => {
    for (const name of fs.readdirSync(directory).sort()) {
      const target = path.join(directory, name);
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) throw new CollectionBlockedError('SYMLINK_UNTRUSTED', `Symlink is not trusted: ${target}`);
      if (stat.isDirectory()) visit(target);
      else if (stat.isFile()) {
        const bytes = fs.readFileSync(target);
        files.push({ path: path.relative(base, target).split(path.sep).join('/'), bytes: bytes.length, digest: sha256(bytes) });
      }
    }
  };
  visit(base);
  return files;
}

function trustedFile(runDirectory, relative, label) {
  const base = path.resolve(runDirectory);
  const target = path.resolve(base, relative);
  if (target === base || !target.startsWith(`${base}${path.sep}`)) {
    throw new CollectionBlockedError('CAPTURE_UNTRUSTED', `${label} is outside its isolated run`);
  }
  let cursor = base;
  for (const component of path.relative(base, target).split(path.sep)) {
    cursor = path.join(cursor, component);
    if (!fs.existsSync(cursor) || fs.lstatSync(cursor).isSymbolicLink()) {
      throw new CollectionBlockedError('CAPTURE_UNTRUSTED', `${label} contains an unavailable or symbolic path component`);
    }
  }
  const realBase = fs.realpathSync(base);
  const realTarget = fs.realpathSync(target);
  if (!realTarget.startsWith(`${realBase}${path.sep}`) || !fs.lstatSync(target).isFile()) {
    throw new CollectionBlockedError('CAPTURE_UNTRUSTED', `${label} is not a regular file inside its isolated run`);
  }
  return realTarget;
}

function trustedDirectory(runDirectory, relative, label) {
  const base = path.resolve(runDirectory);
  const target = path.resolve(base, relative);
  if (target === base || !target.startsWith(`${base}${path.sep}`)) {
    throw new CollectionBlockedError('SOURCE_UNTRUSTED', `${label} is outside its isolated run`);
  }
  let cursor = base;
  for (const component of path.relative(base, target).split(path.sep)) {
    cursor = path.join(cursor, component);
    if (!fs.existsSync(cursor) || fs.lstatSync(cursor).isSymbolicLink()) {
      throw new CollectionBlockedError('SOURCE_UNTRUSTED', `${label} contains an unavailable or symbolic path component`);
    }
  }
  const realBase = fs.realpathSync(base);
  const realTarget = fs.realpathSync(target);
  if (!realTarget.startsWith(`${realBase}${path.sep}`) || !fs.lstatSync(target).isDirectory()) {
    throw new CollectionBlockedError('SOURCE_UNTRUSTED', `${label} is not a directory inside its isolated run`);
  }
  return realTarget;
}

function recursiveManifest(root) {
  const files = filesUnder(root);
  return { digest: sha256(JSON.stringify(files)), fileCount: files.length, files };
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

function writeJson(root, relative, value) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const body = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(target, body, 'utf8');
  return { path: relative.split(path.sep).join('/'), digest: sha256(body) };
}

function readJson(target, label) {
  try {
    if (fs.lstatSync(target).isSymbolicLink()) throw new Error('symbolic link');
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    throw new CollectionBlockedError('SOURCE_INVALID', `${label} is unavailable or invalid: ${error.message}`);
  }
}

function buildCohort(output, options) {
  const legacy = recursiveManifest(options.legacyStage);
  const v2 = recursiveManifest(options.v2Stage);
  if (!fs.existsSync(options.fixture) || fs.lstatSync(options.fixture).isSymbolicLink()) {
    throw new CollectionBlockedError('SOURCE_UNAVAILABLE', 'Fixture must not be a symbolic link');
  }
  const fixture = fs.statSync(options.fixture).isDirectory() ? recursiveManifest(options.fixture) : (() => {
    const bytes = fs.readFileSync(options.fixture);
    return { digest: sha256(bytes), fileCount: 1, files: [{ path: path.basename(options.fixture), bytes: bytes.length, digest: sha256(bytes) }] };
  })();
  if (legacy.digest === v2.digest) {
    throw new CollectionBlockedError('STAGE_COLLISION', 'Legacy and v2 stages must be distinct immutable trees');
  }
  const workloadInfo = loadWorkload(options.workload);
  if (workloadInfo.value.fixture.rootDigest !== fixture.digest ||
    workloadInfo.value.scenario !== options.scenario) {
    throw new CollectionBlockedError('WORKLOAD_MISMATCH', 'Canonical workload does not match the fixture or scenario');
  }
  const journeyBudget = options.journeyBudget === null || options.journeyBudget === undefined
    ? null : Number(options.journeyBudget);
  if (journeyBudget !== null && (!Number.isFinite(journeyBudget) || journeyBudget <= 0)) {
    throw new CollectionBlockedError('BUDGET_INVALID', 'Journey budget must be a positive number');
  }
  const budgetPolicy = journeyBudget === null ? 'subscription-no-dollar-cap' : 'provider-list-cost-cap';
  const turnTimeoutMs = Number(options.turnTimeoutMs || 900000);
  if (!Number.isInteger(turnTimeoutMs) || turnTimeoutMs <= 0) {
    throw new CollectionBlockedError('TIMEOUT_INVALID', 'Turn timeout must be a positive integer');
  }
  const cohortNonce = options.cohortNonce || sha256(path.resolve(output)).slice(0, 32);
  if (!/^[a-f0-9]{32}$/.test(cohortNonce)) {
    throw new CollectionBlockedError('COHORT_NONCE_INVALID', 'Cohort nonce must be 32 lowercase hex characters');
  }
  const stage = writeJson(output, 'cohort/stage.json', {
    schema: 'live-shadow-stage/v1', fixtureDigest: fixture.digest,
    fixture: { rootDigest: fixture.digest, fileCount: fixture.fileCount, files: fixture.files },
    legacy: { rootDigest: legacy.digest, fileCount: legacy.fileCount, files: legacy.files },
    v2: { rootDigest: v2.digest, fileCount: v2.fileCount, files: v2.files },
  });
  let normalizedProfile;
  try {
    normalizedProfile = loadToolProfile(options.toolProfile).profile;
  } catch (error) {
    throw new CollectionBlockedError('TOOL_PROFILE_INVALID', error.message);
  }
  const toolProfile = writeJson(output, 'cohort/tool-profile.json', normalizedProfile);
  const workload = writeJson(output, 'cohort/workload.json', workloadInfo.value);
  const id = `cohort-${sha256(JSON.stringify({
    stage: stage.digest,
    toolProfile: toolProfile.digest,
    workload: workload.digest,
    model: options.model,
    effort: options.effort,
    budgetPolicy,
    turnTimeoutMs,
    journeyBudget,
    cohortNonce,
    executionOrder: EXECUTION_ORDER,
  })).slice(0, 24)}`;
  return {
    cohort: {
      id, nonce: cohortNonce, scenario: options.scenario, stage, model: options.model, effort: options.effort,
      toolProfile, workload, budgetPolicy, turnTimeoutMs,
      ...(journeyBudget === null ? {} : { journeyBudget }),
      executionOrder: [...EXECUTION_ORDER],
    },
    stageRoots: { legacy: legacy.digest, v2: v2.digest },
    normalizedProfile,
    workloadInfo,
  };
}

function classifyDocument(relative, authoredPaths = new Set()) {
  const normalized = relative.split(path.sep).join('/');
  if (/(^|\/)(?:_tmp|drafts?)(\/|$)|(?:^|\/)draft[^/]*\.md$/i.test(normalized)) return 'transient';
  if (authoredPaths.has(normalized)) return 'authored';
  // Approved revisions remain useful history, but EFF-03 deliberately counts
  // only the five canonical Phase mains as authored surface area.
  return 'derived';
}

function collectDocuments(output, runDirectory, runKey, cohortId, engine, requireComplete) {
  const source = trustedDirectory(runDirectory, path.join('workspace', 'docs'), `${runKey} documents`);
  const files = filesUnder(source).filter(file => file.path.endsWith('.md'));
  const authoredEntries = files.map(file => {
    const pattern = engine === 'v2'
      ? /^(.*\/)?(01-plan|02-design|03-do|04-(?:review|qa)|05-report)\/main\.md$/
      : /^(.*\/)?(01-plan|02-design|03-do|04-(?:review|qa)|05-report)\/[^/]+\.md$/;
    const match = file.path.match(pattern);
    return match ? { root: match[1] || '', phase: match[2].slice(0, 2), file } : null;
  }).filter(Boolean);
  const complete = authoredEntries.length >= 5 && new Set(authoredEntries.map(entry => entry.root)).size === 1 &&
    new Set(authoredEntries.map(entry => entry.phase)).size === 5 &&
    (engine !== 'v2' || authoredEntries.length === 5);
  if (requireComplete && !complete) {
    throw new CollectionBlockedError('CANONICAL_DOCUMENTS_INCOMPLETE',
      `${runKey} must contain native authored documents for all five phases under one Work item root`);
  }
  const authoredPaths = new Set(authoredEntries.map(entry => entry.file.path));
  const documents = [];
  for (const file of files) {
    const destination = path.join('runs', runKey.replace(':', '-'), 'documents', file.path);
    const bytes = fs.readFileSync(path.join(source, file.path));
    fs.mkdirSync(path.dirname(path.join(output, destination)), { recursive: true });
    fs.writeFileSync(path.join(output, destination), bytes);
    documents.push({ path: destination, digest: sha256(bytes), bytes: bytes.length,
      kind: classifyDocument(file.path, authoredPaths) });
  }
  const reference = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'document-manifest.json'), {
    cohortId, runKey, documents,
  });
  const values = kind => documents.filter(document => document.kind === kind);
  const authored = values('authored');
  const derived = values('derived');
  return { reference, values: {
    documentCount: documents.length,
    authoredDocumentCount: authored.length,
    derivedDocumentCount: derived.length,
    transientDraftCount: values('transient').length,
    documentBytes: documents.reduce((sum, item) => sum + item.bytes, 0),
    authoredDocumentBytes: authored.reduce((sum, item) => sum + item.bytes, 0),
    derivedDocumentBytes: derived.reduce((sum, item) => sum + item.bytes, 0),
  } };
}

function duplicateChecks(checks) {
  const groups = new Map();
  for (const check of checks) {
    const identity = [check.adapter, check.normalizedCommand, check.designRevision, check.repoSnapshotDigest].join('\u0000');
    const group = groups.get(identity) || { regular: 0, supplemental: 0 };
    if (check.supplemental === true) {
      if (!String(check.supplementalReason || '').trim()) {
        throw new CollectionBlockedError('CHECK_SOURCE_INVALID', 'Supplemental check is missing its reason');
      }
      group.supplemental += 1;
    } else group.regular += 1;
    groups.set(identity, group);
  }
  let duplicates = 0;
  for (const group of groups.values()) {
    if (group.regular === 0 && group.supplemental) {
      throw new CollectionBlockedError('CHECK_SOURCE_INVALID', 'Supplemental check has no primary identity');
    }
    duplicates += Math.max(0, group.regular - 1) + Math.max(0, group.supplemental - 1);
  }
  return duplicates;
}

function collectQualityObserver(output, runDirectory, runKey, source) {
  if (typeof source.qualityObserver !== 'string') {
    throw new CollectionBlockedError('QUALITY_OBSERVER_UNAVAILABLE', `${runKey} has no common quality observer`);
  }
  const target = trustedFile(runDirectory, source.qualityObserver, `${runKey} quality observer`);
  const value = readJson(target, `${runKey} quality observer`);
  const required = ['book-cancel', 'initial', 'invalid-login', 'login-book', 'password-reset'];
  if (value.schema !== 'vais-formal-quality-observer/v1' || value.fixture !== 'mini-booking' ||
    !['pass', 'fail', 'blocked'].includes(value.verdict) ||
    JSON.stringify(value.requiredScenarioIds) !== JSON.stringify(required) ||
    !Array.isArray(value.observedScenarioIds) || !Array.isArray(value.scenarios) ||
    (source.terminal?.quality === 'pass' && value.verdict !== 'pass')) {
    throw new CollectionBlockedError('QUALITY_OBSERVER_INVALID', `${runKey} quality observer is inconsistent`);
  }
  return writeJson(output, path.join('runs', runKey.replace(':', '-'), 'quality-observer.json'), value);
}

function collectAdapterSource(runDirectory, engine) {
  const name = engine === 'legacy' ? 'legacy-adapter.json' : 'v2-runtime.json';
  const target = path.join(runDirectory, name);
  if (!fs.existsSync(target)) {
    const code = engine === 'legacy' ? 'LEGACY_ADAPTER_UNAVAILABLE' : 'V2_RUNTIME_EVIDENCE_UNAVAILABLE';
    throw new CollectionBlockedError(code,
      `${engine} journey requires ${name}; automatic ${engine} execution is not inferred by the collector`);
  }
  const source = readJson(target, `${engine} adapter evidence`);
  if (source.schema !== `${engine}-journey-evidence/v1`) {
    throw new CollectionBlockedError('ADAPTER_CONTRACT_INVALID', `${name} has an unsupported schema`);
  }
  return source;
}

function collectRun(output, runDirectory, cohort, engine, repetition, trust) {
  const source = collectAdapterSource(runDirectory, engine);
  if (source.engine !== engine || source.repetition !== repetition || source.scenario !== cohort.scenario ||
    !['compact', 'standard', 'extended'].includes(source.scale)) {
    throw new CollectionBlockedError('RUN_IDENTITY_MISMATCH', `${engine}:${repetition} adapter identity is inconsistent`);
  }
  if (source.stageRootDigest !== trust.stageRoots[engine]) {
    throw new CollectionBlockedError('RUN_STAGE_MISMATCH', `${engine}:${repetition} did not use the trusted ${engine} stage`);
  }
  if (JSON.stringify(canonical(source.toolProfile)) !== JSON.stringify(trust.normalizedProfile)) {
    throw new CollectionBlockedError('RUN_TOOL_PROFILE_MISMATCH', `${engine}:${repetition} tool profile differs from the cohort`);
  }
  const runKey = `${engine}:${repetition}`;
  const expectedSequenceIndex = EXECUTION_ORDER.indexOf(runKey) + 1;
  if (source.sequenceIndex !== expectedSequenceIndex || source.model !== cohort.model ||
    source.effort !== cohort.effort || source.budgetPolicy !== cohort.budgetPolicy ||
    source.turnTimeoutMs !== cohort.turnTimeoutMs || source.journeyBudget !== cohort.journeyBudget) {
    throw new CollectionBlockedError('RUN_CONDITION_MISMATCH',
      `${runKey} model, effort, cost policy, timeout, budget, or order differs from the cohort`);
  }
  try {
    verifyAdapterProof(source.adapterProof, engine, trust.workloadInfo);
  } catch (error) {
    throw new CollectionBlockedError('ADAPTER_PROOF_INVALID', error.message);
  }
  const adapterManifest = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'adapter-manifest.json'), {
    cohortId: cohort.id, runKey, sequenceIndex: source.sequenceIndex,
    model: source.model, effort: source.effort, budgetPolicy: source.budgetPolicy,
    turnTimeoutMs: source.turnTimeoutMs,
    ...(source.journeyBudget === undefined ? {} : { journeyBudget: source.journeyBudget }),
    ...source.adapterProof,
  });
  const qualityObserver = collectQualityObserver(output, runDirectory, runKey, source);
  const assignments = source.assignments || [];
  const requiredAssignments = assignments.filter(item => item.required !== false)
    .map(item => ({ role: item.role, assignmentId: item.assignmentId }));
  const calls = assignments.filter(item => item.handoffStatus).map(item => ({
    role: item.role, assignmentId: item.assignmentId, handoffId: item.handoffId,
    status: item.handoffStatus,
  }));
  const agentManifest = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'agent-manifest.json'), {
    cohortId: cohort.id, runKey, requiredAssignments, calls,
  });
  const counts = new Map();
  calls.forEach(call => counts.set(call.assignmentId, (counts.get(call.assignmentId) || 0) + 1));
  const duplicateAgentCalls = [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const missingRequiredAgentCalls = requiredAssignments.filter(item => !counts.has(item.assignmentId)).length;
  const independentQaCalls = calls.filter(call => call.role === 'independent-qa').length;
  const agentPlanSatisfied = duplicateAgentCalls === 0 && missingRequiredAgentCalls === 0 &&
    requiredAssignments.length === calls.length && calls.every(call => call.status === 'completed');

  const runOutput = path.join(output, 'runs', runKey.replace(':', '-'));
  const captureOutput = path.join(runOutput, 'captures');
  fs.mkdirSync(captureOutput, { recursive: true });
  const captureNames = new Set();
  if (!Array.isArray(source.captures) || source.captures.length === 0) {
    throw new CollectionBlockedError('RAW_TELEMETRY_UNAVAILABLE', `${runKey} has no provider captures`);
  }
  const captureEntries = source.captures.map(relative => {
    const sourcePath = trustedFile(runDirectory, relative, `${runKey} capture`);
    const name = path.basename(relative);
    if (captureNames.has(name)) {
      throw new CollectionBlockedError('CAPTURE_UNTRUSTED', `${runKey} contains colliding capture names`);
    }
    captureNames.add(name);
    const target = path.join(captureOutput, name);
    fs.copyFileSync(sourcePath, target);
    return { relative, target };
  });
  const captures = captureEntries.map(entry => entry.target);
  const qa = calls.find(call => call.role === 'independent-qa');
  if (qa && (typeof source.assuranceCapture !== 'string' ||
    !source.captures.includes(source.assuranceCapture))) {
    throw new CollectionBlockedError('ASSURANCE_TELEMETRY_UNAVAILABLE',
      `${runKey} independent QA has no exact provider capture binding`);
  }
  const assuranceRawPath = source.assuranceCapture
    ? captureEntries.find(entry => entry.relative === source.assuranceCapture)?.target : undefined;
  const telemetry = buildFormalTelemetryEvidence(runOutput, {
    cohort, engine, repetition, rawPaths: captures,
    ...(qa ? { qaAssignment: { role: qa.role, assignmentId: qa.assignmentId } } : {}),
    ...(qa ? { agentAssignments: calls } : {}),
    ...(assuranceRawPath ? { assuranceRawPath } : {}),
  });
  telemetry.reference.path = path.join('runs', runKey.replace(':', '-'), telemetry.reference.path).split(path.sep).join('/');
  telemetry.telemetry.turns.forEach(turn => {
    turn.path = path.join('runs', runKey.replace(':', '-'), turn.path).split(path.sep).join('/');
  });
  telemetry.reference = writeJson(output, telemetry.reference.path, telemetry.telemetry);

  const documents = collectDocuments(output, runDirectory, runKey, cohort.id, engine,
    source.terminal?.quality === 'pass');
  const checks = source.checks || [];
  const duplicateCheckCount = duplicateChecks(checks);
  const checkManifest = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'check-manifest.json'), {
    cohortId: cohort.id, runKey, checks,
  });
  const attempts = source.contractAttempts || [];
  const contractRetryCount = attempts.filter(item => item.outcome !== 'pass').length;
  const errors = new Map();
  let sameErrorRepeatCount = 0;
  for (const attempt of attempts.filter(item => item.outcome !== 'pass')) {
    const key = `${attempt.transactionId}\u0000${attempt.errorFingerprint}`;
    const count = (errors.get(key) || 0) + 1;
    errors.set(key, count);
    if (count > 1) sameErrorRepeatCount += 1;
  }
  const contractManifest = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'contract-manifest.json'), {
    cohortId: cohort.id, runKey, attempts,
  });
  const userTurns = source.userTurns || [];
  if (JSON.stringify(userTurns.map(turn => turn.kind)) !==
    JSON.stringify(source.adapterProof.prompts.map(prompt => prompt.kind))) {
    throw new CollectionBlockedError('USER_TURN_MISMATCH', `${runKey} user turns do not match its adapter proof`);
  }
  const standaloneReviewProgressTurnCount = userTurns.filter(turn => turn.kind === 'review-progress').length;
  const userTurnManifest = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'user-turn-manifest.json'), {
    cohortId: cohort.id, runKey, turns: userTurns,
  });
  const terminal = source.terminal || {};
  const terminalEvidence = writeJson(output, path.join('runs', runKey.replace(':', '-'), 'terminal.json'), {
    cohortId: cohort.id, runKey, terminalStatus: terminal.terminalStatus,
    quality: terminal.quality, reportFrozen: terminal.reportFrozen === true,
  });
  return {
    cohortId: cohort.id, scenario: cohort.scenario, scale: source.scale, repetition, engine,
    sampleClass: 'formal', quality: terminal.quality, terminalStatus: terminal.terminalStatus,
    instructionTokens: telemetry.telemetry.instructionTokens,
    deliveryCacheCreationTokens: telemetry.telemetry.deliveryCacheCreationTokens,
    assuranceCacheCreationTokens: telemetry.telemetry.assuranceCacheCreationTokens,
    totalCacheCreationTokens: telemetry.telemetry.totalCacheCreationTokens,
    totalCacheReadTokens: telemetry.telemetry.totalCacheReadTokens,
    outputTokens: telemetry.telemetry.outputTokens, elapsedMs: telemetry.telemetry.elapsedMs,
    providerListCost: telemetry.telemetry.providerListCost,
    diagnosticCacheCreationTokens: 0, formalTurnCount: telemetry.telemetry.formalTurnCount, diagnosticTurnCount: 0,
    agentCalls: calls.length, requiredAgentCalls: requiredAssignments.length, duplicateAgentCalls,
    missingRequiredAgentCalls, independentQaCalls, agentPlanSatisfied, agentManifest,
    ...documents.values, documentManifest: documents.reference,
    rawTelemetry: telemetry.reference, terminalEvidence, telemetryDigest: telemetry.reference.digest,
    duplicateCheckCount, checkManifest, contractRetryCount, sameErrorRepeatCount, contractManifest,
    standaloneReviewProgressTurnCount, userTurnCount: userTurns.length, userTurnManifest,
    adapterManifest, qualityObserver,
  };
}

function assembleTrustedBundle(options) {
  const output = path.resolve(options.output);
  if (fs.existsSync(output) && fs.readdirSync(output).length) {
    throw new CollectionBlockedError('OUTPUT_NOT_EMPTY', 'Trusted evidence output must be empty');
  }
  fs.mkdirSync(output, { recursive: true });
  const trust = buildCohort(output, options);
  const cohort = trust.cohort;
  const runs = [];
  for (const [index, runKey] of EXECUTION_ORDER.entries()) {
    const [engine, repetitionText] = runKey.split(':');
    const repetition = Number(repetitionText);
    const run = collectRun(output, path.join(options.runsRoot, `${engine}-${repetition}`),
      cohort, engine, repetition, trust);
    if (run.adapterManifest && index + 1 !== EXECUTION_ORDER.indexOf(runKey) + 1) {
      throw new CollectionBlockedError('RUN_ORDER_MISMATCH', 'Formal run order is inconsistent');
    }
    runs.push(run);
  }
  const evidence = { schemaVersion: '2.2', fixture: 'mini-booking', cohort, runs };
  const reference = writeJson(output, 'live-shadow-evidence.json', evidence);
  const evaluation = evaluateLiveEvidence(evidence, { evidenceRoot: output });
  if (['unavailable', 'incomplete', 'legacy-format'].includes(evaluation.status)) {
    throw new CollectionBlockedError('ASSEMBLED_EVIDENCE_INCOMPLETE', evaluation.reason || 'Assembled evidence is incomplete');
  }
  if (evaluation.status === 'invalid') {
    const error = new Error(evaluation.reason || 'Assembled evidence is invalid');
    error.code = 'ASSEMBLED_EVIDENCE_INVALID';
    throw error;
  }
  return { output, reference, evidence, evaluation };
}

function option(argv, name, required = false) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? argv[index + 1] : null;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function main(argv = process.argv.slice(2)) {
  try {
    const result = assembleTrustedBundle({
      legacyStage: option(argv, 'legacy-stage', true), v2Stage: option(argv, 'v2-stage', true),
      fixture: option(argv, 'fixture', true), toolProfile: option(argv, 'tool-profile', true),
      workload: option(argv, 'workload', true),
      runsRoot: option(argv, 'runs-root', true), output: option(argv, 'output', true),
      scenario: option(argv, 'scenario') || 'booking-cancellation-full-journey',
      model: option(argv, 'model', true), effort: option(argv, 'effort') || 'low',
      journeyBudget: option(argv, 'max-budget'),
      turnTimeoutMs: option(argv, 'turn-timeout-ms') || '900000',
      cohortNonce: option(argv, 'cohort-nonce'),
    });
    const verdict = result.evaluation.pass ? 'pass' : 'fail';
    process.stdout.write(`${JSON.stringify({ verdict, evidence: result.reference })}\n`);
    return verdict === 'pass' ? 0 : 1;
  } catch (error) {
    const blocked = error instanceof CollectionBlockedError;
    process.stdout.write(`${JSON.stringify({ verdict: blocked ? 'blocked' : 'fail', code: error.code || 'COLLECTOR_FAILED', reason: error.message })}\n`);
    return blocked ? 2 : 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = {
  CollectionBlockedError,
  recursiveManifest,
  canonical,
  duplicateChecks,
  collectQualityObserver,
  EXECUTION_ORDER,
  buildCohort,
  trustedFile,
  trustedDirectory,
  assembleTrustedBundle,
  main,
};
