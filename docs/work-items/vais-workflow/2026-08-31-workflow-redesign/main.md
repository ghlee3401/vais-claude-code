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
phase: do
status: active
plan_revision: 1
design_revision: 1
readiness_not_ready_count: 0
qa_repair_count: 0
created_at: 2026-08-31
updated_at: 2026-08-31
approvals:
  plan: approved
  design: approved
  final: pending
report_frozen: false
---

# VAIS workflow redesign

> 현재 단계: **Do 진입, 구현 미착수**
> 다음 행동: 승인된 Design에 따라 구현을 시작한다. 이 문서 작성 요청에는 제품 코드 변경이 포함되지 않는다.

## 목적

비개발자와 개발자가 같은 안전한 개발 흐름을 사용할 수 있도록 VAIS의 문서, 상태 머신, Agent 오케스트레이션과 QA 체계를 개편한다. 모든 작업에서 Plan과 Design, 구현, 독립 QA, 사용자 승인의 추적성을 유지하면서 불필요한 Agent 문서와 컨텍스트 소비를 줄이는 것이 핵심이다.

## 정본

| 단계 | 상태 | 문서 |
|---|---|---|
| Plan | 승인됨 · revision 1 | [01-plan/main.md](./01-plan/main.md) |
| Design | 승인됨 · revision 1 | [02-design/main.md](./02-design/main.md) |
| Do | 미착수 | 구현 시작 시 생성 |
| Review | 미착수 | AI QA 시작 시 생성 |
| Report | 미착수 | 사용자 최종 승인 후 생성 |

## 관련 이력

- [기존 플러그인 아키텍처 리뷰 헌장](../../../260821_plugin-architecture-review/01-plan/main.md)
- 위 문서는 기존 형식의 선행 이력이며 수정하거나 새 형식으로 위장하지 않는다.

## 상태 기록

| 날짜 | 사건 | 결과 |
|---|---|---|
| 2026-08-30~31 | 사용자와 아키텍처·상태·문서·Agent·QA 규칙을 순차 논의 | Plan과 Design 내용 합의 |
| 2026-08-31 | 전체 설계를 사용자 경험·상태 무결성·Agent/QA 관점으로 최종 감사 | 중대한 모순 없음 |
| 2026-08-31 | 사용자가 설계 동결과 정본 작성을 승인 | Plan/Design revision 1 승인 |

## 변경 통제

- Plan의 목표·범위·요구사항이 바뀌면 `01-plan/revisions/v1.md`를 보존하고 revision 2를 만든다.
- 구현 방식만 실질적으로 바뀌면 `02-design/revisions/v1.md`를 보존하고 Design revision 2를 만든다.
- 승인된 범위 안의 기술적 보완은 Design checkpoint로 처리할 수 있지만, UX·공개 API·데이터 정책·보안·비용·범위가 달라지면 사용자 재승인이 필요하다.
- Report는 사용자 최종 승인 후 작성하며, Work item 완료 시 불변 상태로 고정한다.
