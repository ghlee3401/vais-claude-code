# legacy-prune-and-agent-onboarding — Ideation

> Phase: 💡 ideation (optional)
> Owner: CEO
> Date: 2026-05-02
> Status: completed

## [CEO] Ideation Summary

### 문제 (Problem)

- 코드베이스가 v0.62.0 까지 진화하면서 **legacy 잔재** + **진입점 분산** 발생
- 다른 AI agent (Claude/Cursor/Copilot) 또는 사람 개발자가 처음 보고 빠르게 파악하기 어려움
- 사용자 관찰: "필요 없는 것들 제거 + 다른 agent 가 파악할 때 빠르게"

### 진단 (코드베이스 스냅샷, 2026-05-02)

| 영역 | 수치 / 관찰 |
|------|------------|
| `agents/` | 58 md, 10,032 줄 (clevel-main-guard inline 주입 → 6 C-Level 마다 ~75줄 중복) |
| `skills/vais/` | 16 md (phases/ + utils/ 분리 OK) |
| Top-level | AGENTS.md(6.6KB) + CLAUDE.md(14KB) + README.md(19KB) — 진입점 분산 |
| **버전 잔존 (0.61.1)** | README.md (2곳), CHANGELOG history 보존, package-lock 자동 → README **CLAUDE.md Rule 위반** |
| Deprecated 마커 | 8 파일 (release-engineer 등 v0.59 분해) — 일부 backwards-compat 의도, 일부 cleanup 가능 |
| 진입점 명확성 | "처음 본 AI 가 어디부터?" 답이 모호. CLAUDE.md/AGENTS.md/SKILL.md 모두 길고 진입 순서 불명 |
| 의존 그래프 | agents ↔ skills ↔ hooks ↔ vais.config.json 관계가 텍스트로만 산재 |

### 가설 (Hypothesis)

> legacy 잔재 정리 (버전 동기화 + deprecated 명시) + AI agent 친화 진입점 (ONBOARDING.md + CLAUDE/AGENTS 역할 분리) 이 결합되면, 처음 보는 AI/개발자의 코드베이스 파악 시간이 명확히 단축된다 (체감 + 측정 가능).

### Lake 범위 (사용자 명시 승인 — Medium)

| # | 항목 | 산출물 |
|---|------|--------|
| 1 | 버전 동기화 — README.md 0.61.1 → 0.62.0 (2곳) | `README.md` 수정 |
| 2 | deprecated 명시 정리 — 8 마커 파일 audit | 정리 표 + 실제 삭제/유지 결정 |
| 3 | **ONBOARDING.md 신규** — AI agent 진입 가이드 | `ONBOARDING.md` 신규 (~150줄) |
| 4 | CLAUDE.md 정비 — "What This Project Is" 절 강화 + 빠른 진입 안내 | CLAUDE.md 수정 |
| 5 | AGENTS.md 역할 명확화 — Cursor/Copilot 호환 vs Claude (CLAUDE.md) 분리 명시 | AGENTS.md 수정 |
| 6 | 의존 그래프 1장 — Mermaid 또는 ASCII | ONBOARDING.md 또는 CLAUDE.md 내 |
| 7 | catalog.json 의 정체 명시 — 자동 생성물? 수동? | CLAUDE.md 절 1줄 |

### Out-of-scope (Medium 에서 제외)

- agents/*.md frontmatter 통일 (Heavy 옵션) — 본 피처 미포함
- agents 부피 감축 (clevel-main-guard 외부화) — 본 피처 미포함
- 의존 그래프 자동 생성 도구 — 본 피처 미포함
- Sub-agent 통합/제거 (구조 변경) — 본 피처 미포함
- vendor/ui-ux-pro-max, basic/ — 변경 금지
- docs/_legacy/ 같은 과거 보존 영역 정리

> Heavy 작업이 필요해지면 별도 후속 피처 (`agent-frontmatter-unification`, `agent-volume-reduction` 등) 로 분리.

### 위험 (Risk)

| 위험 | 영향 | 완화 |
|------|------|------|
| ONBOARDING.md 추가가 또 다른 진입점 분산 | "어디 봐야 해?" 불명확 ↑ | CLAUDE.md/AGENTS.md/ONBOARDING.md 역할을 표 형태로 명시 — 각 파일 상단에 "이 파일의 책임" |
| deprecated 8 파일 중 backwards-compat 의도 삭제 | 외부 사용자 호환 깨짐 | audit 단계에서 backwards-compat 여부 확인 후 결정. 의심스러우면 유지 + 명시 |
| README.md / CLAUDE.md 변경이 다른 피처 진행 중 충돌 | merge conflict | 본 피처는 단일 세션 내 빠르게 종결 |
| AI agent 친화 측정 불가능 | SC 검증 어려움 | qa phase 에서 manual review (예: 처음 AI가 5분 내 핵심 파일 6개 식별) + 체크리스트 |

### 다음 단계 (CEO 추천)

| 항목 | 결정 |
|------|------|
| 시나리오 | S-10 (정기 운영/기술부채) — internal infra |
| 다음 C-Level | **CTO (CPO 생략)** — mui-design-system-import 와 동일 논리. internal infra, product 정의 외부 spec X (사용자 직접 합의), 핵심 결정 모두 technical |
| 그 다음 | (선택) CSO secret-scanner — README/AGENTS.md 갱신 시 시크릿 패턴 검증 가치 낮음, 대부분 생략 |

### 결정 요약 (Decision Record)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 피처명 | `legacy-prune-and-agent-onboarding` | "legacy 정리" + "agent 진입 친화" 두 의도 명확 |
| 범위 | Medium (7개 Lake 항목) | 사용자 명시 승인. Light 는 부족, Heavy 는 후속 피처로 분리 가능 |
| 다음 C-Level | CTO (CPO 생략) | mui-design-system-import 패턴 — internal infra |
| sub-agent 위임 | 미정 (plan 단계 결정) | Medium 작업이라 직접 작성도 가능, qa-engineer 정도만 위임 검토 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CEO ideation 초안 (피처명 + Medium 범위 7개 항목 + Out-of-scope + 위험 4건 + CTO 직진 결정) |
