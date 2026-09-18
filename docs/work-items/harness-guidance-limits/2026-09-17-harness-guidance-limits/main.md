---
schema: vais-work-item/v1
id: WI-2026-09-17-harness-guidance-limits
title: 코드 한도를 지시문에 그대로
primary_feature: harness-guidance-limits
affected_features: []
scale: compact
phase: report
status: completed
plan_revision: 1
design_revision: 1
write_scopes:
  - hooks/workflow-v2-prompt.js
  - agents/v2-specialist.md
  - lib/workflow/v2/router.js
  - lib/workflow/v2/phase-transaction.js
  - lib/workflow/v2/contracts.js
  - scripts/vais-workflow-v2.js
  - tests/**
  - CLAUDE.md
  - README.md
  - docs/harness/design.md
  - CHANGELOG.md
  - package.json
  - package-lock.json
  - vais.config.json
  - .claude-plugin/**
readiness_checks:
  - test
  - lint
  - plugin-validator
review_checks:
  - secret-scan
required_specialists: []
readiness_not_ready_count: 0
qa_repair_count: 0
created_at: '2026-09-17T09:38:27.931Z'
updated_at: '2026-09-18T00:29:09.350Z'
approvals:
  plan: approved
  design: approved
  final: approved
report_frozen: true
---

# WI-2026-09-17-harness-guidance-limits — 코드 한도를 지시문에 그대로

## Summary

This Work item is managed by the VAIS workflow state machine.
