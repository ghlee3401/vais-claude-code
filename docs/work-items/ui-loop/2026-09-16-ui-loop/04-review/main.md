---
schema: vais-phase/v1
work_item: WI-2026-09-16-ui-loop
phase: review
revision: 1
status: approved
based_on: []
---

# Review — UI 루프 (독립 QA 2차)

## 판정: PASS (12/12)

독립 QA(assignment AS-70a0d157, clean-room, 읽기 전용, 수정 회차 1)가 Plan/Design(9절 수정 회차 1 반영)의 REQ-001~012·TC-001~012 기준으로 다시 검사했다. 입력은 Plan/Design 정본, 1차 handoff, 수정된 두 파일(hook·테스트)의 diff, Do receipt 3종, secret-scan receipt, QA 가 직접 실행한 `npm test`(207 pass·skip 0, 실제 Chrome 캡처 3.2초 실행)·`npm run regression`(7 pass)·`npm run lint`(0)·`npm run doctor`(fail 0) 출력. 출력은 TC 별 판정과 잔여 리스크다. 1차 FAIL(TC-004) 은 hook 의 blocked 분기와 상태 줄 표시로 해소됐다.

## TC 별 기대 · 실제 · 판정

| TC | REQ | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| TC-001 | REQ-001 | one-line Plan·options-screens Design, 그림 누락 거부, 안 상한 | 1차 PASS, 회귀 없음 | PASS |
| TC-002 | REQ-002 | screens capture 경계, 사본 존재 | 1차 PASS, 회귀 없음 | PASS |
| TC-003 | REQ-003 | READY → do/waiting-user, 확인·수정·checkpoint, 다른 kind 불변 | 1차 PASS, 회귀 없음 | PASS |
| TC-004 | REQ-004 | 6번째 수정 blocked, 상한 지침(`/vais 확인`·`/vais cancel`), 상태 줄에 blockReason | hook blocked 분기가 상한 지침만 내고 "취향 기록" 문구 없음, 상태 줄 `do · blocked: screen-revision-limit`, blocked 에서 확인 → screen-confirm | PASS |
| TC-005 | REQ-005 | findChrome·stub·CHROME_NOT_FOUND·실제 Chrome | 실제 캡처 테스트 skip 없이 통과 | PASS |
| TC-006 | REQ-006 | round-0·N png, review.html | 1차 PASS, 회귀 없음 | PASS |
| TC-007 | REQ-007 | CSS diff 문장 | 1차 PASS, 회귀 없음 | PASS |
| TC-008 | REQ-008 | 취향 3·결정 1, 제품 전체 취향 주입 | 1차 PASS, 회귀 없음 | PASS |
| TC-009 | REQ-009 | W·V 렌더, 실패 finding | 1차 PASS, 회귀 없음 | PASS |
| TC-010 | REQ-010 | doctor browser·statusline | 1차 PASS, 회귀 없음 | PASS |
| TC-011 | REQ-011 | 장면 C | QA 직접 실행 통과 | PASS |
| TC-012 | REQ-012 | 3.4.0·문서 | 1차 PASS, 회귀 없음 | PASS |

## 엣지 · 제한

- QA 리스크 4건은 Report 잔여 제한으로 넘긴다: material Design 개정 뒤 `chosenOption` 유지, 트리거 `색` 이 "검색" 요청에 ui 오제안, do/blocked 에서 수정 문장은 일반 지침으로 흐름(확인·취소만 유효), blocked 경로는 단위 테스트만 있고 장면 C 에는 없음.
- 미검증 3건: 실제 Chrome 으로 do ready 전 구간(단위·회귀는 stub, 캡처 자체는 실제 Chrome 테스트로 확인), 플러그인 캐시 3.4.0 반영(push 전), do/blocked 에서 `/vais cancel` 을 실제 hook 으로 실행.
- 1차에서 지적된 예약 `screenshot-compare` 를 check 로 선언하면 gate BLOCKED 되는 점과 W·V PNG 렌더가 Review 검사에서 재실행되는 점도 잔여 제한으로 남긴다.

## 증거

- 2차 QA handoff: `04-review/evidence/handoffs/AS-70a0d157-6546-431b-8e04-6aa79d0d55cc.json`
- 1차 QA handoff: `04-review/evidence/handoffs/AS-fd16e8ce-278f-414c-baea-87392ab765e6.json`
- 도구 receipt: `03-do/evidence/checks/{test,lint,plugin-validator}.json`, `04-review/evidence/checks/secret-scan.json`
- 회귀: `tests/regression/scene-c-ui-loop.test.js`
