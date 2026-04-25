#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Template Validator (F2)
 * template frontmatter schema 검증 + (c) 깊이 검증 CLI.
 *
 * CLI:
 *   node scripts/template-validator.js [path] [--depth-check]
 *
 * Exit codes:
 *   0 = 모든 template 통과
 *   1 = schema error (frontmatter 필수 필드 누락 / policy enum 위반)
 *   2 = depth error (--depth-check 시 sample/checklist/anti-pattern 미충족)
 *
 * @see https://github.com/jonschlinkert/gray-matter#readme
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md 섹션 3
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 3.1
 *
 * > 참조 문서:
 * > - technical-architecture-design.md 섹션 3: template-validator CLI 스펙
 * > - infra-architect.md 섹션 3.1: checkDepthC 구현 상세
 * > - solution-features.md F2: 수용 기준 SC-02
 */

const fs = require('fs');
const path = require('path');

// gray-matter 선택적 의존성
let matter;
try {
  matter = require('gray-matter');
} catch (e) {
  process.stderr.write('[VAIS TemplateValidator] ❌ gray-matter 미설치 — npm install 실행 후 재시도\n');
  process.exit(1);
}

const { PROJECT_DIR } = require('../lib/paths');

// ── Schema 상수 ────────────────────────────────────────────────

/** frontmatter 필수 최상위 필드 */
const REQUIRED_FIELDS = ['artifact', 'owner_agent', 'phase', 'canon_source', 'execution'];

/** execution 하위 필수 필드 */
const EXECUTION_REQUIRED = ['policy'];

/** 허용 policy 값 */
const VALID_POLICIES = ['always', 'scope', 'user-select', 'triggered'];

/** 허용 phase 값 */
const VALID_PHASES = ['core', 'why', 'what', 'how', 'biz', 'alignment'];

/** 허용 template_depth 값 */
const VALID_TEMPLATE_DEPTHS = [
  'stub',
  'outline',
  'filled-sample',
  'filled-sample-with-checklist',
];

// ── 깊이 검증 상수 ─────────────────────────────────────────────

/** (c) 깊이 — "## (작성된 sample)" 섹션 최소 글자 수 */
const MIN_SAMPLE_LENGTH = 100;

/** (c) 깊이 — "## 작성 체크리스트" 최소 항목 수 */
const MIN_CHECKLIST_ITEMS = 5;

/** (c) 깊이 — "## ⚠ Anti-pattern" 최소 항목 수 */
const MIN_ANTIPATTERN_ITEMS = 3;

// ── 깊이 검증 로직 ─────────────────────────────────────────────

/**
 * template_depth = "filled-sample-with-checklist" 인 경우
 * 마크다운 본문에 3섹션이 모두 있는지 확인.
 *
 * 검증 항목:
 *   1. "## (작성된 sample)" — 100자+ 내용 존재
 *   2. "## 작성 체크리스트" — - [ ] 항목 5개 이상
 *   3. "## ⚠ Anti-pattern" 또는 "## Anti-pattern" — 항목 3개 이상
 *
 * @param {string} content  - 마크다운 본문 (frontmatter 제외)
 * @returns {{
 *   sample: boolean,
 *   sampleLength: number,
 *   checklist: boolean,
 *   checklistCount: number,
 *   antipattern: boolean,
 *   antipatternCount: number
 * }}
 *
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 3.1
 */
function checkDepthC(content) {
  // 1. sample 섹션 검증
  const sampleRe = /^##\s+\(작성된 sample\)/m;
  const sampleMatch = sampleRe.exec(content);
  let sampleLength = 0;
  if (sampleMatch) {
    // sample 섹션부터 다음 H2까지의 내용 추출
    const afterSample = content.slice(sampleMatch.index + sampleMatch[0].length);
    const nextH2 = afterSample.search(/^##\s+/m);
    const sampleContent = nextH2 >= 0 ? afterSample.slice(0, nextH2) : afterSample;
    sampleLength = sampleContent.trim().length;
  }
  const sample = sampleMatch !== null && sampleLength >= MIN_SAMPLE_LENGTH;

  // 2. 체크리스트 섹션 검증
  const checklistRe = /^##\s+작성 체크리스트/m;
  const checklistMatch = checklistRe.exec(content);
  let checklistCount = 0;
  if (checklistMatch) {
    const afterChecklist = content.slice(checklistMatch.index);
    const nextH2 = afterChecklist.search(/^##\s+/m, 1); // 현재 H2 이후 다음 H2
    const checklistContent = nextH2 > 0 ? afterChecklist.slice(0, nextH2) : afterChecklist;
    checklistCount = (checklistContent.match(/^- \[[ xX]\]/gm) || []).length;
  }
  const checklist = checklistCount >= MIN_CHECKLIST_ITEMS;

  // 3. Anti-pattern 섹션 검증
  const antiRe = /^##\s+(?:⚠\s+)?Anti-pattern/m;
  const antiMatch = antiRe.exec(content);
  let antipatternCount = 0;
  if (antiMatch) {
    const afterAnti = content.slice(antiMatch.index);
    const nextH2 = afterAnti.search(/^##\s+/m, 1);
    const antiContent = nextH2 > 0 ? afterAnti.slice(0, nextH2) : afterAnti;
    antipatternCount = (antiContent.match(/^[-*]\s+\S/gm) || []).length;
  }
  const antipattern = antipatternCount >= MIN_ANTIPATTERN_ITEMS;

  return {
    sample,
    sampleLength,
    checklist,
    checklistCount,
    antipattern,
    antipatternCount,
  };
}

// ── 단일 파일 검증 ─────────────────────────────────────────────

/**
 * 단일 template 파일 검증.
 *
 * @param {string} filePath   - 절대 경로
 * @param {object} [opts]
 * @param {boolean} [opts.depthCheck]  - (c) 깊이 검증 활성화
 * @returns {{
 *   file: string,
 *   valid: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   depthResult: object | null
 * }}
 */
function validateTemplateFile(filePath, opts) {
  const { depthCheck = false } = opts || {};
  const errors = [];
  const warnings = [];
  let depthResult = null;

  // 파일 읽기
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { file: filePath, valid: false, errors: [`파일 읽기 실패: ${e.message}`], warnings, depthResult };
  }

  // gray-matter parse
  let fm, content;
  try {
    const parsed = matter(raw);
    fm = parsed.data;
    content = parsed.content;
  } catch (e) {
    return { file: filePath, valid: false, errors: [`frontmatter 파싱 실패: ${e.message}`], warnings, depthResult };
  }

  // ── 필수 필드 검증 ──────────────────────────────────────────
  for (const field of REQUIRED_FIELDS) {
    if (fm[field] === undefined || fm[field] === null || fm[field] === '') {
      errors.push(`필수 필드 누락: "${field}"`);
    }
  }

  // ── execution 하위 필드 검증 ────────────────────────────────
  if (fm.execution && typeof fm.execution === 'object') {
    for (const subField of EXECUTION_REQUIRED) {
      if (fm.execution[subField] === undefined || fm.execution[subField] === null) {
        errors.push(`필수 하위 필드 누락: "execution.${subField}"`);
      }
    }
    // policy enum 검증
    if (fm.execution.policy !== undefined) {
      if (!VALID_POLICIES.includes(fm.execution.policy)) {
        errors.push(
          `"execution.policy" 값 "${fm.execution.policy}" 이 유효하지 않습니다. 허용: [${VALID_POLICIES.join(', ')}]`
        );
      }
    }
  } else if (fm.execution !== undefined && fm.execution !== null) {
    errors.push('"execution" 필드는 객체여야 합니다.');
  }

  // ── phase enum 검증 (경고만) ─────────────────────────────────
  if (fm.phase && !VALID_PHASES.includes(fm.phase)) {
    warnings.push(
      `"phase" 값 "${fm.phase}" 이 알려진 phase가 아닙니다. 알려진 phase: [${VALID_PHASES.join(', ')}]`
    );
  }

  // ── template_depth enum 검증 (경고만) ───────────────────────
  if (fm.template_depth && !VALID_TEMPLATE_DEPTHS.includes(fm.template_depth)) {
    warnings.push(
      `"template_depth" 값 "${fm.template_depth}" 이 알려진 값이 아닙니다.`
    );
  }

  // ── (c) 깊이 검증 ────────────────────────────────────────────
  if (depthCheck && fm.template_depth === 'filled-sample-with-checklist') {
    depthResult = checkDepthC(content);
    if (!depthResult.sample) {
      errors.push(
        `[depth-check] "## (작성된 sample)" 섹션 미흡 — 현재 ${depthResult.sampleLength}자 (최소 ${MIN_SAMPLE_LENGTH}자 필요)`
      );
    }
    if (!depthResult.checklist) {
      errors.push(
        `[depth-check] "## 작성 체크리스트" 항목 미흡 — - [ ] 항목 ${depthResult.checklistCount}개 (최소 ${MIN_CHECKLIST_ITEMS}개 필요)`
      );
    }
    if (!depthResult.antipattern) {
      errors.push(
        `[depth-check] "## ⚠ Anti-pattern" 항목 미흡 — ${depthResult.antipatternCount}개 (최소 ${MIN_ANTIPATTERN_ITEMS}개 필요)`
      );
    }
  }

  return {
    file: filePath,
    valid: errors.length === 0,
    errors,
    warnings,
    depthResult,
  };
}

// ── 디렉토리 재귀 스캔 ────────────────────────────────────────

/**
 * 디렉토리에서 catalog artifact .md 파일 목록 재귀 수집.
 *
 * 제외 대상:
 *   - `*.template.md` — PDCA workflow templates (plan/design/do/qa/report)
 *     로 catalog artifact schema 와 별개 도메인. 명명 규칙으로 구분.
 *
 * @param {string} dir  - 절대 경로
 * @returns {string[]}  - 절대 경로 목록
 */
function collectMdFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // PDCA workflow templates 제외 — *.template.md 패턴
      if (entry.name.endsWith('.template.md')) continue;
      results.push(fullPath);
    }
  }
  return results;
}

// ── CLI 진입점 ────────────────────────────────────────────────

/**
 * CLI main 함수.
 * 인수를 파싱하여 단일 파일 또는 templates/ 전체 검증 수행.
 *
 * @param {string[]} argv  - process.argv.slice(2)
 * @returns {number}       - exit code (0/1/2)
 */
function main(argv) {
  const args = argv.slice(0);
  const depthCheck = args.includes('--depth-check');
  const jsonOutput = args.includes('--json');
  const quiet = args.includes('--quiet');

  // 플래그 제거 후 positional 인수 추출
  const positional = args.filter((a) => !a.startsWith('--'));

  // 검증할 파일 목록 결정
  let targetFiles = [];

  if (positional.length > 0) {
    // 단일 파일 또는 디렉토리 지정
    for (const p of positional) {
      const absPath = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
      if (fs.existsSync(absPath)) {
        const stat = fs.statSync(absPath);
        if (stat.isDirectory()) {
          targetFiles.push(...collectMdFiles(absPath));
        } else {
          targetFiles.push(absPath);
        }
      } else {
        process.stderr.write(`[VAIS TemplateValidator] ⚠ 경로 미발견: ${absPath}\n`);
      }
    }
  } else {
    // 기본: templates/ 전체 스캔
    const templatesDir = path.join(PROJECT_DIR, 'templates');
    targetFiles = collectMdFiles(templatesDir);
    if (targetFiles.length === 0) {
      if (!quiet) {
        process.stdout.write('[VAIS TemplateValidator] templates/ 디렉토리에 .md 파일 없음\n');
      }
      if (jsonOutput) {
        process.stdout.write(JSON.stringify({ total: 0, passed: 0, failed: 0, results: [] }, null, 2) + '\n');
      }
      return 0;
    }
  }

  // 검증 실행
  const results = targetFiles.map((f) => validateTemplateFile(f, { depthCheck }));

  const passed = results.filter((r) => r.valid);
  const failed = results.filter((r) => !r.valid);

  // 결과 출력
  if (jsonOutput) {
    // CI 파이프라인용 JSON 출력
    const output = {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      results: results.map((r) => ({
        file: path.relative(PROJECT_DIR, r.file),
        valid: r.valid,
        errors: r.errors,
        warnings: r.warnings,
        ...(r.depthResult ? { depthResult: r.depthResult } : {}),
      })),
    };
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  } else {
    // 사람이 읽는 출력
    for (const r of results) {
      const relPath = path.relative(PROJECT_DIR, r.file);
      if (r.valid && !quiet) {
        process.stdout.write(`  ✅ ${relPath}\n`);
        for (const w of r.warnings) {
          process.stdout.write(`     ⚠ ${w}\n`);
        }
      } else if (!r.valid) {
        process.stdout.write(`  ❌ ${relPath}\n`);
        for (const e of r.errors) {
          process.stdout.write(`     ERROR: ${e}\n`);
        }
        for (const w of r.warnings) {
          process.stdout.write(`     WARN:  ${w}\n`);
        }
      }
    }
    process.stdout.write(
      `\n결과: ${passed.length}/${results.length} 통과` +
      (failed.length > 0 ? `, ${failed.length}개 실패` : '') +
      '\n'
    );
  }

  // exit code 결정
  if (failed.length === 0) return 0;

  // depth error vs schema error 구분
  const hasSchemaErrors = failed.some(
    (r) => r.errors.some((e) => !e.startsWith('[depth-check]'))
  );
  const hasDepthErrors = failed.some(
    (r) => r.errors.some((e) => e.startsWith('[depth-check]'))
  );

  if (hasSchemaErrors) return 1;
  if (hasDepthErrors) return 2;
  return 1;
}

// ── 모듈 export ───────────────────────────────────────────────

module.exports = {
  validateTemplateFile,
  checkDepthC,
  collectMdFiles,
  REQUIRED_FIELDS,
  VALID_POLICIES,
  VALID_PHASES,
  MIN_CHECKLIST_ITEMS,
  MIN_ANTIPATTERN_ITEMS,
  MIN_SAMPLE_LENGTH,
};

// ── CLI 실행 ──────────────────────────────────────────────────

if (require.main === module) {
  const code = main(process.argv.slice(2));
  process.exit(code);
}
