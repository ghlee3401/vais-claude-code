# Design: vais-seo-v2 — SEO 감사 스킬 대규모 보강

- **Date**: 2026-03-26
- **Author**: ghlee0304
- **Project**: vais-claude-code
- **Version**: 1.0
- **Architecture**: Option B — Clean Architecture (카테고리별 모듈 분리)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | voice-ai에서 vais-seo 감사를 통과했지만 Googlebot이 빈 페이지를 봄 — 정적 분석의 사각지대 |
| **WHO** | vais-seo 사용자 (Next.js/React 프로젝트 개발자) |
| **RISK** | JSX/TSX 정적 분석의 한계 — 모든 런타임 이슈를 잡을 수는 없음 (false negative 가능) |
| **SUCCESS** | voice-ai 동일 패턴 탐지 가능 + 5개 카테고리 추가 + 점수 시스템 카테고리별 가중치 반영 |
| **SCOPE** | scripts/ 하위 파일 리팩토링 + skills/vais-seo/SKILL.md |

---

## 1. Overview

### 1.1 Selected Architecture

**Option B — Clean Architecture**: 기존 단일 파일(`seo-audit.js` 738줄)을 카테고리별 모듈로 분리하고, 신규 4개 카테고리를 독립 모듈로 추가한다.

### 1.2 Architecture Decision Rationale

- 기존 738줄 + 신규 ~500줄 = ~1200줄 단일 파일은 유지보수 어려움
- 카테고리별 독립 모듈로 분리하면 개별 카테고리 수정/테스트 용이
- 점수 엔진을 별도 모듈로 분리하여 감사 로직과 점수 계산 관심사 분리

---

## 2. File Structure

```
scripts/
  seo-audit.js              # 엔트리포인트: CLI, 파일 탐색, 오케스트레이션 (~200줄)
  seo-scoring.js            # 점수 계산 엔진: 가중치, 정규화, breakdown (~120줄)
  auditors/
    index.js                # 모든 auditor를 export하는 barrel 파일
    html-audit.js           # A~K 기존 카테고리 (기존 코드 이동, ~380줄)
    nextjs-audit.js         # Next.js 메타데이터 검사 (기존 코드 이동, ~200줄)
    crawlability.js         # L. 크롤러 접근성 (NEW, ~150줄)
    ssr-analysis.js         # M. SSR/CSR 렌더링 분석 (NEW, ~120줄)
    web-vitals.js           # N. Core Web Vitals 힌트 (NEW, ~100줄)
    i18n-seo.js             # O. 국제화 SEO (NEW, ~100줄)
skills/vais-seo/
  SKILL.md                  # 16개 카테고리 문서화 (수정)
```

---

## 3. Module Design

### 3.1 seo-audit.js (엔트리포인트)

기존의 오케스트레이션 로직만 남기고, 감사 로직은 auditors/로 위임.

```javascript
// 책임: CLI 파싱, 파일 탐색, 프레임워크 감지, auditor 호출, 결과 출력
const { auditHTML } = require('./auditors/html-audit');
const { auditNextJS } = require('./auditors/nextjs-audit');
const { auditCrawlability } = require('./auditors/crawlability');
const { auditSSR } = require('./auditors/ssr-analysis');
const { auditWebVitals } = require('./auditors/web-vitals');
const { auditI18nSEO } = require('./auditors/i18n-seo');
const { calculateScore } = require('./seo-scoring');

// 유지할 기존 함수:
//   - SEOResult 클래스
//   - SEVERITY 상수
//   - detectFramework()
//   - findFiles()
//   - isAppRouterProject()
//   - audit() 메인 함수 (auditor 호출 오케스트레이션)
//   - CLI 진입점

// 변경: audit() 함수에서 신규 auditor 호출 추가
function audit(projectRoot) {
  // ... 기존 파일 탐색 ...

  // 기존 HTML 감사
  for (const f of htmlFiles) { auditHTML(content, ...); }

  // 기존 JSX/TSX 감사 (프레임워크별)
  for (const f of jsxFiles) {
    if (result.framework === 'Next.js') auditNextJS(content, ...);
    // 신규: 크롤러 접근성 검사
    auditCrawlability(content, f, relPath, result);
    // 신규: SSR/CSR 렌더링 분석
    auditSSR(content, relPath, result);
    // 신규: Core Web Vitals 힌트
    auditWebVitals(content, relPath, result);
  }

  // 신규: 국제화 SEO (프로젝트 레벨)
  auditI18nSEO(root, result);

  // 신규: 점수 계산
  result.score = calculateScore(result);

  return result;
}
```

**공유 모듈**: `SEOResult`, `SEVERITY`, 헬퍼 함수들은 seo-audit.js에서 export하여 auditor들이 require.

```javascript
// seo-audit.js에서 export
module.exports = {
  audit,
  SEOResult,
  SEVERITY,
  extractTag,
  extractMeta,
  extractMetaProperty,
  extractBalancedBraces,
  hasFieldInObject,
  extractNestedBlock,
  isAppRouterProject,
  findFiles,
  detectFramework
};
```

### 3.2 auditors/html-audit.js (A~K 기존)

기존 `auditHTML()` 함수와 관련 로직을 그대로 이동. 변경 없음.

```javascript
// 이동할 함수:
//   auditHTML(html, filePath, relPath, result, allTitles, allDescs)
//   auditProjectLevel(root, result) — robots.txt, sitemap 검사 부분

const { SEVERITY, extractTag, extractMeta, extractMetaProperty } = require('../seo-audit');

function auditHTML(html, filePath, relPath, result, allTitles, allDescs) {
  // 기존 코드 그대로 (A~K 카테고리)
}

function auditProjectLevel(root, result) {
  // 기존 코드 그대로
}

module.exports = { auditHTML, auditProjectLevel };
```

### 3.3 auditors/nextjs-audit.js (Next.js 메타데이터)

기존 Next.js 관련 감사 함수들을 이동.

```javascript
// 이동할 함수:
//   auditNextJSMetadata()
//   auditStaticMetadataFields()
//   auditGenerateMetadataPattern()
//   auditViewportExport()
//   auditMetadataBase()
//   auditNextJSFileMetadata()
//   isRootLayout()

module.exports = { auditNextJS, auditNextJSFileMetadata };
```

### 3.4 auditors/crawlability.js (L. 크롤러 접근성) — NEW

**핵심 모듈**: voice-ai 이슈를 잡기 위한 가장 중요한 신규 카테고리.

```javascript
'use strict';

const { SEVERITY } = require('../seo-audit');

// ── 탐지 패턴 상수 ──

const AUTH_HOOKS = [
  'useSession', 'useAuth', 'useUser', 'useCurrentUser',
  'getServerSession', 'getSession', 'auth', 'currentUser'
];

const AUTH_IMPORTS = [
  'next-auth', 'next-auth/react', '@clerk/nextjs', '@auth0/nextjs-auth0',
  '@supabase/auth-helpers-nextjs', 'firebase/auth'
];

const REDIRECT_PATTERNS = [
  /\bredirect\s*\(/,                    // Next.js redirect()
  /\bpermanentRedirect\s*\(/,           // Next.js permanentRedirect()
  /\brouter\.push\s*\(/,                // client-side router.push
  /\brouter\.replace\s*\(/,             // client-side router.replace
  /\bwindow\.location\s*[.=]/           // window.location redirect
];

// 제외할 파일 패턴 (false positive 방지)
const EXCLUDED_FILES = [
  /not-found\.(tsx?|jsx?)$/,
  /error\.(tsx?|jsx?)$/,
  /loading\.(tsx?|jsx?)$/,
  /global-error\.(tsx?|jsx?)$/,
  /middleware\.(tsx?|jsx?)$/,
  /\bapi\//                              // API 라우트 제외
];

/**
 * L. 크롤러 접근성 검사
 *
 * 검사 항목:
 * L-01: 조건부 return null / 빈 JSX 반환 (페이지/레이아웃)
 * L-02: 인증 게이트 패턴 (auth check → redirect/null)
 * L-03: 서버/클라이언트 리다이렉트 패턴
 */
function auditCrawlability(content, filePath, relPath, result) {
  // 제외 파일 필터링
  if (EXCLUDED_FILES.some(pattern => pattern.test(relPath))) return;

  // 페이지/레이아웃 파일만 대상 (Next.js)
  const isPage = /page\.(tsx?|jsx?)$/.test(relPath);
  const isLayout = /layout\.(tsx?|jsx?)$/.test(relPath);
  if (!isPage && !isLayout) return;

  // L-01: 조건부 return null 탐지
  auditConditionalNull(content, relPath, result);

  // L-02: 인증 게이트 패턴 탐지
  auditAuthGate(content, relPath, result);

  // L-03: 페이지 레벨 리다이렉트 패턴 탐지
  auditPageRedirect(content, relPath, result);
}

/**
 * L-01: 조건부 return null / 빈 JSX
 *
 * 패턴:
 *   if (!something) return null;
 *   if (loading) return null;
 *   if (!session) return null;
 *   return condition ? <Component /> : null;
 */
function auditConditionalNull(content, relPath, result) {
  // return null 패턴
  const returnNullPattern = /if\s*\([^)]*\)\s*return\s+null\b/g;
  const matches = content.match(returnNullPattern);

  if (matches && matches.length > 0) {
    // 인증 관련 조건인지 추가 확인
    const hasAuthContext = AUTH_HOOKS.some(hook => content.includes(hook))
      || AUTH_IMPORTS.some(imp => content.includes(imp));

    const severity = hasAuthContext ? SEVERITY.HIGH : SEVERITY.MED;
    const message = hasAuthContext
      ? `인증 상태에 따라 return null을 반환합니다. Googlebot(비로그인)이 빈 페이지를 봅니다.`
      : `조건부 return null이 ${matches.length}개 있습니다. 크롤러가 빈 페이지를 볼 수 있습니다.`;

    result.add(severity, 'crawlability',
      message, relPath,
      '비로그인 사용자에게도 의미 있는 콘텐츠(랜딩 페이지 등)를 표시하세요.');
  }

  // 삼항 연산자로 null 반환: condition ? <X/> : null
  const ternaryNullPattern = /return\s+[^;]*\?\s*(?:<[^>]+>[\s\S]*?)\s*:\s*null/;
  if (ternaryNullPattern.test(content)) {
    result.add(SEVERITY.MED, 'crawlability',
      '삼항 연산자에서 null을 반환하는 패턴이 있습니다.', relPath,
      'null 대신 fallback 콘텐츠를 제공하세요.');
  }

  // 빈 fragment 반환: return <></>;  return (<></>);
  const emptyFragmentPattern = /return\s*\(?\s*<>\s*<\/>\s*\)?/;
  if (emptyFragmentPattern.test(content)) {
    result.add(SEVERITY.MED, 'crawlability',
      '빈 Fragment(<></>)를 반환합니다. 크롤러가 콘텐츠 없는 페이지로 인식합니다.', relPath,
      '빈 Fragment 대신 SEO 친화적인 콘텐츠를 추가하세요.');
  }
}

/**
 * L-02: 인증 게이트 패턴
 *
 * 패턴:
 *   const { data: session } = useSession(); if (!session) redirect('/login');
 *   const session = await getServerSession(); if (!session) return null;
 */
function auditAuthGate(content, relPath, result) {
  const hasAuthImport = AUTH_IMPORTS.some(imp => content.includes(imp));
  const hasAuthHook = AUTH_HOOKS.some(hook => content.includes(hook));

  if (!hasAuthImport && !hasAuthHook) return;

  // 인증 체크 후 리다이렉트 패턴
  const hasRedirectAfterAuth = REDIRECT_PATTERNS.some(p => p.test(content));
  const hasNullAfterAuth = /return\s+null/.test(content);

  if (hasRedirectAfterAuth || hasNullAfterAuth) {
    result.add(SEVERITY.HIGH, 'crawlability',
      '인증 게이트: 비로그인 시 리다이렉트 또는 빈 페이지를 반환합니다.', relPath,
      '이 페이지가 공개 검색에 노출되어야 한다면, 비로그인 사용자에게 공개 콘텐츠를 표시하세요. ' +
      '비공개 페이지라면 robots.txt에서 크롤링을 차단하세요.');
  }
}

/**
 * L-03: 페이지 레벨 리다이렉트
 *
 * 페이지 컴포넌트 최상위에서의 무조건 리다이렉트 탐지
 */
function auditPageRedirect(content, relPath, result) {
  // 함수 본문 최상위에서 redirect() 호출 (조건 없이)
  // 패턴: export default function Page() { redirect('/other'); }
  const unconditionalRedirect = /export\s+(?:default\s+)?(?:async\s+)?function\s+\w+[^{]*\{[\s\n]*(?:\/\/[^\n]*\n\s*)*redirect\s*\(/m;

  if (unconditionalRedirect.test(content)) {
    result.add(SEVERITY.MED, 'crawlability',
      '페이지 진입 시 무조건 리다이렉트됩니다.', relPath,
      '무조건 리다이렉트 대신 next.config.js의 redirects 설정을 사용하면 크롤러가 올바르게 처리합니다.');
  }
}

module.exports = { auditCrawlability };
```

### 3.5 auditors/ssr-analysis.js (M. SSR/CSR 렌더링 분석) — NEW

```javascript
'use strict';

const { SEVERITY } = require('../seo-audit');

/**
 * M. SSR/CSR 렌더링 분석
 *
 * M-01: 'use client' 페이지에서 주요 콘텐츠 렌더링
 * M-02: next/dynamic + { ssr: false } 패턴
 * M-03: Suspense boundary 내 주요 콘텐츠
 */
function auditSSR(content, relPath, result) {
  const isPage = /page\.(tsx?|jsx?)$/.test(relPath);
  const isLayout = /layout\.(tsx?|jsx?)$/.test(relPath);

  // M-01: 'use client' 페이지
  if (content.trimStart().startsWith("'use client'") || content.trimStart().startsWith('"use client"')) {
    if (isPage) {
      result.add(SEVERITY.MED, 'ssr',
        "페이지가 'use client'로 선언되어 있습니다. 주요 콘텐츠가 CSR로 렌더링되면 크롤러가 볼 수 없습니다.",
        relPath,
        "주요 콘텐츠는 Server Component에서 렌더링하고, 인터랙티브 부분만 'use client'로 분리하세요.");
    }
  }

  // M-02: next/dynamic + ssr: false
  const dynamicNoSSR = /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\([^)]*\)[^)]*,\s*\{[^}]*ssr\s*:\s*false/;
  if (dynamicNoSSR.test(content)) {
    result.add(SEVERITY.MED, 'ssr',
      'next/dynamic에서 ssr: false로 설정된 컴포넌트가 있습니다.', relPath,
      'SEO가 중요한 콘텐츠는 ssr: false를 사용하지 마세요. loading 컴포넌트로 대체하세요.');
  }

  // M-03: Suspense boundary 확인 (참고 정보)
  const hasSuspense = /<Suspense/.test(content);
  if (hasSuspense && isPage) {
    result.add(SEVERITY.LOW, 'ssr',
      'Suspense boundary가 사용되고 있습니다. fallback 콘텐츠가 크롤러에게 표시됩니다.', relPath,
      'Suspense fallback에 의미 있는 로딩 스켈레톤이나 텍스트를 제공하세요.');
  }
}

module.exports = { auditSSR };
```

### 3.6 auditors/web-vitals.js (N. Core Web Vitals 힌트) — NEW

```javascript
'use strict';

const { SEVERITY } = require('../seo-audit');

/**
 * N. Core Web Vitals 힌트 (정적 분석)
 *
 * N-01: next/image 미사용 (LCP 영향)
 * N-02: 이미지 width/height 누락 (CLS 영향)
 * N-03: 폰트 로딩 패턴 (next/font 미사용)
 * N-04: 레이아웃 시프트 유발 패턴 (iframe/video 크기 미지정)
 */
function auditWebVitals(content, relPath, result) {
  // N-01: HTML <img> 사용 시 next/image 권장
  if (result.framework === 'Next.js') {
    const hasHtmlImg = /<img\s/i.test(content);
    const hasNextImage = content.includes('next/image') || content.includes('next/legacy/image');

    if (hasHtmlImg && !hasNextImage) {
      result.add(SEVERITY.MED, 'web-vitals',
        'HTML <img> 태그를 사용하고 있습니다. next/image는 자동 최적화를 제공합니다.', relPath,
        "import Image from 'next/image'로 교체하면 WebP 변환, lazy loading, 크기 최적화가 자동 적용됩니다.");
    }
  }

  // N-02: img width/height 누락 (CLS)
  const imgWithoutSize = /<img\s(?![^>]*(?:width|style))[^>]*>/gi;
  const matches = content.match(imgWithoutSize);
  if (matches && matches.length > 0) {
    // Next.js Image 컴포넌트 제외 (대문자 Image)
    const htmlImgOnly = matches.filter(m => !m.includes('Image'));
    if (htmlImgOnly.length > 0) {
      result.add(SEVERITY.MED, 'web-vitals',
        `${htmlImgOnly.length}개 이미지에 width/height가 없습니다 (CLS 원인).`, relPath,
        '이미지에 width, height 속성을 추가하면 레이아웃 시프트를 방지합니다.');
    }
  }

  // N-03: 폰트 로딩 패턴 (Next.js)
  if (result.framework === 'Next.js') {
    const isLayout = /layout\.(tsx?|jsx?)$/.test(relPath);
    if (isLayout) {
      const hasNextFont = content.includes('next/font');
      const hasFontFace = /@font-face/.test(content);
      const hasGoogleFontsLink = /fonts\.googleapis\.com/.test(content);

      if (!hasNextFont && (hasFontFace || hasGoogleFontsLink)) {
        result.add(SEVERITY.LOW, 'web-vitals',
          '@font-face 또는 Google Fonts 링크를 사용합니다. next/font가 더 최적화됩니다.', relPath,
          "import { Inter } from 'next/font/google'로 교체하면 자동 self-hosting과 zero layout shift를 달성합니다.");
      }
    }
  }

  // N-04: iframe/video 크기 미지정 (CLS)
  const iframeNoSize = /<iframe\s(?![^>]*(?:width|style))[^>]*>/gi;
  const iframeMatches = content.match(iframeNoSize);
  if (iframeMatches && iframeMatches.length > 0) {
    result.add(SEVERITY.LOW, 'web-vitals',
      `${iframeMatches.length}개 iframe에 크기가 지정되지 않았습니다 (CLS 원인).`, relPath,
      'iframe에 width, height를 추가하거나 aspect-ratio CSS를 사용하세요.');
  }
}

module.exports = { auditWebVitals };
```

### 3.7 auditors/i18n-seo.js (O. 국제화 SEO) — NEW

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const { SEVERITY, extractMetaProperty } = require('../seo-audit');
const { fileExists } = require('../../lib/fs-utils');

/**
 * O. 국제화(i18n) SEO
 *
 * O-01: hreflang 태그 검사
 * O-02: Next.js alternates 메타데이터 검사
 * O-03: og:locale / og:locale:alternate 검사
 * O-04: i18n 라우팅 설정 검사
 */
function auditI18nSEO(root, result) {
  // i18n 설정 존재 여부 확인
  const hasI18nConfig = detectI18nConfig(root);

  if (!hasI18nConfig) {
    // i18n 미설정 시 단순 안내 (에러 아님)
    return;
  }

  // O-01: hreflang 확인 (HTML 파일)
  // HTML 감사에서 처리하므로 여기서는 프로젝트 레벨 검사

  // O-02: Next.js alternates 메타데이터
  if (result.framework === 'Next.js') {
    auditNextJSAlternates(root, result);
  }

  // O-04: i18n 라우팅 구조 확인
  auditI18nRouting(root, result);
}

/**
 * HTML 파일 내 hreflang 검사 (auditHTML에서 호출용)
 */
function auditHreflang(html, relPath, result) {
  const hasHreflang = /<link[^>]*hreflang/i.test(html);
  const hasOgLocale = extractMetaProperty(html, 'og:locale');

  // 다국어 사이트 힌트가 있는데 hreflang이 없는 경우
  if (hasOgLocale && !hasHreflang) {
    result.add(SEVERITY.MED, 'i18n',
      'og:locale은 설정되었지만 hreflang 태그가 없습니다.', relPath,
      '<link rel="alternate" hreflang="ko" href="...">를 추가하세요.');
  }
}

function detectI18nConfig(root) {
  // next.config에서 i18n 설정 확인
  const nextConfigs = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  for (const configFile of nextConfigs) {
    const configPath = path.join(root, configFile);
    if (fileExists(configPath)) {
      try {
        const config = fs.readFileSync(configPath, 'utf8');
        if (config.includes('i18n') || config.includes('locale')
          || config.includes('internationalization')) {
          return true;
        }
      } catch { /* ignore */ }
    }
  }

  // [locale] 디렉토리 패턴 확인
  const appDir = fileExists(path.join(root, 'src', 'app'))
    ? path.join(root, 'src', 'app')
    : path.join(root, 'app');

  if (fileExists(appDir)) {
    try {
      const entries = fs.readdirSync(appDir);
      if (entries.some(e => /^\[locale\]$|^\[lang\]$|^\(.*locale.*\)$/.test(e))) {
        return true;
      }
      // /ko/, /en/ 등 언어 코드 디렉토리
      if (entries.filter(e => /^[a-z]{2}(-[A-Z]{2})?$/.test(e)).length >= 2) {
        return true;
      }
    } catch { /* ignore */ }
  }

  return false;
}

function auditNextJSAlternates(root, result) {
  // 루트 레이아웃에서 alternates 설정 확인
  const layoutPaths = [
    path.join(root, 'src', 'app', 'layout.tsx'),
    path.join(root, 'src', 'app', 'layout.ts'),
    path.join(root, 'app', 'layout.tsx'),
    path.join(root, 'app', 'layout.ts')
  ];

  for (const layoutPath of layoutPaths) {
    if (!fileExists(layoutPath)) continue;
    try {
      const content = fs.readFileSync(layoutPath, 'utf8');
      if (!content.includes('alternates')) {
        result.add(SEVERITY.MED, 'i18n',
          '다국어 프로젝트이지만 metadata.alternates가 설정되지 않았습니다.',
          path.relative(root, layoutPath),
          "metadata에 alternates: { languages: { 'ko': '/ko', 'en': '/en' } }를 추가하세요.");
      }
      break; // 첫 번째 레이아웃만 검사
    } catch { /* ignore */ }
  }
}

function auditI18nRouting(root, result) {
  // middleware.ts에서 locale 처리 확인
  const middlewarePaths = [
    path.join(root, 'middleware.ts'),
    path.join(root, 'middleware.js'),
    path.join(root, 'src', 'middleware.ts'),
    path.join(root, 'src', 'middleware.js')
  ];

  const hasMiddleware = middlewarePaths.some(p => {
    if (!fileExists(p)) return false;
    try {
      const content = fs.readFileSync(p, 'utf8');
      return content.includes('locale') || content.includes('i18n');
    } catch { return false; }
  });

  if (!hasMiddleware) {
    result.add(SEVERITY.LOW, 'i18n',
      '다국어 프로젝트이지만 middleware에서 locale 처리가 없습니다.', null,
      'middleware.ts에서 Accept-Language 기반 리다이렉트를 설정하세요.');
  }
}

module.exports = { auditI18nSEO, auditHreflang };
```

### 3.8 auditors/index.js (Barrel)

```javascript
'use strict';

module.exports = {
  ...require('./html-audit'),
  ...require('./nextjs-audit'),
  ...require('./crawlability'),
  ...require('./ssr-analysis'),
  ...require('./web-vitals'),
  ...require('./i18n-seo')
};
```

### 3.9 seo-scoring.js (점수 엔진) — NEW

```javascript
'use strict';

/**
 * SEO 점수 계산 엔진
 *
 * 카테고리별 가중치 기반 감점제 (100점 만점)
 * HIGH=5점, MED=2점, LOW=1점 감점
 * 최저 0점
 */

// 카테고리별 가중치 (높을수록 중요)
const CATEGORY_WEIGHTS = {
  // A~K 기존 카테고리
  'robots.txt':       1.5,
  'sitemap':          1.5,
  'title':            1.5,
  'meta-desc':        1.0,
  'viewport':         1.2,
  'h1':               1.0,
  'heading':          0.5,
  'img-alt':          1.0,
  'img-name':         0.3,
  'anchor':           0.5,
  'link':             0.5,
  'canonical':        1.0,
  'noindex':          1.5,
  'og-tag':           0.8,
  'structured-data':  0.5,
  'lang':             0.8,
  'https':            0.8,
  'nextjs-metadata':  1.2,
  'nextjs-viewport':  0.8,
  'nextjs-file-metadata': 0.3,
  'framework':        0.5,
  // L~O 신규 카테고리
  'crawlability':     2.0,   // 가장 높은 가중치 — voice-ai 교훈
  'ssr':              1.5,
  'web-vitals':       1.0,
  'i18n':             0.8
};

const SEVERITY_PENALTY = {
  high: 5,
  medium: 2,
  low: 1
};

/**
 * 점수 계산
 * @param {SEOResult} result
 * @returns {{ score: number, breakdown: Object, maxPenalty: number }}
 */
function calculateScore(result) {
  let totalPenalty = 0;
  const breakdown = {};

  for (const issue of result.issues) {
    const weight = CATEGORY_WEIGHTS[issue.category] || 1.0;
    const penalty = SEVERITY_PENALTY[issue.severity] * weight;
    totalPenalty += penalty;

    if (!breakdown[issue.category]) {
      breakdown[issue.category] = { count: 0, penalty: 0, issues: [] };
    }
    breakdown[issue.category].count++;
    breakdown[issue.category].penalty += penalty;
    breakdown[issue.category].issues.push({
      severity: issue.severity,
      penalty: penalty
    });
  }

  // 100점 만점, 최저 0점
  const score = Math.max(0, Math.round(100 - totalPenalty));

  return { score, breakdown, totalPenalty };
}

/**
 * 점수 breakdown 문자열 생성
 */
function formatScoreBreakdown(scoreResult) {
  let output = `\n=== Score Breakdown ===\n`;
  output += `Total Score: ${scoreResult.score}/100\n`;
  output += `Total Penalty: -${scoreResult.totalPenalty.toFixed(1)}\n\n`;

  const sorted = Object.entries(scoreResult.breakdown)
    .sort((a, b) => b[1].penalty - a[1].penalty);

  for (const [category, data] of sorted) {
    output += `  ${category}: -${data.penalty.toFixed(1)} (${data.count} issues)\n`;
  }

  return output;
}

module.exports = { calculateScore, formatScoreBreakdown, CATEGORY_WEIGHTS, SEVERITY_PENALTY };
```

---

## 4. Data Flow

```
CLI 입력
  │
  ▼
seo-audit.js (엔트리포인트)
  ├─ detectFramework()
  ├─ findFiles() → HTML + JSX/TSX 파일 목록
  │
  ├─ auditors/html-audit.js
  │   ├─ auditProjectLevel() — robots.txt, sitemap
  │   └─ auditHTML() — A~K 카테고리
  │
  ├─ auditors/nextjs-audit.js
  │   ├─ auditNextJS() — metadata, generateMetadata 등
  │   └─ auditNextJSFileMetadata() — 파일 기반 메타데이터
  │
  ├─ auditors/crawlability.js (NEW)
  │   └─ auditCrawlability() — L 카테고리
  │
  ├─ auditors/ssr-analysis.js (NEW)
  │   └─ auditSSR() — M 카테고리
  │
  ├─ auditors/web-vitals.js (NEW)
  │   └─ auditWebVitals() — N 카테고리
  │
  ├─ auditors/i18n-seo.js (NEW)
  │   └─ auditI18nSEO() — O 카테고리 (프로젝트 레벨)
  │
  └─ seo-scoring.js
      └─ calculateScore() → { score, breakdown }
  │
  ▼
SEOResult (이슈 목록 + 점수)
  │
  ▼
CLI 출력 (toCLI / toJSON)
```

---

## 5. SEOResult 확장

기존 SEOResult 클래스에 점수 필드 추가:

```javascript
class SEOResult {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.framework = null;
    this.score = null;        // NEW: { score, breakdown, totalPenalty }
  }

  // toCLI() 수정: 점수 breakdown 포함
  toCLI() {
    // ... 기존 출력 ...
    if (this.score) {
      output += formatScoreBreakdown(this.score);
    }
    return output;
  }

  // toJSON() 수정: 점수 포함
  toJSON() {
    return {
      framework: this.framework,
      filesScanned: this.filesScanned,
      score: this.score ? this.score.score : null,
      scoreBreakdown: this.score ? this.score.breakdown : null,
      summary: this.summary,
      issues: this.issues
    };
  }
}
```

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| auditor 모듈 로드 실패 | try-catch로 감싸고, 해당 카테고리 스킵 + LOW 이슈 추가 |
| 파일 읽기 실패 | 기존 동작 유지 (skip + ignore) |
| 잘못된 정규식 매치 | 각 auditor 내에서 null-safe 처리 |

---

## 7. False Positive 방지 전략

| 상황 | 대응 |
|------|------|
| `not-found.tsx`에서 return null | EXCLUDED_FILES 패턴으로 제외 |
| `error.tsx`에서 return null | EXCLUDED_FILES 패턴으로 제외 |
| `loading.tsx`에서 빈 JSX | EXCLUDED_FILES 패턴으로 제외 |
| `middleware.ts`에서 redirect | EXCLUDED_FILES 패턴으로 제외 |
| API 라우트에서 redirect | `/api/` 경로 제외 |
| 의도적 인증 전용 페이지 | 제안 메시지에 "비공개 페이지라면 robots.txt에서 차단" 안내 |
| 'use client' 래퍼 컴포넌트 (비페이지) | page/layout 파일만 검사 |

---

## 8. Backward Compatibility

| 항목 | 호환성 |
|------|--------|
| `module.exports = { audit, SEOResult }` | 유지 (기존 import 동작 보장) |
| CLI `node seo-audit.js <path>` | 유지 |
| `--json` 플래그 | 유지 (score 필드 추가, 기존 필드 변경 없음) |
| 기존 A~K 이슈 출력 | 코드 이동만, 로직 변경 없음 |
| exit code (high > 0 → exit 1) | 유지 |

---

## 9. SKILL.md 업데이트 계획

신규 카테고리 추가:

```markdown
### L. 크롤러 접근성 (Crawlability) — NEW

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| 조건부 null 반환 | 페이지에서 조건에 따라 return null 패턴 | 높음 |
| 인증 게이트 | 비로그인 시 리다이렉트 또는 빈 페이지 | 높음 |
| 페이지 리다이렉트 | 무조건 redirect() 호출 | 중간 |

### M. SSR/CSR 렌더링 분석 — NEW

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| use client 페이지 | 페이지 전체가 클라이언트 렌더링 | 중간 |
| dynamic ssr:false | next/dynamic으로 SSR 비활성화 | 중간 |
| Suspense 콘텐츠 | 주요 콘텐츠가 Suspense 내부 | 낮음 |

### N. Core Web Vitals 힌트 — NEW

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| next/image 미사용 | HTML img 태그 직접 사용 | 중간 |
| 크기 미지정 | img에 width/height 없음 (CLS) | 중간 |
| 폰트 로딩 | next/font 미사용 | 낮음 |
| iframe 크기 | iframe/video 크기 미지정 | 낮음 |

### O. 국제화(i18n) SEO — NEW

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| hreflang | hreflang 태그 누락 (다국어 시) | 중간 |
| alternates | Next.js metadata.alternates 미설정 | 중간 |
| locale 미들웨어 | middleware에서 locale 처리 없음 | 낮음 |
```

---

## 10. Testing Strategy

| 테스트 | 방법 |
|--------|------|
| voice-ai 프로젝트 회귀 테스트 | `node seo-audit.js /home/ghlee0304-ubuntu/workspace/voice-ai/` → L 카테고리 HIGH 이슈 탐지 확인 |
| 기존 프로젝트 회귀 테스트 | 기존 프로젝트에서 A~K 결과 동일 확인 |
| 점수 계산 검증 | 이슈 없는 프로젝트 → 100점, 이슈 있는 프로젝트 → 적절한 감점 |
| false positive 검증 | not-found.tsx, error.tsx, loading.tsx에서 이슈 미발생 확인 |

---

## 11. Implementation Guide

### 11.1 Implementation Order

| 순서 | 모듈 | 의존성 | 예상 줄 수 |
|------|------|--------|-----------|
| 1 | seo-audit.js 리팩토링 (공유 export 추가) | 없음 | ~200줄 (수정) |
| 2 | auditors/html-audit.js (기존 코드 이동) | seo-audit.js | ~380줄 |
| 3 | auditors/nextjs-audit.js (기존 코드 이동) | seo-audit.js | ~200줄 |
| 4 | auditors/index.js (barrel) | 모든 auditor | ~10줄 |
| 5 | auditors/crawlability.js (L) | seo-audit.js | ~150줄 |
| 6 | auditors/ssr-analysis.js (M) | seo-audit.js | ~80줄 |
| 7 | auditors/web-vitals.js (N) | seo-audit.js | ~100줄 |
| 8 | auditors/i18n-seo.js (O) | seo-audit.js, fs-utils | ~120줄 |
| 9 | seo-scoring.js (점수 엔진) | 없음 | ~100줄 |
| 10 | seo-audit.js 통합 (신규 auditor 호출 + 점수) | 모든 모듈 | ~50줄 (수정) |
| 11 | SKILL.md 업데이트 | 없음 | ~80줄 (추가) |

### 11.2 Key Dependencies

```
seo-audit.js ←── auditors/html-audit.js
     ↑           auditors/nextjs-audit.js
     ↑           auditors/crawlability.js
     ↑           auditors/ssr-analysis.js
     ↑           auditors/web-vitals.js
     ↑           auditors/i18n-seo.js
     ↑
     └── seo-scoring.js
     └── lib/fs-utils.js (기존)
```

### 11.3 Session Guide

| Module | 범위 | 예상 시간 |
|--------|------|---------|
| module-1 | seo-audit.js 리팩토링 + html-audit.js + nextjs-audit.js 분리 (순서 1~4) | 세션 1 |
| module-2 | crawlability.js + ssr-analysis.js (순서 5~6, P0+P1 핵심) | 세션 2 |
| module-3 | web-vitals.js + i18n-seo.js (순서 7~8, P1+P2) | 세션 3 |
| module-4 | seo-scoring.js + 통합 + SKILL.md (순서 9~11) | 세션 4 |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | ghlee0304 | 초기 Design 문서 작성 (Option B: Clean Architecture 선택) |
