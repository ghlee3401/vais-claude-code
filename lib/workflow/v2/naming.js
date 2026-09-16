'use strict';

const FEATURE_PATTERNS = Object.freeze([
  ['booking-cancellation', [/(?:예약[\s\S]*취소|취소[\s\S]*예약)/, /(?:booking[\s-]*cancel|cancel[\s-]*booking)/i]],
  ['password-reset', [/(?:비밀번호|패스워드)[\s\S]*(?:재설정|초기화|분실)/, /password[\s-]*(?:reset|recovery|forgot)/i]],
  ['signup', [/(?:회원[\s-]*가입|가입하기)/, /(?:sign[\s-]*up|registration)/i]],
  ['login', [/(?:로그인|인증하기)/, /(?:log[\s-]*in|authentication)/i]],
  ['checkout', [/(?:결제[\s\S]*(?:완료|흐름)|체크아웃)/, /checkout/i]],
  ['payment', [/(?:결제|지불)/, /payment/i]],
  ['cart', [/(?:장바구니|카트)/, /(?:shopping[\s-]*cart|\bcart\b)/i]],
  ['search', [/(?:검색)/, /\bsearch\b/i]],
  ['notification', [/(?:알림)/, /notification/i]],
  ['chat', [/(?:채팅|대화방)/, /\bchat\b/i]],
  ['dashboard', [/(?:대시보드)/, /dashboard/i]],
  ['settings', [/(?:설정)/, /settings/i]],
]);

function normalizeRequest(value) {
  return String(value || '')
    .replace(/^\s*\/vais(?:\s+|$)/i, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function deterministicSlug(request) {
  const normalized = normalizeRequest(request);
  for (const [slug, patterns] of FEATURE_PATTERNS) {
    if (patterns.some(pattern => pattern.test(normalized))) return slug;
  }
  const ascii = normalized.match(/[a-z0-9]+/g) || [];
  const ignored = new Set(['a', 'an', 'the', 'to', 'for', 'and', 'or', 'please', 'make', 'create', 'add', 'feature']);
  const words = ascii.filter(word => !ignored.has(word)).slice(0, 4);
  if (words.length > 0) return words.join('-').slice(0, 48).replace(/-+$/g, '');
  // No usable ASCII words: the runtime must not invent a name. The prompt hook asks the
  // user for one and only a user-typed `/vais 이름: <kebab-case>` becomes the request slug.
  return null;
}

const USER_SLUG = /^[a-z0-9][a-z0-9-]{1,47}$/;

function isValidUserSlug(value) {
  return USER_SLUG.test(String(value || ''));
}

module.exports = { FEATURE_PATTERNS, USER_SLUG, normalizeRequest, deterministicSlug, isValidUserSlug };
