#!/usr/bin/env node
'use strict';

// SessionStart briefing (docs/harness/design.md §6): one paragraph built only from
// work-items.json, chain-index.json, and the ledger (lib/workflow/v2/briefing.js). No model
// call, no guessing — when there is no state the briefing says so.

const { readStdin, outputSessionContext, outputEmpty } = require('../lib/io');
const { buildBriefing, lastEventOf } = require('../lib/workflow/v2/briefing');
const { resolveProjectRoot, resolveStartDir, resolveMode, warningLine } = require('./v2-project-context');

const INACTIVE_LINE = '[VAIS · 하네스 비활성]';

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot) return outputEmpty();
  const resolved = resolveMode(projectRoot);
  if (resolved.mode === 'off') {
    return outputSessionContext([INACTIVE_LINE, warningLine(resolved) || '⚠ VAIS 하네스 경고: 하네스가 꺼져 있다'].join('\n'));
  }
  if (resolved.mode === 'disabled') return outputEmpty();
  const warning = warningLine(resolved);
  const briefing = buildBriefing(projectRoot);
  return outputSessionContext(warning ? `${warning}\n${briefing}` : briefing);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    outputSessionContext(`⚠ VAIS 하네스 경고: 세션 브리핑 실패 — ${String(error?.message || error).slice(0, 300)}. \`/vais doctor\` 로 확인한다.`);
  }
}

module.exports = { INACTIVE_LINE, buildBriefing, lastEventOf, main };
