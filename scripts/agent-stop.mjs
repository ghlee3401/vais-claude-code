#!/usr/bin/env node
// Design Ref: §2.2 — SubagentStop 훅에서 호출되는 얇은 CLI 래퍼
// 사용: node scripts/agent-stop.js <role> <outcome> [outputDoc]

import { StateWriter, EventLogger, EVENT_TYPES } from '../lib/observability/index.mjs'

const [role, outcome = 'success', outputDoc = ''] = process.argv.slice(2)

if (!role) {
  process.exit(0)
}

try {
  const sw = new StateWriter('.vais/agent-state.json')
  const el = new EventLogger('.vais/event-log.jsonl')

  sw.markAgentStop(role, outcome, outputDoc)
  el.log(EVENT_TYPES.AGENT_STOP, { role, outcome, doc: outputDoc })
} catch (err) {
  console.error('[vais observability] agent-stop failed:', err.message)
}

process.exit(0)
