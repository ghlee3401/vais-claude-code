# legacy-prune-and-agent-onboarding — 기획서

> ⛔ Plan 단계 범위: 분석·결정만. 프로덕트 파일 생성·수정은 Do 단계.
> 📝 Standard 템플릿 + CTO 강행 모드 (PRD 부재, ideation v1.0 컨텍스트 사용).
> Phase: 📋 plan | Owner: CTO | Date: 2026-05-02

## 요청 원문

> "전체 한 번 코드를 살펴보면서 현재 버전과 비교했을 때 필요 없는 것들은 제거하고 이 코드를 다시 봤을 때 다른 agent가 파악할 때 빠르게 파악하기 쉽도록 calude.md랑 agent.md, skill.md 등 참고하는 파일들을 정리하고 싶어."

## In-scope (Medium 7항목)

1. **버전 동기화** — `README.md` 0.61.1 → 0.62.0 (2곳: badge + npm test 줄)
2. **deprecated 정리** — `agents/coo/release-engineer.md` 제거 (v0.60 target, 현재 v0.62.0 — 도달함)
3. **ONBOARDING.md 신규 (~150줄)** — AI agent / 사람 개발자 진입 가이드 (5분 읽기)
4. **CLAUDE.md 정비** — "What This Project Is" 강화 + 진입 순서 명시 + catalog.json 정체 1줄
5. **AGENTS.md 역할 명확화** — 상단에 "이 파일은 Cursor/Copilot/일반 AI 호환용. Claude Code 는 CLAUDE.md 우선" 1줄
6. **의존 그래프 (Mermaid)** — `agents ↔ skills ↔ hooks ↔ vais.config.json` 관계 시각화 (ONBOARDING.md 내)
7. **3 진입점 역할 표** — CLAUDE.md / AGENTS.md / ONBOARDING.md / SKILL.md 각 파일 책임을 표로 명시

## Out-of-scope

- agents/*.md frontmatter 통일 → 후속 피처 `agent-frontmatter-unification`
- agents 부피 감축 (clevel-main-guard 외부화) → 후속 피처 `agent-volume-reduction`
- Sub-agent 통합/제거 (구조 변경) → 후속
- 자동 의존 그래프 생성 도구 → 후속
- vendor/ui-ux-pro-max, basic/, docs/_legacy/ — 변경 금지
- 자발 감지 확장은 `## 관찰` 섹션 (Rule #9)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v0.62.0 까지 진화하면서 README 0.61.1 잔존 + release-engineer deprecated 미제거 + 진입점 분산 (CLAUDE.md/AGENTS.md/SKILL.md 모두 길고 진입 순서 모호) |
| **Solution** | 7항목 단발 정리 — 버전 동기화 + deprecated 제거 + ONBOARDING.md 신규 + 진입점 역할 분리 + 의존 그래프 1장 |
| **Effect** | 처음 본 AI/개발자가 5분 내 핵심 파일 6개와 워크플로우 진입점 식별 가능 |
| **Core Value** | 단일 진입점 (ONBOARDING.md) → 명확한 분기 (CLAUDE.md / AGENTS.md / SKILL.md) → 빠른 파악 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 코드베이스 진화로 진입점 분산 + legacy 잔재 — 새 AI/개발자 onboarding 비용 상승 |
| WHO | 다른 AI agent (Claude/Cursor/Copilot) + 신규 인원 + 미래의 본인 |
| RISK | ONBOARDING.md 가 또 다른 분산 진입점으로 작동 / deprecated 제거 시 외부 호환 깨짐 |
| SUCCESS | (1) README 버전 통일 (2) release-engineer 제거 + 5 분해 sub-agent 그대로 (3) ONBOARDING.md 5분 읽기 분량 (4) 3 진입점 역할 표 + Mermaid 그래프 |
| SCOPE | docs/메타파일 정리 (코드 로직 변경 X) |

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source |
|---|----------|:-----:|-----------|--------|
| 1 | release-engineer.md 제거 (v0.60 target, 현재 v0.62.0) | cto | deprecation_notice 약속 이행. 5 분해 sub-agent 는 그대로 유지 | 진단 |
| 2 | ONBOARDING.md = 5분 읽기 분량 (~150줄) — Quick Start + Architecture 한 그림 + 진입점 표 + 다음 단계 | cto | "5분"이 측정 가능 SC, 길어지면 또 다른 분산 진입점 | hypothesis |
| 3 | CLAUDE.md / AGENTS.md / ONBOARDING.md / SKILL.md 각 파일 상단에 "이 파일의 책임" 1줄 | cto | 진입 분산을 진입 분기로 전환 — 어디 봐야 하는지 즉시 판별 | hypothesis |
| 4 | 의존 그래프는 Mermaid 로 ONBOARDING.md 내 (별도 파일 X) | cto | 1장만 필요, 별도 파일은 또 다른 분산 | YAGNI |
| 5 | catalog.json 정체 1줄을 CLAUDE.md 절 추가 — `scripts/build-catalog.js` 자동 생성물 명시 | cto | 45KB 정체 불명 → 자동 생성물임을 명시하면 사람이 직접 편집 안 함 | 진단 |
| 6 | sub-agent 위임 미사용 (CTO 직접 작성) | cto | Medium 작업 양 + 명확한 spec — sub-agent 위임 의미 적음 | 효율 |

---

## 4. 기능 요구사항 (요약)

| # | 작업 | 산출물 | 우선순위 |
|---|------|--------|:-------:|
| 1 | README.md 버전 동기화 (2곳) | README.md 수정 | Must |
| 2 | release-engineer.md 제거 + agents/coo/README 또는 CLAUDE.md 에서 참조 제거 | 1 파일 삭제 + 참조 갱신 | Must |
| 3 | ONBOARDING.md 신규 (~150줄, 5 섹션: What/Quick Start/Architecture(Mermaid)/진입점 표/Next) | `ONBOARDING.md` 신규 | Must |
| 4 | CLAUDE.md "What This Project Is" 강화 + 진입 순서 명시 + catalog.json 1줄 | CLAUDE.md 수정 | Must |
| 5 | AGENTS.md 상단에 "Cursor/Copilot 호환 — Claude Code 는 CLAUDE.md 우선" 1줄 | AGENTS.md 수정 | Must |
| 6 | 의존 그래프 Mermaid (ONBOARDING.md 내) | (3에 포함) | Must |
| 7 | 3 진입점 역할 표 (CLAUDE / AGENTS / ONBOARDING / SKILL) | (3에 포함) | Must |

---

## 5. 정책 (비즈니스 규칙)

| # | 정책 | 규칙 |
|---|------|------|
| 1 | 진입점 분기 | 처음 본 사람/AI 가 어떤 파일을 먼저 봐야 하는지 1초에 판단 가능. 각 파일 상단에 "이 파일의 책임" 1줄 |
| 2 | deprecated 정책 | `removal_target` 에 명시된 버전에 도달하면 실제 제거. backwards-compat 의도가 명시되어 있으면 유지 |
| 3 | ONBOARDING 분량 한계 | 5분 (~150줄) 초과 금지 — 길어지면 분산 진입점 |
| 4 | 외부 호환 보호 | AGENTS.md, README.md 의 외부 참조 깨지지 않도록 — link만 변경, file 이름 변경 금지 |

---

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | README.md 의 모든 버전 표기가 0.62.0 | `grep "0\\.61\\.1" README.md` → 0건 |
| SC-02 | `agents/coo/release-engineer.md` 제거 + 5 분해 sub-agent 5개 모두 유지 | `ls agents/coo/release*.md` → 미존재, 5 sub-agent 존재 |
| SC-03 | ONBOARDING.md 존재 + 5섹션 + Mermaid 1개 + 진입점 표 + ≤170줄 | `wc -l ONBOARDING.md` + grep |
| SC-04 | CLAUDE.md 에 catalog.json 정체 1줄 명시 + 진입 순서 안내 | grep |
| SC-05 | 4 진입점 (CLAUDE/AGENTS/ONBOARDING/SKILL) 모두 상단에 "이 파일의 책임" 1줄 | 각 파일 head 확인 |

---

## Impact Analysis

### Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `README.md` | modify | 버전 0.61.1 → 0.62.0 (2곳) + 상단 "이 파일의 책임" 1줄 (선택) |
| `CLAUDE.md` | modify | "What This Project Is" 강화 + 진입 순서 + catalog.json 1줄 + 상단 책임 1줄 |
| `AGENTS.md` | modify | 상단 책임 1줄 (Cursor/Copilot 호환) |
| `agents/coo/release-engineer.md` | **delete** | v0.60 target 도달 |
| `ONBOARDING.md` | **create** | 신규 (~150줄) |
| `skills/vais/SKILL.md` | modify (선택) | 상단 책임 1줄 — 역할 = "vais 명령어 진입점" |

### 검증

- [ ] 5 분해 sub-agent (release-notes-writer/ci-cd-configurator/container-config-author/migration-planner/runbook-author) 모두 정상
- [ ] vais.config.json 의 cSuite.coo.subAgents 에서 release-engineer 참조 제거되었는지 확인
- [ ] CLAUDE.md 의 release-engineer 언급 제거 (있으면)
- [ ] doc-validator 통과
- [ ] 외부 링크 깨짐 없음

## 7. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 작성 도구 | Markdown + Mermaid | GitHub 호환, 별도 빌드 X |
| 검증 | doc-validator + grep + wc | 본 피처 SC 모두 텍스트/grep 으로 측정 가능 |

## 관찰 (후속 과제)

> Rule #9: 자발 감지 확장 후보. In-scope 자동 승계 금지.

- **agents/*.md frontmatter 통일** — description 형식, triggers, advisor 설정 등 표준화. 후속 피처 `agent-frontmatter-unification`
- **agents 부피 감축** — clevel-main-guard inline 주입(6 C-Level × ~75줄 = ~450줄 중복) → frontmatter `includes:` 활용 가능 시점에 외부화. 후속 피처 `agent-volume-reduction`
- **자동 의존 그래프 생성** — 본 피처는 수동 Mermaid 1장. 자동화는 후속 피처
- **catalog.json 자동 갱신** — `scripts/build-catalog.js` 가 commit hook 이나 CI에서 자동 갱신되는지 확인. 안 되면 갱신 정책 후속

---

## Topic Documents

| Topic | 파일 | Owner | 한 줄 요약 |
|-------|------|:-----:|-----------|
| (none) | — | cto | 본 plan 은 main.md 단독으로 충분 (작업 양 작음, 7항목 모두 main.md 에 명시) |

## Scratchpads

| Agent | 경로 | 비고 |
|-------|------|-----|
| (none) | — | sub-agent 미위임, CTO 직접 작성 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO plan 초기 작성 — Medium 7항목 spec, Decision Record 6건, SC 5건, Impact Analysis, 관찰 4건. sub-agent 미위임. |

<!-- template version: plan-standard v0.58.5 (강행 모드, sub-agent 미위임) -->
