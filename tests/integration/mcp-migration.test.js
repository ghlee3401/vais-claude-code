'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const Module = require('node:module');

const MOD_PATH = path.resolve(__dirname, '..', '..', 'lib', 'mcp-validator.js');

function loadFresh(stubs = {}) {
  delete require.cache[require.resolve(MOD_PATH)];
  const originalLoad = Module._load;
  Module._load = function patchedLoad(req, parent, isMain) {
    if (stubs[req]) return stubs[req];
    return originalLoad.call(this, req, parent, isMain);
  };
  try {
    return require(MOD_PATH);
  } finally {
    Module._load = originalLoad;
  }
}

function withConfig(config, throwsOnLoad = false) {
  return {
    PROJECT_DIR: '/tmp/fake',
    loadConfig: () => {
      if (throwsOnLoad) throw new Error('config load failed');
      return config;
    },
  };
}

test('TC-A: orchestration.mcp 키 누락 → fallback true', () => {
  const m = loadFresh({
    './paths': withConfig({ orchestration: {} }),
  });
  assert.strictEqual(m.isMcpEnabled(), true);
});

test('TC-B: orchestration.mcp.enabled = false → false', () => {
  const m = loadFresh({
    './paths': withConfig({ orchestration: { mcp: { enabled: false } } }),
  });
  assert.strictEqual(m.isMcpEnabled(), false);
});

test('TC-C: legacy path config.mcp.enabled = true → true', () => {
  const m = loadFresh({
    './paths': withConfig({ mcp: { enabled: true } }),
  });
  assert.strictEqual(m.isMcpEnabled(), true);
});

test('TC-D: 빈 config 객체 → fallback true', () => {
  const m = loadFresh({
    './paths': withConfig({}),
  });
  assert.strictEqual(m.isMcpEnabled(), true);
});

test('TC-E: loadConfig throw → fallback true (예외 안전)', () => {
  const m = loadFresh({
    './paths': withConfig(null, true),
  });
  assert.strictEqual(m.isMcpEnabled(), true);
});

test('TC-F: orchestration.mcp.enabled = "false" 문자열 → false', () => {
  const m = loadFresh({
    './paths': withConfig({ orchestration: { mcp: { enabled: 'false' } } }),
  });
  assert.strictEqual(m.isMcpEnabled(), false);
});

test('TC-G: orchestration.mcp.enabled = "true" 문자열 → true', () => {
  const m = loadFresh({
    './paths': withConfig({ orchestration: { mcp: { enabled: 'true' } } }),
  });
  assert.strictEqual(m.isMcpEnabled(), true);
});

test('TC-H: 우선순위 — orchestration.mcp 가 root mcp 보다 우선', () => {
  const m = loadFresh({
    './paths': withConfig({
      orchestration: { mcp: { enabled: false } },
      mcp: { enabled: true },
    }),
  });
  assert.strictEqual(m.isMcpEnabled(), false);
});
