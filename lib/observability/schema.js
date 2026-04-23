// Design Ref: §2.1 — 이벤트 타입 중앙 관리. MCP 서버 + 대시보드 모두 이 스키마 사용
const EVENT_TYPES = {
  SESSION_START:    'session_start',
  SESSION_END:      'session_end',
  AGENT_START:      'agent_start',
  AGENT_STOP:       'agent_stop',
  PHASE_TRANSITION: 'phase_transition',
  GATE_CHECK:       'gate_check',
  CHECKPOINT:       'checkpoint',
  DECISION:         'decision',
  ERROR:            'error',
  // v0.50 ideation
  IDEATION_STARTED: 'ideation_started',
  IDEATION_ENDED:   'ideation_ended',
  // v0.50 advisor (M-24)
  ADVISOR_CALL:         'advisor_call',
  ADVISOR_DEGRADED:     'advisor_degraded',
  ADVISOR_BUDGET_BLOCK: 'advisor_budget_block',
  // v0.50 harness gates
  ROLE_TRANSITION:          'role_transition',
  PHASE_TRANSITION_AUTO:    'phase_transition_auto',
  PHASE_TRANSITION_RETRY:   'phase_transition_retry',
  GATE_JUDGMENT:            'gate_judgment',
  // v0.58.3 plan-scope-contract — SC-01/02 측정용
  PLAN_COMPLETED:           'plan_completed',
  PLAN_REWRITE_REQUESTED:   'plan_rewrite_requested',
};

// 각 이벤트 타입별 필수 payload 필드
const EVENT_SCHEMAS = {
  session_start:    { required: ['feature'] },
  session_end:      { required: ['feature'] },
  agent_start:      { required: ['role', 'phase'] },
  agent_stop:       { required: ['role', 'outcome'] },
  phase_transition: { required: ['from', 'to', 'feature'] },
  gate_check:       { required: ['gate', 'result'] },
  checkpoint:       { required: ['role', 'cp'] },
  decision:         { required: ['role', 'type', 'choice'] },
  error:            { required: ['role', 'message'] },
  // v0.50 ideation
  ideation_started: { required: ['timestamp', 'feature', 'initiator', 'role', 'topic'] },
  ideation_ended:   { required: ['timestamp', 'feature', 'output_path', 'status', 'turn_count', 'duration_sec'] },
  // v0.50 advisor (M-24)
  advisor_call:         { required: ['timestamp', 'session_id', 'sub_agent', 'c_level', 'trigger', 'tokens_in', 'tokens_out', 'cached_tokens', 'cost', 'status'] },
  advisor_degraded:     { required: ['timestamp', 'session_id', 'reason', 'fallback_model', 'monthly_spent', 'cap', 'next_reset'] },
  advisor_budget_block: { required: ['timestamp', 'session_id', 'sub_agent', 'total_spent', 'cap', 'remaining'] },
  // v0.50 harness gates
  role_transition:        { required: ['from_role', 'to_role', 'reason', 'feature'] },
  phase_transition_auto:  { required: ['feature', 'fromPhase', 'toPhase', 'reason'] },
  phase_transition_retry: { required: ['feature', 'phase', 'failures'] },
  gate_judgment:          { required: ['feature', 'phase', 'result', 'reason'] },
  // v0.58.3 plan-scope-contract
  plan_completed:         { required: ['feature', 'cLevel', 'scopeItemsIn', 'scopeItemsOut', 'observations'] },
  plan_rewrite_requested: { required: ['feature', 'cLevel', 'reason'] },
};

function validatePayload(eventType, payload) {
  const schema = EVENT_SCHEMAS[eventType];
  if (!schema) return { valid: false, error: `Unknown event type: ${eventType}` };

  const missing = schema.required.filter(field => !(field in payload));
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }

  return { valid: true };
}

module.exports = { EVENT_TYPES, EVENT_SCHEMAS, validatePayload };
