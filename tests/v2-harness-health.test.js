'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { resolveMode, loadWorkflowConfig, warningLine, KNOWN_WORKFLOW_KEYS } = require('../lib/workflow/v2/config');
const { authorizeCommand, authorizeFilePath, isScratchPath } = require('../lib/workflow/v2/write-policy');
const { routePrompt } = require('../lib/workflow/v2/router');
const { deterministicSlug, isValidUserSlug } = require('../lib/workflow/v2/naming');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { runtimeStamp } = require('../lib/workflow/v2/phase-transaction');
const { validateContract } = require('../lib/workflow/v2/contracts');
const { runDoctor, versionFiles } = require('../lib/workflow/v2/doctor');
const { assertNewFeatureSlug } = require('../scripts/vais-workflow-v2');
const prompt = require('../hooks/workflow-v2-prompt');

const REPO = path.join(__dirname, '..');

function tempRoot(t, mode = 'enforce') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-health-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeConfig(root, mode);
  return root;
}

function writeConfig(root, mode, extra = {}) {
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({
    version: '3.1.0', workflowV2: { mode, ...extra },
  }, null, 2));
}

describe('harness-health REQ-001 mode normalization is fail-loud and fail-closed', () => {
  it('TC-001 accepts Enforce with different casing without a warning', t => {
    const root = tempRoot(t, ' Enforce ');
    assert.deepEqual(resolveMode(root, {}), { mode: 'enforce', warning: null, raw: ' Enforce ' });
  });

  it('TC-001 keeps enforce and warns on an unknown value instead of turning the harness off', t => {
    const root = tempRoot(t, 'enforcee');
    const resolved = resolveMode(root, {});
    assert.equal(resolved.mode, 'enforce');
    assert.match(resolved.warning, /mode 값 오류/);
    assert.match(warningLine(resolved), /^⚠ VAIS 하네스 경고: /);
    assert.equal(authorizeFilePath(root, path.join(root, 'src', 'a.js'), null).allowed, false);
  });

  it('TC-001 warns and stays closed when the config cannot be read', t => {
    const root = tempRoot(t, 'enforce');
    fs.writeFileSync(path.join(root, 'vais.config.json'), '{ not json');
    const resolved = resolveMode(root, {});
    assert.equal(resolved.mode, 'enforce');
    assert.match(resolved.warning, /읽을 수 없다/);
  });

  it('TC-001 accepts disabled as the only configured way to turn the harness off', t => {
    const root = tempRoot(t, 'DISABLED');
    assert.equal(resolveMode(root, {}).mode, 'disabled');
  });

  it('TC-001 a hook exception becomes a visible warning, not an empty hook result', () => {
    const context = prompt.failLoudContext(new Error('state file corrupted').message);
    assert.match(context, /^⚠ VAIS 하네스 경고: hook 예외 — state file corrupted/);
    assert.match(context, /\/vais doctor/);
    assert.doesNotMatch(context, /^\{\}$/m);
  });
});

describe('harness-health REQ-002 emergency switch', () => {
  it('TC-002 VAIS_HARNESS_OFF turns every hook off and marks the session inactive', t => {
    const root = tempRoot(t, 'enforce');
    const resolved = resolveMode(root, { VAIS_HARNESS_OFF: '1' });
    assert.equal(resolved.mode, 'off');
    const context = prompt.harnessInactiveContext(resolved);
    assert.ok(context.startsWith(prompt.INACTIVE_LINE));
    assert.match(context, /VAIS_HARNESS_OFF/);
    assert.equal(resolveMode(root, { VAIS_HARNESS_OFF: '0' }).mode, 'enforce');
  });
});

describe('harness-health REQ-003 read-only commands and scratch writes', () => {
  it('TC-003 allows git -C read commands and version probes without authorization', () => {
    assert.equal(authorizeCommand('git -C /somewhere status --short', null).allowed, true);
    assert.equal(authorizeCommand('git -C /somewhere log -3', null).allowed, true);
    assert.equal(authorizeCommand('node --version', null).allowed, true);
    assert.equal(authorizeCommand('git -C /somewhere commit -m x', null).allowed, false);
    assert.equal(authorizeCommand('git -C /somewhere push', null).allowed, false);
    assert.equal(authorizeCommand('node scripts/vais-doctor.js', null).allowed, true);
    assert.equal(authorizeCommand('npm run doctor', null).allowed, true);
  });

  it('TC-003 allows writes under the Claude scratchpad but not project files', t => {
    const root = tempRoot(t, 'enforce');
    const scratch = path.join(os.tmpdir(), 'claude-1000', 'session', 'scratchpad', 'note.md');
    assert.equal(isScratchPath(scratch), true);
    assert.equal(isScratchPath(path.join(os.tmpdir(), 'other', 'note.md')), false);
    assert.equal(authorizeFilePath(root, scratch, null).kind, 'scratch-write');
    assert.equal(authorizeFilePath(root, path.join(root, 'src', 'a.js'), null).allowed, false);
  });
});

describe('harness-health REQ-004 configuration is read, dead keys are reported', () => {
  it('TC-004 lease and authorization TTL come from vais.config.json', t => {
    const root = tempRoot(t, 'enforce');
    writeConfig(root, 'enforce', { leaseMs: 5, authorizationTtlMs: 7 });
    const store = new WorkItemStore(root);
    assert.equal(store.leaseMs, 5);
    assert.equal(new AuthorizationStore(root).ttlMs, 7);
    const item = store.create({
      id: 'WI-2026-09-15-lease', title: 'Lease', primaryFeature: 'lease', affectedFeatures: [], scale: 'compact',
    });
    store.acquireLease(item.id, 'session-a', Date.now() - 100);
    assert.doesNotThrow(() => store.acquireLease(item.id, 'session-b', Date.now()));
  });

  it('TC-004 unknown workflowV2 keys are surfaced and managedPrefix is no longer known', t => {
    const root = tempRoot(t, 'enforce');
    writeConfig(root, 'enforce', { managedPrefix: '/vais' });
    assert.deepEqual(loadWorkflowConfig(root).unknownKeys, ['managedPrefix']);
    assert.equal(KNOWN_WORKFLOW_KEYS.includes('managedPrefix'), false);
    assert.equal(loadWorkflowConfig(root).leaseMs, 60_000);
  });
});

describe('harness-health REQ-005 feature names come from the request or the user, never the AI', () => {
  it('TC-005 a request without ASCII words yields no slug and the hook asks for a name', () => {
    assert.equal(deterministicSlug('하네스 설계 문서 작성'), null);
    const guidance = prompt.phaseGuidance(null, 'sess', null).join('\n');
    assert.match(guidance, /\/vais 이름: <name>/);
  });

  it('TC-005 the router accepts a user-typed name and rejects malformed ones', () => {
    const named = routePrompt('/vais 이름: Reading-Log', null);
    assert.equal(named.action, 'name-feature');
    assert.equal(named.slug, 'reading-log');
    assert.equal(prompt.requestSlugFor(named), 'reading-log');
    assert.notEqual(routePrompt('/vais 이름: bad_name!', null).action, 'name-feature');
    assert.equal(isValidUserSlug('reading-log'), true);
    assert.equal(isValidUserSlug('Bad_Name'), false);
  });

  it('TC-005 the CLI refuses a new Feature while the request slug is still unresolved', () => {
    assert.throws(() => assertNewFeatureSlug('new', 'made-up', 'made-up', { action: 'start-request', requestSlug: null }), /이름이 확정되지 않았다/);
    assert.throws(() => assertNewFeatureSlug('new', 'other', 'other', { action: 'start-request', requestSlug: 'reading-log' }), /runtime-issued slug/);
    assert.doesNotThrow(() => assertNewFeatureSlug('new', 'reading-log', 'reading-log', { action: 'start-request', requestSlug: 'reading-log' }));
    assert.doesNotThrow(() => assertNewFeatureSlug('existing', 'x', 'login', { action: 'start-request', requestSlug: null }));
  });
});

describe('harness-health REQ-006 router vocabulary', () => {
  it('TC-006 evaluation-only approval suffixes are gone and help is a read-only action', () => {
    const review = { phase: 'review', status: 'waiting-user' };
    assert.equal(routePrompt('/vais 최종 승인. ai qa pass를 확인했습니다', review).action, 'invalid-approval');
    assert.equal(routePrompt('/vais 최종 승인. report를 확정하고 완료 상태를 보여줘', review).action, 'invalid-approval');
    assert.equal(routePrompt('/vais 최종 승인. 승인된 범위로 구현하고 do readiness gate까지만 진행해', review).action, 'invalid-approval');
    assert.equal(routePrompt('/vais 최종 승인. 진행해', review).action, 'approve-final');
    const help = routePrompt('/vais help', null);
    assert.equal(help.action, 'help');
    assert.equal(help.mutationAllowed, false);
    assert.equal(routePrompt('/vais 도움말', review).action, 'help');
    assert.equal(routePrompt('/vais doctor', review).action, 'doctor');
    assert.match(prompt.buildContext(help, null, null, 'sess'), /\/vais 이름: <kebab-case>/);
  });
});

describe('harness-health REQ-007 plan draft path', () => {
  it('TC-007 the revise-plan guidance points inside the Work item plan folder', () => {
    const item = {
      id: 'WI-2026-09-15-sample', primaryFeature: 'sample', phase: 'plan', status: 'active',
      planRevision: 1, designRevision: 1, qaRepairCount: 0,
    };
    assert.equal(prompt.planDraftPath(item), 'docs/work-items/sample/2026-09-15-sample/01-plan/draft.md');
    assert.match(prompt.phaseGuidance(item, 'sess').join('\n'), /01-plan\/draft\.md/);
  });
});

describe('harness-health REQ-008 receipt version stamp', () => {
  it('TC-008 every receipt carries plugin, node, and Claude Code versions', () => {
    const stamp = runtimeStamp({ CLAUDE_CODE_VERSION: '2.1.300' });
    assert.equal(stamp.node, process.version);
    assert.equal(stamp.claudeCode, '2.1.300');
    assert.equal(typeof stamp.plugin, 'string');
    assert.equal(runtimeStamp({}).claudeCode, null);
    const receipt = {
      schema: 'phase-transaction/v1', id: 'PT-2152190f-241c-4981-8f31-f241a3896e4c', workItemId: 'WI-2026-09-15-x',
      phase: 'plan', action: 'present', verdict: 'PASS', next: { phase: 'plan', status: 'waiting-user' },
      evidencePath: 'docs/x.json', findingPath: null, runtime: stamp,
    };
    assert.equal(validateContract('phaseTransactionReceipt', receipt).valid, true);
  });
});

function doctorFixture(t) {
  const root = tempRoot(t, 'enforce');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: '3.1.0' }));
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '3.1.0' }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({
    metadata: { version: '3.1.0' }, plugins: [{ version: '3.1.0' }],
  }));
  fs.mkdirSync(path.join(root, 'hooks'));
  fs.writeFileSync(path.join(root, 'hooks', 'run-node.sh'), '#!/bin/sh\n');
  fs.writeFileSync(path.join(root, 'hooks', 'guard.js'), '');
  const handler = [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/guard.js' }] }];
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({
    hooks: { SessionStart: handler, UserPromptSubmit: handler, PreToolUse: handler, PostToolUse: handler, Stop: handler },
  }));
  return root;
}

describe('harness-health REQ-009 doctor', () => {
  it('TC-009 a healthy repository has no failing check', t => {
    const root = doctorFixture(t);
    const report = runDoctor(root, { env: {}, homeDir: root });
    assert.equal(report.checks.filter(item => item.verdict === 'fail').length, 0, JSON.stringify(report.checks));
    assert.equal(report.checks.find(item => item.id === 'mode').verdict, 'pass');
    assert.equal(report.checks.find(item => item.id === 'version-sync').verdict, 'pass');
  });

  it('TC-009 injected defects are reported per check with a fix', t => {
    const root = doctorFixture(t);
    writeConfig(root, 'enforcee', { managedPrefix: '/vais' });
    fs.unlinkSync(path.join(root, 'hooks', 'guard.js'));
    const report = runDoctor(root, { env: { VAIS_HARNESS_OFF: '1' }, homeDir: root });
    const byId = Object.fromEntries(report.checks.map(item => [item.id, item]));
    assert.equal(report.verdict, 'fail');
    assert.equal(byId['hooks-registered'].verdict, 'fail');
    assert.match(byId['hooks-registered'].fix, /복구/);
    assert.equal(byId['unknown-keys'].verdict, 'warn');
    assert.match(byId['unknown-keys'].detail, /managedPrefix/);
    assert.equal(byId['harness-switch'].verdict, 'warn');
    writeConfig(root, 'enforcee');
    assert.equal(runDoctor(root, { env: {}, homeDir: root }).checks.find(item => item.id === 'mode').verdict, 'fail');
  });

  it('TC-009 the runtime doctor command runs without authorization while other runtime commands stay closed', () => {
    const cli = 'node "/home/user/.claude/plugins/cache/vais-marketplace/vais-code/3.1.0/scripts/vais-workflow-v2.js"';
    const trusted = { trustedRuntimePrefixes: [cli] };
    assert.equal(authorizeCommand(`${cli} doctor`, null, trusted).allowed, true);
    assert.equal(authorizeCommand('node "${CLAUDE_PLUGIN_ROOT}/scripts/vais-workflow-v2.js" doctor', null).allowed, true);
    assert.equal(authorizeCommand(`${cli} plan present --slug x`, null, trusted).allowed, false);
    // `status` became a read-only user command (H5); a mutating command must still be closed.
    assert.equal(authorizeCommand(`${cli} status`, null, trusted).allowed, true);
    assert.equal(authorizeCommand(`${cli} handoff --id x --session s`, null, trusted).allowed, false);
    assert.equal(authorizeCommand(`${cli} doctor && rm -rf /`, null, trusted).allowed, false);
    assert.equal(authorizeCommand('node /tmp/evil/scripts/vais-workflow-v2.js doctor', null, trusted).allowed, false);
    assert.equal(authorizeCommand(`${cli} doctor`, null).allowed, false);
  });
});

describe('harness-health REQ-011 and REQ-012 documents and versions', () => {
  it('TC-011 the design note carries the QA leftovers', () => {
    const design = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'design.md'), 'utf8');
    const roadmap = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'roadmap.md'), 'utf8');
    const summary = design.split('## 0. 한 장 요약')[1].split('\n').map(line => line.trim()).filter(Boolean)[1];
    assert.ok(summary.length <= 300, `summary is ${summary.length} chars`);
    assert.match(summary, /억지력/);
    assert.equal(roadmap.includes('2.13'), false);
    assert.match(design, /diff-summary\.js/);
    assert.match(design, /닫힘으로/);
    assert.match(design, /runtime: \{plugin, node, claudeCode\}/);
  });

  it('TC-012 the version is synchronized across manifests and the README badge', () => {
    const versions = versionFiles(REPO);
    const distinct = new Set(Object.values(versions));
    assert.equal(distinct.size, 1, JSON.stringify(versions));
    const [version] = distinct;
    const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
    assert.ok(readme.includes(`version-${version}-blue`), `README badge does not show ${version}`);
    const changelog = fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8');
    assert.ok(changelog.includes(`## [${version}]`));
  });
});
