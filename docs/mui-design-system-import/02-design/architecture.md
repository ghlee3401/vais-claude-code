---
owner: cto
topic: architecture
phase: design
feature: mui-design-system-import
---

# Architecture — mui-design-system-import (design v2.0)

> Owner: CTO | Phase: design | Date: 2026-05-02 (v2.0 — 런타임 통합 폐기)

## 한 줄 요약 (v2.0)

`scripts/import-mui-design-system.js` + `scripts/import-mui-helpers/{normalize,resolve,emit}.js` 로 단순화. **hook/MCP runner 분기 다이어그램은 v2.0 에서 폐기** (런타임 통합 본 피처 범위 외).

---

## 1. 모듈 의존 그래프 (v2.0 — 단순화)

```
                    [scripts/import-mui-design-system.js]   ← CLI entrypoint (do phase 산출물)
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
   [helpers/fetch-figma]   [helpers/fetch-mui]   [helpers/fetch-overrides]
            │                     │                     │
            └──────────┬──────────┴──────────┬──────────┘
                       ▼                     │
                 [helpers/normalize] ←───────┘
                       │
                       ▼
                 [helpers/resolve]   ← 우선순위 머지 (overrides > figma > mui-npm)
                       │
                       ▼
                 [helpers/emit]      ← MD 카탈로그 + lockfile + CHANGELOG + INDEX
                       │
                       ▼
              [design-system/mui/...] + [design-system/INDEX.md]
```

> v1.0 의 `lib/design-system-router` 모듈 / hook 분기 그래프 / MCP runner 분기 그래프는 **v2.0 에서 폐기**.

### 모듈 별 책임

| 모듈 | 위치 | 책임 |
|------|------|------|
| import-mui-design-system | `scripts/import-mui-design-system.js` | CLI entrypoint, 옵션 파싱, 4-stage 오케스트레이션 |
| fetch-figma | `scripts/import-mui-helpers/fetch-figma.js` | Figma REST API 호출, Paint/Text/Effect Style 추출 |
| fetch-mui | `scripts/import-mui-helpers/fetch-mui.js` | `@mui/material/styles` createTheme() 디폴트 추출 |
| fetch-overrides | `scripts/import-mui-helpers/fetch-overrides.js` | `_overrides.json` 로드 (있으면) |
| normalize | `scripts/import-mui-helpers/normalize.js` | 각 source 를 표준 schema 로 변환 |
| resolve | `scripts/import-mui-helpers/resolve.js` | 우선순위 머지 + confidence score |
| emit | `scripts/import-mui-helpers/emit.js` | MD/lockfile/CHANGELOG/INDEX 쓰기 (atomic) |
| validate | `scripts/import-mui-helpers/validate.js` | Ajv 검증 (lockfile + 토큰 JSON 출력 시) |

> 향후 `nc-design-system-import` 등 후속 피처가 `helpers/` 를 `lib/` 로 격상시킬지는 그때 결정. 본 피처 단독에서는 `scripts/` 하위로 충분.

## 2. 데이터 흐름 (Sequence) — Import 실행

```
사용자                     CLI                      helpers                    design-system/
  │                         │                         │                              │
  │── node scripts/... ────→│                         │                              │
  │                         ├── fetch-figma ─────────→│                              │
  │                         │←──── styles JSON ───────│                              │
  │                         ├── fetch-mui ───────────→│                              │
  │                         │←──── theme JSON ────────│                              │
  │                         ├── fetch-overrides ─────→│                              │
  │                         │←──── overrides ─────────│                              │
  │                         ├── normalize ×3 ────────→│                              │
  │                         │←──── normalized[3] ─────│                              │
  │                         ├── resolve ─────────────→│                              │
  │                         │←──── merged tokens ─────│                              │
  │                         ├── emit (atomic) ───────→│                              │
  │                         │                         │── write mui/MASTER.md ──────→│
  │                         │                         │── write mui/tokens/*.md ────→│
  │                         │                         │── write mui/components/*.md →│
  │                         │                         │── write mui/lockfile.json ──→│
  │                         │                         │── update mui/CHANGELOG.md ──→│
  │                         │                         │── update INDEX.md (mui) ────→│
  │←─── exit 0 + diff ──────│                         │                              │
```

> v1.0 에 있던 "design phase 진입 시 hook → router → ui-designer 컨텍스트 주입" 시퀀스는 **v2.0 에서 폐기**. 본 피처는 1회 CLI 실행이 전부 (사용자가 갱신 필요할 때 재실행).

## 3. 멱등성 검증 (Stage 0)

```
function isInputUnchanged(currentInputs, lastLockfile):
    if not exists(lastLockfile): return false
    last = readJson(lastLockfile)
    return (
        currentInputs.figma.hash === last.inputs.figma.hash AND
        currentInputs.muiNpm.hash === last.inputs.muiNpm.hash AND
        currentInputs.overrides.hash === last.inputs.overrides.hash
    )

if isInputUnchanged(...):
    log("inputs unchanged, skipping emit")
    exit 0
```

`--dry-run` 은 항상 모든 stage 실행 (멱등 검사 무시).

## 4. atomic emit + rollback

emit 단계에서 **임시 디렉토리 (`tmp/ds-emit-{timestamp}/`) 에 모든 파일을 먼저 쓰고**, 모두 성공하면 `rename` 으로 `design-system/mui/` 에 한 번에 이동. 부분 실패 시 임시 디렉토리 삭제 → 원본 미변경 (rollback).

```
1. mkdir tmp/ds-emit-{ts}/
2. write tmp/ds-emit-{ts}/mui/MASTER.md
3. write tmp/ds-emit-{ts}/mui/tokens/*.md
4. write tmp/ds-emit-{ts}/mui/components/*.md
5. write tmp/ds-emit-{ts}/mui/lockfile.json
6. write tmp/ds-emit-{ts}/mui/CHANGELOG.md
7. validate (Ajv lockfile)
8. if all OK:
     rename tmp/ds-emit-{ts}/mui → design-system/mui (atomic)
     update design-system/INDEX.md
   else:
     rm -rf tmp/ds-emit-{ts}/  (silent rollback)
     exit 5
```

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| v1.0 architecture.md (lib/ds-* + hook/MCP 분기) | | ✓ (런타임 분기 부분) | | | (v2.0) 런타임 통합 폐기로 lib/ 격상도 본 피처에서 불필요 |
| v1.0 architecture.md (4-stage seq) | ✓ | | | | 본질 유지, helpers/ 하위로 축소 |
| plan v2.0 §5 에러 처리 | | | | ✓ | atomic emit + rollback 흐름을 §4 에 명시 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-01 | CTO design 초기 작성 (모듈 의존 그래프 + 데이터 흐름 sequence + router 알고리즘 + 멱등성 검증) |
| **v2.0** | **2026-05-02** | **런타임 통합 폐기 — `lib/design-system-router` 모듈 폐기, hook/MCP runner 분기 시퀀스 폐기. 모듈 의존 그래프를 `scripts/` 단독으로 단순화. atomic emit + rollback 흐름을 §4 로 신규 추가.** |
