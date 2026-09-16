'use strict';

// product-note (roadmap H3) REQ-001~010, REQ-012. Scene E (REQ-011) lives in tests/regression/.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ledger = require('../lib/workflow/v2/ledger');
const { propose } = require('../lib/workflow/v2/proposal');
const productNote = require('../lib/workflow/v2/product-note');
const idChain = require('../lib/workflow/v2/id-chain');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { EVENTS } = require('../lib/workflow/v2/state-machine');
const { writePhaseDocument } = require('../lib/workflow/v2/document-manager');
const { captureRepoSnapshot } = require('../lib/workflow/v2/repo-drift');
const { runDoctor, versionFiles, REQUIRED_HOOK_EVENTS } = require('../lib/workflow/v2/doctor');
const { runPhaseTransaction } = require('../lib/workflow/v2/phase-transaction');
const { loadChainCatalog, getStage } = require('../lib/workflow/v2/chain-registry');
const { validateContract } = require('../lib/workflow/v2/contracts');
const stateStore = require('../lib/core/state-store');
const sessionStart = require('../hooks/session-start');
const stop = require('../hooks/workflow-v2-stop');
const prompt = require('../hooks/workflow-v2-prompt');
const { statusLineText } = require('../scripts/vais-statusline');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');

function tempRoot(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-note-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.3.0', workflowV2: { mode: 'enforce', ...extra } }));
  return root;
}

function gate(name, verdict, checks = ['test']) {
  return {
    gateResult: {
      gate: name, verdict, requiredChecks: checks,
      passed: ['PASS', 'READY'].includes(verdict) ? checks : [],
      failed: ['FAIL', 'NOT_READY'].includes(verdict) ? checks : [],
      blocked: verdict === 'BLOCKED' ? checks : [], missing: [], evaluatedAt: '2026-09-16T00:00:00.000Z',
    },
  };
}

function installStage(root, order) {
  const stage = loadChainCatalog().stages.find(entry => entry.order === order);
  const target = path.join(root, stage.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), target);
  if (stage.artifactDir) {
    const source = path.join(FIXTURES, path.basename(stage.artifactDir));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(source)) fs.copyFileSync(path.join(source, name), path.join(root, stage.artifactDir, name));
    }
  }
  return stage;
}

function newItem(root, id = 'WI-2026-09-16-note', feature = 'note') {
  const store = new WorkItemStore(root);
  const item = store.create({ id, title: '노트 테스트', primaryFeature: feature, affectedFeatures: [], scale: 'compact', kind: 'harness' });
  return { store, item };
}

describe('product-note REQ-001 ledger is append-only and schema checked', () => {
  it('TC-001 appends three entries, reads them back, skips one broken line, rejects bad kinds', t => {
    const root = tempRoot(t);
    for (const kind of ['milestone', 'decision', 'debt']) {
      const entry = ledger.append(root, { workItemId: 'WI-2026-09-16-a', feature: 'a', kind, text: `${kind} 항목`, why: '테스트', source: { type: 'event', id: 'test' } });
      assert.equal(validateContract('ledgerEntry', entry).valid, true);
    }
    fs.appendFileSync(ledger.ledgerPath(root), '{ broken json\n');
    const { entries, broken } = ledger.read(root);
    assert.equal(entries.length, 3);
    assert.deepEqual(broken, [{ line: 4, reason: 'json' }]);
    assert.throws(() => ledger.append(root, { kind: 'wish', text: 'x', source: { type: 'event', id: 'x' } }), /Unknown ledger kind/);
    assert.throws(() => ledger.makeEntry({ kind: 'debt', text: '', source: { type: 'event', id: 'x' } }), /contract invalid/);
    assert.equal(typeof ledger.recent, 'function');
    assert.deepEqual(Object.keys(ledger).filter(name => /remove|delete|rewrite|update/i.test(name)), []);
  });
});

describe('product-note REQ-002 transitions leave ledger lines automatically', () => {
  it('TC-002 approvals, a revision, QA FAIL, NOT_READY, and finalize limitations are recorded with their source', t => {
    const root = tempRoot(t);
    const { store, item } = newItem(root);
    writePhaseDocument(root, item, 'plan', '# Plan\n\nREQ-001 x', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {});
    store.apply(item.id, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['src/**'], readinessChecks: ['test'], reviewChecks: ['test'] });
    writePhaseDocument(root, item, 'design', '# Design\n\n## 결정\n\n- 장부는 append-only 다\n- 노트는 전량 재생성한다\n', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    store.apply(item.id, EVENTS.USER_DESIGN_REVISED, { reason: '/vais 안 2 를 추가해 token=secret123456' }); // vais-secret-scan: allow-fixture
    store.apply(item.id, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {});
    store.apply(item.id, EVENTS.READINESS_NOT_READY, gate('readiness', 'NOT_READY'));
    store.apply(item.id, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    store.apply(item.id, EVENTS.QA_FAIL, gate('review', 'FAIL'));
    store.apply(item.id, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false });
    store.apply(item.id, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    store.apply(item.id, EVENTS.QA_PASS, gate('review', 'PASS'));
    writePhaseDocument(root, item, 'review', '# Review\n\n기대 실제 입력 출력 증거', { status: 'draft' });
    store.apply(item.id, EVENTS.USER_FINAL_APPROVED, {});
    writePhaseDocument(root, item, 'report', '# Report\n\n최종 승인 REQ-001', { status: 'draft' });
    store.apply(item.id, EVENTS.REPORT_VALIDATED, { ...gate('report', 'PASS'), limitations: ['제한 하나', '제한 둘'] }, { transactionId: 'PT-test-1' });

    const { entries, broken } = ledger.read(root);
    assert.deepEqual(broken, []);
    const counts = ledger.summarize(entries);
    assert.equal(counts.milestone, 4, JSON.stringify(entries.map(entry => [entry.kind, entry.text])));
    assert.equal(counts.decision, 2);
    assert.equal(counts.feedback, 1);
    assert.equal(counts.debt, 3);
    assert.equal(counts.risk, 1);
    const feedback = entries.find(entry => entry.kind === 'feedback');
    assert.match(feedback.text, /안 2 를 추가해/);
    assert.match(feedback.text, /\[REDACTED:credential\]/);
    const finished = entries.filter(entry => entry.source.id === 'PT-test-1');
    assert.equal(finished.length, 3);
    assert.ok(finished.every(entry => entry.source.type === 'transaction'));
    assert.ok(entries.every(entry => entry.feature === 'note' && entry.workItemId === item.id));
  });

  it('TC-002 a stage Design without a 결정 section records its option headings', () => {
    assert.deepEqual(ledger.extractDecisions('# D\n\n## 안 1\n별점\n\n## 안 2\n슬라이더\n', { stage: true }), ['안 1', '안 2']);
    assert.deepEqual(ledger.extractDecisions('# D\n\n## 3. 결정\n\n- a\n- b\n\n## 4. 기타\n\n- c\n'), ['a', 'b']);
    assert.deepEqual(ledger.extractDecisions('# D\n\n없음'), []);
  });
});

describe('product-note REQ-003 three generated pages', () => {
  it('TC-003 finalize renders README·roadmap·decisions and preserves the user block of roadmap.md', t => {
    const root = tempRoot(t);
    const paths = productNote.productNotePaths(root);
    fs.mkdirSync(path.dirname(paths.roadmap), { recursive: true });
    fs.writeFileSync(paths.roadmap, `# old\n\n${productNote.USER_BLOCK_START}\n내가 적은 메모\n${productNote.USER_BLOCK_END}\n`);
    idChain.approveStage(root, installStage(root, 1), { workItem: 'WI-2026-09-16-s1' });
    ledger.append(root, { workItemId: 'WI-2026-09-16-s1', feature: 'reading-log', kind: 'decision', text: 'ISBN 은 제외', why: '범위', source: { type: 'event', id: 'x' } });
    const written = productNote.writeProductNote(root, {});
    assert.equal(written.length, 3);
    const current = fs.readFileSync(paths.current, 'utf8');
    assert.match(current, /\| 1 \| \[요구사항 정의서\]\(01-requirements\.md\) \| approved \| 2 \|/);
    assert.match(current, /\| 2 \| \[기능 정의서\]\(02-features\.md\) \| 미작성 \| 0 \|/);
    const roadmap = fs.readFileSync(paths.roadmap, 'utf8');
    assert.match(roadmap, /- 2단계 기능 정의서/);
    assert.doesNotMatch(roadmap, /- 1단계 요구사항 정의서/);
    assert.match(roadmap, /내가 적은 메모/);
    assert.match(roadmap, /`\/vais 기능 정의서`/);
    const decisions = fs.readFileSync(paths.decisions, 'utf8');
    assert.match(decisions, /## 결정 \(1\)/);
    assert.match(decisions, /ISBN 은 제외 — 범위/);
  });
});

describe('product-note REQ-004 rule-based proposals', () => {
  it('TC-004 waiting-user, stale, next stage, and empty state each produce grounded proposals (≤3)', t => {
    const root = tempRoot(t);
    const empty = propose(root);
    assert.equal(empty.length, 1);
    assert.match(empty[0].command, /^\/vais 새 제품: /);

    idChain.approveStage(root, installStage(root, 1), { workItem: 'WI-2026-09-16-s1' });
    const nextStage = propose(root);
    assert.match(nextStage[0].text, /2단계 기능 정의서/);

    idChain.approveStage(root, installStage(root, 2), { workItem: 'WI-2026-09-16-s2' });
    const file = path.join(root, 'docs', 'product', '01-requirements.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('책을 제목·저자로 등록한다', '책을 제목·저자·ISBN 으로 등록한다'));
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-2026-09-16-s1b' });
    const stale = propose(root);
    assert.equal(stale[0].command, '/vais 변경 없음 확인: F-001 ← REQ-001');

    const { store, item } = newItem(root);
    writePhaseDocument(root, item, 'plan', '# Plan', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    const waiting = propose(root);
    assert.equal(waiting[0].command, '/vais plan 승인');
    assert.ok(waiting.length <= 3);
    for (let index = 0; index < 5; index += 1) ledger.append(root, { workItemId: item.id, feature: 'note', kind: 'debt', text: `부채 ${index}`, why: '', source: { type: 'event', id: 'x' } });
    assert.equal(propose(root).length, 3);
  });
});

describe('product-note REQ-005 session briefing', () => {
  it('TC-005 a new session sees the state line, last event, counts, and proposals; no state says 시작 전', t => {
    const root = tempRoot(t);
    assert.match(sessionStart.buildBriefing(root), /^\[VAIS · 활성 작업 없음\] 시작 전\. 열린 결정 0, 부채 0, stale 0\. 제안: ① \/vais 새 제품: /);
    const { store, item } = newItem(root);
    writePhaseDocument(root, item, 'plan', '# Plan', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {});
    store.apply(item.id, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['src/**'], readinessChecks: ['test'], reviewChecks: ['test'] });
    writePhaseDocument(root, item, 'design', '# Design', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    ledger.append(root, { workItemId: item.id, feature: 'note', kind: 'debt', text: '남은 부채', why: '', source: { type: 'event', id: 'x' } });
    const briefing = sessionStart.buildBriefing(root);
    assert.match(briefing, /^\[note · design · waiting-user\] 지난 세션: Design 제시 \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}\)\. 열린 결정 1, 부채 1, stale 0\. 제안: ① \/vais design 승인 ② \/vais <고칠 점> ③ \/vais 남은 부채/);
    assert.match(briefing, /첫 응답 첫 줄에 그대로 보인다/);
    fs.appendFileSync(ledger.ledgerPath(root), 'garbage\n');
    assert.match(sessionStart.buildBriefing(root), /장부에 깨진 줄 1개/);
  });
});

describe('product-note REQ-005/007 hooks as real processes', () => {
  const { execFileSync } = require('child_process');
  function runHook(script, root, input) {
    const output = execFileSync(process.execPath, [path.join(REPO, script)], {
      input: JSON.stringify({ cwd: root, ...input }), encoding: 'utf8', env: { ...process.env, VAIS_HARNESS_OFF: '' },
    });
    return output.trim();
  }

  it('TC-005 session-start.js answers the SessionStart protocol from stdin', t => {
    const root = tempRoot(t);
    const parsed = JSON.parse(runHook('hooks/session-start.js', root, { session_id: 'fresh' }));
    assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(parsed.hookSpecificOutput.additionalContext, /^\[VAIS · 활성 작업 없음\] 시작 전/);
    fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ workflowV2: { mode: 'disabled' } }));
    assert.equal(runHook('hooks/session-start.js', root, {}), '{}');
  });

  it('TC-007 workflow-v2-stop.js answers the Stop protocol from stdin', t => {
    const root = tempRoot(t);
    assert.equal(runHook('hooks/workflow-v2-stop.js', root, { session_id: 's' }), '{}');
    const { store, item } = newItem(root);
    store.setRepoSnapshot(item.id, captureRepoSnapshot(root), { reason: 'test' });
    fs.writeFileSync(path.join(root, 'stray.txt'), 'x');
    const blocked = JSON.parse(runHook('hooks/workflow-v2-stop.js', root, { session_id: 's' }));
    assert.equal(blocked.decision, 'block');
    assert.match(blocked.reason, /stray\.txt/);
    assert.equal(runHook('hooks/workflow-v2-stop.js', root, { session_id: 's', stop_hook_active: true }), '{}');
    const line = execFileSync(process.execPath, [path.join(REPO, 'scripts', 'vais-statusline.js')], { input: JSON.stringify({ cwd: root }), encoding: 'utf8' }).trim();
    assert.equal(line, 'VAIS · note · plan/active · 다음: /vais 이어서 진행');
  });
});

describe('product-note REQ-006 statusline', () => {
  it('TC-006 prints the active item, the empty state, and a non-project directory', t => {
    const root = tempRoot(t);
    assert.equal(statusLineText(null), 'VAIS · 프로젝트 아님');
    assert.match(statusLineText(root, {}), /^VAIS · 활성 작업 없음 · 다음: \/vais 새 제품: /);
    const { store, item } = newItem(root);
    writePhaseDocument(root, item, 'plan', '# Plan', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    assert.equal(statusLineText(root, {}), 'VAIS · note · plan/waiting-user · 다음: /vais plan 승인');
    assert.match(statusLineText(root, { VAIS_HARNESS_OFF: '1' }), /하네스 비활성/);
  });
});

describe('product-note REQ-007 Stop lock', () => {
  it('TC-007 allows a recorded turn, blocks a missing record or unrecorded change once, then passes with a risk line', t => {
    const root = tempRoot(t);
    const { store, item } = newItem(root);
    store.setRepoSnapshot(item.id, captureRepoSnapshot(root), { reason: 'test' });
    assert.equal(stop.stopDecision(root, { session_id: 's' }, { env: {} }).decision, 'allow');

    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'x.js'), 'x');
    const blockedB = stop.stopDecision(root, { session_id: 's' }, { env: {} });
    assert.equal(blockedB.decision, 'block');
    assert.match(blockedB.reason, /기록되지 않은 변경 1개: src\/x\.js/);
    new AuthorizationStore(root).grant({ sessionId: 's', workItemId: item.id, phase: 'plan', allowedPaths: ['src/**'], allowedCommands: [] });
    assert.equal(stop.stopDecision(root, { session_id: 's' }, { env: {} }).decision, 'allow');
    new AuthorizationStore(root).revoke('s');
    store.recordDriftAlert(item.id, ['src/x.js'], 'new-surface');
    assert.equal(stop.stopDecision(root, { session_id: 's' }, { env: {} }).decision, 'allow');

    stateStore.lockedUpdate(store.statePath, raw => {
      raw.workItems[item.id].updatedAt = new Date(Date.now() + 60_000).toISOString();
      return raw;
    });
    const blockedA = stop.stopDecision(root, { session_id: 's' }, { env: {} });
    assert.equal(blockedA.decision, 'block');
    assert.match(blockedA.reason, /사건도 장부에도 없다/);
    const second = stop.stopDecision(root, { session_id: 's', stop_hook_active: true }, { env: {} });
    assert.equal(second.decision, 'allow');
    const risk = ledger.read(root).entries.find(entry => entry.kind === 'risk');
    assert.match(risk.text, /Stop 잠금 경고/);
    assert.equal(stop.stopDecision(root, { session_id: 's' }, { env: { VAIS_HARNESS_OFF: '1' } }).decision, 'allow');
  });

  it('TC-007 a ledger-producing event without its line is a missing record', () => {
    const now = Date.now();
    const registry = { events: [{ workItemId: 'WI-2026-09-16-a', type: EVENTS.USER_PLAN_APPROVED, outcome: 'succeeded', timestamp: new Date(now).toISOString() }] };
    const item = { id: 'WI-2026-09-16-a', phase: 'design', status: 'active', updatedAt: new Date(now).toISOString() };
    assert.match(stop.missingRecord(registry, item, []), /Plan 승인/);
    const quiet = { events: [{ workItemId: 'WI-2026-09-16-a', type: EVENTS.PLAN_PRESENTED, outcome: 'succeeded', timestamp: new Date(now).toISOString() }] };
    assert.equal(stop.missingRecord(quiet, item, []), null);
  });
});

function doctorFixture(t) {
  const root = tempRoot(t);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: '3.3.0' }));
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '3.3.0' }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ metadata: { version: '3.3.0' }, plugins: [{ version: '3.3.0' }] }));
  fs.mkdirSync(path.join(root, 'hooks'));
  fs.writeFileSync(path.join(root, 'hooks', 'guard.js'), '');
  const handler = [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/guard.js' }] }];
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({
    hooks: Object.fromEntries(REQUIRED_HOOK_EVENTS.map(event => [event, handler])),
  }));
  return root;
}

describe('product-note REQ-008 doctor additions', () => {
  it('TC-008 ledger, hook-events, statusline, and chain-stale report pass, warn, and fail', t => {
    const root = doctorFixture(t);
    let byId = Object.fromEntries(runDoctor(root, { env: {}, homeDir: root }).checks.map(item => [item.id, item]));
    assert.equal(byId.ledger.verdict, 'pass');
    assert.equal(byId['hook-events'].verdict, 'pass');
    assert.equal(byId['chain-stale'].verdict, 'pass');
    assert.equal(byId.statusline.verdict, 'warn');
    assert.match(byId.statusline.fix, /vais-statusline\.js/);

    fs.mkdirSync(path.join(root, '.claude'));
    fs.writeFileSync(path.join(root, '.claude', 'settings.json'), JSON.stringify({ statusLine: { type: 'command', command: 'node /x/scripts/vais-statusline.js' } }));
    ledger.append(root, { workItemId: null, feature: null, kind: 'note', text: 'ok', why: '', source: { type: 'user', id: 'me' } });
    fs.appendFileSync(ledger.ledgerPath(root), 'broken\n');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'hooks.json'), 'utf8'));
    delete manifest.hooks.Stop;
    fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify(manifest));
    idChain.approveStage(root, installStage(root, 1), { workItem: 'WI-2026-09-16-s1' });
    idChain.approveStage(root, installStage(root, 2), { workItem: 'WI-2026-09-16-s2' });
    const file = path.join(root, 'docs', 'product', '01-requirements.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('책을 제목·저자로 등록한다', '책을 제목만으로 등록한다'));
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-2026-09-16-s1b' });

    byId = Object.fromEntries(runDoctor(root, { env: {}, homeDir: root }).checks.map(item => [item.id, item]));
    assert.equal(byId.statusline.verdict, 'pass');
    assert.equal(byId.ledger.verdict, 'fail');
    assert.match(byId.ledger.detail, /깨진 줄 1개/);
    assert.equal(byId['hook-events'].verdict, 'fail');
    assert.match(byId['hook-events'].detail, /Stop/);
    assert.equal(byId['chain-stale'].verdict, 'warn');
    assert.match(byId['chain-stale'].fix, /변경 없음 확인/);
  });
});

describe('product-note REQ-009 ledger lines in Design guidance', () => {
  it('TC-009 the design guidance carries this feature\'s feedback·preference·debt and nothing for other features', t => {
    const root = tempRoot(t);
    const item = { id: 'WI-2026-09-16-n', primaryFeature: 'note', phase: 'design', status: 'active', planRevision: 1, designRevision: 1, qaRepairCount: 0 };
    assert.deepEqual(prompt.ledgerLinesFor(root, item), []);
    for (const [kind, text] of [['debt', '부채 A'], ['debt', '부채 B'], ['preference', '버튼은 파랑'], ['milestone', '무시됨']]) {
      ledger.append(root, { workItemId: item.id, feature: 'note', kind, text, why: '', source: { type: 'event', id: 'x' } });
    }
    ledger.append(root, { workItemId: 'WI-2026-09-16-o', feature: 'other', kind: 'debt', text: '다른 feature', why: '', source: { type: 'event', id: 'x' } });
    const lines = prompt.ledgerLinesFor(root, item);
    assert.equal(lines.length, 4);
    assert.match(lines[0], /최근 3/);
    assert.ok(lines.some(line => /\[preference\] 버튼은 파랑/.test(line)));
    assert.ok(!lines.some(line => /다른 feature|무시됨/.test(line)));
    assert.match(prompt.phaseGuidance(item, 's', null, { ledgerLines: lines }).join('\n'), /\[debt\] 부채 A/);
    assert.deepEqual(prompt.ledgerLinesFor(root, { ...item, phase: 'do' }), []);
  });
});

describe('product-note REQ-010 H2 leftovers', () => {
  it('TC-010 artifact values cannot escape the artifact directory', t => {
    const root = tempRoot(t);
    const stage = getStage('stage-wireframes');
    fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
    fs.writeFileSync(path.join(root, stage.artifactDir, 'W-001.html'), '<html></html>');
    fs.writeFileSync(path.join(root, 'docs', 'product', 'outside.html'), '<html></html>');
    const doc = (value) => idChain.parseStageDocument(`---\nschema: vais-stage/v1\nstage: stage-wireframes\n---\n### W-001 ← S-001\n| 항목 | 내용 |\n|---|---|\n| 화면 | a |\n| 파일 | ${value} |\n`, stage);
    const index = { items: { 'S-001': { id: 'S-001', prefix: 'S', stage: 'stage-screens', hash: 'h', parents: [] } }, stages: {} };
    const findings = value => idChain.validateStageDocument(root, stage, doc(value), index).filter(finding => /산출물 파일이 없다/.test(finding));
    assert.equal(findings('W-001.html').length, 0);
    assert.equal(findings('../outside.html').length, 1);
    assert.equal(findings(path.join(root, stage.artifactDir, 'W-001.html')).length, 1);
    assert.equal(findings('docs/product/wireframes/../outside.html').length, 1);
  });

  it('TC-010 a parent removed and re-approved leaves its children stale and unconfirmable', t => {
    const root = tempRoot(t);
    idChain.approveStage(root, installStage(root, 1), { workItem: 'WI-2026-09-16-s1' });
    idChain.approveStage(root, installStage(root, 2), { workItem: 'WI-2026-09-16-s2' });
    const file = path.join(root, 'docs', 'product', '01-requirements.md');
    const text = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, text.slice(0, text.indexOf('### REQ-002')));
    idChain.approveStage(root, getStage('stage-requirements'), { workItem: 'WI-2026-09-16-s1b' });
    const stale = idChain.computeStale(idChain.loadChainIndex(root));
    assert.deepEqual(stale.map(entry => [entry.id, entry.parent, entry.parentMissing === true]), [['F-002', 'REQ-002', true]]);
    assert.throws(() => idChain.confirmUnchanged(root, 'F-002', 'REQ-002'), /removed from its stage/);
    assert.throws(() => idChain.assertStageEntry(root, loadChainCatalog().kinds.find(kind => kind.id === 'stage-screens')), /stale/);
  });

  it('TC-010 a stage kind Design with a scope outside docs/product is refused by the transaction itself', t => {
    const root = tempRoot(t);
    const store = new WorkItemStore(root);
    const item = store.create({ id: 'WI-2026-09-16-scope', title: 's', primaryFeature: 'reading-log', affectedFeatures: [], scale: 'compact', kind: 'stage-requirements' });
    writePhaseDocument(root, item, 'plan', '요청 확인: x\nkind: stage-requirements\n단계: 1', { status: 'waiting-user' });
    store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {});
    new AuthorizationStore(root).grant({ sessionId: 's', workItemId: item.id, phase: 'design', action: 'continue-work', allowedPaths: [], allowedCommands: [] });
    const draft = path.join(root, 'docs', 'work-items', 'reading-log', '2026-09-16-scope', '02-design', 'draft.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, '# Design\n\n## 안 1\nx\n\n## 쓰기 범위\n- src/**\n\n## readiness · review\nstage-document / stage-document\n\n## rollback\n삭제\n');
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'design', action: 'present', id: item.id, sessionId: 's', revision: 1, bodyFile: path.relative(root, draft),
      writeScopes: ['src/**'], readinessChecks: ['stage-document'], reviewChecks: ['stage-document'],
    }), /must stay under docs\/product\//);
    assert.equal(store.get(item.id).writeScopes.length, 0);
  });
});

describe('product-note REQ-012 documents and versions', () => {
  it('TC-012 version 3.3.0 everywhere, CHANGELOG, roadmap H2 done, five hook events registered', () => {
    const versions = versionFiles(REPO);
    assert.deepEqual([...new Set(Object.values(versions))], ['3.3.0'], JSON.stringify(versions));
    assert.ok(fs.readFileSync(path.join(REPO, 'README.md'), 'utf8').includes('version-3.3.0-blue'));
    assert.ok(fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8').includes('## [3.3.0]'));
    const roadmap = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'roadmap.md'), 'utf8');
    assert.match(roadmap, /\| H2 \| 완료 \|/);
    assert.match(roadmap, /\| H3 \| (진행 중|완료) \|/);
    const hooks = JSON.parse(fs.readFileSync(path.join(REPO, 'hooks', 'hooks.json'), 'utf8')).hooks;
    for (const event of REQUIRED_HOOK_EVENTS) assert.ok(Array.isArray(hooks[event]) && hooks[event].length > 0, event);
    const design = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'design.md'), 'utf8');
    assert.match(design, /\| 장부 \|[^\n]*\| 완료 \(H3\) \|/);
  });
});
