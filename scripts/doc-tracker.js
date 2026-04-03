#!/usr/bin/env node
/**
 * VAIS Code - Document Tracker (PostToolUse: Write|Edit)
 * 문서 작성/수정 시 워크플로우 상태 자동 업데이트
 */
const path = require('path');
const { readStdin, parseHookInput, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { updatePhase, updateRolePhase, getActiveFeature } = require('../lib/status');
const { addEntry } = require('../lib/memory');
const { loadConfig } = require('../lib/paths');
const { sendWebhook } = require('../lib/webhook');

function main() {
  const input = readStdin();
  const { filePath } = parseHookInput(input);

  if (!filePath) {
    outputAllow();
    process.exit(0);
  }

  const config = loadConfig();
  const docPaths = config.workflow?.docPaths || {};
  const roles = Object.keys(config.cSuite?.roles || {});
  const activeFeature = getActiveFeature();

  // 작성된 파일이 워크플로우 문서인지 확인 (role-aware 매칭)
  if (activeFeature) {
    for (const role of roles) {
      for (const [phase, template] of Object.entries(docPaths)) {
        const expected = template
          .replace(/\{role\}/g, role)
          .replace(/\{feature\}/g, activeFeature);
        if (filePath.endsWith(expected) || filePath.endsWith(path.normalize(expected))) {
          // role별 phase 업데이트
          updateRolePhase(activeFeature, role, phase, 'completed');
          // 하위 호환: 기존 flat phases도 업데이트
          updatePhase(activeFeature, phase, 'completed');
          debugLog('DocTracker', 'Phase completed via doc write', { role, phase, feature: activeFeature });

          // Manager memory에 milestone 기록
          try {
            const pn = config.workflow?.phaseNames || {};
            const milestoneName = pn[phase] || phase;
            addEntry({
              type: 'milestone',
              feature: activeFeature,
              phase: phase,
              summary: `[${role.toUpperCase()}] ${milestoneName} 단계 완료 — ${path.basename(filePath)}`,
              details: { filePath, phase, role },
            });
          } catch (memErr) {
            debugLog('DocTracker', 'Memory write failed (non-critical)', { error: memErr.message });
          }

          // 웹훅 알림 (VAIS_WEBHOOK_URL 설정 시)
          sendWebhook('phase_complete', {
            feature: activeFeature,
            phase: phase,
            role: role,
            file: path.basename(filePath),
          });

          const phaseNames = config.workflow?.phaseNames || {};
          const phaseName = phaseNames[phase] || phase;
          logHook('PostToolUse:Write', 'ok', { feature: activeFeature, role, phase, file: path.basename(filePath) });
          outputAllow(`✅ "${activeFeature}" - [${role.toUpperCase()}] ${phaseName} 문서 작성 완료. 워크플로우 상태가 업데이트되었습니다.`);
          process.exit(0);
        }
      }
    }
  }

  outputAllow();
  process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
