---
owner: cto
artifact: gate-1-claude-rereview-result
phase: plan
feature: adaptive-workflow-kernel
agent: claude
generated: 2026-08-20
source: gate-1-claude-rereview.md
summary: "Gate 1 보완분 독립 재검토 결과 — 판정: 승인 (Phase 1 shadow 착수 가능)"
---

# Gate 1 Claude Re-review Result

> 검토자: Claude (claude-fable-5) · 검토일: 2026-08-20 · 입력 패킷: `gate-1-claude-rereview.md`
> 필수 입력 17개 파일 전부 직접 읽고, 재현 명령 7종을 실행했으며, 1차 malformed probe 14종 재실행 + **신규 우회 probe 12종**을 추가로 시도했다. `expectedCompiledPhaseGraph` 49건 전부와 held-out hash, audit hash 3건, baseline manifest 32개 파일 SHA-256을 Codex 코드와 독립적으로 재계산해 대조했다.

## 1. 판정

**승인** — Phase 1 shadow classifier/compiler 착수 가능.

1차 최소 수정 항목 5개 중 4개(①compile 결과 재기록 ②taxonomy enum 고정 ③validator 정합+Ajv 테스트 ⑤판정표 정정)는 완전 해결을 검증했다. ④(clean commit baseline)는 working-tree manifest로 대체됐으며, manifest의 32개 파일 hash가 현재 디스크와 전부 일치하고 `scopeDigest`가 재생성 시 byte 단위로 재현됨을 확인해 **Gate 1 재현성 근거로 임시 승인**한다. 단, Phase 0 산출물 커밋 직후 clean commit에서 baseline을 1회 재생성하는 조건이 붙는다(§5). 아래 findings는 전부 non-blocking이다.

## 2. Critical/Major Findings

Critical: **0건**. Major: **0건**. Minor/주의 4건:

- **[Minor]** held-out 편집 + hash 동시 재계산은 runtime validator와 schema를 통과한다 (신규 probe N1). held-out case 1건을 train으로 옮기고 `splitPolicy.heldOutIdsHash`를 함께 재계산하면 `npm run workflow:evaluate` CLI 게이트는 통과한다. 실제 방어선은 `tests/phase-0b-evaluation.test.js:58-61`에 **박제된 literal hash 상수**(`10fff5bd…`)와 `bySplit 27/9/13` 고정 assert이며, `npm test`가 잡는 것을 확인했다. 재현 명령 세트에 테스트가 포함되므로 수용 가능하나, held-out 불변성의 정본 anchor가 테스트 파일 상수 하나에 있다는 점은 인지할 것. **권장**: 본 문서(외부 anchor)에 hash를 기록하고(아래 §5에 기록함), classifier 코드가 생기기 전 커밋에 포함.
- **[Minor]** schema 단독으로는 못 잡는 우회 4종 존재, runtime validator가 전부 거부 (probe N5/N7/N9/N11): approved-without-reviewer, rationale/review 필드에 secret 은닉(schema pattern은 summary만 검사), 중복 id, category swap(총량 유지). CLI가 항상 runtime validator를 거치므로 실질 위험 없음. **권장**: schema 파일만으로 corpus를 게이트하지 말 것(현 구조 유지 시 문제 없음).
- **[Minor]** elevated assurance 10건에 security/compliance kind check가 없음 — p-08, p-10, p-12, f-01, f-07, f-09, f-12, f-14, i-06, i-12. 특히 f-01/f-12/f-14는 1차 검토로 assurance가 상향됐지만 checks가 함께 상향되지 않았다(f-01 pii인데 `unit-test,integration-test`뿐, f-14 pii인데 `event-contract-test,analytics-test`뿐). trigger↔check 정합은 validator가 강제하지 않는다. → §4 correction 표.
- **[Minor]** f-04 rationale이 구 summary의 잔재 — summary는 "기존 notification queue 재사용 주간 요약"으로 교체됐는데 rationale은 `"one external read integration"`으로 남아 있다.

audit chain 잔여 특성 (finding 아님, 계약이 이미 커버): tail truncation은 chain 검증만으로는 통과하고(마지막 event 이후 제거), 전체 re-seal 공격도 chain 자체로는 탐지 불가 — 이는 hash chain의 본질적 한계로, `phase-0a-contracts.md` §6의 Stop-시 expected/observed reconciliation과 `lastSequence` envelope 필드가 이를 보완하도록 설계돼 있음을 확인했다. Phase 2 구현 시 reconciliation이 실제로 tail 누락을 잡는지 테스트할 것.

## 3. 1차 Finding 11건 해결 여부

| # | 1차 finding | 판정 | 독립 검증 근거 |
|---:|---|---|---|
| 1 | feature phaseGraph가 profile 템플릿 복사 (Critical) | **해결** | 49건 전부 `compileSignals`→`compileExpectedPhaseGraph()` 독립 재계산 mismatch 0. feature에 design=required 9건/conditional 6건 공존. schema `allOf` 10개 conditional이 동일 규칙 고정 |
| 2 | trigger/check 자유 문자열 (Critical) | **해결** | `contracts/workflow-taxonomy.json` 정본 (trigger 15/category 13/check 58). 테스트가 4개 schema enum과 deepEqual 강제. 0A preview fixture도 canonical(`auth` 등)로 교체 확인 |
| 3 | malformed corpus가 validator/schema 통과 (Major) | **해결** | 1차 probe 14종 전부 runtime+Ajv 양쪽 거부 (A,B,C,D,E,G,I,J,K,L,M,N,O,P 모두 OK) |
| 4 | dirty snapshot의 headSha 오해 (Major) | **부분 해결→임시 승인** | `captureMode=working-tree-manifest`+`dirty=true` 정직 표기, false-clean 위장 거부 테스트 확인. 32개 scopeFiles SHA-256 디스크 일치, scopeDigest 재생성 일치. clean commit snapshot은 미생성 → §5 조건 |
| 5 | captured metric 저장 불가 (Major) | **해결** | `unavailable\|captured{value,unit,capturedAt}` 지원, live-host sample은 hostApprovals/elapsed/quality captured 강제, `liveHostRuns.captured`↔실제 live sample 수 교차 검증 (mismatch 거부 테스트 통과 확인) |
| 6 | quality-cost runId 연결 누락 + "6 sample" 과장 (Major) | **부분 해결(정직 기록)** | sample 내 `quality` 필드 신설, 판정표에 "미충족" 명시 복원, "3 scenario × 2 동일 inventory"로 정정. live 결과는 0건 — Phase 2 blocker로 이월 (타당) |
| 7 | inventory 선정 규칙 hand-picked (Major) | **해결** | `declared-entrypoint-and-mandatory-reference-v1` 명문화 + validator가 규칙 id 강제. shared guard 6종/config/output-style/ui-designer/infra-architect 포함 확인 (patch 68,653→140,612B로 정정) |
| 8 | authorization/secret/untrusted-input/agent-capability 누락 (Major) | **해결** | 13 category × 2 = 26건, 전부 held-out + dialogue required. category↔trigger↔minimumAssurance 정합 validator+schema 양쪽 강제 |
| 9 | p-10 index DDL vs DB 승격 정책 충돌 (Major) | **해결** | 정책을 "data model/schema shape 변화"로 한정, reversible index-only DDL patch 허용 명문화 (`phase-0a-contracts.md:46`) |
| 10 | corpus 현실성 부족 (Major) | **부분 해결(착수 충분)** | 한국어 10건, unknown 1건(i-16), adversarial normal 2건(p-17/p-18), patch×regulated 1건(p-16), p-05 label 누설 제거. 실요청 replay 0건·90+ 확장은 Phase 1 acceptance로 이월 — 수용 (§8) |
| 11 | audit hash placeholder (Major) | **해결** | canonical form(§6 5단계) 명문화, fixture hash 3건 내용 기반 재계산 전부 일치, 본문/timestamp 변조·중간 event 제거·link 유지 변조 전부 거부 확인 |

## 4. Label Correction / Missing Risk Case

구조 오류는 없으며 외부 label 승인 전 반영 권장 항목만 남는다 (`review.status`는 지시대로 변경하지 않음):

| id | 항목 | 권장 |
|---|---|---|
| f-01 | high/[pii]인데 checks에 pii 관련 검사 없음 | `pii-scan` 또는 `privacy-review` 추가 |
| f-14 | high/[pii]인데 checks가 contract/analytics뿐 | `pii-scan` 추가 |
| f-12 | high/[authorization,infrastructure]인데 checks가 `unit-test,rollback-test` | `authorization-test` 추가 |
| p-08, p-12, f-07 | payment/external-write high인데 security kind check 없음 | 각각 `security-review` 1건 추가 검토 |
| f-04 | rationale이 구 summary("external read integration")의 잔재 | rationale을 신규 summary에 맞게 교체 |
| i-16 | unknown 추천 표본이 1건뿐 | Phase 1 acceptance 확장 시 unknown ≥5건 (모호 요청 다양화) |

Missing risk case: **없음** — 1차 제안 4개 category(authorization/secret/untrusted-input/agent-capability)와 patch×regulated, adversarial, unknown이 모두 반영됨을 확인.

## 5. Baseline과 Clean Commit 판단

**working-tree manifest를 Gate 1 재현성 근거로 임시 승인한다.** 근거:

- 32개 scopeFiles의 SHA-256을 디스크와 독립 대조 → 32/32 일치
- `npm run workflow:baseline` 재실행 → `scopeDigest` 및 3 scenario byte 완전 재현 (140,612 / 140,612 / 167,697 ctx bytes)
- `captureMode=clean-commit` 위장 시 runtime+schema 양쪽 거부 확인
- baseline의 용도는 상대 비교 하한이며, manifest는 그 목적에 충분한 고정력을 제공

**조건**: Phase 0 산출물이 커밋되는 즉시(자연히 clean 상태가 됨) `node scripts/workflow-evaluation.js baseline --output tests/fixtures/legacy-baseline.json`을 1회 재실행해 `captureMode=clean-commit` snapshot으로 교체한다. 이 1-command 작업은 Phase 1 classifier **코딩 착수를 막지 않으나**, Phase 2에서 adaptive와의 비용 비교에 사용하기 전에는 완료돼 있어야 한다.

**held-out anchor 기록** (외부 anchor 목적, §2 첫 항목): held-out 13건 = `p-13, p-14, p-15, p-16, p-17, p-18, f-13, f-14, f-15, i-13, i-14, i-15, i-16`, SHA-256 = `10fff5bd0fe1fcecb44d5a4d6ed8a2fb159d484188604f6f44bf3739b9d1e9eb`. critical-risk 26건은 전부 held-out.

## 6. Live Host 6회 Blocker 판단

**Phase 1 shadow 진입 non-blocker, Phase 2 adaptive enforce hard blocker — 타당하며 유지한다.** 1차 판정과 동일하고, 이제 전제 조건이 충족됐다: schema가 captured 값을 저장할 수 있고(§3 #5), captured count와 실제 live sample 수를 교차 검증하며, live sample은 quality를 같은 runId에 강제한다. shadow rollout 중 legacy가 실제 실행되므로 그때 수집하는 것이 가장 자연스럽다. provider/host token을 끝내 얻지 못하면 A/B는 unavailable 유지 + elapsed/approval/quality 필수 수집 — `phase-0b-evaluation.md` §6에 동일하게 명문화됨을 확인.

## 7. 실행한 명령과 결과

| command | result |
|---|---|
| `npm run workflow:evaluate` | exit 0 — classification 49 valid (18/15/16, split 27/9/13, pending-external 49), critical-risk 26 valid (13 category × 2) |
| `node --test tests/adaptive-workflow-contracts.test.js tests/phase-0b-evaluation.test.js` | 30 pass / 0 fail |
| `npm test` | 379 tests, 376 pass, 0 fail, 3 skip |
| `npm run lint` | pass (max-warnings=0) |
| `node scripts/vais-validate-plugin.js` | 오류 0 / 경고 0 / 정보 17 |
| `git diff --check` | pass |
| `git status --short` | 193 entries — working tree dirty 유지 (manifest 표기와 일치) |
| 1차 malformed probe 14종 재실행 (추가) | 14/14 runtime+Ajv 양쪽 거부 |
| 신규 우회 probe 12종 (추가) | N2,N3,N4,N6,N8,N10 양쪽 거부 · N5,N7,N7b,N9,N11 schema만 통과·runtime 거부 · N1은 테스트 pinned hash가 최종 방어 (§2) |
| `expectedCompiledPhaseGraph` 49건 독립 재계산 (추가) | mismatch 0 |
| held-out hash 독립 재계산 (추가) | fixture 값과 MATCH |
| audit hash 3건 내용 기반 재계산 + 변조 4종 (추가) | 3/3 일치, timestamp/본문/중간 제거/link 유지 변조 전부 거부 |
| baseline 재생성 + manifest 32 파일 SHA-256 대조 (추가) | scopeDigest MATCH, byte diff 0, 32/32 일치 |
| Ajv fixture↔schema 3쌍 (추가) | 3쌍 모두 VALID |
| `node scripts/doc-validator.js docs/adaptive-workflow-kernel` (추가) | passed, 경고 0 |

## 8. Phase 1 착수 전/중 남은 최소 항목

**착수 전 (즉시, 코딩 시작과 병행 가능):**

1. §4 label correction 반영 (f-01/f-12/f-14 check 추가, f-04 rationale 교체) — 외부 label 승인과 함께 처리
2. Phase 0 산출물 커밋 → clean commit에서 baseline 1회 재생성 (§5 조건)

**Phase 1 acceptance 전 (완료 기준에 이미 포함, 재확인):**

3. corpus 90+ 확장 — 실요청 redacted replay ≥10건, unknown ≥5건 포함, 신규 case는 held-out 우선 배정
4. held-out macro F1 0.85 + critical-risk 26건 unsafe miss 0건 + shadow 실요청 20건 검토
5. live legacy E2E 6회를 shadow 기간 중 같은 runId로 수집 (Phase 2 enforce hard gate)

**Phase 2 이월 (1차 Residual Risks 유지):**

6. report `not-required` vs evidence view 상태 구분 (`derived` 등)
7. audit reconciliation이 tail 누락을 실제로 잡는지 구현 테스트
8. `dependency` trigger 범위 조정(일상 bump 과잉 보안 대화) — shadow 데이터로 판단

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-08-20 | Gate 1 보완분 독립 재검토 — 판정 "승인", Phase 1 shadow 착수 허용 |
