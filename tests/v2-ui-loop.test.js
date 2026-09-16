'use strict';

// ui-loop (roadmap H4) REQ-001~010, REQ-012. Scene C (REQ-011) lives in tests/regression/.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createInitialWorkItem, transition, EVENTS, SCREEN_REVISION_LIMIT_REASON, hasScreenCheck } = require('../lib/workflow/v2/state-machine');
const { routePrompt } = require('../lib/workflow/v2/router');
const { requiredSectionsFor, optionCountFindings, optionScreenshotFindings, inspectPhaseDocument } = require('../lib/workflow/v2/phase-check');
const screen = require('../lib/workflow/v2/screen-capture');
const diff = require('../lib/workflow/v2/diff-summary');
const reviewPage = require('../lib/workflow/v2/review-page');
const ledger = require('../lib/workflow/v2/ledger');
const idChain = require('../lib/workflow/v2/id-chain');
const { getStage, loadChainCatalog, getKind } = require('../lib/workflow/v2/chain-registry');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { writePhaseDocument } = require('../lib/workflow/v2/document-manager');
const { runDoctor, versionFiles, REQUIRED_HOOK_EVENTS } = require('../lib/workflow/v2/doctor');
const { screensCapture } = require('../scripts/vais-workflow-v2');
const { validateContract } = require('../lib/workflow/v2/contracts');
const prompt = require('../hooks/workflow-v2-prompt');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures');
const STUB = { renderer: 'stub' };

function tempRoot(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-ui-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.4.0', workflowV2: { mode: 'enforce' }, ...extra }));
  return root;
}

function gate(name, verdict, checks = ['test']) {
  return {
    gateResult: {
      gate: name, verdict, requiredChecks: checks,
      passed: ['PASS', 'READY'].includes(verdict) ? checks : [], failed: ['FAIL', 'NOT_READY'].includes(verdict) ? checks : [],
      blocked: [], missing: [], evaluatedAt: '2026-09-16T00:00:00.000Z',
    },
  };
}

function uiItem(overrides = {}) {
  return createInitialWorkItem({ id: 'WI-2026-09-16-ui', title: '버튼 손보기', primaryFeature: 'booking-ui', affectedFeatures: [], scale: 'standard', kind: 'ui', ...overrides });
}

function approvedUi() {
  let state = uiItem();
  state = transition(state, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
  state = transition(state, EVENTS.USER_PLAN_APPROVED);
  state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['app/**'], readinessChecks: ['screen-capture'], reviewChecks: ['screen-capture'] });
  state = transition(state, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
  state = transition(state, EVENTS.USER_OPTION_CHOSEN, { option: 2 });
  state = transition(state, EVENTS.USER_DESIGN_APPROVED);
  return state;
}

describe('ui-loop REQ-001 ui kind templates', () => {
  it('TC-001 ui uses a one-line Plan and an options-screens Design; screenshots are mandatory', t => {
    const kind = getKind('ui');
    assert.equal(kind.planTemplate, 'one-line');
    assert.equal(kind.designTemplate, 'options-screens');
    assert.equal(kind.screenCheck, true);
    const item = uiItem();
    assert.deepEqual(requiredSectionsFor(item, 'plan').map(([name]) => name), ['request-confirm', 'kind', 'stage-or-target']);
    assert.deepEqual(requiredSectionsFor(item, 'design').map(([name]) => name), ['options', 'screenshots', 'checklist', 'write-scope', 'readiness-review', 'rollback']);
    assert.equal(optionCountFindings({ ...item, scale: 'extended' }, 'design', '## 안 1\n## 안 2\n## 안 3\n## 안 4\n').length, 1);
    assert.deepEqual(optionCountFindings(createInitialWorkItem({ id: 'WI-2026-09-16-h', title: 'h', primaryFeature: 'h', scale: 'compact', kind: 'harness' }), 'design', '## 안 1\n## 안 2'), []);

    const root = tempRoot(t);
    const optionDir = path.join(root, 'docs', 'work-items', 'booking-ui', '2026-09-16-ui', '02-design', 'options', '1');
    fs.mkdirSync(optionDir, { recursive: true });
    const body = (withPng) => `# Design\n\n## 안 1\n사본: docs/work-items/booking-ui/2026-09-16-ui/02-design/options/1\n데스크톱: docs/work-items/booking-ui/2026-09-16-ui/02-design/options/1/desktop.png\n모바일: docs/work-items/booking-ui/2026-09-16-ui/02-design/options/1/mobile.png\n${withPng ? '' : ''}\n## 검수표\n- 버튼이 보인다\n\n## 쓰기 범위\n- app/**\n\n## readiness · review\nscreen-capture / screen-capture\n\n## rollback\ngit checkout\n`;
    assert.ok(optionScreenshotFindings(root, item, 'design', body(false)).some(finding => /데스크톱 파일이 없다/.test(finding)));
    fs.writeFileSync(path.join(optionDir, 'desktop.png'), screen.STUB_PNG);
    fs.writeFileSync(path.join(optionDir, 'mobile.png'), screen.STUB_PNG);
    assert.deepEqual(optionScreenshotFindings(root, item, 'design', body(true)), []);
    assert.ok(optionScreenshotFindings(root, item, 'design', '## 안 1\n데스크톱: /etc/passwd\n모바일: x.png\n').some(finding => /Work item 폴더 안/.test(finding)));
    writePhaseDocument(root, item, 'plan', '요청 확인: 버튼이 안 보인다\nkind: ui\n대상 화면: 로그인\n', { status: 'draft' });
    assert.equal(inspectPhaseDocument(root, item, 'plan').verdict, 'pass');
    writePhaseDocument(root, item, 'plan', '# Plan\n\n## 문제\nx\n## 목표\ny\n', { status: 'draft' });
    assert.equal(inspectPhaseDocument(root, item, 'plan').verdict, 'fail');
  });
});

describe('ui-loop REQ-002/005 screens capture CLI and renderer', () => {
  it('TC-002 screens capture stays inside the phase folder and the project', t => {
    const root = tempRoot(t);
    const store = new WorkItemStore(root);
    const item = store.create({ id: 'WI-2026-09-16-cap', title: 'c', primaryFeature: 'cap', affectedFeatures: [], scale: 'compact', kind: 'ui' });
    new AuthorizationStore(root).grant({ sessionId: 's', workItemId: item.id, phase: 'plan', allowedPaths: [], allowedCommands: [] });
    fs.mkdirSync(path.join(root, 'app'));
    fs.writeFileSync(path.join(root, 'app', 'index.html'), '<h1>hi</h1>');
    process.env.VAIS_SCREEN_RENDERER = 'stub';
    t.after(() => { delete process.env.VAIS_SCREEN_RENDERER; });
    const ok = screensCapture(root, { id: item.id, session: 's', target: 'app/index.html', out: 'docs/work-items/cap/2026-09-16-cap/01-plan/shots' });
    assert.equal(ok.renderer, 'stub');
    assert.ok(fs.existsSync(path.join(root, ok.files.desktop)));
    assert.throws(() => screensCapture(root, { id: item.id, session: 's', target: 'app/index.html', out: 'app/shots' }), /inside the current phase folder/);
    assert.throws(() => screensCapture(root, { id: item.id, session: 's', target: '/etc/hosts', out: 'docs/work-items/cap/2026-09-16-cap/01-plan/x' }), /project file or an http/);
    assert.throws(() => screensCapture(root, { id: item.id, session: 'other', target: 'app/index.html', out: 'docs/work-items/cap/2026-09-16-cap/01-plan/x' }), /authorization/);
  });

  it('TC-005 findChrome honours VAIS_CHROME, the stub writes two PNGs, and a missing Chrome fails loudly', t => {
    const root = tempRoot(t);
    const fake = path.join(root, 'chrome');
    fs.writeFileSync(fake, '');
    assert.equal(screen.findChrome({ VAIS_CHROME: fake }), fake);
    assert.equal(screen.findChrome({ VAIS_CHROME: path.join(root, 'missing') }), null);
    fs.writeFileSync(path.join(root, 'page.html'), '<p>x</p>');
    const result = screen.capture(path.join(root, 'page.html'), path.join(root, 'out'), STUB);
    assert.equal(result.renderer, 'stub');
    assert.deepEqual(Object.keys(result.files).sort(), ['desktop', 'mobile']);
    assert.equal(fs.readFileSync(result.files.desktop).subarray(1, 4).toString(), 'PNG');
    assert.throws(() => screen.capture(path.join(root, 'page.html'), path.join(root, 'out2'), { env: { VAIS_CHROME: path.join(root, 'missing') } }), /CHROME_NOT_FOUND|Chrome 을 찾지 못해/);
    assert.throws(() => screen.capture(path.join(root, 'nope.html'), path.join(root, 'out3'), STUB), /대상 파일이 없다/);
  });

  it('TC-005 real Chrome renders the fixture app (skipped when Chrome is absent)', { skip: !screen.findChrome() && 'Chrome not installed' }, t => {
    const root = tempRoot(t);
    const result = screen.capture(path.join(FIXTURES, 'mini-booking', 'index.html'), path.join(root, 'real'), { renderer: 'chrome' });
    assert.equal(result.renderer, 'chrome');
    for (const file of Object.values(result.files)) {
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.ok(bytes.length > 2000, `${path.basename(file)} is only ${bytes.length} bytes`);
    }
  });
});

describe('ui-loop REQ-003/004 screen check state machine and router', () => {
  it('TC-003 ui READY stops at do/waiting-user; confirm → review, revise → design → checkpoint → do; other kinds unchanged', () => {
    let state = approvedUi();
    assert.equal(hasScreenCheck(state), true);
    state = transition(state, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    assert.equal(`${state.phase}/${state.status}`, 'do/waiting-user');
    const confirmed = transition(state, EVENTS.USER_SCREEN_CONFIRMED);
    assert.equal(`${confirmed.phase}/${confirmed.status}`, 'review/active');
    let revised = transition(state, EVENTS.USER_SCREEN_REVISED, { reason: '더 크게' });
    assert.equal(`${revised.phase}/${revised.status}`, 'design/active');
    assert.equal(revised.screenRevisionCount, 1);
    assert.equal(revised.approvals.design, 'approved');
    revised = transition(revised, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false });
    assert.equal(`${revised.phase}/${revised.status}`, 'do/active');
    const harness = createInitialWorkItem({ id: 'WI-2026-09-16-h', title: 'h', primaryFeature: 'h', scale: 'compact', kind: 'harness' });
    let plain = transition(harness, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    plain = transition(plain, EVENTS.USER_PLAN_APPROVED);
    plain = transition(plain, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['lib/**'], readinessChecks: ['test'], reviewChecks: ['test'] });
    plain = transition(plain, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    plain = transition(plain, EVENTS.USER_DESIGN_APPROVED);
    plain = transition(plain, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    assert.equal(`${plain.phase}/${plain.status}`, 'review/active');
    assert.throws(() => transition(plain, EVENTS.USER_SCREEN_CONFIRMED), /not allowed/);
  });

  it('TC-003 an options-screens Design cannot be approved before an option is chosen', () => {
    let state = uiItem();
    state = transition(state, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS'));
    state = transition(state, EVENTS.USER_PLAN_APPROVED);
    state = transition(state, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['app/**'], readinessChecks: ['screen-capture'], reviewChecks: ['screen-capture'] });
    state = transition(state, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS'));
    assert.throws(() => transition(state, EVENTS.USER_DESIGN_APPROVED), /안 번호를 먼저/);
    assert.throws(() => transition(state, EVENTS.USER_OPTION_CHOSEN, { option: 0 }), /between 1 and 9/);
    const chosen = transition(state, EVENTS.USER_OPTION_CHOSEN, { option: 1 });
    assert.equal(chosen.chosenOption, 1);
    assert.equal(validateContract('workItem', transition(chosen, EVENTS.USER_DESIGN_APPROVED)).valid, true);
  });

  it('TC-003 the router maps N번, 확인, and revision sentences at the right states', () => {
    const design = { phase: 'design', status: 'waiting-user', planRevision: 1, designRevision: 1 };
    const choice = routePrompt('/vais 2번', design);
    assert.equal(choice.action, 'choose-option');
    assert.equal(choice.option, 2);
    assert.equal(routePrompt('/vais 안 1번으로', design).option, 1);
    assert.equal(routePrompt('/vais design 승인', design).action, 'approve-design');
    const screenCheck = { phase: 'do', status: 'waiting-user' };
    assert.equal(routePrompt('/vais 확인', screenCheck).action, 'screen-confirm');
    assert.equal(routePrompt('/vais 됐다', screenCheck).action, 'screen-confirm');
    const revise = routePrompt('/vais 버튼을 더 크게, 색은 파랑', screenCheck);
    assert.equal(revise.action, 'screen-revise');
    assert.equal(revise.text, '버튼을 더 크게, 색은 파랑');
    assert.equal(routePrompt('/vais 좋아', screenCheck).action, 'ambiguous-response');
    assert.equal(routePrompt('/vais 새 작업: 결제 화면', screenCheck).action, 'queue-pending');
    assert.equal(routePrompt('/vais 확인', { phase: 'do', status: 'blocked' }).action, 'screen-confirm');
    assert.equal(routePrompt('/vais 확인', { phase: 'review', status: 'waiting-user' }).action, 'clarify-final');
  });

  it('TC-004 the sixth revision blocks with screen-revision-limit; confirm is still allowed from there', () => {
    let state = approvedUi();
    let lastRevised = null;
    for (let round = 1; round <= 5; round += 1) {
      state = transition(state, EVENTS.READINESS_READY, gate('readiness', 'READY'));
      state = transition(state, EVENTS.USER_SCREEN_REVISED, { reason: `수정 ${round}` });
      assert.equal(state.screenRevisionCount, round);
      lastRevised = state;
      state = transition(state, EVENTS.DESIGN_CHECKPOINT_COMPLETED, { material: false });
    }
    state = transition(state, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    const blocked = transition(state, EVENTS.USER_SCREEN_REVISED, { reason: '여섯 번째' });
    assert.equal(`${blocked.phase}/${blocked.status}`, 'do/blocked');
    assert.equal(blocked.blockReason, SCREEN_REVISION_LIMIT_REASON);
    assert.equal(blocked.screenRevisionCount, 5);
    assert.equal(validateContract('workItem', blocked).valid, true);
    const confirmed = transition(blocked, EVENTS.USER_SCREEN_CONFIRMED);
    assert.equal(`${confirmed.phase}/${confirmed.status}`, 'review/active');
    assert.throws(() => transition(blocked, EVENTS.USER_SCREEN_REVISED, { reason: 'x' }), /not allowed/);

    // The hook tells the user the truth about the limit and shows the block reason on the status line.
    const revise = { managed: true, action: 'screen-revise', mutationAllowed: true, text: '여섯 번째' };
    const blockedContext = prompt.buildContext(revise, blocked, null, 's');
    assert.match(blockedContext, /^\[booking-ui · do · blocked: screen-revision-limit\]/);
    assert.match(blockedContext, /상한 5회에 도달/);
    assert.match(blockedContext, /`\/vais 확인`/);
    assert.match(blockedContext, /`\/vais cancel`/);
    assert.doesNotMatch(blockedContext, /취향으로 기록됐고/);
    const revisedContext = prompt.buildContext(revise, lastRevised, null, 's');
    assert.match(revisedContext, /수정 회차 5/);
    assert.match(revisedContext, /남은 수정 기회 0회/);
  });
});

describe('ui-loop REQ-006/007 review page and diff summary', () => {
  it('TC-007 CSS declarations are compared one by one and everything else is only named', t => {
    const root = tempRoot(t);
    const before = path.join(root, 'a');
    const after = path.join(root, 'b');
    for (const dir of [before, after]) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(before, 'styles.css'), '.primary { padding: 15px 20px; background: var(--ink); }\n@media (max-width: 720px) { .panel { padding: 26px 22px; } }');
    fs.writeFileSync(path.join(after, 'styles.css'), '.primary { padding: 18px 26px; background: var(--ink); border-radius: 8px; }\n@media (max-width: 720px) { .panel { padding: 26px 22px; } }');
    fs.writeFileSync(path.join(before, 'index.html'), '<a>x</a>');
    fs.writeFileSync(path.join(after, 'index.html'), '<a>y</a>');
    fs.writeFileSync(path.join(after, 'app.js'), 'new');
    const result = diff.summarizeChanges(before, after);
    assert.deepEqual(result.lines, [
      '추가: app.js',
      '변경: index.html',
      'styles.css · .primary padding: 15px 20px → 18px 26px',
      'styles.css · .primary border-radius: (없음) → 8px',
    ]);
    assert.match(result.summary, /^4건 변경/);
    assert.equal(diff.summarizeChanges(before, before).summary, '변경 없음');
    assert.match(diff.renderDiffMarkdown(2, result), /# 회차 2 변경 요약/);
    assert.equal(diff.parseCss('a { color: red } @media (x) { a { color: blue } }').get('@media (x) a color'), 'blue');
  });

  it('TC-006 the review page shows option, before, after, checklist, and per-round diffs', t => {
    const root = tempRoot(t);
    const item = { ...uiItem(), chosenOption: 2, screenRevisionCount: 1 };
    const base = path.join(root, 'docs', 'work-items', 'booking-ui', '2026-09-16-ui');
    for (const dir of ['02-design/options/2', '03-do/evidence/screens/round-0', '03-do/evidence/screens/round-1']) {
      fs.mkdirSync(path.join(base, dir), { recursive: true });
      fs.writeFileSync(path.join(base, dir, 'desktop.png'), screen.STUB_PNG);
      fs.writeFileSync(path.join(base, dir, 'mobile.png'), screen.STUB_PNG);
    }
    fs.writeFileSync(path.join(base, '03-do', 'evidence', 'screens', 'round-1', 'diff.md'), '# 회차 1\n- styles.css · .primary padding: a → b\n');
    writePhaseDocument(root, item, 'design', '# Design\n\n## 안 2\n사본: x\n\n## 검수표\n- 버튼이 3배 커야 한다\n- 색이 파랑이다\n\n## 쓰기 범위\napp/**\n', { status: 'approved' });
    const page = reviewPage.writeReviewPage(root, item);
    assert.ok(fs.existsSync(page.path));
    const html = fs.readFileSync(page.path, 'utf8');
    assert.match(html, /선택한 안: 안 2/);
    assert.match(html, /전 \(작업 전\)/);
    assert.match(html, /후 \(회차 1\)/);
    assert.match(html, /버튼이 3배 커야 한다/);
    assert.match(html, /\.primary padding: a → b/);
    assert.match(html, /src="\.\.\/\.\.\/03-do\/evidence\/screens\/round-1\/desktop\.png"/);
    assert.deepEqual(reviewPage.extractChecklist('## 검수표\n| # | 항목 |\n|---|---|\n| 1 | a |\n| 2 | b |\n## 기타\n- c'), ['1 · a', '2 · b']);
  });
});

describe('ui-loop REQ-008 taste ledger', () => {
  it('TC-008 revisions, the chosen option, and the final approval leave preference and decision lines; ui Designs see product-wide taste', t => {
    const root = tempRoot(t);
    let state = approvedUi();
    const chosen = ledger.entriesForTransition(root, { previous: { ...state, chosenOption: null }, next: state, event: EVENTS.USER_OPTION_CHOSEN, payload: { option: 2 } });
    assert.deepEqual(chosen.map(entry => [entry.kind, entry.text]), [['decision', '안 2 선택 — 버튼 손보기']]);
    state = transition(state, EVENTS.READINESS_READY, gate('readiness', 'READY'));
    const revised = transition(state, EVENTS.USER_SCREEN_REVISED, { reason: '/vais 더 크게' });
    const taste = ledger.entriesForTransition(root, { previous: state, next: revised, event: EVENTS.USER_SCREEN_REVISED, payload: { reason: '/vais 더 크게' } });
    assert.deepEqual(taste.map(entry => [entry.kind, entry.text]), [['preference', '/vais 더 크게']]);
    assert.match(taste[0].why, /1회차/);
    const review = { ...state, phase: 'review', status: 'waiting-user' };
    const final = ledger.entriesForTransition(root, { previous: review, next: { ...review, phase: 'report', status: 'active' }, event: EVENTS.USER_FINAL_APPROVED, payload: {} });
    assert.deepEqual(final.map(entry => entry.kind), ['milestone', 'preference']);
    assert.match(final[1].text, /채택: 안 2/);

    ledger.append(root, { workItemId: 'WI-2026-09-16-other', feature: 'other-screen', kind: 'preference', text: '버튼은 파랑', why: '', source: { type: 'event', id: 'x' } });
    const uiDesign = { id: 'WI-2026-09-16-ui', primaryFeature: 'booking-ui', kind: 'ui', phase: 'design', status: 'active', planRevision: 1, designRevision: 1, qaRepairCount: 0 };
    assert.ok(prompt.ledgerLinesFor(root, uiDesign).some(line => /\[preference\] 버튼은 파랑/.test(line)));
    const harnessDesign = { ...uiDesign, kind: 'harness' };
    assert.deepEqual(prompt.ledgerLinesFor(root, harnessDesign), []);
    assert.match(prompt.uiPhaseLines(uiDesign, getKind('ui'), 's').design.join('\n'), /screens capture/);
  });
});

describe('ui-loop REQ-009 stage artifact rendering', () => {
  it('TC-009 wireframe html and mockup svg are rendered to PNG at the stage check; a render failure is a finding', t => {
    const root = tempRoot(t);
    const stages = loadChainCatalog().stages;
    for (const order of [1, 2, 3, 4]) {
      const stage = stages.find(entry => entry.order === order);
      fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
      fs.copyFileSync(path.join(FIXTURES, 'product-stages', path.basename(stage.file)), path.join(root, stage.file));
      if (stage.artifactDir) {
        fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
        for (const name of fs.readdirSync(path.join(FIXTURES, 'product-stages', path.basename(stage.artifactDir)))) {
          fs.copyFileSync(path.join(FIXTURES, 'product-stages', path.basename(stage.artifactDir), name), path.join(root, stage.artifactDir, name));
        }
      }
      if (order < 4) idChain.approveStage(root, stage, { workItem: `WI-2026-09-16-s${order}` });
    }
    const wireframes = createInitialWorkItem({ id: 'WI-2026-09-16-w', title: 'w', primaryFeature: 'w', scale: 'compact', kind: 'stage-wireframes' });
    assert.equal(getStage('stage-wireframes').renderArtifacts, true);
    const result = idChain.stageDocumentCheck(root, wireframes, STUB);
    assert.equal(result.verdict, 'pass', result.findings.join('; '));
    assert.ok(fs.existsSync(path.join(root, 'docs', 'product', 'wireframes', 'W-001.png')));
    assert.match(result.summary, /PNG 렌더 \(stub\)/);
    const failing = idChain.stageDocumentCheck(root, wireframes, { env: { VAIS_CHROME: path.join(root, 'missing') } });
    assert.equal(failing.verdict, 'fail');
    assert.ok(failing.findings.some(finding => /산출물 렌더 실패/.test(finding)));
    assert.equal(idChain.renderStageArtifacts(root, getStage('stage-requirements'), { items: [] }).rendered.length, 0);
  });
});

function doctorFixture(t, extra = {}) {
  const root = tempRoot(t, extra);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x', version: '3.4.0' }));
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '3.4.0' }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ metadata: { version: '3.4.0' }, plugins: [{ version: '3.4.0' }] }));
  fs.mkdirSync(path.join(root, 'hooks'));
  fs.writeFileSync(path.join(root, 'hooks', 'guard.js'), '');
  const handler = [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/guard.js' }] }];
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({ hooks: Object.fromEntries(REQUIRED_HOOK_EVENTS.map(event => [event, handler])) }));
  return root;
}

describe('ui-loop REQ-010 doctor', () => {
  it('TC-010 browser reports Chrome or warns; statusline accepts project settings', t => {
    const root = doctorFixture(t);
    const fake = path.join(root, 'chrome');
    fs.writeFileSync(fake, '');
    let byId = Object.fromEntries(runDoctor(root, { env: { VAIS_CHROME: fake }, homeDir: root }).checks.map(item => [item.id, item]));
    assert.equal(byId.browser.verdict, 'pass');
    assert.equal(byId.statusline.verdict, 'warn');
    byId = Object.fromEntries(runDoctor(root, { env: { VAIS_CHROME: path.join(root, 'missing') }, homeDir: root }).checks.map(item => [item.id, item]));
    assert.equal(byId.browser.verdict, 'warn');
    assert.match(byId.browser.fix, /VAIS_CHROME/);
    fs.mkdirSync(path.join(root, '.claude'));
    fs.writeFileSync(path.join(root, '.claude', 'settings.json'), JSON.stringify({ statusLine: { type: 'command', command: 'node /x/scripts/vais-statusline.js' } }));
    byId = Object.fromEntries(runDoctor(root, { env: {}, homeDir: root }).checks.map(item => [item.id, item]));
    assert.equal(byId.statusline.verdict, 'pass');
    assert.match(byId.statusline.detail, /\.claude\/settings\.json/);
  });
});

describe('ui-loop REQ-012 documents and versions', () => {
  it('TC-012 version 3.4.0 everywhere, CHANGELOG, roadmap H3 done and H4 in progress, design.md rows done', () => {
    const versions = versionFiles(REPO);
    assert.deepEqual([...new Set(Object.values(versions))], ['3.4.0'], JSON.stringify(versions));
    assert.ok(fs.readFileSync(path.join(REPO, 'README.md'), 'utf8').includes('version-3.4.0-blue'));
    assert.ok(fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8').includes('## [3.4.0]'));
    const roadmap = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'roadmap.md'), 'utf8');
    assert.match(roadmap, /\| H3 \| 완료 \|/);
    assert.match(roadmap, /\| H4 \| (진행 중|완료) \|/);
    const design = fs.readFileSync(path.join(REPO, 'docs', 'harness', 'design.md'), 'utf8');
    for (const pattern of [/\| 화면 확인 정지점[^\n]*\| 완료 \(H4\) \|/, /screen-capture\.js[^\n]*\| 완료 \(H4\) \|/, /review-page\.js[^\n]*\| 완료 \(H4\) \|/, /diff-summary\.js[^\n]*\| 완료 \(H4\) \|/]) {
      assert.match(design, pattern);
    }
    assert.ok(JSON.parse(fs.readFileSync(path.join(REPO, 'vais.config.json'), 'utf8')).ui);
  });
});
