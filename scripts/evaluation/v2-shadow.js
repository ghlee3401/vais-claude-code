#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { runAll } = require('./mini-booking-browser');
const { buildShadowEvaluation } = require('../../lib/evaluation/v2-shadow');

function main(argv = process.argv.slice(2), projectRoot = process.cwd()) {
  const outputIndex = argv.indexOf('--output');
  const output = outputIndex >= 0 ? argv[outputIndex + 1] : null;
  const screenshotIndex = argv.indexOf('--screenshots');
  const screenshots = screenshotIndex >= 0 ? argv[screenshotIndex + 1] : undefined;
  const liveIndex = argv.indexOf('--live-evidence');
  const livePath = liveIndex >= 0 ? argv[liveIndex + 1] : null;
  const evidenceRootIndex = argv.indexOf('--evidence-root');
  const evidenceRoot = evidenceRootIndex >= 0 ? argv[evidenceRootIndex + 1] : projectRoot;
  const liveEvidence = livePath ? JSON.parse(fs.readFileSync(path.resolve(projectRoot, livePath), 'utf8')) : null;
  const browser = runAll({ root: projectRoot, outputDir: screenshots });
  const result = buildShadowEvaluation(path.resolve(projectRoot), {
    browser,
    liveEvidence,
    evidenceRoot: path.resolve(projectRoot, evidenceRoot),
  });
  if (output) {
    const target = path.resolve(projectRoot, output);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.verdict === 'pass' ? 0 : result.verdict === 'blocked' ? 2 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = { main };
