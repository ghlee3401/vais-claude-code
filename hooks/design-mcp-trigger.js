#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Design MCP Trigger Hook (PreToolUse)
 *
 * design phase 진입 (ui-designer Agent 호출) 감지 →
 *   1. mcp.enabled 체크 (opt-out 존중)
 *   2. activeFeature 의 currentPhase === 'design' 확인
 *   3. design-system/{feature}/MASTER.md idempotency 체크
 *   4. Python3 + vendor 무결성 검증 (Hard fail)
 *   5. design_system_generate 자동 호출 → MASTER.md 영속화
 *
 * @see docs/design-system-mcp-activation/02-design/main.md (D-D3, D-D5)
 * @see lib/mcp-validator.js
 */

const fs = require('fs');
const path = require('path');

const { readStdin, outputAllow, outputBlock } = require('../lib/io');
const {
  isMcpEnabled,
  validateEnvironment,
  buildErrorMessage,
  hasMasterDoc,
  runGenerate,
} = require('../lib/mcp-validator');
const { PROJECT_DIR } = require('../lib/paths');

const STATUS_PATH = path.join(PROJECT_DIR, '.vais', 'status.json');

function readActiveFeature() {
  try {
    if (!fs.existsSync(STATUS_PATH)) return { feature: null, phase: null };
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
    const feature = status?.activeFeature ?? null;
    const phase = feature ? status?.features?.[feature]?.currentPhase ?? null : null;
    return { feature, phase };
  } catch (_) {
    return { feature: null, phase: null };
  }
}

function shouldTrigger(input) {
  if (input?.tool_name !== 'Agent') return false;
  const subagent = input?.tool_input?.subagent_type;
  if (subagent !== 'ui-designer') return false;
  const { phase } = readActiveFeature();
  return phase === 'design';
}

function run() {
  const input = readStdin();

  if (!shouldTrigger(input)) {
    outputAllow();
    return;
  }

  if (!isMcpEnabled()) {
    outputAllow();
    return;
  }

  const { feature } = readActiveFeature();
  if (!feature) {
    outputAllow();
    return;
  }

  if (hasMasterDoc(feature)) {
    outputAllow();
    return;
  }

  const env = validateEnvironment();
  if (!env.ok) {
    process.stderr.write(buildErrorMessage(env));
    outputBlock(`design-system MCP 환경 검증 실패 — ${env.reason}`);
    process.exit(1);
  }

  const result = runGenerate(feature);
  if (!result.ok) {
    process.stderr.write(`\n❌ design_system_generate 실행 실패\n${result.stderr}\n\n`);
    outputBlock('design_system_generate 실행 실패');
    process.exit(1);
  }

  outputAllow();
}

if (require.main === module) {
  try {
    run();
  } catch (e) {
    process.stderr.write(`\n❌ design-mcp-trigger hook 내부 오류: ${e?.message ?? e}\n`);
    process.exit(1);
  }
}

module.exports = {
  shouldTrigger,
  readActiveFeature,
  run,
};
