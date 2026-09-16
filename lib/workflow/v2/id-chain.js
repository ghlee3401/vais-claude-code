'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const stateStore = require('../../core/state-store');
const { atomicWrite } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');
const { loadChainCatalog, getStage, stageByPrefix, kindOf, stageOfKind } = require('./chain-registry');
const { renderArtifact } = require('./screen-capture');

const STAGE_SCHEMA = 'vais-stage/v1';
const ITEM_HEADING = /^###\s+([A-Z]{1,4})-(\d{3})(?:\s*(?:←|<-)\s*(.+?))?\s*$/;
const ANY_ITEM_HEADING = /^###\s+/;
const ITEM_ID = /^[A-Z]{1,4}-\d{3}$/;
const BASE_BUDGET_BYTES = 1024;
const PER_ITEM_BUDGET_BYTES = 1536;

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function indexPath(projectRoot) {
  return path.join(path.resolve(projectRoot), '.vais', 'v2', 'chain-index.json');
}

function emptyIndex() {
  return { schemaVersion: '1.0', items: {}, stages: {} };
}

function loadChainIndex(projectRoot) {
  const value = stateStore.read(indexPath(projectRoot));
  if (!value || value.schemaVersion !== '1.0') return emptyIndex();
  return { ...emptyIndex(), ...value, items: value.items || {}, stages: value.stages || {} };
}

function saveChainIndex(projectRoot, index) {
  fs.mkdirSync(path.dirname(indexPath(projectRoot)), { recursive: true });
  stateStore.lockedUpdate(indexPath(projectRoot), () => index);
  return index;
}

// `### F-003 ← REQ-001, REQ-002` followed by a `| 항목 | 내용 |` table. Everything between
// two item headings belongs to the item; the hash covers that body (title excluded).
function parseStageDocument(text, stage) {
  const document = matter(String(text || ''));
  const lines = document.content.split(/\r?\n/);
  const items = [];
  const findings = [];
  const sections = [];
  let current = null;
  const closeCurrent = () => {
    if (!current) return;
    const body = current.bodyLines.map(line => line.trim()).filter(Boolean).join('\n');
    current.hash = sha(body);
    delete current.bodyLines;
    items.push(current);
    current = null;
  };
  lines.forEach((line, index) => {
    const heading = line.match(ITEM_HEADING);
    if (heading) {
      closeCurrent();
      const [, prefix, number, parentText] = heading;
      const parents = String(parentText || '').split(/[,\s·]+/).map(value => value.trim()).filter(Boolean);
      for (const parent of parents) {
        if (!ITEM_ID.test(parent)) findings.push(`${prefix}-${number}: 부모 ID 형식 오류 "${parent}" (예: REQ-001)`);
      }
      if (stage && prefix !== stage.idPrefix) findings.push(`${prefix}-${number}: 이 문서의 접두는 ${stage.idPrefix} 여야 한다`);
      current = { id: `${prefix}-${number}`, prefix, number: Number(number), parents, fields: {}, line: index + 1, bodyLines: [] };
      return;
    }
    if (ANY_ITEM_HEADING.test(line)) {
      closeCurrent();
      findings.push(`${index + 1}행: 항목 제목 형식 오류 "${line.trim()}" (### PREFIX-001 ← 부모)`);
      return;
    }
    if (/^##\s+/.test(line)) {
      closeCurrent();
      sections.push(line.replace(/^##\s+/, '').trim());
      return;
    }
    if (!current) return;
    current.bodyLines.push(line);
    const row = line.match(/^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/);
    // Skip the table header (`| 항목 | 내용 |`) and separator rows; a data row may itself be named "항목".
    const isHeader = row && row[1].trim() === '항목' && row[2].trim() === '내용';
    if (row && !/^-+$/.test(row[1]) && !isHeader) current.fields[row[1].trim()] = row[2].trim();
  });
  closeCurrent();
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) findings.push(`${item.id}: 중복 항목`);
    seen.add(item.id);
  }
  return { data: document.data || {}, content: document.content, items, sections, findings };
}

function suggestParents(index, prefix, wanted, limit = 3) {
  const target = Number(String(wanted).split('-')[1]) || 0;
  return Object.keys(index.items)
    .filter(id => id.startsWith(`${prefix}-`))
    .sort((left, right) => Math.abs(Number(left.split('-')[1]) - target) - Math.abs(Number(right.split('-')[1]) - target))
    .slice(0, limit);
}

function stageDocumentBudget(itemCount) {
  return BASE_BUDGET_BYTES + PER_ITEM_BUDGET_BYTES * Math.max(1, itemCount);
}

// An artifact value must name a file inside the stage's artifact directory. Absolute paths,
// `..` segments, and anything that resolves outside that directory are rejected.
function artifactExists(projectRoot, stage, value) {
  if (!value || !stage.artifactDir) return false;
  const raw = String(value).replace(/\\/g, '/');
  if (path.isAbsolute(raw) || raw.split('/').some(segment => segment === '..' || segment === '')) return false;
  const candidate = raw.startsWith(`${stage.artifactDir}/`) ? raw : `${stage.artifactDir}/${raw}`;
  const target = path.resolve(projectRoot, candidate);
  const artifactRoot = path.resolve(projectRoot, stage.artifactDir);
  if (target !== artifactRoot && !target.startsWith(`${artifactRoot}${path.sep}`)) return false;
  return Boolean(normalizeRelative(projectRoot, target)) && fs.existsSync(target) && fs.statSync(target).isFile();
}

function validateStageDocument(projectRoot, stage, parsed, index, options = {}) {
  const findings = [...parsed.findings];
  if (parsed.data?.schema !== STAGE_SCHEMA) findings.push(`frontmatter schema 는 ${STAGE_SCHEMA} 여야 한다`);
  if (parsed.data?.stage !== stage.id) findings.push(`frontmatter stage 는 ${stage.id} 여야 한다`);
  for (const section of stage.documentSections || []) {
    if (!parsed.sections.some(value => value.includes(section))) findings.push(`문서 섹션 누락: ## ${section}`);
  }
  if (parsed.items.length === 0) findings.push(`${stage.idPrefix}-001 형식의 항목이 하나 이상 필요하다`);
  const parentRules = stage.parents || { required: false, allowed: [] };
  for (const item of parsed.items) {
    for (const field of stage.requiredFields || []) {
      if (!String(item.fields[field] || '').trim()) findings.push(`${item.id}: 필수 항목 누락 "${field}"`);
    }
    if (parentRules.required && item.parents.length === 0) findings.push(`${item.id}: 부모 ID 가 필요하다 (허용: ${parentRules.allowed.join(', ')})`);
    for (const parent of item.parents) {
      const prefix = parent.split('-')[0];
      if (!parentRules.allowed.includes(prefix)) {
        findings.push(`${item.id}: 허용되지 않는 부모 ${parent} (허용 접두: ${parentRules.allowed.join(', ') || '없음'})`);
        continue;
      }
      if (!index.items[parent]) {
        const hints = suggestParents(index, prefix, parent);
        findings.push(`${item.id}: 승인된 부모가 없다 ${parent}${hints.length ? ` (후보: ${hints.join(', ')})` : ''}`);
      }
    }
    for (const prefix of parentRules.requireEach || []) {
      if (!item.parents.some(parent => parent.startsWith(`${prefix}-`))) findings.push(`${item.id}: ${prefix} 부모가 하나 이상 필요하다`);
    }
    for (const field of stage.artifactFields || []) {
      const value = String(item.fields[field] || '').trim();
      if (value && !artifactExists(projectRoot, stage, value)) findings.push(`${item.id}: 산출물 파일이 없다 "${field}" = ${value}`);
    }
  }
  if (stage.coverage) {
    const covered = new Set(parsed.items.flatMap(item => item.parents));
    const upstream = Object.values(index.items).filter(entry => entry.prefix === stage.coverage).map(entry => entry.id);
    for (const id of upstream) if (!covered.has(id)) findings.push(`미커버: ${id} 를 부모로 둔 항목이 없다`);
  }
  const bytes = Buffer.byteLength(String(options.rawText ?? ''), 'utf8');
  const limit = stageDocumentBudget(parsed.items.length);
  if (options.rawText !== undefined && bytes > limit) findings.push(`정본 ${bytes}B 가 예산 ${limit}B (1,024 + 항목당 1,536) 를 넘는다`);
  return findings;
}

function computeStale(index) {
  const stale = [];
  for (const item of Object.values(index.items)) {
    for (const parent of item.parents || []) {
      const upstream = index.items[parent];
      if (!upstream) {
        // The parent was removed from its stage and that stage was re-approved: the child
        // points at nothing and must be re-parented, not confirmed.
        stale.push({ id: item.id, parent, recordedHash: item.parentHashes?.[parent] || null, currentHash: null, parentMissing: true });
        continue;
      }
      const recorded = item.parentHashes?.[parent];
      const confirmed = item.confirmedAgainst?.[parent];
      if (upstream.hash !== recorded && upstream.hash !== confirmed) {
        stale.push({ id: item.id, parent, recordedHash: recorded || null, currentHash: upstream.hash });
      }
    }
  }
  return stale;
}

function stageApproved(index, stageId) {
  return index.stages?.[stageId]?.status === 'approved';
}

function stageFilePath(projectRoot, stage) {
  return path.resolve(projectRoot, stage.file);
}

function readStageDocument(projectRoot, stage) {
  const file = stageFilePath(projectRoot, stage);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  return { raw, parsed: parseStageDocument(raw, stage) };
}

// Gate check used by `do ready` and Review for stage kinds. Never throws for document
// problems: they become findings so the transaction records them as evidence.
// Wireframe html and mockup svg become PNGs next to the source so the user confirms pictures,
// never files (docs/harness/design.md §2 확인 열). A render failure is a finding, not a crash.
function renderStageArtifacts(projectRoot, stage, parsed, options = {}) {
  const findings = [];
  const rendered = [];
  if (!stage.renderArtifacts || !stage.artifactDir) return { findings, rendered, renderer: null };
  let renderer = null;
  for (const item of parsed.items) {
    for (const field of stage.artifactFields || []) {
      const value = String(item.fields[field] || '').trim();
      if (!value || !/\.(?:html?|svg)$/i.test(value)) continue;
      const candidate = value.startsWith(`${stage.artifactDir}/`) ? value : `${stage.artifactDir}/${value}`;
      const target = path.resolve(projectRoot, candidate);
      if (!fs.existsSync(target)) continue;
      try {
        const result = renderArtifact(target, options);
        if (result.rendered) {
          renderer = result.renderer;
          rendered.push(normalizeRelative(projectRoot, result.png));
        }
      } catch (error) {
        findings.push(`${item.id}: 산출물 렌더 실패 "${field}" = ${value} — ${error.message}`);
      }
    }
  }
  return { findings, rendered, renderer };
}

function stageDocumentCheck(projectRoot, item, options = {}) {
  const stage = stageOfKind(kindOf(item));
  if (!stage) throw new Error(`Work item kind ${item.kind || '<none>'} is not a stage kind`);
  const document = readStageDocument(projectRoot, stage);
  const render = document ? renderStageArtifacts(projectRoot, stage, document.parsed, options) : { findings: [], rendered: [], renderer: null };
  const findings = document
    ? [...validateStageDocument(projectRoot, stage, document.parsed, loadChainIndex(projectRoot), { rawText: document.raw }), ...render.findings]
    : [`정본 파일이 없다: ${stage.file}`];
  const renderNote = render.rendered.length ? ` · 산출물 ${render.rendered.length}개 PNG 렌더 (${render.renderer})` : '';
  return {
    check: 'stage-document',
    execution: 'succeeded',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: [stage.file],
    requirements: [],
    summary: findings.length === 0
      ? `${stage.title} ${document.parsed.items.length}개 항목이 형식·부모·산출물·예산 검사를 통과${renderNote}`
      : `${findings.length} stage document issue(s) found`,
    findings,
    evidence: [stage.file, ...render.rendered],
  };
}

// Entry lock: a stage Work item may start only when the previous stage is approved and no
// approved item is stale. The message names the stage a non-developer must finish first.
function assertStageEntry(projectRoot, kind) {
  if (!kind?.entryRequires) return;
  const index = loadChainIndex(projectRoot);
  const previous = getStage(kind.entryRequires);
  if (!stageApproved(index, kind.entryRequires)) {
    const error = new Error(`${previous.order}단계 ${previous.title}(${previous.file})가 먼저 승인되어야 한다`);
    error.code = 'STAGE_ENTRY_LOCKED';
    throw error;
  }
  const stale = computeStale(index);
  if (stale.length > 0) {
    const error = new Error(`상위 항목이 바뀌어 stale 인 항목이 있다: ${stale.map(entry => `${entry.id}←${entry.parent}`).join(', ')}. 재승인하거나 \`/vais 변경 없음 확인: <항목> ← <부모>\` 로 해소한다`);
    error.code = 'STAGE_STALE_BLOCK';
    throw error;
  }
}

function serializeStage(data, content) {
  return matter.stringify(`\n${String(content || '').trim()}\n`, data);
}

// Report finalize for a stage kind: mark the canonical file approved and record every
// item's hash plus the hashes of its parents at approval time (the stale baseline).
function approveStage(projectRoot, stage, options = {}) {
  const document = readStageDocument(projectRoot, stage);
  if (!document) throw new Error(`Stage document is missing: ${stage.file}`);
  const index = loadChainIndex(projectRoot);
  const findings = validateStageDocument(projectRoot, stage, document.parsed, index, { rawText: document.raw });
  if (findings.length) throw new Error(`Stage document cannot be approved: ${findings.join('; ')}`);
  const approvedAt = new Date(options.timestamp || Date.now()).toISOString();
  const data = {
    ...document.parsed.data,
    schema: STAGE_SCHEMA,
    stage: stage.id,
    status: 'approved',
    approved_revision: Number(document.parsed.data?.approved_revision || 0) + 1,
    work_item: options.workItem || null,
    approved_at: approvedAt,
  };
  atomicWrite(stageFilePath(projectRoot, stage), serializeStage(data, document.parsed.content));
  for (const [id, entry] of Object.entries(index.items)) if (entry.stage === stage.id) delete index.items[id];
  for (const item of document.parsed.items) {
    const parentHashes = {};
    for (const parent of item.parents) if (index.items[parent]) parentHashes[parent] = index.items[parent].hash;
    index.items[item.id] = {
      id: item.id, stage: stage.id, prefix: item.prefix, hash: item.hash, parents: [...item.parents], parentHashes,
      approvedAt, workItem: options.workItem || null, revision: data.approved_revision, confirmedAgainst: {},
    };
  }
  index.stages[stage.id] = { status: 'approved', file: stage.file, approvedAt, workItem: options.workItem || null, revision: data.approved_revision };
  saveChainIndex(projectRoot, index);
  return { stage: stage.id, items: document.parsed.items.map(item => item.id), revision: data.approved_revision };
}

function confirmUnchanged(projectRoot, itemId, parentId) {
  const index = loadChainIndex(projectRoot);
  const item = index.items[itemId];
  const parent = index.items[parentId];
  if (!item) throw new Error(`Unknown approved item: ${itemId}`);
  if (!(item.parents || []).includes(parentId)) throw new Error(`${parentId} is not a parent of ${itemId}`);
  if (!parent) throw new Error(`${parentId} was removed from its stage; ${itemId} must be re-parented and re-approved, not confirmed`);
  item.confirmedAgainst = { ...(item.confirmedAgainst || {}), [parentId]: parent.hash };
  saveChainIndex(projectRoot, index);
  return { id: itemId, parent: parentId, confirmedHash: parent.hash };
}

// Rebuild the index from approved canonical files. Stale baselines cannot be recovered
// from files alone, so every rebuilt item is treated as consistent with its parents.
function reindex(projectRoot) {
  const index = emptyIndex();
  for (const stage of loadChainCatalog().stages) {
    const document = readStageDocument(projectRoot, stage);
    if (!document || document.parsed.data?.status !== 'approved') continue;
    for (const item of document.parsed.items) {
      const parentHashes = {};
      for (const parent of item.parents) if (index.items[parent]) parentHashes[parent] = index.items[parent].hash;
      index.items[item.id] = {
        id: item.id, stage: stage.id, prefix: item.prefix, hash: item.hash, parents: [...item.parents], parentHashes,
        approvedAt: document.parsed.data.approved_at || null, workItem: document.parsed.data.work_item || null,
        revision: Number(document.parsed.data.approved_revision || 1), confirmedAgainst: {},
      };
    }
    index.stages[stage.id] = {
      status: 'approved', file: stage.file, approvedAt: document.parsed.data.approved_at || null,
      workItem: document.parsed.data.work_item || null, revision: Number(document.parsed.data.approved_revision || 1),
    };
  }
  saveChainIndex(projectRoot, index);
  return index;
}

function chainStatus(projectRoot) {
  const index = loadChainIndex(projectRoot);
  return {
    schema: 'chain-status/v1',
    stages: loadChainCatalog().stages.map(stage => ({
      id: stage.id, order: stage.order, title: stage.title, file: stage.file,
      status: index.stages[stage.id]?.status || 'missing',
      items: Object.values(index.items).filter(entry => entry.stage === stage.id).length,
    })),
    stale: computeStale(index),
  };
}

module.exports = {
  STAGE_SCHEMA,
  ITEM_HEADING,
  BASE_BUDGET_BYTES,
  PER_ITEM_BUDGET_BYTES,
  indexPath,
  loadChainIndex,
  saveChainIndex,
  parseStageDocument,
  validateStageDocument,
  stageDocumentBudget,
  renderStageArtifacts,
  computeStale,
  stageApproved,
  stageByPrefix,
  readStageDocument,
  stageDocumentCheck,
  assertStageEntry,
  approveStage,
  confirmUnchanged,
  reindex,
  chainStatus,
};
