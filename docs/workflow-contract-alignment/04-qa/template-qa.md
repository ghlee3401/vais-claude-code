---
owner: cto
artifact: template-qa
phase: qa
feature: workflow-contract-alignment
generated: 2026-05-13
source: "terminal verification after template alignment"
summary: "template legacy scan, template validator, plugin validator, tests, lint, doc-validator 로 5단계 template 정렬을 검증."
---

# Template QA

## 1. Verification Summary

| Check | Command | Result |
|-------|---------|--------|
| template legacy scan | `rg legacy template patterns templates scripts/auto-select-template.js scripts/template-validator.js` | PASS — no matches |
| template schema/depth validation | `node scripts/template-validator.js templates --depth-check` | PASS — 38/38 |
| auto selector smoke test | `node scripts/auto-select-template.js --feature=workflow-contract-alignment --json` | PASS — no crash, current PRD missing state detected |
| plugin validation | `node scripts/vais-validate-plugin.js .` | PASS |
| test suite | `npm test` | PASS — 290 tests, 287 pass, 3 skipped |
| lint | `npm run lint` | PASS |
| doc validation | `node scripts/doc-validator.js cto workflow-contract-alignment` | PASS with expected drift — W-SCOPE 3 + W-MRG-03 2 |

## 2. Acceptance Criteria

| AC | Status |
|----|--------|
| Plan templates use `01-plan/prd.md` for PRD input | PASS |
| Workflow body templates no longer imply that full body belongs in `main.md` | PASS |
| Template samples no longer contain `_tmp`, retired `release-engineer`, or `03-do/main.md` body target | PASS |
| Auto selector reads the current PRD artifact path first | PASS |
| Init utility generates body artifacts plus phase index | PASS |

## 3. Residual Risk

Runtime compatibility paths for old docs are still present in validator/status/auto-judge code and tests. They are compatibility behavior, not template generation guidance.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | template QA 초안 작성 |
