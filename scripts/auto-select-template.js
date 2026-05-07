#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS] auto-select-template crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS] auto-select-template rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code v0.65 — Plan template auto-selector.
 *
 * 정본: vais.config.json > workflow.template.{stub,minimal,standard,extended}
 * CTO Plan phase 진입 시 변경 surface + PRD 상태로 stub/minimal/standard/extended 추천.
 * autoSelect=true 인 경우 LLM 이 결과를 그대로 채택하고 outro 한 줄로 표시.
 * autoSelect=false 또는 ambiguous(`confidence < 0.6`) 인 경우 fallback CP-1 발동.
 *
 * Usage:
 *   node scripts/auto-select-template.js [--feature=<name>] [--json]
 *   echo: { template, templateFile, surface, domains, prd, confidence, reason, fallbackCp }
 *
 * 휴리스틱 (CTO knowledge/modification-chaining.md 와 의도 동일):
 *   surface = git status 상 변경 surface (modified + added + untracked, 추적 가능 .{js,ts,py,md,json,...})
 *   domains = 변경 파일들의 top-level prefix 집합 ({frontend, backend, lib, agents, skills, scripts, docs, ...})
 *   prdQuality = docs/{feature}/03-do/main.md 의 ## 1.~## 8. 헤더 카운트 → full(≥6) / partial(≥1) / missing(0)
 *
 * 추천 룰:
 *   - surface ≤ 2 + domains.size ≤ 1 + prdQuality !== 'missing'    → stub      (confidence 0.9)
 *   - surface ≤ 2 + domains.size ≤ 1                                → minimal   (confidence 0.7)
 *   - surface 3-10 또는 domains.size 2-3                            → standard  (confidence 0.85)
 *   - prdQuality === 'missing' && surface > 0 && domains.size ≥ 2  → extended  (confidence 0.8)
 *   - 그 외 (모호) → standard + fallbackCp=true                     (confidence 0.5)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig } = require('../lib/paths');

const PROJECT_DOMAIN_PREFIXES = [
  'frontend', 'backend', 'lib', 'agents', 'skills', 'scripts', 'hooks',
  'mcp', 'templates', 'tests', 'docs', 'output-styles', 'design-system',
  '.claude-plugin', 'src', 'app', 'components', 'pages',
];

function parseFlags(argv) {
  const flags = { feature: null, json: false };
  for (const a of argv.slice(2)) {
    if (a === '--json') flags.json = true;
    else if (a.startsWith('--feature=')) flags.feature = a.slice('--feature='.length);
  }
  return flags;
}

function getActiveFeatureSafe() {
  try {
    const { getActiveFeature } = require('../lib/status');
    return getActiveFeature();
  } catch (_) {
    return null;
  }
}

function listChangedFiles() {
  let raw;
  try {
    raw = execSync('git status --porcelain=v1 --untracked-files=all', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) {
    return [];
  }
  const files = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    // porcelain v1: XY <path>  (XY 는 정확히 2자, 그 뒤 공백)
    const filePart = line.slice(3).trim();
    if (!filePart) continue;
    // 'a -> b' (rename) 의 경우 destination 만 사용
    const arrow = filePart.indexOf(' -> ');
    const p = arrow === -1 ? filePart : filePart.slice(arrow + 4);
    files.push(p.replace(/^"|"$/g, ''));
  }
  return files;
}

function inferDomains(files) {
  const set = new Set();
  for (const f of files) {
    const parts = f.split('/');
    if (parts.length === 0) continue;
    const top = parts[0];
    if (PROJECT_DOMAIN_PREFIXES.includes(top)) set.add(top);
  }
  return set;
}

function detectPrdQuality(feature) {
  if (!feature) return 'missing';
  const prdPath = path.join(process.cwd(), 'docs', feature, '03-do', 'main.md');
  if (!fs.existsSync(prdPath)) return 'missing';
  let content;
  try { content = fs.readFileSync(prdPath, 'utf8'); }
  catch (_) { return 'missing'; }
  const headerCount = (content.match(/^## [1-8]\./gm) || []).length;
  if (headerCount >= 6) return 'full';
  if (headerCount >= 1) return 'partial';
  return 'missing';
}

function recommend({ surface, domainsSize, prdQuality }) {
  if (surface <= 2 && domainsSize <= 1 && prdQuality !== 'missing') {
    return { template: 'stub', confidence: 0.9, reason: `surface=${surface}, single domain, PRD ${prdQuality}` };
  }
  if (surface <= 2 && domainsSize <= 1) {
    return { template: 'minimal', confidence: 0.7, reason: `surface=${surface}, single domain, no PRD` };
  }
  if (prdQuality === 'missing' && surface > 0 && domainsSize >= 2) {
    return { template: 'extended', confidence: 0.8, reason: `PRD missing + multi-domain (${domainsSize}) + surface ${surface}` };
  }
  if (surface >= 3 && surface <= 10 && domainsSize <= 3) {
    return { template: 'standard', confidence: 0.85, reason: `surface=${surface}, ${domainsSize} domain(s)` };
  }
  if (surface > 10 || domainsSize > 3) {
    return { template: 'extended', confidence: 0.7, reason: `large surface=${surface} or many domains=${domainsSize}` };
  }
  return { template: 'standard', confidence: 0.5, reason: `ambiguous (surface=${surface}, domains=${domainsSize}, prd=${prdQuality})` };
}

function autoSelect(feature) {
  const cfg = loadConfig();
  const tplCfg = cfg.workflow?.template ?? {};
  const enabled = tplCfg.autoSelect === true;

  const files = listChangedFiles();
  const domains = inferDomains(files);
  const prdQuality = detectPrdQuality(feature);

  const rec = recommend({ surface: files.length, domainsSize: domains.size, prdQuality });

  const fileMap = {
    stub: tplCfg.stub ?? 'plan-stub.template.md',
    minimal: tplCfg.minimal ?? 'plan-minimal.template.md',
    standard: tplCfg.standard ?? 'plan-standard.template.md',
    extended: tplCfg.extended ?? 'plan-extended.template.md',
  };

  const fallbackCp = !enabled || rec.confidence < 0.6;

  return {
    feature,
    autoSelectEnabled: enabled,
    template: rec.template,
    templateFile: fileMap[rec.template],
    surface: files.length,
    domains: [...domains].sort(),
    domainsSize: domains.size,
    prd: prdQuality,
    confidence: rec.confidence,
    reason: rec.reason,
    fallbackCp,
  };
}

if (require.main === module) {
  const flags = parseFlags(process.argv);
  const feature = flags.feature || getActiveFeatureSafe();
  const result = autoSelect(feature);
  if (flags.json) {
    process.stdout.write(JSON.stringify(result));
  } else {
    process.stdout.write([
      `template: ${result.template} (confidence ${result.confidence})`,
      `file: templates/${result.templateFile}`,
      `surface: ${result.surface} files`,
      `domains: ${result.domains.length ? result.domains.join(',') : '(none)'}`,
      `prd: ${result.prd}`,
      `reason: ${result.reason}`,
      `fallbackCp: ${result.fallbackCp}`,
    ].join('\n') + '\n');
  }
  process.exit(0);
}

module.exports = { autoSelect, recommend, listChangedFiles, inferDomains, detectPrdQuality };
