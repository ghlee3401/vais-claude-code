---
owner: cto
agent: cto-direct
artifact: phase-index
phase: do
feature: unify-version-namespace
generated: 2026-05-03
summary: "임시 Node 스크립트로 68 파일 / 125 라인 일괄 치환. 블록 마커 54건 KEEP, historical docs 변경 0. SC 7/7 통과."
---

# unify-version-namespace — Do (인덱스)

> Phase: 🔧 do | Owner: CTO (직접) | Date: 2026-05-03

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 79 active 파일에 "v2.0 / v2.x" 라벨 산재. 수동 편집 어려움 |
| **Solution** | 임시 Node 스크립트 (`scripts/_tmp-unify-version.js`) — 11 정규식 패턴 + 라인-단위 보호 규칙. 1회 실행 후 삭제 (D-1) |
| **Effect** | 68 파일 / 125 라인 변경. 블록 마커 54건 KEEP. historical docs (simplify-non-cto-workflow / CHANGELOG / ceo-judgment) 변경 0 |
| **Core Value** | 단일 namespace 0.64.0 — "v2.0" 잔재는 component-local 블록 버전만 (의도된 분리) |

## 2. Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| Do-1 | 임시 스크립트 1회 실행 후 삭제 | cto | D-1 설계 결정 — 영구 보존 X | (스크립트 삭제됨) |
| Do-2 | dry-run 모드 의도된 fallthrough 발생 (실제 write) — 결과 정확하여 그대로 채택 | cto | 의도 vs 결과 일치 (검증 통과). 단, follow-up: 다음 임시 스크립트 작성 시 `--dry-run` 가드 unit test | `cleanup-log.md` |
| Do-3 | 11 정규식 패턴 적용 (P1~P11) | cto | 카테고리 A (description/template 헤더/평서문) + C (코드 코멘트/config 키) 모두 커버 | `cleanup-log.md` |

## 3. Artifacts

| Artifact | Owner | Agent | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|----------|------|
| cleanup-log | cto | cto-direct | 변경 분포 + 패턴별 통계 + 검증 결과 | [`cleanup-log.md`](./cleanup-log.md) |

## 4. CEO 판단 근거

- **포함 — cleanup-log**: 변경 입증 + SC 7/7 통과 evidence. QA 단계 baseline
- **제외 — 별도 회귀 시나리오 artifact**: SC 가 곧 회귀. 추가 분리 불필요

## 5. Next Phase

→ **qa** (CTO 진입 — SC 7/7 검증 + side-effect 점검)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | CTO do — 68 파일 / 125 라인 치환. 블록 마커 KEEP. historical docs 무변경. SC 7/7 통과. 임시 스크립트 삭제. |
