---
name: teams-cleanup
description: Stale sub-agent worktree 와 lock 을 사용자 명시 호출로 정리. 자동 cleanup 금지 정책 (memory feedback_no_auto_git_restore) 의 대응 도구.
---

# `/vais teams cleanup`

Stale worktree (오래된, 작업 미완료 상태) 와 lock 을 정리한다.

## 실행 지침

### 1. 식별 단계

Bash 로 stale worktree 목록 얻기:
```bash
node -e "
const wt = require('./lib/worktree-manager');
const stale = wt.listStale(30);  // 30분 기본
console.log(JSON.stringify(stale, null, 2));
"
```

`lib/status.js > listSubagentLocks(feature)` 와 비교하여 stale lock 목록도 산출.

### 2. 표시 + 확인

식별된 항목을 표로 박제:

```
## 정리 대상

### Stale Worktrees
| Path | Branch | Age | Action |
|------|--------|-----|--------|
| .claude/worktrees/foo-frontend | feat/foo-frontend | 2h | git worktree remove |

### Stale Locks
| Feature | Agent | Acquired | Action |
|---------|-------|----------|--------|
| foo | frontend-engineer | 2h ago | releaseSubagentLock |
```

### 3. AskUserQuestion 확인 (필수)

**자동 cleanup 금지**. 반드시 AskUserQuestion 으로 사용자 명시 승인 받기:

```
question: "위 N개 항목을 정리할까요? 정리하면 worktree branch 의 미커밋 변경사항은 손실됩니다."
options:
  - "전체 정리 (worktree 제거 + lock 해제)"
  - "lock 만 해제 (worktree 보존 — 추후 수동 확인)"
  - "취소"
```

### 4. 실행

사용자가 "전체 정리" 선택 시:
```bash
node -e "
const wt = require('./lib/worktree-manager');
const status = require('./lib/status');
const targets = [...];  // 위 식별 결과
for (const t of targets) {
  const r = wt.cleanupWorktree(t.path, { confirm: true });
  console.log('[cleanup]', r);
  if (t.feature && t.agent) status.releaseSubagentLock(t.feature, t.agent);
}
"
```

"lock 만 해제" 선택 시: `releaseSubagentLock` 만 호출.

### 5. 결과 박제

정리 완료 후 결과 표시:
```
## 정리 완료
- N개 worktree 제거
- N개 lock 해제
- N개 실패 (사유: ...)
```

## 안전장치

- `lib/worktree-manager.js > cleanupWorktree` 가 `{ confirm: true }` 없으면 throw — 자동 호출 방지
- 사용자가 "취소" 선택 시 어떤 변경도 없음
- 미커밋 변경사항 손실 가능성 명시 (사용자가 알고 결정)
