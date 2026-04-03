#!/usr/bin/env node
/**
 * SubagentStart/SubagentStop Hook — agent-tracker
 *
 * 에이전트 시작/종료를 추적합니다.
 * Usage: node agent-tracker.js [start|stop] [agent-name] [outcome?]
 *
 * .state/agent-log.json에 기록합니다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const STATE_DIR = path.join(ROOT, '.state');
const LOG_FILE = path.join(STATE_DIR, 'agent-log.json');

const [, , action, agentName, outcome] = process.argv;

function loadLog() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function main() {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });

    const log = loadLog();
    log.push({
      action: action || 'unknown',
      agent: agentName || 'unknown',
      outcome: outcome || null,
      timestamp: new Date().toISOString(),
    });

    // 최근 200개만 유지
    if (log.length > 200) log.splice(0, log.length - 200);

    const tmp = LOG_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(log, null, 2));
    fs.renameSync(tmp, LOG_FILE);
  } catch {
    // 로깅 실패는 무시
  }
}

main();
