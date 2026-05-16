'use strict';

/**
 * Claude Code 버전 감지 — agentTeams (v2) fallback 결정용.
 *
 * 2.1.x+ = Agent Teams (background sessions + SendMessage) 검증 버전.
 * 2.0.x 또는 파싱 실패 = sequential fallback 안전 모드.
 */

const { execSync } = require('child_process');

const MIN_AGENT_TEAMS_MAJOR = 2;
const MIN_AGENT_TEAMS_MINOR = 1;

let _cached = null;

function getClaudeVersion() {
  if (_cached !== null) return _cached;
  try {
    const out = execSync('claude --version', { encoding: 'utf8', timeout: 5000 });
    // 예상 출력: "2.1.143 (Claude Code)" 또는 "2.1.143"
    const m = out.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!m) {
      _cached = { detected: false, raw: out.trim(), supportsAgentTeams: false };
      return _cached;
    }
    const [_, major, minor, patch] = m.map((x, i) => (i === 0 ? x : Number(x)));
    const supportsAgentTeams =
      major > MIN_AGENT_TEAMS_MAJOR ||
      (major === MIN_AGENT_TEAMS_MAJOR && minor >= MIN_AGENT_TEAMS_MINOR);
    _cached = {
      detected: true,
      major,
      minor,
      patch,
      raw: out.trim(),
      supportsAgentTeams,
    };
    return _cached;
  } catch (e) {
    _cached = { detected: false, error: e.message, supportsAgentTeams: false };
    return _cached;
  }
}

/**
 * agentTeams 활성 여부 종합 판정.
 * @param {boolean} enabledConfig - vais.config.json > orchestration.agentTeams.enabled
 * @returns {{ allowed: boolean, reason: string, version: object }}
 */
function checkAgentTeamsAllowed(enabledConfig) {
  if (!enabledConfig) {
    return { allowed: false, reason: 'agentTeams.enabled=false (opt-out)', version: null };
  }
  const v = getClaudeVersion();
  if (!v.detected) {
    return {
      allowed: false,
      reason: `Claude Code 버전 감지 실패 (${v.error || 'parse fail'}) — sequential fallback`,
      version: v,
    };
  }
  if (!v.supportsAgentTeams) {
    return {
      allowed: false,
      reason: `Claude Code ${v.major}.${v.minor}.${v.patch} < 2.1.0 — sequential fallback`,
      version: v,
    };
  }
  return {
    allowed: true,
    reason: `Claude Code ${v.major}.${v.minor}.${v.patch} supports Agent Teams`,
    version: v,
  };
}

function _resetCache() {
  _cached = null;
}

module.exports = {
  getClaudeVersion,
  checkAgentTeamsAllowed,
  MIN_AGENT_TEAMS_MAJOR,
  MIN_AGENT_TEAMS_MINOR,
  _resetCache,
};
