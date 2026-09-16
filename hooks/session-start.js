#!/usr/bin/env node
'use strict';

// SessionStart briefing (docs/harness/design.md §6): one paragraph built only from
// work-items.json, chain-index.json, and the ledger. No model call, no guessing — when
// there is no state the briefing says so.

const { readStdin, outputSessionContext, outputEmpty } = require('../lib/io');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const idChain = require('../lib/workflow/v2/id-chain');
const ledger = require('../lib/workflow/v2/ledger');
const { propose, formatProposals } = require('../lib/workflow/v2/proposal');
const { resolveProjectRoot, resolveStartDir, resolveMode, warningLine } = require('./v2-project-context');

const INACTIVE_LINE = '[VAIS · 하네스 비활성]';

function lastEventOf(registry, itemId) {
  const events = (registry.events || []).filter(event => event.workItemId === itemId && event.outcome === 'succeeded' &&
    !['repo.snapshot.updated', 'check.execution.claimed', 'check.execution.released'].includes(event.type));
  return events.length ? events[events.length - 1] : null;
}

function stamp(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—';
}

function buildBriefing(projectRoot) {
  const store = new WorkItemStore(projectRoot);
  const registry = store.readRegistry();
  const item = store.getCurrent();
  const index = idChain.loadChainIndex(projectRoot);
  const { entries, broken } = ledger.read(projectRoot);
  const counts = ledger.summarize(entries);
  const stale = idChain.computeStale(index).length;
  const proposals = propose(projectRoot, { registry, index, ledgerEntries: entries });
  const openDecisions = (item?.status === 'waiting-user' ? 1 : 0) + (registry.pendingRequests || []).length;
  const lines = [];
  if (item) {
    const last = lastEventOf(registry, item.id);
    lines.push(`[${item.primaryFeature || item.id} · ${item.phase} · ${item.status}] 지난 세션: ${last ? `${ledger.eventLabel(last.type)} (${stamp(last.timestamp)})` : '기록 없음'}. 열린 결정 ${openDecisions}, 부채 ${counts.debt}, stale ${stale}. 제안: ${formatProposals(proposals)}`);
  } else {
    const hasState = Object.keys(registry.workItems || {}).length > 0 || entries.length > 0 || Object.keys(index.stages || {}).length > 0;
    lines.push(`[VAIS · 활성 작업 없음] ${hasState ? `지난 작업 ${Object.keys(registry.workItems || {}).length}개` : '시작 전'}. 열린 결정 ${openDecisions}, 부채 ${counts.debt}, stale ${stale}. 제안: ${formatProposals(proposals)}`);
  }
  if (broken.length) lines.push(`⚠ VAIS 하네스 경고: 장부에 깨진 줄 ${broken.length}개 — \`/vais doctor\` 로 확인한다.`);
  lines.push('이 브리핑을 첫 응답 첫 줄에 그대로 보인다. 제안은 work-items·chain-index·ledger 에서만 나왔다.');
  return lines.join('\n');
}

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
