---
schema: vais-phase/v1
work_item: WI-2026-09-18-harness-scope-sections
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 범위로 묶는 정본과 회의록 (harness-scope-sections)

kind: harness (플러그인 자체) · 규모: standard · 관련 작업: chain-stages(H2, 단계 문서 양식), product-note(H3, 노트·인덱스), harness-guidance-limits(이름 규칙)

## 1. 문제

po_report 에서 4단계까지 진행한 사용자가 docs 를 보고 "로그인 기능인데 산발적이다" 고 했다(2026-09-18). 확인한 실체는 셋이다. (1) 단계 작업의 Feature 이름을 runtime 이 요청 문장의 영어 단어에서 발급해 같은 범위(구성원 관리)의 1~4단계 회의록이 `work-items/login`·`features`·`screens`·`wireframes` 네 폴더로 갈렸다. (2) 정본 `01-requirements.md` 등은 항목이 한 줄로 쌓이고 위쪽 문제·목표 절은 1차 범위 이야기라, 2차 범위(예: 목표 관리)가 붙을 자리가 없고 기능별 덩어리가 보이지 않는다. (3) `docs/features/` 인덱스가 기능이 아니라 단계 이름을 나열한다. 사용자는 폴더를 기능별로 쪼개자고 했고, 논의 끝에 "정본은 단계마다 파일 하나(ID 사슬·커버리지·제품 단위 문서 유지), 그 안을 범위 절로 묶고 회의록도 범위 이름으로 모은다" 로 합의했다. 기존 프로젝트를 새 구조로 옮기는 명령이 필요하고, 다른 세션이 작업 중일 때는 옮기면 안 된다.

## 2. 목표

사용자가 정본을 열면 "이 범위(기능 묶음)의 문제·목표·항목" 이 한 덩어리로 보이고, 회의록은 범위 하나 아래에 단계 순서로 모이며, 기존 프로젝트는 명령 한 번으로 안전하게 옮겨진다.

## 3. 범위

포함: 범위(scope) 개념과 이름 규칙, 정본의 `## 범위: <이름>` 절, 단계 작업이 범위를 물려받는 흐름, 인덱스·제품 노트의 범위 단위 표시, 두 단계 이전 명령 `/vais 정리`, 회귀 장면, 문서·CHANGELOG·minor 버전. 제외: 정본을 기능별 폴더로 쪼개기, ID 번호 체계 변경, feature·ui·bug kind 의 양식 변경(범위 표시만 상속), 단계 순서·진입 조건 변경.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 범위 이름: 1단계(요구사항) 작업을 시작할 때 사용자가 범위 이름(kebab-case)을 정하고, 2~10단계 작업은 같은 범위를 물려받아 Feature 이름으로 쓴다. 영어 단어 추출로 단계 작업 이름을 만들지 않는다. | 회귀 장면 A: 10단계 회의록이 `work-items/<범위>/<날짜>-<단계>/` 한 폴더 아래에 놓인다. 범위 없이 단계 작업을 만들면 이름을 묻는다. |
| REQ-002 | 정본 절: 단계 문서(01·02·03·07·08·10 등 항목형)는 `## 범위: <이름>` 절 아래에 그 범위의 항목을 두고, 01 은 절마다 문제·목표 한 줄을 갖는다. 대상 사용자·제외 같은 제품 단위 절은 문서 위에 한 번. 제품 단위 문서(05 디자인 시스템·09 기술 구조)는 절 없이 그대로. | `stage-document` 검사가 절 밖 항목, 절 없는 문서, 다른 범위 항목 변경을 거부. 기존 ID 사슬·커버리지·stale 검사 결과가 절 도입 전과 같다. |
| REQ-003 | 새 범위 추가: 1단계 작업을 새 범위 이름으로 시작하면 정본 끝에 `## 범위: <새 이름>` 절이 생기고 ID 는 이어서 발급된다. 다른 범위 절은 손대지 않는다. 뒤 단계도 같은 방식. | 회귀: 범위 둘(구성원 관리 → 목표 관리)을 차례로 진행해도 첫 범위 항목이 그대로이고 커버리지는 범위별로 계산된다. |
| REQ-004 | 인덱스·노트: `docs/features/<범위>/main.md` 가 그 범위의 단계·구현 작업을 순서대로 나열하고, 제품 노트 "현재" 표에 범위별 항목·구현됨 수가 보인다. `docs/README.md` 는 범위 열을 갖는다. | Report 마다 재생성된 파일에 범위가 보인다(테스트). |
| REQ-005 | 이전 명령 `/vais 정리: 범위 <이름>` → 제안(무엇이 어떻게 바뀌나 표) → `/vais 정리 확인` → 실행. 정본을 절로 감싸고, 회의록 폴더를 `<범위>/<날짜>-<단계>` 로 옮기고, 상태 파일·chain-index·장부·인덱스의 경로와 Feature 이름을 바꾸며, 자기 snapshot 을 기록해 drift 로 잡히지 않는다. 두 번 돌려도 같다. | 회귀: po_report 와 같은 옛 구조 fixture 를 옮긴 뒤 `stage status`·`doctor` fail 0, 승인 상태·해시 유지, 두 번째 실행은 "변경 없음". |
| REQ-006 | 이전 안전조건: 활성·대기 중 Work item 이 있거나, 다른 세션 lease 가 살아 있거나, 커밋 안 된 변경이 있으면 실행하지 않고 이유와 다음 행동을 말한다. 실패 시 아무것도 바꾸지 않는다. | 세 조건 각각 거부 테스트, 중간 실패 시 원상 복구 테스트. |
| REQ-007 | 문서·버전: README(범위 절·정리 명령), CLAUDE(10-1·10-3 갱신), ONBOARDING, design.md §2·§7 대응표, CHANGELOG, minor 버전(4.3.0) 7면. | grep 통과, doctor fail 0. |

## 5. 사용자 흐름

지금: `/vais 새 제품: po-report` 로 시작하면 단계마다 다른 이름의 폴더가 생기고 정본에는 기능 구분이 없다. 바뀐 뒤: `/vais 새 제품: po-report 범위: member-management` 로 시작하면 이후 단계가 같은 범위를 물려받고, 정본에는 `## 범위: member-management` 절이 생긴다. 두 번째 기능 묶음은 `/vais 범위: goal-tracking 요구사항` 으로 시작해 새 절이 붙는다. 기존 프로젝트는 작업이 없는 때 `/vais 정리: 범위 member-management` → 표 확인 → `/vais 정리 확인`.

## 6. 엣지 케이스

- 범위 이름 없이 `/vais 새 제품` 만 오면 runtime 이 이름을 묻는다(AI 가 만들지 않음).
- 한 화면(S)이 두 범위의 기능(F)을 담을 수 있다 → S 는 만든 범위 절에 두고 부모는 범위를 가로질러 참조 가능. 커버리지는 "그 범위의 F 가 어떤 S 에든 담기는가" 로 센다.
- 05·09 처럼 제품 단위 문서는 절이 없다. 정리 명령도 건드리지 않는다.
- 이전 중 다른 세션이 `/vais` 를 치면 lease 로 거부되거나, 이전이 끝난 뒤 새 상태를 읽는다. 옛 경로 authorization 은 write guard 가 막는다.
- 정리 대상 프로젝트의 정본에 절이 이미 있으면 "변경 없음". 회의록 폴더 이름이 충돌하면(같은 날짜·단계 둘) 접미 `-2`.
- 이 저장소 자신(harness kind, 정본 없음)은 정리 대상이 아니다.

## 7. 완료 조건

REQ-001~007 충족, `npm test`·`npm run regression`(장면 A 갱신 + 정리 장면 신설)·lint·validate PASS, 독립 QA PASS, po_report 복사본에서 정리 명령 실증(작업 회의록 4개 → 한 폴더, 정본 4개 절 감쌈, doctor fail 0).

## 8. 영향

변경 후보: `contracts/chain-stages.json`·`schemas/chain-stage.schema.json`(범위 절), `lib/workflow/v2/{id-chain,naming,router,work-item-store,document-manager,product-note,phase-transaction}.js`, 새 `lib/workflow/v2/migrate-scopes.js`, `hooks/workflow-v2-prompt.js`·`scripts/vais-workflow-v2.js`(`정리` 명령·범위 지침), `tests/**`(fixture 포함), README·CLAUDE·ONBOARDING·`docs/harness/design.md`·CHANGELOG, 버전 7면. 상태 머신 이벤트는 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
