'use strict';

// H6 feature-bug-kinds (docs/harness/roadmap.md): feature and bug Work items cite approved chain
// IDs, declare new items, and the runtime appends them, photographs screens through the running
// app, and stamps 구현됨 at Report. TC ids follow the H6 Design.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const citation = require('../lib/workflow/v2/citation');
const idChain = require('../lib/workflow/v2/id-chain');
const { loadChainCatalog, getKind } = require('../lib/workflow/v2/chain-registry');
const { loadUiConfig } = require('../lib/workflow/v2/config');
const { withApp, urlResponds } = require('../lib/workflow/v2/app-runner');
const { requiredSectionsFor } = require('../lib/workflow/v2/phase-check');
const { validateContract } = require('../lib/workflow/v2/contracts');
const { renderCurrent } = require('../lib/workflow/v2/product-note');
const { execute } = require('../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { EVENTS } = require('../lib/workflow/v2/state-machine');
const prompt = require('../hooks/workflow-v2-prompt');

const REPO = path.join(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures', 'product-stages');
const STATIC_SERVER = path.join(__dirname, 'fixtures', 'static-server.js');
const MINI_BOOKING = path.join(__dirname, 'fixtures', 'mini-booking');

process.env.VAIS_SCREEN_RENDERER = process.env.VAIS_SCREEN_RENDERER || 'stub';

function tempRoot(t, config = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-fb-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.6.0', workflowV2: { mode: 'enforce' }, ...config }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'reading-log', version: '0.0.1' }));
  return root;
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

function approveChain(root, upTo = 10) {
  for (let order = 1; order <= upTo; order += 1) idChain.approveStage(root, installStage(root, order), { workItem: `WI-2026-09-16-s${order}` });
}

function table(rows) {
  return ['| 항목 | 내용 |', '|---|---|', ...Object.entries(rows).map(([field, value]) => `| ${field} | ${value} |`)].join('\n');
}

const FEATURE_FIELDS = { 동작: '제목으로 책을 검색한다', 입력: '검색어', 출력: '일치하는 책 목록', 오류: '검색어가 비면 전체 목록', 규칙: '대소문자 무시' };
const API_FIELDS = { 요청: 'GET /books?q=데미안', 응답: '200 [{id, title, author}]', 오류: '400 검색어 200자 초과', '쉬운 말 설명': '제목으로 책을 찾아 돌려준다' };
const TC_FIELDS = { '검수 절차': '검색창에 "데미안" 을 입력한다', '기대 결과': '데미안만 목록에 남는다' };

function featureDesign(overrides = {}) {
  const additions = overrides.additions ?? [`### F-003 ← REQ-001\n${table(FEATURE_FIELDS)}`, `### API-003 ← S-001, F-003\n${table(API_FIELDS)}`, `### TC-003 ← F-003\n${table(TC_FIELDS)}`];
  return [
    '# Design — 책 검색', '', '## 안 1', '검색창을 목록 위에 둔다.', '',
    '## 인용', overrides.cited ?? 'REQ-001, F-001, S-001, TC-001', '',
    '## 신규', ...additions, '',
    '## 검수표', '- 검색어를 넣으면 목록이 줄어든다', '- 빈 검색어는 전체 목록', '',
    '## 쓰기 범위', '- app/**', '',
    '## readiness · review', 'implementation-document / implementation-document', '',
    '## rollback', 'git checkout app/', '',
  ].join('\n');
}

function grant(root, session, item, phase, action = 'continue-work', extra = {}) {
  new AuthorizationStore(root).grant({ sessionId: session, workItemId: item?.id || null, phase, action, allowedPaths: [], allowedCommands: [], ...extra });
}

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return relative;
}

describe('feature-bug REQ-001 kinds: feature and bug use one-line Plan and implementation Designs', () => {
  it('TC-001 work-kinds contract names the templates and the schema accepts them', () => {
    const kinds = JSON.parse(fs.readFileSync(path.join(REPO, 'contracts', 'work-kinds.json'), 'utf8'));
    assert.equal(validateContract('workKinds', kinds).valid, true);
    assert.deepEqual([getKind('feature').planTemplate, getKind('feature').designTemplate], ['one-line', 'implementation']);
    assert.deepEqual([getKind('bug').planTemplate, getKind('bug').designTemplate], ['one-line', 'bugfix']);
    assert.equal(citation.isImplementationKind(getKind('feature')), true);
    assert.equal(citation.isImplementationKind(getKind('harness')), false);
    const feature = { kind: 'feature' };
    const bug = { kind: 'bug' };
    assert.deepEqual(requiredSectionsFor(feature, 'design').map(([name]) => name), ['options', 'citations', 'additions', 'checklist', 'write-scope', 'readiness-review', 'rollback']);
    assert.deepEqual(requiredSectionsFor(bug, 'design').map(([name]) => name).slice(0, 3), ['repro', 'cause', 'fix']);
    assert.deepEqual(requiredSectionsFor(bug, 'review').map(([name]) => name)[0], 'repro-rerun');
    assert.deepEqual(requiredSectionsFor(feature, 'plan').map(([name]) => name), ['request-confirm', 'kind', 'stage-or-target']);
    assert.ok(requiredSectionsFor(feature, 'plan')[2][1].test('관련 ID: F-001'));
  });
});

describe('feature-bug REQ-002 citation parser and validator', () => {
  it('TC-002 parses 인용·신규·검수표·재현·해소 부채 from a Design body', () => {
    const parsed = citation.parseCitations(`${featureDesign()}\n## 재현\n- 별 4개 저장\n재현 화면: docs/work-items/x/02-design/repro/desktop.png\n\n## 해소 부채\n- 별점 저장 오류\n`);
    assert.deepEqual(parsed.cited, ['REQ-001', 'F-001', 'S-001', 'TC-001']);
    assert.deepEqual(parsed.added.map(item => item.id), ['F-003', 'API-003', 'TC-003']);
    assert.deepEqual(parsed.added[1].parents, ['S-001', 'F-003']);
    assert.equal(parsed.added[0].fields['동작'], '제목으로 책을 검색한다');
    assert.equal(parsed.checklist.length, 2);
    assert.deepEqual(parsed.repro.screenshots, ['docs/work-items/x/02-design/repro/desktop.png']);
    assert.deepEqual(parsed.resolvedDebts, ['별점 저장 오류']);
    assert.deepEqual([...citation.designTestCases(parsed)], ['TC-001', 'TC-003']);
    assert.equal(citation.touchesScreens(parsed), true);
  });

  it('TC-003 rejects unknown citations, wrong numbers, missing fields, unapproved stages, and missing bug TC', t => {
    const root = tempRoot(t);
    assert.match(citation.validateCitations(root, citation.parseCitations(featureDesign()))[0], /제품 사슬이 비어 있다/);
    approveChain(root, 7); // stages 8..10 (API, architecture, test plan) not yet approved
    const findings = citation.validateCitations(root, citation.parseCitations(featureDesign({
      cited: 'REQ-001, F-009',
      additions: [`### F-005 ← REQ-001\n${table({ ...FEATURE_FIELDS, 규칙: '' })}`, `### API-001 ← S-001, F-005\n${table(API_FIELDS)}`, `### TC-003 ← F-005\n${table(TC_FIELDS)}`],
    })), { kind: 'bug' });
    assert.ok(findings.some(line => /인용 F-009 는 승인된 항목이 아니다 \(후보: F-00/.test(line)), findings.join('\n'));
    assert.ok(findings.some(line => /F-005: 다음 빈 번호는 F-003/.test(line)));
    assert.ok(findings.some(line => /F-005: 필수 항목 누락 "규칙"/.test(line)));
    assert.ok(findings.some(line => /API-001: API 규약.*아직 승인되지 않았다/.test(line)));
    assert.ok(findings.some(line => /TC-003: 테스트 계획.*아직 승인되지 않았다/.test(line)));
    approveChain(root, 10);
    assert.match(citation.validateCitations(root, citation.parseCitations(featureDesign({ additions: [`### API-001 ← S-001, F-001\n${table(API_FIELDS)}`] }))).join('\n'), /API-001: 이미 존재하는 항목이다/);
    assert.deepEqual(citation.validateCitations(root, citation.parseCitations(featureDesign()), { kind: 'feature' }), []);
    assert.match(citation.validateCitations(root, citation.parseCitations(featureDesign({ additions: [`### F-003 ← REQ-001\n${table(FEATURE_FIELDS)}`] })), { kind: 'bug' }).join('\n'), /재발 방지 TC/);
    assert.match(citation.validateCitations(root, citation.parseCitations('# Design\n## 인용\n없음\n## 신규\n없음\n')).join('\n'), /ID 가 하나 이상 필요하다/);
    // A parent declared earlier in the same Design counts; one that is neither approved nor declared does not.
    assert.match(citation.validateCitations(root, citation.parseCitations(featureDesign({ additions: [`### API-003 ← S-001, F-004\n${table(API_FIELDS)}`] }))).join('\n'), /부모 F-004 가 승인된 항목도 이 Design 의 신규 항목도 아니다/);
  });

  it('TC-004 bug Designs need a reproduction with a PNG inside the Work item, a cause, and a fix', t => {
    const root = tempRoot(t);
    const item = { id: 'WI-2026-09-16-star-bug', primaryFeature: 'star-bug', kind: 'bug' };
    const dir = 'docs/work-items/star-bug/2026-09-16-star-bug';
    const none = citation.bugFindings(root, item, citation.parseCitations('# Design\n## 안 1\nx\n'));
    assert.deepEqual(none, ['`## 재현` 절이 필요하다 (절차 + `재현 화면: <png>`)', '`## 원인` 절이 필요하다', '`## 수정안` 절이 필요하다']);
    const impossible = citation.bugFindings(root, item, citation.parseCitations('## 재현\n재현 불가\n## 원인\nx\n## 수정안\ny\n'));
    assert.match(impossible.join('\n'), /재현 없는 버그 수정은 없다/);
    const outside = citation.bugFindings(root, item, citation.parseCitations(`## 재현\n- 저장\n재현 화면: app/shot.png\n## 원인\nx\n## 수정안\ny\n`));
    assert.match(outside.join('\n'), /Work item 폴더 안이어야 한다/);
    const missing = citation.bugFindings(root, item, citation.parseCitations(`## 재현\n- 저장\n재현 화면: ${dir}/02-design/repro/desktop.png\n## 원인\nx\n## 수정안\ny\n`));
    assert.match(missing.join('\n'), /재현 화면 파일이 없다/);
    write(root, `${dir}/02-design/repro/desktop.png`, 'png');
    assert.deepEqual(citation.bugFindings(root, item, citation.parseCitations(`## 재현\n- 저장\n재현 화면: ${dir}/02-design/repro/desktop.png\n## 원인\nx\n## 수정안\ny\n`)), []);
  });
});

describe('feature-bug REQ-003 additions land in the canonical files and get the 구현됨 stamp', () => {
  it('TC-005 applyAdditions appends items as drafts, markImplemented approves and stamps, re-approval keeps the stamp', t => {
    const root = tempRoot(t);
    approveChain(root);
    const item = { id: 'WI-2026-09-16-search', primaryFeature: 'search', kind: 'feature' };
    const parsed = citation.parseCitations(featureDesign());
    const preview = citation.previewAdditions(root, parsed);
    assert.deepEqual(preview.findings, []);
    assert.deepEqual(preview.files.map(file => path.basename(file)).sort(), ['02-features.md', '08-api.md', '10-test-plan.md']);
    const applied = citation.applyAdditions(root, item, parsed, { timestamp: '2026-09-16T12:00:00.000Z' });
    assert.deepEqual(applied.ids, ['F-003', 'API-003', 'TC-003']);
    const features = fs.readFileSync(path.join(root, 'docs/product/02-features.md'), 'utf8');
    assert.match(features, /### F-003 ← REQ-001\n\| 항목 \| 내용 \|\n\|---\|---\|\n\| 동작 \| 제목으로 책을 검색한다 \|/);
    assert.match(fs.readFileSync(path.join(root, 'docs/product/08-api.md'), 'utf8'), /### API-003 ← S-001, F-003/);
    let index = idChain.loadChainIndex(root);
    assert.equal(index.items['F-003'].status, 'draft');
    assert.equal(index.items['F-003'].workItem, item.id);
    assert.equal(index.items['API-003'].parentHashes['F-003'], index.items['F-003'].hash);
    assert.deepEqual(idChain.computeStale(index), []);
    assert.match(renderCurrent(root), /\| 2 \| \[기능 정의서\]\(02-features\.md\) \| approved · draft 1 \| 3 \| 0 \|/);
    // Another Work item cannot claim the same numbers; this one re-applies (repaired Design) without duplicates.
    assert.match(citation.validateCitations(root, parsed, { workItem: 'WI-other' }).join('\n'), /F-003: 이미 존재하는 항목이다/);
    assert.deepEqual(citation.validateCitations(root, parsed, { workItem: item.id }), []);
    citation.applyAdditions(root, item, citation.parseCitations(featureDesign({ additions: [`### F-003 ← REQ-001\n${table({ ...FEATURE_FIELDS, 동작: '제목이나 저자로 책을 검색한다' })}`, `### API-003 ← S-001, F-003\n${table(API_FIELDS)}`, `### TC-003 ← F-003\n${table(TC_FIELDS)}`] })), { timestamp: '2026-09-16T12:30:00.000Z' });
    const reapplied = fs.readFileSync(path.join(root, 'docs/product/02-features.md'), 'utf8');
    assert.equal((reapplied.match(/### F-003 ←/g) || []).length, 1);
    assert.match(reapplied, /제목이나 저자로 책을 검색한다/);
    assert.equal((fs.readFileSync(path.join(root, 'docs/product/08-api.md'), 'utf8').match(/### API-003/g) || []).length, 1);

    const stamped = citation.markImplemented(root, item, parsed, { timestamp: '2026-09-16T13:00:00.000Z' });
    assert.deepEqual(stamped.stamped, ['REQ-001', 'F-001', 'S-001', 'TC-001', 'F-003', 'API-003', 'TC-003']);
    index = idChain.loadChainIndex(root);
    assert.equal(index.items['F-003'].status, 'approved');
    assert.deepEqual(index.items['F-001'].implemented, { workItem: item.id, at: '2026-09-16T13:00:00.000Z' });
    assert.equal(index.items['F-002'].implemented, undefined);
    assert.match(renderCurrent(root), /\| 2 \| \[기능 정의서\]\(02-features\.md\) \| approved \| 3 \| 2 \|/);

    // Re-approving the features stage (a stage Work item) keeps the stamp on unchanged ids.
    idChain.approveStage(root, loadChainCatalog().stages[1], { workItem: 'WI-2026-09-16-s2b' });
    index = idChain.loadChainIndex(root);
    assert.equal(index.items['F-003'].implemented.workItem, item.id);
    assert.equal(index.items['F-003'].approvedAt !== null, true);
  });

  it('TC-006 previewAdditions reports the canonical budget before anything is written', t => {
    const root = tempRoot(t);
    approveChain(root);
    const huge = 'x'.repeat(6000);
    const parsed = citation.parseCitations(featureDesign({ additions: [`### F-003 ← REQ-001\n${table({ ...FEATURE_FIELDS, 동작: huge })}`] }));
    const preview = citation.previewAdditions(root, parsed);
    assert.match(preview.findings.join('\n'), /02-features\.md: 신규 항목을 붙이면 \d+B 로 예산 \d+B 를 넘는다/);
    assert.throws(() => citation.applyAdditions(root, { id: 'WI-x', kind: 'feature', primaryFeature: 'x' }, parsed), /신규 항목을 붙일 수 없다/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'docs/product/02-features.md'), 'utf8'), /F-003/);
  });
});

describe('feature-bug REQ-004 the app runs around a screenshot', () => {
  it('TC-007 loadUiConfig accepts ui.run only as argv array + http url', t => {
    const root = tempRoot(t, { ui: { appRoot: 'app', run: { command: ['node', 'server.js'], url: 'http://127.0.0.1:4183/', readyTimeoutMs: 2000 } } });
    assert.deepEqual(loadUiConfig(root).run, { command: ['node', 'server.js'], url: 'http://127.0.0.1:4183/', readyTimeoutMs: 2000 });
    fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.6.0', workflowV2: { mode: 'enforce' }, ui: { run: { command: 'node server.js', url: 'http://127.0.0.1:4183/' } } }));
    assert.equal(loadUiConfig(root).run, null);
    fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: '3.6.0', workflowV2: { mode: 'enforce' }, ui: { run: { command: ['node', 'server.js'], url: 'file:///x' } } }));
    assert.equal(loadUiConfig(root).run, null);
  });

  it('TC-008 withApp starts the app, waits for the URL, runs the callback, and stops the process', t => {
    const root = tempRoot(t);
    fs.mkdirSync(path.join(root, 'app'));
    fs.copyFileSync(path.join(MINI_BOOKING, 'index.html'), path.join(root, 'app', 'index.html'));
    const url = 'http://127.0.0.1:4184/index.html';
    assert.equal(urlResponds(url), false);
    const seen = withApp(root, { command: [process.execPath, STATIC_SERVER, 'app', '4184'], url, readyTimeoutMs: 10000 }, target => {
      assert.equal(urlResponds(target), true);
      return target;
    });
    assert.equal(seen, url);
    const deadline = Date.now() + 3000;
    while (urlResponds(url) && Date.now() < deadline) { /* wait for the server to go away */ }
    assert.equal(urlResponds(url), false);
  });

  it('TC-009 a command that exits or never answers fails with APP_START_FAILED', t => {
    const root = tempRoot(t);
    assert.throws(() => withApp(root, { command: [process.execPath, '-e', 'process.exit(3)'], url: 'http://127.0.0.1:4185/', readyTimeoutMs: 5000 }, () => 'never'), error => error.code === 'APP_START_FAILED' && /먼저 끝났다/.test(error.message));
    assert.throws(() => withApp(root, { command: [process.execPath, '-e', 'setTimeout(() => {}, 30000)'], url: 'http://127.0.0.1:4186/', readyTimeoutMs: 1200 }, () => 'never'), error => error.code === 'APP_START_FAILED' && /응답하지 않았다/.test(error.message));
    assert.equal(withApp(root, null, url => url), null);
  });
});

describe('feature-bug REQ-005 stale gate and hook guidance', () => {
  it('TC-010 an implementation Design is refused while any chain item is stale', t => {
    const root = tempRoot(t);
    approveChain(root);
    const requirements = path.join(root, 'docs/product/01-requirements.md');
    fs.writeFileSync(requirements, fs.readFileSync(requirements, 'utf8').replace('책을 제목·저자로 등록한다', '책을 제목·저자·출판사로 등록한다'));
    idChain.approveStage(root, loadChainCatalog().stages[0], { workItem: 'WI-2026-09-16-s1b' });
    assert.equal(idChain.computeStale(idChain.loadChainIndex(root)).length, 1);
    const store = new WorkItemStore(root);
    const session = 'fb-stale';
    grant(root, session, null, 'plan', 'start-request', { requestSlug: 'search' });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: 책 검색을 추가한다.\nkind: feature\n관련 ID: F-001, S-001\n');
    const plan = execute(['plan', 'present', '--slug', 'search', '--title', '책 검색', '--feature', 'search', '--relation', 'new', '--scale', 'standard', '--kind', 'feature', '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(plan.verdict, 'PASS');
    let item = store.get(plan.workItemId);
    store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, {});
    item = store.get(item.id);
    grant(root, session, item, 'design');
    const draft = write(root, `docs/work-items/search/${item.id.replace(/^WI-/, '')}/02-design/draft.md`, featureDesign());
    assert.throws(() => execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', draft, '--scope', 'app/**', '--readiness-check', 'implementation-document', '--review-check', 'implementation-document'], root),
      error => error.code === 'STAGE_STALE_BLOCK' && /F-001←REQ-001/.test(error.message));
    assert.equal(store.get(item.id).designRevision, 1);
    assert.equal(fs.existsSync(path.join(root, `docs/work-items/search/${item.id.replace(/^WI-/, '')}/02-design/main.md`)), false);
  });

  it('TC-011 the prompt hook explains citation, addition, and QA criteria for feature and bug', () => {
    const feature = prompt.implementationPhaseLines({ id: 'WI-2026-09-16-search', primaryFeature: 'search', phase: 'plan', status: 'active', designRevision: 1, qaRepairCount: 0 }, getKind('feature'), 's');
    assert.match(feature.plan[0], /관련 ID/);
    assert.match(feature.design[0], /## 인용[\s\S]*## 신규[\s\S]*다음 빈 번호/);
    assert.doesNotMatch(feature.design[0], /## 재현/);
    assert.match(feature.do[0], /do ready[\s\S]*정본에 붙이고/);
    assert.match(feature.review[0], /검수표[\s\S]*TC 집합/);
    const bug = prompt.implementationPhaseLines({ id: 'WI-2026-09-16-star', primaryFeature: 'star', phase: 'design', status: 'active', designRevision: 1, qaRepairCount: 0 }, getKind('bug'), 's');
    assert.match(bug.design[0], /## 재현[\s\S]*## 원인[\s\S]*## 수정안/);
    assert.match(bug.review[0], /재현 재실행/);
    assert.match(bug.report[0], /해소 부채/);
  });
});
