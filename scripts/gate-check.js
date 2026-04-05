#!/usr/bin/env node
/**
 * VAIS Code - Gate Check
 * CTO/CSO Gate 체크리스트를 프로그래밍적으로 검증하는 스크립트.
 *
 * 사용:
 *   node scripts/gate-check.js <gate> <feature> [role]
 *
 * Gates:
 *   cto-1  : Plan 완료 (피처 레지스트리, 데이터 모델, 기술 스택)
 *   cto-2  : Design 완료 (Interface Contract 존재)
 *   cto-3  : Architect 완료 (빌드 성공)
 *   cto-4  : Do 완료 (빌드 성공, IC 참조)
 *   cso-a  : 보안 검토 (Critical 0건)
 *   cso-b  : 플러그인 검증 (구조 정합성)
 *   cso-c  : 독립 코드 리뷰 (품질 점수)
 *
 * 반환: JSON { gate, passed, checks: [{ name, passed, detail }], score }
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { getFeatureRegistry } = require('../lib/status');
const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');

/**
 * 개별 체크 항목 생성 헬퍼
 */
function check(name, passed, detail = '') {
  return { name, passed, detail };
}

/**
 * CTO Gate 1: Plan 완료
 */
function checkCTOGate1(feature) {
  const checks = [];

  // 1. 피처 레지스트리 존재
  const registry = getFeatureRegistry(feature);
  checks.push(check(
    '피처 레지스트리 생성',
    !!registry && Array.isArray(registry.features) && registry.features.length > 0,
    registry ? `${registry.features?.length || 0}개 기능 정의` : '레지스트리 파일 없음',
  ));

  // 2. Plan 문서 존재
  const planPath = resolveDocPath('plan', feature, 'cto');
  const planExists = planPath && fs.existsSync(planPath);
  checks.push(check('Plan 문서 존재', planExists, planPath || '경로 해석 실패'));

  // 3. Plan 문서에 데이터 모델 섹션 존재
  if (planExists) {
    const content = fs.readFileSync(planPath, 'utf8');
    const hasDataModel = /데이터\s*모델|data\s*model|엔티티|entity/i.test(content);
    checks.push(check('데이터 모델 정의', hasDataModel, hasDataModel ? '발견' : '미발견'));

    const hasTechStack = /기술\s*스택|tech\s*stack|프레임워크|framework/i.test(content);
    checks.push(check('기술 스택 선정', hasTechStack, hasTechStack ? '발견' : '미발견'));
  } else {
    checks.push(check('데이터 모델 정의', false, 'Plan 문서 없음'));
    checks.push(check('기술 스택 선정', false, 'Plan 문서 없음'));
  }

  return { gate: 'cto-1', checks };
}

/**
 * CTO Gate 2: Design 완료 (Interface Contract)
 */
function checkCTOGate2(feature) {
  const checks = [];

  // 1. Design 문서 존재
  const designPath = resolveDocPath('design', feature, 'cto');
  const designExists = designPath && fs.existsSync(designPath);
  checks.push(check('Design 문서 존재', designExists, designPath || '경로 해석 실패'));

  // 2. Interface Contract 존재
  const icPath = designPath ? designPath.replace('.design.md', '-ic.md') : '';
  const icExists = icPath && fs.existsSync(icPath);
  checks.push(check('Interface Contract 생성', icExists, icPath || '경로 해석 실패'));

  // 3. IC에 API 엔드포인트 정의
  if (icExists) {
    const content = fs.readFileSync(icPath, 'utf8');
    const hasEndpoints = /Method\s*\|\s*Path|GET|POST|PUT|DELETE|PATCH/i.test(content);
    checks.push(check('API 엔드포인트 정의', hasEndpoints, hasEndpoints ? '발견' : '미발견'));
  } else {
    checks.push(check('API 엔드포인트 정의', false, 'IC 문서 없음'));
  }

  return { gate: 'cto-2', checks };
}

/**
 * CTO Gate 3: Architect 완료
 */
function checkCTOGate3(feature) {
  const checks = [];

  // 1. Architect 문서 존재
  const archPath = resolveDocPath('design', feature, 'infra-architect');
  const archExists = archPath && fs.existsSync(archPath);
  checks.push(check('Architect 문서 존재', archExists, archPath || ''));

  // 2. 환경 변수 템플릿 존재 확인
  const envFiles = ['.env.example', '.env.local.example', '.env.template'];
  const envExists = envFiles.some(f => fs.existsSync(path.join(process.cwd(), f)));
  checks.push(check('환경 변수 템플릿', envExists, envExists ? '발견' : '미발견 (선택)'));

  return { gate: 'cto-3', checks };
}

/**
 * CTO Gate 4: Do 완료
 */
function checkCTOGate4(feature) {
  const checks = [];

  // 1. Do 문서 존재
  const doPath = resolveDocPath('do', feature, 'cto');
  const doExists = doPath && fs.existsSync(doPath);
  checks.push(check('Do 문서 존재', doExists, doPath || ''));

  // 2. 피처 레지스트리 상태 업데이트
  const registry = getFeatureRegistry(feature);
  if (registry && registry.features) {
    const implemented = registry.features.filter(f => f.status === '구현완료' || f.status === 'done').length;
    const total = registry.features.length;
    const rate = total > 0 ? Math.round((implemented / total) * 100) : 0;
    checks.push(check(
      '피처 레지스트리 업데이트',
      rate >= 90,
      `${implemented}/${total} (${rate}%)`,
    ));
  } else {
    checks.push(check('피처 레지스트리 업데이트', false, '레지스트리 없음'));
  }

  return { gate: 'cto-4', checks };
}

/**
 * CSO Gate A: 보안 검토
 */
function checkCSOGateA(feature) {
  const checks = [];

  // 1. CSO Do 문서 존재 (보안 검토 결과)
  const doPath = resolveDocPath('do', feature, 'cso');
  const doExists = doPath && fs.existsSync(doPath);
  checks.push(check('보안 검토 문서 존재', doExists, doPath || ''));

  if (doExists) {
    const content = fs.readFileSync(doPath, 'utf8');

    // 2. Critical 취약점 0건
    const criticalMatch = content.match(/Critical[:\s]*(\d+)/i);
    const criticalCount = criticalMatch ? parseInt(criticalMatch[1], 10) : -1;
    if (criticalCount >= 0) {
      checks.push(check('Critical 취약점 0건', criticalCount === 0, `Critical: ${criticalCount}건`));
    } else {
      checks.push(check('Critical 취약점 0건', false, 'Critical 카운트 미발견'));
    }

    // 3. OWASP 점수
    const owaspMatch = content.match(/OWASP[:\s]*(\d+)\s*\/\s*10/i);
    const owaspScore = owaspMatch ? parseInt(owaspMatch[1], 10) : -1;
    if (owaspScore >= 0) {
      checks.push(check('OWASP 8/10 이상', owaspScore >= 8, `OWASP: ${owaspScore}/10`));
    } else {
      checks.push(check('OWASP 8/10 이상', false, 'OWASP 점수 미발견'));
    }

    // 4. 배포 승인 여부 — "배포 승인" 섹션 근처에서만 판정
    const approvalSection = content.match(/배포\s*승인\s*여부[\s\S]{0,500}/i);
    const sectionText = approvalSection ? approvalSection[0] : '';
    const hasApproval = /승인|✅\s*PASS|Approved|조건부\s*승인/i.test(sectionText);
    const hasBlock = /❌\s*FAIL|배포\s*차단|거부|Blocked/i.test(sectionText);
    const approved = hasApproval && !hasBlock;
    checks.push(check('배포 승인', approved, approved ? '승인됨' : '미승인 또는 차단'));
  } else {
    checks.push(check('Critical 취약점 0건', false, '보안 문서 없음'));
    checks.push(check('OWASP 8/10 이상', false, '보안 문서 없음'));
    checks.push(check('배포 승인', false, '보안 문서 없음'));
  }

  return { gate: 'cso-a', checks };
}

/**
 * CSO Gate B: 플러그인 검증
 */
function checkCSOGateB(feature) {
  const checks = [];
  const config = loadConfig();

  // 1. package.json 존재 + claude-plugin 필드
  const pkgPath = path.join(process.cwd(), 'package.json');
  let pkg = null;
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch (_) { /* ignore */ }
  checks.push(check('package.json 존재', !!pkg, pkgPath));
  checks.push(check('claude-plugin 필드', !!pkg?.['claude-plugin'], pkg?.['claude-plugin'] ? '발견' : '미발견'));

  // 2. 버전 일치 (package.json vs vais.config.json)
  const versionMatch = pkg?.version === config.version;
  checks.push(check('버전 동기화', versionMatch, `pkg=${pkg?.version} config=${config.version}`));

  // 3. SKILL.md 존재
  const skillPath = path.join(process.cwd(), 'skills', 'vais', 'SKILL.md');
  checks.push(check('SKILL.md 존재', fs.existsSync(skillPath), skillPath));

  return { gate: 'cso-b', checks };
}

/**
 * CSO Gate C: 독립 코드 리뷰
 */
function checkCSOGateC(feature) {
  const checks = [];

  // QA 문서에서 품질 점수 추출
  const qaPath = resolveDocPath('qa', feature, 'cso');
  const qaExists = qaPath && fs.existsSync(qaPath);
  checks.push(check('CSO QA 문서 존재', qaExists, qaPath || ''));

  if (qaExists) {
    const content = fs.readFileSync(qaPath, 'utf8');

    // 품질 점수
    const qualityMatch = content.match(/품질\s*점수[:\s]*(\d+)\s*\/\s*100|Quality[:\s]*(\d+)\s*\/\s*100/i);
    const score = qualityMatch ? parseInt(qualityMatch[1] || qualityMatch[2], 10) : -1;
    if (score >= 0) {
      checks.push(check('품질 점수 80/100 이상', score >= 80, `${score}/100`));
    } else {
      checks.push(check('품질 점수 80/100 이상', false, '점수 미발견'));
    }

    // Critical 이슈
    const critMatch = content.match(/Critical[:\s]*(\d+)/i);
    const critCount = critMatch ? parseInt(critMatch[1], 10) : -1;
    if (critCount >= 0) {
      checks.push(check('Critical 이슈 0건', critCount === 0, `Critical: ${critCount}건`));
    } else {
      checks.push(check('Critical 이슈 0건', false, 'Critical 카운트 미발견'));
    }
  } else {
    checks.push(check('품질 점수 80/100 이상', false, 'QA 문서 없음'));
    checks.push(check('Critical 이슈 0건', false, 'QA 문서 없음'));
  }

  return { gate: 'cso-c', checks };
}

/**
 * Gate 검증 실행
 */
function runGateCheck(gate, feature) {
  const handlers = {
    'cto-1': checkCTOGate1,
    'cto-2': checkCTOGate2,
    'cto-3': checkCTOGate3,
    'cto-4': checkCTOGate4,
    'cso-a': checkCSOGateA,
    'cso-b': checkCSOGateB,
    'cso-c': checkCSOGateC,
  };

  const handler = handlers[gate];
  if (!handler) {
    return { gate, passed: false, checks: [], error: `Unknown gate: ${gate}` };
  }

  const result = handler(feature);
  const passed = result.checks.every(c => c.passed);
  const score = result.checks.length > 0
    ? Math.round((result.checks.filter(c => c.passed).length / result.checks.length) * 100)
    : 0;

  // event-log에 gate_check 기록
  try {
    const el = new EventLogger('.vais/event-log.jsonl');
    el.log(EVENT_TYPES.GATE_CHECK, {
      gate,
      result: passed ? 'pass' : 'fail',
      score,
      feature,
      items: result.checks.map(c => ({ name: c.name, passed: c.passed })),
    });
  } catch (_) { /* ignore */ }

  return { gate, passed, checks: result.checks, score };
}

/**
 * 결과 포맷팅
 */
function formatGateResult(result) {
  const icon = result.passed ? '✅' : '❌';
  const lines = [
    `${icon} Gate ${result.gate.toUpperCase()} — ${result.passed ? 'PASS' : 'FAIL'} (${result.score}%)`,
    '',
  ];

  for (const c of result.checks) {
    const ci = c.passed ? '✅' : '❌';
    lines.push(`  ${ci} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  }

  return lines.join('\n');
}

// CLI 실행
if (require.main === module) {
  const [gate, feature] = process.argv.slice(2);

  if (!gate || !feature) {
    console.error('Usage: node scripts/gate-check.js <gate> <feature>');
    console.error('Gates: cto-1, cto-2, cto-3, cto-4, cso-a, cso-b, cso-c');
    process.exit(1);
  }

  const result = runGateCheck(gate, feature);
  const output = formatGateResult(result);
  process.stderr.write(output + '\n');
  process.stdout.write(JSON.stringify(result));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { runGateCheck, formatGateResult };
