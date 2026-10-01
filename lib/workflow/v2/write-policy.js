'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { segmentCommand, parseRedirections, destructiveReason, PLACEHOLDER } = require('./shell-policy');

// A path the policy judges must be the path the shell will use: no tilde or variable expansion,
// no substitution result, no glob, no brace expansion (QA findings, unattended-chain U1 repair 1·2).
const NON_LITERAL_PATH = /[~$`*?[{}]/;

function isLiteralPath(target) {
  const value = String(target || '');
  return value.length > 0 && !NON_LITERAL_PATH.test(value) && !value.includes(PLACEHOLDER);
}

// The 4.3.0 read-only list, unchanged. Every filter added during unattended-chain U1 (sort, uniq,
// cut, tr, echo …) was removed again after independent QA found a way to write a file or run a
// program through one of them (repairs 3·4). A list word must be followed by whitespace or the
// end of the piece, never by a word boundary the shell would not honour.
const READ_ONLY_COMMANDS = [
  /^\s*(?:rg|grep|find|ls|pwd|cat|head|tail|wc|stat|which)(?:\s|$)/,
  /^\s*git(?:\s+-C\s+\S+)?\s+(?:status|diff|log|show|rev-parse|ls-files|remote\s+get-url)(?:\s|$)/,
  /^\s*(?:node|npm|npx)\s+--version\s*$/,
  /^\s*node\s+scripts\/vais-doctor\.js(?:\s|$)/,
  /^\s*npm\s+run\s+doctor\s*$/,
];

// The first word of a piece must be the word bash will execute: a bare identifier. Backslashes,
// quotes, `$`, backticks and braces inside it (`tr\uncate`, `tr{u,}ncate`, `comm\and`) are
// removed or expanded by the shell before execution and would defeat the list (QA, repair 4).
const BARE_COMMAND_WORD = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

// Runtime CLI subcommands that only read state and therefore need no session authorization.
// `/vais doctor` is a read-only prompt action, which revokes the session authorization, so the
// doctor command must be reachable without one.
const UNAUTHENTICATED_RUNTIME_COMMANDS = Object.freeze([
  /^doctor(?:\s|$)/,
  /^stage\s+status(?:\s|$)/,
  /^status(?:\s|$)/,
  /^explain(?:\s|$)/,
  /^propose(?:\s|$)/,
  /^ledger\s+list(?:\s|$)/,
  /^save\s+propose(?:\s|$)/,
  /^revert\s+propose(?:\s|$)/,
  /^migrate\s+propose(?:\s|$)/,
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
  /^\s*(?:npm|pnpm|yarn)\s+(?:test|run\s+(?:test|lint|build|typecheck|regression))(?:\s|$)/,
  /^\s*node\s+--test(?:\s|$)/,
  /^\s*npx\s+eslint(?:\s|$)/,
  /^\s*node\s+scripts\/vais-validate-plugin\.js(?:\s|$)/,
];

// Check commands take no pass-through arguments and no flag that could load code: npm scripts
// run as written, eslint takes path operands only, `node --test` takes paths plus a few flags
// whose values are names, never files (QA, repair 4).
const PASS_THROUGH_ARGS = /(?:^|\s)--(?:\s|$)/;
const NODE_TEST_FLAG = /^--test-(?:only|concurrency=\d+|timeout=\d+|reporter=(?:dot|spec|tap|junit)|name-pattern=\S+|skip-pattern=\S+)$/;

function checkArgumentsReason(value) {
  if (PASS_THROUGH_ARGS.test(value)) return 'pass-through arguments (`--`) are not allowed for checks';
  const tokens = value.trim().split(/\s+/);
  if (/^(?:npm|pnpm|yarn)$/.test(tokens[0])) {
    const flagged = tokens.slice(1).find(token => token.startsWith('-') && token !== '--version');
    return flagged ? `npm script checks take no flags: ${flagged}` : null;
  }
  if (tokens[0] === 'npx' && tokens[1] === 'eslint') {
    const flagged = tokens.slice(2).find(token => token.startsWith('-'));
    return flagged ? `eslint takes path operands only: ${flagged}` : null;
  }
  if (tokens[0] === 'node' && tokens[1] === '--test') {
    const flagged = tokens.slice(2).find(token => token.startsWith('-') && !NODE_TEST_FLAG.test(token));
    if (flagged) return `node --test takes paths and named flags only: ${flagged}`;
    // The runner executes every file it is given, so only the project's test folder qualifies.
    const outside = tokens.slice(2).find(token => !token.startsWith('-') && !/^tests\/(?!\.\.)[^\s]*$/.test(token));
    return outside ? `node --test runs project test files only: ${outside}` : null;
  }
  return null;
}

// A check discovers its configuration (eslint.config.js, package.json scripts) from the working
// directory, so it must run from the project root: `cd <scratchpad>; npx eslint .` would load
// code from there (repair 4).
function checkDirectoryReason(options) {
  if (!options.projectRoot || !options.cwd) return null;
  return path.resolve(options.cwd) === path.resolve(options.projectRoot) ? null : 'checks must run from the project root';
}

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
  /^diagram\s+export(?:\s|$)/,
  /^explain(?:\s|$)/,
  /^propose(?:\s|$)/,
  /^ledger\s+(?:add|list)(?:\s|$)/,
  /^save\s+(?:propose|commit)(?:\s|$)/,
  /^revert\s+(?:propose|commit)(?:\s|$)/,
  /^migrate\s+(?:propose|commit)(?:\s|$)/,
]);

const UNSAFE_SHELL_SYNTAX = /(?:&&|\|\||[|;<>`\n\r]|\$\()/;
const UNSAFE_READ_FLAGS = /(?:^|\s)(?:-delete|-exec|-execdir|-ok|-okdir|-fls|-fprint|-fprint0|-fprintf|--pre\S*|--hostname-bin\S*)(?:[=\s]|$)/;
// Attached short options (`-osrc/x`) and unambiguous long-option abbreviations (`--out=`) are
// accepted by GNU getopt and git, so the flag patterns match any tail (U1 repair 3).
const UNSAFE_WRITE_FLAGS = /(?:^|\s)(?:--out\S*|--fix\S*|--write\S*|--cache(?:-location)?|--updateSnapshot|--update-snapshot|--test-reporter-destination\S*|-o\S*|-u\S*)(?:[=\s]|$)/;
const UNSAFE_GIT_EXEC_FLAGS = /(?:^|\s)(?:--ext\S*|--textc\S*)(?:[=\s]|$)/;
// eslint loads JavaScript from these flags before linting, so they are refused for the check.
const UNSAFE_ESLINT_FLAGS = /(?:^|\s)(?:-c\S*|--config\S*|--rulesdir\S*|--plugin\S*|--resolve-plugins-relative-to\S*|--parser\S*)(?:[=\s]|$)/;
const ESLINT_COMMAND = /^\s*npx\s+eslint\b/;

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

// unattended-chain U1 (REQ-003): a composed command is judged piece by piece. Every piece must
// be allowed on its own; an output redirection is a write to its target path and is judged like
// a file write (approved scope or scratchpad). Wrappers such as `time`/`timeout` are peeled.
const KIND_ORDER = ['mutation-or-unknown', 'workflow-control', 'check', 'read-only'];
const WRAPPER_PREFIX = /^\s*(?:time|timeout(?:\s+-[a-z-]+(?:[=\s]\S+)?)*\s+\S+)\s+/i;
const CD_COMMAND = /^\s*cd(?:\s+((?:'[^']*'|"[^"]*"|\S)+))?\s*$/;
// The script must be the first argument: a flag such as `--require=` would preload code from
// anywhere before the scratchpad script runs (QA finding, repair 2).
const NODE_SCRIPT = /^\s*node\s+((?:'[^']*'|"[^"]*"|[^\s'"-][^\s'"]*))(?:\s|$)/i;
const DEV_TARGETS = new Set(['/dev/null', '/dev/stdout', '/dev/stderr']);

function unquoteWord(word) {
  return String(word || '').replace(/^(['"])([\s\S]*)\1$/, '$2');
}

function resolveTargetPath(target, options) {
  const base = options.cwd || options.projectRoot || process.cwd();
  return path.isAbsolute(target) ? path.resolve(target) : path.resolve(base, target);
}

function redirectionReason(redirection, authorization, options) {
  if (redirection.direction === 'input') return null;
  const target = redirection.target;
  if (!target) return 'redirection without a target';
  if (DEV_TARGETS.has(target)) return null;
  if (!isLiteralPath(target)) return `Redirection target must be a literal path (no ~, $, substitution, glob): ${target}`;
  const absolute = resolveTargetPath(target, options);
  if (isScratchPath(absolute)) return null;
  if (!authorization) return `Redirection target requires a managed /vais authorization: ${target}`;
  const relative = options.projectRoot ? normalizeRelative(options.projectRoot, absolute) : null;
  if (!relative) return `Redirection target is outside the project or scratchpad: ${target}`;
  if (!(authorization.allowedPaths || []).some(pattern => pathMatches(relative, pattern))) {
    return `Redirection target is outside the approved write scope: ${relative}`;
  }
  return null;
}

function authorizeSegment(text, authorization, options) {
  const value = String(text || '').replace(WRAPPER_PREFIX, '');
  const word = value.trim().split(/\s+/)[0] || '';
  if (word && !BARE_COMMAND_WORD.test(word)) {
    return { allowed: false, kind: 'composed-or-unsafe', reason: `command word must be a bare identifier: ${word}` };
  }
  const destructive = destructiveReason(value);
  if (destructive) return { allowed: false, kind: 'composed-or-unsafe', reason: destructive };
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
    return { allowed: false, kind: 'composed-or-unsafe', reason: 'Mutating find actions and output flags are not allowed' };
  }
  if (ESLINT_COMMAND.test(value) && UNSAFE_ESLINT_FLAGS.test(value)) {
    return { allowed: false, kind: 'composed-or-unsafe', reason: 'eslint flags that load code are not allowed' };
  }
  const cd = value.match(CD_COMMAND);
  if (cd) {
    const target = unquoteWord(cd[1] || '');
    // A bare `cd` goes home and `cd -` goes to an unknown previous directory: later relative
    // targets could not be judged, so both are refused along with expansions.
    if (!target || target === '-' || !isLiteralPath(target)) {
      return { allowed: false, kind: 'composed-or-unsafe', reason: `cd target must be a literal path: ${target || '(none)'}` };
    }
    return { allowed: true, kind: 'read-only', cd: target };
  }
  const script = value.match(NODE_SCRIPT);
  if (script && isLiteralPath(unquoteWord(script[1])) && isScratchPath(resolveTargetPath(unquoteWord(script[1]), options))) {
    return authorization
      ? { allowed: true, kind: 'check', needsPostDiff: true }
      : { allowed: false, kind: 'check', reason: 'Scratchpad scripts require a managed /vais authorization' };
  }
  const kind = classifyCommand(value);
  if (kind === 'read-only') return { allowed: true, kind };
  if (kind === 'check') {
    const argumentReason = checkArgumentsReason(value) || checkDirectoryReason(options);
    if (argumentReason) return { allowed: false, kind: 'composed-or-unsafe', reason: argumentReason };
    return authorization
      ? { allowed: true, kind }
      : { allowed: false, kind, reason: 'Checks that may create caches require a managed /vais authorization' };
  }
  if (!authorization) return { allowed: false, kind, reason: 'A managed /vais authorization is required' };
  const allowed = (authorization.allowedCommands || []).some(prefix => value.trim().startsWith(prefix));
  return allowed
    ? { allowed: true, kind, needsPostDiff: true }
    : { allowed: false, kind, reason: 'Command is not in the Design-approved command scope' };
}

function authorizeCommand(command, authorization, options = {}) {
  const parsed = segmentCommand(command);
  if (!parsed.ok) return { allowed: false, kind: 'composed-or-unsafe', reason: `Shell shape is not allowed: ${parsed.reason}` };
  const composed = parsed.segments.length > 1;
  let cwd = options.cwd || options.projectRoot || null;
  const kinds = [];
  let needsPostDiff = false;
  for (const segment of parsed.segments) {
    const pieces = parseRedirections(segment);
    if (!pieces.ok) return { allowed: false, kind: 'composed-or-unsafe', reason: pieces.reason };
    for (const redirection of pieces.redirections) {
      const reason = redirectionReason(redirection, authorization, { ...options, cwd });
      if (reason) return { allowed: false, kind: 'composed-or-unsafe', reason };
    }
    const result = authorizeSegment(pieces.text, authorization, { ...options, cwd });
    if (!result.allowed) return composed ? { ...result, reason: `${result.reason} (piece: ${pieces.text})` } : result;
    if (result.cd !== undefined) cwd = path.resolve(cwd || process.cwd(), result.cd);
    kinds.push(result.kind);
    needsPostDiff = needsPostDiff || Boolean(result.needsPostDiff);
  }
  const kind = KIND_ORDER.find(candidate => kinds.includes(candidate)) || 'read-only';
  return { allowed: true, kind, ...(needsPostDiff ? { needsPostDiff: true } : {}) };
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
  authorizeSegment,
  redirectionReason,
  isLiteralPath,
  checkArgumentsReason,
  BARE_COMMAND_WORD,
  UNSAFE_READ_FLAGS,
  UNSAFE_WRITE_FLAGS,
  UNSAFE_GIT_EXEC_FLAGS,
  UNSAFE_ESLINT_FLAGS,
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
