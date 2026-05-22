#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] doc-validator crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] doc-validator rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Document Validator
 * C-Level 에이전트 종료 시 필수 문서 존재 여부 검증.
 *
 * 사용: node scripts/doc-validator.js <role> <feature>
 * 반환: JSON { passed, missing, warnings, coexistenceWarnings, scopeWarnings, frontmatterWarnings }
 *   - passed: boolean (필수 main.md 모두 존재)
 *   - missing: [{ phase, path }]
 *   - warnings: [string] (일반 경고)
 *
 * C-Level phase-index coexistence 경고 코드:
 *   W-OWN-01: artifact.md frontmatter 에 owner 누락
 *   W-OWN-02: artifact.md frontmatter owner 값이 C-Level enum 외
 *   W-MRG-02: main.md Decision Record 표에 Owner 컬럼 누락
 *   W-MRG-03: artifact ≥ 2 이지만 main.md 가 5섹션 index 도 legacy owner-H2 모델도 아님
 *   W-MAIN-SIZE: main.md 라인 수 > mainMdMaxLines AND artifact 0
 *
 * 경고 코드 (plan-scope-contract):
 *   W-SCOPE-01: plan/main.md 에 "## 요청 원문" 섹션 누락 (CLAUDE.md Rule #9)
 *   W-SCOPE-02: plan/main.md 에 "## In-scope" 섹션 누락
 *   W-SCOPE-03: plan/main.md 에 "## Out-of-scope" 섹션 누락
 *
 * Frontmatter 변경:
 *   W-FRONT-01 누락 필드 집합이 vais.config.json > workflow.frontmatterMinimal.required 기반으로 축소.
 *   기본값 ['owner','artifact','phase','feature']. owner 누락은 W-OWN-01 으로 통합.
 *   agent / generated / summary 는 autoHydrate 대상 — 누락 시 검사 스킵.
 *
 * v1.0.0: legacy _tmp/scratchpad/topic compatibility 제거 (결정 #8).
 *   W-SCP-01/02/03, W-TPC-01, W-IDX-01 경고 코드 폐기.
 *   validateSubDocs() 제거. 1.0.0+ 는 sub-agent 직접 박제 모델만 지원.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { getActiveFeature, getMandatoryPhases } = require('../lib/status');

// C-Level 역할 목록
const C_LEVEL_ROLES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];

// Phase 폴더 매핑 (subDoc 스캔용)
const PHASE_FOLDERS = {
  ideation: '00-ideation',
  plan: '01-plan',
  design: '02-design',
  do: '03-do',
  qa: '04-qa',
  report: '05-report',
};

// 시스템 산출물 (topic 아님, curation 검증 제외)
const SYSTEM_ARTIFACT_NAMES = new Set(['main.md', 'interface-contract.md']);

// C-Level 소유권 enum
const C_LEVEL_OWNERS = new Set(['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo']);

function hasPhaseIndexSections(content) {
  const required = [
    /^##\s+(?:\d+\.\s+)?Executive Summary\s*$/mi,
    /^##\s+(?:\d+\.\s+)?Decision Record\b/mi,
    /^##\s+(?:\d+\.\s+)?Artifacts\b/mi,
    /^##\s+(?:\d+\.\s+)?CEO 판단 근거\s*$/mi,
    /^##\s+(?:\d+\.\s+)?Next Phase\b/mi,
  ];
  return required.every((re) => re.test(content));
}

function hasLegacyOwnerSections(content) {
  return (content.match(/^##\s+\[(CBO|CPO|CTO|CSO|COO|CEO)\]\s/gm) || []).length > 0;
}

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

  // Empty feature folder 자동 인식. docs/{feature}/ 폴더 하위에 어떤 .md 도
  // 없으면 historical/empty (ideation 만 박제 후 본격 진행 X) → skip.
  const featureRoot = path.join(process.cwd(), 'docs', feature);
  if (fs.existsSync(featureRoot)) {
    const hasAnyMd = (function walk(dir) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return false; }
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isFile() && ent.name.endsWith('.md')) return true;
        if (ent.isDirectory() && walk(p)) return true;
      }
      return false;
    })(featureRoot);
    if (!hasAnyMd) {
      result.warnings.push(`empty feature folder — mandatoryPhases 검사 skip (historical/empty)`);
      return result;
    }
  }

  // Ideation-only feature 자동 인식. 00-ideation/main.md 만 존재하고
  // mandatory phase 가 모두 부재면 (분석 인덱스 등 정식 PDCA 진행 의도 없는 폴더),
  // mandatoryPhases 검사를 skip 한다. backward-compat.
  const ideationMain = path.join(process.cwd(), 'docs', feature, '00-ideation', 'main.md');
  if (fs.existsSync(ideationMain)) {
    const mandatory = getMandatoryPhases(role);
    const anyMandatory = mandatory.some((p) => {
      const dp = resolveDocPath(p, feature, role);
      return dp && fs.existsSync(dp);
    });
    if (!anyMandatory) {
      result.warnings.push(`ideation-only feature (00-ideation/main.md only) — mandatoryPhases 검사 skip`);
      return result;
    }
  }

  for (const phase of getMandatoryPhases(role)) {
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
 * C-Level coexistence 검증 — artifact frontmatter owner + main.md 5섹션 index/legacy 멀티-오너 구조 + size budget.
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

    // 2b. main.md 는 현재 5섹션 phase index 이거나 legacy owner-H2 모델이면 통과 (W-MRG-03)
    const hasCurrentIndex = hasPhaseIndexSections(mainContent);
    const hasOwnerSections = hasLegacyOwnerSections(mainContent);
    if (topicFiles.length >= 2 && !hasCurrentIndex && !hasOwnerSections) {
      out.push({ code: 'W-MRG-03', path: mainPath, message: `multiple artifacts present (${topicFiles.length}) but main.md is neither 5-section phase index nor legacy owner-H2 model` });
    }

    // 2c. Size budget (W-MAIN-SIZE, F14) — main.md 가 threshold 초과 AND artifact 0
    const lines = mainContent.split(/\n/).length;
    if (lines > maxLines && topicFiles.length === 0) {
      out.push({
        code: 'W-MAIN-SIZE',
        path: mainPath,
        message: `main.md ${lines} lines exceeds mainMdMaxLines (${maxLines}); split body into artifact MD files`
      });
    }
  }

  return out;
}

/**
 * Plan scope contract 검증 — plan/main.md 에 "## 요청 원문" / "## In-scope" / "## Out-of-scope" 섹션 존재 여부.
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

  const planDir = path.join(process.cwd(), 'docs', feature, '01-plan');
  const planMain = path.join(planDir, 'main.md');
  if (!fs.existsSync(planMain)) return out;

  // 5섹션 index 정책 대응. main.md 외에 같은 폴더의 plan body artifact
  // (예: tech-plan.md, plan-rationale.md, plan.md) 도 fallback 검사.
  // workflow-contract-matrix §8 — main.md must remain an index. body 는 별도 artifact MD.
  let combined;
  try {
    combined = fs.readFileSync(planMain, 'utf8');
    for (const fname of fs.readdirSync(planDir)) {
      if (fname === 'main.md' || !fname.endsWith('.md')) continue;
      try { combined += '\n' + fs.readFileSync(path.join(planDir, fname), 'utf8'); }
      catch (_) { /* skip unreadable */ }
    }
  } catch (_) { return out; }

  // Regex 완화 — numeric prefix (`## 0. `) 와 parenthetical suffix (`(synthesis 인용)`)
  // 모두 허용. 정책 의도는 "원문 인용 / scope 명시" 가 있어야 한다 이지 정확한 H2 텍스트 강제 X.
  // 끝부분 \b 제거 — 한글 글자(요청 원문)는 \w 에 포함되지 않아 word-boundary 가
  // 항상 false 가 되어 매치 실패하던 버그. 영어 In-scope/Out-of-scope 도 일관성 유지를 위해 동일.
  if (!/^##\s+(?:\d+\.\s*)?요청 원문/m.test(combined)) {
    out.push({ code: 'W-SCOPE-01', path: planMain, message: '"## 요청 원문" 섹션 누락 (Rule #9 — main.md 또는 plan body artifact 에 작성)' });
  }
  if (!/^##\s+(?:\d+\.\s*)?In-scope/m.test(combined)) {
    out.push({ code: 'W-SCOPE-02', path: planMain, message: '"## In-scope" 섹션 누락 (main.md 또는 plan body artifact)' });
  }
  if (!/^##\s+(?:\d+\.\s*)?Out-of-scope/m.test(combined)) {
    out.push({ code: 'W-SCOPE-03', path: planMain, message: '"## Out-of-scope" 섹션 누락 (명시 없으면 "(없음)" 한 줄. main.md 또는 plan body artifact)' });
  }

  return out;
}

/**
 * v2.1 (0.65+) — artifact MD frontmatter 검증.
 *
 * 정본: vais.config.json > workflow.frontmatterMinimal
 *   - required: 4 필수 필드 (owner / artifact / phase / feature) — 누락 시 warn (owner 만 W-OWN-01, 나머지는 W-FRONT-01)
 *   - autoHydrate: 3 옵션 필드 (agent / generated / summary) — 누락은 검사 스킵 (sub-agent 또는 hook 이 git log 등으로 hydrate)
 *   - optional: source / knowledge_refs — 누락 검사 안 함
 *
 * Backward-compat: 8 필드 산출물 그대로 통과.
 *
 * @param {string} feature
 * @param {Object} [options] - { phases?: string[] }
 * @returns {Array<{ code, path, message, severity }>}
 */
function validateArtifactFrontmatter(feature, options = {}) {
  const out = [];
  if (!feature) return out;

  const cfg = loadConfig();
  const fmMin = cfg.workflow?.frontmatterMinimal ?? {};
  const REQUIRED = Array.isArray(fmMin.required) && fmMin.required.length > 0
    ? fmMin.required
    : ['owner', 'artifact', 'phase', 'feature'];

  const OWNER_ENUM = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
  const PHASE_ENUM = ['ideation', 'plan', 'design', 'do', 'qa', 'report'];

  const phases = options.phases ?? Object.values(PHASE_FOLDERS);
  const docsRoot = path.join(process.cwd(), 'docs', feature);
  if (!fs.existsSync(docsRoot)) return out;

  for (const phaseFolder of phases) {
    const phaseDir = path.join(docsRoot, phaseFolder);
    if (!fs.existsSync(phaseDir)) continue;

    let files;
    try { files = fs.readdirSync(phaseDir); }
    catch (_) { files = []; }

    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      // main.md / interface-contract.md 같은 system 파일은 frontmatter spec 다름
      if (SYSTEM_ARTIFACT_NAMES.has(f)) continue;
      const p = path.join(phaseDir, f);
      let stat;
      try { stat = fs.statSync(p); } catch (_) { continue; }
      if (!stat.isFile()) continue;

      let content;
      try { content = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }

      // frontmatter 추출 (--- ... --- 사이)
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        out.push({ code: 'W-FRONT-00', path: p, message: 'frontmatter 자체 누락', severity: 'warn' });
        continue;
      }
      const fmRaw = fmMatch[1];
      const fm = {};
      for (const line of fmRaw.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const k = line.slice(0, colonIdx).trim();
        const v = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        fm[k] = v;
      }

      // 필수 필드 검사 (v2.1: owner 누락은 W-OWN-01 으로 통합, 나머지는 W-FRONT-01)
      for (const field of REQUIRED) {
        if (fm[field]) continue;
        if (field === 'owner') {
          out.push({ code: 'W-OWN-01', path: p, message: `frontmatter 'owner' 누락`, severity: 'warn' });
        } else {
          out.push({ code: 'W-FRONT-01', path: p, message: `frontmatter '${field}' 누락`, severity: 'warn' });
        }
      }

      // owner enum
      if (fm.owner && !OWNER_ENUM.includes(fm.owner)) {
        out.push({ code: 'W-FRONT-02', path: p, message: `owner '${fm.owner}' ∉ enum (${OWNER_ENUM.join('|')})`, severity: 'warn' });
      }

      // phase enum
      if (fm.phase && !PHASE_ENUM.includes(fm.phase)) {
        out.push({ code: 'W-FRONT-03', path: p, message: `phase '${fm.phase}' ∉ enum`, severity: 'warn' });
      }

      // 파일 stem = artifact
      const stem = path.basename(f, '.md');
      if (fm.artifact && fm.artifact !== stem) {
        out.push({ code: 'W-FRONT-04', path: p, message: `artifact '${fm.artifact}' ≠ 파일 stem '${stem}'`, severity: 'warn' });
      }

      // summary 길이 (있을 때만 — autoHydrate 대상이라 누락 OK)
      if (fm.summary && fm.summary.length > 200) {
        out.push({ code: 'W-FRONT-05', path: p, message: `summary > 200자 (${fm.summary.length})`, severity: 'warn' });
      }
    }
  }

  return out;
}

/**
 * v2.1 frontmatter 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatFrontmatterWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [frontmatter v2.1] ${warnings.length}건 경고:`];
  for (const w of warnings) {
    const rel = path.relative(process.cwd(), w.path);
    lines.push(`   ⚠️  [${w.code}] ${rel}: ${w.message}`);
  }
  return lines.join('\n');
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
 * Coexistence 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatCoexistenceWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [phase-index coexistence v2.2] ${warnings.length}건 경고:`];
  for (const w of warnings) {
    const rel = path.relative(process.cwd(), w.path);
    lines.push(`   ⚠️  [${w.code}] ${rel}: ${w.message}`);
  }
  return lines.join('\n');
}

/**
 * Scope-contract 경고를 사람이 읽을 수 있는 형식으로 출력
 */
function formatScopeContractWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [`ℹ️  [scope-contract] ${warnings.length}건 경고:`];
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
  const coexistenceWarnings = feature ? validateCoexistence(feature) : [];
  const scopeWarnings = feature ? validateScopeContract(feature) : [];
  const frontmatterWarnings = feature ? validateArtifactFrontmatter(feature) : [];
  result.coexistenceWarnings = coexistenceWarnings;
  result.scopeWarnings = scopeWarnings;
  result.frontmatterWarnings = frontmatterWarnings;

  const output = formatResult(role, feature, result);
  const coexistenceOutput = formatCoexistenceWarnings(coexistenceWarnings);
  const scopeOutput = formatScopeContractWarnings(scopeWarnings);
  const frontmatterOutput = formatFrontmatterWarnings(frontmatterWarnings);

  if (output) process.stderr.write(output + '\n');
  if (coexistenceOutput) process.stderr.write(coexistenceOutput + '\n');
  if (scopeOutput) process.stderr.write(scopeOutput + '\n');
  if (frontmatterOutput) process.stderr.write(frontmatterOutput + '\n');

  process.stdout.write(JSON.stringify(result));

  // enforcement 정책
  const cfg = loadConfig();
  const coexEnforcement = cfg.workflow?.cLevelCoexistencePolicy?.enforcement ?? 'warn';
  const scopeEnforcement = cfg.workflow?.scopeContractPolicy?.enforcement ?? 'warn';
  // mainMdMaxLinesAction 은 coexistence enforcement 와 독립적으로 W-MAIN-SIZE 만 차단
  const mainSizeAction = cfg.workflow?.cLevelCoexistencePolicy?.mainMdMaxLinesAction ?? 'warn';
  if (!result.passed) process.exit(1);
  if (coexEnforcement === 'fail' && coexistenceWarnings.length > 0) process.exit(1);
  if (scopeEnforcement === 'fail' && scopeWarnings.length > 0) process.exit(1);
  if (mainSizeAction === 'refuse' && coexistenceWarnings.some(w => w.code === 'W-MAIN-SIZE')) process.exit(1);
  process.exit(0);
}

module.exports = { validateDocs, validateCoexistence, validateScopeContract, validateArtifactFrontmatter, formatResult, formatCoexistenceWarnings, formatScopeContractWarnings, formatFrontmatterWarnings, C_LEVEL_ROLES, C_LEVEL_OWNERS, PHASE_FOLDERS };
