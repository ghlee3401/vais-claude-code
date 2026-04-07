#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] doc-validator crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] doc-validator rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Document Validator
 * C-Level 에이전트 종료 시 필수 문서 존재 여부를 검증합니다.
 *
 * 사용: node scripts/doc-validator.js <role> <feature>
 * 반환: JSON { passed, missing, warnings }
 *   - passed: boolean (필수 문서 모두 존재)
 *   - missing: [{ phase, path }] (누락된 필수 문서)
 *   - warnings: [string] (경고 메시지)
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { getActiveFeature } = require('../lib/status');

// C-Level 역할 목록
const C_LEVEL_ROLES = ['cto', 'ceo', 'cpo', 'cfo', 'cmo', 'cso', 'coo'];

// 역할별 필수 phase (모든 C-Level 공통: plan, do, qa)
const MANDATORY_PHASES = ['plan', 'do', 'qa'];

/**
 * 역할+피처에 대해 필수 문서 존재 여부 검증
 * @param {string} role - C-Level 역할
 * @param {string} feature - 피처명
 * @returns {{ passed: boolean, missing: Array, warnings: Array }}
 */
function validateDocs(role, feature) {
  const result = { passed: true, missing: [], warnings: [] };

  if (!C_LEVEL_ROLES.includes(role)) {
    // 실행 에이전트(infra-architect, dev-backend 등)는 검증 대상 아님
    return result;
  }

  if (!feature) {
    result.warnings.push(`피처명 미확인 — 문서 검증 생략`);
    return result;
  }

  for (const phase of MANDATORY_PHASES) {
    const docPath = resolveDocPath(phase, feature, role);
    if (!docPath) {
      result.warnings.push(`${phase} 문서 경로 해석 실패`);
      continue;
    }
    if (!fs.existsSync(docPath)) {
      result.passed = false;
      result.missing.push({ phase, path: docPath });
    }
  }

  return result;
}

/**
 * 검증 결과를 사람이 읽을 수 있는 형식으로 출력
 */
function formatResult(role, feature, result) {
  if (result.passed && result.warnings.length === 0) {
    return '';
  }

  const lines = [];

  if (result.missing.length > 0) {
    lines.push(`⚠️  [${role.toUpperCase()}] 필수 문서 ${result.missing.length}건 누락 (${feature}):`);
    for (const m of result.missing) {
      lines.push(`   ❌ ${m.phase}: ${path.relative(process.cwd(), m.path)}`);
    }
    lines.push(`   💡 PDCA 워크플로우에 따라 필수 문서를 작성해주세요.`);
  }

  for (const w of result.warnings) {
    lines.push(`   ⚠️  ${w}`);
  }

  return lines.join('\n');
}

// CLI 직접 실행
if (require.main === module) {
  const [role, featureArg] = process.argv.slice(2);
  const feature = featureArg || getActiveFeature();

  if (!role) {
    process.exit(0);
  }

  const result = validateDocs(role, feature);
  const output = formatResult(role, feature, result);

  if (output) {
    process.stderr.write(output + '\n');
  }

  // JSON 결과도 stdout으로 출력 (프로그래밍적 사용)
  process.stdout.write(JSON.stringify(result));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { validateDocs, formatResult, MANDATORY_PHASES, C_LEVEL_ROLES };
