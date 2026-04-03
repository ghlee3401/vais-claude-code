#!/usr/bin/env node
/**
 * Stop Hook — stop-handler
 *
 * Claude 응답 완료 시 실행됩니다.
 * 역할: 체크포인트 저장, 상태 스냅샷
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const STATE_DIR = path.join(ROOT, '.state');
const CHECKPOINT_FILE = path.join(STATE_DIR, 'checkpoint.json');

function main() {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });

    const checkpoint = {
      timestamp: new Date().toISOString(),
      session: process.env.CLAUDE_SESSION_ID || 'unknown',
    };

    const tmp = CHECKPOINT_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(checkpoint, null, 2));
    fs.renameSync(tmp, CHECKPOINT_FILE);
  } catch {
    // Stop hook 실패는 무시 (Claude 흐름 방해 금지)
  }
}

main();
