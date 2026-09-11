---
schema: vais-phase/v1
work_item: WI-2026-08-31-workflow-redesign
phase: report
revision: 1
status: completed
based_on:
  - ../01-plan/main.md
  - ../02-design/main.md
  - ../03-do/main.md
  - ../04-review/main.md
approved_by: user
approved_at: 2026-09-11
completed_at: 2026-09-11
frozen: true
---

# Report — VAIS workflow redesign

## 완료 결과

VAIS workflow v2의 단일 `/vais` 진입, 5단계 상태 머신, 승인 Gate, 역할·쓰기 권한, 독립 QA, 실제 브라우저 증거, 문서 lifecycle과 Legacy 호환 비교 체계를 구현했다. Review Attempt 18의 동일 조건 Opus 3×2 비교에서 여섯 run의 품질과 증거가 모두 유효했고 EFF-01~08이 전부 PASS했다. 사용자가 2026-09-11 최종 승인했으므로 `workflowV2.mode`의 정본 기본값을 `shadow`에서 `enforce`로 전환했다. Legacy 구현과 문서는 보존한다.

외부 플러그인 배포·설치·저장소 push는 수행하지 않았다. 이 Report는 완료 시점 기록으로 동결하며 이후 제품 변경은 새 Work item에서 진행한다.

## 전달 범위

| 영역 | 결과 |
|---|---|
| 대화 진입 | `/vais` 요청만 관리하고 공개 문법에서 Work item과 다음 결정을 자동 라우팅 |
| 상태·승인 | Plan→Design→Do→Review→Report 순서, 단일 진행 슬롯, lease, pending request와 세 승인 Gate를 runtime에서 강제 |
| 실행 | 규모별 specialist 선택, bounded assignment/handoff, 단계별 write scope와 drift 검사 |
| QA | readiness receipt와 read-only independent QA를 분리하고 실제 Chrome 시나리오·스크린샷을 결속 |
| 문서 | Work item/Feature/Master 인덱스, 다섯 Phase 정본, 승인 revision, transient draft 차단과 Report freeze |
| 호환·전환 | Legacy 경로를 보존하고 formal 비교 PASS 및 최종 승인 뒤 v2 정본 모드를 `enforce`로 전환 |

## 최종 QA와 효율

- Cohort: `cohort-310561b6ff782b64923a8f33`
- 조건: `claude-opus-5`, effort `low`, 동일 tool profile·fixture·semantic workload, `subscription-no-dollar-cap`, turn timeout 900,000ms
- 순서: Legacy 1 → v2 1 → Legacy 2 → v2 2 → Legacy 3 → v2 3
- 품질: 6/6 terminal completed, 6/6 공통 Chrome 5/5, 3/3 pair eligible, v2 independent QA 각 1회
- 판정: Quality PASS, EFF-01~08 전부 PASS, diagnostics 0

| 중앙값 | Legacy | v2 | 변화 |
|---|---:|---:|---:|
| 사용자 turn | 5 | 4 | 20.0% 감소 |
| 완료 시간 | 1,235,613ms | 619,988ms | 49.8% 감소 |
| delivery cache-creation | 282,350 | 110,259 | 60.9% 감소 |
| authored Markdown | 11 | 5 | 54.5% 감소 |
| authored bytes | 86,296 | 16,343 | 81.1% 감소 |
| Agent calls | 5 | 2 | 60.0% 감소 |

총 compute, assurance compute, cache-read, output token과 provider list cost는 구독 청구액이나 합격 기준이 아닌 OBSERVE로만 보존했다.

## 요구사항 추적

| 요구사항 | 완료 근거 | 판정 |
|---|---|---|
| REQ-001~006 | 5단계 상태 머신, Plan/Design/최종 승인 Gate, `/vais` managed entry | PASS |
| REQ-007~012 | Feature/Work item 관계, Master 인덱스, event 상태, 단일 active와 pending queue | PASS |
| REQ-013~019 | 규모 분류, Design 계약·triage·dispatch, 구조화 handoff와 write scope | PASS |
| REQ-020~024 | readiness, 독립 QA, bounded repair, Chrome 증거, 피드백 보존 | PASS |
| REQ-025~029 | Report freeze, revision 정책, 최소 Context View, Tool receipt와 drift 검사 | PASS |
| REQ-030 | Legacy 보존, 동일 조건 Shadow 비교 3×2 PASS, 최종 승인 후 `enforce` 전환 | PASS |

## 증거와 운영 경계

- 정식 결과: [Review Attempt 18](../04-review/revisions/v18.md)
- 기계 판독 요약: [attempt-18-pass.json](../04-review/evidence/attempt-18-pass.json)
- trusted evidence: `/tmp/vais-rev12-formal.r2vNaq/evidence/trusted/live-shadow-evidence.json`
- trusted evidence SHA-256: `bbe6bab268eeb5be65121727050affb3fe40c294cd4a842db8ca59be1a799b89`
- rollback: 정본 설정의 `workflowV2.mode`를 `shadow`로 되돌리면 v2 managed enforcement를 비활성화하고 보존된 Legacy 흐름을 사용할 수 있다.
- 배포 경계: 실제 배포·설치·release는 별도 명시 작업과 해당 환경 검증이 필요하다.

## 최종 결정

사용자 최종 승인과 Report 검증을 완료했다. Work item은 `report/completed`, Report는 `frozen: true`로 확정한다.
