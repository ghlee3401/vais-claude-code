# VAIS 하네스 설계 정본

> 승인 기록: `docs/work-items/harness-design/2026-09-15-harness-design/02-design/main.md` (revision 1, 2026-09-15 사용자 승인). 이 파일은 그 승인본을 제품 노트 위치에 확정한 사본이다. 내용 변경은 새 Work item 으로만 한다.

## 0. 한 장 요약 (비개발자용)

비개발자가 개발자처럼 웹 앱을 만들게 하는 하네스의 설계 정본이다. 요구사항부터 구현까지 11단계 사슬을 단계마다 문서·ID·승인·기록으로 묶고, 앞 단계 승인 없이는 다음 단계를 못 가게 runtime 억지력이 막는다. 단계마다 기획자·디자이너·개발자·QA 역할 카드가 붙고, 사용자는 말하기·고르기·확인만 한다. 기억·안전·확장이 바탕이다. 구현은 로드맵의 후속 작업 8개로 한다.

## 1. 원칙

1. **뭉개기 금지** — 사슬의 모든 단계는 자기 문서·승인·ID·기록을 가진다. 두 단계를 한 문서로 합치지 않는다.
2. **코드로 강제, 데이터로 표현** — 승인 Gate·쓰기 범위·기록·증거·고장 알림은 코드(hook·CLI)가 막는다. 역할 카드·단계 정의·양식·지시문은 JSON/MD 데이터라 모델이 좋아지면 줄인다.
3. **단일 VAIS 목소리** — 역할 이름은 내부 id 다. 사용자는 역할·단계·명령을 외우지 않는다.
4. **정직** — 실행하지 않은 검사, 확인하지 않은 화면, 없는 근거를 만들지 않는다. 증거 없는 "완료" 는 없다.
5. **사용자가 읽는 곳은 둘** — 고르기(안 중 택일)와 확인(화면·검수표). 나머지는 자동이다.

## 2. 개발 사슬 11단계 문서 정의

각 단계는 하나의 Work item(kind)이며 5단계 커널(Plan → Design → Do → Review → Report)을 그대로 탄다. Plan 은 "요청 확인 한 줄", Design 은 "고르기", Do 는 문서·산출물 작성, Review 는 독립 검사, Report 는 단계 문서를 `approved` 로 표시한다.

| # | 문서 (kind) | ID | 정본 파일 | 필수 항목 | 고르기에서 보는 것 | 확인에서 보는 것 | 승인 문구 |
|---|---|---|---|---|---|---|---|
| 1 | 요구사항 정의서 (`stage-requirements`) | REQ | `docs/product/01-requirements.md` | 문제, 대상 사용자, 목표, REQ 마다 완료 조건, 제외 목록 | 요구사항 후보 넣기/빼기 목록 | 한 장 요약 | `/vais 승인` |
| 2 | 기능 정의서 (`stage-features`) | F | `docs/product/02-features.md` | F 마다 부모 REQ, 동작, 입력, 출력, 오류, 규칙 | 기능 분해안 (규모별 1~3) | 기능 목록 + REQ 커버 수 | `/vais 승인` |
| 3 | 화면 정의서 (`stage-screens`) | S | `docs/product/03-screens.md` + `flows/*.mmd` | S 마다 담는 F, 화면 흐름(시작·끝), 이동 조건 | 흐름도 2~3안 | 클릭 가능한 흐름 목업 | `/vais N번` 후 `/vais 승인` |
| 4 | 와이어프레임 (`stage-wireframes`) | W | `docs/product/04-wireframes.md` + `wireframes/W-*.html/png` | W 마다 부모 S, 영역 배치, 요소 목록 (색·글꼴 없음) | 화면별 배치안 | 저해상도 목업 세트 | `/vais 승인` |
| 5 | 디자인 시스템 (`stage-design-system`) | DS | `docs/product/05-design-system.md` | 색, 글꼴, 간격, 컴포넌트 표, 상태(hover·error) | 스타일 3안 (대표 화면에 입힘) | 대표 화면 3장 | `/vais N번` 후 `/vais 승인` |
| 6 | 화면 시안 (`stage-mockups`) | V | `docs/product/06-mockups.md` + `mockups/V-*.png` | V 마다 부모 W + DS, 데스크톱·모바일, 상태별 | 화면별 시안 | 전 화면 세트 전/후 | `/vais 승인` |
| 7 | 데이터 정의서 (`stage-data`) | D | `docs/product/07-data.md` | D 마다 쓰는 F, 항목, 관계, 규칙, 쉬운 말 설명 | 모델안 | 표 | `/vais 승인` |
| 8 | API 규약 (`stage-api`) | API | `docs/product/08-api.md` | API 마다 부모 S 또는 F, 요청, 응답, 오류, 쉬운 말 설명 | 규약안 | 표 | `/vais 승인` |
| 9 | 기술 구조 (`stage-architecture`) | T | `docs/product/09-architecture.md` | 스택, 폴더, 환경, 실행 명령, 배포 방법 | 구조 2~3안 (비용·난이도·확장 쉬운 말) | 빈 앱 실행 화면 | `/vais N번` 후 `/vais 승인` |
| 10 | 테스트 계획 (`stage-test-plan`) | TC | `docs/product/10-test-plan.md` | F 마다 TC 를 하나 이상, 검수 절차(사용자 말) | 없음 (자동 생성) | 검수표 | `/vais 승인` |
| 11 | 구현 (`feature` / `ui` / `bug`) | — | 코드 + `docs/work-items/…` | Design 에 인용된 F/S/V/API/TC ID 만 | 접근안 / 시안 / 원인·수정안 | 검수표 ≤5줄 + 화면 | `/vais 최종 승인` |

문서 형식: 각 항목은 `### {ID} ← {부모 ID}` 제목 아래 필수 항목을 표로 둔다. 제목의 ID 와 화살표는 runtime 이 파싱한다. 화면·와이어·시안은 파일이 정본이고 MD 는 목록·부모·상태만 적는다.

## 3. ID 사슬 규칙

- **형식**: `REQ-001`, `F-001`, `S-001`, `W-001`, `DS-001`, `V-001`, `D-001`, `API-001`, `T-001`, `TC-001`. 세 자리 고정, 삭제해도 번호를 재사용하지 않는다.
- **부모 필수**: REQ 를 제외한 모든 ID 는 부모 ID 를 하나 이상 가진다. 허용 부모: F←REQ, S←F, W←S, DS←(없음, 제품당 1세트), V←W+DS, D←F, API←S 또는 F, T←(없음), TC←F. 부모가 없거나 허용 밖이면 `stage present` 가 거부한다.
- **stale 전파**: 상위 항목의 본문 해시가 바뀌면 그 자식 전부에 `stale: true` 가 붙는다. stale 항목이 하나라도 있으면 구현 kind 의 Design Gate 가 막힌다. 해소는 자식 항목을 재승인하거나 "변경 없음 확인" 을 장부에 남기는 두 가지뿐이다.
- **인용 강제**: 구현 kind 의 Design 은 "이번에 만드는 것" 을 ID 목록으로만 적는다. ID 없는 서술 항목이 있으면 Gate 실패. QA 는 그 ID 의 TC 만 검사한다.
- **역추적**: 모든 ID 는 만든 Work item 과 승인 revision 을 frontmatter 에 갖는다. `/vais 설명 F-003` 은 부모·자식·만든 작업·마지막 검증일을 답한다.

## 4. 억지력

손잡이 여섯: UserPromptSubmit(주입), PreToolUse(차단), PostToolUse(기록), Stop(턴 종료 거부), 내부 CLI(검증 후 저장), 상태 줄(AI 와 무관한 표시).

단계 공통 억지력:

| 억지력 | 규칙 | 담당 손잡이 |
|---|---|---|
| 진입 잠금 | 앞 단계 문서가 `approved` 아니면 이 kind 의 Work item 을 만들 수 없다 | CLI (`kind` 진입 조건) |
| 쓰기 범위 | 자기 단계 정본 파일·산출물 폴더·자기 work-item 폴더만 쓴다 | PreToolUse |
| 변경 기록 | 도구가 바꾼 경로와 specialist 결과를 즉시 저장한다. 기록 없는 변경은 drift 로 잡힌다 | PostToolUse |
| 저장 검사 | 필수 항목, ID 부모, stale, 예산을 검사하고 실패하면 저장하지 않는다 | CLI (`stage present`) |
| 승인 잠금 | 명시 문구(`승인`, `N번`, `최종 승인`)만 승인이다. 모호·조건부·대리는 무효 | UserPromptSubmit + 상태 머신 |
| 기록 잠금 | 결정·변경·승인이 장부에 없으면 턴을 끝낼 수 없다 | Stop |
| 오설정 잠금 | mode 값이 잘못되면 열리지 않고 enforce 로 닫힘으로 실패하며 매 프롬프트에 경고한다. 끄는 길은 정확한 `disabled` 와 `VAIS_HARNESS_OFF` 뿐 | CLI `resolveMode` + UserPromptSubmit |
| 표시 | 현재 단계·상태·다음 행동을 항상 보인다 | 상태 줄 + 응답 첫 줄 |

단계별 저장 검사 (CLI 가 `contracts/chain-stages.json` 을 읽어 적용):

| 단계 | 검사 |
|---|---|
| 1 REQ | 문제·대상·목표 존재, REQ 마다 완료 조건, 제외 목록 ≥1 |
| 2 F | F 마다 부모 REQ, 입력·출력·오류·규칙 4항목, 모든 REQ 에 F ≥1 |
| 3 S | S 마다 담는 F ≥1, 흐름 파일에 시작·끝 노드, 모든 F 가 어느 S 에 속함 |
| 4 W | W 마다 부모 S, 화면당 W ≥1, 파일 존재 |
| 5 DS | 색·글꼴·간격·컴포넌트 4표 존재, 상태 열 존재 |
| 6 V | V 마다 부모 W 와 DS, 데스크톱·모바일 파일 존재 |
| 7 D | D 마다 사용 F, 쉬운 말 설명 존재 |
| 8 API | API 마다 부모, 요청·응답·오류 3항목 |
| 9 T | 실행 명령이 실제로 동작한 증거(exit 0 + 스크린샷) |
| 10 TC | 모든 F 에 TC ≥1, 검수 절차가 사용자 말로 존재 |
| 11 구현 | Design 인용 ID 전부 approved·non-stale, 검수표 ≤5, 화면 증거 존재 |

## 5. 루프와 일 양식

루프는 하나다: 말하기 → 요청 확인(한 줄) → 고르기 → [만들기: 자동] → 확인(최대 5회) → [기록: 자동]. 커널 5단계와의 대응: 요청 확인 = Plan 승인, 고르기 = Design 승인, 만들기 = Do, 확인 = Review + 최종 승인, 기록 = Report + 장부.

| kind | 읽는 문서 | 건드리는 ID | 고르기 | 확인 | 갱신 문서 | 수정 루프 |
|---|---|---|---|---|---|---|
| `feature` | 01~10 전부 (인용 ID 중심) | F·S·API·D·TC 의 일부 | 접근안 (compact 1 · standard 2 · extended 3) | 검수표 ≤5 + 화면 | 02·03·07·08·10 해당 섹션, 구현 `구현됨` 도장 | QA FAIL → Design, 최대 5회 |
| `ui` | 03·04·05·06 + 취향 장부 | S·W·V | 실제 앱 작업 사본에 적용한 시안 세트 (규모별 1~3) | 전/후 나란히 + 회차 diff + 검수표 | 04·06 해당 섹션, 취향 장부 | 화면 확인 정지점에서 최대 5회 |
| `bug` | 02·10 + 재현 | F·TC | 재현 화면 + 원인·수정안 | 재현 절차 재실행 → 미발생 | 10 (재발 방지 TC 추가), 장부 `debt`/`risk` | 최대 5회 |
| `stage-*` (1~10) | 바로 앞 단계 문서 | 자기 ID | 2절 표의 고르기 열 | 2절 표의 확인 열 | 자기 정본 파일 | 최대 5회 |

UI kind 만 Do 뒤 "화면 확인 정지점" 이 있다. 규칙: Do 완료 → 실제 화면 스크린샷 세트 제시 → 사용자가 `됐다` 류(`/vais 확인`)면 Review 로, 수정을 말하면 같은 Work item 안에서 Design 세부 수정(material=false) → Do 재실행. 회차마다 코드 diff 요약을 기계가 뽑아 보인다.

## 6. 제품 노트 · 세션 브리핑 · 상태 줄

| 면 | 내용 | 출처 파일 | 갱신 시점 |
|---|---|---|---|
| 현재 | 문서 1~10 목차 + 각 항목 상태(approved / stale / 구현됨 / 미구현) + 마지막 검증일 | `docs/product/README.md` (자동) ← 01~10 frontmatter | 모든 Report finalize |
| 다음 | 로드맵(남은 stage·feature 순서), 제안 3개 | `docs/product/roadmap.md` (자동 + 사용자 편집 가능 섹션) | Report finalize, `/vais 제안` |
| 왜 | 결정·피드백·취향·부채·리스크 장부 | `docs/product/decisions.md` (자동) ← `.vais/v2/ledger.jsonl` | Report finalize |
| 과거 | Work item 목록과 상태 | `docs/README.md`, `docs/features/*` (기존 자동 생성) | Report finalize |

세션 브리핑(SessionStart hook, 새로 작성): 상태 한 줄, 지난 세션 마지막 사건, 열린 결정 수, 부채 수, stale 수, 제안 3개. 출처는 work-items.json 과 ledger 뿐이며 모델을 부르지 않는다.

상태 줄(Claude Code statusline): `scripts/vais-statusline.js` 가 work-items.json 을 읽어 `VAIS · {feature} · {phase}/{status} · 다음: {행동}` 을 출력한다. 설치는 `/vais doctor` 가 안내한다.

## 7. 명령 다섯

| 명령 | 입력 | 출력 | 읽기/쓰기 |
|---|---|---|---|
| `/vais 상태` | 없음 | 사람 말 요약: 현재 작업·단계·기다리는 결정·열린 부채·stale | 읽기 |
| `/vais 설명 <용어 또는 ID 또는 파일>` | 단어·ID·경로 | 비개발자용 설명 + 관련 문서 링크. ID 면 부모·자식·만든 작업 | 읽기 |
| `/vais 저장` | 없음 (옵션: 메시지) | 버전 파일 6곳 동기화 검사 → 커밋 제안 → 사용자 확인 후 커밋 | 쓰기 (확인 후) |
| `/vais 되돌리기 <작업 id 또는 커밋>` | 대상 | 되돌릴 변경 목록 제시 → 사용자 확인 후 revert 커밋 | 쓰기 (확인 후) |
| `/vais doctor` | 없음 | 설정·hook·버전·캐시·상태 파일·stale·죽은 키 점검표 + 고치는 법 | 읽기 |

부속: `/vais 제안` (다음 행동 3개), `/vais 기록 <종류> <내용>` (장부 수동 기록), `/vais 기록 보기`. 기존 `status/pause/resume/cancel/새 작업:` 유지. router 의 평가용 문장 8개는 제거한다.

## 8. 바탕 셋

**기억** — `.vais/v2/ledger.jsonl` (append-only, schema `ledger-entry/v1`: id, ts, workItemId, kind, text, why, source, refs). 자동 기록 지점: Plan 승인·Design 승인·최종 승인 → `milestone`; Design 의 `decisions` frontmatter 목록 → `decision`; 최종 거절·수정 요청 원문 → `feedback`; UI kind 의 수정 요청 원문 → `preference`; QA FAIL 항목·Report `--limitation` → `debt`; readiness NOT_READY·blocked → `risk`. 노출: 세션 브리핑, stage/feature Design 시작 시 관련 항목 주입, `decisions.md`.

**안전** — (1) mode 정규화(대소문자·공백). 미허용 값과 읽기 실패는 enforce 로 취급해 닫힘으로 실패하고 매 프롬프트 첫 줄에 `⚠ VAIS 하네스 경고: 이유` 를 주입한다. hook 예외도 같은 줄로. (2) 비상 해제 스위치 `VAIS_HARNESS_OFF=1` 환경변수: 모든 hook 이 즉시 `{}` 를 내고 첫 줄에 비활성 표시. (3) 읽기 전용 명령(`git -C … status/diff/log`, `ls`, `cat`, `wc`, `head`, `tail`, `node --version`)과 scratchpad 경로 쓰기는 authorization 없이 허용. (4) Stop hook: 장부·상태 줄 누락 시 종료 거부. (5) 기존 write scope·승인·drift 유지.

**확장** — (1) Claude Code 와 닿는 면(hook 입력 파싱, 도구 이름, Agent 결과 모양)은 `lib/io.js` 한 곳. (2) 모든 transaction receipt 에 `runtime: {plugin, node, claudeCode}` 버전 도장 (모델 이름은 CLI 가 알 수 없어 넣지 않는다). (3) `tests/regression/` 시나리오 6개(11절 장면)를 `npm run regression` 으로 돌리고 doctor 가 버전 변화 감지 시 권고. (4) 역할 카드에 `modelHint` (judgment=strong, implementation=default, check=cheap) 데이터 필드. (5) 검사 어댑터 등록식 유지, `screenshot-compare` 어댑터 자리 예약.

## 9. 역할 카드와 Agent 기준

| 단계 | owner (본 목소리) | 허용 specialist (별도 Agent) | 별도 Agent 조건 |
|---|---|---|---|
| 1 REQ, 2 F | cpo | product-discoverer (불확실한 요구 탐색 시) | 격리 이득 |
| 3 S, 4 W | cpo | ui-designer | 격리 이득 (백엔드 내용 차단) |
| 5 DS, 6 V | cto | ui-designer | 격리 이득 |
| 7 D | cto | db-architect | 없음 (본 목소리 기본) |
| 8 API | cto | backend-engineer | 병렬 (프론트 병행 시) |
| 9 T | cto | infra-architect | 없음 |
| 10 TC | independent-qa | — | 독립성 |
| 11 구현 | cto | frontend-engineer, backend-engineer (병렬), test-engineer | 병렬 / 격리 |
| Review (모든 kind) | independent-qa | — | 독립성 (필수) |

규칙: 프롬프트는 `contracts/v2-role-cards.json` 카드 + `contracts/chain-stages.json` 의 단계 계약에서 runtime 이 조립한다. 실행 껍데기는 `agents/v2-specialist.md` 하나다. 산출물은 specialist 가 자기 write scope 안의 단계 파일에 직접 쓰고, handoff 에는 receipt·판정·쓴 파일 목록만 남긴다(3KB 한도 유지). 세 조건(독립성·격리 이득·병렬) 중 하나도 없으면 본 목소리가 직접 수행하며, guard 가 조건 밖 `assignment` 발급을 거부한다.

## 10. 대응표 (설계 요소 → 파일)

| 설계 요소 | 파일 / 모듈 | 상태 |
|---|---|---|
| 단계 정의 11 (필수 항목·검사·고르기·확인·owner) | `contracts/chain-stages.json` | 신규 |
| kind 정의 (feature·ui·bug·stage-*) | `contracts/work-kinds.json` | 신규 |
| ID 파싱·부모 검사·stale 전파 | `lib/workflow/v2/id-chain.js` | 신규 |
| 단계 문서 저장 transaction (`stage present`) | `lib/workflow/v2/phase-transaction.js` 확장 + `scripts/vais-workflow-v2.js` | 변경 |
| Work item `kind` 필드·진입 조건 | `lib/workflow/v2/state-machine.js`, `work-item-store.js`, `schemas/work-item.schema.json` | 변경 |
| 화면 확인 정지점 (ui kind) | `state-machine.js` 이벤트 `USER_SCREEN_CONFIRMED` / `USER_SCREEN_REVISE`, `router.js` | 변경 |
| 수정 루프 상한 5 | `state-machine.js` (`qaRepairCount` 상한 3→5) | 변경 |
| 장부 | `lib/workflow/v2/ledger.js`, `schemas/ledger-entry.schema.json`, `.vais/v2/ledger.jsonl` | 신규 |
| 제품 노트 4면 렌더링 | `lib/workflow/v2/product-note.js` (README·roadmap·decisions) | 신규 |
| 제안 엔진 | `lib/workflow/v2/proposal.js` | 신규 |
| 세션 브리핑 | `hooks/session-start.js` (v2 기반 재작성) | 신규 |
| 상태 줄 | `scripts/vais-statusline.js` | 신규 |
| Stop 잠금 | `hooks/workflow-v2-stop.js` + `hooks.json` | 신규 |
| 변경 기록 (PostToolUse) | `hooks/workflow-v2-drift.js`, `hooks/workflow-v2-agent-handoff.js` | 유지 |
| 명령 다섯 + 제안·기록 | `lib/workflow/v2/router.js`, `scripts/vais-workflow-v2.js` | 변경 |
| 설명 명령 | `lib/workflow/v2/explain.js` | 신규 |
| 저장·되돌리기 | `lib/workflow/v2/vcs.js` (버전 6곳 동기화·revert 목록) | 신규 |
| doctor | `lib/workflow/v2/doctor.js`, `scripts/vais-doctor.js` | 신규 |
| mode 정규화·fail-loud·비상 스위치 | `hooks/workflow-v2-prompt.js`(`loadMode`), 4 hook 공통 | 변경 |
| 읽기 명령·scratchpad 허용 | `lib/workflow/v2/write-policy.js` | 변경 |
| lease·TTL·prefix 를 config 에서 읽기 | `work-item-store.js`, `authorization-store.js`, `router.js` | 변경 |
| slug: 한글 요청 → 로마자 대신 사용자 확인 슬러그 | `lib/workflow/v2/naming.js`, prompt hook | 변경 |
| Plan 초안 경로 = 01-plan/draft.md 로 통일 | prompt hook 지침, `write-policy.js` | 변경 |
| 버전 도장 | `phase-transaction.js` receipt, `schemas/phase-transaction-receipt.schema.json` | 변경 |
| Claude Code 접점 어댑터 (hook 입력·도구 이름·Agent 결과) | `lib/io.js` | 변경 |
| 별도 Agent 세 조건 guard, 역할 프롬프트 조립 | `lib/workflow/v2/agent-policy.js`, `role-registry.js` | 변경 |
| 회귀 세트 | `tests/regression/*.test.js` (장면 6) | 신규 |
| 역할 modelHint | `contracts/v2-role-cards.json` | 변경 |
| 검사 어댑터 `screenshot-compare` 자리 | `lib/workflow/v2/tool-adapters.js` | 변경 |
| 화면 산출물 렌더링·스크린샷 | `lib/workflow/v2/screen-capture.js` (Chrome 헤드리스) | 신규 |
| 검수 페이지 (로컬 HTML) | `lib/workflow/v2/review-page.js` → `04-review/evidence/review.html` | 신규 |
| 회차 diff 요약 (UI 수정 루프) | `lib/workflow/v2/diff-summary.js` | 신규 (H4) |
| 하네스 설정 정본·mode 판정 | `lib/workflow/v2/config.js` | 신규 (H1) |
| 앱 실행 (확인 단계) | `vais.config.json > run.command`, `tool-adapters.js` `serve` | 신규 |
| 응답 형식 | `output-styles/vais-default.md` | 변경 |
| 사용 문서 | `README.md`, `ONBOARDING.md`, `CLAUDE.md` | 변경 |

## 11. 사용 장면 6개

**장면 A — 처음 시작**: `/vais 새 제품: 독서 기록 앱` → kind `stage-requirements` Work item 생성(선행 문서 없음이므로 진입 허용) → Plan: "요구사항 정의서를 만든다" 한 줄 확인 → Design: 요구사항 후보 12개 넣기/빼기 → 승인 → Do: `01-requirements.md` 작성(REQ-001~008) → Review: 필수 항목·완료 조건 검사 PASS → 최종 승인 → Report: 문서 approved, 장부 milestone, 로드맵 "다음: 기능 정의서" 제안. 이어서 2~10 단계를 같은 방식으로 진행하고, 9 단계 확인에서 빈 앱이 실제로 뜬 스크린샷을 본다.

**장면 B — 기능 추가**: `/vais 책에 별점 매기기` → kind `feature` → Plan: 관련 F/S 검색 후 "F-004 별점, S-002 상세 화면에 추가, API-003 신규" 한 줄 확인 → Design: 접근 2안(별 5개 vs 슬라이더) 고르기, 인용 ID 만 나열, 새 F-009←REQ-003·API-007←S-002·TC-015←F-009 선언 → 승인 → Do: 코드 + 02·08·10 섹션 추가 → readiness(test·lint) → Review: 독립 QA 가 TC-015 검수표 3줄 + 화면 → 최종 승인 → Report: 제품 노트 "현재" 에 F-009 `구현됨`.

**장면 C — UI 손보기 3회**: `/vais 상세 화면 버튼이 눈에 안 띔` → kind `ui` → Plan 한 줄 확인 → Design: 작업 사본에 적용한 시안 2안 스크린샷(데스크톱·모바일) 고르기 → Do 적용 → **화면 확인 정지점**: 실제 화면 제시 → 1회 "더 크게" → Design 세부 수정(material=false) → Do → 화면 제시 + diff("padding 12→16, 색 유지") → 2회 "색은 파랑" → 반복 → 3회 `/vais 확인` → Review: 승인 시안 vs 실제 나란히 + 검수표 → 최종 승인 → Report: V-002 갱신, 취향 장부에 "버튼은 크게, 파랑" 기록. 다음 UI 작업의 Design 은 이 취향을 읽고 시작한다.

**장면 D — 버그**: `/vais 별점이 저장 안 돼` → kind `bug` → Plan: 재현 절차 확인 → Design: 재현 스크린샷 + 원인(API-007 응답 코드) + 수정안 1 → 승인 → Do → Review: 재현 절차 재실행 → 미발생 + TC-016 추가 → 최종 승인 → Report: 10 문서에 TC-016 반영, 장부 `debt` 정리, 작업 동결.

**장면 E — 세션 끊김 뒤 재개**: 새 세션 시작 → 브리핑: `[book-app · ui · waiting-user] 지난 세션: 시안 2안 제시 후 대기. 열린 결정 1, 부채 2, stale 0. 제안: ① 1번 고르기 ② 2번 고르기 ③ 취소` → `/vais 1번` → Do → 화면 확인 → Review → 최종 승인 → Report 로 정상 종결. 세션 id 가 달라도 lease 를 새로 받는다.

**장면 F — 하네스 고장**: 설정 mode 가 `Enforce` 로 저장됨 → 정규화되어 정상 동작. 값이 `enforcee` 라면 guard 는 닫힌 채 매 응답 첫 줄 `⚠ VAIS 하네스 경고: mode 값 오류("enforcee")`, `/vais doctor` 가 고치는 법 제시. hook 스크립트가 예외로 죽으면 같은 경고 + `VAIS_HARNESS_OFF=1` 로 임시 해제 안내. 조용히 죽는 경로는 없다.

## 12. 현 커널 결함과 처리

| # | 결함 | 처리 작업 |
|---|---|---|
| 1 | mode 대소문자·오타 시 무음 비활성 | H1 |
| 2 | 한글 요청 slug 가 해시 | H1 |
| 3 | lease 60초 하드코딩, `authorizationTtlMs`·`managedPrefix` 미사용 | H1 |
| 4 | 읽기 명령(`git -C`)·scratchpad 쓰기 차단 | H1 |
| 5 | router 의 평가용 승인 문장 8개 | H1 |
| 6 | `commit`·`help` 부재 | H5 |
| 7 | Plan 수정 시 지시된 초안 경로가 쓰기 범위 밖 | H1 |
| 8 | specialist 산출물이 3KB handoff 로 뭉개짐 | H2 |
| 9 | 사슬 단계 문서 없음 (Plan/Design 뿐) | H2 |
| 10 | 기록·제안·브리핑·상태 줄 없음 | H3 |
| 11 | UI 확인 정지점·시안·전/후 비교 없음 | H4 |
| 12 | Stop 잠금·비상 스위치·doctor 없음 | H1, H3 |

## 13. 후속 로드맵

[roadmap.md](roadmap.md) 참조 (H1 `harness-health` → H2 `chain-stages` → H3 `product-note` → H4 `ui-loop` → H5 `commands` → H6 `feature-bug-kinds` → H7 `regression-and-docs` → H8 `design-system-mcp`).
