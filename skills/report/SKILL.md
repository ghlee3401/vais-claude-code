---
# 이 파일의 책임: /vais report·deck·brand 진입점 — brand 스타일 HTML 보고서/슬라이드 생성.
name: report
description: >
  Generates brand-styled, self-contained HTML reports and slide decks from feature docs,
  git history, or user-provided material. Anti-AI-slop design rules enforced via self-critique pass.
  Use when: /vais report, /vais deck, or /vais brand new is invoked.
---

# Report / Deck Generator

시작 전 **반드시 `skills/report/design-rules.md` 를 Read** — 금지 패턴 8 + 타이포/차트/조판 규칙.

## 파이프라인 (report / deck 공통)

1. **소재 수집** — 대상이 피처면 `docs/{feature}/` 3파일 + git log. 주제면 사용자 제공 자료/대화 맥락. 부족하면 이 시점에 질문.
2. **아웃라인 승인 (유일한 중간 확인)** — 스토리라인 + 섹션(슬라이드) 목록을 표로 제시 → AskUserQuestion 1회 (`이대로 진행` / `수정`). 구성이 절반이다 — 디자인 전에 확정.
3. **브랜드 결정** — `getBrand(feature)` → `VAIS_DEFAULT_BRAND` env → config `defaultBrand` → 없으면 AskUserQuestion (자주 쓰는 5 / 카테고리 / 직접 입력 / custom). 선택된 `design-system/brands/{slug}/DESIGN.md` Read → colors/typography 토큰 추출.
4. **생성** — 스켈레톤 Read (`templates/report.html` 또는 `templates/deck.html`) → 토큰을 CSS 변수에 주입 → design-rules 준수하며 콘텐츠 작성. 산출 위치: `docs/{feature}/assets/{name}.html` (피처 무관 주제면 사용자에게 경로 확인).
5. **디자인 QA (self-critique, 필수)** — design-rules.md 의 체크리스트 8항 + 대비(WCAG AA) + 텍스트 오버플로를 스스로 점검 → 위반 수정 → 결과를 대화에 1줄 보고 (`QA: 8/8 통과, 수정 2건`).

## report vs deck

| | report | deck |
|---|--------|------|
| 구조 | 연속 문서 (목차 + 섹션) | 16:9 슬라이드 (1장 1메시지) |
| 밀도 | 표·차트 30% 이상 | 슬라이드당 핵심 1 + 근거 1 |
| PDF | 브라우저 인쇄 (A4 세로) | 브라우저 인쇄 (가로, 슬라이드=페이지) |
| pptx | — | 요청 시 `pptxgenjs` 스크립트 생성 (옵션, HTML 우선 권장) |

## brand new (커스텀 브랜드 생성)

`/vais brand new` — 사내 CI·개인 스타일을 brand 로 등록:

1. AskUserQuestion 으로 수집: 브랜드 이름 / 메인·배경 색상 (hex 2~4개) / 폰트 (헤드라인·본문) / 참고 URL·이미지 (선택)
2. 기존 brand DESIGN.md 1개를 포맷 참조로 Read (예: `design-system/brands/claude/DESIGN.md` — Google Stitch 포맷)
3. `design-system/brands/custom-{slug}/DESIGN.md` 생성 — colors(primary/ink/body/muted/canvas/surface 최소 6키) + typography(display/body) + description
4. 필요 시 `setBrand(feature, 'custom-{slug}')` 저장 → 이후 report/deck/design 에서 즉시 선택 가능

## 규칙

- 외부 CDN·원격 리소스 참조 금지 — 자체 포함 HTML만 (오프라인/사내망 열람).
- 차트는 인라인 SVG 직접 생성 (라이브러리 금지) — design-rules 의 차트 색상 공식 준수.
- 본문 데이터는 소재에서만 — 수치를 지어내지 않는다. 불확실한 수치는 표기 (`~`, `추정`).
