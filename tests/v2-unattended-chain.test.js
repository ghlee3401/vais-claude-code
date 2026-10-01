'use strict';

// unattended-chain U1 (4.4.0): friction the harness made for itself is absorbed by the runtime.
// TC ids follow the Design of WI-2026-09-29-unattended-chain.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { describe, it } = require('node:test');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { resolveSessionAuthorization } = require('../lib/workflow/v2/authorization-continuity');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { EVENTS } = require('../lib/workflow/v2/state-machine');
const { writePhaseDocument } = require('../lib/workflow/v2/document-manager');
const { authorizeCommand, defaultAllowedPaths } = require('../lib/workflow/v2/write-policy');
const { segmentCommand, parseRedirections } = require('../lib/workflow/v2/shell-policy');
const { normalizeIdentifiers, traceabilityReport, describeRequiredSections, OPTION_LIMITS, inspectPhaseDocument } = require('../lib/workflow/v2/phase-check');
const { runPhaseTransaction } = require('../lib/workflow/v2/phase-transaction');
const { routePrompt } = require('../lib/workflow/v2/router');
const { normalizeSentence } = require('../lib/workflow/v2/naming');
const { decide } = require('../hooks/workflow-v2-write-guard');
const prompt = require('../hooks/workflow-v2-prompt');
const { execute } = require('../scripts/vais-workflow-v2');
const ledger = require('../lib/workflow/v2/ledger');

const REPO = path.join(__dirname, '..');
const T0 = '2026-09-29T00:00:00.000Z';
const SESSION = 'session-u1';

function fixture(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-u1-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ workflowV2: { mode: 'enforce', ...extra } }));
  return root;
}

function scratchDir() {
  const dir = path.join(os.tmpdir(), `claude-${process.getuid ? process.getuid() : 'u'}`, 'vais-u1-scratch');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function gate(gateName, verdict, check) {
  return { gateResult: { gate: gateName, verdict, requiredChecks: [check], passed: [check], failed: [], blocked: [], missing: [], evaluatedAt: T0 } };
}

const PLAN = [
  '# Plan', '## 문제', '문제 설명', '## 목표', '목표 설명', '## 범위', '포함/제외',
  '## 요구사항', 'REQ-001: 동작', '## 사용자 흐름', '흐름', '## 엣지 케이스', '경계',
  '## 완료 조건', '완료', '## 영향', '영향',
].join('\n');

// A harness Work item that reached do/active with an approved Design: the state Do works in.
function doActiveItem(root, id = 'WI-2026-09-29-u1') {
  const store = new WorkItemStore(root);
  let item = store.create({ id, title: 'U1', primaryFeature: 'u1', affectedFeatures: [], scale: 'compact', kind: 'harness' }, T0);
  writePhaseDocument(root, item, 'plan', PLAN, { status: 'draft' });
  item = store.apply(item.id, EVENTS.PLAN_PRESENTED, gate('plan', 'PASS', 'plan-document'), { timestamp: T0 });
  item = store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
  item = store.apply(item.id, EVENTS.DESIGN_SCOPE_DEFINED, { writeScopes: ['src/**'], readinessChecks: ['test'], reviewChecks: ['test'], requiredSpecialists: [] }, { timestamp: T0 });
  writePhaseDocument(root, item, 'design', '# Design\n\nREQ-001 동작\n\nTC-001', { status: 'draft' });
  item = store.apply(item.id, EVENTS.DESIGN_PRESENTED, gate('design', 'PASS', 'design-document'), { timestamp: T0 });
  item = store.apply(item.id, EVENTS.USER_DESIGN_APPROVED, {}, { timestamp: T0 });
  return { store, item };
}

function runHook(root, script, input) {
  const result = spawnSync(process.execPath, [path.join(REPO, 'hooks', script)], { cwd: root, input: JSON.stringify(input), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout || '{}');
}

describe('unattended-chain TC-001 an expired authorization is revived for the same session and Work item', () => {
  it('revives on the current do/active Work item and keeps refusing other sessions, items, and phases', t => {
    const root = fixture(t, { authorizationTtlMs: 1000 });
    const { store, item } = doActiveItem(root);
    const authorizations = new AuthorizationStore(root);
    authorizations.grant({ sessionId: SESSION, workItemId: item.id, phase: 'do', allowedPaths: defaultAllowedPaths(item), allowedCommands: [] }, T0);
    const later = '2026-09-29T00:00:05.000Z';
    assert.equal(authorizations.get(SESSION, later), null, 'the TTL has lapsed');
    const revived = resolveSessionAuthorization(root, SESSION, { timestamp: later, authorizations, workItems: store });
    assert.ok(revived, 'same session on the current Work item continues');
    assert.equal(revived.expiresAt, '2026-09-29T00:00:06.000Z');
    assert.equal(resolveSessionAuthorization(root, 'session-other', { timestamp: later, authorizations, workItems: store }), null);

    authorizations.grant({ sessionId: 'session-stale', workItemId: item.id, phase: 'design', allowedPaths: defaultAllowedPaths(item), allowedCommands: [] }, T0);
    assert.equal(resolveSessionAuthorization(root, 'session-stale', { timestamp: later, authorizations, workItems: store }), null, 'phase mismatch expires');
    authorizations.grant({ sessionId: 'session-scope', workItemId: item.id, phase: 'do', allowedPaths: ['elsewhere/**'], allowedCommands: [] }, T0);
    assert.equal(resolveSessionAuthorization(root, 'session-scope', { timestamp: later, authorizations, workItems: store }), null, 'scope mismatch expires');
    authorizations.grant({ sessionId: 'session-start', workItemId: null, phase: 'plan', action: 'start-request', allowedPaths: ['.vais/v2/drafts/**'], allowedCommands: [] }, T0);
    assert.equal(resolveSessionAuthorization(root, 'session-start', { timestamp: later, authorizations, workItems: store }), null, 'Work-item-less authorizations still end at the TTL');
  });

  it('lets do ready and the write guard proceed after the TTL for the same session', t => {
    const root = fixture(t, { authorizationTtlMs: 1000 });
    const { item } = doActiveItem(root);
    new AuthorizationStore(root).grant({ sessionId: SESSION, workItemId: item.id, phase: 'do', allowedPaths: defaultAllowedPaths(item), allowedCommands: [] }, T0);
    const later = '2026-09-29T00:00:05.000Z';
    // The fixture has no test runner, so readiness may end NOT_READY or fail on the check itself;
    // what must not happen is the authorization refusal that stopped po_report four times.
    let outcome = null;
    try {
      outcome = runPhaseTransaction(root, {
        phase: 'do', action: 'ready', id: item.id, sessionId: SESSION, revision: 1, timestamp: later,
        body: '# Do\n\n## 변경\n\n구현 changes\n\n## 증거\n\ntest evidence',
      }).verdict;
    } catch (error) {
      assert.notEqual(error.code, 'AUTHORIZATION_REQUIRED', error.message);
      outcome = error.code || 'error';
    }
    assert.ok(outcome, 'the transaction went past the authorization check');
    assert.ok(new AuthorizationStore(root).get(SESSION, later), 'the authorization was revived on the way');
    const guardAuth = resolveSessionAuthorization(root, SESSION, { timestamp: '2026-09-29T00:00:09.000Z' });
    assert.equal(decide({ tool_name: 'Edit', tool_input: { file_path: path.join(root, 'docs', 'work-items', 'u1', '2026-09-29-u1', '03-do', 'main.md') } }, root, guardAuth).allowed, true);
    assert.throws(() => runPhaseTransaction(root, {
      phase: 'do', action: 'ready', id: item.id, sessionId: 'session-other', revision: 1, timestamp: later,
      body: '# Do\n\n## 변경\n\n구현\n\n## 증거\n\n검증',
    }), error => error.code === 'AUTHORIZATION_REQUIRED');
  });
});

describe('unattended-chain TC-002 loose identifiers are corrected, extra Review TCs warn, sections are announced', () => {
  it('normalizes unambiguous identifiers and leaves ambiguous ones for the finding', () => {
    const { content, corrections } = normalizeIdentifiers('REQ 16 · TC-3 · req_7 · REQ-16a · REQ 1600 · REQ-001 · TC-045');
    assert.match(content, /^REQ-016 · TC-003 · REQ-007 · REQ-16a · REQ 1600 · REQ-001 · TC-045$/);
    assert.deepEqual(corrections, [
      { from: 'REQ 16', to: 'REQ-016' }, { from: 'TC-3', to: 'TC-003' }, { from: 'req_7', to: 'REQ-007' },
    ]);
    // QA repair 1: prose counts with a unit word are not identifiers.
    const prose = normalizeIdentifiers('요구사항은 REQ 3개, 검수는 TC 2개다. TC 4건 · REQ 5항목');
    assert.equal(prose.content, '요구사항은 REQ 3개, 검수는 TC 2개다. TC 4건 · REQ 5항목');
    assert.deepEqual(prose.corrections, []);
    // QA repair 2: a percentage, a range, and a file name keep their digits; document punctuation still counts.
    const mixed = normalizeIdentifiers('TC 100% 통과, REQ 1~6 전부, 그림 tc-1.png 참고. REQ 7, TC 8; (TC 9) | REQ 2.');
    assert.equal(mixed.content, 'TC 100% 통과, REQ 1~6 전부, 그림 tc-1.png 참고. REQ-007, TC-008; (TC-009) | REQ-002.');
    // QA repair 3: a prefix glued to text in front of it is not an identifier.
    const glued = normalizeIdentifiers('한글TC 3 · v1.TC 3 · a/TC 3 · xREQ 4 · (TC 3)');
    assert.equal(glued.content, '한글TC 3 · v1.TC 3 · a/TC 3 · xREQ 4 · (TC-003)');
  });

  it('shows corrections next to the plan present receipt on the CLI', t => {
    const root = fixture(t);
    const draft = path.join(root, '.vais', 'v2', 'drafts', 'plan.md');
    fs.mkdirSync(path.dirname(draft), { recursive: true });
    fs.writeFileSync(draft, PLAN.replace('REQ-001', 'REQ 1'));
    new AuthorizationStore(root).grant({ sessionId: SESSION, workItemId: null, phase: 'plan', action: 'start-request', requestSlug: 'loose-ids', allowedPaths: ['.vais/v2/drafts/**'], allowedCommands: [] });
    const output = execute(['plan', 'present', '--slug', 'loose-ids', '--title', 'Loose', '--feature', 'loose-ids', '--relation', 'new', '--scale', 'compact', '--kind', 'harness',
      '--session', SESSION, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(output.verdict, 'PASS');
    assert.deepEqual(output.corrections, [{ from: 'REQ 1', to: 'REQ-001' }]);
  });

  it('warns on Review TCs the Design did not declare and fails only on missing ones', t => {
    const root = fixture(t);
    const { item } = doActiveItem(root);
    const extra = traceabilityReport(root, item, 'review', '# Review\n\nREQ-001 TC-001 TC-002');
    assert.deepEqual(extra.findings, []);
    assert.match(extra.warnings[0], /adds TCs the Design did not declare: TC-002/);
    const missing = traceabilityReport(root, item, 'review', '# Review\n\nREQ-001 TC-002');
    assert.match(missing.findings[0], /review TC trace set is missing: TC-001/);
    const check = inspectPhaseDocument(root, item, 'review', {
      path: 'docs/work-items/u1/2026-09-29-u1/04-review/main.md',
      document: { data: { schema: 'vais-phase/v1', work_item: item.id, phase: 'review', revision: 1 }, content: '# Review\n\nREQ-001 TC-001 TC-002\n입력 input 출력 output\n기대 expected 실제 actual 결과\n엣지 edge 제한\nevidence 증거' },
      markdown: '# Review\n\nREQ-001 TC-001 TC-002\n입력 input 출력 output\n기대 expected 실제 actual 결과\n엣지 edge 제한\nevidence 증거',
    });
    assert.equal(check.verdict, 'pass');
    assert.equal(check.warnings.length, 1);
    assert.match(check.summary, /1 warning/);
  });

  it('announces the required sections and the option limit from the same constants', () => {
    const design = describeRequiredSections({ kind: 'stage-features', scale: 'standard' }, 'design');
    assert.match(design, /design 필수 절: ## 안 N · write scope/);
    assert.match(design, new RegExp(`standard 규모는 안 ${OPTION_LIMITS.standard}개까지`));
    const plan = describeRequiredSections({ kind: 'harness', scale: 'compact' }, 'plan');
    assert.match(plan, /문제 · 목표 · 범위 · REQ-nnn 요구사항 · 사용자 흐름 · 엣지 케이스 · 완료 조건 · 영향/);
    const guidance = prompt.phaseGuidance({ id: 'WI-2026-09-29-g', primaryFeature: 'g', phase: 'design', status: 'active', designRevision: 1, planRevision: 1, scale: 'standard', kind: 'stage-features', qaRepairCount: 0 }, 'sess').join('\n');
    assert.match(guidance, new RegExp(`standard 규모는 안 ${OPTION_LIMITS.standard}개까지`));
    assert.match(guidance, /접미 글자·네 자리는 거부/);
  });
});

describe('unattended-chain TC-003 composed shell commands are judged piece by piece', () => {
  const projectRoot = '/repo';
  const scratch = scratchDir();
  const auth = { allowedPaths: ['src/**', 'docs/work-items/u1/**'], allowedCommands: [] };
  const options = { projectRoot, cwd: projectRoot };

  it('allows read-only and check pieces, scratchpad redirections, and scratchpad scripts', () => {
    for (const command of [
      'cat a.log | grep FAIL',
      'grep -c x a || git status',
      'git status; git diff',
      'cat a | head -5 | wc -l',
      'grep -c x a',
      'git diff --cached',
      'git log --oneline -5',
      `cat a > ${path.join(scratch, 'o.txt')}`,
      'ls\ngit log -3',
      'timeout 30 git log -1',
      'cat `git rev-parse --show-toplevel`/package.json',
      'cat a 2>/dev/null',
      'git diff 2>&1',
    ]) {
      const result = authorizeCommand(command, null, options);
      assert.equal(result.allowed, true, `${command}: ${result.reason}`);
    }
    assert.equal(authorizeCommand(`node ${path.join(scratch, 's.js')}`, auth, options).kind, 'check');
    assert.equal(authorizeCommand(`node ${path.join(scratch, 's.js')}`, null, options).allowed, false);
    assert.equal(authorizeCommand('cat a > src/out.txt', auth, options).allowed, true);
    assert.equal(authorizeCommand('cd src; cat a > out.txt', auth, options).allowed, true, 'cd moves the base of later pieces');
    // Checks keep working as written, with named flags only.
    assert.equal(authorizeCommand('npm test', auth, options).allowed, true);
    assert.equal(authorizeCommand('npm run regression', auth, options).allowed, true);
    assert.equal(authorizeCommand('node --test --test-reporter=dot tests/*.test.js', auth, options).allowed, true);
    assert.equal(authorizeCommand('npx eslint lib hooks', auth, options).allowed, true);
  });

  it('refuses out-of-scope redirections, destructive commands, unknown pieces, and unreadable shapes', () => {
    for (const command of [
      'cat a > src/x.js',
      'cat a > docs/other.md',
      'rm -rf x',
      'git push --force',
      'git commit --no-verify -m x',
      'ls; touch src/p.js',
      'cat $(touch p)',
      'cat "$(touch p)"',
      'grep x a >| b',
      "grep 'x a",
      'node ./s.js',
      'sleep 5 &',
      '(cd x && ls)',
      'cat <<EOF > src/a.txt',
      'xargs rm < list',
      'sudo ls',
      'uniq a b',
      'sort -o src/x a',
      // QA repair 1: targets the shell would expand are not literal paths.
      'cat x > ~/.bashrc',
      'cat x > $HOME/a',
      'cat x > "$(pwd)/a"',
      `cd ${scratch}; cat x > ~/.bashrc`,
      'cd; cat x > a.txt',
      'cd -; cat x > a.txt',
      'cd ~; cat x > a.txt',
      'node ~/s.js',
      'node $HOME/s.js',
      'cat x > src/*.txt',
      // QA repair 2: ANSI-C quoting, preload flags, brace expansion.
      "cat $'\\''; touch M; cat \\'",
      'cat $"x"; touch M',
      `node --require=/x/e.js ${path.join(scratch, 's.js')}`,
      `node -r /x/e.js ${path.join(scratch, 's.js')}`,
      `node ${path.join(scratch, '{a,b}.js')}`,
      `cat x > ${path.join(scratch, '{a,b}.txt')}`,
      // QA repair 3: tools with output-file modes are no longer read-only; attached and abbreviated flags are caught.
      'sort -osrc/x.js a',
      'sort --out=src/x.js a',
      'sort --compress-program=touch a',
      'uniq a -- src/x.js',
      'file -C -m src/m',
      'git diff --ext',
      'git log --out=src/l',
      'npx eslint -c /x/e.js src',
      'npx eslint --config=/x/e.js src',
      // QA repair 4: the command word must be bare; checks take no pass-through or code-loading arguments.
      'tr\\uncate -s0 src/x.js',
      'tr{u,}ncate -s0 src/x.js',
      'comm\\and rm -rf /',
      '"cat" a',
      'c\\at a',
      'npx eslint -f /x/f.js src',
      'npx eslint --format /x/f.js src',
      'npm run lint -- -c evil.js',
      'npm test -- --x',
      'npm run lint --silent',
      'node --test --test-reporter=/x/r.js tests',
      'node --test --require=/x/e.js tests',
      'rg --hostname-bin=touch x',
      'cut -d, -f1 a',
      'echo x',
      'sort a',
      'find . -e\\xec rm {} ;',
      'find . -{,}exec rm {} ;',
      'cat my\\ file',
      'cat ${HOME:-/etc}/x',
      'cat x > ${HOME}/y',
      `cd ${scratch}; npx eslint .`,
      'node --test /x/e.js',
      `node --test ${path.join(scratch, 'e.test.js')}`,
      'node --test tests/../lib/x.js',
    ]) {
      const result = authorizeCommand(command, command.startsWith('cat a > src') || command.startsWith('sort -o') ? null : auth, options);
      assert.equal(result.allowed, false, command);
    }
    assert.match(authorizeCommand('ls; touch src/p.js', auth, options).reason, /piece: touch src\/p\.js/);
    assert.match(authorizeCommand(`cd ${scratch}; cat x > ~/.bashrc`, null, options).reason, /literal path/);
    assert.match(authorizeCommand('cd; cat x > a.txt', auth, options).reason, /cd target must be a literal path/);
    assert.match(authorizeCommand("cat $'\\''; touch M; cat \\'", auth, options).reason, /ANSI-C/);
    assert.equal(segmentCommand("cat $'\\''; touch M; cat \\'").ok, false);
    assert.match(authorizeCommand('tr\\uncate -s0 src/x.js', null, options).reason, /backslash/);
    assert.match(authorizeCommand('"cat" a', null, options).reason, /bare identifier/);
    assert.match(authorizeCommand(`cd ${scratch}; npx eslint .`, auth, options).reason, /project root/);
    assert.match(authorizeCommand('npm run lint -- -c evil.js', auth, options).reason, /pass-through/);
    assert.match(authorizeCommand('npx eslint -f /x/f.js src', auth, options).reason, /path operands only/);
  });

  it('parses quotes, substitutions, and redirections faithfully', () => {
    assert.deepEqual(segmentCommand("grep 'a;b|c' f && cat done").segments, ["grep 'a;b|c' f", 'cat done']);
    assert.deepEqual(segmentCommand('grep "a\\"b" f').segments, ['grep "a\\"b" f'], 'a backslash inside double quotes is kept');
    assert.equal(segmentCommand('cat a\\ b').ok, false);
    assert.equal(segmentCommand('cat {a,b}').ok, false);
    assert.deepEqual(segmentCommand('node ${CLAUDE_PLUGIN_ROOT}/scripts/vais-workflow-v2.js status').segments, ['node ${CLAUDE_PLUGIN_ROOT}/scripts/vais-workflow-v2.js status']);
    assert.deepEqual(segmentCommand('cat "$(git rev-parse HEAD)"').segments, ['git rev-parse HEAD', 'cat "__VAIS_SUBST__"']);
    assert.equal(segmentCommand('ls &').ok, false);
    const parsed = parseRedirections('cat a 2>/dev/null >> out.txt < in.txt');
    assert.equal(parsed.text, 'cat a');
    assert.deepEqual(parsed.redirections.map(entry => [entry.operator, entry.target, entry.direction]), [['>', '/dev/null', 'output'], ['>>', 'out.txt', 'output'], ['<', 'in.txt', 'input']]);
    assert.equal(parseRedirections('head -20 a').text, 'head -20 a');
  });

  it('applies the same judgement through the write guard with the hook cwd', t => {
    const root = fixture(t);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    const guardAuth = { allowedPaths: ['src/**'], allowedCommands: [] };
    assert.equal(decide({ tool_name: 'Bash', cwd: root, tool_input: { command: 'cat a | grep b > src/out.txt' } }, root, guardAuth).allowed, true);
    assert.equal(decide({ tool_name: 'Bash', cwd: path.join(root, 'src'), tool_input: { command: 'cat a > out.txt' } }, root, guardAuth).allowed, true);
    assert.equal(decide({ tool_name: 'Bash', cwd: root, tool_input: { command: 'cat a > out.txt' } }, root, guardAuth).allowed, false);
  });
});

describe('unattended-chain TC-004 a pasted multi-line sentence becomes one token line', () => {
  it('normalizes the router text and lets the CLI accept the raw multi-line argument', t => {
    const root = fixture(t);
    const raw = '기록 결정 첫 줄이고\n  둘째 줄이며\n  셋째 줄이다.';
    const route = routePrompt(`/vais ${raw}`, null);
    assert.equal(route.action, 'ledger-add');
    assert.equal(route.text, '첫 줄이고 둘째 줄이며 셋째 줄이다.');
    const output = runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: `/vais ${raw}` });
    assert.match(output.hookSpecificOutput.additionalContext, /ledger add --session session-u1 --kind decision --text "첫 줄이고 둘째 줄이며 셋째 줄이다\."/);
    const added = execute(['ledger', 'add', '--session', SESSION, '--kind', 'decision', '--text', '첫 줄이고\n  둘째 줄이며\n  셋째 줄이다.'], root);
    assert.equal(added.entry.text, '첫 줄이고 둘째 줄이며 셋째 줄이다.');
    assert.equal(ledger.read(root).entries.length, 1);
    assert.equal(routePrompt('/vais 저장 확인: 제목\n  본문 줄', null).message, '제목 본문 줄');
    assert.equal(normalizeSentence('  a \n\n  b\tc '), 'a b c');
  });
});

describe('unattended-chain TC-005 a typed Feature name survives until the Work item exists', () => {
  it('keeps the name across a read-only turn and a bare confirmation, then clears it', t => {
    const root = fixture(t);
    fs.mkdirSync(path.join(root, '.vais', 'v2', 'drafts'), { recursive: true });
    fs.writeFileSync(path.join(root, '.vais', 'v2', 'drafts', 'plan.md'), PLAN);
    runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '/vais 이름: my-feature 시작하자' });
    const authorizations = new AuthorizationStore(root);
    assert.equal(authorizations.pendingName(SESSION), 'my-feature');
    runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '/vais 상태' });
    assert.equal(authorizations.pendingName(SESSION), 'my-feature', 'a read-only command keeps the name');
    runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '그냥 물어보는 말' });
    assert.equal(authorizations.pendingName(SESSION), 'my-feature', 'an unmanaged turn keeps the name');
    const confirm = runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '/vais 확인' });
    assert.match(confirm.hookSpecificOutput.additionalContext, /slug는 `my-feature`/);
    const receipt = execute(['plan', 'present', '--slug', 'my-feature', '--title', 'Mine', '--feature', 'my-feature', '--relation', 'new', '--scale', 'compact', '--kind', 'harness',
      '--session', SESSION, '--revision', '1', '--body-file', '.vais/v2/drafts/plan.md'], root);
    assert.equal(receipt.verdict, 'PASS');
    assert.equal(authorizations.pendingName(SESSION), null, 'the name is consumed by the Work item');
  });

  it('replaces the name when the user types another one', t => {
    const root = fixture(t);
    runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '/vais 이름: first-name' });
    runHook(root, 'workflow-v2-prompt.js', { cwd: root, session_id: SESSION, prompt: '/vais 이름: second-name' });
    assert.equal(new AuthorizationStore(root).pendingName(SESSION), 'second-name');
  });
});

describe('unattended-chain TC-006 documents and version', () => {
  it('stamps 4.4.0 on every manifest and documents the new rules', () => {
    const read = relative => fs.readFileSync(path.join(REPO, relative), 'utf8');
    for (const file of ['package.json', 'vais.config.json', '.claude-plugin/plugin.json']) {
      assert.equal(JSON.parse(read(file)).version, '4.4.0', file);
    }
    const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
    assert.equal(marketplace.metadata.version, '4.4.0');
    assert.equal(marketplace.plugins[0].version, '4.4.0');
    assert.equal(JSON.parse(read('package-lock.json')).version, '4.4.0');
    assert.match(read('README.md'), /version-4\.4\.0/);
    assert.match(read('README.md'), /셸 정책 \(4\.4\.0\)/);
    assert.match(read('README.md'), /인가는 휴지 시간 \(4\.4\.0\)/);
    assert.match(read('CHANGELOG.md'), /## \[4\.4\.0\]/);
    assert.match(read('CLAUDE.md'), /조각마다 판정/);
    assert.match(read('CLAUDE.md'), /인가는 휴지 시간/);
    assert.match(read('docs/harness/design.md'), /인가 연속성 \(U1\)/);
    assert.match(read('docs/harness/roadmap.md'), /\| U1 \| 완료 \|/);
    assert.match(read('ONBOARDING.md'), /셸 조각 판정/);
  });
});
