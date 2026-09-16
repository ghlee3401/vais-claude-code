---
schema: vais-phase/v1
work_item: WI-2026-09-16-product-note
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 제품 노트 (독립 QA 2차)

## 판정: PASS (12/12)

독립 QA(assignment AS-a211da26, clean-room, 읽기 전용, 수정 회차 1)가 Plan/Design 의 REQ-001~012·TC-001~012 기준으로 코드·hook·CLI·테스트·문서·버전을 다시 검사했다. 입력은 Plan/Design 정본, 변경 파일 본문, Do receipt 3종, Review 의 secret-scan receipt, QA 가 직접 실행한 `npm test`·`npm run regression` 출력. 출력은 TC 별 판정과 잔여 리스크다. 1차 FAIL(TC-012 secret-scan) 은 테스트 fixture 문자열 교정으로 해소됐고, 1차에서 미검증이던 TC-011 과 TC-005·007 프로세스 실행은 이번에 QA 가 직접 확인했다.

## TC 별 기대 · 실제 · 판정

| TC | REQ | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| TC-001 | REQ-001 | 장부 append·read·깨진 줄·schema 위반 | 단위 테스트 통과 | PASS |
| TC-002 | REQ-002 | 승인·수정요청·QA FAIL·NOT_READY·limitation 기록, source id | 통과 (milestone 4·decision 2·feedback 1·debt 3·risk 1) | PASS |
| TC-003 | REQ-003 | 노트 3면 생성, roadmap 사용자 표식 보존 | 통과 | PASS |
| TC-004 | REQ-004 | 제안 4상황 규칙, ≤3 | 통과 | PASS |
| TC-005 | REQ-005 | SessionStart 브리핑 4경우 | hook 을 stdin 프로세스로 실행한 테스트 통과 | PASS |
| TC-006 | REQ-006 | statusline 3출력 + doctor | 통과 | PASS |
| TC-007 | REQ-007 | Stop 정상·신호 A·신호 B·stop_hook_active·OFF | hook 프로세스 실행 포함 통과 | PASS |
| TC-008 | REQ-008 | doctor 4검사 pass/warn/fail | 통과 | PASS |
| TC-009 | REQ-009 | Design 지침 장부 주입 | 통과 | PASS |
| TC-010 | REQ-010 | `../` 거부·부모 삭제 stale·scope 거부 | 통과 | PASS |
| TC-011 | REQ-011 | 장면 E 회귀 | QA 가 `npm run regression` 직접 실행, 6/6 | PASS |
| TC-012 | REQ-012 | 버전 3.3.0 6곳·CHANGELOG·roadmap·hooks 5종·secret-scan | secret-scan exit 0, 버전·문서 일치 | PASS |

## 엣지 · 제한

- QA 리스크 2건은 Report 잔여 제한으로 넘긴다: Stop 신호 A 의 1초 허용치(그 안에 일어난 사건 없는 상태 변경은 잡지 못함), 노트 렌더링 위치가 Design 표(phase-transaction)와 달리 store 의 completed 전이인 점(Design 수정 회차 1 에 반영해 문서상 불일치는 없음).
- QA 미검증 2건: 1차↔2차 diff 는 트리가 미커밋이라 git 으로 비교하지 못했고 변경 지점 일치로 대신 확인했다. `npm run doctor` 는 Do 의 실행 결과(fail 0·warn 2)를 믿었다.
- 실행 중 플러그인은 3.2.0 이라 SessionStart 브리핑·Stop 잠금·상태 줄은 push·업데이트 뒤 새 세션에서 실제로 보인다.

## 증거

- 2차 QA handoff: `04-review/evidence/handoffs/AS-a211da26-6c97-4b8b-b62f-44c0b71bd0c4.json`
- 1차 QA handoff: `04-review/evidence/handoffs/AS-fd2e5a59-8c56-4979-aa0a-71d1d989e106.json`
- 도구 receipt: `03-do/evidence/checks/{test,lint,plugin-validator}.json`, `04-review/evidence/checks/secret-scan.json`
- 회귀: `tests/regression/scene-e-session-resume.test.js`
