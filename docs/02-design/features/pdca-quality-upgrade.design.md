# pdca-quality-upgrade Design Document

> **Summary**: bkit PDCA 대비 vais-code 문서 퀄리티 완전 대응 — Option B (Full Parity) 설계
>
> **Plan Reference**: `docs/01-plan/features/pdca-quality-upgrade.plan.md`
> **Date**: 2026-03-25
> **Status**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | vais-code 문서는 독립적이고 얕음. bkit은 문서 간 체인 연결 + 깊은 구조로 AI 컨텍스트 유지가 월등 |
| **WHO** | vais-code 플러그인 사용자 (개발자) |
| **RISK** | 대규모 변경으로 기존 문서 호환성 파괴, 템플릿이 과도하게 복잡해져 오히려 사용성 저하 |
| **SUCCESS** | 각 템플릿에 Executive Summary + Context Anchor 존재, Phase 간 컨텍스트 자동 전파, bkit 수준의 문서 구조 |
| **SCOPE** | 4개 기존 템플릿 개선 + 2개 신규 + 6개 phase 파일 수정 = 12개 파일 |

---

## Architecture: Option B — Full Parity

bkit의 모든 PDCA 메커니즘을 vais-code 6단계 워크플로우에 맞게 이식. 12개 파일 수정/생성.

```
변경 파일 (12개):
  [P1] templates/plan.template.md        ← Executive Summary, Context Anchor, Success Criteria, Impact Analysis
  [P1] templates/design.template.md      ← Context Anchor, Architecture Options, Session Guide
  [P2] skills/vais/phases/plan.md        ← CP1+CP2, Context Anchor 생성, Upstream Loading
  [P2] skills/vais/phases/design.md      ← CP3, Context Anchor 복사, Upstream Loading
  [P3] templates/qa.template.md          ← Architecture/Convention Compliance, Success Criteria 평가
  [P3] skills/vais/phases/fe.md          ← Upstream Loading, Code Comment Convention, Decision Record
  [P3] skills/vais/phases/be.md          ← Upstream Loading, Code Comment Convention, Decision Record
  [P3] skills/vais/phases/qa.md          ← CP5, Architecture 검증, Success Criteria 평가
  [P4] templates/report.template.md      ← 신규: Value Delivered, Keep/Problem/Try
  [P4] skills/vais/phases/report.md      ← 신규: Report phase 실행 지시
```

---

## 1. File: `templates/plan.template.md` (FR-01~04)

### 추가할 섹션 (문서 최상단, `## 0. 아이디어 개요` 앞에 삽입)

```markdown
## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {해결하려는 문제 1~2문장} |
| **Solution** | {제안하는 해결책 1~2문장} |
| **Function/UX Effect** | {사용자가 체감하는 변화} |
| **Core Value** | {비즈니스/기술적 핵심 가치} |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | {왜 이 기능이 필요한가} |
| **WHO** | {누구를 위한 것인가} |
| **RISK** | {주요 위험 요소} |
| **SUCCESS** | {성공 기준 요약} |
| **SCOPE** | {범위 한 줄 요약} |

---
```

### 추가할 섹션 (`## 6. 비기능 요구사항` 뒤에 삽입)

```markdown
## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | {측정 가능한 성공 기준} | {검증 방법} |
| SC-02 | {측정 가능한 성공 기준} | {검증 방법} |

> QA 단계에서 각 기준을 ✅ Met / ⚠️ Partial / ❌ Not Met 으로 평가합니다.

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| {파일/컴포넌트/API} | {create/modify/delete} | {변경 내용} |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| {변경 대상} | {CRUD} | {사용 위치} | {영향} |

### Verification
- [ ] 모든 consumer 확인 완료
- [ ] breaking change 없음 확인
```

### 기존 섹션 유지

기존 `## 0. 아이디어 개요` ~ `## 9. 일정` 구조는 그대로 유지. 앞/뒤에 새 섹션만 추가.

---

## 2. File: `templates/design.template.md` (FR-05~06)

### 추가할 섹션 (문서 최상단, `## Part 1` 앞에 삽입)

```markdown
## Context Anchor

(Plan 문서에서 복사)

| Key | Value |
|-----|-------|
| **WHY** | |
| **WHO** | |
| **RISK** | |
| **SUCCESS** | |
| **SCOPE** | |

---

## Architecture Options

### Option A — Minimal Changes
{최소 변경. 기존 코드 최대 재사용. 빠르지만 결합도 높을 수 있음}

### Option B — Clean Architecture
{관심사 분리 최적. 유지보수 최고. 파일 많고 리팩토링 필요}

### Option C — Pragmatic Balance
{적절한 경계. 과도한 설계 없이 좋은 구조. 기본 추천}

### Comparison

| 기준 | A: Minimal | B: Clean | C: Pragmatic |
|------|:----------:|:--------:|:------------:|
| 복잡도 | 낮음 | 높음 | 중간 |
| 유지보수 | 낮음 | 높음 | 중간 |
| 구현 속도 | 빠름 | 느림 | 중간 |
| 리스크 | 중간 | 낮음 | 낮음 |

### Selected: Option {X}

**Rationale**: {선택 근거}

---
```

### 추가할 섹션 (문서 하단, `## 변경 이력` 앞에 삽입)

```markdown
## Session Guide

### Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | {파일 목록} | {설명} |
| module-2 | {파일 목록} | {설명} |

### Recommended Session Plan

| Session | Modules | Description |
|---------|---------|-------------|
| Session 1 | module-1 | {핵심 구조} |
| Session 2 | module-2 | {세부 구현} |
```

### 기존 섹션 유지

기존 `## Part 1: IA` ~ `## 3.6 접근성 요구사항` 구조 그대로 유지.

---

## 3. File: `skills/vais/phases/plan.md` (FR-07, FR-09, FR-10)

### 추가할 내용 (Step 2 뒤에 삽입)

```markdown
#### Checkpoint 1 — 요구사항 확인

Step 1~2 완료 후, **문서 생성 전에** AskUserQuestion으로 확인:
- 이해한 Problem, Scope, 핵심 기능을 요약 제시
- "요구사항 이해가 맞나요? 빠진 건 없나요?"
- 사용자 확인 전까지 기획서를 생성하지 않음

#### Checkpoint 2 — 명확화 질문

불명확한 요소를 정리하여 질문:
- 엣지 케이스, 에러 처리, 기존 시스템과의 호환성
- 정리된 질문 목록을 AskUserQuestion으로 제시
- 답변 후 기획서 생성 진행
```

### Step 4 수정 (저장 전에 추가)

```markdown
#### Context Anchor 생성

기획서 작성 완료 후:
1. Executive Summary의 Problem/Solution에서 **WHY** 추출
2. 타겟 사용자에서 **WHO** 추출
3. 위험 분석에서 **RISK** 추출
4. Success Criteria에서 **SUCCESS** 추출
5. MVP 범위에서 **SCOPE** 추출
6. 문서 상단 (Executive Summary 바로 아래)에 Context Anchor 테이블 작성
```

### Step 2에 추가할 항목

```markdown
- **Executive Summary 작성**: 4-perspective 테이블 (Problem/Solution/Function UX Effect/Core Value)
- **Success Criteria 작성**: 측정 가능한 성공 기준 + 검증 방법
- **Impact Analysis 작성**: Changed Resources + Current Consumers (기존 프로젝트의 경우)
```

---

## 4. File: `skills/vais/phases/design.md` (FR-08, FR-09)

### 전체 흐름 수정 (기존 흐름 앞에 삽입)

```markdown
#### Upstream Context Loading

1. Plan 문서를 **전체** 읽기 (`docs/01-plan/{feature}.md`) — 요약이 아닌 전문
2. Plan의 Context Anchor를 Design 문서 상단에 **복사**
3. Plan의 Success Criteria를 인지하고 설계에 반영

#### Architecture Options 제시

Plan 읽기 완료 후, 3가지 설계안을 제시:
- **Option A — Minimal Changes**: 기존 코드 최대 재사용
- **Option B — Clean Architecture**: 관심사 분리 최적
- **Option C — Pragmatic Balance**: 적절한 균형 (기본 추천)

비교 테이블 (복잡도/유지보수/속도/리스크) 포함.

#### Checkpoint 3 — 설계안 선택

AskUserQuestion: "3가지 설계안 중 어떤 걸 선택하시겠습니까?"
- 추천안에 "(Recommended)" 표시
- 사용자 선택 후 해당 Option 기반으로 설계 문서 작성

#### Session Guide 생성

설계 문서 완성 후:
1. 구현해야 할 모듈을 Module Map으로 정리
2. 세션별 추천 구현 순서를 Session Plan으로 작성
3. `## Session Guide` 섹션으로 문서 하단에 추가
```

### 기존 내용 유지

기존 `Part 1: IA` ~ `Part 3: UI 설계` 흐름은 Checkpoint 3 이후에 실행.

---

## 5. File: `templates/qa.template.md` (FR-12, FR-17)

### 추가할 섹션 (`## 8. 코드 품질` 뒤에 삽입)

```markdown
## Architecture Compliance

### Layer Dependency

| Layer | Expected Dependencies | Actual | Status |
|-------|----------------------|--------|--------|
| {계층명} | {기대 의존성} | {실제} | ✅/❌ |

### Dependency Violations

| File | Layer | Violation | Recommendation |
|------|-------|-----------|----------------|

## Convention Compliance

### Naming Convention

| Category | Convention | Checked | Compliance % | Violations |
|----------|-----------|---------|-------------|------------|
| 파일명 | {규칙} | {n}개 | {m}% | {위반 목록} |
| 변수명 | {규칙} | {n}개 | {m}% | |

### Folder Structure

| Expected Path | Exists | Correct | Notes |
|---------------|--------|---------|-------|

### Import Order

- [ ] 외부 라이브러리 → 내부 모듈 → 상대 경로 → 타입 → 스타일

## Success Criteria Evaluation

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-01 | {Plan에서 정의한 기준} | ✅ Met / ⚠️ Partial / ❌ Not Met | {근거: 파일:라인 또는 테스트 결과} |

**Success Rate**: {n}/{m} criteria met ({p}%)
```

---

## 6. File: `skills/vais/phases/fe.md` (FR-11, FR-13)

### 기존 내용 앞에 추가

```markdown
#### Upstream Context Loading

1. Plan 문서 **전체** 읽기 — Context Anchor, Success Criteria, 정책 정의 확인
2. Design 문서 **전체** 읽기 — Architecture Option 선택 근거, 화면별 상세 정의
3. Decision Record 표시:
   ```
   📋 Decision Record
   [Plan] 기술 스택: {선택} — {근거}
   [Design] Architecture: Option {X} — {근거}
   ```

#### Code Comment Convention

구현 시 아래 주석 패턴 적용:
- 모듈/파일 수준: `// Design Ref: §{섹션} — {설계 결정 근거}`
- 핵심 로직: `// Plan SC: {성공 기준 내용}`
```

---

## 7. File: `skills/vais/phases/be.md` (FR-11, FR-13)

### 기존 내용 앞에 추가

fe.md와 동일한 Upstream Context Loading + Code Comment Convention 추가. (내용 동일)

---

## 8. File: `skills/vais/phases/qa.md` (FR-14, FR-17)

### Step 2 (Gap 분석) 뒤에 추가

```markdown
#### Architecture & Convention Compliance

1. Plan의 코딩 규칙 vs 실제 코드 비교
2. Design의 Architecture Option 선택 vs 실제 구조 비교
3. 네이밍, 폴더 구조, import 순서 체크
4. 결과를 qa.template.md의 해당 섹션에 기록

#### Success Criteria Evaluation

1. Plan의 Success Criteria 각 항목 읽기
2. 구현 코드에서 증거 수집 (파일:라인 또는 테스트 결과)
3. 각 항목을 ✅ Met / ⚠️ Partial / ❌ Not Met 평가
4. Success Rate 산출
```

### Step 6 (리턴 경로) 뒤에 추가

```markdown
#### Checkpoint 5 — 리뷰 결정

Critical/Important 이슈를 심각도별로 정리하여 AskUserQuestion:
- "지금 모두 수정" — 전체 이슈 수정 후 재검증
- "Critical만 수정" — Critical 이슈만 수정
- "그대로 진행" — 현 상태 수용, Report로 이동
사용자 선택에 따라 분기.
```

---

## 9. File: `templates/report.template.md` (FR-15) — 신규

```markdown
# {feature} — 완료 보고서

> 참조 문서: `docs/01-plan/{feature}.md`, `docs/02-design/{feature}.md`, `docs/04-qa/{feature}.md`

## Executive Summary

### Project Overview

| 항목 | 내용 |
|------|------|
| Feature | {피처명} |
| 시작일 | {date} |
| 완료일 | {date} |
| 기간 | {n}일 |

### Value Delivered

| Perspective | Planned | Actual |
|-------------|---------|--------|
| **Problem** | {계획한 문제 해결} | {실제 해결한 문제} |
| **Solution** | {계획한 솔루션} | {실제 구현한 솔루션} |
| **UX Effect** | {계획한 UX 효과} | {실제 UX 효과} |
| **Core Value** | {계획한 핵심 가치} | {실제 달성한 가치} |

## Success Criteria Final Status

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-01 | {기준} | ✅ Met / ❌ Not Met | {근거} |

**Success Rate**: {n}/{m} criteria met ({p}%)

## PDCA Cycle Summary

| Phase | Status | Key Output |
|-------|--------|------------|
| Plan | ✅ | `docs/01-plan/{feature}.md` |
| Design | ✅ | `docs/02-design/{feature}.md` |
| Infra | ✅/⬜ | `docs/03-infra/{feature}.md` |
| FE | ✅/⬜ | 화면 구현 |
| BE | ✅/⬜ | API 구현 |
| QA | ✅ | `docs/04-qa/{feature}.md` |

## Key Decisions & Outcomes

| Decision | Source | Followed? | Outcome |
|----------|--------|-----------|---------|
| {결정 사항} | Plan/Design | ✅/❌ | {결과} |

## QA Results

| Metric | Target | Final |
|--------|--------|-------|
| Gap 일치율 | ≥90% | {n}% |
| QA 통과율 | ≥90% | {n}% |
| Critical 이슈 | 0건 | {n}건 |

## Retrospective

### Keep (잘한 점)
-

### Problem (개선할 점)
-

### Try (다음에 시도할 것)
-

## Next Steps
- [ ]

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 |
```

---

## 10. File: `skills/vais/phases/report.md` (FR-16) — 신규

```markdown
### 📊 report — 완료 보고서 생성

1. QA 문서 읽기 (`docs/04-qa/{feature}.md`) — 최종 판정, Gap 일치율, 이슈 목록 확인
2. Plan 문서 읽기 — Executive Summary, Success Criteria 원문 로드
3. Design 문서 읽기 — Architecture Option 선택 근거, Key Decisions 로드
4. `templates/report.template.md` 기반으로 보고서 작성:
   - **Value Delivered**: Plan Executive Summary vs 실제 결과 비교
   - **Success Criteria Final**: Plan SC를 QA 결과로 최종 평가
   - **Key Decisions & Outcomes**: Plan→Design의 주요 결정과 실제 결과
   - **Retrospective**: Keep/Problem/Try 3가지 관점 회고
5. `docs/05-report/{feature}.md`에 저장
6. AskUserQuestion: "보고서 내용을 확인해 주세요. 수정할 사항이 있나요?"
```

---

## 11. Implementation Guide

### Implementation Order

| Phase | Step | Files | FR Coverage |
|-------|------|-------|-------------|
| P1 | 1 | `templates/plan.template.md` | FR-01~04 |
| P1 | 2 | `templates/design.template.md` | FR-05~06 |
| P2 | 3 | `skills/vais/phases/plan.md` | FR-07, FR-09, FR-10 |
| P2 | 4 | `skills/vais/phases/design.md` | FR-08, FR-09 |
| P3 | 5 | `templates/qa.template.md` | FR-12, FR-17 |
| P3 | 6 | `skills/vais/phases/fe.md` | FR-11, FR-13 |
| P3 | 7 | `skills/vais/phases/be.md` | FR-11, FR-13 |
| P3 | 8 | `skills/vais/phases/qa.md` | FR-14, FR-17 |
| P4 | 9 | `templates/report.template.md` | FR-15 |
| P4 | 10 | `skills/vais/phases/report.md` | FR-16 |
| Test | 11 | `node --test tests/*.test.js` | NFR-03 |
| Test | 12 | `/vais plan test-feature` 실행 | SC-07 |

### Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | plan.template.md, plan.md | Plan 템플릿 + Phase 강화 |
| module-2 | design.template.md, design.md | Design 템플릿 + Phase 강화 |
| module-3 | qa.template.md, fe.md, be.md, qa.md | QA/구현 강화 |
| module-4 | report.template.md, report.md | Report 신규 생성 |

### Session Guide

| Session | Modules | Description |
|---------|---------|-------------|
| Session 1 | module-1 + module-2 | Plan/Design 핵심 (가장 큰 효과) |
| Session 2 | module-3 | QA/FE/BE 강화 |
| Session 3 | module-4 + Test | Report + 통합 테스트 |

---

## 12. vais.config.json 변경

`docPaths`에 report 경로 추가 필요:

```json
"docPaths": {
  "plan": "docs/01-plan/{feature}.md",
  "design": "docs/02-design/{feature}.md",
  "infra": "docs/03-infra/{feature}.md",
  "qa": "docs/04-qa/{feature}.md",
  "report": "docs/05-report/{feature}.md"
}
```

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-25 | 초기 작성 — Option B (Full Parity) 선택 |
