'use strict';

// Regression scene F (docs/harness/design.md §11): the harness must never die quietly.
// Four paths: mis-cased mode, unknown mode value, unreadable config, emergency switch.

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
});
