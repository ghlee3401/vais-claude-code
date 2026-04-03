# CSO Plan — gstack-absorb 플러그인 검증

| 항목 | 내용 |
|------|------|
| 피처 | gstack-absorb |
| 역할 | CSO (Gate B — 플러그인 배포 검증) |
| 목적 | gstack 흡수 결과물 push 전 플러그인 구조 무결성 검증 |

## 검증 범위

### Gate B: 플러그인 배포 검증

1. **package.json 구조**: claude-plugin 매니페스트 정합성
2. **에이전트 frontmatter**: 신규 4개 에이전트(investigate, canary, benchmark, retro) 필수 필드
3. **hooks 구조**: hooks.json 경로·이벤트 정합성
4. **경로 참조 일관성**: absorption-ledger 경로가 `docs/`로 통일되었는지
5. **기존 에이전트 비파괴**: 기존 21개 에이전트 구조 유지 확인

### 검증 도구

- `node scripts/vais-validate-plugin.js` — 자동 구조 검증
- frontmatter 수동 검사 — 신규 에이전트 4개
- `grep` 기반 잔존 참조 스캔

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-04 | 초기 작성 |
