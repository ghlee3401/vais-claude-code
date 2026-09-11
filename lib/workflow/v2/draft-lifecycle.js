'use strict';

const fs = require('fs');
const path = require('path');
const { workItemDirectory } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');

function lexicalRelative(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target)).split(path.sep).join('/');
  return !relative || relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)
    ? null : relative;
}

function walkMarkdown(root, start, predicate, output, options = {}) {
  if (!fs.existsSync(start)) return;
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    const target = path.join(start, entry.name);
    if (entry.isSymbolicLink()) {
      if (options.includeSymbolicLinks && predicate(entry.name, target)) {
        const relative = lexicalRelative(root, target);
        if (relative) output.push(relative);
      }
      continue;
    }
    if (entry.isDirectory()) walkMarkdown(root, target, predicate, output, options);
    else if (entry.isFile() && predicate(entry.name, target)) {
      const relative = normalizeRelative(root, target);
      if (relative) output.push(relative);
    }
  }
}

function findTransientDrafts(projectRoot, item) {
  const root = path.resolve(projectRoot);
  const found = [];
  const options = { includeSymbolicLinks: true };
  walkMarkdown(root, path.join(root, '.vais'), name => /^draft.*\.md$/i.test(name), found, options);
  walkMarkdown(root, path.join(root, 'docs'), name => /^draft\.md$/i.test(name), found, options);
  return [...new Set(found)].sort();
}

function promotedDraftPaths(projectRoot, item, bodyFile) {
  const root = path.resolve(projectRoot);
  const paths = [];
  if (bodyFile) {
    const target = path.resolve(root, bodyFile);
    const relative = normalizeRelative(root, target);
    if (relative && relative.startsWith('.vais/') && /\.md$/i.test(relative) &&
      fs.existsSync(target) && !fs.lstatSync(target).isSymbolicLink()) paths.push(relative);
  }
  const workItemRoot = workItemDirectory(root, item);
  walkMarkdown(root, workItemRoot, name => /^draft\.md$/i.test(name), paths);
  return [...new Set(paths)].sort();
}

function cleanupPromotedDrafts(projectRoot, item, bodyFile) {
  const root = path.resolve(projectRoot);
  const snapshots = [];
  for (const relative of promotedDraftPaths(root, item, bodyFile)) {
    const target = path.resolve(root, relative);
    const previous = fs.readFileSync(target);
    fs.unlinkSync(target);
    snapshots.push({ filePath: target, previous });
  }
  return snapshots;
}

function transientDraftCheck(projectRoot, item) {
  const found = findTransientDrafts(projectRoot, item);
  return {
    check: 'transient-drafts',
    execution: 'succeeded',
    verdict: found.length ? 'fail' : 'pass',
    required: true,
    scope: [normalizeRelative(projectRoot, workItemDirectory(projectRoot, item))].filter(Boolean),
    requirements: ['REQ-025'],
    summary: found.length ? `${found.length} transient draft Markdown file(s) remain` : 'No transient draft Markdown remains',
    findings: found.map(file => `Remove transient draft before Report completion: ${file}`),
    evidence: found,
  };
}

module.exports = { findTransientDrafts, promotedDraftPaths, cleanupPromotedDrafts, transientDraftCheck };
