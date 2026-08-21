---
owner: cto
artifact: gate-1-claude-review
phase: plan
feature: adaptive-workflow-kernel
summary: "Claude 독립 검토용 Phase 0A/0B 계약·label·baseline 검토 패킷"
---

# Gate 1 Claude Review Packet

## 1. 검토 목적

Codex가 작성한 Phase 0A 정책 계약과 Phase 0B 평가 기준이 classifier/compiler 구현 전에 충분히 보수적이고 재현 가능한지 독립 검토한다. 구현자를 신뢰하지 말고 repository와 명령 결과로 claim을 확인한다.

권장 판정은 다음 중 하나다.

- `승인`: Phase 1 shadow classifier 진행 가능
- `수정 후 승인`: 지적 항목 수정과 재검증 후 진행
- `중단`: 정책 또는 평가 기반이 구조적으로 불충분

## 2. 검토 대상

필수:

- `docs/adaptive-workflow-kernel/01-plan/phase-0a-contracts.md`
- `docs/adaptive-workflow-kernel/01-plan/phase-0b-evaluation.md`
- `schemas/execution-preview.schema.json`
- `schemas/task-envelope.schema.json`
- `schemas/audit-event.schema.json`
- `schemas/evaluation-corpus.schema.json`
- `schemas/critical-risk-corpus.schema.json`
- `schemas/legacy-baseline.schema.json`
- `tests/fixtures/workflow-classification-corpus.json`
- `tests/fixtures/critical-risk-corpus.json`
- `tests/fixtures/legacy-baseline.json`
- `lib/evaluation/corpus.js`
- `lib/evaluation/legacy-baseline.js`
- `scripts/workflow-evaluation.js`
- `tests/phase-0b-evaluation.test.js`

참조:

- `docs/adaptive-workflow-kernel/01-plan/development-plan.md`
- `contracts/workflow-contract.md`

## 3. 확인 질문

1. 45개 사례의 `patch / feature / initiative` label 중 과소·과대 분류가 있는가?
2. 규모와 무관하게 assurance가 high/regulated로 올라가야 하는 사례가 normal로 남아 있는가?
3. auth, payment, PII, migration, destructive, regulated, external write, dependency, infrastructure 외에 deterministic critical category가 필요한가?
4. profile별 phase graph가 실제 작업에 충분하며 `not-required`가 안전한가?
5. expected check가 위험을 검증하기에 부족하거나 불필요하게 무거운 사례가 있는가?
6. repository inventory baseline이 이후 비교에 쓸 수 있을 만큼 명확한가? actual처럼 오해될 필드가 있는가?
7. live Claude host 6회 측정을 Phase 1 전에 blocker로 둘 것인가, shadow rollout 중 수집해도 되는가?
8. raw prompt/secret/PII가 fixture나 snapshot에 남아 있는가?
9. validator가 잘못된 corpus를 통과시킬 수 있는 경로가 있는가?
10. Phase 1 held-out 평가를 위해 corpus를 train/review/held-out으로 어떻게 나누는 것이 좋은가?

## 4. 재현 명령

```bash
npm run workflow:evaluate
node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js
npm test
npm run lint
node scripts/vais-validate-plugin.js
git diff --check
```

## 5. 현재 자체 검증 결과

- classification: 45, profile별 15
- assurance: normal 16, high 22, regulated 7
- critical risk: 18, 9 category 모두 포함
- Phase 0B 집중 테스트: 13 pass, 0 fail
- 전체 테스트: 369 total, 366 pass, 0 fail, 3 skip
- corpus/legacy JSON Schema compile: pass
- lint: pass
- plugin validator: 오류 0, 경고 0
- `git diff --check`: pass
- actual/host token과 elapsed: unavailable 사유 기록
- label reviewer: 45건 모두 `pending-external`
- live legacy E2E: 0/6
- doc validator: scope/frontmatter 경고 0, 아직 시작하지 않은 design/do/qa/report 4개 phase는 미생성

## 6. 요청 출력 형식

```markdown
## 판정
승인 | 수정 후 승인 | 중단

## Critical/Major Findings
- [severity] file:line - 문제, 영향, 권장 수정

## Label Corrections
| id | current | proposed | rationale |

## Missing Risk Cases
| category | example | minimum assurance | required checks |

## Baseline Assessment
- 사용 가능 범위
- 오해 가능 필드
- live host run의 blocker 여부

## Verified Commands
| command | result |

## Residual Risks
- ...
```
