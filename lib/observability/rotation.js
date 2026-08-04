const fs = require('fs');
const path = require('path');

// Design Ref: §2.1 — 로그 로테이션 분리. 테스트 및 교체 가능하도록 순수 함수로 구성
const DEFAULT_CONFIG = {
  maxSizeMB: 10,
  rotateAfterDays: 30,
  archivePath: '.vais/archive/',
};

function shouldRotate(logPath, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!fs.existsSync(logPath)) return false;

  const stat = fs.statSync(logPath);

  // 크기 기반 체크
  const sizeMB = stat.size / (1024 * 1024);
  if (sizeMB >= cfg.maxSizeMB) return true;

  // 날짜 기반 체크
  const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
  if (ageDays >= cfg.rotateAfterDays) return true;

  return false;
}

function rotate(logPath, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!fs.existsSync(logPath)) return null;

  // 아카이브 디렉토리 생성
  if (!fs.existsSync(cfg.archivePath)) {
    fs.mkdirSync(cfg.archivePath, { recursive: true });
  }

  // 날짜 접미사로 아카이브 파일명 생성
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const basename = path.basename(logPath, path.extname(logPath));
  const ext = path.extname(logPath);
  const archiveFile = path.join(cfg.archivePath, `${basename}-${date}${ext}`);

  fs.renameSync(logPath, archiveFile);

  return archiveFile;
}

module.exports = { shouldRotate, rotate };
