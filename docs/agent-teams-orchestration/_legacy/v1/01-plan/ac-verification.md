---
owner: cpo
artifact: ac-verification
phase: plan
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "CTO 강행 모드 가정 3건의 Acceptance Criteria 변환 (G1 opt-in 비파괴 / G2 파일 기반 핸드오프 / G3 CEO 자동 판정)"
---

# agent-teams-orchestration — AC Verification (CPO)

> Plan phase | Owner: CPO | Date: 2026-05-16
> 참조: [tech-plan.md (CTO) §0.7 강행 모드 사유](./tech-plan.md)
> 범위: 내부 오케스트레이션 확장 — JTBD/페르소나/시장분석 boilerplate 미적용 (feedback: 내부 피처).

## 목적

CTO tech-plan §0.7 의 강행 모드 가정 3건을 design phase 진입 전에 검증 가능한 AC 로 박제. PRD 작성 (do phase) 은 본 피처에서 생략 가능 — AC 만으로 충분.

## Acceptance Criteria (Given-When-Then)

| ID | 가정 | AC | Verification |
|----|------|-----|--------------|
| **G1** | Agent Teams 는 opt-in, 기본 비활성 | **Given** 신규 설치 / `orchestration.agentTeams.enabled` 미설정 또는 false<br>**When** `/vais cto plan foo` 실행<br>**Then** 0.67.0 byte-level 동등하게 sequential 동작 (Agent Teams 코드 경로 미진입, status.json v3 호환) | CTO SC-01 + 신규 설치 smoke test |
| **G2** | C-Level 간 핸드오프는 파일 기반 유지 (SendMessage 는 sub-agent only) | **Given** `agentTeams.enabled=true` / 2 C-Level 동시 dispatch<br>**When** 동일 피처 plan 동시 진행<br>**Then** 각자 `docs/{feature}/01-plan/{artifact}.md` append-only 박제 + main.md merge 충돌 없음 (clevel-doc-coexistence v2.1 모델 재사용) | 통합 테스트: 2 background sessions + git diff |
| **G3** | "큰 피처" 판정 = CEO 7 차원 자동 (사용자 명시 X) | **Given** 사용자 단일 명령 진입<br>**When** CEO `analyzeCEO()` 가 7 차원 등급 산출<br>**Then** `parallelGroup.length >= 2` 일 때만 Agent Teams 경로, length=1 이면 sequential | CTO SC-02 + CEO 알고리즘 unit test |
| **G4** | Sub-agent worktree 병렬 (패턴 D) 도 opt-in 으로 비파괴 | **Given** `agentTeams.subagentSessions: false` (default)<br>**When** CTO 가 Design phase 에서 `ui-designer + infra-architect` 병렬 호출<br>**Then** 0.67.0 처럼 단일 세션 내 Agent 도구 병렬 (패턴 C) 그대로 — worktree 생성 없음, status.json `subagentLocks` 미사용 | CTO SC-09 + flag 토글 단위 테스트 |
| **G5** | Sub-agent worktree merge 무손실 | **Given** `subagentSessions: true` + Do phase frontend-engineer + backend-engineer 병렬 dispatch<br>**When** 각 sub-agent 가 자체 worktree branch (`feat/{feature}-{agent}`) 에서 작업 완료<br>**Then** CTO 가 feature branch 로 squash-merge 후 frontend + backend 변경사항이 모두 존재 + 충돌 없음 | CTO SC-08 + `tests/subagent-worktree-merge.test.js` |

## CPO 결정

| # | 결정 | 근거 |
|---|------|------|
| 1 | 강행 모드 가정 3건 = G1/G2/G3 AC 로 박제. **design phase 진입 시 본 AC 검증 의무**. | PRD-grade 검증 없이 design 진입 시 기능 정의 표류 위험 |
| 2 | 본 피처는 **내부 오케스트레이션 확장** — JTBD/페르소나/OST/시장분석 skip. PRD 8 섹션 do phase 생략 가능. | 사용자 직접 피드백 (2026-05-16): "음 기능 추가인데 왜 타깃을 정의하고 그러지?" + memory `feedback-internal-feature-no-persona` |
| 3 | **G4/G5 AC 추가** — 패턴 D (sub-agent worktree 병렬) In-scope 승격에 따른 비파괴성 + merge 무손실 검증 | 사용자 결정 (2026-05-16): C-Level 만이 아닌 sub-agent 레이어도 포함. AC 누락 시 패턴 C 침범 + worktree merge race 위험 |

## Out-of-scope (의도적 제외)

- JTBD / 페르소나 정의 — 외부 시장이 아닌 내부 도구 확장
- TAM/SAM/SOM 시장 분석 — 사용자 = 기존 vais-code 사용자 (이미 정의됨)
- Opportunity Solution Tree — opportunity 가 tech-plan 의존성 그래프에 직접 매핑 (CTO 영역)
- PRD 8 섹션 full pack — 본 AC 만으로 design 진입 가능

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — G1/G2/G3 AC 박제 + 내부 피처 scope 제한 결정 |
| v1.1 | 2026-05-16 | G4/G5 AC 추가 (패턴 D In-scope 승격) + CPO 결정 #3 |
