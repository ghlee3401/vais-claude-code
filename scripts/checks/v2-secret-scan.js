#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PATTERNS = Object.freeze([
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/i],
  [
    'credential-assignment',
    /\b(?:password|passwd|secret|token|api[_ -]?key)\s*[:=]\s*(?:"[^"\s]{8,}"|'[^'\s]{8,}'|(?!process\.env\b|\$\{|<)[A-Za-z0-9][A-Za-z0-9._~+/=-]{11,})/i,
  ],
]);

function scanText(text) {
  const findings = [];
  const lines = String(text || '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const [kind, pattern] of PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(lines[index]);
      if (!match) continue;
      const suffix = lines[index].slice(match.index + match[0].length).trimStart();
      if (kind === 'credential-assignment' && suffix.startsWith('(')) continue;
      findings.push({ line: index + 1, kind });
    }
  }
  return findings;
}

function isObviousFixture(relative, line) {
  if (line.includes('vais-secret-scan: allow-fixture')) return true;
  if (!relative.startsWith('tests/')) return false;
  return /(?:secret123456|ABCD1234EFGH|longvalue12345678|sk-abc123(?:\.\.\.|[0-9]+)|ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ|super-secret-value-12345|AKIA1234567890ABCDEF)/.test(line); // vais-secret-scan: allow-fixture
}

function trackedFiles(cwd) {
  const output = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return output.split('\0').filter(Boolean);
}

function main(cwd = process.cwd()) {
  const findings = [];
  for (const relative of trackedFiles(cwd)) {
    const filePath = path.join(cwd, relative);
    let stat;
    try { stat = fs.statSync(filePath); } catch (_) { continue; }
    if (!stat.isFile() || stat.size > 1024 * 1024) continue;
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch (_) { continue; }
    const lines = content.split(/\r?\n/);
    for (const finding of scanText(content)) {
      if (isObviousFixture(relative, lines[finding.line - 1] || '')) continue;
      findings.push({ path: relative, ...finding });
    }
  }
  process.stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`);
  return findings.length === 0 ? 0 : 1;
}

module.exports = { PATTERNS, scanText, isObviousFixture, trackedFiles, main };

if (require.main === module) process.exitCode = main();
