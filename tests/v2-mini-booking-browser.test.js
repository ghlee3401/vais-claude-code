'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { findChrome, runAll } = require('../scripts/evaluation/mini-booking-browser');

describe('Mini Booking browser fixture', () => {
  it('defines desktop and mobile user-flow scenarios', () => {
    const manifest = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'fixtures/mini-booking/scenarios.json'), 'utf8'));
    assert.deepEqual(manifest.scenarios.map(item => item.id), [
      'initial', 'invalid-login', 'password-reset', 'login-book',
    ]);
    assert.ok(manifest.scenarios.some(item => item.viewport[0] === 390));
  });

  it('executes interactions and captures every state in a real browser', {
    skip: findChrome() ? false : 'Chrome/Chromium is unavailable',
  }, t => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-booking-test-'));
    t.after(() => fs.rmSync(outputDir, { recursive: true, force: true }));
    const result = runAll({ outputDir });
    assert.equal(result.verdict, 'pass');
    assert.equal(result.scenarios.length, 4);
    for (const scenario of result.scenarios) {
      assert.equal(scenario.verdict, 'pass');
      assert.ok(fs.statSync(scenario.screenshot).size > 1000);
    }
  });
});
