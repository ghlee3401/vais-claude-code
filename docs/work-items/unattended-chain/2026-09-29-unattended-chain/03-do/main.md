---
schema: vais-phase/v1
work_item: WI-2026-09-29-unattended-chain
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 자동 진행 전 마찰 제거 (unattended-chain U1) · 수정 회차 4

수정 회차 4(독립 QA FAIL + drift 뒤, 한도 마지막): 넓히지 않고 좁혔다. 조각의 첫 단어는 맨 식별자(`BARE_COMMAND_WORD`: 역슬래시·따옴표·`$`·백틱·brace 거부)여야 하고 목록 단어 뒤는 공백이나 끝이다. 읽기 목록을 4.3.0 원래 목록으로 되돌렸다(회차 1~3 에서 더한 필터 전부 제거). 검사 명령은 `--` 전달 인자를 받지 않고, npm 스크립트는 플래그 없음, eslint 는 경로만, `node --test` 는 경로와 이름형 플래그(`--test-reporter=dot|spec|tap|junit`·`--test-only`·`--test-concurrency=N`·`--test-name-pattern=`)만 받는다(`checkArgumentsReason`; Design §12 의 "경로만" 을 이름형 플래그까지로 명확히 함). rg 의 `--hostname-bin` 을 위험 플래그에. 자체 점검으로 셋을 더 닫았다: 따옴표 밖 역슬래시(`-e\xec` 가 `-exec` 이 되는 경로)와 brace 확장은 `segmentCommand` 가 명령 전체를 거부하고, 검사 명령은 프로젝트 루트에서만 돌며(`cd <scratchpad>; npx eslint .` 의 설정 파일 탈취 차단), `node --test` 는 `tests/` 아래 경로만 받는다. TC-003 허용 예를 목록에 맞게 바꾸고 거부 예 26개를 더했다.

수정 회차 3: `sort`·`uniq`·`file` 제외, 붙여 쓴 `-o…`·약어 `--out…`·git `--ext…`·eslint 코드 로드 플래그, ID 보정의 앞 글자 조건. 회차 2: ANSI-C·로케일 따옴표 거부, node 스크립트는 플래그 없는 첫 인자만, brace 비글자, ID 보정은 문장 부호 앞만. 회차 1: 리다이렉션·`cd`·스크립트 대상은 글자 경로만, ID 보정 뒤 글자에 한글 포함.

Design 안대로 main voice 가 직접 구현했다(위임 없음). 억지력의 뼈대(범위 밖 쓰기 차단·파괴 명령 거부·Stop 잠금·독립 QA)는 그대로고, 뜻이 같은데 형식·시각 때문에 나던 거부만 runtime 이 흡수한다.

## 변경

- REQ-001 인가 유지: `authorization-store.js` 에 `peek`·`revive`, 새 `authorization-continuity.js` 의 `resolveSessionAuthorization`. write guard·drift·stop·agent-handoff hook 과 `phase-transaction.assertTransactionAuthorization`, prompt hook 이 이 경로를 쓴다. 읽기 명령도 Work item 이 있으면 `touch`.
- REQ-002 형식 보정: `phase-check.normalizeIdentifiers` 를 `runPhaseTransaction` 이 적용하고 `evidence/identifier-normalization.json` 과 CLI `corrections` 에 보인다. `compareReviewTestCases` 가 추가 TC 를 `warnings` 로. `describeRequiredSections` 를 prompt hook 이 붙인다.
- REQ-003 셸 정책: 새 `shell-policy.js`(`segmentCommand`·`parseRedirections`·`DESTRUCTIVE_COMMANDS`). `write-policy.authorizeCommand` 가 조각마다 `authorizeSegment`(맨 단어 → 파괴 목록 → runtime 명령 → 위험 플래그 → `cd` → scratchpad 스크립트 → 분류 → 검사 인자 규칙)와 `redirectionReason` 을 적용한다. write guard 가 hook `cwd` 를 넘긴다.
- REQ-004 문구 유지: `naming.normalizeSentence` 를 router 와 CLI `ledger add` 에 적용.
- REQ-005 이름 유지: `AuthorizationStore.rememberName`·`pendingName`·`forgetName`. prompt hook 과 CLI `plan present` 가 이를 본다.
- REQ-006 문서·버전: CLAUDE 규칙 14·18·19·20·10-1·mode 절, README, ONBOARDING, design.md, roadmap.md, CHANGELOG [4.4.0], 버전 6면+README 배지.
- 테스트: 새 `tests/v2-unattended-chain.test.js`(TC-001~006), `tests/v2-phase-transaction.test.js` 갱신, 회귀 장면 F, `tests/v2-scope-sections.test.js` 완화.

## 증거 · 검증

- 회차 4 뒤 `npm test` 전부 통과, `npm run regression` 7 suite 11 test 통과, `npm run lint` 경고 0, `node scripts/vais-validate-plugin.js` 오류 0, `npm run doctor` fail 0 (warn 2 는 이전부터).
- readiness check: test · lint · plugin-validator 를 `do ready` 가 실행한다.
- 독립 QA 네 회차가 각각 진짜 우회(미확장 경로, ANSI-C 따옴표, 도구 출력 옵션, 명령 단어 이스케이프·검사 인자)를 잡았고 모두 테스트로 고정했다. 회차 3 의 QA 는 bash 를 실제로 돌려 증명하다 루트에 빈 파일 `trncate` 를 남겼고 drift hook 이 이를 잡아 Design 으로 되돌렸다(억지력 작동). 그 파일은 write scope 밖이라 사용자가 지운다.
- 오탐으로 남는 것: `grep -o`, `diff -u`, `echo`, `cut` 같은 명령의 거부. Read·Grep 도구나 인가 아래 write scope 명령으로 대체한다.
- 미검증: 실행 중 플러그인은 4.3.0 캐시 사본이라 이 세션의 guard·hook 은 옛 규칙으로 돌았다. 새 규칙의 실사용 확인은 push·업데이트 뒤 다음 작업에서 한다.
