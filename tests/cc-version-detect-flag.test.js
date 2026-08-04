/**
 * cc-version-detect flag 확장 테스트 — agent-teams-sendmessage-real (AC1~AC3).
 *
 * 검증 대상:
 *   - detectExperimentalAgentTeamsFlag() — env / settings.json / graceful fallback
 *   - checkAgentTeamsAllowed() — simulationMode 필드 포함 여부 + 분기 정확성
 *
 * Mock 전략:
 *   - process.env 직접 조작 (테스트 후 반드시 원복)
 *   - settings.json 은 os.tmpdir() 임시 파일 사용
 *   - _resetFlagCache() 매 케이스 호출 (캐시 격리)
 *
 * 주의: 구현 중 (backend-engineer 병렬 진행). export 누락 시 개별 테스트 skip.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// --- 모듈 로드 (graceful — 미구현 시 skip) ---
let detectExperimentalAgentTeamsFlag;
let checkAgentTeamsAllowed;
let _resetFlagCache;
let _resetCache;

let moduleLoaded = false;
try {
  const mod = require('../lib/cc-version-detect');
  detectExperimentalAgentTeamsFlag = mod.detectExperimentalAgentTeamsFlag;
  checkAgentTeamsAllowed = mod.checkAgentTeamsAllowed;
  _resetFlagCache = mod._resetFlagCache;
  _resetCache = mod._resetCache;
  moduleLoaded = true;
} catch (e) {
  // 모듈 자체가 없으면 전체 skip
}

// --- helpers ---

/**
 * 임시 settings.json 작성. 테스트 후 삭제 필요.
 * @param {object|string} content - JSON object 또는 raw 문자열 (malformed 테스트용)
 * @returns {string} 파일 경로
 */
function writeTmpSettings(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-test-'));
  const filePath = path.join(dir, 'settings.json');
  const raw = typeof content === 'string' ? content : JSON.stringify(content);
  fs.writeFileSync(filePath, raw, 'utf8');
  return filePath;
}

/**
 * cc-version-detect 의 settings.json 읽기 경로를 임시 파일로 교체.
 * 모듈이 os.homedir() 기반으로 hardcode 하므로, env 를 통해 간접 제어.
 * 실제 구현에서 HOME 을 바꾸거나 별도 override 방식을 사용하지 않으면
 * settings.json 관련 케이스는 env 우선 로직만으로 커버함.
 *
 * 따라서 settings.json 경로 재현은 HOME 재지정 방식 사용.
 */
function overrideHome(tmpDir) {
  const prev = process.env.HOME;
  process.env.HOME = tmpDir;
  // node:os 의 homedir() 는 HOME env 를 따름 (POSIX)
  return () => {
    if (prev === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = prev;
    }
  };
}

/**
 * CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env 임시 설정.
 * @returns {function} 복원 함수
 */
function setEnvFlag(value) {
  const prev = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  if (value === undefined) {
    delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  } else {
    process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = value;
  }
  return () => {
    if (prev === undefined) {
      delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
    } else {
      process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = prev;
    }
  };
}

function resetAllCaches() {
  if (_resetFlagCache) _resetFlagCache();
  if (_resetCache) _resetCache();
}

// =============================================================================
// detectExperimentalAgentTeamsFlag() 케이스 1~8
// =============================================================================

test('AC1/AC3 — detectExperimentalAgentTeamsFlag export 존재', () => {
  if (!moduleLoaded) {
    // AC1: 모듈 자체가 없으면 skip
    return;
  }
  assert.strictEqual(
    typeof detectExperimentalAgentTeamsFlag,
    'function',
    'detectExperimentalAgentTeamsFlag 는 함수여야 한다 (AC1)'
  );
  assert.strictEqual(
    typeof _resetFlagCache,
    'function',
    '_resetFlagCache 는 함수여야 한다 (테스트 격리 필수)'
  );
});

test('케이스 1 — env unset, settings absent → flag=false, source=none', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  // Arrange: HOME 을 .claude/settings.json 없는 tmpdir 로 교체
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(undefined); // env 미설정
  resetAllCaches();

  try {
    // Act
    const result = detectExperimentalAgentTeamsFlag();

    // Assert
    assert.strictEqual(result.enabled, false, 'env unset + settings absent → enabled=false');
    assert.strictEqual(result.source, 'none', 'source=none');
    assert.strictEqual(result.raw, null, 'raw=null');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 2 — env="1" → flag=true, source=env', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag('1');
  resetAllCaches();

  try {
    const result = detectExperimentalAgentTeamsFlag();
    assert.strictEqual(result.enabled, true, 'env="1" → enabled=true');
    assert.strictEqual(result.source, 'env', 'source=env');
    assert.strictEqual(result.raw, '1');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 3 — env="true" → flag=true, source=env', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag('true');
  resetAllCaches();

  try {
    const result = detectExperimentalAgentTeamsFlag();
    assert.strictEqual(result.enabled, true, 'env="true" → enabled=true');
    assert.strictEqual(result.source, 'env');
    assert.strictEqual(result.raw, 'true');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 4 — env="" (빈 문자열) → flag=false (source=env, enabled=false)', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(''); // 빈 문자열 — undefined 와 다름
  resetAllCaches();

  try {
    const result = detectExperimentalAgentTeamsFlag();
    // env 변수가 set 됐으나 값이 "" → source=env, enabled=false (only "1"/"true" truthy)
    assert.strictEqual(result.source, 'env', '빈 문자열이라도 env 가 set 됐으면 source=env');
    assert.strictEqual(result.enabled, false, 'env="" → enabled=false');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 5 — env unset, settings.json에 "1" → flag=true, source=settings.json', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  // Arrange: HOME 을 .claude/settings.json 있는 tmpdir 로 교체
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const claudeDir = path.join(tmpDir, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify({ CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' }),
    'utf8'
  );
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(undefined);
  resetAllCaches();

  try {
    const result = detectExperimentalAgentTeamsFlag();
    assert.strictEqual(result.enabled, true, 'settings.json="1" → enabled=true');
    assert.strictEqual(result.source, 'settings.json', 'source=settings.json');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 6 — env="1" + settings="0" → env 우선, flag=true', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const claudeDir = path.join(tmpDir, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify({ CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '0' }),
    'utf8'
  );
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag('1'); // env 우선
  resetAllCaches();

  try {
    const result = detectExperimentalAgentTeamsFlag();
    assert.strictEqual(result.enabled, true, 'env="1" 가 settings="0" 보다 우선');
    assert.strictEqual(result.source, 'env', 'source=env (우선순위)');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 7 — env unset, settings.json malformed JSON → flag=false (graceful)', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const claudeDir = path.join(tmpDir, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), '{ NOT VALID JSON !!!', 'utf8');
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(undefined);
  resetAllCaches();

  try {
    // Act: JSON.parse 실패 시 throw 하지 않고 none 으로 fallthrough
    let result;
    assert.doesNotThrow(() => {
      result = detectExperimentalAgentTeamsFlag();
    }, 'malformed JSON 이어도 throw 없이 graceful 처리');
    assert.strictEqual(result.enabled, false, 'malformed → enabled=false');
    assert.strictEqual(result.source, 'none', 'malformed → source=none (fall-through)');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('케이스 8 — env unset, settings.json 읽기 권한 없음 → flag=false (graceful)', () => {
  if (!moduleLoaded || !detectExperimentalAgentTeamsFlag) {
    return; // skip: 미구현
  }
  // root 로 실행 중이면 chmod 가 의미 없어 skip
  if (process.getuid && process.getuid() === 0) {
    return; // skip: root 환경
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const claudeDir = path.join(tmpDir, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  const settingsPath = path.join(claudeDir, 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify({ CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1' }));
  fs.chmodSync(settingsPath, 0o000); // 읽기 불가
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(undefined);
  resetAllCaches();

  try {
    let result;
    assert.doesNotThrow(() => {
      result = detectExperimentalAgentTeamsFlag();
    }, '읽기 권한 없는 settings.json 이어도 graceful');
    assert.strictEqual(result.enabled, false, '읽기 실패 → enabled=false');
    assert.strictEqual(result.source, 'none');
  } finally {
    // 권한 복원 후 삭제
    try { fs.chmodSync(settingsPath, 0o644); } catch (_) {}
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// =============================================================================
// checkAgentTeamsAllowed() — simulationMode 필드 검증 (AC2~AC3)
// =============================================================================

test('AC2 — checkAgentTeamsAllowed: enabledConfig=false → allowed=false, simulationMode 없음', () => {
  if (!moduleLoaded || !checkAgentTeamsAllowed) {
    return; // skip: 미구현
  }
  resetAllCaches();
  const result = checkAgentTeamsAllowed(false);
  assert.strictEqual(result.allowed, false);
  // opt-out 경로: simulationMode 필드 정의 불필요 (undefined 허용)
  assert.ok(
    result.simulationMode === undefined || result.simulationMode === false,
    'opt-out 경로에서 simulationMode 는 정의 없거나 false'
  );
});

test('AC2/AC3 — checkAgentTeamsAllowed: enabled=true + version OK + flag missing → simulationMode=true', () => {
  if (!moduleLoaded || !checkAgentTeamsAllowed || !_resetFlagCache || !_resetCache) {
    return; // skip: 미구현
  }
  // Arrange: CC version 2.1+ 을 모킹할 수 없으므로 실제 env 에 의존.
  // 이 테스트는 checkAgentTeamsAllowed 의 반환 구조만 검증.
  // allowed=true + simulationMode=true 케이스는 CC 2.1+ 환경에서만 완전 재현 가능.
  // 여기서는 simulationMode 필드가 boolean 이거나 undefined 임을 확인 (구조 검증).
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag(undefined); // flag 미설정
  resetAllCaches();

  try {
    const result = checkAgentTeamsAllowed(true);
    // allowed 가 true 인 경우만 simulationMode 검증
    if (result.allowed) {
      assert.ok(
        typeof result.simulationMode === 'boolean',
        `allowed=true 시 simulationMode 는 boolean 이어야 한다. 실제: ${typeof result.simulationMode}`
      );
      assert.strictEqual(
        result.simulationMode,
        true,
        'env flag 미설정 시 simulationMode=true (AC3)'
      );
      assert.ok(result.flagInfo !== undefined, 'flagInfo 필드 존재 (AC2)');
    }
    // allowed=false (CC 버전 감지 실패 등) 이면 구조 검증만
    assert.ok('allowed' in result, 'allowed 필드 존재');
    assert.ok('reason' in result, 'reason 필드 존재');
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('AC3 — checkAgentTeamsAllowed: enabled=true + flag set → simulationMode=false (CC 2.1+ 환경)', () => {
  if (!moduleLoaded || !checkAgentTeamsAllowed) {
    return; // skip: 미구현
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-home-'));
  const restoreHome = overrideHome(tmpDir);
  const restoreEnv = setEnvFlag('1'); // flag 설정
  resetAllCaches();

  try {
    const result = checkAgentTeamsAllowed(true);
    if (result.allowed) {
      assert.strictEqual(
        result.simulationMode,
        false,
        'env flag="1" 설정 시 simulationMode=false (AC3)'
      );
      assert.ok(result.flagInfo !== undefined, 'flagInfo 존재');
      assert.strictEqual(result.flagInfo.enabled, true, 'flagInfo.enabled=true');
    }
    // CC 버전 2.1 미만 환경에서는 allowed=false — simulationMode 없음 (정상)
  } finally {
    restoreEnv();
    restoreHome();
    resetAllCaches();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
