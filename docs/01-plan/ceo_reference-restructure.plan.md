# CEO Plan — reference-restructure

> 📎 참조 문서: `references/gstack-ethos.md`, `references/mcp-builder-guide.md`, `references/skill-authoring-guide.md`

## 배경

`references/` top-level에 3개 문서가 존재하지만, 어떤 에이전트도 자동으로 참조하지 않아 사실상 죽은 문서.
사용자 요청: 에이전트/스킬로 흡수하거나 유틸로 분리하여 실제 사용되게 만들 것.

## 대상 파일

| 파일 | 줄 수 | 핵심 내용 |
|------|-------|----------|
| `gstack-ethos.md` | 56 | 개발 철학 3원칙 (완전성, 탐색우선, 사용자주권) |
| `mcp-builder-guide.md` | 60 | MCP 서버 개발 4 Phase + 권장 스택 |
| `skill-authoring-guide.md` | 153 | 스킬/에이전트 작성 best practices + eval 루프 |

## 배분 맵

### 1. gstack-ethos.md → CLAUDE.md Mandatory Rules

- **이유**: 프로젝트 전체 적용 원칙. 특정 에이전트가 아닌 모든 에이전트 공통 규칙
- **방식**: Rule 9~11로 추가 (원문 56줄 → 3줄 압축)
- **삭제**: 원본 삭제

### 2. mcp-builder-guide.md → skills/vais/utils/mcp-builder.md (신규 유틸)

- **이유**: MCP 서버 빌드는 architect의 DB/인프라와 별개 도메인. CTO 외 CEO absorb 경로에서도 참조 필요
- **방식**: 유틸리티로 분리 (원문 60줄 → ~40줄, VAIS 적용 섹션 제거)
- **삭제**: 원본 삭제

### 3. skill-authoring-guide.md → 2곳 분배

#### 3-A. Sections 1~8 → agents/cso/validate-plugin.md

- **이유**: validate-plugin이 스킬/에이전트 품질 검증 담당. 현재 description 품질 기준 없음
- **방식**: `## 스킬/에이전트 품질 기준` 섹션 추가 (~25줄)

#### 3-B. Section 9 → agents/ceo/absorb-analyzer.md

- **이유**: absorb-analyzer가 외부 스킬 평가 시 description 품질 + eval 방법론 필요
- **방식**: `## Description 최적화 평가` 섹션 추가 (~20줄)

- **삭제**: 원본 삭제

## 추가 변경

- CLAUDE.md project structure 주석: `references/` 설명 업데이트
- CEO agent `ceo.md` L322: `skill-authoring-guide.md` 참조 경로 업데이트 (absorb 모드 Context Load)

## 영향 범위

| 변경 파일 | 유형 |
|-----------|------|
| `CLAUDE.md` | Rule 추가 + 구조 주석 수정 |
| `skills/vais/utils/mcp-builder.md` | 신규 생성 |
| `agents/cso/validate-plugin.md` | 섹션 추가 |
| `agents/ceo/absorb-analyzer.md` | 섹션 추가 |
| `agents/ceo/ceo.md` | 참조 경로 수정 |
| `references/gstack-ethos.md` | 삭제 |
| `references/mcp-builder-guide.md` | 삭제 |
| `references/skill-authoring-guide.md` | 삭제 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
