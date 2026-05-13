# {feature} - 기획서 (Extended)

> 📝 **Extended 템플릿** (v0.65) — autoSelect 가 PRD 부재 + 신규 피처 + UI/API 모두 감지 시 사용. 일반 피처는 `plan-standard.template.md`, 간단 수정은 `plan-stub.template.md` 또는 `plan-minimal.template.md`.
> ⛔ **Plan ≠ Do**: 분석·결정만 기록. 코드 수정은 Do 단계에서.
> artifact body template: phase index 는 `templates/main-md.template.md` 사용.
> v0.65 변경: Topic Documents/Scratchpads (v0.57 잔재) / 0.5 MVP / 0.6 경쟁 분석 / 7.1 UI 라이브러리 / 8 화면 목록 / 9 일정 섹션 삭제. 22 헤딩 (v0.64=52).

## 요청 원문

> {사용자 요청을 축약 없이 인용. CEO 위임이면 출처 표기.}

## In-scope

- {요청 원문에 명시된 항목}
- {기술적 전제조건 (의존성·런타임)}

## Out-of-scope

- {의도적으로 제외한 항목 + 이유 1줄}
- {별도 피처 후보로 분기할 항목}

(자발 감지 확장 후보는 `## 관찰 (후속 과제)` — CLAUDE.md Rule #9)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {해결하려는 문제 1~2문장} |
| **Solution** | {제안하는 해결책 1~2문장} |
| **Function/UX Effect** | {사용자가 체감하는 변화} |
| **Core Value** | {비즈니스/기술적 핵심 가치} |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | {왜 필요한가} |
| **WHO** | {누구를 위한 것인가} |
| **RISK** | {주요 위험 요소} |
| **SUCCESS** | {성공 기준 요약} |
| **SCOPE** | {범위 한 줄 요약} |

## Decision Record (multi-owner, append-only)

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| 1 | {결정 한 줄} | cto | {근거} | `{artifact}.md` |

---

## 0.7 PRD 입력 (CTO 전용)

> CTO plan 은 CPO PRD (`docs/{feature}/01-plan/prd.md`) 를 입력으로 동작. 부재 시 "강행 모드".

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/{feature}/01-plan/prd.md` 또는 "없음 (강행 모드)" |
| 완성도 | full / partial(N/8) / missing |
| 검사 시각 | YYYY-MM-DD |

### PRD 핵심 결정 (있는 경우)

| # | 결정 | PRD 출처 섹션 |
|---|------|--------------|
| 1 | | |

### 강행 모드 가정 (PRD 없는 경우)

- 사용자 선택: CP-0 에서 B 선택 (또는 lean smart mode 자동 강행)
- 가정한 요구사항: 1) ... 2) ...

## 1. 개요

- 기능 설명 (1문장):
- 해결하려는 문제:
- 기대 효과:

## 2. Plan-Plus 검증

### 2.1 의도 발견
> 이 기능이 정말 해결하려는 근본 문제는?

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|------|
| 1 | 기존 라이브러리/서비스 활용 | | | |
| 2 | 직접 구현 | | | |

### 2.3 YAGNI 리뷰
- [ ] 현재 필요한 기능만 포함했는가?
- [ ] 미래 요구사항 과잉 설계 없는가?

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | | | |

## 4. 기능 요구사항

| # | 기능 | 설명 | 우선순위 | 관련 파일 |
|---|------|------|---------|----------|
| 1 | | | Must/Nice | |

## 5. 정책 정의

### 비즈니스 규칙

| # | 정책 | 규칙 |
|---|------|------|
| 1 | | (예: 비밀번호 8자 이상, 영문+숫자+특수문자) |

### 권한 정책

| 역할 | 읽기 | 쓰기 | 삭제 | 관리 |
|------|------|------|------|------|
| 일반 사용자 | | | | |
| 관리자 | | | | |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | | |
| 보안 | | |
| 확장성 | | |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | {측정 가능한 성공 기준} | {검증 방법} |

> QA 단계에서 ✅ Met / ⚠️ Partial / ❌ Not Met 평가.

## Impact Analysis

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| {파일/컴포넌트/API} | create/modify/delete | {변경 내용} |

### Current Consumers

| Resource | Code Path | Impact |
|----------|-----------|--------|
| {변경 대상} | {사용 위치} | {영향} |

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 프론트엔드 | | |
| 백엔드 | | |
| DB | | |
| 인프라 | | |

> UI 컴포넌트 라이브러리 등 상세는 design phase 에서 결정 (`docs/{feature}/02-design/`).

## 데이터 모델 개요

| 엔티티 | 주요 필드 | 관계 |
|-------|---------|------|
| | | |

## API 엔드포인트 개요

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| | | | Y/N |

## 관찰 (후속 과제)

- {자발 감지한 품질 리스크/개선 기회 — 다음 phase 가 자동 승계 X. 사용자 명시 확장 시만 In-scope 이동.}

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | | 초기 작성 |

> 다음 단계: `/vais cto design {feature}`

<!-- template version: plan-extended v0.65 (22 headings, -57% from v0.58.5) -->
