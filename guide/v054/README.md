# VAIS Code v0.54 → v0.55 Simplification — Master Plan (Index)

> Feature: `v054-simplification`
> Phase: Plan (Master / Index)
> Version: v0.54.1 → v0.55.0 (proposed)
> Source: `guide/v050_plan/` 기반 실제 구현 리뷰 (이 문서 §2 참조)

---

## 0. 이 플랜의 목적

v0.50 full overhaul 이후 v0.54.1까지의 플러그인을 **전체 리뷰**한 결과,
구현은 "plan대로 파일은 거의 다 만들어졌는데, **실제 런타임에 연결되지 않은 모듈이 절반 이상**"이라는
구조적 문제가 확인됐다. 이 플랜은 다음 두 가지를 동시에 해결한다.

1. **사용자 지시**: CI(플러그인 자체 CI, GitHub Actions 등) 관련 부분 제거
2. **구조적 문제**: 과설계된 dead code 제거 + 중복 모듈 통합 + 설정 단순화

**원칙**: 기능 축소가 아니라 **"설계와 실제 사용의 정합성 회복"**. 이미 마음에 드는 에이전트/워크플로우/산출물 규격은 그대로 두고, 호출되지 않는 배관만 걷어낸다.

---

## 1. 리뷰 요약 (Why v0.54 → v0.55?)

### 1.1 v0.50 plan 구현 상태

| Sub-plan | 파일 산출 | 런타임 연결 |
|----------|-----------|-------------|
| 00 Migration Foundation | ✅ 존재 | ⚠️ `state-machine-v050.js`는 테스트에서만 사용, 실제 런타임은 `state-machine.js`(구버전) 사용 |
| 01 CBO Agents | ✅ 11 파일 | ✅ skills/phases/cbo.md 라우터 연결됨 |
| 02 Existing Updates | ✅ 완료 | ✅ |
| 03 Shared Guards | ✅ `_shared/*.md` 2종 | ⚠️ `lib/registry/agent-registry.js`는 **테스트에서만** 참조됨 |
| 04 Advisor Integration | ✅ 파일 존재 | ⚠️ `lib/control/cost-monitor.js`는 **자기 테스트에서만** require. wrapper/prompt-builder는 test-only |
| 05 Ideation Phase | ✅ 완료 | ✅ |
| 06 Phase Routers | ✅ 완료 | ✅ |
| 07 Harness Gates | ⚠️ `lib/quality/gate-manager.js` 존재하나 **scripts/agent-stop.js가 사용하지 않음** (4-step pipeline 미구현). agent-stop은 `scripts/doc-validator.js + scripts/cp-guard.js` 호출 |
| 08 Cleanup | ✅ 완료 |
| 09 Docs/Tests | ✅ 완료 |
| 10 Scenarios | ✅ 완료 |

### 1.2 Dead code 스캐너 결과 (require 그래프 기준)

다음 모듈은 **런타임(hooks/ + scripts/에서 호출하는 실행 경로)에서 전혀 require되지 않는다**.
(advisor 관련은 sub-plan 06에서 진입점 추가하여 활성화 — 삭제 대상 아님)

| 모듈 | LOC | 참조처 |
|------|-----|--------|
| `lib/control/trust-engine.js` | 306 | 아무 데도 require하지 않음 |
| `lib/control/loop-breaker.js` | 206 | 아무 데도 require하지 않음 |
| `lib/control/blast-radius.js` | 254 | 아무 데도 require하지 않음 |
| `lib/control/checkpoint-manager.js` | 263 | 아무 데도 require하지 않음 (실제 CP 가드는 `scripts/cp-guard.js`) |
| `lib/control/automation-controller.js` | 253 | 아무 데도 require하지 않음 |
| ~~`lib/control/cost-monitor.js`~~ | ~~152~~ | sub-plan 06에서 advisor 진입점에 연결하므로 **유지** |
| `lib/control/index.js` | 11 | 위 전체 re-export, 외부 소비자 0 |
| `lib/pdca/automation.js` | 218 | 아무 데도 require하지 않음 |
| `lib/pdca/decision-record.js` | 162 | 아무 데도 require하지 않음 |
| `lib/pdca/feature-manager.js` | 273 | 아무 데도 require하지 않음 |
| `lib/pdca/session-guide.js` | 142 | 아무 데도 require하지 않음 |
| `lib/pdca/index.js` | 10 | 외부 소비자 0 |
| `lib/quality/gate-manager.js` | 386 | `tests/gate-manager.test.js`에서만 |
| `lib/quality/template-validator.js` | 153 | 외부 소비자 0 |
| `lib/validation/doc-validator.js` | 111 | **`scripts/doc-validator.js`와 이름 충돌**, 테스트에서만 |
| `lib/validation/cp-guard.js` | 59 | **`scripts/cp-guard.js`와 이름 충돌**, 테스트에서만 |
| `lib/registry/agent-registry.js` | 153 | `tests/` 2곳에서만 |
| `lib/core/state-machine-v050.js` | 268 | `tests/` 2곳에서만 (런타임은 `state-machine.js`) |
| `lib/core/migration-engine.js` | 287 | `tests/migration-engine.test.js`에서만 |
| ~~`lib/advisor/wrapper.js`~~ | ~~113~~ | sub-plan 06에서 fallback 모드 진입점 연결하여 **유지** |
| ~~`lib/advisor/prompt-builder.js`~~ | ~~60~~ | wrapper와 함께 **유지** |

**합계: 약 3,840 LOC** 중 advisor 관련 4 파일(약 325 LOC)을 제외한 **약 3,515 LOC** 삭제 대상. advisor는 sub-plan 06에서 활성화.

### 1.3 설정 파일 소비자 없음 (`vais.config.json`)

- `automation` 섹션 (L0~L4 trust level, gateTimeoutMs, emergencyStopEnabled 등): 소비자 = `lib/control/automation-controller.js` (dead)
- `guardrails.loopBreaker/blastRadiusLimit/checkpoint*`: 소비자 = `lib/control/*` (dead)
- `parallelGroups`: 실행 로직 없음 (문서 힌트용)
- `chaining`: 실행 로직 없음
- `manager`: 소비자 = `lib/memory.js` 일부만

### 1.4 중복 구조

| 중복 | 현재 런타임이 쓰는 쪽 |
|------|----------------------|
| `lib/core/state-machine.js` (601 LOC) vs `state-machine-v050.js` (268 LOC) | **구버전** (`lib/status.js:14`) |
| `lib/validation/doc-validator.js` vs `scripts/doc-validator.js` | **scripts/** (`agent-stop.js:8`) |
| `lib/validation/cp-guard.js` vs `scripts/cp-guard.js` | **scripts/** (`agent-stop.js:9`) |

즉 v0.50 plan이 "새 모듈을 lib/에 이식"했지만 기존 `scripts/*`를 끊지 않아 **둘 다 살아있는 상태**. 런타임은 여전히 scripts/ 쪽 사용.

### 1.5 CI 범위

**플러그인 자체 CI (삭제 대상)**
- `.github/workflows/ci.yml` — GitHub Actions

**코드 품질 도구 (유지 — CI와 분리)**
- `eslint.config.js`, `package.json > scripts.lint`, `devDependencies.eslint` — 로컬 `npm run lint`로 계속 사용
- `.hooks/pre-commit`, `scripts/check-legacy-paths.sh`, `npm run prepare-hooks` — 로컬 git hook으로 계속 사용
- `npm test` — 현행 유지

**사용자 프로젝트용 CI (유지, 삭제 아님)**
- `agents/coo/release-engineer.md` — 사용자가 자기 프로젝트에 CI/CD 셋업을 원할 때 쓰는 에이전트
- 이건 플러그인의 핵심 기능이므로 삭제하지 않는다. (사용자가 원한 "CI 쓰는 부분 삭제"는 플러그인 자체 검증 CI로 해석)

---

## 2. Sub-plan 목록 & 구현 순서

| # | Sub-plan | 파일 | 선행 | 핵심 변경 |
|---|----------|------|------|-----------|
| 00 | CI Removal (축소) | `v054/00-ci-removal.plan.md` | — | `.github/workflows/ci.yml`만 제거. ESLint/pre-commit/legacy-path-guard **유지** |
| 01 | Dead Code — `lib/control/` (cost-monitor 제외) | `v054/01-lib-control-removal.plan.md` | — | 6 파일 (~1,128 LOC) 제거. `cost-monitor.js`는 advisor 활성화에 사용되므로 **유지** + config `automation`/`guardrails` 정리 |
| 02 | Dead Code — `lib/pdca/` | `v054/02-lib-pdca-removal.plan.md` | — | 5 파일 (~805 LOC) 제거 |
| 03 | Duplicate Consolidation | `v054/03-duplicate-modules.plan.md` | — | `lib/validation/*`, `migration-engine.js` 삭제. `state-machine-v050.js`를 `state-machine.js`로 rename하고 구버전 + status.js dead 함수 제거 (CP-4 D). **`lib/registry/*` 유지** (CP-5 B). **`lib/quality/*` 유지** (CP-6, 07에서 활성화). **`lib/advisor/*` 유지** (CP-3 B, 06에서 활성화) |
| 04 | Config Cleanup | `v054/04-config-cleanup.plan.md` | 01, 02, 03, 06 | `vais.config.json`에서 소비자 없는 키 삭제. `advisor` 유지. `gates` 섹션에 07용 threshold 확장 예고 |
| 05 | Tests & Docs Update | `v054/05-tests-docs.plan.md` | 전체 (06, 07, 08 후) | 삭제 모듈 관련 테스트 제거, CLAUDE/AGENTS/README/CHANGELOG 갱신, 버전 0.54.1 → 0.55.0 |
| 06 | Advisor Activation | `v054/06-advisor-activation.plan.md` | 03 | advisor 진입점(CLI + session-start mode 판정 + cost-monitor 연결) 완성 |
| 07 | Gate Activation | `v054/07-gate-activation.plan.md` | 04 | `auto-judge.js` ↔ `gate-manager.js` 통합, `agent-stop.js` 4-step pipeline, `vais.config.json > gates` threshold 확장, CBO/CFO → CBO 메트릭 재정의 |
| 08 | Tools Cleanup | `v054/08-tools-cleanup.plan.md` | — | (B1) `refactor-audit.js` + baseline 삭제, (C2) `/vais dashboard` 커맨드 진입점 신설, (D2) `seo-analyst.md`에 `seo-audit.js` CLI 호출 가이드 추가 |

**의존성 그래프**
```
00 CI Removal  ─┐
01 control/    ─┤
02 pdca/       ─┼─→ 04 Config ─┐
03 Duplicates  ─┘              │
                                ├─→ 07 Gate ─→ 05 Docs/Tests
              06 Advisor ──────┤             ↑
              08 Tools  ───────────────────(independent)
```
00~03, 06, 08은 **병렬 가능**. 04는 01~03 + 06 후. 07은 04 후 (config threshold 스키마 필요). 05는 06/07/08 전체 완료 후 최종.

---

## 3. 전역 성공 기준 (Master SC)

| # | Criteria | 검증 |
|---|----------|------|
| SC-1 | `.github/workflows/` 디렉토리 부재. 그러나 `eslint.config.js`, `.hooks/pre-commit`, `scripts/check-legacy-paths.sh`, `npm run lint`, `npm run prepare-hooks`는 **유지** | `ls .github && ls eslint.config.js .hooks/pre-commit` |
| SC-2 | `lib/pdca/` 부재. `lib/control/` 에 `cost-monitor.js`만 존재 (나머지 6개 삭제) | `ls lib/` |
| SC-3 | `lib/validation/` 부재. `lib/registry/`, `lib/quality/`, `lib/advisor/` 유지 (06/07에서 활성화) | `ls lib/` |
| SC-4 | `lib/core/`에 `state-machine.js`(v050 내용 이식), `migration.js`, `state-store.js` 3 파일만 존재. 구버전 state-machine.js/migration-engine.js 부재 | `ls lib/core/` |
| SC-5 | `vais.config.json`에 `automation`, `guardrails`, `parallelGroups`, `chaining`, `featureNameValidation`, `featureNameSuggestions` 키 부재. `advisor`, `gates`(확장) 유지 | diff |
| SC-6 | `npm test` + `npm run lint` 전부 pass | `node --test tests/*.test.js && npm run lint` |
| SC-7 | scripts/hooks/lib 런타임 require 그래프가 끊긴 곳 없음 | 수동 grep |
| SC-8 | 에이전트 markdown에 삭제된 모듈 참조 없음 | `grep -r "lib/pdca\|trust-engine\|loop-breaker\|blast-radius\|automation-controller" agents/ skills/` → 0 |
| SC-9 | CHANGELOG.md에 v0.55.0 단락 추가 (제거 내역 + 신규 진입점 명시) | diff |
| SC-10 | `version` 키 4 파일 동기화 (package.json, vais.config.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json) | diff |
| SC-11 | advisor CLI (`scripts/advisor-call.js`) 동작: mock SDK로 호출 시 `advisor_call` 이벤트 기록 + spend 파일 갱신 | sub-plan 06 smoke test |
| SC-12 | gate activation: `node scripts/gate-check.js {feature} {phase}` 실행 시 auto-judge 메트릭 수집 → gate-manager.checkGate → pass/retry/fail 판정 | sub-plan 07 통합 테스트 |
| SC-13 | `/vais dashboard` 커맨드 실행 시 `.vais/dashboard.html` 생성 | sub-plan 08 smoke test |
| SC-14 | `scripts/refactor-audit.js` + baseline 파일 부재 | `ls scripts/refactor-audit.js` fail |
| SC-15 | `agents/cbo/seo-analyst.md`에 `seo-audit.js` CLI 호출 가이드 존재 | grep |

---

## 4. Checkpoint Decisions (확정)

2026-04-17 세션에서 사용자와 논의 후 아래와 같이 확정.

| # | Decision | 결정 |
|---|----------|------|
| CP-1 | 플러그인 CI/린팅/훅 처리 범위 | **`.github/workflows/ci.yml`만 삭제**. ESLint, pre-commit, legacy-path-guard, npm run lint, npm run prepare-hooks **전부 유지** (CI 인프라 ≠ 코드 품질 도구) |
| CP-2 | `eslint.config.js` + ESLint 제거 여부 | **유지** (CP-1 연동) |
| CP-3 | `lib/advisor/` 처리 | **(B) 런타임 연결**. sub-plan 06에서 native/fallback 자동 분기 + CLI 진입점 추가 |
| CP-4 | state-machine 이중화 처리 | **(D) 구 `state-machine.js`(601 LOC) 삭제 + `status.js`의 dead 함수(~90 LOC) 삭제 + `state-machine-v050.js`를 `state-machine.js`로 rename**. `status.js`의 `transitionPhase`/`getAvailableTransitions` 호출자 0임을 직접 확인하여 이 옵션이 등장 |
| CP-5 | `lib/registry/agent-registry.js` 처리 | **(B) 유지**. advisor-call.js가 `_shared/*` include 병합에 사용. 미래 확장점 보존 |
| CP-6 | `lib/quality/gate-manager.js` 처리 | **(C-full) v0.55 최후 sub-plan 07에서 완전 활성화**. `auto-judge.js`와 통합하여 메트릭 기반 게이팅 실제 동작. v0.56로 미루지 않고 본 릴리즈에 포함 |
| CP-7 | 에이전트 내부 도구 5종 처리 | **skill_eval**: 유지 (`cso/skill-validator.md` 명시 호출). **refactor-audit** (B1): 삭제 — 과거 v0.48→0.49 리팩터 일회성 도구. **generate-dashboard** (C2): 삭제 대신 `/vais dashboard` 커맨드 진입점 신설. **seo-audit + auditors** (D2): `cbo/seo-analyst.md`에 CLI 호출 가이드 추가하여 활성화 |
| CP-8 | `agents/coo/release-engineer.md` 유지 여부 | **유지** (플러그인 핵심 기능, 사용자 프로젝트 CI/CD 셋업) |

---

## 5. 범위 밖 (Not in scope)

다음은 본 simplification에서 건드리지 않는다 (v0.56+ 별도 플랜).

- 에이전트 개수 감량 (CBO의 10개 sub-agent가 과도한지는 사용량 데이터 수집 후 결정)
- SEO/refactor auditor 툴 재설계
- MCP 서버 활성화 (`mcp/`는 현재 비활성, 변경 없음)
- 기존 에이전트 markdown 내용 자체 (CP/체크포인트/I/O 계약 등) — 사용자가 "마음에 든다"고 언급한 부분

---

## 6. 참조

- v0.50 원본 플랜: `guide/v050_plan/v050-full-overhaul.plan.md`
- v0.50 sub-plan 11종: `guide/v050_plan/v050/00~10-*.plan.md`
- 현재 매니페스트: `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`
- hooks entrypoint: `hooks/hooks.json`
- 본 플랜 sub-files: `guide/v054/00~05-*.plan.md`
