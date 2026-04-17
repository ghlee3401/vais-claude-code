#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] agent-stop crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] agent-stop rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
// Design Ref: §2.2 — SubagentStop 훅에서 호출되는 얇은 CLI 래퍼
// v0.56 sub-plan 07: 4-step pipeline 구현
//   Step 1: Document validation (doc-validator)
//   Step 2: Checkpoint validation (cp-guard)
//   Step 3: Gate judgment (auto-judge → gate-manager)
//   Step 4: Guidance (verdict 기반 안내)
// 사용: node scripts/agent-stop.js <role> <outcome> [outputDoc] [phase]

const { logHook } = require('../lib/hook-logger');
const { validateDocs, formatResult, C_LEVEL_ROLES } = require('./doc-validator');
const { validateCheckpoints, formatCPResult } = require('./cp-guard');
const { getActiveFeature } = require('../lib/status');

const [role, outcome = 'success', outputDoc = '', phaseArg = ''] = process.argv.slice(2);

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

// 기본 플래그
const strictDocs = process.env.VAIS_STRICT_DOCS === '1';
const gateMode = (process.env.VAIS_GATE_MODE || 'warn').toLowerCase(); // 'warn' | 'strict' | 'off'

// ── C-Level 파이프라인 ────────────────────────────────────────────
if (C_LEVEL_ROLES.includes(role)) {
  const feature = getActiveFeature();
  let documentsValid = true;
  let checkpointsRecorded = true;

  // ── Step 1: Document validation ────────────────────────────────
  if (feature) {
    const result = validateDocs(role, feature);
    const output = formatResult(role, feature, result);
    documentsValid = result.passed;
    if (!result.passed) {
      process.stderr.write('\n' + output + '\n');
      if (strictDocs) {
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
          strict: strictDocs,
        });
      } catch (_) { /* observability failure should not block exit */ }
      if (strictDocs) process.exit(1);
    } else if (output) {
      process.stderr.write('\n' + output + '\n');
    }
  }

  // ── Step 2: Checkpoint validation ──────────────────────────────
  const cpResult = validateCheckpoints(role);
  const cpOutput = formatCPResult(role, cpResult);
  checkpointsRecorded = cpResult.passed;
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

  // ── Step 3: Gate judgment (v0.56 sub-plan 07) ──────────────────
  // gateMode='off' 이면 skip. auto-judge 결과 → gate-manager.checkGate → verdict
  if (feature && gateMode !== 'off' && phaseArg) {
    try {
      const { judge } = require('./auto-judge');
      const { checkGate, judgePhaseCompletion } = require('../lib/quality/gate-manager');
      const judgeResult = judge(role, feature);
      const metrics = judgeResult.metrics || {};

      const gateVerdict = checkGate(phaseArg, { metrics, role, feature });

      // phase completion 종합 판정
      const completion = judgePhaseCompletion({
        feature, phase: phaseArg,
        documentsValid, checkpointsRecorded,
        toolCallCount: 1, // hook 안에서 정확 집계 어려움, 0 아니면 충족 처리
      });

      try {
        const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');
        const el = new EventLogger('.vais/event-log.jsonl');
        el.log(EVENT_TYPES.AGENT_STOP, {
          role, outcome: 'gate_' + gateVerdict.verdict,
          feature, phase: phaseArg,
          verdict: gateVerdict.verdict,
          score: gateVerdict.score,
          metrics,
          completion: completion.pass,
        });
      } catch (_) { /* ignore */ }

      // ── Step 4: Guidance (간단 인라인) ─────────────────────────
      const icon = { pass: '✅', retry: '⚠️', fail: '🛑' }[gateVerdict.verdict] || 'ℹ️';
      process.stderr.write(`\n${icon} [${role.toUpperCase()}] Gate ${gateVerdict.verdict.toUpperCase()} — score=${gateVerdict.score}/100 (phase=${phaseArg})\n`);
      if (gateVerdict.recommendation) {
        process.stderr.write(`   💡 ${gateVerdict.recommendation}\n`);
      }

      if (gateVerdict.verdict === 'fail' && gateMode === 'strict') {
        process.stderr.write(`\n❌ [${role.toUpperCase()}] Gate FAIL — VAIS_GATE_MODE=strict 차단. 블로커: ${gateVerdict.blockers.join(', ')}\n`);
        process.exit(1);
      }
    } catch (err) {
      // gate 단계 실패는 기존 doc/cp 결과를 덮지 않음
      try { process.stderr.write(`[VAIS] gate step skipped: ${err.message}\n`); } catch (_) {}
    }
  }
}

process.exit(0);
