'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathMatches } = require('./write-policy');

function changedFiles(projectRoot) {
  try {
    const output = execFileSync('git', ['ls-files', '-m', '-d', '-o', '--exclude-standard', '-z'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return [...new Set(output.split('\0').filter(Boolean))]
      .filter(file => !file.startsWith('.vais/') && !file.startsWith('node_modules/'))
      .sort();
  } catch (_) {
    const files = [];
    function walk(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (['.git', '.vais', 'node_modules'].includes(entry.name)) continue;
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(projectRoot, full).split(path.sep).join('/'));
      }
    }
    walk(projectRoot);
    return files.sort();
  }
}

function fingerprint(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) return `link:${fs.readlinkSync(filePath)}`;
    if (!stat.isFile()) return `other:${stat.mode}`;
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch (_) {
    return 'deleted';
  }
}

function captureRepoSnapshot(projectRoot) {
  const root = path.resolve(projectRoot);
  const files = {};
  for (const relative of changedFiles(root)) files[relative] = fingerprint(path.join(root, relative));
  let head = null;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) { /* An unborn repository has no HEAD. */ }
  return { head, files, capturedAt: new Date().toISOString() };
}

function diffSnapshots(before, after) {
  if (!before) return [];
  const keys = new Set([...Object.keys(before.files || {}), ...Object.keys(after.files || {})]);
  const changed = [...keys].filter(key => before.files?.[key] !== after.files?.[key]);
  if (before.head !== after.head) changed.push('@repo-head');
  return [...new Set(changed)].sort();
}

function classifyDrift(paths, workItem) {
  if (paths.some(file => file.includes('/01-plan/') || /(?:^|\/)01-plan\//.test(file))) return 'requirement-change';
  const scopes = workItem.writeScopes || [];
  if (paths.length > 0 && paths.every(file => scopes.some(scope => pathMatches(file, scope)))) return 'within-design';
  return 'new-surface';
}

function scopedSnapshotDigest(projectRoot, scopes) {
  const snapshot = captureRepoSnapshot(projectRoot);
  const files = Object.fromEntries(Object.entries(snapshot.files || {})
    .filter(([file]) => (scopes || []).some(scope => pathMatches(file, scope)))
    .sort(([left], [right]) => left.localeCompare(right)));
  return crypto.createHash('sha256').update(JSON.stringify({ head: snapshot.head, files })).digest('hex');
}

module.exports = { changedFiles, captureRepoSnapshot, diffSnapshots, classifyDrift, scopedSnapshotDigest };
