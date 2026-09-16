#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { EVENTS, SLOT_HOLDING_STATUSES } = require('../lib/workflow/v2/state-machine');
const { defaultAllowedPaths, scopeWithin, normalizeRelative } = require('../lib/workflow/v2/write-policy');
const { assertContract, buildSpecialistAssignment } = require('../lib/workflow/v2/contracts');
const { evaluateGate } = require('../lib/workflow/v2/gate-engine');
const { searchRelatedWork } = require('../lib/workflow/v2/history-resolver');
const { loadRoleCatalog, resolveRole, buildRolePrompt } = require('../lib/workflow/v2/role-registry');
const {
  writePhaseDocument, atomicWrite, parseDocument, writeFeatureIndexes, writeMaster, checkReportArtifacts,
} = require('../lib/workflow/v2/document-manager');
const { checkPhaseDocument, phaseDocumentPath } = require('../lib/workflow/v2/phase-check');
const { TOOL_DEFINITIONS, runCheck } = require('../lib/workflow/v2/tool-adapters');
const { captureRepoSnapshot, scopedSnapshotDigest } = require('../lib/workflow/v2/repo-drift');
const { resolveProjectRoot } = require('../hooks/v2-project-context');
const { buildContextCapsule, assertFreshCapsule } = require('../lib/workflow/v2/context-capsule');
const { runPhaseTransaction, prepareReviewEvidence, canonicalWriteScopes } = require('../lib/workflow/v2/phase-transaction');
const { buildCheckIdentity, reviewEvidenceManifest } = require('../lib/workflow/v2/check-evidence');
const { recordDeferredHandoff } = require('../lib/workflow/v2/automatic-handoff');
const { runDoctor } = require('../lib/workflow/v2/doctor');
const { chainStatus, confirmUnchanged, reindex } = require('../lib/workflow/v2/id-chain');

const INTERNAL_COMMAND = `node ${JSON.stringify(__filename)}`;

const EVENT_GATES = Object.freeze({
  [EVENTS.PLAN_PRESENTED]: { gate: 'plan', verdicts: ['PASS'] },
  [EVENTS.DESIGN_PRESENTED]: { gate: 'design', verdicts: ['PASS'] },
  [EVENTS.READINESS_READY]: { gate: 'readiness', verdicts: ['READY'] },
  [EVENTS.READINESS_NOT_READY]: { gate: 'readiness', verdicts: ['NOT_READY'] },
  [EVENTS.READINESS_BLOCKED]: { gate: 'readiness', verdicts: ['BLOCKED'] },
  [EVENTS.QA_PASS]: { gate: 'review', verdicts: ['PASS'] },
  [EVENTS.QA_FAIL]: { gate: 'review', verdicts: ['FAIL'] },
  [EVENTS.QA_BLOCKED]: { gate: 'review', verdicts: ['BLOCKED'] },
  [EVENTS.REPORT_VALIDATED]: { gate: 'report', verdicts: ['PASS'] },
  [EVENTS.REPORT_FAILED]: { gate: 'report', verdicts: ['FAIL', 'BLOCKED'] },
});

const CANONICAL_DOCUMENT_CHECKS = Object.freeze({
  [EVENTS.PLAN_PRESENTED]: { phase: 'plan', check: 'plan-document' },
  [EVENTS.DESIGN_PRESENTED]: { phase: 'design', check: 'design-document' },
  [EVENTS.READINESS_READY]: { phase: 'do', check: 'do-document' },
  [EVENTS.READINESS_NOT_READY]: { phase: 'do', check: 'do-document' },
  [EVENTS.READINESS_BLOCKED]: { phase: 'do', check: 'do-document' },
  [EVENTS.QA_PASS]: { phase: 'review', check: 'review-document' },
  [EVENTS.QA_FAIL]: { phase: 'review', check: 'review-document' },
  [EVENTS.QA_BLOCKED]: { phase: 'review', check: 'review-document' },
  [EVENTS.REPORT_VALIDATED]: { phase: 'report', check: 'report-document' },
  [EVENTS.REPORT_FAILED]: { phase: 'report', check: 'report-document' },
});

function parseArgs(argv) {
  const values = [...argv];
  const command = values.shift() || 'status';
  const subcommand = values[0] && !values[0].startsWith('--') ? values.shift() : null;
  const options = {};
  const repeatable = new Set(['scope', 'affected', 'criterion', 'ref', 'required', 'check-file',
    'readiness-check', 'review-check', 'supplemental-check', 'requirement', 'specialist', 'limitation']);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    if (repeatable.has(key)) {
      const expanded = [];
      while (values[index + 1] && !values[index + 1].startsWith('--')) expanded.push(values[++index]);
      options[key] = [...(options[key] || []), ...(expanded.length ? expanded : [true])];
    } else {
      const next = values[index + 1];
      const parsed = !next || next.startsWith('--') ? true : next;
      if (parsed !== true) index += 1;
      options[key] = parsed;
    }
  }
  return { command, subcommand, options };
}

function requireOption(options, name) {
  const value = options[name];
  if (!value || value === true) throw new Error(`--${name} is required`);
  return String(value);
}

function bool(value) {
  return value === true || value === 'true' || value === 'yes';
}

function generatedWorkItemId(options, timestamp = new Date()) {
  if (options.id && options.id !== true) return String(options.id);
  const slug = requireOption(options, 'slug');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error('--slug must be lowercase kebab-case');
  }
  const date = timestamp.toISOString().slice(0, 10);
  return `WI-${date}-${slug}`;
}

function refreshAuthorization(projectRoot, sessionId, item, action) {
  if (!sessionId) return null;
  const authorizations = new AuthorizationStore(projectRoot);
  if (!item || !SLOT_HOLDING_STATUSES.has(item.status)) {
    authorizations.revoke(sessionId);
    return null;
  }
  return authorizations.grant({
    sessionId,
    workItemId: item.id,
    phase: item.phase,
    action,
    allowedPaths: defaultAllowedPaths(item),
    allowedCommands: [INTERNAL_COMMAND],
  });
}

function create(projectRoot, options) {
  const sessionId = requireOption(options, 'session');
  const store = new WorkItemStore(projectRoot);
  const item = store.create({
    id: generatedWorkItemId(options),
    title: requireOption(options, 'title'),
    primaryFeature: requireOption(options, 'feature'),
    affectedFeatures: options.affected || [],
    scale: requireOption(options, 'scale'),
    ...(options.kind && options.kind !== true ? { kind: String(options.kind) } : {}),
  });
  assertContract('workItem', item);
  store.acquireLease(item.id, sessionId);
  refreshAuthorization(projectRoot, sessionId, item, 'continue-work');
  return item;
}

// A new Feature name comes only from the runtime (derived from the request) or from the
// user's own `/vais 이름: <kebab-case>` turn. If the prompt hook could not derive one and the
// user has not named it, the request slug is null and no Work item may be created.
function assertNewFeatureSlug(relation, slug, feature, authorization) {
  if (relation !== 'new') return;
  if (authorization?.action === 'start-request' && !authorization.requestSlug) {
    throw new Error('Feature 이름이 확정되지 않았다. 사용자가 `/vais 이름: <kebab-case>` 로 이름을 정하면 runtime 이 등록한다');
  }
  if (authorization?.requestSlug && slug !== authorization.requestSlug) {
    throw new Error(`A new Feature must use the runtime-issued slug: ${authorization.requestSlug}`);
  }
  if (feature !== slug) {
    throw new Error('A new Feature relation requires --feature to equal the Work item --slug');
  }
}

function readProjectJson(projectRoot, value, label) {
  if (!value || value === true) return null;
  const target = path.resolve(projectRoot, String(value));
  if (!normalizeRelative(projectRoot, target) || fs.lstatSync(target).isSymbolicLink()) {
    throw new Error(`${label} must be inside the project`);
  }
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function readProjectText(projectRoot, value, label) {
  if (!value || value === true) throw new Error(`${label} is required`);
  const target = path.resolve(projectRoot, String(value));
  const relative = normalizeRelative(projectRoot, target);
  if (!relative || fs.lstatSync(target).isSymbolicLink()) {
    throw new Error(`${label} must be inside the project`);
  }
  return { target, relative, text: fs.readFileSync(target, 'utf8') };
}

function preparePlan(projectRoot, options) {
  const sessionId = requireOption(options, 'session');
  const draft = readProjectText(projectRoot, options['body-file'], 'Plan body file');
  if (!draft.relative.startsWith('.vais/v2/drafts/')) {
    throw new Error('Plan body file must be inside .vais/v2/drafts/');
  }
  const id = generatedWorkItemId(options);
  const relation = requireOption(options, 'relation');
  if (!['new', 'existing'].includes(relation)) throw new Error('--relation must be new or existing');
  const slug = requireOption(options, 'slug');
  const feature = requireOption(options, 'feature');
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  const store = new WorkItemStore(projectRoot);
  if (!store.get(id)) assertNewFeatureSlug(relation, slug, feature, authorization);
  let item = store.get(id);
  if (!item) {
    item = create(projectRoot, { ...options, id, session: sessionId });
  } else {
    if (item.phase !== 'plan' || item.status !== 'active') {
      throw new Error(`Existing Work item cannot accept a Plan draft: ${item.phase}/${item.status}`);
    }
    store.acquireLease(id, sessionId);
  }
  writePhaseDocument(projectRoot, item, 'plan', draft.text, { status: 'draft' });
  const check = assertContract('checkResult', checkPhaseDocument(projectRoot, item, 'plan'));
  const checkPath = path.join(path.dirname(phaseDocumentPath(projectRoot, item, 'plan')), 'evidence', 'plan-document.json');
  atomicWrite(checkPath, `${JSON.stringify(check, null, 2)}\n`);
  if (check.verdict !== 'pass') {
    return { item, check, readyForApproval: false, checkFile: path.relative(projectRoot, checkPath).split(path.sep).join('/') };
  }
  const gateResult = assertContract('gateResult', evaluateGate('plan', ['plan-document'], [check]));
  item = store.apply(id, EVENTS.PLAN_PRESENTED, { gateResult }, { requireLease: true, sessionId });
  writePhaseDocument(projectRoot, item, 'plan', draft.text, { status: 'waiting-user' });
  store.setRepoSnapshot(id, captureRepoSnapshot(projectRoot), { reason: 'plan-waiting-user-gate' });
  refreshAuthorization(projectRoot, sessionId, item, 'continue-work');
  return {
    item,
    check,
    gate: gateResult,
    readyForApproval: true,
    document: path.relative(projectRoot, phaseDocumentPath(projectRoot, item, 'plan')).split(path.sep).join('/'),
    checkFile: path.relative(projectRoot, checkPath).split(path.sep).join('/'),
  };
}

function normalizePhaseDocument(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const phase = requireOption(options, 'phase');
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item) throw new Error(`Unknown work item: ${id}`);
  if (phase !== item.phase) throw new Error(`Document phase ${phase} does not match Work item phase ${item.phase}`);
  store.acquireLease(id, sessionId);
  const target = phaseDocumentPath(projectRoot, item, phase);
  const existing = parseDocument(target);
  if (!existing) throw new Error(`Write the phase body first: ${path.relative(projectRoot, target)}`);
  const previousBytes = fs.readFileSync(target);
  try {
    const written = writePhaseDocument(projectRoot, item, phase, existing.content, {
      status: options.status && options.status !== true ? String(options.status) : 'draft',
      basedOn: options.ref || [],
      materialChange: bool(options.material),
    });
    store.syncDocumentRevision(id, phase, written.revision, sessionId);
    return written;
  } catch (error) {
    atomicWrite(target, previousBytes);
    throw error;
  }
}

function writePhaseCheck(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const phase = requireOption(options, 'phase');
  const output = requireOption(options, 'output');
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item) throw new Error(`Unknown work item: ${id}`);
  if (phase !== item.phase) throw new Error(`Check phase ${phase} does not match Work item phase ${item.phase}`);
  store.acquireLease(id, sessionId);
  const result = assertContract('checkResult', checkPhaseDocument(projectRoot, item, phase));
  const target = path.resolve(projectRoot, output);
  const relative = normalizeRelative(projectRoot, target);
  const expectedFolder = path.dirname(phaseDocumentPath(projectRoot, item, phase));
  if (!relative ||
    path.relative(expectedFolder, target).startsWith('..')) {
    throw new Error('Phase check output must stay inside the current phase folder');
  }
  atomicWrite(target, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function runToolCheck(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const phase = requireOption(options, 'phase');
  const check = requireOption(options, 'check');
  if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, check)) {
    throw new Error(`Unknown check adapter: ${check}`);
  }
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item || item.phase !== phase || item.status !== 'active') throw new Error('Tool check requires the active current phase');
  const declared = phase === 'do' ? item.readinessChecks : phase === 'review' ? item.reviewChecks : null;
  if (!declared || !declared.includes(check)) throw new Error(`${check} is not declared for ${phase}`);
  store.acquireLease(id, sessionId);
  const phaseDir = path.dirname(phaseDocumentPath(projectRoot, item, phase));
  const checkPath = path.join(phaseDir, 'evidence', 'checks', `${check}.json`);
  const logPath = path.join(phaseDir, 'evidence', 'logs', `${check}.log`);
  const artifactPath = path.join(phaseDir, 'evidence', 'artifacts', check);
  const checkRelative = normalizeRelative(projectRoot, checkPath);
  const logRelative = normalizeRelative(projectRoot, logPath);
  const artifactRelative = normalizeRelative(projectRoot, artifactPath);
  if (!checkRelative || !logRelative || !artifactRelative) throw new Error('Tool evidence path escapes the project');
  let execution = null;
  const result = assertContract('checkResult', runCheck(check, {
    cwd: projectRoot,
    evidenceDirectory: artifactPath,
    scope: item.writeScopes,
    requirements: options.requirement || [],
    evidence: [logRelative, ...(TOOL_DEFINITIONS[check].evidenceDirectory ? [artifactRelative] : [])],
    onExecution: value => { execution = value; },
  }));
  const rawLog = [
    `check=${check}`,
    `status=${execution?.status ?? 'unavailable'}`,
    '',
    String(execution?.stdout || ''),
    String(execution?.stderr || execution?.error?.message || ''),
  ].join('\n');
  atomicWrite(logPath, rawLog);
  atomicWrite(checkPath, `${JSON.stringify(result, null, 2)}\n`);
  const repoDigest = scopedSnapshotDigest(projectRoot, item.writeScopes);
  const identity = buildCheckIdentity(projectRoot, item, check, repoDigest);
  store.recordCheckReceipt(id, phase, check, result, checkRelative, repoDigest, undefined, {
    identity: identity.key, command: identity.command,
  });
  return { result, checkFile: checkRelative, logFile: logRelative };
}

function writeReportIndexes(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item || item.phase !== 'report' || item.status !== 'active' || item.approvals.final !== 'approved') {
    throw new Error('Report indexes require final approval and report/active');
  }
  store.acquireLease(id, sessionId);
  writeFeatureIndexes(projectRoot, item);
  writeMaster(projectRoot);
  const result = assertContract('checkResult', checkReportArtifacts(projectRoot, item));
  const resultPath = path.join(path.dirname(phaseDocumentPath(projectRoot, item, 'report')),
    'evidence', 'report-indexes.json');
  atomicWrite(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  return { result, checkFile: path.relative(projectRoot, resultPath).split(path.sep).join('/') };
}

function sameIds(left, right) {
  return [...new Set(left || [])].sort().join('\n') === [...new Set(right || [])].sort().join('\n');
}

function storeMissingSpecialists(projectRoot, item, phase = 'do', roles = null) {
  return item ? new WorkItemStore(projectRoot).missingCompletedSpecialists(item.id, phase, roles) : [];
}

function gateEvidenceForEvent(projectRoot, event, options, item) {
  const policy = EVENT_GATES[event];
  if (!policy) return null;
  const required = options.required || [];
  const files = options['check-file'] || [];
  if (required.length === 0 || files.length === 0) {
    throw new Error(`${event} requires --required and --check-file evidence`);
  }
  const canonical = CANONICAL_DOCUMENT_CHECKS[event];
  if (canonical && (!item || item.phase !== canonical.phase)) {
    throw new Error(`${event} requires a current ${canonical.phase} Work item`);
  }
  if (canonical && !required.includes(canonical.check)) {
    throw new Error(`${event} requires the canonical ${canonical.check} check`);
  }
  let expectedRequired = null;
  if (event === EVENTS.PLAN_PRESENTED) expectedRequired = ['plan-document'];
  if (event === EVENTS.DESIGN_PRESENTED) expectedRequired = ['design-document'];
  if ([EVENTS.READINESS_READY, EVENTS.READINESS_NOT_READY, EVENTS.READINESS_BLOCKED].includes(event)) {
    expectedRequired = ['do-document', ...(item?.readinessChecks || [])];
    const missingSpecialists = storeMissingSpecialists(projectRoot, item);
    if (missingSpecialists.length > 0) {
      throw new Error(`readiness requires completed Design specialists: ${missingSpecialists.join(', ')}`);
    }
  }
  if ([EVENTS.QA_PASS, EVENTS.QA_FAIL, EVENTS.QA_BLOCKED].includes(event)) {
    expectedRequired = ['review-document', ...(item?.reviewChecks || [])];
    const acceptedHandoffStatuses = event === EVENTS.QA_BLOCKED ? ['completed', 'blocked'] : ['completed'];
    const missingReviewers = item ? new WorkItemStore(projectRoot).missingCompletedSpecialists(
      item.id, 'review', ['independent-qa'], acceptedHandoffStatuses) : [];
    if (missingReviewers.length > 0) {
      throw new Error(`Review Gate requires an independent QA handoff with status ${acceptedHandoffStatuses.join(' or ')}: ${missingReviewers.join(', ')}`);
    }
  }
  if ([EVENTS.REPORT_VALIDATED, EVENTS.REPORT_FAILED].includes(event)) {
    expectedRequired = ['report-document', 'report-indexes'];
  }
  if (expectedRequired && !sameIds(required, expectedRequired)) {
    throw new Error(`${event} required checks must exactly match Design/runtime declarations: ${expectedRequired.join(', ')}`);
  }
  const canonicalPath = canonical && path.join(
    path.dirname(phaseDocumentPath(projectRoot, item, canonical.phase)),
    'evidence', `${canonical.check}.json`,
  );
  const store = new WorkItemStore(projectRoot);
  const results = files.map(file => {
    const target = path.resolve(projectRoot, String(file));
    const claimed = assertContract('checkResult', readProjectJson(projectRoot, file, 'Check evidence'));
    if (claimed.check === 'report-indexes' && item?.phase === 'report') {
      const expected = path.join(path.dirname(phaseDocumentPath(projectRoot, item, 'report')),
        'evidence', 'report-indexes.json');
      if (target !== expected) throw new Error('Canonical report-indexes evidence path is required');
      return assertContract('checkResult', checkReportArtifacts(projectRoot, item));
    }
    if (!canonical || claimed.check !== canonical.check) return claimed;
    if (target !== canonicalPath) {
      throw new Error(`Canonical ${canonical.check} evidence must use ${path.relative(projectRoot, canonicalPath)}`);
    }
    return assertContract('checkResult', checkPhaseDocument(projectRoot, item, canonical.phase));
  });
  for (const result of results) {
    if ((canonical && result.check === canonical.check) || result.check === 'report-indexes') continue;
    if (!['do', 'review'].includes(item?.phase)) continue;
    const expectedPath = path.join(
      path.dirname(phaseDocumentPath(projectRoot, item, item.phase)),
      'evidence', 'checks', `${result.check}.json`,
    );
    const relative = path.relative(projectRoot, expectedPath).split(path.sep).join('/');
    const supplied = files.some(file => path.resolve(projectRoot, String(file)) === expectedPath);
    const repoDigest = scopedSnapshotDigest(projectRoot, item.writeScopes);
    if (!supplied || !store.verifyCheckReceipt(item.id, item.phase, result.check, result, relative, repoDigest)) {
      throw new Error(`Check ${result.check} lacks a matching, current-code runtime Tool adapter receipt`);
    }
  }
  if (canonical && !results.some(result => result.check === canonical.check)) {
    throw new Error(`${event} is missing canonical ${canonical.check} evidence`);
  }
  const gateResult = assertContract('gateResult', evaluateGate(policy.gate, required, results));
  if (!policy.verdicts.includes(gateResult.verdict)) {
    throw new Error(`${event} cannot consume ${policy.gate} Gate verdict ${gateResult.verdict}`);
  }
  return gateResult;
}

function eventPayload(projectRoot, event, options, item) {
  const payload = {};
  if (options.scope) payload.writeScopes = options.scope;
  if (options['readiness-check']) payload.readinessChecks = options['readiness-check'];
  if (options['review-check']) payload.reviewChecks = options['review-check'];
  if (event === EVENTS.DESIGN_SCOPE_DEFINED) {
    payload.requiredSpecialists = options.specialist || [];
    const catalog = loadRoleCatalog();
    for (const role of payload.requiredSpecialists) {
      const resolved = resolveRole(catalog, role);
      if (!resolved || resolved.kind !== 'role' || resolved.role.kind !== 'implementation' ||
        !(resolved.role.modes || []).includes('implementation')) {
        throw new Error(`Design required specialist must be an implementation role: ${role}`);
      }
    }
  }
  if (options.reason && options.reason !== true) payload.reason = String(options.reason);
  if (options.material !== undefined) payload.material = bool(options.material);
  if (options['requirements-changed'] !== undefined) {
    payload.requirementsChanged = bool(options['requirements-changed']);
  }
  const gateResult = gateEvidenceForEvent(projectRoot, event, options, item);
  if (gateResult) payload.gateResult = gateResult;
  return payload;
}

function applyEvent(projectRoot, options) {
  const id = requireOption(options, 'id');
  const event = requireOption(options, 'event');
  if (!Object.values(EVENTS).includes(event)) throw new Error(`Unknown event: ${event}`);
  const sessionId = requireOption(options, 'session');
  const store = new WorkItemStore(projectRoot);
  store.acquireLease(id, sessionId);
  const current = store.get(id);
  if (!current) throw new Error(`Unknown work item: ${id}`);
  const item = store.apply(id, event, eventPayload(projectRoot, event, options, current), { requireLease: true, sessionId });
  if (EVENT_GATES[event]) {
    store.setRepoSnapshot(id, captureRepoSnapshot(projectRoot), {
      reason: `${item.phase}-${item.status}-gate`,
    });
  }
  assertContract('workItem', item);
  refreshAuthorization(projectRoot, sessionId, item, 'continue-work');
  return item;
}

function queuePending(projectRoot, options) {
  return new WorkItemStore(projectRoot).queuePendingRequest(
    requireOption(options, 'text'), requireOption(options, 'session'));
}

function buildAssignment(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item) throw new Error('Assignment Work item does not exist');
  const catalog = loadRoleCatalog();
  const resolved = resolveRole(catalog, requireOption(options, 'role'));
  if (!resolved || resolved.kind !== 'role') throw new Error('Assignment target must be a judgment or implementation role');
  if (resolved.role.kind === 'c-level') throw new Error('C-Level ownership is not a specialist assignment');
  const delegatedBy = requireOption(options, 'delegated-by');
  if (!(resolved.role.delegatedBy || []).includes(delegatedBy)) {
    throw new Error(`${delegatedBy} cannot delegate to ${resolved.target}`);
  }
  const phase = requireOption(options, 'phase');
  const mode = requireOption(options, 'mode');
  if (phase !== item.phase) throw new Error(`Assignment phase ${phase} does not match Work item phase ${item.phase}`);
  if (!['do', 'review'].includes(phase) || item.status !== 'active') {
    throw new Error('Specialist assignment requires do/active or review/active');
  }
  if (!(resolved.role.modes || []).includes(mode)) throw new Error(`${resolved.target} does not support ${mode} mode`);
  const codeWrite = bool(options['code-write']);
  const cleanRoom = bool(options['clean-room']);
  if (phase === 'review' && (resolved.target !== 'independent-qa' || mode !== 'verification' || codeWrite || !cleanRoom)) {
    throw new Error('Review requires exactly one read-only independent-qa assignment with cleanRoom enabled');
  }
  if (phase === 'do' && (!item.requiredSpecialists.includes(resolved.target) ||
    resolved.role.kind !== 'implementation' || mode !== 'implementation' || !codeWrite)) {
    throw new Error(`Do assignment role must be a current Design-required implementation specialist: ${resolved.target}`);
  }
  if (codeWrite && (phase !== 'do' || mode !== 'implementation')) {
    throw new Error('Code-writing assignments are allowed only in Do implementation mode');
  }
  const writeScope = codeWrite ? canonicalWriteScopes(projectRoot, options.scope || []) : [];
  if (codeWrite) {
    const approved = item.writeScopes || [];
    if (writeScope.length === 0 || writeScope.some(scope => !approved.some(parent => scopeWithin(scope, parent)))) {
      throw new Error('Assignment exceeds the Design-approved write scope');
    }
  } else if (writeScope.length > 0) {
    throw new Error('Read-only assignments cannot declare a write scope');
  }
  const assignment = buildSpecialistAssignment({
    role: resolved.target,
    scale: item.scale,
    delegatedBy,
    phase,
    mode,
    question: requireOption(options, 'question'),
    codeWrite,
    writeScope,
    completionCriteria: options.criterion || [],
    context: {
      refs: options.ref || [],
      receipts: phase === 'review' ? reviewEvidenceManifest(store, item) : [],
      cleanRoom,
    },
  });
  store.acquireLease(id, sessionId);
  const assignmentReceipt = store.recordAssignment(id, assignment, sessionId);
  return { rolePrompt: buildRolePrompt(resolved.role), assignment, assignmentReceipt };
}

// Registers a specialist result that arrived after the Agent tool returned (deferred
// launch receipt). The runtime applies the same envelope, schema, byte, and verdict
// checks as the PostToolUse hook and persists canonical evidence.
function recordHandoff(projectRoot, options) {
  const id = requireOption(options, 'id');
  const sessionId = requireOption(options, 'session');
  const assignmentId = requireOption(options, 'assignment');
  const handoffFile = requireOption(options, 'handoff-file');
  const store = new WorkItemStore(projectRoot);
  const item = store.get(id);
  if (!item) throw new Error(`Unknown work item: ${id}`);
  store.acquireLease(id, sessionId);
  return recordDeferredHandoff(projectRoot, { workItemId: id, sessionId, assignmentId, handoffFile });
}

// `stage confirm` records that a changed parent does not affect a child. The pair must have
// been declared by the user in this session (`/vais 변경 없음 확인: F-003 ← REQ-002`); the
// prompt hook stores it in the authorization, so the AI cannot confirm on its own.
function stageConfirm(projectRoot, options) {
  const sessionId = requireOption(options, 'session');
  const item = requireOption(options, 'item').toUpperCase();
  const parent = requireOption(options, 'parent').toUpperCase();
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  const confirmed = (authorization?.stageConfirmations || []).some(entry =>
    String(entry.item).toUpperCase() === item && String(entry.parent).toUpperCase() === parent);
  if (!confirmed) {
    throw new Error(`사용자가 \`/vais 변경 없음 확인: ${item} ← ${parent}\` 로 직접 확인해야 한다`);
  }
  return confirmUnchanged(projectRoot, item, parent);
}

function contextCapsule(projectRoot, options) {
  const store = new WorkItemStore(projectRoot);
  const item = options.id && options.id !== true ? store.get(String(options.id)) : store.getCurrent();
  if (!item) throw new Error('Context capsule Work item is missing');
  if (options['capsule-file']) {
    const capsule = readProjectJson(projectRoot, options['capsule-file'], 'Context capsule file');
    return assertFreshCapsule(projectRoot, capsule);
  }
  return buildContextCapsule(projectRoot, item, requireOption(options, 'phase'), requireOption(options, 'role'), {
    requestSummary: options.request && options.request !== true ? String(options.request) : '',
  });
}

function phaseTransaction(projectRoot, phase, action, options) {
  const revision = Number(requireOption(options, 'revision'));
  if (!Number.isInteger(revision) || revision < 1) throw new Error('--revision must be a positive integer');
  let id = options.id && options.id !== true ? String(options.id) : undefined;
  if (phase === 'plan' && !id) {
    id = generatedWorkItemId(options);
    const relation = requireOption(options, 'relation');
    if (!['new', 'existing'].includes(relation)) throw new Error('--relation must be new or existing');
    const slug = requireOption(options, 'slug');
    const feature = requireOption(options, 'feature');
    const authorization = new AuthorizationStore(projectRoot).get(requireOption(options, 'session'));
    if (!new WorkItemStore(projectRoot).get(id)) assertNewFeatureSlug(relation, slug, feature, authorization);
  }
  const receipt = runPhaseTransaction(projectRoot, {
    phase,
    action,
    id,
    sessionId: requireOption(options, 'session'),
    title: options.title && options.title !== true ? String(options.title) : undefined,
    primaryFeature: options.feature && options.feature !== true ? String(options.feature) : undefined,
    affectedFeatures: options.affected || [],
    scale: options.scale && options.scale !== true ? String(options.scale) : undefined,
    kind: options.kind && options.kind !== true ? String(options.kind) : undefined,
    bodyFile: options['body-file'] && options['body-file'] !== true ? String(options['body-file']) : undefined,
    revision,
    writeScopes: options.scope,
    readinessChecks: options['readiness-check'],
    reviewChecks: options['review-check'],
    requiredSpecialists: options.specialist || [],
    requirements: options.requirement || [],
    limitations: options.limitation || [],
    outcome: options.outcome && options.outcome !== true ? String(options.outcome) : undefined,
    budgetException: options['budget-exception'] && options['budget-exception'] !== true ? String(options['budget-exception']) : undefined,
    budgetApprovedBy: options['budget-approved-by'] && options['budget-approved-by'] !== true ? String(options['budget-approved-by']) : undefined,
    materialChange: bool(options.material),
  });
  const item = new WorkItemStore(projectRoot).get(receipt.workItemId);
  refreshAuthorization(projectRoot, requireOption(options, 'session'), item, 'continue-work');
  return receipt;
}

function reviewEvidencePrepare(projectRoot, options) {
  const revision = Number(requireOption(options, 'revision'));
  if (!Number.isInteger(revision) || revision < 1) throw new Error('--revision must be a positive integer');
  const sessionId = requireOption(options, 'session');
  const result = prepareReviewEvidence(projectRoot, {
    id: requireOption(options, 'id'),
    sessionId,
    revision,
    requirements: options.requirement || [],
    supplementalChecks: options['supplemental-check'] || [],
    supplementalReason: options['supplemental-reason'] && options['supplemental-reason'] !== true
      ? String(options['supplemental-reason']) : undefined,
  });
  refreshAuthorization(projectRoot, sessionId, new WorkItemStore(projectRoot).get(result.workItemId), 'continue-work');
  return result;
}

function execute(argv = process.argv.slice(2), projectRoot = null) {
  const { command, subcommand, options } = parseArgs(argv);
  const root = path.resolve(projectRoot || resolveProjectRoot(process.cwd()) || process.cwd());
  const store = new WorkItemStore(root);
  if (command === 'status') return { current: store.getCurrent(), pending: store.readRegistry().pendingRequests };
  if (command === 'search') return { matches: searchRelatedWork(root, requireOption(options, 'query'), { primaryFeature: options.feature }) };
  if (command === 'context') return contextCapsule(root, options);
  if (command === 'doctor') return runDoctor(root);
  if (command === 'stage' && subcommand === 'status') return chainStatus(root);
  let result;
  if (command === 'create') result = create(root, options);
  else if (command === 'stage' && subcommand === 'confirm') result = stageConfirm(root, options);
  else if (command === 'stage' && subcommand === 'reindex') result = { schema: 'chain-index/v1', ...reindex(root) };
  else if (command === 'event') result = applyEvent(root, options);
  else if (command === 'pending') result = queuePending(root, options);
  else if (command === 'assignment') result = buildAssignment(root, options);
  else if (command === 'handoff') result = recordHandoff(root, options);
  else if (command === 'plan' && subcommand === 'present') result = phaseTransaction(root, 'plan', 'present', options);
  else if (command === 'design' && subcommand === 'present') result = phaseTransaction(root, 'design', 'present', options);
  else if (command === 'do' && subcommand === 'ready') result = phaseTransaction(root, 'do', 'ready', options);
  else if (command === 'review' && subcommand === 'prepare') result = reviewEvidencePrepare(root, options);
  else if (command === 'review' && subcommand === 'decide') result = phaseTransaction(root, 'review', 'decide', options);
  else if (command === 'report' && subcommand === 'finalize') result = phaseTransaction(root, 'report', 'finalize', options);
  else if (command === 'plan') result = preparePlan(root, options);
  else if (command === 'document') result = normalizePhaseDocument(root, options);
  else if (command === 'check') result = writePhaseCheck(root, options);
  else if (command === 'run-check') result = runToolCheck(root, options);
  else if (command === 'indexes') result = writeReportIndexes(root, options);
  else throw new Error(`Unknown command: ${command}`);
  const id = options.id && options.id !== true ? String(options.id) : result?.item?.id || result?.workItemId || result?.id;
  const recordsOwnSnapshot = (command === 'plan' && subcommand === 'present') ||
    (command === 'design' && subcommand === 'present') || (command === 'do' && subcommand === 'ready') ||
    (command === 'review' && ['prepare', 'decide'].includes(subcommand)) ||
    (command === 'report' && subcommand === 'finalize');
  if (id && command !== 'pending' && command !== 'assignment' && command !== 'handoff' && !recordsOwnSnapshot) {
    store.setRepoSnapshot(id, captureRepoSnapshot(root), { reason: `internal-cli-${command}` });
  }
  return result;
}

function main() {
  try {
    process.stdout.write(`${JSON.stringify(execute(), null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = {
  INTERNAL_COMMAND,
  EVENT_GATES,
  CANONICAL_DOCUMENT_CHECKS,
  parseArgs,
  generatedWorkItemId,
  assertNewFeatureSlug,
  stageConfirm,
  preparePlan,
  refreshAuthorization,
  create,
  applyEvent,
  gateEvidenceForEvent,
  normalizePhaseDocument,
  writePhaseCheck,
  runToolCheck,
  writeReportIndexes,
  buildAssignment,
  recordHandoff,
  contextCapsule,
  phaseTransaction,
  reviewEvidencePrepare,
  execute,
  main,
};
