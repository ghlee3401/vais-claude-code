#!/usr/bin/env node
/**
 * VAIS Code - Checkpoint Tracker (PostToolUse: AskUserQuestion)
 * C-Level 에이전트의 AskUserQuestion 호출을 event-log에 기록.
 * SubagentStop 시 cp-guard.js가 이 기록을 검증하여 CP 건너뛰기를 방지합니다.
 */
const { readStdin, parseHookInput, outputAllow } = require('../lib/io');
const { logHook } = require('../lib/hook-logger');
const { debugLog } = require('../lib/debug');

function main() {
  const input = readStdin();
  // AskUserQuestion의 tool_input에서 question 추출
  const toolInput = input?.tool_input || input?.input || {};
  const question = toolInput.question || '';

  // agent_state에서 현재 활성 에이전트 확인
  let activeRole = null;
  try {
    const fs = require('fs');
    const statePath = '.vais/agent-state.json';
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.active_agents && state.active_agents.length > 0) {
        // 가장 최근 활성 에이전트
        activeRole = state.active_agents[state.active_agents.length - 1].role;
      }
    }
  } catch (e) {
    debugLog('CPTracker', 'agent-state read failed', { error: e.message });
  }

  if (!activeRole) {
    outputAllow();
    process.exit(0);
  }

  // CP 패턴 감지 (질문에서 [CP-X] 패턴 추출)
  const cpMatch = question.match(/\[CP-([A-Z0-9]+)\]/i);
  const cpId = cpMatch ? `CP-${cpMatch[1].toUpperCase()}` : 'CP-UNKNOWN';

  // event-log에 checkpoint 이벤트 기록
  try {
    const { EventLogger } = require('../lib/observability/index');
    const el = new EventLogger('.vais/event-log.jsonl');
    el.log('checkpoint', {
      role: activeRole,
      cp: cpId,
      question: question.substring(0, 200),
    });
    logHook('PostToolUse:AskUserQuestion', 'ok', { role: activeRole, cp: cpId });
    debugLog('CPTracker', 'Checkpoint recorded', { role: activeRole, cp: cpId });
  } catch (err) {
    debugLog('CPTracker', 'event-log write failed', { error: err.message });
  }

  outputAllow();
  process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
