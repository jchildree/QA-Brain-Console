# EQMS Architectural Decision Record (ADR) Skill

**Trigger:** "Create an ADR", "document this decision", "ADR for...", architectural trade-off discussions, or major design pivots affecting Frontend, Backend, or Database layers.

---

## Purpose

ADRs preserve the **why** behind architectural choices in the EQMS microservice. They form a narrative audit trail for FastAPI rules, React patterns, or SQL Server constraints that might otherwise vanish when the original developer leaves.

---

## When to ADR

- Choosing between Frontend state (Zustand vs. React Query)
- Adding a new permission gate or role combination
- Modifying the service → repository → model flow
- SQL Server JSON field validation strategy
- Alembic migration complexity (forward refs, FTS, etc.)
- Authentication/session handling changes
- Docker Compose environment profile adjustments

**Not every code commit needs an ADR.** Use them for decisions that affect *multiple files, teams, or future maintainability*.

---

## Template (Lightweight EQMS Variant)

```markdown
# ADR-###: [Short Title]

**Project:** EQMS  
**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
**Date:** YYYY-MM-DD  
**Authors:** [Your Name]  
**Affected Layers:** Frontend | Backend | Database

---

## Context
[What problem are we solving? What constraints exist?]

## Decision
[What are we doing?]

| Aspect | Details |
|--------|---------|
| **Primary** | ... |
| **Rationale** | ... |
| **Trade-offs** | ... |

## Consequences

| Positive | Negative |
|----------|----------|
| [Benefit] | [Cost] |

## Implementation Notes
[Code location, config changes, testing scope]

## Related ADRs
- ADR-XXX: ...
```

---

## Checklist Before Approval

- [ ] Aligns with **Three Laws of Readable Code**
- [ ] Enforces layer separation (React/FastAPI/SQL Server boundary)
- [ ] Permission checks happen in FastAPI `Depends()`, not React
- [ ] JSON field validation is dual-layer (Pydantic + SQL `ISJSON()`)
- [ ] Alembic migration strategy is clear (no manual DDL)
- [ ] Naming follows CLAUDE.md conventions
- [ ] Green (`#00e676`) aesthetic applied if UI-facing

---

## File Location

Save as: `/docs/adr/ADR-###-[slug].md` in the GitHub repo.

---

**Constraint:** Every ADR must be reviewable by the entire team in <5 minutes.
