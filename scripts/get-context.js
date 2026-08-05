#!/usr/bin/env node
/**
 * VAIS Code - 동적 컨텍스트 출력
 * SKILL.md의 !`node` 전처리에서 호출됨
 * 현재 워크플로우 상태를 마크다운으로 출력
 */
const path = require('path');
const fs = require('fs');

/**
 * agent-state.json에서 현재 활성 C-Level role을 읽어옴
 * 없으면 'cto'(기본 techOnly orchestrator)를 반환
 */
function getActiveRole() {
  try {
    const statePath = '.vais/agent-state.json';
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.active_agents && state.active_agents.length > 0) {
        return state.active_agents[state.active_agents.length - 1].role;
      }
    }
  } catch (_) { /* fallback to cto */ }
  return 'cto';
}

// paths/status 모듈 로드 (플러그인 루트 기준)
const pluginRoot = path.resolve(__dirname, '..');
const libPath = path.join(pluginRoot, 'lib');

// 모듈 직접 로드 (require.resolve로 경로 검증)
function loadModules() {
  try {
    const pathsMod = require(require.resolve(path.join(libPath, 'paths')));
    const statusMod = require(require.resolve(path.join(libPath, 'status')));
    return { pathsMod, statusMod };
  } catch (e) {
    throw new Error(`VAIS lib 모듈 로드 실패: ${e.message}`);
  }
}

function main() {
try {
  const { pathsMod, statusMod } = loadModules();
  const config = pathsMod.loadConfig();
  const status = statusMod.getStatus();
  const activeFeature = statusMod.getActiveFeature();
  const featureArg = process.argv[2] || '';

  const featureNames = Object.keys(status.features || {});
  const lines = [];

  if (featureNames.length > 0) {
    for (const fname of featureNames) {
      const summary = statusMod.getProgressSummary(fname);
      if (!summary) continue;

      const isActive = fname === activeFeature;
      const marker = isActive ? '👉 ' : '   ';
      lines.push(`${marker}**${fname}** — 현재: ${summary.currentPhaseName}`);
      lines.push(`   ${summary.progressCompact}`);

      // 피처 레지스트리 — plan에서 정의된 기능 목록
      const registry = statusMod.getFeatureRegistry(fname);
      if (registry && registry.features && registry.features.length > 0) {
        const total = registry.features.length;
        const done = registry.features.filter(f => f.status === '완료').length;
        const inProgress = registry.features.filter(f => f.status === '진행중').length;
        lines.push(`   📋 기능: ${done}/${total} 완료${inProgress > 0 ? `, ${inProgress} 진행중` : ''}`);
        for (const feat of registry.features) {
          const icon = feat.status === '완료' ? '✅' : feat.status === '진행중' ? '🔄' : '⬜';
          lines.push(`      ${icon} ${feat.id}: ${feat.name} [${feat.priority || '-'}]`);
        }
      }

      if (summary.gapAnalysis) {
        const ga = summary.gapAnalysis;
        const passStr = ga.passed ? '✅ 통과' : `❌ 미달 (${ga.iteration}/${ga.maxIterations})`;
        lines.push(`   Gap: ${ga.matchRate}% (${ga.matchedItems}/${ga.totalItems}) ${passStr}`);
      }

      const phases = config.workflow?.phases || [];
      const phaseNames = config.workflow?.phaseNames || {};
      const currentIdx = phases.indexOf(summary.currentPhase);
      // 현재 단계가 in-progress면 현재 단계 실행 안내, 아니면 다음 단계 안내
      const activeRole = getActiveRole();
      const currentPhaseStatus = status.features[fname]?.phases?.[summary.currentPhase]?.status;
      if (currentPhaseStatus === 'in-progress') {
        lines.push(`   📍 진행중: \`/vais ${activeRole} ${summary.currentPhase} ${fname}\` (${phaseNames[summary.currentPhase] || summary.currentPhase})`);
      } else if (currentIdx >= 0) {
        lines.push(`   💡 다음: \`/vais ${activeRole} ${summary.currentPhase} ${fname}\` (${phaseNames[summary.currentPhase] || summary.currentPhase})`);
      }
      lines.push('');
    }

    if (activeFeature) {
      lines.push(`**활성 피처**: ${activeFeature}`);
    }
  } else {
    lines.push('진행 중인 피처 없음. `/vais auto {이름}` 또는 `/vais plan {이름}`으로 시작하세요.');
  }

  console.log(lines.join('\n'));
} catch (e) {
  console.log('상태 로드 실패 — 새 프로젝트로 시작합니다.');
}
}

module.exports = { main, loadModules };

if (require.main === module) {
  main();
}
