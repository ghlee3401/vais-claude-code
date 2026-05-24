---
owner: cto
artifact: main
phase: design
feature: design-system-rethink
---

# design-system-rethink — Design

## Executive Summary

Plan의 6 D-Q를 모두 결정하고 architecture · schema · import-script 3 산출물로 분해. 핵심 결정:

1. **박제 범위 = lazy on-demand + default 5 pre-bake** — 71 전체 박제는 R1 (4.7M repo) 미완화. 자주 쓰는 5 brand (claude/linear/stripe/vercel/notion) 사전 박제 + 나머지는 사용자 요청 시 idempotent script가 추가.
2. **소스 경로 = workspace-level sibling (`../references/awesome-design-md/`) + `--source` CLI 인자** — 실제 위치 확인 결과 vais-claude-code 외부. import script가 `--source <path>` 받음 (default `../references/awesome-design-md`).
3. **Brand 선택 UI = 2-step AskUserQuestion (Hot 5 / Category / Manual)** — 71개 한번 노출 불가, AskUserQuestion 4개 제한 회피.
4. **Hook 미선택 = AskUserQuestion 유도 (block-soft)** — brand-first 정신 보존. config의 `defaultBrand` 지정 시 우회.
5. **토큰 매핑 = `{brand.color.primary}` placeholder** — mustache-like, frontend-engineer가 do phase에서 실제 라이브러리에 바인딩.
6. **ui-ux-pro-max = design start + qa 양쪽** — start에서 가드레일 컨텍스트, qa에서 검증.

## Decision Record

| Owner | Decision | Rationale |
|-------|----------|-----------|
| cto | D-Q1 → lazy + default 5 pre-bake | R1 (repo size) 완화 + UX (default brand 즉시 사용) 균형. import script idempotent |
| cto | D-Q2 → upstream 8 카테고리 유지 | 자체 재분류 maintenance burden 회피. upstream 동기화 용이. INDEX.md 자동 생성 |
| cto | D-Q3 → 2-step AskUserQuestion (Hot/Cat/Manual) | 71 brand × AskUserQuestion 4-option 제한 해결. PO 인지 부담 분산 |
| cto | D-Q4 → block-soft + defaultBrand fallback | brand-first 정신 보존하되 enterprise/CI 시나리오는 config 우회 허용 |
| cto | D-Q5 → `{brand.color.primary}` placeholder | DESIGN.md frontmatter 키 직접 인용. frontend-engineer가 do phase 매핑 |
| cto | D-Q6 → start + qa 양쪽 호출 | start = 가드레일 prepend, qa = 산출물 검증. ui-ux-pro-max 본체 변경 없음 |
| cto | 소스 경로 = workspace-level sibling | 실측 결과 `/Users/ghlee/workspace/references/awesome-design-md/`. import script `--source` 인자로 흡수 |
| cto | Default 5 brand 선정 = claude/linear/stripe/vercel/notion | AI(claude), SaaS(linear/notion), payments(stripe), devtools(vercel) — vais-code 주요 페르소나 커버 |

## Artifacts

| 산출물 | 경로 | 책임 | 상태 |
|--------|------|------|:----:|
| Architecture (flow + hook + lib) | `02-design/architecture.md` | cto | ✅ |
| Schema (status.json + INDEX.md) | `02-design/schema.md` | cto | ✅ |
| Import script spec | `02-design/import-script-spec.md` | cto | ✅ |

## CEO 판단 근거

CTO 단독 PDCA — plan 단계에서 CEO 7 차원 분석 생략 (내부 도구 리팩토링). design phase에서도 동일 정책. ui-ux-pro-max 호출은 design start hook만 변경 (본체 변경 없음).

## Next Phase — do

do phase 작업 순서:

1. **M3a** — `scripts/import-awesome-design-md.js` 작성 (`--source`, `--brands`, `--all` 플래그)
2. **M3b** — default 5 brand (claude/linear/stripe/vercel/notion) 사전 박제 → `design-system/brands/{slug}/DESIGN.md`
3. **M3c** — `design-system/brands/INDEX.md` 자동 생성 (8 카테고리 분류, 박제 상태 표시)
4. **M4a** — `hooks/design-mcp-trigger.js` 재작성 (hasBrandSelected → 2-step AskUserQuestion)
5. **M4b** — `lib/mcp-validator.js` brand-aware 재작성 (또는 deprecate + 신규 `lib/brand-validator.js`)
6. **M4c** — `lib/status.js` brand 필드 read/write 헬퍼
7. **M4d** — `agents/cto/ui-designer.md` 본문 재작성 (DS 자동 선택 → Brand 선택)
8. **M4e** — `agents/cto/cto.md` design phase 위임 시 brand 선택 plot 추가
9. **M4f** — `design-system/mui/` 완전 제거 + `scripts/import-mui-design-system.js` 제거
10. **M5** — CLAUDE.md / ONBOARDING.md / README.md / `design-system/INDEX.md` 정합화

do phase 진입 시 `/vais cto do design-system-rethink` 실행.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — 6 D-Q 결정 + 소스 경로 확정 + default 5 brand 선정. do phase 10 작업 분해 |
