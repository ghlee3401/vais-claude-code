#!/usr/bin/env node
/**
 * VAIS Code - auto-judge.js v0.57 _tmp/qa-engineer.md fallback 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-judge-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  const pluginConfig = path.join(__dirname, '..', 'vais.config.json');
  fs.copyFileSync(pluginConfig, path.join(tmpDir, 'vais.config.json'));

  fs.mkdirSync(path.join(tmpDir, '.vais'), { recursive: true });
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function loadJudge() {
  Object.keys(require.cache).forEach(key => {
    const normalized = key.replace(/\\/g, '/');
    if (normalized.includes('scripts/auto-judge') || normalized.includes('lib/paths') || normalized.includes('lib/status')) {
      delete require.cache[key];
    }
  });
  return require('../scripts/auto-judge');
}

function writeFile(relPath, content) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

// gap analysis 주입 (judgeCTO 가 matchRate 를 읽는 소스)
function seedGap(feature, matchRate) {
  const statusPath = path.join(tmpDir, '.vais', 'status.json');
  const status = {
    version: 2,
    activeFeature: feature,
    features: {
      [feature]: {
        docs: {},
        gapAnalysis: { matchRate, timestamp: new Date().toISOString() },
      },
    },
  };
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

describe('auto-judge — judgeCTO main.md primary', () => {
  it('main.md 에 Critical: 0 있으면 해당 값을 파싱', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA\n\nCritical: 0\n');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 0);
    assert.ok(!result.details.issues.some(i => /fallback/.test(i)));
  });

  it('main.md 에 Critical: 3 있으면 실패 판정', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA\n\nCritical: 3\n');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 3);
    assert.equal(result.passed, false);
  });
});

describe('auto-judge — judgeCTO _tmp/qa-engineer.md fallback', () => {
  it('main.md 에 Critical 패턴 없고 _tmp/qa-engineer.md 에 있으면 fallback 사용', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA\n\n내용만 있고 Critical 숫자 없음');
    writeFile('docs/feat/04-qa/_tmp/qa-engineer.md',
      '> Author: qa-engineer\n> Phase: 04-qa\n\n## 메트릭\nCritical: 0\nImportant: 5\n');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 0);
    assert.ok(
      result.details.issues.some(i => /fallback/.test(i)),
      'fallback 사용 사실이 issues 에 기록되어야 함'
    );
  });

  it('fallback 에도 Critical 2 가 있으면 그 값 사용', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA\n\n숫자 없음');
    writeFile('docs/feat/04-qa/_tmp/qa-engineer.md',
      '> Author: qa-engineer\n\nCritical: 2\n');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 2);
    assert.equal(result.passed, false);
  });

  it('main.md 에 Critical 이 있으면 fallback 은 건드리지 않음 (primary 우선)', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA\n\nCritical: 7\n');
    writeFile('docs/feat/04-qa/_tmp/qa-engineer.md',
      '> Author: qa-engineer\n\nCritical: 99\n');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 7);
    assert.ok(!result.details.issues.some(i => /fallback/.test(i)));
  });

  it('main.md 와 fallback 모두 Critical 패턴 없으면 기본 0', () => {
    seedGap('feat', 95);
    writeFile('docs/feat/03-do/main.md', '# do');
    writeFile('docs/feat/04-qa/main.md', '# QA 있음');
    writeFile('docs/feat/04-qa/_tmp/qa-engineer.md', '> Author: qa-engineer\n\n일반 본문');

    const { judge } = loadJudge();
    const result = judge('cto', 'feat');
    assert.equal(result.metrics.criticalIssueCount, 0);
  });
});
