---
schema: vais-phase/v1
work_item: WI-2026-09-16-product-note
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 제품 노트 (product-note)

## 1. 접근

기록 지점을 하나로 모은다. 모든 상태 변경은 `WorkItemStore.apply/applySequence` 를 지나므로 장부 append 를 그 잠금 안에 넣는다(실패 시 상태도 커밋되지 않음). 노트·브리핑·상태 줄·제안은 `work-items.json`·`chain-index.json`·`ledger.jsonl` 세 파일만 읽는 순수 함수이고 모델을 부르지 않는다. Stop 잠금은 "상태가 바뀌었는데 장부가 침묵"·"기록되지 않은 repo 변경" 두 신호만 본다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 장부 append·read | entry | `.vais/v2/ledger.jsonl` 한 줄 | schema 위반 → throw, 깨진 줄 → 건너뛰고 `broken[]` | `lib/workflow/v2/ledger.js`: `append(root, entry)`, `read(root)`→`{entries, broken}`, `summarize`. `schemas/ledger-entry.schema.json`: `schema, id(LG-uuid), ts, workItemId, feature, kind(7종), text≤400, why≤400, source{type: transaction·event·user·hook, id}, refs[]`. `fs.appendFileSync`(O_APPEND) 만 쓰고 수정 API 없음 | TC-001 |
| REQ-002 | 이벤트 → 장부 자동 기록 | store 이벤트·payload | 항목 0~n | append 실패 → 전이 실패 | `ledger.entriesForTransition({previous, next, event, payload, transactionId, sessionId})`: `USER_*_APPROVED`→milestone; `USER_DESIGN_APPROVED` 는 Design 정본의 `## 결정` 불릿(≤10, 각≤400자) 또는 stage kind 의 `## 안 N` 제목→decision; `USER_FINAL_REJECTED`·`USER_*_REVISED`→feedback(payload.reason=사용자 원문, hook 이 넣음); `QA_FAIL`→debt(failed check 별); `READINESS_NOT_READY`·`*_BLOCKED`·`REPORT_FAILED`→risk; `REPORT_VALIDATED`→milestone + `input.limitations` 각→debt(phase-transaction 이 payload.limitations 로 전달). `apply`·`applySequence` 의 lockedUpdate 콜백 끝에서 append | TC-002 |
| REQ-003 | 제품 노트 3면 생성 | index·ledger·work-items | `docs/product/{README,roadmap,decisions}.md` | 렌더 실패 → Report FAIL·스냅샷 복구 | `product-note.js`: `renderCurrent`(단계 10 표: 순서·문서·상태 approved/stale n/미작성·항목 수·승인일·작업), `renderRoadmap`(남은 단계 순서 + 제안 3 + `<!-- vais:user -->`…`<!-- /vais:user -->` 사이 보존), `renderDecisions`(kind 별 절, 최신순, 400줄 상한). store 의 `completed` 전이(REPORT_VALIDATED) 안에서 장부 append 뒤 호출해 "작업 완료" 줄까지 담고, auxiliarySnapshots 에 3 파일 추가 | TC-003 |
| REQ-004 | 다음 행동 제안 | 세 파일 | `[{text, command, reason}]` ≤3 | 근거 없으면 빈 배열 | `proposal.js propose(root)`: 우선순위 ① waiting-user Gate 결정(`/vais plan 승인` 등 + 거절) ② blocked 사유 ③ active 이어가기 ④ stale 해소(`/vais 변경 없음 확인: X ← Y`) ⑤ 미작성 다음 단계(kind triggers[0]) ⑥ 열린 debt(최근 3) ⑦ 아무것도 없으면 `새 제품:` 제안 | TC-004 |
| REQ-005 | 세션 브리핑 | hook stdin(cwd, session_id) | `hookSpecificOutput.additionalContext` 한 문단 | 예외 → `⚠ VAIS 하네스 경고` 줄 | `hooks/session-start.js` + `hooks.json` SessionStart. `buildBriefing(root)`: `[feature · phase · status] 지난 세션: <마지막 이벤트 한국어> (<일시>). 열린 결정 n(waiting-user 1/0 + pending 요청), 부채 n(debt), stale n. 제안: ① … ② … ③ …` + "첫 응답 첫 줄에 그대로 보인다". 이벤트 한국어 표는 `ledger.js EVENT_LABELS`. off → 비활성 줄, disabled → `{}` | TC-005 |
| REQ-006 | 상태 줄 | statusline stdin(cwd) | 한 줄 | 루트 없음 → `VAIS · 프로젝트 아님` | `scripts/vais-statusline.js`: `VAIS · {feature} · {phase}/{status} · 다음: {propose()[0].text}` / 활성 없음이면 `VAIS · 활성 작업 없음 · 다음: …`. doctor `statusline` 검사: `~/.claude/settings.json > statusLine.command` 에 `vais-statusline.js` 포함이면 pass, 아니면 warn + 설치 JSON 안내 | TC-006 |
| REQ-007 | Stop 잠금 | Stop stdin(session_id, stop_hook_active) | `{decision:'block', reason}` 또는 `{}` | 예외 → `{}` + stderr | `hooks/workflow-v2-stop.js` `stopDecision(root, input)`: 활성 item 없거나 mode≠enforce → `{}`. 신호 A: `updatedAt` 이 마지막 사건보다 1초 이상 뒤(사건 없는 상태 변경) 또는 장부 필요 사건에 줄 없음. 신호 B: 스냅샷 차이 중 authorization.allowedPaths 밖이고 driftAlerts 에 없는 경로 → "기록되지 않은 변경 n". `stop_hook_active` 면 risk append 후 `{}` | TC-007 |
| REQ-008 | doctor 확장 | repo·home | 검사 4종 추가 | — | `ledger`(깨진 줄 → fail, 없음 → pass), `hook-events`(UserPromptSubmit·PreToolUse·PostToolUse·SessionStart·Stop 5종 등록 아니면 fail), `statusline`(REQ-006), `chain-stale`(stale>0 → warn + confirm 명령) | TC-008 |
| REQ-009 | Design 지침에 장부 주입 | item.primaryFeature | 지침 줄 ≤5 | 없으면 생략 | prompt hook `main` 이 `ledger.recent(root, {feature, kinds:[feedback,preference,debt], limit:5})` 를 `options.ledgerLines` 로 넘기고 `phaseGuidance` design 분기가 "이 feature 의 장부(최근 5): - [debt] …" 를 붙인다 | TC-009 |
| REQ-010 | H2 잔여 결함 | — | — | — | `artifactExists`: 값에 `..` 세그먼트·절대경로면 false, resolve 결과가 `artifactDir` 아래가 아니면 false. `computeStale`: upstream 없음 → `{…, currentHash:null, parentMissing:true}` 로 stale, `confirmUnchanged` 는 parentMissing 이면 throw. TC-008 scope 테스트: authorization·item 을 실제로 만들어 `must stay under docs/product` 로 거부 확인 | TC-010 |
| REQ-011 | 장면 E | fixture 01 | 통과 | — | `tests/regression/scene-e-session-resume.test.js`: `leaseMs:1000`. 세션 A: plan→승인→design present(waiting-user). 세션 B: `buildBriefing` 검증(상태·지난 세션·열린 결정 1·제안 ① design 승인) → 만료 lease 재취득 → 승인·do ready·QA fixture·decide·최종 승인·finalize → `decisions.md` milestone 4·README 1단계 approved·roadmap "2단계". Stop: 정상 `{}`, `updatedAt` 미래 → block, `stop_hook_active` → `{}`+risk | TC-011 |
| REQ-012 | 문서·버전 | — | 3.3.0 | — | roadmap H2 완료·H3 진행, design.md 대응표(장부·노트·제안·브리핑·상태 줄·Stop 완료), CLAUDE(hook 5종·규칙 10-4 장부·Stop)·README·ONBOARDING, CHANGELOG `[3.3.0]`, 버전 5파일 + README 배지. 테스트 fixture 문자열은 secret-scan 허용 값만 쓴다 | TC-012 |

## 3. 결정

- 장부 append 는 store 잠금 안에서 한다. 어긋나는 유일한 경우는 append 뒤 registry 저장 실패(고아 줄)이며 무해하다.
- 노트 3면은 Report 마다 전량 재생성한다. 사용자 편집은 roadmap.md 의 표식 사이만 보존한다.
- 제안·브리핑·상태 줄은 모델을 부르지 않는다. 근거가 없으면 제안 수를 줄인다.
- Stop 은 두 신호만 보고 같은 턴에서 1회만 막는다. 매 턴 막히는 설계는 피한다.
- `feature` 필드를 장부 항목에 넣어 REQ-009 주입이 work-items 조회 없이 되게 한다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — `ledger-entry.schema.json` 을 ajv 로, `contracts.js` SCHEMA_FILES 에 등록. TC-001 |
| 보안 | 필요 — Stop 이 `VAIS_HARNESS_OFF`·disabled 를 존중, 장부에 사용자 원문은 `redactRequestText` 로 정리, 테스트 fixture 는 secret-scan 허용 값. TC-005·007·012 |
| Claude Code 접점 | 필요 — SessionStart·Stop 출력 형식은 `lib/io.js` 에 `outputSessionContext`·`outputStopBlock` 으로만. TC-005·007 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

Do 는 main voice(CTO)가 직접 구현한다. specialist 위임 없음. 쓰기 범위: `lib/**`, `hooks/**`, `scripts/**`, `schemas/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`. `docs/product/*.md` 는 transaction 만 쓴다.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(clean-room, 읽기 전용) 가 TC-001~012 를 검증하되 TC-005·007 은 hook 을 stdin JSON 으로 직접 실행한다. 수정 회차 1(material=false): 1차 QA TC-012 FAIL 원인인 테스트 fixture 문자열과 Do 문서의 테스트 수 표기만 고친다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | append 3건·read·깨진 줄 1 삽입·schema 위반 | entries 3, broken 1, throw |
| TC-002 | 승인 3종·거절·QA FAIL·NOT_READY·finalize limitation 2 | milestone 4, feedback 1, debt 3, risk 1, decision ≥1, source.id = PT/event id |
| TC-003 | finalize 뒤 3 파일, roadmap 사용자 표식 안 문구 유지 | 생성·보존 |
| TC-004 | waiting-user·stale·미작성·빈 상태 4 상황 | 규칙대로 ≤3, 빈 상태는 `새 제품:` |
| TC-005 | 새 session_id 로 hook 실행, 상태 없음, off, disabled | 브리핑 / "시작 전" / 비활성 / `{}` |
| TC-006 | 활성 있음·없음·루트 없음 3 출력 + doctor 검사 | 형식 일치 |
| TC-007 | 정상·신호 A·신호 B·stop_hook_active·OFF | `{}`·block·block·`{}`+risk·`{}` |
| TC-008 | doctor 4 검사의 pass/warn/fail 각 1 | 기대대로 |
| TC-009 | debt 2·preference 1 있는 feature 의 design 지침 | 3줄 주입, 다른 feature 는 없음 |
| TC-010 | `../x.png`·절대경로·부모 삭제 재승인·scope `src/**` | 거부·stale·거부 |
| TC-011 | `npm run regression` 장면 E | 통과 |
| TC-012 | 버전 3.3.0 6곳·CHANGELOG·roadmap·hooks 5종·secret-scan | 기대대로, secret-scan exit 0 |

## 8. rollback

hooks.json 에서 SessionStart·Stop 등록을 지우면 브리핑·잠금이 꺼진다. 노트 3면은 전이 스냅샷으로 복구된다. 장부는 append-only 라 되돌릴 것이 없고 잘못된 줄은 doctor 가 보고한다.
