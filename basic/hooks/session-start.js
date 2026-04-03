#!/usr/bin/env node
/**
 * SessionStart Hook
 *
 * Claude Code가 세션을 시작할 때 실행됩니다.
 * 역할: 현재 상태 로드 → 컨텍스트 주입 → 대기 중인 작업 알림
 *
 * 출력은 stdout으로, Claude의 컨텍스트에 자동 주입됩니다.
 * stderr는 Claude에게 전달되지 않으므로 디버그 로그에 사용하세요.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const STATE_FILE = path.join(ROOT, '.state', 'status.json');

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const state = loadState();

  if (!state) {
    // 새 프로젝트 — 기본 안내 출력
    console.log(`# Session Start

새 프로젝트입니다. \`/example plan {feature}\`로 시작하세요.
`);
    return;
  }

  // 진행 중인 피처가 있으면 상태 표시
  const { feature, phase, updatedAt } = state;
  console.log(`# Session Start

## 진행 중인 작업
- **피처**: ${feature}
- **단계**: ${phase}
- **마지막 업데이트**: ${updatedAt || '알 수 없음'}

계속 진행하려면 \`/example ${phase} ${feature}\`를 입력하세요.
`);
}

main();
