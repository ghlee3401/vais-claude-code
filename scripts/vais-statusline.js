#!/usr/bin/env node
'use strict';

// Claude Code statusline (docs/harness/design.md §6): one line the model cannot forget to
// show. Reads the same three runtime files as the briefing. Install: settings.json >
// statusLine = { "type": "command", "command": "node <plugin-root>/scripts/vais-statusline.js" }.

const path = require('path');
const { readStdin } = require('../lib/io');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { propose } = require('../lib/workflow/v2/proposal');
const { resolveProjectRoot, resolveMode } = require('../hooks/v2-project-context');

function statusLineText(projectRoot, env = process.env) {
  if (!projectRoot) return 'VAIS · 프로젝트 아님';
  const resolved = resolveMode(projectRoot, env);
  if (resolved.mode === 'off') return 'VAIS · 하네스 비활성 (VAIS_HARNESS_OFF)';
  if (resolved.mode === 'disabled') return 'VAIS · 하네스 비활성 (disabled)';
  const store = new WorkItemStore(projectRoot);
  const item = store.getCurrent();
  const next = propose(projectRoot, { registry: store.readRegistry() })[0];
  const action = next ? next.command : '—';
  const warning = resolved.warning ? ' · ⚠ 설정 오류' : '';
  if (!item) return `VAIS · 활성 작업 없음 · 다음: ${action}${warning}`;
  return `VAIS · ${item.primaryFeature || item.id} · ${item.phase}/${item.status} · 다음: ${action}${warning}`;
}

function startDir(input) {
  const candidates = [input?.workspace?.current_dir, input?.workspace?.project_dir, input?.cwd];
  for (const candidate of candidates) if (typeof candidate === 'string' && candidate && path.isAbsolute(candidate)) return candidate;
  return process.cwd();
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(startDir(input));
  process.stdout.write(`${statusLineText(projectRoot)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stdout.write(`VAIS · 상태 줄 오류: ${String(error?.message || error).slice(0, 80)}\n`);
  }
}

module.exports = { statusLineText, startDir, main };
