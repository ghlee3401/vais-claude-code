'use strict';

// The ledger is the harness's memory (docs/harness/design.md §8): an append-only JSONL file
// written at every state transition. Nothing here edits or deletes a line. Readers skip
// broken lines and report them so doctor can surface corruption instead of hiding it.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { assertContract } = require('./contracts');
const { EVENTS } = require('./state-machine');
const { parseDocument, workItemDirectory, PHASE_FOLDERS } = require('./document-manager');
const { kindOf, isStageKind } = require('./chain-registry');

const LEDGER_SCHEMA = 'ledger-entry/v1';
const KINDS = Object.freeze(['milestone', 'decision', 'feedback', 'preference', 'debt', 'risk', 'note']);
const TEXT_LIMIT = 400;
const MAX_DECISIONS = 10;

// Plain-language labels for state events; used by the session briefing and decisions.md.
const EVENT_LABELS = Object.freeze({
  'work-item.created': '작업 생성',
  [EVENTS.PLAN_PRESENTED]: 'Plan 제시',
  [EVENTS.USER_PLAN_APPROVED]: 'Plan 승인',
  [EVENTS.USER_PLAN_REVISED]: 'Plan 수정 요청',
  [EVENTS.DESIGN_PRESENTED]: 'Design 제시',
  [EVENTS.USER_DESIGN_APPROVED]: 'Design 승인',
  [EVENTS.USER_DESIGN_REVISED]: 'Design 수정 요청',
  [EVENTS.DESIGN_SCOPE_DEFINED]: 'Design 범위 확정',
  [EVENTS.DESIGN_CHECKPOINT_COMPLETED]: 'Design 세부 수정',
  [EVENTS.READINESS_READY]: 'Do 준비 완료',
  [EVENTS.READINESS_NOT_READY]: 'Do 준비 미달',
  [EVENTS.READINESS_BLOCKED]: 'Do 차단',
  [EVENTS.QA_PASS]: '독립 QA PASS',
  [EVENTS.QA_FAIL]: '독립 QA FAIL',
  [EVENTS.QA_BLOCKED]: '독립 QA 차단',
  [EVENTS.USER_FINAL_APPROVED]: '최종 승인',
  [EVENTS.USER_FINAL_REJECTED]: '최종 거절',
  [EVENTS.USER_OPTION_CHOSEN]: '안 선택',
  [EVENTS.USER_SCREEN_CONFIRMED]: '화면 확인',
  [EVENTS.USER_SCREEN_REVISED]: '화면 수정 요청',
  [EVENTS.REPORT_VALIDATED]: '작업 완료',
  [EVENTS.REPORT_FAILED]: 'Report 실패',
  [EVENTS.USER_PAUSE]: '일시정지',
  [EVENTS.USER_RESUME]: '재개',
  [EVENTS.USER_CANCEL]: '취소',
  [EVENTS.REPO_DRIFT_DETECTED]: '저장소 변경 감지',
  'repo.snapshot.updated': '저장소 스냅샷 갱신',
  'repo.drift.observed': '범위 밖 변경 기록',
  'check.completed': '검사 완료',
  'assignment.issued': 'specialist 배정',
  'assignment.handoff-recorded': 'specialist 결과 저장',
});

// Events that must leave at least one ledger line. The Stop lock treats a newer event of
// one of these types without a matching ledger line as a missing record.
const LEDGER_EVENTS = Object.freeze(new Set([
  EVENTS.USER_PLAN_APPROVED, EVENTS.USER_DESIGN_APPROVED, EVENTS.USER_FINAL_APPROVED,
  EVENTS.USER_PLAN_REVISED, EVENTS.USER_DESIGN_REVISED, EVENTS.USER_FINAL_REJECTED,
  EVENTS.QA_FAIL, EVENTS.QA_BLOCKED, EVENTS.READINESS_NOT_READY, EVENTS.READINESS_BLOCKED,
  EVENTS.REPORT_FAILED, EVENTS.REPORT_VALIDATED, EVENTS.USER_OPTION_CHOSEN, EVENTS.USER_SCREEN_REVISED,
]));

function ledgerPath(projectRoot) {
  return path.join(path.resolve(projectRoot), '.vais', 'v2', 'ledger.jsonl');
}

function eventLabel(type) {
  return EVENT_LABELS[type] || String(type || '알 수 없는 사건');
}

function clip(value, limit = TEXT_LIMIT) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function makeEntry(input, timestamp) {
  const entry = {
    schema: LEDGER_SCHEMA,
    id: `LG-${crypto.randomUUID()}`,
    ts: new Date(timestamp || Date.now()).toISOString(),
    workItemId: input.workItemId || null,
    feature: input.feature || null,
    kind: input.kind,
    text: clip(input.text),
    why: clip(input.why || ''),
    source: { type: input.source?.type || 'event', id: clip(input.source?.id || 'unknown', 120) },
    refs: [...new Set((input.refs || []).map(ref => clip(ref, 300)).filter(Boolean))].slice(0, 10),
  };
  if (!KINDS.includes(entry.kind)) throw new Error(`Unknown ledger kind: ${entry.kind}`);
  return assertContract('ledgerEntry', entry);
}

// Append-only by construction: O_APPEND writes, no rewrite path exists in this module.
function append(projectRoot, input, timestamp) {
  const entry = makeEntry(input, timestamp);
  const file = ledgerPath(projectRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(entry)}\n`);
  return entry;
}

function read(projectRoot) {
  const file = ledgerPath(projectRoot);
  if (!fs.existsSync(file)) return { entries: [], broken: [] };
  const entries = [];
  const broken = [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      const value = JSON.parse(line);
      if (value?.schema !== LEDGER_SCHEMA || !KINDS.includes(value.kind) || !value.ts || !value.text) {
        broken.push({ line: index + 1, reason: 'schema' });
        return;
      }
      entries.push(value);
    } catch (_) {
      broken.push({ line: index + 1, reason: 'json' });
    }
  });
  return { entries, broken };
}

function recent(projectRoot, options = {}) {
  const { entries } = read(projectRoot);
  const kinds = options.kinds ? new Set(options.kinds) : null;
  return entries
    .filter(entry => (!options.feature || entry.feature === options.feature) &&
      (!options.workItemId || entry.workItemId === options.workItemId) &&
      (!kinds || kinds.has(entry.kind)))
    .sort((left, right) => right.ts.localeCompare(left.ts))
    .slice(0, options.limit || 5);
}

function summarize(entries) {
  const counts = Object.fromEntries(KINDS.map(kind => [kind, 0]));
  for (const entry of entries) counts[entry.kind] = (counts[entry.kind] || 0) + 1;
  return counts;
}

// Decisions live in the approved Design: bullets under a heading that mentions 결정, or for
// stage kinds the `## 안 N` option headings the user chose between.
function extractDecisions(markdown, options = {}) {
  const lines = String(markdown || '').split('\n');
  const decisions = [];
  let level = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      if (level !== null && heading[1].length <= level) level = null;
      if (level === null && /결정|decision/i.test(heading[2])) level = heading[1].length;
      continue;
    }
    if (level !== null) {
      const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
      if (bullet) decisions.push(clip(bullet[1]));
    }
  }
  if (decisions.length === 0 && options.stage) {
    for (const raw of lines) {
      const heading = /^#{1,6}\s+(.*(?:안\s*\d+|option\s*\d+).*)$/i.exec(raw.trim());
      if (heading) decisions.push(clip(heading[1]));
    }
  }
  return decisions.slice(0, MAX_DECISIONS);
}

function readDesignDecisions(projectRoot, item) {
  try {
    const file = path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.design, 'main.md');
    const parsed = parseDocument(file);
    if (!parsed) return [];
    return extractDecisions(parsed.content, { stage: isStageKind(kindOf(item)) });
  } catch (_) {
    return [];
  }
}

// Maps one state transition to the ledger lines it must leave. Pure except for reading the
// approved Design document when a Design approval needs its decisions.
function entriesForTransition(projectRoot, context) {
  const { previous, next, event, payload = {} } = context;
  const item = next || previous;
  const base = {
    workItemId: item.id,
    feature: item.primaryFeature || null,
    source: context.transactionId
      ? { type: 'transaction', id: context.transactionId }
      : { type: 'event', id: event },
    refs: [],
  };
  const redact = typeof context.redact === 'function' ? context.redact : text => ({ text: String(text || '') });
  const userText = payload.reason ? redact(payload.reason).text : '';
  const failedChecks = Array.isArray(payload.gateResult?.failed) ? payload.gateResult.failed : [];
  const entries = [];
  const push = (kind, text, why, refs = []) => entries.push({ ...base, kind, text, why, refs });
  switch (event) {
    case EVENTS.USER_PLAN_APPROVED:
      push('milestone', `Plan 승인 (revision ${previous.planRevision}) — ${item.title}`, '사용자가 Plan 을 승인했다', [planPath(item)]);
      break;
    case EVENTS.USER_DESIGN_APPROVED:
      push('milestone', `Design 승인 (revision ${previous.designRevision}) — ${item.title}`, '사용자가 Design 을 승인했다', [designPath(item)]);
      for (const decision of readDesignDecisions(projectRoot, item)) push('decision', decision, `Design revision ${previous.designRevision} 에서 확정`, [designPath(item)]);
      break;
    case EVENTS.USER_FINAL_APPROVED:
      push('milestone', `최종 승인 — ${item.title}`, '독립 QA PASS 뒤 사용자가 결과를 승인했다');
      if (kindOf(item)?.screenCheck && item.chosenOption) {
        push('preference', `채택: 안 ${item.chosenOption} — ${item.title}`, `화면 확인 ${item.screenRevisionCount || 0}회 수정 뒤 최종 승인된 시안`, [designPath(item)]);
      }
      break;
    case EVENTS.USER_OPTION_CHOSEN:
      push('decision', `안 ${next.chosenOption} 선택 — ${item.title}`, '사용자가 시안 중 하나를 골랐다 (Design 승인 전)', [designPath(item)]);
      break;
    case EVENTS.USER_SCREEN_REVISED:
      if (next.status === 'blocked') push('risk', `화면 수정 상한 도달 (${previous.screenRevisionCount || 0}회) — ${item.title}`, '더 고칠 수 없어 확인 또는 취소만 남았다');
      else push('preference', userText || '화면 수정 요청', `화면 확인 정지점 수정 요청 ${next.screenRevisionCount}회차 (${item.title})`);
      break;
    case EVENTS.USER_PLAN_REVISED:
      push('feedback', userText || 'Plan 수정 요청', 'Plan Gate 에서 사용자가 수정을 요청했다');
      break;
    case EVENTS.USER_DESIGN_REVISED:
      push('feedback', userText || 'Design 수정 요청', 'Design Gate 에서 사용자가 수정을 요청했다');
      break;
    case EVENTS.USER_FINAL_REJECTED:
      push('feedback', userText || '최종 결과 거절', `최종 Gate 에서 사용자가 거절했다 → ${next.phase} 복귀`);
      break;
    case EVENTS.QA_FAIL:
      if (failedChecks.length === 0) push('debt', '독립 QA FAIL', `Design 복귀 (수정 회차 ${next.qaRepairCount})`);
      for (const check of failedChecks) push('debt', `QA FAIL: ${check}`, `독립 QA 가 ${check} 를 실패로 판정했다 (수정 회차 ${next.qaRepairCount})`);
      break;
    case EVENTS.QA_BLOCKED:
      push('risk', `독립 QA 차단: ${next.blockReason || 'qa-blocked'}`, 'Review 가 진행할 수 없는 상태다');
      break;
    case EVENTS.READINESS_NOT_READY:
      push('risk', `Do 준비 미달 ${next.readinessNotReadyCount}회: ${failedChecks.join(', ') || 'readiness'}`, next.status === 'blocked' ? '3회 미달로 blocked' : 'readiness 검사가 실패했다');
      break;
    case EVENTS.READINESS_BLOCKED:
      push('risk', `Do 차단: ${next.blockReason || 'readiness-blocked'}`, 'readiness 검사를 실행할 수 없었다');
      break;
    case EVENTS.REPORT_FAILED:
      push('risk', `Report 실패: ${next.blockReason || 'report-validation-failed'}`, 'Report 검증이 실패했다');
      break;
    case EVENTS.REPORT_VALIDATED:
      push('milestone', `작업 완료 — ${item.title}`, 'Report 가 확정되어 동결됐다', [reportPath(item)]);
      for (const limitation of payload.limitations || []) push('debt', clip(limitation), `${item.id} Report 의 잔여 제한`, [reportPath(item)]);
      break;
    default:
      break;
  }
  return entries;
}

function planPath(item) {
  return `docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}/${PHASE_FOLDERS.plan}/main.md`;
}

function designPath(item) {
  return `docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}/${PHASE_FOLDERS.design}/main.md`;
}

function reportPath(item) {
  return `docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}/${PHASE_FOLDERS.report}/main.md`;
}

module.exports = {
  LEDGER_SCHEMA,
  KINDS,
  EVENT_LABELS,
  LEDGER_EVENTS,
  ledgerPath,
  eventLabel,
  makeEntry,
  append,
  read,
  recent,
  summarize,
  extractDecisions,
  readDesignDecisions,
  entriesForTransition,
};
