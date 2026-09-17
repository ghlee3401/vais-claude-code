---
schema: vais-phase/v1
work_item: WI-2026-09-16-regression-and-docs
phase: review
revision: 1
status: approved
based_on: []
---

# Review — regression-and-docs

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007

## 테스트

TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007 — 독립 QA 가 `npm run regression`·`npm test` 를 직접 실행하고 문서를 대조한다. TC-011 은 Design 이 언급한 기존 commands 버전 검사(≥3.5.0 유지)로, 4.0.0 에서도 통과함을 함께 확인했다.

## 입력 · 출력

입력은 회귀 장면 7 파일과 helper, `vcs.js`·`router.js`, 문서 셋·대응표·로드맵·버전 7면이고, 출력은 회귀 PASS, `.gitignore` 있는 저장소에서의 커밋 해시, `commit` 별칭 라우팅, 앞 점이 보존된 변경 목록, 4.0.0 시점 문서다.

## 기대 · 실제

- 기대: 회귀 7 파일이 helper 를 쓰고 60초 안에 통과 / 실제: 총 3초 미만 PASS, 머리말 통일.
- 기대: `.gitignore` 에 `.vais/` 가 있어도 저장이 커밋까지 / 실제: 단위 TC-002 와 commands 회귀(`.gitignore` 저장소)에서 커밋 성공, `.vais/` 미포함, pre-commit 실패 시 "스테이지 1개 됨 · 커밋 단계에서 실패" reason.
- 기대: `commit` 단독·`commit 확인`·`commit confirm` 만 별칭 / 실제: 라우터 테스트 통과, `commit 기능 만들어` 는 새 요청.
- 기대: 변경 목록 첫 경로 앞 점 보존 / 실제: `.claude-plugin/plugin.json` 그대로.
- 기대: 문서 셋·대응표·로드맵이 4.0.0 시점 / 실제: CLAUDE 규칙 순서 정렬·상태 줄, README 순서·별칭·실패 안내, ONBOARDING 6 묶음, 대응표 잔재 없음, roadmap H6 완료·H7 진행.
- 기대: 버전 7면 4.0.0 / 실제: version-sync 5곳 + 배지 + CHANGELOG 일치, doctor fail 0(plugin-cache 경고는 push 전 정상).

## 엣지 · 제한

- `git rm --cached -- .vais` 는 `.vais` 가 인덱스에 없으면 `--ignore-unmatch` 로 조용히 지나간다. 다른 이름의 상태 폴더는 다루지 않는다.
- `commit <메시지>` 는 저장 메시지로 받지 않는다. 메시지는 `저장 확인: <메시지>` 또는 `commit confirm: <메시지>` 로만.
- 회귀 시간 상한 60초는 테스트가 강제하지 않고 QA 가 측정한다.
- 플러그인 캐시 반영은 push·업데이트 뒤의 일이라 이 작업에서 확인하지 않는다.

## 증거

- `03-do/evidence/transactions/PT-3d95ea97-f32b-466a-87b4-c8dbe4310b8c.json` (readiness READY: test·lint·plugin-validator)
- `04-review/evidence/checks/secret-scan.json` PASS
- 독립 QA handoff (`04-review/evidence/handoffs/`)
