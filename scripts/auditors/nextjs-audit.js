'use strict';

const path = require('path');
const { fileExists } = require('../../lib/fs-utils');
const { SEVERITY, isAppRouterProject, extractBalancedBraces, hasFieldInObject, extractNestedBlock } = require('../seo-helpers');

// ─── Next.js 감사 상수 ─────────────────────────────────────────────

const NEXTJS_METADATA_FIELDS = {
  required: ['title', 'description'],
  recommended: ['openGraph', 'twitter', 'icons', 'keywords']
};

// ─── Next.js Metadata 감사 ─────────────────────────────────────────

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

// ─── JSX/TSX 파일 감사 (Next.js 및 기타 프레임워크) ─────────────────

function auditNextJS(content, filePath, relPath, result) {
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

module.exports = { auditNextJS, auditNextJSFileMetadata };
