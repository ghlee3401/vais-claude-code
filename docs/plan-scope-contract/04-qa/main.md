# plan-scope-contract - QA 분석

> 참조: `../01-plan/main.md` + `../02-design/edit-contract.md` + `../03-do/main.md`
> Phase: QA (qa-engineer)
> <!-- size budget: main.md ≤ 200 lines -->

## 요청 원문 (Plan 승계)

> plan 재작업 사이클 감소 — F1(CTO prompt default) + F2(plan template 3섹션 + validator) + F3(Rule #9 재기술) + event-log 스키마 추가

## In-scope

- F1/F2/F3 MVP 구현 검증 (Gap 분석 + regression)
- Design 이탈 타당성 평가
- SC-01~SC-04 달성도 평가
- Dog-fooding 확인 (이 피처 자체 W-SCOPE 경고 0건)

## Out-of-scope

- F4 공통 헤더 승격 검증 (plan Out-of-scope, 별도 피처)
- event-log 발화 로직 검증 (별도 `plan-scope-observability` 피처)
- 2주 관측 지표 확정 (SC-01 정량 측정 deferred)

---

## Executive Summary

| 항목 | 값 |
|------|-----|
| 검토 파일 | 6개 (CLAUDE.md, plan.template.md, doc-validator.js, doc-validator-scope.test.js, cto.md, lib/observability/schema.js) |
| 발견 이슈 | 2건 (Critical: 0, Important: 1, Nice: 1) |
| Gap 일치율 (matchRate) | **100%** |
| Regression | **36/36 PASS** |
| Dog-fooding | **W-SCOPE 경고 0건** |

---

## Context Anchor (Plan 승계)

| Key | Value |
|-----|-------|
| **WHY** | plan time scope creep → 재작업 사이클 감소 |
| **WHO** | VAIS 플러그인 내부 사용자 |
| **RISK** | vais.config.json 미선언, validateScopeContract path traversal 미검증 |
| **SUCCESS** | F1/F2/F3 구현 완료, matchRate ≥ 90, Critical 0 |
| **SCOPE** | MVP F1~F3 + 스키마. F4/발화 훅 Out-of-scope |

---

## [CTO] QA 결과

### 종합 일치율

```
matchRate = 100%
Critical: 0
Important: 1
Nice: 1
```

### 검증 축 표

| 축 | 상태 | 근거 |
|----|:----:|------|
| 구조 (파일 존재/위치) | ✅ | 6개 파일 모두 정확한 위치에 변경됨 |
| 기능 (F1/F2/F3) | ✅ | 각 기능 edit-contract 대비 100% 구현 |
| Regression | ✅ | 36/36 테스트 PASS |
| 보안 | ⚠️ | validateScopeContract path traversal 미검증 (기존 패턴과 일치, 개발자 도구 범위) |
| Dog-fooding | ✅ | 이 피처 plan/main.md W-SCOPE 경고 0건 |

---

### Critical 이슈 목록

없음.

---

### Important 이슈 목록

1. **[vais.config.json] `workflow.scopeContractPolicy` 키 미선언** (Confidence: 90%)
   - `doc-validator.js` line 321 에서 `cfg.workflow?.scopeContractPolicy ?? {}` 로 읽지만 `vais.config.json` 에 키 없음
   - 기능적 영향 없음 (graceful fallback). 단, 다른 policy (`subDocPolicy`, `cLevelCoexistencePolicy`) 는 모두 선언됨 — 일관성 깨짐
   - 수정 대상: `vais.config.json` → `workflow` 객체에 `"scopeContractPolicy": { "enforcement": "warn" }` 추가
   - return_to: CTO 직접 수정 가능 (1줄 config 추가). 또는 다음 do 재진입 시 처리.

---

### Nice 이슈 목록

1. **[scripts/doc-validator.js:316] `validateScopeContract` — `validateFeatureName()` 미호출** (Confidence: 75%)
   - 기존 `validateSubDocs`, `validateCoexistence` 도 동일 패턴. CLI 도구(개발자 전용)라 실제 노출면 낮음
   - 장기적으로 `if (!validateFeatureName(feature)) return out;` 추가 권장
   - return_to: CTO → backend-engineer (스크립트 유지보수)

---

### Success Criteria 평가

| SC-ID | 기준 | 상태 | 근거 |
|-------|------|:----:|------|
| SC-01 | F1+F2+F3 도입 후 plan 재작성 요청률 50% 감소 | Deferred | event-log 발화 훅 미구현으로 측정 불가. `plan-scope-observability` 피처 완료 후 2주 관측 필요 |
| SC-02 | Scope Contract 3섹션 누락률 10% 이하 | ⚠️ Partial | validator 구현 + 7/7 pass. 신규 피처 축적 후 2주 누락률 집계 필요 |
| SC-03 | 사용자 plan 검토 시간 체감 개선 | ⚠️ Partial | F1/F2/F3 구조 완료. 정성 피드백 수집은 2주 관측 후 |
| SC-04 | 타 C-Level 로의 부작용 0건 | ⚠️ Partial | 현재까지 부작용 없음. CLAUDE.md Rule #9 부연은 전 C-Level 노출. 2주 관측 필요 |

---

### Design 이탈 타당성 평가

| # | 이탈 | 평가 | 근거 |
|:-:|------|:----:|------|
| 1 | event-log 자동 발화 로직 미구현 — 스키마만 추가 | ✅ 정당 | plan Out-of-scope 에 "자동 발화 훅은 별도 observability 피처로 분기" 명시. Rule #9 dog-fooding 일관. |
| 2 | plan/main.md Scope Contract 섹션 H3 → H2 평탄화 | ✅ 정당 | validator W-SCOPE regex 가 H2 만 매치. 이 피처 규약을 스스로 준수하도록 교정. Dog-fooding 통과. |

**결론**: 두 이탈 모두 plan Out-of-scope 준수 및 dog-fooding 일관성에 의거해 타당.

---

### return_to 필드

| 이슈 | 수정 대상 | 수정 에이전트 |
|------|---------|:------------:|
| Important: vais.config.json scopeContractPolicy 미선언 | `vais.config.json` 1줄 추가 | CTO 직접 (또는 다음 do 재진입) |
| Nice: validateScopeContract path traversal | `scripts/doc-validator.js` line 317 | CTO → backend-engineer |

Critical 이슈 없으므로 리포트 단계 직행 가능.

---

## Topic Documents (v0.57+)

> QA phase 는 소규모 피처라 topic 분리 없이 main.md 단일 문서 유지 (200줄 내).

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| (없음) | — | — | — | — |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| qa-engineer | `_tmp/qa-engineer.md` | ~5KB | 2026-04-22 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — qa-engineer: Gap 분석 100%, Regression 36/36, 이탈 2건 타당, Critical 0, Important 1, SC 평가 |
