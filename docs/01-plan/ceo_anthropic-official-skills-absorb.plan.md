# CEO Plan — Anthropic 공식 스킬 흡수

> 피처: `anthropic-official-skills-absorb`
> 작성일: 2026-04-05

## 배경

Anthropic의 공식 스킬 레포지토리(`references/_inbox/skills/`)에서 17개 스킬을 분석하여 VAIS Code에 유용한 지식을 흡수한다.

## 소스

- 경로: `references/_inbox/skills/skills/`
- 원본: [anthropics/skills](https://github.com/anthropics/skills) (Apache 2.0 + 일부 Proprietary)

## 배분 맵

| # | 스킬 | 판정 | 대상 | 사유 |
|---|------|------|------|------|
| 1 | skill-creator | merge | `references/skill-authoring-guide.md` | eval 루프, description 최적화 방법론 추가 |
| 2 | mcp-builder | absorb | `references/mcp-builder-guide.md` | MCP 서버 빌드 가이드 신규 생성 |
| 3 | webapp-testing | merge | `agents/cto/tester.md` | Playwright 테스트 패턴 추가 |
| 4 | frontend-design | merge | `agents/cto/design.md` | 디자인 미학 원칙 + 안티패턴 추가 |
| 5 | doc-coauthoring | merge | `agents/coo/docs-writer.md` | 구조화 문서 작성 워크플로우 추가 |
| 6 | claude-api | reject | — | 이미 시스템 스킬로 존재 |
| 7 | algorithmic-art | reject | — | p5.js 특화, VAIS 도메인 외 |
| 8 | brand-guidelines | reject | — | Anthropic 브랜드 전용 |
| 9 | canvas-design | reject | — | 시각 아트, 도메인 외 |
| 10 | docx | reject | — | Office 문서 도구, 외부 의존성 (python-docx) |
| 11 | internal-comms | reject | — | Anthropic 내부 커뮤니케이션 전용 |
| 12 | pdf | reject | — | PDF 처리 도구, 외부 의존성 |
| 13 | pptx | reject | — | PowerPoint 도구, 외부 의존성 |
| 14 | xlsx | reject | — | 스프레드시트 도구, 외부 의존성 |
| 15 | slack-gif-creator | reject | — | Slack GIF, 외부 의존성 |
| 16 | theme-factory | reject | — | 테마 스타일링, 도메인 외 |
| 17 | web-artifacts-builder | reject | — | claude.ai artifact 전용 |

## 판정 기준

- **absorb**: 새 파일 생성이 필요한 고유 지식
- **merge**: 기존 에이전트/문서에 섹션 추가로 충분
- **reject**: VAIS C-Suite 도메인과 무관하거나 외부 의존성 필요

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 — 17개 스킬 분석 + 배분 맵 |
