// Design Ref: §2.1 — 이벤트 타입 중앙 관리. MCP 서버 + 대시보드 모두 이 스키마 사용
const EVENT_TYPES = {
  SESSION_START:    'session_start',
  SESSION_END:      'session_end',
  AGENT_START:      'agent_start',
  AGENT_STOP:       'agent_stop',
  PHASE_TRANSITION: 'phase_transition',
  GATE_CHECK:       'gate_check',
  DECISION:         'decision',
  ERROR:            'error',
};

// 각 이벤트 타입별 필수 payload 필드
const EVENT_SCHEMAS = {
  session_start:    { required: ['feature'] },
  session_end:      { required: ['feature'] },
  agent_start:      { required: ['role', 'phase'] },
  agent_stop:       { required: ['role', 'outcome'] },
  phase_transition: { required: ['from', 'to', 'feature'] },
  gate_check:       { required: ['gate', 'result'] },
  decision:         { required: ['role', 'type', 'choice'] },
  error:            { required: ['role', 'message'] },
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
