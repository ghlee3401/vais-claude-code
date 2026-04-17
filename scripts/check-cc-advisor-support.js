#!/usr/bin/env node
/**
 * VAIS Code - CC Advisor Support Check
 *
 * 세션 시작 시 CC가 frontmatter `advisor:` 필드를 직접 인식하는지 판정.
 * 결과를 .vais/advisor-mode.json에 캐시.
 *
 * @see docs/_legacy/01-plan/features/v050/04-advisor-integration.plan.md §2.7
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const MODE_FILE = path.join(PROJECT_DIR, '.vais', 'advisor-mode.json');

function writeMode(mode, detail) {
  const dir = path.dirname(MODE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = {
    mode,
    detail,
    checked_at: new Date().toISOString(),
    cc_version: process.env.CLAUDE_CODE_VERSION || 'unknown',
  };
  fs.writeFileSync(MODE_FILE, JSON.stringify(data, null, 2));
  return data;
}

function check() {
  // CC advisor support 판정 로직:
  // 1. @anthropic-ai/sdk 사용 가능 여부
  // 2. ANTHROPIC_API_KEY 존재 여부
  // 3. CC 환경 변수로 native advisor 판정

  // native 판정: CC가 subagent frontmatter의 advisor 필드를 자동으로 advisor tool로 변환하는 경우
  // 현재 CC 버전에서는 이 기능이 beta이므로 환경 변수로 판정
  const ccVersion = process.env.CLAUDE_CODE_VERSION || '';
  const nativeEnv = process.env.VAIS_ADVISOR_MODE;

  if (nativeEnv === 'native') {
    return writeMode('native', 'VAIS_ADVISOR_MODE=native');
  }

  if (nativeEnv === 'disabled') {
    return writeMode('disabled', 'VAIS_ADVISOR_MODE=disabled');
  }

  // SDK 사용 가능 + API 키 존재 → wrapper fallback
  try {
    require('@anthropic-ai/sdk');
    if (process.env.ANTHROPIC_API_KEY) {
      return writeMode('wrapper', 'SDK available + API key present');
    }
    return writeMode('disabled', 'SDK available but no API key');
  } catch (_) {
    // SDK 미설치
    return writeMode('disabled', 'SDK not installed, advisor disabled');
  }
}

if (require.main === module) {
  const result = check();
  process.stdout.write(`[VAIS] Advisor mode: ${result.mode} (${result.detail})\n`);
}

module.exports = { check, MODE_FILE };
