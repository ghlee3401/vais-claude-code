'use strict';

// harness-scope-sections REQ-005/006: `/vais 정리: 범위 X` → `/vais 정리 확인` on a project shaped like
// po_report before 4.3.0 — flat canonical files 01..04, one Feature folder per stage
// (login · features · screens · wireframes), chain-index without scopes, ledger entries per Feature.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const idChain = require('../lib/workflow/v2/id-chain');
const { loadChainCatalog, getStage } = require('../lib/workflow/v2/chain-registry');
const { serialize, documentState } = require('../lib/workflow/v2/document-manager');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const ledger = require('../lib/workflow/v2/ledger');
const migrate = require('../lib/workflow/v2/migrate-scopes');
const { execute } = require('../scripts/vais-workflow-v2');

const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');
const SESSION = 'migrate-session';
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'vais', GIT_AUTHOR_EMAIL: 'vais@example.com', GIT_COMMITTER_NAME: 'vais', GIT_COMMITTER_EMAIL: 'vais@example.com' };
const LEGACY = Object.freeze([
  { order: 1, feature: 'login', id: 'WI-2026-09-17-login' },
  { order: 2, feature: 'features', id: 'WI-2026-09-17-features' },
  { order: 3, feature: 'screens', id: 'WI-2026-09-17-screens' },
  { order: 4, feature: 'wireframes', id: 'WI-2026-09-18-wireframes' },
]);

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: GIT_ENV }).trim();
}

// The 4.2.x fixture text: no `## 범위:` heading, and stage 01 with its four product sections.
function legacyText(stage, workItem) {
  let text = fs.readFileSync(path.join(FIXTURES, path.basename(stage.file)), 'utf8').replace('## 범위: reading-log\n', '');
  if (stage.order === 1) {
    text = text
      .replace('문제: 읽은 책과 느낌을 남길 곳이 없다.\n목표: 책을 등록하고 별점과 한 줄 감상을 남긴다.\n\n', '')
      .replace('## 대상 사용자', '## 문제\n읽은 책과 느낌을 남길 곳이 없다.\n\n## 대상 사용자')
      .replace('## 제외', '## 목표\n책을 등록하고 별점과 한 줄 감상을 남긴다. 나중에는 통계도 본다.\n\n## 제외');
  }
  return text.replace('status: draft', `status: approved\napproved_revision: 1\nwork_item: ${workItem}\napproved_at: '2026-09-17T09:00:00.000Z'`);
}

function legacyRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-migrate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '4.2.1', workflowV2: { mode: 'enforce' } }));
  fs.writeFileSync(path.join(root, '.gitignore'), '.vais/\n');
  const registry = { schemaVersion: '1.0', currentWorkItemId: null, workItems: {}, pendingRequests: [], leases: {}, repoSnapshots: {}, checkReceipts: {}, checkExecutions: {}, assignments: {}, driftAlerts: [], events: [] };
  for (const entry of LEGACY) {
    const stage = getStage(loadChainCatalog().stages.find(candidate => candidate.order === entry.order).id);
    fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
    fs.writeFileSync(path.join(root, stage.file), legacyText(stage, entry.id));
    if (stage.artifactDir) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(path.join(FIXTURES, path.basename(stage.artifactDir)))) fs.copyFileSync(path.join(FIXTURES, path.basename(stage.artifactDir), name), path.join(root, stage.artifactDir, name));
    }
    const item = {
      id: entry.id, title: `po-report ${entry.order}단계 ${stage.title} — 구성원 관리`, primaryFeature: entry.feature, affectedFeatures: [], scale: 'compact', kind: `stage-${stage.id.replace(/^stage-/, '')}`,
      phase: 'report', status: 'completed', planRevision: 1, designRevision: 1, writeScopes: [stage.file], readinessChecks: ['stage-document'], reviewChecks: ['stage-document'],
      requiredSpecialists: [], readinessNotReadyCount: 0, qaRepairCount: 0, createdAt: '2026-09-17T08:00:00.000Z', updatedAt: `2026-09-1${entry.order > 3 ? 8 : 7}T09:0${entry.order}:00.000Z`, approvals: {}, reportFrozen: true,
    };
    registry.workItems[item.id] = item;
    const folder = path.join(root, 'docs', 'work-items', entry.feature, entry.id.replace(/^WI-/, ''));
    fs.mkdirSync(path.join(folder, '05-report'), { recursive: true });
    fs.writeFileSync(path.join(folder, 'main.md'), serialize(documentState(item), `# ${item.id} — ${item.title}\n`));
    fs.writeFileSync(path.join(folder, '05-report', 'main.md'), `---\nschema: vais-phase/v1\nwork_item: ${item.id}\nphase: report\nrevision: 1\nstatus: approved\nfrozen: true\n---\n\n# Report\n`);
    fs.mkdirSync(path.join(root, 'docs', 'features', entry.feature), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'features', entry.feature, 'main.md'), `---\nschema: vais-feature/v1\nid: ${entry.feature}\n---\n\n# ${entry.feature}\n`);
  }
  fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
  fs.writeFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), JSON.stringify(registry, null, 2));
  idChain.reindex(root);
  for (const entry of LEGACY) ledger.append(root, { workItemId: entry.id, feature: entry.feature, kind: 'decision', text: `${entry.feature} 결정`, why: 'x', source: { type: 'event', id: 't' }, refs: [] });
  ledger.append(root, { workItemId: null, feature: null, kind: 'note', text: '범위 없는 메모', why: '', source: { type: 'user', id: 'u' }, refs: [] });
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'legacy']);
  return root;
}

function confirm(root, scope) {
  new AuthorizationStore(root).grant({ sessionId: SESSION, workItemId: null, phase: 'plan', action: 'migrate-confirm', allowedPaths: [], allowedCommands: [], confirmations: [{ type: 'migrate', scope }] });
}

function tree(root) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['.git', '.vais'].includes(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push([path.relative(root, full), fs.readFileSync(full, 'utf8')]);
    }
  }
  walk(root);
  return files.sort((left, right) => left[0].localeCompare(right[0]));
}

describe('migrate-scopes REQ-005 two-step migration of a pre-4.3 project', () => {
  it('TC-005 propose lists moves, wraps, and counts; commit applies them; a second commit changes nothing', t => {
    const root = legacyRoot(t);
    // Before: the legacy documents are refused by the scoped stage check with the migration hint.
    const store = new WorkItemStore(root);
    const check = idChain.stageDocumentCheck(root, store.get('WI-2026-09-17-features'));
    assert.equal(check.verdict, 'fail');
    assert.match(check.findings[0], /\/vais 정리: 범위/);

    const proposal = execute(['migrate', 'propose', '--scope', 'member-management'], root);
    assert.equal(proposal.ok, true, JSON.stringify(proposal.blockers));
    assert.equal(proposal.unchanged, false);
    assert.equal(proposal._plans, undefined, 'the CLI strips the internal plan');
    assert.deepEqual(proposal.workItems.map(move => [move.id, move.from, move.to]), LEGACY.map(entry => [entry.id, `docs/work-items/${entry.feature}/${entry.id.replace(/^WI-/, '')}`, `docs/work-items/member-management/${entry.id.replace(/^WI-/, '')}`]));
    assert.deepEqual(proposal.documents.map(plan => [plan.file, plan.action]), [['docs/product/01-requirements.md', 'wrap'], ['docs/product/02-features.md', 'wrap'], ['docs/product/03-screens.md', 'wrap'], ['docs/product/04-wireframes.md', 'wrap']]);
    assert.deepEqual(proposal.state, { workItems: 4, chainItems: 8, ledgerEntries: 4 });
    assert.deepEqual(proposal.featureIndexesToRemove, ['docs/features/features', 'docs/features/login', 'docs/features/screens', 'docs/features/wireframes']);
    assert.ok(proposal.warnings.some(warning => /"## 목표" 절에 문장이 더 있어/.test(warning)), proposal.warnings.join('; '));
    assert.deepEqual(migrate.readProposal(root), { scope: 'member-management', proposedAt: proposal.proposedAt, state: proposal.state });
    assert.equal(execute(['migrate', 'propose', '--scope', 'Bad Name'], root).ok, false);

    // Commit needs the user's sentence in this session.
    assert.throws(() => execute(['migrate', 'commit', '--session', SESSION], root), /`\/vais 정리 확인` 를 직접 입력해야/);
    confirm(root, 'member-management');
    const result = execute(['migrate', 'commit', '--session', SESSION], root);
    assert.equal(result.ok, true);
    assert.equal(result.scope, 'member-management');
    assert.equal(result.movedWorkItems.length, 4);
    assert.equal(result.wrappedDocuments.length, 4);

    // Folders moved, ids kept, root frontmatter renamed, old Feature indexes gone, new one present.
    for (const entry of LEGACY) {
      const folder = entry.id.replace(/^WI-/, '');
      assert.ok(!fs.existsSync(path.join(root, 'docs', 'work-items', entry.feature, folder)));
      const moved = path.join(root, 'docs', 'work-items', 'member-management', folder);
      assert.ok(fs.existsSync(path.join(moved, '05-report', 'main.md')));
      assert.match(fs.readFileSync(path.join(moved, 'main.md'), 'utf8'), /primary_feature: member-management/);
      assert.ok(!fs.existsSync(path.join(root, 'docs', 'features', entry.feature)));
      assert.equal(store.get(entry.id).primaryFeature, 'member-management');
    }
    const featureIndex = fs.readFileSync(path.join(root, 'docs', 'features', 'member-management', 'main.md'), 'utf8');
    for (const entry of LEGACY) assert.ok(featureIndex.includes(entry.id), `${entry.id} in the scope index`);
    assert.match(fs.readFileSync(path.join(root, 'docs', 'README.md'), 'utf8'), /\| 범위 · Feature \|/);
    assert.match(fs.readFileSync(path.join(root, 'docs', 'product', 'README.md'), 'utf8'), /\| member-management \| 8 \| 0 \| 0 \|/);

    // Documents wrapped: one scope section each, 01 with its lead lines; item hashes unchanged.
    const requirements = fs.readFileSync(path.join(root, 'docs', 'product', '01-requirements.md'), 'utf8');
    assert.match(requirements, /## 대상 사용자\n책을 꾸준히 읽는 개인\.\n\n## 목표\n책을 등록하고 별점과 한 줄 감상을 남긴다\. 나중에는 통계도 본다\.\n\n## 제외\n소셜 공유, 추천 알고리즘\.\n\n## 범위: member-management\n문제: 읽은 책과 느낌을 남길 곳이 없다\.\n목표: 책을 등록하고 별점과 한 줄 감상을 남긴다\.\n\n### REQ-001/);
    assert.doesNotMatch(requirements, /## 문제/);
    assert.match(requirements, /status: approved/);
    const index = idChain.loadChainIndex(root);
    assert.deepEqual([...new Set(Object.values(index.items).map(item => item.scope))], ['member-management']);
    for (const stage of loadChainCatalog().stages.slice(0, 4)) {
      const document = idChain.readStageDocument(root, stage);
      assert.deepEqual(document.parsed.items.map(item => item.scope), document.parsed.items.map(() => 'member-management'));
      for (const item of document.parsed.items) assert.equal(index.items[item.id].hash, item.hash, `${item.id} hash unchanged`);
      assert.deepEqual(idChain.validateStageDocument(root, stage, document.parsed, index, { rawText: document.raw, scope: 'member-management' }), []);
    }
    const status = idChain.chainStatus(root);
    assert.deepEqual(status.stages.slice(0, 4).map(stage => stage.status), Array(4).fill('approved'));
    assert.deepEqual(status.stale, []);
    assert.equal(status.nextIds['stage-requirements'], 'REQ-003');
    // Ledger: the four Feature entries now name the scope, the scope-less note is untouched.
    const entries = ledger.read(root).entries;
    assert.deepEqual(entries.map(entry => entry.feature), ['member-management', 'member-management', 'member-management', 'member-management', null]);
    assert.ok(!fs.existsSync(migrate.proposalPath(root)));
    assert.ok(!fs.existsSync(path.join(root, '.vais', 'v2', 'migrate-trash')));
    // The next stage Work item for this scope passes the scoped check on the migrated file.
    store.create({ id: 'WI-2026-09-18-features-2', title: 'f', primaryFeature: 'member-management', affectedFeatures: [], scale: 'compact', kind: 'stage-features' });
    assert.equal(idChain.stageDocumentCheck(root, store.get('WI-2026-09-18-features-2')).verdict, 'pass');
    fs.rmSync(path.join(root, 'docs', 'work-items', 'member-management', '2026-09-18-features-2'), { recursive: true, force: true });
    const registryFile = path.join(root, '.vais', 'v2', 'work-items.json');
    const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
    delete registry.workItems['WI-2026-09-18-features-2'];
    registry.currentWorkItemId = null;
    fs.writeFileSync(registryFile, JSON.stringify(registry));

    // Second run: nothing to do.
    git(root, ['add', '-A']);
    git(root, ['commit', '-q', '-m', 'migrated']);
    const again = execute(['migrate', 'propose', '--scope', 'member-management'], root);
    assert.equal(again.unchanged, true);
    confirm(root, 'member-management');
    assert.equal(execute(['migrate', 'commit', '--session', SESSION, '--scope', 'member-management'], root).message, '변경 없음 — 이미 이 범위로 정리돼 있다');
    // A different scope name afterwards moves nothing: the Work items already belong to a known scope.
    assert.equal(execute(['migrate', 'propose', '--scope', 'other'], root).unchanged, true);
  });

  it('TC-005 mixed documents and headings between items are blockers, never silently rewritten', t => {
    const root = legacyRoot(t);
    const file = path.join(root, 'docs', 'product', '02-features.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('### F-002', '## 관리자 기능\n### F-002'));
    const blocked = migrate.proposeScopeMigration(root, 'member-management');
    assert.equal(blocked.ok, false);
    assert.match(blocked.reason, /항목 사이에 "## 관리자 기능" 제목이 있다/);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## 관리자 기능\n### F-002', '## 범위: member-management\n### F-002'));
    const mixed = migrate.proposeScopeMigration(root, 'member-management');
    assert.match(mixed.reason, /범위 절 안 항목과 밖 항목이 섞여 있다/);
  });
});

describe('migrate-scopes REQ-006 safety conditions and rollback', () => {
  it('TC-006 refuses with an active Work item, a foreign lease, a dirty tree, or a canonical/index mismatch', t => {
    const root = legacyRoot(t);
    const store = new WorkItemStore(root);
    const registryFile = path.join(root, '.vais', 'v2', 'work-items.json');
    const pristine = fs.readFileSync(registryFile, 'utf8');
    confirm(root, 'member-management');

    store.create({ id: 'WI-2026-09-18-requirements', title: 'r', primaryFeature: 'member-management', affectedFeatures: [], scale: 'compact', kind: 'stage-requirements' });
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management' }), /진행 중 작업이 있다: WI-2026-09-18-requirements \(plan\/active\)\. 그 작업을 Report 까지/);
    fs.rmSync(path.join(root, 'docs', 'work-items', 'member-management'), { recursive: true, force: true });
    fs.writeFileSync(registryFile, pristine);

    const withLease = JSON.parse(pristine);
    withLease.leases['WI-2026-09-17-login'] = { sessionId: 'other-session', acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString() };
    fs.writeFileSync(registryFile, JSON.stringify(withLease));
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management' }), /다른 세션이 작업을 잡고 있다: WI-2026-09-17-login \(other-session\)/);
    withLease.leases['WI-2026-09-17-login'].expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(registryFile, JSON.stringify(withLease));

    fs.writeFileSync(path.join(root, 'notes.txt'), 'dirty');
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management' }), /저장하지 않은 변경 1개가 있다 \(notes\.txt\)\. 먼저 `\/vais 저장`/);
    fs.rmSync(path.join(root, 'notes.txt'));

    const indexFile = idChain.indexPath(root);
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    delete index.stages['stage-wireframes'];
    fs.writeFileSync(indexFile, JSON.stringify(index));
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management' }), /04-wireframes\.md 의 승인 상태가 chain-index 와 다르다.*stage reindex/);
    idChain.reindex(root);
    // Without the token nothing runs even when every condition holds.
    new AuthorizationStore(root).revoke(SESSION);
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management' }), /정리 확인/);
    assert.deepEqual(tree(root), tree(root), 'sanity');
    assert.ok(fs.existsSync(path.join(root, 'docs', 'work-items', 'login')), 'nothing moved');
  });

  it('TC-006 a failure in the middle of the apply step rolls every change back', t => {
    const root = legacyRoot(t);
    const before = tree(root);
    const registryBefore = fs.readFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), 'utf8');
    const indexBefore = fs.readFileSync(idChain.indexPath(root), 'utf8');
    const ledgerBefore = fs.readFileSync(path.join(root, '.vais', 'v2', 'ledger.jsonl'), 'utf8');
    confirm(root, 'member-management');
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management', failAfter: move => move.id === 'WI-2026-09-17-features' }), /정리 중단: injected failure after WI-2026-09-17-features\. 되돌렸다 \(변경 0\)/);
    assert.deepEqual(tree(root), before);
    assert.equal(fs.readFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), 'utf8'), registryBefore);
    assert.equal(fs.readFileSync(idChain.indexPath(root), 'utf8'), indexBefore);
    assert.equal(fs.readFileSync(path.join(root, '.vais', 'v2', 'ledger.jsonl'), 'utf8'), ledgerBefore);
    assert.equal(git(root, ['status', '--porcelain']), '');
    // A failure after the records were rewritten is undone too.
    confirm(root, 'member-management');
    assert.throws(() => migrate.commitScopeMigration(root, { sessionId: SESSION, scope: 'member-management', beforeApply: () => { fs.chmodSync(path.join(root, 'docs', 'features'), 0o555); } }), /정리 중단/);
    fs.chmodSync(path.join(root, 'docs', 'features'), 0o755);
    assert.deepEqual(tree(root), before);
    assert.equal(fs.readFileSync(path.join(root, '.vais', 'v2', 'work-items.json'), 'utf8'), registryBefore);
    assert.equal(git(root, ['status', '--porcelain']), '');
  });
});
