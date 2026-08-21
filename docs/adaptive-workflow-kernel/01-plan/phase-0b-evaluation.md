---
owner: cto
artifact: phase-0b-evaluation
phase: plan
feature: adaptive-workflow-kernel
summary: "Phase 0B 분류 corpus, critical-risk corpus, legacy repository baseline 및 측정 한계"
---

# Phase 0B Evaluation

## 1. 목적과 실행 경계

Phase 0B는 adaptive workflow가 기존 VAIS보다 비용을 줄이면서 품질을 유지하는지 비교할 기준을 만든다. production workflow, hook, state machine, `/vais` routing은 변경하지 않는다.

추가된 평가 surface:

- `contracts/workflow-taxonomy.json`
- `tests/fixtures/workflow-classification-corpus.json`
- `tests/fixtures/critical-risk-corpus.json`
- `tests/fixtures/legacy-baseline.json`
- `lib/evaluation/corpus.js`
- `lib/evaluation/legacy-baseline.js`
- `schemas/evaluation-corpus.schema.json`
- `schemas/critical-risk-corpus.schema.json`
- `schemas/legacy-baseline.schema.json`
- `scripts/workflow-evaluation.js`
- `tests/phase-0b-evaluation.test.js`

## 2. Classification Corpus

| 항목 | 결과 |
|---|---:|
| 전체 사례 | 49 |
| patch | 18 |
| feature | 15 |
| initiative | 16 |
| normal | 15 |
| high | 26 |
| regulated | 8 |
| train / review / held-out | 27 / 9 / 13 |
| 한국어 요청체 | 10 |
| unknown 추천 | 1 |
| adversarial normal | 2 |
| patch x regulated | 1 |
| raw prompt 저장 | 0 |
| 외부 reviewer 승인 | 0/49, Gate 1 재검토 대기 |

각 사례는 redacted summary, profile recommendation, 최종 profile, assurance, canonical risk trigger, rationale, compile signal, expected compiled phase graph, canonical required check, split, review 상태를 가진다. profile과 assurance는 독립 label이다.

`expectedCompiledPhaseGraph`는 profile 기본 템플릿 복사본이 아니다. UI flow, API contract, data model, architecture, external integration, CEO 분석 유무 등 case별 `compileSignals`에서 다시 계산할 수 있다. held-out 13개 ID는 classifier 구현 전에 SHA-256 `10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb`으로 고정했다.

한국어 10건은 실제 요청 형태에 가까운 재구성 표본이다. 보존된 실제 사용자 원문을 replay한 사례는 아직 없으므로 실제 요청 일반화 근거로 과장하지 않는다.

## 3. Critical-Risk Corpus

26개 사례가 다음 13개 deterministic category를 각각 2개씩 포함한다.

- `auth`
- `authorization`
- `payment`
- `pii`
- `migration`
- `destructive`
- `regulated`
- `external-write`
- `secret`
- `dependency`
- `infrastructure`
- `untrusted-input`
- `agent-capability`

모든 사례는 held-out이며 최소 high/regulated, category와 일치하는 trigger, canonical check, `requiresSecurityDialogue=true`를 요구한다. trigger와 check의 정본은 `contracts/workflow-taxonomy.json`이다.

## 4. Legacy Baseline

현재 실행 host에는 Claude Code provider usage와 workflow approval stream이 없고, 기존 `.vais/event-log.jsonl`도 scenario별 start/stop/token을 연결하지 않는다. 따라서 actual token, host approval, workflow elapsed, quality 결과를 추정치로 채우지 않았다.

| 시나리오 | 고유 context inventory | template inventory | agent proxy | repository replay | live host |
|---|---:|---:|---:|---:|---:|
| patch / normal | 140,612 bytes | 23,106 bytes | 7 | 2회, 동일 inventory | 0/2 |
| feature / normal | 140,612 bytes | 27,456 bytes | 7 | 2회, 동일 inventory | 0/2 |
| feature / high | 167,697 bytes | 33,579 bytes | 11 | 2회, 동일 inventory | 0/2 |

선정 규칙 `declared-entrypoint-and-mandatory-reference-v1`은 다음 범위를 legacy와 adaptive 비교에 동일 적용한다.

- 포함: host entrypoint, 선택 phase router/C-Level, mandatory shared guard, config/output style, 위임 agent, phase template
- 제외: 해당 scenario에서 활성화되지 않은 lazy knowledge, 무관한 C-Level/agent, 과거 feature 문서, 생성 artifact 본문

측정 등급:

- A: provider actual usage
- B: host event/session usage
- C: repository 또는 transcript proxy

현재 snapshot은 dirty working tree를 clean commit으로 위장하지 않는다. `captureMode=working-tree-manifest`, `dirty=true`, 측정 파일별 SHA-256과 전체 `scopeDigest`를 저장한다. 이 manifest는 현재 상태의 재현 근거지만, Claude가 요청한 clean commit 기준선은 아직 아니다.

schema는 observed metric을 `unavailable | captured`로 표현하며, live sample의 host approval과 elapsed 및 quality 결과는 같은 `runId` sample에 저장한다. runtime validator는 `liveHostRuns.captured`와 실제 `live-host` sample 수를 대조한다.

## 5. 재현 명령

```bash
npm run workflow:evaluate
node scripts/workflow-evaluation.js baseline --output tests/fixtures/legacy-baseline.json
node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js
npm test
npm run lint
node scripts/vais-validate-plugin.js
```

## 6. Phase 0B 판정

| 완료 조건 | 상태 | 근거 |
|---|---|---|
| profile별 15개 이상 fixture | 통과 | 18 / 15 / 16, 총 49 |
| case별 label·compile 근거 | 통과 | rationale + compileSignals + expectedCompiledPhaseGraph + checks |
| 외부 reviewer 기록 | 재검토 대기 | 1차 판정 `수정 후 승인`, label은 `pending-external` 유지 |
| critical-risk coverage | 통과 | 13 category x 2 = 26, 전부 held-out |
| taxonomy·validator·schema 정합 | 통과 | canonical enum + runtime/Ajv + malformed negative probes |
| proxy metric 100% | 통과 | 3 scenario x 2 반복이며 각 쌍의 inventory 값은 동일 |
| actual token 지원 여부와 누락 이유 | 통과 | A/B `unavailable.reason` 명시 |
| baseline quality와 cost가 같은 runId로 연결 | 미충족 | 저장 형식과 회귀 테스트만 준비, live 결과 없음 |
| clean commit 기준선 | 미충족 | 현재는 exact working-tree manifest |
| live legacy E2E 3종 x 2회 | 미실행 | Claude Code host에서 0/6 |

Phase 0B는 **Gate 1 재검토 대기**다. clean commit 요구에 working-tree manifest가 충분한지 Claude에게 다시 판정받고, 불충분하면 사용자 승인 후 commit에서 snapshot을 재생성한다.

live host 6회는 Phase 1 shadow 진입의 blocker가 아니다. shadow 중 legacy 실행과 같은 `runId`로 수집하며, **Phase 2에서 adaptive 실행을 enforce하기 전 hard blocker**다. provider/host token을 끝내 얻지 못하면 해당 A/B metric은 unavailable로 유지하되, elapsed, approval count, quality는 반드시 수집한다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-13 | corpus 45+18, repository baseline 6 sample, 측정 정확도와 외부 검토 상태 기록 |
| v1.1 | 2026-08-20 | Gate 1 수정 반영: case별 compile, taxonomy, 49+26 corpus, held-out hash, manifest baseline, captured/live schema, 미충족 gate 명시 |
