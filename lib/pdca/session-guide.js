/**
 * VAIS Code - Session Guide (Context Anchor)
 * @module lib/pdca/session-guide
 * @version 1.0.0
 *
 * Extracts and propagates Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE)
 * from plan documents to subsequent phases.
 * @see bkit-claude-code/lib/pdca/session-guide.js
 */

const fs = require('fs');

// Lazy requires
let _paths = null;
function getPaths() {
  if (!_paths) { _paths = require('../paths'); }
  return _paths;
}

// ── Context Anchor ─────────────────────────────────────────────────

/**
 * Extract Context Anchor from plan document content
 * @param {string} planContent - Markdown content of plan document
 * @returns {{WHY:string, WHO:string, RISK:string, SUCCESS:string, SCOPE:string}}
 */
function extractContextAnchor(planContent) {
  const anchor = {
    WHY: '',
    WHO: '',
    RISK: '',
    SUCCESS: '',
    SCOPE: '',
  };

  if (!planContent) return anchor;

  // Extract from Context Anchor section (up to next ## heading or EOF)
  const tableMatch = planContent.match(/Context\s*Anchor[\s\S]*?(?=\n##\s|$)/i);
  if (tableMatch) {
    const tableText = tableMatch[0];
    const whyMatch = tableText.match(/WHY\s*\|\s*([^\n|]+)/i);
    const whoMatch = tableText.match(/WHO\s*\|\s*([^\n|]+)/i);
    const riskMatch = tableText.match(/RISK\s*\|\s*([^\n|]+)/i);
    const successMatch = tableText.match(/SUCCESS\s*\|\s*([^\n|]+)/i);
    const scopeMatch = tableText.match(/SCOPE\s*\|\s*([^\n|]+)/i);

    if (whyMatch) anchor.WHY = whyMatch[1].trim();
    if (whoMatch) anchor.WHO = whoMatch[1].trim();
    if (riskMatch) anchor.RISK = riskMatch[1].trim();
    if (successMatch) anchor.SUCCESS = successMatch[1].trim();
    if (scopeMatch) anchor.SCOPE = scopeMatch[1].trim();
  }

  // Fallback: extract from sections
  if (!anchor.WHY) {
    const esMatch = planContent.match(/Executive\s*Summary[\s\S]*?(?=##|$)/i);
    if (esMatch) anchor.WHY = esMatch[0].substring(0, 200).trim();
  }

  if (!anchor.SUCCESS) {
    const scMatch = planContent.match(/Success\s*Criteria[\s\S]*?(?=##|$)/i);
    if (scMatch) {
      const lines = scMatch[0].split('\n').filter(l => l.trim().startsWith('-'));
      anchor.SUCCESS = lines.slice(0, 3).map(l => l.trim()).join('; ');
    }
  }

  if (!anchor.RISK) {
    const riskMatch = planContent.match(/Risk[\s\S]*?(?=##|$)/i);
    if (riskMatch) {
      const lines = riskMatch[0].split('\n').filter(l => l.trim().startsWith('-'));
      anchor.RISK = lines[0]?.trim() || '';
    }
  }

  return anchor;
}

/**
 * Format Context Anchor as markdown table
 * @param {{WHY:string, WHO:string, RISK:string, SUCCESS:string, SCOPE:string}} anchor
 * @returns {string}
 */
function formatContextAnchor(anchor) {
  return [
    '## Context Anchor',
    '| Key | Value |',
    '|-----|-------|',
    `| WHY | ${anchor.WHY || '-'} |`,
    `| WHO | ${anchor.WHO || '-'} |`,
    `| RISK | ${anchor.RISK || '-'} |`,
    `| SUCCESS | ${anchor.SUCCESS || '-'} |`,
    `| SCOPE | ${anchor.SCOPE || '-'} |`,
  ].join('\n');
}

/**
 * Load Context Anchor from feature's plan document
 * @param {string} feature
 * @param {string} [role='cto']
 * @returns {{WHY:string, WHO:string, RISK:string, SUCCESS:string, SCOPE:string}|null}
 */
function loadContextAnchor(feature, role) {
  const { findDoc } = getPaths();
  const planPath = findDoc('plan', feature, role || 'cto');
  if (!planPath) return null;

  try {
    const content = fs.readFileSync(planPath, 'utf8');
    return extractContextAnchor(content);
  } catch (_) {
    return null;
  }
}

/**
 * Extract success criteria from plan content
 * @param {string} planContent
 * @returns {string[]}
 */
function extractSuccessCriteria(planContent) {
  if (!planContent) return [];

  const scMatch = planContent.match(/Success\s*Criteria[\s\S]*?(?=##|$)/i);
  if (!scMatch) return [];

  return scMatch[0]
    .split('\n')
    .filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./))
    .map(l => l.replace(/^[-\d.)\s]+/, '').trim())
    .filter(Boolean);
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  extractContextAnchor,
  formatContextAnchor,
  loadContextAnchor,
  extractSuccessCriteria,
};
