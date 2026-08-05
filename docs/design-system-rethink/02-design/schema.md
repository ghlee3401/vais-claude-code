---
owner: cto
artifact: schema
phase: design
feature: design-system-rethink
---

# Schema — status.json + INDEX.md + vais.config.json

## status.json 확장

### features.{feature}.brand 필드

```json
{
  "features": {
    "some-feature": {
      "createdAt": "2026-05-23T00:00:00.000Z",
      "currentPhase": "design",
      "brand": "claude",
      "phases": { ... },
      "rolePhases": { ... }
    }
  }
}
```

| 속성 | 값 |
|------|-----|
| 키 | `brand` |
| 타입 | string \| null |
| 형식 | kebab-case slug (DESIGN.md 폴더명 기준, `.` → `-` 정규화) |
| 검증 | `design-system/brands/INDEX.md` 의 enum 또는 71 slug 화이트리스트 |
| Optional | 예 (legacy features는 null) |
| 기본값 | null (미선택 = hook이 AskUserQuestion 유도) |

### Slug 정규화 규칙

| 원본 폴더명 | 정규화 slug |
|-------------|------------|
| `linear.app` | `linear` |
| `mistral.ai` | `mistral` |
| `opencode.ai` | `opencode` |
| `together.ai` | `together` |
| `x.ai` | `xai` |
| `bmw-m` | `bmw-m` (그대로) |
| `theverge` | `theverge` (그대로) |

규칙: `.{tld}$` 제거, `.` → `-` 변환, lowercase 유지.

INDEX.md에 양방향 매핑 (`originalPath: design-md/linear.app` ↔ `slug: linear`) 기록.

### lib/status.js 헬퍼

```javascript
function getBrand(feature) {
  const status = readStatus();
  return status?.features?.[feature]?.brand || null;
}

function setBrand(feature, slug) {
  const status = readStatus();
  if (!status.features[feature]) {
    status.features[feature] = { createdAt: new Date().toISOString(), phases: {}, rolePhases: {} };
  }
  status.features[feature].brand = slug;
  writeStatus(status);
}
```

## design-system/brands/INDEX.md 자동 생성 규칙

`scripts/import-awesome-design-md.js`가 박제 후 INDEX.md를 재생성.

### 포맷 (대표 섹션 예시)

```markdown
# Design System — Brands

> **Source**: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT, 2026)
> **Format**: Google Stitch DESIGN.md
> **Total**: 71 brands across 8 categories

**Baked** (this repo): 5 / 71 — claude, linear, stripe, vercel, notion
**Lazy** (on-demand): 66 — run `node scripts/import-awesome-design-md.js --brands <slug>` to bake.

---

## AI & LLM Platforms (12)

| Slug | Brand | 톤 한 줄 | Baked | Source |
|------|-------|----------|:-----:|--------|
| claude | Claude | Warm cream + coral, editorial serif | ✅ | [URL](https://getdesign.md/claude/design-md) |
| cohere | Cohere | Vibrant gradients, dashboard | ⬜ | [URL](https://getdesign.md/cohere/design-md) |
| ... | ... | ... | ... | ... |

## Developer Tools & IDEs (7)

| Slug | Brand | 톤 한 줄 | Baked | Source |
|------|-------|----------|:-----:|--------|
| cursor | Cursor | Sleek dark + gradient | ⬜ | ... |
| vercel | Vercel | Black/white precision, Geist | ✅ | ... |
| ... | ... | ... | ... | ... |
```

### 8 카테고리 (upstream README 그대로)

1. AI & LLM Platforms (12)
2. Developer Tools & IDEs (7)
3. Backend, Database & DevOps (?)
4. Productivity & Collaboration (?)
5. Design & Creative (?)
6. Fintech & Crypto (?)
7. Ecommerce & Retail (?)
8. Media, Auto & Lifestyle (?)

(정확한 개수는 do phase에서 upstream README 파싱으로 확정)

### 생성 트리거

```
scripts/import-awesome-design-md.js --brands claude
  ↓
1. design-md/claude/DESIGN.md → design-system/brands/claude/DESIGN.md 박제
2. design-system/brands/INDEX.md 재생성 (Baked 컬럼 ✅ 업데이트)
3. design-system/brands/LICENSE.md 확보 (1회만)
4. CHANGELOG.md (옵션) — import 날짜 기록
```

## vais.config.json 확장

### 신규 designSystem 섹션

```json
{
  "designSystem": {
    "model": "brand-first",
    "brandRoot": "design-system/brands",
    "defaultBrand": null,
    "preBakedBrands": ["claude", "linear", "stripe", "vercel", "notion"],
    "categorySource": "upstream",
    "selectionStrategy": "askuserquestion-2step",
    "blockOnMissingBrand": true
  }
}
```

| 키 | 타입 | 기본 | 설명 |
|----|-----|------|------|
| `model` | string | `"brand-first"` | 향후 `mui-first` 등 모델 분기 |
| `brandRoot` | string | `"design-system/brands"` | brand 박제 디렉토리 |
| `defaultBrand` | string \| null | null | hook 미선택 시 fallback. CI 환경 권장 |
| `preBakedBrands` | string[] | `["claude","linear","stripe","vercel","notion"]` | repo 사전 박제 brand 목록 |
| `categorySource` | enum | `"upstream"` | INDEX 카테고리 출처. v1.x는 upstream 고정 |
| `selectionStrategy` | enum | `"askuserquestion-2step"` | 선택 UI. 향후 검색형/외부 picker 추가 가능 |
| `blockOnMissingBrand` | bool | true | false면 missing brand도 warn 후 진행 |

### 기존 orchestration.mcp 정책 변경

`orchestration.mcp.enabled` 유지하되 의미 확장:
- `true` (기본): ui-ux-pro-max heuristics search 호출 (design start + qa)
- `false`: heuristics search 생략 (brand DESIGN.md만 prepend)

mui-related 키 (`runGenerate`, `hasMasterDoc`) 제거 — `lib/mcp-validator.js` deprecate와 동기화.

## 마이그레이션 시나리오

| 기존 feature 상태 | 마이그레이션 |
|------------------|-------------|
| `features.X.brand` 키 없음 + design 미완료 | hook이 다음 design 진입 시 AskUserQuestion 유도 |
| `features.X.brand` 키 없음 + design 완료 | historical로 유지. 재진입 시만 brand 선택 |
| 기존 `design-system/mui/MASTER.md` 참조 산출물 | historical 유지 (소급 변경 금지). 재생성 시 brand 모델 적용 |

## CTO 검토 노트

- **slug 정규화** — `.app/.ai` tld는 시각적 노이즈 + status.json 키로 부적합. 정규화 규칙은 idempotent (이미 정규화된 slug는 unchanged).
- **defaultBrand null vs "claude"** — null 채택. CI 자동화는 환경변수 `VAIS_DEFAULT_BRAND` 또는 config 명시. brand-first 정신상 "선택 없이 진행"은 첫 사용자가 한 번은 의식적으로 결정해야 함.
- **preBakedBrands hard-coded vs config** — config 채택. 사용자가 다른 5개 선호하면 자유. 단, `node scripts/import-awesome-design-md.js --pre-bake` 명령으로 일괄 박제.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — status.json brand 필드 + slug 정규화 + INDEX.md 자동 생성 + vais.config.json designSystem 섹션 + 마이그레이션 |
