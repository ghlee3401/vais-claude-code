'use strict';

const fs = require('fs');
const path = require('path');

function loadRoleCatalog(pluginRoot = path.resolve(__dirname, '../../..')) {
  const filePath = path.join(path.resolve(pluginRoot), 'contracts', 'v2-role-cards.json');
  const catalog = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (catalog.schemaVersion !== '1.0' || !Array.isArray(catalog.roles)) throw new Error('Invalid v2 role catalog');
  const names = new Set();
  for (const role of catalog.roles) {
    if (!role.name || names.has(role.name)) throw new Error(`Duplicate or missing role: ${role.name}`);
    names.add(role.name);
    for (const field of ['kind', 'responsibility', 'escalation']) {
      if (!role[field]) throw new Error(`${role.name}: missing ${field}`);
    }
  }
  return catalog;
}

function resolveRole(catalog, name) {
  const role = catalog.roles.find(candidate => candidate.name === name);
  if (role) return { kind: 'role', target: name, role, alias: false };
  const alias = catalog.aliases?.[name];
  if (!alias) return null;
  if (alias.kind === 'tool') return { ...alias, alias: true };
  const target = catalog.roles.find(candidate => candidate.name === alias.target);
  if (!target) throw new Error(`Alias target is missing: ${name} -> ${alias.target}`);
  return { kind: 'role', target: alias.target, role: target, alias: true };
}

function buildRolePrompt(role) {
  return [
    `Responsibility: ${role.responsibility}`,
    `Boundaries: ${(role.boundaries || []).join('; ')}`,
    `Quality bar: ${(role.qualityBar || []).join('; ')}`,
    `Escalation: ${role.escalation}`,
  ].join('\n');
}

module.exports = { loadRoleCatalog, resolveRole, buildRolePrompt };
