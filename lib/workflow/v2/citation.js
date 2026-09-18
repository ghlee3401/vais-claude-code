'use strict';

// Citation rule for implementation kinds (docs/harness/design.md §3 인용 강제): a feature or
// bug Design says what it builds only as approved IDs it cites (`## 인용`) and new items it
// declares (`## 신규`, `### API-007 ← S-002` + table). The same parser validates the Design,
// appends the new items to the canonical stage files when Do is ready, and stamps `구현됨`
// when the Report is frozen. Nothing here is edited by the model directly.

const fs = require('fs');
const path = require('path');
const idChain = require('./id-chain');
const { loadChainCatalog, stageByPrefix, kindOf } = require('./chain-registry');
const { parseDocument, workItemDirectory, PHASE_FOLDERS, atomicWrite } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');

const ID = /\b([A-Z]{1,4})-(\d{3})\b/g;
const SCREEN_PREFIXES = new Set(['S', 'W', 'V']);
const IMPLEMENTATION_TEMPLATES = new Set(['implementation', 'bugfix']);

function isImplementationKind(kind) {
  return IMPLEMENTATION_TEMPLATES.has(kind?.designTemplate);
}

// Text of one `## title` section (until the next `## ` heading), or '' when absent.
function sectionBody(content, pattern) {
  const lines = String(content || '').split(/\r?\n/);
  let inside = false;
  const body = [];
  for (const line of lines) {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading) {
      if (inside) break;
      inside = pattern.test(heading[1]);
      continue;
    }
    if (inside) body.push(line);
  }
  return inside || body.length ? body.join('\n') : '';
}

function hasSection(content, pattern) {
  return String(content || '').split(/\r?\n/).some(line => /^##\s+/.test(line) && pattern.test(line.replace(/^##\s+/, '')));
}

function bullets(text) {
  return String(text || '').split(/\r?\n/).map(line => /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line)).filter(Boolean).map(match => match[1].trim());
}

function parseCitations(content) {
  const cited = [...new Set([...sectionBody(content, /^인용|citations?/i).matchAll(ID)].map(match => `${match[1]}-${match[2]}`))];
  const additionsText = sectionBody(content, /^신규|additions?/i);
  // Reuse the stage parser without a stage: it yields ids, parents, fields, and body hashes.
  const parsed = idChain.parseStageDocument(additionsText, null);
  const reproText = sectionBody(content, /^재현/);
  return {
    cited,
    added: parsed.items,
    addedFindings: parsed.findings,
    checklist: bullets(sectionBody(content, /검수표|checklist/i)),
    repro: {
      present: hasSection(content, /^재현/),
      steps: bullets(reproText),
      screenshots: [...reproText.matchAll(/재현\s*화면\s*[:：]\s*(\S+)/g)].map(match => match[1].replace(/[`'"]/g, '')),
      impossible: /재현\s*불가/.test(reproText),
    },
    cause: hasSection(content, /^원인/),
    fix: hasSection(content, /^수정안/),
    resolvedDebts: bullets(sectionBody(content, /해소\s*부채/)),
  };
}

function pad(number) {
  return String(number).padStart(3, '0');
}

// Drafts this Work item already appended (a repaired Design re-presents them; Review re-checks them).
function isOwnDraft(index, id, workItem) {
  const entry = index.items[id];
  return Boolean(entry && workItem && entry.status === 'draft' && entry.workItem === workItem);
}

function nextNumber(index, prefix, addedSoFar, workItem) {
  const numbers = [
    ...Object.keys(index.items).filter(id => id.startsWith(`${prefix}-`) && !isOwnDraft(index, id, workItem)),
    ...addedSoFar.filter(id => id.startsWith(`${prefix}-`)),
  ].map(id => Number(id.split('-')[1]));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

// Remove `### ID` blocks (heading through the line before the next heading) for the given ids.
function stripItems(text, ids) {
  if (ids.length === 0) return text;
  const lines = String(text).split(/\r?\n/);
  const kept = [];
  let skipping = false;
  for (const line of lines) {
    const heading = idChain.ITEM_HEADING.exec(line);
    if (heading) skipping = ids.includes(`${heading[1]}-${heading[2]}`);
    else if (/^##\s+/.test(line)) skipping = false;
    if (!skipping) kept.push(line);
  }
  return kept.join('\n');
}

function candidatesFor(index, id) {
  return idChain.suggestParents(index, id.split('-')[0], id);
}

// Findings for an implementation Design. Empty array means the Design may be presented.
function validateCitations(projectRoot, parsed, options = {}) {
  const index = idChain.loadChainIndex(projectRoot);
  const findings = [...parsed.addedFindings];
  if (Object.keys(index.items).length === 0) {
    return ['제품 사슬이 비어 있다 — 기능·버그 작업은 승인된 문서 위에서만 시작한다. `/vais 새 제품: <이름>` 으로 1단계 요구사항 정의서부터 만든다'];
  }
  if (parsed.cited.length === 0 && parsed.added.length === 0) findings.push('`## 인용` 또는 `## 신규` 에 항목 ID 가 하나 이상 필요하다 — ID 없는 서술은 만드는 것이 아니다');
  for (const id of parsed.cited) {
    if (!index.items[id]) {
      const hints = candidatesFor(index, id);
      findings.push(`인용 ${id} 는 승인된 항목이 아니다${hints.length ? ` (후보: ${hints.join(', ')})` : ''}`);
    }
  }
  const addedIds = [];
  for (const item of parsed.added) {
    const stage = stageByPrefix(item.prefix);
    if (!stage) { findings.push(`${item.id}: 알 수 없는 접두 ${item.prefix}`); continue; }
    if (index.stages?.[stage.id]?.status !== 'approved') findings.push(`${item.id}: ${stage.title}(${stage.file}) 가 아직 승인되지 않았다 — 그 단계부터 만든다`);
    if (index.items[item.id] && !isOwnDraft(index, item.id, options.workItem)) findings.push(`${item.id}: 이미 존재하는 항목이다`);
    const expected = nextNumber(index, item.prefix, addedIds, options.workItem);
    if (item.number !== expected) findings.push(`${item.id}: 다음 빈 번호는 ${item.prefix}-${pad(expected)} 다`);
    const rules = stage.parents || { required: false, allowed: [] };
    if (rules.required && item.parents.length === 0) findings.push(`${item.id}: 부모 ID 가 필요하다 (허용: ${rules.allowed.join(', ')})`);
    for (const parent of item.parents) {
      const prefix = parent.split('-')[0];
      if (!rules.allowed.includes(prefix)) findings.push(`${item.id}: 허용되지 않는 부모 ${parent} (허용 접두: ${rules.allowed.join(', ') || '없음'})`);
      else if ((!index.items[parent] || isOwnDraft(index, parent, options.workItem)) && !addedIds.includes(parent)) {
        const hints = candidatesFor(index, parent);
        findings.push(`${item.id}: 부모 ${parent} 가 승인된 항목도 이 Design 의 신규 항목도 아니다${hints.length ? ` (후보: ${hints.join(', ')})` : ''}`);
      }
    }
    for (const prefix of rules.requireEach || []) {
      if (!item.parents.some(parent => parent.startsWith(`${prefix}-`))) findings.push(`${item.id}: ${prefix} 부모가 하나 이상 필요하다`);
    }
    for (const field of stage.requiredFields || []) {
      if (!String(item.fields[field] || '').trim()) findings.push(`${item.id}: 필수 항목 누락 "${field}"`);
    }
    addedIds.push(item.id);
  }
  if (options.kind === 'bug' && !parsed.added.some(item => item.prefix === 'TC')) findings.push('`## 신규` 에 재발 방지 TC 항목이 하나 이상 필요하다 (`### TC-NNN ← F-NNN`)');
  return findings;
}

// Bug Designs must show the bug: a reproduction section with a real screenshot, a cause, a fix.
function bugFindings(projectRoot, item, parsed) {
  const findings = [];
  if (!parsed.repro.present) findings.push('`## 재현` 절이 필요하다 (절차 + `재현 화면: <png>`)');
  if (parsed.repro.impossible) findings.push('재현 불가 — 재현 없는 버그 수정은 없다. 먼저 재현 절차와 화면을 만든다');
  if (parsed.repro.present && parsed.repro.screenshots.length === 0) findings.push('`## 재현` 에 `재현 화면: <png>` 줄이 필요하다');
  const itemDir = normalizeRelative(projectRoot, workItemDirectory(projectRoot, item)) || '';
  for (const shot of parsed.repro.screenshots) {
    const relative = normalizeRelative(projectRoot, shot);
    if (!relative || !relative.startsWith(`${itemDir}/`)) findings.push(`재현 화면 경로는 Work item 폴더 안이어야 한다 (${shot})`);
    else if (!fs.existsSync(path.join(projectRoot, relative))) findings.push(`재현 화면 파일이 없다 (${relative})`);
    else if (!/\.png$/i.test(relative)) findings.push(`재현 화면은 PNG 여야 한다 (${relative})`);
  }
  if (!parsed.cause) findings.push('`## 원인` 절이 필요하다');
  if (!parsed.fix) findings.push('`## 수정안` 절이 필요하다');
  return findings;
}

function renderAddition(item) {
  const heading = item.parents.length ? `### ${item.id} ← ${item.parents.join(', ')}` : `### ${item.id}`;
  const rows = Object.entries(item.fields).map(([field, value]) => `| ${field} | ${value} |`);
  return ['', heading, '| 항목 | 내용 |', '|---|---|', ...rows, ''].join('\n');
}

// Which canonical files the additions land in, with their would-be content and budget findings.
// Drafts this Work item appended earlier are replaced, so a repaired Design never duplicates them.
function previewAdditions(projectRoot, parsed, options = {}) {
  const index = idChain.loadChainIndex(projectRoot);
  const groups = new Map();
  for (const item of parsed.added) {
    const stage = stageByPrefix(item.prefix);
    if (!stage) continue;
    if (!groups.has(stage.id)) groups.set(stage.id, { stage, items: [] });
    groups.get(stage.id).items.push(item);
  }
  const previews = [];
  const findings = [];
  for (const { stage, items } of groups.values()) {
    const file = path.resolve(projectRoot, stage.file);
    if (!fs.existsSync(file)) { findings.push(`${stage.title} 정본이 없다: ${stage.file}`); continue; }
    const current = fs.readFileSync(file, 'utf8');
    const ownDrafts = Object.values(index.items).filter(entry => entry.stage === stage.id && isOwnDraft(index, entry.id, options.workItem)).map(entry => entry.id);
    const next = stripItems(current, ownDrafts).replace(/\s*$/, '\n') + items.map(renderAddition).join('');
    const parsedNext = idChain.parseStageDocument(next, stage);
    const limit = idChain.stageDocumentBudget(parsedNext.items.length);
    const bytes = Buffer.byteLength(next, 'utf8');
    if (bytes > limit) findings.push(`${stage.file}: 신규 항목을 붙이면 ${bytes}B 로 예산 ${limit}B 를 넘는다`);
    previews.push({ stage, file, current, next, items, parsedNext });
  }
  return { previews, findings, files: previews.map(preview => preview.file) };
}

// Do is READY: append the new items to their canonical files and register them as drafts.
function applyAdditions(projectRoot, item, parsed, options = {}) {
  const { previews, findings } = previewAdditions(projectRoot, parsed, { workItem: item.id });
  if (findings.length) throw new Error(`신규 항목을 붙일 수 없다: ${findings.join('; ')}`);
  const index = idChain.loadChainIndex(projectRoot);
  const now = new Date(options.timestamp || Date.now()).toISOString();
  const ids = [];
  for (const preview of previews) {
    // Earlier drafts of this Work item in this stage give way to the current Design's items.
    for (const entry of Object.values(index.items)) if (entry.stage === preview.stage.id && isOwnDraft(index, entry.id, item.id)) delete index.items[entry.id];
    atomicWrite(preview.file, preview.next);
    for (const added of preview.items) {
      const entry = preview.parsedNext.items.find(candidate => candidate.id === added.id);
      const parentHashes = {};
      for (const parent of added.parents) if (index.items[parent]) parentHashes[parent] = index.items[parent].hash;
      index.items[added.id] = {
        id: added.id, stage: preview.stage.id, prefix: added.prefix, hash: entry.hash, parents: [...added.parents], parentHashes,
        approvedAt: null, workItem: item.id, revision: index.stages[preview.stage.id]?.revision || 1, confirmedAgainst: {}, status: 'draft', addedAt: now,
        // Appended at the end of the file, the item inherits the last `## 범위:` section.
        scope: entry.scope || null,
      };
      ids.push(added.id);
    }
  }
  // Parents declared in the same Design resolve once every addition is registered.
  for (const id of ids) {
    for (const parent of index.items[id].parents) if (index.items[parent] && !index.items[id].parentHashes[parent]) index.items[id].parentHashes[parent] = index.items[parent].hash;
  }
  idChain.saveChainIndex(projectRoot, index);
  return { ids, files: previews.map(preview => normalizeRelative(projectRoot, preview.file)) };
}

// Report is frozen: cited and added items carry the implementation stamp; additions become approved.
function markImplemented(projectRoot, item, parsed, options = {}) {
  const index = idChain.loadChainIndex(projectRoot);
  const at = new Date(options.timestamp || Date.now()).toISOString();
  const stamped = [];
  for (const id of [...parsed.cited, ...parsed.added.map(entry => entry.id)]) {
    const entry = index.items[id];
    if (!entry) continue;
    entry.implemented = { workItem: item.id, at };
    if (entry.status === 'draft') {
      entry.status = 'approved';
      entry.approvedAt = at;
    }
    stamped.push(id);
  }
  idChain.saveChainIndex(projectRoot, index);
  return { stamped };
}

function designTestCases(parsed) {
  return new Set([...parsed.cited.filter(id => id.startsWith('TC-')), ...parsed.added.filter(item => item.prefix === 'TC').map(item => item.id)]);
}

function touchesScreens(parsed) {
  return [...parsed.cited, ...parsed.added.map(item => item.id)].some(id => SCREEN_PREFIXES.has(id.split('-')[0]));
}

function readDesignCitations(projectRoot, item) {
  const design = parseDocument(path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.design, 'main.md'));
  return parseCitations(design?.content || '');
}

// Readiness check for implementation kinds: the Design still validates and the additions fit.
function implementationDocumentCheck(projectRoot, item) {
  const parsed = readDesignCitations(projectRoot, item);
  const kind = kindOf(item);
  const findings = [...validateCitations(projectRoot, parsed, { kind: kind?.id, workItem: item.id }), ...previewAdditions(projectRoot, parsed, { workItem: item.id }).findings];
  if (kind?.designTemplate === 'bugfix') findings.push(...bugFindings(projectRoot, item, parsed));
  return {
    check: 'implementation-document',
    execution: 'succeeded',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: [`${loadChainCatalog().productRoot}/**`],
    requirements: [],
    summary: findings.length === 0
      ? `인용 ${parsed.cited.length}·신규 ${parsed.added.length} 항목이 사슬과 일치하고 정본 예산 안에 든다`
      : `${findings.length} implementation document issue(s) found`,
    findings,
    evidence: [...new Set(parsed.added.map(entry => stageByPrefix(entry.prefix)?.file).filter(Boolean))],
  };
}

module.exports = {
  IMPLEMENTATION_TEMPLATES, isImplementationKind, sectionBody, parseCitations, validateCitations, bugFindings,
  renderAddition, previewAdditions, applyAdditions, markImplemented, designTestCases, touchesScreens,
  readDesignCitations, implementationDocumentCheck,
};
