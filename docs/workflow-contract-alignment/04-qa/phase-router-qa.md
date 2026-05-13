---
owner: cto
artifact: phase-router-qa
phase: qa
feature: workflow-contract-alignment
generated: 2026-05-12
source: "terminal verification after phase router alignment"
summary: "phase router 정리 후 CTO-only mandatory, dependency key, docs glob, secondary phase restriction 을 검증."
---

# Phase Router QA

## 1. Verification Summary

| Check | Command | Result |
|-------|---------|--------|
| CTO-only mandatory scan | `rg -F "mandatory phase 스킵 금지" skills/vais/phases skills/vais/SKILL.md` | PASS — `cto.md` 에만 남음 |
| obsolete dependency key scan | `rg -F "launchPipeline" skills/vais/phases skills/vais/SKILL.md` | PASS — no matches |
| obsolete docs glob scan | `rg -F "*_{feature}" skills/vais/phases skills/vais/SKILL.md` | PASS — no matches |
| Secondary phase restriction | CBO/COO phase tables inspected | PASS — `plan|do|qa` only |
| Ideation artifact split | `skills/vais/phases/ideation.md` inspected | PASS — `main.md` index + `ideation-decision.md` artifact |
| doc validation | `node scripts/doc-validator.js cto workflow-contract-alignment` | PASS with expected drift — W-SCOPE 3 + W-MRG-03 2 |

## 2. Residual Risk

CPO/CSO still allow explicit `plan|design|do|qa|report` phase arguments. This is intentional for direct user invocation, but phase omission now follows CEO artifactPlan rather than CTO mandatory ordering.

`doc-validator` W-MRG-03 still assumes owner H2 sections for multi-artifact phases. This is validator drift against the current 5-section index contract and should be handled in a later validator alignment stage.

## 3. Acceptance Criteria

| AC | Status |
|----|--------|
| CEO phase omission no longer starts CTO-style plan rail | PASS |
| CTO remains the only mandatory PDCA owner | PASS |
| CPO/CSO phase omission uses CEO artifactPlan | PASS |
| CBO/COO are explicit secondary only | PASS |
| CBO/COO phase tables no longer expose design/report | PASS |
| old `launchPipeline.dependencies` references removed from routers | PASS |

## 4. Recommendation

Proceed to Stage 4 agent prompt cleanup. Focus first on high-impact prompts that still instruct old artifact paths, especially `agents/cpo/prd-writer.md`.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | phase router alignment QA 작성 |
