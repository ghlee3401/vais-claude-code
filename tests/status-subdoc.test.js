#!/usr/bin/env node
/**
 * VAIS Code - lib/status.js sub-doc 트래킹 유닛 테스트 (v0.57.0)
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-subdoc-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  const pluginConfig = path.join(__dirname, '..', 'vais.config.json');
  fs.copyFileSync(pluginConfig, path.join(tmpDir, 'vais.config.json'));
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function loadStatus() {
  Object.keys(require.cache).forEach(key => {
    const normalized = key.replace(/\\/g, '/');
    if (normalized.includes('lib/status') || normalized.includes('lib/paths')) {
      delete require.cache[key];
    }
  });
  return require('../lib/status');
}

// 테스트용 실재 파일 생성 (size 자동 계산 대상)
function touchSubDoc(feature, phaseFolder, relPath, content = 'hello') {
  const dir = path.join(tmpDir, 'docs', feature, phaseFolder);
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return path.relative(tmpDir, full);
}

describe('registerSubDoc — scratchpad', () => {
  it('scratchpad 엔트리를 status.json 에 저장한다', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const p = touchSubDoc('test-feature', '02-design', '_tmp/ui-designer.md', 'a'.repeat(600));

    const e = s.registerSubDoc('test-feature', {
      phase: '02-design', kind: 'scratchpad', agent: 'ui-designer', path: p,
    });
    assert.ok(e);
    assert.equal(e.kind, 'scratchpad');
    assert.equal(e.agent, 'ui-designer');
    assert.equal(e.topic, null);
    assert.equal(e.size, 600);
    assert.ok(e.updatedAt);

    const list = s.listSubDocs('test-feature');
    assert.equal(list.length, 1);
    assert.equal(list[0].agent, 'ui-designer');
  });

  it('동일 키 재등록 시 덮어쓴다 (중복 방지)', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const p = touchSubDoc('test-feature', '02-design', '_tmp/ui-designer.md', 'short');
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'ui-designer', path: p });

    // 파일 크기 증가 후 재등록
    fs.writeFileSync(path.join(tmpDir, p), 'a'.repeat(1000));
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'ui-designer', path: p });

    const list = s.listSubDocs('test-feature');
    assert.equal(list.length, 1);
    assert.equal(list[0].size, 1000);
  });

  it('qualifier 다르면 별도 엔트리', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const p1 = touchSubDoc('test-feature', '02-design', '_tmp/ui-designer.md', 'aaa');
    const p2 = touchSubDoc('test-feature', '02-design', '_tmp/ui-designer.review.md', 'bbb');

    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'ui-designer', path: p1 });
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'ui-designer', qualifier: 'review', path: p2 });

    const list = s.listSubDocs('test-feature');
    assert.equal(list.length, 2);
  });
});

describe('registerSubDoc — topic', () => {
  it('topic 문서 엔트리를 저장한다', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const p = touchSubDoc('test-feature', '02-design', 'architecture.md', 'aaaa');

    const e = s.registerSubDoc('test-feature', {
      phase: '02-design', kind: 'topic', topic: 'architecture', path: p,
    });
    assert.ok(e);
    assert.equal(e.kind, 'topic');
    assert.equal(e.topic, 'architecture');
    assert.equal(e.agent, null);
  });
});

describe('registerSubDoc — 검증', () => {
  it('kind 미지정 시 null 반환', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    assert.equal(s.registerSubDoc('test-feature', { phase: '02-design', path: '/tmp/x' }), null);
  });

  it('scratchpad 인데 agent 없으면 null 반환', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    assert.equal(s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', path: '/tmp/x' }), null);
  });

  it('topic 인데 topic 필드 없으면 null 반환', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    assert.equal(s.registerSubDoc('test-feature', { phase: '02-design', kind: 'topic', path: '/tmp/x' }), null);
  });

  it('잘못된 feature 이름은 null 반환 (path traversal 방지)', () => {
    const s = loadStatus();
    assert.equal(s.registerSubDoc('../evil', { phase: '02-design', kind: 'scratchpad', agent: 'x', path: '/tmp/x' }), null);
  });
});

describe('listSubDocs — 필터', () => {
  it('phase 필터로 조회', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const pA = touchSubDoc('test-feature', '02-design', '_tmp/a.md', 'a');
    const pB = touchSubDoc('test-feature', '03-do', '_tmp/b.md', 'b');
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'a', path: pA });
    s.registerSubDoc('test-feature', { phase: '03-do', kind: 'scratchpad', agent: 'b', path: pB });

    assert.equal(s.listSubDocs('test-feature', { phase: '02-design' }).length, 1);
    assert.equal(s.listSubDocs('test-feature', { phase: '03-do' }).length, 1);
    assert.equal(s.listSubDocs('test-feature').length, 2);
  });

  it('kind 필터로 조회', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const pA = touchSubDoc('test-feature', '02-design', '_tmp/a.md', 'a');
    const pB = touchSubDoc('test-feature', '02-design', 'architecture.md', 'b');
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'a', path: pA });
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'topic', topic: 'architecture', path: pB });

    assert.equal(s.listSubDocs('test-feature', { kind: 'scratchpad' }).length, 1);
    assert.equal(s.listSubDocs('test-feature', { kind: 'topic' }).length, 1);
  });

  it('존재하지 않는 feature 는 빈 배열', () => {
    const s = loadStatus();
    assert.deepEqual(s.listSubDocs('no-such-feature'), []);
  });
});

describe('unregisterSubDoc', () => {
  it('엔트리를 제거한다', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const p = touchSubDoc('test-feature', '02-design', '_tmp/a.md', 'a');
    s.registerSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'a', path: p });
    assert.equal(s.listSubDocs('test-feature').length, 1);

    const removed = s.unregisterSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'a', path: p });
    assert.equal(removed, true);
    assert.equal(s.listSubDocs('test-feature').length, 0);
  });

  it('존재하지 않는 키는 false 반환', () => {
    const s = loadStatus();
    s.initFeature('test-feature');
    const r = s.unregisterSubDoc('test-feature', { phase: '02-design', kind: 'scratchpad', agent: 'zzz', path: '/tmp/x' });
    assert.equal(r, false);
  });
});
