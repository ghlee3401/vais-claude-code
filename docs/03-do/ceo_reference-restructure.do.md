# CEO Do — reference-restructure

> 📎 참조 문서: `docs/02-design/ceo_reference-restructure.design.md`

## 실행 결과

### 1. gstack-ethos.md → CLAUDE.md
- `CLAUDE.md:126-128` — Mandatory Rules 9~11 추가 (완전성, 탐색우선, 사용자주권)
- `CLAUDE.md:30` — references/ 구조 주석 업데이트
- `references/gstack-ethos.md` 삭제 (56줄)

### 2. mcp-builder-guide.md → skills/vais/utils/mcp-builder.md
- `skills/vais/utils/mcp-builder.md` 신규 생성 (유틸리티)
- 원문 60줄 → 45줄 (VAIS 적용 섹션 제거, 핵심 프로세스 보존)
- `references/mcp-builder-guide.md` 삭제

### 3. skill-authoring-guide.md → 2곳 분배
- `agents/cso/validate-plugin.md` — 스킬/에이전트 품질 기준 섹션 추가 (25줄)
- `agents/ceo/absorb-analyzer.md` — Description 최적화 평가 섹션 추가 (21줄)
- `agents/ceo/ceo.md:322` — absorb 모드 Context Load 참조 경로 수정
- `references/skill-authoring-guide.md` 삭제 (153줄)

## 검증

| 항목 | 결과 |
|------|------|
| references/ top-level 파일 | 0개 (정상) |
| mcp-builder.md 유틸 생성 | OK |
| CLAUDE.md Rule 9-11 | OK |
| ceo.md 참조 경로 | OK |
| 총 삭제 | 269줄 |
| 총 추가 | 56줄 (+신규 유틸 45줄) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
