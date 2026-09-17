---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-readme-status-2
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 하네스 README 상태 표 갱신 (harness-readme-status-2)

## 1. 접근

`docs/harness/README.md` 의 `## 상태` 표 세 행을 오늘 값으로 바꾸고, 세는 기준을 표 아래 한 줄로 남겨 다음에 또 낡아도 누구나 다시 셀 수 있게 한다. 요약·목차 문장은 검토 결과 정본과 어긋나지 않아 그대로 둔다. 코드는 건드리지 않는다.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 상태 표 갱신 | `lib/workflow/v2/*.js` 목록, `hooks/hooks.json`, `vais.config.json` | 아래 "바뀔 표" | 센 값과 저장소가 다르면 QA FAIL | 구현 행 "H1~H8 완료 (4.0.1, 2026-09-17)". 커널 행 "v2 runtime 모듈 38(`lib/workflow/v2/*.js`, index.js 포함), hook 이벤트 5·스크립트 6, CLI 1". 표 아래 세는 기준 한 줄 | TC-001 |
| REQ-002 | 요약·목차 대조 | `design.md` 7·17행, `chain-stages.json` | 이상 없음 | — | "11단계 사슬" 은 정본 design.md 의 표현(단계 문서 10 + 구현 1)과 같으므로 유지. 목차 표 두 행은 파일과 일치 | TC-002 |
| REQ-003 | 변경 기록 | `CHANGELOG.md` | `## [Unreleased]` 절 1개 | — | 4.0.1 은 이미 커밋된 판이므로 그 아래에 덧붙이지 않고 맨 위에 `## [Unreleased]` + `### Changed` 한 줄. 버전 7면은 4.0.1 그대로 | TC-003 |

바뀔 표:

| 항목 | 값 |
|---|---|
| 설계 승인 | 2026-09-15 (Design revision 1) |
| 구현 | 로드맵 H1~H8 완료 (4.0.1, 2026-09-17) |
| 현재 커널 | v2 runtime 모듈 38 (`lib/workflow/v2/*.js`, index.js 포함), hook 이벤트 5 · 스크립트 6, CLI 1 (`scripts/vais-workflow-v2.js`) |

## 3. 결정

- 버전은 4.0.1 을 유지한다. 문서 한 파일 갱신이라 플러그인 동작이 바뀌지 않는다 (사용자 확인 2026-09-17).
- 모듈 수는 `lib/workflow/v2/*.js` 파일 수(index.js 포함)로 센다. CLAUDE.md·ONBOARDING 의 "35 모듈" 과 다른데, 그 두 문서는 이번 범위 밖이라 Report 잔여 제한으로 남긴다.
- CHANGELOG 는 `[Unreleased]` 절로 적는다. 이미 커밋된 `[4.0.1]` 절을 고치지 않는다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약·보안·UI·성능 | 불필요 — 마크다운 두 파일 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `docs/harness/README.md`, `CHANGELOG.md`.

## 6. readiness · review

readiness: `plugin-validator`, `test`. review: `secret-scan` + 독립 QA(읽기 전용)가 표의 숫자를 저장소에서 다시 세어 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | README 상태 표: 구현 행에 "H1~H8 완료"·"4.0.1", 커널 행의 모듈·hook·CLI 수가 `ls lib/workflow/v2`(38)·`hooks/hooks.json`(이벤트 5, 스크립트 6)·`scripts/`(CLI 1)와 같고, 표 아래 세는 기준 한 줄이 있다 | 일치 |
| TC-002 | README 요약의 "11단계" 가 `design.md` 요약과 같은 표현이고, 목차 표의 두 파일이 존재한다 | 이상 없음 |
| TC-003 | `CHANGELOG.md` 맨 위에 `## [Unreleased]` 와 README 갱신 한 줄, `package.json`·`vais.config.json`·`plugin.json`·`marketplace.json`(2)·README 배지가 모두 4.0.1 | 일치 |

## 8. rollback

두 파일 `git checkout -- docs/harness/README.md CHANGELOG.md`.
