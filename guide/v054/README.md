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

| 모듈 | LOC | 참조처 |
|------|-----|--------|
| `lib/control/trust-engine.js` | 306 | 아무 데도 require하지 않음 |
| `lib/control/loop-breaker.js` | 206 | 아무 데도 require하지 않음 |
| `lib/control/blast-radius.js` | 254 | 아무 데도 require하지 않음 |
| `lib/control/checkpoint-manager.js` | 263 | 아무 데도 require하지 않음 (실제 CP 가드는 `scripts/cp-guard.js`) |
| `lib/control/automation-controller.js` | 253 | 아무 데도 require하지 않음 |
| `lib/control/cost-monitor.js` | 152 | `tests/advisor-degrade.test.js`에서만 |
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
| `lib/advisor/wrapper.js` | 113 | 테스트에서만 |
| `lib/advisor/prompt-builder.js` | 60 | 테스트에서만 |

**합계: 약 3,840 LOC**가 런타임 실행 경로 바깥의 dead code / test-only code.

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
- `package.json`의 `lint` 스크립트 + `eslint` devDependency
- `eslint.config.js`
- `.hooks/pre-commit` 및 `scripts/check-legacy-paths.sh` (ESLint + legacy guard + test 강제)
- `package.json`의 `prepare-hooks` 스크립트
- CLAUDE.md 의 Rule #13 중 pre-commit 관련 문장

**사용자 프로젝트용 CI (유지, 삭제 아님)**
- `agents/coo/release-engineer.md` — 사용자가 자기 프로젝트에 CI/CD 셋업을 원할 때 쓰는 에이전트
- 이건 플러그인의 핵심 기능이므로 삭제하지 않는다. (사용자가 원한 "CI 쓰는 부분 삭제"는 플러그인 자체 검증 CI로 해석)

> ⚠️ **Checkpoint**: `.hooks/pre-commit`과 release-engineer 삭제 여부는 사용자 확인 후 확정. 기본값은 **pre-commit 삭제 O / release-engineer 유지**.

---

## 2. Sub-plan 목록 & 구현 순서

| # | Sub-plan | 파일 | 선행 | 핵심 변경 |
|---|----------|------|------|-----------|
| 00 | CI Removal | `v054/00-ci-removal.plan.md` | — | `.github/workflows/`, ESLint, pre-commit, legacy-path-guard 제거 |
| 01 | Dead Code — `lib/control/` | `v054/01-lib-control-removal.plan.md` | — | 6 파일 (~1,280 LOC) 제거 + config `automation`/`guardrails` 정리 |
| 02 | Dead Code — `lib/pdca/` | `v054/02-lib-pdca-removal.plan.md` | — | 5 파일 (~805 LOC) 제거 |
| 03 | Duplicate Consolidation | `v054/03-duplicate-modules.plan.md` | — | `lib/validation/*`, `lib/quality/*`, `lib/registry/*`, `lib/advisor/*`, `state-machine-v050.js`, `migration-engine.js` 처리 (삭제 or runtime 연결) |
| 04 | Config Cleanup | `v054/04-config-cleanup.plan.md` | 01, 02, 03 | `vais.config.json`에서 소비자 없는 키 삭제 |
| 05 | Tests & Docs Update | `v054/05-tests-docs.plan.md` | 전체 | 삭제 모듈 관련 테스트 제거, CLAUDE/AGENTS/README/CHANGELOG 갱신, 버전 0.54.1 → 0.55.0 |

**의존성 그래프**
```
00 CI Removal  ─┐
01 control/    ─┼─→ 04 Config Cleanup ─→ 05 Docs/Tests
02 pdca/       ─┤
03 Duplicates  ─┘
```
00~03은 서로 독립이므로 **병렬 가능**. 04는 01~03 완료 후. 05는 최종.

---

## 3. 전역 성공 기준 (Master SC)

| # | Criteria | 검증 |
|---|----------|------|
| SC-1 | `.github/workflows/` 디렉토리 부재 | `ls .github` |
| SC-2 | `package.json`에 `lint` 스크립트 + eslint devDependency 부재 | diff |
| SC-3 | `lib/control/`, `lib/pdca/` 디렉토리 부재 | `ls lib/` |
| SC-4 | `lib/validation/`, `lib/quality/`, `lib/registry/` 처리 결정 (삭제 or 런타임 연결) 완료 | §3 이하 |
| SC-5 | `vais.config.json`에 소비자 없는 키 부재 (automation, guardrails.loopBreaker 등) | diff |
| SC-6 | `npm test` 전부 pass (삭제된 모듈 테스트는 함께 제거) | `node --test tests/*.test.js` |
| SC-7 | `scripts/agent-start.js`, `scripts/agent-stop.js`, `scripts/doc-tracker.js`, `scripts/cp-tracker.js`, `scripts/bash-guard.js`, `hooks/session-start.js`의 require 그래프가 끊긴 곳 없음 | 수동 grep |
| SC-8 | 에이전트 markdown, skill markdown, docs 에 삭제된 모듈 참조 없음 | `grep -r "lib/control\|lib/pdca"` 결과 0 |
| SC-9 | CHANGELOG.md에 v0.55.0 단락 추가 (제거 내역 명시) | diff |
| SC-10 | `version` 키 3 파일 동기화 (package.json, vais.config.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json) | diff |

---

## 4. Checkpoint Decisions (사용자 확인 필요)

각 결정은 Do 단계 진입 전 CEO 체크포인트에서 확정한다.

| # | Decision | Default |
|---|----------|---------|
| CP-1 | `.hooks/pre-commit` 삭제 여부 | **삭제** (사용자가 로컬에서 검증 원할 시 수동 재도입) |
| CP-2 | `eslint.config.js` + ESLint 완전 제거 여부 | **제거** (CI 함께 제거) |
| CP-3 | `lib/advisor/` 처리 방침: (A) 전부 삭제 (B) 런타임 연결 (C) 유지하되 "외부 프롬프트 규격 참고용" 선언 | **(A) 삭제**. advisor beta는 Claude Code에서 frontmatter로 직접 제어하므로 plugin 런타임 코드가 불필요 |
| CP-4 | `lib/core/state-machine-v050.js` 처리: (A) 삭제 (B) 구버전 교체 | **(B) 교체**. 다만 Migration 비용이 크면 (A)로 선회 |
| CP-5 | `lib/registry/agent-registry.js` 처리: (A) 삭제 (B) 런타임 연결 | **(A) 삭제**. includes 병합은 Claude Code 쪽에서 처리, plugin에서 파싱할 필요 없음 |
| CP-6 | `lib/quality/gate-manager.js` 처리: (A) 삭제 (B) `scripts/agent-stop.js`에 연결해 4-step pipeline 구현 | **(A) 삭제**. 현재 scripts/doc-validator + cp-guard 조합이 이미 동작 중이므로 재설계 비용 불필요 |
| CP-7 | `scripts/generate-dashboard.js`, `scripts/refactor-audit.js`, `scripts/seo-audit.js`, `scripts/auditors/*`, `scripts/skill_eval/*` 처리 | **유지**. 에이전트 내부 도구로 문서화되어 있으며 CI 의존이 아님. 별도 검토 필요 시 v0.56로 분리 |
| CP-8 | `agents/coo/release-engineer.md` 유지 여부 (사용자 프로젝트 CI/CD 세팅 에이전트) | **유지** (플러그인 핵심 기능) |

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
