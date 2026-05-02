# ceo-judgment-strengthening — Ideation v2.0

> Phase: 💡 ideation
> Owner: CEO
> Date: 2026-05-02
> Status: completed
>
> **v2.0 정정 사유**: v1.0/v1.1 의 "절차 단순화" 모델 폐기. 사용자 본질 통찰 반영 — vais-code 의 진짜 가치는 "비전문가용 시니어 어드바이저 팀". CEO 가 빈틈없이 판단해 결과만 사용자에게. 강제 규칙은 CEO 안에 흡수, 사용자는 결과만 검토.
>
> **이전 피처명** `simplify-non-cto-workflow` 는 의도와 안 맞음 → 진짜 의도 = `ceo-judgment-strengthening` (CEO 판단력 강화). 폴더명은 그대로 두되 본 ideation 의 피처 의도가 정정됨.

## [CEO] Ideation Summary

### 사용자 본질 발견

> "내가 개발 경험 적어서 이전 거장들의 지식을 sub-agent 로 박제했고, 언제 뭘 써야 할지 모르니 CEO 에게 위임. 근데 CEO 판단이 일관성 없어서 '왜 그건 안 해?' 되묻게 됨. CEO 가 빈틈없이 고려해서 적절한 방향으로 안내해줘야 됨."

→ 핵심 통찰:
1. **사용자 = 비전문가** (개발 경험 적음)
2. **vais-code 의 진짜 가치 = 거장 지식 박제 (37 sub-agent + 외부 framework)**
3. **CEO 의 진짜 역할 = 빈틈없는 판단 + 일관된 안내**
4. **현재 문제 = CEO 일관성 부재 → 사용자 혼란**
5. **강제 규칙의 정체 = 사용자가 비전문가라 일관성 보장하려고 박아둔 것**

### 이전 모델 (v1.0/v1.1) 의 모순

| 제안 | 사용자 비판 |
|------|-----------|
| v1.0 PDCA 5 phase 강제 | 절차 길어 |
| v1.1 비-CTO 단일 do | (수용했지만 다음 모순 발견) |
| 1 sub-agent = 1 MD | 한 파일 통합 부자연 |
| 1 artifact = 1 MD | 정답이 없는데? |
| AI 자율 + 사용자 검토자 | 사용자는 검토 능력 부족 |

매번 강제/자율 이분법으로 헤맸음. **둘 다 필요하다는 것이 답**:
- **강제** = CEO 알고리즘 안에 (일관성 보장)
- **자율** = CEO 가 피처 성격 보고 가변 적용
- **사용자에게는 결과만** (디테일 결정 부담 0)

### 가설 (v2.0)

> CEO 의 판단 알고리즘을 강화 (모든 도메인 차원 빠짐없이 체크) + 일관된 흐름 보장 + 사용자에게는 결과 + 근거만 제시 → 사용자가 "왜 그건 안 해?" 묻지 않고, 결정 부담 없이 빈틈없는 결과를 받음.

---

## 새 모델 — 5가지 핵심

### 1. PDCA 폴더 구조 유지

`docs/{feature}/{NN-phase}/` 골격 유지. 사용자 익숙 + 일관성. ideation/plan/design/do/qa/report 6 phase.

### 2. Phase 폴더 안에 artifact 별 MD

외부 거장 자료 (Lean Canvas, OST, PEST, OWASP 등) 마다 독립 MD. 한 파일 통합 X.

### 3. 각 phase 에 `main.md` (인덱스)

그 단계의 모든 artifact 링크 + 핵심 Decision Record + 다음 phase 안내.

### 4. CEO 가 ideation 에서 빈틈없이 결정

- 어떤 phase 가 필요한가
- 각 phase 에 어떤 artifact 가 필요한가 (어떤 거장의 framework 까지 적용)
- 어떤 C-Level / sub-agent 가 위임될 것인가

→ ideation/main.md 에 결정 박제. 이후 phase 자동 실행.

### 5. 사용자는 결과만 본다 (AskUserQuestion 클릭 인터페이스)

매 phase 진입 / 옵션 선택 부담 X. CEO 가 자동 진행. 사용자는 main.md 만 검토 (디테일은 grep).

**사용자 인터페이스 원칙 (v2.2)**:
- 모든 결정은 **AskUserQuestion 도구로 클릭** (자연어 명령어 타이핑 X)
- 옵션 = 2~3개 (4개 X), 명확 + 짧음
- "다음 명령어 입력하세요" 류 자연어 안내 **금지**
- CEO 가 90% 결정, 사용자에게는 yes/no 또는 단순 분기만
- SKILL.md 의 기존 "AskUserQuestion 강제" 규칙 그대로 유지

### 6. **sub-agent 가 phase 폴더에 직접 박제 (_tmp 폐기)** — v2.1 추가

기존 v0.57 _tmp 모델 (sub-agent → _tmp scratchpad → C-Level 큐레이션 → topic + main.md) 폐기.

**새 모델**:
- sub-agent → `docs/{feature}/{phase}/{artifact}.md` 직접 작성 (frontmatter 표준 + 본문 그대로)
- C-Level → main.md (인덱스 + Decision Record + artifact 표) 만 작성 — 본문 재작성 X
- _tmp 폴더 자체 없음
- 큐레이션 (채택/거절/병합) 폐기 — sub-agent artifact = 산출물 그대로

**왜 _tmp 폐기 가능?** v0.57 도입 이유 3가지가 새 모델에서 자동 해결:

| 옛 _tmp 도입 이유 | 새 모델에서 |
|----------------|-------------|
| 병렬 sub-agent 가 main.md race condition | sub-agent 가 자기 artifact 만 씀, main.md 는 C-Level 단독 |
| 큐레이션 추적성 | artifact 자체가 박제, frontmatter `agent` 로 추적 |
| main.md 비대화 | main.md = 인덱스만, 본문은 artifact 파일에 |

**효과**:
- 정보 손실 0 (압축 단계 X)
- 토큰 약 50% 절감 (sub-agent 가 한 번 쓰면 끝, C-Level 이 frontmatter `summary` 만 참조)
- 추적성 동일 (frontmatter `owner/agent/source`)

---

## 폴더 구조 (예: 결제 피처)

```
docs/payment-flow/
├── 00-ideation/
│   └── main.md                # CEO 결정 박제 + 사용자 합의
│
├── 01-plan/
│   ├── main.md                # phase 인덱스 + Decision Record
│   ├── prd.md                 # owner: cpo, agent: prd-writer, source: Cagan Inspired
│   ├── persona.md             # owner: cpo, agent: ux-researcher, source: Cooper About Face
│   ├── jtbd.md                # owner: cpo, agent: product-researcher, source: Christensen
│   ├── tam-sam-som.md         # owner: cpo, agent: product-researcher, source: Steve Blank
│   ├── pest-analysis.md       # owner: cbo, agent: market-researcher, source: Aguilar
│   ├── five-forces.md         # owner: cbo, agent: market-researcher, source: Porter
│   ├── swot.md                # owner: cbo, agent: market-researcher, source: Humphrey
│   └── threat-model.md        # owner: cso, agent: security-auditor, source: STRIDE
│
├── 02-design/
│   ├── main.md
│   ├── architecture.md        # owner: cto, agent: infra-architect
│   ├── data-model.md          # owner: cto, agent: db-architect
│   ├── api-contract.md        # owner: cto, agent: backend-engineer
│   ├── ui-flow.md             # owner: cto, agent: ui-designer
│   ├── value-proposition-canvas.md  # owner: cpo, source: Osterwalder
│   ├── lean-canvas.md         # owner: cpo, source: Maurya
│   ├── pricing-strategy.md    # owner: cbo, source: Nagle
│   └── financial-model.md     # owner: cbo, source: Damodaran
│
├── 03-do/
│   ├── main.md                # 구현 로그 + 변경 파일
│   ├── backlog.md             # owner: cpo, agent: backlog-manager
│   ├── secret-scan.md         # owner: cso, agent: secret-scanner
│   ├── dependency.md          # owner: cso, agent: dependency-analyzer
│   ├── ci-cd-pipeline.md      # owner: coo, agent: ci-cd-configurator
│   └── monitoring-config.md   # owner: coo, agent: sre-engineer
│
├── 04-qa/
│   ├── main.md                # gap-analysis + matchRate
│   ├── security-audit.md      # owner: cso, source: OWASP Top 10
│   ├── compliance-report.md   # owner: cso, source: PCI-DSS / GDPR
│   ├── unit-economics.md      # owner: cbo, source: David Skok
│   └── canary-monitoring.md   # owner: coo, agent: release-monitor
│
└── 05-report/
    └── main.md                # 종합 완료 보고서 (모든 artifact 링크)
```

---

## Phase ↔ Artifact 자연 매핑 (CEO 기본 알고리즘)

| Phase | 의미 | 자연 artifact (CEO 가 피처 성격에 맞게 가변 선택) |
|-------|------|------------------------------------------------|
| **00-ideation** | 아이디어 합의 | CEO 결정 (phase/artifact/C-Level 매핑), pr-faq, vision |
| **01-plan** | 요구사항·분석 | prd, persona, jtbd, opportunity-solution-tree, market-research, tam-sam-som, customer-journey, competitor-analysis, pest, five-forces, swot, threat-model |
| **02-design** | 설계 | architecture, data-model, api-contract, ui-flow, value-proposition-canvas, lean-canvas, product-strategy-canvas, pricing-strategy, financial-model, dcf, gtm, growth-loop, deployment-architecture, monitoring-design |
| **03-do** | 구현 | implementation log, backlog, sprint-plan, secret-scan, dependency-vulnerability, ci-cd-pipeline, dockerfile, monitoring-config, alert-rules, marketing-copy, seo-audit, content-calendar |
| **04-qa** | 검증 | gap-analysis, security-audit (OWASP), compliance-report (GDPR/PCI), code-review, unit-economics, marketing-analytics, performance-baseline, canary-monitoring, post-deploy-health |
| **05-report** | 종합 보고 | 완료 보고서, changelog-entry, release-notes |

> 위 매핑은 default. CEO 가 피처 성격 보고 일부 생략/추가. **근거 1줄 명시 필수**.

---

## CEO 의 빈틈없는 판단 알고리즘 (ideation 단계, v2.3)

vais-code 정체성 = **코드 개발 도우미**. 4 C-Suite (CEO+CPO+CTO+CSO) 가 기본. CBO/COO 는 선택 활성 (사용자 명시 시만).

CEO 가 사용자 요청 받으면 7 차원 체크 (코드 개발 직결):

```
체크리스트 (7 차원, 코드 개발 컨텍스트):
  1. 보안 영향?       (none/low/medium/high) → CSO 필요?
  2. 컴플라이언스?    (PCI/GDPR/SOC2/HIPAA 해당?) → compliance-auditor 필요?
  3. UX 복잡도?       → ui-designer / ux-researcher / persona 필요?
  4. 데이터 모델?     → db-architect 필요?
  5. 외부 API/통신?   → security-auditor / dependency-analyzer 필요?
  6. 성능 민감도?     → performance-engineer 필요?
  7. 제품 정의 깊이?  → CPO sub-agent 깊이 (간단 PRD vs 풀 OST/JTBD/TAM-SAM-SOM)

각 차원에 대해:
  - "필요" → 해당 phase 에 artifact 추가
  - "불필요" → 명시적 생략 + 근거 1줄
```

### CBO/COO 비활성 정책 (v2.3)

**기본 = 비활성**. 다음 경우만 사용자가 명시 활성:

| C-Level | 명시 활성 시나리오 |
|---------|------------------|
| **CBO** | SaaS 출시 / GTM 캠페인 / 가격 정책 / unit economics / SEO 감사 |
| **COO** | CI/CD 신규 구축 / 모니터링 시스템 / SRE / 배포 자동화 |

호출 방법: `/vais cbo ...` / `/vais coo ...` 직접. CEO 자동 라우팅에서는 빠짐.

→ 이유: 코드 개발 95% 피처에서 무관 → 매번 "마케팅 무관, 생략" 판단이 노이즈. 4 C-Suite 정체성 명확화.

### 자료 보존

`agents/cbo/` (10 sub-agent) + `agents/coo/` (8 sub-agent) + 외부 거장 자료 (PEST / Five Forces / SWOT / GDPR / CI/CD / SRE 등) 전부 **그대로 유지**. 단지 CEO 자동 라우팅에서 빠질 뿐.

---

## main.md 의 역할 (각 phase 인덱스)

```markdown
# {feature} — Plan (phase 인덱스)

## Executive Summary
- Problem / Solution / Effect / Core Value

## Decision Record (multi-owner)
| # | Decision | Owner | Source artifact |
|---|----------|:-----:|----------------|
| 1 | 결제는 OAuth 2.0 + Tokenization | cso | threat-model.md |
| 2 | persona = 30대 직장인 카드 사용자 | cpo | persona.md |

## Artifacts (이 phase 박제 자료)
| Artifact | Owner | Source 거장 | 파일 |
|----------|:-----:|:----------:|------|
| PRD | cpo | Cagan | prd.md |
| Persona | cpo | Cooper | persona.md |
| JTBD | cpo | Christensen | jtbd.md |
| Threat Model | cso | STRIDE | threat-model.md |

## CEO 판단 근거 (왜 이 artifact 들이 이 phase 에)
- 결제는 보안 ⭐⭐⭐ → threat-model 필수
- 결제는 UX ⭐⭐ → persona / jtbd 필수
- 마케팅 ⭐ → 본 phase 생략 (출시 후 별도 피처)

## Next Phase
→ design (CTO 진입, 다음 main.md 작성)
```

---

## 사용자 인터페이스 (재정의)

### 시나리오 — 결제 피처

```
사용자: "/vais ceo 결제 기능 만들고 싶어"
   ↓
CEO (5~10초 내):
  체크리스트 10 차원 적용 → 빈틈없는 분석
  결정 박제 (00-ideation/main.md)
   ↓
CEO 사용자에게 1단락 안내:
  "결제 피처 분석:
   - 보안 ⭐⭐⭐ (PCI-DSS 해당)
   - UX ⭐⭐ (결제 흐름 사용성)
   - 비용 ⭐⭐ (결제 수수료)
   - 마케팅 ⭐ (본 피처 무관 — 별도 피처로 분리)

   진행 계획 (각 phase 의 artifact + C-Level 위임):
   - plan: prd, persona, jtbd, threat-model, pest (CPO+CSO+CBO)
   - design: architecture, data-model, api, ui-flow, vpc, pricing (CTO+CPO+CBO)
   - do: impl, secret-scan, dependency, ci-cd, monitoring (CTO+CSO+COO)
   - qa: gap-analysis, security-audit (OWASP+PCI), unit-economics, canary
   - report: 종합

   진행할까요?"
   ↓
사용자: "응"
   ↓
CEO 가 plan → design → do → qa → report 자동 진행
사용자는 각 phase 의 main.md 만 검토 (디테일은 필요시 grep)
```

→ **사용자 결정 부담 = ideation 시작점 1번 + 각 phase 완료 후 검토만**.

---

## 4 가드의 운명 (`agents/_shared/`) — v2.4

| 가드 | 변경 정도 | 처리 |
|------|---------|------|
| `advisor-guard.md` | 무변경 | sub-agent 직접 박제 시에도 advisor 검토 가치 동일 |
| `clevel-main-guard.md` | 50% 단순화 | main.md = 인덱스만 → size budget 무관. Decision Record + owner frontmatter + append-only 유지. Topic = Artifacts 표로 개념 변경 |
| `subdoc-guard.md` | 100% 재작성 | `_tmp` 폐기 + 큐레이션 폐기. sub-agent 가 `docs/{feature}/{phase}/{artifact}.md` 직접 박제. frontmatter 표준 (owner/agent/artifact/phase/source/summary) |
| `ideation-guard.md` | 30% 갱신 | CEO 의 7 차원 체크리스트 + AskUserQuestion 클릭 + CBO/COO 자동 라우팅 제외 |

### `subdoc-guard.md` 핵심 변경 (sub-agent 박제 규약)

```yaml
---
owner: cpo                      # 어느 C-Level
agent: prd-writer               # 어느 sub-agent
artifact: prd                   # 무슨 artifact
phase: plan                     # 어느 phase
feature: payment-flow
source: "Cagan 'Inspired' (2017)"
generated: 2026-05-02
summary: "결제 흐름 요구사항 — OAuth 2.0 + PCI-DSS Tokenization 채택"
---

# {본문 그대로 — 압축 X, 큐레이션 X}
```

규약:
- sub-agent 가 `docs/{feature}/{phase}/{artifact}.md` 직접 Write
- 복수 artifact = N 파일 (예: market-researcher → pest.md / five-forces.md / swot.md)
- main.md 직접 Write 금지 (C-Level 단독)
- `_tmp` 폴더 사용 금지 (폐기)

---

## 강제 규칙은 어디로? (CEO 알고리즘 흡수)

지금 CLAUDE.md / vais.config.json / scripts/doc-validator.js 의 14 Mandatory Rules + scopeContractPolicy + cLevelCoexistencePolicy 등:

| 강제 규칙 | v2.0 처리 |
|----------|---------|
| Rule #2 mandatory phase 스킵 금지 | CEO 알고리즘이 매번 적용. 사용자에게 안 보임 |
| Rule #3 산출물 경로 | CEO 가 자동 박제 위치 결정 (default 매핑 따름) |
| Rule #9 Lake 사용자 지정 | CEO 가 ideation 에서 빈틈없이 분석 — 사용자 명시 X (안내만) |
| Rule #14 Sub-doc 보존 | CEO 가 자동 적용 (사용자 안 봄) |
| Rule #15 C-Level 공존 | 폐기 또는 단순화 (각 artifact = 별도 파일이라 main.md 충돌 자체 없음) |
| scopeContractPolicy | CEO ideation 결과로 자동 충족 |
| cLevelCoexistencePolicy | 새 폴더 구조에서 자연 충족 (artifact 분리) |
| topicPresets | CEO 의 phase↔artifact 매핑이 대체 |

→ 사용자에게 보이는 건 결과 + 근거. 강제 흔적 X.

---

## Lake (Medium 범위)

| # | 항목 | 산출물 |
|---|------|--------|
| 1 | CEO 알고리즘 강화 — 10 차원 체크리스트 + phase↔artifact 매핑 | `agents/ceo/ceo.md` 본문 갱신 |
| 2 | phase 폴더 + artifact MD 구조 정착 | `vais.config.json > workflow.docPaths` 갱신 |
| 3 | 각 phase main.md = 인덱스 (Decision Record + Artifacts 표 + Next Phase) | `templates/{phase}.template.md` 갱신 |
| 4 | sub-agent 가 자기 artifact 를 phase 폴더에 **직접** 박제 (_tmp 우회). frontmatter 표준 (owner/agent/artifact/phase/source/summary). | `agents/_shared/subdoc-guard.md` 전면 갱신 — _tmp 모델 폐기, 직접 박제 모델로 |
| 5 | 사용자 인터페이스 단순화 — CEO 한 번 호출 → 자동 PDCA | `skills/vais/phases/ceo.md` 갱신 |
| 6 | 강제 규칙 흡수 — 사용자에게 안 보이게 | CLAUDE.md Rule 갱신 (validator 는 critical 만) |
| 7 | 외부 거장 자료 frontmatter 표준화 (`source` 필드) | sub-agent md 갱신 — owner/agent/artifact/phase/source |

### Out-of-scope

- 37 sub-agent 자체 책임 (그대로)
- 거장 framework 흡수 자료 (그대로)
- CTO PDCA (그대로 — 코드 영역은 phase 분리 의미 그대로)

---

## 위험 + 완화

| 위험 | 완화 |
|------|------|
| CEO 알고리즘이 너무 보수적 → 모든 차원 다 적용 → 부피 폭발 | 차원별 ⭐ 등급 (low 는 자동 생략). 사용자 override 가능 |
| 사용자 override 시 다음 피처에 같은 패턴 안 반영 | `.vais/memory.json` 에 사용자 선호 박제 (예: "CBO marketing 항상 생략") |
| CEO 판단 근거 불명확 | main.md 에 "왜 이 artifact" 근거 1줄 필수 |
| sub-agent 가 phase 폴더에 박제 시 race condition | 각 sub-agent = 자기 파일만, main.md 는 C-Level 이 단독 작성 |
| 외부 framework 자료가 phase 분류 모호 (예: roadmap = plan? design?) | CEO 알고리즘에 default 매핑 명시 (roadmap = plan), 일관 적용 |

---

## 다음 단계 (CEO 추천)

| 항목 | 결정 |
|------|------|
| 시나리오 | 메타 — vais-code 자체 변경 |
| 다음 C-Level | **CTO plan** — 7 Lake 항목을 구체 spec 으로 정제 |
| 그 다음 | CTO design → do → qa → report |
| CSO/CBO/COO | 본 피처는 메타 변경, 보안/비용/운영 영향 없음 → 생략 |

---

## Decision Record (v2.0 핵심)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | PDCA 폴더 구조 유지 | 사용자 익숙, 일관성 |
| 2 | phase 폴더에 artifact 별 MD | 외부 거장 자료 분리 (사용자 비판 반영) |
| 3 | 각 phase main.md = 인덱스 | grep 쉬움, 한눈 파악 |
| 4 | CEO 가 ideation 에서 빈틈없이 결정 | 사용자 비전문가, 결정 부담 0 |
| 5 | 사용자는 결과만 (각 phase main.md 검토) | 디테일 결정 X, override 만 |
| 6 | 강제 규칙 → CEO 알고리즘 안에 흡수 | 사용자 안 보임, 일관성 유지 |
| 7 | CTO PDCA 그대로 | 코드 영역은 phase 분리 의미 있음 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | CEO ideation 초안 — 비-CTO 단일 do (절차 단순화) |
| v1.1 | 2026-05-02 | 외부 자료 분리 (1 artifact = 1 MD) |
| **v2.0** | **2026-05-02** | **사용자 본질 통찰 반영. "절차 단순화" → "CEO 판단력 강화" 로 의도 정정. PDCA 골격 유지 + phase 폴더 안 artifact MD + main.md 인덱스 + CEO 빈틈없는 판단 알고리즘 + 사용자 결정 부담 0. Lake 7 항목, Decision 7 건. v1.x 의 "강제/자율 이분법" 폐기.** |
| **v2.1** | **2026-05-02** | **사용자 효율 통찰 반영 — `_tmp` 압축 모델 폐기. sub-agent 가 phase 폴더에 직접 artifact MD 작성, C-Level 은 main.md 인덱스만. 정보 손실 0 + 토큰 약 50% 절감. v0.57 의 _tmp 모델 도입 이유(race/추적/비대화) 가 새 모델에서 자동 해결. 큐레이션 (채택/거절/병합) 도 폐기. Lake #4 갱신, 새 모델 6 추가, Decision 8 신설. frontmatter 표준에 `summary` 필드 추가 (C-Level 인덱싱용).** |
| **v2.2** | **2026-05-02** | **사용자 UX 통찰 반영 — AskUserQuestion 클릭 인터페이스 우선. 자연어 명령어 안내 ("___ 입력하세요") 금지. CEO 가 90% 결정 + 사용자는 클릭 1번. SKILL.md 의 기존 "AskUserQuestion 강제" 규칙 재확인. v2.1 까지 자연어 안내로 빠진 부분 정정. 새 모델 5 갱신. 옵션 개수 2~3 권장 (4 X).** |
| **v2.3** | **2026-05-02** | **사용자 정체성 통찰 반영 — vais-code = "코드 개발 도우미". 4 C-Suite (CEO+CPO+CTO+CSO) 가 기본. CBO/COO 는 비활성 (선택 활성). 자료는 보존 — 단지 CEO 자동 라우팅에서 빠짐. CEO 알고리즘 10 차원 → 7 차원.** |
| **v2.4** | **2026-05-02** | **4 가드 (`agents/_shared/{advisor,clevel-main,subdoc,ideation}-guard.md`) 운명 명시. advisor 무변경, clevel-main 50% 단순화 (main.md = 인덱스만 → size budget 무관), subdoc 100% 재작성 (`_tmp` + 큐레이션 폐기, sub-agent 직접 박제), ideation 30% 갱신 (7 차원 + AskUserQuestion + CBO/COO 제외). subdoc-guard 새 규약 명시.** |
