# Agent Guidelines

> Cursor, GitHub Copilot, Windsurf 등 다른 AI 도구와의 호환을 위한 범용 에이전트 지침.
> Claude Code 전용 지침은 CLAUDE.md를 참조하세요.

## General Rules

- 코드 변경 전 항상 관련 파일을 먼저 읽는다
- 테스트 없는 기능 구현은 하지 않는다
- 한 번에 하나의 관심사만 변경한다
- 변경 범위는 요청된 것으로 제한한다 (범위 확장 금지)

## Workflow

1. **이해**: 요청 내용과 현재 코드를 파악한다
2. **계획**: 변경 범위와 접근 방식을 결정한다
3. **구현**: 최소한의 변경으로 목표를 달성한다
4. **검증**: 변경 사항이 의도한 대로 동작하는지 확인한다

## File Conventions

- 소스 코드: `src/`
- 테스트: `src/__tests__/` 또는 `tests/`
- 문서 산출물: `docs/{phase}/`
- 설정 파일: 프로젝트 루트

## Prohibited Actions

- `rm -rf` 사용
- `.env` 파일에 실제 시크릿 커밋
- `git push --force`
- 프로덕션 DB 직접 수정
