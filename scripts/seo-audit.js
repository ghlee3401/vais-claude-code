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

/**
 * Next.js generateMetadata / metadata export 상세 검사
 *
 * 검사 항목:
 * 1. metadata 객체 필드 완전성 (title, description, openGraph, twitter 등)
 * 2. generateMetadata async 패턴 검증
 * 3. generateViewport / viewport export 감지
 * 4. metadataBase 설정 여부
 * 5. 레이아웃 vs 페이지 metadata 범위 분석
 * 6. next/head 레거시 사용 경고 (App Router)
 */
function auditNextJSMetadata(content, relPath, result, isAppRouter) {
  const isLayout = /layout\.(tsx?|jsx?)$/.test(relPath);
  const isPage = /page\.(tsx?|jsx?)$/.test(relPath);
  if (!isLayout && !isPage) return;

  const hasStaticMetadata = /export\s+const\s+metadata\s*[:=]/m.test(content);
  const hasGenerateMetadata = /export\s+(async\s+)?function\s+generateMetadata/m.test(content)
    || /export\s+const\s+generateMetadata\s*=/m.test(content);
  const hasNextHead = content.includes('next/head') || content.includes('<Head');
  const hasMetadata = hasStaticMetadata || hasGenerateMetadata;

  // App Router에서 next/head 사용은 레거시 패턴
  if (isAppRouter && hasNextHead && !hasMetadata) {
    result.add(SEVERITY.HIGH, 'nextjs-metadata',
      'App Router에서 next/head는 동작하지 않습니다.', relPath,
      'export const metadata 또는 export async function generateMetadata로 마이그레이션하세요.');
    return;
  }

  if (isAppRouter && hasNextHead && hasMetadata) {
    result.add(SEVERITY.MED, 'nextjs-metadata',
      'next/head와 metadata API가 혼용되고 있습니다.', relPath,
      'App Router에서는 metadata API만 사용하세요. next/head import를 제거하세요.');
  }

  // metadata가 전혀 없는 경우
  if (!hasMetadata && !hasNextHead) {
    const severity = isLayout ? SEVERITY.HIGH : SEVERITY.MED;
    result.add(severity, 'nextjs-metadata',
      `Next.js ${isLayout ? '레이아웃' : '페이지'}에 metadata 설정이 없습니다.`, relPath,
      'export const metadata = { title: "...", description: "..." } 를 추가하세요.');
    return;
  }

  // ── 정적 metadata 객체 필드 완전성 검사 ──
  if (hasStaticMetadata) {
    auditStaticMetadataFields(content, relPath, result, isLayout);
  }

  // ── generateMetadata 패턴 검사 ──
  if (hasGenerateMetadata) {
    auditGenerateMetadataPattern(content, relPath, result);
  }

  // ── viewport export 검사 ──
  auditViewportExport(content, relPath, result);

  // ── metadataBase 검사 (루트 레이아웃) ──
  if (isLayout && isRootLayout(relPath)) {
    auditMetadataBase(content, relPath, result);
  }
}

function isRootLayout(relPath) {
  // app/layout.tsx 또는 src/app/layout.tsx
  const normalized = relPath.replace(/\\/g, '/');
  return /^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(normalized);
}

function auditStaticMetadataFields(content, relPath, result, isLayout) {
  // metadata 객체 블록 추출 (간이 파서 — 중괄호 매칭)
  const metadataMatch = content.match(/export\s+const\s+metadata\s*[:=]\s*\{/m);
  if (!metadataMatch) return;

  const startIdx = metadataMatch.index + metadataMatch[0].length - 1;
  const block = extractBalancedBraces(content, startIdx);
  if (!block) return;

  // 필수 필드 검사
  for (const field of NEXTJS_METADATA_FIELDS.required) {
    if (!hasFieldInObject(block, field)) {
      result.add(SEVERITY.HIGH, 'nextjs-metadata',
        `metadata에 필수 필드 '${field}'이(가) 없습니다.`, relPath,
        `metadata 객체에 ${field}: "..." 를 추가하세요.`);
    }
  }

  // 권장 필드 검사
  for (const field of NEXTJS_METADATA_FIELDS.recommended) {
    if (!hasFieldInObject(block, field)) {
      result.add(SEVERITY.LOW, 'nextjs-metadata',
        `metadata에 권장 필드 '${field}'이(가) 없습니다.`, relPath,
        `소셜 공유 및 SEO 개선을 위해 ${field} 필드를 추가하세요.`);
    }
  }

  // title이 Template 패턴인지 확인 (레이아웃에서 권장)
  if (isLayout && hasFieldInObject(block, 'title')) {
    const hasTitleTemplate = block.includes('template') && block.includes('default');
    if (!hasTitleTemplate) {
      result.add(SEVERITY.LOW, 'nextjs-metadata',
        '레이아웃 metadata.title에 template 패턴이 없습니다.', relPath,
        'title: { template: "%s | 사이트명", default: "사이트명" } 형태를 권장합니다.');
    }
  }

  // openGraph 필드 상세 검사
  if (hasFieldInObject(block, 'openGraph')) {
    const ogBlock = extractNestedBlock(block, 'openGraph');
    if (ogBlock) {
      const ogRequired = ['title', 'description', 'images'];
      for (const f of ogRequired) {
        if (!hasFieldInObject(ogBlock, f)) {
          result.add(SEVERITY.MED, 'nextjs-metadata',
            `openGraph에 '${f}' 필드가 없습니다.`, relPath,
            `소셜 미디어 공유 최적화를 위해 openGraph.${f}를 추가하세요.`);
        }
      }
    }
  }

  // twitter 카드 검사
  if (hasFieldInObject(block, 'twitter')) {
    const twBlock = extractNestedBlock(block, 'twitter');
    if (twBlock && !hasFieldInObject(twBlock, 'card')) {
      result.add(SEVERITY.LOW, 'nextjs-metadata',
        "twitter.card 타입이 지정되지 않았습니다.", relPath,
        "twitter: { card: 'summary_large_image' } 를 추가하세요.");
    }
  }
}

function auditGenerateMetadataPattern(content, relPath, result) {
  // async 패턴 확인
  const hasAsync = /export\s+async\s+function\s+generateMetadata/.test(content);
  const hasFunctionDecl = /export\s+function\s+generateMetadata/.test(content);
  const hasArrow = /export\s+const\s+generateMetadata\s*=/.test(content);

  // params 인자 사용 확인 (동적 라우트)
  if (relPath.includes('[') && (hasAsync || hasFunctionDecl)) {
    const paramMatch = content.match(/generateMetadata\s*\(\s*\{?\s*params/);
    if (!paramMatch) {
      result.add(SEVERITY.MED, 'nextjs-metadata',
        '동적 라우트에서 generateMetadata가 params를 받지 않습니다.', relPath,
        'generateMetadata({ params }: Props)로 동적 파라미터를 활용하세요.');
    }
  }

  // return 타입에 기본 필드 포함 확인 (간이 검사)
  const returnMatch = content.match(/return\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/m);
  if (returnMatch) {
    const returnBlock = returnMatch[1];
    if (!returnBlock.includes('title')) {
      result.add(SEVERITY.MED, 'nextjs-metadata',
        'generateMetadata 반환값에 title이 없습니다.', relPath,
        '반환 객체에 title 필드를 포함하세요.');
    }
    if (!returnBlock.includes('description')) {
      result.add(SEVERITY.MED, 'nextjs-metadata',
        'generateMetadata 반환값에 description이 없습니다.', relPath,
        '반환 객체에 description 필드를 포함하세요.');
    }
  }
}

function auditViewportExport(content, relPath, result) {
  // Next.js 14+에서 viewport는 metadata와 분리
  const hasViewportInMetadata = /metadata\s*[:=][\s\S]*?viewport\s*:/m.test(content);
  const hasViewportExport = /export\s+const\s+viewport\s*[:=]/m.test(content)
    || /export\s+(async\s+)?function\s+generateViewport/m.test(content);

  if (hasViewportInMetadata && !hasViewportExport) {
    result.add(SEVERITY.MED, 'nextjs-viewport',
      'viewport가 metadata 객체 안에 있습니다.', relPath,
      'Next.js 14+에서는 export const viewport = { ... }로 별도 export하세요.');
  }
}

function auditMetadataBase(content, relPath, result) {
  const hasMetadataBase = content.includes('metadataBase');
  if (!hasMetadataBase) {
    result.add(SEVERITY.MED, 'nextjs-metadata',
      '루트 레이아웃에 metadataBase가 설정되지 않았습니다.', relPath,
      "export const metadata = { metadataBase: new URL('https://example.com'), ... }");
  }
}

// ── 유틸: 중괄호 균형 추출 ──
function extractBalancedBraces(str, startIdx) {
  if (str[startIdx] !== '{') return null;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return str.substring(startIdx, i + 1);
    }
  }
  return null;
}

function hasFieldInObject(block, field) {
  // 키: 값 패턴 매칭 (따옴표 유무 모두 지원)
  const re = new RegExp(`(?:^|[{,\\s])['"]?${field}['"]?\\s*[:=]`, 'm');
  return re.test(block);
}

function extractNestedBlock(block, field) {
  const re = new RegExp(`['"]?${field}['"]?\\s*[:=]\\s*\\{`);
  const match = block.match(re);
  if (!match) return null;
  const startIdx = block.indexOf('{', match.index + match[0].length - 1);
  return extractBalancedBraces(block, startIdx);
}

/**
 * Next.js App Router 파일 기반 메타데이터 감지
 * opengraph-image, icon, sitemap, robots 등의 파일 컨벤션 검사
 */
function auditNextJSFileMetadata(root, result) {
  const appDir = fileExists(path.join(root, 'src', 'app'))
    ? path.join(root, 'src', 'app')
    : path.join(root, 'app');

  if (!fileExists(appDir)) return;

  // sitemap.ts/js 파일 기반 생성 확인
  const hasSitemapFile = ['sitemap.ts', 'sitemap.js', 'sitemap.tsx', 'sitemap.jsx']
    .some(f => fileExists(path.join(appDir, f)));

  // robots.ts/js 파일 기반 생성 확인
  const hasRobotsFile = ['robots.ts', 'robots.js', 'robots.tsx', 'robots.jsx']
    .some(f => fileExists(path.join(appDir, f)));

  // manifest 검사
  const hasManifest = ['manifest.ts', 'manifest.js', 'manifest.json', 'manifest.webmanifest']
    .some(f => fileExists(path.join(appDir, f)) || fileExists(path.join(root, 'public', f)));

  if (!hasManifest) {
    result.add(SEVERITY.LOW, 'nextjs-file-metadata',
      'Web App Manifest 파일이 없습니다.', null,
      'app/manifest.ts 또는 public/manifest.json을 추가하면 PWA 지원이 향상됩니다.');
  }

  // opengraph-image 확인 (루트)
  const ogImageExts = ['.tsx', '.jsx', '.ts', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
  const hasOGImage = ogImageExts.some(ext => fileExists(path.join(appDir, `opengraph-image${ext}`)));
  if (!hasOGImage) {
    result.add(SEVERITY.LOW, 'nextjs-file-metadata',
      '파일 기반 opengraph-image가 없습니다.', null,
      'app/opengraph-image.tsx를 추가하면 동적 OG 이미지를 자동 생성할 수 있습니다.');
  }

  return { hasSitemapFile, hasRobotsFile };
}

function isAppRouterProject(root) {
  return fileExists(path.join(root, 'app')) || fileExists(path.join(root, 'src', 'app'));
}

function auditJSXFile(content, filePath, relPath, result) {
  // JSX/TSX 에서 SEO 관련 패턴 검사 (Next.js, React 등)

  // Next.js 상세 검사 (App Router)
  if (result.framework === 'Next.js') {
    const root = path.dirname(filePath).replace(/[/\\](src[/\\])?app([/\\].*)?$/, '');
    const isAppRouter = isAppRouterProject(root);
    auditNextJSMetadata(content, relPath, result, isAppRouter);
    return; // Next.js 전용 검사가 더 정밀하므로 기존 로직 스킵
  }

  // 기존 프레임워크 기본 검사 (Next.js 외)
  if (relPath.includes('layout') || relPath.includes('page')) {
    const hasMetadata = content.includes('export const metadata') || content.includes('generateMetadata');
    const hasHead = content.includes('next/head') || content.includes('<Head');
    if (!hasMetadata && !hasHead) {
      result.add(SEVERITY.MED, 'framework', '페이지/레이아웃에 metadata 설정이 없습니다.', relPath,
        'SEO를 위해 Head 컴포넌트 또는 metadata 설정을 추가하세요.');
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
