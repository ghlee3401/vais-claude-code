---
owner: cto
topic: edit-contract
phase: design
feature: plan-scope-contract
---

# Edit Contract — plan-scope-contract

> 각 대상 파일의 **정확한 before/after diff**. Do 단계에서 이 문서를 참조하여 편집 수행. UI/API 없는 피처이므로 전통적 Interface Contract 를 Edit Contract 로 대체.

## 1. `CLAUDE.md` — Rule #9 부연

### 위치

`## Mandatory Rules` 섹션 내 9번 항목 (현재 line ~136).

### Diff

```diff
 9. **완전성 원칙 (Boil the Lake)** — 각 C-Level은 담당 범위를 완전하게 수행. "나중에" 미룸 금지. Lake(끓일 수 있는 범위)는 끓이고, Ocean(전체 재작성 등)은 범위 밖으로 표시
+   - **Lake 는 사용자가 지정한다.** AI 는 Lake 를 자의로 확장하지 않는다. 자발 감지한 확장 후보는 `## 관찰 (후속 과제)` 섹션에 기록만 하고, 사용자 명시 승인 전까지는 In-scope 에 포함하지 않는다.
```

## 2. `templates/plan.template.md` — Scope Contract 3섹션 삽입

### 위치

파일 상단, `# {feature} - 기획서` H1 + 주석 2줄 다음, `## Executive Summary` **앞**.

### 삽입 블록

```markdown
## 요청 원문

> {사용자 요청을 축약 없이 인용. 여러 개면 번호. CEO 위임 컨텍스트면 출처 표기.}

## In-scope

- {요청 원문에 명시된 항목}
- {기술적 전제조건 (필요한 인프라·의존성)만}

## Out-of-scope

- {의도적으로 제외한 항목 + 이유 1줄}
- {별도 피처 후보로 분기할 항목}
- (자발 감지한 확장 후보는 `## 관찰 (후속 과제)` 로 — Rule #9)

---

```

## 3. `scripts/doc-validator.js` — W-SCOPE 규칙

### 신규 rule 엔트리 (기존 rule array 에 append)

```javascript
// W-SCOPE-01 — plan/main.md 에 "## 요청 원문" 누락
{
  code: 'W-SCOPE-01',
  severity: 'warn',
  appliesTo: ({ phase, filename }) => phase === '01-plan' && filename === 'main.md',
  check: (content) => /^## 요청 원문\s*$/m.test(content),
  message: 'plan/main.md 에 `## 요청 원문` 섹션이 없습니다. 사용자 요청 축약 없이 인용 필요 (Rule #9).',
},
// W-SCOPE-02
{
  code: 'W-SCOPE-02',
  severity: 'warn',
  appliesTo: ({ phase, filename }) => phase === '01-plan' && filename === 'main.md',
  check: (content) => /^## In-scope\s*$/m.test(content),
  message: 'plan/main.md 에 `## In-scope` 섹션이 없습니다.',
},
// W-SCOPE-03
{
  code: 'W-SCOPE-03',
  severity: 'warn',
  appliesTo: ({ phase, filename }) => phase === '01-plan' && filename === 'main.md',
  check: (content) => /^## Out-of-scope\s*$/m.test(content),
  message: 'plan/main.md 에 `## Out-of-scope` 섹션이 없습니다. 명시할 게 없으면 "(없음)" 한 줄로.',
},
```

### 단위 테스트 (`tests/doc-validator.test.js`)

```javascript
describe('W-SCOPE-01/02/03', () => {
  test('3섹션 모두 있으면 경고 없음', () => {
    const content = '# x\n\n## 요청 원문\n\n> ...\n\n## In-scope\n\n- a\n\n## Out-of-scope\n\n- b\n';
    expect(runRules(content, { phase: '01-plan', filename: 'main.md' })).not.toContainEqual(expect.objectContaining({ code: /^W-SCOPE-/ }));
  });
  test('요청 원문 누락 시 W-SCOPE-01', () => { /* ... */ });
  test('In-scope 누락 시 W-SCOPE-02', () => { /* ... */ });
  test('Out-of-scope 누락 시 W-SCOPE-03', () => { /* ... */ });
  test('세 섹션 모두 누락 시 3건 모두 발화', () => { /* ... */ });
  test('design/main.md 에는 적용 안 됨', () => { /* appliesTo 확인 */ });
  test('기존 피처 역호환: severity=warn, exit code 영향 없음', () => { /* exitCode = 0 확인 */ });
});
```

**총 7 assertion** (SC-02 의 W-SCOPE 발화율 측정 기반).

## 4. `agents/cto/cto.md` — Plan Scope Default 블록

### 위치

`<!-- @refactor:begin work-rules -->` 마커 **직전** (즉 `## 작업 원칙` 섹션 앞).

### 삽입 블록

```markdown
---

## Plan Scope Default (v0.58.3+)

Plan phase 진입 시 다음 default 를 적용한다:

1. **사용자 요청 원문을 축약·재해석하지 않고 그대로 인용**하여 plan/main.md `## 요청 원문` 섹션에 복사 (위임 컨텍스트면 출처 표기)
2. **In-scope 는 요청 원문에 명시된 항목 + 기술적 전제조건만**. 품질 리스크 자발 감지 항목은 포함 금지
3. 자발 감지한 품질 리스크·개선 기회는 `## 관찰 (후속 과제)` 섹션에 **기록만**. 다음 phase 가 이를 자동 scope 로 승계하지 않음
4. 사용자가 명시적으로 확장을 요청하면 그때 In-scope 로 이동

> **근거 규칙**: CLAUDE.md Rule #9 (Boil the Lake) — Lake 는 사용자가 지정한다.
```

## 5. Event log 스키마 (`lib/events.js` 또는 phase-transition)

### 신규 이벤트 타입

```typescript
// plan phase 완료 시 기록
type PlanCompletedEvent = {
  type: 'plan_completed';
  timestamp: string;      // ISO8601
  feature: string;
  phase: 'plan';
  cLevel: 'cto' | 'cpo' | 'ceo' | 'cso' | 'cbo' | 'coo';
  scopeItemsIn: number;   // In-scope 항목 수 (H2 "## In-scope" 다음 리스트 개수)
  scopeItemsOut: number;  // Out-of-scope 항목 수
  observations: number;   // "## 관찰 (후속 과제)" 항목 수
};

// 사용자가 plan 재작성을 요청 시 기록 (CTO agent 가 감지)
type PlanRewriteRequestedEvent = {
  type: 'plan_rewrite_requested';
  timestamp: string;
  feature: string;
  cLevel: 'cto' | 'cpo' | '...';
  reason: 'scope_creep' | 'other';   // "다시 짜" / "scope 좁혀" 키워드 감지 시 scope_creep
};
```

### 기록 위치

`.vais/event-log.jsonl` (기존 파일). JSONL append. 기존 이벤트 스키마 수정 없음 — 신규 타입만 추가.

### 감지 휴리스틱 (reason classification)

사용자 메시지에 다음 패턴 매치 시 `reason='scope_creep'`:
- `다시 짜`, `다시 써`, `scope 좁혀`, `범위 좁혀`, `너무 많`, `과하`, `범위 넘`
- 그 외 plan 재생성 요청은 `reason='other'`

## 6. Gate 판정 (Gate 2 — Design 완료)

이 피처는 UI 없어 표준 Gate 2 체크항목 대부분 N/A. 대체 체크리스트:

- [ ] edit-contract.md 에 5개 대상 파일 각각 정확한 diff 포함
- [ ] W-SCOPE regex 가 hyphen/공백 차이에 robust (`\s*$` 트레일링 허용)
- [ ] event-log 스키마가 기존 타입과 충돌 없음 (typeof check)

**Interface Contract 대체**: `./edit-contract.md` 본 문서가 Gate 2 Interface Contract 역할 수행.

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| `../01-plan/tech-sketch.md` | ✓ | — | ✓ | — | CTO plan 의 추상 스케치를 정확한 diff/regex/schema 로 구체화 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-22 | 초기 작성 — 5개 대상 파일 edit contract + Gate 2 체크리스트 |
