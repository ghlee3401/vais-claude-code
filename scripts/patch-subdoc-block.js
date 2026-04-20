#!/usr/bin/env node
/**
 * v0.57.0 Sub-doc Preservation — sub-agent 본문에 subdoc-guard 블록 일괄 삽입.
 *
 * 배경: Claude Code sub-agent 런타임이 frontmatter `includes:` 를 처리하지 않아
 *       `_shared/subdoc-guard.md` 의 규칙이 agent context 에 로드되지 않음.
 *       (v057 Batch A smoke test 로 확인 — 2026-04-19)
 *
 * v0.58 TD-5: 공통 로직을 `lib/patch-block.js` 로 추출. 본 스크립트는 thin wrapper.
 *
 * Usage:
 *   node scripts/patch-subdoc-block.js                # 실제 적용
 *   node scripts/patch-subdoc-block.js --dry-run      # 미리보기만
 *   node scripts/patch-subdoc-block.js --verbose      # 파일별 상세 출력
 *
 * 제외 대상:
 *   - agents/_shared/*.md                              (공유 가드, agent 아님)
 *   - agents/{c-level}/{c-level}.md (6개)              (C-Level, clevel-main-guard 대상)
 *   - agents/ceo/absorb-analyzer.md                    (meta, feature-scope 아님)
 *   - agents/ceo/skill-creator.md                      (meta)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { applyBlockPatch, parseCliFlags } = require('../lib/patch-block');

const AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const SOURCE_PATH = path.join(AGENTS_DIR, '_shared', 'subdoc-guard.md');
const C_LEVELS = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
const EXCLUDED_SUBAGENTS = new Set([
  'ceo/absorb-analyzer.md',
  'ceo/skill-creator.md',
]);

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

if (require.main === module) {
  try {
    applyBlockPatch({
      name: 'subdoc-guard',
      sourcePath: SOURCE_PATH,
      targets: listTargetAgents(),
      targetsLabel: 'sub-agents (C-Level 및 meta 제외)',
      scriptName: 'patch-subdoc-block.js',
      flags: parseCliFlags(process.argv),
    });
    process.exit(0);
  } catch (e) {
    process.stderr.write(`[ERROR] ${e.message}\n`);
    process.exit(1);
  }
}

module.exports = { listTargetAgents };
