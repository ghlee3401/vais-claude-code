---
feature: varco-brief-templates
updated: 2026-07-31
---

# varco-brief-templates — Review

## 완료 조건 대조 (4/4)

- [x] `skills/brief/template/` 6파일 존재 (deck.html·report.html·js 2·assets 2), deck.html 은 원본과 md5 일치
- [x] report.html 에 VAETKI 내용 문자열 0건 — `VAETKI|Ministral|SuperTReX|Mistral|토크나이저` grep 무매치
- [x] SKILL.md 가 varco-report.md·varco-deck.md 두 규칙 참조, 브랜드 선택 단계 없음 (brand 언급은 report 스킬 교차 참조 1건뿐)
- [x] `npm test` 76/76 green + validator 통과, CLAUDE.md/README/help 반영

## 남은 일

- 없음. (security-auditor 스킵 — 템플릿 HTML·markdown 만 변경, 인증/입력 처리 무관)
- 후속 관찰: report.html 스켈레톤은 실사용 1회 후 구성 요소 가감 여지 (첫 /vais brief 실행 때 확인)

## 교훈

- 외부 참고 자료를 흡수할 때 구조·스타일과 내용을 분리해야 한다 — vaetki 참고 파일에는 사내 기술 내용이
  가득했고, 스켈레톤에는 자리표시자만 남겼다. 승격 후보
- 고정 양식(코너 그래픽 EMU 좌표, 토큰 표)은 규칙 문서로 박아야 재생성 드리프트가 없다 — 이미 varco-*.md 로 반영, 별도 승격 불요

승격: 외부 자료 흡수는 구조·스타일만 — 원본의 사내·기술 내용은 배제 → doc-conventions.md
