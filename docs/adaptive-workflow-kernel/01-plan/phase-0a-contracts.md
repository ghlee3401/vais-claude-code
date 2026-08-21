---
owner: cto
artifact: phase-0a-contracts
phase: plan
feature: adaptive-workflow-kernel
summary: "작업 규모, 승인, 보안 대화, 감사 로그, 측정 및 Claude/Codex adapter의 구현 계약"
---

# Phase 0A Contracts

## 1. 단계 목적과 변경 경계

Phase 0A는 대표가 확정한 운영 정책을 구현 가능한 계약으로 변환한다. 기존 `/vais` 실행, CTO mandatory PDCA, status 파일, hook 동작은 이 단계에서 변경하지 않는다.

본 단계의 정본은 이 문서와 다음 schema다.

- `schemas/execution-preview.schema.json`
- `schemas/task-envelope.schema.json`
- `schemas/audit-event.schema.json`
- `contracts/workflow-taxonomy.json`

## 2. 상태 저장 결정

현재 저장소에는 status v2 생성, v3 migration, v4 migration이 공존한다. Phase 0A에서는 `.vais/status.json`을 변경하지 않는다.

Phase 2 통합 시 다음 구조를 적용한다.

- 기존 status는 dual-read한다.
- adaptive 상태는 `features.{feature}.workflow` 아래 `schemaVersion: "1.0"`으로 격리한다.
- run 상세 정보는 `.vais/runs/{runId}/envelope.json`과 `audit.jsonl`에 저장한다.
- status에는 active run과 요약 상태만 보관한다.
- phase 상태는 `pending / in-progress / completed / not-required / blocked`를 사용한다.
- `not-required`는 완료로 위장하지 않으며 prerequisite 계산에서 제외한다.
- migration은 backup, dry-run, rollback fixture를 통과한 뒤에만 write한다.

## 3. Profile별 Phase Graph

| Profile | Required | Conditional | Not required | 승격 조건 |
|---|---|---|---|---|
| `patch` | plan, do, qa | 없음 | ideation, design, report | public contract, data model/schema shape, 다중 영역, 높은 불확실성, 신규 제품 |
| `feature` | plan, do, qa | design | ideation, report | 다중 영역, 높은 불확실성, 신규 제품 |
| `initiative` | plan, design, do, qa, report + 조건부 ideation | CEO 분석이 이미 있을 때 ideation | 없음 | 해당 없음 |

`feature`의 design은 UI flow, API contract, data model, architecture, 외부 integration 중 하나가 바뀌면 required로 compile한다. `initiative`의 ideation은 CEO 7차원 분석 결과가 없으면 required이며, 유효한 CEO 분석이 TaskEnvelope 입력에 이미 있을 때만 conditional이다. `patch/feature`의 report는 별도 LLM phase가 아니라 evidence view로 생성한다.

patch 승격의 DB 조건은 **data model 또는 schema shape 변화**를 뜻한다. 기존 contract와 data shape를 바꾸지 않는 reversible index-only DDL은 migration 검증과 rollback check를 추가한 patch로 유지할 수 있다.

Assurance는 phase 규모를 바꾸지 않는다. 대신 보안 대화와 required check를 추가한다.

## 4. 실행 예고와 승인 상태

모든 실행은 `ExecutionPreview`를 먼저 만든다. preview에는 변경 내용, 결과 예시, 예상 대상, 제외 범위, 검사, 자동 진행 경계, 재확인 조건이 포함된다.

| 현재 상태 | 입력 | 다음 상태 | 동작 |
|---|---|---|---|
| `preview-required` | 일반 작업 승인 | `approved` | 경계 안에서 자동 진행 |
| `preview-required` | high/regulated 판정 | `security-review-required` | 보안 대화 시작 |
| `security-review-required` | 질문 답변 완료 | `security-review-required` | 최종 계획과 잔여 위험 표시 |
| `security-review-required` | 최종 승인 | `security-approved` | 경계 안에서 자동 진행 |
| 모든 실행 상태 | 내용 수정 | `preview-required` | preview 재생성 |
| `approved/security-approved` | scope·risk·destructive·failure | `reapproval-required` | 실행 중단 후 재확인 |
| 모든 상태 | 사용자 중단 또는 해결 불가 gate | `blocked` | 실행 종료 |

일반 patch의 정상 승인 횟수는 1회다. host가 요구하는 shell/write permission과 plugin hook trust는 workflow 승인과 별도로 기록한다.

## 5. 고위험 보안 대화

다음 deterministic trigger 중 하나라도 있으면 최소 `high`다.

canonical trigger 정본은 `contracts/workflow-taxonomy.json`이다.

- `auth`: 인증, 세션, 비밀번호, OAuth
- `authorization`: 역할, 권한, tenant 경계
- `payment`: 결제와 금전
- `pii`, `health`, `regulated`, `cross-border`: 개인정보, 건강, 규제 및 국경 간 데이터
- `migration`: schema/data migration
- `external-write`: 외부 write 또는 고객 데이터 전송
- `secret`, `dependency`, `infrastructure`: credential, 공급망, 운영 기반 변경
- `destructive`: 파괴적이거나 rollback이 어려운 변경
- `untrusted-input`: 파일, network, prompt 등 신뢰하지 않는 입력 처리
- `agent-capability`: hook, tool allowlist, MCP, permission mode 등 AI 실행 권한 확대

`health`, `regulated`, `cross-border`는 최소 `regulated`이며 나머지 trigger는 최소 `high`다. canonical check ID와 실행 kind 매핑도 같은 taxonomy 파일을 사용한다.

대화는 관련 항목만 묻는다: 데이터, 권한, 외부 전송, 실패 영향, rollback, 규제와 보존 기간. 답변 후 최종 scope, 검사, rollback, 잔여 위험을 다시 표시하고 명시적 승인을 받는다.

실행 중 새 trigger가 발견되면 기존 승인은 무효화하고 `reapproval-required`로 전환한다. high/regulated를 낮추려면 사용자 rationale과 대체 검증이 필요하다.

## 6. Audit Ledger 계약

모든 실행 행동은 run별 append-only JSONL event로 기록한다. 핵심 event 범주는 다음과 같다.

- 요청, 분류, preview, 승인, 보안 대화
- context 선택과 읽기
- agent 시작과 완료
- tool 시작, 성공, 실패, 거부
- 파일 변경과 검사
- gate, scope 변경, 재시도
- artifact와 run 완료·실패

모든 event는 `runId`, `sequence`, `timestamp`, `host`, `actor`, `eventType`, `outcome`, `source`, `redaction`, `integrity`를 가진다. hash chain으로 순서와 변조 여부를 확인한다.

hash 계산의 canonical form:

1. redaction을 먼저 완료한다.
2. event를 복제하고 `integrity.eventHash`만 제외한다. `algorithm`과 `previousEventHash`는 hash 입력에 포함한다.
3. object key는 각 깊이에서 사전순으로 정렬하고 array 순서는 유지한다.
4. JSON primitive 규칙과 공백 없는 UTF-8 JSON으로 직렬화한다. JSON으로 표현할 수 없는 값과 non-finite number는 거부한다.
5. SHA-256 lowercase hex를 `eventHash`로 기록한다. 첫 event의 `previousEventHash`는 `null`이고 이후 event는 직전 `eventHash`를 사용한다.

`lib/observability/audit-integrity.js`가 seal과 재검산을 담당한다. 테스트는 링크 비교뿐 아니라 event 본문을 변조한 뒤 hash 재계산 실패를 확인한다.

감사 원칙:

- secret과 PII는 payload 기록 전에 redaction한다.
- 파일 내용 정본은 Git이며 ledger는 path와 before/after hash를 기록한다.
- 큰 output은 summary, content hash, evidence reference로 분리한다.
- 모델 내부 추론은 저장하지 않는다.
- ledger는 기본 model context에 자동 주입하지 않는다.
- Stop 시 expected action과 observed event를 reconciliation한다.
- 누락이 있으면 `auditIncomplete=true`와 `audit.warning`을 남긴다.
- high/regulated run은 audit incomplete 상태로 완료할 수 없다.
- 일반 run도 verified completion이 아니라 `completed-with-audit-gap`으로 표시한다.

Hook만으로 관찰할 수 없는 host tool이 있을 수 있으므로 kernel event, host hook, structured agent result를 합쳐 coverage를 계산한다. 관찰되지 않은 행동을 성공으로 추정하지 않는다.

## 7. 비용 측정 계약

| 등급 | Source | 용도 |
|---|---|---|
| A | provider/SDK actual usage | 실제 비용 판단 |
| B | host event 또는 안정된 session usage | host별 비교 |
| C | UTF-8 bytes, transcript, artifact proxy | 모든 환경의 회귀 비교 |

각 값은 `source`, `accuracy`, `capturedAt`과 함께 저장한다. A/B/C를 합쳐 하나의 actual token처럼 표시하지 않는다. actual을 얻지 못해도 C proxy, elapsed, agent 수, workflow 승인, artifact bytes, quality를 반드시 수집한다.

Audit Ledger의 저장량은 model token과 분리한다. ledger는 compact event, hash/reference, rotation, lazy read를 적용하므로 다음 run의 기본 입력 비용에 포함하지 않는다.

## 8. Host Capability Matrix

| Capability | Claude Code | Codex | VAIS 결정 |
|---|---|---|---|
| plugin hook | `hooks/hooks.json` | 기본 `hooks/hooks.json` 또는 manifest override | host별 config 생성 |
| tool lifecycle | Pre/Post/Failure와 추가 event 지원 | Pre/Post 중심, 일부 specialized/hosted tool 제외 가능 | 공통 최소 event + coverage gap |
| subagent | Start/Stop과 agent 식별 정보 | Start/Stop, parent session 기반 | normalized actor 사용 |
| hook trust | 설정·관리 정책의 영향을 받음 | non-managed hook은 hash 기반 review/trust 필요 | trust를 workflow 승인과 분리 |
| plugin root | `CLAUDE_PLUGIN_ROOT` | `PLUGIN_ROOT`, 호환용 `CLAUDE_PLUGIN_ROOT` | adapter가 root 정규화 |
| skill | Claude plugin skill | standalone/plugin skill | 공통 workflow skill 유지 |
| IDE 배포 | Claude plugin hook 사용 가능 | plugin 미지원, standalone skill 사용 | Codex IDE fallback 별도 제공 |

Hook JSON의 형태가 비슷해도 raw 파일을 하나로 공유하지 않는다. 공통 event policy에서 Claude/Codex 설정을 각각 생성한다.

공식 참조:

- `https://code.claude.com/docs/en/hooks`
- `https://code.claude.com/docs/en/plugins-reference`
- `https://learn.chatgpt.com/docs/hooks`
- `https://learn.chatgpt.com/docs/build-plugins`
- `https://learn.chatgpt.com/docs/build-skills`

## 9. Phase 0A 완료 기준

- 대표 정책이 세 schema와 fixture에 표현됨
- patch/feature/initiative phase graph가 서로 모순되지 않음
- high/regulated가 보안 승인 없이 실행될 수 없음
- raw prompt와 secret이 영구 계약 필드에 없음
- audit event chain과 누락 처리 규칙이 검증됨
- Claude/Codex의 관찰 불가 영역이 명시됨
- 기존 runtime 파일은 변경되지 않음

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-13 | Phase 0A 구현 계약과 host capability 결정 확정 |
| v1.1 | 2026-08-20 | Gate 1 수정 반영: case별 phase compile, canonical taxonomy, initiative ideation 조건, audit canonical SHA-256 계약 |
