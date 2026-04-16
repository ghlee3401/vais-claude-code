---
name: plan
version: 0.50.0
description: Plan phase 진입점. C-Level 라우터를 통해 실행. ideation 자동 참조 로직 포함.
---

## Plan Phase 진입

`/vais plan`은 직접 실행되지 않습니다. **`/vais {c-level} plan {feature}`** 형태로 사용하세요.

예시:
- `/vais cto plan my-feature` — 기술 구현 기획
- `/vais cpo plan my-feature` — 제품 기획
- `/vais cbo plan my-market` — 비즈니스/마케팅 기획

## Ideation 자동 참조 (v0.50)

`/vais {role} plan {topic}` 진입 시:

1. `docs/00-ideation/{role}_{topic}.md` 존재 확인
2. 존재하면:
   - 4 섹션 파싱 (Key Points / Decisions / Open Questions / Next Step)
   - Plan 시스템 프롬프트에 "**See prior ideation:**" 블록으로 주입
   - `plan_referenced_ideation` 이벤트 기록
3. 존재하지 않으면:
   - 기존 plan 흐름 그대로 실행 (SC-12 호환)
4. 파일 존재하지만 4 섹션 미충족:
   - warn 로그 후 "ideation 없음" 처리 (폴백 안전장치)

CTO가 전체 PDCA를 오케스트레이션:
  plan → design → do (frontend-engineer + backend-engineer 병렬) → qa → report

각 단계 완료 시 해당 C-Level이 확인을 요청합니다.
