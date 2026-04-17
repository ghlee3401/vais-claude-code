# Sub-plan 05 — Tests & Docs Update (Final)

> 선행: 00, 01, 02, 03, 04 전부
> 담당 SC: SC-6, SC-8, SC-9, SC-10

---

## 0. 배경

앞 5개 sub-plan에서 대량 삭제가 발생한다. 이 sub-plan은 마무리로:
1. 테스트 목록 정리 (삭제/신규)
2. 문서 (CLAUDE.md, AGENTS.md, README, CHANGELOG) 갱신
3. 버전 동기화 (0.54.1 → 0.55.0)
4. 플러그인 validate script 최종 통과 확인

---

## 1. 테스트 정리

### 1.1 유지할 테스트 (기존 16 → 11)

| 테스트 | 대상 | 비고 |
|--------|------|------|
| `tests/paths.test.js` | lib/paths.js | 유지 |
| `tests/status.test.js` | lib/status.js | state-machine 교체 후 기대값 업데이트 필요 |
| `tests/fs-utils.test.js` | lib/fs-utils.js | 유지 |
| `tests/io.test.js` | lib/io.js | 유지 |
| `tests/memory.test.js` | lib/memory.js | 유지 |
| `tests/debug.test.js` | lib/debug.js | 유지 |
| `tests/webhook.test.js` | lib/webhook.js | 유지 |
| `tests/bash-guard.test.js` | scripts/bash-guard.js | 유지 |
| `tests/prompt-handler.test.js` | scripts/prompt-handler.js | 유지 |
| `tests/advisor-integration.test.js` | lib/advisor/* | 유지 (sub-plan 06 활성화) |
| `tests/advisor-degrade.test.js` | lib/control/cost-monitor.js | 유지 (sub-plan 06) |

### 1.2 삭제할 테스트 (5)

| 파일 | 이유 |
|------|------|
| `tests/agent-registry.test.js` | lib/registry/* 삭제됨 (CP-5) |
| `tests/gate-manager.test.js` | lib/quality/gate-manager.js 삭제됨 (CP-6) |
| `tests/migration-engine.test.js` | lib/core/migration-engine.js 삭제됨 (sub-plan 03) |
| `tests/scenario-verification.test.js` | registry/doc-validator/state-machine-v050 복합 의존 삭제 |
| `tests/state-machine-v050.test.js` | state-machine.js로 교체 후 (option B) 내용은 기존 state-machine 테스트로 이동 또는 삭제 |

### 1.3 신규 / 보완 테스트 (선택)

| 파일 | 목적 |
|------|------|
| `tests/state-machine.test.js` | state-machine 교체 후 기본 전이 검증 (PHASES, transitionRules) |
| `tests/status.test.js` 추가 케이스 | `ideation` phase 인식 확인 |

신규 작성은 최소화. 삭제된 scenario-verification의 회귀 보장은 수동 walkthrough 체크리스트(v050 10-scenario) 참조.

### 1.4 실행 검증

```
node --test tests/*.test.js
```
실행 결과 pass 전체.

---

## 2. 문서 갱신

### 2.1 `CLAUDE.md`

**삭제/수정 구간**:

1. "Agent Architecture" — 유지
2. **"Key Configuration" 섹션**:
   - `vais.config.json` 설명에서 `automation` / `guardrails` / `advisor` 항목 제거
3. **"Mandatory Rules" Rule #13**: pre-commit 관련 문장 제거 (sub-plan 00에서 이미 수정)
4. **"Version Management"**: 동일, version 0.55.0 반영
5. **"Testing"** 섹션: "npm run lint" 삭제 → "node --test" 만 기록

### 2.2 `AGENTS.md`

CLAUDE.md와 이중화되는 핵심 규칙 동일하게 갱신.

### 2.3 `README.md`

- "CI 배지" (shields.io GitHub Actions) 있다면 삭제
- "개발 환경 셋업" 섹션에서 `npm run prepare-hooks`, `npm run lint` 언급 제거
- 버전 표기 갱신

### 2.4 `CHANGELOG.md`

신규 `[0.55.0]` 섹션:

```markdown
## [0.55.0] - 2026-04-XX

### Removed
- **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`), ESLint 설정, pre-commit hook(`scripts/check-legacy-paths.sh`, `npm run prepare-hooks`). 플러그인 자체 검증은 로컬 `npm test`로 수행.
- **Dead code `lib/control/`** (~1,128 LOC): trust-engine, loop-breaker, blast-radius, checkpoint-manager, automation-controller, index — 런타임 호출 0회. (cost-monitor는 advisor 활성화에 사용되어 유지)
- **Dead code `lib/pdca/`** (~805 LOC): feature-manager, session-guide, decision-record, automation — `lib/status.js`가 이미 동등 기능 제공.
- **중복 모듈**: `lib/quality/`, `lib/registry/`, `lib/validation/` 전체 + `lib/core/migration-engine.js`, `lib/core/state-machine-v050.js` — 테스트에서만 참조.
- **`vais.config.json` 키**: `automation`, `guardrails`, `parallelGroups`, `chaining`, `featureNameValidation`, `featureNameSuggestions` — 소비자 부재.

### Added
- **Advisor 활성화** (sub-plan 06): `scripts/advisor-call.js` CLI 진입점, session-start hook의 모드 판정(`scripts/check-cc-advisor-support.js`), cost-monitor를 wrapper에서 직접 require, agent markdown 호출 가이드 (`agents/_shared/advisor-guard.md`).

### Changed
- `lib/core/state-machine.js`를 v050 6-phase(`ideation` optional 포함) 스펙으로 교체. 런타임 경로는 동일.
- CLAUDE.md Rule #13에서 pre-commit 강제 문구 제거.

### Kept (사용자 확인 후)
- `agents/coo/release-engineer.md` — 사용자 프로젝트 CI/CD 셋업용 에이전트 (플러그인 기능)
- 에이전트 frontmatter의 `advisor.enabled: true` — native 모드에서 Claude Code 내부 해석
- `lib/advisor/`, `lib/control/cost-monitor.js`, `vais.config.json > advisor` — sub-plan 06에서 활성화
- `scripts/generate-dashboard.js`, `scripts/seo-audit.js`, `scripts/refactor-audit.js` 등 에이전트 내부 도구

### Migration notes
v0.54.x 사용자는 `.vais/`의 기존 상태 파일과 호환. `vais.config.json`에서 삭제된 키는 자동으로 무시됨. 추가 마이그레이션 작업 없음.
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

SC-1 ~ SC-10 (README.md §3) 전부 확인. 특히:

| SC | 방법 |
|----|------|
| SC-1 | `ls .github` fail |
| SC-3 | `ls lib/pdca` fail. `ls lib/control/` → cost-monitor.js만 존재 |
| SC-4 | `ls lib/validation lib/quality lib/registry` fail + `lib/core/migration-engine.js`, `lib/core/state-machine-v050.js` fail. `lib/advisor/` 존재 (06에서 활성화) |
| SC-6 | `node --test tests/*.test.js` 전부 pass (advisor 테스트 2종 포함) |
| SC-7 | `grep -rn "lib/pdca\|lib/quality\|lib/registry\|lib/validation\|state-machine-v050\|migration-engine\|trust-engine\|loop-breaker\|blast-radius\|automation-controller\|checkpoint-manager" scripts/ hooks/ lib/` → 0 |
| SC-8 | `grep -rn "lib/pdca\|trust-engine\|loop-breaker" agents/ skills/ templates/` → 0 |
| SC-9 | CHANGELOG에 `## [0.55.0]` 존재 |
| SC-10 | 4 파일 모두 `"version": "0.55.0"` |

---

## 4. 체크포인트

- [ ] `npm test` 통과
- [ ] `node scripts/vais-validate-plugin.js` 통과
- [ ] 모든 삭제 sub-plan (00~03)의 V-* 검증 통과
- [ ] 버전 4 파일 동기화
- [ ] CHANGELOG.md 기록
- [ ] git status — staged 변경사항 리뷰 후 commit

---

## 5. Out of scope

- 에이전트 개수 / 내용 변경 없음
- skills/phases/*.md 라우터 로직 변경 없음
- `docs/`, `references/`, `templates/` 건드리지 않음
- MCP 서버 재활성화 없음
