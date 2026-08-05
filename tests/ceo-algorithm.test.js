/**
 * CEO Algorithm regression tests
 *
 * v0.66.1 hotfix (feature: v0-66-1-hotfix-alignment)
 * - α-3 회귀: `analyzeCEO({rawText})` 정본 / `analyzeCEO({input})` 알리아스 / 7 차원 등급 산출 / activeCLevel 매핑.
 * - 휴리스틱 변경에 brittle 하지 않도록 `gradeAtLeast` 로 단조성 검증 (정확 grade 값 금지).
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  DIMENSIONS,
  GRADE_ORDER,
  gradeAtLeast,
  analyzeDimensions,
  buildArtifactPlan,
  extractActiveCLevel,
  analyzeCEO,
} = require('../lib/ceo-algorithm');

const securityHeavyInput = '신규 결제 API 인증/인가 + JWT 토큰 + GDPR 컴플라이언스 + 외부 결제사 통신';
const minimalInput = '버튼 색상 변경';

test('analyzeCEO: rawText (정본) 가 7 차원 등급을 산출한다 — 모든 default 아님', () => {
  const result = analyzeCEO({ rawText: securityHeavyInput, feature: 'payment-gdpr' });
  assert.strictEqual(result.feature, 'payment-gdpr');
  assert.strictEqual(result.dimensions.length, DIMENSIONS.length, '7 차원 모두 반환');
  // 보안 키워드 (인증/JWT/GDPR) 가 있는 입력 → security 등급이 default(low) 이상
  const security = result.dimensions.find((d) => d.name === '보안');
  assert.ok(gradeAtLeast(security.grade, 'medium'), `보안 차원 grade=${security.grade} 가 medium 이상이어야 함`);
});

test('analyzeCEO: input (알리아스) 가 rawText 와 동일 결과를 산출한다 — v0.66.1 backward-compat', () => {
  const viaRawText = analyzeCEO({ rawText: securityHeavyInput, feature: 'f' });
  const viaInput = analyzeCEO({ input: securityHeavyInput, feature: 'f' });
  assert.deepStrictEqual(
    viaRawText.dimensions.map((d) => ({ name: d.name, grade: d.grade })),
    viaInput.dimensions.map((d) => ({ name: d.name, grade: d.grade })),
    'rawText 와 input 알리아스가 동일 7 차원 등급 결과를 산출해야 backward-compat 보장',
  );
  assert.deepStrictEqual(viaRawText.activeCLevel, viaInput.activeCLevel);
});

test('analyzeCEO: 입력 누락 (rawText/input 모두 없음) 시에도 crash 없이 default 등급 반환', () => {
  const result = analyzeCEO({ feature: 'no-input' });
  assert.strictEqual(result.feature, 'no-input');
  assert.strictEqual(result.dimensions.length, DIMENSIONS.length);
  // 입력 없으면 모든 차원이 default 등급 — security 가 low 이하여야 함 (휴리스틱 회귀 방지)
  const security = result.dimensions.find((d) => d.name === '보안');
  assert.ok(!gradeAtLeast(security.grade, 'medium'), `입력 없을 때 보안 등급=${security.grade} 가 medium 미만이어야 함`);
});

test('analyzeCEO: activeCLevel 가 artifactPlan 의 owner 들에서 추출된다 (4 primary 한정)', () => {
  const result = analyzeCEO({ rawText: securityHeavyInput, feature: 'f' });
  for (const c of result.activeCLevel) {
    assert.ok(
      ['ceo', 'cpo', 'cto', 'cso'].includes(c),
      `activeCLevel 에는 4 primary (ceo/cpo/cto/cso) 만 포함되어야 함. 발견된 값: ${c}`,
    );
  }
  // 보안 입력 → cso 가 활성화되어야 함 (threat-model artifact 트리거)
  assert.ok(result.activeCLevel.includes('cso'), '보안 입력에는 cso 가 activeCLevel 에 포함되어야 함');
});

test('analyzeCEO: 최소 입력에서도 activeCLevel 가 비지 않는다 (ideation always 박제)', () => {
  const result = analyzeCEO({ rawText: minimalInput, feature: 'f' });
  // 00-ideation always artifact (owner=ceo) → activeCLevel 에 ceo 포함
  assert.ok(result.activeCLevel.includes('ceo'), 'ideation always artifact 로 인해 ceo 가 항상 포함되어야 함');
});

test('gradeAtLeast: GRADE_ORDER 단조성 (low < medium < high)', () => {
  assert.ok(gradeAtLeast('high', 'low'));
  assert.ok(gradeAtLeast('medium', 'low'));
  assert.ok(gradeAtLeast('high', 'medium'));
  assert.ok(!gradeAtLeast('low', 'medium'));
  assert.ok(!gradeAtLeast('medium', 'high'));
  assert.strictEqual(GRADE_ORDER.high > GRADE_ORDER.medium, true);
  assert.strictEqual(GRADE_ORDER.medium > GRADE_ORDER.low, true);
});

test('buildArtifactPlan: PHASE_ARTIFACT_MAPPING 의 always artifact 가 항상 포함된다', () => {
  const grades = analyzeDimensions('');
  const plan = buildArtifactPlan(grades);
  // 반환 = 평탄 배열 of {phase, artifact, owner, agent}
  const ideationAlways = plan.find((a) => a.phase === '00-ideation' && a.artifact === 'ideation-decision');
  assert.ok(ideationAlways, '00-ideation always artifact (ideation-decision) 누락');
  assert.strictEqual(ideationAlways.owner, 'ceo');
  const designAlways = plan.find((a) => a.phase === '02-design' && a.artifact === 'architecture');
  assert.ok(designAlways, '02-design always artifact (architecture) 누락');
  assert.strictEqual(designAlways.owner, 'cto');
});

test('extractActiveCLevel: artifactPlan 의 owner 들이 4 primary 순서로 추출된다', () => {
  const fakeplan = [
    { phase: '00-ideation', artifact: 'a', owner: 'ceo', agent: 'x' },
    { phase: '01-plan', artifact: 'b', owner: 'cpo', agent: 'x' },
    { phase: '01-plan', artifact: 'c', owner: 'cso', agent: 'x' },
    { phase: '02-design', artifact: 'd', owner: 'cto', agent: 'x' },
  ];
  const active = extractActiveCLevel(fakeplan);
  assert.deepStrictEqual(active, ['ceo', 'cpo', 'cto', 'cso'], '4 primary 순서로 활성 C-Level 추출');
});

test('extractActiveCLevel: secondary (cbo/coo) owner 는 제외된다', () => {
  const fakeplan = [
    { phase: '01-plan', artifact: 'a', owner: 'ceo', agent: 'x' },
    { phase: '01-plan', artifact: 'b', owner: 'cbo', agent: 'x' },
    { phase: '01-plan', artifact: 'c', owner: 'coo', agent: 'x' },
  ];
  const active = extractActiveCLevel(fakeplan);
  assert.deepStrictEqual(active, ['ceo'], 'cbo/coo 는 4 primary 가 아니므로 제외');
});
