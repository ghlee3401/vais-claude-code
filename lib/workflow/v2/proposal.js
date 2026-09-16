'use strict';

// Rule-based "what next" proposals (docs/harness/design.md §6). Reads only work-items.json,
// chain-index.json, and the ledger. Never calls a model; when the evidence is thin it
// proposes fewer items instead of inventing one.

const path = require('path');
const stateStore = require('../../core/state-store');
const { loadChainCatalog, getKind } = require('./chain-registry');
const idChain = require('./id-chain');
const ledger = require('./ledger');

const MAX_PROPOSALS = 3;
const SLOT_HOLDING = new Set(['active', 'waiting-user', 'blocked']);

function readRegistry(projectRoot, registry) {
  if (registry) return registry;
  const value = stateStore.read(path.join(path.resolve(projectRoot), '.vais', 'v2', 'work-items.json'));
  return value && value.schemaVersion === '1.0' ? value : { workItems: {}, currentWorkItemId: null, pendingRequests: [], events: [] };
}

function currentItem(registry) {
  const id = registry.currentWorkItemId;
  const item = id ? registry.workItems?.[id] : null;
  return item && SLOT_HOLDING.has(item.status) ? item : null;
}

function gateProposals(item) {
  const approvals = {
    plan: ['/vais plan 승인', 'Plan 을 읽고 요구사항이 맞으면 승인한다', '/vais <고칠 점>'],
    design: ['/vais design 승인', 'Design 의 안·쓰기 범위가 맞으면 승인한다', '/vais <고칠 점>'],
    review: ['/vais 최종 승인', '독립 QA 가 PASS 했으므로 결과를 받아들이면 승인한다', '/vais 거절 <이유>'],
  };
  const entry = approvals[item.phase];
  if (!entry) return [];
  return [
    { text: `${item.phase} 결정: ${entry[0]}`, command: entry[0], reason: entry[1] },
    { text: `또는 수정 요청: ${entry[2]}`, command: entry[2], reason: '승인하지 않으면 같은 단계에서 고친다' },
  ];
}

function nextStageProposal(index) {
  const stages = loadChainCatalog().stages;
  const next = stages.find(stage => index.stages?.[stage.id]?.status !== 'approved');
  if (!next) return null;
  const kind = loadChainCatalog().kinds.find(entry => entry.stage === next.id);
  const trigger = kind?.triggers?.[0] || next.title;
  const command = next.order === 1 ? `/vais ${trigger}: <제품 이름>` : `/vais ${trigger}`;
  return { text: `${next.order}단계 ${next.title} 작성`, command, reason: `아직 승인된 ${next.title} 가 없다` };
}

function propose(projectRoot, options = {}) {
  const registry = readRegistry(projectRoot, options.registry);
  const index = options.index || idChain.loadChainIndex(projectRoot);
  const entries = options.ledgerEntries || ledger.read(projectRoot).entries;
  const proposals = [];
  const item = currentItem(registry);

  if (item?.status === 'waiting-user') proposals.push(...gateProposals(item));
  else if (item?.status === 'blocked') {
    proposals.push({ text: `막힘 해소: ${item.blockReason || 'blocked'}`, command: '/vais <해소 방법>', reason: `${item.id} 가 blocked 상태다` });
  } else if (item?.status === 'active') {
    proposals.push({ text: `${item.phase} 이어가기`, command: '/vais 이어서 진행', reason: `${item.id} 가 ${item.phase} 진행 중이다` });
  }

  const stale = idChain.computeStale(index);
  for (const entry of stale.slice(0, 2)) {
    proposals.push(entry.parentMissing
      ? { text: `${entry.id} 의 부모 ${entry.parent} 가 삭제됨 — 재승인 필요`, command: `/vais ${entry.id} 부모 정리`, reason: '삭제된 부모를 가리키는 항목은 확인으로 풀 수 없다' }
      : { text: `stale 해소: ${entry.id} ← ${entry.parent}`, command: `/vais 변경 없음 확인: ${entry.id} ← ${entry.parent}`, reason: '상위 항목이 바뀌었다. 그대로면 확인, 아니면 재승인' });
  }

  if (!item) {
    const stage = nextStageProposal(index);
    if (stage) proposals.push(stage);
  }

  const debts = entries.filter(entry => entry.kind === 'debt').sort((left, right) => right.ts.localeCompare(left.ts)).slice(0, 3);
  for (const debt of debts) {
    if (proposals.length >= MAX_PROPOSALS) break;
    proposals.push({ text: `부채 정리: ${debt.text}`, command: `/vais ${debt.text}`, reason: `${debt.workItemId || '장부'} 에 남은 부채` });
  }

  if (proposals.length === 0) {
    const kind = getKind('stage-requirements');
    proposals.push({ text: '새 제품 시작', command: `/vais ${kind?.triggers?.[0] || '새 제품'}: <제품 이름>`, reason: '진행 중인 작업도 남은 단계도 없다' });
  }
  return proposals.slice(0, MAX_PROPOSALS);
}

function formatProposals(proposals) {
  const marks = ['①', '②', '③'];
  return proposals.map((proposal, index) => `${marks[index] || `${index + 1}.`} ${proposal.command}`).join(' ');
}

module.exports = { MAX_PROPOSALS, propose, formatProposals, currentItem, readRegistry };
