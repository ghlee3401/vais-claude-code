'use strict';

const fs = require('fs');
const path = require('path');

const MAX_ROOT_WALK_DEPTH = 64;

function normalizeString(value, maxLength = 4096) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, maxLength) : '';
}

function resolveStartDir(input) {
  const candidate = normalizeString(input?.cwd);
  if (candidate && path.isAbsolute(candidate)) {
    try {
      if (fs.statSync(candidate).isDirectory()) return path.resolve(candidate);
    } catch (_) { /* Fall back to the hook process cwd. */ }
  }
  return process.cwd();
}

function resolveProjectRoot(startDir) {
  let directory = path.resolve(startDir);
  for (let depth = 0; depth < MAX_ROOT_WALK_DEPTH; depth += 1) {
    if (fs.existsSync(path.join(directory, 'vais.config.json')) ||
      fs.existsSync(path.join(directory, '.vais', 'status.json'))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
  return null;
}

function extractPrompt(input) {
  return [input?.prompt, input?.user_prompt, input?.user_message, input?.message, input?.text]
    .find(value => typeof value === 'string') || '';
}

module.exports = { MAX_ROOT_WALK_DEPTH, normalizeString, resolveStartDir, resolveProjectRoot, extractPrompt };
