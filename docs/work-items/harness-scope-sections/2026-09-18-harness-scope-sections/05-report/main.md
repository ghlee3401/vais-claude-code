---
schema: vais-phase/v1
work_item: WI-2026-09-18-harness-scope-sections
phase: report
revision: 1
status: completed
based_on: []
frozen: true
---

# Report

## 최종 결과

4.3.0 harness-scope-sections. 제품 정본은 단계마다 파일 하나 그대로이고 그 안이 '## 범위: 이름' 절로 나뉜다(항목형 8단계, 01 은 절 첫머리 문제:·목표:). 단계 작업의 Feature 는 범위 이름(사용자 '/vais 범위:' 또는 직전 단계에서 물려받음)이고 slug 는 단계 이름이라 회의록이 docs/work-items/범위/날짜-단계/ 에 쌓인다. stage-document 가 절 밖 항목·다른 범위 항목의 추가·변경·삭제를 막고 커버리지는 범위 안에서 본다. stage status 에 nextIds, docs/README.md 열 '범위 · Feature', 제품 노트 '범위별' 표. '/vais 정리: 범위 X' → '/vais 정리 확인' 이 옛 구조(단계별 Feature 폴더·절 없는 정본)를 범위 하나로 옮기며 안전조건 넷(활성·paused 작업, 다른 세션 lease, 저장 안 된 변경, 정본·index 불일치)에 거부하고 중간 실패는 되돌린다. 이 저장소 authorizationTtlMs 2시간. 단위 257·회귀 10·lint 통과, 독립 QA PASS.

## 최종 승인

Final approval: approved.

## 변경

- contracts/chain-stages.json
- schemas/chain-stage.schema.json
- lib/workflow/v2/**
- hooks/workflow-v2-prompt.js
- scripts/vais-workflow-v2.js
- tests/**
- README.md
- CLAUDE.md
- ONBOARDING.md
- docs/harness/design.md
- CHANGELOG.md
- package.json
- package-lock.json
- vais.config.json
- .claude-plugin/**

## 검증 증거

- [Independent Review](../04-review/main.md)

## 요구사항

- REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007 (see canonical Plan and Review)

## 잔여 제한

- 실제 po_report 복사본 이전은 write guard 로 Do·QA 에서 실증하지 못했고 같은 형태의 fixture 로 대체했다. 플러그인 4.3.0 업데이트 뒤 po_report 에서 '/vais 정리: 범위 member-management' 를 실제로 돌려 확인한다.
- 테스트용 실패 주입 옵션 failAfter·beforeApply 가 commitScopeMigration 에 남아 있다(운영 경로에서는 비어 있음). 이전 후 doctor 결과와 범위 인덱스의 작업 순서는 미검증.
- 옛 정본은 4.3.0 업데이트 뒤 '/vais 정리' 전까지 항목형 단계·기능 작업의 stage-document 검사가 그 명령을 안내하며 막는다(05·09 단계는 영향 없음).

## 정본 링크

- [Plan](../01-plan/main.md)
- [Design](../02-design/main.md)
- [Do](../03-do/main.md)
- [Review](../04-review/main.md)
