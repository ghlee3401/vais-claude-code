/**
 * VAIS Code - Advisor Tool Wrapper
 * @module lib/advisor/wrapper
 *
 * CC가 frontmatter `advisor:` 필드를 직접 인식하지 못할 때 Anthropic API 경유 fallback.
 * native 모드에서는 이 모듈 미사용.
 *
 * @see docs/01-plan/features/v050/04-advisor-integration.plan.md §2.1
 */

const fs = require('fs');
const path = require('path');
const { buildAdvisorPrompt } = require('./prompt-builder');

let _sdk = null;
function getSDK() {
  if (_sdk !== null) return _sdk;
  try {
    _sdk = require('@anthropic-ai/sdk');
  } catch (_) {
    _sdk = false;
  }
  return _sdk;
}

function loadConfig() {
  try {
    return require('../../lib/paths').loadConfig();
  } catch (_) {
    return {};
  }
}

/**
 * @param {Object} opts
 * @param {Array} opts.conversation
 * @param {string} opts.subAgent
 * @param {string} opts.cLevel
 * @param {string} opts.trigger - 'early' | 'stuck' | 'final' | 'reconcile'
 * @param {string} opts.sessionId
 * @param {number} opts.budgetRemaining
 * @param {string} [opts.subAgentMarkdown]
 * @param {Object} [opts.triggerContext]
 * @param {string[]} [opts.currentFiles]
 * @returns {Promise<{advice:string|null, tokens:{input:number,output:number,cached:number}, cost:number, degraded:boolean, status:string}>}
 */
async function callAdvisor(opts) {
  const {
    conversation, subAgent, cLevel, trigger, sessionId,
    budgetRemaining, subAgentMarkdown, triggerContext, currentFiles,
  } = opts;

  const nullResult = (status, degraded = false) => ({
    advice: null,
    tokens: { input: 0, output: 0, cached: 0 },
    cost: 0,
    degraded,
    status,
  });

  if (budgetRemaining != null && budgetRemaining <= 0) {
    return nullResult('budget_block', true);
  }

  const SDK = getSDK();
  if (!SDK) {
    return nullResult('unavailable');
  }

  const config = loadConfig();
  const advisorCfg = config.advisor || {};
  const model = advisorCfg.advisor?.model || advisorCfg.model || 'claude-opus-4-6';
  const betaHeader = advisorCfg.beta_header || 'advisor-tool-2026-03-01';
  const maxTokens = 2048;

  const { systemPrompt, userPrompt } = buildAdvisorPrompt({
    subAgentMarkdown: subAgentMarkdown || '',
    conversation: conversation || [],
    trigger,
    currentFiles,
    triggerContext,
  });

  try {
    const client = new SDK.default({ defaultHeaders: { 'anthropic-beta': betaHeader } });
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const usage = response.usage || {};
    const tokens = {
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
      cached: usage.cache_read_input_tokens || 0,
    };

    const pricing = advisorCfg.pricing || { input: 15, output: 75, cache_read: 1.5 };
    const cost = (tokens.input * pricing.input + tokens.output * pricing.output + tokens.cached * pricing.cache_read) / 1_000_000;

    const advice = response.content?.map(b => b.text).join('') || null;

    return { advice, tokens, cost, degraded: false, status: 'ok' };
  } catch (err) {
    if (err.status === 401) return nullResult('unavailable');
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) return nullResult('timeout');
    return nullResult('unavailable');
  }
}

module.exports = { callAdvisor };
