#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPhaseContext, loadConfig } = require('../lib/paths');
const { measureFiles, measureText, summarizePhaseRun } = require('../lib/context-metrics');

const PHASE_DIRS = {
  ideation: '00-ideation',
  plan: '01-plan',
  design: '02-design',
  do: '03-do',
  qa: '04-qa',
  report: '05-report',
};

function listArtifactFiles(feature, phase, baseDir) {
  if (!feature || !PHASE_DIRS[phase]) return [];
  const dir = path.join(baseDir, 'docs', feature, PHASE_DIRS[phase]);
  try {
    return fs.readdirSync(dir)
      .filter(name => name.endsWith('.md'))
      .map(name => path.relative(baseDir, path.join(dir, name)));
  } catch (_) {
    return [];
  }
}

function readAgentEvents(baseDir, role, phase, feature) {
  const logPath = path.join(baseDir, '.vais', 'event-log.jsonl');
  let entries = [];
  try {
    entries = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); } catch (_) { return null; }
      })
      .filter(Boolean);
  } catch (_) {
    return { count: 0, startedAt: null, endedAt: null };
  }

  const starts = entries.filter(entry =>
    entry.event === 'agent_start' &&
    (!phase || entry.phase === phase) &&
    (!feature || !entry.feature || entry.feature === feature)
  );
  const startedRoles = new Set(starts.map(entry => entry.role));
  const stops = entries.filter(entry =>
    entry.event === 'agent_stop' &&
    startedRoles.has(entry.role) &&
    (!feature || !entry.feature || entry.feature === feature)
  );
  return {
    count: starts.length,
    startedAt: starts[0]?.ts || null,
    endedAt: stops[stops.length - 1]?.ts || null,
  };
}

function buildReport(role, phase, feature, baseDir = process.cwd()) {
  const fixedPaths = [
    'skills/vais/SKILL.md',
    `skills/vais/phases/${role}.md`,
    `agents/${role}/${role}.md`,
  ];
  const compact = getPhaseContext(role, phase);
  const full = loadConfig();
  const compactMetric = measureText(JSON.stringify(compact));
  const fullMetric = measureText(JSON.stringify(full));
  const artifactFiles = listArtifactFiles(feature, phase, baseDir);
  const events = readAgentEvents(baseDir, role, phase, feature);
  const phaseRun = summarizePhaseRun({
    role,
    phase,
    feature,
    startedAt: events.startedAt,
    endedAt: events.endedAt,
    readFiles: fixedPaths,
    agentCalls: events.count,
    artifactFiles,
    baseDir,
  });

  return {
    generatedAt: new Date().toISOString(),
    role,
    phase,
    feature: feature || null,
    fixedContext: measureFiles(fixedPaths, baseDir),
    configContext: {
      mode: compact?._contextView?.mode || 'unknown',
      full: fullMetric,
      phaseView: compactMetric,
      byteReduction: Math.max(0, fullMetric.bytes - compactMetric.bytes),
      reductionRate: fullMetric.bytes === 0
        ? 0
        : Number(((fullMetric.bytes - compactMetric.bytes) / fullMetric.bytes).toFixed(4)),
    },
    phaseRun,
  };
}

function main(argv = process.argv.slice(2)) {
  const [role = 'cto', phase = 'plan', feature = ''] = argv;
  const report = buildReport(role, phase, feature);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { buildReport, listArtifactFiles, readAgentEvents, main };
