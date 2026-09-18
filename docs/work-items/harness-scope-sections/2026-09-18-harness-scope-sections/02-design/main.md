---
schema: vais-phase/v1
work_item: WI-2026-09-18-harness-scope-sections
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 범위로 묶는 정본과 회의록 (harness-scope-sections)

## 1. 접근

"범위(scope)" 를 단계 작업의 Feature 이름으로 쓴다. 정본 파서가 이미 `##` 절을 모으므로 `## 범위: <이름>` 절 아래의 항목에 `scope` 를 붙이고, 승인 때 chain-index 에도 남긴다. 이름은 `이름:` 과 같은 기구(`범위:` 별칭)로 사용자가 주고, 2~10단계는 직전 단계 작업의 범위를 물려받는다. 이전은 `/vais 정리: 범위 X` → 제안 → `/vais 정리 확인` → 실행의 두 단계로, 저장 명령의 확인 토큰 틀을 그대로 쓴다. 위임 없음. 이번 Do 는 크므로 이 저장소의 `authorizationTtlMs` 를 2시간으로 올린다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 범위 이름 | `/vais 새 제품: po-report 범위: member-management`, 또는 `/vais 범위: goal-tracking 요구사항`, 뒤 단계는 `/vais 와이어프레임` | 단계 Work item 의 `primaryFeature = 범위`, slug = 단계 짧은 이름(`requirements`·`features`…) → 폴더 `work-items/<범위>/<날짜>-<단계>/` | 1단계인데 범위가 없으면 이름을 묻는다(AI 가 만들지 않음) | `router.js` `NAME_FEATURE` 에 `범위\|scope` 별칭. hook `requestSlugFor`: 단계 kind 면 영어 단어 추출 대신 (a) 사용자 `범위:` (b) 없으면 가장 최근 단계 작업의 `primaryFeature` 를 물려받아 지침에 "범위 X 를 물려받는다" 표시. CLI `plan present` 는 단계 kind 에서 `--slug` 를 단계 짧은 이름으로 받고 `--feature` 를 범위로 검사(kebab). 옛 방식(요청 단어)은 단계 kind 에서 제거 | TC-001 |
| REQ-002 | 정본 절 | 항목형 단계 문서 8개(01·02·03·04·06·07·08·10) | `## 범위: <이름>` 절 아래 항목. 01 은 절 안 첫 줄에 `문제:` `목표:` 한 줄씩. 제품 절(`## 대상 사용자`, `## 제외`)은 위에 한 번 | 절 밖 항목·절 없는 문서·다른 범위 항목 변경 → `stage-document` FAIL(항목·범위 명시) | `chain-stages.json`: 단계에 `scoped: true`(05·09 제외), 01 의 `documentSections` 를 `["대상 사용자","제외"]` 로 줄이고 `scopeLines: ["문제","목표"]` 추가; 스키마 갱신. `parseStageDocument`: `## 범위: X` 를 만나면 이후 항목에 `scope: X`(kebab 검증). `validateStageDocument(…, { scope })`: scoped 문서에서 scope 없는 항목 거부, 현재 작업 범위 밖 항목의 hash 가 index 와 다르면 거부, 01 은 절마다 `문제:`·`목표:` 줄 필수. 커버리지는 "같은 범위의 상위 항목이 어느 항목에든 덮이는가". `approveStage`·`reindex` 가 `item.scope` 기록 | TC-002 |
| REQ-003 | 새 범위 추가 | 새 범위 이름의 1단계 작업 | 정본 끝에 `## 범위: <새 이름>` 절, ID 는 index 의 다음 번호부터 | 다른 절 변경 시 REQ-002 오류 | Do 지침에 "절이 없으면 문서 끝에 `## 범위: X` 를 만들고 그 안에만 쓴다. 다음 빈 번호는 `stage status` 의 nextId" 를 넣는다(`chainStatus` 에 접두별 nextId 추가). 뒤 단계도 같은 절 규칙 | TC-003 |
| REQ-004 | 인덱스·노트 | chain-index·work-items | `docs/features/<범위>/main.md`(작업 순서 = 단계 순서), `docs/README.md` 열 이름 "범위 · Feature", 제품 노트 "현재" 에 범위별 표(`| 범위 | 항목 | 구현됨 | stale |`) | — | `document-manager` 열 제목만 변경, `product-note.renderCurrent` 에 범위 표 추가(`item.scope` 집계, 없으면 "(범위 없음)") | TC-004 |
| REQ-005 | 이전 명령 | `/vais 정리: 범위 X` → `/vais 정리 확인` | 제안: 옮길 회의록 폴더(옛 → 새), 감쌀 정본과 절 위치, 바뀔 상태·장부 항목 수. 실행: 정본 감싸기(01 은 기존 `## 문제`·`## 목표` 첫 문장을 절 안 `문제:`·`목표:` 줄로 옮김), 회의록 `work-items/<옛 feature>/<id>` → `work-items/X/<id>`(id 는 유지), `.vais/v2/work-items.json` 의 `primaryFeature`, chain-index `item.scope`, 장부 `feature`, 옛 `docs/features/<옛>` 삭제 후 인덱스·노트 재생성. 두 번째 실행은 "변경 없음" | 실패 시 임시 폴더에서 작업 후 원본 교체 전에 중단 → 변경 0 | 새 `lib/workflow/v2/migrate-scopes.js` `proposeScopeMigration(root, scope)`·`commitScopeMigration(root, { sessionId, scope })`. 라우터 `['migrate', /^정리\s*[:：]\s*범위\s+([a-z0-9-]+)$/i, false]`, `['migrate-confirm', /^정리\s*확인$/i, true]` + 확인 토큰 `{ type: 'migrate', scope }`. CLI `migrate propose --scope`(무인증)·`migrate commit --session`. `write-policy` 공개 명령 추가. 실행 후 `store.setRepoSnapshot` 대신 활성 작업이 없음을 전제로 함(REQ-006) | TC-005 |
| REQ-006 | 안전조건 | 실행 직전 상태 | 거부 사유 + 다음 행동 문장 | 활성·대기·paused 작업 있음 / 다른 세션 lease 살아 있음 / `git status` 더러움 / 정본 승인 상태 불일치 → 거부 | `commitScopeMigration` 이 순서대로 검사: `store.getCurrent()`·paused 목록, `store.list()` 의 lease(`leaseMs` 안), `vcs` 의 변경 목록, chain-index 와 정본 frontmatter 일치. 모두 통과해야 파일을 만진다 | TC-006 |
| REQ-007 | 문서·버전 | — | 4.3.0 | — | README(범위 절·정리 명령·폴더 그림), CLAUDE 10-1(범위)·10-3(절)·16(정리 두 단계), ONBOARDING, design.md §2·§7·대응표, CHANGELOG [4.3.0], 버전 7면, `vais.config.json` `authorizationTtlMs` 7200000 | TC-007 |

## 3. 결정

- 정본은 단계마다 파일 하나를 유지하고, 그 안을 `## 범위: <이름>` 절로 묶는다. 폴더로 쪼개지 않는다(ID 사슬·커버리지·제품 단위 문서 05·09 보존).
- 범위 이름은 사용자가 준다. 단계 kind 는 요청 문장에서 이름을 뽑지 않고, 2~10단계는 직전 단계 작업의 범위를 물려받는다.
- 이전된 옛 작업의 Work item ID 는 유지하고 폴더만 `<범위>/<id>` 로 옮긴다(장부·chain-index 참조 안정). 새 작업부터 `<날짜>-<단계>` 이름이다.
- 이전은 활성 작업 없음 · 다른 세션 lease 없음 · git 깨끗함일 때만 실행하고, 실패하면 아무것도 바꾸지 않는다.
- 이 저장소의 authorization 을 2시간으로 올린다(큰 Do 의 만료 재발 방지). 다른 프로젝트 기본값은 그대로.
- 버전 4.3.0.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — `chain-stages.json` 키 추가(`scoped`·`scopeLines`), chain-index 항목에 `scope`, 라우터 명령 2개, CLI 하위 명령 2개, 확인 토큰 종류 추가. 이 Design 승인이 사전 합의다 |
| 보안 | 필요 — 이전 명령은 확인 토큰 + 안전조건 + 원자적 교체 |
| UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `contracts/chain-stages.json`, `schemas/chain-stage.schema.json`, `lib/workflow/v2/**`, `hooks/workflow-v2-prompt.js`, `scripts/vais-workflow-v2.js`, `tests/**`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/design.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 테스트 재실행, po_report 복사본 이전 실증(임시 폴더에 복사 → `migrate propose/commit` → `stage status`·`doctor`), 문서·버전을 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | 회귀 장면 A: 10단계 회의록이 `work-items/reading-log/<날짜>-<단계>/` 아래, `primaryFeature` 전부 같음; `/vais 새 제품` 만 오면 hook 이 범위 이름을 묻고 CLI 가 단계 작업 생성을 거부; 2단계 요청이 범위를 물려받음 | 통과 |
| TC-002 | 절 밖 항목·절 없는 문서·다른 범위 항목 변경·01 절의 `문제:`/`목표:` 누락이 각각 finding; 절 도입 fixture 로 기존 사슬·stale·커버리지 테스트 결과 동일 | 통과 |
| TC-003 | 두 번째 범위의 1~3단계를 진행해 정본에 절 두 개, 첫 범위 항목 hash 불변, 범위별 커버리지 | 통과 |
| TC-004 | `docs/features/<범위>/main.md` 순서, `docs/README.md` 열 제목, 제품 노트 범위 표 | 통과 |
| TC-005 | 옛 구조 fixture(po_report 형태: login·features·screens·wireframes) → propose 표 → commit → 폴더·정본·상태·장부·인덱스 검증, `stage status` 승인 유지, 두 번째 commit "변경 없음" | 통과 |
| TC-006 | 활성 작업 / 다른 세션 lease / 더러운 git 각각 거부, 중간 실패 주입 시 변경 0 | 통과 |
| TC-007 | 버전 7면 4.3.0, CHANGELOG, README·CLAUDE·ONBOARDING·design.md 문구, `authorizationTtlMs` 7200000, `npm test`·회귀·lint·validate PASS | 통과 |

## 8. rollback

`git checkout -- .` 후 `lib/workflow/v2/migrate-scopes.js`·새 테스트·fixture 삭제(사용자 실행). 이전된 프로젝트는 그 프로젝트의 git 으로 되돌린다.
