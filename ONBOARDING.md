# VAIS — Onboarding (5분 읽기)

> **이 파일의 책임**: 처음 본 AI/사람이 구조·진입점·워크플로우를 5분 안에 파악하는 가이드. (v2.0)

## 1. 무엇인가

Claude Code 플러그인. 목적은 두 가지:

1. **이력 + 일관성 있는 개발** — 피처마다 `plan → do → review` 를 돌고, 문서 3개가 남는다. `guidelines/` 지침이 코드·문서 스타일을 잡고, review 마다 교훈이 지침으로 승격된다.
2. **완성도 높은 보고서** — `design-system/brands/` 71종 브랜드 토큰으로 AI 티 나지 않는 HTML 보고서/슬라이드를 만든다.

v1.x 의 C-Suite 조직 시뮬레이션은 제거됐다. 왜/어떻게는 `docs/260730_vais_code_review/` (분석 6문서 + `assets/review-report.html`).

## 2. 진입점

| 하고 싶은 것 | 명령 |
|-------------|------|
| 새 기능 시작 | `/vais plan {feature}` — 범위·완료 조건 합의. 30분 내 작업이면 "바로 실행" 제안이 옴 |
| 구현 | `/vais do {feature}` (`--design` 으로 UI 설계 선행) |
| 검증·마무리 | `/vais review {feature}` — 완료 조건 대조 + 승격 루프 |
| 보고서/슬라이드 | `/vais report {주제}` / `/vais deck {주제}` |
| 상태/커밋 | `/vais status` / `/vais commit` |

## 3. 읽는 순서 (파일 6개면 전체가 보인다)

1. `CLAUDE.md` — 규칙 7개 (정본)
2. `skills/vais/SKILL.md` — 라우팅 + 공통 규칙
3. `skills/vais/phases/plan.md → do.md → review.md` — 각 단계 절차
4. `guidelines/code-conventions.md` + `doc-conventions.md` — 일관성 지침
5. `skills/report/SKILL.md` + `design-rules.md` — 보고서 생성기
6. `vais.config.json` — 설정 50줄

## 4. 동작 원리 (하네스)

- **hook 3개**: SessionStart 가 상태 요약 주입(~150B) · PreToolUse Bash 가 위험 명령 차단 · Stop 이 1줄 힌트
- **상태**: `.vais/status.json` (`lib/status.js`) — 피처·phase·brand 추적, 세션 간 복원
- **sub-agent 7종** (`agents/`): frontend/backend/test/qa-engineer, ui-designer, incident-responder, security-auditor — do/review 에서 병렬 위임용
- **검증**: `npm test` (node --test) + `node scripts/vais-validate-plugin.js` (구조·버전 동기화·지침 크기 예산)

## 5. 기여 시 주의

- 지침 파일은 크기 예산이 있다 (초과 시 validator 가 커밋 차단) — 규칙 추가 시 하나 제거
- 같은 규칙을 두 곳에 쓰지 않는다 — 참조만
- `docs/_archive/` 는 읽기 전용 이력
