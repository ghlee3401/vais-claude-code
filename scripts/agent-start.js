#!/usr/bin/env node
// Design Ref: §2.2 — SubagentStart 훅에서 호출되는 얇은 CLI 래퍼. 로직은 lib/observability/에 위임
// 사용: node scripts/agent-start.js <role> <phase> [task]

const { StateWriter, EventLogger, EVENT_TYPES } = require('../lib/observability/index');
const { logHook } = require('../lib/hook-logger');

const [role, phase, task = ''] = process.argv.slice(2);

if (!role || !phase) {
  // graceful degradation: 인자 없으면 exit 0 (에이전트 실행 방해 금지)
  process.exit(0);
}

try {
  const sw = new StateWriter('.vais/agent-state.json');
  const el = new EventLogger('.vais/event-log.jsonl');

  sw.markAgentStart(role, phase, task);
  el.log(EVENT_TYPES.AGENT_START, { role, phase, task });
  logHook('SubagentStart', 'ok', { role, phase });
} catch (err) {
  // Plan SC: SC-06 — 기존 동작 완전 호환. observability 실패가 에이전트를 막으면 안 됨
  console.error('[vais observability] agent-start failed:', err.message);
}

process.exit(0);
