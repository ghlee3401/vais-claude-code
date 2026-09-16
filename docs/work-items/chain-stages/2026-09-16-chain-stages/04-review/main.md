---
schema: vais-phase/v1
work_item: WI-2026-09-16-chain-stages
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 제품 사슬 단계 (독립 QA)

## 판정: PASS (13/13)

독립 QA(assignment AS-63b698c5, clean-room, 읽기 전용, 수정 회차 0)가 Do 문서를 보지 않고 Plan/Design 의 REQ-001~013 과 TC-001~013 기준으로 카탈로그·schema·lib 12 모듈·hook·CLI·테스트·fixture·문서·버전을 검사했다. 입력은 Plan/Design 의 REQ·TC, 변경 파일 본문, 검사 receipt 4종이고 출력은 TC 별 판정과 잔여 결함 목록이다. 검사 receipt 는 신뢰하되 단위 16건·회귀 5건을 직접 다시 실행했고, 부정 케이스 7종은 scratchpad 의 자체 테스트로 재현했다. 첫 handoff 는 evidence 문자열 길이 초과로 계약 검증에 걸려 재발행받았다(내용 동일).

## TC 별 기대 · 실제 · 판정

| TC | REQ | 입력 | 기대 | 실제 | 판정 |
|---|---|---|---|---|---|
| TC-001 | REQ-001 | chain-stages.json, schema | 10 단계 통과, 필드 누락 거부 | 단위 테스트 통과 | PASS |
| TC-002 | REQ-002 | work-kinds.json | 14 kind 로드, 미정의 거부 | 통과 | PASS |
| TC-003 | REQ-003 | `--kind`, kindOf, hook 제안 | 생성·harness 보정·stage-requirements 제안 | 통과 | PASS |
| TC-004 | REQ-004 | 진입 잠금 | 1단계 미승인 시 거부 문구 "1단계 요구사항 정의서가 먼저" | 장면 A 에서 재현 | PASS |
| TC-005 | REQ-005 | fixture 10종 | 파싱·제목 오류 finding | 통과 | PASS |
| TC-006 | REQ-006 | 부모 검사 | 없음·허용 밖·미존재 거부, 후보 제시 | REQ-009 오타에서 "승인된 부모가 없다" + 후보 | PASS |
| TC-007 | REQ-007 | stale | 상위 수정 → 자식 stale, 두 경로 해소, 진입 거부 | 장면 A 에서 재현, AI 단독 confirm 거부 | PASS |
| TC-008 | REQ-008 | do ready · finalize · scope | stage-document 검사, 정본 불변, approved·index, docs/product 밖 거부 | 자체 테스트로 src/**·docs/work-items·../ 거부 확인 | PASS |
| TC-009 | REQ-009 | 양식 | one-line·options 통과, 안 상한, full 양식 거부, harness 현행 | 통과 | PASS |
| TC-010 | REQ-010 | handoff files | scope 안 저장, 밖·읽기 전용 거부 | 통과 | PASS |
| TC-011 | REQ-011 | 산출물 필드 | 파일 없음 거부 | 통과 | PASS |
| TC-012 | REQ-012 | 장면 A | 1~10 단계·건너뛰기·오타·stale·reindex | 회귀 5/5 통과 | PASS |
| TC-013 | REQ-013 | 버전·문서 | 3.2.0 6곳, CHANGELOG, roadmap, design.md | doctor version-sync 통과 | PASS |

## 엣지 · 제한

- QA 가 TC 밖으로 찾은 잔여 결함 3건은 Report 잔여 제한으로 넘긴다: 산출물 값에 `../` 를 쓰면 artifactDir 밖 파일도 통과함, 부모 항목을 삭제한 뒤 재승인하면 자식이 stale 로 표시되지 않음, TC-008 scope 단위 테스트가 인가 오류로 조기 종료해 부정 케이스 일부를 자체 테스트로 대신 확인함.
- 실행 중 플러그인은 3.1.0 이라 실제 Claude 세션의 hook 주입 문구(kind 제안, 단계 지침)는 직접 보지 못했다. 단위 테스트가 대리 증거이며, 플러그인 업데이트 뒤 새 세션에서 확인한다.
- `npm test` 전체 셋은 receipt 로만 확인했고 QA 는 v2-chain-stages 단위·회귀만 직접 재실행했다.

## 증거

- QA handoff: `04-review/evidence/handoffs/AS-63b698c5-2c47-45a9-ae53-67bc402711f8.json`
- 도구 receipt: `03-do/evidence/checks/{test,lint,plugin-validator}.json`, `04-review/evidence/checks/secret-scan.json`
- 회귀: `tests/regression/scene-a-first-product.test.js`, `tests/regression/scene-f-harness-failure.test.js`
