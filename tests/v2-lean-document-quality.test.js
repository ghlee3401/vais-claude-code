'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const workflow = require('../lib/workflow/v2');
const quality = {
  ...require('../lib/workflow/v2/document-quality'),
  ...workflow,
};
const {
  DOCUMENT_BUDGETS,
  createInitialWorkItem,
  evaluateDocumentBudget,
  evaluateDocumentRepetition,
  findCrossPhaseRepetition,
  writePhaseDocument,
} = quality;

const T0 = '2026-09-02T00:00:00.000Z';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-lean-docs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function item(scale = 'compact') {
  return createInitialWorkItem({
    id: `WI-2026-09-02-${scale}-budget`,
    title: `${scale} budget`,
    primaryFeature: 'workflow',
    affectedFeatures: [],
    scale,
  }, T0);
}

describe('v2 scale-aware authored Markdown quality', () => {
  it('enforces every compact, standard, and extended phase byte boundary', () => {
    for (const [scale, phases] of Object.entries(DOCUMENT_BUDGETS)) {
      for (const [phase, limit] of Object.entries(phases)) {
        const atLimit = evaluateDocumentBudget({ scale, phase, bytes: limit });
        assert.equal(atLimit.verdict, 'pass', `${scale}/${phase} should allow ${limit}B`);
        const overflow = evaluateDocumentBudget({ scale, phase, bytes: limit + 1 });
        assert.equal(overflow.verdict, 'fail', `${scale}/${phase} should reject ${limit + 1}B`);
      }
    }
  });

  it('allows extended overflow only with both a reason and explicit user approval', () => {
    const bytes = DOCUMENT_BUDGETS.extended.design + 1;
    assert.equal(evaluateDocumentBudget({
      scale: 'extended', phase: 'design', bytes,
      frontmatter: { budget_exception: { reason: 'Public API migration matrix', approved_by: 'cto' } },
    }).verdict, 'fail');
    assert.equal(evaluateDocumentBudget({
      scale: 'extended', phase: 'design', bytes,
      frontmatter: { budget_exception: { reason: 'Public API migration matrix', approved_by: 'user' } },
    }).verdict, 'pass');
  });

  it('finds a copied long authored sentence across phases with source paths', t => {
    const root = fixture(t);
    const workItem = item();
    const copied = 'A booking request must remain idempotent across repeated clicks while preserving the exact selected class and visible confirmation state.';
    writePhaseDocument(root, workItem, 'plan', `# Plan\n\n${copied}\n`, { status: 'approved' });
    writePhaseDocument(root, workItem, 'design', `# Design\n\n${copied}\n`, { status: 'draft' });
    const findings = findCrossPhaseRepetition(root, workItem, 'design');
    assert.equal(findings.length, 1);
    assert.match(findings[0].current, /02-design\/main\.md$/);
    assert.match(findings[0].sources[0], /01-plan\/main\.md$/);
    assert.equal(evaluateDocumentRepetition(root, workItem, 'design').verdict, 'fail');
  });

  it('does not flag repeated requirement IDs and canonical links by themselves', t => {
    const root = fixture(t);
    const workItem = item();
    writePhaseDocument(root, workItem, 'plan', [
      '# Plan', '', 'REQ-001', '', '[Canonical requirement](../01-plan/main.md#req-001)', '',
    ].join('\n'), { status: 'approved' });
    writePhaseDocument(root, workItem, 'review', [
      '# Review', '', 'REQ-001', '', '[Canonical requirement](../01-plan/main.md#req-001)', '',
    ].join('\n'), { status: 'draft' });
    assert.deepEqual(findCrossPhaseRepetition(root, workItem, 'review'), []);
    assert.equal(evaluateDocumentRepetition(root, workItem, 'review').verdict, 'pass');
  });
});
