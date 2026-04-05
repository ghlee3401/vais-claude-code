/**
 * VAIS Code - Template Validator
 * @module lib/quality/template-validator
 * @version 1.0.0
 *
 * Validates PDCA documents against required template sections.
 * Hard enforcement: missing sections block phase transition.
 * @see bkit-claude-code/lib/pdca/template-validator.js
 */

// ── Required Sections (VAIS templates) ─────────────────────────────

/**
 * Required sections per document type.
 * Derived from templates/*.template.md
 */
const REQUIRED_SECTIONS = {
  plan: [
    'Executive Summary',
    'Context Anchor',
    'MVP Scope',
    'Feature Definition',
    'Success Criteria',
    'Coding Rules',
  ],
  design: [
    'Executive Summary',
    'Architecture Options',
    'Interface Contract',
    'UI Design',
    'Infra Design',
  ],
  do: [
    'Implementation Checklist',
    'Code Structure',
    'Key Files',
  ],
  qa: [
    'Build Verification',
    'Gap Analysis',
    'Security Scan',
    'Code Quality',
    'QA Scenarios',
  ],
  report: [
    'Executive Summary',
    'Version History',
  ],
  // C-Level specific
  prd: [
    'Executive Summary',
    'Opportunity Discovery',
    'Value Proposition',
    'Product Requirements',
  ],
  security: [
    'Executive Summary',
    'OWASP',
    'Critical',
  ],
  finance: [
    'Executive Summary',
    'Cost Analysis',
    'ROI',
  ],
};

// ── Detection & Validation ─────────────────────────────────────────

/**
 * Detect document type from file path
 * @param {string} filePath
 * @returns {string|null} Document type
 */
function detectDocumentType(filePath) {
  if (!filePath || !filePath.endsWith('.md')) return null;

  if (filePath.includes('.plan.md') || filePath.includes('01-plan/')) return 'plan';
  if (filePath.includes('.design.md') || filePath.includes('02-design/')) return 'design';
  if (filePath.includes('.do.md') || filePath.includes('03-do/')) return 'do';
  if (filePath.includes('.qa.md') || filePath.includes('04-qa/')) return 'qa';
  if (filePath.includes('.report.md') || filePath.includes('05-report/')) return 'report';
  if (filePath.includes('.prd.md')) return 'prd';
  if (filePath.includes('security')) return 'security';
  if (filePath.includes('finance')) return 'finance';

  return null;
}

/**
 * Extract ## level section headers from markdown
 * @param {string} content
 * @returns {string[]}
 */
function extractSections(content) {
  const pattern = /^##\s+(?:\d+[\.\d]*\s+)?(.+)$/gm;
  const sections = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

/**
 * Validate document against required sections
 * @param {string} filePath
 * @param {string} content
 * @returns {{valid:boolean, missing:string[], type:string|null, sections:string[]}}
 */
function validateDocument(filePath, content) {
  const type = detectDocumentType(filePath);
  if (!type) return { valid: true, missing: [], type: null, sections: [] };

  const required = REQUIRED_SECTIONS[type] || [];
  const actual = extractSections(content);

  const missing = required.filter(section =>
    !actual.some(a => a.toLowerCase().includes(section.toLowerCase()))
  );

  return { valid: missing.length === 0, missing, type, sections: actual };
}

/**
 * Format validation result as warning message
 * @param {{valid:boolean, missing:string[], type:string|null}} result
 * @returns {string|null}
 */
function formatValidationWarning(result) {
  if (!result || result.valid || !result.type) return null;

  return [
    `[VAIS] Template Compliance Warning (${result.type}):`,
    `  Missing sections: ${result.missing.join(', ')}`,
    '  Add missing sections to proceed.',
  ].join('\n');
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  REQUIRED_SECTIONS,
  detectDocumentType,
  extractSections,
  validateDocument,
  formatValidationWarning,
};
