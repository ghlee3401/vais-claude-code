'use strict';

// One sentence about where the work stands (docs/harness/design.md §6), built only from
// work-items.json, chain-index.json, and the ledger. Shared by the SessionStart hook,
// `/vais 상태`, and the statusline so every surface tells the same story.

const { WorkItemStore } = require('./work-item-store');
const idChain = require('./id-chain');
const ledger = require('./ledger');
const { propose, formatProposals } = require('./proposal');

const QUIET_EVENTS = new Set(['repo.snapshot.updated', 'check.execution.claimed', 'check.execution.released']);

function lastEventOf(registry, itemId) {
  const events = (registry.events || []).filter(event => event.workItemId === itemId && event.outcome === 'succeeded' && !QUIET_EVENTS.has(event.type));
  return events.length ? events[events.length - 1] : null;
}

function stamp(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—';
}

// Structured facts behind the sentence; consumers may render them differently.
function briefingFacts(projectRoot) {
  const store = new WorkItemStore(projectRoot);
  const registry = store.readRegistry();
  const item = store.getCurrent();
  const index = idChain.loadChainIndex(projectRoot);
  const { entries, broken } = ledger.read(projectRoot);
  const counts = ledger.summarize(entries);
  const stale = idChain.computeStale(index).length;
  const proposals = propose(projectRoot, { registry, index, ledgerEntries: entries });
  const openDecisions = (item?.status === 'waiting-user' ? 1 : 0) + (registry.pendingRequests || []).length;
  const workItems = Object.keys(registry.workItems || {}).length;
  const hasState = workItems > 0 || entries.length > 0 || Object.keys(index.stages || {}).length > 0;
  return { item, lastEvent: item ? lastEventOf(registry, item.id) : null, openDecisions, debts: counts.debt, stale, proposals, broken, workItems, hasState };
}

function statusSentence(facts) {
  const { item, lastEvent, openDecisions, debts, stale, proposals } = facts;
  const tail = `열린 결정 ${openDecisions}, 부채 ${debts}, stale ${stale}. 제안: ${formatProposals(proposals)}`;
  if (item) {
    const reason = item.status === 'blocked' && item.blockReason ? `: ${item.blockReason}` : '';
    return `[${item.primaryFeature || item.id} · ${item.phase} · ${item.status}${reason}] 지난 세션: ${lastEvent ? `${ledger.eventLabel(lastEvent.type)} (${stamp(lastEvent.timestamp)})` : '기록 없음'}. ${tail}`;
  }
  return `[VAIS · 활성 작업 없음] ${facts.workItems > 0 ? `지난 작업 ${facts.workItems}개` : '시작 전'}. ${tail}`;
}

function buildBriefing(projectRoot) {
  const facts = briefingFacts(projectRoot);
  const lines = [statusSentence(facts)];
  if (facts.broken.length) lines.push(`⚠ VAIS 하네스 경고: 장부에 깨진 줄 ${facts.broken.length}개 — \`/vais doctor\` 로 확인한다.`);
  lines.push('이 브리핑을 첫 응답 첫 줄에 그대로 보인다. 제안은 work-items·chain-index·ledger 에서만 나왔다.');
  return lines.join('\n');
}

// `/vais 상태`: the same facts as a short paragraph a non-developer can read.
function statusSummary(projectRoot) {
  const facts = briefingFacts(projectRoot);
  const { item, proposals } = facts;
  const parts = [];
  if (item) {
    const waiting = item.status === 'waiting-user' ? ` 사용자 결정을 기다리는 중(${item.phase} Gate)입니다.` : item.status === 'blocked' ? ` 막혀 있습니다(${item.blockReason || 'blocked'}).` : ' 진행 중입니다.';
    parts.push(`지금 작업은 "${item.title}"(${item.id}, ${item.phase} 단계)이고${waiting}`);
    if (facts.lastEvent) parts.push(`마지막 사건은 ${ledger.eventLabel(facts.lastEvent.type)}(${stamp(facts.lastEvent.timestamp)})입니다.`);
  } else {
    parts.push(facts.workItems > 0 ? `진행 중인 작업은 없고 지난 작업이 ${facts.workItems}개 있습니다.` : '아직 시작한 작업이 없습니다.');
  }
  parts.push(`열린 결정 ${facts.openDecisions}개, 부채 ${facts.debts}건, stale 항목 ${facts.stale}개.`);
  if (proposals.length) parts.push(`다음으로 할 만한 일: ${proposals.map((entry, index) => `${['①', '②', '③'][index]} ${entry.text} (\`${entry.command}\`)`).join(' ')}`);
  if (facts.broken.length) parts.push(`장부에 깨진 줄이 ${facts.broken.length}개 있습니다 — \`/vais doctor\`.`);
  return parts.join(' ');
}

module.exports = { lastEventOf, briefingFacts, statusSentence, buildBriefing, statusSummary };
