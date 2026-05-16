---
owner: cto
artifact: onboarding-doc-design
phase: design
feature: agent-teams-sendmessage-real
generated: 2026-05-17
agent: infra-architect
summary: "ONBOARDING.md 신규 H2 섹션 초안 + CLAUDE.md Rule #21 (Graceful Degradation 정책) — Do phase 복붙용"
---

# Onboarding Doc Design — agent-teams-sendmessage-real

> Phase: 🎨 design | Owner: CTO | Date: 2026-05-17
> 참조 문서: `docs/agent-teams-sendmessage-real/01-plan/tech-plan.md` §2-D, `docs/agent-teams-sendmessage-real/01-plan/main.md`

Do phase 에서 이 파일의 텍스트를 그대로 복붙하면 끝나도록 작성. 수정 없이 Write 가능.

---

## 1. ONBOARDING.md 신규 H2 섹션 초안

**삽입 위치**: "Getting Started" 섹션 바로 다음 (existing anchor 기준: `## Getting Started` 다음 `##` 직전).

**anchor**: `#agent-teams-activation` (session-start.js 경고 메시지의 링크 대상)

---

```markdown
## Agent Teams 활성화 (선택) {#agent-teams-activation}

> 기본값: simulation 모드 (flag 없이도 모든 기능 사용 가능). 실제 CC SendMessage 도구를 사용하려면 아래 5 단계를 따르세요.

### 전제 조건

Claude Code 2.1+ 가 필요합니다.

```bash
claude --version
# 예상 출력: 2.1.xxx (Claude Code)
```

### 활성화 5 단계

**Step 1 — CC 버전 확인**

```bash
claude --version
# 2.1.x 이상이어야 합니다
```

**Step 2 — env 변수 설정 (즉시 적용)**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**Step 3 — settings.json 영구화 (선택)**

세션 간 유지하려면 `~/.claude/settings.json` 에 추가:

```json
{
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
}
```

> 주의: vais-code 는 settings.json 을 자동으로 수정하지 않습니다. 직접 편집하세요.

**Step 4 — vais.config 활성화**

`vais.config.json` 내 `orchestration.agentTeams.enabled` 를 `true` 로 변경:

```json
{
  "orchestration": {
    "agentTeams": {
      "enabled": true
    }
  }
}
```

**Step 5 — 검증**

새 Claude Code 세션을 시작한 뒤 확인:

```bash
/vais status
# 출력 예시:
# Agent Teams: enabled
# SendMessage: real (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=env)
```

경고 메시지가 없으면 real SendMessage 모드가 활성화된 것입니다.

### Graceful Degradation

| 조건 | 동작 |
|------|------|
| `agentTeams.enabled=false` | 조용 — 기존 sequential 모드 |
| `enabled=true` + flag 미설정 | stderr 경고 1줄 + simulation fallback (0.68.0 byte-compat) |
| `enabled=true` + CC < 2.1.0 | stderr 경고 1줄 + sequential fallback |
| `enabled=true` + CC 2.1+ + flag 설정 | real SendMessage 활성 (조용) |
```

---

## 2. CLAUDE.md Mandatory Rules 신규 #21 초안

**삽입 위치**: 기존 Rule 20 ("합성문 모델 v2 + Lazy Consensus 정책") 바로 다음.

---

```markdown
21. **agent-teams-sendmessage-real Graceful Degradation 정책 (v0.69+)** — `agentTeams.enabled=true` 시 `lib/cc-version-detect.js > checkAgentTeamsAllowed()` 반환의 `simulationMode` 필드로 real/simulation 분기. `simulationMode=true` = 0.68.0 byte-compat simulation. `simulationMode=false` = CC 내장 SendMessage 도구 real 호출. 3 보안 mitigation 항상 active (T3 최우선): (T3) sub-agent caller → SendMessage throw / (T2) 화이트리스트 외 actor → drop / (T1) 시크릿 regex hit → throw. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env 변수 또는 `~/.claude/settings.json` 으로 활성. vais-code 는 settings.json 자동 수정 금지 (`feedback_no_auto_git_restore` 정합). 정본: `docs/agent-teams-sendmessage-real/02-design/flag-detection-design.md`.
```

---

## 3. Do phase 작업 지시

Do phase 에서 이 문서를 기준으로 수행할 Write 작업:

| # | 파일 | 작업 | 복붙 소스 |
|---|------|------|-----------|
| 1 | `ONBOARDING.md` | "Getting Started" 다음 위치에 §1 텍스트 삽입 | 본 문서 §1 코드 블록 내용 |
| 2 | `CLAUDE.md` | Rule #20 다음에 §2 텍스트 삽입 | 본 문서 §2 코드 블록 내용 |

**검증 (AC6)**:

```bash
grep -A 5 "Agent Teams 활성화" ONBOARDING.md
# "Agent Teams 활성화 (선택)" 섹션 존재 확인
# 5 단계 (Step 1~5) 모두 포함 확인
```

**검증 (Rule #21)**:

```bash
grep "Graceful Degradation 정책" CLAUDE.md
# "21. **agent-teams-sendmessage-real Graceful Degradation 정책" 라인 존재 확인
```

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — ONBOARDING H2 섹션 초안 + CLAUDE.md Rule #21 초안 + Do phase 작업 지시 |
