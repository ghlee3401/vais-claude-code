<p align="center">
  <img src="https://img.shields.io/badge/version-0.50.0-blue?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/Claude_Code-plugin-7C3AED?style=flat-square" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/C--Suite-6_Executives-orange?style=flat-square" alt="C-Suite" />
  <img src="https://img.shields.io/badge/Sub--agents-38-green?style=flat-square" alt="Sub-agents" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="license" />
</p>

# VAIS Code

**Virtual AI C-Suite for Software Development**

> CEO에게 지시하면 6명의 C-Level 팀이 제품 기획부터 개발, 보안 검토, 마케팅, 배포까지 자율 실행합니다.

---

## How It Works

```
 You: "/vais ceo plan online-bookstore"
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CEO (Orchestrator)                         │
│                                                                     │
│  "신규 서비스 풀 개발이군. 시장 분석부터 시작하자" → S-1 시나리오    │
│                                                                     │
│  📊 분석: 피처 성격 + 산출물 상태 + 의존성 맵                       │
│  💡 추천: CBO → CPO → CTO → CSO → CBO → COO                       │
│  ❓ 사용자 승인: "CBO부터 시작할까요?"                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │ 승인
                         ▼
┌─ ① CBO (Business) ─────────────────────────────────────────────────┐
│                                                                     │
│  Plan:   market-researcher ──────── 시장 규모, PEST, Porter 5F     │
│          customer-segmentation ──── 페르소나, RFM 분석              │
│                        ↓                                            │
│  Design: pricing-analyst ─────────── 가격 전략, tier 설계           │
│          financial-modeler ────────── 3-Statement, DCF              │
│                        ↓                                            │
│  Output: 시장 분석 보고서 + 재무 모델 + 가격 전략                   │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ CEO: "시장 분석 완료. 제품 기획으로"
                         ▼
┌─ ② CPO (Product) ──────────────────────────────────────────────────┐
│                                                                     │
│  Plan:   product-discoverer ──────── 기회 발굴, 사용자 니즈        │
│          product-strategist ──────── 전략 수립, 우선순위            │
│                        ↓                                            │
│  Design: prd-writer ──────────────── PRD 작성 (8개 섹션)           │
│          backlog-manager ─────────── User Story + Sprint Plan       │
│                        ↓                                            │
│  Output: PRD + 백로그 + Acceptance Criteria                        │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ CEO: "PRD 완성. 기술 구현으로"
                         ▼
┌─ ③ CTO (Technology) ───────────────────────────────────────────────┐
│                                                                     │
│  Plan:   CTO 직접 ─────────────────── 기술 스택, 아키텍처 결정     │
│                        ↓                                            │
│  Design: infra-architect ─────────── DB 스키마 + 환경 설정         │
│          ui-designer ─────────────── IA + 와이어프레임              │
│                        ↓                                            │
│  Do:     ┌─ frontend-engineer ────── React/Next.js 구현            │
│          ├─ backend-engineer  ────── API + 비즈니스 로직    (병렬)  │
│          └─ test-engineer ────────── 테스트 코드 작성              │
│                        ↓                                            │
│  QA:     qa-engineer ─────────────── Gap 분석 (≥90% 통과)         │
│                        ↓                                            │
│  Output: 동작하는 코드 + 테스트 + API 문서                         │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ CEO: "구현 완료. 보안 검토"
                         ▼
┌─ ④ CSO (Security) ─────────────────────────────────────────────────┐
│                                                                     │
│  Do:     ┌─ security-auditor ─────── OWASP Top 10 점검            │
│          ├─ code-reviewer ────────── 독립 코드 리뷰        (병렬)  │
│          ├─ secret-scanner ───────── API 키/토큰 탐지              │
│          └─ dependency-analyzer ──── CVE + 라이선스 검사           │
│                        ↓                                            │
│  QA:     CSO 본체 ─── 4개 결과 통합 → severity 분류               │
│                        ↓                                            │
│          ┌─ Critical 발견? ─── YES → CTO 수정 요청 (최대 3회 루프) │
│          └─ NO → 승인                                               │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ CEO: "보안 통과. GTM 준비"
                         ▼
┌─ ⑤ CBO (Business — 2차) ───────────────────────────────────────────┐
│                                                                     │
│  Do:     ┌─ seo-analyst ─────────── SEO 감사 + 콘텐츠 캘린더      │
│          ├─ copy-writer ──────────── 랜딩/이메일/앱스토어 카피      │
│          ├─ growth-analyst ───────── GTM 전략 + growth loop (병렬)  │
│          └─ marketing-analytics ──── 채널 ROI + 어트리뷰션         │
│                        ↓                                            │
│  Output: GTM Plan + 마케팅 카피 + 성과 측정 프레임                 │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ CEO: "GTM 준비 완료. 배포"
                         ▼
┌─ ⑥ COO (Operations) ───────────────────────────────────────────────┐
│                                                                     │
│  Do:     release-engineer ────────── CI/CD + Docker + 배포 자동화  │
│          sre-engineer ────────────── 모니터링 + 알림 설정           │
│          performance-engineer ────── 성능 벤치마크 + 회귀 탐지     │
│                        ↓                                            │
│  Output: CI/CD 파이프라인 + Runbook + 모니터링 대시보드            │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CEO Final Review                               │
│                                                                     │
│  ✅ CBO: 시장 분석 완료        ✅ CSO: 보안 승인                    │
│  ✅ CPO: PRD + 백로그 완료     ✅ CBO: GTM 준비 완료                │
│  ✅ CTO: 구현 + 테스트 완료    ✅ COO: 배포 준비 완료               │
│                                                                     │
│  📊 종합 리포트 → docs/05-report/ceo_online-bookstore.report.md    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## C-Suite Organization

```
                              ┌───────────┐
                              │    CEO    │ ◀── Product Owner
                              │  (Opus)   │     Dynamic Router
                              └─────┬─────┘     10+1 Scenarios
                                    │
            ┌───────────┬───────────┼───────────┬───────────┐
            ▼           ▼           ▼           ▼           ▼
      ┌───────────┐┌───────────┐┌───────────┐┌───────────┐┌───────────┐
      │    CPO    ││    CTO    ││    CSO    ││    CBO    ││    COO    │
      │  Product  ││Technology ││ Security  ││ Business  ││Operations │
      │  (Opus)   ││  (Opus)   ││  (Opus)   ││  (Opus)   ││  (Opus)   │
      └─────┬─────┘└─────┬─────┘└─────┬─────┘└─────┬─────┘└─────┬─────┘
            │             │             │             │             │
     ┌──────┴──────┐ ┌───┴────┐  ┌─────┴─────┐ ┌────┴────┐  ┌────┴────┐
     │ 7 Agents    │ │8 Agents│  │ 7 Agents  │ │10 Agents│  │4 Agents │
     │ (Sonnet)    │ │(Sonnet)│  │ (Sonnet)  │ │(Sonnet) │  │(Sonnet) │
     │             │ │        │  │           │ │         │  │         │
     │ discoverer  │ │ infra  │  │ security  │ │ market  │  │ release │
     │ strategist  │ │ back   │  │ code-rev  │ │ segment │  │ sre     │
     │ researcher  │ │ front  │  │ secret    │ │ seo     │  │ monitor │
     │ prd-writer  │ │ ui     │  │ dep-anal  │ │ copy    │  │ perf    │
     │ backlog     │ │ db     │  │ plugin    │ │ growth  │  └─────────┘
     │ ux          │ │ qa     │  │ skill-val │ │ pricing │
     │ data        │ │ test   │  │ comply    │ │ finance │
     └─────────────┘ │ debug  │  └───────────┘ │ unit-ec │
                     └────────┘                 │ finops  │
                                                │ mkt-ana │
                                                └─────────┘
```

| C-Level | Role | Sub-agents | 의존 |
|---------|------|------------|------|
| **CEO** | 오케스트레이터 + 라우터 | absorb-analyzer, skill-creator | — |
| **CPO** | 제품 기획 + PRD + 백로그 | 7 agents (product/backlog/UX/data) | — |
| **CTO** | 기술 설계 + 구현 | 8 agents (infra/dev/qa/debug) | CPO |
| **CSO** | 보안 + 코드리뷰 + 컴플라이언스 | 7 agents (security/review/scan) | CTO |
| **CBO** | 마케팅 + 재무 + GTM | 10 agents (market/growth/finance) | — |
| **COO** | CI/CD + 배포 + 모니터링 | 4 agents (release/SRE/perf) | CTO |

---

## Workflow Phases

```
 ┌─────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
 │  💡 ideation│──▶│ 📋 plan  │──▶│ 🎨 design│──▶│ 🔧 do    │──▶│ ✅ qa    │──▶│ 📊 report│
 │  (optional) │   │(mandatory)│   │(mandatory)│   │(mandatory)│   │(mandatory)│   │(optional) │
 └─────────────┘   └──────────┘   └──────────┘   └──────────┘   └────┬─────┘   └──────────┘
                                                                      │
                                                        fail/iterate  │  ≥90% match
                                                                      ▼
                                                                 ┌──────────┐
                                                                 │ 🔧 do    │  (최대 5회)
                                                                 └──────────┘
```

| Phase | Required | Description | Output |
|-------|----------|-------------|--------|
| **Ideation** | Optional | 자유 대화. 산출물 강제 없음. "정리해줘"로 종료 | `docs/00-ideation/{role}_{topic}.md` |
| **Plan** | Mandatory | 요구사항 정의, 범위 설정, 타임라인 | `docs/01-plan/{role}_{feature}.plan.md` |
| **Design** | Mandatory | 아키텍처 설계, 기술 스택 선택, DB 스키마 | `docs/02-design/{role}_{feature}.design.md` |
| **Do** | Mandatory | 구현. Sub-agent 병렬 실행 | `docs/03-do/{role}_{feature}.do.md` |
| **QA** | Mandatory | Gap 분석, 보안 검증. Match rate ≥ 90% 통과 | `docs/04-qa/{role}_{feature}.qa.md` |
| **Report** | Optional | 최종 리포트, 회고, KPI 정리 | `docs/05-report/{role}_{feature}.report.md` |

---

## Ideation Flow (Phase 0)

```
 You: "/vais ceo ideation pricing-strategy"
  │
  ▼
 ┌─────────────────────────────────────────────┐
 │         CEO Ideation Mode                   │
 │                                              │
 │  ● 산출물 강제 없음                          │
 │  ● PRD 템플릿 자동 채움 금지                │
 │  ● "plan 갈까요?" 반복 질문 금지            │
 │  ● 사용자 주도 자유 대화                    │
 │                                              │
 │  You: "구독형 가격을 생각 중인데..."         │
 │  CEO: "어떤 고객층을 타겟으로?"              │
 │  You: "B2B SaaS 중소기업 대상"               │
 │  CEO: "티어링은 어떻게 생각?"                │
 │  You: "3단계 — free/pro/enterprise"          │
 │  ...                                         │
 │                                              │
 │  You: "정리해줘"  ◀── 종료 트리거            │
 └──────────┬──────────────────────────────────┘
            │
            ▼
 ┌─────────────────────────────────────────────┐
 │         Summary 자동 생성                   │
 │                                              │
 │  ■ Key Points: 3-tier 구독, B2B SaaS, ...  │
 │  ■ Decisions: free tier 포함 확정           │
 │  ■ Open Questions: enterprise 가격 미정     │
 │  ■ Next Step: CBO pricing-analyst 추천      │
 │                                              │
 │  → docs/00-ideation/ceo_pricing-strategy.md │
 └──────────┬──────────────────────────────────┘
            │
            ▼
 ┌─────────────────────────────────────────────┐
 │  CEO: "CBO의 pricing-analyst로 진행을       │
 │        추천합니다. 진행할까요?"              │
 │                                              │
 │  [CBO 진행] [다른 C-Level] [종료]           │
 └──────────┬──────────────────────────────────┘
            │ 승인
            ▼
  /vais cbo plan pricing-strategy
  (ideation 요약이 plan 컨텍스트로 자동 주입)
```

---

## CTO Standalone Flow

```
 You: "/vais cto plan login"      (PRD가 이미 있거나 직접 기획할 때)
  │
  ▼
 ┌──────────┐    ┌────────────────┐    ┌────────────────────────────┐
 │  📋 Plan │───▶│  🎨 Design     │───▶│  🔧 Do                     │
 │          │    │                │    │                            │
 │ CTO 직접 │    │ ui-designer    │    │ ┌─ frontend-engineer ─┐   │
 │ 기획서   │    │ infra-architect│    │ ├─ backend-engineer  ─┤   │
 │ 작성     │    │                │    │ └─ test-engineer ─────┘   │
 └──────────┘    └────────────────┘    └────────────┬───────────────┘
                                                    │
                                                    ▼
                                       ┌────────────────────────────┐
                                       │  ✅ QA                     │
                                       │                            │
                                       │  qa-engineer               │
                                       │  ├── Gap 분석 (≥90%)      │
                                       │  ├── 코드 리뷰             │
                                       │  └── 테스트 결과 검증      │
                                       │                            │
                                       │  PASS ──▶ 📊 Report       │
                                       │  FAIL ──▶ 🔧 Do (재시도)  │
                                       └────────────────────────────┘
```

---

## 10+1 Scenarios

| ID | Trigger | Who Gets Called |
|----|---------|----------------|
| **S-0** | 아이디어가 모호할 때 | `CEO ideation` → 추천 C-Level |
| **S-1** | 신규 서비스 풀 개발 | `CBO①` → `CPO` → `CTO` → `CSO` → `CBO②` → `COO` |
| **S-2** | 기존 서비스에 기능 추가 | `CPO` → `CTO` → `CSO` → `COO` |
| **S-3** | 버그 수정 / UX 개선 / 리팩터 | `CTO` (branch by type) |
| **S-4** | 프로덕션 장애 | `CTO`(incident-responder) → `CSO` → `COO` |
| **S-5** | 성능/비용 최적화 | `CTO`(perf) or `CBO`(finops) |
| **S-6** | 보안 감사 / 컴플라이언스 | `CSO` ↔ `CTO` loop (max 3) |
| **S-7** | 마케팅 캠페인 / GTM | `CPO` → `CBO` → (`CTO`) |
| **S-8** | 시장 분석 / 사업 분석 | `CBO` → (`CPO`) |
| **S-9** | 스킬/에이전트 생성 | `CEO`(skill-creator) → `CSO` |
| **S-10** | 정기 운영 / 기술부채 | `CTO` or `COO` |

---

## 4-Step Harness Gate

Sub-agent 종료 시 자동으로 실행되는 품질 검증 파이프라인:

```
 Sub-agent 작업 완료
  │
  ▼
 ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
 │ 1. Document      │────▶│ 2. Checkpoint    │────▶│ 3. Gate          │
 │    Validation    │     │    Validation    │     │    Judgment      │
 │                  │     │                  │     │                  │
 │ 필수 산출물 존재 │     │ AskUserQuestion  │     │ 종합 판정       │
 │ 파일 ≥ 500B     │     │ 기록 확인        │     │                  │
 └──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                            │
                                                   ┌───────┴───────┐
                                                   │               │
                                                   ▼               ▼
                                          ┌──────────────┐  ┌──────────────┐
                                          │ 4a. PASS     │  │ 4b. FAIL     │
                                          │              │  │              │
                                          │ 다음 phase   │  │ 재시도 가이드│
                                          │ 자동 전이    │  │ + 디버그 팁  │
                                          └──────────────┘  └──────────────┘
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/ghlee3401/vais-claude-code.git
cd vais-claude-code

# 2. Setup (symlink to Claude Code plugins)
bash scripts/setup-dev.sh

# 3. Reload in Claude Code
/reload-plugins

# 4. Try it
/vais help
```

### Usage Examples

```bash
/vais ceo ideation pricing-strategy     # 아이디어 숙성 (자유 대화)
/vais cpo plan pricing-strategy         # 제품 기획 (ideation 자동 참조)
/vais cto do payment-integration        # 기술 구현
/vais ceo plan online-bookstore         # 풀 서비스 런칭 (CEO가 전체 지휘)
/vais cso plan my-feature               # 보안 감사
/vais cbo plan market-entry             # 시장 분석 + 재무 모델
/vais status                            # 진행 현황
/vais next                              # 다음 단계 추천
```

### Three Entry Points

```
 ┌────────────────────────────────────────────────────────────────┐
 │                                                                │
 │  /vais ceo {feature}  ──── 전체 런칭 (CEO가 C-Level 조합 결정) │
 │                                                                │
 │  /vais cto {feature}  ──── 기술 구현만 (plan/PRD 이미 있을 때) │
 │                                                                │
 │  /vais {c-level} {feature} ── 특정 C-Level 직접 호출           │
 │                                                                │
 └────────────────────────────────────────────────────────────────┘
```

---

## Advisor Tool (M-24)

모든 Sonnet sub-agent에 Opus reviewer가 내장되어, 작업 중 자동으로 전략 조언을 수신합니다.

```
 Sub-agent (Sonnet) 작업 흐름
  │
  ├─ 1. Early Plan ────── advisor 호출 (1회)  "접근 방향 맞나?"
  │     ↓
  ├─ ... 작업 진행 ...
  │     ↓
  ├─ 2. Stuck ─────────── advisor 호출 (1회)  "막혔는데 다른 방법?"
  │     ↓
  ├─ ... 작업 계속 ...
  │     ↓
  └─ 3. Final Review ──── advisor 호출 (1회)  "빠뜨린 거 없나?"
                                                │
                                   max 3회. 초과 시 자동 거부.
                                   월 예산($200) 초과 시 자동 비활성화.
                                   (Sonnet 단독으로 정상 계속)
```

---

## Project Structure

```
vais-claude-code/
├── agents/                  # 6 C-Level + _shared guards
│   ├── ceo/                 #   CEO + absorb-analyzer + skill-creator
│   ├── cpo/                 #   CPO + 7 sub-agents
│   ├── cto/                 #   CTO + 8 sub-agents
│   ├── cso/                 #   CSO + 7 sub-agents
│   ├── cbo/                 #   CBO + 10 sub-agents
│   ├── coo/                 #   COO + 4 sub-agents
│   └── _shared/             #   advisor-guard.md, ideation-guard.md
├── skills/vais/             # /vais 스킬 진입점 + phase routers + utilities
├── hooks/                   # 6 hooks
├── lib/                     # Core libraries
│   ├── advisor/             #   Opus advisor wrapper
│   ├── core/                #   State machine, migration engine
│   ├── quality/             #   Gate manager
│   └── ...                  #   observability, registry, validation, control
├── scripts/                 # CLI tools
├── templates/               # PDCA document templates
├── docs/                    # Feature outputs (00-ideation ~ 05-report)
├── vais.config.json         # Plugin configuration
└── package.json             # Plugin manifest
```

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `workflow.phases` | ideation, plan, design, do, qa, report | PDCA phases (ideation optional) |
| `dependencies` | `{cto:[cpo], cso:[cto], coo:[cto], cbo:[]}` | C-Level 의존성 |
| `gapThreshold` | `0.90` | QA 통과 기준 (90%) |
| `advisor.enabled` | `true` | Opus advisor 활성화 |
| `advisor.max_uses_per_request` | `3` | Sub-agent당 최대 advisor 호출 |
| `advisor.monthly_budget_usd` | `200` | 월 예산 캡 (초과 시 자동 비활성화) |
| `automation.level` | `L2` | L0(수동) ~ L4(전자동) |

---

## Migration from v0.49

```
 v0.49                              v0.50
 ─────                              ─────
 7 C-Level (CMO + CFO 별도)   →    6 C-Level (CBO로 통합)
 5 phases                     →    6 phases (+ideation)
 /vais cmo ...                →    /vais cbo ...
 /vais cfo ...                →    /vais cbo ...

 기존 .vais/status.json:
   cmo_feature → cbo_feature  (자동 변환)
   cfo_feature → cbo_feature  (자동 변환)
   백업: .vais/_backup/v049-{timestamp}.tar.gz
```

---

## Testing

```bash
npm test    # 174 pass, 0 fail
```

---

## References

- [C-Suite Roles v2](./guide/csuite-roles-v2.md) — 역할 정의, 경계, 핸드오프 규칙
- [Scenarios v2](./guide/csuite-scenarios-v2.md) — 10+1 시나리오 단계별 명세
- [Agent Mapping v2](./guide/agent-mapping-v2.md) — Phase별 에이전트 참여 매트릭스
- [Harness Plan v2](./guide/harness-plan-v2.md) — Hook 시스템, FSM, 게이트 파이프라인
- [CHANGELOG](./CHANGELOG.md)

---

## License

MIT

<p align="center">
  <sub>Built with <a href="https://claude.ai/claude-code">Claude Code</a> · Powered by Claude Opus 4.6 + Sonnet 4.6</sub>
</p>
