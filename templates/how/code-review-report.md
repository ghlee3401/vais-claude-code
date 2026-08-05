---
artifact: code-review-report
owner_agent: code-reviewer
phase: how
canon_source: "Robert Martin 'Clean Code' (2008), Prentice Hall + Martin Fowler 'Refactoring' (2018, 2nd ed.), Addison-Wesley + Google Engineering Practices: Code Review (google.github.io/eng-practices/review)"
execution:
  policy: always
  intent: code-quality-review
  prereq: [api-implementation]
  required_after: []
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — CTO QA 통과 후 독립 code review. 시각 fresh 한 reviewer 가 readability + maintainability + 잠재 버그 평가. CSO Gate C 의 핵심 산출물."
---

# Code Review Report

> **canon**: Robert Martin *Clean Code* (2008) — function/class/comment 표준. Fowler *Refactoring* (2018) — 60+ refactoring patterns + code smells. Google Engineering Practices: Code Review — large-scale review 표준.
>
> **목적**: CTO QA 통과 후 fresh perspective 의 독립 review. 4 axis (Correctness / Clarity / Consistency / Performance) 평가.

---

## 1. Review Metadata

| 항목 | 내용 |
|------|------|
| **PR / Commit** | (URL or SHA) |
| **Author** | ... |
| **Reviewer** | ... |
| **LOC Changed** | (added / deleted) |
| **Files** | (count) |
| **Review Date** | YYYY-MM-DD |
| **Risk Level** | Low / Med / High |

## 2. Four Axis Evaluation

### 2.1 Correctness (정확성)

| 항목 | 평가 |
|------|:----:|
| Logic 정확성 (intent vs implementation) | ☐ |
| Edge case 처리 (null / empty / boundary) | ☐ |
| Error handling (exception / retry / fallback) | ☐ |
| Concurrency safety (race / deadlock) | ☐ |
| **테스트 cover** (unit / integration) | ☐ |

### 2.2 Clarity (명확성)

| 항목 | 평가 |
|------|:----:|
| 함수/변수 naming (intent 표현) | ☐ |
| 함수 길이 (Martin: 20 라인 이하) | ☐ |
| 복잡도 (Cyclomatic < 10) | ☐ |
| Magic number 부재 (named constant) | ☐ |
| **주석은 WHY 만** (WHAT 아님) | ☐ |

### 2.3 Consistency (일관성)

| 항목 | 평가 |
|------|:----:|
| 기존 코드베이스 패턴 준수 | ☐ |
| Lint rule 통과 | ☐ |
| 명명 컨벤션 (camelCase / kebab-case / snake_case) | ☐ |
| Folder 구조 / 파일 분리 표준 | ☐ |

### 2.4 Performance (성능)

| 항목 | 평가 |
|------|:----:|
| N+1 query 부재 (eager load 적정) | ☐ |
| Memory leak 가능성 | ☐ |
| Hot path 최적화 (caching / batching) | ☐ |
| **measure first** (premature optimization 회피) | ☐ |

## 3. Code Smells (Fowler 22 항목 중 핵심)

| Smell | Detected | Refactoring 권고 |
|-------|:--------:|-----------------|
| Long Method (> 20 line) | ☐ | Extract Method |
| Large Class (> 500 line) | ☐ | Extract Class |
| Long Parameter List (> 4) | ☐ | Introduce Parameter Object |
| Duplicated Code | ☐ | Extract Method / Pull Up |
| Feature Envy (다른 class 의 데이터 과도 사용) | ☐ | Move Method |
| Data Clumps (반복되는 group) | ☐ | Extract Class |
| Primitive Obsession (string/int 남발) | ☐ | Replace with Value Object |
| Switch Statements (반복 type check) | ☐ | Replace with Polymorphism |
| Comments (WHAT 설명) | ☐ | Extract Method (self-documenting) |

## 4. Findings + Recommendations

| ID | Severity | File:Line | Issue | Recommendation |
|:--:|:--------:|----------|------|----------------|
| C-001 | Major | ... | ... | ... |
| C-002 | Minor | ... | ... | ... |
| C-003 | Nit | ... | ... | (suggestion only) |

**Severity**:
- **Blocker**: merge 차단 (correctness / security)
- **Major**: merge 전 수정 권장 (clarity / consistency 큰 이슈)
- **Minor**: backlog (smell / 단순 개선)
- **Nit** (nitpick): suggestion only (style preference)

## 5. Approval Status

- [ ] **Approve** (모든 finding Minor 이하)
- [ ] **Approve with Comments** (Minor 만)
- [ ] **Request Changes** (Major / Blocker 존재)
- [ ] **Comment Only** (LGTM 신호 X)

---

## (작성된 sample)

### Code Review: Sprint 1~3 lib/project-profile.js (590 LOC)

| 항목 | 내용 |
|------|------|
| PR | (Sprint 1~3 commit `d75cd26`) |
| Author | backend-engineer (CTO 위임) |
| Reviewer | code-reviewer (CSO Gate C) |
| LOC | +590 / -0 |
| Files | 1 |
| Review Date | 2026-04-25 |
| Risk Level | High (security + 보안 critical 영역) |

### Correctness ✅

- ✅ scope_conditions 평가 5 연산자 (IN / NOT_IN / == / != / >=) 모두 단위 테스트 통과
- ✅ TARGET_SCALE_RANK 순서 정렬 — 통합 테스트 검증
- ✅ secret pattern 차단 — T-06 (Sprint 1~3) 통과
- ✅ path traversal 차단 — T-04 통과
- ✅ FAILSAFE_SCHEMA — code execution 차단

### Clarity ✅

- ✅ 8 functions — 각 명확한 책임 (loadProfile / validateProfile / evaluateScopeConditions / etc.)
- ✅ JSDoc 모든 export function 에 명시
- ✅ Magic number 부재 (TARGET_SCALE_RANK 같이 named map)
- ⚠ Minor: `evaluateScopeConditions` 함수 ~80 라인 — Extract Method 권고 (5 연산자 별도 함수)

### Consistency ✅

- ✅ 기존 lib/* 패턴 준수 (CJS / module.exports)
- ✅ ESLint --max-warnings=0 통과
- ✅ camelCase 일관

### Performance ✅

- ✅ scope_conditions 평가는 dict lookup — O(n) acceptable (n ~ 12 변수)
- ✅ profile.yaml 캐싱 (`loadProfile` 가 매번 read X — 단일 호출 후 cache)
- ⚠ Minor: catalog.json 매번 JSON.parse — 큰 catalog 시 cache 권장 (현재 18 artifacts 라 OK)

### Code Smells

- ✅ Long Method 부재 (모든 함수 < 50 line)
- ✅ Duplicated Code 부재
- ⚠ Minor: Primitive Obsession — Profile field 가 string 으로 표현 (PROFILE_TYPE enum 도입 가능)

### Findings

| ID | Severity | File:Line | Issue | Recommendation |
|:--:|:--------:|----------|------|----------------|
| C-PP1 | Minor | lib/project-profile.js:~200 | evaluateScopeConditions 함수 80+ 라인 | Extract Method (5 연산자 별도) |
| C-PP2 | Minor | lib/project-profile.js | Profile field primitive obsession | (Optional) enum 도입 — H2 |

### Approval Status

✅ **Approve with Comments** — Minor 2 건만, Sprint 11~14 backlog 추가 가능.

---

## 작성 체크리스트

- [ ] Review Metadata (PR / Author / Reviewer / LOC / Files / Date / Risk Level) 모두 명시?
- [ ] **Four Axis** (Correctness / Clarity / Consistency / Performance) 모두 평가?
- [ ] **Code Smells** (Fowler 9+ 항목) 검토?
- [ ] Findings 의 **Severity (Blocker/Major/Minor/Nit)** + File:Line + Recommendation 명시?
- [ ] **Approval Status** 명확 (Approve / Approve with Comments / Request Changes / Comment Only)?
- [ ] **Tests cover** 평가 — 신규 코드의 unit/integration test 존재?
- [ ] 대규모 변경 (>500 LOC) 시 별도 design review 포함?
- [ ] post-merge 후 **rollout monitoring** 일정?

---

## ⚠ Anti-pattern (Google + Martin + Fowler 명시)

- **Nitpick 만**: style 만 review + correctness 무시 — 가치 낮음. **Nit 은 마지막**, Correctness 가 우선.
- **LGTM without review**: "looks good" 만 — 실질 검토 부재. Google 명시: review 가 author 보다 critical.
- **Personal style**: "내 스타일은 X" — codebase 일관성이 개인 선호 우선.
- **Severity 부재**: "fix this" 만 적고 Blocker / Minor 분류 X — author 가 우선순위 모름.
- **공감 부재**: "이건 이상해" 부정적 톤 — collaboration 손상. Google: feedback 은 **건설적 + 구체적**.
- **Test 무시**: 코드만 보고 test 안 봄 — 실제 cover 율 미평가.
- **Big PR**: > 500 LOC — review 품질 폭망. **분할 PR** 권장 (Google: < 200 LOC ideal).

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Martin Clean Code + Fowler Refactoring + Google Code Review 정전. Review Metadata + Four Axis + Code Smells (Fowler 9+) + Findings + Approval + sample (VAIS Sprint 1~3 lib/project-profile.js review) + checklist 8 + anti-pattern 7 |
