---
name: recursive-agentic-synthesis
version: "1.0"
category: superpowers
execution_speed: slow
token_efficiency: high
triggers:
  - "recursive agentic synthesis"
  - "ras"
  - "nested doll plan"
  - "build this from this image"
  - "synthesize the finished product"
  - "russian doll planning"
cache_key: "recursive-agentic-synthesis-1.0"
dependencies:
  - writing-plans
  - executing-plans
  - parallel-wave-planning
  - orchestrator
  - stitch
disable-model-invocation: false
description: >
  Use when a user hands you an idea, image, or set of links describing an
  "ideal" finished product and wants it built end to end, not just one plan.
  Recursively decomposes the goal like a Russian nesting doll -- overview,
  then section plans, then sub-plans, then sub-sub-plans -- until every leaf
  is an execution-ready plan doc, using Architectural Design Records (ADRs)
  to track requirements and decisions at each level. Model tier gets cheaper
  with depth (Sonnet only through level 2, Haiku from level 3 down) while
  the plans themselves get less lazy with depth. Finishes with an end-to-end
  visual/spec verification pass against the original ask. Trigger on
  "recursive agentic synthesis", "ras", "nested doll plan", "russian doll
  planning", "build this from this image".
---

# Recursive Agentic Synthesis

## Overview

Takes an idea, image, or link describing a finished product and recursively
plans it into existence: one lazy overview at the top, decomposing into
sections, then sub-sections, then sub-steps, each round less lazy than the
last, until every leaf is a `writing-plans`-formatted plan sized to run in
one execution session. Requirements and non-obvious decisions at each level
are recorded as ADRs, not just prose, so later levels (and later sessions)
can trust them instead of re-deriving them. Execution and code-seam
verification reuse `orchestrator` and `stitch` unchanged -- this skill's job
is everything before and after that: intake, recursive decomposition, and
end-to-end verification against the original ask.

**Announce at start:** "I'm using the recursive-agentic-synthesis skill to
plan this from the ground up, starting with intake."

**Save ADRs to:** `docs/superpowers/adrs/NNNN-title.md` (sequential,
zero-padded). **Save plans to:** `docs/superpowers/plans/` per
`parallel-wave-planning`'s convention -- leaf plans from this skill's
decomposition ARE parallel-wave-planning-shaped plans; reuse that format and
its orchestration index/status tracker rather than inventing a new one.

## Step 0: Intake -- never guess, always interrogate

Gather what the user handed you: the idea, image(s), link(s) to a reference
product. Then ask clarifying questions before writing anything. Do not infer
scope, stack, or missing requirements silently -- if it's ambiguous, ask.
Batch questions (use `AskUserQuestion` for concrete forks like stack/hosting
choices); don't interrogate one question at a time if several are
independent.

Stop intake once you can write one paragraph of "what and why" per
subsystem -- same bar as `parallel-wave-planning`'s prerequisite.

## Step 1: Holistic lazy overview -> ADR-0001

Write the project's summary and requirements as `docs/superpowers/adrs/0001-project-scope.md`:

```markdown
# ADR-0001: Project Scope and Approach

## Status
Accepted

## Context
<what the user asked for, in 1-3 sentences. Reference the image/links verbatim.>

## Decision
<the lazy, holistic shape of the solution -- sections/subsystems it needs,
at the coarsest level that is still true. No implementation detail yet.>

## Consequences
<what this scope explicitly excludes, and open questions the user already
answered during intake.>
```

Be lazy here on purpose: this is the outermost doll. Fewer words, coarsest
sections, no premature detail. Confirm the overview with the user before
decomposing further -- a wrong top-level scope invalidates every doll nested
inside it.

## Step 2: Recursive decomposition

Each level takes the previous level's items and, for each one, decides:
**leaf** (small enough to execute in one session, ~100k tokens -- use the
sizing table from `parallel-wave-planning` Step 2 verbatim) or **needs
another doll** (still too broad -- split again, same way `parallel-wave-planning`
splits a slice, but recursively).

**Model tier by depth (binding):**

| Level | Contents                          | Model  | Laziness              |
|-------|------------------------------------|--------|------------------------|
| 1     | Overview (ADR-0001)                | Sonnet | Laziest -- coarsest cut |
| 2     | Section plans (frontend/backend/db/scaffolding/other) | Sonnet | Less lazy |
| 3     | Sub-plans within a section         | Haiku  | Less lazy still |
| 4+    | Sub-steps within a sub-plan        | Haiku  | Least lazy -- full detail, no placeholders |

"Less lazy with depth" means: level 2 can still hand-wave implementation
detail level 4 cannot. A leaf plan (whatever level it lands at) must be a
complete `writing-plans`-format doc -- no hand-waving, ever, at a leaf.

**Mechanics:** run this as a Workflow using a frontier loop -- process one
depth's items in parallel, collect which need further splitting, loop:

```javascript
export const meta = {
  name: 'ras-decompose',
  description: 'Recursively decompose a project scope into leaf-ready plans',
  phases: [{ title: 'Decompose' }],
}

const NODE_SCHEMA = {
  type: 'object',
  properties: {
    is_leaf: { type: 'boolean' },
    adr_note: { type: 'string' },        // one-line decision + why, for the ADR
    plan_path: { type: 'string' },       // set only if is_leaf
    children: {                          // set only if !is_leaf
      type: 'array',
      items: { type: 'object', properties: {
        title: { type: 'string' }, context: { type: 'string' },
      }, required: ['title', 'context'] },
    },
  },
  required: ['is_leaf'],
}

let frontier = args.topLevelSections   // [{title, context}, ...] from ADR-0001
let depth = 2
const adrNotes = []

while (frontier.length) {
  const model = depth <= 2 ? 'claude-sonnet-5' : 'claude-haiku-4-5-20251001'
  const results = await parallel(frontier.map(item => () => agent(
    `You are decomposing "${item.title}" (depth ${depth}) as part of a
     recursive project plan. Context: ${item.context}
     Decide: is this small enough to be ONE execution-ready plan doc sized to
     ~100k tokens (writing-plans format, see parallel-wave-planning sizing
     table), or does it still need splitting into sub-items? If leaf, write
     the plan doc to docs/superpowers/plans/ and return its path. If not
     leaf, return the child items (title + one-paragraph context each) --
     be LESS lazy than depth-1 dolls: more concrete, but still don't write
     full detail you'd write at a leaf. Always return a one-line adr_note
     explaining the split/leaf decision.`,
    { label: `${item.title}@d${depth}`, phase: 'Decompose', schema: NODE_SCHEMA, model }
  )))

  const next = []
  for (const r of results) {
    if (!r) continue
    adrNotes.push(`L${depth} ${r.adr_note}`)
    if (!r.is_leaf) next.push(...r.children)
  }
  frontier = next
  depth++
}

return { adrNotes, finalDepth: depth - 1 }
```

Call it with `Workflow({ script, args: { topLevelSections } })` where
`topLevelSections` comes from ADR-0001's Decision section. After it returns,
write one ADR per **non-trivial** split decision (not every node -- only
where the split reflects a real architectural choice, e.g. "frontend split
into auth-shell vs feed vs profile because they own disjoint routes"). Skip
ADRs for mechanical splits (a sub-plan broken up purely because of size).

When done, run `parallel-wave-planning` Steps 3-6 (seam contracts, wave
ordering + collision rule, orchestration index, status tracker) over the
resulting leaf plans -- decomposition depth doesn't matter to execution;
only the leaf set and its seams do.

## Step 3: Execute

Hand off to the `orchestrator` skill unchanged, exactly as
`parallel-wave-planning` does. Do not reimplement wave dispatch here.

## Step 4: End-to-end verification against the original ask

After `orchestrator` reports every plan done:

1. Re-read the original intake artifacts (image(s), links, ADR-0001).
2. If the product is visually inspectable (a UI), use the `run` skill to
   launch it and capture screenshots of the key views named in intake.
3. Compare screenshots + a summary of what was built against ADR-0001's
   Decision section and the original image/links, one item at a time.
4. For each mismatch: this is a **targeted** fix, not a restart --
   re-run Step 2's decomposition loop scoped to only the mismatched
   subsystem, producing new leaf plan(s) for just that gap, then
   `orchestrator` + `stitch` again on just those. Update the relevant ADR
   with a superseding entry (`Status: Superseded by ADR-00NN`) rather than
   editing history in place.
5. If the user changes scope during this review (they will -- "grill" them
   the same way intake did, don't just accept a vague new ask), update
   ADR-0001 or file a new ADR, then repeat from Step 2 for the delta only.
6. Report done only when a full pass finds zero mismatches.

## Remember

- Never guess during intake -- ask. This is the one place hand-waving is
  never acceptable, even though the *plans* start lazy.
- Laziness decreases with depth; model cost also decreases with depth
  (Sonnet levels 1-2, Haiku level 3+) -- these are independent knobs, both
  binding.
- ADRs record decisions, not every node -- one per real architectural
  choice, not one per split.
- Leaf plans are `writing-plans`-format and `parallel-wave-planning`-sized
  (~100k tokens) no matter what depth they land at.
- Reuse `orchestrator` and `stitch` as-is for execution and code seams --
  this skill only owns intake, recursive decomposition, and the final
  E2E visual/spec verification loop.
- E2E mismatches trigger targeted re-decomposition of the affected branch,
  never a full restart.
