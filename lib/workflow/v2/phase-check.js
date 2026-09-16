'use strict';

const fs = require('fs');
const path = require('path');
const { parseDocument, PHASE_FOLDERS, workItemDirectory } = require('./document-manager');
const { evaluateDocumentBudget, evaluateDocumentRepetition } = require('./document-quality');
const { kindOf, isStageKind } = require('./chain-registry');
const { normalizeRelative } = require('./write-policy');
const citation = require('./citation');

// Kinds whose Plan is one line and whose Design is a list of options or citations (stage-*, ui,
// feature, bug) keep their canonical content elsewhere, so REQ/TC traceability does not apply.
function usesShortTemplates(kind) {
  return kind?.planTemplate === 'one-line' || ['options', 'options-screens', 'implementation', 'bugfix'].includes(kind?.designTemplate);
}

// Implementation Designs (feature · bug) are checked against the chain (docs/harness/design.md §3).
function citationFindings(projectRoot, item, phase, content) {
  const kind = kindOf(item);
  if (phase !== 'design' || !citation.isImplementationKind(kind)) return [];
  const parsed = citation.parseCitations(content);
  const findings = citation.validateCitations(projectRoot, parsed, { kind: kind.id, workItem: item.id });
  if (kind.designTemplate === 'bugfix') findings.push(...citation.bugFindings(projectRoot, item, parsed));
  return findings;
}

// Option screenshots (docs/harness/design.md §5): every `## 안 N` of an options-screens Design
// names a working copy plus desktop and mobile PNGs, all inside the Work item folder.
const OPTION_FIELD_LINES = Object.freeze([['사본', /^\s*(?:-\s*)?사본\s*[:：]\s*(\S+)/m], ['데스크톱', /^\s*(?:-\s*)?데스크톱\s*[:：]\s*(\S+)/m], ['모바일', /^\s*(?:-\s*)?모바일\s*[:：]\s*(\S+)/m]]);

function optionScreenshotFindings(projectRoot, item, phase, content) {
  if (phase !== 'design' || kindOf(item)?.designTemplate !== 'options-screens') return [];
  const findings = [];
  const blocks = String(content || '').split(/(?=(?:^|\n)#{1,6}\s+.*?(?:안|option)\s*\d+)/i).filter(block => /^#{1,6}\s+.*?(?:안|option)\s*\d+/i.test(block.trim()));
  const itemDir = normalizeRelative(projectRoot, workItemDirectory(projectRoot, item)) || '';
  for (const block of blocks) {
    const label = block.trim().split('\n')[0].replace(/^#+\s*/, '');
    for (const [name, pattern] of OPTION_FIELD_LINES) {
      const match = block.match(pattern);
      if (!match) { findings.push(`${label}: "${name}: <경로>" 줄이 필요하다`); continue; }
      const relative = normalizeRelative(projectRoot, match[1].replace(/[`'"]/g, ''));
      if (!relative || !relative.startsWith(`${itemDir}/`)) findings.push(`${label}: ${name} 경로는 Work item 폴더 안이어야 한다 (${match[1]})`);
      else if (!fs.existsSync(path.join(projectRoot, relative))) findings.push(`${label}: ${name} 파일이 없다 (${relative})`);
      else if (name !== '사본' && !/\.png$/i.test(relative)) findings.push(`${label}: ${name} 은 PNG 여야 한다 (${relative})`);
    }
  }
  return findings;
}

// Stage kinds use short templates: a one-line Plan and an options Design. Their canonical
// content lives in the stage document, so REQ/TC traceability does not apply to them.
const STAGE_TEMPLATE_SECTIONS = Object.freeze({
  plan: [
    ['request-confirm', /요청\s*확인/],
    ['kind', /\bkind\b/i],
    ['stage-or-target', /단계|대상\s*화면|target|관련\s*ID/i],
  ],
  'design-implementation': [
    ['options', /(?:^|\n)#{1,6}\s+.*(?:안\s*\d|option\s*\d)/i],
    ['citations', /(?:^|\n)##\s+(?:인용|citations?)/i],
    ['additions', /(?:^|\n)##\s+(?:신규|additions?)/i],
    ['checklist', /검수표|checklist/i],
    ['write-scope', /(?:write\s*scope|쓰기\s*범위)/i],
    ['readiness-review', /readiness[\s\S]*(?:review|검토|QA)/i],
    ['rollback', /(?:rollback|롤백|복구)/i],
  ],
  'design-bugfix': [
    ['repro', /(?:^|\n)##\s+재현/],
    ['cause', /(?:^|\n)##\s+원인/],
    ['fix', /(?:^|\n)##\s+수정안/],
    ['citations', /(?:^|\n)##\s+(?:인용|citations?)/i],
    ['additions', /(?:^|\n)##\s+(?:신규|additions?)/i],
    ['checklist', /검수표|checklist/i],
    ['write-scope', /(?:write\s*scope|쓰기\s*범위)/i],
    ['readiness-review', /readiness[\s\S]*(?:review|검토|QA)/i],
    ['rollback', /(?:rollback|롤백|복구)/i],
  ],
  'review-bugfix': [
    ['repro-rerun', /재현\s*재실행/],
    ['test-cases', /\bTC-\d{3}\b/i],
    ['expected-actual', /(?:기대|expected)[\s\S]*(?:실제|actual|결과|result)/i],
    ['evidence', /(?:evidence|증거|스크린샷|screenshot|로그)/i],
  ],
  'review-implementation': [
    ['test-cases', /\bTC-\d{3}\b/i],
    ['expected-actual', /(?:기대|expected)[\s\S]*(?:실제|actual|결과|result)/i],
    ['evidence', /(?:evidence|증거|스크린샷|screenshot)/i],
  ],
  design: [
    ['options', /(?:^|\n)#{1,6}\s+.*(?:안\s*\d|option\s*\d)/i],
    ['write-scope', /(?:write\s*scope|쓰기\s*범위)/i],
    ['readiness-review', /readiness[\s\S]*(?:review|검토|QA)/i],
    ['rollback', /(?:rollback|롤백|복구)/i],
  ],
  'design-screens': [
    ['options', /(?:^|\n)#{1,6}\s+.*(?:안\s*\d|option\s*\d)/i],
    ['screenshots', /데스크톱[\s\S]*모바일/],
    ['checklist', /검수표|checklist/i],
    ['write-scope', /(?:write\s*scope|쓰기\s*범위)/i],
    ['readiness-review', /readiness[\s\S]*(?:review|검토|QA)/i],
    ['rollback', /(?:rollback|롤백|복구)/i],
  ],
  do: [
    ['changes', /(?:변경|change|implementation|구현)/i],
    ['evidence', /(?:evidence|증거|검증|test|테스트)/i],
  ],
  review: [
    ['expected-actual', /(?:기대|expected)[\s\S]*(?:실제|actual|결과|result)/i],
    ['evidence', /(?:evidence|증거|스크린샷|screenshot)/i],
  ],
  report: [
    ['approval', /(?:최종\s*승인|final\s*approval)/i],
    ['evidence', /(?:evidence|증거|검증)/i],
    ['changes', /(?:변경|change)/i],
  ],
});
const OPTION_LIMITS = Object.freeze({ compact: 1, standard: 2, extended: 3 });

function requiredSectionsFor(item, phase) {
  const kind = kindOf(item);
  if (phase === 'plan' && kind?.planTemplate === 'one-line') return STAGE_TEMPLATE_SECTIONS.plan;
  if (phase === 'design' && kind?.designTemplate === 'options') return STAGE_TEMPLATE_SECTIONS.design;
  if (phase === 'design' && kind?.designTemplate === 'options-screens') return STAGE_TEMPLATE_SECTIONS['design-screens'];
  if (phase === 'design' && kind?.designTemplate === 'implementation') return STAGE_TEMPLATE_SECTIONS['design-implementation'];
  if (phase === 'design' && kind?.designTemplate === 'bugfix') return STAGE_TEMPLATE_SECTIONS['design-bugfix'];
  if (phase === 'review' && kind?.designTemplate === 'bugfix') return STAGE_TEMPLATE_SECTIONS['review-bugfix'];
  if (phase === 'review' && kind?.designTemplate === 'implementation') return STAGE_TEMPLATE_SECTIONS['review-implementation'];
  if (!isStageKind(kind) && !usesShortTemplates(kind)) return REQUIRED_SECTIONS[phase] || [];
  return STAGE_TEMPLATE_SECTIONS[phase] || REQUIRED_SECTIONS[phase] || [];
}

function optionCountFindings(item, phase, content) {
  if (phase !== 'design' || !['options', 'options-screens', 'implementation', 'bugfix'].includes(kindOf(item)?.designTemplate)) return [];
  const count = (String(content || '').match(/(?:^|\n)#{1,6}\s+.*?(?:안|option)\s*\d+/gi) || []).length;
  const limit = OPTION_LIMITS[item.scale] || 1;
  if (count < 1) return ['Design options: 안 1 이상이 필요하다 (예: ## 안 1)'];
  if (count > limit) return [`Design options: ${item.scale} 규모는 안 ${limit}개까지다 (현재 ${count})`];
  return [];
}

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
  const kind = kindOf(item);
  // Implementation kinds: the Review judges exactly the TCs the Design cited or declared.
  if (phase === 'review' && citation.isImplementationKind(kind)) {
    const expected = citation.designTestCases(citation.readDesignCitations(projectRoot, item));
    findings.push(...compareIdentifierSets(current.TC, expected, 'review TC trace set'));
    return findings;
  }
  if (!['design', 'review'].includes(phase) || usesShortTemplates(kind)) return findings;
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
    for (const [name, pattern] of requiredSectionsFor(item, phase)) {
      if (!pattern.test(document.content)) findings.push(`Required ${phase} section is missing: ${name}`);
    }
    findings.push(...optionCountFindings(item, phase, document.content));
    findings.push(...optionScreenshotFindings(projectRoot, item, phase, document.content));
    findings.push(...citationFindings(projectRoot, item, phase, document.content));
    findings.push(...traceabilityFindings(projectRoot, item, phase, document.content));
    const budget = input.markdown === undefined
      ? evaluateDocumentBudget(projectRoot, item, phase)
      : evaluateDocumentBudget({
        scale: item.scale, kind: item.kind, phase, markdown: input.markdown, frontmatter: document.data,
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

module.exports = { REQUIRED_SECTIONS, STAGE_TEMPLATE_SECTIONS, OPTION_LIMITS, usesShortTemplates, requiredSectionsFor, optionCountFindings,
  optionScreenshotFindings, citationFindings, phaseDocumentPath, extractTraceIdentifiers, compareIdentifierSets, traceabilityFindings, inspectPhaseDocument, checkPhaseDocument };
