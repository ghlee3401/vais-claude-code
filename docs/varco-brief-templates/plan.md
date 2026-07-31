---
feature: varco-brief-templates
updated: 2026-07-31
---

# varco-brief-templates — Plan

## 요청 원문

> vais에 그냥 흡수해. 마치 원래 있었던 것처럼. gitignore 안해도 돼. 그리고 이건 ppt용으로
> 만든거여서 내용이 ppt 관련한 것들이 있을거야. html 용으로도 하나 만들면 좋을거 같아.
> 그건 니가 '/home/ghlee0304-ubuntu/Share/vaetki-report.html' 이걸 참고해서 흡수해주면
> 좋을거 같아. (…) 색상에 대한 것은 ppt용을 주로 쓰면 좋을거 같은데, 뭐 조금 더 추가해도
> 좋을거 같고.
>
> (맥락: 내용 구성은 Claude 자유, 양식·디자인은 플러그인에 박는다는 방향 합의.
> 소스: `~/Share/바르코 기술 보고서 템플릿/varco-report-plugin/` 의 VARCO 덱 양식)

## 범위

**In**
- VARCO 덱 양식 흡수 → `skills/brief/template/` (deck.html + assets/ + deck-stage.js + image-slot.js)
  - 양식 규칙은 `skills/brief/varco-deck.md` 로 이식 (원본 SKILL.md 를 vais 경로에 맞게 조정)
- 문서형 양식 신규 제작 → `skills/brief/template/report.html`
  - 구조는 vaetki-report.html 참조: sticky 사이드바 목차 / doc-head / 번호 섹션(h2·h3 .num) /
    콜아웃 4종(why·dec·key·todo) / figure 프레임(인라인 SVG + figcaption) / 표·pill / 인쇄 CSS
  - 색상은 VARCO 덱 토큰을 기본으로 재조색 (#4339C7 primary · #F34F7A pink · #64DEC7 mint
    · amber · Pretendard), 필요한 보조색 소폭 추가 허용
  - **VAETKI 보고서의 내용(기술 텍스트·수치·링크)은 흡수 금지** — 구조·스타일·figure 패턴만.
    스켈레톤에는 자리표시자 샘플만
  - 양식 규칙은 `skills/brief/varco-report.md` 신규 작성
- `skills/brief/SKILL.md` 재작성 — VARCO 양식 고정 노선:
  - 기본 = 문서형(report.html), `--deck` = 덱(deck.html)
  - 내용 구성(스토리라인·섹션 선택)은 Claude 자유 + 아웃라인 승인 1회 유지
  - 브랜드 선택 단계 제거 (양식이 스타일 고정) — 기존 brand 파이프라인은 report/deck 스킬에 존치
- 문서 반영: CLAUDE.md 구조 줄, README 한 줄, CHANGELOG (커밋 시)

**Out**
- 기존 `/vais report`·`/vais deck`(피처 전용, brand 기반) 변경 없음
- 원본 `~/Share/` 폴더 수정 없음. varco-report-plugin 별도 배포 없음
- gitignore 처리 없음 (사용자 결정: 공개 repo 커밋 허용)
- Pretendard CDN `<link>` 는 덱 양식 정체성으로 유지 — vais 의 "CDN 금지" 규칙의 명시적 예외로 기록

## 접근

- 변경 파일: `skills/brief/template/*`(신규 6파일) · `skills/brief/varco-deck.md`(신규) ·
  `skills/brief/varco-report.md`(신규) · `skills/brief/SKILL.md`(재작성) · `CLAUDE.md` · `README.md`
- 덱은 파일 복사 + 파일명 `deck.html` 로 정리 (내부 상대 경로 유지되므로 안전).
- 문서형 스켈레톤은 vaetki CSS 골격을 VARCO 토큰으로 재조색해 새로 작성 (~400줄).

## 완료 조건

- [ ] `skills/brief/template/` 에 deck.html + report.html + assets 2 + js 2 존재, 원본과 대조
- [ ] report.html 에 VAETKI 내용 문자열 없음 (`VAETKI|Ministral|SuperTReX|Mistral` grep 0건)
- [ ] SKILL.md 가 두 양식·두 규칙 파일을 참조하고 브랜드 선택 단계가 없음
- [ ] `npm test` green + validator 통과, CLAUDE.md/README 반영
