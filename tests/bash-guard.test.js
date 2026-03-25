#!/usr/bin/env node
/**
 * VAIS Code - scripts/bash-guard.js 로직 유닛 테스트
 * 실제 스크립트에서 패턴과 checkGuard를 import하여 테스트 (패턴 불일치 방지)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// 실제 bash-guard에서 패턴과 검사 함수를 직접 import
const { checkGuard } = require('../scripts/bash-guard');

describe('bash-guard 차단', () => {
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

  it('sudo mkfs를 차단한다', () => {
    const result = checkGuard('sudo mkfs.ext4 /dev/sda1');
    assert.equal(result.decision, 'block');
  });

  it('chmod 777 /를 차단한다', () => {
    const result = checkGuard('chmod 777 /');
    assert.equal(result.decision, 'block');
  });

  it('chmod -R 777 /를 차단한다', () => {
    const result = checkGuard('chmod -R 777 /');
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

  it('null 명령은 허용한다', () => {
    const result = checkGuard(null);
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
