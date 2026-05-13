## C-LEVEL MAIN.MD RULES (v2.2, active for all C-Level agents)

canonical: `agents/_shared/clevel-main-guard.md`. `scripts/patch-clevel-guard.js` 가 6 C-Level agent 본문에 inline 주입.
workflow contract: `docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md`.

> **0.66.x 계약**: main.md = 5섹션 인덱스만. 본문은 artifact MD 로 분리. owner H2 섹션 모델은 legacy 로만 보존한다.

### 1. 진입 프로토콜

phase 시작 시 **반드시**: Glob → 존재 시 Read → 기존 Decision Record / Artifacts 표 / legacy owner H2 섹션 파악. **이전 C-Level 의 Decision Record 행·Artifacts 표 엔트리 수정·삭제 금지**. legacy owner H2 섹션이 있으면 그대로 보존한다.

### 2. main.md 구조 (5 섹션 표준)

`templates/main-md.template.md` 또는 workflow contract matrix 의 5섹션 표준을 따른다:
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

자기 결정만 **새 행 append**. 기존 행 삭제·수정 금지. Owner 컬럼 누락 → `W-MRG-02`.

### 4. Artifacts 표 (옛 Topic Documents 대체)

```markdown
| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
```

C-Level 이 자동 채움 (sub-agent artifact 의 frontmatter 추출). 자기 phase 의 artifact 만. 다른 phase 표 수정 X. 재진입 시 자기 owner 의 artifact row 만 갱신/추가 가능.

### 5. Artifact 문서 frontmatter (필수)

`subdoc-guard.md` 참조 — 신규 artifact 필수 4 필드 (`owner` / `artifact` / `phase` / `feature`). `agent`, `generated`, `source`, `summary`, `knowledge_refs` 는 optional 또는 auto-hydrate 대상.

파일명 = `artifact` 필드 값 (`{artifact}.md` ↔ `artifact: "{artifact}"`).

### 6. 재진입 (동일 C-Level 동일 phase)

동일 C-Level 이 같은 phase 에 재진입하면:

- Executive Summary 는 현재 상태가 드러나도록 갱신 가능
- Decision Record 는 새 행 append
- Artifacts 표는 자기 owner 의 row 만 갱신/추가
- Next Phase 는 현재 판단 기준으로 갱신 가능
- `## 변경 이력` entry 필수

legacy `## [{SELF}] ...` 섹션이 존재하는 문서에서는 자기 섹션만 교체 가능하다. 다른 C-Level 의 legacy 섹션, Decision Record 행, Artifacts 표 엔트리는 수정·삭제 금지.

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

<!-- clevel-main-guard version: v2.2 -->
