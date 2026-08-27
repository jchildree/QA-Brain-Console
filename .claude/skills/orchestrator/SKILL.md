---
name: orchestrator
version: "1.0"
category: superpowers
execution_speed: slow
token_efficiency: high
triggers:
  - "orchestrate the waves"
  - "run the orchestrator"
  - "execute the wave plan"
  - "run the waves"
  - "orchestrator"
cache_key: "orchestrator-1.0"
dependencies:
  - parallel-wave-planning
  - stitch
  - executing-plans
disable-model-invocation: false
description: >
  Use AFTER parallel-wave-planning has produced numbered plan docs, an
  orchestration index, and a status tracker in docs/superpowers/plans/. Drives
  execution wave by wave: one subagent per plan, dispatched in parallel within
  a wave, always on Sonnet 5 at medium effort. Between waves it deliberately
  drops prior subagent transcripts and re-derives state from the persisted
  status tracker and orchestration index only, so its own context stays flat
  no matter how many waves a run has. Trigger on "orchestrate the waves", "run
  the orchestrator", "execute the wave plan", "run the waves".
---

# Orchestrator

## Overview

`parallel-wave-planning` produces the plans and the map; `orchestrator` runs
them. Its one job beyond dispatching subagents is **not accumulating their
work in its own context**. A run with 5 waves and 20 plans, executed the
naive way (each subagent's full transcript in the orchestrating session),
compacts the orchestrator itself before the run finishes. This skill avoids
that by treating the persisted files as the only source of truth between
waves -- the orchestrator's own context is disposable.

**Announce at start:** "I'm using the orchestrator skill to execute the wave
plan in `docs/superpowers/plans/`."

**Model policy (binding):** every plan-execution subagent this skill
dispatches runs on **Sonnet 5, medium reasoning effort**. No exceptions
without the user asking for a different model/effort for a specific plan.

## Prerequisites

Read these two files before doing anything else -- they are the entire state
of the run:

- `docs/superpowers/plans/00-orchestration-index.md` -- wave/plan table, the
  collision rule, the seam map, the calibrated budget bands.
- `docs/superpowers/plans/.orchestration-status.md` -- Plan | Wave | Status.

If either is missing, stop and run `parallel-wave-planning` first -- this
skill does not decompose projects, only executes an existing wave plan.

## The Process

### Step 1: Determine the next wave to run

From the status tracker, find the lowest-numbered wave that is not fully
`done`. If every plan in that wave is `not started` or `blocked` with the
blocker now cleared, that is the wave to run. Never start Wave N+1 while any
Wave N plan is not `done` -- Wave N+1 plans consume Wave N's output.

**Resuming after an interruption or a partial failure:** re-read the status
tracker fresh -- do not re-run the whole wave (or the whole orchestration
run) just because it was interrupted. Filter that wave's plans to only the
ones NOT `done` (`not started` or `blocked` with the blocker cleared). Plans
already marked `done` keep their result; do not re-dispatch them, even if
they were done in a prior session. If exactly one plan in the wave needs
(re-)running, that one plan IS the wave for this pass -- skip the multi-plan
dispatch machinery entirely and just execute that single plan (Step 2b's
single-agent form, or a one-item Workflow call), then go straight to Step 4
for the seams it touches. Only dispatch more than one plan in parallel when
more than one actually needs it.

### Step 2: Dispatch the wave

Prefer the **Workflow tool** for this step -- it is the only mechanism that
both pins model + reasoning effort per subagent and keeps the subagents'
output out of this session's context (they run in the background; you get
back only the structured result). If Workflow orchestration has not been
opted into for this session, fall back to Step 2b.

**Step 2a -- Workflow (preferred):**

Run a script shaped like this (adapt plan list/paths to what the index says;
do not invent plans not in the index). `wavePlans` is the Step 1 filtered
list -- only plans not yet `done` -- which may be the whole wave on a first
pass or a single plan on a resume:

```javascript
export const meta = {
  name: 'execute-wave',
  description: 'Execute one wave of plans in parallel, one subagent per plan',
  phases: [{ title: 'Execute' }],
}

const PLAN_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    plan: { type: 'string' },
    status: { type: 'string', enum: ['done', 'blocked'] },
    files_touched: { type: 'array', items: { type: 'string' } },
    tests_run: { type: 'string' },
    approx_context_at_end: { type: 'string' },
    blocker: { type: 'string' },
  },
  required: ['plan', 'status'],
}

const wavePlans = args.plans // [{path, number, name}, ...] -- only plans still not `done`

const results = await parallel(wavePlans.map(p => () => agent(
  `Execute the plan at ${p.path} following the executing-plans skill exactly:
   work through its tasks in order, run its verify commands, do not skip the
   Self-Review. Obey the collision rule from the orchestration index -- check
   git status/log on any file before editing it. Report back: plan number,
   final status (done or blocked + why), files touched, what tests ran and
   whether they passed, and your rough context usage at the end (for
   calibration).`,
  { label: `plan-${p.number}`, phase: 'Execute', schema: PLAN_RESULT_SCHEMA,
    model: 'claude-sonnet-5', effort: 'medium' }
)))

return results.filter(Boolean)
```

Call it with `Workflow({ script, args: { plans: wavePlansForThisWave } })`.
Do not pass `isolation: 'worktree'` unless two plans in the wave could
otherwise collide on a file the collision rule didn't catch -- same-wave
plans are supposed to own disjoint files already.

**Step 2b -- Agent tool fallback (Workflow not opted in):**

Dispatch one **non-fork** `Agent` call per plan in the filtered list,
`subagent_type: "general-purpose"`, `model: "sonnet"`. Send all of them in
one message so they run concurrently (a single-plan resume is just one call,
not a batch). Each prompt must be self-contained (fresh agents have no
context): give it the plan file path, the collision rule verbatim, and ask
it to follow `executing-plans` and report back status, files touched, and
test results in its final message.

State this limitation to the user once, don't re-litigate it every wave:
the Agent tool has no per-call reasoning-effort control, so "medium effort"
here is only as good as the session's own configured effort. If the user
needs it pinned, ask them to set effort via `/config` before the run, or use
Workflow instead.

### Step 3: Update the status tracker, not your memory

When the wave's results come back (from either 2a or 2b), immediately write
the outcome into `docs/superpowers/plans/.orchestration-status.md` -- one
line per plan: `Plan | Wave | done/blocked | one-line note`. This file, not
your own recollection of the subagent output, is what Step 1 reads next
time. If a plan is `blocked`, record the blocker verbatim so the next
session (or you, post-compaction) knows what to unblock.

If any plan reported `approx_context_at_end` far outside the calibrated
budget bands in the index, update the bands per `parallel-wave-planning`'s
calibration knob -- write the adjustment into the index, not just a mental
note.

### Step 4: Stitch the wave boundary

Before moving to the next wave, run `stitch` on every (this wave's plan ->
next wave's consuming plan) pair listed in the orchestration index's seam
map. Fix scars now, while the seam is fresh -- don't defer stitching until
the whole run finishes, or the same context-growth problem this skill exists
to avoid creeps back in.

### Step 5: Drop the wave from context and loop

Once the tracker is updated and the seam is stitched, the wave's detail has
no further job in this conversation. Do not re-summarize it, do not keep
reasoning about it. Go back to Step 1: re-read the two persisted files fresh
and decide the next wave purely from what they say now. This is the whole
point -- a 10-wave run should feel, at wave 10, exactly as light as wave 1
did, because nothing except two small files carried forward.

### Step 6: Finish

When the tracker shows every plan `done`, report:

```
Orchestration complete: N plans across W waves.
Final calibrated budget bands: <if adjusted from the index>.
Any blockers left unresolved: <none, or list>.
```

## Remember

- Two files are the entire cross-wave memory: the orchestration index and
  `.orchestration-status.md`. Everything else -- subagent transcripts, your
  own running commentary -- is disposable after the wave that produced it.
- Sonnet 5, medium effort, every plan-execution subagent. Workflow can pin
  this directly; the Agent-tool fallback can only pin the model, not the
  effort -- say so, don't silently approximate it.
- Same-wave plans run in parallel because they own disjoint files (the
  collision rule, from `parallel-wave-planning`). Never start a wave whose
  Consumes aren't fully Produced yet.
- Stitch each wave boundary before advancing, not at the end of the run.
- An interruption or a single blocked/failed plan is never a reason to
  re-run a whole wave or the whole orchestration. Re-derive from the status
  tracker and dispatch only what is not `done` -- one plan alone if that's
  all that's left.
