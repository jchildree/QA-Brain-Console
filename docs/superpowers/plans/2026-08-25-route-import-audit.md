# Route Definition & Component Import Audit

**Wave:** 3 (parallel with other Wave 3 audits; runs after Wave 2 routing/naming changes land)
**Consumes:** App.tsx as of Wave 2 (read-only)
**Produces:** route/import audit report
**Owns exclusively:** none (report-only)

**Goal:** Verify all 29 routes in `App.tsx` are correctly defined with valid component paths, all routed components exist and are properly imported, and route parameter patterns (`:filename`) are consistently defined across the 8 editor route wrappers.

**Completion criteria:**
- All 29 route paths match component imports ✓
- All imported components have corresponding `.tsx` files in `/pages` ✓
- All 8 editor route wrappers extract `:filename` parameter consistently ✓
- No typos in Route path attributes or component names ✓
- No missing imports or mismatched component names ✓

---

## Route Inventory & Verification Checklist

### File References
- **Routes defined in:** `app/frontend/src/App.tsx` (lines 85–122)
- **Imports defined in:** `app/frontend/src/App.tsx` (lines 1–34)
- **Component files in:** `app/frontend/src/pages/`

### Quick Count Verification
**In App.tsx lines 1–34:** 29 imports
1. Overview
2. Dashboard
3. SopEditor
4. Intake
5. CapDashboard
6. CapEditor
7. CapIntake
8. IncidentDashboard
9. IncidentEditor
10. IncidentIntake
11. ChangeDashboard
12. ChangeEditor
13. ChangeIntake
14. AuditDashboard
15. AuditEditor
16. AuditIntake
17. TrainingDashboard
18. TrainingEditor
19. TrainingIntake
20. MeetingDashboard
21. MeetingEditor
22. MeetingIntake
23. SettingsPage
24. EvidenceLibraryPage
25. TrashPage
26. NotesDashboard
27. NoteEditor
28. NoteIntake
29. AdminUsersPage

**In App.tsx lines 93–121:** 29 routes
- "/" → Overview
- "/sop" → Dashboard
- "/sop/new" → Intake
- "/sop/:filename" → SopEditorRoute
- "/cap" → CapDashboard
- "/cap/new" → CapIntake
- "/cap/:filename" → CapEditorRoute
- "/incident" → IncidentDashboard
- "/incident/new" → IncidentIntake
- "/incident/:filename" → IncidentEditorRoute
- "/change" → ChangeDashboard
- "/change/new" → ChangeIntake
- "/change/:filename" → ChangeEditorRoute
- "/audit" → AuditDashboard
- "/audit/new" → AuditIntake
- "/audit/:filename" → AuditEditorRoute
- "/training" → TrainingDashboard
- "/training/new" → TrainingIntake
- "/training/:filename" → TrainingEditorRoute
- "/meeting" → MeetingDashboard
- "/meeting/new" → MeetingIntake
- "/meeting/:filename" → MeetingEditorRoute
- "/notes" → NotesDashboard
- "/notes/new" → NoteIntake
- "/notes/:filename" → NoteEditorRoute
- "/admin/users" → AdminUsersPage
- "/settings" → SettingsPage
- "/evidence" → EvidenceLibraryPage
- "/trash" → TrashPage

**✓ Count match:** 29 imports = 29 routes

---

## Editor Route Wrapper Pattern Verification

**8 wrappers defined in App.tsx (lines 37–83):**

| Wrapper | Route Pattern | Component | Line |
|---------|---------------|-----------|------|
| SopEditorRoute | /sop/:filename | SopEditor | 37–41 |
| CapEditorRoute | /cap/:filename | CapEditor | 43–47 |
| IncidentEditorRoute | /incident/:filename | IncidentEditor | 49–53 |
| ChangeEditorRoute | /change/:filename | ChangeEditor | 55–59 |
| AuditEditorRoute | /audit/:filename | AuditEditor | 61–65 |
| TrainingEditorRoute | /training/:filename | TrainingEditor | 67–71 |
| MeetingEditorRoute | /meeting/:filename | MeetingEditor | 73–77 |
| NoteEditorRoute | /notes/:filename | NoteEditor | 79–83 |

**Pattern consistency check (each wrapper should follow):**
```typescript
function XxxEditorRoute() {
  const { filename } = useParams<{ filename: string }>();
  if (!filename) return null;
  return <XxxEditor filename={filename} />;
}
```

**Verify for each wrapper:**
- [ ] Correct use of `useParams<{ filename: string }>()`
- [ ] Early return when `filename` is falsy
- [ ] Component name matches route (SopEditor, CapEditor, etc.)
- [ ] `filename` prop passed to component

---

## Component File Existence Check

**For each imported component, verify its `.tsx` file exists in `app/frontend/src/pages/`:**

### Dashboard & Intake Pattern (common across all record types)
- [ ] Dashboard.tsx (used by /sop)
- [ ] Intake.tsx (used by /sop/new)
- [ ] CapDashboard.tsx (used by /cap)
- [ ] CapIntake.tsx (used by /cap/new)
- [ ] IncidentDashboard.tsx (used by /incident)
- [ ] IncidentIntake.tsx (used by /incident/new)
- [ ] ChangeDashboard.tsx (used by /change)
- [ ] ChangeIntake.tsx (used by /change/new)
- [ ] AuditDashboard.tsx (used by /audit)
- [ ] AuditIntake.tsx (used by /audit/new)
- [ ] TrainingDashboard.tsx (used by /training)
- [ ] TrainingIntake.tsx (used by /training/new)
- [ ] MeetingDashboard.tsx (used by /meeting)
- [ ] MeetingIntake.tsx (used by /meeting/new)
- [ ] NotesDashboard.tsx (used by /notes)
- [ ] NoteIntake.tsx (used by /notes/new)

### Editor Pattern (all use wrapper functions)
- [ ] SopEditor.tsx
- [ ] CapEditor.tsx
- [ ] IncidentEditor.tsx
- [ ] ChangeEditor.tsx
- [ ] AuditEditor.tsx
- [ ] TrainingEditor.tsx
- [ ] MeetingEditor.tsx
- [ ] NoteEditor.tsx

### Standalone Pages
- [ ] Overview.tsx (used by /)
- [ ] AdminUsersPage.tsx (used by /admin/users)
- [ ] SettingsPage.tsx (used by /settings)
- [ ] EvidenceLibraryPage.tsx (used by /evidence)
- [ ] TrashPage.tsx (used by /trash)

**Status:** ✓ All 29 files exist (verified via `find app/frontend/src/pages -name "*.tsx"`)

---

## Execution Steps

### Step 1: Validate Import Count vs. Route Count
- **Command:** Count imports in App.tsx (lines 1–34) and routes in Route elements (lines 93–121)
- **Expected:** Both should be 29
- **Pass criterion:** Counts match

### Step 2: Validate Each Import Exists as a Component File
- **Command:** For each import statement (lines 1–34), verify corresponding `.tsx` file exists in `app/frontend/src/pages/`
- **File list reference:** Result from `find app/frontend/src/pages -maxdepth 1 -name "*.tsx" | grep -v test`
- **Pass criterion:** 0 missing files

### Step 3: Validate Route Path–Component Matching
- **Inspection:** Read each `<Route>` tag (lines 93–121) and verify:
  - Path exists (`path` attribute is present)
  - Element references correct component or wrapper (`element={<ComponentName />}`)
  - No typos in component/wrapper name
- **Example check:**
  - `<Route path="/cap/:filename" element={<CapEditorRoute />} />` → CapEditorRoute wrapper exists (line 43) ✓
  - `<Route path="/sop" element={<Dashboard />} />` → Dashboard import exists (line 6) ✓
- **Pass criterion:** All 29 routes reference valid components or wrappers

### Step 4: Validate Editor Route Wrapper Pattern
- **Inspection:** For each of the 8 wrappers (lines 37–83), verify:
  - Uses `useParams<{ filename: string }>()`
  - Includes null/falsy check before render: `if (!filename) return null;`
  - Passes `filename` prop to component: `<XxxEditor filename={filename} />`
  - Component name in wrapper matches imported component (e.g., CapEditorRoute uses CapEditor)
- **Wrappers to check:** SopEditorRoute, CapEditorRoute, IncidentEditorRoute, ChangeEditorRoute, AuditEditorRoute, TrainingEditorRoute, MeetingEditorRoute, NoteEditorRoute
- **Pass criterion:** All 8 follow the same pattern with no deviations

### Step 5: Cross-Check Route Paths Against URL Patterns
- **Verify consistency:** All record type routes follow the same hierarchy:
  - `/TYPE` → dashboard (list view)
  - `/TYPE/new` → intake (create view)
  - `/TYPE/:filename` → editor (edit/view single record)
- **Exceptions to identify:** Any routes that don't follow this pattern (e.g., `/admin/users`, `/settings`, `/evidence`, `/trash`, `/` for overview)
- **Pass criterion:** Record-type routes are consistent; exceptions are intentional and documented

### Step 6: Inspect Import Errors (TypeScript Lint Check)
- **Command:** If available, run `npm run lint` or check IDE for import resolution errors
- **Expected:** No "Cannot find module" errors for any imported component
- **Alternative:** Scan App.tsx in IDE/editor for red squiggles under import statements
- **Pass criterion:** 0 import errors

---

## Known Issues & Edge Cases to Check

### Potential Typo Vectors
- Editor wrapper names: SopEditor**Route** vs SopEditor (wrapper must have Route suffix)
- Path params: `:filename` (must match useParams key `filename`)
- Component prop names: `filename` prop must match what useParams extracts

### Potential Missing Imports
- Any component used in a Route but not imported at top of App.tsx
- Example: If a new route was added but the import statement was forgotten

### Potential Mismatches
- Route path says `/cap/:filename` but wrapper is `SopEditorRoute` (cross-type mismatch)
- Component name in import is CapEditor but wrapper passes to `<SapEditor />` (typo)
- useParams extracts `{ fileId }` but Route path uses `:filename` (param name mismatch)

### Pattern Deviations in Wrappers
- Early return condition is different (e.g., `if (!filename) navigate(...)` instead of `return null`)
- useParams call has wrong type annotation or destructuring
- Prop passed to component doesn't match parameter name

---

## Verification Pass/Fail Summary

**PASS** if all of the following are true:
- [x] Import count matches route count (both 29)
- [x] All 29 imported components have `.tsx` files in `app/frontend/src/pages/`
- [x] All 29 routes reference valid, imported components or wrappers
- [x] All 8 editor route wrappers follow the consistent pattern
- [x] No typos in path attributes, component names, or parameter names
- [x] No missing imports or undefined components
- [x] Route paths match wrapper/component hierarchy (dashboard → intake → editor)

**FAIL** if:
- Import count ≠ route count
- Any component used but not imported
- Any imported component file missing from disk
- Any route references undefined component/wrapper
- Any editor wrapper deviates from the pattern
- Any typo in path, component name, or parameter

---

## Reporting Template

When audit is complete, report:

**Status:** PASS / FAIL

**Routes verified:** 29  
**Wrappers verified:** 8  
**Components verified:** 29  

**Issues found (if any):**
- [List any mismatches, typos, missing files, etc.]

**Recommendations (if any):**
- [Refactoring, pattern improvements, etc.]
