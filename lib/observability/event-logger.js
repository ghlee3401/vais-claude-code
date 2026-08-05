const fs = require('fs');
const path = require('path');
const { validatePayload } = require('./schema');
const { shouldRotate, rotate } = require('./rotation');

// Design Ref: §2.1 — EventLogger는 append-only. 삭제/수정 없음. MCP 서버가 query()로 읽음
class EventLogger {
  constructor(logFilePath, rotationConfig = {}) {
    this.logFilePath = logFilePath;
    this.rotationConfig = rotationConfig;
    this._ensureDir();
  }

  _ensureDir() {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Plan SC: SC-03 — 이벤트 기록 (append-only JSONL)
  log(eventType, payload) {
    const validation = validatePayload(eventType, payload);
    if (!validation.valid) {
      // graceful degradation: 로깅 실패가 에이전트 실행을 막으면 안 됨
      console.error(`[vais observability] invalid event payload: ${validation.error}`);
      return;
    }

    if (shouldRotate(this.logFilePath, this.rotationConfig)) {
      rotate(this.logFilePath, this.rotationConfig);
    }

    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      event: eventType,
      ...payload,
    });

    fs.appendFileSync(this.logFilePath, entry + '\n', 'utf8');
  }

  // MCP 서버에서 사용: 필터링 조회
  query({ role, eventType, since, limit = 100 } = {}) {
    if (!fs.existsSync(this.logFilePath)) return [];

    const lines = fs.readFileSync(this.logFilePath, 'utf8')
      .split('\n')
      .filter(Boolean);

    let entries = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    if (role) entries = entries.filter(e => e.role === role);
    if (eventType) entries = entries.filter(e => e.event === eventType);
    if (since) {
      const sinceMs = new Date(since).getTime();
      entries = entries.filter(e => new Date(e.ts).getTime() >= sinceMs);
    }

    return entries.slice(-limit);
  }

  // decision 이벤트만 조회
  queryDecisions(feature) {
    const decisions = this.query({ eventType: 'decision' });
    if (!feature) return decisions;
    return decisions.filter(e => e.feature === feature);
  }

  get currentLogPath() {
    return this.logFilePath;
  }
}

module.exports = { EventLogger };
