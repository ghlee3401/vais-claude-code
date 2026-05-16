---
owner: cto
artifact: tech-plan
phase: plan
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "Claude Code 2.x Agent Teams (배경 세션 병렬 + SendMessage + worktree 격리) 를 VAIS C-Suite 오케스트레이션에 도입하여 다중 C-Level 동시 실행과 멀티피처 동시 진행을 지원하는 기술 계획"
---

# agent-teams-orchestration — 기획서 (Standard)

> ⛔ **Plan 단계 범위**: 분석·결정만 기록. 프로덕트 파일 생성·수정은 Do 단계.

## 요청 원문

> "클로드 코드의 신규 기능을 통하여 우리의 플러그인 기능을 확장하는 계획을 세우자. 특히 agent teams가 좋아보인다"
>
> 직전 대화 컨텍스트:
> - Claude Code 2.1.143 신규 기능 확인 (사용자 → 본 어시스턴트 응답)
> - 식별된 핵심 신기능: (1) Sub-agents 위임, (2) Background Sessions 병렬 (`claude agents`), (3) Agent Teams 상호통신 (SendMessage), (4) `/loop` · `/schedule` · `/goal`, (5) `/ultrareview`, (6) `/fork`, (7) worktree 자동 격리
> - 사용자 강조: "agent teams가 좋아보인다" → 다중 세션 병렬 + 상호통신 중심

## In-scope

- **패턴 B**: VAIS CEO 동적 라우팅에 **C-Level 간 Background Sessions 병렬** 도입 (의존성 없는 C-Level 묶음 동시 실행)
- **패턴 D**: Sub-agent 쌍 (ui-designer + infra-architect, frontend + backend + test) 의 **Background Sessions + worktree 격리** 병렬 (2026-05-16 사용자 결정으로 O3 → In-scope 승격)
- **SendMessage 기반 핸드오프** 패턴 — 현재 `docs/{feature}/{phase}/main.md` 파일 기반 핸드오프를 보완 (C-Level 간은 파일 유지, sub-agent 위임만 SendMessage)
- 멀티 피처 동시 진행 지원 — `.vais/status.json` 의 `activeFeature` 단일 필드를 다중 진행 모델로 확장
- **Sub-agent worktree merge 정책** — sub-agent 별 worktree → C-Level 이 결과 수집 후 feature branch 로 통합 (자동 cleanup 가이드 포함)
- `/schedule` 활용: CSO 주기 보안 감사 / CBO finops 주기 비용 분석 / 자동 의존성 CVE 스캔
- 새 슬래시 액션: `/vais teams status`, `/vais teams dispatch <feature> <c-level>` 등 (정확한 형식은 design phase)
- 기술적 전제조건: Node.js 18+, Claude Code 2.x, git worktree (기존 의존성 충족)

> **패턴 분류 (2026-05-16 명시화)**: A) 단일 세션 내 sub-agent 순차 — 그대로 / B) C-Level 간 background sessions — In-scope / C) 단일 세션 내 sub-agent Agent 도구 병렬 — 그대로 (이미 동작) / D) sub-agent 간 background sessions + worktree — In-scope

## Out-of-scope

- **CTO PDCA 의 강제 병렬화** — CTO 의 phase 순차성 (plan→design→do→qa→report) 은 그대로 유지. 병렬화는 phase 내부 (sub-agent) 와 C-Level 간 라우팅에만 적용.
- Background Sessions 의 자체 구현 — Claude Code 가 제공하는 기능을 활용만 함 (vais-code 가 SDK 처럼 wrap 만)
- `/ultrareview` 자동 호출 — 사용자 명시 호출에만 반응 (CLAUDE.md ultrareview policy 준수)
- 사용자 결제·과금·인프라 변경
- 자발 감지 확장 후보는 `## 관찰 (후속 과제)` 참조

---

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | CEO 라우팅이 C-Level 을 순차 실행하므로 의존성 없는 작업도 직렬 대기. 한 세션에 한 피처만 활성화 (single active feature). | cpo, cto |
| **Solution** | Claude Code 2.x Agent Teams (background sessions + SendMessage + worktree) 를 VAIS 오케스트레이션 계층에 도입. 의존성 그래프 기반 병렬 dispatch + 멀티피처 동시 진행. | cto |
| **Function/UX Effect** | 큰 피처에서 CPO/CSO/CBO 의 독립 작업이 동시 진행 → wall-clock 단축. `claude agents` 대시보드에서 C-Level 별 진행 상태 가시화. | cpo |
| **Core Value** | "organization-in-a-box" 정체성 강화 — 진짜 조직처럼 부서별 동시 작업. 벤더 lock-in 이 아니라 CC 네이티브 기능 활용. | ceo |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | (1) v0.66 `subagent-architecture-rethink` 에서 sub-agent 직접 박제는 완료했으나 C-Level 간 직렬 라우팅 병목은 남음. (2) Claude Code 2.x 가 무료 제공하는 기능을 활용 안 하면 경쟁 플러그인 대비 후행. |
| **WHO** | PO (vais-code 사용자) — 큰 피처 (예: 신규 서비스 런칭) 시 CPO + CBO + CSO 동시 진행으로 1~2 시간 단축 체감. |
| **RISK** | (R1) `.vais/status.json` 동시쓰기 race condition. (R2) C-Level 간 SendMessage 메시지 형식 정의 부재 시 혼선. (R3) Background sessions API 가 마이너 버전에서 changed/removed 될 가능성. |
| **SUCCESS** | (S1) CEO 가 의존성 없는 2+ C-Level 을 병렬 dispatch 가능. (S2) `.vais/status.json` 멀티피처 모델 마이그레이션 무손실. (S3) 단일 세션 fallback (Agent Teams 미지원 환경) 정상 동작. |
| **SCOPE** | VAIS 오케스트레이션 layer (skills/vais + agents/_shared + lib/) + status.json schema. 개별 C-Level 산출물 형식 변경 없음. |

---

## Decision Record (multi-owner)

<!-- 각 C-Level 이 자기 결정 행을 append. 이전 행 수정·삭제 금지. -->

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|--------------|
| 1 | Agent Teams 도입은 **opt-in 기능** — `vais.config.json > orchestration.agentTeams.enabled` 토글로 게이팅 | cto | (1) Claude Code 버전 의존성 격리 (2) 기존 sequential 워크플로우 정합성 보존 | `tech-plan.md` §6 |
| 2 | C-Level 병렬화는 **CEO 라우팅 결정 산출물의 별도 필드** 로 표현 (`parallelGroup: [cpo, cbo, cso]`) — 의존성 그래프 (`vais.config.json > cSuite.launchPipeline.dependencies`) 기반 | cto | 7 차원 알고리즘 결과를 단순 시퀀스가 아닌 DAG 로 확장하면 자연스럽게 병렬화 가능 | `tech-plan.md` §7 |
| 3 | SendMessage 채택은 **C-Level → sub-agent** 통신에 한정 (C-Level 간 핸드오프는 `docs/{feature}/{phase}/main.md` 파일 기반 유지) | cto | 파일 기반 핸드오프는 grep/감사 가능, append-only Decision Record 와 정합. SendMessage 는 ephemeral 한 작업 위임에만 | `tech-plan.md` §5 |
| 4 | `.vais/status.json` 스키마 v4 — `activeFeature` 단일 → `activeFeatures: string[]` + per-feature lock (`features.{name}.lock: {clevel, sessionId, acquiredAt}`) | cto | 멀티피처 동시 진행 시 phase 충돌 방지. lock 은 advisory (강제 X). | `tech-plan.md` §7 |
| 5 | `/schedule` 통합은 **CSO 보안 감사**와 **CBO finops** 만 우선. 나머지는 v2. | cto | 정기 작업 가치가 명확한 두 도메인부터 (CVE 변화 / 클라우드 비용 변동) | `tech-plan.md` §6 |
| 6 | **패턴 D 도입 (sub-agent background sessions + worktree)** — Decision #2 의 parallelGroup 모델을 sub-agent 레이어에도 적용. 별도 sub-toggle `agentTeams.subagentSessions` 로 granular 제어. | cto | 사용자 2026-05-16 결정 — O3 관찰을 In-scope 승격. sub-agent 동시 편집 (frontend + backend 같은 파일) 충돌 해소 필요. design phase 에 sub-agent lock + worktree merge 정책 박제. | `tech-plan.md` §4 Must-9, `architecture.md` (design) |
| 7 | **Sub-agent 결과 merge 정책** = 각 sub-agent 가 worktree branch (`feat/{feature}-{agent}`) 에서 작업 → C-Level 이 완료 신호 받아 feature branch 로 squash-merge | cto | git history 추적성 + sub-agent 단위 롤백 가능성. 자동 cleanup 은 가이드만 (사용자 의도 확인 우선 — memory `feedback_no_auto_git_restore`) | `architecture.md` §7 (신규) |

---

## 0. 아이디어 요약

| Key | Value |
|-----|-------|
| 한 줄 설명 | Claude Code 2.x Agent Teams 를 VAIS 오케스트레이션에 도입해 다중 C-Level 동시 실행과 멀티피처 동시 진행을 지원 |
| 배경 (문제/한계/필요성) | 현재 CEO 라우팅은 C-Level 을 순차 실행 — 의존성 없는 작업도 직렬 대기. 한 시점 한 피처 (`activeFeature` 단일). v0.66 sub-agent 박제 후 다음 병목은 라우팅 계층. |
| 타겟 사용자 | PO 1명 운영 모델 — 큰 피처 시 CPO/CBO/CSO 의 독립 작업으로 시간 단축. PO 가 결과만 확인. |
| 핵심 시나리오 | (1) PO `/vais ceo plan launch-new-product` → (2) CEO 7 차원 → `parallelGroup: [cpo, cbo, cso]` → (3) `claude agents` 가 3 개 background session dispatch → (4) 각 C-Level 산출물 박제 + main.md append-only merge → (5) CEO 다시 등급 표 → 다음 라운드 |

> MVP 매트릭스 / 경쟁 분석은 CPO PRD / CBO market-researcher 영역

## 0.7 PRD 입력 (CTO 전용 강행 체크)

| Key | Value |
|-----|-------|
| PRD 경로 | "없음 (강행 모드)" |
| 완성도 | missing |
| 검사 시각 | 2026-05-16 |

### 강행 모드 사유 (PRD 없음)

- 사용자 선택: CP-0 자동 강행 (system-reminder 의 "without stopping for clarifying questions" 지시 + 직전 대화에서 풍부한 컨텍스트)
- 가정한 요구사항:
  1) Agent Teams 는 **opt-in** 으로 기본 비활성 (기존 사용자 비파괴)
  2) C-Level 간 핸드오프는 파일 기반 유지 (감사 가능성 우선)
  3) "큰 피처" 정의는 CEO 7 차원 알고리즘이 자동 판정 (사용자 명시 X)

> ⚠️ 강행 모드 plan 은 가정 포함. design 단계에서 CPO 검증 권장 (사용자 시나리오 / acceptance criteria).

## 2. Plan-Plus 검증

### 2.1 의도 발견
> 근본 문제: VAIS 가 "PO 1명이 가상 조직 운영" 정체성을 표방하지만, 실제 실행은 직렬 — 조직 메타포가 깨짐. Agent Teams 는 조직 메타포를 실제 병렬 실행으로 구현하는 자연스러운 매핑.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|:---:|
| 1 | **Claude Code Agent Teams (background sessions)** | CC 네이티브, 무료, worktree 자동 격리 | CC 버전 의존, API 변경 리스크 | ✅ |
| 2 | 자체 멀티프로세스 (Node child_process) | 완전 제어 | 구현·유지비 큼, 세션 상태 동기화 직접 구현 필요 | ❌ |
| 3 | 직렬 유지 + sub-agent 병렬화 강화 | 안정성, 마이그레이션 불필요 | 정체성 후행 — "조직" 메타포 깨진 채 유지 | ❌ (부분 보완용) |
| 4 | `/loop` 기반 폴링 오케스트레이션 | 단순 | 진짜 병렬 아님 (시분할) | ❌ |

> Plan-Plus: 대안 1+3 hybrid — Agent Teams 가 메인, 미지원 환경은 직렬 fallback.

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만: C-Level 병렬화 + 멀티피처 status + 보안/finops 스케줄
- [x] 미래 요구사항 과잉 설계 없음: Agent Teams API 가 changed 되면 어댑터 1개 교체
- [x] 제거 가능한 기능: `/fork` 통합은 v2 로 (현재 가치 불명확)

## 4. 기능 요구사항 (요약)

| # | 기능 | 설명 | 우선순위 | 관련 파일 |
|---|------|------|:-------:|----------|
| 1 | C-Level 병렬 dispatch | CEO 라우팅 결과의 `parallelGroup` 을 받아 `claude agents` background sessions 동시 dispatch | Must | `lib/ceo-algorithm.js`, `skills/vais/utils/teams-dispatcher.js` (신규) |
| 2 | status.json v4 스키마 | `activeFeatures: string[]` + per-feature lock | Must | `lib/status.js`, `.vais/status.json` migration |
| 3 | SendMessage sub-agent 라이프사이클 | C-Level 이 sub-agent dispatch 후 SendMessage 로 후속 지시 | Should | `agents/_shared/work-rules.md` |
| 4 | `/vais teams status` 액션 | 활성 background sessions 목록 + 피처별 진행률 | Must | `skills/vais/utils/teams-status.md` (신규) |
| 5 | `/schedule` CSO 보안 감사 | 주 1회 자동 dependency-analyzer + secret-scanner | Should | `skills/vais/utils/schedule-cso.md` (신규) |
| 6 | `/schedule` CBO finops | 월 1회 자동 finops-analyst | Nice | `skills/vais/utils/schedule-cbo.md` (신규) |
| 7 | opt-in 토글 | `orchestration.agentTeams.enabled: false` 기본 | Must | `vais.config.json` |
| 8 | 직렬 fallback | Agent Teams 미지원/비활성 시 현재 sequential 워크플로우 그대로 | Must | 모든 진입점 — graceful degradation |
| 9 | Sub-agent background sessions + worktree (패턴 D) | C-Level 이 sub-agent 를 `claude agents` 로 dispatch + 각자 worktree branch | Must | `skills/vais/utils/subagent-dispatcher.js` (신규), `lib/worktree-manager.js` (신규) |
| 10 | Sub-agent worktree merge | sub-agent 완료 시 C-Level 이 결과 수집 + feature branch squash-merge | Must | `lib/worktree-manager.js` mergeBack API |
| 11 | Sub-agent lock | per-feature-per-agent lock (`features.{name}.subagentLocks: { [agent]: lock }`) | Should | `lib/status.js` |
| 12 | `agentTeams.subagentSessions` 별도 토글 | C-Level 병렬 (B) 과 sub-agent 병렬 (D) 독립 제어 — D 만 활성/비활성 가능 | Must | `vais.config.json` |

## 5. 정책 (비즈니스 규칙)

| # | 정책 | 규칙 |
|---|------|------|
| 1 | C-Level 병렬 한도 | 동시 dispatch 최대 4 (CC `claude agents` 권장 한도 고려) |
| 2 | 의존성 위반 금지 | CEO 가 `parallelGroup` 생성 시 `vais.config.json > cSuite.launchPipeline.dependencies` 위반하면 거부 |
| 3 | C-Level 간 핸드오프 = 파일 | SendMessage 로 C-Level → C-Level 직접 통신 금지. 반드시 `docs/{feature}/{phase}/main.md` append. |
| 4 | Lock 정책 | per-feature lock 은 advisory — 동일 C-Level 이 동일 phase 중복 진입 시 경고만 (강제 차단 X) |
| 5 | 스케줄 작업 결과 | `/schedule` 산출물은 `docs/_scheduled/{date}-{action}.md` 별도 폴더 (피처 산출물과 분리) |
| 6 | opt-in 비파괴 | `orchestration.agentTeams.enabled: false` (기본) 에서는 기존 0.67.0 동작과 byte-level 동일 |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | 큰 피처 (3+ C-Level) wall-clock 단축 | 직렬 대비 ≥ 35% 단축 (3개 병렬 가정, 통신 오버헤드 차감) |
| 보안 | Background session 파일 격리 | worktree 별 독립 git branch — main 직접 write 금지 |
| 확장성 | 의존성 그래프 확장 | 향후 sub-agent 단위 병렬화도 동일 모델 재사용 |
| 호환성 | Claude Code 버전 | 2.1.143+ (Agent Teams 검증 버전), 2.0.x 는 자동 fallback |
| 신뢰성 | Lock 미해제 복구 | 30분 이상 미응답 lock 은 stale 로 간주 — `claude agents cleanup` 가이드 |
| 관측성 | 진행 가시화 | `/vais teams status` + `.vais/dashboard.html` 확장 |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | `orchestration.agentTeams.enabled: false` 기본값에서 0.67.0 byte-level 동등 동작 | `node scripts/vais-validate-plugin.js` 통과 + 기존 5 완료 피처 재현 테스트 |
| SC-02 | CEO 가 의존성 없는 3 C-Level (CPO + CBO + CSO) 을 `parallelGroup` 으로 분류 | 통합 테스트: 가상 피처 `mock-multi-clevel` 에서 `parallelGroup.length ≥ 2` |
| SC-03 | `.vais/status.json` v3 → v4 마이그레이션 무손실 | 마이그레이션 스크립트 + 기존 5 피처 status 보존 검증 |
| SC-04 | `/vais teams status` 출력에 활성 sessions + 피처별 phase | Manual smoke test + scripts/test-teams-status.js |
| SC-05 | CC 2.0.x 환경 fallback 동작 | mock 환경에서 `claude agents` 미존재 시 sequential 경로 |
| SC-06 | 직렬 대비 wall-clock ≥ 35% 단축 (3-way C-Level 병렬, 패턴 B) | benchmark 스크립트 — performance-engineer (COO sub) 협업 |
| SC-07 | Sub-agent 병렬 (패턴 D) Do phase wall-clock ≥ 25% 단축 (frontend+backend+test 3-way) | benchmark 스크립트 — performance-engineer |
| SC-08 | Sub-agent worktree merge 무손실 (squash-merge 후 feature branch 에 frontend+backend 변경사항 모두 존재) | 통합 테스트 `tests/subagent-worktree-merge.test.js` |
| SC-09 | `subagentSessions: false` 일 때 패턴 D 코드 경로 미진입 (Agent 도구 병렬 = 패턴 C 그대로) | 단위 테스트 + flag 토글 검증 |

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `vais.config.json` | modify | `orchestration.agentTeams` 섹션 추가 (opt-in 토글 + 한도 + `subagentSessions` sub-toggle) |
| `.vais/status.json` | migrate | v3 → v4 (`activeFeature` → `activeFeatures[]` + lock + `subagentLocks`) |
| `lib/ceo-algorithm.js` | modify | `parallelGroup` 필드 산출 (의존성 DAG 분석) |
| `lib/status.js` | modify | multi-feature lock API + subagentLocks API |
| `lib/worktree-manager.js` | create | git worktree 생성/merge/cleanup wrapper (패턴 D) |
| `skills/vais/utils/teams-dispatcher.js` | create | C-Level background session dispatch wrapper |
| `skills/vais/utils/subagent-dispatcher.js` | create | sub-agent background session + worktree dispatch (패턴 D) |
| `skills/vais/utils/teams-status.md` | create | `/vais teams status` 액션 (C-Level + sub-agent 통합 표시) |
| `skills/vais/utils/schedule-cso.md` | create | 주기 보안 감사 |
| `skills/vais/utils/schedule-cbo.md` | create | 주기 finops 분석 |
| `agents/ceo/ceo.md` | modify | `parallelGroup` 출력 형식 박제 |
| `agents/cto/cto.md` | modify | sub-agent 병렬 dispatch 시 worktree 모드 분기 (패턴 D) |
| `agents/_shared/work-rules.md` | modify | SendMessage 사용 규칙 (sub-agent only) + worktree merge 정책 |
| `docs/_scheduled/` | create | 스케줄 산출물 폴더 |
| `CLAUDE.md` | modify | Mandatory Rules #18 (Agent Teams opt-in 정책) + #19 (sub-agent worktree 정책) |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `.vais/status.json` | read | `lib/status.js` 전체 호출자 | v3 → v4 자동 마이그레이션 필요 |
| `activeFeature` 필드 | read | session-start.js, dashboard | 단일 → 배열 변환 시 `activeFeatures[0]` fallback |
| CEO 7 차원 결과 | read | `agents/ceo/ceo.md` 진입 절차 | `parallelGroup` 새 필드 추가, 기존 `activeCLevel` 유지 |

### Verification
- [ ] 모든 consumer 확인 완료 (status.json, dashboard, session-start)
- [ ] breaking change 없음 확인 — opt-in 토글 + 마이그레이션 스크립트로 보장

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 오케스트레이션 | Claude Code 2.x Agent Teams (background sessions) | 신규 핵심 의존 — opt-in |
| 통신 | SendMessage (C-Level → sub-agent 한정) | ephemeral 작업 위임 |
| 핸드오프 | 파일 기반 (`docs/{feature}/{phase}/main.md` append-only) | 감사 가능성 — 기존 모델 유지 |
| 격리 | git worktree (CC 자동 생성) | 파일 충돌 방지 |
| 스케줄 | Claude Code `/schedule` (cron, Anthropic 인프라) | PC 꺼져도 동작 |
| 의존성 그래프 | `vais.config.json > cSuite.launchPipeline.dependencies` (기존) | 신규 추가 없음 |
| Lock | filesystem advisory (status.json 내부) | 외부 의존 X |
| Migration | Node 18 fs/promises | 기존 도구 |

## 관찰 (후속 과제)

> Rule #9: 자발 감지 확장 후보는 여기 기록만. In-scope 자동 승계 금지.

- **O1**: `/fork` 통합 — 현재 피처를 분기해 "alternative implementation" 실험. v2 후보.
- **O2**: `/ultrareview` 자동 발사 (예: CTO do 완료 후 자동) — 사용자 비용 결정 영역, 신중 검토.
- **O3 (resolved → in-scope)**: sub-agent 단위 worktree 격리 — 2026-05-16 사용자 결정으로 In-scope 승격. 패턴 D / Decision #6,7 / Must-9~12 / Impact Analysis 추가 자원 참조.
- **O4**: `claude agents` 대시보드 정보를 `.vais/dashboard.html` 에 임베드 — UX 통합.
- **O5**: SendMessage 로그 박제 — 디버깅용. v2.
- **O6**: Multi-PO 동시 작업 — 현 모델은 PO 1 명 가정. 팀 사용 시 lock 충돌 해소 룰 필요.

---

## Artifact References

| Artifact | Phase | Owner | 한 줄 요약 | 파일 |
|----------|-------|:-----:|-----------|------|
| 기술 계획 | plan | cto | 본 문서 — Agent Teams 도입 7 결정 + 8 기능 요구사항 + 6 SC | `docs/agent-teams-orchestration/01-plan/tech-plan.md` |

> PRD 부재 — design phase 진입 전 CPO 권장 (강행 모드 가정 검증).

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — CTO plan, 강행 모드 (CP-0 자동), Standard 템플릿, 5 결정 / 8 기능 / 6 SC |
| v1.1 | 2026-05-16 | 패턴 D (sub-agent worktree 병렬) In-scope 승격 — 사용자 결정. Decision #6,7 / Must-9~12 / SC-07~09 / Impact Analysis 4 신규 자원 추가. O3 관찰 resolved. |

<!-- template version: plan-standard v0.66.2 -->
