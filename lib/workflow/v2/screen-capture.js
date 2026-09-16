'use strict';

// Screens are made by a machine, never described by the model (docs/harness/design.md §5).
// An installed Chrome runs headless and writes PNGs; when it is missing the caller fails
// loudly with CHROME_NOT_FOUND. Tests may select the deterministic stub renderer with
// VAIS_SCREEN_RENDERER=stub; every result names the renderer so a stub can never pass as proof.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SIZES = Object.freeze({ desktop: [1280, 800], mobile: [390, 844] });
const CHROME_CANDIDATES = Object.freeze([
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/snap/bin/chromium', '/opt/google/chrome/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]);
const CAPTURE_TIMEOUT_MS = 20_000;
// A valid 1×1 transparent PNG used only by the stub renderer.
const STUB_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const INSTALL_HINT = 'Chrome 또는 Chromium 을 설치하거나 VAIS_CHROME=<실행 파일 경로> 를 설정한다 (예: sudo apt install google-chrome-stable)';

function findChrome(env = process.env) {
  const explicit = String(env?.VAIS_CHROME || '').trim();
  if (explicit) return fs.existsSync(explicit) ? explicit : null;
  return CHROME_CANDIDATES.find(candidate => fs.existsSync(candidate)) || null;
}

function rendererFor(options = {}) {
  const requested = options.renderer || String((options.env || process.env).VAIS_SCREEN_RENDERER || '').trim().toLowerCase();
  if (requested === 'stub') return { name: 'stub', chrome: null };
  const chrome = findChrome(options.env || process.env);
  if (!chrome) {
    const error = new Error(`Chrome 을 찾지 못해 화면을 찍을 수 없다. ${INSTALL_HINT}`);
    error.code = 'CHROME_NOT_FOUND';
    throw error;
  }
  return { name: 'chrome', chrome };
}

function toUrl(target) {
  const value = String(target || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  const absolute = path.resolve(value);
  if (!fs.existsSync(absolute)) {
    const error = new Error(`캡처 대상 파일이 없다: ${absolute}`);
    error.code = 'CAPTURE_TARGET_MISSING';
    throw error;
  }
  return `file://${absolute}`;
}

function shoot(renderer, url, outFile, size) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (renderer.name === 'stub') {
    fs.writeFileSync(outFile, STUB_PNG);
    return;
  }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-chrome-'));
  try {
    const result = spawnSync(renderer.chrome, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profile}`, '--virtual-time-budget=1500', `--window-size=${size[0]},${size[1]}`,
      `--screenshot=${outFile}`, url,
    ], { encoding: 'utf8', timeout: CAPTURE_TIMEOUT_MS, stdio: ['ignore', 'pipe', 'pipe'] });
    if (result.error || result.status !== 0 || !fs.existsSync(outFile)) {
      const error = new Error(`Chrome 캡처 실패 (${size.join('×')}): ${result.error?.message || (result.stderr || '').trim().split('\n').pop() || `exit ${result.status}`}`);
      error.code = 'CAPTURE_FAILED';
      throw error;
    }
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

// Desktop and mobile PNGs of one target (project file or http(s) URL) into outDir.
function capture(target, outDir, options = {}) {
  const renderer = rendererFor(options);
  const url = toUrl(target);
  const sizes = options.sizes || SIZES;
  const files = {};
  for (const [name, size] of Object.entries(sizes)) {
    const outFile = path.join(outDir, `${name}.png`);
    shoot(renderer, url, outFile, size);
    files[name] = outFile;
  }
  return { renderer: renderer.name, url, files };
}

// Stage artifacts (wireframe .html, mockup .svg) become a PNG next to the source file.
function renderArtifact(filePath, options = {}) {
  const source = path.resolve(filePath);
  const extension = path.extname(source).toLowerCase();
  if (!['.html', '.htm', '.svg'].includes(extension)) return { rendered: false, png: null, renderer: null };
  const png = source.replace(/\.[^.]+$/, '.png');
  const renderer = rendererFor(options);
  shoot(renderer, toUrl(source), png, options.size || SIZES.desktop);
  return { rendered: true, png, renderer: renderer.name };
}

module.exports = { SIZES, CHROME_CANDIDATES, INSTALL_HINT, STUB_PNG, findChrome, rendererFor, toUrl, capture, renderArtifact };
