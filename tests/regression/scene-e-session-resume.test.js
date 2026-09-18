'use strict';

// 장면 E — 세션 끊김 뒤 재개 (docs/harness/design.md §11)
// 검증: Design 대기 중 세션이 끝난 뒤 새 세션이 상태 파일만으로 브리핑·상태 줄을 받고, 새 lease 로 승인·Do·QA·Report 를 마치며,
//       Stop 잠금이 미기록 상태를 한 번 막고, 제품 노트·decisions.md 가 Report 에서 나온다
// 렌더러: 해당 없음

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { WorkItemStore } = require('../../lib/workflow/v2/work-item-store');
const { EVENTS } = require('../../lib/workflow/v2/state-machine');
const { recordAutomaticHandoff } = require('../../lib/workflow/v2/automatic-handoff');
const { loadChainCatalog } = require('../../lib/workflow/v2/chain-registry');
const ledger = require('../../lib/workflow/v2/ledger');
const helpers = require('./helpers');
const stateStore = require('../../lib/core/state-store');
const { buildBriefing } = require('../../hooks/session-start');
const { stopDecision } = require('../../hooks/workflow-v2-stop');
const { statusLineText } = require('../../scripts/vais-statusline');

const { FIXTURES, write, grant } = helpers;
const FEATURE = 'reading-log';
const QA_PASS = helpers.qaPass('단계 문서 검사 통과', { decisions: ['형식·부모 확인'], inputs: ['stage doc'], evidence: ['stage-document check'] });

// A one-second lease so the second session can take over without waiting.
function makeRoot(t) {
  return helpers.makeRoot(t, 'scene-e', { workflowV2: { mode: 'enforce', leaseMs: 1000 } }, { name: 'reading-log' });
}

describe('scene E — a session dies while Design waits; the next session resumes from state alone', () => {
  it('briefs the new session, takes a fresh lease, finishes the stage, and writes the product note', t => {
    const root = makeRoot(t);
    const store = new WorkItemStore(root);
    const stage = loadChainCatalog().stages[0];
    const kind = 'stage-requirements';

    // Session A: Plan → approval → Design presented, then the session is gone.
    grant(root, 'session-a', null, 'plan', 'start-request', { requestSlug: FEATURE });
    write(root, '.vais/v2/drafts/plan.md', '요청 확인: 독서 기록 앱의 요구사항 정의서를 만든다.\nkind: stage-requirements\n단계: 1 요구사항 정의서\n');
    const plan = execute(['plan', 'present', '--slug', 'requirements', '--title', '1단계 요구사항 정의서', '--feature', FEATURE, '--relation', 'new',
      '--scale', 'compact', '--kind', kind, '--session', 'session-a', '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    let item = store.get(plan.workItemId);
    store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, { requireLease: true, sessionId: 'session-a' });
    item = store.get(item.id);
    grant(root, 'session-a', item, 'design');
    const designDraft = write(root, `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}/02-design/draft.md`,
      '# Design\n\n## 안 1\n요구사항 후보 8개 중 6개 채택\n\n## 쓰기 범위\n- docs/product/01-requirements.md\n\n## readiness · review\nstage-document / stage-document\n\n## rollback\n정본 삭제\n');
    execute(['design', 'present', '--id', item.id, '--session', 'session-a', '--revision', '1', '--body-file', designDraft,
      '--readiness-check', 'stage-document', '--review-check', 'stage-document'], root);
    item = store.get(item.id);
    assert.equal(`${item.phase}/${item.status}`, 'design/waiting-user');

    // Session B starts: the briefing comes from work-items, chain-index, and the ledger only.
    const briefing = buildBriefing(root);
    assert.match(briefing, /^\[reading-log · design · waiting-user\] 지난 세션: Design 제시 \(/);
    assert.match(briefing, /열린 결정 1, 부채 0, stale 0\. 제안: ① \/vais design 승인 ② \/vais <고칠 점>/);
    assert.equal(statusLineText(root, {}), 'VAIS · reading-log · design/waiting-user · 다음: /vais design 승인');

    // A different session id takes the lease once session A's 1s lease has expired, and approves.
    assert.throws(() => store.acquireLease(item.id, 'session-b'), /held by another session/);
    store.acquireLease(item.id, 'session-b', Date.now() + 1500);
    store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {}, { requireLease: true, sessionId: 'session-b' });
    item = store.get(item.id);
    assert.equal(item.phase, 'do');
    assert.deepEqual(ledger.read(root).entries.map(entry => entry.kind), ['milestone', 'milestone', 'decision']);

    grant(root, 'session-b', item, 'do');
    fs.mkdirSync(path.join(root, 'docs', 'product'), { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, '01-requirements.md'), path.join(root, stage.file));
    const doDraft = write(root, `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}/03-do/draft.md`, '# Do\n\n## 변경\n정본 작성.\n\n## 증거\nstage-document.\n');
    const ready = execute(['do', 'ready', '--id', item.id, '--session', 'session-b', '--revision', '1', '--body-file', doDraft], root);
    assert.equal(ready.verdict, 'READY');
    item = store.get(item.id);

    // The Stop lock: everything so far is recorded, so the turn may end.
    assert.equal(stopDecision(root, { session_id: 'session-b' }, { env: {} }).decision, 'allow');

    grant(root, 'session-b', item, 'review');
    execute(['review', 'prepare', '--id', item.id, '--session', 'session-b', '--revision', '1'], root);
    const assignment = execute(['assignment', '--id', item.id, '--session', 'session-b', '--role', 'independent-qa', '--delegated-by', 'ceo',
      '--phase', 'review', '--mode', 'verification', '--question', '검사', '--code-write', 'false', '--criterion', 'pass', '--ref', stage.file, '--clean-room', 'true'], root);
    store.recordAssignmentUse(item.id, assignment.assignmentReceipt.id, 'session-b');
    recordAutomaticHandoff(root, { workItemId: item.id, sessionId: 'session-b', assignmentId: assignment.assignmentReceipt.id, handoff: QA_PASS });
    const reviewDraft = write(root, `docs/work-items/${FEATURE}/${item.id.replace(/^WI-/, '')}/04-review/draft.md`, '# Review\n\n## 기대 · 실제\n통과 / 통과\n\n## 증거\nQA handoff\n');
    assert.equal(execute(['review', 'decide', '--id', item.id, '--session', 'session-b', '--revision', '1', '--body-file', reviewDraft], root).verdict, 'PASS');
    store.apply(item.id, EVENTS.USER_FINAL_APPROVED, {}, { requireLease: true, sessionId: 'session-b' });
    item = store.get(item.id);
    grant(root, 'session-b', item, 'report');
    const report = execute(['report', 'finalize', '--id', item.id, '--session', 'session-b', '--revision', '1', '--outcome', '요구사항 승인', '--limitation', 'ISBN 은 다음 작업'], root);
    assert.equal(report.verdict, 'PASS');

    // Product note: 현재·다음·왜 exist and reflect the finished stage and the ledger.
    const current = fs.readFileSync(path.join(root, 'docs', 'product', 'README.md'), 'utf8');
    assert.match(current, /\| 1 \| \[요구사항 정의서\]\(01-requirements\.md\) \| approved \| 2 \|/);
    const roadmap = fs.readFileSync(path.join(root, 'docs', 'product', 'roadmap.md'), 'utf8');
    assert.match(roadmap, /- 2단계 기능 정의서/);
    assert.match(roadmap, /1\. 2단계 기능 정의서 작성 — `\/vais 기능 정의서`/);
    const decisions = fs.readFileSync(path.join(root, 'docs', 'product', 'decisions.md'), 'utf8');
    assert.match(decisions, /## 이정표 \(4\)/);
    assert.match(decisions, /작업 완료 — 1단계 요구사항 정의서/);
    assert.match(decisions, /## 부채 \(1\)[\s\S]*ISBN 은 다음 작업/);
    assert.match(decisions, /## 결정 \(1\)[\s\S]*안 1/);
    assert.match(buildBriefing(root), /^\[VAIS · 활성 작업 없음\] 지난 작업 1개\. 열린 결정 0, 부채 1, stale 0\. 제안: ① \/vais 기능 정의서/);

    // Stop lock on a bypassed state change: blocks once, then records a risk and passes.
    const next = store.create({ id: 'WI-2026-09-16-features', title: '2단계', primaryFeature: FEATURE, affectedFeatures: [], scale: 'compact', kind: 'stage-features' });
    store.setRepoSnapshot(next.id, require('../../lib/workflow/v2/repo-drift').captureRepoSnapshot(root), { reason: 'test' });
    stateStore.lockedUpdate(store.statePath, raw => {
      raw.workItems[next.id].updatedAt = new Date(Date.now() + 60_000).toISOString();
      return raw;
    });
    const blocked = stopDecision(root, { session_id: 'session-b' }, { env: {} });
    assert.equal(blocked.decision, 'block');
    assert.match(blocked.reason, /사건도 장부에도 없다/);
    assert.equal(stopDecision(root, { session_id: 'session-b', stop_hook_active: true }, { env: {} }).decision, 'allow');
    assert.ok(ledger.read(root).entries.some(entry => entry.kind === 'risk' && /Stop 잠금 경고/.test(entry.text)));
  });
});
