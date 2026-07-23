LC# EQMS Architectural Decision Record (ADR) Skill

**Trigger:** "Create an ADR", "document this decision", "ADR for...", architectural trade-off discussions, or major design pivots affecting Frontend, Backend, or Database layers.

---

## Purpose

ADRs preserve the **why** behind architectural choices in the EQMS microservice. They form a narrative audit trail for FastAPI rules, React patterns, or SQL Server constraints that might otherwise vanish when the original developer leaves.

**Agent Discoverability:** All ADRs are indexed and discoverable by Claude and other agents for cross-decision analysis.

---

## Mandatory Folder Structure

**Every ADR must be stored in this exact location:**

```
/docs/adr/                              ← ADR root (required)
  ├── INDEX.md                          ← Master index (auto-updated)
  ├── ADR-001-zustand-vs-react-query.md
  ├── ADR-002-json-field-validation.md
  ├── ADR-003-alembic-strategy.md
  ├── ADR-004-permission-override-precedence.md
  └── _template.md                      ← Reference template
```

### File Naming (Enforced by CI/CD)
- **Pattern:** `ADR-###-[kebab-case-slug].md`
- **Format:** Pad numbers with zeros: `ADR-001`, `ADR-010`, `ADR-100`
- **Examples:**
  - ✅ `ADR-001-zustand-vs-react-query.md`
  - ✅ `ADR-012-jwt-session-hybrid.md`
  - ❌ `ADR-1-state.md` (wrong padding)
  - ❌ `adr-001-state.md` (wrong case)
  - ❌ `ADR_001_state_management.md` (wrong separator)

### Why This Structure
1. **Agent Indexing** — Agents scan `/docs/adr/` and auto-discover `ADR-###-*` files
2. **Chronological Order** — Numbers preserve decision sequence
3. **Human Readable** — Slug describes the decision in English
4. **GitHub Searchable** — Easy to find via repo search
5. **Migration Safe** — If moved, folder path is always `/docs/adr/`

---

## INDEX.md (Required — Auto-Updated)

The master index lives at `/docs/adr/INDEX.md`. It lists all active ADRs in table format.

```markdown
# EQMS Architectural Decision Records

| ADR | Title | Status | Layer | Date |
|-----|-------|--------|-------|------|
| ADR-001 | Zustand vs. React Query | ACCEPTED | Frontend | 2026-05-20 |
| ADR-002 | JSON Field Dual-Layer Validation | ACCEPTED | Backend/Database | 2026-05-21 |
| ADR-003 | Alembic Forward Reference Strategy | PROPOSED | Database | 2026-05-22 |

**Legend:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
```

**Auto-Update Script** (optional, for GitHub Actions):
```bash
#!/bin/bash
# Scan ADRs and rebuild INDEX.md
for file in ADR-*.md; do
  ADR_ID=$(echo $file | sed 's/ADR-\([0-9]*\)-.*/\1/')
  # Extract status, title from YAML frontmatter
  # Update INDEX.md table row
done
```

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
**ADR ID:** ADR-###  
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

- [ ] File is saved in `/docs/adr/ADR-###-[slug].md`
- [ ] Filename uses zero-padded format (`ADR-001`, not `ADR-1`)
- [ ] Metadata section (first 10 lines) is complete
- [ ] STATUS is one of: PROPOSED | ACCEPTED | DEPRECATED
- [ ] Aligns with **Three Laws of Readable Code**
- [ ] Enforces layer separation (React/FastAPI/SQL Server boundary)
- [ ] Permission checks happen in FastAPI `Depends()`, not React
- [ ] JSON field validation is dual-layer (Pydantic + SQL `ISJSON()`)
- [ ] Alembic migration strategy is clear (no manual DDL)
- [ ] Naming follows CLAUDE.md conventions
- [ ] Green (`#00e676`) aesthetic applied if UI-facing
- [ ] INDEX.md has been updated with new ADR entry

---

## Agent Discovery Protocol

When Claude or another agent processes this skill:

1. **Scan:** Look for `/docs/adr/INDEX.md` as the entry point
2. **Index:** Read master index to find all ADR files
3. **Parse:** Extract metadata from each `ADR-###-*.md` file
4. **Cross-Reference:** Identify related ADRs (from "Related ADRs" section)
5. **Enforce:** Check that new decisions don't contradict accepted ADRs
6. **Report:** Summarize decision history and affected layers

**Example Agent Query:**
> "Show me all ACCEPTED ADRs affecting the Backend layer"
> 
> Agent searches `/docs/adr/INDEX.md`, filters by status + layer, returns list.

---

## GitHub Actions Enforcement

Add to `.github/workflows/lint.yml`:

```yaml
- name: Validate ADR Format
  run: |
    for file in docs/adr/ADR-[0-9]*.md; do
      if [[ ! $file =~ ADR-[0-9]{3}-[a-z-]+\.md ]]; then
        echo "❌ Invalid ADR filename: $file"
        exit 1
      fi
      if ! grep -q "^Status:" "$file"; then
        echo "❌ Missing Status field in $file"
        exit 1
      fi
    done
    echo "✅ All ADRs valid"
```

---

**Constraint:** Every ADR must be reviewable by the entire team in <5 minutes.

**Constraint:** ADR folder structure is mandatory and enforced by CI/CD. No exceptions.

---

*Last Updated: May 2026*
