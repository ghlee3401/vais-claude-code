'use strict';

// Shared preparation for the regression scenes (docs/harness/design.md §11). Only setup lives
// here — temporary roots, fixture copies, chain approval, authorizations, the user's sentence
// through the router — so each scene file keeps its own judgments and stays readable alone.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { AuthorizationStore } = require('../../lib/workflow/v2/authorization-store');
const { routePrompt } = require('../../lib/workflow/v2/router');
const { loadChainCatalog } = require('../../lib/workflow/v2/chain-registry');
const idChain = require('../../lib/workflow/v2/id-chain');
const prompt = require('../../hooks/workflow-v2-prompt');

const FIXTURES = path.join(__dirname, '..', 'fixtures', 'product-stages');
const MINI_BOOKING = path.join(__dirname, '..', 'fixtures', 'mini-booking');
const STATIC_SERVER = path.join(__dirname, '..', 'fixtures', 'static-server.js');
const VERSION = '4.0.0';
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'vais', GIT_AUTHOR_EMAIL: 'vais@example.com', GIT_COMMITTER_NAME: 'vais', GIT_COMMITTER_EMAIL: 'vais@example.com' };

// Screens are rendered by the deterministic stub; real Chrome rendering is covered by unit tests.
process.env.VAIS_SCREEN_RENDERER = process.env.VAIS_SCREEN_RENDERER || 'stub';

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: GIT_ENV }).trim();
}

// A throw-away project: vais.config.json (enforce, optional extras) and a package.json.
function makeRoot(t, prefix, config = {}, pkg = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `vais-${prefix}-`));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version: VERSION, workflowV2: { mode: 'enforce' }, ...config }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: pkg.name || 'app', version: pkg.version || '0.0.1' }));
  return root;
}

// The seven version surfaces `/vais 저장` checks, all at one version.
function writeVersionFiles(root, version = VERSION) {
  fs.writeFileSync(path.join(root, 'vais.config.json'), JSON.stringify({ version, workflowV2: { mode: 'enforce' } }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'app', version }));
  fs.mkdirSync(path.join(root, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), JSON.stringify({ version }));
  fs.writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({ metadata: { version }, plugins: [{ version }] }));
  fs.writeFileSync(path.join(root, 'README.md'), `<img src="https://img.shields.io/badge/version-${version}-blue">\n`);
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), `# Changelog\n\n## [${version}] - 2026-09-16\n`);
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory()) copyDir(path.join(source, entry.name), path.join(target, entry.name));
    else fs.copyFileSync(path.join(source, entry.name), path.join(target, entry.name));
  }
}

function write(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return relative;
}

// Copies one product-stages fixture (by stage object or order) with its artifacts into the root.
function installStage(root, stageOrOrder) {
  const stage = typeof stageOrOrder === 'number' ? loadChainCatalog().stages.find(entry => entry.order === stageOrOrder) : stageOrOrder;
  fs.mkdirSync(path.join(root, path.dirname(stage.file)), { recursive: true });
  fs.copyFileSync(path.join(FIXTURES, path.basename(stage.file)), path.join(root, stage.file));
  if (stage.artifactDir) {
    const source = path.join(FIXTURES, path.basename(stage.artifactDir));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.join(root, stage.artifactDir), { recursive: true });
      for (const name of fs.readdirSync(source)) fs.copyFileSync(path.join(source, name), path.join(root, stage.artifactDir, name));
    }
  }
  return stage;
}

// An approved chain up to stage `upTo`, as if the stage Work items had all been reported.
function approveChain(root, upTo = 10, workItemPrefix = 'WI-2026-09-16-s') {
  for (let order = 1; order <= upTo; order += 1) idChain.approveStage(root, installStage(root, order), { workItem: `${workItemPrefix}${order}` });
}

function grant(root, session, item, phase, action = 'continue-work', extra = {}) {
  new AuthorizationStore(root).grant({ sessionId: session, workItemId: item?.id || null, phase, action, allowedPaths: [], allowedCommands: [], ...extra });
}

// The user's sentence goes through the same router and event mapping the prompt hook uses.
function userSays(root, store, item, session, sentence) {
  return prompt.applyDeterministicRoute(store, item, routePrompt(sentence, item), session);
}

// A passing independent-QA handoff within the standard caps.
function qaPass(judgment, options = {}) {
  return {
    schema: 'specialist-handoff/v1', status: 'completed', verdict: 'pass', judgment,
    decisions: options.decisions || ['검수 기준 통과'],
    behavior: { inputs: options.inputs || ['evidence'], outputs: ['pass'], errors: [] },
    evidence: options.evidence || ['review evidence'],
    affectedRequirements: options.affectedRequirements || [], risks: [], unverified: [], recommendedChecks: [],
  };
}

module.exports = { FIXTURES, MINI_BOOKING, STATIC_SERVER, VERSION, git, makeRoot, writeVersionFiles, copyDir, write, installStage, approveChain, grant, userSays, qaPass };
