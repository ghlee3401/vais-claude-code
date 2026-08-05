/**
 * Advisor Degrade Gracefully tests (sub-plan 04)
 * SC-20: 비용 캡 초과 → 자동 비활성화 + Sonnet 단독
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

test('cost-monitor: budget check + record + degrade', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-advisor-'));
  const vaisDir = path.join(tmp, '.vais');
  fs.mkdirSync(vaisDir, { recursive: true });

  const originalCwd = process.cwd();
  process.chdir(tmp);

  // 설정 파일 mock
  fs.writeFileSync(path.join(tmp, 'vais.config.json'), JSON.stringify({
    version: '0.50.0',
    workflow: { phases: ['plan'] },
    cSuite: { roles: {} },
    orchestration: { gateAction: 'confirm' },
    advisor: { max_calls_per_session: 3, monthly_budget_usd: 1.0 },
  }));

  // cost-monitor는 require 시점에 paths를 캐시하므로 fresh require
  delete require.cache[require.resolve('../lib/control/cost-monitor')];
  delete require.cache[require.resolve('../lib/paths')];
  const cm = require('../lib/control/cost-monitor');

  try {
    // 초기: 허용됨
    const b1 = await cm.checkBudget('sess-1');
    assert.strictEqual(b1.allowed, true);

    // 3회 기록
    await cm.recordCall({ sessionId: 'sess-1', subAgent: 'be', cost: 0.3, tokens: {} });
    await cm.recordCall({ sessionId: 'sess-1', subAgent: 'be', cost: 0.3, tokens: {} });
    await cm.recordCall({ sessionId: 'sess-1', subAgent: 'be', cost: 0.3, tokens: {} });

    // session cap (3) 도달
    const b2 = await cm.checkBudget('sess-1');
    assert.strictEqual(b2.allowed, false);
    assert.strictEqual(b2.reason, 'session_cap');

    // degraded 상태
    const deg = await cm.isDegraded();
    assert.strictEqual(deg, true);

    // 새 세션에서는 session 리셋
    const b3 = await cm.checkBudget('sess-2');
    assert.strictEqual(b3.allowed, true, 'new session should reset session cap');

    // 월 예산 소진
    await cm.recordCall({ sessionId: 'sess-2', subAgent: 'fe', cost: 0.5, tokens: {} });
    // 총 0.9 + 0.5 = 1.4 > 1.0 monthly cap...
    // wait, 새 session에서는 session이 reset되지만 month는 유지
    // 이전 3회(0.9) + 이번 1회(0.5) = month 1.4
    const b4 = await cm.checkBudget('sess-2');
    assert.strictEqual(b4.allowed, false);
    assert.strictEqual(b4.reason, 'monthly_cap');

    // degradeReason
    assert.strictEqual(cm.degradeReason(), 'monthly_cap');

  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
    delete require.cache[require.resolve('../lib/control/cost-monitor')];
    delete require.cache[require.resolve('../lib/paths')];
  }
});
