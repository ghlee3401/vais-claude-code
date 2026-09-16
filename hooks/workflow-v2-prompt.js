#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin } = require('../lib/io');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { routePrompt } = require('../lib/workflow/v2/router');
const { defaultAllowedPaths } = require('../lib/workflow/v2/write-policy');
const { EVENTS, SLOT_HOLDING_STATUSES } = require('../lib/workflow/v2/state-machine');
const { INTERNAL_COMMAND } = require('../scripts/vais-workflow-v2');
const { captureRepoSnapshot, diffSnapshots, classifyDrift, filterExternalDrift } = require('../lib/workflow/v2/repo-drift');
const { loadRoleCatalog, resolveRole, buildRolePrompt } = require('../lib/workflow/v2/role-registry');
const { resolveProjectRoot, resolveStartDir, extractPrompt, resolveMode, warningLine } = require('./v2-project-context');
const { deterministicSlug } = require('../lib/workflow/v2/naming');
const { PHASE_FOLDERS } = require('../lib/workflow/v2/document-manager');

const INACTIVE_LINE = '[VAIS · 하네스 비활성]';

function outputContext(context) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
    },
  }));
}

// A hook that dies must never look like a hook that passed. Every failure path
// injects a visible warning instead of the silent `{}` that hid outages before.
function failLoudContext(reason) {
  return [
    `⚠ VAIS 하네스 경고: hook 예외 — ${String(reason || 'unknown').slice(0, 300)}`,
    '이 turn 은 읽기 전용으로 다룬다. `/vais doctor` 로 원인을 확인한다.',
  ].join('\n');
}

function failLoud(reason) {
  try {
    outputContext(failLoudContext(reason));
  } catch (_) { /* nothing left to do */ }
  process.exit(0);
}

process.on('uncaughtException', error => failLoud(error?.message || String(error)));
process.on('unhandledRejection', error => failLoud(error?.message || String(error)));

function harnessInactiveContext(resolved) {
  return [
    INACTIVE_LINE,
    warningLine(resolved) || '⚠ VAIS 하네스 경고: 하네스가 꺼져 있다',
    '승인·쓰기 범위·기록이 강제되지 않는다. 읽기 전용 조언만 하고, 스위치를 끄거나 mode 를 enforce 로 되돌리도록 안내한다.',
  ].join('\n');
}

// Backward-compatible mode reader: returns the effective mode string only.
function loadMode(projectRoot) {
  return resolveMode(projectRoot).mode;
}

function statusLine(item) {
  if (!item) return '[VAIS · 새 요청 · Plan 시작 준비]';
  const feature = item.primaryFeature || item.id;
  return `[${feature} · ${item.phase} · ${item.status}]`;
}

function planDraftPath(item) {
  return `${defaultAllowedPaths(item)[0].replace(/\/\*\*$/, '')}/draft.md`;
}

const HELP_LINES = Object.freeze([
  '명령 표 (사용자에게 그대로 보여준다):',
  '| 입력 | 동작 |',
  '|---|---|',
  '| `/vais <자연어 요청>` | 새 작업 시작, 진행 중이면 현재 단계 지시·피드백 |',
  '| `/vais plan 승인` · `/vais design 승인` · `/vais 최종 승인` | Gate 통과 (`/vais 승인` 도 현재 Gate 에 적용) |',
  '| `/vais 거절 <이유>` | 최종 결과 거절 → Design 복귀 |',
  '| `/vais 이름: <kebab-case>` | 영어 단어가 없는 요청의 Feature 이름 확정 |',
  '| `/vais status` (`상태`) | 현재 작업·단계·대기 요청 (읽기) |',
  '| `/vais doctor` | 하네스 건강검진 (읽기) |',
  '| `/vais help` (`도움말`) | 이 표 |',
  '| `/vais pause` · `resume` · `cancel` (`일시정지`·`재개`·`취소`) | 작업 슬롯 제어 |',
  '| `/vais 새 작업: <요청>` | 진행 중 작업을 두고 새 요청을 대기열에 보관 |',
  '`좋아`, `ok` 같은 모호한 답과 조건부·대리 표현은 승인이 아니다. `/vais` 없는 대화는 읽기 전용이다.',
]);

function phaseGuidance(item, sessionId, requestSlug = null) {
  if (!item) {
    if (!requestSlug) {
      return [
        'CEO가 단일 대화 창구다. 관련 작업을 검색하고 Feature 관계·규모를 제안한 뒤 사용자 확인을 받는다.',
        '이 요청에는 영어 단어가 없어 runtime 이 Feature 이름을 정하지 못했다. 사용자에게 kebab-case 영어 이름(예: `reading-log`)을 묻고, 사용자가 `/vais 이름: <name>` 으로 답할 때까지 Work item 을 만들지 않는다. AI 가 이름을 대신 정하면 CLI 가 거부한다.',
      ];
    }
    return [
      'CEO가 단일 대화 창구다. 관련 작업을 검색하고 Feature 관계·규모를 제안한 뒤 사용자 확인을 받는다.',
      '확인 전에는 Work item을 만들지 않는다. 확인 후 Plan 본문을 `.vais/v2/drafts/plan.md`에 작성한다.',
      `이 요청에 런타임이 발급한 결정적 새 Feature slug는 \`${requestSlug}\`다. new 관계면 다른 이름을 만들지 않는다.`,
      `\`${INTERNAL_COMMAND} plan present --slug ${requestSlug} --title "<title>" --feature <feature> --relation <new|existing> --scale <compact|standard|extended> --session ${sessionId} --revision 1 --body-file .vais/v2/drafts/plan.md\`을 한 번 실행한다.`,
      '이 transaction이 Work item·Plan 검사·Gate를 처리한다. PASS일 때만 승인 요청하며, 실패하면 evidence finding만 고쳐 재실행한다.',
      'CPO Plan은 별도 Ideation 문서 없이 문제·목표·범위·REQ·흐름·엣지 케이스·완료 조건·영향만 담고 구현 결정은 Design에 남긴다. 요구사항 ID는 REQ-001처럼 3자리 형식으로 쓴다.',
    ];
  }
  const byPhase = {
    plan: [
      'CPO가 요구사항·사용자 흐름·엣지 케이스를 구현 독립적으로 확정한다. 요구사항 ID는 REQ-001처럼 3자리 형식으로 쓴다.',
      `Plan 초안은 \`${planDraftPath(item)}\` 에 쓴다 (승격 시 자동 삭제). 고친 뒤 \`${INTERNAL_COMMAND} plan present --id ${item.id} --session ${sessionId} --revision ${item.planRevision} --body-file ${planDraftPath(item)}\`을 한 번 실행한다. PASS일 때만 사용자 승인을 요청한다.`,
    ],
    design: [
      'CTO Design은 REQ별 동작·입력·출력·오류·UI/기술 결정·TC를 정하고 필요한 전문 영역만 선택한다. Do specialist 상한은 compact 1명, standard 2명이며 단순 test 실행 역할은 고르지 않는다. REQ-001/TC-001처럼 3자리 ID를 쓰고, 디렉터리 write scope는 path/**로 표시한다. check id는 등록된 test, e2e, build, lint, plugin-validator, dependency-scan, secret-scan 중에서만 고른다.',
      `본문을 작성한 뒤 \`${INTERNAL_COMMAND} design present --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <design-draft> --scope "<approved-path>" --readiness-check <tool-id> --review-check <tool-id> [--specialist <role>]${item.qaRepairCount > 0 ? ' [--material true|false]' : ''}\`을 한 번 실행한다. 디렉터리 글롭은 셸 전개를 막도록 반드시 따옴표로 감싼다.${item.qaRepairCount > 0 ? ' QA 수정에서 material=true이면 새 revision 승인 대기, false이면 같은 승인 Design의 세부 수정으로 바로 Do에 간다.' : ' PASS일 때만 사용자 승인을 요청한다.'}`,
    ],
    do: [
      'CTO는 승인된 write scope 안에서만 구현하고 Design이 선택한 specialist만 호출한다. Design 승인 turn에서 Do부터 Review 결과까지 사용자 진행 요청 없이 계속한다.',
      `각 specialist에 \`${INTERNAL_COMMAND} assignment --id ${item.id} --session ${sessionId} ...\`로 AS receipt를 발급해 Agent prompt에 넣는다. Agent 종료 시 훅이 handoff를 자동 저장하므로 저장된 handoff를 다시 쓰거나 재등록하지 않는다.`,
      `Agent 도구가 launch receipt만 돌려주고 결과가 나중에 task notification으로 오면, 그 raw handoff JSON을 \`${PHASE_FOLDERS.do}/handoff.json\`에 그대로 저장한 뒤 \`${INTERNAL_COMMAND} handoff --id ${item.id} --session ${sessionId} --assignment <AS-id> --handoff-file <path>\`를 한 번 실행한다.`,
      `짧은 Do 본문을 쓴 뒤 \`${INTERNAL_COMMAND} do ready --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <do-draft>\`을 한 번 실행한다. transaction이 handoff·문서·Design-declared readiness 검사를 실행한다.`,
    ],
    review: [
      'Independent QA가 구현자 자기평가를 제외한 clean-room Context View로 검증하며 제품 코드는 수정하지 않는다.',
      `먼저 \`${INTERNAL_COMMAND} review prepare --id ${item.id} --session ${sessionId} --revision ${item.designRevision}\`를 실행해 Design-declared review evidence를 정확히 한 번 준비한다. Do와 identity가 같은 check receipt는 재사용한다.`,
      `evidence가 fail/blocked이고 independent QA가 같은 identity의 보충 검사를 요구한 경우에만 \`${INTERNAL_COMMAND} review prepare --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --supplemental-check <tool-id> --supplemental-reason "<reason>"\`을 실행한다. 보충 검사는 Design-declared check별 한 번만 허용한다.`,
      `\`${INTERNAL_COMMAND} assignment --id ${item.id} --session ${sessionId} --role independent-qa --delegated-by ceo --phase review --mode verification --question "<question>" --code-write false --criterion "<criterion>" --ref <plan-ref> --ref <design-ref> --clean-room true\`로 정확히 한 번 위임한다. handoff는 Agent 종료 훅이 자동 저장한다. assignment.outputContract의 UTF-8 hard limit과 더 낮은 target을 지키고 로그·스크린샷은 짧은 경로나 receipt ID로만 참조한다.`,
      `Agent 도구가 launch receipt만 돌려주고 QA 결과가 나중에 task notification으로 오면, 그 raw handoff JSON을 \`${PHASE_FOLDERS.review}/handoff.json\`에 그대로 저장한 뒤 \`${INTERNAL_COMMAND} handoff --id ${item.id} --session ${sessionId} --assignment <AS-id> --handoff-file <path>\`를 한 번 실행하고 review decide로 이어간다.`,
      `REQ-001/TC-001처럼 접두사를 생략하지 않은 ID별로 입력·출력·기대·실제·판정·엣지/제한·evidence를 짧게 기록한 뒤 \`${INTERNAL_COMMAND} review decide --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <review-draft>\`을 한 번 실행한다. decide는 기존 receipt와 QA handoff만 검증하며 check를 재실행하지 않는다. 실제 QA FAIL/BLOCKED면 Report로 가지 않으며 FAIL은 Design으로 돌아간다.`,
    ],
    report: [
      'CEO는 AI QA PASS와 사용자 최종 승인 뒤에만 Report를 확정한다.',
      `\`${INTERNAL_COMMAND} report finalize --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --outcome "<accepted outcome>" [--limitation "<remaining limitation>"]\`을 한 번 실행한다. 완료 Report는 수정하지 않는다.`,
    ],
  };
  const ownerByPhase = { plan: 'cpo', design: 'cto', do: 'cto', review: 'independent-qa', report: 'ceo' };
  const owner = resolveRole(loadRoleCatalog(), ownerByPhase[item.phase]);
  const ownerPrompt = owner?.kind === 'role' ? buildRolePrompt(owner.role) : '';
  return [
    `먼저 \`${INTERNAL_COMMAND} context --id ${item.id} --phase ${item.phase} --role ${ownerByPhase[item.phase]}\`로 bounded Context Capsule을 한 번 읽고, 원문 전체 재탐색은 capsule이 부족할 때만 한다.`,
    ...(ownerPrompt ? [`Current phase owner card (execute this responsibility in the main VAIS voice; do not spawn the owner as a specialist):\n${ownerPrompt}`] : []),
    ...(byPhase[item.phase] || []),
  ];
}

// A specialist Agent that this session launched through the guard may still be running
// when a non-managed turn (typically the harness's task notification) arrives. Revoking
// the session authorization at that moment would strand the assignment: its handoff
// could never be persisted and the next Gate would fail closed. Keep the authorization
// while such an assignment is open; the write guard still limits every mutation to the
// current phase paths and the public runtime commands.
function openAssignmentContinuation(store, authorization) {
  if (!authorization?.workItemId || !['do', 'review'].includes(authorization.phase)) return [];
  const item = store.get(authorization.workItemId);
  const current = store.getCurrent();
  if (!item || !current || current.id !== item.id || item.status !== 'active' || item.phase !== authorization.phase) return [];
  return store.openAssignments(item.id);
}

function continuationLines(item, open, sessionId) {
  const folder = PHASE_FOLDERS[item.phase];
  return [
    `이 turn은 /vais 없이 도착했지만 이 세션이 시작한 specialist assignment가 열려 있다: ${open.map(receipt => `${receipt.id} (${receipt.role})`).join(', ')}.`,
    `그 결과가 task notification으로 왔다면 raw specialist-handoff/v1 JSON을 \`${folder}/handoff.json\`에 그대로 저장하고 \`${INTERNAL_COMMAND} handoff --id ${item.id} --session ${sessionId} --assignment <AS-id> --handoff-file <path>\`를 한 번 실행한 뒤 현재 phase transaction을 이어간다.`,
    '그 외의 문서·제품 코드 변경은 하지 않으며, 새 요청은 사용자가 /vais를 붙여 다시 보내도록 안내한다.',
  ];
}

function buildContext(route, item, leaseError, sessionId = '<session>', options = {}) {
  const lines = [statusLine(item)];
  if (leaseError) {
    lines.push(`VAIS mutation blocked: ${leaseError}`);
    lines.push('다른 세션의 진행 작업을 변경하지 말고 읽기 전용 상태만 설명한다.');
    return lines.join('\n');
  }
  const open = options.openAssignments || [];
  if (!route.managed) {
    if (item && open.length > 0) {
      lines.push(...continuationLines(item, open, sessionId));
    } else if (item) {
      lines.push('이 요청에는 /vais가 없다. 현재 Work item의 상태·문서·제품 코드를 변경하지 않는다.');
      lines.push('작업 반영이 필요하면 사용자가 /vais를 붙여 다시 요청하도록 안내한다.');
    }
    return lines.join('\n');
  }
  lines.push(`VAIS managed action: ${route.action}`);
  if (route.action === 'help') {
    lines.push(...HELP_LINES, '이 action은 읽기 전용이다.');
    return lines.join('\n');
  }
  if (route.action === 'doctor') {
    lines.push(`\`${INTERNAL_COMMAND} doctor\` 를 한 번 실행해 점검표를 사람 말로 요약해 보여준다. fail 항목은 fix 문구를 그대로 안내한다.`, '이 action은 읽기 전용이다.');
    return lines.join('\n');
  }
  if (route.action === 'queue-pending') {
    lines.push('현재 Work item은 변경하지 않았다. 새 요청은 Work item을 만들지 않고 pending에 보관했다.');
    lines.push('/vais status에서 대기 요청을 확인하고, 현재 작업 완료·일시정지·취소 후 사용자가 선택할 때만 새 Work item으로 만든다.');
    return lines.join('\n');
  }
  if (route.action === 'name-feature') {
    lines.push(`사용자가 Feature 이름 \`${route.slug}\` 을 확정했고 runtime 이 등록했다. 이 이름으로 Plan 을 진행한다.`);
    lines.push(...phaseGuidance(null, sessionId, route.slug));
    return lines.join('\n');
  }
  lines.push('현재 Work item과 event 상태 머신의 transaction을 순서대로 처리한다. 사용자 결정 Gate나 BLOCKED/FAIL에서만 멈추며, C-Level이나 Phase 직접 호출로 Gate를 우회하지 않는다.');
  lines.push(...phaseGuidance(item, sessionId, !item ? deterministicSlug(route.text) : null));
  if (!route.mutationAllowed) lines.push('이 action은 읽기 전용이다.');
  return lines.join('\n');
}

function applyDeterministicRoute(store, current, route, sessionId) {
  if (route.action === 'resume') {
    const paused = current?.status === 'paused' ? [current] : store.list().filter(item => item.status === 'paused')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    if (paused.length !== 1) throw new Error(`Resume requires exactly one paused Work item; found ${paused.length}`);
    const resumed = store.apply(paused[0].id, EVENTS.USER_RESUME, {}, { acquireLeaseSessionId: sessionId });
    return resumed;
  }
  const eventByAction = {
    'approve-plan': EVENTS.USER_PLAN_APPROVED,
    'approve-design': EVENTS.USER_DESIGN_APPROVED,
    'approve-final': EVENTS.USER_FINAL_APPROVED,
    'revise-plan': EVENTS.USER_PLAN_REVISED,
    'revise-design': EVENTS.USER_DESIGN_REVISED,
    'reject-final': EVENTS.USER_FINAL_REJECTED,
    pause: EVENTS.USER_PAUSE,
    cancel: EVENTS.USER_CANCEL,
  };
  const event = eventByAction[route.action];
  if (!event || !current) return current;
  store.acquireLease(current.id, sessionId);
  return store.apply(current.id, event, {}, { requireLease: true, sessionId });
}

function observePromptDrift(store, item, sessionId, projectRoot) {
  if (!item || !SLOT_HOLDING_STATUSES.has(item.status)) return item;
  const observed = captureRepoSnapshot(projectRoot);
  const baseline = store.getRepoSnapshot(item.id);
  if (!baseline) {
    store.setRepoSnapshot(item.id, observed, { reason: `${item.phase}-entry` });
    return item;
  }
  const paths = filterExternalDrift(diffSnapshots(baseline, observed), item);
  if (paths.length === 0) return item;
  const classification = classifyDrift(paths, item);
  store.recordDriftAlert(item.id, paths, classification);
  const routed = store.apply(item.id, EVENTS.REPO_DRIFT_DETECTED, { classification }, {
    requireLease: true,
    sessionId,
  });
  store.setRepoSnapshot(item.id, captureRepoSnapshot(projectRoot), {
    reason: `drift-${classification}`, changedPathCount: paths.length,
  });
  return routed;
}

function requestSlugFor(route) {
  if (route.action === 'name-feature') return route.slug;
  if (route.action === 'start-request') return deterministicSlug(route.text);
  return null;
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot) return console.log('{}');
  const resolved = resolveMode(projectRoot);
  if (resolved.mode === 'off') return outputContext(harnessInactiveContext(resolved));
  if (resolved.mode === 'disabled') return console.log('{}');
  const warning = warningLine(resolved);
  const emit = context => outputContext(warning ? `${warning}\n${context}` : context);

  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const store = new WorkItemStore(projectRoot);
  const authStore = new AuthorizationStore(projectRoot);
  const current = store.getCurrent();
  const paused = current ? [] : store.list().filter(item => item.status === 'paused')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const routeItem = current || (paused.length === 1 ? paused[0] : null);
  const route = routePrompt(extractPrompt(input), routeItem);

  if (!route.managed || !route.mutationAllowed) {
    const open = sessionId ? openAssignmentContinuation(store, authStore.get(sessionId)) : [];
    if (open.length > 0) {
      authStore.touch(sessionId);
      return emit(buildContext(route, routeItem, null, sessionId, { openAssignments: open }));
    }
    if (sessionId) authStore.revoke(sessionId);
    return emit(buildContext(route, routeItem, null, sessionId));
  }

  if (!sessionId) return emit(buildContext(route, current, 'session id is unavailable', sessionId));
  try {
    if (route.action === 'queue-pending') {
      store.queuePendingRequest(route.text, sessionId);
      authStore.revoke(sessionId);
      return emit(buildContext(route, current, null, sessionId));
    }
    let active = routeItem;
    if (active && route.action !== 'resume') {
      store.acquireLease(active.id, sessionId);
      active = observePromptDrift(store, active, sessionId, projectRoot);
    }
    active = applyDeterministicRoute(store, active, route, sessionId);
    if (active && SLOT_HOLDING_STATUSES.has(active.status)) {
      store.setRepoSnapshot(active.id, captureRepoSnapshot(projectRoot), { reason: `prompt-${route.action}` });
    }
    if (active && !SLOT_HOLDING_STATUSES.has(active.status)) active = null;
    authStore.grant({
      sessionId,
      workItemId: active?.id || null,
      phase: active?.phase || 'plan',
      action: route.action === 'name-feature' ? 'start-request' : route.action,
      requestSlug: requestSlugFor(route),
      allowedPaths: defaultAllowedPaths(active),
      allowedCommands: [INTERNAL_COMMAND],
    });
    return emit(buildContext(route, active, null, sessionId));
  } catch (error) {
    authStore.revoke(sessionId);
    return emit(buildContext(route, routeItem, error.message, sessionId));
  }
}

module.exports = {
  INACTIVE_LINE,
  HELP_LINES,
  loadMode,
  failLoudContext,
  harnessInactiveContext,
  statusLine,
  planDraftPath,
  phaseGuidance,
  openAssignmentContinuation,
  buildContext,
  applyDeterministicRoute,
  observePromptDrift,
  requestSlugFor,
  main,
};

if (require.main === module) main();
