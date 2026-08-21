# Agent Teams Runtime Contract

> Contract version: 1.0
> Default: disabled

## Activation

`vais.config.json > orchestration.agentTeams.enabled` is the explicit feature gate.
When disabled, VAIS uses the sequential five-section index workflow. Enabling the
gate must not silently modify Claude Code settings.

Native execution additionally depends on the supported Claude Code version and
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. When configuration is enabled but the host
flag is unavailable, VAIS reports simulation mode and preserves sequential safety.

## Routing

The CEO algorithm may return `parallelGroup`, `synthesizer`, `participants`,
`dominantDomain`, and `conversationMode`. The phase and dominant domain select one
C-Level synthesizer. Other activated C-Level agents review the draft.

Execution sub-agents remain under their owning C-Level. Sub-agent-to-sub-agent
messages are not allowed.

## Lazy Consensus

The conversation state machine is:

```text
draft -> review-window -> consensus-reached
                     \-> objection-raised -> revision -> review-window
```

- The synthesizer writes the first draft.
- Reviewers return agreement or a scoped objection.
- The synthesizer owns revisions.
- The review window is bounded by configured turns and timeout.
- Exhausted review records a timeout and unresolved objections; it is never hidden.
- Only the synthesizer writes the final synthesis document.

## Message Safety

- C-Level-to-C-Level review messages are allowed within the active participant set.
- Unknown actors and sub-agent callers are rejected.
- Secret-like values are scanned before messages are sent.
- Message events are appended to the decisions log.
- Host permission and hook trust remain separate from VAIS workflow approval.

## Output Contract

Agent Teams v2 output uses:

- `main.md`: synthesizer-owned synthesis document based on `templates/synthesis.template.md`
- `decisions-log.md`: append-only message timeline based on `templates/decisions-log.template.md`
- Required v2 frontmatter: `owner`, `artifact`, `phase`, `feature`, `synthesizer`, `model-version`

The `synthesizer` value must match across `main.md`, `decisions-log.md`, and the
decision section. Valid event types are `제기`, `반박`, `합의`, `pivot`, and
`timeout`.

## Worktree Boundary

`agentTeams.subagentSessions` is a separate opt-in. When enabled, sub-agents may use
isolated worktrees. Merge-back requires user review plus lint/test gates. Cleanup is
never automatic.

## Verification

- `tests/lazy-consensus-fsm.test.js`
- `tests/conversation-orchestrator-sendmessage.test.js`
- `tests/synthesis-consistency.test.js`
- `scripts/vais-validate-plugin.js > validateAgentTeamsConfig`
