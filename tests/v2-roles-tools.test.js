'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  loadRoleCatalog,
  resolveRole,
  buildRolePrompt,
  runCheck,
  validateContract,
} = require('../lib/workflow/v2');
const { scanText, isObviousFixture } = require('../scripts/checks/v2-secret-scan');

const ROOT = path.join(__dirname, '..');

describe('v2 lean role registry', () => {
  it('loads unique core and specialist role cards', () => {
    const catalog = loadRoleCatalog(ROOT);
    assert.ok(catalog.roles.length >= 20);
    assert.equal(new Set(catalog.roles.map(role => role.name)).size, catalog.roles.length);
    for (const required of ['ceo', 'cpo', 'cto', 'independent-qa', 'cso', 'coo', 'cbo']) {
      assert.ok(resolveRole(catalog, required), `missing ${required}`);
    }
  });

  it('maps overlapping and mechanical Legacy names without loading Legacy bodies', () => {
    const catalog = loadRoleCatalog(ROOT);
    assert.equal(resolveRole(catalog, 'prd-writer').target, 'cpo');
    assert.equal(resolveRole(catalog, 'qa-engineer').target, 'independent-qa');
    assert.deepEqual(resolveRole(catalog, 'secret-scanner'), {
      kind: 'tool', target: 'secret-scan', alias: true,
    });
  });

  it('builds a short role-only prompt and leaves workflow rules to runtime assignment', () => {
    const catalog = loadRoleCatalog(ROOT);
    const prompt = buildRolePrompt(resolveRole(catalog, 'backend-engineer').role);
    assert.match(prompt, /Responsibility:/);
    assert.doesNotMatch(prompt, /SUB-DOC RULES|mandatory PDCA|docs\/\{feature\}/);
  });
});

describe('v2 mechanical Tool adapters', () => {
  it('returns a schema-valid pass result', () => {
    const result = runCheck('lint', {
      required: true,
      requirements: ['REQ-028'],
      executor: () => ({ status: 0, stdout: 'ok', stderr: '' }),
    });
    assert.equal(result.verdict, 'pass');
    assert.equal(validateContract('checkResult', result).valid, true);
  });

  it('returns BLOCKED-compatible output when the executable is unavailable', () => {
    const result = runCheck('dependency-scan', {
      executor: () => ({ status: null, error: { code: 'ENOENT' } }),
    });
    assert.equal(result.execution, 'unavailable');
    assert.equal(result.verdict, 'blocked');
    assert.equal(validateContract('checkResult', result).valid, true);
  });

  it('returns failure without auto-fixing', () => {
    const result = runCheck('test', {
      executor: () => ({ status: 1, stdout: '', stderr: 'failed' }),
    });
    assert.equal(result.verdict, 'fail');
    assert.deepEqual(result.findings, ['Inspect the raw evidence log for details']);
  });

  it('runs a Design-declared e2e package script and supplies a canonical evidence directory', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-e2e-adapter-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      private: true,
      scripts: { 'test:e2e': 'node e2e.js' },
    }));
    fs.writeFileSync(path.join(root, 'e2e.js'), [
      "const fs=require('fs'), path=require('path');",
      "fs.mkdirSync(process.env.VAIS_EVIDENCE_DIR,{recursive:true});",
      "fs.writeFileSync(path.join(process.env.VAIS_EVIDENCE_DIR,'screen.txt'),'captured');",
      "fs.writeFileSync(path.join(process.env.VAIS_EVIDENCE_DIR,'argument.txt'),process.argv[2]||'');",
    ].join('\n'));
    const evidenceDirectory = path.join(root, 'review-evidence', 'e2e');
    const result = runCheck('e2e', { cwd: root, evidenceDirectory });
    assert.equal(result.verdict, 'pass');
    assert.equal(fs.readFileSync(path.join(evidenceDirectory, 'screen.txt'), 'utf8'), 'captured');
    assert.equal(fs.readFileSync(path.join(evidenceDirectory, 'argument.txt'), 'utf8'), evidenceDirectory);
  });

  it('returns BLOCKED when no supported e2e package script exists', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-e2e-missing-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ private: true, scripts: {} }));
    const result = runCheck('e2e', { cwd: root });
    assert.equal(result.verdict, 'blocked');
    assert.equal(result.execution, 'unavailable');
  });

  it('fails closed when an e2e script exits zero without canonical artifacts', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-e2e-empty-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      private: true, scripts: { e2e: 'node -e "process.exit(0)"' },
    }));
    const result = runCheck('e2e', {
      cwd: root, evidenceDirectory: path.join(root, 'review-evidence', 'e2e'),
    });
    assert.equal(result.verdict, 'fail');
    assert.equal(result.execution, 'errored');
    assert.match(result.summary, /no canonical evidence artifacts/);
  });

  it('secret scan reports kind and line but never the secret value', () => {
    const fakeToken = `ghp_${'z'.repeat(30)}`;
    const findings = scanText(`safe\nconst token = ${fakeToken}\n`);
    assert.deepEqual(findings, [
      { line: 2, kind: 'github-token' },
      { line: 2, kind: 'credential-assignment' },
    ]);
    assert.ok(!JSON.stringify(findings).includes(fakeToken));
  });

  it('suppresses only explicit fixture-shaped placeholders during repository scans', () => {
    assert.equal(isObviousFixture('tests/security.test.js', "token='secret123456'"), true);
    assert.equal(isObviousFixture('src/config.js', "token='secret123456'"), false);
    assert.equal(isObviousFixture('tests/security.test.js', "token='genuine-looking-random-value'"), false); // vais-secret-scan: allow-fixture
  });
});
