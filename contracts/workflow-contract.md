# VAIS Workflow Runtime Contract

> Contract version: 1.0
> Runtime baseline: VAIS Code 1.3.x

## Purpose

This is the canonical contract for the workflow currently enforced by VAIS Code.
Configuration and executable validators remain authoritative when this document and
runtime behavior disagree.

The adaptive workflow described under `docs/adaptive-workflow-kernel/` is a target
design. It does not replace this runtime contract until its shadow-mode acceptance
criteria pass and the migration is explicitly enabled.

## Activation And Ownership

| Role | Activation | Mandatory behavior |
|---|---|---|
| CEO | `/vais ceo {feature}` | Run the seven-dimension algorithm, record ideation, and present the routing decision |
| CTO | Explicit CTO call or technical routing | Execute ordered plan, design, do, qa, and report workflow |
| CPO/CSO | Only phases selected by the CEO algorithm | Produce only activated product or security artifacts |
| CBO/COO | Explicit user request | Produce only the requested business or operations artifacts |

Execution agents are not user entry points. A C-Level owner delegates to them and
remains responsible for the phase result.

## Phase And Path Contract

| Phase | Folder | Responsibility |
|---|---|---|
| ideation | `00-ideation` | Request interpretation and routing evidence |
| plan | `01-plan` | Scope, requirements, risks, and implementation plan |
| design | `02-design` | Architecture, data, API, UI, and security design |
| do | `03-do` | Implementation and execution evidence |
| qa | `04-qa` | Tests, gap analysis, audit, and compliance checks |
| report | `05-report` | Completion evidence and handoff |

- Phase index: `docs/{feature}/{NN-phase}/main.md`
- Artifact: `docs/{feature}/{NN-phase}/{artifact}.md`
- Knowledge: `agents/{owner}/knowledge/{file}.md`
- `_tmp/` artifact paths are forbidden.

## Artifact Contract

Every artifact requires these frontmatter fields:

```yaml
owner: cto
artifact: architecture
phase: design
feature: example-feature
```

`agent`, `generated`, `source`, and `summary` are optional metadata. The artifact
filename must equal its `artifact` value.

Write ownership is exclusive:

- A C-Level agent writes its phase index and its own direct artifacts.
- A delegated execution agent writes only its assigned artifact.
- A validator or hook emits evidence and warnings; it does not silently rewrite an artifact.
- Decision records are append-only and include an Owner column.

## Main Document Modes

The default `main.md` is a five-section index:

1. Executive Summary
2. Decision Record
3. Artifacts
4. CEO 판단 근거
5. Next Phase

When Agent Teams v2 is explicitly enabled, the synthesizer owns the synthesis
document and its separate `decisions-log.md`. The additional contract is defined in
`contracts/agent-teams.md` and `agents/_shared/clevel-main-guard.full.md`.

## Validation Contract

| Check | Responsibility |
|---|---|
| `node scripts/vais-validate-plugin.js` | Plugin manifest, agents, skills, hooks, and package integrity |
| `node scripts/doc-validator.js {owner} {feature}` | Artifact frontmatter, ownership, phase paths, and index coexistence |
| `npm test` | Routing, state, orchestration, hook, and regression behavior |
| `npm run lint` | JavaScript style and static errors |

Document coexistence enforcement remains warning-level unless configuration
explicitly promotes it to retry or failure.

## Change Control

Changes to role activation, mandatory phases, artifact paths, ownership, or index
shape must update this file, the matching runtime/configuration, and tests in the
same change. Historical feature documents are evidence, not runtime contracts.
