---
name: plan
description: 착수 phase — 범위 합의 + plan.md 작성. v2.0
---

# Plan

## 절차

1. **scope probe** — 요청이 30분 내 직접 편집으로 끝나는 규모면: "문서 없이 바로 실행할까요?" AskUserQuestion (바로 실행 / plan 진행). 바로 실행 선택 시 plan 생략하고 작업 후 종료.
2. 요구사항 파악 — 사용자 요청 원문을 축약·재해석 없이 확보. 불명확하면 이 시점에 질문 (작업 중간 질문 최소화).
3. 관련 코드 탐색 — 변경 대상 파일·기존 패턴 확인. **탐색 우선**: 기존 솔루션/패턴 → 신규 작성 순.
   - 신규 컴포넌트·라이브러리 도입 등 되돌리기 어려운 결정이 있으면 `knowledge/architecture-decision.md` Read 후 결정.
4. `docs/{feature}/plan.md` 작성 (`templates/plan.template.md`, ≤80줄):
   - 요청 원문 (인용)
   - 범위 — In (원문 명시 + 기술적 전제조건만) / Out (자발 확장 금지 — 발견한 리스크는 notes.md에 기록만)
   - 접근 — 변경 파일 목록 + 방법 요지
   - 완료 조건 — review에서 대조할 검증 가능한 항목 (테스트 통과, 동작 확인 등)
5. `docs/{feature}/notes.md` 생성 (빈 템플릿).
6. status 갱신: `node -e "require('./lib/status').setPhase('{feature}','plan','completed')"` 상당 (lib/status 사용).

## 규칙

- plan 단계에서 프로덕트 코드 생성·수정 금지 — 산출물은 docs/ 만.
- 접근 방법이 2갈래 이상이고 결과가 실질적으로 다르면 AskUserQuestion으로 사용자 선택. 아니면 직접 결정하고 plan.md에 근거 기록.

## 완료 시

plan.md 핵심(범위 + 완료 조건)을 대화에 표시 → 다음 단계 제안: `/vais do {feature}`.
