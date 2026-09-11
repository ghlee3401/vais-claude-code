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
- For delegated judgment or implementation, call only `v2-specialist` with a runtime role prompt and structured assignment. Do not read Legacy agent bodies.
- Specialists return structured handoff data; the Phase owner alone writes the canonical phase `main.md`.
- If the request lacks `/vais`, stay read-only as instructed by the hook.

## `shadow` or `disabled`

Follow [legacy.md](legacy.md). v2 may observe and evaluate, but it must not change routing, state, docs, or code.
