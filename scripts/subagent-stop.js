#!/usr/bin/env node
/**
 * VAIS Code - SubagentStop Handler
 * 서브에이전트 작업 완료 시 결과 로깅
 *
 * [확장 포인트] 현재는 로깅만 수행합니다.
 * 향후 서브에이전트 결과 집계, 성능 메트릭 수집 등으로 확장할 수 있습니다.
 */
const { readStdin, outputAllow } = require('../lib/io');
const { debugLog } = require('../lib/debug');

const input = readStdin();
const agentName = input?.agent_name || input?.subagent_name || 'unknown';
const result = input?.result || input?.output || '';

debugLog('SubagentStop', `Agent "${agentName}" completed`, {
  resultLength: typeof result === 'string' ? result.length : 0,
});

outputAllow();
process.exit(0);
