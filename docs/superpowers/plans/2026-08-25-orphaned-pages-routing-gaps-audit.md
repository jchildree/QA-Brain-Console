# Orphaned Pages & Routing Gaps Audit

**Wave:** 3 (parallel with other Wave 3 audits; runs after Wave 2 routing/naming changes land)
**Consumes:** App.tsx, AuthGate.tsx as of Wave 2 (read-only unless gaps found)
**Produces:** orphaned-page/routing-gap audit report
**Owns exclusively:** none unless gaps found (report-only by default)

## Goal
Verify complete routing coverage for all 31 frontend pages; identify orphaned components not routed in `App.tsx`, routed paths with missing components, incomplete Dashboard/Editor/Intake triples, duplicate routes, and conflicting path patterns. Document all intentional gaps.

## Current State

### App.tsx Routing Summary
- **File**: `app/frontend/src/App.tsx`
- **Total routed page components**: 29 (8 record-type triples + 5 utility pages)
- **Wrapper-rendered pages (unrouted)**: 2 (LoginPage, SetupPasswordPage in AuthGate)
- **Total .tsx page files on disk**: 31

### Page Inventory by Category

#### Record-Type Dashboard/Editor/Intake Triples (7 types × 3 = 21 components)
1. **SOP** (Dashboard.tsx / SopEditor.tsx / Intake.tsx)
   - Dashboard route: `/sop` → Dashboard
   - Intake route: `/sop/new` → Intake (note: generic name, not SopIntake)
   - Editor route: `/sop/:filename` → SopEditorRoute wrapper

2. **CAP** (CapDashboard.tsx / CapEditor.tsx / CapIntake.tsx)
   - Dashboard route: `/cap` → CapDashboard ✓
   - Intake route: `/cap/new` → CapIntake ✓
   - Editor route: `/cap/:filename` → CapEditorRoute wrapper ✓

3. **INCIDENT** (IncidentDashboard.tsx / IncidentEditor.tsx / IncidentIntake.tsx)
   - Dashboard route: `/incident` → IncidentDashboard ✓
   - Intake route: `/incident/new` → IncidentIntake ✓
   - Editor route: `/incident/:filename` → IncidentEditorRoute wrapper ✓

4. **CHANGE** (ChangeDashboard.tsx / ChangeEditor.tsx / ChangeIntake.tsx)
   - Dashboard route: `/change` → ChangeDashboard ✓
   - Intake route: `/change/new` → ChangeIntake ✓
   - Editor route: `/change/:filename` → ChangeEditorRoute wrapper ✓

5. **AUDIT** (AuditDashboard.tsx / AuditEditor.tsx / AuditIntake.tsx)
   - Dashboard route: `/audit` → AuditDashboard ✓
   - Intake route: `/audit/new` → AuditIntake ✓
   - Editor route: `/audit/:filename` → AuditEditorRoute wrapper ✓

6. **TRAINING** (TrainingDashboard.tsx / TrainingEditor.tsx / TrainingIntake.tsx)
   - Dashboard route: `/training` → TrainingDashboard ✓
   - Intake route: `/training/new` → TrainingIntake ✓
   - Editor route: `/training/:filename` → TrainingEditorRoute wrapper ✓

7. **MEETING** (MeetingDashboard.tsx / MeetingEditor.tsx / MeetingIntake.tsx)
   - Dashboard route: `/meeting` → MeetingDashboard ✓
   - Intake route: `/meeting/new` → MeetingIntake ✓
   - Editor route: `/meeting/:filename` → MeetingEditorRoute wrapper ✓

8. **NOTES** (NotesDashboard.tsx / NoteEditor.tsx / NoteIntake.tsx)
   - Dashboard route: `/notes` → NotesDashboard ✓
   - Intake route: `/notes/new` → NoteIntake ✓
   - Editor route: `/notes/:filename` → NoteEditorRoute wrapper ✓

#### Utility Pages (8 components)
1. Overview → `/` → Overview.tsx ✓
2. AdminUsersPage → `/admin/users` → AdminUsersPage.tsx ✓
3. SettingsPage → `/settings` → SettingsPage.tsx ✓
4. EvidenceLibraryPage → `/evidence` → EvidenceLibraryPage.tsx ✓
5. TrashPage → `/trash` → TrashPage.tsx ✓
6. **LoginPage** → NOT ROUTED → LoginPage.tsx (rendered by AuthGate wrapper)
7. **SetupPasswordPage** → NOT ROUTED → SetupPasswordPage.tsx (rendered by AuthGate wrapper)
8. **(Hypothetical) SopIntake** → NOT FOUND (intentional—SOP uses generic `Intake.tsx`)

## Verification Checklist

### Task 1: Verify All Routed Pages Have Component Files
**File**: `app/frontend/src/App.tsx` (lines 93–121)
**Action**: Cross-check every Route's element against filesystem
- [ ] Review each import statement (lines 1–35) and confirm source file exists
- [ ] Confirm all 29 imported components have corresponding .tsx files in `app/frontend/src/pages/`
- [ ] Verify no typos in import paths or file names

**Expected**: All 29 routed imports resolve to existing files. **Result**: ✓ All verified

---

### Task 2: Verify No Unrouted Pages Are Accidental
**Action**: Check `app/frontend/src/pages/` for any .tsx files not referenced in App.tsx
- [ ] List all .tsx page files (excluding .test.tsx)
- [ ] Check `LoginPage.tsx` usage in `app/frontend/src/components/AuthGate.tsx` — confirm it's rendered conditionally, not routed
- [ ] Check `SetupPasswordPage.tsx` usage in AuthGate — confirm intentional conditional rendering
- [ ] Confirm no other unrouted pages exist

**Expected**: Only LoginPage and SetupPasswordPage are unrouted, both intentionally.

**Documentation**: Add note to CLAUDE.md or a routing-gaps.md file:
```
## Intentionally Unrouted Pages

- **LoginPage** and **SetupPasswordPage** are rendered by `AuthGate.tsx` (conditional 
  auth flow UI), not routed in App.tsx. They handle pre-auth flows and are not accessible 
  via direct URLs. This is by design.
```

---

### Task 3: Verify Dashboard/Editor/Intake Triple Completeness
**Action**: Ensure each record type has all three component variants
- [ ] Count Dashboard components (should be 8: for SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING, MEETING, NOTES)
- [ ] Count Editor components (should be 8: SopEditor, CapEditor, IncidentEditor, ChangeEditor, AuditEditor, TrainingEditor, MeetingEditor, NoteEditor)
- [ ] Count Intake components (should be 8: Intake [SOP generic], CapIntake, IncidentIntake, ChangeIntake, AuditIntake, TrainingIntake, MeetingIntake, NoteIntake)
- [ ] Verify SOP uses generic `Intake.tsx` instead of `SopIntake.tsx` — document as intentional

**Expected**: All 8 × 3 = 24 components exist. SOP intentionally uses generic Intake.

**File check**:
```bash
# From: app/frontend/src/pages/
ls -1 *Dashboard.tsx      # 8 files: Audit, Cap, Change, Incident, Meeting, Notes, Training, (Dashboard for SOP)
ls -1 *Editor.tsx         # 8 files: SopEditor, CapEditor, ..., NoteEditor
ls -1 *Intake.tsx         # 8 files: Intake, CapIntake, ..., NoteIntake
# Verify SopIntake.tsx does NOT exist (by design)
```

---

### Task 4: Verify No Duplicate Routes or Path Conflicts
**Action**: Check App.tsx for route overlaps
- [ ] Scan all Route paths for duplicates (each path should appear exactly once)
- [ ] Verify parameterized routes (`:filename`) do not conflict with literal paths (e.g., `/sop/new` before `/sop/:filename`)
- [ ] Check that catch-all or overlapping patterns don't hide intended routes
- [ ] Verify no two Editor routes share the same path pattern

**Expected paths (29 total)**:
```
/                          # Overview
/sop                       # Dashboard
/sop/new                   # Intake
/sop/:filename             # SopEditorRoute
/cap, /cap/new, /cap/:filename
/incident, /incident/new, /incident/:filename
/change, /change/new, /change/:filename
/audit, /audit/new, /audit/:filename
/training, /training/new, /training/:filename
/meeting, /meeting/new, /meeting/:filename
/notes, /notes/new, /notes/:filename
/admin/users
/settings
/evidence
/trash
```
**Route order in file**: Literal paths (/sop/new, /cap/new, etc.) must come **before** parameterized paths (/sop/:filename, /cap/:filename) to avoid greedy matching.

**Verification command**:
```bash
grep 'path="/' app/frontend/src/App.tsx | grep -oE '"/[^"]*"' | sort | uniq -d
# Should return EMPTY (no duplicates)
```

---

### Task 5: Verify Editor Route Wrappers
**Action**: Confirm all Editor route wrappers are properly defined
- [ ] Check that each Editor wrapper function (SopEditorRoute, CapEditorRoute, etc., lines 37–83) is correctly wired
- [ ] Verify each wrapper extracts `:filename` param and passes it to the editor component
- [ ] Confirm no wrapper is missing or misnamed
- [ ] Verify the wrapper returns null if filename is absent (prevents rendering without required param)

**Files**:
- `app/frontend/src/App.tsx` lines 37–83 (8 wrapper functions)
- Each editor page (`SopEditor.tsx`, `CapEditor.tsx`, etc.)

**Expected**: 8 wrappers defined and routed, all handling `:filename` param.

---

### Task 6: Check CLAUDE.md Documentation
**File**: `CLAUDE.md` at repo root
- [ ] Search for any existing routing or page documentation
- [ ] If no "Routing" or "Pages" section exists, plan to add it in a follow-up documentation task
- [ ] Confirm any documented pages match the audit findings

---

### Task 7: Verify No Page Import Errors
**Action**: Scan for unused imports or missing exports
- [ ] Check that all 29 imported components in App.tsx are actually exported from their source files
- [ ] Verify no import statement points to a non-existent file (TypeScript compiler would catch this, but double-check)
- [ ] Confirm AuthGate correctly imports LoginPage and SetupPasswordPage

**Files to check**:
- `app/frontend/src/App.tsx` (imports)
- `app/frontend/src/components/AuthGate.tsx` (LoginPage, SetupPasswordPage imports)
- All 31 page component files (exports)

---

### Task 8: Test Page Accessibility (Spot Checks)
**Action**: Manually verify a few routes to ensure pages load
- [ ] Navigate to `/` → Overview should render
- [ ] Navigate to `/sop` → Dashboard (SOP) should render
- [ ] Navigate to `/cap/new` → CapIntake should render
- [ ] Navigate to `/admin/users` → AdminUsersPage should render
- [ ] Attempt `/invalidpath` → should 404 or redirect (verify no silent failures)
- [ ] Verify pre-auth redirects prevent access to `/settings`, `/admin/users`, etc. when logged out

---

## Expected Outcomes

### No Gaps Found (Happy Path)
- ✓ All 29 routed pages have component files
- ✓ All 31 page files accounted for (29 routed + 2 intentionally unrouted in AuthGate)
- ✓ All 8 record-type triples complete (24 components)
- ✓ All 5 utility pages routed
- ✓ No duplicate routes
- ✓ No parameterized routes hiding literal paths
- ✓ No missing Editor wrappers
- ✓ LoginPage and SetupPasswordPage intentionally rendered by AuthGate, not routed
- ✓ SOP intentionally uses generic Intake.tsx (no SopIntake.tsx)

### If Gaps Found
**Examples & Actions**:
1. **Routed path with missing component** → Add component or remove route
2. **Unrouted page not in AuthGate** → Either route it in App.tsx or add to CLAUDE.md exclusion list
3. **Missing triple member** (e.g., no TrainingIntake) → Create the component and add route
4. **Duplicate routes** → Consolidate or remove
5. **Import error** → Fix import path or component export

---

## Deliverables

1. **Audit Report** (`routing-audit-YYYY-MM-DD.md`)
   - Summary table: Routed vs. Unrouted vs. Intentional
   - List of any gaps found and remediation steps
   - Confirmation of no duplicates, no conflicts

2. **CLAUDE.md Update** (if needed)
   - Add "Routing & Pages" section with:
     - Intent of LoginPage/SetupPasswordPage (AuthGate-rendered)
     - Intent of generic Intake.tsx for SOP
     - Any other intentional design choices

3. **Code Changes** (if gaps found)
   - Add/remove routes in App.tsx
   - Add/remove page components
   - Fix import errors

---

## Effort Estimate
- **Reading & verification**: 30 min
- **Spot checks**: 15 min
- **Documentation**: 15 min
- **Total**: ~60 min (1 hour)

## Success Criteria
- ✓ All 31 pages accounted for (routed or intentionally unrouted)
- ✓ No duplicate routes
- ✓ No missing components for routed paths
- ✓ All Dashboard/Editor/Intake triples complete
- ✓ Intentional gaps documented in CLAUDE.md or audit report
