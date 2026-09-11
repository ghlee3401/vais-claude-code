#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { copyRuntimeDependencies } = require('./build-v2-plugin-stage');

function git(source, args, encoding = 'utf8') {
  const result = spawnSync('git', ['-C', source, ...args], {
    encoding, maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr?.toString().trim() || 'git command failed');
  return result.stdout;
}

function trackedEntries(source, commit) {
  const output = git(source, ['ls-tree', '-r', '-z', '--full-tree', commit], 'buffer');
  return output.toString('utf8').split('\0').filter(Boolean).map(record => {
    const match = record.match(/^(\d{6}) blob [a-f0-9]+\t(.+)$/);
    if (!match || path.isAbsolute(match[2]) || match[2].split('/').includes('..')) {
      throw new Error(`Unsupported Git tree entry: ${record}`);
    }
    return { mode: match[1], relative: match[2] };
  });
}

function buildLegacyStage(sourceRoot, outputRoot, revision = 'HEAD') {
  const source = path.resolve(sourceRoot);
  const output = path.resolve(outputRoot);
  if (source === output || output.startsWith(`${source}${path.sep}`)) {
    throw new Error('Legacy stage output must be outside the source repository');
  }
  if (fs.existsSync(output) && fs.readdirSync(output).length > 0) {
    throw new Error('Legacy stage output must be an empty directory');
  }
  const commit = git(source, ['rev-parse', '--verify', `${revision}^{commit}`]).trim();
  fs.mkdirSync(output, { recursive: true });
  const entries = trackedEntries(source, commit);
  for (const entry of entries) {
    const target = path.join(output, entry.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const body = git(source, ['show', `${commit}:${entry.relative}`], 'buffer');
    fs.writeFileSync(target, body, { mode: entry.mode === '100755' ? 0o755 : 0o644 });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(output, 'package.json'), 'utf8'));
  const dependencies = copyRuntimeDependencies(source, output, manifest);
  return { output, commit, trackedFiles: entries.length, dependencies };
}

function parseArgs(argv) {
  const value = name => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : null;
  };
  const output = value('output');
  if (!output || output.startsWith('--')) throw new Error('--output is required');
  return { output, revision: value('revision') || 'HEAD' };
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    process.stdout.write(`${JSON.stringify(buildLegacyStage(path.join(__dirname, '..'),
      options.output, options.revision), null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { git, trackedEntries, buildLegacyStage, parseArgs, main };
