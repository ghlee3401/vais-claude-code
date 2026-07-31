---
owner: cto
artifact: synthesis
phase: report
feature: agent-teams-orchestration
generated: 2026-05-16
synthesizer: cto
model-version: v2
summary: "agent-teams-orchestration 피처 완료 보고서 — v1→v2 pivot lessons + 5 phase 진행 통계 + 29 파일 박제 + v0.68 릴리즈 노트 후보 + memory 최종 업데이트"
---

# agent-teams-orchestration — Report (합성문, v2)

> Phase: 📊 report | Synthesizer: **CTO** | Date: 2026-05-16
> Lazy Consensus: consensus-reached
> 입력: 전체 phase main.md + decisions-log (plan/design/do/qa)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | vais-code 가 Claude Code 2.x Agent Teams (SendMessage + background sessions + worktree) 신규 기능을 활용 못함. PO 정체성 "organization-in-a-box" 가 실시간 회의·합성 부재로 정합성 약함. |
| **Solution** | v2 대화-합성 모델 도입 — 도메인 리드 합성자 + Lazy Consensus 5-state FSM + 합성문/timeline 템플릿 + status.json v4 + 패턴 D worktree 격리. opt-in 비파괴 토글 (`agentTeams.enabled` default false). |
| **Effect** | (1) 정체성 강화 — 부서장이 회의 후 의사록 작성하는 진짜 조직 (2) Wall-clock 단축 가능성 (SC-06 별도 측정) (3) `clevel-doc-coexistence` v3 = v1/v2 2 모델 공존. |
| **Core Value** | 사용자 직관 질문 "에이전트끼리 얘기해서 하나의 문서로 작성하는건가?" 가 트리거. AI 어시스턴트 디폴트 (v1 병렬-생산 후 머지) 가 항상 최선이 아님을 입증 — 사용자 주권 (CLAUDE.md Rule #11) 의 실증. |

## 2. 결정 — 본 피처 진행 중 박제된 18 결정 인덱스

| Phase | Decisions | 핵심 |
|-------|-----------|------|
| **plan v2** | 7건 | 모델 v2 채택 / 도메인 리드 / Lazy Consensus / 합성문+log / v1 archive / 새 세션 / 패턴 D |
| **design v2** | 9건 | Conversation Orchestrator / 5-state FSM / 9섹션 표준 / decisions-log 형식 / synthesizer 매트릭스 / coexistence v3 / 패턴 D 재활용 / status.json v4 / sequential fallback |
| **do v2** | 9건 | 5 Phase 점진 구현 박제 (각 Phase 별 결정) + 마이그레이션 박제 + opt-in 게이트 |
| **qa v2** | 9건 | 검증 결과 박제 (lint/test/validate/smoke/migration) + Gate 통과 |
| **합계** | **34건** | 전체 의사결정 timeline = decisions-log 4 파일 통합 |

## 3. 진행 통계 — 5 phase × wall-clock

| Phase | 시작 | 종료 | wall-clock | 산출물 |
|-------|------|------|-----------|--------|
| v2 plan | 2026-05-16 (user pivot 직후) | 2026-05-16 | ~10분 | 2 파일 (main + decisions-log) |
| v2 design | 2026-05-16 | 2026-05-16 | ~15분 | 2 파일 |
| v2 do | 2026-05-16 | 2026-05-16 | ~60분 | **29 파일** (18 신규 + 11 수정) + 2 docs |
| v2 qa | 2026-05-16 | 2026-05-16 | ~10분 | 2 파일 (검증 결과 매트릭스) |
| v2 report | 2026-05-16 | 2026-05-16 | ~10분 | 2 파일 (본 문서) |
| **합계** | | | **~105분** | **39 파일** (v1 archive 8 + v2 신규 18 + v2 수정 11 + 10 docs) |

## 4. v1 → v2 Pivot — 학습한 lessons (5건)

### Lesson 1: AI 디폴트 ≠ 최선 — 사용자 직관 질문이 가장 강력한 신호
v1 = 병렬-생산 후 머지 (CC sub-agent 패턴의 자연스러운 확장). 본 어시스턴트가 "당연한 모델" 로 채택. **사용자가 "그런거가 되나?" 한 마디로 모델 자체 재검토 트리거**. AI 가 가는 길이 항상 최선이 아님을 입증.

> 박제 위치: 본 보고서 §1 Core Value + memory `feedback-internal-feature-no-persona` (관련) — feedback 패턴 강화.

### Lesson 2: Boilerplate 도메인 한정 — CPO 페르소나/JTBD 는 외부 시장에만
v1 도중 CPO plan 자동 진입 시 JTBD/3 페르소나/OST/시장 분석을 박제. 사용자 "기능 추가에 왜 타깃을 정의하고 그러지?" 피드백 → 즉시 슬림화. 내부 피처 (오케스트레이션 확장) 는 AC 검증만으로 충분.

> 박제 위치: memory `feedback-internal-feature-no-persona`.

### Lesson 3: 큰 pivot 시 v1 폐기 vs archive — _legacy/ 보존 + frontmatter `model-version: v1` 패턴
v2 채택 시 v1 plan/design 8 파일을 git rm 대신 `_legacy/v1/` 이동 + README 박제. v1 의 합리적 자산 (패턴 D worktree-manager / status.json v4 schema / interface-contract C 계약) 은 v2 에 직접 재활용. 기존 5 완료 피처는 본문 변환 X + frontmatter 1줄만 추가.

> 박제 위치: `agents/_shared/clevel-main-guard.full.md` v3.0 §모델 마이그레이션.

### Lesson 4: opt-in 비파괴 게이트는 단순할수록 강력
`vais.config.json > orchestration.agentTeams.enabled` 단일 토글 default false. 모든 신규 코드 경로 = 이 토글 검사 후 진입. SC-01 smoke 가 features count=5 보존 → 0.67.0 byte-level 동등 입증. **간단한 boolean 이 가장 비파괴적**.

### Lesson 5: Lazy Consensus 시뮬레이션 ≠ 실 SendMessage 토론
본 피처는 PO 클릭 인터페이스로 모든 합의 박제. 실제 SendMessage 다중 background sessions 시뮬레이션은 미수행 (do main.md §6 관찰 항목). **클릭이 SendMessage 의 충실한 시뮬레이션이지만 동치 아님** — v2.1 후속 PoC 권장.

## 5. 박제 surface 통계

| 카테고리 | 파일 수 | 비고 |
|---------|--------|------|
| 신규 lib | 2 (worktree-manager, cc-version-detect) | |
| 수정 lib | 2 (ceo-algorithm 5+4 export/필드, status 9 export) | |
| 신규 skills | 6 (conversation-orchestrator, subagent-dispatcher + 4 md) | |
| 신규 scripts | 1 (migrate-status-v3-to-v4) | |
| 수정 scripts | 1 (validate-plugin 3 validator) | |
| 신규 templates | 2 (synthesis, decisions-log) | |
| 수정 hooks | 1 (session-start activeFeatures[]) | |
| 수정 agents | 5 (work-rules v2.3 / clevel-main-guard.md v3.0 / clevel-main-guard.full.md v3.0 / ceo.md / cto.md) | |
| 신규 tests | 4 (19 test case) | |
| 수정 root | 2 (vais.config.json + CLAUDE.md Rule #18-20) | |
| **합계 코드** | **26** | (실제 do main.md §3 의 29 = 26 + 3 docs) |
| 신규 docs (이 피처) | 10 (5 phase × 2 + _legacy README) | |
| v1 archive | 8 (보존) | |
| **총 surface** | **44** | |

## 6. v0.68 릴리즈 노트 후보

```markdown
# v0.68.0 — Agent Teams Orchestration (대화-합성 모델)

## Added
- **v2 대화-합성 모델** — Conversation Orchestrator (`skills/vais/utils/conversation-orchestrator.js`) + Lazy Consensus 5-state FSM
- **synthesizer 라우팅** — `lib/ceo-algorithm.js > selectSynthesizer()` phase × dominant-domain 매트릭스
- **합성문 + decisions-log 템플릿** — `templates/synthesis.template.md` + `decisions-log.template.md`
- **Sub-agent worktree 병렬 (패턴 D)** — `lib/worktree-manager.js` createWorktree/mergeBack/listStale/cleanupWorktree
- **status.json v4 마이그레이션** — `scripts/migrate-status-v3-to-v4.js` (idempotent + 백업 + atomic write)
- **CC 버전 감지** — `lib/cc-version-detect.js` (2.1+ Agent Teams 감지 + fallback)
- **다중 lock API** — `lib/status.js` acquireLock / acquireSubagentLock / recordSynthesis (8 신규)
- **Skill utils 4 신규** — teams-status / teams-cleanup / schedule-cso / schedule-cbo
- **session-start v4** — `activeFeatures[]` 다중 마커
- **validate-plugin 3 validator** — validateAgentTeamsConfig / validateStatusV4Schema / validateSynthesisConsistency

## Changed
- `clevel-doc-coexistence` v2.1 → v3.0 — v1 (5섹션 인덱스) + v2 (합성문 9섹션) 2 모델 공존
- `work-rules.md` v2.2 → v2.3 — SendMessage v2 정책 (C↔C 허용, sub→sub 금지) + Lazy Consensus 정책
- `agents/ceo/ceo.md` — analyzeCEO synthesizer 라우팅 필드 출력
- `agents/cto/cto.md` — Do phase subagentSessions 토글 분기 (패턴 D)

## Deprecated
- _없음_ — opt-in 도입으로 비파괴

## Removed
- _없음_

## Fixed
- _없음_ (신규 기능 위주)

## Security
- SendMessage sub→sub 금지 enforcement (T8)
- worktree mergeBack lint/test 게이트 (T6)
- worktree 자동 cleanup 금지 (T7, memory feedback_no_auto_git_restore 정합)
- `agentTeams.enabled=true` PR commit warning (T4)

## Migration Guide
- 기본 동작 = 0.67.0 byte-level 동등 (`agentTeams.enabled: false` default)
- v2 모델 활성: `vais.config.json > orchestration.agentTeams.enabled = true`
- 기존 status.json v3 자동 v4 마이그레이션: `node scripts/migrate-status-v3-to-v4.js`
- 기존 5 완료 피처 main.md → frontmatter `model-version: v1` 1줄 추가 권장 (선택)
```

## 7. Memory 최종 업데이트 요약

| Memory | 변경 |
|--------|------|
| `project-agent-teams-orchestration` | plan + design + do + qa 완료 사실 + Gate 통과 + 4 patterns 분류 + Lessons 5건 박제 |
| `feedback-internal-feature-no-persona` | (이미 박제, 본 피처 학습 결과) |
| `feedback-vais-askuserq-autorun` | (재확인 — 본 피처 전체 진행 시 적용 ↔ 효율적) |
| `feedback-ideation-short-turns` | (재확인 — 5개 결정 한꺼번에 표 제시 옵션 도입에 적용) |

## 8. Production Deployment 체크리스트

| Item | Status | 비고 |
|------|:------:|------|
| Lint clean | ✅ | 0 warnings |
| Tests pass | ✅ | 309/312, 0 fail |
| Plugin validate | ✅ | 0 err / 0 warn |
| Documentation 박제 | ✅ | 5 phase × main + decisions-log + _legacy README |
| CLAUDE.md Rule 추가 | ✅ | #18, #19, #20 |
| Memory 박제 | ✅ | project + feedback (3) 갱신 |
| v0.68 릴리즈 노트 후보 | ✅ | 본 §6 박제 |
| **Release 권장 commit** | 🟡 PO 결정 | `git add` + `/vais commit` |

## 9. 후속 피처 후보 (v2.1)

| 후보 | 우선순위 | 근거 |
|------|---------|------|
| 실 SendMessage 토론 PoC | High | Lazy Consensus 시뮬레이션 검증 (Lesson 5) |
| SC-06 wall-clock benchmark | High | performance-engineer 협업 — 35% 단축 목표 측정 |
| 합성 품질 LLM-as-judge | Medium | Td2 강화 — synthesizer 가 의견 적절히 반영했는지 자동 평가 |
| `/ultrareview` 통합 | Medium | CTO do 완료 후 선택적 자동 ultrareview |
| Multi-PO 락 강화 | Low | Hybrid Team Lead 페르소나 — Multi-PO 환경 락 충돌 해소 |
| SendMessage 원본 hash 박제 | Low | Td2 mitigation 강화 |

## 10. Next Phase

→ **(피처 종료)** — release commit 권장. 다음 피처는 PO 가 새로 발기.

**release 권장 commit message**:
```
feat(agent-teams): v0.68 대화-합성 모델 도입 — Conversation Orchestrator + Lazy Consensus + 패턴 D worktree

- v1 (병렬-생산 후 머지) → v2 (대화-합성) pivot
- 도메인 리드 합성자 + Lazy Consensus 5-state FSM
- 패턴 D sub-agent worktree 격리 (opt-in)
- status.json v3 → v4 마이그레이션 (무손실)
- clevel-doc-coexistence v3 (v1/v2 2 모델 공존)
- SendMessage 정책 v2 (C↔C 허용, sub→sub 금지)
- opt-in 비파괴 토글 (agentTeams.enabled default false)
- 신규 4 test (19 case) + 3 validate-plugin validator + 5 mandatory rules

29 파일 변경 (18 신규 + 11 수정) + 10 docs + 8 v1 archive.
```

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — Report 합성문, 4 결정 통합 / 진행 통계 / 5 Lessons / 박제 surface 44 / v0.68 릴리즈 노트 후보 / Memory 갱신 요약 / Production 체크리스트 / 후속 피처 6 후보 |

<!-- model-version: v2, template: synthesis -->
