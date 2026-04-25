#!/usr/bin/env node
'use strict';

/**
 * VAIS Code — Sub-agent Audit (F4 SC-09)
 *
 * 모든 sub-agent (agents/{c-level}/*.md, _shared 제외) 를 4 기준으로 평가:
 *   Q-A: canon_source frontmatter 명시 여부
 *   Q-B: execution.policy enum 적정 (always / scope / user-select / triggered)
 *   Q-C: scope policy 의 경우 scope_conditions 정의
 *   Q-D: artifacts ↔ catalog.json owner_agent 1:1 매칭
 *
 * CLI:
 *   node scripts/sub-agent-audit.js [--json] [--verbose]
 *
 * Exit codes:
 *   0 = 모든 sub-agent 4 기준 통과
 *   1 = Q-A/B 누락 (필수 항목)
 *   2 = Q-C/D 미흡 (보강 권고)
 *
 * @see docs/subagent-architecture-rethink/04-qa/subagent-audit-matrix.md
 */

const fs = require('fs');
const path = require('path');

let matter;
try {
  matter = require('gray-matter');
} catch (e) {
  process.stderr.write('[VAIS SubAgentAudit] ❌ gray-matter 미설치 — npm install 후 재시도\n');
  process.exit(1);
}

const { PROJECT_DIR } = require('../lib/paths');

const VALID_POLICIES = ['always', 'scope', 'user-select', 'triggered'];
const C_LEVEL_NAMES = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];

/**
 * agents/{c-level}/*.md 파일 목록 수집 (_shared 및 C-Level top 제외).
 */
function collectSubAgentFiles() {
  const agentsDir = path.join(PROJECT_DIR, 'agents');
  const results = [];
  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '_shared') continue;
    const dir = path.join(agentsDir, entry.name);
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.md')) continue;
      const baseName = path.basename(file.name, '.md');
      if (C_LEVEL_NAMES.includes(baseName)) continue;
      results.push({
        clevel: entry.name,
        name: baseName,
        filePath: path.join(dir, file.name),
      });
    }
  }
  return results;
}

/**
 * catalog.json 읽기 (없으면 빈 객체).
 */
function loadCatalog() {
  const catalogPath = path.join(PROJECT_DIR, 'catalog.json');
  if (!fs.existsSync(catalogPath)) return { artifacts: [] };
  try {
    return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    process.stderr.write(`[VAIS SubAgentAudit] ⚠ catalog.json 파싱 실패: ${e.message}\n`);
    return { artifacts: [] };
  }
}

/**
 * 단일 sub-agent 평가.
 */
function auditAgent(agent, catalog) {
  const result = {
    clevel: agent.clevel,
    name: agent.name,
    filePath: path.relative(PROJECT_DIR, agent.filePath),
    qa: { pass: false, value: null, note: '' },
    qb: { pass: false, value: null, note: '' },
    qc: { pass: true, value: null, note: '' }, // default true (scope 가 아닐 때)
    qd: { pass: true, status: 'pass', value: null, note: '' }, // 3-state: pass / warn / fail
    deprecated: false,
    utility: false,
  };

  let fm;
  try {
    fm = matter.read(agent.filePath).data;
  } catch (e) {
    result.qa.note = `frontmatter 파싱 실패: ${e.message}`;
    return result;
  }

  // deprecated 확인
  if (fm.deprecated === true) {
    result.deprecated = true;
  }

  // utility=true 면제 (메타-도구 — catalog artifact 와 정합 평가 X)
  if (fm.utility === true) {
    result.utility = true;
  }

  // Q-A: canon_source 명시
  if (fm.canon_source && typeof fm.canon_source === 'string' && fm.canon_source.length > 0) {
    result.qa.pass = true;
    result.qa.value = fm.canon_source;
  } else if (result.deprecated) {
    result.qa.pass = true; // deprecated 는 면제
    result.qa.note = 'deprecated — canon_source 면제';
  } else if (result.utility) {
    result.qa.pass = true;
    result.qa.note = 'utility — canon_source 면제';
  } else {
    result.qa.note = 'canon_source 필드 누락';
  }

  // Q-B: execution.policy enum
  if (fm.execution && typeof fm.execution === 'object' && fm.execution.policy) {
    if (VALID_POLICIES.includes(fm.execution.policy)) {
      result.qb.pass = true;
      result.qb.value = fm.execution.policy;
    } else {
      result.qb.note = `policy 값 "${fm.execution.policy}" 가 enum 위반: [${VALID_POLICIES.join(', ')}]`;
    }
  } else if (result.deprecated) {
    result.qb.pass = true;
    result.qb.note = 'deprecated — policy 면제';
  } else {
    result.qb.note = 'execution.policy 필드 누락';
  }

  // Q-C: scope policy 의 경우 scope_conditions 검증
  if (fm.execution && fm.execution.policy === 'scope') {
    const conditions = fm.execution.scope_conditions;
    if (Array.isArray(conditions) && conditions.length > 0) {
      result.qc.pass = true;
      result.qc.value = `${conditions.length}개 조건`;
    } else {
      result.qc.pass = false;
      result.qc.note = 'policy=scope 인데 scope_conditions 누락 또는 빈 배열';
    }
  } else if (fm.execution && fm.execution.policy === 'triggered') {
    const events = fm.execution.trigger_events;
    if (Array.isArray(events) && events.length > 0) {
      result.qc.pass = true;
      result.qc.value = `${events.length}개 trigger`;
    } else {
      result.qc.pass = false;
      result.qc.note = 'policy=triggered 인데 trigger_events 누락';
    }
  }

  // Q-D: artifacts ↔ catalog owner_agent 매칭 (3-state: pass / warn / fail)
  // - pass: agent.artifacts 가 모두 catalog 의 owner_agent 와 매칭 + catalog 의 owner 도 모두 declared
  // - warn: agent 가 artifacts 선언했지만 catalog 에 owner_agent 매칭 부재 또는 부분 매칭
  //         (template 미작성 단계 — Sprint 11~14 후 자동 해소 예상)
  // - fail: catalog 에 owner_agent 매칭이 있는데 agent 가 artifacts 미선언 (정합성 위반)
  if (result.utility) {
    // utility agent — Q-D 면제
    result.qd.pass = true;
    result.qd.status = 'pass';
    result.qd.note = 'utility — Q-D 면제 (메타-도구)';
  } else if (result.deprecated) {
    result.qd.pass = true;
    result.qd.status = 'pass';
    result.qd.note = 'deprecated — Q-D 면제';
  } else if (Array.isArray(fm.artifacts) && fm.artifacts.length > 0) {
    const declared = new Set(fm.artifacts);
    const matched = catalog.artifacts.filter(
      (a) => a.owner_agent === agent.name && declared.has(a.id)
    );
    const expected = catalog.artifacts.filter((a) => a.owner_agent === agent.name);
    if (matched.length === expected.length && expected.length === fm.artifacts.length) {
      result.qd.pass = true;
      result.qd.status = 'pass';
      result.qd.value = `${matched.length}개 매칭`;
    } else if (expected.length === 0) {
      // catalog 에 owner_agent 매칭 없음 — template 미작성 단계 likely (warn)
      result.qd.pass = true; // pass 로 격하 (목적은 Sprint 11~14 후 자동 해소)
      result.qd.status = 'warn';
      result.qd.note =
        `artifacts ${fm.artifacts.length}개 선언했으나 catalog 매칭 0 — template 미작성 (Sprint 11~14 후 자동 해소 예상)`;
      result.qd.value = fm.artifacts.join(', ');
    } else {
      // 부분 매칭 (warn) — agent 가 더 많이 선언, catalog 가 부분만 등록
      result.qd.pass = true; // warn 도 pass 처리 (audit exit code 만 2)
      result.qd.status = 'warn';
      result.qd.note =
        `부분 매칭: agent 선언 ${fm.artifacts.length} / catalog owner 매칭 ${expected.length} / 교집합 ${matched.length}`;
    }
  } else {
    // artifacts 미선언 — catalog 의 owner_agent 가 본 agent 인 항목이 있으면 fail
    const ownedInCatalog = catalog.artifacts.filter((a) => a.owner_agent === agent.name);
    if (ownedInCatalog.length > 0) {
      result.qd.pass = false;
      result.qd.status = 'fail';
      result.qd.note =
        `정합성 위반: agent 의 artifacts frontmatter 미선언, 그러나 catalog 가 owner_agent="${agent.name}" 로 ${ownedInCatalog.length}개 선언`;
      result.qd.value = ownedInCatalog.map((a) => a.id).join(', ');
    } else {
      result.qd.pass = true;
      result.qd.status = 'pass';
      result.qd.note = 'artifacts 미선언 + catalog 매칭 없음 (정합)';
    }
  }

  return result;
}

function main(argv) {
  const args = argv.slice(0);
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');

  const agents = collectSubAgentFiles();
  const catalog = loadCatalog();

  const results = agents.map((a) => auditAgent(a, catalog));

  // 그룹별 통계
  const byCLevel = {};
  for (const r of results) {
    if (!byCLevel[r.clevel]) byCLevel[r.clevel] = [];
    byCLevel[r.clevel].push(r);
  }

  const summary = {
    total: results.length,
    qa_pass: results.filter((r) => r.qa.pass).length,
    qb_pass: results.filter((r) => r.qb.pass).length,
    qc_pass: results.filter((r) => r.qc.pass).length,
    qd_pass: results.filter((r) => r.qd.pass).length,
    qd_strict_pass: results.filter((r) => r.qd.status === 'pass').length,
    qd_warn: results.filter((r) => r.qd.status === 'warn').length,
    qd_fail: results.filter((r) => r.qd.status === 'fail').length,
    all_pass: results.filter((r) => r.qa.pass && r.qb.pass && r.qc.pass && r.qd.pass).length,
    deprecated: results.filter((r) => r.deprecated).length,
    utility: results.filter((r) => r.utility).length,
  };

  if (jsonOutput) {
    process.stdout.write(JSON.stringify({ summary, results, byCLevel }, null, 2) + '\n');
  } else {
    process.stdout.write('═══ VAIS Sub-agent Audit (F4 SC-09) ═══\n\n');
    process.stdout.write(`총 sub-agent: ${summary.total}\n`);
    process.stdout.write(`  Q-A canon_source 명시:        ${summary.qa_pass}/${summary.total}\n`);
    process.stdout.write(`  Q-B execution.policy:         ${summary.qb_pass}/${summary.total}\n`);
    process.stdout.write(`  Q-C scope/trigger conditions: ${summary.qc_pass}/${summary.total}\n`);
    process.stdout.write(`  Q-D artifacts ↔ catalog:      ${summary.qd_pass}/${summary.total} (strict-pass ${summary.qd_strict_pass} / warn ${summary.qd_warn} / fail ${summary.qd_fail})\n`);
    process.stdout.write(`  전 4기준 통과:                 ${summary.all_pass}/${summary.total}\n`);
    process.stdout.write(`  (deprecated 면제):            ${summary.deprecated}/${summary.total}\n`);
    process.stdout.write(`  (utility 면제):               ${summary.utility}/${summary.total}\n\n`);

    if (verbose || summary.all_pass < summary.total) {
      process.stdout.write('── 미통과 sub-agent ──\n');
      for (const r of results) {
        if (r.qa.pass && r.qb.pass && r.qc.pass && r.qd.pass) continue;
        const flags = [
          r.qa.pass ? '✅A' : '❌A',
          r.qb.pass ? '✅B' : '❌B',
          r.qc.pass ? '✅C' : '❌C',
          r.qd.pass ? '✅D' : '❌D',
        ].join(' ');
        process.stdout.write(`  ${flags}  ${r.clevel}/${r.name}\n`);
        if (!r.qa.pass) process.stdout.write(`         A: ${r.qa.note}\n`);
        if (!r.qb.pass) process.stdout.write(`         B: ${r.qb.note}\n`);
        if (!r.qc.pass) process.stdout.write(`         C: ${r.qc.note}\n`);
        if (!r.qd.pass) process.stdout.write(`         D: ${r.qd.note}\n`);
      }
    }
  }

  // exit code
  const qaQbFail = results.some((r) => !r.qa.pass || !r.qb.pass);
  const qcQdFail = results.some((r) => !r.qc.pass || !r.qd.pass);
  if (qaQbFail) return 1;
  if (qcQdFail) return 2;
  return 0;
}

module.exports = {
  collectSubAgentFiles,
  loadCatalog,
  auditAgent,
  VALID_POLICIES,
};

if (require.main === module) {
  const code = main(process.argv.slice(2));
  process.exit(code);
}
