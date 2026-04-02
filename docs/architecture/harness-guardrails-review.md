# Harness-Based Plugin Development Guardrails — Code Review

> **Date:** 2026-04-02
> **Status:** Review Complete / Implementation Pending
> **Reviewer:** Claude Code (Opus 4.6)

## Core Philosophy

> "말을 훈련시키지 말고, 실패가 불가능한 더 나은 하네스를 만들어라"
> "Do not just train the horse; build a better harness where failure is no longer an option."

### 판단 기준: 최소한으로, 대신 확실하게

하네스는 **되돌릴 수 없는 것만 막고, 나머지는 경고만 한다.**

과도한 제약은 LLM의 자율성과 창의성을 죽인다. Gate가 많으면 매 단계마다 확인 요청 모드로 전환되고, 문서 형식을 강제하면 내용 품질이 떨어진다. 따라서 모든 Gap에 대해 "구현할 것(Implement)"과 "보류할 것(Defer)"을 구분한다.

**Implement 기준:** 되돌릴 수 없는 파괴적 실수를 방지하는가?
**Defer 기준:** 문제가 실제로 발생한 적이 있는가? 없으면 YAGNI.

---

## 1. Structural Enforcement — "실패를 구조적으로 불가능하게"

### 현재 상태

**잘 된 점:**
- `vais-validate-plugin.js` (965줄) — plugin.json, hooks.json, agents, skills 구조를 포괄적으로 검증
- Feature name validation (`/^[a-zA-Z0-9가-힣_-]+$/`) — path traversal 방지
- ESLint 설정 (no-eval, strict equality, no-var)

### Gap 분석

| 문제 | 심각도 | 판정 | 근거 |
|------|--------|------|------|
| ESLint가 git hook에 통합되지 않음 | HIGH | **Implement** | 테스트 8개가 이미 있는데 안 돌리는 건 아까움 |
| CI/CD 파이프라인 부재 | MEDIUM | **Defer** | 현재 1인 개발 규모에서 과도. 협업 시작 시 추가 |
| Phase 순서 미강제 | MEDIUM | **Defer** | CLAUDE.md 텍스트 규칙으로 충분. LLM은 명시적 규칙을 잘 따름 |
| `@see` 참조 규칙 미검증 | LOW | **Defer** | 실제 문제 발생 사례 없음 |

### 권장 조치

- `pre-commit` hook으로 기존 테스트 + ESLint 자동 실행 (이미 있는 자산 활용)

---

## 2. Executable Context — "CLAUDE.md를 런타임 설정으로"

### 현재 상태

**잘 된 점:**
- `CLAUDE.md`가 7개 Mandatory Rules를 명확히 정의
- `vais.config.json`이 roles, phases, paths, gates를 중앙 관리
- `session-start.js`가 세션 시작 시 context를 자동 주입 (progress bar, workflow map, output style)
- Agent frontmatter로 각 에이전트의 역할/도구 제한을 선언

### Gap 분석

| 문제 | 심각도 | 판정 | 근거 |
|------|--------|------|------|
| `vais.config.json` 스키마 검증 없음 | HIGH | **Implement** | silent failure는 디버깅 지옥. required field 존재 여부 정도만 체크 |
| Agent `disallowedTools` 강제 여부 불확실 | MEDIUM | **Defer** | Claude Code 플랫폼이 honor하는 영역. 플러그인에서 이중 검증할 필요 없음 |
| `project-config.json` 무검증 로드 | MEDIUM | **Defer** | config 로드 실패 시 기본값 fallback이 이미 있음 |

### 권장 조치

- `vais.config.json` 로드 시 required field 존재 여부만 체크 (full JSON Schema는 과도)
- 누락 시 명확한 에러 메시지 출력 후 **fail-fast**

---

## 3. Physical Guardrails — "물리적으로 차단"

### 현재 상태

**잘 된 점:**
- `bash-guard.js`가 11개 위험 패턴을 **hard block** (DROP DATABASE, git push --force, mkfs, fork bomb 등)
- C-Suite vs Execution 에이전트 2-tier 권한 분리
- 3단계 의사결정 구조 (block/warn/allow)가 이미 잘 설계됨
- 모든 hook 결정이 `.vais/hook-log.jsonl`에 로깅

### Gap 분석

| 문제 | 심각도 | 판정 | 근거 |
|------|--------|------|------|
| 경로 경계 검증 없음 | HIGH | **Implement** | path traversal은 보안 기본. `../` 한 번이면 시스템 파일 접근 가능 |
| `rm -r`이 warn만 — block이 아님 | MEDIUM | **Defer** | 현재 warn + 사용자 확인 구조가 적절. 테스트 cleanup 등에서 필요한 경우 있음 |
| Shell escape 우회 가능 | LOW | **Defer** | Claude가 의도적으로 `${IFS}` 쓸 일이 거의 없음. 이론적 위협 |
| 비밀 정보 스캔 없음 | LOW | **Defer** | Claude Code 자체에 시크릿 경고 기능 있음. 이중 구현 불필요 |
| Fork bomb 변형 미탐지 | LOW | **Defer** | 리터럴 매칭으로 충분. 변형까지 막으면 오탐 위험 |

### 권장 조치

```javascript
// lib/paths.js — path traversal 방지만 추가
function safePath(base, input) {
  const resolved = path.resolve(base, input);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error('Path traversal blocked');
  }
  return resolved;
}
```

---

## 4. Autonomous Feedback Loop — "AI가 스스로 테스트하고 자기 수정"

### 현재 상태

**잘 된 점:**
- QA 에이전트의 gap analysis loop (90% threshold, 최대 5회 자동 반복)
- `doc-tracker.js`가 문서 작성 시 자동으로 phase 완료 업데이트
- Manager memory 시스템이 decision/dependency/debt를 추적
- Agent lifecycle 전체가 event-log.jsonl에 기록

### Gap 분석

| 문제 | 심각도 | 판정 | 근거 |
|------|--------|------|------|
| 에러 발생 시 자동 복구 없음 | MEDIUM | **Defer** | 자동 재시도는 같은 실수 반복 가능. 사람이 판단하는 게 나음 |
| Gate 실패 시 자동 라우팅 없음 | MEDIUM | **Defer** | 복잡도 대비 효용 낮음. 수동 개입이 오히려 품질 보장 |
| 문서 품질 검증 없음 | LOW | **Defer** | 형식 강제는 LLM의 유연성을 죽임. 내용은 사람이 판단 |
| 테스트 자동 실행 없음 | LOW | **Defer** | pre-commit hook으로 커밋 시점에 커버됨 |
| MCP 서버 비활성화 | LOW | **Defer** | 현재 규모에서 불필요. 멀티유저 환경 시 재고 |

### 권장 조치

- 현재 수준 유지. QA gap analysis + doc-tracker + event logging 조합이 이미 충분
- 문제가 반복 발생하는 특정 패턴이 보이면 그때 targeted하게 추가

---

## 5-Layer Architecture 정합성 (Agent Development Kit 기준)

다이어그램 참조: CLAUDE.md + Skills + Hooks + Subagents + Plugins = The Agent Development Kit

| Layer | 역할 | VAIS 구현 | 상태 |
|-------|------|-----------|------|
| L1. CLAUDE.md | The Memory Layer — rules, conventions | `CLAUDE.md` 7개 규칙 + `vais.config.json` 중앙 설정 | ✅ |
| L2. Skills | The Knowledge Layer — on-demand context | `skills/vais/SKILL.md` + `phases/` + `utils/`, 11개 액션 | ✅ |
| L3. Hooks | The Guardrail Layer — deterministic, not AI | `hooks.json` 6개 훅 (bash-guard, doc-tracker 등) | ✅ |
| L4. Subagents | The Delegation Layer — own context/model/tools | `agents/` 20개, C-Suite(Opus)/Execution(Sonnet) 분리 | ✅ |
| L5. Plugins | The Distribution Layer — marketplace package | `.claude-plugin/plugin.json` + `marketplace.json` | ✅ |

### 아키텍처 수준 보완 사항

| 문제 | 심각도 | 판정 | 근거 |
|------|--------|------|------|
| Skills auto-invoke 미연결 | MEDIUM | **Implement** | `vais.config.json`에 `autoKeywords` 정의는 있지만, 실제 description matching → 자동 호출까지 연결 안 됨. 다이어그램 L2의 "auto-invoked" 패턴 미충족 |

현재 `autoKeywords` 설정:
```json
"autoKeywords": {
  "cso": ["payment", "auth", "login", "security"],
  "cmo": ["landing", "marketing", "launch"],
  "ceo": ["new product", "strategy"],
  "coo": ["deploy", "release"]
}
```
→ 이 키워드가 피처명에 매칭되면 해당 C-Level을 자동 호출하는 로직 필요.

---

## 종합 평가

| 원칙 | 현재 수준 | 적정 목표 | 비고 |
|------|-----------|-----------|------|
| Structural Enforcement | ★★★☆☆ | ★★★★☆ | pre-commit hook 하나면 충분 |
| Executable Context | ★★★★☆ | ★★★★☆ | config 로드 검증만 추가 |
| Physical Guardrails | ★★★☆☆ | ★★★★☆ | path traversal 방지만 추가 |
| Autonomous Feedback Loop | ★★★☆☆ | ★★★☆☆ | 현재 수준 유지 |

> 목표를 ★★★★★로 잡지 않는다. 과도한 하네스는 또 다른 기술 부채.

---

## 구현 항목 (4개)

| # | 항목 | 대상 파일 | 난이도 | 효과 |
|---|------|-----------|--------|------|
| 1 | `pre-commit` hook — 기존 테스트 + ESLint 자동 실행 | `package.json`, `.husky/` | 낮음 | 이미 있는 자산 활용 |
| 2 | `vais.config.json` 로드 시 required field 검증 | config 로드 로직 | 낮음 | silent failure 방지 |
| 3 | `lib/paths.js`에 path traversal 방지 | `lib/paths.js` | 낮음 | 보안 기본 |
| 4 | Skills auto-invoke — autoKeywords 매칭 시 C-Level 자동 호출 | skill 라우팅 로직 | 중간 | L2 아키텍처 완성 |

---

## 보류 항목 (문제 발생 시 재검토)

| 항목 | 보류 근거 | 재검토 트리거 |
|------|-----------|---------------|
| Shell escape 탐지 | LLM이 의도적 우회할 가능성 극히 낮음 | bash-guard 우회 사례 발생 시 |
| Phase hard gate | 텍스트 규칙으로 LLM이 잘 따름 | Phase 건너뛰기가 반복 발생 시 |
| 문서 내용 검증 | 형식 강제가 오히려 품질 저하 | 빈 문서/의미 없는 문서 반복 시 |
| 에러 자동 재시도 | 같은 실수 반복 위험 | 특정 에러 패턴이 3회 이상 반복 시 |
| Gate 자동 에스컬레이션 | 복잡도 대비 효용 낮음 | 팀 규모 확장 시 |
| CI/CD 파이프라인 | 1인 개발 규모에서 과도 | 협업자 추가 시 |
| 비밀 정보 스캔 | Claude Code 자체 기능으로 커버 | 시크릿 유출 사례 발생 시 |
| JSON Schema 강제 | required field 체크로 충분 | config 오류가 반복 발생 시 |
| MCP 실시간 모니터링 | 현재 규모에서 불필요 | 멀티유저/프로덕션 환경 시 |

---

## 참고 파일

| 파일 | 역할 |
|------|------|
| `scripts/vais-validate-plugin.js` | 플러그인 구조 검증 (965줄) |
| `scripts/bash-guard.js` | PreToolUse 위험 명령 차단 (78줄) |
| `scripts/doc-tracker.js` | PostToolUse 문서 추적 (85줄) |
| `scripts/doc-validator.js` | C-Level 문서 검증 (104줄) |
| `hooks/hooks.json` | Hook 라이프사이클 정의 (72줄) |
| `hooks/session-start.js` | 세션 시작 컨텍스트 주입 (109줄) |
| `lib/status.js` | 워크플로우 상태 관리 |
| `lib/paths.js` | 경로 해석 + 템플릿 (177줄) |
| `lib/memory.js` | 매니저 메모리 시스템 |
| `lib/observability/event-logger.js` | 이벤트 로깅 |
| `vais.config.json` | 마스터 설정 (119줄) |
| `.eslintrc.json` | 린터 설정 (21줄) |
| `tests/*.test.js` | 유닛 테스트 (8개) |
