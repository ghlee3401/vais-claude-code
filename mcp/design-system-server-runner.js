#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Design System MCP Server Runner
 *
 * Claude Code MCP server (stdio JSON-RPC 2.0) wrapping
 * mcp/design-system-server.json 의 3개 tool:
 *   - design_search
 *   - design_system_generate
 *   - design_stack_search
 *
 * → vendor/ui-ux-pro-max/scripts/search.py 로 위임.
 *
 * @see docs/design-system-mcp-activation/02-design/main.md (observation-D1, D-D2)
 * @see https://modelcontextprotocol.io/specification
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SPEC_PATH = path.join(__dirname, 'design-system-server.json');
const VENDOR_SCRIPT = path.join(PLUGIN_ROOT, 'vendor', 'ui-ux-pro-max', 'scripts', 'search.py');

const SAFE_QUERY = /^[\w\s.,/:#@'"-]{1,200}$/;
const SAFE_PROJECT = /^[a-zA-Z0-9_-]{1,100}$/;
const ALLOWED_DOMAIN = new Set([
  'style', 'color', 'chart', 'landing', 'product', 'ux', 'typography', 'google-fonts',
]);
const ALLOWED_STACK = new Set(['html-tailwind', 'react', 'nextjs']);

let spec;
try {
  spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
} catch (e) {
  process.stderr.write(`design-system-server-runner: spec 로드 실패 ${SPEC_PATH}\n${e.message}\n`);
  process.exit(1);
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function ok(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function err(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function buildToolList() {
  return spec.tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: {
      type: 'object',
      properties: t.parameters,
      required: Object.keys(t.parameters).filter(
        (k) => t.parameters[k].default === undefined
      ),
    },
  }));
}

function callPython(args) {
  try {
    const stdout = execFileSync('python3', [VENDOR_SCRIPT, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: PLUGIN_ROOT,
    });
    return { ok: true, stdout };
  } catch (e) {
    return {
      ok: false,
      stderr: String(e?.stderr ?? e?.message ?? e).slice(0, 1000),
    };
  }
}

function validateArgs(name, args) {
  if (!args || typeof args !== 'object') {
    return { ok: false, message: 'arguments 가 객체가 아닙니다' };
  }
  if (typeof args.query !== 'string' || !SAFE_QUERY.test(args.query)) {
    return { ok: false, message: 'query 입력 검증 실패' };
  }
  if (name === 'design_search') {
    if (args.domain && !ALLOWED_DOMAIN.has(args.domain)) {
      return { ok: false, message: 'domain 값 허용 범위 밖' };
    }
    if (args.max_results !== undefined) {
      const n = Number(args.max_results);
      if (!Number.isFinite(n) || n < 1 || n > 20) {
        return { ok: false, message: 'max_results 범위 밖 (1-20)' };
      }
    }
  } else if (name === 'design_system_generate') {
    if (typeof args.project_name !== 'string' || !SAFE_PROJECT.test(args.project_name)) {
      return { ok: false, message: 'project_name 검증 실패 (kebab-case 1-100자)' };
    }
  } else if (name === 'design_stack_search') {
    if (!args.stack || !ALLOWED_STACK.has(args.stack)) {
      return { ok: false, message: 'stack 값 허용 범위 밖' };
    }
  } else {
    return { ok: false, message: `알 수 없는 tool: ${name}` };
  }
  return { ok: true };
}

function buildArgsFor(name, args) {
  const out = [args.query];
  if (name === 'design_search') {
    if (args.domain) out.push('--domain', args.domain);
    if (args.max_results) out.push('--max-results', String(args.max_results));
  } else if (name === 'design_system_generate') {
    out.push('--design-system');
    if (args.persist !== false) out.push('--persist');
    out.push('-p', args.project_name);
  } else if (name === 'design_stack_search') {
    out.push('--stack', args.stack);
  }
  return out;
}

function handleToolsCall(id, params) {
  const name = params?.name;
  const args = params?.arguments ?? {};
  if (!spec.tools.some((t) => t.name === name)) {
    return err(id, -32602, `Unknown tool: ${name}`);
  }
  const v = validateArgs(name, args);
  if (!v.ok) return err(id, -32602, v.message);
  const r = callPython(buildArgsFor(name, args));
  if (!r.ok) {
    return ok(id, {
      content: [{ type: 'text', text: `tool 호출 실패\n\n${r.stderr}` }],
      isError: true,
    });
  }
  return ok(id, {
    content: [{ type: 'text', text: r.stdout }],
  });
}

function handleRequest(req) {
  if (!req || req.jsonrpc !== '2.0') return;
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: spec.name, version: spec.version },
      });
    case 'tools/list':
      return ok(id, { tools: buildToolList() });
    case 'tools/call':
      return handleToolsCall(id, params);
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return;
    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch (_) {
    return;
  }
  try {
    handleRequest(req);
  } catch (e) {
    process.stderr.write(`design-system-server-runner 내부 오류: ${e?.message ?? e}\n`);
  }
});
