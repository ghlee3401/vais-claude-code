# plan-scope-contract - 설계

> ⛔ **Design 단계 범위**: 이 문서는 설계 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행합니다.
> 참조 문서: `../01-plan/main.md` (main + tech-sketch.md)
> <!-- size budget: main.md ≤ 200 lines -->

## 요청 원문 (Plan 승계)

> "현재 vais-code를 쓰면 작은 부분 고치는데도 너무 큰 코스트가 들어가는 것 같아" + GA 이벤트 scope creep 사례 → F1+F2+F3 MVP 로 합의

## In-scope

- Edit Contract 확정 — 5개 대상 파일의 정확한 diff (CLAUDE.md / plan.template.md / doc-validator.js / cto.md / events.js)
- W-SCOPE-01/02/03 validator regex 최종 식
- event-log 스키마 (`plan_completed`, `plan_rewrite_requested`) 필드 확정

## Out-of-scope (Plan 승계)

- F4 공통 헤더 승격 (`templates/_shared/scope-contract.template.md`)
- CEO triage gate
- 관찰/후속 과제 자동 승계 차단 규약
- (자발 감지한 확장 후보는 `## 관찰 (후속 과제)` 로 — Rule #9 dog-fooding)

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | UI 없는 피처 — 전통적 Interface Contract 를 Edit Contract 로 대체 | cto | 대상이 prompt/markdown/JS validator 라 API 계약 무관 | `./edit-contract.md` |
| 2 | W-SCOPE regex 는 `/^## {label}\s*$/m` 패턴 — 트레일링 공백 허용 | cto | editor 별 trailing whitespace 차이 robust | `./edit-contract.md` |
| 3 | event-log 는 기존 `.vais/event-log.jsonl` 에 append — 스키마 수정 아닌 **신규 타입** 추가 | cto | 기존 hook/파서 무영향 | `./edit-contract.md` |
| 4 | reason 분류는 **사용자 메시지 키워드 휴리스틱** — 학습 없이 rule-based | cto | SC-01 측정 용도로 충분한 정확도, 구현 단순 | `./edit-contract.md` |

## Context Anchor (Plan 승계)

| Key | Value |
|-----|-------|
| **WHY** | 재작업 사이클 정량 측정 가능한 훅 필요 (SC-01/02) |
| **WHO** | Do 단계 편집 수행자 (CTO 자체 + test-engineer) |
| **RISK** | regex 오매치로 false negative / event-log 스키마 파급 |
| **SUCCESS** | edit-contract.md 로 Do 단계 zero-ambiguity 편집 가능 |
| **SCOPE** | 5개 파일 정확한 diff + 단위 테스트 7건 |

---

## Architecture Options

| Option | 설명 | 복잡도 | 리스크 | 선택 |
|--------|------|:------:|:------:|:----:|
| A. Minimal (각 파일 직접 편집) | 기존 파일에 블록 삽입만. 공통 추상 없음 | 낮음 | 낮음 | **✓** |
| B. Clean (shared scope-contract include) | `templates/_shared/` 로 공통화, include 메커니즘 구현 | 높음 | 중 | — |
| C. Pragmatic | — | — | — | — |

**Rationale**: 본 피처의 핵심 메시지가 "rail 가볍게" 이므로 A. Minimal 이 dog-fooding 일관성. B 는 F4 로 분기 (Out-of-scope).

---

## [CTO] 기술 설계

본 design 의 핵심 산출물은 [`./edit-contract.md`](./edit-contract.md) 단일 topic. UI/네비게이션/와이어프레임은 모두 N/A (피처 특성).

**확정 사항**
- 5개 대상 파일의 before/after diff 문구 확정 (edit-contract §1~§5)
- W-SCOPE regex 3종 최종식: `/^## 요청 원문\s*$/m`, `/^## In-scope\s*$/m`, `/^## Out-of-scope\s*$/m`
- event-log 신규 타입 2종 schema 확정 (edit-contract §5)
- reason 분류 키워드 셋 확정 — 한국어 6개 패턴

**Gate 2 체크리스트 (UI 없는 피처 대체형)**
- [x] Edit Contract 에 5개 파일 정확한 diff
- [x] regex 트레일링 공백 robust
- [x] event-log 기존 타입과 충돌 없음

**UI/IA/와이어프레임/컴포넌트/디자인 토큰**
- N/A. 본 피처는 prompt/markdown/validator 편집. 화면 없음.

**Do 단계 위임 계획**
- Step 1~5: CTO 직접 편집 (edit-contract 그대로 수행)
- Step "test": test-engineer 에 `tests/doc-validator.test.js` 7 assertion 위임
- qa-engineer 는 QA phase 에서 별도 호출 — regression 확인

---

## Part 1: IA / Part 2: 와이어프레임 / Part 3: 컴포넌트 / Part 4: 디자인 토큰

N/A — UI 없음.

---

## Interface Contract

**대체**: [`./edit-contract.md`](./edit-contract.md) — 전통 API/계약 대신 파일별 정확한 diff 문서. Do 단계가 이 문서를 입력으로 편집 수행.

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| edit-contract | [`./edit-contract.md`](./edit-contract.md) | cto | 5개 대상 파일 정확한 diff + regex + event schema + Gate 2 체크 | — |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (없음) | `_tmp/` 비어 있음 | — | — |

---

## Gate Metrics (Gate 2)

- Interface Contract: ✅ (edit-contract.md)
- 컴포넌트 명세: N/A (UI 없음)
- 디자인 토큰: N/A
- 네비게이션 플로우: N/A
- 에러·로딩·빈 상태: N/A

Gate 2 대체형 통과.

---

## Next

> 다음 단계: `/vais cto do plan-scope-contract` — edit-contract.md 를 입력으로 5개 파일 편집 수행 + test-engineer 위임

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — CTO, edit-contract topic 분리, Architecture A Minimal 확정 |

<!-- template version: v0.58.0 -->
