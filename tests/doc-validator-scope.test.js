#!/usr/bin/env node
/**
 * VAIS Code - scripts/doc-validator.js scope-contract 검증 테스트 (v0.58.3)
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-scope-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  const pluginConfig = path.join(__dirname, '..', 'vais.config.json');
  fs.copyFileSync(pluginConfig, path.join(tmpDir, 'vais.config.json'));
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function loadValidator() {
  Object.keys(require.cache).forEach(key => {
    const normalized = key.replace(/\\/g, '/');
    if (
      normalized.includes('scripts/doc-validator') ||
      normalized.includes('lib/paths') ||
      normalized.includes('lib/status')
    ) {
      delete require.cache[key];
    }
  });
  return require('../scripts/doc-validator');
}

function writeFile(relPath, content) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

/** 3섹션을 모두 포함하는 plan/main.md 본문 */
const FULL_PLAN = [
  '# test-feature - 기획서',
  '',
  '## 요청 원문',
  '',
  '> 사용자 요청 원문',
  '',
  '## In-scope',
  '',
  '- 항목 A',
  '',
  '## Out-of-scope',
  '',
  '- 항목 B',
  '',
  '## Executive Summary',
  '',
  '요약',
].join('\n');

describe('W-SCOPE-01/02/03 — plan-scope-contract', () => {
  // Assertion 1: 3섹션 모두 존재하면 경고 0건
  it('should return no warnings when all 3 sections are present', () => {
    writeFile('docs/test-feature/01-plan/main.md', FULL_PLAN);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    const scopeWarns = warns.filter(w => w.code.startsWith('W-SCOPE-'));
    assert.equal(scopeWarns.length, 0, '경고가 0건이어야 함');
  });

  // Assertion 2: "## 요청 원문" 섹션만 누락 → W-SCOPE-01 1건만
  it('should emit only W-SCOPE-01 when "## 요청 원문" is missing', () => {
    const content = [
      '# test-feature - 기획서',
      '',
      '## In-scope',
      '',
      '- 항목 A',
      '',
      '## Out-of-scope',
      '',
      '- 항목 B',
    ].join('\n');
    writeFile('docs/test-feature/01-plan/main.md', content);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    const codes = warns.map(w => w.code);
    assert.ok(codes.includes('W-SCOPE-01'), 'W-SCOPE-01 이 발화되어야 함');
    assert.ok(!codes.includes('W-SCOPE-02'), 'W-SCOPE-02 는 발화되지 않아야 함');
    assert.ok(!codes.includes('W-SCOPE-03'), 'W-SCOPE-03 는 발화되지 않아야 함');
    assert.equal(warns.length, 1, '경고가 정확히 1건이어야 함');
  });

  // Assertion 3: "## In-scope" 섹션만 누락 → W-SCOPE-02 1건만
  it('should emit only W-SCOPE-02 when "## In-scope" is missing', () => {
    const content = [
      '# test-feature - 기획서',
      '',
      '## 요청 원문',
      '',
      '> 사용자 요청 원문',
      '',
      '## Out-of-scope',
      '',
      '- 항목 B',
    ].join('\n');
    writeFile('docs/test-feature/01-plan/main.md', content);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    const codes = warns.map(w => w.code);
    assert.ok(!codes.includes('W-SCOPE-01'), 'W-SCOPE-01 은 발화되지 않아야 함');
    assert.ok(codes.includes('W-SCOPE-02'), 'W-SCOPE-02 가 발화되어야 함');
    assert.ok(!codes.includes('W-SCOPE-03'), 'W-SCOPE-03 는 발화되지 않아야 함');
    assert.equal(warns.length, 1, '경고가 정확히 1건이어야 함');
  });

  // Assertion 4: "## Out-of-scope" 섹션만 누락 → W-SCOPE-03 1건만
  it('should emit only W-SCOPE-03 when "## Out-of-scope" is missing', () => {
    const content = [
      '# test-feature - 기획서',
      '',
      '## 요청 원문',
      '',
      '> 사용자 요청 원문',
      '',
      '## In-scope',
      '',
      '- 항목 A',
    ].join('\n');
    writeFile('docs/test-feature/01-plan/main.md', content);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    const codes = warns.map(w => w.code);
    assert.ok(!codes.includes('W-SCOPE-01'), 'W-SCOPE-01 은 발화되지 않아야 함');
    assert.ok(!codes.includes('W-SCOPE-02'), 'W-SCOPE-02 는 발화되지 않아야 함');
    assert.ok(codes.includes('W-SCOPE-03'), 'W-SCOPE-03 가 발화되어야 함');
    assert.equal(warns.length, 1, '경고가 정확히 1건이어야 함');
  });

  // Assertion 5: 세 섹션 모두 누락 → W-SCOPE-01/02/03 3건 모두 발화
  it('should emit W-SCOPE-01/02/03 when all 3 sections are missing', () => {
    const content = [
      '# test-feature - 기획서',
      '',
      '## Executive Summary',
      '',
      '요약만 있음',
    ].join('\n');
    writeFile('docs/test-feature/01-plan/main.md', content);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    const codes = warns.map(w => w.code);
    assert.ok(codes.includes('W-SCOPE-01'), 'W-SCOPE-01 이 발화되어야 함');
    assert.ok(codes.includes('W-SCOPE-02'), 'W-SCOPE-02 가 발화되어야 함');
    assert.ok(codes.includes('W-SCOPE-03'), 'W-SCOPE-03 가 발화되어야 함');
    assert.equal(warns.length, 3, '경고가 정확히 3건이어야 함');
  });

  // Assertion 6: 다른 phase(02-design/main.md)에 섹션 없어도 경고 0건 (plan 만 적용)
  it('should return no warnings for 02-design/main.md even without scope sections', () => {
    const content = [
      '# test-feature - 설계서',
      '',
      '## Executive Summary',
      '',
      '요약만 있음. 스코프 섹션 없음.',
    ].join('\n');
    writeFile('docs/test-feature/02-design/main.md', content);
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    assert.equal(warns.length, 0, '다른 phase 는 경고가 0건이어야 함');
  });

  // Assertion 7: docs/{feature}/01-plan/main.md 파일 자체가 없으면 경고 0건 (조용한 스킵)
  it('should return no warnings when 01-plan/main.md does not exist', () => {
    // 01-plan 디렉토리 자체를 만들지 않음
    const { validateScopeContract } = loadValidator();
    const warns = validateScopeContract('test-feature');
    assert.equal(warns.length, 0, 'plan/main.md 없으면 경고가 0건이어야 함');
  });
});
