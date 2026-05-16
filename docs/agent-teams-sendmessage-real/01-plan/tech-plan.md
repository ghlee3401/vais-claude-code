---
owner: cto
artifact: tech-plan
phase: plan
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: cto-direct
summary: "CC 내장 SendMessage 도구 통합 — 5 surface (env detect / orchestrator 분기 / hook 경고 / ONBOARDING / decisions-log enhance) + graceful degradation"
---

# Tech Plan — agent-teams-sendmessage-real

> Phase: 📋 plan | Owner: CTO | Mode: simulation (chicken-and-egg)
> 참조: [ideation main.md](../00-ideation/main.md) + [security-gate-plan.md](./security-gate-plan.md) (CSO 작성 예정)

## 1. 요청 원문

> "sendmessage 구현 후에 1.0.0 릴리즈로 다시 돌아갈게" (PO, 2026-05-17)
>
> Research 결과 (CEO ideation 박제): SendMessage = CC 내장 도구. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 토글 필요. 구현이 아닌 **통합** 작업.

## 2. In-Scope (5 변경 surface)

### 2-A. `lib/cc-version-detect.js` 확장

| 변경 | 상세 |
|------|------|
| 신규 함수 | `detectExperimentalAgentTeamsFlag()` — env 변수 + settings.json 양쪽 체크 |
| `checkAgentTeamsAllowed()` 확장 | 반환 객체에 `simulationMode: boolean` 필드 추가. version OK + enabled OK + env flag missing → `allowed: true, simulationMode: true` |
| 우선순위 | env 변수 (`process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) → settings.json (`~/.claude/settings.json` 의 동명 키) |
| 캐시 | 기존 `_cached` 패턴 재활용 — 동일 세션 중복 체크 방지 |

### 2-B. `skills/vais/utils/conversation-orchestrator.js` 분기

| 변경 | 상세 |
|------|------|
| 진입 시 detect | ConversationSession 생성 시 `checkAgentTeamsAllowed()` 호출 → `simulationMode` 캡처 |
| `[real]` 모드 | SendMessage 도구 호출 (CC harness) — review-window FSM 전이에서 실제 메시지 송신 |
| `[simulated]` 모드 | 0.68.0 와 동일 — CTO 일괄 합성 시점에 가상 review-window 처리 |
| Event 박제 | event 객체에 `mode: 'real' \| 'simulated'` 필드 + (real 인 경우) `messageHash: string` |

### 2-C. `hooks/session-start.js` 경고

| 조건 | 동작 |
|------|------|
| `agentTeams.enabled=true` + env flag missing | stderr 1줄 출력: `⚠️ Agent Teams enabled but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env not set — using simulation. See ONBOARDING.md#agent-teams-activation` |
| `agentTeams.enabled=true` + env flag set + CC version < 2.1 | `⚠️ Agent Teams requires Claude Code 2.1+ — sequential fallback` |
| `agentTeams.enabled=true` + env flag set + CC 2.1+ | (조용) — 정상 활성 |
| `agentTeams.enabled=false` | (조용) |

### 2-D. `ONBOARDING.md` 활성화 섹션

신규 H2 섹션 "Agent Teams 활성화 (선택)" — 위치는 "Getting Started" 직후. 5 단계:

1. CC 2.1+ 확인: `claude --version`
2. env 변수 set: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
3. settings.json 영구화: `~/.claude/settings.json` 에 `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` 추가
4. vais.config 활성: `vais.config.json > orchestration.agentTeams.enabled = true`
5. 검증: `/vais status` 출력에 `SendMessage: real` 확인

각 단계 1줄 + 예시 명령 (코드 블록). 총 ~30 줄.

### 2-E. `templates/decisions-log.template.md` enhance

| 변경 | 상세 |
|------|------|
| events 표 헤더 | `mode` 컬럼 추가 — `real` / `simulated` enum |
| events 표 헤더 | `messageHash` 컬럼 추가 — real 모드만 채움, simulated 는 `—` |
| 본문 주석 | "real 모드 = CC SendMessage 도구 사용 / simulated = CTO 일괄 합성. event-type 정의는 동일" 추가 |
| 하위 호환 | 기존 v1.0 timeline 그대로 (`mode`/`messageHash` 빈 컬럼 허용). 신규 phase 만 채움 |

## 3. Out-of-Scope

| 항목 | 사유 |
|------|------|
| SendMessage 자체 구현 | CC 내장. research 확인 |
| `lib/conversation-orchestrator.js` 의 FSM 자체 재설계 | 기존 5-state (draft/review-window/objection-raised/revision/consensus-reached) 재사용 |
| Multi-PO lock / LLM-as-judge / SC-06 benchmark | v2.1 후속 후보 (별도 피처) |
| 본 피처 자체의 dogfood | chicken-and-egg — flag detection 을 구현 중에 dogfood 불가. vais-1-0-0-release 재개 시 dogfood |
| settings.json 자동 작성 | 사용자 명시 — 자동 수정 금지 (`feedback_no_auto_git_restore` 정합 — 사용자 환경 자동 변경 금지) |

## 4. AC (Acceptance Criteria)

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC1 | `cc-version-detect.js` 에 `detectExperimentalAgentTeamsFlag()` export | `node -e "console.log(require('./lib/cc-version-detect').detectExperimentalAgentTeamsFlag)"` |
| AC2 | `checkAgentTeamsAllowed()` 반환에 `simulationMode` 필드 존재 | `console.log(...).simulationMode !== undefined` |
| AC3 | env 변수 set 시 simulationMode=false, unset 시 true (모두 enabled=true 가정) | unit test (test/cc-version-detect.test.js 확장) |
| AC4 | conversation-orchestrator 가 mode 필드 박제 | event 객체에 `mode` 필드 확인 |
| AC5 | session-start hook 경고 3 조건 정확히 분기 | smoke test — 4 case 시나리오 |
| AC6 | ONBOARDING.md 에 "Agent Teams 활성화" 섹션 존재 + 5 단계 박제 | `grep -A 5 "Agent Teams 활성화" ONBOARDING.md` |
| AC7 | decisions-log template 에 `mode` + `messageHash` 컬럼 헤더 박제 | `grep "mode.*messageHash" templates/decisions-log.template.md` |
| AC8 | 비파괴성 — 기존 0.68.0 동작 byte-level 동등 (env unset + agentTeams.enabled=false) | validate-plugin 0 err / 0 warn, 309/312 tests pass 유지 |
| AC9 | settings.json 자동 수정 코드 없음 — 사용자 환경 invariant | `grep -r "fs.writeFile.*settings.json" lib/ skills/ hooks/` → 0 hit |

## 5. 의존성 + Hand-off

### 의존성 그래프

```
ideation (완료) → plan (현재, CTO 단독 sequential)
                     ↓
              CSO Gate 위임 (보안 surface 검토)
                     ↓
           design (cc-version-detect 시그니처 확정 + orchestrator 분기 알고리즘)
                     ↓
                 do (5 surface 구현)
                     ↓
           qa (Gate A/C + smoke test 4 case)
                     ↓
              report (1.0.0 narrative 의존 해소 확인)
```

### CSO 위임 — security-gate-plan.md

- inter-agent SendMessage 보안 surface (3 위협 — leak / 위조 / prompt injection 경유)
- Gate A 진입 전 secret-scanner + dependency-analyzer
- Gate C 코드 리뷰 — 신규 5 surface

### 다음 단계: design phase

- CTO infra-architect 가 5 surface 의 인터페이스 시그니처 + 알고리즘 확정
- ONBOARDING.md 섹션 초안 draft

## 6. 비파괴성 (1.0.0 narrative 의존)

- 본 피처 = vais-1-0-0-release 의 선행. 완료 후 1.0.0 의 CHANGELOG `[1.0.0]` 의 agent-teams 라벨이 정확히 표기 가능:
  > "agent-teams v2 — Lazy Consensus synthesizer 모델. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 활성 시 real SendMessage / 미활성 시 simulation graceful degradation."
- 본 피처 자체는 0.69.0 (Minor) — 새 기능 추가 + breaking 없음.

## 관찰 (후속)

- **CC SDK 사용 가능성**: anthropics/claude-agent-sdk-python 도 SendMessage 지원. Node 통합 가능성 (별도 피처)
- **`/bg` 와 통합**: 백그라운드 세션을 vais-code 가 자체 관리 가능. v2.1 후속
- **agent ID 보존**: 0.68.0 design 결정 "재진입 = 새 세션 fresh" — real SendMessage 환경에선 ID 보존 가능 → 정책 재검토 candidate

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 5 surface + 9 AC + 의존성 + 비파괴성 |
