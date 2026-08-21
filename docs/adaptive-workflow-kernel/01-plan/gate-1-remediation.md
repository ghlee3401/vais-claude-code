---
owner: cto
artifact: gate-1-remediation
phase: plan
feature: adaptive-workflow-kernel
source: gate-1-claude-review-result.md
summary: "Claude Gate 1 수정 후 승인 판정에 대한 코드·schema·corpus·baseline 보완 기록"
---

# Gate 1 Remediation

## 1. 현재 판정

1차 Claude 판정은 **수정 후 승인**이다. 아래 보완은 production runtime을 바꾸지 않고 Phase 0A/0B 계약과 평가 기반만 수정했다. Phase 1 classifier/compiler 구현은 시작하지 않았다.

## 2. Finding 대응

| # | 1차 finding | 상태 | 반영 근거 |
|---:|---|---|---|
| 1 | feature phase graph가 profile 템플릿 복사 | 해결 | 49건에 `compileSignals`와 `expectedCompiledPhaseGraph` 추가, `compileExpectedPhaseGraph()`와 schema conditional로 재계산 |
| 2 | trigger/check 자유 문자열 | 해결 | `contracts/workflow-taxonomy.json` 단일 정본, Phase 0A schema 2종과 corpus schema 2종 enum 일치 테스트 |
| 3 | malformed corpus가 validator/schema 통과 | 해결 | phase graph, promotion, assurance-trigger, category-trigger, category당 2건, secret/PII 규칙 및 runtime/Ajv negative probe |
| 4 | dirty snapshot을 head SHA로 재현 가능하게 표현 | 부분 해결 | `working-tree-manifest`와 파일별 SHA-256/`scopeDigest` 추가, false clean claim 거부. clean commit snapshot은 미생성 |
| 5 | live metric을 captured로 기록 불가 | 해결 | observed metric `oneOf[unavailable,captured]`, live quality/check 결과, 단위·시간, captured sample 수 교차 검증 |
| 6 | quality-cost 동일 runId 누락, 6회 과장 | 부분 해결 | sample 안에 quality와 metrics를 함께 저장. repository replay는 3 scenario x 2 동일 inventory로 정정. 실제 live quality-cost는 0/6 |
| 7 | baseline inventory 선정 규칙이 hand-picked | 해결 | `declared-entrypoint-and-mandatory-reference-v1` 명문화, shared/config/output style/design execution agent 포함 |
| 8 | authorization/secret/untrusted input/agent capability 누락 | 해결 | 13개 critical category x 2건, 전부 held-out 및 security dialogue required |
| 9 | p-10 index DDL과 DB 승격 정책 충돌 | 해결 | 승격 조건을 data model/schema shape 변화로 한정, reversible index-only DDL patch 허용 |
| 10 | corpus 현실성 부족 | 부분 해결 | 한국어 요청체 10건, unknown 1건, adversarial normal 2건, patch-regulated 1건. 보존된 실제 요청 원문 replay는 아직 0건 |
| 11 | audit hash가 placeholder이고 재계산 없음 | 해결 | canonical JSON 규칙, SHA-256 seal/validate, 실제 fixture hash, 본문 변조 거부 테스트 |

## 3. Label 및 split 보완

- classification: 49건, patch 18 / feature 15 / initiative 16
- assurance: normal 15 / high 26 / regulated 8
- split: train 27 / review 9 / held-out 13
- held-out ID SHA-256: `10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb`
- critical-risk: 26건, 13 category x 2, 100% held-out
- f-01/f-12/f-14, i-01/i-08, trigger 동의어, p-05, i-14 check 보완을 1차 제안대로 반영
- 모든 label review 상태는 재검토 승인 전까지 `pending-external` 유지

## 4. Baseline 해석

repository replay는 독립적인 실제 실행 6건이 아니다. 세 scenario의 고유 파일 inventory를 각 2회 다시 계산한 값이며 각 반복의 bytes는 동일하다.

현재 snapshot은 다음을 보장한다.

- 측정 대상 파일 목록과 파일별 SHA-256
- 전체 scope digest
- dirty 여부와 capture mode의 일치
- A/B/C metric source 분리
- unavailable reason 강제
- live-host captured metric과 quality 저장 가능
- `liveHostRuns.captured`와 실제 live sample 수 일치

현재 snapshot이 보장하지 않는 것:

- clean commit 하나로 전체 상태 복원
- provider actual token
- 실제 host approval과 elapsed
- 실행된 quality command 결과
- 실제 요청 replay의 품질

## 5. 남은 Gate

| 항목 | 현재 | 차단 범위 |
|---|---|---|
| Claude 재검토 | 대기 | Phase 1 시작 |
| clean commit baseline | 대기 | Claude가 manifest 대체를 불승인하면 Phase 1 시작 |
| classification 외부 승인 | 0/49 | classifier 평가 정본 확정 |
| live legacy E2E | 0/6 | Phase 1 shadow 진입은 허용, Phase 2 adaptive enforce는 차단 |
| 실제 요청 redacted replay | 0 | Phase 1 acceptance 전 90+ corpus 확장에 포함 |

## 6. 검증 명령

```bash
npm run workflow:evaluate
node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js
npm test
npm run lint
node scripts/vais-validate-plugin.js
git diff --check
```

| 검증 | 결과 |
|---|---|
| Phase 0B evaluation | classification 49건, critical-risk 26건 유효 |
| focused test | 30 passed, 0 failed |
| full test | 379 tests, 376 passed, 3 skipped, 0 failed |
| ESLint | 0 errors, 0 warnings |
| plugin validator | 0 errors, 0 warnings, 17 info |
| diff whitespace check | 통과 |

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-20 | Gate 1 finding별 보완 및 잔여 blocker 기록 |
| v1.1 | 2026-08-20 | 최종 검증 결과 기록 |
