#!/usr/bin/env node
/**
 * VAIS Code - SessionStart Hook
 * Design Ref: §2.3 — thin orchestrator, 모듈 호출 + 결과 조립만 담당
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { ensureVaisDirs, loadConfig } = require('../lib/paths');
const { getStatus, getActiveFeature, getActiveFeatures, getProgressSummary, ensureMigrated, listInProgressIdeations } = require('../lib/status');
const fs = require('fs');
const { sendWebhook } = require('../lib/webhook');
const { checkAgentTeamsAllowed } = require('../lib/cc-version-detect');

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

  // Agent Teams 경고 분기 — config 로드 직후. 예외는 silent (hook hard fail 방지)
  try {
    const agentTeamsEnabled = config?.orchestration?.agentTeams?.enabled ?? false;
    if (agentTeamsEnabled) {
      const result = checkAgentTeamsAllowed(agentTeamsEnabled);
      if (result.allowed && result.simulationMode) {
        // enabled=true + CC 2.1+ + env flag missing
        process.stderr.write(
          '[VAIS] ⚠️  Agent Teams enabled but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env not set' +
          ' — using simulation. See ONBOARDING.md#agent-teams-activation\n'
        );
      } else if (!result.allowed && result.reason && result.reason.includes('< 2.1.0')) {
        // enabled=true + env flag set + CC < 2.1
        process.stderr.write(
          '[VAIS] ⚠️  Agent Teams requires Claude Code 2.1+' +
          ' — sequential fallback\n'
        );
      }
      // allowed=true + simulationMode=false → 조용 (정상 활성)
    }
    // agentTeamsEnabled=false → 조용
  } catch (_) {
    // silent — hook 가 hard fail 하지 않도록
  }

  const VERSION = config.version || '0.0.0';
  const activeFeature = getActiveFeature();
  // v4 (agent-teams-orchestration) — 다중 활성 피처 지원 (backward compatible)
  const activeFeatures = getActiveFeatures();
  const status = getStatus();
  const featureNames = Object.keys(status.features || {});

  let ctx = '';

  // Ideation 자동 복원 (in-progress 감지 시 5 줄 요약 prepend)
  try {
    const inProgressList = listInProgressIdeations();
    if (Array.isArray(inProgressList) && inProgressList.length > 0) {
      ctx += _renderIdeationRestore(inProgressList) + '\n\n';
    }
  } catch (e) {
    debugLog('SessionStart', 'Ideation restore failed', { error: e.message });
  }

  // --- 헤더 + 피처 목록 (v2.0: 슬림 상태 요약만 — ASCII 박스/스타일 전문 주입 폐지) ---
  ctx += `# VAIS Code v${VERSION}\n\n`;

  if (featureNames.length > 0) {
    ctx += `## 진행 중인 피처\n\n`;
    const activeSet = new Set(activeFeatures); // v4 — 다중 활성 피처 지원
    for (const fname of featureNames) {
      try {
        const summary = getProgressSummary(fname);
        if (!summary) continue;
        const marker = activeSet.has(fname) ? '👉 ' : '   ';
        ctx += `${marker}**${fname}** — ${summary.currentPhaseName} ${summary.progressCompact}\n`;
      } catch (e) {
        debugLog('SessionStart', 'feature summary failed', { feature: fname, error: e.message });
        const marker = activeSet.has(fname) ? '👉 ' : '   ';
        ctx += `${marker}**${fname}** — ⚠️ status 스키마 손상 — .vais/status.json 삭제 후 세션 재시작\n`;
      }
    }
    if (activeFeatures.length > 1) {
      ctx += `\n> ℹ️  v4: ${activeFeatures.length}개 피처 동시 활성 (agent-teams-orchestration 멀티피처 모드)\n`;
    }
    ctx += `\n`;
  }

  // --- 시작 힌트 (1줄) ---
  ctx += `시작: \`/vais cto plan {기능}\` · 상태: \`/vais status\` · 도움말: \`/vais help\`\n`;

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

/**
 * In-progress ideation 5 줄 요약 렌더.
 * @param {Array<{feature, ideation}>} list
 * @returns {string} 마크다운 블록
 */
function _renderIdeationRestore(list) {
  const lines = [];
  for (const { feature, ideation } of list) {
    lines.push(`🔄 **진행 중 ideation 발견** — \`${feature}\` (turn ${ideation.lastTurn || '?'})`);

    // Decision Record 마지막 3
    try {
      if (ideation.mainMdPath && fs.existsSync(ideation.mainMdPath)) {
        const content = fs.readFileSync(ideation.mainMdPath, 'utf8');
        const dr = content.match(/## Decision Record[\s\S]*?\n((?:\|[^\n]+\|\n)+)/);
        if (dr) {
          const allRows = dr[1].split('\n').filter(l => l.startsWith('|'));
          const dataRows = allRows.slice(2).slice(-3);
          if (dataRows.length > 0) {
            lines.push(`📌 **핵심 결정 (Decision Record 마지막 3)**:`);
            // 표 형식 그대로 출력 (header + separator 포함하여 markdown 표 유지)
            lines.push(allRows[0]); // header
            lines.push(allRows[1]); // separator
            dataRows.forEach(r => lines.push(r));
          }
        }
      }
    } catch (_) { /* silent */ }

    // working-notes 마지막 entry
    try {
      if (ideation.workingNotesPath && fs.existsSync(ideation.workingNotesPath)) {
        const content = fs.readFileSync(ideation.workingNotesPath, 'utf8');
        const sections = content.split(/^### /m);
        if (sections.length >= 2) {
          const last = '### ' + sections[sections.length - 1].split('\n').slice(0, 4).join('\n');
          lines.push(``);
          lines.push(`📝 **마지막 working-notes**:`);
          lines.push(last.slice(0, 400));
        }
      }
    } catch (_) { /* silent */ }

    lines.push(``);
    lines.push(`💡 **계속하시려면**: 그대로 ideation 이어서 발화하세요. 새로 시작하려면 \`/vais ceo ideation {새-피처명}\`.`);
    lines.push(``);
  }
  return lines.join('\n');
}

module.exports = { main, _renderIdeationRestore };

if (require.main === module) {
  main();
}
