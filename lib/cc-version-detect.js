'use strict';

/**
 * Claude Code 버전 감지 — agentTeams (v2) fallback 결정용.
 *
 * 2.1.x+ = Agent Teams (background sessions + SendMessage) 검증 버전.
 * 2.0.x 또는 파싱 실패 = sequential fallback 안전 모드.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MIN_AGENT_TEAMS_MAJOR = 2;
const MIN_AGENT_TEAMS_MINOR = 1;

let _cached = null;

// 실험적 flag 캐시 — _cached 와 독립 (env 변화 시 getClaudeVersion 재호출 없이 flag 만 리셋 가능)
let _flagCached = null;

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
 * CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 플래그 감지.
 * 우선순위: env 변수 → ~/.claude/settings.json → none
 *
 * @returns {{ enabled: boolean, source: 'env' | 'settings.json' | 'none', raw: string | null }}
 */
// @see https://nodejs.org/api/process.html#processenv
// @see https://nodejs.org/api/fs.html#fsreadfilesyncpath-options
function detectExperimentalAgentTeamsFlag() {
  if (_flagCached !== null) return _flagCached;

  // 1. env 변수 우선
  const envVal = process.env['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'];
  if (envVal !== undefined) {
    _flagCached = {
      enabled: envVal === '1' || envVal === 'true',
      source: 'env',
      raw: envVal,
    };
    return _flagCached;
  }

  // 2. settings.json fallback
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    const val = parsed['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'];
    if (val !== undefined) {
      _flagCached = {
        enabled: val === '1' || val === 'true' || val === true,
        source: 'settings.json',
        raw: String(val),
      };
      return _flagCached;
    }
  } catch (_) {
    // 파일 없거나 파싱 실패 — none 으로 fall-through
  }

  // 3. 미설정
  _flagCached = { enabled: false, source: 'none', raw: null };
  return _flagCached;
}

/**
 * agentTeams 활성 여부 종합 판정.
 * @param {boolean} enabledConfig - vais.config.json > orchestration.agentTeams.enabled
 * @returns {{ allowed: boolean, reason: string, version: object | null, simulationMode: boolean | undefined, flagInfo: object | null }}
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

  // CC 2.1+ 확인됨 — flag 감지로 real/simulation 결정
  const flagInfo = detectExperimentalAgentTeamsFlag();

  if (!flagInfo.enabled) {
    return {
      allowed: true,
      reason: `CC ${v.major}.${v.minor}.${v.patch} / flag not set (source: ${flagInfo.source}) — simulation mode`,
      version: v,
      simulationMode: true,
      flagInfo,
    };
  }

  return {
    allowed: true,
    reason: `CC ${v.major}.${v.minor}.${v.patch} / flag set (source: ${flagInfo.source}) — real SendMessage`,
    version: v,
    simulationMode: false,
    flagInfo,
  };
}

function _resetCache() {
  _cached = null;
}

/** 테스트용 — flag 캐시만 초기화 */
function _resetFlagCache() {
  _flagCached = null;
}

module.exports = {
  getClaudeVersion,
  checkAgentTeamsAllowed,
  detectExperimentalAgentTeamsFlag,
  MIN_AGENT_TEAMS_MAJOR,
  MIN_AGENT_TEAMS_MINOR,
  _resetCache,
  _resetFlagCache,
};
