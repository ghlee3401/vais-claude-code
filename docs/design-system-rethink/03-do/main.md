---
owner: cto
artifact: main
phase: do
feature: design-system-rethink
---

# design-system-rethink — Do

## Executive Summary

design phase에서 결정한 6 D-Q + 4 보너스 결정을 10 작업으로 실행 완료. 핵심 성과:

1. **`scripts/import-awesome-design-md.js`** — CLI 시그니처 (--source/--brands/--all/--pre-bake/--dry-run/--force/--regen-index) + slug 정규화 + attribution + idempotent
2. **Default 5 brand 박제** — claude/linear/stripe/vercel/notion (총 3,186 라인 DESIGN.md)
3. **`design-system/brands/INDEX.md`** — upstream README 파싱 → 8 카테고리 + 71 brand + Baked 컬럼 자동 생성
4. **Hook 재작성** — `hooks/design-mcp-trigger.js` brand-first 모델 (block-soft + fallback chain + lazy import)
5. **신규 lib** — `lib/brand-validator.js` (brandExists/loadBrandDesign/isKnownBrand) + `lib/mcp-validator.js` deprecate 주석
6. **status 헬퍼** — `lib/status.js > getBrand/setBrand` + slug 패턴 검증
7. **Agent 갱신** — `agents/cto/ui-designer.md` v2.0 (Brand 선택 + DESIGN.md 참조) + `agents/cto/cto.md` design phase brand 선택 plot
8. **mui 완전 제거** — `design-system/mui/` (116K) + `scripts/import-mui-design-system.js` + `scripts/import-mui-helpers/` 8 helpers 삭제
9. **문서 정합화** — CLAUDE.md / ONBOARDING.md / README.md / `design-system/INDEX.md` 갱신
10. **vais.config.json > designSystem** — 7-key 섹션 추가 (model/brandRoot/defaultBrand/preBakedBrands/categorySource/selectionStrategy/blockOnMissingBrand)

## Decision Record

| Owner | Decision | Rationale |
|-------|----------|-----------|
| cto | slug 정규화 보정 | `x.ai` → `xai` (≥3자 보장). 너무 짧으면 concatenate, 아니면 strip tld |
| cto | INDEX 빈 카테고리 필터링 | upstream README "How to Use" 같은 noise 제거 |
| cto | hook fallback 우선순위 = env > config | CI 환경에서 PR-specific override 가능하도록 |
| cto | import script가 brand 자동 박제 시 LICENSE.md도 함께 보장 | attribution 누락 = legal risk (R7), 1회 비용은 무시 가능 |
| cto | 71 source folder vs 72 INDEX total 차이는 upstream metadata 불일치로 무시 | README가 source에 없는 1 brand 참조 — 사소한 metadata 부정합, 기능 영향 없음 |

## Artifacts

| 산출물 | 경로 | 라인/크기 | 상태 |
|--------|------|----------|:----:|
| Import script | `scripts/import-awesome-design-md.js` | 290 lines | ✅ |
| Brand 박제 (5개) | `design-system/brands/{claude,linear,stripe,vercel,notion}/DESIGN.md` | 3,186 lines | ✅ |
| Brand INDEX | `design-system/brands/INDEX.md` | 자동 생성 (72 brands × 10 categories) | ✅ |
| Brand LICENSE | `design-system/brands/LICENSE.md` | MIT (VoltAgent 2026) 박제 | ✅ |
| Hook (재작성) | `hooks/design-mcp-trigger.js` | 195 lines | ✅ |
| Brand validator | `lib/brand-validator.js` | 103 lines, 신규 | ✅ |
| MCP validator deprecate | `lib/mcp-validator.js` | hasMasterDoc/runGenerate에 @deprecated 주석 | ✅ |
| Status 헬퍼 | `lib/status.js > getBrand/setBrand` | +40 lines | ✅ |
| ui-designer agent | `agents/cto/ui-designer.md` v2.0 | DS 자동 선택 → Brand 선택 섹션 교체 | ✅ |
| cto agent | `agents/cto/cto.md` | design phase brand 선택 plot 7 lines 추가 | ✅ |
| mui 제거 | `design-system/mui/` (116K) + `scripts/import-mui-design-system.js` + helpers/ 8개 | 모두 삭제 | ✅ |
| design-system/INDEX.md | brand-first 모델 안내로 재작성 | 38 lines | ✅ |
| vais.config.json | `designSystem` 7-key 섹션 추가 | +18 lines | ✅ |
| CLAUDE.md | What This Project Is + Project Structure 3 줄 갱신 | ✅ |
| ONBOARDING.md | Mermaid DS 노드 + 시나리오 3번 + 부속 폴더 갱신 | ✅ |
| README.md | Project Layout + Configuration 4 keys 추가 | ✅ |

## 회귀 검증

| 검증 | 명령 | 결과 |
|------|------|------|
| Plugin 구조 | `node scripts/vais-validate-plugin.js` | ✅ 0 errors, 1 unrelated warning |
| 테스트 스위트 | `npm test` | ✅ 324/327 pass, 0 fail, 3 skipped |
| Import dry-run | `node scripts/import-awesome-design-md.js --dry-run --brands claude,linear` | ✅ |
| Import 실제 박제 | `--brands claude,linear.app,stripe,vercel,notion` | ✅ 5 baked, INDEX 재생성 |
| Brand validator | `node -e "require('./lib/brand-validator').listBakedBrands()"` | ✅ 5 brands |
| Status getBrand/setBrand | `node -e "require('./lib/status').setBrand('test', 'claude')"` | ✅ |
| Hook smoke test | non-Agent / non-ui-designer trigger 거부 | ✅ |
| Hook block message | 5 lines stderr 포맷 검증 | ✅ |

## CEO 판단 근거

CTO 단독 PDCA. design phase에서 명시한 6 D-Q + 4 보너스 결정 = 10 작업 → 10/10 완료. CSO/COO 보안·운영 영향 분석 미수행 — 내부 도구 refactor + 외부 데이터 박제만이라 CEO 알고리즘 생략.

| 차원 | 등급 | do phase 실측 |
|------|------|---------------|
| 보안 | none | secret/credential 추가 없음. attribution comment만 prepend |
| 컴플라이언스 | low | MIT license attribution 박제 완료 (R7 mitigation) |
| UX | medium | hook block-soft + 2-step AskUserQuestion 도입 |
| 데이터모델 | low | status.json `features.{X}.brand` 필드 추가 |
| 외부통신 | none | references/ 정적 박제. 런타임 외부 호출 없음 |
| 성능 | low | 5 brand 박제 ~120KB (R1 95% 절감 — 4.7M → 220KB) |
| 제품정의 | high | ui design flow 모델 자체 전환 (mui-first → brand-first) |

## Next Phase — qa

qa phase에서 검증할 항목:

1. **Dummy feature design phase 실행** — `/vais cto design dummy-design-test` 시도 → 2-step AskUserQuestion 동작 확인
2. **Hook fallback chain 동작** — `VAIS_DEFAULT_BRAND=linear /vais cto design ...` → 자동 적용
3. **Lazy import** — 미박제 brand 선택 → import script 자동 호출 → DESIGN.md 박제 확인
4. **Block-soft 동작** — config blockOnMissingBrand=false 시 warn-only 확인
5. **Deprecated mui-validator backward-compat** — 기존 호출자 (있다면) 에러 없이 동작 확인
6. **CHANGELOG.md** — [1.1.0] entry 작성 (breaking change 표기)
7. **Gap analysis** — 10 작업 대비 산출물 matchRate ≥ 90%

qa phase 진입 시 `/vais cto qa design-system-rethink` 실행.

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-23 | 초기 작성 — 10 작업 완료 + 회귀 검증 8 항목 + qa 7 점검 항목 식별 |
