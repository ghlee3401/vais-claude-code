// Design Ref: §2.2 — Workflow Map 렌더링 모듈
const { PHASE_ICONS, STATUS_MARKS } = require('./progress-bar');
const { loadConfig } = require('../paths');

const SHORT_NAMES = {
  plan: '기획', design: '설계', do: '구현',
  qa: 'QA', report: '보고서'
};

/**
 * 워크플로우를 화살표 연결로 시각화
 * @param {object} summary - getProgressSummary() 반환값
 * @param {object} [options]
 * @returns {string} 렌더링된 Workflow Map 문자열
 */
function renderWorkflowMap(summary, options = {}) {
  if (!summary) return '';

  const { feature, phases } = summary;
  const config = loadConfig();
  const phaseList = config.workflow?.phases || [];

  // 단계 블록 생성
  const blocks = phaseList.map(p => {
    const icon = PHASE_ICONS[p] || '?';
    const name = SHORT_NAMES[p] || p;
    const mark = STATUS_MARKS[phases[p]?.status] || '·';
    return `[${icon}${name} ${mark}]`;
  });

  const chain = blocks.join('──→');

  // 프레임 너비 계산
  const contentWidth = chain.length + 4;
  const titleLine = `Workflow: ${feature}`;
  const topPadLen = Math.max(0, contentWidth - titleLine.length - 6);
  const topPad = '─'.repeat(topPadLen);
  const bottomPad = '─'.repeat(Math.max(0, contentWidth));

  const lines = [];
  lines.push(`┌─── ${titleLine} ${topPad}─┐`);
  lines.push(`│${' '.repeat(contentWidth)}│`);
  lines.push(`│  ${chain}  │`);
  lines.push(`│${' '.repeat(contentWidth)}│`);
  lines.push(`└${bottomPad}──┘`);

  return lines.join('\n');
}

module.exports = { renderWorkflowMap, SHORT_NAMES };
