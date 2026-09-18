'use strict';

// 장면 A — 처음 시작 (docs/harness/design.md §11)
// 검증: 1~10 단계 문서를 runtime CLI 로 완주(한 줄 Plan → 안 Design → 정본 → stage-document → QA → Report 승인),
//       단계 건너뛰기·잘못된 부모·stale 전파 차단, 범위 이름(묻기·물려받기)·회의록 폴더 `work-items/<범위>/<날짜>-<단계>/`,
//       두 번째 범위가 같은 정본에 절을 더하고 첫 범위 항목은 건드리지 않음
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
const { routePrompt } = require('../../lib/workflow/v2/router');
const idChain = require('../../lib/workflow/v2/id-chain');
const prompt = require('../../hooks/workflow-v2-prompt');
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

// Drives one stage Work item end to end and returns the finalize receipt. The Work item is
// named by scope and stage (harness-scope-sections): `--feature` is the scope the runtime
// registered (given or inherited), `--slug` the stage's short name.
function runStage(root, stage, kind, options = {}) {
  const scope = options.scope || FEATURE;
  const session = `scene-a-${scope}-${stage.order}`;
  const store = new WorkItemStore(root);
  const first = stage.order === 1;
  const slug = stage.id.replace(/^stage-/, '');
  grant(root, session, null, 'plan', 'start-request', { requestSlug: scope });
  write(root, '.vais/v2/drafts/plan.md', `# Plan — ${stage.order}단계 ${stage.title}\n\n요청 확인: 독서 기록 앱의 ${stage.title}를 만든다.\nkind: ${kind}\n단계: ${stage.order} ${stage.title}\n`);
  const plan = execute(['plan', 'present', '--slug', slug, '--title', `${stage.order}단계 ${stage.title}`, '--feature', scope,
    '--relation', first ? 'new' : 'existing', '--scale', 'compact', '--kind', kind,
    '--session', session, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
  assert.equal(plan.verdict, 'PASS', `${stage.id} plan`);
  let item = store.get(plan.workItemId);
  assert.equal(item.kind, kind);
  assert.equal(item.primaryFeature, scope);
  assert.match(item.id, new RegExp(`^WI-\\d{4}-\\d{2}-\\d{2}-${slug}(?:-\\d+)?$`));
  assert.ok(fs.existsSync(path.join(root, 'docs', 'work-items', scope, item.id.replace(/^WI-/, ''), 'main.md')), `${item.id} under work-items/${scope}/`);
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
  if (options.install) options.install(root, stage); else installStage(root, stage);
  if (options.corrupt) options.corrupt(root, stage);
  const doDraft = write(root, path.relative(root, path.join(workItemDir(root, item), '03-do', 'draft.md')),
    `# Do\n\n## 변경\n${stage.file} 작성.\n\n## 증거\nstage-document 검사.\n`);
  let ready = execute(['do', 'ready', '--id', item.id, '--session', session, '--revision', '1', '--body-file', doDraft], root);
  if (options.corrupt) {
    assert.equal(ready.verdict, 'NOT_READY', `${stage.id} corrupted document must not be ready`);
    if (options.install) options.install(root, stage); else installStage(root, stage);
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

    // Naming: `/vais 새 제품` alone gives the hook no scope to register (nothing to inherit yet), and
    // the CLI refuses to create a stage Work item until the user names one with `/vais 범위:`.
    assert.equal(prompt.requestSlugFor(routePrompt('/vais 새 제품: 독서 기록 앱', null), root), null);
    grant(root, 'unnamed', null, 'plan', 'start-request', { requestSlug: null });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: x\nkind: stage-requirements\n단계: 1 요구사항 정의서\n');
    assert.throws(() => execute(['plan', 'present', '--slug', 'requirements', '--title', 'x', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'compact', '--kind', 'stage-requirements', '--session', 'unnamed', '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root),
    /범위 이름이 확정되지 않았다/);
    assert.equal(routePrompt(`/vais 범위: ${FEATURE} 새 제품: 독서 기록 앱`, null).slug, FEATURE);

    // Skipping: stage 2 before stage 1 is refused with the stage that must come first.
    grant(root, 'skip', null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: x\nkind: stage-features\n단계: 2 기능 정의서\n');
    assert.throws(() => execute(['plan', 'present', '--slug', 'features', '--title', 'skip', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'compact', '--kind', 'stage-features', '--session', 'skip', '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root),
    /1단계 요구사항 정의서/);

    for (const stage of stages) {
      // From stage 2 on, a request without `범위:` inherits the scope of the latest stage Work item.
      if (stage.order > 1) assert.equal(prompt.requestSlugFor(routePrompt(`/vais ${stage.title}`, null), root), FEATURE, `${stage.id} inherits the scope`);
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
    // Stage 3 flow files: the Mermaid one passes untouched, the skills/diagram HTML one is rendered to PNG.
    assert.ok(fs.existsSync(path.join(root, 'docs', 'product', 'flows', 'S-001.mmd')));
    assert.ok(!fs.existsSync(path.join(root, 'docs', 'product', 'flows', 'S-001.png')));
    assert.ok(fs.existsSync(path.join(root, 'docs', 'product', 'flows', 'S-002.png')), 'html flow file rendered to PNG');
    assert.deepEqual(status.stale, []);
    assert.equal(Object.keys(idChain.loadChainIndex(root).items).length, 18);
    // Every stage Work item of the first scope sits under work-items/reading-log/<date>-<stage>/.
    const store = new WorkItemStore(root);
    assert.deepEqual([...new Set(store.list().map(item => item.primaryFeature))], [FEATURE]);
    assert.deepEqual(fs.readdirSync(path.join(root, 'docs', 'work-items')), [FEATURE]);
    assert.ok(fs.readdirSync(path.join(root, 'docs', 'work-items', FEATURE)).every(name => /^\d{4}-\d{2}-\d{2}-[a-z-]+$/.test(name)));
    assert.match(fs.readFileSync(path.join(root, 'docs', 'README.md'), 'utf8'), /\| 범위 · Feature \|/);
    // 05 design system and 09 architecture are product-wide: their two items sit outside every scope.
    assert.match(fs.readFileSync(path.join(root, 'docs', 'product', 'README.md'), 'utf8'), /\| \(제품 전체\) \| 2 \| 0 \| 0 \|\n\| reading-log \| 16 \| 0 \| 0 \|/);

    // A second scope: stages 1..3 for goal-tracking append their own `## 범위:` section to each
    // canonical file; the first scope's items keep their hashes and the index grows by three.
    const before = Object.fromEntries(Object.values(idChain.loadChainIndex(root).items).map(item => [item.id, item.hash]));
    const SECOND = 'goal-tracking';
    const additions = {
      1: '\n## 범위: goal-tracking\n문제: 읽기 목표가 없다.\n목표: 월별 목표 권수를 정한다.\n\n### REQ-003\n| 항목 | 내용 |\n|---|---|\n| 요구사항 | 월별 목표 권수를 정한다 |\n| 완료 조건 | 목표가 화면에 보인다 |\n',
      2: '\n## 범위: goal-tracking\n\n### F-003 ← REQ-003\n| 항목 | 내용 |\n|---|---|\n| 동작 | 목표 권수를 저장한다 |\n| 입력 | 권수 1~99 |\n| 출력 | 저장된 목표 |\n| 오류 | 0 이면 저장 불가 |\n| 규칙 | 월당 하나 |\n',
      3: '\n## 범위: goal-tracking\n\n### S-003 ← F-003\n| 항목 | 내용 |\n|---|---|\n| 담는 기능 | F-003 목표 설정 |\n| 이동 조건 | 저장하면 S-001 |\n| 흐름 파일 | S-001.mmd |\n',
    };
    for (const stage of stages.slice(0, 3)) {
      assert.equal(prompt.requestSlugFor(routePrompt(`/vais 범위: ${SECOND} ${stage.title}`, null), root), SECOND);
      runStage(root, stage, `stage-${stage.id.replace(/^stage-/, '')}`, {
        scope: SECOND,
        install: (dir, current) => {
          const file = path.join(dir, current.file);
          const text = fs.readFileSync(file, 'utf8');
          if (!text.includes(`## 범위: ${SECOND}`)) fs.writeFileSync(file, `${text.replace(/\s*$/, '\n')}${additions[current.order]}`);
        },
      });
    }
    const grown = idChain.loadChainIndex(root);
    assert.equal(Object.keys(grown.items).length, 21);
    for (const [id, hash] of Object.entries(before)) assert.equal(grown.items[id].hash, hash, `${id} untouched by the second scope`);
    assert.deepEqual(['REQ-003', 'F-003', 'S-003'].map(id => grown.items[id].scope), [SECOND, SECOND, SECOND]);
    assert.deepEqual(fs.readdirSync(path.join(root, 'docs', 'work-items')).sort(), [SECOND, FEATURE]);
    assert.equal(idChain.chainStatus(root).nextIds['stage-features'], 'F-004');
    assert.match(fs.readFileSync(path.join(root, 'docs', 'product', 'README.md'), 'utf8'), /\| goal-tracking \| 3 \| 0 \| 0 \|/);
    // Coverage stays per scope: the goal-tracking stage-4 check does not demand W items for reading-log's S-001/S-002.
    assert.deepEqual(idChain.computeStale(grown), []);

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
