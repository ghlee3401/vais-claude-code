'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { analyzeCEO } = require('../lib/ceo-algorithm');
const { checkGate } = require('../lib/quality/gate-manager');
const { measureText, summarizePhaseRun } = require('../lib/context-metrics');

const ROOT = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

describe('lean context golden contracts', () => {
  const scenarios = [
    {
      name: '소규모 버그 수정',
      rawText: '기존 검색 결과 정렬 버그를 수정',
      expectedProduct: 'low',
      expectedCLevels: ['cto'],
    },
    {
      name: 'UI/API 신규 기능',
      rawText: '신규 기능으로 사용자 설정 화면과 외부 API 연동 flow 추가',
      expectedProduct: 'high',
      expectedCLevels: ['cpo', 'cto'],
    },
    {
      name: '인증·보안 기능',
      rawText: 'OAuth 로그인과 사용자 권한 인증 기능 추가',
      expectedProduct: 'medium',
      expectedCLevels: ['cpo', 'cto', 'cso'],
    },
  ];

  for (const scenario of scenarios) {
    it(`${scenario.name}: CEO 7차원 라우팅 계약을 유지한다`, () => {
      const result = analyzeCEO({ feature: 'golden-feature', rawText: scenario.rawText });
      const product = result.dimensions.find(d => d.name === '제품정의');
      assert.equal(product.grade, scenario.expectedProduct);
      for (const role of scenario.expectedCLevels) {
        assert.ok(result.activeCLevel.includes(role), `${role}가 activeCLevel에 포함되어야 함`);
      }
    });
  }

  it('QA 보호 계약은 Critical=0, matchRate>=90을 유지한다', () => {
    const pass = checkGate('qa', {
      role: 'cto',
      metrics: { matchRate: 90, codeQualityScore: 70, criticalIssueCount: 0 },
    });
    const fail = checkGate('qa', {
      role: 'cto',
      metrics: { matchRate: 100, codeQualityScore: 100, criticalIssueCount: 1 },
    });
    assert.equal(pass.verdict, 'pass');
    assert.equal(fail.verdict, 'fail');
  });

  it('Scope·Decision·frontmatter 보호 계약이 정본에 남아 있다', () => {
    const cto = read('agents/cto/cto.md');
    const subdoc = read('agents/_shared/subdoc-guard.md');
    const mainGuard = read('agents/_shared/clevel-main-guard.md');
    assert.match(cto, /요청 원문/);
    assert.match(cto, /In-scope/);
    assert.match(mainGuard, /Decision Record/);
    for (const field of ['owner', 'artifact', 'phase', 'feature']) {
      assert.match(subdoc, new RegExp(`${field}:`));
    }
  });

  it('모든 C-Level 직접 호출 진입점에 상호작용 최소 불변식이 있다', () => {
    for (const role of ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo']) {
      const source = read(`agents/${role}/${role}.md`);
      assert.match(source, /AskUserQuestion/, `${role}: AskUserQuestion 불변식`);
      assert.match(source, /승인 후 자동 실행/, `${role}: 승인 후 자동 실행 불변식`);
      assert.match(source, /phase 자동 연쇄 금지/, `${role}: phase 자동 연쇄 금지 불변식`);
    }
  });

  it('output style은 진행 상황 표시기를 유지하되 명령 재입력을 강제하지 않는다', () => {
    const style = read('output-styles/vais-default.md');
    assert.match(style, /💠 VAIS Code v\{version\}/, '버전 푸터');
    assert.match(style, /📊 진행: \[2\/6\]/, '진행 바 템플릿');
    assert.match(style, /✅=완료, 🔄=현재, ⬜=대기/, '진행 바 범례');
    assert.match(style, /다시 입력하라고 요구하지 않으며/, '재입력 요구 금지 명시');
    assert.doesNotMatch(style, /다음 명령 포맷 \(엄격\)/);
  });

  it('모든 C-Level의 L1 컨텍스트가 compact phase view를 사용한다', () => {
    for (const role of ['ceo', 'cpo', 'cto', 'cso', 'coo']) {
      const source = read(`agents/${role}/${role}.md`);
      const l1 = source.split('\n').find(line => line.startsWith('- **L1**'));
      assert.ok(l1, `${role}: L1 항목 존재`);
      assert.match(l1, new RegExp(`phase-context\\.js" ${role} `), `${role}: phase view 사용`);
      assert.doesNotMatch(l1, /^- \*\*L1\*\* \(항상\): `vais\.config\.json`$/, `${role}: 전체 config 읽기 잔존`);
    }
  });

  it('하단 리포트의 {version} 치환 대상이 살아 있다', () => {
    const style = read('output-styles/vais-default.md');
    const hook = read('hooks/session-start.js');
    assert.match(hook, /\{version\}/, 'session-start의 치환 코드');
    assert.ok(style.includes('{version}'), 'output style의 치환 플레이스홀더');
  });
});

describe('context metrics', () => {
  it('UTF-8 byte 기반 추정치를 명시적으로 계산한다', () => {
    const metric = measureText('abcd\n한글');
    assert.ok(metric.bytes > 4);
    assert.equal(metric.lines, 2);
    assert.equal(metric.estimatedTokens, Math.ceil(metric.bytes / 4));
  });

  it('phase 실행의 시간·agent 호출·입출력 크기를 요약한다', () => {
    const result = summarizePhaseRun({
      role: 'cto',
      phase: 'plan',
      feature: 'golden-feature',
      startedAt: '2026-08-05T00:00:00.000Z',
      endedAt: '2026-08-05T00:00:01.500Z',
      agentCalls: 2,
    });
    assert.equal(result.elapsedMs, 1500);
    assert.equal(result.agentCalls, 2);
    assert.match(result.tokenMetric, /estimated/);
  });
});
