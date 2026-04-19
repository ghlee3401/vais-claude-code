#!/usr/bin/env node
/**
 * v0.57.0 — 6 C-Level agent md 에 "Sub-doc 인덱스 포맷 + 큐레이션 기록" 섹션을
 * doc-checklist 와 work-rules 사이에 삽입 (idempotent).
 *
 * Usage: node scripts/patch-clevel-subdoc-section.js [--dry-run]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const C_LEVELS = ['ceo', 'cpo', 'cto', 'cso', 'cbo', 'coo'];
const BEGIN_MARKER = '<!-- @refactor:begin subdoc-index -->';
const END_MARKER = '<!-- @refactor:end subdoc-index -->';
const INSERT_AFTER = '<!-- @refactor:end doc-checklist -->';

const SECTION = `${BEGIN_MARKER}
## Sub-doc 인덱스 포맷 (v0.57+)

**main.md 는 인덱스 + 의사결정만.** sub-agent 상세 분석은 \`_tmp/{agent-slug}.md\` scratchpad 에서 읽고, topic 별 합성은 \`{topic}.md\` 로 분리.

### main.md 필수 섹션 순서

1. Executive Summary (Problem/Solution/Effect/Core Value 표)
2. Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE)
3. Decision Record — 근거 sub-doc/topic 링크 포함
4. **Topic Documents** — C-Level 합성 topic 파일 인덱스 표
5. **Scratchpads** — \`_tmp/*.md\` 인벤토리 표
6. Gate Metrics (해당 phase 만)
7. Next / 변경 이력

### 축약 금지 영역 → topic 또는 \`_tmp/\` 로 이관

- sub-agent 전문 분석 본문 → \`_tmp/{slug}.md\`
- 파일별 diff / code snippet 나열 → \`_tmp/{slug}.md\` 또는 topic 문서
- 화면별 ASCII 와이어프레임 → \`_tmp/ui-designer.md\` 또는 \`ui-flow.md\`
- 60+ 이슈 나열 → \`_tmp/qa-engineer.md\` (main.md 는 \`Critical: N\` / \`Important: M\` 합계만)

### 병렬 쓰기 금지

sub-agent 는 \`_tmp/{slug}.md\` 만 Write. main.md / topic 문서는 C-Level 이 수집 후 단독 편집 (race 방지).

### 큐레이션 기록 (topic 문서 필수)

각 \`{topic}.md\` 하단에 \`## 큐레이션 기록\` 섹션:

| Source (\`_tmp/...\`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|---------------------|:----:|:----:|:----:|:----:|------|

- 필요성 / 누락 / 충돌 C-Level 판단 요약
- \`scripts/doc-validator.js\` 가 \`W-TPC-01\` 경고로 누락 감지 (v0.57 은 warn only)

### topic 프리셋

\`vais.config.json > workflow.topicPresets\` 참조. C-Level 이 필요 시 확장 가능.

### 재실행 (동일 phase 재호출)

기존 topic 문서 + 새 \`_tmp/*.md\` 를 모두 읽고 **diff-merge** (증분 통합). 백업은 git.
${END_MARKER}
`;

const dryRun = process.argv.includes('--dry-run');
let patched = 0, skipped = 0, updated = 0;

for (const cl of C_LEVELS) {
  const filePath = path.join(AGENTS_DIR, cl, `${cl}.md`);
  if (!fs.existsSync(filePath)) {
    process.stderr.write(`[SKIP] not found: ${filePath}\n`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // 이미 있으면 skip (v0.57 이 동일하므로 idempotent)
  if (content.includes(BEGIN_MARKER)) {
    skipped++;
    continue;
  }

  if (!content.includes(INSERT_AFTER)) {
    process.stderr.write(`[SKIP] ${cl}.md: INSERT_AFTER marker not found\n`);
    continue;
  }

  // doc-checklist 끝 뒤 "---" 다음에 섹션 삽입
  const replaced = content.replace(
    INSERT_AFTER,
    `${INSERT_AFTER}\n\n---\n\n${SECTION}`
  );

  if (!dryRun) fs.writeFileSync(filePath, replaced, 'utf8');
  patched++;
  process.stdout.write(`[patched] ${cl}.md\n`);
}

const mode = dryRun ? '[DRY RUN] ' : '';
process.stdout.write(`\n${mode}summary: patched=${patched} skipped=${skipped}\n`);
