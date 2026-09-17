---
schema: vais-phase/v1
work_item: WI-2026-09-16-regression-and-docs
phase: plan
revision: 1
status: approved
based_on: []
---

# Plan — 회귀 세트와 문서 정리 (regression-and-docs)

kind: harness (이 저장소 자체 작업) · 규모: standard · 로드맵 H7

## 1. 문제

H1~H6 로 루프·양식·노트·명령·kind 가 모두 들어왔지만, 세 가지가 남았다. (1) 회귀 장면 6개(A~F)와 commands 가 각각 다른 시기에 만들어져 머리말·fixture·렌더러 스위치가 제각각이고, 어떤 장면이 설계 문서 §11 의 어느 장면인지 한눈에 안 보인다. (2) 오늘 `/vais 저장 확인` 이 실제 repo 에서 실패했다 — `.gitignore` 에 `.vais/` 가 있으면 `git add` 의 exclude 경로가 git 안내 메시지와 종료 코드 1 을 내고, runtime 은 스테이지만 하고 커밋을 멈춘다. 사용자는 `/vais commit` 을 쳤지만 별칭이 없어 새 요청으로 잡혔고, 저장 제안의 변경 목록 첫 줄은 앞 점이 빠져 보였다. (3) README·ONBOARDING·CLAUDE 는 라운드마다 덧붙여져 순서가 어긋났다(CLAUDE 10-6 이 10-5 앞, 상태 줄·구조도가 H6 시점).

## 2. 목표

비개발자가 "저장" 이라고 말한 것이 실제 커밋으로 끝나고, 새 사람이 문서 셋을 읽으면 3.x 전체가 한 판으로 이해되며, `npm run regression` 하나가 설계 문서의 장면 6개를 그대로 증명한다. 이 상태를 4.0.0 으로 이름 붙인다.

## 3. 범위

포함: 회귀 세트 정리, 저장 명령 결함 3건 수정과 회귀 테스트, 문서 셋·설계 대응표·로드맵 갱신, 버전 4.0.0. 제외: 새 기능(H8 디자인 시스템 MCP 는 별도), 상태 머신·양식 변경, 실제 Chrome 을 요구하는 테스트.

## 4. 요구사항

| ID | 요구사항 | 완료 조건 |
|---|---|---|
| REQ-001 | 회귀 세트 정리: 장면 A~F + commands 가 같은 머리말(설계 §11 장면 번호·검증 범위·렌더러)을 갖고 `npm run regression` 에서 전부 통과한다. 공통 준비(임시 repo·fixture 복사·사슬 승인)를 helper 로 모은다. | 7 파일 PASS, 60초 이내, helper 1개. |
| REQ-002 | 저장 결함 A: `.gitignore` 에 `.vais/` 가 있어도 `/vais 저장 확인` 이 커밋까지 간다. 실패하면 reason 에 "스테이지만 됨·커밋 안 됨" 을 사용자 말로 적는다. | `.gitignore` 있는 임시 repo 회귀 PASS. |
| REQ-003 | 저장 결함 B: `/vais commit` 은 `저장`, `/vais commit 확인`(또는 `commit confirm`) 은 `저장 확인` 별칭이다. 도움말 표에 표기. 정확히 그 문구만 별칭이고 "commit 기능 만들어" 같은 문장은 새 요청이다. | 라우터 테스트 PASS. |
| REQ-004 | 저장 결함 C: 저장 제안의 변경 목록에서 첫 줄 앞 점(`.claude-plugin`)이 빠지지 않는다. | 테스트 PASS. |
| REQ-005 | 문서 셋 정리: README(사용 순서·명령 표·저장 두 단계와 실패 안내·kind 표), ONBOARDING(읽는 순서 11 항목 압축), CLAUDE(규칙 번호 순서 10-1~10-6 정렬, 상태 줄, 구조도, Testing). | 세 문서에 3.x 시점 잔재 없음. |
| REQ-006 | 설계 대응표(`docs/harness/design.md`) 전 행 상태 최종화, 로드맵 H6 완료·H7 진행, 회귀 장면 표를 설계 §11 과 맞춘다. | 대응표에 "신규·변경·진행 중" 잔재 없음(H8 행 제외). |
| REQ-007 | 버전 4.0.0: 7면 동기화, CHANGELOG [4.0.0] 에 "루프·양식·노트·명령·kind 완성" 요약과 3.1~3.6 링크. | version-sync PASS, doctor pass. |

## 5. 사용자 흐름

사용자는 바뀐 것을 거의 느끼지 않는다. `/vais 저장` → `/vais 저장 확인`(또는 `/vais commit` → `/vais commit 확인`) 이 커밋으로 끝나고, 실패해도 "무엇이 됐고 안 됐는지" 가 한 문장으로 보인다. 새 세션·새 사람은 ONBOARDING 5분 → CLAUDE → README 순으로 읽으면 된다.

## 6. 엣지 케이스

- git 저장소가 아니거나 원격이 없는 프로젝트: 저장은 기존처럼 reason 으로 거부.
- `.gitignore` 가 없는 repo: 기존 동작 그대로(H5 테스트 유지).
- `commit` 단어가 들어간 일반 요청: 별칭이 아니라 새 요청으로 라우팅.
- Chrome 없음: 회귀는 stub 렌더러로만 돈다(실제 렌더는 단위 테스트가 덮음).
- 회귀가 60초를 넘으면 느린 장면을 finding 으로 남기고 줄인다.

## 7. 완료 조건

`npm test`·`npm run regression`·`npm run lint`·플러그인 검증 PASS, 저장 결함 3건의 회귀 테스트 PASS, 버전 4.0.0 7면 일치, 독립 QA PASS, `/vais doctor` fail 0.

## 8. 영향

변경: `lib/workflow/v2/vcs.js`, `router.js`, prompt hook 도움말, `tests/regression/*`(+helper), `tests/v2-commands.test.js`, README·ONBOARDING·CLAUDE·CHANGELOG, `docs/harness/{design,roadmap}.md`, 버전 7면. 상태 머신·양식·계약은 바꾸지 않는다. 커밋은 `/vais 저장` 흐름(고친 뒤 자기 검증).
