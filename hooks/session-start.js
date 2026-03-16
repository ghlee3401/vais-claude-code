#!/usr/bin/env node
/**
 * VAIS Code - SessionStart Hook (경량화)
 * 세션 시작 시 1회 실행: 최소한의 상태 + 안내만 출력
 * 상세 컨텍스트는 SKILL.md의 !`node` 전처리가 담당
 */
const { debugLog } = require('../lib/debug');
const { ensureVaisDirs, loadConfig } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary } = require('../lib/status');

debugLog('SessionStart', 'Hook executed', { cwd: process.cwd() });

ensureVaisDirs();

const config = loadConfig();
const VERSION = config.version || '0.10.1';
const status = getStatus();
const activeFeature = getActiveFeature();
const featureNames = Object.keys(status.features || {});

let ctx = `# VAIS Code v${VERSION}\n\n`;
ctx += `> 🔭조사·탐색 → 📋기획 → 🗺IA → 🖼와이어프레임 → 🎨설계(UI+DB) → 💻프론트 → ⚙️백엔드 → 🔎Gap분석 → 🔍검토\n\n`;

// 진행 중인 피처가 있으면 간단히 표시
if (featureNames.length > 0) {
  ctx += `## 진행 중인 피처\n\n`;
  for (const fname of featureNames) {
    const summary = getProgressSummary(fname);
    if (!summary) continue;
    const marker = fname === activeFeature ? '👉 ' : '   ';
    ctx += `${marker}**${fname}** — ${summary.currentPhaseName} ${summary.progressCompact}\n`;
  }
  ctx += `\n`;
}

// 빠른 시작 안내
ctx += `## 시작하기\n\n`;
ctx += `| 커맨드 | 설명 |\n`;
ctx += `|--------|------|\n`;
ctx += `| \`/vais auto {기능}\` | 전체 자동 워크플로우 |\n`;
ctx += `| \`/vais plan {기능}\` | 기획부터 시작 |\n`;
ctx += `| \`/vais status\` | 진행 상태 확인 |\n`;
ctx += `| \`/vais help\` | 사용법 안내 |\n\n`;

const response = {
  additionalContext: ctx,
};

console.log(JSON.stringify(response));
process.exit(0);
