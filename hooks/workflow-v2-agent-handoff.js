#!/usr/bin/env node
'use strict';

const path = require('path');
const { readStdin, outputAllow, outputEmpty } = require('../lib/io');
const { AuthorizationStore } = require('../lib/workflow/v2/authorization-store');
const { recordAutomaticHandoff, isDeferredAgentResult } = require('../lib/workflow/v2/automatic-handoff');
const { extractAssignmentId } = require('../lib/workflow/v2/agent-policy');
const { PHASE_FOLDERS } = require('../lib/workflow/v2/document-manager');
const { resolveProjectRoot, resolveStartDir, resolveMode } = require('./v2-project-context');
const { INTERNAL_COMMAND } = require('../scripts/vais-workflow-v2');

function agentResult(input) {
  return input.tool_response ?? input.toolResponse ?? input.tool_result ?? input.toolResult ?? input.output ?? null;
}

function agentPrompt(input) {
  return input.tool_input?.prompt || input.input?.prompt || '';
}

function deferredGuidance(projectRoot, authorization, sessionId, assignmentId) {
  const workItemId = authorization?.workItemId || '<work-item-id>';
  const phase = authorization?.phase || 'review';
  const folder = PHASE_FOLDERS[phase] || '<phase-folder>';
  const handoffFile = path.posix.join('docs/work-items/<feature>/<work-item-folder>', folder, 'handoff.json');
  return [
    `VAIS: the Agent tool returned a deferred launch receipt without a specialist-handoff/v1 object; assignment ${assignmentId || '<assignment-id>'} stays open.`,
    'When the task notification delivers the raw handoff JSON, save it unchanged to',
    `\`${handoffFile}\` and run \`${INTERNAL_COMMAND} handoff --id ${workItemId} --session ${sessionId || '<session>'} --assignment ${assignmentId || '<assignment-id>'} --handoff-file <that path>\` once, then continue the current phase transaction.`,
    'Do not resume the agent through SendMessage and do not rewrite the handoff by hand.',
  ].join(' ');
}

function persistFromHook(input, projectRoot) {
  const tool = String(input.tool_name || input.toolName || '').toLowerCase();
  if (tool !== 'agent') return null;
  const sessionId = String(input.session_id || input.sessionId || '').trim();
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  const result = agentResult(input);
  const prompt = agentPrompt(input);
  if (isDeferredAgentResult(result)) {
    return {
      deferred: true,
      assignmentId: extractAssignmentId(prompt),
      guidance: deferredGuidance(projectRoot, authorization, sessionId, extractAssignmentId(prompt)),
    };
  }
  if (!authorization?.workItemId || !['do', 'review'].includes(authorization.phase)) {
    throw new Error('current managed Agent authorization is missing');
  }
  return recordAutomaticHandoff(projectRoot, {
    workItemId: authorization.workItemId,
    sessionId,
    agentPrompt: prompt,
    agentResult: result,
  });
}

function main() {
  const input = readStdin();
  const projectRoot = resolveProjectRoot(resolveStartDir(input));
  if (!projectRoot || resolveMode(projectRoot).mode !== 'enforce') return outputEmpty();
  if (String(input.tool_name || input.toolName || '').toLowerCase() !== 'agent') return outputEmpty();
  try {
    const receipt = persistFromHook(input, projectRoot);
    if (receipt?.deferred) return outputAllow(receipt.guidance);
    return outputAllow(receipt
      ? `VAIS stored specialist handoff ${receipt.assignmentId} at ${receipt.evidencePath}. Do not rewrite or re-register it. Continue the authorized phase flow without asking for a progress turn.`
      : undefined);
  } catch (error) {
    const recovery = ['QA_HANDOFF_TOO_LARGE', 'OUTPUT_CONTRACT_INVALID'].includes(error.code)
      ? 'Do not resume the agent through SendMessage or persist its output manually; stop and report the runtime contract failure.'
      : `The assignment remains open. If the specialist result is available, save the raw handoff JSON inside the current phase folder and register it once with \`${INTERNAL_COMMAND} handoff ...\`; otherwise the next Gate will fail closed.`;
    return outputAllow(`VAIS rejected automatic specialist handoff (${error.message}). ${recovery}`);
  }
}

module.exports = { agentResult, agentPrompt, deferredGuidance, persistFromHook, main };

if (require.main === module) main();
