/**
 * VAIS Code - Hook 실행 로그
 * 모든 hook이 실행 시 .vais/hook-log.jsonl에 기록
 * 디버깅 및 신뢰성 확인용
 */
const fs = require('fs');
const path = require('path');

const HOOK_LOG_PATH = path.join(process.cwd(), '.vais', 'hook-log.jsonl');
const MAX_LOG_LINES = 500;

/**
 * Hook 실행을 기록
 * @param {string} hookName - e.g. 'SessionStart', 'PreToolUse:Bash', 'PostToolUse:Write'
 * @param {string} status - 'start' | 'ok' | 'error'
 * @param {object} [meta] - 추가 정보
 */
function logHook(hookName, status, meta = {}) {
  try {
    const dir = path.dirname(HOOK_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      hook: hookName,
      status,
      ...meta,
    });

    fs.appendFileSync(HOOK_LOG_PATH, entry + '\n', 'utf8');

    // 간단한 라인 수 제한 — 500줄 초과 시 앞쪽 250줄 삭제
    try {
      const content = fs.readFileSync(HOOK_LOG_PATH, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      if (lines.length > MAX_LOG_LINES) {
        const trimmed = lines.slice(-250);
        fs.writeFileSync(HOOK_LOG_PATH, trimmed.join('\n') + '\n', 'utf8');
      }
    } catch {
      // 트리밍 실패는 무시
    }
  } catch {
    // hook 로깅 실패가 hook 실행을 막으면 안 됨
  }
}

module.exports = { logHook, HOOK_LOG_PATH };
