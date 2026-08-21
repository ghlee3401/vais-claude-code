---
owner: cto
artifact: development-plan
phase: plan
feature: adaptive-workflow-kernel-v2
summary: "기존 실험을 보존하면서 Claude Code patch 경로부터 작게 통합하는 Adaptive Workflow Kernel v2 간소화 개발 계획"
---

# Adaptive Workflow Kernel v2 — Lean Development Plan

> Plan 단계 범위: 목표, 경계, 코딩 규칙, 검증·rollout 조건만 확정한다. 이 문서 작성에서는 프로덕션 코드와 기존 `adaptive-workflow-kernel` 문서를 수정하지 않는다.

## 요청 원문

> 기존 adaptive-workflow-kernel은 실험 기록으로 보존하고, adaptive-workflow-kernel-v2를 간소화된 계획으로 처음부터 기획해줘. Claude 검토는 mandatory에서 제외하고 코드 구현은 아직 시작하지 마.

## 1. 목적

기존 계획은 계약, baseline, corpus, shadow privacy까지 한 번에 완성하려다 검증 체계 자체가 개발을 차단했다. v2는 다음 한 가지 결과를 먼저 만든다.

> **Claude Code에서 작은 코드 변경(patch)을 기존 legacy fallback 뒤에서 안전하게 분류하고, 필요한 최소 phase만 실행할 수 있는 vertical slice.**

기존 `docs/adaptive-workflow-kernel/`과 관련 코드는 삭제하거나 되돌리지 않는다. 해당 작업은 실험 evidence이며, v2 설계에서 재사용 여부를 항목별로 다시 결정한다.

## 2. In-scope

- 첫 host는 Claude Code 하나로 제한한다.
- 첫 profile은 `patch` 하나로 제한한다.
- 위험도는 `normal / high` 두 단계만 실행 정책에 반영한다.
- patch phase graph는 기본적으로 `plan → do → qa`로 제한한다.
- 실행 mode는 `legacy / shadow / patch-enforce` 세 값으로 관리한다.
- 기존 legacy 실행을 항상 fallback으로 유지한다.
- classifier/compiler/core 연결은 feature flag 뒤에서 구현한다.
- 자동 테스트와 소수의 실제 dogfood로 patch enforce 여부를 결정한다.
- runtime event에는 원문, 절단 원문, 원문 기반 digest를 저장하지 않는다.

## 3. Out-of-scope

- `feature / initiative` profile enforce
- Codex adapter와 Codex plugin 배포
- document model v2 전환
- 전체 context budget 최적화
- CPO/CBO/COO workflow 재설계
- 외부 Claude 또는 다른 LLM의 mandatory 검토
- 실제 요청 20건을 구현 시작의 선행 조건으로 두는 절차
- 기존 `adaptive-workflow-kernel` 산출물 재작성 또는 삭제

위 항목은 patch vertical slice가 성공한 뒤 별도 결정으로만 승격한다.

## 4. Context Anchor

| Key | Value |
|---|---|
| WHY | 검증 루프가 구현을 막지 않으면서도 legacy 호환성과 privacy를 유지해야 한다 |
| SUCCESS | config로 켠 patch 요청만 adaptive 경로를 사용하고, 실패 시 legacy로 즉시 복귀한다 |
| RISK | 기존 shadow 실험의 복잡성과 상태 계약을 무비판적으로 재사용하면 같은 지연이 반복된다 |

## 5. 비협상 원칙

1. **Legacy first**: adaptive 오류·불확실성·설정 누락 시 기존 실행을 사용한다.
2. **Explicit opt-in**: 사용자 프로젝트가 명시적으로 켠 mode만 동작한다.
3. **No raw persistence**: 원문, 절단 원문, 원문 token, 복원 가능한 원문 hash를 저장하지 않는다.
4. **No project secret file**: digest·salt·credential을 프로젝트 파일로 만들지 않는다. 민감값이 필요하면 환경 변수만 사용한다.
5. **No duplicate kernel**: 별도 상태 머신을 만들지 않고 기존 core/state 경계에 profile 입력을 추가한다.
6. **Implementation is not enforcement**: flag 뒤 구현은 진행할 수 있지만 검증 전 기본 실행을 전환하지 않는다.
7. **Automated evidence first**: 외부 LLM 검토는 선택 사항이며 release gate가 아니다.
8. **One profile end-to-end**: patch가 실제로 끝까지 동작하기 전 feature·initiative를 구현하지 않는다.

## 6. 최소 실행 모델

```text
User request
  → analyze(profile + assurance)
  → compile(patch phase graph)
  → mode decision
      legacy        → legacy workflow
      shadow        → legacy workflow + structural comparison event
      patch-enforce → adaptive patch workflow
  → any adaptive failure → legacy fallback
```

### 저장 가능한 request metadata

- runtime이 생성한 random `requestId`
- profile, assurance, reasons, confidence
- compile signals와 phase graph
- host/session/feature 식별자
- 실행 mode, fallback 여부, check 결과
- 길이 bucket 같은 비축어적 구조 정보가 꼭 필요할 때만 명시적으로 허용

### 저장 금지

- 사용자 요청 원문 또는 일부
- 원문의 축약·절단·첫 문장
- 원문에 대한 deterministic hash/HMAC
- 이메일, credential, token 등 직접 식별자
- prompt를 재구성할 수 있는 token·n-gram 목록

## 7. 간소화 로드맵

| Milestone | 목표 | 주요 산출물 | 완료 조건 |
|---|---|---|---|
| M0 — Reset Plan | v2 범위와 비협상 조건 고정 | 본 문서, `main.md` | 문서 validator 통과, v2 프로덕션 코드 변경 0건 |
| M1 — Patch Design | patch TaskEnvelope·mode·fallback 계약 설계 | architecture, privacy-contract, rollout-contract | 구현자가 추가 정책 결정을 하지 않아도 되는 수준 |
| M2 — Patch Vertical Slice | 기존 core에 patch-only analyze/compile 연결 | code + unit/integration tests | feature flag off에서 byte-compatible legacy, on에서 patch path 통과 |
| M3 — Shadow & Dogfood | legacy 결과와 patch 결정을 제한적으로 비교 | automated E2E + 실제 dogfood 5건 | raw persistence 0, Critical 0, fallback 검증 |
| M4 — Patch Enforce | opt-in 프로젝트에서 patch만 enforce | release evidence + rollback | 사용자 승인, 전체 회귀 통과, config 한 줄 rollback |
| M5 — Expansion Decision | feature/initiative·Codex 확장 여부 결정 | 새 plan 또는 ADR | patch 효과와 비용 evidence가 확장을 정당화 |

M2 구현은 M3 실제 dogfood 수집과 독립적으로 진행한다. M3는 M4 enforce만 차단한다.

## 8. 구현 시 코딩 규칙

Do phase에서는 반드시 이 절을 참조한다.

1. CommonJS와 현재 Node.js `>=18` 실행 환경을 유지한다.
2. classifier/compiler는 동일 입력에 동일 결과를 내는 순수 함수로 유지한다.
3. filesystem·config·host payload 처리는 adapter 경계에 둔다.
4. 기존 `lib/core/`, `lib/status.js`, gate 모듈을 우선 확장하고 병렬 정본을 만들지 않는다.
5. `legacy` 기본값과 fallback 동작을 변경하는 코드는 별도 명시적 decision 없이는 금지한다.
6. hook은 stdout/additional context를 출력하지 않고 오류 시 요청을 차단하지 않는다.
7. request 식별자는 raw와 무관한 random ID를 사용한다.
8. 민감 정보 또는 cryptographic secret은 저장소·프로젝트 파일에 기록하지 않는다.
9. config 없음, invalid config, classifier 오류, event log 오류를 각각 테스트한다.
10. enforce 코드에는 rollback config와 legacy parity test가 반드시 함께 있어야 한다.
11. 기존 dirty working tree와 과거 실험 파일을 restore/reset/rewrite하지 않는다.
12. 범위 밖 개선은 구현하지 않고 후속 관찰로 남긴다.

## 9. Gate 정책

### Design → Do

- patch TaskEnvelope 필드와 phase graph 확정
- legacy fallback 조건 확정
- request persistence allowlist 확정
- migration이 필요하면 forward/rollback fixture 확정

### Do → QA

- feature flag off legacy parity 통과
- patch normal/high unit·integration test 통과
- raw persistence 금지 test 통과
- 실패별 fallback test 통과

### Patch Enforce

- 전체 `npm test`와 lint 통과
- patch normal, patch high, ambiguous fallback automated E2E 통과
- 실제 dogfood 5건에서 Critical 0
- 사용자에게 실행 범위와 rollback을 보여주고 승인 1회

외부 Claude 검토와 20건 수집은 어떤 gate에도 mandatory가 아니다.

## 10. Success Criteria

| ID | Criterion | Verification |
|---|---|---|
| SC-01 | patch 요청은 `plan → do → qa`를 일관되게 compile한다 | deterministic fixture |
| SC-02 | high patch는 위험 check를 생략하지 않는다 | risk corpus + gate test |
| SC-03 | raw 또는 raw-derived content가 event/state/docs에 저장되지 않는다 | negative persistence tests |
| SC-04 | flag off와 오류 경로는 legacy 결과를 유지한다 | parity + fault injection |
| SC-05 | patch enforce는 명시적 opt-in에서만 활성화된다 | config matrix test |
| SC-06 | rollback은 config 한 줄로 가능하다 | rollback E2E |
| SC-07 | 기존 전체 회귀가 악화되지 않는다 | `npm test`, lint, validators |
| SC-08 | patch 성공 전 feature/initiative/Codex 코드가 추가되지 않는다 | diff scope review |

## 11. Decision Record

| # | Decision | Owner | Rationale |
|---|---|---|---|
| 1 | 기존 kernel 작업은 삭제하지 않고 실험 evidence로 보존한다 | cto | 학습과 회귀 fixture는 유지하되 새 범위를 오염시키지 않는다 |
| 2 | Claude Code + patch vertical slice부터 시작한다 | cto | 가장 작은 end-to-end 가치와 rollback 가능성을 먼저 증명한다 |
| 3 | Claude 검토와 실제 요청 20건은 mandatory gate에서 제거한다 | cto | 외부·시간 의존 검증이 구현 자체를 차단하지 않게 한다 |
| 4 | 실제 dogfood는 patch enforce 직전 5건으로 제한한다 | cto | 자동 검증을 우선하고 최소한의 실제 경로 sanity check만 둔다 |
| 5 | request ID는 raw와 무관한 random 값만 허용한다 | cto | key 관리와 사전 공격 문제를 설계에서 제거한다 |
| 6 | M2 구현은 shadow 수집과 병행할 수 있지만 enforce는 검증 후에만 한다 | cto | 개발 속도와 안전한 rollout을 분리한다 |

## 12. 위험과 완화

| Risk | 영향 | 완화 |
|---|---|---|
| 과거 실험의 복잡성 재유입 | 일정 재지연 | 설계에서 항목별 reuse/reject 결정 |
| patch 오분류 | 불필요한 phase 또는 검증 누락 | conservative fallback + deterministic fixture |
| 상태 이중화 | status drift | 기존 core/state 확장만 허용 |
| privacy 회귀 | 사용자 입력 영속 | persistence allowlist + negative tests |
| enforce 회귀 | 기존 사용자 흐름 파손 | opt-in + legacy fallback + rollback E2E |
| 범위 확장 | vertical slice 미완료 | feature/initiative/Codex를 Out-of-scope로 고정 |

## 13. 관찰 — 후속 과제

- 기존 `adaptive-workflow-kernel`의 corpus와 compiler 중 재사용 가능한 부분은 M1 design에서 평가한다.
- 기존 pre-remediation event log 정리는 별도 사용자 승인 작업으로 유지하며 v2 구현과 결합하지 않는다.
- patch 효과가 입증되면 feature profile, context budget, Codex adapter 순으로 별도 기획한다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-21 | 기존 실험 보존, Claude review 비필수, patch-only vertical slice 중심으로 신규 계획 작성 |
