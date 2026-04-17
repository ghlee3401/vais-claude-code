# Sub-plan 03 — Duplicate Module Consolidation

> 선행: —
> 후행: 04, 05, 06, 07
> 담당 SC: SC-3, SC-4, SC-6, SC-7, SC-8
> 갱신: 2026-04-17 CP-3~CP-6 결정 반영

---

## 0. 배경

v0.50 plan은 "새로운 규격을 `lib/` 하위에 이식"하는 방향이었으나, 기존 `scripts/*`에 동일 기능이 이미 런타임 연결되어 있어 **둘 다 살아있는 상태**. 본 sub-plan은 중복을 정리하고, **후속 sub-plan(06/07)이 활성화할 모듈은 유지**한다.

### 0.1 처리 결정표

| 중복 쌍 | 런타임 소비자 | 테스트 | 처리 |
|---------|---------------|--------|------|
| `lib/validation/doc-validator.js` ↔ `scripts/doc-validator.js` | `scripts/agent-stop.js:8` → scripts/ 쪽 | 없음 | **`lib/validation/doc-validator.js` 삭제** |
| `lib/validation/cp-guard.js` ↔ `scripts/cp-guard.js` | `scripts/agent-stop.js:9` → scripts/ 쪽 | 없음 | **`lib/validation/cp-guard.js` 삭제** |
| `lib/core/state-machine.js` (601 LOC, v0.49) ↔ `state-machine-v050.js` (268 LOC) | `lib/status.js:14` → 구버전 **그러나 `transitionPhase`/`getAvailableTransitions` 호출자 0** | `tests/state-machine-v050.test.js`, `tests/scenario-verification.test.js` | **CP-4 (D)**: 구 state-machine.js 삭제 + `status.js`의 dead 함수 삭제 + v050.js를 state-machine.js로 rename |
| `lib/core/migration-engine.js` (287 LOC) ↔ `lib/core/migration.js` (92 LOC) | `lib/status.js` (lazy) → 짧은 `migration.js` | `tests/migration-engine.test.js` | **`migration-engine.js` 삭제** (사용처 없음) |
| `lib/quality/gate-manager.js` (386 LOC) | 현재 없음 | `tests/gate-manager.test.js` | **CP-6 (C-full)**: 유지. sub-plan 07에서 활성화 |
| `lib/quality/template-validator.js` (153 LOC) | 없음 | 없음 | **삭제** (gate-manager와 달리 활성화 계획 없음) |
| `lib/registry/agent-registry.js` (153 LOC) | 없음 | `tests/agent-registry.test.js`, `tests/scenario-verification.test.js` | **CP-5 (B)**: 유지. advisor-call.js가 include 병합에 require |
| `lib/advisor/wrapper.js`, `prompt-builder.js`, `index.js` | 없음 | `tests/advisor-integration.test.js` | **CP-3 (B)**: 유지. sub-plan 06에서 진입점 추가 |
| `lib/observability/*` | scripts/여러곳 | | **유지** (런타임 필수) |

### 0.2 결정 근거 요약

- **Advisor 유지 (CP-3 B)**: 진입점만 빠진 상태. sub-plan 06에서 wrapper + cost-monitor + CLI 연결.
- **State-machine (CP-4 D)**: `status.js`의 FSM 통합 함수(`transitionPhase`, `getAvailableTransitions`) 호출자가 0임을 확인. 구버전 전체 + dead 함수 삭제 가능.
- **Registry 유지 (CP-5 B)**: 153 LOC 중 핵심 YAML 파서 + include 병합은 inline 대체(~30 LOC)보다 정식 모듈이 깔끔. 미래 가드 확장점.
- **Gate-manager 유지 (CP-6 C-full)**: `auto-judge.js`(이미 300 LOC의 판정 로직 존재)와 `gate-manager.js`를 통합하면 메트릭 기반 게이팅이 실제 동작. sub-plan 07에서 완성.

---

## 1. 조치

### 1.1 파일 삭제

```
rm lib/validation/doc-validator.js
rm lib/validation/cp-guard.js
rmdir lib/validation/
rm lib/quality/template-validator.js
rm lib/core/migration-engine.js
```

**유지**:
- `lib/registry/agent-registry.js` (06에서 require)
- `lib/quality/gate-manager.js` (07에서 활성화)
- `lib/quality/index.js` (gate-manager re-export)
- `lib/advisor/*` (06에서 활성화)
- `lib/control/cost-monitor.js` (sub-plan 01에서 이미 결정 — 01 참조)

### 1.2 State-machine 정리 (CP-4 D)

1. `lib/core/state-machine.js` (601 LOC) 삭제
2. `lib/status.js`에서 다음 코드 삭제 (라인 번호는 편집 시점 재확인):
   - 줄 12~16: `_stateMachine`, `getStateMachine()` 헬퍼
   - 줄 442~522: `transitionPhase()`, `getAvailableTransitions()` 함수 전체 (약 80 LOC)
3. `lib/core/state-machine-v050.js` → `lib/core/state-machine.js`로 **rename**
4. rename된 파일 내부 주석/문서 정리 ("v050" 언급 → "v0.55 FSM" 등 제네릭하게)
5. `lib/status.js`의 `require('./core/state-machine-v050')` 호출자가 **없음**(호출자 0)을 재확인 후 rename 진행

### 1.3 테스트 삭제

```
rm tests/migration-engine.test.js
rm tests/scenario-verification.test.js   # registry + doc-validator + state-machine-v050 복합 의존
```

### 1.4 테스트 rename

```
mv tests/state-machine-v050.test.js tests/state-machine.test.js
```
테스트 파일 내부 `require('../lib/core/state-machine-v050')` → `require('../lib/core/state-machine')`로 수정.

### 1.5 **유지**할 테스트 (변경 없음)

| 파일 | 이유 |
|------|------|
| `tests/gate-manager.test.js` | 07에서 활용 |
| `tests/agent-registry.test.js` | 06에서 활용 |
| `tests/advisor-integration.test.js` | 06에서 활용 |
| `tests/advisor-degrade.test.js` | 01/06에서 활용 |

### 1.6 Config 정리 예고 (sub-plan 04에서 실제 수정)

- `vais.config.json > advisor` 섹션 **유지** (06이 소비).
- `vais.config.json > gates` 섹션 **확장 예고** (07이 threshold 정의 추가).
- agent markdown frontmatter의 `advisor.enabled: true`, `includes: [_shared/advisor-guard.md]` **유지**.

---

## 2. 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `lib/validation/` 부재 | `ls lib/validation` fail |
| V-2 | `lib/core/`에 `state-machine.js`, `migration.js`, `state-store.js` 3 파일만 존재 (`state-machine-v050.js`, `migration-engine.js` 부재) | `ls lib/core/` |
| V-3 | `scripts/agent-stop.js`가 여전히 `scripts/doc-validator.js`, `scripts/cp-guard.js` 호출 (변경 없음) | 코드 리뷰 |
| V-4 | `npm test` 통과 (삭제된 테스트 제외) | `node --test tests/*.test.js` |
| V-5 | 런타임에서 `lib/status.js`가 state-machine 새 경로 인식 | `tests/state-machine.test.js` (rename된) 통과 |
| V-6 | `lib/status.js`에 `transitionPhase`, `getAvailableTransitions` 함수 부재 | `grep -n "transitionPhase\|getAvailableTransitions" lib/status.js` → 0 |
| V-7 | 에이전트 frontmatter `advisor.enabled: true` 그대로 유지 | `grep -l "advisor:" agents/**/*.md` count 변화 없음 |
| V-8 | `lib/registry/`, `lib/quality/gate-manager.js`, `lib/advisor/` 존재 | `ls` |
| V-9 | `npm run lint` 통과 (ESLint 유지) | `npm run lint` |

---

## 3. 리스크

| 리스크 | 완화 |
|--------|------|
| `status.js`의 dead 함수 삭제 후 혹시 외부 caller 있는지 | 사전 grep으로 호출자 0 확인 완료. 만약 잔존 호출 있으면 sub-plan 05 테스트 단계에서 잡힘 |
| scenario-verification.test.js 삭제로 v0.50 10 시나리오 회귀 검증 불가 | 수동 walkthrough 체크리스트로 대체(`guide/v050_plan/v050/10-scenario-verification.plan.md` 참조) |
| state-machine rename 중 import 경로 오류 | 테스트 `tests/state-machine.test.js`로 즉시 감지 |
| registry가 advisor-call.js에서 제대로 require되는지 | sub-plan 06에서 smoke test로 확인 |

---

## 4. Carry-forward

- **sub-plan 04**: `vais.config.json > advisor` 유지, `gates` 확장 예고 반영.
- **sub-plan 05**:
  - CHANGELOG에 state-machine rename + dead 함수 삭제 기록
  - tests/ 재구성 목록 명시 (삭제: migration-engine, scenario-verification / rename: state-machine-v050 → state-machine / 유지: gate-manager, agent-registry, advisor 2종)
  - CLAUDE.md "Key Configuration" 섹션 점검
- **sub-plan 06**: `lib/registry/agent-registry.js` + `lib/advisor/*` + `lib/control/cost-monitor.js` 모두 살아있는 상태에서 진입점 추가.
- **sub-plan 07**: `lib/quality/gate-manager.js` + `scripts/auto-judge.js` 통합 진행. migration-engine 삭제 여부 재확인 (07이 의존하는지).
