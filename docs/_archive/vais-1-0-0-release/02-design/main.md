---
owner: cto
artifact: synthesis
phase: design
feature: vais-1-0-0-release
generated: 2026-05-17
synthesizer: cto
model-version: v2
summary: "1.0.0 GA design 합성문 보강 — README/package-lock/pre-commit guard/agentTeams true/legacy pruning/CMO-CFO 제거를 Do scope에 반영."
---

# vais-1-0-0-release — Design (합성문, v2)

> Phase: 🎨 design | Synthesizer (도메인 리드): **CTO** | Date: 2026-05-17
> Lazy Consensus: consensus-reached | dogfood: **simulated graceful** (CC 2.1.143, env flag 미설정)
> 입력: [plan main.md](../01-plan/main.md) + 2 sub-agent artifact ([release-pipeline](./release-pipeline.md), [narrative-realignment](./narrative-realignment.md)) + release 직전 코드 점검 반영

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 최초 design 은 README 부재로 오판했고, package-lock 버전 sync / macOS bash3 pre-commit 실패 / `_tmp` compatibility / CMO-CFO 잔재 / agentTeams GA 기본값 결정을 누락했다. |
| **Solution** | Do scope 를 확장한다: README narrative 갱신, package-lock 포함 version sync, `check-legacy-paths.sh` bash3 호환화, `agentTeams.enabled=true` 를 GA 기본값으로 확정, legacy `_tmp`/scratchpad/topic compatibility 제거, CMO/CFO 표기 제거. |
| **Effect** | 1.0.0 GA 표면(README/CLAUDE/ONBOARDING/marketplace/plugin)과 실제 릴리스 검증(package-lock/pre-commit/legacy path)이 같은 계약을 말하게 된다. |
| **Core Value** | 0.69.0 까지 누적 변화의 narrative 정리 + 1.0.0 GA 라벨링 + 0.x 잔재 제거. agentTeams 는 1.0 GA 기본값 `true` 로 출하한다. |

## 2. 결정 (Synthesizer 합성, Lazy Consensus)

| # | Decision | 합성자 추론 / 근거 | Owner |
|---|----------|--------------------|-------|
| 1 | CHANGELOG `[1.0.0]` 6 섹션 + Migration Guide bullet 29건 박제 | release-pipeline plan §2 가이드라인 → design content 으로 확장 | coo ✓ |
| 2 | T1~T3 (0.69) + T4/T6~T8 (0.68) 누적 Security bullet 7건 | release-pipeline §1 누적 | coo ✓ |
| 3 | README.md 는 존재한다. skip 취소, 1.0.0 GA narrative 갱신 대상에 포함 | 루트 `README.md` 실제 확인. 현재 badge/highlights 가 0.65.3 기준 | cto ✓ |
| 4 | 5 narrative 파일 diff (README.md / CLAUDE.md / ONBOARDING.md / marketplace.json 2 곳 / plugin.json) | narrative-realignment §2~4 를 README 포함으로 보강 | cto ✓ |
| 5 | package-lock.json 을 version sync 대상에 추가 | lockfile root/package version 이 0.61.1 로 stale. npm 배포/검증 표면 불일치 방지 | cto ✓ |
| 6 | pre-commit legacy-path guard 의 `mapfile` 제거 | macOS 기본 bash 3.x 에서 `mapfile: command not found` 확인. `while IFS= read -r` 방식으로 변경 | cto ✓ |
| 7 | `agentTeams.enabled=false` GA default 유지 + ONBOARDING 활성화 안내 강화 | PO 결정 (2026-05-17): "강제하지 말고 안내만". env flag 가 CC harness 변수라 자동 설정 불가 (auto-write 시 AC9 위반). default true 시 모든 신규 사용자 매 세션 stderr 1줄 노출 → first impression risk. ONBOARDING #agent-teams-activation 섹션을 1.0.0 narrative 의 표면 통로로 강화 | cto + PO ✓ |
| 8 | `_tmp`/scratchpad/topic legacy compatibility 제거 | 1.0.0 목표가 0.x 잔재 제거이므로 doc-validator/auto-judge/status 의 runtime fallback 제거. 필요 테스트는 migration-only fixture 로 격리 | cto ✓ |
| 9 | CMO/CFO 표기 제거 | CBO 통합이 완료된 역할 모델과 충돌. CLAUDE.md / templates 등 사용자 노출 문구에서 CMO/CFO 삭제 | cto ✓ |
| 10 | git tag annotated v1.0.0 + push 사용자 명시 승인 후 | release-pipeline §2 + 0.68 표준 | coo ✓ |
| 11 | version sync 검증 script 확장 (package-lock 포함) | package/package-lock/vais.config/plugin/marketplace 2곳 + CHANGELOG grep | coo ✓ |
| 12 | marketplace description "v0.69" 접두사 제거 → "v1.0 GA: organization-in-a-box" | narrative-realignment §4 | cto ✓ |
| 13 | rollback 절차 (T5) — `git tag -d v1.0.0 && git push :refs/tags/v1.0.0` | release-pipeline §2 | coo ✓ |
| 14 | dogfood 결론: simulation graceful 작동 ✅ — 0.69.0 새 코드 경로 활성 확인 | `checkAgentTeamsAllowed(true).simulationMode === true` | cto ✓ |

## 3. 핵심 알고리즘

design phase 알고리즘 불필요 (procedural). 검증 스크립트는 do phase 의 inline node -e (release-pipeline §3 참조).

## 4. State Machine

불필요.

## 5. 인터페이스 계약

- `vais.config.json > orchestration.agentTeams.enabled` = `true` (현재 dogfood 재활성 상태) → **Do phase 에서 `false` 로 복귀** (1.0.0 GA default = false 결정)
- 1.0.0 GA 기본값: `agentTeams.enabled=false`. README/ONBOARDING/CHANGELOG 의 "default false" 문구 유지 + ONBOARDING `#agent-teams-activation` 섹션을 narrative 표면 통로로 강화
- `vais.config.json > version` 변경 path: `"0.69.0"` → `"1.0.0"` (do)
- `package.json` / `package-lock.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` version 동일 변경
- legacy runtime contract: 신규 1.0.0 flow 는 `docs/{feature}/{NN-phase}/{artifact}.md` 직접 박제만 지원. `_tmp`/scratchpad/topic fallback 은 제거

## 6. Success Criteria (AC 집계, 18건 — plan 승계)

| ID | Owner | 본 phase 박제 상태 |
|---|---|---|
| AC1~AC8 | cto | plan main.md §6 그대로 |
| AC-CSO-1~5 | cso | plan 그대로 |
| AC-COO-1~5 | coo | release-pipeline §5 에서 1.0.0 기준 검증 도구 박제 ✅ |
| AC-REL-1 | cto | README.md 가 1.0.0 GA / organization-in-a-box 를 표기하고 stale 0.65.3 current 문구 제거 |
| AC-REL-2 | cto | package-lock.json root version 이 package.json 과 동일하게 1.0.0 |
| AC-REL-3 | cto | `bash scripts/check-legacy-paths.sh --mode=tree` 가 macOS bash3 호환으로 PASS |
| AC-REL-4 | cto | `agentTeams.enabled=false` GA default 유지 + ONBOARDING `#agent-teams-activation` 섹션이 README 에서 link 노출 (강제 X, 안내 O). validate-plugin warning 문구는 enabled=true 사용자만 보이도록 정합 |
| AC-REL-5 | cto | runtime 코드에서 `_tmp` fallback 과 scratchpad/topic 신규 등록 API 제거 또는 migration-only 격리 |
| AC-REL-6 | cto | 사용자 노출 문서/템플릿에서 CMO/CFO 역할 표기 제거 |

> AC5 본 phase 측정: do 진입 직전 design main.md (본 문서) 분량 측정. 결과는 §8 관찰 참조.

## 7. 위협 / 위험 (CSO 도메인 — plan 박제 승계 + dogfood 관찰)

| ID | 위협 | 본 design 시점 상태 |
|---|---|---|
| T1~T5 (plan) | status 마이그/GA 후 critical/cache/agent-teams fallback/tag push | mitigation 박제 유지 |
| Dogfood 관찰 | env flag 미설정 시 simulation 자동 fallback 작동 ✅ | 0.69.0 새 경로 실측 확인 |
| Release guard | pre-commit 이 macOS bash3 에서 실패하면 tag 전 commit 차단 | `mapfile` 제거로 해결 |
| Contract drift | README/package-lock/agentTeams default 문구가 manifest 와 다르면 1.0.0 신뢰 저하 | sync script + grep 검증 확장 |
| Legacy residue | `_tmp` compatibility 가 남으면 1.0.0 구조 메시지 약화 | runtime fallback 제거, historical tests 재분류 |

## 8. 관찰 (Out-of-scope 후속)

- **release-pipeline.md = 219줄** (sub-agent 보고). 목표 130~160 대비 59줄 초과. CHANGELOG content 자체가 무거워 압축 불가. Acceptable.
- **본 design main.md AC5 측정** = (박제 후 wc -l) — 목표 <150줄로 lean v2 합성문 실증.
- **README.md 존재** — 최초 design 의 "부재/skip" 판단은 폐기. 1.0.0 GA narrative 갱신 대상.
- **package-lock.json stale** — 현재 root/package version 이 0.61.1. version sync 검증 대상에 포함.
- **legacy guard 실패** — `mapfile` 로 인해 macOS bash3 에서 `check-legacy-paths.sh` 실패. Do 에서 수정.
- env flag (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) 환경 dogfood = 별도 세션 권장 (real 모드 실증).

## 9. Do 작업 / Next Phase 매핑 (9 묶음)

| # | 작업 | 신규/수정 | 파일 | Owner sub-agent |
|---|------|----------|------|-----------------|
| 1 | version `"0.69.0"` → `"1.0.0"` sync + lockfile stale 정리 | 수정 | package.json / package-lock.json / vais.config.json / .claude-plugin/plugin.json / .claude-plugin/marketplace.json (2 곳) / CHANGELOG.md | infra-architect |
| 2 | CHANGELOG `[1.0.0]` 6 섹션 + Migration 삽입 (0.69.0 entry 위) | 수정 | CHANGELOG.md | release-notes-writer (content = release-pipeline §1) |
| 3 | 5 파일 narrative diff 적용 | 수정 | README.md / CLAUDE.md / ONBOARDING.md / .claude-plugin/marketplace.json / .claude-plugin/plugin.json | infra-architect |
| 4 | `agentTeams.enabled=false` GA default 복귀 + ONBOARDING 안내 강화 | 수정 | vais.config.json (true→false) / README.md (`#agent-teams-activation` 링크) / ONBOARDING.md (섹션 강화) | infra-architect |
| 5 | pre-commit legacy path guard bash3 호환화 | 수정 | scripts/check-legacy-paths.sh | infra-architect |
| 6 | `_tmp`/scratchpad/topic legacy compatibility 제거 | 수정 | scripts/doc-validator.js / scripts/auto-judge.js / lib/status.js / 관련 tests | infra-architect + test-engineer |
| 7 | CMO/CFO 사용자 노출 표기 제거 | 수정 | CLAUDE.md / templates/design.template.md / README.md / agent docs grep 결과 | infra-architect |
| 8 | status.json v3 → v4 마이그레이션 실행 | 수정 (.vais/) | `.vais/status.json` + `.vais/status.json.v3.bak` | infra-architect (bash) |
| 9 | git tag v1.0.0 annotated (push 보류) | 신규 (git) | `.git/refs/tags/v1.0.0` | release-notes-writer (bash) |

> Do phase 진입 = CSO Gate A 통과 후. Push 는 사용자 명시 승인 후.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — 2 sub-agent (COO/CTO) 합성 (9 결정 + 5 Do 작업 + dogfood 관찰) |
| v1.1 | 2026-05-17 | release 직전 코드 점검 반영 — README 포함, package-lock sync, bash3 guard fix, agentTeams true GA default, legacy compatibility 제거, CMO/CFO 제거 |
| v1.2 | 2026-05-17 | review 반영 — (1) 결정 #7 정정 (default false 유지 + ONBOARDING 안내 강화) + AC-REL-4 / Do 작업 #4 정정 (2) P0-A 검증: `registerSubDoc`/`listSubDocs` 외부 호출자 0 → 결정 #8 안전 확정 (3) P0-B sub-doc drift 는 Do 작업 #2/#3 안에서 동기화 |

<!-- synthesis template v2.0 (dogfood: vais-1-0-0-release, mode: simulated graceful) -->
