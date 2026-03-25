#!/usr/bin/env node
/**
 * VAIS Code - lib/debug.js 유닛 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origDebug;
let origLogPath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-debug-test-'));
  origDebug = process.env.VAIS_DEBUG;
  origLogPath = process.env.VAIS_DEBUG_LOG;
  // 모듈 캐시 클리어
  delete require.cache[require.resolve('../lib/debug')];
});

afterEach(() => {
  if (origDebug !== undefined) process.env.VAIS_DEBUG = origDebug;
  else delete process.env.VAIS_DEBUG;
  if (origLogPath !== undefined) process.env.VAIS_DEBUG_LOG = origLogPath;
  else delete process.env.VAIS_DEBUG_LOG;
  delete require.cache[require.resolve('../lib/debug')];
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('debugLog', () => {
  it('VAIS_DEBUG 미설정 시 로그 파일 미생성', () => {
    delete process.env.VAIS_DEBUG;
    const logFile = path.join(tmpDir, 'test.log');
    process.env.VAIS_DEBUG_LOG = logFile;
    const { debugLog } = require('../lib/debug');
    debugLog('Test', 'should not write');
    assert.equal(fs.existsSync(logFile), false);
  });

  it('VAIS_DEBUG=1 시 로그 기록', () => {
    process.env.VAIS_DEBUG = '1';
    const logFile = path.join(tmpDir, 'test.log');
    process.env.VAIS_DEBUG_LOG = logFile;
    const { debugLog } = require('../lib/debug');
    debugLog('Test', 'hello', { key: 'value' });
    const content = fs.readFileSync(logFile, 'utf8');
    assert.ok(content.includes('[Test]'));
    assert.ok(content.includes('hello'));
    assert.ok(content.includes('"key":"value"'));
  });

  it('circular reference 시 에러 없이 처리', () => {
    process.env.VAIS_DEBUG = '1';
    const logFile = path.join(tmpDir, 'test.log');
    process.env.VAIS_DEBUG_LOG = logFile;
    const { debugLog } = require('../lib/debug');
    const obj = {};
    obj.self = obj; // circular
    assert.doesNotThrow(() => {
      debugLog('Test', 'circular', obj);
    });
    const content = fs.readFileSync(logFile, 'utf8');
    assert.ok(content.includes('[circular or non-serializable]'));
  });
});
