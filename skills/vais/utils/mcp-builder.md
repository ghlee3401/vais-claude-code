---
name: mcp-builder
description: MCP 서버 개발 가이드. 설계 원칙, 4 Phase 프로세스, 권장 스택 안내.
---

# MCP Server 개발 가이드

> CTO 또는 architect가 MCP 서버를 설계/구현할 때 참조
> 원본: Anthropic 공식 `mcp-builder` 스킬

## 1. 설계 원칙

- **API Coverage vs Workflow Tools**: 포괄적 API 커버리지 우선, 필요 시 워크플로우 도구 추가
- **Tool Naming**: 일관된 접두사 + 액션 기반 (`github_create_issue`, `github_list_repos`)
- **Context Management**: 간결한 설명, 필터링/페이지네이션 지원
- **Actionable Error Messages**: 에러 시 구체적 해결 방법 제시

## 2. 개발 프로세스 (4 Phase)

### Phase 1: Research & Planning
- MCP 프로토콜 스펙 학습 (`https://modelcontextprotocol.io/specification/draft.md`)
- SDK 문서 로드 (TypeScript 권장, Python도 가능)
- 대상 API 엔드포인트 목록화 + 인증 방식 파악

### Phase 2: Implementation
- 프로젝트 구조 설정 (TypeScript: `package.json` + `tsconfig.json`)
- 공유 인프라: API 클라이언트, 에러 핸들링, 응답 포맷팅, 페이지네이션
- Tool별 구현:
  - Input Schema: Zod (TS) / Pydantic (Python)
  - Output Schema: `outputSchema` + `structuredContent`
  - Annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`

### Phase 3: Review & Test
- 중복 코드 제거 (DRY)
- 일관된 에러 핸들링
- 타입 커버리지 확인
- MCP Inspector로 테스트: `npx @modelcontextprotocol/inspector`

### Phase 4: Evaluation
- 10개 복합 질문 작성 (독립적, read-only, 복수 tool call 필요)
- XML 형식으로 평가셋 생성
- 각 질문은 검증 가능하고 시간에 따라 답이 변하지 않아야 함

## 3. 권장 스택

| 항목 | 권장 |
|------|------|
| 언어 | TypeScript |
| Transport (원격) | Streamable HTTP (stateless JSON) |
| Transport (로컬) | stdio |
| Input Validation | Zod |
| 테스트 | MCP Inspector |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | references/mcp-builder-guide.md에서 유틸로 이동 |
