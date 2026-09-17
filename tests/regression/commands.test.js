'use strict';

// 명령 표 — 사용자 명령 (docs/harness/design.md §7)
// 검증: 상태·설명·저장·되돌리기·제안·기록 이 실제 git 저장소에서 표대로 동작. 모든 문장은 router 를 지나고,
//       쓰기 명령은 prompt hook 이 사용자 확인 문구를 세션 토큰으로 바꾼 뒤에만 실행된다.
//       저장은 `.gitignore` 에 `.vais/` 가 있는 저장소(실제 repo 와 같은 조건)에서 커밋까지 간다
// 렌더러: 해당 없음

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { execute } = require('../../scripts/vais-workflow-v2');
const { routePrompt } = require('../../lib/workflow/v2/router');
const { AuthorizationStore } = require('../../lib/workflow/v2/authorization-store');
const idChain = require('../../lib/workflow/v2/id-chain');
const { loadChainCatalog } = require('../../lib/workflow/v2/chain-registry');
const ledger = require('../../lib/workflow/v2/ledger');
const prompt = require('../../hooks/workflow-v2-prompt');
const helpers = require('./helpers');

const { FIXTURES, VERSION, git } = helpers;
const SESSION = 'commands-session';

function makeRoot(t) {
  const root = helpers.makeRoot(t, 'commands');
  helpers.writeVersionFiles(root, VERSION);
  fs.writeFileSync(path.join(root, '.gitignore'), '.vais/\nnode_modules/\n');
  for (const order of [1, 2]) {
    const stage = loadChainCatalog().stages.find(entry => entry.order === order);
    fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), path.join(root, stage.file));
    idChain.approveStage(root, stage, { workItem: `WI-2026-09-16-stage-${order}` });
  }
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'init']);
  return root;
}

// What the prompt hook does for a write command: no state event, but the user's own sentence
// becomes a confirmation token in this session's authorization.
function userTypes(root, sentence) {
  const route = routePrompt(sentence, null);
  if (route.mutationAllowed) {
    new AuthorizationStore(root).grant({ sessionId: SESSION, workItemId: null, phase: 'plan', action: route.action, allowedPaths: [], allowedCommands: [], confirmations: prompt.confirmationsFor(route) });
  } else {
    new AuthorizationStore(root).revoke(SESSION);
  }
  return route;
}

describe('commands — the user command table works end to end', () => {
  it('status · explain · ledger · save · revert · propose behave as the table says', t => {
    const root = makeRoot(t);

    // 상태: plain words, no active work.
    assert.equal(userTypes(root, '/vais 상태').action, 'status');
    assert.match(execute(['status'], root).summary, /^아직 시작한 작업이 없습니다\./);

    // 설명: ID, term, file, unknown.
    assert.equal(userTypes(root, '/vais 설명 F-002').action, 'explain');
    assert.match(execute(['explain', '--target', 'F-002'], root).text, /부모: REQ-002/);
    assert.equal(execute(['explain', '--target', '장부'], root).kind, 'term');
    assert.match(execute(['explain', '--target', 'docs/product/01-requirements.md'], root).text, /1단계 요구사항 정의서 정본/);
    assert.equal(execute(['explain', '--target', 'X-999'], root).kind, 'unknown');

    // 기록: without the user's sentence the CLI refuses; with it the ledger grows.
    assert.throws(() => execute(['ledger', 'add', '--session', SESSION, '--kind', 'preference', '--text', '버튼은 항상 파랑'], root), /직접 입력해야/);
    const note = userTypes(root, '/vais 기록 취향 버튼은 항상 파랑');
    assert.equal(note.action, 'ledger-add');
    const added = execute(['ledger', 'add', '--session', SESSION, '--kind', note.kind, '--text', note.text], root);
    assert.equal(added.entry.source.type, 'user');
    userTypes(root, '/vais 기록 보기 취향');
    assert.deepEqual(execute(['ledger', 'list', '--kind', 'preference'], root).entries.map(entry => entry.text), ['버튼은 항상 파랑']);

    // 저장: proposal first, commit only after `/vais 저장 확인`.
    fs.writeFileSync(path.join(root, 'app.txt'), 'v1');
    assert.equal(userTypes(root, '/vais 저장').action, 'save');
    const proposal = execute(['save', 'propose'], root);
    assert.equal(proposal.ok, true);
    assert.ok(proposal.changedFiles.some(entry => /app\.txt/.test(entry)));
    assert.match(proposal.confirmWith, /\/vais 저장 확인/);
    assert.throws(() => execute(['save', 'commit', '--session', SESSION], root), /직접 입력해야/);
    const confirm = userTypes(root, '/vais 저장 확인: feat: 앱 v1 추가 (WI-2026-09-16-app)');
    assert.equal(confirm.action, 'save-confirm');
    const saved = execute(['save', 'commit', '--session', SESSION, '--message', confirm.message], root);
    assert.equal(saved.subject, 'feat: 앱 v1 추가 (WI-2026-09-16-app)');
    assert.equal(git(root, ['rev-parse', 'HEAD']), saved.hash);
    assert.match(git(root, ['log', '-1', '--format=%B']), new RegExp(`Generated-By: vais-code ${VERSION.replaceAll('.', '\\.')}`));
    // The token was consumed with the turn: a second commit needs a new sentence.
    fs.writeFileSync(path.join(root, 'app.txt'), 'v2');
    userTypes(root, '/vais 상태');
    assert.throws(() => execute(['save', 'commit', '--session', SESSION], root), /직접 입력해야/);
    userTypes(root, '/vais 저장 확인');
    const second = execute(['save', 'commit', '--session', SESSION], root);
    assert.match(second.subject, new RegExp(`^chore: 작업 저장 \\(${VERSION.replaceAll('.', '\\.')}\\)$`));

    // 되돌리기: list, then revert only after `/vais 되돌리기 확인: <대상>`.
    assert.equal(userTypes(root, `/vais 되돌리기 ${saved.hash}`).action, 'revert');
    const plan = execute(['revert', 'propose', '--target', saved.hash], root);
    assert.equal(plan.ok, true);
    assert.deepEqual(plan.commits[0].files, ['app.txt']);
    assert.throws(() => execute(['revert', 'commit', '--session', SESSION, '--target', saved.hash], root), /직접 입력해야/);
    userTypes(root, `/vais 되돌리기 확인: ${second.hash}`);
    const reverted = execute(['revert', 'commit', '--session', SESSION, '--target', second.hash], root);
    assert.equal(reverted.reverted.length, 1);
    assert.equal(fs.readFileSync(path.join(root, 'app.txt'), 'utf8'), 'v1');
    assert.match(git(root, ['log', '-1', '--format=%s']), /^Revert/);
    assert.equal(execute(['revert', 'propose', '--target', 'WI-2026-09-16-none'], root).ok, false);

    // 제안: same engine as the briefing.
    assert.equal(userTypes(root, '/vais 제안').action, 'propose');
    const proposals = execute(['propose'], root).proposals;
    assert.ok(proposals.length >= 1 && proposals.length <= 3);
    assert.match(proposals[0].text, /3단계 화면 정의서 작성/);

    // The ledger holds exactly the user's note; nothing else was written by these commands.
    assert.deepEqual(ledger.read(root).entries.map(entry => [entry.kind, entry.source.type]), [['preference', 'user']]);
  });
});
