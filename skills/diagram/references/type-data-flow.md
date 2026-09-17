> 원본: cathrynlavery/diagram-design main@9874ad7 `references/type-data-flow.md` (MIT, 2026-09-17 가져와 수정)

# Data Flow — 데이터 흐름

**Best for:** visualising how data moves through a pipeline *across organisational roles* — who initiates, who processes, who publishes, and who consumes. The canonical use case is a multi-role data platform (Admin → Engineers → Scientists → Consumers) with 4–6 process steps. Use when the reader needs to understand **who does what at each stage**, not just the technical components.

Prefer standard **Swimlane** for cross-functional business processes (HR approvals, support tickets). Use **Data flow** when the subject is a data pipeline with typed payloads (raw files, tables, reports) and role-scoped access boundaries.

This type is **parametric** — the inputs schema in §1 drives every coordinate via the formulas in §2. Two generations from the same inputs must produce visually identical SVG.

---

## 1. Inputs — the parameter contract

```yaml
lanes:                              # 1..4 horizontal swimlanes (top to bottom)
  - { name: ["DATA", "ADMINS"],     key: "ADM" }
  - { name: ["DATA", "ENGINEERS"],  key: "ENG" }
  - { name: ["DATA", "SCIENTISTS"], key: "SCI" }
  - { name: ["DATA", "CONSUMERS"],  key: "CON" }

steps:                              # 1..6 columns (left to right)
  - { number: "01", label: "COLLECT" }
  - { number: "02", label: "STORE" }
  - { number: "03", label: "TRANSFORM" }
  - { number: "04", label: "ANALYZE",  focal: true }   # focal step header chip — accent fill
  - { number: "05", label: "PUBLISH" }

nodes:                              # explicit per-cell entries; empty cells render nothing
  - { lane: "ADM", step: 0, title: "Project Setup",   sub: "create · assign roles",     tool: "Platform console" }
  - { lane: "ADM", step: 1, title: "Access Control",  sub: "bucket policies · LDAP",    tool: "MinIO · LDAP console",
      color: "#b85450" }            # tinted rust-red to flag governance/identity concern
  - { lane: "ENG", step: 0, title: "Source Ingest",   sub: "ext. sources → raw",        tool: "NiFi · API · SFTP",
      chips: {in: "WB", out: "DB"} }                    # web payload in, dataset out
  - { lane: "ENG", step: 1, title: "Raw Store",       sub: "raw landing zones",         tool: "MinIO raw",
      chips: {in: "DB", out: "DB"} }
  - { lane: "ENG", step: 2, title: "Clean & Stage",   sub: "raw → staging → anon",      tool: "NiFi · Trino",
      chips: {in: "DB", out: "TB"} }
  - { lane: "SCI", step: 3, title: "Explore & Model", sub: "anon data → insights",      tool: "JupyterHub · Trino",
      chips: {in: "TB", out: "FL"}, focal: true }       # focal — table in, file/report out
  - { lane: "SCI", step: 4, title: "Publish Findings", sub: "models → dashboards",      tool: "Superset · Reports",
      chips: {in: "FL", out: "FL"} }
  - { lane: "CON", step: 4, title: "Query Insights",   sub: "aggregated views",         tool: "Trino (read-only)",
      chips: {in: "TB", out: "TB"} }

arrows:                             # explicit edges; styles bind to topology (see §3)
  - { from: {lane: "ADM", step: 0}, to: {lane: "ADM", step: 1}, style: "muted" }
  - { from: {lane: "ADM", step: 0}, to: {lane: "ENG", step: 0}, style: "trigger" }   # dashed governance
  - { from: {lane: "ADM", step: 1}, to: {lane: "ENG", step: 1}, style: "trigger" }
  - { from: {lane: "ENG", step: 0}, to: {lane: "ENG", step: 1}, style: "muted" }
  - { from: {lane: "ENG", step: 1}, to: {lane: "ENG", step: 2}, style: "muted" }
  - { from: {lane: "ENG", step: 2}, to: {lane: "SCI", step: 3}, style: "accent",     # focal cross-role
      label: "anon data" }
  - { from: {lane: "SCI", step: 3}, to: {lane: "SCI", step: 4}, style: "muted" }
  - { from: {lane: "SCI", step: 4}, to: {lane: "CON", step: 4}, style: "link" }     # published

dark: false
```

**Reserved field semantics:**
- `lanes[k].key` — the 3-letter role chip text (e.g., `ADM`, `ENG`, `SCI`, `CON`). Used inside every node in that lane.
- `lanes[k].name` — two-line lane label; both lines use the uppercase `eyebrow` role.
- `steps[j].focal: true` — exactly **one** step may declare this. Header chip renders in accent.
- `nodes[i].focal: true` — exactly **one** node may declare this. Renders with accent border (§5).
- `nodes[i].chips` — data-type chips for the node. Either form accepted:
  - **Object form (preferred):** `{in: "<CODE>", out: "<CODE>"}` — explicit input/output semantic. Either side optional.
  - **Array form:** `["<INPUT_CODE>", "<OUTPUT_CODE>"]` — first item is input, second is output.
  - Codes from §8 (`WB`, `DB`, `TB`, `FL`, `LS`). Position is **fixed**: input chip on the node's bottom-**left**, output chip on the bottom-**right**.
- `nodes[i].color` — optional **per-node color override**. Any valid `"#hex"` string is accepted; the §4 palette is recommended for cross-diagram consistency but not required.

---

## 2. Layout formulas — deterministic geometry

```
label_col_w      = 140
step_slot_w      = 112
right_pad        = 28
n_steps          = len(steps)
n_lanes          = len(lanes)

# Canvas
viewBox_w        = label_col_w + n_steps * step_slot_w + right_pad   # 5 steps → 728
header_h         = 36
lane_h           = 80
has_color_row    = any(node.color or step.color or lane.color in inputs)
legend_h         = 100 if has_color_row else 80                      # 4 rows when colors are present
viewBox_h        = header_h + n_lanes * lane_h + legend_h            # 4 lanes, no colors → 436; with colors → 456

# Header strip (top)
header_y         = 0                                                  # ends at header_h = 36
step_chip_y      = 6                                                  # 16-px chip at y=6..22
step_label_y     = 29                                                 # text line below chip

# Lane positions
lane_y_top(k)    = header_h + k * lane_h                              # 36, 116, 196, 276
lane_y_mid(k)    = lane_y_top(k) + lane_h/2                           # 76, 156, 236, 316
lane_label_x     = label_col_w / 2                                    # 70

# Step / node center x
step_cx(j)       = label_col_w + j * step_slot_w + step_slot_w/2      # 196, 308, 420, 532, 644

# Nodes
node_w           = 100
node_h           = 64
node_x(j)        = step_cx(j) - node_w/2                              # 146, 258, 370, 482, 594
node_y(k)        = lane_y_top(k) + 8                                  # 44, 124, 204, 284

# Legend strip (bottom)
legend_y_top     = header_h + n_lanes * lane_h                        # 356
legend_row_y     = [legend_y_top + 16, legend_y_top + 37, legend_y_top + 59]
                                                                      # 372, 393, 415
```

### 2.1 Background structure

- Paper fill across full viewBox.
- Dot pattern: 22×22 grid, `circle r=0.8`, `fill ink @ 0.10`.
- Alternating lane tints: odd-indexed lanes (0, 2, …) receive `ink @ 0.018` fill.
- Lane dividers: horizontal hairlines at every `lane_y_top(k)` and at `legend_y_top`, stroke `ink @ 0.12` width 0.8.
- Label column right border: vertical hairline at `x = label_col_w`, from `y = header_h` to `y = legend_y_top`.

### 2.2 Step header chip

Per step `j`:

```
chip_x(j)        = step_cx(j) - 16        # 16×16 chip
chip_y           = 6
chip_w           = 32
chip_h           = 16
chip_rx          = 8                       # pill-shaped
number_anchor    = (step_cx(j), 14)
label_anchor     = (step_cx(j), 29)
```

Default fill: `ink @ 0.12`, number text ink, label text muted.
Focal fill: `accent @ 0.20`, number + label text accent.
Per-step `color` override (§4): replaces the fill with `rgba(C, 0.20)` and the text fill with `C`.

### 2.3 Lane labels

Two-line `eyebrow` role label, both lines uppercase, fill muted:
- Line 1 at `(lane_label_x, lane_y_mid(k) - 4)`
- Line 2 at `(lane_label_x, lane_y_mid(k) + 8)`

Per-lane `color` override (§4): replaces the label fill with `C` and the lane tint with `rgba(C, 0.04)` (instead of the default `ink @ 0.018`).

### 2.4 Node content layout (inside the 100×64 rect)

```
role_chip          rect 18×10 at (node_x+4, node_y+4),  rx=3
role_chip_text     centered at (node_x+13, node_y+9), eyebrow role, font-size=6, weight=600
title              centered at (step_cx(j), node_y+23), node-name role, font-size=9
sub                centered at (step_cx(j), node_y+35), sublabel role, font-size=6.5, muted
tool               centered at (step_cx(j), node_y+47), sublabel role, font-size=6.5, soft
data chip IN       rect 16×8 at (node_x+4,   node_y+54), rx=3      # payload type entering the node
data chip OUT      rect 16×8 at (node_x+80,  node_y+54), rx=3      # payload type leaving the node
```

Empty cells (no node entry) render **nothing**. No placeholder rect, no role chip, no label — the cell is invisible.

---

## 3. Arrow rules (mandatory)

Four styles, bound to topology. Connectors are drawn **before** all node rects (z-order rule).

| `style` | Stroke | Width | Dash | Marker | When required |
|---|---|---|---|---|---|
| `muted` | `muted` | 1.0 | — | `arr-muted` | Standard data hand-off between steps or within a lane. |
| `trigger` | `muted` | 1.0 | `4,3` | `arr-muted` | Governance trigger — an admin action enables downstream work. Unlabelled. |
| `accent` | `accent` | 1.2 | — | `arr-accent` | Focal cross-role handoff. **Exactly one per diagram**, labeled. |
| `link` | `link` | 1.0 | — | `arr-link` | Published / externally-consumed output. |

**Defs block** (required, three markers):

```svg
<defs>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="11" cy="11" r="0.8" fill="{ink @ 0.10}"/>
  </pattern>
  <marker id="arr-muted"  markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="{muted}"/></marker>
  <marker id="arr-accent" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="{accent}"/></marker>
  <marker id="arr-link"   markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="{link}"/></marker>
</defs>
```

### 3.1 Routing rules (non-negotiable)

- **Single-bend routing:** horizontal-first, then vertical. Exit a node from the **right edge**; enter from the **left** (same-lane horizontal) or **top/bottom** (cross-lane vertical).
- **No diagonals.** Bends use an 8-px Q-bezier corner.
- **Same-step cross-lane (vertical)**: line directly between `(step_cx(j), lane_y_top(k_to)−12)` and `(step_cx(j), lane_y_top(k_to))`. Used for admin → engineers triggers under the same step.
- **Cross-lane cross-step (focal)**: exit right, run horizontal past the source node's right edge to a corridor x just before the target's step, then drop vertically.
- **Labels:** only the `accent` arrow gets a label. Use a paper-filled rect mask (opaque) 6 px behind the text. Other arrows are unlabelled.
- **Z-order:** all arrows emitted before any node rect (the rect fills mask the line ends inside the node).

---

## 4. Component color override

Any node, lane, or step may declare an optional `color: "#hex"`.

### 4.1 Per-node `color`

| Element | Light | Dark |
|---|---|---|
| Container fill (`rect`) | `rgba(C, 0.06)` | `rgba(C_light, 0.10)` |
| Container stroke | `rgba(C, 0.35)` (stroke-width 1) | `rgba(C_light, 0.45)` |
| Role chip fill | `rgba(C, 0.18)` | `rgba(C_light, 0.22)` |
| Role chip text | `C` | `C_light` |
| Title text | `C` | `C_light` |
| Sub-label | **unchanged** (muted) | **unchanged** (muted) |
| Tool label | **unchanged** (soft) | **unchanged** (soft) |
| Data-type chips | **unchanged** | **unchanged** |
| Arrows touching this node | **unchanged** — topology-driven | **unchanged** |

`C_light` = the same hex lightened ~15% for dark-mode contrast (e.g., `#b85450` → `#d97a78`).

### 4.2 Per-step `color`

Replaces the step header chip's fill with `rgba(C, 0.20)` and the chip's number + label text fill with `C`. The legend's matching step entry uses the same colors.

### 4.3 Per-lane `color`

Replaces the lane stripe tint with `rgba(C, 0.04)` and the lane label text fill with `C`. Use sparingly; lane tints are easy to over-apply.

### 4.4 Rules

- **Never on focal nodes / focal steps.** The accent already carries that signal. A `color` on a focal element is ignored.
- **Never on arrows.** Arrows are topology-driven.
- **Cap at 3 custom-colored elements** per diagram (nodes + lanes + steps combined), in addition to the focal pair.
- **Subtitles and tool labels stay muted.** Only the primary identity (border + role chip + title) carries the color signal.

### 4.5 Semantic palette (recommended)

- `#b85450` rust-red — Security / Identity / Governance
- `#5a7d9a` slate-blue — Observability / Quality
- `#7a8c47` olive-green — Governance / Lineage
- `#8c6d3f` warm-brown — Backup / DR / Archive

---

## 5. Focal rule

The data-flow diagram is built around **one cross-role handoff** that defines its central claim. Three focal slots, exactly one entry each:

- **One focal step** (`steps[j].focal: true`) — typically the analytical pivot. Header chip and legend chip both render in accent.
- **One focal node** (`nodes[i].focal: true`) — the node that *receives* the focal handoff. Accent border + accent role chip + ink title.
- **One focal arrow** (`arrows[i].style: "accent"`) — the cross-role handoff into the focal node. Solid accent stroke + labeled with a short payload descriptor.

If zero or >1 of any focal slot are declared, halt and ask the user.

---

## 6. Dark mode

| Token | Light | Dark |
|---|---|---|
| Paper | `paper` | `ink` |
| Ink | `ink` | `paper` |
| Muted | `muted` | `soft` |
| Soft | `soft` | `rule-solid` |
| Accent | `accent` | `accent` |
| Link | `link` | `link` |
| Dot pattern | `ink @ 0.10` | `paper @ 0.10` |
| Lane tint | `ink @ 0.018` | `paper @ 0.025` |
| Dividers | `ink @ 0.12` | `paper @ 0.12` |
| Default chip fill | `ink @ 0.12` | `paper @ 0.12` |
| Focal chip fill | `accent @ 0.20` | `accent @ 0.22` |
| Default node fill | `paper` | `paper @ 0.04` |
| Default node stroke | `ink @ 0.25` | `paper @ 0.20` |
| Focal node fill | `accent @ 0.07` | `accent @ 0.12` |
| Focal node stroke | `accent` | `accent` |
| Custom component colors | `C` | `C_light` (lighten ~15%) |

---

## 7. Reproducibility checklist (taste gate)

1. `viewBox = "0 0 {viewBox_w} {viewBox_h}"` derived from `n_steps` and `n_lanes` via §2.
2. Header strip at `y=0..36`; legend strip at `y=legend_y_top..viewBox_h`.
3. Every node at `(step_cx(j) - 50, lane_y_top(k) + 8)` size `100×64`.
4. Empty cells render nothing.
5. Exactly **one** focal step, **one** focal node, **one** focal arrow (labeled, paper-masked).
6. All other arrows unlabelled.
7. All arrows emitted before any node rect.
8. Single-bend routing only — no diagonals. Q-bezier `r=8` at each bend.
9. Custom component colors ≤ 3. Arrows never recolored.
10. Subtitle and tool labels stay muted.

---

## 8. Data-type chips reference (input + output)

Small `16×8 rx=3` badges at the bottom of each node, one for input and one for output. Input chip bottom-**left** (`node_x+4, node_y+54`), output chip bottom-**right** (`node_x+80, node_y+54`). Either may be omitted.

| Code | Color | Meaning |
|------|-------|---------|
| `WB` | `#6e6479` (mauve) | Web / Public data |
| `DB` | `#5e7a9b` (steel-blue) | Dataset / Raw file |
| `TB` | `#b8915a` (amber) | Table / Analysis-ready |
| `FL` | `#9c6b50` (sienna) | File / Report / Export |
| `LS` | `#4a7c59` (forest) | Live stream / Event |

Text inside chip: white, `eyebrow` role at 5px, weight 700. Chip colors describe *payload format*; the node color override describes *concern type* — don't conflate them.

---

## 9. Legend (3- or 4-row strip)

Each row introduced by a category label at `x=144`. Default 3 rows (`STEPS` / `DATA TYPE` / `FLOW`); with color overrides add a `CONCERN` row and grow `legend_h` to 100.

- **`STEPS`** at `y = legend_y_top + 16`: repeat the header chips with their labels.
- **`DATA TYPE`** at `y = legend_y_top + 37`: one swatch per chip type used, plus the sub-hint `left chip = input · right chip = output`.
- **`CONCERN`** (only with color overrides): one mini-rect per custom color used, with its semantic label; also the focal accent swatch.
- **`FLOW`** (last row): short line segments with marker + label, one per arrow style used.

All legend items align on a single horizontal strip per row.

---

## 10. Complexity budget

| Dimension | Max |
|---|---|
| Lanes (roles) | 4 |
| Steps | 6 |
| Labelled arrows | 1 (focal accent only) |
| Data-type chips per node | 2 |
| Custom-colored elements (§4) | 3 (in addition to focal node + focal step) |

Above 4 lanes or 6 steps: split into two diagrams.

---

## 11. Anti-patterns

- Placeholder empty cells.
- More than one labelled arrow.
- Diagonal arrows.
- `title` role for node titles — node titles use the `node-name` role.
- Accent on more than one node, one step, one arrow.
- `node-name` role for lane labels — lane labels use the uppercase `eyebrow` role.
- `color` override on a focal element — ignored.
- Custom-colored arrows.
- Lane tints over-applied — apply to ≤1 lane.

---

## 12. Examples

- `assets/example-data-flow.html` — minimal light (4-role × 5-step platform).
