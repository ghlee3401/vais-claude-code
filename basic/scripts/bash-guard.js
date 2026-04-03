#!/usr/bin/env node
/**
 * PreToolUse(Bash) Hook — bash-guard
 *
 * Bash 명령 실행 전 위험 패턴을 차단합니다.
 * exit code 2 = 차단 (Claude에게 에러로 전달)
 * exit code 0 = 허용
 *
 * Hook input: stdin으로 JSON 수신
 * { "tool_name": "Bash", "tool_input": { "command": "..." } }
 */

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+[^-]/,           // rm -rf (단, rm -rf /tmp/xxx 형태 포함)
  /git\s+push\s+--force/,      // force push
  /git\s+reset\s+--hard/,      // hard reset
  /DROP\s+TABLE/i,              // SQL DROP TABLE
  /DELETE\s+FROM\s+\w+\s*;?\s*$/i, // WHERE 없는 DELETE
  />\s*\/dev\/sda/,             // 디스크 직접 쓰기
];

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const { tool_input } = JSON.parse(input);
    const command = tool_input?.command || '';

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(command)) {
        // stderr에 이유 출력 (Claude가 볼 수 있음)
        process.stderr.write(`[bash-guard] 차단된 명령 패턴: ${pattern}\n명령: ${command}\n`);
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    // 파싱 실패 시 허용 (오탐 방지)
    process.exit(0);
  }
});
