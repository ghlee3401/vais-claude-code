---
schema: vais-phase/v1
work_item: WI-2026-09-16-commands
phase: review
revision: 1
status: approved
based_on: []
---

# Review — 사용자 명령 (독립 QA)

## 판정: PASS (11/11)

독립 QA(assignment AS-5f2b1bfe, clean-room, 읽기 전용, 수정 회차 0)가 Plan/Design 의 REQ-001~011·TC-001~011 기준으로 코드·hook·CLI·용어 사전·테스트·문서·버전을 검사했다. 입력은 Plan/Design 정본, 변경 파일 본문, Do receipt 3종, secret-scan receipt, QA 가 직접 실행한 `npm test`(217 pass)·`npm run regression`(8 pass, commands 포함)·`npm run lint`·`npm run doctor` 출력. 출력은 TC 별 판정과 잔여 리스크다. runtime 이 실행하는 git 이 `add`·`commit`·`revert`(실패 시 abort) 뿐이고 push 가 없음을 `vcs.js` 본문으로 확인했다.

## TC 별 기대 · 실제 · 판정

| TC | REQ | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| TC-001 | REQ-001 | status summary 활성 있음/없음 | 브리핑과 같은 사실, 문장 형식 고정 | PASS |
| TC-002 | REQ-002 | 설명 ID·용어·파일·미지 | 종류별 필드, 미지는 후보 제시 | PASS |
| TC-003 | REQ-003 | 저장 제안, 토큰 없이 거부, 토큰 뒤 커밋, 버전 불일치 거부 | `CONFIRMATION_REQUIRED`·`SAVE_REFUSED`, 커밋 해시·trailer 확인 | PASS |
| TC-004 | REQ-004 | 되돌리기 제안, 없는 대상 거부, 토큰 뒤 revert, 파일 원복 | 통과 | PASS |
| TC-005 | REQ-005 | propose = 브리핑 제안 | 통과 | PASS |
| TC-006 | REQ-006 | 기록 종류 6·한글 매핑·종류 오류·보기 | 통과, `source user` | PASS |
| TC-007 | REQ-007 | router 8종·HELP·토큰 없는 CLI 거부·다른 세션 토큰 거부 | 토큰은 hook 이 사용자 문장에서만 발급, 종류 오류 `기록` 은 일반 요청으로 통과 | PASS |
| TC-008 | REQ-008 | chosenOption 초기화·검색 비 ui·outcome 501자 거부 | `REPORT_OUTCOME_TOO_LONG` 확인 | PASS |
| TC-009 | REQ-009 | doctor git 3경우 | 통과 | PASS |
| TC-010 | REQ-010 | commands 회귀 | QA 직접 실행 통과 | PASS |
| TC-011 | REQ-011 | 3.5.0 6곳·CHANGELOG·roadmap H4 완료·대응표 | 통과 | PASS |

## 엣지 · 제한

- QA 리스크 3건은 Report 잔여 제한으로 넘긴다: 문서의 "버전 6곳" 과 실제 검사 7면(manifest 5 + README 배지 + CHANGELOG 헤더) 표기 혼재, hook 의 `ledger-add-invalid` 지침 분기가 router 변경으로 도달하지 않음(무해한 죽은 분기), revert 는 미커밋 변경이 있으면 전면 거부.
- 미검증 3건: Claude Code 실제 hook 경로의 끝-끝 실행(단위·회귀는 hook 함수 직접 호출), 플러그인 캐시 3.5.0 반영(push 전), revert 충돌 시 abort 경로(테스트는 충돌 없는 경우만).
- 이 작업의 커밋은 아직 3.4.0 런타임이라 마지막으로 사용자가 `! git` 을 직접 친다. 다음 작업부터 `/vais 저장` 흐름이다.

## 증거

- QA handoff: `04-review/evidence/handoffs/AS-5f2b1bfe-0a59-4706-afbd-edfe9110cb02.json`
- 도구 receipt: `03-do/evidence/checks/{test,lint,plugin-validator}.json`, `04-review/evidence/checks/secret-scan.json`
- 회귀: `tests/regression/commands.test.js`
