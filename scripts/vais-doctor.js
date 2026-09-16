#!/usr/bin/env node
'use strict';

const path = require('path');
const { runDoctor, renderDoctor } = require('../lib/workflow/v2/doctor');
const { resolveProjectRoot } = require('../hooks/v2-project-context');

function main(argv = process.argv.slice(2)) {
  const root = resolveProjectRoot(process.cwd()) || path.resolve(argv.find(value => !value.startsWith('--')) || process.cwd());
  const report = runDoctor(root);
  process.stdout.write(argv.includes('--json') ? `${JSON.stringify(report, null, 2)}\n` : `${renderDoctor(report)}\n`);
  return report.verdict === 'fail' ? 1 : 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { main };
