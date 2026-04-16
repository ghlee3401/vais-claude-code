# Ideation Summary: CEO / docs-structure-redesign

> 진행일: 2026-04-16
> 진행자 C-Level: CEO
> 소요 대화 turns: 4
> Status: completed

---

## Key Points

1. **피처 중심 디렉토리 구조** — 현재 phase 중심(`01-plan/`, `02-design/`)에서 feature 중심(`docs/{feature}/plan/`)으로 전환
2. **phase별 서브 폴더** — 각 feature 아래 `ideation/`, `plan/`, `design/`, `do/`, `qa/`, `report/` 폴더 생성
3. **main.md 필수** — 모든 phase 폴더에 `main.md` 항상 존재. 요약 + 인덱스 역할
4. **문서 분할 허용** — 하나의 phase에 여러 문서 가능 (sub-doc). main.md가 인덱스로 연결
5. **분할 판단 기준** — 독립 sub-task 3개 이상, UI+infra 동시, frontend+backend 병렬, 200줄 초과 시 분리 권장

## Decisions

- 디렉토리 구조: `docs/{feature}/{phase}/main.md` (확정)
- main.md 항상 존재 — sub-doc 없으면 전체 내용, 있으면 요약+인덱스 (확정)
- 문서 분할 허용 — phase당 1개 제한 해제 (확정)

## Open Questions

- 기존 docs/ 문서 마이그레이션 전략 (한번에 vs 점진적)
- doc-tracker.js 경로 패턴 수정 범위
- 에이전트 산출물 경로 규칙 변경 대상 파일 목록
- CLAUDE.md, templates/ 경로 참조 갱신 범위
- status.json 구조 변경 필요 여부

## Next Step

- C-Level: CTO
- Phase: plan
- 이유: 에이전트/스크립트/설정 전반의 경로 규칙 변경이 필요한 대형 기술 작업. 영향 분석부터 시작

---

## Raw Context (optional)

**새 구조 예시:**
```
docs/{feature}/
├── ideation/
│   └── main.md
├── plan/
│   ├── main.md          ← 항상 존재 (요약 + sub-doc 인덱스)
│   ├── version-grep.md  ← 필요 시 분리
│   └── changelog.md
├── design/
│   ├── main.md
│   ├── ui.md
│   └── infra.md
├── do/
│   ├── main.md
│   ├── frontend.md
│   └── backend.md
├── qa/
│   └── main.md
└── report/
    └── main.md
```

**분할 판단 기준:**
- 단일 도메인 → main.md 하나
- 독립 sub-task 3개 이상 → sub-task별 분리
- UI + infra 동시 → 분리
- frontend + backend 병렬 → 에이전트별 분리
- 200줄 초과 예상 → 분리 권장

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 ideation 요약 작성 |
