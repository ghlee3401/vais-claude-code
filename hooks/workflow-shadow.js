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

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const MAX_CONTEXT_VALUE_LENGTH = 200;

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

function resolveProjectDir(input) {
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

function loadShadowConfig(projectDir) {
  const candidates = [
    path.join(projectDir, 'vais.config.json'),
    path.join(PLUGIN_ROOT, 'vais.config.json'),
  ];

  for (const candidate of [...new Set(candidates)]) {
    try {
      if (!fs.existsSync(candidate)) continue;
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    } catch (_) {
      return {};
    }
  }
  return {};
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

    const projectDir = resolveProjectDir(input);
    const config = loadShadowConfig(projectDir);
    runShadowAnalysis({
      rawText,
      feature: extractFeature(input, projectDir),
      host: 'claude-code',
      sessionId: normalizeString(input?.session_id || input?.sessionId) || null,
      context: extractClassifierContext(input),
      config,
      baseDir: projectDir,
    });
  } catch (_) {
    // Shadow analysis must never block or alter the legacy request path.
  }
}

module.exports = {
  main,
  normalizeString,
  readHookInput,
  resolveProjectDir,
  loadShadowConfig,
  readActiveFeature,
  extractPrompt,
  extractFeature,
  extractClassifierContext,
};

if (require.main === module) {
  main();
}
