---
schema: vais-work-item/v1
id: WI-2026-09-17-harness-doc-budget
title: 문서 예산 상향과 설정화
primary_feature: harness-doc-budget
affected_features: []
scale: compact
phase: report
status: completed
plan_revision: 1
design_revision: 1
write_scopes:
  - lib/workflow/v2/document-quality.js
  - lib/workflow/v2/config.js
  - lib/workflow/v2/doctor.js
  - vais.config.json
  - tests/**
  - README.md
  - CLAUDE.md
  - ONBOARDING.md
  - docs/harness/design.md
  - CHANGELOG.md
  - package.json
  - package-lock.json
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
created_at: '2026-09-17T08:10:12.177Z'
updated_at: '2026-09-17T08:26:49.105Z'
approvals:
  plan: approved
  design: approved
  final: approved
report_frozen: true
---

# WI-2026-09-17-harness-doc-budget — 문서 예산 상향과 설정화

## Summary

This Work item is managed by the VAIS workflow state machine.
