---
owner: cto
artifact: knowledge-qa
phase: qa
feature: workflow-contract-alignment
generated: 2026-05-13
source: "terminal verification after knowledge alignment"
summary: "knowledge legacy scan, Secondary command scan, plugin validator, tests, lint, doc-validator 로 6단계 knowledge 정렬을 검증."
---

# Knowledge QA

## 1. Verification Summary

| Check | Command | Result |
|-------|---------|--------|
| knowledge legacy scan | `rg legacy knowledge patterns agents/*/knowledge/*.md` | PASS — no matches |
| Secondary phase command scan | `rg '/vais (cbo|coo) {feature}' agents/*/knowledge/*.md` | PASS — no matches |
| plugin validation | `node scripts/vais-validate-plugin.js .` | PASS |
| test suite | `npm test` | PASS — 290 tests, 287 pass, 3 skipped |
| lint | `npm run lint` | PASS |
| doc validation | `node scripts/doc-validator.js cto workflow-contract-alignment` | PASS with expected drift — W-SCOPE 3 + W-MRG-03 2 |

## 2. Acceptance Criteria

| AC | Status |
|----|--------|
| Knowledge docs no longer direct PRD/body output to `03-do/main.md` | PASS |
| Knowledge docs no longer reference retired `release-engineer` | PASS |
| COO/CBO Secondary examples include explicit phase | PASS |
| PRD knowledge points to `01-plan/prd.md` | PASS |
| QA/gate knowledge points to QA artifact rather than body in `main.md` | PASS |

## 3. Residual Risk

Compatibility code still supports old docs and old scratchpad-style records. This is not active knowledge guidance. Stage 7 should decide whether to leave compatibility code as-is or align validator/runtime warning text.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | knowledge QA 초안 작성 |
