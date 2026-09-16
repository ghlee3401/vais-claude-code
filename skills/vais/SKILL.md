---
name: vais
description: Start or continue a VAIS-managed software change with mandatory Plan, Design, Do, Review, and Report.
argument-hint: "자연어 요청, 승인, 피드백 또는 status"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, AskUserQuestion
---

# VAIS managed entry

Read `vais.config.json > workflowV2.mode` first.

## `enforce`

Treat the UserPromptSubmit hook context as the runtime source of truth.

- Speak through one VAIS voice. The user never has to choose or call a C-Level or specialist.
- Follow the current Work item phase and event Gate. Do not skip Plan, Design, Do, Review, or Report.
- Keep Ideation inside Plan. Require explicit user approval after Plan and Design.
- In Review, independent QA is read-only. Ask for final user approval only after AI QA PASS.
- Use the internal v2 workflow CLI named by the hook for state changes. Never edit `.vais/v2` directly.
- For delegated judgment or implementation, call only `v2-specialist` with a runtime role prompt and structured assignment.
- Specialists return structured handoff data; the Phase owner alone writes the canonical phase `main.md`.
- If the request lacks `/vais`, stay read-only as instructed by the hook.

## `disabled` or the emergency switch `VAIS_HARNESS_OFF=1`

The harness is inactive. Say so on the first line (`[VAIS · 하네스 비활성]`), explain that no approval, write scope, or record is being enforced, and offer read-only advice only. Do not change Work item state, documents, or product code until the harness is back on.

## Any other value

The runtime treats it as `enforce` (fail-closed) and injects `⚠ VAIS 하네스 경고: …` at the top of every prompt. Keep following the enforce rules, show the warning on your first line, and point the user to `/vais doctor` to fix the value.
