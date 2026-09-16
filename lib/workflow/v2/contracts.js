'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const SCHEMA_FILES = Object.freeze({
  workItem: 'work-item.schema.json',
  checkResult: 'check-result.schema.json',
  gateResult: 'gate-result.schema.json',
  specialistHandoff: 'specialist-handoff.schema.json',
  specialistAssignment: 'specialist-assignment.schema.json',
  automaticHandoffEvidence: 'automatic-handoff-evidence.schema.json',
  phaseTransactionReceipt: 'phase-transaction-receipt.schema.json',
  reviewEvidencePrepare: 'review-evidence-prepare.schema.json',
  chainStages: 'chain-stage.schema.json',
  workKinds: 'work-kinds.schema.json',
  ledgerEntry: 'ledger-entry.schema.json',
  glossary: 'glossary.schema.json',
});

const QA_HANDOFF_LIMITS = Object.freeze({ compact: 3 * 1024, standard: 5 * 1024, extended: 8 * 1024 });
const QA_HANDOFF_TARGETS = Object.freeze({ compact: 2 * 1024, standard: 4 * 1024, extended: 6 * 1024 });
const QA_HANDOFF_SHAPE_LIMITS = Object.freeze({
  compact: Object.freeze({
    judgment: 80, decisions: [2, 25], behavior: [2, 20], evidence: [2, 100],
    requirements: 20, risks: [2, 28], unverified: [2, 28], checks: [4, 40],
  }),
  standard: Object.freeze({
    judgment: 150, decisions: [3, 40], behavior: [3, 30], evidence: [3, 120],
    requirements: 30, risks: [3, 30], unverified: [3, 30], checks: [5, 40],
  }),
  extended: Object.freeze({
    judgment: 200, decisions: [4, 50], behavior: [4, 40], evidence: [4, 120],
    requirements: 50, risks: [4, 40], unverified: [4, 40], checks: [6, 50],
  }),
});

const ajv = new Ajv({ allErrors: true, jsonPointers: true });
const cache = new Map();

function schemaPath(name) {
  const file = SCHEMA_FILES[name];
  if (!file) throw new Error(`Unknown v2 contract: ${name}`);
  return path.join(__dirname, '..', '..', '..', 'schemas', file);
}

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(schemaPath(name), 'utf8'));
}

function validator(name) {
  if (!cache.has(name)) cache.set(name, ajv.compile(loadSchema(name)));
  return cache.get(name);
}

function validateContract(name, value) {
  const validate = validator(name);
  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : (validate.errors || []).map(error => `${error.dataPath || '/'} ${error.message}`),
  };
}

function assertContract(name, value) {
  const result = validateContract(name, value);
  if (!result.valid) throw new Error(`${name} contract invalid: ${result.errors.join('; ')}`);
  return value;
}

function validateSchema(schema, value) {
  const validate = new Ajv({ allErrors: true, jsonPointers: true }).compile(schema);
  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : (validate.errors || []).map(error => `${error.dataPath || '/'} ${error.message}`),
  };
}

function assertSchema(schema, value, label = 'value') {
  const result = validateSchema(schema, value);
  if (!result.valid) {
    const error = new Error(`${label} contract invalid: ${result.errors.join('; ')}`);
    error.code = 'OUTPUT_CONTRACT_INVALID';
    throw error;
  }
  return value;
}

function capArray(schema, maxItems, maxLength) {
  schema.maxItems = maxItems;
  schema.items.maxLength = maxLength;
}

function applyQaShapeLimits(outputContract, scale) {
  const limits = QA_HANDOFF_SHAPE_LIMITS[scale];
  if (!limits) throw new Error('Independent QA assignment requires a valid compact, standard, or extended scale');
  const properties = outputContract.properties;
  properties.judgment.maxLength = limits.judgment;
  capArray(properties.decisions, ...limits.decisions);
  for (const name of ['inputs', 'outputs', 'errors']) {
    capArray(properties.behavior.properties[name], ...limits.behavior);
  }
  capArray(properties.evidence, ...limits.evidence);
  properties.affectedRequirements.maxItems = limits.requirements;
  capArray(properties.risks, ...limits.risks);
  capArray(properties.unverified, ...limits.unverified);
  capArray(properties.recommendedChecks, ...limits.checks);
  return limits;
}

function buildSpecialistAssignment(input) {
  const outputContract = loadSchema('specialistHandoff');
  if (input.role === 'independent-qa') {
    const hardLimitBytes = QA_HANDOFF_LIMITS[input.scale];
    const targetBytes = QA_HANDOFF_TARGETS[input.scale];
    const shape = applyQaShapeLimits(outputContract, input.scale);
    outputContract.description = `Return raw JSON only. Serialized UTF-8 output must be at most ${hardLimitBytes} bytes; target at most ${targetBytes} bytes. Shape caps: judgment ${shape.judgment} characters; decisions ${shape.decisions[0]}x${shape.decisions[1]}; each behavior array ${shape.behavior[0]}x${shape.behavior[1]}; evidence ${shape.evidence[0]}x${shape.evidence[1]}; risks and unverified ${shape.risks[0]}x${shape.risks[1]}. Reference logs and screenshots by concise repo-relative path or receipt ID instead of restating them.`;
    outputContract['x-vais-max-serialized-bytes'] = hardLimitBytes;
    outputContract['x-vais-target-serialized-bytes'] = targetBytes;
  }
  const assignment = {
    schema: 'specialist-assignment/v1',
    role: input.role,
    delegatedBy: input.delegatedBy,
    phase: input.phase,
    mode: input.mode,
    question: input.question,
    codeWrite: input.codeWrite === true,
    writeScope: [...new Set(input.writeScope || [])],
    completionCriteria: [...(input.completionCriteria || [])],
    context: {
      refs: [...new Set(input.context?.refs || [])],
      receipts: [...(input.context?.receipts || [])],
      cleanRoom: input.context?.cleanRoom === true,
    },
    outputContract,
  };
  return assertContract('specialistAssignment', assignment);
}

module.exports = {
  SCHEMA_FILES,
  QA_HANDOFF_LIMITS,
  QA_HANDOFF_TARGETS,
  QA_HANDOFF_SHAPE_LIMITS,
  loadSchema,
  validateContract,
  assertContract,
  validateSchema,
  assertSchema,
  applyQaShapeLimits,
  buildSpecialistAssignment,
};
