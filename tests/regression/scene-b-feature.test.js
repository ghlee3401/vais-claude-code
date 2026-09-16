'use strict';

// Regression scene B (docs/harness/design.md §11): "책을 제목으로 검색하고 싶어요". A feature Work
// item on an approved ten-stage chain: one-line Plan, a Design that cites F-001·S-001 and declares
// F-003·API-003·TC-003, Do that edits the app, `do ready` that appends the new items to the
// canonical files and photographs the screen through the running app, independent QA on exactly
// the cited and declared TCs, and a Report that stamps 구현됨.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../../lib/workflow/v2/authorization-store');
const { routePrompt } = require('../../lib/workflow/v2/router');
const { recordAutomaticHandoff } = require('../../lib/workflow/v2/automatic-handoff');
const { loadChainCatalog, suggestKind } = require('../../lib/workflow/v2/chain-registry');
const idChain = require('../../lib/workflow/v2/id-chain');
const ledger = require('../../lib/workflow/v2/ledger');
const prompt = require('../../hooks/workflow-v2-prompt');

const FIXTURES = path.join(__dirname, '..', 'fixtures', 'product-stages');
const MINI_BOOKING = path.join(__dirname, '..', 'fixtures', 'mini-booking');
const STATIC_SERVER = path.join(__dirname, '..', 'fixtures', 'static-server.js');
const PORT = '4181';
const FEATURE = 'book-search';
const QA_PASS = {
  schema: 'specialist-handoff/v1', status: 'completed', verdict: 'pass', judgment: 'TC-001·TC-003 기대 결과와 실제 화면이 일치',
  decisions: ['검수표 2줄 통과'], behavior: { inputs: ['round-1/desktop.png'], outputs: ['pass'], errors: [] },
  evidence: ['03-do/evidence/screens/round-1/desktop.png'], affectedRequirements: ['REQ-001'], risks: [], unverified: [], recommendedChecks: [],
};

process.env.VAIS_SCREEN_RENDERER = process.env.VAIS_SCREEN_RENDERER || 'stub';

function makeRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-scene-b-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({
    version: '3.6.0', workflowV2: { mode: 'enforce' },
    ui: { appRoot: 'app', entry: 'index.html', run: { command: [process.execPath, STATIC_SERVER, 'app', PORT], url: `http://127.0.0.1:${PORT}/index.html`, readyTimeoutMs: 10000 } },
  }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'reading-log', version: '0.0.1' }));
  fs.mkdirSync(path.join(root, 'app'));
  for (const name of fs.readdirSync(MINI_BOOKING)) fs.copyFileSync(path.join(MINI_BOOKING, name), path.join(root, 'app', name));
  for (const stage of loadChainCatalog().stages) {
    fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), path.join(root, stage.file));
    if (stage.artifactDir && fs.existsSync(path.join(FIXTURES, path.basename(stage.artifactDir)))) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(path.join(FIXTURES, path.basename(stage.artifactDir)))) fs.copyFileSync(path.join(FIXTURES, path.basename(stage.artifactDir), name), path.join(root, stage.artifactDir, name));
    }
    idChain.approveStage(root, stage, { workItem: `WI-2026-09-16-s${stage.order}` });
  }
  return root;
}

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return relative;
}

function grant(root, session, item, phase, action = 'continue-work', extra = {}) {
  new AuthorizationStore(root).grant({ sessionId: session, workItemId: item?.id || null, phase, action, allowedPaths: [], allowedCommands: [], ...extra });
}

function userSays(root, store, item, session, sentence) {
  return prompt.applyDeterministicRoute(store, item, routePrompt(sentence, item), session);
}

function table(rows) {
  return ['| 항목 | 내용 |', '|---|---|', ...Object.entries(rows).map(([field, value]) => `| ${field} | ${value} |`)].join('\n');
}

function designBody(options = {}) {
  return [
    '# Design — 책 검색', '',
    '## 안 1', '목록 위에 검색창 하나. 입력할 때마다 목록을 줄인다.', '',
    '## 안 2', '검색 버튼을 누를 때만 거른다.', '',
    '## 인용', options.cited ?? 'REQ-001, F-001, S-001, TC-001', '',
    '## 신규',
    `### ${options.featureId ?? 'F-003'} ← REQ-001`, table({ 동작: '제목으로 책을 검색한다', 입력: '검색어', 출력: '일치하는 책 목록', 오류: '검색어가 비면 전체 목록', 규칙: '대소문자 무시' }),
    `### API-003 ← S-001, ${options.featureId ?? 'F-003'}`, table({ 요청: 'GET /books?q=데미안', 응답: '200 [{id, title, author}]', 오류: '400 검색어 200자 초과', '쉬운 말 설명': '제목으로 책을 찾아 돌려준다' }),
    `### TC-003 ← ${options.featureId ?? 'F-003'}`, table({ '검수 절차': '검색창에 "데미안" 을 입력한다', '기대 결과': '데미안만 목록에 남는다' }), '',
    '## 검수표', '- 검색어를 넣으면 목록이 줄어든다', '- 빈 검색어면 전체 목록이 돌아온다', '',
    '## 쓰기 범위', '- app/**', '',
    '## readiness · review', 'implementation-document / implementation-document', '',
    '## rollback', 'git checkout app/', '',
  ].join('\n');
}

describe('scene B — "책을 제목으로 검색하고 싶어요": a feature on an approved chain', () => {
  it('cites approved ids, declares new ones, appends them at do ready, photographs through the app, stamps 구현됨', t => {
    const root = makeRoot(t);
    const store = new WorkItemStore(root);
    const session = 'scene-b';
    assert.equal(suggestKind('/vais 새 기능: 책을 제목으로 검색하고 싶어요').kind, 'feature');

    // Plan: three lines, the third naming the related ids.
    grant(root, session, null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: 책을 제목으로 검색한다.\nkind: feature\n관련 ID: F-001, S-001\n');
    const plan = execute(['plan', 'present', '--slug', FEATURE, '--title', '책 검색', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'standard', '--kind', 'feature', '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(plan.verdict, 'PASS');
    let item = store.get(plan.workItemId);
    item = userSays(root, store, item, session, '/vais plan 승인');
    assert.equal(item.phase, 'design');
    const work = `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}`;

    // Design: an unknown citation and a wrong number are refused before anything is written.
    grant(root, session, item, 'design');
    const present = body => execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', write(root, `${work}/02-design/draft.md`, body),
      '--scope', 'app/**', '--readiness-check', 'implementation-document', '--review-check', 'implementation-document'], root);
    assert.throws(() => present(designBody({ cited: 'REQ-001, F-001, S-009, TC-001' })), /S-009 는 승인된 항목이 아니다/);
    assert.throws(() => present(designBody({ featureId: 'F-007' })), /F-007: 다음 빈 번호는 F-003/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'docs/product/02-features.md'), 'utf8'), /F-003|F-007/);
    assert.equal(present(designBody()).verdict, 'PASS');
    item = store.get(item.id);
    assert.equal(`${item.phase}/${item.status}`, 'design/waiting-user');
    item = userSays(root, store, item, session, '/vais design 승인');
    assert.equal(`${item.phase}/${item.status}`, 'do/active');
    assert.deepEqual(item.writeScopes, ['app/**']);

    // Do: the app changes inside the write scope; `do ready` appends the declared items and photographs.
    grant(root, session, item, 'do');
    const index = path.join(root, 'app', 'index.html');
    fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace('<body>', '<body>\n<input id="search" placeholder="제목으로 검색">'));
    const doDraft = write(root, `${work}/03-do/draft.md`, '# Do\n\n## 변경\napp/index.html 에 검색창, app/app.js 에 필터.\n\n## 증거\nimplementation-document, screen-capture round-1.\n');
    const ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
    assert.equal(ready.verdict, 'READY', JSON.stringify(ready.checks || ready));
    item = store.get(item.id);
    assert.equal(`${item.phase}/${item.status}`, 'review/active');
    assert.match(fs.readFileSync(path.join(root, 'docs/product/02-features.md'), 'utf8'), /### F-003 ← REQ-001\n\| 항목 \| 내용 \|/);
    assert.match(fs.readFileSync(path.join(root, 'docs/product/08-api.md'), 'utf8'), /### API-003 ← S-001, F-003/);
    assert.match(fs.readFileSync(path.join(root, 'docs/product/10-test-plan.md'), 'utf8'), /### TC-003 ← F-003/);
    let chain = idChain.loadChainIndex(root);
    assert.equal(chain.items['F-003'].status, 'draft');
    assert.equal(chain.items['API-003'].workItem, item.id);
    for (const file of ['round-1/desktop.png', 'round-1/mobile.png']) assert.ok(fs.existsSync(path.join(root, work, '03-do', 'evidence', 'screens', file)), file);
    const capture = JSON.parse(fs.readFileSync(path.join(root, work, '03-do', 'evidence', 'screen-capture.json'), 'utf8'));
    assert.equal(capture.verdict, 'pass');
    assert.match(capture.summary, /회차 1 화면 2장/);
    assert.ok(capture.evidence.some(file => file.endsWith('round-1/desktop.png')));

    // Review: the TC set must equal the Design's cited + declared TCs; QA judges the checklist.
    grant(root, session, item, 'review');
    execute(['review', 'prepare', '--id', item.id, '--session', session, '--revision', '1'], root);
    const assignment = execute(['assignment', '--id', item.id, '--session', session, '--role', 'independent-qa', '--delegated-by', 'ceo',
      '--phase', 'review', '--mode', 'verification', '--question', 'TC-001·TC-003 검사', '--code-write', 'false',
      '--criterion', '검색어를 넣으면 목록이 줄어든다', '--criterion', '빈 검색어면 전체 목록이 돌아온다', '--criterion', 'TC-001', '--criterion', 'TC-003',
      '--ref', `${work}/03-do/evidence/screens/round-1/desktop.png`, '--clean-room', 'true'], root);
    store.recordAssignmentUse(item.id, assignment.assignmentReceipt.id, session);
    recordAutomaticHandoff(root, { workItemId: item.id, sessionId: session, assignmentId: assignment.assignmentReceipt.id, handoff: QA_PASS });
    const decide = body => execute(['review', 'decide', '--id', item.id, '--session', session, '--revision', '1', '--body-file', write(root, `${work}/04-review/draft.md`, body)], root);
    assert.throws(() => decide('# Review\n\n## TC\nTC-001\n\n## 기대 · 실제\n기대: 목록이 줄어든다 / 실제: 줄어든다\n\n## 증거\nround-1/desktop.png\n'), /review TC trace set/);
    const review = decide('# Review\n\n## TC\nTC-001, TC-003\n\n## 기대 · 실제\n기대: 목록이 줄어든다 / 실제: 줄어든다\n\n## 증거\nround-1/desktop.png, QA handoff\n');
    assert.equal(review.verdict, 'PASS', review.evidencePath ? fs.readFileSync(path.join(root, review.evidencePath), 'utf8') : JSON.stringify(review));
    item = store.get(item.id);
    item = userSays(root, store, item, session, '/vais 최종 승인');

    // Report: 구현됨 on every cited and declared id, new items approved, product note column filled.
    grant(root, session, item, 'report');
    assert.equal(execute(['report', 'finalize', '--id', item.id, '--session', session, '--revision', '1', '--outcome', '책 검색 기능 완료'], root).verdict, 'PASS');
    chain = idChain.loadChainIndex(root);
    assert.equal(chain.items['F-003'].status, 'approved');
    for (const id of ['REQ-001', 'F-001', 'S-001', 'TC-001', 'F-003', 'API-003', 'TC-003']) assert.equal(chain.items[id].implemented?.workItem, item.id, id);
    assert.equal(chain.items['F-002'].implemented, undefined);
    assert.deepEqual(idChain.computeStale(chain), []);
    const current = fs.readFileSync(path.join(root, 'docs/product/README.md'), 'utf8');
    assert.match(current, /\| 순서 \| 문서 \| 상태 \| 항목 \| 구현됨 \| 승인일 \| 작업 \|/);
    assert.match(current, /\| 2 \| \[기능 정의서\]\(02-features\.md\) \| approved \| 3 \| 2 \|/);
    assert.match(current, /\| 8 \| \[API 규약\]\(08-api\.md\) \| approved \| 3 \| 1 \|/);
    assert.ok(ledger.read(root).entries.some(entry => entry.kind === 'milestone' && /작업 완료 — 책 검색/.test(entry.text)));
    assert.equal(store.get(item.id).status, 'completed');
  });
});
