---
owner: cto
artifact: test-plan
phase: do
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: test-engineer
summary: "신규 5 surface 테스트 코드 인덱스 — 3 파일 필수 + 1 통합 smoke / AC1~AC9 커버리지 매핑"
---

# Test Plan — agent-teams-sendmessage-real

> Phase: Do | Agent: test-engineer | Date: 2026-05-17
> 참조: `02-design/flag-detection-design.md`, `01-plan/tech-plan.md`, `01-plan/security-gate-plan.md`

## 1. 테스트 파일 인덱스

| # | 파일 | 케이스 수 | 커버 AC |
|---|------|---------|---------|
| 1 | `tests/cc-version-detect-flag.test.js` | 11 | AC1, AC2, AC3 |
| 2 | `tests/conversation-orchestrator-sendmessage.test.js` | 13 | AC4, AC8 + T1/T2/T3 |
| 3 | `tests/session-start-hook-warning.test.js` | 6 | AC5 |
| 4 | `tests/agent-teams-sendmessage-integration.test.js` | 7 | AC1~AC3, AC6, AC7, AC8, AC9 |

총 37 케이스 (필수 30 + 통합 7).

## 2. AC → 테스트 매핑

| AC | 설명 | 테스트 파일 | 케이스명 |
|----|------|-----------|---------|
| AC1 | `detectExperimentalAgentTeamsFlag` export | #1, #4 | `AC1 — detectExperimentalAgentTeamsFlag export 존재` |
| AC2 | `checkAgentTeamsAllowed` simulationMode + flagInfo 필드 | #1, #4 | `AC2 — checkAgentTeamsAllowed: 반환 타입...` |
| AC3 | env set → simulationMode=false, unset → true | #1 | `케이스 2~6`, `AC3 — checkAgentTeamsAllowed` |
| AC4 | conversation-orchestrator event.mode 필드 박제 | #2 | `AC4 — simulated 모드 event 에 mode 필드 박제` |
| AC5 | session-start hook 경고 4 조건 분기 | #3 | `AC5 — 조건 1~4` |
| AC6 | ONBOARDING.md "Agent Teams 활성화" 섹션 | #4 | `AC6 — ONBOARDING.md...` |
| AC7 | decisions-log.template.md mode/messageHash 컬럼 | #4 | `AC7 — templates/decisions-log.template.md...` |
| AC8 | 0.68.0 byte-compat (dryRun=true 기존 동작 유지) | #2, #4 | `AC8 — ConversationSession dryRun=true`, `AC8 — simulationMode=true` |
| AC9 | settings.json 자동 수정 코드 0 hit | #4 | `AC9 — lib/ + skills/ + hooks/...` |

## 3. T1~T3 mitigation → 테스트 매핑

| 위협 | 테스트 파일 | 케이스 |
|------|-----------|--------|
| T1 (`_scanSecrets`) | #2 | 정상 body 통과 / password 패턴 throw / api_key 패턴 throw / token 패턴 throw |
| T2 (`_validateActor`) | #2 | parallelGroup 멤버 pass / main pass / unknown drop (return false) |
| T3 (`_enforceMainSubDirectionality`) | #2 | main → pass / sub-agent → throw [T3] |
| T3→T2→T1 순서 | #2 | `real 모드 — T3→T2→T1 호출 순서` (spy 방식) |
| simulated 모드 미호출 | #2 | `AC8 — simulationMode=true: T3/T2/T1 미호출` |

## 4. Mock 전략

| 대상 | 전략 | 이유 |
|------|------|------|
| `process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | 직접 조작 + 원복 함수 | env 변수 조작이 가장 단순하고 모듈 내부와 정합 |
| `~/.claude/settings.json` | `os.tmpdir()` 임시 디렉토리 + HOME 재지정 | 실 사용자 환경 오염 방지 |
| `_resetFlagCache()` | 매 케이스 setup/teardown 에서 호출 | `_flagCached` 전역 상태 격리 필수 |
| SendMessage CC harness | `sendMessageFn` mock 함수 (`async () => '합의'`) | 실 CC harness 미호출 — 단위 테스트 격리 |
| T1~T3 메서드 | 인스턴스 메서드 spy (call order 추적) | `prototype` 변조 없이 인스턴스 레벨만 교체 |
| `process.stderr.write` | 임시 교체 + finally 원복 | AC5 경고 출력 캡처 |

## 5. 알려진 한계 및 Skip 이유

| 케이스 | Skip 이유 | 해결 조건 |
|--------|---------|---------|
| CC 2.1+ 환경에서만 `simulationMode=true` 완전 재현 | `claude --version` 실행 결과에 의존 | CI 에서 CC 2.1+ 설치 또는 `getClaudeVersion` mock 주입 |
| real SendMessage 실제 호출 (CC harness) | CC harness 없는 환경에서 불가 | CC 2.1+ + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경 필요 |
| T1~T3 구현 미완료 시 skip | backend-engineer 병렬 진행 중 | 구현 박제 후 재실행 시 자동 통과 |
| `session-start.js` 경고 분기 미구현 | 설계서 의사코드 재현으로 대체 | hook 구현 후 `isHookWarningImplemented()` 가 true 반환 |
| `decisions-log.template.md` mode/messageHash 미박제 | 파일 미수정 | backend-engineer 가 template 박제 후 AC7 통과 |
| root 실행 환경 케이스 8 | `chmod 0o000` 이 root 에서 무의미 | 비-root 환경에서만 유효 |

## 6. 실행 방법

```bash
# 전체 신규 테스트만 실행
node --test tests/cc-version-detect-flag.test.js
node --test tests/conversation-orchestrator-sendmessage.test.js
node --test tests/session-start-hook-warning.test.js
node --test tests/agent-teams-sendmessage-integration.test.js

# 기존 전체 suite 와 함께 (비파괴성 AC8 검증)
node --test tests/
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 4 파일 37 케이스, AC1~AC9 + T1~T3 매핑 |
