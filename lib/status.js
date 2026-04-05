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
let _stateMachine = null;
function getStateMachine() {
  if (!_stateMachine) { _stateMachine = require('./core/state-machine'); }
  return _stateMachine;
}

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

// ── FSM Integration ────────────────────────────────────────────────

/**
 * FSM 기반 phase 전이 실행
 * 기존 updatePhase/updateRolePhase를 대체하는 선언적 전이
 *
 * @param {string} featureName - 피처명
 * @param {string} role - C-Level 역할
 * @param {string} event - FSM 이벤트 (PLAN_DONE, DESIGN_DONE 등)
 * @param {Object} [metadata] - 추가 메타데이터 (matchRate 등)
 * @returns {{success:boolean, previousPhase:string, currentPhase:string, blockedBy:string|null}}
 */
function transitionPhase(featureName, role, event, metadata = {}) {
  const sm = getStateMachine();
  let status = getStatus();

  if (!status.features[featureName]) {
    initFeature(featureName);
    status = getStatus();
  }

  const feature = status.features[featureName];

  // Build FSM context from current state
  const currentPhase = feature.rolePhases?.[role]?.currentPhase
    || feature.fsmState?.phase
    || feature.currentPhase
    || 'idle';

  const ctx = sm.createContext(featureName, role, {
    currentPhase,
    matchRate: metadata.matchRate || feature.gapAnalysis?.matchRate || 0,
    iterationCount: metadata.iterationCount || feature.fsmState?.iterationCount || 0,
    timestamps: feature.fsmState?.timestamps || {},
    metadata,
  });

  // Execute transition
  const result = sm.transition(currentPhase, event, ctx);

  if (result.success) {
    // Update feature FSM state
    feature.fsmState = {
      phase: result.currentPhase,
      iterationCount: ctx.iterationCount,
      matchRate: ctx.matchRate,
      timestamps: ctx.timestamps,
    };

    // Keep legacy fields in sync
    feature.currentPhase = result.currentPhase;
    if (feature.phases[result.currentPhase]) {
      feature.phases[result.currentPhase].status = 'in-progress';
      feature.phases[result.currentPhase].startedAt = new Date().toISOString();
    }
    if (feature.phases[result.previousPhase]) {
      feature.phases[result.previousPhase].status = 'completed';
      feature.phases[result.previousPhase].completedAt = new Date().toISOString();
    }

    // Update rolePhases
    if (!feature.rolePhases) feature.rolePhases = {};
    if (!feature.rolePhases[role]) feature.rolePhases[role] = {};
    feature.rolePhases[role].currentPhase = result.currentPhase;

    saveStatus(status);
  }

  return result;
}

/**
 * 현재 phase에서 가능한 이벤트 조회
 */
function getAvailableTransitions(featureName, role) {
  const sm = getStateMachine();
  const status = getStatus();
  const feature = status.features[featureName];
  if (!feature) return [];

  const currentPhase = feature.rolePhases?.[role]?.currentPhase
    || feature.fsmState?.phase
    || feature.currentPhase
    || 'idle';

  const ctx = sm.createContext(featureName, role, {
    currentPhase,
    matchRate: feature.gapAnalysis?.matchRate || 0,
    iterationCount: feature.fsmState?.iterationCount || 0,
  });

  return sm.getAvailableEvents(currentPhase, ctx);
}

/**
 * 상태 마이그레이션 실행
 */
function ensureMigrated() {
  const migration = getMigration();
  return migration.migrateIfNeeded(STATE.status());
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
  // FSM integration
  transitionPhase,
  getAvailableTransitions,
  ensureMigrated,
};
