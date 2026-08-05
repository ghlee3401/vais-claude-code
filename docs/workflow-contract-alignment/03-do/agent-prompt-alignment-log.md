---
owner: cto
artifact: agent-prompt-alignment-log
phase: do
feature: workflow-contract-alignment
generated: 2026-05-13
source: "docs/workflow-contract-alignment/01-plan/workflow-contract-matrix.md"
summary: "C-Level/대표 sub-agent prompt 의 artifact path 를 v2.2 계약에 맞춰 정렬. PRD 01-plan/prd.md, CTO artifact paths, COO split agents, CEO author direct artifacts 반영."
---

# Agent Prompt Alignment Log

## 1. 변경 범위

| Area | Files |
|------|-------|
| C-Level prompt | `agents/ceo/ceo.md`, `agents/cpo/cpo.md`, `agents/cto/cto.md`, `agents/cso/cso.md`, `agents/coo/coo.md` |
| CPO sub-agent | `agents/cpo/prd-writer.md`, `agents/cpo/roadmap-author.md` |
| CEO author sub-agents | `agents/ceo/vision-author.md`, `okr-author.md`, `pr-faq-author.md`, `strategy-kernel-author.md` |
| COO sub-agents | `agents/coo/ci-cd-configurator.md`, `container-config-author.md`, `migration-planner.md`, `release-notes-writer.md`, `runbook-author.md`, `sre-engineer.md` |

## 2. 주요 수정

| Contract | Before | After |
|----------|--------|-------|
| PRD path | `docs/{feature}/03-do/main.md` | `docs/{feature}/01-plan/prd.md` |
| CTO plan output | `01-plan/main.md` body | `01-plan/tech-plan.md` artifact |
| CTO do output | `03-do/main.md` body | `03-do/implementation-log.md` artifact |
| CTO qa output | `04-qa/main.md` body | `04-qa/gap-analysis.md` artifact |
| CPO output contract | PRD as do phase main body | PRD as plan artifact + strategy/backlog artifacts |
| CSO output contract | security results in `03-do/main.md` / `04-qa/main.md` | threat-model / scan artifacts / security-audit artifact |
| CEO routing output | plan/do/check main bodies | `00-ideation/ideation-decision.md` + strategy/QA artifacts |
| CEO author sub-agents | `_tmp/*` scratchpad + CEO curation wait | `docs/{feature}/{NN-phase}/{artifact}.md` direct artifact + handoff |
| COO orchestration | retired `release-engineer` | split agents: `ci-cd-configurator`, `container-config-author`, `migration-planner`, `runbook-author`, `release-notes-writer`, `sre-engineer`, `release-monitor`, `performance-engineer` |

## 3. Residual Scope

The stage intentionally left `agents/*/knowledge/*.md` for Stage 6. Remaining legacy matches are knowledge-reference drift, not active agent prompt instructions.

Known Stage 6 targets:

- `agents/cpo/knowledge/prd-eight-sections.md`
- `agents/cto/knowledge/handoff-routing.md`
- `agents/cto/knowledge/modification-chaining.md`
- `agents/coo/knowledge/cicd-four-stages.md`
- `agents/coo/knowledge/deployment-strategies.md`
- `agents/ceo/knowledge/absorb-rubric.md`

## 4. Verification

| Check | Result |
|-------|--------|
| non-knowledge agent prompt legacy scan | PASS — no `03-do/main.md`, `release-engineer`, `_tmp` scratchpad, `frontmatter 8` matches |
| C-Level main body path scan | PASS — no `docs/{feature}/NN-phase/main.md` body target in C-Level prompts |
| guard patch dry-run | PASS — C-Level 6 and sub-agent 45 same-version skips |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | agent prompt alignment 구현 로그 작성 |
