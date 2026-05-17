---
owner: coo
artifact: release-pipeline
phase: design
feature: vais-1-0-0-release
generated: 2026-05-17
agent: release-notes-writer
summary: "1.0.0 GA CHANGELOG 6섹션 draft + git tag 절차 + 5파일 sync 체크리스트 + post-release monitor + COO AC 5개"
---

# Release Pipeline Design — vais-code 1.0.0 GA

> Phase: 02-design | Owner: COO | Agent: release-notes-writer | Date: 2026-05-17
> 입력: [ideation](../00-ideation/main.md) | [plan 합성문](../01-plan/main.md) | [release-pipeline-plan](../01-plan/release-pipeline-plan.md)

---

## 1. 실제 CHANGELOG `[1.0.0]` 본문

> do phase 에서 CHANGELOG.md 의 0.69.0 entry 바로 위에 삽입할 준비된 content.
> Keep a Changelog 형식 준수. 이전 entry 불변.

```markdown
## [1.0.0] - 2026-05-17 — organization-in-a-box GA

vais-code 공식 1.0.0 GA. v0.x 실험 단계 졸업 → **organization-in-a-box** (PO 1명이
부서장 OJT 매뉴얼로 가상 C-Suite 조직을 운영하는 도구) 정식 포지셔닝.
agent-teams v2 대화-합성 모델 안정화 opt-in GA. CC SendMessage real 통합 (v0.69.0).
status.json v4 스키마 확정. v0.5x 이후 누적 변경 정리.

### Added

- **organization-in-a-box GA narrative** — CLAUDE.md / ONBOARDING.md / marketplace
  description 일관화. PO 1명 + 부서장 OJT 4요소(framework/실무단계/의사결정패턴/산출물양식) 정식 포지셔닝
- **agent-teams v2 대화-합성 모델** — `conversation-orchestrator.js` + Lazy Consensus
  5-state FSM (draft / review-window / objection-raised / revision / consensus-reached /
  timeout). opt-in `agentTeams.enabled` (default false, 0.68.0)
- **CC SendMessage real 통합** — `simulationMode=false` 시 real SendMessage 호출.
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경 변수 + CC 2.1+ 감지 (0.69.0)
- **synthesizer 라우팅** — `lib/ceo-algorithm.js` SYNTHESIZER_MATRIX + selectSynthesizer /
  selectParticipants / computeParallelGroup / detectDominantDomain (0.68.0)
- **합성문 + decisions-log 템플릿** — `templates/synthesis.template.md` (9섹션) +
  `templates/decisions-log.template.md`. mode + messageHash 컬럼 (0.69.0 enhance)
- **Sub-agent worktree 병렬 (패턴 D)** — `lib/worktree-manager.js` +
  `skills/vais/utils/subagent-dispatcher.js` (0.68.0)
- **status.json v4 마이그레이션 스크립트** — `scripts/migrate-status-v3-to-v4.js`
  (idempotent + .v3.bak 자동 백업 + atomic write, 0.68.0)
- **design-system MCP + mui catalog** — `mcp/design-system-server-runner.js` +
  `design-system/mui/` 토큰·컴포넌트 박제 (v0.61~0.62)
- **Knowledge Pack Tier-1A** — CEO Rumelt / CPO PRD OJT / CTO Architecture Decision
  (v0.66). `agents/{c-level}/knowledge/` lazy-load 패턴
- **ONBOARDING `#agent-teams-activation` 섹션 강화** — README 에서 직접 link 노출.
  Real SendMessage 활성 (env flag) + settings.json 경로 5 단계 안내. 강제 X, 안내 O

### Changed

- **organization-in-a-box 정체성** — v0.x "AI C-Suite 시뮬레이션" → 1.0.0
  "PO 1명이 부서장 OJT 매뉴얼로 가상 C-Suite 조직을 운영하는 도구" (v0.66+ 누적 확정)
- **CEO 진입 절차 v0.65.3** — `analyzeCEO()` 7차원 등급 표 출력 → activeCLevel 인용
  → AskUserQuestion. LLM 자체 라우팅 금지 (lib/ceo-algorithm.js 박제)
- **sub-agent 직접 박제 (v0.65+)** — `_tmp/` 폐기, 큐레이션 섹션 폐기
  → `docs/{feature}/{NN-phase}/{artifact}.md` 직접 Write (subdoc-guard v2.2)
- **frontmatter v2.1 슬림화** — 4 필수 필드 (owner/artifact/phase/feature). agent /
  generated / source / summary 는 optional auto-hydrate
- **clevel-main-guard v3.0** — v1 (5섹션 인덱스) + v2 (합성문 9섹션) 2모델 공존.
  `model-version` frontmatter 필드로 분기 (0.68.0)
- **CBO 통합 공식화** — CMO + CFO → CBO (v0.50 착수, v0.62 완료, 1.0.0 공식 기록)
- **README.md narrative 1.0.0 GA 갱신** — badge `version-0.65.3` → `version-1.0.0`,
  highlights/quickstart 표현을 1.0.0 GA + organization-in-a-box 기준으로 정렬
- **package-lock.json version sync** — root + dep 모두 stale 0.61.1 → 1.0.0 동기화

### Deprecated

*(1.0.0 기준 신규 deprecate 항목 없음. 이전 버전 deprecated 항목은 Removed 참조.)*

### Removed

- **CMO / CFO alias** — v0.62 에 제거 완료. 1.0.0 에서 공식 제거 기록
- **`_tmp/` 임시 폴더 모델** — v0.65 에 폐기 완료 (subdoc-guard v2.1 → v2.2)
- **legacy guides `docs/_legacy/v1/`** — v0.65+ 정리 완료. git history 보존
- **큐레이션 기록 섹션** (`✅ 채택 / ❌ 거절 / ✓ 병합`) — subdoc-guard 폐기 항목
- **`_tmp` / scratchpad / topic runtime fallback** — `lib/status.js > registerSubDoc`
  + `scripts/doc-validator.js` + `scripts/auto-judge.js` 의 legacy compatibility 제거.
  v0.65 sub-agent 직접 박제 전환 후 외부 호출자 0 확인 (안전 제거).
  Migration-only fixture 로 historical tests 격리
- **CMO / CFO 사용자 노출 표기** — CLAUDE.md / README.md / templates/design.template.md /
  agents/cbo/* 의 잔존 표기 제거. CBO 통합 완료 모델과 정합 (v0.50~v0.62 처리 + 1.0.0 표면 정리)

### Fixed

- **cross-model P0 alignment** — v0.66.1 hotfix (커밋 `6a4e7c4`). mandatory 규칙 cross-model 정합
- **design-system MCP 12 minor 부채** — v0.61. Python 3.10→3.8 minimum, Hard fail 정책,
  observation-D1 패턴
- **workflow-contract v2.2 7단계 정렬** — v0.67.0. phase/owner/activation/artifact/path/
  validator 계약 + mandatoryPhases backward-compat (cross-review 권고 2항 해소)
- **conversation-orchestrator allowedActors 누락** — v0.69.0 회귀 fix.
  `_validateActor` whitelist 에 `participants` 1줄 추가 (288/288 tests pass 회복)
- **`scripts/check-legacy-paths.sh` macOS bash 3.x 호환** — `mapfile` 미지원으로 release
  pre-commit 차단되던 issue. `while IFS= read -r` 패턴으로 교체 (line 63 / 65)

### Security

- **T1 SendMessage body 시크릿 grep** — `_scanSecrets()` 4 regex (password/secret/
  api_key/token) 매치 시 throw. 송신 직전 검사 (v0.69.0)
- **T2 actor 화이트리스트** — `_validateActor()` parallelGroup + participants 외 actor
  silent drop + log warn (v0.69.0)
- **T3 main→sub 일방향 정책** — `_enforceMainSubDirectionality()` sub-agent caller 시
  throw (v0.69.0)
- **T4 agentTeams.enabled=true 모르게 활성화 방지** — validate-plugin warning
  (validateAgentTeamsConfig, v0.68.0)
- **T6 Sub-agent merge race** — worktree-manager mergeBack AskUserQuestion + lint/test
  게이트 (v0.68.0)
- **T7 Stale worktree** — listStale + `/vais teams cleanup` 사용자 명시 호출만 (v0.68.0)
- **T8 Sub→Sub SendMessage 금지** — work-rules.md v2.3 line 80 박제 (v0.68.0)

### Migration Guide

- **기본 동작**: 0.69.0 byte-level 동등 (`agentTeams.enabled: false` default).
  업그레이드 즉시 사용 가능. 코드 변경 불필요.
- **status.json v3 → v4**: `node scripts/migrate-status-v3-to-v4.js`
  (idempotent, .v3.bak 자동 생성. v3 사용자만 필요)
- **v2 대화-합성 활성**: `vais.config.json > orchestration.agentTeams.enabled: true`
  + Claude Code 2.1+ + `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **기존 main.md**: frontmatter `model-version: v1` 1줄 추가 권장 (선택, 본문 변환 X)
- **design-system MCP**: Python 3.8+ 필요. opt-out: `vais.config.json >
  orchestration.mcp.enabled: false`
```

---

## 2. git tag 절차

```bash
# 1. 6 파일 version "1.0.0" sync 확인 (5 JSON + CHANGELOG)
node -e "
  const pkg = require('./package.json');
  const lock = require('./package-lock.json');
  const cfg = require('./vais.config.json');
  const plugin = require('./.claude-plugin/plugin.json');
  const mkt = require('./.claude-plugin/marketplace.json');
  const versions = [
    pkg.version,
    lock.version,
    lock.packages?.['']?.version,
    cfg.version,
    plugin.version,
    mkt.metadata?.version,
    mkt.plugins?.[0]?.version
  ];
  const ok = versions.every(v => v === '1.0.0');
  console.log(ok ? 'PASS: all 7 fields sync 1.0.0' : 'FAIL: ' + JSON.stringify(versions));
  process.exit(ok ? 0 : 1);
"

# CHANGELOG 별도 확인
grep "^\#\# \[1\.0\.0\]" CHANGELOG.md

# pre-commit guard 실행 가능 확인 (bash3 호환)
bash scripts/check-legacy-paths.sh --mode=tree

# 2. 클린 워킹 트리 확인
git status   # → nothing to commit, working tree clean

# 3. annotated tag 생성 (lightweight 금지)
git tag -a v1.0.0 -m "Release 1.0.0 — organization-in-a-box GA"

# 4. 생성 검증
git show v1.0.0   # tagger / date / message 확인

# 5. push — 사용자 명시 승인 후 실행
# git push origin main
# git push origin v1.0.0

# rollback (필요 시 — T5 mitigation)
# git tag -d v1.0.0
# git push origin :refs/tags/v1.0.0
```

> annotated tag 사용 의무. `git show v1.0.0` 으로 tagger / date / message 3항목 검증.
> `git push origin v1.0.0` 은 되돌리기 어려운 외부 배포 행위 — **사용자 명시 승인 후 실행** (release-pipeline-plan §3 T5 mitigation).

---

## 3. 마켓플레이스 재배포 체크리스트 (6 파일)

| 파일 | 현재 | 변경 (1.0.0) | 수정 필드 |
|------|------|--------------|-----------|
| `package.json` | `"0.69.0"` | `"1.0.0"` | `version` |
| `package-lock.json` | `"0.61.1"` (stale 4 minor) | `"1.0.0"` | `version` + `packages[""].version` |
| `vais.config.json` | `"0.69.0"` | `"1.0.0"` | `version` |
| `.claude-plugin/plugin.json` | `"0.69.0"` | `"1.0.0"` | `version` |
| `.claude-plugin/marketplace.json` | `"0.69.0"` (metadata + plugins[0]) | `"1.0.0"` 둘 다 | `metadata.version` + `plugins[0].version` |
| `CHANGELOG.md` | (1.0.0 entry 부재) | `## [1.0.0]` 섹션 추가 | 최상단 삽입 (§1) |

**marketplace description 변경**:

| 항목 | 현재 | 변경 |
|------|------|------|
| 한 줄 설명 | `"v0.69: Real SendMessage 통합..."` | `"v1.0 GA: organization-in-a-box — PO 1명이 가상 C-Suite로 서비스 런칭"` |
| 장문 설명 첫 문장 | v0.x 실험 라벨 | `"1.0.0 GA: PO 1명이 부서장 OJT 매뉴얼(framework/실무단계/의사결정패턴/산출물양식)로 가상 C-Suite 조직을 운영하는 도구."` |

---

## 4. Post-Release Monitor

release-pipeline-plan §5 의 5 지표 + 1.0.0 추가 지표:

| 항목 | SLA | 담당 |
|------|-----|------|
| 마켓플레이스 cache 갱신 확인 | tag push 후 30분 | release-monitor (COO) |
| 사용자 첫 1.0.0 설치 smoke | 1h 이내 | release-monitor (COO) |
| `agentTeams.enabled=true` 첫 사용 보고 | 초기 24h | release-monitor (COO) |
| `validate-plugin` 0 err / ≤1 warn 재확인 | 배포 직전 | CSO (plugin-validator) |
| critical bug 발생 시 1.0.1 hotfix 트리거 | 24h SLA | COO / CTO |
| **1.0.0 GA 라벨 정합 확인** | 배포 후 1h | COO (정성) |

> **1.0.0 GA 라벨 정합**: README / marketplace / CLAUDE.md / ONBOARDING.md 4개 소스에서 "organization-in-a-box" + "1.0" 표현이 일관한지 수동 스캔. 불일치 발견 시 1.0.1 minor fix 트리거.

결과 artifact: `docs/vais-1-0-0-release/05-report/release-monitor.md`

---

## 5. AC (COO 관점)

| # | AC | 검증 방법 | 목표 |
|---|----|-----------|------|
| AC-COO-1 | CHANGELOG `[1.0.0]` 6 섹션 완료 (Added/Changed/Deprecated/Removed/Fixed/Security) | `grep -c "^###" <신규섹션>` ≥ 6 | do phase 완료 시 |
| AC-COO-2 | 6 파일 version `"1.0.0"` sync (5 JSON 7 필드 + CHANGELOG) | `node -e "..."` sync 스크립트 PASS (§2 참조, package-lock 포함) | version sync 직후 |
| AC-COO-3 | `git tag v1.0.0` annotated 생성 + `git show` 3항목 검증 | `git show v1.0.0` — tagger/date/message 확인 | tag 생성 직후 |
| AC-COO-4 | 마켓플레이스 재배포 (사용자 명시 승인 후 `git push origin v1.0.0`) | push 성공 + marketplace page 1.0.0 버전 표시 | 사용자 승인 후 |
| AC-COO-5 | release-monitor 24h GREEN (6 지표 — §4) | `docs/vais-1-0-0-release/05-report/release-monitor.md` PASS | 배포 후 24h |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 박제 — CHANGELOG [1.0.0] 6섹션 draft (0.69.0 누적 포함) + git tag 절차 + 5파일 sync + post-release monitor 6지표 + AC 5개 |
| v1.1 | 2026-05-17 | drift fix (review 반영) — Added ONBOARDING 강화 / Changed README+package-lock / Removed `_tmp` runtime + CMO·CFO 표면 / Fixed bash3 guard. §3 5파일 → 6파일 (package-lock 추가). §2 sync 스크립트 확장 + check-legacy-paths.sh 호출. AC-COO-2 갱신 |
