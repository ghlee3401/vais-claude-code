#!/usr/bin/env node
/**
 * VAIS Code - Stop Handler
 * 응답 완료 시 현재 진행 상태 요약 + 다음 단계 안내
 */
const { readStdin, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { getActiveFeature, getProgressSummary } = require('../lib/status');
const { loadConfig } = require('../lib/paths');

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
    `║ 💡 시작: \`/vais research ${activeFeature}\``,
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
const completedCount = phases.filter(
  p => summary.phases[p]?.status === 'completed'
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

if (nextPhase) {
  lines.push(`║ 💡 다음: \`/vais ${nextPhase} ${activeFeature}\` (${nextPhaseName})`);
} else if (currentPhase === 'review') {
  lines.push(`║ 🎉 모든 단계 완료! \`/vais status\`로 최종 확인하세요.`);
}

lines.push('╚══════════════════════════════════════');

const output = lines.join('\n');
debugLog('StopHandler', 'Status summary', { feature: activeFeature, currentPhase, completedCount });
outputAllow(output);
process.exit(0);

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
