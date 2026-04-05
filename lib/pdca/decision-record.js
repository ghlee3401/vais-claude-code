/**
 * VAIS Code - Decision Record Chain
 * @module lib/pdca/decision-record
 * @version 1.0.0
 *
 * Tracks decisions from Plan → Design → Do → QA, linking
 * code changes back to their originating decisions.
 * @see bkit-claude-code/lib/pdca/decision-record.js
 */

const fs = require('fs');

// Lazy requires
let _paths = null;
function getPaths() {
  if (!_paths) { _paths = require('../paths'); }
  return _paths;
}

let _stateStore = null;
function getStateStore() {
  if (!_stateStore) { _stateStore = require('../core/state-store'); }
  return _stateStore;
}

// ── Decision Chain ─────────────────────────────────────────────────

/**
 * Build decision chain from existing PDCA documents
 * @param {string} feature
 * @param {string} [role='cto']
 * @returns {{plan:Object[], design:Object[], total:number}}
 */
function buildDecisionChain(feature, role) {
  const { findDoc } = getPaths();
  const chain = { plan: [], design: [], total: 0 };
  const effectiveRole = role || 'cto';

  // Extract from plan
  const planPath = findDoc('plan', feature, effectiveRole);
  if (planPath) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      chain.plan = extractDecisions(content, 'plan');
    } catch (_) { /* ignore */ }
  }

  // Extract from design
  const designPath = findDoc('design', feature, effectiveRole);
  if (designPath) {
    try {
      const content = fs.readFileSync(designPath, 'utf8');
      chain.design = extractDecisions(content, 'design');
    } catch (_) { /* ignore */ }
  }

  chain.total = chain.plan.length + chain.design.length;
  return chain;
}

/**
 * Extract decisions from document content
 * Looks for: decision tables, bullet points with "결정:", numbered items
 * @param {string} content
 * @param {string} phase
 * @returns {Array<{id:string, phase:string, summary:string}>}
 */
function extractDecisions(content, phase) {
  const decisions = [];
  const prefix = phase === 'plan' ? 'P' : 'D';

  // Pattern 1: "결정:" or "Decision:" bullet points
  const decisionLines = content.match(/[-*]\s*(?:결정|Decision|선택|Selected)[:\s]+(.+)/gi) || [];
  for (let i = 0; i < decisionLines.length; i++) {
    const summary = decisionLines[i].replace(/^[-*]\s*(?:결정|Decision|선택|Selected)[:\s]+/i, '').trim();
    decisions.push({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, phase, summary });
  }

  // Pattern 2: Feature registry items (FR-01, FR-02...)
  const frMatches = content.match(/FR-\d+[:\s]+(.+)/g) || [];
  for (const match of frMatches) {
    const parts = match.match(/FR-(\d+)[:\s]+(.+)/);
    if (parts) {
      decisions.push({ id: `FR-${parts[1]}`, phase, summary: parts[2].trim() });
    }
  }

  return decisions;
}

/**
 * Format decision chain as markdown
 * @param {{plan:Object[], design:Object[]}} chain
 * @returns {string}
 */
function formatDecisionChain(chain) {
  const lines = ['## Decision Record Chain', ''];

  if (chain.plan.length > 0) {
    lines.push('### Plan Decisions');
    for (const d of chain.plan) {
      lines.push(`- **[${d.id}]** ${d.summary}`);
    }
    lines.push('');
  }

  if (chain.design.length > 0) {
    lines.push('### Design Decisions');
    for (const d of chain.design) {
      lines.push(`- **[${d.id}]** ${d.summary}`);
    }
    lines.push('');
  }

  if (chain.plan.length === 0 && chain.design.length === 0) {
    lines.push('_No decisions recorded yet._');
  }

  return lines.join('\n');
}

/**
 * Generate PDCA-aware commit message prefix
 * @param {string} feature
 * @param {string} description
 * @param {string[]} [refs] - Decision references like ['Plan:FR-01', 'Design:§3.1']
 * @returns {string}
 */
function generateCommitMessage(feature, description, refs = []) {
  const refStr = refs.length > 0 ? ` [${refs.join('] [')}]` : '';
  return `feat(${feature}): ${description}${refStr}`;
}

/**
 * Generate code reference comment
 * @param {string} section - Design section (e.g., '§3.1')
 * @param {string} summary
 * @returns {string}
 */
function generateDesignRef(section, summary) {
  return `// Design Ref: ${section} — ${summary}`;
}

/**
 * Generate success criteria reference comment
 * @param {string} criteria
 * @returns {string}
 */
function generateSuccessCriteriaRef(criteria) {
  return `// Plan SC: ${criteria}`;
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  buildDecisionChain,
  extractDecisions,
  formatDecisionChain,
  generateCommitMessage,
  generateDesignRef,
  generateSuccessCriteriaRef,
};
