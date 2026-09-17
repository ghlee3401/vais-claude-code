'use strict';

// `/vais 저장` and `/vais 되돌리기` (docs/harness/design.md §7). The runtime touches git in
// exactly three ways — `add -A`, `commit`, `revert --no-edit` — and only after the user typed
// the confirmation sentence in this session (AuthorizationStore.confirmations). Never push.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { AuthorizationStore } = require('./authorization-store');
const { WorkItemStore } = require('./work-item-store');
const { versionFiles } = require('./doctor');
const { kindOf } = require('./chain-registry');

const MAX_LISTED_FILES = 20;

// `raw: true` keeps the output untrimmed: porcelain status lines start with a status column
// whose leading space must survive (otherwise the first path loses its leading dot).
function git(projectRoot, args, options = {}) {
  const { raw = false, ...spawnOptions } = options;
  const output = execFileSync('git', args, {
    cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024, ...spawnOptions,
  });
  return raw ? output : output.trim();
}

function isGitRepo(projectRoot) {
  try {
    return git(projectRoot, ['rev-parse', '--is-inside-work-tree']) === 'true';
  } catch (_) {
    return false;
  }
}

// Runtime state under .vais/ is never part of a save (the repository ignores it; a project
// without that ignore rule must not start committing it by accident).
const STATE_PREFIX = '.vais/';

const PORCELAIN_LINE = /^(..)\s(.*)$/;

function changedFiles(projectRoot) {
  const output = git(projectRoot, ['status', '--porcelain', '-uall'], { raw: true });
  return output.split('\n')
    .map(line => PORCELAIN_LINE.exec(line.replace(/\r$/, '')))
    .filter(Boolean)
    .map(match => ({ status: match[1].trim() || '??', file: match[2].trim() }))
    .filter(entry => entry.file && !entry.file.startsWith(STATE_PREFIX));
}

function stagedCount(projectRoot) {
  try {
    const output = git(projectRoot, ['diff', '--cached', '--name-only']);
    return output ? output.split('\n').filter(Boolean).length : 0;
  } catch (_) {
    return 0;
  }
}

function readVersion(projectRoot, file, pattern) {
  try {
    const match = fs.readFileSync(path.join(projectRoot, file), 'utf8').match(pattern);
    return match ? match[1] : undefined;
  } catch (_) {
    return undefined;
  }
}

// The five manifest fields doctor already checks plus the README badge and CHANGELOG head.
function versionReport(projectRoot) {
  const versions = {
    ...versionFiles(projectRoot),
    'README.md#badge': readVersion(projectRoot, 'README.md', /version-(\d+\.\d+\.\d+)-blue/),
    'CHANGELOG.md#head': readVersion(projectRoot, 'CHANGELOG.md', /^## \[(\d+\.\d+\.\d+)\]/m),
  };
  const values = Object.values(versions).map(value => value ?? '<없음>');
  const distinct = [...new Set(values)];
  // The most common value is the intended version; everything else is a mismatch to report.
  const majority = distinct.sort((left, right) => values.filter(value => value === right).length - values.filter(value => value === left).length)[0];
  const mismatches = Object.entries(versions).filter(([, value]) => (value ?? '<없음>') !== majority).map(([file, value]) => `${file}=${value ?? '<없음>'}`);
  return { versions, distinct, majority, mismatches, synced: distinct.length === 1 && distinct[0] !== '<없음>', version: distinct.length === 1 ? distinct[0] : null };
}

function commitType(item) {
  const kind = kindOf(item)?.id || 'feature';
  if (kind === 'harness') return 'feat(harness)';
  if (kind === 'ui') return 'style';
  if (kind === 'bug') return 'fix';
  if (kind.startsWith('stage-')) return 'docs(product)';
  return 'feat';
}

function recentItems(projectRoot) {
  const registry = new WorkItemStore(projectRoot).readRegistry();
  const items = Object.values(registry.workItems || {}).sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return { completed: items.filter(item => item.status === 'completed'), active: items.filter(item => ['active', 'waiting-user', 'blocked'].includes(item.status)) };
}

function buildMessage(projectRoot, options = {}) {
  const { completed, active } = recentItems(projectRoot);
  const latest = completed[0] || null;
  const report = versionReport(projectRoot);
  const subject = options.message
    ? String(options.message).split('\n')[0].slice(0, 120)
    : latest ? `${commitType(latest)}: ${latest.title}${report.version ? ` (${report.version})` : ''}` : `chore: 작업 저장${report.version ? ` (${report.version})` : ''}`;
  const files = changedFiles(projectRoot);
  const body = [
    ...(options.message && String(options.message).includes('\n') ? [String(options.message).split('\n').slice(1).join('\n').trim(), ''] : []),
    `변경 파일 ${files.length}개${files.length > MAX_LISTED_FILES ? ` (처음 ${MAX_LISTED_FILES}개)` : ''}:`,
    ...files.slice(0, MAX_LISTED_FILES).map(entry => `- ${entry.file}`),
    '',
    ...[...(latest ? [latest] : []), ...active].map(item => `Work-Item: ${item.id}`),
    `Generated-By: vais-code ${report.version || 'unknown'}`,
  ];
  return { subject, body: body.join('\n'), full: `${subject}\n\n${body.join('\n')}\n`, latest, active };
}

function saveProposal(projectRoot, options = {}) {
  if (!isGitRepo(projectRoot)) return { ok: false, reason: 'git 저장소가 아니라 저장할 수 없다', versions: null, changedFiles: [], warnings: [] };
  const report = versionReport(projectRoot);
  const files = changedFiles(projectRoot);
  const message = buildMessage(projectRoot, options);
  const warnings = [];
  if (message.active.length) warnings.push(`진행 중 작업 ${message.active.map(item => `${item.id}(${item.phase}/${item.status})`).join(', ')} 의 문서가 함께 저장된다`);
  return {
    ok: report.synced && files.length > 0,
    reason: !report.synced ? `버전이 어긋나 저장하지 않는다 (기준 ${report.majority}): ${report.mismatches.join(', ')}` : files.length === 0 ? '저장할 변경이 없다' : null,
    versions: report.versions, version: report.version, synced: report.synced, mismatches: report.mismatches,
    changedFiles: files.map(entry => `${entry.status} ${entry.file}`),
    suggestedMessage: message.full, subject: message.subject, warnings,
    confirmWith: '/vais 저장 확인' + (options.message ? '' : ' (다른 메시지: `/vais 저장 확인: <메시지>`)'),
  };
}

function requireConfirmation(projectRoot, sessionId, matcher, hint) {
  const authorization = new AuthorizationStore(projectRoot).get(sessionId);
  const confirmed = (authorization?.confirmations || []).some(matcher);
  if (!confirmed) {
    const error = new Error(`사용자가 이 세션에서 \`${hint}\` 를 직접 입력해야 실행할 수 있다`);
    error.code = 'CONFIRMATION_REQUIRED';
    throw error;
  }
}

function commitSave(projectRoot, options = {}) {
  requireConfirmation(projectRoot, options.sessionId, entry => entry.type === 'save', '/vais 저장 확인');
  const proposal = saveProposal(projectRoot, options);
  if (!proposal.ok) {
    const error = new Error(proposal.reason);
    error.code = 'SAVE_REFUSED';
    throw error;
  }
  const messageFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vais-commit-')), 'message.txt');
  let step = 'add';
  try {
    fs.writeFileSync(messageFile, proposal.suggestedMessage);
    // `git add -A -- .` honours .gitignore. An exclude pathspec for .vais/ is not used: when the
    // repository already ignores .vais/, git reports the pathspec as ignored and exits 1.
    git(projectRoot, ['add', '-A', '--', '.']);
    // Projects without the ignore rule must still never commit runtime state.
    git(projectRoot, ['rm', '-r', '--cached', '-q', '--ignore-unmatch', '--', STATE_PREFIX.replace(/\/$/, '')]);
    step = 'commit';
    git(projectRoot, ['commit', '-q', '-F', messageFile]);
  } catch (error) {
    const staged = stagedCount(projectRoot);
    const cause = String(error.stderr || error.message || '').trim().split('\n').filter(Boolean).slice(-1)[0] || error.message;
    const failure = new Error(`커밋되지 않았다 — ${step === 'add' ? '파일을 스테이지하는 중' : `스테이지 ${staged}개 됨 · 커밋 단계에서`} 실패: ${cause}. 파일은 그대로 있고 되돌릴 것은 없다`);
    failure.code = 'SAVE_FAILED';
    failure.staged = staged;
    failure.step = step;
    throw failure;
  } finally {
    fs.rmSync(path.dirname(messageFile), { recursive: true, force: true });
  }
  const hash = git(projectRoot, ['rev-parse', 'HEAD']);
  return { schema: 'vcs-save/v1', hash, subject: proposal.subject, files: proposal.changedFiles.length, version: proposal.version, warnings: proposal.warnings };
}

function commitFiles(projectRoot, hash) {
  const output = git(projectRoot, ['show', '--name-only', '--format=', hash]);
  return output ? output.split('\n').filter(Boolean) : [];
}

// A Work item id resolves to every commit that mentions it; a hash resolves to itself.
function revertProposal(projectRoot, target) {
  if (!isGitRepo(projectRoot)) return { ok: false, target, reason: 'git 저장소가 아니라 되돌릴 수 없다', commits: [], warnings: [] };
  const value = String(target || '').trim();
  let hashes = [];
  if (/^WI-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(value)) {
    const output = git(projectRoot, ['log', '--format=%H', `--grep=${value}`, '--fixed-strings']);
    hashes = output ? output.split('\n').filter(Boolean) : [];
  } else if (/^[0-9a-f]{7,40}$/i.test(value)) {
    try {
      hashes = [git(projectRoot, ['rev-parse', '--verify', `${value}^{commit}`])];
    } catch (_) {
      hashes = [];
    }
  } else {
    return { ok: false, target: value, reason: '대상은 작업 ID(WI-…) 또는 커밋 해시여야 한다', commits: [], warnings: [] };
  }
  if (hashes.length === 0) return { ok: false, target: value, reason: `되돌릴 커밋을 찾지 못했다: ${value}`, commits: [], warnings: [] };
  const commits = hashes.map(hash => ({ hash, subject: git(projectRoot, ['log', '-1', '--format=%s', hash]), files: commitFiles(projectRoot, hash) }));
  const warnings = [];
  if (commits.some(commit => commit.files.some(file => /\/05-report\/main\.md$/.test(file)))) warnings.push('완료 Report 문서가 포함된 커밋이다 — 되돌리면 그 작업의 동결 기록도 사라진다');
  if (changedFiles(projectRoot).length) warnings.push('미커밋 변경이 있다. 먼저 `/vais 저장` 하거나 정리한 뒤 되돌린다');
  return { ok: true, target: value, commits, warnings, confirmWith: `/vais 되돌리기 확인: ${value}` };
}

function revertCommits(projectRoot, options = {}) {
  const target = String(options.target || '').trim();
  requireConfirmation(projectRoot, options.sessionId, entry => entry.type === 'revert' && String(entry.target) === target, `/vais 되돌리기 확인: ${target}`);
  const proposal = revertProposal(projectRoot, target);
  if (!proposal.ok) {
    const error = new Error(proposal.reason);
    error.code = 'REVERT_REFUSED';
    throw error;
  }
  if (changedFiles(projectRoot).length) {
    const error = new Error('미커밋 변경이 있어 되돌리지 않는다. 먼저 `/vais 저장` 한다');
    error.code = 'REVERT_REFUSED';
    throw error;
  }
  const reverted = [];
  for (const commit of proposal.commits) {
    try {
      git(projectRoot, ['revert', '--no-edit', commit.hash]);
      reverted.push({ hash: commit.hash, revertedBy: git(projectRoot, ['rev-parse', 'HEAD']) });
    } catch (error) {
      try { git(projectRoot, ['revert', '--abort']); } catch (_) { /* nothing to abort */ }
      const failure = new Error(`되돌리기 중단: ${commit.hash.slice(0, 7)} — ${String(error.stderr || error.message).trim().split('\n').pop()}. 이미 되돌린 ${reverted.length}개는 그대로 남는다`);
      failure.code = 'REVERT_FAILED';
      failure.reverted = reverted;
      throw failure;
    }
  }
  return { schema: 'vcs-revert/v1', target, reverted, head: git(projectRoot, ['rev-parse', 'HEAD']) };
}

module.exports = { git, isGitRepo, changedFiles, versionReport, buildMessage, saveProposal, requireConfirmation, commitSave, revertProposal, revertCommits };
