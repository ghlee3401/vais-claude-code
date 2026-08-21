---
owner: cto
artifact: gate-1-claude-rereview
phase: plan
feature: adaptive-workflow-kernel
source: gate-1-remediation.md
summary: "Gate 1 보완분에 대한 Claude 독립 재검토 입력 패킷"
---

# Gate 1 Claude Re-review

## 1. 요청

`gate-1-claude-review-result.md`의 **수정 후 승인** 조건이 충족됐는지 독립적으로 재검토한다. 이전 설명을 신뢰하지 말고 fixture, validator, schema, tests를 직접 읽고 malformed probe를 재실행한다.

Phase 1 production 동작은 아직 없으며, 이번 판정 대상은 Phase 1 shadow classifier/compiler 착수 가능 여부다.

## 2. 필수 입력

1. `docs/adaptive-workflow-kernel/01-plan/gate-1-claude-review-result.md`
2. `docs/adaptive-workflow-kernel/01-plan/gate-1-remediation.md`
3. `docs/adaptive-workflow-kernel/01-plan/phase-0a-contracts.md`
4. `docs/adaptive-workflow-kernel/01-plan/phase-0b-evaluation.md`
5. `contracts/workflow-taxonomy.json`
6. `lib/evaluation/corpus.js`
7. `lib/evaluation/legacy-baseline.js`
8. `lib/observability/audit-integrity.js`
9. `schemas/evaluation-corpus.schema.json`
10. `schemas/critical-risk-corpus.schema.json`
11. `schemas/legacy-baseline.schema.json`
12. `tests/fixtures/workflow-classification-corpus.json`
13. `tests/fixtures/critical-risk-corpus.json`
14. `tests/fixtures/legacy-baseline.json`
15. `tests/fixtures/adaptive-workflow-contracts.json`
16. `tests/phase-0b-evaluation.test.js`
17. `tests/adaptive-workflow-contracts.test.js`

## 3. 반드시 확인할 질문

1. case별 `expectedCompiledPhaseGraph`가 compile signal로부터 결정론적으로 재계산되는가?
2. trigger/check taxonomy가 네 schema와 두 runtime validator 사이에서 drift하지 않는가?
3. 1차 검토의 malformed corpus가 runtime과 Ajv에서 거부되는가?
4. critical-risk 13 category가 각 2건이며 보안 대화를 우회할 수 없는가?
5. audit event hash가 canonical content에서 재계산되고 본문 변조를 잡는가?
6. `working-tree-manifest + scopeFiles + scopeDigest`를 Gate 1 재현성 근거로 임시 승인할 수 있는가, 아니면 clean commit snapshot이 Phase 1 전 필수인가?
7. live captured metric과 같은 runId의 quality 결과를 저장할 수 있고 captured count가 실제 live sample 수와 일치하는가?
8. live host 0/6을 Phase 1 shadow에는 허용하되 Phase 2 adaptive enforce hard blocker로 둔 결정이 타당한가?
9. 한국어 10건, unknown/adversarial/patch-regulated 보완으로 Phase 1 착수는 가능한가? 실제 요청 replay와 90+ 확장을 Phase 1 acceptance 조건으로 미뤄도 되는가?
10. Phase 1 shadow classifier/compiler 착수를 승인할 수 있는가?

## 4. 재현 명령

```bash
npm run workflow:evaluate
node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js
npm test
npm run lint
node scripts/vais-validate-plugin.js
git diff --check
git status --short
```

추가로 1차 검토에서 사용한 malformed corpus probe를 다시 실행한다. 테스트가 이미 다루는 변형만 확인하지 말고 새로운 우회 3건 이상을 시도한다.

## 5. 출력 형식

결과는 `docs/adaptive-workflow-kernel/01-plan/gate-1-claude-rereview-result.md`에 다음 순서로 기록한다.

1. 판정: `승인` / `수정 후 승인` / `중단`
2. Critical/Major findings
3. 1차 finding 11건의 해결 여부 표
4. label correction 또는 missing risk case
5. baseline과 clean commit 판단
6. live 6회 blocker 판단
7. 실행한 명령과 결과
8. Phase 1 착수 전 남은 최소 항목

승인 전 corpus의 `review.status`는 변경하지 않는다.

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-20 | Gate 1 보완분 독립 재검토 패킷 작성 |
