#!/usr/bin/env node
'use strict';

// Stop lock (docs/harness/design.md §4 기록 잠금): a turn that changed state without leaving
// a ledger line, or changed files the runtime never recorded, may not end. Two signals only,
// one refusal per turn (`stop_hook_active`), and the emergency switch is honoured.

const { readStdin, outputStopBlock, outputEmpty } = require('../lib/io');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { pathMatches } = require('../lib/workflow/v2/write-policy');
const { captureRepoSnapshot, diffSnapshots, filterExternalDrift } = require('../lib/workflow/v2/repo-drift');
const ledger = require('../lib/workflow/v2/ledger');
const { resolveProjectRoot, resolveStartDir, resolveMode } = require('./v2-project-context');

const MAX_LISTED_PATHS = 5;

function lastLedgerTs(entries, itemId) {
  let last = 0;
  for (const entry of entries) {
    if (entry.workItemId !== itemId) continue;
    const ts = Date.parse(entry.ts);
    if (ts > last) last = ts;
  }
  return last;
}

const EVENT_TOLERANCE_MS = 1000;

// Signal A: the item changed after the last ledger line, and either no runtime event explains
// the change (someone edited state directly) or a ledger-producing event has no line.
function missingRecord(registry, item, entries) {
  const last = lastLedgerTs(entries, item.id);
  const updated = Date.parse(item.updatedAt);
  if (!(updated > last)) return null;
  const events = (registry.events || []).filter(event => event.workItemId === item.id);
  const lastEvent = events.reduce((max, event) => Math.max(max, Date.parse(event.timestamp) || 0), 0);
  if (updated > lastEvent + EVENT_TOLERANCE_MS) return `상태 변경(${item.phase}/${item.status}, ${item.updatedAt})이 사건도 장부에도 없다`;
  const unrecorded = events.filter(event => Date.parse(event.timestamp) > last &&
    event.outcome === 'succeeded' && ledger.LEDGER_EVENTS.has(event.type));
  if (unrecorded.length === 0) return null;
  return `장부 기록이 필요한 사건 ${unrecorded.map(event => ledger.eventLabel(event.type)).join(', ')} 이 장부에 없다`;
}

// Signal B: repository changes outside the session authorization that no drift alert recorded.
function unrecordedChanges(projectRoot, registry, item, authorization, observed) {
  const baseline = registry.repoSnapshots?.[item.id];
  if (!baseline) return [];
  const paths = filterExternalDrift(diffSnapshots(baseline, observed), item).filter(file => file !== '@repo-head');
  const allowed = authorization?.allowedPaths || [];
  const recorded = new Set((registry.driftAlerts || []).filter(alert => alert.workItemId === item.id).flatMap(alert => alert.paths || []));
  return paths.filter(file => !allowed.some(scope => pathMatches(file, scope)) && !recorded.has(file));
}

function stopDecision(projectRoot, input = {}, options = {}) {
  const resolved = resolveMode(projectRoot, options.env || process.env);
  if (resolved.mode !== 'enforce') return { decision: 'allow', reason: `mode ${resolved.mode}` };
  const store = new WorkItemStore(projectRoot);
  const registry = store.readRegistry();
  const item = store.getCurrent();
  if (!item) return { decision: 'allow', reason: '활성 작업 없음' };
  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const authorization = sessionId ? new AuthorizationStore(projectRoot).get(sessionId) : null;
  const { entries } = ledger.read(projectRoot);
  const reasons = [];
  const missing = missingRecord(registry, item, entries);
  if (missing) reasons.push(missing);
  const observed = options.snapshot || captureRepoSnapshot(projectRoot);
  const changes = unrecordedChanges(projectRoot, registry, item, authorization, observed);
  if (changes.length) {
    reasons.push(`기록되지 않은 변경 ${changes.length}개: ${changes.slice(0, MAX_LISTED_PATHS).join(', ')}${changes.length > MAX_LISTED_PATHS ? ' …' : ''}`);
  }
  if (reasons.length === 0) return { decision: 'allow', reason: '기록 일치' };
  const reason = `VAIS 기록 잠금: ${reasons.join('; ')}. 해당 phase transaction 또는 handoff 로 기록한 뒤 턴을 끝낸다.`;
  if (input.stop_hook_active === true) {
    ledger.append(projectRoot, {
      workItemId: item.id, feature: item.primaryFeature || null, kind: 'risk',
      text: `Stop 잠금 경고 (통과): ${reasons.join('; ')}`, why: '같은 턴에서 두 번째 Stop — 차단 대신 기록',
      source: { type: 'hook', id: sessionId || 'stop' }, refs: [],
    });
    return { decision: 'allow', reason: 'stop_hook_active — 경고 기록 후 통과' };
  }
  return { decision: 'block', reason };
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot) return outputEmpty();
  const result = stopDecision(projectRoot, input);
  if (result.decision === 'block') return outputStopBlock(result.reason);
  return outputEmpty();
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`[VAIS stop] ${String(error?.message || error)}\n`);
    outputEmpty();
  }
}

module.exports = { stopDecision, missingRecord, unrecordedChanges, main };
