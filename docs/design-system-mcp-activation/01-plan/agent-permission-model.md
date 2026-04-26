---
topic: agent-permission-model
owner: cto
phase: 01-plan
feature: design-system-mcp-activation
---

# Agent Permission Model — MCP tool 권한 분배

> 본 topic 은 main.md 의 D-5/D-6 + 정책 1 의 상세화. main.md 는 한 줄 결정만 보유.

## 문제

`mcp/design-system-server.json` 의 3개 tool 을 어느 agent 가 호출해야 하는가?

- (a) `design_search` — BM25 검색 (50+ 스타일, 161 컬러, 57 폰트)
- (b) `design_system_generate` — MASTER.md 자동 생성
- (c) `design_stack_search` — 스택별 (html-tailwind / react / nextjs) UI 가이드라인

### 후보 분배안

| 안 | 분배 | 장점 | 단점 |
|:--:|------|------|------|
| 1 | ui-designer 만 3개 모두 | 단일 agent — 권한 단순 | frontend-engineer 가 stack-search 못 함 → design phase 에서 미리 호출해야 |
| 2 | ui-designer (a/b) + frontend-engineer (c) | 역할 경계와 일치 — design 결정 vs 구현 가이드 | 권한 매트릭스 2 agent 관리 |
| 3 | CTO orchestrator 가 분기 | agent tool 권한 0, CTO 가 결과 전달 | CTO bash subprocess 부담, sub-agent 패턴과 어긋남 |
| 4 | 새 agent (design-token-generator) 신설 | 단일 책임 분리 | 38 sub-agent → 39, over-engineering |

## 결정 (D-5)

**안 2 채택**: `ui-designer` (search + generate) / `frontend-engineer` (stack-search)

### 근거

- `design_search` + `design_system_generate` = **design 결정** (컬러/폰트/스타일/토큰) → ui-designer 책임
- `design_stack_search` = **구현 가이드** (React 패턴, Tailwind 클래스) → frontend-engineer 책임
- v0.50 도입된 6 C-Level 의 "역할 경계" 일관성 — UI 결정과 구현 분리

### 권한 변경 명세

```yaml
# agents/cto/ui-designer.md
tools:
  - Read
  - Write
  - Edit
  - Glob
  - AskUserQuestion
  # 신규 추가
  - mcp__vais-design-system__design_search
  - mcp__vais-design-system__design_system_generate

# agents/cto/frontend-engineer.md
tools:
  # 기존 유지
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - TodoWrite
  # 신규 추가
  - mcp__vais-design-system__design_stack_search
```

> MCP tool 명명 규칙: `mcp__{server-name}__{tool-name}`. server-name 은 `mcp/design-system-server.json` 의 `name` 필드 (`vais-design-system`).

## D-6: 호출 시점

| Tool | 호출자 | 호출 시점 | 빈도 |
|------|:------:|----------|:----:|
| `design_system_generate` | ui-designer (실은 hook) | design phase 진입 직후 | 1회 / feature (idempotent) |
| `design_search` | ui-designer | design 작업 중 시각 결정 시 (컬러/폰트 query) | ad-hoc, ~3-5회 / feature |
| `design_stack_search` | frontend-engineer | do phase 시작 시 (구현 직전) | 1회 / 스택 결정 |

### 왜 stack-search 는 do phase?

- design phase 에선 "어떤 스택 쓸지" 가 아직 결정 안 된 경우 多 (CTO 또는 사용자가 design 후반에 결정)
- 구현 직전 호출 = 가이드 fresh 도 ↑, "필요할 때 정확히" 원칙 부합
- 다만 design 단계에서 stack 결정이 명확하면 ui-designer 가 미리 호출하고 frontend-engineer 에게 넘기는 변형 허용 (Q-2 의 partial 답)

## 정책 1 (호출 권한 enforce)

- 다른 sub-agent (backend-engineer / qa-engineer / security-auditor 등) 는 `mcp__vais-design-system__*` **호출 금지**
- 위반 감지: `scripts/sub-agent-audit.js` 의 권한 매트릭스 검사에 MCP tool prefix 검증 룰 추가
- 위반 시: doc-validator 경고가 아니라 **agent.md 정의 시점 차단** (CSO skill-validator 영역)

## 큐레이션 기록

- (채택) 안 2 — 역할 경계 일치, 안정성
- (거절) 안 1 — frontend-engineer 의 stack-search 회피가 어색, ui-designer 가 design phase 에서 모든 스택 결정해야 함
- (거절) 안 3 — sub-agent 패턴 위반, CTO 부담 가중
- (거절) 안 4 — over-engineering, 38 → 39 sub-agent 증식
- (병합) 호출 시점 (D-6) 은 본래 별도 결정이었으나 권한 분배와 강결합이라 본 topic 에 통합

## 참조

- main.md `## Decision Record` (D-5, D-6)
- main.md `## 5. 정책` (정책 1)
- ideation main.md Q-1 (호출 책임 미해결 → 본 topic 에서 해소)
- ideation main.md Q-2 (호출 시점 미해결 → 본 topic 에서 해소)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — D-5 (안 2 채택) + D-6 (호출 시점 매트릭스) + 정책 1 enforce |
