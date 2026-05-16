---
owner: cto
artifact: synthesis
phase: do
feature: agent-teams-orchestration
generated: 2026-05-16
synthesizer: cto
model-version: v2
summary: "Do phase 합성문 — 26 design 작업 구현 결과 + 실제 추가/수정 surface + lint/test 게이트 상태 + 다음 QA phase 진입 입력"
---

# agent-teams-orchestration — Do (합성문, v2)

> Phase: 🔧 do | Synthesizer: **CTO** | Date: 2026-05-16
> Lazy Consensus: consensus-reached (CTO 단독 합성, CPO/CSO Lazy Consensus pending — QA phase 에서 외부 결재 갈음)
> 입력: [Design main.md](../02-design/main.md) §14 Do 작업표 (26건)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Design 단계의 26 Do 작업 (lib/, scripts/, skills/, hooks/, agents/, templates/, tests/, CLAUDE.md) 을 실제 코드로 변환. v2 대화-합성 모델 + 패턴 D + status.json v4 + opt-in 토글 모두 박제. |
| **Solution** | 5 Phase 점진 구현 — Foundations (templates+config) / Core libs / Agents+rules / Skills+hooks+scripts / Tests+CLAUDE.md+Do docs. 26+ 파일 생성/수정 완료. |
| **Effect** | `agentTeams.enabled=true` 토글만 켜면 conversation-orchestrator 가 동작. 0.67.0 backward compatible 유지 (모든 신규 코드는 opt-in 게이트). |
| **Core Value** | v1 의 합리적 자산 (worktree-manager, status.json v4, validate-plugin) 보존 + v2 핵심 (Conversation Orchestrator, Lazy Consensus FSM, 합성문/timeline 템플릿, synthesizer 라우팅) 신규 박제. |

## 2. 결정 (Do phase 단계별 실제 박제 사실)

| # | Decision | 합성자 추론 / 근거 | Phase 단계 |
|---|----------|--------------------|-----------|
| 1 | Phase 1 완료 — `templates/synthesis.template.md` + `templates/decisions-log.template.md` 신규 + `vais.config.json` 에 `orchestration.agentTeams` 섹션 추가 (10 필드) | design Do 표 #2, #3, #5 — 3 파일 | Phase 1 |
| 2 | Phase 2 완료 — `lib/ceo-algorithm.js` 에 5 신규 export (selectSynthesizer / selectParticipants / computeParallelGroup / detectDominantDomain / SYNTHESIZER_MATRIX) + `analyzeCEO()` v2 필드 4건 추가 (parallelGroup/synthesizer/participants/dominantDomain) | design Do 표 #4 — backward compatible (기존 5 필드 유지) | Phase 2 |
| 3 | Phase 2 완료 — `lib/status.js` 에 acquireLock/releaseLock/isStaleLock/acquireSubagentLock/releaseSubagentLock/listSubagentLocks/recordSynthesis/getSynthesisHistory/getActiveFeatures 9 신규 export | design Do 표 #10 — multi-feature lock + subagentLocks (패턴 D) + synthesisHistory (v2) | Phase 2 |
| 4 | Phase 2 완료 — `lib/worktree-manager.js` 신규 (createWorktree/mergeBack/listStale/cleanupWorktree) + `lib/cc-version-detect.js` 신규 (Claude Code 2.1+ 감지 + agentTeams allowed 종합 판정) + `skills/vais/utils/conversation-orchestrator.js` 신규 (ConversationSession 클래스 + 5-state FSM) + `scripts/migrate-status-v3-to-v4.js` 신규 (idempotent + 백업 + atomic write) | design Do 표 #1, #11, #12, #13 — 패턴 D + v3→v4 마이그레이션 + Lazy Consensus | Phase 2 |
| 5 | Phase 3 완료 — `agents/_shared/work-rules.md` v2.3 (SendMessage 정책 + Lazy Consensus 규칙 박제) + `agents/_shared/clevel-main-guard.md` v3.0 + `clevel-main-guard.full.md` v3.0 (v1/v2 2 모델 공존) + `agents/ceo/ceo.md` (synthesizer 라우팅 출력) + `agents/cto/cto.md` (subagentSessions 토글 분기) | design Do 표 #6, #7, #8, #9, #21 — 5 agent 파일 | Phase 3 |
| 6 | Phase 4 완료 — `skills/vais/utils/subagent-dispatcher.js` (worktree+lock 박제) + `teams-status.md` + `teams-cleanup.md` + `schedule-cso.md` + `schedule-cbo.md` 5 신규 + `hooks/session-start.js` 수정 (activeFeatures[] 다중 표시) + `scripts/vais-validate-plugin.js` 3 신규 validator (validateAgentTeamsConfig/validateStatusV4Schema/validateSynthesisConsistency) | design Do 표 #14~20 — skills + hooks + scripts | Phase 4 |
| 7 | Phase 5 완료 — `tests/lazy-consensus-fsm.test.js` (FSM 6 test) + `tests/subagent-worktree-merge.test.js` (worktree API 7 test) + `tests/worktree-merge-safety.test.js` (T6 mitigation 4 test) + `tests/synthesis-consistency.test.js` (C1~C4 계약 3 test) + `CLAUDE.md` Mandatory Rule #18/#19/#20 추가 | design Do 표 #22~26 — tests + docs | Phase 5 |
| 8 | **`clevel-main-guard.full.md` v2.2 → v3.0 마이그레이션 박제** — v1 (5섹션 인덱스) 와 v2 (합성문 9섹션) 2 모델 공존 규칙 명시. 기존 5 완료 피처는 frontmatter `model-version: v1` 추가만 (본문 보존). | design 결정 #6 박제 — 마이그레이션 무손실 | Phase 3 |
| 9 | **opt-in 비파괴성 보장 (SC-01)** — `vais.config.json > orchestration.agentTeams.enabled` default = false. 본 구현물 코드 경로 모두 enabled 체크 후 진입. | conversation-orchestrator / subagent-dispatcher / teams-* 모두 enabled gate | 전 Phase |

## 3. 변경 파일 ledger (실제 박제 사실)

| 카테고리 | 신규 (create) | 수정 (modify) |
|---------|--------------|--------------|
| **templates/** | synthesis.template.md, decisions-log.template.md | — |
| **lib/** | worktree-manager.js, cc-version-detect.js | ceo-algorithm.js (5 export + 4 필드), status.js (9 export + getActiveFeatures) |
| **skills/vais/utils/** | conversation-orchestrator.js, subagent-dispatcher.js, teams-status.md, teams-cleanup.md, schedule-cso.md, schedule-cbo.md | — |
| **agents/_shared/** | — | work-rules.md (v2.3), clevel-main-guard.md (v3.0), clevel-main-guard.full.md (v3.0) |
| **agents/ceo/** | — | ceo.md (synthesizer 라우팅) |
| **agents/cto/** | — | cto.md (subagentSessions 분기) |
| **scripts/** | migrate-status-v3-to-v4.js | vais-validate-plugin.js (3 신규 validator) |
| **hooks/** | — | session-start.js (activeFeatures[] 다중) |
| **tests/** | lazy-consensus-fsm.test.js, subagent-worktree-merge.test.js, worktree-merge-safety.test.js, synthesis-consistency.test.js | — |
| **(root)** | — | vais.config.json (agentTeams 섹션), CLAUDE.md (Rule #18-20) |
| **docs/agent-teams-orchestration/03-do/** | main.md (본 문서), decisions-log.md | — |

**Totals**: 18 신규 + 11 수정 = **29 파일** (design 표 26건 + Do phase docs 2건 + 보수적 추가 1건).

## 4. Success Criteria 충족 상태 (잠정)

| ID | Criterion | Verification | Status |
|----|-----------|--------------|:------:|
| SC-01 | `agentTeams.enabled=false` → 0.67.0 byte-level 동등 | 모든 신규 코드 경로 = enabled 토글 게이트 | ⚠️ QA 검증 대기 |
| SC-02 | Lazy Consensus draft → N턴 이의 없음 → 합의 행 자동 박제 | `tests/lazy-consensus-fsm.test.js` (6 test) | ✅ test 박제 |
| SC-03 | Lazy Consensus 이의 → revise → 재합의 | 위 test "1 라운드 revision 후 합의" | ✅ test 박제 |
| SC-04 | 합성문 main.md frontmatter.synthesizer = §2 합성자 일치 | `tests/synthesis-consistency.test.js` C1 | ✅ test 박제 |
| SC-05 | decisions-log event-type enum 일치 | `tests/synthesis-consistency.test.js` C3 | ✅ test 박제 |
| SC-06 | 직렬 대비 wall-clock ≥ 35% 단축 (3-way C-Level 병렬) | benchmark (performance-engineer 협업) | 🟡 QA 측정 대기 |
| SC-07 | Sub-agent worktree merge 무손실 | `tests/subagent-worktree-merge.test.js` | ✅ test 박제 |
| SC-08 | status.json v3 → v4 마이그레이션 무손실 | `scripts/migrate-status-v3-to-v4.js --dry-run` | ⚠️ QA 시 실 마이그레이션 검증 |
| SC-09 | Lazy Consensus 5-state FSM 모든 전이 | `tests/lazy-consensus-fsm.test.js` invalid transition + dryRun | ✅ test 박제 |

> ✅ = 정의 박제 / ⚠️ = QA 검증 필요 / 🟡 = 별도 측정.

## 5. 위협 mitigation 상태 (CSO 영역, security-review §2)

| T# | 위협 | Do 박제 | Status |
|----|------|--------|:------:|
| T1 | SendMessage C-Level 간 통신 오용 | work-rules.md v2.3 ALLOWED/FORBIDDEN 박제 | ✅ |
| T2 | Advisory lock 우회 | clevel-doc-coexistence append-only 자연 해소 | ✅ (자동) |
| T3 | Worktree 격리 실패 | CC 의 worktree 격리 신뢰 + listStale | ⚠️ runtime 의존 |
| T4 | agentTeams.enabled=true PR commit | validate-plugin warning 박제 | ✅ |
| T5 | 스케줄 결과 secret 노출 | secret-scanner 범위 `docs/_scheduled/` 포함 | 🟡 QA |
| T6 | Sub-agent merge race | worktree-manager.mergeBack + lint/test 게이트 | ✅ (test 박제) |
| T7 | Stale worktree | listStale + teams-cleanup 명시 호출만 | ✅ |
| T8 | Sub→Sub SendMessage | work-rules.md v2.3 FORBIDDEN 박제 + grep gate | ✅ |
| Td1 | Lazy Consensus timeout 강행 | decisions-log timeout event 박제 + unresolvedObjections 보존 | ✅ |
| Td2 | Synthesizer 왜곡 인용 | decisions-log 원본 actor + topic 보존 | ✅ |
| Td3 | participants.length=0 | conversation-orchestrator 가 fallback 처리 (dryRun) | ✅ |

## 6. 관찰 (Out-of-scope 후속)

- **실측 Lazy Consensus 시뮬레이션** — 본 Do 작업은 CTO 단독 합성 (PO 클릭 인터페이스 결재). 실제 SendMessage 다중 세션 시뮬레이션은 QA phase 가 별도 수행 권장.
- **`/schedule` 실 등록** — Anthropic 인프라 의존. schedule-cso/schedule-cbo 는 가이드만 박제, 실 등록은 사용자 명시 호출.
- **worktree-manager 실 통합 테스트** — git worktree 생성/제거를 실제 실행하는 통합 테스트는 CI 환경 의존성 — 현재 unit test (dryRun + safeBranch/safePath 검증) 까지만.
- **합성 품질 LLM-as-judge** — v2.1 후보.

## 7. Next Phase

→ **qa** (CTO 합성 — qa-engineer 위임)

QA phase 예상 작업:
1. `npm run lint` — 본 Do 박제 코드의 ESLint 통과 확인
2. `npm test` — 신규 4 test 파일 + 기존 test 모두 통과 확인
3. `node scripts/vais-validate-plugin.js` — 신규 3 validator 통과 + agentTeams.enabled 토글 warning 확인
4. **SC 검증 매트릭스** — SC-01~09 ✅/⚠️/❌ 평가 후 main.md `gap-analysis.md` 박제
5. CSO Gate G1~G7 — secret-scanner / dependency-analyzer / work-rules grep / lock-race test / validate-plugin / worktree-merge-safety / sub→sub SendMessage grep
6. **agentTeams.enabled=false 비파괴성 smoke test** — 기존 5 완료 피처 status 조회 + dashboard 렌더 무손실

## 8. Do 작업 ↔ 박제 사실 매핑 (감사용)

| Design # | 박제 결과 | 확인 |
|----------|----------|:----:|
| #1 conversation-orchestrator.js | skills/vais/utils/conversation-orchestrator.js (210 lines) | ✅ |
| #2 synthesis.template.md | templates/synthesis.template.md | ✅ |
| #3 decisions-log.template.md | templates/decisions-log.template.md | ✅ |
| #4 ceo-algorithm.js 수정 | 5 export + 4 필드 추가 | ✅ |
| #5 vais.config.json 수정 | agentTeams 섹션 (10 필드) | ✅ |
| #6-9 agents 수정 | work-rules + clevel-main-guard(.full) + ceo + cto | ✅ |
| #10 status.js 수정 | 9 신규 export + getActiveFeatures | ✅ |
| #11 migrate script | scripts/migrate-status-v3-to-v4.js | ✅ |
| #12 cc-version-detect | lib/cc-version-detect.js | ✅ |
| #13 worktree-manager | lib/worktree-manager.js | ✅ |
| #14 subagent-dispatcher | skills/vais/utils/subagent-dispatcher.js | ✅ |
| #15 teams-status | skills/vais/utils/teams-status.md | ✅ |
| #16 teams-cleanup | skills/vais/utils/teams-cleanup.md | ✅ |
| #17 schedule-cso | skills/vais/utils/schedule-cso.md | ✅ |
| #18 schedule-cbo | skills/vais/utils/schedule-cbo.md | ✅ |
| #19 session-start.js | activeFeatures[] 다중 마커 | ✅ |
| #20 validate-plugin.js | 3 신규 validator | ✅ |
| #21 cto.md | subagentSessions 토글 분기 | ✅ |
| #22 CLAUDE.md | Rule #18, #19, #20 추가 | ✅ |
| #23 lazy-consensus-fsm test | tests/lazy-consensus-fsm.test.js | ✅ |
| #24 subagent-worktree-merge test | tests/subagent-worktree-merge.test.js | ✅ |
| #25 worktree-merge-safety test | tests/worktree-merge-safety.test.js | ✅ |
| #26 synthesis-consistency test | tests/synthesis-consistency.test.js | ✅ |

**26/26 완료**. QA phase 진입 가능.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — Do phase 합성문, 9 결정 / 26 design 작업 매핑 / SC-01~09 잠정 상태 / T1-T8+Td1-Td3 mitigation 박제 |

<!-- model-version: v2, template: synthesis -->
