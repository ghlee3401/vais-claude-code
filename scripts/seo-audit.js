#!/usr/bin/env node
/**
 * seo-audit.js — SEO 감사 도구 (엔트리포인트)
 *
 * 웹 프로젝트의 HTML 파일을 분석하여 Google SEO 기본 가이드 기준으로
 * 검색엔진 최적화 상태를 점검합니다.
 *
 * Usage:
 *   node seo-audit.js <project-root> [--json]
 *
 * 참조: Google SEO Starter Guide
 *   https://developers.google.com/search/docs/fundamentals/seo-starter-guide
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { fileExists } = require('../lib/fs-utils');

// ─── 공유 상수 & 헬퍼 (circular dep 방지를 위해 seo-helpers.js에서 import) ───

const {
  SEVERITY, extractTag, extractMeta, extractMetaProperty,
  detectFramework, findFiles, isAppRouterProject,
  extractBalancedBraces, hasFieldInObject, extractNestedBlock
} = require('./seo-helpers');

// ─── SEOResult 클래스 ─────────────────────────────────────────────

class SEOResult {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.framework = null;
    this.score = null;
  }

  add(severity, category, message, filePath = null, suggestion = null) {
    this.issues.push({
      severity,
      category,
      message,
      filePath,
      suggestion
    });
  }

  get summary() {
    const high = this.issues.filter(i => i.severity === SEVERITY.HIGH).length;
    const med = this.issues.filter(i => i.severity === SEVERITY.MED).length;
    const low = this.issues.filter(i => i.severity === SEVERITY.LOW).length;
    return { high, med, low };
  }

  toJSON() {
    return {
      framework: this.framework,
      filesScanned: this.filesScanned,
      score: this.score,
      summary: this.summary,
      issues: this.issues
    };
  }

  toCLI() {
    const { high, med, low } = this.summary;
    let output = '';
    output += `\n=== SEO Audit Report ===\n`;
    output += `Framework: ${this.framework || 'Unknown'}\n`;
    output += `Files Scanned: ${this.filesScanned}\n`;
    if (this.score !== null) {
      output += `Score: ${this.score.score}/100\n`;
    }
    output += `\nSummary:\n`;
    output += `  High: ${high}\n`;
    output += `  Medium: ${med}\n`;
    output += `  Low: ${low}\n`;
    output += `\nIssues:\n`;

    if (this.issues.length === 0) {
      output += '  No issues found!\n';
    } else {
      for (const issue of this.issues) {
        output += `  [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.message}\n`;
        if (issue.filePath) {
          output += `    File: ${issue.filePath}\n`;
        }
        if (issue.suggestion) {
          output += `    Suggestion: ${issue.suggestion}\n`;
        }
      }
    }

    if (this.score !== null) {
      const { formatScoreBreakdown } = require('./seo-scoring');
      output += formatScoreBreakdown(this.score);
    }

    output += `\n`;
    return output;
  }
}

// ─── 메인 ─────────────────────────────────────────────

function audit(projectRoot) {
  // Design Ref: §3.1 — Clean Architecture: auditor 모듈 lazy require
  const { auditHTML, auditProjectLevel } = require('./auditors/html-audit');
  const { auditNextJS } = require('./auditors/nextjs-audit');
  const { auditCrawlability } = require('./auditors/crawlability');
  const { auditSSR } = require('./auditors/ssr-analysis');
  const { auditWebVitals } = require('./auditors/web-vitals');
  const { auditI18nSEO, auditHreflang } = require('./auditors/i18n-seo');
  const { calculateScore } = require('./seo-scoring');

  const root = path.resolve(projectRoot);
  const result = new SEOResult();

  if (!fileExists(root)) {
    result.add(SEVERITY.HIGH, 'input', `경로가 존재하지 않습니다: ${root}`);
    return result;
  }

  // 프레임워크 감지
  result.framework = detectFramework(root);

  // 프로젝트 레벨 검사 (A~K)
  auditProjectLevel(root, result);

  // HTML 파일 탐색
  const htmlFiles = findFiles(root, ['.html', '.htm']);
  const jsxFiles = findFiles(root, ['.jsx', '.tsx']);

  const allTitles = new Set();
  const allDescs = new Set();

  // HTML 파일 검사 (A~K 카테고리)
  for (const f of htmlFiles) {
    const relPath = path.relative(root, f);
    const content = fs.readFileSync(f, 'utf8');
    auditHTML(content, f, relPath, result, allTitles, allDescs);
    // NEW O-01: hreflang 검사 (HTML 파일)
    auditHreflang(content, relPath, result);
    result.filesScanned++;
  }

  // JSX/TSX 파일 검사
  for (const f of jsxFiles) {
    const relPath = path.relative(root, f);
    const content = fs.readFileSync(f, 'utf8');

    // 기존: Next.js 메타데이터 검사 (프레임워크 기반)
    if (result.framework) {
      auditNextJS(content, f, relPath, result);
    }

    // NEW L: 크롤러 접근성 검사 (프레임워크 무관)
    auditCrawlability(content, f, relPath, result);

    // NEW M: SSR/CSR 렌더링 분석
    auditSSR(content, relPath, result);

    // NEW N: Core Web Vitals 힌트
    auditWebVitals(content, relPath, result);

    result.filesScanned++;
  }

  // NEW O: 국제화 SEO (프로젝트 레벨)
  auditI18nSEO(root, result);

  // 파일이 없으면 알림
  if (htmlFiles.length === 0 && jsxFiles.length === 0) {
    result.add(SEVERITY.LOW, 'files', 'HTML/JSX/TSX 파일을 찾을 수 없습니다.', null,
      '프로젝트 빌드 후 output 디렉토리에서 검사하거나, 소스 디렉토리를 직접 지정하세요.');
  }

  // NEW: 점수 계산
  result.score = calculateScore(result);

  return result;
}

// ─── CLI ──────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const projectRoot = positional[0] || process.cwd();
  const jsonOutput = flags.includes('--json');

  const result = audit(projectRoot);

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(result.toJSON(), null, 2));
  } else {
    process.stdout.write(result.toCLI());
  }

  process.exit(result.summary.high > 0 ? 1 : 0);
}

module.exports = { audit, SEOResult, SEVERITY, extractTag, extractMeta, extractMetaProperty, extractBalancedBraces, hasFieldInObject, extractNestedBlock, isAppRouterProject, findFiles, detectFramework };
