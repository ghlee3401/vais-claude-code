# {feature} - 기획서 (Minimal)

> ⛔ **Plan 단계 범위**: 분석·결정만 기록. 프로덕트 파일 생성·수정은 Do 단계.
> 📝 **Minimal 템플릿** (v0.58.4+) — CP-1 에서 "A. 최소" 선택 시 사용. 표준 템플릿은 `plan.template.md`.
> 🎯 **CTO 전용**: mandatory PDCA 보유는 CTO 만. 비-CTO 는 CEO 7 차원 알고리즘이 활성화한 phase 만 실행.
> <!-- size budget: main.md ≤ 200 lines (warn — 0.64.0 부터 인덱스 자연 충족). 초과 시 artifact MD 분리. -->

## 요청 원문

> {사용자 요청을 축약 없이 인용. 위임 컨텍스트면 출처 표기.}

## In-scope

- {요청 원문에 명시된 항목만}
- {기술적 전제조건 (의존성/런타임) 만}

## Out-of-scope

- {의도적 제외 항목 + 이유 1줄}
- (자발 감지 확장 후보는 `## 관찰` 섹션 — CLAUDE.md Rule #9)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | {왜 이 변경이 필요한가} |
| **SUCCESS** | {측정 가능한 완료 조건 1줄} |
| **RISK** | {주요 리스크 1줄, 없으면 "없음"} |

## Decision Record

| # | Decision | Owner | Rationale |
|---|----------|:-----:|-----------|
| 1 | {결정 한 줄} | {c-level} | {근거 한 줄} |

## 변경 대상

| 파일 | 변경 유형 | 설명 |
|------|:--------:|------|
| {경로} | create/modify/delete | {한 줄} |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | {측정 가능한 성공 기준} | {검증 방법} |

## 관찰 (후속 과제)

> Rule #9: 자발 감지한 확장 후보는 여기에 기록만. In-scope 로 자동 승계 금지.

- (없으면 "없음")

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {YYYY-MM-DD} | 초기 작성 (minimal) |

<!-- template version: plan-minimal v0.58.4 -->
