#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] auto-judge crashed: ${e.message}\n`); } catch (_) {} process.exit(1); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] auto-judge rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(1); });
/**
 * VAIS Code - Auto Judge
 * Full-Auto 모드(CEO --auto)에서 각 C-Level 산출물의 통과/재실행 여부를 자동 판정.
 *
 * 사용:
 *   node scripts/auto-judge.js <role> <feature>
 *
 * 판정 기준 (ceo.md Full-Auto 판정 기준표 코드화):
 *   CPO: PRD 8개 섹션 모두 존재, 빈 섹션 없음
 *   CTO: 요구사항 vs 구현 일치 (Gap ≥ 90%)
 *   CSO: Critical 취약점 0건
 *   CMO: SEO 점수 ≥ 80
 *   COO: CI/CD 모든 단계 정의
 *   CFO: 비용/수익/ROI 수치 모두 존재
 *
 * 반환: JSON { role, feature, passed, verdict, details }
 *   verdict: "pass" | "retry" | "fail"
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, resolveDocPath } = require('../lib/paths');
const { getGapAnalysis, getFeatureRegistry } = require('../lib/status');
const { EventLogger, EVENT_TYPES } = require('../lib/observability/index');

/**
 * CPO 판정: PRD 8개 섹션 완성도
 * 표준 메트릭: designCompleteness (0~100)
 */
function judgeCPO(feature) {
  const details = { sections: 0, empty: 0, issues: [] };
  const doPath = resolveDocPath('do', feature, 'cpo');
  if (!doPath || !fs.existsSync(doPath)) {
    return {
      passed: false, verdict: 'retry',
      details: { ...details, issues: ['PRD 문서(do) 미존재'] },
      metrics: { designCompleteness: 0 },
    };
  }

  const content = fs.readFileSync(doPath, 'utf8');

  // PRD 8 섹션 패턴 (Paweł Huryn + Miqdad Jaffer 형식)
  const PRD_SECTIONS = [
    { name: 'Summary', pattern: /##\s*(1\.|Summary|요약)/i },
    { name: 'Contacts', pattern: /##\s*(2\.|Contacts|연락처|담당)/i },
    { name: 'Background', pattern: /##\s*(3\.|Background|배경)/i },
    { name: 'Objective', pattern: /##\s*(4\.|Objective|목표)/i },
    { name: 'Market Segment', pattern: /##\s*(5\.|Market\s*Segment|시장\s*세그먼트|대상)/i },
    { name: 'Value Proposition', pattern: /##\s*(6\.|Value\s*Prop|가치\s*제안)/i },
    { name: 'Solution', pattern: /##\s*(7\.|Solution|솔루션|기능)/i },
    { name: 'Release', pattern: /##\s*(8\.|Release|릴리스|출시)/i },
  ];

  for (const section of PRD_SECTIONS) {
    if (section.pattern.test(content)) {
      details.sections++;
      // 섹션 내용이 50자 미만이면 빈 섹션으로 간주
      const match = content.match(new RegExp(section.pattern.source + '[\\s\\S]*?(?=##|$)', 'i'));
      if (match && match[0].length < 80) {
        details.empty++;
        details.issues.push(`${section.name}: 내용 부족 (${match[0].length}자)`);
      }
    } else {
      details.issues.push(`${section.name}: 섹션 미발견`);
    }
  }

  // designCompleteness = (유효 섹션 수 / 8) × 100
  const validSections = Math.max(0, details.sections - details.empty);
  const designCompleteness = Math.round((validSections / PRD_SECTIONS.length) * 100);
  const passed = details.sections >= 8 && details.empty === 0;
  return {
    passed,
    verdict: passed ? 'pass' : 'retry',
    details,
    metrics: { designCompleteness },
  };
}

/**
 * CTO 판정: Gap Analysis ≥ 90%
 * 표준 메트릭: matchRate, criticalIssueCount
 */
// v0.57: main.md → _tmp/{slug}.md fallback 으로 메트릭 파싱
function _parseCriticalWithFallback(feature, role) {
  const mainPath = resolveDocPath('qa', feature, role);
  const tryParse = (p) => {
    if (!p || !fs.existsSync(p)) return null;
    const content = fs.readFileSync(p, 'utf8');
    const m = content.match(/Critical[:\s]*(\d+)/i);
    return m ? { value: parseInt(m[1], 10), source: p } : null;
  };
  const primary = tryParse(mainPath);
  if (primary) return { ...primary, fallbackUsed: false };
  // Fallback: _tmp/qa-engineer.md
  if (mainPath) {
    const phaseDir = path.dirname(mainPath);
    const fbPath = path.join(phaseDir, '_tmp', 'qa-engineer.md');
    const fb = tryParse(fbPath);
    if (fb) return { ...fb, fallbackUsed: true };
  }
  return null;
}

function judgeCTO(feature) {
  const details = { matchRate: 0, issues: [] };
  let criticalIssueCount = 0;

  // 1. Gap Analysis 결과 확인
  const gap = getGapAnalysis(feature);
  if (gap) {
    details.matchRate = gap.matchRate;
    if (gap.matchRate < 90) {
      details.issues.push(`Gap 일치율 ${gap.matchRate}% (기준: 90%)`);
    }
  } else {
    details.issues.push('Gap Analysis 결과 없음');
  }

  // 2. QA 문서 존재 확인 + v0.57 _tmp/qa-engineer.md fallback
  const qaPath = resolveDocPath('qa', feature, 'cto');
  if (!qaPath || !fs.existsSync(qaPath)) {
    details.issues.push('CTO QA 문서 미존재');
  }

  const parsed = _parseCriticalWithFallback(feature, 'cto');
  if (parsed) {
    criticalIssueCount = parsed.value;
    if (parsed.fallbackUsed) {
      details.issues.push(`Critical 카운트 fallback 사용 (${path.relative(process.cwd(), parsed.source)})`);
    }
    if (criticalIssueCount > 0) {
      details.issues.push(`Critical 이슈 ${criticalIssueCount}건 잔존`);
    }
  }

  // 3. Do 문서 존재 확인
  const doPath = resolveDocPath('do', feature, 'cto');
  if (!doPath || !fs.existsSync(doPath)) {
    details.issues.push('CTO Do 문서 미존재');
  }

  const passed = details.issues.length === 0 && details.matchRate >= 90;
  return {
    passed, verdict: passed ? 'pass' : 'retry', details,
    metrics: { matchRate: details.matchRate, criticalIssueCount },
  };
}

/**
 * CSO 판정: Critical 취약점 0건
 * 표준 메트릭: criticalIssueCount, owaspScore
 */
function judgeCSO(feature) {
  const details = { criticalCount: -1, owaspScore: -1, issues: [] };

  const doPath = resolveDocPath('do', feature, 'cso');
  if (!doPath || !fs.existsSync(doPath)) {
    return {
      passed: false, verdict: 'retry',
      details: { ...details, issues: ['CSO Do 문서 미존재'] },
      metrics: { criticalIssueCount: 999, owaspScore: 0 },
    };
  }

  const content = fs.readFileSync(doPath, 'utf8');

  // Critical 카운트
  const critMatch = content.match(/Critical[:\s]*(\d+)/i);
  if (critMatch) {
    details.criticalCount = parseInt(critMatch[1], 10);
    if (details.criticalCount > 0) {
      details.issues.push(`Critical ${details.criticalCount}건 존재`);
    }
  } else {
    details.issues.push('Critical 카운트 미확인');
  }

  // OWASP 점수
  const owaspMatch = content.match(/OWASP[:\s]*(\d+)\s*\/\s*10/i);
  if (owaspMatch) {
    details.owaspScore = parseInt(owaspMatch[1], 10);
  }

  const passed = details.criticalCount === 0;
  return {
    passed, verdict: passed ? 'pass' : 'retry', details,
    metrics: {
      criticalIssueCount: details.criticalCount >= 0 ? details.criticalCount : 999,
      owaspScore: details.owaspScore >= 0 ? details.owaspScore : 0,
    },
  };
}

/**
 * CBO 판정: SEO ≥ 80 + unit economics + 비용/수익/ROI
 * 표준 메트릭: marketingScore (SEO 점수 × 0.5 + GTM 완성도 × 0.5)
 */
function judgeCBO(feature) {
  const details = { seoScore: -1, found: [], missing: [], issues: [] };
  const REQUIRED_METRICS = [
    { name: '비용', pattern: /비용|cost/i },
    { name: '수익', pattern: /수익|revenue|매출/i },
    { name: 'ROI', pattern: /ROI|투자\s*수익률|ROAS/i },
  ];

  const doPath = resolveDocPath('do', feature, 'cbo');
  if (!doPath || !fs.existsSync(doPath)) {
    return {
      passed: false, verdict: 'retry',
      details: { ...details, issues: ['CBO Do 문서 미존재'] },
      metrics: { marketingScore: 0 },
    };
  }

  const content = fs.readFileSync(doPath, 'utf8');

  const seoMatch = content.match(/(?:총점|Total|SEO\s*(?:점수|Score))[:\s]*(\d+)\s*(?:\/\s*100|점|pts)?/i);
  if (seoMatch) {
    details.seoScore = parseInt(seoMatch[1], 10);
    if (details.seoScore < 80) details.issues.push(`SEO 점수 ${details.seoScore}/100 (기준: 80)`);
  }

  for (const m of REQUIRED_METRICS) {
    if (m.pattern.test(content)) details.found.push(m.name);
    else { details.missing.push(m.name); details.issues.push(`${m.name} 미확인`); }
  }

  // marketingScore = SEO(0~100) × 0.5 + GTM 완성도(0~100) × 0.5
  //   GTM 완성도 = 발견된 필수 메트릭 비율 × 100
  const seoComponent = details.seoScore >= 0 ? details.seoScore : 0;
  const gtmCompleteness = Math.round((details.found.length / REQUIRED_METRICS.length) * 100);
  const marketingScore = Math.round(seoComponent * 0.5 + gtmCompleteness * 0.5);

  const passed = details.issues.length === 0;
  return {
    passed, verdict: passed ? 'pass' : 'retry', details,
    metrics: { marketingScore },
  };
}

/**
 * COO 판정: CI/CD 모든 단계 정의
 * 표준 메트릭: opsReadiness (정의된 단계 비율 × 100)
 */
function judgeCOO(feature) {
  const details = { stages: [], issues: [] };
  const REQUIRED_STAGES = ['lint', 'test', 'build', 'deploy'];

  const doPath = resolveDocPath('do', feature, 'coo');
  if (!doPath || !fs.existsSync(doPath)) {
    return {
      passed: false, verdict: 'retry',
      details: { ...details, issues: ['COO Do 문서 미존재'] },
      metrics: { opsReadiness: 0 },
    };
  }

  const content = fs.readFileSync(doPath, 'utf8').toLowerCase();

  for (const stage of REQUIRED_STAGES) {
    if (content.includes(stage)) {
      details.stages.push(stage);
    } else {
      details.issues.push(`CI/CD 단계 "${stage}" 미정의`);
    }
  }

  const opsReadiness = Math.round((details.stages.length / REQUIRED_STAGES.length) * 100);
  const passed = details.issues.length === 0;
  return {
    passed, verdict: passed ? 'pass' : 'retry', details,
    metrics: { opsReadiness },
  };
}

/**
 * Auto Judge 실행
 */
function judge(role, feature) {
  const judges = {
    cpo: judgeCPO,
    cto: judgeCTO,
    cso: judgeCSO,
    cbo: judgeCBO,
    coo: judgeCOO,
  };

  const handler = judges[role];
  if (!handler) {
    return { role, feature, passed: false, verdict: 'fail', details: { issues: [`Unknown role: ${role}`] } };
  }

  const result = handler(feature);

  // event-log에 판정 기록
  try {
    const el = new EventLogger('.vais/event-log.jsonl');
    el.log(EVENT_TYPES.DECISION, {
      role,
      type: 'auto_judge',
      choice: result.verdict,
      feature,
      details: result.details,
    });
  } catch (_) { /* ignore */ }

  return { role, feature, ...result };
}

/**
 * 전체 C-Level 일괄 판정 (CEO Final Review용)
 */
function judgeAll(feature) {
  const roles = ['cpo', 'cto', 'cso', 'cbo', 'coo'];
  const results = {};
  let allPassed = true;

  for (const role of roles) {
    results[role] = judge(role, feature);
    if (!results[role].passed) allPassed = false;
  }

  return { feature, allPassed, results };
}

/**
 * 결과 포맷팅
 */
function formatJudgeResult(result) {
  const icon = result.passed ? '✅' : '❌';
  const lines = [
    `${icon} [${result.role.toUpperCase()}] Auto Judge — ${result.verdict.toUpperCase()}`,
  ];

  if (result.details?.issues?.length > 0) {
    for (const issue of result.details.issues) {
      lines.push(`  ⚠️  ${issue}`);
    }
  }

  return lines.join('\n');
}

// CLI 실행
if (require.main === module) {
  const [role, feature] = process.argv.slice(2);

  if (!role || !feature) {
    console.error('Usage: node scripts/auto-judge.js <role|all> <feature>');
    process.exit(1);
  }

  if (role === 'all') {
    const results = judgeAll(feature);
    const icon = results.allPassed ? '✅' : '❌';
    process.stderr.write(`\n${icon} Auto Judge — 전체 C-Level 판정 (${feature})\n\n`);
    for (const [r, res] of Object.entries(results.results)) {
      process.stderr.write(formatJudgeResult(res) + '\n');
    }
    process.stdout.write(JSON.stringify(results));
    process.exit(results.allPassed ? 0 : 1);
  } else {
    const result = judge(role, feature);
    process.stderr.write(formatJudgeResult(result) + '\n');
    process.stdout.write(JSON.stringify(result));
    process.exit(result.passed ? 0 : 1);
  }
}

module.exports = { judge, judgeAll, formatJudgeResult };
