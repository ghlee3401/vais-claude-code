# plan-scope-contract - 구현 로그

> 참조: `../01-plan/main.md` + `../02-design/edit-contract.md`
> Phase: Do (CTO + test-engineer)

## 구현 결정사항

| Step | 결정 | 근거 |
|:-:|-----|------|
| 1 | CLAUDE.md Rule #9 에 불릿 1줄 append (들여쓰기 4 spaces) | 기존 Rule 번호 유지, 부연 형태로 최소 침습 |
| 2 | `templates/plan.template.md` 파일 최상단 (H1 + 경고 블록 직후) 에 3섹션 삽입 | Executive Summary 보다 앞에 둬서 **시각적 우선순위** |
| 3 | `scripts/doc-validator.js` 에 `validateScopeContract(feature)` 함수 + `formatScopeContractWarnings` 포매터 + CLI 확장 | 기존 `validateCoexistence` 와 동일 구조. module.exports 노출 |
| 4 | `tests/doc-validator-scope.test.js` 신규 — 기존 subdoc 테스트와 분리 | 규칙 독립성 유지 |
| 5 | `agents/cto/cto.md` 의 `## 작업 원칙` 직전에 `## Plan Scope Default (v0.58.3+)` 섹션 삽입 | subdoc-index 와 work-rules 사이 빈 자리, 상단 규칙 비중 유지 |
| 6 | `lib/observability/schema.js` 에 `PLAN_COMPLETED` / `PLAN_REWRITE_REQUESTED` 이벤트 **스키마만** 추가. 자동 발화 훅은 별도 피처로 분기 | dog-fooding: Lake 좁게 — 스키마는 본 피처, 발화 로직은 observability 후속 피처 |

## 변경 파일 목록

| 유형 | 경로 | 변경량 |
|:----:|-----|:------:|
| modify | `CLAUDE.md` | +1 line (Rule #9 부연) |
| modify | `templates/plan.template.md` | +16 lines (3섹션 블록) |
| modify | `scripts/doc-validator.js` | +50 lines (W-SCOPE 함수 + 포매터 + CLI + exports) |
| create | `tests/doc-validator-scope.test.js` | 약 180 lines (7 assertion) |
| modify | `agents/cto/cto.md` | +17 lines (Plan Scope Default 블록) |
| modify | `lib/observability/schema.js` | +5 lines (2 이벤트 타입 + 2 스키마 엔트리) |

**실제 합계**: 생성 1 / 수정 5 / ~270 lines (테스트 포함 — plan 에선 테스트를 ~50 으로 잡았으나 기존 스타일 준수로 상세해짐)

## Design 이탈 항목

| # | 이탈 | 이유 |
|:-:|------|------|
| 1 | event-log 자동 발화 로직 (reason 키워드 휴리스틱) 미구현 — **스키마만 추가** | plan/main.md `## Out-of-scope` 에 "자동 발화 훅은 별도 observability 피처로 분기" 추가 반영. Rule #9 dog-fooding — "Ocean 끓이지 않음" |
| 2 | plan/main.md 의 Scope Contract 섹션을 H3 에서 **H2 로 평탄화** | validator W-SCOPE regex 가 H2 만 매치. 이 피처가 제안한 규약을 스스로 준수하도록 교정. Dog-fooding 통과 |

## 검증 결과

### validator dog-fooding (이 피처 자체)

```
node scripts/doc-validator.js cto plan-scope-contract
→ scope-contract 경고 0건 (수정 후)
→ 필수 문서 누락 경고는 do/qa 미작성 건 (이번 단계에서 do 생성)
```

### 단위 테스트

```
node --test tests/doc-validator-scope.test.js
# tests 7, pass 7, fail 0 ✅
```

### 전체 regression

```
node --test tests/doc-validator-scope.test.js tests/doc-validator-subdoc.test.js tests/clevel-coexistence.test.js
# tests 36, pass 36, fail 0 ✅
```

### 기존 피처 역호환

기존 repo 의 피처 문서들 (`docs/clevel-doc-coexistence/` 등) 은 이 피처 이전 작성분. W-SCOPE 경고가 severity=warn 이라 exit 0 유지. 마이그레이션 불필요. 2주 유예 후 강화 재검토.

## 미완료 항목 (다음 세션 인계)

- [ ] QA phase (`/vais cto qa plan-scope-contract`) — 회귀 테스트 + gap 분석
- [ ] Report phase — SC-01 초기 관측 (2주 누적 이후로 실제 측정은 지연)
- [ ] **event-log 자동 발화 훅** 은 별도 피처 (`plan-scope-observability`) 로 분기하여 별도 ideation → plan 진입 필요

## 발견한 기술 부채

| 우선순위 | 부채 | 비고 |
|:------:|-----|------|
| Medium | `templates/plan.template.md` 의 `## Context Anchor > SCOPE` 항목과 신규 `## Out-of-scope` 섹션 **중복 표현** | 사용자 중복 기입 부담 가능 — 2주 관찰 후 Context Anchor SCOPE 제거 여부 결정 |
| Low | F4 (공통 헤더 승격) 는 `lib/templates.js` include 메커니즘 부재로 구현 안 함 | 별도 피처 `template-include-mechanism` 으로 분기 |
| Low | W-SCOPE regex 가 H2 만 매치 — 일부 작성자가 H3 로 작성 시 false negative 가능 | 현재는 교육/문서로 대응, 필요 시 정규식 완화 검토 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-23 | 초기 작성 — Do Step 1~7 완료, test 7/7 PASS, validator dog-fooding 통과 |
