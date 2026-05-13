---
owner: cto
artifact: recommendations-fix-log
phase: do
feature: workflow-contract-alignment
generated: 2026-05-14
source: docs/workflow-contract-alignment/04-qa/cross-review-by-claude.md §6 권고 1+2
summary: "cross-review-by-claude 의 후속 권고 2 항 (W-SCOPE 정합 + mandatoryPhases retroactive backward-compat) 통합 해소. 5 피처 모두 doc-validator PASS, npm test 293 무회귀, lint clean."
---

# Recommendations Fix Log — 권고 1+2 통합 해소

## 0. 배경

`04-qa/cross-review-by-claude.md` §6 에서 Claude 가 3rd-reviewer 로 코덱스 작업을 검증할 때 발견한 **2 minor 후속 권고**. 사용자 명령 "권고 1, 2 모두 해소하자" 에 따라 본 patch 로 통합 처리. v0.66.2 hotfix 분리 release 의도 X — 본 workflow-contract-alignment 작업의 추가 patch 로 흡수.

## 1. 권고 1 — doc-validator W-SCOPE 와 5섹션 index 정책 정합

### 1.1 진단

- 현 정책: `clevel-main-guard.full.md` v2.2 / `workflow-contract-matrix.md` §8 → main.md = 5섹션 인덱스만, body content 는 별도 artifact MD.
- 충돌: `scripts/doc-validator.js` 의 `validateScopeContract` 는 `01-plan/main.md` 에서 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 강제 → 5섹션 index 정책 위반 유도.
- 부수 버그: regex 에 `\b` (word boundary) 사용 → 한글 끝 글자 `요청 원문` 의 `문` 다음에 word-boundary 가 false 가 되어 매치 실패. workflow-contract-alignment 자체 plan/main.md 가 `## 요청 원문` 명확히 있음에도 W-SCOPE-01 발화하던 원인.

### 1.2 적용 fix (`scripts/doc-validator.js` `validateScopeContract` 함수)

| 변경 | 효과 |
|------|------|
| (a) main.md 외 `01-plan/*.md` 모두 fallback 검사 | tech-plan.md / plan-rationale.md 등 plan body artifact 에 헤더 있으면 PASS — 5섹션 index 정책 정합 |
| (b) regex `\b` 제거 + numeric prefix (`## 0. `) 허용 (`/^##\s+(?:\d+\.\s*)?요청 원문/m`) | 한글 매치 버그 봉합 + `## 0. 요청 원문 (synthesis 인용)` 같은 prefix/suffix 모두 매치. 정책 의도 = "원문 인용 / scope 명시 있어야" 이지 정확 H2 텍스트 강제 X |

### 1.3 검증

- workflow-contract-alignment: W-SCOPE 0 (이전: W-SCOPE-01 발화) ✅
- v0-66-1-hotfix-alignment: W-SCOPE 0 (tech-plan.md 의 `## 0. 요청 원문 (synthesis 인용)` 매치) ✅
- vais-positioning-rethink: plan-rationale.md 에 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 3 stub append → W-SCOPE 0 ✅

## 2. 권고 2 — mandatoryPhases `report` 추가의 retroactive 부작용

### 2.1 진단

- 정책 변경: `vais.config.json.workflow.mandatoryPhases` 에 `report` 추가 (final-validation §2).
- 부작용: 이전 박제 4 피처가 모두 `passed: false` (`report` missing).
  - `clevel-doc-coexistence`: 5 phase 폴더만 있고 .md 0 — historical empty
  - `multimodel-repo-analysis`: ideation-only 분석 인덱스, plan~report 없음
  - `vais-positioning-rethink`: v0.66.0 GA 끝났지만 report main.md 미박제
  - `v0-66-1-hotfix-alignment`: design + report 의도 생략 (hotfix 규모상)

### 2.2 적용 fix — 2 단 접근

**(A) validator 자동 인식 추가 — `validateDocs` 함수**

| 신규 분기 | 조건 | 동작 |
|----------|------|------|
| **empty-feature skip** | `docs/{feature}/` 폴더에 어떤 .md 도 없음 | mandatoryPhases 검사 skip + warn "empty feature folder — historical/empty" |
| **ideation-only skip** | `00-ideation/main.md` 만 존재 + mandatory phase 모두 없음 | mandatoryPhases 검사 skip + warn "ideation-only feature" |

**(B) 본격 박제 피처는 retroactive stub backfill**

| 피처 | 박제 | 사유 |
|------|------|------|
| `vais-positioning-rethink` | `05-report/main.md` (5섹션 index, retrospect 본문은 CHANGELOG + sprint-final-qa 가 대체 명시) | v0.66.0 GA 완료된 피처 — report 명목 기록 정합 |
| `v0-66-1-hotfix-alignment` | `02-design/main.md` + `05-report/main.md` (5섹션 index, design/report 의도 생략 정당성 명시) | hotfix 규모상 design/report 의도 생략 → mandatory 명목 충족 + 사유 명시 |

### 2.3 검증

| 피처 | 결과 |
|------|:----:|
| `vais-positioning-rethink` | passed=true, 0 warnings ✅ |
| `v0-66-1-hotfix-alignment` | passed=true, 0 warnings ✅ |
| `multimodel-repo-analysis` | passed=true (ideation-only skip warn) ✅ |
| `clevel-doc-coexistence` | passed=true (empty-folder skip warn) ✅ |
| `workflow-contract-alignment` | passed=true, 0 warnings ✅ |

## 3. 무회귀 검증

| 명령 | 결과 |
|------|:----:|
| `npm test` | 293 / 290 pass / 3 skipped / 0 fail ✅ |
| `npm run lint` | clean ✅ |
| `node scripts/vais-validate-plugin.js .` | 0 errors / 0 warnings ✅ |

## 4. 변경 surface

| 파일 | 변경 |
|------|------|
| `scripts/doc-validator.js` | `validateDocs` 에 empty-feature + ideation-only 자동 인식 (재귀 walk). `validateScopeContract` 에 plan body artifact fallback 검사 + regex 완화 (numeric prefix 허용 + `\b` 제거 한글 매치 버그 봉합) |
| `docs/v0-66-1-hotfix-alignment/02-design/main.md` (신규) | design 의도 생략 정당성 stub (5섹션 index) |
| `docs/v0-66-1-hotfix-alignment/05-report/main.md` (신규) | hotfix release 완료 명목 기록 stub (5섹션 index) |
| `docs/vais-positioning-rethink/05-report/main.md` (신규) | v0.66.0 GA 명목 기록 stub (5섹션 index) |
| `docs/vais-positioning-rethink/01-plan/plan-rationale.md` | 상단에 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 3 섹션 append (workflow-contract-alignment 정렬 시점 retroactive backfill 명시) |

## 5. 작업 시간

| 단계 | 추정 | 실측 |
|------|-----:|-----:|
| doc-validator 수정 + regex 버그 봉합 | 25 분 | ~15 분 |
| 3 stub 박제 + plan-rationale append | 15 분 | ~10 분 |
| 재검증 (5 피처 + npm test + lint) | 5 분 | ~3 분 |
| fix-log 박제 | 10 분 | ~10 분 |
| **총** | **55 분** | **~38 분** (-31%) |

## 6. Cross-Review 검증 vs Fix 결과

cross-review §6 권고 2 항이 모두 closed:

- ✅ **권고 1** (W-SCOPE 정합) — validator regex/fallback 정합 + plan body artifact 인식
- ✅ **권고 2** (mandatoryPhases retroactive) — validator empty/ideation-only skip + 2 피처 retroactive backfill

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-14 | 초기 작성 — cross-review 권고 1+2 통합 해소 + 5 피처 모두 PASS + npm test 무회귀 |
