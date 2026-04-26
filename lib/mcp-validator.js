'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadConfig } = require('./paths');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VENDOR_DIR = path.join(PROJECT_ROOT, 'vendor', 'ui-ux-pro-max');
const VENDOR_DATA_DIR = path.join(VENDOR_DIR, 'data');
const VENDOR_SCRIPT = path.join(VENDOR_DIR, 'scripts', 'search.py');
const MASTER_DIR_BASE = path.join(PROJECT_ROOT, 'design-system');
const FEATURE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MIN_PYTHON_MAJOR = 3;
const MIN_PYTHON_MINOR = 8;

function isMcpEnabled() {
  try {
    const config = loadConfig();
    const flag =
      config?.orchestration?.mcp?.enabled ??
      config?.mcp?.enabled;
    if (flag === undefined || flag === null) return true;
    if (typeof flag === 'boolean') return flag;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return Boolean(flag);
  } catch (_) {
    return true;
  }
}

function checkPython() {
  try {
    const stdout = execFileSync('python3', ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const m = stdout.match(/Python (\d+)\.(\d+)\.(\d+)/);
    if (!m) return { ok: false, reason: 'parse-fail', detail: stdout.trim() };
    const [, major, minor] = m;
    const M = Number(major);
    const N = Number(minor);
    if (M < MIN_PYTHON_MAJOR || (M === MIN_PYTHON_MAJOR && N < MIN_PYTHON_MINOR)) {
      return {
        ok: false,
        reason: 'version-too-low',
        detail: `현재 ${M}.${N}, 필요 ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR}+`,
      };
    }
    return { ok: true, version: `${M}.${N}` };
  } catch (e) {
    return {
      ok: false,
      reason: 'not-installed',
      detail: String(e?.message ?? e).slice(0, 200),
    };
  }
}

function checkVendor() {
  if (!fs.existsSync(VENDOR_DIR)) {
    return { ok: false, reason: 'vendor-missing', detail: VENDOR_DIR };
  }
  if (!fs.existsSync(VENDOR_DATA_DIR)) {
    return { ok: false, reason: 'vendor-missing', detail: VENDOR_DATA_DIR };
  }
  const entries = fs.readdirSync(VENDOR_DATA_DIR);
  if (entries.length === 0) {
    return { ok: false, reason: 'vendor-empty', detail: VENDOR_DATA_DIR };
  }
  if (!fs.existsSync(VENDOR_SCRIPT)) {
    return { ok: false, reason: 'vendor-missing', detail: VENDOR_SCRIPT };
  }
  return { ok: true };
}

function validateEnvironment() {
  const py = checkPython();
  if (!py.ok) return py;
  const vendor = checkVendor();
  if (!vendor.ok) return vendor;
  return { ok: true, pythonVersion: py.version };
}

function buildErrorMessage(result) {
  const reasonText = {
    'not-installed': 'Python3 가 설치되지 않았습니다.',
    'version-too-low': `Python3 버전 부족 — ${result.detail}`,
    'parse-fail': `Python3 버전 파싱 실패 — ${result.detail}`,
    'vendor-missing': `vendor/ui-ux-pro-max 디렉토리/파일 누락 — ${result.detail}`,
    'vendor-empty': `vendor/ui-ux-pro-max/data 디렉토리 비어있음 — ${result.detail}`,
  };
  const text = reasonText[result.reason] ?? `알 수 없는 오류 — ${result.reason}`;
  return [
    '',
    '❌ design-system MCP 활성화 실패',
    '',
    `원인: ${text}`,
    '',
    '조치:',
    '  1. Python3 설치: https://www.python.org/downloads/ (또는 brew/apt/dnf)',
    '  2. vendor 디렉토리 무결성 확인: ls vendor/ui-ux-pro-max/data/',
    '  3. plugin 재설치: claude code plugin install vais-code',
    '',
    '상세: README#Installation 또는 CLAUDE.md "## 의존성"',
    '',
    '긴급 우회 (권장하지 않음): vais.config.json > orchestration.mcp.enabled: false',
    '',
  ].join('\n');
}

function masterPath(feature) {
  return path.join(MASTER_DIR_BASE, feature, 'MASTER.md');
}

function hasMasterDoc(feature) {
  const p = masterPath(feature);
  if (!fs.existsSync(p)) return false;
  const stat = fs.statSync(p);
  return stat.isFile() && stat.size > 0;
}

function runGenerate(feature, opts = {}) {
  if (!FEATURE_NAME_PATTERN.test(feature)) {
    return {
      ok: false,
      stderr: `feature 이름 규칙 위반: '${feature}' (허용: ${FEATURE_NAME_PATTERN})`,
    };
  }
  const query = opts.query ?? `vais-code ${feature}`;
  if (!/^[\w\s.,/:#-]{1,200}$/.test(query)) {
    return { ok: false, stderr: `query 입력 검증 실패: ${query.slice(0, 60)}…` };
  }
  try {
    execFileSync(
      'python3',
      [VENDOR_SCRIPT, query, '--design-system', '--persist', '-p', feature],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: PROJECT_ROOT }
    );
    const p = masterPath(feature);
    if (!fs.existsSync(p)) {
      return { ok: false, stderr: `MASTER.md 가 생성되지 않음: ${p}` };
    }
    return { ok: true, masterPath: p };
  } catch (e) {
    return {
      ok: false,
      stderr: String(e?.stderr ?? e?.message ?? e).slice(0, 500),
    };
  }
}

module.exports = {
  isMcpEnabled,
  validateEnvironment,
  buildErrorMessage,
  hasMasterDoc,
  runGenerate,
  masterPath,
  _internal: { checkPython, checkVendor, FEATURE_NAME_PATTERN },
};
