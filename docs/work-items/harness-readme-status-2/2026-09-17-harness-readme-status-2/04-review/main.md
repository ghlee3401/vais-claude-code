---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-readme-status-2
phase: review
revision: 1
status: approved
based_on: []
---

# Review — harness-readme-status-2

## 요구사항

REQ-001, REQ-002, REQ-003

## 테스트

TC-001, TC-002, TC-003 — 독립 QA 가 저장소를 직접 세어 표·CHANGELOG·버전과 대조한다.

## 입력 · 출력

입력은 승인된 Design 의 "바뀔 표", `lib/workflow/v2` 파일 목록, `hooks/hooks.json`, 버전 파일 6면이고, 출력은 갱신된 `docs/harness/README.md` 상태 표와 세는 기준 한 줄, `CHANGELOG.md` 의 `[Unreleased]` 절이다.

## 기대 · 실제

- TC-001 기대: 구현 행 H1~H8 완료·4.0.1, 커널 행 모듈 38·이벤트 5·스크립트 6·CLI 1, 기준 줄 존재 / 실제: QA 재계산 값과 일치.
- TC-002 기대: "11단계" 가 design.md 요약과 같은 표현, 목차 파일 존재 / 실제: 동일, 두 파일 존재.
- TC-003 기대: CHANGELOG 맨 위 `[Unreleased]` 한 줄, 버전 6면 4.0.1 / 실제: 일치.
- QA 판정 PASS. 기준 줄의 "최상위 키" 표현이 실제로는 `hooks` 아래 키를 뜻해 정확하지 않으나 QA 가 비차단으로 분류.

## 엣지 · 제한

- CLAUDE.md·ONBOARDING 의 "35 모듈" 은 이번 범위 밖이라 그대로다. Report 잔여 제한으로 남긴다.
- QA 는 plugin-validator·test 를 재실행하지 않고 Do 의 readiness 증거를 신뢰했다.
- 기준 줄 "최상위 키" 문구는 다음 문서 작업에서 "`hooks` 아래 키" 로 고칠 후보다(동작 무관).

## 증거

- `03-do/evidence/transactions/PT-a71df7e0-c858-4edf-9d2e-89886662db83.json` (readiness READY: plugin-validator·test)
- `04-review/evidence/checks/secret-scan.json`
- 독립 QA handoff AS-7a8dc929-0a0f-45f9-8211-02bdfe611ac6 (`04-review/evidence/handoffs/`)
