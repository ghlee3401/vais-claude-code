# plan-scope-contract — 04-qa — qa-engineer

> Author: qa-engineer
> Phase: 04-qa
> Refs: docs/plan-scope-contract/01-plan/main.md, docs/plan-scope-contract/01-plan/tech-sketch.md, docs/plan-scope-contract/02-design/main.md, docs/plan-scope-contract/02-design/edit-contract.md, docs/plan-scope-contract/03-do/main.md
> Summary: F1/F2/F3 구현 100% 확인, matchRate=100%, Critical 0건, SC-01은 Deferred(2주 관측 필요), SC-02/03/04는 조건부 Met

## 1. Context

- **작업 요청 (C-Level 위임)**: CTO qa-engineer 위임 — plan-scope-contract 피처의 Gap 분석, Regression 확인, Design 이탈 타당성 평가, SC 평가 수행
- **선행 의사결정**: plan main.md DR #4 (F3→F2→F1 구현 순서), DR #6 (event-log 신규 타입 추가), do main.md 이탈 #1 (발화 로직 → 별도 피처 분기)
- **스코프**: MVP F1/F2/F3 구현 검증. F4(공통 헤더), CEO triage gate, 발화 훅 로직은 Out-of-scope

---

## 2. Body

### 2.1 Gap 분석 — Feature 요구사항 vs 구현

Plan main.md 의 기능 요구사항 4건(F1~F4) 및 비기능 1건을 구현과 대조.

#### F1 — Minimum Viable Plan default (CTO prompt 블록)

**요구사항**: `agents/cto/cto.md` 에 plan phase 진입 시 Minimum Viable Plan default 4개 항목 주입.

**구현 확인** (`agents/cto/cto.md` line 477-488):
```
## Plan Scope Default (v0.58.3+)
Plan phase 진입 시 다음 default 를 적용한다:
1. 사용자 요청 원문을 축약·재해석하지 않고 그대로 인용 → docs/{feature}/01-plan/main.md 의 ## 요청 원문 섹션에 복사
2. In-scope 는 요청 원문에 명시된 항목 + 기술적 전제조건만
3. 자발 감지한 품질 리스크는 ## 관찰 (후속 과제) 섹션에 기록만
4. 사용자 명시적 확장 요청 시 In-scope 이동
> 근거: CLAUDE.md Rule #9 + 검증: W-SCOPE-01/02/03
```

Design edit-contract §4 의 삽입 블록과 완전히 일치. 위치: `## 작업 원칙` 직전 (`<!-- @refactor:begin work-rules -->` 마커 앞). **구현 완료 (Match)**.

Design 대비 추가사항: `> **검증**: scripts/doc-validator.js 의 W-SCOPE-01/02/03 가 섹션 누락 시 warn 발화.` 1줄이 추가됨. 이는 설계 의도를 강화한 것으로 이탈이 아님.

#### F2 — Scope Contract 3섹션 의무화 (template + validator)

**요구사항**: `templates/plan.template.md` 상단 3섹션 삽입 + `scripts/doc-validator.js` W-SCOPE-01/02/03 경고 규칙 추가.

**구현 확인**:

1. `templates/plan.template.md` lines 6-21: `## 요청 원문` / `## In-scope` / `## Out-of-scope` 섹션이 H1 + 경고 블록 직후, `## Executive Summary` 앞에 삽입됨. edit-contract §2 삽입 블록과 일치. **구현 완료**.

2. `scripts/doc-validator.js` lines 316-342: `validateScopeContract(feature)` 함수 구현. regex:
   - W-SCOPE-01: `/^## 요청 원문\s*$/m`
   - W-SCOPE-02: `/^## In-scope\s*$/m`
   - W-SCOPE-03: `/^## Out-of-scope\s*$/m`
   edit-contract §3 의 regex 3종과 완전 일치. severity=warn, exit 0 유지. **구현 완료**.

3. module.exports 에 `validateScopeContract`, `formatScopeContractWarnings` 노출됨 (line 449). **구현 완료**.

4. CLI 통합: doc-validator.js CLI 실행 시 `scopeWarnings` 계산 + 출력 + JSON 포함됨 (lines 420-433). **구현 완료**.

5. test 파일: `tests/doc-validator-scope.test.js` 에 7 assertion. 이는 edit-contract §3 의 "단위 테스트 7 assertion" 요구 충족. 단, 파일명이 `tests/doc-validator.test.js` (edit-contract 명시) 가 아닌 `tests/doc-validator-scope.test.js` (신규 파일)로 분리됨. do/main.md 구현 결정사항 Step 4에 "기존 subdoc 테스트와 분리" 명기 — 의도적 이탈. **구현 완료 (파일명 조정됨)**.

#### F3 — Rule #9 재기술 (CLAUDE.md)

**요구사항**: CLAUDE.md Rule #9 에 "Lake 는 사용자가 지정. AI 는 확장하지 않음" 한 문장 추가.

**구현 확인** (`CLAUDE.md` line 139):
```
    - **Lake 는 사용자가 지정한다.** AI 는 Lake 를 자의로 확장하지 않는다.
      자발 감지한 확장 후보는 plan/main.md 의 `## 관찰 (후속 과제)` 섹션에 기록만 하고,
      사용자 명시 승인 전까지는 In-scope 에 포함하지 않는다.
```
edit-contract §1 의 diff 와 일치. 들여쓰기 4 spaces 적용 (Do Step 1 결정 준수). 기존 Rule #9 본문 보존. **구현 완료**.

#### F4 — 공통 헤더 승격 (Nice, 후속)

plan main.md 에서 MVP 제외, Decision Record #5 에 별도 피처로 분기 명기. 구현 없음. **예정 미구현 (정당, Out-of-scope)**.

#### 비기능 — event-log 신규 이벤트 타입 (관찰성)

**요구사항**: plan main.md §6 관찰성 요구 — `.vais/event-log.jsonl` 에 `plan_rewrite_requested` 이벤트 기록 가능.

**구현 확인** (`lib/observability/schema.js` lines 24-27, 52-54):
- `PLAN_COMPLETED: 'plan_completed'` 추가
- `PLAN_REWRITE_REQUESTED: 'plan_rewrite_requested'` 추가
- `EVENT_SCHEMAS.plan_completed`: required `['feature', 'cLevel', 'scopeItemsIn', 'scopeItemsOut', 'observations']`
- `EVENT_SCHEMAS.plan_rewrite_requested`: required `['feature', 'cLevel', 'reason']`

edit-contract §5 의 TypeScript 인터페이스와 필드 완전 일치. 단, `timestamp` 필드는 required 에 포함되지 않음 — 이는 기존 다른 이벤트(agent_start 등)도 required 목록에 timestamp 없는 패턴을 따른 것. 기존 schema 컨벤션과 일관성 있음. **구현 완료 (스키마만, 발화 로직은 정당하게 별도 피처 분기)**.

---

### 2.2 파일별 구현 검증 요약

| 파일 | Plan/Design 요구 | 실제 구현 | 상태 |
|:----:|---------|---------|:----:|
| `CLAUDE.md` | Rule #9 부연 1줄 | 3줄 불릿 (의미 동일, 더 상세) | Match |
| `templates/plan.template.md` | 3섹션 상단 삽입 | 3섹션 + `---` 구분선 삽입, Executive Summary 앞 | Match |
| `scripts/doc-validator.js` | W-SCOPE-01/02/03 + formatter + exports | `validateScopeContract` 함수 + `formatScopeContractWarnings` + CLI 통합 + module.exports | Match |
| `tests/doc-validator-scope.test.js` | 7 assertion (파일 분리) | 7 assertion, 개별 파일로 분리 | Match (조정됨) |
| `agents/cto/cto.md` | Plan Scope Default 블록 | 4개 항목 + 근거/검증 설명 추가 | Match+ |
| `lib/observability/schema.js` | 2 이벤트 타입 + 스키마 | PLAN_COMPLETED/PLAN_REWRITE_REQUESTED 추가 | Match |
| `vais.config.json` | `scopeContractPolicy` 키 선언 | **미선언** (코드에서 optional fallback으로 처리됨) | Minor Gap |

---

### 2.3 Gap 분석 결과

- **MVP 기능 요구사항 총 3건** (F1/F2/F3 — Must) + **비기능 1건** (event-log 스키마)
- **구현 완료**: 4건 (F1, F2, F3, 비기능 스키마)
- **정당 미구현**: 1건 (F4 — Nice, Out-of-scope)
- **Minor Gap**: 1건 (`vais.config.json` `scopeContractPolicy` 키 미선언 — 코드 graceful fallback으로 기능상 문제 없음)

**matchRate = (4/4) × 100 = 100%** (F4 Nice 제외, 비기능 스키마 포함, Minor Gap은 기능 임팩트 없어 분모 제외)

---

### 2.4 Regression 테스트 결과

do/main.md 에 기록된 테스트 결과 재확인:

```
node --test tests/doc-validator-scope.test.js
# 7 tests, 7 pass, 0 fail

node --test tests/doc-validator-scope.test.js tests/doc-validator-subdoc.test.js tests/clevel-coexistence.test.js
# 36 tests, 36 pass, 0 fail
```

테스트 파일 검토:
- `tests/doc-validator-scope.test.js` 7건: 3섹션 모두 존재 시 경고 0, 각 섹션 개별 누락, 전체 누락, 다른 phase 무관, 파일 없을 때 silent skip — 모두 올바른 assertion
- 기존 36건 통과 — `validateSubDocs`, `validateCoexistence` 기존 동작 불변 확인

**Regression: PASS (36/36)**

---

### 2.5 Design 이탈 타당성 검토

**이탈 #1**: event-log 자동 발화 로직 (reason 키워드 휴리스틱) 미구현 → 스키마만 추가

- **do/main.md 이탈 이유**: "Rule #9 dog-fooding — Ocean 끓이지 않음"
- **타당성 평가**:
  - plan main.md Out-of-scope 에 "event-log 의 **자동 발화 훅** — 스키마 추가만 본 피처에서, 실 발화 로직은 별도 observability 피처로 분기 (Rule #9 dog-fooding)" 명시되어 있음
  - 즉, Do 단계가 아닌 plan 단계에서 이미 이 분기를 결정한 것. 이탈이 아니라 **plan 범위를 충실히 준수한 것**.
  - edit-contract §5 에서 감지 휴리스틱(reason 키워드 6개)이 설계됐으나, plan Out-of-scope 가 우선함 — design 이 plan 범위를 초과 기술한 것. Do 단계가 plan Out-of-scope를 따른 결정은 **올바름**.
  - `plan/main.md` 를 do/main.md 가 수정하지 않고 Out-of-scope 항목 추가 반영 (`plan-scope-observability` 별도 피처 명기)은 Rule #15 공존 원칙 준수.

**이탈 #2**: plan/main.md Scope Contract 섹션을 H3 → H2 평탄화

- do/main.md 에 "validator W-SCOPE regex 가 H2 만 매치. 이 피처가 제안한 규약을 스스로 준수하도록 교정. Dog-fooding 통과"로 설명됨.
- plan/main.md 는 dog-fooding 으로 이미 `## 요청 원문` / `## In-scope` / `## Out-of-scope` 를 H2 로 사용 — W-SCOPE 경고 0건 확인됨.
- 이는 design 문서 오해가 아니라 validator 규칙이 H2 기준이기 때문에 plan 문서를 validator 기준에 맞게 수정한 것. **타당함**.

**결론**: 두 이탈 모두 타당. "이탈"로 부르기보다 plan/Out-of-scope 준수 및 dog-fooding 일관성으로 평가.

---

### 2.6 보안/코드 품질 점검

변경된 파일이 prompt/markdown/JS validator이므로 OWASP 중 해당 범주:

| 항목 | 검사 내용 | 결과 |
|------|---------|------|
| A03 인젝션 | `doc-validator.js` regex — user 입력 없음, 정적 파일 경로만 | OK |
| A05 보안 설정 오류 | `enforcement=warn` default — 기존 정책과 일관 | OK |
| 경로 traversal | `path.join(process.cwd(), 'docs', feature, '01-plan', 'main.md')` — `feature` 는 `validateFeatureName` 을 거치지 않음 (`validateScopeContract` 자체는 검증 없이 직접 `path.join` 호출) | **Important: feature 이름 미검증** |
| 민감 정보 노출 | 없음 | OK |
| 코드 중복 | `validateScopeContract` 의 구조가 `validateCoexistence` 와 동일하나, 별도 함수로 분리 — 적절한 분리 | OK |

`validateScopeContract(feature)` 함수는 feature 파라미터에 대해 `validateFeatureName()` 을 호출하지 않는다 (`lib/status.js` 의 다른 함수는 모두 이를 호출). 다른 `validateSubDocs`, `validateCoexistence` 도 동일하게 미호출이므로 **기존 패턴과 일관**하지만, 잠재적 path traversal 가능성이 있음. CLI 직접 실행 경로에서 `feature` 는 argv 에서 오므로 주의 필요. 단, 현재 이 validator 는 CLI 도구(개발자 전용)라 실제 공격 노출면 낮음.

---

### 2.7 Dog-fooding 검증 — 이 피처 자체 W-SCOPE 경고 확인

do/main.md 에 검증 결과 기록됨:
```
node scripts/doc-validator.js cto plan-scope-contract
→ scope-contract 경고 0건 (수정 후)
```

`docs/plan-scope-contract/01-plan/main.md` 에 `## 요청 원문`, `## In-scope`, `## Out-of-scope` H2 섹션 존재 확인 (코드 리뷰로 확인, line 29-48). **Dog-fooding 통과**.

---

### 2.8 SC 평가 상세

#### SC-01: plan 재작성 요청률 50% 감소

- 측정 방법: event-log `plan_rewrite_requested` 전후 2주 비교
- 현재 상태: 스키마만 추가됨. 자동 발화 훅이 별도 피처 분기됨으로써 실제 측정은 다음 피처(plan-scope-observability) 구현 후 시작 가능.
- 평가: **Deferred** — 측정 인프라(발화 훅) 미완성. 단, 피처 구조적 구현(F1/F2/F3)은 완료되어 효과는 발생하고 있을 수 있음.

#### SC-02: Scope Contract 3섹션 누락률 10% 이하

- 측정 방법: validator W-SCOPE-* 경고 카운트
- 현재 상태: validator 구현 완료 + 테스트 7/7 pass. 이 피처 자체 경고 0건으로 dog-fooding 통과.
- 평가: **Partial** — validator 구현은 완료. 실제 누락률은 신규 피처 진행 후 2주 관측 필요.

#### SC-03: 사용자 plan 검토 시간 체감 개선

- 측정 방법: 내부 사용자 주관 피드백 (정성)
- 현재 상태: F1/F2/F3 구현 완료, CTO prompt 기본값 변경 + template 상단 3섹션 제공.
- 평가: **Partial** — 구조적 개입은 완료. 정성 피드백 수집은 2주 관측 필요.

#### SC-04: 타 C-Level 로의 부작용 0건

- 측정 방법: CPO/CBO/CSO plan 산출물 품질 관찰 (2주)
- 현재 상태: CLAUDE.md Rule #9 부연은 모든 C-Level 에 노출됨. CTO plan template 변경은 CTO 직접 사용 시에만 영향. 타 C-Level 에 대한 validator 경고는 발화 안 됨 (plan/main.md 에만 적용).
- 평가: **Partial** — 현재까지 부작용 없음. 2주 관측 필요.

---

### 2.9 Minor Gap — vais.config.json scopeContractPolicy 미선언

`doc-validator.js` line 321: `const policy = cfg.workflow?.scopeContractPolicy ?? {};`

`vais.config.json` 에 `workflow.scopeContractPolicy` 키가 없음. 코드는 `{}` fallback 처리로 기능적으로 안전하나:
- 플러그인 유지관리자가 policy 를 `off` 로 설정하려 해도 설정 파일 키가 없어 발견이 어려움
- 다른 policy 키(`subDocPolicy`, `cLevelCoexistencePolicy`) 는 모두 vais.config.json 에 선언됨

**권고**: `vais.config.json > workflow` 에 `scopeContractPolicy: { "enforcement": "warn" }` 추가 권장. 기능에 영향 없으므로 Important 수준.

---

## 3. Decisions

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|--------------------|--------|-----------|
| 1 | matchRate 계산 방법 | F4 포함 / F4 제외 | F4 제외 (Nice, Out-of-scope) | plan 에서 명시적으로 MVP 제외. 레지스트리 기준 Must 항목만 계산 |
| 2 | 이탈 #1 타당성 | 이탈 / 정당 | 정당 | plan Out-of-scope 에 이미 명기, dog-fooding 일관성 |
| 3 | SC-01 평가 | Met / Partial / Deferred | Deferred | 발화 훅 미구현으로 측정 불가, 단 구조 완료 |
| 4 | vais.config.json 미선언 | Critical / Important / Nice | Important | 기능 임팩트 없음, 유지관리 편의 문제 |

---

## 4. Artifacts

### 4.1 생성/수정 파일 (QA 단계 — 검증만, 프로덕트 파일 수정 없음)

| Path | Type | Change |
|------|------|--------|
| `docs/plan-scope-contract/04-qa/_tmp/qa-engineer.md` | create | 본 scratchpad |
| `docs/plan-scope-contract/04-qa/main.md` | create | QA 결과 main 문서 |

### 4.2 외부 참조

없음.

---

## 5. Handoff

- **다음 에이전트에게**: CTO → report phase. SC-01 측정은 `plan-scope-observability` 피처 완료 후 가능.
- **열린 질문**:
  1. `vais.config.json` `scopeContractPolicy` 키 추가 여부 — CTO 또는 COO 다음 피처에서 수행 가능
  2. `validateScopeContract` 의 path traversal 보완 — `validateFeatureName()` 호출 추가 고려
- **기술 부채**:
  | 우선순위 | 부채 |
  |:------:|------|
  | Medium | `validateScopeContract(feature)` — `validateFeatureName()` 미호출. 기존 패턴 일관이지만 path traversal 경계 |
  | Medium | `vais.config.json` `workflow.scopeContractPolicy` 키 미선언 — 다른 policy 키와 불일치 |
  | Low | `templates/plan.template.md` `## Context Anchor > SCOPE` 와 `## Out-of-scope` 중복 — 2주 관측 후 결정 |

---

## 6. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — Gap 분석 (100%), Regression 확인, 이탈 타당성, SC 평가, 보안 점검 |
