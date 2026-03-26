'use strict';

const { SEVERITY } = require('../seo-helpers');

// ─── 상수 ─────────────────────────────────────────────

const AUTH_HOOKS = [
  'useSession', 'useAuth', 'useUser', 'useCurrentUser',
  'getServerSession', 'getSession', 'auth', 'currentUser'
];

const AUTH_IMPORTS = [
  'next-auth', 'next-auth/react', '@clerk/nextjs',
  '@auth0/nextjs-auth0', '@supabase/auth-helpers-nextjs', 'firebase/auth'
];

const REDIRECT_PATTERNS = [
  'redirect(', 'permanentRedirect(', 'router.push(', 'router.replace(', 'window.location'
];

const EXCLUDED_FILES = [
  'not-found', 'error', 'loading', 'global-error', 'middleware', '/api/'
];

// ─── 헬퍼 ─────────────────────────────────────────────

function isPageOrLayout(filePath) {
  return /(?:page|layout)\.(tsx?|jsx?)$/.test(filePath);
}

function isExcluded(relPath) {
  return EXCLUDED_FILES.some(ex => relPath.includes(ex));
}

function hasAuthHook(content) {
  return AUTH_HOOKS.some(hook => {
    const re = new RegExp(`\\b${hook}\\b`);
    return re.test(content);
  });
}

function hasAuthImport(content) {
  return AUTH_IMPORTS.some(pkg => content.includes(pkg));
}

function hasRedirectCall(content) {
  return REDIRECT_PATTERNS.some(pat => content.includes(pat));
}

// ─── L. 크롤 가능성 감사 ─────────────────────────────────────────

/**
 * 크롤 가능성(Crawlability) 감사
 *
 * 검사 항목:
 *   L-01: 조건부 return null / 삼항 null / 빈 fragment 반환
 *   L-02: 인증 게이트 패턴 (auth hook/import + redirect 또는 null)
 *   L-03: 무조건적 페이지 레벨 redirect
 */
function auditCrawlability(content, filePath, relPath, result) {
  if (!isPageOrLayout(filePath)) return;
  if (isExcluded(relPath)) return;

  const authDetected = hasAuthHook(content) || hasAuthImport(content);
  const redirectDetected = hasRedirectCall(content);

  // ── L-01: 조건부 return null ──
  // if (!something) return null;  /  if (condition) return null;
  const conditionalNullRe = /if\s*\([^)]*\)\s*return\s+null\b/g;
  let match;
  while ((match = conditionalNullRe.exec(content)) !== null) {
    const severity = authDetected ? SEVERITY.HIGH : SEVERITY.MED;
    const category = authDetected ? 'crawlability' : 'crawlability';
    const msg = authDetected
      ? '인증 상태에 따라 return null 처리되어 크롤러가 빈 페이지를 수집합니다.'
      : '조건부 return null이 감지되었습니다. 크롤러가 빈 페이지를 수집할 수 있습니다.';
    const suggestion = authDetected
      ? '인증이 필요한 페이지는 middleware에서 리다이렉트하고, 페이지 컴포넌트에서는 항상 유효한 HTML을 반환하세요.'
      : 'return null 대신 로딩 UI 또는 skeleton을 반환하여 크롤러에 유효한 콘텐츠를 제공하세요.';
    result.add(severity, category, msg, relPath, suggestion);
    break; // 동일 파일에서 한 번만 보고
  }

  // ── L-01: 삼항 null (condition ? <Component /> : null) ──
  const ternaryNullRe = /\?\s*<[A-Z][^>]*\/?>[\s\S]*?:\s*null\b/;
  if (ternaryNullRe.test(content)) {
    const severity = authDetected ? SEVERITY.HIGH : SEVERITY.MED;
    const category = authDetected ? 'crawlability' : 'crawlability';
    const msg = authDetected
      ? '인증 상태에 따른 삼항 null 패턴이 감지되었습니다. 크롤러에 빈 콘텐츠가 노출됩니다.'
      : '삼항 연산자에서 null을 반환하는 패턴이 감지되었습니다.';
    const suggestion = 'null 대신 SEO 친화적인 대체 콘텐츠(로그인 유도 UI 등)를 반환하세요.';
    result.add(severity, category, msg, relPath, suggestion);
  }

  // ── L-01: 빈 fragment 반환 (<></>) ──
  const emptyFragmentRe = /return\s*\(\s*<>\s*<\/>\s*\)|return\s+<>\s*<\/>/;
  if (emptyFragmentRe.test(content)) {
    const severity = authDetected ? SEVERITY.HIGH : SEVERITY.MED;
    const category = authDetected ? 'crawlability' : 'crawlability';
    result.add(severity, category,
      '빈 fragment(<></>)를 반환하고 있습니다. 크롤러가 빈 페이지로 인식합니다.', relPath,
      '빈 fragment 대신 최소한의 의미 있는 HTML 콘텐츠를 반환하세요.');
  }

  // ── L-02: 인증 게이트 패턴 (auth + redirect/null 조합) ──
  // 위 L-01 검사에서 authDetected일 때 이미 HIGH로 보고하므로,
  // redirect와 조합된 경우만 별도 보고
  if (authDetected && redirectDetected) {
    result.add(SEVERITY.HIGH, 'crawlability',
      '인증 게이트 패턴이 감지되었습니다. 인증 훅과 리다이렉트가 함께 사용되고 있습니다.', relPath,
      'middleware.ts에서 인증을 처리하고, 페이지 컴포넌트는 항상 렌더링 가능한 콘텐츠를 반환하도록 분리하세요.');
  }

  // ── L-03: 무조건적 페이지 레벨 redirect ──
  // 함수 본문 최상위에서 바로 redirect() 호출 (조건 없이)
  const unconditionalRedirectRe = /(?:export\s+(?:default\s+)?(?:async\s+)?function\s+\w+[^{]*\{[^}]*?|=>\s*\{[^}]*?)(?:redirect|permanentRedirect)\s*\(/;
  if (unconditionalRedirectRe.test(content)) {
    // 조건부 redirect가 아닌 경우만 감지 (간이 판별: if 문 밖에서 redirect)
    const lines = content.split('\n');
    let inFunction = false;
    let braceDepth = 0;
    let foundUnconditional = false;

    for (const line of lines) {
      const trimmed = line.trim();
      // export default function 또는 arrow function 시작 감지
      if (/export\s+(default\s+)?(async\s+)?function/.test(trimmed)) {
        inFunction = true;
        braceDepth = 0;
      }
      if (inFunction) {
        for (const ch of trimmed) {
          if (ch === '{') braceDepth++;
          else if (ch === '}') braceDepth--;
        }
        // 함수 최상위 레벨(braceDepth === 1)에서 조건 없이 redirect 호출
        if (braceDepth === 1 && /^\s*(?:redirect|permanentRedirect)\s*\(/.test(trimmed)) {
          foundUnconditional = true;
          break;
        }
        if (braceDepth <= 0) inFunction = false;
      }
    }

    if (foundUnconditional) {
      result.add(SEVERITY.MED, 'crawlability',
        '페이지에서 무조건적 redirect가 호출되고 있습니다. 크롤러가 이 페이지의 콘텐츠를 수집할 수 없습니다.', relPath,
        'next.config.js의 redirects 설정 또는 middleware를 사용하여 서버 측에서 리다이렉트를 처리하세요.');
    }
  }
}

module.exports = { auditCrawlability };
