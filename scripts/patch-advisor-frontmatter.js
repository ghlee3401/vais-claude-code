#!/usr/bin/env node
/**
 * 모든 Sonnet sub-agent frontmatter에 advisor + includes 필드 일괄 추가.
 * 멱등: 이미 존재하면 스킵.
 *
 * Usage: node scripts/patch-advisor-frontmatter.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const C_LEVELS = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
const ADVISOR_BLOCK = `advisor:
  enabled: true
  model: claude-opus-4-6
  max_uses: 3
  caching: { type: ephemeral, ttl: 5m }`;
const INCLUDES_LINE = `includes:
  - _shared/advisor-guard.md`;

const dryRun = process.argv.includes('--dry-run');
let patched = 0;
let skipped = 0;

for (const cl of C_LEVELS) {
  const dir = path.join(AGENTS_DIR, cl);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== `${cl}.md`);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 이미 advisor 필드 있으면 스킵 (멱등)
    if (content.includes('advisor:') && content.includes('_shared/advisor-guard.md')) {
      skipped++;
      continue;
    }

    // frontmatter 끝 (두 번째 ---) 찾기
    const match = content.match(/^(---\r?\n[\s\S]*?\r?\n)(---\r?\n)/);
    if (!match) {
      process.stderr.write(`[SKIP] No frontmatter: ${file}\n`);
      skipped++;
      continue;
    }

    let fm = match[1];
    const rest = content.slice(match[0].length);

    // advisor 필드 추가 (없을 때만)
    if (!fm.includes('advisor:')) {
      fm += ADVISOR_BLOCK + '\n';
    }
    // includes 필드 추가 (없을 때만)
    if (!fm.includes('includes:')) {
      fm += INCLUDES_LINE + '\n';
    } else if (!fm.includes('_shared/advisor-guard.md')) {
      // includes 있지만 advisor-guard 없으면 추가
      fm = fm.replace(/(includes:\s*\n)/, `$1  - _shared/advisor-guard.md\n`);
    }

    const newContent = fm + '---\n' + rest;

    if (dryRun) {
      process.stdout.write(`[DRY] Would patch: ${cl}/${file}\n`);
    } else {
      fs.writeFileSync(filePath, newContent);
    }
    patched++;
  }
}

process.stdout.write(`\n[VAIS] Advisor frontmatter patch: ${patched} patched, ${skipped} skipped${dryRun ? ' (DRY RUN)' : ''}\n`);
