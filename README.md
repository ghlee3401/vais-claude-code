# VAIS Code

**v0.31.0** · Claude Code C-Suite 플러그인

> C-Suite AI 팀. `/vais cto {feature}` 하나로 기획부터 구현까지.

---

## 이 플러그인이 하는 일

Claude Code에 C-Suite 에이전트 팀을 붙여준다. 사용자는 C-레벨만 호출하고, C-레벨이 하위 실무자에게 알아서 위임한다.

```
나 → /vais cto login
        CTO → design 에이전트 위임
           → architect 에이전트 위임
           → frontend + backend 병렬 위임
           → qa 에이전트 위임
        각 단계마다 Gate 체크 + 내게 확인 요청
```

**핵심 원칙**: 구현 단계(`/vais plan`, `/vais architect` 등)는 직접 부르지 않는다. CTO가 알아서 한다.

---

## 새 PC 세팅

```bash
# 1. 레포 클론
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code

# 2. 개발 환경 세팅 (symlink: marketplace → 이 레포)
bash scripts/setup-dev.sh

# 3. Claude Code 열고
/reload-plugins

# 4. 확인
/vais help
```

setup-dev.sh가 하는 일: `~/.claude/plugins/marketplaces/vais-marketplace` → 이 레포를 심링크로 연결. 이후 코드 수정 → `/reload-plugins` 만으로 즉시 반영된다.

**Windows (WSL2)**: WSL 터미널에서 동일하게 실행.

---

## C-Suite 에이전트

| 에이전트 | 모델 | 역할 | 산출물 |
|---------|------|------|--------|
| CTO | opus | 기술 전체 오케스트레이션 (plan→qa, Gate 체크) | `docs/01-plan/` ~ `docs/05-report/` |
| CEO | opus | 비즈니스 전략, C-Level 라우팅, Reference Absorption | `.vais/memory.json` |
| CPO | opus | 제품 방향, PRD 생성 (pm sub-agents 오케스트레이션) | `docs/00-prd/{feature}.prd.md` |
| CMO | opus | 마케팅 분석 + SEO (seo sub-agent 위임) | `docs/06-domain/{feature}.marketing.md` |
| CSO | opus | 보안 검토 Gate A, 플러그인 검증 Gate B | `docs/06-domain/{feature}.security.md` |
| CFO | opus | 재무/ROI 분석, 비용-편익, 가격 전략 | `docs/06-domain/{feature}.finance.md` |
| COO | opus | 운영/배포 체크리스트, CI/CD, 모니터링 | `docs/06-domain/{feature}.ops.md` |

### CTO 구현 에이전트 (CTO가 직접 위임, 내가 직접 부르지 않음)

| 에이전트 | 역할 |
|---------|------|
| design | IA + 와이어프레임 + UI 설계 |
| architect | DB 스키마 + 환경 설정 |
| frontend | 프론트엔드 구현 |
| backend | 백엔드 API |
| qa | Gap 분석 + 코드 리뷰 + 보안 |

### Sub-agents (각 C-Suite이 위임, 내가 직접 부르지 않음)

| 에이전트 | 상위 | 역할 |
|---------|------|------|
| pm-discovery | CPO | 기회 발견 (Teresa Torres OST) |
| pm-strategy | CPO | Value Proposition, Lean Canvas |
| pm-research | CPO | Personas, Market Sizing, 경쟁 분석 |
| pm-prd | CPO | PRD 합성 |
| seo | CMO | SEO 감사 |
| security | CSO | OWASP Top 10 보안 검토 |
| validate-plugin | CSO | 플러그인 구조 검증 |
| absorb-analyzer | CEO | 외부 레퍼런스 흡수 분석 |

---

## 커맨드

### 주력

```bash
/vais cto {feature}      # 구현 전체 오케스트레이션 (가장 많이 씀)
/vais ceo {feature}      # 비즈니스 방향 먼저 잡을 때
/vais cpo {feature}      # PRD 먼저 만들 때
/vais cmo {feature}      # 마케팅/SEO 점검
/vais cso {feature}      # 보안 검토
/vais cfo {feature}      # 재무/ROI 분석
/vais coo {feature}      # 배포/운영 계획
```

### 유틸리티

```bash
/vais status             # 피처 진행 현황
/vais absorb {path}      # 외부 레퍼런스 흡수
/vais commit             # git 변경사항 분석 → Conventional Commits 메시지 생성 + semver 범프 제안
/vais init {feature}     # 기존 프로젝트 → VAIS 문서 역생성
/vais help               # 도움말
```

---

## 워크플로우

### CTO 플로우 (5단계 PDCA)

```
/vais cto login
    │
    ├─ Plan 직접 작성        → docs/01-plan/login.plan.md
    ├─ [CP-1] 범위 확인 (A/B/C)
    ├─ design + architect 위임 → docs/02-design/login.design.md
    ├─ [CP-2] 실행 승인
    ├─ frontend + backend 병렬 위임 → docs/03-do/login.do.md
    ├─ qa 위임               → docs/04-qa/login.qa.md
    └─ Report 작성           → docs/05-report/login.report.md
```

### CPO 플로우 (PRD 생성)

```
/vais cpo login
    │
    ├─ pm-discovery (병렬) → 기회 발견
    ├─ pm-strategy (병렬)  → 전략 수립
    ├─ pm-research (병렬)  → 시장 조사
    └─ pm-prd              → docs/00-prd/login.prd.md
```

### 에이전트 계약 (Contract)

모든 C-Level 에이전트는 표준 계약을 따른다:

```markdown
## Contract
### Input   — feature명 + 컨텍스트
### Output  — 산출물 경로 (명시적)
### State   — status.json 업데이트 조건
```

---

## 문서 경로 체계

```
docs/
  ├── 00-prd/{feature}.prd.md          CPO
  ├── 01-plan/{feature}.plan.md        CTO
  ├── 02-design/{feature}.design.md    CTO→design
  ├── 03-architect/{feature}.md        CTO→architect
  ├── 03-do/{feature}.do.md            CTO→fe+be
  ├── 04-qa/{feature}.qa.md            CTO→qa
  ├── 05-report/{feature}.report.md    CTO
  └── 06-domain/
       ├── {feature}.security.md       CSO
       ├── {feature}.marketing.md      CMO
       ├── {feature}.finance.md        CFO
       └── {feature}.ops.md            COO
```

---

## Reference Absorption

외부 레퍼런스(다른 플러그인, 문서, 레포)를 평가해서 흡수한다.

```bash
/vais absorb ../bkit/              # 디렉토리 통째로 평가
/vais absorb some-file.md          # 단일 파일
/vais absorb --history             # 흡수 이력
```

판정 기준: 품질 25점 미만 → 거부 / 기존과 50% 이상 겹침 → 병합 권장 / 품질 50+적합성 20 이상 → 흡수. 모든 결정은 `.vais/absorption-ledger.jsonl`에 기록.

---

## 프로젝트 구조

```
vais-claude-code/
├── agents/                  # 에이전트 정의 (20개)
│   ├── ceo|cpo|cto|cmo|cso|cfo|coo.md   # C-Suite (7, opus)
│   ├── design|architect|frontend|backend|qa.md  # 구현 (5, sonnet)
│   ├── pm-discovery|pm-strategy|pm-research|pm-prd.md  # PM (4, sonnet)
│   └── seo|security|validate-plugin|absorb-analyzer.md  # 특화 (4, sonnet)
├── skills/vais/
│   ├── SKILL.md             # /vais 스킬 진입점
│   ├── phases/              # C-Suite 위임 + 리다이렉트 스텁
│   └── utils/               # status, commit, init, help
├── hooks/                   # 6개: SessionStart, PreToolUse, PostToolUse, Stop, SubagentStart/Stop
├── lib/                     # status, memory, paths, observability, hook-logger
├── scripts/                 # bash-guard, doc-tracker, agent-start/stop
├── templates/               # plan, design, infra, qa, report, finance, ops
├── docs/strategy/           # 전략 문서
├── package.json
└── vais.config.json         # 워크플로우, C-Suite 역할, 경로 체계
```

---

## Hooks (6개)

| Hook | 스크립트 | 역할 |
|------|---------|------|
| SessionStart | `session-start.js` | 세션 초기화 + 상태 렌더링 |
| PreToolUse:Bash | `bash-guard.js` | 위험 명령 차단 (DROP TABLE, git push --force 등) |
| PostToolUse:Write\|Edit | `doc-tracker.js` | 문서 작성 → 워크플로우 상태 자동 업데이트 |
| Stop | `stop-handler.js` | 진행률 요약 + 다음 단계 안내 |
| SubagentStart | `agent-start.js` | 에이전트 시작 관측 |
| SubagentStop | `agent-stop.js` | 에이전트 종료 관측 |

모든 hook 실행은 `.vais/hook-log.jsonl`에 기록된다.

---

## Observability

에이전트 실행 상태와 이벤트가 자동으로 기록된다.

- `.vais/agent-state.json` — 현재 활성 에이전트, 파이프라인 상태
- `.vais/event-log.jsonl` — 모든 이벤트 (session_start, agent_start/stop, gate_check, decision 등)
- `.vais/hook-log.jsonl` — hook 실행 로그 (동작 확인용)
- 10MB 초과 또는 30일 경과 시 `.vais/archive/`로 자동 로테이션

---

## 설정 (`vais.config.json`)

자주 바꾸는 것들:

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `cSuite.orchestrator` | `"cto"` | 기본 오케스트레이터 |
| `workflow.phases` | `["plan","design","do","qa","report"]` | CTO 워크플로우 5단계 |
| `gapAnalysis.matchThreshold` | `90%` | QA 통과 기준 |
| `observability.enabled` | `true` | 로깅 on/off |

---

## 버전 히스토리

| 버전 | 주요 변경 |
|------|---------|
| v0.31.0 | 코어 재건축: ESM→CJS 통일, hook 이중 정의 해소, 에이전트 Contract 표준화, 경로 체계 재설계, CFO/COO 최소 구현 |
| v0.30.0 | pm-skills 흡수 — CPO 서브에이전트 4개 신설 + C-Suite PM 프레임워크 보강 |
| v0.29.1 | SessionStart에 systemMessage 활성화 메시지 추가 |
| v0.29.0 | PDCA 5문서 표준화 — Do 로그 문서 신설 + 경로 재번호화 |
| v0.28.1 | CSO Gate B 이슈 수정 |
| v0.28.0 | C레벨 PDCA 표준화, phases thin entry point |

전체 이력: [CHANGELOG.md](./CHANGELOG.md)

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| `/vais` 커맨드 안 됨 | `/reload-plugins` 실행 |
| 새 PC에서 플러그인 없음 | `bash scripts/setup-dev.sh` 후 `/reload-plugins` |
| agent-state.json 손상 | `rm .vais/agent-state.json` |
| status.json 파싱 에러 | `rm .vais/status.json` (자동 재생성됨) |
| hook 동작 확인 | `cat .vais/hook-log.jsonl` |
| symlink 깨짐 | `setup-dev.sh` 재실행 |
| `/vais plan` 쳤더니 리다이렉트됨 | 의도된 동작. `/vais cto {feature}` 사용 |
