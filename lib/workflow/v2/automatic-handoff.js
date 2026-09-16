'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { assertContract, assertSchema, QA_HANDOFF_LIMITS } = require('./contracts');
const { extractAssignmentId, extractAssignmentWrapper } = require('./agent-policy');
const { WorkItemStore } = require('./work-item-store');
const { atomicWrite, PHASE_FOLDERS, workItemDirectory } = require('./document-manager');
const { normalizeRelative, scopeWithin } = require('./write-policy');

// A specialist that wrote files reports them in `files`; every path must lie inside the
// assignment's write scope, and a read-only assignment may not report any.
function assertHandoffFiles(root, assignment, handoff) {
  const files = Array.isArray(handoff.files) ? handoff.files : [];
  if (files.length === 0) return handoff;
  if (!assignment.codeWrite || (assignment.writeScope || []).length === 0) {
    const error = new Error('Read-only assignment handoff must not report written files');
    error.code = 'OUTPUT_CONTRACT_INVALID';
    throw error;
  }
  for (const file of files) {
    const relative = normalizeRelative(root, path.resolve(root, String(file)));
    if (!relative || !assignment.writeScope.some(scope => scopeWithin(relative, scope) || relative === scope)) {
      const error = new Error(`Handoff file is outside the assignment write scope: ${file}`);
      error.code = 'OUTPUT_CONTRACT_INVALID';
      throw error;
    }
  }
  return handoff;
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function candidateStrings(value, output = [], depth = 0) {
  if (depth > 8 || value === null || value === undefined) return output;
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach(entry => candidateStrings(entry, output, depth + 1));
  else if (typeof value === 'object') {
    for (const key of ['text', 'content', 'output', 'result', 'response', 'message']) {
      if (Object.prototype.hasOwnProperty.call(value, key)) candidateStrings(value[key], output, depth + 1);
    }
  }
  return output;
}

function jsonObjects(text) {
  const values = [];
  const input = String(text || '').slice(0, 512 * 1024);
  try { values.push(JSON.parse(input)); } catch (_) { /* Scan embedded objects below. */ }
  for (let start = 0; start < input.length; start += 1) {
    if (input[start] !== '{') continue;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < input.length; index += 1) {
      const character = input[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') quoted = false;
      } else if (character === '"') quoted = true;
      else if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try { values.push(JSON.parse(input.slice(start, index + 1))); } catch (_) { /* Not JSON. */ }
          break;
        }
      }
    }
  }
  return values;
}

function findAgentHandoffs(agentResult) {
  const matches = [];
  const seen = new Set();
  for (const text of candidateStrings(agentResult)) {
    for (const candidate of jsonObjects(text)) {
      if (candidate?.schema !== 'specialist-handoff/v1') continue;
      const key = JSON.stringify(candidate);
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push(candidate);
    }
  }
  return matches;
}

// Some Claude Code builds return the Agent tool result immediately at launch and deliver
// the specialist's answer later as a task notification. That launch receipt carries no
// handoff, so the assignment must stay open instead of being rejected.
function isDeferredAgentResult(agentResult) {
  if (findAgentHandoffs(agentResult).length > 0) return false;
  return candidateStrings(agentResult).some(text =>
    /async agent launched|agent is working in the background|agentId:/i.test(text));
}

function extractAgentHandoff(agentResult) {
  const matches = findAgentHandoffs(agentResult).map(candidate => assertContract('specialistHandoff', candidate));
  if (matches.length !== 1) {
    const error = new Error(`Agent result must contain exactly one specialist-handoff/v1 object; found ${matches.length}`);
    error.code = 'HANDOFF_CARDINALITY_INVALID';
    throw error;
  }
  return matches[0];
}

function resolveAssignmentId(input) {
  if (input.assignmentId) return String(input.assignmentId);
  const wrapper = extractAssignmentWrapper(input.agentPrompt || input.prompt || '');
  const fromWrapper = wrapper?.assignmentReceipt?.id;
  const fromReceipt = extractAssignmentId(input.agentPrompt || input.prompt || '');
  if (fromWrapper && fromReceipt && fromWrapper.toLowerCase() !== fromReceipt.toLowerCase()) {
    throw new Error('Agent prompt contains conflicting assignment receipts');
  }
  const id = fromWrapper || fromReceipt;
  if (!id) throw new Error('Agent prompt must contain exactly one assignment receipt');
  return id;
}

function assertHandoffSize(item, role, handoff) {
  if (role !== 'independent-qa') return handoff;
  const limit = QA_HANDOFF_LIMITS[item.scale];
  const bytes = Buffer.byteLength(JSON.stringify(handoff), 'utf8');
  if (!limit || bytes > limit) {
    const error = new Error(`Independent QA handoff ${bytes}B exceeds the ${item.scale} limit of ${limit || 0}B`);
    error.code = 'QA_HANDOFF_TOO_LARGE';
    throw error;
  }
  return handoff;
}

function recordAutomaticHandoff(projectRoot, input) {
  const root = path.resolve(projectRoot);
  const store = new WorkItemStore(root);
  const item = store.get(input.workItemId) || (!input.workItemId ? store.getCurrent() : null);
  if (!item) throw new Error('Automatic handoff Work item is missing');
  if (!['do', 'review'].includes(item.phase) || item.status !== 'active') throw new Error('Automatic handoff requires do/active or review/active');
  const sessionId = String(input.sessionId || '').trim();
  if (!sessionId) throw new Error('Automatic handoff sessionId is required');
  const assignmentId = resolveAssignmentId(input);
  const envelope = store.getAssignmentEnvelope(item.id, assignmentId);
  if (!envelope) throw new Error('Automatic handoff assignment is missing, stale, or belongs to another phase');
  if (input.assignmentReceipt && !store.verifyAssignmentReceipt(item.id, input.assignmentReceipt, envelope.assignment)) {
    throw new Error('Automatic handoff assignment receipt digest is invalid');
  }
  if (input.assignment && digest(input.assignment) !== envelope.assignmentReceipt.digest) {
    throw new Error('Automatic handoff assignment digest is invalid');
  }
  const promptWrapper = extractAssignmentWrapper(input.agentPrompt || input.prompt || '');
  if (promptWrapper && (!store.verifyAssignmentReceipt(item.id, promptWrapper.assignmentReceipt, promptWrapper.assignment) ||
    digest(promptWrapper.assignment) !== envelope.assignmentReceipt.digest)) {
    throw new Error('Automatic handoff prompt envelope is stale or modified');
  }
  const handoff = input.handoff
    ? assertContract('specialistHandoff', input.handoff)
    : extractAgentHandoff(input.agentResult);
  assertSchema(envelope.assignment.outputContract, handoff, 'Specialist handoff output');
  assertHandoffSize(item, envelope.assignment.role, handoff);
  assertHandoffFiles(root, envelope.assignment, handoff);
  if (envelope.assignment.role === 'independent-qa') {
    const allowed = handoff.status === 'blocked' ? handoff.verdict === 'blocked' :
      handoff.status === 'completed' && ['pass', 'fail'].includes(handoff.verdict);
    if (!allowed) {
      throw new Error('Independent QA handoff must declare structured verdict pass or fail when completed, or blocked when blocked');
    }
  }
  const handoffDigest = digest(handoff);
  const phaseDir = path.join(workItemDirectory(root, item), PHASE_FOLDERS[item.phase]);
  const evidencePath = path.join(phaseDir, 'evidence', 'handoffs', `${assignmentId}.json`);
  const evidenceRelative = normalizeRelative(root, evidencePath);
  if (!evidenceRelative || fs.existsSync(evidencePath) || (fs.existsSync(path.dirname(evidencePath)) && fs.lstatSync(path.dirname(evidencePath)).isSymbolicLink())) {
    throw new Error('Automatic handoff evidence already exists or is unsafe');
  }
  const evidence = assertContract('automaticHandoffEvidence', {
    schema: 'automatic-handoff-evidence/v1',
    workItemId: item.id,
    assignmentId,
    phase: item.phase,
    role: envelope.assignment.role,
    designRevision: item.designRevision,
    repairCycle: item.qaRepairCount,
    assignmentDigest: envelope.assignmentReceipt.digest,
    handoffDigest,
    persistedAt: new Date(input.timestamp || Date.now()).toISOString(),
    handoff,
  });
  store.acquireLease(item.id, sessionId, input.timestamp);
  atomicWrite(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  try {
    store.recordAssignmentHandoff(item.id, assignmentId, handoff, sessionId, input.timestamp, {
      expectedDesignRevision: item.designRevision,
      expectedRepairCycle: item.qaRepairCount,
      evidencePath: evidenceRelative,
    });
  } catch (error) {
    try { fs.unlinkSync(evidencePath); } catch (_) { /* Keep original error. */ }
    throw error;
  }
  return {
    schema: 'automatic-handoff-receipt/v1',
    assignmentId,
    status: handoff.status,
    digest: handoffDigest,
    evidencePath: evidenceRelative,
  };
}

const ingestAgentHandoff = recordAutomaticHandoff;

// Registers a handoff that arrived outside the PostToolUse hook (deferred Agent result).
// The handoff file must be a regular project file. When it lives in the Work item's
// current phase folder or in the runtime draft area it is removed after the canonical
// evidence has been written so no transient JSON survives Report.
function recordDeferredHandoff(projectRoot, input) {
  const root = path.resolve(projectRoot);
  const store = new WorkItemStore(root);
  const item = store.get(input.workItemId);
  if (!item) throw new Error('Deferred handoff Work item is missing');
  const assignmentId = String(input.assignmentId || '');
  const open = store.openAssignments(item.id).find(receipt => receipt.id === assignmentId);
  if (!open) throw new Error('Deferred handoff requires a consumed, still-open assignment for the current phase');
  const target = path.resolve(root, String(input.handoffFile || ''));
  const relative = normalizeRelative(root, target);
  if (!relative || !fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink() || !fs.statSync(target).isFile()) {
    throw new Error('Deferred handoff file must be a regular file inside the project');
  }
  const handoff = assertContract('specialistHandoff', JSON.parse(fs.readFileSync(target, 'utf8')));
  const receipt = recordAutomaticHandoff(root, {
    workItemId: item.id,
    sessionId: input.sessionId,
    assignmentId,
    handoff,
    timestamp: input.timestamp,
  });
  const phaseDir = path.join(workItemDirectory(root, item), PHASE_FOLDERS[item.phase]);
  const transient = !path.relative(phaseDir, target).startsWith('..') || relative.startsWith('.vais/v2/drafts/');
  if (transient && relative !== receipt.evidencePath) {
    try { fs.unlinkSync(target); } catch (_) { /* The canonical evidence is already persisted. */ }
  }
  return { ...receipt, source: 'deferred-agent-result', transientRemoved: transient };
}

module.exports = {
  QA_HANDOFF_LIMITS,
  candidateStrings,
  findAgentHandoffs,
  isDeferredAgentResult,
  extractAgentHandoff,
  assertHandoffSize,
  assertHandoffFiles,
  recordAutomaticHandoff,
  recordDeferredHandoff,
  ingestAgentHandoff,
};
