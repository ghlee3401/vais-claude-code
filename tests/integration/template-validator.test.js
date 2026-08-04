'use strict';

/**
 * VAIS Code — Template Validator 통합 테스트
 *
 * 테스트 케이스:
 *   TV-01 유효한 frontmatter → valid=true
 *   TV-02 필수 필드 누락 (artifact 없음) → valid=false
 *   TV-03 policy enum 위반 → valid=false
 *   TV-04 execution 필드 없음 → valid=false
 *   TV-05 --depth-check: 3섹션 모두 있음 → depthResult 모두 true
 *   TV-06 --depth-check: sample 섹션 짧음 → depthResult.sample=false
 *   TV-07 --depth-check: checklist 항목 부족 → depthResult.checklist=false
 *   TV-08 --depth-check: anti-pattern 없음 → depthResult.antipattern=false
 *
 * @see docs/subagent-architecture-rethink/02-design/technical-architecture-design.md 섹션 3
 * @see https://nodejs.org/api/test.html
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  validateTemplateFile,
  checkDepthC,
  REQUIRED_FIELDS,
  VALID_POLICIES,
  MIN_CHECKLIST_ITEMS,
  MIN_ANTIPATTERN_ITEMS,
  MIN_SAMPLE_LENGTH,
} = require('../../scripts/template-validator');

// ── 테스트용 임시 파일 유틸 ──────────────────────────────────

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-tv-test-'));
});

after(() => {
  // 임시 디렉토리 정리
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
});

/**
 * 임시 .md 파일 생성.
 * @param {string} name     - 파일명 (확장자 없이)
 * @param {string} content  - 파일 전체 내용 (frontmatter 포함)
 * @returns {string}        - 절대 경로
 */
function createTempMd(name, content) {
  const filePath = path.join(tmpDir, `${name}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ── 유효한 frontmatter 픽스처 ─────────────────────────────────

const VALID_FRONTMATTER = `---
artifact: lean-canvas
owner_agent: product-strategist
phase: what
canon_source: "Maurya 'Running Lean'"
execution:
  policy: user-select
  scope_conditions: []
  intent: business-model-design
  review_recommended: false
template_depth: stub
project_context_reason: "What 단계 BM 결정의 1차 산출물"
---

# Lean Canvas

본문 내용
`;

// ── TV-01: 유효한 frontmatter → valid=true ──

describe('TV-01: 유효한 frontmatter', () => {
  it('모든 필수 필드 존재 + 유효한 policy → valid=true', () => {
    const filePath = createTempMd('tv-01-valid', VALID_FRONTMATTER);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, true, `valid=true 기대 — errors: ${JSON.stringify(result.errors)}`);
    assert.deepStrictEqual(result.errors, [], 'errors 없음');
  });
});

// ── TV-02: 필수 필드 누락 (artifact 없음) → valid=false ──

describe('TV-02: artifact 필드 누락', () => {
  it('artifact 없으면 valid=false, errors에 artifact 포함', () => {
    const content = `---
owner_agent: product-strategist
phase: what
canon_source: "Maurya"
execution:
  policy: user-select
---

본문
`;
    const filePath = createTempMd('tv-02-no-artifact', content);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes('"artifact"')),
      `errors 에 artifact 포함 — ${JSON.stringify(result.errors)}`
    );
  });

  it('canon_source 없으면 valid=false', () => {
    const content = `---
artifact: test-artifact
owner_agent: test-agent
phase: what
execution:
  policy: always
---

본문
`;
    const filePath = createTempMd('tv-02-no-canon', content);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"canon_source"')));
  });
});

// ── TV-03: policy enum 위반 → valid=false ──

describe('TV-03: policy enum 위반', () => {
  it('policy = "invalid-policy" → valid=false', () => {
    const content = `---
artifact: test-artifact
owner_agent: test-agent
phase: what
canon_source: "Test Source"
execution:
  policy: invalid-policy
---

본문
`;
    const filePath = createTempMd('tv-03-bad-policy', content);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes('policy') && e.includes('invalid-policy')),
      `policy enum 오류 포함 — ${JSON.stringify(result.errors)}`
    );
  });

  it('유효한 policy 4개 → valid=true', () => {
    for (const policy of VALID_POLICIES) {
      const content = `---
artifact: test-${policy}
owner_agent: test-agent
phase: core
canon_source: "Test"
execution:
  policy: ${policy}
---

본문
`;
      const filePath = createTempMd(`tv-03-valid-${policy}`, content);
      const result = validateTemplateFile(filePath);
      assert.strictEqual(result.valid, true, `policy="${policy}" 은 유효 — errors: ${JSON.stringify(result.errors)}`);
    }
  });
});

// ── TV-04: execution 필드 없음 → valid=false ──

describe('TV-04: execution 필드 누락', () => {
  it('execution 없으면 valid=false', () => {
    const content = `---
artifact: test-artifact
owner_agent: test-agent
phase: what
canon_source: "Test"
---

본문
`;
    const filePath = createTempMd('tv-04-no-execution', content);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes('"execution"')),
      `execution 누락 오류 포함 — ${JSON.stringify(result.errors)}`
    );
  });

  it('execution.policy 없으면 valid=false', () => {
    const content = `---
artifact: test-artifact
owner_agent: test-agent
phase: what
canon_source: "Test"
execution:
  intent: market-analysis
---

본문
`;
    const filePath = createTempMd('tv-04-no-policy', content);
    const result = validateTemplateFile(filePath);

    assert.strictEqual(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes('execution.policy')),
      `execution.policy 누락 오류 포함 — ${JSON.stringify(result.errors)}`
    );
  });
});

// ── TV-05: depth-check — 3섹션 모두 충족 → pass ──

describe('TV-05: depth-check 3섹션 모두 충족', () => {
  it('sample 100자+ + checklist 5개+ + anti-pattern 3개+ → depthResult 모두 true', () => {
    // 100자 이상 샘플 텍스트 생성
    const sampleText = 'A'.repeat(MIN_SAMPLE_LENGTH + 50);

    // checklist 항목 생성 (MIN_CHECKLIST_ITEMS 개)
    const checklistItems = Array.from(
      { length: MIN_CHECKLIST_ITEMS },
      (_, i) => `- [ ] 체크리스트 항목 ${i + 1}`
    ).join('\n');

    // anti-pattern 항목 생성 (MIN_ANTIPATTERN_ITEMS 개)
    const antiItems = Array.from(
      { length: MIN_ANTIPATTERN_ITEMS },
      (_, i) => `- Anti-pattern 항목 ${i + 1}: 설명`
    ).join('\n');

    const content = `
## (작성된 sample)

${sampleText}

## 작성 체크리스트

${checklistItems}

## ⚠ Anti-pattern

${antiItems}
`;

    const result = checkDepthC(content);

    assert.strictEqual(result.sample, true, `sample 섹션 통과 (${result.sampleLength}자)`);
    assert.strictEqual(result.checklist, true, `checklist ${result.checklistCount}개 통과`);
    assert.strictEqual(result.antipattern, true, `anti-pattern ${result.antipatternCount}개 통과`);
  });
});

// ── TV-06: depth-check — sample 섹션 짧음 ──

describe('TV-06: depth-check sample 미달', () => {
  it('sample 섹션 내용 10자 → depthResult.sample=false', () => {
    const content = `
## (작성된 sample)

짧은내용

## 작성 체크리스트

- [ ] 항목1
- [ ] 항목2
- [ ] 항목3
- [ ] 항목4
- [ ] 항목5

## ⚠ Anti-pattern

- Anti1
- Anti2
- Anti3
`;

    const result = checkDepthC(content);
    assert.strictEqual(result.sample, false, `sample ${result.sampleLength}자 < ${MIN_SAMPLE_LENGTH}자 → false`);
  });
});

// ── TV-07: depth-check — checklist 항목 부족 ──

describe('TV-07: depth-check checklist 항목 부족', () => {
  it('checklist 2개 → depthResult.checklist=false', () => {
    const sampleText = 'B'.repeat(MIN_SAMPLE_LENGTH + 10);

    const content = `
## (작성된 sample)

${sampleText}

## 작성 체크리스트

- [ ] 항목1
- [ ] 항목2

## ⚠ Anti-pattern

- Anti1
- Anti2
- Anti3
`;

    const result = checkDepthC(content);
    assert.strictEqual(result.checklist, false, `checklist ${result.checklistCount}개 < ${MIN_CHECKLIST_ITEMS}개 → false`);
    assert.strictEqual(result.checklistCount, 2, '실제 체크리스트 항목 수 = 2');
  });
});

// ── TV-08: depth-check — anti-pattern 없음 ──

describe('TV-08: depth-check anti-pattern 없음', () => {
  it('anti-pattern 섹션 없음 → depthResult.antipattern=false', () => {
    const sampleText = 'C'.repeat(MIN_SAMPLE_LENGTH + 10);
    const checklistItems = Array.from(
      { length: MIN_CHECKLIST_ITEMS },
      (_, i) => `- [ ] 항목 ${i + 1}`
    ).join('\n');

    const content = `
## (작성된 sample)

${sampleText}

## 작성 체크리스트

${checklistItems}

## 다른 섹션 (Anti-pattern 아님)

내용
`;

    const result = checkDepthC(content);
    assert.strictEqual(result.antipattern, false, 'Anti-pattern 섹션 없음 → false');
    assert.strictEqual(result.antipatternCount, 0);
  });

  it('anti-pattern 1개만 → depthResult.antipattern=false', () => {
    const sampleText = 'D'.repeat(MIN_SAMPLE_LENGTH + 10);
    const checklistItems = Array.from(
      { length: MIN_CHECKLIST_ITEMS },
      (_, i) => `- [ ] 항목 ${i + 1}`
    ).join('\n');

    const content = `
## (작성된 sample)

${sampleText}

## 작성 체크리스트

${checklistItems}

## ⚠ Anti-pattern

- 하나만 있음
`;

    const result = checkDepthC(content);
    assert.strictEqual(result.antipattern, false, `1개 < ${MIN_ANTIPATTERN_ITEMS}개 → false`);
  });
});

// ── 상수 노출 검증 ──

describe('모듈 상수 export 검증', () => {
  it('REQUIRED_FIELDS 에 5개 필드 포함', () => {
    const expected = ['artifact', 'owner_agent', 'phase', 'canon_source', 'execution'];
    for (const f of expected) {
      assert.ok(REQUIRED_FIELDS.includes(f), `REQUIRED_FIELDS 에 "${f}" 포함`);
    }
  });

  it('VALID_POLICIES 에 4개 값 포함', () => {
    const expected = ['always', 'scope', 'user-select', 'triggered'];
    assert.deepStrictEqual(
      VALID_POLICIES.slice().sort(),
      expected.slice().sort(),
      'VALID_POLICIES 4개 일치'
    );
  });

  it('MIN_CHECKLIST_ITEMS = 5', () => {
    assert.strictEqual(MIN_CHECKLIST_ITEMS, 5);
  });

  it('MIN_ANTIPATTERN_ITEMS = 3', () => {
    assert.strictEqual(MIN_ANTIPATTERN_ITEMS, 3);
  });

  it('MIN_SAMPLE_LENGTH = 100', () => {
    assert.strictEqual(MIN_SAMPLE_LENGTH, 100);
  });
});
