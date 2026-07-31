---
feature: varco-brief-templates
updated: 2026-07-31
---

# varco-brief-templates — Notes

- 2026-07-31: VAETKI 참고 파일에서 구조·스타일만 흡수, 사내 기술 내용은 배제하기로 — 공개 repo 유출 방지
- 2026-07-31: brief 는 브랜드 선택 제거하고 VARCO 양식 고정 — 사용자 방향 (내용 자유, 양식 박제)
- 2026-07-31: deck.html 은 원본 md5 일치로 무결성 확인. 폰트는 Pretendard 문자열만 존재(CDN link 없음) — 시스템 폴백 스택
- 2026-07-31: 산출은 폴더 단위 reports/{date}-{slug}/ — 덱이 assets·js 를 함께 요구하므로 cp -r 방식 채택
