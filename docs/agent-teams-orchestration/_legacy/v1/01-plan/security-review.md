---
owner: cso
artifact: security-review
phase: plan
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "Agent Teams 도입 보안 사전 검토 — SendMessage 적용 범위 / advisory lock 우회 위험 / worktree 격리 / opt-in 토글 우회 / 스케줄 작업 권한 (5 위협 분류)"
---

# agent-teams-orchestration — Security Review (CSO)

> Plan phase (병렬 진입) | Owner: CSO | Date: 2026-05-16
> 참조: [tech-plan.md (CTO)](./tech-plan.md), [interface-contract.md](../02-design/interface-contract.md), [architecture.md](../02-design/architecture.md)
> 범위: 내부 오케스트레이션 확장 — OWASP Top 10 풀 감사 불필요. Agent Teams 5 위협 분류만.

## 1. 위협 모델 (STRIDE 약식)

| ID | 위협 | Category | Surface | Severity (pre-mitigation) |
|----|------|----------|---------|---------------------------|
| **T1** | SendMessage 가 C-Level 간 통신에 오용되어 감사 우회 | Tampering / Repudiation | `agents/_shared/work-rules.md`, hook 검증 | Medium |
| **T2** | Advisory lock 우회로 동일 C-Level 중복 진입 → main.md merge race | Tampering | `lib/status.js > acquireLock` | Medium |
| **T3** | Worktree 가 main branch 와 격리되지 않아 의도치 않은 commit | Tampering / Information Disclosure | Claude Code background sessions (외부 의존) | Low (CC 가 관리) |
| **T4** | `agentTeams.enabled=true` 가 사용자 모르게 commit 되어 PR 시 동작 변경 | Tampering / Elevation | `vais.config.json` | Low |
| **T5** | 스케줄 작업 (`/schedule` CSO 감사 / CBO finops) 이 stale credentials 사용 | Information Disclosure | Anthropic 인프라 (외부) + `docs/_scheduled/` | Medium |
| **T6** | Sub-agent worktree (패턴 D) merge 시 sub-agent 의 악성/오류 commit 이 feature branch 로 squash-merge 됨 | Tampering | `lib/worktree-manager.js > mergeBack`, sub-agent worktree branch | Medium |
| **T7** | Sub-agent worktree branch 가 cleanup 되지 않아 stale branch + 파일 누적 | Denial of Service (디스크) / Information Disclosure (오래된 코드) | git worktree 디렉토리 | Low |
| **T8** | Sub-agent SendMessage 가 다른 sub-agent 에 직접 통신 (C-Level 우회) | Tampering / Privilege Escalation | sub-agent 간 SendMessage 호출 | Medium |

## 2. 보안 결정 (CSO)

| # | Decision | Mitigation | Verification |
|---|----------|-----------|--------------|
| 1 | **T1 SendMessage 적용 범위 enforcement** = `agents/_shared/work-rules.md` 박제 + hook 검증 (선택) | (1) work-rules 에 ALLOWED/FORBIDDEN 명시 (2) 선택적 PreToolUse hook 으로 `SendMessage to:` 타깃이 sub-agent 인지 검증 | C1~C5 계약 검증 + hook unit test |
| 2 | **T2 Advisory lock 우회 위험 수용** — 강제 차단 X 정책 유지. 단 중복 진입 시 `W-LOCK-DUP` 경고 코드로 main.md 박제 | (1) 정책 plan §5 정합 (2) merge race 는 clevel-doc-coexistence append-only 로 자연 해소 — Decision Record 순서만 비결정적, 데이터 손실 X | T6 신규 — `tests/lock-race.test.js` |
| 3 | **T3 Worktree 신뢰** — CC 의 worktree 격리에 의존. 자체 검증 X | (1) CC 2.x 의 worktree 자동 격리 검증된 기능 (2) `git worktree list` 로 health check 가능 (관찰 — v2) | manual smoke test |
| 4 | **T4 agentTeams 토글 PR 가시화** — `vais.config.json` 변경이 PR diff 에 잡힘 + CI 검증 추가 | (1) `scripts/vais-validate-plugin.js` 에 `orchestration.agentTeams.enabled === true` 발견 시 warning (2) CLAUDE.md Mandatory Rule #18 명시 | scripts/vais-validate-plugin.js patch |
| 5 | **T5 스케줄 결과 보호** — `docs/_scheduled/` 는 일반 피처 산출물과 동일하게 git 추적. 시크릿 박제 금지 | (1) `agents/cso/secret-scanner.md` 룰셋이 `docs/_scheduled/` 도 스캔 (2) frontmatter 표준 강제 (interface-contract §5) | secret-scanner CI 실행 |
| 6 | **신규 위협 surface 없음** — Agent Teams 는 CC 네이티브 기능 활용. 자체 네트워크/외부 API 추가 X | (1) CTO 기술 스택 (architecture §1) 검증: 신규 외부 의존 = `claude` CLI 만 (이미 의존) (2) supply chain 변경 없음 | dependency-analyzer 통과 |
| 7 | **T6 Sub-agent merge 위험 mitigation** = squash-merge 후 자동 CI 검증 (lint + test) + 사용자 명시 승인 시점 추가 | (1) `lib/worktree-manager.js mergeBack` 이 무조건 사용자 AskUserQuestion 으로 diff 확인 (2) lint/test 실패 시 merge 차단 | T6 신규 — `tests/worktree-merge-safety.test.js` |
| 8 | **T7 Stale worktree cleanup** = 자동 cleanup X. 30분+ 미해제 시 경고만 (memory `feedback_no_auto_git_restore` 정합) | (1) `lib/worktree-manager.js > listStale()` 가 stale worktree 식별 (2) cleanup 명령은 `/vais teams cleanup` 사용자 명시 호출 | T7 신규 — manual smoke test |
| 9 | **T8 Sub-agent SendMessage 직접 통신 차단** = `work-rules.md` 박제 (Decision #1 의 범위 확장 — sub-agent → sub-agent 도 FORBIDDEN) + (선택) hook 검증 | (1) work-rules.md 의 FORBIDDEN 목록 확장 (2) hook 이 SendMessage from-agent-type / to-agent-type 검사 | T8 신규 — hook 단위 테스트 |

## 3. Do phase 추가 작업 (보안 게이트)

CTO design `5. Next Phase` 14 작업에 보안 작업 3건 추가:

| # | 작업 | 파일 | Owner |
|---|------|------|:-----:|
| 15 | `agents/_shared/work-rules.md` SendMessage ALLOWED/FORBIDDEN 박제 — Decision #1 | agents/_shared/ | cto (CSO 가 텍스트 제공) |
| 16 | (선택) `hooks/sendmessage-guard.js` — SendMessage to: 타깃 sub-agent 검증 | hooks/ | backend-engineer |
| 17 | `tests/lock-race.test.js` — 동일 C-Level 중복 진입 시 main.md append-only 무손실 검증 | tests/ | test-engineer |
| 18 | `scripts/vais-validate-plugin.js` — agentTeams.enabled=true PR warning | scripts/ | backend-engineer |
| 19 | `lib/worktree-manager.js mergeBack` — 사용자 AskUserQuestion 으로 diff 확인 + lint/test 게이트 (T6) | lib/ | backend-engineer |
| 20 | `tests/worktree-merge-safety.test.js` — squash-merge 시 lint 실패 → merge 차단 검증 | tests/ | test-engineer |
| 21 | `lib/worktree-manager.js listStale` — stale worktree 식별 + `/vais teams cleanup` 사용자 명시 cleanup (T7) | lib/ | backend-engineer |
| 22 | `agents/_shared/work-rules.md` SendMessage FORBIDDEN 확장 — sub-agent → sub-agent 추가 (T8) | agents/_shared/ | (CTO 직접) |

> 작업 16 은 선택 — work-rules.md 박제로 1차 enforcement 충족. hook 은 v2 후보.

## 4. QA phase CSO 검증 항목 (gate)

QA phase 진입 시 CSO Gate 통과 조건:

| ID | Criterion | Verification |
|----|-----------|--------------|
| CSO-G1 | secret-scanner 가 `docs/_scheduled/` 포함 전체 스캔 통과 | `node agents/cso/secret-scanner.md` (실행 가능 형태) |
| CSO-G2 | dependency-analyzer 신규 supply chain 변경 없음 (claude CLI 만) | `node agents/cso/dependency-analyzer.md` |
| CSO-G3 | `work-rules.md` SendMessage 섹션 grep 매치 | `grep -n "SendMessage" agents/_shared/work-rules.md` |
| CSO-G4 | `tests/lock-race.test.js` 통과 | `npm test -- lock-race` |
| CSO-G5 | `scripts/vais-validate-plugin.js` agentTeams 검사 통과 | `node scripts/vais-validate-plugin.js` |
| CSO-G6 | `tests/worktree-merge-safety.test.js` 통과 (T6) | `npm test -- worktree-merge-safety` |
| CSO-G7 | `work-rules.md` SendMessage FORBIDDEN 에 "sub-agent → sub-agent" 명시 grep 매치 (T8) | `grep -n "sub-agent → sub-agent" agents/_shared/work-rules.md` |

## 5. Out-of-scope (의도적 제외)

- OWASP Top 10 풀 감사 — 본 피처는 외부 노출 surface 없음 (내부 오케스트레이션)
- 인증/인가 시스템 변경 — 신규 없음 (CC 의 기존 권한 모델 재사용)
- GDPR/PII compliance — 사용자 데이터 처리 변경 없음
- Penetration test — 내부 도구, 외부 공격 surface 부재

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — 5 위협 (T1-T5) + 6 보안 결정 + Do phase 보안 작업 4건 + QA Gate CSO-G1~G5 |
| v1.1 | 2026-05-16 | 패턴 D In-scope 승격에 따른 확장 — T6/T7/T8 추가 (sub-agent merge / stale worktree / sub→sub SendMessage) + 결정 #7/8/9 + Do 작업 19~22 + QA Gate CSO-G6/G7 |
