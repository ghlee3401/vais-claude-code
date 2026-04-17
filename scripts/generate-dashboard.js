#!/usr/bin/env node
/**
 * VAIS Code — HTML Dashboard Generator
 * docs/ 하위 마크다운 산출물을 예쁜 HTML 대시보드로 변환
 *
 * Usage:
 *   node scripts/generate-dashboard.js [project-dir]
 *   # → .vais/dashboard.html 생성
 *
 * 호출 시점: skills/vais/utils/dashboard.md 진입점 (/vais dashboard)
 */

const fs = require('fs');
const path = require('path');

// ── 설정 ──────────────────────────────────────────
const PROJECT_DIR = process.argv[2] || process.cwd();
const PLUGIN_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_DIR, '.vais', 'dashboard.html');

const PHASE_META = [
  { key: 'plan',   icon: '📋', num: '01', name: '기획',       color: '#2563eb' },
  { key: 'design', icon: '🎨', num: '02', name: '설계',       color: '#059669' },
  { key: 'infra-architect', icon: '🔧', num: '03', name: '아키텍트',   color: '#7c3aed' },
  { key: 'frontend-engineer', icon: '💻', num: '04', name: '프론트엔드', color: '#d97706' },
  { key: 'backend-engineer',  icon: '⚙️', num: '05', name: '백엔드',     color: '#dc2626' },
  { key: 'qa',       icon: '✅', num: '06', name: 'QA',         color: '#0d9488' },
];

// ── 유틸 ──────────────────────────────────────────

function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function readText(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch { return ''; }
}

/** 프로젝트의 docs 하위에서 피처 이름 목록 추출 */
function discoverFeatures() {
  const features = new Set();
  const docsDir = path.join(PROJECT_DIR, 'docs');
  if (!fs.existsSync(docsDir)) return [];

  for (const sub of fs.readdirSync(docsDir)) {
    const subPath = path.join(docsDir, sub);
    if (!fs.statSync(subPath).isDirectory()) continue;
    if (!/^\d{2}-/.test(sub)) continue;
    for (const f of fs.readdirSync(subPath)) {
      if (f.endsWith('.md')) {
        features.add(f.replace(/\.md$/, ''));
      }
    }
  }
  return [...features].sort();
}

/** .vais/features/{feature}.json 에서 기능 목록 로드 */
function loadFeatureRegistry(feature) {
  return readJson(path.join(PROJECT_DIR, '.vais', 'features', `${feature}.json`));
}

/** 간단한 Markdown → HTML 변환 (외부 라이브러리 불필요) */
function md2html(md) {
  if (!md) return '';
  let html = md;

  // code blocks (``` ... ```) — 코드 내용은 이스케이프
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`
  );

  // inline code — 코드 내용은 이스케이프
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="inline-code">${escapeHtml(code)}</code>`);

  // headers — 텍스트 이스케이프
  html = html.replace(/^#{4}\s+(.+)$/gm, (_, t) => `<h4>${escapeHtml(t)}</h4>`);
  html = html.replace(/^#{3}\s+(.+)$/gm, (_, t) => `<h3>${escapeHtml(t)}</h3>`);
  html = html.replace(/^#{2}\s+(.+)$/gm, (_, t) => `<h2>${escapeHtml(t)}</h2>`);
  html = html.replace(/^#{1}\s+(.+)$/gm, (_, t) => `<h1>${escapeHtml(t)}</h1>`);

  // horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${escapeHtml(t)}</strong>`);
  html = html.replace(/\*(.+?)\*/g, (_, t) => `<em>${escapeHtml(t)}</em>`);

  // tables
  html = html.replace(/((?:\|.+\|\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;

    let out = '<div class="table-wrap"><table>';
    rows.forEach((row, i) => {
      // skip separator row (|---|---|)
      if (/^[\s|:\-]+$/.test(row)) return;
      const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const tag = i === 0 ? 'th' : 'td';
      const trClass = i === 0 ? ' class="header-row"' : '';
      out += `<tr${trClass}>${cells.map(c => `<${tag}>${escapeHtml(c.trim())}</${tag}>`).join('')}</tr>`;
    });
    out += '</table></div>';
    return out;
  });

  // checkboxes
  html = html.replace(/- \[x\]/gi, '<span class="cb checked">✅</span>');
  html = html.replace(/- \[ \]/g, '<span class="cb unchecked">⬜</span>');

  // bullet lists
  html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // mermaid blocks (render as-is, mermaid.js will handle)
  html = html.replace(/<pre class="code-block"><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => `<pre class="mermaid">${code}</pre>`);

  // paragraphs — wrap remaining loose lines
  html = html.replace(/^(?!<[a-z/])(.*\S.*)$/gm, '<p>$1</p>');
  // clean up double-wrapped
  html = html.replace(/<p>(<h[1-4]>)/g, '$1');
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/<p>(<li>)/g, '$1');
  html = html.replace(/(<\/li>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
  html = html.replace(/<p>(<div)/g, '$1');
  html = html.replace(/<p>(<pre)/g, '$1');

  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── 데이터 수집 ──────────────────────────────────

function collectData() {
  const config = readJson(path.join(PLUGIN_DIR, 'vais.config.json')) || {};
  const status = readJson(path.join(PROJECT_DIR, '.vais', 'status.json'));
  const memory = readJson(path.join(PROJECT_DIR, '.vais', 'memory.json'));
  const features = discoverFeatures();

  const docPaths = config.workflow?.docPaths || {};

  // 피처별 문서 수집
  const featureData = features.map(feature => {
    const registry = loadFeatureRegistry(feature);
    const docs = {};

    for (const phase of PHASE_META) {
      const template = docPaths[phase.key];
      if (!template) continue;
      const docFile = path.join(PROJECT_DIR, template.replace(/\{feature\}/g, feature));
      const content = readText(docFile);
      if (content) docs[phase.key] = content;
    }

    return { name: feature, registry, docs };
  });

  return { config, status, memory, featureData };
}

// ── HTML 생성 ────────────────────────────────────

function generateHtml(data) {
  const { status, memory, featureData } = data;

  const featuresNav = featureData.map((f, i) =>
    `<button class="nav-feature ${i === 0 ? 'active' : ''}" data-feature="${escapeHtml(f.name)}" onclick="showFeature(this.dataset.feature)">${escapeHtml(f.name)}</button>`
  ).join('\n');

  const featuresContent = featureData.map((f, i) => {
    // Phase tabs
    const phasesWithDocs = PHASE_META.filter(p => f.docs[p.key]);

    const tabs = phasesWithDocs.map((p, j) =>
      `<button class="phase-tab ${j === 0 ? 'active' : ''}" data-feature="${escapeHtml(f.name)}" data-phase="${p.key}" onclick="showPhase(this.dataset.feature, this.dataset.phase)" style="border-color:${p.color}">${p.icon} ${p.name}</button>`
    ).join('\n');

    // Phase contents
    const phaseContents = phasesWithDocs.map((p, j) =>
      `<div class="phase-content ${j === 0 ? 'active' : ''}" id="content-${escapeHtml(f.name)}-${p.key}">${md2html(f.docs[p.key])}</div>`
    ).join('\n');

    // Feature registry summary
    let registrySummary = '';
    if (f.registry?.features) {
      const total = f.registry.features.length;
      const done = f.registry.features.filter(r => r.status === '완료').length;
      const inProg = f.registry.features.filter(r => r.status === '진행중').length;
      const notDone = total - done - inProg;
      registrySummary = `
        <div class="registry-summary">
          <h3>피처 레지스트리</h3>
          <div class="registry-stats">
            <span class="stat done">✅ 완료 ${done}</span>
            <span class="stat prog">🔄 진행중 ${inProg}</span>
            <span class="stat todo">⬜ 미구현 ${notDone}</span>
            <span class="stat total">전체 ${total}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${total ? Math.round(done / total * 100) : 0}%"></div>
          </div>
          <div class="table-wrap"><table>
            <tr class="header-row"><th>ID</th><th>기능</th><th>우선순위</th><th>상태</th></tr>
            ${f.registry.features.map(r => `<tr><td>${escapeHtml(r.id || '')}</td><td>${escapeHtml(r.name || '')}</td><td>${escapeHtml(r.priority || '')}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
          </table></div>
        </div>`;
    }

    // Phase progress
    let phaseProgress = '';
    if (status?.phases) {
      phaseProgress = `<div class="phase-progress">
        ${PHASE_META.map(p => {
          const ps = status.phases[p.key];
          const st = ps?.status || 'pending';
          const cls = st === 'completed' ? 'done' : st === 'in-progress' ? 'prog' : 'pending';
          return `<span class="phase-dot ${cls}" title="${p.name}: ${st}">${p.icon}</span>`;
        }).join('<span class="phase-arrow">→</span>')}
      </div>`;
    }

    return `
      <div class="feature-panel ${i === 0 ? 'active' : ''}" id="feature-${f.name}">
        ${phaseProgress}
        ${registrySummary}
        <div class="phase-tabs">${tabs}</div>
        <div class="phase-panels">${phaseContents}</div>
      </div>`;
  }).join('\n');

  // Memory timeline
  let memoryHtml = '';
  if (memory?.entries?.length) {
    const typeIcon = { decision: '🎯', change: '🔄', feedback: '💬', dependency: '🔗', debt: '⚠️', error: '❌', milestone: '🏁' };
    memoryHtml = `
      <div class="feature-panel" id="feature-__memory" style="display:none">
        <h2>Manager Memory Timeline</h2>
        <div class="memory-timeline">
          ${memory.entries.slice().reverse().map(e => `
            <div class="memory-entry type-${e.type || 'info'}">
              <span class="mem-icon">${typeIcon[e.type] || 'ℹ️'}</span>
              <div class="mem-body">
                <div class="mem-header">
                  <span class="mem-type">${e.type || ''}</span>
                  <span class="mem-feature">${e.feature || ''}</span>
                  <span class="mem-phase">${e.phase || ''}</span>
                  <time>${e.timestamp ? new Date(e.timestamp).toLocaleString('ko-KR') : ''}</time>
                </div>
                <p class="mem-summary">${escapeHtml(e.summary || '')}</p>
                ${e.details ? `<p class="mem-details">${escapeHtml(typeof e.details === 'string' ? e.details : JSON.stringify(e.details))}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VAIS Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
<style>
:root {
  --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0;
  --text: #1e293b; --text2: #64748b; --accent: #2563eb;
  --accent-light: #dbeafe; --green: #059669; --green-light: #d1fae5;
  --red: #dc2626; --red-light: #fee2e2; --orange: #d97706; --orange-light: #ffedd5;
  --purple: #7c3aed; --purple-light: #ede9fe;
  --radius: 10px; --shadow: 0 1px 3px rgba(0,0,0,.08);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.7;
  display: flex; min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: 240px; background: var(--surface); border-right: 1px solid var(--border);
  padding: 24px 16px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
  overflow-y: auto;
}
.sidebar h1 { font-size: 20px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
.sidebar .version { font-size: 12px; color: var(--text2); margin-bottom: 24px; }
.sidebar h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text2); margin: 20px 0 8px; }
.nav-feature {
  display: block; width: 100%; text-align: left; padding: 10px 14px;
  border: none; background: none; cursor: pointer; border-radius: 8px;
  font-size: 15px; font-weight: 500; color: var(--text); transition: all .15s;
}
.nav-feature:hover { background: var(--accent-light); color: var(--accent); }
.nav-feature.active { background: var(--accent); color: #fff; font-weight: 600; }

/* ── Main ── */
.main { flex: 1; padding: 32px 40px; max-width: 1100px; }

/* ── Phase progress dots ── */
.phase-progress {
  display: flex; align-items: center; gap: 4px; margin-bottom: 24px;
  padding: 14px 20px; background: var(--surface); border-radius: var(--radius);
  border: 1px solid var(--border); box-shadow: var(--shadow);
}
.phase-dot {
  font-size: 20px; padding: 4px 6px; border-radius: 6px; opacity: .35;
  transition: all .2s;
}
.phase-dot.done { opacity: 1; background: var(--green-light); }
.phase-dot.prog { opacity: 1; background: var(--orange-light); animation: pulse 1.5s infinite; }
.phase-arrow { color: var(--text2); font-size: 14px; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

/* ── Registry ── */
.registry-summary {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 20px 24px; margin-bottom: 24px; box-shadow: var(--shadow);
}
.registry-summary h3 { font-size: 16px; margin-bottom: 12px; }
.registry-stats { display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
.stat { font-size: 14px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
.stat.done { background: var(--green-light); color: var(--green); }
.stat.prog { background: var(--orange-light); color: var(--orange); }
.stat.todo { background: var(--border); color: var(--text2); }
.stat.total { background: var(--accent-light); color: var(--accent); }
.progress-bar {
  height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;
  margin-bottom: 16px;
}
.progress-fill { height: 100%; background: var(--green); border-radius: 3px; transition: width .4s; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-done { background: var(--green-light); color: var(--green); }
.badge-prog { background: var(--orange-light); color: var(--orange); }
.badge-todo { background: var(--border); color: var(--text2); }

/* ── Phase tabs ── */
.phase-tabs {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px;
  padding: 12px 16px; background: var(--surface); border-radius: var(--radius);
  border: 1px solid var(--border); box-shadow: var(--shadow);
}
.phase-tab {
  padding: 8px 16px; border: 2px solid var(--border); border-radius: 8px;
  background: none; cursor: pointer; font-size: 14px; font-weight: 500;
  color: var(--text2); transition: all .15s;
}
.phase-tab:hover { background: var(--bg); color: var(--text); }
.phase-tab.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); font-weight: 600; }

/* ── Phase content ── */
.phase-content { display: none; }
.phase-content.active { display: block; }
.phase-panels {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 32px 36px; box-shadow: var(--shadow);
}
.phase-panels h1 { font-size: 26px; font-weight: 800; margin: 32px 0 16px; color: var(--text); border-bottom: 2px solid var(--accent-light); padding-bottom: 8px; }
.phase-panels h1:first-child { margin-top: 0; }
.phase-panels h2 { font-size: 21px; font-weight: 700; margin: 28px 0 12px; color: var(--accent); }
.phase-panels h3 { font-size: 17px; font-weight: 600; margin: 20px 0 8px; color: var(--text); }
.phase-panels h4 { font-size: 15px; font-weight: 600; margin: 16px 0 6px; color: var(--text2); }
.phase-panels p { margin: 6px 0; }
.phase-panels ul { padding-left: 24px; margin: 8px 0; }
.phase-panels li { margin: 4px 0; }
.phase-panels hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.phase-panels strong { color: var(--text); }

/* ── Tables ── */
.table-wrap { overflow-x: auto; margin: 16px 0; }
.table-wrap table, .registry-summary table {
  width: 100%; border-collapse: collapse; font-size: 14px;
}
.table-wrap th, .table-wrap td,
.registry-summary th, .registry-summary td {
  padding: 10px 14px; border: 1px solid var(--border); text-align: left;
}
.table-wrap .header-row th, .registry-summary .header-row th {
  background: var(--accent-light); color: var(--accent); font-weight: 600;
}
.table-wrap tr:nth-child(even) { background: var(--bg); }

/* ── Code ── */
.code-block {
  background: #1e293b; color: #e2e8f0; padding: 16px 20px; border-radius: 8px;
  overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 12px 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.inline-code {
  background: var(--accent-light); color: var(--accent); padding: 2px 6px;
  border-radius: 4px; font-size: 13px; font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* ── Checkboxes ── */
.cb { font-size: 16px; margin-right: 4px; }

/* ── Mermaid ── */
.mermaid { background: var(--bg); padding: 16px; border-radius: 8px; margin: 12px 0; text-align: center; }

/* ── Memory timeline ── */
.memory-timeline { margin-top: 16px; }
.memory-entry {
  display: flex; gap: 12px; padding: 14px 18px; margin-bottom: 8px;
  border-radius: 8px; border: 1px solid var(--border); background: var(--surface);
}
.mem-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.mem-body { flex: 1; }
.mem-header { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 4px; }
.mem-type { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: var(--accent-light); color: var(--accent); }
.mem-feature { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: var(--purple-light); color: var(--purple); }
.mem-phase { font-size: 12px; color: var(--text2); }
.mem-header time { font-size: 12px; color: var(--text2); margin-left: auto; }
.mem-summary { font-size: 14px; font-weight: 500; }
.mem-details { font-size: 13px; color: var(--text2); margin-top: 4px; }
.type-error { border-left: 3px solid var(--red); }
.type-debt { border-left: 3px solid var(--orange); }
.type-decision { border-left: 3px solid var(--accent); }
.type-milestone { border-left: 3px solid var(--green); }

/* ── Feature panel ── */
.feature-panel { display: none; }
.feature-panel.active { display: block; }

/* ── Empty state ── */
.empty-state {
  text-align: center; padding: 80px 20px; color: var(--text2);
}
.empty-state h2 { font-size: 24px; margin-bottom: 12px; }
.empty-state p { font-size: 16px; }
.empty-state code { background: var(--accent-light); color: var(--accent); padding: 4px 12px; border-radius: 6px; font-size: 15px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  body { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid var(--border); }
  .main { padding: 20px; }
  .phase-panels { padding: 20px; }
}

/* ── Print ── */
@media print {
  .sidebar { display: none; }
  .main { max-width: 100%; padding: 0; }
  .phase-tabs { display: none; }
  .phase-content { display: block !important; page-break-before: always; }
  .feature-panel { display: block !important; }
}
</style>
</head>
<body>

<nav class="sidebar">
  <h1>VAIS Dashboard</h1>
  <div class="version">Generated ${new Date().toLocaleString('ko-KR')}</div>
  <h2>Features</h2>
  ${featuresNav || '<p style="color:var(--text2);font-size:13px">아직 문서가 없습니다</p>'}
  ${memory?.entries?.length ? `<h2>System</h2><button class="nav-feature" onclick="showFeature('__memory')">🧠 Memory (${memory.entries.length})</button>` : ''}
</nav>

<main class="main">
  ${featureData.length === 0 ? `
    <div class="empty-state">
      <h2>아직 산출물이 없습니다</h2>
      <p><code>/vais auto {피처명}</code> 으로 워크플로우를 시작하세요</p>
    </div>
  ` : ''}
  ${featuresContent}
  ${memoryHtml}
</main>

<script>
mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'strict' });

function showFeature(name) {
  document.querySelectorAll('.feature-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-feature').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById('feature-' + name);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.nav-feature').forEach(b => {
    if (b.textContent.includes(name) || (name === '__memory' && b.textContent.includes('Memory'))) {
      b.classList.add('active');
    }
  });
}

function showPhase(feature, phase) {
  const panel = document.getElementById('feature-' + feature);
  if (!panel) return;

  panel.querySelectorAll('.phase-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.phase === phase && t.dataset.feature === feature);
  });
  panel.querySelectorAll('.phase-content').forEach(c => {
    c.classList.toggle('active', c.id === 'content-' + feature + '-' + phase);
  });

  // re-render mermaid in newly visible content
  const activeContent = document.getElementById('content-' + feature + '-' + phase);
  if (activeContent) {
    activeContent.querySelectorAll('.mermaid:not([data-processed])').forEach(el => {
      mermaid.run({ nodes: [el] });
    });
  }
}
<\/script>
</body>
</html>`;
}

function statusBadge(status) {
  if (!status) return '<span class="badge badge-todo">미구현</span>';
  if (status === '완료') return '<span class="badge badge-done">완료</span>';
  if (status === '진행중') return '<span class="badge badge-prog">진행중</span>';
  return `<span class="badge badge-todo">${escapeHtml(status)}</span>`;
}

// ── 실행 ──────────────────────────────────────────

function main() {
  const data = collectData();
  const html = generateHtml(data);

  // 출력 디렉토리 보장
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  console.log(`✅ Dashboard generated: ${OUTPUT_FILE}`);
  console.log(`   Features: ${data.featureData.length}`);
  console.log(`   Memory entries: ${data.memory?.entries?.length || 0}`);
}

main();
