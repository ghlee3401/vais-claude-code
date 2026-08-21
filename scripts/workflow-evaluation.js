#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadEvaluationCorpora,
  summarizeClassificationCorpus,
  validateClassificationCorpus,
  validateCriticalRiskCorpus,
} = require('../lib/evaluation/corpus');
const { buildLegacyBaseline, validateLegacyBaseline } = require('../lib/evaluation/legacy-baseline');

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() || 'validate';
  let output = null;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--output') output = args[index + 1];
  }
  return { command, output };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function validate(baseDir) {
  const corpora = loadEvaluationCorpora(baseDir);
  const classification = validateClassificationCorpus(corpora.classification);
  const criticalRisk = validateCriticalRiskCorpus(corpora.criticalRisk);
  const result = {
    valid: classification.valid && criticalRisk.valid,
    classification: { ...classification, summary: summarizeClassificationCorpus(corpora.classification) },
    criticalRisk,
  };
  printJson(result);
  return result.valid ? 0 : 1;
}

function baseline(baseDir, output) {
  const report = buildLegacyBaseline(baseDir);
  const validation = validateLegacyBaseline(report);
  if (!validation.valid) {
    printJson(validation);
    return 1;
  }
  if (output) {
    const resolved = path.resolve(baseDir, output);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  printJson(report);
  return 0;
}

function main(argv = process.argv.slice(2), baseDir = process.cwd()) {
  const args = parseArgs(argv);
  if (args.command === 'validate') return validate(baseDir);
  if (args.command === 'baseline') return baseline(baseDir, args.output);
  process.stderr.write('Usage: node scripts/workflow-evaluation.js validate|baseline [--output path]\n');
  return 2;
}

if (require.main === module) process.exitCode = main();

module.exports = { parseArgs, validate, baseline, main };
