#!/usr/bin/env node
/**
 * refactor-audit.js — C-Level agent refactor keyword preservation audit
 *
 * @see docs/_legacy/01-plan/cto_refactor-clevel-agents.plan.md §4.3
 * @see docs/_legacy/02-design/cto_refactor-clevel-agents.design.md §2
 *
 * Verifies that refactoring agents/{c}/{c}.md files does not lose any
 * mandatory rule keywords, CP IDs, section headers, or phrases.
 *
 * Usage:
 *   node scripts/refactor-audit.js --init                   # Generate baseline from HEAD
 *   node scripts/refactor-audit.js --all                    # Audit all 7 files vs baseline
 *   node scripts/refactor-audit.js --file agents/ceo/ceo.md # Audit single file
 *   node scripts/refactor-audit.js --targets                # Print targets and exit
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_BASELINE = path.join(
  REPO_ROOT,
  'docs/_legacy/03-do/ceo_refactor-clevel-agents.baseline.json'
);

const TARGET_FILES = [
  'agents/ceo/ceo.md',
  'agents/cpo/cpo.md',
  'agents/cto/cto.md',
  'agents/cso/cso.md',
  'agents/cmo/cmo.md',
  'agents/coo/coo.md',
  'agents/cfo/cfo.md',
];

const TARGETS = {
  'agents/ceo/ceo.md': 480,
  'agents/cpo/cpo.md': 300,
  'agents/cto/cto.md': 490,
  'agents/cso/cso.md': 400,
  'agents/cmo/cmo.md': 360,
  'agents/coo/coo.md': 295,
  'agents/cfo/cfo.md': 320,
};

const WHITELIST = {
  // NOTE: "절대금지" (no space) was removed — baseline count is always 0 across all files
  // and adds no protection. The real variant is "절대 금지" (with space).
  keywords: [
    'AskUserQuestion',
    '반드시',
    '절대 금지',
    'Plan 단계 범위',
    '필수 문서',
    '체크포인트',
    'SubagentStop',
  ],
  mandatorySections: [
    '## 🚨 최우선 규칙',
    '### 단계별 실행 모드',
    '### ⛔ Plan 단계 범위 제한',
    '### 필수 문서',
    '## Role',
    '## ⛔ 체크포인트 기반 멈춤 규칙',
    '## Contract',
    '## Checkpoint',
    '## Context Load',
    '## ⛔ 종료 전 필수 문서 체크리스트',
    '## 작업 원칙',
  ],
  mandatoryPhrases: [
    'AskUserQuestion 도구를 호출',
    '즉시 자동 실행',
    '사용자 선택 = 실행 승인',
    '자동 연쇄 진행하지 않',
  ],
  // File-specific extras (SC-11: CSO gate-check.js:179 regex match)
  fileSpecificPhrases: {
    'agents/cso/cso.md': ['## 배포 승인 여부'],
  },
};

// ---------- CLI parsing ----------

function parseArgs(argv) {
  const args = { mode: null, file: null, baseline: DEFAULT_BASELINE };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--init') args.mode = 'init';
    else if (a === '--all') args.mode = 'all';
    else if (a === '--targets') args.mode = 'targets';
    else if (a === '--file') {
      args.mode = 'file';
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('[refactor-audit] --file requires a path argument');
        args.mode = 'error';
      } else {
        args.file = next;
        i++;
      }
    } else if (a === '--baseline') {
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('[refactor-audit] --baseline requires a path argument');
        args.mode = 'error';
      } else {
        args.baseline = next;
        i++;
      }
    }
    else if (a === '--help' || a === '-h') args.mode = 'help';
    else {
      console.error(`Unknown arg: ${a}`);
      args.mode = 'error';
    }
  }
  if (!args.mode) args.mode = 'all';
  return args;
}

// ---------- Metrics collection ----------

function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) return { frontmatter: '', body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: content };
  return {
    frontmatter: content.slice(0, end + 5),
    body: content.slice(end + 5),
  };
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

function extractCpIds(body) {
  // Match CP-{uppercase/digits} followed by word boundary (not followed by lowercase letter)
  // Avoids false positives like "CP-Check" matching "CP-C"
  const matches = body.match(/CP-[A-Z0-9]+(?![a-z])/g) || [];
  return Array.from(new Set(matches)).sort();
}

function extractSectionHeaders(body) {
  const lines = body.split('\n');
  const headers = [];
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) headers.push(line.trim());
  }
  return headers;
}

function collectMetrics(absPath, fromHead = false) {
  let content;
  if (fromHead) {
    const rel = path.relative(REPO_ROOT, absPath);
    try {
      // Use execFileSync with array args to avoid any shell interpolation risk
      content = execFileSync('git', ['show', `HEAD:${rel}`], {
        cwd: REPO_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      }).toString();
    } catch (e) {
      console.error(`[refactor-audit] git show HEAD:${rel} failed: ${e.message}`);
      process.exit(2);
    }
  } else {
    try {
      content = fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      console.error(`[refactor-audit] read ${absPath} failed: ${e.message}`);
      process.exit(2);
    }
  }
  const { frontmatter, body } = splitFrontmatter(content);
  const lines = body.split('\n').length;
  const keywordCounts = {};
  for (const k of WHITELIST.keywords) {
    keywordCounts[k] = countOccurrences(body, k);
  }
  const phraseCounts = {};
  for (const p of WHITELIST.mandatoryPhrases) {
    phraseCounts[p] = countOccurrences(body, p);
  }
  return {
    lines,
    frontmatter_sha256: sha256(frontmatter),
    cp_ids: extractCpIds(body),
    keyword_counts: keywordCounts,
    section_headers: extractSectionHeaders(body),
    mandatory_phrase_counts: phraseCounts,
  };
}

// ---------- Baseline I/O ----------

function getHeadSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function writeBaseline(baselinePath) {
  const files = {};
  for (const rel of TARGET_FILES) {
    const abs = path.join(REPO_ROOT, rel);
    // Always read baseline from HEAD commit, not working tree
    files[rel] = collectMetrics(abs, true);
  }
  const data = {
    generated_at: new Date().toISOString(),
    git_sha: getHeadSha(),
    targets: TARGETS,
    whitelist: WHITELIST,
    files,
  };
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`[refactor-audit] Baseline written: ${baselinePath}`);
  console.log(`[refactor-audit] Git SHA: ${data.git_sha}`);
  console.log(`[refactor-audit] Files: ${TARGET_FILES.length}`);
}

function readBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) {
    console.error(`[refactor-audit] Baseline not found: ${baselinePath}`);
    console.error(`[refactor-audit] Run --init first.`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

// ---------- Comparison ----------

function compareFile(relPath, current, baseline, targets) {
  const checks = [];
  const target = targets[relPath];
  const errors = [];

  // 1. Lines ≤ target
  if (target != null) {
    const ok = current.lines <= target;
    checks.push({
      name: 'lines',
      ok,
      detail: `${current.lines} ${ok ? '≤' : '>'} ${target}`,
    });
    if (!ok) errors.push(`lines ${current.lines} > target ${target}`);
  }

  // 2. Frontmatter sha256 unchanged
  {
    const ok = current.frontmatter_sha256 === baseline.frontmatter_sha256;
    checks.push({
      name: 'frontmatter',
      ok,
      detail: ok ? 'sha256 unchanged' : 'sha256 CHANGED',
    });
    if (!ok) errors.push('frontmatter sha256 changed');
  }

  // 3. CP IDs: baseline ⊆ current
  {
    const baseSet = new Set(baseline.cp_ids);
    const curSet = new Set(current.cp_ids);
    const missing = [...baseSet].filter((x) => !curSet.has(x));
    const ok = missing.length === 0;
    checks.push({
      name: 'CP IDs',
      ok,
      detail: `${baseline.cp_ids.length - missing.length}/${baseline.cp_ids.length} preserved${missing.length ? ` — MISSING: ${missing.join(' ')}` : ''}`,
    });
    if (!ok) errors.push(`missing CP IDs: ${missing.join(', ')}`);
  }

  // 4. Keywords: current[k] ≥ baseline[k]
  {
    const fails = [];
    for (const k of Object.keys(baseline.keyword_counts)) {
      const cur = current.keyword_counts[k] || 0;
      const base = baseline.keyword_counts[k] || 0;
      if (cur < base) fails.push(`${k}: ${cur} < ${base}`);
    }
    const ok = fails.length === 0;
    const total = Object.keys(baseline.keyword_counts).length;
    checks.push({
      name: 'keywords',
      ok,
      detail: ok
        ? `${total}/${total} ≥ baseline`
        : `${total - fails.length}/${total} — ${fails.join(', ')}`,
    });
    if (!ok) errors.push(`keyword counts decreased: ${fails.join('; ')}`);
  }

  // 5. Mandatory sections: baseline set ⊆ current
  {
    // Baseline's mandatory sections = intersection of configured list and baseline headers
    const baselineSet = new Set(baseline.section_headers);
    const currentSet = new Set(current.section_headers);
    const mandatoryInBaseline = WHITELIST.mandatorySections.filter((h) =>
      [...baselineSet].some((b) => b.startsWith(h))
    );
    const missing = mandatoryInBaseline.filter(
      (h) => ![...currentSet].some((c) => c.startsWith(h))
    );
    const ok = missing.length === 0;
    checks.push({
      name: 'sections',
      ok,
      detail: `${mandatoryInBaseline.length - missing.length}/${mandatoryInBaseline.length} mandatory preserved${missing.length ? ` — MISSING: ${missing.join(', ')}` : ''}`,
    });
    if (!ok) errors.push(`missing mandatory sections: ${missing.join(', ')}`);
  }

  // 6. Mandatory phrases ≥ baseline
  {
    const fails = [];
    for (const p of WHITELIST.mandatoryPhrases) {
      const cur = current.mandatory_phrase_counts[p] || 0;
      const base = (baseline.mandatory_phrase_counts || {})[p] || 0;
      if (cur < base) fails.push(`"${p}": ${cur} < ${base}`);
    }
    const ok = fails.length === 0;
    const total = WHITELIST.mandatoryPhrases.length;
    checks.push({
      name: 'phrases',
      ok,
      detail: ok
        ? `${total}/${total} present`
        : `${total - fails.length}/${total} — ${fails.join(', ')}`,
    });
    if (!ok) errors.push(`mandatory phrases missing: ${fails.join('; ')}`);
  }

  // 7. File-specific phrases (e.g., CSO "배포 승인 여부")
  {
    const fileExtras = WHITELIST.fileSpecificPhrases[relPath] || [];
    if (fileExtras.length > 0) {
      const fails = [];
      const bodyHeaders = new Set(current.section_headers);
      for (const phrase of fileExtras) {
        const found = [...bodyHeaders].some((h) => h === phrase);
        if (!found) fails.push(phrase);
      }
      const ok = fails.length === 0;
      checks.push({
        name: 'file-specific',
        ok,
        detail: ok
          ? `${fileExtras.length}/${fileExtras.length} preserved`
          : `MISSING: ${fails.join(', ')}`,
      });
      if (!ok) errors.push(`file-specific missing: ${fails.join(', ')}`);
    }
  }

  return { pass: errors.length === 0, checks, errors };
}

// ---------- Reporter ----------

function reportFile(relPath, result) {
  console.log(`[refactor-audit] ${relPath}`);
  for (const c of result.checks) {
    const sym = c.ok ? '✓' : '✗';
    console.log(`  ${sym} ${c.name.padEnd(15)} ${c.detail}`);
  }
  console.log(`  RESULT: ${result.pass ? 'PASS' : 'FAIL'}`);
  console.log('');
}

// ---------- Main ----------

function main() {
  const args = parseArgs(process.argv);

  if (args.mode === 'help' || args.mode === 'error') {
    console.log(
      'Usage: node scripts/refactor-audit.js [--init|--all|--file <path>|--targets] [--baseline <path>]'
    );
    process.exit(args.mode === 'error' ? 2 : 0);
  }

  if (args.mode === 'targets') {
    console.log(JSON.stringify(TARGETS, null, 2));
    process.exit(0);
  }

  if (args.mode === 'init') {
    writeBaseline(args.baseline);
    process.exit(0);
  }

  const baseline = readBaseline(args.baseline);
  const targets = baseline.targets || TARGETS;

  const filesToCheck =
    args.mode === 'file' ? [args.file] : TARGET_FILES;

  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const rel of filesToCheck) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`[refactor-audit] File not found: ${rel}`);
      fail++;
      failures.push(rel);
      continue;
    }
    const current = collectMetrics(abs);
    const baselineForFile = (baseline.files || {})[rel];
    if (!baselineForFile) {
      console.error(`[refactor-audit] No baseline entry for ${rel}`);
      fail++;
      failures.push(rel);
      continue;
    }
    const result = compareFile(rel, current, baselineForFile, targets);
    reportFile(rel, result);
    if (result.pass) pass++;
    else {
      fail++;
      failures.push(rel);
    }
  }

  console.log(
    `[refactor-audit] Summary: ${pass} PASS / ${fail} FAIL (total ${filesToCheck.length})`
  );
  process.exit(fail === 0 ? 0 : 1);
}

main();
