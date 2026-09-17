---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-doc-budget
phase: report
revision: 1
status: completed
based_on: []
frozen: true
---

# Report

## 최종 결과

단계 문서 byte 예산 기본값을 약 1.4배(1024 배수)로 올려 H1~H8 실측 최대가 모두 새 한도의 75% 이하가 됐고(standard Design 10,240 → 14,336B 등 20칸), vais.config.json 의 documentBudgets 로 프로젝트가 칸 단위로 덮어쓸 수 있으며(잘못된 칸은 무시 + doctor document-budgets 경고), 초과 finding 이 본문 줄이기·scale 올리기(extended 는 예외 승인)·설정 올리기 세 갈래를 사용자 말로 안내한다. 버전 4.1.0, package-lock 루트 버전 3.0.1 도 정리. 검증: npm test 235/235, 회귀 10/10, lint 0, plugin-validator·secret-scan PASS, doctor fail 0, 독립 QA PASS(테스트 재실행). 세션 브리핑 제안 ②(package-lock 버전)가 이것으로 해소됐다.

## 최종 승인

Final approval: approved.

## 변경

- lib/workflow/v2/document-quality.js
- lib/workflow/v2/config.js
- lib/workflow/v2/doctor.js
- vais.config.json
- tests/**
- README.md
- CLAUDE.md
- ONBOARDING.md
- docs/harness/design.md
- CHANGELOG.md
- package.json
- package-lock.json
- .claude-plugin/**

## 검증 증거

- [Independent Review](../04-review/main.md)

## 요구사항

- REQ-001, REQ-002, REQ-003, REQ-004 (see canonical Plan and Review)

## 잔여 제한

- 새 예산은 push 후 플러그인을 4.1.0 으로 업데이트해야 이 저장소에서도 적용된다. 실행 중 캐시는 4.0.1
- 독립 QA specialist 가 세 작업 연속으로 읽기 전용 handoff 에 files 항목을 넣거나 문자열 한도를 넘겨 재출력을 받았다. agents/v2-specialist.md 지시문에 읽기 전용이면 files 금지와 문자열 한도 표를 못 박는 것이 다음 하네스 작업 후보다(harness-docs-module-count 의 잔여 제한과 같음)
- 예외 승인됐던 extended Design 28,280B 는 새 한도 26,624B 도 넘어 예외 절차가 그대로 필요하다

## 정본 링크

- [Plan](../01-plan/main.md)
- [Design](../02-design/main.md)
- [Do](../03-do/main.md)
- [Review](../04-review/main.md)
