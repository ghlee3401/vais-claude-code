/**
 * VAIS Code - Path Registry
 * 상태 파일 및 문서 경로 중앙 관리
 */
const path = require('path');
const fs = require('fs');

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
 * 피처 문서 경로 해석
 */
function resolveDocPath(phase, feature) {
  const config = loadConfig();
  const template = config.workflow?.docPaths?.[phase];
  if (!template || !feature) return '';
  return path.join(PROJECT_DIR, template.replace(/\{feature\}/g, feature));
}

/**
 * 문서 존재 여부 확인
 */
function findDoc(phase, feature) {
  const docPath = resolveDocPath(phase, feature);
  if (docPath && fs.existsSync(docPath)) return docPath;
  return '';
}

/**
 * 설정 파일 로드 (프로세스 내 캐싱)
 */
let _configCache = null;
function loadConfig() {
  if (_configCache) return _configCache;
  try {
    const configPath = CONFIG.vaisConfig();
    _configCache = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return _configCache;
  } catch (e) {
    return { version: '0.1.0', workflow: { phases: [] } };
  }
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
  } catch (e) { /* ignore */ }
  return '';
}

module.exports = {
  PLUGIN_ROOT,
  PROJECT_DIR,
  STATE,
  CONFIG,
  ensureVaisDirs,
  resolveDocPath,
  findDoc,
  loadConfig,
  loadProjectConfig,
  saveProjectConfig,
  loadOutputStyle,
};
