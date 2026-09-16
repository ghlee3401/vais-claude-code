---
schema: vais-phase/v1
work_item: WI-2026-09-15-harness-health
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 안전·건강 (harness-health)

## 한 줄 요약

hook 4개와 커널 모듈 6개를 고쳐 하네스가 오설정·고장을 큰 소리로 알리고, 이름·시간·읽기 규칙이 설정대로 동작하게 한다. 오설정은 닫힘으로 실패하고, Feature 이름은 사용자가 직접 말한 것만 통과한다. 새 파일은 doctor 2개와 회귀 테스트 1개뿐이다. QA 1차 지적으로 doctor 실행 경로를 무인가 읽기 명령으로 바꾸고 hook 예외 경로 테스트를 추가했다.

## 1. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 기술 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | mode 정규화 + fail-loud + fail-closed | `workflowV2.mode` 문자열, hook 예외 | `{mode, warning}` | 미허용 값 → enforce 로 취급 + warning | `lib/workflow/v2/config.js` 의 `resolveMode()`(trim·lowercase, 허용 enforce/disabled). 미허용 값이면 `mode:'enforce'` 에 warning 을 붙여 **guard 는 계속 막고** prompt hook 이 `⚠ VAIS 하네스 경고: <이유>` 를 매 프롬프트 첫 줄에 주입. hook 예외는 `failLoudContext(reason)` 가 만든 경고 문맥을 내고 종료(`{}` 금지). 이 함수는 순수 함수라 테스트한다 | TC-001 |
| REQ-002 | 비상 스위치 | env `VAIS_HARNESS_OFF` | hook 통과 + 표시 | 값이 `1`/`true` 아니면 무시 | `resolveMode()` 가 env 를 먼저 보고 `{mode:'off', warning:'VAIS_HARNESS_OFF'}` 반환. 4 hook 공통. 끄는 길은 이 스위치와 정확한 `disabled` 두 가지뿐 | TC-002 |
| REQ-003 | 읽기 허용 | Bash 명령, 파일 경로 | allow/deny | 쓰기 계열은 계속 deny | `write-policy.js` READ_ONLY 에 `git (-C <path>)? status/diff/log/show/rev-parse/ls-files`, `node/npm/npx --version`, `node scripts/vais-doctor.js`, `npm run doctor` 추가. `npm run regression` 은 check 명령. `authorizeFilePath` 가 `os.tmpdir()/claude-*` 하위면 `scratch-write` 로 허용 | TC-003 |
| REQ-004 | 설정 연결·정리 | `workflowV2.{leaseMs, authorizationTtlMs}` | 적용값 | 누락·비정상 → 기본값 | `loadWorkflowConfig(projectRoot)` 를 config.js 에 두고 store·auth store 가 읽음. 기본 60000 / 1800000. 죽은 키 `managedPrefix` 는 config 에서 삭제하고 doctor 가 "알 수 없는 키" 로 잡는다 (Plan 의 "prefix 연결" 문구는 이 Design 으로 대체) | TC-004 |
| REQ-005 | 이름 확인 (사용자 문장에서만) | 영어 단어 없는 요청, `/vais 이름: <slug>` | 확인 요청 문맥, authorization.requestSlug | 확인 없이 present → 거부 | `naming.js` 가 해시 fallback 대신 `null` 반환. hook 은 null 이면 "사용자에게 영어 이름을 물어라" 지침 주입. router action `name-feature`: `/vais 이름: <kebab>` 이 오면 hook 이 검증해 authorization.requestSlug 에 저장. CLI `assertNewFeatureSlug` 는 requestSlug 미확정·불일치를 거부하므로 AI 가 임의 이름을 넣을 길이 없다 | TC-005 |
| REQ-006 | router 정리 + help | 프롬프트 | action | — | `SAFE_APPROVAL_SUFFIXES` 를 "진행" 계열 1개로 축소. `help`/`도움말` → action `help`(읽기). hook 이 명령 표 텍스트 주입 | TC-006 |
| REQ-007 | 초안 경로 통일 | revise-plan | 지침 경로 | — | prompt hook 의 plan 지침이 `01-plan/draft.md` 를 가리킴 | TC-007 |
| REQ-008 | 버전 도장 | transaction | receipt.runtime | 버전 미상 → null | `phase-transaction.js` `runtimeStamp()` 가 `{plugin, node, claudeCode}` 를 receipt 에 추가 (model 은 CLI 가 알 수 없어 넣지 않는다; design.md 8절 표기도 이에 맞춘다). schema 에 optional `runtime` | TC-008 |
| REQ-009 | doctor | 저장소 루트 | 점검표 JSON/텍스트 | 항목별 FAIL + 조치 | `lib/workflow/v2/doctor.js` `runDoctor(root)` 점검 9종. `scripts/vais-doctor.js` CLI. **실행 경로**: `/vais doctor` 는 읽기 action 이라 authorization 이 없으므로, `write-policy.authorizeCommand` 가 runtime CLI 의 `doctor` tail 과 `node scripts/vais-doctor.js` 를 **authorization 없이 read-only 로 허용**한다. 그 외 runtime 명령은 계속 authorization 필수 | TC-009 |
| REQ-010 | 회귀 골격 | — | `npm run regression` | — | `tests/regression/scene-f-harness-failure.test.js` (Enforce·enforcee 닫힘·예외·스위치). package.json script | TC-010 |
| REQ-011 | 문서 손질 | design.md, roadmap.md, README.md | 수정본 | — | roadmap 머리말 "13절", 요약에 "억지력", 대응표에 `diff-summary.js`·`config.js` 행, 오설정 잠금 행, 8절 닫힘 실패·`runtime {plugin, node, claudeCode}` 표기 | TC-011 |
| REQ-012 | 버전 3.1.0 | 6 파일 | 동기화 | 불일치 → validator 경고 | package.json, vais.config.json, plugin.json, marketplace.json ×2, README 배지 + CHANGELOG `[3.1.0]` | TC-012 |

## 2. 전문 영역 판단

| 영역 | 판단 |
|---|---|
| 보안 | 필요 — 읽기 허용 확대가 쓰기 우회를 만들지 않는지(TC-003), 오설정이 열림이 아니라 닫힘인지(TC-001), 이름이 사용자 문장 밖에서 올 수 없는지(TC-005), 무인가 doctor 가 다른 runtime 명령을 열지 않는지(TC-009)를 부정 케이스로 검증. secret-scan 을 review 에 포함 |
| UI/데이터/API | 불필요 |
| 운영·배포 | 불확실 → 제외. 플러그인 업데이트는 사용자 몫, doctor 가 캐시 버전만 알린다 |

## 3. Do 위임과 쓰기 범위

| 담당 | 일 | 쓰기 범위 (write scope) | 순서 |
|---|---|---|---|
| 본 목소리 (cto) | REQ-001~012 전부. 변경이 공통 모듈(config, write-policy)에 얽혀 있어 한 손으로 한다 | `hooks/**`, `lib/**`, `scripts/**`, `schemas/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`, `skills/vais/SKILL.md` | 1: 공통(001·002·004) → 2: policy·router·naming(003·005·006·007·009 경로) → 3: receipt·doctor·회귀(008·009·010) → 4: 문서·버전(011·012) |
| specialist | 없음. 독립성·격리·병렬 조건에 해당하지 않음 | — | — |

## 4. Readiness · Review 검사와 TC

- readiness check: `test`, `lint`, `plugin-validator`
- review check: `test`, `lint`, `plugin-validator`, `secret-scan`

| TC | 검사 | 기대 |
|---|---|---|
| TC-001 | `Enforce` 정상, `enforcee` 에서 guard 가 쓰기를 **막고** 경고 주입, `failLoudContext` 가 예외 메시지를 담은 경고 문맥 반환 | 4경로 기대대로 |
| TC-002 | 스위치 켠 채 write-guard·prompt hook 실행 | 차단 0, 비활성 표시 1줄 |
| TC-003 | `git -C x status` 허용, `git -C x commit` 거부, tmp 경로 쓰기 허용, 프로젝트 파일 쓰기 거부, `node scripts/vais-doctor.js` 허용 | 5건 기대대로 |
| TC-004 | leaseMs=5 로 설정 후 만료 확인, `managedPrefix` 키 없음, doctor 가 알 수 없는 키 보고 | 설정값 반영 |
| TC-005 | 한글만 요청 → slug null·지침 주입, `/vais 이름: reading-log` → requestSlug 저장, 미확정·불일치 present 거부, 형식 위반 이름 거부 | 4건 기대대로 |
| TC-006 | 제거된 8문장 중 3개가 승인 아님, `/vais help` → help action | 기대대로 |
| TC-007 | revise-plan 지침 문자열에 `01-plan/draft.md` 포함 | 포함 |
| TC-008 | plan present receipt 에 runtime.plugin·node 존재, schema 통과 | 존재 |
| TC-009 | 정상 저장소 PASS, 결함 주입 시 항목별 FAIL + fix. **authorization 없이** runtime `doctor` 명령이 허용되고 `plan present` 등 다른 runtime 명령은 여전히 거부 | 기대대로 |
| TC-010 | `node --test tests/regression/*.test.js` exit 0 | 통과 |
| TC-011 | roadmap.md 에 "2.13" 없음, design.md 요약 ≤300자·"억지력" 포함, 대응표 diff-summary 행, 닫힘 실패 문장, 8절 `runtime` 표기 | 기대대로 |
| TC-012 | 6곳 버전 문자열 동일 3.1.0, validator PASS | 동일 |

## 5. 롤백

코드 변경은 커밋 전이면 `git checkout -- <path>`, 커밋 후면 revert 로 되돌린다. 실행 중 하네스는 캐시 3.0.1 이라 이 작업으로 바뀌지 않으며, 업데이트 뒤 문제가 있으면 `VAIS_HARNESS_OFF=1` 로 즉시 해제하고 이전 버전으로 되돌린다.
