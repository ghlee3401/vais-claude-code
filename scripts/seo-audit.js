#!/usr/bin/env node
/**
 * seo-audit.js — SEO 감사 도구
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

// ─── 상수 ─────────────────────────────────────────────

const SEVERITY = { HIGH: 'high', MED: 'medium', LOW: 'low' };

const VAGUE_ANCHORS = [
  '여기', '클릭', '더보기', 'click here', 'here', 'read more',
  'more', 'link', '바로가기', '자세히', 'learn more', '보기'
];

const BAD_IMG_PATTERNS = [/^IMG_\d+/i, /^DSC_?\d+/i, /^image\d*/i, /^photo\d*/i, /^screenshot/i, /^untitled/i];

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

// ─── 결과 수집기 ─────────────────────────────────────────

class SEOResult {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.framework = null;
  }

  add(severity, category, message, file, suggestion) {
    this.issues.push({ severity, category, message, file: file || null, suggestion: suggestion || null });
  }

  get score() {
    let s = 100;
    for (const i of this.issues) {
      if (i.severity === SEVERITY.HIGH) s -= 5;
      else if (i.severity === SEVERITY.MED) s -= 2;
      else s -= 1;
    }
    return Math.max(0, Math.min(100, s));
  }

  get summary() {
    const high = this.issues.filter(i => i.severity === SEVERITY.HIGH).length;
    const med = this.issues.filter(i => i.severity === SEVERITY.MED).length;
    const low = this.issues.filter(i => i.severity === SEVERITY.LOW).length;
    return { score: this.score, high, med, low, total: this.issues.length, files: this.filesScanned };
  }

  toJSON() {
    return { summary: this.summary, framework: this.framework, issues: this.issues };
  }

  toCLI() {
    const S = this.summary;
    const lines = [];

    lines.push('');
    lines.push('╔═ SEO Audit ═══════════════════════════════════════════');
    lines.push(`║ 📊 점수: ${S.score}/100  (${S.files}개 파일 검사)`);
    if (this.framework) lines.push(`║ 🔧 감지된 프레임워크: ${this.framework}`);
    lines.push(`║ ❌ 높음: ${S.high}  ⚠️ 중간: ${S.med}  ℹ️ 낮음: ${S.low}`);
    lines.push('╚═══════════════════════════════════════════════════════');
    lines.push('');

    const high = this.issues.filter(i => i.severity === SEVERITY.HIGH);
    const med = this.issues.filter(i => i.severity === SEVERITY.MED);
    const low = this.issues.filter(i => i.severity === SEVERITY.LOW);

    if (high.length > 0) {
      lines.push('── 높은 심각도 (반드시 수정) ─────────────────────────────');
      for (const i of high) {
        lines.push(`  ❌ [${i.category}] ${i.message}`);
        if (i.file) lines.push(`     📄 ${i.file}`);
        if (i.suggestion) lines.push(`     💡 ${i.suggestion}`);
      }
      lines.push('');
    }

    if (med.length > 0) {
      lines.push('── 중간 심각도 (권장 수정) ──────────────────────────────');
      for (const i of med) {
        lines.push(`  ⚠️  [${i.category}] ${i.message}`);
        if (i.file) lines.push(`     📄 ${i.file}`);
        if (i.suggestion) lines.push(`     💡 ${i.suggestion}`);
      }
      lines.push('');
    }

    if (low.length > 0) {
      lines.push('── 낮은 심각도 (개선 권장) ──────────────────────────────');
      for (const i of low) {
        lines.push(`  ℹ️  [${i.category}] ${i.message}`);
        if (i.suggestion) lines.push(`     💡 ${i.suggestion}`);
      }
      lines.push('');
    }

    if (S.total === 0) {
      lines.push('  ✅ 모든 검사를 통과했습니다!');
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ─── 유틸 ─────────────────────────────────────────────

function fileExists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function findFiles(dir, exts, maxDepth = 6, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist' || e.name === '.next' || e.name === '.nuxt') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...findFiles(full, exts, maxDepth, depth + 1));
    } else if (exts.some(ext => e.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function extractTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  if (m) return m[1];
  // content가 앞에 올 수도 있음
  const re2 = new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractMetaProperty(html, prop) {
  const re = new RegExp(`<meta\\s[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i');
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

// ─── 검사기들 ─────────────────────────────────────────

function detectFramework(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fileExists(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) return 'Next.js';
    if (deps['nuxt'] || deps['nuxt3']) return 'Nuxt';
    if (deps['gatsby']) return 'Gatsby';
    if (deps['astro']) return 'Astro';
    if (deps['@sveltejs/kit']) return 'SvelteKit';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue';
    if (deps['angular'] || deps['@angular/core']) return 'Angular';
  } catch {}
  return null;
}

function auditProjectLevel(root, result) {
  // robots.txt
  if (!fileExists(path.join(root, 'robots.txt')) && !fileExists(path.join(root, 'public', 'robots.txt'))) {
    result.add(SEVERITY.HIGH, 'robots.txt', 'robots.txt 파일이 없습니다.', null,
      'public/robots.txt 생성: User-agent: *\\nAllow: /\\nSitemap: https://example.com/sitemap.xml');
  }

  // sitemap.xml
  const hasSitemap = fileExists(path.join(root, 'sitemap.xml'))
    || fileExists(path.join(root, 'public', 'sitemap.xml'))
    || fileExists(path.join(root, 'public', 'sitemap-0.xml'));

  if (!hasSitemap) {
    // Next.js는 next-sitemap 패키지로 자동 생성 가능
    const suggestion = result.framework === 'Next.js'
      ? 'next-sitemap 패키지 설치: npm i next-sitemap'
      : 'sitemap.xml 파일을 생성하여 주요 URL을 나열하세요.';
    result.add(SEVERITY.HIGH, 'sitemap', 'sitemap.xml 파일이 없습니다.', null, suggestion);
  }
}

function auditHTML(html, filePath, relPath, result, allTitles, allDescs) {
  // ── Title ──
  const title = extractTag(html, 'title');
  if (!title) {
    result.add(SEVERITY.HIGH, 'title', '<title> 태그가 없습니다.', relPath,
      '각 페이지에 고유하고 설명적인 <title>을 추가하세요.');
  } else {
    if (title.length < TITLE_MIN) {
      result.add(SEVERITY.MED, 'title', `제목이 너무 짧습니다 (${title.length}자, 권장 ${TITLE_MIN}~${TITLE_MAX}).`, relPath);
    } else if (title.length > TITLE_MAX) {
      result.add(SEVERITY.MED, 'title', `제목이 너무 깁니다 (${title.length}자, 권장 ${TITLE_MIN}~${TITLE_MAX}).`, relPath);
    }
    if (allTitles.has(title)) {
      result.add(SEVERITY.HIGH, 'title', `중복 제목: "${title.substring(0, 50)}..."`, relPath,
        '각 페이지마다 고유한 제목을 사용하세요.');
    }
    allTitles.add(title);
  }

  // ── Meta description ──
  const desc = extractMeta(html, 'description');
  if (!desc) {
    result.add(SEVERITY.MED, 'meta-desc', '메타 설명이 없습니다.', relPath,
      '<meta name="description" content="페이지 요약">을 추가하세요.');
  } else {
    if (desc.length < DESC_MIN) {
      result.add(SEVERITY.LOW, 'meta-desc', `메타 설명이 짧습니다 (${desc.length}자, 권장 ${DESC_MIN}~${DESC_MAX}).`, relPath);
    } else if (desc.length > DESC_MAX) {
      result.add(SEVERITY.LOW, 'meta-desc', `메타 설명이 깁니다 (${desc.length}자, 권장 ${DESC_MIN}~${DESC_MAX}).`, relPath);
    }
    if (allDescs.has(desc)) {
      result.add(SEVERITY.MED, 'meta-desc', `중복 메타 설명 발견.`, relPath);
    }
    allDescs.add(desc);
  }

  // ── Viewport ──
  const viewport = extractMeta(html, 'viewport');
  if (!viewport && html.includes('<html')) {
    result.add(SEVERITY.HIGH, 'viewport', '<meta name="viewport"> 태그가 없습니다.', relPath,
      '<meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  // ── H1 ──
  const h1Matches = html.match(/<h1[^>]*>/gi);
  if (!h1Matches) {
    result.add(SEVERITY.HIGH, 'h1', '<h1> 태그가 없습니다.', relPath,
      '페이지의 주요 제목을 <h1>으로 감싸세요.');
  } else if (h1Matches.length > 1) {
    result.add(SEVERITY.MED, 'h1', `<h1> 태그가 ${h1Matches.length}개 있습니다. 1개를 권장합니다.`, relPath);
  }

  // ── Heading hierarchy ──
  const headings = [];
  const hRe = /<h([1-6])[^>]*>/gi;
  let hm;
  while ((hm = hRe.exec(html)) !== null) headings.push(parseInt(hm[1]));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      result.add(SEVERITY.LOW, 'heading', `제목 계층 건너뛰기: h${headings[i - 1]} → h${headings[i]}`, relPath,
        '제목 태그는 h1→h2→h3 순서로 사용하세요.');
      break; // 한 번만 경고
    }
  }

  // ── Images ──
  const imgRe = /<img\s[^>]*>/gi;
  let imgMatch;
  let noAltCount = 0;
  let emptyAltCount = 0;
  let badNameCount = 0;
  while ((imgMatch = imgRe.exec(html)) !== null) {
    const tag = imgMatch[0];
    if (!tag.includes('alt=')) {
      noAltCount++;
    } else {
      const altMatch = tag.match(/alt=["']([^"']*)["']/);
      if (altMatch && altMatch[1].trim() === '') emptyAltCount++;
    }
    const srcMatch = tag.match(/src=["']([^"']*)["']/);
    if (srcMatch) {
      const filename = path.basename(srcMatch[1]).split('?')[0];
      if (BAD_IMG_PATTERNS.some(p => p.test(filename))) badNameCount++;
    }
  }
  if (noAltCount > 0) {
    result.add(SEVERITY.HIGH, 'img-alt', `${noAltCount}개 이미지에 alt 속성이 없습니다.`, relPath,
      'img 태그에 설명적인 alt 텍스트를 추가하세요.');
  }
  if (emptyAltCount > 0) {
    result.add(SEVERITY.MED, 'img-alt', `${emptyAltCount}개 이미지의 alt가 비어있습니다.`, relPath);
  }
  if (badNameCount > 0) {
    result.add(SEVERITY.LOW, 'img-name', `${badNameCount}개 이미지의 파일명이 비설명적입니다 (IMG_xxx 등).`, relPath,
      '이미지 파일명을 내용을 설명하는 이름으로 변경하세요.');
  }

  // ── Links ──
  const linkRe = /<a\s[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  let vagueAnchorCount = 0;
  let emptyHrefCount = 0;
  while ((linkMatch = linkRe.exec(html)) !== null) {
    const anchor = linkMatch[1].replace(/<[^>]*>/g, '').trim().toLowerCase();
    if (VAGUE_ANCHORS.some(v => anchor === v)) vagueAnchorCount++;
    const href = linkMatch[0].match(/href=["']([^"']*)["']/);
    if (href && (href[1] === '#' || href[1] === '')) emptyHrefCount++;
  }
  if (vagueAnchorCount > 0) {
    result.add(SEVERITY.MED, 'anchor', `${vagueAnchorCount}개의 비설명적 앵커 텍스트 ("여기", "클릭" 등).`, relPath,
      '링크 텍스트에 대상 페이지를 설명하는 내용을 사용하세요.');
  }
  if (emptyHrefCount > 0) {
    result.add(SEVERITY.MED, 'link', `${emptyHrefCount}개의 빈/무효 링크 (href="#" 등).`, relPath);
  }

  // ── Canonical ──
  const hasCanonical = /<link\s[^>]*rel=["']canonical["']/i.test(html);
  if (!hasCanonical && html.includes('<html')) {
    result.add(SEVERITY.MED, 'canonical', 'canonical 링크가 없습니다.', relPath,
      '<link rel="canonical" href="https://example.com/page">를 추가하세요.');
  }

  // ── noindex 체크 ──
  const noindex = extractMeta(html, 'robots');
  if (noindex && noindex.toLowerCase().includes('noindex')) {
    result.add(SEVERITY.HIGH, 'noindex', '이 페이지에 noindex가 설정되어 있습니다. 의도적인지 확인하세요.', relPath);
  }

  // ── OG Tags ──
  if (!extractMetaProperty(html, 'og:title')) {
    result.add(SEVERITY.MED, 'og-tag', 'og:title이 없습니다.', relPath,
      '<meta property="og:title" content="제목">을 추가하세요.');
  }
  if (!extractMetaProperty(html, 'og:description')) {
    result.add(SEVERITY.MED, 'og-tag', 'og:description이 없습니다.', relPath);
  }
  if (!extractMetaProperty(html, 'og:image')) {
    result.add(SEVERITY.MED, 'og-tag', 'og:image가 없습니다.', relPath,
      '소셜 미디어 공유 시 표시될 이미지를 지정하세요.');
  }

  // ── Structured data ──
  if (!html.includes('application/ld+json')) {
    result.add(SEVERITY.LOW, 'structured-data', '구조화 데이터(JSON-LD)가 없습니다.', relPath,
      'schema.org 기반 JSON-LD를 추가하면 Google 리치 결과에 표시될 수 있습니다.');
  }

  // ── lang 속성 ──
  if (html.includes('<html') && !/<html[^>]*lang=/i.test(html)) {
    result.add(SEVERITY.MED, 'lang', '<html> 태그에 lang 속성이 없습니다.', relPath,
      '<html lang="ko"> 또는 적절한 언어 코드를 추가하세요.');
  }

  // ── HTTP 링크 ──
  const httpLinks = (html.match(/href=["']http:\/\//gi) || []).length;
  if (httpLinks > 0) {
    result.add(SEVERITY.MED, 'https', `${httpLinks}개의 HTTP(비보안) 링크가 있습니다.`, relPath,
      '가능한 경우 https:// 로 변경하세요.');
  }
}

function auditJSXFile(content, filePath, relPath, result) {
  // JSX/TSX 에서 SEO 관련 패턴 검사 (Next.js, React 등)

  // Next.js metadata export 확인
  if (relPath.includes('layout') || relPath.includes('page')) {
    const hasMetadata = content.includes('export const metadata') || content.includes('generateMetadata');
    const hasHead = content.includes('next/head') || content.includes('<Head');
    if (!hasMetadata && !hasHead) {
      result.add(SEVERITY.MED, 'framework', 'Next.js 페이지/레이아웃에 metadata 설정이 없습니다.', relPath,
        'export const metadata = { title: "...", description: "..." } 를 추가하세요.');
    }
  }

  // useHead (Nuxt) 확인
  if (content.includes('definePageMeta') || content.includes('useHead')) {
    // Nuxt SEO 설정이 있으므로 OK
  }
}

// ─── 메인 ─────────────────────────────────────────────

function audit(projectRoot) {
  const root = path.resolve(projectRoot);
  const result = new SEOResult();

  if (!fileExists(root)) {
    result.add(SEVERITY.HIGH, 'input', `경로가 존재하지 않습니다: ${root}`);
    return result;
  }

  // 프레임워크 감지
  result.framework = detectFramework(root);

  // 프로젝트 레벨 검사
  auditProjectLevel(root, result);

  // HTML 파일 탐색
  const htmlFiles = findFiles(root, ['.html', '.htm']);
  const jsxFiles = findFiles(root, ['.jsx', '.tsx']);

  const allTitles = new Set();
  const allDescs = new Set();

  // HTML 파일 검사
  for (const f of htmlFiles) {
    const relPath = path.relative(root, f);
    const content = fs.readFileSync(f, 'utf8');
    auditHTML(content, f, relPath, result, allTitles, allDescs);
    result.filesScanned++;
  }

  // JSX/TSX 파일 검사 (프레임워크 기반)
  if (result.framework) {
    for (const f of jsxFiles) {
      const relPath = path.relative(root, f);
      const content = fs.readFileSync(f, 'utf8');
      auditJSXFile(content, f, relPath, result);
      result.filesScanned++;
    }
  }

  // 파일이 없으면 알림
  if (htmlFiles.length === 0 && jsxFiles.length === 0) {
    result.add(SEVERITY.LOW, 'files', 'HTML/JSX/TSX 파일을 찾을 수 없습니다.', null,
      '프로젝트 빌드 후 output 디렉토리에서 검사하거나, 소스 디렉토리를 직접 지정하세요.');
  }

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

module.exports = { audit, SEOResult };
