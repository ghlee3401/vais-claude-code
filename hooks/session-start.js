#!/usr/bin/env node
/**
 * VAIS Code - SessionStart Hook
 * Design Ref: §2.3 — thin orchestrator, 모듈 호출 + 결과 조립만 담당
 */
const { debugLog } = require('../lib/debug');
const { ensureVaisDirs, loadConfig, loadOutputStyle } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary } = require('../lib/status');
const { sendWebhook } = require('../lib/webhook');

function main() {
  debugLog('SessionStart', 'Hook executed', { cwd: process.cwd() });
  ensureVaisDirs();

  const config = loadConfig();
  const VERSION = config.version || '0.10.1';
  const activeFeature = getActiveFeature();
  const status = getStatus();
  const featureNames = Object.keys(status.features || {});

  let ctx = '';

  // Plan SC: SC-01, SC-02 — Progress Bar + Workflow Map (피처 있을 때만)
  if (activeFeature) {
    const summary = getProgressSummary(activeFeature);

    // --- 1. Progress Bar ---
    try {
      const { renderProgressBar } = require('../lib/ui/progress-bar');
      const bar = renderProgressBar(summary);
      if (bar) ctx += bar + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Progress Bar failed', { error: e.message });
    }

    // --- 2. Workflow Map ---
    try {
      const { renderWorkflowMap } = require('../lib/ui/workflow-map');
      const map = renderWorkflowMap(summary);
      if (map) ctx += map + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Workflow Map failed', { error: e.message });
    }
  }

  // --- 3. 헤더 + 피처 목록 ---
  ctx += `# VAIS Code v${VERSION}\n\n`;
  ctx += `> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA\n\n`;

  if (featureNames.length > 0) {
    ctx += `## 진행 중인 피처\n\n`;
    for (const fname of featureNames) {
      const summary = getProgressSummary(fname);
      if (!summary) continue;
      const marker = fname === activeFeature ? '👉 ' : '   ';
      ctx += `${marker}**${fname}** — ${summary.currentPhaseName} ${summary.progressCompact}\n`;
    }
    ctx += `\n`;
  }

  // --- 4. 커맨드 테이블 ---
  ctx += `## 시작하기\n\n`;
  ctx += `| 커맨드 | 설명 |\n`;
  ctx += `|--------|------|\n`;
  ctx += `| \`/vais auto {기능}\` | 전체 자동 워크플로우 |\n`;
  ctx += `| \`/vais plan {기능}\` | 기획부터 시작 |\n`;
  ctx += `| \`/vais status\` | 진행 상태 확인 |\n`;
  ctx += `| \`/vais help\` | 사용법 안내 |\n\n`;

  // --- 5. Output Style 자동 주입 (Plan SC: SC-03) ---
  try {
    const styleContent = loadOutputStyle();
    if (styleContent) {
      // frontmatter(---...---) 제거하고 규칙 본문만 주입
      const bodyMatch = styleContent.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
      const styleBody = bodyMatch ? bodyMatch[1].trim() : styleContent;
      ctx += styleBody + '\n\n';
    }
  } catch (e) {
    debugLog('SessionStart', 'Output Style injection failed', { error: e.message });
  }

  // --- Output ---
  const response = { additionalContext: ctx };

  sendWebhook('session_start', {
    project: process.cwd(),
    activeFeature: activeFeature || null,
    featureCount: featureNames.length,
  });

  console.log(JSON.stringify(response));
  process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
