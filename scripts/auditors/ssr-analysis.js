'use strict';

const { SEVERITY } = require('../seo-helpers');

// ─── M. SSR/CSR 렌더링 분석 감사 ─────────────────────────────────────

/**
 * SSR/CSR 렌더링 분석
 *
 * 검사 항목:
 *   M-01: 페이지 파일에서 'use client' 사용 → CSR 렌더링 경고
 *   M-02: next/dynamic + { ssr: false } → 클라이언트 전용 동적 로딩 경고
 *   M-03: 페이지 파일에서 <Suspense 사용 → fallback 콘텐츠 안내
 */

// ─── 헬퍼 ─────────────────────────────────────────────

function isPageOrLayout(relPath) {
  return /(?:page|layout)\.(tsx?|jsx?)$/.test(relPath);
}

// ─── 감사 함수 ─────────────────────────────────────────

function auditSSR(content, relPath, result) {
  // ── M-01: 페이지/레이아웃에서 'use client' 사용 ──
  if (isPageOrLayout(relPath)) {
    const useClientRe = /^['"]use client['"]/m;
    if (useClientRe.test(content)) {
      result.add(SEVERITY.MED, 'ssr',
        '페이지 파일에 \'use client\'가 선언되어 있습니다. 전체 페이지가 CSR로 렌더링되어 크롤러가 콘텐츠를 수집하기 어렵습니다.',
        relPath,
        '\'use client\'를 페이지 레벨에서 제거하고, 클라이언트 로직이 필요한 부분만 별도 Client Component로 분리하세요.');
    }
  }

  // ── M-02: next/dynamic + { ssr: false } ──
  const dynamicNoSSRRe = /dynamic\s*\([^)]*,\s*\{[^}]*ssr\s*:\s*false[^}]*\}/g;
  let match;
  while ((match = dynamicNoSSRRe.exec(content)) !== null) {
    result.add(SEVERITY.MED, 'ssr',
      'next/dynamic에서 ssr: false로 설정된 컴포넌트가 있습니다. 해당 컴포넌트는 서버에서 렌더링되지 않습니다.',
      relPath,
      'SEO에 중요한 콘텐츠가 포함된 컴포넌트는 ssr: false를 제거하거나, 서버 컴포넌트로 전환하세요.');
    break; // 동일 파일에서 한 번만 보고
  }

  // ── M-03: 페이지 파일에서 <Suspense 사용 ──
  if (isPageOrLayout(relPath)) {
    const suspenseRe = /<Suspense\b/;
    if (suspenseRe.test(content)) {
      result.add(SEVERITY.LOW, 'ssr',
        '페이지에서 <Suspense>가 사용되고 있습니다. fallback에 SEO 콘텐츠가 포함되지 않으면 크롤러가 빈 콘텐츠를 수집할 수 있습니다.',
        relPath,
        'Suspense의 fallback prop에 의미 있는 HTML 콘텐츠(skeleton, 제목 등)를 제공하세요.');
    }
  }
}

module.exports = { auditSSR };
