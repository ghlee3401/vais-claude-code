#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Catalog Builder (F3)
 * templates/{section}/*.md 스캔 → catalog.json 빌드.
 *
 * CLI:
 *   node scripts/build-catalog.js [--validate]
 *
 * Exit codes:
 *   0 = 성공
 *   1 = template 파싱 오류 1건 이상
 *   2 = --validate 옵션 + schema 검증 실패
 *
 * 산출물: catalog.json (PROJECT_ROOT/catalog.json)
 *
 * @see https://github.com/jonschlinkert/gray-matter#readme
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md 섹션 3
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 3.2
 * @see docs/subagent-architecture-rethink/01-plan/nfr-and-data-model.md 섹션 2.2
 *
 * > 참조 문서:
 * > - technical-architecture-design.md 섹션 3: build-catalog CLI + templateToArtifact
 * > - infra-architect.md 섹션 3.2: catalog.json schema + 정렬 순서
 * > - nfr-and-data-model.md 2.2: catalog.json schema (공식 기준)
 */

const fs = require('fs');
const path = require('path');

// gray-matter 선택적 의존성
let matter;
try {
  matter = require('gray-matter');
} catch (e) {
  process.stderr.write('[VAIS CatalogBuilder] ❌ gray-matter 미설치 — npm install 실행 후 재시도\n');
  process.exit(1);
}

const { PROJECT_DIR } = require('../lib/paths');
const { atomicWriteSync } = require('../lib/fs-utils');
const { validateTemplateFile } = require('./template-validator');

// ── 정렬 우선순위 상수 ────────────────────────────────────────

/** phase 정렬 순서 */
const PHASE_ORDER = ['core', 'why', 'what', 'how', 'biz', 'alignment'];

/** policy 우선순위 (A→B→C→D 매핑) */
const POLICY_ORDER = ['always', 'scope', 'user-select', 'triggered'];

// ── 변환 함수 ─────────────────────────────────────────────────

/**
 * 단일 template 파일을 catalog artifact 엔트리로 변환.
 *
 * @param {string} filePath   - template 파일 절대 경로
 * @param {string} sectDir    - 섹션 디렉토리명 (core/why/what/how/biz/alignment)
 * @returns {object|null}     - catalog artifact 객체 또는 null (파싱 실패)
 *
 * @see docs/subagent-architecture-rethink/02-design/_tmp/infra-architect.md 섹션 3.2 templateToArtifact
 */
function templateToArtifact(filePath, sectDir) {
  let fm, content;
  try {
    const parsed = matter.read(filePath);
    fm = parsed.data;
    content = parsed.content;
  } catch (e) {
    process.stderr.write(`[VAIS CatalogBuilder] ⚠ 파싱 실패: ${filePath} — ${e.message}\n`);
    return null;
  }

  if (!fm.artifact) {
    // artifact 필드 없으면 template이 아닌 파일로 간주 (스킵)
    return null;
  }

  return {
    id: String(fm.artifact),
    phase: fm.phase || sectDir,
    owner_agent: fm.owner_agent || null,
    canon_source: fm.canon_source || null,
    execution: fm.execution
      ? Object.assign(
          {
            policy: 'user-select',
            scope_conditions: [],
            intent: null,
            alternates: [],
            trigger_events: [],
            prereq: [],
            required_after: [],
            review_recommended: false,
          },
          fm.execution
        )
      : {
          policy: 'user-select',
          scope_conditions: [],
          intent: null,
          alternates: [],
          trigger_events: [],
          prereq: [],
          required_after: [],
          review_recommended: false,
        },
    template_depth: fm.template_depth || 'stub',
    template_path: path.relative(PROJECT_DIR, filePath).replace(/\\/g, '/'),
    project_context_reason: fm.project_context_reason || null,
    review_recommended: fm.review_recommended ?? false,
  };
}

// ── 디렉토리 스캔 ─────────────────────────────────────────────

/**
 * templates/{section}/*.md 파일 목록 수집.
 * 1-depth 하위 디렉토리만 섹션으로 처리 (재귀 X).
 *
 * @param {string} templatesDir  - templates/ 루트 절대 경로
 * @returns {{ filePath: string, sectDir: string }[]}
 */
function scanTemplates(templatesDir) {
  const results = [];

  if (!fs.existsSync(templatesDir)) {
    return results;
  }

  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sectDir = entry.name;
    const sectPath = path.join(templatesDir, sectDir);

    for (const fileEntry of fs.readdirSync(sectPath, { withFileTypes: true })) {
      if (!fileEntry.isFile()) continue;
      if (!fileEntry.name.endsWith('.md')) continue;
      results.push({
        filePath: path.join(sectPath, fileEntry.name),
        sectDir,
      });
    }
  }

  return results;
}

// ── 카탈로그 빌드 ─────────────────────────────────────────────

/**
 * catalog.json 빌드 메인 함수.
 *
 * @param {object} options
 * @param {string}  options.templatesDir  - templates/ 루트 절대 경로
 * @param {string}  options.outputPath    - catalog.json 출력 절대 경로
 * @param {boolean} [options.validate]    - 빌드 전 schema 검증 여부
 * @param {boolean} [options.depthCheck]  - 검증 시 (c) 깊이도 포함
 * @returns {{ total: number, byPhase: object, errors: string[] }}
 */
function buildCatalog(options) {
  const { templatesDir, outputPath, validate = false, depthCheck = false } = options;
  const errors = [];

  // ── 1. --validate: template-validator 일괄 실행 ─────────────
  if (validate) {
    const templateFiles = scanTemplates(templatesDir).map((e) => e.filePath);
    const validationErrors = [];

    for (const filePath of templateFiles) {
      const result = validateTemplateFile(filePath, { depthCheck });
      if (!result.valid) {
        validationErrors.push(...result.errors.map((e) => `${path.relative(PROJECT_DIR, filePath)}: ${e}`));
      }
    }

    if (validationErrors.length > 0) {
      process.stderr.write('[VAIS CatalogBuilder] ❌ 검증 실패 — catalog.json 미생성\n');
      for (const e of validationErrors) {
        process.stderr.write(`  ERROR: ${e}\n`);
      }
      return { total: 0, byPhase: {}, errors: validationErrors };
    }
  }

  // ── 2. 템플릿 스캔 및 artifact 변환 ────────────────────────
  const templateEntries = scanTemplates(templatesDir);
  const artifacts = [];

  for (const { filePath, sectDir } of templateEntries) {
    const artifact = templateToArtifact(filePath, sectDir);
    if (!artifact) {
      // artifact 필드 없는 파일은 스킵 (에러 아님)
      continue;
    }
    // 중복 ID 경고
    if (artifacts.some((a) => a.id === artifact.id)) {
      process.stderr.write(`[VAIS CatalogBuilder] ⚠ 중복 artifact id: "${artifact.id}" (${filePath})\n`);
      errors.push(`중복 artifact id: "${artifact.id}"`);
    }
    artifacts.push(artifact);
  }

  // ── 3. 정렬: phase → policy 우선순위 → id 알파벳 ────────────
  artifacts.sort((a, b) => {
    const phaseA = PHASE_ORDER.indexOf(a.phase);
    const phaseB = PHASE_ORDER.indexOf(b.phase);
    const phaseDiff = (phaseA === -1 ? 99 : phaseA) - (phaseB === -1 ? 99 : phaseB);
    if (phaseDiff !== 0) return phaseDiff;

    const policyA = POLICY_ORDER.indexOf(a.execution?.policy);
    const policyB = POLICY_ORDER.indexOf(b.execution?.policy);
    const policyDiff = (policyA === -1 ? 99 : policyA) - (policyB === -1 ? 99 : policyB);
    if (policyDiff !== 0) return policyDiff;

    return a.id.localeCompare(b.id);
  });

  // ── 4. 인덱스 빌드 ──────────────────────────────────────────

  // by_phase: phase → artifact id[]
  const byPhase = {};
  for (const artifact of artifacts) {
    const p = artifact.phase;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push(artifact.id);
  }

  // by_policy: policy → artifact id[]
  const byPolicy = { always: [], scope: [], 'user-select': [], triggered: [] };
  for (const artifact of artifacts) {
    const policy = artifact.execution?.policy || 'user-select';
    if (!byPolicy[policy]) byPolicy[policy] = [];
    byPolicy[policy].push(artifact.id);
  }

  // by_intent: intent → artifact id[]
  const byIntent = {};
  for (const artifact of artifacts) {
    const intent = artifact.execution?.intent;
    if (!intent) continue;
    if (!byIntent[intent]) byIntent[intent] = [];
    byIntent[intent].push(artifact.id);
  }

  // policy_distribution
  const policyDistribution = {
    always: byPolicy.always.length,
    scope: byPolicy.scope.length,
    'user-select': byPolicy['user-select'].length,
    triggered: byPolicy.triggered.length,
  };

  // ── 5. catalog.json 생성 ─────────────────────────────────────
  const catalog = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    total_artifacts: artifacts.length,
    policy_distribution: policyDistribution,
    artifacts,
    by_phase: byPhase,
    by_policy: byPolicy,
    by_intent: byIntent,
  };

  // 출력 디렉토리 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  atomicWriteSync(outputPath, JSON.stringify(catalog, null, 2));

  return { total: artifacts.length, byPhase, errors };
}

// ── CLI 진입점 ────────────────────────────────────────────────

/**
 * CLI main 함수.
 *
 * @param {string[]} argv  - process.argv.slice(2)
 * @returns {number}       - exit code (0/1/2)
 */
function main(argv) {
  const args = argv.slice(0);
  const validate = args.includes('--validate');
  const depthCheck = args.includes('--depth-check');

  // --templates-dir 옵션 파싱
  let templatesDir = path.join(PROJECT_DIR, 'templates');
  const templatesIdx = args.indexOf('--templates-dir');
  if (templatesIdx >= 0 && args[templatesIdx + 1]) {
    const rawDir = args[templatesIdx + 1];
    templatesDir = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);
  }

  // --output 옵션 파싱
  let outputPath = path.join(PROJECT_DIR, 'catalog.json');
  const outputIdx = args.indexOf('--output');
  if (outputIdx >= 0 && args[outputIdx + 1]) {
    const rawOut = args[outputIdx + 1];
    outputPath = path.isAbsolute(rawOut) ? rawOut : path.resolve(process.cwd(), rawOut);
  }

  process.stdout.write(`[VAIS CatalogBuilder] templates 디렉토리: ${templatesDir}\n`);
  process.stdout.write(`[VAIS CatalogBuilder] 출력: ${outputPath}\n`);
  if (validate) {
    process.stdout.write('[VAIS CatalogBuilder] --validate 모드: 검증 후 빌드\n');
  }

  const result = buildCatalog({ templatesDir, outputPath, validate, depthCheck });

  if (result.errors.length > 0) {
    // --validate 실패 시 이미 stderr에 출력됨
    if (validate) return 2;
    return 1;
  }

  if (result.total === 0) {
    process.stdout.write('[VAIS CatalogBuilder] ⚠ templates/ 에 artifact 없음 (catalog.json 빈 상태로 생성됨)\n');
  } else {
    process.stdout.write(`[VAIS CatalogBuilder] ✅ catalog.json 생성 완료 — ${result.total}개 artifact\n`);
    // phase별 요약
    for (const [phase, ids] of Object.entries(result.byPhase)) {
      process.stdout.write(`  ${phase}: ${ids.length}개\n`);
    }
  }

  return 0;
}

// ── 모듈 export ───────────────────────────────────────────────

module.exports = {
  templateToArtifact,
  buildCatalog,
  scanTemplates,
  PHASE_ORDER,
  POLICY_ORDER,
};

// ── CLI 실행 ──────────────────────────────────────────────────

if (require.main === module) {
  const code = main(process.argv.slice(2));
  process.exit(code);
}
