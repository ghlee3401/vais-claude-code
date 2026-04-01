# VAIS Code

**v0.25.0** · Claude Code Plugin

> C-Suite AI 팀과 함께 기획부터 배포까지. 역할별 전문 에이전트가 분담하고 위임합니다.

---

## Overview

VAIS Code는 [Claude Code](https://claude.ai/code) 플러그인입니다.

각 C-Suite 에이전트는 독립적인 오케스트레이터로 동작합니다. 사용자는 역할에 맞는 에이전트를 호출하고, 에이전트는 하위 전문 에이전트에게 실행을 위임합니다. 체이닝 DSL 없이 각 에이전트가 자율적으로 다음 단계를 판단합니다.

```
Layer 6: Dashboard UI          (예정: vais-dashboard)
Layer 5: MCP Server            (예정: mcp/vais-server/)
Layer 4: State & Event         .vais/agent-state.json + event-log.jsonl
Layer 3: C-Suite Agents        CEO / CPO / CTO / CMO / CSO / CFO / COO
Layer 2: Implementation        design / architect / frontend / backend / qa
              sub-agents       seo / security / validate-plugin
Layer 1: Plugin Distribution   skills/vais/SKILL.md + vais.config.json
```

---

## Installation

### 1. Claude Code 설치

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. VAIS Code 플러그인 설치

```bash
/plugin install github:ghlee3401/vais-claude-code
```

### 3. 확인

```bash
/vais help
```

---

## Executive Roles

v0.25.0 기준 7개의 C-Suite 에이전트와 3개의 전문 sub-agent로 구성됩니다.

| 에이전트 | 모델 | 역할 | 위임 대상 |
|---------|------|------|----------|
| CEO | opus | 비즈니스 전략, Reference Absorption 지휘 | CPO / CTO / CMO 방향 전달 |
| CPO | sonnet | 제품 방향, PRD 생성 | pm-discovery / pm-strategy / pm-research / pm-prd |
| CTO | opus | 기술 오케스트레이션 전체 | design / architect / frontend / backend / qa |
| CMO | sonnet | 마케팅 방향 분석 | seo sub-agent |
| CSO | sonnet | 보안 검토 (Gate A), 플러그인 검증 (Gate B) | security / validate-plugin sub-agent |
| CFO | sonnet | 재무/ROI 분석 | _(stub)_ |
| COO | sonnet | 운영/CI/CD | _(stub)_ |
| seo | sonnet | SEO 감사 | CMO sub-agent |
| security | sonnet | OWASP Top 10 체크 | CSO sub-agent |
| validate-plugin | sonnet | 플러그인 구조 검증 | CSO sub-agent |

### 구현 에이전트

| 에이전트 | 역할 |
|---------|------|
| design | IA + 와이어프레임 + UI 설계 |
| architect | DB 스키마 + 마이그레이션 + 환경 설정 |
| frontend | 프론트엔드 구현 |
| backend | 백엔드 API + 데이터 액세스 |
| qa | Gap 분석 + 코드 리뷰 + 보안 점검 |

---

## Command Format

```
/vais <role> [feature]
```

| 구성요소 | 설명 |
|---------|------|
| `role` | 에이전트 이름 (ceo, cto, cmo 등) |
| `feature` | 피처명 — 영문 kebab-case (예: `login`, `payment`) |

---

## Example Commands

### C-Suite 실행

```bash
/vais ceo login          # 비즈니스 전략 방향 설정
/vais cpo login          # 제품 방향 + PRD 생성
/vais cto login          # 기술 기획 + 전체 구현 오케스트레이션
/vais cmo login          # 마케팅 전략 + SEO 감사
/vais cso login          # 보안 검토 + 플러그인 검증
/vais cfo login          # 재무/ROI 분석 (stub)
/vais coo login          # 운영/CI/CD (stub)
```

### 구현 단계 개별 실행

```bash
/vais plan login         # 기획서 작성
/vais design login       # UI/UX 설계
/vais architect login    # DB 스키마 + 환경
/vais frontend login     # 프론트엔드 구현
/vais backend login      # 백엔드 API 구현
/vais qa login           # Gap 분석 + 보안
/vais report login       # 완료 보고서
```

### Reference Absorption

```bash
/vais absorb ../bkit/skills/gap-detector.md   # 단일 파일 평가 + 흡수
/vais absorb ../reference-repo/               # 디렉토리 전체 평가
/vais absorb --history                        # 흡수 이력 조회
/vais absorb --history --filter=rejected      # 거부된 항목만
```

### 유틸리티

```bash
/vais status     # 전체 피처 진행 상태
/vais next       # 다음 단계 자동 안내
/vais test       # 테스트 실행 (프레임워크 자동 감지)
/vais commit     # Conventional Commits + 자동 semver 판단
/vais help       # 대화형 사용법 안내
/vais init       # 기존 프로젝트 → VAIS 문서 역생성
```

---

## C-Suite 상세

### CEO

비즈니스 전략 방향을 설정하고 Reference Absorption의 최종 승인권을 갖습니다.

- 피처의 비즈니스 목표, 타깃, 핵심 가치 정의
- CPO에게 제품 방향, CTO에게 기술 방향, CMO/CSO에게 각 역할 방향 전달
- Reference Absorption 3-step: CEO 전략 판단 → CTO 기술 평가 → CEO 최종 결정

```bash
/vais ceo login
```

### CPO

제품 방향을 정의하고 PRD를 생성합니다. pm sub-agents를 오케스트레이션합니다.

- **Query 모드**: 기존 PRD 현황 조회, 피처 우선순위 확인
- **Command 모드**: 신규 PRD 생성 (pm-discovery → pm-strategy → pm-research → pm-prd 순서)
- 산출물: `docs/00-pm/{feature}.prd.md`

```bash
/vais cpo login
```

### CTO

기술 오케스트레이션 전체를 담당합니다.

- Plan 단계 직접 실행
- design / architect / frontend / backend / qa 에이전트에 순차 위임
- 4개 Gate 체크포인트 (사용자 확인 후 진행)
- 단계 전환 시 `.vais/event-log.jsonl`에 `phase_transition` 이벤트 기록

```
Plan ──▶ [Gate 1] ──▶ Design ──▶ [Gate 2] ──▶ Architect ──▶ [Gate 3] ──▶ FE+BE ──▶ [Gate 4] ──▶ QA
```

```bash
/vais cto login
```

### CMO

마케팅 방향을 직접 분석하고 SEO 감사는 seo sub-agent에게 위임합니다.

**실행 순서**:
1. 마케팅 컨텍스트 분석 (타깃 / 메시지 / 채널 / 핵심 키워드)
2. seo sub-agent 호출 → SEO 감사 수행
3. 통합 마케팅 전략 문서 생성

**SEO 점수 기준**:

| 항목 | 만점 |
|------|------|
| Title / Meta | 20 |
| Semantic HTML | 30 |
| Core Web Vitals | 30 |
| 구조화 데이터 | 20 |
| **합계** | **100** |

80+ 양호 / 60–79 개선 필요 / 60 미만 즉시 수정

산출물: `docs/05-marketing/{feature}.md` + `{feature}-seo.md`

```bash
/vais cmo login
```

### CSO

두 가지 게이트를 운영합니다. 실행은 sub-agent에게 위임하고 최종 판정만 담당합니다.

**Gate A — 보안 검토** (security sub-agent):
- OWASP Top 10 체크 (A01–A10)
- 인증/인가 설계 검토
- 민감 데이터 처리 검토
- 산출물: `docs/04-qa/{feature}-security.md`

**Gate B — 플러그인 검증** (validate-plugin sub-agent, `plugin 배포` / `마켓플레이스` 키워드 자동 트리거):
- `package.json` claude-plugin 메타데이터 검증
- `skills/*/SKILL.md` 구조 규격 확인
- `agents/*.md` frontmatter 필수 필드 확인
- 코드 안전성 스캔 (eval, execSync 등)
- 산출물: `docs/04-qa/{feature}-plugin-validation.md`

**판정 기준**:

| 결과 | 조건 |
|------|------|
| ✅ Pass | OWASP 8/10 이상 + Critical 없음 |
| ⚠️ Conditional Pass | OWASP 6–7/10 + Critical 없음 |
| ❌ Fail | OWASP 5/10 미만 또는 Critical 존재 |

```bash
/vais cso login                       # 보안 검토 (Gate A)
/vais cso login --validate-plugin     # 플러그인 검증 (Gate B)
```

### CFO / COO

역할 등록만 되어 있습니다. 향후 구현 예정:
- **CFO**: ROI 분석, 비용 추정, 가격 전략
- **COO**: CI/CD 파이프라인, 배포 자동화, 모니터링

```bash
/vais cfo login    # (stub)
/vais coo login    # (stub)
```

---

## Reference Absorption

외부 레퍼런스를 평가하고 vais에 흡수합니다. AbsorbEvaluator가 3가지 축으로 판단합니다.

**판정 기준**:

| 조건 | 판정 |
|------|------|
| Ledger에 동일 소스 이미 존재 | ❌ reject (중복) |
| 품질 점수 < 25/100 | ❌ reject (저품질) |
| 기존 파일과 겹침 > 50% | ⚠️ merge (병합 권장) |
| 품질 ≥ 50 + 적합성 ≥ 20 | ✅ absorb (흡수) |

**품질 평가 기준** (100점):

| 항목 | 만점 |
|------|------|
| 헤딩 구조 | 25 |
| 코드 예시 | 25 |
| 문서 분량 | 25 |
| 실행 가능 지침 | 25 |

모든 결정은 `.vais/absorption-ledger.jsonl`에 기록됩니다.

---

## Observability

에이전트 실행 상태와 이벤트가 자동으로 기록됩니다.

### 실시간 상태 (`.vais/agent-state.json`)

```json
{
  "session": "2026-04-01T10:00:00Z",
  "feature": "login",
  "active_agents": [
    { "role": "cto", "status": "running", "phase": "plan" }
  ],
  "pipeline": {
    "current": "cto",
    "queue": ["design", "frontend", "backend", "qa"],
    "completed": ["ceo", "cpo"]
  }
}
```

### 감사 로그 (`.vais/event-log.jsonl`)

```jsonl
{"ts":"...","event":"session_start","feature":"login","agents":["ceo","cpo","cto"]}
{"ts":"...","event":"agent_start","role":"cpo","phase":"prd"}
{"ts":"...","event":"agent_stop","role":"cpo","outcome":"success","doc":"docs/00-pm/login.prd.md"}
{"ts":"...","event":"agent_start","role":"cto","phase":"plan"}
{"ts":"...","event":"decision","role":"cto","type":"architecture","choice":"nextjs"}
{"ts":"...","event":"agent_stop","role":"cto","outcome":"success"}
```

이벤트 타입: `session_start` · `agent_start` · `agent_stop` · `phase_transition` · `gate_check` · `decision` · `error`

---

## Core Features

### Interface Contract (Gate 2)

Design → Architect 전환 시 자동 생성되는 API 스펙. FE와 BE가 동일한 Contract를 참조하여 병렬 구현해도 API가 일치합니다.

### Context Anchor

Plan에서 생성된 WHY / WHO / RISK / SUCCESS / SCOPE가 Design → FE/BE → QA로 자동 전파됩니다. 세션이 바뀌어도 "왜 이걸 만드는지"를 잊지 않습니다.

### Plan-Plus (강화된 기획)

| 검증 | 목적 |
|------|------|
| 의도 탐색 | 근본 원인 파악 |
| 대안 탐색 | 최선의 방법 선택 |
| YAGNI 리뷰 | 과잉 설계 방지 |

### 자동 Semver 커밋 (`/vais commit`)

변경 규모를 분석해 major / minor / patch를 자동 제안하고, 7곳의 버전 참조를 일괄 업데이트합니다.

---

## Command Reference

### C-Suite

| 커맨드 | 설명 |
|--------|------|
| `/vais ceo {feature}` | 비즈니스 전략 방향 설정 |
| `/vais cpo {feature}` | 제품 방향 + PRD 생성 |
| `/vais cto {feature}` | 기술 오케스트레이션 전체 (Plan → QA) |
| `/vais cmo {feature}` | 마케팅 분석 + SEO 감사 |
| `/vais cso {feature}` | 보안 검토 (Gate A) + 플러그인 검증 (Gate B) |
| `/vais cfo {feature}` | 재무/ROI 분석 (stub) |
| `/vais coo {feature}` | 운영/CI/CD (stub) |
| `/vais absorb {path}` | 외부 레퍼런스 평가 + 흡수 |
| `/vais absorb --history` | 흡수 이력 조회 |

### 구현 단계

| 커맨드 | 설명 |
|--------|------|
| `/vais plan {feature}` | 기획서 (아이디어 + 요구사항) |
| `/vais design {feature}` | IA + 와이어프레임 + UI 설계 |
| `/vais architect {feature}` | DB 스키마 + 마이그레이션 + 환경 설정 |
| `/vais frontend {feature}` | 프론트엔드 구현 |
| `/vais backend {feature}` | 백엔드 API + 데이터 액세스 |
| `/vais qa {feature}` | Gap 분석 + 코드 리뷰 + 보안 |
| `/vais report {feature}` | 완료 보고서 (회고 포함) |
| `/vais init {feature}` | 기존 프로젝트 → VAIS 문서 역생성 |

### 유틸리티

| 커맨드 | 설명 |
|--------|------|
| `/vais status` | 전체 피처 진행 상태 |
| `/vais next` | 다음 단계 자동 안내 |
| `/vais test` | 테스트 실행 (프레임워크 자동 감지) |
| `/vais commit` | Conventional Commits + 자동 semver |
| `/vais help` | 대화형 사용법 안내 |

---

## Notes

### 마이그레이션 가이드

| 구 커맨드 | 새 커맨드 | 비고 |
|----------|----------|------|
| `/vais auto {feature}` | `/vais cto {feature}` | v0.23.0 이후 |
| `/vais manager` | `/vais cto` | v0.23.0 이후 |
| `/vais seo {feature}` | `/vais cmo {feature}` | v0.24.0에서 제거 |
| `/vais validate-plugin` | `/vais cso {feature} --validate-plugin` | v0.24.0에서 제거 |

### 훅 시스템

| 훅 | 역할 |
|----|------|
| SessionStart | 이전 작업 복원, 워크플로우 안내 |
| SubagentStart | `scripts/agent-start.js` 호출 → agent-state.json + event-log.jsonl 기록 |
| SubagentStop | `scripts/agent-stop.js` 호출 → 완료 상태 기록 |
| PreToolUse(Bash) | 위험 명령 차단 (DROP TABLE, rm -rf 등) |
| PostToolUse(Write\|Edit) | 문서 작성 시 워크플로우 상태 자동 갱신 |
| Stop | 다음 단계 자동 안내 |
| UserPromptSubmit | 의도 감지 및 에이전트 라우팅 |

### 설정 (`vais.config.json`)

| 설정 | 설명 |
|------|------|
| `cSuite.orchestrator` | 기본 오케스트레이터 (기본값: `"cto"`) |
| `cSuite.roles` | C-Suite 역할 레지스트리 |
| `cSuite.autoKeywords` | 역할 자동 트리거 키워드 |
| `observability.enabled` | 에이전트 상태 + 이벤트 로깅 (기본값: `true`) |
| `observability.stateFile` | `.vais/agent-state.json` |
| `observability.eventLog` | `.vais/event-log.jsonl` |
| `mcp.enabled` | MCP 서버 활성화 (기본값: `false`) |
| `workflow.gates` | Gate 체크포인트 수 (기본값: `4`) |
| `gapAnalysis.matchThreshold` | Gap 분석 통과 기준 (기본값: `90%`) |

### 요구사항

| 항목 | 최소 버전 |
|------|----------|
| Claude Code | v2.1.32+ |
| Node.js | v18+ |

### 설치 (OS별)

<details>
<summary><strong>Ubuntu / Debian</strong></summary>

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g @anthropic-ai/claude-code
claude
```
</details>

<details>
<summary><strong>Windows</strong></summary>

```powershell
winget install OpenJS.NodeJS.LTS
npm install -g @anthropic-ai/claude-code
claude
```

> WSL2 환경 권장.
</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
brew install node
npm install -g @anthropic-ai/claude-code
claude
```
</details>

---

## Project Structure

```
vais-claude-code/
├── .claude-plugin/          # 플러그인 매니페스트
├── agents/                  # C-Suite + sub-agents + 구현 에이전트
│   ├── ceo.md
│   ├── cpo.md               # v0.24.0 신규
│   ├── cto.md
│   ├── cmo.md
│   ├── cso.md
│   ├── cfo.md               # v0.24.0 신규 (stub)
│   ├── coo.md               # v0.24.0 신규 (stub)
│   ├── seo.md               # CMO sub-agent
│   ├── security.md          # CSO sub-agent
│   ├── validate-plugin.md   # CSO sub-agent
│   └── design|architect|frontend|backend|qa.md
├── hooks/
│   ├── hooks.json
│   └── events.json
├── lib/
│   ├── observability/       # StateWriter + EventLogger
│   └── absorb-evaluator.js
├── scripts/
│   ├── agent-start.js
│   ├── agent-stop.js
│   └── phase-transition.js
├── skills/vais/
│   └── phases/              # 각 에이전트 실행 지침
├── templates/
├── package.json
├── vais.config.json
└── CHANGELOG.md
```

---

## FAQ

<details>
<summary><strong>CPO와 CTO의 역할 차이는 뭔가요?</strong></summary>

CPO는 **"무엇을 만들 것인가"** (제품 방향, PRD, 로드맵), CTO는 **"어떻게 만들 것인가"** (기술 설계, 구현 오케스트레이션)를 담당합니다. CEO → CPO → CTO 순으로 각 에이전트를 개별 호출하면 전략 → 제품 → 기술 흐름을 순서대로 진행할 수 있습니다.
</details>

<details>
<summary><strong>기존 /vais auto 명령어를 쓰던 사람은?</strong></summary>

`/vais auto {feature}` → `/vais cto {feature}`로 대체되었습니다.
</details>

<details>
<summary><strong>vais-seo와 vais-validate-plugin은 어디 갔나요?</strong></summary>

v0.24.0에서 제거되었습니다. 각각 `agents/seo.md` (CMO sub-agent)와 `agents/validate-plugin.md` (CSO sub-agent)로 통합되었습니다.
</details>

<details>
<summary><strong>기존 프로젝트에도 적용할 수 있나요?</strong></summary>

네. `/vais init {feature}`으로 기존 코드를 분석해 VAIS 문서를 역생성합니다.
</details>

<details>
<summary><strong>Observability 로그가 쌓이면 디스크 문제가 생기지 않나요?</strong></summary>

`lib/observability/rotation.js`가 자동 로테이션합니다. 기본값: 10MB 초과 또는 30일 경과 시 `.vais/archive/`로 아카이브.
</details>

<details>
<summary><strong>C-Suite 에이전트를 직접 추가할 수 있나요?</strong></summary>

네. `agents/{role}.md`를 만들고 `vais.config.json`의 `cSuite.roles`에 등록하면 됩니다.
</details>

<details>
<summary><strong>외부 의존성이 있나요?</strong></summary>

없습니다. Node.js 내장 모듈만 사용합니다.
</details>

---

## Troubleshooting

| 문제 | 해결 |
|------|------|
| 플러그인이 로드되지 않음 | Claude Code 재시작 후 `/vais help` 확인 |
| Gap 분석이 90%에 안 됨 | 최대 5회 자동 반복. 이후 누락 기능 수동 구현 |
| agent-state.json 손상 | `rm .vais/agent-state.json` 삭제 후 재실행 |
| event-log.jsonl 용량 과다 | `lib/observability/rotation.js` 자동 로테이션 (10MB 기준) |
| 피처명 오류 | 영문/숫자/`-`/`_`만 허용 |
| stop hooks 실패 | `CLAUDE_PLUGIN_ROOT` 미설정 → v0.24.0에서 수정됨 |

---

## License

MIT License — [LICENSE](./LICENSE)

Made by [VAIS Voice](https://github.com/ghlee3401) · [CHANGELOG](./CHANGELOG.md)
