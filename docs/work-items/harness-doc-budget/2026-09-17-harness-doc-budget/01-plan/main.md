---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-doc-budget
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 문서 예산 상향과 설정화 (harness-doc-budget)

kind: harness (플러그인 자체) · 규모: compact · 관련 작업: chain-stages(H2, 예산 도입) 후속

## 1. 문제

단계 문서의 byte 한도(`lib/workflow/v2/document-quality.js`)가 코드에 박혀 있고 값이 낮다. 지난 작업 55개 문서 실측에서 한도의 95% 를 넘긴 문서가 8개, Design standard 는 10,199·10,208·9,756B 로 한도 10,240B 에 붙었고, extended Design 한 건은 28,280B 로 한도를 넘어 예외 승인으로만 통과했다. 한글은 글자당 3B 라 Design standard 는 약 3,400자다. 천장에 붙은 문서는 내용이 없어서가 아니라 깎아서 그 값이 됐고, 깎이면 REQ 별 결정·TC 같은 필요한 내용이 빠진다. 사용자가 "너무 타이트해서 길게 써야 하는 것도 막는다" 고 지적했다(2026-09-17).

## 2. 목표

예산의 원칙(비개발자가 읽을 양, 이전 단계 문장 복사 금지)은 유지하되, 실측에 맞게 기본값을 올리고 프로젝트가 설정으로 조정할 수 있게 한다.

## 3. 범위

포함: 규모 3종 × 단계 5종 기본값, stage kind 단계 문서 예산, `vais.config.json` 의 예산 항목과 검증, 관련 테스트·문서·CHANGELOG·버전. 제외: 80자 이상 문장 복사 금지 검사, extended 예외 승인 절차, 산출물(PNG·HTML) 크기.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 기본 예산을 올린다. 기준: 지난 문서 실측 최대값이 새 한도의 75% 이하가 되도록 규모·단계별로 정한다. | 55개 실측 전부 새 한도의 75% 이하(예외 승인된 28,280B 는 제외하고 별도 표기). |
| REQ-002 | 프로젝트가 `vais.config.json` 에서 예산을 덮어쓸 수 있다. 값이 없거나 잘못되면 기본값을 쓰고, 잘못된 값은 doctor 가 알린다. | 설정 덮어쓰기·누락·오류 세 경우 테스트. |
| REQ-003 | 예산 초과 메시지가 사용자 말로 남은 선택지를 말한다(줄이기, 규모 올리기, 설정 조정). | 메시지에 세 선택지가 보인다. |
| REQ-004 | 문서·버전: README·CLAUDE 규칙 12·design.md 에 새 값과 설정 방법, CHANGELOG, minor 버전(4.1.0) 7면 동기화. | grep 통과, doctor fail 0. |

## 5. 사용자 흐름

지금: Design 을 쓰다 한도에 걸리면 내용을 깎거나 규모를 올려 다시 present 한다. 바뀐 뒤: 같은 문서가 여유 있게 통과하고, 그래도 부족하면 `vais.config.json` 한 줄로 프로젝트 예산을 올린다. 초과 메시지가 무엇을 하면 되는지 말해 준다.

## 6. 엣지 케이스

- 설정값이 기본값보다 작아도 허용한다(더 엄격한 프로젝트). 0 이나 음수·문자열은 오류.
- stage kind 는 단계 문서 예산이 따로 있다 → 같은 비율로 올리고 같은 설정 키 아래 둔다.
- 기존 회귀 세트(장면 A~F)가 예산 경계값을 쓰면 새 값으로 갱신한다.
- 플러그인 캐시 사본은 버전 bump 뒤 업데이트해야 반영된다.

## 7. 완료 조건

REQ-001~004 충족, `npm test`·`npm run regression`·lint·validate PASS, 독립 QA PASS, doctor fail 0.

## 8. 영향

변경 후보: `lib/workflow/v2/document-quality.js`, `config.js`, `doctor.js`, `vais.config.json`(예산 키 추가), `tests/v2-lean-document-quality.test.js`, `tests/v2-chain-stages.test.js`, README·CLAUDE·ONBOARDING·`docs/harness/design.md`, CHANGELOG, 버전 7면. 상태 머신·양식·계약 구조는 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
