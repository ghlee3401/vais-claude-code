'use strict';

const path = require('path');
const { EventLogger } = require('../observability/event-logger');
const { classifyRequest, hashRequest, redactRequestSummary } = require('./profile-classifier');

const DEFAULT_EVENT_LOG = '.vais/event-log.jsonl';

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
    now,
  } = options || {};

  if (!isShadowEnabled(config)) return { skipped: true, reason: 'shadow-disabled' };
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { skipped: true, reason: 'empty-request' };
  }

  const requestHash = hashRequest(rawText);
  const redacted = redactRequestSummary(rawText);
  const classification = classifyRequest(rawText, context);
  const effectiveRunId = runId || createRunId(requestHash, now);
  const result = {
    schemaVersion: '1.0',
    classifierVersion: classification.classifierVersion,
    mode: 'shadow',
    runId: effectiveRunId,
    feature: normalizeFeature(feature),
    host,
    sessionId,
    request: {
      hash: requestHash,
      summary: redacted.summary,
      redactionApplied: redacted.applied,
      redactedFields: redacted.fields,
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

  const logger = eventLogger || new EventLogger(resolveEventLogPath(config, baseDir));
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
  normalizeFeature,
  createRunId,
  isShadowEnabled,
  resolveEventLogPath,
  runShadowAnalysis,
};
