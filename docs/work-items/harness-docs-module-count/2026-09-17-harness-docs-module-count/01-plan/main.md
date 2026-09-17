---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-docs-module-count
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 모듈 수 표기 통일과 기준 줄 손질 (harness-docs-module-count)

kind: harness (플러그인 자체 문서 정리) · 규모: compact · 관련 작업: harness-readme-status-2 의 잔여 제한 2건 해소

## 1. 문제

harness-readme-status-2 에서 `docs/harness/README.md` 는 모듈 38 로 고쳤지만, `CLAUDE.md` 34행 구조도 주석과 `ONBOARDING.md` 33행 흐름도 상자는 아직 "35 모듈" 이다. 같은 저장소의 세 문서가 다른 수를 말한다. 또 README 기준 줄의 "hooks.json 의 최상위 키 수" 는 실제로 `hooks` 키 아래의 이벤트 키 수를 뜻해 표현이 부정확하다. 둘 다 그 작업의 장부 debt 로 남아 있다.

## 2. 목표

세 문서의 모듈 수를 같은 기준(`lib/workflow/v2` 의 `.js` 파일 수, index.js 포함)으로 통일하고, README 기준 줄이 세는 방법을 정확히 말하게 한다.

## 3. 범위

포함: `CLAUDE.md` 구조도 주석의 모듈 수, `ONBOARDING.md` 흐름도 상자의 모듈 수, `docs/harness/README.md` 기준 줄의 hook 이벤트 표현. 제외: 그 밖의 문장, 코드, 모듈 목록 자체의 변경, 버전.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | `CLAUDE.md`·`ONBOARDING.md` 의 "35 모듈" 을 README 와 같은 수·기준으로 바꾼다. 수는 Do 시점에 다시 센다. | 세 문서의 모듈 수가 같고 실제 파일 수와 일치. 저장소에 "35 모듈" 0건. |
| REQ-002 | README 기준 줄의 hook 이벤트 설명을 "`hooks.json` 의 `hooks` 아래 키 수" 로 고친다. | QA 가 hooks.json 을 열어 그 설명대로 세면 5 가 나온다. |
| REQ-003 | 변경을 CHANGELOG `[Unreleased]` 절에 한 줄 덧붙인다. 버전 4.0.1 유지. | 항목 1건 추가, 버전 7면 불일치 0. |

## 5. 사용자 흐름

사용자는 Design 의 바뀔 세 줄을 보고 승인만 한다. 이후 어느 문서를 열어도 모듈 수가 같다.

## 6. 엣지 케이스

- Do 전에 모듈이 추가·삭제됐으면 그 시점 수를 쓰고 README 도 같이 맞춘다(범위 안).
- CLAUDE.md 주석은 한 줄이 길다 → 수만 바꾸고 모듈 나열은 손대지 않는다.
- 잔여 debt 2건은 Report 가 닫는다고 자동으로 지워지지 않는다 → Report outcome 에 해소 사실을 적는다.

## 7. 완료 조건

REQ-001~003 충족, `npm run validate` PASS, 독립 QA PASS.

## 8. 영향

변경 파일: `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/README.md`, `CHANGELOG.md`. 각 한 줄. 코드·계약·상태 머신은 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
