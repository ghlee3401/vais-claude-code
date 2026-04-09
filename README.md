# VAIS Code

**v0.48.3** · Claude Code C-Suite 플러그인

> AI C-Suite 조직. CEO에게 지시하면 C-Level 팀을 고용해서 알아서 한다.

---

## 작동 방식

사용자는 **CEO** (또는 개별 C-Level)에게 업무를 지시한다. CEO는 Product Owner로서 필요한 C-Level을 판단하고, 순서대로 업무를 위임하며, 결과를 종합 검토한다.

```
나 → CEO에게 "로그인 서비스 만들어줘"

     CEO가 피처 분석 → 다음 C-Level 동적 추천 → 사용자 승인

     CEO: "제품 정의가 필요합니다" → CPO 추천 → 승인 → CPO 실행
     CEO: "기술 구현이 필요합니다" → CTO 추천 → 승인 → CTO 실행
     CEO: "보안 검토가 필요합니다" → CSO 추천 → 승인 → CSO 실행 (이슈 시 CTO ↺)
     CEO: "내부 도구이므로 CMO 불필요, 배포로" → COO 추천 → ...
     CEO: 모든 필요 C-Level 완료 → 최종 리뷰
```

### 세 가지 진입점

| 진입점 | 언제 쓰나 |
|--------|----------|
| `/vais ceo {feature}` | 새 서비스 런칭, 전체 C-Level 파이프라인�� 필요할 때 |
| `/vais cto {feature}` | 기획/PRD가 이미 있고, 기술 구현만 필요할 때 |
| `/vais {c-level} {feature}` | 특정 C-Level에 직접 업무 지시 (cpo, cso, cmo, coo, cfo) |

**핵심 원칙**: 실행 에이전트(infra-architect, frontend-engineer, backend-engineer 등)는 직접 부르지 않는다. C-Level이 알아서 위임한다.

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

## C-Suite 조직 (37개 에이전트)

| C-Level | 역할 | 하위 에이전트 |
|---------|------|-------------|
| **CEO** | 최상위 오케스트레이터 (Product Owner). 런칭 파이프라인 지휘, 라우팅, absorb | absorb-analyzer, retrospective-writer |
| **CPO** | 제품 정의. PM 프레임워크 기반 PRD 생성 | product-discoverer, product-strategist, product-researcher, prd-writer, ux-researcher, data-analyst |
| **CTO** | 기술 총괄. Plan→Design→Do→QA 개발 워크플로우 지휘 | infra-architect, ui-designer, frontend-engineer, backend-engineer, qa-engineer, test-engineer, release-engineer, db-architect, incident-responder |
| **CSO** | 보안 검토. Gate A(보안)/B(플러그인)/C(코드리뷰). 이슈 시 CTO 수정 루프 | security-auditor, plugin-validator, code-reviewer, compliance-auditor |
| **CMO** | 마케팅 전략 + SEO 최적화 | seo-analyst, copy-writer, growth-analyst |
| **COO** | 배포/운영. CI/CD, 모니터링, 기술 문서 | release-monitor, performance-engineer, sre-engineer, release-engineer, technical-writer |
| **CFO** | 비용/가격 분석. ROI, 가격 전략 | finops-analyst, pricing-analyst |

---

## 커맨드

### 주력

```bash
/vais ceo {feature}      # 서비스 런칭 — 전체 C-Level 파이프라인 오케스트레이션
/vais cto {feature}      # 기술 구현만 — 기획이 이미 있을 때
/vais cpo {feature}      # PRD 생성
/vais cso {feature}      # 보안 검토
/vais cmo {feature}      # 마케팅/SEO 점검
/vais coo {feature}      # 배포/운영 계획
/vais cfo {feature}      # 비용/ROI/가격 분석
```

### 유틸리티

```bash
/vais status             # 피처 진행 현황
/vais next               # 다음 실행할 단계 안내
/vais commit             # git 변경사항 분석 → Conventional Commits 메시지 생성 + semver 범프 제안
/vais init {feature}     # 기존 프로젝트 → VAIS 문서 역생성
/vais mcp-builder        # MCP 서버 개발 가이드
/vais skill-creator      # 스킬 작성 가이드 (구조, 프로세스, description 최적화)
/vais help               # 도움말
```

---

## 워크플로우

### CEO 서비스 런칭 플로우

```
/vais ceo login
    │
    ├─ Plan: 런칭 범위 결정 (MVP / 표준 / 확장)
    ├─ [CP-L1] 범위 확인
    │
    ├─ ① CPO 호출: PRD 생성
    ├─ [CP-L2] CPO 결과 확인
    │
    ├─ ② CTO 호출: 기능 개발 (plan → design → do → qa)
    ├─ [CP-L2] CTO 결과 확인
    │
    ├─ ③ CSO 호출: 보안 검토
    │   └─ 이슈 발견 시 → CTO 수정 → CSO 재검토 (최대 3회)
    ├─ [CP-L2] CSO 결과 확인
    │
    ├─ ④ CMO 호출: 마케팅 전략
    ├─ ⑤ COO 호출: 배포
    ├─ ⑥ CFO 호출: 비용/가격 분석
    │
    ├─ [CP-L3] CEO 최종 리뷰 → 미흡 시 재지시
    └─ Report 작성 → docs/05-report/ceo_login.report.md
```

### CTO 단독 플로우 (기술 구현만)

```
/vais cto login
    │
    ├─ Plan 직접 작성        → docs/01-plan/cto_login.plan.md
    ├─ [CP-1] 범위 확인 (A/B/C)
    ├─ ui-designer + infra-architect 위임 → docs/02-design/cto_login.design.md
    ├─ [CP-2] 실행 승인
    ├─ frontend-engineer + backend-engineer 병렬 위임 → docs/03-do/cto_login.do.md
    ├─ qa-engineer 위임      → docs/04-qa/cto_login.qa.md
    └─ Report 작성           → docs/05-report/cto_login.report.md
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

모든 C-Level이 동일한 PDCA 폴더를 사용. 파일명: `{role}_{feature}.{phase}.md`

```
docs/
  ├── 01-plan/
  │   ├── cto_{feature}.plan.md        CTO 기획
  │   ├── cpo_{feature}.plan.md        CPO 제품 기획
  │   ├── cso_{feature}.plan.md        CSO 위협 분석
  │   └── ...                          (CEO, CMO, CFO, COO)
  ├── 02-design/                       (선택)
  ├── 03-do/
  │   ├── cto_{feature}.do.md          CTO 구현 로그
  │   ├── cpo_{feature}.do.md          CPO PRD
  │   ├── cso_{feature}.do.md          CSO 보안 검토 결과
  │   ├── cmo_{feature}.do.md          CMO 마케팅 분석
  │   ├── cfo_{feature}.do.md          CFO 재무 분석
  │   └── coo_{feature}.do.md          COO 운영 계획
  ├── 04-qa/
  │   ├── cto_{feature}.qa.md          CTO QA
  │   └── cso_{feature}.qa.md          CSO 보안 판정
  └── 05-report/                       (선택)
```

**필수 단계**: Plan, Do, QA — **선택 단계**: Design, Report

---

## Reference Absorption

외부 레퍼런스(다른 플러그인, 문서, 레포)를 평가해서 흡수한다. CEO 에이전트의 absorb 모드로 실행.

```bash
/vais ceo {feature}    # "이 레퍼런스 흡수해줘 ../bkit/" 요청
```

CEO가 absorb-analyzer sub-agent에게 분석을 위임하고, 판정(absorb/merge/reject)을 내린다. 결과는 CEO PDCA 문서(`docs/01-plan/ceo_*.plan.md`, `docs/03-do/ceo_*.do.md`)에 기록되고, 중복 방지 인덱스는 `docs/absorption-ledger.jsonl`에 유지.

---

## 프로젝트 구조

```
vais-claude-code/
├── agents/                  # C-Level 별 하위 폴더로 구성 (37개)
│   ├── ceo/                 #   CEO + absorb-analyzer + retrospective-writer
│   ├── cpo/                 #   CPO + product-discoverer/strategy/research/prd + ux-researcher + data-analyst
│   ├── cto/                 #   CTO + infra-architect/backend-engineer/frontend-engineer/ui-designer/qa-engineer + test-engineer/release-engineer/db-architect + incident-responder
│   ├── cso/                 #   CSO + security-auditor/plugin-validator/code-reviewer + compliance-auditor
│   ├── cmo/                 #   CMO + seo-analyst + copy-writer + growth-analyst
│   ├── coo/                 #   COO + release-monitor/performance-engineer + sre-engineer + technical-writer
│   └── cfo/                 #   CFO + finops-analyst + pricing-analyst
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
| `cSuite.orchestrator.fullLaunch` | `"ceo"` | 서비스 런칭 오케스트레이터 |
| `cSuite.orchestrator.techOnly` | `"cto"` | 기술 구현 오케스트레이터 |
| `cSuite.launchPipeline.routing` | `"dynamic"` | CEO 동적 라우팅 (피처 성격 + 산출물 상태 기반 판단) |
| `cSuite.launchPipeline.dependencies` | `{"cso":["cto"],...}` | C-Level 간 의존성 맵 (CEO 판단 참조용) |
| `workflow.phases` | `["plan","design","do","qa","report"]` | CTO 워크플로우 5단계 |
| `gapAnalysis.matchThreshold` | `90%` | QA 통과 기준 |
| `observability.enabled` | `true` | 로깅 on/off |

---

전체 이력: [CHANGELOG.md](./CHANGELOG.md)
