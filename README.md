# VAIS Code

**v0.24.0** · Claude Code Plugin

> C-Suite AI 팀과 함께 기획부터 배포까지. 역할별 전문 에이전트가 분담하고 관찰합니다.

```
/vais ceo:cpo:cto login
```

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                                                                     │
 │   CEO ──▶ 전략 방향         CPO ──▶ 제품 방향 + PRD 생성            │
 │   CTO ──▶ 기술 오케스트레이션  CMO ──▶ 마케팅 + SEO                 │
 │   CSO ──▶ 보안 + 플러그인 검증  CFO/COO ──▶ 재무/운영 (stub)        │
 │                                                                     │
 │   /vais ceo:cpo:cto login   ←  C-Suite 풀 체이닝                   │
 │   /vais absorb ../ref.md    ←  외부 레퍼런스 지각 있는 흡수          │
 │                                                                     │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## 30초 설치

### 1. Claude Code 설치 (이미 있으면 건너뛰세요)

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. VAIS Code 플러그인 설치

```bash
# Claude Code 안에서 실행
/plugin install github:ghlee3401/vais-claude-code
```

### 3. 확인

```bash
/vais help
```

---

## 2분 퀵스타트

### C-Suite 단독 실행

```bash
/vais ceo login          # 비즈니스 전략 방향 설정
/vais cpo login          # 제품 방향 + PRD 생성
/vais cto login          # 기술 기획 + 전체 구현 오케스트레이션
/vais cmo login          # 마케팅 전략 + SEO 감사
/vais cso login          # 보안 검토 + 플러그인 검증
```

### C-Suite 체이닝

```bash
/vais ceo:cpo:cto login       # CEO 전략 → CPO PRD → CTO 구현 (풀 체이닝)
/vais ceo:cto login           # CEO 전략 → CTO 실행 (CPO 생략)
/vais cto:cso login           # CTO 구현 → CSO 보안 게이트
/vais ceo:cto:cso login       # 전략 → 구현 → 보안 순차 실행
```

### 구현 단계 개별 실행

```bash
/vais plan login              # 기획서
/vais design login            # 설계
/vais architect login         # DB 스키마 + 환경
/vais frontend+backend login  # 병렬 구현
/vais qa login                # Gap 분석 + 보안
/vais report login            # 완료 보고서
```

### Reference Absorption

```bash
/vais absorb ../bkit/skills/gap-detector.md   # 외부 파일 평가 + 흡수
/vais absorb --history                        # 흡수 이력 조회
/vais ceo:absorb ../reference-repo/           # CEO가 전략 판단 + CTO 기술 평가
```

### 진행 상태 확인

```bash
/vais status     # 전체 피처 진행률
/vais next       # 다음 단계 안내
```

---

## 이게 뭔가요?

**VAIS Code**는 [Claude Code](https://claude.ai/code) 플러그인입니다.

v0.24.0부터 **C-Suite 완전 위임 패턴**이 확립되었습니다. 모든 C-level 에이전트는 오케스트레이터로만 동작하고, 실제 실행 로직은 전문 sub-agent에게 위임합니다.

```
Layer 6: Dashboard UI          (향후: vais-dashboard 별도 레포)
Layer 5: MCP Server            (향후: mcp/vais-server/)
Layer 4: State & Event         .vais/agent-state.json + event-log.jsonl
Layer 3: C-Suite Agents        CEO / CPO / CTO / CMO / CSO / CFO / COO
Layer 2: Implementation        design / architect / frontend / backend / qa
              sub-agents       seo / security / validate-plugin
Layer 1: Plugin Distribution   skills/vais/SKILL.md + vais.config.json
```

### 누구를 위한 건가요?

| 상황 | VAIS Code가 해주는 것 |
|------|---------------------|
| 기획부터 배포까지 체계적으로 진행하고 싶다 | C-Suite 체이닝으로 역할별 순차 실행 |
| 제품 방향과 PRD를 AI가 만들어줬으면 | `/vais cpo` — CPO가 PRD 생성 + pm sub-agents 오케스트레이션 |
| 마케팅/SEO까지 AI가 자동으로 해줬으면 | `/vais cmo` — CMO가 seo sub-agent에게 위임 |
| 보안 검토와 플러그인 검증을 자동화하고 싶다 | `/vais cso` — OWASP Gate A + Plugin Gate B |
| 외부 레퍼런스를 프로젝트에 흡수하고 싶다 | `/vais absorb {path}` — 품질/적합성 자동 평가 |
| 에이전트 실행 이력을 추적하고 싶다 | `.vais/event-log.jsonl` 감사 로그 자동 기록 |

---

## C-Suite 에이전트

v0.24.0 기준 7개의 C-Suite 에이전트 + 3개의 전문 sub-agent.

```
              ┌─────────────────────┐
              │    CEO (opus)       │
              │    비즈니스 전략     │
              │    Reference 흡수   │
              └──────┬──────────────┘
                     │ 방향 전달
       ┌─────────────┼──────────────────┐
       │             │                  │
  ┌────▼────┐  ┌─────▼──────┐  ┌───────▼──────┐
  │ CPO     │  │ CTO (opus) │  │ CMO (sonnet) │
  │(sonnet) │  │ 기술 오케스 │  │ 마케팅 오케스 │
  │ PRD+로드 │  │ 트레이션    │  │ └─ seo       │
  │ 맵 생성 │  └──┬──────┬───┘  └──────────────┘
  └─────────┘     │      │
  ┌─────────┐  ┌──▼──┐ ┌─▼────────┐  ┌──────────────┐
  │ CFO stub│  │ FE  │ │ BE + QA  │  │ CSO (sonnet) │
  │ COO stub│  └─────┘ └──────────┘  │ └─ security  │
  └─────────┘                        │ └─ validate- │
                                     │    plugin    │
                                     └──────────────┘
```

| 에이전트 | 모델 | 담당 | v0.24.0 변경 |
|---------|------|------|-------------|
| CEO | opus | 비즈니스 전략, Reference Absorption 지휘 | CPO/CFO/COO 위임 추가 |
| CPO | sonnet | 제품 방향, PRD 생성, pm sub-agents 오케스트레이션 | **신규** |
| CTO | opus | 기술 오케스트레이션 전체, Plan 직접 실행 | — |
| CMO | sonnet | 마케팅 컨텍스트 분석 → seo 위임 | v2.0: 완전 위임 패턴 |
| CSO | sonnet | 보안 Gate A → security 위임, Gate B → validate-plugin 위임 | v2.0: 완전 위임 패턴 |
| CFO | sonnet | 재무/ROI 분석 (stub) | **신규** (미구현) |
| COO | sonnet | 운영/CI/CD (stub) | **신규** (미구현) |
| seo | sonnet | SEO 감사 (CMO sub-agent) | **신규** |
| security | sonnet | OWASP Top 10 체크 (CSO sub-agent) | **신규** |
| validate-plugin | sonnet | 플러그인 검증 (CSO sub-agent) | **신규** |
| design | sonnet | IA + 와이어프레임 + UI | — |
| architect | sonnet | DB + 환경 + 프로젝트 설정 | — |
| frontend | sonnet | 프론트엔드 구현 | — |
| backend | sonnet | 백엔드 API + 데이터 액세스 | — |
| qa | sonnet | Gap 분석 + 코드 리뷰 | — |

---

## 체이닝 문법

```
  ":"  = 순차 실행 (앞이 끝나면 다음)
  "+"  = 병렬 실행 (동시에)
```

| 실행 | 명령어 | 설명 |
|------|--------|------|
| 단일 | `/vais cto login` | CTO 오케스트레이션만 |
| C-Suite 풀 | `/vais ceo:cpo:cto login` | CEO 전략 → CPO PRD → CTO 구현 |
| C-Suite 간소 | `/vais ceo:cto login` | CEO 전략 → CTO 실행 (CPO 생략) |
| C-Suite 순차 | `/vais cto:cso login` | CTO 구현 → CSO 보안 게이트 |
| 구현 순차 | `/vais plan:design:architect login` | 기획 → 설계 → 아키텍트 |
| 병렬 | `/vais frontend+backend login` | 프론트+백엔드 동시 |
| 혼합 | `/vais cto:cmo login` | CTO 구현 후 CMO SEO 최적화 |

---

## C-Suite 상세

### CPO (`/vais cpo {feature}`)

제품 방향과 PRD를 담당합니다. pm sub-agents를 오케스트레이션합니다.

- **Query 모드**: 기존 PRD 현황 조회, 피처 우선순위 확인
- **Command 모드**: 신규 PRD 생성 (pm-discovery → pm-strategy → pm-research → pm-prd)
- 출력: `docs/00-pm/{feature}.prd.md`

```bash
/vais cpo login           # 기존 PRD 조회 또는 신규 생성
/vais ceo:cpo:cto login   # CEO 전략 → CPO PRD → CTO 기술 실행
```

### CEO (`/vais ceo {feature}`)

비즈니스 전략 방향을 설정합니다. Reference Absorption의 최종 승인권을 갖습니다.

- 피처의 비즈니스 목표, 타깃, 핵심 가치 정의
- CPO에게 제품 방향 위임, CTO에게 기술 방향 위임, CMO/CSO 방향 전달
- Reference Absorption 3-step: CEO 전략 판단 → CTO 기술 평가 → CEO 최종 결정

```bash
/vais ceo login             # 전략 방향 설정
/vais ceo:absorb ../ref.md  # 레퍼런스 흡수 CEO 지휘
```

### CTO (`/vais cto {feature}`)

기술 오케스트레이션 전체를 담당합니다.

- Plan 단계 직접 실행
- design / architect / frontend / backend / qa 에이전트에 위임
- 4개 Gate 체크포인트 (AskUserQuestion으로 사용자 확인)
- 단계 전환 시 `.vais/event-log.jsonl`에 phase_transition 이벤트 기록

```bash
/vais cto login          # 단독 실행
/vais ceo:cto login      # CEO 방향 → CTO 실행
```

### CMO (`/vais cmo {feature}`)

마케팅 방향 분석을 직접 수행하고, SEO 감사는 seo sub-agent에게 위임합니다.

**실행 순서**:
1. 마케팅 컨텍스트 직접 분석 (타깃/메시지/채널/핵심 키워드)
2. seo sub-agent 호출 → SEO 감사 수행
3. 통합 마케팅 전략 문서 생성

**SEO 점수 기준** (seo sub-agent):

| 항목 | 만점 |
|------|------|
| Title/Meta | 20 |
| Semantic HTML | 30 |
| Core Web Vitals | 30 |
| 구조화 데이터 | 20 |
| **합계** | **100** |

80+ 양호 / 60–79 개선 필요 / 60 미만 즉시 수정

**산출물**: `docs/05-marketing/{feature}.md` + `{feature}-seo.md`

```bash
/vais cmo login          # 마케팅 분석 + SEO 감사
/vais cto:cmo login      # CTO 구현 완료 후 CMO SEO 최적화
```

### CSO (`/vais cso {feature}`)

두 가지 게이트를 운영합니다. 실행은 sub-agent에게 위임하고 최종 판정만 담당합니다.

**Gate A — 보안 검토** (security sub-agent):
- OWASP Top 10 체크 (A01~A10)
- 인증/인가 설계 검토
- 민감 데이터 처리 검토
- 산출물: `docs/04-qa/{feature}-security.md`

**Gate B — Plugin Validation** (`plugin 배포` / `마켓플레이스` 키워드 자동 트리거, validate-plugin sub-agent):
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

### CFO / COO (stub)

현재 역할 등록만 되어 있습니다. 향후 구현 예정:
- **CFO**: ROI 분석, 비용 추정, 가격 전략
- **COO**: CI/CD 파이프라인, 배포 자동화, 모니터링

```bash
/vais cfo login    # (stub — 곧 구현 예정)
/vais coo login    # (stub — 곧 구현 예정)
```

---

## Reference Absorption (`/vais absorb`)

외부 레퍼런스를 평가하고 vais에 흡수합니다. **AbsorbEvaluator**가 3가지 축으로 판단합니다.

```bash
/vais absorb ../bkit/skills/gap-detector.md   # 단일 파일
/vais absorb ../reference-repo/               # 디렉토리 전체
/vais absorb --history                        # 흡수 이력 조회
/vais absorb --history --filter=rejected      # 거부된 항목만
```

**판정 기준**:

| 조건 | 판정 |
|------|------|
| Ledger에 동일 소스 이미 존재 | ❌ reject (중복) |
| 품질 점수 < 25/100 | ❌ reject (저품질) |
| 기존 파일과 겹침 > 50% | ⚠️ merge (병합 권장) |
| 품질 ≥ 50 + 적합성 ≥ 20 | ✅ absorb (흡수) |

**품질 평가 기준** (100점):
- 헤딩 구조 (0–25)
- 코드 예시 (0–25)
- 문서 분량 (0–25)
- 실행 가능 지침 (0–25)

모든 결정은 `.vais/absorption-ledger.jsonl`에 기록됩니다.

---

## Observability (Layer 4)

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
{"ts":"...","event":"session_start","feature":"login","c_suite":["ceo","cpo","cto"]}
{"ts":"...","event":"agent_start","role":"cpo","phase":"prd"}
{"ts":"...","event":"agent_stop","role":"cpo","outcome":"success","doc":"docs/00-pm/login.prd.md"}
{"ts":"...","event":"agent_start","role":"cto","phase":"plan"}
{"ts":"...","event":"decision","role":"cto","type":"architecture","choice":"nextjs"}
{"ts":"...","event":"agent_stop","role":"cto","outcome":"success"}
```

이벤트 타입: `session_start` · `agent_start` · `agent_stop` · `phase_transition` · `gate_check` · `decision` · `error`

---

## 커맨드 레퍼런스

### C-Suite

| 커맨드 | 설명 |
|--------|------|
| `/vais ceo {기능}` | 비즈니스 전략 방향 설정 |
| `/vais cpo {기능}` | 제품 방향 + PRD 생성 (pm sub-agents 오케스트레이션) |
| `/vais cto {기능}` | 기술 오케스트레이션 전체 (Plan → QA) |
| `/vais cmo {기능}` | 마케팅 분석 + SEO 감사 (seo sub-agent 위임) |
| `/vais cso {기능}` | 보안 검토 (Gate A) + 플러그인 검증 (Gate B) |
| `/vais cfo {기능}` | 재무/ROI 분석 (stub) |
| `/vais coo {기능}` | 운영/CI/CD (stub) |
| `/vais absorb {path}` | 외부 레퍼런스 평가 + 흡수 |
| `/vais absorb --history` | 흡수 이력 조회 |

### 구현 단계

| 커맨드 | 설명 |
|--------|------|
| `/vais plan {기능}` | 기획서 (아이디어 + 요구사항) |
| `/vais design {기능}` | IA + 와이어프레임 + UI 설계 |
| `/vais architect {기능}` | DB 스키마 + 마이그레이션 + 환경 설정 |
| `/vais frontend {기능}` | 프론트엔드 구현 |
| `/vais backend {기능}` | 백엔드 API + 데이터 액세스 |
| `/vais qa {기능}` | Gap 분석 + 코드 리뷰 + 보안 |
| `/vais report {기능}` | 완료 보고서 (회고 포함) |
| `/vais init {기능}` | 기존 프로젝트 → VAIS 문서 역생성 |

### 유틸리티

| 커맨드 | 설명 |
|--------|------|
| `/vais status` | 전체 피처 진행 상태 |
| `/vais next` | 다음 단계 자동 안내 |
| `/vais test` | 테스트 실행 (프레임워크 자동 감지) |
| `/vais commit` | Conventional Commits + 자동 semver 판단 + 버전 일괄 반영 |
| `/vais help` | 대화형 사용법 안내 |

### 마이그레이션 가이드

| 구 커맨드 | 새 커맨드 | 비고 |
|----------|----------|------|
| `/vais auto {기능}` | `/vais cto {기능}` | v0.23.0 이후 |
| `/vais manager` | `/vais cto` | v0.23.0 이후 |
| `/vais seo {기능}` | `/vais cmo {기능}` | v0.24.0에서 완전 제거 |
| `/vais validate-plugin` | `/vais cso {기능} --validate-plugin` | v0.24.0에서 완전 제거 |

---

## 6단계 구현 워크플로우 (CTO 오케스트레이션)

CTO가 자동으로 아래 흐름을 관리합니다:

```
Plan ──▶ [Gate 1] ──▶ Design ──▶ [Gate 2] ──▶ Architect ──▶ [Gate 3] ──▶ FE+BE ──▶ [Gate 4] ──▶ QA
                                    │
                              Interface Contract
                              (API 스펙 자동 생성)
```

각 Gate는 AskUserQuestion으로 사용자 확인을 요청합니다. "계속 / 수정 요청 / 중단" 중 선택.

---

## 설치 상세

### 요구사항

| 항목 | 최소 버전 |
|------|----------|
| Claude Code | v2.1.32+ |
| Node.js | v18+ |

### OS별 사전 준비

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

> WSL2 환경 권장. WSL2에서는 Ubuntu와 동일하게 설치합니다.
</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
brew install node
npm install -g @anthropic-ai/claude-code
claude
```
</details>

### 플러그인 설치

| 방법 | 명령어 |
|------|--------|
| GitHub (권장) | `/plugin install github:ghlee3401/vais-claude-code` |
| 수동 | `git clone https://github.com/ghlee3401/vais-claude-code.git ~/.claude/plugins/vais-code` |

---

## 핵심 기능

### Interface Contract (Gate 2)

Design → Architect 전환 시 자동 생성되는 API 스펙. FE와 BE가 동일한 Contract를 참조하여 병렬 구현해도 API가 일치합니다.

### Context Anchor

Plan에서 생성된 WHY/WHO/RISK/SUCCESS/SCOPE가 Design → FE/BE → QA로 자동 전파됩니다. 세션이 바뀌어도 "왜 이걸 만드는지"를 잊지 않습니다.

### Plan-Plus (강화된 기획)

| 검증 | 목적 |
|------|------|
| 의도 탐색 | 근본 원인 파악 |
| 대안 탐색 | 최선의 방법 선택 |
| YAGNI 리뷰 | 과잉 설계 방지 |

### 자동 Semver 커밋 (`/vais commit`)

변경 규모를 분석해 major/minor/patch를 자동 제안하고, 7곳의 버전 참조를 일괄 업데이트합니다.

---

## 훅 시스템

| 훅 | 역할 |
|----|------|
| SessionStart | 이전 작업 복원, 워크플로우 안내 |
| SubagentStart | `scripts/agent-start.js` 호출 → agent-state.json + event-log.jsonl 기록 |
| SubagentStop | `scripts/agent-stop.js` 호출 → 완료 상태 기록 |
| PreToolUse(Bash) | 위험 명령 차단 (DROP TABLE, rm -rf 등) |
| PostToolUse(Write\|Edit) | 문서 작성 시 워크플로우 상태 자동 갱신 |
| Stop | 다음 단계 자동 안내 |
| UserPromptSubmit | 의도/체이닝 감지 |

---

## 설정 (vais.config.json)

| 설정 | 설명 |
|------|------|
| `cSuite.orchestrator` | 기본 오케스트레이터 (기본값: `"cto"`) |
| `cSuite.roles` | C-Suite 역할 레지스트리 (ceo/cpo/cto/cmo/cso/cfo/coo) |
| `cSuite.autoKeywords` | 역할 자동 트리거 키워드 (보안→cso, 마케팅→cmo 등) |
| `observability.enabled` | 에이전트 상태 + 이벤트 로깅 (기본값: `true`) |
| `observability.stateFile` | `.vais/agent-state.json` |
| `observability.eventLog` | `.vais/event-log.jsonl` |
| `mcp.enabled` | MCP 서버 활성화 (Phase 3, 기본값: `false`) |
| `workflow.gates` | Gate 체크포인트 수 (기본값: `4`) |
| `gapAnalysis.matchThreshold` | Gap 분석 통과 기준 (기본값: `90%`) |

---

## 프로젝트 구조

```
vais-claude-code/
├── .claude-plugin/          # 플러그인 매니페스트
├── agents/                  # C-Suite + sub-agents + 구현 에이전트
│   ├── ceo.md              # CEO (전략 + Reference Absorption)
│   ├── cpo.md              # CPO (제품 방향 + PRD, v0.24.0 신규)
│   ├── cto.md              # CTO (기술 오케스트레이션)
│   ├── cmo.md              # CMO (마케팅, seo에게 위임)
│   ├── cso.md              # CSO (보안/검증, sub-agent에게 위임)
│   ├── cfo.md              # CFO stub (v0.24.0 신규)
│   ├── coo.md              # COO stub (v0.24.0 신규)
│   ├── seo.md              # seo sub-agent (v0.24.0 신규)
│   ├── security.md         # security sub-agent (v0.24.0 신규)
│   ├── validate-plugin.md  # validate-plugin sub-agent (v0.24.0 신규)
│   └── design|architect|frontend|backend|qa.md
├── hooks/                   # 훅 (SubagentStart/Stop 포함)
│   ├── hooks.json
│   └── events.json          # 이벤트 스키마 문서
├── lib/
│   ├── observability/       # Layer 4: StateWriter + EventLogger
│   └── absorb-evaluator.js  # Reference Absorption 엔진
├── scripts/                 # Hook 호출 CLI
│   ├── agent-start.js
│   ├── agent-stop.js
│   └── phase-transition.js
├── skills/vais/             # 메인 스킬 + phase별 지시 파일
│   └── phases/             # ceo|cpo|cto|cmo|cso|cfo|coo|absorb.md 등
├── templates/               # Plan/Design/Architect/QA/Report 템플릿
├── package.json             # claude-plugin 메타데이터
├── vais.config.json         # 중앙 설정
└── CHANGELOG.md
```

---

## FAQ

<details>
<summary><strong>CPO와 CTO의 역할 차이는 뭔가요?</strong></summary>

CPO는 **"무엇을 만들 것인가"** (제품 방향, PRD, 로드맵), CTO는 **"어떻게 만들 것인가"** (기술 설계, 구현 오케스트레이션)를 담당합니다. `/vais ceo:cpo:cto {feature}` 체이닝으로 순서대로 실행하면 전략 → 제품 → 기술 흐름이 자연스럽게 연결됩니다.
</details>

<details>
<summary><strong>기존 /vais auto 명령어를 쓰던 사람은?</strong></summary>

`/vais auto {기능}` → `/vais cto {기능}`으로 대체되었습니다. v0.24.0부터 `auto` phase 파일이 완전히 제거되었으므로 `/vais cto`를 사용하세요.
</details>

<details>
<summary><strong>vais-seo와 vais-validate-plugin은 어디 갔나요?</strong></summary>

v0.24.0에서 완전히 제거되었습니다. 기능은 각각 `agents/seo.md`(CMO sub-agent)와 `agents/validate-plugin.md`(CSO sub-agent)로 통합되었습니다. `/vais cmo {feature}` 또는 `/vais cso {feature} --validate-plugin`을 사용하세요.
</details>

<details>
<summary><strong>기존 프로젝트에도 적용할 수 있나요?</strong></summary>

네. `/vais init {피처명}`으로 기존 코드를 분석해 VAIS 문서를 역생성합니다.
</details>

<details>
<summary><strong>Observability 로그가 쌓이면 디스크 문제가 생기지 않나요?</strong></summary>

`lib/observability/rotation.js`가 자동 로테이션합니다. 기본 설정: 10MB 초과 또는 30일 경과 시 `.vais/archive/`로 아카이브.
</details>

<details>
<summary><strong>C-Suite 에이전트를 직접 추가할 수 있나요?</strong></summary>

네. `agents/{role}.md`를 만들고 `vais.config.json`의 `cSuite.roles`에 등록하면 됩니다. 표준 frontmatter(name, version, model, tools, hooks.Stop, disallowedTools)만 맞추면 됩니다.
</details>

<details>
<summary><strong>외부 의존성이 있나요?</strong></summary>

없습니다. Node.js 내장 모듈만 사용합니다.
</details>

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| 플러그인이 로드되지 않음 | Claude Code 재시작 → `/vais help` 확인 |
| Gap 분석이 90%에 안 됨 | 최대 5회 자동 반복. 이후 누락 기능 수동 구현 |
| agent-state.json 손상 | `rm .vais/agent-state.json` 삭제 후 재실행 |
| event-log.jsonl 용량 과다 | `lib/observability/rotation.js` 로테이션 자동 실행 (10MB 기준) |
| 피처명 오류 | 영문/숫자/`-`/`_`만 허용 (공백, 슬래시 불가) |
| stop hooks 실패 | `CLAUDE_PLUGIN_ROOT` 미설정 환경 → v0.24.0에서 수정됨 (`:-$(pwd)` fallback) |

---

## 라이선스

MIT License - [LICENSE](./LICENSE)

Made by [VAIS Voice](https://github.com/ghlee3401) · [CHANGELOG](./CHANGELOG.md)
