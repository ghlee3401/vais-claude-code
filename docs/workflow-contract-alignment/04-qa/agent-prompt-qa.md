---
owner: cto
artifact: agent-prompt-qa
phase: qa
feature: workflow-contract-alignment
generated: 2026-05-13
source: "terminal verification after agent prompt alignment"
summary: "agent prompt 정리 후 non-knowledge legacy scan, C-Level main body path scan, guard idempotency, test/lint/plugin/doc validator 를 확인."
---

# Agent Prompt QA

## 1. Verification Summary

| Check | Command | Result |
|-------|---------|--------|
| non-knowledge prompt legacy scan | legacy prompt pattern scan excluding `**/knowledge/**` | PASS — no matches |
| C-Level main body path scan | `rg 'docs/\\{feature\\}/0[0-5]-[a-z]+/main\\.md' agents/{ceo,cpo,cto,cso,coo,cbo}/*.md` | PASS — no matches |
| subdoc guard idempotency | `node scripts/patch-subdoc-block.js --dry-run` | PASS — 45 same-version skips, 0 warnings |
| clevel guard idempotency | `node scripts/patch-clevel-guard.js --dry-run` | PASS — 6 same-version skips, 0 warnings |
| plugin validation | `node scripts/vais-validate-plugin.js .` | PASS |
| test suite | `npm test` | PASS |
| lint | `npm run lint` | PASS |
| doc validation | `node scripts/doc-validator.js cto workflow-contract-alignment` | PASS with expected drift — W-SCOPE 3 + W-MRG-03 2 |

## 2. Residual Risk

At the time of Stage 4, knowledge files still contained legacy references to `03-do/main.md` and `release-engineer`. These were intentionally left out of the agent prompt stage and resolved in Stage 6 (`knowledge-qa.md`).

## 3. Acceptance Criteria

| AC | Status |
|----|--------|
| `prd-writer` writes PRD to `01-plan/prd.md` | PASS |
| C-Level prompts no longer direct body content into `main.md` | PASS |
| CEO/CPO author sub-agents no longer use `_tmp` scratchpad output | PASS |
| COO active prompt no longer delegates to retired `release-engineer` | PASS |
| Guard injected blocks remain idempotent | PASS |

## 4. Recommendation

Proceed to Stage 5 template cleanup. The next highest-risk drift is templates that say `main.md index only` but still contain full body document templates or legacy `_tmp` samples.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-13 | agent prompt alignment QA 작성 |
