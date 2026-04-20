#!/usr/bin/env node
/**
 * VAIS Code - SessionStart Hook
 * Design Ref: §2.3 — thin orchestrator, 모듈 호출 + 결과 조립만 담당
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { ensureVaisDirs, loadConfig, loadOutputStyle } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary, ensureMigrated } = require('../lib/status');
const { sendWebhook } = require('../lib/webhook');

/**
 * Advisor 모드 판정 (session 1회).
 * .vais/advisor-mode.json 작성 — wrapper/advisor-call CLI가 읽어서 분기.
 * 실패해도 session-start 전체를 막지 않음 (graceful).
 */
function detectAdvisorMode() {
  try {
    const script = path.join(__dirname, '..', 'scripts', 'check-cc-advisor-support.js');
    spawnSync('node', [script], {
      stdio: 'ignore',
      env: process.env,
      timeout: 3000,
    });
  } catch (e) {
    debugLog('SessionStart', 'advisor mode detection failed', { error: e.message });
  }
}

function main() {
  logHook('SessionStart', 'ok', { cwd: process.cwd() });
  debugLog('SessionStart', 'Hook executed', { cwd: process.cwd() });
  ensureVaisDirs();
  // 구 스키마 status.json 승격 (phases 누락 등 복구). 실패해도 hook 은 생존.
  try { ensureMigrated(); } catch (e) {
    debugLog('SessionStart', 'ensureMigrated failed', { error: e.message });
  }
  detectAdvisorMode();

  const config = loadConfig();
  const VERSION = config.version || '0.0.0';
  const activeFeature = getActiveFeature();
  const status = getStatus();
  const featureNames = Object.keys(status.features || {});

  let ctx = '';

  // Plan SC: SC-01, SC-02 — Progress Bar + Workflow Map (피처 있을 때만)
  if (activeFeature) {
    let summary = null;
    try {
      summary = getProgressSummary(activeFeature);
    } catch (e) {
      debugLog('SessionStart', 'active feature summary failed', { feature: activeFeature, error: e.message });
      try { process.stderr.write(`[VAIS] ⚠️  session-start: "${activeFeature}" status 스키마 손상 — 복구: .vais/status.json 삭제 후 세션 재시작 (진행 상태 초기화됨)\n`); } catch (_) {}
    }

    // --- 1. Progress Bar ---
    try {
      const { renderProgressBar } = require('../lib/ui/progress-bar');
      const bar = renderProgressBar(summary);
      if (bar) ctx += bar + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Progress Bar failed', { error: e.message });
      try { process.stderr.write(`[VAIS] ⚠️  session-start: progress bar 렌더 실패 — ${e.message}\n`); } catch (_) {}
    }

    // --- 2. Workflow Map ---
    try {
      const { renderWorkflowMap } = require('../lib/ui/workflow-map');
      const map = renderWorkflowMap(summary);
      if (map) ctx += map + '\n\n';
    } catch (e) {
      debugLog('SessionStart', 'Workflow Map failed', { error: e.message });
      try { process.stderr.write(`[VAIS] ⚠️  session-start: workflow map 렌더 실패 — ${e.message}\n`); } catch (_) {}
    }
  }

  // --- 3. 헤더 + 피처 목록 ---
  ctx += `# VAIS Code v${VERSION}\n\n`;
  ctx += `> 📋기획 → 🎨설계 → 🔧구현 → ✅QA → 📊보고서\n\n`;

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
        const marker = fname === activeFeature ? '👉 ' : '   ';
        ctx += `${marker}**${fname}** — ⚠️ status 스키마 손상 — .vais/status.json 삭제 후 세션 재시작\n`;
      }
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
      // {version} 플레이스홀더를 현재 버전으로 치환 (하단 리포트 템플릿용)
      ctx += styleBody.replace(/\{version\}/g, VERSION) + '\n\n';
    }
  } catch (e) {
    debugLog('SessionStart', 'Output Style injection failed', { error: e.message });
  }

  // --- Output ---
  const response = {
    systemMessage: `VAIS Code v${VERSION} activated (Claude Code)`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: ctx,
    },
  };

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
