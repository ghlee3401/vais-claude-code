#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] doc-tracker crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] doc-tracker rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Document Tracker (PostToolUse: Write|Edit)
 * 문서 작성/수정 시 워크플로우 상태 자동 업데이트
 */
const fs = require('fs');
const path = require('path');
const { readStdin, parseHookInput, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');
const { updatePhase, updateRolePhase, getActiveFeature } = require('../lib/status');
const { addEntry } = require('../lib/memory');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { sendWebhook } = require('../lib/webhook');

/**
 * 선행 필수 phase 완료 여부 검증
 * mandatoryPhases 기준으로 현재 phase 이전의 필수 phase가 모두 완료되었는지 확인
 * @param {string} phase - 현재 작성 중인 phase
 * @param {string} feature - 피처명
 * @param {string} role - C-Level 역할
 * @param {object} config - vais.config.json
 * @returns {{ ok: boolean, missing: string[] }}
 */
function checkPhaseOrder(phase, feature, role, config) {
  const phases = config.workflow?.phases || [];
  const mandatory = config.workflow?.mandatoryPhases || [];
  const currentIdx = phases.indexOf(phase);

  if (currentIdx <= 0) return { ok: true, missing: [] };

  const missing = [];
  for (let i = 0; i < currentIdx; i++) {
    const prevPhase = phases[i];
    // 필수 phase만 검증 (design, report 등 선택 phase는 건너뛸 수 있음)
    if (!mandatory.includes(prevPhase)) continue;
    // 현재 작성 중인 phase와 같은 role의 선행 문서가 존재하는지 확인
    const docPath = resolveDocPath(prevPhase, feature, role);
    if (docPath && !fs.existsSync(docPath)) {
      missing.push(prevPhase);
    }
  }

  return { ok: missing.length === 0, missing };
}

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
        // null/empty/미치환 가드: endsWith('')는 항상 true이므로 false positive 방지
        if (!expected || /\{.+\}/.test(expected)) continue;
        if (filePath.endsWith(expected) || filePath.endsWith(path.normalize(expected))) {
          // Phase Order Guard: 선행 필수 phase 완료 여부 검증
          const orderCheck = checkPhaseOrder(phase, activeFeature, role, config);
          if (!orderCheck.ok) {
            const phaseNames = config.workflow?.phaseNames || {};
            const missingNames = orderCheck.missing.map(p => phaseNames[p] || p).join(', ');
            logHook('PostToolUse:Write', 'phase_order_warn', { role, phase, missing: orderCheck.missing });
            outputAllow(
              `⚠️ [Phase Order] "${activeFeature}" - [${role.toUpperCase()}] ${phaseNames[phase] || phase} 문서 작성 전에 ` +
              `선행 필수 단계(${missingNames})의 문서가 작성되어야 합니다.\n` +
              `워크플로우 순서: plan → design → do → qa → report\n` +
              `선행 문서를 먼저 작성해주세요.`
            );
            process.exit(0);
          }

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
