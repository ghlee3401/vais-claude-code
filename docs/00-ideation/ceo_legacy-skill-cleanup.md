# Ideation Summary: CEO / legacy-skill-cleanup

> 진행일: 2026-04-16
> 진행자 C-Level: CEO
> 소요 대화 turns: 3
> Status: completed

---

## Key Points

1. **skills/vais/phases/ 내 실행 에이전트 리다이렉트 파일 5개** — backend-engineer, frontend-engineer, infra-architect, qa-engineer, ui-designer. 모두 "CTO를 통해 실행" 안내만 하는 stub. agents/cto/에 실제 에이전트 존재
2. **skills/vais/phases/plan.md** — "C-Level 경유 필수" 리다이렉트 stub. SKILL.md에서 이미 C-Level 경유 강제
3. **skills/vais/utils/skill-creator.md** — agents/ceo/skill-creator.md로 이관 완료. utils에 남은 건 레거시
4. **삭제 전 참조 검증 필수** — grep 전체 탐색 + package.json + SKILL.md 라우팅 로직 확인 후 안전하게 삭제

## Decisions

- 삭제 후보 7개 확정 (확정)
- 삭제 전 반드시 참조 검증 수행 (확정)
- 참조 있으면 참조 수정 후 삭제, 참조 없으면 바로 삭제 (확정)

## Open Questions

- skill-creator가 SKILL.md 액션 목록에 유틸리티로 등록되어 있는데, agents 경유로 변경할지 아예 제거할지

## Next Step

- C-Level: CTO
- Phase: plan
- 이유: 파일 삭제 + 참조 수정은 기술 작업

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 ideation 요약 작성 |
