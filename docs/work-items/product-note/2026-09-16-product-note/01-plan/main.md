---
schema: vais-phase/v1
work_item: WI-2026-09-16-product-note
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 제품 노트 (product-note, 로드맵 H3)

## 한 줄 요약

결정·변경·승인을 장부에 자동 기록하고, 장부와 사슬 상태로 제품 노트 4면(현재·다음·왜·과거)·세션 브리핑·상태 줄을 기계가 만들며, 기록 없이는 턴을 못 끝내게 Stop 을 잠근다. 근거 `docs/harness/design.md` 4·6·8절, 로드맵 H3. 완료 조건은 장면 E 통과와 `decisions.md` 자동 생성. kind: harness. 규모: standard.

## 1. 문제

- 승인·거절·QA FAIL·잔여 제한이 phase 문서에 흩어져 "왜" 를 한곳에서 볼 수 없고, 다음 세션 AI 가 맥락 없이 시작한다.
- 새 세션마다 사용자가 진행 상황을 기억해야 한다. 상태는 응답 첫 줄뿐이다.
- 제품 문서 10개의 승인·stale 상태를 한눈에 볼 면이 없다.
- AI 가 상태를 바꾸고도 기록 없이 턴을 끝낼 수 있다.
- H2 잔여 결함 3건(산출물 `../` 우회, 부모 삭제 시 stale 미발생, TC-008 테스트 조기 종료).

## 2. 목표

append-only 장부를 두고 transaction 이 자동으로 쓴다. 장부·work-items·chain-index 만 읽어(모델 호출 없이) 제품 노트를 Report 마다 다시 그리고, SessionStart 브리핑과 statusline 이 같은 출처를 보인다. Stop hook 이 기록 누락을 거부한다. 명령(`/vais 기록·제안·상태`)은 H5, UI 취향 기록은 H4.

## 3. 범위

포함: 장부 모듈·schema·자동 기록, 제품 노트 렌더링, 규칙 기반 제안 엔진, 세션 브리핑 hook, statusline, Stop hook, doctor 확장, Design 시 장부 주입, H2 잔여 결함 3건, 장면 E, 문서·버전 3.3.0.
제외: 사용자 명령(H5), UI 취향·화면 정지점(H4), feature/bug 인용 강제(H6), 실제 제품 앱.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 장부 `.vais/v2/ledger.jsonl` (append-only, `ledger-entry/v1`: id, ts, workItemId, kind, text, why, source, refs; kind = milestone·decision·feedback·preference·debt·risk·note) 와 `ledger.js`. | schema 통과, 잘못된 항목 거부, append 만 가능. |
| REQ-002 | 자동 기록: Plan·Design·최종 승인 → milestone, Design 결정 목록 → decision, 최종 거절·수정 요청 원문 → feedback, QA FAIL·Report limitation → debt, NOT_READY·blocked → risk. | 지점별 테스트에서 항목이 남고 source 에 transaction id. |
| REQ-003 | 제품 노트 자동 생성: `docs/product/README.md`(현재: 1~10 상태·검증일), `roadmap.md`(다음: 남은 단계·제안 3, 사용자 편집 섹션 보존), `decisions.md`(왜: 장부). 과거는 기존 `docs/README.md`. | Report finalize 마다 갱신, 손으로 쓴 섹션 보존. |
| REQ-004 | 제안 엔진 `proposal.js`: 상태·사슬·장부만 읽어 다음 행동 ≤3 (대기 결정, 미작성 다음 단계, stale 해소, 부채 정리). | 모델 호출 없음, 상황 4종 테스트. |
| REQ-005 | 세션 브리핑(SessionStart hook): 상태 한 줄, 지난 세션 마지막 사건, 열린 결정·부채·stale 수, 제안. | 새 세션 id 에서 출력, 상태 없으면 "시작 전", 예외는 경고 줄. |
| REQ-006 | 상태 줄 `scripts/vais-statusline.js`: `VAIS · {feature} · {phase}/{status} · 다음: {행동}`. doctor 가 설치 안내. | 활성 있음/없음 출력 테스트, doctor 항목. |
| REQ-007 | Stop hook: 이번 세션에서 상태가 바뀌었는데 장부 항목이 없거나 미등록 drift 가 있으면 종료 1회 거부. | 거부·허용 테스트, 무한 반복 없음, 비상 스위치 존중. |
| REQ-008 | doctor 확장: 장부 파일, SessionStart·Stop 등록, statusline 설치, stale 수. | 4 항목과 fail/warn 기준. |
| REQ-009 | Design 시작 시 같은 feature 의 feedback·preference·debt 최근 5개를 hook 지침에 주입. | 있을 때만 주입. |
| REQ-010 | H2 잔여 결함: artifactDir 밖 경로 거부, 부모 삭제 후 재승인 시 자식 stale, TC-008 부정 케이스 테스트 보강. | 각 테스트 통과. |
| REQ-011 | 장면 E 회귀: 세션 A Design 제시 후 끊김 → 세션 B 브리핑 → lease 재취득 → 종결 → decisions.md 생성. | `npm run regression` 통과. |
| REQ-012 | 문서·버전: roadmap H2 완료·H3 진행, design.md 대응표, CLAUDE/README/ONBOARDING, CHANGELOG, 3.3.0. | doctor version-sync PASS. |

## 5. 사용자 흐름

1. `/vais plan 승인` 만 하면 장부에 milestone 이 남는다.
2. Report 가 끝나면 `docs/product/` 의 README·roadmap·decisions 가 다시 그려진다. 사용자는 이 세 파일만 본다.
3. 다음 날 새 세션 첫 줄: `[book-app · design · waiting-user] 지난 세션: 시안 2안 제시 후 대기. 열린 결정 1, 부채 2, stale 0. 제안: ① 1번 ② 2번 ③ 취소`. 터미널 상태 줄에도 같은 상태가 보인다.
4. AI 가 기록 없이 끝내려 하면 Stop 이 막고, 기록 뒤에만 턴이 끝난다.

## 6. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 장부 줄 손상 | 읽기는 건너뛰고 doctor 가 fail, 쓰기는 계속 append. |
| roadmap.md 사용자 섹션 | 표식 사이는 보존, 자동 섹션만 교체. |
| 활성 작업 없는 세션 | "활성 작업 없음 · 제안: …" 한 줄. |
| Stop 거부 뒤 재차 미기록 | 1회만 거부, 두 번째는 경고만. |
| 하네스 비활성 | SessionStart·Stop 은 `{}` + 비활성 표시. |
| 제안 근거 부족 | 1~2개만 내고 만들어내지 않는다. |

## 7. 완료 조건

REQ-001~012 테스트 증명, 장면 A·E·F 통과, `npm test`·`lint`·`validate`·`regression`·`doctor` PASS, 독립 QA PASS, 최종 승인.

## 8. 영향

변경: phase-transaction·state-machine·prompt hook·doctor·id-chain·hooks.json(SessionStart·Stop). 신규: ledger.js, product-note.js, proposal.js, session-start.js, workflow-v2-stop.js, vais-statusline.js, schema 1, 장면 E. 기존 작업 문서는 불변, `docs/product/*.md` 3면은 Report 마다 재생성. 반영은 push·업데이트 뒤.
