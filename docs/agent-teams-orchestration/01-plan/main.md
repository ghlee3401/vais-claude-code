---
owner: cto
artifact: synthesis
phase: plan
feature: agent-teams-orchestration
generated: 2026-05-16
synthesizer: cto
model-version: v2
summary: "Claude Code 2.x Agent Teams 의 SendMessage 대화 기능을 활용해 C-Level 들이 토론 후 도메인 리드가 합성문 박제하는 모델로 vais-code 재설계. v1 (병렬-생산 후 머지) 폐기, v2 (대화-합성) 채택."
---

# agent-teams-orchestration — Plan (합성문, v2)

> Phase: 📋 plan | 합성 작성자 (Synthesizer): **CTO** (plan phase 는 CTO 도메인 리드 — tech-plan 성격)
> 모델: v2 (대화-합성). v1 archive: `../_legacy/v1/`
> 합의 종료: Lazy Consensus (draft → N턴 이의 없으면 통과)
> 참여 C-Level: CTO (리드) + CPO + CSO + CEO (라우팅)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Claude Code 2.x Agent Teams 의 SendMessage 기능을 vais-code 가 활용 못함. 현재 C-Level 간 핸드오프는 파일 기반이라 "Agent Teams" 라는 이름값을 못 살림. PO 정체성 "organization-in-a-box" 도 실시간 회의 부재로 정합성 약함. |
| **Solution** | C-Level 들이 SendMessage 로 대화 → phase 별 도메인 리드가 합성문 (`main.md`) 박제 + decisions-log 타임라인. 실행 레이어 (sub-agent worktree 병렬, 패턴 D) 는 그대로 유지. |
| **Effect** | (1) "조직" 메타포 강화 — 회의→의사록 (2) wall-clock 단축 — 직렬 핸드오프 → 동시 토론 (3) 합성문 1개로 grep 가능성 보장. |
| **Core Value** | Agent Teams 의 SendMessage 대화 기능을 정체성 (organization-in-a-box) 과 직접 연결. v0.66 sub-agent 박제 모델을 conversation-first 로 진화. |

## 2. 4 결정 (도메인 리드 = CTO 박제, CPO/CSO/CEO 합의)

| # | Decision | 근거 | 제기자 → 합의자 |
|---|----------|------|-----------------|
| 1 | **모델 v2 = 대화-합성 채택** — 도메인 리드 합성자 + Lazy Consensus + 합성문 + decisions-log | 사용자 결정 (2026-05-16): "에이전트끼리 얘기해서 하나의 문서로" → Agent Teams 본래 정신 반영 | PO 제기 → 전원 합의 |
| 2 | **도메인 리드 = phase 별 가변** — plan=CPO/CTO (tech 성격이면 CTO) / 보안=CSO / 재무=CFO/CBO / 운영=COO | 도메인 깊이 보장 + CEO 가 모든 도메인 합성 작성 어려움 | 사용자 옵션 B 선택 |
| 3 | **합의 종료 = Lazy Consensus** — 도메인 리드 draft → 다른 C-Level N턴 (기본 2턴) 내 이의 없으면 통과. veto X (모두가 의견만, 결정은 리드). | 무한 토론 방지 + 반박권 보장. Apache/Linux 커뮤니티 검증 패턴. | 사용자 옵션 1C 선택 |
| 4 | **로그 박제 = 합성문 + decisions-log timeline** — main.md 는 도메인 리드 합성문 1개. decisions-log.md 에 "누가-언제-무엇 제기/반박/합의" 1줄씩. | grep 가능성 + 본문 가독성 균형. 전체 SendMessage 박제는 git 비대. | 사용자 옵션 C 선택 |
| 5 | **v1 처리 = `_legacy/v1/` archive** | git history 보존 + 현재 폴더 v2 만 깨끗 | 사용자 옵션 2B 선택 |
| 6 | **재진입 = 새 세션 (fresh)** — 1주+ 이후 동일 피처 재방문 시 SendMessage agent ID 미보존. 이전 합성문은 input context 로만 활용. | 단순함 + CC 세션 영속성 불확실 + 합성문이 ground truth | 사용자 옵션 3A 선택 |
| 7 | **Sub-agent worktree 병렬 (패턴 D) 유지** | C-Level 간 대화 모델과 직교 — 실행 레이어 (frontend+backend+test 동시 git branch) 는 v1 설계 그대로 재활용 | 기술 결정 유지 (v1 의 합리적 부분 보존) |

## 3. 4 패턴 분류 (재확인)

| 패턴 | 설명 | v2 채택 |
|------|------|:------:|
| A | Sequential — 단일 세션 직렬 | ✅ Fallback |
| B | C-Level 간 background sessions + **SendMessage 대화** | ✅ In-scope (v2 핵심) |
| C | Sub-agent 같은 세션 Agent 도구 병렬 | ✅ 현행 유지 |
| D | Sub-agent 다른 세션 background + worktree | ✅ In-scope (v1 에서 In-scope 승격) |

> v1 → v2 변화: **B 의 의미가 달라짐**. v1 = 병렬 작업 후 파일 머지 / v2 = 대화 후 합성. 기술 surface 는 유사하지만 정책/문서 모델 다름.

## 4. 핵심 기능 (Must)

| # | 기능 | 설명 | 신규 파일 |
|---|------|------|----------|
| 1 | Conversation Orchestrator | 도메인 리드가 SendMessage 로 다른 C-Level 호출 + Lazy Consensus 진행 | `skills/vais/utils/conversation-orchestrator.js` |
| 2 | Synthesis Template | 합성문 main.md 표준 — Executive Summary / Decisions / 4 패턴 / 기능 / SC / 관찰 / 합성자 명시 | `templates/synthesis.template.md` |
| 3 | Decisions Log Template | 타임라인 1줄/event — `\| time \| actor \| event-type (제기/반박/합의) \| topic \| ref \|` | `templates/decisions-log.template.md` |
| 4 | 도메인 리드 라우팅 | CEO 7 차원 결과에 `synthesizer: <c-level>` 필드 추가 (phase + 도메인 매핑) | `lib/ceo-algorithm.js` 수정 |
| 5 | Lazy Consensus 정책 | draft 박제 → SendMessage 다른 C-Level 에 "review window N턴" → 이의 없으면 통과 + decisions-log "합의" 행 추가 | `agents/_shared/work-rules.md` 박제 |
| 6 | Sub-agent worktree (패턴 D) | v1 설계 재활용 — `lib/worktree-manager.js` + `skills/vais/utils/subagent-dispatcher.js` | v1 design 재활용 |
| 7 | opt-in 토글 + fallback | `orchestration.agentTeams.enabled` (B 활성) + `subagentSessions` (D 활성). 기본 false. | `vais.config.json` |
| 8 | `clevel-doc-coexistence` deprecation | v0.57 도입 v2.1 → "conversation-mode" 추가 또는 v3 로 마이너 업그레이드. main.md 5섹션 인덱스 → 합성문 단일로 변경. | `agents/_shared/clevel-main-guard.md` 수정 |

## 5. Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `agentTeams.enabled=false` 기본 → 0.67.0 byte-level 동등 (v2 코드 경로 미진입) | smoke test |
| SC-02 | Lazy Consensus draft → N턴 이의 없음 → 합의 행 자동 박제 | 통합 테스트 `tests/lazy-consensus.test.js` |
| SC-03 | Lazy Consensus draft → 이의 1건 → 1라운드 추가 토론 → 재합의 | 통합 테스트 |
| SC-04 | 합성문 main.md = 도메인 리드 frontmatter `synthesizer` 와 일치 | 단위 검증 |
| SC-05 | decisions-log timeline 모든 event 가 SendMessage 송신 시각과 일치 (±5초) | log audit |
| SC-06 | 1 phase wall-clock ≤ 직렬 v1 의 50% (대화 시뮬레이션 기준) | benchmark |
| SC-07 | Sub-agent worktree merge 무손실 (패턴 D, v1 SC-08 재활용) | `tests/subagent-worktree-merge.test.js` |
| SC-08 | `clevel-doc-coexistence` v2.1 → v3 마이그레이션 무손실 (기존 5 완료 피처 보존) | 마이그레이션 테스트 |

## 6. 위협 / 위험 (CSO 제기)

| ID | 위협 | Mitigation |
|----|------|-----------|
| T1 | 도메인 리드 합성문이 다른 C-Level 의견을 "왜곡 인용" | decisions-log 의 원본 actor 명시 + (선택) SendMessage 원본 hash 박제 |
| T2 | Lazy Consensus N턴 = 너무 짧으면 강행, 너무 길면 deadlock | N=2 기본 + `vais.config.json > orchestration.agentTeams.consensusTurns` 조정 가능 |
| T3 | SendMessage 가 C-Level 간 통신에 쓰이므로 v1 의 "C-Level↔C-Level 금지" 정책 폐기 → 감사 가능성 우려 | decisions-log 가 새 감사 trail (timeline 기반) — grep 가능 |
| T4 | 합성자 selection 알고리즘 오류 — 잘못된 C-Level 이 도메인 리드 지정 | CEO 7 차원 알고리즘에 도메인 → synthesizer 매핑 박제 (`lib/ceo-algorithm.js`) + 단위 테스트 |
| T5~T8 | 패턴 D worktree 관련 (v1 security-review §1 재활용) | v1 mitigation 그대로 |

## 7. 관찰 (Out-of-scope 후속)

- **합성문 품질 평가** — 도메인 리드가 다른 C-Level 의견을 적절히 반영했는지 자동 측정 (LLM-as-judge). v2.1 후보.
- **veto 권 도입 (CSO/CFO)** — 사용자가 1A/1D 가 아닌 1C 선택했지만, 운영 후 보안/재무 도메인이 절대 차단 필요하면 추가.
- **재진입 대화 이어가기 (3B)** — 사용자가 3A 선택했지만, CC 가 향후 세션 영속성 강화하면 재고.
- **합성문 multi-author 모드** — phase 가 멀티도메인 (예: 보안+성능) 일 때 공동 합성. v2.1 후보.
- **decisions-log 자동 박제 hook** — SendMessage 호출 시 자동 timeline 행 추가. 현재는 도메인 리드가 수동 박제.

## 8. v1 → v2 산출물 변환 매핑

| v1 (archive) | v2 대응 | 비고 |
|--------------|---------|------|
| `01-plan/tech-plan.md` | 본 `main.md` (CTO 합성) | tech 결정 흡수, 형식 변경 |
| `01-plan/ac-verification.md` | decisions-log 의 G4/G5 합의 행 + 본 main.md §5 SC | AC 는 SC 로 통합 |
| `01-plan/security-review.md` | 본 `main.md` §6 (CSO 제기) | 위협 표 흡수 |
| `02-design/architecture.md` | (다음 design phase 에 v2 형식으로 재박제) | §7 sub-agent worktree 부분 재활용 |
| `02-design/migration-plan.md` | (다음 design phase) + `clevel-doc-coexistence` v2.1→v3 추가 마이그레이션 | status.json v4 + main.md 합성문 마이그레이션 |
| `02-design/interface-contract.md` | (다음 design phase) | C1~C9 + Lazy Consensus 계약 추가 |

## 9. Next Phase

→ **design** (CTO 계속 — tech 합성 성격)

design phase 예상 산출물:
- `main.md` (합성문, synthesizer=cto) — Conversation Orchestrator + Lazy Consensus 알고리즘 + 합성문 템플릿 + decisions-log 형식 + v2 mig
- `decisions-log.md` — design phase 의 토론 timeline

> **Lazy Consensus 시뮬레이션**: 본 plan 은 사용자가 직접 옵션 선택한 결과를 박제했으므로 N턴 토론 생략. 실제 design phase 부터 Lazy Consensus 알고리즘 적용.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v2.0 | 2026-05-16 | v2 모델 (대화-합성) 채택 — v1 archive 후 fresh start. 7 결정 + 8 기능 + 8 SC + T1~T8 위협 + v1→v2 매핑 |
