# VAIS Code — Onboarding (5분 읽기)

> **이 파일의 책임**: 처음 본 AI 또는 사람이 본 repo 의 구조·진입점·워크플로우를 5분 안에 파악하도록 돕는 가이드.
> 더 깊이 파야 하면 → `CLAUDE.md` (Claude Code) / `AGENTS.md` (Cursor/Copilot) / `skills/vais/SKILL.md` (`/vais` 명령어).

---

## 1. What This Is (1분)

**VAIS Code** = Claude Code 플러그인. **AI 코드 개발 도우미 (C-Suite 조직 시뮬레이션)** — CEO 가 7 차원 알고리즘으로 활성 C-Level 을 자동 결정하고, 사용자는 AskUserQuestion 클릭만으로 서비스 런칭 라이프사이클(아이디어→기획→설계→구현→QA→보고)을 진행한다.

| 핵심 컨셉 | 설명 |
|----------|------|
| **4 Primary + 2 Secondary** | Primary (CEO/CPO/CTO/CSO) — CEO 자동 라우팅 / Secondary (CBO/COO) — 사용자 명시 호출만 활성. 코드 개발 외 영역은 옵션. |
| **CEO 7 차원 알고리즘** | `lib/ceo-algorithm.js` — 보안/컴플라이언스/UX/데이터모델/외부통신/성능/제품정의 휴리스틱 + phase↔artifact 자동 매핑 |
| **CTO 만 mandatory PDCA** | CTO: plan→design→do→qa 순차 mandatory. CEO ideation 만 mandatory. CPO/CSO/CBO/COO mandatory 미적용 (CEO 알고리즘 결정) |
| **sub-agent 직접 박제** | `_tmp/` 폐기. sub-agent 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 frontmatter **4 필수 필드** (owner/artifact/phase/feature) 직접 작성. agent/generated/source/summary 는 auto-hydrate optional. main.md = 5 섹션 인덱스만 |
| **AskUserQuestion 클릭 인터페이스** | 모든 결정 = 도구 호출. 자연어 명령어 안내 금지 |
| **Lean checkpoint** | CP-0 (PRD missing) + CP-Q (Critical or matchRate<90) 만 발동. 나머지 자동 진행 + outro 한 줄. PO 클릭 ≤ 2회/피처 |
| **Knowledge lazy-load** | `agents/{c-level}/knowledge/` 19 MD — phase + artifact 매칭 시만 Read. 메인 .md 의 "Knowledge Index" 표가 trigger |
| **CEO 진입 절차 강제** | CEO 가 4 단계 순차 — `analyzeCEO()` Bash 호출 → 7 차원 등급 표 출력 → activeCLevel 인용 → AskUserQuestion. LLM 자체 라우팅 금지 |

현재 버전: **v1.3.0** — phase별 compact config 뷰 (lean context) + 상호작용 계약 SKILL.md 일원화. 상세: `CHANGELOG.md`.

---

## 2. Quick Start (1분)

### 시나리오 A — 사용자가 새 피처를 만들고 싶을 때

```
/vais ceo ideation 새-피처-아이디어    # 모호한 아이디어 → CEO 7 차원 분석 → 활성 C-Level 자동 결정
                                          ↓ AskUserQuestion 클릭으로 phase 진행
                                          ↓ CTO PDCA 만 mandatory, 비-CTO 는 CEO 알고리즘 결정
/vais cto plan|design|do|qa|report {feature}   # 코드 영역 PDCA (mandatory)
/vais cbo plan {feature}                # Secondary — GTM/마케팅/재무 필요 시 명시 호출
/vais coo plan {feature}                # Secondary — 운영/CI/CD 필요 시 명시 호출
/vais commit                            # 커밋 + semver bump + push
```

### 시나리오 B — 코드 읽기 (이 repo 처음 본 AI)

1. 본 `ONBOARDING.md` (지금) — 5분 진입
2. `CLAUDE.md` — Claude Code 전용 지침 (Mandatory Rules + Project Structure 절)
3. `vais.config.json` — 워크플로우 / 게이트 / C-Suite 정의
4. `skills/vais/SKILL.md` — 명령어 라우팅
5. `agents/{c-level}/{c-level}.md` — 각 C-Level 의 페르소나·책임

### 시나리오 C — 디자인 시스템 사용

`design-system/INDEX.md` 에 등록된 brand 카탈로그 확인 (brand-first — 71 brand DESIGN.md, default 5 사전 박제 + lazy import). ui-designer agent 가 design phase 시작 시 brand 선택 후 해당 `brands/{slug}/DESIGN.md` 를 정본으로 참조.

---

## Agent Teams 활성화 (선택) {#agent-teams-activation}

> **기본값: `agentTeams.enabled=false` (강제 X, 안내 O)** — 미활성 시 sequential 모드로 정상 동작합니다. 실제 CC SendMessage 도구를 사용하려면 아래 5 단계를 따르세요.
>
> `enabled=false` 는 sequential 모드입니다. `enabled=true` 이지만 env flag 가 없을 때만 simulation fallback 이 동작합니다.

### 전제 조건

Claude Code 2.1+ 가 필요합니다.

```bash
claude --version
# 예상 출력: 2.1.xxx (Claude Code)
```

### 활성화 5 단계

**Step 1 — CC 버전 확인**

```bash
claude --version
# 2.1.x 이상이어야 합니다
```

**Step 2 — env 변수 설정 (즉시 적용)**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**Step 3 — settings.json 영구화 (선택)**

세션 간 유지하려면 `~/.claude/settings.json` 에 추가:

```json
{
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
}
```

> 주의: vais-code 는 settings.json 을 자동으로 수정하지 않습니다. 직접 편집하세요.

**Step 4 — vais.config 활성화**

`vais.config.json` 내 `orchestration.agentTeams.enabled` 를 `true` 로 변경:

```json
{
  "orchestration": {
    "agentTeams": {
      "enabled": true
    }
  }
}
```

**Step 5 — 검증**

새 Claude Code 세션을 시작한 뒤 확인:

```bash
/vais status
# 출력 예시:
# Agent Teams: enabled
# SendMessage: real (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=env)
```

경고 메시지가 없으면 real SendMessage 모드가 활성화된 것입니다.

### Graceful Degradation

| 조건 | 동작 |
|------|------|
| `agentTeams.enabled=false` | 조용 — 기존 sequential 모드 |
| `enabled=true` + flag 미설정 | stderr 경고 1줄 + simulation fallback (byte-compat) |
| `enabled=true` + CC < 2.1.0 | stderr 경고 1줄 + sequential fallback |
| `enabled=true` + CC 2.1+ + flag 설정 | real SendMessage 활성 (조용) |

---

## 3. Architecture (1분, Mermaid)

```mermaid
flowchart TB
    ONBOARD[ONBOARDING.md<br/>5분 진입] --> CLAUDE[CLAUDE.md<br/>Claude Code 지침]
    ONBOARD --> AGENTS[AGENTS.md<br/>Cursor/Copilot 호환]
    ONBOARD --> SKILL[skills/vais/SKILL.md<br/>/vais 명령어]

    SKILL --> PHASES[skills/vais/phases/<br/>ceo·cpo·cto·cso·cbo·coo·ideation]
    SKILL --> UTILS[skills/vais/utils/<br/>status·init·next·commit·...]

    PHASES --> AGENTSDIR[agents/<br/>6 C-Level + 47 sub-agents + knowledge/ 19 MD]
    AGENTSDIR --> HOOKS[hooks/<br/>session-start·design-mcp-trigger·ideation-guard]
    AGENTSDIR --> SCRIPTS[scripts/<br/>doc-validator·auto-judge·auto-select-template·patch-*·import-awesome-design-md]

    CLAUDE --> CONFIG[vais.config.json<br/>워크플로우·게이트·C-Suite 정의]
    PHASES --> CONFIG
    AGENTSDIR --> CONFIG

    AGENTSDIR --> DOCS[docs/{feature}/<br/>피처별 PDCA 산출물]
    DOCS --> DS[design-system/brands/<br/>71 brand DESIGN.md 박제]
```

부속 폴더 (그래프 외):
- `lib/` — fs-utils, io, status, brand-validator, mcp-validator(deprecated) 등 공유 helper
- `templates/` — PDCA 문서 템플릿 (4-tier plan: stub/minimal/standard/extended + design/do/qa/report/ideation + 6 서브디렉토리 alignment/biz/core/how/what/why)
- `output-styles/` — 출력 스타일 (session-start hook 로드)
- `mcp/` — `vais-design-system` MCP 서버 (design_search / design_stack_search — heuristics 가드레일 전용)
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
   → 2-step AskUserQuestion 으로 brand 선택 (Hot 5 / Category / Manual / Default) → design-system/brands/{slug}/DESIGN.md 가 single source

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
| 디자인 시스템 — brand 박제 | `scripts/import-awesome-design-md.js` + `docs/design-system-rethink/` + `design-system/brands/INDEX.md` |
| Plugin 구조 검증 | `node scripts/vais-validate-plugin.js` |

---

> 변경 이력: 누적 변경 사항은 `CHANGELOG.md` 참조.
