---
schema: vais-work-item/v1
id: WI-2026-09-17-harness-diagram-skill
title: 다이어그램 스킬 흡수
primary_feature: harness-diagram-skill
affected_features: []
scale: standard
phase: report
status: completed
plan_revision: 1
design_revision: 1
write_scopes:
  - skills/diagram/**
  - contracts/chain-stages.json
  - schemas/chain-stage.schema.json
  - lib/workflow/v2/router.js
  - lib/workflow/v2/write-policy.js
  - lib/workflow/v2/config.js
  - lib/workflow/v2/id-chain.js
  - lib/workflow/v2/diagram.js
  - lib/workflow/v2/index.js
  - hooks/workflow-v2-prompt.js
  - scripts/vais-workflow-v2.js
  - vais.config.json
  - .gitignore
  - tests/**
  - README.md
  - CLAUDE.md
  - ONBOARDING.md
  - docs/harness/design.md
  - CHANGELOG.md
  - package.json
  - package-lock.json
  - .claude-plugin/**
  - docs/diagrams/**
readiness_checks:
  - test
  - lint
  - plugin-validator
review_checks:
  - secret-scan
required_specialists: []
readiness_not_ready_count: 0
qa_repair_count: 0
created_at: '2026-09-17T08:45:45.830Z'
updated_at: '2026-09-17T09:33:02.909Z'
approvals:
  plan: approved
  design: approved
  final: approved
report_frozen: true
---

# WI-2026-09-17-harness-diagram-skill — 다이어그램 스킬 흡수

## Summary

This Work item is managed by the VAIS workflow state machine.
