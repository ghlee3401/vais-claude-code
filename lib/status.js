/**
 * VAIS Code - 워크플로우 상태 관리
 * .vais/status.json 기반 피처별 진행 상태 추적
 */
const fs = require('fs');
const path = require('path');
const { STATE, ensureVaisDirs, loadConfig } = require('./paths');
const { debugLog } = require('./debug');
const { atomicWriteSync } = require('./fs-utils');

// Lazy require to avoid circular dependency
let _migration = null;
function getMigration() {
  if (!_migration) { _migration = require('./core/migration'); }
  return _migration;
}

/**
 * 피처명 유효성 검증 (path traversal 방지)
 * 허용: 한글, 영문, 숫자, -, _
 */
const VALID_FEATURE_NAME = /^[a-zA-Z0-9가-힣_-]+$/;

function validateFeatureName(featureName) {
  if (!featureName || typeof featureName !== 'string') return false;
  if (!VALID_FEATURE_NAME.test(featureName)) return false;
  if (featureName.length > 100) return false;
  // 한글 포함 시 회귀 방지 경고 (템플릿 치환/파일 시스템 호환성 이슈 가능)
  if (/[가-힣]/.test(featureName)) {
    try { process.stderr.write(`[VAIS] ⚠️  feature name contains Hangul: "${featureName}" — kebab-case English recommended for template safety\n`); } catch (_) {}
  }
  return true;
}

/**
 * 빈 상태 객체 생성
 */
function createEmptyStatus() {
  return {
    version: 2,
    activeFeature: null,
    features: {},
  };
}

/**
 * 상태 파일 읽기
 */
function getStatus() {
  const statusPath = STATE.status();
  if (!fs.existsSync(statusPath)) {
    return createEmptyStatus();
  }
  try {
    const raw = fs.readFileSync(statusPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // 파일은 있지만 깨진 경우 — 사용자에게 경고
    process.stderr.write(`[VAIS] ⚠️  .vais/status.json 파싱 실패: ${e.message}\n`);
    process.stderr.write(`[VAIS]    빈 상태로 계속합니다. 문제 지속 시: rm .vais/status.json\n`);
    debugLog('Status', 'getStatus parse failed, using empty', { error: e.message });
    return createEmptyStatus();
  }
}

/**
 * 상태 파일 저장
 */
function saveStatus(status) {
  ensureVaisDirs();
  atomicWriteSync(STATE.status(), JSON.stringify(status, null, 2));
}

/**
 * 피처 상태 초기화
 */
function initFeature(featureName) {
  if (!validateFeatureName(featureName)) {
    debugLog('Status', 'Invalid feature name', { featureName });
    return null;
  }
  const status = getStatus();
  const config = loadConfig();
  const phases = config.workflow?.phases || [
    'plan', 'design', 'do', 'qa', 'report',
  ];

  if (!status.features[featureName]) {
    const phaseStatus = {};
    for (const phase of phases) {
      phaseStatus[phase] = {
        status: 'pending',
        startedAt: null,
        completedAt: null,
      };
    }
    status.features[featureName] = {
      createdAt: new Date().toISOString(),
      currentPhase: phases[0],
      phases: phaseStatus,
      gapAnalysis: null,
    };
  }

  status.activeFeature = featureName;
  saveStatus(status);
  return status;
}

/**
 * 피처의 현재 페이즈 업데이트
 */
function updatePhase(featureName, phase, phaseStatus) {
  let status = getStatus();
  if (!status.features[featureName]) {
    const initialized = initFeature(featureName);
    if (!initialized) return null;
    // initFeature가 저장한 상태를 다시 읽어서 진행 (재귀 대신 재로드)
    status = getStatus();
  }

  const feature = status.features[featureName];
  // 구 스키마 복구: phases 필드 누락 시 빈 객체로 초기화
  if (!feature.phases) feature.phases = {};
  // C-Level phase 동적 추가 (prd, security, marketing, finance, ops 등)
  if (!feature.phases[phase]) {
    feature.phases[phase] = {
      status: 'pending',
      startedAt: null,
      completedAt: null,
    };
  }
  if (feature.phases[phase]) {
    feature.phases[phase].status = phaseStatus;
    if (phaseStatus === 'in-progress') {
      feature.phases[phase].startedAt = new Date().toISOString();
      feature.currentPhase = phase;
    }
    if (phaseStatus === 'completed') {
      feature.phases[phase].completedAt = new Date().toISOString();
      const config = loadConfig();
      const phases = config.workflow?.phases || [];
      const idx = phases.indexOf(phase);
      if (idx >= 0 && idx < phases.length - 1) {
        feature.currentPhase = phases[idx + 1];
      }
    }
  }

  saveStatus(status);
  return status;
}

/**
 * C-Level role별 phase 업데이트
 * rolePhases[role][phase] 구조로 추적
 */
function updateRolePhase(featureName, role, phase, phaseStatus) {
  let status = getStatus();
  if (!status.features[featureName]) {
    const initialized = initFeature(featureName);
    if (!initialized) return null;
    status = getStatus();
  }

  const feature = status.features[featureName];
  if (!feature.rolePhases) feature.rolePhases = {};
  if (!feature.rolePhases[role]) feature.rolePhases[role] = {};
  if (!feature.rolePhases[role][phase]) {
    feature.rolePhases[role][phase] = {
      status: 'pending',
      startedAt: null,
      completedAt: null,
    };
  }

  feature.rolePhases[role][phase].status = phaseStatus;
  if (phaseStatus === 'in-progress') {
    feature.rolePhases[role][phase].startedAt = new Date().toISOString();
  }
  if (phaseStatus === 'completed') {
    feature.rolePhases[role][phase].completedAt = new Date().toISOString();
  }

  saveStatus(status);
  return status;
}

/**
 * C-Level role별 진행 상황 조회
 */
function getRoleProgress(featureName, role) {
  const status = getStatus();
  const feature = status.features[featureName];
  if (!feature || !feature.rolePhases || !feature.rolePhases[role]) return null;

  const config = loadConfig();
  const phases = config.workflow?.phases || [];
  const phaseNames = config.workflow?.phaseNames || {};
  const roleData = feature.rolePhases[role];

  let completedCount = 0;
  const entries = [];
  for (const phase of phases) {
    const ps = roleData[phase];
    if (ps?.status === 'completed') completedCount++;
    const icon = ps?.status === 'completed' ? '✅'
      : ps?.status === 'in-progress' ? '🔄'
      : ps ? '⬜' : '·';
    entries.push(`${icon}${phaseNames[phase] || phase}`);
  }

  return {
    role,
    feature: featureName,
    progress: entries.join(' → '),
    completedCount,
    totalPhases: Object.keys(roleData).length,
    phases: roleData,
  };
}

/**
 * 범위 실행 상태 설정 (start 커맨드용)
 */
function setRunRange(featureName, from, to) {
  let status = getStatus();
  if (!status.features[featureName]) {
    initFeature(featureName);
    status = getStatus();
  }

  const config = loadConfig();
  const phases = config.workflow?.phases || [];
  const fromIdx = phases.indexOf(from);
  const toIdx = phases.indexOf(to);

  if (fromIdx < 0 || toIdx < 0 || fromIdx > toIdx) return null;

  const rangePhases = phases.slice(fromIdx, toIdx + 1);
  status.features[featureName].runRange = {
    from,
    to,
    phases: rangePhases,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  saveStatus(status);
  return rangePhases;
}

/**
 * 범위 실행 완료 표시
 */
function completeRunRange(featureName) {
  const status = getStatus();
  if (status.features[featureName]?.runRange) {
    status.features[featureName].runRange.completedAt = new Date().toISOString();
    saveStatus(status);
  }
}

/**
 * 현재 범위 실행 정보 조회
 */
function getRunRange(featureName) {
  const status = getStatus();
  return status.features[featureName]?.runRange || null;
}

/**
 * Gap 분석 결과 저장
 */
function saveGapAnalysis(featureName, result) {
  let status = getStatus();
  if (!status.features[featureName]) {
    initFeature(featureName);
    status = getStatus();
  }

  status.features[featureName].gapAnalysis = {
    matchRate: result.matchRate,
    totalItems: result.totalItems,
    matchedItems: result.matchedItems,
    iteration: result.iteration || 1,
    maxIterations: result.maxIterations || 5,
    passed: result.matchRate >= (result.threshold || 90),
    gaps: result.gaps || [],
    mismatches: result.mismatches || [],
    timestamp: new Date().toISOString(),
  };

  saveStatus(status);
  return status;
}

/**
 * Gap 분석 결과 조회
 */
function getGapAnalysis(featureName) {
  const status = getStatus();
  return status.features[featureName]?.gapAnalysis || null;
}

/**
 * 활성 피처 가져오기
 */
function getActiveFeature() {
  const status = getStatus();
  return status.activeFeature;
}

/**
 * 피처 진행 상황 요약
 */
function getProgressSummary(featureName) {
  const status = getStatus();
  const feature = status.features[featureName];
  if (!feature) return null;

  const config = loadConfig();
  const phaseNames = config.workflow?.phaseNames || {};
  const phases = config.workflow?.phases || [];

  // 구 스키마 방어: phases 필드가 누락된 경우 빈 객체로 취급 (전부 ⬜ 로 표시)
  const featurePhases = feature.phases || {};

  const lines = [];
  let completedCount = 0;
  const totalCount = phases.length;
  for (const phase of phases) {
    const ps = featurePhases[phase];
    if (ps?.status === 'completed') completedCount++;
    const icon = ps?.status === 'completed' ? '✅'
      : ps?.status === 'in-progress' ? '🔄'
      : '⬜';
    lines.push(`${icon}${phaseNames[phase] || phase}`);
  }

  const progressIcons = phases.map(p => {
    const ps = featurePhases[p];
    if (ps?.status === 'completed') return '✅';
    if (ps?.status === 'in-progress') return '🔄';
    return '⬜';
  }).join('');

  return {
    feature: featureName,
    currentPhase: feature.currentPhase,
    currentPhaseName: phaseNames[feature.currentPhase] || feature.currentPhase,
    progress: lines.join(' → '),
    progressCompact: `[${completedCount}/${totalCount}] ${progressIcons}`,
    phases: featurePhases,
    gapAnalysis: feature.gapAnalysis,
  };
}

/**
 * 피처 레지스트리 저장
 * plan 단계에서 정의된 기능 목록을 구조화하여 저장
 * 이후 단계에서 자동 참조됨
 *
 * @param {string} featureName - 피처명
 * @param {object} registry - 피처 레지스트리
 * @param {Array} registry.features - 기능 목록
 *   [{ id: 'F1', name: '로그인', description: '...', screens: [...], priority: 'Must', status: '미구현' }]
 * @param {object} registry.policies - 정책 정의 (선택)
 * @param {object} registry.techStack - 기술 스택 (선택)
 * @param {boolean} registry.hasDatabase - DB 필요 여부
 */
function saveFeatureRegistry(featureName, registry) {
  if (!validateFeatureName(featureName)) {
    debugLog('Status', 'Invalid feature name for registry', { featureName });
    return null;
  }
  ensureVaisDirs();
  const registryDir = path.join(STATE.root(), 'features');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  const registryPath = path.join(registryDir, `${featureName}.json`);
  const data = {
    ...registry,
    featureName,
    createdAt: registry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  atomicWriteSync(registryPath, JSON.stringify(data, null, 2));
  return data;
}

/**
 * 피처 레지스트리 조회
 */
function getFeatureRegistry(featureName) {
  if (!validateFeatureName(featureName)) {
    debugLog('Status', 'Invalid feature name for registry read', { featureName });
    return null;
  }
  const registryPath = path.join(STATE.root(), 'features', `${featureName}.json`);
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (e) {
    debugLog('Status', 'getFeatureRegistry failed', { feature: featureName, error: e.message });
    return null;
  }
}

/**
 * 피처 레지스트리의 개별 기능 상태 업데이트
 * fe/be 단계에서 구현 완료 시 호출
 */
function updateFeatureStatus(featureName, featureId, newStatus) {
  if (!validateFeatureName(featureName)) return null;
  const registry = getFeatureRegistry(featureName);
  if (!registry || !registry.features) return null;

  const feature = registry.features.find(f => f.id === featureId);
  if (feature) {
    feature.status = newStatus;
    registry.updatedAt = new Date().toISOString();
    const registryPath = path.join(STATE.root(), 'features', `${featureName}.json`);
    atomicWriteSync(registryPath, JSON.stringify(registry, null, 2));
  }
  return registry;
}

/**
 * 상태 마이그레이션 실행
 */
/**
 * v0.57.0 Sub-doc Preservation — subDocs[] 트래킹
 *
 * 엔트리 구조:
 *   {
 *     phase: '02-design',
 *     kind: 'scratchpad' | 'topic',
 *     agent: 'ui-designer' | null,    // scratchpad 면 필수, topic 이면 null
 *     qualifier: 'review' | null,     // scratchpad 복수 산출물
 *     topic: 'architecture' | null,   // topic 이면 필수
 *     path: 'docs/{feature}/...',
 *     size: 4523,
 *     updatedAt: ISO-8601
 *   }
 */

function _subDocKey(entry) {
  if (entry.kind === 'scratchpad') {
    return `scratchpad:${entry.phase}:${entry.agent}:${entry.qualifier ?? ''}`;
  }
  if (entry.kind === 'topic') {
    return `topic:${entry.phase}:${entry.topic}`;
  }
  return null;
}

function _validateSubDocEntry(entry) {
  if (!entry || typeof entry !== 'object') return '엔트리는 object';
  if (!entry.kind) return 'kind 필수';
  if (entry.kind !== 'scratchpad' && entry.kind !== 'topic') return `kind 는 scratchpad|topic (got ${entry.kind})`;
  if (!entry.phase || typeof entry.phase !== 'string') return 'phase 필수 string';
  if (!entry.path || typeof entry.path !== 'string') return 'path 필수 string';
  if (entry.kind === 'scratchpad' && !entry.agent) return 'scratchpad 는 agent 필수';
  if (entry.kind === 'topic' && !entry.topic) return 'topic 은 topic 필수';
  return null;
}

/**
 * sub-doc 엔트리 등록 (scratchpad 또는 topic).
 * 동일 키(복합) 존재 시 덮어쓰기.
 *
 * @param {string} featureName
 * @param {Object} entry - { phase, kind, agent?, qualifier?, topic?, path }
 * @returns {Object|null} 저장된 엔트리 또는 null (검증 실패)
 */
function registerSubDoc(featureName, entry) {
  if (!validateFeatureName(featureName)) {
    debugLog('Status.registerSubDoc', 'invalid feature name', { featureName });
    return null;
  }
  const err = _validateSubDocEntry(entry);
  if (err) {
    process.stderr.write(`[VAIS] registerSubDoc: ${err}\n`);
    return null;
  }

  const status = getStatus();
  status.features[featureName] ??= { docs: {} };
  status.features[featureName].docs ??= {};
  status.features[featureName].docs.subDocs ??= [];

  // 파일 크기 자동 계산 (경로 존재 시)
  let size = entry.size;
  if (size === undefined) {
    try {
      size = fs.statSync(entry.path).size;
    } catch (_) { size = 0; }
  }

  const normalized = {
    phase: entry.phase,
    kind: entry.kind,
    agent: entry.agent ?? null,
    qualifier: entry.qualifier ?? null,
    topic: entry.topic ?? null,
    path: entry.path,
    size,
    updatedAt: new Date().toISOString(),
  };

  const key = _subDocKey(normalized);
  const list = status.features[featureName].docs.subDocs;
  const existingIdx = list.findIndex(d => _subDocKey(d) === key);
  if (existingIdx >= 0) list[existingIdx] = normalized;
  else list.push(normalized);

  saveStatus(status);
  return normalized;
}

/**
 * sub-doc 목록 조회. phase / kind 필터 지원.
 *
 * @param {string} featureName
 * @param {Object} [filter] - { phase?, kind? }
 * @returns {Array} sub-doc 엔트리 배열
 */
function listSubDocs(featureName, filter = {}) {
  if (!validateFeatureName(featureName)) return [];
  const status = getStatus();
  const list = status.features?.[featureName]?.docs?.subDocs ?? [];
  return list.filter(d => {
    if (filter.phase && d.phase !== filter.phase) return false;
    if (filter.kind && d.kind !== filter.kind) return false;
    return true;
  });
}

/**
 * sub-doc 엔트리 제거.
 *
 * @param {string} featureName
 * @param {Object} key - { phase, kind, agent?, qualifier?, topic? }
 * @returns {boolean} 제거 성공 여부
 */
function unregisterSubDoc(featureName, key) {
  if (!validateFeatureName(featureName)) return false;
  const err = _validateSubDocEntry(key);
  if (err) return false;

  const status = getStatus();
  const list = status.features?.[featureName]?.docs?.subDocs;
  if (!Array.isArray(list)) return false;

  const keyStr = _subDocKey(key);
  const idx = list.findIndex(d => _subDocKey(d) === keyStr);
  if (idx < 0) return false;

  list.splice(idx, 1);
  saveStatus(status);
  return true;
}

function ensureMigrated() {
  const migration = getMigration();
  return migration.migrateIfNeeded(STATE.status());
}

// ============================================================
// v0.58 C-Level Coexistence — Topic registry + helpers (F11)
// ============================================================

const _V58_PHASE_FOLDERS = {
  ideation: '00-ideation',
  plan: '01-plan',
  design: '02-design',
  do: '03-do',
  qa: '04-qa',
  report: '05-report',
};

const _V58_C_LEVEL_OWNERS = new Set(['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo']);

function _phaseFolder(phase) {
  return _V58_PHASE_FOLDERS[phase] ?? phase;
}

function _topicKey(entry) {
  return `${entry.phase}|${entry.topic}`;
}

/**
 * v0.58 F1 helper — phase × c-level topicPresets 조회 (v1 배열 / v2 객체 모두 지원).
 *
 * @param {string} phase     - 'ideation'|'plan'|'design'|'do'|'qa'|'report'
 * @param {string} cLevel    - 'ceo'|'cpo'|'cto'|'cso'|'cbo'|'coo'
 * @returns {string[]}
 */
function getTopicPreset(phase, cLevel) {
  const cfg = loadConfig();
  const presets = cfg.workflow?.topicPresets;
  if (!presets) return [];
  const node = presets[_phaseFolder(phase)];
  if (!node) return [];
  if (Array.isArray(node)) return node;                         // v1 backward-compat
  if (cLevel && Array.isArray(node[cLevel])) return node[cLevel]; // v2 per-c-level
  if (Array.isArray(node._default)) return node._default;       // v2 fallback
  return [];
}

/**
 * Topic 문서 등록. status.json features.{feature}.docs.topics[] 에 엔트리 추가/갱신.
 *
 * @param {string} feature
 * @param {string} phase
 * @param {string} topic
 * @param {Object} meta      - { owner, authors?, path? }
 * @returns {Object|null} 등록된 엔트리 또는 null(유효성 실패)
 */
function registerTopic(feature, phase, topic, meta = {}) {
  if (!validateFeatureName(feature)) return null;
  if (!phase || !topic) return null;
  const owner = (meta.owner || '').toLowerCase();
  if (!_V58_C_LEVEL_OWNERS.has(owner)) return null;

  const status = getStatus();
  if (!status.features[feature]) {
    initFeature(feature);
    status.features[feature] = getStatus().features[feature];
  }
  if (!status.features[feature].docs) status.features[feature].docs = {};
  if (!Array.isArray(status.features[feature].docs.topics)) {
    status.features[feature].docs.topics = [];
  }

  const list = status.features[feature].docs.topics;
  const entry = {
    phase,
    topic,
    owner,
    authors: Array.isArray(meta.authors) ? meta.authors.slice() : [],
    path: meta.path || `docs/${feature}/${_phaseFolder(phase)}/${topic}.md`,
    registeredAt: new Date().toISOString(),
  };

  const key = _topicKey(entry);
  const idx = list.findIndex(t => _topicKey(t) === key);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);

  saveStatus(status);
  return entry;
}

/**
 * Topic 목록 조회.
 *
 * @param {string} feature
 * @param {string} [phase]     - 생략 시 전 phase
 * @returns {Array<{ phase, topic, owner, authors, path, registeredAt }>}
 */
function listFeatureTopics(feature, phase) {
  if (!validateFeatureName(feature)) return [];
  const status = getStatus();
  const list = status.features?.[feature]?.docs?.topics ?? [];
  if (!phase) return list.slice();
  return list.filter(t => t.phase === phase);
}

/**
 * D-Q6 인터페이스 (v0.58). CEO 라우팅 컨텍스트 전파용.
 * 현재는 listFeatureTopics 와 동일. v0.58.1 에서 실제 CEO prompt 자동 주입 구현.
 */
function getFeatureTopics(feature, phase) {
  return listFeatureTopics(feature, phase);
}

/**
 * D-Q3 helper — `_tmp/` 스캔하여 scratchpad author 슬러그와 요약 수집.
 * C-Level 이 topic 문서 authors 필드 작성 시 참고.
 *
 * @param {string} feature
 * @param {string} phase
 * @returns {Array<{ slug, path, size, summary? }>}
 */
function listScratchpadAuthors(feature, phase) {
  if (!validateFeatureName(feature) || !phase) return [];
  const tmpDir = path.join(process.cwd(), 'docs', feature, _phaseFolder(phase), '_tmp');
  if (!fs.existsSync(tmpDir)) return [];

  const out = [];
  let files;
  try { files = fs.readdirSync(tmpDir); } catch (_) { return []; }
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const p = path.join(tmpDir, f);
    let stat;
    try { stat = fs.statSync(p); } catch (_) { continue; }
    if (!stat.isFile()) continue;

    const slug = f.replace(/\.md$/, '').split('.')[0];
    let summary;
    try {
      const content = fs.readFileSync(p, 'utf8');
      const sm = content.match(/^>\s*Summary:\s*(.+)$/m);
      if (sm) summary = sm[1].trim();
    } catch (_) { /* noop */ }

    out.push({ slug, path: p, size: stat.size, summary });
  }
  return out;
}

/**
 * main.md 에서 각 C-Level H2 섹션 (`## [CBO] ...` 등) 존재 여부 파악.
 *
 * @param {string} feature
 * @param {string} phase
 * @returns {{ ceo: boolean, cpo: boolean, cto: boolean, cso: boolean, cbo: boolean, coo: boolean }}
 */
function getOwnerSectionPresence(feature, phase) {
  const result = { ceo: false, cpo: false, cto: false, cso: false, cbo: false, coo: false };
  if (!validateFeatureName(feature) || !phase) return result;
  const mainPath = path.join(process.cwd(), 'docs', feature, _phaseFolder(phase), 'main.md');
  if (!fs.existsSync(mainPath)) return result;

  let content;
  try { content = fs.readFileSync(mainPath, 'utf8'); } catch (_) { return result; }

  const re = /^##\s+\[(CEO|CPO|CTO|CSO|CBO|COO)\]\s/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    result[m[1].toLowerCase()] = true;
  }
  return result;
}

/**
 * F14 helper — main.md 라인 수 / 바이트 측정 (W-MAIN-SIZE 판정용).
 *
 * @param {string} feature
 * @param {string} phase
 * @returns {{ path: string, lines: number, bytes: number, exists: boolean }}
 */
function getMainDocSize(feature, phase) {
  const out = { path: '', lines: 0, bytes: 0, exists: false };
  if (!validateFeatureName(feature) || !phase) return out;
  const mainPath = path.join(process.cwd(), 'docs', feature, _phaseFolder(phase), 'main.md');
  out.path = mainPath;
  if (!fs.existsSync(mainPath)) return out;
  out.exists = true;
  try {
    const content = fs.readFileSync(mainPath, 'utf8');
    out.bytes = Buffer.byteLength(content, 'utf8');
    out.lines = content.split(/\n/).length;
  } catch (_) { /* noop */ }
  return out;
}

module.exports = {
  getStatus,
  saveStatus,
  initFeature,
  validateFeatureName,
  updatePhase,
  updateRolePhase,
  getRoleProgress,
  getActiveFeature,
  getProgressSummary,
  createEmptyStatus,
  saveGapAnalysis,
  getGapAnalysis,
  setRunRange,
  completeRunRange,
  getRunRange,
  saveFeatureRegistry,
  getFeatureRegistry,
  updateFeatureStatus,
  ensureMigrated,
  registerSubDoc,
  listSubDocs,
  unregisterSubDoc,
  // v0.58 C-Level coexistence (F11)
  getTopicPreset,
  registerTopic,
  listFeatureTopics,
  getFeatureTopics,
  listScratchpadAuthors,
  getOwnerSectionPresence,
  getMainDocSize,
};
