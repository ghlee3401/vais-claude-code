<p align="center">
  <a href="https://github.com/ghlee3401/vais-claude-code/actions/workflows/ci.yml">
    <img src="https://github.com/ghlee3401/vais-claude-code/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/version-0.54.1-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="license" />
</p>

<h1 align="center">VAIS Code</h1>

<p align="center">
  <strong>Virtual AI C-Suite for Software Development</strong><br/>
  6 C-Level Executives · 38 Specialized Agents · PDCA Workflow Engine
</p>

<p align="center">
  CEO에게 지시하면 제품 기획, 개발, 보안, 마케팅, 배포를 자율 실행하는 Claude Code 플러그인
</p>

---

## Quick Start

```bash
# Install
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code && bash scripts/setup-dev.sh

# In Claude Code
/reload-plugins
/vais help
```

**3가지 사용법:**

```bash
# 1) 서비스 런칭 — CEO가 전체 파이프라인 지휘
/vais ceo plan online-bookstore

# 2) 기술 구현만 — PRD/기획이 이미 있을 때
/vais cto plan login

# 3) 특정 C-Level 직접 — 원하는 전문가만 호출
/vais cbo plan market-entry          # 비즈니스 분석
/vais cso plan payment-integration   # 보안 검토
/vais cpo plan user-dashboard        # 제품 기획
```

**Phase 지정:**

```bash
/vais ceo ideation my-idea     # (선택) 아이디어 자유 대화
/vais cpo plan my-feature      # 기획
/vais cto design my-feature    # 설계
/vais cto do my-feature        # 구현
/vais cto qa my-feature        # QA
/vais cto report my-feature    # 리포트
```

---

## What Happens When You Run `/vais ceo plan`

사용자가 "온라인 서점 SaaS 만들어줘"라고 입력하면, CEO가 이를 **S-1 (신규 서비스 풀 개발)** 시나리오로 판별하고 다음 순서로 C-Level을 호출합니다:

| Step | C-Level | What They Do | Key Agents |
|------|---------|-------------|------------|
| **①** | **CBO** | 시장 기회 분석 + 재무 모델 | market-researcher, financial-modeler, pricing-analyst |
| **②** | **CPO** | PRD 작성 + 백로그 분해 | prd-writer, backlog-manager, ux-researcher |
| **③** | **CTO** | 아키텍처 설계 + 코드 구현 + 테스트 | infra-architect, backend/frontend-engineer, test-engineer |
| **④** | **CSO** | 보안 감사 + 코드 리뷰 + 시크릿 스캔 | security-auditor, secret-scanner, dependency-analyzer |
| **⑤** | **CBO** | GTM 전략 + SEO + 마케팅 카피 | growth-analyst, seo-analyst, copy-writer |
| **⑥** | **COO** | CI/CD 파이프라인 + 모니터링 | release-engineer, sre-engineer |
| **Final** | **CEO** | 전체 산출물 종합 리뷰 → 리포트 | — |

각 단계 완료 시 CEO가 결과를 검토하고, 사용자 승인을 받은 뒤 다음 C-Level로 넘어갑니다. CSO 보안 검토에서 이슈가 발견되면 CTO에게 수정을 요청하고 재검토하는 루프가 최대 3회 돌아갑니다.

---

## C-Suite Team

### Executive (Opus)

| C-Level | Domain | One-liner |
|---------|--------|-----------|
| **CEO** | Strategy | 전체 오케스트레이터. 피처 분석 → 시나리오 판별 → C-Level 동적 라우팅 |
| **CPO** | Product | 무엇을 만들지 결정. PRD, 사용자 리서치, 백로그 관리 |
| **CTO** | Technology | 어떻게 만들지 실행. 아키텍처, 개발, 테스트, 디버깅 |
| **CSO** | Security | 안전한지 확인. OWASP 감사, 시크릿 스캔, 의존성 분석, 독립 코드 리뷰 |
| **CBO** | Business | 사업성 검증. 시장 분석, GTM, 가격 전략, 재무 모델, unit economics |
| **COO** | Operations | 배포/운영 준비. CI/CD, 모니터링, 성능 벤치마크, Runbook |

### Sub-agents (Sonnet) — 38 Specialists

<details>
<summary><strong>CEO</strong> — 2 agents</summary>

| Agent | Role |
|-------|------|
| absorb-analyzer | 외부 스킬/레퍼런스 흡수 분석 |
| skill-creator | 신규 스킬/에이전트 마크다운 자동 생성 |

</details>

<details>
<summary><strong>CPO</strong> — 7 agents</summary>

| Agent | Role |
|-------|------|
| product-discoverer | 시장 기회 발굴, 고객 니즈 분석 |
| product-strategist | 제품 전략 수립, 우선순위 결정 |
| product-researcher | 경쟁사 벤치마킹, 사용 패턴 분석 |
| prd-writer | PRD 작성 (기능/비기능 요구사항, 인수 기준) |
| backlog-manager | PRD → User Story + Sprint Plan 변환 (INVEST/MoSCoW/RICE) |
| ux-researcher | JTBD 인터뷰, 사용성 테스트, 정보 구조 설계 |
| data-analyst | 제품 메트릭 분석 (DAU/MAU, A/B 테스트, 퍼널) |

</details>

<details>
<summary><strong>CTO</strong> — 8 agents</summary>

| Agent | Role |
|-------|------|
| infra-architect | DB 스키마, 환경 설정, 프로젝트 셋업 |
| backend-engineer | API, 비즈니스 로직, 데이터 검증 |
| frontend-engineer | UI 컴포넌트, 상태 관리, 클라이언트 최적화 |
| ui-designer | IA, 와이어프레임, UI 디자인 |
| db-architect | DB 스키마 최적화, 마이그레이션, 쿼리 튜닝 |
| qa-engineer | Gap 분석, 코드 리뷰, QA 검증 (≥90% match) |
| test-engineer | 단위/통합/E2E 테스트 코드 생성 |
| incident-responder | 체계적 디버깅 (investigate → analyze → hypothesize → implement) |

</details>

<details>
<summary><strong>CSO</strong> — 7 agents</summary>

| Agent | Role |
|-------|------|
| security-auditor | OWASP Top 10 보안 감사 |
| code-reviewer | 독립 코드 리뷰 (CTO 피어 리뷰와 별개) |
| secret-scanner | API 키/토큰/비밀번호 탐지 (regex + entropy + heuristics) |
| dependency-analyzer | CVE 취약점, 라이선스, 공급망 리스크 분석 |
| plugin-validator | 플러그인 배포 전 구조 검증 |
| skill-validator | 스킬/에이전트 마크다운 frontmatter 검증 |
| compliance-auditor | GDPR, 라이선스 준수 확인 |

</details>

<details>
<summary><strong>CBO</strong> — 10 agents</summary>

| Agent | Role |
|-------|------|
| market-researcher | 시장/경쟁 분석 (PEST, SWOT, Porter 5F, TAM/SAM/SOM) |
| customer-segmentation-analyst | 고객 세분화, 페르소나 (RFM, JTBD, AARRR+R) |
| seo-analyst | SEO 감사, 콘텐츠 캘린더, Core Web Vitals |
| copy-writer | 브랜드 포지셔닝, 마케팅 카피 (PAS/AIDA/BAB) |
| growth-analyst | GTM 전략, growth loop, 퍼널 최적화, North Star Metric |
| pricing-analyst | 가격 전략 (Cost-plus, Value-based, GBB tiering) |
| financial-modeler | 3-Statement 모델, DCF, 시나리오 분석 (Bear/Base/Bull) |
| unit-economics-analyst | CAC/LTV/Payback, cohort 분석, SaaS metrics |
| finops-analyst | 클라우드 비용 분석, right-sizing, waste detection |
| marketing-analytics-analyst | 멀티터치 어트리뷰션, 채널 ROI, incrementality |

</details>

<details>
<summary><strong>COO</strong> — 4 agents</summary>

| Agent | Role |
|-------|------|
| release-engineer | CI/CD 파이프라인, Docker, 배포 자동화 |
| sre-engineer | 모니터링/알림 설정, incident runbook |
| release-monitor | 배포 후 canary 모니터링 |
| performance-engineer | 성능 벤치마크, 회귀 탐지 |

</details>

---

## Scenarios

CEO는 사용자 요청을 분석하여 10+1 시나리오 중 가장 적합한 흐름을 선택합니다.

| ID | 상황 | 호출 순서 |
|----|------|-----------|
| S-0 | 아이디어가 모호할 때 | CEO ideation → 추천 C-Level |
| S-1 | 신규 서비스 풀 개발 | CBO → CPO → CTO → CSO → CBO → COO |
| S-2 | 기존 서비스에 기능 추가 | CPO → CTO → CSO → COO |
| S-3 | 버그 수정 / UX 개선 / 리팩터 | CTO (유형별 분기) |
| S-4 | 프로덕션 장애 | CTO(incident-responder) → CSO → COO |
| S-5 | 성능 / 비용 최적화 | CTO(perf) 또는 CBO(finops) |
| S-6 | 보안 감사 / 컴플라이언스 | CSO ↔ CTO (최대 3회) |
| S-7 | 마케팅 캠페인 / GTM | CPO → CBO → (CTO) |
| S-8 | 시장 분석 / IR 보고 | CBO → (CPO) |
| S-9 | 스킬/에이전트 생성 | CEO(skill-creator) → CSO |
| S-10 | 정기 운영 / 기술부채 | CTO 또는 COO |

---

## Workflow

모든 C-Level은 동일한 PDCA 워크플로우를 따릅니다:

| Phase | Required | Description |
|-------|----------|-------------|
| **Ideation** | Optional | 자유 대화 모드. 산출물 없이 아이디어 숙성. "정리해줘"로 종료 → plan 자동 참조 |
| **Plan** | **Mandatory** | 요구사항 정의, 범위 설정, 타임라인 |
| **Design** | **Mandatory** | 아키텍처 설계, 기술 스택, DB 스키마 |
| **Do** | **Mandatory** | 구현. Sub-agent 병렬 실행 |
| **QA** | **Mandatory** | Gap 분석, 보안 검증. Match rate ≥ 90% 통과. 미달 시 Do 재실행 (최대 5회) |
| **Report** | Optional | 최종 리포트, 회고, KPI |

**C-Level 간 의존성:**

| C-Level | 선행 조건 |
|---------|-----------|
| CBO | 없음 (CEO 직접 위임) |
| CPO | 없음 |
| CTO | CPO 완료 필요 |
| CSO | CTO 완료 필요 |
| COO | CTO 완료 필요 |

---

## Ideation (Phase 0)

아이디어가 아직 모호할 때 사용합니다. 산출물 강제 없이 자유 대화로 아이디어를 숙성시킵니다.

```bash
/vais ceo ideation pricing-strategy
```

**동작:**
1. CEO가 ideation 모드로 진입 — PRD 템플릿 강제 없음, "plan 갈까요?" 반복 질문 금지
2. **첫 turn scope probe**: 30분 이내 직접 편집으로 해결 가능하면 "이건 `/vais` 규모 아닙니다. 바로 실행?" 제안
3. 사용자 주도로 자유 대화 (5~10 turn)
4. 두 종료 분기:
   - **A. 요약 + plan** ("정리해줘" / "plan 가자" / "요약") → `docs/pricing-strategy/00-ideation/main.md` 저장 + 다음 C-Level 추천
   - **B. 직접 실행** ("그냥 해줘" / "바로 실행" / "skip vais") → 문서 **없이** 종료, 일반 Edit/Write로 직접 처리

**Ideation 없이 plan 직행도 가능:** `/vais cpo plan my-feature` — 기존과 동일하게 동작합니다.

---

## Quality Gates

### 4-Step Harness Gate

Sub-agent 종료 시 자동 실행되는 검증 파이프라인:

| Step | Check | On Failure |
|------|-------|------------|
| **1. Document** | 필수 산출물 존재 (≥ 500B) | 누락 파일 목록 |
| **2. Checkpoint** | AskUserQuestion 기록 존재 | 미승인 항목 표시 |
| **3. Gate** | 1+2 종합 판정 | 실패 사유 집계 |
| **4. Transition** | 통과 → 다음 phase 자동 전이 / 실패 → 재시도 가이드 | 디버그 팁 제공 |

### Advisor Tool (M-24)

모든 Sonnet sub-agent에 Opus reviewer가 내장되어, 작업 중 자동으로 전략 조언을 수신합니다:

- **Early plan** (1회) — 접근 방향 검증
- **Stuck** (1회) — 막혔을 때 대안 제시
- **Final review** (1회) — 완료 전 누락 확인
- Max 3회/요청. 월 $200 예산 캡 초과 시 자동 비활성화 (Sonnet 단독 계속)

### CSO Final Gate

코드가 수정되는 **모든** 시나리오에서 CSO가 최종 보안 검증을 수행합니다. CSO 승인 없이는 배포 단계로 넘어갈 수 없습니다.

---

## Document Structure

```
docs/
└── {feature}/                    # 피처 중심 구조 (v0.52+)
    ├── ideation/main.md          (optional) 아이디어 요약
    ├── plan/main.md              요구사항, 범위, 타임라인
    ├── design/main.md            아키텍처, 기술 스택
    │   └── (infra.md, interface-contract.md 등 sub-doc 허용)
    ├── do/main.md                구현 로그
    ├── qa/main.md                QA 리포트, gap 분석
    └── report/main.md            최종 리포트
```

> v0.52 이전의 phase 중심 구조(`docs/00-ideation/`, `docs/01-plan/` 등)는 `docs/_legacy/`로 이관되었습니다. 각 phase 폴더 내에 `main.md`가 인덱스 역할을 하며, 대형 피처는 `{sub}.md` 형식의 sub-doc 분리를 허용합니다.

---

## Project Layout

```
vais-claude-code/
├── agents/          6 C-Level 디렉토리 + _shared 가드 (38 sub-agents)
├── skills/vais/     /vais 스킬 진입점 + phase routers + utilities
├── hooks/           6 hooks (session, bash-guard, doc-tracker, stop, agent-start/stop)
├── lib/             advisor, core, quality, observability, registry, validation
├── scripts/         CLI 도구 (bash-guard, validators, migration)
├── templates/       PDCA 문서 템플릿 (plan/design/do/qa/report/ideation)
├── guide/           v2 설계 문서 (roles, scenarios, agent-mapping, harness)
├── vais.config.json 플러그인 설정
└── package.json     매니페스트
```

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `workflow.phases` | ideation ~ report | PDCA phases (ideation optional) |
| `dependencies` | cto→cpo, cso→cto, coo→cto, cbo→none | C-Level 의존성 |
| `gapThreshold` | 0.90 | QA 통과 기준 (90%) |
| `advisor.enabled` | true | Opus advisor 활성화 |
| `advisor.monthly_budget_usd` | 200 | 월 advisor 비용 캡 |
| `automation.level` | L2 | L0 수동 ~ L4 전자동 |

---

## Migration from v0.49

| v0.49 | v0.50 |
|-------|-------|
| 7 C-Level (CMO + CFO 별도) | 6 C-Level (**CBO**로 통합) |
| 5 phases | 6 phases (+ideation) |
| `/vais cmo` | → `/vais cbo` |
| `/vais cfo` | → `/vais cbo` |

기존 `.vais/status.json`의 `cmo_*`/`cfo_*` 항목은 첫 실행 시 자동 변환. 백업: `.vais/_backup/v049-{ts}.tar.gz`

---

## Testing

```bash
npm test    # 175 pass, 0 fail (v0.54.1)
```

---

## Developer Setup

Git hooks 활성화 (1회 실행):

```bash
npm run prepare-hooks
```

활성화되는 검사:

- **legacy-path-guard** — `docs/NN-` 레거시 경로 패턴 커밋 차단 (예외: `docs/_legacy/`, `CHANGELOG.md`, 회귀 가드)
- ESLint (`scripts/`, `lib/`, `hooks/` — max-warnings 0)
- Unit tests (`node --test tests/*.test.js`)

비활성화:

```bash
git config --unset core.hooksPath
```

> `git commit --no-verify`로 hook을 우회하지 마세요. 규칙 위반은 LLM 재발 위험 + 수십 파일 재치환을 유발합니다. 자세한 정책은 `docs/legacy-path-guard/` 참조.

---

## CI Status Check 강제 (owner 수동 설정)

PR merge를 CI 통과 후에만 허용하려면 저장소 owner가 branch protection rule을 수동으로 설정해야 합니다:

1. GitHub 저장소 → **Settings** → **Branches**
2. **Branch protection rules** → **Add rule**
3. Branch name pattern: `main`
4. ✅ **Require status checks to pass before merging**
5. Status check 검색창에서 `CI / build-and-test` 선택 (workflow job name)
6. ✅ **Require branches to be up to date before merging**
7. (선택) ✅ **Require pull request reviews before merging**

> 자동화 범위 밖 — GitHub REST API로 설정 가능하나 owner PAT 필요. 수동 설정 유지.
> 관련 설계: `docs/ci-bootstrap/02-design/main.md §5`

---

## Design Documents

- **[C-Suite Roles v2](./guide/csuite-roles-v2.md)** — 6 C-Level 역할 정의, 업무 범위, 경계 케이스, 핸드오프 규칙
- **[Scenarios v2](./guide/csuite-scenarios-v2.md)** — 10+1 시나리오 단계별 명세 (진입/완료 조건, CEO 판단 기준)
- **[Agent Mapping v2](./guide/agent-mapping-v2.md)** — Phase별 에이전트 참여 매트릭스, 모델 선택 기준
- **[Harness Plan v2](./guide/harness-plan-v2.md)** — Hook 시스템, FSM, 4-Step Gate, Advisor 통합
- **[CHANGELOG](./CHANGELOG.md)** — 전체 버전 이력

---

## License

MIT

<p align="center">
  <sub>Built with <a href="https://claude.ai/claude-code">Claude Code</a></sub>
</p>
