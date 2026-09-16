---
schema: vais-phase/v1
work_item: WI-2026-09-16-feature-bug-kinds
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 기능·버그 작업 (feature-bug-kinds, 로드맵 H6)

## 한 줄 요약

실제 코드를 고치는 두 kind — `feature`·`bug` — 를 완성한다. Design 은 승인된 ID 인용과 새 ID 선언으로만 "만드는 것" 을 적고(ID 없는 서술은 실패), stale 이 있으면 시작을 막고, Do 뒤 runtime 이 제품 문서에 새 항목을 붙이고 Report 가 `구현됨` 을 찍는다. 앱을 띄워야 하는 프로젝트용 실행 어댑터를 더한다. 근거 `docs/harness/design.md` 3·4·5절, 장면 B·D. kind: harness. 규모: standard.

## 1. 문제

- `feature`·`bug` kind 는 이름만 있고 양식·검사가 없다. 구현이 어느 REQ·F·S 에서 왔는지 남지 않는다.
- stale 인데도 구현 작업을 시작할 수 있다.
- 구현 뒤 기능 정의서·API 규약·테스트 계획이 갱신되지 않아 문서와 코드가 갈라진다.
- 버그의 재현 절차·원인·재발 방지 TC 가 기록되지 않는다.
- 서버를 띄워야 하는 앱은 화면을 찍을 수 없다.
- H5 잔여: "버전 6곳" 표기 혼재, hook 죽은 분기.

## 2. 목표

feature/bug 작업이 사슬 ID 를 인용·확장하는 방식으로만 진행되게 runtime 이 강제하고, 문서 갱신·구현 도장·재발 방지 TC·장부 정리를 transaction 이 자동으로 한다. 사용자는 접근안 고르기와 검수표 확인만 한다.

## 3. 범위

포함: feature/bug 양식, 인용·신규 ID 검사, stale Gate, 문서 자동 append, `구현됨` 도장·제품 노트 반영, bug 재현·원인·수정안·TC, 앱 실행 어댑터, QA 범위 = Design 의 TC, 장면 B·D, H5 잔여 2건, 문서·버전 3.6.0.
제외: 회귀 완성·4.0.0(H7), MCP 결정(H8), 실제 제품 앱, push.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | feature/bug Plan 은 한 줄 양식(요청 확인·kind·관련 ID). Design 은 `## 안 N`(규모별 1~3), `## 인용`, `## 신규`(ID ← 부모 + 표), `## 검수표`(≤5), 쓰기 범위·검사·rollback. | 양식 밖 실패, 양식대로 통과. |
| REQ-002 | 인용 강제: 인용 ID 는 approved, 신규 ID 는 허용 부모표·다음 빈 번호. 인용·신규가 모두 없거나 사슬이 비면 Design 실패. | 부정 케이스 4종 거부. |
| REQ-003 | stale Gate: stale 항목이 있으면 feature/bug Design 제시 거부 + 해소 안내. | 거부, 해소 뒤 통과. |
| REQ-004 | 문서 갱신: `do ready` READY 시 `## 신규` 항목을 해당 정본(02·03·07·08·10)에 붙이고 index 에 `draft` 등록, `report finalize` 가 인용·신규에 `구현됨`(작업·일시) 기록 → 제품 노트 "현재" 에 구현됨 수. | 장면 B 뒤 문서·README 표 반영. |
| REQ-005 | bug: Design 에 `## 재현`(절차+화면), `## 원인`, `## 수정안` 1, 신규 TC. Review 는 재현 재실행 증거를 요구, Report 는 관련 부채를 장부에 "해소" 로 남김. | 장면 D 뒤 10 문서 TC, 장부 해소. |
| REQ-006 | 앱 실행 어댑터: `ui.run`(command·url·readyTimeoutMs)이 있으면 캡처 전 기동·URL 대기·캡처 후 종료. 실패는 명확한 오류. | 정적 서버 fixture 로 기동·캡처·종료. |
| REQ-007 | 화면 증거: feature 의 인용·신규에 S·W·V 가 있으면 Do 에 `screen-capture` 자동 부착(정지점 없음). | 화면 관련 feature 만 캡처. |
| REQ-008 | QA 범위: 배정 기준은 Design 검수표와 신규·인용 TC 로만, Review 는 그 TC 만 판정. | Review 양식 통과. |
| REQ-009 | 회귀: 장면 B·D 를 fixture 사슬 1~10 + mini-booking 위에서 CLI 완주. | `npm run regression` 통과. |
| REQ-010 | 문서·버전: roadmap H5 완료·H6 진행, design.md 대응표, README/CLAUDE/ONBOARDING, CHANGELOG, 3.6.0. H5 잔여: 7면 표기 통일, hook 죽은 분기 삭제. | version-sync PASS. |

## 5. 사용자 흐름

1. `/vais 책에 별점 매기기` → `feature` → Plan 한 줄("F-004·S-002 관련, API 신규") 승인.
2. Design: 접근 2안, 인용 `F-004, S-002`, 신규 `F-009 ← REQ-003, API-007 ← S-002, TC-015 ← F-009`, 검수표 3줄 → `/vais 1번` → 승인.
3. Do → `do ready` 가 02·08·10 에 항목 추가 → 검수표+화면 → QA(TC-015) → 최종 승인 → F-009 구현됨.
4. `/vais 별점이 저장 안 돼` → `bug` → 재현 확인 → Design 재현 화면·원인·수정안·TC-016 → 승인 → Do → Review 재현 미발생 → 최종 승인 → TC-016 반영, 부채 해소.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 사슬 문서 없음 | Design 거부, "요구사항 정의서부터". |
| 인용 ID 오타 | 거부 + 후보. |
| 신규 번호 충돌 | 다음 빈 번호 안내, 거부. |
| 앱 기동 실패 | NOT_READY, 명령·포트 표시, 프로세스 정리. |
| 재현 불가 | Gate 실패 — 재현 없는 버그 수정은 없다. |
| append 뒤 예산 초과 | READY 거부. |

## 7. 완료 조건

REQ-001~010 테스트 증명, 회귀 A·B·C·D·E·F + commands 통과, `npm test`·`lint`·`validate`·`regression`·`doctor` PASS, 독립 QA PASS, 최종 승인.

## 8. 영향

변경: work-kinds.json, phase-check, id-chain, phase-transaction, screen-capture, config, product-note, prompt hook, docs. 신규: `citation.js`, `app-runner.js`, 장면 B·D. 다른 kind 동작은 그대로. 커밋은 `/vais 저장` 흐름.
