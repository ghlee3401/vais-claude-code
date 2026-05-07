#!/usr/bin/env node
/**
 * VAIS Code - scripts/doc-validator.js sub-doc 검증 테스트 (v0.57.0)
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-validator-test-'));
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
    if (normalized.includes('scripts/doc-validator') || normalized.includes('lib/paths') || normalized.includes('lib/status')) {
      delete require.cache[key];
    }
  });
  return require('../scripts/doc-validator');
}

function writeFile(relPath, content) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

describe('validateSubDocs — scratchpad 경고', () => {
  it('Author 헤더 없으면 W-SCP-01', () => {
    writeFile('docs/test-feature/02-design/_tmp/ui-designer.md',
      '> Phase: 02-design\n\n' + 'x'.repeat(600));
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature');
    const w = warns.find(w => w.code === 'W-SCP-01');
    assert.ok(w, 'W-SCP-01 경고 있어야 함');
    assert.match(w.message, /Author/);
  });

  it('Phase 헤더 없으면 W-SCP-02', () => {
    writeFile('docs/test-feature/02-design/_tmp/ui-designer.md',
      '> Author: ui-designer\n\n' + 'x'.repeat(600));
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature');
    const w = warns.find(w => w.code === 'W-SCP-02');
    assert.ok(w);
  });

  it('크기가 minBytes 미만이면 W-SCP-03', () => {
    writeFile('docs/test-feature/02-design/_tmp/ui-designer.md',
      '> Author: ui-designer\n> Phase: 02-design\n\nshort');
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature');
    const w = warns.find(w => w.code === 'W-SCP-03');
    assert.ok(w);
    assert.match(w.message, /500B/);
  });

  it('정상 scratchpad 는 경고 없음', () => {
    writeFile('docs/test-feature/02-design/_tmp/ui-designer.md',
      '> Author: ui-designer\n> Phase: 02-design\n> Refs: foo\n\n' + 'x'.repeat(600));
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature').filter(w => w.code.startsWith('W-SCP'));
    assert.equal(warns.length, 0);
  });
});

describe('validateSubDocs — main.md 링크 경고', () => {
  it('main.md 에 topic 파일명 링크 없으면 W-IDX-01', () => {
    writeFile('docs/test-feature/02-design/main.md', '# main\n\n인덱스 없음');
    writeFile('docs/test-feature/02-design/architecture.md',
      '# A\n\n## 큐레이션 기록\n');
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature');
    const w = warns.find(w => w.code === 'W-IDX-01');
    assert.ok(w);
    assert.match(w.message, /architecture\.md/);
  });

  it('main.md 에 topic 링크 존재하면 경고 없음', () => {
    writeFile('docs/test-feature/02-design/main.md',
      '# main\n\n## Topic Documents\n- [architecture.md](architecture.md)');
    writeFile('docs/test-feature/02-design/architecture.md',
      '# A\n\n## 큐레이션 기록\n');
    const { validateSubDocs } = loadValidator();
    const warns = validateSubDocs('test-feature').filter(w => w.code === 'W-IDX-01');
    assert.equal(warns.length, 0);
  });
});

describe('validateSubDocs — 통합', () => {
  it('feature 자체가 없으면 빈 배열', () => {
    const { validateSubDocs } = loadValidator();
    assert.deepEqual(validateSubDocs('no-such'), []);
  });

  it('_tmp/ 없고 topic 없으면 경고 없음', () => {
    writeFile('docs/test-feature/01-plan/main.md', '# main\n');
    const { validateSubDocs } = loadValidator();
    assert.deepEqual(validateSubDocs('test-feature'), []);
  });

  it('formatSubDocWarnings 가 사람이 읽는 라인을 반환', () => {
    writeFile('docs/test-feature/02-design/_tmp/ui-designer.md', 'short');
    const { validateSubDocs, formatSubDocWarnings } = loadValidator();
    const warns = validateSubDocs('test-feature');
    const out = formatSubDocWarnings(warns);
    assert.match(out, /\[sub-doc v0\.57\]/);
    assert.match(out, /W-SCP-/);
  });
});
