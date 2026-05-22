'use strict';

/**
 * Sub-agent Dispatcher — 패턴 D 진입점 (agent-teams-orchestration).
 *
 * `agentTeams.subagentSessions=true` 시 CTO 가 호출.
 * 각 sub-agent 에 대해 worktree 생성 + lock 획득 → background session dispatch.
 *
 * dryRun 모드 = lock 획득만 (실제 dispatch X) — 테스트 용.
 */

const path = require('path');
const { createWorktree } = require('../../../lib/worktree-manager');
const status = require('../../../lib/status');
const { loadConfig } = require('../../../lib/paths');

/**
 * 단일 sub-agent dispatch (worktree + lock + session id 박제).
 *
 * @param {string} feature
 * @param {string} agent - 'frontend-engineer' | 'backend-engineer' | 'test-engineer' | ...
 * @param {object} options - { sessionId, dryRun, worktreeRoot }
 * @returns {{ acquired, lock, worktree, sessionId, agent }}
 */
function dispatchSubagent(feature, agent, options = {}) {
  const cfg = loadConfig();
  const agentTeams = cfg?.orchestration?.agentTeams || {};
  const worktreeRoot = options.worktreeRoot || agentTeams.worktreeRoot || '.claude/worktrees';

  // 1. worktree 생성
  let worktree;
  try {
    worktree = createWorktree(feature, agent, { worktreeRoot });
  } catch (e) {
    return { acquired: false, error: `worktree 생성 실패: ${e.message}`, agent };
  }

  // 2. lock 획득
  const sessionId = options.sessionId || `dispatch-${Date.now()}-${agent}`;
  const lockResult = status.acquireSubagentLock(
    feature,
    agent,
    sessionId,
    worktree.branch,
    worktree.path
  );
  if (!lockResult.acquired) {
    return {
      acquired: false,
      error: `lock 충돌: ${agent} 가 이미 ${lockResult.holder?.sessionId} 에 점유 중`,
      worktree,
      holder: lockResult.holder,
      agent,
    };
  }

  return {
    acquired: true,
    agent,
    sessionId,
    worktree,
    lock: lockResult.lock,
    // 실제 `claude --bg` dispatch 는 호출자가 수행. 본 함수는 worktree + lock 박제만.
    dispatchHint: `cd ${worktree.path} && claude --bg "Continue VAIS workflow: /vais cto do ${feature}"`,
  };
}

/**
 * 여러 sub-agent 병렬 dispatch.
 *
 * @param {string} feature
 * @param {string[]} agents
 * @param {object} options - { sessionIdPrefix, dryRun }
 * @returns {Array<dispatchResult>}
 */
function dispatchSubagents(feature, agents, options = {}) {
  const cfg = loadConfig();
  const maxConcurrent = cfg?.orchestration?.agentTeams?.maxConcurrentSubagents || 3;
  if (agents.length > maxConcurrent) {
    return [
      {
        acquired: false,
        error: `agents.length (${agents.length}) > maxConcurrentSubagents (${maxConcurrent})`,
      },
    ];
  }
  const results = [];
  for (const a of agents) {
    results.push(
      dispatchSubagent(feature, a, {
        sessionId: options.sessionIdPrefix
          ? `${options.sessionIdPrefix}-${a}`
          : undefined,
        worktreeRoot: options.worktreeRoot,
      })
    );
  }
  return results;
}

/**
 * 전체 sub-agent 완료 후 release + cleanup (사용자 명시 호출만).
 */
function releaseAll(feature, agents) {
  for (const a of agents) {
    status.releaseSubagentLock(feature, a);
  }
}

module.exports = {
  dispatchSubagent,
  dispatchSubagents,
  releaseAll,
};
