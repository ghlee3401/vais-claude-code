# Sub-plan 05 — Tests & Docs Update (Final)

> 선행: 00, 01, 02, 03, 04, 06, 07, 08 전부
> 담당 SC: SC-6, SC-7, SC-8, SC-9, SC-10
> 갱신: 2026-04-17 전체 CP 결정 반영

---

## 0. 배경

앞 8개 sub-plan(00~04, 06~08)의 변경이 모두 들어간 뒤 마무리 단계:
1. 테스트 목록 정리 (삭제/rename/유지/신규)
2. 문서 (CLAUDE.md, AGENTS.md, README, CHANGELOG) 갱신
3. 버전 동기화 (0.54.1 → 0.55.0)
4. 플러그인 validate script 최종 통과 확인

---

## 1. 테스트 정리

### 1.1 유지 테스트 (기존 16 → 14)

| 테스트 | 대상 | 비고 |
|--------|------|------|
| `tests/paths.test.js` | lib/paths.js | 유지 |
| `tests/status.test.js` | lib/status.js | state-machine rename 후 `transitionPhase` 관련 케이스 삭제 + 기대값 업데이트 |
| `tests/fs-utils.test.js` | lib/fs-utils.js | 유지 |
| `tests/io.test.js` | lib/io.js | 유지 |
| `tests/memory.test.js` | lib/memory.js | 유지 |
| `tests/debug.test.js` | lib/debug.js | 유지 |
| `tests/webhook.test.js` | lib/webhook.js | 유지 |
| `tests/bash-guard.test.js` | scripts/bash-guard.js | 유지 |
| `tests/prompt-handler.test.js` | scripts/prompt-handler.js | 유지 |
| `tests/advisor-integration.test.js` | lib/advisor/* | sub-plan 06에서 wrapper 수정 반영해 갱신 |
| `tests/advisor-degrade.test.js` | lib/control/cost-monitor.js | sub-plan 06에서 wrapper 경로 검증 추가해 갱신 |
| `tests/agent-registry.test.js` | lib/registry/agent-registry.js | CP-5 B — 유지 |
| `tests/gate-manager.test.js` | lib/quality/gate-manager.js | CP-6 C-full — 유지 (sub-plan 07에서 확장) |
| `tests/state-machine.test.js` | lib/core/state-machine.js (rename된) | 03에서 rename. require 경로 수정 완료 |

### 1.2 삭제 테스트 (2)

| 파일 | 이유 |
|------|------|
| `tests/migration-engine.test.js` | 03에서 `lib/core/migration-engine.js` 삭제됨 |
| `tests/scenario-verification.test.js` | 03에서 doc-validator(lib쪽)/state-machine-v050 삭제 후 복합 의존 해소 불가 |

### 1.3 신규 테스트 (3, 선택적)

| 파일 | 목적 | sub-plan |
|------|------|----------|
| `tests/advisor-call-cli.test.js` | advisor-call.js CLI smoke test (mock SDK) | 06 |
| `tests/gate-activation.test.js` | auto-judge ↔ gate-manager 통합 판정 | 07 |
| `tests/dashboard-command.test.js` | `/vais dashboard` 진입점 smoke test | 08 |

각 신규 테스트는 해당 sub-plan에서 직접 작성하는 게 원칙. 05는 **통합 확인**만.

### 1.4 실행 검증

```
node --test tests/*.test.js
npm run lint
```
모두 pass.

---

## 2. 문서 갱신

### 2.1 `CLAUDE.md`

1. "Agent Architecture" — 유지
2. **"Key Configuration" 섹션**:
   - `vais.config.json` 설명에서 `automation` / `guardrails` 항목 제거
   - `advisor` 섹션 설명 갱신 (native/wrapper 2모드 + CLI 호출법)
   - `gates` 섹션 설명 갱신 (07의 threshold 스펙)
3. **"Mandatory Rules" Rule #13**: **변경 없음** (pre-commit 유지).
4. **"Version Management"**: 동일, version 0.55.0 반영
5. **"Testing"** 섹션: `npm test && npm run lint && bash scripts/check-legacy-paths.sh --mode=tree` 3가지 명령 유지

### 2.2 `AGENTS.md`

CLAUDE.md와 이중화되는 핵심 규칙 동일하게 갱신.

### 2.3 `README.md`

- CI 배지(shields.io GitHub Actions) 있다면 삭제 (00에서 이미 처리)
- "개발 환경 셋업" 섹션에서 `npm run lint`, `npm run prepare-hooks`, `npm test` **유지** (도구 전부 살아있음)
- Setup에 `ANTHROPIC_API_KEY` 환경변수 안내 추가 (06 advisor용)
- `/vais dashboard` 커맨드 소개 추가 (08)
- 버전 표기 갱신

### 2.4 `CHANGELOG.md`

신규 `[0.55.0]` 섹션:

```markdown
## [0.55.0] - 2026-04-XX

### Removed
- **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`). 로컬 `npm test`, `npm run lint`, `.hooks/pre-commit`으로 검증. 코드 품질 도구(ESLint/pre-commit/legacy-path-guard)는 전부 유지.
- **Dead code `lib/control/`** (~1,128 LOC): trust-engine, loop-breaker, blast-radius, checkpoint-manager, automation-controller, index — 런타임 호출 0회. (`cost-monitor`는 advisor 활성화에 사용되어 유지)
- **Dead code `lib/pdca/`** (~805 LOC): feature-manager, session-guide, decision-record, automation — `lib/status.js`가 이미 동등 기능 제공.
- **중복 모듈**: `lib/validation/*`, `lib/quality/template-validator.js`, `lib/core/migration-engine.js` 삭제.
- **State-machine 이중화 정리**: 구 `lib/core/state-machine.js`(601 LOC) 삭제 + `lib/status.js`의 dead 함수 `transitionPhase`/`getAvailableTransitions`(~90 LOC) 삭제 + `state-machine-v050.js`를 `state-machine.js`로 rename.
- **Dev tool**: `scripts/refactor-audit.js`(458 LOC) + baseline — v0.48→v0.49 리팩터 일회성 도구 (08).
- **`vais.config.json` 키**: `automation`, `guardrails`, `parallelGroups`, `chaining`, `featureNameValidation`, `featureNameSuggestions` — 소비자 부재.

### Added
- **Advisor 런타임 활성화** (sub-plan 06): `scripts/advisor-call.js` CLI 진입점, session-start hook의 native/wrapper 모드 자동 판정, cost-monitor를 wrapper에서 직접 require하여 spend 추적 + observability 이벤트 발행.
- **Gate 활성화** (sub-plan 07): `scripts/auto-judge.js` ↔ `lib/quality/gate-manager.js` 통합. `scripts/agent-stop.js`에 4-step pipeline (Document → Checkpoint → Gate → Guidance) 구현. `vais.config.json > gates`에 메트릭별 threshold 섹션 신설.
- **Dashboard 커맨드** (sub-plan 08): `/vais dashboard` 스킬 추가 — `scripts/generate-dashboard.js` 진입점 활성화.
- **SEO 활성화** (sub-plan 08): `agents/cbo/seo-analyst.md`에 `scripts/seo-audit.js` CLI 호출 가이드 추가.

### Changed
- `lib/core/state-machine.js` 내용을 v050 6-phase(`ideation` optional 포함) 스펙으로 **교체**. 런타임 require 경로는 동일 (`./core/state-machine`).
- `lib/status.js`에서 FSM 통합 함수 제거 — 호출자 0임을 확인 후 삭제.

### Kept (review된 유지 항목)
- `agents/coo/release-engineer.md` — 사용자 프로젝트 CI/CD 셋업용 (CP-8)
- `lib/advisor/`, `lib/control/cost-monitor.js`, `vais.config.json > advisor` — 06에서 활성화 (CP-3 B)
- `lib/registry/agent-registry.js` — 06이 require (CP-5 B)
- `lib/quality/gate-manager.js`, `tests/gate-manager.test.js` — 07에서 활성화 (CP-6 C-full)
- ESLint, `.hooks/pre-commit`, `scripts/check-legacy-paths.sh` — CI와 별개의 코드 품질 도구 (CP-1/2)
- `scripts/skill_eval/*.py` — `cso/skill-validator.md` 명시 호출

### Migration notes
v0.54.x 사용자는 `.vais/`의 기존 상태 파일과 호환. `vais.config.json`에서 삭제된 키는 자동으로 무시됨. advisor 기능 사용 시 `ANTHROPIC_API_KEY` 환경변수 필요 (native 모드면 Claude Code 자체 처리).
```

### 2.5 Version 동기화

다음 4 파일에서 `0.55.0`으로 갱신:
- `package.json` → `version`
- `vais.config.json` → `version`
- `.claude-plugin/plugin.json` → `version`
- `.claude-plugin/marketplace.json` → `metadata.version` + `plugins[0].version`

### 2.6 Plugin validate

```
node scripts/vais-validate-plugin.js
```
pass 확인.

---

## 3. 검증 (Master SC 전체)

README.md §3의 SC-1~SC-15 전부 확인.

---

## 4. 체크포인트

- [ ] `npm test` 통과
- [ ] `npm run lint` 통과
- [ ] `bash scripts/check-legacy-paths.sh --mode=tree` 통과
- [ ] `node scripts/vais-validate-plugin.js` 통과
- [ ] 모든 sub-plan (00~04, 06~08)의 V-* 검증 통과
- [ ] 버전 4 파일 동기화
- [ ] CHANGELOG.md 기록
- [ ] git status — staged 변경사항 리뷰 후 commit

---

## 5. Out of scope

- 에이전트 개수 / 내용 변경 없음
- skills/phases/*.md 라우터 로직 변경 없음
- `docs/`, `references/`, `templates/` 건드리지 않음
- MCP 서버 재활성화 없음
- CBO sub-agent 수(10개) 감량 — v0.56+ 별도 plan
