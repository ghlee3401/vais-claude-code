---
schema: vais-phase/v1
work_item: WI-2026-09-16-chain-stages
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 사슬 단계 (chain-stages)

## 한 줄 요약

10개 단계와 kind 를 JSON 데이터로 정의하고, Work item 에 `kind` 를 붙여 5단계 커널이 kind 별 양식·쓰기 범위·검사를 적용하게 한다. 단계 문서는 `### ID ← 부모` 형식으로 쓰고 `id-chain.js` 가 부모·해시·stale 을 검사하며, `.vais/v2/chain-index.json` 이 승인된 항목의 해시를 기억한다. 관문은 묶지 않는다.

## 1. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 기술 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 단계 정의 데이터 | — | `contracts/chain-stages.json` | schema 위반 → 로드 실패 | 단계마다 `id, order, idPrefix, file, artifactDir, requiredFields[], parents{required, allowed[]}, artifactField, coverage(상위 전부 커버 여부), owner, specialists[], choose, confirm, approvalPhrase`. `schemas/chain-stage.schema.json` 으로 ajv 검증. 로더 `lib/workflow/v2/chain-registry.js` | TC-001 |
| REQ-002 | kind 정의 데이터 | — | `contracts/work-kinds.json` | 미정의 kind → 거부 | `harness, feature, ui, bug, stage-<id>×10`. 필드 `reads[], touches[], updates[], planTemplate(one-line·full), designTemplate(options·full), repairLimit, entryRequires(stage id|null), autoWriteScopes[], triggers[]`. 같은 로더가 읽음 | TC-002 |
| REQ-003 | Work item `kind` | `--kind` 또는 hook 제안 | `item.kind` | 미정의 kind 거부 | `createInitialWorkItem` 에 `kind` (기본 `feature`), schema 에 `kind` 문자열. 읽을 때 없으면 `harness` 로 보정(`kindOf(item)`). prompt hook 이 `triggers` 로 kind 를 제안하고 Plan 한 줄에 "kind: …" 를 적어 사용자 확인 | TC-003 |
| REQ-004 | 진입 잠금 | kind, chain-index | 생성 허용/거부 | 선행 미승인 → `STAGE_ENTRY_LOCKED` | `entryRequires` 가 가리키는 단계의 정본이 chain-index 에 `approved` 여야 생성. 1단계는 null. CLI 오류 문구에 "N단계 <문서>가 먼저" 를 담음 | TC-004 |
| REQ-005 | 단계 문서 파서 | 정본 파일 | items[] + findings | 제목 형식 오류 → finding | `id-chain.js parseStageDocument(text, stage)`: `### {PREFIX}-{3자리}( ← {부모, …})?` 제목, 바로 아래 `| 항목 | 내용 |` 표를 필드로. 항목 본문 해시(sha256, 제목 제외). frontmatter `schema: vais-stage/v1, stage, status, approved_revision, work_item` | TC-005 |
| REQ-006 | 부모 검사 | items, 상위 단계 index | findings | 부모 없음·허용 밖·미존재 | `validateParents(stage, items, index)`: `parents.required` 면 ≥1, 접두가 `allowed` 안, 부모 ID 가 index 에 approved 로 존재. 오타면 같은 접두의 후보 3개 제시 | TC-006 |
| REQ-007 | stale 전파 | chain-index | stale 목록 | — | index 항목: `{id, stage, hash, parents[], parentHashes{}, approvedAt, workItem, confirmedAgainst{}}`. `computeStale(index)`: 부모의 현재 hash ≠ `parentHashes[parent]` 이고 `confirmedAgainst[parent]` 도 다르면 stale. 해소 ① 그 단계를 새 작업으로 재승인(parentHashes 갱신) ② CLI `stage confirm --item F-003 --parent REQ-002 --unchanged` 가 `confirmedAgainst` 기록. stale 이 있으면 다음 단계 진입 잠금 | TC-007 |
| REQ-008 | 저장·승인 transaction | Do 의 정본 파일, Report | frontmatter·index 갱신 | 검사 실패 → finding 만 | Do `do ready` 가 stage kind 이면 내장 검사 `stage-document`(파서·부모·stale·산출물·예산·coverage)를 readiness 에 추가. Report `finalize` 가 정본 frontmatter 를 `approved` + `approved_revision`·`work_item` 으로 쓰고 chain-index 에 항목 해시·parentHashes 를 기록. Do 단계 쓰기 범위는 kind 의 `autoWriteScopes`(정본 파일 + artifactDir/**) | TC-008 |
| REQ-009 | kind 별 양식 | kind | 필수 섹션·예산 | 양식 밖 → Gate 실패 | `phase-check.REQUIRED_SECTIONS` 를 `templates[planTemplate|designTemplate]` 로 분기. `one-line` Plan: `요청 확인`, `kind`, `단계` 3항목. `options` Design: `안` 목록(≥1, 규모별 상한 1/2/3), `쓰기 범위`, `readiness`, `rollback`. stage kind 의 REQ/TC 추적 집합은 비어도 통과. 예산: stage kind Plan 2,048B·Design 6,144B·Do 2,560B·Review 4,096B; 정본 파일 예산 = 1,024B + 항목당 1,536B (`document-quality.stageBudget`) | TC-009 |
| REQ-010 | specialist 직접 기록 | assignment scope | handoff.files[] | scope 밖 파일 → 거부 | `specialist-handoff.schema.json` 에 optional `files[]`(≤20). `automatic-handoff` 가 `files` 를 assignment.writeScope 로 검증. stage kind Design 의 specialist 는 정본 파일·artifactDir 을 scope 로 받음 | TC-010 |
| REQ-011 | 산출물 존재 검사 | 항목 `파일` 필드 | finding | 파일 없음 → 거부 | `artifactField` 가 있는 단계(S 흐름 `.mmd`, W `.html/.png`, V `.png`)는 값이 `artifactDir` 아래 실제 파일이어야 한다. 렌더링은 H4 | TC-011 |
| REQ-012 | 장면 A 회귀 | fixture | 통과 | — | `tests/regression/scene-a-first-product.test.js`: 임시 repo 에 fixture 단계 문서 10종을 두고 stage-1 → stage-10 을 CLI(`plan present`·`design present`·`do ready`)와 store 승인 이벤트, QA handoff fixture(`recordDeferredHandoff`)로 끝까지 진행. 건너뛰기·부모 오타·상위 수정 후 stale 도 함께 검증 | TC-012 |
| REQ-013 | 문서·버전 | — | 3.2.0 | — | design.md 대응표 상태(신규→완료), roadmap H1 완료·H2 진행, CHANGELOG `[3.2.0]`, 버전 6곳, CLAUDE/README 에 kind·단계 사용법 | TC-013 |

## 2. 데이터 형식

**chain-stages.json (발췌)**
```json
{ "id": "stage-features", "order": 2, "idPrefix": "F", "file": "docs/product/02-features.md",
  "requiredFields": ["동작", "입력", "출력", "오류", "규칙"],
  "parents": { "required": true, "allowed": ["REQ"] }, "coverage": "REQ",
  "owner": "cpo", "specialists": ["product-discoverer"],
  "choose": "기능 분해안 (규모별 1~3)", "confirm": "기능 목록 + REQ 커버 수", "approvalPhrase": "/vais 승인" }
```
부모표: F←REQ, S←F, W←S, DS←없음, V←W+DS, D←F, API←S|F, T←없음, TC←F. coverage: F 는 모든 REQ, S 는 모든 F, TC 는 모든 F.

**단계 문서**
```markdown
---
schema: vais-stage/v1
stage: stage-features
status: draft
---
### F-001 ← REQ-001
| 항목 | 내용 |
|---|---|
| 동작 | … |
```

**work-kinds.json (발췌)**: `{"id":"stage-features","entryRequires":"stage-requirements","planTemplate":"one-line","designTemplate":"options","repairLimit":5,"autoWriteScopes":["docs/product/02-features.md"],"triggers":["기능 정의서","features"]}`. `feature|ui|bug|harness` 는 `planTemplate: full, designTemplate: full` 로 현행 양식.

## 3. 전문 영역 판단

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — schema 2종(chain-stage, work-kinds)과 handoff `files` 를 ajv 로 검증. TC-001·002·010 |
| 보안 | 필요 — `autoWriteScopes` 가 `docs/product/**` 밖으로 못 나가고 write-policy 의 금지 경로(docs/work-items 등)와 겹치지 않음을 TC-008 부정 케이스로 |
| UI | 불필요 (렌더링은 H4) |
| 운영·배포 | 불확실 → 제외 |

## 4. Do 위임과 쓰기 범위

| 담당 | 일 | 쓰기 범위 (write scope) | 순서 |
|---|---|---|---|
| 본 목소리 (cto) | REQ-001~013 전부. 커널 상태 머신·transaction·phase-check 가 서로 얽혀 한 손으로 한다 | `contracts/**`, `schemas/**`, `lib/**`, `hooks/**`, `scripts/**`, `tests/**`, `docs/harness/**`, `package.json`, `package-lock.json`, `vais.config.json`, `.claude-plugin/**`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `ONBOARDING.md` | 1: 데이터·로더·schema(001·002) → 2: kind·진입 잠금·양식(003·004·009) → 3: 파서·부모·stale·index(005·006·007) → 4: transaction·산출물·handoff(008·010·011) → 5: 장면 A·문서·버전(012·013) |
| specialist | 없음 — 독립성·격리·병렬 조건에 해당하지 않는다 | — | — |

## 5. Readiness · Review 검사와 TC

- readiness: `test`, `lint`, `plugin-validator` / review: 위 셋 + `secret-scan`

| TC | 검사 | 기대 |
|---|---|---|
| TC-001 | chain-stages.json 10항목 schema 통과, 필드 누락 fixture 거부 | 기대대로 |
| TC-002 | work-kinds.json 14 kind 로드, 미정의 kind 거부 | 기대대로 |
| TC-003 | `--kind stage-requirements` 생성, kind 없는 기존 item → `harness`, hook 이 `새 제품:` 에 stage-requirements 제안 | 기대대로 |
| TC-004 | stage-2 를 stage-1 미승인 상태에서 생성 → 거부 문구에 "1단계"; 승인 뒤 허용 | 기대대로 |
| TC-005 | 예시 문서 10종 파싱, `### F-01`·화살표 누락 → finding | 기대대로 |
| TC-006 | 부모 없음·허용 밖(F←S)·미존재(없는 번호의 REQ) 각각 거부, 후보 제시 | 기대대로 |
| TC-007 | REQ-001 본문 수정 → F-001 stale, 재승인·`stage confirm` 두 경로로 해소, stale 시 다음 단계 진입 거부 | 기대대로 |
| TC-008 | `do ready` 가 stage-document 검사 실행, 실패 시 정본 불변·finding, `finalize` 가 approved·index 기록; `autoWriteScopes` 가 금지 경로를 포함하면 거부 | 기대대로 |
| TC-009 | one-line Plan·options Design 통과, full 양식 문서는 stage kind 에서 실패, harness kind 는 현행 유지 | 기대대로 |
| TC-010 | handoff `files` 가 scope 안이면 저장, 밖이면 거부 | 기대대로 |
| TC-011 | W 항목 파일 없음 → 거부, 있으면 통과 | 기대대로 |
| TC-012 | `node --test tests/regression/*.test.js` 장면 A 통과 (1~10 단계, 건너뛰기·오타·stale 포함) | 통과 |
| TC-013 | 버전 6곳 3.2.0, CHANGELOG, roadmap H1 완료 표기 | 기대대로 |

## 6. 롤백

커밋 전 `git checkout -- <path>`, 커밋 후 revert. `chain-index.json` 은 runtime 산출물이라 삭제하면 승인 정본의 frontmatter 로 재구성한다(`stage reindex`). 기존 하네스 작업은 `harness` kind 로 읽혀 동작이 바뀌지 않으며, 실행 중 플러그인(3.1.0)은 이 변경의 영향을 받지 않는다.
