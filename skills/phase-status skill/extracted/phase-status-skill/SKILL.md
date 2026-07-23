---
name: phase-status-skill
description: "Governs how project phases are tracked, reported, and transitioned. Activates whenever the user asks about current phase, what is blocked or unblocked, exit criteria, what comes next, ADR impact on phases, or requests a status snapshot. Enforces a single canonical Phase Registry per project, a fixed status lexicon (DORMANT / UNBLOCKED / ACTIVE / FOCUS / COMPLETE / SUPERSEDED), and ADR cross-referencing. Auto-binds to whichever project context the skill is running in. **Tags:** phase, status, lifecycle, roadmap, governance **Owner:** Project lead"
---

# Phase Status Skill
## Single Source of Truth for Phase Lifecycle, Status, and Transitions

---

## SKILL METADATA

| Field          | Value |
|----------------|-------|
| **Skill Name** | Phase Status |
| **Version**    | 1.0 |
| **Scope**      | Any project with phased delivery and architectural decision records |
| **Owner**      | Project lead |

---

## PURPOSE

Projects with multiple phases, ratified ADRs, version-tracked requirements, and revised plans tend to drift. "What phase are we in" becomes an argument. This skill is the referee.

This skill exists to:
- Hold the canonical Phase Registry for the project currently in scope
- Define the only legal status values a phase may carry
- Define which ADRs gate which phase transitions
- Define how exit criteria are evaluated
- Prevent silent drift between Project Plan, Requirements, and ADR documents

---

## PROJECT BINDING (How the Skill Knows Which Project)

This skill does **not** ship with hardcoded phase data. It binds to the active project at activation time, in the following order of precedence:

1. **Explicit user pin** — the user names the project (e.g. "run phase status against Project Foo").
2. **Project context** — if running inside a Claude Project, search project knowledge for `phase-status/INDEX.md` or equivalent.
3. **Workspace file** — read `/docs/phase-status/INDEX.md` from the current working directory.
4. **CLAUDE.md or AGENTS.md** — if either declares a `phase-status:` pointer, follow it.
5. **Halt and ask** — if none of the above resolve, the skill asks the user to identify the project before answering.

Once bound, the skill uses that project's Phase Registry and ADR Impact Matrix as authority. Switching projects mid-session requires an explicit re-bind.

---

## TRIGGER PATTERNS

Activate this skill when the user says or implies:

- "What phase are we in?"
- "Status of Phase X"
- "Is Phase Y unblocked?"
- "What's next?" / "What's the current focus?"
- "Has ADR-### moved any phase?"
- "Give me a phase snapshot"
- "Did ratifying X unblock anything?"
- Any request comparing Project Plan vs Requirements vs ADR phase state
- Any creation, editing, or supersession of a phase document

Do NOT activate for: implementation help inside a phase (code, design, math) unless status is in question.

---

## CANONICAL PHASE REGISTRY (TEMPLATE)

Each project maintains one of these tables at `/docs/phase-status/INDEX.md`. It is the single source of truth. All other documents defer to it on conflict.

| Phase | Title                  | Status        | Gating ADRs       | Source of Record |
|-------|------------------------|---------------|-------------------|------------------|
| 01    | [Phase title]          | COMPLETE      | —                 | Plan v#.#        |
| 02    | [Phase title]          | COMPLETE      | ADR-###           | Plan v#.#        |
| 03    | [Phase title]          | FOCUS         | —                 | Plan v#.#        |
| 04    | [Phase title]          | ACTIVE        | ADR-###, ###      | Plan v#.# + Req v#.# |
| 05    | [Phase title]          | UNBLOCKED     | ADR-###           | ADR-###          |
| 06    | [Phase title]          | DORMANT       | ADR-### (pending) | —                |

Update this table whenever an ADR is ratified or a phase exits. The table comes first; prose updates follow.

---

## STATUS LEXICON

Names reveal intent. Six legal status values, no synonyms, no abbreviations.

| Status         | Meaning |
|----------------|---------|
| **DORMANT**    | Phase exists but is not yet runnable. Dependencies unresolved. |
| **UNBLOCKED**  | All gating ADRs ratified. Engineering may start. No active work yet. |
| **ACTIVE**     | Under construction. Code in flight. Acceptance criteria open. |
| **FOCUS**      | Current control point. The phase output the rest of the project depends on right now. At most one phase may hold this at a time. |
| **COMPLETE**   | Exit criteria met. Locked against regression. Outputs treated as truth. |
| **SUPERSEDED** | Replaced or removed. Preserved for history only. Never re-entered. |

**Forbidden states:** `IN_PROGRESS`, `DONE`, `WIP`, `TODO`, `STUCK`, `SOMEWHAT_DONE`. Map them to the lexicon above or do not use them.

---

## STATUS TRANSITION RULES

Phases move in one direction only, except `SUPERSEDED`, which is terminal.

```
DORMANT  ──►  UNBLOCKED  ──►  ACTIVE  ──►  FOCUS  ──►  COMPLETE
   │              │             │           │            │
   └──────────────┴─────────────┴───────────┴─────►  SUPERSEDED
```

### Transition Gates

| From → To                | Required Evidence |
|--------------------------|-------------------|
| DORMANT → UNBLOCKED      | All gating ADRs in `ACCEPTED` status. |
| UNBLOCKED → ACTIVE       | First commit referencing phase ID, or scoped sprint kickoff. |
| ACTIVE → FOCUS           | At most one phase may hold FOCUS at any time. Promoting a new FOCUS forces the prior FOCUS to attempt COMPLETE. |
| FOCUS → COMPLETE         | All P0 acceptance criteria in Requirements register pass. Benchmark or validation results recorded. |
| any → SUPERSEDED         | Explicit ADR or Plan revision that supersedes the phase. |

**Hard rule:** Only one phase may be `FOCUS` at a time. If two phases claim FOCUS, the skill halts and forces disambiguation before answering further status questions.

---

## PHASE STATUS RECORD TEMPLATE

When a phase changes status, emit a record in this exact shape:

```markdown
# Phase ## — [Title]

**Project:** [Project name]
**Phase ID:** ##
**Previous Status:** [DORMANT | UNBLOCKED | ACTIVE | FOCUS | COMPLETE | SUPERSEDED]
**Current Status:**  [DORMANT | UNBLOCKED | ACTIVE | FOCUS | COMPLETE | SUPERSEDED]
**Transition Date:** YYYY-MM-DD
**Triggering ADR(s):** ADR-### [, ADR-### ...]
**Source Document(s):** Plan v#.#, Req v#.#

---

## Why This Transition

[One paragraph. Cite the gate satisfied. No marketing language.]

## Exit Criteria Status (only for ACTIVE → FOCUS or FOCUS → COMPLETE)

| Criterion ID | Description | Pass / Open |
|--------------|-------------|-------------|
| F##-##       | …           | ✅ / ⏳       |

## Downstream Effects

- Phase ## moves [DORMANT → UNBLOCKED] because [reason].
- Requirement ID F##-## now [BLOCKED | TESTABLE | UNBLOCKED].

## Related Records

- ADR-###
- Phase Status Record [previous related]
```

---

## ADR → PHASE IMPACT MATRIX (TEMPLATE)

When an ADR is ratified, this skill audits which phases it touches and rewrites their status accordingly. Each project maintains its own matrix at `/docs/phase-status/IMPACT-MATRIX.md`:

| ADR     | Title                  | Phases Touched | Effect                       |
|---------|------------------------|----------------|------------------------------|
| ADR-001 | [Decision title]       | 0X             | UNBLOCKED gate met           |
| ADR-002 | [Decision title]       | 0X, 0Y         | 0Y → UNBLOCKED               |
| ADR-003 | [Decision title]       | All (formal)   | New phase created (DORMANT)  |

Rule: an ADR ratification PR is incomplete until this matrix is updated.

---

## REPORTING PROTOCOL

When the user asks "what is the status," respond with this shape, in this order:

1. **FOCUS phase** — one line. The current control point. This is what matters today.
2. **ACTIVE phases** — bullet list with last-touched date if known.
3. **UNBLOCKED phases** — phases that could start tomorrow, listed by ADR readiness.
4. **DORMANT phases** — phases waiting on at least one unresolved gate. List the gate.
5. **COMPLETE phases** — collapse to a single line: "Phases NN, NN, NN locked."
6. **SUPERSEDED phases** — only mention if relevant to the question.

Keep snapshots under twelve lines unless the user asks for the long form. Token efficiency is a requirement, not a courtesy.

---

## APPROVAL CHECKLIST (per status change)

Before declaring a phase transition complete, verify:

- [ ] Phase Registry table updated
- [ ] Only one phase holds FOCUS
- [ ] Status value is from the legal lexicon (no synonyms)
- [ ] Triggering ADR is in `ACCEPTED` state, not `PROPOSED`
- [ ] If FOCUS → COMPLETE: all P0 acceptance criteria recorded as pass
- [ ] Downstream phases re-evaluated and updated in the same change
- [ ] ADR → Phase Impact Matrix reflects this transition
- [ ] Readable code rules applied: names reveal intent, one purpose per section, comments explain why

---

## NAMING CONVENTIONS

| Artifact                  | Convention                                | Example |
|---------------------------|-------------------------------------------|---------|
| Phase Status Record file  | `PHASE-##[suffix]-STATUS-YYYY-MM-DD.md`   | `PHASE-04-STATUS-2026-05-17.md` |
| Phase ID in prose         | `Phase 04` (capitalised, zero-pad below 10)| — |
| Status value in prose     | `**FOCUS**` (bold, uppercase, no abbreviation) | — |
| Folder                    | `/docs/phase-status/`                     | — |
| Master index              | `/docs/phase-status/INDEX.md`             | — |

---

## CONFLICT RESOLUTION

If the Project Plan, a Requirements document, and an ADR disagree on a phase's status, this skill applies the following precedence:

1. Most recently `ACCEPTED` ADR
2. Most recent Requirements version
3. Project Plan
4. Memory or inferred state — never used as primary evidence

When precedence cannot resolve a conflict, the skill **halts and asks** rather than guessing.

---

## EXAMPLE — Snapshot Response

> **User:** "Where are we?"
>
> **FOCUS:** Phase 03 — [title]. Benchmarks in flight.
> **ACTIVE:** Phase 04 — three ADRs cleared; first prototype underway.
> **UNBLOCKED:** Phase 05, Phase 07.
> **DORMANT:** Phase 06, 08. Phase 08 waits on ADR-### scoping.
> **COMPLETE:** Phases 01–02 locked.

---

## EXAMPLE — Transition Record

> **User:** "ADR-### was just ratified. Update status."
>
> Phase 08 — [title]. Previous: did not exist. Current: **DORMANT**. Triggering ADR: ADR-###. No downstream phases re-blocked. Registry table updated. Impact Matrix updated.

---

## TOKEN BUDGET

- Snapshot answer: ≤ 12 lines. ~250 tokens.
- Full transition record: ~600 tokens.
- Skill load overhead: ~1,200 tokens cached per session.

If the user asks for status in passing, default to the snapshot. Long form only on request.

---

## INSTALLATION (per project)

1. Copy this skill to `/docs/skills/phase-status-skill/SKILL.md`.
2. Create `/docs/phase-status/INDEX.md` with the project's Phase Registry table populated.
3. Create `/docs/phase-status/IMPACT-MATRIX.md` with the ADR → Phase Impact Matrix.
4. Reference this skill from `CLAUDE.md` or the equivalent project instruction file, including a `phase-status:` pointer to the INDEX path so the binding step resolves automatically.

---

## FINAL CHECKLIST (for skill installation)

- [ ] File at `/docs/skills/phase-status-skill/SKILL.md`
- [ ] Phase Registry populated with the project's actual phases
- [ ] ADR → Phase Impact Matrix populated with the project's actual ADRs
- [ ] Status lexicon enforced (no `IN_PROGRESS`, `DONE`, etc.)
- [ ] One-FOCUS invariant tested
- [ ] Project binding pointer present in `CLAUDE.md` (or equivalent)
- [ ] Cross-links to ADR skill and Requirements documents

---

**Version:** 1.0
**Last Updated:** 2026-05-17
**Status:** Production-ready
**Pairs with:** Any ADR governance skill
