#!/usr/bin/env node
process.on('uncaughtException', e => { try { process.stderr.write(`[VAIS hook] bash-guard crashed: ${e.message}\n`); } catch (_) {} process.exit(0); });
process.on('unhandledRejection', e => { try { process.stderr.write(`[VAIS hook] bash-guard rejected: ${e && e.message || e}\n`); } catch (_) {} process.exit(0); });
/**
 * VAIS Code - Bash Guard (PreToolUse)
 * 위험한 명령을 자동 차단
 */
const { readStdin, parseHookInput, outputAllow, outputBlock } = require('../lib/io');
const { debugLog } = require('../lib/debug');
const { logHook } = require('../lib/hook-logger');

const BLOCKED = [
  { pattern: /drop\s+database/i, reason: 'DB 전체 삭제 시도' },
  { pattern: /drop\s+table/i, reason: 'DB 테이블 삭제 시도' },
  { pattern: /truncate\s+table/i, reason: 'DB 테이블 초기화 시도' },
  // git push --force (의도적으로 --force-with-lease는 제외: 안전한 force push)
  { pattern: /git\s+push\s+.*--force(?!-with-lease)/i, reason: '강제 푸시는 팀 작업에 위험합니다' },
  { pattern: /(?:sudo\s+)?mkfs/, reason: '파일시스템 포맷 시도' },
  { pattern: /:\(\)\{.*\|.*&\}/, reason: 'Fork bomb 감지' },
  { pattern: />\s*\/dev\/sd[a-z]/, reason: '디스크 직접 쓰기 시도' },
  { pattern: /(?:sudo\s+)?dd\s+.*of=\/dev\//, reason: 'dd로 디스크 직접 쓰기 시도' },
  { pattern: /chmod\s+(-R\s+)?777\s+\//, reason: '루트 권한 변경 시도' },
  // A03: rm 루트 삭제 — ASK 패턴(rm -r)보다 높은 우선순위로 BLOCKED 처리
  { pattern: /rm\s+(?:-[a-zA-Z]*r[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s*\/(?:\s|$)/, reason: '루트 디렉토리 재귀 삭제 시도' },
  { pattern: /rm\s+--recursive\b/, reason: '재귀 삭제 명령 (--recursive 장형식 우회 방지)' },
];

const ASK = [
  // -r, -rf, -rfoo, -fr 등 옵션 묶음 모두 매치
  { pattern: /rm\s+-[a-zA-Z]*r[a-zA-Z]*/, reason: '재귀 삭제 명령 - 정말 실행할까요?' },
  { pattern: /rm\s+--recursive/, reason: '재귀 삭제 명령(--recursive) - 정말 실행할까요?' },
  { pattern: /git\s+reset\s+--hard/, reason: '커밋되지 않은 변경사항이 모두 사라집니다' },
  { pattern: /delete\s+from/i, reason: 'DB 레코드 대량 삭제' },
];

/**
 * 명령어 검사 함수 (테스트에서도 사용 가능)
 */
function checkGuard(command) {
  if (!command) return { decision: 'allow' };

  for (const { pattern, reason } of BLOCKED) {
    if (pattern.test(command)) {
      return { decision: 'block', reason: `⛔ 차단됨: ${reason}\n명령: ${command}` };
    }
  }

  for (const { pattern, reason } of ASK) {
    if (pattern.test(command)) {
      return { decision: 'warn', reason };
    }
  }

  return { decision: 'allow' };
}

// 테스트에서 require로 사용할 수 있도록 export
module.exports = { BLOCKED, ASK, checkGuard };

// 직접 실행 시에만 stdin 처리
if (require.main === module) {
  const input = readStdin();
  const { command } = parseHookInput(input);

  const result = checkGuard(command);

  if (result.decision === 'block') {
    logHook('PreToolUse:Bash', 'blocked', { command, reason: result.reason });
    debugLog('BashGuard', 'BLOCKED', { command, reason: result.reason });
    outputBlock(result.reason);
    process.exit(0);
  }

  if (result.decision === 'warn') {
    logHook('PreToolUse:Bash', 'warn', { command, reason: result.reason });
    debugLog('BashGuard', 'WARNING', { command, reason: result.reason });
    outputAllow(`⚠️ 주의: ${result.reason}\n실행하려는 명령: \`${command}\`\n사용자에게 확인을 받으세요.`);
    process.exit(0);
  }

  logHook('PreToolUse:Bash', 'ok');
  outputAllow();
  process.exit(0);
}
