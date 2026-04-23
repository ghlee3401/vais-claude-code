## C-LEVEL MAIN.MD COEXISTENCE RULES (v0.58+, active for all C-Level agents)

canonical: `agents/_shared/clevel-main-guard.md`. `scripts/patch-clevel-guard.js` 가 6 C-Level agent 본문에 inline 주입.

### 1. 진입 프로토콜

phase 시작 시 **반드시**: Glob → 존재 시 Read → `lib/status.js > getOwnerSectionPresence(feature, phase)` (또는 grep `^## \[[A-Z]+\]`) 로 기존 기여 C-Level 파악. **이전 C-Level 의 H2 섹션·Decision Record 행·Topic 인덱스 엔트리 수정·삭제 금지**.

### 2. H2 섹션 규약

각 C-Level 은 `## [{OWNER}] {도메인 요약}` H2 섹션을 append. owner 는 **대문자**: `[CEO|CPO|CTO|CSO|CBO|COO]`. 요약 1~5 단락 + 자기 기여 topic 링크. 본문 상세는 topic 문서로 분리.

### 3. Decision Record (multi-owner)

```markdown
| # | Decision | Owner | Rationale | Source topic |
|---|----------|-------|-----------|--------------|
| 1 | ... | cbo | ... | market-analysis.md |
```

자기 결정만 **새 행 append**. Owner 컬럼 누락 → `W-MRG-02`.

### 4. Topic Documents 인덱스

```markdown
| Topic | 파일 | Owner | 요약 | Scratchpads |
```

자기 topic 엔트리만 append. owner 섹션 0개 + topic 2+ 개 → `W-MRG-03`.

### 5. Topic 문서 frontmatter (필수)

```yaml
---
owner: cpo           # enum: ceo|cpo|cto|cso|cbo|coo (필수)
authors: [prd-writer] # string[] 선택 (sub-agent slug)
topic: requirements  # 파일 stem 과 일치 (필수)
phase: plan          # 필수
feature: {name}      # 선택
---
```

파일명은 **topic-first** (`requirements.md` O / `cpo-requirements.md` X). owner 누락 → `W-OWN-01`. owner ∉ enum → `W-OWN-02`.

### 6. Topic 프리셋

`vais.config.json > workflow.topicPresets.{NN-phase}.{c-level}` (없으면 `_default`, 없으면 `[]`). C-Level 확장 가능 (강제 아님). Helper: `getTopicPreset(phase, cLevel)`.

### 7. 재진입 (동일 C-Level 동일 phase)

`## [{SELF}] ...` 존재 시: 자기 섹션 **교체** 허용 + `## 변경 이력` 에 entry 필수 (`| vX.Y | YYYY-MM-DD | {ROLE} 재진입: {요약} |`). 이전 근거는 `git log` 로 추적. **다른 C-Level 섹션·Decision Record·Topic 엔트리 수정·삭제 금지**.

### 8. Size budget (F14)

`mainMdMaxLines` (기본 200) 초과 예상 시 **topic 문서로 본문 이관** → main.md 에는 요약 + 링크만. `_tmp/` 미사용 phase 도 동일 적용. validator `W-MAIN-SIZE` 가 main.md > threshold AND topic 0 AND `_tmp/` 0 조건 감지.

**v0.58.4**: `mainMdMaxLinesAction: "refuse"` 승격 — W-MAIN-SIZE 발화 시 doc-validator 가 `exit(1)` 로 차단 (이전: warn only).

### 9. 금지

- ❌ 다른 C-Level H2 섹션·Decision Record 행·Topic 인덱스 엔트리 수정·삭제
- ❌ owner 없는 topic 파일 Write
- ❌ owner-prefix 파일명 (`cpo-requirements.md`)

### 10. enforcement (v0.58.4)

- `cLevelCoexistencePolicy.enforcement = "warn"` (기본) — W-OWN/W-MRG 경고만
- `mainMdMaxLinesAction = "refuse"` (v0.58.4+ 기본) — 사이즈 초과 시 exit(1)
- 순서: advisor-guard → subdoc-guard → clevel-main-guard

<!-- clevel-main-guard version: v0.58.4 -->
