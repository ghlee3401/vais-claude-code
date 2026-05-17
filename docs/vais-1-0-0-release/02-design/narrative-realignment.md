---
owner: cto
artifact: narrative-realignment
phase: design
feature: vais-1-0-0-release
generated: 2026-05-17
agent: infra-architect
summary: "5개 파일 narrative diff 설계 — README.md·CLAUDE.md·ONBOARDING.md·marketplace.json·plugin.json → 1.0.0 GA organization-in-a-box 정식 표기"
---

> 참조 문서: `docs/vais-1-0-0-release/00-ideation/main.md`, `docs/vais-1-0-0-release/01-plan/tech-plan.md`

# Narrative Realignment Design — vais-1-0-0-release

> Phase: design | Owner: CTO | Agent: infra-architect | Date: 2026-05-17

---

## 1. README.md 존재 — 정정 (v1.1)

> ⚠️ v1.0 의 "부재 / skip" 판단은 **오류**. 루트 `README.md` 존재 (25KB, 2026-05-09).
> design v1.2 (main.md) 와 정합 — narrative 대상에 포함.

| 경로 | 결과 | 처리 |
|------|------|------|
| `/Users/ghlee/workspace/vais-claude-code/README.md` | **존재** (25KB, badge `version-0.65.3-blue` stale 4 minor) | narrative diff 대상 (§2) |
| `basic/README.md` | 패턴 참고용 폴더 | 수정 X |
| `vendor/README.md` | 외부 의존 폴더 | 수정 X |

**결정**: 루트 README.md 의 (1) version badge stale 갱신 (2) ONBOARDING `#agent-teams-activation` 링크 노출 추가 (3) 6 C-Level / 47 sub-agent 문구 1.0.0 GA 기준 정합. Do phase 작업 파일 수 = **5개**.

---

## 2. README.md narrative 변경 diff

### 2-1. Badge (line 2)

```diff
-  <img src="https://img.shields.io/badge/version-0.65.3-blue?style=flat-square" alt="version" />
+  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="version" />
```

### 2-2. Subtitle (line 11-12)

```diff
-  <strong>Virtual AI C-Suite for Software Development</strong><br/>
-  6 C-Level Executives · 47 Specialized Sub-agents · 7-Dimension Routing Algorithm
+  <strong>Virtual AI C-Suite for Software Development — v1.0.0 GA</strong><br/>
+  organization-in-a-box · 6 C-Level Executives · 47 Specialized Sub-agents · 7-Dimension Routing Algorithm
```

### 2-3. Quick Start 직후 — Agent Teams 활성화 안내 1줄 추가 (선택 사항, 강제 X)

ONBOARDING.md 의 `#agent-teams-activation` 섹션을 README 의 표면 통로로 노출:

```diff
  /reload-plugins
  /vais help
  ```
+
+ > **(선택) Real SendMessage 활성화**: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` + Claude Code 2.1+ + `vais.config.json > agentTeams.enabled=true`. 미활성 시 simulation graceful degradation 자동 fallback (작업 안 멈춤). 자세한 설명은 [ONBOARDING.md#agent-teams-activation](./ONBOARDING.md#agent-teams-activation)
```

> design v1.2 결정 #7 정합 — GA default false 유지 + 안내만. README 가 강제하지 않고 anchor 링크 1줄만 노출.

---

## 3. CLAUDE.md narrative 변경 diff

### 3-1. 헤더 블록 (lines 4-6 현재)

```diff
-> Virtual AI C-Suite for software development (v0.68.0)
-> Claude Code marketplace plugin: `vais-code`
+> Virtual AI C-Suite for software development (v1.0.0 GA)
+> Claude Code marketplace plugin: `vais-code` — organization-in-a-box GA
```

### 3-2. "What This Project Is" 섹션 첫 단락 (현재)

```diff
-**vais-code 정체성 (v0.66+)**: *organization-in-a-box* — PO 1 명이 부서장 OJT 매뉴얼 (도메인 지식 박제) 을 통해 가상 C-Suite 조직을 운영하는 도구. 부서장 OJT 4 요소 (framework + 실무 단계 + 의사결정 패턴 + 산출물 양식) 가 grep 가능 영역에 박제되어 vanilla CC 와 차별화.
+**vais-code 정체성 (v1.0.0 GA)**: *organization-in-a-box* — PO 1 명이 부서장 OJT 매뉴얼 (도메인 지식 박제) 을 통해 가상 C-Suite 조직을 운영하는 도구. 부서장 OJT 4 요소 (framework + 실무 단계 + 의사결정 패턴 + 산출물 양식) 가 grep 가능 영역에 박제되어 vanilla CC 와 차별화.
```

### 3-3. "What This Project Is" 섹션 두 번째 단락 — v0.x history 라인 말미 추가

```diff
  ... **v0.66.0** — Ideation Continuity (M0 4 메커니즘) + Knowledge Pack Tier-1A (CEO Rumelt + CPO PRD OJT + CTO Architecture Decision) + manual @include Knowledge Index.
+ **v0.68.0** — Agent Teams 대화-합성 모델 (Conversation Orchestrator + Lazy Consensus 5-state FSM, opt-in). **v1.0.0 GA** — organization-in-a-box 정체성 정식 GA. status.json v4, git tag v1.0.0.
```

> 설명: v0.66.0 이후의 v0.67~v0.68 변경 이력이 CLAUDE.md 두 번째 단락 말미에 없음. 1.0.0 GA 선언과 함께 이력 한 줄 추가. v0.68.0 항목을 삽입하고 v1.0.0 GA 를 그 뒤에 이어 붙인다.

---

## 4. ONBOARDING.md narrative 변경 diff

### 4-1. "What This Is" 섹션 — 현재 버전 표기 (line 23)

```diff
-현재 버전: **v0.68.0** (0.66.0 organization-in-a-box → 0.66.1 cross-model P0 hotfix → 0.67.0 workflow contract alignment → 0.68.0 Agent Teams 대화-합성 모델 도입: Conversation Orchestrator + Lazy Consensus 5-state FSM + 합성문/decisions-log 템플릿 + 패턴 D sub-agent worktree + status.json v4 + clevel-doc-coexistence v3 — opt-in default false 로 0.67.0 byte-level 동등).
+현재 버전: **v1.0.0 GA** (0.66.0 organization-in-a-box → 0.66.1 cross-model P0 hotfix → 0.67.0 workflow contract alignment → 0.68.0 Agent Teams 대화-합성 모델 도입 (opt-in) → **1.0.0 GA**: organization-in-a-box 정체성 정식 GA + status.json v4 + git tag v1.0.0).
```

### 4-2. 변경 이력 표 — 신규 행 추가 (현재 v3.0 이 마지막)

```diff
  | v3.0 | 2026-05-07 | v0.65 시리즈 반영 — frontmatter 8→4 필수 (auto-hydrate), lean checkpoint, knowledge lazy-load 19 MD, auto-select-template 4-tier, CEO 진입 절차 박제 (v0.65.3). v0.63.0 → v0.65.3. agents 카운트 37 → 47 sub-agents. |
+ | v4.0 | 2026-05-17 | v1.0.0 GA 반영 — organization-in-a-box 정체성 정식 GA. 버전 표기 v0.68.0 → v1.0.0 GA. |
```

> 설명: ONBOARDING.md 에는 v0.66~v0.68 업데이트가 미반영 상태. v4.0 행 하나로 GA 전환을 기록한다. v0.66~v0.68 세부 이력은 CLAUDE.md / CHANGELOG.md 위임.

---

## 5. .claude-plugin 양쪽 description 변경 diff

### 5-1. `marketplace.json` — `metadata.description`

```diff
-"description": "VAIS Code — organization-in-a-box (부서장 매뉴얼). 4 Primary (CEO/CPO/CTO/CSO) + 2 Secondary (CBO/COO 명시 호출). CEO 7 차원 알고리즘 + sub-agent 직접 박제 (frontmatter 4 필수 필드) + AskUserQuestion 클릭. v0.69: Real SendMessage 통합 — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 토글 시 진짜 대화-합성 / 미활성 시 simulation graceful degradation",
+"description": "VAIS Code — v1.0 GA: organization-in-a-box 정체성 정식 GA. PO 1명이 6 C-Suite 가상 조직 운영 — CEO 7 차원 알고리즘으로 활성 C-Level 자동 결정 + sub-agent 직접 박제 (frontmatter 4 필수 필드) + AskUserQuestion 클릭. Real SendMessage 또는 simulation graceful degradation (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 토글).",
```

### 5-2. `marketplace.json` — `plugins[0].description`

```diff
-"description": "AI code-development assistant simulating a virtual C-Suite. v2.0 — 4 Primary (CEO/CPO/CTO/CSO) auto-routing via CEO 7-dimension algorithm + 2 Secondary (CBO/COO) explicit call only. Sub-agent direct stamping with frontmatter 4 mandatory fields (owner/artifact/phase/feature). CTO is the only mandatory PDCA (plan→design→do→qa→report).",
+"description": "AI code-development assistant simulating a virtual C-Suite. v1.0 GA — organization-in-a-box: PO runs 6 virtual C-Suite agents (CEO 7-dimension algorithm auto-routing). 4 Primary (CEO/CPO/CTO/CSO) + 2 Secondary (CBO/COO explicit). Sub-agent direct stamping (frontmatter 4 fields). CTO mandatory PDCA. Real SendMessage or simulation graceful degradation.",
```

### 5-3. `plugin.json` — `description`

```diff
-"description": "VAIS Code - 코드 개발 도우미. 4 Primary C-Suite (CEO/CPO/CTO/CSO) + 2 Secondary (CBO/COO 명시 호출). CEO 7 차원 빈틈없는 판단 + sub-agent 직접 박제 + AskUserQuestion 클릭 인터페이스.",
+"description": "VAIS Code — v1.0 GA organization-in-a-box. PO 1명이 6 C-Suite 가상 조직 운영. 4 Primary (CEO/CPO/CTO/CSO) + 2 Secondary (CBO/COO 명시 호출). CEO 7 차원 알고리즘 + sub-agent 직접 박제 + AskUserQuestion 클릭 인터페이스.",
```

---

## 6. Do phase 작업 시퀀스 + 검증

| # | 파일 | 작업 내용 | 검증 명령 |
|---|------|----------|----------|
| 1 | `README.md` | badge `0.65.3` → `1.0.0` + subtitle 에 "v1.0.0 GA" + "organization-in-a-box" 추가. Quick Start 직후 `#agent-teams-activation` link 1줄 노출 | `grep "version-1.0.0" README.md && grep "agent-teams-activation" README.md` |
| 2 | `CLAUDE.md` | 헤더 v0.68.0 → v1.0.0 GA + organization-in-a-box GA 추가. "What This Project Is" 정체성 라벨 v0.66+ → v1.0.0 GA. 말미 v0.68.0 + v1.0.0 GA 이력 1줄 추가 | `grep "1.0.0 GA" CLAUDE.md` |
| 3 | `ONBOARDING.md` | 현재 버전 표기 v0.68.0 → v1.0.0 GA (1줄). 변경 이력 표 v4.0 행 추가 | `grep "1.0.0 GA" ONBOARDING.md` |
| 4 | `.claude-plugin/marketplace.json` | `metadata.description` + `plugins[0].description` 2곳 — v0.69/v2.0 라벨 → v1.0 GA + organization-in-a-box GA 문구 | `grep "organization-in-a-box" .claude-plugin/marketplace.json` |
| 5 | `.claude-plugin/plugin.json` | `description` — v1.0 GA narrative 일관화 | `grep "1.0 GA" .claude-plugin/plugin.json` |

### 작업 선후 의존성

```
(없음) → 작업 1 (README.md)     ─┐
(없음) → 작업 2 (CLAUDE.md)     ─┤
(없음) → 작업 3 (ONBOARDING.md) ─┼→ 모두 독립. 병렬 가능.
(없음) → 작업 4 (marketplace)   ─┤
(없음) → 작업 5 (plugin.json)   ─┘
```

> 모든 narrative 변경은 서로 의존성 없음. Do phase 에서 순서 무관하게 실행 가능.

### 사후 통합 검증 (5 파일 완료 후)

```bash
grep "version-1.0.0" README.md
grep "1.0.0 GA" CLAUDE.md
grep "1.0.0 GA" ONBOARDING.md
grep "organization-in-a-box" .claude-plugin/marketplace.json
grep "1.0 GA" .claude-plugin/plugin.json
```

모두 1건 이상 hit 시 narrative 재정렬 완료.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-17 | 초기 작성 — README.md 부재 확인 + 4파일 diff 설계 + Do phase 시퀀스 5행 |
| v1.1 | 2026-05-17 | review 반영 — README.md 실제 존재 확인 (v1.0 의 "부재" 판단은 오류). §2 신설 (README diff: badge + subtitle + agent-teams-activation link). §2→§3, §3→§4, §4→§5, §5→§6 으로 번호 재정렬. Do 작업 5행 정렬 (README 가 #1) |
