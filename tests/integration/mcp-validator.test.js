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

function makeChildProcessStub(behavior) {
  return {
    execFileSync: (cmd, args) => behavior(cmd, args),
  };
}

function makeFsStub({ vendorDir = true, dataDir = true, dataEntries = ['x'], scriptFile = true, master = null } = {}) {
  return {
    existsSync: (p) => {
      if (p.includes('design-system') && p.includes('MASTER.md')) {
        return master?.exists ?? false;
      }
      if (p.endsWith('search.py')) return scriptFile;
      if (p.endsWith('data')) return dataDir;
      if (p.endsWith('ui-ux-pro-max')) return vendorDir;
      return false;
    },
    readdirSync: () => dataEntries,
    statSync: () => ({ isFile: () => true, size: master?.size ?? 0 }),
    readFileSync: () => '',
  };
}

function makePathsStub(config) {
  return {
    PROJECT_DIR: '/tmp/fake',
    loadConfig: () => config,
  };
}

test('TC-1: Python3 정상 → ok: true', () => {
  const cp = makeChildProcessStub((cmd) => {
    if (cmd === 'python3') return 'Python 3.11.7\n';
    return '';
  });
  const fsStub = makeFsStub();
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({ orchestration: { mcp: { enabled: true } } }),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.pythonVersion, '3.11');
});

test('TC-2: Python3 미설치 → ok: false, reason: not-installed', () => {
  const cp = makeChildProcessStub(() => {
    const err = new Error('spawn python3 ENOENT');
    throw err;
  });
  const fsStub = makeFsStub();
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'not-installed');
});

test('TC-3: Python 3.7 → ok: false, version-too-low (3.8 minimum)', () => {
  const cp = makeChildProcessStub(() => 'Python 3.7.16\n');
  const fsStub = makeFsStub();
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'version-too-low');
  assert.match(r.detail, /3\.7/);
});

test('TC-3b: Python 3.9 → ok: true (3.8 minimum 통과)', () => {
  const cp = makeChildProcessStub(() => 'Python 3.9.18\n');
  const fsStub = makeFsStub();
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.pythonVersion, '3.9');
});

test('TC-4: vendor 디렉토리 누락 → vendor-missing', () => {
  const cp = makeChildProcessStub(() => 'Python 3.11.7\n');
  const fsStub = makeFsStub({ vendorDir: false });
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'vendor-missing');
});

test('TC-5: vendor data empty → vendor-empty', () => {
  const cp = makeChildProcessStub(() => 'Python 3.11.7\n');
  const fsStub = makeFsStub({ dataEntries: [] });
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.validateEnvironment();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'vendor-empty');
});

test('TC-6: 안내 메시지 형식 — 4종 reason 모두 한국어 본문 + 조치', () => {
  const m = loadFresh({
    './paths': makePathsStub({}),
  });
  const reasons = ['not-installed', 'version-too-low', 'vendor-missing', 'vendor-empty'];
  for (const reason of reasons) {
    const msg = m.buildErrorMessage({ ok: false, reason, detail: 'sample' });
    assert.match(msg, /design-system MCP 활성화 실패/);
    assert.match(msg, /원인:/);
    assert.match(msg, /조치:/);
    assert.match(msg, /https:\/\/www\.python\.org/);
    assert.match(msg, /vais\.config\.json/);
  }
});

test('feature 이름 검증 — 패턴 위반 시 runGenerate 거부', () => {
  const cp = makeChildProcessStub(() => '');
  const fsStub = makeFsStub();
  const m = loadFresh({
    child_process: cp,
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  const r = m.runGenerate('bad name with spaces!@#');
  assert.strictEqual(r.ok, false);
  assert.match(r.stderr, /feature 이름 규칙 위반/);
});

test('hasMasterDoc — file 존재 + size > 0 → true', () => {
  const fsStub = makeFsStub({ master: { exists: true, size: 100 } });
  const m = loadFresh({
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  assert.strictEqual(m.hasMasterDoc('my-feature'), true);
});

test('hasMasterDoc — file 없음 → false', () => {
  const fsStub = makeFsStub({ master: { exists: false } });
  const m = loadFresh({
    fs: fsStub,
    './paths': makePathsStub({}),
  });
  assert.strictEqual(m.hasMasterDoc('my-feature'), false);
});
