'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const stateStore = require('../../core/state-store');
const { assertContract } = require('./contracts');
const {
  atomicWrite, syncWorkItemRoot, workItemDirectory, featureIds, featureIndexPath,
  writeFeatureIndexes, writeMaster, parseDocument, writePhaseDocument, PHASE_FOLDERS,
} = require('./document-manager');
const {
  SLOT_HOLDING_STATUSES,
  EVENTS,
  createInitialWorkItem,
  transition,
  normalizeWriteScopes,
} = require('./state-machine');
const { scopeWithin } = require('./write-policy');
const { DEFAULT_LEASE_MS, loadWorkflowConfig } = require('./config');
const ledger = require('./ledger');
const { productNotePaths, writeProductNote } = require('./product-note');

function emptyRegistry() {
  return {
    schemaVersion: '1.0',
    currentWorkItemId: null,
    workItems: {},
    pendingRequests: [],
    leases: {},
    repoSnapshots: {},
    checkReceipts: {},
    checkExecutions: {},
    assignments: {},
    driftAlerts: [],
    events: [],
  };
}

function sanitizeRegistry(value) {
  if (!value || value.schemaVersion !== '1.0') return emptyRegistry();
  return {
    ...emptyRegistry(),
    ...value,
    workItems: value.workItems || {},
    pendingRequests: value.pendingRequests || [],
    leases: value.leases || {},
    repoSnapshots: value.repoSnapshots || {},
    checkReceipts: value.checkReceipts || {},
    checkExecutions: value.checkExecutions || {},
    assignments: value.assignments || {},
    driftAlerts: value.driftAlerts || [],
    events: value.events || [],
  };
}

function redactRequestText(rawText) {
  let text = String(rawText || '');
  const fields = [];
  const patterns = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi],
    ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g],
    ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi],
    ['credential', /\b(password|passwd|secret|token|api[_ -]?key)\s*[:=]\s*[^\s,;]+/gi],
  ];
  for (const [kind, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;
    fields.push(kind);
    pattern.lastIndex = 0;
    text = text.replace(pattern, `[REDACTED:${kind}]`);
  }
  return { text, redactionApplied: fields.length > 0, redactedFields: unique(fields) };
}

function unique(values) {
  return [...new Set(values)];
}

function makeEvent(workItemId, type, outcome, timestamp, details = {}) {
  return {
    id: crypto.randomUUID(),
    workItemId,
    type,
    outcome,
    timestamp: new Date(timestamp || Date.now()).toISOString(),
    details,
  };
}

function phaseOwner(phase) {
  return { plan: 'cpo', design: 'cto', do: 'cto', review: 'independent-qa', report: 'ceo' }[phase] || 'ceo';
}

class WorkItemStore {
  constructor(projectRoot, options = {}) {
    if (!projectRoot) throw new Error('projectRoot is required');
    this.projectRoot = path.resolve(projectRoot);
    this.statePath = options.statePath || path.join(this.projectRoot, '.vais', 'v2', 'work-items.json');
    this.leaseMs = options.leaseMs || loadWorkflowConfig(this.projectRoot).leaseMs || DEFAULT_LEASE_MS;
  }

  ensureStateDir() {
    fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
  }

  readRegistry() {
    return sanitizeRegistry(stateStore.read(this.statePath));
  }

  list() {
    return Object.values(this.readRegistry().workItems);
  }

  get(id) {
    return this.readRegistry().workItems[id] || null;
  }

  getCurrent() {
    const registry = this.readRegistry();
    return registry.currentWorkItemId ? registry.workItems[registry.currentWorkItemId] || null : null;
  }

  create(input, timestamp) {
    const created = createInitialWorkItem(input, timestamp);
    assertContract('workItem', created);
    this.ensureStateDir();
    const rootPath = path.join(workItemDirectory(this.projectRoot, created), 'main.md');
    const previousRoot = fs.existsSync(rootPath) ? fs.readFileSync(rootPath) : null;
    let rootWritten = false;
    try {
      const registry = stateStore.lockedUpdate(this.statePath, raw => {
        const registry = sanitizeRegistry(raw);
        const current = registry.currentWorkItemId && registry.workItems[registry.currentWorkItemId];
        if (current && SLOT_HOLDING_STATUSES.has(current.status)) {
          const error = new Error(`Work item slot is occupied by ${current.id}`);
          error.code = 'WORK_ITEM_SLOT_OCCUPIED';
          throw error;
        }
        if (registry.workItems[created.id]) throw new Error(`Work item already exists: ${created.id}`);
        syncWorkItemRoot(this.projectRoot, created);
        rootWritten = true;
        registry.workItems[created.id] = created;
        registry.currentWorkItemId = created.id;
        registry.events.push(makeEvent(created.id, 'work-item.created', 'succeeded', timestamp, {
          orchestrator: 'ceo', phaseOwner: 'cpo',
        }));
        return registry;
      });
      return registry.workItems[created.id];
    } catch (error) {
      if (rootWritten) this.restoreRoot(rootPath, previousRoot);
      throw error;
    }
  }

  apply(id, event, payload = {}, options = {}) {
    const timestamp = options.timestamp;
    this.ensureStateDir();
    let rootPath = null;
    let previousRoot = null;
    let rootWritten = false;
    let auxiliarySnapshots = [];
    let phaseSnapshot = null;
    try {
      const updated = stateStore.lockedUpdate(this.statePath, raw => {
        const registry = sanitizeRegistry(raw);
        const current = registry.workItems[id];
        if (!current) throw new Error(`Unknown work item: ${id}`);

        if (event === EVENTS.USER_RESUME) {
          const occupant = registry.currentWorkItemId && registry.workItems[registry.currentWorkItemId];
          if (occupant && occupant.id !== id && SLOT_HOLDING_STATUSES.has(occupant.status)) {
            const error = new Error(`Work item slot is occupied by ${occupant.id}`);
            error.code = 'WORK_ITEM_SLOT_OCCUPIED';
            throw error;
          }
        }
        if (options.requireLease) this.assertLease(registry, id, options.sessionId, timestamp);

        const next = transition(current, event, payload, timestamp);
        if (event === EVENTS.USER_RESUME && options.acquireLeaseSessionId) {
          const now = new Date(timestamp || Date.now()).getTime();
          const existing = registry.leases[id];
          if (existing && Date.parse(existing.expiresAt) > now && existing.sessionId !== options.acquireLeaseSessionId) {
            const error = new Error(`Mutation lease is held by another session for ${id}`);
            error.code = 'LEASE_HELD';
            throw error;
          }
          registry.leases[id] = {
            sessionId: options.acquireLeaseSessionId,
            acquiredAt: new Date(now).toISOString(),
            expiresAt: new Date(now + this.leaseMs).toISOString(),
          };
        }
        const phaseDocumentUpdates = {
          [EVENTS.USER_PLAN_APPROVED]: { phase: 'plan', status: 'approved' },
          [EVENTS.USER_DESIGN_APPROVED]: { phase: 'design', status: 'approved' },
          [EVENTS.USER_FINAL_APPROVED]: { phase: 'review', status: 'approved' },
          [EVENTS.REPORT_VALIDATED]: { phase: 'report', status: 'completed', frozen: true },
        };
        const phaseUpdate = phaseDocumentUpdates[event];
        if (phaseUpdate) {
          const phasePath = path.join(workItemDirectory(this.projectRoot, current), PHASE_FOLDERS[phaseUpdate.phase], 'main.md');
          const parsed = parseDocument(phasePath);
          if (!parsed) throw new Error(`Canonical ${phaseUpdate.phase} document is required for ${event}`);
          phaseSnapshot = { filePath: phasePath, previous: fs.readFileSync(phasePath) };
          writePhaseDocument(this.projectRoot, current, phaseUpdate.phase, parsed.content, phaseUpdate);
        }
        rootPath = path.join(workItemDirectory(this.projectRoot, next), 'main.md');
        previousRoot = fs.existsSync(rootPath) ? fs.readFileSync(rootPath) : null;
        syncWorkItemRoot(this.projectRoot, next);
        rootWritten = true;
        if (next.status === 'completed') {
          const paths = [
            ...featureIds(next).map(feature => featureIndexPath(this.projectRoot, feature)),
            path.join(this.projectRoot, 'docs', 'README.md'),
            ...Object.values(productNotePaths(this.projectRoot)),
          ];
          auxiliarySnapshots = paths.map(filePath => ({
            filePath,
            previous: fs.existsSync(filePath) ? fs.readFileSync(filePath) : null,
          }));
          writeFeatureIndexes(this.projectRoot, next);
          writeMaster(this.projectRoot);
        }
        const repoSnapshot = options.repoSnapshotFactory
          ? options.repoSnapshotFactory()
          : options.repoSnapshot;
        registry.workItems[id] = next;
        if (SLOT_HOLDING_STATUSES.has(next.status)) {
          registry.currentWorkItemId = id;
        } else if (registry.currentWorkItemId === id) {
          registry.currentWorkItemId = null;
          delete registry.leases[id];
        }
        registry.events.push(makeEvent(id, event, 'succeeded', timestamp, {
          from: `${current.phase}/${current.status}`,
          to: `${next.phase}/${next.status}`,
          phaseOwner: phaseOwner(current.phase),
          ...(payload.gateResult ? {
            gate: payload.gateResult.gate,
            gateVerdict: payload.gateResult.verdict,
            requiredCheckCount: payload.gateResult.requiredChecks.length,
          } : {}),
        }));
        // Memory: the ledger line is written inside the same lock, before the registry is
        // saved. A transition that cannot be recorded does not happen.
        this.recordLedger(current, next, event, payload, options, timestamp);
        if (next.status === 'completed') writeProductNote(this.projectRoot, { registry });
        if (repoSnapshot) {
          registry.repoSnapshots[id] = repoSnapshot;
          registry.events.push(makeEvent(id, 'repo.snapshot.updated', 'succeeded', timestamp, {
            reason: options.snapshotReason || 'phase-transaction',
            changedPathCount: Number(options.snapshotChangedPathCount) || 0,
            ...(options.transactionId ? { transactionId: options.transactionId } : {}),
          }));
        }
        return registry;
      });
      return updated.workItems[id];
    } catch (error) {
      if (rootWritten) this.restoreRoot(rootPath, previousRoot);
      if (phaseSnapshot) this.restoreRoot(phaseSnapshot.filePath, phaseSnapshot.previous);
      for (const snapshot of auxiliarySnapshots.reverse()) this.restoreRoot(snapshot.filePath, snapshot.previous);
      this.recordFailedEvent(id, event, error, timestamp);
      throw error;
    }
  }

  applySequence(id, steps, options = {}) {
    if (!Array.isArray(steps) || steps.length === 0) throw new Error('Transaction steps are required');
    const timestamp = options.timestamp;
    this.ensureStateDir();
    let rootPath = null;
    let previousRoot = null;
    let rootWritten = false;
    try {
      const updated = stateStore.lockedUpdate(this.statePath, raw => {
        const registry = sanitizeRegistry(raw);
        const initial = registry.workItems[id];
        if (!initial) throw new Error(`Unknown work item: ${id}`);
        if (options.requireLease) this.assertLease(registry, id, options.sessionId, timestamp);
        let next = initial;
        const events = [];
        const transitions = [];
        for (const step of steps) {
          const current = next;
          next = transition(current, step.event, step.payload || {}, step.timestamp || timestamp);
          transitions.push({ current, next, step });
          events.push(makeEvent(id, step.event, 'succeeded', step.timestamp || timestamp, {
            from: `${current.phase}/${current.status}`,
            to: `${next.phase}/${next.status}`,
            phaseOwner: phaseOwner(current.phase),
            ...(step.payload?.gateResult ? {
              gate: step.payload.gateResult.gate,
              gateVerdict: step.payload.gateResult.verdict,
              requiredCheckCount: step.payload.gateResult.requiredChecks.length,
            } : {}),
          }));
        }
        rootPath = path.join(workItemDirectory(this.projectRoot, next), 'main.md');
        previousRoot = fs.existsSync(rootPath) ? fs.readFileSync(rootPath) : null;
        syncWorkItemRoot(this.projectRoot, next);
        rootWritten = true;
        const repoSnapshot = options.repoSnapshotFactory
          ? options.repoSnapshotFactory()
          : options.repoSnapshot;
        registry.workItems[id] = next;
        registry.currentWorkItemId = SLOT_HOLDING_STATUSES.has(next.status) ? id :
          (registry.currentWorkItemId === id ? null : registry.currentWorkItemId);
        registry.events.push(...events);
        for (const record of transitions) {
          this.recordLedger(record.current, record.next, record.step.event, record.step.payload || {}, options, record.step.timestamp || timestamp);
        }
        if (repoSnapshot) {
          registry.repoSnapshots[id] = repoSnapshot;
          registry.events.push(makeEvent(id, 'repo.snapshot.updated', 'succeeded', timestamp, {
            reason: options.snapshotReason || 'phase-transaction',
            changedPathCount: Number(options.snapshotChangedPathCount) || 0,
            ...(options.transactionId ? { transactionId: options.transactionId } : {}),
          }));
        }
        return registry;
      });
      return updated.workItems[id];
    } catch (error) {
      if (rootWritten) this.restoreRoot(rootPath, previousRoot);
      this.recordFailedEvent(id, 'phase.transaction', error, timestamp);
      throw error;
    }
  }

  recordLedger(current, next, event, payload, options, timestamp) {
    const entries = ledger.entriesForTransition(this.projectRoot, {
      previous: current, next, event, payload,
      transactionId: options.transactionId || null,
      sessionId: options.sessionId || null,
      redact: redactRequestText,
    });
    for (const entry of entries) ledger.append(this.projectRoot, entry, timestamp);
    return entries;
  }

  restoreRoot(filePath, previous) {
    try {
      if (previous === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        atomicWrite(filePath, previous);
      }
    } catch (_) { /* Preserve the original transaction error. */ }
  }

  recordFailedEvent(id, event, error, timestamp) {
    try {
      this.ensureStateDir();
      stateStore.lockedUpdate(this.statePath, raw => {
        const registry = sanitizeRegistry(raw);
        const current = registry.workItems[id];
        registry.events.push(makeEvent(id, event, 'failed', timestamp, {
          from: current ? `${current.phase}/${current.status}` : null,
          phaseOwner: current ? phaseOwner(current.phase) : null,
          errorCode: error?.code || 'TRANSITION_REJECTED',
          reason: String(error?.message || 'Transition rejected').slice(0, 500),
        }));
        return registry;
      });
    } catch (_) { /* Audit failure must not replace the original error. */ }
  }

  queuePendingRequest(rawText, sessionId, timestamp) {
    const redacted = redactRequestText(rawText);
    const request = {
      id: `PR-${crypto.randomUUID()}`,
      text: redacted.text,
      requestedAt: new Date(timestamp || Date.now()).toISOString(),
      sessionId: sessionId || null,
      redactionApplied: redacted.redactionApplied,
      redactedFields: redacted.redactedFields,
    };
    this.ensureStateDir();
    stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      registry.pendingRequests.push(request);
      return registry;
    });
    return request;
  }

  acquireLease(id, sessionId, timestamp) {
    if (!sessionId) throw new Error('sessionId is required');
    const now = new Date(timestamp || Date.now()).getTime();
    this.ensureStateDir();
    const registry = stateStore.lockedUpdate(this.statePath, raw => {
      const value = sanitizeRegistry(raw);
      const item = value.workItems[id];
      if (!item || !SLOT_HOLDING_STATUSES.has(item.status)) throw new Error(`Work item is not progressable: ${id}`);
      if (value.currentWorkItemId !== id) throw new Error(`Work item is not current: ${id}`);
      const existing = value.leases[id];
      if (existing && Date.parse(existing.expiresAt) > now && existing.sessionId !== sessionId) {
        const error = new Error(`Mutation lease is held by another session for ${id}`);
        error.code = 'LEASE_HELD';
        throw error;
      }
      value.leases[id] = {
        sessionId,
        acquiredAt: new Date(now).toISOString(),
        expiresAt: new Date(now + this.leaseMs).toISOString(),
      };
      return value;
    });
    return registry.leases[id];
  }

  releaseLease(id, sessionId) {
    this.ensureStateDir();
    stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const existing = registry.leases[id];
      if (existing && existing.sessionId !== sessionId) {
        const error = new Error(`Cannot release another session's lease for ${id}`);
        error.code = 'LEASE_HELD';
        throw error;
      }
      delete registry.leases[id];
      return registry;
    });
  }

  hasValidLease(id, sessionId, timestamp) {
    if (!id || !sessionId) return false;
    const lease = this.readRegistry().leases[id];
    const now = new Date(timestamp || Date.now()).getTime();
    return Boolean(lease && lease.sessionId === sessionId && Date.parse(lease.expiresAt) > now);
  }

  getRepoSnapshot(id) {
    return this.readRegistry().repoSnapshots[id] || null;
  }

  setRepoSnapshot(id, snapshot, details = {}) {
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      if (!registry.workItems[id]) throw new Error(`Unknown work item: ${id}`);
      if (details.transactionId && registry.events.some(event =>
        event.type === 'repo.snapshot.updated' && event.workItemId === id &&
        event.details?.transactionId === details.transactionId)) {
        return registry;
      }
      registry.repoSnapshots[id] = snapshot;
      registry.events.push(makeEvent(id, 'repo.snapshot.updated', 'succeeded', details.timestamp, {
        reason: details.reason || 'observation',
        changedPathCount: Number(details.changedPathCount) || 0,
        ...(details.transactionId ? { transactionId: details.transactionId } : {}),
      }));
      return registry;
    }).repoSnapshots[id];
  }

  recordDriftAlert(id, paths, classification, timestamp) {
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const alert = {
        id: crypto.randomUUID(),
        workItemId: id,
        paths: [...new Set(paths)].sort(),
        classification,
        detectedAt: new Date(timestamp || Date.now()).toISOString(),
      };
      registry.driftAlerts.push(alert);
      registry.events.push(makeEvent(id, 'repo.drift.observed', 'succeeded', timestamp, {
        classification,
        changedPathCount: alert.paths.length,
      }));
      return registry;
    }).driftAlerts.at(-1);
  }

  recordCheckReceipt(id, phase, check, result, evidencePath, repoDigest, timestamp, metadata = {}) {
    const digest = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      if (!item || item.phase !== phase) throw new Error('Check receipt phase is stale');
      if (metadata.claimId) {
        const claim = registry.checkExecutions?.[metadata.identity];
        if (!claim || claim.id !== metadata.claimId || claim.workItemId !== id ||
          claim.phase !== phase || claim.check !== check) {
          throw new Error('Check execution claim is missing, stale, or belongs to another check');
        }
        delete registry.checkExecutions[metadata.identity];
      }
      registry.checkReceipts[id] ||= {};
      registry.checkReceipts[id][phase] ||= {};
      const receipt = {
        check,
        digest,
        evidencePath,
        repoDigest,
        identity: metadata.identity || null,
        command: metadata.command || null,
        supplemental: metadata.supplemental === true,
        supplementalReason: metadata.supplementalReason || null,
        designRevision: item.designRevision,
        recordedAt: new Date(timestamp || Date.now()).toISOString(),
      };
      registry.checkReceipts[id][phase][check] = receipt;
      registry.events.push(makeEvent(id, 'check.completed', 'succeeded', timestamp, {
        phase,
        check,
        digest,
        identity: metadata.identity || null,
        command: metadata.command || null,
        repoDigest,
        designRevision: item.designRevision,
        verdict: result.verdict,
        supplemental: metadata.supplemental === true,
        ...(metadata.supplementalReason ? { supplementalReason: metadata.supplementalReason } : {}),
      }));
      return registry;
    }).checkReceipts[id][phase][check];
  }

  claimCheckExecution(id, phase, check, identity, sessionId, timestamp, details = {}) {
    const now = new Date(timestamp || Date.now()).getTime();
    const claimId = `CE-${crypto.randomUUID()}`;
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      if (!item || item.phase !== phase || item.status !== 'active') throw new Error('Check execution phase is stale');
      this.assertLease(registry, id, sessionId, timestamp);
      const existing = registry.checkExecutions[identity];
      if (existing && Date.parse(existing.expiresAt) > now) {
        const error = new Error(`Check execution is already in progress for identity: ${identity}`);
        error.code = 'CHECK_EXECUTION_IN_PROGRESS';
        throw error;
      }
      registry.checkExecutions[identity] = {
        id: claimId,
        workItemId: id,
        phase,
        check,
        identity,
        sessionId,
        supplemental: details.supplemental === true,
        startedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 30 * 60_000).toISOString(),
      };
      registry.events.push(makeEvent(id, 'check.execution.claimed', 'succeeded', timestamp, {
        phase, check, identity, supplemental: details.supplemental === true,
      }));
      return registry;
    }).checkExecutions[identity];
  }

  releaseCheckExecution(identity, claimId, timestamp) {
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const existing = registry.checkExecutions[identity];
      if (!existing || existing.id !== claimId) return registry;
      delete registry.checkExecutions[identity];
      registry.events.push(makeEvent(existing.workItemId, 'check.execution.released', 'failed', timestamp, {
        phase: existing.phase, check: existing.check, identity,
      }));
      return registry;
    });
  }

  syncDocumentRevision(id, phase, revision, sessionId, timestamp) {
    const field = phase === 'plan' ? 'planRevision' : phase === 'design' ? 'designRevision' : null;
    if (!field) return this.get(id);
    this.ensureStateDir();
    let rootPath = null;
    let previousRoot = null;
    let rootWritten = false;
    try {
      const updated = stateStore.lockedUpdate(this.statePath, raw => {
        const registry = sanitizeRegistry(raw);
        const item = registry.workItems[id];
        if (!item || item.phase !== phase) throw new Error('Document revision phase is stale');
        this.assertLease(registry, id, sessionId, timestamp);
        if (!Number.isInteger(revision) || revision < item[field]) throw new Error('Document revision cannot move backward');
        const next = { ...item, [field]: revision, updatedAt: new Date(timestamp || Date.now()).toISOString() };
        rootPath = path.join(workItemDirectory(this.projectRoot, next), 'main.md');
        previousRoot = fs.existsSync(rootPath) ? fs.readFileSync(rootPath) : null;
        syncWorkItemRoot(this.projectRoot, next);
        rootWritten = true;
        registry.workItems[id] = next;
        registry.events.push(makeEvent(id, `${phase}.document.revision`, 'succeeded', timestamp, {
          phaseOwner: phaseOwner(phase), revision,
        }));
        return registry;
      });
      return updated.workItems[id];
    } catch (error) {
      if (rootWritten) this.restoreRoot(rootPath, previousRoot);
      throw error;
    }
  }

  verifyCheckReceipt(id, phase, check, result, evidencePath, repoDigest) {
    const receipt = this.readRegistry().checkReceipts?.[id]?.[phase]?.[check];
    if (!receipt || receipt.evidencePath !== evidencePath || !repoDigest || receipt.repoDigest !== repoDigest) return false;
    const digest = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
    return receipt.digest === digest;
  }

  recordCheckReuse(id, phase, check, identity, sourcePhase, timestamp) {
    this.ensureStateDir();
    return stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      if (!item || item.phase !== phase || item.status !== 'active') throw new Error('Check reuse phase is stale');
      registry.events.push(makeEvent(id, 'check.reused', 'succeeded', timestamp, {
        phase, check, identity, sourcePhase,
      }));
      return registry;
    });
  }

  recordAssignment(id, assignment, sessionId, timestamp) {
    const digest = crypto.createHash('sha256').update(JSON.stringify(assignment)).digest('hex');
    const assignmentId = `AS-${crypto.randomUUID()}`;
    this.ensureStateDir();
    const registry = stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      if (!item || item.phase !== assignment.phase || item.status !== 'active') throw new Error('Assignment phase is stale');
      this.assertLease(registry, id, sessionId, timestamp);
      if (item.phase === 'do' && (!(item.requiredSpecialists || []).includes(assignment.role) ||
        assignment.mode !== 'implementation' || assignment.codeWrite !== true)) {
        throw new Error('Do assignment is not a current Design-required implementation role');
      }
      if (item.phase === 'do') {
        const normalized = normalizeWriteScopes(assignment.writeScope || []);
        if (JSON.stringify(normalized) !== JSON.stringify(assignment.writeScope) ||
          normalized.some(scope => /[*?\[\]{}]/.test(scope) &&
            (!scope.endsWith('/**') || /[*?\[\]{}]/.test(scope.slice(0, -3)))) ||
          normalized.some(scope => !(item.writeScopes || []).some(parent => scopeWithin(scope, parent)))) {
          throw new Error('Do assignment write scope is not normalized or exceeds current Design scope');
        }
      }
      if (item.phase === 'review' && (assignment.role !== 'independent-qa' || assignment.mode !== 'verification' ||
        assignment.codeWrite !== false || (assignment.writeScope || []).length !== 0 || assignment.context?.cleanRoom !== true)) {
        throw new Error('Review assignment must be read-only independent-qa with cleanRoom enabled');
      }
      const duplicate = Object.values(registry.assignments || {}).find(receipt =>
        receipt.workItemId === id && receipt.phase === item.phase && receipt.role === assignment.role &&
        receipt.designRevision === item.designRevision && receipt.repairCycle === item.qaRepairCount);
      if (duplicate) throw new Error(`Current Design assignment already issued for role: ${assignment.role}`);
      const receipt = {
        id: assignmentId,
        workItemId: id,
        phase: assignment.phase,
        role: assignment.role,
        designRevision: item.designRevision,
        repairCycle: item.qaRepairCount,
        digest,
        issuedAt: new Date(timestamp || Date.now()).toISOString(),
        assignment,
      };
      registry.assignments[assignmentId] = receipt;
      registry.events.push(makeEvent(id, 'assignment.issued', 'succeeded', timestamp, {
        phaseOwner: phaseOwner(item.phase), assignmentId, role: assignment.role,
        delegatedBy: assignment.delegatedBy, mode: assignment.mode, codeWrite: assignment.codeWrite,
      }));
      return registry;
    });
    const { assignment: _assignment, ...receipt } = registry.assignments[assignmentId];
    return receipt;
  }

  getAssignmentEnvelope(id, assignmentId) {
    const registry = this.readRegistry();
    const item = registry.workItems[id];
    const stored = registry.assignments?.[assignmentId];
    if (!item || !stored?.assignment || stored.workItemId !== id || stored.phase !== item.phase ||
      stored.designRevision !== item.designRevision || stored.repairCycle !== item.qaRepairCount) return null;
    const { assignment, ...assignmentReceipt } = stored;
    return { assignment, assignmentReceipt };
  }

  verifyAssignmentReceipt(id, receipt, assignment) {
    if (!receipt?.id) return false;
    const registry = this.readRegistry();
    const item = registry.workItems[id];
    const stored = registry.assignments?.[receipt.id];
    if (!item || !stored || stored.workItemId !== id || stored.phase !== assignment.phase || stored.role !== assignment.role ||
      stored.designRevision !== item.designRevision || stored.repairCycle !== item.qaRepairCount) return false;
    const digest = crypto.createHash('sha256').update(JSON.stringify(assignment)).digest('hex');
    return stored.digest === digest && receipt.digest === digest;
  }

  recordAssignmentUse(id, assignmentId, sessionId, timestamp) {
    this.ensureStateDir();
    const updated = stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      const receipt = registry.assignments[assignmentId];
      if (!item || !['do', 'review'].includes(item.phase) || item.status !== 'active') {
        throw new Error('Specialist use requires do/active or review/active');
      }
      this.assertLease(registry, id, sessionId, timestamp);
      if (!receipt || receipt.workItemId !== id || receipt.phase !== item.phase || receipt.designRevision !== item.designRevision ||
        receipt.repairCycle !== item.qaRepairCount) {
        throw new Error('Specialist assignment is missing or stale');
      }
      if (receipt.consumedAt) throw new Error('Specialist assignment was already consumed');
      if (receipt.completedAt) throw new Error('Completed specialist assignment cannot be consumed again');
      receipt.consumedAt = new Date(timestamp || Date.now()).toISOString();
      registry.events.push(makeEvent(id, 'assignment.consumed', 'succeeded', timestamp, {
        phaseOwner: phaseOwner(item.phase), assignmentId, role: receipt.role,
        designRevision: receipt.designRevision,
      }));
      return registry;
    });
    return updated.assignments[assignmentId];
  }

  recordAssignmentHandoff(id, assignmentId, handoff, sessionId, timestamp, options = {}) {
    const digest = crypto.createHash('sha256').update(JSON.stringify(handoff)).digest('hex');
    this.ensureStateDir();
    const updated = stateStore.lockedUpdate(this.statePath, raw => {
      const registry = sanitizeRegistry(raw);
      const item = registry.workItems[id];
      const receipt = registry.assignments[assignmentId];
      if (!item || !['do', 'review'].includes(item.phase) || item.status !== 'active') {
        throw new Error('Specialist handoff requires do/active or review/active');
      }
      this.assertLease(registry, id, sessionId, timestamp);
      if (!receipt?.consumedAt || receipt.workItemId !== id || receipt.phase !== item.phase || receipt.designRevision !== item.designRevision ||
        receipt.repairCycle !== item.qaRepairCount) {
        throw new Error('Specialist handoff requires a consumed current-Design assignment');
      }
      if (receipt.completedAt) throw new Error('Specialist assignment already has a handoff');
      const assignmentDigest = crypto.createHash('sha256').update(JSON.stringify(receipt.assignment)).digest('hex');
      if (!receipt.assignment || assignmentDigest !== receipt.digest) {
        throw new Error('Specialist assignment digest is invalid');
      }
      if (options.expectedDesignRevision !== undefined && options.expectedDesignRevision !== item.designRevision) {
        throw new Error('Specialist handoff Design revision is stale');
      }
      if (options.expectedRepairCycle !== undefined && options.expectedRepairCycle !== item.qaRepairCount) {
        throw new Error('Specialist handoff repair cycle is stale');
      }
      if (receipt.role === 'independent-qa') {
        const validQaVerdict = handoff.status === 'blocked' ? handoff.verdict === 'blocked' :
          handoff.status === 'completed' && ['pass', 'fail'].includes(handoff.verdict);
        if (!validQaVerdict) throw new Error('Independent QA handoff status and verdict are inconsistent');
      }
      receipt.handoffStatus = handoff.status;
      receipt.handoffDigest = digest;
      if (options.evidencePath) receipt.handoffEvidencePath = options.evidencePath;
      receipt.completedAt = new Date(timestamp || Date.now()).toISOString();
      registry.events.push(makeEvent(id, 'assignment.handoff-recorded', 'succeeded', timestamp, {
        phaseOwner: phaseOwner(item.phase), assignmentId, role: receipt.role,
        status: handoff.status, designRevision: receipt.designRevision, repairCycle: receipt.repairCycle,
        ...(options.evidencePath ? { evidencePath: options.evidencePath } : {}),
      }));
      return registry;
    });
    return updated.assignments[assignmentId];
  }

  missingCompletedSpecialists(id, phase = 'do', requiredRoles = null, acceptedStatuses = ['completed']) {
    const registry = this.readRegistry();
    const item = registry.workItems[id];
    if (!item) return [];
    const accepted = new Set(acceptedStatuses);
    const receipts = Object.values(registry.assignments || {}).filter(receipt =>
      receipt.workItemId === id && receipt.phase === phase && receipt.designRevision === item.designRevision &&
      receipt.repairCycle === item.qaRepairCount &&
      receipt.consumedAt && receipt.completedAt && accepted.has(receipt.handoffStatus) &&
      this.verifyPersistedHandoff(receipt));
    const required = requiredRoles || (phase === 'do' ? item.requiredSpecialists || [] : []);
    return required.filter(role => !receipts.some(receipt => receipt.role === role));
  }

  // Assignments the runtime consumed (an Agent was launched through the guard) whose
  // handoff has not been recorded for the current Design revision and repair cycle.
  openAssignments(id) {
    const registry = this.readRegistry();
    const item = registry.workItems[id];
    if (!item) return [];
    return Object.values(registry.assignments || {})
      .filter(receipt => receipt.workItemId === id && receipt.phase === item.phase &&
        receipt.designRevision === item.designRevision && receipt.repairCycle === item.qaRepairCount &&
        receipt.consumedAt && !receipt.completedAt)
      .map(({ assignment: _assignment, ...receipt }) => receipt);
  }

  verifyPersistedHandoff(receipt) {
    if (!receipt?.handoffEvidencePath) return true; // Compatibility handoffs remain valid until the legacy command is removed.
    try {
      const target = path.resolve(this.projectRoot, receipt.handoffEvidencePath);
      if (!target.startsWith(`${this.projectRoot}${path.sep}`) || !fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink()) return false;
      const evidence = JSON.parse(fs.readFileSync(target, 'utf8'));
      if (evidence.schema !== 'automatic-handoff-evidence/v1' || evidence.assignmentId !== receipt.id ||
        evidence.workItemId !== receipt.workItemId || evidence.designRevision !== receipt.designRevision ||
        evidence.repairCycle !== receipt.repairCycle ||
        evidence.assignmentDigest !== receipt.digest || evidence.handoffDigest !== receipt.handoffDigest) return false;
      const handoffDigest = crypto.createHash('sha256').update(JSON.stringify(evidence.handoff)).digest('hex');
      return handoffDigest === receipt.handoffDigest;
    } catch (_) {
      return false;
    }
  }

  assertLease(registry, id, sessionId, timestamp) {
    if (!sessionId) throw new Error('sessionId is required for mutation');
    const lease = registry.leases[id];
    const now = new Date(timestamp || Date.now()).getTime();
    if (!lease || lease.sessionId !== sessionId || Date.parse(lease.expiresAt) <= now) {
      const error = new Error(`Valid mutation lease is required for ${id}`);
      error.code = 'LEASE_REQUIRED';
      throw error;
    }
  }
}

module.exports = {
  DEFAULT_LEASE_MS,
  WorkItemStore,
  emptyRegistry,
  redactRequestText,
};
