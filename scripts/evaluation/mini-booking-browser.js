#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_CANDIDATES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      return execFileSync('which', [candidate], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (_) { /* Try the next candidate. */ }
  }
  return null;
}

function safeId(value) {
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error(`Invalid scenario id: ${value}`);
  return value;
}

function runScenario(chrome, fixtureDir, scenario, outputDir) {
  const id = safeId(scenario.id);
  const [width, height] = scenario.viewport;
  const screenshot = path.join(outputDir, `${id}-${width}x${height}.png`);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-chrome-'));
  const target = new URL(`file://${path.join(fixtureDir, 'index.html')}`);
  target.searchParams.set('qa', id);
  try {
    const dom = execFileSync(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--run-all-compositor-stages-before-draw', '--virtual-time-budget=1200',
      `--user-data-dir=${profileDir}`, `--window-size=${width},${height}`,
      `--screenshot=${screenshot}`, '--dump-dom', target.href,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5 * 1024 * 1024 });
    const passed = dom.includes(`data-qa-scenario="${id}"`) &&
      dom.includes('data-qa-status="passed"') && dom.includes(scenario.expectedText);
    return { id, viewport: `${width}x${height}`, verdict: passed ? 'pass' : 'fail', screenshot };
  } finally {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

function runAll(options = {}) {
  const root = options.root || process.env.VAIS_PROJECT_ROOT || process.cwd();
  const fixtureDir = path.join(root, 'tests/fixtures/mini-booking');
  const manifest = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'scenarios.json'), 'utf8'));
  const chrome = options.chrome || findChrome();
  if (!chrome) return { verdict: 'blocked', reason: 'Chrome/Chromium is unavailable', scenarios: [] };
  const outputDir = options.outputDir || process.env.VAIS_EVIDENCE_DIR ||
    path.join(root, '.vais', 'evidence', 'mini-booking');
  fs.mkdirSync(outputDir, { recursive: true });
  const scenarios = manifest.scenarios.map(scenario => runScenario(chrome, fixtureDir, scenario, outputDir));
  return { verdict: scenarios.every(item => item.verdict === 'pass') ? 'pass' : 'fail', browser: chrome, scenarios };
}

if (require.main === module) {
  const result = runAll({ outputDir: process.argv[2] });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.verdict === 'pass' ? 0 : 1;
}

module.exports = { findChrome, runScenario, runAll };
