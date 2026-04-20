#!/usr/bin/env node
/**
 * VAIS Code v0.58 - C-Level Coexistence 유닛 테스트
 *
 * 대상:
 *   - lib/status.js: getTopicPreset, registerTopic, listFeatureTopics, getMainDocSize, getOwnerSectionPresence
 *   - scripts/doc-validator.js: validateCoexistence (W-OWN-01/02, W-MRG-02/03, W-MAIN-SIZE)
 *
 * 케이스 T1~T10 (plan policy.md §3 SC-02, SC-08, SC-09, SC-15 회귀 가드).
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;
let status;
let validator;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-coexist-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  // 플러그인 config 복사 (topicPresets v2 + cLevelCoexistencePolicy 포함)
  const pluginConfig = path.join(__dirname, '..', 'vais.config.json');
  fs.copyFileSync(pluginConfig, path.join(tmpDir, 'vais.config.json'));

  // 모듈 캐시 클리어
  Object.keys(require.cache).forEach(key => {
    const n = key.replace(/\\/g, '/');
    if (n.includes('lib/status') || n.includes('lib/paths') || n.includes('scripts/doc-validator')) {
      delete require.cache[key];
    }
  });
  status = require('../lib/status');
  validator = require('../scripts/doc-validator');
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function write(p, content) { mkdirp(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }

describe('T1: getTopicPreset v2 schema (phase × c-level)', () => {
  it('CPO plan 프리셋을 반환한다', () => {
    const preset = status.getTopicPreset('plan', 'cpo');
    assert.deepEqual(preset, ['requirements', 'user-stories', 'acceptance-criteria']);
  });
  it('CTO plan 프리셋을 반환한다', () => {
    const preset = status.getTopicPreset('plan', 'cto');
    assert.deepEqual(preset, ['architecture-plan', 'impact-analysis', 'tech-risks']);
  });
  it('없는 c-level 은 _default 로 폴백한다', () => {
    const preset = status.getTopicPreset('do', 'cso');
    assert.deepEqual(preset, ['implementation', 'changes', 'tests']);
  });
});

describe('T2: getTopicPreset v1 backward-compat (배열 형식)', () => {
  it('배열 형식 topicPresets 도 그대로 반환한다', () => {
    // tmpDir 의 config 에서 topicPresets 만 v1 배열 형식으로 surgical 교체 (cSuite/orchestration 유지)
    const cfgPath = path.join(tmpDir, 'vais.config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.workflow.topicPresets = {
      '00-ideation': ['x'],
      '01-plan': ['a', 'b', 'c'],
      '02-design': ['d'],
      '03-do': ['e'],
      '04-qa': ['f'],
      '05-report': []
    };
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
    Object.keys(require.cache).forEach(k => { if (k.includes('lib/paths') || k.includes('lib/status')) delete require.cache[k]; });
    const s = require('../lib/status');
    assert.deepEqual(s.getTopicPreset('plan', 'cto'), ['a', 'b', 'c']);
  });
});

describe('T3: registerTopic + listFeatureTopics 왕복', () => {
  it('topic 을 등록하고 조회한다', () => {
    const entry = status.registerTopic('saas-demo', 'plan', 'requirements', { owner: 'cpo', authors: ['prd-writer'] });
    assert.ok(entry);
    assert.equal(entry.owner, 'cpo');
    assert.equal(entry.topic, 'requirements');
    assert.deepEqual(entry.authors, ['prd-writer']);

    const list = status.listFeatureTopics('saas-demo', 'plan');
    assert.equal(list.length, 1);
    assert.equal(list[0].topic, 'requirements');
  });
  it('invalid owner 는 거부한다', () => {
    const entry = status.registerTopic('saas-demo', 'plan', 'x', { owner: 'pm' });
    assert.equal(entry, null);
  });
});

describe('T4: W-OWN-01 — topic.md frontmatter owner 누락', () => {
  it('owner 없는 topic.md 는 W-OWN-01 을 발화한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n## Decision Record\n| # | Decision | Owner | Rationale | Source |\n');
    write(`${tmpDir}/docs/demo/01-plan/requirements.md`, '---\ntopic: requirements\n---\n\n본문');
    const warns = validator.validateCoexistence('demo');
    const codes = warns.map(w => w.code);
    assert.ok(codes.includes('W-OWN-01'), `expected W-OWN-01 in ${JSON.stringify(codes)}`);
  });
});

describe('T5: W-OWN-02 — invalid owner', () => {
  it('owner 가 enum 외이면 W-OWN-02 를 발화한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n## Decision Record\n| # | Decision | Owner | Rationale | Source |\n');
    write(`${tmpDir}/docs/demo/01-plan/bad.md`, '---\nowner: pm\ntopic: bad\n---\n\n본문');
    const warns = validator.validateCoexistence('demo');
    assert.ok(warns.some(w => w.code === 'W-OWN-02'), 'expected W-OWN-02');
  });
});

describe('T6: W-MRG-02 — Decision Record 에 Owner 컬럼 누락', () => {
  it('Decision Record 표 헤더에 Owner 가 없으면 W-MRG-02 를 발화한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`,
      '# demo\n\n## Decision Record\n\n| # | Decision | Rationale |\n|---|----------|-----------|\n| 1 | foo | bar |\n');
    const warns = validator.validateCoexistence('demo');
    assert.ok(warns.some(w => w.code === 'W-MRG-02'), 'expected W-MRG-02');
  });
});

describe('T7: W-MRG-03 — topic ≥ 2 이지만 owner 섹션 0개', () => {
  it('topic 이 여러 개인데 H2 owner 섹션이 없으면 W-MRG-03 를 발화한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n\n(아무 섹션도 없음)\n');
    write(`${tmpDir}/docs/demo/01-plan/a.md`, '---\nowner: cto\ntopic: a\n---\n본문');
    write(`${tmpDir}/docs/demo/01-plan/b.md`, '---\nowner: cpo\ntopic: b\n---\n본문');
    const warns = validator.validateCoexistence('demo');
    assert.ok(warns.some(w => w.code === 'W-MRG-03'), 'expected W-MRG-03');
  });
  it('H2 owner 섹션이 있으면 W-MRG-03 을 발화하지 않는다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n\n## [CTO] 기술\n\n## [CPO] 제품\n');
    write(`${tmpDir}/docs/demo/01-plan/a.md`, '---\nowner: cto\ntopic: a\n---\n본문');
    write(`${tmpDir}/docs/demo/01-plan/b.md`, '---\nowner: cpo\ntopic: b\n---\n본문');
    const warns = validator.validateCoexistence('demo');
    assert.ok(!warns.some(w => w.code === 'W-MRG-03'), `unexpected W-MRG-03 in ${JSON.stringify(warns)}`);
  });
});

describe('T8: 재진입 — 자기 섹션 교체 허용 (status 기록)', () => {
  it('registerTopic 을 같은 키로 2번 호출하면 덮어쓴다', () => {
    status.registerTopic('saas-demo', 'plan', 'requirements', { owner: 'cpo', authors: ['v1'] });
    status.registerTopic('saas-demo', 'plan', 'requirements', { owner: 'cpo', authors: ['v2'] });
    const list = status.listFeatureTopics('saas-demo', 'plan');
    assert.equal(list.length, 1);
    assert.deepEqual(list[0].authors, ['v2']);
  });
});

describe('T9: W-MAIN-SIZE (F14) — main.md 비대화 + topic 0 + _tmp 0', () => {
  it('main.md 가 threshold 초과 AND topic 0 AND _tmp 0 이면 W-MAIN-SIZE 를 발화한다', () => {
    // 210 라인짜리 main.md 생성
    const lines = Array(215).fill('본문 라인').join('\n');
    write(`${tmpDir}/docs/demo/01-plan/main.md`, `# demo\n\n${lines}\n`);
    const warns = validator.validateCoexistence('demo');
    const sizeWarn = warns.find(w => w.code === 'W-MAIN-SIZE');
    assert.ok(sizeWarn, `expected W-MAIN-SIZE in ${JSON.stringify(warns.map(w => w.code))}`);
    assert.match(sizeWarn.message, /lines exceeds mainMdMaxLines/);
  });
});

describe('T10: W-MAIN-SIZE 비발화 — topic ≥ 1 또는 _tmp ≥ 1', () => {
  it('topic 이 1개라도 있으면 W-MAIN-SIZE 를 발화하지 않는다', () => {
    const lines = Array(215).fill('본문 라인').join('\n');
    write(`${tmpDir}/docs/demo/01-plan/main.md`, `# demo\n\n## [CTO] 기술\n\n${lines}\n`);
    write(`${tmpDir}/docs/demo/01-plan/architecture.md`, '---\nowner: cto\ntopic: architecture\n---\n본문');
    const warns = validator.validateCoexistence('demo');
    assert.ok(!warns.some(w => w.code === 'W-MAIN-SIZE'),
      `unexpected W-MAIN-SIZE when topic exists: ${JSON.stringify(warns)}`);
  });
  it('main.md 가 threshold 이하이면 W-MAIN-SIZE 를 발화하지 않는다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n\n짧은 내용\n');
    const warns = validator.validateCoexistence('demo');
    assert.ok(!warns.some(w => w.code === 'W-MAIN-SIZE'));
  });
});

describe('F14 helpers: getMainDocSize / getOwnerSectionPresence', () => {
  it('getMainDocSize 는 라인/바이트 수를 반환한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n\n1\n2\n3\n');
    const size = status.getMainDocSize('demo', 'plan');
    assert.ok(size.exists);
    assert.ok(size.lines >= 5);
    assert.ok(size.bytes > 0);
  });
  it('getOwnerSectionPresence 는 H2 섹션을 스캔한다', () => {
    write(`${tmpDir}/docs/demo/01-plan/main.md`, '# demo\n\n## [CTO] 기술\n\n## [CPO] 제품\n');
    const p = status.getOwnerSectionPresence('demo', 'plan');
    assert.equal(p.cto, true);
    assert.equal(p.cpo, true);
    assert.equal(p.cso, false);
  });
});
