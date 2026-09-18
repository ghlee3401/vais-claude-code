'use strict';

// harness-guidance-limits (4.2.1): every limit the runtime enforces is shown to the AI beforehand,
// taken from the same constant. TC ids follow the Design of WI-2026-09-17-harness-guidance-limits.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const { REPORT_LIMITS, assertReportInputs } = require('../lib/workflow/v2/phase-transaction');
const { buildSpecialistAssignment, describeHandoffLimits, QA_HANDOFF_SHAPE_LIMITS, QA_HANDOFF_LIMITS, QA_HANDOFF_TARGETS } = require('../lib/workflow/v2/contracts');
const { routePrompt, NAME_FEATURE } = require('../lib/workflow/v2/router');
const prompt = require('../hooks/workflow-v2-prompt');

const ROOT = path.join(__dirname, '..');
const ITEM = { id: 'WI-2026-09-17-limits', primaryFeature: 'limits', phase: 'report', status: 'active', designRevision: 1, scale: 'compact', kind: 'harness' };

describe('harness-guidance-limits TC-001 report outcome limit', () => {
  it('is 700, rejects 701, and appears in the Report guidance from the constant', () => {
    assert.equal(REPORT_LIMITS.outcome, 700);
    assert.doesNotThrow(() => assertReportInputs({ outcome: '가'.repeat(700) }));
    assert.throws(() => assertReportInputs({ outcome: '가'.repeat(701) }), error => error.code === 'REPORT_OUTCOME_TOO_LONG' && /700자/.test(error.message));
    const guidance = prompt.phaseGuidance(ITEM, 'sess').join('\n');
    assert.match(guidance, new RegExp(`--outcome 은 ${REPORT_LIMITS.outcome}자 이내`));
    assert.match(guidance, new RegExp(`--limitation 은 각 ${REPORT_LIMITS.limitation}자 이내`));
    assert.match(guidance, /거부/);
  });
});

describe('harness-guidance-limits TC-002 report limitation limit', () => {
  it('is 300 per entry and rejects instead of truncating', () => {
    assert.equal(REPORT_LIMITS.limitation, 300);
    assert.doesNotThrow(() => assertReportInputs({ outcome: 'ok', limitations: ['가'.repeat(300), '나'.repeat(10)] }));
    assert.throws(() => assertReportInputs({ outcome: 'ok', limitations: ['짧다', '가'.repeat(301)] }),
      error => error.code === 'REPORT_LIMITATION_TOO_LONG' && /2번째/.test(error.message) && /300자/.test(error.message));
    const source = fs.readFileSync(path.join(ROOT, 'lib', 'workflow', 'v2', 'phase-transaction.js'), 'utf8');
    assert.match(source, /input\.limitations\.map\(value => `- \$\{String\(value\)\}`\)/, 'limitation bullets are written whole, not truncated');
  });
});

describe('harness-guidance-limits TC-003 QA output contract guidance', () => {
  it('describes every scale from the contract itself and states the files rule', () => {
    for (const scale of ['compact', 'standard', 'extended']) {
      const assignment = buildSpecialistAssignment({
        role: 'independent-qa', delegatedBy: 'ceo', phase: 'review', mode: 'verification', question: 'q', codeWrite: false,
        writeScope: [], completionCriteria: ['c'], context: { refs: [], receipts: [], cleanRoom: true }, scale,
      });
      const text = describeHandoffLimits(assignment.outputContract);
      const shape = QA_HANDOFF_SHAPE_LIMITS[scale];
      assert.match(text, new RegExp(`judgment ≤ ${shape.judgment}자`));
      assert.match(text, new RegExp(`decisions ${shape.decisions[0]}개 × ${shape.decisions[1]}자`));
      assert.match(text, new RegExp(`behavior\\.inputs/outputs/errors 각 ${shape.behavior[0]}개 × ${shape.behavior[1]}자`));
      assert.match(text, new RegExp(`evidence ${shape.evidence[0]}개 × ${shape.evidence[1]}자`));
      assert.match(text, new RegExp(`risks ${shape.risks[0]}개 × ${shape.risks[1]}자`));
      assert.match(text, new RegExp(`unverified ${shape.unverified[0]}개 × ${shape.unverified[1]}자`));
      assert.match(text, new RegExp(`recommendedChecks ${shape.checks[0]}개 × ${shape.checks[1]}자`));
      assert.match(text, new RegExp(`affectedRequirements ≤ ${shape.requirements}개`));
      assert.match(text, new RegExp(`최대 ${QA_HANDOFF_LIMITS[scale]}B, 목표 ${QA_HANDOFF_TARGETS[scale]}B`));
      assert.match(text, /`files`[^\n]*codeWrite 가 false/);
      assert.match(text, /한국어도 1로/);
    }
    const reviewLines = prompt.phaseGuidance({ ...ITEM, phase: 'review' }, 'sess').join('\n');
    assert.match(reviewLines, /`guidance`/);
    assert.match(reviewLines, /`files` 를 넣지/);
    const agent = fs.readFileSync(path.join(ROOT, 'agents', 'v2-specialist.md'), 'utf8');
    assert.match(agent, /`guidance`/);
    assert.match(agent, /leave `files` out/);
    assert.match(agent, /80%/);
  });
});

describe('harness-guidance-limits TC-004 feature name', () => {
  it('takes only the kebab token after 이름: and ignores the rest of the sentence', () => {
    const named = routePrompt('/vais 이름: a-b 추려서 Plan', null);
    assert.equal(named.action, 'name-feature');
    assert.equal(named.slug, 'a-b');
    assert.equal(routePrompt('/vais 이름: harness-diagram-skill', null).slug, 'harness-diagram-skill');
    assert.equal(routePrompt('/vais name: My-Feature-v2 and more words', null).slug, 'my-feature-v2');
    assert.notEqual(routePrompt('/vais 이름: bad_name!', null).action, 'name-feature');
    assert.notEqual(routePrompt('/vais 이름:', null).action, 'name-feature');
    assert.ok(NAME_FEATURE.test('이름: x-y 뒤 문장'));
  });
});
