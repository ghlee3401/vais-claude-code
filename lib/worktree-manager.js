'use strict';

/**
 * Worktree Manager — 패턴 D (sub-agent background sessions + worktree 격리).
 *
 * v1 design `architecture.md` §7 재활용. createWorktree / mergeBack / listStale.
 * 자동 cleanup 금지 (memory feedback_no_auto_git_restore 정합) — listStale 식별만.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_WORKTREE_ROOT = '.claude/worktrees';

function safeBranch(feature, agent) {
  // git branch 안전한 이름 — slash 허용, 공백/특수문자 차단
  const f = String(feature).replace(/[^a-zA-Z0-9가-힣_-]/g, '');
  const a = String(agent).replace(/[^a-zA-Z0-9_-]/g, '');
  return `feat/${f}-${a}`;
}

function safePath(worktreeRoot, feature, agent) {
  const f = String(feature).replace(/[^a-zA-Z0-9가-힣_-]/g, '');
  const a = String(agent).replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(worktreeRoot, `${f}-${a}`);
}

/**
 * worktree 생성. 이미 있으면 throw.
 */
function createWorktree(feature, agent, options = {}) {
  const root = options.worktreeRoot || DEFAULT_WORKTREE_ROOT;
  const branch = safeBranch(feature, agent);
  const wtPath = safePath(root, feature, agent);

  if (fs.existsSync(wtPath)) {
    throw new Error(`Worktree already exists at ${wtPath} — release or cleanup first`);
  }
  fs.mkdirSync(root, { recursive: true });

  // git worktree add -b <branch> <path>
  try {
    execSync(`git worktree add -b ${branch} ${wtPath}`, { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`git worktree add failed: ${e.message}`);
  }
  return {
    path: wtPath,
    branch,
    feature,
    agent,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 모든 sub-agent worktree 를 squash-merge 후 feature branch 로 통합.
 *
 * **사전 조건**: 호출자가 AskUserQuestion 으로 diff 승인 받은 상태여야 함.
 * **게이트**: lint + test 실패 시 throw (T6 mitigation).
 *
 * @param {string} feature
 * @param {string[]} agents
 * @param {object} options - { skipLint, skipTest, dryRun }
 */
function mergeBack(feature, agents, options = {}) {
  const results = [];
  for (const agent of agents) {
    const branch = safeBranch(feature, agent);

    // 1. lint + test 게이트 (T6 mitigation, SC-08)
    if (!options.skipLint) {
      try {
        execSync(`npm run lint --silent`, { stdio: 'pipe' });
      } catch (e) {
        throw new Error(`merge 차단: ${agent} lint 실패 — ${e.message.slice(0, 200)}`);
      }
    }
    if (!options.skipTest) {
      try {
        execSync(`npm test --silent`, { stdio: 'pipe', timeout: 120000 });
      } catch (e) {
        throw new Error(`merge 차단: ${agent} test 실패 — ${e.message.slice(0, 200)}`);
      }
    }

    if (options.dryRun) {
      results.push({ agent, branch, action: 'dry-run', status: 'would-merge' });
      continue;
    }

    // 2. squash-merge
    try {
      execSync(`git merge --squash ${branch}`, { stdio: 'pipe' });
      execSync(
        `git commit -m "feat(${feature}): merge ${agent} sub-agent (squash)"`,
        { stdio: 'pipe' }
      );
      results.push({ agent, branch, action: 'squash-merge', status: 'merged' });
    } catch (e) {
      throw new Error(`squash-merge 실패 (${agent}): ${e.message}`);
    }
  }
  return results;
}

/**
 * stale worktree 식별 (자동 cleanup 안 함 — memory feedback_no_auto_git_restore).
 * @returns {Array<{ path, branch, acquiredAt, staleMinutes }>}
 */
function listStale(staleMinutes = 30) {
  let listOut = '';
  try {
    listOut = execSync('git worktree list --porcelain', { encoding: 'utf8' });
  } catch (e) {
    return [];
  }
  const worktrees = [];
  let current = null;
  for (const line of listOut.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current) worktrees.push(current);
      current = { path: line.slice('worktree '.length).trim() };
    } else if (line.startsWith('branch ') && current) {
      current.branch = line.slice('branch '.length).trim();
    }
  }
  if (current) worktrees.push(current);

  const cutoff = Date.now() - staleMinutes * 60 * 1000;
  return worktrees
    .filter((w) => w.path.includes('.claude/worktrees/'))
    .map((w) => {
      let mtime = 0;
      try {
        mtime = fs.statSync(w.path).mtimeMs;
      } catch (_) {}
      return {
        ...w,
        mtimeMs: mtime,
        isStale: mtime > 0 && mtime < cutoff,
        staleMinutes: mtime > 0 ? Math.round((Date.now() - mtime) / 60000) : null,
      };
    })
    .filter((w) => w.isStale);
}

/**
 * worktree 명시 cleanup (사용자 명시 호출만).
 */
function cleanupWorktree(wtPath, options = {}) {
  if (!options.confirm) {
    throw new Error('cleanupWorktree requires explicit { confirm: true } — memory feedback_no_auto_git_restore');
  }
  try {
    execSync(`git worktree remove ${wtPath}`, { stdio: 'pipe' });
    return { path: wtPath, status: 'removed' };
  } catch (e) {
    return { path: wtPath, status: 'failed', error: e.message };
  }
}

module.exports = {
  DEFAULT_WORKTREE_ROOT,
  createWorktree,
  mergeBack,
  listStale,
  cleanupWorktree,
  safeBranch,
  safePath,
};
