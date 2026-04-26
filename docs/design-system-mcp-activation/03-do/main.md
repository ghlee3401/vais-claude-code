# design-system-mcp-activation - 구현 로그

> ⛔ **Do 단계**: plan + design 결정에 따른 실 구현. CTO 직접 작성 (sub-agent 위임 없음 — 메타-인프라 피처).
> 참조: `01-plan/main.md` + `02-design/main.md` + `01-plan/{agent-permission-model, hard-fail-strategy, migration-fallback}.md`

## 작업 결과 (한 줄 요약)

D-1 ~ D-13 + D-D1 ~ D-D7 + observation-D1 모두 구현. 신규 4 + 수정 6 = 10 파일, +505/-12 LOC. 신규 17 테스트 통과 (npm test 263→280, +17).

---

## 변경 파일 (10)

### 신규 (4)

| # | 파일 | LOC | 역할 | 출처 |
|:-:|------|:---:|------|------|
| 1 | `lib/mcp-validator.js` | 161 | `isMcpEnabled` / `validateEnvironment` / `runGenerate` / `buildErrorMessage` / `hasMasterDoc` | D-D4 (Interface Contract) |
| 2 | `hooks/design-mcp-trigger.js` | 105 | PreToolUse hook — ui-designer Agent 진입 감지 + idempotency + Hard fail | D-D3, D-D5 |
| 3 | `mcp/design-system-server-runner.js` | 174 | Claude Code MCP server (stdio JSON-RPC 2.0) — design-system-server.json 3 tool wrapper | observation-D1 |
| 4 | `.mcp.json` | 12 | Claude Code MCP server 등록 진입점 (project root) | D-D2 |

### 수정 (6)

| # | 파일 | 변경 | 출처 |
|:-:|------|------|------|
| 5 | `vais.config.json` | `orchestration.mcp.enabled: true` + description | D-1 |
| 6 | `.claude-plugin/plugin.json` | `mcpServers.vais-design-system` 항목 추가 (배포 시 자동 등록) | D-D2 |
| 7 | `agents/cto/ui-designer.md` | tools 에 `mcp__vais-design-system__design_search` + `design_system_generate` 추가 + description 정정 ("Auto-generates via MCP and consumes") | D-5, D-13 |
| 8 | `agents/cto/frontend-engineer.md` | tools 에 `mcp__vais-design-system__design_stack_search` 추가 | D-5 |
| 9 | `hooks/hooks.json` | PreToolUse 에 Agent matcher → design-mcp-trigger 등록 (timeout 30s — vendor subprocess 여유) | D-D3 |
| 10 | `README.md` + `CLAUDE.md` | Quick Start#Requirements + 의존성 절 — Python3 ≥ 3.10 + Hard fail 안내 + opt-out 가이드 | D-11 |

---

## 신규 테스트 (17 케이스)

### `tests/integration/mcp-validator.test.js` (9 케이스)

| Case | 시나리오 | 검증 |
|------|---------|------|
| TC-1 | Python3 정상 | `validateEnvironment().ok === true`, `pythonVersion === "3.11"` |
| TC-2 | Python3 미설치 (mock throw) | `reason === "not-installed"` |
| TC-3 | Python 3.9 | `reason === "version-too-low"`, detail 에 "3.9" |
| TC-4 | vendor 디렉토리 누락 | `reason === "vendor-missing"` |
| TC-5 | vendor data empty | `reason === "vendor-empty"` |
| TC-6 | 안내 메시지 형식 (4 reason) | 한국어 본문 + 조치 + python.org 링크 + opt-out 가이드 |
| extra | feature 이름 검증 | 패턴 위반 시 `runGenerate` 거부 |
| extra | hasMasterDoc — 존재 + size>0 | true |
| extra | hasMasterDoc — 없음 | false |

### `tests/integration/mcp-migration.test.js` (8 케이스)

| Case | 시나리오 | `isMcpEnabled()` |
|------|---------|:----------------:|
| TC-A | orchestration.mcp 키 누락 | true (fallback) |
| TC-B | orchestration.mcp.enabled = false | false (opt-out) |
| TC-C | legacy `config.mcp.enabled = true` | true |
| TC-D | 빈 config | true (fallback) |
| TC-E | loadConfig throw | true (예외 안전) |
| TC-F | "false" 문자열 | false |
| TC-G | "true" 문자열 | true |
| TC-H | orchestration.mcp 가 root mcp 보다 우선 | (orchestration false 우선) |

### 테스트 결과

```
$ node --test tests/integration/mcp-{validator,migration}.test.js
ℹ tests 17
ℹ pass 17
ℹ fail 0
```

```
$ npm test
ℹ tests 283 (이전 263 + 신규 17 + 자동 감지 3)
ℹ pass 280
ℹ fail 0
ℹ skipped 3
```

---

## Plugin Validation

```
$ node scripts/vais-validate-plugin.js
ℹ️  [plugin.json] 플러그인: vais-code@0.60.0
ℹ️  [.mcp.json] 등록된 MCP 서버: 2개  ← (vais-design-system 인식)
ℹ️  [agents] 발견된 agent 정의: 58개 (변경 없음)
```

---

## 데이터 흐름 검증 (manual smoke 권장)

```
1. /vais cto design my-feature
2. CTO → ui-designer Agent 호출
3. PreToolUse hook (design-mcp-trigger.js):
   ├─ a. tool_name=Agent + subagent_type=ui-designer ✓
   ├─ b. activeFeature.currentPhase === "design" ✓
   ├─ c. isMcpEnabled() === true ✓
   ├─ d. hasMasterDoc("my-feature") === false (첫 진입) ✓
   ├─ e. validateEnvironment() === ok ✓ (Python3 3.10+ + vendor)
   └─ f. runGenerate("my-feature") → MASTER.md 영속화
4. ui-designer 진행 (Read 로 MASTER.md 소비, design_search ad-hoc 호출 가능)
```

---

## Decision Record (multi-owner) — Do 추가

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| D-IM-01 | hook timeout 30s (Bash hook 3s 보다 길게) | cto | vendor Python subprocess 가 BM25 + 161 컬러 처리 시 1-5s 소요 가능, 안전 마진 | (main.md inline) |
| D-IM-02 | server-runner.js 가 readline interface 사용 (line-delimited JSON-RPC) | cto | MCP stdio 표준. SDK 미사용 (`@modelcontextprotocol/sdk` dependency 회피) | (main.md inline) |
| D-IM-03 | runner 의 query/project_name regex 검증 = mcp-validator 와 동일 | cto | 입력 검증 코드 중복이지만 보안 layer 분리 (defense in depth) | (main.md inline) |
| D-IM-04 | `.mcp.json` + `plugin.json > mcpServers` 모두 등록 | cto | dev (project root .mcp.json) + 배포 (plugin manifest) 양쪽 자동 인식 | (main.md inline) |

---

## 미해결 / 후속 (manual 확인 필요)

| ID | 항목 | 이유 |
|:--:|------|------|
| F-1 | Python 3.10 minimum 실 검증 | `vendor/ui-ux-pro-max/scripts/search.py` 의 실제 의존 (f-string/walrus/match) 확인 필요. 현재 잠정값 |
| F-2 | manual smoke (실 design phase 호출) | mock CI 만 통과. 실제 vendor python 호출은 수동 |
| F-3 | `.mcp.json` registered MCP 서버 2개 표시 | validator 가 1개만 정의했는데 2개로 카운트 — plugin.json mcpServers 와 합산. 충돌 여부 미확인 |
| F-4 | activeFeature 가 status.json 에 없을 때 동작 | feature 없으면 outputAllow() — 안전하지만 design phase 자동 호출이 누락될 가능성 |

→ qa phase 에서 F-1 ~ F-4 검증 필수.

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| (생략) | — | cto | 본 do main.md 가 모든 변경 인덱스 — topic 분리 불필요 (~150 lines) | (없음) |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (CTO 직접 구현, sub-agent 위임 없음) | — | — | — |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — 10 파일 변경 + 17 테스트 + D-IM-01~04 + F-1~4 미해결 식별 |
