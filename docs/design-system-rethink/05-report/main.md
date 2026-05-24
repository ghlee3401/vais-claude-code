---
owner: cto
artifact: main
phase: report
feature: design-system-rethink
---

# design-system-rethink — Report

## Executive Summary

**v1.1.0 brand-first 디자인 모델 전환 완료 (2026-05-23, CTO 단독 PDCA 5 phase, 1일 spike)**.

핵심 임팩트: vais-code가 생산하는 모든 ui design 산출물이 사용자가 선택한 71 brand 중 1개 톤으로 일관화. MUI Material Design default 종속 해소. 71 brand 카탈로그 (VoltAgent/awesome-design-md MIT) lazy import 모델로 repo size 영향 95% 절감 (4.7M → 220KB 사전 박제).

**matchRate 100% (8/8 goals), Risk R1-R7 모두 mitigated, 0 Critical/Important 이슈, 1 Minor by-design.**

## Decision Record

| Owner | Decision | Rationale |
|-------|----------|-----------|
| user | mui 카탈로그 완전 제거 | "MUI default 면 비슷한 디자인만 나옴" — 다양성 확보가 우선 |
| user | brand-first 채택 (Option B-revised) | A 옵션의 MUI+brand 충돌 (anatomy 중복) 해결 |
| user | "기존 plan 그대로 CTO 진입" | CEO 라우팅 생략, 내부 도구 리팩토링 CTO 단독 PDCA |
| user | qa 후 CTO report 진행 | 5 phase 완주 + git commit 보류 (사용자 결정) |
| cto | design vs do axis 분리 | design = 시각 사양 (brand DESIGN.md), do = implementation library (frontend-engineer npm 선택) |
| cto | 소스 = workspace-level sibling 경로 + import script `--source` 인자 | 실측 결과 `/Users/ghlee/workspace/references/awesome-design-md/` (vais-claude-code 외부) |
| cto | Lazy 박제 + default 5 pre-bake | R1 (4.7M repo size) 95% 절감 + UX 즉시 사용 균형 |
| cto | `lib/brand-validator.js` 신설 + `mcp-validator.js` deprecate | mui와 brand-first 모델 axis가 fundamentally 달라 함수 시그니처 호환 불가 |
| cto | 2-step AskUserQuestion (Hot 5 / Category / Manual / Default) | 71개 한 번 노출 불가 + AskUserQuestion 4-option 제한 회피 |
| cto | Block-soft + `defaultBrand` fallback | brand-first 정신 보존하되 CI/enterprise 시나리오 config 우회 허용 |
| cto | x.ai → xai (≥3자 보장) slug 정규화 | linear.app → linear 처럼 strip 하면 1자 ambiguous |

## Artifacts (Phase별)

| Phase | 산출물 | 라인/상태 |
|-------|--------|----------|
| Plan | `docs/design-system-rethink/01-plan/main.md` | v1.0 — 8 goals + 7 milestones + 7 risks + 6 design D-Q |
| Design | `docs/design-system-rethink/02-design/main.md` | v1.0 — 6 D-Q 결정 + 4 보너스 결정 |
| Design | `02-design/architecture.md` | Before/After Mermaid + 컴포넌트 책임 매트릭스 + hook/lib 재설계 |
| Design | `02-design/schema.md` | status.json brand 필드 + slug 정규화 + INDEX 자동생성 + vais.config.json |
| Design | `02-design/import-script-spec.md` | CLI 7 옵션 + 동작 5 단계 + 10 테스트 케이스 |
| Do | `docs/design-system-rethink/03-do/main.md` | 10 작업 + 회귀 검증 8 항목 + qa 7 점검 식별 |
| QA | `docs/design-system-rethink/04-qa/main.md` | 7 qa 점검 결과 + Gap 100% + R1-R7 재평가 + M1 minor |
| Report | `docs/design-system-rethink/05-report/main.md` | 본 문서 |
| Code | `scripts/import-awesome-design-md.js` | 290 lines — CLI 시그니처 7 옵션 |
| Code | `lib/brand-validator.js` | 103 lines, 신규 |
| Code | `lib/status.js > getBrand/setBrand` | +40 lines |
| Code | `hooks/design-mcp-trigger.js` | 195 lines (재작성) |
| Code | `agents/cto/ui-designer.md` v2.0.0 | 본문 재작성 |
| Code | `agents/cto/cto.md` | design phase brand 선택 plot 추가 |
| Data | `design-system/brands/{claude,linear,stripe,vercel,notion}/DESIGN.md` | 3,186 lines (pre-baked 5) |
| Data | `design-system/brands/INDEX.md` | 자동 생성 — 72 brands × 10 categories |
| Data | `design-system/brands/LICENSE.md` | MIT (VoltAgent 2026) |
| Removed | `design-system/mui/` + `scripts/import-mui-design-system.js` + `scripts/import-mui-helpers/` | 28 + 1 + 8 = 37 파일 삭제 |
| Docs | CLAUDE.md / ONBOARDING.md / README.md / `design-system/INDEX.md` | 갱신 |
| Config | `vais.config.json > designSystem` | 7 키 섹션 추가 |
| Release | `CHANGELOG.md` [1.1.0] | Added/Changed/Removed/Migration 4 섹션 |

## 검증 결과 종합

| 검증 | 결과 |
|------|:--:|
| `node scripts/vais-validate-plugin.js` | ✅ 0 errors |
| `npm test` | ✅ 324/327 pass, 0 fail |
| Brand validator smoke | ✅ 5 baked, 72 known, slug 검증 |
| Hook smoke (active feature + null brand) | ✅ 데이터 경로 검증 |
| Lazy import 실측 (cohere bake → cleanup) | ✅ 자동 박제 + INDEX 재생성 |
| Backward-compat grep (`hasMasterDoc/runGenerate`) | ✅ 0 외부 호출자 |
| Gap analysis (G1-G8) | ✅ 100% (8/8) |

## Lessons Learned

1. **외부 의존 위치 가정 검증 우선** — Plan main.md 가 `references/awesome-design-md/` 를 가정했으나 실제로는 workspace-level sibling이었음. design phase 진입 시 파일시스템 확인 → 사용자에게 정확한 위치 질문 → script `--source` 인자로 흡수. *"plan은 가설, design은 검증"*.
2. **Lazy + Pre-bake 조합이 size vs UX trade-off 균형** — 71 전체 박제 vs lazy-only 양극단보다 default 5 + lazy 가 R1 mitigation + 즉시 사용성 둘 다 확보.
3. **MD frontmatter 4 필수 + auto-hydrate** 의 진가 — 4 phase 산출물 9 MD 작성 시 frontmatter 표준 덕에 doc-validator 0 warning. Plan 작성 단계의 비용 (4 필드 기록) 이 design/do/qa/report 4단계에서 회수.
4. **하위 호환 deprecation은 grep 으로 안전 확인** — `lib/mcp-validator.js > hasMasterDoc/runGenerate` 가 외부 호출자 0 임을 확인하고 `@deprecated` 만 표시. 즉시 삭제 회피로 panic 회귀 위험 0.
5. **CLI script idempotency가 회귀 안전망** — `scripts/import-awesome-design-md.js` 가 idempotent 하므로 qa phase에서 cohere bake → 즉시 cleanup → INDEX regen 가능. 검증 비용 0.

## Risk Outcomes (Plan vs 실측)

| ID | Plan 추정 | 실측 |
|----|----------|------|
| R1 (4.7M repo) | High × Medium | Lazy 5 사전 박제로 ~220KB (95% 절감) |
| R2 (upstream 갱신) | Medium × Low | import script idempotent + import 날짜 attribution 기록 |
| R3 (brand 선택 UX 부담) | Medium × Medium | 2-step + Hot 5 → avg 1.5 clicks |
| R4 (기존 mui 호환) | Low × Low | historical 유지 정책, breaking 표기 |
| R5 (DESIGN.md anatomy 충분?) | Medium × Medium | qa 실측 (cohere bake OK), Google Stitch 표준 충분 |
| R6 (semver) | Medium × Medium | minor 1.1.0 채택 (사용자 facing API 변경 없음) |
| R7 (license attribution) | Low × High | LICENSE + INDEX + DESIGN.md 3중 박제 |

## Next Steps (사용자 결정)

1. **git commit** — 38 파일 변경 (modified 14 + new 5 + deleted 37). 메시지 권장: `feat(design-system): v1.1.0 brand-first model — mui 제거 + 71 brand 카탈로그 박제`
2. **git tag v1.1.0** — `package.json` / `vais.config.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` 의 version 필드 1.0.2 → 1.1.0 bump 필요
3. **release notes 게시** — CHANGELOG.md [1.1.0] entry 가 release 준비 완료 상태
4. **(옵션) 모든 71 brand 박제** — `node scripts/import-awesome-design-md.js --all` 로 repo size +4.7M 감수. 권장: lazy 유지
5. **(옵션) upstream PR** — uncategorized "slack" 케이스를 upstream README에 추가 요청

## CEO 판단 근거

CTO 단독 PDCA 5 phase 완료. CSO/COO/CBO 활성화 미필요 (내부 도구 리팩토링 + 외부 데이터 박제만). 7 차원 매트릭스는 plan/qa에서 동일하게 평가됨 (보안 none / 컴플라이언스 low / UX medium / 데이터모델 low / 외부통신 none / 성능 low → 실측 better / 제품정의 high).

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — 5 phase 종합 보고 + Decision Record 11행 + Lessons Learned 5 + Risk outcomes |
