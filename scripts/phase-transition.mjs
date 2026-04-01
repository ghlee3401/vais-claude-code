#!/usr/bin/env node
// Design Ref: §2.2 — 단계 전환 기록. cto.md 내부 또는 훅에서 호출
// 사용: node scripts/phase-transition.js <from> <to> <feature>

import { EventLogger, EVENT_TYPES } from '../lib/observability/index.mjs'

const [from, to, feature = ''] = process.argv.slice(2)

if (!from || !to) {
  process.exit(0)
}

try {
  const el = new EventLogger('.vais/event-log.jsonl')
  el.log(EVENT_TYPES.PHASE_TRANSITION, { from, to, feature })
} catch (err) {
  console.error('[vais observability] phase-transition failed:', err.message)
}

process.exit(0)
