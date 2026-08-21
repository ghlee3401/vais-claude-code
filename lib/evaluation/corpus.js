'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const taxonomy = require('../../contracts/workflow-taxonomy.json');
const { compilePhaseGraph, toEvaluationPhaseGraph } = require('../workflow/workflow-compiler');

const PROFILES = ['patch', 'feature', 'initiative'];
const PROFILE_RECOMMENDATIONS = [...PROFILES, 'unknown'];
const ASSURANCE_LEVELS = ['normal', 'high', 'regulated'];
const PHASES = ['ideation', 'plan', 'design', 'do', 'qa', 'report'];
const SPLITS = ['train', 'review', 'held-out'];
const REVIEW_STATUSES = ['pending-external', 'approved', 'changes-requested'];
const PROVENANCE_KINDS = ['synthetic', 'redacted-actual'];
const HELD_OUT_ANCHOR_HASH = '10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb';
const RISK_TRIGGERS = taxonomy.riskTriggers.map(item => item.id);
const TRIGGER_RULES = Object.fromEntries(taxonomy.riskTriggers.map(item => [item.id, item]));
const CRITICAL_CATEGORIES = [...taxonomy.criticalCategories];
const CHECK_IDS = taxonomy.checks.map(item => item.id);
const COMPILE_SIGNAL_KEYS = [
  'uiFlow', 'apiContract', 'dataModel', 'architecture', 'externalIntegration',
  'publicContract', 'multiArea', 'highUncertainty', 'newProduct', 'ceoAnalysisAvailable',
];
const PATCH_PROMOTION_SIGNALS = ['publicContract', 'dataModel', 'multiArea', 'highUncertainty', 'newProduct'];
const FEATURE_PROMOTION_SIGNALS = ['multiArea', 'highUncertainty', 'newProduct'];
const SENSITIVE_PATTERNS = [
  ['aws-access-key', /AKIA[0-9A-Z]{16}/],
  ['github-token', /gh[pousr]_[A-Za-z0-9]{20,}/],
  ['slack-token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['email-address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function push(errors, condition, message) {
  if (!condition) errors.push(message);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validatePhaseGraph(phaseGraph, location, errors) {
  push(errors, phaseGraph && typeof phaseGraph === 'object', location + ' must be an object');
  if (!phaseGraph || typeof phaseGraph !== 'object') return;
  const all = [];
  for (const group of ['required', 'conditional', 'notRequired']) {
    const values = phaseGraph[group];
    push(errors, Array.isArray(values), location + '.' + group + ' must be an array');
    if (!Array.isArray(values)) continue;
    for (const phase of values) {
      push(errors, PHASES.includes(phase), location + '.' + group + ' has invalid phase ' + phase);
      all.push(phase);
    }
  }
  push(errors, new Set(all).size === all.length, location + ' phases must not overlap');
  push(
    errors,
    PHASES.every(phase => all.includes(phase)) && all.length === PHASES.length,
    location + ' must classify every phase exactly once',
  );
}

function validateReview(review, location, errors) {
  push(errors, review && typeof review === 'object', location + '.review must be an object');
  if (!review || typeof review !== 'object') return;
  push(errors, REVIEW_STATUSES.includes(review.status), location + '.review.status is invalid');
  push(errors, typeof review.labeler === 'string' && review.labeler.length > 0, location + '.review.labeler is required');
  if (review.status === 'approved') {
    push(errors, typeof review.reviewer === 'string' && review.reviewer.length > 0, location + '.review.reviewer is required when approved');
    push(errors, typeof review.reviewedAt === 'string' && review.reviewedAt.length > 0, location + '.review.reviewedAt is required when approved');
  }
}

function validateProvenance(provenance, location, errors) {
  if (provenance === undefined) return;
  push(errors, provenance && typeof provenance === 'object', location + '.provenance must be an object');
  if (!provenance || typeof provenance !== 'object') return;
  push(errors, PROVENANCE_KINDS.includes(provenance.kind), location + '.provenance.kind is invalid');
  push(
    errors,
    typeof provenance.source === 'string' && provenance.source.length > 0,
    location + '.provenance.source is required',
  );
  push(errors, /^[a-f0-9]{64}$/.test(provenance.referenceHash || ''), location + '.provenance.referenceHash is invalid');
  push(errors, provenance.rawPersisted === false, location + '.provenance.rawPersisted must be false');
}

function findSensitiveKinds(value) {
  const serialized = JSON.stringify(value);
  return SENSITIVE_PATTERNS.filter(([, pattern]) => pattern.test(serialized)).map(([kind]) => kind);
}

function validateCompileSignals(signals, location, errors) {
  push(errors, signals && typeof signals === 'object' && !Array.isArray(signals), location + '.compileSignals must be an object');
  if (!signals || typeof signals !== 'object' || Array.isArray(signals)) return;
  for (const key of COMPILE_SIGNAL_KEYS) {
    push(errors, typeof signals[key] === 'boolean', location + '.compileSignals.' + key + ' must be boolean');
  }
  for (const key of Object.keys(signals)) {
    push(errors, COMPILE_SIGNAL_KEYS.includes(key), location + '.compileSignals has unknown signal ' + key);
  }
}

function compileExpectedPhaseGraph(profile, signals = {}) {
  if (!PROFILES.includes(profile)) return null;
  return toEvaluationPhaseGraph(compilePhaseGraph(profile, signals));
}

function validateProfileCompile(item, location, errors) {
  const signals = item.compileSignals || {};
  if (item.profile === 'patch') {
    for (const signal of PATCH_PROMOTION_SIGNALS) {
      push(errors, signals[signal] !== true, location + ': patch must be promoted when ' + signal + '=true');
    }
  }
  if (item.profile === 'feature') {
    for (const signal of FEATURE_PROMOTION_SIGNALS) {
      push(errors, signals[signal] !== true, location + ': feature must be promoted when ' + signal + '=true');
    }
  }
  const expected = compileExpectedPhaseGraph(item.profile, signals);
  if (expected) {
    push(
      errors,
      sameValue(item.expectedCompiledPhaseGraph, expected),
      location + '.expectedCompiledPhaseGraph does not match compile signals',
    );
  }
}

function validateAssurance(item, location, errors) {
  const riskTriggers = Array.isArray(item.riskTriggers) ? item.riskTriggers : [];
  push(errors, ASSURANCE_LEVELS.includes(item.assurance), location + '.assurance is invalid');
  push(errors, Array.isArray(item.riskTriggers), location + '.riskTriggers must be an array');
  for (const trigger of riskTriggers) {
    push(errors, RISK_TRIGGERS.includes(trigger), location + '.riskTriggers has unknown trigger ' + trigger);
  }
  push(errors, new Set(riskTriggers).size === riskTriggers.length, location + '.riskTriggers must be unique');
  if (item.assurance === 'normal') {
    push(errors, riskTriggers.length === 0, location + ': normal assurance must not have risk triggers');
    return;
  }
  push(errors, riskTriggers.length > 0, location + ': elevated assurance requires risk triggers');
  const requiresRegulated = riskTriggers.some(trigger => TRIGGER_RULES[trigger]?.minimumAssurance === 'regulated');
  if (requiresRegulated) {
    push(errors, item.assurance === 'regulated', location + ': regulated trigger requires regulated assurance');
  } else if (item.assurance === 'regulated') {
    push(errors, false, location + ': regulated assurance requires a regulated, health, or cross-border trigger');
  }
}

function validateChecks(checks, location, errors) {
  push(errors, Array.isArray(checks) && checks.length > 0, location + ' must be a non-empty array');
  if (!Array.isArray(checks)) return;
  for (const check of checks) {
    push(errors, CHECK_IDS.includes(check), location + ' has unknown check ' + check);
  }
  push(errors, new Set(checks).size === checks.length, location + ' must be unique');
}

function validateClassificationCase(item, index, errors) {
  const location = 'cases[' + index + ']';
  push(errors, item && typeof item === 'object', location + ' must be an object');
  if (!item || typeof item !== 'object') return;
  push(errors, /^[pfi]-\d{2}$/.test(item.id || ''), location + '.id must match p-00/f-00/i-00');
  push(errors, typeof item.summary === 'string' && item.summary.length >= 8, location + '.summary is too short');
  push(
    errors,
    !Object.hasOwn(item, 'rawPrompt') && !Object.hasOwn(item, 'rawText') && !Object.hasOwn(item, 'raw'),
    location + ' must not persist a raw prompt',
  );
  const sensitiveKinds = findSensitiveKinds(item);
  push(errors, sensitiveKinds.length === 0, location + ' contains sensitive text: ' + sensitiveKinds.join(', '));
  push(errors, PROFILES.includes(item.profile), location + '.profile is invalid');
  push(errors, PROFILE_RECOMMENDATIONS.includes(item.profileRecommendation), location + '.profileRecommendation is invalid');
  push(errors, SPLITS.includes(item.split), location + '.split is invalid');
  push(errors, Array.isArray(item.rationale) && item.rationale.length > 0, location + '.rationale is required');
  validateAssurance(item, location, errors);
  validateCompileSignals(item.compileSignals, location, errors);
  validatePhaseGraph(item.expectedCompiledPhaseGraph, location + '.expectedCompiledPhaseGraph', errors);
  validateProfileCompile(item, location, errors);
  validateChecks(item.expectedChecks, location + '.expectedChecks', errors);
  validateReview(item.review, location, errors);
  validateProvenance(item.provenance, location, errors);
}

function validateClassificationCorpus(corpus) {
  const errors = [];
  push(errors, corpus && corpus.schemaVersion === '1.0', 'schemaVersion must be 1.0');
  push(errors, corpus && corpus.kind === 'workflow-classification', 'kind must be workflow-classification');
  push(errors, corpus && typeof corpus.labelPolicy === 'string' && corpus.labelPolicy.length > 0, 'labelPolicy is required');
  push(errors, corpus?.splitPolicy?.heldOutImmutableBeforeClassifier === true, 'splitPolicy must keep held-out cases immutable');
  const splitPolicy = corpus?.splitPolicy || {};
  const heldOutIds = (corpus?.cases || []).filter(item => item.split === 'held-out').map(item => item.id).sort();
  const heldOutIdsHash = crypto.createHash('sha256').update(heldOutIds.join('\n')).digest('hex');
  push(errors, splitPolicy.heldOutIdsHash === heldOutIdsHash, 'splitPolicy.heldOutIdsHash must match held-out ids');
  const anchorIds = Array.isArray(splitPolicy.anchorHeldOutIds) ? [...splitPolicy.anchorHeldOutIds].sort() : [];
  const anchorHash = crypto.createHash('sha256').update(anchorIds.join('\n')).digest('hex');
  push(errors, anchorIds.length === 13, 'splitPolicy.anchorHeldOutIds must contain the original 13 cases');
  push(
    errors,
    splitPolicy.anchorHeldOutIdsHash === HELD_OUT_ANCHOR_HASH && anchorHash === HELD_OUT_ANCHOR_HASH,
    'splitPolicy anchor hash must preserve the pre-classifier held-out set',
  );
  push(errors, anchorIds.every(id => heldOutIds.includes(id)), 'all anchor held-out ids must remain held-out');
  push(errors, /^[a-f0-9]{7,40}$/.test(splitPolicy.classifierImplementationCommit || ''),
    'splitPolicy.classifierImplementationCommit is invalid');
  push(errors, splitPolicy.postClassifierPolicy === 'new-cases-held-out-first',
    'splitPolicy.postClassifierPolicy is invalid');
  push(errors, corpus && Array.isArray(corpus.cases), 'cases must be an array');
  if (!corpus || !Array.isArray(corpus.cases)) return { valid: false, errors };
  corpus.cases.forEach((item, index) => validateClassificationCase(item, index, errors));
  const ids = corpus.cases.map(item => item.id);
  push(errors, new Set(ids).size === ids.length, 'case ids must be unique');
  const counts = Object.fromEntries(
    PROFILES.map(profile => [profile, corpus.cases.filter(item => item.profile === profile).length]),
  );
  for (const profile of PROFILES) {
    push(errors, counts[profile] >= 30, profile + ' requires at least 30 cases');
  }
  for (const split of SPLITS) {
    push(errors, corpus.cases.some(item => item.split === split), split + ' split requires at least one case');
  }
  const redactedActual = corpus.cases.filter(item => item.provenance?.kind === 'redacted-actual').length;
  const unknown = corpus.cases.filter(item => item.profileRecommendation === 'unknown').length;
  push(errors, redactedActual >= 10, 'redacted-actual provenance requires at least 10 cases');
  push(errors, unknown >= 5, 'unknown recommendation requires at least 5 cases');
  return {
    valid: errors.length === 0,
    errors,
    counts,
    provenance: { redactedActual },
    unknown,
  };
}

function validateCriticalRiskCorpus(corpus) {
  const errors = [];
  push(errors, corpus && corpus.schemaVersion === '1.0', 'schemaVersion must be 1.0');
  push(errors, corpus && corpus.kind === 'critical-risk', 'kind must be critical-risk');
  push(errors, corpus && typeof corpus.labelPolicy === 'string' && corpus.labelPolicy.length > 0, 'labelPolicy is required');
  push(errors, corpus && Array.isArray(corpus.cases), 'cases must be an array');
  if (!corpus || !Array.isArray(corpus.cases)) return { valid: false, errors };
  const categoryCounts = Object.fromEntries(CRITICAL_CATEGORIES.map(category => [category, 0]));
  const ids = new Set();
  corpus.cases.forEach((item, index) => {
    const location = 'cases[' + index + ']';
    push(errors, item && typeof item === 'object', location + ' must be an object');
    if (!item || typeof item !== 'object') return;
    push(errors, /^risk-\d{2}$/.test(item.id || ''), location + '.id must match risk-00');
    push(errors, !ids.has(item.id), location + '.id must be unique');
    ids.add(item.id);
    push(errors, typeof item.summary === 'string' && item.summary.length >= 8, location + '.summary is too short');
    push(
      errors,
      !Object.hasOwn(item, 'rawPrompt') && !Object.hasOwn(item, 'rawText') && !Object.hasOwn(item, 'raw'),
      location + ' must not persist a raw prompt',
    );
    const sensitiveKinds = findSensitiveKinds(item);
    push(errors, sensitiveKinds.length === 0, location + ' contains sensitive text: ' + sensitiveKinds.join(', '));
    push(errors, CRITICAL_CATEGORIES.includes(item.category), location + '.category is invalid');
    const rule = TRIGGER_RULES[item.category];
    if (rule) {
      push(errors, item.requiredTrigger === item.category, location + '.requiredTrigger must match category');
      push(
        errors,
        item.minimumAssurance === rule.minimumAssurance,
        location + '.minimumAssurance does not match category policy',
      );
      categoryCounts[item.category] += 1;
    }
    validateChecks(item.requiredChecks, location + '.requiredChecks', errors);
    push(errors, item.requiresSecurityDialogue === true, location + ' must require security dialogue');
    push(errors, item.split === 'held-out', location + ' must remain held-out');
    validateReview(item.review, location, errors);
  });
  for (const category of CRITICAL_CATEGORIES) {
    push(errors, categoryCounts[category] >= 2, 'critical category ' + category + ' requires at least two cases');
  }
  return {
    valid: errors.length === 0,
    errors,
    categories: CRITICAL_CATEGORIES.filter(category => categoryCounts[category] > 0).sort(),
    categoryCounts,
  };
}

function summarizeClassificationCorpus(corpus) {
  const byProfile = Object.fromEntries(PROFILES.map(profile => [profile, 0]));
  const byRecommendation = Object.fromEntries(PROFILE_RECOMMENDATIONS.map(profile => [profile, 0]));
  const byAssurance = Object.fromEntries(ASSURANCE_LEVELS.map(level => [level, 0]));
  const bySplit = Object.fromEntries(SPLITS.map(split => [split, 0]));
  const review = Object.fromEntries(REVIEW_STATUSES.map(status => [status, 0]));
  for (const item of corpus.cases || []) {
    if (item.profile in byProfile) byProfile[item.profile] += 1;
    if (item.profileRecommendation in byRecommendation) byRecommendation[item.profileRecommendation] += 1;
    if (item.assurance in byAssurance) byAssurance[item.assurance] += 1;
    if (item.split in bySplit) bySplit[item.split] += 1;
    if (item.review?.status in review) review[item.review.status] += 1;
  }
  return { total: (corpus.cases || []).length, byProfile, byRecommendation, byAssurance, bySplit, review };
}

function loadEvaluationCorpora(baseDir = process.cwd()) {
  const fixtureDir = path.join(baseDir, 'tests', 'fixtures');
  return {
    classification: readJson(path.join(fixtureDir, 'workflow-classification-corpus.json')),
    criticalRisk: readJson(path.join(fixtureDir, 'critical-risk-corpus.json')),
  };
}

module.exports = {
  PROFILES,
  ASSURANCE_LEVELS,
  RISK_TRIGGERS,
  CRITICAL_CATEGORIES,
  CHECK_IDS,
  compileExpectedPhaseGraph,
  findSensitiveKinds,
  loadEvaluationCorpora,
  validateClassificationCorpus,
  validateCriticalRiskCorpus,
  summarizeClassificationCorpus,
};
