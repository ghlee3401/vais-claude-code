---
owner: cto
agent: cto-direct
artifact: phase-index
phase: plan
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "Claude Code 2.x Agent Teams 도입 plan — opt-in 토글 / 의존성 DAG 기반 parallelGroup / 멀티피처 status.json v4 / CSO·CBO 스케줄"
---

# agent-teams-orchestration — Plan (인덱스)

> Phase: 📋 plan | Owner: CTO | Date: 2026-05-16
> 참조: — (신규 피처, 이전 phase 없음)

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CEO 라우팅이 C-Level 순차 실행 → 의존성 없는 작업도 직렬 대기. 한 시점 한 피처. |
| **Solution** | Claude Code 2.x Agent Teams (background sessions + worktree + SendMessage) 를 오케스트레이션 계층에 도입. 의존성 DAG 기반 parallelGroup. |
| **Effect** | 큰 피처 시 3+ C-Level 동시 진행 → wall-clock 단축. `claude agents` 대시보드 가시화. |
| **Core Value** | "organization-in-a-box" 정체성 강화 — 진짜 조직처럼 부서 동시 작업. |

## 2. Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| 1 | Agent Teams 는 opt-in (`orchestration.agentTeams.enabled`) — 기본 비활성 | cto | CC 버전 의존성 격리 + 기존 시퀀셜 워크플로우 정합 보존 | `tech-plan.md` |
| 2 | C-Level 병렬화는 CEO 라우팅 산출물의 `parallelGroup: [...]` 필드 — 의존성 DAG 기반 | cto | 7 차원 알고리즘 결과를 시퀀스→DAG 확장하면 자연스럽게 병렬화 | `tech-plan.md` |
| 3 | SendMessage 는 **C-Level → sub-agent 한정**. C-Level 간 핸드오프는 파일 기반 유지. | cto | 파일 기반은 grep/감사 가능 + append-only Decision Record 정합 | `tech-plan.md` |
| 4 | `.vais/status.json` v3 → v4 — `activeFeature` 단일 → `activeFeatures[]` + per-feature lock | cto | 멀티피처 동시 진행 시 phase 충돌 방지 (lock 은 advisory) | `tech-plan.md` |
| 5 | `/schedule` 통합은 CSO 보안 감사 + CBO finops 만 우선 | cto | 정기 작업 가치가 명확한 두 도메인부터 시작 | `tech-plan.md` |
| 6 | CTO 강행 모드 가정 3건 → **G1/G2/G3 AC 박제** (design 진입 전 검증 의무) | cpo | PRD-grade 가정 검증 없이 design 진입 시 기능 정의 표류 위험 | `ac-verification.md` |
| 7 | 본 피처는 **내부 오케스트레이션 확장** — JTBD/페르소나/OST/시장분석/PRD 8 섹션 skip | cpo | 사용자 피드백 (2026-05-16): 내부 피처에 시장 분석 boilerplate 부적절. memory: `feedback-internal-feature-no-persona` | `ac-verification.md` |
| 8 | **신규 외부 surface 없음** — Agent Teams 는 CC 네이티브 활용, supply chain 변경 X. OWASP 풀 감사 skip. | cso | 5 위협 (T1-T5) 만 식별 — 모두 내부 enforcement 로 mitigate | `security-review.md` §1, §5 |
| 9 | T1 SendMessage enforcement = `work-rules.md` 박제 + 선택적 hook 검증 | cso | C-Level 간 통신 감사 우회 방지. interface-contract §4 ALLOWED/FORBIDDEN 정합 | `security-review.md` §2 #1 |
| 10 | T2 Advisory lock 우회 = 수용. clevel-doc-coexistence append-only 가 데이터 손실 자연 해소 | cso | 강제 차단보다 PO 워크플로우 경량화 우선 (정책 plan §5 정합) | `security-review.md` §2 #2 |
| 11 | T4 agentTeams 토글 PR 가시화 = validate-plugin 에서 enabled=true warning | cso | 사용자 모르게 commit 되어 동작 변경 방지 — CLAUDE.md Rule #18 박제 의무 | `security-review.md` §2 #4 |
| 12 | T5 스케줄 결과 secret-scanner 스캔 범위 확장 = `docs/_scheduled/` 포함 | cso | 시크릿 박제 방지 — 일반 피처와 동일 보호 수준 | `security-review.md` §2 #5 |
| 13 | QA Gate CSO-G1~G5 = secret-scanner / dependency-analyzer / work-rules grep / lock-race test / validate-plugin | cso | QA phase 진입 시 자동 검증 — 게이트 통과 객관화 | `security-review.md` §4 |
| 14 | **패턴 D 도입 (sub-agent worktree 병렬)** — Decision #2 의 parallelGroup 모델을 sub-agent 레이어에도 적용 | cto | 사용자 결정 (2026-05-16): C-Level 만이 아닌 sub-agent 레이어도 In-scope. 별도 sub-toggle `subagentSessions` 로 granular 제어. | `tech-plan.md` Decision #6, `architecture.md` §7 |
| 15 | Sub-agent worktree merge = squash + AskUserQuestion + lint/test 게이트 | cto | 무손실 + T6 mitigation 동시 충족. 자동 cleanup X (memory `feedback_no_auto_git_restore` 정합). | `tech-plan.md` Decision #7, `architecture.md` §7.2 |
| 16 | G4 (subagentSessions=false → 패턴 C 그대로) + G5 (merge 무손실) AC 추가 | cpo | 패턴 D 비파괴성 + worktree merge race 회피 — design 진입 전 AC 검증 의무 | `ac-verification.md` G4/G5 |
| 17 | T6/T7/T8 위협 추가 (sub-agent merge / stale worktree / sub→sub SendMessage) | cso | 패턴 D In-scope 승격에 따른 surface 확장. 모두 내부 enforcement 로 mitigate. | `security-review.md` T6-T8 |
| 18 | QA Gate CSO-G6/G7 추가 (worktree-merge-safety test + work-rules sub→sub grep) | cso | 패턴 D 보안 검증 객관화 | `security-review.md` §4 |

## 3. Artifacts (이 phase 박제 자료)

| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| tech-plan | cto | cto-direct | — | Agent Teams 도입 5 결정 + 8 기능 + 6 SC + Impact Analysis | [`tech-plan.md`](./tech-plan.md) |
| ac-verification | cpo | cpo-direct | — | CTO 강행 모드 가정 3건의 Given-When-Then AC (G1 opt-in / G2 파일 핸드오프 / G3 CEO 자동 판정) | [`ac-verification.md`](./ac-verification.md) |
| security-review | cso | cso-direct | — | 5 위협 (SendMessage 오용 / lock 우회 / worktree / 토글 commit / 스케줄 secret) + 6 결정 + Do 보안 작업 4건 + QA Gate CSO-G1~G5 | [`security-review.md`](./security-review.md) |

## 4. CEO 판단 근거 (왜 이 artifact 들이 이 phase 에)

> 본 피처는 사용자가 직접 `/vais cto plan` 으로 진입 — CEO 7 차원 알고리즘을 거치지 않았다. CTO 단독 plan (강행 모드, PRD 없음).
>
> - 포함: **tech-plan** — CTO 단독 강행 시 표준 산출물 (Standard 템플릿)
> - 제외: **prd** (CPO) — 사용자 직접 호출, CPO 미경유. design phase 전 CPO 권장 (강행 모드 가정 검증).
> - 제외: **strategy-kernel / vision** (CEO) — 내부 도구 확장이라 strategic kernel 불필요
> - 제외: **market-research** (CBO) — 외부 시장 아닌 내부 오케스트레이션 변경

## 5. Next Phase

→ **design** (CTO 계속 진입 권장 — ui-designer 는 N/A, infra-architect 가 status.json migration 설계)

다음 phase 의 예상 artifact:
- `architecture.md` (infra-architect) — Agent Teams 통합 아키텍처 다이어그램 + 의존성 DAG 알고리즘
- `migration-plan.md` (infra-architect 또는 db-architect) — status.json v3→v4 스키마 + 마이그레이션 스크립트 설계
- `interface-contract.md` (cto) — `parallelGroup` 필드 / lock 형식 / SendMessage 사용 패턴

> ⚠️ design 진입 전 CPO PRD 작성 권장 — Acceptance criteria 와 사용자 시나리오 확정 필요 (현재 강행 모드 가정 검증).

## 5b. Next Phase — CPO 관점 (append)

→ **CTO design** (PRD 8 섹션 do phase 생략 — AC 검증만으로 충분, 내부 오케스트레이션 확장)

CPO do (PRD) 스킵 사유: 본 피처는 내부 도구 확장 — JTBD/페르소나/시장 분석 불필요. `ac-verification.md` 의 G1/G2/G3 AC 가 design 진입 입력으로 충분.

권장 진행: **CTO design → CTO do → CSO 보안 검토 (SendMessage 정책 / worktree 격리)**.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — CTO plan 인덱스, 5 결정 / 1 artifact / next=design |
| v1.1 | 2026-05-16 | CPO plan 진입 (1차) — JTBD/페르소나/OST 포함 product-analysis 박제 + Decision row 6~10 |
| v1.2 | 2026-05-16 | CPO 슬림화 — 사용자 피드백 ("기능 추가에 타깃 정의 X") 반영. product-analysis 제거, ac-verification 으로 교체. Decision row 5건 → 2건 (AC 박제 + 내부 피처 scope 결정). §5b Next Phase = CTO design 직진 (CPO do PRD 스킵). |
| v1.3 | 2026-05-16 | CSO plan 병렬 진입 — Decision row 8~13 append (6 결정) + security-review artifact 추가. Do phase 보안 작업 4건 + QA Gate CSO-G1~G5. |
| v1.4 | 2026-05-16 | 패턴 D In-scope 승격 (사용자 결정) — Decision row 14~18 append (CTO #14,15 / CPO #16 / CSO #17,18). tech-plan/ac-verification/security-review/architecture/migration-plan/interface-contract 모두 v1.1 로 동기화. |

<!-- main-md template version: v2.0 -->
