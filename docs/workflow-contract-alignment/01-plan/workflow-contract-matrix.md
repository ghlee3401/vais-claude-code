---
owner: cto
artifact: workflow-contract-matrix
phase: plan
feature: workflow-contract-alignment
generated: 2026-05-12
source: "vais.config.json + agents/_shared/*guard.md + content-flow audit"
summary: "VAIS Code v2.0/v2.1 흐름 계약 매트릭스. phase, owner, activation, artifact, path, validator 기준과 legacy cleanup 대상을 정의."
---

# Workflow Contract Matrix

## 1. 목적

이 문서는 VAIS Code 의 실행 흐름을 정렬하기 위한 **계약 기준표**다. 여기서 말하는 계약은 다음 질문에 대한 단일 답이다.

- 어떤 요청이 어떤 C-Level 을 활성화하는가?
- 각 phase 에서 누가 mandatory 인가?
- C-Level 은 무엇을 직접 쓰고 무엇을 sub-agent 에 위임하는가?
- artifact 는 어느 경로에 저장되는가?
- 어떤 validator 가 무엇을 확인해야 하는가?

이번 문서는 active prompt 를 직접 고치지 않는다. 2단계 이후 shared guard, phase router, agent prompt, template 을 고칠 때 이 문서를 기준으로 판정한다.

## 2. 정본 원칙

| 항목 | 정본 계약 |
|------|-----------|
| C-Level activation | CEO/CPO/CTO/CSO 는 primary. CBO/COO 는 secondary |
| CEO | 사용자 요청 진입, 7 차원 알고리즘 실행, active C-Level/artifactPlan 산출, ideation 기록 |
| CTO | 기술 실행 책임자. plan → design → do → qa → report 순차 흐름 mandatory |
| CPO/CSO | CEO 알고리즘이 활성화한 phase/artifact 만 실행. 자체 mandatory phase 없음 |
| CBO/COO | 사용자 명시 호출 시에만 실행. 자체 mandatory phase 없음 |
| Direct sub-agent call | 금지. C-Level 이 필요 시 위임 |
| `main.md` | C-Level index-only. Executive Summary, Decision Record, Artifacts, CEO 판단 근거, Next Phase |
| Artifact doc | sub-agent 또는 C-Level direct artifact 가 `docs/{feature}/{NN-phase}/{artifact}.md` 에 작성 |
| Frontmatter | 신규 artifact 필수 4 필드: `owner`, `artifact`, `phase`, `feature` |
| Knowledge | `agents/{owner}/knowledge/*.md` 를 phase + artifact 매칭 시 lazy-load |
| Legacy model | `_tmp`, curation record, 8-field mandatory frontmatter, `main.md` 본문 박제는 폐기 |

## 3. Phase Folder Contract

| Phase | Folder | Main index | Phase role | Mandatory owner | Allowed owners |
|-------|--------|------------|------------|-----------------|----------------|
| ideation | `00-ideation` | `docs/{feature}/00-ideation/main.md` | 요청 해석, 전략 판단, routing 근거 기록 | CEO only for `/vais ceo` entry | CEO, explicit secondary if user asks |
| plan | `01-plan` | `docs/{feature}/01-plan/main.md` | 요구사항, scope, risk, 실행 계획 | CTO | CTO, CEO-activated CPO/CSO, explicit CBO/COO |
| design | `02-design` | `docs/{feature}/02-design/main.md` | architecture, data, API, UI, security design | CTO | CTO, CEO-activated CPO/CSO, explicit CBO/COO |
| do | `03-do` | `docs/{feature}/03-do/main.md` | implementation, code changes, scans, logs | CTO | CTO, CEO-activated CSO, explicit CBO/COO |
| qa | `04-qa` | `docs/{feature}/04-qa/main.md` | gap analysis, tests, audit, compliance verification | CTO | CTO, CEO-activated CSO, explicit CBO/COO |
| report | `05-report` | `docs/{feature}/05-report/main.md` | final completion report and handoff | CTO | CTO, explicit C-Level summaries if needed |

Drift note: `vais.config.json.workflow.mandatoryPhases` currently lists `plan/design/do/qa` but not `report`. v2.0 policy says CTO has 5-phase PDCA including report. Follow-up should either add `report` to config mandatory semantics or document it as required terminal phase outside `mandatoryPhases`.

## 4. Primary Role Contract

| Role | Activation | Mandatory behavior | Delegation scope | Writes |
|------|------------|--------------------|------------------|--------|
| CEO | `/vais ceo {feature}` or top-level routing entry | ideation + `analyzeCEO(request)` 7-dimension output + AskUserQuestion | CEO sub-agents for vision, strategy, OKR, PRFAQ, absorb, skill creation | `00-ideation/main.md`, `ideation-decision.md`, CEO strategy artifacts |
| CTO | `/vais cto plan|design|do|qa|report {feature}` or CEO activates technical execution | Only role with mandatory ordered PDCA | infra, backend, frontend, UI, DB, QA, test, incident | phase `main.md` index + CTO artifacts |
| CPO | CEO algorithm activates product artifacts | No independent mandatory phase | product discovery, PRD, roadmap, UX, backlog, metrics | activated product artifacts only |
| CSO | CEO algorithm activates security/compliance artifacts | No independent mandatory phase | audit, secret scan, dependency, plugin/skill validation, compliance | activated security artifacts only |

## 5. Secondary Role Contract

| Role | Activation | Allowed phases | Delegation scope | Writes |
|------|------------|----------------|------------------|--------|
| CBO | Explicit `/vais cbo plan|do|qa {feature}` or user asks business/GTM/pricing | plan, do, qa | market, customer, SEO, copy, growth, pricing, finance, unit economics, FinOps, marketing analytics | business artifacts in the selected phase |
| COO | Explicit `/vais coo plan|do|qa {feature}` or user asks ops/deploy/monitoring | plan, do, qa | CI/CD, container, migration, runbook, release notes, SRE, release monitor, performance | operations artifacts in the selected phase |

Secondary roles must not be auto-activated by CEO primary routing unless the user explicitly asks for them.

## 6. Artifact Mapping Contract

Baseline is `vais.config.json.workflow.phaseArtifactMapping`.

| Phase | Always artifacts | Conditional artifacts |
|-------|------------------|-----------------------|
| `00-ideation` | `ideation-decision` by CEO | none |
| `01-plan` | target gap: CTO plan artifact should be explicit | CPO `prd`, `persona`, `jtbd`, `tam-sam-som`, `opportunity-solution-tree`; CSO `threat-model` |
| `02-design` | CTO `architecture` | CTO `data-model`, `api-contract`, `ui-flow`; CPO `value-proposition-canvas`, `lean-canvas`, `product-strategy-canvas` |
| `03-do` | CTO `implementation-log` | CSO `secret-scan`, `dependency-vulnerability` |
| `04-qa` | CTO `gap-analysis` | CSO `security-audit`, `compliance-report` |
| `05-report` | CTO `completion-report` | explicit C-Level summaries only when needed |

Decision: `01-plan` needs an explicit CTO plan artifact in the active contract, such as `tech-plan` or `implementation-plan`. Existing docs already use `tech-plan.md`; follow-up should either add this to `phaseArtifactMapping` or document CTO direct plan artifact as a separate rule.

## 7. Path Contract

| Document type | Path |
|---------------|------|
| C-Level phase index | `docs/{feature}/{NN-phase}/main.md` |
| Sub-agent artifact | `docs/{feature}/{NN-phase}/{artifact}.md` |
| C-Level direct artifact | `docs/{feature}/{NN-phase}/{artifact}.md` |
| Knowledge reference | `agents/{owner}/knowledge/{file}.md` |
| Template source | `templates/{phase-or-domain}.template.md` or `templates/{category}/{artifact}.md` |

Forbidden active paths:

- `docs/{feature}/{NN-phase}/_tmp/{slug}.md`
- `docs/{feature}/{phase}/_tmp/{slug}.md`
- `docs/{feature}/03-do/main.md` as a PRD/design/QA body target

## 8. Write Responsibility Contract

| Writer | May write | Must not write |
|--------|-----------|----------------|
| C-Level main agent | Its phase `main.md` index, its own direct artifact when no sub-agent exists | Other C-Level rows/sections, sub-agent artifact body rewrite |
| Sub-agent | Its assigned artifact file only | `main.md`, other sub-agent artifacts, unrelated phase files |
| Validator/hook | Warnings, logs, enforcement result | Silent mutation of user artifacts |
| Human/user | Any approved change | N/A |

`main.md` must remain an index. It can summarize artifact rows, decisions, and next phase, but it must not absorb the body of PRD, architecture, QA, security audit, financial model, or runbook artifacts.

## 9. Validator Contract

| Validator/check | Target contract |
|-----------------|-----------------|
| `scripts/vais-validate-plugin.js .` | plugin manifest, agents, skills, hooks, package integrity |
| `scripts/doc-validator.js {owner} {feature}` | frontmatter 4 fields, owner/artifact/phase/feature consistency, main index coexistence warnings |
| legacy `rg` scan | `_tmp`, `release-engineer`, `03-do/main.md`, `frontmatter 8`, `/vais auto`, `/vais plan`, CPO/CSO mandatory drift |
| test suite | code behavior affected by routing/validator changes |
| lint | JS/style regressions |

Target enforcement remains warn for doc coexistence unless config explicitly changes to retry/fail.

## 10. Known Drift To Fix After This Stage

| Area | Drift | Follow-up stage |
|------|-------|-----------------|
| Shared guard examples | `owner: cto`, `artifact: prd` fixed examples are copied into non-CTO agents | Stage 2 |
| Subdoc handoff example | Uses `docs/{feature}/{phase}/{name}.md` instead of `NN-phase` form | Stage 2 |
| CPO/CSO routers | Say CEO-activated only, then repeat mandatory phase skip prohibition | Stage 3 |
| Templates | Some say `main.md` index-only but contain full body templates | Stage 5 |
| Legacy paths | `_tmp`, `03-do/main.md` body target remains in templates/agents/config comments | Stage 4/5 |
| Retired agent | `release-engineer` remains in COO docs/templates | Stage 4/5 |
| Frontmatter docs | Some docs still mention 8 mandatory fields | Stage 2/5 |
| CTO plan artifact | `phaseArtifactMapping.01-plan` lacks explicit CTO plan artifact | Stage 2 or config follow-up |
| Report mandatory semantics | v2.0 says CTO 5-phase flow, config `mandatoryPhases` omits `report` | Stage 2 or config follow-up |

## 11. Stage 1 Acceptance Criteria

This stage is complete when:

- A plan index exists at `docs/workflow-contract-alignment/01-plan/main.md`.
- This matrix exists at `docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md`.
- The matrix defines activation, phase, artifact, path, write responsibility, validator, and known drift.
- No active agent/skill/template behavior is changed in this stage.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | 초기 작성 — phase/owner/artifact/path/validator 계약 매트릭스 확정 |
