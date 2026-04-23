# {feature} - 기획서 (Standard)

> ⛔ **Plan 단계 범위**: 분석·결정만 기록. 프로덕트 파일 생성·수정은 Do 단계.
> 📝 **Standard 템플릿** (v0.58.5+) — CP-1 "B. 표준" 선택 시 사용. PRD 있음 / CTO 단독 강행 양쪽 커버. 경량 템플릿은 `plan-minimal.template.md`, 전체는 `plan-extended.template.md`.
> <!-- size budget: main.md ≤ 200 lines (refuse enforcement). 초과 시 topic 분리. -->

## 요청 원문

> {사용자 요청을 축약 없이 인용. 여러 개면 번호. CEO 위임 컨텍스트면 출처 표기.}

## In-scope

- {요청 원문에 명시된 항목}
- {기술적 전제조건 (필요한 인프라·의존성)만}

## Out-of-scope

- {의도적으로 제외한 항목 + 이유 1줄}
- {별도 피처 후보로 분기할 항목}
- (자발 감지 확장 후보는 `## 관찰 (후속 과제)` — CLAUDE.md Rule #9)

---

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | {해결하려는 문제 1~2문장} | {예: cbo, cpo} |
| **Solution** | {제안하는 해결책 1~2문장} | {예: cto} |
| **Function/UX Effect** | {사용자가 체감하는 변화} | {예: cpo} |
| **Core Value** | {비즈니스/기술적 핵심 가치} | {예: ceo, cbo} |

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

## Decision Record (multi-owner)

<!-- 각 C-Level 이 자기 결정 행을 append. 이전 행 수정·삭제 금지. Owner 컬럼 필수. -->

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | {결정 한 줄} | cto | {근거} | `{topic}.md` |

<!-- 각 C-Level 이 기여하는 경우 아래 H2 섹션을 순서대로 append:
     ## [CBO] 시장 분석 / GTM
     ## [CPO] 제품 정의
     ## [CTO] 기술 스케치
     ## [CSO] 보안 요구사항
     ## [COO] 운영 준비
     (비대문자/다른 owner prefix 금지. 이전 C-Level 섹션 수정·삭제 금지.) -->

---

## 0. 아이디어 요약

| Key | Value |
|-----|-------|
| 한 줄 설명 | {기능/서비스를 한 문장으로} |
| 배경 (문제/한계/필요성) | {현재 문제 · 기존 해결책 한계 · 이유} |
| 타겟 사용자 | {주요 / 보조 사용자 + Pain Point} |
| 핵심 시나리오 | {상황 → 행동 → 결과} |

> MVP 매트릭스 / 경쟁 분석은 Extended 또는 CPO PRD / CBO market-researcher 영역

## 0.7 PRD 입력 (CTO 전용 강행 체크)

> CTO plan 은 CPO PRD(`docs/{feature}/03-do/main.md`)를 입력으로 동작. PRD 없거나 부실 시 "강행 모드" 표시.
> CTO 외 C-Level 은 이 섹션을 "(N/A — CTO 전용)" 한 줄로 대체.

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/{feature}/03-do/main.md` 또는 "없음 (강행 모드)" |
| 완성도 | full / partial(N/8) / missing |
| 검사 시각 | YYYY-MM-DD |

### PRD 핵심 결정 (PRD 있음)

| # | 결정 | PRD 출처 섹션 |
|---|------|--------------|
| 1 | | |

### 강행 모드 사유 (PRD 없음)

- 사용자 선택: CP-0 에서 B 선택
- 가정한 요구사항: 1) · 2)

> ⚠️ 강행 모드 plan 은 가정 포함. design 단계에서 검증 필요.

## 2. Plan-Plus 검증

### 2.1 의도 발견
> 이 기능이 정말 해결하려는 근본 문제는 무엇인가?

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|---|------|------|------|------|
| 1 | 기존 라이브러리/서비스 | | | |
| 2 | 직접 구현 | | | |

### 2.3 YAGNI 리뷰
- [ ] 현재 필요한 기능만 포함
- [ ] 미래 요구사항 과잉 설계 없음
- [ ] 제거 가능한 기능: {있으면 기재}

## 4. 기능 요구사항 (요약)

| # | 기능 | 설명 | 우선순위 | 관련 파일 |
|---|------|------|:-------:|----------|
| 1 | | | Must/Nice | |

> 기능 상세(트리거·정상·예외 흐름)는 Do 단계 구현 시 기록 또는 Extended

## 5. 정책 (비즈니스 규칙)

| # | 정책 | 규칙 |
|---|------|------|
| 1 | | (예: 비밀번호 8자 이상) |
| 2 | | (예: 로그인 5회 실패 시 30분 잠금) |

> 권한 매트릭스 / 유효성 검증 상세는 Extended 또는 design phase

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | | |
| 보안 | | |
| 확장성 | | |
| 접근성 | | |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | {측정 가능한 성공 기준} | {검증 방법} |
| SC-02 | {측정 가능한 성공 기준} | {검증 방법} |

> QA 에서 ✅ Met / ⚠️ Partial / ❌ Not Met 평가

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| {파일/컴포넌트/API} | create/modify/delete | {변경 내용} |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| {변경 대상} | {CRUD} | {사용 위치} | {영향} |

### Verification
- [ ] 모든 consumer 확인 완료
- [ ] breaking change 없음 확인

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 프론트엔드 | | |
| 백엔드 | | |
| DB | | |
| 인프라 | | |

> UI 컴포넌트 라이브러리 선정 / 화면 목록 / ER 다이어그램 / API 엔드포인트 상세는 design phase (또는 Extended)

## 관찰 (후속 과제)

> Rule #9: 자발 감지 확장 후보는 여기 기록만. In-scope 자동 승계 금지.

- (없으면 "없음")

---

## Topic Documents (v0.57+)

> C-Level 이 `_tmp/*.md` scratchpad 를 읽고 주제별로 합성한 문서 인덱스. `owner` 컬럼 frontmatter 와 일치.

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| | `{topic}.md` | cto | | |

<!-- Phase 별 권장 topic 프리셋: vais.config.json > workflow.topicPresets.01-plan.{c-level} -->

## Scratchpads (v0.57+)

> sub-agent 가 작성한 `_tmp/*.md` 인벤토리. `scripts/doc-validator.js` 가 size/metadata 검증.

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| | `_tmp/{agent-slug}.md` | | |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | | 초기 작성 |
| v1.1 | YYYY-MM-DD | {ROLE} 재진입: {요약} |

<!-- template version: plan-standard v0.58.5 (v0.57+ subdoc / v0.58+ clevel-coexistence 포함) -->
