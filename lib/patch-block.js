/**
 * VAIS Code v0.58 - Shared body-block injection helper.
 *
 * `scripts/patch-subdoc-block.js` (v0.57) 과 `scripts/patch-clevel-guard.js` (v0.58) 의
 * 공통 로직(canonical .md 본문을 agent .md 에 블록 주입, idempotent, 버전 기반 skip/update).
 *
 * `patch-advisor-frontmatter.js` 는 frontmatter 변경이라 다른 종류 — 본 헬퍼 범위 밖.
 *
 * Usage:
 *   const { applyBlockPatch } = require('../lib/patch-block');
 *   applyBlockPatch({
 *     name: 'clevel-main-guard',              // marker name (regex + HTML comment 용)
 *     sourcePath: 'agents/_shared/clevel-main-guard.md',
 *     targets: ['agents/ceo/ceo.md', ...],    // 대상 파일 절대 경로 배열
 *     targetsLabel: '6 C-Level',              // 요약 메시지용 라벨
 *     scriptName: 'patch-clevel-guard.js',    // 요약 메시지용
 *     flags: { dryRun, verbose },
 *   });
 */
'use strict';

const fs = require('fs');
const path = require('path');

function buildMarkerRegex(name) {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`<!--\\s*${escaped} version:\\s*v[\\d.]+\\s*-->`);
}

function buildBlockHeader(name, scriptName, sourceRelPath) {
  return `\n\n---\n\n<!-- vais:${name}:begin — injected by scripts/${scriptName}. Do not edit inline; update ${sourceRelPath} and re-run the script. -->\n`;
}

function buildBlockFooter(name) {
  return `\n<!-- vais:${name}:end -->\n`;
}

function buildBlockBoundaryRegex(name) {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`\\n*---\\n\\n<!-- vais:${escaped}:begin[\\s\\S]*?<!-- vais:${escaped}:end -->\\n?`);
}

function loadBlock(sourcePath, name) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source not found: ${sourcePath}`);
  }
  const raw = fs.readFileSync(sourcePath, 'utf8').trim();
  const versionRe = buildMarkerRegex(name);
  if (!versionRe.test(raw)) {
    throw new Error(`Source ${sourcePath} missing version marker (<!-- ${name} version: vX.Y.Z -->)`);
  }
  return raw;
}

function getVersionFromContent(content, name) {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const m = content.match(new RegExp(`<!--\\s*${escaped} version:\\s*(v[\\d.]+)\\s*-->`));
  return m ? m[1] : null;
}

function patchFile(filePath, block, options) {
  const { name, scriptName, sourcePath, dryRun } = options;
  const original = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(path.resolve(__dirname, '..'), filePath);

  const markerRe = buildMarkerRegex(name);
  const boundaryRe = buildBlockBoundaryRegex(name);
  const sourceRelPath = path.relative(path.resolve(__dirname, '..'), sourcePath);
  const blockHeader = buildBlockHeader(name, scriptName, sourceRelPath);
  const blockFooter = buildBlockFooter(name);

  if (markerRe.test(original)) {
    const sourceVersion = getVersionFromContent(block, name);
    const existingVersion = getVersionFromContent(original, name);

    if (sourceVersion === existingVersion) {
      return { status: 'skip-same-version', rel, version: existingVersion };
    }

    const replaced = original.replace(boundaryRe, blockHeader + block + blockFooter);
    if (replaced === original) {
      return { status: 'warn-unmanaged-marker', rel };
    }
    if (!dryRun) fs.writeFileSync(filePath, replaced, 'utf8');
    return { status: 'updated', rel, from: existingVersion, to: sourceVersion };
  }

  // 신규 삽입
  const trimmed = original.replace(/\s+$/, '');
  const patched = trimmed + blockHeader + block + blockFooter;
  if (!dryRun) fs.writeFileSync(filePath, patched, 'utf8');
  return { status: 'inserted', rel, added: block.split('\n').length + 4 };
}

function applyBlockPatch(config) {
  const {
    name,
    sourcePath,
    targets,
    targetsLabel = `${targets.length} files`,
    scriptName,
    flags = {},
  } = config;

  if (!name) throw new Error('applyBlockPatch: name required');
  if (!sourcePath) throw new Error('applyBlockPatch: sourcePath required');
  if (!Array.isArray(targets)) throw new Error('applyBlockPatch: targets must be array');
  if (!scriptName) throw new Error('applyBlockPatch: scriptName required');

  const { dryRun = false, verbose = false } = flags;
  const block = loadBlock(sourcePath, name);

  const results = { inserted: [], updated: [], skipped: [], warned: [] };
  for (const t of targets) {
    const r = patchFile(t, block, { name, scriptName, sourcePath, dryRun });
    if (r.status === 'inserted') results.inserted.push(r);
    else if (r.status === 'updated') results.updated.push(r);
    else if (r.status === 'skip-same-version') results.skipped.push(r);
    else if (r.status === 'warn-unmanaged-marker') results.warned.push(r);
    if (verbose) process.stdout.write(`[${r.status}] ${r.rel}\n`);
  }

  const mode = dryRun ? '[DRY RUN] ' : '';
  process.stdout.write(`\n${mode}${scriptName} summary:\n`);
  process.stdout.write(`  총 대상: ${targets.length} 파일 (${targetsLabel})\n`);
  process.stdout.write(`  신규 삽입: ${results.inserted.length}\n`);
  process.stdout.write(`  버전 교체: ${results.updated.length}\n`);
  process.stdout.write(`  동일 버전 스킵: ${results.skipped.length}\n`);
  process.stdout.write(`  경고 (수동 확인 필요): ${results.warned.length}\n`);

  if (results.warned.length > 0) {
    process.stderr.write('\n경고 대상 (구형 마커, 수동 정리 필요):\n');
    for (const w of results.warned) process.stderr.write(`  - ${w.rel}\n`);
  }

  return { results, targetCount: targets.length };
}

function parseCliFlags(argv) {
  const flags = new Set(argv.slice(2));
  return {
    dryRun: flags.has('--dry-run'),
    verbose: flags.has('--verbose'),
  };
}

module.exports = {
  applyBlockPatch,
  loadBlock,
  patchFile,
  parseCliFlags,
  buildMarkerRegex,
  getVersionFromContent,
};
