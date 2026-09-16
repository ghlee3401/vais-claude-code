---
schema: vais-phase/v1
work_item: WI-2026-09-16-chain-stages
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 사슬 단계 (chain-stages)

## 변경 (구현)

| REQ | 파일 | 요지 |
|---|---|---|
| 001·002 | `contracts/chain-stages.json`, `contracts/work-kinds.json`, `schemas/chain-stage.schema.json`, `schemas/work-kinds.schema.json`, `lib/workflow/v2/chain-registry.js`(신규), `contracts.js` | 단계 10·kind 14 를 데이터로 정의하고 ajv 로 검증. 로더가 순서·접두 중복·참조를 검사. `suggestKind` 가 요청 트리거로 kind 제안 |
| 003 | `state-machine.js`, `schemas/work-item.schema.json`, `phase-transaction.js`, CLI `--kind`, prompt hook | Work item `kind`, 없는 기존 작업은 `harness`. hook 이 kind 제안·진입 잠금 상태를 주입하고 `--kind` 를 지침에 넣음 |
| 004 | `id-chain.js` `assertStageEntry`, `phase-transaction.js` | 앞 단계 approved + stale 없음이 생성 조건. 오류 문구에 "N단계 <문서>가 먼저" |
| 005·006·007 | `lib/workflow/v2/id-chain.js`(신규) | `### ID ← 부모` 파서(필드 표·본문 해시·형식 finding), 부모 필수·허용·requireEach·존재 검사(후보 제시), 문서 섹션·필수 항목·산출물·커버리지·예산 검사, `.vais/v2/chain-index.json` 승인 기록(parentHashes), stale 계산, `confirmUnchanged`, `reindex`, `chainStatus` |
| 008 | `phase-transaction.js`, `tool-adapters.js`, CLI | 내장 검사 `stage-document` 를 `do ready`·Review 에서 실행(Tool 어댑터는 builtin 건너뜀). `report finalize` 가 `approveStage` 로 정본을 approved 표시·index 갱신(실패 시 스냅샷 복구). 단계 kind 의 write scope 는 autoWriteScopes 이며 `docs/product/` 밖이면 거부 |
| 009 | `phase-check.js`, `document-quality.js` | kind 별 필수 섹션(one-line Plan·options Design·stage review/report), 안 개수 규모 상한, 단계 kind 예산 Plan 2,048·Design 6,144·Do 2,560·Review 4,096, 추적 집합 검사 면제 |
| 010 | `schemas/specialist-handoff.schema.json`, `automatic-handoff.js` | handoff `files[]`(≤20). scope 밖·읽기 전용이면 거부 |
| 011 | `id-chain.js` | artifactFields 값이 artifactDir 아래 실제 파일이어야 통과 |
| 012 | `tests/regression/scene-a-first-product.test.js`, `tests/fixtures/product-stages/**` | 1~10 단계를 CLI(`plan present`·`design present`·`do ready`·`review prepare/decide`·`report finalize`)로 완주. 건너뛰기 거부, 부모 오타 NOT_READY 후 복구, stale·확인·reindex 검증 |
| 013 | `docs/harness/{design,roadmap}.md`, CHANGELOG, README, CLAUDE, ONBOARDING, manifests | 대응표 H1·H2 완료 표시, roadmap H1 완료·H2 진행, `[3.2.0]`, kind·사슬 사용법, 버전 3.2.0 |
| 부수 | `router.js`, `authorization-store.js`, `write-policy.js`, CLI `stage confirm/status/reindex`, `doctor.js` | `/vais 변경 없음 확인: F-003 ← REQ-002` 를 hook 이 authorization 에 기록하고 CLI 가 그 쌍만 허용. `stage status` 는 무인가 읽기. doctor 가 chain-index 도 점검. `qaRepairCount` 상한은 kind 의 repairLimit |

QA 1차 없이 개발 중 잡은 결함 1건: 파서가 `| 항목 | … |` 데이터 행을 표 머리글로 오인 → 머리글 판정을 `항목 | 내용` 정확 일치로 좁힘 (장면 A 7단계에서 발견).

## 증거 (검증)

- `node --test tests/*.test.js`: 12 파일 214 테스트 통과 (신규 `tests/v2-chain-stages.test.js` 13건).
- `node --test tests/regression/*.test.js`: 장면 A(10단계 완주 + 부정 3경로) · 장면 F 통과.
- `npm run lint` 경고 0, `node scripts/vais-validate-plugin.js` 오류 0, `node scripts/vais-doctor.js` fail 0 (plugin-cache warn 은 예상).
- readiness `test`·`lint`·`plugin-validator` 는 transaction 이 다시 실행한다.
- 실행 중 플러그인은 3.1.0 이라 kind 제안·단계 지침 hook 은 업데이트 뒤 확인한다. 단위·회귀 테스트가 그 전까지의 증거다.
