# VAIS - Agent Instructions (Cursor / Copilot / 범용)

> **이 파일의 책임**: 다른 AI 도구용 호환 지침. Claude Code 는 `CLAUDE.md` 를 자동 로드한다 (동일 내용의 정본). 처음이면 `ONBOARDING.md` 5분 가이드 먼저.

## 프로젝트

개발 이력 + 일관성 도구 (Claude Code plugin `vais-code` v2.0). `plan → do → review` 3단계 워크플로우, 피처당 문서 3개(`docs/{feature}/plan.md · notes.md · review.md`), `guidelines/` 지침 + review 승격 루프, brand 토큰 기반 HTML 보고서/덱 생성기 (`/vais report`, `/vais deck`).

## 규칙 (요약 — 상세·정본은 CLAUDE.md)

1. `docs/{feature}/plan.md` 없이 구현하지 않는다 (합의된 30분 내 소규모 작업 제외)
2. plan 은 문서만 작성, do 가 구현, review 는 검증·결함 교정만
3. 문서는 피처당 3파일 — 형식·길이 상한은 `guidelines/doc-conventions.md`
4. 코드 스타일은 `guidelines/code-conventions.md` — CJS, 에러 처리 2모드(hook fail-safe / CLI fail-loud), `node --test`
5. `rm -rf` · `git push --force` · `DROP TABLE` 금지, 시크릿은 환경 변수로만
6. 커밋 전 `npm test` + `node scripts/vais-validate-plugin.js`. 버전 동기화 5곳: package.json / vais.config.json / .claude-plugin/plugin.json / .claude-plugin/marketplace.json ×2 / CHANGELOG.md
7. `docs/_archive/` 읽기 전용, top-level `docs/NN-` 경로 금지
