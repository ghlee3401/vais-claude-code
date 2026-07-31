'use strict';

/**
 * VAIS Code — Brand Design System Validator
 *
 * Brand-first 모델의 핵심 lib. design-system/brands/{slug}/DESIGN.md 의 박제 여부 +
 * 컨텍스트 로드 + 71 brand 화이트리스트 관리.
 *
 * @see docs/design-system-rethink/02-design/architecture.md
 * @see scripts/import-awesome-design-md.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BRANDS_ROOT = path.join(PROJECT_ROOT, 'design-system', 'brands');
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

function brandDesignPath(slug) {
  if (!isValidSlug(slug)) return null;
  return path.join(BRANDS_ROOT, slug, 'DESIGN.md');
}

function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_PATTERN.test(slug);
}

function brandExists(slug) {
  const p = brandDesignPath(slug);
  if (!p) return false;
  try {
    const stat = fs.statSync(p);
    return stat.isFile() && stat.size > 0;
  } catch (_) {
    return false;
  }
}

function listBakedBrands() {
  if (!fs.existsSync(BRANDS_ROOT)) return [];
  return fs.readdirSync(BRANDS_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => brandExists(name))
    .sort();
}

function loadBrandDesign(slug) {
  if (!brandExists(slug)) {
    throw new Error(
      `brand "${slug}" 미박제 — scripts/import-awesome-design-md.js --brands ${slug} 실행 필요`
    );
  }
  return fs.readFileSync(brandDesignPath(slug), 'utf8');
}

/**
 * INDEX.md 에서 71 brand 화이트리스트 파싱.
 * fallback: 박제된 brand + design-system/brands/INDEX.md 의 모든 slug.
 *
 * @returns {string[]} valid slug 목록
 */
function listAllBrandSlugs() {
  const indexPath = path.join(BRANDS_ROOT, 'INDEX.md');
  if (!fs.existsSync(indexPath)) return listBakedBrands();
  try {
    const md = fs.readFileSync(indexPath, 'utf8');
    const slugs = new Set();
    // INDEX 표의 `| \`slug\` |` 또는 `| \`slug (←...)\` |` 패턴
    const re = /^\|\s+`([a-z0-9][a-z0-9-]*)`/gm;
    let m;
    while ((m = re.exec(md)) !== null) {
      slugs.add(m[1]);
    }
    return [...slugs].sort();
  } catch (_) {
    return listBakedBrands();
  }
}

function isKnownBrand(slug) {
  return listAllBrandSlugs().includes(slug);
}

/**
 * Hook 컨텍스트용 — brand 선택 상태 + 박제 여부 + 디자인 파일 경로 일괄 조회.
 *
 * @param {string} slug
 * @returns {{ slug, valid, baked, designPath: string|null, content?: string }}
 */
function getBrandContext(slug) {
  if (!isValidSlug(slug)) {
    return { slug, valid: false, baked: false, designPath: null };
  }
  const baked = brandExists(slug);
  return {
    slug,
    valid: true,
    baked,
    designPath: baked ? brandDesignPath(slug) : null,
  };
}

module.exports = {
  brandDesignPath,
  brandExists,
  listBakedBrands,
  loadBrandDesign,
  listAllBrandSlugs,
  isKnownBrand,
  isValidSlug,
  getBrandContext,
  _internal: { BRANDS_ROOT, SLUG_PATTERN },
};
