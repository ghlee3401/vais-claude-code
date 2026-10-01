---
schema: vais-phase/v1
work_item: WI-2026-09-29-unattended-chain
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 자동 진행 전 마찰 제거 (unattended-chain U1) · 수정 회차 4

독립 QA(clean-room, 읽기 전용) 판정: **PASS** (수정 회차 4, AS-20b0ad95). "repair-4 closes every prior bypass; no piece writes out-of-scope or runs code unauthorized; all checks green". QA 가 scratchpad 스크립트로 60여 사례를 판정해 범위 밖 쓰기·인가 없는 코드 실행 우회가 남지 않았음을 확인했고 단위 271·회귀 11·lint 0·validate 0·doctor fail 0·버전 4.4.0 을 직접 재실행했다. 위험으로 남긴 것: `-o`·`-u` 포괄 거부의 오탐, 인가 아래 scratchpad node 스크립트 실행(설계), `git -c` 는 인가 필요.

회차 0 FAIL(AS-52fafc4b): 미확장 경로·산문 수치 → 회차 1 해소. 회차 1 FAIL(AS-ef5e6cd3): ANSI-C 따옴표 등 → 회차 2 해소. 회차 2 FAIL(AS-80ba9fac): `sort`·`uniq` 출력 옵션 → 회차 3 해소. 회차 3 QA(AS-20b0ad95, bash 실증 중 drift 로 Design 복귀): 명령 단어 이스케이프(`tr\uncate`·`tr{u,}ncate`·`comm\and`)와 검사 명령 인자(`eslint -f`, `npm run lint -- -c`) → 회차 4 에서 넓히지 않고 좁힘: 명령 단어는 맨 식별자, 따옴표 밖 역슬래시·brace 는 명령 전체 거부, 읽기 목록은 4.3.0 원복, 검사 명령은 프로젝트 루트에서만·전달 인자 없이·코드 로드 플래그 없이·`node --test` 는 `tests/` 아래만. 회차 4 의 QA 는 drift 로 열려 있던 AS-20b0ad95 를 그대로 썼다.

## 1. 요구사항 · 검수표

| REQ | TC | 입력 | 출력 | 기대 | 실제 | 판정 |
|---|---|---|---|---|---|---|
| REQ-001 | TC-001 | TTL 1초 인가를 5초 뒤 같은 세션·do/active Work item 으로 조회, `do ready` 호출, guard Edit 판정; 다른 세션·design phase·다른 scope·start-request 인가 | `resolveSessionAuthorization` 결과와 `expiresAt`, transaction 오류 코드 | 같은 세션은 되살아나 `expiresAt` 갱신, 나머지는 null / AUTHORIZATION_REQUIRED | 되살아남(06.000Z), 다른 세션 AUTHORIZATION_REQUIRED, phase·scope 불일치·start-request null | 통과 |
| REQ-002 | TC-002 | 하이픈 대신 공백·한 자리·밑줄·소문자 접두사 ID, 접미 글자·네 자리 ID, 한글 단위·백분율·물결 범위·파일 이름 뒤 숫자, 한글·점·슬래시·글자 바로 뒤 접두사, 문장 부호 앞 느슨한 ID, Design 밖 TC 가 있는 Review, Design TC 가 빠진 Review, stage-features standard Design 지침 | 정규화 문자열·corrections, present 결과·evidence 파일, traceabilityReport findings/warnings, 지침 문장 | 세 가지는 3자리 저장 + corrections, 접미·네 자리는 finding, 산문·백분율·범위·파일 이름·붙은 접두사는 그대로, 문장 부호 앞은 보정, 추가 TC 는 warnings 만, 누락은 finding, 지침에 필수 절과 `안 2개` | 전부 기대와 같음 | 통과 |
| REQ-003 | TC-003 | 허용 17개(읽기 목록 조각 합성, scratchpad 리다이렉션·스크립트, 래퍼, `git diff --cached`, `npm test`·`npm run regression`·`node --test --test-reporter=dot tests/*`·`npx eslint lib hooks`)·거부 61개 명령(회차 4 에서 명령 단어 이스케이프, 따옴표 밖 역슬래시·brace, 목록 밖 도구, 검사 명령 인자·`cd` 뒤 검사, `tests/` 밖 `node --test` 26개 추가), 인용·치환·리다이렉션 파서, guard `cwd` 판정 | `authorizeCommand` allowed/kind/reason, `segmentCommand`·`parseRedirections` 결과 | 허용 목록 전부 allowed, 거부 목록 전부 false 이고 사유에 조각·"bare identifier"·"backslash"·"pass-through"·"project root" 표시 | 전부 기대와 같음 | 통과 |
| REQ-004 | TC-004 | 3줄 들여쓴 `/vais 기록 결정 …`, 원문 여러 줄 인자로 `ledger add`, 여러 줄 `저장 확인:` | 라우터 text, hook 제안 명령, 장부 항목 text | 한 줄로 정규화, 제안 명령에 줄바꿈 없음, 첫 실행 성공 | 전부 기대와 같음, 장부 1건 | 통과 |
| REQ-005 | TC-005 | `이름: my-feature` → `상태` → `/vais` 없는 대화 → `확인` → `plan present`; 이름 두 번 | `pendingName`, hook 지침의 slug, present 결과 | 이름 유지 → 통과 → 소비 후 null, 두 번째 이름으로 교체 | 전부 기대와 같음 | 통과 |
| REQ-006 | TC-006 | 매니페스트 6면·README 배지·ONBOARDING 상태 줄·CHANGELOG·README·CLAUDE·design.md·roadmap.md, `npm test`·회귀·lint·validate·doctor | 버전 문자열·문구 존재·검사 결과 | 4.4.0 일치, 문구 존재, 전부 PASS, doctor fail 0 | 일치, 존재, 단위 테스트 전부 통과·회귀 7 suite 통과·lint 0·validate 오류 0·doctor fail 0 warn 2(기존) | 통과 |

## 2. 엣지 · 제한

- 인가 되살림은 `validateCurrentAuthorization` 을 통과할 때만이라 write scope 가 넓어지지 않는다. Work item 없는 인가는 TTL 그대로다.
- ID 보정은 앞이 줄 처음·공백·문장 부호이고 뒤가 줄 끝·공백·문장 부호일 때만이다. 네 자리·접미 글자는 finding. 코드 펜스 안도 같은 규칙(제한).
- 셸 정책은 4.3.0 읽기 목록 + 조각 판정이다. 오탐: `grep -o`, `find … -o …`, `diff -u`, `echo`, `cut`, `git ls-files -o` 같은 명령이 거부된다(Read·Grep 도구나 인가 아래 write scope 명령으로 대체). 인가 아래 scratchpad `node` 스크립트는 설계대로 무엇이든 할 수 있고 drift hook·Stop 잠금이 범위 밖 변경을 잡는다.
- receipt 파일은 스키마를 지키므로 `corrections` 는 CLI stdout 과 evidence 파일에만 있다.
- QA handoff 의 길이 초과 재제출이 회차 0·1·2 에 각 1회 있었고, 회차 3 QA 의 bash 실증이 루트에 `trncate` 를 남겨 drift 로 Design 에 되돌아갔다(사용자가 지움). handoff 형식 한도 보정과 QA 의 프로젝트 안 실증 금지는 이 작업 범위 밖이라 부채로 남긴다.
- 실행 중 플러그인은 4.3.0 캐시 사본이라 이 세션의 guard·hook 은 옛 규칙으로 돌았다. 새 규칙의 실사용은 push·업데이트 뒤 다음 작업에서 확인한다.

## 3. 증거 (evidence)

- Do readiness(회차 4): `03-do/evidence/checks/test.json`·`lint.json`·`plugin-validator.json` (transaction PT-aa730ecc READY).
- Review: `04-review/evidence/checks/secret-scan.json` pass (RP-8800a4d0), 독립 QA handoff 회차 0 `AS-52fafc4b…`(FAIL) · 회차 1 `AS-ef5e6cd3…`(FAIL) · 회차 2 `AS-80ba9fac…`(FAIL) · 회차 3·4 `AS-20b0ad95-16ea-49ab-ae46-80b98cb30313.json`.
- 테스트: `tests/v2-unattended-chain.test.js`(TC-001~006), `tests/v2-phase-transaction.test.js`(보정 규칙), `tests/regression/scene-f-harness-failure.test.js`(셸 조각·미확장 경로·ANSI-C·출력 옵션·명령 단어).
