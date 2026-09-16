'use strict';

// Runs the product app around a screenshot (docs/harness/design.md §10 앱 실행). The command is
// an argv array spawned without a shell; readiness means the URL answers an HTTP request; the
// process group is always terminated afterwards. Failures carry APP_START_FAILED.

const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

const DEFAULT_READY_MS = 15_000;
const POLL_MS = 300;

function sleep(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch (_) {
    const end = Date.now() + ms;
    while (Date.now() < end) { /* busy wait fallback */ }
  }
}

// Synchronous probe so the transaction code stays linear: a child Node process performs one GET.
function urlResponds(url, timeoutMs = 2000) {
  const script = 'const u=process.argv[1];const m=u.startsWith("https")?require("https"):require("http");const r=m.get(u,res=>{res.resume();process.exit(res.statusCode<500?0:2)});r.on("error",()=>process.exit(1));r.setTimeout(' + timeoutMs + ',()=>{r.destroy();process.exit(1)});';
  const result = spawnSync(process.execPath, ['-e', script, url], { stdio: 'ignore', timeout: timeoutMs + 500 });
  return result.status === 0;
}

// The readiness loop is synchronous, so Node has not reaped the child yet: on Linux the process
// table tells us whether it already died (zombie) before the URL ever answered.
const HAS_PROC = fs.existsSync('/proc/self/stat');
function childGone(child) {
  if (child.exitCode !== null || child.signalCode) return true;
  if (!HAS_PROC) return false;
  try {
    return /\)\s+Z/.test(fs.readFileSync(`/proc/${child.pid}/stat`, 'utf8'));
  } catch (error) {
    return error.code === 'ENOENT';
  }
}

function stop(child) {
  if (!child || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch (_) { try { child.kill('SIGTERM'); } catch (__) { /* already gone */ } }
}

function withApp(projectRoot, run, fn) {
  if (!run?.command?.length) return fn(run?.url || null);
  const [command, ...args] = run.command;
  const child = spawn(command, args, { cwd: projectRoot, detached: true, stdio: 'ignore' });
  let spawnError = null;
  child.on('error', error => { spawnError = error; });
  const deadline = Date.now() + (run.readyTimeoutMs || DEFAULT_READY_MS);
  try {
    while (!urlResponds(run.url)) {
      if (spawnError || childGone(child)) {
        const error = new Error(`앱 실행 실패: ${run.command.join(' ')} — ${spawnError?.message || `${run.url} 에 응답하기 전에 프로세스가 먼저 끝났다`}`);
        error.code = 'APP_START_FAILED';
        throw error;
      }
      if (Date.now() > deadline) {
        const error = new Error(`앱이 ${run.readyTimeoutMs || DEFAULT_READY_MS}ms 안에 ${run.url} 에 응답하지 않았다 (${run.command.join(' ')})`);
        error.code = 'APP_START_FAILED';
        throw error;
      }
      sleep(POLL_MS);
    }
    return fn(run.url);
  } finally {
    stop(child);
  }
}

module.exports = { DEFAULT_READY_MS, urlResponds, withApp };
