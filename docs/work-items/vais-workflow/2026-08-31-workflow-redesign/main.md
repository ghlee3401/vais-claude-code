---
schema: vais-work-item/v1
id: WI-2026-08-31-workflow-redesign
title: VAIS workflow redesign
primary_feature: vais-workflow
affected_features:
  - agent-orchestration
  - documentation-system
  - quality-assurance
  - session-control
scale: extended
phase: report
status: completed
plan_revision: 1
design_revision: 5
readiness_not_ready_count: 0
qa_repair_count: 2
created_at: 2026-08-31
updated_at: 2026-09-11
approvals:
  plan: approved
  design: approved
  final: approved
report_frozen: true
---

# VAIS workflow redesign

> 현재 단계: **Report 완료 · Work item 동결**
> 다음 행동: 후속 변경이나 배포가 필요하면 새 Work item으로 시작한다.

## 목적

비개발자와 개발자가 같은 안전한 개발 흐름을 사용할 수 있도록 VAIS의 문서, 상태 머신, Agent 오케스트레이션과 QA 체계를 개편한다. 모든 작업에서 Plan과 Design, 구현, 독립 QA, 사용자 승인의 추적성을 유지하면서 불필요한 Agent 문서와 컨텍스트 소비를 줄이는 것이 핵심이다.

## 정본

| 단계 | 상태 | 문서 |
|---|---|---|
| Plan | 승인됨 · revision 1 | [01-plan/main.md](./01-plan/main.md) |
| Design | revision 5 · 승인됨; revision 1~4 이력 보존 | [02-design/main.md](./02-design/main.md) |
| Do | revision 12 · formal stage 읽기 전용 봉인과 전체 검증 PASS; revision 1~11 이력 보존 | [03-do/main.md](./03-do/main.md) |
| Review | Attempt 18 PASS · 3/3 pair 품질 PASS, EFF-01~08 전부 PASS, 사용자 최종 승인 완료 | [04-review/main.md](./04-review/main.md) |
| Report | revision 1 · 완료·동결 | [05-report/main.md](./05-report/main.md) |

## 관련 이력

- [기존 플러그인 아키텍처 리뷰 헌장](../../../260821_plugin-architecture-review/01-plan/main.md)
- 위 문서는 기존 형식의 선행 이력이며 수정하거나 새 형식으로 위장하지 않는다.

## 상태 기록

| 날짜 | 사건 | 결과 |
|---|---|---|
| 2026-08-30~31 | 사용자와 아키텍처·상태·문서·Agent·QA 규칙을 순차 논의 | Plan과 Design 내용 합의 |
| 2026-08-31 | 전체 설계를 사용자 경험·상태 무결성·Agent/QA 관점으로 최종 감사 | 중대한 모순 없음 |
| 2026-08-31 | 사용자가 설계 동결과 정본 작성을 승인 | Plan/Design revision 1 승인 |
| 2026-09-01 | v2 runtime, 문서·권한·역할 계약, Mini Booking fixture 구현 | Do 완료 |
| 2026-09-01 | 1차 readiness에서 dependency 취약점 3건 발견 후 안전 버전으로 보완 | 2차 readiness READY, Review 진입 |
| 2026-09-01 | Independent QA가 runtime 우회·Gate 연결·pending·drift·평가 증거 결함 7건 발견 | Review FAIL, Design checkpoint 복귀, QA repair 1 |
| 2026-09-01 | QA repair 1 구현, 실제 Claude Code Plan pilot, 전체 회귀·브라우저·보안·구조 재검증 | readiness READY, Review attempt 2 진입 |
| 2026-09-01 | Independent QA attempt 2의 추가 Gate·scope·권한·drift·문서 lifecycle 결함 보완 | QA repair 2, 전체 474 tests 중 FAIL 0 |
| 2026-09-01 | 최신 clean-room 재검증 | 구현 결함은 해소, 정식 3회 paired full-journey live A/B 부재로 Review BLOCKED |
| 2026-09-01~02 | 실제 `claude-opus-5` 진단에서 발견한 runtime·handoff·E2E 증거 결함 21건 보완 | QA repair 3, 전체 회귀와 canonical Chrome 증거 PASS |
| 2026-09-02 | Legacy/v2 동일 전체 여정 각 3회 완료 후 Shadow Gate 평가 | quality PASS, authored 문서 감소, instruction token·문서 byte 효율 FAIL |
| 2026-09-02 | 사용자가 효율 개선의 다음 진행을 승인 | Design v1 보존, Lean Phase Transactions revision 2 제시 |
| 2026-09-02 | 사용자가 Design revision 2를 승인 | QA repair counter reset, Do 진입 |
| 2026-09-02 | Lean Phase Transactions 구현과 전체 515-test 회귀·구조 검증 | Readiness READY, Review attempt 4 진입 |
| 2026-09-02 | 3관점 감사와 독립 QA 재공격에서 승인·assignment·evidence·transaction 우회 보완 | v2 132/132, 전체 533 PASS, 독립 QA PASS |
| 2026-09-02 | Design revision 2 실제 Opus 완료 진단 5회와 엄격한 v2.0 evidence 평가 | 최저 token도 Legacy 중앙값 초과, 신규 정식 cohort 부재; Review FAIL |
| 2026-09-02 | 사용자와 token·시간·문서·독립 QA 비용을 분해해 실제 효율 재점검 | 본체 token·시간·정본은 개선, 독립 QA 비용과 중복 check·draft 낭비를 분리 |
| 2026-09-02 | 사용자가 assurance-aware 효율 기준과 중복 제거 방향 승인 | Design revision 2 보존, revision 3 승인, Do 진입 |
| 2026-09-02 | Review evidence dedupe, draft lifecycle, 자동 진행, preflight, snapshot coalesce와 새 evaluator 구현 | 전체 547 tests 중 FAIL 0, lint·audit·validator PASS, Readiness READY |
| 2026-09-02 | trusted aggregator·self-contained stage·실행 결속 구현 후 독립 QA 공격 7종 보완 | 전체 564 tests 중 FAIL 0, 구현/실행 준비 PASS; Legacy adapter·prompt 동등성 미확정으로 Review BLOCKED |
| 2026-09-03 | 사용자가 의미 동일·공개 진입 문법만 변환하는 비교 원칙과 7개 공정성 규칙을 승인 | Design revision 3 보존, revision 4 승인, Legacy adapter Do 진입 |
| 2026-09-03 | Legacy adapter·고정 순서 paired runner·공통 workload를 구현하고 무과금 dry-run 검증 | paidCalls 0, 전체 6개 격리 seed와 실행 순서 PASS |
| 2026-09-03 | 첫 formal cohort에서 Legacy 1 완료 후 adapter가 native 상태를 오판 | v2 1 시작 직후 즉시 중단, cohort BLOCKED, EFF 미평가 |
| 2026-09-03 | 양쪽 runner에 공통 외부 Chrome observer를 결속하고 전체 회귀 | 569개 중 566 PASS·환경성 3 SKIP·FAIL 0, 새 cohort 재실행 승인 대기 |
| 2026-09-03 | 사용자 승인으로 새 Opus 3×2 cohort를 새 stage·cohort ID에서 시작 | Legacy 1 turn 1~4 완료, turn 5에서 $4 journey budget 소진 |
| 2026-09-03 | 실패 표본 대체·추가 예산 없이 즉시 종료 | cohort BLOCKED, 나머지 5개 run 미실행, EFF-01~08 NOT_EVALUATED |
| 2026-09-03 | 사용자가 구독형 비교에서 dollar cap 제거와 비용의 참고 관측치 전환을 승인 | Design revision 4 보존, revision 5 승인 |
| 2026-09-03 | no-dollar-cap·동일 15분 turn timeout·schema 2.2 구현과 회귀 | 전체 569개 중 FAIL 0, lint·validator·audit PASS, Review Attempt 8 진입 |
| 2026-09-03 | subscription-native cohort에서 Legacy 1 유효 PASS 후 v2 1 진입 | v2 project에 enforce 설정이 없어 Work item 미생성, 즉시 BLOCKED |
| 2026-09-03 | 양쪽 byte-identical project seed에 동일 v2 entry config 추가 | focused 12/12·lint·diff PASS, 새 cohort 승인 대기 |
| 2026-09-03 | 사용자가 보완 seed·고유 cohort ID의 새 no-dollar-cap 3×2를 승인 | Review Attempt 9 진입 |
| 2026-09-03 | Legacy 1 완료 후 observer가 `cancel-booking` ID와 추가 시나리오를 거부 | v2 1 시작 직후 중단, raw 대조 후 제품 FAIL이 아닌 evidence BLOCKED로 정정 |
| 2026-09-03 | observer를 취소 의미 기반 canonical 역할로 보완하고 기존 Legacy 1을 진단 재검사 | Chrome 5/5 PASS, focused 13/13·lint·diff PASS, 새 cohort 승인 대기 |
| 2026-09-03 | 사용자가 semantic observer 기반 새 no-dollar-cap 3×2를 승인 | Review Attempt 10 진입 |
| 2026-09-03 | Attempt 10에서 Legacy 1 공통 observer PASS 후 v2 1 최초 Plan preflight 재시도 | 생성 Work item과 start-request authorization 불일치로 `AUTHORIZATION_STALE`, cohort BLOCKED, EFF 미평가 |
| 2026-09-05 | 사용자가 initial Plan transaction 원자성 보완과 새 cohort를 승인 | Do revision 6 진입 |
| 2026-09-05 | 최초 Plan을 preflight 전 비영속 상태로 전환하고 same-session 재시도 회귀 추가 | focused 86/86, 전체 567 PASS·3 SKIP·0 FAIL, lint·validator·audit PASS |
| 2026-09-05 | 새 stage에서 no-cap formal dry-run | paidCalls 0, 6개 고정 순서·동일 seed·900,000 ms timeout READY, Review Attempt 11 진입 |
| 2026-09-05 | Attempt 11에서 Legacy 1 품질 PASS와 v2 1 initial Plan PASS 후 Plan 승인 turn 실행 | adapter 문장이 router에서 `revise-plan`으로 분류되어 cohort BLOCKED, EFF 미평가 |
| 2026-09-05 | v2 adapter v2로 Plan·Design·최종 승인 문법을 실제 router와 결속 | focused 87/87, 전체 568 PASS·3 SKIP·0 FAIL, lint·validator·audit·무과금 dry-run PASS |
| 2026-09-05 | 사용자가 public-approval adapter v2 기반 새 Opus 3×2를 승인 | Review Attempt 12 진입 |
| 2026-09-05 | Attempt 12에서 Legacy 1 품질 PASS 후 v2 1 자동 Do→Review 실행 | independent-QA PASS handoff가 비공개 compact 3KB 한도를 초과해 미저장, `review/active`에서 cohort BLOCKED |
| 2026-09-05 | QA assignment에 규모별 hard/target byte 계약과 raw JSON-only 지침 결속 | focused 87/87, 전체 569 PASS·3 SKIP·0 FAIL, lint·validator·audit PASS |
| 2026-09-05 | 새 rev8 stage에서 no-cap formal dry-run | paidCalls 0, 동일 seed·6개 고정 순서·900,000 ms timeout READY, Review Attempt 13 승인 대기 |
| 2026-09-05 | 사용자가 explicit QA byte-contract 기반 새 Opus 3×2를 승인 | Review Attempt 13 실제 cohort 시작 |
| 2026-09-06 | Attempt 13에서 Legacy 1 품질 PASS 후 v2 1 independent-QA 자동 저장 | QA payload 3,086B가 3,072B hard limit을 14B 초과해 cohort BLOCKED, EFF 미평가 |
| 2026-09-06 | QA 발급 schema에 규모별 `maxLength`·`maxItems`를 결속하고 runtime에서 해당 schema까지 검증 | focused 87/87, 전체 569 PASS·3 SKIP·0 FAIL, lint·validator·audit PASS |
| 2026-09-06 | 새 rev9 immutable stage와 no-cap formal dry-run | 최대 구조 2,766B 증명, paidCalls 0, 고정 순서·동일 seed·900,000 ms timeout READY, Review Attempt 14 승인 대기 |
| 2026-09-06 | 사용자가 deterministic QA shape-contract 기반 새 Opus 3×2를 승인 | Review Attempt 14 실제 cohort 시작 |
| 2026-09-06 | Attempt 14에서 Legacy 1과 v2 1 제품·QA 품질 PASS 후 formal telemetry 수집 | 같은 v2 turn의 frontend와 QA 사용량 분리 불가 가정으로 evidence BLOCKED, 후속 slot·EFF 미실행 |
| 2026-09-06 | Agent별 transcript usage를 assignment·role·model·digest와 결속하고 provider 합계를 재조정 | 실제 실패 transcript에서 cache-creation/read 정확 일치, 변조 1 token 차단 |
| 2026-09-06 | focused·전체 회귀·lint·validator·audit와 새 rev10 no-cap dry-run | 36/36, 전체 570 PASS·3 SKIP·0 FAIL, paidCalls 0, Review Attempt 15 승인 대기 |
| 2026-09-06 | 사용자가 Agent-attributed telemetry 기반 새 no-dollar-cap Opus 3×2를 승인 | Review Attempt 15 실제 cohort 시작 |
| 2026-09-06 | Attempt 15에서 Legacy 1 quality PASS 후 v2 1 independent-QA가 PASS JSON 반환 | risk 문구 23자가 개별 20자 cap을 초과해 handoff 미저장, `review/active`에서 cohort BLOCKED |
| 2026-09-06 | compact QA risk/unverified cap을 28자로 재산정하고 실제 실패 payload·전체 회귀·새 stage 검증 | 최대 구조 2,894B, 570 PASS·3 SKIP·0 FAIL, paidCalls 0 dry-run READY, Review Attempt 16 승인 대기 |
| 2026-09-06 | 사용자가 QA shape-headroom 기반 새 no-dollar-cap Opus 3×2를 승인 | Review Attempt 16 실제 cohort 시작 |
| 2026-09-06 | Attempt 16에서 Legacy 1·v2 1·Legacy 2·v2 2 품질·증거 PASS 후 Legacy 3 Plan 실행 | provider 구독 세션 한도 429 발생, fail-fast로 v2 3 미실행 |
| 2026-09-06 | 실패 표본 대체 없이 코호트 종료 | Review BLOCKED, EFF-01~08 NOT_EVALUATED; 코드 보완 없이 한도 재설정·새 사용자 승인 대기 |
| 2026-09-10 | Revision 11 Legacy/v2 stage를 새 경로에 재빌드하고 이전 승인 digest와 대조 | byte-level 동일, 양쪽 validator error 0 |
| 2026-09-10 | 새 6-slot 무과금 dry-run과 사용자 재승인 | paidCalls 0, 동일 seed·순서·모델·도구·900,000 ms timeout READY, Review Attempt 17 시작 |
| 2026-09-10 | Attempt 17 Legacy 1의 다섯 turn 완료 후 stage 종료 무결성 검사 | Legacy QA의 상대 경로 event log가 stage에 생성되어 sequence 1에서 BLOCKED, 후속 5개 slot·EFF 미실행 |
| 2026-09-10 | formal runner에 양쪽 stage 읽기 전용 봉인과 exact-mode 복원 구현 | focused 9/9, 전체 572 PASS·3 SKIP·0 FAIL, lint·validator·audit·OS write probe PASS |
| 2026-09-10 | Revision 12 stage 재빌드와 무과금 dry-run | 기존 승인 digest·동일 seed·고정 순서 유지, paidCalls 0, Attempt 18 사용자 승인 대기 |
| 2026-09-10 | 사용자가 sealed-stage 새 Opus 3×2를 명시 승인 | 이전 표본을 재사용하지 않는 Review Attempt 18 시작 |
| 2026-09-10 | Attempt 18 Legacy/v2 Opus 3×2 고정 순서 완료 | 여섯 run terminal·Chrome·telemetry PASS, 3/3 pair eligible |
| 2026-09-10 | trusted aggregator와 독립 재계산 | Quality PASS, EFF-01~08 전부 PASS; Report 전 사용자 최종 승인 대기 |
| 2026-09-11 | 사용자가 Attempt 18 AI QA 결과를 최종 승인 | Report Gate 통과, v2 정본 기본값 `enforce` 전환 |
| 2026-09-11 | Report·Feature/Master 인덱스 생성과 완료 검증 | Work item `report/completed`, Report 동결; 외부 배포는 미수행 |

## 변경 통제

- Plan의 목표·범위·요구사항이 바뀌면 `01-plan/revisions/v1.md`를 보존하고 revision 2를 만든다.
- 구현 방식이나 평가 계약이 실질적으로 바뀌면 현재 Design을 `02-design/revisions/`에 보존하고 새 revision을 만든다.
- 승인된 범위 안의 기술적 보완은 Design checkpoint로 처리할 수 있지만, UX·공개 API·데이터 정책·보안·비용·범위가 달라지면 사용자 재승인이 필요하다.
- Report는 사용자 최종 승인 후 작성하며, Work item 완료 시 불변 상태로 고정한다.
