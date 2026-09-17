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
const { suggestKind, getKind, kindOf, isStageKind, stageOfKind } = require('../lib/workflow/v2/chain-registry');
const { assertStageEntry } = require('../lib/workflow/v2/id-chain');
const { loadDiagramConfig } = require('../lib/workflow/v2/config');
const ledger = require('../lib/workflow/v2/ledger');

const LEDGER_INJECT_KINDS = Object.freeze(['feedback', 'preference', 'debt']);
const LEDGER_INJECT_LIMIT = 5;

// Kinds whose Design decides how screens look: taste travels across features for them.
const SCREEN_KINDS = Object.freeze(['ui', 'stage-wireframes', 'stage-mockups', 'stage-design-system']);

// Memory shown at Design time: what the user already said about this feature, plus every
// recorded taste (preference) for screen kinds — taste belongs to the product, not one feature.
function ledgerLinesFor(projectRoot, item) {
  if (!item || item.phase !== 'design' || !item.primaryFeature) return [];
  const entries = ledger.recent(projectRoot, { feature: item.primaryFeature, kinds: LEDGER_INJECT_KINDS, limit: LEDGER_INJECT_LIMIT });
  const lines = [];
  if (entries.length) {
    lines.push(`이 feature 의 장부 (최근 ${entries.length}, 피드백·취향·부채) — Design 에 반영하거나 반영하지 않는 이유를 적는다:`,
      ...entries.map(entry => `- [${entry.kind}] ${entry.text}${entry.why ? ` (${entry.why})` : ''}`));
  }
  if (SCREEN_KINDS.includes(kindOf(item)?.id)) {
    const seen = new Set(entries.map(entry => entry.id));
    const tastes = ledger.recent(projectRoot, { kinds: ['preference'], limit: LEDGER_INJECT_LIMIT }).filter(entry => !seen.has(entry.id));
    if (tastes.length) {
      lines.push(`제품 전체 취향 장부 (최근 ${tastes.length}) — 시안은 이 취향을 따르거나 벗어나는 이유를 적는다:`,
        ...tastes.map(entry => `- [preference] ${entry.text}${entry.why ? ` (${entry.why})` : ''}`));
    }
  }
  return lines;
}

// Phase guidance for screen-check kinds (ui): one-line Plan, option screenshots, the screen
// check after Do. Pictures are shown by reading the PNGs, never by describing them.
function uiPhaseLines(item, kind, sessionId) {
  const dir = `docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}`;
  const round = (item.screenRevisionCount || 0) + 1;
  return {
    plan: [
      `이 작업은 화면 손보기(kind ${kind.id}) 다. Plan 은 "요청 확인: <한 줄>", "kind: ${kind.id}", "대상 화면: <화면 이름 또는 S/W/V ID 또는 파일>" 세 줄이면 된다. 초안은 \`${planDraftPath(item)}\`.`,
    ],
    design: [
      `Design 은 시안 고르기다: 안마다 앱 작업 사본을 \`${dir}/02-design/options/N/\` 에 만들고(vais.config.json > ui.appRoot 의 파일을 복사해 CSS/HTML 을 바꿈) \`${INTERNAL_COMMAND} screens capture --id ${item.id} --session ${sessionId} --target ${dir}/02-design/options/N/<entry> --out ${dir}/02-design/options/N\` 으로 데스크톱·모바일 PNG 를 찍는다. 규모별 안 상한 compact 1 · standard 2 · extended 3.`,
      `본문: "## 안 N" 마다 "사본: <경로>", "데스크톱: <png>", "모바일: <png>" 줄과 한 줄 설명, "## 검수표"(≤5줄), "## 쓰기 범위"(제품 파일), "readiness · review" check, "rollback". 그림이 없는 안은 Gate 를 통과하지 못한다.`,
      `\`${INTERNAL_COMMAND} design present --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <design-draft> --scope "<app path>" --readiness-check <tool-id> --review-check <tool-id>${(item.screenRevisionCount || 0) > 0 || item.qaRepairCount > 0 ? ' --material false' : ''}\`을 한 번 실행한다. PASS 뒤 PNG 를 Read 로 열어 사용자에게 보이고, 사용자는 \`/vais N번\` 으로 고른 뒤 \`/vais design 승인\` 한다.${(item.screenRevisionCount || 0) > 0 ? ` 지금은 화면 확인 수정 회차 ${item.screenRevisionCount} — 사용자의 수정 요청을 "## 수정 회차 ${item.screenRevisionCount}" 절에 적고 material=false 로 제시하면 바로 Do 로 간다.` : ''}`,
    ],
    do: [
      `승인된 안(안 ${item.chosenOption || '?'})을 제품 파일(write scope)에 적용한다. \`${INTERNAL_COMMAND} do ready --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <do-draft>\` 가 회차 ${round} 화면을 \`${dir}/03-do/evidence/screens/round-${round}/\` 에 찍고 diff.md 를 만든다 (내장 검사 screen-capture; Chrome 이 없으면 NOT_READY).`,
      `READY 뒤 상태는 do/waiting-user(화면 확인 정지점)다. round-0(전)·round-${round}(후) 의 desktop.png·mobile.png 를 Read 로 열어 보이고 diff.md 의 요약을 한 줄로 붙인 뒤 멈춘다. 사용자가 \`/vais 확인\` 이면 Review, 다른 문장이면 수정 회차로 Design 세부 수정(material=false) → Do 재실행이다. 상한 ${kind.repairLimit}회.`,
    ],
    review: [
      `\`review prepare\` 가 \`${dir}/04-review/evidence/review.html\`(승인 시안 | 전 | 후, 회차 diff, 검수표)을 만든다. 독립 QA 에 그 경로와 round PNG 경로를 ref 로 넘긴다.`,
    ],
  };
}

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
  // A blocked item always shows why, so the user never has to dig for the reason.
  const reason = item.status === 'blocked' && item.blockReason ? `: ${item.blockReason}` : '';
  return `[${feature} · ${item.phase} · ${item.status}${reason}]`;
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
  '| `/vais 변경 없음 확인: F-003 ← REQ-002` | 상위 항목이 바뀌었지만 하위 항목은 그대로임을 사용자가 확인 (stale 해소) |',
  '| `/vais N번` | 시안 Design 에서 안 고르기 (그 뒤 `/vais design 승인`) |',
  '| `/vais 확인` · `/vais <수정 요청>` | 화면 확인 정지점: 확인하면 Review, 수정 문장이면 다시 고쳐 찍음 (최대 5회) |',
  '| `/vais 상태` (`status`) | 현재 작업·단계·기다리는 결정·부채·stale·제안을 사람 말로 (읽기) |',
  '| `/vais 설명 <ID·용어·파일>` | 항목 ID 의 부모·자식·만든 작업, 용어 뜻, 파일이 어느 정본인지 (읽기) |',
  '| `/vais 저장 [메시지]` → `/vais 저장 확인` (`commit` → `commit 확인`) | 버전 7면 검사·변경 요약·메시지 제안 → 사용자가 확인하면 runtime 이 커밋 (push 는 사용자). 실패하면 "스테이지 N개 됨 · 커밋 안 됨 · 원인" 을 그대로 전한다 |',
  '| `/vais 되돌리기 <작업 id·커밋>` → `/vais 되돌리기 확인: <대상>` | 되돌릴 커밋·파일 제시 → 확인하면 revert 커밋 |',
  '| `/vais 제안` | 다음 행동 3개 (읽기) |',
  '| `/vais 기록 <결정·피드백·취향·부채·리스크·메모> <내용>` · `/vais 기록 보기 [종류]` | 장부에 직접 남기기 · 최근 10건 보기 |',
  '| `/vais doctor` | 하네스 건강검진 (읽기) |',
  '| `/vais help` (`도움말`) | 이 표 |',
  '| `/vais pause` · `resume` · `cancel` (`일시정지`·`재개`·`취소`) | 작업 슬롯 제어 |',
  '| `/vais 새 작업: <요청>` | 진행 중 작업을 두고 새 요청을 대기열에 보관 |',
  '`좋아`, `ok` 같은 모호한 답과 조건부·대리 표현은 승인이 아니다. `/vais` 없는 대화는 읽기 전용이다.',
]);

function kindLines(suggestion) {
  if (!suggestion) return [];
  const kind = getKind(suggestion.kind);
  const lines = [
    `runtime 이 제안하는 작업 kind 는 \`${suggestion.kind}\`${suggestion.trigger ? ` (요청의 "${suggestion.trigger}")` : ' (기본값)'} 다. Plan 에 kind 를 적어 사용자 확인을 받고 \`plan present\` 에 \`--kind ${suggestion.kind}\` 를 넘긴다. 다른 kind 가 맞으면 사용자에게 물어 정한다.`,
  ];
  if (suggestion.locked) {
    lines.push(`이 kind 는 지금 시작할 수 없다: ${suggestion.locked}. 사용자에게 그대로 알리고 Work item 을 만들지 않는다.`);
  } else if (isStageKind(kind)) {
    const stage = stageOfKind(kind);
    lines.push(`단계 kind 의 Plan 은 세 줄이면 된다: "요청 확인: <한 줄>", "kind: ${kind.id}", "단계: ${stage.order} ${stage.title}". 예산 2,048B.`);
  }
  return lines;
}

function stagePhaseLines(item, kind, stage, sessionId) {
  const scopes = (kind.autoWriteScopes || []).map(scope => `--scope "${scope}"`).join(' ');
  return {
    plan: [
      `이 작업은 ${stage.order}단계 ${stage.title} (kind ${kind.id}) 다. Plan 은 "요청 확인: <한 줄>", "kind: ${kind.id}", "단계: ${stage.order} ${stage.title}" 세 줄이면 된다.`,
    ],
    design: [
      `Design 은 고르기 목록이다: "## 안 1" … (규모별 상한 compact 1 · standard 2 · extended 3), "쓰기 범위" 에 ${kind.autoWriteScopes.join(', ')}, readiness·review check 는 \`stage-document\`, rollback 한 줄.`,
      ...(Array.isArray(stage.diagram) && stage.diagram.length > 0 ? [
        `안마다 그림을 \`skills/diagram\` 규칙(유형 ${stage.diagram.join('·')})으로 \`docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}/02-design/options/N/flow.html\` 에 그리고 \`${INTERNAL_COMMAND} screens capture --id ${item.id} --session ${sessionId} --target <그 html> --out <같은 폴더>\` 로 PNG 를 찍어 Read 로 열어 응답에 보인다. 말로 설명하지 않는다.`,
      ] : []),
      `\`${INTERNAL_COMMAND} design present --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <design-draft> ${scopes} --readiness-check stage-document --review-check stage-document\`을 한 번 실행한다.`,
    ],
    do: [
      `정본 \`${stage.file}\` 을 쓴다: frontmatter (schema: vais-stage/v1, stage: ${stage.id}, status: draft) + 항목마다 "### ${stage.idPrefix}-001${stage.parents?.required ? ' ← <부모 ID>' : ''}" 제목과 "| 항목 | 내용 |" 표. 필수 항목: ${stage.requiredFields.join(', ')}.${stage.documentSections ? ` 문서 섹션(## 제목): ${stage.documentSections.join(', ')}.` : ''}${stage.parents?.allowed?.length ? ` 부모는 승인된 상위 ID 만 (허용 접두: ${stage.parents.allowed.join(', ')}).` : ''}${stage.artifactDir ? ` 산출물(${(stage.artifactFields || []).join(', ')})은 \`${stage.artifactDir}/\` 아래 실제 파일이어야 한다.` : ''}${Array.isArray(stage.diagram) && stage.diagram.length > 0 ? ` 흐름 파일은 \`skills/diagram\` 규칙으로 그린 \`.html\` 을 권장하고(\`do ready\` 가 PNG 로 렌더), 기존 \`.mmd\` 도 그대로 받는다.` : ''}`,
      `그 뒤 짧은 Do 본문을 쓰고 \`${INTERNAL_COMMAND} do ready --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file <do-draft>\` 를 한 번 실행한다. transaction 이 \`stage-document\` 검사(형식·부모·산출물·예산·커버리지)를 실행한다.`,
    ],
    report: [
      `\`report finalize\` 가 \`${stage.file}\` 을 approved 로 표시하고 chain-index 에 항목 해시를 기록한다.`,
    ],
  };
}

// Phase guidance for implementation kinds (feature · bug): cite approved IDs, declare new ones,
// let the runtime append them, and let QA judge exactly those TCs.
function implementationPhaseLines(item, kind, sessionId) {
  const dir = `docs/work-items/${item.primaryFeature}/${String(item.id).replace(/^WI-/, '')}`;
  const bug = kind.designTemplate === 'bugfix';
  return {
    plan: [
      `이 작업은 ${bug ? '버그 수정' : '기능 추가·변경'}(kind ${kind.id}) 다. 먼저 \`${INTERNAL_COMMAND} stage status\` 와 docs/product/*.md 에서 관련 항목 ID 를 찾는다. Plan 은 "요청 확인: <한 줄>", "kind: ${kind.id}", "관련 ID: <F-…, S-…>" 세 줄이면 된다${bug ? ' (재현 절차 한 줄 포함)' : ''}. 초안은 \`${planDraftPath(item)}\`.`,
    ],
    design: [
      `Design 은 사슬 위의 인용·선언이다: "## 안 N"(접근안, 규모별 1~3), "## 인용"(건드리는 승인 ID 목록), "## 신규"(새 항목을 "### API-007 ← S-002" + "| 항목 | 내용 |" 표로, 그 단계의 필수 항목을 모두 채워서, 번호는 다음 빈 번호), "## 검수표"(≤5), "## 쓰기 범위"(제품 코드), readiness·review check, rollback.${bug ? ' 버그는 "## 재현"(절차 + `재현 화면: <png>` — `screens capture` 로 찍은 Work item 폴더 안 파일), "## 원인", "## 수정안"(1개), 신규 TC 항목이 필수다. 선택: "## 해소 부채" 불릿.' : ''} ID 없는 "만드는 것" 서술은 Gate 를 통과하지 못하고, stale 항목이 있으면 제시 자체가 거부된다.`,
      `\`${INTERNAL_COMMAND} design present --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file ${dir}/02-design/draft.md --scope "<app path>" --readiness-check <tool-id> --review-check <tool-id>${item.qaRepairCount > 0 ? ' [--material true|false]' : ''}\`을 한 번 실행한다. PASS 뒤 사용자는 \`/vais N번\` 없이 바로 \`/vais design 승인\` 한다(안이 여럿이면 어느 안인지 본문에 밝힌다).`,
    ],
    do: [
      `승인된 안을 쓰기 범위 안의 제품 코드에 적용한다. 제품 문서(docs/product/*.md)는 직접 고치지 않는다 — \`${INTERNAL_COMMAND} do ready --id ${item.id} --session ${sessionId} --revision ${item.designRevision} --body-file ${dir}/03-do/draft.md\` 가 READY 일 때 "## 신규" 항목을 정본에 붙이고(index draft) 화면(S·W·V) 을 인용했으면 screen-capture 로 찍는다.`,
    ],
    review: [
      `독립 QA 의 \`--criterion\` 은 Design 의 "## 검수표" 줄과 인용·신규 TC 만으로 만든다${bug ? '. 버그는 "## 재현" 절차를 다시 실행해 미발생인지 확인하게 하고 Review 문서에 "## 재현 재실행" 절과 증거 경로를 쓴다' : ''}. Review 문서의 TC 집합은 Design 의 인용·신규 TC 와 같아야 한다.`,
    ],
    report: [
      `\`report finalize\` 가 인용·신규 항목에 구현됨 도장을 찍고 신규 항목을 approved 로 바꾼다${bug ? '. "## 해소 부채" 는 장부 note 로 남는다' : ''}. 제품 노트 "현재" 의 구현됨 열이 늘어난다.`,
    ],
  };
}

function phaseGuidance(item, sessionId, requestSlug = null, options = {}) {
  if (!item) {
    if (!requestSlug) {
      return [
        'CEO가 단일 대화 창구다. 관련 작업을 검색하고 Feature 관계·규모를 제안한 뒤 사용자 확인을 받는다.',
        '이 요청에는 영어 단어가 없어 runtime 이 Feature 이름을 정하지 못했다. 사용자에게 kebab-case 영어 이름(예: `reading-log`)을 묻고, 사용자가 `/vais 이름: <name>` 으로 답할 때까지 Work item 을 만들지 않는다. AI 가 이름을 대신 정하면 CLI 가 거부한다.',
        ...kindLines(options.kindSuggestion),
      ];
    }
    const kindFlag = options.kindSuggestion ? ` --kind ${options.kindSuggestion.kind}` : '';
    return [
      'CEO가 단일 대화 창구다. 관련 작업을 검색하고 Feature 관계·규모를 제안한 뒤 사용자 확인을 받는다.',
      '확인 전에는 Work item을 만들지 않는다. 확인 후 Plan 본문을 `.vais/v2/drafts/plan.md`에 작성한다.',
      `이 요청에 런타임이 발급한 결정적 새 Feature slug는 \`${requestSlug}\`다. new 관계면 다른 이름을 만들지 않는다.`,
      ...kindLines(options.kindSuggestion),
      `\`${INTERNAL_COMMAND} plan present --slug ${requestSlug} --title "<title>" --feature <feature> --relation <new|existing> --scale <compact|standard|extended>${kindFlag} --session ${sessionId} --revision 1 --body-file .vais/v2/drafts/plan.md\`을 한 번 실행한다.`,
      '이 transaction이 Work item·Plan 검사·Gate를 처리한다. PASS일 때만 승인 요청하며, 실패하면 evidence finding만 고쳐 재실행한다.',
      'CPO Plan은 별도 Ideation 문서 없이 문제·목표·범위·REQ·흐름·엣지 케이스·완료 조건·영향만 담고 구현 결정은 Design에 남긴다. 요구사항 ID는 REQ-001처럼 3자리 형식으로 쓴다.',
    ];
  }
  const kind = kindOf(item);
  const stage = stageOfKind(kind);
  const stageLines = stage ? stagePhaseLines(item, kind, stage, sessionId)
    : kind?.screenCheck ? uiPhaseLines(item, kind, sessionId)
      : ['implementation', 'bugfix'].includes(kind?.designTemplate) ? implementationPhaseLines(item, kind, sessionId) : null;
  const byPhase = {
    plan: [
      'CPO가 요구사항·사용자 흐름·엣지 케이스를 구현 독립적으로 확정한다. 요구사항 ID는 REQ-001처럼 3자리 형식으로 쓴다.',
      `Plan 초안은 \`${planDraftPath(item)}\` 에 쓴다 (승격 시 자동 삭제). 고친 뒤 \`${INTERNAL_COMMAND} plan present --id ${item.id} --session ${sessionId} --revision ${item.planRevision} --body-file ${planDraftPath(item)}\`을 한 번 실행한다. PASS일 때만 사용자 승인을 요청한다.`,
    ],
    design: [
      'CTO Design은 REQ별 동작·입력·출력·오류·UI/기술 결정·TC를 정하고 필요한 전문 영역만 선택한다. Do specialist 상한은 compact 1명, standard 2명이며 단순 test 실행 역할은 고르지 않는다. REQ-001/TC-001처럼 3자리 ID를 쓰고, 디렉터리 write scope는 path/**로 표시한다. check id는 등록된 test, e2e, build, lint, plugin-validator, dependency-scan, secret-scan 중에서만 고른다. "## 결정" 절의 불릿은 Design 승인 때 장부에 decision 으로 기록된다.',
      ...(options.ledgerLines || []),
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
  if (stage && stage.owner && ['plan', 'design', 'do'].includes(item.phase)) ownerByPhase[item.phase] = stage.owner;
  const owner = resolveRole(loadRoleCatalog(), ownerByPhase[item.phase]);
  const ownerPrompt = owner?.kind === 'role' ? buildRolePrompt(owner.role) : '';
  const phaseLines = stageLines && stageLines[item.phase]
    ? (item.phase === 'report' ? [...(byPhase.report || []), ...stageLines.report]
      : item.phase === 'review' && (kind?.screenCheck || ['implementation', 'bugfix'].includes(kind?.designTemplate)) ? [...stageLines.review, ...byPhase.review]
        : [...stageLines[item.phase], ...(item.phase === 'design' ? (options.ledgerLines || []) : [])])
    : (byPhase[item.phase] || []);
  return [
    `먼저 \`${INTERNAL_COMMAND} context --id ${item.id} --phase ${item.phase} --role ${ownerByPhase[item.phase]}\`로 bounded Context Capsule을 한 번 읽고, 원문 전체 재탐색은 capsule이 부족할 때만 한다.`,
    ...(ownerPrompt ? [`Current phase owner card (execute this responsibility in the main VAIS voice; do not spawn the owner as a specialist):\n${ownerPrompt}`] : []),
    ...phaseLines,
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

function quote(value) {
  return JSON.stringify(String(value ?? ''));
}

// Guidance for the user commands (docs/harness/design.md §7). Read commands run an
// unauthenticated CLI query and show its sentence verbatim; write commands run the CLI only
// because this turn's user sentence became a confirmation token in the session authorization.
function commandGuidance(route, sessionId, options = {}) {
  const cli = INTERNAL_COMMAND;
  switch (route.action) {
    case 'diagram': {
      const dir = options.diagramsDir || 'docs/diagrams';
      return [
        `사용자가 다이어그램을 요청했다: ${quote(route.request)}. \`skills/diagram/SKILL.md\` 를 Skill 도구(\`diagram\`)로 켜고 그 규칙대로 그린다. 저장 위치는 \`${dir}/<slug>.html\` 한 파일이며, runtime 이 이 턴의 write scope 에 \`${dir}/**\` 를 넣었다(활성 Work item 이 있으면 그 phase 폴더도 유지).`,
        `요청에 svg·png 가 있으면 \`${cli} diagram export --session ${sessionId} --file ${dir}/<slug>.html [--svg] [--png]\` 을 한 번 실행하고, 만들어진 PNG 는 Read 로 열어 응답에 보인다. 요청에 없는 내보내기는 만들지 않는다. Work item 상태는 바뀌지 않는다.`,
      ];
    }
    case 'status':
      return [`\`${cli} status\` 를 한 번 실행해 결과의 \`summary\` 문장을 그대로 보인다. 대기 요청(pending)이 있으면 함께 알린다.`, '이 action은 읽기 전용이다.'];
    case 'explain':
      return [`\`${cli} explain --target ${quote(route.target)}\` 를 한 번 실행해 \`text\` 를 그대로 보이고 \`refs\` 를 링크로 붙인다. \`kind\` 가 unknown 이면 모른다고 말하고 \`candidates\` 를 제시한다. 사전에 없는 뜻을 지어내지 않는다.`, '이 action은 읽기 전용이다.'];
    case 'save':
      return [`\`${cli} save propose${route.message ? ` --message ${quote(route.message)}` : ''}\` 를 한 번 실행한다. 결과가 ok 면 버전·변경 파일·제안 메시지·경고를 보이고 사용자에게 \`/vais 저장 확인\` (또는 \`/vais 저장 확인: <메시지>\`) 을 안내한다. ok 가 아니면 reason 을 그대로 전한다. 커밋은 하지 않는다.`, '이 action은 읽기 전용이다.'];
    case 'save-confirm':
      return [`사용자가 저장을 직접 확인했고 runtime 이 이 세션에 확인 토큰을 등록했다. \`${cli} save commit --session ${sessionId}${route.message ? ` --message ${quote(route.message)}` : ''}\` 을 한 번 실행하고 커밋 해시·제목·파일 수를 보인다. push 는 사용자가 \`! git push\` 로 한다. 실패하면 reason 을 그대로 전하고 다시 시도하지 않는다.`];
    case 'revert':
      return [`\`${cli} revert propose --target ${quote(route.target)}\` 를 한 번 실행해 되돌릴 커밋(해시·제목·파일)과 경고를 보이고 \`/vais 되돌리기 확인: ${route.target}\` 을 안내한다. revert 는 하지 않는다.`, '이 action은 읽기 전용이다.'];
    case 'revert-confirm':
      return [`사용자가 되돌리기를 직접 확인했고 runtime 이 이 세션에 확인 토큰을 등록했다. \`${cli} revert commit --session ${sessionId} --target ${quote(route.target)}\` 을 한 번 실행하고 만들어진 revert 커밋을 보인다. 실패하면 reason 을 그대로 전한다.`];
    case 'propose':
      return [`\`${cli} propose\` 를 한 번 실행해 제안을 ①②③ 로 보인다. 근거(reason)를 한 줄씩 붙이고, 없는 제안을 만들지 않는다.`, '이 action은 읽기 전용이다.'];
    case 'ledger-list':
      return [`\`${cli} ledger list${route.kind ? ` --kind ${route.kind}` : ''} --limit 10\` 을 한 번 실행해 항목을 시간순으로 보인다.${route.rawKind && !route.kind ? ` "${route.rawKind}" 는 종류가 아니라 전체를 보인다.` : ''}`, '이 action은 읽기 전용이다.'];
    case 'ledger-add':
      return [`사용자가 장부 기록을 직접 요청했고 runtime 이 이 세션에 확인 토큰을 등록했다. \`${cli} ledger add --session ${sessionId} --kind ${route.kind} --text ${quote(route.text)}\` 을 한 번 실행하고 기록된 항목을 보인다. 내용을 고쳐 쓰지 않는다.`];
    default:
      return null;
  }
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
  const commandLines = commandGuidance(route, sessionId, { diagramsDir: options.diagramsDir });
  if (commandLines) {
    lines.push(...commandLines);
    return lines.join('\n');
  }
  if (route.action === 'queue-pending') {
    lines.push('현재 Work item은 변경하지 않았다. 새 요청은 Work item을 만들지 않고 pending에 보관했다.');
    lines.push('/vais status에서 대기 요청을 확인하고, 현재 작업 완료·일시정지·취소 후 사용자가 선택할 때만 새 Work item으로 만든다.');
    return lines.join('\n');
  }
  if (route.action === 'name-feature') {
    lines.push(`사용자가 Feature 이름 \`${route.slug}\` 을 확정했고 runtime 이 등록했다. 이 이름으로 Plan 을 진행한다.`);
    lines.push(...phaseGuidance(null, sessionId, route.slug, options));
    return lines.join('\n');
  }
  if (route.action === 'choose-option') {
    lines.push(`사용자가 안 ${route.option} 을 골랐고 runtime 이 기록했다 (장부 decision). 아직 승인은 아니다 — 사용자가 \`/vais design 승인\` 하면 Do 로 간다. 다른 안을 고르면 다시 \`/vais N번\`.`);
    return lines.join('\n');
  }
  if (route.action === 'screen-confirm') {
    lines.push('사용자가 화면을 확인했다. Review 로 넘어간다.');
  }
  if (route.action === 'screen-revise') {
    if (item?.status === 'blocked') {
      // The limit was reached: no more rounds, and the guidance must say so instead of promising one.
      const limit = kindOf(item)?.repairLimit || 5;
      lines.push(`화면 수정 상한 ${limit}회에 도달해 이 요청("${String(route.text).slice(0, 120)}")은 적용되지 않았고 작업은 blocked(${item.blockReason || 'screen-revision-limit'}) 상태다. 사용자에게 그대로 알린다: 지금 화면을 받아들이면 \`/vais 확인\` (Review 로 진행), 아니면 \`/vais cancel\` 로 작업을 취소하고 새 작업으로 다시 시작한다. 더 고치는 길은 없다.`);
      return lines.join('\n');
    }
    lines.push(`사용자의 화면 수정 요청("${String(route.text).slice(0, 120)}")이 장부에 취향으로 기록됐고 Design 세부 수정 단계로 돌아왔다. Design 정본에 "## 수정 회차 ${item?.screenRevisionCount || '?'}" 절로 요청과 바꿀 내용을 적고 material=false 로 제시한 뒤 Do 에서 적용해 다시 화면을 찍는다. 남은 수정 기회 ${Math.max(0, (kindOf(item)?.repairLimit || 5) - (item?.screenRevisionCount || 0))}회.`);
  }
  if (route.action === 'stage-confirm-unchanged') {
    lines.push(`사용자가 ${route.item} ← ${route.parent} 의 변경 없음을 확인했고 runtime 이 이 세션에 등록했다.`);
    lines.push(`\`${INTERNAL_COMMAND} stage confirm --session ${sessionId} --item ${route.item} --parent ${route.parent}\` 를 한 번 실행하고, \`${INTERNAL_COMMAND} stage status\` 로 남은 stale 을 보여준다.`);
    return lines.join('\n');
  }
  lines.push('현재 Work item과 event 상태 머신의 transaction을 순서대로 처리한다. 사용자 결정 Gate나 BLOCKED/FAIL에서만 멈추며, C-Level이나 Phase 직접 호출로 Gate를 우회하지 않는다.');
  lines.push(...phaseGuidance(item, sessionId, !item ? deterministicSlug(route.text) : null, options));
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
    'choose-option': EVENTS.USER_OPTION_CHOSEN,
    'screen-confirm': EVENTS.USER_SCREEN_CONFIRMED,
    'screen-revise': EVENTS.USER_SCREEN_REVISED,
    pause: EVENTS.USER_PAUSE,
    cancel: EVENTS.USER_CANCEL,
  };
  const event = eventByAction[route.action];
  if (!event || !current) return current;
  store.acquireLease(current.id, sessionId);
  // The user's own words travel with revisions, rejections, and screen requests so the ledger
  // keeps them as feedback or taste; an option choice carries its number.
  const payload = ['revise-plan', 'revise-design', 'reject-final', 'screen-revise'].includes(route.action)
    ? { reason: route.text }
    : route.action === 'choose-option' ? { option: route.option } : {};
  return store.apply(current.id, event, payload, { requireLease: true, sessionId });
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

// Only the user's own sentence in this turn becomes a write-command token.
function confirmationsFor(route) {
  if (route.action === 'save-confirm') return [{ type: 'save', message: route.message || null }];
  if (route.action === 'revert-confirm') return [{ type: 'revert', target: route.target }];
  if (route.action === 'ledger-add') return [{ type: 'ledger', kind: route.kind, text: route.text }];
  return [];
}

function requestSlugFor(route) {
  if (route.action === 'name-feature') return route.slug;
  if (route.action === 'start-request') return deterministicSlug(route.text);
  return null;
}

// Kind suggestion for a new request, with the entry-lock reason when the stage cannot start.
function kindSuggestionFor(projectRoot, route) {
  if (!['start-request', 'name-feature'].includes(route.action)) return null;
  const suggestion = suggestKind(route.text);
  let locked = null;
  try {
    assertStageEntry(projectRoot, getKind(suggestion.kind));
  } catch (error) {
    locked = error.message;
  }
  return { ...suggestion, locked };
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
      stageConfirmations: route.action === 'stage-confirm-unchanged' ? [{ item: route.item, parent: route.parent }] : [],
      confirmations: confirmationsFor(route),
      // `/vais diagram` adds the stand-alone drawing folder for this turn only (skills/diagram §10).
      allowedPaths: [...defaultAllowedPaths(active), ...(route.action === 'diagram' ? [`${loadDiagramConfig(projectRoot).dir}/**`] : [])],
      allowedCommands: [INTERNAL_COMMAND],
    });
    return emit(buildContext(route, active, null, sessionId, {
      kindSuggestion: kindSuggestionFor(projectRoot, route),
      ledgerLines: ledgerLinesFor(projectRoot, active),
      diagramsDir: loadDiagramConfig(projectRoot).dir,
    }));
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
  kindSuggestionFor,
  kindLines,
  stagePhaseLines,
  ledgerLinesFor,
  uiPhaseLines,
  implementationPhaseLines,
  commandGuidance,
  confirmationsFor,
  main,
};

if (require.main === module) main();
