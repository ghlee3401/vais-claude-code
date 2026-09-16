'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const READ_ONLY_COMMANDS = [
  /^\s*(?:rg|grep|find|ls|pwd|cat|head|tail|wc|stat|which)\b/,
  /^\s*git(?:\s+-C\s+\S+)?\s+(?:status|diff|log|show|rev-parse|ls-files|remote\s+get-url)\b/,
  /^\s*(?:node|npm|npx)\s+--version\s*$/,
  /^\s*node\s+scripts\/vais-doctor\.js(?:\s|$)/,
  /^\s*npm\s+run\s+doctor\s*$/,
];

// Runtime CLI subcommands that only read state and therefore need no session authorization.
// `/vais doctor` is a read-only prompt action, which revokes the session authorization, so the
// doctor command must be reachable without one.
const UNAUTHENTICATED_RUNTIME_COMMANDS = Object.freeze([
  /^doctor(?:\s|$)/,
  /^stage\s+status(?:\s|$)/,
]);

// Claude Code's per-session scratchpad lives under the OS temp directory (claude-<uid>/...).
// Writing there never touches the project, so it needs no managed authorization.
const SCRATCH_ROOTS = Object.freeze([...new Set([
  path.resolve(os.tmpdir()),
  '/tmp',
])]);

function isScratchPath(filePath) {
  if (!filePath || !path.isAbsolute(String(filePath))) return false;
  const resolved = path.resolve(String(filePath));
  return SCRATCH_ROOTS.some(root => {
    const relative = path.relative(root, resolved);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative) && /^claude-[^/\\]+/.test(relative);
  });
}

const SAFE_GIT_BRANCH = /^\s*git\s+branch(?:\s+(?:(?:--list|--show-current|-a|-r|-v|-vv)(?:\s+[^\s-][^\s]*)?))*\s*$/;

const SAFE_SED_READ = /^\s*sed\s+-n\s+(?:'|")?[0-9]+(?:,[0-9]+)?p(?:'|")?\s+[A-Za-z0-9_./-]+\s*$/;

const CHECK_COMMANDS = [
  /^\s*(?:npm|pnpm|yarn)\s+(?:test|run\s+(?:test|lint|build|typecheck|regression))\b/,
  /^\s*node\s+--test\b/,
  /^\s*npx\s+eslint\b/,
  /^\s*node\s+scripts\/vais-validate-plugin\.js\b/,
];

const INTERNAL_COMMANDS = [
  /^\s*node\s+"?\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/vais-workflow-v2\.js"?(?:\s|$)/,
];

const PUBLIC_RUNTIME_COMMANDS = Object.freeze([
  /^status(?:\s|$)/,
  /^search(?:\s|$)/,
  /^context(?:\s|$)/,
  /^assignment(?:\s|$)/,
  /^handoff(?:\s|$)/,
  /^plan\s+present(?:\s|$)/,
  /^design\s+present(?:\s|$)/,
  /^do\s+ready(?:\s|$)/,
  /^review\s+prepare(?:\s|$)/,
  /^review\s+decide(?:\s|$)/,
  /^report\s+finalize(?:\s|$)/,
  /^doctor(?:\s|$)/,
  /^stage\s+(?:status|confirm|reindex)(?:\s|$)/,
  /^screens\s+capture(?:\s|$)/,
]);

const UNSAFE_SHELL_SYNTAX = /(?:&&|\|\||[|;<>`\n\r]|\$\()/;
const UNSAFE_READ_FLAGS = /(?:^|\s)(?:-delete|-exec|-execdir|-ok|-okdir|-fls|-fprint|-fprint0|-fprintf|--pre)(?:[=\s]|$)/;
const UNSAFE_WRITE_FLAGS = /(?:^|\s)(?:--output|--output-file|--fix|--write|--cache|--cache-location|--updateSnapshot|--update-snapshot|--test-reporter-destination|-o|-u)(?:[=\s]|$)/;
const UNSAFE_GIT_EXEC_FLAGS = /(?:^|\s)(?:--ext-diff|--textconv)(?:[=\s]|$)/;

function normalizeRelative(projectRoot, candidate) {
  if (!candidate) return null;
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(root, candidate);
  const lexical = path.relative(root, resolved).split(path.sep).join('/');
  if (!lexical || lexical === '..' || lexical.startsWith('../') || path.isAbsolute(lexical)) return null;

  // Some policy callers operate on a not-yet-created project root. In that
  // case lexical containment is the strongest available check. Once the root
  // exists, resolve the nearest existing ancestor to prevent symlink escapes.
  if (!fs.existsSync(root)) return lexical;
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) return null;
    ancestor = parent;
  }
  let realRoot;
  let realAncestor;
  try {
    realRoot = fs.realpathSync(root);
    realAncestor = fs.realpathSync(ancestor);
  } catch (_) {
    return null;
  }
  const realCandidate = path.resolve(realAncestor, path.relative(ancestor, resolved));
  const relative = path.relative(realRoot, realCandidate).split(path.sep).join('/');
  if (!relative || relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) return null;
  return relative;
}

function pathMatches(relativePath, pattern) {
  const clean = String(pattern || '').replace(/^\.\//, '').replace(/\\/g, '/');
  if (!clean) return false;
  if (clean.endsWith('/**')) return relativePath === clean.slice(0, -3) || relativePath.startsWith(clean.slice(0, -2));
  if (clean.endsWith('/')) return relativePath.startsWith(clean);
  return relativePath === clean;
}

function scopeWithin(candidate, approved) {
  if (candidate === approved) return true;
  if (!approved.endsWith('/**')) return false;
  const base = approved.slice(0, -3);
  return candidate.startsWith(`${base}/`);
}

// Only two spellings of the runtime CLI are trusted: the plugin-root placeholder and the
// exact prefixes the runtime itself handed out (session authorization, or the guard's own
// install path passed as options.trustedRuntimePrefixes). An arbitrary path that merely ends
// in vais-workflow-v2.js is not a runtime command.
function runtimeCommandTail(command, authorization, options = {}) {
  const trimmed = String(command || '').trim();
  const prefixes = [...(authorization?.allowedCommands || []), ...(options.trustedRuntimePrefixes || [])]
    .map(value => String(value).trim())
    .filter(prefix => /vais-workflow-v2\.js"?$/.test(prefix));
  const configured = prefixes.find(prefix => trimmed === prefix || trimmed.startsWith(`${prefix} `));
  if (configured) return trimmed.slice(configured.length).trim();
  const builtIn = trimmed.match(/^node\s+"?\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/vais-workflow-v2\.js"?(?:\s+([\s\S]*))?$/);
  return builtIn ? String(builtIn[1] || '').trim() : null;
}

function isUnauthenticatedRuntimeCommand(tail) {
  return tail !== null && UNAUTHENTICATED_RUNTIME_COMMANDS.some(pattern => pattern.test(tail));
}

function isPublicRuntimeCommand(command, authorization) {
  const tail = runtimeCommandTail(command, authorization);
  return tail !== null && PUBLIC_RUNTIME_COMMANDS.some(pattern => pattern.test(tail));
}

function authorizeFilePath(projectRoot, filePath, authorization) {
  if (isScratchPath(filePath)) return { allowed: true, kind: 'scratch-write' };
  if (!authorization) return { allowed: false, reason: 'A managed /vais authorization is required' };
  const relative = normalizeRelative(projectRoot, filePath);
  if (!relative) return { allowed: false, reason: 'Path is outside the project or invalid' };
  const allowed = authorization.allowedPaths.some(pattern => pathMatches(relative, pattern));
  return allowed
    ? { allowed: true, kind: 'file-write', relativePath: relative }
    : { allowed: false, kind: 'file-write', reason: `Path is outside the approved write scope: ${relative}`, relativePath: relative };
}

function defaultAllowedPaths(workItem) {
  if (!workItem) return ['.vais/v2/drafts/**'];
  const topFeature = String(workItem.primaryFeature || '').split('/')[0];
  const folder = String(workItem.id || '').replace(/^WI-/, '');
  const base = `docs/work-items/${topFeature}/${folder}`;
  const common = [];
  const byPhase = {
    plan: [`${base}/01-plan/**`],
    design: [`${base}/02-design/**`],
    do: [`${base}/03-do/**`, ...(workItem.writeScopes || [])],
    review: [`${base}/04-review/**`],
    report: [`${base}/05-report/**`],
  };
  return [...common, ...(byPhase[workItem.phase] || [])];
}

function classifyCommand(command) {
  const value = String(command || '');
  if (SAFE_SED_READ.test(value)) return 'read-only';
  if (SAFE_GIT_BRANCH.test(value)) return 'read-only';
  if (READ_ONLY_COMMANDS.some(pattern => pattern.test(value))) return 'read-only';
  if (CHECK_COMMANDS.some(pattern => pattern.test(value))) return 'check';
  return 'mutation-or-unknown';
}

function authorizeCommand(command, authorization, options = {}) {
  const value = String(command || '');
  if (UNSAFE_SHELL_SYNTAX.test(value)) {
    return { allowed: false, kind: 'composed-or-unsafe', reason: 'Shell composition, redirection, command substitution, and mutating find actions are not allowed' };
  }
  const runtimeTail = runtimeCommandTail(value, authorization, options);
  if (runtimeTail !== null || INTERNAL_COMMANDS.some(pattern => pattern.test(value))) {
    if (isUnauthenticatedRuntimeCommand(runtimeTail)) return { allowed: true, kind: 'read-only' };
    if (!authorization) {
      return { allowed: false, kind: 'workflow-control', reason: 'A managed /vais authorization is required' };
    }
    return isPublicRuntimeCommand(value, authorization)
      ? { allowed: true, kind: 'workflow-control' }
      : { allowed: false, kind: 'workflow-control', reason: 'Legacy or unknown workflow mutation command is not public in enforce mode' };
  }
  if (UNSAFE_READ_FLAGS.test(value) || UNSAFE_WRITE_FLAGS.test(value) || UNSAFE_GIT_EXEC_FLAGS.test(value)) {
    return { allowed: false, kind: 'composed-or-unsafe', reason: 'Shell composition, redirection, command substitution, and mutating find actions are not allowed' };
  }
  const kind = classifyCommand(value);
  if (kind === 'read-only') return { allowed: true, kind };
  if (kind === 'check') {
    return authorization
      ? { allowed: true, kind }
      : { allowed: false, kind, reason: 'Checks that may create caches require a managed /vais authorization' };
  }
  if (!authorization) return { allowed: false, kind, reason: 'A managed /vais authorization is required' };
  const allowed = authorization.allowedCommands.some(prefix => String(command || '').trim().startsWith(prefix));
  return allowed
    ? { allowed: true, kind, needsPostDiff: true }
    : { allowed: false, kind, reason: 'Command is not in the Design-approved command scope' };
}

module.exports = {
  READ_ONLY_COMMANDS,
  CHECK_COMMANDS,
  INTERNAL_COMMANDS,
  PUBLIC_RUNTIME_COMMANDS,
  UNAUTHENTICATED_RUNTIME_COMMANDS,
  isUnauthenticatedRuntimeCommand,
  SAFE_SED_READ,
  SAFE_GIT_BRANCH,
  UNSAFE_SHELL_SYNTAX,
  UNSAFE_READ_FLAGS,
  UNSAFE_WRITE_FLAGS,
  UNSAFE_GIT_EXEC_FLAGS,
  SCRATCH_ROOTS,
  isScratchPath,
  normalizeRelative,
  pathMatches,
  scopeWithin,
  runtimeCommandTail,
  isPublicRuntimeCommand,
  defaultAllowedPaths,
  authorizeFilePath,
  classifyCommand,
  authorizeCommand,
};
