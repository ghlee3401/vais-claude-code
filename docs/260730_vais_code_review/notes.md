---
feature: 260730_vais_code_review
updated: 2026-07-31
---

# 260730_vais_code_review — Notes

> 결정·발견을 한 줄씩 append. 형식: `- YYYY-MM-DD: {결정} — {근거}`

- 2026-07-30: 전체 리뷰 착수 — vais 미사용, 소스 직접 정량 분석
- 2026-07-30: 진단 확정 "조직 시뮬레이션이 수단→목적 전도" — phase당 15-20k 토큰, 피처당 문서 17개 실측
- 2026-07-30: 재편 방향 = 이력/지침 분리 + 승격 루프 — 사용자 합의 (D1~D11 위임 결정)
- 2026-07-31: Phase 0 완료 (2651c7c) — agents 등록 80→53, session-start 5,976→147B, mcp-validator 삭제
- 2026-07-31: Phase 1 완료 (42a8ec8) — guidelines 3파일, 크기 예산제 채택 (지침 비대화 재발 방지)
- 2026-07-31: Phase 2 완료 (4f20472) — 3-phase 전환. 구 테스트는 삭제가 아니라 새 기대값 갱신 원칙
- 2026-07-31: Phase 3 완료 (05efac9, aad3c7e) — -37,489줄. catalog 시스템은 "유지" 계획을 정정해 폐지 (artifact policy 시스템 자체가 사라져 존재 이유 소멸)
- 2026-07-31: Phase 4 완료 (01daca4) — report/deck 생성기 + dogfood 8/8. 차트는 SVG 직접 생성이 라이브러리보다 스타일 제어 우위 확인
- 2026-07-31: Phase 5 완료 — v2.0.0 동기화 5곳 + 문서 4종 재작성. validator가 버전 동기화를 기계 검증하도록 편입
