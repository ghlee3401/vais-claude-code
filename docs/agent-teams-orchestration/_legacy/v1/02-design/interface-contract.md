---
owner: cto
artifact: interface-contract
phase: design
feature: agent-teams-orchestration
generated: 2026-05-16
summary: "parallelGroup 필드 스키마 / advisory lock 형식 / SendMessage 사용 패턴 / vais.config.json agentTeams 토글 — 4개 인터페이스 계약"
---

# agent-teams-orchestration — Interface Contracts (CTO)

> Design phase | Owner: CTO | Date: 2026-05-16
> 참조: [architecture.md](./architecture.md), [migration-plan.md](./migration-plan.md)

## 1. `vais.config.json > orchestration.agentTeams` (opt-in)

```json
{
  "orchestration": {
    "agentTeams": {
      "enabled": false,
      "subagentSessions": false,
      "maxConcurrentSessions": 4,
      "maxConcurrentSubagents": 3,
      "fallbackMode": "sequential",
      "lockStaleMinutes": 30,
      "worktreeRoot": ".claude/worktrees",
      "worktreeAutoCleanup": false,
      "schedule": {
        "csoAuditCron": "0 3 * * 1",
        "cboFinopsCron": "0 4 1 * *"
      }
    }
  }
}
```

| Key | Type | Default | 설명 |
|-----|------|---------|------|
| `enabled` | bool | `false` | opt-in 토글. false = 0.67.0 byte-level 동등 |
| `subagentSessions` | bool | `false` | 패턴 D (sub-agent worktree 병렬) sub-toggle. false 면 패턴 C (단일 세션 Agent 도구 병렬) 그대로 — `enabled` 와 독립 |
| `maxConcurrentSessions` | int | `4` | C-Level parallelGroup 최대 크기 |
| `maxConcurrentSubagents` | int | `3` | sub-agent 동시 worktree 최대 (frontend+backend+test 기준) |
| `fallbackMode` | enum | `"sequential"` | CC 2.0.x 또는 enabled=false 시 동작 |
| `lockStaleMinutes` | int | `30` | stale lock 경고 threshold (C-Level + sub-agent 공통) |
| `worktreeRoot` | string | `.claude/worktrees` | sub-agent worktree 디렉토리 루트 |
| `worktreeAutoCleanup` | bool | `false` | stale worktree 자동 cleanup 금지 — 사용자 명시 호출만 (memory `feedback_no_auto_git_restore`) |
| `schedule.csoAuditCron` | string\|null | `"0 3 * * 1"` | 주 1회 월요일 새벽 3시 |
| `schedule.cboFinopsCron` | string\|null | `"0 4 1 * *"` | 월 1회 1일 새벽 4시 |

## 2. CEO 출력 — `parallelGroup` 필드

`lib/ceo-algorithm.js > analyzeCEO()` 반환값 확장:

```typescript
type AnalyzeCEOResult = {
  // 기존 필드 (0.67.0 호환)
  dimensions: { [key: string]: 'high' | 'medium' | 'low' | 'n/a' };
  activeCLevel: 'cpo' | 'cto' | 'cso' | 'cbo' | 'coo' | 'ceo';
  rationale: string;

  // 신규 필드 (v4+)
  parallelGroup: string[];   // length=1 이면 sequential, >=2 이면 Agent Teams
  dependencies: { [clevel: string]: string[] };  // 분석 시점의 의존성 스냅샷
};
```

**Consumer 동작**:
- 기존 코드 (`activeCLevel` 만 참조) → 변경 없음 (backward compatible)
- 신규 dispatcher → `parallelGroup` 우선, length=1 fallback to `activeCLevel`

## 3. `status.json features.{name}.lock` + `subagentLocks` 형식

```typescript
type FeatureLock = {
  clevel: string;       // 'cpo' | 'cto' | ...
  sessionId: string;    // claude agents 세션 ID
  acquiredAt: string;   // ISO 8601
  heartbeatAt?: string; // v2 — 현재는 미사용
} | null;

// 패턴 D 추가 (2026-05-16)
type SubagentLock = {
  sessionId: string;
  worktreeBranch: string;     // 'feat/{feature}-{agent}'
  worktreePath: string;        // '.claude/worktrees/{feature}-{agent}'
  acquiredAt: string;
};

type FeatureSubagentLocks = {
  [agentName: string]: SubagentLock;  // 'frontend-engineer' | 'backend-engineer' | ...
};
```

**API**: `lib/status.js`
- `acquireLock(feature, clevel, sessionId)` → `{ acquired: true, lock } | { acquired: false, holder }`
- `releaseLock(feature, clevel)` → void
- `acquireSubagentLock(feature, agent, sessionId, branch, path)` → SubagentLock (T8 mitigation)
- `releaseSubagentLock(feature, agent)` → void
- `isStale(lock, staleMinutes)` → bool

**worktree-manager.js API** (신규):
- `createWorktree(feature, agent)` → `{ path, branch }`
- `mergeBack(feature, agents)` → throws on lint/test fail (T6 mitigation) + AskUserQuestion diff 승인
- `listStale(staleMinutes)` → stale worktree 목록 (자동 cleanup X)

**의미 정책**:
- Advisory only — 강제 차단 X. 동일 C-Level 중복 진입 시 경고만 (정책 #4 plan §5)
- session 정상 종료 = release. 비정상 종료 = stale 처리 (lockStaleMinutes 경과 후)

## 4. SendMessage 사용 패턴 (적용 범위)

**ALLOWED**:
```javascript
// C-Level → sub-agent (ephemeral 위임)
await Agent({
  subagent_type: 'infra-architect',
  prompt: '...',
});
// 후속 지시 (같은 sub-agent 재사용)
await SendMessage({
  to: 'agent-id-from-previous',
  prompt: 'follow-up: ...',
});
```

**FORBIDDEN**:
```javascript
// ❌ C-Level → C-Level 직접 통신
await SendMessage({ to: 'cpo-session-id', prompt: '...' });  // 금지

// ❌ Sub-agent → Sub-agent 직접 통신 (T8 — 같은/다른 C-Level 하위 모두)
await SendMessage({ to: 'backend-engineer-session-id', prompt: '...' });  // from frontend-engineer → 금지

// ⚠️ Sub-agent → C-Level: 응답만 허용 (request 금지)
```

**Enforcement**:
- `agents/_shared/work-rules.md` 에 박제 (Do 작업 #15 + #22 — sub→sub FORBIDDEN 명시)
- (선택) PreToolUse hook: SendMessage `to:` 타깃의 agent-type 이 호출자보다 layer 가 같거나 위인지 검증
- QA Gate CSO-G7: `grep -n "sub-agent → sub-agent" agents/_shared/work-rules.md`

## 5. Schedule 산출물 경로 (CSO / CBO)

| 작업 | 출력 경로 | 형식 |
|------|----------|------|
| CSO 주간 보안 감사 | `docs/_scheduled/{date}-cso-audit.md` | dependency-analyzer + secret-scanner 종합 |
| CBO 월간 finops | `docs/_scheduled/{date}-cbo-finops.md` | finops-analyst 종합 |

**Frontmatter 표준** (생산자 = scheduled C-Level):
```yaml
---
owner: cso  # or cbo
artifact: scheduled-{cso-audit | cbo-finops}
phase: scheduled
feature: _scheduled
generated: YYYY-MM-DD
summary: "..."
---
```

> 일반 피처 main.md append-only 흐름과 분리 — `docs/_scheduled/` 단독 폴더.

## 6. 계약 검증 체크리스트

| Contract | Test |
|----------|------|
| C1. agentTeams.enabled=false → 0.67.0 byte-level 동등 | SC-01 |
| C2. parallelGroup.length=1 → sequential 경로 | SC-02 |
| C3. lock acquire 실패 → 경고만, 차단 X | unit test |
| C4. SendMessage to C-Level session ID → 거부 또는 경고 | (선택) hook |
| C5. 스케줄 cron null → 비활성 | unit test |
| C6. `subagentSessions=false` → 패턴 C (Agent 도구 병렬) 그대로, worktree 미생성 | SC-09 + G4 |
| C7. `mergeBack` lint/test 실패 → squash-merge 차단 (T6) | SC-08 + `tests/worktree-merge-safety.test.js` |
| C8. sub-agent → sub-agent SendMessage → 거부 (T8) | CSO-G7 + (선택) hook |
| C9. `worktreeAutoCleanup=false` 강제 (자동 삭제 금지) | unit test |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — 4 인터페이스 계약 (config / parallelGroup / lock / SendMessage) + 스케줄 경로 + C1~C5 검증 |
| v1.1 | 2026-05-16 | 패턴 D 확장 — `subagentSessions/maxConcurrentSubagents/worktreeRoot/worktreeAutoCleanup` config 추가 + `SubagentLock` 형식 + worktree-manager API 3건 + SendMessage FORBIDDEN sub→sub + C6~C9 |
