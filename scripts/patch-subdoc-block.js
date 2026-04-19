#!/usr/bin/env node
/**
 * v0.57.0 Sub-doc Preservation — sub-agent 본문에 subdoc-guard 블록 일괄 삽입.
 *
 * 배경: Claude Code sub-agent 런타임이 frontmatter `includes:` 를 처리하지 않아,
 *       `_shared/subdoc-guard.md` 의 규칙이 agent context 에 로드되지 않음.
 *       (v057 Batch A smoke test 로 확인 — 2026-04-19)
 *
 * 해결: `_shared/subdoc-guard.md` 의 본문을 각 sub-agent `.md` 파일 본문 하단에
 *       직접 복붙. 마커(`<!-- subdoc-guard version: vX.Y.Z -->`) 로 멱등성 보장.
 *
 * Usage:
 *   node scripts/patch-subdoc-block.js                # 실제 적용
 *   node scripts/patch-subdoc-block.js --dry-run      # 미리보기만
 *   node scripts/patch-subdoc-block.js --verbose      # 파일별 상세 출력
 *
 * 제외 대상:
 *   - agents/_shared/*.md                              (공유 가드, agent 아님)
 *   - agents/{c-level}/{c-level}.md (6개)              (C-Level, 자체 main.md 작성)
 *   - agents/ceo/absorb-analyzer.md                    (meta, feature-scope 아님)
 *   - agents/ceo/skill-creator.md                      (meta)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const SOURCE_PATH = path.join(AGENTS_DIR, '_shared', 'subdoc-guard.md');
const C_LEVELS = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
const EXCLUDED_SUBAGENTS = new Set([
  'ceo/absorb-analyzer.md',
  'ceo/skill-creator.md',
]);

const BLOCK_MARKER_RE = /<!--\s*subdoc-guard version:\s*v[\d.]+\s*-->/;
const BLOCK_HEADER = '\n\n---\n\n<!-- vais:subdoc-guard:begin — injected by scripts/patch-subdoc-block.js. Do not edit inline; update agents/_shared/subdoc-guard.md and re-run the script. -->\n';
const BLOCK_FOOTER = '\n<!-- vais:subdoc-guard:end -->\n';

const flags = new Set(process.argv.slice(2));
const dryRun = flags.has('--dry-run');
const verbose = flags.has('--verbose');

function listTargetAgents() {
  const targets = [];
  for (const cl of C_LEVELS) {
    const dir = path.join(AGENTS_DIR, cl);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      if (f === `${cl}.md`) continue; // C-Level 제외
      const rel = `${cl}/${f}`;
      if (EXCLUDED_SUBAGENTS.has(rel)) continue;
      targets.push(path.join(dir, f));
    }
  }
  return targets.sort();
}

function loadBlock() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`Source not found: ${SOURCE_PATH}`);
  }
  const raw = fs.readFileSync(SOURCE_PATH, 'utf8').trim();
  if (!BLOCK_MARKER_RE.test(raw)) {
    throw new Error(`Source ${SOURCE_PATH} missing version marker (<!-- subdoc-guard version: vX.Y.Z -->)`);
  }
  return raw;
}

function patchFile(filePath, block) {
  const original = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(AGENTS_DIR, filePath);

  // 멱등: 이미 블록 마커가 있으면 skip (또는 버전 업데이트)
  if (BLOCK_MARKER_RE.test(original)) {
    // 기존 블록 버전과 source 버전 비교 → 다르면 교체
    const sourceVersion = (block.match(/<!--\s*subdoc-guard version:\s*(v[\d.]+)\s*-->/) || [])[1];
    const existingVersion = (original.match(/<!--\s*subdoc-guard version:\s*(v[\d.]+)\s*-->/) || [])[1];

    if (sourceVersion === existingVersion) {
      return { status: 'skip-same-version', rel, version: existingVersion };
    }

    // 교체 모드: begin~end 블록 치환
    const replaced = original.replace(
      /\n*---\n\n<!-- vais:subdoc-guard:begin[\s\S]*?<!-- vais:subdoc-guard:end -->\n?/,
      BLOCK_HEADER + block + BLOCK_FOOTER
    );
    if (replaced === original) {
      // begin~end 마커가 없는 이전 포맷 → 블록만 덮어쓰기 어려움, warn
      return { status: 'warn-unmanaged-marker', rel };
    }
    if (!dryRun) fs.writeFileSync(filePath, replaced, 'utf8');
    return { status: 'updated', rel, from: existingVersion, to: sourceVersion };
  }

  // 신규 삽입: 파일 끝에 블록 추가
  const trimmed = original.replace(/\s+$/, '');
  const patched = trimmed + BLOCK_HEADER + block + BLOCK_FOOTER;
  if (!dryRun) fs.writeFileSync(filePath, patched, 'utf8');
  return { status: 'inserted', rel, added: block.split('\n').length + 4 };
}

function main() {
  const block = loadBlock();
  const targets = listTargetAgents();

  const results = { inserted: [], updated: [], skipped: [], warned: [] };
  for (const t of targets) {
    const r = patchFile(t, block);
    if (r.status === 'inserted') results.inserted.push(r);
    else if (r.status === 'updated') results.updated.push(r);
    else if (r.status === 'skip-same-version') results.skipped.push(r);
    else if (r.status === 'warn-unmanaged-marker') results.warned.push(r);
    if (verbose) process.stdout.write(`[${r.status}] ${r.rel}\n`);
  }

  const mode = dryRun ? '[DRY RUN] ' : '';
  process.stdout.write(`\n${mode}patch-subdoc-block summary:\n`);
  process.stdout.write(`  총 대상: ${targets.length} 파일\n`);
  process.stdout.write(`  신규 삽입: ${results.inserted.length}\n`);
  process.stdout.write(`  버전 교체: ${results.updated.length}\n`);
  process.stdout.write(`  동일 버전 스킵: ${results.skipped.length}\n`);
  process.stdout.write(`  경고 (수동 확인 필요): ${results.warned.length}\n`);

  if (results.warned.length > 0) {
    process.stderr.write('\n경고 대상 (구형 마커, 수동 정리 필요):\n');
    for (const w of results.warned) process.stderr.write(`  - ${w.rel}\n`);
  }

  process.exit(0);
}

if (require.main === module) {
  try { main(); }
  catch (e) { process.stderr.write(`[ERROR] ${e.message}\n`); process.exit(1); }
}

module.exports = { listTargetAgents, loadBlock, patchFile };
