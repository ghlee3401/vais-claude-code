> 원본: cathrynlavery/diagram-design main@9874ad7 `references/semantic-patterns.md` (MIT, 2026-09-17 가져와 수정 — 남긴 11종 유형에 닿는 패턴 6개만 유지)

# Semantic patterns

Semantic patterns describe **what a system does**; the visual types describe **how information is arranged**. Choose a pattern first when behavior, state, enforcement, or risk is load-bearing, then use its nearest visual type as the layout grammar. If no pattern matches, choose a visual type directly.

Use one primary pattern per figure. A second pattern may supply at most one supporting primitive; if both need full treatment, split overview and detail. Labels and outcomes must remain complete in a static frame.

## Routing table

| The reader must understand… | Semantic pattern | Nearest visual type |
|---|---|---|
| Many arrivals competing for finite service capacity | **Fan-in queue / bottleneck** | Data flow |
| A loose conversation becoming a durable structured record | **Unstructured input → structured artifact** | Data flow |
| Why two policy decisions differ and where they first diverge | **Paired policy-evaluation traces** | Flowchart |
| Which routes cross a trust boundary and which routes are blocked | **Secure paved road** | Architecture |
| Which sub-elements a system decomposes into, each independently citable | **Traceable block decomposition** | Tree |
| How one subject progresses through phases, waits, retries, cancellation, and terminal outcomes | **Lifecycle phase map** | State Machine |

## 1. Fan-in queue / bottleneck

**Selection triggers:** Several producers converge on one reviewer, service, gate, or constrained resource; the story depends on arrival rate, queue depth, wait, capacity, or backpressure.

**Required primitives:** Distinct sources; fanned ingress; an ordered queue with visible slots and count; a capacity/service-rate label; one constrained service point; admitted and deferred/rejected outcomes. Label units (`8/hour`, `3 slots`), not just "high."

**Complexity budget:** ≤5 sources, ≤5 queue slots, one bottleneck, two outcomes, and ≤9 primary nodes. Aggregate excess sources as a named cohort.

**Anti-patterns:** Equal-width pipeline that hides contention; arrows merged before they can be traced; capacity implied only by box size; decorative pile-up; red alone meaning overloaded.

**Static fallback:** Show the representative final queue, numeric count/capacity, bottleneck label, and both outcome paths. A still must reveal why work waits.

**Nearest visual type:** **Data flow**; use **Swimlane** when service stages, rather than sources, dominate.

## 2. Unstructured input → structured artifact

**Selection triggers:** Dialogue, notes, prompts, or a rambling request are elicited, normalized, and written into a durable brief, ticket, record, schema, or other structured artifact.

**Required primitives:** Source utterance(s); clarifying questions; extracted field/value pairs; a named transformation; the durable artifact boundary; provenance links from representative statements to fields; missing/unknown state.

**Complexity budget:** ≤4 exchanges, ≤6 artifact fields, one transformation, and ≤3 provenance links. Show representative content, not a transcript.

**Anti-patterns:** "AI magic" sparkle between two boxes; artifact shown as another chat bubble; fields appearing without sources; inventing certainty for missing facts.

**Static fallback:** Show a short source excerpt beside the completed labeled artifact, with at least one provenance mapping and any unknown fields visible.

**Nearest visual type:** **Data flow**; use **Swimlane** when elicitation has several ordered gates owned by different roles.

## 3. Paired policy-evaluation traces

**Selection triggers:** Two otherwise similar requests reach different outcomes; the reader needs rule-by-rule `PASS`, `FAIL`, `SKIPPED`, or `NOT REACHED` state and the first divergence.

**Required primitives:** The same ordered rules on both traces; explicit status text plus symbol/shape; inputs that differ; final outcomes; a labeled first-divergence marker; a distinction between `SKIPPED` (applicable flow intentionally bypassed) and `NOT REACHED` (evaluation stopped earlier).

**Complexity budget:** Exactly 2 traces, 3–6 rules, one first divergence, ≤12 status cells, and one outcome per trace. Move rule prose to notes if labels exceed one line.

**Anti-patterns:** Comparing two independently ordered flows; green/red dots without words; treating skipped and not-reached as synonyms; highlighting every difference; continuing a denied trace as if downstream rules ran.

**Static fallback:** Show all rule states and both outcomes at once; use a persistent bracket/line and label for the first divergence.

**Nearest visual type:** **Flowchart** for ordered decision logic; use **Sequence** only when messages between actors and time are also load-bearing.

## 4. Secure paved road

**Selection triggers:** A supported architecture creates a bounded route from intake/build to deployment; trust boundaries, privileged moments, permitted ingress, forbidden ingress, and approved versus blocked deploy paths are the point.

**Required primitives:** Labeled trust boundaries; actors and identities; permitted ingress with a positive text label; forbidden ingress terminating at the boundary; approved deployment path; blocked bypass path; privileged gate; isolated runtime; audit destination. Use different line styles and stop symbols in addition to color.

**Complexity budget:** ≤3 trust zones, ≤8 components, ≤10 paths, ≤2 forbidden paths, and one privileged gate. Split control detail into a separate figure.

**Anti-patterns:** Dashed box called "security" with no route semantics; forbidden arrow crossing into the protected zone; secrets or identity implied but unlabeled; every component styled as trusted; a bypass path that visually rejoins the approved route.

**Static fallback:** Render every boundary and both permitted/forbidden routes. Blocked paths must visibly stop before entry or deployment.

**Nearest visual type:** **Architecture**.

## 5. Traceable block decomposition

**Selection triggers:** A system or product must decompose into addressable, individually citable sub-elements — each with a stable identifier a reader can point at directly, not a name alone. The reader needs to trace a specific block to its parent, to what it consumes and produces, and to the code that implements it. This describes *structure* (what the system is made of), not a process — for a sequence of actions, choose a pattern that routes to Flowchart or Swimlane instead.

**Required primitives:** A stable dotted ID per block (e.g. `PAY-001-02`, or a VAIS chain ID such as `F-003`), shown as a compact badge using the node-box type-tag chip (SKILL.md §6) — never as a separate connector-adjacent label. A noun-phrase block name — the structural element itself ("Fraud Screening"), not an action performed on it — in the node's name slot. Parent-child structure is Tree's own elbow connector; this pattern adds no new connector semantics or connector labels. At most one short inbound and one short outbound flow-port label per block, in the Geist Mono sublabel slot, shown only when both fit without crowding the name — omit by default. Anything longer than a short phrase lives in `data-block-*` attributes on the node, never as additional visible diagram text.

**Complexity budget:** Tree's own root+3-tier / 5-per-level caps and the global 9-node ceiling apply as-is — this pattern does not raise them. A hierarchy that needs more splits into a linked set of diagrams, one per subsystem.

**Anti-patterns:** Four-sided ICOM boxes with Input/Control/Output/Mechanism arrows on every side — that is IDEF0's grammar, not this pattern's. Drawing input/output arrows between siblings or cousins — that is a dependency graph's job. Verb-phrase block names — name the structural element, not an action. Treating the visible diagram as the complete record — it is a bounded view. Labeling the tree connector itself with an ID or name.

**Static fallback:** Always static. Every ID badge, block name, and any shown port label must be legible in the single rendered frame.

**Nearest visual type:** **Tree**.

## 6. Lifecycle phase map

**Selection triggers:** One subject advances through a small set of named phases, while waits, retries, cancellation, recovery, and terminal outcomes are as important as the happy path. Use this for the subject's lifecycle, not for messages exchanged between actors.

**Required primitives:** A left-to-right primary phase rail; 4–5 ordered phase states; a separate interruption/recovery band for waits or retries; a separate terminal-outcome band; labeled transitions; distinct terminal state boxes for cancellation and failure when both can occur. Those labeled boxes are sufficient terminal outcomes; optional start/end pseudo-state markers follow the State Machine reference and count toward the transition budget.

**Complexity budget:** 4–5 primary phases, ≤2 supporting wait/recovery states, ≤2 terminal states, ≤9 states, and ≤10 transitions. Split lifecycle overview from dense guard logic once either ceiling is reached.

**Anti-patterns:** Actor lifelines or message arrows disguised as phases; a request/response exchange that belongs in Sequence; every guard and event from the underlying implementation; interruption states placed on the primary rail; cancellation and failure collapsed into one color-only state; a retry loop with no labeled re-entry point.

**Static fallback:** Show the complete primary rail, every supporting state, both terminal outcomes, and all labeled transitions in one frame. Position and band labels must distinguish progress, interruption/recovery, and termination without relying on color.

**Nearest visual type:** **State Machine**. Use **Sequence** when actor messages or request timing carry the story; use ordinary **State Machine** without this pattern when dense transition logic and guards matter more than one subject's progress.

## Composition rules

- The semantic pattern may specialize status, boundary, queue, or propagation primitives; the selected type still owns page axis, connector grammar, spacing, and type-specific limits.
- Apply the stricter of the pattern budget and visual-type budget. Semantic cells/statuses are not permission to exceed the nine-node overview target.
- Use stable text for states and outcomes. Color and position reinforce meaning but never carry it alone.
