> 원본: cathrynlavery/diagram-design main@9874ad7 `references/type-swimlane.md` (MIT, 2026-09-17 가져와 수정)

# Swimlane — 스윔레인

**Best for:** cross-functional processes, RACI-style flows, vendor handoffs, multi-team shipping workflows. 역할(사용자·앱·서버·외부 서비스)마다 누가 무엇을 하는지 보일 때.

## Layout conventions
- Horizontal lanes (or vertical columns) — one per actor/team. Label each lane in the left margin (or top) with a Geist Mono eyebrow.
- Lane dividers: 1px hairlines.
- Process steps are rectangles placed inside the lane of the actor performing them; arrows show flow.
- Handoffs (arrows crossing lane boundaries) are the most important edges — consider coral on the handoff that introduces the most coupling or latency.
- Don't force equal step count per lane; a lane with one step is fine.

## Anti-patterns
- Lanes without labels.
- A step drawn across two lanes (pick one owner).
- Arrows that snake back and forth — reorder steps so the flow is mostly straight.

## Examples
- `assets/example-swimlane.html` — minimal light
