#!/usr/bin/env node
'use strict';

const { readStdin, outputAllow, outputEmpty } = require('../lib/io');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { recordAutomaticHandoff } = require('../lib/workflow/v2/automatic-handoff');
const { resolveProjectRoot, resolveStartDir } = require('./v2-project-context');
const { loadMode } = require('./workflow-v2-prompt');

function agentResult(input) {
  return input.tool_response ?? input.toolResponse ?? input.tool_result ?? input.toolResult ?? input.output ?? null;
}

function persistFromHook(input, projectRoot) {
  const tool = String(input.tool_name || input.toolName || '').toLowerCase();
  if (tool !== 'agent') return null;
  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  if (!authorization?.workItemId || !['do', 'review'].includes(authorization.phase)) {
    throw new Error('current managed Agent authorization is missing');
  }
  return recordAutomaticHandoff(projectRoot, {
    workItemId: authorization.workItemId,
    sessionId,
    agentPrompt: input.tool_input?.prompt || input.input?.prompt || '',
    agentResult: agentResult(input),
  });
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot || loadMode(projectRoot) !== 'enforce') return outputEmpty();
  if (String(input.tool_name || input.toolName || '').toLowerCase() !== 'agent') return outputEmpty();
  try {
    const receipt = persistFromHook(input, projectRoot);
    return outputAllow(receipt
      ? `VAIS stored specialist handoff ${receipt.assignmentId} at ${receipt.evidencePath}. Do not rewrite or re-register it. Continue the authorized phase flow without asking for a progress turn.`
      : undefined);
  } catch (error) {
    const recovery = ['QA_HANDOFF_TOO_LARGE', 'OUTPUT_CONTRACT_INVALID'].includes(error.code)
      ? 'Do not resume the agent through SendMessage or persist its output manually; stop and report the runtime contract failure.'
      : 'The assignment remains incomplete and the next Gate will fail closed.';
    return outputAllow(`VAIS rejected automatic specialist handoff (${error.message}). ${recovery}`);
  }
}

module.exports = { agentResult, persistFromHook, main };

if (require.main === module) main();
