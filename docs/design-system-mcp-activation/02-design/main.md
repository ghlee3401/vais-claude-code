# design-system-mcp-activation - 설계

> ⛔ **Design 단계 범위**: 설계 결정만 기록. 프로덕트 파일 생성·수정은 Do 단계.
> 참조: `docs/design-system-mcp-activation/01-plan/main.md`
> CTO 직접 작성 (메타-인프라 피처 — UI 0개, infra-architect 위임 가치 낮음)

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| D-D1 | Architecture = C. Pragmatic (3 파일 분리) | cto | A 단일파일은 테스트 어렵고 B 5파일 분리는 본 피처 size 대비 과도 | `interface-contract.md` |
| D-D2 | `.mcp.json` 위치 = 프로젝트 root | cto | Claude Code 표준. plugin.json 과 같은 manifest 계층 | `interface-contract.md` |
| D-D3 | hook 등록 위치 = `hooks/hooks.json > PreToolUse` | cto | design phase 진입을 가장 일찍 감지 가능한 hook point | `interface-contract.md` |
| D-D4 | `lib/mcp-validator.js` API = 3 export (`isMcpEnabled`, `validateEnvironment`, `runGenerate`) | cto | 단일 책임 — config / 환경 검증 / 실행 분리. 테스트 mock 단순 | `interface-contract.md` |
| D-D5 | hook 진입 조건 = `tool === "Agent"` AND `subagent_type === "ui-designer"` AND `phase === "design"` | cto | ui-designer 호출이 design phase 진입의 충분조건. 1회/feature idempotent | `interface-contract.md` |
| D-D6 | MASTER.md 경로 = `design-system/{feature}/MASTER.md` | cto | mcp/design-system-server.json 의 `--persist -p` 인자와 일치 (이미 정의됨) | `interface-contract.md` |
| D-D7 | 에러 전파 = stderr 출력 + exit(1) — Claude Code 가 사용자에게 표시 | cto | Hard fail 정책 (D-4). hook 자체가 차단 | `hard-fail-strategy.md` (plan) |

---

## Context Anchor (Plan 인용)

| Key | Value |
|-----|-------|
| **WHY** | ui-designer 가 design token 없이 디자인 (현재) → MCP 자동 호출로 토큰 영속화 |
| **WHO** | vais-code OSS 사용자 전체 (default ON, opt-out) |
| **RISK** | (R1) Python3 미설치 (R2) vendor 손상 (R3) MCP subprocess 보안 (R4) dead spec 잔재 |
| **SUCCESS** | design 자동 호출 100%, 수동 호출 0건, Hard fail 안내 명확 |
| **SCOPE** | Standard — 신규 3 + 수정 7 = 9 파일, ~200 LOC |

---

## Architecture Options

| Option | 설명 | 복잡도 | 유지보수 | 구현 속도 | 리스크 | 선택 |
|--------|------|:------:|:--------:|:---------:|:------:|:----:|
| A. Minimal | 단일 파일 (validator + hook 통합) | 낮음 | 낮음 | 빠름 | 중 (테스트 어려움) | |
| B. Clean | 5 파일 (validator/config/py-checker/vendor-checker/hook) | 높음 | 높음 | 느림 | 낮음 | |
| **C. Pragmatic** | 3 파일 (validator / hook / 공통 logger) — 균형 | 중 | 중 | 중 | 낮음 | ✅ |

**Rationale (D-D1)**: 본 피처는 작지만 (~200 LOC) 테스트 5+ 시나리오 필요 (hard-fail-strategy.md 의 TC-1~TC-6). Minimal 단일파일은 mock 어려움. Clean 5파일은 단일 책임 과도. Pragmatic 3파일이 single responsibility + 테스트 용이성 균형.

---

## Part 1: IA / 와이어프레임

> (N/A — 메타-인프라 피처. UI 화면 0개)

---

## Part 2: Infrastructure & Interface Contract

### 2.1 파일 구조

```
.mcp.json                           # 신규 — MCP server 등록 진입점
hooks/
  design-mcp-trigger.js             # 신규 — PreToolUse hook (D-D3, D-D5)
  hooks.json                        # 수정 — design-mcp-trigger 등록
lib/
  mcp-validator.js                  # 신규 — 3 export API (D-D4)
  project-profile.js                # 참조 — Profile gate fallback 패턴 답습 (migration-fallback.md)
mcp/
  design-system-server.json         # 참조 — 기존 스펙 (수정 최소)
agents/cto/
  ui-designer.md                    # 수정 — tools (search+gen) + description (D-13)
  frontend-engineer.md              # 수정 — tools (stack-search)
.claude-plugin/
  plugin.json                       # 수정 — mcp 항목 추가 (배포 시 자동 등록)
vais.config.json                    # 수정 — orchestration.mcp.enabled true
README.md                           # 수정 — Installation 절 Python3 의존
CLAUDE.md                           # 수정 — 의존성 절 + mcp 기본 ON
```

### 2.2 데이터 흐름

```
1. 사용자: /vais cto design my-feature
2. CTO: ui-designer Agent 호출 (Agent tool 사용)
3. PreToolUse hook (design-mcp-trigger.js) 발동
   ├─ a. matches(tool=Agent, subagent_type=ui-designer, phase=design) ?
   │     yes → continue / no → skip
   ├─ b. mcp-validator.isMcpEnabled() ?
   │     no → skip (opt-out 사용자)
   ├─ c. mcp-validator.validateEnvironment() ?
   │     fail → console.error(message) + exit(1) ← Hard fail
   ├─ d. fs.existsSync(`design-system/{feature}/MASTER.md`) ?
   │     yes → skip (idempotency D-7)
   └─ e. mcp-validator.runGenerate(feature)
         └─ subprocess: python3 vendor/ui-ux-pro-max/scripts/search.py
                        --design-system --persist -p {feature}
                        → design-system/{feature}/MASTER.md 영속화
4. ui-designer Agent 실행 — Read 로 MASTER.md 소비
5. ui-designer 작업 중 design_search MCP ad-hoc 호출 (선택)
```

### 2.3 Interface Contract (lib/mcp-validator.js)

```typescript
// (의사 TypeScript — 실 구현은 JS)

/** Config 게이트 검사 — Profile gate 패턴 답습 (migration-fallback.md) */
function isMcpEnabled(): boolean;

/** Python3 + vendor 무결성 검증 — Hard fail 사전 조건 (hard-fail-strategy.md) */
type ValidationResult =
  | { ok: true; pythonVersion: string }
  | { ok: false; reason: 'not-installed' | 'version-too-low' | 'vendor-missing' | 'vendor-empty'; detail: string };
function validateEnvironment(): ValidationResult;

/** vendor 스크립트 호출 — MASTER.md 영속화 */
type GenerateResult = { ok: true; masterPath: string } | { ok: false; stderr: string };
function runGenerate(feature: string): GenerateResult;

/** Hard fail 안내 메시지 생성 — 한국어, README#Install 링크 (hard-fail-strategy.md) */
function buildErrorMessage(result: ValidationResult): string;
```

### 2.4 Hook Contract (hooks/design-mcp-trigger.js)

| 항목 | 값 |
|------|-----|
| 등록 이벤트 | `PreToolUse` |
| 매칭 조건 | `tool === "Agent" && input.subagent_type === "ui-designer" && env.phase === "design"` |
| 입력 | Claude Code hook payload (tool name, args, env) |
| 출력 (정상) | exit 0 (silent or stdout 진행 안내) |
| 출력 (skip) | exit 0 (idempotency 또는 opt-out) |
| 출력 (Hard fail) | stderr 안내 메시지 + exit 1 → Claude Code 가 사용자에게 표시 + design phase 차단 |

### 2.5 .mcp.json 스키마

```json
{
  "mcpServers": {
    "vais-design-system": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/design-system-server-runner.js"],
      "env": {}
    }
  }
}
```

> ⚠️ 기존 `mcp/design-system-server.json` 은 vais-code 자체 스펙 — Claude Code 표준 MCP runner 와 다름. design-system-server.json 의 3 tool 을 Claude Code MCP server interface (initialize / tools/list / tools/call) 로 wrapping 하는 `design-system-server-runner.js` 신규 필요. **(observation-D1)** 이건 do 단계에서 별도 명세.

---

## Part 3: 보안 검토 (간이)

| 항목 | 위험 | 완화 |
|------|------|------|
| subprocess 입력 | shell injection (`${query}`, `${project_name}`) | project_name pattern `^[a-zA-Z0-9_-]+$` enforce, query 는 따옴표 escape |
| Python script 실행 | 임의 코드 실행 | vendor/ui-ux-pro-max 신뢰 (license MIT, 사전 vendoring) |
| MASTER.md write | path traversal (`feature` 인자) | feature pattern 검증 동일 (project_name 과 동일 regex) |
| MCP server 권한 | tool 호출 권한 누설 | agent.md tools 명시 — ui-designer/frontend-engineer 만 |

---

## 관찰 (후속 과제)

- (observation-D1) `mcp/design-system-server.json` 은 vais-code 자체 스펙 — Claude Code MCP runner 와 다른 형식. wrapping runner (`design-system-server-runner.js`) 신규 필요. **do phase 우선 작업**
- (observation-D2) Python venv 격리 (vendor 가 시스템 Python 오염) — 별도 피처
- (observation-D3) MCP server hot-reload (개발 시) — vais-code 자체 개발 도구

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| Interface Contract | `interface-contract.md` (선택, 본 main.md inline) | cto | D-D1~D-D7 + Validator API + Hook Contract + Schema 모두 main.md 인라인 | (없음) |

> design 산출물은 main.md 200 lines budget 안에 들어가 별도 topic 분리 안 함 (Pragmatic).

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (CTO 직접 작성, sub-agent 위임 없음) | — | — | — |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Architecture C. Pragmatic 채택, Interface Contract 4개 (validator API + hook + .mcp.json + 데이터 흐름), observation-D1 (server-runner.js 신규 필요) 식별 |
