#!/usr/bin/env node
'use strict';

const { getPhaseContext } = require('../lib/paths');

function main(argv = process.argv.slice(2)) {
  const [role, phase] = argv;
  if (!role || !phase) {
    process.stderr.write('Usage: node scripts/phase-context.js <role> <phase>\n');
    return 1;
  }

  const context = getPhaseContext(role, phase);
  process.stdout.write(JSON.stringify(context, null, 2) + '\n');
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main };
