/**
 * VAIS Code - Path Registry
 * 상태 파일 및 문서 경로 중앙 관리
 */
const path = require('path');
const fs = require('fs');
const { debugLog } = require('./debug');

// 플러그인 루트: 이 파일 기준 한 단계 위
const PLUGIN_ROOT = path.resolve(__dirname, '..');

// 프로젝트 루트: 현재 작업 디렉토리
const PROJECT_DIR = process.cwd();

/**
 * 상태 파일 경로
 */
const STATE = {
  root: () => path.join(PROJECT_DIR, '.vais'),
  status: () => path.join(PROJECT_DIR, '.vais', 'status.json'),
  memory: () => path.join(PROJECT_DIR, '.vais', 'memory.json'),
};

/**
 * 설정 파일 경로
 */
const CONFIG = {
  vaisConfig: () => {
    // 프로젝트에 vais.config.json이 있으면 우선
    const projectConfig = path.join(PROJECT_DIR, 'vais.config.json');
    if (fs.existsSync(projectConfig)) return projectConfig;
    return path.join(PLUGIN_ROOT, 'vais.config.json');
  },
  pluginJson: () => path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson: () => path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

/**
 * .vais/ 디렉토리 생성
 */
function ensureVaisDirs() {
  const root = STATE.root();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
}

/**
 * 경로 탈출(path traversal) 방지
 * @param {string} base - 기준 디렉토리 (절대 경로)
 * @param {string} relative - 상대 경로 입력
 * @returns {string} 검증된 절대 경로
 * @throws {Error} base 밖으로 벗어나면 차단
 */
function safePath(base, relative) {
  const resolved = path.resolve(base, relative);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error(`[VAIS] Path traversal blocked: "${relative}" escapes base "${base}"`);
  }
  return resolved;
}

/**
 * 피처 문서 경로 해석
 * @param {string} phase - 워크플로우 단계 (plan, design, do, qa, report)
 * @param {string} feature - 피처명
 * @param {string} [role='cto'] - C-Level 역할 (cto, ceo, cpo, cmo, cso, cfo, coo)
 */
function resolveDocPath(phase, feature, role) {
  const config = loadConfig();
  const template = config.workflow?.docPaths?.[phase];
  if (!template || !feature) return '';
  const effectiveRole = role || 'cto';
  const resolved = template
    .replace(/\{role\}/g, effectiveRole)
    .replace(/\{feature\}/g, feature);
  // 미치환 변수가 남아있으면 빈 문자열 반환
  if (/\{.+\}/.test(resolved)) {
    debugLog('Paths', 'Unresolved template variable', { phase, template: resolved });
    return '';
  }
  try {
    return safePath(PROJECT_DIR, resolved);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return '';
  }
}

/**
 * 문서 존재 여부 확인
 * @param {string} phase - 워크플로우 단계
 * @param {string} feature - 피처명
 * @param {string} [role='cto'] - C-Level 역할
 */
function findDoc(phase, feature, role) {
  const docPath = resolveDocPath(phase, feature, role);
  if (docPath && fs.existsSync(docPath)) return docPath;
  return '';
}

/**
 * 설정 파일 로드 (TTL 기반 캐싱 — 30초)
 */
let _configCache = null;
let _configCacheTime = 0;
const CONFIG_CACHE_TTL = 30000; // 30초

const CONFIG_REQUIRED_FIELDS = ['version', 'workflow', 'cSuite', 'orchestration'];

function loadConfig() {
  const now = Date.now();
  if (_configCache && (now - _configCacheTime) < CONFIG_CACHE_TTL) {
    return _configCache;
  }
  const configPath = CONFIG.vaisConfig();
  if (!fs.existsSync(configPath)) {
    process.stderr.write(`[VAIS] ⚠️  vais.config.json 미발견: ${configPath}\n`);
    process.stderr.write(`[VAIS]    기본 설정으로 계속합니다.\n`);
    return { version: '0.1.0', workflow: { phases: [] } };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const missing = CONFIG_REQUIRED_FIELDS.filter(f => !(f in parsed));
    if (missing.length > 0) {
      process.stderr.write(`[VAIS] ❌ vais.config.json 필수 필드 누락: ${missing.join(', ')}\n`);
      process.stderr.write(`[VAIS]    파일을 확인하고 누락된 필드를 추가해주세요.\n`);
      process.exit(1);
    }
    _configCache = parsed;
    _configCacheTime = now;
    return _configCache;
  } catch (e) {
    process.stderr.write(`[VAIS] ⚠️  vais.config.json 파싱 실패: ${e.message}\n`);
    process.stderr.write(`[VAIS]    설정 파일 형식을 확인해주세요.\n`);
    debugLog('Paths', 'loadConfig parse failed', { error: e.message });
    return { version: '0.1.0', workflow: { phases: [] } };
  }
}

/**
 * 설정 캐시 강제 초기화 (테스트용)
 */
function clearConfigCache() {
  _configCache = null;
  _configCacheTime = 0;
}

/**
 * 프로젝트별 설정 파일 경로 (.vais/project-config.json)
 */
function getProjectConfigPath() {
  return path.join(PROJECT_DIR, '.vais', 'project-config.json');
}

/**
 * 프로젝트별 설정 로드
 */
function loadProjectConfig() {
  try {
    const raw = fs.readFileSync(getProjectConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    debugLog('Paths', 'loadProjectConfig failed', { error: e.message });
    return {};
  }
}

/**
 * 프로젝트별 설정 저장
 */
function saveProjectConfig(projectConfig) {
  ensureVaisDirs();
  fs.writeFileSync(getProjectConfigPath(), JSON.stringify(projectConfig, null, 2), 'utf8');
}

/**
 * output-styles 디렉토리의 기본 스타일 파일 로드
 */
function loadOutputStyle() {
  try {
    const stylePath = path.join(PLUGIN_ROOT, 'output-styles', 'vais-default.md');
    if (fs.existsSync(stylePath)) {
      return fs.readFileSync(stylePath, 'utf8');
    }
  } catch (e) {
    debugLog('Paths', 'loadOutputStyle failed', { error: e.message });
  }
  return '';
}

module.exports = {
  PLUGIN_ROOT,
  PROJECT_DIR,
  STATE,
  CONFIG,
  ensureVaisDirs,
  safePath,
  resolveDocPath,
  findDoc,
  loadConfig,
  clearConfigCache,
  loadProjectConfig,
  saveProjectConfig,
  loadOutputStyle,
};
