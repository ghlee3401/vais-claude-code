'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOL_DEFINITIONS = Object.freeze({
  build: { command: 'npm', args: ['run', 'build'] },
  lint: { command: 'npm', args: ['run', 'lint'] },
  test: { command: 'npm', args: ['test'] },
  e2e: {
    command: 'npm',
    scriptCandidates: ['test:e2e', 'e2e', 'test:browser'],
    timeout: 300_000,
    evidenceDirectory: true,
  },
  'plugin-validator': { command: 'node', args: ['scripts/vais-validate-plugin.js'] },
  'dependency-scan': { command: 'npm', args: ['audit', '--json'] },
  'secret-scan': { command: 'node', args: ['scripts/checks/v2-secret-scan.js'] },
});

function resolveDefinition(definition, cwd) {
  if (!definition.scriptCandidates) return definition;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  } catch (error) {
    const unavailable = new Error(`Cannot read package.json for e2e adapter: ${error.message}`);
    unavailable.code = 'ENOENT';
    throw unavailable;
  }
  const script = definition.scriptCandidates.find(candidate => manifest.scripts?.[candidate]);
  if (!script) {
    const unavailable = new Error(`No e2e package script found (${definition.scriptCandidates.join(', ')})`);
    unavailable.code = 'ENOENT';
    throw unavailable;
  }
  return { ...definition, args: ['run', script] };
}

function defaultExecutor(definition, cwd, options = {}) {
  const resolved = resolveDefinition(definition, cwd);
  const evidenceDirectory = resolved.evidenceDirectory && options.evidenceDirectory
    ? path.resolve(options.evidenceDirectory) : null;
  const args = evidenceDirectory ? [...resolved.args, '--', evidenceDirectory] : resolved.args;
  return spawnSync(resolved.command, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    timeout: resolved.timeout || 120_000,
    maxBuffer: 5 * 1024 * 1024,
    env: {
      ...process.env,
      ...(evidenceDirectory ? { VAIS_EVIDENCE_DIR: evidenceDirectory } : {}),
    },
  });
}

function hasEvidenceArtifact(directory) {
  if (!directory || !fs.existsSync(directory)) return false;
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isFile()) return true;
      if (entry.isDirectory()) stack.push(path.join(current, entry.name));
    }
  }
  return false;
}

function runCheck(check, options = {}) {
  if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, check)) {
    throw new Error(`Unknown check adapter: ${check}`);
  }
  const definition = TOOL_DEFINITIONS[check];
  const executor = options.executor || defaultExecutor;
  let execution;
  try {
    execution = executor(definition, options.cwd || process.cwd(), options);
    options.onExecution?.(execution);
  } catch (error) {
    options.onExecution?.({ error, status: null, stdout: '', stderr: error.message });
    return {
      check,
      execution: 'unavailable',
      verdict: 'blocked',
      required: options.required !== false,
      scope: [...(options.scope || [])],
      requirements: [...(options.requirements || [])],
      summary: `Check unavailable: ${error.message}`,
      findings: [],
      evidence: [...(options.evidence || [])],
    };
  }
  if (execution.error?.code === 'ENOENT') {
    return {
      check,
      execution: 'unavailable',
      verdict: 'blocked',
      required: options.required !== false,
      scope: [...(options.scope || [])],
      requirements: [...(options.requirements || [])],
      summary: `Check unavailable: ${definition.command} was not found`,
      findings: [],
      evidence: [...(options.evidence || [])],
    };
  }
  const missingArtifacts = execution.status === 0 && definition.evidenceDirectory &&
    !hasEvidenceArtifact(options.evidenceDirectory);
  const passed = execution.status === 0 && !missingArtifacts;
  return {
    check,
    execution: passed ? 'succeeded' : 'errored',
    verdict: passed ? 'pass' : 'fail',
    required: options.required !== false,
    scope: [...(options.scope || [])],
    requirements: [...(options.requirements || [])],
    summary: passed ? 'Check passed' : missingArtifacts
      ? 'Check exited successfully but produced no canonical evidence artifacts'
      : `Check failed with exit ${execution.status ?? 'unknown'}`,
    findings: passed ? [] : [missingArtifacts
      ? 'The Design-declared evidence artifact directory is missing or empty'
      : 'Inspect the raw evidence log for details'],
    evidence: [...(options.evidence || [])],
  };
}

module.exports = { TOOL_DEFINITIONS, resolveDefinition, defaultExecutor, hasEvidenceArtifact, runCheck };
