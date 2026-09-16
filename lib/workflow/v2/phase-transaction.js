'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { assertContract } = require('./contracts');
const { WorkItemStore } = require('./work-item-store');
const { AuthorizationStore } = require('./authorization-store');
const {
  EVENTS, createInitialWorkItem, transition, normalizeWriteScopes, normalizeCheckIds, normalizeRoleIds,
} = require('./state-machine');
const { evaluateGate } = require('./gate-engine');
const {
  atomicWrite, parseDocument, preparePhaseDocument, writePreparedPhaseDocument, writePhaseDocument, PHASE_FOLDERS, workItemDirectory,
  writeFeatureIndexes, writeMaster, checkReportArtifacts, featureIds, featureIndexPath,
} = require('./document-manager');
const { checkPhaseDocument, inspectPhaseDocument, phaseDocumentPath } = require('./phase-check');
const { evaluateDocumentBudget, evaluateDocumentRepetition } = require('./document-quality');
const { TOOL_DEFINITIONS, runCheck, isBuiltinCheck } = require('./tool-adapters');
const { captureRepoSnapshot, scopedSnapshotDigest } = require('./repo-drift');
const { kindOf, isStageKind, stageOfKind, loadChainCatalog } = require('./chain-registry');
const { stageDocumentCheck, assertStageEntry, approveStage, indexPath } = require('./id-chain');
const { normalizeRelative } = require('./write-policy');
const { loadRoleCatalog, resolveRole } = require('./role-registry');
const { buildCheckIdentity, matchingCheckReceipts, reviewEvidenceManifest } = require('./check-evidence');
const { cleanupPromotedDrafts, transientDraftCheck } = require('./draft-lifecycle');
const { loadUiConfig } = require('./config');
const { capture } = require('./screen-capture');
const { snapshotFiles, summarizeChanges, renderDiffMarkdown } = require('./diff-summary');
const { writeReviewPage } = require('./review-page');
const { hasScreenCheck } = require('./state-machine');
const { execFileSync } = require('child_process');
const os = require('os');

const ACTIONS = Object.freeze({ plan: 'present', design: 'present', do: 'ready', review: 'decide', report: 'finalize' });
const RECEIPT_LIMITS = Object.freeze({ compact: 1024, standard: 1024, extended: 2048 });

function canonicalDoSpecialists(values) {
  const names = normalizeRoleIds(values || []);
  const catalog = loadRoleCatalog();
  return [...new Set(names.map(name => {
    const resolved = resolveRole(catalog, name);
    if (!resolved || resolved.kind !== 'role' || resolved.role.kind !== 'implementation' ||
      !(resolved.role.modes || []).includes('implementation') || !(resolved.role.delegatedBy || []).includes('cto')) {
      throw new Error(`Design specialist must be a CTO-delegated implementation role: ${name}`);
    }
    return resolved.target;
  }))];
}

function canonicalWriteScopes(projectRoot, values) {
  return normalizeWriteScopes(values || []).map(scope => {
    if (/[*?\[\]{}]/.test(scope) && (!scope.endsWith('/**') || /[*?\[\]{}]/.test(scope.slice(0, -3)))) {
      throw new Error(`Write scope must be an exact path or directory/**: ${scope}`);
    }
    if (scope.endsWith('/**')) return scope;
    if (scope.endsWith('/')) return `${scope}**`;
    const target = path.resolve(projectRoot, scope);
    try {
      if (fs.lstatSync(target).isDirectory()) return `${scope}/**`;
    } catch (_) { /* A not-yet-created path remains an exact-file scope. */ }
    return scope;
  });
}

function canonicalToolChecks(values, label) {
  const checks = normalizeCheckIds(values || [], label);
  for (const check of checks) {
    if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, check)) {
      throw new Error(`Unknown Design-declared Tool adapter: ${check}`);
    }
  }
  return checks;
}

function enforceSpecialistBudget(scale, specialists) {
  const limits = { compact: 1, standard: 2 };
  const limit = limits[scale];
  if (limit !== undefined && specialists.length > limit) {
    throw new Error(`${scale} Design allows at most ${limit} Do specialist(s); received ${specialists.length}`);
  }
  return specialists;
}

function phaseDirectory(projectRoot, item, phase) {
  return path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS[phase]);
}

function readBody(projectRoot, input, item, phase) {
  if (input.body !== undefined) return String(input.body);
  if (input.bodyFile) {
    const target = path.resolve(projectRoot, input.bodyFile);
    const relative = normalizeRelative(projectRoot, target);
    if (!relative || !fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink()) throw new Error('Transaction body file must be a non-symbolic project file');
    return fs.readFileSync(target, 'utf8');
  }
  const existing = parseDocument(phaseDocumentPath(projectRoot, item, phase));
  if (!existing) throw new Error(`Canonical ${phase} body is required`);
  return existing.content;
}

const REPORT_OUTCOME_LIMIT = 500;

function reportBody(projectRoot, item, input) {
  // A frozen Report cannot be repaired, so an over-long outcome is refused instead of truncated.
  if (input.outcome !== undefined && String(input.outcome).length > REPORT_OUTCOME_LIMIT) {
    const error = new Error(`Report --outcome 은 ${REPORT_OUTCOME_LIMIT}자 이내여야 한다 (현재 ${String(input.outcome).length}자). 세부는 Review·Do 문서에 있으므로 요약만 적는다`);
    error.code = 'REPORT_OUTCOME_TOO_LONG';
    throw error;
  }
  const plan = parseDocument(phaseDocumentPath(projectRoot, item, 'plan'))?.content || '';
  const requirements = [...new Set(plan.match(/\bREQ-\d{3}\b/gi) || [])].map(value => value.toUpperCase());
  const rel = target => path.relative(phaseDirectory(projectRoot, item, 'report'), target).split(path.sep).join('/');
  return [
    '# Report', '',
    '## 최종 결과', '',
    String(input.outcome || `${item.title} implementation was accepted and completed.`), '',
    '## 최종 승인', '',
    `Final approval: ${item.approvals.final}.`, '',
    '## 변경', '',
    ...(item.writeScopes || []).map(value => `- ${value}`), '',
    '## 검증 증거', '',
    `- [Independent Review](${rel(phaseDocumentPath(projectRoot, item, 'review'))})`, '',
    '## 요구사항', '',
    `- ${requirements.join(', ') || 'REQ-001'} (see canonical Plan and Review)`, '',
    '## 잔여 제한', '',
    ...((input.limitations || []).length ? input.limitations.map(value => `- ${String(value).slice(0, 300)}`) : ['- None recorded.']), '',
    '## 정본 링크', '',
    `- [Plan](${rel(phaseDocumentPath(projectRoot, item, 'plan'))})`,
    `- [Design](${rel(phaseDocumentPath(projectRoot, item, 'design'))})`,
    `- [Do](${rel(phaseDocumentPath(projectRoot, item, 'do'))})`,
    `- [Review](${rel(phaseDocumentPath(projectRoot, item, 'review'))})`,
  ].join('\n');
}

function persistCheck(projectRoot, item, phase, result) {
  const filePath = path.join(phaseDirectory(projectRoot, item, phase), 'evidence', `${result.check}.json`);
  atomicWrite(filePath, `${JSON.stringify(result, null, 2)}\n`);
  return normalizeRelative(projectRoot, filePath);
}

function documentChecks(projectRoot, item, phase) {
  const checks = [
    assertContract('checkResult', checkPhaseDocument(projectRoot, item, phase)),
    assertContract('checkResult', evaluateDocumentBudget(projectRoot, item, phase)),
  ];
  if (phase !== 'plan') checks.push(assertContract('checkResult', evaluateDocumentRepetition(projectRoot, item, phase)));
  for (const check of checks) persistCheck(projectRoot, item, phase, check);
  return checks;
}

function documentPreflightChecks(projectRoot, item, phase, prepared) {
  const relativePath = normalizeRelative(projectRoot, prepared.filePath);
  const checks = [
    assertContract('checkResult', inspectPhaseDocument(projectRoot, item, phase, {
      path: prepared.filePath,
      document: { data: prepared.data, content: prepared.body },
      markdown: prepared.markdown,
    })),
    assertContract('checkResult', evaluateDocumentBudget({
      scale: item.scale,
      kind: item.kind,
      phase,
      markdown: prepared.markdown,
      frontmatter: prepared.data,
      path: relativePath,
    })),
  ];
  if (phase !== 'plan') {
    checks.push(assertContract('checkResult', evaluateDocumentRepetition(projectRoot, item, phase, {
      content: prepared.body,
      path: prepared.filePath,
    })));
  }
  return checks;
}

// Checks evaluated inside the transaction instead of by a Tool adapter.
function builtinChecks(projectRoot, item, phase = 'do') {
  const checks = [];
  if (isStageKind(kindOf(item))) checks.push(assertContract('checkResult', stageDocumentCheck(projectRoot, item)));
  if (hasScreenCheck(item)) {
    if (phase === 'do') checks.push(assertContract('checkResult', screenCaptureCheck(projectRoot, item)));
    else {
      // Review reuses the last round's capture evidence; the user already confirmed those screens.
      const previous = path.join(phaseDirectory(projectRoot, item, 'do'), 'evidence', 'screen-capture.json');
      if (fs.existsSync(previous)) checks.push(assertContract('checkResult', JSON.parse(fs.readFileSync(previous, 'utf8'))));
      else checks.push(assertContract('checkResult', screenCaptureCheck(projectRoot, item)));
    }
  }
  return checks;
}

// The committed state of the app (round 0, "before") comes from git so the user sees what the
// screen looked like before this Work item touched it. Without git there is no "before".
function exportCommittedApp(projectRoot, appRoot) {
  try {
    const listing = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', appRoot], {
      cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\n').filter(Boolean);
    if (listing.length === 0) return null;
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-before-'));
    for (const file of listing) {
      const content = execFileSync('git', ['show', `HEAD:${file}`], { cwd: projectRoot, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 });
      const target = path.join(directory, path.relative(appRoot, file));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    return directory;
  } catch (_) {
    return null;
  }
}

// Screen check evidence for screen-check kinds (docs/harness/design.md §5): the real app is
// photographed at desktop and mobile size for this round, the app files are snapshotted, and the
// difference from the previous round is written in plain words. A missing Chrome or target is a
// finding, so the Gate says NOT_READY instead of pretending a screen was seen.
function screenCaptureCheck(projectRoot, item) {
  const ui = loadUiConfig(projectRoot);
  const round = (item.screenRevisionCount || 0) + 1;
  const screensDir = path.join(phaseDirectory(projectRoot, item, 'do'), 'evidence', 'screens');
  const roundDir = path.join(screensDir, `round-${round}`);
  const findings = [];
  const evidence = [];
  let renderer = null;
  let summary = '';
  const appRoot = ui.appRoot ? path.resolve(projectRoot, ui.appRoot) : null;
  const target = ui.url || (appRoot ? path.join(appRoot, ui.entry) : null);
  if (!target) {
    findings.push('vais.config.json > ui.appRoot(+entry) 또는 ui.url 이 없어 화면을 찍을 수 없다');
  } else {
    try {
      const shot = capture(target, roundDir);
      renderer = shot.renderer;
      evidence.push(...Object.values(shot.files).map(file => normalizeRelative(projectRoot, file)));
      if (appRoot && fs.existsSync(appRoot)) {
        snapshotFiles(appRoot, path.join(roundDir, 'src'));
        const previousDir = path.join(screensDir, `round-${round - 1}`);
        if (round === 1 && !fs.existsSync(previousDir)) {
          const before = exportCommittedApp(projectRoot, ui.appRoot);
          if (before) {
            try {
              capture(path.join(before, ui.entry), previousDir);
              snapshotFiles(before, path.join(previousDir, 'src'));
              evidence.push(normalizeRelative(projectRoot, path.join(previousDir, 'desktop.png')));
            } finally {
              fs.rmSync(before, { recursive: true, force: true });
            }
          }
        }
        const previousSrc = path.join(previousDir, 'src');
        const diff = fs.existsSync(previousSrc)
          ? summarizeChanges(previousSrc, path.join(roundDir, 'src'))
          : { lines: [], truncated: false, summary: '비교 대상 없음 (전 회차·커밋 상태 없음)' };
        atomicWrite(path.join(roundDir, 'diff.md'), renderDiffMarkdown(round, diff));
        evidence.push(normalizeRelative(projectRoot, path.join(roundDir, 'diff.md')));
        summary = diff.summary;
      } else {
        summary = 'URL 대상 — 파일 diff 없음';
      }
    } catch (error) {
      findings.push(error.message);
    }
  }
  return {
    check: 'screen-capture',
    execution: findings.length === 0 ? 'succeeded' : 'errored',
    verdict: findings.length === 0 ? 'pass' : 'fail',
    required: true,
    scope: [ui.appRoot || ui.url || '<ui config missing>'],
    requirements: [],
    summary: findings.length === 0
      ? `회차 ${round} 화면 2장 (renderer: ${renderer}) · ${summary}`
      : `${findings.length} screen capture issue(s) found`,
    findings,
    evidence: evidence.filter(Boolean),
  };
}

function persistDocumentChecks(projectRoot, item, phase, checks) {
  for (const check of checks) persistCheck(projectRoot, item, phase, check);
  return checks;
}

function runMechanicalChecks(projectRoot, item, phase, ids, store, input, options = {}) {
  const results = [];
  const repoDigest = scopedSnapshotDigest(projectRoot, item.writeScopes);
  const supplementalChecks = new Set(options.supplementalChecks || []);
  const supplementalReason = String(options.supplementalReason || '').trim();
  for (const check of ids) {
    if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, check)) {
      throw new Error(`Unknown Design-declared Tool adapter: ${check}`);
    }
    if (isBuiltinCheck(check)) continue;
    const identity = buildCheckIdentity(projectRoot, item, check, repoDigest);
    const matches = matchingCheckReceipts(store, item, check, { repoDigest });
    const supplemental = supplementalChecks.has(check);
    const priorSupplemental = store.readRegistry().events.some(event =>
      event.type === 'check.completed' && event.workItemId === item.id &&
      event.details?.identity === identity.key && event.details?.supplemental === true);
    if (supplemental && !supplementalReason) {
      throw new Error('A supplemental Review check requires --supplemental-reason');
    }
    if (supplemental && matches.length === 0) {
      throw new Error(`Supplemental Review check requires existing evidence for the same identity: ${check}`);
    }
    if (supplemental && priorSupplemental) {
      results.push(matches[0].result);
      continue;
    }
    const reusable = matches.find(match => match.result.verdict === 'pass');
    if (reusable) {
      store.recordCheckReuse(item.id, phase, check, identity.key, reusable.phase, input.timestamp);
      results.push(reusable.result);
      continue;
    }
    if (!supplemental && matches.length > 0) {
      results.push(matches[0].result);
      continue;
    }
    if (options.reuseOnly) continue;
    const claim = store.claimCheckExecution(item.id, phase, check, identity.key,
      String(input.sessionId || input.session || ''), input.timestamp, { supplemental });
    const base = path.join(phaseDirectory(projectRoot, item, phase), 'evidence');
    const resultPath = path.join(base, 'checks', `${check}.json`);
    const logPath = path.join(base, 'logs', `${check}.log`);
    const artifactPath = path.join(base, 'artifacts', check);
    try {
      let execution = null;
      const result = assertContract('checkResult', runCheck(check, {
        cwd: projectRoot,
        evidenceDirectory: artifactPath,
        scope: item.writeScopes,
        requirements: input.requirements || [],
        evidence: [normalizeRelative(projectRoot, logPath), ...(TOOL_DEFINITIONS[check].evidenceDirectory ? [normalizeRelative(projectRoot, artifactPath)] : [])],
        onExecution: value => { execution = value; },
      }));
      atomicWrite(logPath, [`check=${check}`, `status=${execution?.status ?? 'unavailable'}`, '', execution?.stdout || '', execution?.stderr || execution?.error?.message || ''].join('\n'));
      atomicWrite(resultPath, `${JSON.stringify(result, null, 2)}\n`);
      const resultRelative = normalizeRelative(projectRoot, resultPath);
      store.recordCheckReceipt(item.id, phase, check, result, resultRelative, repoDigest, input.timestamp, {
        identity: identity.key,
        command: identity.command,
        supplemental,
        supplementalReason: supplemental ? supplementalReason.slice(0, 300) : null,
        claimId: claim.id,
      });
      results.push(result);
    } catch (error) {
      try { store.releaseCheckExecution(identity.key, claim.id, input.timestamp); } catch (_) { /* Keep the check error. */ }
      throw error;
    }
  }
  return results;
}

function prepareReviewEvidence(projectRoot, input) {
  const root = path.resolve(projectRoot);
  const sessionId = String(input.sessionId || input.session || '').trim();
  if (!sessionId) throw new Error('Review evidence prepare sessionId is required');
  const store = new WorkItemStore(root);
  const item = input.id ? store.get(String(input.id)) : store.getCurrent();
  if (!item || item.phase !== 'review' || item.status !== 'active') {
    throw new Error('Review evidence prepare requires review/active');
  }
  if (!Number.isInteger(input.revision) || input.revision !== item.designRevision) {
    throw new Error('Review evidence prepare requires the current explicit Design revision');
  }
  assertTransactionAuthorization(root, input, item, 'review', sessionId);
  store.acquireLease(item.id, sessionId, input.timestamp);
  const requestedSupplemental = input.supplementalChecks || [];
  const supplementalChecks = requestedSupplemental.length
    ? canonicalToolChecks(requestedSupplemental, 'supplemental Review')
    : [];
  if (supplementalChecks.some(check => !item.reviewChecks.includes(check))) {
    throw new Error('Supplemental Review checks must be declared by the current Design');
  }
  runMechanicalChecks(root, item, 'review', item.reviewChecks, store, input, {
    supplementalChecks,
    supplementalReason: input.supplementalReason,
  });
  const manifest = reviewEvidenceManifest(store, item);
  // Screen-check kinds get a local review page: approved option | before | latest round.
  const reviewPage = hasScreenCheck(item) ? normalizeRelative(root, writeReviewPage(root, item).path) : null;
  const prepareId = `RP-${crypto.randomUUID()}`;
  store.setRepoSnapshot(item.id, captureRepoSnapshot(root), {
    reason: 'review-evidence-prepare', transactionId: prepareId, timestamp: input.timestamp,
  });
  return assertContract('reviewEvidencePrepare', {
    schema: 'review-evidence-prepare/v1',
    id: prepareId,
    workItemId: item.id,
    designRevision: item.designRevision,
    checks: manifest,
    ...(reviewPage ? { reviewPage } : {}),
    continuation: { automatic: true, nextAction: 'independent-qa', requiresUserTurn: false },
  });
}

function specialistCheck(store, item) {
  const registry = store.readRegistry();
  const current = Object.values(registry.assignments || {}).filter(receipt =>
    receipt.workItemId === item.id && receipt.phase === 'do' && receipt.designRevision === item.designRevision &&
    receipt.repairCycle === item.qaRepairCount);
  const invalid = [];
  for (const role of item.requiredSpecialists || []) {
    const matches = current.filter(receipt => receipt.role === role);
    if (matches.length !== 1) invalid.push(`${role}: expected exactly one assignment, found ${matches.length}`);
    else if (!matches[0].consumedAt || !matches[0].completedAt || matches[0].handoffStatus !== 'completed' ||
      !matches[0].handoffEvidencePath || !store.verifyPersistedHandoff(matches[0])) {
      invalid.push(`${role}: current assignment handoff is missing, stale, or invalid`);
    }
  }
  for (const receipt of current) {
    if (!(item.requiredSpecialists || []).includes(receipt.role)) invalid.push(`${receipt.role}: role is not required by current Design`);
  }
  return {
    check: 'specialist-handoffs', execution: 'succeeded', verdict: invalid.length ? 'fail' : 'pass', required: true,
    scope: item.writeScopes, requirements: [],
    summary: invalid.length ? `${invalid.length} specialist assignment invariant(s) failed` : 'All Design-required specialist handoffs are uniquely consumed and complete',
    findings: invalid, evidence: current.map(receipt => receipt.handoffEvidencePath).filter(Boolean),
  };
}

function independentQaCheck(store, item) {
  const registry = store.readRegistry();
  const matches = Object.values(registry.assignments || {}).filter(receipt =>
    receipt.workItemId === item.id && receipt.phase === 'review' && receipt.role === 'independent-qa' &&
    receipt.designRevision === item.designRevision && receipt.repairCycle === item.qaRepairCount);
  if (matches.length !== 1) {
    const error = new Error(`Review transaction requires exactly one current independent QA assignment; found ${matches.length}`);
    error.code = 'QA_HANDOFF_PRECONDITION';
    throw error;
  }
  const receipt = matches[0];
  if (receipt.assignment?.context?.cleanRoom !== true || receipt.assignment?.codeWrite !== false ||
    !receipt.consumedAt || !receipt.completedAt || !receipt.handoffEvidencePath || !store.verifyPersistedHandoff(receipt)) {
    const error = new Error('Independent QA assignment is unconsumed or its current-Design handoff evidence is missing, stale, or invalid');
    error.code = 'QA_HANDOFF_PRECONDITION';
    throw error;
  }
  const handoff = JSON.parse(fs.readFileSync(path.resolve(store.projectRoot, receipt.handoffEvidencePath), 'utf8')).handoff;
  if (receipt.handoffStatus === 'blocked' && handoff?.verdict === 'blocked') return {
    check: 'independent-qa-handoff', execution: 'unavailable', verdict: 'blocked', required: true, scope: [], requirements: [],
    summary: 'Independent QA is blocked', findings: ['Inspect the canonical handoff evidence'], evidence: receipt.handoffEvidencePath ? [receipt.handoffEvidencePath] : [],
  };
  if (receipt.handoffStatus !== 'completed' || !['pass', 'fail'].includes(handoff?.verdict)) {
    const error = new Error('Independent QA handoff status/verdict contract is invalid');
    error.code = 'QA_HANDOFF_PRECONDITION';
    throw error;
  }
  const failed = handoff.verdict === 'fail';
  return {
    check: 'independent-qa-handoff', execution: 'succeeded', verdict: failed ? 'fail' : 'pass', required: true, scope: [], requirements: handoff?.affectedRequirements || [],
    summary: failed ? 'Independent QA reported failure' : 'Independent QA completed without a failure verdict', findings: failed ? ['Inspect the canonical independent QA evidence'] : [],
    evidence: receipt.handoffEvidencePath ? [receipt.handoffEvidencePath] : [],
  };
}

function assertTransactionAuthorization(root, input, item, phase, sessionId) {
  const authorization = new AuthorizationStore(root).get(sessionId, input.timestamp);
  if (!authorization) {
    const error = new Error('A current managed session authorization is required for a phase transaction');
    error.code = 'AUTHORIZATION_REQUIRED';
    throw error;
  }
  if (authorization.phase !== phase) {
    const error = new Error(`Phase transaction authorization is stale: expected ${phase}, got ${authorization.phase}`);
    error.code = 'AUTHORIZATION_STALE';
    throw error;
  }
  if (item) {
    if (authorization.workItemId !== item.id) {
      const error = new Error('Phase transaction authorization Work item does not match');
      error.code = 'AUTHORIZATION_STALE';
      throw error;
    }
  } else if (phase !== 'plan' || authorization.workItemId !== null || authorization.action !== 'start-request') {
    const error = new Error('Initial Plan transaction requires a start-request authorization without a Work item');
    error.code = 'AUTHORIZATION_STALE';
    throw error;
  }
  return authorization;
}

function failureEvidence(projectRoot, item, phase, id, error) {
  if (!item || !PHASE_FOLDERS[phase]) return null;
  const filePath = path.join(phaseDirectory(projectRoot, item, phase), 'evidence', 'transactions', `${id}.failure.json`);
  atomicWrite(filePath, `${JSON.stringify({
    schema: 'phase-transaction-failure/v1', transactionId: id, workItemId: item.id, phase,
    code: error.code || 'TRANSACTION_REJECTED', finding: String(error.message || error).slice(0, 500),
    ...(error.preflight ? { preflight: error.preflight } : {}),
    recordedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  return normalizeRelative(projectRoot, filePath);
}

// Version stamp on every receipt: which plugin, Node, and Claude Code produced this transaction.
// Lets a later reader trace behaviour changes to a runtime change instead of guessing.
function runtimeStamp(env = process.env) {
  let plugin = null;
  try {
    plugin = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'package.json'), 'utf8')).version || null;
  } catch (_) { /* unknown plugin version */ }
  return {
    plugin,
    node: process.version,
    claudeCode: env.CLAUDE_CODE_VERSION ? String(env.CLAUDE_CODE_VERSION) : null,
  };
}

function makeReceipt(projectRoot, item, phase, action, verdict, evidence) {
  const continuation = phase === 'do' && verdict === 'READY'
    ? { automatic: true, nextAction: 'review-evidence-prepare', requiresUserTurn: false }
    : null;
  const receipt = assertContract('phaseTransactionReceipt', {
    schema: 'phase-transaction/v1', id: evidence.id, workItemId: item.id, phase, action, verdict,
    next: { phase: item.phase, status: item.status }, evidencePath: evidence.path, findingPath: null,
    ...(continuation ? { continuation } : {}),
    runtime: runtimeStamp(),
  });
  const bytes = Buffer.byteLength(JSON.stringify(receipt), 'utf8');
  if (bytes > RECEIPT_LIMITS[item.scale]) throw new Error(`Transaction receipt ${bytes}B exceeds stdout limit`);
  return receipt;
}

function runPhaseTransaction(projectRoot, input) {
  const root = path.resolve(projectRoot);
  const phase = String(input.phase || '');
  const action = String(input.action || ACTIONS[phase] || '');
  if (ACTIONS[phase] !== action) throw new Error(`Expected ${phase || '<phase>'} ${ACTIONS[phase] || '<action>'}`);
  const sessionId = String(input.sessionId || input.session || '').trim();
  if (!sessionId) throw new Error('Phase transaction sessionId is required');
  const transactionId = `PT-${crypto.randomUUID()}`;
  const store = new WorkItemStore(root);
  let item = input.id ? store.get(String(input.id)) : store.getCurrent();
  const createsInitialPlan = !item && phase === 'plan';
  let documentPath = null;
  let previousDocument = null;
  let documentWritten = false;
  let evaluatedGate = null;
  let auxiliarySnapshots = [];
  let transientSnapshots = [];
  let preparedEvidencePath = null;
  let stateApplied = false;
  let requiredSpecialists = input.requiredSpecialists || [];
  let writeScopes = input.writeScopes || input.scope || [];
  let readinessChecks = input.readinessChecks || [];
  let reviewChecks = input.reviewChecks || [];
  try {
    if (!Number.isInteger(input.revision) || input.revision < 1) {
      const error = new Error('Phase transaction requires an explicit positive integer revision');
      error.code = 'REVISION_REQUIRED';
      throw error;
    }
    assertTransactionAuthorization(root, input, item, phase, sessionId);
    const kindId = createsInitialPlan ? String(input.kind || loadChainCatalog().defaultKind) : null;
    if (createsInitialPlan) {
      // Entry lock: a stage kind may start only after the previous stage is approved.
      assertStageEntry(root, kindOf({ kind: kindId }));
      item = createInitialWorkItem({
        id: input.id,
        title: input.title,
        primaryFeature: input.primaryFeature || input.feature,
        affectedFeatures: input.affectedFeatures || [],
        scale: input.scale,
        kind: kindId,
      }, input.timestamp);
      assertContract('workItem', item);
    }
    if (!item) throw new Error('Phase transaction Work item is missing');
    if (item.phase !== phase || item.status !== 'active') throw new Error(`Transaction requires ${phase}/active; current state is ${item.phase}/${item.status}`);
    // A Design that returns from QA or from the screen check is a checkpoint, not a new proposal.
    const repairDesign = phase === 'design' && (item.qaRepairCount > 0 || (item.screenRevisionCount || 0) > 0) && item.approvals.design === 'approved';
    const currentRevision = phase === 'plan' ? item.planRevision : item.designRevision;
    if (input.revision !== currentRevision) throw new Error('Phase transaction revision is stale');
    if (!createsInitialPlan) store.acquireLease(item.id, sessionId, input.timestamp);
    if (phase === 'design') {
      const kind = kindOf(item);
      if (isStageKind(kind)) {
        if (writeScopes.length === 0) writeScopes = [...kind.autoWriteScopes];
        const productRoot = `${loadChainCatalog().productRoot}/`;
        for (const scope of writeScopes) {
          if (!String(scope).startsWith(productRoot)) throw new Error(`Stage kind write scope must stay under ${productRoot}: ${scope}`);
        }
      }
      writeScopes = canonicalWriteScopes(root, writeScopes);
      readinessChecks = canonicalToolChecks(readinessChecks, 'readiness');
      reviewChecks = canonicalToolChecks(reviewChecks, 'Review');
      requiredSpecialists = canonicalDoSpecialists(requiredSpecialists);
      enforceSpecialistBudget(item.scale, requiredSpecialists);
    }
    let qaPrecondition = null;
    if (phase === 'review') qaPrecondition = assertContract('checkResult', independentQaCheck(store, item));
    const body = phase === 'report' ? reportBody(root, item, input) : readBody(root, input, item, phase);
    documentPath = phaseDocumentPath(root, item, phase);
    previousDocument = fs.existsSync(documentPath) ? fs.readFileSync(documentPath) : null;
    const documentOptions = {
      status: 'draft', basedOn: input.basedOn || [],
      materialChange: input.materialChange === true, budgetException: input.budgetException,
      budgetApprovedBy: input.budgetApprovedBy,
    };
    const preparedDocument = preparePhaseDocument(root, item, phase, body, documentOptions);
    const preflightChecks = documentPreflightChecks(root, item, phase, preparedDocument);
    const documentFailures = preflightChecks.filter(result => result.verdict !== 'pass');
    if (documentFailures.length > 0) {
      const error = new Error(`Canonical ${phase} document preflight failed: ${documentFailures.map(result => result.check).join(', ')}`);
      error.code = 'DOCUMENT_PREFLIGHT_FAILED';
      error.preflight = {
        schema: 'document-preflight/v1',
        phase,
        path: normalizeRelative(root, preparedDocument.filePath),
        checks: preflightChecks,
      };
      throw error;
    }
    if (createsInitialPlan) {
      item = store.create({
        id: input.id,
        title: input.title,
        primaryFeature: input.primaryFeature || input.feature,
        affectedFeatures: input.affectedFeatures || [],
        scale: input.scale,
        kind: kindId,
      }, input.timestamp);
      store.acquireLease(item.id, sessionId, input.timestamp);
    }
    writePreparedPhaseDocument(preparedDocument);
    documentWritten = true;
    let results = persistDocumentChecks(root, item, phase, preflightChecks);
    let gate;
    let event;
    let next;
    if (phase === 'plan') {
      gate = evaluateGate('plan', results.map(value => value.check), results);
      event = EVENTS.PLAN_PRESENTED;
    } else if (phase === 'design') {
      gate = evaluateGate('design', results.map(value => value.check), results);
      event = repairDesign ? EVENTS.DESIGN_CHECKPOINT_COMPLETED : EVENTS.DESIGN_PRESENTED;
    } else if (phase === 'do') {
      const handoffs = assertContract('checkResult', specialistCheck(store, item));
      persistCheck(root, item, phase, handoffs);
      const builtin = builtinChecks(root, item, 'do');
      for (const check of builtin) persistCheck(root, item, phase, check);
      results = [...results, handoffs, ...builtin, ...runMechanicalChecks(root, item, phase, item.readinessChecks, store, input)];
      gate = evaluateGate('readiness', results.map(value => value.check), results);
      event = { READY: EVENTS.READINESS_READY, NOT_READY: EVENTS.READINESS_NOT_READY, BLOCKED: EVENTS.READINESS_BLOCKED }[gate.verdict];
    } else if (phase === 'review') {
      persistCheck(root, item, phase, qaPrecondition);
      const builtin = builtinChecks(root, item, 'review');
      for (const check of builtin) persistCheck(root, item, phase, check);
      results = [...results, qaPrecondition, ...builtin, ...runMechanicalChecks(root, item, phase, item.reviewChecks, store, input, { reuseOnly: true })];
      gate = evaluateGate('review', [
        ...results.filter(value => !item.reviewChecks.includes(value.check)).map(value => value.check),
        ...item.reviewChecks,
      ], results);
      event = { PASS: EVENTS.QA_PASS, FAIL: EVENTS.QA_FAIL, BLOCKED: EVENTS.QA_BLOCKED }[gate.verdict];
    } else {
      const transient = assertContract('checkResult', transientDraftCheck(root, item));
      persistCheck(root, item, phase, transient);
      results = [...results, transient];
      if (transient.verdict !== 'pass') {
        gate = evaluateGate('report', results.map(value => value.check), results);
        event = EVENTS.REPORT_FAILED;
      }
      const paths = [
        ...featureIds(item).map(feature => featureIndexPath(root, feature)),
        path.join(root, 'docs', 'README.md'),
      ];
      const stage = stageOfKind(kindOf(item));
      if (stage) paths.unshift(path.resolve(root, stage.file), indexPath(root));
      auxiliarySnapshots = paths.map(filePath => ({
        filePath, previous: fs.existsSync(filePath) ? fs.readFileSync(filePath) : null,
      }));
      if (!gate) {
        // Stage kinds: the accepted stage document becomes approved and its item hashes are
        // recorded as the stale baseline for every downstream stage.
        if (stage) approveStage(root, stage, { workItem: item.id, timestamp: input.timestamp });
        writeFeatureIndexes(root, item);
        writeMaster(root);
        const indexes = assertContract('checkResult', checkReportArtifacts(root, item));
        persistCheck(root, item, phase, indexes);
        results = [...results, indexes];
        gate = evaluateGate('report', results.map(value => value.check), results);
        event = gate.verdict === 'PASS' ? EVENTS.REPORT_VALIDATED : EVENTS.REPORT_FAILED;
      }
    }
    assertContract('gateResult', gate);
    evaluatedGate = gate;
    if (gate.verdict === 'PASS' && ['plan', 'design'].includes(phase)) {
      const documentStatus = repairDesign && input.materialChange !== true ? 'approved' : 'waiting-user';
      writePhaseDocument(root, item, phase, body, {
        status: documentStatus, basedOn: input.basedOn || [], budgetException: input.budgetException,
        budgetApprovedBy: input.budgetApprovedBy,
      });
    }
    const designScopePayload = { writeScopes, readinessChecks, reviewChecks, requiredSpecialists };
    const transitionPayload = repairDesign
      ? { material: input.materialChange === true, gateResult: gate }
      : { gateResult: gate, reason: input.reason };
    const promotesCanonical = (['plan', 'design'].includes(phase) && gate.verdict === 'PASS') ||
      (phase === 'do' && gate.verdict === 'READY') || phase === 'review' ||
      (phase === 'report' && gate.verdict === 'PASS');
    if (promotesCanonical) transientSnapshots = cleanupPromotedDrafts(root, item, input.bodyFile);
    let preview = item;
    if (phase === 'design') preview = transition(preview, EVENTS.DESIGN_SCOPE_DEFINED, designScopePayload, input.timestamp);
    preview = transition(preview, event, transitionPayload, input.timestamp);

    // Prepare every fallible receipt artifact before committing the state event. Once
    // apply/applySequence returns, returning the already-validated receipt cannot leave
    // a committed transition without its canonical evidence.
    preparedEvidencePath = path.join(phaseDirectory(root, item, phase), 'evidence', 'transactions', `${transactionId}.json`);
    const evidence = { id: transactionId, path: normalizeRelative(root, preparedEvidencePath) };
    const receipt = makeReceipt(root, preview, phase, action, gate.verdict, evidence);
    atomicWrite(preparedEvidencePath, `${JSON.stringify({ schema: 'phase-transaction-evidence/v1', id: transactionId, workItemId: item.id,
      phase, action, gate, checks: results, next: { phase: preview.phase, status: preview.status } }, null, 2)}\n`);

    const applyOptions = {
      requireLease: true,
      sessionId,
      timestamp: input.timestamp,
      repoSnapshotFactory: () => captureRepoSnapshot(root),
      snapshotReason: `phase-transaction-${phase}`,
      transactionId,
    };
    if (phase === 'design') {
      next = store.applySequence(item.id, [{ event: EVENTS.DESIGN_SCOPE_DEFINED, payload: designScopePayload },
        { event, payload: transitionPayload }], applyOptions);
    } else {
      next = store.apply(item.id, event, {
        gateResult: gate, reason: input.reason,
        ...(phase === 'report' ? { limitations: (input.limitations || []).map(value => String(value)) } : {}),
      }, applyOptions);
    }
    stateApplied = true;
    return receipt;
  } catch (error) {
    if (preparedEvidencePath && !stateApplied) {
      try { fs.unlinkSync(preparedEvidencePath); } catch (_) { /* Best-effort rollback; the failure receipt remains authoritative. */ }
    }
    const keepRejectedDraft = evaluatedGate && ['plan', 'design', 'report'].includes(phase) && evaluatedGate.verdict !== 'PASS';
    if (documentWritten && documentPath && !keepRejectedDraft) {
      try {
        if (previousDocument === null) fs.unlinkSync(documentPath);
        else atomicWrite(documentPath, previousDocument);
      } catch (_) { /* Preserve the transaction error; failure evidence remains canonical. */ }
    }
    for (const snapshot of auxiliarySnapshots.reverse()) {
      try {
        if (snapshot.previous === null) {
          if (fs.existsSync(snapshot.filePath)) fs.unlinkSync(snapshot.filePath);
        } else atomicWrite(snapshot.filePath, snapshot.previous);
      } catch (_) { /* Preserve the transaction error. */ }
    }
    if (!stateApplied) {
      for (const snapshot of transientSnapshots.reverse()) {
        try { atomicWrite(snapshot.filePath, snapshot.previous); } catch (_) { /* Preserve the transaction error. */ }
      }
    }
    let findingPath = null;
    try { findingPath = failureEvidence(root, item, phase, transactionId, error); } catch (_) { /* Preserve the original transaction failure. */ }
    if (findingPath) {
      error.evidencePath = findingPath;
      error.message = `${String(error.message).slice(0, 350)} (evidence: ${findingPath})`;
    }
    throw error;
  }
}

module.exports = { ACTIONS, RECEIPT_LIMITS, REPORT_OUTCOME_LIMIT, reportBody, runtimeStamp, canonicalDoSpecialists, canonicalWriteScopes, canonicalToolChecks, screenCaptureCheck, exportCommittedApp,
  enforceSpecialistBudget, runMechanicalChecks, prepareReviewEvidence, independentQaCheck,
  assertTransactionAuthorization, runPhaseTransaction, reportBody, documentChecks, documentPreflightChecks };
