## C-LEVEL MAIN.MD RULES (v2.0, active for all C-Level agents)

canonical: `agents/_shared/clevel-main-guard.md`. `scripts/patch-clevel-guard.js` 가 6 C-Level agent 본문에 inline 주입.

> **v2.x 변경 사항**: main.md = 인덱스만 (본문은 artifact MD 분리). 옛 v0.58 의 "Topic Documents" / "Size budget refuse" / "Topic 프리셋" 룰 단순화.

### 1. 진입 프로토콜

phase 시작 시 **반드시**: Glob → 존재 시 Read → 기존 기여 C-Level 파악 (grep `^## \[[A-Z]+\]`). **이전 C-Level 의 H2 섹션·Decision Record 행·Artifacts 표 엔트리 수정·삭제 금지**.

### 2. main.md 구조 (5 섹션 표준)

`templates/main-md.template.md` 따름:
1. Executive Summary
2. Decision Record (multi-owner, append-only)
3. **Artifacts 표** (이 phase 박제 자료 — frontmatter 자동 추출)
4. CEO 판단 근거
5. Next Phase

본문 X. 인덱스만.

### 3. Decision Record (multi-owner)

```markdown
| # | Decision | Owner | Rationale | Source artifact |
|---|----------|-------|-----------|----------------|
| 1 | ... | cbo | ... | market-analysis.md |
```

자기 결정만 **새 행 append**. Owner 컬럼 누락 → `W-MRG-02`.

### 4. Artifacts 표 (옛 Topic Documents 대체)

```markdown
| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
```

C-Level 이 자동 채움 (sub-agent artifact 의 frontmatter 추출). 자기 phase 의 artifact 만. 다른 phase 표 수정 X.

### 5. Artifact 문서 frontmatter (필수)

`subdoc-guard.md` 참조 — 8 필드 (owner / agent / artifact / phase / feature / source / generated / summary).

파일명 = `artifact` 필드 값 (`prd.md` ↔ `artifact: prd`).

### 6. 재진입 (동일 C-Level 동일 phase)

`## [{SELF}] ...` 존재 시: 자기 섹션 **교체** 허용 + `## 변경 이력` 에 entry 필수. 이전 근거는 `git log` 추적. **다른 C-Level 섹션·Decision Record·Artifacts 표 엔트리 수정·삭제 금지**.

### 7. Size budget (자연 충족)

main.md = 인덱스만이라 200줄 자연 충족. `mainMdMaxLines` warn 으로 강등 (v2.0). validator W-MAIN-SIZE = warn (refuse 아님).

### 8. 금지

- ❌ 다른 C-Level H2 섹션·Decision Record 행·Artifacts 표 엔트리 수정·삭제
- ❌ owner 없는 artifact 파일 Write
- ❌ main.md 본문 작성 (인덱스만)
- ❌ artifact MD 통합 (1 artifact = 1 MD 원칙)

### 9. enforcement (v2.0)

- `cLevelCoexistencePolicy.enforcement = "warn"` — W-OWN/W-MRG 경고만
- `mainMdMaxLinesAction = "warn"` (refuse 아님 — 인덱스 자연 충족)
- 순서: advisor-guard → subdoc-guard → clevel-main-guard

<!-- clevel-main-guard version: v2.0 -->
