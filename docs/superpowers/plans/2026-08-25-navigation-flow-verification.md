# Navigation Flow Verification Plan

**Wave:** 3 (parallel with other Wave 3 audits; runs after Wave 2 routing/naming changes land)
**Consumes:** App.tsx, RecordIntake.tsx, RecordEditor.tsx, NoteEditor.tsx, Overview.tsx as of Wave 2 (read-only)
**Produces:** navigation-flow verification matrix (report-only)
**Owns exclusively:** none (verification-only)

**Status:** Ready for execution  
**Scope:** All navigate() calls and Link targets across intake, editor, dashboard, and overview flows  
**Coverage:** 8 record types (SOP, CAP, Incident, Change, Audit, Training, Meeting) + Notes + Overview  
**Execution Estimate:** ~2-3 hours  

---

## Goal

Verify that all navigation flows work correctly end-to-end:
- Intake → Editor → Dashboard cycles for all 8 record types plus notes
- State passing (rawText, title, folder) through `useLocation.state`
- Editor save/delete targets correct dashboards
- Intake save redirects to editor with `created.filename`
- Note promote buttons reach all 7 typed-record intakes
- All card links navigate to correct editors
- No dead links or inconsistent URL patterns

---

## Context

The app uses React Router with navigate() and Link components. Navigation patterns should be consistent across all record types, with the exception that:
- Notes have a custom intake flow that also accepts `folder` parameter
- Only NoteEditor has promote buttons (to 7 record types)
- Delete always goes to `/{type}` dashboard, save stays in editor
- Overview has file/folder drop-in accession flow

Source files involved:
- Routing: `app/frontend/src/App.tsx`
- Intakes: `Intake.tsx`, `CapIntake.tsx`, etc. (one per type)
- Editors: `pages/*Editor.tsx` (type-specific wrappers) + `components/RecordEditor.tsx` (shared)
- Components: `NoteCard.tsx`, `RecordCard.tsx`, `RecordDashboard.tsx`
- Dashboards: `Dashboard.tsx` (SOP), `CapDashboard.tsx`, etc.
- Overview: `pages/Overview.tsx`, `components/AccessionPanel` (inside Overview)
- Notes: `NotesDashboard.tsx`

---

## Verification Checklist

### Phase 1: Route Definition Audit (15 min)

**File:** `app/frontend/src/App.tsx`

1. Verify all 8 record type routes exist in expected pattern:
   - `/{type}` → Dashboard (SOP special: `/{type}/` maps to `/sop`)
   - `/{type}/new` → Intake
   - `/{type}/:filename` → Editor
   - Document route wrapper components (SopEditorRoute, CapEditorRoute, etc.)

2. Verify notes routes follow same pattern:
   - `/notes` → NotesDashboard
   - `/notes/new` → NoteIntake
   - `/notes/:filename` → NoteEditor

3. Check for any routes missing from the 8-type list: SOP, CAP, Incident, Change, Audit, Training, Meeting

**Expected counts:**
- 8 typed-record routes × 3 variants (dashboard, new, editor) = 24 routes
- 3 note routes
- Plus Overview, Settings, Admin, Evidence, Trash, etc.
- Total: ~32 routes

---

### Phase 2: State Passing Validation (30 min)

Verify state flows correctly from source to target through `useLocation().state`

**2a. Promote Buttons (NoteEditor)**

- **File:** `app/frontend/src/pages/NoteEditor.tsx`, lines 103–111
- **Pattern:** `navigate(\`/${type}/new\`, { state: { rawText: body, title: frontmatter.title } })`
- **For each of 7 buttons:** (sop, cap, incident, change, audit, training, meeting)
  - Verify click handler passes correct `type`
  - Verify state includes `body` as `rawText` and `frontmatter.title` as `title`

**2b. Overview Accession (Intake)**

- **File:** `app/frontend/src/pages/Overview.tsx`, line 107
- **Pattern:** `navigate('/notes/new', { state: { rawText, folder: folderName, title: titleName } })`
- **Verify:**
  - Correctly passes `rawText`, `folder`, and `title` from file/paste input
  - `folder` is extracted from dropped folder structure or left empty for pasted text
  - `title` comes from uploaded filename or entered manually

**2c. Intake→Editor Redirect**

For all intakes (SOP/CAP/Incident/Change/Audit/Training/Meeting/Notes):
- **File:** `pages/{Type}Intake.tsx`, check `handleSave` function
- **Pattern:** `navigate(\`/{type}/${created.filename}\`)` (no state passed)
- **Verify:** After save, redirects to editor with correct filename (no state needed for editor, it loads from API)

**2d. State Consumption in Intake Components**

- **File:** `app/frontend/src/components/RecordIntake.tsx`, lines 22–26
- **Pattern:**
  ```typescript
  initialRawText={(location.state as { rawText?: string; title?: string } | null)?.rawText}
  initialTitle={(location.state as { rawText?: string; title?: string } | null)?.title}
  ```
- **For SOP/CAP/Incident/Change/Audit/Training/Meeting:**
  - Verify props are passed to RecordIntake
  - RecordIntake uses them for initial form state
  - Auto-runs extraction if `initialRawText` is present (line 70–74)

- **For Notes (NoteIntake):**
  - **File:** `app/frontend/src/pages/NoteIntake.tsx`, lines 13, 33–35
  - **Pattern:** Also passes `folder` from state
  - Verify `folder` is only applied if present, doesn't override user input

---

### Phase 3: Link Target Audit (45 min)

Verify all Links and navigate() calls point to correct URLs. Create a matrix for quick reference.

**3a. Dashboard → Editor Links**

- **File:** `app/frontend/src/components/RecordDashboard.tsx`, line 37
- **Pattern:** `linkTo={\`/${type}/${record.filename}\`}`
- **Test for each record type:**
  - Click a record card in CAP Dashboard
  - Verify URL is `/cap/{filename}`
  - Verify editor loads correctly

**3b. Dashboard → New Intake Links**

- **File:** `app/frontend/src/components/RecordDashboard.tsx`, line 145
- **Pattern:** `<Link to={\`/${type}/new\`}>`
- **For each record type:** Click "+ New {Type}", verify goes to intake page
  - `/sop/new` → SOP Intake
  - `/cap/new` → CAP Intake
  - `/incident/new` → Incident Intake
  - `/change/new` → Change Intake
  - `/audit/new` → Audit Intake
  - `/training/new` → Training Intake
  - `/meeting/new` → Meeting Intake

**3c. NotesDashboard → Editor Links**

- **File:** `app/frontend/src/components/NoteCard.tsx`, line 15
- **Pattern:** `<Link to={\`/notes/${record.filename}\`}>`
- **Test:** Click a note card, verify URL is `/notes/{filename}` and editor loads

**3d. NotesDashboard → New Note**

- **File:** `app/frontend/src/pages/NotesDashboard.tsx`, line 75
- **Pattern:** `<Link to="/notes/new">`
- **Test:** Click "+ New Note", verify goes to NoteIntake

**3e. Overview → Recent Records**

- **File:** `app/frontend/src/pages/Overview.tsx`, line 278
- **Pattern:** `linkTo={\`/${type}/${record.filename}\`}`
- **Test:** For each recent record card, click and verify editor loads
  - Covers all 8 types, each should navigate to correct editor

**3f. Overview → Accession**

- **File:** `app/frontend/src/pages/Overview.tsx`, line 152
- **Pattern:** `navigate('/notes')` (after bulk import)
- **Test:** Bulk import a folder, verify "View Notes" link goes to `/notes` dashboard

**3g. Backlinks (Referencing By section)**

- **File:** `app/frontend/src/components/RecordEditor.tsx`, line 141
- **Pattern:** `<Link to={\`/${b.type}/${b.filename}\`}>`
- **Test:** Edit a record with backlinks, click referenced-by link, verify target editor loads

---

### Phase 4: Navigation Behavior (Delete & Save) (30 min)

**4a. Editor Delete**

- **File:** `app/frontend/src/components/RecordEditor.tsx`, lines 86–90
- **Pattern:**
  ```typescript
  const handleDelete = async () => {
    if (!confirm('Move this record to Trash?')) return;
    await api.remove(filename);
    navigate(`/${type}`);
  };
  ```
- **For each record type, test:**
  - Edit a record
  - Click Delete
  - Confirm deletion
  - Verify redirected to `/{type}` dashboard (e.g., `/cap` for CAP)
  - Verify record removed from list

**4b. Editor Save**

- **File:** `app/frontend/src/components/RecordEditor.tsx`, lines 59–84
- **Pattern:** No navigate after save, just shows "Saved" status (line 129–132)
- **For each record type, test:**
  - Edit a record
  - Make a change
  - Click Save
  - Verify "Saved" confirmation message appears
  - Verify NOT redirected (stays on editor page)
  - Verify can edit again without reloading

**4c. Intake Save**

- **File:** `pages/{Type}Intake.tsx`, `handleSave` functions
- **Pattern:** `navigate(\`/{type}/${created.filename}\`)`
- **For each of 8 types + notes, test:**
  - Go to `/{type}/new` intake
  - Fill in required fields
  - Click Save
  - Verify redirected to `/{type}/{filename}` editor
  - Verify new record appears in that editor with all saved data
  - For notes, verify saved to `/notes/{filename}`

---

### Phase 5: Promote Button Verification (20 min)

**File:** `app/frontend/src/pages/NoteEditor.tsx`, lines 10–18, 103–111

- **PROMOTE_TARGETS array:** Verify 7 entries (sop, cap, incident, change, audit, training, meeting)
- **For each of 7 buttons:**
  - Click "Promote to {Type}" button while editing a note
  - Verify navigated to `/{type}/new` intake
  - Verify state contains note's `body` as `rawText`
  - Verify state contains note's `title` field
  - Verify intake form pre-populated with extracted fields
  - Verify can edit and save as new record

**Boundary case:** Verify promoting an empty note still works (no error)

---

### Phase 6: Intake Form Pre-population (15 min)

When arriving at intake with state (promote or file drop), verify form pre-fills correctly.

**File:** `app/frontend/src/components/RecordIntake.tsx`, lines 28–41, 69–74

**Test for each scenario:**

1. **Direct intake (no state):**
   - Go to `/sop/new` directly
   - Verify raw-text box is empty
   - Verify form fields are empty or default values

2. **Promote from note:**
   - Edit a note with body text
   - Click "Promote to CAP"
   - Verify raw-text box contains note's body
   - Verify "Extract" button auto-runs (form pre-fills)
   - Verify title field shows note's title

3. **File drop from Overview:**
   - Drag text file to Overview accession panel
   - Click "UPLOAD"
   - Verify NoteIntake has raw-text filled
   - Verify title shows filename (without extension)
   - Verify folder shows dropped folder name
   - Verify extraction auto-runs

4. **Manual text paste in Overview:**
   - Paste text in Overview accession textarea
   - Click "UPLOAD"
   - Verify NoteIntake receives rawText in state
   - Verify no folder set (field left empty)

---

### Phase 7: Cross-Type Cycle Tests (30 min)

Create a test matrix: for each of 8 record types, verify the complete cycle.

| Record Type | Intake URL | New State | Save→URL | Delete→URL |
|-------------|-----------|-----------|----------|-----------|
| SOP | `/sop/new` | rawText, title | `/sop/{id}` | `/sop` |
| CAP | `/cap/new` | rawText, title | `/cap/{id}` | `/cap` |
| Incident | `/incident/new` | rawText, title | `/incident/{id}` | `/incident` |
| Change | `/change/new` | rawText, title | `/change/{id}` | `/change` |
| Audit | `/audit/new` | rawText, title | `/audit/{id}` | `/audit` |
| Training | `/training/new` | rawText, title | `/training/{id}` | `/training` |
| Meeting | `/meeting/new` | rawText, title | `/meeting/{id}` | `/meeting` |
| Note | `/notes/new` | rawText, title, folder | `/notes/{id}` | `/notes` |

**Test each row:**
1. Go to Intake URL
2. Fill minimal form (title + body)
3. Save
4. Verify redirected to Save→URL
5. Click Delete
6. Verify redirected to Delete→URL
7. Verify record no longer in dashboard list

---

### Phase 8: State Serialization & Type Safety (20 min)

Verify state objects are correctly typed and don't lose data through navigation.

**Files:**
- `Intake.tsx`, `CapIntake.tsx`, etc. (state extraction)
- `RecordIntake.tsx` (state consumption)
- `NoteIntake.tsx` (with folder field)
- `NoteEditor.tsx` (promote state creation)

**Checks:**
1. Type assertions on `location.state` are safe (use `as { ... }` correctly)
2. No state properties are lost in transition
3. Non-existent properties don't break form (e.g., missing `folder` for non-note types)
4. Large body text (multi-MB notes) passes through without truncation or corruption
5. Special characters in `title` don't break URL routing

**Test case:** Save a record with special characters in title, promote it to another type, verify title preserves characters.

---

## Execution Steps

1. **Before testing:** Run the app (`npm run dev` or equivalent)
2. **Create test record:** In each type, create 2–3 test records with varied content
3. **Run Phase 1–2:** Code review (no running needed)
4. **Run Phases 3–7:** Manual testing in browser, log results in a test spreadsheet
5. **Run Phase 8:** Spot checks on edge cases
6. **Summary:** Create a navigation-matrix doc (CSV or table) showing all 8 types + notes

---

## Potential Issues to Watch For

1. **Typo in type slug:** E.g., `/sop/new` but route expects `sops` or vice versa
2. **Missing state in typed intakes:** Some intake pages might not extract `location.state` correctly
3. **Filename URL encoding:** Special chars in filenames might not round-trip through URL params
4. **Promote state loss:** Passing state through navigate might fail if payload is too large
5. **Delete target mismatch:** Delete might go to wrong dashboard (e.g., incident delete goes to `/sop`)
6. **Backlink formatting:** Backlink rendering might have wrong type or filename
7. **Batch actions:** Bulk folder import creates notes but doesn't show navigation feedback

---

## Verification Output

### Deliverable 1: Navigation Route Matrix
Create a table mapping:
- Route pattern
- Component/page
- Entry state (if any)
- Exit target on save/delete

### Deliverable 2: State Flow Diagram
Sequence diagram or table showing:
- Source component
- State object shape
- Target component
- Validation that all fields are present

### Deliverable 3: Test Results Checklist
Mark each phase ✓ or ✗, note any failures and their fixes.

### Deliverable 4: Regression Test Scenarios (Optional)
Write 3–5 Playwright or Jest test cases covering critical paths:
- Promote note → save as CAP → verify URL and data
- Upload file to Overview → verify folder field in note
- Delete from editor → verify dashboard update
- Edit and save → verify "Saved" message, no redirect

---

## Success Criteria

- All 8 record types + notes follow same intake→editor→dashboard pattern ✓
- State passing works for all promote buttons ✓
- Delete always redirects to correct `/{type}` dashboard ✓
- Save in editor shows "Saved" confirmation, does NOT redirect ✓
- Intake save redirects to correct editor with created filename ✓
- All card links point to correct editors ✓
- No broken links or 404s in the navigation flow ✓
- State is not lost or corrupted in transitions ✓

---

## Related Files (for reference)

**Routing & App Shell:**
- `app/frontend/src/App.tsx` – routes, wrapper components

**Intakes (generic & typed):**
- `app/frontend/src/pages/Intake.tsx`
- `app/frontend/src/pages/CapIntake.tsx`
- `app/frontend/src/pages/IncidentIntake.tsx`
- `app/frontend/src/pages/ChangeIntake.tsx`
- `app/frontend/src/pages/AuditIntake.tsx`
- `app/frontend/src/pages/TrainingIntake.tsx`
- `app/frontend/src/pages/MeetingIntake.tsx`
- `app/frontend/src/pages/NoteIntake.tsx`
- `app/frontend/src/components/RecordIntake.tsx` (shared component)

**Editors (typed & shared):**
- `app/frontend/src/pages/SopEditor.tsx`
- `app/frontend/src/pages/CapEditor.tsx`
- `app/frontend/src/pages/IncidentEditor.tsx`
- `app/frontend/src/pages/ChangeEditor.tsx`
- `app/frontend/src/pages/AuditEditor.tsx`
- `app/frontend/src/pages/TrainingEditor.tsx`
- `app/frontend/src/pages/MeetingEditor.tsx`
- `app/frontend/src/pages/NoteEditor.tsx`
- `app/frontend/src/components/RecordEditor.tsx` (shared component)

**Dashboards:**
- `app/frontend/src/pages/Dashboard.tsx` (SOP only)
- `app/frontend/src/pages/CapDashboard.tsx`
- `app/frontend/src/pages/IncidentDashboard.tsx`
- `app/frontend/src/pages/ChangeDashboard.tsx`
- `app/frontend/src/pages/AuditDashboard.tsx`
- `app/frontend/src/pages/TrainingDashboard.tsx`
- `app/frontend/src/pages/MeetingDashboard.tsx`
- `app/frontend/src/pages/NotesDashboard.tsx`
- `app/frontend/src/components/RecordDashboard.tsx` (shared component)

**Cards & Overview:**
- `app/frontend/src/components/RecordCard.tsx`
- `app/frontend/src/components/NoteCard.tsx`
- `app/frontend/src/pages/Overview.tsx`

---

## Notes

- **Ponytail:** No over-engineering needed here; navigation patterns are already DRY (one RecordIntake, one RecordEditor for all types). Focus is verification, not refactoring.
- **State object scope:** React Router's navigate state is session-only (dies on page refresh), which is fine for intakes but means testing must use continuous flow (no F5 refresh mid-test).
- **Missing Intake Test:** One intake is not type-specific (Intake.tsx for SOP). Verify it uses same RecordIntake component and follows same state pattern as CAP/etc.
