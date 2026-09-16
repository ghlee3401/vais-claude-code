'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_LEASE_MS = 60_000;
const DEFAULT_AUTHORIZATION_MS = 30 * 60_000;
const KNOWN_WORKFLOW_KEYS = Object.freeze(['mode', '_mode', 'leaseMs', 'authorizationTtlMs', 'statePath']);
const VALID_MODES = Object.freeze(['enforce', 'disabled']);
const OFF_VALUES = new Set(['1', 'true', 'on', 'yes']);

function readConfigFile(projectRoot) {
  const file = path.join(path.resolve(projectRoot), 'vais.config.json');
  try {
    return { config: JSON.parse(fs.readFileSync(file, 'utf8')), error: null };
  } catch (error) {
    return { config: null, error: error.message };
  }
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

// Everything the runtime reads from vais.config.json > workflowV2, with defaults.
// Keys outside KNOWN_WORKFLOW_KEYS are reported so doctor can flag dead configuration.
function loadWorkflowConfig(projectRoot) {
  const { config, error } = readConfigFile(projectRoot);
  const block = config?.workflowV2 && typeof config.workflowV2 === 'object' ? config.workflowV2 : {};
  return {
    error,
    mode: block.mode,
    leaseMs: positiveInteger(block.leaseMs, DEFAULT_LEASE_MS),
    authorizationTtlMs: positiveInteger(block.authorizationTtlMs, DEFAULT_AUTHORIZATION_MS),
    statePath: typeof block.statePath === 'string' ? block.statePath : '.vais/v2/work-items.json',
    unknownKeys: Object.keys(block).filter(key => !KNOWN_WORKFLOW_KEYS.includes(key)),
  };
}

// vais.config.json > ui: where the product's screens live for the UI loop (docs/harness/design.md §5).
// appRoot/entry point at a static file; url points at an already running app. Nothing here starts a server.
function loadUiConfig(projectRoot) {
  const { config } = readConfigFile(projectRoot);
  const block = config?.ui && typeof config.ui === 'object' ? config.ui : {};
  // ui.run: how to start the app before a screenshot. Argv array only (no shell), a URL to poll.
  const run = block.run && typeof block.run === 'object' && Array.isArray(block.run.command) && block.run.command.length > 0 &&
    block.run.command.every(part => typeof part === 'string') && typeof block.run.url === 'string' && /^https?:\/\//i.test(block.run.url)
    ? { command: [...block.run.command], url: block.run.url.trim(), readyTimeoutMs: positiveInteger(block.run.readyTimeoutMs, 15_000) }
    : null;
  return {
    appRoot: typeof block.appRoot === 'string' && block.appRoot.trim() ? block.appRoot.trim().replace(/\/+$/, '') : null,
    entry: typeof block.entry === 'string' && block.entry.trim() ? block.entry.trim() : 'index.html',
    url: typeof block.url === 'string' && /^https?:\/\//i.test(block.url.trim()) ? block.url.trim() : null,
    run,
  };
}

function harnessSwitchOff(env = process.env) {
  return OFF_VALUES.has(String(env?.VAIS_HARNESS_OFF || '').trim().toLowerCase());
}

// Fail-loud and fail-closed: only an exact `enforce` or `disabled` (case- and space-insensitive)
// is accepted. Anything else keeps the guards active and carries a warning for the prompt hook.
// The emergency switch VAIS_HARNESS_OFF is the only other way to turn the harness off.
function resolveMode(projectRoot, env = process.env) {
  if (harnessSwitchOff(env)) {
    return { mode: 'off', warning: 'VAIS_HARNESS_OFF 비상 스위치가 켜져 있어 하네스가 꺼져 있다', raw: null };
  }
  const { config, error } = readConfigFile(projectRoot);
  if (error) {
    return { mode: 'enforce', warning: `vais.config.json 을 읽을 수 없다 (${error}); 닫힘으로 동작한다`, raw: null };
  }
  const raw = config?.workflowV2?.mode;
  const normalized = String(raw ?? '').trim().toLowerCase();
  if (VALID_MODES.includes(normalized)) return { mode: normalized, warning: null, raw };
  const shown = raw === undefined ? '<없음>' : JSON.stringify(raw);
  return {
    mode: 'enforce',
    warning: `workflowV2.mode 값 오류(${shown}); enforce 또는 disabled 만 허용되며 닫힘으로 동작한다`,
    raw,
  };
}

function warningLine(resolved) {
  return resolved?.warning ? `⚠ VAIS 하네스 경고: ${resolved.warning}` : null;
}

module.exports = {
  DEFAULT_LEASE_MS,
  DEFAULT_AUTHORIZATION_MS,
  KNOWN_WORKFLOW_KEYS,
  VALID_MODES,
  readConfigFile,
  loadWorkflowConfig,
  loadUiConfig,
  harnessSwitchOff,
  resolveMode,
  warningLine,
};
