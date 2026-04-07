#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] stop-handler crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] stop-handler rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Stop Handler
 * 응답 완료 시 현재 진행 상태 요약 + 다음 단계 안내
 */
const fs = require('fs');
const { readStdin, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { getActiveFeature, getProgressSummary } = require('../lib/status');
const { loadConfig } = require('../lib/paths');
const { sendWebhook } = require('../lib/webhook');

/**
 * agent-state.json에서 현재 활성 C-Level role을 읽어옴
 * 없으면 'cto'(기본 techOnly orchestrator)를 반환
 */
function getActiveRole() {
  try {
    const statePath = '.vais/agent-state.json';
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.active_agents && state.active_agents.length > 0) {
        return state.active_agents[state.active_agents.length - 1].role;
      }
    }
  } catch (e) {
    debugLog('StopHandler', 'agent-state read failed', { error: e.message });
  }
  return 'cto';
}

/**
 * 텍스트 프로그레스바 생성
 * 예: [████████░░] 8/10
 */
function buildProgressBar(done, total, width = 10) {
  if (total === 0) return '';
  const filled = Math.round((done / total) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

function main() {
readStdin(); // stdin 소비 (내용 미사용)

const config = loadConfig();
const version = config.version || '0.0.0';
const activeFeature = getActiveFeature();

// 활성 피처가 없을 때: 버전 정보만 표시
if (!activeFeature) {
  const lines = [
    '╔═ VAIS Code ════════════════════════',
    `║ 💠 v${version}`,
    `║ 💡 시작: \`/vais init <피처명>\``,
    '╚══════════════════════════════════════',
  ];
  outputAllow(lines.join('\n'));
  process.exit(0);
}

const summary = getProgressSummary(activeFeature);
if (!summary) {
  const lines = [
    '╔═ VAIS Code ════════════════════════',
    `║ 💠 v${version}`,
    `║ 📁 ${activeFeature}`,
    `║ 💡 시작: \`/vais plan ${activeFeature}\``,
    '╚══════════════════════════════════════',
  ];
  outputAllow(lines.join('\n'));
  process.exit(0);
}

const phases = config.workflow?.phases || [];
const phaseNames = config.workflow?.phaseNames || {};
const currentPhase = summary.currentPhase;
const currentPhaseName = phaseNames[currentPhase] || currentPhase;

// 완료된 단계 수 계산
const summaryPhases = summary.phases || {};
const completedCount = phases.filter(
  p => summaryPhases[p]?.status === 'completed'
).length;
const totalCount = phases.length;
const progressBar = buildProgressBar(completedCount, totalCount);

// 다음 단계 찾기
const currentIdx = phases.indexOf(currentPhase);
const nextPhase = currentIdx >= 0 && currentIdx < phases.length - 1
  ? phases[currentIdx + 1]
  : null;
const nextPhaseName = nextPhase ? (phaseNames[nextPhase] || nextPhase) : null;

// Gap 분석 결과
const gap = summary.gapAnalysis;
const gapLine = gap
  ? `📐 Gap 분석: ${gap.matchRate}% (${gap.passed ? '통과' : '미통과'})`
  : null;

// 출력 조립
const lines = [
  '╔═ VAIS Code ════════════════════════',
  `║ 💠 v${version}`,
  `║ 📁 ${activeFeature}`,
  `║ ${progressBar} ${completedCount}/${totalCount}  ${currentPhaseName}`,
];

if (gapLine) lines.push(`║ ${gapLine}`);

const activeRole = getActiveRole();
if (nextPhase) {
  lines.push(`║ 💡 다음: \`/vais ${activeRole} ${nextPhase} ${activeFeature}\` (${nextPhaseName})`);
} else if (currentPhase === 'qa') {
  lines.push(`║ 🎉 모든 단계 완료! \`/vais status\`로 최종 확인하세요.`);
}

lines.push('╚══════════════════════════════════════');

const output = lines.join('\n');
logHook('Stop', 'ok', { feature: activeFeature, phase: currentPhase, progress: `${completedCount}/${totalCount}` });
debugLog('StopHandler', 'Status summary', { feature: activeFeature, currentPhase, completedCount });

sendWebhook('stop', {
  feature: activeFeature,
  currentPhase,
  progress: `${completedCount}/${totalCount}`,
  nextPhase: nextPhase || null,
});

outputAllow(output);
process.exit(0);
}

module.exports = { main, buildProgressBar };

if (require.main === module) {
  main();
}
