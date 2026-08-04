---
owner: cto
artifact: import-script-spec
phase: design
feature: design-system-rethink
---

# Import Script Spec — scripts/import-awesome-design-md.js

## CLI 시그니처

```bash
node scripts/import-awesome-design-md.js [options]

Options:
  --source <path>     소스 디렉토리 경로 (default: ../references/awesome-design-md)
  --brands <slugs>    박제할 brand slug 쉼표 구분 (e.g. claude,linear,stripe)
  --all               71 brand 모두 박제 (R1 주의 — repo size ~4.7M 증가)
  --pre-bake          vais.config.json > designSystem.preBakedBrands 일괄 박제
  --dry-run           실제 박제 안 하고 plan만 출력
  --force             기존 DESIGN.md 덮어쓰기 (default: skip if exists)
  --regen-index       INDEX.md만 재생성 (박제 없음)
  --help              도움말
```

## 동작 사양

### 1. 소스 검증

```javascript
const sourceRoot = args.source || path.resolve(process.cwd(), '../references/awesome-design-md');
const designMdRoot = path.join(sourceRoot, 'design-md');
const licensePath = path.join(sourceRoot, 'LICENSE');
const readmePath = path.join(sourceRoot, 'README.md');

if (!fs.existsSync(designMdRoot)) {
  console.error(`소스 미확보: ${designMdRoot}`);
  console.error('git clone https://github.com/VoltAgent/awesome-design-md ../references/awesome-design-md');
  process.exit(1);
}
```

### 2. Brand 박제 (per slug)

```javascript
function importBrand(originalFolder) {
  const slug = normalizeSlug(originalFolder);  // linear.app → linear
  const src = path.join(designMdRoot, originalFolder, 'DESIGN.md');
  const dstDir = path.join('design-system/brands', slug);
  const dst = path.join(dstDir, 'DESIGN.md');

  if (!fs.existsSync(src)) throw new Error(`source missing: ${src}`);

  fs.mkdirSync(dstDir, { recursive: true });

  if (fs.existsSync(dst) && !args.force) {
    log.skip(`${slug} (already baked)`);
    return { slug, status: 'skipped' };
  }

  // DESIGN.md 박제 + attribution 헤더 prepend
  const original = fs.readFileSync(src, 'utf-8');
  const withAttribution = prependAttribution(original, originalFolder);
  fs.writeFileSync(dst, withAttribution);

  return { slug, status: 'baked', originalFolder };
}
```

### 3. Attribution 헤더 (DESIGN.md prepend)

```markdown
<!--
Source: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/{originalFolder}/DESIGN.md
License: MIT (VoltAgent, 2026) — see design-system/brands/LICENSE.md
Imported: 2026-05-23 (vais-code scripts/import-awesome-design-md.js)
-->

{원본 DESIGN.md content}
```

### 4. INDEX.md 자동 생성

```javascript
function regenIndex() {
  const upstreamReadme = parseUpstreamReadme(readmePath);  // 8 카테고리 + brand 메타
  const bakedSlugs = listBakedBrands();  // lib/brand-validator.js
  const content = renderIndex({ categories: upstreamReadme.categories, bakedSlugs });
  fs.writeFileSync('design-system/brands/INDEX.md', content);
}
```

### 5. LICENSE 박제 (1회만)

```javascript
function ensureLicense() {
  const dst = 'design-system/brands/LICENSE.md';
  if (fs.existsSync(dst)) return;
  const license = fs.readFileSync(licensePath, 'utf-8');
  const content = `# Brand DESIGN.md License\n\n> Source: https://github.com/VoltAgent/awesome-design-md\n\n${license}`;
  fs.writeFileSync(dst, content);
}
```

## Slug 정규화 함수

```javascript
function normalizeSlug(folder) {
  return folder
    .toLowerCase()
    .replace(/\.(app|ai|com|io|dev)$/, '')  // tld 제거
    .replace(/\./g, '-')                     // 나머지 . → -
    .replace(/[^a-z0-9-]/g, '-')             // 안전 문자만
    .replace(/-+/g, '-')                     // 연속 - 압축
    .replace(/^-|-$/g, '');                  // leading/trailing - 제거
}
```

### 정규화 테이블 (검증용)

| 입력 (folder) | 출력 (slug) |
|--------------|------------|
| `claude` | `claude` |
| `linear.app` | `linear` |
| `mistral.ai` | `mistral` |
| `opencode.ai` | `opencode` |
| `together.ai` | `together` |
| `x.ai` | `xai` |
| `bmw-m` | `bmw-m` |
| `theverge` | `theverge` |

## Upstream README 파싱 (8 카테고리 추출)

```javascript
function parseUpstreamReadme(readmePath) {
  const md = fs.readFileSync(readmePath, 'utf-8');
  const categories = [];
  let current = null;
  for (const line of md.split('\n')) {
    const cat = line.match(/^### (.+)$/);
    if (cat) {
      current = { name: cat[1].trim(), brands: [] };
      categories.push(current);
      continue;
    }
    const brand = line.match(/^- \[\*\*(.+?)\*\*\]\((https?:\/\/[^\)]+)\)\s*-\s*(.+)$/);
    if (brand && current) {
      const [, displayName, url, description] = brand;
      const slugFromUrl = url.match(/getdesign\.md\/([^\/]+)\//)?.[1];
      if (slugFromUrl) {
        current.brands.push({
          displayName,
          originalFolder: slugFromUrl,
          slug: normalizeSlug(slugFromUrl),
          sourceUrl: url,
          description: description.trim(),
        });
      }
    }
  }
  return { categories };
}
```

> 파싱 실패 시 fallback: `design-md/` 디렉토리 list + "Uncategorized" 섹션에 dump (사용자가 수동 분류 가능).

## 멱등성 (idempotency) 보장

| 시나리오 | 동작 |
|---------|------|
| 같은 brand 2번 박제 (--force 없음) | `skipped` 표시, no-op |
| 같은 brand 2번 박제 (--force) | 덮어쓰기, INDEX.md 재생성 |
| INDEX.md만 재생성 (`--regen-index`) | 박제 없이 INDEX.md만 갱신 |
| 미박제 brand가 INDEX.md에 ⬜로 표시 | regen 시 자동 ⬜→✅ 갱신 |
| LICENSE.md 이미 존재 | skip |

## 출력 예시

```
$ node scripts/import-awesome-design-md.js --brands claude,linear,stripe

[import-awesome-design-md] source: /Users/ghlee/workspace/references/awesome-design-md
[bake] claude       → design-system/brands/claude/DESIGN.md (543 lines)
[bake] linear.app   → design-system/brands/linear/DESIGN.md (612 lines)  [slug: linear ← linear.app]
[bake] stripe       → design-system/brands/stripe/DESIGN.md (498 lines)
[index] regenerated: design-system/brands/INDEX.md (8 categories, 71 brands, 3 baked)
[license] design-system/brands/LICENSE.md (already exists)

✅ 3 brands baked. Run /vais cto design {feature} and select one in AskUserQuestion.
```

## 테스트 케이스

| ID | 케이스 | 기대 |
|----|--------|------|
| T1 | `--brands claude` 첫 박제 | `design-system/brands/claude/DESIGN.md` 생성 + INDEX.md ✅ |
| T2 | `--brands claude` 재실행 | skipped, INDEX.md unchanged |
| T3 | `--brands claude --force` | 덮어쓰기 + INDEX.md 재생성 |
| T4 | `--brands linear.app` (원본 경로) | slug `linear`로 정규화, `design-system/brands/linear/` 생성 |
| T5 | `--source ./does-not-exist` | exit 1 + git clone 가이드 |
| T6 | `--pre-bake` (config 5 brand) | 5개 일괄 박제 |
| T7 | `--all` | 71개 박제 + INDEX.md 모두 ✅ |
| T8 | `--regen-index` | DESIGN.md 변경 없음, INDEX.md만 재생성 |
| T9 | upstream README 파싱 실패 | "Uncategorized" 섹션으로 fallback |
| T10 | `--dry-run` | 박제 안 하고 plan 출력만 |

## 의존성

- Node 18+ (lib/status.js, lib/brand-validator.js 와 동일)
- 외부 패키지 없음 (fs, path만 사용)
- vais.config.json (preBakedBrands 읽기)

## CTO 검토 노트

- **파싱 fragility**: upstream README 포맷 변경 시 카테고리 추출 실패 → fallback "Uncategorized" 안전망. CHANGELOG에 import 날짜 기록으로 회귀 추적.
- **slug 정규화 backward-compat**: v1.1.0 첫 박제 후 정규화 규칙 변경 시 기존 박제와 불일치 발생 — 규칙 변경은 minor bump + INDEX migration script 필요. v1.x 동안 정규화 규칙 고정.
- **`--all` 성능**: 71 × ~540 line × 파일 I/O ≈ 2초 (단순 read/write). gitignore 후보 검토 (R1 회피) — 박제본은 git에 포함 (재현성 위해), 단 `--all`은 사용자 명시 선택.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — CLI 시그니처 + 동작 사양 5 단계 + slug 정규화 + INDEX 자동생성 + 10 테스트 케이스 |
