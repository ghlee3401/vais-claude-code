'use strict';

// harness-scope-sections (4.3.0): canonical documents grouped by `## 범위:` sections, stage Work
// items named by scope, per-scope indexes and notes. Migration lives in v2-migrate-scopes.test.js.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const idChain = require('../lib/workflow/v2/id-chain');
const { getStage, getKind, loadChainCatalog } = require('../lib/workflow/v2/chain-registry');
const { routePrompt, routeCommand, scopeNameIn } = require('../lib/workflow/v2/router');
const { renderMaster } = require('../lib/workflow/v2/document-manager');
const { renderCurrent } = require('../lib/workflow/v2/product-note');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { isPublicRuntimeCommand, isUnauthenticatedRuntimeCommand, runtimeCommandTail } = require('../lib/workflow/v2/write-policy');
const { validateContract } = require('../lib/workflow/v2/contracts');
const cli = require('../scripts/vais-workflow-v2');
const prompt = require('../hooks/workflow-v2-prompt');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');
const HEAD = '---\nschema: vais-stage/v1\nstage: stage-features\n---\n';
const FIELDS = '| 항목 | 내용 |\n|---|---|\n| 동작 | a |\n| 입력 | b |\n| 출력 | c |\n| 오류 | d |\n| 규칙 | e |\n';

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-scope-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '4.3.0', workflowV2: { mode: 'enforce' } }));
  return root;
}

function installStage(root, order) {
  const stage = loadChainCatalog().stages.find(entry => entry.order === order);
  fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
  fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), path.join(root, stage.file));
  if (stage.artifactDir) {
    const source = path.join(FIXTURES, path.basename(stage.artifactDir));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(source)) fs.copyFileSync(path.join(source, name), path.join(root, stage.artifactDir, name));
    }
  }
  return stage;
}

function approveThrough(root, order, scope = null) {
  for (let index = 1; index <= order; index += 1) idChain.approveStage(root, installStage(root, index), { workItem: `WI-2026-09-18-s${index}`, scope });
}

describe('scope-sections REQ-002 canonical documents carry `## 범위:` sections', () => {
  it('TC-002 the parser tags items with the enclosing scope and collects lead lines', () => {
    const parsed = idChain.parseStageDocument(`${HEAD}## 대상 사용자\n개인\n\n## 범위: reading-log\n문제: 없다\n목표: 있다\n\n### F-001 ← REQ-001\n${FIELDS}\n## 범위: goal-tracking\n\n### F-002 ← REQ-002\n${FIELDS}\n## 부록\n### F-003 ← REQ-002\n${FIELDS}`, getStage('stage-features'));
    assert.deepEqual(parsed.items.map(item => [item.id, item.scope]), [['F-001', 'reading-log'], ['F-002', 'goal-tracking'], ['F-003', null]]);
    assert.deepEqual(parsed.scopes.map(scope => [scope.name, scope.leadLines]), [['reading-log', ['문제: 없다', '목표: 있다']], ['goal-tracking', []]]);
    assert.deepEqual(parsed.findings, []);
    const bad = idChain.parseStageDocument(`${HEAD}## 범위: Reading Log\n### F-001 ← REQ-001\n${FIELDS}## 범위: reading-log\n### F-002 ← REQ-001\n${FIELDS}## 범위: reading-log\n### F-003 ← REQ-001\n${FIELDS}`, getStage('stage-features'));
    assert.ok(bad.findings.some(finding => /범위 이름 형식 오류 "Reading Log"/.test(finding)), bad.findings.join('; '));
    assert.ok(bad.findings.some(finding => /범위 절 중복/.test(finding)));
  });

  it('TC-002 scoped stages reject items outside a section, missing 01 lead lines, and changes to other scopes', t => {
    const root = tempRoot(t);
    approveThrough(root, 2, 'reading-log');
    const stage = getStage('stage-features');
    const index = idChain.loadChainIndex(root);
    const check = (text, scope) => idChain.validateStageDocument(root, stage, idChain.parseStageDocument(text, stage), index, { rawText: text, scope });
    const flat = check(`${HEAD}### F-001 ← REQ-001\n${FIELDS}### F-002 ← REQ-002\n${FIELDS}`, 'reading-log');
    assert.ok(flat.some(finding => /범위 절 밖의 항목 2개 \(F-001, F-002\).*\/vais 정리: 범위/.test(finding)), flat.join('; '));
    const scoped = fs.readFileSync(path.join(root, stage.file), 'utf8');
    assert.deepEqual(check(scoped, 'reading-log'), []);
    // A goal-tracking Work item may append its own section but not touch reading-log's items.
    const appended = `${scoped}\n## 범위: goal-tracking\n\n### F-003 ← REQ-002\n${FIELDS}`;
    assert.deepEqual(check(appended, 'goal-tracking'), []);
    const tampered = appended.replace('| 동작 | 제목·저자를 입력하면 책이 목록에 추가된다 |', '| 동작 | 바뀜 |');
    assert.ok(check(tampered, 'goal-tracking').some(finding => /F-001: 현재 작업 범위\(goal-tracking\) 밖의 항목이 바뀌었다 \(범위 reading-log\)/.test(finding)));
    const foreignNew = `${scoped}\n## 범위: goal-tracking\n\n### F-003 ← REQ-002\n${FIELDS}## 범위: reading-log-2\n\n### F-004 ← REQ-002\n${FIELDS}`;
    assert.ok(check(foreignNew, 'goal-tracking').some(finding => /F-004: 현재 작업 범위\(goal-tracking\) 밖에 새 항목/.test(finding)));
    const dropped = appended.replace(/### F-002 ← REQ-002\n[\s\S]*?(?=\n## 범위: goal-tracking)/, '');
    assert.ok(check(dropped, 'goal-tracking').some(finding => /F-002: 현재 작업 범위\(goal-tracking\) 밖의 항목이 사라졌다/.test(finding)));
    // Stage 01: each scope section opens with 문제: and 목표:.
    const requirements = getStage('stage-requirements');
    const reqText = fs.readFileSync(path.join(root, requirements.file), 'utf8').replace('목표: 책을 등록하고 별점과 한 줄 감상을 남긴다.\n', '');
    const reqFindings = idChain.validateStageDocument(root, requirements, idChain.parseStageDocument(reqText, requirements), index, { rawText: reqText, scope: 'reading-log' });
    assert.deepEqual(reqFindings, ['범위 reading-log: 절 첫머리에 "목표: <한 줄>" 이 없다']);
    assert.deepEqual(requirements.documentSections, ['대상 사용자', '제외']);
    assert.deepEqual(requirements.scopeLines, ['문제', '목표']);
    assert.deepEqual(loadChainCatalog().stages.filter(entry => !entry.scoped).map(entry => entry.id), ['stage-design-system', 'stage-architecture']);
  });

  it('TC-002 coverage is judged per scope; approval and reindex record item.scope', t => {
    const root = tempRoot(t);
    approveThrough(root, 1, 'reading-log');
    const requirements = path.join(root, 'docs', 'product', '01-requirements.md');
    fs.writeFileSync(requirements, `${fs.readFileSync(requirements, 'utf8')}\n## 범위: goal-tracking\n문제: 목표가 없다\n목표: 목표를 세운다\n\n### REQ-003\n| 항목 | 내용 |\n|---|---|\n| 요구사항 | 목표를 만든다 |\n| 완료 조건 | 목표가 보인다 |\n`);
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-goal-1', scope: 'goal-tracking' });
    const index = idChain.loadChainIndex(root);
    assert.deepEqual(Object.values(index.items).map(item => [item.id, item.scope]), [['REQ-001', 'reading-log'], ['REQ-002', 'reading-log'], ['REQ-003', 'goal-tracking']]);
    const stage = getStage('stage-features');
    const goalOnly = `${HEAD}## 범위: goal-tracking\n### F-001 ← REQ-003\n${FIELDS}`;
    const findings = idChain.validateStageDocument(root, stage, idChain.parseStageDocument(goalOnly, stage), index, { rawText: goalOnly, scope: 'goal-tracking' });
    assert.deepEqual(findings, [], findings.join('; '));
    const noScope = idChain.validateStageDocument(root, stage, idChain.parseStageDocument(goalOnly, stage), index, { rawText: goalOnly });
    assert.deepEqual(noScope.filter(finding => /미커버/.test(finding)), ['미커버: REQ-001 를 부모로 둔 항목이 없다', '미커버: REQ-002 를 부모로 둔 항목이 없다']);
    const rebuilt = idChain.reindex(root);
    assert.equal(rebuilt.items['REQ-003'].scope, 'goal-tracking');
    const status = idChain.chainStatus(root);
    assert.equal(status.nextIds['stage-requirements'], 'REQ-004');
    assert.equal(status.nextIds['stage-features'], 'F-001');
    assert.deepEqual(status.stages[0].scopes, [{ name: 'reading-log', items: 2 }, { name: 'goal-tracking', items: 1 }]);
    const catalog = JSON.parse(fs.readFileSync(path.join(REPO, 'contracts', 'chain-stages.json'), 'utf8'));
    assert.equal(validateContract('chainStages', catalog).valid, true, 'scoped · scopeLines are allowed by the schema');
  });
});

describe('scope-sections REQ-001 scope naming', () => {
  it('TC-001 the router takes `범위:` at the start or inside the sentence and routes the migration commands', () => {
    assert.equal(routePrompt('/vais 범위: goal-tracking 요구사항 정의서', null).action, 'name-feature');
    assert.equal(routePrompt('/vais 범위: goal-tracking 요구사항 정의서', null).slug, 'goal-tracking');
    assert.equal(routePrompt('/vais 새 제품: po-report 범위: member-management', null).slug, 'member-management');
    assert.equal(scopeNameIn('새 제품 만들자'), null);
    assert.equal(routePrompt('/vais 이름: login 기능', null).slug, 'login');
    assert.deepEqual(routeCommand('정리: 범위 member-management'), { managed: true, action: 'migrate', mutationAllowed: false, text: '정리: 범위 member-management', scope: 'member-management' });
    assert.equal(routeCommand('정리 확인').action, 'migrate-confirm');
    assert.equal(routeCommand('정리 확인').scope, null);
    assert.equal(routeCommand('정리 확인: 범위 Member-Management').scope, 'member-management');
    assert.equal(routeCommand('정리: 범위 Bad Name'), null);
    const auth = { allowedCommands: [cli.INTERNAL_COMMAND] };
    assert.equal(isUnauthenticatedRuntimeCommand(runtimeCommandTail(`${cli.INTERNAL_COMMAND} migrate propose --scope x`, auth)), true);
    assert.equal(isUnauthenticatedRuntimeCommand(runtimeCommandTail(`${cli.INTERNAL_COMMAND} migrate commit --session s`, auth)), false);
    assert.equal(isPublicRuntimeCommand(`${cli.INTERNAL_COMMAND} migrate commit --session s`, auth), true);
  });

  it('TC-001 the CLI names stage Work items by stage and scope, never from the request text', t => {
    const root = tempRoot(t);
    const store = new WorkItemStore(root);
    const naming = (options, authorization) => cli.assertStageWorkItemNaming(options, authorization);
    assert.equal(naming({ kind: 'feature', slug: 'login', feature: 'login' }, null), false);
    assert.throws(() => naming({ kind: 'stage-requirements', slug: 'login', feature: 'member-management' }, { action: 'start-request', requestSlug: 'member-management' }), /--slug 는 단계 이름 `requirements`/);
    assert.throws(() => naming({ kind: 'stage-requirements', slug: 'requirements', feature: 'Member Management' }, { action: 'start-request', requestSlug: 'member-management' }), /범위 이름\(kebab-case/);
    assert.throws(() => naming({ kind: 'stage-requirements', slug: 'requirements', feature: 'member-management' }, { action: 'start-request', requestSlug: null }), /범위 이름이 확정되지 않았다/);
    assert.throws(() => naming({ kind: 'stage-features', slug: 'features', feature: 'other' }, { action: 'start-request', requestSlug: 'member-management' }), /runtime 이 등록한 `member-management`/);
    assert.equal(naming({ kind: 'stage-features', slug: 'features', feature: 'member-management' }, { action: 'start-request', requestSlug: 'member-management' }), true);
    // Same day, same stage: ids take a suffix past a finished item, and folders follow.
    store.create({ id: 'WI-2026-09-18-requirements', title: 'r', primaryFeature: 'member-management', affectedFeatures: [], scale: 'compact', kind: 'stage-requirements' });
    const registryFile = path.join(root, '.vais', 'v2', 'work-items.json');
    const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
    registry.workItems['WI-2026-09-18-requirements'].status = 'completed';
    registry.workItems['WI-2026-09-18-requirements'].phase = 'report';
    registry.currentWorkItemId = null;
    fs.writeFileSync(registryFile, JSON.stringify(registry));
    const clock = new Date('2026-09-18T10:00:00Z');
    assert.equal(cli.generatedWorkItemId({ slug: 'requirements', kind: 'stage-requirements' }, clock, store), 'WI-2026-09-18-requirements-2');
    assert.equal(cli.generatedWorkItemId({ slug: 'requirements', kind: 'feature' }, clock, store), 'WI-2026-09-18-requirements');
    assert.equal(cli.generatedWorkItemId({ slug: 'features', kind: 'stage-features' }, clock, store), 'WI-2026-09-18-features');
  });

  it('TC-001 the prompt hook asks for a scope, inherits the latest one, and tells Do to write inside its section', t => {
    const root = tempRoot(t);
    const stageRoute = routePrompt('/vais 새 제품: 독서 기록 앱', null);
    assert.equal(prompt.requestSlugFor(stageRoute, root), null, 'no stage Work item yet: nothing to inherit');
    assert.equal(prompt.requestSlugFor(routePrompt('/vais 로그인 기능 추가', null), root), 'login', 'non-stage kinds keep the request-derived slug');
    const asking = prompt.phaseGuidance(null, 's', null, { kindSuggestion: { kind: 'stage-requirements', trigger: '새 제품' } }).join('\n');
    assert.match(asking, /범위.*이름이 필요한데/);
    assert.match(asking, /\/vais 범위: <name>/);
    assert.doesNotMatch(asking, /plan present --slug/);
    const store = new WorkItemStore(root);
    store.create({ id: 'WI-2026-09-18-requirements', title: 'r', primaryFeature: 'member-management', affectedFeatures: [], scale: 'compact', kind: 'stage-requirements' });
    assert.equal(prompt.inheritedScope(root), 'member-management');
    assert.equal(prompt.requestSlugFor(routePrompt('/vais 기능 정의서', null), root), 'member-management');
    const inherited = prompt.phaseGuidance(null, 's', 'member-management', { kindSuggestion: { kind: 'stage-features', trigger: '기능 정의서' }, scopeInherited: true }).join('\n');
    assert.match(inherited, /물려받았다/);
    assert.match(inherited, /--slug features --title "<title>" --feature member-management --relation existing/);
    assert.match(inherited, /docs\/work-items\/member-management\/<날짜>-features\//);
    const named = prompt.phaseGuidance(null, 's', 'goal-tracking', { kindSuggestion: { kind: 'stage-requirements', trigger: '요구사항 정의서' } }).join('\n');
    assert.match(named, /--slug requirements --title "<title>" --feature goal-tracking --relation <new\|existing>/);
    const item = store.get('WI-2026-09-18-requirements');
    const doLines = prompt.stagePhaseLines(item, getKind('stage-requirements'), getStage('stage-requirements'), 's').do.join('\n');
    assert.match(doLines, /`## 범위: member-management` 절 아래에만/);
    assert.match(doLines, /"문제: <한 줄>" · "목표: <한 줄>"/);
    assert.match(doLines, /nextIds/);
    assert.match(doLines, /한 글자도 바꾸지 않는다/);
    const dsLines = prompt.stagePhaseLines({ ...item, kind: 'stage-design-system' }, getKind('stage-design-system'), getStage('stage-design-system'), 's').do.join('\n');
    assert.doesNotMatch(dsLines, /범위:/);
    assert.ok(prompt.HELP_LINES.some(line => /\/vais 범위: <kebab-case>/.test(line)));
    assert.ok(prompt.HELP_LINES.some(line => /\/vais 정리: 범위 <이름>/.test(line)));
    // The migration token comes from the user's sentence plus the stored proposal.
    assert.deepEqual(prompt.confirmationsFor(routeCommand('정리 확인'), root), []);
    fs.writeFileSync(path.join(root, '.vais', 'v2', 'scope-migration.json'), JSON.stringify({ scope: 'member-management' }));
    assert.deepEqual(prompt.confirmationsFor(routeCommand('정리 확인'), root), [{ type: 'migrate', scope: 'member-management' }]);
    assert.deepEqual(prompt.confirmationsFor(routeCommand('정리 확인: 범위 other'), root), [{ type: 'migrate', scope: 'other' }]);
    const guidance = prompt.commandGuidance(routeCommand('정리 확인'), 'sess', { migrationScope: 'member-management' }).join('\n');
    assert.match(guidance, /migrate commit --session sess --scope member-management/);
    assert.match(prompt.commandGuidance(routeCommand('정리: 범위 member-management'), 'sess').join('\n'), /migrate propose --scope member-management/);
  });
});

describe('scope-sections REQ-004 indexes and notes', () => {
  it('TC-004 the master index names the scope column and the product note rolls items up per scope', t => {
    const root = tempRoot(t);
    const store = new WorkItemStore(root);
    store.create({ id: 'WI-2026-09-18-requirements', title: 'r', primaryFeature: 'member-management', affectedFeatures: [], scale: 'compact', kind: 'stage-requirements' });
    assert.match(renderMaster(root), /\| Work item \| 범위 · Feature \| Phase \| Status \| Updated \|/);
    assert.match(renderMaster(root), /work-items\/member-management\/2026-09-18-requirements\/main\.md\) \| member-management \|/);
    const index = { schemaVersion: '1.0', stages: {}, items: {
      'REQ-001': { id: 'REQ-001', stage: 'stage-requirements', prefix: 'REQ', hash: 'a', parents: [], parentHashes: {}, scope: 'member-management', implemented: { workItem: 'x', at: 't' } },
      'REQ-002': { id: 'REQ-002', stage: 'stage-requirements', prefix: 'REQ', hash: 'b', parents: [], parentHashes: {}, scope: 'goal-tracking' },
      'F-001': { id: 'F-001', stage: 'stage-features', prefix: 'F', hash: 'c', parents: ['REQ-001'], parentHashes: { 'REQ-001': 'old' } },
      'DS-001': { id: 'DS-001', stage: 'stage-design-system', prefix: 'DS', hash: 'd', parents: [], parentHashes: {} },
    } };
    const note = renderCurrent(root, { index });
    assert.match(note, /## 범위별/);
    assert.match(note, /\| 범위 \| 항목 \| 구현됨 \| stale \|/);
    assert.match(note, /\| \(범위 없음\) \| 1 \| 0 \| 1 \|/, 'a scoped-stage item without a scope (pre-4.3 document)');
    assert.match(note, /\| \(제품 전체\) \| 1 \| 0 \| 0 \|/, 'design system and architecture items are product-wide');
    assert.match(note, /\| goal-tracking \| 1 \| 0 \| 0 \|/);
    assert.match(note, /\| member-management \| 1 \| 1 \| 0 \|/);
  });
});

describe('scope-sections REQ-007 documents and version', () => {
  it('TC-007 version 4.3.0 everywhere, TTL raised for this repository, docs mention scopes', () => {
    const read = file => fs.readFileSync(path.join(REPO, file), 'utf8');
    const config = JSON.parse(read('vais.config.json'));
    assert.equal(config.version, '4.3.0');
    assert.equal(config.workflowV2.authorizationTtlMs, 7200000);
    assert.equal(JSON.parse(read('package.json')).version, '4.3.0');
    assert.equal(JSON.parse(read('package-lock.json')).version, '4.3.0');
    assert.match(read('CHANGELOG.md'), /## \[4\.3\.0\]/);
    assert.match(read('README.md'), /## 범위: <이름>/);
    assert.match(read('README.md'), /\/vais 정리: 범위 <이름>/);
    assert.match(read('CLAUDE.md'), /범위:/);
    assert.match(read('CLAUDE.md'), /정리 확인/);
    assert.match(read('ONBOARDING.md'), /4\.3\.0/);
    assert.match(read(path.join('docs', 'harness', 'design.md')), /harness-scope-sections/);
  });
});
