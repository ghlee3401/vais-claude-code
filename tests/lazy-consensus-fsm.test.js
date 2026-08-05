/**
 * Lazy Consensus FSM tests — agent-teams-orchestration (v2) 검증.
 *
 * SC-09: Lazy Consensus 5-state FSM 모든 상태 전이 unit test 통과.
 * 정본: skills/vais/utils/conversation-orchestrator.js
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  STATES,
  EVENT_TYPES,
  ConversationSession,
} = require('../skills/vais/utils/conversation-orchestrator');

test('STATES + EVENT_TYPES enum: 5 + 5 정상 정의', () => {
  assert.strictEqual(Object.keys(STATES).length, 6); // DRAFT, REVIEW_WINDOW, OBJECTION_RAISED, REVISION, CONSENSUS_REACHED, TIMEOUT
  assert.strictEqual(Object.keys(EVENT_TYPES).length, 5); // PROPOSE/OBJECT/AGREE/PIVOT/TIMEOUT
  assert.strictEqual(STATES.DRAFT, 'draft');
  assert.strictEqual(STATES.CONSENSUS_REACHED, 'consensus-reached');
  assert.strictEqual(EVENT_TYPES.PROPOSE, '제기');
  assert.strictEqual(EVENT_TYPES.AGREE, '합의');
});

test('ConversationSession: constructor 필수 필드 검증', () => {
  assert.throws(() => new ConversationSession({}), /requires feature, phase, synthesizer/);
  assert.throws(() => new ConversationSession({ feature: 'x' }), /requires/);
  const s = new ConversationSession({
    feature: 'agent-teams-orchestration',
    phase: 'plan',
    synthesizer: 'cto',
  });
  assert.strictEqual(s.state, STATES.DRAFT);
  assert.strictEqual(s.consensusTurns, 2);
  assert.strictEqual(s.turnTimeoutMs, 60000);
});

test('FSM dryRun: draft → review-window → consensus-reached (이의 0)', async () => {
  const s = new ConversationSession({
    feature: 'x',
    phase: 'plan',
    synthesizer: 'cto',
    participants: ['cpo', 'cso'],
    dryRun: true,
  });
  const result = await s.run({
    draftFn: async () => 'draft content v1',
  });
  assert.strictEqual(result.state, STATES.CONSENSUS_REACHED);
  assert.ok(result.events.some((e) => e.eventType === EVENT_TYPES.PROPOSE));
  assert.ok(result.events.some((e) => e.eventType === EVENT_TYPES.AGREE));
});

test('FSM 강제 timeout: reviseFn 없으면 timeout 박제', async () => {
  // 항상 반박 응답하는 sendMessageFn — reviseFn 없음 → timeout
  let i = 0;
  const s = new ConversationSession({
    feature: 'x',
    phase: 'design',
    synthesizer: 'cto',
    participants: ['cpo'],
    dryRun: false,
    sendMessageFn: async () => `반박 round ${++i}: not yet`,
    consensusTurns: 1,
  });
  const result = await s.run({
    draftFn: async () => 'draft v1',
    // reviseFn 미제공 — 첫 라운드 반박 → 즉시 timeout
  });
  assert.strictEqual(result.state, STATES.CONSENSUS_REACHED);
  const timeoutEvents = result.events.filter((e) => e.eventType === EVENT_TYPES.TIMEOUT);
  assert.ok(timeoutEvents.length >= 1, 'timeout event 박제됨');
});

test('FSM 1 라운드 revision 후 합의 (반박 → revise → AGREE)', async () => {
  let round = 0;
  const s = new ConversationSession({
    feature: 'x',
    phase: 'design',
    synthesizer: 'cto',
    participants: ['cpo'],
    dryRun: false,
    sendMessageFn: async () => {
      round += 1;
      // 1라운드 반박, 2라운드 합의
      return round === 1 ? '반박 너무 추상적' : '합의';
    },
    consensusTurns: 2,
  });
  const result = await s.run({
    draftFn: async () => 'draft v1',
    reviseFn: async (objections) => `revised v2 addressing ${objections.length} objections`,
  });
  assert.strictEqual(result.state, STATES.CONSENSUS_REACHED);
  assert.strictEqual(result.roundCount, 1, 'roundCount=1 (1번 revise)');
  const proposes = result.events.filter((e) => e.eventType === EVENT_TYPES.PROPOSE);
  assert.ok(proposes.length === 2, '2 draft 박제 (v1 + v2)');
});

test('FSM invalid transition 차단', () => {
  const s = new ConversationSession({
    feature: 'x',
    phase: 'plan',
    synthesizer: 'cto',
  });
  // draft → consensus-reached 직접 불가
  assert.throws(() => s._transition(STATES.CONSENSUS_REACHED, 'illegal'), /Invalid state transition/);
});
