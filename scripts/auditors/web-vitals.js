'use strict';

const { SEVERITY } = require('../seo-helpers');

// ─── N. Core Web Vitals 힌트 감사 (정적 분석) ─────────────────────

/**
 * Core Web Vitals 관련 정적 분석
 *
 * 검사 항목:
 *   N-01: Next.js 프로젝트에서 next/image 미사용 HTML <img> 감지 (LCP)
 *   N-02: <img>에 width/height 속성 누락 (CLS)
 *   N-03: Next.js 레이아웃에서 next/font 미사용 웹폰트 감지 (CLS/LCP)
 *   N-04: <iframe>에 width/height 속성 누락 (CLS)
 */
function auditWebVitals(content, relPath, result) {
  auditN01_NextImageUsage(content, relPath, result);
  auditN02_ImgDimensions(content, relPath, result);
  auditN03_NextFont(content, relPath, result);
  auditN04_IframeDimensions(content, relPath, result);
}

// ─── N-01: Next.js 프로젝트에서 HTML <img> 사용 감지 ──────────────

function auditN01_NextImageUsage(content, relPath, result) {
  if (result.framework !== 'Next.js') return;

  // next/image import가 있으면 OK
  if (/from\s+['"]next\/image['"]/.test(content)) return;
  if (/require\s*\(\s*['"]next\/image['"]\s*\)/.test(content)) return;

  // HTML <img 태그 존재 여부 (JSX의 <Image 는 제외)
  const imgMatches = content.match(/<img\s/gi);
  if (imgMatches && imgMatches.length > 0) {
    result.add(SEVERITY.MED, 'web-vitals',
      `Next.js 프로젝트에서 <img> 태그가 ${imgMatches.length}개 발견되었습니다. next/image를 사용하지 않고 있습니다.`,
      relPath,
      "import Image from 'next/image'로 교체하면 자동 이미지 최적화(WebP/AVIF 변환, lazy loading, 반응형 크기 조정)를 활용할 수 있습니다.");
  }
}

// ─── N-02: <img>에 width/height 속성 누락 (CLS 방지) ─────────────

function auditN02_ImgDimensions(content, relPath, result) {
  // Next.js <Image> 컴포넌트는 자동 처리하므로 제외
  // HTML <img 태그만 대상
  const imgRegex = /<img\s([^>]*)>/gi;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const attrs = match[1];

    // fill 속성이 있으면 width/height 불필요 (Next.js Image fill 모드)
    if (/\bfill\b/i.test(attrs)) continue;

    const hasWidth = /\bwidth\s*=/.test(attrs);
    const hasHeight = /\bheight\s*=/.test(attrs);

    if (!hasWidth || !hasHeight) {
      // 이미지 식별을 위해 src 추출 시도
      const srcMatch = attrs.match(/src\s*=\s*["']([^"']*?)["']/);
      const srcHint = srcMatch ? ` (src: ${srcMatch[1]})` : '';

      result.add(SEVERITY.MED, 'web-vitals',
        `<img> 태그에 width/height 속성이 누락되어 CLS(레이아웃 밀림)가 발생할 수 있습니다${srcHint}.`,
        relPath,
        '<img> 태그에 width와 height 속성을 명시하거나, CSS aspect-ratio를 설정하여 레이아웃 밀림을 방지하세요.');
    }
  }
}

// ─── N-03: Next.js 레이아웃에서 next/font 미사용 웹폰트 감지 ──────

function auditN03_NextFont(content, relPath, result) {
  if (result.framework !== 'Next.js') return;

  // 레이아웃 파일만 대상
  const isLayout = /layout\.(tsx?|jsx?)$/.test(relPath);
  if (!isLayout) return;

  // next/font import가 있으면 OK
  const hasNextFont = /from\s+['"]next\/font/.test(content)
    || /require\s*\(\s*['"]next\/font/.test(content);
  if (hasNextFont) return;

  // @font-face 또는 Google Fonts 사용 감지
  const hasFontFace = /@font-face\s*\{/.test(content);
  const hasGoogleFonts = /fonts\.googleapis\.com/.test(content);

  if (hasFontFace || hasGoogleFonts) {
    const fontType = hasFontFace ? '@font-face' : 'Google Fonts 외부 링크';
    result.add(SEVERITY.LOW, 'web-vitals',
      `레이아웃에서 ${fontType}를 사용하고 있지만 next/font를 활용하지 않고 있습니다.`,
      relPath,
      "next/font/google 또는 next/font/local을 사용하면 폰트가 빌드 시 최적화되어 CLS 및 LCP가 개선됩니다. 예: import { Inter } from 'next/font/google'");
  }
}

// ─── N-04: <iframe>에 width/height 속성 누락 (CLS 방지) ──────────

function auditN04_IframeDimensions(content, relPath, result) {
  const iframeRegex = /<iframe\s([^>]*)>/gi;
  let match;

  while ((match = iframeRegex.exec(content)) !== null) {
    const attrs = match[1];

    const hasWidth = /\bwidth\s*=/.test(attrs);
    const hasHeight = /\bheight\s*=/.test(attrs);

    if (!hasWidth || !hasHeight) {
      const srcMatch = attrs.match(/src\s*=\s*["']([^"']*?)["']/);
      const srcHint = srcMatch ? ` (src: ${srcMatch[1]})` : '';

      result.add(SEVERITY.LOW, 'web-vitals',
        `<iframe> 태그에 width/height 속성이 누락되어 CLS(레이아웃 밀림)가 발생할 수 있습니다${srcHint}.`,
        relPath,
        '<iframe>에 width와 height 속성을 명시하거나, CSS로 고정 크기를 지정하여 레이아웃 밀림을 방지하세요.');
    }
  }
}

module.exports = { auditWebVitals };
