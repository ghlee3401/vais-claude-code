---
owner: cto
topic: data-model
phase: design
feature: mui-design-system-import
---

# Data Model — mui-design-system-import (design)

> Owner: CTO | Phase: design | Date: 2026-05-01

## 한 줄 요약 (v2.0)

JSON Schema Draft-07 기반 schema — 토큰 5종 (선택, 사용 시) + lockfile + INDEX entry. **`_active.json` schema 폐기** (런타임 라우팅 폐기). MD 카탈로그 표준 섹션 (§5) 추가 — 사람이 읽는 카탈로그 형식 spec.

---

## 1. 토큰 JSON Schema (5종)

### 공통 wrapper

모든 토큰 파일은 다음 wrapper 를 갖는다:

```json
{
  "$schema": "https://vais.code/schemas/ds-token.v1.json",
  "ds": "mui",
  "version": "1.0.0",
  "generatedAt": "2026-05-01T00:00:00Z",
  "tokens": { ... },
  "aliases": { ... },
  "deprecated": [ ... ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `ds` | string | DS name (디렉토리명과 일치) |
| `version` | string | SemVer |
| `generatedAt` | string (ISO 8601) | 생성 시각 |
| `tokens` | object | 실제 토큰 (각 토큰 파일별 schema) |
| `aliases` | object\<string,string\> | 옛 ID → 새 ID 매핑 (호환) |
| `deprecated` | array\<{id, reason, removeIn}\> | 폐기 예정 토큰 |

### 1.1 `mui/tokens/color.json`

```json
{
  "ds": "mui",
  "version": "1.0.0",
  "tokens": {
    "primary": {
      "main":         { "value": "#1976d2", "source": "figma|mui-npm|override", "confidence": 100 },
      "light":        { "value": "#42a5f5", "source": "...", "confidence": 100 },
      "dark":         { "value": "#1565c0", "source": "...", "confidence": 100 },
      "contrastText": { "value": "#ffffff", "source": "...", "confidence": 100 }
    },
    "secondary":  { "main": ..., "light": ..., "dark": ..., "contrastText": ... },
    "error":      { "main": ..., "light": ..., "dark": ..., "contrastText": ... },
    "warning":    { "main": ..., "light": ..., "dark": ..., "contrastText": ... },
    "info":       { "main": ..., "light": ..., "dark": ..., "contrastText": ... },
    "success":    { "main": ..., "light": ..., "dark": ..., "contrastText": ... },
    "grey":       { "50": ..., "100": ..., ..., "900": ... },
    "text":       { "primary": ..., "secondary": ..., "disabled": ... },
    "background": { "default": ..., "paper": ... },
    "divider":    { "value": "rgba(0,0,0,0.12)", "source": "..." }
  }
}
```

토큰 ID 패턴: `{group}.{variant}` (예: `primary.main`). 각 leaf 는 `{value, source, confidence}` triple.

### 1.2 `mui/tokens/typography.json`

```json
{
  "ds": "mui",
  "tokens": {
    "fontFamily": { "value": "Roboto, 'Helvetica Neue', Arial, sans-serif" },
    "h1":        { "fontFamily": "...", "fontWeight": 300, "fontSize": "6rem", "lineHeight": 1.167, "letterSpacing": "-0.01562em" },
    "h2":        { ... },
    "h3":        { ... },
    "h4":        { ... },
    "h5":        { ... },
    "h6":        { ... },
    "subtitle1": { ... },
    "subtitle2": { ... },
    "body1":     { ... },
    "body2":     { ... },
    "button":    { "textTransform": "uppercase", ... },
    "caption":   { ... },
    "overline":  { "textTransform": "uppercase", ... }
  }
}
```

### 1.3 `mui/tokens/spacing.json`

```json
{
  "ds": "mui",
  "tokens": {
    "unit": 8,
    "scale": [0, 4, 8, 16, 24, 32, 48, 64, 96, 128]
  }
}
```

> MUI 의 `theme.spacing(n) = n * unit` 컨벤션. scale 은 자주 쓰는 값 캐시.

### 1.4 `mui/tokens/radius.json`

```json
{
  "ds": "mui",
  "tokens": {
    "small": 4,
    "medium": 8,
    "large": 12,
    "circle": 9999
  }
}
```

### 1.5 `mui/tokens/shadow.json`

```json
{
  "ds": "mui",
  "tokens": {
    "0": "none",
    "1": "0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)",
    "2": "...",
    "...": "...",
    "24": "..."
  }
}
```

> MUI 의 elevation 0~24 (총 25개).

---

## 2. lockfile schema (`mui/lockfile.json`)

```json
{
  "$schema": "https://vais.code/schemas/ds-lockfile.v1.json",
  "ds": "mui",
  "version": "1.0.0",
  "generatedAt": "2026-05-01T12:00:00Z",
  "generator": {
    "name": "import-mui-design-system",
    "version": "0.1.0",
    "node": "v18.20.0"
  },
  "inputs": {
    "figma": {
      "fileKey": "abc123def",
      "lastModified": "2026-04-25T...",
      "hash": "sha256:..."
    },
    "muiNpm": {
      "package": "@mui/material",
      "version": "6.1.7",
      "hash": "sha256:..."
    },
    "overrides": {
      "path": "design-system/_overrides.json",
      "hash": "sha256:..."
    }
  },
  "outputs": {
    "tokens": {
      "color.json": "sha256:...",
      "typography.json": "sha256:...",
      "spacing.json": "sha256:...",
      "radius.json": "sha256:...",
      "shadow.json": "sha256:..."
    },
    "components": {
      "button.md": "sha256:...",
      "...": "..."
    },
    "master": "sha256:..."
  },
  "diff": {
    "tokensChanged": [
      { "id": "primary.main", "from": "#1565c0", "to": "#1976d2", "source": "figma" }
    ],
    "componentsChanged": [],
    "added": [],
    "removed": [],
    "deprecated": []
  }
}
```

---

## 3. ~~`_active.json` schema~~ (N/A in v2.0)

> **v2.0**: 런타임 라우팅 폐기로 `_active.json` 자체가 본 피처 범위 외. 후속 피처 (`design-system-runtime-integration`) 에서 다시 schema 정의.

<details><summary>v1.0 원문 (참고용)</summary>

### v1.0 schema (보존, 사용 X)

```json
{
  "$schema": "https://vais.code/schemas/ds-active.v1.json",
  "default": "mui",
  "perFeature": {
    "internal-admin-dashboard": "nc",
    "public-landing-page": "mui"
  },
  "lastValidated": "2026-05-01T12:00:00Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `default` | string (DS name) | ✅ | 기본 DS — 모든 피처가 이걸로 fallback |
| `perFeature` | object\<feature, ds\> | ❌ | 피처별 명시적 DS 매핑 |
| `lastValidated` | ISO 8601 | ❌ | 마지막 무결성 검증 시각 |

**검증 규칙**: `default` + `perFeature` 의 모든 ds 값은 `design-system/{ds}/` 디렉토리에 대응되어야 함. 없으면 router 가 ERROR.

</details>

---

## 4. INDEX.md schema (등록 entry, v2.0)

`design-system/INDEX.md` 는 사람이 읽는 MD 인덱스. 각 entry 형식:

```markdown
## mui

| Key | Value |
|-----|-------|
| Source | Material UI for Figma (Community) + @mui/material npm |
| License | Apache-2.0 (MUI) + Figma Community |
| Version | 1.0.0 |
| Lockfile | `mui/lockfile.json` |
| MASTER | `mui/MASTER.md` |
| Last Imported | 2026-05-01 |
| Importer | `scripts/import-mui-design-system.js` |
```

~~router 는 INDEX.md 의 H2 헤더 (`## {ds-name}`) 를 파싱해 등록 DS 목록 추출.~~ (v2.0: router 폐기) → INDEX.md 는 **사람이 읽는 인덱스만**. ds-emit 이 H2 entry 를 멱등 추가/갱신 (`## mui` → 표 갱신, 다른 DS entry 는 건드리지 않음).

---

## 5. 컴포넌트 메타 schema (`mui/components/{name}.md`)

frontmatter (선택, ds-emit 이 자동 생성):

```yaml
---
ds: mui
component: button
version: 1.0.0
muiSource: '@mui/material/Button'
figmaNode: 'Components / Button'
---
```

본문 표준 섹션:

```markdown
# Button (MUI)

## Anatomy
[ Icon? | Label | Icon? ]

## Variants
| Variant | Description | Token reference |
|---------|-------------|-----------------|
| text | borderless, low emphasis | color.primary.main |
| outlined | bordered | color.primary.main + radius.small |
| contained | filled, high emphasis | color.primary.main + shadow.2 |

## Sizes
| Size | height | padding | typography |
|------|--------|---------|-----------|
| small | 30 | 4 8 | button (font-size 0.8125rem) |
| medium | 36 | 6 16 | button (font-size 0.875rem) |
| large | 42 | 8 22 | button (font-size 0.9375rem) |

## States
default | hover | active | disabled | focus-visible

## Accessibility
- role="button"
- keyboard: Enter/Space
- aria-disabled when disabled
- focus-visible outline must use color.primary.main

## Usage Example
[코드 스니펫 또는 ASCII]
```

---

## 6. Ajv 검증 entrypoint

```javascript
// lib/ds-validate.js (새 모듈)
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

function validateTokenFile(path) {
  const schema = require(`./schemas/ds-token.v1.json`);
  const data = JSON.parse(fs.readFileSync(path));
  return ajv.compile(schema)(data);
}

function validateLockfile(path) { ... }
function validateActiveJson(path) { ... }
```

`ds-emit` 호출 시 매번 검증, 실패하면 emit 중단 (atomic).

---

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| plan/architecture-plan.md §3 lockfile | ✓ | | | | design에서 lockfile 스키마를 정식 schema 로 승격 |
| plan/architecture-plan.md Stage 4 | | | ✓ | | source/confidence triple 을 토큰 leaf 표준으로 확정 |
| MUI npm createTheme 디폴트 | | | | ✓ | typography/shadow 25개 elevation 등 MUI 표준 그대로 채택 |
| Style Dictionary 호환 | | ✓ | | | 본 phase 에서는 직접 호환 표기 안 함 (toolchain 추가 의존 회피). 토큰 schema 가 호환 가능한 구조이지만 명시적 도입은 후속 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-01 | CTO design 초기 작성 (5종 토큰 schema + lockfile + _active.json + INDEX entry + 컴포넌트 메타 + Ajv 검증 entrypoint) |
| **v2.0** | **2026-05-02** | **`_active.json` schema 폐기 (런타임 라우팅 폐기) — `<details>` 로 보존. INDEX.md 는 "사람이 읽는 인덱스" 로 단순화 (router 파싱 폐기). 토큰 schema 와 컴포넌트 메타 schema 는 v1.0 그대로 유지 (박제 산출물의 형식). 한 줄 요약을 v2.0 으로 갱신.** |
