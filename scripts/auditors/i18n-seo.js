'use strict';

const fs = require('fs');
const path = require('path');
const { SEVERITY, extractMetaProperty } = require('../seo-helpers');
const { fileExists } = require('../../lib/fs-utils');

// ─── O. 국제화(i18n) SEO 감사 ─────────────────────────────────────

/**
 * 프로젝트 수준 i18n SEO 검사
 *
 * 검사 항목:
 *   O-02: Next.js 루트 레이아웃에 alternates 설정 누락
 *   O-04: middleware.ts/js에 locale 처리 로직 누락
 */
function auditI18nSEO(root, result) {
  // i18n 설정이 없으면 조용히 종료
  if (!detectI18nConfig(root)) return;

  // Next.js 전용 검사
  if (result.framework === 'Next.js') {
    auditNextJSAlternates(root, result);
  }

  auditI18nRouting(root, result);
}

// ─── hreflang 감사 (HTML 파일 수준) ────────────────────────────────

/**
 * HTML 콘텐츠에서 og:locale이 있지만 hreflang이 없는 경우 경고
 */
function auditHreflang(html, relPath, result) {
  const ogLocale = extractMetaProperty(html, 'og:locale');
  if (!ogLocale) return;

  // hreflang link 태그 존재 확인
  const hasHreflang = /<link\s[^>]*hreflang\s*=/i.test(html);
  if (!hasHreflang) {
    result.add(SEVERITY.MED, 'i18n',
      `og:locale("${ogLocale}")이 설정되어 있지만 hreflang 태그가 없습니다.`,
      relPath,
      '다국어 페이지의 경우 <link rel="alternate" hreflang="ko" href="..." /> 태그를 추가하여 검색엔진에 언어별 URL을 알려주세요.');
  }
}

// ─── 헬퍼: i18n 설정 감지 ──────────────────────────────────────────

/**
 * 프로젝트에 i18n 설정이 있는지 감지
 * - next.config에 i18n/locale 설정
 * - [locale] 동적 라우트 디렉토리
 * - /ko/, /en/ 등 언어별 디렉토리
 */
function detectI18nConfig(root) {
  // 1. next.config 파일에서 i18n/locale 설정 확인
  const nextConfigNames = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  for (const configName of nextConfigNames) {
    const configPath = path.join(root, configName);
    if (fileExists(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        if (/\bi18n\b/.test(configContent) || /\blocale[s]?\b/i.test(configContent)) {
          return true;
        }
      } catch {
        // 읽기 실패 무시
      }
    }
  }

  // 2. [locale] 동적 라우트 패턴 확인
  const appDirs = [
    path.join(root, 'app'),
    path.join(root, 'src', 'app'),
    path.join(root, 'pages'),
    path.join(root, 'src', 'pages')
  ];

  for (const dir of appDirs) {
    if (!fileExists(dir)) continue;
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (/^\[locale\]$/.test(entry) || /^\[lang\]$/.test(entry)) {
          return true;
        }
      }
    } catch {
      // 읽기 실패 무시
    }
  }

  // 3. /ko/, /en/ 등 언어별 디렉토리 확인
  const localeDirs = ['ko', 'en', 'ja', 'zh', 'fr', 'de', 'es'];
  for (const dir of appDirs) {
    if (!fileExists(dir)) continue;
    try {
      const entries = fs.readdirSync(dir);
      const matchCount = entries.filter(e => localeDirs.includes(e)).length;
      // 2개 이상의 언어 디렉토리가 있으면 i18n으로 판단
      if (matchCount >= 2) {
        return true;
      }
    } catch {
      // 읽기 실패 무시
    }
  }

  return false;
}

// ─── 헬퍼: Next.js alternates 검사 ────────────────────────────────

function auditNextJSAlternates(root, result) {
  // 루트 레이아웃 파일 탐색
  const layoutCandidates = [
    path.join(root, 'app', 'layout.tsx'),
    path.join(root, 'app', 'layout.jsx'),
    path.join(root, 'app', 'layout.ts'),
    path.join(root, 'app', 'layout.js'),
    path.join(root, 'src', 'app', 'layout.tsx'),
    path.join(root, 'src', 'app', 'layout.jsx'),
    path.join(root, 'src', 'app', 'layout.ts'),
    path.join(root, 'src', 'app', 'layout.js')
  ];

  for (const layoutPath of layoutCandidates) {
    if (!fileExists(layoutPath)) continue;

    try {
      const content = fs.readFileSync(layoutPath, 'utf8');
      const relPath = path.relative(root, layoutPath);

      // alternates 설정 확인 (metadata 객체 또는 generateMetadata 내)
      const hasAlternates = /alternates\s*[:=]/.test(content)
        || /languages\s*[:=]/.test(content);

      if (!hasAlternates) {
        result.add(SEVERITY.MED, 'i18n',
          '루트 레이아웃의 metadata에 alternates(언어별 대체 URL) 설정이 없습니다.',
          relPath,
          "metadata의 alternates.languages에 언어별 URL을 설정하세요. 예: alternates: { languages: { 'ko': '/ko', 'en': '/en' } }");
      }
    } catch {
      // 읽기 실패 무시
    }

    // 첫 번째로 찾은 레이아웃만 검사
    break;
  }
}

// ─── 헬퍼: i18n 라우팅 미들웨어 검사 ──────────────────────────────

function auditI18nRouting(root, result) {
  const middlewareCandidates = [
    path.join(root, 'middleware.ts'),
    path.join(root, 'middleware.js'),
    path.join(root, 'src', 'middleware.ts'),
    path.join(root, 'src', 'middleware.js')
  ];

  let middlewareFound = false;
  let hasLocaleHandling = false;

  for (const mwPath of middlewareCandidates) {
    if (!fileExists(mwPath)) continue;
    middlewareFound = true;

    try {
      const content = fs.readFileSync(mwPath, 'utf8');
      // locale 관련 로직 감지
      if (/locale/i.test(content) || /i18n/i.test(content)
        || /accept-language/i.test(content) || /negotiator/i.test(content)
        || /intl/i.test(content)) {
        hasLocaleHandling = true;
      }
    } catch {
      // 읽기 실패 무시
    }

    break;
  }

  if (!middlewareFound) {
    result.add(SEVERITY.LOW, 'i18n',
      'i18n이 설정되어 있지만 middleware 파일이 없습니다.',
      null,
      'middleware.ts를 생성하여 사용자의 Accept-Language 헤더 기반 locale 리다이렉트를 구현하세요.');
  } else if (!hasLocaleHandling) {
    result.add(SEVERITY.LOW, 'i18n',
      'middleware 파일에 locale 처리 로직이 감지되지 않았습니다.',
      null,
      'middleware에서 사용자의 언어 설정을 감지하고 적절한 locale 경로로 리다이렉트하는 로직을 추가하세요.');
  }
}

module.exports = { auditI18nSEO, auditHreflang };
