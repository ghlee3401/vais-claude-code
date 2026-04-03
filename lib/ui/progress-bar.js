// Design Ref: §2.1 — Progress Bar 렌더링 모듈
const { loadConfig } = require('../paths');

const PHASE_ICONS = {
  plan: '📋', design: '🎨', do: '🔧',
  qa: '✅', report: '📊'
};

const STATUS_MARKS = {
  completed: '✓',
  'in-progress': '▶',
  pending: '·'
};

/**
 * 피처의 진행 상황을 시각적 바로 렌더링
 * @param {object} summary - getProgressSummary() 반환값
 * @param {object} [options]
 * @param {number} [options.width=50] - 전체 너비 (문자 수)
 * @returns {string} 렌더링된 Progress Bar 문자열
 */
function renderProgressBar(summary, options = {}) {
  if (!summary) return '';

  const { feature, currentPhaseName, phases } = summary;
  const config = loadConfig();
  const phaseList = config.workflow?.phases || [];
  const width = options.width || 50;

  // 퍼센트 계산
  const completed = phaseList.filter(p => phases[p]?.status === 'completed').length;
  const percent = Math.round((completed / phaseList.length) * 100);

  // 단계 아이콘 + 상태 마크
  const phaseMarks = phaseList.map(p => {
    const icon = PHASE_ICONS[p] || '?';
    const mark = STATUS_MARKS[phases[p]?.status] || '·';
    return `${icon}${mark}`;
  }).join('  ');

  // 블록 진행바
  const barLen = 20;
  const filled = Math.round((completed / phaseList.length) * barLen);
  const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

  // 현재 단계 아이콘
  const currentPhaseKey = Object.keys(PHASE_ICONS).find(
    k => config.workflow?.phaseNames?.[k] === currentPhaseName
  ) || phaseList[completed] || phaseList[0];
  const currentIcon = PHASE_ICONS[currentPhaseKey] || '📋';

  // 프레임 조립
  const percentStr = `${percent}%`;
  const topPadLen = Math.max(0, width - feature.length - percentStr.length - 8);
  const topPad = '─'.repeat(topPadLen);
  const bottomPad = ' '.repeat(Math.max(0, width - currentPhaseName.length - 6));

  const lines = [];
  lines.push(`┌─── ${feature} ${topPad} ${percentStr} ─┐`);
  lines.push(`│  ${phaseMarks}  ${bar}  │`);
  lines.push(`└─ ${currentIcon}${currentPhaseName}${bottomPad}┘`);

  return lines.join('\n');
}

module.exports = { renderProgressBar, PHASE_ICONS, STATUS_MARKS };
