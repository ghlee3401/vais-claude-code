#!/usr/bin/env node
// Design Ref: §2.2 — 단계 전환 기록. cto.md 내부 또는 훅에서 호출
// 사용: node scripts/phase-transition.js <from> <to> <feature>

const fs = require('fs');
const path = require('path');
const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');

// A01/A08: CLI 인자 화이트리스트 — vais.config.json의 workflow.phases 기준
const VALID_PHASES = (() => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../vais.config.json'), 'utf8'));
    return new Set(config.workflow?.phases || []);
  } catch {
    return new Set();
  }
})();

function isValidPhase(val) {
  return VALID_PHASES.size === 0 || VALID_PHASES.has(val);
}

const [from, to, feature = ''] = process.argv.slice(2);

if (!from || !to) {
  process.exit(0);
}

if (!isValidPhase(from) || !isValidPhase(to)) {
  process.exit(0);
}

try {
  const el = new EventLogger('.vais/event-log.jsonl');
  el.log(EVENT_TYPES.PHASE_TRANSITION, { from, to, feature });
} catch (err) {
  console.error('[vais observability] phase-transition failed:', err.message);
}

process.exit(0);
