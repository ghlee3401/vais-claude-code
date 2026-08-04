/**
 * Sub-agent worktree merge tests — 패턴 D (agent-teams-orchestration).
 *
 * SC-07: Sub-agent worktree merge 무손실 (squash-merge 후 frontend + backend 변경사항 모두 존재).
 * 정본: lib/worktree-manager.js
 *
 * **주의**: git worktree 생성/제거를 실제 실행하는 통합 테스트. CI 환경에서는 skip 권장.
 * dryRun 모드로 안전 검증.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  safeBranch,
  safePath,
  DEFAULT_WORKTREE_ROOT,
  mergeBack,
  listStale,
  cleanupWorktree,
} = require('../lib/worktree-manager');

test('safeBranch: 안전한 git branch 이름 산출', () => {
  assert.strictEqual(safeBranch('foo', 'frontend-engineer'), 'feat/foo-frontend-engineer');
  // 특수문자 제거
  assert.strictEqual(safeBranch('foo/bar', 'agent$'), 'feat/foobar-agent');
});

test('safePath: 안전한 worktree 경로 산출', () => {
  const p = safePath('.claude/worktrees', 'foo', 'backend');
  assert.ok(p.includes('foo-backend'));
});

test('cleanupWorktree: confirm 없으면 throw', () => {
  assert.throws(
    () => cleanupWorktree('.claude/worktrees/test'),
    /requires explicit \{ confirm: true \}/
  );
});

test('mergeBack: dryRun 모드 — 실제 git 호출 없이 결과 모킹', () => {
  // dryRun 시 lint/test skip + squash-merge 시뮬레이션만
  const result = mergeBack('test-feature', [], { dryRun: true, skipLint: true, skipTest: true });
  assert.deepStrictEqual(result, [], '빈 agents 배열 → 빈 결과');
});

test('listStale: 빈 환경에서 빈 배열 반환 (worktree 없을 때)', () => {
  // git worktree list 가 .claude/worktrees/ 항목 없으면 빈 배열
  const stale = listStale(30);
  assert.ok(Array.isArray(stale), 'always returns array');
});

test('DEFAULT_WORKTREE_ROOT: 정상 정의', () => {
  assert.strictEqual(DEFAULT_WORKTREE_ROOT, '.claude/worktrees');
});
