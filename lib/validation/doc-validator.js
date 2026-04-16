/**
 * VAIS Code - Document Validator
 * @module lib/validation/doc-validator
 *
 * Phase별 필수 산출물 존재 + 최소 크기 검증.
 *
 * @see docs/01-plan/features/v050/07-harness-gates.plan.md §3
 */

const fs = require('fs');
const path = require('path');

const MIN_SIZE_BYTES = 500;

const TEMPLATE_OUTPUTS = {
  plan:     ['REQUIREMENTS.md', 'SCOPE.md', 'TIMELINE.md'],
  design:   ['DESIGN_SPEC.md', 'ARCHITECTURE.md'],
  do:       ['IMPLEMENTATION.md', 'TEST_RESULTS.md'],
  qa:       ['QA_REPORT.md', 'COMPLIANCE_REPORT.md'],
  report:   ['FINAL_REPORT.md', 'RETROSPECTIVE.md'],
  ideation: ['{role}_{feature}.md'],
};

const TEMPLATE_OUTPUTS_BY_ROLE = {};

function getExpectedOutputs(phase, role) {
  const roleOverride = TEMPLATE_OUTPUTS_BY_ROLE[role]?.[phase];
  const base = TEMPLATE_OUTPUTS[phase] || [];
  return roleOverride ? [...base, ...roleOverride] : base;
}

function resolveDocDir(feature, phase) {
  const phaseMap = {
    ideation: '00-ideation',
    plan: '01-plan',
    design: '02-design',
    do: '03-do',
    qa: '04-qa',
    report: '05-report',
  };
  const dir = phaseMap[phase];
  if (!dir) return null;
  return path.join(process.cwd(), 'docs', dir);
}

function validate(feature, phase, role) {
  const dir = resolveDocDir(feature, phase);
  if (!dir) {
    return { valid: false, results: [{ file: '(unknown phase)', exists: false, hasContent: false, valid: false, reason: `unknown phase: ${phase}` }] };
  }

  const expected = getExpectedOutputs(phase, role);
  if (expected.length === 0) {
    return { valid: true, results: [] };
  }

  const results = [];
  let allValid = true;

  for (const tmpl of expected) {
    const filename = tmpl
      .replace('{role}', role || 'cto')
      .replace('{feature}', feature);

    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(f => f.includes(feature))
      : [];

    const exactMatch = path.join(dir, filename);
    const exists = fs.existsSync(exactMatch) || files.length > 0;
    let hasContent = false;
    let valid = false;

    if (fs.existsSync(exactMatch)) {
      const size = fs.statSync(exactMatch).size;
      hasContent = size >= MIN_SIZE_BYTES;
      valid = hasContent;
    } else if (files.length > 0) {
      const firstFile = path.join(dir, files[0]);
      const size = fs.statSync(firstFile).size;
      hasContent = size >= MIN_SIZE_BYTES;
      valid = hasContent;
    }

    if (!valid) allValid = false;
    results.push({
      file: filename,
      exists,
      hasContent,
      valid,
      reason: !exists ? 'file not found' : !hasContent ? `size < ${MIN_SIZE_BYTES}B` : null,
    });
  }

  return { valid: allValid, results };
}

function validateIdeationSections(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  const required = ['## Key Points', '## Decisions', '## Open Questions', '## Next Step'];
  return required.every(h => content.includes(h));
}

module.exports = {
  validate,
  validateIdeationSections,
  TEMPLATE_OUTPUTS,
  TEMPLATE_OUTPUTS_BY_ROLE,
  MIN_SIZE_BYTES,
};
