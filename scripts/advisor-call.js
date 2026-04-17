#!/usr/bin/env node
/**
 * VAIS Code - Advisor CLI 진입점 (v0.56 sub-plan 06 chunk 3)
 *
 * agent markdown에서 Bash 도구로 호출:
 *   node scripts/advisor-call.js \
 *     --sub-agent=backend-engineer \
 *     --c-level=cto \
 *     --trigger=early \
 *     --summary="Stripe webhook 검증 구현 시작"
 *
 * stdout으로 advice 출력. native 모드면 스킵 안내.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_DIR = process.cwd();
const MODE_FILE = path.join(PROJECT_DIR, '.vais', 'advisor-mode.json');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([a-zA-Z0-9-]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function readMode() {
  if (!fs.existsSync(MODE_FILE)) return { mode: 'wrapper', detail: 'mode file not found, defaulting to wrapper' };
  try {
    return JSON.parse(fs.readFileSync(MODE_FILE, 'utf8'));
  } catch (_) {
    return { mode: 'wrapper', detail: 'mode file unreadable' };
  }
}

function ensureSessionId(argSessionId) {
  return argSessionId || process.env.VAIS_SESSION_ID || crypto.randomUUID();
}

function findPluginRoot(startDir) {
  // 본 스크립트는 <plugin-root>/scripts/advisor-call.js 에 위치
  return path.resolve(__dirname, '..');
}

function loadSubAgentMarkdown(pluginRoot, cLevel, subAgent) {
  if (!cLevel || !subAgent) return '';
  const candidates = [
    path.join(pluginRoot, 'agents', cLevel, `${subAgent}.md`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  return '';
}

function loadAdvisorGuard(pluginRoot) {
  const p = path.join(pluginRoot, 'agents', '_shared', 'advisor-guard.md');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  return '';
}

function buildTriggerContext(args) {
  return {
    summary: args.summary,
    error: args.error,
    attempts: args.attempts,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const subAgent = args['sub-agent'];
  const cLevel = args['c-level'];
  const trigger = args.trigger || 'early';

  if (!subAgent || !cLevel) {
    process.stderr.write('[advisor-call] required: --sub-agent, --c-level\n');
    process.stderr.write('usage: node scripts/advisor-call.js --sub-agent=<name> --c-level=<level> --trigger=<early|stuck|final|reconcile> [--summary=<text>]\n');
    process.exit(2);
  }

  const mode = readMode();
  if (mode.mode === 'disabled') {
    process.stderr.write(`[advisor-call] advisor disabled (${mode.detail}). skipping.\n`);
    process.exit(0);
  }
  if (mode.mode === 'native') {
    process.stderr.write('[advisor-call] native mode — Claude Code handles advisor directly. This CLI is a no-op.\n');
    process.exit(0);
  }

  const sessionId = ensureSessionId(args['session-id']);
  const pluginRoot = findPluginRoot();

  const subAgentMarkdown = loadSubAgentMarkdown(pluginRoot, cLevel, subAgent);
  const advisorGuard = loadAdvisorGuard(pluginRoot);
  const mergedMarkdown = [subAgentMarkdown, advisorGuard].filter(Boolean).join('\n\n---\n\n');

  const { callAdvisor } = require(path.join(pluginRoot, 'lib', 'advisor', 'wrapper'));

  try {
    const result = await callAdvisor({
      sessionId,
      subAgent,
      cLevel,
      trigger,
      subAgentMarkdown: mergedMarkdown,
      conversation: [],
      triggerContext: buildTriggerContext(args),
    });

    if (result.status === 'ok' && result.advice) {
      process.stdout.write(result.advice);
      process.stdout.write('\n');
      process.exit(0);
    }

    // non-ok statuses
    const msg = {
      budget_block: 'advisor budget cap reached — degraded mode',
      unavailable:  'advisor unavailable (SDK or API key missing)',
      timeout:      'advisor request timed out',
    }[result.status] || `advisor status=${result.status}`;
    process.stderr.write(`[advisor-call] ${msg}\n`);
    process.exit(1);
  } catch (err) {
    process.stderr.write(`[advisor-call] error: ${err.message || err}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, readMode, ensureSessionId };
