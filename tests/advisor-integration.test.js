/**
 * Advisor Integration tests (sub-plan 04)
 * SC-18, SC-19: 이벤트 스키마 + 호출 패턴 검증
 */

const { test } = require('node:test');
const assert = require('node:assert');

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
