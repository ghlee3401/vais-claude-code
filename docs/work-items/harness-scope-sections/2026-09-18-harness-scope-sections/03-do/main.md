---
schema: vais-phase/v1
work_item: WI-2026-09-18-harness-scope-sections
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 범위로 묶는 정본과 회의록 (harness-scope-sections)

## 변경

- REQ-001 범위 이름: `router.js` `NAME_FEATURE` 에 `범위|scope` 별칭 + 문장 안 `범위: X`(`scopeNameIn`), 라우터 `migrate`·`migrate-confirm`. hook `requestSlugFor(route, root)` 가 단계 kind 면 요청 단어 대신 `inheritedScope`(가장 최근 단계 작업의 Feature)를 쓰고, `stageStartGuidance` 가 범위·slug·폴더를 지시한다. CLI `assertStageWorkItemNaming`(`--slug` = 단계 이름, `--feature` = 범위, 등록된 범위와 일치), `generatedWorkItemId` 가 같은 날 같은 단계에 `-2`·`-3`.
- REQ-002 정본 절: `chain-stages.json` 8개 단계 `scoped: true`, 01 `documentSections` 2개 + `scopeLines`; 스키마. `id-chain.js` `parseStageDocument` 가 `## 범위:` 아래 항목에 `scope`·절 첫머리 `leadLines`, `scopeFindings` 가 절 밖 항목·`문제:`/`목표:` 누락·다른 범위 항목의 추가/변경/삭제를 finding 으로, 커버리지는 범위 안에서. `approveStage`·`reindex`·`citation.applyAdditions` 가 `item.scope` 기록. `stageDocumentCheck`·`report finalize` 가 작업의 Feature 를 scope 로 넘긴다.
- REQ-003: Do 지침(절 없으면 문서 끝, 다른 범위 불변, `nextIds`), `chainStatus` 에 `nextIds`·범위별 개수.
- REQ-004: `docs/README.md` 열 "범위 · Feature", 제품 노트 `## 범위별` 표(05·09 는 "(제품 전체)", 옛 항목은 "(범위 없음)").
- REQ-005/006: 새 `migrate-scopes.js` — `proposeScopeMigration`(회의록 이동·정본 감싸기·상태 3종 수·경고, `.vais/v2/scope-migration.json` 에 범위 저장) / `commitScopeMigration`(확인 토큰 → 안전조건 넷 → undo 목록으로 적용, 실패 시 전부 되돌림, 두 번째는 "변경 없음"). CLI `migrate propose`(무인증)·`migrate commit`, `write-policy` 공개 명령, hook 확인 토큰(`정리 확인` 은 저장된 제안의 범위).
- REQ-007: README(범위 절·명령 2행·폴더 그림), CLAUDE 10-1·10-3·16·구조, ONBOARDING, design.md §2·§3·§7·대응표, CHANGELOG [4.3.0], 버전 7면 + package-lock 4.3.0, `authorizationTtlMs` 7200000.
- 테스트: `tests/v2-scope-sections.test.js`(TC-001·002·003·004·007), `tests/v2-migrate-scopes.test.js`(TC-005·006, po_report 형태 fixture), 장면 A(범위 묻기·물려받기·폴더·두 번째 범위 1~3단계), 장면 E slug, 단계 fixture 8개에 범위 절.

## 증거

- `npm test` 257 pass / `npm run regression` 10 pass / `npm run lint` 0 경고 (Do 에서 직접 실행). `npm run validate` 는 write guard 가 막아 readiness 의 `plugin-validator` 가 대신 확인한다.

## 결정 · 제한

- 05·09 단계는 제품 전체 문서라 절이 없고 노트에서 "(제품 전체)" 로 묶인다(Design 의 "(범위 없음)" 표기를 옛 항목 전용으로 좁힘).
- 정리 중간 실패의 "변경 0" 은 undo 목록(폴더 되돌리기·파일 복원)으로 구현했다. undo 자체가 실패하는 경우(권한 등)는 남은 되돌리기를 계속하되 보장하지 않는다.
- 옛 정본은 플러그인 업데이트 뒤 `/vais 정리` 전까지 단계·기능 작업의 stage-document 검사가 그 명령을 안내하며 막는다.
