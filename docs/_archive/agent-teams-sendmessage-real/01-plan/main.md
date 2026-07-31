---
owner: cto
artifact: main
phase: plan
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: cto-direct
summary: "Plan phase 인덱스 — CC SendMessage 통합 5 surface + 9 AC + CSO Gate 위임 + 비파괴성"
---

# agent-teams-sendmessage-real — Plan (인덱스, v1)

> Phase: 📋 plan | Owner: CTO | Mode: simulation (chicken-and-egg) | Date: 2026-05-17
> Model: v1 인덱스 (5 섹션, 본문 X) — `agentTeams.enabled=false` 정합

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 0.68.0 의 agent-teams v2 가 simulation by design. 사용자가 ToolSearch 로 SendMessage 못 찾음 (Issue #47021). 1.0.0 narrative 정직성 위험. |
| **Solution** | CC 내장 SendMessage 도구의 **통합** — env flag 감지 + orchestrator 분기 + hook 경고 + ONBOARDING 가이드 + decisions-log enhance. 5 surface, 9 AC. |
| **Effect** | flag on 환경 = real dogfood 가능. flag off = graceful degradation (0.68.0 byte-compat). 사용자 작업 안 멈춤. |
| **Core Value** | vais-1-0-0-release narrative 정직성 확보. "agent-teams v2 대화-합성 모델" 라벨이 조건부로 정확. |

## 2. Decision Record (multi-owner, append-only)

| # | Decision | Owner | Rationale | Source |
|---|----------|:-----:|-----------|--------|
| 1 | Scope = 통합 (구현 X) | cto | Research — SendMessage 는 CC 내장 (Issue #47021) | ideation §1 |
| 2 | UX = Graceful degradation | cto | 1.0.0 GA 가 experimental 강요 X. byte-compat | ideation §3 #3 |
| 3 | env > settings.json 우선순위 | cto | shell-level override 가 expected (CC 표준) | tech-plan §2-A |
| 4 | conversation-orchestrator FSM 재사용 (재설계 X) | cto | 기존 5-state 유효, 분기점만 추가 | tech-plan §3 |
| 5 | settings.json 자동 수정 금지 | cto | `feedback_no_auto_git_restore` 정합 — 사용자 환경 invariant | tech-plan §3 |
| 6 | 본 피처 dogfood skip (chicken-and-egg) | cto | flag detection 구현 중 dogfood 불가. vais-1-0-0-release 재개 시 dogfood | tech-plan §3 |
| 7 | 본 피처 = 0.69.0 (Minor) | cto | Minor — 새 기능 + breaking 없음. 1.0.0 = 별도 피처 | tech-plan §6 |
| 8 | 3 Gate 적용 (A/B/C) | cso | inter-agent 보안 surface 신규 → Gate A 필수. Gate B 는 본 피처 do 후. Gate C 는 코드 리뷰 | security-gate-plan §1 |
| 9 | T2 actor whitelist Do 시 함께 구현 | cso | real mode 분기 추가 + whitelist 미박제 시 Gate A 실패. orchestrator 동일 PR | security-gate-plan §4 |
| 10 | T3 (prompt injection) = 최우선 mitigation | cso | Risk High. main → sub 일방향 흐름만 허용 (work-rules.md v2.3 강화) | security-gate-plan §4 |
| 11 | T1 (leak) mitigation = SendMessage 송신 전 시크릿 grep | cso | secret-scanner 룰 재사용. work-rules.md 박제 | security-gate-plan §4 |

## 3. Artifacts

| Artifact | Owner | 한 줄 요약 | 파일 |
|----------|:-----:|-----------|------|
| ideation-decision | ceo | Research 결과 + 3 사용자 결정 + 5 surface 식별 | `../00-ideation/main.md` |
| tech-plan | cto | 5 surface 작업 분해 + 9 AC + 비파괴성 | `./tech-plan.md` |
| security-gate-plan | cso | 3 Gate + 5 AC + T1~T3 mitigation (T3 최우선) — 115줄 ✅ | `./security-gate-plan.md` |

## 4. CEO 판단 근거

algorithm baseline `[ceo, cpo, cto]` (productDef=medium 기본) — **LLM 보강 채택** = `[ceo, cto, cso]`:

- **CPO 제외**: 내부 인프라 (`feedback_internal_feature_no_persona`)
- **CSO 추가**: 보안 medium — inter-agent leak / agent ID 위조 / prompt injection 경유
- **COO 제외**: marketplace 재배포는 vais-1-0-0-release 가 처리

conversationMode = **disabled** (chicken-and-egg). 본 피처 design/do/qa 는 simulation 유지.

## 5. Next Phase

**추천**: `/vais cto design agent-teams-sendmessage-real`

- CTO design 에서 5 surface 의 인터페이스 시그니처 + 알고리즘 + T2 actor whitelist 설계 + T3 main→sub 일방향 정책 박제.
- 본 피처 완료 후: `/vais cto design vais-1-0-0-release` (1.0.0 재개)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 5 섹션 인덱스 (v1) + 7 CTO 결정 + 3 artifact |
| v1.1 | 2026-05-17 | CSO plan append — 4 CSO 결정 (#8~#11) + security-gate-plan 박제 확인 |
