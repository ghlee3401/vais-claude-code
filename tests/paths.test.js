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
  it('피처명으로 문서 경로를 생성한다 (피처 중심 구조)', () => {
    const paths = loadPaths();
    const docPath = paths.resolveDocPath('plan', 'login-feature');
    assert.ok(docPath.includes('login-feature/01-plan/main.md'));
  });

  it('role을 전달해도 피처 중심 경로를 반환한다', () => {
    const paths = loadPaths();
    const docPath = paths.resolveDocPath('do', 'login', 'cso');
    assert.ok(docPath.includes('login/03-do/main.md'));
  });

  it('findDoc은 파일이 없으면 빈 문자열 반환', () => {
    const paths = loadPaths();
    assert.equal(paths.findDoc('plan', '없는피처'), '');
  });

  it('findDoc은 파일이 있으면 경로 반환 (피처 중심 구조)', () => {
    const paths = loadPaths();
    const docDir = path.join(tmpDir, 'docs', '테스트', '01-plan');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'main.md'), '# test');

    const found = paths.findDoc('plan', '테스트');
    assert.ok(found.includes(path.join('테스트', '01-plan', 'main.md')));
  });

  it('findDoc은 role과 무관하게 피처 중심 경로를 찾는다', () => {
    const paths = loadPaths();
    const docDir = path.join(tmpDir, 'docs', 'login', '03-do');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'main.md'), '# login do');

    const found = paths.findDoc('do', 'login', 'cpo');
    assert.ok(found.includes(path.join('login', '03-do', 'main.md')));
  });

  it('레거시 경로(docs/01-plan/...)는 더 이상 findDoc에서 매치되지 않는다 (회귀 가드)', () => {
    const paths = loadPaths();
    const legacyDir = path.join(tmpDir, 'docs', '01-plan');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'cto_old-feature.plan.md'), '# legacy');

    const found = paths.findDoc('plan', 'old-feature');
    assert.strictEqual(found, '', '새 구조 경로에 파일이 없으면 빈 문자열 반환해야 함');
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

