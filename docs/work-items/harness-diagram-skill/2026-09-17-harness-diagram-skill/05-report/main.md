---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-diagram-skill
phase: report
revision: 1
status: completed
based_on: []
frozen: true
---

# Report

## 최종 결과

diagram-design(MIT, main@9874ad7)을 우리 사정에 맞게 고친 스냅샷 skills/diagram 동봉: 한국어 SKILL.md, 유형 11종, 스타일 규칙, 템플릿 2, LICENSE. /vais diagram 이 그 턴의 write scope 에 docs/diagrams(설정 가능)를 넣고, diagram export 가 SVG·PNG 를 만들며, 3단계 흐름 파일 .html 은 do ready 가 PNG 로 렌더하고 .mmd 는 그대로 통과. 버전 4.2.0. 검증: test 241/241, 회귀 10/10, lint 0, plugin-validator·secret-scan PASS, 독립 QA PASS. 증명 그림: 03-do/evidence/diagram/desktop.png (VAIS 사용자 루프 흐름도, Chrome 캡처).

## 최종 승인

Final approval: approved.

## 변경

- skills/diagram/**
- contracts/chain-stages.json
- schemas/chain-stage.schema.json
- lib/workflow/v2/router.js
- lib/workflow/v2/write-policy.js
- lib/workflow/v2/config.js
- lib/workflow/v2/id-chain.js
- lib/workflow/v2/diagram.js
- lib/workflow/v2/index.js
- hooks/workflow-v2-prompt.js
- scripts/vais-workflow-v2.js
- vais.config.json
- .gitignore
- tests/**
- README.md
- CLAUDE.md
- ONBOARDING.md
- docs/harness/design.md
- CHANGELOG.md
- package.json
- package-lock.json
- .claude-plugin/**
- docs/diagrams/**

## 검증 증거

- [Independent Review](../04-review/main.md)

## 요구사항

- REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 (see canonical Plan and Review)

## 잔여 제한

- 원본 예제 assets/example-*.html 은 authorization 30분 안에 복사하지 못해 동봉하지 않았다. 유형 참조의 Examples 줄이 없는 파일을 가리키므로 다음 작업에서 references/ 에서 복사하거나 그 줄을 지운다
- diagram export CLI 는 실행 중 캐시(4.1.0)에 없어 테스트로만 확인했다. push 와 플러그인 4.2.0 업데이트 뒤 실제 사용이 첫 실행이다
- 하네스 빈틈: Design 이 시킨 사용자 행동(clone, .gitignore)이 두 번 저장소 변경 감지로 잡혀 Do 가 Design 으로 되돌아갔고, authorization 30분(workflowV2.authorizationTtlMs)이 큰 Do 에 짧아 한 번 만료됐다. drift 예외 경로와 TTL 기본값 상향이 다음 하네스 작업 후보다
- 독립 QA specialist 가 네 작업 연속으로 handoff 에 files 항목을 넣거나 문자열 한도를 넘겨 재출력을 받았다(이번 3회). agents/v2-specialist.md 지시문에 출력 계약 표와 읽기 전용 files 금지를 못 박는 것이 1순위 후보다
- docs/harness/design.md 대응표 행에 docs/diagrams 문자열이 없다(내용은 있음). 다음 문서 작업에서 한 단어 보강

## 정본 링크

- [Plan](../01-plan/main.md)
- [Design](../02-design/main.md)
- [Do](../03-do/main.md)
- [Review](../04-review/main.md)
