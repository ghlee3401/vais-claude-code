'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { readConfigFile, loadWorkflowConfig, resolveMode, harnessSwitchOff } = require('./config');
const ledger = require('./ledger');
const idChain = require('./id-chain');
const { findChrome, INSTALL_HINT } = require('./screen-capture');

const MIN_NODE_MAJOR = 18;
const REQUIRED_HOOK_EVENTS = Object.freeze(['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']);
const STATUSLINE_SCRIPT = 'scripts/vais-statusline.js';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function check(id, verdict, detail, fix = null) {
  return { id, verdict, detail, ...(fix ? { fix } : {}) };
}

function checkConfig(root) {
  const { config, error } = readConfigFile(root);
  if (error) return check('config-parse', 'fail', `vais.config.json 을 읽을 수 없다: ${error}`, 'JSON 문법을 고치거나 파일을 복구한다');
  if (!config?.workflowV2) return check('config-parse', 'fail', 'workflowV2 블록이 없다', '`"workflowV2": { "mode": "enforce" }` 를 추가한다');
  return check('config-parse', 'pass', 'vais.config.json 파싱 정상');
}

function checkMode(root, env) {
  const resolved = resolveMode(root, env);
  if (resolved.mode === 'off') return check('mode', 'warn', resolved.warning, '작업이 끝나면 `unset VAIS_HARNESS_OFF` 로 스위치를 끈다');
  if (resolved.warning) return check('mode', 'fail', resolved.warning, 'vais.config.json > workflowV2.mode 를 `enforce` 또는 `disabled` 로 고친다');
  if (resolved.mode === 'disabled') return check('mode', 'warn', 'mode 가 disabled 다. 하네스가 강제되지 않는다', '하네스 수리가 끝났으면 `enforce` 로 되돌린다');
  return check('mode', 'pass', 'mode = enforce');
}

function checkUnknownKeys(root) {
  const loaded = loadWorkflowConfig(root);
  if (loaded.unknownKeys.length === 0) return check('unknown-keys', 'pass', 'workflowV2 에 알 수 없는 키 없음');
  return check('unknown-keys', 'warn', `runtime 이 읽지 않는 키: ${loaded.unknownKeys.join(', ')}`, '죽은 키는 삭제한다. runtime 이 읽는 키는 mode, leaseMs, authorizationTtlMs, statePath 뿐이다');
}

function hookCommands(manifest) {
  const commands = [];
  for (const handlers of Object.values(manifest?.hooks || {})) {
    for (const handler of handlers || []) {
      for (const hook of handler.hooks || []) if (hook.command) commands.push(hook.command);
    }
  }
  return commands;
}

function checkHooks(root) {
  const manifest = readJson(path.join(root, 'hooks', 'hooks.json'));
  if (!manifest) return check('hooks-registered', 'fail', 'hooks/hooks.json 을 읽을 수 없다', 'hooks.json 을 복구한다');
  const missing = [];
  for (const command of hookCommands(manifest)) {
    for (const token of command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, root).split(/\s+/)) {
      if (/\.(?:js|sh)$/.test(token) && !fs.existsSync(token)) missing.push(path.relative(root, token));
    }
  }
  if (missing.length) return check('hooks-registered', 'fail', `등록된 hook 스크립트가 없다: ${missing.join(', ')}`, '파일을 복구하거나 hooks.json 에서 등록을 지운다');
  return check('hooks-registered', 'pass', `hook 명령 ${hookCommands(manifest).length}개의 스크립트가 모두 존재`);
}

function checkNode() {
  const major = Number(String(process.versions.node).split('.')[0]);
  if (major >= MIN_NODE_MAJOR) return check('node-version', 'pass', `Node ${process.versions.node}`);
  return check('node-version', 'fail', `Node ${process.versions.node} 는 최소 ${MIN_NODE_MAJOR} 미만`, `Node ${MIN_NODE_MAJOR} 이상을 설치한다`);
}

function versionFiles(root) {
  const packageJson = readJson(path.join(root, 'package.json'));
  const config = readJson(path.join(root, 'vais.config.json'));
  const plugin = readJson(path.join(root, '.claude-plugin', 'plugin.json'));
  const marketplace = readJson(path.join(root, '.claude-plugin', 'marketplace.json'));
  return {
    'package.json': packageJson?.version,
    'vais.config.json': config?.version,
    '.claude-plugin/plugin.json': plugin?.version,
    '.claude-plugin/marketplace.json#metadata': marketplace?.metadata?.version,
    '.claude-plugin/marketplace.json#plugins[0]': marketplace?.plugins?.[0]?.version,
  };
}

function checkVersionSync(root) {
  const versions = versionFiles(root);
  const distinct = [...new Set(Object.values(versions).map(value => value ?? '<없음>'))];
  if (distinct.length === 1 && distinct[0] !== '<없음>') return check('version-sync', 'pass', `버전 ${distinct[0]} 이 5곳에서 일치`);
  const detail = Object.entries(versions).map(([file, value]) => `${file}=${value ?? '<없음>'}`).join(', ');
  return check('version-sync', 'fail', `버전 불일치: ${detail}`, '다섯 파일의 version 을 같은 값으로 맞춘다');
}

function checkPluginCache(root, homeDir) {
  const repoVersion = readJson(path.join(root, 'package.json'))?.version || null;
  const cacheDir = path.join(homeDir, '.claude', 'plugins', 'cache', 'vais-marketplace', 'vais-code');
  let cached = [];
  try {
    cached = fs.readdirSync(cacheDir).filter(name => fs.existsSync(path.join(cacheDir, name, 'package.json')));
  } catch (_) {
    return check('plugin-cache', 'warn', '플러그인 캐시를 찾지 못했다 (설치되지 않았거나 다른 경로)', '`/plugin` 으로 설치 상태를 확인한다');
  }
  if (cached.length === 0) return check('plugin-cache', 'warn', '캐시에 설치된 버전이 없다', '플러그인을 설치한다');
  if (repoVersion && cached.includes(repoVersion)) return check('plugin-cache', 'pass', `캐시 버전 ${cached.join(', ')} 에 repo 버전 ${repoVersion} 포함`);
  return check('plugin-cache', 'warn', `실행 중 캐시 버전 ${cached.join(', ')} 과 repo 버전 ${repoVersion} 이 다르다`, 'repo 변경은 push · 버전 bump · 플러그인 업데이트 뒤에 반영된다');
}

function checkStateFiles(root) {
  const stateDir = path.join(root, '.vais', 'v2');
  const findings = [];
  for (const name of ['work-items.json', 'authorizations.json', 'chain-index.json']) {
    const file = path.join(stateDir, name);
    if (!fs.existsSync(file)) continue;
    const value = readJson(file);
    if (!value) findings.push(`${name} 파싱 실패`);
    else if (value.schemaVersion !== '1.0') findings.push(`${name} schemaVersion=${value.schemaVersion}`);
  }
  if (findings.length) return check('state-files', 'fail', findings.join(', '), '손상된 상태 파일은 백업 후 삭제하면 runtime 이 다시 만든다');
  return check('state-files', 'pass', '.vais/v2 상태 파일 정상 (또는 아직 없음)');
}

function checkHarnessSwitch(env) {
  if (harnessSwitchOff(env)) return check('harness-switch', 'warn', 'VAIS_HARNESS_OFF 가 켜져 있다', '수리가 끝나면 스위치를 끈다');
  return check('harness-switch', 'pass', '비상 스위치 꺼짐');
}

// Every hook event the harness relies on must be registered, or a lever is silently missing.
function checkHookEvents(root) {
  const manifest = readJson(path.join(root, 'hooks', 'hooks.json'));
  if (!manifest) return check('hook-events', 'fail', 'hooks/hooks.json 을 읽을 수 없다', 'hooks.json 을 복구한다');
  const registered = Object.keys(manifest.hooks || {}).filter(event => (manifest.hooks[event] || []).length > 0);
  const missing = REQUIRED_HOOK_EVENTS.filter(event => !registered.includes(event));
  if (missing.length) return check('hook-events', 'fail', `등록되지 않은 hook 이벤트: ${missing.join(', ')}`, 'hooks.json 에 해당 이벤트의 command hook 을 등록한다 (SessionStart 브리핑 · Stop 기록 잠금 포함)');
  return check('hook-events', 'pass', `hook 이벤트 ${REQUIRED_HOOK_EVENTS.length}종 등록 (${REQUIRED_HOOK_EVENTS.join(', ')})`);
}

function checkLedger(root) {
  if (!fs.existsSync(ledger.ledgerPath(root))) return check('ledger', 'pass', '장부 없음 (첫 승인 때 생성된다)');
  const { entries, broken } = ledger.read(root);
  if (broken.length) {
    return check('ledger', 'fail', `장부 ${entries.length}건 중 깨진 줄 ${broken.length}개 (줄 ${broken.slice(0, 5).map(item => item.line).join(', ')})`,
      '깨진 줄은 고치지 말고 그대로 두되 원인(수동 편집·동시 쓰기)을 확인한다. 장부는 append-only 다');
  }
  const counts = ledger.summarize(entries);
  return check('ledger', 'pass', `장부 ${entries.length}건 (결정 ${counts.decision} · 피드백 ${counts.feedback} · 부채 ${counts.debt} · 리스크 ${counts.risk})`);
}

// Claude Code reads the user settings and both project settings files; so does this check.
function checkStatusline(root, homeDir) {
  const candidates = [
    ['~/.claude/settings.json', path.join(homeDir, '.claude', 'settings.json')],
    ['.claude/settings.json', path.join(root, '.claude', 'settings.json')],
    ['.claude/settings.local.json', path.join(root, '.claude', 'settings.local.json')],
  ];
  for (const [label, file] of candidates) {
    const command = readJson(file)?.statusLine?.command;
    if (typeof command === 'string' && command.includes(path.posix.basename(STATUSLINE_SCRIPT))) {
      return check('statusline', 'pass', `statusline 설치됨 (${label}): ${command}`);
    }
  }
  const target = path.join(root, STATUSLINE_SCRIPT);
  return check('statusline', 'warn', 'Claude Code statusline 에 VAIS 상태 줄이 없다',
    `~/.claude/settings.json 또는 프로젝트 .claude/settings.json 에 "statusLine": {"type": "command", "command": "node ${target}"} 를 추가한다`);
}

// `/vais 저장`·`/vais 되돌리기` need a git repository; a missing remote only blocks the user's push.
function checkGit(root) {
  const run = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    if (run(['rev-parse', '--is-inside-work-tree']) !== 'true') throw new Error('not a work tree');
  } catch (_) {
    return check('git', 'warn', 'git 저장소가 아니다 — `/vais 저장`·`/vais 되돌리기` 를 쓸 수 없다', '`git init` 으로 저장소를 만든다');
  }
  const changed = run(['status', '--porcelain', '-uall']).split('\n').filter(Boolean).length;
  const remotes = run(['remote']).split('\n').filter(Boolean);
  if (remotes.length === 0) return check('git', 'warn', `git 저장소 · 미커밋 변경 ${changed}개 · 원격 없음 (push 불가)`, '`git remote add origin <url>` 로 원격을 연결한다');
  return check('git', 'pass', `git 저장소 · 미커밋 변경 ${changed}개 · 원격 ${remotes.join(', ')}`);
}

function checkBrowser(env) {
  const chrome = findChrome(env);
  if (chrome) return check('browser', 'pass', `Chrome 발견: ${chrome} (화면 캡처 가능)`);
  return check('browser', 'warn', 'Chrome/Chromium 을 찾지 못했다 — ui 작업과 W·V 단계의 그림을 만들 수 없다', INSTALL_HINT);
}

function checkChainStale(root) {
  const stale = idChain.computeStale(idChain.loadChainIndex(root));
  if (stale.length === 0) return check('chain-stale', 'pass', 'stale 항목 없음');
  const missing = stale.filter(item => item.parentMissing);
  return check('chain-stale', 'warn', `stale 항목 ${stale.length}개: ${stale.slice(0, 5).map(item => `${item.id} ← ${item.parent}${item.parentMissing ? ' (부모 삭제됨)' : ''}`).join(', ')}`,
    missing.length
      ? '삭제된 부모를 가리키는 항목은 그 단계를 새 작업으로 고쳐 재승인한다'
      : '그 단계를 새 작업으로 재승인하거나, 그대로 맞으면 `/vais 변경 없음 확인: <항목> ← <부모>` 로 확인한다');
}

function runDoctor(projectRoot, options = {}) {
  const root = path.resolve(projectRoot);
  const env = options.env || process.env;
  const homeDir = options.homeDir || os.homedir();
  const checks = [
    checkConfig(root),
    checkMode(root, env),
    checkUnknownKeys(root),
    checkHooks(root),
    checkHookEvents(root),
    checkNode(),
    checkVersionSync(root),
    checkPluginCache(root, homeDir),
    checkStateFiles(root),
    checkLedger(root),
    checkChainStale(root),
    checkStatusline(root, homeDir),
    checkBrowser(env),
    checkGit(root),
    checkHarnessSwitch(env),
  ];
  const failed = checks.filter(item => item.verdict === 'fail').length;
  const warned = checks.filter(item => item.verdict === 'warn').length;
  return {
    schema: 'vais-doctor/v1',
    verdict: failed > 0 ? 'fail' : warned > 0 ? 'warn' : 'pass',
    summary: `fail ${failed} · warn ${warned} · pass ${checks.length - failed - warned}`,
    checks,
  };
}

function renderDoctor(report) {
  const icon = { pass: '✅', warn: '⚠️', fail: '❌' };
  const lines = [`VAIS doctor — ${report.verdict.toUpperCase()} (${report.summary})`, ''];
  for (const item of report.checks) {
    lines.push(`${icon[item.verdict]} ${item.id}: ${item.detail}`);
    if (item.fix) lines.push(`   → ${item.fix}`);
  }
  return lines.join('\n');
}

module.exports = { MIN_NODE_MAJOR, REQUIRED_HOOK_EVENTS, STATUSLINE_SCRIPT, runDoctor, renderDoctor, versionFiles };
