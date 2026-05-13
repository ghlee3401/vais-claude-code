---
owner: cto
artifact: main
phase: design
feature: workflow-contract-alignment
---

# workflow-contract-alignment — Design 인덱스

## Executive Summary

이 피처의 설계 결정은 별도 UI/API 설계가 아니라 workflow contract 의 문서 구조 설계다. 정본 구조는 phase별 `main.md` 5섹션 index 와 artifact body 파일 분리다.

핵심 설계:

- phase index 는 `Executive Summary`, `Decision Record`, `Artifacts`, `CEO 판단 근거`, `Next Phase` 만 가진다.
- 상세 본문은 `docs/{feature}/{NN-phase}/{artifact}.md` 로 분리한다.
- validator 는 current 5섹션 index 와 legacy owner-H2 모델을 구분해서 current index 를 경고하지 않는다.
- runtime compatibility 코드는 유지하되 신규 생성 지침에는 legacy `_tmp`/scratchpad 모델을 노출하지 않는다.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-13 | 이 피처의 design phase 는 별도 설계 본문 없이 5섹션 index contract 를 문서화한다 | CTO | workflow contract alignment |
| 2026-05-13 | validator alignment 는 7단계에서 current index 인식을 추가하는 방식으로 처리한다 | CTO | final validation |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `02-design/main.md` | 인덱스 | 본 문서 |

## CEO 판단 근거

이 design index 는 CEO 자동 라우팅 결과가 아니라, CTO workflow-contract-alignment 의 mandatory phase 문서 완결성을 맞추기 위한 산출물이다.

## Next Phase

Do phase 는 이미 shared guard, phase router, agent prompt, template, knowledge alignment artifact 로 진행되었다.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | design phase index 생성 |
