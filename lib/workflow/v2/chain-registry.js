'use strict';

const fs = require('fs');
const path = require('path');
const { assertContract } = require('./contracts');

const CONTRACTS_DIR = path.join(__dirname, '..', '..', '..', 'contracts');
let cache = null;

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, file), 'utf8'));
}

// Both catalogs are data: adding a stage or a kind never requires code changes.
function loadChainCatalog(options = {}) {
  if (cache && !options.reload) return cache;
  const stages = assertContract('chainStages', loadJson('chain-stages.json'));
  const kinds = assertContract('workKinds', loadJson('work-kinds.json'));
  const orders = stages.stages.map(stage => stage.order).sort((left, right) => left - right);
  orders.forEach((order, index) => {
    if (order !== index + 1) throw new Error('chain-stages.json orders must be 1..N without gaps');
  });
  const prefixes = new Set();
  for (const stage of stages.stages) {
    if (prefixes.has(stage.idPrefix)) throw new Error(`Duplicate stage id prefix: ${stage.idPrefix}`);
    prefixes.add(stage.idPrefix);
  }
  for (const kind of kinds.kinds) {
    if (kind.stage && !stages.stages.some(stage => stage.id === kind.stage)) throw new Error(`Kind ${kind.id} references unknown stage ${kind.stage}`);
    if (kind.entryRequires && !stages.stages.some(stage => stage.id === kind.entryRequires)) throw new Error(`Kind ${kind.id} requires unknown stage ${kind.entryRequires}`);
  }
  cache = {
    productRoot: stages.productRoot,
    stages: [...stages.stages].sort((left, right) => left.order - right.order),
    kinds: kinds.kinds,
    defaultKind: kinds.defaultKind,
    legacyKind: kinds.legacyKind,
  };
  return cache;
}

function getStage(stageId) {
  return loadChainCatalog().stages.find(stage => stage.id === stageId) || null;
}

function stageByPrefix(prefix) {
  return loadChainCatalog().stages.find(stage => stage.idPrefix === prefix) || null;
}

function stageByOrder(order) {
  return loadChainCatalog().stages.find(stage => stage.order === order) || null;
}

function getKind(kindId) {
  return loadChainCatalog().kinds.find(kind => kind.id === kindId) || null;
}

function isKnownKind(kindId) {
  return Boolean(getKind(kindId));
}

// Work items created before kinds existed are the harness's own work.
function kindOf(item) {
  const catalog = loadChainCatalog();
  const id = item?.kind || catalog.legacyKind;
  return getKind(id) || getKind(catalog.legacyKind);
}

function isStageKind(kindOrId) {
  const kind = typeof kindOrId === 'string' ? getKind(kindOrId) : kindOrId;
  return Boolean(kind?.stage);
}

function stageOfKind(kindOrId) {
  const kind = typeof kindOrId === 'string' ? getKind(kindOrId) : kindOrId;
  return kind?.stage ? getStage(kind.stage) : null;
}

function repairLimitOf(item) {
  return kindOf(item)?.repairLimit || 3;
}

// Deterministic kind suggestion from the request text: the longest matching trigger wins,
// otherwise the catalog default. The user still confirms the kind in the Plan.
function suggestKind(text) {
  const normalized = String(text || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
  let best = null;
  for (const kind of loadChainCatalog().kinds) {
    for (const trigger of kind.triggers || []) {
      const needle = trigger.toLowerCase();
      if (normalized.includes(needle) && (!best || needle.length > best.trigger.length)) best = { kind, trigger: needle };
    }
  }
  return best ? { kind: best.kind.id, trigger: best.trigger } : { kind: loadChainCatalog().defaultKind, trigger: null };
}

module.exports = {
  loadChainCatalog,
  getStage,
  stageByPrefix,
  stageByOrder,
  getKind,
  isKnownKind,
  kindOf,
  isStageKind,
  stageOfKind,
  repairLimitOf,
  suggestKind,
};
