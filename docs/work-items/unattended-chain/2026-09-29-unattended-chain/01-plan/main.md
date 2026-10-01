---
schema: vais-phase/v1
work_item: WI-2026-09-29-unattended-chain
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 자동 진행 전 마찰 제거 (unattended-chain · U1)

kind: harness (플러그인 자체) · 규모: standard · 관련: 장부 결정 LG-c98b7753(자동 진행 방향), 부채 LG-0775d07a(선행 수정 4개), 메모 LG-313292eb(po_report 실측) · 범위 `unattended-chain` 의 첫 작업(U1). 뒤 작업: U2 로그인 fixture, U3 자동 진행, U4 문서 9개와 확인점.

## 1. 문제

po_report 구성원 관리 16개 작업의 transaction 실패 13건은 전부 하네스 자신이 만든 것이다. 인가 30분 만료 4건(긴 Do 중 `do ready` 가 AUTHORIZATION_REQUIRED, 사용자가 `/vais` 를 다시 쳐야 했음), 문서 형식 거부 6건(ID 의 하이픈 누락·두 자리 숫자, Do 절 누락, Review TC 집합, compact 안 개수), 범위·파일 규칙 2건. 또 셸 합성 일괄 차단이 QA 의 node 스크립트·파이프 검증을 막아 "코드 검토로만 확인" 부채가 반복됐고, 2026-09-29 이 저장소에서 여러 줄 `/vais 기록` 문구가 hook 제안 명령에 `\n` 두 글자로 들어가 토큰과 어긋났으며, `/vais 이름: X` 로 등록한 이름이 다음 `/vais 확인` 프롬프트에서 사라졌다. 자동 진행(U3)은 사람이 없는 동안 이런 거부가 나면 멈추므로, 이 마찰을 먼저 없애야 한다.

## 2. 목표

같은 세션이 같은 Work item 을 계속 다루는 동안 인가가 끊기지 않고, 뜻이 같은 문서는 형식 때문에 거부되지 않으며, QA 와 Do 가 읽기·검사 목적의 셸 합성을 쓸 수 있고, 사용자가 친 문구·이름은 다음 턴까지 그대로 살아 있다.

## 3. 범위

포함: 인가 갱신 규칙, 문서 형식 보정·경고 강등, 셸 정책의 조각 단위 판정, 기록 문구·이름 등록 유지, 회귀 장면, 문서·CHANGELOG·minor 버전. 제외: 로그인 fixture 와 인증 화면 캡처(U2), 단계 자동 승인·orchestrator·잠정 결정(U3), 문서 9개 재편(U4), 상태 머신 이벤트 변경.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 인가 유지: 활성 Work item 의 phase transaction 과 runtime CLI 호출이 성공할 때마다 그 세션의 인가 만료를 연장하고, Do·Review 단계에서 같은 세션·같은 Work item 이면 만료 뒤에도 사용자 재호출 없이 이어 간다. 다른 세션·다른 Work item·phase 불일치는 지금처럼 거부. | 테스트: 인가 발급 뒤 TTL 을 넘긴 시각으로 `do ready` 를 호출해도 AUTHORIZATION_REQUIRED 가 나지 않는다. 다른 세션 ID 는 여전히 거부. |
| REQ-002 | 형식 보정: `plan/design/do/review/report present` 가 (a) 하이픈이 빠지거나 숫자가 세 자리 미만인 ID 를 3자리 정규형으로 고쳐 저장하고 보정 내역을 evidence 에 남기며, (b) Review 에 Design 에 없는 TC 를 더한 것은 경고로 허용하고 Design TC 누락만 거부하며, (c) 필수 절 누락·안 개수 초과는 거부하되 hook 지시문에 그 규모의 필수 절 이름과 안 한도 숫자를 미리 보인다. | po_report 의 실패 6건을 fixture 로 재현해 (a)(b) 는 PASS, (c) 는 지시문에 숫자가 보인다. |
| REQ-003 | 셸 정책: `\|`·`&&`·`;`·줄바꿈·`$( )` 를 일괄 거부하지 않고 조각마다 분류해, 전부 읽기 전용·검사 명령이면 허용한다. `>`·`>>` 는 대상이 write scope 나 scratchpad 안일 때만 허용. scratchpad 안 node 스크립트 실행은 인가가 있을 때 검사 명령으로 허용하고 post-diff 를 남긴다. `rm -rf`·`git push --force`·`--no-verify`·mutating find 는 계속 거부. | 테스트 표: 허용 6개(파이프 grep, scratchpad 리다이렉션, node 스크립트 …)·거부 6개(범위 밖 리다이렉션, 파괴 명령 …). |
| REQ-004 | 문구 유지: `/vais 기록`·`저장 확인:`·`되돌리기 확인:` 의 사용자 문장에 줄바꿈·들여쓰기가 있으면 hook 이 토큰 등록 전에 한 줄로 정규화하고, 제안 명령의 인용은 셸에서 그대로 통하게 만든다. | 여러 줄 기록 문구 회귀: 제안 명령을 그대로 실행해 `ledger add` 1회 성공. |
| REQ-005 | 이름 유지: `/vais 이름: X` 로 등록된 requestSlug 는 Work item 이 만들어지거나 다른 이름이 오기 전까지 후속 `/vais` 프롬프트에서 사라지지 않는다. | 회귀: 이름 → `/vais 확인` → `plan present --slug X` 통과. |
| REQ-006 | 문서·버전: design.md §12 결함 표 13~17 과 §13·roadmap.md 의 U1~U4, CLAUDE.md 14번(Bash 규칙)·18번, README 해당 절, CHANGELOG, minor 버전 4.4.0 7면. | grep 통과, `npm run doctor` fail 0. |

## 5. 사용자 흐름

지금: Do 가 30분을 넘기면 `do ready` 가 거부되고 사용자가 `/vais` 를 다시 친다. ID 의 하이픈 한 글자 때문에 present 가 거부되고 한 턴이 든다. QA 가 파이프를 못 써 요소 검사로 물러난다. 여러 줄 기록은 첫 시도가 실패한다. 바뀐 뒤: 사용자는 승인 지점에서만 부른다. 형식은 runtime 이 고치고 고친 내역을 보인다. QA 는 `cat log | grep FAIL` 과 scratchpad 스크립트로 검증한다. 기록·이름은 친 대로 살아 있다.

## 6. 엣지 케이스

- 인가 연장은 같은 세션 ID 에만 적용된다. 세션이 바뀌면 지금처럼 `/vais` 로 시작한다. 인가가 살아 있어도 write scope 는 넓어지지 않는다.
- ID 보정은 하이픈 누락·자릿수 부족처럼 뜻이 명확할 때만 한다. 접미 글자가 붙거나 숫자가 네 자리 이상이면 거부하고 후보를 보인다.
- 조각 판정에서 한 조각이라도 미분류면 전체 거부. 리다이렉션 대상이 상대 경로면 projectRoot 기준으로 판정.
- node 스크립트가 범위 밖 파일을 쓰면 drift hook 이 기록하고 Stop 잠금이 잡는다(기존 억지력).
- 이름 유지 중 사용자가 다른 `이름:` 을 치면 새 이름으로 바뀐다. `/vais 상태` 같은 읽기 명령은 이름을 지우지 않는다.

## 7. 완료 조건

REQ-001~006 충족, `npm test`·`npm run regression`(마찰 장면 신설)·lint·validate PASS, 독립 QA PASS, po_report 실패 13건 중 형식·인가 10건이 fixture 재현에서 사라짐.

## 8. 영향

변경 후보: `lib/workflow/v2/{authorization-store,phase-transaction,phase-check,write-policy,router}.js`, `hooks/{workflow-v2-prompt,workflow-v2-write-guard}.js`, `scripts/vais-workflow-v2.js`, `tests/**`(fixture 포함), README·CLAUDE·`docs/harness/{design,roadmap}.md`·CHANGELOG, 버전 7면. 상태 머신·schemas·contracts 는 바꾸지 않는다. 커밋은 `/vais 저장` 흐름.
