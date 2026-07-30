#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] stop-handler crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] stop-handler rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * 이 파일의 책임: Stop hook — 활성 피처가 있으면 1줄 상태 힌트만 출력. (v2.0 슬림)
 */
const { readStdin, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { getActiveFeature, getProgressSummary } = require('../lib/status');
const { loadConfig } = require('../lib/paths');

function main() {
  readStdin(); // 프로토콜 소비만

  const activeFeature = getActiveFeature();
  if (!activeFeature) {
    outputAllow('');
    process.exit(0);
  }

  let line = '';
  try {
    const summary = getProgressSummary(activeFeature);
    const config = loadConfig();
    const phases = config.workflow?.phases || [];
    const currentPhase = summary?.currentPhase || null;
    const idx = currentPhase ? phases.indexOf(currentPhase) : -1;
    const nextPhase = idx >= 0 && idx < phases.length - 1 ? phases[idx + 1] : null;
    line = nextPhase
      ? `VAIS: ${activeFeature} — ${currentPhase} 진행 중 (다음: /vais ${nextPhase} ${activeFeature})`
      : `VAIS: ${activeFeature} — ${currentPhase || '시작 전'}`;
    logHook('Stop', 'ok', { feature: activeFeature, phase: currentPhase });
  } catch (e) {
    debugLog('StopHandler', 'summary failed', { error: e.message });
  }

  outputAllow(line);
  process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
