# VAIS Code — Onboarding (5분 읽기)

> **이 파일의 책임**: 처음 본 AI 또는 사람이 본 repo 의 구조·진입점·워크플로우를 5분 안에 파악하도록 돕는 가이드.
> 더 깊이 파야 하면 → `CLAUDE.md` (Claude Code) / `AGENTS.md` (Cursor/Copilot) / `skills/vais/SKILL.md` (`/vais` 명령어).

---

## 1. What This Is (1분)

**VAIS Code** = Claude Code 플러그인. **AI C-Suite 조직 시뮬레이션** — CEO 가 Product Owner 로서 6 C-Level 팀(CPO/CTO/CSO/CBO/COO)을 고용·지휘하여 서비스 런칭 전체 라이프사이클(아이디어→기획→설계→구현→QA→보고)을 자동 실행한다.

| 핵심 컨셉 | 설명 |
|----------|------|
| **6 C-Level + 37 sub-agent** | 각 C-Level 이 자기 영역의 sub-agent 위임. 사용자는 CEO 1명만 부르거나 개별 C-Level 직접 호출 가능 |
| **PDCA 워크플로우** | (optional) ideation → plan → design → do → qa → report 6 phase. 각 phase 산출물은 `docs/{feature}/{NN-phase}/main.md` 에 박제 |
| **Skill + Agent + Hook 3축** | `/vais` 명령어 (skill) → C-Level (agent) → 실행 hook → 산출물 |

현재 버전: **v0.62.0** (`design-system/` MUI 카탈로그 + ui-designer DS 자동 선택 통합).

---

## 2. Quick Start (1분)

### 시나리오 A — 사용자가 새 피처를 만들고 싶을 때

```
/vais ceo ideation 새-피처-아이디어    # 모호한 아이디어 → 합의된 피처
/vais cto plan {feature}                # 기획서 작성
/vais cto design {feature}              # 설계서 작성
/vais cto do {feature}                  # 구현
/vais cto qa {feature}                  # QA 검증
/vais cto report {feature}              # 완료 보고서
/vais commit                            # 커밋 + semver bump + push
```

### 시나리오 B — 코드 읽기 (이 repo 처음 본 AI)

1. 본 `ONBOARDING.md` (지금) — 5분 진입
2. `CLAUDE.md` — Claude Code 전용 지침 (Mandatory Rules + Project Structure 절)
3. `vais.config.json` — 워크플로우 / 게이트 / C-Suite 정의
4. `skills/vais/SKILL.md` — 명령어 라우팅
5. `agents/{c-level}/{c-level}.md` — 각 C-Level 의 페르소나·책임

### 시나리오 C — 디자인 시스템 사용

`design-system/INDEX.md` 에 등록된 DS 확인. 현재 `mui` (Material UI v6.5.0). ui-designer agent 가 design phase 시작 시 자동으로 카탈로그 참조.

---

## 3. Architecture (1분, Mermaid)

```mermaid
flowchart TB
    ONBOARD[ONBOARDING.md<br/>5분 진입] --> CLAUDE[CLAUDE.md<br/>Claude Code 지침]
    ONBOARD --> AGENTS[AGENTS.md<br/>Cursor/Copilot 호환]
    ONBOARD --> SKILL[skills/vais/SKILL.md<br/>/vais 명령어]

    SKILL --> PHASES[skills/vais/phases/<br/>ceo·cpo·cto·cso·cbo·coo·ideation]
    SKILL --> UTILS[skills/vais/utils/<br/>status·init·next·commit·...]

    PHASES --> AGENTSDIR[agents/<br/>6 C-Level + 37 sub-agent]
    AGENTSDIR --> HOOKS[hooks/<br/>session-start·design-mcp-trigger·ideation-guard]
    AGENTSDIR --> SCRIPTS[scripts/<br/>doc-validator·auto-judge·patch-*·import-mui-design-system]

    CLAUDE --> CONFIG[vais.config.json<br/>워크플로우·게이트·C-Suite 정의]
    PHASES --> CONFIG
    AGENTSDIR --> CONFIG

    AGENTSDIR --> DOCS[docs/{feature}/<br/>피처별 PDCA 산출물]
    DOCS --> DS[design-system/<br/>DS 카탈로그 박제 v0.62.0+]
```

부속 폴더 (그래프 외):
- `lib/` — fs-utils, io, status, mcp-validator 등 공유 helper
- `templates/` — PDCA 문서 템플릿 (plan-minimal/standard/extended, design, do, qa, report)
- `output-styles/` — 출력 스타일 (session-start hook 로드)
- `mcp/` — `vais-design-system` MCP 서버 (design_search / design_system_generate / design_stack_search)
- `vendor/ui-ux-pro-max` — BM25 검색 엔진 (직접 수정 금지)

---

## 4. 진입점 역할 표 (1분)

| 파일 | 대상 | 역할 | 언제 보나 | 길이 |
|------|------|------|-----------|:----:|
| `ONBOARDING.md` | 모든 AI/사람 (처음) | 진입 가이드 — 5분 파악 | 처음 1번 | ~150줄 |
| `CLAUDE.md` | Claude Code | 프로젝트 지침 — Rules + Structure + Workflow | Claude Code 세션 시작 시 자동 로드 | ~400줄 |
| `AGENTS.md` | Cursor / Copilot / 일반 AI | Claude 외 AI 호환 지침 (CLAUDE.md 의 핵심 추출) | 다른 AI 도구 사용 시 | ~200줄 |
| `skills/vais/SKILL.md` | Claude Code (skill) | `/vais` 명령어 진입점 — phase + 액션 라우팅 | `/vais` 호출 시 자동 로드 | ~250줄 |

---

## 5. Next Steps (1분)

### 워크플로우 1개 예시 — 새 기능 "social-login-integration"

```
1. /vais ceo ideation social-login-integration
   → CEO 가 사용자와 대화. 피처 정의·범위(Lake)·다음 C-Level 합의 → docs/social-login-integration/00-ideation/main.md 박제

2. /vais cto plan social-login-integration
   → CTO 가 기획서 작성 (Standard 템플릿). CP-1 (Minimal/Standard/Extended) → docs/.../01-plan/main.md

3. /vais cto design social-login-integration
   → ui-designer + infra-architect 위임 (병렬). CP-D (아키텍처 옵션) → docs/.../02-design/main.md
   → ui-designer 가 design-system/mui/MASTER.md 자동 참조 (v0.62.0+)

4. /vais cto do social-login-integration
   → frontend-engineer + backend-engineer + test-engineer 위임 (병렬). 실제 구현. CP-2.

5. /vais cto qa social-login-integration
   → qa-engineer 위임. matchRate 측정 + Critical/Important 이슈. CP-Q.

6. /vais cto report social-login-integration
   → 완료 보고서.

7. /vais commit
   → 커밋 메시지 + semver bump + (선택) push.
```

### 더 알아보기

| 주제 | 위치 |
|------|------|
| 6 C-Level 상세 책임 | `agents/{c-level}/{c-level}.md` |
| Mandatory Rules (14개) | `CLAUDE.md` § Mandatory Rules |
| Gate / Checkpoint 시스템 | `vais.config.json` + `agents/cto/cto.md` § Checkpoint |
| 디자인 시스템 import | `scripts/import-mui-design-system.js` + `docs/mui-design-system-import/` |
| Plugin 구조 검증 | `node scripts/vais-validate-plugin.js` |

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 초기 작성 (5섹션 / Mermaid 그래프 / 진입점 표 / 워크플로우 예시) — `legacy-prune-and-agent-onboarding` 피처 산출물 |
