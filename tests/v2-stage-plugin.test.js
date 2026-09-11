'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildStage } = require('../scripts/build-v2-plugin-stage');

function symlinksUnder(root) {
  const found = [];
  const visit = directory => {
    for (const name of fs.readdirSync(directory)) {
      const target = path.join(directory, name);
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) found.push(target);
      else if (stat.isDirectory()) visit(target);
    }
  };
  visit(root);
  return found;
}

describe('v2 staged plugin bundle', () => {
  it('contains only the v2 runtime agent and managed entry skill', t => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-v2-stage-'));
    t.after(() => fs.rmSync(output, { recursive: true, force: true }));
    const result = buildStage(path.join(__dirname, '..'), output);
    assert.deepEqual(result.agents, ['v2-specialist.md']);
    assert.deepEqual(result.skills, ['vais']);
    assert.equal(fs.existsSync(path.join(output, 'agents', 'cto')), false);
    const specialist = fs.readFileSync(path.join(output, 'agents', 'v2-specialist.md'), 'utf8');
    assert.match(specialist, /raw `specialist-handoff\/v1` JSON object/);
    assert.match(specialist, /x-vais-max-serialized-bytes/);
    assert.match(specialist, /repo-relative evidence paths or receipt IDs/);
    assert.equal(fs.existsSync(path.join(output, 'schemas', 'review-evidence-prepare.schema.json')), true);
    assert.equal(fs.existsSync(path.join(output, 'package-lock.json')), true);
    assert.equal(fs.lstatSync(path.join(output, 'node_modules')).isSymbolicLink(), false);
    assert.ok(result.dependencies.includes('node_modules/ajv'));
    assert.ok(result.dependencies.includes('node_modules/gray-matter'));
    assert.ok(result.dependencies.includes('node_modules/js-yaml'));
    assert.deepEqual(symlinksUnder(output), []);
    const hooks = JSON.parse(fs.readFileSync(path.join(output, 'hooks', 'hooks.json'), 'utf8'));
    assert.deepEqual(Object.keys(hooks.hooks).sort(), ['PostToolUse', 'PreToolUse', 'UserPromptSubmit']);
    assert.match(hooks.hooks.PostToolUse[0].matcher, /Agent/);
    const { phaseGuidance } = require(path.join(output, 'hooks', 'workflow-v2-prompt.js'));
    const planLine = phaseGuidance(null, 'stage-session').find(line => line.includes('vais-workflow-v2.js" plan'));
    assert.match(planLine, new RegExp(`node "${output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/scripts/vais-workflow-v2\\.js" plan`));
    const manifest = JSON.parse(fs.readFileSync(path.join(output, '.claude-plugin', 'plugin.json'), 'utf8'));
    const runner = manifest.mcpServers['vais-design-system'].args[0]
      .replace('${CLAUDE_PLUGIN_ROOT}', output);
    assert.equal(fs.existsSync(runner), true);
    assert.equal(fs.existsSync(path.join(output, 'vendor', 'ui-ux-pro-max', 'scripts', 'search.py')), true);
    assert.doesNotMatch(fs.readFileSync(path.join(output, 'skills', 'vais', 'SKILL.md'), 'utf8'), /legacy\.md/);
    assert.equal(typeof require(path.join(output, 'lib', 'workflow', 'v2', 'contracts.js')).assertContract, 'function');
    assert.equal(typeof require(path.join(output, 'lib', 'workflow', 'v2', 'document-manager.js')).serialize, 'function');
  });
});
