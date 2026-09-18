---
schema: vais-phase/v1
work_item: WI-2026-09-18-harness-scope-sections
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 범위로 묶는 정본과 회의록 (harness-scope-sections)

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007

## 테스트

TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007 — 독립 QA (AS-0c272328) PASS. readiness `test`·`lint`·`plugin-validator` pass, review `secret-scan` pass. QA 가 `npm test` 257/0 · `npm run regression` 10/0 · `npm run lint` 0 경고를 재실행하고 버전 7면+lock·TTL·문서 문구를 대조했다.

## 입력 · 출력

입력은 승인된 Design 의 REQ 표, `contracts/chain-stages.json`·`id-chain.js`·`router.js`·prompt hook·CLI·`migrate-scopes.js`·`product-note.js`·`document-manager.js`, 단계 fixture 8개, po_report 형태 옛 구조 fixture, 문서·버전 파일이고, 출력은 `## 범위:` 절 검사·범위 이름 규칙·`nextIds`·범위별 표·`/vais 정리` 두 단계·4.3.0 이다.

## 기대 · 실제

| TC | 기대 | 실제 | 판정 |
|---|---|---|---|
| TC-001 | `새 제품` 만 오면 범위 묻기·CLI 거부, 회의록 `work-items/reading-log/<날짜>-<단계>/`, 2단계 물려받기, 두 번째 범위 1~3단계 | 장면 A 그대로 | PASS |
| TC-002 | 절 밖 항목 / 절 없는 문서 / 타범위 변경·추가·삭제 / 01 `목표:` 누락이 각각 finding, fixture 로 기존 사슬·stale·커버리지 동일 | finding 문구 일치, 기존 단위 257 pass | PASS |
| TC-003 | 두 번째 범위 절 추가 시 첫 범위 hash 불변, 범위별 커버리지, `nextIds` | 장면 A 21 항목, REQ-004·F-004 | PASS |
| TC-004 | `docs/README.md` "범위 · Feature", 제품 노트 `## 범위별` 표 | 그대로 ((제품 전체)·(범위 없음) 구분 포함) | PASS |
| TC-005 | 옛 구조 fixture: propose 표 → commit → 폴더·정본·상태·장부·인덱스, 승인 유지, 두 번째 "변경 없음" | 그대로 | PASS |
| TC-006 | 활성 작업 / lease / dirty / 불일치 각각 거부, 중간 실패 시 변경 0 | 그대로 (git porcelain 빈 문자열) | PASS |
| TC-007 | 7면+lock 4.3.0, CHANGELOG, README·CLAUDE·ONBOARDING·design.md, TTL 7200000, test·regression·lint | 그대로 | PASS |

## 엣지 · 제한

- QA 가 실제 po_report 복사본 이전과 `npm run validate` 직접 실행은 하지 않았다(write guard). fixture 이전과 readiness `plugin-validator` 영수증으로 대체.
- QA 리스크: 테스트용 `failAfter`·`beforeApply` 옵션이 `commitScopeMigration` 에 남아 있다(운영 경로에서는 undefined). `docs/features/<범위>` 안 작업 순서와 이전 후 `doctor` 결과는 미검증.
- 옛 정본은 플러그인 4.3.0 업데이트 뒤 `/vais 정리` 전까지 단계·기능 작업의 stage-document 검사가 그 명령을 안내하며 막는다.

## 증거

- `04-review/evidence/handoffs/AS-0c272328-f226-4805-b37c-91eb1cd1178e.json`
- `04-review/evidence/checks/secret-scan.json` · `03-do/evidence/checks/{test,lint,plugin-validator}.json`
