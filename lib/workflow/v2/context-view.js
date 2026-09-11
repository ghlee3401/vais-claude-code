'use strict';

const ROLE_CLASSES = Object.freeze({
  cpo: ['plan', 'feature', 'report'],
  cto: ['plan', 'design', 'code', 'feature', 'report'],
  'backend-engineer': ['plan', 'design', 'code', 'contract'],
  'frontend-engineer': ['plan', 'design', 'code', 'ui'],
  'ui-designer': ['plan', 'design', 'ui', 'feature'],
  'security-auditor': ['plan', 'design', 'code', 'security', 'check'],
  'independent-qa': ['plan', 'design', 'code', 'check', 'evidence'],
  ceo: ['plan', 'design', 'feature', 'report', 'status'],
});

function buildContextView(input) {
  const role = input.role;
  const allowedClasses = new Set(ROLE_CLASSES[role] || ['plan', 'design', 'code']);
  const cleanRoom = role === 'independent-qa' || input.cleanRoom === true;
  const selected = [];
  for (const candidate of input.candidates || []) {
    if (!candidate?.path || !allowedClasses.has(candidate.class)) continue;
    if (cleanRoom && candidate.source === 'implementation-self-evaluation') continue;
    selected.push({
      path: candidate.path,
      class: candidate.class,
      reason: candidate.reason || `required-for-${role}`,
      hash: candidate.hash || null,
    });
  }
  const unique = [];
  const seen = new Set();
  for (const ref of selected) {
    if (seen.has(ref.path)) continue;
    seen.add(ref.path);
    unique.push(ref);
  }
  return {
    role,
    phase: input.phase,
    cleanRoom,
    refs: unique,
    receipts: [...(input.receipts || [])],
  };
}

function addSearchReceipt(view, receipt) {
  if (!receipt?.query || !Array.isArray(receipt.paths)) throw new Error('Search receipt requires query and paths');
  return {
    ...view,
    receipts: [
      ...(view.receipts || []),
      {
        query: receipt.query,
        reason: receipt.reason || 'on-demand-search',
        paths: [...new Set(receipt.paths)],
        searchedAt: new Date(receipt.searchedAt || Date.now()).toISOString(),
      },
    ],
  };
}

module.exports = { ROLE_CLASSES, buildContextView, addSearchReceipt };
