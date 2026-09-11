'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { scanWorkItemRoots } = require('./document-manager');

const STOP_WORDS = new Set(['기능', '작업', '수정', '추가', '만들어줘', '해주세요', 'the', 'a', 'an', 'to', 'for']);

function tokenize(value) {
  return [...new Set(String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token)))];
}

function overlapScore(left, right) {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  let score = 0;
  for (const token of a) if (b.has(token)) score += 1;
  return score;
}

function scanLegacyPlans(projectRoot) {
  const docs = path.join(path.resolve(projectRoot), 'docs');
  if (!fs.existsSync(docs)) return [];
  const results = [];
  for (const featureDir of fs.readdirSync(docs, { withFileTypes: true })) {
    if (!featureDir.isDirectory() || ['work-items', 'features'].includes(featureDir.name)) continue;
    const planPath = path.join(docs, featureDir.name, '01-plan', 'main.md');
    if (!fs.existsSync(planPath)) continue;
    const parsed = matter(fs.readFileSync(planPath, 'utf8'));
    results.push({
      kind: 'legacy',
      id: parsed.data.feature || featureDir.name,
      title: parsed.data.summary || featureDir.name,
      primaryFeature: parsed.data.feature || featureDir.name,
      affectedFeatures: [],
      status: 'legacy',
      path: planPath,
    });
  }
  return results;
}

function searchRelatedWork(projectRoot, query, options = {}) {
  const current = scanWorkItemRoots(projectRoot).map(row => ({
    kind: 'work-item',
    id: row.data.id,
    title: row.data.title,
    primaryFeature: row.data.primary_feature,
    affectedFeatures: row.data.affected_features || [],
    status: row.data.status,
    path: row.path,
  }));
  const candidates = [...current, ...scanLegacyPlans(projectRoot)];
  const featureHint = options.primaryFeature || '';
  return candidates.map(candidate => {
    let score = overlapScore(query, `${candidate.title} ${candidate.primaryFeature} ${candidate.affectedFeatures.join(' ')}`);
    if (featureHint && candidate.primaryFeature === featureHint) score += 10;
    if (featureHint && candidate.affectedFeatures.includes(featureHint)) score += 5;
    return { ...candidate, score };
  })
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, options.limit || 5);
}

module.exports = { tokenize, overlapScore, scanLegacyPlans, searchRelatedWork };
