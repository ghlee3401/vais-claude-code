# vais-claude-code — CSO 위협 분석 (Plan)

## 검증 범위

- **Gate A**: OWASP Top 10 보안 스캔
- **Gate B**: Claude Code 플러그인 구조 검증
- **Gate C**: 독립 코드 리뷰 (코드 품질 + 버그 패턴 + 성능)

## 이전 리뷰 이후 주요 변경사항

| 커밋 | 내용 | 보안 영향 |
|------|------|----------|
| `7497e1e` | SubagentStop 훅 필수 문서 미작성 차단 | agent-stop.js 로직 변경 |
| `62192e7` | 에이전트 하위 폴더 재구조화 + Gate C 신설 | 에이전트 경로 구조 변경 |
| `7ca7904` | CEO를 Product Owner로 승격 | 오케스트레이션 변경 |
| `ce22449` | path traversal 방지 + 코드 리뷰 반영 | 보안 수정 반영 확인 필요 |
| `6dac723` | absorb 워크플로우 MCP 흡수 경로 추가 | 새 기능 검증 |

## 검사 대상

| 경로 | 설명 |
|------|------|
| `lib/` | fs-utils, io, memory, paths, status, ui, webhook, hook-logger, observability |
| `scripts/` | bash-guard, phase-transition, agent-start, agent-stop, doc-validator, doc-tracker |
| `hooks/` | hooks.json, session-start.js |
| `agents/` | C-Suite 7개 (ceo/cpo/cto/cso/cmo/coo/cfo 폴더) + 실행 에이전트 + PM 4개 |
| `package.json` | 플러그인 매니페스트 |
| `skills/vais/SKILL.md` | 스킬 진입점 |
| `vais.config.json` | 전체 설정 |

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

## 코드 품질 범위 (Gate C)

| 카테고리 | 검사 포인트 |
|---------|-----------|
| 버그 패턴 | 미처리 예외, null 참조, 경쟁 조건 |
| 성능 안티패턴 | 불필요한 동기 I/O, 메모리 누수 |
| 코드 일관성 | 네이밍, 에러 처리 방식, 중복 코드 |
| 에이전트 정합성 | frontmatter 형식, 경로 참조 정확성 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-03 | 초기 작성 |
| v2.0 | 2026-04-03 | 2차 리뷰: Gate C 추가, 이전 리뷰 이후 변경사항 반영 |
