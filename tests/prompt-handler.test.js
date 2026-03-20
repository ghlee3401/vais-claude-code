#!/usr/bin/env node
/**
 * VAIS Code - scripts/prompt-handler.js 체이닝 로직 테스트
 * stdin 의존성 없이 핵심 패턴 매칭 로직을 직접 테스트
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// 체이닝 패턴 (prompt-handler.js에서 사용하는 정규식)
const chainingPattern = /^\/vais\s+([\w+:]+)\s+(.+)$/i;

// 범위 패턴
const rangePattern = /(\w+)\s*부터\s*(\w+)\s*까지/;

const PHASES = ['plan', 'design', 'infra', 'fe', 'be', 'qa'];

describe('체이닝 패턴 감지', () => {
  it('순차 체이닝을 감지한다', () => {
    const match = '/vais plan:design:infra login'.match(chainingPattern);
    assert.ok(match);
    assert.equal(match[1], 'plan:design:infra');
    assert.equal(match[2], 'login');
  });

  it('병렬 체이닝을 감지한다', () => {
    const match = '/vais fe+be login'.match(chainingPattern);
    assert.ok(match);
    assert.equal(match[1], 'fe+be');
    assert.equal(match[2], 'login');
  });

  it('혼합 체이닝을 감지한다', () => {
    const match = '/vais plan:design:infra:fe+be:qa login'.match(chainingPattern);
    assert.ok(match);
    assert.equal(match[1], 'plan:design:infra:fe+be:qa');
    assert.equal(match[2], 'login');
  });

  it('단일 단계는 체이닝이 아니다', () => {
    const match = '/vais plan login'.match(chainingPattern);
    assert.ok(match);
    // 단일이라 : 또는 +가 없음
    assert.ok(!match[1].includes(':') && !match[1].includes('+'));
  });

  it('한글 피처명을 감지한다', () => {
    const match = '/vais plan:design 로그인기능'.match(chainingPattern);
    assert.ok(match);
    assert.equal(match[2], '로그인기능');
  });
});

describe('범위 패턴 감지', () => {
  it('plan부터 qa까지를 감지한다', () => {
    const match = 'plan부터 qa까지'.match(rangePattern);
    assert.ok(match);
    assert.equal(match[1], 'plan');
    assert.equal(match[2], 'qa');
  });

  it('plan부터 be까지를 감지한다', () => {
    const match = 'plan부터 be까지'.match(rangePattern);
    assert.ok(match);
    assert.equal(match[1], 'plan');
    assert.equal(match[2], 'be');
  });

  it('공백 변형을 감지한다', () => {
    const match = 'plan 부터 qa 까지'.match(rangePattern);
    assert.ok(match);
  });
});

describe('체이닝 세그먼트 검증', () => {
  it('유효한 순차 세그먼트를 검증한다', () => {
    const chainExpr = 'plan:design:infra';
    const segments = chainExpr.split(':');
    const allValid = segments.every(seg => {
      const parts = seg.split('+');
      return parts.every(p => PHASES.includes(p));
    });
    assert.ok(allValid);
  });

  it('유효한 병렬 세그먼트를 검증한다', () => {
    const chainExpr = 'fe+be';
    const segments = chainExpr.split(':');
    const allValid = segments.every(seg => {
      const parts = seg.split('+');
      return parts.every(p => PHASES.includes(p));
    });
    assert.ok(allValid);
  });

  it('잘못된 단계명을 거부한다', () => {
    const chainExpr = 'plan:invalid:design';
    const segments = chainExpr.split(':');
    const allValid = segments.every(seg => {
      const parts = seg.split('+');
      return parts.every(p => PHASES.includes(p));
    });
    assert.ok(!allValid);
  });
});
