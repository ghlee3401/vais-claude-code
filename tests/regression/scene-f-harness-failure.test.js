'use strict';

// 장면 F — 하네스 고장 (docs/harness/design.md §11)
// 검증: 하네스는 조용히 죽지 않는다 — 대소문자 다른 mode 는 정상, 알 수 없는 mode 는 닫힌 채 매 프롬프트 경고,
//       읽을 수 없는 설정도 경고, 비상 스위치는 눈에 보이게 끈다
// 렌더러: 해당 없음

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { resolveMode, warningLine } = require('../../lib/workflow/v2/config');
const { authorizeFilePath, authorizeCommand } = require('../../lib/workflow/v2/write-policy');
const prompt = require('../../hooks/workflow-v2-prompt');

function root(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-scene-f-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'vais.config.json'), typeof config === 'string' ? config : JSON.stringify(config));
  return dir;
}

describe('scene F — harness failure is loud, never silent', () => {
  it('a mis-cased mode keeps working normally', t => {
    const dir = root(t, { workflowV2: { mode: 'Enforce' } });
    const resolved = resolveMode(dir, {});
    assert.equal(resolved.mode, 'enforce');
    assert.equal(warningLine(resolved), null);
  });

  it('an unknown mode value keeps the guards closed and warns on every prompt', t => {
    const dir = root(t, { workflowV2: { mode: 'enforcee' } });
    const resolved = resolveMode(dir, {});
    assert.equal(resolved.mode, 'enforce');
    assert.match(warningLine(resolved), /mode 값 오류\("enforcee"\)/);
    assert.equal(authorizeFilePath(dir, path.join(dir, 'src', 'app.js'), null).allowed, false);
    assert.equal(authorizeCommand('git commit -m x', null).allowed, false);
  });

  it('an unreadable config warns instead of opening the harness', t => {
    const dir = root(t, '{ broken');
    const resolved = resolveMode(dir, {});
    assert.equal(resolved.mode, 'enforce');
    assert.match(warningLine(resolved), /읽을 수 없다/);
  });

  it('the emergency switch turns the harness off visibly', t => {
    const dir = root(t, { workflowV2: { mode: 'enforce' } });
    const resolved = resolveMode(dir, { VAIS_HARNESS_OFF: 'true' });
    assert.equal(resolved.mode, 'off');
    const context = prompt.harnessInactiveContext(resolved);
    assert.match(context, /하네스 비활성/);
    assert.match(context, /VAIS_HARNESS_OFF/);
  });

  // unattended-chain U1: friction is absorbed, the guard rails stay.
  it('a composed read-only command passes while a hidden mutation in any piece still fails closed', t => {
    const dir = root(t, { workflowV2: { mode: 'enforce' } });
    assert.equal(authorizeCommand('cat a.log | grep FAIL', null, { projectRoot: dir, cwd: dir }).allowed, true);
    assert.equal(authorizeCommand('git status; git diff', null, { projectRoot: dir, cwd: dir }).allowed, true);
    const hidden = authorizeCommand('git status && rm -rf src', null, { projectRoot: dir, cwd: dir });
    assert.equal(hidden.allowed, false);
    assert.match(hidden.reason, /piece: rm -rf src/);
    assert.equal(authorizeCommand('cat a > src/x.js', null, { projectRoot: dir, cwd: dir }).allowed, false);
    assert.equal(authorizeCommand('cat x > ~/.bashrc', null, { projectRoot: dir, cwd: dir }).allowed, false, 'expansion targets are never literal paths');
    assert.equal(authorizeCommand("cat $'\\''; touch M; cat \\'", null, { projectRoot: dir, cwd: dir }).allowed, false, 'ANSI-C quoting is refused whole');
    assert.equal(authorizeCommand('sort -osrc/x.js a', null, { projectRoot: dir, cwd: dir }).allowed, false, 'tools with output-file modes are not read-only');
    assert.equal(authorizeCommand('tr\\uncate -s0 src/x.js', null, { projectRoot: dir, cwd: dir }).allowed, false, 'the command word must be bare');
  });
});
