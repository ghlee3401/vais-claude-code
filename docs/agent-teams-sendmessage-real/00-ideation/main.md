---
owner: ceo
artifact: ideation-decision
phase: ideation
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: ceo-direct
summary: "CC 의 SendMessage 도구 통합 (experimental flag 토글). 0.68.0 simulation → flag on 시 real 대화 dogfood. graceful degradation UX. 1.0.0 release 의 선행 작업."
---

# agent-teams-sendmessage-real — Ideation (CEO 결정)

> Phase: 💡 ideation | Owner: CEO | Date: 2026-05-17
> 출력: ideation-decision

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **요청** | "vais-1-0-0-release plan dogfood 중 SendMessage 미가용 발견 → 실 SendMessage 구현 후 1.0.0 재진입" (PO, 2026-05-17) |
| **Research 결과** | SendMessage 는 **이미 존재하는 Claude Code 내장 도구**. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경 변수 / settings.json 으로 활성화. 우리가 ToolSearch 에서 못 찾은 이유 = experimental flag off (Known bug: anthropics/claude-code#47021) |
| **Scope 재정의** | "구현" 이 아닌 **"통합"**. (1) flag 감지 (2) ONBOARDING 문서화 (3) orchestrator flag-aware 분기 (4) decisions-log 에 real SendMessage hash 박제 (5) dogfood = vais-1-0-0-release 재개 |
| **활성 C-Level** | CEO + CTO + CSO. CPO/CBO/COO 제외 (내부 인프라). |

## 2. CEO 판단 근거 (algorithm baseline + LLM 보강)

### 7 차원 등급 표

| # | 차원 | Algorithm | LLM 보강 | 사유 |
|---|------|-----------|---------|------|
| 1 | 보안 | low | **medium** | inter-agent 메시지 leak / agent ID 위조 / prompt injection 경유 sub-agent |
| 2 | 컴플라이언스 | none | none | — |
| 3 | UX | low | low | 내부 인프라 |
| 4 | 데이터모델 | low | low | — |
| 5 | 외부통신 | low | **medium** | CC harness API 의존 = 외부 surface |
| 6 | 성능 | low | low | — |
| 7 | 제품정의 | medium | low | 내부 인프라 PRD 불요 |

### activeCLevel

| Source | activeCLevel | conversationMode |
|--------|--------------|-------------------|
| Algorithm baseline | `[ceo, cpo, cto]` | disabled |
| **LLM 보강 (채택)** | **`[ceo, cto, cso]`** | disabled (자기 자신 구현 단계 — chicken-and-egg) |

**보강 사유**: CPO 제외 (내부 인프라 `feedback_internal_feature_no_persona`) + CSO 추가 (보안 surface 2 차원 medium) + COO 제외 (1.0.0 release narrative 가 함께 처리)

## 3. 사용자 결정 기록 (Research + 3 클릭)

| # | 질문 | 선택 | 사유 |
|---|------|------|------|
| 1 | Research 먼저 vs 가정 진행 | **Research 먼저** | unknown 큰 영역 — 가정 위험 |
| 2 | (Research 후) Scope 재정의 방향 | **행위 통합 + 1.0.0 증거 박제** | SendMessage = CC 내장. 구현 X, 통합 O |
| 3 | flag off UX | **Graceful degradation** | 경고 1줄 + simulation fallback + ONBOARDING 가이드 |

## 4. Artifacts (Phase 별 산출물 계획)

| Phase | Artifact | Owner | Agent | 비고 |
|-------|----------|-------|-------|------|
| 00-ideation | ideation-decision (본 문서) | CEO | ceo-direct | ✅ |
| 01-plan | tech-plan | CTO | infra-architect | 통합 작업 분해 + AC |
| 01-plan | security-gate-plan | CSO | security-auditor | inter-agent 메시지 보안 surface |
| 02-design | flag-detection-design | CTO | infra-architect | `cc-version-detect.js` 확장 + orchestrator 분기 |
| 02-design | onboarding-doc-design | CTO | infra-architect | ONBOARDING.md 활성화 섹션 + CLAUDE.md Rule 추가 |
| 03-do | implementation-log | CTO | cto-direct | 5 통합 surface |
| 03-do | security-audit | CSO | security-auditor + secret-scanner | Gate A |
| 04-qa | gap-analysis | CTO | qa-engineer | dogfood smoke (flag on 환경 시) |
| 04-qa | code-review | CSO | code-reviewer | Gate C |
| 05-report | completion-report | CTO | cto-direct | 통합 검증 결과 |

## 5. 변경 surface (잠정 5건)

| # | 파일 | 변경 요지 |
|---|------|----------|
| 1 | `lib/cc-version-detect.js` | `checkAgentTeamsAllowed()` 확장 — env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 감지 + `simulationMode` 필드 추가 |
| 2 | `skills/vais/utils/conversation-orchestrator.js` | SendMessage 도구 가용 여부 detect → real / simulation 분기 (FSM 의 review-window 단계 핵심) |
| 3 | `hooks/session-start.js` | agentTeams.enabled=true + flag off 시 경고 1줄 + ONBOARDING 링크 |
| 4 | `ONBOARDING.md` | "Agent Teams 활성화" 섹션 — env 변수 / settings.json / CC 버전 확인 가이드 |
| 5 | `templates/decisions-log.template.md` | `[simulated]` vs `[real]` event 마커 + SendMessage hash 필드 |

## 6. Out-of-Scope

| 항목 | 사유 |
|------|------|
| SendMessage 프로토콜 자체 구현 | CC 내장 (research 확인). 우리는 통합만 |
| CC 2.0.x 사용자 지원 | 이미 cc-version-detect.js 가 < 2.1.0 fallback 처리. 그대로 |
| Multi-PO lock | v2.1 후속 후보 #5. 본 피처 범위 외 |
| LLM-as-judge | v2.1 후속 후보 #3. 본 피처 범위 외 |
| 1.0.0 release 작업 | `vais-1-0-0-release` 별도 피처 — 본 피처 완료 후 재개 |

## 7. Next Phase

**추천**: `/vais cto plan agent-teams-sendmessage-real`

- CTO mandatory PDCA 진입점.
- Plan 에서 5 변경 surface + AC + 의존성 + CSO Gate 위임 박제.
- dogfood = 본 피처 design/do/qa 도 **simulation 모드 유지** (chicken-and-egg — flag detection 자체를 구현 중인데 dogfood 못 함). 완료 후 `vais-1-0-0-release` 재개 시 flag on 으로 진짜 dogfood.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — Research 결과 + 3 사용자 결정 + 7 차원 표 + 활성 C-Level + 5 surface + Out-of-scope |
