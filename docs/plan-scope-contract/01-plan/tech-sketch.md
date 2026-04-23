---
owner: cto
topic: tech-sketch
phase: plan
feature: plan-scope-contract
---

# CTO Tech Sketch — plan-scope-contract

> CPO plan(`./main.md`) 의 F1~F4 를 기술 구현 관점에서 상세화. Do 단계 착수 전 참조 문서.

## 1. F1 — Minimum Viable Plan default (CTO prompt)

### 삽입 위치

`agents/cto/cto.md` → `## 작업 원칙` (work-rules 블록) 직전에 신규 섹션 삽입:

```markdown
## Plan Scope Default (v0.58.3+)

Plan phase 진입 시 다음 default 를 적용한다:

1. **사용자 요청 원문을 축약·재해석하지 않고 그대로 인용**하여 plan 맨 앞 `## 요청 원문` 섹션에 복사
2. **In-scope 는 요청 원문에 명시된 항목 + 기술적 전제조건만** 포함. 품질 리스크 자발 감지 항목은 포함 금지
3. 자발 감지한 품질 리스크/개선 기회는 `## 관찰 (후속 과제)` 섹션에 **기록만**. 다음 phase 가 이를 자동 scope 로 승계하지 않음
4. 사용자가 명시적으로 확장을 요청하면 그때 In-scope 이동

**근거 규칙**: CLAUDE.md Rule #9 (Boil the Lake) — Lake 는 사용자가 지정.
```

### 효과 측정 훅

CTO plan phase 완료 시 `.vais/event-log.jsonl` 에 이벤트 기록:

```json
{"type": "plan_completed", "feature": "...", "phase": "plan", "scope_items_in": N, "scope_items_out": M, "observations": K}
```

사용자가 plan 거절 시:

```json
{"type": "plan_rewrite_requested", "feature": "...", "reason": "scope_creep" | "other"}
```

SC-01 검증용 — 전후 2주 `plan_rewrite_requested / plan_completed` 비율 비교.

## 2. F2 — Scope Contract 3섹션 + validator

### 템플릿 변경

`templates/plan.template.md` 의 `## Executive Summary` **앞** 에 신규 블록 삽입:

```markdown
## 요청 원문

> {사용자 요청을 축약 없이 인용. 여러 요청이면 번호 매김.}

## In-scope

- {요청 원문에 명시된 항목}
- {기술적 전제조건 (필요한 인프라·의존성)}

## Out-of-scope

- {의도적으로 제외한 항목 + 이유 1줄}
- {별도 피처 후보로 분기할 항목}

---
```

- 위치: 기존 `# {feature} - 기획서` H1 다음, `## Executive Summary` 앞.
- 기존 `## Context Anchor > SCOPE` 행과 중복되지만, 독립 섹션으로 **시각적 우선순위** 부여.

### Validator 규칙 추가

`scripts/doc-validator.js` 에 신규 경고 3종:

| Code | 조건 | Severity |
|------|------|:--------:|
| `W-SCOPE-01` | plan/main.md 에 `## 요청 원문` H2 부재 | warn |
| `W-SCOPE-02` | plan/main.md 에 `## In-scope` H2 부재 | warn |
| `W-SCOPE-03` | plan/main.md 에 `## Out-of-scope` H2 부재 (단순 `(없음)` 허용) | warn |

**호환성 정책**: 기존 피처의 `01-plan/main.md` 는 경고만 발생시키며 exit code 영향 없음 (`workflow.subDocPolicy.enforcement=warn` 과 동일 톤). 마이그레이션 불필요.

### 구현 단위

- `scripts/doc-validator.js` rule array 에 세 entry 추가 (regex `/^## 요청 원문/m` 등)
- 단위 테스트: `tests/doc-validator.test.js` 에 3섹션 누락/존재 케이스 ×2 + 기존 피처 역호환 케이스 1 = 총 7 assertion
- 문서: `README.md` / `docs/harness-engineering-guide.html` 의 validator 테이블에 3행 추가 (Do phase 작업)

## 3. F3 — Rule #9 재기술 (CLAUDE.md)

### Diff (한 줄 추가)

`CLAUDE.md` → `## Mandatory Rules` → Rule #9 본문 끝에 부연:

```diff
 9. **완전성 원칙 (Boil the Lake)** — 각 C-Level은 담당 범위를 완전하게 수행. "나중에" 미룸 금지. Lake(끓일 수 있는 범위)는 끓이고, Ocean(전체 재작성 등)은 범위 밖으로 표시
+   - **Lake 는 사용자가 지정한다.** AI 는 Lake 를 자의로 확장하지 않는다. 확장 후보는 `## 관찰(후속 과제)` 섹션에 기록만 하고, 사용자 명시 승인 전까지는 In-scope 에 포함하지 않는다.
```

### 파급 범위

- 6 C-Level agent md 가 CLAUDE.md 를 세션 컨텍스트로 읽음 → 모든 agent 에 즉시 영향
- plugin.json / package.json 변경 없음
- 버전 범프 불필요 (문구 추가만) — 단, CHANGELOG 에 기록

## 4. F4 (Nice) — 공통 헤더 승격

### 구조 제안

현재 `templates/plan.template.md`, `design.template.md`, `do.template.md` 에 각자 SCOPE 항목이 파편화되어 있음. F4 는 공통 헤더 파일로 추출:

- 신규 파일: `templates/_shared/scope-contract.template.md` — 3섹션 블록
- 각 phase template 상단에 `<!-- @include: _shared/scope-contract.template.md -->` 마커 삽입
- 템플릿 로더(`lib/templates.js` 등) 가 include 치환

### 판단

F4 는 템플릿 include 메커니즘이 현재 lib 에 없으면 추가 구현 필요 → 난이도 4. F1+F2+F3 의 효과 관찰 후 별도 피처로 분기하는 것이 본 피처 Out-of-scope 방침과 일치. **본 CTO plan 에서는 F4 를 MVP 에서 제외**하고 Nice 로만 기록.

## 5. 구현 순서 (Do phase 계획)

| Step | 작업 | 파일 | 소요 |
|:----:|-----|------|:----:|
| 1 | F3 CLAUDE.md Rule #9 재기술 (가장 저비용, 기반) | `CLAUDE.md` | 2분 |
| 2 | F2 템플릿 편집 | `templates/plan.template.md` | 5분 |
| 3 | F2 validator 규칙 + 테스트 | `scripts/doc-validator.js`, `tests/doc-validator.test.js` | 20분 |
| 4 | F1 CTO prompt 블록 추가 | `agents/cto/cto.md` | 10분 |
| 5 | Event log 훅 (SC-01 측정용) | `lib/events.js` 또는 phase-transition 스크립트 | 15분 |
| 6 | CHANGELOG + 버전 범프 (필요 시) | `CHANGELOG.md`, 7곳 버전 파일 | 10분 |

## 6. 리스크 & 완화

| Risk | Impact | Mitigation |
|------|:------:|-----------|
| 기존 피처 plan/main.md 가 validator 경고로 노이즈 증가 | 중 | severity=warn, exit code 영향 없음. 2주 유예 후 강화 재검토 |
| CTO prompt 길이 증가로 타 지시 약화 | 하 | 섹션 순서상 `## 작업 원칙` 직전 배치하여 상단 규칙 비중 유지 |
| F1 default 가 다른 탐색 지시(예: incident-responder)와 충돌 | 중 | plan phase 한정 문구. design/do/qa 및 incident-responder 는 별도 |
| Event log 스키마 변경으로 기존 훅 영향 | 하 | 신규 이벤트 타입만 추가, 기존 타입 수정 없음 |

## 7. 인프라 / 런타임 / 데이터

| 항목 | 상태 |
|------|------|
| DB 스키마 | N/A |
| API | N/A |
| Frontend | N/A |
| 인프라 | N/A |
| 외부 의존 | 없음 |
| 환경 변수 | 없음 |

순수 prompt + markdown + JavaScript validator 편집.

## 8. Interface Contract

N/A — UI/API 없음.

## 9. 테스트 전략

- **Unit**: `tests/doc-validator.test.js` — W-SCOPE-01/02/03 7 assertion
- **Regression**: 기존 모든 피처의 `docs/*/01-plan/main.md` 을 validator 로 순회 → severity=warn 확인, exit 0
- **E2E (manual)**: 새 피처로 `/vais cto plan test-feature` 호출 → plan/main.md 에 3섹션 자동 포함 여부 확인
- **Effect (정성)**: 2주간 내부 사용 관찰 — `plan_rewrite_requested` 이벤트 카운트 전후 비교 (SC-01)

## 큐레이션 기록

| Source (`_tmp/...`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|---------------------|:----:|:----:|:----:|:----:|------|
| (없음 — sub-agent 미위임) | — | — | — | — | CTO 직접 작성. ideation + CPO plan 두 main.md 만 입력 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — F1~F3 MVP + F4 Nice 상세, Do 단계 6 Step 계획 |
