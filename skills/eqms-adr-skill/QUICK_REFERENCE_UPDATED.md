# EQMS Quick Reference — Enforceable Constraints + Folder Structure

## Mandatory ADR Folder Structure (Enforced by CI/CD)

```
/docs/adr/                           ← REQUIRED location
  ├── INDEX.md                        ← Master registry (required)
  ├── ADR-001-zustand-vs-react-query.md
  ├── ADR-002-json-validation.md
  ├── ADR-003-alembic-strategy.md
  └── _template.md                    ← Reference copy

❌ ADRs in other folders will NOT be indexed
❌ Filenames not matching ADR-###-[slug].md will be rejected
❌ ADRs without INDEX.md entry will block PR
```

### File Naming (Non-Negotiable)
- **Pattern:** `ADR-###-[kebab-case-slug].md`
- **Zero-Padded:** `ADR-001`, `ADR-010`, `ADR-100` (not `ADR-1`)
- **Example:** ✅ `ADR-005-permission-override-precedence.md`
- **Invalid:** ❌ `ADR-5-permissions.md` ❌ `adr_005.md` ❌ `ADR_005_permissions.md`

### INDEX.md (Master Registry)
Every ADR must be registered in `/docs/adr/INDEX.md`:

```markdown
| ADR | Title | Status | Affected Layers | Date |
|-----|-------|--------|-----------------|------|
| ADR-001 | Zustand vs. React Query | ACCEPTED | Frontend | 2026-05-20 |
| ADR-002 | JSON Dual-Layer Validation | ACCEPTED | Backend, Database | 2026-05-21 |
```

- **Keep sorted** by ADR ID (ascending)
- **Update with every new ADR** (blocking PR if missing)
- **Required fields:** Title, Status, Affected Layers, Date
- **Agents use this as entry point** for cross-decision analysis

---

## The Three Laws (Every File)

✓ **Names reveal intent** — No abbreviations, no single-letter vars (except loop `i`)  
✓ **Functions do one thing** — Fits on screen, explicit side effects  
✓ **Comments explain WHY** — Code shows WHAT, comments justify the decision  

---

## Layer Enforcement Contract

```
React          → Presentation only. No business logic.
FastAPI        → Enforces all rules. `Depends()` gates access.
SQL Server     → Single truth. Constraints live here.
```

**Permission Check Route:**
```
UI gate (UX convenience)
     ↓
FastAPI Depends() ← ACTUAL SECURITY BOUNDARY
     ↓
SQL constraint (fallback)
```

---

## When to Create an ADR

Trigger the **EQMS ADR Skill** when making decisions that affect:
- State management (Zustand vs. React Query)
- Permission/role strategy
- Service/Repository/Model flow
- JSON field validation approach
- Alembic migration complexity
- Auth/session handling
- Environment profile changes

**Not every commit.** Only decisions affecting *multiple files, teams, or long-term maintenance*.

**Result:** ADR file goes in `/docs/adr/ADR-###-[slug].md` + INDEX.md is updated

---

## Naming Conventions (Enforce in Code Review)

| Context | Style | Example |
|---------|-------|---------|
| React components | PascalCase | `DocumentVersionPanel.tsx` |
| React hooks | camelCase + `use` | `usePermissions.ts` |
| Python modules | snake_case | `document_service.py` |
| DB columns | snake_case | `document_type_id` |
| Zustand stores | camelCase + `.store.ts` | `auth.store.ts` |
| SQLAlchemy models | PascalCase class, snake_case table | `class Document` → `document` |
| **ADR Filenames** | **ADR-###-kebab-case** | **ADR-001-state-management.md** |

---

## Color Palette (Green Aesthetic)

- **Primary accent:** `#00e676` (full)
- **Dimmed accent:** `#00c853` (hover/disabled)
- **Fallback:** Grayscale if color accessibility fails

---

## Fast Violation Checklist

Before pushing code, verify:

- [ ] No single-letter vars outside loop `i`
- [ ] No `console.log` in production code (use proper logging)
- [ ] No business logic in React components
- [ ] No direct DB queries in routers (go through services)
- [ ] No hardcoded colors (use CSS custom properties from `theme.css`)
- [ ] No commented-out code (delete it)
- [ ] No permission check in React without matching FastAPI `Depends()`
- [ ] No manual DDL in production (only Alembic)
- [ ] No plain tokens in logs (hash them)
- [ ] TypeScript strict mode enabled (`tsconfig.json`)

**ADR-Specific Checks:**
- [ ] ADR file is in `/docs/adr/ADR-###-[slug].md` (exact path)
- [ ] Filename uses zero-padded number (`ADR-001`, not `ADR-1`)
- [ ] INDEX.md has been updated with new ADR entry
- [ ] All required metadata present (Status, Affected Layers, Date, Authors)
- [ ] Status is one of: PROPOSED | ACCEPTED | DEPRECATED

---

## File Locations (No Exceptions)

**Only edit these:**
- `/Frontend/src/*`
- `/Backend/app/*`
- `/Database/migrations/*` (Alembic auto-generated, review only)
- `/Database/seeds/*`
- `/Tests/*`
- **`/docs/adr/*` (ADR files MUST go here)**
- **`/docs/adr/INDEX.md` (must be updated with new ADRs)**

**Never edit:**
- `/Database/sql/` (reference only)
- Alembic `versions/` version files (generated)
- Docker `compose.yml` root (use `.dev.yml`)

---

## Testing Before Push

```bash
# ADR Format Check
ls -la docs/adr/ADR-*.md | grep -E "ADR-[0-9]{3}-[a-z0-9-]+\.md"

# Verify INDEX.md exists
test -f docs/adr/INDEX.md && echo "✅ INDEX.md present"

# Frontend
npm run lint && npm run test:unit

# Backend
pytest app/ -v --cov=app

# E2E (optional)
npx playwright test
```

---

## GitHub Actions Enforcement

CI/CD automatically validates:
- ✅ ADR filenames match `ADR-###-[slug].md`
- ✅ Metadata fields are complete
- ✅ INDEX.md has been updated
- ✅ No ADRs outside `/docs/adr/`
- ✅ Status field is PROPOSED | ACCEPTED | DEPRECATED

**If validation fails:**
1. Fix filename to match format
2. Update INDEX.md
3. Push again

---

## Agent Discovery (Automatic)

Agents query `/docs/adr/INDEX.md` to:
1. Discover all ADRs
2. Filter by Status (ACCEPTED, PROPOSED, DEPRECATED)
3. Filter by Affected Layers (Frontend, Backend, Database)
4. Cross-reference related decisions
5. Prevent new decisions that contradict ACCEPTED ADRs

**Example Query:**
> "Which ACCEPTED ADRs affect the Backend layer?"
> 
> Agent reads INDEX.md → filters Status=ACCEPTED, Layers~="Backend" → returns list

---

**Owner:** Senior Architect | **Repo:** GitHub | **Last Updated:** May 2026
