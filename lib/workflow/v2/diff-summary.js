'use strict';

// Per-round change summary for the UI loop (docs/harness/design.md §5): what the machine can
// prove changed between two snapshots of the app files, in plain words. CSS declarations are
// compared one by one; every other file is only named. Nothing here is inferred or invented.

const fs = require('fs');
const path = require('path');

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '.vais']);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_LINES = 60;

function listFiles(root) {
  const files = [];
  if (!root || !fs.existsSync(root)) return files;
  (function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(path.relative(root, full).split(path.sep).join('/'));
    }
  })(root);
  return files.sort();
}

// Copies the app files of one round so the next round has something to compare against.
function snapshotFiles(sourceRoot, destinationRoot) {
  fs.rmSync(destinationRoot, { recursive: true, force: true });
  fs.mkdirSync(destinationRoot, { recursive: true });
  const copied = [];
  for (const relative of listFiles(sourceRoot)) {
    const source = path.join(sourceRoot, relative);
    if (fs.statSync(source).size > MAX_FILE_BYTES) continue;
    const target = path.join(destinationRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied.push(relative);
  }
  return copied;
}

// `selector { prop: value; … }` → Map("selector prop" → value). Nested at-rules keep their
// prefix so a media-query override is a different key from the base rule.
function parseCss(text) {
  const declarations = new Map();
  const source = String(text || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let index = 0;
  let buffer = '';
  while (index < source.length) {
    const char = source[index];
    if (char === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '));
      buffer = '';
    } else if (char === '}') {
      const selector = stack.join(' ');
      for (const declaration of buffer.split(';')) {
        const colon = declaration.indexOf(':');
        if (colon === -1) continue;
        const property = declaration.slice(0, colon).trim();
        const value = declaration.slice(colon + 1).trim().replace(/\s+/g, ' ');
        if (property && value) declarations.set(`${selector} ${property}`, value);
      }
      stack.pop();
      buffer = '';
    } else {
      buffer += char;
    }
    index += 1;
  }
  return declarations;
}

function readIfFile(file) {
  try {
    return fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : null;
  } catch (_) {
    return null;
  }
}

function cssChanges(before, after) {
  const previous = parseCss(before);
  const current = parseCss(after);
  const lines = [];
  for (const [key, value] of current) {
    if (!previous.has(key)) lines.push(`${key}: (없음) → ${value}`);
    else if (previous.get(key) !== value) lines.push(`${key}: ${previous.get(key)} → ${value}`);
  }
  for (const [key, value] of previous) if (!current.has(key)) lines.push(`${key}: ${value} → (삭제)`);
  return lines;
}

// Compares two snapshots; returns plain-language lines and a one-line summary.
function summarizeChanges(previousRoot, currentRoot) {
  const previousFiles = new Set(listFiles(previousRoot));
  const currentFiles = new Set(listFiles(currentRoot));
  const lines = [];
  for (const relative of [...new Set([...previousFiles, ...currentFiles])].sort()) {
    const before = readIfFile(path.join(previousRoot, relative));
    const after = readIfFile(path.join(currentRoot, relative));
    if (before === null && after !== null) { lines.push(`추가: ${relative}`); continue; }
    if (before !== null && after === null) { lines.push(`삭제: ${relative}`); continue; }
    if (before === after) continue;
    if (/\.css$/i.test(relative)) {
      const changes = cssChanges(before, after);
      lines.push(...(changes.length ? changes.map(change => `${relative} · ${change}`) : [`변경: ${relative} (선언 밖 변경)`]));
    } else {
      lines.push(`변경: ${relative}`);
    }
  }
  const shown = lines.slice(0, MAX_LINES);
  const summary = shown.length === 0 ? '변경 없음' : `${shown.length}건 변경 — ${shown.slice(0, 3).map(line => line.replace(/^[^·]+· /, '')).join(', ')}${shown.length > 3 ? ' …' : ''}`;
  return { lines: shown, truncated: lines.length > MAX_LINES, summary };
}

function renderDiffMarkdown(round, result) {
  return [
    `# 회차 ${round} 변경 요약`, '',
    `> 기계 추출 (CSS 선언 비교 + 파일 비교). ${result.summary}`, '',
    ...(result.lines.length ? result.lines.map(line => `- ${line}`) : ['- 변경 없음']),
    ...(result.truncated ? ['', `(${MAX_LINES}줄 초과분 생략)`] : []),
    '',
  ].join('\n');
}

module.exports = { listFiles, snapshotFiles, parseCss, cssChanges, summarizeChanges, renderDiffMarkdown };
