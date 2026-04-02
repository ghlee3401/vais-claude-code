#!/usr/bin/env node
/**
 * VAIS Code - lib/paths.js 유닛 테스트
 * Node.js built-in test runner (node --test)
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 테스트용 임시 디렉토리에서 실행하기 위한 설정
let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// paths.js를 매번 새로 로드 (process.cwd() 캐시 문제 방지)
function loadPaths() {
  const modPath = require.resolve('../lib/paths');
  delete require.cache[modPath];
  // paths 내부에서 참조하는 모듈도 캐시 클리어
  Object.keys(require.cache).forEach(key => {
    if (key.includes('lib/paths') || key.includes('lib/status')) {
      delete require.cache[key];
    }
  });
  return require('../lib/paths');
}

describe('ensureVaisDirs', () => {
  it('.vais 디렉토리를 생성한다', () => {
    const paths = loadPaths();
    paths.ensureVaisDirs();
    assert.ok(fs.existsSync(path.join(tmpDir, '.vais')));
  });

  it('이미 존재하면 에러 없이 통과한다', () => {
    const paths = loadPaths();
    paths.ensureVaisDirs();
    paths.ensureVaisDirs(); // 두 번째 호출
    assert.ok(fs.existsSync(path.join(tmpDir, '.vais')));
  });
});

describe('loadConfig', () => {
  it('프로젝트에 vais.config.json이 있으면 우선 로드한다', () => {
    const paths = loadPaths();
    const projectConfig = { version: '9.9.9', workflow: { phases: ['test'] }, cSuite: {}, orchestration: {} };
    fs.writeFileSync(path.join(tmpDir, 'vais.config.json'), JSON.stringify(projectConfig));

    const config = paths.loadConfig();
    assert.equal(config.version, '9.9.9');
    assert.deepEqual(config.workflow.phases, ['test']);
  });

  it('프로젝트에 config 없으면 플러그인 기본 config를 로드한다', () => {
    const paths = loadPaths();
    const config = paths.loadConfig();
    assert.ok(config.version);
    assert.ok(Array.isArray(config.workflow?.phases));
  });
});

describe('resolveDocPath / findDoc', () => {
  it('피처명과 role로 문서 경로를 생성한다', () => {
    const paths = loadPaths();
    // role 기본값 cto
    const docPath = paths.resolveDocPath('plan', '로그인기능');
    assert.ok(docPath.includes('01-plan'));
    assert.ok(docPath.includes('cto_로그인기능'));
  });

  it('role을 명시적으로 전달할 수 있다', () => {
    const paths = loadPaths();
    const docPath = paths.resolveDocPath('do', 'login', 'cso');
    assert.ok(docPath.includes('03-do'));
    assert.ok(docPath.includes('cso_login'));
  });

  it('findDoc은 파일이 없으면 빈 문자열 반환', () => {
    const paths = loadPaths();
    assert.equal(paths.findDoc('plan', '없는피처'), '');
  });

  it('findDoc은 파일이 있으면 경로 반환', () => {
    const paths = loadPaths();
    const docDir = path.join(tmpDir, 'docs', '01-plan');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'cto_테스트.plan.md'), '# test');

    const found = paths.findDoc('plan', '테스트');
    assert.ok(found.includes('cto_테스트.plan.md'));
  });

  it('findDoc에 role 전달 시 해당 role 문서를 찾는다', () => {
    const paths = loadPaths();
    const docDir = path.join(tmpDir, 'docs', '03-do');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'cmo_login.do.md'), '# marketing');

    const found = paths.findDoc('do', 'login', 'cmo');
    assert.ok(found.includes('cmo_login.do.md'));
  });
});

describe('loadOutputStyle', () => {
  it('output-styles/vais-default.md를 로드한다', () => {
    const paths = loadPaths();
    const style = paths.loadOutputStyle();
    assert.ok(style.length > 0);
    assert.ok(style.includes('VAIS Code'));
  });
});

