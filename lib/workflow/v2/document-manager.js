'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const { normalizeRelative } = require('./write-policy');

const PHASE_FOLDERS = Object.freeze({
  plan: '01-plan',
  design: '02-design',
  do: '03-do',
  review: '04-review',
  report: '05-report',
});

function workItemDirectory(projectRoot, item) {
  const topFeature = String(item.primaryFeature || '').split('/')[0];
  const folder = String(item.id || '').replace(/^WI-/, '');
  if (!topFeature || !folder) throw new Error('Work item feature and id are required');
  return path.join(path.resolve(projectRoot), 'docs', 'work-items', topFeature, folder);
}

function atomicWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(temp, content, 'utf8');
    fs.renameSync(temp, filePath);
  } catch (error) {
    try { fs.unlinkSync(temp); } catch (_) { /* best-effort temp cleanup */ }
    throw error;
  }
}

function serialize(data, body) {
  const frontmatter = yaml.dump(data, { lineWidth: -1, noRefs: true }).trimEnd();
  return `---\n${frontmatter}\n---\n\n${String(body || '').trim()}\n`;
}

function parseDocument(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return matter(fs.readFileSync(filePath, 'utf8'));
}

function documentState(item) {
  return {
    schema: 'vais-work-item/v1',
    id: item.id,
    title: item.title,
    primary_feature: item.primaryFeature,
    affected_features: item.affectedFeatures,
    scale: item.scale,
    phase: item.phase,
    status: item.status,
    plan_revision: item.planRevision,
    design_revision: item.designRevision,
    write_scopes: item.writeScopes,
    readiness_checks: item.readinessChecks,
    review_checks: item.reviewChecks,
    required_specialists: item.requiredSpecialists,
    readiness_not_ready_count: item.readinessNotReadyCount,
    qa_repair_count: item.qaRepairCount,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    approvals: item.approvals,
    report_frozen: item.reportFrozen,
  };
}

function writeWorkItemRoot(projectRoot, item, body) {
  const filePath = path.join(workItemDirectory(projectRoot, item), 'main.md');
  if (!normalizeRelative(projectRoot, filePath)) throw new Error('Work item path escapes the project through a symbolic link');
  const previous = parseDocument(filePath);
  if (previous?.data?.report_frozen === true) throw new Error('Completed Work item root is frozen');
  atomicWrite(filePath, serialize(documentState(item), body));
  return filePath;
}

function syncWorkItemRoot(projectRoot, item) {
  const filePath = path.join(workItemDirectory(projectRoot, item), 'main.md');
  const previous = parseDocument(filePath);
  const body = previous?.content?.trim() || [
    `# ${item.id} — ${item.title}`,
    '',
    '## Summary',
    '',
    'This Work item is managed by the VAIS workflow state machine.',
  ].join('\n');
  return writeWorkItemRoot(projectRoot, item, body);
}

function preparePhaseDocument(projectRoot, item, phase, body, options = {}) {
  const folder = PHASE_FOLDERS[phase];
  if (!folder) throw new Error(`Unknown phase: ${phase}`);
  const phaseDir = path.join(workItemDirectory(projectRoot, item), folder);
  const filePath = path.join(phaseDir, 'main.md');
  if (!normalizeRelative(projectRoot, filePath)) throw new Error('Phase document path escapes the project through a symbolic link');
  const previous = parseDocument(filePath);
  if (phase === 'report' && (item.reportFrozen || previous?.data?.frozen === true)) {
    throw new Error('Completed Report is immutable');
  }

  let revision = previous?.data?.revision || 1;
  if (previous && options.materialChange === true && previous.data.status === 'approved') {
    revision += 1;
  }
  const data = {
    schema: 'vais-phase/v1',
    work_item: item.id,
    phase,
    revision,
    status: options.status || 'draft',
    based_on: [...(options.basedOn || [])],
  };
  const budgetException = options.budgetException || previous?.data?.budget_exception;
  if (budgetException) {
    data.budget_exception = typeof budgetException === 'object' ? budgetException : {
      reason: String(budgetException),
      approved_by: options.budgetApprovedBy || previous?.data?.budget_exception_approved_by || null,
    };
  }
  if (phase === 'report' && options.frozen === true) data.frozen = true;
  return {
    filePath,
    phaseDir,
    revision,
    data,
    body: String(body || ''),
    markdown: serialize(data, body),
    previous,
    materialChange: options.materialChange === true,
  };
}

function writePreparedPhaseDocument(prepared) {
  if (!prepared || !prepared.filePath || !prepared.data || typeof prepared.markdown !== 'string') {
    throw new Error('Prepared phase document is invalid');
  }
  if (prepared.previous && prepared.materialChange === true && prepared.previous.data.status === 'approved') {
    const revisionDir = path.join(prepared.phaseDir, 'revisions');
    const snapshot = path.join(revisionDir, `v${prepared.revision - 1}.md`);
    if (!fs.existsSync(snapshot)) atomicWrite(snapshot, fs.readFileSync(prepared.filePath, 'utf8'));
  }
  atomicWrite(prepared.filePath, prepared.markdown);
  return { filePath: prepared.filePath, revision: prepared.revision };
}

function writePhaseDocument(projectRoot, item, phase, body, options = {}) {
  return writePreparedPhaseDocument(preparePhaseDocument(projectRoot, item, phase, body, options));
}

function scanWorkItemRoots(projectRoot) {
  const base = path.join(path.resolve(projectRoot), 'docs', 'work-items');
  if (!fs.existsSync(base)) return [];
  const results = [];
  function walk(directory, depth) {
    if (depth > 3) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      if (entry.isFile() && entry.name === 'main.md') {
        const parsed = parseDocument(full);
        if (parsed?.data?.schema === 'vais-work-item/v1') results.push({ path: full, data: parsed.data });
      }
    }
  }
  walk(base, 0);
  return results;
}

function formatIndexDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? '');
}

function renderMaster(projectRoot) {
  const root = path.resolve(projectRoot);
  const rows = scanWorkItemRoots(root)
    .sort((a, b) => formatIndexDate(b.data.updated_at).localeCompare(formatIndexDate(a.data.updated_at)));
  const current = rows.find(row => ['active', 'waiting-user', 'blocked'].includes(row.data.status));
  const lines = ['# VAIS Features and Work Items', '', '> Generated index. Work item frontmatter is canonical.', ''];
  lines.push('## Current Work Item', '');
  lines.push(current
    ? `- [${current.data.title}](${path.relative(path.join(root, 'docs'), current.path).split(path.sep).join('/')}) — ${current.data.phase}/${current.data.status}`
    : '- 없음');
  lines.push('', '## All Work Items', '', '| Work item | 범위 · Feature | Phase | Status | Updated |', '|---|---|---|---|---|');
  for (const row of rows) {
    const relative = path.relative(path.join(root, 'docs'), row.path).split(path.sep).join('/');
    lines.push(`| [${row.data.id} — ${row.data.title}](${relative}) | ${row.data.primary_feature} | ${row.data.phase} | ${row.data.status} | ${formatIndexDate(row.data.updated_at)} |`);
  }
  return `${lines.join('\n')}\n`;
}

function featureIds(item) {
  return [...new Set([item.primaryFeature, ...(item.affectedFeatures || [])].filter(Boolean))];
}

function featureIndexPath(projectRoot, feature) {
  if (!/^[a-z0-9][a-z0-9/-]*$/.test(feature) || feature.includes('..')) throw new Error(`Invalid Feature id: ${feature}`);
  return path.join(path.resolve(projectRoot), 'docs', 'features', ...feature.split('/'), 'main.md');
}

function renderFeature(projectRoot, feature) {
  const root = path.resolve(projectRoot);
  const rows = scanWorkItemRoots(root)
    .filter(row => row.data.primary_feature === feature || (row.data.affected_features || []).includes(feature))
    .sort((a, b) => formatIndexDate(b.data.updated_at).localeCompare(formatIndexDate(a.data.updated_at)));
  const lines = [
    '---',
    'schema: vais-feature/v1',
    `id: ${feature}`,
    '---',
    '',
    `# ${feature}`,
    '',
    '| Work item | Relationship | Phase | Status |',
    '|---|---|---|---|',
  ];
  for (const row of rows) {
    const target = featureIndexPath(root, feature);
    const relative = path.relative(path.dirname(target), row.path).split(path.sep).join('/');
    const relationship = row.data.primary_feature === feature ? 'primary' : 'affected';
    lines.push(`| [${row.data.id} — ${row.data.title}](${relative}) | ${relationship} | ${row.data.phase} | ${row.data.status} |`);
  }
  return `${lines.join('\n')}\n`;
}

function writeFeatureIndexes(projectRoot, item) {
  return featureIds(item).map(feature => {
    const filePath = featureIndexPath(projectRoot, feature);
    if (!normalizeRelative(projectRoot, filePath)) throw new Error('Feature index path escapes the project through a symbolic link');
    atomicWrite(filePath, renderFeature(projectRoot, feature));
    return filePath;
  });
}

function checkReportArtifacts(projectRoot, item) {
  const findings = [];
  const paths = [path.join(path.resolve(projectRoot), 'docs', 'README.md'),
    ...featureIds(item).map(feature => featureIndexPath(projectRoot, feature))];
  for (const filePath of paths) {
    if (!fs.existsSync(filePath)) {
      findings.push(`Generated index is missing: ${path.relative(projectRoot, filePath)}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(item.id)) findings.push(`Generated index does not link ${item.id}: ${path.relative(projectRoot, filePath)}`);
  }
  return {
    check: 'report-indexes',
    execution: 'succeeded',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: paths.map(file => path.relative(projectRoot, file).split(path.sep).join('/')),
    requirements: ['REQ-009'],
    summary: findings.length === 0 ? 'Feature and Master indexes link the Work item' : `${findings.length} report index issue(s) found`,
    findings,
    evidence: paths.map(file => path.relative(projectRoot, file).split(path.sep).join('/')),
  };
}

function writeMaster(projectRoot) {
  const filePath = path.join(path.resolve(projectRoot), 'docs', 'README.md');
  if (!normalizeRelative(projectRoot, filePath)) throw new Error('Master document path escapes the project through a symbolic link');
  atomicWrite(filePath, renderMaster(projectRoot));
  return filePath;
}

module.exports = {
  PHASE_FOLDERS,
  workItemDirectory,
  atomicWrite,
  serialize,
  parseDocument,
  documentState,
  writeWorkItemRoot,
  syncWorkItemRoot,
  preparePhaseDocument,
  writePreparedPhaseDocument,
  writePhaseDocument,
  scanWorkItemRoots,
  renderMaster,
  writeMaster,
  featureIds,
  featureIndexPath,
  renderFeature,
  writeFeatureIndexes,
  checkReportArtifacts,
};
