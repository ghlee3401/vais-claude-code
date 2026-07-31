/**
 * 이 파일의 책임: 워크플로우 상태 관리 — .vais/status.json 기반 피처별 진행 추적. (v2.0 슬림)
 */
const fs = require('fs');
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
  if (/[가-힣]/.test(featureName)) {
    try { process.stderr.write(`[VAIS] ⚠️  feature name contains Hangul: "${featureName}" — kebab-case English recommended\n`); } catch (_) {}
  }
  return true;
}

function createEmptyStatus() {
  return {
    version: 2,
    activeFeature: null,
    features: {},
  };
}

function getStatus() {
  const statusPath = STATE.status();
  if (!fs.existsSync(statusPath)) {
    return createEmptyStatus();
  }
  try {
    return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (e) {
    process.stderr.write(`[VAIS] ⚠️  .vais/status.json 파싱 실패: ${e.message}\n`);
    process.stderr.write(`[VAIS]    빈 상태로 계속합니다. 문제 지속 시: rm .vais/status.json\n`);
    debugLog('Status', 'getStatus parse failed, using empty', { error: e.message });
    return createEmptyStatus();
  }
}

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
  const phases = config.workflow?.phases || ['plan', 'do', 'review'];

  if (!status.features[featureName]) {
    const phaseStatus = {};
    for (const phase of phases) {
      phaseStatus[phase] = { status: 'pending', startedAt: null, completedAt: null };
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
 * 피처의 현재 phase 업데이트
 */
function updatePhase(featureName, phase, phaseStatus) {
  let status = getStatus();
  if (!status.features[featureName]) {
    const initialized = initFeature(featureName);
    if (!initialized) return null;
    status = getStatus();
  }

  const feature = status.features[featureName];
  if (!feature.phases) feature.phases = {};
  if (!feature.phases[phase]) {
    feature.phases[phase] = { status: 'pending', startedAt: null, completedAt: null };
  }
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

  saveStatus(status);
  return status;
}

/**
 * 범위 실행 상태 설정
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

function completeRunRange(featureName) {
  const status = getStatus();
  if (status.features[featureName]?.runRange) {
    status.features[featureName].runRange.completedAt = new Date().toISOString();
    saveStatus(status);
  }
}

function getRunRange(featureName) {
  const status = getStatus();
  return status.features[featureName]?.runRange || null;
}

/**
 * Gap 분석 결과 저장 (review phase 의 완료 조건 대조 결과)
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

function getGapAnalysis(featureName) {
  const status = getStatus();
  return status.features[featureName]?.gapAnalysis || null;
}

/**
 * 활성 피처 가져오기 — 구 v4 스키마(activeFeatures[]) 도 호환.
 */
function getActiveFeature() {
  const status = getStatus();
  if (Array.isArray(status.activeFeatures) && status.activeFeatures.length > 0) {
    return status.activeFeatures[0];
  }
  return status.activeFeature || null;
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
 * 상태 마이그레이션 실행
 */
function ensureMigrated() {
  const migration = getMigration();
  return migration.migrateIfNeeded(STATE.status());
}

/**
 * v2.0 — mandatory phases. config 단일 정본 (role 개념 폐지).
 */
function getMandatoryPhases() {
  const config = loadConfig();
  return config.workflow?.mandatoryPhases || ['plan', 'do', 'review'];
}

/**
 * 피처의 brand slug 조회 (design 작업용)
 */
function getBrand(featureName) {
  if (!validateFeatureName(featureName)) return null;
  const status = getStatus();
  return status.features?.[featureName]?.brand || null;
}

/**
 * brand slug 저장. ui-designer 가 brand 선택 시 호출.
 */
function setBrand(featureName, slug) {
  if (!validateFeatureName(featureName)) return null;
  if (slug !== null && (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug))) {
    debugLog('Status', 'Invalid brand slug', { feature: featureName, slug });
    return null;
  }
  let status = getStatus();
  if (!status.features[featureName]) {
    initFeature(featureName);
    status = getStatus();
  }
  status.features[featureName].brand = slug;
  saveStatus(status);
  return status.features[featureName];
}

module.exports = {
  getStatus,
  saveStatus,
  initFeature,
  validateFeatureName,
  updatePhase,
  getActiveFeature,
  getProgressSummary,
  createEmptyStatus,
  saveGapAnalysis,
  getGapAnalysis,
  setRunRange,
  completeRunRange,
  getRunRange,
  ensureMigrated,
  getMandatoryPhases,
  getBrand,
  setBrand,
};
