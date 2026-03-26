# Plan: interactive-patterns — vais-code 인터랙티브 패턴 보강

- **Date**: 2026-03-26
- **Author**: ghlee0304
- **Project**: vais-claude-code
- **Version**: 1.0

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | vais-code의 phase 파일들이 단일 선택(AskUserQuestion)만 사용하여, 복수 선택·구조 비교·범위 지정 등 풍부한 인터랙션이 부재 |
| **Solution** | 13개 phase 파일에 multiSelect, preview, scope 3가지 패턴을 체계적으로 적용 |
| **Function UX Effect** | 사용자가 MVP 기능을 한번에 복수 선택하고, 설계안을 코드 구조로 비교하고, 구현 범위를 모듈 단위로 좁힐 수 있음 |
| **Core Value** | AI 에이전트와의 협업에서 사용자 의사결정 품질과 속도를 동시에 높임 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bkit PDCA에서 multiSelect/preview/scope가 효과적임을 확인 → vais-code에도 적용 필요 |
| **WHO** | vais-code 사용자 (웹 프로젝트 개발자) |
| **RISK** | 과도한 질문으로 워크플로우 속도 저하 가능 → 적절한 밸런스 필요 |
| **SUCCESS** | 3가지 패턴이 각각 최소 2개 이상 phase에 적용, auto 모드와 호환 |
| **SCOPE** | skills/vais/phases/*.md 13개 파일 |

---

## 1. Overview

### 1.1 Purpose

AskUserQuestion 도구는 `multiSelect`, `preview`, `options(2~4개)` 기능을 지원하지만, 현재 vais-code는 단일 선택만 사용한다. bkit PDCA에서 이 기능들이 실제로 효과적임을 확인했으므로, vais-code의 phase 파일들에 체계적으로 적용한다.

### 1.2 Background

- **multiSelect**: plan에서 MVP 기능 선별 시 복수 선택, qa에서 수정할 이슈 복수 선택 등
- **preview**: design에서 3가지 설계안의 폴더 구조 비교, architect에서 DB 스키마 비교 등
- **scope**: frontend/backend에서 모듈별 구현 범위 선택, qa에서 검사 범위 선택 등

---

## 2. Scope

### 2.1 In Scope — Phase별 적용 계획

#### multiSelect 적용 (복수 선택)

| Phase | 위치 | 적용 내용 |
|-------|------|---------|
| **plan** | Step 1: MVP 범위 결정 | 브레인스토밍한 기능 중 MVP에 포함할 기능 복수 선택 |
| **init** | Feature scope 선택 | 기존 프로젝트에서 VAIS 적용할 피처 복수 선택 |
| **qa** | Review Decision 확장 | 수정할 이슈를 개별 선택 (Critical 전체 + 선택적 Important) |
| **frontend** | 구현 범위 | 이번 세션에서 구현할 컴포넌트/페이지 복수 선택 |

#### preview 적용 (구조 비교 미리보기)

| Phase | 위치 | 적용 내용 |
|-------|------|---------|
| **design** | Checkpoint 3: 설계안 선택 | 3가지 Option의 폴더 구조를 preview로 비교 |
| **architect** | DB 선택 | DB 종류별 설정 코드/구조를 preview로 비교 |
| **plan** | UI 라이브러리 선택 | 라이브러리별 컴포넌트 코드 예시를 preview로 비교 |
| **commit** | 버전 범프 확인 | 버전 변경 전후 diff를 preview로 표시 |

#### scope 적용 (범위 선택)

| Phase | 위치 | 적용 내용 |
|-------|------|---------|
| **frontend** | 구현 시작 | Session Guide의 Module Map에서 이번 세션 범위 선택 |
| **backend** | 구현 시작 | API 엔드포인트 그룹별 구현 범위 선택 |
| **qa** | 검사 시작 | 전체 검사 vs 특정 카테고리(빌드/갭/코드리뷰/보안) 선택 |

#### 미사용 phase에 AskUserQuestion 추가

| Phase | 현재 | 추가 내용 |
|-------|------|---------|
| **backend** | AskUserQuestion 없음 | 구현 범위 scope 선택 + API 우선순위 확인 |
| **manager** | AskUserQuestion 없음 | 영향 분석 결과 후 실행 여부 확인 |
| **next** | AskUserQuestion 없음 | 추천 다음 단계 확인 + 대안 제시 |
| **status** | AskUserQuestion 없음 | 상태 확인 후 바로 실행할 액션 선택 |

### 2.2 Out of Scope

| 항목 | 사유 |
|------|------|
| AskUserQuestion 도구 자체 수정 | Claude Code 내장 도구, 수정 불가 |
| help.md, commit.md 패턴 변경 | 현재 인터랙션 이미 충분 |
| auto.md Gate 패턴 변경 | 현재 Gate 체크포인트 이미 효과적 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 대상 Phase | 패턴 | 우선순위 |
|----|---------|-----------|------|---------|
| FR-01 | plan: MVP 기능 복수 선택 | plan.md | multiSelect | P0 |
| FR-02 | design: 설계안 preview 비교 | design.md | preview | P0 |
| FR-03 | frontend: 모듈별 scope 선택 | frontend.md | scope | P0 |
| FR-04 | backend: scope 선택 + 확인 체크포인트 | backend.md | scope + 단일선택 | P0 |
| FR-05 | qa: 이슈 복수 선택 + 검사 범위 | qa.md | multiSelect + scope | P1 |
| FR-06 | init: 피처 복수 선택 | init.md | multiSelect | P1 |
| FR-07 | plan: UI 라이브러리 preview 비교 | plan.md | preview | P1 |
| FR-08 | architect: DB 선택 preview 비교 | architect.md | preview | P1 |
| FR-09 | commit: 버전 범프 preview | commit.md | preview | P2 |
| FR-10 | manager: 실행 확인 체크포인트 | manager.md | 단일선택 | P2 |
| FR-11 | next: 다음 단계 선택 + 대안 | next.md | 단일선택 | P2 |
| FR-12 | status: 액션 바로 실행 선택 | status.md | 단일선택 | P2 |

### 3.2 Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | auto 모드 호환 | multiSelect/scope 패턴은 auto 모드에서 기본값 자동 선택으로 동작 |
| NFR-02 | 질문 횟수 제한 | 한 phase당 AskUserQuestion 최대 3회 (과도한 질문 방지) |
| NFR-03 | 기존 동작 유지 | 현재 작동하는 체크포인트/선택지 변경 없음, 추가만 |

---

## 4. Success Criteria

| # | 기준 | 측정 방법 |
|---|------|---------|
| SC-01 | multiSelect가 최소 3개 phase에 적용 | plan, init, qa, frontend 중 3개 이상 |
| SC-02 | preview가 최소 2개 phase에 적용 | design, architect, plan 중 2개 이상 |
| SC-03 | scope가 최소 2개 phase에 적용 | frontend, backend, qa 중 2개 이상 |
| SC-04 | 기존 체크포인트 동작 유지 | 현재 7개 phase의 AskUserQuestion 그대로 작동 |
| SC-05 | 미사용 4개 phase에 AskUserQuestion 추가 | backend, manager, next, status |

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 질문 과다로 워크플로우 속도 저하 | 중 | 중 | phase당 최대 3회 제한, 기본값 제공 |
| auto 모드와 multiSelect 충돌 | 중 | 낮 | auto 모드에서는 "전체 선택" 기본값 |
| preview 내용이 너무 길어 가독성 저하 | 낮 | 중 | preview는 10줄 이내로 제한 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| 파일 | 변경 유형 | 변경 규모 |
|------|---------|---------|
| `skills/vais/phases/plan.md` | 수정 | +15줄 (multiSelect MVP 기능 + preview UI 라이브러리) |
| `skills/vais/phases/design.md` | 수정 | +10줄 (preview 설계안 비교) |
| `skills/vais/phases/frontend.md` | 수정 | +15줄 (scope + multiSelect 컴포넌트 선택) |
| `skills/vais/phases/backend.md` | 수정 | +20줄 (scope + 확인 체크포인트 신규) |
| `skills/vais/phases/qa.md` | 수정 | +10줄 (multiSelect 이슈 선택 + scope 범위) |
| `skills/vais/phases/init.md` | 수정 | +5줄 (multiSelect 피처 선택) |
| `skills/vais/phases/architect.md` | 수정 | +10줄 (preview DB 비교) |
| `skills/vais/phases/commit.md` | 수정 | +5줄 (preview 버전 diff) |
| `skills/vais/phases/manager.md` | 수정 | +10줄 (실행 확인 체크포인트) |
| `skills/vais/phases/next.md` | 수정 | +10줄 (다음 단계 선택) |
| `skills/vais/phases/status.md` | 수정 | +10줄 (액션 바로 실행) |

### 6.2 Current Consumers

| Consumer | Impact |
|----------|--------|
| `/vais auto` (auto 모드) | multiSelect/scope에 기본값 필요 |
| 체이닝 (`plan:design`) | 각 단계의 신규 체크포인트가 체이닝 흐름에 맞아야 함 |

---

## 7. Architecture Considerations

### 7.1 Project Level

- [x] **Starter** — phase .md 파일 텍스트 수정만, 코드 변경 없음

### 7.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 패턴 명시 방식 | 자연어 지침 (마크다운) | phase 파일이 LLM 프롬프트이므로 자연어가 가장 효과적 |
| auto 모드 호환 | 기본값 명시 | "auto 모드에서는 전체 선택" 등 fallback 지침 포함 |
| preview 형식 | ASCII 코드 블록 | AskUserQuestion preview는 monospace 렌더링 |

---

## 8. 패턴별 구현 가이드

### 8.1 multiSelect 패턴 템플릿

```markdown
AskUserQuestion (multiSelect: true):
- 질문: "MVP에 포함할 기능을 선택하세요"
- 옵션: 브레인스토밍 결과에서 추출한 기능 목록 (최대 4개 그룹)
- auto 모드: Must 우선순위 전체 선택
```

### 8.2 preview 패턴 템플릿

```markdown
AskUserQuestion (preview 포함):
- 질문: "어떤 설계안을 선택하시겠습니까?"
- 각 옵션에 preview 필드 포함 (폴더 구조, 코드 스니펫 등)
- preview는 10줄 이내, monospace 렌더링
```

### 8.3 scope 패턴 템플릿

```markdown
AskUserQuestion:
- 질문: "이번 세션에서 구현할 범위를 선택하세요"
- 옵션: Session Guide의 Module Map에서 추출
- "전체 구현 (Recommended)" 옵션 포함
```

---

## 9. Next Steps

- [ ] Design 문서 작성: `/pdca design interactive-patterns`
- [ ] 구현: P0(plan, design, frontend, backend) → P1(qa, init, architect) → P2(commit, manager, next, status)
- [ ] Gap 분석: `/pdca analyze interactive-patterns`

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | ghlee0304 | 초기 Plan 문서 작성 |
