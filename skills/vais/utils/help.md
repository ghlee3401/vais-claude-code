---
name: help
description: 사용법 안내. VAIS v2.0 커맨드 목록.
---

### help — 사용법

아래 표를 그대로 표시합니다 (튜토리얼 체인 없음):

| 커맨드 | 설명 |
|--------|------|
| `/vais plan {feature}` | 착수 — 범위·접근·완료 조건 → `docs/{feature}/plan.md` |
| `/vais do {feature}` | 구현 (`--design` 으로 UI 설계 선행) |
| `/vais review {feature}` | 검증 + 지침 승격 루프 |
| `/vais status` | 진행 상태 |
| `/vais init` | 기존 프로젝트에 문서 구조 적용 |
| `/vais commit` | 커밋 (메시지 생성 + 버전 범프 + 확인) |
| `/vais report {주제}` | HTML 보고서 생성 (brand 스타일) |
| `/vais deck {주제}` | HTML 슬라이드 덱 생성 (PDF 변환용) |

- 워크플로우: **plan → do → review** (문서: plan.md / notes.md / review.md 3파일)
- 지침: `guidelines/` — 코드·문서 컨벤션, review 마다 승격 루프로 진화
- 30분 내 소규모 작업은 plan 이 "바로 실행"을 먼저 제안합니다
