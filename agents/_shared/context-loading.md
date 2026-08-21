# CONTEXT LOADING RULES

VAIS does not have a runtime that automatically discovers and injects every file
under `agents/*/knowledge/` or `docs/`.

Use explicit, selective loading:

1. Match the current phase and requested artifact against the owning agent's Knowledge Index.
2. Read only the named knowledge file required for that decision.
3. Do not scan or load all knowledge files as a precaution.
4. Do not load historical feature documents unless the user explicitly asks for history.
5. Record the paths actually read in the resulting artifact or audit event.

This policy keeps domain guidance available without making the full document tree a
default prompt dependency. A future loader must preserve the same phase-and-artifact
filter and expose which files it injected.
