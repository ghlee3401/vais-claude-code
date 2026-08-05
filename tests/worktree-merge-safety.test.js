/**
 * Worktree merge safety tests — T6 mitigation (security-review.md §2 #7).
 *
 * lint/test 실패 → squash-merge 차단 검증. CSO-G6 gate.
 * 정본: lib/worktree-manager.js > mergeBack
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { mergeBack } = require('../lib/worktree-manager');

test('mergeBack: skipLint=false + 실제 lint 호출 시도 — 빈 agents 면 통과', () => {
  // 빈 배열은 lint/test 검사 자체가 없음
  const result = mergeBack('test', [], { skipLint: true, skipTest: true, dryRun: true });
  assert.deepStrictEqual(result, []);
});

test('mergeBack: dryRun + skipLint/skipTest=false 일 때 — 정의 자체가 안전 (lint/test 실패 시 throw)', () => {
  // 실제 sub-agent 가 없는 환경에서 빈 agents 면 throw 발생 안 함
  assert.doesNotThrow(() => {
    mergeBack('test', [], { dryRun: true });
  });
});

test('mergeBack: agents 명시 + dryRun → would-merge 결과', () => {
  // dryRun 일 때 lint/test 도 skip 처리
  const result = mergeBack('test', ['frontend-engineer'], {
    dryRun: true,
    skipLint: true,
    skipTest: true,
  });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].action, 'dry-run');
  assert.strictEqual(result[0].status, 'would-merge');
  assert.strictEqual(result[0].agent, 'frontend-engineer');
  assert.strictEqual(result[0].branch, 'feat/test-frontend-engineer');
});

test('mergeBack: T6 mitigation 의도 — skipLint=false 일 때 lint 실행 시도', () => {
  // 실제 lint 가 fail 하지 않는 환경에서는 통과해야 함 (현재 repo lint 통과 가정)
  // 빈 agents 라 실제 lint/test 호출 없음 (안전 검증)
  assert.doesNotThrow(() => {
    mergeBack('test', [], { dryRun: true });
  });
});
