'use strict';

// 장면 D — 버그 (docs/harness/design.md §11): "별점 저장이 안 돼요"
// 검증: bug 작업 — 재현 PNG(앱을 띄워 screens capture)·원인·수정안·신규 TC 없이는 Design 거부, "재현 불가" 거부,
//       do ready 가 TC-003 을 테스트 계획에 append, Review 는 재현 재실행 절 필수, Report 가 구현됨·"버그 해결"·부채 해소 note
// 렌더러: stub (앱은 tests/fixtures/static-server.js 로 실제 HTTP 기동)

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../../lib/workflow/v2/work-item-store');
const { recordAutomaticHandoff } = require('../../lib/workflow/v2/automatic-handoff');
const { suggestKind } = require('../../lib/workflow/v2/chain-registry');
const idChain = require('../../lib/workflow/v2/id-chain');
const ledger = require('../../lib/workflow/v2/ledger');
const helpers = require('./helpers');

const { MINI_BOOKING, STATIC_SERVER, write, grant, userSays, copyDir, approveChain } = helpers;
const PORT = '4182';
const URL = `http://127.0.0.1:${PORT}/index.html`;
const FEATURE = 'rating-save';
const QA_PASS = helpers.qaPass('재현 절차를 다시 실행해도 오류가 나지 않고 TC-002·TC-003 이 통과', {
  decisions: ['재현 재실행 미발생'], inputs: ['재현 절차'], evidence: ['02-design/repro/desktop.png'], affectedRequirements: ['REQ-002'],
});

function makeRoot(t) {
  const root = helpers.makeRoot(t, 'scene-d', {
    ui: { appRoot: 'app', entry: 'index.html', run: { command: [process.execPath, STATIC_SERVER, 'app', PORT], url: URL, readyTimeoutMs: 10000 } },
  }, { name: 'reading-log' });
  copyDir(MINI_BOOKING, path.join(root, 'app'));
  approveChain(root);
  ledger.append(root, { workItemId: 'WI-2026-09-16-s10', feature: FEATURE, kind: 'debt', text: '별점 저장 오류가 가끔 난다', why: '테스트 계획에서 미해결', source: { type: 'event', id: 'fixture' } });
  return root;
}

function designBody(work, options = {}) {
  return [
    '# Design — 별점 저장 오류', '',
    '## 안 1', '저장 전에 별점 값을 정수로 바꾼다.', '',
    '## 재현', '- "데미안" 상세에서 별 4개를 누른다', '- 감상 없이 저장을 누른다', '- "저장 실패" 가 뜬다',
    options.impossible ? '재현 불가' : `재현 화면: ${work}/02-design/repro/desktop.png`, '',
    '## 원인', '별점이 문자열 "4" 로 넘어가 범위 검사에 걸린다.', '',
    '## 수정안', 'app/app.js 에서 Number(stars) 로 바꿔 저장한다.', '',
    '## 인용', 'REQ-002, F-002, TC-002', '',
    '## 신규',
    ...(options.withoutTc ? ['없음'] : ['### TC-003 ← F-002', '| 항목 | 내용 |', '|---|---|', '| 검수 절차 | 상세에서 별 4개만 누르고 감상 없이 저장한다 |', '| 기대 결과 | "저장 실패" 없이 별 4개가 보인다 |']), '',
    '## 해소 부채', '- 별점 저장 오류가 가끔 난다', '',
    '## 검수표', '- 재현 절차를 다시 해도 저장 실패가 없다', '- 감상이 있는 저장도 그대로 된다', '',
    '## 쓰기 범위', '- app/**', '',
    '## readiness · review', 'implementation-document / implementation-document', '',
    '## rollback', 'git checkout app/app.js', '',
  ].join('\n');
}

describe('scene D — "별점 저장이 안 돼요": a bug needs a reproduction, a cause, one fix, and a regression TC', () => {
  it('refuses a Design without reproduction or new TC, captures the repro through the app, and closes the debt', t => {
    const root = makeRoot(t);
    const store = new WorkItemStore(root);
    const session = 'scene-d';
    assert.equal(suggestKind('/vais 별점 저장이 안 돼요').kind, 'bug');

    grant(root, session, null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: 별점만 누르고 저장하면 실패한다 — 재현: 상세에서 별 4개, 감상 없이 저장.\nkind: bug\n관련 ID: F-002, TC-002\n');
    const plan = execute(['plan', 'present', '--slug', FEATURE, '--title', '별점 저장 오류', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'standard', '--kind', 'bug', '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(plan.verdict, 'PASS');
    let item = store.get(plan.workItemId);
    item = userSays(root, store, item, session, '/vais plan 승인');
    const work = `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}`;

    // Design: the reproduction screenshot is taken through the running app into the Work item folder.
    grant(root, session, item, 'design');
    const present = body => execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', write(root, `${work}/02-design/draft.md`, body),
      '--scope', 'app/**', '--readiness-check', 'implementation-document', '--review-check', 'implementation-document'], root);
    assert.throws(() => present(designBody(work)), /재현 화면 파일이 없다/);
    const shot = execute(['screens', 'capture', '--id', item.id, '--session', session, '--target', URL, '--out', `${work}/02-design/repro`], root);
    assert.equal(shot.renderer, 'stub');
    assert.ok(fs.existsSync(path.join(root, work, '02-design', 'repro', 'desktop.png')));
    assert.throws(() => present(designBody(work, { impossible: true })), /재현 없는 버그 수정은 없다/);
    assert.throws(() => present(designBody(work, { withoutTc: true })), /재발 방지 TC 항목이 하나 이상 필요하다/);
    const design = present(designBody(work));
    assert.equal(design.verdict, 'PASS', design.evidencePath ? fs.readFileSync(path.join(root, design.evidencePath), 'utf8') : JSON.stringify(design));
    item = store.get(item.id);
    item = userSays(root, store, item, session, '/vais design 승인');
    assert.equal(`${item.phase}/${item.status}`, 'do/active');

    // Do: fix inside the scope; `do ready` appends TC-003 to the test plan (no screens cited → no capture).
    grant(root, session, item, 'do');
    const appJs = path.join(root, 'app', 'app.js');
    fs.appendFileSync(appJs, '\n// fix: stars are numbers\n');
    const doDraft = write(root, `${work}/03-do/draft.md`, '# Do\n\n## 변경\napp/app.js 별점을 Number 로 저장.\n\n## 증거\nimplementation-document.\n');
    const ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
    assert.equal(ready.verdict, 'READY', JSON.stringify(ready.checks || ready));
    assert.match(fs.readFileSync(path.join(root, 'docs/product/10-test-plan.md'), 'utf8'), /### TC-003 ← F-002/);
    assert.equal(idChain.loadChainIndex(root).items['TC-003'].status, 'draft');
    assert.equal(fs.existsSync(path.join(root, work, '03-do', 'evidence', 'screen-capture.json')), false);
    item = store.get(item.id);
    assert.equal(`${item.phase}/${item.status}`, 'review/active');

    // Review: QA re-runs the reproduction; the Review names the rerun and both TCs.
    grant(root, session, item, 'review');
    execute(['review', 'prepare', '--id', item.id, '--session', session, '--revision', '1'], root);
    const assignment = execute(['assignment', '--id', item.id, '--session', session, '--role', 'independent-qa', '--delegated-by', 'ceo',
      '--phase', 'review', '--mode', 'verification', '--question', '재현 절차 재실행과 TC-002·TC-003', '--code-write', 'false',
      '--criterion', '재현 절차를 다시 해도 저장 실패가 없다', '--criterion', 'TC-002', '--criterion', 'TC-003',
      '--ref', `${work}/02-design/repro/desktop.png`, '--clean-room', 'true'], root);
    store.recordAssignmentUse(item.id, assignment.assignmentReceipt.id, session);
    recordAutomaticHandoff(root, { workItemId: item.id, sessionId: session, assignmentId: assignment.assignmentReceipt.id, handoff: QA_PASS });
    const decide = body => execute(['review', 'decide', '--id', item.id, '--session', session, '--revision', '1', '--body-file', write(root, `${work}/04-review/draft.md`, body)], root);
    assert.throws(() => decide('# Review\n\n## TC\nTC-002, TC-003\n\n## 기대 · 실제\n기대: 저장 성공 / 실제: 성공\n\n## 증거\nQA handoff\n'), /repro-rerun/);
    assert.equal(decide('# Review\n\n## 재현 재실행\n별 4개, 감상 없이 저장 → 실패 없음.\n\n## TC\nTC-002, TC-003\n\n## 기대 · 실제\n기대: 저장 성공 / 실제: 성공\n\n## 증거\n재현 재실행 로그, QA handoff\n').verdict, 'PASS');
    item = store.get(item.id);
    item = userSays(root, store, item, session, '/vais 최종 승인');

    // Report: TC-003 approved, F-002 stamped, "버그 해결" milestone and the resolved debt noted.
    grant(root, session, item, 'report');
    assert.equal(execute(['report', 'finalize', '--id', item.id, '--session', session, '--revision', '1', '--outcome', '별점 저장 오류 수정 완료'], root).verdict, 'PASS');
    const chain = idChain.loadChainIndex(root);
    assert.equal(chain.items['TC-003'].status, 'approved');
    assert.equal(chain.items['F-002'].implemented.workItem, item.id);
    assert.equal(chain.items['F-001'].implemented, undefined);
    const entries = ledger.read(root).entries;
    assert.ok(entries.some(entry => entry.kind === 'milestone' && /버그 해결 — 별점 저장 오류/.test(entry.text)));
    assert.ok(entries.some(entry => entry.kind === 'note' && /부채 해소: 별점 저장 오류가 가끔 난다/.test(entry.text)));
    assert.match(fs.readFileSync(path.join(root, 'docs/product/decisions.md'), 'utf8'), /부채 해소: 별점 저장 오류/);
    assert.equal(store.get(item.id).status, 'completed');
  });
});
