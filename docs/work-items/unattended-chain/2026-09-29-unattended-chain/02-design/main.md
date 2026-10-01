---
schema: vais-phase/v1
work_item: WI-2026-09-29-unattended-chain
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 자동 진행 전 마찰 제거 (unattended-chain U1)

## 1. 접근

거부를 없애는 것이 아니라 "뜻이 같은데 형식·시각 때문에 나는 거부" 만 runtime 이 흡수한다. 인가는 세션·Work item·phase 가 일치하면 만료를 활동 기준으로 되살리고, 문서 ID 는 present 가 정규형으로 고쳐 저장하며, 셸은 합성 문자열 전체가 아니라 조각마다 판정한다. 사용자 문구·이름은 등록 전에 정규화하고 세션 단위로 기억한다. 위임 없음, main voice 가 직접 구현한다. 억지력의 뼈대(범위 밖 쓰기 차단·파괴 명령 거부·Stop 잠금·독립 QA)는 그대로다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 인가 유지 | 만료된 인가 + 같은 세션의 tool 호출·phase transaction | 인가가 되살아나 `expiresAt` 이 지금+TTL 로 갱신되고 호출이 진행된다 | 세션 ID 다름 / Work item 이 current·active 가 아님 / phase 불일치 / write scope 가 바뀜 → 지금과 같은 거부 | `AuthorizationStore.peek(sessionId)`(만료 포함 조회)·`revive(sessionId, ts)` 추가. `phase-transaction.assertTransactionAuthorization` 과 write guard·drift·agent-handoff·stop hook 은 `get` 대신 `peek` 으로 읽고, `workItemId` 가 있고 `validateCurrentAuthorization` 을 통과하면 `revive` 한다. 읽기 전용 명령도 Work item 이 있으면 touch. Work item 없는 인가(start-request·기록 토큰)는 TTL 그대로. `authorizationTtlMs` 는 "휴지 시간" 으로 문서화 | TC-001 |
| REQ-002 | 형식 보정 | present 본문(`--body-file`) | (a) 하이픈 누락·1~2자리 ID 를 접두사-세 자리 정규형으로 고쳐 저장, 보정 목록을 receipt `corrections` 와 `evidence/identifier-normalization.json` 에 남기고 CLI 출력에 보인다 (b) Review 의 Design 에 없는 TC 는 check `warnings` 로 통과 (c) hook 지시문에 그 phase 의 필수 절 이름과 규모별 안 한도 숫자 | 접미 글자·4자리 이상 ID → 기존 finding. Design TC 누락·필수 절 누락·안 초과 → 거부 유지 | `phase-check.normalizeIdentifiers(content)` 를 `readBody` 뒤에 적용(`\b(REQ\|TC)\s*[-_]?\s*(\d{1,3})\b` 뒤에 글자·하이픈이 없을 때만). `compareIdentifierSets` 가 `{ findings, warnings }` 를 돌려주고 review TC 의 extra 는 warnings. `schemas/check-result.schema.json` 에 선택 필드 `warnings: string[]`(이 승인이 사전 합의). `phase-check.describeRequiredSections(item, phase)` 가 절 이름 표(`SECTION_LABELS`)와 `OPTION_LIMITS[scale]` 을 문장으로 만들고 prompt hook 의 plan·design·do·review 지침이 붙인다 | TC-002 |
| REQ-003 | 셸 조각 판정 | Bash 명령 문자열 + hook `cwd` | 조각 전부 허용이면 allowed. `>`·`>>`·`&>`·`2>` 대상이 write scope 나 scratchpad 안이면 허용. scratchpad 의 `node <스크립트>` 는 인가 있을 때 check 로 허용(`needsPostDiff`) | 한 조각이라도 미분류·거부면 전체 거부(사유에 조각 표시). 범위 밖 리다이렉션·`rm -rf`·`git push --force`·`--no-verify`·`&` 백그라운드·`eval`·`xargs`·`sudo` 는 거부 | 새 `lib/workflow/v2/shell-policy.js`: `segmentCommand` 가 따옴표를 존중해 `&&`·`\|\|`·`;`·`\|`·줄바꿈으로 나누고 `$( )`·백틱 안쪽을 조각으로 추가, `2>&1` 은 무시. `authorizeCommand(command, authorization, { cwd })` 가 조각마다 기존 `classifyCommand` + 리다이렉션 판정. `UNSAFE_SHELL_SYNTAX` 일괄 규칙은 `DESTRUCTIVE_COMMANDS` 목록으로 대체. write guard 가 `input.cwd` 를 넘긴다. 읽기 목록은 §12 대로 4.3.0 원래 목록 | TC-003 |
| REQ-004 | 문구 유지 | 여러 줄 `/vais 기록`·`저장 확인:`·`되돌리기 확인:` | 토큰과 CLI 본문이 같은 한 줄이라 첫 실행에 성공 | 없음 | `router.js` 가 `ledger-add`·`save-confirm` 의 text/message 를 `normalizeSentence`(줄바꿈·연속 공백 → 공백 하나)로 정규화. `ledger add`·`save commit` 의 confirmation matcher 도 같은 함수로 비교. hook `quote` 는 JSON.stringify 유지(정규화 뒤 `\n` 이 없음) | TC-004 |
| REQ-005 | 이름 유지 | `/vais 이름: X` 뒤 `/vais 확인`·`/vais 상태`·`/vais 없는 대화` | `plan present --slug X` 가 통과 | 새 `이름:` 이 오면 교체. Work item 이 생기면 지움 | `AuthorizationStore.rememberName(sessionId, slug)`·`pendingName(sessionId)`(`authorizations.json` 의 `names` 절, revoke 와 무관). hook `requestSlugFor` 는 `deterministicSlug` 가 null 이면 pendingName. CLI `assertNewFeatureSlug`·`assertStageWorkItemNaming` 도 pendingName 을 본다. `refreshAuthorization` 이 Work item 을 만들 때 이름을 지운다 | TC-005 |
| REQ-006 | 문서·버전 | — | 4.4.0 | — | README(Bash 규칙·인가·형식 보정), CLAUDE 14(조각 판정)·18(보정 내역)·mode 절(휴지 시간), ONBOARDING, design.md §4 억지력·§12 결함 13~17·§13 U1~U4·대응표, roadmap.md U 표, CHANGELOG [4.4.0], 버전 7면 | TC-006 |

## 3. 결정

- 인가 TTL 은 "휴지 시간" 이다. 세션·Work item·phase·write scope 가 일치하는 활동은 만료 뒤에도 인가를 되살리며, Work item 없는 인가(요청 시작·기록 토큰)만 TTL 로 끝난다.
- 뜻이 명확한 ID 형식 오류(하이픈 누락·자릿수 부족)는 runtime 이 고쳐 저장하고 보정 내역을 보인다. 뜻이 바뀌는 오류(접미·4자리)는 계속 거부한다.
- Review 가 Design 에 없는 TC 를 더하는 것은 경고로 허용하고, Design 의 TC 를 빠뜨리는 것만 거부한다.
- 셸 정책은 합성 문자열 일괄 거부에서 조각 판정으로 바꾼다. 쓰기는 리다이렉션 대상 경로로 판정하고, 파괴 명령은 명시 목록으로 거부한다.
- 사용자 문구는 등록 전에 한 줄로 정규화하고, Feature 이름은 세션 단위로 기억해 읽기 명령·확인 프롬프트가 지우지 않는다.
- 범위 `unattended-chain` 은 U1(이 작업)·U2 로그인 fixture·U3 자동 진행·U4 문서 9개와 확인점 순서로 간다. 버전 4.4.0.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 보안 | 필요 — 셸 조각 판정은 억지력의 핵심을 바꾼다. 따옴표·`$( )`·리다이렉션 파서의 우회 사례(닫히지 않은 따옴표, `>` 뒤 공백 없음, `1>`, `>\|`, 프로세스 치환 `>( )`) 를 거부 테스트에 넣고 모호하면 거부한다 |
| 데이터 계약 | 필요 — `check-result.schema.json` 에 `warnings` 선택 필드, `authorizations.json` 에 `names` 절, receipt 에 `corrections`. 이 Design 승인이 사전 합의다 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음(specialist 0). 쓰기 범위: `lib/workflow/v2/**`, `hooks/**`, `scripts/vais-workflow-v2.js`, `schemas/check-result.schema.json`, `tests/**`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/**`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 `npm test`·`npm run regression` 을 재실행하고, po_report 실패 13건의 fixture 재현 결과와 TC 표, 문서·버전 7면을 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | TTL 을 넘긴 시각으로 `do ready`·`review prepare` 호출, write guard 의 Edit·Bash 판정, drift·stop hook 이 같은 세션에서 통과하고 `expiresAt` 이 갱신됨. 다른 세션·다른 Work item·phase 불일치·scope 변경은 거부. start-request 인가는 TTL 뒤 null | 통과 |
| TC-002 | 하이픈 대신 공백·한 자리 숫자·밑줄·소문자 접두사인 ID 세 가지가 3자리 정규형으로 저장되고 corrections 에 남음. 접미 글자가 붙은 ID 와 4자리 숫자 ID 는 finding. Review 에 Design 밖 TC 추가 → warnings 만, Design TC 누락 → finding. hook 지침에 필수 절 이름과 `standard 안 2개` 숫자가 보임(상수와 대조) | 통과 |
| TC-003 | 허용: `cat a.log \| grep FAIL`, `grep -c x a \|\| git status`, `git status; git diff`, `node <scratchpad>/s.js`(인가 있음), `cat a > <scratchpad>/o.txt`, `cat a \| head -5 \| wc -l`. 거부: `cat a > src/x.js`(범위 밖), `rm -rf x`, `git push --force`, `git commit --no-verify`, `ls; touch src/p.js`, `cat $(touch p)`, `grep x a >\| b`, 닫히지 않은 따옴표, `node ./s.js`(scratchpad 밖) | 통과 |
| TC-004 | 3줄 들여쓴 `기록 결정 …` 이 라우터에서 한 줄이 되고 hook 제안 명령을 그대로 실행해 `ledger add` 성공, `저장 확인:` 여러 줄 메시지도 같음 | 통과 |
| TC-005 | `이름: X` → `상태` → `확인` → `plan present --slug X` 통과. `/vais` 없는 대화 뒤에도 유지. 다른 `이름: Y` 는 교체, Work item 생성 뒤 `pendingName` null | 통과 |
| TC-006 | 버전 7면 4.4.0, CHANGELOG, README·CLAUDE·ONBOARDING·design.md·roadmap.md 문구, `npm test`·회귀·lint·validate PASS, `npm run doctor` fail 0 | 통과 |

## 8. rollback

`git checkout -- .` 후 `lib/workflow/v2/shell-policy.js`·새 테스트·fixture 삭제(사용자 실행). 상태 파일은 `authorizations.json` 의 `names` 절만 추가되므로 옛 버전이 그대로 읽는다.

## 9. 수정 회차 1 (독립 QA FAIL, 결정 변경 없음)

QA handoff AS-52fafc4b: 리다이렉션·`cd`·scratchpad 스크립트의 대상은 글자 그대로의 경로만(`~`·`$`·백틱·치환·글롭 거부, 인자 없는 `cd`·`cd -` 거부, `write-policy.isLiteralPath`). ID 보정의 뒤 글자 판정에 모든 문자(한글 포함). receipt 스키마는 범위 밖이라 `corrections` 는 CLI stdout 과 `evidence/identifier-normalization.json` 에.

## 10. 수정 회차 2 (독립 QA FAIL, 결정 변경 없음)

QA handoff AS-ef5e6cd3: `$'…'`·`$"…"` 따옴표 통째 거부. scratchpad `node` 스크립트는 플래그 없이 첫 인자일 때만, brace 는 비글자 경로. ID 보정은 뒤에 공백·줄 끝·문장 부호만 올 때. ONBOARDING 4.4.0.

## 11. 수정 회차 3 (독립 QA FAIL, 결정 변경 없음)

QA handoff AS-80ba9fac: 읽기 목록에서 `sort`·`uniq`·`file` 제외. 붙여 쓴 `-o…`·`-u…`, 약어 `--out…`·`--fix…`·`--write…`, git `--ext…`·`--textc…`, eslint `-c`/`--config`/`--rulesdir`/`--plugin`/`--parser` 를 위험 플래그로. ID 보정은 앞이 줄 처음·공백·문장 부호일 때만.

## 12. 수정 회차 4 (독립 QA FAIL + drift, 결정 변경 없음, 한도 마지막)

QA(AS-20b0ad95, handoff 는 drift 로 미등록)가 명령 단어 안의 역슬래시·brace(`tr\uncate`·`tr{u,}ncate`·`comm\and`)로 읽기 목록을 우회해 인가 없이 범위 밖 파일을 썼고, eslint `-f <경로>` 와 `npm run lint -- -c evil.js` 로 인가 아래 임의 JS 를 실행했다. 네 회차의 발견이 모두 "허용 범위를 넓히면 파서와 군비 경쟁" 을 가리키므로 이 회차는 좁힌다.

- REQ-003 / TC-003: 명령 단어 규칙. 조각의 첫 단어는 글자·숫자·`.`·`_`·`-` 만으로 된 맨 식별자여야 하고(`\`·따옴표·`$`·백틱·`{`·`}` 가 들어 있으면 거부), 읽기·검사 목록의 단어는 뒤에 공백이나 끝이 와야 한다(`\b` 대신 `(?:\s|$)`).
- REQ-003 / TC-003: 읽기 목록을 4.3.0 원래 목록(`rg`·`grep`·`find`·`ls`·`pwd`·`cat`·`head`·`tail`·`wc`·`stat`·`which`, git 읽기 부명령, `sed -n Np`, 안전한 `git branch`, `node --version`, doctor)으로 되돌린다. 회차 1~3 에서 더한 필터(`cut`·`tr`·`jq`·`diff`·`echo`·`printf`·`basename`·`dirname`·`realpath`·`readlink`·`date`·`true`·`false`·`md5sum`·`sha256sum`·`tac`·`nl`·`comm`·`column`·`du`·`df`)는 뺀다. `rg` 의 `--hostname-bin…` 을 위험 플래그에 추가.
- REQ-003 / TC-003: 검사 명령은 `--` 뒤 전달 인자를 받지 않고(`npm test -- …`·`npm run lint -- …` 거부), `npx eslint` 는 `-` 로 시작하는 인자를 하나도 받지 않는다(경로만). `node --test` 는 경로 인자만.
- TC-003 허용 예를 목록에 맞게 바꾸고(`cut`·`tr`·`echo` → `cat`·`head`·`wc`·`git`), 거부 예에 `tr\uncate -s0 src/x.js`, `tr{u,}ncate -s0 src/x.js`, `comm\and rm -rf /`, `"cat" a`, `c\at a`, `npx eslint -f /x/f.js src`, `npm run lint -- -c evil.js`, `npm test -- --x`, `rg --hostname-bin=touch x` 를 넣는다.
- REQ-006: CLAUDE·README·CHANGELOG 의 읽기 목록·검사 명령 문구를 되돌린 목록으로 갱신.
- 오탐(`grep -o`, `diff -u`, `git ls-files -o`, `echo`)은 위험으로 남긴다. 그런 명령은 인가 아래 write scope 명령이나 Read/Grep 도구로 대체한다.
