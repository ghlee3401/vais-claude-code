'use strict';

const { validateContract } = require('./contracts');
const { loadRoleCatalog, resolveRole, buildRolePrompt } = require('./role-registry');
const { scopeWithin } = require('./write-policy');
const { WorkItemStore } = require('./work-item-store');

function extractAssignmentWrapper(prompt) {
  const text = String(prompt || '').trim().slice(0, 256 * 1024);
  try {
    const exact = JSON.parse(text);
    if (exact?.rolePrompt && exact?.assignment && exact?.assignmentReceipt) return exact;
  } catch (_) { /* Look for one embedded runtime envelope. */ }
  const matches = [];
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== '{') continue;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') quoted = false;
        continue;
      }
      if (character === '"') quoted = true;
      else if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            const candidate = JSON.parse(text.slice(start, index + 1));
            if (candidate?.rolePrompt && candidate?.assignment && candidate?.assignmentReceipt) matches.push(candidate);
          } catch (_) { /* Not the assignment envelope. */ }
          break;
        }
      }
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

function extractAssignmentId(prompt) {
  const matches = String(prompt || '').match(/\bAS-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi) || [];
  const unique = [...new Set(matches.map(value => value.toLowerCase()))];
  return unique.length === 1 ? matches.find(value => value.toLowerCase() === unique[0]) : null;
}

function authorizeAgentInput(toolInput, authorization, projectRoot) {
  if (!authorization) return { allowed: false, reason: 'A managed /vais authorization is required for Agent delegation' };
  const type = String(toolInput?.subagent_type || toolInput?.agent || '');
  if (!(type === 'v2-specialist' || type.endsWith(':v2-specialist'))) {
    return { allowed: false, reason: 'v2 enforce mode allows only the v2-specialist runtime agent' };
  }
  const store = new WorkItemStore(projectRoot);
  let wrapper = extractAssignmentWrapper(toolInput?.prompt);
  if (!wrapper) {
    const assignmentId = extractAssignmentId(toolInput?.prompt);
    const stored = assignmentId && authorization.workItemId
      ? store.getAssignmentEnvelope(authorization.workItemId, assignmentId)
      : null;
    if (stored) {
      const storedRole = resolveRole(loadRoleCatalog(), stored.assignment.role);
      if (storedRole?.kind === 'role') {
        wrapper = { rolePrompt: buildRolePrompt(storedRole.role), ...stored };
      }
    }
  }
  if (!wrapper) return { allowed: false, reason: 'v2-specialist prompt must reference exactly one current assignment receipt or contain its full JSON envelope' };
  if (!wrapper?.rolePrompt || !wrapper?.assignment || !wrapper?.assignmentReceipt) {
    return { allowed: false, reason: 'Runtime role prompt, assignment, and issued receipt are required' };
  }
  const validation = validateContract('specialistAssignment', wrapper.assignment);
  if (!validation.valid) return { allowed: false, reason: `Invalid specialist assignment: ${validation.errors.join('; ')}` };
  const assignment = wrapper.assignment;
  if (!projectRoot || !authorization.workItemId ||
    !store.verifyAssignmentReceipt(
      authorization.workItemId, wrapper.assignmentReceipt, assignment)) {
    return { allowed: false, reason: 'Assignment lacks a matching runtime issuance receipt' };
  }
  if (assignment.phase !== authorization.phase) return { allowed: false, reason: 'Assignment phase does not match session authorization' };
  const resolved = resolveRole(loadRoleCatalog(), assignment.role);
  if (!resolved || resolved.kind !== 'role' || resolved.role.kind === 'c-level') {
    return { allowed: false, reason: 'Assignment role is not an eligible specialist' };
  }
  if (wrapper.rolePrompt !== buildRolePrompt(resolved.role)) return { allowed: false, reason: 'Runtime role prompt does not match the role registry' };
  if (!(resolved.role.delegatedBy || []).includes(assignment.delegatedBy)) return { allowed: false, reason: 'Delegation owner is not allowed' };
  if (!(resolved.role.modes || []).includes(assignment.mode)) return { allowed: false, reason: 'Role mode is not allowed' };
  if (assignment.role === 'independent-qa' &&
    (assignment.phase !== 'review' || assignment.mode !== 'verification' || assignment.codeWrite)) {
    return { allowed: false, reason: 'Independent QA must be read-only Review verification' };
  }
  if (assignment.codeWrite) {
    if (assignment.phase !== 'do' || assignment.mode !== 'implementation') {
      return { allowed: false, reason: 'Code write requires Do implementation mode' };
    }
    if (assignment.writeScope.length === 0 || assignment.writeScope.some(scope =>
      !authorization.allowedPaths.some(parent => scopeWithin(scope, parent)))) {
      return { allowed: false, reason: 'Assignment write scope exceeds session authorization' };
    }
  } else if (assignment.writeScope.length > 0) {
    return { allowed: false, reason: 'Read-only assignment declares write paths' };
  }
  const canonicalPrompt = JSON.stringify(wrapper);
  return {
    allowed: true,
    kind: 'v2-specialist',
    wrapper,
    updatedInput: String(toolInput?.prompt || '').trim() === canonicalPrompt
      ? null
      : { ...toolInput, prompt: canonicalPrompt },
  };
}

module.exports = { extractAssignmentWrapper, extractAssignmentId, authorizeAgentInput };
