#!/usr/bin/env node
/**
 * v0.57.0 — 6 phase 템플릿에 "Topic Documents" + "Scratchpads" 섹션 추가 (idempotent).
 *
 * 대상: templates/{design,do,qa,report,ideation}.template.md (plan 은 수동 처리 완료)
 * 삽입 위치: "## 변경 이력" 헤딩 바로 앞
 *
 * Usage: node scripts/patch-phase-templates-subdoc.js [--dry-run]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');
const TARGETS = [
  { name: 'design.template.md', phaseFolder: '02-design' },
  { name: 'do.template.md', phaseFolder: '03-do' },
  { name: 'qa.template.md', phaseFolder: '04-qa' },
  { name: 'report.template.md', phaseFolder: '05-report' },
  { name: 'ideation.template.md', phaseFolder: '00-ideation' },
];

const BEGIN_MARKER = '<!-- v0.57 subdoc-section begin -->';
const END_MARKER = '<!-- v0.57 subdoc-section end -->';

function buildSection(phaseFolder, isReport) {
  const body = isReport
    ? `\n> Report 는 **main.md 단독** 정책 (\`vais.config.json > workflow.subDocPolicy.reportPhase = "single"\`). Topic Documents / Scratchpads 섹션은 선택 사항.\n`
    : `
> C-Level 이 \`_tmp/*.md\` scratchpad 를 읽고 주제별로 합성한 topic 문서 인덱스. 피처 크기에 따라 선택.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| | \`{topic}.md\` | | |

<!-- Phase 별 권장 topic 프리셋: vais.config.json > workflow.topicPresets.${phaseFolder} -->

## Scratchpads (v0.57+)

> sub-agent 가 작성한 \`_tmp/*.md\` 인벤토리. \`scripts/doc-validator.js\` 가 Author/Phase 헤더 + size 검증.

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| | \`_tmp/{agent-slug}.md\` | | |
`;

  return `${BEGIN_MARKER}

---

## Topic Documents (v0.57+)
${body}
${END_MARKER}

`;
}

const dryRun = process.argv.includes('--dry-run');
let patched = 0, skipped = 0;

for (const t of TARGETS) {
  const filePath = path.join(TEMPLATES_DIR, t.name);
  if (!fs.existsSync(filePath)) {
    process.stderr.write(`[SKIP] not found: ${filePath}\n`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(BEGIN_MARKER)) {
    skipped++;
    continue;
  }

  // "## 변경 이력" 앞에 섹션 삽입
  const changeLogHeading = /\n(---\n\n)?## 변경 이력/;
  if (!changeLogHeading.test(content)) {
    process.stderr.write(`[SKIP] ${t.name}: "## 변경 이력" 헤딩 없음\n`);
    continue;
  }

  const section = buildSection(t.phaseFolder, t.name === 'report.template.md');
  const replaced = content.replace(changeLogHeading, `\n${section}\n---\n\n## 변경 이력`);

  // template version bump (plan template 은 이미 v0.57.0)
  const withVersion = replaced.replace(/<!-- template version: v[\d.]+ -->/, '<!-- template version: v0.57.0 -->');

  if (!dryRun) fs.writeFileSync(filePath, withVersion, 'utf8');
  patched++;
  process.stdout.write(`[patched] ${t.name}\n`);
}

const mode = dryRun ? '[DRY RUN] ' : '';
process.stdout.write(`\n${mode}summary: patched=${patched} skipped=${skipped}\n`);
