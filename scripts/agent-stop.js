#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] agent-stop crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] agent-stop rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
// Design Ref: §2.2 — SubagentStop 훅에서 호출되는 얇은 CLI 래퍼
// 사용: node scripts/agent-stop.js <role> <outcome> [outputDoc]

const { logHook } = require('../lib/hook-logger');
const { validateDocs, formatResult, C_LEVEL_ROLES } = require('./doc-validator');
const { validateCheckpoints, formatCPResult } = require('./cp-guard');
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
      // Strict 모드(VAIS_STRICT_DOCS=1)에서만 차단, 기본은 경고만 (사용자 작업 흐름 보호)
      const strict = process.env.VAIS_STRICT_DOCS === '1';
      if (strict) {
        process.stderr.write(`\n❌ [${role.toUpperCase()}] 필수 문서가 누락되어 종료를 차단합니다 (VAIS_STRICT_DOCS=1). 문서를 작성한 후 다시 시도하세요.\n`);
      } else {
        process.stderr.write(`\n⚠️  [${role.toUpperCase()}] 필수 문서가 누락되었습니다. 진행은 허용되나 다음 단계 전에 문서를 작성하세요. (차단을 원하면 VAIS_STRICT_DOCS=1)\n`);
      }
      try {
        const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');
        const el = new EventLogger('.vais/event-log.jsonl');
        el.log(EVENT_TYPES.AGENT_STOP, {
          role,
          outcome: 'doc_missing',
          missing: result.missing.map(m => m.phase),
          feature,
          strict,
        });
      } catch (_) { /* observability failure should not block exit */ }
      if (strict) process.exit(1);
    } else if (output) {
      process.stderr.write('\n' + output + '\n');
    }
  }

  // CP Guard: 체크포인트(AskUserQuestion) 호출 여부 검증
  const cpResult = validateCheckpoints(role);
  const cpOutput = formatCPResult(role, cpResult);
  if (cpOutput) {
    process.stderr.write('\n' + cpOutput + '\n');
  }
  if (!cpResult.passed) {
    try {
      const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');
      const el = new EventLogger('.vais/event-log.jsonl');
      el.log(EVENT_TYPES.AGENT_STOP, {
        role,
        outcome: 'cp_missing',
        checkpointCount: cpResult.checkpointCount,
      });
    } catch (_) { /* observability failure should not block exit */ }
  }
}

process.exit(0);
