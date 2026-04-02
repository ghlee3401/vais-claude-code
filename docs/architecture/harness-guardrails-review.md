# Harness-Based Plugin Development Guardrails — Code Review

> **Date:** 2026-04-02
> **Status:** Review Complete / Implementation Pending
> **Reviewer:** Claude Code (Opus 4.6)

## Core Philosophy

> "말을 훈련시키지 말고, 실패가 불가능한 더 나은 하네스를 만들어라"
> "Do not just train the horse; build a better harness where failure is no longer an option."

---

## 1. Structural Enforcement — "실패를 구조적으로 불가능하게"

### 현재 상태

**잘 된 점:**
- `vais-validate-plugin.js` (965줄) — plugin.json, hooks.json, agents, skills 구조를 포괄적으로 검증
- Feature name validation (`/^[a-zA-Z0-9가-힣_-]+$/`) — path traversal 방지
- ESLint 설정 (no-eval, strict equality, no-var)

**Gap:**

| 문제 | 심각도 | 설명 |
|------|--------|------|
| ESLint가 git hook에 통합되지 않음 | HIGH | 수동 실행에 의존 — 커밋 시 우회 가능 |
| CI/CD 파이프라인 부재 | HIGH | `.github/workflows/` 없음 — 테스트/린트가 자동 실행되지 않음 |
| Phase 순서 미강제 | MEDIUM | CLAUDE.md에 "plan→design→architect→impl→qa" 규칙 있지만, 코드에서 순서 건너뛰기를 **차단하지 않음** |
| `@see` 참조 규칙 미검증 | LOW | vais.config.json에 규칙 정의만 있고, 실제 검증 로직 없음 |

### 권장 조치

- `pre-commit` hook으로 ESLint + `vais-validate-plugin.js`를 자동 실행
- Phase transition에서 이전 단계 완료 여부를 **hard block**으로 강제
- GitHub Actions CI/CD 파이프라인 추가 (lint → test → validate-plugin)

---

## 2. Executable Context — "CLAUDE.md를 런타임 설정으로"

### 현재 상태

**잘 된 점:**
- `CLAUDE.md`가 7개 Mandatory Rules를 명확히 정의
- `vais.config.json`이 roles, phases, paths, gates를 중앙 관리
- `session-start.js`가 세션 시작 시 context를 자동 주입 (progress bar, workflow map, output style)
- Agent frontmatter로 각 에이전트의 역할/도구 제한을 선언

**Gap:**

| 문제 | 심각도 | 설명 |
|------|--------|------|
| `vais.config.json` 스키마 검증 없음 | HIGH | 잘못된 config가 silent fallback — 런타임 오류 발생 가능 |
| Agent `disallowedTools` 강제 여부 불확실 | MEDIUM | frontmatter에 선언만 있고, Claude Code API가 이를 honor하는지 보장 없음 |
| `project-config.json` 무검증 로드 | MEDIUM | 사용자 프로젝트 설정이 검증 없이 로드됨 |

### 권장 조치

- `vais.config.json`에 JSON Schema를 정의하고, 로드 시 `ajv` 등으로 validate
- 잘못된 config는 **fail-fast** 처리
- `project-config.json`에도 동일한 스키마 검증 적용

---

## 3. Physical Guardrails — "물리적으로 차단"

### 현재 상태

**잘 된 점:**
- `bash-guard.js`가 11개 위험 패턴을 **hard block** (DROP DATABASE, git push --force, mkfs, fork bomb 등)
- C-Suite vs Execution 에이전트 2-tier 권한 분리:
  - C-Suite: `rm -rf`, `git push --force` 차단 (force-with-lease 허용)
  - Execution: **모든 git push 차단** (더 엄격)
- 모든 hook 결정이 `.vais/hook-log.jsonl`에 로깅

**Gap:**

| 문제 | 심각도 | 설명 |
|------|--------|------|
| `rm -r`이 warn만 — block이 아님 | HIGH | `DROP TABLE`은 block하면서 `rm -rf`는 경고만? 일관성 부족 |
| Shell escape 우회 가능 | HIGH | `DROP${IFS}DATABASE`, `$(cmd)` 등 인코딩으로 패턴 우회 가능 |
| 경로 경계 검증 없음 | HIGH | `../../../etc/passwd` 같은 path traversal 미차단 |
| 비밀 정보 스캔 없음 | MEDIUM | Write/Edit hook에서 하드코딩된 API key, password 미검출 |
| Fork bomb 탐지가 리터럴 매칭만 | LOW | `X(){X|X&};X` 같은 변형 미탐지 |

### 권장 조치 (코드 예시)

```javascript
// bash-guard.js — rm -rf를 block으로 승격
{ pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b/, action: 'block' }

// bash-guard.js — Shell escape 탐지
{ pattern: /\$\{IFS\}/, action: 'block', reason: 'Shell variable injection detected' }

// lib/paths.js — Path traversal 차단
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

**Gap:**

| 문제 | 심각도 | 설명 |
|------|--------|------|
| 에러 발생 시 자동 복구 없음 | HIGH | `error` 이벤트가 로그만 되고, 자동 재시도/에스컬레이션 없음 |
| Gate 실패 시 자동 라우팅 없음 | HIGH | Gate 체크포인트에서 항상 수동 개입 필요 |
| 문서 품질 검증 없음 | MEDIUM | doc-tracker가 파일 존재만 확인 — 내용(섹션, 최소 길이) 미검증 |
| 테스트 자동 실행 없음 | MEDIUM | `package.json`에 test script 미정의 — QA 단계에서 자동 테스트 트리거 불가 |
| MCP 서버 비활성화 | LOW | `mcp.enabled: false` — 실시간 모니터링 스트리밍 불가 |

### 권장 조치

- Stop hook에서 실패한 에이전트를 감지 → 자동 재시도 로직 추가
- doc-validator가 문서 **내용**(섹션 존재, 최소 길이)까지 검증하도록 확장
- `package.json`에 `test` script 정의 → QA 에이전트가 자동 트리거
- Gate 실패 시 자동 에스컬레이션 경로 정의 (예: qa 실패 → cto에게 보고)

---

## 종합 평가

| 원칙 | 현재 수준 | 목표 | 비고 |
|------|-----------|------|------|
| Structural Enforcement | ★★★☆☆ | ★★★★★ | 검증 도구는 있지만 자동 실행이 안 됨 |
| Executable Context | ★★★★☆ | ★★★★★ | CLAUDE.md + config 중앙 관리 우수 |
| Physical Guardrails | ★★★☆☆ | ★★★★★ | 패턴 기반 차단 있지만 우회 가능 |
| Autonomous Feedback Loop | ★★★☆☆ | ★★★★★ | QA gap analysis 있지만 에러 복구 루프 없음 |

---

## 우선 구현 로드맵

### Phase 1 — 즉시 (Quick Wins)

1. **`bash-guard.js` 강화**
   - `rm -rf` → warn에서 block으로 승격
   - Shell escape 패턴 탐지 추가 (`${IFS}`, backtick, `$()`)
2. **`pre-commit` hook 추가**
   - ESLint 자동 실행
   - `vais-validate-plugin.js` 자동 실행
3. **`lib/paths.js`에 path traversal 방지** 추가

### Phase 2 — 단기 (Config Hardening)

4. **`vais.config.json` JSON Schema** 정의 + 로드 시 검증
5. **Phase transition hard gate** — 이전 단계 미완료 시 차단
6. **Doc-validator 내용 검증** — 필수 섹션 + 최소 길이 체크

### Phase 3 — 중기 (Feedback Loop)

7. **에러 자동 복구** — Stop hook에서 실패 에이전트 재시도
8. **Gate 실패 에스컬레이션** — 자동 CTO 보고 경로
9. **GitHub Actions CI/CD** — PR 시 lint + test + validate 자동 실행

### Phase 4 — 장기 (Advanced)

10. **비밀 정보 스캔** — Write/Edit hook에서 하드코딩된 시크릿 탐지
11. **MCP 서버 활성화** — 실시간 워크플로우 모니터링
12. **Cross-feature dependency resolution** — 자동 의존성 순서 결정

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
