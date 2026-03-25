# pdca-quality-upgrade Planning Document

> **Summary**: bkit PDCA 대비 vais-code 문서 퀄리티 격차 해소 — 템플릿 구조 강화, Phase 간 컨텍스트 연결, Do/QA 강화, Report 학습 루프 도입
>
> **Project**: vais-code
> **Version**: 0.17.0
> **Author**: ghlee0304
> **Date**: 2026-03-25
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | vais-code가 생성하는 PDCA 문서의 퀄리티가 bkit 대비 현저히 낮음. 템플릿 깊이 절반, 컨텍스트 전파 메커니즘 부재, 의사결정 추적 불가, 학습 루프 없음 |
| **Solution** | 4단계 개선: (1) 템플릿 구조 강화, (2) Phase 간 컨텍스트 연결 메커니즘, (3) Do/QA 구현 가이드 강화, (4) Report 템플릿 + 학습 루프 도입 |
| **Function/UX Effect** | AI가 생성하는 문서의 일관성·추적성·완성도 향상. 세션 간 컨텍스트 유실 방지. 대화형 체크포인트로 사용자 참여 강화 |
| **Core Value** | bkit 수준의 문서 품질 달성. "문서가 코드를 이끄는" AI Native 개발 패러다임 실현 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | vais-code 문서는 독립적이고 얕음. bkit은 문서 간 체인 연결 + 깊은 구조로 AI 컨텍스트 유지가 월등 |
| **WHO** | vais-code 플러그인 사용자 (개발자) |
| **RISK** | 대규모 변경으로 기존 문서 호환성 파괴, 템플릿이 과도하게 복잡해져 오히려 사용성 저하 |
| **SUCCESS** | (1) 각 템플릿에 Executive Summary + Context Anchor 존재, (2) Phase 간 컨텍스트 자동 전파, (3) 생성 문서가 bkit 수준의 구조를 가짐 |
| **SCOPE** | 4개 기존 템플릿 개선 + 2개 신규 템플릿 + 6개 phase 파일 수정 |

---

## 1. Overview

### 1.1 Purpose

bkit의 PDCA 문서 생성 메커니즘을 분석하여, vais-code의 템플릿과 phase 파일을 개선. 결과적으로 vais-code가 생성하는 문서가 bkit과 동등한 수준의 구조, 깊이, 추적성을 갖추도록 한다.

### 1.2 Background

**bkit vs vais-code 핵심 차이**:

| 영역 | bkit | vais-code | Gap Level |
|------|------|-----------|-----------|
| 템플릿 수 | 5개 | 4개 | Medium |
| 템플릿 깊이 (평균 섹션 수) | 10개 | 6개 | High |
| Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) | ✅ 전 문서 전파 | ❌ 없음 | **Critical** |
| Executive Summary (4-perspective) | ✅ 필수 | ❌ 없음 | **Critical** |
| Architecture Options (3안 비교) | ✅ Design 필수 | ❌ 없음 | High |
| Checkpoint (대화형 검증) | 5개 (CP1~CP5) | Gate 4개 (체크리스트만) | High |
| Upstream Context Loading | ✅ PRD→Plan→Design 체인 | 단순 참조 | High |
| Decision Record Chain | ✅ 전 Phase 추적 | ❌ 없음 | High |
| Code-to-Design 트레이서빌리티 | ✅ 3가지 주석 패턴 | ❌ 없음 | Medium |
| Session Guide (--scope) | ✅ Module Map | ❌ 없음 | Medium |
| Analysis 상세도 | 7-factor 점수 | 5단계 QA | Medium |
| Report (학습 루프) | ✅ Keep/Problem/Try | ❌ 없음 | High |
| Success Criteria | ✅ Plan 정의 → Analysis 평가 | ❌ 없음 | High |

### 1.3 Related Documents

| Document | Path | Purpose |
|----------|------|---------|
| bkit plan.template.md | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/templates/plan.template.md` | 참고 대상 |
| bkit design.template.md | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/templates/design.template.md` | 참고 대상 |
| bkit do.template.md | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/templates/do.template.md` | 참고 대상 |
| bkit analysis.template.md | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/templates/analysis.template.md` | 참고 대상 |
| bkit report.template.md | `~/.claude/plugins/cache/bkit-marketplace/bkit/2.0.6/templates/report.template.md` | 참고 대상 |
| vais plan.template.md | `templates/plan.template.md` | 수정 대상 |
| vais design.template.md | `templates/design.template.md` | 수정 대상 |
| vais infra.template.md | `templates/infra.template.md` | 수정 대상 |
| vais qa.template.md | `templates/qa.template.md` | 수정 대상 |
| vais plan.md (phase) | `skills/vais/phases/plan.md` | 수정 대상 |
| vais design.md (phase) | `skills/vais/phases/design.md` | 수정 대상 |

---

## 2. Requirements

### 2.1 Functional Requirements

#### Priority 1: 템플릿 구조 강화

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | plan.template.md에 Executive Summary (4-perspective 테이블) 추가 | Critical |
| FR-02 | plan.template.md에 Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) 추가 | Critical |
| FR-03 | plan.template.md에 Impact Analysis 섹션 추가 (Changed Resources + Current Consumers) | Important |
| FR-04 | plan.template.md에 Success Criteria 섹션 추가 | Critical |
| FR-05 | design.template.md에 Architecture Options 섹션 (3안 비교 + 선택 근거) 추가 | Critical |
| FR-06 | design.template.md에 Session Guide (Module Map + Session Plan) 추가 | Important |

#### Priority 2: Phase 간 컨텍스트 연결

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07 | plan.md phase 파일에 Checkpoint 1 (요구사항 확인) + Checkpoint 2 (명확화 질문) 추가 | Critical |
| FR-08 | design.md phase 파일에 Context Anchor 복사 지시 + Checkpoint 3 (설계안 선택) 추가 | Critical |
| FR-09 | 각 phase 파일에 Upstream Context Loading 지시 추가 (이전 문서 읽기 강제) | Important |
| FR-10 | Decision Record Chain 메커니즘 도입 (Plan→Design→Do→QA 의사결정 추적) | Important |

#### Priority 3: Do/QA 강화

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11 | fe.md/be.md phase 파일에 구현 가이드 구조 강화 (Phase별 Task 테이블, 파일 목록) | Important |
| FR-12 | qa.template.md에 Architecture Compliance + Convention Compliance 섹션 추가 | Important |
| FR-13 | Code Comment Convention 도입 (`// Design Ref:`, `// Plan SC:`) — fe.md/be.md에 지시 추가 | Minor |
| FR-14 | qa.md phase 파일에 Checkpoint 5 (리뷰 결정: 수정/Critical만/진행) 추가 | Important |

#### Priority 4: Report 학습 루프

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-15 | report.template.md 신규 생성 (Value Delivered, Success Criteria Final, Keep/Problem/Try) | Important |
| FR-16 | report phase 파일 신규 생성 (QA 후 → Report 생성 워크플로우) | Important |
| FR-17 | Success Criteria를 Plan에서 정의 → QA에서 ✅/⚠️/❌ 평가 연결 | Important |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 기존 프로젝트의 docs/ 문서와 하위 호환 유지 (새 섹션은 추가만, 기존 삭제 없음) |
| NFR-02 | 템플릿 복잡도가 과도하지 않도록 vais 6단계에 맞게 적응 (bkit 9단계를 그대로 복사하지 않음) |
| NFR-03 | 기존 테스트 전부 통과 |
| NFR-04 | phase 파일 변경 후 세션 재시작 없이 반영 (hot reload) |

---

## 3. Scope

### 3.1 In Scope

#### 수정 파일

| 파일 | 변경 | Priority |
|------|------|----------|
| `templates/plan.template.md` | Executive Summary, Context Anchor, Impact Analysis, Success Criteria 섹션 추가 | P1 |
| `templates/design.template.md` | Architecture Options, Session Guide, Context Anchor 섹션 추가 | P1 |
| `templates/qa.template.md` | Architecture/Convention Compliance, Success Criteria 평가 섹션 추가 | P3 |
| `skills/vais/phases/plan.md` | Checkpoint 1+2, Context Anchor 생성 지시, Upstream Loading | P2 |
| `skills/vais/phases/design.md` | Checkpoint 3, Context Anchor 복사 지시, Architecture Options 지시 | P2 |
| `skills/vais/phases/fe.md` | Code Comment Convention, Task 테이블 구조, Decision Record 참조 | P3 |
| `skills/vais/phases/be.md` | Code Comment Convention, Task 테이블 구조, Decision Record 참조 | P3 |
| `skills/vais/phases/qa.md` | Checkpoint 5, Architecture/Convention 검증, Success Criteria 평가 | P3 |

#### 신규 파일

| 파일 | 내용 | Priority |
|------|------|----------|
| `templates/report.template.md` | 완료 보고서 (Value Delivered, Success Criteria Final, Keep/Problem/Try) | P4 |
| `skills/vais/phases/report.md` | Report phase 실행 지시 (QA 후 자동 제안) | P4 |

### 3.2 Out of Scope

- bkit의 PM Agent Team (5개 PM 에이전트) 도입 — vais-code 규모에 과도
- bkit의 Archive/Cleanup 메커니즘 — 향후 과제
- bkit의 Agent Teams 통합 — 별도 피처
- Pipeline Phase 1~9 개념 — vais는 6단계 유지
- bkit의 MCP 서버 통합

---

## 4. Technical Approach

### 4.1 Priority 1: 템플릿 구조 강화

**plan.template.md 추가 섹션**:

```markdown
## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {해결하려는 문제} |
| **Solution** | {제안하는 해결책} |
| **Function/UX Effect** | {사용자가 체감하는 변화} |
| **Core Value** | {비즈니스/기술적 핵심 가치} |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | {왜 이 기능이 필요한가} |
| **WHO** | {누구를 위한 것인가} |
| **RISK** | {주요 위험 요소} |
| **SUCCESS** | {성공 기준 요약} |
| **SCOPE** | {범위 한 줄 요약} |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | {측정 가능한 기준} | {검증 방법} |

## Impact Analysis

### Changed Resources
| Resource | Type | Change |
|----------|------|--------|

### Current Consumers
| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
```

**design.template.md 추가 섹션**:

```markdown
## Context Anchor
(Plan에서 복사)

## Architecture Options

### Option A — Minimal Changes
{설명}

### Option B — Clean Architecture
{설명}

### Option C — Pragmatic Balance
{설명}

### Comparison
| 기준 | A | B | C |
|------|---|---|---|

### Selected: Option {X}
**Rationale**: {선택 근거}

## Session Guide

### Module Map
| Module | Files | Description |
|--------|-------|-------------|

### Recommended Session Plan
| Session | Modules | Estimated |
|---------|---------|-----------|
```

### 4.2 Priority 2: Phase 간 컨텍스트 연결

**plan.md phase 파일에 추가할 지시**:

```markdown
## Checkpoint 1 — 요구사항 확인
AskUserQuestion으로 "요구사항 이해가 맞나요? 빠진 건 없나요?" 질문.
사용자 확인 전까지 문서 생성하지 않음.

## Checkpoint 2 — 명확화 질문
불명확한 요소 (엣지 케이스, 에러 처리, 호환성) 정리하여 질문.
답변 후 문서 생성.

## Context Anchor 생성
Executive Summary와 Requirements에서 WHY/WHO/RISK/SUCCESS/SCOPE 추출.
문서 상단에 Context Anchor 테이블 작성.
```

**design.md phase 파일에 추가할 지시**:

```markdown
## Upstream Context Loading
1. Plan 문서를 **전체** 읽기 (요약이 아닌 전문)
2. Plan의 Context Anchor를 Design 문서 상단에 복사
3. Plan의 Success Criteria를 Design에 반영

## Checkpoint 3 — 설계안 선택
3가지 Architecture Option 제시 후 AskUserQuestion:
"3가지 설계안 중 어떤 걸 선택하시겠습니까?"
사용자 선택 후 해당 Option으로 문서 생성.
```

### 4.3 Priority 3: Do/QA 강화

**fe.md/be.md에 추가할 지시**:
- Plan/Design 문서 전체 읽기 강제
- Decision Record 표시
- Code Comment Convention: `// Design Ref:`, `// Plan SC:`

**qa.template.md에 추가할 섹션**:
- Architecture Compliance (계층 구조, 의존성 방향)
- Convention Compliance (네이밍, 폴더 구조, import 순서)
- Success Criteria Evaluation (Plan에서 정의한 기준 ✅/⚠️/❌ 평가)

### 4.4 Priority 4: Report 학습 루프

**report.template.md 신규 (bkit 참고)**:
- Executive Summary + Value Delivered
- Success Criteria Final Status
- PDCA Cycle Summary
- Key Decisions & Outcomes
- Retrospective (Keep / Problem / Try)
- Next Steps
- 변경 이력

---

## 5. Implementation Order

```
Phase 1: 템플릿 구조 강화 (FR-01~06)
  ├─ plan.template.md 개선
  ├─ design.template.md 개선
  └─ 테스트
     ↓
Phase 2: Phase 파일 연결 메커니즘 (FR-07~10)
  ├─ plan.md 체크포인트 추가
  ├─ design.md 체크포인트 + 컨텍스트 로딩 추가
  └─ 테스트
     ↓
Phase 3: Do/QA 강화 (FR-11~14)
  ├─ fe.md, be.md 구현 가이드 강화
  ├─ qa.template.md + qa.md 강화
  └─ 테스트
     ↓
Phase 4: Report 학습 루프 (FR-15~17)
  ├─ report.template.md 신규 생성
  ├─ report phase 파일 신규 생성
  └─ 테스트
```

---

## 6. Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | plan.template.md에 Executive Summary + Context Anchor + Success Criteria + Impact Analysis 존재 | 파일 내용 확인 |
| SC-02 | design.template.md에 Architecture Options (3안) + Session Guide 존재 | 파일 내용 확인 |
| SC-03 | plan.md에 Checkpoint 1+2 + Context Anchor 생성 지시 존재 | phase 파일 확인 |
| SC-04 | design.md에 Checkpoint 3 + Upstream Loading + Context Anchor 복사 지시 존재 | phase 파일 확인 |
| SC-05 | qa.template.md에 Architecture/Convention Compliance + Success Criteria 평가 존재 | 파일 내용 확인 |
| SC-06 | report.template.md 신규 생성 (Value Delivered + Keep/Problem/Try) | 파일 존재 확인 |
| SC-07 | `/vais plan {feature}` 실행 시 Checkpoint 대화가 발생 | 실제 실행 테스트 |
| SC-08 | 기존 테스트 전부 통과 | `node --test tests/*.test.js` |

---

## 7. Risk Analysis

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 템플릿이 너무 복잡해져서 AI가 일관되게 채우지 못함 | High | Medium | bkit 구조를 그대로 복사하지 않고, vais 6단계에 맞게 간소화 |
| 기존 프로젝트의 docs/ 문서와 호환성 깨짐 | Medium | Low | 새 섹션은 추가만, 기존 삭제 없음. 템플릿 version 번호 관리 |
| Phase 파일 변경 시 세션 재시작 필요 | Low | Low | CC 2.1.0+ hot reload 지원 |
| Checkpoint 추가로 워크플로우가 느려짐 | Medium | Medium | Checkpoint는 Plan/Design/QA에만 적용 (FE/BE는 제외) |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-25 | 초기 작성 — bkit 비교 분석 기반 4단계 개선 계획 |
