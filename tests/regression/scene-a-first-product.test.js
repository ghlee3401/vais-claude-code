'use strict';

// 장면 A — 처음 시작 (docs/harness/design.md §11)
// 검증: 1~10 단계 문서를 runtime CLI 로 완주(한 줄 Plan → 안 Design → 정본 → stage-document → QA → Report 승인),
//       단계 건너뛰기·잘못된 부모·stale 전파 차단
// 렌더러: stub (와이어프레임·시안 PNG 렌더; 실제 Chrome 은 tests/v2-ui-loop.test.js)

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../../lib/workflow/v2/work-item-store');
const { EVENTS } = require('../../lib/workflow/v2/state-machine');
const { recordAutomaticHandoff } = require('../../lib/workflow/v2/automatic-handoff');
const { loadChainCatalog } = require('../../lib/workflow/v2/chain-registry');
const idChain = require('../../lib/workflow/v2/id-chain');
const helpers = require('./helpers');

const { write, installStage, grant } = helpers;
const FEATURE = 'reading-log';
const QA_PASS = helpers.qaPass('단계 문서 검사 통과', { decisions: ['형식·부모·산출물 확인'], inputs: ['stage doc'], evidence: ['stage-document check'] });

function makeRoot(t) {
  return helpers.makeRoot(t, 'scene-a', {}, { name: 'reading-log' });
}

function workItemDir(root, item) {
  return path.join(root, 'docs', 'work-items', item.primaryFeature, item.id.replace(/^WI-/, ''));
}

// Drives one stage Work item end to end and returns the finalize receipt.
function runStage(root, stage, kind, options = {}) {
  const session = `scene-a-${stage.order}`;
  const store = new WorkItemStore(root);
  const first = stage.order === 1;
  const slug = first ? FEATURE : `${FEATURE}-${stage.id}`;
  grant(root, session, null, 'plan', 'start-request', { requestSlug: first ? FEATURE : null });
  write(root, '.vais/v2/drafts/plan.md', `# Plan — ${stage.order}단계 ${stage.title}\n\n요청 확인: 독서 기록 앱의 ${stage.title}를 만든다.\nkind: ${kind}\n단계: ${stage.order} ${stage.title}\n`);
  const plan = execute(['plan', 'present', '--slug', slug, '--title', `${stage.order}단계 ${stage.title}`, '--feature', FEATURE,
    '--relation', first ? 'new' : 'existing', '--scale', 'compact', '--kind', kind,
    '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
  assert.equal(plan.verdict, 'PASS', `${stage.id} plan`);
  let item = store.get(plan.workItemId);
  assert.equal(item.kind, kind);
  store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, {});
  item = store.get(item.id);

  grant(root, session, item, 'design');
  const designDraft = write(root, path.relative(root, path.join(workItemDir(root, item), '02-design', 'draft.md')),
    `# Design — ${stage.title}\n\n## 안 1\n${stage.choose}\n\n## 쓰기 범위\n${(loadChainCatalog().kinds.find(entry => entry.id === kind).autoWriteScopes).map(scope => `- ${scope}`).join('\n')}\n\n## readiness · review\nreadiness: stage-document / review: stage-document\n\n## rollback\n정본 파일 삭제\n`);
  const design = execute(['design', 'present', '--id', item.id, '--session', session, '--revision', '1', '--body-file', designDraft,
    '--readiness-check', 'stage-document', '--review-check', 'stage-document'], root);
  assert.equal(design.verdict, 'PASS', `${stage.id} design`);
  store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {}, {});
  item = store.get(item.id);
  assert.ok(item.writeScopes.every(scope => scope.startsWith('docs/product/')), JSON.stringify(item.writeScopes));

  grant(root, session, item, 'do');
  installStage(root, stage);
  if (options.corrupt) options.corrupt(root, stage);
  const doDraft = write(root, path.relative(root, path.join(workItemDir(root, item), '03-do', 'draft.md')),
    `# Do\n\n## 변경\n${stage.file} 작성.\n\n## 증거\nstage-document 검사.\n`);
  let ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
  if (options.corrupt) {
    assert.equal(ready.verdict, 'NOT_READY', `${stage.id} corrupted document must not be ready`);
    installStage(root, stage);
    ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
  }
  assert.equal(ready.verdict, 'READY', `${stage.id} ready`);
  item = store.get(item.id);

  grant(root, session, item, 'review');
  execute(['review', 'prepare', '--id', item.id, '--session', session, '--revision', '1'], root);
  const assignment = execute(['assignment', '--id', item.id, '--session', session, '--role', 'independent-qa', '--delegated-by', 'ceo',
    '--phase', 'review', '--mode', 'verification', '--question', `${stage.title} 검사`, '--code-write', 'false',
    '--criterion', 'stage-document pass', '--ref', stage.file, '--clean-room', 'true'], root);
  store.recordAssignmentUse(item.id, assignment.assignmentReceipt.id, session);
  recordAutomaticHandoff(root, { workItemId: item.id, sessionId: session, assignmentId: assignment.assignmentReceipt.id, handoff: QA_PASS });
  const reviewDraft = write(root, path.relative(root, path.join(workItemDir(root, item), '04-review', 'draft.md')),
    `# Review\n\n## 기대 · 실제\n기대: 형식·부모·산출물 통과 / 실제: 통과\n\n## 증거\nstage-document check, QA handoff\n`);
  const review = execute(['review', 'decide', '--id', item.id, '--session', session, '--revision', '1', '--body-file', reviewDraft], root);
  assert.equal(review.verdict, 'PASS', `${stage.id} review`);
  store.apply(item.id, EVENTS.USER_FINAL_APPROVED, {}, {});
  item = store.get(item.id);

  grant(root, session, item, 'report');
  const report = execute(['report', 'finalize', '--id', item.id, '--session', session, '--revision', '1', '--outcome', `${stage.title} 승인`], root);
  assert.equal(report.verdict, 'PASS', `${stage.id} report`);
  assert.equal(idChain.loadChainIndex(root).stages[stage.id].status, 'approved');
  assert.match(fs.readFileSync(path.join(root, stage.file), 'utf8'), /status: approved/);
  return report;
}

describe('scene A — a first product walks all ten stages', () => {
  it('runs stage 1..10 through the runtime CLI, blocks skipping and wrong parents, and tracks stale items', t => {
    const root = makeRoot(t);
    const stages = loadChainCatalog().stages;

    // Skipping: stage 2 before stage 1 is refused with the stage that must come first.
    grant(root, 'skip', null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: x\nkind: stage-features\n단계: 2 기능 정의서\n');
    assert.throws(() => execute(['plan', 'present', '--slug', FEATURE, '--title', 'skip', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'compact', '--kind', 'stage-features', '--session', 'skip', '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root),
    /1단계 요구사항 정의서/);

    for (const stage of stages) {
      const kind = `stage-${stage.id.replace(/^stage-/, '')}`;
      runStage(root, stage, kind, stage.order === 2 ? {
        corrupt: (dir, current) => {
          const file = path.join(dir, current.file);
          fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('### F-002 ← REQ-002', '### F-002 ← REQ-009'));
        },
      } : {});
    }

    const status = idChain.chainStatus(root);
    assert.deepEqual(status.stages.map(stage => stage.status), Array(10).fill('approved'));
    assert.deepEqual(status.stale, []);
    assert.equal(Object.keys(idChain.loadChainIndex(root).items).length, 18);

    // Stale: changing REQ-001 after approval marks F-001 and TC-001 chains stale until confirmed.
    const requirements = path.join(root, 'docs', 'product', '01-requirements.md');
    fs.writeFileSync(requirements, fs.readFileSync(requirements, 'utf8').replace('책을 제목·저자로 등록한다', '책을 제목·저자·ISBN 으로 등록한다'));
    idChain.approveStage(root, stages[0], { workItem: 'WI-2026-09-16-requirements-2' });
    const stale = idChain.computeStale(idChain.loadChainIndex(root));
    assert.deepEqual(stale.map(entry => `${entry.id}←${entry.parent}`), ['F-001←REQ-001']);
    assert.throws(() => idChain.assertStageEntry(root, loadChainCatalog().kinds.find(kind => kind.id === 'stage-features')), /stale/);
    idChain.confirmUnchanged(root, 'F-001', 'REQ-001');
    assert.deepEqual(idChain.computeStale(idChain.loadChainIndex(root)), []);

    // Reindex from the approved files rebuilds the same stage set.
    const rebuilt = idChain.reindex(root);
    assert.deepEqual(Object.keys(rebuilt.stages).sort(), stages.map(stage => stage.id).sort());
  });
});
