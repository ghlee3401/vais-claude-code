'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EventLogger } = require('../observability/event-logger');
const {
  classifyRequest,
  createRequestDigest,
  detectSensitiveFields,
  buildStructuralSummary,
} = require('./profile-classifier');

const DEFAULT_EVENT_LOG = '.vais/event-log.jsonl';
const DEFAULT_ARCHIVE_PATH = '.vais/archive/';
const DIGEST_KEY_FILE = path.join('.vais', 'state', 'shadow-digest.key');

function normalizeFeature(feature) {
  const value = String(feature || 'unscoped').trim();
  const safe = value.replace(/[^a-zA-Z0-9가-힣_-]/g, '-').replace(/-+/g, '-').slice(0, 100);
  return safe || 'unscoped';
}

function createRunId(requestHash, now = Date.now()) {
  return `shadow-${now.toString(36)}-${requestHash.slice(0, 12)}`;
}

function isShadowEnabled(config = {}) {
  const workflow = config.workflow || {};
  const engine = workflow.engine || config.engine;
  const profile = workflow.profile || config.profile;
  return engine === 'legacy' && profile?.mode === 'shadow';
}

function resolveEventLogPath(config = {}, baseDir = process.cwd()) {
  const configured = config.observability?.eventLog || DEFAULT_EVENT_LOG;
  return path.isAbsolute(configured) ? configured : path.resolve(baseDir, configured);
}

// Relative observability paths are always anchored to the project root, not
// to whatever cwd the hook process happens to run in.
function buildRotationConfig(config = {}, baseDir = process.cwd()) {
  const observability = config.observability || {};
  const rotation = {};
  if (Number.isFinite(observability.maxEventLogSizeMB)) rotation.maxSizeMB = observability.maxEventLogSizeMB;
  if (Number.isFinite(observability.rotateAfterDays)) rotation.rotateAfterDays = observability.rotateAfterDays;
  const archivePath = observability.archivePath || DEFAULT_ARCHIVE_PATH;
  rotation.archivePath = path.isAbsolute(archivePath) ? archivePath : path.resolve(baseDir, archivePath);
  return rotation;
}

// The digest key never enters the event log. A per-project persistent key keeps
// repeated prompts correlatable within one project; if the key cannot be
// persisted we fail open to an ephemeral key, which keeps the digest opaque but
// gives up cross-run correlation.
function loadOrCreateDigestKey(baseDir = process.cwd()) {
  try {
    const keyPath = path.resolve(baseDir, DIGEST_KEY_FILE);
    try {
      const existing = fs.readFileSync(keyPath, 'utf8').trim();
      if (/^[a-f0-9]{64}$/.test(existing)) return Buffer.from(existing, 'hex');
    } catch (_) {
      // No usable key yet — create one below.
    }
    const key = crypto.randomBytes(32);
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(keyPath, key.toString('hex') + '\n', { mode: 0o600 });
    return key;
  } catch (_) {
    return crypto.randomBytes(32);
  }
}

function runShadowAnalysis(options) {
  const {
    rawText,
    feature,
    host = 'unknown',
    sessionId = null,
    runId,
    context = {},
    config = {},
    eventLogger,
    baseDir = process.cwd(),
    digestKey,
    now,
  } = options || {};

  if (!isShadowEnabled(config)) return { skipped: true, reason: 'shadow-disabled' };
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { skipped: true, reason: 'empty-request' };
  }

  const classification = classifyRequest(rawText, context);
  const requestDigest = createRequestDigest(rawText, digestKey || loadOrCreateDigestKey(baseDir));
  const sensitive = detectSensitiveFields(rawText);
  const effectiveRunId = runId || createRunId(requestDigest, now);
  const result = {
    schemaVersion: '1.0',
    classifierVersion: classification.classifierVersion,
    mode: 'shadow',
    runId: effectiveRunId,
    feature: normalizeFeature(feature),
    host,
    sessionId,
    request: {
      hash: requestDigest,
      summary: buildStructuralSummary(classification, rawText),
      redactionApplied: sensitive.applied,
      redactedFields: sensitive.fields,
      rawPersisted: false,
    },
    profile: classification.profile,
    assurance: classification.assurance,
    compileSignals: classification.compileSignals,
    phaseGraph: classification.phaseGraph,
    legacy: {
      engine: 'legacy',
      executionChanged: false,
    },
  };

  const logger = eventLogger
    || new EventLogger(resolveEventLogPath(config, baseDir), buildRotationConfig(config, baseDir));
  logger.log('classification.completed', {
    runId: result.runId,
    sessionId: result.sessionId,
    feature: result.feature,
    host: result.host,
    mode: result.mode,
    classifierVersion: result.classifierVersion,
    requestHash: result.request.hash,
    requestSummary: result.request.summary,
    redactionApplied: result.request.redactionApplied,
    redactedFields: result.request.redactedFields,
    profile: result.profile,
    assurance: result.assurance,
    compileSignals: result.compileSignals,
    phaseGraph: result.phaseGraph,
    legacyExecutionChanged: false,
  });

  return result;
}

module.exports = {
  DEFAULT_EVENT_LOG,
  DIGEST_KEY_FILE,
  normalizeFeature,
  createRunId,
  isShadowEnabled,
  resolveEventLogPath,
  buildRotationConfig,
  loadOrCreateDigestKey,
  runShadowAnalysis,
};
