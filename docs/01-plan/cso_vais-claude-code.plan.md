# vais-claude-code — CSO 위협 분석 (Plan)

## 검증 범위

- **Gate A**: OWASP Top 10 보안 스캔
- **Gate B**: Claude Code 플러그인 구조 검증

## 검사 대상

| 경로 | 설명 |
|------|------|
| `lib/` | fs-utils, io, memory, paths, status, ui, webhook, hook-logger, observability |
| `scripts/` | bash-guard, phase-transition, agent-start, agent-stop |
| `hooks/` | hooks.json, session-start.js |
| `agents/` | C-Suite 7개 + 실행 에이전트 8개 + PM 4개 + absorb-analyzer |
| `package.json` | 플러그인 매니페스트 |
| `skills/vais/SKILL.md` | 스킬 진입점 |

## 위협 범위 (Gate A)

| OWASP 항목 | 검사 포커스 |
|-----------|-----------|
| A01 접근 제어 | 에이전트 직접 호출 우회, CLI 인자 검증 |
| A02 암호화 | 하드코딩 민감 정보 |
| A03 인젝션 | bash-guard 우회, path traversal |
| A04 설계 | 피처명 검증 로직 |
| A05 설정 오류 | .gitignore, 파일 접근 제어 |
| A06 구성요소 | npm 의존성 취약점 |
| A07 인증 | 해당 없음 (로컬 플러그인) |
| A08 무결성 | hooks.json 환경변수 인젝션 |
| A09 로깅 | event-log, hook-log 적절성 |
| A10 SSRF | webhook.js 사설 IP 요청 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-03 | 초기 작성 |
