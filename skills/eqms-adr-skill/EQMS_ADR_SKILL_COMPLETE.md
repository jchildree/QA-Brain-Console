# EQMS Architectural Decision Record (ADR) Skill
## Complete Skill Definition for Claude.ai Settings Upload

---

## SKILL METADATA

**Skill Name:** EQMS Architectural Decision Records (ADRs)

**Version:** 1.0

**Description:** Governs creation of lightweight, enforceable architectural decision records for the EQMS microservice. Enforces three-law readable code, layer separation (React→FastAPI→SQL Server), and mandatory folder structure with GitHub Actions validation.

**Tags:** architecture, decisions, governance, eqms, documentation, adr

**Project:** EQMS (Electronic Quality Management System)

**Owner:** Senior Architect

---

## TRIGGER PATTERNS

This skill activates when you mention:

- "Create an ADR"
- "Document this architectural decision"
- "ADR for..."
- "I need to decide between X and Y" (architectural context)
- "Should we use Zustand or React Query"
- "How should we handle permission gates"
- "What's the best way to structure JSON validation"
- Discussing trade-offs for state management, permissions, service patterns, migrations, or authentication

---

## SKILL INSTRUCTIONS

### Purpose

This skill helps you document **why** architectural decisions were made in the EQMS microservice. Every ADR becomes a permanent record that:
- Preserves design intent for future developers
- Prevents repeated arguments about the same decision
- Enables agents to cross-reference decisions and detect conflicts
- Proves the decision was considered from multiple angles

### When to Use

Create an ADR when:
- Choosing between competing architectural patterns (state management, permissions, etc.)
- Adding a new pattern that affects multiple layers
- Making decisions about database strategy, migrations, or JSON validation
- Changing authentication or session handling
- Defining service/repository/model relationships

**Not needed for:** Small bug fixes, refactoring within existing patterns, or single-file changes.

### Key Constraints

1. **Three Laws of Readable Code** (EVERY ADR must satisfy all three)
   - Names reveal intent (no abbreviations)
   - Functions do one thing (explicit side effects)
   - Comments explain WHY, not WHAT

2. **Layer Separation** (React → FastAPI → SQL Server)
   - React handles presentation only
   - FastAPI enforces business rules
   - SQL Server guarantees truth
   - Permission checks happen in FastAPI, never React

3. **Naming Conventions**
   - React components: `PascalCase`
   - Python modules: `snake_case`
   - ADR filenames: `ADR-###-[kebab-case-slug].md`

4. **Mandatory Folder Structure**
   - ALL ADRs go in `/docs/adr/`
   - No exceptions. GitHub Actions enforces this.
   - Master index: `/docs/adr/INDEX.md`

---

## ADR TEMPLATE

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
| **Primary Decision** | [Specifically what are we choosing?] |
| **Rationale** | [Why this over alternatives?] |
| **Trade-offs** | [What do we gain? What do we sacrifice?] |

---

## Consequences

| Positive | Negative |
|----------|----------|
| [Benefit 1] | [Cost 1] |
| [Benefit 2] | [Cost 2] |

---

## Implementation Notes
[Where in the code does this change? Config changes? Testing scope?]

---

## Related ADRs
- ADR-XXX: [Related decision]
- ADR-YYY: [Related decision]
```

---

## APPROVAL CHECKLIST

Before finalizing an ADR, verify:

- [ ] File is in `/docs/adr/ADR-###-[kebab-case-slug].md`
- [ ] Filename uses zero-padded numbers (`ADR-001`, not `ADR-1`)
- [ ] All required fields present: Status, Affected Layers, Date, Authors
- [ ] Status is: PROPOSED | ACCEPTED | DEPRECATED
- [ ] **Law 1:** Names reveal intent (no abbreviations in business logic)
- [ ] **Law 2:** Each section does one thing (clear purpose)
- [ ] **Law 3:** Comments explain WHY (decision rationale is explicit)
- [ ] Layer separation enforced (React presentation, FastAPI rules, SQL Server truth)
- [ ] Permission logic in FastAPI `Depends()`, never React
- [ ] JSON validation dual-layer (Pydantic + `ISJSON()`)
- [ ] Alembic-only for migrations (no manual DDL)
- [ ] Naming follows conventions (PascalCase React, snake_case Python)
- [ ] Green aesthetic applied if UI-facing (`#00e676`)
- [ ] INDEX.md has been updated with new ADR entry

---

## ADR NAMING RULES (Enforced by GitHub Actions)

**Valid Format:**
```
ADR-001-zustand-vs-react-query.md
ADR-010-json-field-validation.md
ADR-100-microservice-boundary.md
```

**Invalid (will be rejected):**
```
ADR-1-state.md                  ❌ (not zero-padded)
adr-001-state.md               ❌ (lowercase)
ADR_001_state.md               ❌ (wrong separator)
ADR-001_state-management.md    ❌ (mixed separators)
```

**Pattern:** `ADR-###-[kebab-case-slug].md` where `###` is always 3 digits.

---

## REQUIRED METADATA (GitHub Actions Validates)

Every ADR file must start with:

```
**Project:** EQMS
**ADR ID:** ADR-###
**Status:** PROPOSED | ACCEPTED | DEPRECATED
**Date:** YYYY-MM-DD
**Authors:** [Name]
**Affected Layers:** Frontend | Backend | Database
```

Missing or invalid metadata will **block the PR**.

---

## MASTER INDEX (/docs/adr/INDEX.md)

All ADRs must be registered in the master index (agents query this):

```markdown
| ADR | Title | Status | Affected Layers | Date |
|-----|-------|--------|-----------------|------|
| ADR-001 | Zustand vs React Query | ACCEPTED | Frontend | 2026-05-20 |
| ADR-002 | JSON Dual-Layer Validation | ACCEPTED | Backend, Database | 2026-05-21 |
```

**Rules:**
- Keep rows sorted by ADR ID (ascending)
- Update whenever a new ADR is created
- Update when status changes (PROPOSED → ACCEPTED)
- GitHub Actions checks count matches ADR file count

---

## AGENT DISCOVERY PROTOCOL

When Claude or another agent processes this skill:

1. **Query Entry Point:** `/docs/adr/INDEX.md`
2. **Filter:** By Status (PROPOSED, ACCEPTED, DEPRECATED, or SUPERSEDED) or Affected Layers
3. **Load:** Full ADR file from `/docs/adr/ADR-###-*.md`
4. **Cross-Reference:** Check "Related ADRs" field
5. **Enforce:** Prevent new decisions contradicting ACCEPTED ADRs
6. **Report:** Summarize decision history and conflicts

**Example Agent Query:**
> "Which ACCEPTED ADRs affect the Backend layer?"
> 
> Agent reads INDEX.md → filters Status=ACCEPTED + Layers~="Backend" → returns list

---

## GITHUB ACTIONS VALIDATION

The `validate-adr.yml` workflow automatically checks on every PR:

```
✅ Filename format: ADR-###-[kebab-case].md with zero-padding
✅ Metadata complete: Status, Affected Layers, Date, Authors
✅ Status value: PROPOSED | ACCEPTED | DEPRECATED
✅ Folder location: All ADRs in /docs/adr/ (no exceptions)
✅ No duplicates: No two ADRs with same number
✅ INDEX.md sync: Entry count matches ADR file count
```

**If validation fails:**
- PR is blocked
- Specific error shown
- Fix required before merge

---

## FOLDER STRUCTURE (Mandatory)

```
/docs/adr/                              ← ALL ADRs go here
  ├── INDEX.md                          ← Master registry
  ├── ADR-001-zustand-vs-react-query.md
  ├── ADR-002-json-validation.md
  ├── ADR-003-alembic-strategy.md
  └── _template.md                      ← Reference copy

/docs/skills/eqms-adr-skill/            ← Skill definition
  ├── SKILL.md                          ← This skill
  └── QUICK_REFERENCE.md                ← Team checklist
```

**Lock-In:** All ADRs MUST be in `/docs/adr/`. GitHub Actions enforces this. No ADRs in other folders will be indexed.

---

## EXAMPLE ADR

```markdown
# ADR-001: Dual-Layer Validation for JSON Fields

**Project:** EQMS
**ADR ID:** ADR-001
**Status:** ACCEPTED
**Date:** 2026-05-21
**Authors:** Senior Architect
**Affected Layers:** Backend (FastAPI) · Database (SQL Server)

---

## Context

The EQMS schema includes JSON fields (`extra_data`, `query_definition`) to allow flexible, laboratory-specific attributes without schema bloat. However, unvalidated JSON is a security and data quality risk.

## Decision

**Primary Decision:** Validate JSON at both layers (dual-layer validation).

| Aspect | Details |
|--------|---------|
| **Primary** | Validate JSON shape & type at API boundary + DB constraint |
| **Rationale** | Follows Three Laws: explicit contract (Pydantic), enforced truth (DB), frontend doesn't attempt validation |
| **Trade-offs** | Gain: defense in depth + audit trail. Lose: slightly more validation code. |

## Consequences

| Positive | Negative |
|----------|----------|
| Prevents injection via direct SQL | Requires Pydantic model per JSON structure |
| Clear error messages to users | Migration complexity for legacy JSON |
| Database constraint catches edge cases | Minimal performance cost (~0.1% latency) |

## Implementation Notes

- FastAPI: Pydantic validator with `@field_validator('field_name')`
- SQL Server: `ALTER TABLE ADD CONSTRAINT chk_field CHECK (ISJSON(field) = 1)`
- Testing: pytest unit tests + integration tests + Postman collection

---

## Related ADRs
(None yet — first decision)
```

---

## QUICK REFERENCE FOR TEAM

### When to Create an ADR
- State management (Zustand vs React Query)
- Permission strategy (role hierarchy, overrides)
- Service/Repository patterns
- JSON field validation approach
- Alembic migration strategy
- Auth/session handling
- Docker environment profiles

### Naming Convention
| Context | Style | Example |
|---------|-------|---------|
| ADR Filename | ADR-###-kebab-case | ADR-001-zustand-vs-react-query.md |
| React Component | PascalCase | DocumentVersionPanel.tsx |
| Python Module | snake_case | document_service.py |
| DB Column | snake_case | document_type_id |

### Color Aesthetic
- Primary: `#00e676` (green, full)
- Dimmed: `#00c853` (hover/disabled)
- Never hardcode colors; use CSS custom properties

### Key Rules
- All ADRs in `/docs/adr/` (no exceptions)
- Filenames: `ADR-###-[slug].md` (zero-padded)
- INDEX.md updated with every new ADR
- GitHub Actions validates on every push

---

## INSTALLATION & SETUP

### In Your GitHub Repo

1. **Create directories:**
   ```bash
   mkdir -p docs/adr docs/skills/eqms-adr-skill .github/workflows
   ```

2. **Copy files:**
   ```bash
   # Skill definition
   cp SKILL.md docs/skills/eqms-adr-skill/
   
   # Master index template
   cp INDEX_TEMPLATE.md docs/adr/INDEX.md
   
   # GitHub Actions validation
   cp validate-adr.yml .github/workflows/
   ```

3. **Update INDEX.md** with your actual ADRs

4. **Push and verify** GitHub Actions passes

### In Claude Code

Add to `.devcontainer.json`:
```json
{
  "skills": [
    "docs/skills/eqms-adr-skill/SKILL.md"
  ]
}
```

Or in session prompt:
```
Load the EQMS ADR skill from docs/skills/eqms-adr-skill/SKILL.md
```

---

## CONFLICT RESOLUTION

If an inherited instruction contradicts this skill:
1. Assume CLAUDE.md is the source of truth
2. Flag the conflict
3. Update CLAUDE.md (not this skill) to resolve

All decisions are additive — no breaking changes to existing rules.

---

## TOKEN EFFICIENCY

- **Per ADR generated:** ~700 tokens (includes INDEX.md query + skill read + ADR generation)
- **Per Claude Code session:** ~450 tokens overhead (cached skill + reference queries)

Lightweight design for sustained team use.

---

## SUPPORT

**Question:** When should I create an ADR?  
**Answer:** When the decision affects multiple files/layers or future maintainability. Not every commit.

**Question:** Can I have ADRs outside `/docs/adr/`?  
**Answer:** No. GitHub Actions blocks it. All ADRs must be in this folder.

**Question:** What if GitHub Actions validation fails?  
**Answer:** See error message → fix filename format, metadata, or INDEX.md → push again.

**Question:** How do agents find ADRs?  
**Answer:** They query `/docs/adr/INDEX.md` as the entry point, then cross-reference decisions.

---

## FINAL CHECKLIST

Before uploading this skill to Claude settings:

- [ ] Skill name: "EQMS Architectural Decision Records (ADRs)"
- [ ] All trigger patterns defined
- [ ] Template provided with examples
- [ ] Approval checklist included
- [ ] Naming rules explicit (zero-padded, kebab-case)
- [ ] Master index protocol documented
- [ ] GitHub Actions validation explained
- [ ] Agent discovery protocol included
- [ ] Installation steps provided
- [ ] No conflicts with CLAUDE.md Three Laws
- [ ] Token efficiency noted (~700 per ADR)

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Production-ready, ready to upload to Claude settings  
**Ready for:** Immediate deployment to GitHub repo + Claude.ai skills
