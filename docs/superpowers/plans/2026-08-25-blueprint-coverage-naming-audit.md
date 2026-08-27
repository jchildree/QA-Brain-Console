# Blueprint Coverage & Naming Consistency Audit

**Wave:** 2 (parallel with blueprint-backend-consistency-audit)
**Consumes:** none
**Produces:** SOP page rename (Dashboard.tsx -> SopDashboard.tsx, Intake.tsx -> SopIntake.tsx), updated App.tsx routing imports
**Owns exclusively:** app/frontend/src/pages/Dashboard.tsx, app/frontend/src/pages/Intake.tsx (renames), app/frontend/src/App.tsx

**Date:** 2026-08-25  
**Depth:** 5 (leaf, executable plan)  
**Scope:** Verify all 8 blueprints have corresponding Dashboard/Editor/Intake page variants, ensure blueprint type names are consistent across codebase, validate blueprint exports match page imports, confirm no orphan blueprints or missing variants.

---

## Goal

Ensure:
1. Each of the 8 blueprints (auditBlueprint, capBlueprint, changeBlueprint, incidentBlueprint, meetingBlueprint, notesBlueprint, sopBlueprint, trainingBlueprint) has complete page coverage (Dashboard + Editor + Intake)
2. Blueprint export names match their imports in pages (no mismatches or typos)
3. Page file names follow a consistent naming convention across all record types
4. No orphan blueprints exist without corresponding pages
5. No orphan pages exist without corresponding blueprints

Result: A single source of truth for blueprint-page relationships, consistent naming that aids discoverability, and no silent import/export mismatches.

---

## Context

### Architecture Overview

The QA Brain console has two-layer decoupling:

1. **Blueprint files** (8 total): `app/frontend/src/blueprint/*Blueprint.ts`
   - Each exports a named constant: `sopBlueprint`, `capBlueprint`, etc.
   - One exception: `notesBlueprint.ts` exports TWO variants: `notesBlueprint` + `notesBlueprintAdmin`
   - Blueprints define the UI form schema for record editing/intake

2. **Page files** (3 layers per record type): `app/frontend/src/pages/`
   - **Dashboard pages** (~8): Display record lists/metrics. Do NOT import blueprints (use generic `RecordDashboard` component)
   - **Editor pages** (~8): Edit existing records. Import and pass blueprint to `RecordEditor` component
   - **Intake pages** (~8): Create new records from raw text. Import and pass blueprint to `RecordIntake` component

### Design Patterns

- **Editors & Intakes** follow strict type-specific naming: `{Type}Editor.tsx`, `{Type}Intake.tsx`
  - Example: `AuditEditor.tsx`, `CapIntake.tsx`, `IncidentEditor.tsx`

- **Dashboards** mostly follow same pattern (`AuditDashboard.tsx`, etc.) **EXCEPT:**
  - SOP: Uses generic `Dashboard.tsx` (not `SopDashboard.tsx`)
  - Notes: Uses plural `NotesDashboard.tsx` (not `NoteDashboard.tsx`)

- **Intakes** also have one anomaly:
  - SOP: Uses generic `Intake.tsx` (not `SopIntake.tsx`)
  - All others are type-specific

- **Import consistency rule:** Each Editor/Intake page should import its blueprint from the corresponding `*Blueprint.ts` file
  - Example: `SopEditor.tsx` imports from `sopBlueprint.ts`

---

## Current State Audit

### Blueprint Files (8)

| Blueprint File | Export Name(s) | Type | Notes |
|---|---|---|---|
| `auditBlueprint.ts` | `auditBlueprint` | Single | ✓ |
| `capBlueprint.ts` | `capBlueprint` | Single | ✓ |
| `changeBlueprint.ts` | `changeBlueprint` | Single | ✓ |
| `incidentBlueprint.ts` | `incidentBlueprint` | Single | ✓ |
| `meetingBlueprint.ts` | `meetingBlueprint` | Single | ✓ |
| `notesBlueprint.ts` | `notesBlueprint`, `notesBlueprintAdmin` | Dual | ✓ Special case (admin variant) |
| `sopBlueprint.ts` | `sopBlueprint` | Single | ✓ |
| `trainingBlueprint.ts` | `trainingBlueprint` | Single | ✓ |

**Finding:** All blueprint exports are present and consistent. ✓

---

### Page Coverage Matrix

| Record Type | Blueprint | Dashboard Page | Editor Page | Intake Page | Status |
|---|---|---|---|---|---|
| **Audit** | `auditBlueprint` | `AuditDashboard.tsx` | `AuditEditor.tsx` ✓ imports | `AuditIntake.tsx` ✓ imports | ✓ Complete |
| **CAP** | `capBlueprint` | `CapDashboard.tsx` | `CapEditor.tsx` ✓ imports | `CapIntake.tsx` ✓ imports | ✓ Complete |
| **Change** | `changeBlueprint` | `ChangeDashboard.tsx` | `ChangeEditor.tsx` ✓ imports | `ChangeIntake.tsx` ✓ imports | ✓ Complete |
| **Incident** | `incidentBlueprint` | `IncidentDashboard.tsx` | `IncidentEditor.tsx` ✓ imports | `IncidentIntake.tsx` ✓ imports | ✓ Complete |
| **Meeting** | `meetingBlueprint` | `MeetingDashboard.tsx` | `MeetingEditor.tsx` ✓ imports | `MeetingIntake.tsx` ✓ imports | ✓ Complete |
| **Notes** | `notesBlueprint` + `notesBlueprintAdmin` | `NotesDashboard.tsx` | `NoteEditor.tsx` ✓ imports both | `NoteIntake.tsx` ✓ imports both | ✓ Complete |
| **SOP** | `sopBlueprint` | `Dashboard.tsx` ⚠ GENERIC NAME | `SopEditor.tsx` ✓ imports | `Intake.tsx` ⚠ GENERIC NAME | ⚠ Naming Issue |
| **Training** | `trainingBlueprint` | `TrainingDashboard.tsx` | `TrainingEditor.tsx` ✓ imports | `TrainingIntake.tsx` ✓ imports | ✓ Complete |

**Finding:** All 8 blueprints have complete page coverage (Dashboard + Editor + Intake). ✓

---

### Blueprint Import/Export Verification

#### Editor Pages Blueprint Imports (All Correct)

```
AuditEditor.tsx          → imports auditBlueprint from auditBlueprint.ts ✓
CapEditor.tsx            → imports capBlueprint from capBlueprint.ts ✓
ChangeEditor.tsx         → imports changeBlueprint from changeBlueprint.ts ✓
IncidentEditor.tsx       → imports incidentBlueprint from incidentBlueprint.ts ✓
MeetingEditor.tsx        → imports meetingBlueprint from meetingBlueprint.ts ✓
NoteEditor.tsx           → imports notesBlueprint + notesBlueprintAdmin from notesBlueprint.ts ✓
SopEditor.tsx            → imports sopBlueprint from sopBlueprint.ts ✓
TrainingEditor.tsx       → imports trainingBlueprint from trainingBlueprint.ts ✓
```

**Finding:** All imports are correct and match their export names. ✓ No mismatches or typos.

#### Intake Pages Blueprint Imports (All Correct)

```
AuditIntake.tsx          → imports auditBlueprint from auditBlueprint.ts ✓
CapIntake.tsx            → imports capBlueprint from capBlueprint.ts ✓
ChangeIntake.tsx         → imports changeBlueprint from changeBlueprint.ts ✓
IncidentIntake.tsx       → imports incidentBlueprint from incidentBlueprint.ts ✓
MeetingIntake.tsx        → imports meetingBlueprint from meetingBlueprint.ts ✓
NoteIntake.tsx           → imports notesBlueprint + notesBlueprintAdmin from notesBlueprint.ts ✓
Intake.tsx (SOP)         → imports sopBlueprint from sopBlueprint.ts ✓
TrainingIntake.tsx       → imports trainingBlueprint from trainingBlueprint.ts ✓
```

**Finding:** All imports are correct. ✓

#### Dashboard Pages Blueprint Imports (Expected: None)

All Dashboard pages use generic `RecordDashboard` component without importing blueprints. ✓
(Blueprints are only used by Editor/Intake pages for form rendering, not by Dashboard/list pages.)

---

### Naming Consistency Audit

#### Dashboard Page Names

| Record Type | Current Name | Expected (Consistent) | Issue |
|---|---|---|---|
| Audit | `AuditDashboard.tsx` | `AuditDashboard.tsx` | ✓ |
| CAP | `CapDashboard.tsx` | `CapDashboard.tsx` | ✓ |
| Change | `ChangeDashboard.tsx` | `ChangeDashboard.tsx` | ✓ |
| Incident | `IncidentDashboard.tsx` | `IncidentDashboard.tsx` | ✓ |
| Meeting | `MeetingDashboard.tsx` | `MeetingDashboard.tsx` | ✓ |
| Notes | `NotesDashboard.tsx` | `NoteDashboard.tsx` or `NotesDashboard.tsx`? | ⚠ Plural ambiguity |
| **SOP** | **`Dashboard.tsx`** | **`SopDashboard.tsx`** | ✗ **INCONSISTENT** |
| Training | `TrainingDashboard.tsx` | `TrainingDashboard.tsx` | ✓ |

**Findings:**
1. **SOP Dashboard naming is inconsistent:** Uses generic `Dashboard.tsx` instead of `SopDashboard.tsx`, breaking the {Type}Dashboard naming pattern
2. **Notes Dashboard uses plural:** `NotesDashboard.tsx` (plural) vs `NoteDashboard.tsx` (singular). Plural is intentional (represents a personal notes collection) and consistent with `notesBlueprint.ts` (also plural)

#### Editor Page Names

All consistent: `{Type}Editor.tsx` pattern ✓

#### Intake Page Names

| Record Type | Current Name | Expected (Consistent) | Issue |
|---|---|---|---|
| Audit | `AuditIntake.tsx` | `AuditIntake.tsx` | ✓ |
| CAP | `CapIntake.tsx` | `CapIntake.tsx` | ✓ |
| Change | `ChangeIntake.tsx` | `ChangeIntake.tsx` | ✓ |
| Incident | `IncidentIntake.tsx` | `IncidentIntake.tsx` | ✓ |
| Meeting | `MeetingIntake.tsx` | `MeetingIntake.tsx` | ✓ |
| Notes | `NoteIntake.tsx` | `NoteIntake.tsx` | ✓ Singular matches NoteEditor (singular) |
| **SOP** | **`Intake.tsx`** | **`SopIntake.tsx`** | ✗ **INCONSISTENT** |
| Training | `TrainingIntake.tsx` | `TrainingIntake.tsx` | ✓ |

**Findings:**
1. **SOP Intake naming is inconsistent:** Uses generic `Intake.tsx` instead of `SopIntake.tsx`, breaking the {Type}Intake naming pattern
2. **Notes uses singular `NoteIntake.tsx`:** Matches `NoteEditor.tsx` (singular). Both are correct; the blueprint and dashboard use plural (`notesBlueprint`, `NotesDashboard`) but individual note operations use singular.

---

### Naming Impact Analysis

**Why SOP generic names are problematic:**

1. **Discoverability:** New developers see `Dashboard.tsx` without context; they must search imports or read routing config to understand it's SOP-specific
2. **Routing ambiguity:** If a router imports both `Dashboard` and `SopDashboard`, there's a collision
3. **Consistency principle:** All 7 other types use explicit names; SOP stands out as an exception
4. **Code search:** Searching for "SOP pages" returns `SopEditor.tsx` but NOT `Dashboard.tsx`, creating gaps in mental models

**Why this matters:**
- The codebase has a clear `{Type}{PageKind}.tsx` pattern
- SOP breaks it; this is technical debt that accumulates as the codebase grows
- Refactoring is low-risk: 2 file renames + 1-2 import updates in routing config

---

## Summary of Findings

| Finding | Category | Severity | Scope |
|---|---|---|---|
| All 8 blueprints have complete page coverage | ✓ Positive | — | — |
| All blueprint exports match page imports | ✓ Positive | — | — |
| SOP Dashboard page has generic name (`Dashboard.tsx` instead of `SopDashboard.tsx`) | ⚠ Inconsistency | Low-Medium | Naming/discoverability |
| SOP Intake page has generic name (`Intake.tsx` instead of `SopIntake.tsx`) | ⚠ Inconsistency | Low-Medium | Naming/discoverability |
| Notes uses plural names intentionally (NotesDashboard, notesBlueprint) while NoteEditor/NoteIntake are singular | ✓ Intentional | — | Consistent within Notes |

---

## Execution Tasks

### Task 1: Verify SOP page usage in routing config

**Objective:** Understand how `Dashboard.tsx` and `Intake.tsx` are currently routed and imported. Identify if renaming would require routing changes.

**Action:**
1. Open `app/frontend/src/` and find the router config (likely `App.tsx` or `routes.ts`)
2. Search for imports of `Dashboard` and `Intake` components
3. Identify all usages:
   - How is `Dashboard` imported? (e.g., `import { Dashboard } from './pages/Dashboard'`)
   - How is `Intake` imported?
   - Are they imported with aliases to disambiguate? (e.g., `import { Dashboard as SopDashboard }`)
4. Document the current routing structure

**File to check:**
- `app/frontend/src/App.tsx` or `app/frontend/src/routes.ts` (or similar routing config)

**Verification:** Router config is reviewed and documented.

---

### Task 2: Audit for any hard-coded references to generic names

**Objective:** Find all code that refers to "Dashboard" or "Intake" generically (not via imports) that would break on rename.

**Action:**
1. Search codebase for string references:
   - `grep -r "to.*Dashboard" app/frontend/src/` → check for hardcoded route paths
   - `grep -r "to.*Intake" app/frontend/src/` → check for hardcoded route paths
   - `grep -r "'/dashboard'" app/` → check for hardcoded route strings
   - `grep -r "'/intake'" app/` → check for hardcoded route strings
2. Document any hardcoded references (e.g., `navigate('/intake')` would need to become `navigate('/sop/new')` or similar)
3. Check test files for hardcoded paths

**Files to search:**
- `app/frontend/src/**/*.tsx` (all React components)
- `app/frontend/src/**/*.ts` (all TypeScript files)
- Test files (`*.test.tsx`)
- Any backend route configs that might reference these paths

**Verification:** All hardcoded references are found and documented.

---

### Task 3: Decision point — Rename or document-as-exception

**Objective:** Decide whether to rename SOP pages for consistency or formalize them as intentional exceptions.

**Options:**

**Option A: Rename to `SopDashboard.tsx` and `SopIntake.tsx` (Recommended)**
- Pros: Consistent with all other types, better discoverability, simplifies mental model, aligns with naming convention
- Cons: Requires updating router imports and any hardcoded paths (from Task 2)
- Effort: 1-2 hours (2 file renames + import/routing updates + test run)
- Risk: Low (mechanical refactoring; low chance of missed references if grep is thorough)

**Option B: Keep generic names and document as intentional exception**
- Pros: No changes needed; SOP is the "default" record type, so generic names make sense
- Cons: Breaks consistency, increases confusion for new developers, makes the codebase harder to navigate
- Effort: 15 minutes (add comment to CLAUDE.md explaining the design choice)
- Risk: Very low (no code changes)

**Recommendation:** **Option A (Rename).** The consistency benefit outweighs the small refactoring effort. The "default SOP" rationale is weak if no one documents it, and future maintainers will be confused.

**Decision placeholder:** _(User or team decision required; recommend Option A)_

---

### Task 4: Execute rename (if Option A chosen)

**Objective:** Rename `Dashboard.tsx` → `SopDashboard.tsx` and `Intake.tsx` → `SopIntake.tsx`, update all imports.

**Action:**

1. **Rename files:**
   ```bash
   cd app/frontend/src/pages
   mv Dashboard.tsx SopDashboard.tsx
   mv Intake.tsx SopIntake.tsx
   ```

2. **Update router imports:**
   - Open the router config (e.g., `App.tsx`)
   - Change: `import { Dashboard } from './pages/Dashboard'` → `import { SopDashboard } from './pages/SopDashboard'`
   - Change: `import { Intake } from './pages/Intake'` → `import { SopIntake } from './pages/SopIntake'`
   - Update any route definitions that reference these components

3. **Update any hardcoded paths** (from Task 2):
   - Search for `navigate('/intake')` or similar and update to `navigate('/sop/new')` if applicable
   - Update any path-based route definitions

4. **Test:**
   - Run the app: `npm run dev` in `app/frontend/`
   - Navigate to SOP dashboard: Verify the page loads and displays correctly
   - Navigate to SOP intake: Verify the page loads and displays correctly
   - Test a create/edit flow: Verify no broken imports or console errors

5. **Commit changes:**
   ```bash
   git add -A
   git commit -m "Rename Dashboard.tsx → SopDashboard.tsx and Intake.tsx → SopIntake.tsx for naming consistency"
   ```

**Files to modify:**
- `app/frontend/src/pages/Dashboard.tsx` → `SopDashboard.tsx` (rename)
- `app/frontend/src/pages/Intake.tsx` → `SopIntake.tsx` (rename)
- `app/frontend/src/App.tsx` or router config (update imports)
- Test/snapshot files if any reference these names

---

### Task 5: Verify naming consistency across all blueprints and pages

**Objective:** Create an audit checklist to confirm the blueprint-page mapping is complete and consistent.

**Action:**

1. **Generate a verification table** (similar to the one in this plan):
   ```
   Record Type | Blueprint Export | Dashboard Page | Editor Page | Intake Page | Status
   Audit       | auditBlueprint   | AuditDashboard | AuditEditor | AuditIntake | ✓
   ...
   ```

2. **For each row, verify:**
   - Blueprint file exists and exports the correct name
   - Dashboard page exists (skip import check; blueprints aren't used here)
   - Editor page exists and imports the blueprint correctly
   - Intake page exists and imports the blueprint correctly
   - Page names follow `{Type}X.tsx` pattern (except Notes plural is intentional)

3. **Document findings:**
   - Create a checklist (see Task 5 verification step below)
   - Pass if all 8 blueprints have complete coverage and consistent naming
   - Fail if any blueprint is missing a page or naming is inconsistent

**Verification checklist template:**
```
BLUEPRINT COVERAGE & NAMING AUDIT CHECKLIST

☐ auditBlueprint:
  ☐ Blueprint file exists (auditBlueprint.ts)
  ☐ Export name correct (auditBlueprint)
  ☐ Dashboard page exists (AuditDashboard.tsx)
  ☐ Editor page exists (AuditEditor.tsx)
  ☐ Editor imports auditBlueprint
  ☐ Intake page exists (AuditIntake.tsx)
  ☐ Intake imports auditBlueprint
  ☐ Naming consistent (all {Type}X.tsx pattern)

... repeat for CAP, Change, Incident, Meeting, Notes, SOP, Training
```

---

## Verification Steps

### Verification 1: Blueprint file inventory

**Command:**
```bash
ls -1 app/frontend/src/blueprint/*Blueprint.ts | wc -l
```

**Expected:** 8 files ✓

**Command:**
```bash
grep -h "^export const" app/frontend/src/blueprint/*Blueprint.ts | sort
```

**Expected output:**
```
export const auditBlueprint: BlueprintField[] = [
export const capBlueprint: BlueprintField[] = [
export const changeBlueprint: BlueprintField[] = [
export const incidentBlueprint: BlueprintField[] = [
export const meetingBlueprint: BlueprintField[] = [
export const notesBlueprint: BlueprintField[] = [
export const notesBlueprintAdmin: BlueprintField[] = [
export const sopBlueprint: BlueprintField[] = [
export const trainingBlueprint: BlueprintField[] = [
```

**All 9 exports present (notesBlueprint has 2).** ✓

---

### Verification 2: Editor page imports

**Command:**
```bash
grep -h "import.*Blueprint.*from.*blueprint" app/frontend/src/pages/*Editor.tsx | sort
```

**Expected:** Each import matches its blueprint name (e.g., `auditBlueprint` from `auditBlueprint.ts`)

**Pass criteria:** No mismatches or typos. ✓

---

### Verification 3: Intake page imports

**Command:**
```bash
grep -h "import.*Blueprint.*from.*blueprint" app/frontend/src/pages/*Intake.tsx app/frontend/src/pages/Intake.tsx | sort
```

**Expected:** Each import matches its blueprint name.

**Pass criteria:** No mismatches or typos. ✓

---

### Verification 4: Naming consistency check

**Manual inspection:**

1. Open `app/frontend/src/pages/` and list all Dashboard files:
   ```bash
   ls -1 app/frontend/src/pages/*Dashboard.tsx
   ```
   **Expected:** AuditDashboard, CapDashboard, ChangeDashboard, IncidentDashboard, MeetingDashboard, NotesDashboard, TrainingDashboard, (and if Task 4 completed: SopDashboard)

2. Open `app/frontend/src/pages/` and list all Intake files:
   ```bash
   ls -1 app/frontend/src/pages/*Intake.tsx app/frontend/src/pages/Intake.tsx 2>/dev/null
   ```
   **Expected:** AuditIntake, CapIntake, ChangeIntake, IncidentIntake, MeetingIntake, NoteIntake, TrainingIntake, (and if Task 4 completed: SopIntake)

**Pass criteria:** All follow `{Type}X.tsx` pattern (with Notes plural as intentional exception, and SOP renamed if Task 4 completed).

---

### Verification 5: Router imports (if Task 4 completed)

**Action:**
1. Open router config (e.g., `app/frontend/src/App.tsx`)
2. Verify imports have been updated:
   - Should see: `import { SopDashboard } from './pages/SopDashboard'`
   - Should see: `import { SopIntake } from './pages/SopIntake'`
   - Should NOT see: `import { Dashboard } from './pages/Dashboard'` (old generic import)

**Pass criteria:** Imports updated and no console errors when app runs.

---

### Verification 6: App runs without errors (if Task 4 completed)

**Action:**
1. Run `npm run dev` in `app/frontend/`
2. Open browser console (F12 → Console tab)
3. Navigate to SOP dashboard: Should load without 404 or import errors
4. Navigate to SOP intake: Should load without errors
5. Try creating a new SOP record: Should work end-to-end

**Pass criteria:** No errors in console; pages load and function correctly.

---

## File Paths Summary

### Read/Audit (No changes, reference only)

- `app/frontend/src/blueprint/auditBlueprint.ts`
- `app/frontend/src/blueprint/capBlueprint.ts`
- `app/frontend/src/blueprint/changeBlueprint.ts`
- `app/frontend/src/blueprint/incidentBlueprint.ts`
- `app/frontend/src/blueprint/meetingBlueprint.ts`
- `app/frontend/src/blueprint/notesBlueprint.ts`
- `app/frontend/src/blueprint/sopBlueprint.ts`
- `app/frontend/src/blueprint/trainingBlueprint.ts`
- All page files in `app/frontend/src/pages/*Dashboard.tsx`, `*Editor.tsx`, `*Intake.tsx`

### Rename/Modify (If Task 4 executed)

- `app/frontend/src/pages/Dashboard.tsx` → `SopDashboard.tsx`
- `app/frontend/src/pages/Intake.tsx` → `SopIntake.tsx`
- Router config (e.g., `app/frontend/src/App.tsx` or equivalent)
- Any files with hardcoded paths (identified in Task 2)

---

## Summary

**Current State:**
- ✓ All 8 blueprints have complete page coverage (Dashboard + Editor + Intake)
- ✓ All blueprint exports are present and correctly named
- ✓ All Editor/Intake page imports match their blueprint exports (no mismatches)
- ⚠ SOP uses generic page names (`Dashboard.tsx`, `Intake.tsx`) instead of following the `{Type}X.tsx` pattern used by all other types

**Recommendation:**
Rename SOP pages to `SopDashboard.tsx` and `SopIntake.tsx` for consistency. This is low-risk, improves discoverability, and aligns the codebase with a single naming convention.

**Effort:** 1-2 hours (2 file renames + import/routing updates + test verification)

**Next Step:** Execute Task 1 (router audit) to understand current imports, then make the naming decision (Option A recommended).

