/**
 * VAIS Code - 워크플로우 상태 관리
 * .vais/status.json 기반 피처별 진행 상태 추적
 */
const fs = require('fs');
const path = require('path');
const { STATE, ensureVaisDirs, loadConfig } = require('./paths');

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
  try {
    const raw = fs.readFileSync(STATE.status(), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return createEmptyStatus();
  }
}

/**
 * 상태 파일 저장
 */
function saveStatus(status) {
  ensureVaisDirs();
  fs.writeFileSync(STATE.status(), JSON.stringify(status, null, 2), 'utf8');
}

/**
 * 피처 상태 초기화
 */
function initFeature(featureName) {
  if (!featureName || typeof featureName !== 'string') return null;
  const status = getStatus();
  const config = loadConfig();
  const phases = config.workflow?.phases || [
    'research', 'plan', 'ia', 'wireframe', 'design',
    'fe', 'be', 'check', 'review',
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
  const status = getStatus();
  if (!status.features[featureName]) {
    const initialized = initFeature(featureName);
    if (!initialized) return null;
    // initFeature 성공 후 상태를 다시 읽어서 진행 (무한 재귀 방지)
    return updatePhase(featureName, phase, phaseStatus);
  }

  const feature = status.features[featureName];
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
 * 범위 실행 상태 설정 (start 커맨드용)
 */
function setRunRange(featureName, from, to) {
  const status = getStatus();
  if (!status.features[featureName]) {
    initFeature(featureName);
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
  const status = getStatus();
  if (!status.features[featureName]) {
    initFeature(featureName);
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

  const lines = [];
  let completedCount = 0;
  const totalCount = phases.length;
  for (const phase of phases) {
    const ps = feature.phases[phase];
    if (ps?.status === 'completed') completedCount++;
    const icon = ps?.status === 'completed' ? '✅'
      : ps?.status === 'in-progress' ? '🔄'
      : '⬜';
    lines.push(`${icon}${phaseNames[phase] || phase}`);
  }

  const progressIcons = phases.map(p => {
    const ps = feature.phases[p];
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
    phases: feature.phases,
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
  if (!featureName || typeof featureName !== 'string') return null;
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
  fs.writeFileSync(registryPath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

/**
 * 피처 레지스트리 조회
 */
function getFeatureRegistry(featureName) {
  const registryPath = path.join(STATE.root(), 'features', `${featureName}.json`);
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * 피처 레지스트리의 개별 기능 상태 업데이트
 * fe/be 단계에서 구현 완료 시 호출
 */
function updateFeatureStatus(featureName, featureId, newStatus) {
  const registry = getFeatureRegistry(featureName);
  if (!registry || !registry.features) return null;

  const feature = registry.features.find(f => f.id === featureId);
  if (feature) {
    feature.status = newStatus;
    registry.updatedAt = new Date().toISOString();
    const registryPath = path.join(STATE.root(), 'features', `${featureName}.json`);
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
  }
  return registry;
}

module.exports = {
  getStatus,
  saveStatus,
  initFeature,
  updatePhase,
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
};
