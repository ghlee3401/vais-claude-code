/**
 * VAIS Code - Manager Memory System
 * 프로젝트 전체 히스토리를 Manager 에이전트가 기억하기 위한 영속 메모리
 */
const fs = require('fs');
const { STATE, ensureVaisDirs } = require('./paths');
const { debugLog } = require('./debug');

/**
 * 메모리 엔트리 타입
 * - decision:   기술/비즈니스 의사결정
 * - change:     fix 등으로 인한 변경 기록
 * - feedback:   게이트에서 받은 사용자 피드백
 * - dependency: 피처 간 의존 관계
 * - debt:       기술 부채, 나중에 할 일
 * - error:      실패/재시도 기록
 * - milestone:  단계 완료 등 주요 이벤트
 */
const ENTRY_TYPES = ['decision', 'change', 'feedback', 'dependency', 'debt', 'error', 'milestone'];

/**
 * 빈 메모리 객체 생성
 */
function createEmptyMemory() {
  return {
    version: 1,
    entries: [],
  };
}

/**
 * 메모리 파일 읽기
 */
function getMemory() {
  try {
    const raw = fs.readFileSync(STATE.memory(), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    debugLog('Memory', 'getMemory failed, using empty', { error: e.message });
    return createEmptyMemory();
  }
}

/**
 * 메모리 파일 저장
 */
function saveMemory(memory) {
  ensureVaisDirs();
  fs.writeFileSync(STATE.memory(), JSON.stringify(memory, null, 2), 'utf8');
}

/**
 * 다음 엔트리 ID 생성
 */
function nextEntryId(memory) {
  const maxNum = memory.entries.reduce((max, e) => {
    const num = parseInt((e.id || '').replace('m-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `m-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * 메모리 엔트리 추가
 *
 * @param {object} entry
 * @param {string} entry.type       - decision | change | feedback | dependency | debt | error | milestone
 * @param {string} entry.feature    - 관련 피처명 (없으면 null)
 * @param {string} [entry.phase]    - 관련 단계 (선택)
 * @param {string} entry.summary    - 한 줄 요약
 * @param {object} [entry.details]  - 추가 상세 (자유 형식)
 * @param {string[]} [entry.relatedFeatures] - 연관 피처 목록
 * @returns {object} 추가된 엔트리
 */
function addEntry(entry) {
  if (!entry.type || !ENTRY_TYPES.includes(entry.type)) {
    throw new Error(`Invalid entry type: ${entry.type}. Must be one of: ${ENTRY_TYPES.join(', ')}`);
  }
  if (!entry.summary) {
    throw new Error('Entry summary is required');
  }

  const memory = getMemory();
  const newEntry = {
    id: nextEntryId(memory),
    timestamp: new Date().toISOString(),
    type: entry.type,
    feature: entry.feature || null,
    phase: entry.phase || null,
    summary: entry.summary,
    details: entry.details || null,
    relatedFeatures: entry.relatedFeatures || [],
  };

  memory.entries.push(newEntry);
  saveMemory(memory);
  return newEntry;
}

/**
 * 피처별 엔트리 조회
 */
function getEntriesByFeature(featureName) {
  const memory = getMemory();
  return memory.entries.filter(
    e => e.feature === featureName || (e.relatedFeatures || []).includes(featureName)
  );
}

/**
 * 타입별 엔트리 조회
 */
function getEntriesByType(type) {
  const memory = getMemory();
  return memory.entries.filter(e => e.type === type);
}

/**
 * 최근 N개 엔트리 조회
 */
function getRecentEntries(count = 20) {
  const memory = getMemory();
  return memory.entries.slice(-count);
}

/**
 * 피처 간 의존성 맵 조회
 * @returns {object} { featureName: [dependsOn...] }
 */
function getDependencyMap() {
  const deps = getEntriesByType('dependency');
  const map = {};
  for (const entry of deps) {
    if (entry.feature) {
      if (!map[entry.feature]) map[entry.feature] = [];
      for (const rel of (entry.relatedFeatures || [])) {
        if (!map[entry.feature].includes(rel)) {
          map[entry.feature].push(rel);
        }
      }
    }
  }
  return map;
}

/**
 * 기술 부채 목록 조회 (미해결만)
 */
function getOpenDebts() {
  const debts = getEntriesByType('debt');
  return debts.filter(e => !e.details?.resolved);
}

/**
 * 기술 부채 해결 표시
 */
function resolveDebt(entryId) {
  const memory = getMemory();
  const entry = memory.entries.find(e => e.id === entryId);
  if (entry && entry.type === 'debt') {
    if (!entry.details) entry.details = {};
    entry.details.resolved = true;
    entry.details.resolvedAt = new Date().toISOString();
    saveMemory(memory);
    return entry;
  }
  return null;
}

/**
 * 기간별 엔트리 조회
 * @param {string} since - ISO 날짜 문자열
 * @param {string} [until] - ISO 날짜 문자열 (기본: 현재)
 */
function getEntriesByDateRange(since, until) {
  const memory = getMemory();
  const sinceDate = new Date(since);
  const untilDate = until ? new Date(until) : new Date();
  return memory.entries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= sinceDate && d <= untilDate;
  });
}

/**
 * 프로젝트 전체 요약 생성
 * Manager의 Query 모드에서 사용
 */
function getProjectSummary() {
  const memory = getMemory();
  const entries = memory.entries;

  const features = new Set();
  const typeCounts = {};
  for (const e of entries) {
    if (e.feature) features.add(e.feature);
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }

  return {
    totalEntries: entries.length,
    features: [...features],
    typeCounts,
    dependencies: getDependencyMap(),
    openDebts: getOpenDebts().length,
    latestEntry: entries.length > 0 ? entries[entries.length - 1] : null,
  };
}

module.exports = {
  ENTRY_TYPES,
  createEmptyMemory,
  getMemory,
  saveMemory,
  addEntry,
  getEntriesByFeature,
  getEntriesByType,
  getRecentEntries,
  getDependencyMap,
  getOpenDebts,
  resolveDebt,
  getEntriesByDateRange,
  getProjectSummary,
};
