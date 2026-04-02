#!/usr/bin/env node
/**
 * VAIS Code - lib/status.js 유닛 테스트
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
let origCwd;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-status-test-'));
  origCwd = process.cwd();
  process.chdir(tmpDir);

  // 플러그인 config에서 phases를 읽으므로 프로젝트에 config 복사
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

describe('createEmptyStatus', () => {
  it('빈 상태 객체를 생성한다', () => {
    const status = loadStatus();
    const empty = status.createEmptyStatus();
    assert.equal(empty.version, 2);
    assert.equal(empty.activeFeature, null);
    assert.deepEqual(empty.features, {});
  });
});

describe('initFeature', () => {
  it('새 피처를 초기화한다', () => {
    const status = loadStatus();
    const result = status.initFeature('로그인기능');
    assert.ok(result.features['로그인기능']);
    assert.equal(result.activeFeature, '로그인기능');
    assert.ok(result.features['로그인기능'].phases.plan);
    assert.equal(result.features['로그인기능'].phases.plan.status, 'pending');
  });

  it('이미 존재하는 피처는 덮어쓰지 않는다', () => {
    const status = loadStatus();
    status.initFeature('피처A');
    status.updatePhase('피처A', 'plan', 'completed');

    status.initFeature('피처A');
    const result = status.getStatus();
    assert.equal(result.features['피처A'].phases.plan.status, 'completed');
  });
});

describe('updatePhase', () => {
  it('페이즈를 in-progress로 업데이트한다', () => {
    const status = loadStatus();
    status.initFeature('테스트');
    status.updatePhase('테스트', 'plan', 'in-progress');
    const result = status.getStatus();
    assert.equal(result.features['테스트'].phases.plan.status, 'in-progress');
    assert.ok(result.features['테스트'].phases.plan.startedAt);
  });

  it('completed 시 currentPhase를 다음 단계로 이동한다', () => {
    const status = loadStatus();
    status.initFeature('테스트');
    status.updatePhase('테스트', 'plan', 'completed');
    const result = status.getStatus();
    // plan 다음은 design
    assert.equal(result.features['테스트'].currentPhase, 'design');
  });

  it('존재하지 않는 피처에 updatePhase 호출 시 자동 초기화', () => {
    const status = loadStatus();
    status.updatePhase('새피처', 'plan', 'in-progress');
    const result = status.getStatus();
    assert.ok(result.features['새피처']);
    assert.equal(result.features['새피처'].phases.plan.status, 'in-progress');
  });
});

describe('saveGapAnalysis / getGapAnalysis', () => {
  it('Gap 분석 결과를 저장하고 조회한다', () => {
    const status = loadStatus();
    status.initFeature('갭테스트');
    status.saveGapAnalysis('갭테스트', {
      matchRate: 85,
      totalItems: 20,
      matchedItems: 17,
      iteration: 2,
      maxIterations: 5,
      threshold: 90,
      gaps: ['gap1'],
    });

    const gap = status.getGapAnalysis('갭테스트');
    assert.equal(gap.matchRate, 85);
    assert.equal(gap.passed, false);
    assert.equal(gap.totalItems, 20);
    assert.equal(gap.iteration, 2);
  });

  it('90% 이상이면 passed = true', () => {
    const status = loadStatus();
    status.initFeature('통과테스트');
    status.saveGapAnalysis('통과테스트', {
      matchRate: 95,
      totalItems: 20,
      matchedItems: 19,
    });

    const gap = status.getGapAnalysis('통과테스트');
    assert.equal(gap.passed, true);
  });
});

describe('setRunRange / getRunRange / completeRunRange', () => {
  it('범위 실행을 설정하고 조회한다', () => {
    const status = loadStatus();
    status.initFeature('범위테스트');
    const rangePhases = status.setRunRange('범위테스트', 'plan', 'do');
    assert.ok(Array.isArray(rangePhases));
    assert.ok(rangePhases.includes('plan'));
    assert.ok(rangePhases.includes('design'));
    assert.ok(rangePhases.includes('do'));

    const range = status.getRunRange('범위테스트');
    assert.equal(range.from, 'plan');
    assert.equal(range.to, 'do');
    assert.ok(range.startedAt);
    assert.equal(range.completedAt, null);
  });

  it('범위 실행 완료를 표시한다', () => {
    const status = loadStatus();
    status.initFeature('완료테스트');
    status.setRunRange('완료테스트', 'plan', 'qa');
    status.completeRunRange('완료테스트');

    const range = status.getRunRange('완료테스트');
    assert.ok(range.completedAt);
  });

  it('from > to 이면 null 반환', () => {
    const status = loadStatus();
    status.initFeature('역순테스트');
    const result = status.setRunRange('역순테스트', 'be', 'plan');
    assert.equal(result, null);
  });
});

describe('getProgressSummary', () => {
  it('진행 요약을 반환한다', () => {
    const status = loadStatus();
    status.initFeature('요약테스트');
    status.updatePhase('요약테스트', 'plan', 'completed');
    status.updatePhase('요약테스트', 'design', 'in-progress');

    const summary = status.getProgressSummary('요약테스트');
    assert.ok(summary);
    assert.equal(summary.feature, '요약테스트');
    assert.equal(summary.currentPhase, 'design');
    assert.ok(summary.progressCompact.includes('✅'));
    assert.ok(summary.progressCompact.includes('🔄'));
  });

  it('존재하지 않는 피처는 null 반환', () => {
    const status = loadStatus();
    assert.equal(status.getProgressSummary('없는피처'), null);
  });
});

describe('getActiveFeature', () => {
  it('활성 피처를 반환한다', () => {
    const status = loadStatus();
    status.initFeature('활성피처');
    assert.equal(status.getActiveFeature(), '활성피처');
  });

  it('초기 상태에서 null 반환', () => {
    const status = loadStatus();
    assert.equal(status.getActiveFeature(), null);
  });
});

describe('validateFeatureName', () => {
  it('유효한 영문 피처명을 허용한다', () => {
    const status = loadStatus();
    assert.ok(status.validateFeatureName('user-auth'));
  });

  it('유효한 한글 피처명을 허용한다', () => {
    const status = loadStatus();
    assert.ok(status.validateFeatureName('로그인기능'));
  });

  it('언더스코어를 허용한다', () => {
    const status = loadStatus();
    assert.ok(status.validateFeatureName('my_feature'));
  });

  it('경로 탐색 문자를 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName('../evil'));
  });

  it('공백을 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName('my feature'));
  });

  it('슬래시를 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName('path/traversal'));
  });

  it('빈 문자열을 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName(''));
  });

  it('null을 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName(null));
  });

  it('특수문자를 거부한다', () => {
    const status = loadStatus();
    assert.ok(!status.validateFeatureName('feat;rm -rf'));
  });
});
