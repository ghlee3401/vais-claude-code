---
owner: cto
artifact: shared-guard-qa
phase: qa
feature: workflow-contract-alignment
generated: 2026-05-12
source: "terminal verification after shared guard alignment"
summary: "shared guard v2.2 전파 후 stale guard, duplicate marker, test/lint/plugin validation 을 확인. doc-validator scope/coexistence drift 만 잔존."
---

# Shared Guard QA

## 1. Verification Summary

| Check | Command | Result |
|-------|---------|--------|
| stale shared guard scan | `rg "subdoc-guard version: v2\\.1|clevel-main-guard version: v2\\.1|owner: cto\\s+#|artifact: prd\\s+#|frontmatter 8|8 필드" agents -n` | PASS — no matches |
| duplicate marker scan | Node marker count script | PASS — `no duplicate injected guard markers` |
| clevel patch idempotency | `node scripts/patch-clevel-guard.js --dry-run` | PASS — 6 same-version skips, 0 warnings |
| subdoc patch idempotency | `node scripts/patch-subdoc-block.js --dry-run` | PASS — 45 same-version skips, 0 warnings |
| test suite | `npm test` | PASS — 290 tests, 287 pass, 3 skipped |
| lint | `npm run lint` | PASS |
| plugin validation | `node scripts/vais-validate-plugin.js .` | PASS — 0 errors, 0 warnings |
| doc validation | `node scripts/doc-validator.js cto workflow-contract-alignment` | PASS with expected drift — W-SCOPE legacy warnings + W-MRG-03 owner-H2 warnings |

## 2. Residual Risk

`doc-validator` still expects `01-plan/main.md` to contain:

- `## 요청 원문`
- `## In-scope`
- `## Out-of-scope`

It also emits W-MRG-03 when a phase has multiple artifact docs but `main.md` has no legacy `## [CTO]` owner section. Both behaviors conflict with the v2.1/v2.2 `main.md` 5-section index contract. The residual issue is therefore validator drift, not shared guard alignment failure.

## 3. Acceptance Criteria

| AC | Status |
|----|--------|
| Shared guards reference workflow contract matrix | PASS |
| Fixed CTO/PRD frontmatter sample removed from active guard blocks | PASS |
| 8-field mandatory wording removed from active guard blocks | PASS |
| Inline guard propagation is idempotent | PASS |
| Duplicate managed guard blocks are collapsed | PASS |
| Test/lint/plugin validation pass | PASS |

## 4. Recommendation

Proceed to Stage 4 agent prompt cleanup. Keep doc-validator scope/coexistence drift as a later validator alignment task unless the user wants to prioritize validator behavior before agent prompt cleanup.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | shared guard alignment QA 작성 |
