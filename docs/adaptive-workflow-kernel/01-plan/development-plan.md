---
owner: cto
artifact: development-plan
phase: plan
feature: adaptive-workflow-kernel
summary: "기존 core를 확장해 작업 규모·위험도 기반 adaptive workflow와 Claude/Codex adapter를 만드는 검증 중심 계획"
---

# Adaptive Workflow Kernel Development Plan

> 본 문서는 상세 계획 정본이다. 새 세션에서는 `main.md`를 먼저 읽고 현재 milestone 섹션만 추가로 읽는다. v1.0 재검토 근거는 `plan-review.md`에 보존한다.

## 0. 참조 문서와 재진입 계약

### 프로젝트 참조

- `ONBOARDING.md`
- `CLAUDE.md`
- `AGENTS.md`
- `skills/vais/SKILL.md`
- `skills/vais/phases/cto.md`
- `agents/cto/cto.md`
- `agents/_shared/checkpoint-policy.md`
- `agents/_shared/subdoc-guard.md`
- `agents/_shared/work-rules.md`
- `lib/ceo-algorithm.js`
- `lib/core/state-machine.js`
- `lib/core/migration.js`
- `lib/status.js`
- `lib/quality/gate-manager.js`
- `lib/observability/`
- `lib/project-profile.js`
- `lib/context-metrics.js`
- `scripts/context-baseline.js`
- `scripts/auto-select-template.js`
- `hooks/hooks.json`
- `vais.config.json`
- `docs/adaptive-workflow-kernel/01-plan/plan-review.md`

### Codex 공식 참조

- `https://learn.chatgpt.com/docs/build-plugins`
- `https://learn.chatgpt.com/docs/hooks`
- `https://learn.chatgpt.com/docs/build-skills`
- `https://learn.chatgpt.com/docs/agent-configuration/agents-md`

공식 문서 기준으로 Codex는 `.codex-plugin/plugin.json`, local marketplace, plugin-bundled hooks를 지원한다. Codex CLI와 ChatGPT desktop의 Codex surface는 plugin을 지원하지만 IDE extension은 plugin 대신 standalone skill 경로를 사용해야 한다.

### 세션 재진입 순서

1. `docs/adaptive-workflow-kernel/01-plan/main.md`의 현재 상태와 Next Phase를 읽는다.
2. 본 문서에서 현재 milestone과 완료 기준만 읽는다.
3. 해당 milestone의 source, ADR, fixture, 최근 검증 결과만 읽는다.
4. 작업 후 `main.md` 상태와 Next Phase를 갱신한다.
5. 새 설계 결정은 Decision Record에 append한다.

원래 대화, 전체 CHANGELOG, 모든 agent/knowledge 파일은 기본 재진입 컨텍스트에 포함하지 않는다.

## 1. 문제 진단

### 1.1 비용을 정확히 측정하지 못한다

- 현재 `context-baseline.js`는 skill, phase router, C-Level agent의 고정 파일과 일부 artifact bytes를 측정한다.
- CTO phase 고정 측정은 약 6,092 estimated tokens지만 shared guard와 template을 포함한 정적 제어 경로는 약 10,617~11,687 estimated tokens다.
- PRD, 기존 artifact, knowledge, source 탐색, sub-agent 전달 컨텍스트는 빠져 있다.
- token 값은 `UTF-8 bytes / 4` proxy이며 provider billing usage가 아니다.
- 일반 lifecycle hook에서 전체 모델 usage를 안정적으로 얻을 수 있다는 host 계약도 없다.

### 1.2 승인 정책이 서로 충돌한다

- lean checkpoint 정책은 정상 gate를 자동 통과하도록 규정한다.
- `SKILL.md`는 모든 action 완료 후 AskUserQuestion 호출을 강제한다.
- CTO router는 단일 phase 실행과 무승인 phase 연쇄 금지를 강제한다.
- 따라서 현재 계약으로는 workflow 승인 1회 목표를 충족할 수 없다.

### 1.3 라우팅과 artifact가 함께 팽창한다

- 단순 bug도 CEO+CPO+CTO와 여러 artifact를 활성화할 수 있다.
- `productDefinition=high`는 JTBD, TAM, OST, 3개 canvas를 동시에 활성화한다.
- artifact owner에서 active C-Level을 역산하므로 artifact 과다가 agent 과다 호출로 이어진다.
- phase-artifact mapping이 `lib/ceo-algorithm.js`와 `vais.config.json`에 중복된다.

### 1.4 문서가 실행 evidence보다 prose를 반복한다

- sub-agent 원문, phase main, implementation log, QA report, completion report가 같은 사실을 반복할 수 있다.
- implementation/QA/report의 상당 부분은 run-scoped diff, test, scan, decision evidence로 생성할 수 있다.
- 현재 `docs/` 크기 자체보다 한 작업에서 새로 읽고 쓰는 중복 bytes가 비용 판단에 더 중요하다.

### 1.5 기존 크기 판단 신호가 시점상 잘못됐다

- `auto-select-template.js`는 이미 변경된 `git status` 파일 수를 사용한다.
- Plan 전 신규 기능은 변경 파일이 없으므로 작게 오판될 수 있다.
- 요청 의미, 예상 contract 변화, project profile, 위험도, 불확실성, 되돌리기 난이도가 먼저 필요하다.

### 1.6 상태와 gate의 정본이 분산돼 있다

- `lib/core/state-machine.js`는 모든 CTO phase를 고정 순차로 정의한다.
- `lib/status.js`와 `vais.config.json`도 별도 phase 순서와 mandatory 목록을 갖는다.
- status schema는 v2 생성, v3 migration, v4 관련 helper가 공존한다.
- 신규 `lib/kernel`을 병렬로 추가하면 상태·gate 정본이 하나 더 생긴다.

### 1.7 raw prompt와 전체 git diff는 안전한 evidence가 아니다

- 사용자 요청 원문에는 secret, PII, 고객 데이터가 들어갈 수 있다.
- dirty worktree와 동시 agent 변경이 전체 git diff에 섞일 수 있다.
- 영구 저장은 redaction과 run attribution을 거쳐야 한다.

### 1.8 보존할 강점

- 위험 Bash 차단과 path safety
- deterministic state/gate helper와 atomic write
- frontmatter 기반 artifact 식별
- CEO 7차원 위험 신호
- project profile과 knowledge lazy-load
- observability JSONL과 기존 회귀 테스트
- legacy workflow fallback 가능성

## 2. 목표와 비목표

### 목표

1. 품질을 유지하면서 patch/feature 작업의 고정 제어 컨텍스트를 50% 이상 줄인다.
2. 작업 규모와 assurance에 따라 phase, agent, artifact, QA를 결정한다.
3. 정상 흐름의 VAIS workflow 승인은 1회로 줄인다.
4. 결정과 검증 evidence를 runId 기준으로 안전하게 보존한다.
5. Claude Code와 Codex가 같은 compiler/schema를 사용한다.
6. legacy workflow를 유지한 채 shadow부터 점진 전환한다.

실제 provider token은 수집 가능할 때 검증 지표로 사용한다. 수집할 수 없는 환경에서는 정적 context bytes, transcript proxy, agent/artifact/approval 수를 공식 proxy로 사용한다.

### 비목표

- 첫 milestone에서 61개 agent 문서를 전면 재작성하지 않는다.
- 기존 `docs/`를 일괄 마이그레이션하지 않는다.
- classifier 검증 전에 adaptive execution을 기본 활성화하지 않는다.
- 공통 compiler 전에 Codex full adapter를 복제 구현하지 않는다.
- 초기 retrieval에 vector database를 도입하지 않는다.
- host 자체의 shell/write permission을 VAIS 승인으로 대체하지 않는다.

## 3. 설계 원칙

1. **Size and risk are orthogonal**: 규모와 assurance를 별도로 계산한다.
2. **Semantics over ceremony**: 필요한 PDCA 의미와 gate는 유지하되 대화·문서 분리는 강제하지 않는다.
3. **Reuse before replacement**: 기존 state, gate, observability를 우선 확장한다.
4. **Preview once, then automate**: 실행 예고와 예시를 한 번 승인받은 뒤 승인된 scope 안에서 자동 진행한다.
5. **Policy as code**: phase, gate, artifact, approval은 versioned schema와 순수 함수로 계산한다.
6. **Evidence over prose**: run-scoped 명령, 결과, 변경, 결정이 문서의 원천이다.
7. **Progressive disclosure**: 현재 작업에 필요한 context manifest만 모델에 전달한다.
8. **Privacy by default**: raw prompt와 민감 데이터는 기본 영구 저장하지 않는다.
9. **Host-neutral compiler**: tool 이름, permission, hook payload는 adapter에서 정규화한다.
10. **Measured rollout**: shadow -> patch -> feature -> initiative 순으로 전환한다.

## 4. WorkProfile과 Assurance

### 4.1 WorkProfile

| 내부 코드 | 사용자 표시 | 조건 | 실행 phase | 기본 artifact |
|---|---|---|---|---|
| `patch` | 작게 | 국소 수정, public contract 변화 없음, 단일 도메인, 낮은 불확실성 | Plan -> Do -> QA | change contract, QA evidence |
| `feature` | 표준 | 명확한 기능 하나, bounded scope, 1~3 도메인 | Plan -> 조건부 Design -> Do -> QA | feature spec, 조건부 contract/design, QA evidence |
| `initiative` | 전체 | 신규 제품/서비스, 다중 도메인, 높은 불확실성 | 전체 PDCA | PRD, design, QA, report |

`report`는 patch/feature에서 evidence projection으로 자동 생성한다. initiative에서만 별도 synthesis phase를 기본 허용한다.

profile별 phase는 전역 phase 배열을 수정해 계산하지 않는다. compiler가 아래 값을 명시적으로 만든다.

- `requiredPhases`
- `optionalPhases`
- `notRequiredPhases`
- `currentPhase`
- `nextEligiblePhases`

상태에는 생략 phase를 `completed`로 위장하지 않고 `not-required`로 기록한다.

### 4.2 Assurance

| Assurance | 주요 trigger | 추가 검증 |
|---|---|---|
| `normal` | 일반 기능 | relevant lint/test |
| `high` | auth, payment, permission, PII, migration, destructive, external write, dependency/infra 변화 | threat/rollback 검토, secret/dependency scan, 강화 QA |
| `regulated` | 규제 대상 데이터·지역·계약 또는 사용자/project profile 선언 | compliance artifact, 감사 가능한 evidence와 retention |

assurance 입력 우선순위는 project profile과 사용자 선언, deterministic risk rule, 요청 의미 분석 순이다. 불확실하면 `unknown`을 반환하고 한 단계 상향한다. `high/regulated` 하향은 rationale과 대체 검증을 요구한다.

### 4.3 사용자 선택 UX

모든 작업은 실행 전에 한 번의 실행 예고를 보여준다.

- 추천 규모와 assurance
- 실제로 바꿀 내용과 짧은 결과 예시
- 예상 변경 파일 또는 영역
- 실행 phase, agent, artifact, check
- 자동 진행 경계와 다시 확인할 조건

일반 patch는 `이대로 실행 / 내용 수정 / 중단` 중 하나를 선택한다. 승인 후에는 Plan, Do, QA와 결과 기록을 자동 완료한다.

`high/regulated`는 데이터, 권한, 외부 전송, 실패 영향, rollback을 대화로 한 번 더 확인한다. 답변을 반영한 최종 계획과 남은 위험을 명시적으로 승인받기 전에는 실행하지 않는다.

다시 확인하는 조건은 scope 확대, 위험도 상승, destructive 작업, gate/test 실패, 요구 충돌이다. 이 승인 횟수는 VAIS checkpoint만 세며 host permission과 plugin hook trust는 별도 지표다.

## 5. 목표 아키텍처와 계약

### 5.1 구조

```text
Claude Adapter                 Codex Adapter
      \                           /
       +---- normalized request/event ----+
                         |
                 Workflow Compiler
       classify -> compile -> transition -> complete
                         |
                    TaskEnvelope
                         |
        existing state / gate / observability
                         |
              selected agent execution
                         |
              run-scoped EvidenceManifest
                         |
                 Markdown View Renderer
```

### 5.2 기존 모듈 재사용

| 책임 | 기준 모듈 | 변경 방향 |
|---|---|---|
| phase transition | `lib/core/state-machine.js` | profile-aware graph 입력 지원 |
| status persistence | `lib/status.js`, `lib/core/state-store.js` | schema 정리와 단일 facade |
| gate | `lib/quality/gate-manager.js` | assurance/profile별 required check 지원 |
| observability | `lib/observability/`, `lib/hook-logger.js` | runId, metric source, duration 추가 |
| project risk | `lib/project-profile.js`, `lib/ceo-algorithm.js` | classifier feature로 재사용 |
| context metric | `lib/context-metrics.js` | source별 actual/proxy 구분 |

별도 state store나 별도 gate runner를 가진 `lib/kernel/` 트리를 만들지 않는다.

### 5.3 최소 신규 모듈

```text
lib/workflow/profile-classifier.js
lib/workflow/workflow-compiler.js
lib/workflow/context-manifest.js
lib/workflow/artifact-policy.js
lib/workflow/evidence-manifest.js
lib/platform/claude/
lib/platform/codex/
scripts/vais-workflow.js
schemas/task-envelope.schema.json
schemas/evidence-manifest.schema.json
schemas/agent-result.schema.json
```

초기 CLI는 `node scripts/vais-workflow.js analyze|prepare|complete|next|render`로 제공한다. 독립 `bin/vais` packaging은 adapter 안정화 후 결정한다.

### 5.4 TaskEnvelope 최소 계약

```yaml
schemaVersion: string
policyVersion: string
runId: string
feature: adaptive-workflow-kernel
request:
  summary: string
  hash: string
  rawPersistence: none
repoSnapshot:
  headSha: string
  dirtyPathHashes: []
profile:
  recommended: feature
  selected: feature
  confidence: 0.0
  reasons: []
assurance:
  level: high
  triggers: []
phaseGraph:
  required: []
  optional: []
  notRequired: []
scope:
  in: []
  out: []
  allowedPaths: []
constraints:
  forbiddenActions: []
checks:
  required: []
artifacts:
  required: []
  conditional: []
context:
  refs: []
  instructionBudgetBytes: 0
  workingBudgetBytes: 0
approval:
  boundary: []
  stopConditions: []
evidence:
  manifestPath: string
```

raw 요청은 실행 중 memory에만 유지한다. persistence opt-in이 있을 때도 redaction을 통과한 별도 reference만 기록한다.

## 6. Evidence와 Artifact 정책

### 6.1 항상 기록

- redacted goal summary와 request hash
- scope, non-goals, acceptance criteria
- profile/assurance 선택과 결정 근거
- 실행 예고, 예시, 사용자 승인·수정·중단
- context 선택, agent 호출, tool 실행의 시작·종료·결과
- 되돌리기 어려운 결정과 deviation
- shell command redacted form과 exit code
- 파일 생성·수정 path와 before/after hash
- 실행한 check, 재시도, 오류, gate 결과
- duration, agent/승인 수, actual/proxy cost
- run-scoped changed paths와 위험 및 최종 상태

### 6.2 조건부 기록

- UI/API contract 변화
- data migration과 rollback
- assurance high 이상의 threat/security evidence
- regulated compliance evidence
- 새 운영 절차의 runbook

### 6.3 EvidenceManifest

실행 시작 시 다음을 snapshot한다.

- `HEAD` SHA
- 시작 시 dirty path와 content hash
- allowed paths와 forbidden actions
- producer host/agent
- command/check 시작·종료 시각과 exit code

실행 후에는 시작 snapshot과 run event를 기준으로 changed path를 귀속한다. 전체 worktree diff를 그대로 VAIS 변경으로 간주하지 않는다.

### 6.4 Audit Ledger

모든 실행 행동은 append-only event로 남긴다. 공통 필드는 `runId`, `timestamp`, `actor`, `eventType`, `outcome`이다.

민감 내용은 redaction하고 큰 output은 summary, hash, evidence reference로 분리한다. 코드 변경의 내용 정본은 Git이며 로그는 path와 hash를 가진다. 모델 내부 추론은 저장하지 않는다.

로그는 hook과 deterministic logger가 생성하고 기본 실행 context에는 주입하지 않는다. 로그 기록이 실패하면 run summary에 `auditIncomplete=true`를 남기고 성공으로 위장하지 않는다.

### 6.5 자동 생성 view

- implementation view: run-scoped changed paths와 decision에서 생성
- QA view: check evidence와 gate verdict에서 생성
- completion view: state, decision, evidence에서 생성
- legacy `main.md`: 호환 renderer가 projection

모델 내부 추론, 빈 heading, 규칙 재서술, 압축하지 않은 sub-agent 원문은 저장하지 않는다. sub-agent 결과는 `decisions`, `changes`, `evidence`, `risks`, `openQuestions`로 제한한다.

## 7. 단계별 개발 계획

기간은 초기 추정이며 Phase 0B 이후 재산정한다.

### Phase 0A - Policy, State, Measurement, Host Feasibility

예상 기간: 2~3일

작업:

- profile별 phase graph와 `not-required` 의미를 ADR로 확정한다.
- `lib/status.js`, core state machine, config, migration의 schema/version 정본을 감사한다.
- workflow approval과 host permission/hook trust의 경계를 정의한다.
- actual token, transcript proxy, static bytes의 metric source와 정확도 등급을 정의한다.
- raw request redaction/retention과 EvidenceManifest 귀속 정책을 확정한다.
- 실행 예고 schema, 보안 대화 protocol, 승인 state machine을 확정한다.
- 전체 실행 audit event taxonomy, redaction, retention, rotation을 확정한다.
- Claude/Codex capability spike를 수행한다.
- Codex plugin 지원 surface, hook input/output, timeout, trust, skill discovery 차이를 기록한다.

완료 기준:

- policy/state/privacy/evidence ADR 승인
- state migration과 rollback fixture 설계 완료
- metric availability matrix 완료
- Claude/Codex capability matrix 완료
- 구현 중 열려 있는 Critical 설계 질문 0개

### Phase 0B - Baseline and Evaluation Corpus

예상 기간: 2~3일

작업:

- 최소 45개 label fixture를 만든다: profile별 15개 이상.
- 별도 critical-risk corpus를 auth, payment, PII, migration, destructive, regulated 중심으로 만든다.
- 기존 요청/산출물은 secret과 식별 정보를 제거한 뒤 offline replay 입력으로 사용한다.
- live legacy E2E는 patch, feature, high-assurance 대표 3종을 각 2회 실행한다.
- context bytes, artifact bytes, agent 수, workflow 승인, host 승인, elapsed, gate/quality를 같은 runId로 기록한다.

완료 기준:

- fixture label 근거와 reviewer 기록 존재
- proxy metric 100% 수집
- actual token은 지원 여부와 누락 이유가 명시됨
- baseline quality와 cost가 같은 runId로 연결됨

### Phase 1 - Classifier and Compiler Shadow Mode

예상 기간: 1주

작업:

- 1단계 deterministic assurance override와 2단계 profile 추천을 분리한다.
- project profile, CEO 7차원 결과, 요청 의미, 예상 contract, repo inventory를 feature로 사용한다.
- `unknown`과 conservative promotion을 지원한다.
- `profile + assurance + reasons + confidence + phaseGraph`를 출력한다.
- 실행은 legacy로 유지하고 shadow 결과만 event log에 기록한다.
- raw prompt는 event log에 쓰지 않는다.

완료 기준:

- held-out profile macro F1 0.85 이상
- critical-risk corpus와 shadow 표본에서 unsafe assurance miss 0건
- 단순 bug에서 CPO/business canvas가 기본 활성화되지 않음
- shadow 실제 요청 20건 검토
- 잘못된 결과가 legacy 실행을 변경하지 않음

### Phase 2 - Core Integration and State Migration

예상 기간: 1~2주

작업:

- 기존 state machine을 compiled phase graph 입력 방식으로 확장한다.
- status schema를 감사 결과의 단일 버전으로 정리하고 dual-read migration을 제공한다.
- artifact/agent mapping을 하나의 declarative policy로 통합한다.
- `analyze`, `prepare`, `complete`, `next` 순수 compiler API를 제공한다.
- legacy와 adaptive phase/gate 결과를 비교 기록한다.

완료 기준:

- 동일 normalized input과 repo snapshot은 동일 TaskEnvelope 생성
- patch의 Design/Report가 `not-required`로 일관되게 처리됨
- old/new status migration과 rollback fixture 통과
- 모든 기존 회귀 테스트 통과
- config 한 줄로 legacy fallback 가능

### Phase 3 - Context, Approval, Evidence, Document Views

예상 기간: 1주

작업:

- auto-loaded instruction, selected skill, phase context, working refs를 별도 budget으로 측정한다.
- budget 초과 시 필수 원문을 자르지 않고 overflow reason과 대체 context를 반환한다.
- 실행 예고와 결과 예시를 승인받은 뒤 경계 안에서 compiled phase만 자동 전진한다.
- high/regulated 보안 대화와 재승인 state를 구현한다.
- 모든 context/agent/tool/change/check 행동을 Audit Ledger에 기록한다.
- EvidenceManifest와 structured agent result를 구현한다.
- v1/v2 문서 validator와 legacy renderer를 함께 지원한다.

완료 기준:

- 일반 patch는 실행 예고 승인 1회 후 자동 완료
- high/regulated는 보안 대화와 최종 명시 승인 없이는 실행 불가
- material scope expansion, destructive, gate fail에서만 추가 workflow 승인
- E2E 실행 action 대비 audit event 누락 0건
- audit 실패 시 `auditIncomplete=true` 검증
- patch artifact 1~2개, feature artifact 3~6개
- 기존 dirty worktree 변경이 run artifact에 잘못 귀속되지 않음
- critical/gate fail 시 자동 전진 차단

### Phase 4 - Claude Code Adapter

예상 기간: 1주

작업:

- `skills/vais/SKILL.md`를 compiler 호출과 실행 계약 중심으로 축소한다.
- phase/C-Level 문서의 공통 규칙을 제거하고 domain guidance만 남긴다.
- Claude hook payload를 normalized event로 변환한다.
- 기존 `/vais` 명령과 `.claude-plugin` 배포를 유지한다.
- shadow -> patch enforce -> feature enforce 순으로 rollout한다.

완료 기준:

- 기존 명령 호환
- patch/feature/high-assurance E2E 통과
- old/new gate divergence가 승인된 예외 이내
- legacy fallback 검증

### Phase 5 - Codex Adapter

예상 기간: 1주

작업:

- `.codex-plugin/plugin.json`과 local marketplace entry를 만든다.
- 공통 skill은 open agent skill 구조를 따르고 Codex entry는 compiler 결과를 실행한다.
- AGENTS.md는 비협상 정책과 skill 진입점만 유지한다.
- hook 설정은 공통 event spec에서 host별로 생성한다. raw `hooks.json`을 그대로 공유하지 않는다.
- Codex hook trust와 plugin 재설치/cachebuster 절차를 테스트한다.
- CLI/ChatGPT desktop plugin E2E와 IDE standalone skill fallback을 구분한다.

완료 기준:

- compiler fixture의 profile, assurance, phase/artifact policy snapshot parity 100%
- Codex CLI local marketplace 설치와 새 session E2E 통과
- IDE standalone skill fallback 확인
- host-specific tool 이름이 compiler에 없음

### Phase 6 - Rollout and Cleanup

예상 기간: 1주

작업:

- 비개발자 dogfood: patch, feature, auth/high assurance.
- legacy/adaptive 결과를 같은 acceptance 기준으로 비교한다.
- 신규 feature에 v2 evidence/document model을 기본화한다.
- legacy router는 최소 2개 release 동안 유지한 뒤 deprecate한다.
- context, artifact, workflow approval budget을 CI regression gate로 추가한다.

완료 기준:

- acceptance와 critical issue가 baseline보다 악화되지 않음
- profile별 cost 목표 달성
- migration/rollback runbook 준비
- legacy 제거 조건을 release decision으로 기록

## 8. 설정과 마이그레이션

초기 설정 제안:

```json
{
  "workflow": {
    "engine": "legacy",
    "profile": {
      "mode": "shadow",
      "default": "feature"
    },
    "documentModel": "v1",
    "requestPersistence": "redacted"
  }
}
```

전환 순서:

1. `legacy + shadow`
2. `adaptive + patch enforce`
3. `adaptive + feature enforce`
4. `adaptive + initiative enforce`
5. 신규 feature의 `documentModel=v2`

기존 문서는 재작성하지 않는다. state와 document는 dual-read하고, write format 변경 전 backup/rollback fixture를 통과한다.

## 9. 검증 전략

| Layer | 검증 |
|---|---|
| Policy | profile별 phase graph와 approval boundary table |
| Classifier | held-out macro F1, confusion matrix, critical-risk miss |
| Compiler | 순수 함수 unit test와 TaskEnvelope snapshot |
| State | legacy fixture migration, dual-read, rollback |
| Context | source별 bytes/token proxy, 필수 정보 보존, overflow |
| Evidence | dirty worktree/concurrent run attribution |
| Artifact | required/conditional/generated policy |
| Gate | assurance/profile별 check와 fail blocking |
| Adapter | Claude/Codex normalized event contract |
| E2E | patch, feature, auth/high assurance |
| Quality | acceptance pass, regression, critical count |
| Cost | actual/proxy token, elapsed, agent, approval, artifact bytes |

LLM judge는 보조 지표다. deterministic acceptance, 실행 evidence, 사람이 label한 fixture를 우선한다.

## 10. 성공 기준

| Metric | Target |
|---|---:|
| 고정 제어 컨텍스트 | patch/feature baseline 대비 50% 이상 감소 |
| 총 입력 proxy | patch 40% 이상, feature 25% 이상 감소 |
| initiative 총 입력 proxy | baseline보다 증가하지 않음 |
| actual provider token | 수집 가능한 host에서 proxy 방향성 확인 |
| workflow 승인 | 정상 patch/feature 실행 예고 1회 |
| high/regulated 승인 | 보안 대화와 최종 명시 승인 100% |
| host permission/hook trust | 별도 보고, VAIS KPI에서 제외 |
| audit event coverage | 실행 action 대비 100%, 누락 0건 |
| patch artifact | 1~2개 |
| feature artifact | 3~6개 |
| artifact bytes | patch/feature 60% 이상 감소 |
| classifier macro F1 | held-out 0.85 이상 |
| critical-risk unsafe miss | corpus와 shadow에서 0건 |
| acceptance pass rate | baseline 이상 |
| Critical issue | baseline보다 증가 금지 |
| compiler parity | Claude/Codex fixture snapshot 100% |
| adapter E2E | 각 host의 contract conformance 통과 |

숫자는 Phase 0B baseline 후 한 번 재검토한다. actual token이 안정적으로 수집되지 않으면 이를 release blocker로 사용하지 않고 proxy와 quality를 사용한다.

## 11. 주요 위험과 완화

| Risk | 영향 | 완화 |
|---|---|---|
| phase graph 불일치 | 상태/다음 단계 오동작 | classifier 전에 policy ADR와 state fixture |
| 기존 core와 신규 compiler 중복 | 정본 재분산 | 기존 module 확장, 별도 state/gate 금지 |
| context 과도 축소 | 요구 누락 | AC 보존, source manifest, overflow |
| classifier 오분류 | 검증 부족 | unknown, conservative promotion, shadow |
| raw prompt 저장 | secret/PII 노출 | ephemeral raw, redaction, hash |
| diff 오귀속 | 사용자 변경 침범 | start snapshot과 run-scoped event |
| 전체 로그로 저장량 증가 | 비용·성능 저하 | compact event, hash/reference, rotation, lazy read |
| 로그 기록 실패 | 감사 공백 | `auditIncomplete` 차단 표시와 복구 가능한 append |
| 실제 token 미수집 | 효과 판단 오류 | actual/proxy 구분과 availability matrix |
| host 차이 | adapter 재설계 | Phase 0 capability spike와 generated config |
| 전면 개편 장기화 | 가치 전달 지연 | patch vertical slice, legacy fallback |

## 12. 구현 우선순위

### P0

- policy/state/privacy/evidence ADR
- metric availability와 baseline corpus
- Claude/Codex capability spike
- classifier/compiler shadow mode

### P1

- profile-aware state transition과 migration
- TaskEnvelope, context/evidence manifest
- adaptive patch profile
- Claude adapter 경량화

### P2

- feature/initiative 확대
- Codex full adapter와 packaging
- legacy deprecation과 CI budget gate

## 13. 첫 번째 실행 단위

첫 구현 단위는 runtime을 바꾸지 않는 `analyze shadow` vertical slice다.

1. profile phase graph, privacy, evidence, metric ADR을 작성한다.
2. 최소 45개 fixture와 critical-risk corpus를 준비한다.
3. `profile + assurance + reasons + confidence + phaseGraph`를 출력한다.
4. request hash와 shadow result만 runId event로 남긴다.
5. legacy 실행 결과와 비교하되 어떤 phase도 자동 변경하지 않는다.
6. held-out과 실제 shadow 20건 기준을 통과한 뒤 patch만 enforce한다.

이 기준을 통과하기 전에는 mandatory 문서 축소, artifact 정책 강제, Codex full manifest 작업을 시작하지 않는다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-11 | repo 분석, WorkProfile, 공통 kernel/adapter, 측정·rollout 초안 |
| v1.1 | 2026-08-12 | profile phase 충돌, 기존 core 재사용, 계측 가능성, privacy/evidence, Codex 선행 spike를 반영해 재작성 |
| v1.2 | 2026-08-12 | 대표 확정 정책: 실행 예고 후 자동 진행, 고위험 보안 대화, 전체 실행 Audit Ledger, 위험 기반 검증 |
