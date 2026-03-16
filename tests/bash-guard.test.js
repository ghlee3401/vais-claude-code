#!/usr/bin/env node
/**
 * VAIS Code - scripts/bash-guard.js 로직 유닛 테스트
 * /dev/stdin이 없는 환경을 위해 패턴 매칭 로직을 직접 테스트
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// bash-guard의 핵심 로직을 인라인으로 재현 (스크립트와 동일한 정규식 패턴)
const BLOCKED = [
  { pattern: /rm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+\/(?!\S)/, reason: '루트 디렉토리 삭제 시도' },
  { pattern: /rm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+~/, reason: '홈 디렉토리 삭제 시도' },
  { pattern: /rm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\s+\.(?:\/?\s|$)/, reason: '현재 디렉토리 전체 삭제 시도' },
  { pattern: /rm\s+--recursive\s+--force\s+[\/~.]/, reason: '재귀 강제 삭제 시도' },
  { pattern: /drop\s+database/i, reason: 'DB 전체 삭제 시도' },
  { pattern: /drop\s+table/i, reason: 'DB 테이블 삭제 시도' },
  { pattern: /truncate\s+table/i, reason: 'DB 테이블 초기화 시도' },
  { pattern: /git\s+push\s+.*--force/, reason: '강제 푸시는 팀 작업에 위험합니다' },
  { pattern: /mkfs/, reason: '파일시스템 포맷 시도' },
  { pattern: /:\(\)\{.*\|.*&\}/, reason: 'Fork bomb 감지' },
  { pattern: />\s*\/dev\/sd[a-z]/, reason: '디스크 직접 쓰기 시도' },
  { pattern: /dd\s+.*of=\/dev\//, reason: 'dd로 디스크 직접 쓰기 시도' },
];

const ASK = [
  { pattern: /rm\s+-r\b/, reason: '재귀 삭제 명령 - 정말 실행할까요?' },
  { pattern: /git\s+reset\s+--hard/, reason: '커밋되지 않은 변경사항이 모두 사라집니다' },
  { pattern: /delete\s+from/i, reason: 'DB 레코드 대량 삭제' },
];

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

describe('bash-guard 차단', () => {
  it('rm -rf / 를 차단한다', () => {
    const result = checkGuard('rm -rf /');
    assert.equal(result.decision, 'block');
    assert.ok(result.reason.includes('루트 디렉토리'));
  });

  it('rm -rf ~ 를 차단한다', () => {
    const result = checkGuard('rm -rf ~');
    assert.equal(result.decision, 'block');
  });

  it('rm -rf . 를 차단한다', () => {
    const result = checkGuard('rm -rf .');
    assert.equal(result.decision, 'block');
  });

  it('DROP DATABASE를 차단한다', () => {
    const result = checkGuard('psql -c "DROP DATABASE mydb"');
    assert.equal(result.decision, 'block');
  });

  it('DROP TABLE을 차단한다', () => {
    const result = checkGuard('mysql -e "DROP TABLE users"');
    assert.equal(result.decision, 'block');
  });

  it('git push --force를 차단한다', () => {
    const result = checkGuard('git push --force origin main');
    assert.equal(result.decision, 'block');
  });

  it('fork bomb을 차단한다', () => {
    const result = checkGuard(':(){:|:&};:');
    assert.equal(result.decision, 'block');
  });

  it('TRUNCATE TABLE을 차단한다', () => {
    const result = checkGuard('TRUNCATE TABLE users');
    assert.equal(result.decision, 'block');
  });

  it('rm -fr (플래그 순서 변경)을 차단한다', () => {
    const result = checkGuard('rm -fr /');
    assert.equal(result.decision, 'block');
  });

  it('rm --recursive --force를 차단한다', () => {
    const result = checkGuard('rm --recursive --force /tmp');
    assert.equal(result.decision, 'block');
  });

  it('디스크 직접 쓰기를 차단한다', () => {
    const result = checkGuard('echo data > /dev/sda');
    assert.equal(result.decision, 'block');
  });

  it('dd 디스크 쓰기를 차단한다', () => {
    const result = checkGuard('dd if=/dev/zero of=/dev/sda bs=1M');
    assert.equal(result.decision, 'block');
  });

  it('mkfs를 차단한다', () => {
    const result = checkGuard('mkfs.ext4 /dev/sda1');
    assert.equal(result.decision, 'block');
  });

  it('대소문자 무관하게 차단한다', () => {
    const result = checkGuard('drop database production');
    assert.equal(result.decision, 'block');
  });
});

describe('bash-guard 경고', () => {
  it('rm -r 에 경고를 출력한다', () => {
    const result = checkGuard('rm -r some_dir');
    assert.equal(result.decision, 'warn');
  });

  it('git reset --hard에 경고를 출력한다', () => {
    const result = checkGuard('git reset --hard HEAD~1');
    assert.equal(result.decision, 'warn');
  });

  it('DELETE FROM에 경고를 출력한다', () => {
    const result = checkGuard('DELETE FROM users WHERE id=1');
    assert.equal(result.decision, 'warn');
  });
});

describe('bash-guard 허용', () => {
  it('일반 명령은 허용한다', () => {
    const result = checkGuard('npm install');
    assert.equal(result.decision, 'allow');
  });

  it('git push (force 아닌)는 허용한다', () => {
    const result = checkGuard('git push origin main');
    assert.equal(result.decision, 'allow');
  });

  it('빈 명령은 허용한다', () => {
    const result = checkGuard('');
    assert.equal(result.decision, 'allow');
  });

  it('git commit은 허용한다', () => {
    const result = checkGuard('git commit -m "feat: add login"');
    assert.equal(result.decision, 'allow');
  });

  it('npm run build는 허용한다', () => {
    const result = checkGuard('npm run build');
    assert.equal(result.decision, 'allow');
  });
});
