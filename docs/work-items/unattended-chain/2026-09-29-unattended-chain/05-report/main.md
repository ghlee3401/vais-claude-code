---
schema: vais-phase/v1
work_item: WI-2026-09-29-unattended-chain
phase: report
revision: 1
status: completed
based_on: []
frozen: true
---

# Report

## 최종 결과

unattended-chain U1 마찰 제거 완료(4.4.0). 인가 TTL 을 휴지 시간으로 바꿔 같은 세션·current·active Work item 이면 만료 뒤에도 되살린다(authorization-continuity). present 가 하이픈 누락·자릿수 부족 ID 를 고쳐 저장하고 corrections 를 보이며 Review 의 추가 TC 는 warnings, 필수 절·안 한도는 지시문에 미리 보인다. 셸은 조각 판정(shell-policy)으로 파이프·논리합·세미콜론 합성과 scratchpad 리다이렉션·스크립트를 허용하되, 독립 QA 네 회차가 잡은 우회(미확장 경로·ANSI-C 따옴표·도구 출력 옵션·명령 단어 이스케이프·검사 인자)를 모두 막고 읽기 목록은 4.3.0 원래 목록으로 유지한다. 여러 줄 기록 문구는 한 줄로 정규화하고 Feature 이름은 세션 단위로 기억한다. 단위 271·회귀 11·lint 0·validate 0·doctor fail 0.

## 최종 승인

Final approval: approved.

## 변경

- lib/workflow/v2/**
- hooks/**
- scripts/vais-workflow-v2.js
- schemas/check-result.schema.json
- tests/**
- README.md
- CLAUDE.md
- ONBOARDING.md
- docs/harness/**
- CHANGELOG.md
- package.json
- package-lock.json
- vais.config.json
- .claude-plugin/**

## 검증 증거

- [Independent Review](../04-review/main.md)

## 요구사항

- REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006 (see canonical Plan and Review)

## 잔여 제한

- 실행 중 플러그인은 4.3.0 캐시 사본이라 새 guard·hook 규칙의 실사용은 이 세션에서 겪지 못했다. push·버전 업데이트 뒤 다음 작업(U2)에서 실사용을 확인한다.
- 셸 정책 오탐: -o·-u 포괄 거부와 원래 읽기 목록 때문에 grep -o, find … -o …, diff -u, echo, cut 같은 읽기 명령이 거부된다. Read·Grep 도구나 인가 아래 write scope 명령으로 대체한다.
- 인가 아래 scratchpad node 스크립트는 설계대로 무엇이든 할 수 있다. 범위 밖 변경은 drift hook 과 Stop 잠금이 잡는다.
- QA handoff 가 길이 한도로 네 회차 모두 재제출됐고, QA 도중 drift 가 끼어들면 열린 assignment 때문에 같은 회차의 새 QA 를 발급할 수 없었다(같은 agent 를 이어서 검증). 둘 다 U3 자동 진행에서 runtime 보정으로 고친다.
- 회차 3 QA 의 bash 실증이 루트에 빈 파일 trncate 를 남겼다. write scope 밖이라 사용자가 지운다. QA 의 프로젝트 안 실증 금지는 assignment 지침으로만 막았고 runtime 규칙은 아니다.
- receipt 스키마가 범위 밖이라 corrections 는 receipt 파일이 아니라 CLI stdout 과 evidence/identifier-normalization.json 에만 있다.

## 정본 링크

- [Plan](../01-plan/main.md)
- [Design](../02-design/main.md)
- [Do](../03-do/main.md)
- [Review](../04-review/main.md)
