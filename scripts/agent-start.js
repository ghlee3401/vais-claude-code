#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] agent-start crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] agent-start rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
// Design Ref: §2.2 — SubagentStart 훅에서 호출되는 얇은 CLI 래퍼. 로직은 lib/observability/에 위임
// 사용: node scripts/agent-start.js <role> <phase> [task]

const fs = require('fs');
const path = require('path');
const { StateWriter, EventLogger, EVENT_TYPES } = require('../lib/observability/index');
const { logHook } = require('../lib/hook-logger');

// A01/A08: CLI 인자 화이트리스트 — vais.config.json의 cSuite.roles + 실행 에이전트 목록 기준
const VALID_ROLES = (() => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../vais.config.json'), 'utf8'));
    const cSuiteRoles = Object.keys(config.cSuite?.roles || {});
    const execRoles = [
      // CEO
      'absorb-analyzer', 'skill-creator',
      // CPO
      'product-discoverer', 'product-strategist', 'product-researcher', 'prd-writer',
      'backlog-manager', 'ux-researcher', 'data-analyst',
      // CTO
      'infra-architect', 'backend-engineer', 'frontend-engineer', 'ui-designer',
      'db-architect', 'qa-engineer', 'test-engineer', 'incident-responder',
      // CSO
      'security-auditor', 'code-reviewer', 'secret-scanner', 'dependency-analyzer',
      'plugin-validator', 'skill-validator', 'compliance-auditor',
      // CBO
      'market-researcher', 'customer-segmentation-analyst', 'seo-analyst', 'copy-writer',
      'growth-analyst', 'pricing-analyst', 'financial-modeler', 'unit-economics-analyst',
      'finops-analyst', 'marketing-analytics-analyst',
      // COO
      'release-engineer', 'sre-engineer', 'release-monitor', 'performance-engineer',
    ];
    return new Set([...cSuiteRoles, ...execRoles]);
  } catch {
    return new Set();
  }
})();

function isValidRole(val) {
  return VALID_ROLES.size === 0 || VALID_ROLES.has(val);
}

const [role, phase, task = ''] = process.argv.slice(2);

if (!role || !phase) {
  // graceful degradation: 인자 없으면 exit 0 (에이전트 실행 방해 금지)
  process.exit(0);
}

if (!isValidRole(role)) {
  process.exit(0);
}

try {
  const sw = new StateWriter('.vais/agent-state.json');
  const el = new EventLogger('.vais/event-log.jsonl');

  sw.markAgentStart(role, phase, task);
  el.log(EVENT_TYPES.AGENT_START, { role, phase, task });
  logHook('SubagentStart', 'ok', { role, phase });
} catch (err) {
  // Plan SC: SC-06 — 기존 동작 완전 호환. observability 실패가 에이전트를 막으면 안 됨
  console.error('[vais observability] agent-start failed:', err.message);
}

process.exit(0);
