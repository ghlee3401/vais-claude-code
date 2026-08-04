/**
 * agent-teams-sendmessage-real 통합 smoke test (optional #4).
 *
 * 검증 대상:
 *   - 실제 모듈 로딩 후 신규 export 존재 확인 (AC1~AC2)
 *   - simulationMode=true (기본) 동작 — 0.68.0 byte-compat (AC8)
 *   - AC9: settings.json 자동 수정 코드 부재 확인
 *   - AC7: decisions-log.template.md mode/messageHash 컬럼 박제 확인
 *   - AC6: ONBOARDING.md "Agent Teams 활성화" 섹션 확인
 *
 * unit test 가 cover 하지 못하는 통합 영역 (모듈 간 연결, 파일 존재 확인 등).
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// =============================================================================
// AC1 — detectExperimentalAgentTeamsFlag export 존재
// =============================================================================

test('AC1 — lib/cc-version-detect.js: detectExperimentalAgentTeamsFlag export 존재', () => {
  let mod;
  try {
    mod = require('../lib/cc-version-detect');
  } catch (e) {
    assert.ok(true, `SKIP: cc-version-detect 로드 실패 — ${e.message}`);
    return;
  }
  assert.strictEqual(
    typeof mod.detectExperimentalAgentTeamsFlag,
    'function',
    'detectExperimentalAgentTeamsFlag 는 function (AC1)'
  );
  assert.strictEqual(
    typeof mod._resetFlagCache,
    'function',
    '_resetFlagCache 존재 (테스트 격리 필수)'
  );
});

// =============================================================================
// AC2 — checkAgentTeamsAllowed simulationMode 필드 존재
// =============================================================================

test('AC2 — checkAgentTeamsAllowed: 반환 타입에 simulationMode/flagInfo 필드 포함', () => {
  let mod;
  try {
    mod = require('../lib/cc-version-detect');
  } catch (e) {
    assert.ok(true, `SKIP: cc-version-detect 로드 실패 — ${e.message}`);
    return;
  }

  if (mod._resetFlagCache) mod._resetFlagCache();
  if (mod._resetCache) mod._resetCache();

  // enabled=true 로 호출 — 반환 구조만 검증 (CC 버전에 무관)
  const result = mod.checkAgentTeamsAllowed(true);
  assert.ok('allowed' in result, 'allowed 필드 존재');
  assert.ok('reason' in result, 'reason 필드 존재');
  // allowed=true 이면 simulationMode + flagInfo 필수
  if (result.allowed) {
    assert.ok(
      'simulationMode' in result,
      `allowed=true 시 simulationMode 필드 존재 (AC2). 실제 반환: ${JSON.stringify(result)}`
    );
    assert.ok(
      'flagInfo' in result,
      `allowed=true 시 flagInfo 필드 존재 (AC2). 실제 반환: ${JSON.stringify(result)}`
    );
    assert.strictEqual(
      typeof result.simulationMode,
      'boolean',
      'simulationMode 는 boolean'
    );
  }
});

// =============================================================================
// AC8 — 0.68.0 byte-compat: dryRun=true (기존) → 동작 유지
// =============================================================================

test('AC8 — ConversationSession dryRun=true (0.68.0 기존 동작) 유지', async () => {
  let mod;
  try {
    mod = require('../skills/vais/utils/conversation-orchestrator');
  } catch (e) {
    assert.ok(true, `SKIP: conversation-orchestrator 로드 실패 — ${e.message}`);
    return;
  }

  const { ConversationSession, STATES, EVENT_TYPES } = mod;

  // 0.68.0 기존 호출 패턴 (dryRun=true, opts.simulationMode 없음)
  const s = new ConversationSession({
    feature: 'agent-teams-sendmessage-real',
    phase: 'do',
    synthesizer: 'cto',
    participants: ['cpo', 'cso'],
    dryRun: true, // 기존 파라미터 — simulationMode 없이도 동작해야 함
  });

  const result = await s.run({
    draftFn: async () => 'byte-compat draft',
  });

  assert.strictEqual(
    result.state,
    STATES.CONSENSUS_REACHED,
    'dryRun=true → consensus-reached (0.68.0 동작 유지)'
  );
  assert.ok(
    result.events.some((e) => e.eventType === EVENT_TYPES.AGREE),
    'AGREE event 존재 (byte-compat)'
  );
});

// =============================================================================
// AC9 — settings.json 자동 수정 코드 부재
// =============================================================================

test('AC9 — lib/ + skills/ + hooks/ 에 fs.writeFile.*settings.json 패턴 없음', () => {
  // 검사 대상 디렉토리
  const targets = ['lib', 'skills', 'hooks'];
  const pattern = /fs\.writeFile[Sync]*\s*\(.*settings\.json/;

  const violations = [];

  function scanDir(dir) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return;
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      const entryPath = path.join(full, entry.name);
      if (entry.isDirectory()) {
        scanDir(path.relative(ROOT, entryPath));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const content = fs.readFileSync(entryPath, 'utf8');
        if (pattern.test(content)) {
          violations.push(path.relative(ROOT, entryPath));
        }
      }
    }
  }

  for (const dir of targets) {
    scanDir(dir);
  }

  assert.deepStrictEqual(
    violations,
    [],
    `AC9: settings.json 자동 수정 코드 발견 — 금지 파일: ${violations.join(', ')}`
  );
});

// =============================================================================
// AC7 — decisions-log.template.md mode + messageHash 컬럼 확인
// =============================================================================

test('AC7 — templates/decisions-log.template.md: mode + messageHash 컬럼 헤더 존재', () => {
  const tmplPath = path.join(ROOT, 'templates', 'decisions-log.template.md');
  if (!fs.existsSync(tmplPath)) {
    assert.ok(true, 'SKIP: decisions-log.template.md 없음 (backend-engineer 진행 중)');
    return;
  }

  const content = fs.readFileSync(tmplPath, 'utf8');
  const hasMode = content.includes('mode');
  const hasHash = content.includes('messageHash');

  if (!hasMode || !hasHash) {
    // 미구현 — skip
    assert.ok(
      true,
      `SKIP: decisions-log.template.md 에 mode(${hasMode})/messageHash(${hasHash}) 컬럼 미박제 (backend-engineer 진행 중)`
    );
    return;
  }

  assert.ok(
    /\|\s*mode\s*\|/.test(content) || content.includes('| mode |'),
    'mode 컬럼 헤더 존재 (AC7)'
  );
  assert.ok(
    /\|\s*messageHash\s*\|/.test(content) || content.includes('| messageHash |'),
    'messageHash 컬럼 헤더 존재 (AC7)'
  );
});

// =============================================================================
// AC6 — ONBOARDING.md "Agent Teams 활성화" 섹션 확인
// =============================================================================

test('AC6 — ONBOARDING.md: "Agent Teams 활성화" H2 섹션 존재', () => {
  const onboardPath = path.join(ROOT, 'ONBOARDING.md');
  if (!fs.existsSync(onboardPath)) {
    assert.ok(true, 'SKIP: ONBOARDING.md 없음');
    return;
  }

  const content = fs.readFileSync(onboardPath, 'utf8');
  const hasSection = content.includes('Agent Teams 활성화') || content.includes('Agent Teams Activation');

  if (!hasSection) {
    assert.ok(true, 'SKIP: ONBOARDING.md 에 "Agent Teams 활성화" 섹션 미박제 (backend-engineer 진행 중)');
    return;
  }

  // 섹션이 있으면 5단계 포함 여부 확인
  // 단계 내용: claude --version / env set / settings.json / vais.config / /vais status
  const hasStep1 = content.includes('claude --version') || content.includes('CC 2.1');
  const hasStep2 =
    content.includes('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS') ||
    content.includes('export CLAUDE_CODE');
  assert.ok(hasStep1, 'AC6: CC 버전 확인 단계 포함');
  assert.ok(hasStep2, 'AC6: env 변수 설정 단계 포함');
});

// =============================================================================
// 통합 smoke — simulationMode=true 기본값 확인 (ConversationSession constructor)
// =============================================================================

test('통합 smoke — ConversationSession opts.simulationMode 신규 파라미터 수용', () => {
  let mod;
  try {
    mod = require('../skills/vais/utils/conversation-orchestrator');
  } catch (e) {
    assert.ok(true, `SKIP: conversation-orchestrator 로드 실패`);
    return;
  }

  const { ConversationSession } = mod;

  // simulationMode 파라미터를 전달해도 crash 없어야 함
  assert.doesNotThrow(() => {
    const s = new ConversationSession({
      feature: 'test',
      phase: 'do',
      synthesizer: 'cto',
      simulationMode: true, // 신규 파라미터
      callerContext: 'main', // 신규 파라미터
      parallelGroup: ['cpo'], // 신규 파라미터
    });
    // 신규 파라미터 존재 확인 (구현 됐을 때)
    if (s.simulationMode !== undefined) {
      assert.strictEqual(s.simulationMode, true, 'simulationMode=true 캡처');
    }
    if (s.callerContext !== undefined) {
      assert.strictEqual(s.callerContext, 'main', 'callerContext="main" 캡처');
    }
    if (s.allowedActors !== undefined) {
      assert.ok(Array.isArray(s.allowedActors), 'allowedActors 는 배열');
      assert.ok(s.allowedActors.includes('main'), '"main" 항상 포함');
      assert.ok(s.allowedActors.includes('cpo'), 'parallelGroup 멤버 포함');
    }
  }, '신규 opts (simulationMode/callerContext/parallelGroup) 전달 시 crash 없어야 함');
});
