'use strict';

const path = require('path');
const { parseDocument, PHASE_FOLDERS, workItemDirectory } = require('./document-manager');
const { evaluateDocumentBudget, evaluateDocumentRepetition } = require('./document-quality');

const REQUIRED_SECTIONS = Object.freeze({
  plan: [
    ['problem', /(?:^|\n)#{1,6}\s+.*(?:문제|problem)/i],
    ['goal', /(?:^|\n)#{1,6}\s+.*(?:목표|goal|outcome)/i],
    ['scope', /(?:^|\n)#{1,6}\s+.*(?:범위|scope)/i],
    ['requirements', /\bREQ-\d{3}\b/i],
    ['user-flow', /(?:사용자\s*흐름|user\s*flow)/i],
    ['edge-cases', /(?:엣지\s*케이스|edge\s*case)/i],
    ['completion', /(?:완료\s*조건|definition\s+of\s+done|acceptance\s+criteria)/i],
    ['impact', /(?:영향|impact)/i],
  ],
  design: [
    ['requirements', /\bREQ-\d{3}\b/i],
    ['behavior', /(?:동작|behavior)/i],
    ['io-errors', /(?:입력|input)[\s\S]*(?:출력|output)[\s\S]*(?:오류|error)/i],
    ['test-cases', /\bTC-\d{3}\b/i],
    ['coverage', /(?:전문\s*영역|coverage|필요|불필요|불확실)/i],
    ['dispatch', /(?:agent|담당|위임)[\s\S]*(?:write\s*scope|수정\s*경로|쓰기\s*범위)/i],
    ['readiness-review', /readiness[\s\S]*(?:review|검토|QA)/i],
    ['rollback', /(?:rollback|롤백|복구)/i],
  ],
  do: [
    ['changes', /(?:변경|change|implementation|구현)/i],
    ['evidence', /(?:evidence|증거|검증|test|테스트)/i],
  ],
  review: [
    ['requirements', /\bREQ-\d{3}\b/i],
    ['test-cases', /\bTC-\d{3}\b/i],
    ['expected-actual', /(?:기대|expected)[\s\S]*(?:실제|actual|결과|result)/i],
    ['input-output', /(?:입력|input)[\s\S]*(?:출력|output)/i],
    ['edge-limitations', /(?:엣지|edge|제한|limitation)/i],
    ['evidence', /(?:evidence|증거|스크린샷|screenshot)/i],
  ],
  report: [
    ['approval', /(?:최종\s*승인|final\s*approval)/i],
    ['requirements', /\bREQ-\d{3}\b/i],
    ['evidence', /(?:evidence|증거|검증)/i],
    ['changes', /(?:변경|change)/i],
  ],
});

function phaseDocumentPath(projectRoot, item, phase) {
  const folder = PHASE_FOLDERS[phase];
  if (!folder) throw new Error(`Unknown phase: ${phase}`);
  return path.join(workItemDirectory(projectRoot, item), folder, 'main.md');
}

function extractTraceIdentifiers(content) {
  const identifiers = { REQ: new Set(), TC: new Set(), malformed: [] };
  const pattern = /\b(REQ|TC)(\s*[-_]?\s*)([0-9]+)(?:[A-Za-z_-][A-Za-z0-9_-]*|\.[A-Za-z0-9][A-Za-z0-9_.-]*)?/gi;
  for (const match of String(content || '').matchAll(pattern)) {
    const prefix = match[1].toUpperCase();
    const canonical = `${prefix}-${match[3]}`;
    if (match[0] !== canonical || match[2] !== '-' || match[3].length !== 3) identifiers.malformed.push(match[0]);
    else identifiers[prefix].add(canonical);
  }
  return identifiers;
}

function compareIdentifierSets(actual, expected, label) {
  const findings = [];
  const missing = [...expected].filter(value => !actual.has(value));
  const extra = [...actual].filter(value => !expected.has(value));
  if (missing.length) findings.push(`${label} is missing: ${missing.join(', ')}`);
  if (extra.length) findings.push(`${label} contains untraced IDs: ${extra.join(', ')}`);
  return findings;
}

function traceabilityFindings(projectRoot, item, phase, content) {
  const current = extractTraceIdentifiers(content);
  const findings = current.malformed.map(value => `Identifier must use exactly three digits: ${value}`);
  if (!['design', 'review'].includes(phase)) return findings;
  const plan = parseDocument(phaseDocumentPath(projectRoot, item, 'plan'));
  if (!plan) return [...findings, 'Canonical Plan is required for traceability validation'];
  const planIds = extractTraceIdentifiers(plan.content);
  findings.push(...compareIdentifierSets(current.REQ, planIds.REQ, `${phase} REQ trace set`));
  if (phase === 'review') {
    const design = parseDocument(phaseDocumentPath(projectRoot, item, 'design'));
    if (!design) findings.push('Canonical Design is required for Review traceability validation');
    else findings.push(...compareIdentifierSets(current.TC, extractTraceIdentifiers(design.content).TC, 'review TC trace set'));
  }
  return findings;
}

function inspectPhaseDocument(projectRoot, item, phase, input = {}) {
  const filePath = input.path ? path.resolve(projectRoot, input.path) : phaseDocumentPath(projectRoot, item, phase);
  const document = input.document === undefined ? parseDocument(filePath) : input.document;
  const findings = [];
  if (!document) findings.push('Canonical phase document is missing');
  if (document) {
    const expected = {
      schema: 'vais-phase/v1',
      work_item: item.id,
      phase,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (document.data?.[key] !== value) findings.push(`Frontmatter ${key} must equal ${value}`);
    }
    if (!Number.isInteger(document.data?.revision) || document.data.revision < 1) {
      findings.push('Frontmatter revision must be a positive integer');
    }
    for (const [name, pattern] of REQUIRED_SECTIONS[phase] || []) {
      if (!pattern.test(document.content)) findings.push(`Required ${phase} section is missing: ${name}`);
    }
    findings.push(...traceabilityFindings(projectRoot, item, phase, document.content));
    const budget = input.markdown === undefined
      ? evaluateDocumentBudget(projectRoot, item, phase)
      : evaluateDocumentBudget({
        scale: item.scale, phase, markdown: input.markdown, frontmatter: document.data,
        path: path.relative(projectRoot, filePath).split(path.sep).join('/'),
      });
    findings.push(...budget.findings.map(finding => `Document budget: ${finding}`));
    if (phase !== 'plan') {
      const repetition = evaluateDocumentRepetition(projectRoot, item, phase, {
        ...(input.markdown === undefined ? {} : { content: document.content, path: filePath }),
      });
      findings.push(...repetition.findings.map(finding => `Document repetition: ${finding}`));
    }
  }
  const relative = path.relative(projectRoot, filePath).split(path.sep).join('/');
  return {
    check: `${phase}-document`,
    execution: 'succeeded',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: [relative],
    requirements: [],
    summary: findings.length === 0 ? `Canonical ${phase} document is complete` : `${findings.length} ${phase} document issue(s) found`,
    findings,
    evidence: [relative],
  };
}

function checkPhaseDocument(projectRoot, item, phase) {
  return inspectPhaseDocument(projectRoot, item, phase);
}

module.exports = { REQUIRED_SECTIONS, phaseDocumentPath, extractTraceIdentifiers, compareIdentifierSets,
  traceabilityFindings, inspectPhaseDocument, checkPhaseDocument };
