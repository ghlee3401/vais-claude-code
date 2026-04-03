# My Project — Claude Code Harness

> Claude Code 하네스 엔지니어링 참조 구조 (v1.0.0)

## What This Project Is

이 프로젝트는 Claude Code 위에서 에이전트 조직과 자동화 워크플로우를 구성하는
**harness engineering** 패턴의 최소 참조 구현입니다.

## Project Structure

```
basic/
├── CLAUDE.md          # 프로젝트 지침 (이 파일) — Claude가 항상 읽는 설정
├── AGENTS.md          # 범용 에이전트 지침 (Cursor/Copilot 호환)
├── .mcp.json          # MCP 서버 설정 (외부 도구/데이터 연결)
├── package.json       # 플러그인 매니페스트 (skills/agents/hooks 진입점)
├── agents/            # 에이전트 정의 (.md, frontmatter + 지침)
├── skills/            # 스킬 정의 (슬래시 커맨드로 호출)
├── hooks/             # 훅 정의 및 스크립트
├── scripts/           # 자동화 스크립트 (guard, tracker 등)
├── memory/            # 영구 메모리 (MEMORY.md 인덱스 + 개별 파일)
├── templates/         # 문서 템플릿
├── docs/              # 산출물 (기획서, 설계서 등)
└── src/               # 실제 소스 코드
```

## Agent Architecture

### 역할 계층

```
Orchestrator (CTO/CEO 등)
  └─ Execution Agents (architect, backend, frontend, qa 등)
       └─ Utility Agents (specialized, 단일 목적)
```

- **Orchestrator**: 전략 결정, 하위 에이전트 호출
- **Execution**: 실제 구현 담당, 직접 호출 금지 (Orchestrator를 통해서만)
- **Utility**: 단일 작업 특화 (absorb-analyzer, seo 등)

## Workflow

```
plan → design → implement → review
```

각 단계는 `docs/` 하위에 산출물을 남기고 다음 단계로 진행합니다.

## Mandatory Rules

1. **기획 없이 코드 금지** — `docs/plan/` 기획서가 없으면 구현하지 않는다
2. **워크플로우 순서 준수** — plan → design → implement → review 순서를 건너뛰지 않는다
3. **산출물 경로** — `docs/{phase}/{role}_{feature}.{phase}.md` 형식 준수
4. **위험 명령 금지** — `rm -rf`, `DROP TABLE`, `git push --force` 사용 금지
5. **환경 변수** — 민감 정보는 반드시 `.env`로 관리, 코드에 하드코딩 금지
6. **실행 에이전트 직접 호출 금지** — Orchestrator를 통해서만 호출

## Memory System

- `memory/MEMORY.md`: 메모리 인덱스 (대화 간 영구 보존)
- `memory/*.md`: 개별 메모리 파일 (user, feedback, project, reference 타입)
- Claude는 대화 시작 시 MEMORY.md를 읽어 컨텍스트를 복원한다

## Hook Events

| Event | 스크립트 | 용도 |
|-------|----------|------|
| SessionStart | hooks/session-start.js | 상태 로드, 컨텍스트 주입 |
| PreToolUse(Bash) | scripts/bash-guard.js | 위험 명령 차단 |
| PostToolUse(Write\|Edit) | scripts/doc-tracker.js | 문서 변경 추적 |
| Stop | scripts/stop-handler.js | 체크포인트 저장 |

## Key Files to Read First

새 대화 시작 시 Claude는 다음 순서로 읽습니다:
1. `CLAUDE.md` (이 파일) — 항상 자동 로드
2. `memory/MEMORY.md` — 영구 메모리 인덱스
3. `.state/status.json` — 현재 진행 상태 (있으면)
