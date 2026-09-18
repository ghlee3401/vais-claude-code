'use strict';

// commands (roadmap H5) REQ-001~009, REQ-011. The end-to-end command table lives in
// tests/regression/commands.test.js (REQ-010).

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { statusSummary, buildBriefing } = require('../lib/workflow/v2/briefing');
const { explain, loadGlossary } = require('../lib/workflow/v2/explain');
const vcs = require('../lib/workflow/v2/vcs');
const ledger = require('../lib/workflow/v2/ledger');
const { propose } = require('../lib/workflow/v2/proposal');
const { routePrompt } = require('../lib/workflow/v2/router');
const { authorizeCommand } = require('../lib/workflow/v2/write-policy');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { createInitialWorkItem, transition, EVENTS } = require('../lib/workflow/v2/state-machine');
const { suggestKind } = require('../lib/workflow/v2/chain-registry');
const { reportBody, REPORT_OUTCOME_LIMIT } = require('../lib/workflow/v2/phase-transaction');
const { runDoctor, versionFiles, REQUIRED_HOOK_EVENTS } = require('../lib/workflow/v2/doctor');
const { writePhaseDocument } = require('../lib/workflow/v2/document-manager');
const idChain = require('../lib/workflow/v2/id-chain');
const { loadChainCatalog } = require('../lib/workflow/v2/chain-registry');
const { execute, ledgerAdd } = require('../scripts/vais-workflow-v2');
const prompt = require('../hooks/workflow-v2-prompt');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');
const VERSION = '3.5.0';

function tempRoot(t, version = VERSION) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-cmd-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeVersions(root, version);
  return root;
}

// The six version surfaces `/vais 저장` checks: five manifests plus the README badge and CHANGELOG head.
function writeVersions(root, version, overrides = {}) {
  const value = file => overrides[file] || version;
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: value('vais.config.json'), workflowV2: { mode: 'enforce' } }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: value('package.json') }));
  fs.mkdirSync(path.join(root, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: value('plugin.json') }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ metadata: { version: value('marketplace.json') }, plugins: [{ version: value('marketplace.json') }] }));
  fs.writeFileSync(path.join(root, 'README.md'), `<img src="https://img.shields.io/badge/version-${value('README.md')}-blue">\n`);
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), `# Changelog\n\n## [${value('CHANGELOG.md')}] - 2026-09-16\n`);
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_AUTHOR_NAME: 'vais', GIT_AUTHOR_EMAIL: 'vais@example.com', GIT_COMMITTER_NAME: 'vais', GIT_COMMITTER_EMAIL: 'vais@example.com' } }).trim();
}

function gitRoot(t) {
  const root = tempRoot(t);
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'init']);
  return root;
}

function grantConfirmation(root, session, confirmation) {
  new AuthorizationStore(root).grant({ sessionId: session, workItemId: null, phase: 'plan', allowedPaths: [], allowedCommands: [], confirmations: [confirmation] });
}

function installStage(root, order) {
  const stage = loadChainCatalog().stages.find(entry => entry.order === order);
  fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
  fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), path.join(root, stage.file));
  idChain.approveStage(root, stage, { workItem: `WI-2026-09-16-s${order}` });
  return stage;
}

function gate(name, verdict, checks = ['test']) {
  return { gateResult: { gate: name, verdict, requiredChecks: checks, passed: ['PASS', 'READY'].includes(verdict) ? checks : [], failed: [], blocked: [], missing: [], evaluatedAt: '2026-09-16T00:00:00.000Z' } };
}

describe('commands REQ-001 status in plain language', () => {
  it('TC-001 the summary reads the same facts as the briefing, with and without an active item', t => {
    const root = tempRoot(t);
    assert.match(statusSummary(root), /^아직 시작한 작업이 없습니다\. 열린 결정 0개, 부채 0건, stale 항목 0개\. 다음으로 할 만한 일: ① 1단계 요구사항 정의서 작성/);
    const store = new WorkItemStore(root);
    const item = store.create({ id: 'WI-2026-09-16-s', title: '상태 테스트', primaryFeature: 'status', affectedFeatures: [], scale: 'compact', kind: 'harness' });
    writePhaseDocument(root, item, 'plan', '# Plan', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    const summary = statusSummary(root);
    assert.match(summary, /지금 작업은 "상태 테스트"\(WI-2026-09-16-s, plan 단계\)이고 사용자 결정을 기다리는 중\(plan Gate\)입니다\./);
    assert.match(summary, /마지막 사건은 Plan 제시/);
    assert.match(summary, /① plan 결정: \/vais plan 승인/);
    assert.match(buildBriefing(root), /^\[status · plan · waiting-user\]/);
    assert.equal(execute(['status'], root).summary, summary);
  });
});

describe('commands REQ-002 explain', () => {
  it('TC-002 explains an ID, a term, a file, and says so for the unknown', t => {
    const root = tempRoot(t);
    installStage(root, 1);
    installStage(root, 2);
    const id = explain(root, 'f-001');
    assert.equal(id.kind, 'id');
    assert.match(id.text, /F-001 는 기능 정의서 의 항목이다\. 부모: REQ-001\./);
    assert.match(id.text, /WI-2026-09-16-s2 에서/);
    assert.match(id.text, /stale 아님/);
    const parent = explain(root, 'REQ-001');
    assert.match(parent.text, /자식: F-001\./);
    const term = explain(root, 'stale');
    assert.equal(term.kind, 'term');
    assert.match(term.text, /상위 문서 항목이 바뀌어/);
    assert.equal(explain(root, '되돌리기').kind, 'term');
    const file = explain(root, 'docs/product/02-features.md');
    assert.equal(file.kind, 'file');
    assert.match(file.text, /2단계 기능 정의서 정본이다\. 상태 approved, 항목 2개/);
    const missing = explain(root, 'REQ-099');
    assert.equal(missing.kind, 'unknown');
    assert.deepEqual(missing.candidates, ['REQ-001', 'REQ-002']);
    const unknown = explain(root, '외계어');
    assert.equal(unknown.kind, 'unknown');
    assert.match(unknown.text, /모른다/);
    assert.equal(execute(['explain', '--target', 'F-002'], root).kind, 'id');
    assert.ok(loadGlossary().terms.length >= 20);
  });
});

describe('commands REQ-003/004 save and revert through git', () => {
  it('TC-003 save proposes, refuses without a token or with drifted versions, and commits with the token', t => {
    const root = gitRoot(t);
    assert.equal(vcs.saveProposal(root).ok, false);
    assert.match(vcs.saveProposal(root).reason, /저장할 변경이 없다/);
    fs.writeFileSync(path.join(root, 'note.txt'), 'hello');
    const proposal = vcs.saveProposal(root);
    assert.equal(proposal.ok, true);
    assert.deepEqual(proposal.changedFiles, ['?? note.txt']);
    assert.match(proposal.suggestedMessage, /^chore: 작업 저장 \(3\.5\.0\)\n/);
    assert.match(proposal.suggestedMessage, /Generated-By: vais-code 3\.5\.0/);
    assert.throws(() => vcs.commitSave(root, { sessionId: 's' }), /직접 입력해야/);
    grantConfirmation(root, 'other', { type: 'save' });
    assert.throws(() => vcs.commitSave(root, { sessionId: 's' }), /직접 입력해야/);
    grantConfirmation(root, 's', { type: 'save' });
    const saved = execute(['save', 'commit', '--session', 's', '--message', 'feat: 노트 추가'], root);
    assert.match(saved.hash, /^[0-9a-f]{40}$/);
    assert.equal(saved.subject, 'feat: 노트 추가');
    assert.equal(git(root, ['log', '-1', '--format=%s']), 'feat: 노트 추가');
    assert.match(git(root, ['log', '-1', '--format=%b']), /Generated-By: vais-code 3\.5\.0/);
    assert.equal(vcs.changedFiles(root).length, 0);

    writeVersions(root, VERSION, { 'package.json': '3.4.0' });
    fs.writeFileSync(path.join(root, 'note.txt'), 'changed');
    const drifted = execute(['save', 'propose'], root);
    assert.equal(drifted.ok, false);
    assert.match(drifted.reason, /버전이 어긋나/);
    assert.ok(drifted.mismatches.some(entry => /package\.json=3\.4\.0/.test(entry)));
    grantConfirmation(root, 's', { type: 'save' });
    assert.throws(() => vcs.commitSave(root, { sessionId: 's' }), /버전이 어긋나/);
  });

  it('TC-004 revert lists the commits behind a Work item id or hash, refuses without a token, and reverts with it', t => {
    const root = gitRoot(t);
    fs.writeFileSync(path.join(root, 'app.txt'), 'v1');
    git(root, ['add', '-A']);
    git(root, ['commit', '-q', '-m', 'feat: app v1\n\nWork-Item: WI-2026-09-16-app']);
    const hash = git(root, ['rev-parse', 'HEAD']);
    const byId = vcs.revertProposal(root, 'WI-2026-09-16-app');
    assert.equal(byId.ok, true);
    assert.deepEqual(byId.commits.map(commit => [commit.hash, commit.files]), [[hash, ['app.txt']]]);
    assert.equal(vcs.revertProposal(root, hash.slice(0, 8)).commits[0].hash, hash);
    assert.equal(vcs.revertProposal(root, 'WI-2026-09-16-none').ok, false);
    assert.match(vcs.revertProposal(root, 'nonsense!').reason, /작업 ID.*또는 커밋 해시/);
    assert.throws(() => vcs.revertCommits(root, { sessionId: 's', target: 'WI-2026-09-16-app' }), /직접 입력해야/);
    grantConfirmation(root, 's', { type: 'revert', target: 'other' });
    assert.throws(() => vcs.revertCommits(root, { sessionId: 's', target: 'WI-2026-09-16-app' }), /직접 입력해야/);
    grantConfirmation(root, 's', { type: 'revert', target: 'WI-2026-09-16-app' });
    const result = execute(['revert', 'commit', '--session', 's', '--target', 'WI-2026-09-16-app'], root);
    assert.equal(result.reverted.length, 1);
    assert.equal(fs.existsSync(path.join(root, 'app.txt')), false);
    assert.match(git(root, ['log', '-1', '--format=%s']), /^Revert "feat: app v1"/);
  });
});

describe('commands REQ-005/006 propose and ledger', () => {
  it('TC-005 the propose command returns the proposal engine result', t => {
    const root = tempRoot(t);
    assert.deepEqual(execute(['propose'], root).proposals, propose(root));
  });

  it('TC-006 ledger add needs the user token and a valid kind; list filters by kind', t => {
    const root = tempRoot(t);
    assert.equal(ledger.normalizeKind('취향'), 'preference');
    assert.equal(ledger.normalizeKind('Debt'), 'debt');
    assert.equal(ledger.normalizeKind('milestone'), null);
    assert.throws(() => ledgerAdd(root, { session: 's', kind: 'preference', text: '버튼은 파랑' }), /직접 입력해야/);
    grantConfirmation(root, 's', { type: 'ledger', kind: 'preference', text: '버튼은 파랑' });
    assert.throws(() => ledgerAdd(root, { session: 's', kind: 'preference', text: '버튼은 빨강' }), /직접 입력해야/);
    assert.throws(() => ledgerAdd(root, { session: 's', kind: 'wish', text: 'x' }), /장부 종류는/);
    const added = execute(['ledger', 'add', '--session', 's', '--kind', '취향', '--text', '버튼은 파랑'], root);
    assert.equal(added.entry.kind, 'preference');
    assert.deepEqual(added.entry.source, { type: 'user', id: 's' });
    ledger.append(root, { workItemId: null, feature: null, kind: 'debt', text: '남은 일', why: '', source: { type: 'event', id: 'x' } });
    assert.equal(execute(['ledger', 'list'], root).entries.length, 2);
    assert.deepEqual(execute(['ledger', 'list', '--kind', '취향'], root).entries.map(entry => entry.text), ['버튼은 파랑']);
    assert.throws(() => execute(['ledger', 'list', '--kind', 'wish'], root), /장부 종류는/);
  });
});

describe('commands REQ-007 router, help, and tokens', () => {
  it('TC-007 eight commands route deterministically and write commands need the user sentence', () => {
    assert.equal(routePrompt('/vais 상태', null).action, 'status');
    assert.deepEqual([routePrompt('/vais 설명 F-003', null).action, routePrompt('/vais 설명 F-003', null).target], ['explain', 'F-003']);
    assert.equal(routePrompt('/vais 설명서 화면 만들기', null).action, 'start-request');
    const save = routePrompt('/vais 저장 feat: 메시지', null);
    assert.deepEqual([save.action, save.mutationAllowed, save.message], ['save', false, 'feat: 메시지']);
    const saveConfirm = routePrompt('/vais 저장 확인: 다른 메시지', { phase: 'do', status: 'waiting-user' });
    assert.deepEqual([saveConfirm.action, saveConfirm.mutationAllowed, saveConfirm.message], ['save-confirm', true, '다른 메시지']);
    assert.equal(routePrompt('/vais 저장 확인', null).message, null);
    assert.deepEqual([routePrompt('/vais 되돌리기 WI-2026-09-16-x', null).action, routePrompt('/vais 되돌리기 확인: abc1234', null).action], ['revert', 'revert-confirm']);
    assert.equal(routePrompt('/vais 제안', null).action, 'propose');
    const note = routePrompt('/vais 기록 취향 버튼은 항상 파랑', null);
    assert.deepEqual([note.action, note.kind, note.text, note.mutationAllowed], ['ledger-add', 'preference', '버튼은 항상 파랑', true]);
    assert.equal(routePrompt('/vais 기록 화면 만들기', null).action, 'start-request');
    assert.deepEqual([routePrompt('/vais 기록 보기', null).action, routePrompt('/vais 기록 보기 부채', null).kind], ['ledger-list', 'debt']);
    assert.deepEqual(prompt.confirmationsFor(note), [{ type: 'ledger', kind: 'preference', text: '버튼은 항상 파랑' }]);
    assert.deepEqual(prompt.confirmationsFor(saveConfirm), [{ type: 'save', message: '다른 메시지' }]);
    assert.deepEqual(prompt.confirmationsFor(routePrompt('/vais 되돌리기 확인: WI-2026-09-16-x', null)), [{ type: 'revert', target: 'WI-2026-09-16-x' }]);
    assert.deepEqual(prompt.confirmationsFor(save), []);
    const help = prompt.buildContext(routePrompt('/vais help', null), null, null, 's');
    for (const needle of ['/vais 상태', '/vais 설명', '/vais 저장 확인', '/vais 되돌리기 확인', '/vais 제안', '/vais 기록 보기']) assert.ok(help.includes(needle), needle);
    assert.match(prompt.buildContext(saveConfirm, null, null, 'sess'), /save commit --session sess --message "다른 메시지"/);
    assert.match(prompt.buildContext(save, null, null, 'sess'), /save propose --message "feat: 메시지"[\s\S]*읽기 전용/);
    assert.match(prompt.buildContext(note, null, null, 'sess'), /ledger add --session sess --kind preference --text "버튼은 항상 파랑"/);
    const cli = 'node "${CLAUDE_PLUGIN_ROOT}/scripts/vais-workflow-v2.js"';
    assert.equal(authorizeCommand(`${cli} explain --target F-001`, null).allowed, true);
    assert.equal(authorizeCommand(`${cli} save propose`, null).allowed, true);
    assert.equal(authorizeCommand(`${cli} ledger list`, null).allowed, true);
    assert.equal(authorizeCommand(`${cli} save commit --session s`, null).allowed, false);
    assert.equal(authorizeCommand(`${cli} revert commit --session s --target x`, null).allowed, false);
    assert.equal(authorizeCommand(`${cli} ledger add --session s --kind note --text x`, null).allowed, false);
    assert.equal(authorizeCommand('git commit -m x', null).allowed, false);
  });
});

describe('commands REQ-008 H4 leftovers', () => {
  it('TC-008 a revised or materially changed Design forgets the chosen option; 검색 is not ui; long outcomes are refused', () => {
    let state = createInitialWorkItem({ id: 'WI-2026-09-16-ui', title: 'ui', primaryFeature: 'ui', scale: 'standard', kind: 'ui' });
    state = transition(state, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    state = transition(state, EVENTS.USER_PLAN_APPROVED);
    state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['app/**'], readinessChecks: ['screen-capture'], reviewChecks: ['screen-capture'] });
    state = transition(state, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    state = transition(state, EVENTS.USER_OPTION_CHOSEN, { option: 2 });
    assert.equal(transition(state, EVENTS.USER_DESIGN_REVISED, { reason: '다른 안' }).chosenOption, null);
    let approved = transition(state, EVENTS.USER_DESIGN_APPROVED);
    approved = transition(approved, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    approved = transition(approved, EVENTS.USER_SCREEN_REVISED, { reason: 'x' });
    assert.equal(transition(approved, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false }).chosenOption, 2);
    assert.equal(transition(approved, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: true }).chosenOption, null);
    assert.notEqual(suggestKind('/vais 검색 기능 추가').kind, 'ui');
    assert.equal(suggestKind('/vais 버튼 색상을 파랑으로').kind, 'ui');
    const item = { id: 'WI-2026-09-16-r', title: 'r', primaryFeature: 'r', approvals: { final: 'approved' }, writeScopes: [] };
    assert.throws(() => reportBody(os.tmpdir(), item, { outcome: 'x'.repeat(REPORT_OUTCOME_LIMIT + 1) }), new RegExp(`${REPORT_OUTCOME_LIMIT}자 이내`));
    assert.match(reportBody(os.tmpdir(), item, { outcome: 'x'.repeat(REPORT_OUTCOME_LIMIT) }), /## 최종 결과/);
  });
});

function doctorFixture(t) {
  const root = tempRoot(t);
  fs.mkdirSync(path.join(root, 'hooks'));
  fs.writeFileSync(path.join(root, 'hooks', 'guard.js'), '');
  const handler = [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/guard.js' }] }];
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({ hooks: Object.fromEntries(REQUIRED_HOOK_EVENTS.map(event => [event, handler])) }));
  return root;
}

describe('commands REQ-009 doctor git', () => {
  it('TC-009 reports no repository, no remote, and a connected remote', t => {
    const root = doctorFixture(t);
    const gitCheck = () => runDoctor(root, { env: {}, homeDir: root }).checks.find(item => item.id === 'git');
    assert.equal(gitCheck().verdict, 'warn');
    assert.match(gitCheck().detail, /git 저장소가 아니다/);
    git(root, ['init', '-q']);
    assert.equal(gitCheck().verdict, 'warn');
    assert.match(gitCheck().detail, /원격 없음/);
    git(root, ['remote', 'add', 'origin', 'https://example.com/x.git']);
    assert.equal(gitCheck().verdict, 'pass');
    assert.match(gitCheck().detail, /원격 origin/);
  });
});

describe('commands REQ-011 documents and versions', () => {
  it('TC-011 one version (≥ 3.5.0) everywhere, CHANGELOG, roadmap H4 done, design.md rows done', () => {
    const versions = versionFiles(REPO);
    const current = [...new Set(Object.values(versions))];
    assert.equal(current.length, 1, JSON.stringify(versions));
    const [major, minor] = current[0].split('.').map(Number);
    assert.ok(major > 3 || (major === 3 && minor >= 5), `repo version ${current[0]} predates H5`);
    assert.equal(vcs.versionReport(REPO).synced, true);
    assert.ok(fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8').includes(`## [${current[0]}]`));
    const roadmap = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'roadmap.md'), 'utf8');
    assert.match(roadmap, /\| H4 \| 완료 \|/);
    assert.match(roadmap, /\| H5 \| (진행 중|완료) \|/);
    const design = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'design.md'), 'utf8');
    for (const pattern of [/\| 명령 다섯 \+ 제안·기록[^\n]*\| 완료 \(H5\) \|/, /\| 설명 명령[^\n]*\| 완료 \(H5\) \|/, /\| 저장·되돌리기[^\n]*\| 완료 \(H5\) \|/]) assert.match(design, pattern);
    assert.match(fs.readFileSync(path.join(REPO, 'README.md'), 'utf8'), /\/vais 저장 확인/);
  });
});

// regression-and-docs (roadmap H7) REQ-002~004: the save defects found while saving 3.6.0.
describe('regression-and-docs REQ-002/003/004 save works in a real repository layout', () => {
  it('TC-002 commits when .gitignore already ignores .vais/, never commits .vais/, and explains a failure', t => {
    const root = gitRoot(t);
    fs.writeFileSync(path.join(root, '.gitignore'), '.vais/\n');
    fs.mkdirSync(path.join(root, '.vais', 'v2'), { recursive: true });
    fs.writeFileSync(path.join(root, '.vais', 'v2', 'state.json'), '{}');
    fs.writeFileSync(path.join(root, 'note.txt'), 'hello');
    grantConfirmation(root, 's', { type: 'save' });
    const saved = vcs.commitSave(root, { sessionId: 's' });
    assert.match(saved.hash, /^[0-9a-f]{40}$/);
    assert.deepEqual(git(root, ['show', '--name-only', '--format=', 'HEAD']).split('\n').filter(Boolean).sort(), ['.gitignore', 'note.txt']);
    assert.equal(vcs.changedFiles(root).length, 0);

    // A project without the ignore rule still never commits runtime state.
    const bare = gitRoot(t);
    fs.mkdirSync(path.join(bare, '.vais', 'v2'), { recursive: true });
    fs.writeFileSync(path.join(bare, '.vais', 'v2', 'state.json'), '{}');
    fs.writeFileSync(path.join(bare, 'note.txt'), 'hello');
    grantConfirmation(bare, 's', { type: 'save' });
    vcs.commitSave(bare, { sessionId: 's' });
    assert.deepEqual(git(bare, ['show', '--name-only', '--format=', 'HEAD']).split('\n').filter(Boolean), ['note.txt']);
    assert.equal(git(bare, ['ls-files', '.vais']), '');

    // A commit that cannot happen (nothing staged after add) is reported in the user's words, without retry.
    const stuck = gitRoot(t);
    fs.mkdirSync(path.join(stuck, '.vais'), { recursive: true });
    fs.writeFileSync(path.join(stuck, '.vais', 'only.json'), '{}');
    fs.writeFileSync(path.join(stuck, 'note.txt'), 'hello');
    grantConfirmation(stuck, 's', { type: 'save' });
    fs.writeFileSync(path.join(stuck, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    assert.throws(() => vcs.commitSave(stuck, { sessionId: 's' }), error => error.code === 'SAVE_FAILED' && /스테이지 1개 됨 · 커밋 단계에서 실패/.test(error.message) && error.staged === 1);
  });

  it('TC-003 `commit` is a save alias only as the bare word or with 확인/confirm', () => {
    assert.equal(routePrompt('/vais commit', null).action, 'save');
    assert.equal(routePrompt('/vais commit 확인', null).action, 'save-confirm');
    const confirmed = routePrompt('/vais commit confirm: feat: 검색', null);
    assert.equal(confirmed.action, 'save-confirm');
    assert.match(JSON.stringify(confirmed), /feat: 검색/);
    assert.equal(routePrompt('/vais 저장 확인', null).action, 'save-confirm');
    assert.notEqual(routePrompt('/vais commit 기능 만들어', null).action, 'save');
    assert.notEqual(routePrompt('/vais commit 기능 만들어', null).action, 'save-confirm');
    assert.match(prompt.HELP_LINES.join('\n'), /`commit` → `commit 확인`/);
  });

  it('TC-004 changedFiles keeps the leading dot of the first changed path', t => {
    const root = gitRoot(t);
    fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: VERSION, touched: true }));
    const files = vcs.changedFiles(root);
    assert.deepEqual(files, [{ status: 'M', file: '.claude-plugin/plugin.json' }]);
    assert.deepEqual(vcs.saveProposal(root).changedFiles, ['M .claude-plugin/plugin.json']);
  });
});
