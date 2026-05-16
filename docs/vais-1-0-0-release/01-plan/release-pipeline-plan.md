---
owner: coo
artifact: release-pipeline-plan
phase: plan
feature: vais-1-0-0-release
generated: 2026-05-16
agent: release-notes-writer
summary: "0.68.0 → 1.0.0 GA 릴리즈 파이프라인 계획. SemVer Major 정당화 + CHANGELOG 6섹션 구조 + git tag 절차 + 4파일 sync + post-release monitor + AC 5개."
---

# Release Pipeline Plan — vais-code 1.0.0 GA

> Phase: 01-plan | Owner: COO | Agent: release-notes-writer | Date: 2026-05-16

---

## 1. SemVer 판정

**0.68.0 → 1.0.0 (Major)**

| 근거 유형 | 상세 | SemVer 영향 |
|-----------|------|-------------|
| Breaking | `status.json` schema v3 → v4 (`subagentLocks` 필드 추가). 마이그레이션 스크립트 제공하지만 사용자 노출 surface 변경. | **Major** |
| Added (메이저) | agent-teams v2 대화-합성 모델 (`conversation-orchestrator.js`, Lazy Consensus FSM, synthesizer 라우팅). opt-in 토글이지만 아키텍처 전환. | Major 가중 |
| Changed (정체성) | organization-in-a-box 정식 GA narrative — CLAUDE.md / ONBOARDING / marketplace 일관화. v0.x 실험 라벨 탈피. | Major 가중 |
| Removed | deprecated CMO/CFO alias (0.62 제거), legacy `_legacy/v1/` archive (0.65+ 정리). | Minor-equivalent |
| Fixed | cross-model P0 alignment (0.66.1 hotfix) + 12 minor 부채 (0.61 design-system). | Patch-equivalent |

> **판정 요약**: GA 선언 + Breaking schema migration + 메이저 기능(agent-teams) 안정화 → Major (1.0.0) 확정.
> Keep a Changelog convention: 이전 entry 불변. `## [1.0.0] - 2026-05-16` 신규 섹션 앞에 추가.

---

## 2. CHANGELOG.md `[1.0.0]` 섹션 구조

do phase 에서 `release-notes-writer` 가 작성할 실제 entry 가이드라인.

```markdown
## [1.0.0] - 2026-05-16 — organization-in-a-box GA

vais-code 공식 GA. v0.x 실험 단계 졸업 → organization-in-a-box (PO 1명이 가상 C-Suite 조직 운영)
정식 포지셔닝. agent-teams v2 대화-합성 모델 안정화 opt-in GA. status.json v4 스키마 확정.

### Added

- **organization-in-a-box GA narrative** — CLAUDE.md / ONBOARDING.md / marketplace 설명 일관화
- **agent-teams v2 대화-합성 모델** — `conversation-orchestrator.js` + Lazy Consensus 5-state FSM
  (draft / review-window / objection-raised / revision / consensus-reached / timeout) — opt-in `agentTeams.enabled`
- **synthesizer 라우팅** — `lib/ceo-algorithm.js` SYNTHESIZER_MATRIX + selectSynthesizer / selectParticipants
- **합성문 + decisions-log 템플릿** — `templates/synthesis.template.md` (9섹션) + `templates/decisions-log.template.md`
- **Sub-agent worktree 병렬 (패턴 D)** — `lib/worktree-manager.js` + `subagent-dispatcher.js`
- **status.json v4 마이그레이션** — `scripts/migrate-status-v3-to-v4.js` (idempotent + .v3.bak 백업)
- **design-system MCP** — `mcp/design-system-server-runner.js` + mui catalog `design-system/mui/` (v0.61~0.62)
- **Knowledge Pack Tier-1A** — CEO Rumelt / CPO PRD OJT / CTO Architecture Decision (v0.66)

### Changed

- **organization-in-a-box 정체성** — v0.x "AI C-Suite 시뮬레이션" → 1.0.0 "PO 1명이 부서장 OJT 매뉴얼로
  가상 C-Suite 조직을 운영하는 도구" (v0.66+ 누적)
- **CEO 진입 절차 v0.65.3** — `analyzeCEO()` 7차원 등급 표 → activeCLevel → AskUserQuestion (LLM 자체 라우팅 금지)
- **sub-agent 직접 박제 (v0.65+)** — `_tmp/` 폐기, 큐레이션 폐기 → `docs/{feature}/{NN-phase}/{artifact}.md` 직접 Write
- **frontmatter v2.1 슬림화** — 4 필수 필드 (owner/artifact/phase/feature), optional auto-hydrate
- **clevel-main-guard v3.0** — v1 (5섹션 인덱스) + v2 (합성문 9섹션) 2모델 공존 + model-version 분기
- **CBO 통합** — CMO + CFO → CBO (v0.50~0.62 완료, 1.0.0 공식화)

### Deprecated

*(이번 1.0.0 기준 deprecate 항목 없음)*

### Removed

- **CMO / CFO alias** — v0.62 에 제거 완료. 1.0.0 에서 공식 제거 기록
- **`_tmp/` 임시 폴더 모델** — v0.65 에 폐기 완료 (subdoc-guard v2.1)
- **legacy guides** `docs/_legacy/v1/` archive — v0.65+ 정리 완료
- **큐레이션 기록 섹션** (`✅ 채택 / ❌ 거절 / ✓ 병합`) — subdoc-guard 폐기 항목

### Fixed

- **cross-model P0 alignment** — v0.66.1 hotfix (커밋 `6a4e7c4`)
- **design-system MCP 12 minor 부채** — v0.61 (Python 3.10→3.8 minimum, Hard fail 정책)
- **workflow-contract-alignment 7단계** — v0.67.0 phase/owner/activation/artifact/path/validator 계약 정렬
- **mandatoryPhases backward-compat** — v0.67.0 cross-review 권고 2항 해소

### Security

- **T1** SendMessage C-Level 통신 오용 방지 → `work-rules.md` v2.3 박제 (v0.68.0)
- **T4** agentTeams.enabled=true 모르게 활성화 방지 → validate-plugin warning (v0.68.0)
- **T6** Sub-agent merge race → worktree-manager mergeBack lint/test 게이트 (v0.68.0)
- **T7** Stale worktree → listStale + teams-cleanup 사용자 명시 호출만 (v0.68.0)
- **T8** Sub→Sub SendMessage 금지 → work-rules.md v2.3 line 80 grep 매치 (v0.68.0)

### Migration Guide

- **기본 동작**: 0.68.0 byte-level 동등 (`agentTeams.enabled: false` default). 업그레이드 즉시 사용 가능.
- **status.json v3 → v4**: `node scripts/migrate-status-v3-to-v4.js` (idempotent, .v3.bak 자동 생성)
- **v2 대화-합성 활성**: `vais.config.json > orchestration.agentTeams.enabled = true`
- **기존 main.md**: frontmatter `model-version: v1` 1줄 추가 권장 (선택, 본문 변환 X)
```

---

## 3. git tag 절차

```bash
# 1. 5 파일 버전 동기화 확인
grep -l "\"1.0.0\"" package.json vais.config.json \
  .claude-plugin/plugin.json .claude-plugin/marketplace.json
# → 4 파일 모두 출력 확인. CHANGELOG.md 는 별도 확인:
grep "^\#\# \[1.0.0\]" CHANGELOG.md

# 2. 클린 워킹 트리 확인
git status  # nothing to commit, working tree clean

# 3. annotated tag 생성 (lightweight 금지)
git tag -a v1.0.0 -m "Release 1.0.0 — organization-in-a-box GA"

# 4. push (사용자 명시 승인 후)
git push origin v1.0.0

# rollback (필요 시)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

> annotated tag 사용 의무 — `git show v1.0.0` 으로 tagger/date/message 검증 가능.
> `git push origin v1.0.0` 은 CLAUDE.md Rule #5 "위험 명령 금지" 에 해당하지 않으나, 되돌리기 어려운 외부 배포 행위이므로 **사용자 명시 승인 후 실행**.

---

## 4. 마켓플레이스 재배포 — 5 파일 sync 체크리스트

| # | 파일 | 수정 필드 | 목표 값 |
|---|------|-----------|---------|
| 1 | `package.json` | `version` | `"1.0.0"` |
| 2 | `vais.config.json` | `version` | `"1.0.0"` |
| 3 | `.claude-plugin/plugin.json` | `version` | `"1.0.0"` |
| 4 | `.claude-plugin/marketplace.json` | `metadata.version` + `plugins[0].version` | `"1.0.0"` |
| 5 | `CHANGELOG.md` | `## [1.0.0] - 2026-05-16` 섹션 | added (최상단) |

sync 검증 스크립트 (do phase 에서 실행):
```bash
node -e "
  const pkg = require('./package.json');
  const cfg = require('./vais.config.json');
  const plugin = require('./.claude-plugin/plugin.json');
  const mkt = require('./.claude-plugin/marketplace.json');
  const versions = [pkg.version, cfg.version, plugin.version,
    mkt.metadata?.version, mkt.plugins?.[0]?.version];
  const ok = versions.every(v => v === '1.0.0');
  console.log(ok ? 'PASS: all 5 sync' : 'FAIL: ' + JSON.stringify(versions));
  process.exit(ok ? 0 : 1);
"
```

---

## 5. Post-Release Monitor

| 항목 | 담당 | SLA |
|------|------|-----|
| 마켓플레이스 cache 갱신 확인 | release-monitor (COO) | tag push 후 30분 |
| 사용자 첫 설치 smoke test | release-monitor (COO) | 1h 이내 |
| `agentTeams.enabled=true` 첫 사용 보고 | release-monitor (COO) | 초기 24h 모니터링 |
| `validate-plugin` 0 err / 0 warn 재확인 | CSO (plugin-validator) | 배포 직전 |
| critical bug 발생 시 hotfix | COO (1.0.1) | 24h 이내 |

> release-monitor sub-agent 는 `docs/vais-1-0-0-release/05-report/release-monitor.md` 에 결과 박제.
> Hot-fix 트리거: `validate-plugin` err ≥ 1 OR 사용자 첫 설치 실패 재현 OR P0 security.

---

## 6. AC (COO 관점)

| # | AC | 검증 방법 |
|---|----|-----------| 
| AC-COO-1 | CHANGELOG `[1.0.0]` 섹션 6 표준 categorize 완료 (Added/Changed/Deprecated/Removed/Fixed/Security) | `grep -c "^###" CHANGELOG.md` 신규 섹션 ≥ 6 |
| AC-COO-2 | 5 파일 version `"1.0.0"` sync (4 JSON + CHANGELOG) | 위 sync 스크립트 PASS |
| AC-COO-3 | `git tag v1.0.0` annotated 생성 | `git show v1.0.0` — tagger/date/message 확인 |
| AC-COO-4 | 마켓플레이스 재배포 (사용자 승인 후 `git push origin v1.0.0`) | push 성공 + marketplace page 버전 표시 |
| AC-COO-5 | release-monitor health check 24h 무문제 (3 지표 GREEN) | `docs/vais-1-0-0-release/05-report/release-monitor.md` PASS |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-16 | 초기 작성 — SemVer 판정 + CHANGELOG 6섹션 구조 + git tag 절차 + 5파일 sync + post-release monitor + AC 5개 |
