#!/usr/bin/env node
/**
 * 이 파일의 책임: SessionStart hook — 슬림 상태 요약만 additionalContext 로 주입. (v2.0)
 */
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { ensureVaisDirs, loadConfig } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary, ensureMigrated } = require('../lib/status');

function main() {
  logHook('SessionStart', 'ok', { cwd: process.cwd() });
  ensureVaisDirs();
  // 구 스키마 status.json 승격. 실패해도 hook 은 생존.
  try { ensureMigrated(); } catch (e) {
    debugLog('SessionStart', 'ensureMigrated failed', { error: e.message });
  }

  const config = loadConfig();
  const VERSION = config.version || '0.0.0';
  const activeFeature = getActiveFeature();
  const status = getStatus();
  const featureNames = Object.keys(status.features || {});

  let ctx = `# VAIS v${VERSION}\n\n`;

  if (featureNames.length > 0) {
    ctx += `## 진행 중인 피처\n\n`;
    for (const fname of featureNames) {
      try {
        const summary = getProgressSummary(fname);
        if (!summary) continue;
        const marker = fname === activeFeature ? '👉 ' : '   ';
        ctx += `${marker}**${fname}** — ${summary.currentPhaseName} ${summary.progressCompact}\n`;
      } catch (e) {
        debugLog('SessionStart', 'feature summary failed', { feature: fname, error: e.message });
      }
    }
    ctx += `\n`;
  }

  ctx += `시작: \`/vais plan {기능}\` · 상태: \`/vais status\` · 도움말: \`/vais help\`\n`;

  const response = {
    systemMessage: `VAIS v${VERSION} activated`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: ctx,
    },
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
