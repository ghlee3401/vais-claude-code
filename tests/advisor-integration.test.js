/**
 * Advisor Integration tests
 * v0.50 sub-plan 04: prompt-builder + schema 검증
 * v0.56 sub-plan 06: wrapper.callAdvisor cost-monitor + observability 연결 검증
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { buildAdvisorPrompt, TRIGGER_TEMPLATES } = require('../lib/advisor/prompt-builder');
const schema = require('../lib/observability/schema');

test('TRIGGER_TEMPLATES: 4종 모두 존재', () => {
  for (const t of ['early', 'stuck', 'final', 'reconcile']) {
    assert.strictEqual(typeof TRIGGER_TEMPLATES[t], 'function', `missing ${t}`);
  }
});

test('buildAdvisorPrompt: early trigger', () => {
  const { systemPrompt, userPrompt } = buildAdvisorPrompt({
    subAgentMarkdown: '# Backend Engineer',
    conversation: [{ role: 'user', content: 'hello' }],
    trigger: 'early',
    triggerContext: { summary: 'implement login API' },
  });
  assert.ok(systemPrompt.includes('Backend Engineer'));
  assert.ok(userPrompt.includes('implement login API'));
});

test('buildAdvisorPrompt: stuck trigger', () => {
  const { userPrompt } = buildAdvisorPrompt({
    subAgentMarkdown: '',
    conversation: [],
    trigger: 'stuck',
    triggerContext: { error: 'TypeError: x is not a function', attempts: 'tried import fix' },
  });
  assert.ok(userPrompt.includes('TypeError'));
  assert.ok(userPrompt.includes('tried import fix'));
});

test('buildAdvisorPrompt: currentFiles 포함', () => {
  const { userPrompt } = buildAdvisorPrompt({
    subAgentMarkdown: '',
    conversation: [],
    trigger: 'final',
    triggerContext: { summary: 'done' },
    currentFiles: ['src/api.js', 'src/db.js'],
  });
  assert.ok(userPrompt.includes('src/api.js'));
});

test('schema: advisor 3종 이벤트 타입 존재', () => {
  assert.strictEqual(schema.EVENT_TYPES.ADVISOR_CALL, 'advisor_call');
  assert.strictEqual(schema.EVENT_TYPES.ADVISOR_DEGRADED, 'advisor_degraded');
  assert.strictEqual(schema.EVENT_TYPES.ADVISOR_BUDGET_BLOCK, 'advisor_budget_block');
});

test('schema: advisor_call 필드 10개', () => {
  const s = schema.EVENT_SCHEMAS.advisor_call;
  assert.ok(s.required.includes('session_id'));
  assert.ok(s.required.includes('sub_agent'));
  assert.ok(s.required.includes('cost'));
  assert.ok(s.required.includes('status'));
  assert.strictEqual(s.required.length, 10);
});

test('schema: advisor 이벤트 validatePayload', () => {
  const r1 = schema.validatePayload('advisor_call', {
    timestamp: '2026-04-16', session_id: 's1', sub_agent: 'be', c_level: 'cto',
    trigger: 'early', tokens_in: 100, tokens_out: 50, cached_tokens: 0, cost: 0.01, status: 'ok',
  });
  assert.strictEqual(r1.valid, true);

  const r2 = schema.validatePayload('advisor_call', { timestamp: '2026-04-16' });
  assert.strictEqual(r2.valid, false);
});

test('schema: ideation 이벤트도 여전히 유효', () => {
  assert.strictEqual(schema.EVENT_TYPES.IDEATION_STARTED, 'ideation_started');
  assert.strictEqual(schema.EVENT_TYPES.IDEATION_ENDED, 'ideation_ended');
});

// ── v0.56 sub-plan 06: wrapper 경로 검증 ──────────────────────────

function setupWrapperEnv() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-wrapper-'));
  fs.mkdirSync(path.join(tmp, '.vais'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'vais.config.json'), JSON.stringify({
    version: '0.55.0',
    workflow: { phases: ['plan'] },
    cSuite: { roles: {} },
    orchestration: { gateAction: 'confirm' },
    observability: { eventLog: '.vais/event-log.jsonl' },
    advisor: { max_calls_per_session: 15, monthly_budget_usd: 200 },
  }));
  const originalCwd = process.cwd();
  process.chdir(tmp);

  // fresh require — paths/cost-monitor/wrapper 모두 재평가
  ['../lib/paths', '../lib/control/cost-monitor', '../lib/advisor/wrapper'].forEach(m => {
    try { delete require.cache[require.resolve(m)]; } catch (_) {}
  });

  return { tmp, originalCwd };
}

function teardownWrapperEnv({ tmp, originalCwd }) {
  process.chdir(originalCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
  ['../lib/paths', '../lib/control/cost-monitor', '../lib/advisor/wrapper'].forEach(m => {
    try { delete require.cache[require.resolve(m)]; } catch (_) {}
  });
}

test('wrapper.callAdvisor: SDK 미설치 시 status=unavailable + advisor_call 이벤트 기록', async () => {
  const env = setupWrapperEnv();
  try {
    const { callAdvisor } = require('../lib/advisor/wrapper');
    const result = await callAdvisor({
      sessionId: 'unit-sess-1',
      subAgent: 'backend-engineer',
      cLevel: 'cto',
      trigger: 'early',
      subAgentMarkdown: '# mock',
      conversation: [],
      triggerContext: { summary: 'test' },
    });

    // SDK가 없으면 unavailable
    assert.strictEqual(result.status, 'unavailable');
    assert.strictEqual(result.advice, null);

    // event-log.jsonl에 advisor_call 이벤트 1건
    const logPath = path.join(env.tmp, '.vais', 'event-log.jsonl');
    assert.ok(fs.existsSync(logPath), 'event log must be written');
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    const lastEvent = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(lastEvent.event, 'advisor_call');
    assert.strictEqual(lastEvent.status, 'unavailable');
    assert.strictEqual(lastEvent.session_id, 'unit-sess-1');
    assert.strictEqual(lastEvent.sub_agent, 'backend-engineer');
  } finally {
    teardownWrapperEnv(env);
  }
});

test('wrapper.callAdvisor: budget cap 초과 시 status=budget_block + advisor_budget_block 이벤트', async () => {
  const env = setupWrapperEnv();
  try {
    // config overwrite: session cap=1 for quick trigger
    fs.writeFileSync(path.join(env.tmp, 'vais.config.json'), JSON.stringify({
      version: '0.55.0',
      workflow: { phases: ['plan'] },
      cSuite: { roles: {} },
      orchestration: { gateAction: 'confirm' },
      observability: { eventLog: '.vais/event-log.jsonl' },
      advisor: { max_calls_per_session: 1, monthly_budget_usd: 200 },
    }));

    const cm = require('../lib/control/cost-monitor');
    // 1회 기록으로 session_cap=1 도달
    await cm.recordCall({ sessionId: 'bud-sess', subAgent: 'be', cost: 0.001, tokens: {} });

    const { callAdvisor } = require('../lib/advisor/wrapper');
    const result = await callAdvisor({
      sessionId: 'bud-sess',
      subAgent: 'backend-engineer',
      cLevel: 'cto',
      trigger: 'early',
      subAgentMarkdown: '',
      conversation: [],
      triggerContext: {},
    });

    assert.strictEqual(result.status, 'budget_block');
    assert.strictEqual(result.degraded, true);

    const logPath = path.join(env.tmp, '.vais', 'event-log.jsonl');
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    const lastEvent = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(lastEvent.event, 'advisor_budget_block');
    assert.strictEqual(lastEvent.session_id, 'bud-sess');
    assert.strictEqual(lastEvent.cap, 200);
  } finally {
    teardownWrapperEnv(env);
  }
});
