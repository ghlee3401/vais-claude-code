#!/usr/bin/env node
/**
 * PostToolUse(Write|Edit) Hook — doc-tracker
 *
 * 파일 저장/수정 후 docs/ 하위 변경을 추적합니다.
 * 변경 이력을 .state/doc-changes.json에 기록합니다.
 *
 * Hook input: stdin으로 JSON 수신
 * { "tool_name": "Write"|"Edit", "tool_input": { "file_path": "..." }, ... }
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const STATE_DIR = path.join(ROOT, '.state');
const CHANGES_FILE = path.join(STATE_DIR, 'doc-changes.json');

function loadChanges() {
  try {
    if (!fs.existsSync(CHANGES_FILE)) return [];
    return JSON.parse(fs.readFileSync(CHANGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveChanges(changes) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  // 원자적 쓰기: 임시 파일에 먼저 쓰고 rename
  const tmp = CHANGES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(changes, null, 2));
  fs.renameSync(tmp, CHANGES_FILE);
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_name, tool_input } = JSON.parse(input);
    const filePath = tool_input?.file_path || '';

    // docs/ 하위 파일만 추적
    if (!filePath.includes('/docs/') && !filePath.includes('\\docs\\')) {
      process.exit(0);
      return;
    }

    const changes = loadChanges();
    changes.push({
      file: filePath,
      tool: tool_name,
      timestamp: new Date().toISOString(),
    });

    // 최근 100개만 유지
    if (changes.length > 100) changes.splice(0, changes.length - 100);

    saveChanges(changes);
    process.exit(0);
  } catch {
    process.exit(0);
  }
});
