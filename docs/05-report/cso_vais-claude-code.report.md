# vais-claude-code — CSO 보안 검토 보고서

> 피처: vais-claude-code | 버전: v0.32.0 | 검토일: 2026-04-02

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | vais-claude-code (Claude Code 마켓플레이스 플러그인) |
| 검토일 | 2026-04-02 |
| Gate A (보안 검토) | ⚠️ 조건부 통과 — OWASP 5/10 Pass, 5 Warning, Critical 0건 |
| Gate B (플러그인 검증) | ⚠️ 조건부 통과 — 40 Pass / 2 Fail |
| **최종 판정** | **⚠️ 조건부 승인** |

---

## Security Review

### Gate 결과

- Gate A (보안 검토): **⚠️ 조건부 통과**
- Gate B (플러그인 검증): **⚠️ 조건부 통과**

---

## Gate A — OWASP Top 10 보안 스캔

### 스캔 대상

- `lib/` — 핵심 라이브러리 (fs-utils, io, memory, paths, status, ui, webhook, debug)
- `scripts/` — bash-guard, phase-transition, auditors
- `hooks/` — hooks.json, session-start.js
- `agents/` — C-Suite + 실행 에이전트 20개
- `skills/` — SKILL.md + phases/ + utils/
- `mcp/` — MCP 서버 설정
- `package.json`, `vais.config.json`

### 항목별 결과

| # | 항목 | 결과 | 핵심 발견 |
|---|------|------|-----------|
| A01 | Broken Access Control | ⚠️ Warning | MCP `query` 파라미터 쉘 보간 시 메타문자 필터링 없음 (`mcp/design-system-server.json:15`) |
| A02 | Cryptographic Failures | ✅ Pass | 하드코딩 시크릿 없음, 환경변수 관리 적절 |
| A03 | Injection | ⚠️ Warning | bash-guard 우회 가능 패턴 존재, MCP query 미검증 |
| A04 | Insecure Design | ✅ Pass | 최소 권한 원칙 준수, Gate 체크포인트, 원자적 쓰기 양호 |
| A05 | Security Misconfiguration | ✅ Pass | MCP/webhook 기본 비활성화, 디버그 옵트인 |
| A06 | Vulnerable Components | ⚠️ Warning | 외부 의존성 없으나 `vendor/` 수동 관리 필요 |
| A07 | Auth Failures | ✅ Pass | 해당 없음 (로컬 플러그인, 인증 불필요) |
| A08 | Data Integrity Failures | ⚠️ Warning | subagent 파라미터 미검증 (저위험), CI/CD 미설정 |
| A09 | Logging Failures | ✅ Pass | 훅 이벤트 로깅 완비, 민감 데이터 미노출 |
| A10 | SSRF | ⚠️ Warning | webhook URL 내부 주소 차단 로직 없음 (`lib/webhook.js`) |

**OWASP 통과율**: 5/10 Pass, 5 Warning, **0 Critical**

### 양호 항목 상세

| 항목 | 근거 |
|------|------|
| 피처명 Path Traversal 방지 | `lib/status.js:15-21` — 정규식 `^[a-zA-Z0-9가-힣_-]+$`로 경로 조작 차단 |
| 원자적 파일 쓰기 | `lib/fs-utils.js:13-22` — 임시파일 → rename 방식, try/finally 정리 |
| 설정 캐시 TTL | `lib/paths.js:85-91` — 30초 TTL 기반 loadConfig 캐시 |
| bash-guard 차단 | `scripts/bash-guard.js:10-27` — DROP DATABASE, mkfs, fork bomb 등 차단 |
| 로그 회전 | hook-logger 500줄 제한, event-logger 10MB/30일 rotation |
| eval/Function 미사용 | lib/, scripts/ 전체에서 eval, new Function 미발견 |

### 발견된 취약점

| 심각도 | 항목 | 파일 | 상세 | 권장 조치 |
|--------|------|------|------|-----------|
| 🔴 높음 | SSRF — 내부 IP 미차단 | `lib/webhook.js:76-80` | `new URL()` 형식 검증만 수행, `localhost`, `127.0.0.1`, `169.254.169.254` 등 내부 주소 미차단 | 내부 IP 대역 블랙리스트 추가 |
| 🟡 중간 | MCP query 인젝션 | `mcp/design-system-server.json:15,25,34` | `query` 파라미터가 쉘 명령에 직접 보간, `project_name`은 패턴 적용됨 | `query`에도 `pattern` 제약 추가 |
| 🟡 중간 | bash-guard 우회 | `scripts/bash-guard.js` | 블랙리스트 방식, `$(...)` 서브쉘/base64 인코딩 우회 미감지 | 서브쉘 패턴 추가 검토 |
| 🟢 낮음 | doc-tracker 경로 비교 | `scripts/doc-tracker.js:35-38` | `endsWith` 비교로 suffix 충돌 가능성 (실제 악용 시나리오 제한적) | `path.resolve` 기반 절대경로 비교 검토 |
| 🟢 낮음 | vendor 수동 관리 | `vendor/ui-ux-pro-max/` | 자동화 취약점 스캔 대상 외, 수동 업데이트 필요 | 수동 업데이트 정책 수립 |

---

## Gate B — 플러그인 구조 검증

### 1. package.json 검증

| 항목 | 결과 | 세부 |
|------|------|------|
| `name` 필드 | ✅ Pass | `vais-code` (kebab-case 유효) |
| `version` 필드 | ✅ Pass | `0.32.0` (semver 형식) |
| `description` 필드 | ✅ Pass | 존재 |
| `author` 필드 | ✅ Pass | `ghlee3401` |
| `license` 필드 | ✅ Pass | `MIT` |
| `claude-plugin.skills` | ✅ Pass | `skills/vais/SKILL.md` → 파일 존재 |
| `claude-plugin.agents` | ✅ Pass | `agents/` → 20개 파일 존재 |
| `claude-plugin.hooks` | ✅ Pass | `hooks/hooks.json` → 파일 존재 |

### 2. SKILL.md 검증

| 항목 | 결과 | 세부 |
|------|------|------|
| 파일 존재 | ✅ Pass | `skills/vais/SKILL.md` |
| `name` 필드 | ✅ Pass | `vais` |
| `description` 필드 | ✅ Pass | 존재 |
| Triggers 키워드 | ✅ Pass | vais, help, cto, ceo, cmo, cso 등 |
| `Do NOT use for` 제한 | ✅ Pass | `단순 질문, 코드 없는 대화` 명시 |
| `argument-hint` 필드 | ✅ Pass | `[action] [feature]` |
| `allowed-tools` 필드 | ✅ Pass | 9개 도구 명시 |
| 실행 지침 섹션 | ✅ Pass | 존재 |

### 3. agents/ 검증 (20개)

| 항목 | 결과 | 세부 |
|------|------|------|
| `name` 전체 존재 | ✅ Pass | 20/20 |
| `description` 전체 존재 | ✅ Pass | 20/20 |
| `Triggers` 포함 | ✅ Pass | 20/20 (서브에이전트는 "직접 호출 금지" 명시) |
| `model` 유효값 | ✅ Pass | opus 7개 (C-Suite), sonnet 13개 (실행) |
| `tools` 전체 존재 | ✅ Pass | 20/20 |
| `disallowedTools` 정의 | ❌ Fail | **4개 파일 누락**: `pm-discovery.md`, `pm-prd.md`, `pm-strategy.md`, `pm-research.md` |

### 4. hooks/ 검증

| 항목 | 결과 | 세부 |
|------|------|------|
| `hooks/hooks.json` 존재 | ✅ Pass | JSON 유효 |
| `hooks/session-start.js` | ✅ Pass | 존재 |
| `scripts/bash-guard.js` | ✅ Pass | PreToolUse 참조 |
| `scripts/doc-tracker.js` | ✅ Pass | PostToolUse 참조 |
| `scripts/stop-handler.js` | ✅ Pass | Stop 참조 |
| `scripts/agent-start.js` | ✅ Pass | SubagentStart 참조 |
| `scripts/agent-stop.js` | ✅ Pass | SubagentStop 참조 |
| 코드 안전성 (`eval`/`execSync`) | ✅ Pass | 미발견 |

### 5. 버전 일관성

| 파일 | 버전 | 결과 | 비고 |
|------|------|------|------|
| `package.json` | `0.32.0` | — | 기준 |
| `vais.config.json` | `0.32.0` | ✅ Pass | 일치 |
| `CHANGELOG.md` | `0.25.0` | ❌ Fail | **최신 항목 0.25.0, 0.26.0~0.32.0 누락 (7개 버전)** |
| `hooks/session-start.js` | 동적 참조 | ✅ Pass | `loadConfig()`으로 자동 동기화 |
| `output-styles/vais-default.md` | 참조 없음 | ✅ Pass | 하드코딩 없음 |
| `skills/vais/SKILL.md` | 참조 없음 | ✅ Pass | 하드코딩 없음 |

### 6. 필수 파일 존재

| 파일 | 결과 |
|------|------|
| `README.md` | ✅ Pass |
| `CLAUDE.md` | ✅ Pass |
| `CHANGELOG.md` | ✅ Pass |
| `LICENSE` | ✅ Pass |

### Gate B 통합

| 구분 | Pass | Fail |
|------|------|------|
| package.json | 8 | 0 |
| SKILL.md | 8 | 0 |
| agents/ | 6 | 1 |
| hooks/ | 8 | 0 |
| 버전 일관성 | 4 | 1 |
| 필수 파일 | 4 | 0 |
| 코드 안전성 | 2 | 0 |
| **합계** | **40** | **2** |

---

## 필수 개선 목록

| 우선순위 | 항목 | 파일 | 조치 |
|----------|------|------|------|
| 🔴 높음 | SSRF 방어 | `lib/webhook.js` | `localhost`, `127.0.0.1`, `169.254.*` 등 내부 IP 차단 로직 추가 |
| 🔴 높음 | CHANGELOG 버전 불일치 | `CHANGELOG.md` | 0.26.0~0.32.0 변경 이력 보강 |
| 🟡 중간 | MCP query 인젝션 방어 | `mcp/design-system-server.json` | `query` 파라미터에 `pattern` 제약 추가 |
| 🟡 중간 | PM agents disallowedTools | `agents/pm-*.md` (4개) | `disallowedTools` 선언 추가 |
| 🟢 낮음 | bash-guard 패턴 보강 | `scripts/bash-guard.js` | 서브쉘 `$(...)` 패턴 추가 검토 |
| 🟢 낮음 | vendor 업데이트 정책 | `vendor/ui-ux-pro-max/` | 수동 보안 업데이트 주기 수립 |

---

## 배포 승인 여부

- [ ] 승인
- [x] **조건부 승인** — 🔴 높음 2건 해결 후 배포 권장
- [ ] 차단

### 조건부 승인 사유

1. **Critical 취약점 0건** → 배포 차단 사유 없음
2. **Warning 5건 + Fail 2건** → 완전 승인 불가
3. 🔴 높음 항목(SSRF 방어, CHANGELOG 보강)은 마켓플레이스 배포 전 해결 강력 권장
4. 🟡 중간 항목(MCP 인젝션, PM agents disallowedTools)은 차기 릴리스까지 해결 권장

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-02 | 초기 작성 — Gate A (OWASP Top 10) + Gate B (플러그인 구조 검증) |
