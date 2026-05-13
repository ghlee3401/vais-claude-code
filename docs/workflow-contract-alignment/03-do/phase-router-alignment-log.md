---
owner: cto
artifact: phase-router-alignment-log
phase: do
feature: workflow-contract-alignment
generated: 2026-05-12
source: "docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md"
summary: "SKILL.md 와 phase router 를 role별 activation contract 에 맞춰 정리. CTO-only mandatory, CPO/CSO activated artifact, CBO/COO explicit secondary 로 분리."
---

# Phase Router Alignment Log

## 1. 변경 범위

| Area | Files |
|------|-------|
| Top-level entry | `skills/vais/SKILL.md` |
| Primary routers | `skills/vais/phases/ceo.md`, `cto.md`, `cpo.md`, `cso.md` |
| Secondary routers | `skills/vais/phases/cbo.md`, `coo.md` |
| Ideation router | `skills/vais/phases/ideation.md` |

## 2. 주요 수정

| Router | Before | After |
|--------|--------|-------|
| `SKILL.md` | phase 생략 시 status 기반 다음 phase 판별이라는 공통 설명 | role별 phase 계약 명시. CTO only mandatory, CEO routing, CPO/CSO activated artifact, CBO/COO explicit secondary |
| `ceo.md` | phase 생략 시 plan부터 status 기반 mandatory 진행 | phase 생략 시 ideation/routing entry. `analyzeCEO()` 4단계가 기준 |
| `cto.md` | mandatory phase 문구가 plan/design/do/qa 중심 | plan/design/do/qa/report 순차 mandatory 명시 |
| `cpo.md` | phase 생략 시 CTO식 mandatory 순서 강제 | CEO artifactPlan 에서 owner=cpo 미완료 artifact 탐색 |
| `cso.md` | phase 생략 시 CTO식 mandatory 순서 강제 | CEO artifactPlan 에서 owner=cso 미완료 artifact 탐색 |
| `cbo.md` | ideation/design/report 포함, status 기반 phase 판별 | explicit secondary `plan|do|qa` 만 허용. mandatory skip 없음 |
| `coo.md` | design/report 포함, CEO recommendation flow 유지 | explicit secondary `plan|do|qa` 만 허용. secondary 완료 후 처리로 변경 |
| `ideation.md` | `00-ideation/main.md` 에 요약 본문 저장 | `main.md` index + `ideation-decision.md` artifact 분리 |

## 3. Drift 제거

| Scan | Result |
|------|--------|
| `mandatory phase 스킵 금지` | CTO router 에만 남음 |
| `launchPipeline.dependencies` | phase routers 에서 제거 |
| `*_{feature}` docs glob | phase routers 에서 제거 |
| Secondary `design/report` phase table | CBO/COO 에서 제거 |

## 4. 후속 대상

라우터는 정리됐지만, 개별 agent prompt 에는 아직 오래된 산출물 지시가 남아 있다. 4단계에서 다음 항목을 정리한다.

- PRD writer 의 `03-do/main.md` 저장 지시
- C-Level/sub-agent 본문 속 `_tmp`, `release-engineer`, retired path 참조
- template 과 agent prompt 의 artifact path 불일치

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | phase router alignment 구현 로그 작성 |
