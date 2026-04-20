# Changelog

## [0.58.1] - 2026-04-20 — session-start hook 크래시 핫픽스

타 프로젝트(vais-management 등)에서 구 스키마 `.vais/status.json`(v0.49.x 시절 `rolePhases` 만 있고 `phases` 필드 누락) 이 로드될 때 `lib/status.js:328` 에서 `TypeError: Cannot read properties of undefined` 로 SessionStart hook 전체가 실패하던 문제 수정.

### Fixed

- `lib/status.js` — `getProgressSummary` 와 `updatePhase` 가 `feature.phases` 누락 시 빈 객체로 방어 (TypeError 방지).
- `lib/core/migration.js` — v2→v3 마이그레이션에 `phases` 6단계 백필 추가 (구 스키마 자동 승격).
- `hooks/session-start.js` — 피처별 `getProgressSummary` 호출을 try/catch 로 감싸 한 피처의 스키마 손상이 hook 전체를 죽이지 않도록 방어. 훅 진입 시 `ensureMigrated()` 자동 호출로 구 스키마 자동 승격.
- `.claude-plugin/marketplace.json > metadata.version` — v0.58.0 릴리즈에서 0.57.0 으로 남아있던 stale 값 0.58.1 로 동기화.

## [0.58.0] - 2026-04-20 — C-Level Coexistence

v0.57 `_tmp/` 모델이 sub-agent 경합만 해결하던 공백을 보완. **같은 `{phase}/main.md` 에 여러 C-Level 이 공존**하도록 append-only 멀티-오너 규약 + `## [{C-LEVEL}]` H2 헤딩 섹션 + Multi-owner Decision Record + topic frontmatter `owner` 필수. 사용자 원문: *"여러 c-level이 참여를 해서 문서를 작성하게 되면 기존의 pdca의 main.md에 덮어쓰려는 현상"*.

**F14 (자가 발견 편입)**: v0.57 `_tmp/→topic` 루프가 sub-agent 호출을 전제해서 CTO 직접 작성 phase(UI 없는 메타 피처 등) 에서 main.md 비대화가 재발하는 현상을 진행 중 발견. `mainMdMaxLines` 정책 + `W-MAIN-SIZE` 경고로 해결. 본 피처 문서 자체가 리팩토링되어 규칙을 시연.

### Added

- `vais.config.json > workflow.topicPresets` **v2 스키마** — phase×c-level 계층(`_schemaVersion: 2`). v1 배열 형식 backward-compat 유지.
- `vais.config.json > workflow.cLevelCoexistencePolicy` — `enforcement` / `mainMergeRule`(`append-only` 기본) / `sectionMarkerStyle`(`heading` 기본) / `ownerRequired` / `reentrySectionReplace` / `reentryChangelogRequired` / **`mainMdMaxLines: 200` (F14)** / **`mainMdMaxLinesAction` (F14)**.
- `agents/_shared/clevel-main-guard.md` — canonical guard (11 섹션, v0.58.0 마커). Progressive disclosure 패턴 그대로.
- `scripts/patch-clevel-guard.js` — idempotent 6 C-Level agent md 패치. v0.57 `patch-subdoc-block.js` 선례 재사용.
- `lib/status.js` — 신규 함수 7개: `getTopicPreset`, `registerTopic`, `listFeatureTopics`, `getFeatureTopics`(D-Q6 인터페이스), `listScratchpadAuthors`(D-Q3 헬퍼), `getOwnerSectionPresence`, **`getMainDocSize`(F14)**. status.json `features.{name}.docs.topics[]` 신규 인벤토리.
- `scripts/doc-validator.js` — `validateCoexistence()` + `coexistenceWarnings[]` JSON 필드 + `formatCoexistenceWarnings()`. 경고 코드 5종: **W-OWN-01** (topic frontmatter owner 누락), **W-OWN-02** (owner ∉ C-Level enum), **W-MRG-02** (Decision Record Owner 컬럼 누락), **W-MRG-03** (topic ≥ 2 / owner 섹션 0개), **W-MAIN-SIZE** (F14, main.md > `mainMdMaxLines` AND topic 0 AND `_tmp/` 0).
- 6 C-Level agent md (`agents/{ceo,cpo,cto,cso,cbo,coo}/*.md`) 본문에 clevel-main-guard 블록 주입 (advisor → subdoc → clevel-main 순서).
- `CLAUDE.md` **Rule #15** 신설 — C-Level 공존 원칙. `AGENTS.md` / `README.md` 동기화.
- `templates/{plan,design,do,qa,report}.template.md` — Executive Summary `Contributing C-Levels` 컬럼(plan), Decision Record(multi-owner) Owner 컬럼, `## [{C-LEVEL}]` 플레이스홀더 주석, **size budget 주석 (F14)**, `template version: v0.58.0`.
- `tests/clevel-coexistence.test.js` — T1~T10 케이스(topicPresets v1/v2 lookup, registerTopic/listFeatureTopics 왕복, W-OWN-01/02, W-MRG-02/03, **W-MAIN-SIZE (T9/T10)**, 재진입 규칙).
- **(QA CP-Q B 선택, TD-5)** `lib/patch-block.js` — body-block 주입 공통 헬퍼 (`applyBlockPatch` / `loadBlock` / `patchFile` / `parseCliFlags`). `patch-subdoc-block.js` + `patch-clevel-guard.js` 2종이 thin wrapper 로 전환 (각 ~50 라인).

### Changed

- `vais.config.json > version`: 0.57.0 → 0.58.0.
- `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — 0.58.0.
- **(QA CP-Q B 선택, TD-4)** `scripts/doc-validator.js` W-TPC-01 정규식 완화 — `^##\s+큐레이션 기록` → `^##\s+(?:[\d.]+\s+)?큐레이션\s*기록` (번호 접두 허용). 본 피처 자체 문서 오탐 6건 → 0건.
- **(QA CP-Q B 선택, TD-5)** `scripts/patch-subdoc-block.js` + `scripts/patch-clevel-guard.js` 공통 로직을 `lib/patch-block.js` 로 추출. 기능 동일, idempotent 유지 (2회차 6/6 + 36/36 skip-same-version 확인). `patch-advisor-frontmatter.js` 는 frontmatter 변경이라 범위 밖 유지.

### Compat

- v0.57 `_tmp/` / `subDocs[]` / `subdoc-guard.md` / `subdoc.template.md` / `W-SCP-*` / `W-TPC-01` / `W-IDX-01` / `W-MAIN-01` **전부 무변경**. 기존 v0.56/v0.57 피처 재마이그레이션 없음 (호환성 원칙).
- `topicPresets` v1 배열 형식 (`"01-plan": ["a","b"]`) 도 계속 지원 (`getTopicPreset()` duck-typing).
- `doc-validator.js` exit code 영향 없음 (enforcement=warn 기본).

### Deferred

- `W-MRG-01` (git 이력 기반 이전 섹션 삭제 감지) — v0.58.1.
- F10 CEO 라우팅 컨텍스트 자동 전파 구현(`getFeatureTopics` 인터페이스만 준비) — v0.58.1.
- `enforcement=fail` 강제화 — v0.59+.

### Self-dog-food

- 본 피처 `docs/clevel-doc-coexistence/01-plan/main.md` (81 lines) + `02-design/main.md` (94 lines) — F14 size budget 자가 통과. 3 plan topic + 3 design topic + interface-contract.md 로 분리.

## [0.57.0] - 2026-04-19 — Sub-doc Preservation

C-Level `main.md` 에 축약되어 사라지던 sub-agent 원본 분석을 `_tmp/{agent-slug}.md` scratchpad 로 **영구 보존**하고, C-Level 이 이를 **큐레이션**하여 topic 별 `{topic}.md` 문서로 합성하는 2-layer 문서 모델 도입. 사용자 원문: *"sub agent의 문서를 모두 남기기에는 커지고 비효율적. sub agent 문서를 읽고 c-level이 topic에 맞게 정리"*.

### Added

- **컨벤션 (Batch A)**:
  - `vais.config.json > workflow.docPaths` 확장: `topic`, `scratchpad`, `scratchpadQualified`, `systemArtifacts`
  - `vais.config.json > workflow.topicPresets`: 6 phase × 기본 topic 프리셋 (C-Level 확장 가능)
  - `vais.config.json > workflow.subDocPolicy`: `enforcement` (warn|retry|fail, 기본 warn) + `scratchpadPreserve` + `scratchpadMinBytes` + `requireCurationRecord` + `reportPhase`
  - `agents/_shared/subdoc-guard.md` 신규 (canonical source — 작성 규칙, qualifier, 금지 사항, Handoff 스펙)
  - `templates/subdoc.template.md` 공통 sub-doc 템플릿 (Context / Body / Decisions / Artifacts / Handoff 6섹션)

- **35 sub-agent 일괄 패치 (Batch B)**:
  - `scripts/patch-subdoc-block.js` — idempotent 패치 스크립트 (마커 기반, dry-run / verbose / 버전 교체 지원)
  - 36 sub-agent `.md` 본문에 subdoc-guard 블록 직접 삽입 (C-Level 6 + CEO 2 meta 제외)
  - **중요 발견**: `includes:` frontmatter 는 Claude Code sub-agent 런타임에 미통합 (smoke test 로 검증). Option A (블록 직접 복붙) 로 pivot — `_shared/subdoc-guard.md` 는 source of truth 역할 전환.

- **라이브러리/스크립트/테스트 (Batch C)**:
  - `lib/status.js`: `registerSubDoc / listSubDocs / unregisterSubDoc` 3 함수 + `status.json features.{f}.docs.subDocs[]` 스키마
  - `scripts/doc-validator.js`: `validateSubDocs()` + 6 경고 코드 (`W-SCP-01~03` / `W-TPC-01` / `W-IDX-01` / `W-MAIN-01`)
  - `scripts/auto-judge.js`: `judgeCTO` 에서 `main.md` → `_tmp/qa-engineer.md` fallback 파싱 (Critical 메트릭)
  - 테스트 31 건 신규: `status-subdoc` (13) + `doc-validator-subdoc` (12) + `auto-judge-fallback` (6)
  - 픽스처 3 건: `tests/fixtures/subdoc-{index,engineer,auditor}.sample.md`

- **Release (Batch D)**:
  - 6 C-Level agent md 에 "Sub-doc 인덱스 포맷" 섹션 추가 (`scripts/patch-clevel-subdoc-section.js`)
  - 6 phase 템플릿에 "Topic Documents" + "Scratchpads" 섹션 (template version v0.57.0)
  - `CLAUDE.md` Rule #3 확장 + **Rule #14 신설** (Sub-doc 보존 원칙)
  - `AGENTS.md` 필수 규칙 #7 추가 (동기화)
  - `README.md` Document Structure — 2-layer 모델 + `_tmp/` 도식

### Changed

- `docs/{feature}/{NN-phase}/main.md` 역할 재정의: 의사결정 인덱스 + Topic Documents + Scratchpads (축약 손실 해결)
- Sub-agent 산출물 저장 규칙: ad-hoc (`infra.md`, `review.md`, `strategy.md`, `performance.md`) → `_tmp/{agent-slug}.md` + qualifier
- `lib/registry/agent-registry.js` 의 `loadAgent()` / `mergedBody` 는 **advisor 프롬프트 빌더 전용** 임을 Do 문서 v1.1 에 명시 (runtime agent invocation 에는 미사용)

### Rationale

- v0.56 기준 35+ sub-agent 중 ~5개만 자기 문서 남김. qa-engineer 의 60+ Critical/Important 이슈가 CTO main.md 요약 5줄로 압축되어 **원본 추적 불가**
- 병렬 Do 단계에서 3 agent 가 같은 main.md 에 Write → race condition
- 해결: sub-agent = `_tmp/*.md` 전담, C-Level = 큐레이션 + topic 합성 전담 — race 제거 + 원본 보존 + topic 중심 독서

### Migration

- **기존 v0.56 이전 피처 문서는 무변경** (main.md 단독 허용 유지, `_tmp/` 부재는 경고 대상 아님)
- 신규 피처부터 2-layer 모델 적용 권장
- 기존 ad-hoc sub-doc 5건 은 신규 피처부터 `_tmp/{slug}.md` 또는 `{slug}.{qualifier}.md` 로 이전. `interface-contract.md` 는 시스템 산출물 예외

### Test stats

- 162 pass → **193 pass** (+31) / 0 fail / 3 skipped / 0 회귀
- plugin-validator: 0 오류 / 0 경고

### Known Limitations

- `includes:` frontmatter 는 Claude Code sub-agent runtime 에 **미통합** 확인됨 (이 릴리즈 의 block-direct-inject 가 유일하게 동작하는 방식)
- `loadAgent()` 의 advisor 프롬프트 이외 용도는 별도 감사 필요 (TD-2, TD-3 — 후속 스프린트)
- `guide/v057/*` 재작성은 Batch E 로 이관 (7 파일 대량 편집 — 본 릴리즈 범위 외)
- 특화 템플릿 5종 (engineer/analyst/auditor/designer/researcher) 은 **v0.57.1** 로 이연

## [0.56.2] - 2026-04-18 — Argument Hint 포맷 정렬

### Fixed

- `skills/vais/SKILL.md` argument-hint 를 구 3-토큰 `[action] [feature]` 에서 4-토큰 `[c-level] [phase] [feature]` 로 수정 (output-style 엄격 규칙 일치)
- SKILL.md 인트로 예시 `/vais cto {feature}` → `/vais cto plan {feature}` 로 일관성 확보

## [0.56.1] - 2026-04-17 — Gate Awareness

v0.56.0 에서 gate 파이프라인은 동작하지만 각 agent 가 "어떤 메트릭으로 평가받는지" 모르는 문제를 해소. sub-plan 07 T-11 (Chunk D 중 유일하게 실용 가치 높은 항목) 만 선별 반영.

### Added

- **6 개 C-Level agent markdown 에 "Gate 통과 조건 (v0.56+)" 섹션 추가**:
  - `agents/cpo/cpo.md`: `designCompleteness` — PRD 8 섹션 판정 패턴 (한/영 헤딩 모두), 80자 최소 규칙
  - `agents/cto/cto.md`: `matchRate` + `criticalIssueCount` — Gap analysis saveGapAnalysis 필수, QA doc `Critical: N` 패턴
  - `agents/cso/cso.md`: `criticalIssueCount` + `owaspScore` + **roleOverride** (matchRate 95 / codeQualityScore 80) 명시
  - `agents/cbo/cbo.md`: `marketingScore` = SEO × 0.5 + GTM × 0.5, SEO 점수 + 비용/수익/ROI 3 키워드 파싱 규칙
  - `agents/coo/coo.md`: `opsReadiness` — lint/test/build/deploy 4 키워드 (영문) 언급 필요
  - `agents/ceo/ceo.md`: CEO 는 동적 라우팅 주체 — 자체 gate 없음. C-Level verdict 집계만 명시

### Rationale

- v0.56.0 MVP 에서 `VAIS_GATE_MODE` 기본값 `warn` 이라 agent 가 파싱 규칙 몰라도 차단 없음. 하지만 `strict` 로 쓰려면 agent 가 산출물 작성 시 메트릭 패턴을 알아야 auto-judge 의 false negative 방지.
- Chunk D 의 나머지(T-3 guidance 모듈 분리, T-8 gate-check 갱신) 는 **YAGNI** — 현재 인라인/기존 구조로 충분.

### Test stats

162 pass / 0 fail / 3 skipped (v0.56.0 대비 변화 없음 — agent md 변경은 런타임 영향 없음).

## [0.56.0] - 2026-04-17 — Activation

v0.55 Simplification 으로 정리한 토대 위에 파일만 있고 런타임에 연결되지 않았던 3대 기능(advisor/gate/tools)을 실제 호출 경로로 묶어 동작시킨 릴리즈. sub-plan 06/07/08 전부 포함.

### Added — Advisor 런타임 활성화 (sub-plan 06)

- `scripts/advisor-call.js` (140 LOC): agent markdown 에서 Bash 로 호출하는 fallback CLI 진입점. 4 모드 지원 (disabled/native/wrapper/missing args), stdout=advice / stderr=status.
- `lib/advisor/wrapper.js`: `cost-monitor.checkBudget/recordCall` + `observability.EventLogger` 연결. 각 status (ok/budget_block/unavailable/timeout) 별 이벤트 발행.
- `hooks/session-start.js`: 시작 시 `scripts/check-cc-advisor-support.js` 를 spawnSync 로 실행 → `.vais/advisor-mode.json` 작성 (graceful, 3s timeout).
- `agents/_shared/advisor-guard.md`: Fallback 모드 CLI 호출 가이드 섹션 추가.
- `package.json` → `optionalDependencies`: `@anthropic-ai/sdk ^0.30.0` (미설치 환경에서도 npm install 성공).
- `tests/advisor-integration.test.js` + `tests/advisor-call-cli.test.js`: wrapper 경로 2 + CLI 4 모드 + 단위 1 = 총 7개 테스트 추가.

### Added — Gate 활성화 (sub-plan 07)

- `vais.config.json > gates`: `defaults` (8 메트릭 threshold) + `roleOverrides` (cso: matchRate=95, codeQualityScore=80). 기존 `gates.cto.plan` 유지.
- `scripts/auto-judge.js`: 5 개 judge 함수가 gate-manager 표준 메트릭 반환 (judgeCPO→designCompleteness, judgeCTO→matchRate+criticalIssueCount, judgeCSO→criticalIssueCount+owaspScore, judgeCBO→marketingScore, judgeCOO→opsReadiness).
- `lib/quality/gate-manager.js`: `loadGateConfig()` + `getEffectiveThresholds()` 가 config defaults/roleOverrides 를 GATE_DEFINITIONS 위에 병합.
- `scripts/agent-stop.js`: 4-step pipeline — (1) doc-validator → (2) cp-guard → (3) auto-judge × gate-manager.checkGate → (4) guidance (verdict icon + score + recommendation).
- `VAIS_GATE_MODE` env var (off/warn/strict) 지원: strict + fail 시 exit 1.
- observability: gate event 에 `role/phase/verdict/score/metrics/completion` payload.
- `tests/gate-manager.test.js` 확장 3 + `tests/gate-activation.test.js` 신규 5 = 총 8개 테스트 추가.

### Added — Tools Cleanup (sub-plan 08)

- `/vais dashboard` 커맨드 신설: `skills/vais/utils/dashboard.md` + `skills/vais/SKILL.md` 유틸리티 목록 등록. 출력 경로 `docs/dashboard.html` → `.vais/dashboard.html` 로 변경.
- `agents/cbo/seo-analyst.md`: SEO 감사 CLI (`scripts/seo-audit.js`) 호출 가이드 섹션 추가 (A~O 카테고리, 점수 해석, 워크플로우).

### Removed (sub-plan 08)

- `scripts/refactor-audit.js` (458 LOC): v0.48→v0.49 리팩터 일회성 도구. 런타임 참조 0.

### Changed

- `agents/_shared/advisor-guard.md`: 기존 "native 전제" 가이드에 wrapper 모드 fallback 안내 추가.

### Migration notes

- `VAIS_GATE_MODE`: 기본 `warn` (gate 판정을 stderr 로 출력만, 사용자 흐름 차단 없음). 프로덕션 차단을 원하면 `strict`. 완전 비활성 원하면 `off`.
- `ANTHROPIC_API_KEY` 환경변수 + `@anthropic-ai/sdk` 설치 상태에 따라 `scripts/check-cc-advisor-support.js` 가 자동으로 `wrapper` 또는 `disabled` 모드 판정.
- Chunk D (guidance 모듈 분리, gate-check.js 갱신, agent markdown 의 "gate 통과 조건" 섹션) 는 v0.57+ 로 이연.

### Test stats

162 pass / 0 fail / 3 skipped (v0.55.0 의 148 pass 대비 +14).

## [0.55.0] - 2026-04-17 — Simplification

v0.50 full overhaul 이후 "파일은 만들어졌으나 런타임에 연결되지 않은 모듈"을 전수조사하여 제거. 기능 축소가 아닌 **설계와 실제 사용의 정합성 회복**. 남긴 파일(`lib/advisor/`, `lib/registry/`, `lib/quality/gate-manager.js`, `lib/control/cost-monitor.js`)은 v0.56 "Activation" 릴리즈에서 런타임에 연결 예정.

### Removed

- **CI**: `.github/workflows/ci.yml` 삭제. 플러그인 자체 CI는 Claude Code 마켓플레이스 유통에 필수 아님. 로컬 `npm test`, `npm run lint`, `.hooks/pre-commit`으로 검증. 코드 품질 도구(ESLint/pre-commit/legacy-path-guard)는 전부 유지 (CP-1).
- **Dead code `lib/control/`** (~1,128 LOC): trust-engine, loop-breaker, blast-radius, checkpoint-manager, automation-controller, index — 런타임 호출 0회. (`cost-monitor`는 v0.56 advisor 활성화에 사용되므로 유지)
- **Dead code `lib/pdca/`** (~805 LOC): feature-manager, session-guide, decision-record, automation, index — `lib/status.js`가 이미 동등 기능 제공.
- **중복 모듈**: `lib/validation/*` (scripts/와 중복), `lib/quality/template-validator.js` (소비자 0), `lib/core/migration-engine.js` (런타임은 `lib/core/migration.js` 사용).
- **State-machine 이중화 정리** (CP-4 D): 구 `lib/core/state-machine.js`(601 LOC) 삭제 + `lib/status.js`의 dead 함수 `transitionPhase`/`getAvailableTransitions`(~90 LOC) + `_stateMachine` 헬퍼 삭제 + `state-machine-v050.js` → `state-machine.js` rename.
- **테스트**: `tests/migration-engine.test.js`, `tests/scenario-verification.test.js` 삭제. `tests/state-machine-v050.test.js` → `tests/state-machine.test.js` rename.
- **`vais.config.json` 키 6개**: `automation`, `guardrails`, `parallelGroups`, `chaining`, `featureNameValidation`, `featureNameSuggestions` — 소비자 부재 또는 dead branch만 존재.
- **README.md**: GitHub Actions CI 배지 제거.

### Changed

- `lib/core/state-machine.js`: v050 6-phase(ideation optional) 스펙으로 교체. require 경로는 동일.
- 버전 4 파일 동기화: `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` → `0.55.0`.

### Kept (v0.56 활성화 예정)

- `lib/advisor/` + `lib/control/cost-monitor.js` + `vais.config.json > advisor` — v0.56 sub-plan 06 (CP-3 B)
- `lib/registry/agent-registry.js` — v0.56 sub-plan 06 착수 시 필요성 재판단 (CP-5 B)
- `lib/quality/gate-manager.js` + `tests/gate-manager.test.js` — v0.56 sub-plan 07 (CP-6 C-full)
- `scripts/refactor-audit.js`, `scripts/generate-dashboard.js`, `scripts/seo-audit.js` — v0.56 sub-plan 08
- ESLint, `.hooks/pre-commit`, `scripts/check-legacy-paths.sh` — CI와 별개 (CP-1/2)
- `scripts/skill_eval/*.py` — `cso/skill-validator.md` 명시 호출

### Migration notes

v0.54.x 사용자의 `.vais/` 상태 파일과 완전 호환. `vais.config.json`에서 삭제된 키는 자동 무시됨.

### Next

v0.56.0 "Activation" 릴리즈에서 advisor 런타임, gate 메트릭 파이프라인, `/vais dashboard` 커맨드, SEO 감사 CLI를 차례로 활성화. 세부: `guide/v054/README.md §2.2`.

## [0.54.1] - 2026-04-17

### Changed

- `agents/_shared/ideation-guard.md`: ideation 허용 동작에 **Scope 판단 (첫 turn 필수)** 명시. 30분 내 직접 편집 가능한 요청은 AI가 먼저 "이건 `/vais` 규모 아닙니다. 바로 실행?" 제안
- 종료 트리거를 두 분기로 확장:
  - **A. 요약 + plan** (기존: "plan 가자" / "정리해줘" / "요약") → `docs/{topic}/00-ideation/main.md` 저장
  - **B. 직접 실행** (신규: "그냥 해줘" / "바로 실행" / "skip vais" / "끝") → 문서 없이 종료, PDCA rail 이탈
- `skills/vais/phases/ideation.md`: 진입 처리에 scope probe 단계 추가, 종료 루틴을 A/B로 분리, 경로를 NN- 규약(`00-ideation`)으로 동기화
- `README.md` Ideation 섹션: scope probe + 두 종료 분기 반영

### Removed

- `docs/_legacy/` 전체 (과거 top-level NN- 스냅샷, 보존 가치 소진)
- `docs/ci-bootstrap/`, `docs/legacy-path-guard/`, `docs/docs-structure-redesign/` 문서 — 피처 산출물 자체는 git 이력으로 보존. 과한 PDCA 문서가 검색/참조 노이즈로 작용
- `scripts/check-legacy-paths.sh` EXCEPTIONS에서 위 3개 피처 glob 제거 (더 이상 존재 않음)

### Fixed

- ideation 저장 경로가 오늘 앞선 NN- 마이그레이션(v0.54.0)에서 누락되어 있던 버그 수정

### Note

- 본 릴리즈는 이번 세션의 자기 회고에서 도출. ci-bootstrap + docs-phase-numbering 과정에서 드러난 "AI가 사소한 변경에도 PDCA 풀 사이클을 도는" 패턴 차단 목적

## [0.54.0] - 2026-04-17

### Changed

- docs phase 폴더에 NN- 숫자 접두사 도입: `plan/` → `01-plan/`, `design/` → `02-design/`, `do/` → `03-do/`, `qa/` → `04-qa/`, `report/` → `05-report/` (+`00-ideation/`). 파일 탐색기 알파벳 정렬 == 실행 순서 일치
- 3 피처 × 5 phase = 15 폴더 `git mv` rename
- agents/templates/docs/tests 48개 파일 경로 참조 일괄 업데이트 (255 → 0)
- CLAUDE.md Rule #3 매핑 테이블 추가, Rule #13 각주로 sub-folder 예외 명시
- `vais.config.json`에 `workflow.docPaths` 매핑 테이블 single-source-of-truth 추가
- `tests/paths.test.js` assertion 4개를 새 경로 반영해 업데이트

### Note

- 커맨드 UX는 불변: `/vais cto plan login` 등 phase 이름(`plan`)을 그대로 사용. 내부에서 `01-plan` 폴더로 매핑
- `docs/_legacy/`는 변경 없음 (과거 top-level `docs/NN-` 스냅샷 그대로 보존)
- `scripts/check-legacy-paths.sh` regex(`docs/[0-9][0-9]-`)는 top-level만 검사하므로 수정 불필요 — feature 하위 NN- 접두사는 차단 대상 아님

## [0.53.0] - 2026-04-17

### Added

- `ci-bootstrap`: GitHub Actions CI 워크플로우 신규 도입 (`.github/workflows/ci.yml`) — PR + main push 시 legacy-path-guard + ESLint + Tests 3종 자동 실행
- `scripts/check-legacy-paths.sh`: hook과 CI가 공유하는 legacy-path 검사 스크립트 (`--mode=staged|tree`). 예외 리스트 단일 소스 관리
- `package-lock.json`: ESLint 9.x 의존성 트리 고정 (85 packages) — `npm ci` 기반 결정적 빌드
- README: CI status 뱃지 + branch protection 수동 설정 가이드 섹션
- `docs/ci-bootstrap/` 산출물 3종 (plan/design/do)

### Changed

- `.hooks/pre-commit`: inline legacy-path 블록(28줄)을 공용 스크립트 호출 1줄로 리팩터 — hook/CI drift 방지
- `package.json`: `devDependencies.eslint: ^9.0.0` 명시 (기존 `npx` 온-디맨드 → 고정 버전)

## [0.52.2] - 2026-04-17

### Added

- `legacy-path-guard`: pre-commit hook이 `docs/NN-` 레거시 경로 패턴 커밋을 자동 차단 (기존 `.hooks/pre-commit` 확장)
- CLAUDE.md Rule #13: "레거시 경로 금지" — LLM·사람 공통 가이드라인 명시
- README "Developer Setup" 섹션: `npm run prepare-hooks` 활성화 방법 + 비활성화 + `--no-verify` 금지 안내
- `docs/legacy-path-guard/` dogfooding 산출물 6종 (plan/design/do/qa/report + qa/cso-review sub-doc)

### Changed

- `.hooks/pre-commit`: legacy-path-guard 섹션을 ESLint/tests 앞에 추가하여 fail-fast 제공

### Fixed

- CSO 리뷰에서 발견된 self-blocking deadlock 해결: hook 예외 목록에 `CLAUDE.md` 추가하여 Rule #13 설명 문구가 차기 커밋에서 자기 자신을 차단하지 않도록 함

## [0.52.1] - 2026-04-17

### Fixed

- docs 구조 리디자인(v0.52.0) 잔여 정합성 완결: 30개 파일 레거시 경로 참조 전수 제거
- `tests/paths.test.js` baseline 2 fail 해소 (옛 구조 테스트를 피처 중심으로 리라이트)
- `lib/quality/template-validator.js` phase 추출 로직을 sep 경계 기반으로 수정 (새 구조 `docs/{feature}/{phase}/main.md` 지원)
- `tests/scenario-verification.test.js` S-0 테스트를 피처 중심 구조에 맞게 재정의

### Removed

- `lib/paths.js` `ideationPath()` 함수 및 export 제거 (외부 호출자 0개 확인, 피처 중심 구조로 대체)

### Changed

- 10개 lib/agents/skills/scripts 파일의 `@see` 주석을 `docs/_legacy/` prefix로 갱신 (참조 유효성 유지)
- 6개 에이전트 문서의 sub-doc 규칙 구체화 (infra/interface-contract/review 등)
- README.md Document Structure 블록, CLAUDE.md:29 구조 주석 피처 중심으로 rewrite

### Added

- `tests/paths.test.js` 레거시 경로 사용 금지 회귀 가드 테스트
- `docs/docs-structure-redesign/` dogfooding 산출물 5종 (plan/design/design-sub/do/qa/report)

## [0.52.0] - 2026-04-16

### Changed

- docs 구조를 피처 중심으로 리디자인: `docs/{feature}/{phase}/main.md`
- 기존 phase 중심 docs를 `docs/_legacy/`로 이동
- vais.config.json docPaths 템플릿을 피처 중심 구조로 변경
- lib/paths.js resolveDocPath()에 중첩 디렉토리 자동 생성 추가
- 6개 C-Level 에이전트 산출물 경로를 피처 중심으로 갱신 (139개 경로 치환)
- templates 5개, CLAUDE.md, AGENTS.md 경로 참조 갱신

### Added

- 문서 분할 허용: phase당 main.md + sub-doc 구조 지원

## [0.51.2] - 2026-04-16

### Added

- CEO 추천 블록 위 구분선(`---`) 필수 규칙 추가
- output-styles에 "완료 아웃로" 섹션 신설
- 6개 C-Level 에이전트에 `common-outro` 블록 삽입

## [0.51.1] - 2026-04-16

### Maintenance

- skills/vais/phases/ 내 레거시 리다이렉트 stub 6개 삭제 (backend-engineer, frontend-engineer, infra-architect, qa-engineer, ui-designer, plan)

## [0.51.0] - 2026-04-16

### Added

- `/vais commit` 한국어 한 줄 커밋 메시지 지원 (Conventional Commits prefix 유지)
- 커밋 메시지 특수기호 sanitize 자동 적용 (CI/CD 호환성)
- 버전 반영 시 프로젝트 전체 grep 탐색 (하드코딩 5개 파일 → 전체 탐색)
- CHANGELOG.md 자동 생성 및 type별 섹션 분류

### Changed

- 커밋 메시지에서 multi-line body 제거 (상세 내용은 CHANGELOG에만 기록)

## [0.50.1] - 2026-04-16

### Fixed

- **Hook node resolution**: hooks가 `/bin/sh` 환경에서 `node`를 찾지 못하는 문제 수정. `run-node.sh` portable resolver 추가하여 homebrew, nvm, volta, fnm, nodenv, asdf, system 경로를 순차 탐색.

## [0.50.0] - 2026-04-16

### Major Changes

- **Role Consolidation**: CMO + CFO → **CBO (Chief Business Officer)**. 6 C-Level 구조로 단순화.
- **CBO Sub-agents (10 new/merged)**: market-researcher, customer-segmentation-analyst, seo-analyst, copy-writer, growth-analyst, pricing-analyst, financial-modeler, unit-economics-analyst, finops-analyst, marketing-analytics-analyst.
- **Ideation Phase (Optional Phase 0)**: 아이디어 숙성용 자유 대화 모드. `docs/00-ideation/` 자동 저장 + plan 단계 자동 참조. Rule #2 mandatory 목록에 포함하지 않음.
- **Advisor Tool (M-24)**: 모든 Sonnet sub-agent에 Anthropic Advisor Tool (`advisor_20260301`) 기본 활성화. Opus 4.6 advisor가 mid-generation 전술 판단 보조. `max_uses=3`, ephemeral caching 5m.
- **4-Step Harness Gate**: SubagentStop hook이 Document → Checkpoint → Gate Judgment → Transition 파이프라인 실행.
- **10+1 Scenarios**: S-1 신규 서비스 풀 개발 ~ S-10 정기 운영 + S-0 Ideation.

### Added

- `agents/cbo/` (본체 + 10 sub-agent)
- `agents/ceo/skill-creator.md`, `agents/cpo/backlog-manager.md`
- `agents/cso/secret-scanner.md`, `agents/cso/dependency-analyzer.md`
- `agents/_shared/advisor-guard.md`, `agents/_shared/ideation-guard.md`
- `skills/vais/phases/ideation.md`, `skills/vais/phases/cbo.md`
- `templates/ideation.template.md`, `docs/00-ideation/` 경로
- `lib/advisor/{wrapper,prompt-builder}.js`, `lib/control/cost-monitor.js`
- `lib/core/{state-machine-v050,migration-engine}.js`
- `lib/registry/agent-registry.js`, `lib/validation/{doc-validator,cp-guard}.js`
- `scripts/check-cc-advisor-support.js`, `scripts/patch-advisor-frontmatter.js`

### Changed

- `agents/coo/release-engineer.md` (CTO → COO), `agents/coo/performance-engineer.md` (CTO → COO)
- `vais.config.json` 전면 갱신 (cSuite.roles 6개, advisor 섹션, workflow.phases ideation 포함)
- `lib/quality/gate-manager.js` `judgePhaseCompletion` 추가
- `lib/observability/schema.js` 이벤트 9종 추가
- `hooks/events.json` v3.0.0 (9개 신규 이벤트 타입)
- 모든 Sonnet sub-agent frontmatter에 `advisor:` + `includes:` 필드 추가

### Removed

- `agents/cmo/`, `agents/cfo/` (전 디렉토리)
- `agents/ceo/retrospective-writer.md`, `agents/coo/technical-writer.md`
- `agents/cto/release-engineer.md`, `agents/cto/performance-engineer.md`
- `skills/vais/phases/cmo.md`, `skills/vais/phases/cfo.md`

### Migration

- 기존 `.vais/status.json`의 `cmo_*`, `cfo_*` 항목은 첫 실행 시 `migration-engine.js`가 자동으로 `cbo_*`로 변환 (backup: `.vais/_backup/v049-{timestamp}.tar.gz`).
- 사용자 설정의 cmo/cfo 참조는 수동 업데이트 필요.

## [0.49.2] - 2026-04-09

### Changed

- **[output-style]** `output-styles/vais-default.md` — `💡 다음` 라인에 `/vais {c-level} {phase} {feature}` 4-토큰 포맷 강제 규칙 추가. C-Level 누락(`/vais plan login`) 및 phase 누락 금지 예시 명시. 라우팅 대기 상태의 기본값을 `/vais ceo plan {feature}`로 안내. 스크린샷 제보 기반 개선.

## [0.49.1] - 2026-04-08

### Fixed

- **[CSO 2차 검토 post-push]** — code-reviewer + security-auditor 병렬 2차 위임 결과:
  - `scripts/refactor-audit.js:23` — `execSync` dead import 제거. `execFileSync` 교체 후 미사용 상태로 남아있던 import 정리.
  - `docs/04-qa/cto_refactor-clevel-agents.qa.md` SC-03 — "keywords 8/8 ≥ baseline" → "7/7 ≥ baseline" 수치 정정. v0.49.0에서 `절대금지` dead keyword 제거로 whitelist가 8 → 7개가 되었으나 QA 문서가 이전 수치로 남아있던 문서 불일치 해소.
- **[검증]** 2차 검토에서 v0.49.0의 6건 수정(절대금지 제거/arg 검증/execFileSync/try-catch/CP regex/HEAD 참조) 모두 정확히 반영되었음을 독립 확인. Critical 0건, Gate C 품질 83→88/100, Gate A OWASP 10/10.

## [0.49.0] - 2026-04-08

### Changed

- **7개 C-Level 에이전트 본문 인라인 압축 (−38%, −1,311 lines)** — 공통 보일러플레이트 중복 제거, CP 템플릿 펜스 축약, 도메인 프레임워크 표 형식화. 문장 rewording 금지 원칙으로 의미 손실 0건.
  - `agents/ceo/ceo.md`: 696 → 412 (−284)
  - `agents/cto/cto.md`: 702 → 411 (−291)
  - `agents/cso/cso.md`: 485 → 323 (−162)
  - `agents/cmo/cmo.md`: 441 → 262 (−179)
  - `agents/cfo/cfo.md`: 399 → 247 (−152)
  - `agents/cpo/cpo.md`: 366 → 239 (−127)
  - `agents/coo/coo.md`: 361 → 245 (−116)
  - **합계**: 3,450 → 2,139 (−38%)
- **skill_eval BODY_WARN (>500 lines) 해소** — CEO/CTO가 WARN 상태였으나 전부 PASS로 전환. 7/7 파일 모두 body 500줄 이하.
- **HTML 주석 마커 도입** — `<!-- @refactor:begin/end {id} -->` 7종 (common-rules, checkpoint-rules, contract, context-load, doc-checklist, handoff, work-rules)으로 공통 블록 식별. 향후 자동 추출 앵커 역할.

### Added

- **`scripts/refactor-audit.js`** — C-Level 에이전트 리팩터링 keyword/CP ID/section/phrase/frontmatter 보존 자동 검증 도구. 7개 파일 baseline snapshot(`docs/03-do/ceo_refactor-clevel-agents.baseline.json`) 기반 비교. 명령: `--init`, `--all`, `--file`, `--baseline`, `--targets`.
- **CSO Gate C 독립 코드 리뷰 실행** — code-reviewer + security-auditor 서브에이전트 병렬 위임으로 CTO 자체 감사와 별도의 독립 검증 수행. Critical 0건, 발견된 Major 3건 및 Important 1건 중 4건 즉시 수정, 3건 deferred(설계 의도).

### Fixed

- **[Security] `scripts/refactor-audit.js` execSync → execFileSync** — OWASP A03 Command Injection 잠재 패턴 제거. `execSync(\`git show HEAD:${rel}\`)` 템플릿 리터럴 → `execFileSync('git', ['show', \`HEAD:${rel}\`])` shell-safe 형식으로 변경. 현재 경로상 exploit 불가였으나 구조적 취약 지점 제거.
- **[Audit Tool] dead keyword 제거** — WHITELIST의 `절대금지` (띄어쓰기 없음) 항목이 baseline 0으로 항상 통과하던 문제. 실제 문서는 `절대 금지` (띄어쓰기 있음) 사용. WHITELIST 정리 + 설명 주석.
- **[Audit Tool] CLI 인자 검증 강화** — `--file`, `--baseline` 옵션의 값 미제공 또는 다음 플래그가 값으로 흡수되는 파싱 결함 수정. 다음 인자가 `--`로 시작하거나 없으면 error + exit(2).
- **[Audit Tool] 에러 처리 일관성** — `collectMetrics` fromHead=false 경로에도 try/catch + exit(2) 추가. fromHead=true 경로와 대칭.
- **[Audit Tool] CP ID 추출 정규식 개선** — `/CP-[A-Z0-9]+/g` → `/CP-[A-Z0-9]+(?![a-z])/g`. "CP-Check" 같은 문자열에서 "CP-C" phantom 매칭하던 문제 해결.
- **[Audit Tool] baseline HEAD 참조** — `writeBaseline`이 working tree가 아닌 git HEAD 커밋 기준으로 파일 읽도록 수정. Do 단계 중간에 baseline 재생성해도 pre-refactor 상태 유지.

### Preservation (Verified)

v0.48.2 → v0.49.0 리팩터링 과정에서 다음이 전부 보존됨 (refactor-audit.js + skill_eval + vais-validate-plugin 3단계 감사):

- **CP IDs** (7 파일 × baseline 전부 보존): ceo 8/8, cto 7/7, cso 4/4, cmo 5/5, cpo 4/4, cfo 3/3, coo 3/3
- **Keyword counts** (≥ baseline): AskUserQuestion / 반드시 / 절대 금지 / Plan 단계 범위 / 필수 문서 / 체크포인트 / SubagentStop
- **Mandatory sections** (11/11 × 7 = 77/77): 최우선 규칙 / 단계별 실행 모드 / Plan 단계 범위 제한 / 필수 문서 / Role / 체크포인트 기반 멈춤 규칙 / Contract / Checkpoint / Context Load / 종료 전 필수 문서 체크리스트 / 작업 원칙
- **Mandatory phrases** (4/4): AskUserQuestion 도구를 호출 / 즉시 자동 실행 / 사용자 선택 = 실행 승인 / 자동 연쇄 진행하지 않
- **Frontmatter sha256**: 7/7 불변 (name/version/description/model/tools 변경 0)
- **CSO `## 배포 승인 여부` 헤더**: 문자열 불변 (gate-check.js:179 `/배포\s*승인\s*여부/i` 정규식 호환)
- **파일 경로**: 7/7 불변 (`agents/{c}/{c}.md`)

### Documentation

- `docs/01-plan/ceo_refactor-clevel-agents.plan.md` (CEO 전략 기획)
- `docs/01-plan/cto_refactor-clevel-agents.plan.md` (CTO 기술 기획, baseline 측정)
- `docs/01-plan/cso_refactor-clevel-agents.plan.md` (CSO Gate C+A 기획)
- `docs/02-design/cto_refactor-clevel-agents.design.md` (파일별 섹션 압축 맵, refactor-audit.js 아키텍처)
- `docs/02-design/cso_refactor-clevel-agents.design.md` (Gate C+A 서브에이전트 병렬 위임 계획)
- `docs/03-do/cto_refactor-clevel-agents.do.md` (Do 실행 로그, 기술 부채 기록)
- `docs/03-do/cso_refactor-clevel-agents.do.md` (CSO 리뷰 결과 + 즉시 수정 내역)
- `docs/04-qa/cto_refactor-clevel-agents.qa.md` (SC-01~SC-13 전부 PASS)
- `docs/04-qa/cso_refactor-clevel-agents.qa.md` (OWASP 10/10 + 품질 92+/100)
- `docs/03-do/ceo_refactor-clevel-agents.baseline.json` (감사 baseline snapshot)

### Technical Debt (Deferred)

- `shared/common-rules.md` 외부 파일 추출 (2차 작업)
- CSO 법적 컴플라이언스 체크리스트 / CMO GTM / CFO 가격책정 프레임워크 외부 추출 (2차 작업)
- refactor-audit.js T1~T6 smoke test 자동화
- `file-specific` 체크를 body 전체 검색으로 개선 (현재 section_headers 기반, 실영향 없음)

## [0.48.3] - 2026-04-08

### Fixed

- **AskUserQuestion 응답 후 자동 실행 규칙 추가** — 사용자가 완료 아웃로의 AskUserQuestion에서 "{추천 C-Level} 진행" 등을 선택해도 에이전트가 "다음 명령어를 입력해주세요" 안내만 출력하고 자동 실행하지 않던 UX 버그 수정. 사용자 선택은 명령어 입력과 동등한 명시적 승인으로 간주.
  - `skills/vais/SKILL.md` 완료 아웃로에 **"3단계: 사용자 응답에 따른 자동 실행 (필수)"** 섹션 신설. 선택별 자동 동작 표(`{추천 C-Level} 진행` → `phases/{c}.md` Read → 즉시 실행 등), 금지 안내 문구("명령어를 입력해주세요" 등), **자동 실행 ≠ phase 자동 연쇄** 구분 명시.
  - `skills/vais/phases/*.md` 7개 파일에 "사용자 응답 후 자동 실행 (필수)" 섹션 append — 각 phase 파일에서 AskUserQuestion 응답 후 자체 참조 경로 제공.
  - `agents/*/c*.md` 7개 파일의 동작 규칙 4·5번 재작성:
    - 기존 `4. 완료 후 다음 스텝을 안내합니다: /vais {c} {다음phase} {feature}` → **"다음 스텝(AskUserQuestion)을 제시하고 사용자 응답 시 즉시 자동 실행. '명령어를 입력해주세요' 안내 금지 — 사용자 선택 = 실행 승인"**
    - 기존 `5. 다음 phase로 자동 진행하지 않습니다` → **"다음 phase로 자동 '연쇄' 진행하지 않음. AskUserQuestion 승인 없는 체이닝만 금지. 사용자의 명시적 선택만 실행 트리거"**
- **영향 범위**: `/vais {c} {phase} {feature}` 실행 후 outro 단계의 UX 흐름. 기존 Plan 범위 제한·CP 멈춤 규칙·SubagentStop 훅·phase 연쇄 금지 등 다른 안전 장치는 전부 보존. frontmatter·파일 경로·CP ID 불변.
- **수정 파일 수**: 15개 (SKILL.md + 7 phases/*.md + 7 agents/*/c*.md)

## [0.48.2] - 2026-04-08

### Added

- **`templates/design.template.md` — Part 4 (Tech Stack Lock)**: 백엔드/프론트엔드/인증·인프라 레이어별 기술 결정 + 도입 금지 기술을 명시하는 빈 placeholder 표. CTO design 단계에서 매 feature마다 채움. **특정 기술 스택을 default로 강요하지 않음** — vais-code 범용성 유지.
- **`templates/design.template.md` — Part 5 (Implementation Contract)**: Router/Service/Repository 레이어 책임 표 + API Contract 표(endpoint/method/req/res/auth/error). do 단계 직전 모호성 제거.
- CTO 외 C-Level용 "(N/A — CTO 전용)" 시각 격리 박스 (`plan.template.md` §0.7 패턴 재사용).

### Changed

- **`templates/design.template.md` 다이어트**: Architecture Options 산문 → 비교 표 1개로 압축, 1.4 화면 흐름도 → 1.3 정보구조도에 통합. 286줄 → 300줄 (순증 +14, ≤15줄 가드 준수).

### Fixed

- **CEO/CTO/SKILL — 완료 아웃로 텍스트 선택지 패턴 자체 금지**: "A. 진행 / B. 다른 / C. 종료" 같은 outro 다음 단계 선택지를 응답 본문에 텍스트로 출력하는 행위를 명시적으로 금지. 자가 점검 패턴에 정규식(`(?m)^[A-D]\.\s`) 추가. plugin marketplace cache의 옛 outro template과 충돌 시 본 규칙이 우선함을 명시.
- `agents/cto/cto.md`에 v0.48.1 패치 누락분(AskUserQuestion 강제 사용 절대 규칙) 동기화 추가.

## [0.48.1] - 2026-04-08

### Fixed

- **CEO/SKILL — AskUserQuestion 강제 사용 규칙 명시**: 선택지가 존재하는 모든 순간에 텍스트 A/B/C/D 나열만 하고 응답을 기다리는 패턴을 금지하고, 반드시 `AskUserQuestion` 도구를 호출하도록 최우선 규칙으로 명시. `agents/ceo/ceo.md`의 absorb CP-1 예시도 동적 선택지 생성 방식으로 수정.

## [0.48.0] - 2026-04-08

### ⚠️ BREAKING CHANGES — Sub-Agent Industry Naming (agent-rename-v2)

20개 sub-agent를 업계 표준 직무명으로 rename. 외부 사용자가 직접 호출하던 에이전트명이 변경됨.

#### 매핑 표

| 이전 (v0.47.x) | 신규 (v0.48.0) | C-Level |
|---------------|---------------|---------|
| `dev-backend` | `backend-engineer` | CTO |
| `dev-frontend` | `frontend-engineer` | CTO |
| `test-builder` | `test-engineer` | CTO |
| `bug-investigator` | `incident-responder` | CTO |
| `deploy-ops` | `release-engineer` | CTO/COO |
| `qa-validator` | `qa-engineer` | CTO |
| `validate-plugin` | `plugin-validator` | CSO |
| `compliance-audit` | `compliance-auditor` | CSO/CFO |
| `code-review` | `code-reviewer` | CSO |
| `perf-benchmark` | `performance-engineer` | COO |
| `sre-ops` | `sre-engineer` | COO |
| `canary-monitor` | `release-monitor` | COO |
| `docs-writer` | `technical-writer` | COO/CTO/CPO |
| `pricing-modeler` | `pricing-analyst` | CFO |
| `cost-analyst` | `finops-analyst` | CFO |
| `retro-report` | `retrospective-writer` | CEO |
| `pm-discovery` | `product-discoverer` | CPO |
| `pm-strategy` | `product-strategist` | CPO |
| `pm-research` | `product-researcher` | CPO |
| `pm-prd` | `prd-writer` | CPO |

#### 마이그레이션 가이드

- 기존 워크플로우에서 sub-agent를 직접 참조한 부분이 있다면 위 매핑 표에 따라 갱신
- `.vais/agent-state.json`에 옛 이름이 캐시되어 있을 수 있음 → 백업 후 초기화 또는 마이그레이션
- C-Level 에이전트(ceo/cpo/cto/cso/cmo/coo/cfo)는 변경 없음
- CTO 워크플로우 호출 방식 변경 없음 — 내부적으로 신규 sub-agent 이름 사용

#### 변경 이유

- v0.47.x의 `sub-agent-rename` 작업은 단어 수만 통일했고 직무 표준화는 다루지 못함
- 마켓플레이스 검색성·외부 사용자 인지도 개선
- Cursor/Copilot 등 호환 도구의 직무 매칭 개선
- 일관된 `{도메인}-{직무 접미사}` 패턴: `-engineer`, `-architect`, `-analyst`, `-auditor`, `-designer`, `-writer`, `-researcher`

#### 영향 범위

- 23 파일 rename (agents/ 20개 + skills/vais/phases/ 3개)
- 52개 파일 내부 참조 일괄 갱신
- `vais.config.json` subAgents/parallelGroups 갱신
- CLAUDE.md / AGENTS.md / README.md 테이블 갱신

## [0.47.1] - 2026-04-07

### Fixed

- **codebase-full-audit (23건 패치)**: v0.47 코드베이스 정합·안전성 감사
  - **frontmatter 정합**: CSO/CPO description에 누락된 sub-agents 추가 (CSO에 compliance-audit/skill-validator, CPO에 ux-researcher/data-analyst). CTO description은 9개 나열 → 그룹 요약. CLAUDE.md Architecture 표에 skill-validator 등재
  - **scripts 견고성**: 11개 스크립트(bash-guard, cp-guard, cp-tracker, doc-validator, doc-tracker, prompt-handler, stop-handler, auto-judge, gate-check, agent-start, agent-stop)에 `uncaughtException`/`unhandledRejection` 글로벌 핸들러 일괄 삽입 → graceful exit
  - **agent-stop 차단 정책 완화**: 문서 누락 시 `exit(1)` 차단 → 기본 경고, `VAIS_STRICT_DOCS=1`로 strict 옵트인
  - **bash-guard 우회 패턴**: ASK 패턴에 `rm -rfoo`, `rm --recursive` 추가 매치
  - **doc-tracker null/미치환 가드**: `endsWith('')` false positive 방지
  - **cp-guard silent fail**: `getAgentStartTime`/`getCheckpoints`의 catch 블록에 `debugLog` 추가
  - **session-start UI 렌더 실패**: stderr 경고 메시지 추가
- **lib/paths.js**: 30s TTL 캐시 → mtime + TTL 하이브리드 (세션 중 vais.config.json 수정 즉시 반영)
- **lib/state-store.js**: `execSync('sleep ...')` → `Atomics.wait` (shell injection 면역)
- **lib/status.js**: `validateFeatureName`이 한글 포함 시 stderr 경고 (회귀 방지)
- **vais.config.json**: `workflow._sot` 메타 키로 PDCA 단계 SoT 명시
- **basic/hooks/hooks.json**: `_purpose` 메타 키로 reference 구조 self-documenting

### Notes

- validate-plugin: 0 errors / 0 warnings (38 agents 인식)
- npm test: 109/109 pass
- Success Criteria 7/7 met
- 산출물: `docs/01-plan` ~ `docs/04-qa/cto_codebase-full-audit.*.md`
- 이월 (다음 사이클): L-I1 (lib 순환 의존 주석), L-I3 (status/memory 단일 락), Minor 9건, frontmatter↔표 자동 검증

## [0.47.0] - 2026-04-07

### Added

- **skill-validator 에이전트** (`agents/cso/skill-validator.md`): VAIS 스킬 디렉토리 + 에이전트 .md frontmatter conformance, description 품질(3rd-person, what+when, 1024자, 트리거 키워드), progressive disclosure 검증. 구체적 before/after 수정안 제시. CSO Gate B에서 validate-plugin과 분기 사용
- **`scripts/skill_eval/`**: Apache 2.0 attribution 하에 Anthropic skill-creator 흡수 (`utils.py`, `quick_validate.py`)
- **`NOTICE`**: 제3자 라이선스 attribution 파일 신설
- **CSO Gate B 분기 표**: 플러그인 전체 → validate-plugin / 개별 skill·agent → skill-validator 판단 규칙

### Changed

- **C-Level "CEO 추천" 블록 → AskUserQuestion 강제** (`skills/vais/phases/{cso,cto,cpo,cmo,coo,cfo}.md` + `agents/ceo/ceo.md` CP-L2): 텍스트 A/B/C/D 코드 블록만 출력하고 멈추던 패턴을 제거. 요약 블록 출력 후 반드시 AskUserQuestion 도구를 호출하도록 옵션 명세 추가
- **CSO 체크포인트 separator 길이 두 배**: 38자 → 76자로 가독성 개선

### Fixed

- C-Level phase 완료 시 사용자가 텍스트만 받고 도구 호출 없이 멈추던 UX 회귀

## [0.46.0] - 2026-04-07

### Added

- **CTO plan PRD 소비형 + CP-0 체크포인트** (`cto-plan-prd-consumption`): CTO plan을 CPO PRD(`docs/03-do/cpo_{feature}.do.md`) 입력 기반으로 재정의. PRD 부재/부실 시 CP-0 체크포인트로 4 옵션(CPO먼저/강행/직접제공/중단) 제시. 책임 경계 명확화(CPO=What, CTO=How)와 User Sovereignty 원칙 준수
- **`vais.config.json > gates.cto.plan`**: `requirePrd` (ask/strict/skip) + `completenessThreshold` (기본 6) 신설. 기본값 `ask`로 마이그레이션 무영향
- **`templates/plan.template.md > 0.7 PRD 입력 (CTO 전용)`** 섹션: PRD 경로/완성도/핵심 결정 추출 또는 강행 모드 사유 기록

### Fixed

- **CTO 체크포인트 출력 표 렌더링 (F8)**: CP-1/CP-D/CP-G/CP-2/CP-Q 5개 출력 템플릿의 마크다운 표가 ` ``` ` 펜스 코드 블록 안에 있어 monospace 텍스트로 표시되던 문제 수정. 펜스 밖으로 분리하여 정상 렌더링
- **CTO 체크포인트 도구 호출 강제 (F9)**: CP-D 등에서 텍스트 출력만으로 사용자 응답을 갈음하던 문제 수정. `agents/cto/cto.md` 최우선 규칙에 "AskUserQuestion 도구 호출 필수, 텍스트 출력으로 갈음 금지" 명시 + 모든 CP 섹션 말미에 강제 안내

### Changed

- **`agents/cto/cto.md`**: CP-0 신설(라인 204+), Checkpoint 표에 CP-0 행 추가, Context Load에 L0(PRD 검사) 추가, PDCA Plan 행 본문 보강
- **`agents/cpo/cpo.md`**: 핸드오프 안내 1줄 — `다음: /vais cto plan {feature}` (CTO PRD 자동 사용 안내)

## [0.45.2] - 2026-04-06

### Fixed

- **session-start 버전 플레이스홀더 치환**: `output-styles/vais-default.md`의 `v{version}` 플레이스홀더가 치환되지 않아 응답 하단 리포트에 옛 버전(v0.17.0 등)이 출력되던 문제 수정. `hooks/session-start.js`에서 styleBody 주입 시 현재 버전으로 치환

## [0.45.1] - 2026-04-06

### Fixed

- **SKILL.md 경로 변수 오류 수정**: `${CLAUDE_SKILL_DIR}` → `${CLAUDE_PLUGIN_ROOT}` — 존재하지 않는 변수 참조로 phase/utils 파일을 읽지 못해 에이전트 체크포인트(CP) 기반 A/B/C 선택지가 동작하지 않던 버그 수정

## [0.45.0] - 2026-04-06

### Added

- **CEO 동적 라우팅**: 하드코딩 파이프라인(CPO→CTO→CSO→CMO→COO→CFO) 제거, CEO가 피처 성격 + 산출물 상태 기반으로 다음 C-Level 동적 판단
- **C-Level 완료 후 CEO 추천**: 모든 C-Level phase 완료 시 CEO가 다음 단계를 추천하는 아웃로 트리거
- **config dependencies 맵**: `launchPipeline.dependencies`로 C-Level 간 의존성 선언 (CEO 판단 참조용)

### Changed

- `vais.config.json`: `launchPipeline.order` → `routing: "dynamic"` + `dependencies`
- `agents/ceo/ceo.md`: 서비스 런칭 모드 전면 교체, CP-L2 추천 형식, Full-Auto 동적 판단
- `skills/vais/SKILL.md`: 아웃로 템플릿에 CEO 추천 형식 적용
- `lib/core/state-machine.js`: `getNextPipelineRole` @deprecated 표시

## [0.44.2] - 2026-04-06

### Fixed

- **stop-handler/get-context**: 다음 단계 안내에 C-Level role prefix 누락 수정 (`/vais design` → `/vais cto design`)
- **plan.template**: 다음 단계 안내 커맨드 형식 수정 (`/vais cto design {feature}`)

## [0.44.1] - 2026-04-06

### Fixed

- **checkpoint-manager**: `stableStringify`로 해시 결정성 보장 + checkpoint ID 검증으로 경로 순회 방지
- **loop-breaker**: A→B→A 핑퐁 감지 알고리즘 교체 (tail 역순 2-step 카운팅) + feature reset 시 관련 카운터 정리
- **state-machine**: feature/role 입력 검증 + 미등록 guard 명시적 에러 + NaN 날짜 방어
- **state-store**: CPU 스핀 대기 → `execSync sleep` 전환 + unlock ENOENT 구분
- **migration**: try-catch 3단계 분리 (read/parse/write) + orphan tmp 파일 정리
- **gate-manager**: unmet 메트릭 필터 로직 버그 수정 (`evaluateCondition` 재평가)
- **template-validator**: 섹션 매칭 워드 바운더리 적용 (오탐 방지)
- **feature-manager/trust-engine/status**: NaN 방어 + 입력 검증 추가
- **.gitignore**: `references/` 패턴 간소화

## [0.44.0] - 2026-04-05

### Added

- **bkit-level 실행 제어 인프라 6-Phase 구축** — 17개 신규 모듈 (3,388 LOC)
  - `lib/core/`: 2-Level 선언적 FSM (pipeline + phase), atomic state-store, v2→v3 마이그레이션
  - `lib/quality/`: 7-gate pass/retry/fail 매니저, 템플릿 필수 섹션 검증
  - `lib/control/`: L0-L4 자동화 컨트롤러, SHA-256 체크포인트, 4-rule 루프 방지, 6-rule 폭발 반경, 6-component 신뢰 엔진
  - `lib/pdca/`: Do-lock 피처 매니저, C-Level별 필수 CP (CTO 4/CEO 4/CSO 3), Context Anchor, Decision Record
- **status.js FSM 통합** — transitionPhase/getAvailableTransitions/ensureMigrated 추가 (기존 18개 export 하위호환)
- **vais.config.json** — automation (L0-L4 레벨, 게이트 타임아웃) + guardrails (루프 방지, 폭발 반경) 섹션 추가

## [0.43.3] - 2026-04-05

### Added

- **Plan 단계 구현 금지 규칙** — 7개 C-Level 에이전트에 "⛔ Plan 단계 범위 제한" 섹션 추가
  - Plan에서는 `docs/01-plan/` 산출물만 작성, 프로덕트 파일 생성·수정은 Do에서만 허용
  - CLAUDE.md Mandatory Rule #12 추가: "Plan은 결정, Do는 실행"
  - Plan/Design 템플릿 상단에 범위 경고 추가
- **skill-creator 유틸리티** — Anthropic 공식 skill-creator 스킬 핵심 가이드를 VAIS 유틸리티로 흡수
  - `skills/vais/utils/skill-creator.md` 신규 (SKILL.md 구조, Progressive Disclosure, Description 최적화)
  - SKILL.md 유틸리티 테이블에 skill-creator 행 등록

### Changed

- **README 현행화** — 진입점 2→3가지, 조직도 정식 이름, 유틸리티 목록 추가, 버전 히스토리·트러블슈팅 제거
- **guide.html 현행화** — 버전 v0.43.3, 조직도 정식 이름, 유틸리티 명령어 목록 동기화
- **vendor/README** — 버전 v0.43.3 동기화

## [0.43.2] - 2026-04-05

### Fixed

- **design phase mandatory 승격** — C-Level 간 위임 시 PDCA 단계 누락 방지
  - `vais.config.json`: mandatoryPhases에 design 추가 (plan, do, qa → plan, design, do, qa)
  - `agents/cto/cto.md`: design 산출물을 선택→필수로 변경
  - `agents/ceo/ceo.md`: C-Level 위임 시 PDCA 순차 호출 규칙 신설 (전체 위임 금지)
  - `skills/vais/phases/*.md` (7개): mandatory phase 스킵 금지 로직 + 경고 메시지 추가
  - `CLAUDE.md`: Mandatory Rule #2에 스킵 금지 + 순차 별도 호출 규칙 추가

## [0.43.1] - 2026-04-05

### Changed

- **하위 에이전��� 18개 2단어 kebab-case 리네이밍** — 단일 단어 에이전트를 `{수식어}-{역할}` 패턴으로 통일
  - architect→infra-architect, backend→dev-backend, frontend→dev-frontend, benchmark→perf-benchmark
  - canary→canary-monitor, compliance→compliance-audit, copywriter→copy-writer, database→db-architect
  - design→ui-designer, devops→deploy-ops, growth→growth-analyst, investigate→bug-investigator
  - qa→qa-validator, retro→retro-report, security→security-auditor, seo→seo-analyst, sre→sre-ops, tester→test-builder
  - C-Level 에이전트 참조, vais.config.json, 스킬, 스크립트, 문서 일괄 수정

## [0.43.0] - 2026-04-05

### Added

- **단계별 실행 모드** — 모든 C-Level 에이전트가 단일 phase만 실행 후 멈춤
  - `/vais cto plan my-feature` → plan만 실행 → CP에서 멈추고 사용자 확인
  - `/vais cto my-feature` → status 기반 다음 phase 판별 → 사용자에게 확인 후 실행
  - phases/*.md 7개: `$1`에서 phase 파싱 로직 추가
  - agents/*.md 7개: "단계별 실행 모드" 최우선 규칙 추가

- **bkit 수준 CP 양식 도입** — 체크포인트에서 풍부한 피드백 제공
  - Plan CP: Executive Summary + Context Anchor 테이블 + 3옵션(에이전트/산출물/적합 상황)
  - Design CP: 3가지 아키텍처 비교표 (복잡도/유지보수성/파일수/리스크)
  - Do CP: Decision Record Chain + 실행 계획 + 예상 파일수/변경량 + Success Criteria
  - QA CP: 검증 축별 일치율 + 심각도별 이슈 + Success Criteria 평가 (Met/Partial/Not Met)
  - 모든 CP: 응답에 직접 출력 필수 (파일에만 저장 금지)

### Changed

- SKILL.md: 액션 형식 `[phase] [feature]` 반영, 유틸리티 목록 현행화
- 종료 전 필수 문서 체크리스트를 phase별로 변경 (전체 → 현재 phase만 필수)

### Removed

- `skills/vais/utils/` 8개 파일 삭제 (에이전트로 흡수 완료): analyze-cost, deploy, growth-audit, license-check, pricing, report, test, write-docs

---

## [0.42.1] - 2026-04-05

### Changed

- **refactor(references)**: references 3파일 에이전트/유틸로 흡수 — 죽은 문서 제거
  - `gstack-ethos.md` → CLAUDE.md Rule 9-11 (완전성/탐색우선/사용자주권)
  - `mcp-builder-guide.md` → `skills/vais/utils/mcp-builder.md` 신규 유틸
  - `skill-authoring-guide.md` → `validate-plugin.md` + `absorb-analyzer.md` 분배
  - `ceo.md` absorb 모드 Context Load 참조 경로 수정

---

## [0.42.0] - 2026-04-05

### Added

- **feat(absorb)**: Anthropic 공식 스킬 17개 흡수 — 5건 absorb/merge + 12건 reject
  - `skill-creator` → `references/skill-authoring-guide.md` eval 루프 + description 최적화 방법론 추가
  - `mcp-builder` → `references/mcp-builder-guide.md` MCP 서버 빌드 가이드 신규 생성
  - `webapp-testing` → `agents/cto/tester.md` Playwright E2E 베스트 프랙티스 추가
  - `frontend-design` → `agents/cto/design.md` 프론트엔드 미학 가이드라인 + 안티패턴 추가
  - `doc-coauthoring` → `agents/coo/docs-writer.md` 3-Stage 구조화 문서 작성 워크플로우 추가
  - 12건 reject: claude-api(기존재), Office 도구(docx/pdf/pptx/xlsx), 도메인 외(art/brand/canvas/theme/web-artifacts/slack-gif/internal-comms)

---

## [0.41.1] - 2026-04-05

### Changed

- **refactor(agents)**: 37개 에이전트 frontmatter description을 영어 3인칭 + "Use when:" 형식으로 정규화
  - 실행 에이전트 "직접 호출 금지" Triggers 라인 제거, C-Suite Triggers 키워드 유지
  - CEO/CTO/CSO `## 역할` → `## Role` 영어 요약 변환
- **docs**: CLAUDE.md, AGENTS.md, README.md 에이전트 테이블 Role 열 영어 동기화
  - README.md 누락 하위 에이전트 보충 + 에이전트 수 21→37개 갱신

---

## [0.41.0] - 2026-04-05

### Added

- **feat(absorb)**: Claude Code 공식 best practices 흡수
  - `references/skill-authoring-guide.md` — 스킬/에이전트 작성 가이드라인 신규 생성
  - SKILL.md description을 3인칭 영어 + "Use when:" 형식으로 개선
  - CEO absorb 모드에 `references/_inbox/` 컨벤션 도입 (raw 파일 드롭 → 흡수 → 삭제)
  - absorb PDCA 문서에 Cleanup 단계 추가
  - absorption-ledger에 3건 기록

---

## [0.40.1] - 2026-04-05

### Changed

- **docs(guide)**: guide.html 에이전트·스킬 현행화 반영
  - 버전 v1.0→v0.40.0, 에이전트 25→37개 테이블 갱신
  - Phase 스킬 13개 + Utility 스킬 13개 섹션 추가
  - 유틸리티 명령어 3→10개로 확장
  - C-Suite 조직도 전체 서브에이전트 반영

### Removed

- 이전 피처 산출물 21개 파일 정리 (plan/design/do/qa/report)

---

## [0.39.1] - 2026-04-04

### Changed

- **naming**: 피처명 생성 규칙 개선 — 단어 1개 금지, 의도 기반 2~4단어 kebab-case 패턴 도입
  - `skills/vais/SKILL.md`: 좋은/나쁜 예시, `{대상}-{행위}` 패턴, 한→영 변환 가이드
  - `agents/cto/cto.md`: Feature명 생성 규칙 섹션 신설 (변환 예시 5개)
  - `agents/ceo/ceo.md`: Input 설명에 2~4단어 규칙 명시
  - `CLAUDE.md`: File Conventions 예시를 multi-word로 교체

---

## [0.39.0] - 2026-04-04

### Added

- **agents**: gstack v0.14.5에서 4개 에이전트 흡수
  - `investigate` (CTO) — 체계적 디버깅, Iron Law: 근본 원인 없이 수정 금지
  - `canary` (COO) — 배포 후 카나리 모니터링 (curl/API 기반)
  - `benchmark` (COO) — 성능 벤치마크 + 회귀 감지
  - `retro` (CEO) — 엔지니어링 회고 + 학습 추출
- **security.md**: 런타임 안전 가드레일, Secrets Archaeology, CI/CD·AI/LLM 보안 항목 추가
- **code-review.md**: SQL Safety, LLM Trust Boundary, 조건부 Side-Effect 패턴 추가
- **references/gstack-ethos.md**: gstack 3원칙 참조 문서

### Changed

- **absorption-ledger**: `.vais/` → `docs/` 이전 (git 추적 가능)
- **CEO**: investigate/retro 라우팅, CSO↔CTO 루프에서 investigate 에스컬레이션
- **CTO**: investigate 자동 호출 조건 4가지 (QA 2회 실패, 빌드 실패, CSO 수정 실패, 사용자 요청)
- **COO**: canary/benchmark 서브에이전트 위임 체계

---

## [0.38.3] - 2026-04-04

### Fixed

- **agent-start**: VALID_ROLES에 `code-review` 에이전트 추가 (Gate C 신설 동기화 누락)
- **agent-stop**: observability와 doc 검증 독립 분리 — exit(1) 도달 보장
- **state-writer**: `_save()`에서 `atomicWriteSync()` 적용 (동시 접근 안전성)
- **doc-tracker**: `main()` 내부 들여쓰기 정규화

### Changed

- **CSO 리뷰 문서**: 2차 전체 리뷰 (Gate A+B+C) 갱신 — PASS

---

## [0.38.1] - 2026-04-03

### Fixed

- **README**: CSO 하위 에이전트 code-review 누락 반영 — 조직도, 테이블, 프로젝트 구조 갱신
- **README**: 에이전트 총 개수 20→21개 수정

---

## [0.36.1] - 2026-04-03

### Fixed

- **absorb-evaluator**: path traversal 취약점 수정 (`_assertWithinBoundary` 추가)
- **absorb-evaluator**: 코드 블록 카운트 `Math.floor()` 적용 (홀수 fence 오류)
- **absorb-evaluator**: ledger record 크기 제한 (10KB) 추가

### Changed

- **CLAUDE.md**: 버전 동기화, `basic/` 패턴 참고용 명시 및 리뷰 제외 규칙 추가
- **commit.md**: 버전 일괄 반영 대상 5개 파일 구체적 명시, 불일치 시 커밋 중단 규칙

---

## [0.36.0] - 2026-04-03

### Added

- **absorb-mcp**: absorb 워크플로우에 MCP 흡수 경로 추가
- **absorb-analyzer**: 6단계 MCP 심화 분석 (도구성/래핑 가능성/독립성/재사용성)
- **absorb-evaluator**: `mcpCandidate` 플래그 + `_assessMcpFit` 등 4개 private 메서드
- **CEO absorb Do**: `absorb-mcp` action 분기 (vendor/ 배치 + mcp/ JSON 생성)
- **templates/mcp-server.template.json**: MCP 서버 JSON 템플릿

---

## [0.35.0] - 2026-04-03

### Added

- **basic/**: 하네스 엔지니어링 최소 참조 구조 (CLAUDE.md, agents, skills, hooks, scripts, memory, templates, src)
- **basic/.mcp.json**: MCP 서버 설정 템플릿

---

## [0.33.3] - 2026-04-03

### Fixed

- **bash-guard**: `rm -rf /`, `rm --recursive` BLOCKED 목록 추가 — OWASP A03
- **phase-transition**: CLI `from`/`to` 인자 화이트리스트 검증 추가 — OWASP A01/A08
- **agent-start**: CLI `role` 인자 화이트리스트 검증 추가 — OWASP A01/A08
- **webhook**: `isPrivateHost()` 사설 IP 차단 로직 추가 — OWASP A10 (SSRF)
- **agents/pm-***: `disallowedTools` 필드 추가 (pm-discovery/strategy/research/prd) — Gate B

---

## [0.25.0] - 2026-04-01

### Changed

- **SKILL.md** — 체이닝 문법(`:` 순차, `+` 병렬) 제거. 에이전트 자율 위임 구조로 전환
- **README** — 전면 재작성. GitHub docs 스타일, 체이닝 섹션 제거, Command Format / Executive Roles 구조 정비

### Removed

- 체이닝 파싱 섹션 (`## 체이닝 파싱`, `## 병렬 에이전트 매핑`)
- 체이닝 액션 예시 (`ceo:cpo:cto`, `ceo:cto`, `plan:design:architect`, `frontend+backend`)

---

## [0.24.0] - 2026-04-01

### Added

- **CPO 에이전트 신설** (`agents/cpo.md`) — 제품 방향 + PRD 생성 + pm sub-agents 오케스트레이션
- **CFO 에이전트 stub** (`agents/cfo.md`) — 재무/ROI 분석 역할 예약
- **COO 에이전트 stub** (`agents/coo.md`) — 운영/CI/CD 역할 예약
- **seo sub-agent** (`agents/seo.md`) — CMO에서 분리된 SEO 감사 전용 에이전트
- **security sub-agent** (`agents/security.md`) — CSO Gate A 전용 OWASP 체크리스트 에이전트
- **validate-plugin sub-agent** (`agents/validate-plugin.md`) — CSO Gate B 전용 플러그인 검증 에이전트
- **phases/cpo.md / cfo.md / coo.md** — 각 C-Suite phase 실행 파일

### Changed

- **CMO v2.0** (`agents/cmo.md`) — 인라인 SEO 로직 제거, seo sub-agent 위임 패턴으로 교체
- **CSO v2.0** (`agents/cso.md`) — 인라인 OWASP/plugin 로직 제거, security/validate-plugin sub-agent 위임으로 교체
- **CEO** (`agents/ceo.md`) — CPO/CFO/COO 위임 테이블 추가, `ceo:cpo:cto` 체이닝 지원
- **SKILL.md** — cpo/cfo/coo 액션 추가, `ceo:cpo:cto` 체이닝 예시 추가
- **README** — v0.24.0 기준 전체 리뉴얼 (C-Suite 계층 다이어그램, 에이전트 표, 마이그레이션 가이드)
- **Stop hooks** — 모든 에이전트 `${CLAUDE_PLUGIN_ROOT:-$(pwd)}` fallback 적용 (개발 환경 호환)

### Removed

- `skills/vais-seo/` — 독립 스킬 제거, `agents/seo.md`로 통합
- `skills/vais-validate-plugin/` — 독립 스킬 제거, `agents/validate-plugin.md`로 통합
- `agents/manager.md` — deprecated 에이전트 완전 삭제
- `skills/vais/phases/manager.md` — deprecated phase 파일 삭제
- `skills/vais/phases/auto.md` — deprecated phase 파일 삭제

---

## [0.23.0] - 2026-04-01

### Added

- **C-Suite 아키텍처 v2.0** — 6-레이어 플랫폼 아키텍처 (Phase 1 + Phase 2)
  - `agents/cto.md` — CTO 에이전트 (manager 역할 계승 + 오케스트레이션)
  - `agents/ceo.md` — CEO 에이전트 (비즈니스 전략 + Reference Absorption 지휘)
  - `agents/cmo.md` — CMO 에이전트 (마케팅 + SEO 감사 통합)
  - `agents/cso.md` — CSO 에이전트 (보안 Gate A + 플러그인 검증 Gate B)
  - `skills/vais/phases/cto|ceo|cmo|cso|absorb.md` — 각 C-Suite 워크플로우 지침
- **lib/observability/** — Layer 4 State/Event 모듈
  - `state-writer.js` — `.vais/agent-state.json` 실시간 에이전트 상태 관리
  - `event-logger.js` — `.vais/event-log.jsonl` 감사 로그 (append-only JSONL)
  - `schema.js` — 이벤트 타입 상수 + 페이로드 스키마
  - `rotation.js` — 로그 로테이션 유틸
- **lib/absorb-evaluator.js** — Reference Absorption 평가 엔진
  - checkDuplicate / checkOverlap / assessQuality / assessFit / evaluate / record
  - `docs/absorption-ledger.jsonl` append-only 기록
- **scripts/** — Hook 호출 CLI 래퍼
  - `agent-start.js`, `agent-stop.js`, `phase-transition.js`
- **hooks/events.json** — 이벤트 스키마 문서 (MCP/대시보드 소비용)
- **package.json** — Claude plugin 메타데이터 (`claude-plugin` 필드)

### Changed

- `vais.config.json` → v2.0.0 플랫폼 버전 + `cSuite`, `observability`, `plugin`, `mcp` 섹션 추가
- `hooks/hooks.json` — SubagentStart/Stop 이벤트 훅 추가
- `agents/manager.md` — deprecated redirect → CTO
- `skills/vais/phases/auto.md` — deprecated redirect → CTO
- `skills/vais-seo/SKILL.md` — deprecated redirect → CMO (`/vais cmo`)
- `skills/vais-validate-plugin/SKILL.md` — deprecated redirect → CSO (`/vais cso`)
- `skills/vais/SKILL.md` — cto/ceo/cmo/cso/absorb 액션 추가, manager/auto deprecated 처리

## [0.22.0] - 2026-03-26

### Added

- **vais-seo v2: Clean Architecture 리팩토링** — 단일 seo-audit.js(738줄)를 카테고리별 모듈로 분리
  - `scripts/seo-helpers.js` — 공유 상수/헬퍼 (circular dependency 해결)
  - `scripts/seo-scoring.js` — 카테고리별 가중치 기반 점수 엔진 (100점 만점)
  - `scripts/auditors/html-audit.js` — A~K 기존 카테고리
  - `scripts/auditors/nextjs-audit.js` — Next.js 메타데이터 검사
  - `scripts/auditors/crawlability.js` — **L. 크롤러 접근성** (return null, 인증 게이트, 리다이렉트 탐지)
  - `scripts/auditors/ssr-analysis.js` — **M. SSR/CSR 렌더링 분석** (use client, dynamic ssr:false, Suspense)
  - `scripts/auditors/web-vitals.js` — **N. Core Web Vitals 힌트** (next/image, CLS, 폰트)
  - `scripts/auditors/i18n-seo.js` — **O. 국제화 SEO** (hreflang, alternates, locale)
- **SKILL.md**: 16개 카테고리(A~O) + 점수 시스템 문서화

## [0.21.0] - 2026-03-26

### Added

- **인터랙티브 패턴 보강** — 11개 phase 파일에 multiSelect, preview, scope 패턴 추가
  - **multiSelect**: plan(MVP 기능), frontend(컴포넌트), qa(이슈 선택), init(피처 선택) — 4개 phase
  - **preview**: design(설계안 구조), plan(UI 라이브러리), architect(DB 설정), commit(버전 diff) — 4개 phase
  - **scope**: frontend(모듈 범위), backend(API 그룹), qa(검사 범위) — 3개 phase
  - **신규 AskUserQuestion**: backend(구현 승인), manager(영향 확인), next(다음 단계), status(액션 실행) — 4개 phase
  - 모든 신규 패턴에 auto 모드 호환 (기본값 자동 선택)
- **PDCA 문서**: interactive-patterns Plan/Design/Analysis/Report

## [0.20.2] - 2026-03-26

### Changed

- **review → qa 롤백** — `review`보다 `qa`가 더 직관적이라는 판단
  - Agent: `review` → `qa`
  - Phase: `review` → `qa`
  - 문서 경로: `docs/04-review/` → `docs/04-qa/`

## [0.20.1] - 2026-03-26

### Changed

- **Agent 리네이밍** — 도메인 중심 명명으로 통일 (manager만 역할자 유지)
  - `designer` → `design`
  - `builder` → `architect`
  - `frontender` → `frontend`
  - `backender` → `backend`
  - `reviewer` → `review`
- **Phase 리네이밍** — 약어를 풀네임으로 변경
  - `infra` → `architect`
  - `fe` → `frontend`
  - `be` → `backend`
  - `qa` → `review`
- **체이닝 문법 변경** — `/vais frontend+backend`, `/vais plan:design:architect`
- **전체 참조 업데이트** — vais.config.json, AGENTS.md, README.md, SKILL.md, phase 파일, 스크립트, 테스트 등 25+ 파일

## [0.20.0] - 2026-03-26

### Added

- **SessionStart Progress Bar** — 피처 진행률을 시각적 바로 표시 (`lib/ui/progress-bar.js`)
- **SessionStart Workflow Map** — 7단계 워크플로우를 화살표 체인으로 시각화 (`lib/ui/workflow-map.js`)
- **Output Style 자동 주입** — `vais-default.md`를 SessionStart에서 자동 주입 (SSoT)

### Changed

- **SessionStart hook 모듈화** — `buildReportRule()` 하드코딩 제거, thin orchestrator로 리팩토링
- **에러 격리 강화** — Progress Bar, Workflow Map, Output Style 각각 독립 try-catch

---

## [0.19.1] - 2026-03-25

### Fixed

- **commit phase 확인 누락 방지** — 버전 범프 불필요(None) 판단 시에도 반드시 AskUserQuestion으로 사용자 확인 필수 규칙 추가

---

## [0.19.0] - 2026-03-25

### Changed

- **에이전트 리네이밍** — 역할 기반 `-er` 패턴으로 통일
  - `infra-dev` → `builder`
  - `frontend-dev` → `frontender`
  - `backend-dev` → `backender`
  - `qa` → `reviewer`
- **agent .md 변경이력 제거** — 토큰 절약 (AGENTS.md 포함)
- 전체 참조 일괄 업데이트: vais.config.json, SKILL.md, AGENTS.md, README, phase 파일, output-styles

---

## [0.18.1] - 2026-03-25

### Added

- **commit phase에 자동 semver 판단 + 버전 일괄 반영** — 커밋 전 변경 규모를 분석하여 major/minor/patch 제안, 7곳 버전 참조 일괄 업데이트

---

## [0.18.0] - 2026-03-25

### Added

- **PDCA 문서 퀄리티 대폭 개선** — bkit 수준의 문서 구조 달성
  - Plan 템플릿: Executive Summary, Context Anchor, Success Criteria, Impact Analysis 추가
  - Design 템플릿: Architecture Options (3안 비교), Session Guide (Module Map) 추가
  - QA 템플릿: Architecture/Convention Compliance, Success Criteria Evaluation 추가
  - Report 템플릿/phase 신규 생성 — Value Delivered, Keep/Problem/Try 회고
- **Phase 간 컨텍스트 연결 메커니즘**
  - Plan: Checkpoint 1 (요구사항 확인) + Checkpoint 2 (명확화 질문)
  - Design: Upstream Context Loading + Checkpoint 3 (설계안 선택) + Session Guide 생성
  - FE/BE: Upstream Context Loading + Code Comment Convention (`// Design Ref:`, `// Plan SC:`)
  - QA: Checkpoint 5 (리뷰 결정) + Architecture/Convention 검증 + Success Criteria 평가
- **output-style 미적용 수정** — plugin.json `outputStyles` 필드 복원, SessionStart hook 하단 리포트 주입
- **report 액션 등록** — `/vais report {feature}` 워크플로우 지원

### Changed

- 모든 템플릿 버전을 v0.18.0으로 통일
- `vais.config.json` phases 배열에 `"report"` 추가, phaseNames에 `"보고서"` 추가

---

## [0.17.0] - 2026-03-25

### Changed

- 버전 범프 (0.16.1 → 0.17.0)

---

## [0.16.1] - 2026-03-24

### Fixed

- **버전 불일치 수정** — `vais.config.json`이 0.15.0으로 뒤처져 있던 문제 수정
- **전체 버전 통일** — 모든 파일의 버전 참조를 0.16.1로 일괄 업데이트

---

## [0.16.0] - 2026-03-23

### Added

- **SEO Audit Next.js 강화** — `scripts/seo-audit.js`에 Next.js `generateMetadata` API 검사 추가 (~250줄)
  - `auditNextJSMetadata()`, `auditStaticMetadataFields()`, `auditGenerateMetadataPattern()`, `auditViewportExport()`, `auditMetadataBase()`, `auditNextJSFileMetadata()` 함수 추가
  - Next.js 메타데이터 생성 패턴 및 정적 메타데이터 필드 자동 검사
- **SEO Audit 테스트** — `tests/seo-audit.test.js` 신규 작성 (35개 테스트, 9개 suite)
  - SEO Audit 함수 검증 및 에러 핸들링 테스트
- **Designer Agent 디자인 크리틱 추가** — `agents/designer.md` v2.1.0
  - 시니어 디자이너 관점 UI 코드 리뷰 (7개 관점: Visual Hierarchy, Spacing, Typography, Color, Consistency, Accessibility, Feedback & States)
- **Design Phase 보강** — `skills/vais/phases/design.md`에 Part 4: Design Review 추가 (Steps 12-16)
  - UI 코드 리뷰 및 디자인 크리틱 통합
- **QA Agent Expert Code Review 추가** — `agents/qa.md` v1.1.0
  - Google Staff Engineer(L7) 관점 심층 코드 크리틱 (8개 관점)
- **QA Phase 보강** — `skills/vais/phases/qa.md`에 Step 5.5: Expert Code Review 추가
- **QA Report 생성** — `docs/04-qa/vais-code.md` — 전체 QA 보고서

### Changed

- **SEO Audit 확장성 개선** — 기존 기본 SEO 검사에서 Next.js 특화 검사로 확장
- **Design/QA 단계 깊이 강화** — UI 코드 크리틱과 전문가 코드 리뷰 프로세스 추가

---

## [0.15.0] - 2026-03-20

### Changed (Breaking)

- **9→6단계 워크플로우 리스트럭처링**
  - research + plan → **plan** (아이디어 탐색, MVP 범위, 요구사항, 정책, 코딩 규칙 통합)
  - ia + wireframe + design → **design** (IA + 와이어프레임 + UI 설계 통합)
  - check + review → **qa** (Gap 분석 + 코드 리뷰 + 보안 + QA 통합)
  - 문서 경로: `docs/01-plan/`, `docs/02-design/`, `docs/03-infra/`, `docs/04-qa/`
- **에이전트 팀 재편**
  - manager + tech-lead → **manager** (Plan 실행 + 전체 오케스트레이션 + Gate 판정)
  - reviewer → **qa** (Gap + 리뷰 + 보안 + 테스트 통합)
  - `agents/tech-lead.md`, `agents/reviewer.md` 삭제
- **Gate 2→4개 확장** — plan, design, infra, fe 각 단계 완료 시 바이너리 체크리스트 판정
- **설계 병렬화 제거** — design 단계에서 UI+DB 병렬 실행 제거. DB는 infra 단계에서 처리

### Added

- **infra 단계** — DB 스키마, 마이그레이션, ORM, 환경변수, 프로젝트 설정 담당
- **infra-dev 에이전트** (`agents/infra-dev.md`) — infra 단계 전담
- **qa 에이전트** (`agents/qa.md`) — QA 단계 전담 (리턴 경로 포함)
- **Interface Contract** — Gate 2에서 Manager가 Plan(데이터 모델) + Design(화면-데이터) 합성 → API 스펙 확정
- **QA 리턴 경로** — QA 산출물에 `target agent + fix_hint + return_to` 포함. Manager가 라우팅
- **Manager 컨텍스트 위생** — 매 단계 산출물 파일 저장. Gate 판정 시 해당 단계 산출물 + 체크리스트만 로드
- **수정 체이닝 테이블** — UI/레이아웃, 스타일, 기능 변경, 정책 변경, 데이터 변경 등 유형별 최적 체이닝 경로
- `templates/infra.template.md`, `templates/qa.template.md` 신규 생성
- `skills/vais/phases/infra.md`, `skills/vais/phases/qa.md` 신규 생성

### Removed

- `agents/tech-lead.md` — manager에 흡수
- `agents/reviewer.md` — qa로 대체
- `skills/vais/phases/research.md` — plan에 흡수
- `skills/vais/phases/ia.md` — design에 흡수
- `skills/vais/phases/wireframe.md` — design에 흡수
- `skills/vais/phases/check.md` — qa에 흡수
- `skills/vais/phases/review.md` — qa에 흡수
- `templates/research.template.md`, `ia.template.md`, `wireframe.template.md`, `db.template.md`, `check.template.md`, `review.template.md`

---

## [0.14.1] - 2026-03-19

### Fixed

- **[CRITICAL] bash-guard 테스트/코드 패턴 통합** — 테스트가 패턴을 인라인 복사하던 구조에서 실제 스크립트의 `checkGuard()` 함수를 import하도록 리팩토링. 패턴 불일치로 인한 보안 취약점 해소
- **[CRITICAL] Feature name path traversal 방지** — `validateFeatureName()` 추가. `../evil`, `path/traversal` 등 경로 탐색 문자 차단. 허용: 한글, 영문, 숫자, `-`, `_`
- **[CRITICAL] 원자적 파일 쓰기** — `status.js`, `memory.js`에서 `writeFileSync` → `tmp + rename` 패턴으로 전환. 동시 세션에서의 데이터 손실 방지
- **Memory maxEntries 제한** — `addEntry()` 시 `vais.config.json`의 `maxEntries`(기본 500) 초과분 자동 삭제
- **Memory ID 충돌 방지** — 순차 번호(`m-001`)에서 타임스탬프+랜덤 기반(`m-{ts}-{hex}`)으로 전환
- **Config cache TTL** — 무한 캐싱에서 30초 TTL로 변경. 세션 중 설정 파일 변경 시 자동 반영
- **Webhook 재시도 + URL 검증** — 1회 재시도 로직 추가, URL 사전 검증, 프로토콜 감지를 URL.protocol 기반으로 개선
- **debug.js** — 로그 쓰기 실패 시 stderr 경고 출력 (기존: 무시)
- **io.js** — stdin 접근 에러와 JSON 파싱 에러를 구분하여 stderr에 원인 표시
- **paths.js resolveDocPath** — 미치환 템플릿 변수(`{xxx}`) 잔존 시 빈 문자열 반환
- **generate-dashboard.js** — `escapeHtml`에 `"` → `&quot;`, `'` → `&#39;` 추가
- **get-context.js** — `require.resolve()`로 모듈 경로 사전 검증
- **stop-handler.js** — `summary.phases` 누락 시 방어 처리 추가
- **vais.config.json** — 미사용 `skipGatesInRange` 필드 제거

### Added

- `featureNameValidation` 설정 블록 (`vais.config.json`)
- `clearConfigCache()` 함수 (`lib/paths.js`) — 테스트에서 캐시 초기화용
- `validateFeatureName()` export (`lib/status.js`)
- **MCP 서버 파라미터 제한** — `minLength`, `maxLength`, `minimum`, `maximum` 추가
- **plugin.json** — `homepage`, `bugs`, `requiredClaudeCodeVersion` 필드 추가
- **output-styles** — 병렬 실행 결과, 에러 상태 포맷 추가. 버전 표시를 `v{version}` 동적 플레이스홀더로 변경
- **vendor/README.md** — 디자인 시스템 라이선스, 용도, 크기 정보 문서화
- **README** — 설치 확인 섹션, 첫 피처 워크스루, 트러블슈팅 섹션 추가
- **tests/prompt-handler.test.js** — 체이닝/범위 패턴 매칭 테스트 11건
- **tests/status.test.js** — `validateFeatureName` 테스트 9건
- 전체 101건 테스트 통과

### Changed

- **hooks.json** — doc-tracker, prompt-handler 타임아웃 3초 → 5초
- **marketplace.json** — 버전 0.13.0 → 0.14.1
- 전체 템플릿 버전 v0.14.1로 통일

---

## [0.14.0] - 2026-03-19

### Added

- **Agent Teams 네이티브 통합** — Claude Code Agent Teams 구조 적용
  - `vais.config.json`에 `agentTeam` 설정 추가 (orchestrator, roles, routing)
  - `plugin.json`에 `agentTeam` 선언 (에이전트 디렉토리, 오케스트레이터)
  - 6개 에이전트 frontmatter에 `team`, `role`, `delegates_to` 메타데이터 추가
  - 병렬 라우팅(design, implementation)과 council 패턴을 선언적 구성으로 정의
- **MCP Tool Search — vendor 디자인 시스템 lazy loading** (`mcp/design-system-server.json`)
  - `design_search`: BM25 기반 스타일/컬러/폰트/UX 검색
  - `design_system_generate`: 디자인 토큰 MASTER.md 자동 생성
  - `design_stack_search`: 스택별 (html-tailwind, react, nextjs) UI 가이드라인 검색
  - `lazyLoad: true` — design/wireframe 단계에서만 활성화, 컨텍스트 사용량 절감
- **HTTP Webhook 공용 유틸리티** (`lib/webhook.js`)
  - `sendWebhook(event, data)` — fire-and-forget HTTP POST 전송
  - `VAIS_WEBHOOK_URL` 환경변수로 활성화 (미설정 시 무동작)
  - 전송 실패해도 워크플로우 차단 안 함
  - 4개 훅 스크립트에 연동:
    - `session-start.js` → `session_start` (세션 시작, 프로젝트/피처 정보)
    - `doc-tracker.js` → `phase_complete` (단계 완료, 피처/단계/파일)
    - `stop-handler.js` → `stop` (응답 완료, 진행률/다음 단계)
  - 웹훅 테스트 4개 추가 (서버 수신 확인, 실패 안전성 검증)
- **Memory Timestamps** — 메모리 신선도 추적
  - `memory.json` v1 → v2: `lastModified` 필드 추가, 저장 시 자동 갱신
  - `getMemoryAge()` 유틸리티: 마지막 수정 시간, 경과 분, stale 여부 반환
  - v1 메모리 자동 마이그레이션 (기존 데이터 무손실)
  - 테스트 3개 추가 (lastModified 갱신, getMemoryAge, v1 마이그레이션)
- **ESLint + EditorConfig** — 코드 품질 기반 도구
  - `.editorconfig`: indent 2 spaces, LF, UTF-8, trailing whitespace 제거
  - `.eslintrc.json`: no-eval, eqeqeq, no-var, prefer-const 등 핵심 규칙
  - vendor/, docs/ 디렉토리 제외

---

## [0.13.0] - 2026-03-18

### Changed

- **fix 액션을 manager로 통합** — `/vais fix`를 제거하고 영향 분석·수정 체이닝·검증 로직을 Manager Command 모드에 흡수
  - 기존: `/vais fix` → Manager 호출 → Tech Lead 위임 (불필요한 중간 단계)
  - 변경: `/vais manager "수정 요청"` → 직접 영향 분석 → Tech Lead 위임 (단일 진입점)
  - Manager가 수정 유형별 영향 범위 분석, 체이닝 결정, 검증까지 일괄 처리
- **agents/manager.md** — 영향 분석 테이블, 수정 체이닝 매핑, 재귀 방지, 검증 로직 추가
- **prompt-handler.js** — `/vais fix` 키워드를 manager로 라우팅
- **SKILL.md** — manager 설명에 "영향 분석 기반 수정" 추가, 트리거에서 `fix` 제거

### Removed

- `skills/vais/phases/fix.md` — fix 단독 액션 삭제
- SKILL.md 액션 목록에서 `fix [feature]` 행 삭제
- help.md 커맨드 목록에서 `/vais fix` 제거

---

## [0.12.0] - 2026-03-17

### Added

- **UI/UX Pro Max 번들** (`vendor/ui-ux-pro-max/`) — nextlevelbuilder/ui-ux-pro-max-skill (MIT) 번들 통합
  - 50+ 스타일, 161 컬러 팔레트, 57 폰트 페어링, 161 제품 유형, 99 UX 가이드라인
  - BM25 검색 엔진 (Python) + CSV 데이터셋
  - design 단계에서 `--design-system` 명령으로 디자인 토큰 자동 생성
  - `design-system/{feature}/MASTER.md` 출력 → designer 에이전트가 소비

### Changed

- **design 단계 역할 분리** — UI/UX Pro Max가 토큰 생성, designer 에이전트가 토큰 소비
- **designer 에이전트** — 토큰 소비자 역할 명확화, design-system/ 참조 규칙 추가
- **fe 단계** — `design-system/{feature}/MASTER.md` 참조 단계 추가

---

## [0.11.2] - 2026-03-17

### Changed

- **init(역설계) 템플릿 통일** — 각 단계별 `templates/*.template.md` 참조 추가, 정상 설계와 동일한 문서 구조 보장
- **플레이스홀더 통일** — 모든 phase 스킬 파일의 경로 표기를 `$1` → `{feature}`로 변경 (`vais.config.json` docPaths와 일치)
- **init feature registry 생성** — 역설계 시에도 `.vais/features/{feature}.json` 생성하도록 Step 4 추가
- **init check/review 범위 명시** — 역설계는 research~design만 생성, check/review는 별도 실행임을 명시

---

## [0.11.1] - 2026-03-17

### Added

- **`.claude/settings.json` 훅 등록** — 플러그인 미설치 환경에서도 Stop, UserPromptSubmit, PreToolUse, PostToolUse 훅이 동작하도록 프로젝트 설정 파일 추가

---

## [0.10.0] - 2026-03-15

### Added

- **Manager 에이전트** — 프로젝트 최상위 의사결정자. 전체 히스토리 기억, 피처 간 의존성 관리, Tech Lead 지시
  - `/vais manager` — Query 모드 (프로젝트 현황, 피처 히스토리, 의존성, 기술 부채 조회)
  - `/vais manager "자연어"` — Command 모드 (판단 후 Tech Lead에 위임)
  - 두 가지 모드: Query (질의 → memory 조회 → 답변), Command (실행 요청 → 판단 → Tech Lead 지시)
- **Memory 시스템** (`lib/memory.js`) — `.vais/memory.json` 영속 메모리
  - 7가지 엔트리 타입: decision, change, feedback, dependency, debt, error, milestone
  - 피처별/타입별/기간별 조회, 의존성 맵, 기술 부채 관리, 프로젝트 요약
- **doc-tracker memory 연동** — 단계 완료 시 milestone 자동 기록

### Changed

- **auto 워크플로우** — Manager → Tech Lead 경유 구조로 변경
- **fix 워크플로우** — Manager 경유 크로스-피처 영향 분석 추가 (Step 0, Step 7) *(v0.13.0에서 manager로 통합됨)*
- **SKILL.md** — manager 트리거 키워드 추가 (매니저, 현황, 히스토리, 부채, 의존성, 브리핑)
- **vais.config.json** — manager 설정 섹션 추가, team.maxTeammates 5→6
- **에이전트 계층 구조**: Manager (What & Why) → Tech Lead (How) → 전문 에이전트팀

---

## [0.9.1] - 2026-03-15

### Changed

- **README.md 전면 개선** — 중복 제거(체이닝 예시·auto 설명·병렬 매핑·설정 JSON+표), 빠른 시작 경량화, 변경 이력은 CHANGELOG 링크로 대체
- **제목 아래 버전·수정일 한 줄 표시** — `**v0.9.1** · 최종 수정 2026-03-14`
- **전체 날짜 수정** — 모든 파일의 2025 날짜를 2026-03-14로 통일

---

## [0.9.0] - 2026-03-14

### Changed

- **wireframe 스킬 통합** — 별도 `/wireframe` 스킬을 `/vais wireframe`으로 통합. 옵션(`--format`, `--device`) 및 컴포넌트 라이브러리를 wireframe 페이즈에 병합
- **fix 체이닝 방식 전환** — 직접 문서/코드 수정에서 영향 분석 후 적절한 단계 체이닝 실행으로 변경
- **check Gap 방향 판단** — Gap 발견 시 AskUserQuestion으로 구현 수정/설계 수정 선택권 부여

---

## [0.8.8] - 2026-03-14

### Fixed

- **`vais.config.json` gates 불일치** — `["plan", "design"]` → `["plan", "fe"]` (tech-lead.md와 동기화)
- **`plugin.json` hooks 경로** — `./hooks/hooks.json` → `../hooks/hooks.json` (plugin.json 기준 상대 경로)

---

## [0.8.7] - 2026-03-14

### Fixed

- **`status.js` 중복 조건문 제거** — `updatePhase()`에서 `idx + 1 < phases.length` 조건이 외부 조건과 중복
- **피처명 빈값 검증** — `initFeature()`, `saveFeatureRegistry()`에 빈 문자열/null 검증 추가
- **`loadConfig()` 캐싱** — 같은 프로세스 내 반복 JSON 파싱 방지 (성능 최적화)

---

## [0.8.6] - 2026-03-14

### Fixed

- **🔴 크리티컬: `status.js` `path` 모듈 누락** — 피처 레지스트리 함수(`saveFeatureRegistry`, `getFeatureRegistry`, `updateFeatureStatus`)가 `path.join()` 호출 시 크래시하던 버그 수정
- **`get-context.js` 다음 단계 표시 오류** — 현재 단계를 "다음"으로 잘못 표시하던 문제 수정. in-progress면 "📍 진행중", 아니면 "💡 다음"으로 표시
- **`doc-tracker.js` design-db 매핑** — `design-db` 문서 작성 시 `design` 단계로 올바르게 매핑
- **`prompt-handler.js` fix 키워드 충돌** — 일반 대화에서 "수정", "바꿔" 등으로 fix 모드 오진입 방지. `/vais fix` 명시 호출만 감지

### Changed

- **`session-start.js` 출력 형식 간소화** — `hookSpecificOutput` 중첩 구조 제거, `additionalContext`만 사용 (최신 스펙)
- **`plugin.json` 스키마 업데이트** — `agents`, `hooks` 필드 추가
- **`hooks.json`에 `Notification` 이벤트 추가** — 백그라운드 작업 완료 알림 처리

---

## [0.8.5] - 2026-03-14

### Added

- **`/vais fix` 명령어**: 영향 분석 기반 수정
  - 피처 자동 감지 → 영향 범위 분석 → 사용자 확인 → 코드·문서 일괄 수정 → 검증
  - 수정 유형별 영향 범위 매핑: UI/레이아웃, 기능, 정책, 데이터, 화면 추가/삭제
  - 정책 충돌 감지 — 기획서 정책과 충돌 시 사용자에게 알림
  - 수정 후 빌드 검증 + 문서 일관성 체크 (최대 3회 재시도)
  - prompt-handler 키워드: fix, 수정, 고쳐, 바꿔, 변경해, 이상해, 깨져, 틀어

---

## [0.8.4] - 2026-03-14

### Changed

- **단계명 간소화**: `frontend` → `fe`, `backend` → `be`
  - 커맨드: `/vais fe login`, `/vais be login`, `/vais fe+be login`
  - phases 배열, phaseNames, parallelGroups, prompt-handler 키워드 매핑 일괄 변경
  - 스킬 파일 이름: `frontend.md` → `fe.md`, `backend.md` → `be.md`
  - 에이전트 이름(`frontend-dev`, `backend-dev`)은 변경 없음
  - 기존 키워드 `frontend`, `backend` 입력 시 자동으로 `fe`, `be`로 매핑

---

## [0.8.3] - 2026-03-14

### Added

- **피처 레지스트리 시스템**: plan에서 정의된 기능 목록을 `.vais/features/{feature}.json`에 구조화 저장
  - `saveFeatureRegistry()`, `getFeatureRegistry()`, `updateFeatureStatus()` — `lib/status.js`
  - plan → ia → wireframe → design → fe → be → check → review 전 단계에서 자동 참조
  - 각 기능별 구현 상태 추적 (미구현 → 진행중 → 완료)
  - `get-context.js`에서 기능 목록 컨텍스트 자동 출력
- **모든 단계 스킬 파일에 피처 레지스트리 참조 추가**: ia, wireframe, design, fe, be, check, review

---

## [0.8.2] - 2026-03-14

### Fixed

- **Stop Handler 항상 표시**: 활성 피처가 없어도 버전 정보와 시작 안내를 표시
  - 기존: 활성 피처 없으면 푸터 미출력 → 사용자 혼란
  - 변경: 항상 `💠 v0.8.2` 버전 표시 + `💡 시작: /vais init <피처명>` 안내
- 활성 피처는 있으나 진행 요약이 없는 경우에도 기본 안내 표시

---

## [0.8.1] - 2026-03-14

### Added

- **QA 시나리오 리스트**: check 단계에서 기획서 기반 QA 시나리오 자동 생성, review 단계에서 Pass/Fail 판정
  - 핵심 기능 테스트, 엣지 케이스, UI/UX 검증 포함
  - QA 통과율 산출하여 최종 판정에 반영
- **`/vais init` 명령어**: 기존 프로젝트에 VAIS Code 적용
  - 코드베이스 분석 → research/plan/ia/wireframe/design 문서 역생성
  - 코드 수정 없이 문서만 생성하여 워크플로우 진입 준비

---

## [0.8.0] - 2026-03-14

### Changed

- **워크플로우 10단계 → 9단계로 간소화 (docs 폴더 10개 → 7개)**
  - `convention` 단계 제거 → 코딩 규칙을 plan(기획) 단계에 통합
  - `frontend` / `backend` 단계는 유지하되 docs 폴더만 제거 (코드가 산출물)
  - docs 폴더 번호 재배정: 01-research ~ 07-review
- 모든 파일에서 phase 참조, 문서 경로, 다이어그램 일괄 동기화
- 버전 v0.7.0 → v0.8.0

### Removed

- `skills/vais/phases/convention.md` (convention 단계)
- `templates/convention.template.md`
- `docPaths`에서 frontend, backend 경로 (단계 자체는 유지)

---

## [0.7.0] - 2026-03-14

### Changed

- **SKILL.md를 Skills 2.0 구조로 리팩토링** — 491줄 모놀리식 → ~50줄 슬림 라우터
  - `!`cat`` 전처리로 `$0`(액션)에 해당하는 phase 파일만 동적 로드
  - `!`node`` 전처리로 현재 워크플로우 상태 동적 주입
  - `$ARGUMENTS` (`$0`, `$1`) 네이티브 치환 활용
  - frontmatter `tools` → `allowed-tools` (Skills 2.0 스펙)
- **session-start.js 경량화** — 176줄 → 50줄 (상세 컨텍스트는 SKILL.md가 담당)
- **output-styles 정리** — Quick/Full 레벨 참조 제거, 10칸 진행률로 통일

### Added

- `skills/vais/phases/` — 14개 phase별 독립 참조 파일
- `scripts/get-context.js` — 워크플로우 상태 마크다운 출력 스크립트
- `CHANGELOG.md` — 릴리즈 노트 분리

### Removed

- Quick/Full 2레벨 시스템 관련 설명 일괄 제거

---

## [0.6.3] - 2026-03-14

### Changed

- Gap 분석 자동 반복 로직 개선 (최대 5회, 90% 기준)
- 보안 스캔을 check 단계에 통합

### Added

- 컴포넌트 어노테이션 (`data-component`, `data-props`)
- 문서 참조 투명성 (에이전트 참조 문서 기록)
- CSS 파일 자동 감지 (frontend 단계)

---

## [0.6.0] - 2026-03-14

### Added

- 체이닝 문법 (`:` 순차, `+` 병렬)
- 설계 병렬화 (UI + DB)
- 5명 에이전트 팀 (tech-lead, designer, frontend-dev, backend-dev, reviewer)
- 빌드 검증 통합 Gap 분석
- Plan-Plus 3단계 검증
- 6개 훅 시스템
- 50개 유닛 테스트

---

## [0.5.0] - 2026-03-14

### Added

- 10단계 개발 워크플로우 초기 구현
- `/vais auto` 자동 워크플로우
- 와이어프레임 생성 (ASCII/HTML)
- `.vais/status.json` 상태 관리
