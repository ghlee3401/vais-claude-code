/**
 * Unit tests for lib/core/migration-engine.js
 * sub-plan 00 §4 — fixture cmo_feat_a → cbo_feat_a 변환 + backup 확인
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const me = require('../lib/core/migration-engine');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vais-mig-'));
}

function writeFixture(vaisDir, status) {
  fs.mkdirSync(vaisDir, { recursive: true });
  fs.writeFileSync(path.join(vaisDir, 'status.json'), JSON.stringify(status, null, 2));
}

test('transformStatus: cmo_/cfo_ features → cbo_ rename', () => {
  const input = {
    metadata: { version: '0.49.2' },
    features: {
      cmo_feat_a: { role: 'cmo', currentPhase: 'plan' },
      cfo_pricing: { role: 'cfo', currentPhase: 'design' },
      cto_login: { role: 'cto' },
    },
  };
  const { migrated, changes } = me.transformStatus(input);
  assert.ok(migrated.features.cbo_feat_a);
  assert.ok(migrated.features.cbo_pricing);
  assert.ok(migrated.features.cto_login);
  assert.ok(!migrated.features.cmo_feat_a);
  assert.ok(!migrated.features.cfo_pricing);
  assert.strictEqual(migrated.features.cbo_feat_a.role, 'cbo');
  assert.strictEqual(migrated.features.cbo_pricing.role, 'cbo');
  assert.strictEqual(migrated.metadata.version, '0.50.0');
  assert.ok(changes.length > 0);
});

test('transformStatus: retrospective-writer / technical-writer 레코드 제거', () => {
  const input = {
    metadata: { version: '0.49.2' },
    agents: {
      'retrospective-writer': { calls: 12 },
      'technical-writer': { calls: 5 },
      'backend-engineer': { calls: 3 },
    },
  };
  const { migrated } = me.transformStatus(input);
  assert.ok(!('retrospective-writer' in migrated.agents));
  assert.ok(!('technical-writer' in migrated.agents));
  assert.ok('backend-engineer' in migrated.agents);
});

test('transformStatus: cSuite subAgents 이동 (release/performance-engineer → coo)', () => {
  const input = {
    metadata: { version: '0.49.2' },
    cSuite: {
      roles: {
        cto: { subAgents: ['backend-engineer', 'release-engineer', 'performance-engineer'] },
        coo: { subAgents: ['sre-engineer'] },
        cmo: { subAgents: ['seo-analyst'] },
      },
    },
  };
  const { migrated } = me.transformStatus(input);
  assert.ok(!migrated.cSuite.roles.cto.subAgents.includes('release-engineer'));
  assert.ok(!migrated.cSuite.roles.cto.subAgents.includes('performance-engineer'));
  assert.ok(migrated.cSuite.roles.coo.subAgents.includes('release-engineer'));
  assert.ok(migrated.cSuite.roles.coo.subAgents.includes('performance-engineer'));
  assert.ok(!('cmo' in migrated.cSuite.roles));
});

test('migrate: dryRun은 파일을 쓰지 않는다', async () => {
  const tmp = mkTmp();
  const vaisDir = path.join(tmp, '.vais');
  writeFixture(vaisDir, {
    metadata: { version: '0.49.2' },
    features: { cmo_a: { role: 'cmo' } },
  });
  const r = await me.migrate({ projectDir: tmp, dryRun: true });
  assert.strictEqual(r.migrated, false);
  assert.ok(r.changes.length > 0);
  const after = JSON.parse(fs.readFileSync(path.join(vaisDir, 'status.json'), 'utf8'));
  assert.strictEqual(after.metadata.version, '0.49.2', 'should remain unchanged in dryRun');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('migrate: 실제 실행 시 변환 + backup 생성', async () => {
  const tmp = mkTmp();
  const vaisDir = path.join(tmp, '.vais');
  writeFixture(vaisDir, {
    metadata: { version: '0.49.2' },
    features: { cmo_feat_a: { role: 'cmo' }, cfo_pricing: { role: 'cfo' } },
  });
  const r = await me.migrate({ projectDir: tmp });
  assert.strictEqual(r.migrated, true);
  assert.ok(r.backupPath && fs.existsSync(r.backupPath), 'backup should exist');
  const after = JSON.parse(fs.readFileSync(path.join(vaisDir, 'status.json'), 'utf8'));
  assert.strictEqual(after.metadata.version, '0.50.0');
  assert.ok(after.features.cbo_feat_a);
  assert.ok(after.features.cbo_pricing);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('migrate: 이미 v0.50이면 skip', async () => {
  const tmp = mkTmp();
  const vaisDir = path.join(tmp, '.vais');
  writeFixture(vaisDir, { metadata: { version: '0.50.0' } });
  const r = await me.migrate({ projectDir: tmp });
  assert.strictEqual(r.skipped, true);
  assert.strictEqual(r.migrated, false);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('semver 비교 helper', () => {
  assert.strictEqual(me._semverLt('0.49.2', '0.50.0'), true);
  assert.strictEqual(me._semverLt('0.50.0', '0.50.0'), false);
  assert.strictEqual(me._semverLt('1.0.0', '0.50.0'), false);
});
