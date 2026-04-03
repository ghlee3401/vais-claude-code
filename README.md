# VAIS Code

**v0.38.3** · Claude Code C-Suite 플러그인

> AI C-Suite 조직. CEO에게 지시하면 C-Level 팀을 고용해서 알아서 한다.

---

## 작동 방식

사용자는 **CEO** (또는 개별 C-Level)에게 업무를 지시한다. CEO는 Product Owner로서 필요한 C-Level을 판단하고, 순서대로 업무를 위임하며, 결과를 종합 검토한다.

```
나 → CEO에게 "로그인 서비스 만들어줘"

     CEO가 판단: CPO → CTO → CSO → CMO → COO → CFO 필요

     ① CPO: 제품 정의 (PRD 생성)
     ② CTO: 기능 개발 (design → architect → frontend+backend → qa)
     ③ CSO: 보안 검토 → 이슈 발견 시 CTO에게 수정 지시 ↺
     ④ CMO: 마케팅 전략 수립
     ⑤ COO: 배포
     ⑥ CFO: 비용 분석 + 기능별 가격 책정

     CEO 최종 리뷰 → 미흡 시 해당 C-Level 재지시 ↺
```

### 두 가지 진입점

| 진입점 | 언제 쓰나 |
|--------|----------|
| `/vais ceo {feature}` | 새 서비스 런칭, 전체 프로세스가 필요할 때 |
| `/vais cto {feature}` | 기획/PRD가 이미 있고, 기술 구현만 필요할 때 |

개별 C-Level 직접 호출도 가능: `/vais cso {feature}`, `/vais cmo {feature}` 등.

**핵심 원칙**: 실행 에이전트(design, architect, frontend 등)는 직접 부르지 않는다. C-Level이 알아서 위임한다.

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

## C-Suite 조직도

```
                           ┌──────────┐
                           │   CEO    │  Product Owner
                           │ 전략+조율 │  최상위 오케스트레이터
                           └────┬─────┘
              ┌──────┬──────────┼─────────────┬──────┬──────┐
            ┌─┴─┐  ┌─┴─┐      ┌─┴─┐         ┌─┴─┐  ┌─┴─┐  ┌─┴─┐
            │CPO│  │CTO│      │CSO│         │CMO│  │COO│  │CFO│
            └─┬─┘  └─┬─┘      └─┬─┘         └─┬─┘  └───┘  └───┘
              │      │          │             │
           pm-*   design     security        seo
                  architect  validate-plugin
                  frontend   code-review
                  backend
                  qa
```

### CEO — 최상위 오케스트레이터 (Product Owner)

C-Level 팀을 고용·지휘. 서비스 런칭 시 전체 파이프라인 순차 실행 + 최종 리뷰.

| 모드 | 설명 |
|------|------|
| 서비스 런칭 | CPO→CTO→CSO(↺CTO)→CMO→COO→CFO 전체 파이프라인 |
| 라우팅 | 단일 요청을 적절한 C-Level에 위임 |
| absorb | 외부 레퍼런스 흡수 판정 (absorb-analyzer 위임) |

### CPO — 제품 정의

"무엇을 만들 것인가" 정의. PM 프레임워크 기반 PRD 생성.

| 하위 에이전트 | 역할 |
|-------------|------|
| pm-discovery | 기회 발견 (Teresa Torres OST) |
| pm-strategy | Value Proposition, Lean Canvas |
| pm-research | Personas, Market Sizing, 경쟁 분석 |
| pm-prd | 위 분석을 종합하여 PRD 합성 |

### CTO — 기술 총괄

"어떻게 만들 것인가" 실행. Plan→Design→Do→QA 전체 개발 워크플로우 지휘.

| 하위 에이전트 | 역할 |
|-------------|------|
| design | IA + 와이어프레임 + UI 설계 |
| architect | DB 스키마 + 환경 설정 |
| frontend | 프론트엔드 구현 |
| backend | 백엔드 API 구현 |
| qa | Gap 분석 + 코드 리뷰 + 보안 점검 |

### CSO — 보안 검토

CTO 구현물의 보안 검증. 이슈 발견 시 CEO에게 보고 → CTO 수정 → 재검토 반복.

| 하위 에이전트 | 역할 |
|-------------|------|
| security | OWASP Top 10 기반 보안 검토 |
| validate-plugin | 플러그인 구조 정합성 검증 |
| code-review | 독립 코드 리뷰 (Gate C) |

### CMO — 마케팅 전략

시장 진입 전략 수립 + SEO 최적화.

| 하위 에이전트 | 역할 |
|-------------|------|
| seo | SEO 감사 및 최적화 |

### COO — 배포/운영

CI/CD 파이프라인, 배포 전략, 모니터링 설정. 하위 에이전트 없음.

### CFO — 비용/가격 분석

기능별 비용 산출, ROI 분석, 가격 전략 수립. 하위 에이전트 없음.

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
/vais commit             # git 변경사항 분석 → Conventional Commits 메시지 생성 + semver 범프 제안
/vais init {feature}     # 기존 프로젝트 → VAIS 문서 역생성
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
    ├─ design + architect 위임 → docs/02-design/cto_login.design.md
    ├─ [CP-2] 실행 승인
    ├─ frontend + backend 병렬 위임 → docs/03-do/cto_login.do.md
    ├─ qa 위임               → docs/04-qa/cto_login.qa.md
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

CEO가 absorb-analyzer sub-agent에게 분석을 위임하고, 판정(absorb/merge/reject)을 내린다. 결과는 CEO PDCA 문서(`docs/01-plan/ceo_*.plan.md`, `docs/03-do/ceo_*.do.md`)에 기록되고, 중복 방지 인덱스는 `.vais/absorption-ledger.jsonl`에 유지.

---

## 프로젝트 구조

```
vais-claude-code/
├── agents/                  # C-Level 별 하위 폴더로 구성 (21개)
│   ├── ceo/                 #   CEO + absorb-analyzer
│   ├── cpo/                 #   CPO + pm-discovery/strategy/research/prd
│   ├── cto/                 #   CTO + architect/backend/frontend/design/qa
│   ├── cso/                 #   CSO + security/validate-plugin/code-review
│   ├── cmo/                 #   CMO + seo
│   ├── coo/                 #   COO
│   └── cfo/                 #   CFO
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
| `cSuite.launchPipeline.order` | `["cpo","cto","cso","cmo","coo","cfo"]` | 런칭 파이프라인 순서 |
| `workflow.phases` | `["plan","design","do","qa","report"]` | CTO 워크플로우 5단계 |
| `gapAnalysis.matchThreshold` | `90%` | QA 통과 기준 |
| `observability.enabled` | `true` | 로깅 on/off |

---

## 버전 히스토리

| 버전 | 주요 변경 |
|------|---------|
| v0.38.3 | CSO 2차 코드 리뷰: code-review 역할 등록, atomicWriteSync 적용, agent-stop 안정성 개선 |
| v0.38.1 | README CSO 하위 에이전트(code-review) 동기화, 조직도·프로젝트 구조 갱신 |
| v0.38.0 | agents 디렉토리 C-Level별 하위 폴더 재구조화, CSO Gate C(독립 코드 리뷰) 신설, CTO qa Confidence 필터링 추가 |
| v0.37.0 | CEO를 Product Owner 최상위 오케스트레이터로 승격, 서비스 런칭 파이프라인(CPO→CTO→CSO↺→CMO→COO→CFO) 신설 |
| v0.36.2 | basic/ 깨진 참조 제거(validate 스크립트), executor 완료 조건 현실화 |
| v0.36.1 | path traversal 수정, absorb-evaluator 버그 픽스, CLAUDE.md basic/ 참고용 명시, commit 버전 동기화 강화 |
| v0.33.3 | OWASP A01/A03/A08/A10 보안 수정: bash-guard rm 패턴 강화, CLI 인자 화이트리스트, webhook SSRF 방지, PM 에이전트 disallowedTools |
| v0.33.2 | lib/paths.js safePath() path traversal 방지, config 필수 필드 검증, package.json scripts 추가 |
| v0.33.1 | C-Level → CTO 공통 핸드오프 프로토콜: 검증/수정 분리 원칙, 7개 에이전트 표준 핸드오프 형식 |
| v0.33.0 | C-Level PDCA 문서 강제 메커니즘: doc-validator 신설, SubagentStop 훅 검증, 7개 C-Level 종료 전 체크리스트, 구분선 확대 |
| v0.32.0 | PDCA 문서 경로 통합: 전 C-Level 동일 폴더 구조 ({role}_{feature}.{phase}.md), Plan/Do/QA 필수화, /vais absorb 제거 |
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
