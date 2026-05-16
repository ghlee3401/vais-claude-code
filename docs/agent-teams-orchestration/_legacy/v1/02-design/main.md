---
owner: cto
agent: cto-direct
artifact: phase-index
phase: design
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "Design phase 인덱스 — architecture (DAG/dispatch/SendMessage/fallback) + migration-plan (status.json v3→v4) + interface-contract (4 계약). UI 없음 (내부 오케스트레이션)."
---

# agent-teams-orchestration — Design (인덱스)

> Phase: 🎨 design | Owner: CTO | Date: 2026-05-16
> 참조: [Plan main.md](../01-plan/main.md)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Plan 의 5 결정 + G1/G2/G3 AC 를 구현 가능한 인터페이스 계약 + 마이그레이션 경로 + 아키텍처 다이어그램으로 박제 필요. |
| **Solution** | 3 artifact 박제 — architecture (DAG + dispatch + SendMessage 범위 + fallback), migration-plan (status.json v3→v4), interface-contract (4 계약 + 검증 C1~C5). |
| **Effect** | Do phase 진입 시 코드 작성 방향 명확화 — 구현 surface 가 plan 의 11 changed resources 와 1:1 매핑. |
| **Core Value** | AC G1/G2/G3 를 인터페이스 계약 C1~C5 로 변환 — design→do 핸드오프 명세 완성. |

## 2. Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| 1 | UI 없음 — ui-designer 미위임. infra-architect 책무도 CTO 직접 박제 (lean) | cto | 내부 오케스트레이션 확장, 사용자 피드백 (boilerplate 최소화) | `architecture.md` |
| 2 | DAG 알고리즘 = `vais.config.json > cSuite.launchPipeline.dependencies` 재사용. 신규 의존성 스키마 X | cto | 0.67.0 의 의존성 정의를 단순 시퀀스→DAG 해석으로 확장하면 충분 | `architecture.md` §2 |
| 3 | Lock = advisory + sessionId + acquiredAt. heartbeat 는 v2 | cto | 본 피처는 lock 충돌 회피가 목표 — heartbeat 없이도 acquiredAt + lockStaleMinutes 로 검증 가능 | `interface-contract.md` §3 |
| 4 | 마이그레이션 = atomic write (temp + rename) + `.v3.bak` 백업 | cto | 동시 마이그레이션 race condition 방어 + 사용자 수동 롤백 경로 | `migration-plan.md` §5 |
| 5 | 스케줄 산출물 = `docs/_scheduled/` 단독 폴더 | cto | 일반 피처 main.md append-only 흐름과 분리 — 정책 plan §5 정합 | `interface-contract.md` §5 |
| 6 | CC 2.0.x 감지 = `lib/cc-version-detect.js` (신규 작은 wrapper) | cto | 버전 파싱 실패 시 안전 모드 (sequential) fallback — G1 보장 | `architecture.md` §6 |
| 7 | **패턴 D 박제** — architecture §7 sub-agent worktree 레이어 신규 추가 (mermaid + worktree-manager API + subagentLocks + SendMessage 정책 확장 + 패턴 A~D 분기 표) | cto | 사용자 결정 (2026-05-16): plan 의 Decision #6/7 을 design 으로 박제. lean 유지 — sub-agent 단위 ui-designer 별도 위임 안 함. | `architecture.md` §7 |
| 8 | `subagentLocks` 필드 migration-plan §1 v4 스키마에 추가 + migrate 함수 default `{}` | cto | 패턴 D 가 활성화되면 sub-agent 별 lock 추적 필요. migration 무손실 보존. | `migration-plan.md` §1, §2, T5 |
| 9 | interface-contract `subagentSessions/maxConcurrentSubagents/worktreeRoot/worktreeAutoCleanup` 4 신규 config + SubagentLock 타입 + worktree-manager API 3건 + C6~C9 4 신규 계약 | cto | 패턴 D 의 모든 surface 를 계약으로 박제 — Do phase 입력 완비. | `interface-contract.md` §1, §3, §6 |

## 3. Artifacts (이 phase 박제 자료)

| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| architecture | cto | cto-direct | — | Mermaid 흐름 + DAG 알고리즘 + dispatch 흐름 + SendMessage 범위 + fallback + lock 라이프사이클 | [`architecture.md`](./architecture.md) |
| migration-plan | cto | cto-direct | — | status.json v3→v4 schema diff + migration 의사 코드 + 5 consumer 영향 + T1~T4 검증 | [`migration-plan.md`](./migration-plan.md) |
| interface-contract | cto | cto-direct | — | 4 계약 (config / parallelGroup / lock / SendMessage) + 스케줄 경로 + C1~C5 검증 | [`interface-contract.md`](./interface-contract.md) |

## 4. CEO 판단 근거 (왜 이 artifact 들이 이 phase 에)

> 본 피처는 사용자가 직접 `/vais cto plan` 진입 — CEO 7 차원 알고리즘 미경유. CTO 단독 design.

- 포함: **architecture** — Agent Teams 통합 구조 시각화 (CTO design 표준)
- 포함: **migration-plan** — status.json schema 변경 동반 → infra-architect/db-architect 영역, 본 case 는 CTO 직접
- 포함: **interface-contract** — Do phase 진입 입력 계약 (C1~C5 검증 기준)
- 제외: **ui-design / wireframe / mockup** — UI 없음 (내부 오케스트레이션)
- 제외: **infra-architect 별도 위임** — lean 모드, CTO 직접 박제로 충분

## 5. Next Phase

→ **do** (CTO 계속)

Do phase 예상 작업 (architecture/migration-plan/interface-contract 의 Do 섹션 통합):

| # | 작업 | 파일 | Owner sub-agent |
|---|------|------|-----------------|
| 1 | `scripts/migrate-status-v3-to-v4.js` 작성 | scripts/ | backend-engineer |
| 2 | `lib/status.js` 패치 — auto-migrate + lock API | lib/ | backend-engineer |
| 3 | `lib/cc-version-detect.js` 신규 wrapper | lib/ | backend-engineer |
| 4 | `lib/ceo-algorithm.js` — parallelGroup 산출 추가 | lib/ | backend-engineer |
| 5 | `skills/vais/utils/teams-dispatcher.js` 신규 | skills/vais/utils/ | backend-engineer |
| 6 | `skills/vais/utils/teams-status.md` 신규 액션 | skills/vais/utils/ | backend-engineer |
| 7 | `skills/vais/utils/schedule-cso.md` + `schedule-cbo.md` | skills/vais/utils/ | backend-engineer |
| 8 | `agents/ceo/ceo.md` — parallelGroup 출력 박제 | agents/ceo/ | (CTO 직접) |
| 9 | `agents/_shared/work-rules.md` — SendMessage 규칙 | agents/_shared/ | (CTO 직접) |
| 10 | `vais.config.json` — orchestration.agentTeams 섹션 추가 | (config) | (CTO 직접) |
| 11 | `hooks/session-start.js` — activeFeatures[] 다중 표시 | hooks/ | backend-engineer |
| 12 | `scripts/vais-validate-plugin.js` — v4 허용 | scripts/ | backend-engineer |
| 13 | T1~T4 + C1~C5 통합 테스트 | tests/ | test-engineer |
| 14 | `CLAUDE.md` Mandatory Rule #18 추가 (Agent Teams opt-in 정책) | (root) | (CTO 직접) |
| 15 | `lib/worktree-manager.js` 신규 — createWorktree / mergeBack / listStale (패턴 D) | lib/ | backend-engineer |
| 16 | `skills/vais/utils/subagent-dispatcher.js` 신규 — sub-agent background session + worktree dispatch | skills/vais/utils/ | backend-engineer |
| 17 | `agents/cto/cto.md` 수정 — Do phase sub-agent 호출 시 `subagentSessions` 토글 분기 (패턴 C vs D) | agents/cto/ | (CTO 직접) |
| 18 | `agents/_shared/work-rules.md` SendMessage FORBIDDEN 에 "sub-agent → sub-agent" 추가 (T8) | agents/_shared/ | (CTO 직접) |
| 19 | `tests/subagent-worktree-merge.test.js` — squash-merge 무손실 검증 (G5/SC-08) | tests/ | test-engineer |
| 20 | `tests/worktree-merge-safety.test.js` — lint/test 실패 → merge 차단 (T6/CSO-G6) | tests/ | test-engineer |
| 21 | `skills/vais/utils/teams-cleanup.md` 신규 — 사용자 명시 호출 stale worktree cleanup (T7) | skills/vais/utils/ | backend-engineer |
| 22 | `CLAUDE.md` Mandatory Rule #19 추가 (sub-agent worktree 정책) | (root) | (CTO 직접) |

> 22건 = plan §Impact Analysis 의 15 changed resources + 7 신규 (cc-version-detect / schedule-cso / schedule-cbo / worktree-manager / subagent-dispatcher / cto.md 수정 / teams-cleanup) — 1:1 매핑 검증됨.
>
> CSO 추가 작업 19~22 (security-review §3) 별도 4건 = 총 **26 작업** (22 + 4 보안). 단, 일부는 Do 항목 #15-22 와 중복 — Do phase 진입 시 backend-engineer 가 통합 계획 박제 필요.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — design 인덱스, 6 결정 / 3 artifact / Next Phase = do 14 작업 |
| v1.1 | 2026-05-16 | 패턴 D 박제 — Decision #7/8/9 append + Next Phase do 14→22 작업 (15~22 신규: worktree-manager / subagent-dispatcher / cto.md 수정 / work-rules sub→sub / 2 신규 test / teams-cleanup / Rule #19). CSO 보안 작업 합치면 총 26. |

<!-- main-md template version: v2.0 -->
