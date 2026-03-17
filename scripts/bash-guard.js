#!/usr/bin/env node
/**
 * VAIS Code - Bash Guard (PreToolUse)
 * 위험한 명령을 자동 차단
 */
const { readStdin, parseHookInput, outputAllow, outputBlock } = require('../lib/io');
const { debugLog } = require('../lib/debug');

const input = readStdin();
const { command } = parseHookInput(input);

if (!command) {
  outputAllow();
  process.exit(0);
}

const BLOCKED = [
  // rm -rf 변형: 분리된 플래그(-r -f), sudo, 환경변수($HOME 등), 경로 조작(/../) 포함
  { pattern: /(?:sudo\s+)?rm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r|--recursive\s+--force|--force\s+--recursive)\s+[\/~.]/, reason: '위험한 재귀 강제 삭제 시도' },
  { pattern: /(?:sudo\s+)?rm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r|--recursive\s+--force|--force\s+--recursive)\s+\$/, reason: '환경변수 경로 재귀 삭제 시도' },
  { pattern: /drop\s+database/i, reason: 'DB 전체 삭제 시도' },
  { pattern: /drop\s+table/i, reason: 'DB 테이블 삭제 시도' },
  { pattern: /truncate\s+table/i, reason: 'DB 테이블 초기화 시도' },
  { pattern: /git\s+push\s+.*--force/, reason: '강제 푸시는 팀 작업에 위험합니다' },
  { pattern: /(?:sudo\s+)?mkfs/, reason: '파일시스템 포맷 시도' },
  { pattern: /:\(\)\{.*\|.*&\}/, reason: 'Fork bomb 감지' },
  { pattern: />\s*\/dev\/sd[a-z]/, reason: '디스크 직접 쓰기 시도' },
  { pattern: /(?:sudo\s+)?dd\s+.*of=\/dev\//, reason: 'dd로 디스크 직접 쓰기 시도' },
  { pattern: /chmod\s+(-R\s+)?777\s+\//, reason: '루트 권한 변경 시도' },
];

const ASK = [
  { pattern: /rm\s+-r\b/, reason: '재귀 삭제 명령 - 정말 실행할까요?' },
  { pattern: /git\s+reset\s+--hard/, reason: '커밋되지 않은 변경사항이 모두 사라집니다' },
  { pattern: /delete\s+from/i, reason: 'DB 레코드 대량 삭제' },
];

for (const { pattern, reason } of BLOCKED) {
  if (pattern.test(command)) {
    debugLog('BashGuard', 'BLOCKED', { command, reason });
    outputBlock(`⛔ 차단됨: ${reason}\n명령: ${command}`);
    process.exit(0);
  }
}

for (const { pattern, reason } of ASK) {
  if (pattern.test(command)) {
    debugLog('BashGuard', 'WARNING', { command, reason });
    outputAllow(`⚠️ 주의: ${reason}\n실행하려는 명령: \`${command}\`\n사용자에게 확인을 받으세요.`);
    process.exit(0);
  }
}

outputAllow();
process.exit(0);
