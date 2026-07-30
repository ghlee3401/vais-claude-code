#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Design Phase Brand-First Trigger Hook (PreToolUse)
 *
 * design phase 진입 (ui-designer Agent 호출) 감지 →
 *   1. mcp.enabled 체크 (opt-out 존중)
 *   2. activeFeature 의 currentPhase === 'design' 확인
 *   3. brand 선택 여부 확인 — 미선택 시 fallback 적용:
 *        a. VAIS_DEFAULT_BRAND 환경변수 → setBrand 후 allow
 *        b. vais.config.json > designSystem.defaultBrand → setBrand 후 allow
 *        c. 둘 다 없으면 outputBlock + AskUserQuestion 안내 메시지
 *   4. 박제된 brand → DESIGN.md 경로를 reason 으로 allow (실제 prepend 는 ui-designer)
 *   5. 미박제 brand → import script 실행 → 다시 검증 → allow
 *
 * @see docs/design-system-rethink/02-design/architecture.md (Hook 재설계)
 * @see lib/brand-validator.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { readStdin, outputAllow, outputBlock } = require('../lib/io');
const { brandExists, brandDesignPath, isKnownBrand } = require('../lib/brand-validator');
const { PROJECT_DIR, loadConfig } = require('../lib/paths');

// v2.0: lib/mcp-validator.js 삭제 — isMcpEnabled 만 인라인 (본 hook 은 Phase 3 에서 제거 예정)
function isMcpEnabled() {
  try {
    const config = loadConfig();
    const flag =
      config?.orchestration?.mcp?.enabled ??
      config?.mcp?.enabled;
    if (flag === undefined || flag === null) return true;
    if (typeof flag === 'boolean') return flag;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return Boolean(flag);
  } catch (_) {
    return true;
  }
}

const STATUS_PATH = path.join(PROJECT_DIR, '.vais', 'status.json');
const CONFIG_PATH = path.join(PROJECT_DIR, 'vais.config.json');
const IMPORT_SCRIPT = path.join(PROJECT_DIR, 'scripts', 'import-awesome-design-md.js');

function readActiveFeature() {
  try {
    if (!fs.existsSync(STATUS_PATH)) return { feature: null, phase: null };
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
    const feature =
      (Array.isArray(status?.activeFeatures) && status.activeFeatures[0]) ||
      status?.activeFeature ||
      null;
    const phase = feature ? status?.features?.[feature]?.currentPhase ?? null : null;
    return { feature, phase, status };
  } catch (_) {
    return { feature: null, phase: null, status: null };
  }
}

function getFeatureBrand(status, feature) {
  return status?.features?.[feature]?.brand || null;
}

function saveBrand(feature, slug) {
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
    if (!status.features[feature]) return false;
    status.features[feature].brand = slug;
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
    return true;
  } catch (_) {
    return false;
  }
}

function readDesignSystemConfig() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return cfg?.designSystem || {};
  } catch (_) {
    return {};
  }
}

function tryImportBrand(slug) {
  if (!fs.existsSync(IMPORT_SCRIPT)) {
    return { ok: false, reason: `import script missing: ${IMPORT_SCRIPT}` };
  }
  try {
    execFileSync('node', [IMPORT_SCRIPT, '--brands', slug], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: PROJECT_DIR,
    });
    return { ok: brandExists(slug) };
  } catch (e) {
    return { ok: false, reason: String(e?.stderr ?? e?.message ?? e).slice(0, 500) };
  }
}

function shouldTrigger(input) {
  if (input?.tool_name !== 'Agent') return false;
  const subagent = input?.tool_input?.subagent_type;
  if (subagent !== 'ui-designer') return false;
  const { phase } = readActiveFeature();
  return phase === 'design';
}

function buildBlockMessage(feature, dsConfig) {
  return [
    '',
    '❌ design phase 차단 — brand 가 선택되지 않았습니다.',
    '',
    `Feature: ${feature}`,
    '',
    'brand-first 디자인 모델에서는 design phase 진입 전 brand 선택이 필수입니다.',
    '',
    '해결 방법:',
    '  1. 사용자 인터랙티브 선택 — /vais cto design ' + feature + ' 재실행 시 2-step AskUserQuestion 표시',
    '  2. 환경변수 — VAIS_DEFAULT_BRAND=<slug> 설정 (CI/자동화 환경)',
    `  3. 프로젝트 default — vais.config.json > designSystem.defaultBrand 지정${dsConfig?.defaultBrand ? ' (현재: ' + dsConfig.defaultBrand + ')' : ''}`,
    '',
    '사용 가능한 brand 목록: design-system/brands/INDEX.md',
    '미박제 brand 박제: node scripts/import-awesome-design-md.js --brands <slug>',
    '',
    '긴급 우회 (권장하지 않음): vais.config.json > orchestration.mcp.enabled: false',
    '',
  ].join('\n');
}

function run() {
  const input = readStdin();

  if (!shouldTrigger(input)) {
    outputAllow();
    return;
  }

  if (!isMcpEnabled()) {
    outputAllow();
    return;
  }

  const { feature, status } = readActiveFeature();
  if (!feature) {
    outputAllow();
    return;
  }

  let brand = getFeatureBrand(status, feature);
  const dsConfig = readDesignSystemConfig();

  // Fallback chain: env → config.defaultBrand
  if (!brand) {
    const envBrand = process.env.VAIS_DEFAULT_BRAND;
    const cfgBrand = dsConfig?.defaultBrand;
    const fallback = envBrand || cfgBrand || null;
    if (fallback && isKnownBrand(fallback)) {
      saveBrand(feature, fallback);
      brand = fallback;
      process.stderr.write(`[design-mcp-trigger] brand fallback applied: ${brand} (source: ${envBrand ? 'env' : 'config'})\n`);
    }
  }

  // Block if still missing AND config requires it
  const blockOnMissing = dsConfig?.blockOnMissingBrand !== false; // default true
  if (!brand) {
    if (!blockOnMissing) {
      process.stderr.write(`[design-mcp-trigger] brand missing but blockOnMissingBrand=false — allowing\n`);
      outputAllow();
      return;
    }
    process.stderr.write(buildBlockMessage(feature, dsConfig));
    outputBlock('brand 선택 필요 — design phase 진입 차단');
    process.exit(1);
  }

  // Bake on-demand if known brand but not yet present
  if (!brandExists(brand)) {
    if (!isKnownBrand(brand)) {
      process.stderr.write(`[design-mcp-trigger] unknown brand: ${brand}. INDEX.md 확인 필요.\n`);
      outputBlock(`unknown brand slug: ${brand}`);
      process.exit(1);
    }
    process.stderr.write(`[design-mcp-trigger] brand "${brand}" 미박제 — 자동 import 시도\n`);
    const r = tryImportBrand(brand);
    if (!r.ok) {
      process.stderr.write(`[design-mcp-trigger] import 실패: ${r.reason || 'unknown'}\n`);
      outputBlock(`brand import failed: ${brand}`);
      process.exit(1);
    }
    process.stderr.write(`[design-mcp-trigger] brand "${brand}" 박제 완료\n`);
  }

  process.stderr.write(`[design-mcp-trigger] brand active: ${brand} (${brandDesignPath(brand)})\n`);
  outputAllow();
}

if (require.main === module) {
  try {
    run();
  } catch (e) {
    process.stderr.write(`\n❌ design-mcp-trigger hook 내부 오류: ${e?.message ?? e}\n`);
    process.exit(1);
  }
}

module.exports = {
  shouldTrigger,
  readActiveFeature,
  getFeatureBrand,
  saveBrand,
  readDesignSystemConfig,
  tryImportBrand,
  buildBlockMessage,
  run,
};
