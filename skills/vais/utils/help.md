---
name: help
description: 사용법 안내. VAIS v2.0 커맨드 목록.
---

### help — 사용법

아래 안내와 표를 그대로 표시합니다 (튜토리얼 체인 없음):

**처음이신가요?**

VAIS 는 피처마다 **plan → do → review** 를 돌며 문서 3개(계획/결정 로그/검증)를 남기는 워크플로우입니다. 핵심 규칙은 하나 — 기획 없이 코드를 만들지 않습니다. 대신 30분 내 소규모 작업이면 plan 이 "문서 없이 바로 실행할까요?"를 먼저 제안하므로 작은 수정에 문서를 강요받지 않습니다.

첫 시작은 `/vais plan {기능이름}` — 예: `/vais plan login-error-fix`. 커맨드가 헷갈리면 그냥 자연어로 "로그인 에러 고치고 싶어"라고 말해도 알아서 안내합니다.

| 커맨드 | 설명 |
|--------|------|
| `/vais plan {feature}` | 착수 — 범위·접근·완료 조건 → `docs/{feature}/plan.md` |
| `/vais do {feature}` | 구현 (`--design` 으로 UI 설계 선행) |
| `/vais review {feature}` | 검증 + 지침 승격 루프 |
| `/vais status` | 진행 상태 |
| `/vais init` | 기존 프로젝트에 문서 구조 적용 |
| `/vais commit` | 커밋 (메시지 생성 + 버전 범프 + 확인) |
| `/vais brief {주제}` | VARCO 양식 임원/대외 보고 (`--deck` 으로 슬라이드) |
| `/vais report {feature}` | 피처 문서 기반 HTML 보고서 (brand 스타일) |
| `/vais deck {feature}` | 피처 문서 기반 HTML 슬라이드 덱 (PDF 변환용) |

- 문서는 피처당 3파일: plan.md / notes.md / review.md (`docs/{feature}/`)
- 지침: `guidelines/` — 코드·문서 컨벤션, review 마다 승격 루프로 진화
