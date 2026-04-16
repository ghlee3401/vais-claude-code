# Ideation Summary: CEO / commit-workflow-improvement

> 진행일: 2026-04-16
> 진행자 C-Level: CEO
> 소요 대화 turns: 3
> Status: completed

---

## Key Points

1. **커밋 메시지 한국어화** — Conventional Commits prefix(`type(scope):`)는 영어 유지, 본문은 한국어 한 줄 요약
2. **커밋 메시지 한 줄 제한** — multi-line body 제거, 50자 이내 권장
3. **상세 내용은 CHANGELOG.md로** — 커밋 body에 중복 기재하지 않고 CHANGELOG에 집중
4. **CHANGELOG.md 자동 생성** — 파일 없으면 자동 생성하여 엔트리 추가
5. **버전 반영 전체 탐색** — 하드코딩 5개 파일 대신 코드 전체 grep으로 현재 버전 문자열을 찾아 일괄 반영
6. **특수기호 제한** — CI/CD 파이프라인 호환성을 위해 `:`, `-`, `()`, `/`만 허용, em dash/따옴표/shell 특수문자 금지
7. **자동 sanitize** — 커밋 전 금지 문자 검증, 걸리면 sanitize 후 재확인

## Decisions

- Conventional Commits prefix (`type(scope):`) 유지 (확정)
- 커밋 메시지 언어: 한국어 (확정)
- 허용 특수기호: `:`, `-`, `()`, `/`, 공백, 한글, 영문, 숫자 (확정)
- 금지 특수기호: `—`, `'`, `"`, `` ` ``, `$`, `#`, `{}`, `[]`, `!`, `~`, `*`, emoji (확정)

## Open Questions

- 버전 grep 시 false positive 필터링 로직 (예: 코드 내 우연히 동일한 버전 문자열)
- CHANGELOG 포맷을 Keep a Changelog 표준으로 할지 커스텀으로 할지
- semver bump 선택지 UX (현재 AskUserQuestion 3개 옵션 유지 vs 변경)

## Next Step

- C-Level: CTO
- Phase: plan
- 이유: commit 유틸리티는 `skills/vais/utils/commit.md` 코드 변경이 필요한 기술 구현 작업

---

## Raw Context (optional)

- 예시 커밋 메시지: `fix(hooks): /bin/sh 환경에서 node 경로 못 찾는 문제 수정`
- 버전 반영 대상: package.json, vais.config.json, CLAUDE.md, CHANGELOG.md, README.md, .claude-plugin/plugin.json, marketplace.json 등 전체 탐색

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 ideation 요약 작성 |
