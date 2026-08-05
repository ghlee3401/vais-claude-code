/**
 * Unit tests for lib/registry/agent-registry.js
 * sub-plan 03 §4.4 — includes 병합, 순환 방지
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const registry = require('../lib/registry/agent-registry');

test('parseFrontmatter: YAML frontmatter 파싱', () => {
  const raw = `---
name: test-agent
model: sonnet
includes:
  - _shared/advisor-guard.md
---

# Body here`;
  const { frontmatter, body } = registry.parseFrontmatter(raw);
  assert.strictEqual(frontmatter.name, 'test-agent');
  assert.strictEqual(frontmatter.model, 'sonnet');
  assert.deepStrictEqual(frontmatter.includes, ['_shared/advisor-guard.md']);
  assert.ok(body.includes('# Body here'));
});

test('parseFrontmatter: frontmatter 없으면 전체가 body', () => {
  const raw = '# No frontmatter\nSome content';
  const { frontmatter, body } = registry.parseFrontmatter(raw);
  assert.deepStrictEqual(frontmatter, {});
  assert.strictEqual(body, raw);
});

test('loadAgent: advisor-guard.md 로드', () => {
  const agentPath = 'agents/_shared/advisor-guard.md';
  const absPath = path.resolve(registry.AGENTS_DIR, '..', agentPath);
  assert.ok(fs.existsSync(absPath), 'advisor-guard.md should exist');
});

test('loadAgent: CBO cbo.md 로드 + frontmatter', () => {
  const agent = registry.loadAgent('agents/cbo/cbo.md');
  assert.strictEqual(agent.frontmatter.name, 'cbo');
  assert.strictEqual(agent.frontmatter.model, 'opus');
  assert.ok(agent.body.includes('# CBO Agent'));
});

test('loadAgent: includes 미존재 시 mergedBody === body', () => {
  const agent = registry.loadAgent('agents/cbo/cbo.md');
  assert.strictEqual(agent.mergedBody, agent.body);
});

test('loadAgent: includes가 있으면 prepend 병합', () => {
  // fixture 생성
  const fixtureDir = path.join(registry.AGENTS_DIR, '_shared');
  const fixturePath = path.join(fixtureDir, 'test-fixture-guard.md');
  const testAgentDir = path.join(registry.AGENTS_DIR, '_test');
  const testAgentPath = path.join(testAgentDir, 'sample.md');

  fs.mkdirSync(testAgentDir, { recursive: true });
  fs.writeFileSync(fixturePath, '## TEST GUARD\nThis is a test guard.');
  fs.writeFileSync(testAgentPath, `---
name: sample
model: sonnet
includes:
  - _shared/test-fixture-guard.md
---

# Sample Agent Body`);

  try {
    const agent = registry.loadAgent('agents/_test/sample.md');
    assert.ok(agent.mergedBody.startsWith('## TEST GUARD'), 'guard should be prepended');
    assert.ok(agent.mergedBody.includes('# Sample Agent Body'), 'body should follow');
    assert.deepStrictEqual(agent.includes, ['_shared/test-fixture-guard.md']);
  } finally {
    fs.rmSync(testAgentDir, { recursive: true, force: true });
    fs.unlinkSync(fixturePath);
  }
});

test('loadAgent: 순환 include 방지', () => {
  const fixtureDir = path.join(registry.AGENTS_DIR, '_shared');
  const guardA = path.join(fixtureDir, 'circ-a.md');
  const guardB = path.join(fixtureDir, 'circ-b.md');

  fs.writeFileSync(guardA, '## Guard A');
  fs.writeFileSync(guardB, '## Guard B');

  const testDir = path.join(registry.AGENTS_DIR, '_test');
  const testAgent = path.join(testDir, 'circ-test.md');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testAgent, `---
name: circ-test
includes:
  - _shared/circ-a.md
  - _shared/circ-a.md
---

# Body`);

  try {
    const agent = registry.loadAgent('agents/_test/circ-test.md');
    // circ-a should appear only once (second is skipped)
    const count = (agent.mergedBody.match(/## Guard A/g) || []).length;
    assert.strictEqual(count, 1, 'duplicate include should be skipped');
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.unlinkSync(guardA);
    fs.unlinkSync(guardB);
  }
});

test('loadAllAgents: _shared 디렉토리 제외', () => {
  const agents = registry.loadAllAgents();
  for (const [name] of agents) {
    assert.ok(!name.startsWith('_'), `_shared agents should not be in loadAllAgents: ${name}`);
  }
  assert.ok(agents.size > 0, 'should load at least some agents');
});
