# EQMS ADR Skill — Integration Guide

## Installation

This skill enforces **Architectural Decision Record** discipline in the EQMS microservice project. It should be stored in your GitHub repo under `/docs/skills/` or referenced in your Claude Code environment.

```
/eqms
  /docs
    /adr           ← ADR records go here (ADR-001.md, ADR-002.md, etc.)
    /skills        ← This skill lives here
      eqms-adr-skill/
        SKILL.md
```

## How It Works

### Trigger Recognition
Claude will activate this skill when you mention:
- "Create an ADR"
- "Document this architectural decision"
- "ADR for [frontend/backend/database decision]"
- Discussing trade-offs between patterns or technologies
- Proposing a breaking change to the layer model

### Output
Claude generates a **lightweight ADR** following the template in `SKILL.md`:
- Status: PROPOSED → (review) → ACCEPTED or DEPRECATED or SUPERSEDED
- Affected Layers: Frontend | Backend | Database
- Consequences table (Positive, Negative)
- Implementation checklist

### Integration with CLAUDE.md
The ADR skill **reinforces** CLAUDE.md constraints:
- Three Laws of Readable Code
- Layer separation (React / FastAPI / SQL Server)
- Permission enforcement in FastAPI `Depends()`
- Naming conventions
- Green aesthetic (#00e676)

---

## Example: Adding the Skill to Claude Code

When starting a Claude Code session on this repo, include in your `.devcontainer.json` or session init:

```json
{
  "skills": [
    "docs/skills/eqms-adr-skill/SKILL.md"
  ]
}
```

Or, in the session prompt:

> "Load the EQMS ADR skill from `/docs/skills/eqms-adr-skill/SKILL.md`"

---

## Team Guidelines

1. **One ADR per major decision** — not every code change.
2. **Review before merge** — ADR is part of the PR definition.
3. **Version ADRs** — if a decision changes, create a new ADR (mark old one DEPRECATED).
4. **Link from CLAUDE.md** — if an ADR becomes a pattern, document it there.

---

## File Naming

```
ADR-###-[kebab-case-slug].md

Examples:
- ADR-001-zustand-vs-react-query.md
- ADR-002-json-field-validation-dual-layer.md
- ADR-003-alembic-forward-reference-strategy.md
```

---

**Owner:** Senior Architect  
**Last Updated:** May 2026
