# clevel-doc-coexistence — 설계서

> Feature: `clevel-doc-coexistence` | v0.57.0 → v0.58.0
> 선행: `../01-plan/main.md` v1.1 (MVP 14건, Scope B)
> Gate 2 산출물: `./interface-contract.md`

> <!-- size budget: main.md ≤ 200 lines 권장. 초과 시 topic 분리 (F14 자가 적용) -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | Plan 에서 H2 멀티-오너 규약 + `topicPresets.{phase}.{c-level}` 확정됐으나 7 D-Q 세부 결정 미정 | cto |
| **Solution** | D-Q1~D-Q7 전부 확정 + 4 Contract(Configuration/Document/Function/Validation) 명세 + F14 `W-MAIN-SIZE`/`getMainDocSize` 편입 | cto |
| **Effect** | Do Batch A/B/C/D 가 4 Contract 에 맞춰 독립 구현 가능 | cto |
| **Core Value** | 메타 피처 설계 일관성 (v0.57 Interface Contract 패턴 재사용 + F14 편입) | cto |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | D-Q 미결 상태로 Do 진입 시 agent md 블록 · validator 경고 · status API · F14 정책이 서로 다른 스키마 가정 → 통합 실패 위험 |
| WHO | Do phase 실행자(직접 CTO), QA 검증자, Rule #15 이해관계자 |
| RISK | append-only vs diff-merge 오판 / 헤딩 마커 충돌 / F14 threshold 부적절 |
| SUCCESS | 4 Contract 고정 + D-Q 7건 결정 + CP-D 승인 + 본 피처 자가 적용 |
| SCOPE | 본 Design 은 **스펙 + 결정**만. 코드는 Do |

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|-------|-----------|--------------|
| 1 | D-Q1 `mainMergeRule` = **append-only** | cto | 단순. 이전 섹션 100% 보존. validator 검사 용이. diff-merge 는 v0.59+ | `architecture.md` §1 |
| 2 | D-Q2 `W-MRG-01` git 이력 기반 = **v0.58.1 이연** | cto | MVP 는 W-MRG-02/03 텍스트 검사로 충분 | `architecture.md` §2.3 |
| 3 | D-Q3 `authors: []` = **수동 + `listScratchpadAuthors` 헬퍼** | cto | 큐레이션 = 의식적 편집 철학 | `data-model.md` §2 |
| 4 | D-Q4 가드 블록 순서 = **advisor → subdoc → clevel-main** | cto | 역할 계층 순 (cross-cutting → sub-agent → C-Level) | `architecture.md` §2.2 |
| 5 | D-Q5 재진입 = **자기 섹션 교체 + `## 변경 이력` entry** | cto | append-only 예외 — 재실행 자연스럽게 허용. 이전 근거는 git history | `data-model.md` §3 §9 |
| 6 | D-Q6 CEO 자동 전파 = **v0.58 인터페이스만** (`getFeatureTopics`) | cto | 구현은 v0.58.1 | `data-model.md` §4 |
| 7 | 아키텍처 옵션 C (실용적 균형) | cto | v0.57 선례와 일관. MVP Scope B 와 정합 | `architecture.md` §1 / CP-D |
| 8 | **(F14) D-Q7 `mainMdMaxLines` = 200** | cto | 사용자 지적 편입. v0.58 warn / v0.59+ refuse | `data-model.md` §1.2 / `qa-plan.md` §2 |

## [CTO] 설계 요약

본 Design 은 CTO 직접 작성 (메타 피처, UI 없음, infra-architect 불필요).

- **아키텍처 (3옵션 비교 + 채택 C)**: 상세 → `architecture.md` §1
- **컴포넌트 설계** (`clevel-main-guard.md` 80~120라인 / `patch-clevel-guard.js` idempotent / `doc-validator.js` `validateCoexistence()` / `lib/status.js` 6 신규 함수 / 5 templates size budget 주석): → `architecture.md` §2
- **데이터/스키마** (config `topicPresets` v2 + `cLevelCoexistencePolicy` 8 필드 + topic frontmatter + main.md 9 섹션 + status.json `topics[]` + W-* 경고 11종 레퍼런스): → `data-model.md`
- **QA/테스트** (T1~T10 신규 케이스 + 회귀 가드 + 2 smoke 시나리오 + 본 피처 자가 검증): → `qa-plan.md`

## Topic Documents

| Topic | 파일 | Owner | 요약 |
|-------|------|:-----:|------|
| architecture | `./architecture.md` | cto | 3옵션 비교(채택 C) + 컴포넌트 설계 + 데이터 흐름 + F14 size budget 흐름 |
| data-model | `./data-model.md` | cto | `vais.config.json` 확장 + topic frontmatter + main.md 섹션 + status.json 스키마 + 경고 코드 레퍼런스 |
| qa-plan | `./qa-plan.md` | cto | 테스트 전략 + T1~T10 + 2 smoke + 자가 검증 + Acceptance Criteria |

## System Artifacts

| 파일 | 타입 | 목적 |
|------|------|------|
| `./interface-contract.md` | Gate 2 | Configuration · Document · Function · Validation 4 Contract |

## Scratchpads

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:---:|-----|
| (해당 없음 — CTO 직접 작성 phase) | — | — | — |

## Gate 2 체크리스트

| # | 항목 | 상태 |
|---|------|:---:|
| 1 | Configuration Contract 정의 | ✅ `interface-contract.md` §1 |
| 2 | Document Contract (main.md 섹션 + topic frontmatter) | ✅ §2 + `data-model.md` §2 §3 |
| 3 | Function Contract (`lib/status.js` 신규 API) | ✅ `interface-contract.md` §3 + `data-model.md` §4 |
| 4 | Validation Contract (W-* 코드) | ✅ `interface-contract.md` §4 + `data-model.md` §5 |
| 5 | Interface Contract 파일 존재 | ✅ `./interface-contract.md` v1.1 |
| 6 | 아키텍처 3옵션 제시 + 채택 | ✅ `architecture.md` §1 (채택 C) |
| 7 | D-Q1~D-Q7 모두 결정 | ✅ Decision Record §1~§8 |
| 8 | v0.57 호환 보증 | ✅ `interface-contract.md` §6 |

**Gate 2 통과**: ✅ (CP-D 사용자 승인 완료).

## Next

- `/vais cto do clevel-doc-coexistence` Batch A/B/C/D 순차 구현.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — D-Q1~D-Q6 결정, 4 Contract, 아키텍처 3옵션 (채택 C) |
| v1.1 | 2026-04-20 | **topic 분리 리팩토링** — main.md 382→~150 라인 축약, 3 topic(`architecture`/`data-model`/`qa-plan`) 로 본문 이관. F14 편입 (D-Q7 추가, 관련 topic 문서 §업데이트) |
