---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-guidance-limits
phase: report
revision: 1
status: completed
based_on: []
frozen: true
---

# Report

## 최종 결과

runtime 이 거부하는 한도를 AI 가 미리 보게 했다. Report outcome 은 500 → 700자, limitation 은 각 300자이며 잘라내기 대신 거부하고, hook 지시문이 두 숫자를 상수(REPORT_LIMITS)에서 끌어와 보인다. assignment 결과에 QA 출력 계약 숫자 표(guidance)가 생기고 Review 지시문·specialist 지시문이 읽기 전용이면 files 금지를 명시한다. 이름: 뒤 문장은 slug 에 붙지 않는다. 버전 4.2.1. 검증: test 245/245, 회귀 10/10, lint 0, plugin-validator·secret-scan PASS, 독립 QA PASS.

## 최종 승인

Final approval: approved.

## 변경

- hooks/workflow-v2-prompt.js
- agents/v2-specialist.md
- lib/workflow/v2/router.js
- lib/workflow/v2/phase-transaction.js
- lib/workflow/v2/contracts.js
- scripts/vais-workflow-v2.js
- tests/**
- CLAUDE.md
- README.md
- docs/harness/design.md
- CHANGELOG.md
- package.json
- package-lock.json
- vais.config.json
- .claude-plugin/**

## 검증 증거

- [Independent Review](../04-review/main.md)

## 요구사항

- REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 (see canonical Plan and Review)

## 잔여 제한

- 실증: 표를 받은 QA 도 첫 handoff 에서 한 칸을 한 글자 넘겨(20자 한도에 21자) 재출력 1회. files 오류와 큰 초과는 사라졌다. 다음은 specialist 가 반환 전에 스스로 돌리는 검증 명령(handoff validate --file)이다
- 새 지시문·guidance 는 플러그인 4.2.1 업데이트 뒤에야 hook 이 실제로 주입한다. 이번 Review 는 CTO 가 같은 표를 prompt 에 직접 붙여 검증했다
- 이름: bad name 은 이제 이름 bad 로 받는다(뒤 문장 무시의 결과). kebab 이 아닌 토큰만 거부된다
- 지난 작업의 부채는 그대로: drift 예외 경로·authorization TTL 30분, 원본 예제 HTML 미동봉, design.md 행의 docs/diagrams 단어

## 정본 링크

- [Plan](../01-plan/main.md)
- [Design](../02-design/main.md)
- [Do](../03-do/main.md)
- [Review](../04-review/main.md)
