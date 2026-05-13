---
owner: cto
artifact: main
phase: plan
feature: workflow-contract-alignment
---

# workflow-contract-alignment — Plan 인덱스

## 요청 원문

> "수정할 플랜을 먼저 짜자"
> "1단계 먼저 하자"

## In-scope

- VAIS Code workflow contract alignment 의 단계별 수정 계획 수립
- phase, owner, artifact, path, validator 기준선 확정
- legacy drift 항목을 후속 단계 대상으로 분류

## Out-of-scope

- 1단계에서 active prompt, template, runtime code 를 직접 수정하지 않음
- 실제 수정은 2단계 이후 사용자 승인에 따라 진행

## Executive Summary

VAIS Code 의 phase, C-Level, sub-agent, artifact, path, validator 계약을 v2.0/v2.1 기준으로 정렬하기 위한 계획 인덱스. 이번 단계는 active prompt 수정이 아니라 **후속 수정의 판정 기준이 될 workflow contract matrix 확정**이다.

핵심 결정은 다음과 같다.

- CTO 만 plan → design → do → qa → report 순차 흐름을 mandatory 로 가진다.
- CEO 는 ideation 진입과 `lib/ceo-algorithm.js` 기반 routing 판단을 담당한다.
- CPO/CSO 는 CEO 알고리즘이 활성화한 phase/artifact 만 실행한다.
- CBO/COO 는 secondary 이며 사용자 명시 호출 시에만 실행한다.
- `main.md` 는 C-Level index 이고, 본문 artifact 는 sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 직접 작성한다.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-12 | 1단계 산출물은 active prompt 수정이 아니라 workflow contract matrix 작성으로 한정한다 | CTO | 사용자 요청 "1단계 먼저 하자" |
| 2026-05-12 | `vais.config.json` 의 `cSuite.roles`, `workflow.phaseArtifactMapping`, `frontmatterMinimal`, `docPaths` 를 기계 기준선으로 삼되, 레거시 drift 는 matrix 에 별도 표시한다 | CTO | `vais.config.json` |
| 2026-05-12 | v2.0/v2.1 정책 기준은 CTO-only mandatory PDCA, CEO algorithm routing, sub-agent direct artifact, `main.md` index-only 로 둔다 | CTO | `CLAUDE.md`, `AGENTS.md`, `_shared/*guard.md` |
| 2026-05-12 | `report` 는 CTO PDCA 의 종료 phase 로 취급한다. 현재 `mandatoryPhases` 배열 누락은 후속 정렬 대상이다 | CTO | `AGENTS.md` v2.0 정책 vs `vais.config.json` drift |
| 2026-05-12 | `_tmp`, `03-do/main.md` 본문 박제, `release-engineer`, 8-field frontmatter, CPO/CSO mandatory 문구는 legacy cleanup 대상으로 분류한다 | CTO | content-flow audit |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `01-plan/main.md` | 인덱스 | 본 문서 |
| `01-plan/workflow-contract-matrix.md` | 계약 매트릭스 | phase/owner/agent/artifact/path/validator 기준표 및 후속 수정 범위 |

## CEO 판단 근거

이번 문서는 CEO 자동 라우팅 실행 결과가 아니라, 사용자가 명시적으로 요청한 "수정 플랜 1단계"에 대한 CTO planning 산출물이다. 근거 컨텍스트는 `docs/multimodel-repo-analysis/00-ideation/` 의 cross-model 분석과 현재 content-flow audit 대화다.

CEO 알고리즘 자체의 activeCLevel 계산은 수행하지 않았다. 이 작업은 이미 승인된 정렬/문서화 작업이며, 제품 코드 변경 전 계약 확정에 해당한다.

## Next Phase

다음 단계는 2단계 shared guard 정리다.

- `agents/_shared/subdoc-guard.md`: 고정 예시값 제거, artifact/path/handoff 정정
- `agents/_shared/clevel-main-guard.md`: index-only 역할과 artifact 계약 재확인
- `agents/_shared/work-rules.md`: workflow contract 참조 추가
- `agents/_shared/checkpoint-policy.md`: CTO-only mandatory 와 CEO/CPO/CSO/secondary 정책 충돌 여부 점검

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | 초기 작성 — workflow contract alignment 1단계 plan index 생성 |
