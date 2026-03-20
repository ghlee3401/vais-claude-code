#!/usr/bin/env node
/**
 * VAIS Code - lib/io.js 유닛 테스트
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseHookInput, truncate, MAX_CONTEXT_LENGTH } = require('../lib/io');

describe('parseHookInput', () => {
  it('tool_input에서 command를 파싱한다', () => {
    const input = { tool_input: { command: 'npm install' } };
    const result = parseHookInput(input);
    assert.equal(result.command, 'npm install');
  });

  it('tool_input에서 file_path를 파싱한다', () => {
    const input = { tool_input: { file_path: '/src/app.js' } };
    const result = parseHookInput(input);
    assert.equal(result.filePath, '/src/app.js');
  });

  it('input 키에서도 파싱한다 (대체 형식)', () => {
    const input = { input: { command: 'ls -la', file_path: '/tmp/test' } };
    const result = parseHookInput(input);
    assert.equal(result.command, 'ls -la');
    assert.equal(result.filePath, '/tmp/test');
  });

  it('빈 입력에서 빈 문자열 반환', () => {
    const result = parseHookInput({});
    assert.equal(result.command, '');
    assert.equal(result.filePath, '');
    assert.equal(result.content, '');
  });

  it('undefined 입력 처리', () => {
    const result = parseHookInput(undefined);
    assert.equal(result.command, '');
  });
});

describe('truncate', () => {
  it('짧은 텍스트는 그대로 반환', () => {
    assert.equal(truncate('hello', 100), 'hello');
  });

  it('긴 텍스트를 자른다', () => {
    const long = 'a'.repeat(200);
    const result = truncate(long, 100);
    assert.ok(result.length < 200);
    assert.ok(result.includes('... (truncated)'));
  });

  it('기본 최대 길이는 MAX_CONTEXT_LENGTH', () => {
    const long = 'x'.repeat(MAX_CONTEXT_LENGTH + 100);
    const result = truncate(long);
    assert.ok(result.length <= MAX_CONTEXT_LENGTH + 20); // truncated 메시지 포함
  });

  it('null/undefined는 빈 문자열 반환', () => {
    assert.equal(truncate(null), '');
    assert.equal(truncate(undefined), '');
    assert.equal(truncate(''), '');
  });
});
