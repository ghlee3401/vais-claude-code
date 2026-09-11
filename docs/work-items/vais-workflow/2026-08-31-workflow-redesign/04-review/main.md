---
schema: vais-phase/v1
work_item: WI-2026-08-31-workflow-redesign
phase: review
revision: 5
status: approved
based_on:
  - ../01-plan/main.md
  - ../02-design/main.md
  - ../03-do/main.md
verdict: PASS
reviewed_at: 2026-09-10
qa_attempt: 18
approved_by: user
approved_at: 2026-09-11
---

# Review Attempt 18 — formal 3×2 PASS · final approval complete

## 현재 상태

cohort `cohort-310561b6ff782b64923a8f33`의 Legacy/v2 Opus 3×2가 고정 순서로 완전하게 종료됐다. 여섯 run 모두 terminal completed·공통 Chrome 5/5·telemetry eligible이며 v2 세 run은 independent-QA 1회와 Report frozen을 충족했다. trusted aggregator와 독립 재계산 모두 Quality PASS, EFF-01~08 전 항목 PASS다. 상세 결과는 `revisions/v18.md`, 기계 판독 요약은 `evidence/attempt-18-pass.json`에 보존했다.

## 실행 계약

- Attempt 18 stage root: `/tmp/vais-rev12-formal.r2vNaq`
- Legacy baseline commit: `dcb111e66fd130a1ca7343ad76c985b28efc9b76`
- Legacy stage root digest: `a20a4f48f14f68ff20cdf4ffcf3d83b706c4af16ac2cee210215f052940f177f`
- v2 stage root digest: `6a4adaa5de20b822e173b89fcd97779cd06f5d5601866923c3b8a9c4e046c871`
- 실행 전 stage integrity: 승인 digest와 byte-level 동일; Legacy 546 files, v2 415 files
- dry-run cohort: `cohort-374fbf287adef83263b2c2e1`
- actual cohort: `cohort-310561b6ff782b64923a8f33`
- dry-run: `READY`, `paidCalls: 0`
- dry-run manifest digest: `2d0b16c4faf5856350c812b5e8d5c08b5779de43ea2c4fcdc4fa8dbc5ec55ce7`
- isolated project seed digest: `3c9bdb72cc16c45d280666419d571dbe55a019992160d577114f6bc29a4b20d5`
- v2 adapter: `v2-public-grammar/v2`
- QA output contract: compact hard limit 3,072B, target 2,048B, raw JSON-only + risk/unverified 2×28자를 포함한 구조별 `maxLength`·`maxItems`
- staged worst-case proof: 4-byte Unicode 최대 구조 2,894B, assignment `outputContract` 검증 PASS
- telemetry contract: Agent별 transcript request 최종 block 집계, assignment ID·role·model·digest 결속, provider cache 합계 불일치 시 fail closed
- Attempt 15 telemetry proof: frontend 30,611 + QA 21,192 = provider remainder 51,803 cache-creation; cache-read/output도 정확 일치
- 순서: `Legacy 1 → v2 1 → Legacy 2 → v2 2 → Legacy 3 → v2 3`
- 정책: `subscription-no-dollar-cap`, turn timeout 900,000 ms
- 동일 canonical workload·model·effort·tool profile·project seed 사용

## Gate

Review 판정은 **PASS**다. 중앙값 기준 v2는 Legacy 대비 user turn 20.0%, elapsed 49.8%, delivery compute 60.9%, authored Markdown 수 54.5%, authored bytes 81.1% 감소했다. 중복 Agent·check·contract retry·동일 오류 반복·transient draft·별도 Review 진행 turn은 모두 0이다. assurance token과 provider list cost는 OBSERVE로만 공개했으며 판정에 사용하지 않았다.

사용자는 2026-09-11 AI QA 결과를 최종 승인했다. 이 승인으로 Report Gate와 Plan REQ-030의 기본 엔진 전환 조건이 충족됐다. 정본 설정의 `workflowV2.mode`는 `enforce`로 전환하고 전체 회귀를 다시 검증한다. 외부 배포·설치·push는 이 승인에 포함하지 않는다.
