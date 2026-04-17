/**
 * VAIS Code - v0.49 → v0.50 Migration Engine
 * @module lib/core/migration-engine
 *
 * 사용자 프로젝트에 남아있는 v0.49 상태 파일(`.vais/status.json`)을 v0.50 스키마로 변환한다.
 *
 * 변환 규칙
 *   1. `cmo_*`, `cfo_*` feature/레코드 → `cbo_*`로 rename
 *   2. `agents.retrospective-writer`, `agents.technical-writer` 레코드 제거
 *   3. `cto.subAgents`에서 `release-engineer`, `performance-engineer` 제거 → `coo.subAgents`에 추가
 *   4. metadata.version = "0.50.0"
 *
 * 안전장치
 *   - 실제 변경 전 `.vais/_backup/v049-{timestamp}.tar.gz` 자동 생성
 *   - dryRun 모드 지원 (diff만 반환)
 *   - 실패 시 backup에서 자동 복원
 *
 * @see docs/_legacy/01-plan/features/v050/00-migration-foundation.plan.md §2.3
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ── semver 비교 (major.minor.patch 만) ────────────────────────────

function parseSemver(v) {
  if (typeof v !== 'string') return null;
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function semverLt(a, b) {
  const pa = parseSemver(a) || [0, 0, 0];
  const pb = parseSemver(b) || [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return false;
}

// ── 경로 해석 ─────────────────────────────────────────────────────

function resolveVaisDir(projectDir) {
  return path.join(projectDir || process.cwd(), '.vais');
}

// ── 핵심 변환 로직 ────────────────────────────────────────────────

const ROLE_RENAMES = { cmo: 'cbo', cfo: 'cbo' };
const REMOVED_AGENTS = ['retrospective-writer', 'technical-writer'];
const SUBAGENT_MOVES = {
  // 'release-engineer'는 v0.49 cto/coo 양쪽에 있었음 — cto 에서만 제거
  'release-engineer': { from: 'cto', to: 'coo' },
  'performance-engineer': { from: 'cto', to: 'coo' },
};

/**
 * status.json 객체를 v0.50 스키마로 변환한다. 순수 함수.
 * @param {Object} status
 * @returns {{migrated:Object, warnings:string[], changes:string[]}}
 */
function transformStatus(status) {
  const warnings = [];
  const changes = [];
  const out = JSON.parse(JSON.stringify(status || {}));

  // features rename
  if (out.features && typeof out.features === 'object') {
    const newFeatures = {};
    for (const [name, feat] of Object.entries(out.features)) {
      let newName = name;
      // "cmo_xxx" 또는 "cfo_xxx" 형태
      const m = name.match(/^(cmo|cfo)_(.+)$/);
      if (m) {
        newName = `cbo_${m[2]}`;
        changes.push(`feature rename: ${name} → ${newName}`);
      }
      // feat.role 필드 보정
      if (feat && typeof feat === 'object' && feat.role && ROLE_RENAMES[feat.role]) {
        const oldRole = feat.role;
        feat.role = ROLE_RENAMES[oldRole];
        changes.push(`feature[${newName}].role: ${oldRole} → ${feat.role}`);
      }
      if (newFeatures[newName]) {
        warnings.push(`collision on rename: ${name} → ${newName} (existing kept)`);
        continue;
      }
      newFeatures[newName] = feat;
    }
    out.features = newFeatures;
  }

  // agents 레코드 정리 (retrospective/technical-writer 제거 + subAgents 재배치)
  if (out.agents && typeof out.agents === 'object') {
    for (const name of REMOVED_AGENTS) {
      if (name in out.agents) {
        delete out.agents[name];
        changes.push(`agent removed: ${name}`);
      }
    }
  }

  // cSuite 재구성 (status.json에 캐싱된 경우에만)
  if (out.cSuite && out.cSuite.roles) {
    const roles = out.cSuite.roles;
    // cmo/cfo 제거, cbo 추가 힌트만 남김 (실제 subAgents 목록은 vais.config.json이 SoT)
    for (const r of ['cmo', 'cfo']) {
      if (roles[r]) {
        delete roles[r];
        changes.push(`cSuite.roles.${r} removed`);
      }
    }
    // subAgent 이동
    for (const [agent, mv] of Object.entries(SUBAGENT_MOVES)) {
      const from = roles[mv.from];
      const to = roles[mv.to];
      if (from && Array.isArray(from.subAgents)) {
        const idx = from.subAgents.indexOf(agent);
        if (idx >= 0) {
          from.subAgents.splice(idx, 1);
          changes.push(`cSuite.${mv.from}.subAgents: removed ${agent}`);
        }
      }
      if (to && Array.isArray(to.subAgents)) {
        if (!to.subAgents.includes(agent)) {
          to.subAgents.push(agent);
          changes.push(`cSuite.${mv.to}.subAgents: added ${agent}`);
        }
      }
    }
  }

  // metadata.version
  out.metadata = out.metadata || {};
  const prev = out.metadata.version;
  out.metadata.version = '0.50.0';
  if (prev !== '0.50.0') {
    changes.push(`metadata.version: ${prev || '(unset)'} → 0.50.0`);
  }

  return { migrated: out, warnings, changes };
}

// ── Backup ────────────────────────────────────────────────────────

/**
 * .vais/ 디렉토리 전체를 tar.gz로 백업한다. tar 미지원 환경은 폴더 복사로 폴백.
 * @returns {string} backupPath
 */
function createBackup(vaisDir) {
  const backupDir = path.join(vaisDir, '_backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const tarPath = path.join(backupDir, `v049-${ts}.tar.gz`);
  try {
    // tar로 .vais 디렉토리 압축. _backup 제외.
    execFileSync('tar', [
      '-czf', tarPath,
      '-C', path.dirname(vaisDir),
      '--exclude', path.join(path.basename(vaisDir), '_backup'),
      path.basename(vaisDir),
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    return tarPath;
  } catch (err) {
    // 폴백: 단순 status.json 파일만 복사
    const fallback = path.join(backupDir, `v049-${ts}-status.json`);
    const statusFile = path.join(vaisDir, 'status.json');
    if (fs.existsSync(statusFile)) {
      fs.copyFileSync(statusFile, fallback);
      return fallback;
    }
    throw err;
  }
}

function restoreFromBackup(backupPath, vaisDir) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`backup missing: ${backupPath}`);
  }
  if (backupPath.endsWith('.tar.gz')) {
    execFileSync('tar', ['-xzf', backupPath, '-C', path.dirname(vaisDir)], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } else {
    // status.json 단독 복원
    const statusFile = path.join(vaisDir, 'status.json');
    fs.copyFileSync(backupPath, statusFile);
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * v0.49 → v0.50 마이그레이션 실행.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.dryRun=false] - true면 파일 쓰지 않고 diff만 반환
 * @param {boolean} [opts.force=false] - metadata.version이 이미 0.50.0 이상이어도 실행
 * @param {string}  [opts.projectDir] - default: process.cwd()
 * @returns {Promise<{migrated:boolean, skipped:boolean, warnings:string[], errors:string[], changes:string[], backupPath:string|null}>}
 */
async function migrate(opts = {}) {
  const { dryRun = false, force = false, projectDir } = opts;
  const vaisDir = resolveVaisDir(projectDir);
  const statusPath = path.join(vaisDir, 'status.json');
  const result = {
    migrated: false,
    skipped: false,
    warnings: [],
    errors: [],
    changes: [],
    backupPath: null,
  };

  if (!fs.existsSync(statusPath)) {
    result.skipped = true;
    result.warnings.push(`no status.json at ${statusPath}`);
    return result;
  }

  let status;
  try {
    status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (err) {
    result.errors.push(`parse failed: ${err.message}`);
    return result;
  }

  const currentVer = status?.metadata?.version;
  if (!force && currentVer && !semverLt(currentVer, '0.50.0')) {
    result.skipped = true;
    result.warnings.push(`already at ${currentVer} — use {force:true} to re-run`);
    return result;
  }

  const { migrated, warnings, changes } = transformStatus(status);
  result.warnings.push(...warnings);
  result.changes.push(...changes);

  if (dryRun) {
    result.migrated = false;
    return result;
  }

  // 실제 쓰기 전 backup
  let backupPath = null;
  try {
    backupPath = createBackup(vaisDir);
    result.backupPath = backupPath;
  } catch (err) {
    result.errors.push(`backup failed: ${err.message}`);
    return result;
  }

  // atomic write
  const tmpPath = `${statusPath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(migrated, null, 2));
    fs.renameSync(tmpPath, statusPath);
    result.migrated = true;
    return result;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore */ }
    result.errors.push(`write failed: ${err.message}`);
    // 자동 복원 시도
    try {
      restoreFromBackup(backupPath, vaisDir);
      result.warnings.push(`restored from backup: ${backupPath}`);
    } catch (restoreErr) {
      result.errors.push(`restore failed: ${restoreErr.message}`);
    }
    return result;
  }
}

module.exports = {
  migrate,
  transformStatus,
  createBackup,
  restoreFromBackup,
  // internals for testing
  _semverLt: semverLt,
  _parseSemver: parseSemver,
};
