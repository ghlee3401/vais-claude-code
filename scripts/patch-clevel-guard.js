#!/usr/bin/env node
/**
 * v0.58.0 C-Level Coexistence — 6 C-Level agent .md 본문에 clevel-main-guard 블록 주입.
 *
 * v0.58 TD-5: 공통 로직을 `lib/patch-block.js` 로 추출. 본 스크립트는 thin wrapper.
 *
 * Usage:
 *   node scripts/patch-clevel-guard.js                # 실제 적용
 *   node scripts/patch-clevel-guard.js --dry-run      # 미리보기만
 *   node scripts/patch-clevel-guard.js --verbose      # 파일별 상세 출력
 *
 * 대상: agents/{ceo,cpo,cto,cso,cbo,coo}/{role}.md (6 파일)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { applyBlockPatch, parseCliFlags } = require('../lib/patch-block');

const AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const SOURCE_PATH = path.join(AGENTS_DIR, '_shared', 'clevel-main-guard.md');
const C_LEVELS = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];

function listTargetAgents() {
  const targets = [];
  for (const cl of C_LEVELS) {
    const file = path.join(AGENTS_DIR, cl, `${cl}.md`);
    if (fs.existsSync(file)) targets.push(file);
  }
  return targets;
}

if (require.main === module) {
  try {
    applyBlockPatch({
      name: 'clevel-main-guard',
      sourcePath: SOURCE_PATH,
      targets: listTargetAgents(),
      targetsLabel: '6 C-Level',
      scriptName: 'patch-clevel-guard.js',
      flags: parseCliFlags(process.argv),
    });
    process.exit(0);
  } catch (e) {
    process.stderr.write(`[ERROR] ${e.message}\n`);
    process.exit(1);
  }
}

module.exports = { listTargetAgents };
