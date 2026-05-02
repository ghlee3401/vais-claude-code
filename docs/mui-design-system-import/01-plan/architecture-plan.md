---
owner: cto
topic: architecture-plan
phase: plan
feature: mui-design-system-import
---

# Architecture Plan — mui-design-system-import (v2.0)

> Owner: CTO | Phase: plan | Date: 2026-05-02 (v2.0 — 런타임 통합 폐기)

## 한 줄 요약

Figma REST API + MUI npm createTheme → 표준 schema 정규화 → 우선순위 머지 → **MD 카탈로그 + lockfile + CHANGELOG 박제** 4-stage 파이프라인. 런타임 라우팅·hook 주입·MCP adapter 없음.

---

## 1. 4-Stage 파이프라인 (`scripts/import-mui-design-system.js`)

```
[Stage 1: FETCH]      Figma REST API + MUI npm createTheme + _overrides.json (있으면)
                      ↓
[Stage 2: NORMALIZE]  양쪽 입력을 표준 schema 로 정규화
                      ↓
[Stage 3: RESOLVE]    overrides > Figma > MUI npm 우선순위로 머지 + confidence score
                      ↓
[Stage 4: EMIT]       MD 카탈로그 (MASTER + tokens/*.md + components/*.md) + lockfile + CHANGELOG + INDEX 갱신
```

### Stage 1: FETCH

| Source | 입력 | 출력 |
|--------|------|------|
| Figma REST API | `FIGMA_PAT` env + file key | `tmp/figma-styles.json`, `tmp/figma-components.json` |
| MUI npm | `require('@mui/material/styles').createTheme()` | `tmp/mui-defaults.json` |
| overrides (선택) | `design-system/_overrides.json` (있으면) | 그대로 사용 |

> Variables API 미사용 (Enterprise 전용). styles + components 노드의 fills/effects/typography 에서 토큰 역추출.

### Stage 2: NORMALIZE

각 source 를 동일 schema 로 변환:

```json
{
  "color": { "primary.main": { "value": "#1976d2", "source": "figma|mui-npm|override", "confidence": 100 } },
  "typography": { "h1": { "fontFamily": "Roboto", "fontSize": "6rem", ... } },
  "spacing": { "unit": 8, "scale": [0,4,8,16,24,32,48,64] },
  "radius": { "small": 4, "medium": 8 },
  "shadow": { "1": "0px 2px 1px -1px rgba(0,0,0,0.2)..." }
}
```

### Stage 3: RESOLVE (병합 우선순위)

```
_overrides.json (있으면)  →  ALWAYS WIN
        ↓
Figma REST API            →  PREFER (실제 디자인 의도)
        ↓
MUI npm createTheme       →  FALLBACK (안전망)
```

토큰 ID 충돌 시 위 순서. `source` + `confidence` 필드에 출처 기록.

### Stage 4: EMIT (박제)

| 산출물 | 위치 | 갱신 정책 |
|--------|------|---------|
| MD 카탈로그 인덱스 | `design-system/mui/MASTER.md` | 매 실행 갱신 — 토큰/컴포넌트 인덱스 + 출처/라이선스 + 사용 가이드 |
| 토큰 MD | `design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md` | 매 실행 갱신 |
| 컴포넌트 MD | `design-system/mui/components/{button,input,...}.md` (19개) | 매 실행 갱신 |
| (선택) 토큰 JSON | `design-system/mui/tokens/{...}.json` | 후속 빌드 도구 호환용 (v2.0 — 선택) |
| lockfile | `design-system/mui/lockfile.json` | 입력/출력 hash + diff |
| CHANGELOG | `design-system/mui/CHANGELOG.md` | lockfile 변경 시 entry append (Keep a Changelog) |
| INDEX (전역) | `design-system/INDEX.md` | mui entry 추가/갱신 (등록만, 라우팅 X) |

## 2. 디렉토리 컨벤션 (v2.0 — 단일 카탈로그 모델)

```
design-system/
├── INDEX.md                  # 등록된 DS 목록 (사람 읽음). 라우팅 로직 없음
├── _overrides.json (선택)    # 사내 공통 override (DS 무관, 빈 파일로 시작 가능)
│
├── mui/                      # ←── 본 피처가 채우는 DS
│   ├── MASTER.md             # 카탈로그 인덱스 + 사용 가이드
│   ├── tokens/
│   │   ├── color.md
│   │   ├── typography.md
│   │   ├── spacing.md
│   │   ├── radius.md
│   │   └── shadow.md
│   ├── components/
│   │   ├── button.md
│   │   ├── input.md
│   │   ├── ...               # 19개
│   │   └── index.md
│   ├── lockfile.json         # mui DS source-of-truth
│   └── CHANGELOG.md          # mui DS 버전 이력
│
└── nc/                       # 미래 별도 피처 (`nc-design-system-import`)
    └── (same structure as mui/)
```

> v1.1 에 있던 `_active.json` (런타임 라우팅) 은 v2.0 에서 폐기. INDEX.md 가 등록만 담당.

## 3. lockfile 스키마

```json
{
  "$schema": "https://vais.code/schemas/ds-lockfile.v1.json",
  "ds": "mui",
  "version": "1.0.0",
  "generatedAt": "2026-05-02T...",
  "inputs": {
    "figma": { "fileKey": "abc123", "lastModified": "...", "hash": "sha256:..." },
    "muiNpm": { "version": "6.1.7", "hash": "sha256:..." },
    "overrides": { "path": "design-system/_overrides.json", "hash": "sha256:..." }
  },
  "outputs": {
    "tokens": { "color.md": "sha256:...", ... },
    "components": { "button.md": "sha256:...", ... },
    "master": "sha256:..."
  },
  "diff": {
    "tokensChanged": [ ... ],
    "componentsChanged": [],
    "added": [],
    "removed": [],
    "deprecated": []
  }
}
```

## 4. 버전 정책 (SemVer)

| 변경 유형 | 버전 증가 |
|----------|----------|
| 토큰 ID 추가, 컴포넌트 메타 추가 | minor |
| 토큰 값 변경 (사용 코드 영향 없음) | minor |
| 토큰 ID 삭제 / rename | major (alias 로 1 minor 유예) |
| 오타 수정, 메타 보강 | patch |

CHANGELOG entry 자동 생성 — Keep a Changelog 포맷.

## 5. 에러 처리 + 멱등성

| 시나리오 | 동작 |
|---------|------|
| `FIGMA_PAT` 미설정 | `--fallback-mui-only` 자동 활성, MUI npm 만으로 빌드 + WARN |
| Figma API rate limit (429) | exponential backoff (max 3 retry), 실패 시 lockfile 미갱신 |
| 동일 입력 2회 실행 | input hash 매치 → 출력 변경 없음 (멱등) |
| Stage 4 부분 실패 | rollback (lockfile 미갱신, 임시 파일 삭제) |

## 6. 테스트 전략

| 레벨 | 대상 | 위치 |
|------|------|------|
| unit | Stage 2 normalize 함수 | `tests/import-mui/normalize.test.js` |
| unit | Stage 3 resolve 우선순위 | `tests/import-mui/resolve.test.js` |
| unit | Stage 4 emit (atomic + rollback) | `tests/import-mui/emit.test.js` |
| integration | 전체 파이프라인 (mock Figma API) | `tests/import-mui/pipeline.test.js` |
| 멱등성 | 동일 입력 2회 실행 → diff 0 | `tests/import-mui/idempotent.test.js` |

> v1.0 에 있던 "hooks/design-mcp-trigger.js 회귀 테스트" / "ui-designer baseline Read 검증" 은 v2.0 에서 폐기 (런타임 통합 폐기).

## 7. 폐기된 v1.x 결정 (관찰: 후속 피처 후보)

본 피처에서 다루지 않는 항목 — 모두 **후속 피처** 로 분리:

| v1.x 항목 | v2.0 분류 | 후속 피처 후보 |
|----------|-----------|---------------|
| `lib/design-system-router.js` | 후속 | `design-system-runtime-integration` |
| `_active.json` 라우팅 | 후속 | 위와 동일 |
| `hooks/design-mcp-trigger.js` baseline 분기 | 후속 | 위와 동일 |
| `mcp/design-system-server-runner.js` adapter | 후속 | 위와 동일 |
| `vais.config.json > orchestration.designSystem` 키 | 후속 | 위와 동일 |
| ui-designer hookSpecificOutput.additionalContext 주입 | 후속 | 위와 동일 |

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| v1.0/v1.1 architecture-plan.md | | ✓ (3-layer/라우팅 부분) | | | (v2.0) 사용자 의도 재확인 결과 런타임 통합은 본 피처 책임 외 |
| v1.0/v1.1 architecture-plan.md | ✓ (4-stage/lockfile/멱등 부분) | | | | 분석 + 박제 본질은 그대로 유지 |
| 사용자 정정 (2026-05-02) | | | | ✓ | "분석 결과를 design.md 로 만든다" → 카탈로그 박제 = 본 피처 종착점 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-30 | CTO plan 초기 작성 (4-stage 파이프라인 + 2-layer + lockfile 스키마 + 멱등성 + 테스트 전략) |
| v1.1 | 2026-05-01 | multi-DS 채택 — 디렉토리 구조 `{ds}/` 서브폴더, 2-layer→3-layer 모델, `_active.json` 라우팅, MCP indexing이 active DS 한정 |
| **v2.0** | **2026-05-02** | **사용자 의도 재확인 — 런타임 통합 일체 폐기. 3-layer 모델 → 단일 카탈로그 박제 모델. `_active.json` 폐기, hook/MCP 시퀀스 다이어그램 폐기. 4-stage 파이프라인은 유지 + Stage 4 출력을 MD 카탈로그 중심으로 정정. §7 폐기 결정 명시 (관찰: 후속 피처 후보).** |
