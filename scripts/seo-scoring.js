'use strict';

/**
 * seo-scoring.js — SEO 점수 산출 엔진
 *
 * seo-audit.js가 수집한 이슈 목록을 카테고리 가중치와 심각도 감점으로 환산하여
 * 100점 만점 점수를 계산합니다.
 *
 * Usage:
 *   const { calculateScore, formatScoreBreakdown } = require('./seo-scoring');
 *   const scoreResult = calculateScore(auditResult);
 *   console.log(formatScoreBreakdown(scoreResult));
 */

// ─── 카테고리 가중치 (높을수록 중요) ──────────────────────────

const CATEGORY_WEIGHTS = {
  // A~K existing
  'robots.txt':          1.5,
  'sitemap':             1.5,
  'title':               1.5,
  'meta-desc':           1.0,
  'viewport':            1.2,
  'h1':                  1.0,
  'heading':             0.5,
  'img-alt':             1.0,
  'img-name':            0.3,
  'anchor':              0.5,
  'link':                0.5,
  'canonical':           1.0,
  'noindex':             1.5,
  'og-tag':              0.8,
  'structured-data':     0.5,
  'lang':                0.8,
  'https':               0.8,
  'nextjs-metadata':     1.2,
  'nextjs-viewport':     0.8,
  'nextjs-file-metadata': 0.3,
  'framework':           0.5,
  // L~O new
  'crawlability':        2.0,
  'ssr':                 1.5,
  'web-vitals':          1.0,
  'i18n':                0.8
};

// ─── 심각도별 기본 감점 ──────────────────────────────────────

const SEVERITY_PENALTY = {
  high:   5,
  medium: 2,
  low:    1
};

// ─── 점수 계산 ──────────────────────────────────────────────

/**
 * calculateScore(result) → { score, breakdown, totalPenalty }
 *
 * @param {object} result — seo-audit.js의 SEOResult (또는 toJSON() 출력)
 *   result.issues: Array<{ severity, category, message, filePath?, suggestion? }>
 * @returns {{ score: number, breakdown: object, totalPenalty: number }}
 */
function calculateScore(result) {
  const issues = result.issues || [];
  const breakdown = {};
  let totalPenalty = 0;

  for (const issue of issues) {
    const cat = issue.category || 'unknown';
    const sev = (issue.severity || 'low').toLowerCase();

    const weight = CATEGORY_WEIGHTS[cat] !== undefined
      ? CATEGORY_WEIGHTS[cat]
      : 1.0;
    const basePenalty = SEVERITY_PENALTY[sev] || SEVERITY_PENALTY.low;
    const penalty = +(weight * basePenalty).toFixed(2);

    if (!breakdown[cat]) {
      breakdown[cat] = { count: 0, penalty: 0, weight, issues: [] };
    }

    breakdown[cat].count += 1;
    breakdown[cat].penalty = +(breakdown[cat].penalty + penalty).toFixed(2);
    breakdown[cat].issues.push({ severity: sev, penalty });

    totalPenalty += penalty;
  }

  totalPenalty = +totalPenalty.toFixed(2);
  const score = Math.max(0, Math.round(100 - totalPenalty));

  return { score, breakdown, totalPenalty };
}

// ─── CLI 출력 포맷 ──────────────────────────────────────────

/**
 * formatScoreBreakdown(scoreResult) → string
 *
 * @param {{ score: number, breakdown: object, totalPenalty: number }} scoreResult
 * @returns {string} CLI-friendly formatted output
 */
function formatScoreBreakdown(scoreResult) {
  const { score, breakdown, totalPenalty } = scoreResult;

  const lines = [];
  lines.push('');
  lines.push('╔═ SEO Score Breakdown ═════════════════════════════════');
  lines.push(`║  Score: ${score}/100  (total penalty: -${totalPenalty})`);
  lines.push('╚═══════════════════════════════════════════════════════');
  lines.push('');

  // Sort categories by penalty descending
  const cats = Object.keys(breakdown).sort(
    (a, b) => breakdown[b].penalty - breakdown[a].penalty
  );

  if (cats.length === 0) {
    lines.push('  No issues found — perfect score!');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('  Category               Weight  Issues  Penalty');
  lines.push('  ─────────────────────  ──────  ──────  ───────');

  for (const cat of cats) {
    const b = breakdown[cat];
    const catPad = cat.padEnd(23);
    const wPad = String(b.weight).padStart(4);
    const cPad = String(b.count).padStart(4);
    const pPad = ('-' + b.penalty).padStart(7);
    lines.push(`  ${catPad}  ${wPad}    ${cPad}  ${pPad}`);
  }

  lines.push('');
  return lines.join('\n');
}

// ─── exports ────────────────────────────────────────────────

module.exports = {
  calculateScore,
  formatScoreBreakdown,
  CATEGORY_WEIGHTS,
  SEVERITY_PENALTY
};
