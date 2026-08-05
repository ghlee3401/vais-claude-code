/**
 * VAIS Code - Agent Registry
 * @module lib/registry/agent-registry
 *
 * frontmatter `includes: [...]` 필드를 파싱하여 공유 가드 블록을 본문 앞에 병합(prepend).
 *
 * @see docs/_legacy/01-plan/features/v050/03-agent-shared-guards.plan.md §4
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents');

/**
 * frontmatter/body 분리. `---` 펜스 기반.
 * @param {string} raw
 * @returns {{frontmatter: Object, body: string, raw: string}}
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw, raw };
  }
  const fm = {};
  let currentKey = null;
  let currentValue = '';
  let inList = false;

  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();

    if (/^- /.test(trimmed) && inList) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(trimmed.replace(/^- /, '').replace(/^["']|["']$/g, ''));
      continue;
    }

    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentValue) {
        fm[currentKey] = currentValue.trim();
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '' || val === '|' || val === '>') {
        currentValue = '';
        inList = false;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        fm[currentKey] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        currentKey = null;
        currentValue = '';
        inList = false;
      } else {
        fm[currentKey] = val;
        currentKey = null;
        currentValue = '';
        inList = false;
      }
      continue;
    }

    if (currentKey && /^\s+- /.test(line)) {
      inList = true;
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(trimmed.replace(/^- /, '').replace(/^["']|["']$/g, ''));
      continue;
    }

    if (currentKey && currentValue !== undefined) {
      currentValue += (currentValue ? '\n' : '') + line;
    }
  }
  if (currentKey && currentValue) {
    fm[currentKey] = currentValue.trim();
  }

  return { frontmatter: fm, body: match[2], raw };
}

/**
 * includes 파일을 로드하고 본문 앞에 병합(prepend).
 *
 * @param {string} agentPath - agents/ 기준 상대 또는 절대 경로
 * @returns {{frontmatter: Object, body: string, mergedBody: string, includes: string[]}}
 */
function loadAgent(agentPath) {
  const absPath = path.isAbsolute(agentPath) ? agentPath : path.resolve(AGENTS_DIR, '..', agentPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Agent file not found: ${absPath}`);
  }
  const raw = fs.readFileSync(absPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);

  const includes = Array.isArray(frontmatter.includes) ? frontmatter.includes : [];
  const visited = new Set();
  const guardBlocks = [];

  for (const inc of includes) {
    const incPath = path.resolve(AGENTS_DIR, inc);
    if (visited.has(incPath)) {
      process.stderr.write(`[VAIS] AgentRegistry: circular include skipped: ${inc}\n`);
      continue;
    }
    visited.add(incPath);
    if (!fs.existsSync(incPath)) {
      process.stderr.write(`[VAIS] AgentRegistry: include not found: ${inc}\n`);
      continue;
    }
    const guardRaw = fs.readFileSync(incPath, 'utf8');
    const parsed = parseFrontmatter(guardRaw);
    guardBlocks.push(parsed.body || guardRaw);
  }

  const mergedBody = guardBlocks.length > 0
    ? guardBlocks.join('\n\n') + '\n\n' + body
    : body;

  return { frontmatter, body, mergedBody, includes };
}

/**
 * agents/ 디렉토리에서 모든 sub-agent를 로드. _shared/ 제외.
 * @returns {Map<string, Object>} name → loadAgent result
 */
function loadAllAgents() {
  const agents = new Map();
  const dirs = fs.readdirSync(AGENTS_DIR).filter(d => {
    if (d.startsWith('_')) return false;
    return fs.statSync(path.join(AGENTS_DIR, d)).isDirectory();
  });
  for (const dir of dirs) {
    const files = fs.readdirSync(path.join(AGENTS_DIR, dir)).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const relPath = path.join('agents', dir, file);
      try {
        const agent = loadAgent(relPath);
        const name = agent.frontmatter.name || file.replace('.md', '');
        agents.set(name, agent);
      } catch (err) {
        process.stderr.write(`[VAIS] AgentRegistry: failed to load ${relPath}: ${err.message}\n`);
      }
    }
  }
  return agents;
}

module.exports = {
  parseFrontmatter,
  loadAgent,
  loadAllAgents,
  AGENTS_DIR,
};
