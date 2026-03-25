#!/usr/bin/env node
/**
 * VAIS Code - SessionStart Hook (경량화)
 * 세션 시작 시 1회 실행: 최소한의 상태 + 안내만 출력
 * 상세 컨텍스트는 SKILL.md의 !`node` 전처리가 담당
 */
const { debugLog } = require('../lib/debug');
const { ensureVaisDirs, loadConfig } = require('../lib/paths');
const { getStatus, getActiveFeature, getProgressSummary } = require('../lib/status');
const { sendWebhook } = require('../lib/webhook');

// Design Ref: §2 — 하단 리포트 규칙을 additionalContext에 주입하여 매 응답 강제 표시
/**
 * VAIS 하단 리포트 규칙 생성
 * @param {string} version - 현재 버전
 * @returns {string} additionalContext에 추가할 규칙 텍스트
 */
function buildReportRule(version) {
  return `## VAIS 하단 리포트 (Required for all responses)

**Rule: 매 응답 마지막에 아래 형식의 하단 리포트를 반드시 포함하세요.**

\`\`\`
────────────────────────────
💠 VAIS Code v${version}
────────────────────────────
🎯 피처: {현재 피처명 또는 "없음"}
📍 단계: {현재 단계 아이콘+이름}
📊 진행: [{n}/6] {진행바}
💡 다음: /vais {다음액션} {피처명}
────────────────────────────
\`\`\`

### 리포트 규칙:
1. **필수**: 모든 응답 끝에 반드시 포함 (미포함 시 불완전 응답)
2. 진행 중 피처가 없으면 "피처: 없음"만 표시하고 단계/진행/다음은 생략
3. 진행바: ✅=완료, 🔄=현재, ⬜=대기 (항상 6칸)
4. 단계 아이콘: 📋기획, 🎨설계, 🔧인프라, 💻프론트, ⚙️백엔드, ✅QA

`;
}

function main() {
debugLog('SessionStart', 'Hook executed', { cwd: process.cwd() });

ensureVaisDirs();

const config = loadConfig();
const VERSION = config.version || '0.10.1';
const status = getStatus();
const activeFeature = getActiveFeature();
const featureNames = Object.keys(status.features || {});

let ctx = `# VAIS Code v${VERSION}\n\n`;
ctx += `> 📋기획 → 🎨설계 → 🔧인프라 → 💻프론트 + ⚙️백엔드 → ✅QA\n\n`;

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

// Plan SC: SC-02 — additionalContext에 하단 리포트 규칙 포함
ctx += buildReportRule(VERSION);

const response = {
  additionalContext: ctx,
};

sendWebhook('session_start', {
  project: process.cwd(),
  activeFeature: activeFeature || null,
  featureCount: featureNames.length,
});

console.log(JSON.stringify(response));
process.exit(0);
}

module.exports = { main };

if (require.main === module) {
  main();
}
