'use strict';

const fs = require('fs');
const path = require('path');

function measureText(text) {
  const value = String(text ?? '');
  const bytes = Buffer.byteLength(value, 'utf8');
  return {
    bytes,
    lines: value.length === 0 ? 0 : value.split(/\r?\n/).length,
    estimatedTokens: Math.ceil(bytes / 4),
  };
}

function measureFiles(filePaths, baseDir = process.cwd()) {
  const files = [];
  for (const filePath of filePaths || []) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.join(baseDir, filePath);
    try {
      const content = fs.readFileSync(resolved, 'utf8');
      files.push({ path: filePath, ...measureText(content) });
    } catch (_) {
      files.push({ path: filePath, missing: true, bytes: 0, lines: 0, estimatedTokens: 0 });
    }
  }
  return {
    files,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    totalLines: files.reduce((sum, file) => sum + file.lines, 0),
    estimatedTokens: files.reduce((sum, file) => sum + file.estimatedTokens, 0),
  };
}

function summarizePhaseRun({
  role,
  phase,
  feature,
  startedAt,
  endedAt,
  readFiles = [],
  agentCalls = 0,
  artifactFiles = [],
  baseDir = process.cwd(),
} = {}) {
  const startMs = startedAt ? new Date(startedAt).getTime() : NaN;
  const endMs = endedAt ? new Date(endedAt).getTime() : NaN;
  return {
    role: role || null,
    phase: phase || null,
    feature: feature || null,
    elapsedMs: Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, endMs - startMs) : null,
    agentCalls: Number(agentCalls) || 0,
    inputContext: measureFiles(readFiles, baseDir),
    artifacts: measureFiles(artifactFiles, baseDir),
    tokenMetric: 'estimated from UTF-8 bytes / 4; not provider billing tokens',
  };
}

module.exports = { measureText, measureFiles, summarizePhaseRun };
