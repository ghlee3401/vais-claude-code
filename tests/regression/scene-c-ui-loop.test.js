'use strict';

// 장면 C — UI 손보기 (docs/harness/design.md §11): "로그인 버튼이 눈에 안 띈다"
// 검증: ui 작업 — 시안 2안 스크린샷 → /vais 2번 → 승인 → 적용 → 화면 확인 정지점(전/후 + diff 한 줄) →
//       수정 2회(취향 장부) → /vais 확인 → 검수 페이지 → QA → Report 에 "채택: 안 2"
// 렌더러: stub (실제 Chrome 은 tests/v2-ui-loop.test.js)

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../../lib/workflow/v2/work-item-store');
const { recordAutomaticHandoff } = require('../../lib/workflow/v2/automatic-handoff');
const ledger = require('../../lib/workflow/v2/ledger');
const helpers = require('./helpers');

const { MINI_BOOKING, git, copyDir, write, grant, userSays } = helpers;
const FEATURE = 'booking-ui';
const QA_PASS = helpers.qaPass('승인 시안과 실제 화면이 일치', { decisions: ['검수표 3줄 통과'], inputs: ['review.html'], evidence: ['04-review/evidence/review.html'] });

// The app is committed so `do ready` can photograph the "before" state (round 0) from git HEAD.
function makeRoot(t) {
  const root = helpers.makeRoot(t, 'scene-c', { ui: { appRoot: 'app', entry: 'index.html' } }, { name: 'mini-booking' });
  copyDir(MINI_BOOKING, path.join(root, 'app'));
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'fixture']);
  return root;
}

function replaceCss(file, from, to) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes(from), `CSS fixture no longer contains "${from}"`);
  fs.writeFileSync(file, text.replace(from, to));
}

describe('scene C — a button is hard to see: options, screen check, two fixes, confirm, review', () => {
  it('walks the ui loop end to end and records the taste', t => {
    const root = makeRoot(t);
    const store = new WorkItemStore(root);
    const session = 'scene-c';
    const designBody = (extra = '') => [
      '# Design — 로그인 버튼', '',
      '## 안 1', '사본: WORK/02-design/options/1', '데스크톱: WORK/02-design/options/1/desktop.png', '모바일: WORK/02-design/options/1/mobile.png', '버튼을 더 크게, 색 유지.', '',
      '## 안 2', '사본: WORK/02-design/options/2', '데스크톱: WORK/02-design/options/2/desktop.png', '모바일: WORK/02-design/options/2/mobile.png', '버튼을 더 크게, 강조색.', '',
      '## 검수표', '- 로그인 버튼이 한눈에 보인다', '- 모바일에서도 버튼이 잘린다', '- 다른 요소는 그대로다', '',
      '## 쓰기 범위', '- app/**', '',
      '## readiness · review', 'screen-capture / screen-capture', '',
      '## rollback', 'git checkout app/styles.css', extra,
    ].join('\n');

    // Plan: one line.
    grant(root, session, null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: 로그인 버튼이 눈에 안 띈다 — 더 크고 진하게.\nkind: ui\n대상 화면: 로그인 (app/index.html)\n');
    const plan = execute(['plan', 'present', '--slug', FEATURE, '--title', '로그인 버튼 손보기', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'standard', '--kind', 'ui', '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(plan.verdict, 'PASS');
    let item = store.get(plan.workItemId);
    item = userSays(root, store, item, session, '/vais plan 승인');
    assert.equal(item.phase, 'design');
    const work = `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}`;

    // Design: two option copies of the app, photographed by the runtime.
    grant(root, session, item, 'design');
    for (const [option, from, to] of [[1, 'padding: 15px 20px', 'padding: 20px 28px'], [2, 'background: var(--ink); border: 0', 'background: var(--accent); border: 0']]) {
      copyDir(path.join(root, 'app'), path.join(root, work, '02-design', 'options', String(option)));
      replaceCss(path.join(root, work, '02-design', 'options', String(option), 'styles.css'), from, to);
      const shot = execute(['screens', 'capture', '--id', item.id, '--session', session, '--target', `${work}/02-design/options/${option}/index.html`, '--out', `${work}/02-design/options/${option}`], root);
      assert.equal(shot.renderer, 'stub');
    }
    const designDraft = write(root, `${work}/02-design/draft.md`, designBody().replaceAll('WORK', work));
    assert.throws(() => execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', write(root, `${work}/02-design/broken.md`, designBody().replaceAll('WORK', work).replace(`${work}/02-design/options/2/mobile.png`, `${work}/02-design/options/2/missing.png`)),
      '--scope', 'app/**', '--readiness-check', 'screen-capture', '--review-check', 'screen-capture'], root), /preflight failed/);
    const design = execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', designDraft,
      '--scope', 'app/**', '--readiness-check', 'screen-capture', '--review-check', 'screen-capture'], root);
    assert.equal(design.verdict, 'PASS');
    item = store.get(item.id);
    assert.throws(() => userSays(root, store, item, session, '/vais design 승인'), /안 번호를 먼저/);
    item = userSays(root, store, item, session, '/vais 2번');
    assert.equal(item.chosenOption, 2);
    item = userSays(root, store, item, session, '/vais design 승인');
    assert.equal(`${item.phase}/${item.status}`, 'do/active');

    // Do round 1: apply option 2, photograph, stop at the screen check with before/after.
    grant(root, session, item, 'do');
    replaceCss(path.join(root, 'app', 'styles.css'), 'background: var(--ink); border: 0', 'background: var(--accent); border: 0');
    const doDraft = write(root, `${work}/03-do/draft.md`, '# Do\n\n## 변경\napp/styles.css 안 2 적용.\n\n## 증거\nscreen-capture 회차 화면.\n');
    let ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
    assert.equal(ready.verdict, 'READY');
    item = store.get(item.id);
    assert.equal(`${item.phase}/${item.status}`, 'do/waiting-user');
    const screens = path.join(root, work, '03-do', 'evidence', 'screens');
    for (const file of ['round-0/desktop.png', 'round-0/mobile.png', 'round-1/desktop.png', 'round-1/mobile.png', 'round-1/diff.md']) assert.ok(fs.existsSync(path.join(screens, file)), file);
    assert.match(fs.readFileSync(path.join(screens, 'round-1', 'diff.md'), 'utf8'), /\.primary, \.book-button background: var\(--ink\) → var\(--accent\)/);

    // Two revision rounds: the user's words become taste, Design records the round, Do re-photographs.
    const revisions = [['/vais 버튼 더 크게', 'padding: 15px 20px', 'padding: 22px 30px', /padding: 15px 20px → 22px 30px/], ['/vais 색은 파랑으로', 'background: var(--accent); border: 0', 'background: #1d4ed8; border: 0', /background: var\(--accent\) → #1d4ed8/]];
    for (const [index, [sentence, from, to, expected]] of revisions.entries()) {
      const round = index + 2;
      item = userSays(root, store, item, session, sentence);
      assert.equal(`${item.phase}/${item.status}`, 'design/active');
      assert.equal(item.screenRevisionCount, index + 1);
      grant(root, session, item, 'design');
      const revisedDraft = write(root, `${work}/02-design/draft.md`, designBody(`\n## 수정 회차 ${index + 1}\n${sentence.replace('/vais ', '')} → ${to}\n`).replaceAll('WORK', work));
      const checkpoint = execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', revisedDraft,
        '--scope', 'app/**', '--readiness-check', 'screen-capture', '--review-check', 'screen-capture', '--material', 'false'], root);
      assert.equal(checkpoint.verdict, 'PASS');
      item = store.get(item.id);
      assert.equal(`${item.phase}/${item.status}`, 'do/active');
      grant(root, session, item, 'do');
      replaceCss(path.join(root, 'app', 'styles.css'), from, to);
      // Promoted drafts are removed by the transaction, so every round writes its own.
      const roundDraft = write(root, `${work}/03-do/draft.md`, `# Do\n\n## 변경\n회차 ${round}: ${to}.\n\n## 증거\nscreen-capture 회차 화면.\n`);
      ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', roundDraft], root);
      assert.equal(ready.verdict, 'READY');
      item = store.get(item.id);
      assert.equal(`${item.phase}/${item.status}`, 'do/waiting-user');
      assert.match(fs.readFileSync(path.join(screens, `round-${round}`, 'diff.md'), 'utf8'), expected);
    }
    assert.equal(ledger.read(root).entries.filter(entry => entry.kind === 'preference').length, 2);

    // Confirm → Review with the review page, independent QA, final approval, Report.
    item = userSays(root, store, item, session, '/vais 확인');
    assert.equal(`${item.phase}/${item.status}`, 'review/active');
    grant(root, session, item, 'review');
    const prepared = execute(['review', 'prepare', '--id', item.id, '--session', session, '--revision', '1'], root);
    assert.equal(prepared.reviewPage, `${work}/04-review/evidence/review.html`);
    const html = fs.readFileSync(path.join(root, prepared.reviewPage), 'utf8');
    assert.match(html, /선택한 안: 안 2/);
    assert.match(html, /수정 회차 2회/);
    assert.match(html, /후 \(회차 3\)/);
    assert.match(html, /로그인 버튼이 한눈에 보인다/);
    const assignment = execute(['assignment', '--id', item.id, '--session', session, '--role', 'independent-qa', '--delegated-by', 'ceo',
      '--phase', 'review', '--mode', 'verification', '--question', '시안 대비 화면 검사', '--code-write', 'false', '--criterion', '검수표 통과',
      '--ref', prepared.reviewPage, '--clean-room', 'true'], root);
    store.recordAssignmentUse(item.id, assignment.assignmentReceipt.id, session);
    recordAutomaticHandoff(root, { workItemId: item.id, sessionId: session, assignmentId: assignment.assignmentReceipt.id, handoff: QA_PASS });
    const reviewDraft = write(root, `${work}/04-review/draft.md`, '# Review\n\n## 기대 · 실제\n기대: 승인 시안 = 실제 화면 / 실제: 일치\n\n## 증거\nreview.html, QA handoff\n');
    assert.equal(execute(['review', 'decide', '--id', item.id, '--session', session, '--revision', '1', '--body-file', reviewDraft], root).verdict, 'PASS');
    item = store.get(item.id);
    item = userSays(root, store, item, session, '/vais 최종 승인');
    grant(root, session, item, 'report');
    assert.equal(execute(['report', 'finalize', '--id', item.id, '--session', session, '--revision', '1', '--outcome', '로그인 버튼 개선 완료'], root).verdict, 'PASS');

    const decisions = fs.readFileSync(path.join(root, 'docs', 'product', 'decisions.md'), 'utf8');
    assert.match(decisions, /## 취향 \(3\)/);
    assert.match(decisions, /채택: 안 2/);
    assert.match(decisions, /버튼 더 크게/);
    assert.match(decisions, /안 2 선택/);
    assert.equal(store.get(item.id).screenRevisionCount, 2);
    assert.equal(store.get(item.id).status, 'completed');
  });
});
