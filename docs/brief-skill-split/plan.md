---
feature: brief-skill-split
updated: 2026-07-31
---

# brief-skill-split — Plan

## 요청 원문

> feature 문서의 report를 쓰는 건 별도로 두고 내가 보고서 작성을 위해서 하는 것은 별도로 두고 싶어. 이름도 report가 아니어도 돼
>
> (맥락: plan-do-review 개발의 마지막 phase 보고가 아니라, HTML/PPT 임원진 보고용 산출물 생성 스킬이 원래 만들려던 것. 이름은 `brief` 선택, plan부터 진행 합의)

## 범위

**In**
- `skills/brief/SKILL.md` 신설 — 임원/대외 보고용 HTML 보고서·슬라이드 생성기
  - 소재: 대화 맥락 + 사용자 제공 자료 중심 (피처 문서·git log 는 선택 소스)
  - `/vais brief {주제}` = 문서형 기본, `--deck` 플래그 = 16:9 슬라이드형
  - 파이프라인 재사용: 아웃라인 승인 1회 → 브랜드 토큰 → 생성 → self-critique QA
    (`skills/report/design-rules.md` · `templates/report.html`/`deck.html` 참조 — 복제 금지)
  - 산출 기본 경로: `reports/{YYYY-MM-DD}-{slug}.html` — 아웃라인 승인 때 경로 함께 확정
- 기존 `skills/report/SKILL.md` 를 피처 전용으로 축소 — 주제 모드 제거, 주제 요청이 오면 `/vais brief` 안내 1줄
- 라우팅·문서 반영: `skills/vais/SKILL.md` 액션 표 + 실행 절, `skills/vais/utils/help.md`, `README.md`, `CLAUDE.md` 구조/워크플로우 절
- `scripts/vais-validate-plugin.js` 가 skills 구조를 검사한다면 brief 반영

**Out**
- pptx 생성 격상 없음 — 기존 "요청 시 pptxgenjs 옵션" 유지
- design-rules.md·템플릿 HTML 내용 변경 없음
- brand new 플로우 변경 없음 (brief 에서도 기존 브랜드 결정 로직 그대로 사용)

## 접근

- 변경 파일: `skills/brief/SKILL.md`(신규) · `skills/report/SKILL.md` · `skills/vais/SKILL.md` · `skills/vais/utils/help.md` · `README.md` · `CLAUDE.md` (+ 필요 시 validator)
- brief SKILL.md 는 report SKILL.md 골격을 참조하되 성격·소재·경로 절만 다르게 작성.
  공통 규칙(디자인 룰, 자체 포함 HTML, 인라인 SVG, 수치 날조 금지)은 참조로 연결.
- report SKILL.md 파이프라인 1단계를 "피처 문서 3파일 + git log" 로 고정하고,
  등록되지 않은 피처명이 오면 brief 안내 후 종료하도록 1줄 추가.
- 커밋 시 minor 범프 예상 (신규 사용자 향 커맨드) — `/vais commit` 에서 확인.

## 완료 조건

- [ ] `npm test` green + `node scripts/vais-validate-plugin.js` 통과
- [ ] `/vais brief {주제}` 가 skills/brief/SKILL.md 로 라우팅되는 경로 존재 (SKILL.md 표 + 실행 절)
- [ ] report SKILL.md 에 주제 모드 잔재 없음 (`{주제|feature}` 표기 제거 확인)
- [ ] help/README/CLAUDE.md 세 문서의 커맨드 목록에 brief 반영, report 는 피처 전용으로 표기
