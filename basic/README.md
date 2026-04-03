# Claude Code Harness Engineering — 참조 구조

> Claude Code 위에서 에이전트 조직과 자동화 워크플로우를 구성하는
> **harness engineering** 패턴의 최소 참조 구현.

이 `basic/` 폴더는 vais-claude-code의 구조 검증 기준으로 사용됩니다.
실제 플러그인 개발 시 이 구조를 확장하세요.

---

## 디렉토리 구조

```
basic/
├── CLAUDE.md                      # Claude가 항상 읽는 프로젝트 지침
├── AGENTS.md                      # 범용 에이전트 지침 (Cursor/Copilot 호환)
├── package.json                   # 플러그인 매니페스트
│
├── agents/                        # 에이전트 정의
│   ├── orchestrator.md            # 오케스트레이터 (전략, Opus 모델)
│   └── executor.md                # 실행 에이전트 (구현, Sonnet 모델)
│
├── skills/                        # 스킬 (슬래시 커맨드)
│   └── example/
│       └── SKILL.md               # /example 커맨드 정의
│
├── hooks/                         # Hook 이벤트 처리
│   ├── hooks.json                 # Hook 이벤트 → 스크립트 매핑
│   └── session-start.js           # SessionStart: 상태 로드 & 컨텍스트 주입
│
├── scripts/                       # 자동화 스크립트
│   ├── bash-guard.js              # PreToolUse(Bash): 위험 명령 차단
│   ├── doc-tracker.js             # PostToolUse(Write|Edit): 문서 변경 추적
│   ├── stop-handler.js            # Stop: 체크포인트 저장
│   └── agent-tracker.js           # SubagentStart/Stop: 에이전트 호출 로깅
│
├── memory/                        # 영구 메모리 시스템
│   ├── MEMORY.md                  # 메모리 인덱스 (항상 로드)
│   └── example_feedback.md        # 예시: feedback 타입 메모리
│
├── templates/                     # 문서 템플릿
│   ├── plan.template.md           # 기획서 템플릿
│   └── design.template.md         # 설계서 템플릿
│
├── docs/                          # 산출물 (피처별 자동 생성)
│   └── (plan/, design/, review/)  # 단계별 하위 폴더
│
└── src/                           # 실제 소스 코드
    ├── index.js                   # 진입점
    └── example/                   # 예시 피처 모듈
        ├── service.js             # 비즈니스 로직
        ├── repository.js          # DB 접근 레이어
        └── __tests__/
            └── service.test.js    # 단위 테스트
```

---

## 핵심 개념

### 1. CLAUDE.md — 프로젝트 지침

Claude Code가 모든 대화에서 자동으로 읽는 파일입니다.
**What this project is**, 에이전트 아키텍처, 워크플로우, 금지 명령 등을 정의합니다.

```markdown
## Mandatory Rules

1. 기획 없이 코드 금지 — docs/plan/ 기획서가 없으면 구현하지 않는다
2. 워크플로우 순서 준수 — plan → design → implement → review
3. 위험 명령 금지 — rm -rf, DROP TABLE, git push --force
```

### 2. agents/ — 에이전트 정의

에이전트는 `frontmatter + 마크다운` 형식으로 정의합니다.

```markdown
---
name: orchestrator
model: opus          # opus | sonnet | haiku
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
disallowedTools:
  - "Bash(rm -rf*)"  # 특정 패턴 금지
---

# 에이전트 역할 및 지침 ...
```

**계층 구조:**
- **Orchestrator** (Opus): 전략 결정, 에이전트 조율, `Agent` 도구 사용 가능
- **Executor** (Sonnet): 구현 전담, `Agent` 도구 없음, 직접 호출 금지

### 3. skills/ — 슬래시 커맨드

`/example plan login`처럼 사용자가 호출하는 커맨드를 정의합니다.

```markdown
---
name: example
description: 설명 및 트리거 키워드
argument-hint: "[action] [feature-name]"
allowed-tools: Read, Write, Agent, ...
---

# 스킬 본문: Claude가 따를 지침
```

`$0` = 액션명, `$1` = 첫 번째 인자로 치환됩니다.

### 4. hooks/ — 이벤트 훅

Claude Code의 라이프사이클 이벤트에 스크립트를 연결합니다.

| Hook | 트리거 시점 | 용도 |
|------|-------------|------|
| `SessionStart` | 대화 시작 시 | 상태 로드, 컨텍스트 주입 |
| `PreToolUse(Bash)` | Bash 실행 직전 | 위험 명령 차단 |
| `PostToolUse(Write\|Edit)` | 파일 저장 후 | 변경 추적 |
| `Stop` | 응답 완료 후 | 체크포인트 저장 |
| `SubagentStart` | 에이전트 시작 시 | 호출 로깅 |
| `SubagentStop` | 에이전트 종료 시 | 결과 로깅 |

**훅 스크립트 규칙:**
- stdin으로 JSON 입력 수신 (tool_name, tool_input 등)
- stdout → Claude 컨텍스트에 주입 (SessionStart에서 활용)
- exit 0 = 허용, exit 2 = 차단 (PreToolUse에서 활용)
- 훅 실패는 조용히 무시 (Claude 흐름 방해 금지)

### 5. memory/ — 영구 메모리

대화 간 정보를 영구 보존하는 파일 기반 시스템입니다.

```
memory/
├── MEMORY.md          # 인덱스 (항상 로드, 200줄 제한)
└── {type}_{topic}.md  # 개별 메모리 파일
```

**메모리 타입:**

| 타입 | 내용 | 예시 |
|------|------|------|
| `user` | 사용자 배경, 역할, 선호도 | "React는 처음, Go 10년 경력" |
| `feedback` | 작업 방식 가이드라인 | "DB mock 금지, 왜/어떻게 적용" |
| `project` | 현재 작업 목표, 일정 | "login 피처 2026-04-10 데드라인" |
| `reference` | 외부 리소스 위치 | "버그 추적: Linear INGEST 프로젝트" |

### 6. src/ — 소스 코드

피처별 모듈 구조를 권장합니다:

```
src/
└── {feature}/
    ├── service.js      # 비즈니스 로직 (순수 함수 중심)
    ├── repository.js   # DB 접근 (인터페이스 분리)
    └── __tests__/
        └── service.test.js
```

**원칙:**
- service ↔ repository 레이어 분리
- DB mock 금지 — 테스트에서 실제 인스턴스 사용
- 입력 검증은 service 레이어에서

---

## 워크플로우

```
/example plan login
    → orchestrator 에이전트 호출
    → docs/plan/login.plan.md 생성
    → 기획서 Gate 검증

/example implement login
    → orchestrator → executor 에이전트
    → src/login/ 구현
    → 테스트 포함

/example review login
    → 기획서 대비 Gap 분석
    → docs/review/login.review.md 생성
```

---

## vais-claude-code 검증 기준

이 `basic/` 구조를 기준으로 vais-claude-code의 구조를 검증합니다:

| 항목 | basic/ | vais-claude-code/ |
|------|--------|-------------------|
| CLAUDE.md | 있음 | agents/, skills/, hooks/ 참조 |
| agents/ | orchestrator, executor | 20개 C-Suite + 실행 에이전트 |
| skills/ | example | vais (6단계 워크플로우) |
| hooks/ | 4개 이벤트 | SessionStart, PreToolUse, PostToolUse, Stop, SubagentStart/Stop |
| memory/ | MEMORY.md + 타입별 파일 | 동일 구조 |
| 에이전트 frontmatter | name, model, tools, disallowedTools | 동일 + version, description |
| 훅 스크립트 | Node.js, 원자적 쓰기 | 동일 |
| 산출물 경로 | docs/{phase}/{feature}.{phase}.md | docs/{no}-{phase}/{role}_{feature}.{phase}.md |

---

## 빠른 시작

```bash
# 구조 확인
ls basic/

# 훅 스크립트 직접 테스트
echo '{"tool_input":{"command":"rm -rf /"}}' | node basic/scripts/bash-guard.js
echo $?  # 2 (차단)

echo '{"tool_input":{"command":"ls -la"}}' | node basic/scripts/bash-guard.js
echo $?  # 0 (허용)
```
