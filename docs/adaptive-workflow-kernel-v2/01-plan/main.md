---
owner: cto
artifact: main
phase: plan
feature: adaptive-workflow-kernel-v2
summary: "Adaptive Workflow Kernel v2 간소화 plan의 결정과 산출물 인덱스"
---

# Adaptive Workflow Kernel v2 — Plan Index

## Executive Summary

기존 `adaptive-workflow-kernel`은 삭제·재작성하지 않고 실험 evidence로 보존한다. v2는 Claude Code의 `patch` profile 하나를 legacy fallback 뒤에서 끝까지 연결하는 vertical slice로 다시 시작한다.

| 항목 | 결정 |
|---|---|
| 첫 host | Claude Code |
| 첫 profile | `patch` |
| 실행 mode | `legacy / shadow / patch-enforce` |
| 기본 정책 | legacy 유지, adaptive는 명시적 opt-in |
| privacy | raw·절단 raw·raw-derived digest 저장 금지, random request ID만 허용 |
| 검증 | 자동 테스트 우선, 실제 dogfood 5건은 enforce 직전 수행 |
| 제외 | mandatory Claude 검토, 구현 전 20건 수집, Codex, feature/initiative enforce |
| 현재 상태 | M0 Reset Plan 완료, 코드 구현 미착수 |

## Decision Record

| # | Decision | Owner | Rationale | Source artifact |
|---|---|---|---|---|
| 1 | 기존 kernel 문서와 코드는 실험 기록으로 보존하고 v2 요구사항의 정본으로 자동 승계하지 않는다 | cto | 학습은 유지하면서 과거 범위와 gate 복잡성을 끊는다 | `development-plan.md` |
| 2 | Claude Code의 patch-only vertical slice를 첫 delivery로 한다 | cto | 가장 작은 실행 단위에서 core 통합과 rollback을 증명한다 | `development-plan.md` |
| 3 | 외부 Claude 검토와 실제 요청 20건을 mandatory gate에서 제거한다 | cto | 외부·시간 의존 절차가 구현을 차단하지 않게 한다 | `development-plan.md` |
| 4 | M2 구현과 shadow 수집을 병행할 수 있고 검증은 patch enforce만 차단한다 | cto | 구현 속도와 rollout 안전성을 분리한다 | `development-plan.md` |
| 5 | runtime에는 raw와 무관한 random request ID와 structural 결과만 저장한다 | cto | 원문 복원과 secret key 관리 문제를 설계에서 제거한다 | `development-plan.md` |
| 6 | feature/initiative와 Codex는 patch 성공 후 별도 확장 결정을 거친다 | cto | vertical slice 전에 범위가 다시 확장되는 것을 막는다 | `development-plan.md` |

### 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-21 | 간소화된 patch-first 계획으로 신규 생성 |

## Artifacts

| Artifact | Owner | Agent | Source | Summary | File |
|---|---|---|---|---|---|
| development-plan | cto | cto-direct | 사용자 재기획 요청 + 기존 실험 학습 | patch-only vertical slice, privacy, fallback, gate, 코딩 규칙 | `development-plan.md` |

## CEO 판단 근거

본 계획은 CEO 자동 라우팅이 아니라 사용자가 기존 기술 계획을 보존하면서 간소화해 다시 기획해 달라고 직접 요청해 CTO owner로 고정했다. 제품·시장·운영 확장은 현재 성공 조건에 필요하지 않으므로 CPO/CBO/COO phase를 활성화하지 않는다. privacy와 high-assurance 조건은 기술 비협상 원칙과 design gate에 포함하되 외부 Claude 검토는 mandatory에서 제외한다.

## Next Phase

→ **Design** — 코드 작성 전에 patch-only vertical slice의 구현 계약을 확정한다.

예상 design artifact:

- `architecture.md`: 기존 core/state에 연결되는 analyze/compile/fallback 경계
- `privacy-contract.md`: request metadata allowlist와 금지 persistence
- `rollout-contract.md`: legacy/shadow/patch-enforce config, gate, rollback

Design에서도 프로덕션 코드를 수정하지 않는다. 세 계약이 확정된 뒤에만 Do phase로 이동한다.
