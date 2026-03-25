#!/usr/bin/env node
/**
 * VAIS Code - lib/fs-utils.js 유닛 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { atomicWriteSync, fileExists } = require('../lib/fs-utils');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-fsutils-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('atomicWriteSync', () => {
  it('파일을 정상적으로 생성한다', () => {
    const filePath = path.join(tmpDir, 'test.json');
    atomicWriteSync(filePath, '{"key":"value"}');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(content, '{"key":"value"}');
  });

  it('기존 파일을 원자적으로 덮어쓴다', () => {
    const filePath = path.join(tmpDir, 'test.json');
    atomicWriteSync(filePath, 'original');
    atomicWriteSync(filePath, 'updated');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(content, 'updated');
  });

  it('tmp 파일이 남지 않는다', () => {
    const filePath = path.join(tmpDir, 'test.json');
    atomicWriteSync(filePath, 'data');
    const files = fs.readdirSync(tmpDir);
    assert.equal(files.length, 1);
    assert.equal(files[0], 'test.json');
  });
});

describe('fileExists', () => {
  it('존재하는 파일에 대해 true 반환', () => {
    const filePath = path.join(tmpDir, 'exists.txt');
    fs.writeFileSync(filePath, 'hello');
    assert.equal(fileExists(filePath), true);
  });

  it('존재하지 않는 파일에 대해 false 반환', () => {
    assert.equal(fileExists(path.join(tmpDir, 'nope.txt')), false);
  });

  it('디렉토리에 대해 true 반환', () => {
    assert.equal(fileExists(tmpDir), true);
  });
});
