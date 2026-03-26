'use strict';

const path = require('path');
const { fileExists } = require('../../lib/fs-utils');
const { SEVERITY, extractTag, extractMeta, extractMetaProperty, isAppRouterProject } = require('../seo-helpers');

// ─── HTML 감사 상수 ─────────────────────────────────────────────

const VAGUE_ANCHORS = [
  '여기', '클릭', '더보기', 'click here', 'here', 'read more',
  'more', 'link', '바로가기', '자세히', 'learn more', '보기'
];

const BAD_IMG_PATTERNS = [/^IMG_\d+/i, /^DSC_?\d+/i, /^image\d*/i, /^photo\d*/i, /^screenshot/i, /^untitled/i];

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

// ─── 프로젝트 레벨 감사 ─────────────────────────────────────────────

function auditProjectLevel(root, result) {
  const { auditNextJSFileMetadata } = require('./nextjs-audit');

  const hasRobotsTxt = fileExists(path.join(root, 'robots.txt'))
    || fileExists(path.join(root, 'public', 'robots.txt'));
  if (!hasRobotsTxt) {
    // Next.js App Router의 파일 기반 robots.ts는 아래에서 별도 체크
    const hasRobotsTs = result.framework === 'Next.js' && isAppRouterProject(root)
      && ['robots.ts', 'robots.js'].some(f =>
        fileExists(path.join(root, 'app', f)) || fileExists(path.join(root, 'src', 'app', f)));
    if (!hasRobotsTs) {
      const suggestion = result.framework === 'Next.js'
        ? 'app/robots.ts를 생성하거나 public/robots.txt를 추가하세요.'
        : 'public/robots.txt 생성: User-agent: *\\nAllow: /\\nSitemap: https://example.com/sitemap.xml';
      result.add(SEVERITY.HIGH, 'robots.txt', 'robots.txt 파일이 없습니다.', null, suggestion);
    }
  }

  // Next.js App Router 파일 기반 메타데이터 검사
  let nextjsFileMeta = null;
  if (result.framework === 'Next.js' && isAppRouterProject(root)) {
    nextjsFileMeta = auditNextJSFileMetadata(root, result);
  }

  // sitemap.xml
  const hasSitemap = fileExists(path.join(root, 'sitemap.xml'))
    || fileExists(path.join(root, 'public', 'sitemap.xml'))
    || fileExists(path.join(root, 'public', 'sitemap-0.xml'))
    || (nextjsFileMeta && nextjsFileMeta.hasSitemapFile);

  if (!hasSitemap) {
    const suggestion = result.framework === 'Next.js'
      ? 'app/sitemap.ts를 생성하거나 next-sitemap 패키지를 설치하세요: npm i next-sitemap'
      : 'sitemap.xml 파일을 생성하여 주요 URL을 나열하세요.';
    result.add(SEVERITY.HIGH, 'sitemap', 'sitemap.xml 파일이 없습니다.', null, suggestion);
  }
}

// ─── HTML 파일 감사 ─────────────────────────────────────────────

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

module.exports = { auditHTML, auditProjectLevel };
