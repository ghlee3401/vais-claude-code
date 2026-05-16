---
name: teams-status
description: VAIS Agent Teams 활성 세션 + sub-agent worktree + 합성자 추적 표시. v0.68+ agent-teams-orchestration 부속. `agentTeams.enabled=false` 시 미활성 안내.
---

# `/vais teams status`

활성 Agent Teams 세션 및 sub-agent worktree 상태를 보여준다.

## 실행 지침

1. `vais.config.json > orchestration.agentTeams.enabled` 확인:
   - `false` 또는 키 없음 → 안내 메시지: "Agent Teams 비활성 (`enabled: false`). 활성화하려면 `vais.config.json` 수정 필요."
   - `true` → 진행

2. Bash 로 다음 실행:
   ```bash
   node -e "
   const status = require('./lib/status');
   const s = status.getStatus();
   console.log(JSON.stringify({
     version: s.version,
     activeFeatures: s.activeFeatures || (s.activeFeature ? [s.activeFeature] : []),
     featuresLocks: Object.fromEntries(Object.entries(s.features || {}).map(([k, v]) => [k, {
       lock: v.lock,
       subagentLocks: v.subagentLocks || {},
       synthesisHistory: v.synthesisHistory || {},
     }])),
   }, null, 2));
   "
   ```

3. 출력 결과를 응답에 다음 표로 박제:

   ```
   ## VAIS Agent Teams 상태

   ### 활성 피처
   | Feature | 현재 phase | C-Level lock | Sub-agent locks | Synthesizer (최근 phase) |
   |---------|-----------|--------------|-----------------|--------------------------|
   | {name}  | {phase}    | {clevel} ({elapsed}) | {agent 목록} | {synthesizer} |

   ### Stale 감지
   - {lockStaleMinutes 초과 lock 목록 또는 "없음"}

   ### 권장 조치
   - {stale 있으면 `/vais teams cleanup` 안내}
   ```

4. 추가: `git worktree list` 실행하여 `.claude/worktrees/` 하위 worktree 표시:
   ```bash
   git worktree list --porcelain | grep -A2 "\.claude/worktrees"
   ```

## 출력 예시

```
## VAIS Agent Teams 상태

### 활성 피처
| Feature                       | 현재 phase | C-Level lock         | Sub-agent locks                   | Synthesizer  |
|-------------------------------|-----------|----------------------|-----------------------------------|--------------|
| agent-teams-orchestration     | do        | cto (3분 전)         | frontend-engineer, backend-engineer | cto (design) |

### Sub-agent worktrees
- .claude/worktrees/agent-teams-orchestration-frontend (branch: feat/agent-teams-orchestration-frontend, age: 3m)
- .claude/worktrees/agent-teams-orchestration-backend (branch: feat/agent-teams-orchestration-backend, age: 5m)

### Stale 감지
- 없음

### 권장 조치
- (작업 완료 후) `/vais teams cleanup` 으로 worktree 정리
```

## Notes

- 자동 cleanup 안 함 (memory `feedback_no_auto_git_restore` 정합) — 식별만, cleanup 은 사용자 명시 호출
- 활성 피처 없으면 "현재 활성 Agent Teams 세션 없음" 출력
