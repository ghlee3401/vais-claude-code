#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const FILES = Object.freeze([
  '.claude-plugin/plugin.json',
  'package.json',
  'package-lock.json',
  'agents/v2-specialist.md',
  'contracts/v2-role-cards.json',
  'hooks/run-node.sh',
  'hooks/v2-project-context.js',
  'hooks/workflow-v2-agent-handoff.js',
  'hooks/workflow-v2-drift.js',
  'hooks/workflow-v2-prompt.js',
  'hooks/workflow-v2-write-guard.js',
  'lib/context-metrics.js',
  'lib/io.js',
  'lib/core/state-store.js',
  'mcp/design-system-server-runner.js',
  'mcp/design-system-server.json',
  'output-styles/vais-default.md',
  'scripts/vais-workflow-v2.js',
  'skills/vais/SKILL.md',
]);

const DIRECTORIES = Object.freeze([
  'vendor/ui-ux-pro-max',
]);

const V2_SCHEMAS = Object.freeze([
  'automatic-handoff-evidence.schema.json',
  'check-result.schema.json',
  'gate-result.schema.json',
  'live-shadow-evidence.schema.json',
  'phase-transaction-receipt.schema.json',
  'review-evidence-prepare.schema.json',
  'specialist-assignment.schema.json',
  'specialist-handoff.schema.json',
  'work-item.schema.json',
]);

const HOOKS = {
  hooks: {
    UserPromptSubmit: [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/workflow-v2-prompt.js', timeout: 3000 }] }],
    PreToolUse: [
      { matcher: 'Bash|Write|Edit|NotebookEdit|Agent', hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/workflow-v2-write-guard.js', timeout: 3000 }] },
    ],
    PostToolUse: [
      { matcher: 'Agent', hooks: [
        { type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/workflow-v2-agent-handoff.js', timeout: 5000 },
        { type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/workflow-v2-drift.js', timeout: 5000 },
      ] },
      { matcher: 'Write|Edit|NotebookEdit|Bash', hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/run-node.sh ${CLAUDE_PLUGIN_ROOT}/hooks/workflow-v2-drift.js', timeout: 5000 }] },
    ],
  },
};

function copyFile(sourceRoot, outputRoot, relative) {
  const source = path.join(sourceRoot, relative);
  const target = path.join(outputRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  try { fs.chmodSync(target, fs.statSync(source).mode); } catch (_) { /* Best effort on non-POSIX hosts. */ }
}

function copyDirectory(sourceRoot, outputRoot, relative) {
  const source = path.join(sourceRoot, relative);
  const target = path.join(outputRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, {
    recursive: true,
    // Runtime packages do not need npm's executable-link farm. Keeping the
    // staged tree link-free makes its recursive digest portable and prevents
    // a link from escaping the immutable bundle after collection.
    filter: candidate => !fs.lstatSync(candidate).isSymbolicLink(),
  });
}

function resolveInstalledDependency(sourceRoot, parentDirectory, name) {
  const source = path.resolve(sourceRoot);
  let current = path.resolve(parentDirectory);
  while (current === source || current.startsWith(`${source}${path.sep}`)) {
    const candidate = path.join(current, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(`Production dependency is not installed: ${name}`);
}

function copyRuntimeDependencies(sourceRoot, outputRoot, manifestOverride = null) {
  const source = path.resolve(sourceRoot);
  const manifest = manifestOverride || JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
  const queue = Object.keys(manifest.dependencies || {}).map(name => ({ name, parent: source }));
  const copied = new Set();
  while (queue.length) {
    const request = queue.shift();
    const packageDirectory = fs.realpathSync(resolveInstalledDependency(source, request.parent, request.name));
    const relative = path.relative(source, packageDirectory).split(path.sep).join('/');
    if (!relative.startsWith('node_modules/') || relative.includes('../')) {
      throw new Error(`Production dependency resolves outside the source repository: ${request.name}`);
    }
    if (copied.has(relative)) continue;
    copied.add(relative);
    copyDirectory(source, outputRoot, relative);
    const packageManifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
    for (const dependency of Object.keys(packageManifest.dependencies || {})) {
      queue.push({ name: dependency, parent: packageDirectory });
    }
  }
  return [...copied].sort();
}

function buildStage(sourceRoot, outputRoot) {
  const source = path.resolve(sourceRoot);
  const output = path.resolve(outputRoot);
  if (source === output || output.startsWith(`${source}${path.sep}`)) {
    throw new Error('v2 stage output must be outside the source repository');
  }
  if (fs.existsSync(output) && fs.readdirSync(output).length > 0) {
    throw new Error('v2 stage output must be an empty directory');
  }
  fs.mkdirSync(output, { recursive: true });
  for (const file of FILES) copyFile(source, output, file);
  for (const directory of DIRECTORIES) copyDirectory(source, output, directory);
  for (const file of fs.readdirSync(path.join(source, 'lib', 'workflow', 'v2'))) {
    if (file.endsWith('.js')) copyFile(source, output, path.join('lib', 'workflow', 'v2', file));
  }
  for (const file of V2_SCHEMAS) copyFile(source, output, path.join('schemas', file));
  fs.writeFileSync(path.join(output, 'hooks', 'hooks.json'), `${JSON.stringify(HOOKS, null, 2)}\n`);

  const skillPath = path.join(output, 'skills', 'vais', 'SKILL.md');
  const stagedSkill = fs.readFileSync(skillPath, 'utf8').replace(
    /## `shadow` or `disabled`[\s\S]*$/,
    '## `shadow` or `disabled`\n\nThis staged v2-only bundle stays read-only until `workflowV2.mode` is explicitly set to `enforce`.\n',
  );
  fs.writeFileSync(skillPath, stagedSkill);

  const manifestPath = path.join(output, '.claude-plugin', 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.description = 'VAIS Code v2 staged runtime — five-phase managed workflow with lean role assignment.';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const dependencies = copyRuntimeDependencies(source, output);
  return {
    output,
    dependencies,
    agents: fs.readdirSync(path.join(output, 'agents')).filter(file => file.endsWith('.md')),
    skills: fs.readdirSync(path.join(output, 'skills')).filter(file => fs.statSync(path.join(output, 'skills', file)).isDirectory()),
  };
}

function parseArgs(argv) {
  const index = argv.indexOf('--output');
  if (index < 0 || !argv[index + 1]) throw new Error('--output is required');
  return { output: argv[index + 1] };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(buildStage(path.join(__dirname, '..'), options.output), null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { FILES, DIRECTORIES, V2_SCHEMAS, HOOKS, copyRuntimeDependencies, buildStage, parseArgs, main };
