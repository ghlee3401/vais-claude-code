# legacy-prune-and-agent-onboarding — 완료 보고서

> Phase: 📊 report | Owner: CTO | Date: 2026-05-02

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v0.62.0 까지 진화하면서 README 0.61.1 잔존 + release-engineer deprecated 미제거 + 진입점 분산 |
| **Solution** | 7항목 단발 정리 — 버전 동기화 + deprecated 제거 + ONBOARDING.md 신규 + 진입점 역할 분리 + Mermaid 의존 그래프 |
| **Effect** | 처음 본 AI/사람이 ONBOARDING.md 1개 (~5분) 로 repo 구조·진입점·워크플로우 파악 가능 |
| **Core Value** | 단일 진입점 (ONBOARDING.md) → 명확한 분기 (CLAUDE/AGENTS/SKILL) → 빠른 onboarding |

---

## 최종 산출물

### 변경 (8개 파일)

| 파일 | 작업 | 효과 |
|------|------|------|
| `ONBOARDING.md` | create (135줄) | 5분 진입 가이드 — What / Quick Start / Architecture(Mermaid) / 진입점 표 / Next Steps |
| `CLAUDE.md` | modify | 상단 책임 1줄 + Project Structure 갱신 (sub-agent 38→37, design-system/, ONBOARDING.md, catalog.json 자동 생성) |
| `AGENTS.md` | modify | 상단 책임 1줄 (Cursor/Copilot 호환 + ONBOARDING.md 안내) |
| `skills/vais/SKILL.md` | modify | frontmatter 위 책임 주석 2줄 |
| `README.md` | modify | 버전 0.61.1 → 0.62.0 (2곳) |
| `agents/coo/release-engineer.md` | **delete** | v0.60 target 도달 (현재 v0.62.0) |
| `vais.config.json` | modify | `cSuite.coo.subAgents` 에서 release-engineer 제거 |
| `docs/legacy-prune-and-agent-onboarding/` | create | 6 phase 산출물 |

### 산출물 (6 phase docs)

- `00-ideation/main.md` v1.0 (CEO)
- `01-plan/main.md` v1.0 (CTO)
- `02-design/main.md` v1.0 (CTO)
- `03-do/main.md` v1.0 (CTO)
- `04-qa/main.md` v1.0 (CTO)
- `05-report/main.md` v1.0 (본 문서)

---

## Phase 별 진화

| Phase | 핵심 결정 |
|-------|----------|
| ideation | 피처명 `legacy-prune-and-agent-onboarding`, Medium 범위 7항목 합의, CPO 생략 |
| plan | 7항목 spec + Decision Record 6건 (D-1 release-engineer 제거 / D-2 ONBOARDING 5섹션 / D-3 진입점 책임 1줄 / D-4 Mermaid 단일 그래프 / D-5 catalog.json 자동 생성 명시 / D-6 CTO 직접 작성) |
| design | ONBOARDING.md 5섹션 구조 + 진입점 표 spec (4행 × 4열) + Mermaid 9 노드 + 변경 매트릭스 6 파일 |
| do | spec 100% 구현, 디자인 이탈 0 |
| qa | matchRate 100%, Critical 0 / Important 0 / Minor 4 (모두 후속 피처 후보) |

---

## Success Criteria 최종 평가

| ID | Criterion | 평가 |
|----|-----------|:----:|
| SC-01 | README.md 의 모든 버전 표기가 0.62.0 | ✅ Met |
| SC-02 | release-engineer.md 제거 + 5 분해 sub-agent 유지 | ✅ Met |
| SC-03 | ONBOARDING.md 존재 + 5섹션 + Mermaid + 표 + ≤170줄 | ✅ Met (135줄) |
| SC-04 | CLAUDE.md 에 catalog.json + 진입 순서 명시 | ✅ Met |
| SC-05 | 4 진입점 모두 책임 1줄 | ✅ Met |

**최종 matchRate: 100%** | Critical: 0 | Important: 0 | Minor: 4

---

## 후속 작업 (관찰 → 후속 피처 후보)

| # | 항목 | 후속 피처 후보 | 우선순위 |
|---|------|---------------|:-------:|
| 1 | agents/*.md frontmatter 통일 (description / triggers / advisor 표준화) | `agent-frontmatter-unification` | 의식 작업이 늘면 |
| 2 | agents 부피 감축 (clevel-main-guard 외부화) — 6 C-Level × ~75줄 = ~450줄 중복 | `agent-volume-reduction` | 부피 부담이 가시화되면 |
| 3 | 자동 의존 그래프 생성 도구 (Mermaid 자동) | `auto-dependency-graph` | 그래프 drift 가 빈번해지면 |
| 4 | CLAUDE.md sub-agent 목록 정확성 audit | (audit-only) | 사용자 발견 시 |
| 5 | catalog.json 자동 갱신 정책 (commit hook / CI) | `catalog-auto-refresh-audit` | catalog drift 발견 시 |

---

## Memory 기록 사항

| key | summary |
|-----|---------|
| `legacy-prune-and-agent-onboarding.complete` | ONBOARDING.md 신규 + 4 진입점 책임 1줄 + release-engineer v0.60 target 도달 제거. matchRate 100% |
| `entry-point-policy` | 처음 본 AI/사람 = ONBOARDING.md (5분), Claude Code = CLAUDE.md (자동), 기타 AI = AGENTS.md, /vais 명령 = SKILL.md |

---

## 다른 C-Level 후속 (사용자 결정)

| C-Level | 가치 | 권장도 |
|---------|------|:------:|
| CSO | 본 피처는 코드/의존성 변경 없음 → 가치 매우 낮음 | ❌ 불필요 |
| COO | 운영 변경 없음 | ❌ 불필요 |
| CBO | 무관 | ❌ 불필요 |
| CPO | 이미 ideation 에서 생략 | ❌ 생략됨 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CTO report — 6 phase 요약 + SC 100% + 후속 5건 + Memory 2건 |
