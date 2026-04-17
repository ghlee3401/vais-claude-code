/**
 * Advisor CLI smoke tests (v0.56 sub-plan 06 T-9)
 * scripts/advisor-call.js가 4 모드에서 기대 동작하는지 검증.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const CLI = path.resolve(__dirname, '..', 'scripts', 'advisor-call.js');

function makeTmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-cli-'));
  fs.mkdirSync(path.join(tmp, '.vais'), { recursive: true });
  return tmp;
}

function runCli(cwd, args, extraEnv = {}) {
  return spawnSync('node', [CLI, ...args], {
    cwd,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('CLI: required args 누락 시 exit 2 + usage 메시지', () => {
  const tmp = makeTmpProject();
  try {
    const r = runCli(tmp, []);
    assert.strictEqual(r.status, 2);
    assert.match(r.stderr, /required: --sub-agent/);
    assert.match(r.stderr, /usage:/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: disabled 모드 → exit 0 + skip 메시지', () => {
  const tmp = makeTmpProject();
  try {
    fs.writeFileSync(
      path.join(tmp, '.vais', 'advisor-mode.json'),
      JSON.stringify({ mode: 'disabled', detail: 'test' })
    );
    const r = runCli(tmp, [
      '--sub-agent=backend-engineer',
      '--c-level=cto',
      '--trigger=early',
      '--summary=test',
    ]);
    assert.strictEqual(r.status, 0);
    assert.match(r.stderr, /disabled/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: native 모드 → exit 0 + no-op 메시지', () => {
  const tmp = makeTmpProject();
  try {
    fs.writeFileSync(
      path.join(tmp, '.vais', 'advisor-mode.json'),
      JSON.stringify({ mode: 'native', detail: 'test' })
    );
    const r = runCli(tmp, [
      '--sub-agent=backend-engineer',
      '--c-level=cto',
      '--trigger=early',
    ]);
    assert.strictEqual(r.status, 0);
    assert.match(r.stderr, /native mode/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: wrapper 모드 + SDK 미설치 → exit 1 + advisor_call 이벤트(unavailable) 기록', () => {
  const tmp = makeTmpProject();
  try {
    fs.writeFileSync(
      path.join(tmp, '.vais', 'advisor-mode.json'),
      JSON.stringify({ mode: 'wrapper', detail: 'test' })
    );
    // 최소 config
    fs.writeFileSync(
      path.join(tmp, 'vais.config.json'),
      JSON.stringify({
        version: '0.55.0',
        workflow: { phases: ['plan'] },
        cSuite: { roles: {} },
        orchestration: { gateAction: 'confirm' },
        observability: { eventLog: '.vais/event-log.jsonl' },
        advisor: { max_calls_per_session: 15, monthly_budget_usd: 200 },
      })
    );

    const r = runCli(tmp, [
      '--sub-agent=backend-engineer',
      '--c-level=cto',
      '--trigger=early',
      '--summary=smoke test',
    ], { VAIS_SESSION_ID: 'cli-test-sess' });

    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}. stderr: ${r.stderr}`);
    assert.match(r.stderr, /unavailable/);

    const logPath = path.join(tmp, '.vais', 'event-log.jsonl');
    assert.ok(fs.existsSync(logPath), 'event log must exist');
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    assert.ok(lines.length > 0, 'at least one event logged');

    const event = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(event.event, 'advisor_call');
    assert.strictEqual(event.status, 'unavailable');
    assert.strictEqual(event.session_id, 'cli-test-sess');
    assert.strictEqual(event.sub_agent, 'backend-engineer');
    assert.strictEqual(event.c_level, 'cto');
    assert.strictEqual(event.trigger, 'early');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: parseArgs / ensureSessionId 단위', () => {
  const { parseArgs, ensureSessionId } = require('../scripts/advisor-call');
  const args = parseArgs(['node', 'script', '--sub-agent=be', '--trigger=stuck']);
  assert.strictEqual(args['sub-agent'], 'be');
  assert.strictEqual(args.trigger, 'stuck');

  const sid1 = ensureSessionId('explicit-id');
  assert.strictEqual(sid1, 'explicit-id');

  delete process.env.VAIS_SESSION_ID;
  const sid2 = ensureSessionId(undefined);
  assert.ok(sid2 && sid2.length > 0, 'should generate UUID');
});
