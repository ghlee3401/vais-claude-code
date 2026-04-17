/**
 * VAIS Code - Advisor Tool Wrapper
 * @module lib/advisor/wrapper
 *
 * CC가 frontmatter `advisor:` 필드를 직접 인식하지 못할 때 Anthropic API 경유 fallback.
 * native 모드에서는 이 모듈 미사용.
 *
 * v0.56 sub-plan 06: cost-monitor + observability 연결.
 */

const path = require('path');
const { buildAdvisorPrompt } = require('./prompt-builder');
const costMonitor = require('../control/cost-monitor');
const { EventLogger, EVENT_TYPES } = require('../observability');

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

function resolveLogPath() {
  const cfg = loadConfig();
  const rel = cfg?.observability?.eventLog || '.vais/event-log.jsonl';
  return path.resolve(process.cwd(), rel);
}

function emitEvent(eventType, payload) {
  try {
    new EventLogger(resolveLogPath()).log(eventType, payload);
  } catch (_) {
    // observability 실패가 advisor 호출을 막으면 안 됨
  }
}

/**
 * @param {Object} opts
 * @param {Array} opts.conversation
 * @param {string} opts.subAgent
 * @param {string} opts.cLevel
 * @param {string} opts.trigger - 'early' | 'stuck' | 'final' | 'reconcile'
 * @param {string} opts.sessionId
 * @param {string} [opts.subAgentMarkdown]
 * @param {Object} [opts.triggerContext]
 * @param {string[]} [opts.currentFiles]
 * @returns {Promise<{advice:string|null, tokens:{input:number,output:number,cached:number}, cost:number, degraded:boolean, status:string}>}
 */
async function callAdvisor(opts) {
  const {
    conversation, subAgent, cLevel, trigger, sessionId,
    subAgentMarkdown, triggerContext, currentFiles,
  } = opts;

  const nowIso = () => new Date().toISOString();

  const nullResult = (status, degraded = false) => ({
    advice: null,
    tokens: { input: 0, output: 0, cached: 0 },
    cost: 0,
    degraded,
    status,
  });

  // 1) Budget check via cost-monitor
  let budget;
  try {
    budget = await costMonitor.checkBudget(sessionId);
  } catch (_) {
    budget = { allowed: true, remaining: 0, reason: null };
  }

  if (!budget.allowed) {
    const cfg = loadConfig();
    const monthlyCap = cfg?.advisor?.monthly_budget_usd || 200;
    const spend = costMonitor._loadSpend ? costMonitor._loadSpend() : { session: { cost: 0 }, month: { cost: 0 } };
    emitEvent(EVENT_TYPES.ADVISOR_BUDGET_BLOCK, {
      timestamp: nowIso(),
      session_id: sessionId,
      sub_agent: subAgent,
      total_spent: spend.month?.cost || 0,
      cap: monthlyCap,
      remaining: 0,
    });
    return nullResult('budget_block', true);
  }

  const SDK = getSDK();
  if (!SDK) {
    emitEvent(EVENT_TYPES.ADVISOR_CALL, {
      timestamp: nowIso(),
      session_id: sessionId,
      sub_agent: subAgent,
      c_level: cLevel,
      trigger,
      tokens_in: 0, tokens_out: 0, cached_tokens: 0,
      cost: 0,
      status: 'unavailable',
    });
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

    // 2) Record + emit
    try {
      await costMonitor.recordCall({ sessionId, subAgent, cost, tokens });
    } catch (_) { /* ignore */ }

    emitEvent(EVENT_TYPES.ADVISOR_CALL, {
      timestamp: nowIso(),
      session_id: sessionId,
      sub_agent: subAgent,
      c_level: cLevel,
      trigger,
      tokens_in: tokens.input,
      tokens_out: tokens.output,
      cached_tokens: tokens.cached,
      cost,
      status: 'ok',
    });

    return { advice, tokens, cost, degraded: false, status: 'ok' };
  } catch (err) {
    let status = 'unavailable';
    if (err.status === 401) status = 'unavailable';
    else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) status = 'timeout';

    emitEvent(EVENT_TYPES.ADVISOR_CALL, {
      timestamp: nowIso(),
      session_id: sessionId,
      sub_agent: subAgent,
      c_level: cLevel,
      trigger,
      tokens_in: 0, tokens_out: 0, cached_tokens: 0,
      cost: 0,
      status,
    });

    return nullResult(status);
  }
}

module.exports = { callAdvisor };
