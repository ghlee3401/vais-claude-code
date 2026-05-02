'use strict';

/**
 * Minimal .env loader (no external deps).
 * Loads from project root .env if present.
 * Idempotent: existing process.env vars take precedence.
 */

const fs = require('fs');
const path = require('path');

function loadEnv(rootDir) {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return false;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

function getFigmaPat() {
  return process.env.FIGMA_PAT || process.env.VITE_FIGMA_PAT || null;
}

function getFigmaFileKey() {
  return process.env.FIGMA_FILE_KEY || process.env.VITE_FIGMA_FILE_KEY || null;
}

module.exports = { loadEnv, getFigmaPat, getFigmaFileKey };
