# Ideation Summary: CEO / unified-outro-format

> 진행일: 2026-04-16
> 진행자 C-Level: CEO
> 소요 대화 turns: 2
> Status: completed

---

## Key Points

1. **아웃로 포맷이 SKILL.md에만 정의** — 서브에이전트는 SKILL.md를 직접 참조하지 않아 각자 다른 형태로 출력
2. **구분선(`---`) 누락** — "CEO 추천" 블록이 이전 내용과 붙어보이는 문제 (스크린샷으로 지적됨)
3. **공통 아웃로 블록 필요** — 6개 C-Level 에이전트 `.md`에 동일 아웃로 규칙 삽입
4. **`<!-- @refactor:begin common-outro -->` 태그** — 기존 common-rules 패턴과 동일하게 마크

## Decisions

- "CEO 추천" 블록 위에 `---` 구분선 필수 (확정)
- 하단 리포트 코드블록도 동일 포맷 유지 (확정)
- 공통 아웃로를 `<!-- @refactor:begin/end common-outro -->` 태그로 관리 (확정)

## Open Questions

- output-styles/ 에도 아웃로 포맷을 정의할지, 에이전트 `.md`에만 넣을지
- SKILL.md 템플릿과 에이전트 `.md` 규칙 간 우선순위

## Next Step

- C-Level: CTO
- Phase: plan
- 이유: 6개 에이전트 + SKILL.md 수정이 필요한 기술 작업

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 ideation 요약 작성 |
