## C-LEVEL MAIN.MD RULES (active for all C-Level agents)

canonical: `agents/_shared/clevel-main-guard.md`. `scripts/patch-clevel-guard.js` 가 6 C-Level agent 본문에 inline 주입.
workflow contract: `contracts/workflow-contract.md`.

> **핵심**: 2 모델 공존 — v1 (5섹션 인덱스, 기존) + v2 (합성문, 신규). frontmatter `model-version` 필드로 분기. `orchestration.agentTeams.enabled=true` 가 신규 피처 v2 트리거.

### 모델 선택 알고리즘

```
frontmatter.model-version 확인:
  - 없음 또는 "v1" → v1 모드 (이하 §v1)
  - "v2" → v2 모드 (이하 §v2)

신규 피처 생성 시:
  if (vais.config.json > orchestration.agentTeams.enabled === true) → v2 작성
  else → v1 작성 (0.67.0 기존 동작)
```

기존 5 완료 피처 (clevel-doc-coexistence / subagent-architecture-rethink / simplify-non-cto-workflow / unify-version-namespace / vais-positioning-rethink) 은 frontmatter `model-version: v1` 추가만으로 식별. 본문 변환 X.

---

## §v1 모드 규칙 (legacy compatible, 기존 동작)

### v1.1 진입 프로토콜

phase 시작 시 **반드시**: Glob → 존재 시 Read → 기존 Decision Record / Artifacts 표 / legacy owner H2 섹션 파악. **이전 C-Level 의 Decision Record 행·Artifacts 표 엔트리 수정·삭제 금지**.

### v1.2 main.md 구조 (5 섹션 표준)

`templates/main-md.template.md` 의 5섹션 표준을 따른다:
1. Executive Summary
2. Decision Record (multi-owner, append-only)
3. Artifacts 표
4. CEO 판단 근거
5. Next Phase

본문 X. 인덱스만.

### v1.3 Decision Record (multi-owner)

```markdown
| # | Decision | Owner | Rationale | Source artifact |
|---|----------|-------|-----------|----------------|
| 1 | ... | cbo | ... | market-analysis.md |
```

자기 결정만 **새 행 append**. 기존 행 삭제·수정 금지. Owner 컬럼 누락 → `W-MRG-02`.

### v1.4 Artifacts 표

```markdown
| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
```

C-Level 이 자동 채움 (sub-agent artifact 의 frontmatter 추출). 다른 phase 표 수정 X. 재진입 시 자기 owner 의 artifact row 만 갱신/추가 가능.

### v1.5 Artifact frontmatter

`subdoc-guard.md` 참조 — 신규 artifact 필수 4 필드 (`owner` / `artifact` / `phase` / `feature`).

---

## §v2 모드 규칙 (대화-합성, agent-teams-orchestration)

### 진입 프로토콜

phase 시작 시: CEO 알고리즘 `analyzeCEO()` 결과의 `synthesizer` + `participants` 확인. synthesizer 가 도메인 리드로서 phase 합성 책임.

### v2.2 main.md 구조 (합성문 9섹션)

`templates/synthesis.template.md` 의 9섹션 표준:
1. Executive Summary
2. 결정 (Synthesizer 합성, Lazy Consensus)
3. 핵심 알고리즘 (optional)
4. State Machine (optional)
5. 인터페이스 계약 (optional)
6. Success Criteria
7. 위협 / 위험
8. 관찰 (Out-of-scope)
9. Do 작업 / Next Phase 매핑

synthesizer **단독 작성**. 본문 흡수 가능 (인덱스 아님).

### v2.3 Decisions Log (별도 파일)

```
docs/{feature}/{phase}/decisions-log.md  ← timeline (모든 SendMessage event)
docs/{feature}/{phase}/main.md            ← 합성문 (synthesizer 단독)
```

`templates/decisions-log.template.md` 의 형식. event-type enum: `제기` / `반박` / `합의` / `pivot` / `timeout`.

### v2.4 frontmatter 필수 6 필드

`owner` + `artifact` + `phase` + `feature` + **`synthesizer`** + **`model-version: v2`**.

### v2.5 Synthesizer 일관성 계약 (W-SYNTH-CONSISTENCY)

- main.md.frontmatter.synthesizer = decisions-log.frontmatter.synthesizer = main.md §2 의 합성자
- 불일치 시 `W-SYNTH-CONSISTENCY` warning
- `scripts/vais-validate-plugin.js` 가 검증 (Do 작업 #20)

### v2.6 재진입 (동일 synthesizer 동일 phase)

- 합성문 main.md 의 §2 결정 갱신 가능 (synthesizer 단독 판단)
- decisions-log timeline 은 append-only (이전 row 수정·삭제 금지)
- `## 변경 이력` entry 필수

### v2.7 Lazy Consensus 박제

- consensus-reached / timeout 둘 다 main.md 박제 허용
- timeout 의 경우 decisions-log 의 마지막 event 가 `timeout` event-type + `unresolvedObjections` 보존

---

## 공통 규칙

### 1. 파일명

1 artifact = 1 MD (통합 금지). 파일명 = frontmatter `artifact` 필드 값.

### 2. enforcement

- `cLevelCoexistencePolicy.enforcement = "warn"` — W-OWN/W-MRG/W-SYNTH-CONSISTENCY 모두 경고
- `mainMdMaxLinesAction = "warn"` (refuse 아님)
- 순서: advisor-guard → subdoc-guard → clevel-main-guard

### 3. 금지

- ❌ 다른 C-Level Decision Record 행·Artifacts 표 엔트리 수정·삭제 (v1)
- ❌ synthesizer 가 아닌 C-Level 의 합성문 직접 수정 (v2)
- ❌ owner 없는 artifact 파일 Write
- ❌ artifact MD 통합 (1 artifact = 1 MD 원칙)
- ❌ v1 → v2 자동 변환 (수동 + 신규 피처만)

### 4. 모델 마이그레이션

기존 5 완료 피처 → frontmatter `model-version: v1` 추가만 (수동). 본문 보존. 신규 피처는 `agentTeams.enabled` 에 따라 자동 분기.

<!-- clevel-main-guard version: v3.0 -->
