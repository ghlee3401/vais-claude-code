#!/usr/bin/env node
'use strict';

/**
 * UserPromptSubmit shadow classifier hook.
 *
 * This hook is deliberately output-free: it records a redacted classification
 * event and never injects context, guides the user, or changes legacy execution.
 * Every input/config/status/logging failure is fail-open with exit code 0.
 */

process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

const fs = require('fs');
const path = require('path');
const { runShadowAnalysis } = require('../lib/workflow/shadow-runner');

const MAX_CONTEXT_VALUE_LENGTH = 200;
const MAX_ROOT_WALK_DEPTH = 64;

// Guarantee the output-free contract even for writes made by shared libraries
// (e.g. EventLogger's validation console.error): nothing may reach the host.
function silenceHookOutput() {
  const noop = () => {};
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
}

function normalizeString(value, maxLength = MAX_CONTEXT_VALUE_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').trim().slice(0, maxLength);
}

function readHookInput() {
  try {
    const raw = fs.readFileSync(process.stdin.fd, 'utf8').trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function resolveStartDir(input) {
  const inputCwd = normalizeString(input?.cwd, 4096);
  if (inputCwd && path.isAbsolute(inputCwd)) {
    try {
      if (fs.statSync(inputCwd).isDirectory()) return path.resolve(inputCwd);
    } catch (_) {
      // Fall back to the hook process cwd.
    }
  }
  return process.cwd();
}

// The session may start in a subdirectory; the project root is the nearest
// ancestor that carries an explicit VAIS footprint. No footprint → no root.
function resolveProjectRoot(startDir) {
  let dir = startDir;
  for (let depth = 0; depth < MAX_ROOT_WALK_DEPTH; depth += 1) {
    try {
      if (fs.existsSync(path.join(dir, 'vais.config.json'))
        || fs.existsSync(path.join(dir, '.vais', 'status.json'))) {
        return dir;
      }
    } catch (_) {
      return null;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

// Opt-in only: shadow runs solely on the project's own vais.config.json.
// There is deliberately no fallback to the plugin's bundled config — that
// would silently enable prompt logging for every user of the plugin.
function loadShadowConfig(projectRoot) {
  try {
    const configPath = path.join(projectRoot, 'vais.config.json');
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (_) {
    return {};
  }
}

function readActiveFeature(projectDir) {
  try {
    const statusPath = path.join(projectDir, '.vais', 'status.json');
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    if (Array.isArray(status.activeFeatures) && status.activeFeatures.length > 0) {
      return normalizeString(status.activeFeatures[0], 100);
    }
    return normalizeString(status.activeFeature, 100);
  } catch (_) {
    return '';
  }
}

function extractPrompt(input) {
  const candidates = [
    input?.prompt,
    input?.user_prompt,
    input?.user_message,
    input?.message,
    input?.text,
  ];
  return candidates.find(value => typeof value === 'string') || '';
}

function extractFeature(input, projectDir) {
  const payloadFeature = [
    input?.feature,
    input?.active_feature,
    input?.activeFeature,
    input?.context?.feature,
  ].map(value => normalizeString(value, 100)).find(Boolean);
  return payloadFeature || readActiveFeature(projectDir) || 'unscoped';
}

function extractClassifierContext(input) {
  const source = input?.context && typeof input.context === 'object' && !Array.isArray(input.context)
    ? input.context
    : {};
  const expectedContracts = Array.isArray(source.expectedContracts)
    ? source.expectedContracts
      .map(value => normalizeString(value))
      .filter(Boolean)
      .slice(0, 32)
    : [];
  const touchedAreas = Array.isArray(source.repoInventory?.touchedAreas)
    ? source.repoInventory.touchedAreas
      .map(value => normalizeString(value))
      .filter(Boolean)
      .slice(0, 32)
    : [];

  return {
    ceoAnalysisAvailable: source.ceoAnalysisAvailable === true,
    expectedContracts,
    projectProfile: {
      stage: normalizeString(source.projectProfile?.stage),
    },
    repoInventory: { touchedAreas },
  };
}

function main() {
  try {
    const input = readHookInput();
    const rawText = extractPrompt(input);
    if (!rawText.trim()) return;

    const projectRoot = resolveProjectRoot(resolveStartDir(input));
    if (!projectRoot) return;
    const config = loadShadowConfig(projectRoot);
    runShadowAnalysis({
      rawText,
      feature: extractFeature(input, projectRoot),
      host: 'claude-code',
      sessionId: normalizeString(input?.session_id || input?.sessionId) || null,
      context: extractClassifierContext(input),
      config,
      baseDir: projectRoot,
    });
  } catch (_) {
    // Shadow analysis must never block or alter the legacy request path.
  }
}

module.exports = {
  main,
  silenceHookOutput,
  normalizeString,
  readHookInput,
  resolveStartDir,
  resolveProjectRoot,
  loadShadowConfig,
  readActiveFeature,
  extractPrompt,
  extractFeature,
  extractClassifierContext,
};

if (require.main === module) {
  silenceHookOutput();
  main();
}
