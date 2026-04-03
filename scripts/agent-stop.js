#!/usr/bin/env node
// Design Ref: §2.2 — SubagentStop 훅에서 호출되는 얇은 CLI 래퍼
// 사용: node scripts/agent-stop.js <role> <outcome> [outputDoc]

const { logHook } = require('../lib/hook-logger');
const { validateDocs, formatResult, C_LEVEL_ROLES } = require('./doc-validator');
const { getActiveFeature } = require('../lib/status');

const [role, outcome = 'success', outputDoc = ''] = process.argv.slice(2);

if (!role) {
  process.exit(0);
}

// observability 기록 (실패해도 doc 검증에 영향 없도록 분리)
try {
  const { StateWriter, EventLogger, EVENT_TYPES } = require('../lib/observability/index');
  const sw = new StateWriter('.vais/agent-state.json');
  const el = new EventLogger('.vais/event-log.jsonl');

  sw.markAgentStop(role, outcome, outputDoc);
  el.log(EVENT_TYPES.AGENT_STOP, { role, outcome, doc: outputDoc });
  logHook('SubagentStop', 'ok', { role, outcome });
} catch (err) {
  console.error('[vais observability] agent-stop failed:', err.message);
}

// C-Level 에이전트 종료 시 필수 문서 검증 (observability와 독립)
if (C_LEVEL_ROLES.includes(role)) {
  const feature = getActiveFeature();
  if (feature) {
    const result = validateDocs(role, feature);
    const output = formatResult(role, feature, result);
    if (!result.passed) {
      process.stderr.write('\n' + output + '\n');
      process.stderr.write(`\n❌ [${role.toUpperCase()}] 필수 문서가 누락되어 종료를 차단합니다. 문서를 작성한 후 다시 시도하세요.\n`);
      try {
        const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');
        const el = new EventLogger('.vais/event-log.jsonl');
        el.log(EVENT_TYPES.AGENT_STOP, {
          role,
          outcome: 'doc_missing',
          missing: result.missing.map(m => m.phase),
          feature,
        });
      } catch (_) { /* observability failure should not block exit */ }
      process.exit(1);
    } else if (output) {
      process.stderr.write('\n' + output + '\n');
    }
  }
}

process.exit(0);
