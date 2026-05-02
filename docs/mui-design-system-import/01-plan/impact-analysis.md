---
owner: cto
topic: impact-analysis
phase: plan
feature: mui-design-system-import
---

# Impact Analysis — mui-design-system-import (v2.0)

> Owner: CTO | Phase: plan | Date: 2026-05-02 (v2.0 — 런타임 통합 폐기)

## 한 줄 요약

**v2.0 정정**: 본 피처는 디자인 시스템 카탈로그 **박제**만 담당. 변경 영향 범위 매우 좁음 — 신규 자원 12개 (모두 `design-system/mui/` 또는 `scripts/`) + 수정 자원 3개 (`agents/cto/ui-designer.md` 1줄 + `.env.example` + `package.json`).

---

## 변경 자원 상세

### 1. 신규 생성 (모두 새 디렉토리/파일)

| 자원 | 타입 | 책임 |
|------|------|------|
| `design-system/INDEX.md` | 파일 (md) | 등록된 DS 목록 (사람 읽음, 라우팅 없음) |
| `design-system/_overrides.json` | 파일 (json) | (선택) 사내 공통 override, 빈 파일로 시작 가능 |
| `design-system/mui/MASTER.md` | 파일 (md) | mui DS 카탈로그 인덱스 + 출처/라이선스 + 사용 가이드 |
| `design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md` | 파일 (md) | 토큰 5종 카탈로그 (사람·agent 읽기) |
| `design-system/mui/components/{19개}.md` | 파일 (md) | 컴포넌트 19개 메타 |
| `design-system/mui/lockfile.json` | 파일 (json) | source-of-truth (입력/출력 hash + diff) |
| `design-system/mui/CHANGELOG.md` | 파일 (md) | Keep a Changelog 포맷 |
| `scripts/import-mui-design-system.js` | 파일 (js) | 4-stage 파이프라인 |
| `scripts/import-mui-helpers/normalize.js` | 파일 (js) | Stage 2 |
| `scripts/import-mui-helpers/resolve.js` | 파일 (js) | Stage 3 |
| `scripts/import-mui-helpers/emit.js` | 파일 (js) | Stage 4 |
| `tests/import-mui/*.test.js` | 폴더 | unit + integration + 멱등성 |

### 2. 수정 (좁은 범위)

| 자원 | 변경 | 회귀 위험 |
|------|------|----------|
| `agents/cto/ui-designer.md` | (선택) "## 문서 참조 규칙" 섹션에 카탈로그 위치 한 줄 추가 — `design-system/{ds}/MASTER.md` | 매우 낮음 — 본문 1~3줄 추가, frontmatter 변경 없음 |
| `.env.example` | `FIGMA_PAT=` + `FIGMA_FILE_KEY=` 추가 | 매우 낮음 |
| `package.json` | dev dep `@mui/material@^6` (cross-check 용) + `axios` 또는 `node-fetch` (runtime 의존 X) | 낮음 |
| `.gitignore` | 이미 차단된 패턴으로 충분 — 추가 변경 없음 (확인만) | — |

### 3. 폐기된 v1.x 변경 자원 (v2.0 에서 본 피처 책임 외)

| 자원 (v1.x) | v2.0 분류 |
|------------|-----------|
| `hooks/design-mcp-trigger.js` 수정 | 후속 피처 (`design-system-runtime-integration`) |
| `mcp/design-system-server-runner.js` adapter | 후속 |
| `lib/design-system-router.js` | 후속 |
| `design-system/_active.json` | 후속 |
| `vais.config.json > orchestration.designSystem` 키 | 후속 |
| `tests/hooks/design-mcp-trigger.test.js` | 후속 |
| `tests/design-system-router.test.js` | 후속 |

### 4. 삭제

없음 — additive change.

## 현재 소비자 (Consumer)

| 자원 | 사용처 | 영향 |
|------|--------|------|
| `agents/cto/ui-designer.md` | CTO design phase Agent 호출 | 안내문 1줄 추가 — agent 동작 변경 없음 |
| `design-system/` | 기존 hook 이 피처별 MASTER 생성 (`design-system/{feature}/MASTER.md`) | **변경 없음** — 본 피처는 `design-system/mui/` 만 추가, 기존 피처 폴더 영향 없음 |

## 회귀 시나리오 (v2.0 — 단순화)

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| R-1 | import 스크립트 2회 실행 (멱등) | 동일 입력 → lockfile diff 0, 출력 파일 변화 없음 |
| R-2 | `_overrides.json` 변경 후 재실행 | 해당 토큰만 lockfile diff, CHANGELOG entry append |
| R-3 | Figma API token 만료 (401) | exit code 3 + WARN 로그 + `--fallback-mui-only` 가이드 메시지 |
| R-4 | `FIGMA_PAT` 미설정 | `--fallback-mui-only` 자동 활성, MUI npm 만으로 빌드 (graceful) |
| R-5 | 기존 피처(`clevel-doc-coexistence`, `subagent-architecture-rethink`) design phase 재실행 | **영향 없음** — 본 피처는 `design-system/mui/` 만 추가, 기존 hook 동작/피처 폴더 변경 없음 |
| R-6 | 기존 design-system MCP (`design_search`) 호출 | **영향 없음** — vendor 동작 그대로, baseline 카탈로그는 검색 결과에 노출되지 않음 (v2.0 설계) |

> v1.x 에 있던 R-1/R-2/R-3 baseline 분기 / R-7/R-8/R-9 라우팅 시나리오는 v2.0 에서 폐기 (해당 자원 자체가 본 피처 범위 외).

## Breaking Change 평가

| 영역 | breaking? | 근거 |
|------|:---------:|------|
| 기존 피처 design 산출물 | ❌ | 본 피처는 `design-system/mui/` 추가만, 기존 폴더 미수정 |
| MCP API 호환성 | ❌ | MCP 변경 없음 (v2.0) |
| ui-designer agent | ❌ | 안내문 1줄 추가만, 동작 변경 없음 |
| 환경변수 | ⚠️ → ❌ | `FIGMA_PAT` 신규 — 미설정 시 `--fallback-mui-only` 자동 graceful |
| Plugin 사용자 (외부) | ❌ | additive — 기존 플러그인 동작 영향 없음 |

## 검증 체크리스트

- [ ] R-1 ~ R-6 모든 시나리오 통과
- [ ] secret-scanner: `FIGMA_PAT` 패턴 false positive 없음
- [ ] dependency-analyzer: `@mui/material`, `axios` 라이선스 호환
- [ ] qa Gap 분석 시 SC-01 ~ SC-05 검증 메트릭 정의

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| v1.0/v1.1 변경 자원 표 | | ✓ (런타임 자원 7개) | | | (v2.0) 본 피처 책임 외, 후속 피처로 이관 |
| v1.0/v1.1 변경 자원 표 | ✓ (분석 스크립트 + MD 박제) | | | | 본질 유지 |
| 사용자 정정 (2026-05-02) | | | | ✓ | 박제만 담당 → ui-designer.md 수정은 1줄 안내문으로 축소 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-30 | CTO plan 초기 작성 (변경 자원 13개 + 회귀 시나리오 6개 + breaking change 평가 5개 영역) |
| v1.1 | 2026-05-01 | multi-DS 채택 — 신규 자원 추가 (INDEX/_active.json/router) + 회귀 시나리오 R-7/R-8/R-9 |
| **v2.0** | **2026-05-02** | **런타임 통합 폐기 — v1.x 의 hook/MCP/router 변경 자원 7개 폐기 (후속 피처로 이관). 회귀 시나리오 단순화 (R-1~R-6, 모두 import 스크립트 멱등성·라이선스·기존 피처 영향 0 검증). Breaking change 평가 모두 ❌ 로 단순화.** |
