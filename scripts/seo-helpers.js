'use strict';

/**
 * SEO 감사 공유 헬퍼 함수
 * circular dependency 방지를 위해 seo-audit.js에서 분리
 */

const fs = require('fs');
const path = require('path');
const { fileExists } = require('../lib/fs-utils');

const SEVERITY = { HIGH: 'high', MED: 'medium', LOW: 'low' };

function extractTag(html, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

function extractMetaProperty(html, property) {
  const re = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']*)["']`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

function detectFramework(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fileExists(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) return 'Next.js';
    if (deps['nuxt']) return 'Nuxt';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue';
    if (deps['svelte']) return 'Svelte';
    if (deps['astro']) return 'Astro';

    return null;
  } catch {
    return null;
  }
}

function findFiles(root, extensions) {
  const results = [];

  function walkDir(dir) {
    if (!fileExists(dir)) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  walkDir(root);
  return results;
}

function isAppRouterProject(root) {
  return fileExists(path.join(root, 'app')) || fileExists(path.join(root, 'src', 'app'));
}

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

module.exports = {
  SEVERITY,
  extractTag,
  extractMeta,
  extractMetaProperty,
  detectFramework,
  findFiles,
  isAppRouterProject,
  extractBalancedBraces,
  hasFieldInObject,
  extractNestedBlock
};
