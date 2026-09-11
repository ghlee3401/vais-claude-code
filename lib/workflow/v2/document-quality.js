'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { parseDocument, PHASE_FOLDERS, workItemDirectory } = require('./document-manager');

const DOCUMENT_BUDGETS = Object.freeze({
  compact: Object.freeze({ plan: 5632, design: 8192, do: 2560, review: 5120, report: 2560 }),
  standard: Object.freeze({ plan: 6144, design: 10240, do: 3584, review: 6144, report: 3072 }),
  extended: Object.freeze({ plan: 10240, design: 18432, do: 6144, review: 10240, report: 5120 }),
});

const PHASE_ORDER = Object.freeze(['plan', 'design', 'do', 'review', 'report']);
const MIN_REPEATED_TEXT = 80;

function relative(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function phasePath(projectRoot, item, phase) {
  return path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS[phase], 'main.md');
}

function exceptionApproved(data) {
  const value = data?.budget_exception;
  if (!value) return false;
  if (typeof value === 'object') {
    return String(value.reason || '').trim().length > 0 && /^(?:user|사용자)$/i.test(String(value.approved_by || '').trim());
  }
  return String(value).trim().length > 0 && /^(?:user|사용자)$/i.test(String(data?.budget_exception_approved_by || '').trim());
}

function resolveBudgetInput(projectRootOrInput, item, phase) {
  if (typeof projectRootOrInput === 'object' && projectRootOrInput !== null) {
    const input = projectRootOrInput;
    const bytes = input.bytes ?? Buffer.byteLength(String(input.markdown ?? input.content ?? ''), 'utf8');
    return {
      scale: input.scale,
      phase: input.phase,
      bytes,
      data: input.frontmatter || input.data || {},
      evidence: input.path ? [String(input.path)] : [],
    };
  }
  const projectRoot = path.resolve(projectRootOrInput);
  const filePath = phasePath(projectRoot, item, phase);
  const document = parseDocument(filePath);
  return {
    scale: item?.scale,
    phase,
    bytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    data: document?.data || {},
    evidence: [relative(projectRoot, filePath)],
  };
}

function evaluateDocumentBudget(projectRootOrInput, item, phase) {
  const input = resolveBudgetInput(projectRootOrInput, item, phase);
  const limit = DOCUMENT_BUDGETS[input.scale]?.[input.phase];
  const findings = [];
  if (!limit) findings.push(`Unknown document budget for ${input.scale || '<scale>'}/${input.phase || '<phase>'}`);
  if (limit && input.bytes > limit) {
    if (input.scale !== 'extended' || !exceptionApproved(input.data)) {
      findings.push(input.scale === 'extended'
        ? `Authored Markdown is ${input.bytes}B (limit ${limit}B); extended overflow requires a reason and user approval`
        : `Authored Markdown is ${input.bytes}B (limit ${limit}B); compress it or obtain approval to raise the scale`);
    }
  }
  return {
    check: 'document-budget',
    execution: 'succeeded',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: input.evidence,
    requirements: ['REQ-009', 'REQ-026'],
    summary: findings.length === 0
      ? `Authored Markdown ${input.bytes}B is within the ${limit}B ${input.scale} budget`
      : `${findings.length} document budget issue(s) found`,
    findings,
    evidence: input.evidence,
  };
}

function normalizeAuthoredText(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\r?\n/)
    .filter(line => !/^\s*(?:#|>|[-*+]\s|\d+\.\s|\|)/.test(line))
    .join('\n')
    .split(/(?<=[.!?。！？])\s+|\n{2,}/)
    .map(value => value
      .replace(/\[[^\]]*\]\([^)]*\)/g, ' LINK ')
      .replace(/\b(?:REQ|TC)-\d{3}\b/gi, ' ID ')
      .replace(/`[^`]+`/g, ' CODE ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(value => value.length >= MIN_REPEATED_TEXT);
}

function repetitionDigest(text) {
  return crypto.createHash('sha256').update(text.toLocaleLowerCase()).digest('hex').slice(0, 12);
}

function findCrossPhaseRepetition(projectRoot, item, phase, options = {}) {
  const currentIndex = PHASE_ORDER.indexOf(phase);
  if (currentIndex <= 0) return [];
  const currentPath = options.path ? path.resolve(projectRoot, options.path) : phasePath(projectRoot, item, phase);
  const current = options.content === undefined
    ? parseDocument(currentPath)
    : { content: String(options.content) };
  if (!current) return [];
  const prior = new Map();
  for (const previousPhase of PHASE_ORDER.slice(0, currentIndex)) {
    const filePath = phasePath(projectRoot, item, previousPhase);
    const document = parseDocument(filePath);
    if (!document) continue;
    for (const text of normalizeAuthoredText(document.content)) {
      const normalized = text.toLocaleLowerCase();
      if (!prior.has(normalized)) prior.set(normalized, []);
      prior.get(normalized).push(relative(projectRoot, filePath));
    }
  }
  const findings = [];
  const seen = new Set();
  for (const text of normalizeAuthoredText(current.content)) {
    const normalized = text.toLocaleLowerCase();
    if (!prior.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    findings.push({
      digest: repetitionDigest(text),
      bytes: Buffer.byteLength(text, 'utf8'),
      current: relative(projectRoot, currentPath),
      sources: prior.get(normalized),
      excerpt: `${text.slice(0, options.excerptLength || 96)}${text.length > (options.excerptLength || 96) ? '…' : ''}`,
    });
  }
  return findings;
}

function evaluateDocumentRepetition(projectRoot, item, phase, options = {}) {
  const currentPath = options.path ? path.resolve(projectRoot, options.path) : phasePath(projectRoot, item, phase);
  const repeats = findCrossPhaseRepetition(projectRoot, item, phase, options);
  const evidence = [relative(projectRoot, currentPath)];
  return {
    check: 'document-repetition',
    execution: 'succeeded',
    verdict: repeats.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: evidence,
    requirements: ['REQ-026'],
    summary: repeats.length === 0 ? 'No long authored sentence is copied from an earlier phase' : `${repeats.length} cross-phase repetition(s) found`,
    findings: repeats.map(value => `Repeated authored text ${value.digest} (${value.bytes}B) also appears in ${value.sources.join(', ')}: ${value.excerpt}`),
    evidence,
  };
}

module.exports = {
  DOCUMENT_BUDGETS,
  MIN_REPEATED_TEXT,
  evaluateDocumentBudget,
  findCrossPhaseRepetition,
  evaluateDocumentRepetition,
  normalizeAuthoredText,
};
