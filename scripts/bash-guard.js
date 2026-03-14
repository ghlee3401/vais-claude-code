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
  { pattern: /rm\s+-r\s*f\s+\/(?!\S)/, reason: '루트 디렉토리 삭제 시도' },
  { pattern: /rm\s+-r\s*f\s+~/, reason: '홈 디렉토리 삭제 시도' },
  { pattern: /rm\s+-r\s*f\s+\.(?:\/?\s|$)/, reason: '현재 디렉토리 전체 삭제 시도' },
  { pattern: /drop\s+database/i, reason: 'DB 전체 삭제 시도' },
  { pattern: /drop\s+table/i, reason: 'DB 테이블 삭제 시도' },
  { pattern: /truncate/i, reason: 'DB 테이블 초기화 시도' },
  { pattern: /git\s+push\s+.*--force/, reason: '강제 푸시는 팀 작업에 위험합니다' },
  { pattern: /mkfs/, reason: '파일시스템 포맷 시도' },
  { pattern: /:\(\)\{.*\|.*&\}/, reason: 'Fork bomb 감지' },
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
