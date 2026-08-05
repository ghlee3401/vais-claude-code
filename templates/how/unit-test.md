---
artifact: unit-test
owner_agent: test-engineer
phase: how
canon_source: "Kent Beck 'Test-Driven Development: By Example' (2002), Addison-Wesley + Gerard Meszaros 'xUnit Test Patterns' (2007), Addison-Wesley + Martin Fowler 'Test Pyramid' (2012, martinfowler.com)"
execution:
  policy: always
  intent: unit-test-implementation
  prereq: [api-implementation]
  required_after: []
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — 모든 production 코드는 unit test cover. Beck TDD 의 Red-Green-Refactor 루프. 가장 많은 tests + 가장 빠름 (Test Pyramid 의 base)."
---

# Unit Test

> **canon**: Beck *TDD by Example* (2002) — Red-Green-Refactor + 테스트 우선. Meszaros *xUnit Test Patterns* (2007) — 70+ test pattern (Setup / Teardown / Test Double / etc.). Fowler *Test Pyramid* (2012) — Unit > Integration > E2E (역피라미드 회피).
>
> **목적**: 함수/class 단위의 격리된 검증. **빠르고 (ms)**, **결정적 (deterministic)**, **격리된 (isolated)** 테스트.

---

## 1. FIRST 원칙 (Robert Martin)

| 원칙 | 정의 |
|------|------|
| **F**ast | 단일 테스트 ms 단위 (전체 suite 분 미만) |
| **I**ndependent | 다른 테스트와 무관, 어느 순서에도 작동 |
| **R**epeatable | 같은 입력 → 같은 결과 (네트워크/DB/시간 의존 X) |
| **S**elf-validating | pass/fail 자동 판단 (수동 inspection X) |
| **T**imely | production code **직전** 또는 **이전** 작성 |

## 2. AAA Pattern (Arrange-Act-Assert)

```javascript
test('user 생성 시 created_at 자동 설정', () => {
  // Arrange
  const input = { email: 'a@b.com', name: 'Alice' };
  const clock = new FakeClock('2026-04-26T00:00:00Z');
  
  // Act
  const user = createUser(input, clock);
  
  // Assert
  expect(user.created_at).toBe('2026-04-26T00:00:00Z');
  expect(user.email).toBe('a@b.com');
});
```

## 3. Test Double 5 종 (Meszaros)

| Type | 정의 | 사용 시점 |
|------|------|----------|
| **Dummy** | argument 채우기용 (사용 X) | 함수 시그니처 만족 |
| **Stub** | 사전 답변 반환 | 외부 의존 무시 |
| **Spy** | call 기록 + (optional) stub | call 검증 |
| **Mock** | 사전 expectation + verify | 행위 검증 |
| **Fake** | 단순 동작 구현 (in-memory DB) | DB / API 대체 |

→ **선호 순서**: Fake > Stub > Spy > Mock > Dummy. Mock 남용은 brittle.

## 4. Test Coverage 표준

| Type | Target |
|------|:------:|
| **Statement coverage** | 80%+ |
| **Branch coverage** | 70%+ |
| **Function coverage** | 90%+ |
| **Line coverage** | 80%+ |

→ **하지만 100% coverage 가 곧 quality 아님** (Beck 명시). **critical path 우선**.

## 5. Naming Convention

```
test('{subject}_{condition}_{expected}', () => {...})
```

예시:
- `test('createUser_emptyEmail_throwsError')`
- `test('evaluateScopeConditions_fieldMissing_returnsFalse')`
- `test('catalog_buildFromTemplates_sortsArtifactsByPhase')`

## 6. Edge Cases (반드시 cover)

- [ ] **Empty / null / undefined**
- [ ] **Boundary** (0 / -1 / Number.MAX / Number.MIN)
- [ ] **Off-by-one** (배열 first / last index)
- [ ] **Concurrent access** (race condition)
- [ ] **Error path** (exception 발생 + handled)
- [ ] **Type coercion** (string "0" vs number 0)
- [ ] **Internationalization** (UTF-8 / RTL / locale)

---

## (작성된 sample)

### Test Suite: lib/project-profile.js (Sprint 1~3 — 8 functions, 7 tests)

```javascript
// tests/integration/profile-gate.test.js
const test = require('node:test');
const assert = require('node:assert');
const {
  loadProfile,
  evaluateScopeConditions,
  validateFeatureName,
  detectSecrets,
} = require('../../lib/project-profile');

test('T-01: local-only + ci-cd-configurator → skip', () => {
  // Arrange
  const profile = {
    type: 'oss',
    deployment: { target: 'local-only' }
  };
  const conditions = [
    { field: 'deployment.target', operator: 'IN', value: ['cloud', 'hybrid'] }
  ];
  
  // Act
  const result = evaluateScopeConditions(profile, conditions);
  
  // Assert
  assert.strictEqual(result.passed, false);
  assert.match(result.reason, /local-only/);
});

test('T-02: cloud + sla_required → 실행', () => {
  // Arrange
  const profile = {
    type: 'b2b-saas',
    deployment: { target: 'cloud', sla_required: true }
  };
  const conditions = [
    { field: 'deployment.target', operator: 'IN', value: ['cloud', 'hybrid'] },
    { field: 'deployment.sla_required', operator: '==', value: true }
  ];
  
  // Act
  const result = evaluateScopeConditions(profile, conditions);
  
  // Assert
  assert.strictEqual(result.passed, true);
});

test('T-04: validateFeatureName — path traversal 차단', () => {
  assert.throws(
    () => validateFeatureName('../../../etc/passwd'),
    /invalid feature name/i
  );
});

test('T-06: detectSecrets — API key pattern 탐지', () => {
  const yaml = `
type: oss
notes: "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
  `;
  const result = detectSecrets(yaml);
  assert.strictEqual(result.detected, true);
  assert.match(result.pattern, /AKIA/);
});

// (T-03, T-05, T-07 — 동일 패턴)
```

### 결과

```
ℹ tests        266
ℹ pass         263
ℹ fail         0
ℹ skipped      3
ℹ duration_ms  ~880
```

→ FIRST 원칙 모두 준수: Fast (~880ms / 266 tests) / Independent / Repeatable / Self-validating / Timely.

---

## 작성 체크리스트

- [ ] **FIRST 5 원칙** 모두 준수?
- [ ] **AAA pattern** (Arrange-Act-Assert) 명확?
- [ ] **Test Double** 적정 종류 사용 (Mock 남용 X)?
- [ ] **Coverage** 임계 (80% / 70% / 90% / 80%) 충족?
- [ ] **Naming** 가 `subject_condition_expected` 또는 BDD 스타일?
- [ ] **Edge Cases** (empty / boundary / off-by-one / error path) cover?
- [ ] 단일 테스트 **하나의 assertion** 또는 1 개의 logical concept 검증?
- [ ] **Setup/Teardown** 격리 (other test 의 영향 X)?
- [ ] Test 수행 시간 **< 100ms / test** (unit) — 그 외는 integration 으로 이동?

---

## ⚠ Anti-pattern (Beck + Meszaros + Fowler 명시)

- **Brittle Test**: 구현 변경 시 깨짐 — 행위 (behavior) 가 아닌 구현 (implementation) 검증. Mock 남용의 흔한 결과.
- **Slow Test**: > 100ms / unit test — 다른 테스트로 분류 (integration) 또는 fake 사용.
- **Order Dependent**: 테스트 순서 영향 — Independence 위반. 격리 강제.
- **Flaky Test**: 가끔 fail — race condition / 시간 의존. **Fake clock / deterministic seed** 사용.
- **Multiple Assertions per Test**: 1 test 가 여러 concept 검증 — fail 시 원인 파악 어려움.
- **Test in Production code**: production 함수 안에 if-test branch — 본 anti-pattern. test 는 별도 file.
- **Coverage 추구**: 100% line coverage — critical path 무시 + branch / mutation 무평가. **mutation testing** 권장.
- **Setup 복잡**: arrange 50+ 라인 — 테스트가 너무 거대. 분해 / fake 사용.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Beck TDD + Meszaros xUnit + Fowler Test Pyramid + Martin FIRST 정전. FIRST + AAA + Test Doubles 5종 + Coverage + Naming + Edge Cases + sample (VAIS T-01/02/04/06 통합 테스트) + checklist 9 + anti-pattern 8 |
