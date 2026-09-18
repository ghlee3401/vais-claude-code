'use strict';

// `/vais 정리: 범위 X` → `/vais 정리 확인` (harness-scope-sections REQ-005/006). A project that
// started before scope sections existed has flat canonical documents (items under no
// `## 범위:` heading) and one Feature folder per stage (`work-items/login`, `work-items/features`
// …). The migration wraps every canonical file in one scope section, moves the stage Work item
// folders under `work-items/<scope>/<id>` (ids unchanged), and rewrites the three runtime records
// that name the Feature (work-items.json, chain-index.json, ledger.jsonl). Propose computes and
// shows everything without touching a file; commit re-checks the safety conditions, applies the
// steps with an undo list, and rolls every step back if one fails. A second commit is "변경 없음".

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const stateStore = require('../../core/state-store');
const { WorkItemStore } = require('./work-item-store');
const { atomicWrite, serialize, parseDocument, writeMaster, writeFeatureIndexes, featureIndexPath } = require('./document-manager');
const { loadChainCatalog, kindOf, isStageKind } = require('./chain-registry');
const { writeProductNote } = require('./product-note');
const idChain = require('./id-chain');
const ledger = require('./ledger');
const vcs = require('./vcs');

const PROPOSAL_FILE = path.join('.vais', 'v2', 'scope-migration.json');
const TRASH_DIR = path.join('.vais', 'v2', 'migrate-trash');

function proposalPath(projectRoot) {
  return path.join(path.resolve(projectRoot), PROPOSAL_FILE);
}

function readProposal(projectRoot) {
  const file = proposalPath(projectRoot);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function refuse(reason, next, code = 'MIGRATE_REFUSED') {
  const error = new Error(next ? `${reason}. ${next}` : reason);
  error.code = code;
  error.reason = reason;
  error.next = next || null;
  return error;
}

function relative(projectRoot, target) {
  return path.relative(path.resolve(projectRoot), target).split(path.sep).join('/');
}

function firstSentence(text) {
  const value = String(text || '').trim();
  const match = value.match(/^(.*?[.!?。])(?:\s|$)/);
  return (match ? match[1] : value).trim();
}

// One flat document → the same document with `## 범위: <scope>` opening the item list. Stage 01
// also gets `문제:`/`목표:` lead lines from the first sentence of its old product sections; a
// section that held only that sentence is moved, a longer one is copied and kept.
function wrapDocument(stage, raw, scope) {
  const document = matter(String(raw || ''));
  const lines = document.content.split(/\r?\n/);
  const firstItem = lines.findIndex(line => idChain.ITEM_HEADING.test(line));
  if (firstItem === -1) return { changed: false, text: raw, blockers: [], warnings: [] };
  const blockers = [];
  const warnings = [];
  const late = lines.slice(firstItem).find(line => /^##\s+/.test(line));
  if (late) blockers.push(`${stage.file}: 항목 사이에 "${late.trim()}" 제목이 있다 — 항목 위로 옮기거나 지운 뒤 다시 정리한다`);
  const removed = new Set();
  const lead = [];
  for (const field of stage.scopeLines || []) {
    const start = lines.findIndex((line, index) => index < firstItem && new RegExp(`^##\\s+${field}\\s*$`).test(line));
    if (start === -1) {
      warnings.push(`${stage.file}: "## ${field}" 절이 없어 "${field}: (정리 때 비어 있었다 — 채운다)" 로 둔다`);
      lead.push(`${field}: (정리 때 비어 있었다 — 채운다)`);
      continue;
    }
    let end = start + 1;
    while (end < firstItem && !/^##\s+/.test(lines[end])) end += 1;
    const body = lines.slice(start + 1, end).map(line => line.trim()).filter(Boolean);
    const sentence = firstSentence(body[0] || '');
    lead.push(`${field}: ${sentence || '(정리 때 비어 있었다 — 채운다)'}`);
    if (body.length === 1 && body[0] === sentence) for (let index = start; index < end; index += 1) removed.add(index);
    else if (body.length) warnings.push(`${stage.file}: "## ${field}" 절에 문장이 더 있어 첫 문장만 옮기고 절은 남긴다`);
  }
  const before = lines.slice(0, firstItem).filter((_, index) => !removed.has(index));
  while (before.length && !before[before.length - 1].trim()) before.pop();
  const after = lines.slice(firstItem);
  const content = [...before, ...(before.length ? [''] : []), `## 범위: ${scope}`, ...lead, '', ...after].join('\n');
  return { changed: true, text: matter.stringify(`\n${content.trim()}\n`, document.data), blockers, warnings };
}

function documentPlans(projectRoot, scope, index) {
  const plans = [];
  const blockers = [];
  const warnings = [];
  for (const stage of loadChainCatalog().stages) {
    if (!stage.scoped) continue;
    const document = idChain.readStageDocument(projectRoot, stage);
    if (!document) continue;
    const scoped = document.parsed.items.filter(item => item.scope);
    if (scoped.length === document.parsed.items.length) { plans.push({ stage: stage.id, file: stage.file, action: 'unchanged', items: scoped.length }); continue; }
    if (scoped.length > 0) {
      blockers.push(`${stage.file}: 범위 절 안 항목과 밖 항목이 섞여 있다 (${document.parsed.items.length - scoped.length}개 밖) — 손으로 절 아래로 옮긴 뒤 다시 정리한다`);
      continue;
    }
    const wrapped = wrapDocument(stage, document.raw, scope);
    blockers.push(...wrapped.blockers);
    warnings.push(...wrapped.warnings);
    if (!wrapped.changed || wrapped.blockers.length) continue;
    const parsedNext = idChain.parseStageDocument(wrapped.text, stage);
    for (const item of parsedNext.items) {
      const recorded = index.items[item.id];
      if (recorded && recorded.hash !== item.hash) blockers.push(`${item.id}: 정본 내용이 승인본(chain-index)과 다르다 — \`stage reindex\` 또는 재승인 뒤 다시 정리한다`);
    }
    const findings = idChain.validateStageDocument(projectRoot, stage, parsedNext, index, { rawText: wrapped.text });
    if (findings.length) blockers.push(`${stage.file}: 감싼 뒤 검사 실패 — ${findings.join('; ')}`);
    plans.push({ stage: stage.id, file: stage.file, action: 'wrap', items: parsedNext.items.length, next: wrapped.text, previous: document.raw, leadLines: (stage.scopeLines || []).length });
  }
  return { plans, blockers, warnings };
}

function workItemPlans(projectRoot, scope, registry, index) {
  const known = new Set(Object.values(index.items).map(item => item.scope).filter(Boolean));
  const moves = [];
  const warnings = [];
  const blockers = [];
  for (const item of Object.values(registry.workItems)) {
    if (!isStageKind(kindOf(item))) continue;
    const feature = String(item.primaryFeature || '').split('/')[0];
    if (!feature || feature === scope || known.has(feature)) continue;
    const folder = String(item.id).replace(/^WI-/, '');
    const from = path.join(path.resolve(projectRoot), 'docs', 'work-items', feature, folder);
    const to = path.join(path.resolve(projectRoot), 'docs', 'work-items', scope, folder);
    const exists = fs.existsSync(from);
    if (!exists) warnings.push(`${item.id}: 회의록 폴더가 없어 상태만 바꾼다 (${relative(projectRoot, from)})`);
    if (fs.existsSync(to)) blockers.push(`${item.id}: 대상 폴더가 이미 있다 ${relative(projectRoot, to)}`);
    moves.push({ id: item.id, feature, from: relative(projectRoot, from), to: relative(projectRoot, to), exists });
  }
  return { moves, warnings, blockers };
}

function chainItemsToTag(index) {
  const scopedStages = new Set(loadChainCatalog().stages.filter(stage => stage.scoped).map(stage => stage.id));
  return Object.values(index.items).filter(item => scopedStages.has(item.stage) && !item.scope).map(item => item.id);
}

function ledgerEntriesToRetag(projectRoot, moves) {
  const ids = new Set(moves.map(move => move.id));
  const features = new Set(moves.map(move => move.feature));
  return ledger.read(projectRoot).entries.filter(entry => ids.has(entry.workItemId) || features.has(entry.feature)).map(entry => entry.id);
}

function featureIndexesToRemove(projectRoot, moves, registry) {
  const moved = new Set(moves.map(move => move.id));
  const removable = [];
  for (const feature of new Set(moves.map(move => move.feature))) {
    const stillUsed = Object.values(registry.workItems).some(item => !moved.has(item.id) &&
      (String(item.primaryFeature || '').split('/')[0] === feature || (item.affectedFeatures || []).includes(feature)));
    if (stillUsed) continue;
    const dir = path.dirname(featureIndexPath(projectRoot, feature));
    if (fs.existsSync(dir)) removable.push(relative(projectRoot, dir));
  }
  return removable.sort();
}

function proposeScopeMigration(projectRoot, scope) {
  const name = String(scope || '').trim().toLowerCase();
  if (!idChain.SCOPE_NAME.test(name)) return { ok: false, scope: name, reason: '범위 이름은 kebab-case 영어(예: member-management)여야 한다', blockers: [], warnings: [] };
  const store = new WorkItemStore(projectRoot);
  const registry = store.readRegistry();
  const index = idChain.loadChainIndex(projectRoot);
  const documents = documentPlans(projectRoot, name, index);
  const workItems = workItemPlans(projectRoot, name, registry, index);
  const chainItems = chainItemsToTag(index);
  const ledgerEntries = ledgerEntriesToRetag(projectRoot, workItems.moves);
  const removeIndexes = featureIndexesToRemove(projectRoot, workItems.moves, registry);
  const blockers = [...documents.blockers, ...workItems.blockers];
  const warnings = [...documents.warnings, ...workItems.warnings];
  const wraps = documents.plans.filter(plan => plan.action === 'wrap');
  const unchanged = wraps.length === 0 && workItems.moves.length === 0 && chainItems.length === 0 && ledgerEntries.length === 0;
  const proposal = {
    schema: 'scope-migration-proposal/v1',
    ok: blockers.length === 0,
    scope: name,
    unchanged,
    reason: blockers.length ? blockers[0] : unchanged ? '변경 없음 — 이미 이 범위로 정리돼 있다' : null,
    documents: documents.plans.map(plan => ({ stage: plan.stage, file: plan.file, action: plan.action, items: plan.items })),
    workItems: workItems.moves,
    state: { workItems: workItems.moves.length, chainItems: chainItems.length, ledgerEntries: ledgerEntries.length },
    featureIndexesToRemove: removeIndexes,
    blockers,
    warnings,
    confirmWith: `/vais 정리 확인 (또는 /vais 정리 확인: 범위 ${name})`,
    proposedAt: new Date().toISOString(),
  };
  if (proposal.ok && !unchanged) {
    fs.mkdirSync(path.dirname(proposalPath(projectRoot)), { recursive: true });
    atomicWrite(proposalPath(projectRoot), `${JSON.stringify({ scope: name, proposedAt: proposal.proposedAt, state: proposal.state }, null, 2)}\n`);
  }
  return { ...proposal, _plans: { documents: documents.plans, chainItems, ledgerEntries } };
}

// REQ-006: the four conditions, in order, before a file is touched.
function assertSafeToMigrate(projectRoot, store, sessionId) {
  const registry = store.readRegistry();
  const current = store.getCurrent();
  if (current) throw refuse(`진행 중 작업이 있다: ${current.id} (${current.phase}/${current.status})`, '그 작업을 Report 까지 끝내거나 `/vais cancel` 한 뒤 다시 정리한다');
  const paused = Object.values(registry.workItems).filter(item => item.status === 'paused');
  if (paused.length) throw refuse(`일시정지된 작업이 있다: ${paused.map(item => item.id).join(', ')}`, '`/vais resume` 으로 끝내거나 `/vais cancel` 한 뒤 다시 정리한다');
  const now = Date.now();
  const foreign = Object.entries(registry.leases).filter(([, lease]) => lease && lease.sessionId !== sessionId && Date.parse(lease.expiresAt) > now);
  if (foreign.length) throw refuse(`다른 세션이 작업을 잡고 있다: ${foreign.map(([id, lease]) => `${id} (${lease.sessionId})`).join(', ')}`, '그 세션이 끝나거나 lease 가 만료된 뒤 다시 정리한다');
  if (vcs.isGitRepo(projectRoot)) {
    const dirty = vcs.changedFiles(projectRoot);
    if (dirty.length) throw refuse(`저장하지 않은 변경 ${dirty.length}개가 있다 (${dirty.slice(0, 3).map(entry => entry.file).join(', ')}${dirty.length > 3 ? ' …' : ''})`, '먼저 `/vais 저장` → `/vais 저장 확인` 으로 커밋한 뒤 다시 정리한다');
  }
  const index = idChain.loadChainIndex(projectRoot);
  for (const stage of loadChainCatalog().stages) {
    const document = idChain.readStageDocument(projectRoot, stage);
    const fileApproved = document?.parsed.data?.status === 'approved';
    const entry = index.stages[stage.id];
    const indexApproved = entry?.status === 'approved';
    if (fileApproved !== indexApproved) throw refuse(`${stage.file} 의 승인 상태가 chain-index 와 다르다 (파일 ${fileApproved ? 'approved' : '미승인'} · index ${indexApproved ? 'approved' : '없음'})`, '`stage reindex` 로 맞춘 뒤 다시 정리한다');
    if (fileApproved && Number(document.parsed.data.approved_revision || 1) !== Number(entry.revision || 1)) throw refuse(`${stage.file} 의 approved_revision 이 chain-index 와 다르다`, '`stage reindex` 로 맞춘 뒤 다시 정리한다');
  }
}

function rewriteLedger(projectRoot, ids, scope) {
  const file = path.join(path.resolve(projectRoot), '.vais', 'v2', 'ledger.jsonl');
  if (!fs.existsSync(file)) return { previous: null, next: null, file };
  const previous = fs.readFileSync(file, 'utf8');
  const wanted = new Set(ids);
  const next = previous.split('\n').map(line => {
    if (!line.trim()) return line;
    try {
      const entry = JSON.parse(line);
      if (!wanted.has(entry.id)) return line;
      return JSON.stringify({ ...entry, feature: scope });
    } catch (_) {
      return line;
    }
  }).join('\n');
  return { previous, next, file };
}

function commitScopeMigration(projectRoot, options = {}) {
  const root = path.resolve(projectRoot);
  const scope = String(options.scope || readProposal(root)?.scope || '').trim().toLowerCase();
  if (!scope) throw refuse('정리할 범위 이름이 없다', '먼저 `/vais 정리: 범위 <이름>` 으로 제안을 받는다');
  vcs.requireConfirmation(root, options.sessionId, entry => entry.type === 'migrate' && entry.scope === scope, '/vais 정리 확인');
  const store = new WorkItemStore(root);
  assertSafeToMigrate(root, store, options.sessionId);
  const proposal = proposeScopeMigration(root, scope);
  if (!proposal.ok) throw refuse(proposal.reason, '막힌 항목을 해소한 뒤 다시 정리한다');
  if (proposal.unchanged) {
    fs.rmSync(proposalPath(root), { force: true });
    return { schema: 'scope-migration/v1', ok: true, scope, unchanged: true, message: '변경 없음 — 이미 이 범위로 정리돼 있다', applied: [] };
  }
  if (typeof options.beforeApply === 'function') options.beforeApply(proposal);

  const undo = [];
  const applied = [];
  const step = (label, run, revert) => {
    run();
    applied.push(label);
    undo.push(revert);
  };
  try {
    // 1. Work item folders move under the scope; the root frontmatter names the new Feature.
    for (const move of proposal.workItems) {
      if (!move.exists) continue;
      const from = path.join(root, move.from);
      const to = path.join(root, move.to);
      step(`move ${move.id}`, () => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(from, to); }, () => { fs.mkdirSync(path.dirname(from), { recursive: true }); fs.renameSync(to, from); });
      const rootFile = path.join(to, 'main.md');
      const previous = fs.existsSync(rootFile) ? fs.readFileSync(rootFile, 'utf8') : null;
      const parsed = previous !== null ? parseDocument(rootFile) : null;
      if (parsed?.data) {
        step(`retag ${move.id}`, () => atomicWrite(rootFile, serialize({ ...parsed.data, primary_feature: scope }, parsed.content)), () => fs.writeFileSync(rootFile, previous));
      }
      if (typeof options.failAfter === 'function' && options.failAfter(move)) throw new Error(`injected failure after ${move.id}`);
    }
    // 2. Canonical documents get their scope section.
    for (const plan of proposal._plans.documents.filter(entry => entry.action === 'wrap')) {
      const file = path.join(root, plan.file);
      step(`wrap ${plan.file}`, () => atomicWrite(file, plan.next), () => fs.writeFileSync(file, plan.previous));
    }
    // 3. Runtime records: work-items.json, chain-index.json, ledger.jsonl.
    const registryFile = store.statePath;
    const registryPrevious = fs.existsSync(registryFile) ? fs.readFileSync(registryFile, 'utf8') : null;
    const movedIds = new Set(proposal.workItems.map(move => move.id));
    step('work-items.json', () => stateStore.lockedUpdate(registryFile, raw => {
      const value = raw || {};
      for (const id of movedIds) if (value.workItems?.[id]) value.workItems[id] = { ...value.workItems[id], primaryFeature: scope };
      return value;
    }), () => { if (registryPrevious !== null) fs.writeFileSync(registryFile, registryPrevious); });
    const indexFile = idChain.indexPath(root);
    const indexPrevious = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, 'utf8') : null;
    const tagIds = new Set(proposal._plans.chainItems);
    step('chain-index.json', () => {
      const index = idChain.loadChainIndex(root);
      for (const id of tagIds) if (index.items[id]) index.items[id].scope = scope;
      idChain.saveChainIndex(root, index);
    }, () => { if (indexPrevious !== null) fs.writeFileSync(indexFile, indexPrevious); });
    const ledgerRewrite = rewriteLedger(root, proposal._plans.ledgerEntries, scope);
    if (ledgerRewrite.next !== null && ledgerRewrite.next !== ledgerRewrite.previous) {
      step('ledger.jsonl', () => atomicWrite(ledgerRewrite.file, ledgerRewrite.next), () => fs.writeFileSync(ledgerRewrite.file, ledgerRewrite.previous));
    }
    // 4. Old Feature indexes go to a trash folder (undoable), then the indexes and notes are rebuilt.
    const trash = path.join(root, TRASH_DIR);
    for (const dir of proposal.featureIndexesToRemove) {
      const from = path.join(root, dir);
      const to = path.join(trash, dir.replace(/\//g, '__'));
      step(`remove ${dir}`, () => { fs.mkdirSync(trash, { recursive: true }); fs.rmSync(to, { recursive: true, force: true }); fs.renameSync(from, to); }, () => fs.renameSync(to, from));
    }
    for (const id of movedIds) {
      const item = store.get(id);
      if (item) writeFeatureIndexes(root, item);
    }
    writeMaster(root);
    writeProductNote(root, { registry: store.readRegistry() });
    fs.rmSync(trash, { recursive: true, force: true });
    fs.rmSync(proposalPath(root), { force: true });
  } catch (error) {
    for (const revert of undo.reverse()) {
      try { revert(); } catch (_) { /* best effort: keep rolling back the rest */ }
    }
    const failure = new Error(`정리 중단: ${error.message}. 되돌렸다 (변경 0)`);
    failure.code = 'MIGRATE_FAILED';
    failure.applied = applied;
    throw failure;
  }
  return {
    schema: 'scope-migration/v1',
    ok: true,
    scope,
    unchanged: false,
    movedWorkItems: proposal.workItems.map(move => ({ id: move.id, from: move.from, to: move.to })),
    wrappedDocuments: proposal.documents.filter(plan => plan.action === 'wrap').map(plan => plan.file),
    state: proposal.state,
    removedFeatureIndexes: proposal.featureIndexesToRemove,
    warnings: proposal.warnings,
    applied,
  };
}

module.exports = { PROPOSAL_FILE, proposalPath, readProposal, firstSentence, wrapDocument, proposeScopeMigration, assertSafeToMigrate, commitScopeMigration };
