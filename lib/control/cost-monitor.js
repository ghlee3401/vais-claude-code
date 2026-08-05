/**
 * VAIS Code - Advisor Cost Monitor
 * @module lib/control/cost-monitor
 *
 * Advisor 누적 비용 추적 + Degrade Gracefully.
 *
 * @see docs/_legacy/01-plan/features/v050/04-advisor-integration.plan.md §2.3
 */

const fs = require('fs');
const path = require('path');

function getSpendPath() {
  try {
    const { PROJECT_DIR } = require('../paths');
    return path.join(PROJECT_DIR, '.vais', 'advisor-spend.json');
  } catch (_) {
    return path.join(process.cwd(), '.vais', 'advisor-spend.json');
  }
}

function loadSpend() {
  const p = getSpendPath();
  if (!fs.existsSync(p)) {
    return {
      session_id: null,
      session: { cost: 0, calls: 0, by_subagent: {} },
      month: { period: currentPeriod(), cost: 0, calls: 0, reset_date: nextResetDate() },
      degraded: false,
      last_updated: new Date().toISOString(),
    };
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveSpend(data) {
  const p = getSpendPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextResetDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().split('T')[0];
}

function loadAdvisorConfig() {
  try {
    return require('../paths').loadConfig().advisor || {};
  } catch (_) {
    return {};
  }
}

async function checkBudget(sessionId) {
  const spend = loadSpend();
  const cfg = loadAdvisorConfig();
  const sessionCap = cfg.max_calls_per_session || 15;
  const monthlyCap = cfg.monthly_budget_usd || 200;

  if (spend.session_id !== sessionId) {
    spend.session = { cost: 0, calls: 0, by_subagent: {} };
    spend.session_id = sessionId;
    spend.degraded = false;
    saveSpend(spend);
  }

  if (spend.month.period !== currentPeriod()) {
    spend.month = { period: currentPeriod(), cost: 0, calls: 0, reset_date: nextResetDate() };
    spend.degraded = false;
    saveSpend(spend);
  }

  if (spend.session.calls >= sessionCap) {
    return { allowed: false, remaining: 0, reason: 'session_cap' };
  }
  if (spend.month.cost >= monthlyCap) {
    return { allowed: false, remaining: 0, reason: 'monthly_cap' };
  }
  return {
    allowed: true,
    remaining: Math.min(monthlyCap - spend.month.cost, sessionCap - spend.session.calls),
    reason: null,
  };
}

async function recordCall({ sessionId, subAgent, cost, tokens }) {
  const spend = loadSpend();
  if (spend.session_id !== sessionId) {
    spend.session = { cost: 0, calls: 0, by_subagent: {} };
    spend.session_id = sessionId;
  }
  spend.session.cost += cost;
  spend.session.calls += 1;
  spend.session.by_subagent[subAgent] = (spend.session.by_subagent[subAgent] || 0) + 1;
  spend.month.cost += cost;
  spend.month.calls += 1;

  const cfg = loadAdvisorConfig();
  const monthlyCap = cfg.monthly_budget_usd || 200;
  const sessionCap = cfg.max_calls_per_session || 15;
  if (spend.month.cost >= monthlyCap || spend.session.calls >= sessionCap) {
    spend.degraded = true;
  }

  saveSpend(spend);
  return { totalSession: spend.session.cost, totalMonth: spend.month.cost };
}

async function isDegraded() {
  return loadSpend().degraded;
}

async function resetIfNewMonth() {
  const spend = loadSpend();
  if (spend.month.period !== currentPeriod()) {
    spend.month = { period: currentPeriod(), cost: 0, calls: 0, reset_date: nextResetDate() };
    spend.degraded = false;
    saveSpend(spend);
    return true;
  }
  return false;
}

function degradeReason() {
  const spend = loadSpend();
  if (!spend.degraded) return null;
  const cfg = loadAdvisorConfig();
  if (spend.month.cost >= (cfg.monthly_budget_usd || 200)) return 'monthly_cap';
  if (spend.session.calls >= (cfg.max_calls_per_session || 15)) return 'session_cap';
  return null;
}

module.exports = {
  checkBudget,
  recordCall,
  isDegraded,
  resetIfNewMonth,
  degradeReason,
  // test helpers
  _loadSpend: loadSpend,
  _saveSpend: saveSpend,
  _getSpendPath: getSpendPath,
};
