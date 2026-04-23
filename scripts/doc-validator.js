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
 *
 * v0.58 경고 코드 (clevel-doc-coexistence):
 *   W-OWN-01: topic.md frontmatter 에 owner 누락
 *   W-OWN-02: topic.md frontmatter owner 값이 C-Level enum 외
 *   W-MRG-02: main.md Decision Record 표에 Owner 컬럼 누락
 *   W-MRG-03: topic ≥ 2 이지만 main.md 에 ## [{C-LEVEL}] 섹션 0개
 *   W-MAIN-SIZE: main.md 라인 수 > mainMdMaxLines AND topic 0 AND _tmp/ 0 (F14)
 *
 * v0.58.3 경고 코드 (plan-scope-contract):
 *   W-SCOPE-01: plan/main.md 에 "## 요청 원문" 섹션 누락 (CLAUDE.md Rule #9)
 *   W-SCOPE-02: plan/main.md 에 "## In-scope" 섹션 누락
 *   W-SCOPE-03: plan/main.md 에 "## Out-of-scope" 섹션 누락
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

// v0.58: C-Level 소유권 enum
const C_LEVEL_OWNERS = new Set(['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo']);

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
        // v0.58 TD-4: "## N. 큐레이션 기록" 같은 번호 접두도 허용
        if (!/^##\s+(?:[\d.]+\s+)?큐레이션\s*기록/m.test(content)) {
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
 * v0.58 C-Level coexistence 검증 — topic frontmatter owner + main.md 멀티-오너 구조 + size budget.
 * enforcement=warn 기본이라 exit 에 영향 주지 않음.
 *
 * @param {string} feature
 * @param {Object} [options] - { phases?: string[] }
 * @returns {Array<{ code, path, message }>}
 */
function validateCoexistence(feature, options = {}) {
  const out = [];
  if (!feature) return out;

  const cfg = loadConfig();
  const policy = cfg.workflow?.cLevelCoexistencePolicy ?? {};
  const ownerRequired = policy.ownerRequired !== false;
  const maxLines = typeof policy.mainMdMaxLines === 'number' ? policy.mainMdMaxLines : 200;

  const phases = options.phases ?? Object.values(PHASE_FOLDERS);
  const docsRoot = path.join(process.cwd(), 'docs', feature);
  if (!fs.existsSync(docsRoot)) return out;

  for (const phaseFolder of phases) {
    const phaseDir = path.join(docsRoot, phaseFolder);
    if (!fs.existsSync(phaseDir)) continue;

    // 파일 목록 수집
    let files;
    try { files = fs.readdirSync(phaseDir); }
    catch (_) { files = []; }

    const topicFiles = files.filter(f =>
      f.endsWith('.md') && !SYSTEM_ARTIFACT_NAMES.has(f)
    );

    // 1. Topic 문서 frontmatter owner 검사 (W-OWN-01/02)
    for (const f of topicFiles) {
      const p = path.join(phaseDir, f);
      let stat;
      try { stat = fs.statSync(p); } catch (_) { continue; }
      if (!stat.isFile()) continue;

      let content;
      try { content = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }

      // frontmatter 추출 (--- ... ---)
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        if (ownerRequired) {
          out.push({ code: 'W-OWN-01', path: p, message: 'frontmatter missing (owner required)' });
        }
        continue;
      }

      const fm = fmMatch[1];
      const ownerMatch = fm.match(/^owner:\s*(\S+)/m);
      if (!ownerMatch) {
        if (ownerRequired) {
          out.push({ code: 'W-OWN-01', path: p, message: 'owner frontmatter missing' });
        }
      } else {
        const owner = ownerMatch[1].toLowerCase();
        if (!C_LEVEL_OWNERS.has(owner)) {
          out.push({ code: 'W-OWN-02', path: p, message: `invalid owner "${ownerMatch[1]}" (allowed: ceo|cpo|cto|cso|cbo|coo)` });
        }
      }
    }

    // 2. main.md 멀티-오너 구조 + size budget 검사
    const mainPath = path.join(phaseDir, 'main.md');
    if (!fs.existsSync(mainPath)) continue;

    let mainContent;
    try { mainContent = fs.readFileSync(mainPath, 'utf8'); }
    catch (_) { continue; }

    // 2a. Decision Record Owner 컬럼 (W-MRG-02)
    //     "## Decision Record" 섹션 다음에 나오는 첫 표 헤더 라인에 "Owner" 포함 여부
    const drHeaderIdx = mainContent.search(/^##\s+Decision Record/m);
    if (drHeaderIdx >= 0) {
      // DR section: 현재 `## Decision Record` 부터 다음 `## ` 전까지
      const tail = mainContent.slice(drHeaderIdx);
      const nextH2 = tail.slice(3).search(/\n##\s+/);
      const drSection = nextH2 >= 0 ? tail.slice(0, nextH2 + 3) : tail;
      // 첫 표 헤더 라인 (`|` 로 시작하는 라인)
      const headerLine = (drSection.match(/^\s*\|[^\n]+\|/m) || [''])[0];
      if (headerLine && !/\|\s*Owner\s*\|/i.test(headerLine)) {
        out.push({ code: 'W-MRG-02', path: mainPath, message: 'Decision Record missing Owner column' });
      }
    }

    // 2b. C-Level 섹션 카운트 vs topic 파일 개수 (W-MRG-03)
    const ownerSections = (mainContent.match(/^##\s+\[(CBO|CPO|CTO|CSO|COO|CEO)\]\s/gm) || []).length;
    if (topicFiles.length >= 2 && ownerSections === 0) {
      out.push({ code: 'W-MRG-03', path: mainPath, message: `multi-owner topics present (${topicFiles.length}) but no H2 owner section found (## [CBO|CPO|CTO|CSO|COO|CEO])` });
    }

    // 2c. Size budget (W-MAIN-SIZE, F14) — main.md 가 threshold 초과 AND topic 0 AND _tmp/ 0
    const tmpDir = path.join(phaseDir, '_tmp');
    const hasTmp = fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).some(f => f.endsWith('.md'));
    const lines = mainContent.split(/\n/).length;
    if (lines > maxLines && topicFiles.length === 0 && !hasTmp) {
      out.push({
        code: 'W-MAIN-SIZE',
        path: mainPath,
        message: `main.md ${lines} lines exceeds mainMdMaxLines (${maxLines}); consider topic split (v0.57 _tmp/ + v0.58 topic)`
      });
    }
  }

  return out;
}

/**
 * v0.58.3 plan scope contract 검증 — plan/main.md 에 "## 요청 원문" / "## In-scope" / "## Out-of-scope" 섹션 존재 여부.
 * enforcement=warn 기본이라 exit 에 영향 주지 않음.
 *
 * @param {string} feature
 * @returns {Array<{ code, path, message }>}
 */
function validateScopeContract(feature) {
  const out = [];
  if (!feature) return out;

  const cfg = loadConfig();
  const policy = cfg.workflow?.scopeContractPolicy ?? {};
  const enforcement = policy.enforcement ?? 'warn';
  if (enforcement === 'off') return out;

  const planMain = path.join(process.cwd(), 'docs', feature, '01-plan', 'main.md');
  if (!fs.existsSync(planMain)) return out;

  let content;
  try { content = fs.readFileSync(planMain, 'utf8'); } catch (_) { return out; }

  if (!/^## 요청 원문\s*$/m.test(content)) {
    out.push({ code: 'W-SCOPE-01', path: planMain, message: '"## 요청 원문" 섹션 누락 (Rule #9 — 사용자 요청 축약 없이 인용)' });
  }
  if (!/^## In-scope\s*$/m.test(content)) {
    out.push({ code: 'W-SCOPE-02', path: planMain, message: '"## In-scope" 섹션 누락' });
  }
  if (!/^## Out-of-scope\s*$/m.test(content)) {
    out.push({ code: 'W-SCOPE-03', path: planMain, message: '"## Out-of-scope" 섹션 누락 (명시 없으면 "(없음)" 한 줄)' });
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

/**
 * v0.58 coexistence 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatCoexistenceWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [clevel-coexistence v0.58] ${warnings.length}건 경고:`];
  for (const w of warnings) {
    const rel = path.relative(process.cwd(), w.path);
    lines.push(`   ⚠️  [${w.code}] ${rel}: ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * v0.58.3 scope-contract 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatScopeContractWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [scope-contract v0.58.3] ${warnings.length}건 경고:`];
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
  const coexistenceWarnings = feature ? validateCoexistence(feature) : [];
  const scopeWarnings = feature ? validateScopeContract(feature) : [];
  result.subDocWarnings = subDocWarnings;
  result.coexistenceWarnings = coexistenceWarnings;
  result.scopeWarnings = scopeWarnings;

  const output = formatResult(role, feature, result);
  const subDocOutput = formatSubDocWarnings(subDocWarnings);
  const coexistenceOutput = formatCoexistenceWarnings(coexistenceWarnings);
  const scopeOutput = formatScopeContractWarnings(scopeWarnings);

  if (output) process.stderr.write(output + '\n');
  if (subDocOutput) process.stderr.write(subDocOutput + '\n');
  if (coexistenceOutput) process.stderr.write(coexistenceOutput + '\n');
  if (scopeOutput) process.stderr.write(scopeOutput + '\n');

  process.stdout.write(JSON.stringify(result));

  // enforcement 정책
  const cfg = loadConfig();
  const subDocEnforcement = cfg.workflow?.subDocPolicy?.enforcement ?? 'warn';
  const coexEnforcement = cfg.workflow?.cLevelCoexistencePolicy?.enforcement ?? 'warn';
  const scopeEnforcement = cfg.workflow?.scopeContractPolicy?.enforcement ?? 'warn';
  if (!result.passed) process.exit(1);
  if (subDocEnforcement === 'fail' && subDocWarnings.length > 0) process.exit(1);
  if (coexEnforcement === 'fail' && coexistenceWarnings.length > 0) process.exit(1);
  if (scopeEnforcement === 'fail' && scopeWarnings.length > 0) process.exit(1);
  process.exit(0);
}

module.exports = { validateDocs, validateSubDocs, validateCoexistence, validateScopeContract, formatResult, formatSubDocWarnings, formatCoexistenceWarnings, formatScopeContractWarnings, MANDATORY_PHASES, C_LEVEL_ROLES, C_LEVEL_OWNERS, PHASE_FOLDERS };
