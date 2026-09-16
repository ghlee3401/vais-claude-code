'use strict';

// Product note (docs/harness/design.md §6): three generated pages under docs/product/ that a
// non-developer reads instead of the work-item tree. 현재 = README.md, 다음 = roadmap.md,
// 왜 = decisions.md. 과거 stays in docs/README.md. Every page is rebuilt from the same three
// runtime files at Report finalize; only the user block in roadmap.md survives verbatim.

const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');
const { loadChainCatalog } = require('./chain-registry');
const idChain = require('./id-chain');
const ledger = require('./ledger');
const proposal = require('./proposal');

const USER_BLOCK_START = '<!-- vais:user -->';
const USER_BLOCK_END = '<!-- /vais:user -->';
const USER_BLOCK_DEFAULT = '(여기에 직접 적은 메모는 다음 생성 때도 보존된다.)';
const MAX_DECISION_LINES = 400;
const KIND_TITLES = Object.freeze({
  decision: '결정', feedback: '피드백', preference: '취향', debt: '부채', risk: '리스크', milestone: '이정표', note: '메모',
});

function productDir(projectRoot) {
  return path.join(path.resolve(projectRoot), loadChainCatalog().productRoot);
}

function productNotePaths(projectRoot) {
  const dir = productDir(projectRoot);
  return { current: path.join(dir, 'README.md'), roadmap: path.join(dir, 'roadmap.md'), decisions: path.join(dir, 'decisions.md') };
}

function day(value) {
  return value ? String(value).slice(0, 10) : '—';
}

function stamp(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—';
}

function renderCurrent(projectRoot, context = {}) {
  const index = context.index || idChain.loadChainIndex(projectRoot);
  const stale = idChain.computeStale(index);
  const lines = [
    '# 제품 노트 — 현재',
    '',
    '> 자동 생성 (Report finalize 마다). 정본은 각 단계 문서의 frontmatter 와 `.vais/v2/chain-index.json`.',
    '',
    '| 순서 | 문서 | 상태 | 항목 | 구현됨 | 승인일 | 작업 |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const stage of loadChainCatalog().stages) {
    const entry = index.stages?.[stage.id];
    const items = Object.values(index.items || {}).filter(item => item.stage === stage.id);
    const staleCount = stale.filter(record => items.some(item => item.id === record.id)).length;
    const drafts = items.filter(item => item.status === 'draft').length;
    const implemented = items.filter(item => item.implemented).length;
    const status = !entry ? '미작성' : staleCount > 0 ? `approved · stale ${staleCount}` : drafts > 0 ? `approved · draft ${drafts}` : entry.status;
    lines.push(`| ${stage.order} | [${stage.title}](${path.posix.basename(stage.file)}) | ${status} | ${items.length} | ${implemented} | ${day(entry?.approvedAt)} | ${entry?.workItem || '—'} |`);
  }
  lines.push('', `stale 항목 ${stale.length}개${stale.length ? `: ${stale.map(record => `${record.id} ← ${record.parent}`).join(', ')}` : ''}.`, '');
  return `${lines.join('\n')}\n`;
}

function userBlock(existing) {
  const start = existing.indexOf(USER_BLOCK_START);
  const end = existing.indexOf(USER_BLOCK_END);
  if (start === -1 || end === -1 || end < start) return USER_BLOCK_DEFAULT;
  return existing.slice(start + USER_BLOCK_START.length, end).trim() || USER_BLOCK_DEFAULT;
}

function renderRoadmap(projectRoot, context = {}) {
  const index = context.index || idChain.loadChainIndex(projectRoot);
  const remaining = loadChainCatalog().stages.filter(stage => index.stages?.[stage.id]?.status !== 'approved');
  const proposals = proposal.propose(projectRoot, { registry: context.registry, index, ledgerEntries: context.ledgerEntries });
  const existing = context.existing ?? (fs.existsSync(productNotePaths(projectRoot).roadmap)
    ? fs.readFileSync(productNotePaths(projectRoot).roadmap, 'utf8') : '');
  const lines = [
    '# 제품 노트 — 다음',
    '',
    '> 자동 생성. 아래 "내 메모" 표식 사이만 손으로 고칠 수 있고 나머지는 Report 마다 다시 쓰인다.',
    '',
    '## 남은 단계',
    '',
    ...(remaining.length ? remaining.map(stage => `- ${stage.order}단계 ${stage.title} (\`${stage.file}\`)`) : ['- 없음 — 10단계가 모두 approved']),
    '',
    '## 제안',
    '',
    ...(proposals.length ? proposals.map((entry, position) => `${position + 1}. ${entry.text} — \`${entry.command}\` (${entry.reason})`) : ['- 근거가 없어 제안하지 않는다']),
    '',
    '## 내 메모',
    '',
    USER_BLOCK_START,
    userBlock(existing),
    USER_BLOCK_END,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function renderDecisions(entries) {
  const sorted = [...entries].sort((left, right) => right.ts.localeCompare(left.ts));
  const lines = [
    '# 제품 노트 — 왜',
    '',
    `> 자동 생성 (\`.vais/v2/ledger.jsonl\` ${sorted.length}건). 결정·피드백·취향·부채·리스크·이정표 순.`,
    '',
  ];
  let budget = MAX_DECISION_LINES;
  for (const kind of ['decision', 'feedback', 'preference', 'debt', 'risk', 'milestone', 'note']) {
    const group = sorted.filter(entry => entry.kind === kind);
    if (group.length === 0) continue;
    lines.push(`## ${KIND_TITLES[kind]} (${group.length})`, '');
    for (const entry of group) {
      if (budget <= 0) break;
      const why = entry.why ? ` — ${entry.why}` : '';
      lines.push(`- ${stamp(entry.ts)} · ${entry.workItemId || '—'} · ${entry.text}${why}`);
      budget -= 1;
    }
    lines.push('');
  }
  if (sorted.length === 0) lines.push('- 아직 기록이 없다.', '');
  return `${lines.join('\n')}\n`;
}

function renderProductNote(projectRoot, context = {}) {
  const index = context.index || idChain.loadChainIndex(projectRoot);
  const ledgerEntries = context.ledgerEntries || ledger.read(projectRoot).entries;
  return {
    current: renderCurrent(projectRoot, { index }),
    roadmap: renderRoadmap(projectRoot, { index, registry: context.registry, ledgerEntries, existing: context.existingRoadmap }),
    decisions: renderDecisions(ledgerEntries),
  };
}

function writeProductNote(projectRoot, context = {}) {
  const paths = productNotePaths(projectRoot);
  for (const file of Object.values(paths)) {
    if (!normalizeRelative(projectRoot, file)) throw new Error('Product note path escapes the project through a symbolic link');
  }
  const rendered = renderProductNote(projectRoot, context);
  atomicWrite(paths.current, rendered.current);
  atomicWrite(paths.roadmap, rendered.roadmap);
  atomicWrite(paths.decisions, rendered.decisions);
  return Object.values(paths);
}

module.exports = {
  USER_BLOCK_START,
  USER_BLOCK_END,
  productNotePaths,
  renderCurrent,
  renderRoadmap,
  renderDecisions,
  renderProductNote,
  writeProductNote,
};
