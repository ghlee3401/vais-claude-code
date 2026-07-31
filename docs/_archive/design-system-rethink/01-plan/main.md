---
owner: cto
artifact: main
phase: plan
feature: design-system-rethink
---

# design-system-rethink — Plan

## Executive Summary

vais-code 의 ui design flow 를 **brand-first** 로 재정립한다. 핵심 변화 3 가지:

1. **`design-system/mui/` 완전 제거** — MUI 는 Material Design 톤이 default 가 되어 모든 산출물을 비슷한 미감으로 끌고 가는 문제. mui 카탈로그는 do 단계 frontend-engineer 가 npm 으로 가져다 쓰면 충분, design phase 의 reference 일 필요 없음.
2. **`design-system/brands/` 신설** — `references/awesome-design-md` (Google Stitch DESIGN.md 포맷, 71 brands) 를 박제. feature 별로 brand 톤 선택 가능 (Claude / Linear / Stripe / ... 71 종).
3. **ui design flow 재설계** — design phase 진입 시 brand AskUserQuestion → 선택된 `design-system/brands/{brand}/DESIGN.md` 가 single source. ui-ux-pro-max MCP 는 UX heuristics 검증 역할 유지.

대상 commit 후 vais-code 가 produce 하는 모든 design 산출물이 71 brands 중 선택된 톤으로 일관화. MUI 의존 종속 해소.

## Decision Record

| Owner | Decision | Rationale |
|-------|----------|-----------|
| user | mui 카탈로그 완전 제거 | "MUI 가 default 면 비슷한 디자인만 나옴" — 다양성 확보가 우선 |
| user | brand-first (Option B-revised) 채택 | A 옵션의 MUI+brand 충돌 (anatomy 중복 정의) 해결 |
| cto | design vs do 단계 axis 분리 | design = 시각 사양 (brand DESIGN.md), do = implementation library choice (frontend-engineer 가 npm 선택) |
| cto | 소스 경로 = workspace-level sibling | 실측 결과 `/Users/ghlee/workspace/references/awesome-design-md/` (vais-claude-code 외부). import script `--source` 인자로 흡수. 02-design/main.md 참조 |

## 현재 상태 분석

### 3 가지 도구의 axis

| 도구 | 정체성 | 크기 | 답하는 질문 |
|------|--------|------|-------------|
| `design-system/mui/` | Material Design 컴포넌트 시스템 (19 컴포넌트 + 94 토큰) | 116K | "Button anatomy/variants/states" |
| `vendor/ui-ux-pro-max/` | UX 패턴 / heuristics 검색 엔진 (BM25, 99 UX guidelines) | 1.3M | "Accessibility 체크리스트 / 색 조합 추천" |
| `references/awesome-design-md/` | 71 brands 비주얼 톤 카탈로그 (Google Stitch DESIGN.md) | 4.7M | "Claude/Linear/Stripe 같은 톤" |

### 문제 정의

- **현재**: ui-designer 가 `design-system/mui/MASTER.md` 만 참조. brand 톤 결정 시 LLM 추론에 의존.
- **결과**: Material Design 미감에 종속, 산출물 다양성 부재.
- **awesome-design-md 발견**: Google Stitch 표준 DESIGN.md 포맷의 검증된 brand 톤 카탈로그 71 개 사용 가능.

## 목표 (Goals)

| # | Goal | Acceptance Criteria |
|---|------|---------------------|
| G1 | `design-system/mui/` 완전 제거 | mui/ 디렉토리 0 파일, `scripts/import-mui-design-system.js` 제거, INDEX.md / CLAUDE.md / README.md 의 mui 참조 0 건 |
| G2 | `design-system/brands/` 71 brands 박제 | `design-system/brands/{slug}/DESIGN.md` × 71, `design-system/brands/INDEX.md` (brand 목록 + 톤 한 줄 설명) |
| G3 | `scripts/import-awesome-design-md.js` 작성 | references/awesome-design-md/design-md/{brand}/DESIGN.md → design-system/brands/{slug}/DESIGN.md idempotent 박제 + license/attribution 박제 |
| G4 | ui-designer flow 재설계 | design phase 진입 시 brand AskUserQuestion → DESIGN.md 로딩. mui 종속 제거. UX 가드레일은 ui-ux-pro-max 로 분리 |
| G5 | design-mcp-trigger hook 재작성 | hasMasterDoc → hasBrandSelected. brand 선택 미지정 시 차단/유도, 선택 시 `design-system/brands/{brand}/DESIGN.md` 컨텍스트 prepend |
| G6 | status.json schema 확장 | `features.{feature}.brand` 필드 신설 (kebab-case brand slug). 71 brands enum 또는 검증 |
| G7 | 문서 정합화 | CLAUDE.md / ONBOARDING.md / README.md / agents/cto/ui-designer.md / agents/cto/cto.md 의 design-system 언급 brand-first 모델로 갱신 |
| G8 | License 박제 | references/awesome-design-md 는 MIT (VoltAgent). 박제 시 출처 + LICENSE 보존 |

## Out-of-scope (이번 피처에서 안 함)

- ❌ awesome-design-md 외 별도 brand 카탈로그 수집 (e.g. Linear 가 들어있지 않은 신규 brand) — 추후 별도 import
- ❌ DESIGN.md 포맷 자체 확장 (e.g. 우리 자체 필드 추가) — 표준 Stitch 포맷 그대로 사용
- ❌ frontend-engineer 에 implementation library 선택 UI 추가 — do phase 작업으로 분리
- ❌ ui-ux-pro-max 내부 데이터/스킬 수정 — heuristics 검증 역할 유지하되 본체는 vendor 로 보존

## 작업 범위 (Implementation Work)

### 신규 파일

| Path | 내용 |
|------|------|
| `design-system/brands/INDEX.md` | 71 brands 카탈로그 (slug / 톤 한 줄 / DESIGN.md 링크 / 출처 URL) |
| `design-system/brands/{slug}/DESIGN.md` × 71 | awesome-design-md 박제본 |
| `design-system/brands/LICENSE.md` | MIT (VoltAgent/awesome-design-md) 출처 명시 |
| `scripts/import-awesome-design-md.js` | references/awesome-design-md → design-system/brands 박제 importer |

### 수정 파일

| Path | 변경 |
|------|------|
| `design-system/INDEX.md` | `## mui` 섹션 제거, `## brands` 섹션 추가 (71 brands 등록부 링크) |
| `hooks/design-mcp-trigger.js` | hasMasterDoc(feature) → hasBrandSelected(feature). brand 미선택 시 AskUserQuestion 유도 |
| `lib/mcp-validator.js` | hasMasterDoc / runGenerate 함수 brand-aware 로 재작성 (또는 deprecate) |
| `lib/status.js` | features.{feature}.brand 필드 read/write 헬퍼 |
| `agents/cto/ui-designer.md` | tools 유지 (design_search, design_system_generate). 본문 "## 디자인 시스템 (DS) 자동 선택" → "## Brand 선택 + DESIGN.md 참조" 로 재작성 |
| `agents/cto/cto.md` | design phase 위임 시 brand 선택 plot 추가 |
| `CLAUDE.md` | Project Structure 트리의 `design-system/` 코멘트 갱신 |
| `ONBOARDING.md` | Mermaid 다이어그램의 DS 노드 + 시나리오 C (디자인 시스템 사용) 갱신 |
| `README.md` | Configuration 표 + Project Layout 트리 갱신 |

### 삭제 파일

| Path | 사유 |
|------|------|
| `design-system/mui/` (전체) | brand-first 채택, MUI 종속 해소 |
| `scripts/import-mui-design-system.js` | mui 박제 importer 더 이상 사용 안 함 |

## 마일스톤

| # | Milestone | Phase | 산출물 |
|---|-----------|-------|--------|
| M1 | 핵심 결정 + 작업 범위 확정 | plan | docs/design-system-rethink/01-plan/main.md (본 문서) |
| M2 | 아키텍처 설계 — flow 재정립 + status.json schema + import script 설계 | design | docs/design-system-rethink/02-design/{architecture, flow-diagram, schema}.md |
| M3 | 71 brands 박제 + import script + INDEX.md 자동 생성 | do | design-system/brands/ + scripts/import-awesome-design-md.js |
| M4 | hook + lib + status + agent description 수정 | do | hooks/, lib/, agents/ 갱신 + mui/ 제거 |
| M5 | 문서 정합화 (CLAUDE.md / ONBOARDING.md / README.md) | do | 4 문서 갱신 |
| M6 | 회귀 테스트 + dummy feature 로 design phase 실행 검증 | qa | gap analysis matchRate ≥ 90% |
| M7 | 보고서 + CHANGELOG | report | docs/design-system-rethink/05-report/main.md, CHANGELOG [1.1.0] |

## 리스크 + 완화

| ID | Risk | 가능성 | 영향 | 완화 |
|----|------|:------:|:----:|------|
| R1 | 71 brands × ~500 줄 = ~36k 줄 박제 시 repo size 4.7M 증가 | High | Medium | gitignore 검토. 또는 brands/ 를 subtree 형태로. 또는 lazy import (선택된 brand 만 박제) |
| R2 | awesome-design-md upstream 갱신 추적 | Medium | Low | scripts/import-awesome-design-md.js 가 idempotent. CHANGELOG.md 에 import 날짜 기록 |
| R3 | brand 선택 UX 부담 — 71 개 중 선택 강요 시 PO 클릭 증가 | Medium | Medium | default brand 설정 (e.g. "neutral" 또는 사용자 지정) + 자주 쓰는 5 개 추천 + "Other" 로 전체 선택 |
| R4 | 기존 mui 기반 산출물 (`docs/{feature}/02-design/`) 호환성 | Low | Low | 기존 산출물은 historical. 신규 피처부터 brand 모델 적용 |
| R5 | DESIGN.md 의 컴포넌트 anatomy 가 do 단계 implementation 에 충분한가 | Medium | Medium | qa phase 에서 dummy feature 로 검증. 부족하면 ui-ux-pro-max 보강 |
| R6 | semver 영향 — design-system 구조 큰 변경 | Medium | Medium | 1.0.x patch 가 아니라 minor (1.1.0) 가 적절. release notes 에 breaking change 명시 |
| R7 | brand 의 license attribution 누락 | Low | High (legal) | brand 별 출처 URL + LICENSE 박제 + INDEX.md 에 명시 |

## CEO 판단 근거

이 피처는 사용자 명시 호출 (`/vais cto plan`) 으로 진입했고 CEO 7 차원 분석은 단순 (내부 도구 리팩토링) 이라 생략. CTO 단독 PDCA 로 진행.

| 차원 | 등급 | 메모 |
|------|------|------|
| 보안 | none | 외부 콘텐츠 박제만, 인증/결제 없음 |
| 컴플라이언스 | low | MIT license attribution 필요 (R7) |
| UX | medium | ui-designer flow 변경 — PO 가 brand 선택 UX 영향 (R3) |
| 데이터모델 | low | status.json schema 1 필드 추가 |
| 외부통신 | none | 박제 후 self-contained |
| 성능 | low | 4.7M repo size 증가 (R1) |
| 제품정의 | high | ui design flow 자체를 재정의 |

## Next Phase — design

design phase 에서 결정할 것 (D-Q):

1. **D-Q1 — brand 박제 범위**: 71 전체 vs 자주 쓰는 N 개부터 vs lazy (사용자 요청 시만 박제). R1 완화책.
2. **D-Q2 — INDEX.md 카테고리화**: awesome-design-md README 의 8 카테고리 (AI/Devtools/Backend/Productivity/Design/Fintech/Ecom/Media-Auto) 그대로 vs 우리 vais-code 친화 카테고리 (b2b SaaS / consumer / dashboard / landing 등) 재분류.
3. **D-Q3 — design phase brand 선택 인터페이스**: AskUserQuestion 옵션 4개 제한 vs 검색형 (사용자 입력으로 매칭) vs 카테고리 → brand 2-step.
4. **D-Q4 — hook hasBrandSelected 미선택 시**: 차단 (block) vs 경고 후 진행 (allow w/ warning) vs default brand fallback.
5. **D-Q5 — DESIGN.md 토큰 → 코드 매핑 가이드**: ui-designer 산출물에 brand DESIGN.md 토큰 인용 형식 (예: `color.primary` `{colors.primary}`) 표준 정의.
6. **D-Q6 — ui-ux-pro-max 호출 시점**: design phase start 시 vs 산출물 검토 시 vs 양쪽.

design phase 진입 시 `/vais cto design design-system-rethink` 실행.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — brand-first 채택 + mui 완전 제거 + ui-ux-pro-max 가드레일 분리. design phase 6 D-Q 식별 |
