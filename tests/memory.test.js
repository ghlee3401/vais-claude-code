#!/usr/bin/env node
/**
 * VAIS Code - lib/memory.js 유닛 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-memory-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  // config 복사
  const pluginConfig = path.join(__dirname, '..', 'vais.config.json');
  fs.copyFileSync(pluginConfig, path.join(tmpDir, 'vais.config.json'));
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function loadMemory() {
  // 캐시 클리어
  Object.keys(require.cache).forEach(key => {
    if (key.includes('lib/memory') || key.includes('lib/paths')) {
      delete require.cache[key];
    }
  });
  return require('../lib/memory');
}

describe('memory - createEmptyMemory', () => {
  it('빈 메모리 객체 생성 (v2 + lastModified)', () => {
    const mem = loadMemory();
    const empty = mem.createEmptyMemory();
    assert.equal(empty.version, 2);
    assert.ok(empty.lastModified);
    assert.deepEqual(empty.entries, []);
  });
});

describe('memory - addEntry', () => {
  it('엔트리를 추가하고 파일에 저장', () => {
    const mem = loadMemory();
    const entry = mem.addEntry({
      type: 'decision',
      feature: 'login',
      phase: 'plan',
      summary: '인증 방식을 OAuth2로 결정',
      details: { alternatives: ['JWT', 'Session'], reason: '소셜 로그인 확장성' },
    });

    assert.ok(entry.id.startsWith('m-'));
    assert.equal(entry.type, 'decision');
    assert.equal(entry.feature, 'login');
    assert.equal(entry.summary, '인증 방식을 OAuth2로 결정');
    assert.ok(entry.timestamp);

    // 파일에 저장됐는지 확인
    const raw = fs.readFileSync(path.join(tmpDir, '.vais', 'memory.json'), 'utf8');
    const saved = JSON.parse(raw);
    assert.equal(saved.entries.length, 1);
    assert.ok(saved.entries[0].id.startsWith('m-'));
  });

  it('여러 엔트리 추가 시 ID 증가', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: '첫 번째' });
    mem.addEntry({ type: 'change', feature: 'login', summary: '두 번째' });
    const third = mem.addEntry({ type: 'debt', feature: 'cart', summary: '세 번째' });

    assert.ok(third.id.startsWith('m-'));
    const data = mem.getMemory();
    assert.equal(data.entries.length, 3);
    // 각 ID가 고유한지 확인
    const ids = data.entries.map(e => e.id);
    assert.equal(new Set(ids).size, 3);
  });

  it('잘못된 type은 에러', () => {
    const mem = loadMemory();
    assert.throws(() => {
      mem.addEntry({ type: 'invalid', summary: 'test' });
    }, /Invalid entry type/);
  });

  it('summary 없으면 에러', () => {
    const mem = loadMemory();
    assert.throws(() => {
      mem.addEntry({ type: 'decision' });
    }, /summary is required/);
  });
});

describe('memory - getEntriesByFeature', () => {
  it('피처별 엔트리 조회', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'login 결정' });
    mem.addEntry({ type: 'decision', feature: 'cart', summary: 'cart 결정' });
    mem.addEntry({ type: 'dependency', feature: 'cart', summary: 'cart→login', relatedFeatures: ['login'] });

    const loginEntries = mem.getEntriesByFeature('login');
    assert.equal(loginEntries.length, 2); // 직접 + relatedFeatures
    assert.ok(loginEntries.some(e => e.summary === 'login 결정'));
    assert.ok(loginEntries.some(e => e.summary === 'cart→login'));
  });
});

describe('memory - getEntriesByType', () => {
  it('타입별 엔트리 조회', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'a' });
    mem.addEntry({ type: 'debt', feature: 'login', summary: 'b' });
    mem.addEntry({ type: 'decision', feature: 'cart', summary: 'c' });

    const decisions = mem.getEntriesByType('decision');
    assert.equal(decisions.length, 2);
  });
});

describe('memory - getRecentEntries', () => {
  it('최근 N개 조회', () => {
    const mem = loadMemory();
    for (let i = 0; i < 5; i++) {
      mem.addEntry({ type: 'milestone', feature: 'login', summary: `entry-${i}` });
    }

    const recent = mem.getRecentEntries(3);
    assert.equal(recent.length, 3);
    assert.equal(recent[0].summary, 'entry-2');
    assert.equal(recent[2].summary, 'entry-4');
  });
});

describe('memory - getDependencyMap', () => {
  it('의존성 맵 생성', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'dependency', feature: 'cart', summary: 'cart→login', relatedFeatures: ['login'] });
    mem.addEntry({ type: 'dependency', feature: 'payment', summary: 'payment→cart', relatedFeatures: ['cart'] });

    const map = mem.getDependencyMap();
    assert.deepEqual(map.cart, ['login']);
    assert.deepEqual(map.payment, ['cart']);
  });
});

describe('memory - debt management', () => {
  it('미해결 부채 조회', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'debt', feature: 'login', summary: 'API URL 하드코딩' });
    mem.addEntry({ type: 'debt', feature: 'cart', summary: '임시 CSS' });

    const debts = mem.getOpenDebts();
    assert.equal(debts.length, 2);
  });

  it('부채 해결 표시', () => {
    const mem = loadMemory();
    const entry = mem.addEntry({ type: 'debt', feature: 'login', summary: 'API URL 하드코딩' });

    const resolved = mem.resolveDebt(entry.id);
    assert.ok(resolved.details.resolved);
    assert.ok(resolved.details.resolvedAt);

    const openDebts = mem.getOpenDebts();
    assert.equal(openDebts.length, 0);
  });
});

describe('memory - getEntriesByDateRange', () => {
  it('기간별 조회', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'test' });

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const entries = mem.getEntriesByDateRange(hourAgo.toISOString());
    assert.equal(entries.length, 1);

    const futureEntries = mem.getEntriesByDateRange(new Date(now.getTime() + 3600000).toISOString());
    assert.equal(futureEntries.length, 0);
  });
});

describe('memory - lastModified & getMemoryAge', () => {
  it('저장 시 lastModified 자동 갱신', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'test' });
    const data = mem.getMemory();
    assert.ok(data.lastModified);
    assert.equal(data.version, 2);
  });

  it('getMemoryAge 반환값 확인', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'test' });
    const age = mem.getMemoryAge();
    assert.ok(age.lastModified);
    assert.equal(typeof age.minutesAgo, 'number');
    assert.ok(age.minutesAgo < 1); // 방금 저장했으므로
    assert.equal(age.isStale, false);
  });

  it('v1 메모리 로드 시 자동 마이그레이션', () => {
    const mem = loadMemory();
    // .vais 디렉토리 생성 후 v1 형식으로 직접 저장
    fs.mkdirSync(path.join(tmpDir, '.vais'), { recursive: true });
    const v1Data = { version: 1, entries: [{ id: 'm-001', type: 'decision', summary: 'old' }] };
    fs.writeFileSync(path.join(tmpDir, '.vais', 'memory.json'), JSON.stringify(v1Data), 'utf8');

    // 캐시 클리어 후 재로드
    Object.keys(require.cache).forEach(key => {
      if (key.includes('lib/memory') || key.includes('lib/paths')) delete require.cache[key];
    });
    const mem2 = require('../lib/memory');
    const data = mem2.getMemory();
    assert.equal(data.version, 2);
    assert.ok(data.lastModified);
    assert.equal(data.entries.length, 1);
  });
});

describe('memory - getProjectSummary', () => {
  it('프로젝트 요약 생성', () => {
    const mem = loadMemory();
    mem.addEntry({ type: 'decision', feature: 'login', summary: 'a' });
    mem.addEntry({ type: 'dependency', feature: 'cart', summary: 'b', relatedFeatures: ['login'] });
    mem.addEntry({ type: 'debt', feature: 'login', summary: 'c' });

    const summary = mem.getProjectSummary();
    assert.equal(summary.totalEntries, 3);
    assert.ok(summary.features.includes('login'));
    assert.ok(summary.features.includes('cart'));
    assert.equal(summary.typeCounts.decision, 1);
    assert.equal(summary.typeCounts.dependency, 1);
    assert.equal(summary.typeCounts.debt, 1);
    assert.equal(summary.openDebts, 1);
    assert.ok(summary.latestEntry);
  });
});
