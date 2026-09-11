'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const workflow = require('../lib/workflow/v2');
const capsuleApi = {
  ...require('../lib/workflow/v2/context-capsule'),
  ...workflow,
};

const {
  CAPSULE_LIMITS,
  EVENTS,
  WorkItemStore,
  assertFreshCapsule,
  buildContextCapsule,
  writePhaseDocument,
} = capsuleApi;

const T0 = '2026-09-02T00:00:00.000Z';

function fixture(t, scale = 'compact') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-capsule-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const store = new WorkItemStore(root);
  let item = store.create({
    id: `WI-2026-09-02-${scale}-capsule`,
    title: `${scale} capsule`,
    primaryFeature: 'workflow',
    affectedFeatures: [],
    scale,
  }, T0);
  const plan = [
    '# Plan', '', '## 요구사항', 'REQ-001: booking toggle is deterministic.', '',
    '## 사용자 흐름', '사용자는 수업을 선택하면 확인 상태를 본다.', '',
    '## 완료 조건', 'TC-001 기준을 충족한다.', '',
    '## Internal narrative', 'This entire narrative is intentionally irrelevant and must not be copied into the design capsule. '.repeat(40),
  ].join('\n');
  writePhaseDocument(root, item, 'plan', plan, { status: 'approved' });
  item = store.apply(item.id, EVENTS.PLAN_PRESENTED, {
    gateResult: {
      gate: 'plan', verdict: 'PASS', requiredChecks: ['plan-document'],
      passed: ['plan-document'], failed: [], blocked: [], missing: [], evaluatedAt: T0,
    },
  }, { timestamp: T0 });
  item = store.apply(item.id, EVENTS.USER_PLAN_APPROVED, {}, { timestamp: T0 });
  return { root, store, item };
}

describe('v2 bounded phase Context Capsule', () => {
  it('returns selected phase facts plus source path and hash, not the full predecessor', t => {
    const { root, item } = fixture(t);
    const capsule = buildContextCapsule(root, item, 'design', 'cto', {
      technicalSurface: ['lib/workflow/v2/context-capsule.js'],
    });
    const serialized = JSON.stringify(capsule);
    assert.equal(capsule.schema, 'phase-context-capsule/v1');
    assert.deepEqual(capsule.data.requirements, ['REQ-001']);
    assert.equal(capsule.sources.length, 1);
    assert.match(capsule.sources[0].path, /01-plan\/main\.md$/);
    assert.match(capsule.sources[0].hash, /^[a-f0-9]{64}$/);
    assert.ok(Buffer.byteLength(serialized) <= CAPSULE_LIMITS.compact);
    assert.doesNotMatch(serialized, /entire narrative is intentionally irrelevant/);
  });

  it('fails rather than truncating a capsule that exceeds the scale limit', t => {
    const { root, item } = fixture(t);
    assert.throws(() => buildContextCapsule(root, item, 'design', 'cto', {
      technicalSurface: Array.from({ length: 80 }, (_, index) => `${index}-${'x'.repeat(400)}`),
    }), error => {
      assert.equal(error.code, 'CAPSULE_BUDGET_EXCEEDED');
      assert.ok(error.bytes > CAPSULE_LIMITS.compact);
      assert.equal(error.limit, CAPSULE_LIMITS.compact);
      return true;
    });
  });

  it('rejects a capsule after any canonical source changes', t => {
    const { root, item } = fixture(t);
    const capsule = buildContextCapsule(root, item, 'design', 'cto');
    assert.equal(assertFreshCapsule(root, capsule), capsule);
    const source = path.join(root, capsule.sources[0].path);
    fs.appendFileSync(source, '\nExternally revised after capsule issuance.\n');
    assert.throws(() => assertFreshCapsule(root, capsule), /source is stale/);
  });

  it('rejects a capsule whose revision or phase no longer matches runtime state', t => {
    const { root, store, item } = fixture(t);
    const capsule = buildContextCapsule(root, item, 'design', 'cto');
    store.apply(item.id, EVENTS.DESIGN_SCOPE_DEFINED, {
      writeScopes: ['tests/**'], readinessChecks: ['test'], reviewChecks: ['test'],
    }, { timestamp: T0 });
    const changed = { ...capsule, revision: { ...capsule.revision, design: 99 } };
    assert.throws(() => assertFreshCapsule(root, changed), /revision is stale/);
  });
});
