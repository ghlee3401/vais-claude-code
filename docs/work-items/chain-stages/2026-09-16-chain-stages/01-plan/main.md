---
schema: vais-phase/v1
work_item: WI-2026-09-16-chain-stages
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 사슬 단계 (chain-stages, 로드맵 H2)

## 한 줄 요약

요구사항부터 테스트 계획까지 10개 문서를 각각 하나의 작업(kind)으로 만들고, 문서마다 ID·부모·승인·stale 을 runtime 이 검사하게 한다. 설계 정본 `docs/harness/design.md` 2·3·5절과 로드맵 H2 가 근거이며, 완료 조건은 장면 A(처음 시작)가 1~10단계를 끝까지 통과하는 것이다. 관문을 묶거나 단계를 합치지 않는다 (사용자 결정 2026-09-16).

## 1. 문제

- 지금 커널은 Plan/Design 두 문서만 알아서 요구사항·기능·화면·와이어·디자인 시스템·시안·데이터·API·기술 구조·테스트 계획이 한 Design 안에 뭉개진다. 결정이 문서에 남지 않고 다음 세션의 AI 가 빈 자리를 임의로 채운다.
- 항목에 ID 와 부모가 없어 "이 화면이 어느 기능에서 왔는지" 를 추적할 수 없고, 상위가 바뀌어도 하위가 그대로 남는다.
- 앞 단계 승인 없이 다음 단계로 갈 수 있다.
- specialist 산출물이 3KB handoff 로 뭉개져 와이어·시안 같은 산출물이 손실된다.

## 2. 목표

11단계 사슬의 1~10 단계를 데이터로 정의하고, 각 단계를 5단계 커널 위의 작업(kind)으로 돌리며, ID 사슬(부모 필수·stale 전파·허용 부모표)과 진입 잠금을 runtime 이 강제한다. 구현 kind(feature·ui·bug)의 인용 강제는 H6, 화면 렌더링·확인 정지점은 H4 로 남긴다.

## 3. 범위

포함: 단계·kind 정의 데이터, Work item `kind`, 진입 잠금, 단계 문서 형식과 파서, 부모·stale 검사, `stage present` transaction, 단계별 Plan·Design 양식, specialist 산출물 직접 기록, 장면 A 회귀 테스트, 문서·버전.
제외: 제품 노트 4면·브리핑(H3), 화면 렌더링·스크린샷·확인 정지점(H4), 명령 다섯(H5), 구현 kind 의 인용 강제·stale Gate(H6), 실제 제품 앱, 관문 묶기·단계 합치기.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 단계 1~10 을 `contracts/chain-stages.json` 에 데이터로 정의한다. | 단계마다 ID 접두, 정본 파일, 필수 항목, 저장 검사, 고르기·확인 산출, owner·specialist, 승인 문구가 있고 schema 검증을 통과한다. |
| REQ-002 | kind 를 `contracts/work-kinds.json` 에 정의한다 (`stage-*` 10, `feature`, `ui`, `bug`, 하네스 자체 작업용 `harness`). | kind 마다 읽는 문서, 건드리는 ID, 갱신 문서, Plan·Design 양식, 수정 루프 상한이 있다. |
| REQ-003 | Work item 이 `kind` 를 가진다. 요청에서 kind 를 정하고 사용자 확인을 받는다. | schema 에 `kind` 가 있고, 기존 작업은 `harness` 로 읽힌다. |
| REQ-004 | 진입 잠금: `stage-N` 작업은 `stage-(N-1)` 정본이 approved 일 때만 만들 수 있다. 1단계는 선행 없음. | 건너뛰기 생성이 CLI 에서 거부되고 이유가 표시된다. |
| REQ-005 | 단계 문서 형식은 `### {ID} ← {부모}` 제목 + 필수 항목 표이며 `id-chain.js` 가 ID·부모·본문 해시를 파싱한다. | 예시 문서 10종이 파싱되고 잘못된 제목은 finding 으로 나온다. |
| REQ-006 | 부모 필수와 허용 부모표(F←REQ, S←F, W←S, V←W+DS, D←F, API←S/F, TC←F; REQ·DS·T 는 부모 없음)를 저장 시 검사한다. | 부모 없음·허용 밖 부모·미존재 부모가 각각 거부된다. |
| REQ-007 | stale 전파: 상위 항목 해시가 바뀌면 자식 항목에 `stale` 이 붙고, 재승인 또는 "변경 없음 확인" 기록으로만 해소된다. | 상위 수정 후 자식 stale 표시, 해소 두 경로 테스트 통과. |
| REQ-008 | `stage present` transaction 이 Do 에서 단계 정본을 검사·저장하고, Report finalize 가 정본을 `approved` 로 표시한다. | 실패 시 finding 만 남고 정본은 바뀌지 않는다. 성공 시 frontmatter 에 승인 revision·작업 ID 가 남는다. |
| REQ-009 | 단계 kind 의 Plan 은 "요청 확인 한 줄", Design 은 "고르기 안 목록" 양식이며 phase-check 가 kind 별 필수 섹션·예산을 적용한다. | 양식 밖 문서는 Gate 실패, 양식대로면 통과. |
| REQ-010 | specialist 산출물은 단계 파일에 직접 쓰고 handoff 에는 receipt·판정·쓴 파일 목록만 남긴다. | assignment writeScope 에 단계 파일이 들어가고 handoff 에 파일 목록 필드가 있다. |
| REQ-011 | 화면 흐름·와이어·시안 산출물은 파일 경로와 존재만 검사한다 (렌더링은 H4). | 파일 없는 항목은 저장 거부. |
| REQ-012 | 장면 A 회귀 테스트: fixture 프로젝트에서 1~10 단계를 CLI 로 끝까지 진행한다. | `npm run regression` 에 장면 A 가 있고 통과한다. |
| REQ-013 | 문서·버전: design.md 대응표 상태 갱신, roadmap H1 완료·H2 진행 표기, CHANGELOG, 버전 3.2.0 동기화. | doctor version-sync PASS. |

## 5. 사용자 흐름

1. `/vais 새 제품: 독서 기록 앱` → VAIS 가 kind `stage-requirements` 를 제안하고 사용자가 확인 → Plan(요청 확인 한 줄) 승인.
2. Design: 요구사항 후보 넣기/빼기 목록 → `/vais 승인`.
3. Do: `docs/product/01-requirements.md` 작성 → `stage present` 가 필수 항목·ID 검사 → 독립 QA → `/vais 최종 승인` → Report 가 정본을 approved 로 표시.
4. `/vais 기능 정의서` → kind `stage-features` (1단계 approved 라 진입 허용) → 같은 루프. F 항목마다 부모 REQ 가 없으면 저장 거부.
5. 10단계까지 반복. 중간에 1단계 문서를 고치면 그 REQ 를 부모로 둔 F·S·TC 가 stale 로 표시되고 해소 전에는 다음 단계로 못 간다.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 3단계를 건너뛰고 4단계 요청 | 생성 거부, "3단계 화면 정의서가 먼저" 안내. |
| approved 단계를 다시 고침 | 같은 kind 의 새 작업, revision+1, 자식 stale 전파. |
| 부모 ID 오타 | 미존재 부모로 저장 거부, 후보 ID 제시. |
| 기존 하네스 작업(kind 없음) | `harness` 로 읽고 현행 Plan/Design 양식 유지. |
| 와이어 파일이 없는 W 항목 | 저장 거부. 렌더링 도구는 H4 이므로 이번엔 파일을 사람이나 specialist 가 둔다. |
| 문서 예산 초과 | 단계 kind 는 항목 수에 비례하므로 예산을 항목당 바이트로 정의한다 (Design 에서 결정). |

## 7. 완료 조건

REQ-001~013 전부 테스트로 증명, 장면 A 회귀 통과, `npm test`·`lint`·`validate`·`regression` PASS, 독립 QA PASS, 사용자 최종 승인.

## 8. 영향

커널 변경: state-machine·work-item-store·phase-transaction·phase-check·document-quality·CLI·prompt hook·schema 2종. 신규: contracts 2, `id-chain.js`, `docs/product/` 규약, 회귀 장면 A. 기존 하네스 작업의 동작은 `harness` kind 로 그대로 유지된다. 실행 중 플러그인은 3.1.0 이라 이번 변경은 push·업데이트 뒤에 반영된다.
