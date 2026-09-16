#!/usr/bin/env node
'use strict';

const { readStdin, parseHookInput, outputBlock, outputEmpty, outputPreToolAllow } = require('../lib/io');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { WorkItemStore } = require('../lib/workflow/v2/work-item-store');
const { authorizeFilePath, authorizeCommand, defaultAllowedPaths } = require('../lib/workflow/v2/write-policy');
const { SLOT_HOLDING_STATUSES } = require('../lib/workflow/v2/state-machine');
const { resolveProjectRoot, resolveStartDir, resolveMode, warningLine } = require('./v2-project-context');
const { authorizeAgentInput } = require('../lib/workflow/v2/agent-policy');
const { INTERNAL_COMMAND } = require('../scripts/vais-workflow-v2');

function decide(input, projectRoot, authorization) {
  const tool = String(input.tool_name || input.toolName || '').toLowerCase();
  const parsed = parseHookInput(input);
  if (tool === 'write' || tool === 'edit' || tool === 'notebookedit') {
    return authorizeFilePath(projectRoot, parsed.filePath, authorization);
  }
  // The guard's own install path is the trusted runtime CLI; it lets the unauthenticated
  // read-only `doctor` subcommand run even when no session authorization exists.
  if (tool === 'bash') return authorizeCommand(parsed.command, authorization, { trustedRuntimePrefixes: [INTERNAL_COMMAND] });
  if (tool === 'agent') return authorizeAgentInput(parsed.raw, authorization, projectRoot);
  return { allowed: true, kind: 'unmanaged-tool' };
}

function sameSet(left, right) {
  return [...new Set(left || [])].sort().join('\n') === [...new Set(right || [])].sort().join('\n');
}

function validateCurrentAuthorization(store, authorization) {
  if (!authorization?.workItemId) return { valid: true, item: null };
  const item = store.get(authorization.workItemId);
  const current = store.getCurrent();
  if (!item || !current || current.id !== item.id) return { valid: false, reason: 'authorization Work item is not current' };
  if (!SLOT_HOLDING_STATUSES.has(item.status) || item.status !== 'active') {
    return { valid: false, reason: `Work item is not mutation-active: ${item.phase}/${item.status}` };
  }
  if (authorization.phase !== item.phase) return { valid: false, reason: 'authorization phase is stale' };
  if (!sameSet(authorization.allowedPaths, defaultAllowedPaths(item))) {
    return { valid: false, reason: 'authorization write scope is stale' };
  }
  return { valid: true, item };
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot) return outputEmpty();
  // Fail-closed: an invalid mode value keeps the guard active (resolveMode returns enforce + warning).
  const resolved = resolveMode(projectRoot);
  if (resolved.mode !== 'enforce') return outputEmpty();
  const warning = warningLine(resolved);
  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const authorizationStore = new AuthorizationStore(projectRoot);
  const authorization = authorizationStore.get(sessionId);
  const parsed = parseHookInput(input);
  const result = decide(input, projectRoot, authorization);
  if (!result.allowed) return outputBlock(`VAIS v2 write guard: ${result.reason}${warning ? ` (${warning})` : ''}`);
  if (authorization?.workItemId && !['read-only', 'unmanaged-tool', 'scratch-write'].includes(result.kind)) {
    const store = new WorkItemStore(projectRoot);
    const current = validateCurrentAuthorization(store, authorization);
    if (!current.valid) {
      authorizationStore.revoke(sessionId);
      return outputBlock(`VAIS v2 write guard: ${current.reason}`);
    }
    try {
      store.acquireLease(authorization.workItemId, sessionId);
      if (result.kind === 'v2-specialist') {
        store.recordAssignmentUse(authorization.workItemId, result.wrapper.assignmentReceipt.id, sessionId);
      }
      authorizationStore.touch(sessionId);
    } catch (error) {
      return outputBlock(`VAIS v2 write guard: active mutation lease is required (${error.message})`);
    }
  }
  if (result.updatedInput) return outputPreToolAllow(result.updatedInput);
  return outputEmpty();
}

module.exports = { decide, sameSet, validateCurrentAuthorization, main };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    outputBlock(`VAIS v2 write guard failed closed: ${error.message}`);
  }
}
