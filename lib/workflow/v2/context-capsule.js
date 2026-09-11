'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { WorkItemStore } = require('./work-item-store');
const { PHASE_FOLDERS, workItemDirectory, parseDocument } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');

const CAPSULE_LIMITS = Object.freeze({ compact: 6144, standard: 10240, extended: 20480 });
const PHASES = Object.freeze(['plan', 'design', 'do', 'review', 'report']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonicalPath(projectRoot, item, phase) {
  return path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS[phase], 'main.md');
}

function safeSource(projectRoot, filePath) {
  if (!fs.existsSync(filePath)) return null;
  const relative = normalizeRelative(projectRoot, filePath);
  if (!relative || fs.lstatSync(filePath).isSymbolicLink()) throw new Error('Capsule source must be a non-symbolic project file');
  const bytes = fs.readFileSync(filePath);
  return { path: relative, hash: sha256(bytes), bytes: bytes.length };
}

function ids(text, prefix) {
  return [...new Set((String(text || '').match(new RegExp(`\\b${prefix}-\\d{3}\\b`, 'gi')) || [])
    .map(value => value.toUpperCase()))].slice(0, 200);
}

function compactLines(content, patterns, maximum = 20) {
  const output = [];
  for (const raw of String(content || '').split(/\r?\n/)) {
    const line = raw.replace(/^\s*(?:#{1,6}|[-*+]\s*)/, '').replace(/\s+/g, ' ').trim();
    if (!line || line.length > 500 || !patterns.some(pattern => pattern.test(line))) continue;
    output.push(line.slice(0, 300));
    if (output.length >= maximum) break;
  }
  return [...new Set(output)];
}

function sourceDocument(projectRoot, item, phase, required = true) {
  const filePath = canonicalPath(projectRoot, item, phase);
  const document = parseDocument(filePath);
  if (!document) {
    if (required) throw new Error(`Canonical ${phase} document is required for this capsule`);
    return null;
  }
  return { document, source: safeSource(projectRoot, filePath) };
}

function buildData(projectRoot, item, phase, options, sources) {
  const add = (sourcePhase, required = true) => {
    const value = sourceDocument(projectRoot, item, sourcePhase, required);
    if (value) sources.push(value.source);
    return value?.document?.content || '';
  };
  if (phase === 'plan') {
    return {
      request: String(options.requestSummary || '').trim().slice(0, 2000),
      featureCandidates: (options.featureCandidates || []).slice(0, 12).map(value => ({
        id: String(value.id || value.primaryFeature || '').slice(0, 160),
        kind: String(value.kind || 'work-item').slice(0, 40),
        status: String(value.status || '').slice(0, 40),
      })),
      scaleCandidate: options.scaleCandidate || item.scale,
    };
  }
  const plan = add('plan');
  if (phase === 'design') {
    return {
      requirements: ids(plan, 'REQ'),
      criteria: compactLines(plan, [/완료|acceptance|criterion|기준/i], 16),
      userFlow: compactLines(plan, [/흐름|flow|when|then|사용자/i], 16),
      technicalSurface: [...new Set(options.technicalSurface || item.writeScopes || [])].slice(0, 80),
    };
  }
  const design = add('design');
  if (phase === 'do') {
    return {
      designRevision: item.designRevision,
      requirements: ids(design, 'REQ'),
      testCases: ids(design, 'TC'),
      decisions: compactLines(design, [/결정|decision|동작|behavior|입력|출력|오류|error/i], 24),
      writeScopes: item.writeScopes,
      requiredSpecialists: item.requiredSpecialists,
      readinessChecks: item.readinessChecks,
    };
  }
  if (phase === 'review') {
    const doDocument = add('do');
    const registry = new WorkItemStore(projectRoot).readRegistry();
    const assignments = Object.values(registry.assignments || {})
      .filter(value => value.workItemId === item.id && value.designRevision === item.designRevision &&
        value.repairCycle === item.qaRepairCount)
      .map(value => ({ id: value.id, role: value.role, phase: value.phase, status: value.handoffStatus || 'pending', evidence: value.handoffEvidencePath || null }))
      .slice(0, 40);
    const receipts = Object.entries(registry.checkReceipts?.[item.id]?.do || {})
      .map(([check, value]) => ({ check, evidence: value.evidencePath, digest: value.digest }))
      .slice(0, 40);
    return {
      requirements: ids(`${plan}\n${design}`, 'REQ'),
      testCases: ids(design, 'TC'),
      expected: compactLines(design, [/기대|expected|출력|output|error|오류/i], 20),
      diff: (options.diffSummary || compactLines(doDocument, [/변경|change|구현|implementation/i], 20)).slice(0, 40),
      handoffs: assignments,
      checks: receipts,
    };
  }
  add('review');
  const registry = new WorkItemStore(projectRoot).readRegistry();
  return {
    approvals: item.approvals,
    gateEvents: (registry.events || []).filter(event => event.workItemId === item.id && event.details?.gate)
      .map(event => ({ type: event.type, verdict: event.details.gateVerdict, at: event.timestamp })).slice(-20),
    changes: [...new Set(options.changeSummary || item.writeScopes || [])].slice(0, 80),
    qaVerdict: (registry.events || []).filter(event => event.workItemId === item.id && /^qa\./.test(event.type)).at(-1)?.type || null,
    limitations: (options.limitations || []).slice(0, 20).map(value => String(value).slice(0, 300)),
  };
}

function resolveItem(projectRoot, itemOrId) {
  if (itemOrId && typeof itemOrId === 'object') return itemOrId;
  const store = new WorkItemStore(projectRoot);
  const item = itemOrId ? store.get(String(itemOrId)) : store.getCurrent();
  if (!item) throw new Error(`Unknown Work item: ${itemOrId || '<current>'}`);
  return item;
}

function buildContextCapsule(projectRoot, itemOrId, phase, role, options = {}) {
  const root = path.resolve(projectRoot);
  const item = resolveItem(root, itemOrId);
  const selectedPhase = phase || item.phase;
  if (!PHASES.includes(selectedPhase)) throw new Error(`Unknown capsule phase: ${selectedPhase}`);
  if (selectedPhase !== item.phase && options.allowHistorical !== true) {
    throw new Error(`Capsule phase ${selectedPhase} is stale; current phase is ${item.phase}`);
  }
  const sources = [];
  const capsule = {
    schema: 'phase-context-capsule/v1',
    workItemId: item.id,
    phase: selectedPhase,
    role: String(role || '').trim() || ({ plan: 'cpo', design: 'cto', do: 'cto', review: 'independent-qa', report: 'ceo' }[selectedPhase]),
    scale: item.scale,
    revision: { plan: item.planRevision, design: item.designRevision },
    cleanRoom: selectedPhase === 'review' || role === 'independent-qa',
    sources,
    data: buildData(root, item, selectedPhase, options, sources),
  };
  const bytes = Buffer.byteLength(JSON.stringify(capsule), 'utf8');
  const limit = CAPSULE_LIMITS[item.scale];
  if (!limit || bytes > limit) {
    const error = new Error(`Context capsule is ${bytes}B and exceeds the ${item.scale} limit of ${limit || 0}B`);
    error.code = 'CAPSULE_BUDGET_EXCEEDED';
    error.bytes = bytes;
    error.limit = limit || 0;
    throw error;
  }
  return capsule;
}

function assertFreshCapsule(projectRoot, capsule, options = {}) {
  const root = path.resolve(projectRoot);
  if (!capsule || capsule.schema !== 'phase-context-capsule/v1') throw new Error('Invalid phase context capsule');
  const item = resolveItem(root, capsule.workItemId);
  if (capsule.phase !== item.phase && options.allowHistorical !== true) throw new Error('Context capsule phase is stale');
  if (capsule.scale !== item.scale || capsule.revision?.plan !== item.planRevision || capsule.revision?.design !== item.designRevision) {
    throw new Error('Context capsule revision is stale');
  }
  for (const source of capsule.sources || []) {
    const filePath = path.resolve(root, source.path);
    const relative = normalizeRelative(root, filePath);
    if (!relative || relative !== source.path || !fs.existsSync(filePath) || fs.lstatSync(filePath).isSymbolicLink()) {
      throw new Error(`Context capsule source is missing or unsafe: ${source.path}`);
    }
    const hash = sha256(fs.readFileSync(filePath));
    if (hash !== source.hash) throw new Error(`Context capsule source is stale: ${source.path}`);
  }
  const bytes = Buffer.byteLength(JSON.stringify(capsule), 'utf8');
  const limit = CAPSULE_LIMITS[item.scale];
  if (!limit || bytes > limit) throw new Error(`Context capsule exceeds the ${item.scale} byte limit`);
  return capsule;
}

module.exports = { CAPSULE_LIMITS, buildContextCapsule, assertFreshCapsule, safeSource };
