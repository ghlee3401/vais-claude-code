#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] doc-validator crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] doc-validator rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Document Validator
 * C-Level 에이전트 종료 시 필수 문서 존재 여부 + v0.57 sub-doc 검증.
 *
 * 사용: node scripts/doc-validator.js <role> <feature>
 * 반환: JSON { passed, missing, warnings, subDocWarnings }
 *   - passed: boolean (필수 main.md 모두 존재)
 *   - missing: [{ phase, path }]
 *   - warnings: [string] (일반 경고)
 *   - subDocWarnings: [{ code, path, message }] (v0.57 sub-doc 경고, enforcement=warn 시 exit에 영향 없음)
 *
 * v0.57 경고 코드:
 *   W-SCP-01: _tmp/{slug}.md Author 헤더 누락
 *   W-SCP-02: _tmp/{slug}.md Phase 헤더 누락
 *   W-SCP-03: _tmp/{slug}.md 크기 < scratchpadMinBytes
 *   W-TPC-01: {topic}.md "## 큐레이션 기록" 섹션 누락
 *   W-IDX-01: main.md 에 topic 문서 링크 누락
 *   W-MAIN-01: main.md 누락 (기존 missing 과 동일, 코드 부여)
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { getActiveFeature } = require('../lib/status');

// C-Level 역할 목록
const C_LEVEL_ROLES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];

// 역할별 필수 phase (모든 C-Level 공통: plan, do, qa)
const MANDATORY_PHASES = ['plan', 'do', 'qa'];

// v0.57: phase 폴더 매핑 (subDoc 스캔용)
const PHASE_FOLDERS = {
  ideation: '00-ideation',
  plan: '01-plan',
  design: '02-design',
  do: '03-do',
  qa: '04-qa',
  report: '05-report',
};

// v0.57: 시스템 산출물 (topic 아님, curation 검증 제외)
const SYSTEM_ARTIFACT_NAMES = new Set(['main.md', 'interface-contract.md']);

/**
 * 역할+피처에 대해 필수 문서 존재 여부 검증 (기존 동작 유지)
 */
function validateDocs(role, feature) {
  const result = { passed: true, missing: [], warnings: [] };

  if (!C_LEVEL_ROLES.includes(role)) {
    return result;
  }

  if (!feature) {
    result.warnings.push(`피처명 미확인 — 문서 검증 생략`);
    return result;
  }

  for (const phase of MANDATORY_PHASES) {
    const docPath = resolveDocPath(phase, feature, role);
    if (!docPath) {
      result.warnings.push(`${phase} 문서 경로 해석 실패`);
      continue;
    }
    if (!fs.existsSync(docPath)) {
      result.passed = false;
      result.missing.push({ phase, path: docPath });
    }
  }

  return result;
}

/**
 * v0.57 sub-doc 검증 — scratchpad (_tmp/) 및 topic 문서 품질 경고 생성.
 * enforcement=warn 기본이라 exit 에 영향 주지 않음. retry/fail 은 호출자가 해석.
 *
 * @param {string} feature
 * @param {Object} [options] - { phases?: string[] — 미지정 시 config phaseFolders 전체 }
 * @returns {Array<{ code, path, message }>}
 */
function validateSubDocs(feature, options = {}) {
  const out = [];
  if (!feature) return out;

  const cfg = loadConfig();
  const policy = cfg.workflow?.subDocPolicy ?? {};
  const minBytes = typeof policy.scratchpadMinBytes === 'number' ? policy.scratchpadMinBytes : 500;
  const requireCuration = policy.requireCurationRecord !== false;

  const phases = options.phases ?? Object.values(PHASE_FOLDERS);
  const docsRoot = path.join(process.cwd(), 'docs', feature);
  if (!fs.existsSync(docsRoot)) return out;

  for (const phaseFolder of phases) {
    const phaseDir = path.join(docsRoot, phaseFolder);
    if (!fs.existsSync(phaseDir)) continue;

    // 1. _tmp/ scratchpad 검증
    const tmpDir = path.join(phaseDir, '_tmp');
    if (fs.existsSync(tmpDir)) {
      let tmpFiles;
      try { tmpFiles = fs.readdirSync(tmpDir); }
      catch (_) { tmpFiles = []; }

      for (const f of tmpFiles) {
        if (!f.endsWith('.md')) continue;
        const p = path.join(tmpDir, f);
        let content, size;
        try {
          content = fs.readFileSync(p, 'utf8');
          size = fs.statSync(p).size;
        } catch (_) { continue; }

        if (!/^>\s*Author:/m.test(content)) {
          out.push({ code: 'W-SCP-01', path: p, message: 'Author 헤더 누락' });
        }
        if (!/^>\s*Phase:/m.test(content)) {
          out.push({ code: 'W-SCP-02', path: p, message: 'Phase 헤더 누락' });
        }
        if (size < minBytes) {
          out.push({ code: 'W-SCP-03', path: p, message: `크기 ${size}B < ${minBytes}B (빈 스캐폴드 의심)` });
        }
      }
    }

    // 2. topic 문서 "## 큐레이션 기록" 섹션 검증
    if (requireCuration) {
      let files;
      try { files = fs.readdirSync(phaseDir); }
      catch (_) { files = []; }

      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        if (SYSTEM_ARTIFACT_NAMES.has(f)) continue;
        // _tmp 는 디렉토리라 readdirSync 결과에 포함될 수도 있으나 .md 확장자 체크로 1차 걸러짐
        const p = path.join(phaseDir, f);
        let stat;
        try { stat = fs.statSync(p); } catch (_) { continue; }
        if (!stat.isFile()) continue;

        let content;
        try { content = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }
        if (!/^##\s+큐레이션 기록/m.test(content)) {
          out.push({ code: 'W-TPC-01', path: p, message: '"## 큐레이션 기록" 섹션 누락' });
        }
      }
    }

    // 3. main.md 에 topic 문서 링크 존재 여부
    const mainPath = path.join(phaseDir, 'main.md');
    if (fs.existsSync(mainPath)) {
      let mainContent;
      try { mainContent = fs.readFileSync(mainPath, 'utf8'); }
      catch (_) { mainContent = ''; }

      let files;
      try { files = fs.readdirSync(phaseDir); }
      catch (_) { files = []; }

      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        if (SYSTEM_ARTIFACT_NAMES.has(f)) continue;
        const p = path.join(phaseDir, f);
        try {
          if (!fs.statSync(p).isFile()) continue;
        } catch (_) { continue; }
        if (!mainContent.includes(f)) {
          out.push({ code: 'W-IDX-01', path: mainPath, message: `${f} 링크 누락 (Topic Documents 섹션에 추가 권장)` });
        }
      }
    }
  }

  return out;
}

/**
 * 검증 결과를 사람이 읽을 수 있는 형식으로 출력 (main.md 중심 — 기존 호환)
 */
function formatResult(role, feature, result) {
  if (result.passed && result.warnings.length === 0) {
    return '';
  }

  const lines = [];

  if (result.missing.length > 0) {
    lines.push(`⚠️  [${role.toUpperCase()}] 필수 문서 ${result.missing.length}건 누락 (${feature}):`);
    for (const m of result.missing) {
      lines.push(`   ❌ ${m.phase}: ${path.relative(process.cwd(), m.path)}`);
    }
    lines.push(`   💡 PDCA 워크플로우에 따라 필수 문서를 작성해주세요.`);
  }

  for (const w of result.warnings) {
    lines.push(`   ⚠️  ${w}`);
  }

  return lines.join('\n');
}

/**
 * v0.57 sub-doc 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatSubDocWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [sub-doc v0.57] ${warnings.length}건 경고:`];
  for (const w of warnings) {
    const rel = path.relative(process.cwd(), w.path);
    lines.push(`   ⚠️  [${w.code}] ${rel}: ${w.message}`);
  }
  return lines.join('\n');
}

// CLI 직접 실행
if (require.main === module) {
  const [role, featureArg] = process.argv.slice(2);
  const feature = featureArg || getActiveFeature();

  if (!role) {
    process.exit(0);
  }

  const result = validateDocs(role, feature);
  const subDocWarnings = feature ? validateSubDocs(feature) : [];
  result.subDocWarnings = subDocWarnings;

  const output = formatResult(role, feature, result);
  const subDocOutput = formatSubDocWarnings(subDocWarnings);

  if (output) process.stderr.write(output + '\n');
  if (subDocOutput) process.stderr.write(subDocOutput + '\n');

  process.stdout.write(JSON.stringify(result));

  // enforcement 정책
  const cfg = loadConfig();
  const enforcement = cfg.workflow?.subDocPolicy?.enforcement ?? 'warn';
  if (!result.passed) process.exit(1);
  if (enforcement === 'fail' && subDocWarnings.length > 0) process.exit(1);
  process.exit(0);
}

module.exports = { validateDocs, validateSubDocs, formatResult, formatSubDocWarnings, MANDATORY_PHASES, C_LEVEL_ROLES, PHASE_FOLDERS };
