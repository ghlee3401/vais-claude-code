/**
 * VAIS Code - Debug Logging
 */
const fs = require('fs');
const path = require('path');

const os = require('os');

const LOG_PATH = process.env.VAIS_DEBUG_LOG
  || path.join(os.homedir(), '.vais-debug.log');

/**
 * 디버그 로그 출력 (VAIS_DEBUG=1 일 때만)
 */
function debugLog(source, message, data) {
  if (!process.env.VAIS_DEBUG) return;
  try {
    let dataStr = '';
    if (data) {
      try { dataStr = ' ' + JSON.stringify(data); }
      catch { dataStr = ' [circular or non-serializable]'; }
    }
    const entry = `[${new Date().toISOString()}] [${source}] ${message}${dataStr}\n`;
    fs.appendFileSync(LOG_PATH, entry);
  } catch (e) {
    process.stderr.write(`[VAIS Debug] Log write failed: ${e.message}\n`);
  }
}

module.exports = { debugLog, LOG_PATH };
