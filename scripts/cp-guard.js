#!/usr/bin/env node
/**
 * VAIS Code - Checkpoint Guard
 * C-Level 에이전트 종료 시 필수 체크포인트(AskUserQuestion)가 호출되었는지 검증.
 *
 * 사용: node scripts/cp-guard.js <role>
 * 반환: JSON { passed, missing, warnings }
 *
 * 검증 기준:
 *   - C-Level 에이전트는 최소 1회 이상 AskUserQuestion(checkpoint)을 호출해야 함
 *   - event-log에서 해당 role의 'checkpoint' 이벤트를 조회
 *   - 미호출 시 경고 (exit(1)은 하지 않음 — 문서 강제와 달리 soft enforcement)
 *     → Full-Auto(--auto) 모드에서는 CP 없이 실행 가능해야 하므로
 */
const fs = require('fs');
const { C_LEVEL_ROLES } = require('./doc-validator');
const { getActiveFeature } = require('../lib/status');

/**
 * 에이전트 세션 시작 시점 조회 (agent-state.json에서)
 */
function getAgentStartTime(role) {
  try {
    const { EventLogger } = require('../lib/observability/index');
    const el = new EventLogger('.vais/event-log.jsonl');
    const starts = el.query({ role, eventType: 'agent_start', limit: 1 });
    // 가장 최근 시작 이벤트
    if (starts.length > 0) return starts[starts.length - 1].ts;
  } catch (_) { /* ignore */ }
  return null;
}

/**
 * 해당 role의 checkpoint 이벤트 조회
 */
function getCheckpoints(role, since) {
  try {
    const { EventLogger } = require('../lib/observability/index');
    const el = new EventLogger('.vais/event-log.jsonl');
    const opts = { role, eventType: 'checkpoint' };
    if (since) opts.since = since;
    return el.query(opts);
  } catch (_) {
    return [];
  }
}

/**
 * Full-Auto 모드 감지 (agent-state에서 auto 플래그 확인)
 */
function isFullAutoMode() {
  try {
    if (fs.existsSync('.vais/agent-state.json')) {
      const state = JSON.parse(fs.readFileSync('.vais/agent-state.json', 'utf8'));
      return state.autoMode === true;
    }
  } catch (_) { /* ignore */ }
  return false;
}

/**
 * CP Guard 검증
 * @param {string} role - C-Level 역할
 * @returns {{ passed: boolean, checkpointCount: number, warnings: string[] }}
 */
function validateCheckpoints(role) {
  const result = { passed: true, checkpointCount: 0, warnings: [] };

  if (!C_LEVEL_ROLES.includes(role)) {
    // 실행 에이전트는 CP 검증 대상 아님
    return result;
  }

  // Full-Auto 모드에서는 CP 검증 건너뜀
  if (isFullAutoMode()) {
    result.warnings.push('Full-Auto 모드 — CP 검증 생략');
    return result;
  }

  const startTime = getAgentStartTime(role);
  const checkpoints = getCheckpoints(role, startTime);
  result.checkpointCount = checkpoints.length;

  if (checkpoints.length === 0) {
    result.passed = false;
    result.warnings.push(
      `[${role.toUpperCase()}] AskUserQuestion(체크포인트)가 한 번도 호출되지 않았습니다.`,
      `CP 규칙: 각 단계 완료 후 반드시 사용자 확인을 받아야 합니다.`,
      `확인된 CP 이벤트: 0건`,
    );
  }

  return result;
}

/**
 * 검증 결과 포맷팅
 */
function formatCPResult(role, result) {
  if (result.passed && result.warnings.length === 0) return '';

  const lines = [];
  if (!result.passed) {
    lines.push(`⚠️  [${role.toUpperCase()}] 체크포인트 미호출 경고:`);
    for (const w of result.warnings) {
      lines.push(`   ⚠️  ${w}`);
    }
    lines.push(`   💡 에이전트는 주요 결정 시점에서 AskUserQuestion으로 사용자 확인을 받아야 합니다.`);
  } else if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      lines.push(`   ℹ️  ${w}`);
    }
  }

  return lines.join('\n');
}

// CLI 직접 실행
if (require.main === module) {
  const [role] = process.argv.slice(2);
  if (!role) process.exit(0);

  const result = validateCheckpoints(role);
  const output = formatCPResult(role, result);

  if (output) {
    process.stderr.write('\n' + output + '\n');
  }

  // JSON 결과 stdout
  process.stdout.write(JSON.stringify(result));
  // CP guard는 soft enforcement — exit(0) 유지 (경고만)
  process.exit(0);
}

module.exports = { validateCheckpoints, formatCPResult };
