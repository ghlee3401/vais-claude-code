# VAIS Code v0.50 Full Overhaul — Master Plan (Index)

> Feature: `v050-full-overhaul`
> Phase: Plan (Master / Index)
> Version: v0.49.2 → v0.50.0
> Source requirements: `guide/agent-mapping-v2.md`, `guide/csuite-roles-v2.md`, `guide/csuite-scenarios-v2.md`, `guide/harness-plan-v2.md`
> Detailed sub-plans: `docs/01-plan/features/v050/`

---

## 0. 이 문서의 역할

이 문서는 **인덱스/지휘 문서**다. 실제 구현 상세는 `docs/01-plan/features/v050/NN-*.plan.md` 11개 sub-plan에 분산되어 있다.
본 master는 다음만 담는다.

1. 전체 개편 개요와 목표
2. sub-plan 파일 목록과 **구현 순서**
3. sub-plan 간 **의존성 그래프**
4. 각 sub-plan 진입 시 **신경 써야 할 점** (이전 sub-plan에서 넘어온 전제 + 다음 sub-plan으로 넘길 보증 조건)
5. 전체 성공 기준 (SC roll-up)

각 sub-plan의 상세 태스크, 파일 경로, I/O 계약, 검증 방법은 해당 파일에서 본다.

---

## 1. Overhaul at a Glance

| 영역 | v0.49.2 | v0.50.0 | 비고 |
|------|---------|---------|------|
| C-Level 수 | 7 (CEO/CPO/CTO/CSO/CMO/COO/CFO) | 6 (CEO/CPO/CTO/CSO/**CBO**/COO) | CMO+CFO → CBO 통합 |
| Sub-agent 총계 | ~24 | **32** (v0.50 최종) | 신규 8 + 이동 + 제거 |
| Phase 구조 | plan→design→do→qa→report (mandatory 4종) | (optional) **ideation** → plan→design→do→qa→report | Phase 0 신설 |
| Advisor Tool | 없음 | **M-24**: 모든 32 Sonnet sub-agent에 `advisor_20260301` 기본 ON | Opus reviewer mid-generation |
| Harness Gate | 단순 파일 존재 확인 | agent-stop.js **4-step pipeline** (Document → Checkpoint → Gate → Guidance) | scripts/agent-stop.js |
| 시나리오 커버리지 | 비공식 | **S-1~S-10 + S-0(ideation)** 10+1 시나리오 문서화 | csuite-scenarios-v2 반영 |
| 자동화 레벨 | 1단계 (user/auto) | 3단계 (manual/semi-auto/auto) | trustLevel 분기 |

### 1.1 왜 쪼개는가

`guide/*-v2.md` 4개 문서는 **요구사항 수준**이다. 한 번의 Do 세션으로 전부 구현하면:
- 컨텍스트가 한계를 초과해 초반 정의가 후반에 잊힘
- 한 파일의 잘못된 편집이 다른 모듈을 깨뜨려도 추적 불가
- 사용자 승인 체크포인트를 끼워 넣을 자연스러운 경계가 사라짐

따라서 **11개 논리 단위**로 쪼갠다. 각 sub-plan 완료 시 gate를 통과해야 다음으로 넘어간다.

---

## 2. Sub-plan 목록 & 구현 순서

순서는 "**선행 sub-plan이 만든 산출물을 후행이 소비**"하는 방향으로 결정됐다.

| # | Sub-plan | 파일 | 선행 | 핵심 산출물 |
|---|----------|------|------|-------------|
| 00 | Migration Foundation | `v050/00-migration-foundation.plan.md` | — | `vais.config.json` v0.50, state-machine, paths, migration, 버전 동기화 |
| 01 | CBO Agents | `v050/01-agent-cbo-creation.plan.md` | 00 | `agents/cbo/cbo.md` + 10 sub-agent 파일 |
| 02 | Existing C-Level Updates | `v050/02-agent-existing-updates.plan.md` | 00 | CEO/CPO/CTO/CSO/COO 본체 및 신규 sub-agent 파일 |
| 03 | Shared Guards & Registry | `v050/03-agent-shared-guards.plan.md` | 01, 02 | `agents/_shared/advisor-guard.md`, `ideation-guard.md`, AgentRegistry includes |
| 04 | Advisor Integration (M-24) | `v050/04-advisor-integration.plan.md` | 03 | `lib/advisor/{wrapper,prompt-builder}.js`, `lib/control/cost-monitor.js`, schema 이벤트 |
| 05 | Ideation Phase | `v050/05-ideation-phase.plan.md` | 00 | `skills/vais/phases/ideation.md`, 템플릿, `docs/00-ideation/` 경로 |
| 06 | Phase Routers | `v050/06-phase-routers.plan.md` | 01, 02, 05 | CBO 라우터 신설, CEO 라우터 ideation 분기, SKILL.md 진입점, CMO/CFO 라우터 삭제 |
| 07 | Harness Gates | `v050/07-harness-gates.plan.md` | 00, 04, 06 | agent-stop 4-step, gate-manager, hooks.json, events.json, agent-start whitelist |
| 08 | Cleanup & Removal | `v050/08-cleanup-removal.plan.md` | 01, 02, 06 | `agents/cmo/`, `agents/cfo/`, `retrospective-writer`, `technical-writer` 삭제 + grep 검증 |
| 09 | Docs & Tests | `v050/09-docs-tests.plan.md` | 전체 | CLAUDE.md, AGENTS.md, README, CHANGELOG, 테스트 6종 |
| 10 | Scenario Verification | `v050/10-scenario-verification.plan.md` | 09 | S-1~S-10 + S-0 수동 워크쓰루 체크리스트 |

### 2.1 의존성 그래프

```
           ┌─ 01 CBO Agents ─────────┐
           │                         ├──→ 03 Shared Guards ──→ 04 Advisor ──┐
 00 Found ─┼─ 02 Existing Updates ───┘                                       │
           │                                                                 │
           └─ 05 Ideation Phase ──┐                                          │
                                  │                                          │
                                  └──→ 06 Phase Routers ──→ 07 Harness ─────┤
                                                                              │
                                                                              ▼
                                                        08 Cleanup ──→ 09 Docs/Tests ──→ 10 Scenarios
```

**규칙**:
- 00은 모든 것의 전제. 실패 시 전체 중단.
- 01과 02는 **병렬 가능** (서로 다른 디렉토리), 단 03은 둘 다 선행.
- 04(Advisor)는 sub-agent 파일이 이미 존재해야 frontmatter patch 가능 → 01/02/03 후.
- 05(Ideation)는 agent 본체 수정 없이도 가능 → 00 이후 병렬 시작 가능.
- 06(Routers)는 CBO/새 sub-agent가 실제로 존재해야 라우팅 가능 → 01/02/05 후.
- 07(Harness)는 라우팅이 제자리여야 gate 동작 검증 가능.
- 08(Cleanup)은 CBO가 대체자로 완성된 후에만 안전.
- 09/10은 위 전부 후.

---

## 3. 진입 시 신경 쓸 점 (Carry-forward Notes)

각 sub-plan 시작 시 **앞 단계에서 보장된 것 / 본인이 보장해야 하는 것**을 명시한다.

### 00 → 01/02
- **보장받음**: `vais.config.json`의 `cSuite.cbo` 키 존재, `PIPELINE_ROLES`에 cbo 포함, migration.js 실행 가능
- **주의**: agent markdown 파일이 아직 없으므로 config는 "paths가 곧 생길 것"을 전제. config validation을 Phase 2 직후로 미룸.

### 01 → 03
- **보장**: `agents/cbo/cbo.md` + 10 sub-agent 파일 모두 존재. frontmatter에 `model: sonnet` (sub-agent) / `opus` (cbo 본체). 아직 `advisor:` / `includes:` 필드는 **미기재**.
- **주의**: 10 sub-agent의 I/O 계약(Input/Output/Frameworks)이 일관된 표기로 작성되어야 03/04/06이 정상 파싱.

### 02 → 03
- **보장**: 모든 기존 C-Level 본체가 v0.50 sub-agent 리스트를 반영. 신규 sub-agent(skill-creator, backlog-manager, secret-scanner, dependency-analyzer) 파일 존재. release-engineer은 COO 쪽에만 존재(이동 완료), CTO 쪽에서 삭제됨.
- **주의**: CTO에서 제거된 `release-engineer`가 여전히 CTO agent 본체 markdown에 언급되면 08에서 grep 실패한다.

### 03 → 04
- **보장**: `_shared/advisor-guard.md`, `_shared/ideation-guard.md` 존재. AgentRegistry가 frontmatter `includes: [...]` 필드를 인식하도록 확장됨. 모든 32 sub-agent frontmatter에 `includes: [_shared/advisor-guard.md]` 추가.
- **주의**: includes 병합 순서(prepend vs append) 규칙을 03에서 고정하라. 04에서 다르게 가정하면 프롬프트가 파편화.

### 04 → 06/07
- **보장**: `lib/advisor/wrapper.js`, `prompt-builder.js`, `lib/control/cost-monitor.js` 존재. `vais.config.json` `advisor` 섹션 완성. `advisor_call`, `advisor_degraded`, `advisor_budget_block` 이벤트 스키마 등록. CC 지원 여부 판별 스크립트(`scripts/check-cc-advisor-support.js`) 통과 또는 fallback 확정.
- **주의**: 07에서 agent-stop.js가 advisor 호출 이벤트를 수집하므로 schema.js export가 최신이어야 한다.

### 05 → 06
- **보장**: `skills/vais/phases/ideation.md`, `templates/ideation.template.md`, `docs/00-ideation/` 디렉토리 규칙, `ideation_started`/`ideation_ended` 이벤트 스키마 존재.
- **주의**: plan 스킬의 auto-ref 로직 추가는 06에서 하므로, 05에서는 "요약 파일 경로와 구조만" 확정한다.

### 06 → 07
- **보장**: `skills/vais/phases/cbo.md` 신설, CEO 라우터가 ideation 분기 포함. `skills/vais/phases/cmo.md`, `cfo.md`는 **아직 존재**(08에서 삭제) — 단 SKILL.md 진입점에서는 더 이상 참조하지 않음.
- **주의**: 07에서 agent-start.js의 VALID_ROLES whitelist에 cbo 포함 + cmo/cfo 제외. 06에서 라우팅 대상 mismatch가 있으면 07에서 잡아낸다.

### 07 → 08
- **보장**: agent-stop 4-step pipeline 정상 동작. gate-manager.judgePhaseCompletion가 ideation에 대해 skip. events.json에 `role_transition`, `ideation_started/ended`, `phase_transition_auto/retry`, `gate_judgment` 포함.
- **주의**: 08에서 cmo/cfo 디렉토리를 지워도 07의 VALID_SUBAGENTS 배열에 잔존하면 정의된 에이전트를 로드 못해 start 실패. 순서 확실히.

### 08 → 09
- **보장**: `grep -r "cmo\|cfo" agents/ skills/ lib/ scripts/` 결과 0. `retrospective-writer`, `technical-writer` 참조 0.
- **주의**: CLAUDE.md / AGENTS.md / CHANGELOG 안의 역사적 언급은 "v0.49까지 CMO/CFO 있었음 → v0.50에서 CBO로 통합" 형태로 **유지** (삭제 X). 09 문서에서 이 지점을 명시한다.

### 09 → 10
- **보장**: 모든 테스트 실행 가능 상태. 문서 4종(CLAUDE/AGENTS/README/CHANGELOG) 동기화. 테스트 파일 6종 존재.
- **주의**: 10의 시나리오 검증은 **수동** — 자동 테스트 통과와 별개. S-1, S-2, S-9, S-0(ideation) 4개는 반드시 수동 walkthrough.

---

## 4. 전역 성공 기준 (Master SC)

| # | Criteria | 검증 방법 | 담당 sub-plan |
|---|----------|-----------|---------------|
| SC-1 | 6 C-Level + 32 sub-agent + 신규 8개 파일 존재 & frontmatter 유효 | `scripts/vais-validate-plugin.js` | 01, 02 |
| SC-2 | `vais.config.json`이 v0.50 스펙과 일치 (cbo 포함, cmo/cfo 제거) | JSON schema | 00 |
| SC-3 | v0.49→v0.50 상태 파일 마이그레이션 성공 | `tests/migration.test.js` | 00 |
| SC-4 | `grep -r "cmo\|cfo"` in agents/skills/lib/scripts == 0건 (CHANGELOG/CLAUDE.md 역사 언급은 예외) | 수동 grep | 08 |
| SC-5 | agent-stop.js 4단계 파이프라인 동작 | `tests/gate-manager.test.js`, 수동 | 07 |
| SC-6 | S-1, S-2, S-9, S-0(ideation) 수동 walkthrough 통과 | 시나리오 체크리스트 | 10 |
| SC-7 | `npm test` 전체 통과 | CI | 09 |
| SC-8 | `/vais cpo ideation {topic}` 실행 시 산출물 강제 없이 대화 시작 | 수동 | 05 |
| SC-9 | ideation 종료 시 `docs/00-ideation/cpo_{topic}.md` 생성 + 구조 유효 | 수동 + schema | 05 |
| SC-10 | `/vais cpo plan {topic}` 실행 시 ideation 요약이 plan 컨텍스트로 주입 | 수동 | 06 |
| SC-11 | `/vais ceo ideation {topic}` → CEO가 C-Level 추천 + AskUserQuestion → 자동 전환 | 수동 | 06 |
| SC-12 | ideation 없이 `/vais cpo plan {topic}` 직행 시 기존과 동일 동작 | 수동 | 05, 06 |
| SC-13 | CLAUDE.md Rule #2에 "ideation은 optional" 명시 | grep | 09 |
| SC-14 | 32 Sonnet sub-agent 전체 frontmatter에 `advisor.enabled: true` + `model: claude-opus-4-6` + `max_uses: 3` | `grep -l "advisor:" agents/**/*.md \| wc -l == 32` | 04 |
| SC-15 | `agents/_shared/advisor-guard.md` 존재 + 모든 32 sub-agent `includes:`에 포함 | AgentRegistry 로드 검증 | 03 |
| SC-16 | CC advisor 지원 검증 스크립트 통과 OR fallback wrapper 동작 | `scripts/check-cc-advisor-support.js` + `tests/advisor-integration.test.js` | 04 |
| SC-17 | `vais.config.json.advisor` 섹션에 max_calls_per_session, monthly_budget_usd 정의 | JSON schema | 04 |
| SC-18 | `advisor_call`, `advisor_degraded`, `advisor_budget_block` 이벤트 타입 schema 등록 | `lib/observability/schema.js` export + 실제 기록 | 04 |
| SC-19 | backend-engineer 1회 작업 중 advisor 평균 2~3회 호출, max 3 초과 0건 | `tests/advisor-integration.test.js` | 04 |
| SC-20 | monthly_budget 초과 시 cost-monitor가 advisor 자동 비활성화 + Sonnet 단독 동작 + `advisor_degraded` 이벤트 | `tests/advisor-degrade.test.js` | 04 |
| SC-21 | 10 시나리오(S-1~S-10) C-Level 참여 매트릭스와 실제 라우팅 일치 | 수동 walkthrough | 10 |

---

## 5. Checkpoint Decisions (carried from v1.3)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| CP-1 | 전체 범위 승인 | 6 C-Level + 32 agent + Ideation + Advisor + Harness gates | 요구사항 문서 3종 정합 |
| CP-2a | 진행 방식 | sub-plan별 순차 + 각 gate에 사용자 승인 | 단계마다 되돌릴 여지 확보 |
| CP-2b | CMO/CFO 삭제 시점 | CBO 완성(01) + 라우팅 전환(06) 후(08) | 안전 제거 |
| CP-2c | v2 guide 처리 | `guide/*-v2.md` 그대로 유지 | 향후 레퍼런스 |
| CP-3a | Ideation optional | Rule #2 mandatory 목록 제외 | plan 직행 호환 |
| CP-3b | CEO ideation 라우팅 UX | 사용자 승인 후 자동 전환 | 마찰 최소 |
| CP-3c | Ideation 종료 방식 | 사용자 명시 키워드 only | 사용자 주권 (Rule #11) |
| CP-3d | plan ↔ ideation 참조 | 자동 참조 (파일 존재 시) | 휴먼 에러 제거 |
| AD-1 | Advisor 범위 | 32 Sonnet sub-agent 전체 ON, C-Level OFF | C-Level은 이미 Opus |
| AD-2 | C-Level vs Advisor 역할 | C-Level = 조직 의사결정 / Advisor = 실행 중 전술 보조 | 직교 |
| AD-3 | max_uses 캡 | 3 (early/stuck/final) | Anthropic 권장 패턴 |
| AD-4 | Caching | `{type: ephemeral, ttl: 5m}` 전원 ON | 3회 호출 break-even |
| AD-5 | CC 미지원 시 | `lib/advisor/wrapper.js` fallback | frontmatter 스키마는 동일 |
| AD-6 | 신규 모듈 ID | M-24 Advisor Integration | M-23(Ideation)와 분리 |
| AD-7 | 비용 캡 초과 | Degrade Gracefully (advisor 자동 비활성화, hard block X) | 작업 흐름 중단 방지 |
| AD-8 | Sub-agent 카운트 통일 | **v0.50 최종 32** (C-Level 6 본체 제외) | SC-14 기준 |

---

## 6. 실행 체크리스트 (Master Dashboard)

아래 체크박스는 각 sub-plan 완료 시 이 파일에서 체크한다.

- [x] **00** Migration Foundation (`vais.config.json` v0.50 반영 + migration 단위 테스트 통과)
- [x] **01** CBO Agents (11개 파일 존재 + `scripts/vais-validate-plugin.js` 통과)
- [x] **02** Existing C-Level Updates (신규 sub-agent 4종 파일 존재 + CTO에서 release-engineer 제거)
- [x] **03** Shared Guards & Registry (`_shared/*.md` 2종 + AgentRegistry includes 단위 테스트)
- [x] **04** Advisor Integration (M-24) (38 sub-agent frontmatter advisor 필드)
- [x] **05** Ideation Phase (phases/ideation.md + template + docs/00-ideation/ + schema 이벤트)
- [x] **06** Phase Routers (CEO 동적 라우팅 + `skills/vais/phases/cbo.md` + SKILL.md 진입점)
- [x] **07** Harness Gates (gate-manager judgePhaseCompletion + `tests/gate-manager.test.js` 11 pass)
- [x] **08** Cleanup & Removal (agents/cmo,cfo 삭제 + grep 정리 + `npm test` 154 pass)
- [x] **09** Docs & Tests (CLAUDE.md Rule#2 ideation optional + CHANGELOG 완성 + 154 pass)
- [x] **10** Scenario Verification (S-0/S-1/S-2/S-9 구조적 검증 20/20 pass + scenario-verification.test.js)

---

## 7. 변경 이력

| Version | Date | Change |
|---------|------|--------|
| v2.0 | 2026-04-15 | 기존 상세 plan 내용 삭제 → master/index 역할로 재정비. 11개 sub-plan으로 분할. `docs/02-design/features/v050-full-overhaul.design.md` 제거(상세는 각 sub-plan에 흡수). |

---

## 8. 참조

- 요구사항: `guide/agent-mapping-v2.md`, `guide/csuite-roles-v2.md`, `guide/csuite-scenarios-v2.md`, `guide/harness-plan-v2.md`
- 구버전 참조: `guide/csuite-flow-v1.md`, `guide/csuite-scenarios-v1.md`
- 현재 플러그인 매니페스트: `package.json`, `.claude-plugin/plugin.json`, `vais.config.json`
