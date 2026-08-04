/**
 * VAIS Code - File System Utilities
 * 공유 파일 시스템 유틸리티
 */
const fs = require('fs');
const path = require('path');

/**
 * 원자적 파일 쓰기 (임시 파일 → rename)
 * 동시 접근 시 데이터 손실 방지
 * try/finally로 orphan tmp 파일 정리
 */
function atomicWriteSync(filePath, data) {
  const dir = path.dirname(filePath);
  const tmpFile = path.join(dir, `.tmp-${process.pid}-${Date.now()}`);
  try {
    fs.writeFileSync(tmpFile, data, 'utf8');
    fs.renameSync(tmpFile, filePath);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) { /* already renamed or doesn't exist */ }
  }
}

/**
 * 파일 존재 여부 확인 (통일된 구현)
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 파일 잠금 획득 (O_EXCL atomic creation)
 * @param {string} filePath - 잠금 대상 파일
 * @param {number} [timeoutMs=5000] - 최대 대기 시간
 * @returns {string} 잠금 파일 경로
 */
function lockFileSync(filePath, timeoutMs = 5000) {
  const stateStore = require('./core/state-store');
  return stateStore.lock(filePath, timeoutMs);
}

/**
 * 파일 잠금 해제
 * @param {string} filePath - 잠금 대상 파일
 */
function unlockFileSync(filePath) {
  const stateStore = require('./core/state-store');
  stateStore.unlock(filePath);
}

module.exports = { atomicWriteSync, fileExists, lockFileSync, unlockFileSync };
