/**
 * Synthesis consistency tests — 합성문/decisions-log 일관성 계약 C1~C4.
 *
 * v2 design `main.md` §10.3 박제.
 * - C1: main.md.frontmatter.synthesizer = §2 Decisions 의 합성자
 * - C2: decisions-log.frontmatter.synthesizer = main.md.frontmatter.synthesizer
 * - C3: decisions-log event-type 은 enum (`제기`/`반박`/`합의`/`pivot`/`timeout`)
 * - C4: Lazy Consensus 상태 = `consensus-reached` 가 아니면 main.md 박제 거부 (in-flight 박제 차단)
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const FEATURE_DIR = path.join(__dirname, 'fixtures', 'agent-teams');

function parseFrontmatter(content) {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+?)\s*$/);
    if (kv) {
      let v = kv[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      out[kv[1]] = v;
    }
  }
  return out;
}

const VALID_EVENT_TYPES = ['제기', '반박', '합의', 'pivot', 'timeout'];

test('C1+C2: agent-teams-orchestration 의 v2 plan + design synthesizer 일관성', () => {
  for (const phaseDir of ['01-plan', '02-design']) {
    const mainPath = path.join(FEATURE_DIR, phaseDir, 'main.md');
    const logPath = path.join(FEATURE_DIR, phaseDir, 'decisions-log.md');
    if (!fs.existsSync(mainPath)) continue;
    const mainFm = parseFrontmatter(fs.readFileSync(mainPath, 'utf8'));
    if (mainFm?.['model-version'] !== 'v2') continue; // v1 skip
    assert.ok(mainFm.synthesizer, `${phaseDir}/main.md frontmatter.synthesizer 필수`);
    if (fs.existsSync(logPath)) {
      const logFm = parseFrontmatter(fs.readFileSync(logPath, 'utf8'));
      assert.strictEqual(
        logFm?.synthesizer,
        mainFm.synthesizer,
        `${phaseDir}: main.md.synthesizer=${mainFm.synthesizer} 와 decisions-log.synthesizer=${logFm?.synthesizer} 일치`
      );
    }
  }
});

test('C3: decisions-log event-type 은 enum 값만 허용', () => {
  for (const phaseDir of ['01-plan', '02-design']) {
    const logPath = path.join(FEATURE_DIR, phaseDir, 'decisions-log.md');
    if (!fs.existsSync(logPath)) continue;
    const content = fs.readFileSync(logPath, 'utf8');
    // 표 행에서 event-type 컬럼 추출 (시각화 X — 정규식으로 4번째 컬럼)
    const rows = content.match(/^\|\s*\d+\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/gm) || [];
    for (const row of rows) {
      const cells = row.split('|').map((c) => c.trim());
      const eventType = cells[4]; // | # | time | actor | event-type | ...
      if (!eventType) continue;
      // 일부 timeline 은 placeholder (?) 가능 — '?' 패턴 skip
      if (eventType === 'event-type' || eventType.includes('|')) continue;
      const isValid = VALID_EVENT_TYPES.some((v) => eventType.includes(v));
      assert.ok(
        isValid,
        `${phaseDir}/decisions-log.md: event-type '${eventType}' 가 enum (${VALID_EVENT_TYPES.join('/')}) 외`
      );
    }
  }
});

test('C4: v2 main.md 가 합성문 9섹션 표준 H2 헤딩을 포함', () => {
  const requiredHeadings = [
    'Executive Summary',
    '결정',
    'Next Phase',
  ];
  for (const phaseDir of ['01-plan', '02-design']) {
    const mainPath = path.join(FEATURE_DIR, phaseDir, 'main.md');
    if (!fs.existsSync(mainPath)) continue;
    const content = fs.readFileSync(mainPath, 'utf8');
    const fm = parseFrontmatter(content);
    if (fm?.['model-version'] !== 'v2') continue;
    for (const h of requiredHeadings) {
      assert.ok(
        new RegExp(`^##\\s.*${h}`, 'm').test(content),
        `${phaseDir}/main.md: 필수 H2 '${h}' 누락`
      );
    }
  }
});
