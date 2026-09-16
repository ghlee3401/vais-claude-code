---
schema: vais-phase/v1
work_item: WI-2026-09-15-harness-health
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 안전·건강 (harness-health, 로드맵 H1)

## 한 줄 요약

하네스가 조용히 죽거나 엉뚱한 이름을 붙이거나 읽기까지 막는 결함 7건을 고치고, 비상 스위치·건강검진(doctor)·버전 도장·회귀 골격을 넣는다. 설계 정본 `docs/harness/design.md` 12절 결함 1~5·7·12 와 로드맵 H1 이 근거다.

## 1. 문제

설계 정본 12절에 기록된 커널 결함 중 H1 배정분: mode 오타 시 무음 비활성(1), 한글 요청 해시 slug(2), lease 60초 하드코딩·설정 미사용(3), 읽기 명령·scratchpad 차단(4), router 평가 문장(5), Plan 수정 초안 경로(7), 비상 스위치·doctor 부재(12). 여기에 첫 작업 QA 가 남긴 문서 경미 결함 3건이 있다.

## 2. 목표

하네스가 고장·오설정 상태를 스스로 알리고, 이름·범위·시간 규칙이 설정과 문서대로 동작하며, 이후 H2~H8 이 안전하게 자기 수정을 할 수 있는 바탕을 만든다.

## 3. 범위

포함: hook 4종·write-policy·router·naming·store·CLI 의 결함 수정, doctor·회귀 골격·버전 도장 추가, 관련 테스트, 문서 3건 손질, 버전 동기화.
제외: 사슬 단계(H2), 장부·브리핑·상태 줄·Stop 잠금(H3), UI(H4), 명령 다섯 중 doctor 외(H5), 플러그인 배포.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | mode 값을 대소문자·공백 무시로 정규화하고, 미허용 값이나 hook 예외 시 매 프롬프트 첫 줄에 비활성 경고를 주입한다. | `Enforce` 로 정상 동작, `enforcee` 로 경고 주입, 예외 시 경고 주입 테스트 통과. |
| REQ-002 | 비상 해제 스위치 환경변수 `VAIS_HARNESS_OFF=1` 로 모든 hook 이 즉시 통과하고 비활성 표시를 남긴다. | 스위치 켜짐 시 guard 차단 0, 경고 1줄 테스트 통과. |
| REQ-003 | 읽기 전용 명령(`git -C <경로> status/diff/log/show` 포함)과 프로젝트 밖 임시 경로 쓰기를 authorization 없이 허용한다. | 해당 명령·경로 허용, 쓰기 명령은 여전히 차단 테스트 통과. |
| REQ-004 | lease 시간·authorization TTL·managed prefix 를 `vais.config.json` 에서 읽는다. | 설정값 변경이 동작에 반영되는 테스트 통과. 기본값은 코드에 남긴다. |
| REQ-005 | 요청에 영어 단어가 없을 때 해시 대신 사용자가 확인한 이름을 쓴다. | hook 이 이름 확인을 요청하고, CLI 가 확인된 이름을 받아 Work item 을 만든다. |
| REQ-006 | router 에서 평가용 승인 문장 8개를 제거하고 `help` 를 읽기 명령으로 추가한다. | 제거된 문장이 승인으로 인식되지 않고, `/vais help` 가 명령 표를 낸다. |
| REQ-007 | Plan 수정 시 초안 경로를 `01-plan/draft.md` 로 통일한다. | hook 지침과 write scope 가 같은 경로를 가리킨다. |
| REQ-008 | 모든 transaction receipt 에 플러그인·Node·Claude Code 버전 도장을 찍는다. | receipt schema 에 `runtime` 필드가 있고 검증을 통과한다. |
| REQ-009 | `scripts/vais-doctor.js` 와 `/vais doctor` 가 설정·hook 등록·파일 존재·캐시 대 repo 버전·Node 버전·상태 파일·죽은 설정 키를 점검하고 고치는 법을 낸다. | 정상 저장소에서 PASS, 결함 주입 시 항목별 FAIL 표시 테스트 통과. |
| REQ-010 | 회귀 세트 골격 `tests/regression/` 과 `npm run regression` 을 만들고 장면 F(고장) 를 첫 시나리오로 넣는다. | 명령이 동작하고 장면 F 가 통과한다. |
| REQ-011 | 설계 문서 경미 결함 3건을 손질한다: roadmap 절 표기, 요약의 억지력 낱말, diff 요약 담당 파일. | 세 건 반영, 설계 정본 승인 내용은 바뀌지 않는다. |
| REQ-012 | 버전을 3.1.0 으로 6곳 동기화하고 CHANGELOG 에 기록한다. | 6곳 값이 같고 plugin-validator 통과. |

## 5. 사용자 흐름

1. Plan 승인 → Design 에서 파일별 변경·테스트·쓰기 범위 제시 → Design 승인.
2. Do: 실행 중 하네스(캐시 3.0.1)는 그대로 두고 repo 코드를 고친다. 테스트·lint·validator 가 readiness 다.
3. Review: 독립 QA 가 테스트 결과와 결함 시나리오로 REQ 별 판정. PASS 후 최종 승인 → Report.
4. 사용자가 커밋·push·플러그인 업데이트 후 새 세션에서 `/vais doctor` 로 확인한다.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 수정 중 hook 이 깨져 세션이 막힘 | 실행 hook 은 캐시 사본이라 영향 없음. 업데이트 뒤 문제면 `VAIS_HARNESS_OFF=1`. |
| `git -C` 경로가 프로젝트 밖 | 읽기 명령이므로 허용. 쓰기 계열은 계속 차단. |
| 스위치가 켜진 채 커밋됨 | doctor 가 경고. 스위치는 환경변수라 파일에 남지 않는다. |
| 사용자가 이름 확인에 답하지 않음 | Work item 을 만들지 않고 대기. |

## 7. 완료 조건

REQ-001~012 전부 테스트로 증명, `npm test`·`lint`·`validate`·`regression` PASS, 독립 QA PASS, 사용자 최종 승인.

## 8. 영향

hook 4종·lib 6모듈·CLI·schema 1·문서 5 변경. 동작 규칙(승인·범위·단계)은 바뀌지 않는다. 플러그인 업데이트 전까지 실행 중 하네스는 이전 동작을 유지한다.
