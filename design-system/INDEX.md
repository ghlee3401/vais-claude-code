# Design System Index

본 폴더는 **Brand-First** 디자인 모델 카탈로그입니다 (design-system-rethink 산출물).

> 이전 mui-first 모델은 deprecated — design-system/mui/ 제거됨 (`design-system-rethink` 피처).
> 정책 정본: `vais.config.json > designSystem` 섹션.

---

## brands

| Key | Value |
|-----|-------|
| Source | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (Google Stitch DESIGN.md 포맷, 71 brands) |
| License | MIT (VoltAgent, 2026) — `brands/LICENSE.md` 박제 |
| Catalog | [`brands/INDEX.md`](./brands/INDEX.md) — 8 카테고리 + Baked/Lazy 표시 |
| Default 5 (pre-baked) | claude / linear / stripe / vercel / notion |
| Importer | `scripts/import-awesome-design-md.js` |
| Lazy Import | `node scripts/import-awesome-design-md.js --brands <slug>` (사용자가 다른 brand 선택 시 자동 호출) |
| Hook | `hooks/design-mcp-trigger.js` — design phase 진입 시 brand 선택 검증 (block-soft + fallback) |

### Design phase 진입 시 brand 선택

ui-designer Agent 호출 직전 `hooks/design-mcp-trigger.js` 가:
1. `.vais/status.json > features.{feature}.brand` 조회
2. 미선택 시 fallback chain: `VAIS_DEFAULT_BRAND` env → `vais.config.json > designSystem.defaultBrand`
3. 모두 없으면 design phase 차단 + AskUserQuestion 안내
4. 박제된 brand → DESIGN.md 컨텍스트 prepend
5. 미박제 brand → `scripts/import-awesome-design-md.js --brands <slug>` 자동 실행

상세: `design-system/specs/architecture.md`.

## 신규 brand 추가 패턴

awesome-design-md 가 upstream 에 새 brand 를 추가한 경우:

1. `git pull` upstream `references/awesome-design-md/`
2. `node scripts/import-awesome-design-md.js --regen-index` — INDEX.md 만 재생성하여 신규 brand 표시
3. 박제는 사용자 선택 시 자동 (또는 `--brands <slug>` 수동)

> 자체 brand DESIGN.md 작성 시: `design-system/brands/{slug}/DESIGN.md` 직접 작성 + `brands/INDEX.md` 수동 entry 추가. Google Stitch 포맷 준수.
