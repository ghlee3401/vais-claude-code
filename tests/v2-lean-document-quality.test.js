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

// harness-doc-budget (4.1.0): defaults raised from the H1~H8 measurements and made configurable.
describe('harness-doc-budget document budgets', () => {
  const { STAGE_PHASE_BUDGETS } = require('../lib/workflow/v2/document-quality');
  const { mergeDocumentBudgets, loadDocumentBudgets } = require('../lib/workflow/v2/config');
  const { runDoctor } = require('../lib/workflow/v2/doctor');

  it('TC-001 the default table is the approved Design table', () => {
    assert.deepEqual(DOCUMENT_BUDGETS, {
      compact: { plan: 8192, design: 12288, do: 4096, review: 7168, report: 4096 },
      standard: { plan: 9216, design: 14336, do: 5120, review: 9216, report: 4096 },
      extended: { plan: 14336, design: 26624, do: 8192, review: 14336, report: 7168 },
    });
    assert.deepEqual(STAGE_PHASE_BUDGETS, { plan: 3072, design: 8192, do: 4096, review: 6144, report: 4096 });
  });

  it('TC-001 every measured H1~H8 document sits at or below 75 % of the new limit', () => {
    // Largest authored Markdown per old (scale, limit) pool, from docs/work-items/**/document-budget.json.
    // Pools whose old limit was shared by two phases are checked against the smaller new limit.
    // The one approved extended-design exception (28,280B) is excluded: it stays an exception.
    const measured = [
      ['compact', ['plan'], 3860], ['compact', ['design'], 4410], ['compact', ['do', 'report'], 1631], ['compact', ['review'], 2299],
      ['standard', ['plan', 'review'], 6110], ['standard', ['design'], 10208], ['standard', ['do'], 3131], ['standard', ['report'], 2235],
      ['extended', ['plan', 'review'], 7239], ['extended', ['design'], 12980], ['extended', ['do'], 4881], ['extended', ['report'], 2464],
    ];
    for (const [scale, phases, bytes] of measured) {
      const limit = Math.min(...phases.map(phase => DOCUMENT_BUDGETS[scale][phase]));
      assert.ok(bytes <= limit * 0.75, `${scale}/${phases.join('|')}: ${bytes}B exceeds 75% of ${limit}B`);
    }
  });

  it('TC-002 a project overrides one cell, keeps the rest, and bad cells are ignored', t => {
    const merged = mergeDocumentBudgets({ standard: { design: 20480, do: 0, review: -1, report: 'x', _note: 'comment' }, weird: { plan: 1 }, compact: [] });
    assert.equal(merged.budgets.standard.design, 20480);
    assert.equal(merged.budgets.standard.do, DOCUMENT_BUDGETS.standard.do);
    assert.equal(merged.budgets.compact.plan, DOCUMENT_BUDGETS.compact.plan);
    assert.equal(merged.overridden, 1);
    assert.deepEqual(merged.ignored.map(text => text.split(' ')[0]), ['standard.do=0', 'standard.review=-1', 'standard.report="x"', 'weird', 'compact']);
    assert.equal(evaluateDocumentBudget({ scale: 'standard', phase: 'design', bytes: 15000 }).verdict, 'fail');
    assert.equal(evaluateDocumentBudget({ scale: 'standard', phase: 'design', bytes: 15000, budgets: { standard: { design: 20480 } } }).verdict, 'pass');
    assert.equal(evaluateDocumentBudget({ scale: 'compact', kind: 'stage-features', phase: 'plan', bytes: 3073 }).verdict, 'fail');
    assert.equal(evaluateDocumentBudget({ scale: 'compact', kind: 'stage-features', phase: 'plan', bytes: 3073, budgets: { stage: { plan: 4096 } } }).verdict, 'pass');

    const root = fixture(t);
    const workItem = item('standard');
    writePhaseDocument(root, workItem, 'design', `# Design\n\n${'x'.repeat(15000)}\n`, { status: 'draft' });
    assert.equal(evaluateDocumentBudget(root, workItem, 'design').verdict, 'fail', 'no config file → defaults');
    fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ workflowV2: { mode: 'enforce' }, documentBudgets: { standard: { design: 20480 } } }));
    assert.equal(evaluateDocumentBudget(root, workItem, 'design').verdict, 'pass', 'config override applies to the real file');
    assert.equal(loadDocumentBudgets(root).overridden, 1);
    fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ workflowV2: { mode: 'enforce' }, documentBudgets: { standard: { design: 0 } } }));
    assert.equal(evaluateDocumentBudget(root, workItem, 'design').verdict, 'fail', 'invalid cell falls back to the default');
    const doctor = runDoctor(root, { env: {}, homeDir: root }).checks.find(check => check.id === 'document-budgets');
    assert.equal(doctor.verdict, 'warn');
    assert.match(doctor.detail, /standard\.design=0/);
  });

  it('TC-003 the overflow finding names the three ways out in user words', () => {
    const standard = evaluateDocumentBudget({ scale: 'standard', phase: 'design', bytes: 14337 }).findings[0];
    assert.match(standard, /본문 14337B 가 standard design 한도 14336B 를 넘는다/);
    assert.match(standard, /① 본문 줄이기/);
    assert.match(standard, /② `--scale` 올리기/);
    assert.match(standard, /③ vais\.config\.json > documentBudgets\.standard\.design 올리기/);
    const extended = evaluateDocumentBudget({ scale: 'extended', phase: 'design', bytes: 26625 }).findings[0];
    assert.match(extended, /② frontmatter `budget_exception`/);
    assert.match(extended, /documentBudgets\.extended\.design/);
    const stage = evaluateDocumentBudget({ scale: 'compact', kind: 'stage-features', phase: 'plan', bytes: 3073 }).findings[0];
    assert.match(stage, /stage plan 한도 3072B/);
    assert.match(stage, /documentBudgets\.stage\.plan/);
  });
});
