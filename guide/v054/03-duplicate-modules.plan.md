# Sub-plan 03 — Duplicate Module Consolidation

> 선행: —
> 후행: 04, 05
> 담당 SC: SC-4, SC-6, SC-7, SC-8

---

## 0. 배경

v0.50 plan은 "새로운 규격을 `lib/` 하위에 이식"하는 방향이었으나, 기존 `scripts/*`에 동일 기능이 이미 런타임 연결되어 있어 **둘 다 살아있는 상태**. 런타임은 구 경로를 쓰고, 신 경로는 테스트에서만 참조한다.

### 0.1 중복 목록

| 중복 쌍 | 런타임 소비자 | 테스트 | 제거 후보 |
|---------|---------------|--------|-----------|
| `lib/validation/doc-validator.js` ↔ `scripts/doc-validator.js` | `scripts/agent-stop.js:8` → scripts/ 쪽 | 없음 | **`lib/validation/doc-validator.js` 삭제** |
| `lib/validation/cp-guard.js` ↔ `scripts/cp-guard.js` | `scripts/agent-stop.js:9` → scripts/ 쪽 | 없음 | **`lib/validation/cp-guard.js` 삭제** |
| `lib/core/state-machine.js` (601 LOC, v0.49) ↔ `lib/core/state-machine-v050.js` (268 LOC) | `lib/status.js:14` → 구버전 | `tests/state-machine-v050.test.js`, `tests/scenario-verification.test.js` | **state-machine-v050.js 내용으로 state-machine.js 교체** 또는 v050.js 삭제 (CP-4) |
| `lib/core/migration-engine.js` (287 LOC) ↔ `lib/core/migration.js` (92 LOC) | `lib/status.js` (lazy) → 짧은 `migration.js` | `tests/migration-engine.test.js` | **`migration-engine.js` 삭제** (사용처 없음) |
| `lib/quality/gate-manager.js` (386 LOC) | **없음** (v050 plan의 4-step pipeline 미구현) | `tests/gate-manager.test.js` | **삭제** (CP-6 default A) |
| `lib/quality/template-validator.js` | 없음 | 없음 | **삭제** |
| `lib/registry/agent-registry.js` | 없음 | `tests/agent-registry.test.js`, `tests/scenario-verification.test.js` | **삭제** (CP-5 default A) |
| `lib/advisor/wrapper.js` | 없음 | `tests/advisor-integration.test.js` | **삭제** (CP-3 default A) |
| `lib/advisor/prompt-builder.js` | 없음 | `tests/advisor-integration.test.js` | **삭제** (CP-3) |
| `lib/advisor/index.js` | 없음 | 없음 | **삭제** |
| `lib/observability/state-writer.js` | `scripts/agent-start.js, agent-stop.js` — **유지** |
| `lib/observability/event-logger.js` | scripts/여러곳 — **유지** |
| `lib/observability/schema.js` | event-logger 내부 — **유지** |
| `lib/observability/rotation.js` | event-logger 내부 — **유지** |

### 0.2 결정 근거 (CP-3 ~ CP-6)

- **Advisor 삭제 (CP-3 A)**: Advisor Tool은 Claude Code가 에이전트 frontmatter를 읽어 내부적으로 처리하는 베타 기능이다. 플러그인 런타임 쪽에서 Anthropic SDK로 직접 호출하는 경로가 없다. `lib/advisor/*`는 "만약 plugin이 직접 API 호출한다면" 시나리오를 위한 ghost code.
- **Registry 삭제 (CP-5 A)**: `includes: [_shared/advisor-guard.md]`는 Claude Code가 agent markdown 로딩 시 처리할 가능성이 높다. 플러그인이 파싱할 이유 없음. frontmatter는 현행대로 유지해도 registry 파싱 코드는 불필요.
- **Gate-manager 삭제 (CP-6 A)**: scripts/agent-stop.js가 doc-validator + cp-guard 조합으로 이미 "필수 문서 확인 + 체크포인트 확인" 수행 중. 4-step pipeline(Document→Checkpoint→Gate→Guidance)은 설계 이상이고 실제론 2-step도 충분. gate-manager 재연결 대신 삭제.
- **State-machine 정리 (CP-4 B)**: v050 6-phase 스펙(`ideation` 포함)이 새 표준. 구 `state-machine.js`를 v050 내용으로 **교체**. 마이그레이션 비용(PHASES 배열, 전이 규칙)이 예상보다 크면 (A)로 선회해 v050.js를 삭제하고 구버전 유지 (단, `ideation` phase 지원을 status.js에 직접 패치).

---

## 1. 조치 — 삭제 (CP defaults)

### 1.1 파일 삭제

```
rm -rf lib/advisor/
rm -rf lib/quality/
rm -rf lib/registry/
rm -rf lib/validation/
rm lib/core/migration-engine.js
```

### 1.2 테스트 삭제

```
rm tests/advisor-integration.test.js
rm tests/advisor-degrade.test.js     # 01 sub-plan에서 예고된 항목
rm tests/agent-registry.test.js
rm tests/gate-manager.test.js
rm tests/migration-engine.test.js
rm tests/scenario-verification.test.js   # registry + doc-validator + state-machine-v050 복합 의존
rm tests/state-machine-v050.test.js       # state-machine 교체 완료 후 generic test로 대체 (§1.3 참조)
```

주의: `tests/scenario-verification.test.js`는 CBO 라우팅, ideation, advisor frontmatter를 복합 검증하는 통합 테스트. 삭제 시 cost-benefit 확인 필요. 대안은 registry/doc-validator 의존만 stub으로 대체하는 것이나, 복잡도 증가하므로 **삭제 후 필요 시 신규 작성**.

### 1.3 State-machine 교체 (CP-4 B)

**Option B: 내용 교체**
1. `lib/core/state-machine.js`의 PHASES 배열, 전이 규칙을 v050 버전(6 phase + ideation optional)으로 치환.
2. `lib/core/state-machine-v050.js` 삭제.
3. `lib/status.js:14`의 require 경로는 동일하게 `./core/state-machine` 유지.
4. 기존 state-machine.js의 레거시 API가 `lib/status.js` 외에서 호출되는지 전수 grep. 호출되면 호환 shim 작성 또는 호출 제거.

**Option A 대안 (교체 실패 시)**: v050.js 삭제하고 구 state-machine.js에 `ideation` phase 케이스만 추가.

### 1.4 Config 정리 예고 (sub-plan 04에서 실제 수정)

Advisor 삭제 시 `vais.config.json > advisor` 섹션도 제거.
단, agent markdown frontmatter의 `advisor.enabled: true` 필드는 **유지**. Claude Code가 자체 해석한다.

---

## 2. 검증

| # | 검증 | 방법 |
|---|------|------|
| V-1 | `lib/advisor/`, `lib/quality/`, `lib/registry/`, `lib/validation/` 부재 | `ls` fail |
| V-2 | `lib/core/` 에 `state-machine.js`, `migration.js`, `state-store.js` 3개만 존재 (`state-machine-v050.js`, `migration-engine.js` 부재) | `ls lib/core/` |
| V-3 | `scripts/agent-stop.js`가 여전히 `scripts/doc-validator.js`, `scripts/cp-guard.js` 호출 (변경 없음) | 코드 리뷰 |
| V-4 | `npm test` 통과 (삭제된 테스트 제외) | `node --test tests/*.test.js` |
| V-5 | 런타임에서 `lib/status.js`가 state-machine 새 PHASES(`['ideation','plan','design','do','qa','report']`)를 인식 | `tests/status.test.js` 기존 테스트 통과 + 필요 시 신규 케이스 추가 |
| V-6 | 에이전트 frontmatter `advisor.enabled: true` 그대로 유지 | `grep -l "advisor:" agents/**/*.md` count 변화 없음 |

---

## 3. 리스크

| 리스크 | 완화 |
|--------|------|
| scenario-verification.test.js 삭제로 v0.50 10 시나리오 회귀 검증 불가 | 수동 walkthrough 체크리스트로 대체(`guide/v050_plan/v050/10-scenario-verification.plan.md` 참조) |
| state-machine 교체 중 기존 status 테스트 깨짐 | sub-plan 5에서 fix — status.test.js 기대값 업데이트 |
| Advisor 기능이 실제로 Claude Code에서 지원되지 않으면 frontmatter도 제거해야 함 | Claude Code 런타임에서 무시하면 OK. 에러나면 sub-plan 05에서 frontmatter 일괄 제거 (`patch-advisor-frontmatter.js` 역방향 실행) |
| registry 삭제 후 `_shared/advisor-guard.md`, `_shared/ideation-guard.md` include 병합이 작동 안 함 | Claude Code 내장 include 기능 확인. 작동 안 하면 agent markdown에 내용 inline 병합 또는 reference 링크로 대체 |

---

## 4. Carry-forward

- **sub-plan 04**: `vais.config.json`의 `advisor` 섹션 제거.
- **sub-plan 05**:
  - CHANGELOG에 state-machine 교체 내역 기록
  - tests/ 재구성 목록 명시 (삭제된 6개 테스트 반영)
  - CLAUDE.md의 Advisor Tool 언급 정리 (M-24 부분)
  - `scripts/check-cc-advisor-support.js`, `scripts/patch-advisor-frontmatter.js` 삭제 여부 결정
