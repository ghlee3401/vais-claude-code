'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { loadChainCatalog, getStage, getKind, kindOf, isStageKind, suggestKind, repairLimitOf } = require('../lib/workflow/v2/chain-registry');
const idChain = require('../lib/workflow/v2/id-chain');
const { validateContract } = require('../lib/workflow/v2/contracts');
const { createInitialWorkItem, transition, EVENTS } = require('../lib/workflow/v2/state-machine');
const { requiredSectionsFor, optionCountFindings, inspectPhaseDocument } = require('../lib/workflow/v2/phase-check');
const { evaluateDocumentBudget, STAGE_PHASE_BUDGETS } = require('../lib/workflow/v2/document-quality');
const { assertHandoffFiles } = require('../lib/workflow/v2/automatic-handoff');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { stageConfirm } = require('../scripts/vais-workflow-v2');
const { runPhaseTransaction } = require('../lib/workflow/v2/phase-transaction');
const prompt = require('../hooks/workflow-v2-prompt');
const { versionFiles } = require('../lib/workflow/v2/doctor');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-chain-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.2.0', workflowV2: { mode: 'enforce' } }));
  return root;
}

function installStageFixture(root, order) {
  const stage = loadChainCatalog().stages.find(entry => entry.order === order);
  const source = path.join(FIXTURES, path.basename(stage.file));
  const target = path.join(root, stage.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  if (stage.artifactDir) {
    const artifactSource = path.join(FIXTURES, path.basename(stage.artifactDir));
    if (fs.existsSync(artifactSource)) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(artifactSource)) fs.copyFileSync(path.join(artifactSource, name), path.join(root, stage.artifactDir, name));
    }
  }
  return stage;
}

function approveThrough(root, order) {
  let result = null;
  for (let index = 1; index <= order; index += 1) {
    const stage = installStageFixture(root, index);
    result = idChain.approveStage(root, stage, { workItem: `WI-2026-09-16-stage-${index}` });
  }
  return result;
}

describe('chain-stages REQ-001/002 catalogs are data validated by schema', () => {
  it('TC-001 loads ten ordered stages with the documented parent table', () => {
    const catalog = loadChainCatalog();
    assert.equal(catalog.stages.length, 10);
    assert.deepEqual(catalog.stages.map(stage => stage.idPrefix), ['REQ', 'F', 'S', 'W', 'DS', 'V', 'D', 'API', 'T', 'TC']);
    assert.deepEqual(getStage('stage-mockups').parents, { required: true, allowed: ['W', 'DS'], requireEach: ['W', 'DS'] });
    assert.equal(getStage('stage-test-plan').coverage, 'F');
    const broken = JSON.parse(fs.readFileSync(path.join(REPO, 'contracts', 'chain-stages.json'), 'utf8'));
    delete broken.stages[0].requiredFields;
    assert.equal(validateContract('chainStages', broken).valid, false);
  });

  it('TC-002 loads fourteen kinds and rejects unknown ones', () => {
    const catalog = loadChainCatalog();
    assert.equal(catalog.kinds.length, 14);
    assert.equal(getKind('stage-features').entryRequires, 'stage-requirements');
    assert.equal(getKind('ui').repairLimit, 5);
    assert.equal(getKind('nope'), null);
    assert.throws(() => createInitialWorkItem({ id: 'WI-2026-09-16-x', title: 'x', primaryFeature: 'x', scale: 'compact', kind: 'nope' }), /Unknown work kind/);
  });
});

describe('chain-stages REQ-003 Work item kind', () => {
  it('TC-003 kind is stored, legacy items read as harness, and the hook suggests a kind', t => {
    const item = createInitialWorkItem({ id: 'WI-2026-09-16-x', title: 'x', primaryFeature: 'x', scale: 'compact', kind: 'stage-requirements' });
    assert.equal(item.kind, 'stage-requirements');
    assert.equal(validateContract('workItem', item).valid, true);
    assert.equal(kindOf({ id: 'legacy' }).id, 'harness');
    assert.equal(suggestKind('/vais 새 제품: 독서 기록 앱').kind, 'stage-requirements');
    assert.equal(suggestKind('/vais 기능 정의서 만들자').kind, 'stage-features');
    assert.equal(suggestKind('/vais add booking cancel').kind, 'feature');
    const root = tempRoot(t);
    const locked = prompt.kindSuggestionFor(root, { action: 'start-request', text: '/vais 기능 정의서 만들자' });
    assert.match(locked.locked, /1단계 요구사항 정의서/);
    assert.equal(prompt.kindSuggestionFor(root, { action: 'start-request', text: '/vais 새 제품' }).locked, null);
    assert.match(prompt.phaseGuidance(null, 's', 'reading-log', { kindSuggestion: locked }).join('\n'), /시작할 수 없다/);
  });
});

describe('chain-stages REQ-004 entry lock', () => {
  it('TC-004 stage 2 cannot start before stage 1 is approved', t => {
    const root = tempRoot(t);
    assert.throws(() => idChain.assertStageEntry(root, getKind('stage-features')), /1단계 요구사항 정의서\(docs\/product\/01-requirements\.md\)가 먼저/);
    assert.doesNotThrow(() => idChain.assertStageEntry(root, getKind('stage-requirements')));
    approveThrough(root, 1);
    assert.doesNotThrow(() => idChain.assertStageEntry(root, getKind('stage-features')));
    assert.throws(() => idChain.assertStageEntry(root, getKind('stage-screens')), /2단계 기능 정의서/);
  });
});

describe('chain-stages REQ-005/006 stage document parsing and parent rules', () => {
  it('TC-005 parses the ten fixture documents and flags malformed headings', () => {
    for (const stage of loadChainCatalog().stages) {
      const parsed = idChain.parseStageDocument(fs.readFileSync(path.join(FIXTURES, path.basename(stage.file)), 'utf8'), stage);
      assert.deepEqual(parsed.findings, [], `${stage.id}: ${parsed.findings.join('; ')}`);
      assert.ok(parsed.items.length >= 1);
      assert.ok(parsed.items.every(item => item.prefix === stage.idPrefix && /^[0-9a-f]{64}$/.test(item.hash)));
    }
    const bad = idChain.parseStageDocument('---\nschema: vais-stage/v1\nstage: stage-features\n---\n### F-01\n| 항목 | 내용 |\n|---|---|\n| 동작 | x |\n### F-002 ← REQ-1\n', getStage('stage-features'));
    assert.ok(bad.findings.some(finding => /제목 형식 오류/.test(finding)));
    assert.ok(bad.findings.some(finding => /부모 ID 형식 오류/.test(finding)));
  });

  it('TC-006 rejects missing, disallowed, and unknown parents with candidates', t => {
    const root = tempRoot(t);
    approveThrough(root, 1);
    const stage = getStage('stage-features');
    const index = idChain.loadChainIndex(root);
    const check = text => idChain.validateStageDocument(root, stage, idChain.parseStageDocument(text, stage), index, { rawText: text });
    const head = '---\nschema: vais-stage/v1\nstage: stage-features\n---\n';
    const fields = '| 항목 | 내용 |\n|---|---|\n| 동작 | a |\n| 입력 | b |\n| 출력 | c |\n| 오류 | d |\n| 규칙 | e |\n';
    assert.ok(check(`${head}### F-001\n${fields}`).some(finding => /부모 ID 가 필요/.test(finding)));
    assert.ok(check(`${head}### F-001 ← S-001\n${fields}`).some(finding => /허용되지 않는 부모 S-001/.test(finding)));
    const unknown = check(`${head}### F-001 ← REQ-009\n${fields}`);
    assert.ok(unknown.some(finding => /승인된 부모가 없다 REQ-009 \(후보: REQ-00[12]/.test(finding)), unknown.join('; '));
    assert.ok(check(`${head}### F-001 ← REQ-001\n${fields}`).some(finding => /미커버: REQ-002/.test(finding)));
    assert.deepEqual(check(`${head}### F-001 ← REQ-001\n${fields}### F-002 ← REQ-002\n${fields}`), []);
  });
});

describe('chain-stages REQ-007 stale propagation', () => {
  it('TC-007 a changed parent marks children stale; re-approval or user confirmation clears it', t => {
    const root = tempRoot(t);
    approveThrough(root, 2);
    assert.deepEqual(idChain.computeStale(idChain.loadChainIndex(root)), []);
    const file = path.join(root, 'docs', 'product', '01-requirements.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('책을 제목·저자로 등록한다', '책을 제목·저자·출판사로 등록한다'));
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-2026-09-16-re' });
    const stale = idChain.computeStale(idChain.loadChainIndex(root));
    assert.deepEqual(stale.map(entry => `${entry.id}←${entry.parent}`), ['F-001←REQ-001']);
    assert.throws(() => idChain.assertStageEntry(root, getKind('stage-screens')), /stale/);
    idChain.confirmUnchanged(root, 'F-001', 'REQ-001');
    assert.deepEqual(idChain.computeStale(idChain.loadChainIndex(root)), []);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('출판사로', '출판사·연도로'));
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-2026-09-16-re2' });
    assert.equal(idChain.computeStale(idChain.loadChainIndex(root)).length, 1);
    idChain.approveStage(root, getStage('stage-features'), { workItem: 'WI-2026-09-16-re3' });
    assert.deepEqual(idChain.computeStale(idChain.loadChainIndex(root)), []);
  });

  it('TC-007 the CLI confirm command needs the user-declared pair in the session authorization', t => {
    const root = tempRoot(t);
    approveThrough(root, 2);
    const auth = new AuthorizationStore(root);
    auth.grant({ sessionId: 's1', workItemId: null, phase: 'plan', action: 'continue-work', allowedPaths: [], allowedCommands: [] });
    assert.throws(() => stageConfirm(root, { session: 's1', item: 'F-001', parent: 'REQ-001' }), /변경 없음 확인/);
    auth.grant({ sessionId: 's1', workItemId: null, phase: 'plan', action: 'stage-confirm-unchanged', stageConfirmations: [{ item: 'F-001', parent: 'REQ-001' }], allowedPaths: [], allowedCommands: [] });
    assert.equal(stageConfirm(root, { session: 's1', item: 'f-001', parent: 'req-001' }).id, 'F-001');
  });
});

describe('chain-stages REQ-008/011 stage document check, approval, artifacts', () => {
  it('TC-008 approval writes frontmatter and index; a failing document is not approved', t => {
    const root = tempRoot(t);
    const stage = installStageFixture(root, 1);
    const item = createInitialWorkItem({ id: 'WI-2026-09-16-r', title: 'r', primaryFeature: 'r', scale: 'compact', kind: 'stage-requirements' });
    assert.equal(idChain.stageDocumentCheck(root, item).verdict, 'pass');
    const result = idChain.approveStage(root, stage, { workItem: item.id });
    assert.deepEqual(result.items, ['REQ-001', 'REQ-002']);
    const written = fs.readFileSync(path.join(root, stage.file), 'utf8');
    assert.match(written, /status: approved/);
    assert.match(written, /work_item: WI-2026-09-16-r/);
    assert.equal(idChain.loadChainIndex(root).stages['stage-requirements'].status, 'approved');
    const featuresItem = createInitialWorkItem({ id: 'WI-2026-09-16-f', title: 'f', primaryFeature: 'f', scale: 'compact', kind: 'stage-features' });
    assert.match(idChain.stageDocumentCheck(root, featuresItem).findings[0], /정본 파일이 없다/);
    fs.mkdirSync(path.join(root, 'docs', 'product'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'product', '02-features.md'), '---\nschema: vais-stage/v1\nstage: stage-features\n---\n### F-001 ← REQ-009\n| 항목 | 내용 |\n|---|---|\n| 동작 | a |\n');
    assert.throws(() => idChain.approveStage(root, getStage('stage-features'), { workItem: 'x' }), /cannot be approved/);
    assert.equal(idChain.loadChainIndex(root).stages['stage-features'], undefined);
  });

  it('TC-008 stage kind write scopes must stay under docs/product', t => {
    // The full transaction path (authorization + real Work item) is covered in
    // tests/v2-product-note.test.js TC-010; here the unauthenticated call must still fail closed.
    const root = tempRoot(t);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: 'WI-2026-09-16-none', sessionId: 's', revision: 1,
      writeScopes: ['src/**'], readinessChecks: ['stage-document'], reviewChecks: ['stage-document'],
    }), /authorization|Work item/);
  });

  it('TC-011 artifact fields must point at existing files under the artifact directory', t => {
    const root = tempRoot(t);
    approveThrough(root, 3);
    const stage = getStage('stage-wireframes');
    const index = idChain.loadChainIndex(root);
    const text = fs.readFileSync(path.join(FIXTURES, '04-wireframes.md'), 'utf8');
    const parsed = idChain.parseStageDocument(text, stage);
    const missing = idChain.validateStageDocument(root, stage, parsed, index, { rawText: text });
    assert.ok(missing.some(finding => /산출물 파일이 없다 "파일" = W-001\.html/.test(finding)), missing.join('; '));
    installStageFixture(root, 4);
    assert.deepEqual(idChain.validateStageDocument(root, stage, parsed, index, { rawText: text }), []);
  });
});

describe('chain-stages REQ-009 kind templates and budgets', () => {
  it('TC-009 stage kinds use one-line Plan and options Design with scale-capped options', () => {
    const stageItem = { id: 'WI-2026-09-16-s', primaryFeature: 's', scale: 'compact', kind: 'stage-features', phase: 'design' };
    assert.deepEqual(requiredSectionsFor(stageItem, 'plan').map(([name]) => name), ['request-confirm', 'kind', 'stage']);
    assert.deepEqual(requiredSectionsFor(stageItem, 'design').map(([name]) => name), ['options', 'write-scope', 'readiness-review', 'rollback']);
    assert.deepEqual(requiredSectionsFor({ kind: 'harness' }, 'plan').map(([name]) => name), ['problem', 'goal', 'scope', 'requirements', 'user-flow', 'edge-cases', 'completion', 'impact']);
    assert.deepEqual(optionCountFindings(stageItem, 'design', '## 안 1\n## 안 2\n'), ['Design options: compact 규모는 안 1개까지다 (현재 2)']);
    assert.deepEqual(optionCountFindings(stageItem, 'design', '## 안 1\n'), []);
    assert.equal(evaluateDocumentBudget({ scale: 'extended', kind: 'stage-features', phase: 'plan', markdown: 'x'.repeat(STAGE_PHASE_BUDGETS.plan + 1) }).verdict, 'fail');
    assert.equal(evaluateDocumentBudget({ scale: 'extended', kind: 'harness', phase: 'plan', markdown: 'x'.repeat(STAGE_PHASE_BUDGETS.plan + 1) }).verdict, 'pass');
    assert.equal(repairLimitOf({ kind: 'ui' }), 5);
    assert.equal(repairLimitOf({}), 3);
  });

  it('TC-009 a stage Plan document passes without REQ identifiers', t => {
    const root = tempRoot(t);
    const item = createInitialWorkItem({ id: 'WI-2026-09-16-p', title: 'p', primaryFeature: 'p', scale: 'compact', kind: 'stage-requirements' });
    const result = inspectPhaseDocument(root, item, 'plan', {
      path: path.join(root, 'plan.md'),
      document: { data: { schema: 'vais-phase/v1', work_item: item.id, phase: 'plan', revision: 1 }, content: '요청 확인: 독서 기록 앱의 요구사항 정의서를 만든다.\nkind: stage-requirements\n단계: 1 요구사항 정의서' },
      markdown: 'short',
    });
    assert.deepEqual(result.findings, []);
  });
});

describe('chain-stages REQ-010 specialist files in handoffs', () => {
  it('TC-010 files inside the write scope are accepted; outside or read-only are rejected', t => {
    const root = tempRoot(t);
    const writable = { codeWrite: true, writeScope: ['docs/product/03-screens.md', 'docs/product/flows/**'] };
    assert.doesNotThrow(() => assertHandoffFiles(root, writable, { files: ['docs/product/03-screens.md', 'docs/product/flows/S-001.mmd'] }));
    assert.throws(() => assertHandoffFiles(root, writable, { files: ['src/app.js'] }), /outside the assignment write scope/);
    assert.throws(() => assertHandoffFiles(root, { codeWrite: false, writeScope: [] }, { files: ['docs/product/03-screens.md'] }), /Read-only assignment/);
    assert.equal(validateContract('specialistHandoff', {
      schema: 'specialist-handoff/v1', status: 'completed', judgment: 'ok', decisions: [], behavior: { inputs: [], outputs: [], errors: [] },
      evidence: [], affectedRequirements: [], risks: [], unverified: [], recommendedChecks: [], files: ['docs/product/03-screens.md'],
    }).valid, true);
  });
});

describe('chain-stages REQ-013 documents and versions', () => {
  it('TC-013 the version is synchronized at 3.2.0 or later and the roadmap marks H1 done', () => {
    const versions = versionFiles(REPO);
    const distinct = [...new Set(Object.values(versions))];
    assert.equal(distinct.length, 1, JSON.stringify(versions));
    const [major, minor] = distinct[0].split('.').map(Number);
    assert.ok(major > 3 || (major === 3 && minor >= 2), distinct[0]);
    const roadmap = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'roadmap.md'), 'utf8');
    assert.match(roadmap, /\| H1 \| 완료 \|/);
    assert.match(roadmap, /\| H2 \| (진행 중|완료) \|/);
    const design = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'design.md'), 'utf8');
    assert.match(design, /`contracts\/chain-stages\.json` \| 완료 \(H2\)/);
    assert.match(fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8'), /## \[3\.2\.0\]/);
    assert.equal(isStageKind('stage-api'), true);
    assert.equal(transition(createInitialWorkItem({ id: 'WI-2026-09-16-t', title: 't', primaryFeature: 't', scale: 'compact', kind: 'ui' }), EVENTS.PLAN_PRESENTED, {
      gateResult: { gate: 'plan', verdict: 'PASS', requiredChecks: ['plan-document'], passed: ['plan-document'], failed: [], blocked: [], missing: [] },
    }).status, 'waiting-user');
  });
});
