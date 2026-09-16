'use strict';

// Local review page for the UI loop (docs/harness/design.md §5, §10): approved option, the
// screen before the work, and the latest round side by side, followed by every round's diff
// and the Design's checklist. Written by `review prepare` into 04-review/evidence/review.html.

const fs = require('fs');
const path = require('path');
const { parseDocument, workItemDirectory, PHASE_FOLDERS, atomicWrite } = require('./document-manager');

const MAX_CHECKLIST = 5;

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function screensDirectory(projectRoot, item) {
  return path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.do, 'evidence', 'screens');
}

function listRounds(projectRoot, item) {
  const base = screensDirectory(projectRoot, item);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base)
    .map(name => /^round-(\d+)$/.exec(name))
    .filter(Boolean)
    .map(match => ({ round: Number(match[1]), dir: path.join(base, match[0]) }))
    .sort((left, right) => left.round - right.round);
}

// `## 검수표` bullets or table rows from the approved Design, at most five.
function extractChecklist(markdown) {
  const lines = String(markdown || '').split('\n');
  const items = [];
  let inside = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,6}\s/.test(line)) { inside = /검수표|checklist/i.test(line); continue; }
    if (!inside || !line) continue;
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) items.push(bullet[1]);
    else if (/^\|/.test(line) && !/^\|\s*-/.test(line) && !/^\|\s*(?:번호|#|항목)\s*\|/.test(line)) {
      items.push(line.split('|').map(cell => cell.trim()).filter(Boolean).join(' · '));
    }
  }
  return items.slice(0, MAX_CHECKLIST);
}

function optionScreens(projectRoot, item, option) {
  if (!option) return null;
  const dir = path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.design, 'options', String(option));
  return {
    option,
    desktop: fs.existsSync(path.join(dir, 'desktop.png')) ? path.join(dir, 'desktop.png') : null,
    mobile: fs.existsSync(path.join(dir, 'mobile.png')) ? path.join(dir, 'mobile.png') : null,
  };
}

function image(fromDir, file, label) {
  if (!file || !fs.existsSync(file)) return `<figure><figcaption>${escapeHtml(label)}</figcaption><p class="missing">없음</p></figure>`;
  const relative = path.relative(fromDir, file).split(path.sep).join('/');
  return `<figure><figcaption>${escapeHtml(label)}</figcaption><img src="${escapeHtml(relative)}" alt="${escapeHtml(label)}" loading="lazy"></figure>`;
}

function buildReviewPage(projectRoot, item) {
  const reviewDir = path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.review, 'evidence');
  const design = parseDocument(path.join(workItemDirectory(projectRoot, item), PHASE_FOLDERS.design, 'main.md'));
  const checklist = extractChecklist(design?.content);
  const rounds = listRounds(projectRoot, item);
  const before = rounds.find(entry => entry.round === 0) || null;
  const latest = rounds.filter(entry => entry.round > 0).at(-1) || null;
  const chosen = optionScreens(projectRoot, item, item.chosenOption);
  const columns = [
    ['승인 시안', chosen?.desktop, chosen?.mobile],
    ['전 (작업 전)', before ? path.join(before.dir, 'desktop.png') : null, before ? path.join(before.dir, 'mobile.png') : null],
    [`후 (회차 ${latest?.round ?? '—'})`, latest ? path.join(latest.dir, 'desktop.png') : null, latest ? path.join(latest.dir, 'mobile.png') : null],
  ];
  const diffSections = rounds.filter(entry => entry.round > 0).map(entry => {
    const diff = path.join(entry.dir, 'diff.md');
    const body = fs.existsSync(diff) ? fs.readFileSync(diff, 'utf8') : '변경 요약 없음';
    return `<section class="round"><h3>회차 ${entry.round}</h3><pre>${escapeHtml(body)}</pre></section>`;
  });
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(item.id)} 검수 페이지</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;color:#222;background:#fafafa}
h1{font-size:20px}h2{font-size:16px;margin-top:32px}h3{font-size:14px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
figure{margin:0;background:#fff;border:1px solid #ddd;border-radius:8px;padding:8px}
figcaption{font-size:12px;color:#555;margin-bottom:6px}img{max-width:100%;display:block;border:1px solid #eee}
.missing{color:#999;font-size:12px}pre{background:#fff;border:1px solid #ddd;padding:12px;white-space:pre-wrap;font-size:12px}
ol li{margin:4px 0}
</style></head><body>
<h1>${escapeHtml(item.title)} — 검수 페이지</h1>
<p>${escapeHtml(item.id)} · 선택한 안: ${chosen ? `안 ${chosen.option}` : '없음'} · 수정 회차 ${escapeHtml(item.screenRevisionCount ?? 0)}회 · 자동 생성 (review prepare)</p>
<h2>데스크톱</h2><div class="grid">${columns.map(([label, desktop]) => image(reviewDir, desktop, label)).join('')}</div>
<h2>모바일</h2><div class="grid">${columns.map(([label, , mobile]) => image(reviewDir, mobile, label)).join('')}</div>
<h2>검수표 (Design)</h2>${checklist.length ? `<ol>${checklist.map(entry => `<li>${escapeHtml(entry)}</li>`).join('')}</ol>` : '<p class="missing">Design 에 ## 검수표 절이 없다</p>'}
<h2>회차 변경 요약</h2>${diffSections.join('') || '<p class="missing">회차 기록 없음</p>'}
</body></html>
`;
  return { html, path: path.join(reviewDir, 'review.html'), rounds: rounds.map(entry => entry.round), checklist };
}

function writeReviewPage(projectRoot, item) {
  const page = buildReviewPage(projectRoot, item);
  atomicWrite(page.path, page.html);
  return page;
}

module.exports = { MAX_CHECKLIST, screensDirectory, listRounds, extractChecklist, optionScreens, buildReviewPage, writeReviewPage };
