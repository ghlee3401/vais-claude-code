---
schema: vais-phase/v1
work_item: WI-2026-08-31-workflow-redesign
phase: do
revision: 12
status: ready
based_on:
  - ../01-plan/main.md
  - ../02-design/main.md
  - revisions/v11.md
implemented_at: 2026-09-10
---

# Do revision 12 — immutable formal stage filesystem seal

## 변경

Review Attempt 17에서 Legacy 1의 다섯 turn은 완료됐지만, Legacy QA가 plugin stage를 현재 작업 디렉터리로 사용해 `auto-judge.js`의 `.vais/event-log.jsonl`을 stage 안에 기록했다. 종료 무결성 검사는 승인 digest 불일치를 감지해 cohort를 즉시 차단했다. formal runner가 실행 동안 두 plugin stage 전체를 OS 읽기 전용으로 봉인하고, 성공·실패 어느 경로에서도 원래 mode를 복원하도록 보완했다.

| 영역 | 구현 결과 |
|---|---|
| stage 봉인 | Legacy·v2 stage의 모든 파일·디렉터리에서 write bit를 제거한 뒤 실제 journey 시작 |
| mode 복구 | 정상 완료와 cohort 준비 실패를 포함한 `finally` 경로에서 원래 mode를 정확히 복원 |
| 경로 방어 | 봉인 전 stage 부재·비디렉터리·symbolic link를 거부 |
| OS write proof | 봉인 중 일반 실행 UID의 `.vais/event-log.jsonl` 생성 시도 exit 1, 파일·디렉터리 미생성 |
| digest 보존 | 봉인·write probe·복원 전후 Legacy/v2 digest와 file count 불변 |
| 유지 계약 | 제품 코드, 공개 UX, user turn, workload, adapter, 품질·telemetry·no-dollar-cap 규칙은 변경 없음 |

## 검증

| Evidence | 결과 |
|---|---|
| 공정 비교 focused | 9/9 PASS |
| 전체 regression | 575개 중 572 PASS, 환경성 3 SKIP, FAIL 0 |
| ESLint | PASS, warning 0 |
| Source validator | PASS, error 0, warning 0 |
| npm audit | 취약점 0 |
| 봉인 회귀 | exact mode 복원 PASS; cohort 준비 오류 경로의 mode 복원 PASS |
| formal stage | `/tmp/vais-rev12-formal.r2vNaq`; Legacy 546 files, v2 415 files, 승인 digest와 byte-level 동일 |
| no-cap dry-run | `READY`, `paidCalls: 0`, cohort `cohort-374fbf287adef83263b2c2e1` |
| dry-run manifest | SHA-256 `2d0b16c4faf5856350c812b5e8d5c08b5779de43ea2c4fcdc4fa8dbc5ec55ce7` |

## Readiness

평가기 보완·전체 회귀·formal stage·OS write proof·무과금 dry-run Readiness는 모두 **PASS**다. Attempt 17은 실패 표본을 대체하지 않고 `BLOCKED`로 보존한다. 새 cohort의 Attempt 18은 사용자 명시 재승인 후에만 시작한다.
